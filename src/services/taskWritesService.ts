import { arrayUnion, collection, deleteField, doc, increment, runTransaction, updateDoc, writeBatch, type DocumentReference, type Transaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TaskComment, UserTask } from '../types/tasks';
import {
    buildNewTaskDocument,
    buildRepeatTaskDocument,
    buildTaskChanges,
    canMarkDone,
    contributionOf,
    hasTaskChanges,
    nextRepeatOf,
    type ProjectContribution,
    type TaskActor,
    type TaskFormValues,
    assigneeUserIdsOf,
} from '../utils/taskWrites';
import { deleteFromStorage } from './storageService';
import { taskDocument } from './tasksService';

export type TaskWriteFailure = 'notFound' | 'notOpen' | 'notDone' | 'needsApproval' | 'projectNotFound';

export class TaskWriteError extends Error {
    readonly reason: TaskWriteFailure;

    constructor(reason: TaskWriteFailure) {
        super(`Task write rejected: ${reason}`);
        this.reason = reason;
    }
}

const rawTaskReference = (taskId: string) => doc(db, 'user_tasks', taskId);
const rawProjectReference = (projectId: string) => doc(db, 'task_projects', projectId);

const readTask = async (transaction: Transaction, taskId: string): Promise<UserTask> => {
    const snapshot = await transaction.get(taskDocument(taskId));
    if (!snapshot.exists()) throw new TaskWriteError('notFound');
    return snapshot.data();
};

const readExistingProject = async (transaction: Transaction, projectId: string | null): Promise<DocumentReference | null> => {
    if (!projectId) return null;
    const projectReference = rawProjectReference(projectId);
    const snapshot = await transaction.get(projectReference);
    return snapshot.exists() ? projectReference : null;
};

const adjustProject = (transaction: Transaction, projectReference: DocumentReference | null, change: Partial<ProjectContribution>) => {
    if (!projectReference) return;
    const counters = Object.entries(change).filter(([, amount]) => amount !== 0);
    if (counters.length === 0) return;
    transaction.update(projectReference, Object.fromEntries(counters.map(([counter, amount]) => [counter, increment(amount)])));
};

const negate = (contribution: ProjectContribution): ProjectContribution => ({
    taskCount: -contribution.taskCount,
    doneCount: -contribution.doneCount,
    openMinutes: -contribution.openMinutes,
});

export const createTask = async (values: TaskFormValues, actor: TaskActor, comments: TaskComment[] = []): Promise<string> => {
    const newTaskReference = doc(collection(db, 'user_tasks'));
    const newTaskDocument = buildNewTaskDocument(values, actor, new Date().toISOString(), comments);
    if (!values.projectId) {
        const batch = writeBatch(db);
        batch.set(newTaskReference, newTaskDocument);
        await batch.commit();
        return newTaskReference.id;
    }
    const projectId = values.projectId;
    await runTransaction(db, async (transaction) => {
        const projectReference = await readExistingProject(transaction, projectId);
        if (!projectReference) throw new TaskWriteError('projectNotFound');
        transaction.set(newTaskReference, newTaskDocument);
        adjustProject(transaction, projectReference, contributionOf(newTaskDocument));
    });
    return newTaskReference.id;
};

export const updateTask = (taskId: string, values: TaskFormValues): Promise<void> =>
    runTransaction(db, async (transaction) => {
        const task = await readTask(transaction, taskId);
        const changes = buildTaskChanges(task, values);
        if (!hasTaskChanges(changes)) return;
        const shouldAdjustMinutes = !changes.isProjectChanged && changes.durationDelta !== 0 && task.status === 'open';
        const currentProjectReference = shouldAdjustMinutes || changes.isProjectChanged ? await readExistingProject(transaction, task.projectId) : null;
        const nextProjectReference = changes.isProjectChanged ? await readExistingProject(transaction, values.projectId) : null;
        if (changes.isProjectChanged && values.projectId && !nextProjectReference) throw new TaskWriteError('projectNotFound');

        const assigneeFields = changes.assignees
            ? { assignees: changes.assignees, assigneeUserIds: assigneeUserIdsOf(changes.assignees), assigneeUserId: deleteField(), assigneeUserName: deleteField() }
            : {};
        transaction.update(rawTaskReference(taskId), { ...changes.fields, ...assigneeFields });
        if (shouldAdjustMinutes) adjustProject(transaction, currentProjectReference, { openMinutes: changes.durationDelta });
        if (changes.isProjectChanged) {
            adjustProject(transaction, currentProjectReference, negate(contributionOf(task)));
            adjustProject(transaction, nextProjectReference, contributionOf({ status: task.status, durationMinutes: values.durationMinutes }));
        }
    });

export interface CompleteTaskResult {
    repeatTaskId: string | null;
}

export const completeTask = (taskId: string, actor: TaskActor): Promise<CompleteTaskResult> =>
    runTransaction(db, async (transaction) => {
        const task = await readTask(transaction, taskId);
        if (task.status !== 'open') throw new TaskWriteError('notOpen');
        if (!canMarkDone(task)) throw new TaskWriteError('needsApproval');
        const projectReference = await readExistingProject(transaction, task.projectId);
        const now = new Date();

        const nextRepeat = nextRepeatOf(task.repeat);
        const repeatTaskReference = nextRepeat ? doc(collection(db, 'user_tasks')) : null;
        const repeatContribution = nextRepeat ? contributionOf({ status: 'open', durationMinutes: task.durationMinutes }) : null;

        transaction.update(rawTaskReference(taskId), { status: 'done', doneAt: now.toISOString(), doneByUserId: actor.userId });
        if (repeatTaskReference && nextRepeat) transaction.set(repeatTaskReference, buildRepeatTaskDocument(task, nextRepeat, now, now.toISOString()));
        adjustProject(transaction, projectReference, {
            taskCount: repeatContribution?.taskCount ?? 0,
            doneCount: 1,
            openMinutes: -task.durationMinutes + (repeatContribution?.openMinutes ?? 0),
        });
        return { repeatTaskId: repeatTaskReference?.id ?? null };
    });

export const undoCompleteTask = (taskId: string, repeatTaskId: string | null): Promise<void> =>
    runTransaction(db, async (transaction) => {
        const task = await readTask(transaction, taskId);
        if (task.status !== 'done') throw new TaskWriteError('notDone');
        const projectReference = await readExistingProject(transaction, task.projectId);
        const repeatSnapshot = repeatTaskId ? await transaction.get(taskDocument(repeatTaskId)) : null;
        const repeatTask = repeatSnapshot?.exists() ? repeatSnapshot.data() : null;

        const removedRepeat = repeatTask && repeatTask.projectId === task.projectId ? contributionOf(repeatTask) : null;

        transaction.update(rawTaskReference(taskId), { status: 'open', doneAt: null, doneByUserId: null });
        if (repeatTask) transaction.delete(rawTaskReference(repeatTask.id));
        adjustProject(transaction, projectReference, {
            taskCount: -(removedRepeat?.taskCount ?? 0),
            doneCount: -1 - (removedRepeat?.doneCount ?? 0),
            openMinutes: task.durationMinutes - (removedRepeat?.openMinutes ?? 0),
        });
    });

export const deleteTask = async (taskId: string): Promise<void> => {
    const attachmentPaths = await runTransaction(db, async (transaction) => {
        const task = await readTask(transaction, taskId);
        const projectReference = await readExistingProject(transaction, task.projectId);
        transaction.delete(rawTaskReference(taskId));
        adjustProject(transaction, projectReference, negate(contributionOf(task)));
        return task.attachments.map((attachment) => attachment.path).filter(Boolean);
    });
    await Promise.allSettled(attachmentPaths.map(deleteFromStorage));
};

export const addTaskComment = (taskId: string, comment: TaskComment): Promise<void> => updateDoc(rawTaskReference(taskId), { comments: arrayUnion(comment) });

import { collection, doc, getDocsFromServer, query, runTransaction, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TaskAssignee, TaskProjectStatus } from '../types/tasks';
import {
    buildInitialProjectTaskDocument,
    buildNewProjectDocument,
    buildProjectChanges,
    chunkList,
    cleanInitialProjectTasks,
    doneAtAfterStatusChange,
    UNLINK_BATCH_SIZE,
    type InitialProjectTask,
    type ProjectFormValues,
} from '../utils/projectWrites';
import { DEFAULT_DURATION_MINUTES, type TaskActor } from '../utils/taskWrites';
import { projectDocument } from './projectsService';

export type ProjectWriteFailure = 'notFound';

export class ProjectWriteError extends Error {
    readonly reason: ProjectWriteFailure;

    constructor(reason: ProjectWriteFailure) {
        super(`Project write rejected: ${reason}`);
        this.reason = reason;
    }
}

const rawProjectReference = (projectId: string) => doc(db, 'task_projects', projectId);

export const createProject = async (values: ProjectFormValues, actor: TaskActor, initialTasks: InitialProjectTask[]): Promise<string> => {
    const defaultAssignee: TaskAssignee = values.owner ?? { userId: actor.userId, userName: actor.userName };
    const tasks = cleanInitialProjectTasks(initialTasks, defaultAssignee);
    const nowIso = new Date().toISOString();
    const projectReference = doc(collection(db, 'task_projects'));
    const batch = writeBatch(db);
    batch.set(projectReference, buildNewProjectDocument(values, actor, nowIso, tasks.length, tasks.length * DEFAULT_DURATION_MINUTES));
    const projectSummary = { id: projectReference.id, title: values.title.trim() };
    tasks.forEach((initialTask) => batch.set(doc(collection(db, 'user_tasks')), buildInitialProjectTaskDocument(initialTask, projectSummary, actor, nowIso)));
    await batch.commit();
    return projectReference.id;
};

export const updateProject = (projectId: string, values: ProjectFormValues): Promise<void> =>
    runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(projectDocument(projectId));
        if (!snapshot.exists()) throw new ProjectWriteError('notFound');
        const changes = buildProjectChanges(snapshot.data(), values, new Date().toISOString());
        if (Object.keys(changes).length > 0) transaction.update(rawProjectReference(projectId), changes);
    });

export const changeProjectStatus = (projectId: string, nextStatus: TaskProjectStatus): Promise<void> =>
    runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(projectDocument(projectId));
        if (!snapshot.exists()) throw new ProjectWriteError('notFound');
        const project = snapshot.data();
        if (project.status === nextStatus) return;
        transaction.update(rawProjectReference(projectId), {
            status: nextStatus,
            doneAt: doneAtAfterStatusChange(project.status, nextStatus, project.doneAt, new Date().toISOString()),
        });
    });

export const deleteProject = async (projectId: string): Promise<void> => {
    const projectTasks = await getDocsFromServer(query(collection(db, 'user_tasks'), where('projectId', '==', projectId)));
    const taskChunks = chunkList(projectTasks.docs, UNLINK_BATCH_SIZE);
    if (taskChunks.length === 0) {
        const batch = writeBatch(db);
        batch.delete(rawProjectReference(projectId));
        await batch.commit();
        return;
    }
    await taskChunks.reduce<Promise<void>>(
        (previous, taskChunk, chunkIndex) =>
            previous.then(() => {
                const batch = writeBatch(db);
                taskChunk.forEach((taskDoc) => batch.update(taskDoc.ref, { projectId: null, projectTitle: null }));
                if (chunkIndex === taskChunks.length - 1) batch.delete(rawProjectReference(projectId));
                return batch.commit();
            }),
        Promise.resolve(),
    );
};

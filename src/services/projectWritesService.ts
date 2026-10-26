import { collection, doc, getDocsFromServer, query, runTransaction, where, writeBatch, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TaskAssignee, TaskProjectStatus } from '../types/tasks';
import {
    buildInitialProjectTaskDocument,
    buildNewProjectDocument,
    buildProjectChanges,
    cleanInitialProjectTasks,
    doneAtAfterStatusChange,
    UNLINK_BATCH_SIZE,
    type InitialProjectTask,
    type ProjectFormValues,
} from '../utils/projectWrites';
import { chunkList } from '../utils/chunkList';
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

const unlinkTasksInBatches = (taskDocs: QueryDocumentSnapshot[], projectIdToDelete: string | null): Promise<void> => {
    const taskChunks = chunkList(taskDocs, UNLINK_BATCH_SIZE);
    if (taskChunks.length === 0) {
        if (!projectIdToDelete) return Promise.resolve();
        const batch = writeBatch(db);
        batch.delete(rawProjectReference(projectIdToDelete));
        return batch.commit();
    }
    return taskChunks.reduce<Promise<void>>(
        (previous, taskChunk, chunkIndex) =>
            previous.then(() => {
                const batch = writeBatch(db);
                taskChunk.forEach((taskDoc) => batch.update(taskDoc.ref, { projectId: null, projectTitle: null }));
                if (projectIdToDelete && chunkIndex === taskChunks.length - 1) batch.delete(rawProjectReference(projectIdToDelete));
                return batch.commit();
            }),
        Promise.resolve(),
    );
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const projectTasksQuery = query(collection(db, 'user_tasks'), where('projectId', '==', projectId));
    const projectTasks = await getDocsFromServer(projectTasksQuery);
    await unlinkTasksInBatches(projectTasks.docs, projectId);
    await getDocsFromServer(projectTasksQuery)
        .then((latecomers) => unlinkTasksInBatches(latecomers.docs, null))
        .catch((error: unknown) => console.error('Project deleted, but unlinking late tasks failed:', error));
};

import { collection, doc, onSnapshot, type DocumentData, type FirestoreDataConverter } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { RepeatFrequency, TaskComment, TaskProject, TaskProjectColor, TaskProjectStatus } from '../types/tasks';
import { isDocId } from './firestore';

const PROJECT_COLORS: TaskProjectColor[] = ['blue', 'green', 'amber', 'purple', 'pink', 'teal', 'olive'];
const PROJECT_STATUSES: TaskProjectStatus[] = ['active', 'done', 'archived'];

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');
const asNullableText = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);
const asCount = (value: unknown): number => (Number.isFinite(Number(value)) ? Number(value) : 0);

const normalizeProject = (id: string, data: DocumentData): TaskProject => ({
    id,
    title: asText(data.title),
    description: asText(data.description),
    ownerUserId: asText(data.ownerUserId),
    ownerUserName: asText(data.ownerUserName),
    teamId: asNullableText(data.teamId),
    startDate: asText(data.startDate),
    dueDate: asText(data.dueDate),
    repeat: typeof data.repeat === 'string' ? (data.repeat as RepeatFrequency) : null,
    color: PROJECT_COLORS.includes(data.color) ? (data.color as TaskProjectColor) : null,
    status: PROJECT_STATUSES.includes(data.status) ? (data.status as TaskProjectStatus) : 'active',
    taskCount: asCount(data.taskCount),
    doneCount: asCount(data.doneCount),
    openMinutes: asCount(data.openMinutes),
    comments: Array.isArray(data.comments) ? (data.comments as TaskComment[]) : [],
    doneAt: asNullableText(data.doneAt),
    createdByUserId: asText(data.createdByUserId),
    createdAt: asText(data.createdAt),
});

const projectConverter: FirestoreDataConverter<TaskProject> = {
    toFirestore: () => {
        throw new Error('task_projects writes are not implemented in this converter');
    },
    fromFirestore: (snapshot) => normalizeProject(snapshot.id, snapshot.data()),
};

export const taskProjects = () => collection(db, 'task_projects').withConverter(projectConverter);

export const projectDocument = (projectId: string) => doc(taskProjects(), projectId);

export interface ProjectsUpdate {
    projects: TaskProject[];
    isFromCache: boolean;
}

export const subscribeProjects = (onUpdate: (update: ProjectsUpdate) => void, onError: (error: unknown) => void): (() => void) =>
    onSnapshot(taskProjects(), (snapshot) => onUpdate({ projects: snapshot.docs.map((projectDoc) => projectDoc.data()), isFromCache: snapshot.metadata.fromCache }), onError);

export const subscribeProject = (projectId: string, onData: (project: TaskProject | null) => void, onError: (error: unknown) => void): (() => void) => {
    if (!isDocId(projectId)) {
        onData(null);
        return () => undefined;
    }
    return onSnapshot(
        projectDocument(projectId),
        (snapshot) => {
            if (!snapshot.exists() && snapshot.metadata.fromCache) return;
            onData(snapshot.exists() ? snapshot.data() : null);
        },
        onError,
    );
};

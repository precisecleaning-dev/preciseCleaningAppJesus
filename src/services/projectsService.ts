import { collection, doc, documentId, onSnapshot, query, where, type DocumentData, type FirestoreDataConverter, type Query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { chunkList } from '../utils/chunkList';
import { asNullableText, asText } from '../utils/firestoreValues';
import type { ProjectScope, RepeatFrequency, TaskComment, TaskProject, TaskProjectColor, TaskProjectStatus } from '../types/tasks';
import { FIRESTORE_IN_LIMIT, isDocId, subscribeMerged } from './firestore';

const PROJECT_COLORS: TaskProjectColor[] = ['blue', 'green', 'amber', 'purple', 'pink', 'teal', 'olive'];
const PROJECT_STATUSES: TaskProjectStatus[] = ['active', 'done', 'archived'];

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

// A project has no member list: "related" means owner, creator, the person's team, or a project holding one of their open tasks.
const projectQueriesFor = (scope: ProjectScope): Query<TaskProject>[] => {
    if (scope.kind === 'all') return [taskProjects()];
    const { userId, teamKeys, taskProjectIds } = scope;
    const queries = [query(taskProjects(), where('ownerUserId', '==', userId)), query(taskProjects(), where('createdByUserId', '==', userId))];
    if (teamKeys.length > 0) queries.push(query(taskProjects(), where('teamId', 'in', teamKeys.slice(0, FIRESTORE_IN_LIMIT))));
    chunkList([...new Set(taskProjectIds.filter(isDocId))], FIRESTORE_IN_LIMIT).forEach((projectIds) => queries.push(query(taskProjects(), where(documentId(), 'in', projectIds))));
    return queries;
};

export const subscribeProjects = (scope: ProjectScope, onUpdate: (update: ProjectsUpdate) => void, onError: (error: unknown) => void): (() => void) =>
    subscribeMerged(projectQueriesFor(scope), ({ rows, isFromCache }) => onUpdate({ projects: rows, isFromCache }), onError);

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

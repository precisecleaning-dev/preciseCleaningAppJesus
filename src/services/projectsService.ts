import { collection, doc, documentId, onSnapshot, query, where, type DocumentData, type FirestoreDataConverter, type Query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { chunkList } from '../utils/chunkList';
import { asFiniteNumber, asNullableText, asText } from '../utils/firestoreValues';
import { asRepeatFrequency, asTaskComments } from '../utils/taskValues';
import type { ProjectScope, TaskProject, TaskProjectColor, TaskProjectStatus } from '../types/tasks';
import { FIRESTORE_IN_LIMIT, isDocId, subscribeMerged } from './firestore';

const PROJECT_COLORS: TaskProjectColor[] = ['blue', 'green', 'amber', 'purple', 'pink', 'teal', 'olive'];
const PROJECT_STATUSES: TaskProjectStatus[] = ['active', 'done', 'archived'];

const normalizeProject = (id: string, data: DocumentData): TaskProject => ({
    id,
    title: asText(data.title),
    description: asText(data.description),
    ownerUserId: asText(data.ownerUserId),
    ownerUserName: asText(data.ownerUserName),
    teamId: asNullableText(data.teamId),
    startDate: asText(data.startDate),
    dueDate: asText(data.dueDate),
    repeat: asRepeatFrequency(data.repeat),
    color: PROJECT_COLORS.find((color) => color === data.color) ?? null,
    status: PROJECT_STATUSES.find((status) => status === data.status) ?? 'active',
    taskCount: asFiniteNumber(data.taskCount),
    doneCount: asFiniteNumber(data.doneCount),
    openMinutes: asFiniteNumber(data.openMinutes),
    comments: asTaskComments(data.comments),
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

import { collection, doc, getDocFromServer, onSnapshot, query, where, type DocumentData, type FirestoreDataConverter, type Query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { asFiniteNumber, asNullableText, asText } from '../utils/firestoreValues';
import { asRepeat, asTaskApproval, asTaskAssignees, asTaskAttachments, asTaskComments } from '../utils/taskValues';
import type { TaskAssignee, TaskFilter, UserTask } from '../types/tasks';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { isDocId, subscribeMerged } from './firestore';

const normalizeAssignees = (data: DocumentData): TaskAssignee[] => {
    if (Array.isArray(data.assignees)) return asTaskAssignees(data.assignees);
    if (typeof data.assigneeUserId === 'string' && data.assigneeUserId) return [{ userId: data.assigneeUserId, userName: asText(data.assigneeUserName) }];
    return [];
};

const normalizeTask = (id: string, data: DocumentData): UserTask => ({
    id,
    title: asText(data.title),
    assignees: normalizeAssignees(data),
    dueDate: asText(data.dueDate),
    dueTime: asText(data.dueTime),
    durationMinutes: asFiniteNumber(data.durationMinutes),
    priorityId: asNullableText(data.priorityId),
    projectId: asNullableText(data.projectId),
    projectTitle: asNullableText(data.projectTitle),
    repeat: asRepeat(data.repeat),
    approval: asTaskApproval(data.approval),
    status: data.status === 'done' ? 'done' : 'open',
    doneAt: asNullableText(data.doneAt),
    doneByUserId: asNullableText(data.doneByUserId),
    comments: asTaskComments(data.comments),
    attachments: asTaskAttachments(data.attachments),
    createdByUserId: asText(data.createdByUserId),
    createdByUserName: asText(data.createdByUserName),
    createdAt: asText(data.createdAt),
});

const taskConverter: FirestoreDataConverter<UserTask> = {
    toFirestore: () => {
        throw new Error('user_tasks writes are not implemented in this converter');
    },
    fromFirestore: (snapshot) => normalizeTask(snapshot.id, snapshot.data()),
};

const userTasks = () => collection(db, 'user_tasks').withConverter(taskConverter);

export interface OpenTasksUpdate {
    tasks: UserTask[];
    isFromCache: boolean;
}

const openTaskQueriesFor = (filter: TaskFilter): Query<UserTask>[] => {
    const isOpen = where('status', '==', 'open');
    if (filter.kind === 'assignedTo') {
        return [query(userTasks(), where('assigneeUserIds', 'array-contains', filter.userId), isOpen), query(userTasks(), where('assigneeUserId', '==', filter.userId), isOpen)];
    }
    if (filter.kind === 'createdBy') return [query(userTasks(), where('createdByUserId', '==', filter.userId), isOpen)];
    if (filter.kind === 'project') {
        const inProject = where('projectId', '==', filter.projectId);
        if (!filter.restrictToUserId) return [query(userTasks(), inProject, isOpen)];
        return [
            query(userTasks(), inProject, isOpen, where('assigneeUserIds', 'array-contains', filter.restrictToUserId)),
            query(userTasks(), inProject, isOpen, where('createdByUserId', '==', filter.restrictToUserId)),
        ];
    }
    return [query(userTasks(), isOpen)];
};

const isAssignedOnlyTo = (task: UserTask, userId: string) => task.assignees.length === 1 && task.assignees[0].userId === userId;

export const subscribeOpenTasks = (filter: TaskFilter, onUpdate: (update: OpenTasksUpdate) => void, onError: (error: unknown) => void): (() => void) =>
    subscribeMerged(
        openTaskQueriesFor(filter),
        ({ rows, isFromCache }) => onUpdate({ tasks: rows.filter((task) => filter.kind !== 'createdBy' || !isAssignedOnlyTo(task, filter.userId)), isFromCache }),
        onError,
    );

// Same query as the web (useApprovalQueue): equalities only, no composite index. Tasks that are no
// longer open are dropped here instead of adding a third filter.
export const subscribeTasksToApprove = (userId: string, onUpdate: (update: OpenTasksUpdate) => void, onError: (error: unknown) => void): (() => void) =>
    subscribeMerged(
        [query(userTasks(), where('approval.approverUserId', '==', userId), where('approval.status', '==', 'pending'))],
        ({ rows, isFromCache }) => onUpdate({ tasks: rows.filter((task) => task.status === 'open'), isFromCache }),
        onError,
    );

export const taskDocument = (taskId: string) => doc(userTasks(), taskId);

export const subscribeTask = (taskId: string, onData: (task: UserTask | null) => void, onError: (error: unknown) => void): (() => void) => {
    if (!isDocId(taskId)) {
        onData(null);
        return () => undefined;
    }
    return onSnapshot(
        taskDocument(taskId),
        (snapshot) => {
            if (!snapshot.exists() && snapshot.metadata.fromCache) return;
            onData(snapshot.exists() ? snapshot.data() : null);
        },
        onError,
    );
};

const readTaskListTabOrder = async (): Promise<unknown> => {
    const snapshot = await getDocFromServer(doc(db, 'app_settings', 'task_list_tabs'));
    return snapshot.get('tabOrder') ?? null;
};

export const loadTaskListTabOrder = () => cached('task_list_tabs', CONFIG_TTL, readTaskListTabOrder);

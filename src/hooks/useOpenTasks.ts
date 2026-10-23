import { useEffect, useState } from 'react';
import { useOnline } from '../context/NetworkContext';
import { subscribeOpenTasks, type OpenTasksUpdate } from '../services/tasksService';
import type { TaskFilter, UserTask } from '../types/tasks';
import type { LoadStatus } from './useTaskAccess';

interface OpenTasksState {
    status: LoadStatus;
    tasks: UserTask[];
    retry: () => void;
}

export const taskFilterKey = (filter: TaskFilter): string => {
    if (filter.kind === 'everyone') return 'everyone';
    if (filter.kind === 'project') return `project:${filter.projectId}:${filter.restrictToUserId ?? ''}`;
    return `${filter.kind}:${filter.userId}`;
};

const primaryIdOf = (filter: TaskFilter): string => {
    if (filter.kind === 'everyone') return '';
    return filter.kind === 'project' ? filter.projectId : filter.userId;
};

const filterFromParts = (kind: TaskFilter['kind'], primaryId: string, restrictToUserId: string): TaskFilter => {
    if (kind === 'assignedTo') return { kind, userId: primaryId, userName: '' };
    if (kind === 'createdBy') return { kind, userId: primaryId };
    if (kind === 'project') return { kind, projectId: primaryId, restrictToUserId: restrictToUserId || null };
    return { kind: 'everyone' };
};

export const useOpenTasks = (filter: TaskFilter, isEnabled: boolean): OpenTasksState => {
    const isOnline = useOnline();
    const filterKind = filter.kind;
    const filterPrimaryId = primaryIdOf(filter);
    const filterRestrictToUserId = filter.kind === 'project' ? (filter.restrictToUserId ?? '') : '';
    const filterKey = taskFilterKey(filter);
    const [subscriptionKey, setSubscriptionKey] = useState(0);
    const [latestUpdate, setLatestUpdate] = useState<{ filterKey: string; update: OpenTasksUpdate } | null>(null);
    const [failedSubscription, setFailedSubscription] = useState<string | null>(null);
    const subscriptionId = `${filterKey}#${subscriptionKey}`;

    useEffect(() => {
        if (!isEnabled) return;
        const effectFilter = filterFromParts(filterKind, filterPrimaryId, filterRestrictToUserId);
        const effectFilterKey = taskFilterKey(effectFilter);
        return subscribeOpenTasks(
            effectFilter,
            (update) => setLatestUpdate({ filterKey: effectFilterKey, update }),
            (error: unknown) => {
                console.error('Error loading open tasks:', error);
                setFailedSubscription(`${effectFilterKey}#${subscriptionKey}`);
            },
        );
    }, [filterKind, filterPrimaryId, filterRestrictToUserId, isEnabled, subscriptionKey]);

    const hasFailed = failedSubscription === subscriptionId;
    const currentUpdate = latestUpdate?.filterKey === filterKey ? latestUpdate.update : null;
    const tasks = currentUpdate?.tasks ?? [];
    const isOfflineAndEmpty = !isOnline && tasks.length === 0 && (currentUpdate === null || currentUpdate.isFromCache);

    let status: LoadStatus = 'ready';
    if (hasFailed) status = isOnline ? 'error' : 'offline';
    else if (isOfflineAndEmpty) status = 'offline';
    else if (currentUpdate === null) status = 'loading';

    return { status, tasks, retry: () => setSubscriptionKey((key) => key + 1) };
};

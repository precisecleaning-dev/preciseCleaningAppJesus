import { useEffect, useState } from 'react';
import { useOnline } from '../context/NetworkContext';
import { subscribeTask } from '../services/tasksService';
import type { UserTask } from '../types/tasks';

export type TaskLoadStatus = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

interface TaskState {
    status: TaskLoadStatus;
    task: UserTask | null;
    retry: () => void;
}

export const useTask = (taskId: string): TaskState => {
    const isOnline = useOnline();
    const [subscriptionKey, setSubscriptionKey] = useState(0);
    const [loaded, setLoaded] = useState<{ taskId: string; task: UserTask | null } | null>(null);
    const [failedSubscription, setFailedSubscription] = useState<string | null>(null);
    const subscriptionId = `${taskId}#${subscriptionKey}`;

    useEffect(
        () =>
            subscribeTask(
                taskId,
                (task) => setLoaded({ taskId, task }),
                (error: unknown) => {
                    console.error('Error loading task:', error);
                    setFailedSubscription(`${taskId}#${subscriptionKey}`);
                },
            ),
        [taskId, subscriptionKey],
    );

    const current = loaded?.taskId === taskId ? loaded : null;
    let status: TaskLoadStatus = 'ready';
    if (failedSubscription === subscriptionId) status = isOnline ? 'error' : 'offline';
    else if (!current) status = isOnline ? 'loading' : 'offline';
    else if (!current.task) status = 'notFound';

    return { status, task: current?.task ?? null, retry: () => setSubscriptionKey((key) => key + 1) };
};

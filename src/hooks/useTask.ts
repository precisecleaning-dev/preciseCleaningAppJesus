import { subscribeTask } from '../services/tasksService';
import type { UserTask } from '../types/tasks';
import { useLiveSubscription } from './useLiveSubscription';

export type TaskLoadStatus = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

interface TaskState {
    status: TaskLoadStatus;
    task: UserTask | null;
    retry: () => void;
}

export const useTask = (taskId: string): TaskState => {
    const { status, value, retry } = useLiveSubscription<UserTask | null>({
        key: `task:${taskId}`,
        isEnabled: true,
        subscribe: (onData, onError) => subscribeTask(taskId, (task) => onData(task, false), onError),
        description: 'task',
    });
    return { status: status === 'ready' && !value ? 'notFound' : status, task: value ?? null, retry };
};

import { subscribeOpenTasks } from '../services/tasksService';
import type { LoadStatus } from '../types';
import type { TaskFilter, UserTask } from '../types/tasks';
import { useLiveSubscription } from './useLiveSubscription';

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

export const useOpenTasks = (filter: TaskFilter, isEnabled: boolean): OpenTasksState => {
    const { status, value, retry } = useLiveSubscription<UserTask[]>({
        key: `openTasks:${taskFilterKey(filter)}`,
        isEnabled,
        subscribe: (onData, onError) => subscribeOpenTasks(filter, ({ tasks, isFromCache }) => onData(tasks, isFromCache), onError),
        isEmpty: (tasks) => tasks.length === 0,
        description: 'open tasks',
    });
    return { status, tasks: value ?? [], retry };
};

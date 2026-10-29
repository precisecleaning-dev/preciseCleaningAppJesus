import { subscribeTasksToApprove } from '../services/tasksService';
import type { UserTask } from '../types/tasks';
import { useLiveSubscription } from './useLiveSubscription';

/** Open tasks waiting for this person's OK. The ones they are assigned to already come with "My tasks". */
export const useTasksToApprove = (userId: string, isEnabled: boolean) => {
    const { status, value, hasFailed, retry } = useLiveSubscription<UserTask[]>({
        key: `tasksToApprove:${userId}`,
        isEnabled,
        subscribe: (onData, onError) => subscribeTasksToApprove(userId, ({ tasks, isFromCache }) => onData(tasks, isFromCache), onError),
        isEmpty: (tasks) => tasks.length === 0,
        description: 'tasks to approve',
    });
    const tasksToApprove = (value ?? []).filter((task) => !task.assignees.some((assignee) => assignee.userId === userId));
    return { status, tasksToApprove, hasFailed: isEnabled && hasFailed, retry };
};

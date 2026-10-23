import { t } from '../constants/strings';
import type { UserTask } from '../types/tasks';
import { formatDate, formatTime } from './dateFormat';

export const timeOfDueTime = (dueTime: string): Date | null => {
    const [hours, minutes] = dueTime.split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return new Date(2000, 0, 1, hours, minutes);
};

export const formatDueTime = (dueTime: string): string => {
    const time = timeOfDueTime(dueTime);
    return time ? formatTime(time) : '';
};

export const dueLabelOf = (task: Pick<UserTask, 'dueDate' | 'dueTime'>): string =>
    task.dueDate ? [formatDate(task.dueDate), formatDueTime(task.dueTime)].filter(Boolean).join(' · ') : t.noDate;

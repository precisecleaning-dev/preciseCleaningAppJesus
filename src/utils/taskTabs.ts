import type { TaskListTabId, UserTask, YmdDate } from '../types/tasks';
import { weekStartOf } from './dateFormat';

export type OpenTaskTabId = Exclude<TaskListTabId, 'done'>;

export const FACTORY_TAB_ORDER: TaskListTabId[] = ['all', 'overdue', 'daily', 'approval', 'week', 'later', 'nodate', 'done'];

const OPEN_TAB_IDS: OpenTaskTabId[] = ['all', 'overdue', 'daily', 'approval', 'week', 'later', 'nodate'];

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

export const toLocalYmd = (date: Date): YmdDate => `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

const isOpenTabId = (value: unknown): value is OpenTaskTabId => OPEN_TAB_IDS.includes(value as OpenTaskTabId);

export const normalizeTabOrder = (storedOrder: unknown): OpenTaskTabId[] => {
    const requestedOrder = Array.isArray(storedOrder) ? storedOrder : FACTORY_TAB_ORDER;
    const knownTabs = [...new Set(requestedOrder.filter(isOpenTabId))];
    const missingTabs = OPEN_TAB_IDS.filter((tabId) => !knownTabs.includes(tabId));
    return ['all', ...[...knownTabs, ...missingTabs].filter((tabId) => tabId !== 'all')];
};

export const isRepeatingDaily = (task: UserTask): boolean => !!task.repeat && task.repeat.freq !== 'monthly';

export const needsApproval = (task: UserTask): boolean => !!task.approval && task.approval.status !== 'approved';

const endOfWeekYmd = (now: Date): YmdDate => {
    const sunday = new Date(weekStartOf(now.getTime()));
    sunday.setDate(sunday.getDate() + 6);
    return toLocalYmd(sunday);
};

const dateTabOf = (task: UserTask, todayYmd: YmdDate, sundayYmd: YmdDate): OpenTaskTabId | null => {
    if (!task.dueDate) return isRepeatingDaily(task) ? 'daily' : 'nodate';
    if (task.dueDate < todayYmd) return 'overdue';
    if (task.dueDate === todayYmd) return 'daily';
    if (isRepeatingDaily(task)) return null;
    return task.dueDate <= sundayYmd ? 'week' : 'later';
};

const byNewestFirst = (first: UserTask, second: UserTask) => second.createdAt.localeCompare(first.createdAt);

export const groupTasksByTab = (tasks: UserTask[], now: Date): Record<OpenTaskTabId, UserTask[]> => {
    const todayYmd = toLocalYmd(now);
    const sundayYmd = endOfWeekYmd(now);
    const groups: Record<OpenTaskTabId, UserTask[]> = { all: [], overdue: [], daily: [], approval: [], week: [], later: [], nodate: [] };

    tasks.forEach((task) => {
        groups.all.push(task);
        if (needsApproval(task)) groups.approval.push(task);
        const dateTab = dateTabOf(task, todayYmd, sundayYmd);
        if (dateTab) groups[dateTab].push(task);
    });

    OPEN_TAB_IDS.forEach((tabId) => groups[tabId].sort(byNewestFirst));
    return groups;
};

export const isTaskOverdue = (task: UserTask, now: Date): boolean => !!task.dueDate && task.dueDate < toLocalYmd(now);

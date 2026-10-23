import type { IsoDateTime, Repeat, TaskAssignee, TaskComment, TaskListPermissions, UserTask, YmdDate } from '../types/tasks';
import { toLocalYmd } from './taskTabs';

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_COMMENT_MAX_LENGTH = 2000;
export const DEFAULT_DURATION_MINUTES = 30;

export interface TaskFormValues {
    title: string;
    assignees: TaskAssignee[];
    dueDate: YmdDate;
    dueTime: string;
    durationMinutes: number;
    priorityId: string | null;
    projectId: string | null;
    projectTitle: string | null;
}

export type TaskFormErrorField = 'title' | 'assignees' | 'durationMinutes' | 'dueTime';

export type TaskFormErrorReason = 'titleRequired' | 'titleTooLong' | 'assigneesRequired' | 'durationInvalid' | 'dueTimeInvalid' | 'dueTimeWithoutDate';

export type TaskFormErrors = Partial<Record<TaskFormErrorField, TaskFormErrorReason>>;

export interface TaskActor {
    userId: string;
    userName: string;
}

export interface ProjectContribution {
    taskCount: number;
    doneCount: number;
    openMinutes: number;
}

const DUE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const emptyTaskFormValues = (assignee: TaskAssignee): TaskFormValues => ({
    title: '',
    assignees: [assignee],
    dueDate: '',
    dueTime: '',
    durationMinutes: DEFAULT_DURATION_MINUTES,
    priorityId: null,
    projectId: null,
    projectTitle: null,
});

export const formValuesOf = (task: UserTask): TaskFormValues => ({
    title: task.title,
    assignees: task.assignees,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    durationMinutes: task.durationMinutes,
    priorityId: task.priorityId,
    projectId: task.projectId,
    projectTitle: task.projectTitle,
});

export const validateTaskForm = (values: TaskFormValues): TaskFormErrors => {
    const errors: TaskFormErrors = {};
    const title = values.title.trim();
    if (!title) errors.title = 'titleRequired';
    else if (title.length > TASK_TITLE_MAX_LENGTH) errors.title = 'titleTooLong';
    if (values.assignees.length === 0) errors.assignees = 'assigneesRequired';
    if (!Number.isInteger(values.durationMinutes) || values.durationMinutes < 0) errors.durationMinutes = 'durationInvalid';
    if (values.dueTime && !DUE_TIME_PATTERN.test(values.dueTime)) errors.dueTime = 'dueTimeInvalid';
    else if (values.dueTime && !values.dueDate) errors.dueTime = 'dueTimeWithoutDate';
    return errors;
};

export const hasFormErrors = (errors: TaskFormErrors): boolean => Object.keys(errors).length > 0;

export const assigneeUserIdsOf = (assignees: TaskAssignee[]): string[] => assignees.map((assignee) => assignee.userId);

const sameAssignees = (first: TaskAssignee[], second: TaskAssignee[]): boolean =>
    first.length === second.length && first.every((assignee, index) => assignee.userId === second[index].userId && assignee.userName === second[index].userName);

export const buildNewTaskDocument = (values: TaskFormValues, actor: TaskActor, nowIso: IsoDateTime, comments: TaskComment[] = []) => ({
    title: values.title.trim(),
    assignees: values.assignees,
    assigneeUserIds: assigneeUserIdsOf(values.assignees),
    dueDate: values.dueDate,
    dueTime: values.dueTime,
    durationMinutes: values.durationMinutes,
    priorityId: values.priorityId,
    projectId: values.projectId,
    projectTitle: values.projectId ? values.projectTitle : null,
    repeat: null,
    approval: null,
    status: 'open' as const,
    doneAt: null,
    doneByUserId: null,
    comments,
    attachments: [],
    createdByUserId: actor.userId,
    createdByUserName: actor.userName,
    createdAt: nowIso,
});

export interface TaskChanges {
    fields: Partial<Pick<UserTask, 'title' | 'dueDate' | 'dueTime' | 'durationMinutes' | 'priorityId' | 'projectId' | 'projectTitle'>>;
    assignees: TaskAssignee[] | null;
    durationDelta: number;
    isProjectChanged: boolean;
}

export const buildTaskChanges = (original: UserTask, values: TaskFormValues): TaskChanges => {
    const fields: TaskChanges['fields'] = {};
    const title = values.title.trim();
    if (title !== original.title) fields.title = title;
    if (values.dueDate !== original.dueDate) fields.dueDate = values.dueDate;
    if (values.dueTime !== original.dueTime) fields.dueTime = values.dueTime;
    if (values.durationMinutes !== original.durationMinutes) fields.durationMinutes = values.durationMinutes;
    if (values.priorityId !== original.priorityId) fields.priorityId = values.priorityId;
    const isProjectChanged = values.projectId !== original.projectId;
    if (isProjectChanged) {
        fields.projectId = values.projectId;
        fields.projectTitle = values.projectId ? values.projectTitle : null;
    }
    return {
        fields,
        assignees: sameAssignees(values.assignees, original.assignees) ? null : values.assignees,
        durationDelta: values.durationMinutes - original.durationMinutes,
        isProjectChanged,
    };
};

export const hasTaskChanges = (changes: TaskChanges): boolean => Object.keys(changes.fields).length > 0 || changes.assignees !== null;

export const contributionOf = (task: Pick<UserTask, 'status' | 'durationMinutes'>): ProjectContribution => ({
    taskCount: 1,
    doneCount: task.status === 'done' ? 1 : 0,
    openMinutes: task.status === 'open' ? task.durationMinutes : 0,
});

export const canMarkDone = (task: UserTask): boolean => !task.approval || task.approval.status === 'approved';

const ymdToNoon = (ymd: YmdDate): Date | null => {
    const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : null;
};

const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);

const lastDayOfMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

const firstDayAfter = (base: Date, isWanted: (date: Date) => boolean): Date => {
    for (let offset = 1; offset <= 7; offset += 1) {
        const candidate = addDays(base, offset);
        if (isWanted(candidate)) return candidate;
    }
    return addDays(base, 7);
};

const monthlyCandidate = (year: number, month: number, dayOfMonth: number): Date => new Date(year, month, Math.min(dayOfMonth, lastDayOfMonth(year, month)), 12);

export const nextOccurrence = (dueDate: YmdDate, repeat: Repeat, today: Date): YmdDate => {
    const dueNoon = ymdToNoon(dueDate);
    const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const base = dueNoon && dueNoon > todayNoon ? dueNoon : todayNoon;
    const reference = dueNoon ?? base;

    if (repeat.freq === 'daily') return toLocalYmd(addDays(base, 1));
    if (repeat.freq === 'weekdays') return toLocalYmd(firstDayAfter(base, (date) => date.getDay() >= 1 && date.getDay() <= 5));
    if (repeat.freq === 'weekly') {
        const wantedDays = repeat.days && repeat.days.length > 0 ? repeat.days : [reference.getDay()];
        return toLocalYmd(firstDayAfter(base, (date) => wantedDays.includes(date.getDay())));
    }
    const dayOfMonth = reference.getDate();
    const thisMonth = monthlyCandidate(base.getFullYear(), base.getMonth(), dayOfMonth);
    return toLocalYmd(thisMonth > base ? thisMonth : monthlyCandidate(base.getFullYear(), base.getMonth() + 1, dayOfMonth));
};

export const nextRepeatOf = (repeat: Repeat | null): Repeat | null => {
    if (!repeat) return null;
    if (typeof repeat.timesLeft !== 'number') return repeat;
    if (repeat.timesLeft <= 1) return null;
    return { ...repeat, timesLeft: repeat.timesLeft - 1 };
};

export const buildRepeatTaskDocument = (task: UserTask, nextRepeat: Repeat, today: Date, nowIso: IsoDateTime) => ({
    title: task.title,
    assignees: task.assignees,
    assigneeUserIds: assigneeUserIdsOf(task.assignees),
    dueDate: nextOccurrence(task.dueDate, task.repeat ?? nextRepeat, today),
    dueTime: task.dueTime,
    durationMinutes: task.durationMinutes,
    priorityId: task.priorityId,
    projectId: task.projectId,
    projectTitle: task.projectTitle,
    repeat: nextRepeat,
    approval: task.approval
        ? {
              status: 'draft' as const,
              approverUserId: task.approval.approverUserId,
              approverUserName: task.approval.approverUserName,
              requestedByUserId: null,
              requestedAt: null,
              decidedAt: null,
              note: '',
          }
        : null,
    status: 'open' as const,
    doneAt: null,
    doneByUserId: null,
    comments: [],
    attachments: [],
    createdByUserId: task.createdByUserId,
    createdByUserName: task.createdByUserName,
    createdAt: nowIso,
});

export const buildTaskComment = (text: string, actor: TaskActor, nowIso: IsoDateTime): TaskComment => ({
    userId: actor.userId,
    userName: actor.userName,
    text: text.trim(),
    createdAt: nowIso,
});

export interface TaskActions {
    canComplete: boolean;
    canReopen: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canComment: boolean;
    canAddAttachments: boolean;
    canRemoveAttachments: boolean;
}

export const taskActionsFor = (task: UserTask, permissions: TaskListPermissions | null, userId: string): TaskActions => {
    if (!permissions?.canView)
        return { canComplete: false, canReopen: false, canEdit: false, canDelete: false, canComment: false, canAddAttachments: false, canRemoveAttachments: false };
    const isInvolved = task.assignees.some((assignee) => assignee.userId === userId) || task.createdByUserId === userId || permissions.canEdit;
    return {
        canComplete: isInvolved && task.status === 'open',
        canReopen: isInvolved && task.status === 'done',
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
        canComment: true,
        canAddAttachments: true,
        canRemoveAttachments: permissions.canEdit,
    };
};

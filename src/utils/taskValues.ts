import type { Repeat, RepeatFrequency, TaskAssignee, TaskAttachment, TaskComment, UserTaskApproval, UserTaskApprovalStatus } from '../types/tasks';
import { asNullableText, asText, isRecord } from './firestoreValues';

// Pure readers for the nested values of user_tasks / task_projects. Anything that can't be shown safely
// is dropped instead of crashing the screen.

const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const asTaskComments = (value: unknown): TaskComment[] =>
    listOf(value)
        .filter(isRecord)
        .map((comment) => ({ userId: asText(comment.userId), userName: asText(comment.userName), text: asText(comment.text), createdAt: asText(comment.createdAt) }));

export const asTaskAssignees = (value: unknown): TaskAssignee[] =>
    listOf(value)
        .filter(isRecord)
        .filter((assignee) => asText(assignee.userId) !== '')
        .map((assignee) => ({ userId: asText(assignee.userId), userName: asText(assignee.userName) }));

const isTaskAttachment = (value: unknown): value is TaskAttachment =>
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    typeof value.path === 'string' &&
    typeof value.type === 'string' &&
    typeof value.size === 'number';

/** Kept as the exact stored objects: removing one with arrayRemove needs the identical object (contract §7). */
export const asTaskAttachments = (value: unknown): TaskAttachment[] => listOf(value).filter(isTaskAttachment);

const APPROVAL_STATUSES: UserTaskApprovalStatus[] = ['draft', 'pending', 'approved', 'changes_requested'];

const asApprovalStatus = (status: unknown): UserTaskApprovalStatus => {
    if (status === 'changes') return 'changes_requested';
    // Unknown status: treated as "still needs the OK" so the task can't be completed by mistake.
    return APPROVAL_STATUSES.find((knownStatus) => knownStatus === status) ?? 'draft';
};

/** Unknown fields are kept: the approval is written back from what was read. */
export const asTaskApproval = (value: unknown): UserTaskApproval | null => {
    if (!isRecord(value)) return null;
    return {
        ...value,
        status: asApprovalStatus(value.status),
        approverUserId: asText(value.approverUserId),
        approverUserName: asText(value.approverUserName),
        requestedByUserId: asNullableText(value.requestedByUserId),
        requestedAt: asNullableText(value.requestedAt),
        decidedAt: asNullableText(value.decidedAt),
        note: asText(value.note),
    };
};

const REPEAT_FREQUENCIES: RepeatFrequency[] = ['daily', 'weekdays', 'weekly', 'monthly'];

export const asRepeatFrequency = (value: unknown): RepeatFrequency | null => REPEAT_FREQUENCIES.find((frequency) => frequency === value) ?? null;

const isWeekDay = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;

/** A repetition we can't understand is ignored (no next task is generated) instead of guessing. */
export const asRepeat = (value: unknown): Repeat | null => {
    if (!isRecord(value)) return null;
    const freq = asRepeatFrequency(value.freq);
    if (!freq) return null;
    // timesLeft stays absent when it was absent (written back as-is); a value we can't read means "always".
    const { timesLeft, ...rest } = value;
    const readableTimesLeft = typeof timesLeft === 'number' && Number.isFinite(timesLeft) ? { timesLeft } : timesLeft === undefined ? {} : { timesLeft: null };
    return { ...rest, freq, ...(Array.isArray(value.days) ? { days: value.days.filter(isWeekDay) } : {}), ...readableTimesLeft };
};

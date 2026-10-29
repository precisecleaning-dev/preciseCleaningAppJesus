import type { ApprovalDecision, IsoDateTime, TaskComment, UserTask } from '../types/tasks';

// Comment texts are data shared with the web (userTasksService.ts there): writing and reading them
// lives here so both stay identical.
const SENT_PREFIX = 'Sent for approval to ';
const APPROVED_TEXT = 'Approved.';
const CHANGES_TEXT = 'Asked for changes.';
const CHANGES_PREFIX = 'Asked for changes: ';

export const approvalRequestCommentText = (approverName: string): string => `${SENT_PREFIX}${approverName}.`;

export const approvalDecisionCommentText = (decision: ApprovalDecision, note: string): string => {
    if (decision === 'approved') return APPROVED_TEXT;
    return note.trim() ? `${CHANGES_PREFIX}${note.trim()}` : CHANGES_TEXT;
};

export type ApprovalEventKind = 'sent' | 'changes' | 'approved';

export interface ApprovalEvent {
    key: string;
    kind: ApprovalEventKind;
    authorUserId: string;
    authorName: string;
    at: IsoDateTime | null;
    /** Who it was sent to ('sent' only). */
    approverName: string;
    /** What has to change ('changes' only). */
    note: string;
}

const eventFromComment = (comment: TaskComment, index: number): ApprovalEvent | null => {
    const base = { key: `${comment.createdAt}-${index}`, authorUserId: comment.userId, authorName: comment.userName, at: comment.createdAt, approverName: '', note: '' };
    const text = comment.text.trim();
    if (text.startsWith(SENT_PREFIX) && text.endsWith('.')) return { ...base, kind: 'sent', approverName: text.slice(SENT_PREFIX.length, -1) };
    if (text === APPROVED_TEXT) return { ...base, kind: 'approved' };
    if (text === CHANGES_TEXT) return { ...base, kind: 'changes' };
    if (text.startsWith(CHANGES_PREFIX)) return { ...base, kind: 'changes', note: text.slice(CHANGES_PREFIX.length) };
    return null;
};

/**
 * Rounds of the approval, oldest first, read from the task comments. If the current change request
 * has no comment (older data), it is added from `approval.note` so it is never lost.
 */
export const approvalHistoryOf = (task: Pick<UserTask, 'approval' | 'comments'>): ApprovalEvent[] => {
    if (!task.approval) return [];
    const events = task.comments.flatMap((comment, index) => eventFromComment(comment, index) ?? []);
    const { approval } = task;
    const lastEvent = events[events.length - 1];
    if (approval.status === 'changes_requested' && lastEvent?.kind !== 'changes') {
        events.push({
            key: 'current-changes',
            kind: 'changes',
            authorUserId: approval.approverUserId,
            authorName: approval.approverUserName,
            at: approval.decidedAt,
            approverName: '',
            note: approval.note,
        });
    }
    return events;
};

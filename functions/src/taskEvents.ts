// Pure rules: which change in a user_tasks document deserves an email, and to whom.
// The document shape is the one in tasks-contract.md (written by the web and the mobile app).

export interface TaskAssigneeDoc {
    userId?: string;
    userName?: string;
}

export interface TaskApprovalDoc {
    status?: string;
    approverUserId?: string;
    approverUserName?: string;
    requestedByUserId?: string | null;
    requestedAt?: string | null;
    decidedAt?: string | null;
    note?: string;
}

export interface TaskDoc {
    title?: string;
    status?: string;
    assignees?: TaskAssigneeDoc[];
    assigneeUserIds?: string[];
    /** Old format: a single person. */
    assigneeUserId?: string;
    dueDate?: string;
    dueTime?: string;
    projectTitle?: string | null;
    createdByUserId?: string;
    createdByUserName?: string;
    approval?: TaskApprovalDoc | null;
    /** Set on the task a repetition creates when the previous one is completed. */
    repeatOfTaskId?: string | null;
}

const isFilledText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** Everyone assigned, in any of the formats the task may have (new list, ids array or old single field). */
export const assigneeIdsOf = (task: TaskDoc): string[] => {
    const ids = [...(task.assigneeUserIds ?? []), ...(task.assignees ?? []).map((assignee) => assignee.userId), task.assigneeUserId];
    return [...new Set(ids.filter(isFilledText))];
};

/**
 * People who were just assigned to an open task: everyone on a new task, or the ones added on an edit.
 * The creator is never notified (they did it), and neither are the tasks a repetition generates.
 */
export const newlyAssignedUserIds = (before: TaskDoc | null, after: TaskDoc | null): string[] => {
    if (!after || after.status !== 'open') return [];
    if (!before && isFilledText(after.repeatOfTaskId)) return [];
    const previousIds = new Set(before ? assigneeIdsOf(before) : []);
    return assigneeIdsOf(after).filter((userId) => !previousIds.has(userId) && userId !== after.createdByUserId);
};

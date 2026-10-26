export type YmdDate = string;
export type IsoDateTime = string;

export type UserTaskStatus = 'open' | 'done';

export type RepeatFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Repeat {
    freq: RepeatFrequency;
    days?: number[];
    timesLeft?: number | null;
}

export type UserTaskApprovalStatus = 'draft' | 'pending' | 'approved' | 'changes_requested';

export interface UserTaskApproval {
    status: UserTaskApprovalStatus;
    approverUserId: string;
    approverUserName: string;
    requestedByUserId: string | null;
    requestedAt: IsoDateTime | null;
    decidedAt: IsoDateTime | null;
    note: string;
}

export interface TaskAttachment {
    name: string;
    url: string;
    path: string;
    type: string;
    size: number;
}

export interface TaskComment {
    userId: string;
    userName: string;
    text: string;
    createdAt: IsoDateTime;
}

export interface TaskAssignee {
    userId: string;
    userName: string;
}

export interface UserTask {
    id: string;
    title: string;
    assignees: TaskAssignee[];
    dueDate: YmdDate;
    dueTime: string;
    durationMinutes: number;
    priorityId: string | null;
    projectId: string | null;
    projectTitle: string | null;
    repeat: Repeat | null;
    approval: UserTaskApproval | null;
    status: UserTaskStatus;
    doneAt: IsoDateTime | null;
    doneByUserId: string | null;
    comments: TaskComment[];
    attachments: TaskAttachment[];
    createdByUserId: string;
    createdByUserName: string;
    createdAt: IsoDateTime;
}

export interface TaskListPermissions {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isOwnScope: boolean;
}

export type TaskListTabId = 'overdue' | 'daily' | 'approval' | 'week' | 'later' | 'nodate' | 'all' | 'done';

export interface TaskListTabsSettings {
    tabOrder: TaskListTabId[];
    updatedAt: IsoDateTime;
    updatedByUserId: string;
    updatedByUserName: string;
}

export type TaskFilter =
    | { kind: 'assignedTo'; userId: string; userName: string }
    | { kind: 'createdBy'; userId: string }
    | { kind: 'everyone' }
    | { kind: 'project'; projectId: string; restrictToUserId: string | null };

export interface AssignableUser {
    userId: string;
    userName: string;
}

export type TaskProjectStatus = 'active' | 'done' | 'archived';

export type TaskProjectColor = 'blue' | 'green' | 'amber' | 'purple' | 'pink' | 'teal' | 'olive';

export interface TaskProject {
    id: string;
    title: string;
    description: string;
    ownerUserId: string;
    ownerUserName: string;
    teamId: string | null;
    startDate: YmdDate;
    dueDate: YmdDate;
    repeat: RepeatFrequency | null;
    color: TaskProjectColor | null;
    status: TaskProjectStatus;
    taskCount: number;
    doneCount: number;
    openMinutes: number;
    comments: TaskComment[];
    doneAt: IsoDateTime | null;
    createdByUserId: string;
    createdAt: IsoDateTime;
}

export type ProjectPermissions = Omit<TaskListPermissions, 'isOwnScope'>;

import type { IsoDateTime, TaskAssignee, TaskProject, TaskProjectColor, TaskProjectStatus, YmdDate } from '../types/tasks';
import { buildNewTaskDocument, DEFAULT_DURATION_MINUTES, type TaskActor } from './taskWrites';

export const PROJECT_TITLE_MAX_LENGTH = 80;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 160;
export const MAX_TASKS_ON_PROJECT_CREATE = 50;
export const UNLINK_BATCH_SIZE = 450;

export interface ProjectFormValues {
    title: string;
    description: string;
    owner: TaskAssignee | null;
    teamId: string | null;
    startDate: YmdDate;
    dueDate: YmdDate;
    color: TaskProjectColor | null;
    status: TaskProjectStatus;
}

export type ProjectFormErrorField = 'title' | 'description' | 'owner' | 'dueDate' | 'tasks';

export type ProjectFormErrorReason = 'titleRequired' | 'titleTooLong' | 'descriptionTooLong' | 'ownerRequired' | 'dueBeforeStart' | 'tooManyTasks';

export type ProjectFormErrors = Partial<Record<ProjectFormErrorField, ProjectFormErrorReason>>;

export const emptyProjectFormValues = (owner: TaskAssignee): ProjectFormValues => ({
    title: '',
    description: '',
    owner,
    teamId: null,
    startDate: '',
    dueDate: '',
    color: null,
    status: 'active',
});

export const projectFormValuesOf = (project: TaskProject): ProjectFormValues => ({
    title: project.title,
    description: project.description,
    owner: project.ownerUserId ? { userId: project.ownerUserId, userName: project.ownerUserName } : null,
    teamId: project.teamId,
    startDate: project.startDate,
    dueDate: project.dueDate,
    color: project.color,
    status: project.status,
});

export interface InitialProjectTask {
    title: string;
    assignees: TaskAssignee[];
}

export const emptyInitialProjectTask = (): InitialProjectTask => ({ title: '', assignees: [] });

export const countInitialTasks = (initialTasks: InitialProjectTask[]): number => initialTasks.filter((initialTask) => initialTask.title.trim()).length;

export const cleanInitialProjectTasks = (initialTasks: InitialProjectTask[], defaultAssignee: TaskAssignee): InitialProjectTask[] =>
    initialTasks
        .map((initialTask) => ({ title: initialTask.title.trim(), assignees: initialTask.assignees.length > 0 ? initialTask.assignees : [defaultAssignee] }))
        .filter((initialTask) => initialTask.title);

export const validateProjectForm = (values: ProjectFormValues, initialTasks: InitialProjectTask[] = []): ProjectFormErrors => {
    const errors: ProjectFormErrors = {};
    const title = values.title.trim();
    if (!title) errors.title = 'titleRequired';
    else if (title.length > PROJECT_TITLE_MAX_LENGTH) errors.title = 'titleTooLong';
    if (values.description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH) errors.description = 'descriptionTooLong';
    if (!values.owner) errors.owner = 'ownerRequired';
    if (values.startDate && values.dueDate && values.dueDate < values.startDate) errors.dueDate = 'dueBeforeStart';
    if (countInitialTasks(initialTasks) > MAX_TASKS_ON_PROJECT_CREATE) errors.tasks = 'tooManyTasks';
    return errors;
};

export const doneAtAfterStatusChange = (
    previousStatus: TaskProjectStatus,
    nextStatus: TaskProjectStatus,
    previousDoneAt: IsoDateTime | null,
    nowIso: IsoDateTime,
): IsoDateTime | null => {
    if (nextStatus === 'done') return previousStatus === 'done' ? previousDoneAt : nowIso;
    return null;
};

const formFields = (values: ProjectFormValues) => ({
    title: values.title.trim(),
    description: values.description.trim(),
    ownerUserId: values.owner?.userId ?? '',
    ownerUserName: values.owner?.userName ?? '',
    teamId: values.teamId,
    startDate: values.startDate,
    dueDate: values.dueDate,
    color: values.color,
    status: values.status,
});

export const buildNewProjectDocument = (values: ProjectFormValues, actor: TaskActor, nowIso: IsoDateTime, taskCount: number, openMinutes: number) => ({
    ...formFields(values),
    repeat: null,
    taskCount,
    doneCount: 0,
    openMinutes,
    comments: [],
    doneAt: values.status === 'done' ? nowIso : null,
    createdByUserId: actor.userId,
    createdAt: nowIso,
});

export const buildInitialProjectTaskDocument = ({ title, assignees }: InitialProjectTask, project: { id: string; title: string }, actor: TaskActor, nowIso: IsoDateTime) =>
    buildNewTaskDocument(
        { title, assignees, dueDate: '', dueTime: '', durationMinutes: DEFAULT_DURATION_MINUTES, priorityId: null, projectId: project.id, projectTitle: project.title },
        actor,
        nowIso,
    );

export type ProjectChanges = Partial<ReturnType<typeof formFields> & { doneAt: IsoDateTime | null }>;

export const buildProjectChanges = (original: TaskProject, values: ProjectFormValues, nowIso: IsoDateTime): ProjectChanges => {
    const next = formFields(values);
    const changes: ProjectChanges = {};
    if (next.title !== original.title) changes.title = next.title;
    if (next.description !== original.description) changes.description = next.description;
    if (next.ownerUserId !== original.ownerUserId || next.ownerUserName !== original.ownerUserName) {
        changes.ownerUserId = next.ownerUserId;
        changes.ownerUserName = next.ownerUserName;
    }
    if (next.teamId !== original.teamId) changes.teamId = next.teamId;
    if (next.startDate !== original.startDate) changes.startDate = next.startDate;
    if (next.dueDate !== original.dueDate) changes.dueDate = next.dueDate;
    if (next.color !== original.color) changes.color = next.color;
    if (next.status !== original.status) {
        changes.status = next.status;
        changes.doneAt = doneAtAfterStatusChange(original.status, next.status, original.doneAt, nowIso);
    }
    return changes;
};

export const chunkList = <Item>(items: Item[], size: number): Item[][] => {
    const chunks: Item[][] = [];
    for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size));
    return chunks;
};

export const projectProgressOf = (project: Pick<TaskProject, 'taskCount' | 'doneCount'>): number =>
    project.taskCount > 0 ? Math.min(1, Math.max(0, project.doneCount / project.taskCount)) : 0;

export const formatOpenMinutes = (minutes: number): string => {
    if (minutes <= 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

import { t } from '../constants/strings';
import { projectColors, type AccentName } from '../theme/tokens';
import { toLocalYmd } from './taskTabs';
import type { TaskProject, TaskProjectColor, TaskProjectStatus } from '../types/tasks';

export const PROJECT_COLOR_IDS = Object.keys(projectColors) as TaskProjectColor[];

const autoColorOf = (projectId: string): TaskProjectColor => {
    const hash = [...projectId].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 2147483647, 7);
    return PROJECT_COLOR_IDS[hash % PROJECT_COLOR_IDS.length];
};

export const projectColorOf = (project: Pick<TaskProject, 'id' | 'color'>): string => projectColors[project.color ?? autoColorOf(project.id)];

export const PROJECT_STATUS_ACCENTS: Record<TaskProjectStatus, AccentName> = {
    active: 'violet',
    done: 'mint',
    archived: 'sky',
};

export const PROJECT_STATUS_LABELS: Record<TaskProjectStatus, string> = {
    active: t.projectStatusActive,
    done: t.projectStatusDone,
    archived: t.projectStatusArchived,
};

export const isProjectOverdue = (project: Pick<TaskProject, 'status' | 'dueDate'>, now: Date): boolean =>
    project.status === 'active' && !!project.dueDate && project.dueDate < toLocalYmd(now);

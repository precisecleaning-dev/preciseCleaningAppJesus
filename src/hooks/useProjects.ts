import { subscribeProject, subscribeProjects } from '../services/projectsService';
import type { TaskProject } from '../types/tasks';
import { useLiveSubscription } from './useLiveSubscription';

export const useProjects = (isEnabled: boolean) => {
    const { status, value, retry } = useLiveSubscription<TaskProject[]>({
        key: 'projects',
        isEnabled,
        subscribe: (onData, onError) => subscribeProjects(({ projects, isFromCache }) => onData(projects, isFromCache), onError),
        isEmpty: (projects) => projects.length === 0,
        description: 'projects',
    });
    return { status, projects: value ?? [], retry };
};

export type ProjectLoadStatus = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

export const useProject = (projectId: string) => {
    const { status, value, retry } = useLiveSubscription<TaskProject | null>({
        key: `project:${projectId}`,
        isEnabled: true,
        subscribe: (onData, onError) => subscribeProject(projectId, (project) => onData(project, false), onError),
        description: 'project',
    });
    const projectStatus: ProjectLoadStatus = status === 'ready' && !value ? 'notFound' : status;
    return { status: projectStatus, project: value ?? null, retry };
};

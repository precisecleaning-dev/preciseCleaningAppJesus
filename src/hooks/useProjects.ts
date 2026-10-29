import { useCatalogs } from '../context/CatalogsContext';
import { useCurrentUser } from '../context/SessionContext';
import { subscribeProject, subscribeProjects } from '../services/projectsService';
import type { LoadStatus } from '../types';
import type { ProjectScope, TaskProject, UserTask } from '../types/tasks';
import { fullName } from '../utils/ids';
import { teamKeysOf } from '../utils/relations';
import { useLiveSubscription } from './useLiveSubscription';
import { useOpenTasks } from './useOpenTasks';
import { useTaskAccess } from './useTaskAccess';

interface ProjectsState {
    status: LoadStatus;
    projects: TaskProject[];
    retry: () => void;
}

const projectScopeKey = (scope: ProjectScope): string => {
    if (scope.kind === 'all') return 'all';
    return `related:${scope.userId}:${scope.teamKeys.join('|')}:${[...scope.taskProjectIds].sort().join(',')}`;
};

const projectIdsOf = (tasks: UserTask[]): string[] => [...new Set(tasks.flatMap((task) => (task.projectId ? [task.projectId] : [])))];

// Scope "All" sees every project; scope "Own" only the related ones (owner, creator, team, or one of their open tasks).
export const useProjects = (isEnabled: boolean): ProjectsState => {
    const user = useCurrentUser();
    const { teams } = useCatalogs();
    const { permissions } = useTaskAccess();
    const isAllScope = permissions?.isOwnScope === false;
    const isOwnScope = permissions?.isOwnScope === true;
    const ownTasks = useOpenTasks({ kind: 'assignedTo', userId: user.id, userName: fullName(user) }, isEnabled && isOwnScope);
    const isScopeReady = isAllScope || (isOwnScope && ownTasks.status === 'ready');

    const scope: ProjectScope = isAllScope
        ? { kind: 'all' }
        : { kind: 'related', userId: user.id, teamKeys: teamKeysOf(user.teamId, teams), taskProjectIds: projectIdsOf(ownTasks.tasks) };
    const { status, value, retry } = useLiveSubscription<TaskProject[]>({
        key: `projects:${projectScopeKey(scope)}`,
        isEnabled: isEnabled && isScopeReady,
        subscribe: (onData, onError) => subscribeProjects(scope, ({ projects, isFromCache }) => onData(projects, isFromCache), onError),
        isEmpty: (projects) => projects.length === 0,
        description: 'projects',
    });

    if (isEnabled && isOwnScope && ownTasks.status !== 'ready') return { status: ownTasks.status, projects: [], retry: ownTasks.retry };
    if (isEnabled && !isScopeReady) return { status: 'loading', projects: [], retry };
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

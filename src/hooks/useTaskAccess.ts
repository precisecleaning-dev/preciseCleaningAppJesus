import { useSession } from '../context/SessionContext';
import type { LoadStatus } from '../types';
import type { ProjectPermissions, TaskListPermissions } from '../types/tasks';
import { projectPermissionsOf, taskListPermissionsOf } from '../utils/taskPermissions';

interface TaskAccess {
    status: Extract<LoadStatus, 'loading' | 'ready'>;
    permissions: TaskListPermissions | null;
    projectPermissions: ProjectPermissions | null;
    canViewTasks: boolean;
}

export const useTaskAccess = (): TaskAccess => {
    const { role, configLoaded } = useSession();
    if (!configLoaded) return { status: 'loading', permissions: null, projectPermissions: null, canViewTasks: false };
    const permissions = taskListPermissionsOf(role);
    return { status: 'ready', permissions, projectPermissions: projectPermissionsOf(role), canViewTasks: permissions.canView };
};

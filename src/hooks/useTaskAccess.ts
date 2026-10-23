import { useSession } from '../context/SessionContext';
import type { ProjectPermissions, TaskListPermissions } from '../types/tasks';
import { projectPermissionsOf, taskListPermissionsOf } from '../utils/taskPermissions';

export type LoadStatus = 'loading' | 'ready' | 'offline' | 'error';

interface TaskAccess {
    status: Extract<LoadStatus, 'loading' | 'ready'>;
    permissions: TaskListPermissions | null;
    projectPermissions: ProjectPermissions | null;
    canViewTasks: boolean;
}

export const useTaskAccess = (): TaskAccess => {
    const { role, isSuperAdmin, configLoaded } = useSession();
    if (!configLoaded) return { status: 'loading', permissions: null, projectPermissions: null, canViewTasks: false };
    const permissions = taskListPermissionsOf(role, isSuperAdmin);
    return { status: 'ready', permissions, projectPermissions: projectPermissionsOf(role, isSuperAdmin), canViewTasks: permissions.canView };
};

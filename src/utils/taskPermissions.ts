import type { Role } from '../types';
import type { ProjectPermissions, TaskListPermissions } from '../types/tasks';

const TASK_LIST_MODULE = 'Task List';
const PROJECTS_MODULE = 'Projects';

const NO_PERMISSIONS: TaskListPermissions = { isAdmin: false, canView: false, canAdd: false, canEdit: false, canDelete: false, isOwnScope: true };

const ALL_PERMISSIONS: TaskListPermissions = { isAdmin: true, canView: true, canAdd: true, canEdit: true, canDelete: true, isOwnScope: false };

export const taskListPermissionsOf = (role: Role | null, isSuperAdmin: boolean): TaskListPermissions => {
    if (isSuperAdmin) return ALL_PERMISSIONS;
    const taskList = role?.permissions?.find((permission) => permission.module === TASK_LIST_MODULE);
    if (!taskList) return NO_PERMISSIONS;
    return {
        isAdmin: false,
        canView: taskList.canView === true,
        canAdd: taskList.canAdd === true,
        canEdit: taskList.canEdit === true,
        canDelete: taskList.canDelete === true,
        isOwnScope: taskList.scope !== 'All',
    };
};

export const projectPermissionsOf = (role: Role | null, isSuperAdmin: boolean): ProjectPermissions => {
    if (isSuperAdmin) return { isAdmin: true, canView: true, canAdd: true, canEdit: true, canDelete: true };
    const projectsModule = role?.permissions?.find((permission) => permission.module === PROJECTS_MODULE);
    if (projectsModule) {
        return {
            isAdmin: false,
            canView: projectsModule.canView === true,
            canAdd: projectsModule.canAdd === true,
            canEdit: projectsModule.canEdit === true,
            canDelete: projectsModule.canDelete === true,
        };
    }
    const { isAdmin, canView, canAdd, canEdit, canDelete } = taskListPermissionsOf(role, isSuperAdmin);
    return { isAdmin, canView, canAdd, canEdit, canDelete };
};

import type { Role } from '../types';
import type { ProjectPermissions, TaskListPermissions } from '../types/tasks';

const TASK_LIST_MODULE = 'Task List';
const PROJECTS_MODULE = 'Projects';

const NO_PERMISSIONS: TaskListPermissions = { canView: false, canAdd: false, canEdit: false, canDelete: false, isOwnScope: true };

const modulePermissionOf = (role: Role | null, moduleName: string) => role?.permissions?.find((permission) => permission.module === moduleName);

export const taskListPermissionsOf = (role: Role | null): TaskListPermissions => {
    const taskList = modulePermissionOf(role, TASK_LIST_MODULE);
    if (!taskList) return NO_PERMISSIONS;
    return {
        canView: taskList.canView === true,
        canAdd: taskList.canAdd === true,
        canEdit: taskList.canEdit === true,
        canDelete: taskList.canDelete === true,
        isOwnScope: taskList.scope !== 'All',
    };
};

export const projectPermissionsOf = (role: Role | null): ProjectPermissions => {
    const projects = modulePermissionOf(role, PROJECTS_MODULE);
    if (projects) return { canView: projects.canView === true, canAdd: projects.canAdd === true, canEdit: projects.canEdit === true, canDelete: projects.canDelete === true };
    const { canView, canAdd, canEdit, canDelete } = taskListPermissionsOf(role);
    return { canView, canAdd, canEdit, canDelete };
};

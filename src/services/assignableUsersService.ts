import { getDocsFromServer, query, where } from 'firebase/firestore';
import type { Role, SystemUser } from '../types';
import type { AssignableUser } from '../types/tasks';
import { fullName } from '../utils/ids';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { taskListPermissionsOf } from '../utils/taskPermissions';
import { typedCollection } from './firestore';

const ASSIGNABLE_STATUSES: SystemUser['status'][] = ['Active', 'Pending Invite'];
const OWNER_MODULE = 'Owner';

const isOwnerRole = (role: Role): boolean => !!role.permissions?.some((permission) => permission.module === OWNER_MODULE && permission.canView === true);

const readAssignableUsers = async (): Promise<AssignableUser[]> => {
    const [usersSnapshot, rolesSnapshot] = await Promise.all([
        getDocsFromServer(query(typedCollection<SystemUser>('system_users'), where('status', 'in', ASSIGNABLE_STATUSES))),
        getDocsFromServer(typedCollection<Role>('settings_roles')),
    ]);
    const roles = rolesSnapshot.docs.map((roleDoc) => roleDoc.data());
    const roleIdsThatSeeTasks = new Set(roles.filter((role) => taskListPermissionsOf(role).canView).map((role) => role.id));
    const ownerRoleIds = new Set(roles.filter(isOwnerRole).map((role) => role.id));
    return usersSnapshot.docs
        .map((userDoc) => userDoc.data())
        .filter((systemUser) => roleIdsThatSeeTasks.has(systemUser.roleId))
        .map((systemUser) => ({ userId: systemUser.id, userName: fullName(systemUser) || systemUser.email, isOwner: ownerRoleIds.has(systemUser.roleId) }))
        .sort((first, second) => first.userName.localeCompare(second.userName));
};

export const loadAssignableUsers = () => cached('tasks:assignable_users', CONFIG_TTL, readAssignableUsers);

import { getDocsFromServer, query, where } from 'firebase/firestore';
import type { Role, SystemUser } from '../types';
import type { AssignableUser } from '../types/tasks';
import { fullName } from '../utils/ids';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { isAdministratorRole } from '../utils/roles';
import { taskListPermissionsOf } from '../utils/taskPermissions';
import { typedCollection } from './firestore';

const ASSIGNABLE_STATUSES: SystemUser['status'][] = ['Active', 'Pending Invite'];

const readAssignableUsers = async (): Promise<AssignableUser[]> => {
    const [usersSnapshot, rolesSnapshot] = await Promise.all([
        getDocsFromServer(query(typedCollection<SystemUser>('system_users'), where('status', 'in', ASSIGNABLE_STATUSES))),
        getDocsFromServer(typedCollection<Role>('settings_roles')),
    ]);
    const roleIdsThatSeeTasks = new Set(
        rolesSnapshot.docs
            .map((roleDoc) => roleDoc.data())
            .filter((role) => taskListPermissionsOf(role, isAdministratorRole(role)).canView)
            .map((role) => role.id),
    );
    return usersSnapshot.docs
        .map((userDoc) => userDoc.data())
        .filter((systemUser) => roleIdsThatSeeTasks.has(systemUser.roleId))
        .map((systemUser) => ({ userId: systemUser.id, userName: fullName(systemUser) || systemUser.email }))
        .sort((first, second) => first.userName.localeCompare(second.userName));
};

export const loadAssignableUsers = () => cached('tasks:assignable_users', CONFIG_TTL, readAssignableUsers);

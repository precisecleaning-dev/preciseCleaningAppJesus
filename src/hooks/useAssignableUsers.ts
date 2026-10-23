import { useState } from 'react';
import { useCurrentUser } from '../context/SessionContext';
import { loadAssignableUsers } from '../services/assignableUsersService';
import type { AssignableUser } from '../types/tasks';
import { fullName } from '../utils/ids';
import { useWhenOnline } from './useWhenOnline';

type AssignableUsersStatus = 'loading' | 'ready' | 'error';

export const useAssignableUsers = (isEnabled: boolean) => {
    const user = useCurrentUser();
    const [result, setResult] = useState<{ status: AssignableUsersStatus; users: AssignableUser[] }>({ status: 'loading', users: [] });

    const reload = () => {
        loadAssignableUsers()
            .then((users) => setResult({ status: 'ready', users }))
            .catch((error: unknown) => {
                console.error('Error loading assignable users:', error);
                setResult((current) => (current.status === 'ready' ? current : { status: 'error', users: [] }));
            });
    };

    useWhenOnline(reload, isEnabled);

    const currentUser: AssignableUser = { userId: user.id, userName: fullName(user) };
    const users = result.users.some((assignable) => assignable.userId === user.id) ? result.users : [currentUser, ...result.users];
    return { status: result.status, users, reload };
};

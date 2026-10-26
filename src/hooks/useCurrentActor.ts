import { useCurrentUser } from '../context/SessionContext';
import { fullName } from '../utils/ids';
import type { TaskActor } from '../utils/taskWrites';

export const useCurrentActor = (): TaskActor => {
    const user = useCurrentUser();
    return { userId: user.id, userName: fullName(user) };
};

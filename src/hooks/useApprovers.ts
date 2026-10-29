import { useCurrentUser } from '../context/SessionContext';
import { defaultApproverOf } from '../utils/taskWrites';
import { useAssignableUsers } from './useAssignableUsers';

/** People who can give the OK: the assignable ones minus oneself (same as the web). */
export const useApprovers = (isEnabled: boolean) => {
    const user = useCurrentUser();
    const { status, users } = useAssignableUsers(isEnabled);
    const approvers = users.filter((person) => person.userId !== user.id);
    return { status, approvers, defaultApprover: defaultApproverOf(approvers) };
};

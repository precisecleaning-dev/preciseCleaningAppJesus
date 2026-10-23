import { Alert } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useOnline } from '../context/NetworkContext';
import { useCurrentUser } from '../context/SessionContext';
import { changeProjectStatus, createProject, deleteProject, ProjectWriteError, updateProject } from '../services/projectWritesService';
import type { TaskProject, TaskProjectStatus } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { errorCode, fullName } from '../utils/ids';
import type { InitialProjectTask, ProjectFormValues } from '../utils/projectWrites';
import type { TaskActor } from '../utils/taskWrites';

const writeErrorMessage = (error: unknown): string => {
    if (error instanceof ProjectWriteError) return t.projectErrorNotFound;
    return fmt(t.projectSaveError, { code: errorCode(error) });
};

export const useProjectWriteActions = () => {
    const user = useCurrentUser();
    const isOnline = useOnline();
    const actor: TaskActor = { userId: user.id, userName: fullName(user) };

    const runWrite = <Result>(write: () => Promise<Result>): Promise<Result | null> => {
        if (!isOnline) {
            Alert.alert(t.tasksOfflineTitle, t.taskOfflineWrite);
            return Promise.resolve(null);
        }
        return write().catch((error: unknown) => {
            console.error('Project write failed:', error);
            Alert.alert(t.error, writeErrorMessage(error));
            return null;
        });
    };

    return {
        actor,
        createProject: (values: ProjectFormValues, initialTasks: InitialProjectTask[]) => runWrite(() => createProject(values, actor, initialTasks)),
        updateProject: (projectId: string, values: ProjectFormValues) => runWrite(() => updateProject(projectId, values).then(() => true)),
        changeStatus: (project: TaskProject, nextStatus: TaskProjectStatus) => runWrite(() => changeProjectStatus(project.id, nextStatus).then(() => true)),
        deleteProject: (project: TaskProject): Promise<boolean> => {
            if (!isOnline) {
                Alert.alert(t.tasksOfflineTitle, t.taskOfflineWrite);
                return Promise.resolve(false);
            }
            const body = project.taskCount > 0 ? fmt(t.projectDeleteConfirmBodyWithTasks, { count: project.taskCount }) : t.projectDeleteConfirmBody;
            return confirmAction(t.projectDeleteConfirmTitle, body, t.taskDelete, t.cancel, true).then((isConfirmed) =>
                isConfirmed ? runWrite(() => deleteProject(project.id).then(() => true)).then((isDeleted) => isDeleted === true) : false,
            );
        },
    };
};

import { fmt, t } from '../constants/strings';
import { changeProjectStatus, createProject, deleteProject, ProjectWriteError, updateProject } from '../services/projectWritesService';
import type { TaskProject, TaskProjectStatus } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { errorCode } from '../utils/ids';
import type { InitialProjectTask, ProjectFormValues } from '../utils/projectWrites';
import { useCurrentActor } from './useCurrentActor';
import { useGuardedWrite } from './useGuardedWrite';

const writeErrorMessage = (error: unknown): string => {
    if (error instanceof ProjectWriteError) return t.projectErrorNotFound;
    return fmt(t.projectSaveError, { code: errorCode(error) });
};

export const useProjectWriteActions = () => {
    const actor = useCurrentActor();
    const { warnIfOffline, runWrite: runGuardedWrite } = useGuardedWrite();
    const runWrite = <Result>(write: () => Promise<Result>) => runGuardedWrite(write, writeErrorMessage);

    return {
        actor,
        createProject: (values: ProjectFormValues, initialTasks: InitialProjectTask[]) => runWrite(() => createProject(values, actor, initialTasks)),
        updateProject: (projectId: string, values: ProjectFormValues) => runWrite(() => updateProject(projectId, values).then(() => true)),
        changeStatus: (project: TaskProject, nextStatus: TaskProjectStatus) => runWrite(() => changeProjectStatus(project.id, nextStatus).then(() => true)),
        deleteProject: (project: TaskProject): Promise<boolean> => {
            if (warnIfOffline()) return Promise.resolve(false);
            const body = project.taskCount > 0 ? fmt(t.projectDeleteConfirmBodyWithTasks, { count: project.taskCount }) : t.projectDeleteConfirmBody;
            return confirmAction(t.projectDeleteConfirmTitle, body, t.taskDelete, t.cancel, true).then((isConfirmed) =>
                isConfirmed ? runWrite(() => deleteProject(project.id).then(() => true)).then((isDeleted) => isDeleted === true) : false,
            );
        },
    };
};

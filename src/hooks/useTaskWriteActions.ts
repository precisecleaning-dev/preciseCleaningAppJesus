import { Alert } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useOnline } from '../context/NetworkContext';
import { useCurrentUser } from '../context/SessionContext';
import { addTaskComment, completeTask, createTask, deleteTask, TaskWriteError, undoCompleteTask, updateTask, type CompleteTaskResult } from '../services/taskWritesService';
import type { TaskComment, UserTask } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { errorCode, fullName } from '../utils/ids';
import { buildTaskComment, canMarkDone, type TaskActor, type TaskFormValues } from '../utils/taskWrites';

const approverNameOf = (task?: UserTask) => task?.approval?.approverUserName || t.taskApproverFallback;

const writeErrorMessage = (error: unknown, task?: UserTask): string => {
    if (error instanceof TaskWriteError) {
        if (error.reason === 'notFound') return t.taskErrorNotFound;
        if (error.reason === 'notOpen') return t.taskErrorNotOpen;
        if (error.reason === 'notDone') return t.taskErrorNotDone;
        if (error.reason === 'projectNotFound') return t.taskErrorProjectNotFound;
        return fmt(t.taskErrorNeedsApproval, { name: approverNameOf(task) });
    }
    return fmt(t.taskSaveError, { code: errorCode(error) });
};

export const useTaskWriteActions = () => {
    const user = useCurrentUser();
    const isOnline = useOnline();
    const actor: TaskActor = { userId: user.id, userName: fullName(user) };

    const warnIfOffline = (): boolean => {
        if (isOnline) return false;
        Alert.alert(t.tasksOfflineTitle, t.taskOfflineWrite);
        return true;
    };

    const runWrite = <Result>(write: () => Promise<Result>, task?: UserTask): Promise<Result | null> => {
        if (warnIfOffline()) return Promise.resolve(null);
        return write().catch((error: unknown) => {
            console.error('Task write failed:', error);
            Alert.alert(t.error, writeErrorMessage(error, task));
            return null;
        });
    };

    return {
        actor,
        createTask: (values: TaskFormValues, comments: TaskComment[] = []) => runWrite(() => createTask(values, actor, comments)),
        updateTask: (taskId: string, values: TaskFormValues) => runWrite(() => updateTask(taskId, values).then(() => true)),
        confirmCompletion: (task: UserTask): Promise<boolean> => {
            if (!canMarkDone(task)) {
                Alert.alert(t.taskMarkDone, fmt(t.taskErrorNeedsApproval, { name: approverNameOf(task) }));
                return Promise.resolve(false);
            }
            if (warnIfOffline()) return Promise.resolve(false);
            return confirmAction(t.taskConfirmDoneTitle, fmt(t.taskConfirmDoneBody, { title: task.title }), t.taskMarkDone, t.cancel);
        },
        completeTask: (task: UserTask): Promise<CompleteTaskResult | null> => runWrite(() => completeTask(task.id, actor), task),
        reopenTask: (task: UserTask, repeatTaskId: string | null = null) => runWrite(() => undoCompleteTask(task.id, repeatTaskId).then(() => true), task),
        deleteTask: (task: UserTask) => runWrite(() => deleteTask(task.id).then(() => true), task),
        addComment: (task: UserTask, text: string) =>
            runWrite(() => addTaskComment(task.id, buildTaskComment(text, actor, new Date().toISOString())).then(() => true), task).then((isSaved) => isSaved === true),
    };
};

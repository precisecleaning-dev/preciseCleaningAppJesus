import { Alert } from 'react-native';
import { fmt, t } from '../constants/strings';
import {
    addTaskComment,
    cancelApprovalRequest,
    completeTask,
    createTask,
    decideApproval,
    deleteTask,
    removeApproval,
    requestApproval,
    TaskWriteError,
    undoCompleteTask,
    updateTask,
    type CompleteTaskResult,
} from '../services/taskWritesService';
import type { ApprovalDecision, TaskAssignee, TaskComment, UserTask } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { errorCode } from '../utils/ids';
import { buildTaskComment, canMarkDone, type TaskFormValues } from '../utils/taskWrites';
import { useCurrentActor } from './useCurrentActor';
import { useGuardedWrite } from './useGuardedWrite';

const approverNameOf = (task?: UserTask) => task?.approval?.approverUserName || t.taskApproverFallback;

const needsApprovalMessage = (task?: UserTask): string =>
    fmt(task?.approval?.status === 'pending' ? t.taskErrorWaitingApproval : t.taskErrorNeedsApproval, { name: approverNameOf(task) });

const writeErrorMessage = (error: unknown, task?: UserTask): string => {
    if (error instanceof TaskWriteError) {
        if (error.reason === 'notFound') return t.taskErrorNotFound;
        if (error.reason === 'notOpen') return t.taskErrorNotOpen;
        if (error.reason === 'notDone') return t.taskErrorNotDone;
        if (error.reason === 'projectNotFound') return t.taskErrorProjectNotFound;
        if (error.reason === 'approvalChanged') return t.taskErrorApprovalChanged;
        return needsApprovalMessage(task);
    }
    return fmt(t.taskSaveError, { code: errorCode(error) });
};

export const useTaskWriteActions = () => {
    const actor = useCurrentActor();
    const { warnIfOffline, runWrite: runGuardedWrite } = useGuardedWrite();
    const runWrite = <Result>(write: () => Promise<Result>, task?: UserTask) => runGuardedWrite(write, (error) => writeErrorMessage(error, task));

    return {
        actor,
        createTask: (values: TaskFormValues, comments: TaskComment[] = [], approver: TaskAssignee | null = null) => runWrite(() => createTask(values, actor, comments, approver)),
        updateTask: (taskId: string, values: TaskFormValues) => runWrite(() => updateTask(taskId, values).then(() => true)),
        confirmCompletion: (task: UserTask): Promise<boolean> => {
            if (!canMarkDone(task)) {
                Alert.alert(t.taskMarkDone, needsApprovalMessage(task));
                return Promise.resolve(false);
            }
            if (warnIfOffline()) return Promise.resolve(false);
            return confirmAction(t.taskConfirmDoneTitle, fmt(t.taskConfirmDoneBody, { title: task.title }), t.taskMarkDone, t.cancel);
        },
        completeTask: (task: UserTask): Promise<CompleteTaskResult | null> => runWrite(() => completeTask(task.id, actor), task),
        reopenTask: (task: UserTask, repeatTaskId: string | null = null) => runWrite(() => undoCompleteTask(task.id, repeatTaskId).then(() => true), task),
        deleteTask: (task: UserTask) => runWrite(() => deleteTask(task.id).then(() => true), task),
        requestApproval: (task: UserTask, approver: TaskAssignee) => runWrite(() => requestApproval(task.id, approver, actor).then(() => true), task),
        cancelApprovalRequest: (task: UserTask) => runWrite(() => cancelApprovalRequest(task.id, actor).then(() => true), task),
        removeApproval: (task: UserTask) => runWrite(() => removeApproval(task.id).then(() => true), task),
        decideApproval: (task: UserTask, decision: ApprovalDecision, note = '') => runWrite(() => decideApproval(task.id, decision, note, actor).then(() => true), task),
        addComment: (task: UserTask, text: string) =>
            runWrite(() => addTaskComment(task.id, buildTaskComment(text, actor, new Date().toISOString())).then(() => true), task).then((isSaved) => isSaved === true),
    };
};

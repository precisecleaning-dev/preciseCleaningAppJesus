import { BadgeCheck, Hourglass, RotateCcw, Send, UserCheck, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useApprovers } from '../hooks/useApprovers';
import { useTaskWriteActions } from '../hooks/useTaskWriteActions';
import { colors, type AccentName } from '../theme/tokens';
import type { ApprovalDecision, TaskAssignee, UserTask } from '../types/tasks';
import { formatDateTime } from '../utils/dateFormat';
import { canCancelApprovalRequest, canDecideApproval, canRemoveApproval, canRequestApproval, TASK_COMMENT_MAX_LENGTH } from '../utils/taskWrites';
import { approvalHistoryOf } from '../utils/approvalComments';
import ApprovalHistory from './ApprovalHistory';
import ApproverField from './ApproverField';
import { styles } from './TaskApprovalCard.styles';
import AppText from './ui/AppText';
import Button from './ui/Button';
import Card from './ui/Card';
import InfoRow from './ui/InfoRow';
import TextField from './ui/TextField';

interface Props {
    task: UserTask;
    currentUserId: string;
    /** Whoever can edit the task (Task List Edit, assignee or creator) while it is open. */
    canManage: boolean;
}

interface ApprovalState {
    icon: LucideIcon;
    accent: AccentName;
    text: string;
}

const approvalStateOf = (task: UserTask, isMyTurn: boolean): ApprovalState => {
    const { approval } = task;
    if (!approval) return { icon: UserCheck, accent: 'amber', text: t.taskApprovalHint };
    if (isMyTurn) return { icon: Hourglass, accent: 'amber', text: fmt(t.taskApprovalYourTurn, { date: formatDateTime(approval.requestedAt) }) };
    const name = approval.approverUserName;
    if (approval.status === 'approved') return { icon: BadgeCheck, accent: 'mint', text: fmt(t.taskApprovalApprovedOn, { name, date: formatDateTime(approval.decidedAt) }) };
    if (approval.status === 'changes_requested')
        return { icon: RotateCcw, accent: 'coral', text: fmt(t.taskApprovalChangesBy, { name, date: formatDateTime(approval.decidedAt) }) };
    if (approval.status === 'pending') {
        const text = approval.requestedAt ? fmt(t.taskApprovalWaitingSince, { name, date: formatDateTime(approval.requestedAt) }) : fmt(t.taskApprovalPending, { name });
        return { icon: Hourglass, accent: 'amber', text };
    }
    return { icon: Hourglass, accent: 'amber', text: fmt(t.taskApprovalNeeds, { name }) };
};

const TaskApprovalCard = ({ task, currentUserId, canManage }: Props) => {
    const { requestApproval, cancelApprovalRequest, removeApproval, decideApproval } = useTaskWriteActions();
    const canDecide = canDecideApproval(task, currentUserId);
    const canSend = canManage && canRequestApproval(task);
    const canCancel = canManage && canCancelApprovalRequest(task, currentUserId);
    const canRemove = canManage && canRemoveApproval(task);
    const { status: approversStatus, approvers, defaultApprover } = useApprovers(canSend);
    const [chosenApprover, setChosenApprover] = useState<TaskAssignee | null>(null);
    const [isWorking, setWorking] = useState(false);
    const [isRequestingChanges, setRequestingChanges] = useState(false);
    const [changesNote, setChangesNote] = useState('');

    if (!task.approval && !canSend) return null;

    const currentApprover: TaskAssignee | null = task.approval ? { userId: task.approval.approverUserId, userName: task.approval.approverUserName } : null;
    const approverToSend = chosenApprover ?? currentApprover ?? defaultApprover;
    const state = approvalStateOf(task, canDecide);
    const history = approvalHistoryOf(task);

    const runWhileWorking = async (write: () => Promise<boolean | null>) => {
        setWorking(true);
        const isSaved = await write();
        setWorking(false);
        if (isSaved) setChosenApprover(null);
    };

    const handleSendPress = () => {
        if (approverToSend) runWhileWorking(() => requestApproval(task, approverToSend));
    };

    // If it couldn't be saved, the note stays written so it can be sent again.
    const handleDecision = async (decision: ApprovalDecision) => {
        setWorking(true);
        const isSaved = await decideApproval(task, decision, changesNote);
        setWorking(false);
        if (!isSaved) return;
        setRequestingChanges(false);
        setChangesNote('');
    };

    const handleCancelChanges = () => {
        setRequestingChanges(false);
        setChangesNote('');
    };

    return (
        <Card style={styles.card}>
            <InfoRow icon={state.icon} accent={state.accent} label={t.taskApproval} value={state.text} />
            {history.length > 0 && <ApprovalHistory events={history} currentUserId={currentUserId} hasOpenChangeRequest={task.approval?.status === 'changes_requested'} />}

            {canDecide && !isRequestingChanges && (
                <View style={styles.actions}>
                    <Button
                        label={t.taskApprovalApprove}
                        variant="success"
                        onPress={() => handleDecision('approved')}
                        loading={isWorking}
                        icon={<BadgeCheck size={18} color={colors.white} />}
                    />
                    <Button
                        label={t.taskApprovalRequestChanges}
                        variant="outline"
                        size="sm"
                        onPress={() => setRequestingChanges(true)}
                        disabled={isWorking}
                        icon={<RotateCcw size={16} color={colors.primary} />}
                    />
                </View>
            )}

            {canDecide && isRequestingChanges && (
                <View style={styles.actions}>
                    <TextField
                        value={changesNote}
                        onChangeText={setChangesNote}
                        placeholder={t.taskApprovalChangesPlaceholder}
                        accessibilityLabel={t.taskApprovalChangesPlaceholder}
                        multiline
                        maxLength={TASK_COMMENT_MAX_LENGTH}
                        style={styles.noteInput}
                        autoFocus
                    />
                    <View style={styles.row}>
                        <View style={styles.flex}>
                            <Button label={t.cancel} variant="ghost" size="sm" onPress={handleCancelChanges} disabled={isWorking} icon={<X size={16} color={colors.primary} />} />
                        </View>
                        <View style={styles.flex}>
                            <Button
                                label={t.taskApprovalSendChanges}
                                size="sm"
                                onPress={() => handleDecision('changes_requested')}
                                loading={isWorking}
                                disabled={!changesNote.trim()}
                                icon={<Send size={16} color={colors.white} />}
                            />
                        </View>
                    </View>
                </View>
            )}

            {canSend && (
                <View style={styles.sendArea}>
                    <ApproverField approver={approverToSend} approvers={approvers} isLoading={approversStatus === 'loading'} onChange={setChosenApprover} />
                    {approversStatus === 'error' && (
                        <AppText variant="caption" tone="warning">
                            {t.taskPeopleLoadError}
                        </AppText>
                    )}
                    <Button
                        label={task.approval?.status === 'changes_requested' ? t.taskApprovalSendAgain : t.taskApprovalSend}
                        size="sm"
                        onPress={handleSendPress}
                        loading={isWorking}
                        disabled={!approverToSend}
                        icon={<Send size={16} color={colors.white} />}
                    />
                </View>
            )}

            {canCancel && (
                <Button
                    label={t.taskApprovalCancelRequest}
                    variant="ghost"
                    size="sm"
                    onPress={() => runWhileWorking(() => cancelApprovalRequest(task))}
                    loading={isWorking}
                    icon={<X size={16} color={colors.primary} />}
                />
            )}

            {canRemove && (
                <Button
                    label={t.taskApprovalRemove}
                    variant="ghost"
                    size="sm"
                    onPress={() => runWhileWorking(() => removeApproval(task))}
                    disabled={isWorking}
                    icon={<X size={16} color={colors.primary} />}
                />
            )}
        </Card>
    );
};

export default TaskApprovalCard;

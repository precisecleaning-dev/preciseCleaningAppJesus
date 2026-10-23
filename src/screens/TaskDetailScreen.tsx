import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarDays, CircleCheckBig, Clock, Flag, FolderKanban, Hourglass, Pencil, RotateCcw, Send, Trash2, Users } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AttachmentsSection from '../components/AttachmentsSection';
import MessageThread from '../components/MessageThread';
import ScreenTopBar from '../components/ScreenTopBar';
import StatusScrim from '../components/StatusScrim';
import TaskStateView from '../components/TaskStateView';
import AppText from '../components/ui/AppText';
import BottomActionBar from '../components/ui/BottomActionBar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import InfoRow from '../components/ui/InfoRow';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { useCurrentUser } from '../context/SessionContext';
import { useAttachments } from '../hooks/useAttachments';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { useNow } from '../hooks/useNow';
import { useProject } from '../hooks/useProjects';
import { useTask } from '../hooks/useTask';
import { useTaskAccess } from '../hooks/useTaskAccess';
import { useTaskWriteActions } from '../hooks/useTaskWriteActions';
import type { RootStackParams } from '../navigation/types';
import type { AttachmentSource } from '../services/attachmentFilesService';
import type { AttachmentOwner } from '../utils/attachmentPaths';
import { colors } from '../theme/tokens';
import type { UserTask } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { formatDateTime } from '../utils/dateFormat';
import { findRelation } from '../utils/relations';
import { dueLabelOf } from '../utils/taskFormat';
import { isTaskOverdue } from '../utils/taskTabs';
import { TASK_COMMENT_MAX_LENGTH, taskActionsFor } from '../utils/taskWrites';
import { styles } from './TaskDetailScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'TaskDetail'>;

const approvalTextOf = (task: UserTask): string | null => {
    if (!task.approval) return null;
    const name = task.approval.approverUserName;
    if (task.approval.status === 'approved') return fmt(t.taskApprovalApproved, { name });
    if (task.approval.status === 'changes_requested') return task.approval.note ? `${t.taskApprovalChanges}: ${task.approval.note}` : t.taskApprovalChanges;
    if (task.approval.status === 'pending') return fmt(t.taskApprovalPending, { name });
    return `${t.taskApprovalDraft} · ${name}`;
};

const TaskDetailScreen = ({ route, navigation }: Props) => {
    const { taskId } = route.params;
    const insets = useSafeAreaInsets();
    const user = useCurrentUser();
    const now = useNow();
    const { priorities } = useCatalogs();
    const { permissions } = useTaskAccess();
    const { status, task, retry } = useTask(taskId);
    const { project: linkedProject } = useProject(task?.projectId ?? '');
    const { confirmCompletion, completeTask, reopenTask, deleteTask, addComment } = useTaskWriteActions();
    const isKeyboardVisible = useKeyboardVisible();
    const { uploadProgress, pickFiles, uploadFiles, confirmAndRemove } = useAttachments();
    const [isWorking, setWorking] = useState(false);
    const [repeatTaskId, setRepeatTaskId] = useState<string | null>(null);

    if (!task) {
        const stateKind = status === 'notFound' ? 'taskNotFound' : status === 'offline' ? 'offline' : 'taskLoadError';
        return (
            <View style={styles.screen}>
                <ScreenTopBar title={t.taskDetailTitle} onBack={() => navigation.goBack()} />
                <View style={styles.stateContent}>
                    {status === 'loading' ? <JobCardSkeleton /> : <TaskStateView kind={stateKind} onRetry={status === 'error' ? retry : undefined} />}
                </View>
            </View>
        );
    }

    const actions = taskActionsFor(task, permissions, user.id);
    const isDone = task.status === 'done';
    const isOverdue = !isDone && isTaskOverdue(task, now);
    const priority = findRelation(priorities, task.priorityId);
    const approvalText = approvalTextOf(task);
    const assigneeNames = task.assignees.map((assignee) => assignee.userName).join(', ');

    const runWhileWorking = (work: () => Promise<unknown>) => {
        setWorking(true);
        work().then(() => setWorking(false));
    };

    const handleCompletePress = () =>
        confirmCompletion(task).then((isConfirmed) => {
            if (!isConfirmed) return;
            runWhileWorking(() =>
                completeTask(task).then((result) => {
                    if (result) setRepeatTaskId(result.repeatTaskId);
                }),
            );
        });

    const handleReopenPress = () =>
        runWhileWorking(() =>
            reopenTask(task, repeatTaskId).then((reopened) => {
                if (reopened) setRepeatTaskId(null);
            }),
        );

    const handleDeletePress = () =>
        confirmAction(t.taskDeleteConfirmTitle, t.taskDeleteConfirmBody, t.taskDelete, t.cancel, true).then((isConfirmed) => {
            if (!isConfirmed) return;
            runWhileWorking(() =>
                deleteTask(task).then((isDeleted) => {
                    if (isDeleted) navigation.goBack();
                }),
            );
        });

    const attachmentOwner: AttachmentOwner = { collection: 'user_tasks', id: task.id };
    const handleAddAttachments = (source: AttachmentSource) => pickFiles(source).then((files) => uploadFiles(attachmentOwner, files));

    const hasActions = actions.canComplete || actions.canReopen || actions.canEdit || actions.canDelete;

    return (
        <View style={styles.screen}>
            <StatusScrim />
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: (hasActions && !isKeyboardVisible ? 190 : 40) + insets.bottom }]}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    showsVerticalScrollIndicator={false}
                >
                    <ScreenTopBar title={task.title} subtitle={dueLabelOf(task)} onBack={() => navigation.goBack()} overlap={40}>
                        <View style={styles.headChips}>
                            {isDone ? (
                                <Chip icon={CircleCheckBig} accent="mint" solid label={fmt(t.taskCompletedAt, { date: formatDateTime(task.doneAt) })} />
                            ) : (
                                <Chip icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} solid={isOverdue} label={isOverdue ? t.taskTabOverdue : dueLabelOf(task)} />
                            )}
                            {!!priority && <Chip label={priority.name} color={priority.color} onDark />}
                        </View>
                    </ScreenTopBar>

                    <View style={styles.content}>
                        <Card isRaised style={[styles.card, styles.raisedCard]}>
                            <AppText variant="h2">{task.title}</AppText>
                            <InfoRow icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} label={t.taskDue} value={dueLabelOf(task)} />
                            <InfoRow icon={Clock} accent="sky" label={t.taskDuration} value={fmt(t.taskDurationValue, { minutes: task.durationMinutes })} />
                            <InfoRow icon={Flag} accent="amber" label={t.taskPriority} value={priority?.name ?? t.taskNone} />
                            {!!task.projectId && <InfoRow icon={FolderKanban} accent="brand" label={t.taskProject} value={linkedProject?.title ?? task.projectTitle ?? ''} />}
                        </Card>

                        <Card style={styles.card}>
                            <InfoRow icon={Users} accent="teal" label={t.taskAssignedTo} value={assigneeNames || t.taskNone} />
                            <InfoRow icon={Send} accent="sky" label={t.taskAssignedBy} value={task.createdByUserName || t.taskNone} />
                            {!!approvalText && (
                                <InfoRow icon={Hourglass} accent={task.approval?.status === 'changes_requested' ? 'coral' : 'amber'} label={t.taskApproval} value={approvalText} />
                            )}
                        </Card>

                        <Card style={styles.card}>
                            <AttachmentsSection
                                attachments={task.attachments}
                                canUpload={actions.canAddAttachments}
                                canRemove={actions.canRemoveAttachments}
                                uploadProgress={uploadProgress}
                                onAdd={handleAddAttachments}
                                onRemove={(attachment) => confirmAndRemove(attachmentOwner, attachment)}
                            />
                        </Card>

                        <Card style={styles.card}>
                            <MessageThread
                                title={t.taskComments}
                                messages={task.comments.map((comment, index) => ({
                                    key: `${comment.userId}-${comment.createdAt}-${index}`,
                                    text: comment.text,
                                    author: comment.userName,
                                    at: comment.createdAt,
                                    isMine: comment.userId === user.id,
                                }))}
                                emptyText={t.taskNoComments}
                                placeholder={t.taskWriteComment}
                                canWrite={actions.canComment}
                                onSend={(text) => addComment(task, text)}
                                maxLength={TASK_COMMENT_MAX_LENGTH}
                            />
                        </Card>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {hasActions && !isKeyboardVisible && (
                <BottomActionBar>
                    {actions.canComplete && (
                        <Button
                            label={t.taskMarkDone}
                            size="lg"
                            variant="success"
                            onPress={handleCompletePress}
                            loading={isWorking}
                            icon={<CircleCheckBig size={22} color={colors.white} />}
                        />
                    )}
                    {actions.canReopen && (
                        <Button label={t.taskReopen} variant="soft" onPress={handleReopenPress} loading={isWorking} icon={<RotateCcw size={18} color={colors.primaryDark} />} />
                    )}
                    <View style={styles.secondaryActions}>
                        {actions.canEdit && !isDone && (
                            <View style={styles.flex}>
                                <Button
                                    label={t.taskEdit}
                                    variant="outline"
                                    size="sm"
                                    onPress={() => navigation.navigate('TaskForm', { taskId: task.id })}
                                    disabled={isWorking}
                                    icon={<Pencil size={16} color={colors.primary} />}
                                />
                            </View>
                        )}
                        {actions.canDelete && (
                            <View style={styles.flex}>
                                <Button
                                    label={t.taskDelete}
                                    variant="ghost"
                                    size="sm"
                                    onPress={handleDeletePress}
                                    disabled={isWorking}
                                    icon={<Trash2 size={16} color={colors.danger} />}
                                />
                            </View>
                        )}
                    </View>
                </BottomActionBar>
            )}
        </View>
    );
};

export default TaskDetailScreen;

import { CalendarDays, Circle, FolderKanban, Hourglass, ListChecks, MessageSquareText, Paperclip, Repeat, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { accents, colors, type AccentName } from '../theme/tokens';
import type { RepeatFrequency, UserTask } from '../types/tasks';
import { findRelation } from '../utils/relations';
import { dueLabelOf } from '../utils/taskFormat';
import { isTaskOverdue, needsApproval } from '../utils/taskTabs';
import { styles } from './TaskCard.styles';
import AppText from './ui/AppText';
import Chip from './ui/Chip';
import IconBubble from './ui/IconBubble';
import StripeCard from './ui/StripeCard';
import Touchable from './ui/Touchable';

interface Props {
    task: UserTask;
    currentUserId: string;
    now: Date;
    projectTitle?: string | null;
    onPress: (task: UserTask) => void;
    onComplete?: (task: UserTask) => void;
}

const REPEAT_LABELS: Record<RepeatFrequency, string> = {
    daily: t.taskRepeatDaily,
    weekdays: t.taskRepeatWeekdays,
    weekly: t.taskRepeatWeekly,
    monthly: t.taskRepeatMonthly,
};

const visualOf = (task: UserTask, isOverdue: boolean): { icon: LucideIcon; accent: AccentName } => {
    if (isOverdue) return { icon: TriangleAlert, accent: 'coral' };
    if (needsApproval(task)) return { icon: Hourglass, accent: 'amber' };
    if (task.repeat) return { icon: Repeat, accent: 'sky' };
    return { icon: ListChecks, accent: 'sky' };
};

const approvalChipOf = (task: UserTask): { label: string; accent: AccentName } | null => {
    if (!task.approval) return null;
    if (task.approval.status === 'pending') return { label: fmt(t.taskApprovalPending, { name: task.approval.approverUserName }), accent: 'amber' };
    if (task.approval.status === 'draft') return { label: t.taskApprovalDraft, accent: 'amber' };
    if (task.approval.status === 'changes_requested') return { label: t.taskApprovalChanges, accent: 'coral' };
    return null;
};

const TaskCard = ({ task, currentUserId, now, projectTitle = task.projectTitle, onPress, onComplete }: Props) => {
    const { priorities } = useCatalogs();
    const isOverdue = isTaskOverdue(task, now);
    const visual = visualOf(task, isOverdue);
    const priority = findRelation(priorities, task.priorityId);
    const approvalChip = approvalChipOf(task);
    const dueLabel = dueLabelOf(task);
    const otherAssigneeNames = task.assignees.filter((assignee) => assignee.userId !== currentUserId).map((assignee) => assignee.userName);
    const assignedBySomeoneElse = task.createdByUserId !== currentUserId && !!task.createdByUserName;
    const peopleLine = [
        assignedBySomeoneElse ? fmt(t.taskFrom, { name: task.createdByUserName }) : '',
        otherAssigneeNames.length > 0 ? fmt(t.taskWith, { names: otherAssigneeNames.join(', ') }) : '',
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <StripeCard stripeColor={accents[visual.accent].solid} onPress={() => onPress(task)} accessibilityLabel={`${task.title}, ${dueLabel}`}>
            <View style={styles.top}>
                <IconBubble icon={visual.icon} accent={visual.accent} />
                <View style={styles.titles}>
                    <AppText variant="title" numberOfLines={2}>
                        {task.title}
                    </AppText>
                    {!!peopleLine && (
                        <AppText variant="small" tone="muted" numberOfLines={1}>
                            {peopleLine}
                        </AppText>
                    )}
                </View>
                {!!onComplete && (
                    <Touchable onPress={() => onComplete(task)} haptic="medium" style={styles.completeButton} accessibilityLabel={t.taskMarkDone}>
                        <Circle size={26} color={colors.textSoft} strokeWidth={2} />
                    </Touchable>
                )}
            </View>

            <View style={styles.chips}>
                <Chip icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} label={dueLabel} solid={isOverdue} />
                {!!task.repeat && <Chip icon={Repeat} accent="sky" label={REPEAT_LABELS[task.repeat.freq] ?? task.repeat.freq} />}
                {!!priority && <Chip label={priority.name} color={priority.color} />}
                {!!projectTitle && <Chip icon={FolderKanban} accent="brand" label={projectTitle} />}
                {!!approvalChip && <Chip icon={Hourglass} accent={approvalChip.accent} label={approvalChip.label} />}
            </View>

            {(task.comments.length > 0 || task.attachments.length > 0) && (
                <View style={styles.footer}>
                    {task.comments.length > 0 && (
                        <View style={styles.counter}>
                            <MessageSquareText size={14} color={colors.textMuted} />
                            <AppText variant="caption" tone="muted">
                                {task.comments.length}
                            </AppText>
                        </View>
                    )}
                    {task.attachments.length > 0 && (
                        <View style={styles.counter}>
                            <Paperclip size={14} color={colors.textMuted} />
                            <AppText variant="caption" tone="muted">
                                {task.attachments.length}
                            </AppText>
                        </View>
                    )}
                </View>
            )}
        </StripeCard>
    );
};

export default TaskCard;

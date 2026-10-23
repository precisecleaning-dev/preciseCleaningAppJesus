import { CalendarDays, Clock, FolderKanban, User } from 'lucide-react-native';
import { View } from 'react-native';
import { fmt, t } from '../constants/strings';
import { colors } from '../theme/tokens';
import type { TaskProject } from '../types/tasks';
import { formatDate } from '../utils/dateFormat';
import { isProjectOverdue, PROJECT_STATUS_ACCENTS, PROJECT_STATUS_LABELS, projectColorOf } from '../utils/projectVisual';
import { formatOpenMinutes, projectProgressOf } from '../utils/projectWrites';
import { styles } from './ProjectCard.styles';
import AppText from './ui/AppText';
import Chip from './ui/Chip';
import IconBubble from './ui/IconBubble';
import ProgressRing from './ui/ProgressRing';
import StripeCard from './ui/StripeCard';

interface Props {
    project: TaskProject;
    now: Date;
    onPress: (project: TaskProject) => void;
}

const ProjectCard = ({ project, now, onPress }: Props) => {
    const color = projectColorOf(project);
    const progress = projectProgressOf(project);
    const isOverdue = isProjectOverdue(project, now);

    return (
        <StripeCard stripeColor={color} onPress={() => onPress(project)} accessibilityLabel={project.title}>
            <View style={styles.top}>
                <IconBubble icon={FolderKanban} accent={PROJECT_STATUS_ACCENTS[project.status]} />
                <View style={styles.titles}>
                    <AppText variant="title" numberOfLines={2}>
                        {project.title}
                    </AppText>
                    {!!project.description && (
                        <AppText variant="small" tone="muted" numberOfLines={1}>
                            {project.description}
                        </AppText>
                    )}
                </View>
                <ProgressRing size={44} stroke={5} progress={progress} color={color} track={colors.border}>
                    <AppText variant="caption">{Math.round(progress * 100)}%</AppText>
                </ProgressRing>
            </View>

            <View style={styles.chips}>
                {!!project.dueDate && <Chip icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} solid={isOverdue} label={formatDate(project.dueDate)} />}
                <Chip label={PROJECT_STATUS_LABELS[project.status]} accent={PROJECT_STATUS_ACCENTS[project.status]} solid={project.status !== 'active'} />
                {!!project.ownerUserName && <Chip icon={User} accent="brand" label={project.ownerUserName} />}
            </View>

            <View style={styles.footer}>
                <AppText variant="caption" tone="muted">
                    {project.taskCount > 0 ? fmt(t.projectProgress, { done: project.doneCount, total: project.taskCount }) : t.projectNoTasks}
                </AppText>
                {project.openMinutes > 0 && (
                    <View style={styles.openTime}>
                        <Clock size={13} color={colors.textMuted} />
                        <AppText variant="caption" tone="muted">
                            {fmt(t.projectOpenTime, { time: formatOpenMinutes(project.openMinutes) })}
                        </AppText>
                    </View>
                )}
            </View>
        </StripeCard>
    );
};

export default ProjectCard;

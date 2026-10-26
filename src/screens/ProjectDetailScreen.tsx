import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Archive, CalendarDays, CircleCheckBig, Clock, Flag, Pencil, Plus, RotateCcw, Target, Trash2, User, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenTopBar from '../components/ScreenTopBar';
import StatusScrim from '../components/StatusScrim';
import TaskCard from '../components/TaskCard';
import TaskStateView from '../components/TaskStateView';
import UndoBanner from '../components/UndoBanner';
import AppText from '../components/ui/AppText';
import BottomActionBar from '../components/ui/BottomActionBar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import InfoRow from '../components/ui/InfoRow';
import ProgressRing from '../components/ui/ProgressRing';
import { CardSkeletonList, JobCardSkeleton } from '../components/ui/Skeleton';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { useCurrentUser } from '../context/SessionContext';
import { useCompletionUndo } from '../hooks/useCompletionUndo';
import { useNow } from '../hooks/useNow';
import { useOpenTasks } from '../hooks/useOpenTasks';
import { useProject } from '../hooks/useProjects';
import { useProjectWriteActions } from '../hooks/useProjectWriteActions';
import { useTaskAccess } from '../hooks/useTaskAccess';
import type { RootStackParams } from '../navigation/types';
import { colors } from '../theme/tokens';
import type { TaskProjectStatus, UserTask } from '../types/tasks';
import { formatDate } from '../utils/dateFormat';
import { isProjectOverdue, PROJECT_STATUS_ACCENTS, PROJECT_STATUS_LABELS, projectColorOf } from '../utils/projectVisual';
import { formatOpenMinutes, projectProgressOf } from '../utils/projectWrites';
import { findRelation } from '../utils/relations';
import { taskActionsFor } from '../utils/taskWrites';
import { styles } from './ProjectDetailScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'ProjectDetail'>;

const ProjectDetailScreen = ({ route, navigation }: Props) => {
    const { projectId } = route.params;
    const insets = useSafeAreaInsets();
    const user = useCurrentUser();
    const now = useNow();
    const { teams } = useCatalogs();
    const { permissions, projectPermissions, canViewTasks } = useTaskAccess();
    const { status, project, retry } = useProject(projectId);
    const restrictToUserId = permissions?.isOwnScope ? user.id : null;
    const { status: tasksStatus, tasks } = useOpenTasks({ kind: 'project', projectId, restrictToUserId }, canViewTasks);
    const { pendingUndo, markDone, undo } = useCompletionUndo();
    const { changeStatus, deleteProject } = useProjectWriteActions();
    const [isWorking, setWorking] = useState(false);

    if (!project) {
        const stateKind = status === 'notFound' ? 'projectNotFound' : status === 'offline' ? 'offline' : 'projectsError';
        return (
            <View style={styles.screen}>
                <ScreenTopBar title={t.projectDetailTitle} onBack={() => navigation.goBack()} />
                <View style={styles.stateContent}>
                    {status === 'loading' ? <JobCardSkeleton /> : <TaskStateView kind={stateKind} onRetry={status === 'error' ? retry : undefined} />}
                </View>
            </View>
        );
    }

    const color = projectColorOf(project);
    const progress = projectProgressOf(project);
    const isOverdue = isProjectOverdue(project, now);
    const team = findRelation(teams, project.teamId);
    const canEdit = !!projectPermissions?.canEdit;
    const canDelete = !!projectPermissions?.canDelete;
    const canAddTasks = !!permissions?.canAdd;
    const hasActions = canEdit || canDelete;
    const sortedTasks = [...tasks].sort((first, second) => (first.dueDate || '9999').localeCompare(second.dueDate || '9999'));

    const runWhileWorking = (work: () => Promise<unknown>) => {
        setWorking(true);
        work().then(() => setWorking(false));
    };

    const handleStatusPress = (nextStatus: TaskProjectStatus) => runWhileWorking(() => changeStatus(project, nextStatus));

    const handleDeletePress = () =>
        runWhileWorking(() =>
            deleteProject(project).then((isDeleted) => {
                if (isDeleted) navigation.goBack();
            }),
        );

    const openTask = (task: UserTask) => navigation.navigate('TaskDetail', { taskId: task.id });

    return (
        <View style={styles.screen}>
            <StatusScrim />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: (hasActions ? 190 : 40) + insets.bottom }]} showsVerticalScrollIndicator={false}>
                <ScreenTopBar title={project.title} subtitle={project.ownerUserName} onBack={() => navigation.goBack()} overlap={40}>
                    <View style={styles.headChips}>
                        <Chip label={PROJECT_STATUS_LABELS[project.status]} accent={PROJECT_STATUS_ACCENTS[project.status]} solid />
                        {!!project.dueDate && <Chip icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} solid={isOverdue} label={formatDate(project.dueDate)} />}
                    </View>
                </ScreenTopBar>

                <View style={styles.content}>
                    <Card isRaised style={[styles.card, styles.raisedCard]}>
                        <View style={styles.progressRow}>
                            <ProgressRing size={64} stroke={7} progress={progress} color={color} track={colors.border}>
                                <AppText variant="title">{Math.round(progress * 100)}%</AppText>
                            </ProgressRing>
                            <View style={styles.progressText}>
                                <AppText variant="h2" numberOfLines={2}>
                                    {project.title}
                                </AppText>
                                <AppText variant="small" tone="muted">
                                    {project.taskCount > 0 ? fmt(t.projectProgress, { done: project.doneCount, total: project.taskCount }) : t.projectNoTasks}
                                    {project.openMinutes > 0 ? ` · ${fmt(t.projectOpenTime, { time: formatOpenMinutes(project.openMinutes) })}` : ''}
                                </AppText>
                            </View>
                        </View>
                        {!!project.description && <InfoRow icon={Target} accent="violet" label={t.projectDescription} value={project.description} />}
                    </Card>

                    <Card style={styles.card}>
                        <InfoRow icon={User} accent="brand" label={t.projectOwner} value={project.ownerUserName || t.taskNone} />
                        <InfoRow icon={Users} accent="teal" label={t.projectTeam} value={team?.name ?? t.taskNone} />
                        <InfoRow icon={Flag} accent="sky" label={t.projectStart} value={project.startDate ? formatDate(project.startDate) : t.noDate} />
                        <InfoRow icon={CalendarDays} accent={isOverdue ? 'coral' : 'sky'} label={t.projectDue} value={project.dueDate ? formatDate(project.dueDate) : t.noDate} />
                        {project.openMinutes > 0 && <InfoRow icon={Clock} accent="amber" label={t.taskDuration} value={formatOpenMinutes(project.openMinutes)} />}
                    </Card>

                    <View style={styles.sectionHead}>
                        <AppText variant="h2" style={styles.flex}>
                            {t.projectOpenTasks}
                        </AppText>
                        {canAddTasks && (
                            <Button
                                label={t.projectAddTask}
                                variant="soft"
                                size="sm"
                                onPress={() => navigation.navigate('TaskForm', { projectId: project.id })}
                                icon={<Plus size={16} color={colors.primaryDark} />}
                            />
                        )}
                    </View>
                    {tasksStatus === 'loading' && <CardSkeletonList count={2} />}
                    {tasksStatus === 'ready' && sortedTasks.length === 0 && (
                        <AppText variant="small" tone="muted">
                            {t.projectNoOpenTasks}
                        </AppText>
                    )}
                    {(tasksStatus === 'error' || tasksStatus === 'offline') && <TaskStateView kind={tasksStatus === 'offline' ? 'offline' : 'error'} />}
                    {sortedTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            currentUserId={user.id}
                            now={now}
                            projectTitle={null}
                            onPress={openTask}
                            onComplete={taskActionsFor(task, permissions, user.id).canComplete ? markDone : undefined}
                        />
                    ))}
                </View>
            </ScrollView>

            {!!pendingUndo && <UndoBanner message={`${t.taskCompleted} · ${pendingUndo.task.title}`} onUndo={undo} />}

            {hasActions && (
                <BottomActionBar>
                    {canEdit && project.status === 'active' && (
                        <Button
                            label={t.projectMarkDone}
                            size="lg"
                            variant="success"
                            onPress={() => handleStatusPress('done')}
                            loading={isWorking}
                            icon={<CircleCheckBig size={22} color={colors.white} />}
                        />
                    )}
                    {canEdit && project.status !== 'active' && (
                        <Button
                            label={t.projectReactivate}
                            variant="soft"
                            onPress={() => handleStatusPress('active')}
                            loading={isWorking}
                            icon={<RotateCcw size={18} color={colors.primaryDark} />}
                        />
                    )}
                    <View style={styles.secondaryActions}>
                        {canEdit && (
                            <View style={styles.flex}>
                                <Button
                                    label={t.projectEdit}
                                    variant="outline"
                                    size="sm"
                                    onPress={() => navigation.navigate('ProjectForm', { projectId: project.id })}
                                    disabled={isWorking}
                                    icon={<Pencil size={16} color={colors.primary} />}
                                />
                            </View>
                        )}
                        {canEdit && project.status !== 'archived' && (
                            <View style={styles.flex}>
                                <Button
                                    label={t.projectArchive}
                                    variant="ghost"
                                    size="sm"
                                    onPress={() => handleStatusPress('archived')}
                                    disabled={isWorking}
                                    icon={<Archive size={16} color={colors.primary} />}
                                />
                            </View>
                        )}
                        {canDelete && (
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

export default ProjectDetailScreen;

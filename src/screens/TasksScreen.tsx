import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown, Globe, Plus, Send, User, Users } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import OptionPicker, { type PickerOption } from '../components/OptionPicker';
import ProjectsList from '../components/ProjectsList';
import StatusScrim from '../components/StatusScrim';
import TaskCard from '../components/TaskCard';
import TaskStateView from '../components/TaskStateView';
import UndoBanner from '../components/UndoBanner';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import GradientHeader from '../components/ui/GradientHeader';
import GlassPillButton from '../components/ui/GlassPillButton';
import IconButton from '../components/ui/IconButton';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import { CardSkeletonList } from '../components/ui/Skeleton';
import { fmt, t } from '../constants/strings';
import { useCurrentUser } from '../context/SessionContext';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useCompletionUndo } from '../hooks/useCompletionUndo';
import { useNow } from '../hooks/useNow';
import { useOpenTasks } from '../hooks/useOpenTasks';
import { useProjects } from '../hooks/useProjects';
import { useTaskAccess } from '../hooks/useTaskAccess';
import { useTaskTabOrder } from '../hooks/useTaskTabOrder';
import { useTasksToApprove } from '../hooks/useTasksToApprove';
import type { RootStackParams, TabParams } from '../navigation/types';
import type { LoadStatus } from '../types';
import type { AssignableUser, TaskFilter, TaskListPermissions, UserTask } from '../types/tasks';
import { fullName } from '../utils/ids';
import { groupTasksByTab, type OpenTaskTabId } from '../utils/taskTabs';
import { taskActionsFor } from '../utils/taskWrites';
import { styles } from './TasksScreen.styles';

type Props = CompositeScreenProps<BottomTabScreenProps<TabParams, 'Tasks'>, NativeStackScreenProps<RootStackParams>>;

type ScreenStatus = LoadStatus | 'noAccess';

type ScreenSegment = 'tasks' | 'projects';

const TAB_LABELS: Record<OpenTaskTabId, string> = {
    all: t.taskTabAll,
    overdue: t.taskTabOverdue,
    daily: t.taskTabDaily,
    approval: t.taskTabApproval,
    week: t.taskTabWeek,
    later: t.taskTabLater,
    nodate: t.taskTabNoDate,
};

const FILTER_MINE = 'mine';
const FILTER_ASSIGNED_BY_ME = 'assignedByMe';
const FILTER_EVERYONE = 'everyone';
const PERSON_FILTER_PREFIX = 'person:';

const filterValueOf = (filter: TaskFilter, currentUserId: string): string => {
    if (filter.kind === 'everyone') return FILTER_EVERYONE;
    if (filter.kind === 'createdBy') return FILTER_ASSIGNED_BY_ME;
    if (filter.kind === 'project') return FILTER_MINE;
    return filter.userId === currentUserId ? FILTER_MINE : `${PERSON_FILTER_PREFIX}${filter.userId}`;
};

const filterLabelOf = (filter: TaskFilter, currentUserId: string): string => {
    if (filter.kind === 'everyone') return t.taskFilterEveryone;
    if (filter.kind === 'createdBy') return t.taskFilterAssignedByMe;
    if (filter.kind === 'project') return t.taskFilterMine;
    return filter.userId === currentUserId ? t.taskFilterMine : fmt(t.taskFilterPersonTasks, { name: filter.userName });
};

const filterOptionsFor = (permissions: TaskListPermissions, canChoosePeople: boolean, people: AssignableUser[], currentUserId: string): PickerOption[] => {
    const options: PickerOption[] = [{ value: FILTER_MINE, label: t.taskFilterMine, description: t.taskFilterMineDescription, icon: User }];
    if (permissions.canAdd || canChoosePeople)
        options.push({ value: FILTER_ASSIGNED_BY_ME, label: t.taskFilterAssignedByMe, description: t.taskFilterAssignedByMeDescription, icon: Send });
    if (!canChoosePeople) return options;
    options.push({ value: FILTER_EVERYONE, label: t.taskFilterEveryone, description: t.taskFilterEveryoneDescription, icon: Globe });
    people
        .filter((person) => person.userId !== currentUserId)
        .forEach((person) => options.push({ value: `${PERSON_FILTER_PREFIX}${person.userId}`, label: person.userName, icon: Users }));
    return options;
};

const TasksScreen = ({ navigation }: Props) => {
    const user = useCurrentUser();
    const now = useNow();
    const { status: accessStatus, permissions, projectPermissions, canViewTasks } = useTaskAccess();
    const canViewProjects = !!projectPermissions?.canView;
    const [segment, setSegment] = useState<ScreenSegment>('tasks');
    const { projects } = useProjects(canViewTasks);
    const projectTitlesById = new Map(projects.map((project) => [project.id, project.title]));
    const liveProjectTitleOf = (task: UserTask) => (task.projectId ? projectTitlesById.get(task.projectId) : undefined) ?? task.projectTitle;
    const tabOrder = useTaskTabOrder();
    const myFilter: TaskFilter = { kind: 'assignedTo', userId: user.id, userName: fullName(user) };
    const [filter, setFilter] = useState<TaskFilter>(myFilter);
    const [isFilterPickerVisible, setFilterPickerVisible] = useState(false);
    const [selectedTab, setSelectedTab] = useState<OpenTaskTabId>('all');
    const { status: tasksStatus, tasks, retry: retryTasks } = useOpenTasks(filter, canViewTasks);
    const isMyTasksView = filter.kind === 'assignedTo' && filter.userId === user.id;
    const { tasksToApprove, hasFailed: hasApprovalQueueFailed, retry: retryTasksToApprove } = useTasksToApprove(user.id, canViewTasks && isMyTasksView);
    const reviewOnlyIds = new Set(tasksToApprove.map((task) => task.id));
    const { pendingUndo, markDone, undo } = useCompletionUndo();

    const canChoosePeople = !!permissions && !permissions.isOwnScope;
    const canChooseFilter = !!permissions && (permissions.canAdd || canChoosePeople);
    const { status: peopleStatus, users: people } = useAssignableUsers(canChoosePeople);

    const tasksByTab = groupTasksByTab(tasks, now, isMyTasksView ? tasksToApprove : []);
    const visibleTabs = tabOrder.filter((tabId) => tabId === 'all' || tasksByTab[tabId].length > 0);
    const activeTab = visibleTabs.includes(selectedTab) ? selectedTab : 'all';

    let screenStatus: ScreenStatus = tasksStatus;
    if (accessStatus !== 'ready') screenStatus = accessStatus;
    else if (!canViewTasks) screenStatus = 'noAccess';
    const isReady = screenStatus === 'ready';

    const openTask = (task: UserTask) => navigation.navigate('TaskDetail', { taskId: task.id });
    const isProjectsSegment = segment === 'projects' && canViewProjects;
    const canAddInSegment = isProjectsSegment ? !!projectPermissions?.canAdd : !!permissions?.canAdd;
    const handleAddPress = () => (isProjectsSegment ? navigation.navigate('ProjectForm', {}) : navigation.navigate('TaskForm', {}));

    const handleFilterConfirm = ([value]: string[]) => {
        setFilterPickerVisible(false);
        if (value === FILTER_EVERYONE) setFilter({ kind: 'everyone' });
        else if (value === FILTER_ASSIGNED_BY_ME) setFilter({ kind: 'createdBy', userId: user.id });
        else if (value?.startsWith(PERSON_FILTER_PREFIX)) {
            const person = people.find((candidate) => `${PERSON_FILTER_PREFIX}${candidate.userId}` === value);
            if (person) setFilter({ kind: 'assignedTo', userId: person.userId, userName: person.userName });
        } else setFilter(myFilter);
    };

    const header = (
        <View>
            <GradientHeader>
                <View style={styles.titleRow}>
                    <View style={styles.titles}>
                        <AppText variant="h1" tone="inverse">
                            {t.tasksTitle}
                        </AppText>
                        {isReady && !isProjectsSegment && (
                            <AppText variant="small" tone="inverseMuted">
                                {fmt(t.tasksOpenCount, { count: tasks.length })}
                            </AppText>
                        )}
                    </View>
                    {canAddInSegment && <IconButton icon={Plus} onPress={handleAddPress} label={isProjectsSegment ? t.projectAdd : t.taskAdd} />}
                </View>
                {canChooseFilter && !isProjectsSegment && (
                    <View style={styles.filterRow}>
                        <GlassPillButton label={filterLabelOf(filter, user.id)} trailingIcon={ChevronDown} onPress={() => setFilterPickerVisible(true)} />
                    </View>
                )}
            </GradientHeader>
            {canViewProjects && (
                <View style={styles.segment}>
                    <SegmentedTabs
                        value={segment}
                        onChange={setSegment}
                        options={[
                            { value: 'tasks', label: t.segmentTasks },
                            { value: 'projects', label: t.segmentProjects },
                        ]}
                    />
                </View>
            )}
            {isReady && !isProjectsSegment && (
                <View style={styles.tabs}>
                    <SegmentedTabs
                        scrollable
                        value={activeTab}
                        onChange={setSelectedTab}
                        options={visibleTabs.map((tabId) => ({ value: tabId, label: TAB_LABELS[tabId], count: tasksByTab[tabId].length }))}
                    />
                </View>
            )}
            {isReady && !isProjectsSegment && hasApprovalQueueFailed && (
                <View style={styles.queueWarning}>
                    <AppText variant="caption" tone="warning" style={styles.flex}>
                        {t.taskApprovalQueueError}
                    </AppText>
                    <Button label={t.tryAgain} variant="ghost" size="sm" onPress={retryTasksToApprove} />
                </View>
            )}
        </View>
    );

    const renderStatusView = () => {
        if (screenStatus === 'loading') return <CardSkeletonList count={3} style={styles.skeletons} />;
        if (screenStatus === 'ready') return <TaskStateView kind={activeTab === 'all' ? 'noOpenTasks' : 'emptyTab'} />;
        return <TaskStateView kind={screenStatus} onRetry={screenStatus === 'error' ? retryTasks : undefined} />;
    };

    return (
        <View style={styles.screen}>
            <StatusScrim />
            {isProjectsSegment ? (
                <ProjectsList header={header} canViewProjects={canViewProjects} onOpenProject={(project) => navigation.navigate('ProjectDetail', { projectId: project.id })} />
            ) : (
                <FlatList
                    data={isReady ? tasksByTab[activeTab] : []}
                    keyExtractor={(task) => task.id}
                    ListHeaderComponent={header}
                    ListEmptyComponent={renderStatusView()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: task }) => (
                        <View style={styles.item}>
                            <TaskCard
                                task={task}
                                currentUserId={user.id}
                                now={now}
                                projectTitle={liveProjectTitleOf(task)}
                                onPress={openTask}
                                onComplete={!reviewOnlyIds.has(task.id) && taskActionsFor(task, permissions, user.id).canComplete ? markDone : undefined}
                            />
                        </View>
                    )}
                    initialNumToRender={8}
                    windowSize={7}
                />
            )}
            {!!pendingUndo && <UndoBanner message={`${t.taskCompleted} · ${pendingUndo.task.title}`} onUndo={undo} />}
            {!!permissions && (
                <OptionPicker
                    isVisible={isFilterPickerVisible}
                    title={t.taskFilterTitle}
                    options={filterOptionsFor(permissions, canChoosePeople, people, user.id)}
                    selectedValues={[filterValueOf(filter, user.id)]}
                    isLoading={canChoosePeople && peopleStatus === 'loading'}
                    onClose={() => setFilterPickerVisible(false)}
                    onConfirm={handleFilterConfirm}
                />
            )}
        </View>
    );
};

export default TasksScreen;

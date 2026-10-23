import {
    CalendarDays,
    FolderKanban,
    CircleCheckBig,
    CloudOff,
    FileQuestion,
    Hourglass,
    ListChecks,
    Lock,
    RefreshCw,
    TriangleAlert,
    Users,
    WifiOff,
    type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';
import { t } from '../constants/strings';
import { colors, gradients } from '../theme/tokens';
import type { Orbits } from './ui/Illustration';
import { styles } from './TaskStateView.styles';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';

export type TaskStateKind =
    | 'noAccess'
    | 'offline'
    | 'error'
    | 'taskNotFound'
    | 'taskLoadError'
    | 'noOpenTasks'
    | 'emptyTab'
    | 'projectsNoAccess'
    | 'projectsError'
    | 'projectsEmpty'
    | 'projectNotFound'
    | 'projectNoOpenTasks';

interface Props {
    kind: TaskStateKind;
    onRetry?: () => void;
}

const DEFAULT_ORBITS: Orbits = [
    { icon: CalendarDays, accent: 'sky' },
    { icon: Hourglass, accent: 'amber' },
    { icon: Users, accent: 'teal' },
];

const OFFLINE_ORBITS: Orbits = [
    { icon: CloudOff, accent: 'amber' },
    { icon: ListChecks, accent: 'sky' },
    { icon: RefreshCw, accent: 'teal' },
];

const CONTENT: Record<TaskStateKind, { icon: LucideIcon; gradient: readonly [string, string]; orbits: Orbits; title: string; body: string }> = {
    noAccess: { icon: Lock, gradient: gradients.brand, orbits: DEFAULT_ORBITS, title: t.tasksNoAccessTitle, body: t.tasksNoAccessBody },
    offline: { icon: WifiOff, gradient: gradients.amber, orbits: OFFLINE_ORBITS, title: t.tasksOfflineTitle, body: t.tasksOfflineBody },
    error: { icon: TriangleAlert, gradient: gradients.amber, orbits: DEFAULT_ORBITS, title: t.tasksErrorTitle, body: t.tasksErrorBody },
    taskNotFound: { icon: FileQuestion, gradient: gradients.amber, orbits: DEFAULT_ORBITS, title: t.taskNotFoundTitle, body: t.taskNotFoundBody },
    taskLoadError: { icon: TriangleAlert, gradient: gradients.amber, orbits: DEFAULT_ORBITS, title: t.taskLoadErrorTitle, body: t.tasksErrorBody },
    noOpenTasks: { icon: CircleCheckBig, gradient: gradients.mint, orbits: DEFAULT_ORBITS, title: t.tasksEmptyAllTitle, body: t.tasksEmptyAllBody },
    emptyTab: { icon: ListChecks, gradient: gradients.brand, orbits: DEFAULT_ORBITS, title: t.tasksEmptyTabTitle, body: t.tasksEmptyTabBody },
    projectsNoAccess: { icon: Lock, gradient: gradients.brand, orbits: DEFAULT_ORBITS, title: t.projectsNoAccessTitle, body: t.projectsNoAccessBody },
    projectsError: { icon: TriangleAlert, gradient: gradients.amber, orbits: DEFAULT_ORBITS, title: t.projectsErrorTitle, body: t.tasksErrorBody },
    projectsEmpty: { icon: FolderKanban, gradient: gradients.violet, orbits: DEFAULT_ORBITS, title: t.projectsEmptyTitle, body: t.projectsEmptyBody },
    projectNotFound: { icon: FileQuestion, gradient: gradients.amber, orbits: DEFAULT_ORBITS, title: t.projectNotFoundTitle, body: t.projectNotFoundBody },
    projectNoOpenTasks: { icon: CircleCheckBig, gradient: gradients.mint, orbits: DEFAULT_ORBITS, title: t.projectNoOpenTasks, body: '' },
};

const TaskStateView = ({ kind, onRetry }: Props) => {
    const content = CONTENT[kind];
    return (
        <View style={styles.wrap}>
            <EmptyState icon={content.icon} gradient={content.gradient} orbits={content.orbits} title={content.title} body={content.body} />
            {!!onRetry && <Button variant="soft" label={t.tryAgain} onPress={onRetry} icon={<RefreshCw size={18} color={colors.primaryDark} />} />}
        </View>
    );
};

export default TaskStateView;

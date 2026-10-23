import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import ScreenTopBar from '../components/ScreenTopBar';
import StatusScrim from '../components/StatusScrim';
import TaskForm from '../components/TaskForm';
import TaskStateView from '../components/TaskStateView';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { t } from '../constants/strings';
import { useCurrentUser } from '../context/SessionContext';
import { useTask } from '../hooks/useTask';
import { useTaskAccess } from '../hooks/useTaskAccess';
import type { RootStackParams } from '../navigation/types';
import { fullName } from '../utils/ids';
import { emptyTaskFormValues, formValuesOf } from '../utils/taskWrites';
import { styles } from './TaskFormScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'TaskForm'>;

const TaskFormScreen = ({ route, navigation }: Props) => {
    const editingTaskId = route.params?.taskId;
    const presetProjectId = route.params?.projectId ?? null;
    const isEditing = !!editingTaskId;
    const user = useCurrentUser();
    const { permissions } = useTaskAccess();
    const { status: taskStatus, task } = useTask(editingTaskId ?? '');
    const canUseForm = isEditing ? !!permissions?.canEdit : !!permissions?.canAdd;
    const goBack = () => navigation.goBack();

    const renderBody = () => {
        if (!canUseForm) return <TaskStateView kind="noAccess" />;
        if (!isEditing) return <TaskForm initialValues={{ ...emptyTaskFormValues({ userId: user.id, userName: fullName(user) }), projectId: presetProjectId }} onSaved={goBack} />;
        if (task) return <TaskForm key={task.id} initialValues={formValuesOf(task)} editingTaskId={task.id} onSaved={goBack} />;
        if (taskStatus === 'loading') {
            return (
                <View style={styles.padded}>
                    <JobCardSkeleton />
                </View>
            );
        }
        return <TaskStateView kind="taskNotFound" />;
    };

    return (
        <View style={styles.screen}>
            <StatusScrim />
            <ScreenTopBar title={isEditing ? t.taskEditTitle : t.taskNewTitle} onBack={goBack} />
            {renderBody()}
        </View>
    );
};

export default TaskFormScreen;

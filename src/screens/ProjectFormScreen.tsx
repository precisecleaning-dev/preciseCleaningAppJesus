import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import ProjectForm from '../components/ProjectForm';
import ScreenTopBar from '../components/ScreenTopBar';
import StatusScrim from '../components/StatusScrim';
import TaskStateView from '../components/TaskStateView';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { t } from '../constants/strings';
import { useCurrentUser } from '../context/SessionContext';
import { useProject } from '../hooks/useProjects';
import { useTaskAccess } from '../hooks/useTaskAccess';
import type { RootStackParams } from '../navigation/types';
import { fullName } from '../utils/ids';
import { emptyProjectFormValues, projectFormValuesOf } from '../utils/projectWrites';
import { styles } from './ProjectFormScreen.styles';

type Props = NativeStackScreenProps<RootStackParams, 'ProjectForm'>;

const ProjectFormScreen = ({ route, navigation }: Props) => {
    const editingProjectId = route.params?.projectId;
    const isEditing = !!editingProjectId;
    const user = useCurrentUser();
    const { projectPermissions } = useTaskAccess();
    const { status: projectStatus, project } = useProject(editingProjectId ?? '');
    const canUseForm = isEditing ? !!projectPermissions?.canEdit : !!projectPermissions?.canAdd;
    const goBack = () => navigation.goBack();

    const renderBody = () => {
        if (!canUseForm) return <TaskStateView kind="projectsNoAccess" />;
        if (!isEditing) return <ProjectForm initialValues={emptyProjectFormValues({ userId: user.id, userName: fullName(user) })} onSaved={goBack} />;
        if (project) return <ProjectForm key={project.id} initialValues={projectFormValuesOf(project)} editingProjectId={project.id} onSaved={goBack} />;
        if (projectStatus === 'loading') {
            return (
                <View style={styles.padded}>
                    <JobCardSkeleton />
                </View>
            );
        }
        return <TaskStateView kind="projectNotFound" />;
    };

    return (
        <View style={styles.screen}>
            <StatusScrim />
            <ScreenTopBar title={isEditing ? t.projectEditTitle : t.projectNewTitle} onBack={goBack} />
            {renderBody()}
        </View>
    );
};

export default ProjectFormScreen;

import { useState, type ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { useProjects } from '../hooks/useProjects';
import type { TaskProject, TaskProjectStatus } from '../types/tasks';
import { PROJECT_STATUS_LABELS } from '../utils/projectVisual';
import ProjectCard from './ProjectCard';
import { styles } from './ProjectsList.styles';
import TaskStateView from './TaskStateView';
import SegmentedTabs from './ui/SegmentedTabs';
import { CardSkeletonList } from './ui/Skeleton';

interface Props {
    header: ReactElement;
    canViewProjects: boolean;
    onOpenProject: (project: TaskProject) => void;
}

const STATUS_ORDER: TaskProjectStatus[] = ['active', 'done', 'archived'];

const byDueDateThenNewest = (first: TaskProject, second: TaskProject): number => {
    if (first.dueDate && second.dueDate && first.dueDate !== second.dueDate) return first.dueDate.localeCompare(second.dueDate);
    if (!!first.dueDate !== !!second.dueDate) return first.dueDate ? -1 : 1;
    return second.createdAt.localeCompare(first.createdAt);
};

const ProjectsList = ({ header, canViewProjects, onOpenProject }: Props) => {
    const now = useNow();
    const { status, projects, retry } = useProjects(canViewProjects);
    const [selectedStatus, setSelectedStatus] = useState<TaskProjectStatus>('active');
    const projectsWithStatus = projects.filter((project) => project.status === selectedStatus).sort(byDueDateThenNewest);
    const isReady = canViewProjects && status === 'ready';

    const renderStatusView = () => {
        if (!canViewProjects) return <TaskStateView kind="projectsNoAccess" />;
        if (status === 'loading') return <CardSkeletonList count={3} style={styles.skeletons} />;
        if (status === 'offline') return <TaskStateView kind="offline" />;
        if (status === 'error') return <TaskStateView kind="projectsError" onRetry={retry} />;
        return <TaskStateView kind="projectsEmpty" />;
    };

    return (
        <FlatList
            data={isReady ? projectsWithStatus : []}
            keyExtractor={(project) => project.id}
            ListHeaderComponent={
                <View>
                    {header}
                    {isReady && (
                        <View style={styles.tabs}>
                            <SegmentedTabs
                                value={selectedStatus}
                                onChange={setSelectedStatus}
                                options={STATUS_ORDER.map((projectStatus) => ({
                                    value: projectStatus,
                                    label: PROJECT_STATUS_LABELS[projectStatus],
                                    count: projects.filter((project) => project.status === projectStatus).length,
                                }))}
                            />
                        </View>
                    )}
                </View>
            }
            ListEmptyComponent={renderStatusView()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: project }) => (
                <View style={styles.item}>
                    <ProjectCard project={project} now={now} onPress={onOpenProject} />
                </View>
            )}
        />
    );
};

export default ProjectsList;

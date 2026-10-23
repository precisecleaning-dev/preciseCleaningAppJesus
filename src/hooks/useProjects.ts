import { useEffect, useState } from 'react';
import { useOnline } from '../context/NetworkContext';
import { subscribeProject, subscribeProjects, type ProjectsUpdate } from '../services/projectsService';
import type { TaskProject } from '../types/tasks';
import type { LoadStatus } from './useTaskAccess';

export const useProjects = (isEnabled: boolean) => {
    const isOnline = useOnline();
    const [subscriptionKey, setSubscriptionKey] = useState(0);
    const [latestUpdate, setLatestUpdate] = useState<ProjectsUpdate | null>(null);
    const [failedSubscriptionKey, setFailedSubscriptionKey] = useState<number | null>(null);

    useEffect(() => {
        if (!isEnabled) return;
        return subscribeProjects(setLatestUpdate, (error: unknown) => {
            console.error('Error loading projects:', error);
            setFailedSubscriptionKey(subscriptionKey);
        });
    }, [isEnabled, subscriptionKey]);

    const projects = latestUpdate?.projects ?? [];
    let status: LoadStatus = 'ready';
    if (failedSubscriptionKey === subscriptionKey) status = isOnline ? 'error' : 'offline';
    else if (!isOnline && projects.length === 0 && (latestUpdate === null || latestUpdate.isFromCache)) status = 'offline';
    else if (latestUpdate === null) status = 'loading';

    return { status, projects, retry: () => setSubscriptionKey((key) => key + 1) };
};

export type ProjectLoadStatus = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

export const useProject = (projectId: string) => {
    const isOnline = useOnline();
    const [subscriptionKey, setSubscriptionKey] = useState(0);
    const [loaded, setLoaded] = useState<{ projectId: string; project: TaskProject | null } | null>(null);
    const [failedSubscription, setFailedSubscription] = useState<string | null>(null);
    const subscriptionId = `${projectId}#${subscriptionKey}`;

    useEffect(
        () =>
            subscribeProject(
                projectId,
                (project) => setLoaded({ projectId, project }),
                (error: unknown) => {
                    console.error('Error loading project:', error);
                    setFailedSubscription(`${projectId}#${subscriptionKey}`);
                },
            ),
        [projectId, subscriptionKey],
    );

    const current = loaded?.projectId === projectId ? loaded : null;
    let status: ProjectLoadStatus = 'ready';
    if (failedSubscription === subscriptionId) status = isOnline ? 'error' : 'offline';
    else if (!current) status = isOnline ? 'loading' : 'offline';
    else if (!current.project) status = 'notFound';

    return { status, project: current?.project ?? null, retry: () => setSubscriptionKey((key) => key + 1) };
};

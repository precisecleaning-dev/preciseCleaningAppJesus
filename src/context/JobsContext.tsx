import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { t } from '../constants/strings';
import { useLiveSubscription } from '../hooks/useLiveSubscription';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { getCustomersByKeys } from '../services/customersService';
import { subscribeAssigned, subscribeTeam } from '../services/propertiesService';
import type { Customer, Property, Status } from '../types';
import { displayClientName, findRelation } from '../utils/relations';
import { useCatalogs } from './CatalogsContext';
import { useOnline } from './NetworkContext';
import { useSession } from './SessionContext';

export type JobsStatus = 'noAccess' | 'loading' | 'ready' | 'error';

interface JobsValue {
    jobs: Property[];
    jobsStatus: JobsStatus;
    jobsLoaded: boolean;
    settled: boolean;
    retryJobs: () => void;
    getJob: (id: string) => Property | undefined;
    clientName: (property: Property) => string;
    serviceName: (property: Property) => string;
    statusOf: (property: Property) => Status | undefined;
    logLabel: (property: Property) => string;
    requestClients: (keys: string[]) => void;
}

interface JobsProviderProps {
    children: ReactNode;
}

type Keyed<Item> = { key: string; list: Item[] } | null;

const JobsContext = createContext<JobsValue | null>(null);

export const JobsProvider = ({ children }: JobsProviderProps) => {
    const { user, housesPermission, isElementVisible, configLoaded } = useSession();
    const { statuses, teams, products, services, loaded: catalogsLoaded } = useCatalogs();
    const isOnline = useOnline();
    const [customers, setCustomers] = useState<Keyed<Customer>>(null);
    const [extraKeys, setExtraKeys] = useState('');
    const [customersRetry, setCustomersRetry] = useState(0);

    const hasHousesAccess = housesPermission?.canView === true;
    const userId = user?.id ?? '';
    const team = findRelation(teams, user?.teamId);
    const teamKey = [...new Set([user?.teamId, team?.id, team?.name].filter(Boolean))].join('|');

    const assigned = useLiveSubscription<Property[]>({
        key: `assigned:${userId}`,
        isEnabled: !!userId && hasHousesAccess,
        subscribe: (onData, onError) => subscribeAssigned(userId, (houses) => onData(houses, false), onError),
        description: 'assigned houses',
    });
    const byTeam = useLiveSubscription<Property[]>({
        key: `team:${teamKey}`,
        isEnabled: !!teamKey && hasHousesAccess,
        subscribe: (onData, onError) => subscribeTeam(teamKey.split('|'), (houses) => onData(houses, false), onError),
        description: 'team houses',
    });

    const hasFailed = assigned.hasFailed || byTeam.hasFailed;
    const retryJobs = () => {
        assigned.retry();
        byTeam.retry();
    };

    const assignedLoaded = assigned.value !== null;
    const teamLoaded = !teamKey || byTeam.value !== null;
    const housesById = new Map<string, Property>();
    if (hasHousesAccess) [...(assigned.value ?? []), ...(teamKey ? (byTeam.value ?? []) : [])].forEach((house) => housesById.set(house.id, house));

    const statusOf = (property: Property) => findRelation(statuses, property.statusId);
    const allowedStatusIds = housesPermission?.allowedStatusIds || [];
    const jobs = [...housesById.values()].filter((property) => {
        const status = statusOf(property);
        if (statuses.length > 0 && !status) return false;
        if (allowedStatusIds.length > 0 && !allowedStatusIds.includes(property.statusId) && !(status && allowedStatusIds.includes(status.id))) return false;
        return !status || isElementVisible(`status_${status.id}`);
    });

    let jobsStatus: JobsStatus = 'ready';
    if (!hasHousesAccess) jobsStatus = 'noAccess';
    else if (hasFailed) jobsStatus = 'error';
    else if (!assignedLoaded) jobsStatus = 'loading';

    const clientKeys = [...new Set([...jobs.map((job) => job.client), ...extraKeys.split('|')].filter(Boolean))].sort().join('|');
    useEffect(() => {
        if (!clientKeys || !isOnline) return;
        let isCancelled = false;
        getCustomersByKeys(clientKeys.split('|')).then(({ list, complete }) => {
            if (!isCancelled) setCustomers({ key: complete ? clientKeys : '', list });
        });
        return () => {
            isCancelled = true;
        };
    }, [clientKeys, isOnline, customersRetry]);

    useWhenOnline(() => setCustomersRetry((attempt) => attempt + 1), customers?.key === '');

    const customerList = customers?.list ?? [];
    const clientName = (property: Property) => displayClientName(customerList, property.client, { unknown: t.unknownClient, deleted: t.deletedClient });
    const value: JobsValue = {
        jobs,
        jobsStatus,
        jobsLoaded: jobsStatus === 'ready',
        settled: jobsStatus === 'ready' && teamLoaded && catalogsLoaded && configLoaded && (!clientKeys || customers?.key === clientKeys),
        retryJobs,
        getJob: (id) => housesById.get(id),
        clientName,
        serviceName: (property) => (findRelation(products, property.serviceId) ?? findRelation(services, property.serviceId))?.name ?? '—',
        statusOf,
        logLabel: (property) => (property.address ? `${clientName(property)} — ${property.address}` : clientName(property)),
        requestClients: (keys) => {
            const next = [...new Set(keys.filter(Boolean))].sort().join('|');
            if (next !== extraKeys) setExtraKeys(next);
        },
    };

    return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const useJobs = (): JobsValue => {
    const context = useContext(JobsContext);
    if (!context) throw new Error('useJobs must be used inside <JobsProvider>');
    return context;
};

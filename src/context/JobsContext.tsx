import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { getCustomersByKeys } from '../services/customersService';
import { subscribeAssigned, subscribeTeam } from '../services/propertiesService';
import type { Customer, Property, Status } from '../types';
import { displayClientName, findRelation } from '../utils/relations';
import { useCatalogs } from './CatalogsContext';
import { useOnline } from './NetworkContext';
import { useSession } from './SessionContext';
import { t } from '../constants/strings';

interface JobsValue {
  jobs: Property[];
  jobsLoaded: boolean;
  settled: boolean;
  getJob: (id: string) => Property | undefined;
  clientName: (p: Property) => string;
  serviceName: (p: Property) => string;
  statusOf: (p: Property) => Status | undefined;
  logLabel: (p: Property) => string;
  requestClients: (keys: string[]) => void;
}

type Keyed<T> = { key: string; list: T[] } | null;
const JobsContext = createContext<JobsValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, housesPermission, isElementVisible, configLoaded } = useSession();
  const { statuses, teams, products, services, loaded: catalogsLoaded } = useCatalogs();
  const online = useOnline();
  const [assigned, setAssigned] = useState<Keyed<Property>>(null);
  const [byTeam, setByTeam] = useState<Keyed<Property>>(null);
  const [customers, setCustomers] = useState<Keyed<Customer>>(null);
  const [extraKeys, setExtraKeys] = useState('');
  const [retry, setRetry] = useState(0);

  const userId = user?.id ?? '';
  const team = findRelation(teams, user?.teamId);
  const teamKey = [...new Set([user?.teamId, team?.id, team?.name].filter(Boolean))].join('|');

  useEffect(() => {
    if (!userId) return;
    return subscribeAssigned(userId, (list) => setAssigned({ key: userId, list }));
  }, [userId]);

  useEffect(() => {
    if (!teamKey) return;
    return subscribeTeam(teamKey.split('|'), (list) => setByTeam({ key: teamKey, list }));
  }, [teamKey]);

  const assignedLoaded = assigned?.key === userId;
  const teamLoaded = !teamKey || byTeam?.key === teamKey;
  const merged = new Map<string, Property>();
  [...(assignedLoaded ? assigned.list : []), ...(teamLoaded && byTeam ? byTeam.list : [])].forEach((p) => merged.set(p.id, p));

  const statusOf = (p: Property) => findRelation(statuses, p.statusId);
  const allowed = housesPermission?.allowedStatusIds || [];
  const jobs = [...merged.values()].filter((p) => {
    const st = statusOf(p);
    if (statuses.length > 0 && !st) return false;
    if (!isSuperAdmin && allowed.length > 0 && !allowed.includes(p.statusId) && !(st && allowed.includes(st.id))) return false;
    return !st || isElementVisible(`status_${st.id}`);
  });

  const clientKeys = [...new Set([...jobs.map((j) => j.client), ...extraKeys.split('|')].filter(Boolean))].sort().join('|');
  useEffect(() => {
    if (!clientKeys || !online) return;
    let cancelled = false;
    getCustomersByKeys(clientKeys.split('|')).then(({ list, complete }) => {
      if (!cancelled) setCustomers({ key: complete ? clientKeys : '', list });
    });
    return () => {
      cancelled = true;
    };
  }, [clientKeys, online, retry]);

  useWhenOnline(() => setRetry((n) => n + 1), customers?.key === '');

  const customerList = customers?.list ?? [];
  const clientName = (p: Property) => displayClientName(customerList, p.client, { unknown: t.unknownClient, deleted: t.deletedClient });
  const value: JobsValue = {
    jobs,
    jobsLoaded: assignedLoaded,
    settled: assignedLoaded && teamLoaded && catalogsLoaded && configLoaded && (!clientKeys || customers?.key === clientKeys),
    getJob: (id) => merged.get(id),
    clientName,
    serviceName: (p) => (findRelation(products, p.serviceId) ?? findRelation(services, p.serviceId))?.name ?? '—',
    statusOf,
    logLabel: (p) => (p.address ? `${clientName(p)} — ${p.address}` : clientName(p)),
    requestClients: (keys) => {
      const next = [...new Set(keys.filter(Boolean))].sort().join('|');
      if (next !== extraKeys) setExtraKeys(next);
    },
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}

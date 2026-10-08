// src/context/JobsContext.tsx
// ⭐ "Mis casas": las casas que la oficina le asignó al empleado desde la web.
//    Misma regla que el alcance 'Own' de HousesView y "Mi historial":
//      · el empleado está en `assignedWorkers`, O
//      · la casa es de su equipo (`teamId`).
//    En vez de bajar TODA la colección `properties` como la web (pesado para
//    datos móviles), se hacen dos consultas filtradas en el servidor y se unen.
//    Son onSnapshot: en cuanto el admin asigna una casa, aparece en el teléfono.
import { collection, onSnapshot, query, where, type QuerySnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../config/firebase';
import type { Property, Status } from '../types';
import { displayClientName, findRelation, getRelationName } from '../utils/relations';
import { useCatalogs } from './CatalogsContext';
import { useSession } from './SessionContext';

interface JobsValue {
  jobs: Property[];
  jobsLoaded: boolean;
  getJob: (id: string) => Property | undefined;
  clientName: (p: Property) => string;
  serviceName: (p: Property) => string;
  statusOf: (p: Property) => Status | undefined;
  /** "Cliente — Dirección", mismo formato que logLabel() de la web. */
  logLabel: (p: Property) => string;
}

const JobsContext = createContext<JobsValue | null>(null);

const EMPTY: Property[] = [];

const toProps = (snap: QuerySnapshot) => snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Property);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, housesPermission, isElementVisible } = useSession();
  const { statuses, statusesLoaded, teams, customers, products, services } = useCatalogs();
  // Cada resultado se guarda con la clave para la que se pidió (usuario /
  // equipo): si cambia la clave, el resultado viejo se ignora solo.
  const [assignedRes, setAssignedRes] = useState<{ key: string; list: Property[] } | null>(null);
  const [teamRes, setTeamRes] = useState<{ key: string; list: Property[] } | null>(null);

  const userId = user?.id;
  const team = findRelation(teams, user?.teamId);
  // Las casas legacy guardan a veces el NOMBRE del equipo en vez del id.
  const teamKeys = useMemo(
    () => [...new Set([user?.teamId, team?.id, team?.name].filter((v): v is string => !!v))].slice(0, 10),
    [user?.teamId, team?.id, team?.name],
  );
  const teamKeysStr = teamKeys.join('|');

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(
      query(collection(db, 'properties'), where('assignedWorkers', 'array-contains', userId)),
      (snap) => setAssignedRes({ key: userId, list: toProps(snap) }),
      (err) => {
        console.error('Error cargando casas asignadas:', err);
        setAssignedRes({ key: userId, list: [] });
      },
    );
  }, [userId]);

  useEffect(() => {
    if (teamKeys.length === 0) return;
    return onSnapshot(
      query(collection(db, 'properties'), where('teamId', 'in', teamKeys)),
      (snap) => setTeamRes({ key: teamKeysStr, list: toProps(snap) }),
      (err) => console.error('Error cargando casas del equipo:', err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- teamKeysStr representa teamKeys
  }, [teamKeysStr]);

  const assignedLoaded = !!userId && assignedRes?.key === userId;
  const assigned = assignedLoaded ? assignedRes.list : EMPTY;
  const byTeam = teamKeysStr && teamRes?.key === teamKeysStr ? teamRes.list : EMPTY;

  const value = useMemo<JobsValue>(() => {
    const statusOf = (p: Property) => findRelation(statuses, p.statusId);
    const allowed = housesPermission?.allowedStatusIds || [];

    const merged = new Map<string, Property>();
    [...assigned, ...byTeam].forEach((p) => merged.set(p.id, p));

    const jobs = [...merged.values()].filter((p) => {
      // Igual que la web: las casas SIN status viven en "No Status" y no se
      // muestran — pero solo si el catálogo ya cargó (si no, se vaciaría todo).
      const st = statusOf(p);
      if (statusesLoaded && statuses.length > 0 && !st) return false;
      // Statuses permitidos para el rol (Roles & Permissions → Houses).
      if (!isSuperAdmin && allowed.length > 0) {
        if (!allowed.includes(p.statusId) && !(st && allowed.includes(st.id))) return false;
      }
      // Statuses ocultos para el rol en Configure Fields (filterByVisibleStatus de la web).
      if (st && !isElementVisible(`status_${st.id}`)) return false;
      return true;
    });

    const clientName = (p: Property) => displayClientName(customers, p.client);
    return {
      jobs,
      jobsLoaded: assignedLoaded,
      getJob: (id) => merged.get(id),
      clientName,
      serviceName: (p) => {
        const fromProducts = findRelation(products, p.serviceId);
        return fromProducts ? fromProducts.name : getRelationName(services, p.serviceId, '—');
      },
      statusOf,
      logLabel: (p) => (p.address ? `${clientName(p)} — ${p.address}` : clientName(p)),
    };
  }, [assigned, byTeam, assignedLoaded, statuses, statusesLoaded, customers, products, services, isSuperAdmin, housesPermission, isElementVisible]);

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}

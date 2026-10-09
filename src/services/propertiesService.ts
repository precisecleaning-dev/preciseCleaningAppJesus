import { documentId, getDocsFromServer, query, where } from 'firebase/firestore';
import type { Property } from '../types';
import { chunk, listen, typedCollection } from './firestore';

const properties = () => typedCollection<Property>('properties');

export const subscribeAssigned = (userId: string, onData: (p: Property[]) => void) =>
  listen(query(properties(), where('assignedWorkers', 'array-contains', userId)), onData, 'casas asignadas');

export const subscribeTeam = (teamKeys: string[], onData: (p: Property[]) => void) =>
  listen(query(properties(), where('teamId', 'in', teamKeys.slice(0, 30))), onData, 'casas del equipo');

export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  const parts = await Promise.all(chunk([...new Set(ids)]).map((part) => getDocsFromServer(query(properties(), where(documentId(), 'in', part)))));
  return parts.flatMap((snap) => snap.docs.map((d) => d.data()));
}

import { documentId, getDocsFromServer, query, where } from 'firebase/firestore';
import type { Customer } from '../types';
import { chunk, typedCollection } from './firestore';

const known = new Map<string, Customer | null>();
const customers = () => typedCollection<Customer>('customers');
const isDocId = (k: string) => !k.includes('/') && k !== '.' && k !== '..' && !/^__.*__$/.test(k);

async function loadBatch(part: string[]): Promise<void> {
  const ids = part.filter(isDocId);
  const [byId, byLegacy] = await Promise.all([
    ids.length ? getDocsFromServer(query(customers(), where(documentId(), 'in', ids))) : null,
    getDocsFromServer(query(customers(), where('id', 'in', part))),
  ]);
  part.forEach((k) => known.set(k, null));
  byId?.docs.forEach((d) => known.set(d.id, { id: d.id, name: d.get('name') }));
  byLegacy.docs.forEach((d) => known.set(String(d.get('id')), { id: d.id, legacyId: String(d.get('id')), name: d.get('name') }));
}

export async function getCustomersByKeys(keys: string[]): Promise<Customer[]> {
  const missing = [...new Set(keys.filter((k) => k && !known.has(k)))];
  const results = await Promise.allSettled(chunk(missing).map(loadBatch));
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('Error cargando clientes:', r.reason);
  });
  return keys.map((k) => known.get(k)).filter((c): c is Customer => !!c);
}

export const resetCustomers = () => known.clear();

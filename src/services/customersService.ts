import { documentId, getDocsFromServer, query, where } from 'firebase/firestore';
import type { Customer } from '../types';
import { chunk, isDocId, typedCollection } from './firestore';

const known = new Map<string, Customer | null>();
const customers = () => typedCollection<Customer>('customers');

async function loadBatch(part: string[]): Promise<void> {
    const ids = part.filter(isDocId);
    const [byId, byLegacy] = await Promise.all([
        ids.length ? getDocsFromServer(query(customers(), where(documentId(), 'in', ids))) : null,
        getDocsFromServer(query(customers(), where('id', 'in', part))),
    ]);
    const found = new Map<string, Customer>();
    byId?.docs.forEach((d) => found.set(d.id, { id: d.id, name: d.get('name') }));
    byLegacy.docs.forEach((d) => found.set(String(d.get('id')), { id: d.id, legacyId: String(d.get('id')), name: d.get('name') }));
    const byName = part.filter((k) => !found.has(k));
    if (byName.length) (await getDocsFromServer(query(customers(), where('name', 'in', byName)))).docs.forEach((d) => found.set(d.get('name'), { id: d.id, name: d.get('name') }));
    part.forEach((k) => known.set(k, found.get(k) ?? null));
}

export async function getCustomersByKeys(keys: string[]): Promise<{ list: Customer[]; complete: boolean }> {
    const missing = [...new Set(keys.filter((k) => k && !known.has(k)))];
    const results = await Promise.allSettled(chunk(missing).map(loadBatch));
    results.forEach((r) => {
        if (r.status === 'rejected') console.error('Error cargando clientes:', r.reason);
    });
    return { list: keys.map((k) => known.get(k)).filter((c): c is Customer => !!c), complete: results.every((r) => r.status === 'fulfilled') };
}

export const resetCustomers = () => known.clear();

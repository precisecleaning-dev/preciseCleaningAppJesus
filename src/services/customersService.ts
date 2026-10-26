import { documentId, getDocsFromServer, query, where } from 'firebase/firestore';
import type { Customer } from '../types';
import { chunkList } from '../utils/chunkList';
import { CONFIG_TTL } from '../utils/memoryCache';
import { FIRESTORE_IN_LIMIT, isDocId, typedCollection } from './firestore';

interface CachedCustomer {
    customer: Customer | null;
    expiresAt: number;
}

const knownCustomers = new Map<string, CachedCustomer>();
const customers = () => typedCollection<Customer>('customers');

const isFresh = (key: string, now: number) => (knownCustomers.get(key)?.expiresAt ?? 0) > now;

const loadBatch = async (keys: string[]): Promise<void> => {
    const documentIds = keys.filter(isDocId);
    const [byDocumentId, byLegacyId] = await Promise.all([
        documentIds.length ? getDocsFromServer(query(customers(), where(documentId(), 'in', documentIds))) : null,
        getDocsFromServer(query(customers(), where('id', 'in', keys))),
    ]);
    const found = new Map<string, Customer>();
    byDocumentId?.docs.forEach((customerDoc) => found.set(customerDoc.id, { id: customerDoc.id, name: customerDoc.get('name') }));
    byLegacyId.docs.forEach((customerDoc) =>
        found.set(String(customerDoc.get('id')), { id: customerDoc.id, legacyId: String(customerDoc.get('id')), name: customerDoc.get('name') }),
    );
    const byName = keys.filter((key) => !found.has(key));
    if (byName.length) {
        (await getDocsFromServer(query(customers(), where('name', 'in', byName)))).docs.forEach((customerDoc) =>
            found.set(customerDoc.get('name'), { id: customerDoc.id, name: customerDoc.get('name') }),
        );
    }
    const expiresAt = Date.now() + CONFIG_TTL;
    keys.forEach((key) => knownCustomers.set(key, { customer: found.get(key) ?? null, expiresAt }));
};

export const getCustomersByKeys = async (keys: string[]): Promise<{ list: Customer[]; complete: boolean }> => {
    const now = Date.now();
    const missingKeys = [...new Set(keys.filter((key) => key && !isFresh(key, now)))];
    const results = await Promise.allSettled(chunkList(missingKeys, FIRESTORE_IN_LIMIT).map(loadBatch));
    results.forEach((result) => {
        if (result.status === 'rejected') console.error('Error loading customers:', result.reason);
    });
    return {
        list: keys.map((key) => knownCustomers.get(key)?.customer).filter((customer): customer is Customer => !!customer),
        complete: results.every((result) => result.status === 'fulfilled'),
    };
};

export const resetCustomers = () => knownCustomers.clear();

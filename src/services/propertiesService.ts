import { arrayUnion, doc, documentId, getDocsFromServer, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PhotoKind, Property } from '../types';
import { chunkList } from '../utils/chunkList';
import { FIRESTORE_IN_LIMIT, isDocId, listen, typedCollection } from './firestore';

const properties = () => typedCollection<Property>('properties');

export const subscribeAssigned = (userId: string, onData: (houses: Property[]) => void, onError: (error: unknown) => void) =>
    listen(query(properties(), where('assignedWorkers', 'array-contains', userId)), onData, onError, 'assigned houses');

export const subscribeTeam = (teamKeys: string[], onData: (houses: Property[]) => void, onError: (error: unknown) => void) =>
    listen(query(properties(), where('teamId', 'in', teamKeys.slice(0, 30))), onData, onError, 'team houses');

export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
    const parts = await Promise.allSettled(
        chunkList([...new Set(ids.filter(isDocId))], FIRESTORE_IN_LIMIT).map((part) => getDocsFromServer(query(properties(), where(documentId(), 'in', part)))),
    );
    return parts.flatMap((r) => (r.status === 'fulfilled' ? r.value.docs.map((d) => d.data()) : []));
}

/** Links an uploaded photo to the house. arrayUnion makes it safe to repeat after a failed attempt. */
export const addPhotoUrl = (propertyId: string, kind: PhotoKind, photoUrl: string): Promise<void> =>
    updateDoc(doc(db, 'properties', propertyId), { [kind === 'before' ? 'beforePhotos' : 'afterPhotos']: arrayUnion(photoUrl) });

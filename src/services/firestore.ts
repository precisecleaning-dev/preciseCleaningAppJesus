import { collection, onSnapshot, type DocumentData, type FirestoreDataConverter, type Query, type QuerySnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

function converter<T extends { id: string }>(): FirestoreDataConverter<T> {
    return {
        toFirestore: (data) => data as DocumentData,
        fromFirestore: (snap) => ({ ...snap.data(), id: snap.id }) as T,
    };
}

export const typedCollection = <T extends { id: string }>(path: string) => collection(db, path).withConverter(converter<T>());

export const isDocId = (k: string) => !!k && !k.includes('/') && k !== '.' && k !== '..' && !/^__.*__$/.test(k);

export const FIRESTORE_IN_LIMIT = 30;

export const listen = <T>(listenQuery: Query<T>, onData: (rows: T[]) => void, onError: (error: unknown) => void, description: string): (() => void) =>
    onSnapshot(
        listenQuery,
        (snapshot) => {
            if (!(snapshot.empty && snapshot.metadata.fromCache)) onData(snapshot.docs.map((rowDoc) => rowDoc.data()));
        },
        (error) => {
            console.error(`Error loading ${description}:`, error);
            onError(error);
        },
    );

export interface MergedUpdate<T> {
    rows: T[];
    isFromCache: boolean;
}

/** Listens to several queries and emits their rows merged by document id, once every query has answered. */
export const subscribeMerged = <T>(queries: Query<T>[], onUpdate: (update: MergedUpdate<T>) => void, onError: (error: unknown) => void): (() => void) => {
    const latestSnapshots: (QuerySnapshot<T> | null)[] = queries.map(() => null);

    const emitMerged = () => {
        if (latestSnapshots.some((snapshot) => snapshot === null)) return;
        const rowsById = new Map<string, T>();
        latestSnapshots.forEach((snapshot) => snapshot?.docs.forEach((rowDoc) => rowsById.set(rowDoc.id, rowDoc.data())));
        onUpdate({ rows: [...rowsById.values()], isFromCache: latestSnapshots.some((snapshot) => snapshot?.metadata.fromCache) });
    };

    const unsubscribers = queries.map((mergedQuery, queryIndex) =>
        onSnapshot(
            mergedQuery,
            (snapshot) => {
                latestSnapshots[queryIndex] = snapshot;
                emitMerged();
            },
            onError,
        ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};

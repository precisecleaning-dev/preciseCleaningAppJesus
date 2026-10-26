import { collection, onSnapshot, type DocumentData, type FirestoreDataConverter, type Query } from 'firebase/firestore';
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

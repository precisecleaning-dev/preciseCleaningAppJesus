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

export function chunk<T>(list: T[], size = 30): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function listen<T>(q: Query<T>, onData: (rows: T[]) => void, what: string): () => void {
  return onSnapshot(
    q,
    (snap) => {
      if (!(snap.empty && snap.metadata.fromCache)) onData(snap.docs.map((d) => d.data()));
    },
    (err) => {
      console.error(`Error cargando ${what}:`, err);
      onData([]);
    },
  );
}

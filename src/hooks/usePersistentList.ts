import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

export function usePersistentList<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<T[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        ref.current = raw ? (JSON.parse(raw) as T[]) : [];
        setItems(ref.current);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [key]);

  const update = (fn: (prev: T[]) => T[]) => {
    ref.current = fn(ref.current);
    setItems(ref.current);
    AsyncStorage.setItem(key, JSON.stringify(ref.current)).catch((e) => console.error(`No se pudo guardar ${key}`, e));
  };

  return { items, loaded, ref, update };
}

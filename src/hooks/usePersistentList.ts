import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

type ListUpdater<Item> = (previous: Item[]) => Item[];

const persistList = <Item>(storageKey: string, list: Item[]) =>
    AsyncStorage.setItem(storageKey, JSON.stringify(list)).catch((error: unknown) => console.error(`Could not save ${storageKey}:`, error));

export const usePersistentList = <Item>(storageKey: string) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef<Item[]>([]);
    const isLoadedRef = useRef(false);
    const updatesBeforeLoad = useRef<ListUpdater<Item>[]>([]);

    useEffect(() => {
        AsyncStorage.getItem(storageKey)
            .then((rawList) => (rawList ? (JSON.parse(rawList) as Item[]) : []))
            .catch((error: unknown): Item[] => {
                console.error(`Could not read ${storageKey}:`, error);
                return [];
            })
            .then((storedList) => {
                const pendingUpdates = updatesBeforeLoad.current;
                updatesBeforeLoad.current = [];
                const mergedList = pendingUpdates.reduce((list, updater) => updater(list), storedList);
                isLoadedRef.current = true;
                ref.current = mergedList;
                setItems(mergedList);
                if (pendingUpdates.length > 0) persistList(storageKey, mergedList);
                setLoaded(true);
            });
    }, [storageKey]);

    const update = (updater: ListUpdater<Item>) => {
        ref.current = updater(ref.current);
        setItems(ref.current);
        if (!isLoadedRef.current) {
            updatesBeforeLoad.current.push(updater);
            return;
        }
        persistList(storageKey, ref.current);
    };

    return { items, loaded, ref, update };
};

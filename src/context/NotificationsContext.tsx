import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { diffSnapshots, takeSnapshot, type AppNotification, type Snapshot } from '../utils/notificationDiff';
import { useJobs } from './JobsContext';
import { useOnline } from './NetworkContext';
import { usePayroll } from './PayrollContext';
import { useCurrentUser } from './SessionContext';

interface Stored {
    seen: Snapshot | null;
    list: AppNotification[];
}

interface NotificationsValue {
    list: AppNotification[];
    unread: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    toast: AppNotification | null;
    dismissToast: () => void;
}

const MAX_ITEMS = 60;
const SETTLE_MS = 1200;
const NotificationsContext = createContext<NotificationsValue | null>(null);
const persist = (key: string, data: Stored) => AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const user = useCurrentUser();
    const { jobs, settled, statusOf, clientName } = useJobs();
    const { records, loaded: payrollLoaded } = usePayroll();
    const online = useOnline();
    const [stored, setStored] = useState<{ uid: string; data: Stored } | null>(null);
    const [toasts, setToasts] = useState<AppNotification[]>([]);
    const key = `pc_crew_notifications_v1_${user.id}`;
    const data = stored?.uid === user.id ? stored.data : null;
    const helpers = useRef({ clientName, statusOf });
    useEffect(() => {
        helpers.current = { clientName, statusOf };
    });

    useEffect(() => {
        AsyncStorage.getItem(key)
            .then((raw) => (raw ? (JSON.parse(raw) as Stored) : null))
            .catch(() => null)
            .then((s) => setStored({ uid: user.id, data: s ?? { seen: null, list: [] } }));
    }, [key, user.id]);

    useEffect(() => {
        if (!data || !settled || !payrollLoaded || !online) return;
        const timer = setTimeout(() => {
            const myEmail = user.email.toLowerCase();
            const { clientName: name, statusOf: status } = helpers.current;
            const now = takeSnapshot(jobs, records, { myEmail, clientName: name, statusName: (p) => status(p)?.name || p.statusId || '' });
            const commit = (next: Stored) => {
                setStored({ uid: user.id, data: next });
                persist(key, next);
            };
            if (!data.seen) return commit({ ...data, seen: now });
            const fresh = diffSnapshots(data.seen, now, jobs, records, myEmail);
            if (fresh.length === 0 && JSON.stringify(data.seen) === JSON.stringify(now)) return;
            commit({ seen: now, list: [...fresh, ...data.list].slice(0, MAX_ITEMS) });
            if (fresh.length > 0 && AppState.currentState === 'active') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                setToasts((q) => [...q, ...fresh.slice(0, 3)]);
            }
        }, SETTLE_MS);
        return () => clearTimeout(timer);
    }, [data, settled, payrollLoaded, online, jobs, records, user.email, user.id, key]);

    const save = (next: Stored) => {
        setStored({ uid: user.id, data: next });
        persist(key, next);
    };
    const list = data?.list ?? [];
    const value: NotificationsValue = {
        list,
        unread: list.filter((n) => !n.read).length,
        markRead: (id) => {
            if (data) save({ ...data, list: list.map((n) => (n.id === id ? { ...n, read: true } : n)) });
        },
        markAllRead: () => {
            if (data) save({ ...data, list: list.map((n) => ({ ...n, read: true })) });
        },
        toast: toasts[0] ?? null,
        dismissToast: () => setToasts((q) => q.slice(1)),
    };

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
    return ctx;
}

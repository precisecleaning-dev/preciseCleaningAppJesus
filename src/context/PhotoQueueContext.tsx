import { Directory, File, Paths } from 'expo-file-system';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePersistentList } from '../hooks/usePersistentList';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { logActivity } from '../services/activityLog';
import { compressPhoto, discard, uploadErrorKind, uploadPhoto, type PickedPhoto } from '../services/photoService';
import type { PhotoKind } from '../types';
import { errorCode, makeId } from '../utils/ids';
import { useCatalogs } from './CatalogsContext';
import { checkOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 600_000];

interface JobRef {
    propertyId: string;
    clientName: string;
    address: string;
    label: string;
    kind: PhotoKind;
}

export interface QueuedPhoto extends JobRef {
    id: string;
    userId: string;
    fileName: string;
    attempts: number;
    lastError?: string;
    blocked?: boolean;
}

type Tally = Map<string, { before: number; after: number; label: string }>;

interface PhotoQueueValue {
    queue: QueuedPhoto[];
    current: { id: string; progress: number } | null;
    enqueue: (job: JobRef, photos: PickedPhoto[]) => Promise<void>;
    retryAll: () => void;
    pendingFor: (propertyId: string, kind?: PhotoKind) => QueuedPhoto[];
    localUri: (q: QueuedPhoto) => string;
}

const PhotoQueueContext = createContext<PhotoQueueValue | null>(null);

function queuedFile(fileName: string): File {
    const dir = new Directory(Paths.document, 'pending-photos');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, fileName);
}

async function uploadOne(item: QueuedPhoto, fileUri: string, onProgress: (p: number) => void): Promise<'ok' | { kind: ReturnType<typeof uploadErrorKind>; code: string }> {
    try {
        await uploadPhoto({ ...item, fileUri }, onProgress);
        return 'ok';
    } catch (err) {
        console.error('Error subiendo foto:', err);
        return { kind: uploadErrorKind(err), code: errorCode(err) };
    }
}

export function PhotoQueueProvider({ children }: { children: ReactNode }) {
    const user = useCurrentUser();
    const { photoConfig } = useCatalogs();
    const { items, loaded, ref, update } = usePersistentList<QueuedPhoto>('pc_crew_photo_queue_v1');
    const [current, setCurrent] = useState<{ id: string; progress: number } | null>(null);
    const running = useRef(false);
    const alive = useRef(true);
    const backoff = useRef(0);
    const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            clearTimeout(retryTimer.current);
        };
    }, []);

    const patch = (id: string, changes: Partial<QueuedPhoto>) => update((prev) => prev.map((q) => (q.id === id ? { ...q, ...changes } : q)));

    const uploadAll = async (tally: Tally): Promise<boolean> => {
        if (!(await checkOnline())) return false;
        const next = () => (alive.current ? ref.current.find((q) => q.userId === user.id && !q.blocked && q.attempts < MAX_ATTEMPTS) : undefined);
        for (let item = next(); item; item = next()) {
            const file = queuedFile(item.fileName);
            if (!file.exists) {
                patch(item.id, { blocked: true, lastError: 'file-missing' });
                continue;
            }
            const id = item.id;
            setCurrent({ id, progress: 0 });
            const result = await uploadOne(item, file.uri, (progress) => setCurrent({ id, progress }));
            if (result === 'ok') {
                update((prev) => prev.filter((q) => q.id !== id));
                discard(file);
                backoff.current = 0;
                const agg = tally.get(item.propertyId) ?? { before: 0, after: 0, label: item.label };
                agg[item.kind] += 1;
                tally.set(item.propertyId, agg);
            } else if (result.kind === 'network' || !(await checkOnline())) {
                patch(id, { lastError: result.code });
                return true;
            } else {
                update((prev) => prev.map((q) => (q.id === id ? { ...q, lastError: result.code, attempts: q.attempts + 1, blocked: result.kind === 'permanent' } : q)));
            }
        }
        return false;
    };

    const process = () => {
        if (running.current) return;
        running.current = true;
        clearTimeout(retryTimer.current);
        const tally: Tally = new Map();
        uploadAll(tally)
            .catch((err) => {
                console.error('Error en la cola de fotos:', err);
                return false;
            })
            .then((waitForNetwork) => {
                setCurrent(null);
                running.current = false;
                tally.forEach((a, propertyId) =>
                    logActivity({ action: 'photo_upload', user, targetId: propertyId, targetLabel: a.label, detail: `${a.before} foto(s) Before, ${a.after} foto(s) After` }),
                );
                if (waitForNetwork && alive.current) retryTimer.current = setTimeout(process, BACKOFF_MS[Math.min(backoff.current++, BACKOFF_MS.length - 1)]);
            });
    };

    useWhenOnline(() => {
        backoff.current = 0;
        process();
    }, loaded);

    const addPhotos = async (job: JobRef, photos: PickedPhoto[]) => {
        for (const photo of photos) {
            const id = makeId('pp');
            const fileName = `${id}.jpg`;
            await new File(await compressPhoto(photo, photoConfig)).move(queuedFile(fileName));
            update((prev) => [...prev, { ...job, id, userId: user.id, fileName, attempts: 0 }]);
        }
    };

    const queue = items.filter((q) => q.userId === user.id);
    const value: PhotoQueueValue = {
        queue,
        current,
        enqueue: (job, photos) =>
            addPhotos(job, photos).then(process, (err) => {
                process();
                throw err;
            }),
        retryAll: () => {
            update((prev) => prev.map((q) => (q.userId === user.id ? { ...q, attempts: 0, blocked: q.lastError === 'file-missing' } : q)));
            backoff.current = 0;
            process();
        },
        pendingFor: (propertyId, kind) => queue.filter((q) => q.propertyId === propertyId && (!kind || q.kind === kind)),
        localUri: (q) => queuedFile(q.fileName).uri,
    };

    return <PhotoQueueContext.Provider value={value}>{children}</PhotoQueueContext.Provider>;
}

export function usePhotoQueue(): PhotoQueueValue {
    const ctx = useContext(PhotoQueueContext);
    if (!ctx) throw new Error('usePhotoQueue debe usarse dentro de <PhotoQueueProvider>');
    return ctx;
}

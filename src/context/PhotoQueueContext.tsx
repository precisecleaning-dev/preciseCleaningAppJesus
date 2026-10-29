import { Directory, File, Paths } from 'expo-file-system';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePersistentList } from '../hooks/usePersistentList';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { logActivity } from '../services/activityLog';
import { compressPhoto, discard, discardPickerCopy, uploadErrorKind, uploadPhotoFile, type UploadErrorKind } from '../services/photoService';
import { addPhotoUrl } from '../services/propertiesService';
import type { PhotoKind } from '../types';
import { errorCode, makeId } from '../utils/ids';
import { useCatalogs } from './CatalogsContext';
import { checkOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';

const STORAGE_KEY = 'pc_crew_photo_queue_v1';
const QUEUE_DIRECTORY = 'pending-photos';
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 600_000];
const FILE_MISSING = 'file-missing';

export interface PhotoTarget {
    propertyId: string;
    clientName: string;
    address: string;
    label: string;
    kind: PhotoKind;
}

export interface QueuedPhoto extends PhotoTarget {
    id: string;
    userId: string;
    fileName: string;
    attempts: number;
    lastError?: string;
    blocked?: boolean;
    /** Set once the file is in Storage: a retry only links it to the house, it never uploads it again. */
    uploadedUrl?: string;
}

interface UploadProgress {
    id: string;
    progress: number;
}

type UploadSummary = Map<string, { before: number; after: number; label: string }>;

type UploadOutcome = { isUploaded: true } | { isUploaded: false; errorKind: UploadErrorKind; code: string };

interface PhotoQueueValue {
    queue: QueuedPhoto[];
    current: UploadProgress | null;
    enqueue: (target: PhotoTarget, photoUris: string[]) => Promise<void>;
    retryAll: () => void;
    pendingFor: (propertyId: string, kind?: PhotoKind) => QueuedPhoto[];
    needsManualRetry: (queuedPhoto: QueuedPhoto) => boolean;
    localUri: (queuedPhoto: QueuedPhoto) => string;
}

interface PhotoQueueProviderProps {
    children: ReactNode;
}

const PhotoQueueContext = createContext<PhotoQueueValue | null>(null);

// Only the file name is stored: on iOS the app folder changes with every update.
const queuedFile = (fileName: string): File => {
    const directory = new Directory(Paths.document, QUEUE_DIRECTORY);
    if (!directory.exists) directory.create({ intermediates: true });
    return new File(directory, fileName);
};

const needsManualRetry = (queuedPhoto: QueuedPhoto): boolean => !!queuedPhoto.blocked || queuedPhoto.attempts >= MAX_ATTEMPTS;

const sendQueuedPhoto = async (queuedPhoto: QueuedPhoto, onStored: (uploadedUrl: string) => void, onProgress: (progress: number) => void): Promise<UploadOutcome> => {
    try {
        let photoUrl = queuedPhoto.uploadedUrl;
        if (!photoUrl) {
            photoUrl = await uploadPhotoFile({ ...queuedPhoto, fileUri: queuedFile(queuedPhoto.fileName).uri }, onProgress);
            onStored(photoUrl);
        }
        await addPhotoUrl(queuedPhoto.propertyId, queuedPhoto.kind, photoUrl);
        return { isUploaded: true };
    } catch (error) {
        console.error('Error uploading photo:', error);
        return { isUploaded: false, errorKind: uploadErrorKind(error), code: errorCode(error) };
    }
};

const countUpload = (summary: UploadSummary, queuedPhoto: QueuedPhoto): void => {
    const counts = summary.get(queuedPhoto.propertyId) ?? { before: 0, after: 0, label: queuedPhoto.label };
    summary.set(queuedPhoto.propertyId, { ...counts, [queuedPhoto.kind]: counts[queuedPhoto.kind] + 1 });
};

export const PhotoQueueProvider = ({ children }: PhotoQueueProviderProps) => {
    const user = useCurrentUser();
    const { photoConfig } = useCatalogs();
    const { items, loaded, ref: latestItems, update } = usePersistentList<QueuedPhoto>(STORAGE_KEY);
    const [current, setCurrent] = useState<UploadProgress | null>(null);
    const isUploading = useRef(false);
    const isMounted = useRef(true);
    const backoffStep = useRef(0);
    const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            clearTimeout(retryTimer.current);
        };
    }, []);

    const patchPhoto = (id: string, changes: Partial<QueuedPhoto>) =>
        update((previous) => previous.map((queuedPhoto) => (queuedPhoto.id === id ? { ...queuedPhoto, ...changes } : queuedPhoto)));

    const removePhoto = (queuedPhoto: QueuedPhoto) => {
        update((previous) => previous.filter((candidate) => candidate.id !== queuedPhoto.id));
        discard(queuedFile(queuedPhoto.fileName));
    };

    const recordFailure = (queuedPhoto: QueuedPhoto, outcome: Extract<UploadOutcome, { isUploaded: false }>) =>
        update((previous) =>
            previous.map((candidate) =>
                candidate.id === queuedPhoto.id
                    ? { ...candidate, lastError: outcome.code, attempts: candidate.attempts + 1, blocked: outcome.errorKind === 'permanent' }
                    : candidate,
            ),
        );

    /** Sends each waiting photo once. Returns true when something failed and it should try again later. */
    const uploadWaitingPhotos = async (summary: UploadSummary): Promise<boolean> => {
        if (!(await checkOnline())) return false;
        const triedIds = new Set<string>();
        const nextPhoto = () =>
            isMounted.current
                ? latestItems.current.find((queuedPhoto) => queuedPhoto.userId === user.id && !needsManualRetry(queuedPhoto) && !triedIds.has(queuedPhoto.id))
                : undefined;

        let shouldRetryLater = false;
        for (let queuedPhoto = nextPhoto(); queuedPhoto; queuedPhoto = nextPhoto()) {
            const { id } = queuedPhoto;
            triedIds.add(id);
            if (!queuedPhoto.uploadedUrl && !queuedFile(queuedPhoto.fileName).exists) {
                patchPhoto(id, { blocked: true, lastError: FILE_MISSING });
                continue;
            }
            setCurrent({ id, progress: 0 });
            const outcome = await sendQueuedPhoto(
                queuedPhoto,
                (uploadedUrl) => patchPhoto(id, { uploadedUrl }),
                (progress) => setCurrent({ id, progress }),
            );
            if (outcome.isUploaded) {
                removePhoto(queuedPhoto);
                countUpload(summary, queuedPhoto);
                backoffStep.current = 0;
            } else if (outcome.errorKind === 'network' || !(await checkOnline())) {
                // Connection problems don't count as an attempt; the rest of the queue would fail the same way.
                patchPhoto(id, { lastError: outcome.code });
                return true;
            } else {
                recordFailure(queuedPhoto, outcome);
                shouldRetryLater = shouldRetryLater || (outcome.errorKind === 'retry' && queuedPhoto.attempts + 1 < MAX_ATTEMPTS);
            }
        }
        return shouldRetryLater;
    };

    const logUploads = (summary: UploadSummary) =>
        summary.forEach((counts, propertyId) =>
            logActivity({
                action: 'photo_upload',
                user,
                targetId: propertyId,
                targetLabel: counts.label,
                detail: `${counts.before} foto(s) Before, ${counts.after} foto(s) After`,
            }),
        );

    const scheduleRetry = () => {
        const delay = BACKOFF_MS[Math.min(backoffStep.current, BACKOFF_MS.length - 1)];
        backoffStep.current = backoffStep.current + 1;
        retryTimer.current = setTimeout(startUploading, delay);
    };

    const startUploading = async () => {
        if (isUploading.current) return;
        isUploading.current = true;
        clearTimeout(retryTimer.current);
        const summary: UploadSummary = new Map();
        const shouldRetryLater = await uploadWaitingPhotos(summary).catch((error: unknown) => {
            console.error('Error in the photo queue:', error);
            return true;
        });
        setCurrent(null);
        isUploading.current = false;
        logUploads(summary);
        if (shouldRetryLater && isMounted.current) scheduleRetry();
    };

    useWhenOnline(() => {
        backoffStep.current = 0;
        startUploading();
    }, loaded);

    // Compressed right away: the queue (and the phone) only keeps the optimized copy.
    const addPhotos = async (target: PhotoTarget, photoUris: string[]) => {
        for (const photoUri of photoUris) {
            const id = makeId('pp');
            const fileName = `${id}.jpg`;
            const compressedUri = await compressPhoto(photoUri, photoConfig);
            await new File(compressedUri).move(queuedFile(fileName));
            discardPickerCopy(photoUri);
            update((previous) => [...previous, { ...target, id, userId: user.id, fileName, attempts: 0 }]);
        }
    };

    const enqueue = async (target: PhotoTarget, photoUris: string[]) => {
        try {
            await addPhotos(target, photoUris);
        } catch (error) {
            startUploading();
            throw error;
        }
        startUploading();
    };

    const retryAll = () => {
        update((previous) =>
            previous.map((queuedPhoto) => (queuedPhoto.userId === user.id ? { ...queuedPhoto, attempts: 0, blocked: queuedPhoto.lastError === FILE_MISSING } : queuedPhoto)),
        );
        backoffStep.current = 0;
        startUploading();
    };

    const queue = items.filter((queuedPhoto) => queuedPhoto.userId === user.id);
    const value: PhotoQueueValue = {
        queue,
        current,
        enqueue,
        retryAll,
        pendingFor: (propertyId, kind) => queue.filter((queuedPhoto) => queuedPhoto.propertyId === propertyId && (!kind || queuedPhoto.kind === kind)),
        needsManualRetry,
        localUri: (queuedPhoto) => queuedFile(queuedPhoto.fileName).uri,
    };

    return <PhotoQueueContext.Provider value={value}>{children}</PhotoQueueContext.Provider>;
};

export const usePhotoQueue = (): PhotoQueueValue => {
    const context = useContext(PhotoQueueContext);
    if (!context) throw new Error('usePhotoQueue must be used inside <PhotoQueueProvider>');
    return context;
};

import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../config/firebase';

const STALL_TIMEOUT_MS = 45_000;
const STALL_CHECK_INTERVAL_MS = 5_000;
const LONG_CACHE_CONTROL = 'public, max-age=31536000';

interface UploadOptions {
    contentType: string;
    onProgress?: (progress: number) => void;
}

export const uploadToStorage = async (localUri: string, storagePath: string, { contentType, onProgress }: UploadOptions): Promise<string> => {
    const blob = await (await fetch(localUri)).blob();
    const uploadTask = uploadBytesResumable(ref(storage, storagePath), blob, { contentType, cacheControl: LONG_CACHE_CONTROL });
    let lastTransferredBytes = -1;
    let lastProgressAt = Date.now();
    const stallWatchdog = setInterval(() => {
        if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) uploadTask.cancel();
    }, STALL_CHECK_INTERVAL_MS);
    try {
        await new Promise<void>((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    if (snapshot.bytesTransferred !== lastTransferredBytes) {
                        lastTransferredBytes = snapshot.bytesTransferred;
                        lastProgressAt = Date.now();
                    }
                    onProgress?.(snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0);
                },
                reject,
                () => resolve(),
            );
        });
    } finally {
        clearInterval(stallWatchdog);
    }
    return getDownloadURL(uploadTask.snapshot.ref);
};

export const deleteFromStorage = (storagePath: string): Promise<void> => deleteObject(ref(storage, storagePath));

import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../config/firebase';
import type { PhotoConfig, PhotoKind } from '../types';

const sanitizeForPath = (str: string): string =>
    (str || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 80) || 'unknown';

let uploadCounter = 0;
const uniqueFileName = (prefix: string): string => {
    const seq = String(uploadCounter++ % 100000).padStart(5, '0');
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now()}_${seq}0_${rand}.jpg`;
};

function storagePathFor(clientName: string, address: string, kind: PhotoKind): string {
    const folder = kind === 'before' ? 'BeforePhotos' : 'AfterPhotos';
    return `${sanitizeForPath(clientName)}/${folder}/${uniqueFileName(sanitizeForPath(address))}`;
}

export function discard(file: File): void {
    try {
        if (file.exists) file.delete();
    } catch (err) {
        console.error('No se pudo borrar el archivo temporal:', err);
    }
}

export interface PickedPhoto {
    uri: string;
    width: number;
    height: number;
}

export type PickResult = { photos: PickedPhoto[] } | { denied: true };

const toPicked = (res: ImagePicker.ImagePickerResult): PickedPhoto[] => (res.canceled ? [] : res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height })));

export async function pickPhotos(source: 'camera' | 'library'): Promise<PickResult> {
    if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return { denied: true };
        const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
        return { photos: toPicked(res) };
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { denied: true };
    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 30,
        quality: 1,
    });
    return { photos: toPicked(res) };
}

export async function compressPhoto(photo: PickedPhoto, cfg: PhotoConfig): Promise<string> {
    const ctx = ImageManipulator.manipulate(photo.uri);
    const longest = Math.max(photo.width, photo.height);
    if (cfg.maxImageWidth > 0 && longest > cfg.maxImageWidth) {
        ctx.resize(photo.width >= photo.height ? { width: cfg.maxImageWidth } : { height: cfg.maxImageWidth });
    }
    const image = await ctx.renderAsync();
    try {
        const maxBytes = (cfg.maxSizeMB > 0 ? cfg.maxSizeMB : 1) * 1024 * 1024;
        let quality = Math.min(1, Math.max(0.4, cfg.compressionQuality || 0.85));
        let saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
        while (new File(saved.uri).size > maxBytes && quality > 0.4) {
            const prev = new File(saved.uri);
            quality = Math.max(0.4, quality - 0.15);
            saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
            discard(prev);
        }
        return saved.uri;
    } finally {
        image.release();
        ctx.release();
    }
}

const STALL_MS = 45_000;

async function uploadFile(localUri: string, storagePath: string, onProgress: (pct: number) => void): Promise<string> {
    const blob = await (await fetch(localUri)).blob();
    const task = uploadBytesResumable(ref(storage, storagePath), blob, { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' });
    let lastBytes = -1;
    let lastChange = Date.now();
    const watchdog = setInterval(() => {
        if (Date.now() - lastChange > STALL_MS) task.cancel();
    }, 5_000);
    try {
        await new Promise<void>((resolve, reject) => {
            task.on(
                'state_changed',
                (s) => {
                    if (s.bytesTransferred !== lastBytes) {
                        lastBytes = s.bytesTransferred;
                        lastChange = Date.now();
                    }
                    onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0);
                },
                reject,
                () => resolve(),
            );
        });
    } finally {
        clearInterval(watchdog);
    }
    return getDownloadURL(task.snapshot.ref);
}

interface UploadInput {
    propertyId: string;
    clientName: string;
    address: string;
    kind: PhotoKind;
    fileUri: string;
}

export async function uploadPhoto(input: UploadInput, onProgress: (pct: number) => void): Promise<void> {
    const url = await uploadFile(input.fileUri, storagePathFor(input.clientName, input.address, input.kind), onProgress);
    await updateDoc(doc(db, 'properties', input.propertyId), { [input.kind === 'before' ? 'beforePhotos' : 'afterPhotos']: arrayUnion(url) });
}

const codeOf = (err: unknown) => String((err as { code?: string })?.code || '');

export function uploadErrorKind(err: unknown): 'network' | 'permanent' | 'retry' {
    const code = codeOf(err);
    const msg = String((err as { message?: string })?.message || '').toLowerCase();
    if (/storage\/(retry-limit-exceeded|canceled|unknown)|unavailable|deadline-exceeded/.test(code) || msg.includes('network')) return 'network';
    if (/storage\/(unauthorized|quota-exceeded)|permission-denied|not-found/.test(code)) return 'permanent';
    return 'retry';
}

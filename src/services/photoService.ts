import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import type { PhotoConfig, PhotoKind } from '../types';
import { compressionSettingsOf, lowerQuality, MIN_QUALITY, smallerLongestSide } from '../utils/photoCompression';
import { uploadToStorage } from './storageService';

const MAX_LIBRARY_SELECTION = 30;

const sanitizeForPath = (text: string): string =>
    (text || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 80) || 'unknown';

let uploadSequence = 0;
const uniqueFileName = (prefix: string): string => {
    uploadSequence += 1;
    const sequence = String(uploadSequence % 100000).padStart(5, '0');
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now()}_${sequence}0_${random}.jpg`;
};

// Contract with the web: {Client}/BeforePhotos|AfterPhotos/{address}_{unique}.jpg
const storagePathFor = (clientName: string, address: string, kind: PhotoKind): string => {
    const folder = kind === 'before' ? 'BeforePhotos' : 'AfterPhotos';
    return `${sanitizeForPath(clientName)}/${folder}/${uniqueFileName(sanitizeForPath(address))}`;
};

export const discard = (file: File): void => {
    try {
        if (file.exists) file.delete();
    } catch (error) {
        console.error('Could not delete the temporary file:', error);
    }
};

/** Deletes the copy the picker left in the app cache. Never touches files outside the cache (the user's gallery). */
export const discardPickerCopy = (photoUri: string): void => {
    if (photoUri.startsWith(Paths.cache.uri)) discard(new File(photoUri));
};

export type PhotoSource = 'camera' | 'library';

export type PickResult = { photoUris: string[] } | { denied: true };

const photoUrisOf = (result: ImagePicker.ImagePickerResult): string[] => (result.canceled ? [] : result.assets.map((asset) => asset.uri));

export const pickPhotos = async (source: PhotoSource): Promise<PickResult> => {
    if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return { denied: true };
        return { photoUris: photoUrisOf(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })) };
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { denied: true };
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_LIBRARY_SELECTION, quality: 1 });
    return { photoUris: photoUrisOf(result) };
};

interface SavedPhoto {
    uri: string;
    bytes: number;
    quality: number;
}

const saveAsJpeg = async (image: ImageRef, quality: number): Promise<SavedPhoto> => {
    const { uri } = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    return { uri, bytes: new File(uri).size, quality };
};

/** Lowers the JPEG quality step by step until the file fits or the quality reaches its minimum. */
const saveUnderLimit = async (image: ImageRef, startQuality: number, maxBytes: number): Promise<SavedPhoto> => {
    let saved = await saveAsJpeg(image, startQuality);
    while (saved.bytes > maxBytes && saved.quality > MIN_QUALITY) {
        const heavier = saved;
        saved = await saveAsJpeg(image, lowerQuality(heavier.quality));
        discard(new File(heavier.uri));
    }
    return saved;
};

const saveAtLongestSide = async (original: ImageRef, longestSide: number, startQuality: number, maxBytes: number): Promise<SavedPhoto> => {
    if (Math.max(original.width, original.height) <= longestSide) return saveUnderLimit(original, startQuality, maxBytes);
    const context = ImageManipulator.manipulate(original);
    context.resize(original.width >= original.height ? { width: longestSide } : { height: longestSide });
    const resized = await context.renderAsync();
    try {
        return await saveUnderLimit(resized, startQuality, maxBytes);
    } finally {
        resized.release();
        context.release();
    }
};

/**
 * Resizes and recompresses a photo following app_settings/photo_config (same rules as the web):
 * longest side ≤ maxImageWidth, JPEG at compressionQuality, lowered until it weighs ≤ maxSizeMB.
 * If it is still too heavy at the lowest quality, it shrinks the photo further.
 * The real size is read from the decoded image: the picker may report 0 × 0.
 */
export const compressPhoto = async (photoUri: string, photoConfig: PhotoConfig): Promise<string> => {
    const { maxLongestSide, startQuality, maxBytes } = compressionSettingsOf(photoConfig);
    const context = ImageManipulator.manipulate(photoUri);
    const original = await context.renderAsync();
    try {
        let longestSide = Math.min(maxLongestSide, Math.max(original.width, original.height));
        let saved = await saveAtLongestSide(original, longestSide, startQuality, maxBytes);
        let nextLongestSide = smallerLongestSide(longestSide, saved.bytes, maxBytes);
        while (nextLongestSide !== null) {
            const heavier = saved;
            longestSide = nextLongestSide;
            saved = await saveAtLongestSide(original, longestSide, heavier.quality, maxBytes);
            discard(new File(heavier.uri));
            nextLongestSide = smallerLongestSide(longestSide, saved.bytes, maxBytes);
        }
        return saved.uri;
    } finally {
        original.release();
        context.release();
    }
};

interface PhotoUpload {
    clientName: string;
    address: string;
    kind: PhotoKind;
    fileUri: string;
}

/** Uploads the file to Storage and returns its download URL. Linking it to the house is a separate step. */
export const uploadPhotoFile = ({ clientName, address, kind, fileUri }: PhotoUpload, onProgress: (progress: number) => void): Promise<string> =>
    uploadToStorage(fileUri, storagePathFor(clientName, address, kind), { contentType: 'image/jpeg', onProgress });

export type UploadErrorKind = 'network' | 'permanent' | 'retry';

const errorCodeOf = (error: unknown) => String((error as { code?: string })?.code || '');

export const uploadErrorKind = (error: unknown): UploadErrorKind => {
    const code = errorCodeOf(error);
    const message = String((error as { message?: string })?.message || '').toLowerCase();
    if (/storage\/(retry-limit-exceeded|canceled)|unavailable|deadline-exceeded/.test(code) || message.includes('network')) return 'network';
    if (/storage\/(unauthorized|quota-exceeded)|permission-denied|not-found/.test(code)) return 'permanent';
    return 'retry';
};

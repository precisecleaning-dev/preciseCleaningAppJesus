import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import type { PhotoConfig } from '../types';
import { makeId } from '../utils/ids';
import type { PreparedAttachmentFile } from './attachmentsService';
import { compressPhoto, discard } from './photoService';

export type AttachmentSource = 'camera' | 'library' | 'document';

export interface PickedAttachmentFile {
    pickId: string;
    localUri: string;
    name: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
}

export type AttachmentPickResult = { files: PickedAttachmentFile[] } | { denied: true };

export interface ReadyAttachmentFile extends PreparedAttachmentFile {
    isTemporaryCopy: boolean;
}

const UNKNOWN_MIME_TYPE = 'application/octet-stream';
const MAX_SELECTION = 10;

const ATTACHMENT_IMAGE_SETTINGS: PhotoConfig = {
    allowTakePhoto: true,
    allowUploadFromDevice: true,
    compressionQuality: 0.85,
    maxImageWidth: 1920,
    maxSizeMB: 1,
};

export const isImageType = (mimeType: string): boolean => mimeType.startsWith('image/');

const fallbackPhotoName = (index: number) => `photo-${Date.now()}-${index + 1}.jpg`;

const fromImagePicker = (result: ImagePicker.ImagePickerResult): PickedAttachmentFile[] =>
    result.canceled
        ? []
        : result.assets.map((asset, index) => ({
              pickId: makeId('file'),
              localUri: asset.uri,
              name: asset.fileName || fallbackPhotoName(index),
              mimeType: asset.mimeType || 'image/jpeg',
              size: asset.fileSize ?? 0,
              width: asset.width,
              height: asset.height,
          }));

const fromDocumentPicker = (result: DocumentPicker.DocumentPickerResult): PickedAttachmentFile[] =>
    result.canceled
        ? []
        : result.assets.map((asset) => ({
              pickId: makeId('file'),
              localUri: asset.uri,
              name: asset.name,
              mimeType: asset.mimeType || UNKNOWN_MIME_TYPE,
              size: asset.size ?? 0,
              width: 0,
              height: 0,
          }));

export const pickAttachmentFiles = async (source: AttachmentSource): Promise<AttachmentPickResult> => {
    if (source === 'document') return { files: fromDocumentPicker(await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true })) };
    if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return { denied: true };
        return { files: fromImagePicker(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })) };
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { denied: true };
    return {
        files: fromImagePicker(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_SELECTION, quality: 1 })),
    };
};

const imageSizeOf = (localUri: string): Promise<{ width: number; height: number }> =>
    Image.getSize(localUri).catch((error: unknown) => {
        console.error('Could not read image size, compressing without resizing:', error);
        return { width: 0, height: 0 };
    });

const sizeOf = (localUri: string, fallbackSize: number): number => {
    const size = new File(localUri).size;
    return size > 0 ? size : fallbackSize;
};

export const prepareAttachmentFile = async (picked: PickedAttachmentFile): Promise<ReadyAttachmentFile> => {
    const original: ReadyAttachmentFile = {
        localUri: picked.localUri,
        name: picked.name,
        type: picked.mimeType,
        size: sizeOf(picked.localUri, picked.size),
        isTemporaryCopy: false,
    };
    if (!isImageType(picked.mimeType)) return original;
    const { width, height } = picked.width > 0 && picked.height > 0 ? picked : await imageSizeOf(picked.localUri);
    return compressPhoto({ uri: picked.localUri, width, height }, ATTACHMENT_IMAGE_SETTINGS)
        .then((compressedUri): ReadyAttachmentFile => ({ localUri: compressedUri, name: picked.name, type: 'image/jpeg', size: sizeOf(compressedUri, 0), isTemporaryCopy: true }))
        .catch((error: unknown) => {
            console.error('Image compression failed, uploading the original:', error);
            return original;
        });
};

export const discardPreparedFile = (file: ReadyAttachmentFile) => {
    if (file.isTemporaryCopy) discard(new File(file.localUri));
};

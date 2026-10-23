import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TaskAttachment } from '../types/tasks';
import { attachmentStoragePath, type AttachmentOwner } from '../utils/attachmentPaths';
import { deleteFromStorage, uploadToStorage } from './storageService';

export interface PreparedAttachmentFile {
    localUri: string;
    name: string;
    type: string;
    size: number;
}

const ownerReference = (owner: AttachmentOwner) => doc(db, owner.collection, owner.id);

export const uploadAttachment = async (owner: AttachmentOwner, file: PreparedAttachmentFile, onProgress?: (progress: number) => void): Promise<TaskAttachment> => {
    const path = attachmentStoragePath(owner, file.name, Date.now());
    const url = await uploadToStorage(file.localUri, path, { contentType: file.type, onProgress });
    const attachment: TaskAttachment = { name: file.name, url, path, type: file.type, size: file.size };
    try {
        await updateDoc(ownerReference(owner), { attachments: arrayUnion(attachment) });
    } catch (error) {
        await deleteFromStorage(path).catch(() => undefined);
        throw error;
    }
    return attachment;
};

export const removeAttachment = async (owner: AttachmentOwner, attachment: TaskAttachment): Promise<void> => {
    await updateDoc(ownerReference(owner), { attachments: arrayRemove(attachment) });
    await deleteFromStorage(attachment.path).catch((error: unknown) => console.error('Attachment file could not be deleted:', error));
};

export type AttachmentOwnerCollection = 'user_tasks';

export interface AttachmentOwner {
    collection: AttachmentOwnerCollection;
    id: string;
}

export const safeAttachmentFileName = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

export const attachmentStoragePath = (owner: AttachmentOwner, name: string, timestamp: number): string =>
    `${owner.collection}/${owner.id}/${timestamp}-${safeAttachmentFileName(name)}`;

import { useState } from 'react';
import { Alert } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useOnline } from '../context/NetworkContext';
import { discardPreparedFile, pickAttachmentFiles, prepareAttachmentFile, type AttachmentSource, type PickedAttachmentFile } from '../services/attachmentFilesService';
import { removeAttachment, uploadAttachment } from '../services/attachmentsService';
import type { AttachmentOwner } from '../utils/attachmentPaths';
import type { TaskAttachment } from '../types/tasks';
import { confirmAction } from '../utils/confirm';
import { errorCode } from '../utils/ids';
import { MAX_ATTACHMENT_BYTES } from '../utils/fileSize';

export interface UploadProgress {
    fileName: string;
    position: number;
    total: number;
    progress: number;
}

interface UploadSummary {
    uploaded: TaskAttachment[];
    failedNames: string[];
}

const uploadOneFile = (owner: AttachmentOwner, picked: PickedAttachmentFile, onProgress: (progress: number) => void): Promise<TaskAttachment | null> =>
    prepareAttachmentFile(picked).then((prepared) => {
        if (prepared.size > MAX_ATTACHMENT_BYTES) {
            discardPreparedFile(prepared);
            return null;
        }
        return uploadAttachment(owner, prepared, onProgress)
            .then((attachment) => {
                discardPreparedFile(prepared);
                return attachment;
            })
            .catch((error: unknown) => {
                discardPreparedFile(prepared);
                console.error('Attachment upload failed:', error);
                return null;
            });
    });

const uploadSequentially = (owner: AttachmentOwner, files: PickedAttachmentFile[], onFileProgress: (progress: UploadProgress) => void): Promise<UploadSummary> =>
    files.reduce<Promise<UploadSummary>>(
        (previous, file, index) =>
            previous.then((summary) =>
                uploadOneFile(owner, file, (progress) => onFileProgress({ fileName: file.name, position: index + 1, total: files.length, progress })).then((attachment) =>
                    attachment ? { ...summary, uploaded: [...summary.uploaded, attachment] } : { ...summary, failedNames: [...summary.failedNames, file.name] },
                ),
            ),
        Promise.resolve({ uploaded: [], failedNames: [] }),
    );

export const useAttachments = () => {
    const isOnline = useOnline();
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

    const pickFiles = (source: AttachmentSource): Promise<PickedAttachmentFile[]> =>
        pickAttachmentFiles(source)
            .then((result) => {
                if ('denied' in result) {
                    Alert.alert(t.error, source === 'camera' ? t.cameraDenied : t.galleryDenied);
                    return [];
                }
                return result.files;
            })
            .catch((error: unknown) => {
                console.error('Picking attachments failed:', error);
                Alert.alert(t.error, fmt(t.attachmentsPickError, { code: errorCode(error) }));
                return [];
            });

    const uploadFiles = (owner: AttachmentOwner, files: PickedAttachmentFile[]): Promise<UploadSummary> => {
        if (files.length === 0) return Promise.resolve({ uploaded: [], failedNames: [] });
        if (!isOnline) {
            Alert.alert(t.tasksOfflineTitle, t.attachmentsOffline);
            return Promise.resolve({ uploaded: [], failedNames: files.map((file) => file.name) });
        }
        setUploadProgress({ fileName: files[0].name, position: 1, total: files.length, progress: 0 });
        return uploadSequentially(owner, files, setUploadProgress).then((summary) => {
            setUploadProgress(null);
            if (summary.failedNames.length > 0) Alert.alert(t.attachmentsUploadFailedTitle, fmt(t.attachmentsUploadFailedBody, { names: summary.failedNames.join('\n') }));
            return summary;
        });
    };

    const confirmAndRemove = (owner: AttachmentOwner, attachment: TaskAttachment): Promise<boolean> => {
        if (!isOnline) {
            Alert.alert(t.tasksOfflineTitle, t.attachmentsOffline);
            return Promise.resolve(false);
        }
        return confirmAction(t.attachmentRemoveConfirmTitle, fmt(t.attachmentRemoveConfirmBody, { name: attachment.name }), t.attachmentRemove, t.cancel, true).then(
            (isConfirmed) => {
                if (!isConfirmed) return false;
                return removeAttachment(owner, attachment)
                    .then(() => true)
                    .catch((error: unknown) => {
                        console.error('Removing attachment failed:', error);
                        Alert.alert(t.error, fmt(t.taskSaveError, { code: errorCode(error) }));
                        return false;
                    });
            },
        );
    };

    return { uploadProgress, isUploading: uploadProgress !== null, pickFiles, uploadFiles, confirmAndRemove };
};

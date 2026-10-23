import { Image } from 'expo-image';
import { Camera, FileText, ImagePlus, Paperclip, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, View } from 'react-native';
import { fmt, t } from '../constants/strings';
import type { UploadProgress } from '../hooks/useAttachments';
import { isImageType, type AttachmentSource, type PickedAttachmentFile } from '../services/attachmentFilesService';
import { colors } from '../theme/tokens';
import type { TaskAttachment } from '../types/tasks';
import { formatFileSize } from '../utils/fileSize';
import { styles } from './AttachmentsSection.styles';
import PhotoViewer from './PhotoViewer';
import AppText from './ui/AppText';
import Button from './ui/Button';
import Touchable from './ui/Touchable';

interface Props {
    attachments: TaskAttachment[];
    pendingFiles?: PickedAttachmentFile[];
    pendingNote?: string;
    canUpload: boolean;
    canRemove: boolean;
    uploadProgress?: UploadProgress | null;
    onAdd: (source: AttachmentSource) => void;
    onRemove?: (attachment: TaskAttachment) => void;
    onRemovePending?: (index: number) => void;
}

interface AttachmentItem {
    key: string;
    name: string;
    type: string;
    size: number;
    uri: string;
    isPending: boolean;
    onRemove?: () => void;
}

const ADD_SOURCES: { source: AttachmentSource; label: string; icon: typeof Camera }[] = [
    { source: 'camera', label: t.attachmentCamera, icon: Camera },
    { source: 'library', label: t.attachmentPhotos, icon: ImagePlus },
    { source: 'document', label: t.attachmentFiles, icon: Paperclip },
];

const openFile = (url: string) => Linking.openURL(url).catch(() => Alert.alert(t.error, t.attachmentOpenError));

const AttachmentsSection = ({ attachments, pendingFiles = [], pendingNote, canUpload, canRemove, uploadProgress, onAdd, onRemove, onRemovePending }: Props) => {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const isUploading = !!uploadProgress;

    const items: AttachmentItem[] = [
        ...attachments.map((attachment) => ({
            key: attachment.path || attachment.url,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            uri: attachment.url,
            isPending: false,
            onRemove: canRemove && onRemove ? () => onRemove(attachment) : undefined,
        })),
        ...pendingFiles.map((file, index) => ({
            key: `pending-${file.localUri}`,
            name: file.name,
            type: file.mimeType,
            size: file.size,
            uri: file.localUri,
            isPending: true,
            onRemove: onRemovePending ? () => onRemovePending(index) : undefined,
        })),
    ];
    const images = items.filter((item) => isImageType(item.type));
    const files = items.filter((item) => !isImageType(item.type));

    return (
        <View style={styles.wrap}>
            <AppText variant="title">{t.taskAttachments}</AppText>

            {items.length === 0 && (
                <AppText variant="small" tone="soft">
                    {t.attachmentsEmpty}
                </AppText>
            )}

            {images.length > 0 && (
                <View style={styles.thumbnails}>
                    {images.map((image, index) => (
                        <View key={image.key} style={styles.thumbnailSlot}>
                            <Touchable onPress={() => setViewerIndex(index)} accessibilityLabel={image.name} style={[styles.thumbnail, image.isPending && styles.pending]}>
                                <Image source={{ uri: image.uri }} style={styles.thumbnailImage} contentFit="cover" />
                            </Touchable>
                            {image.onRemove && (
                                <Touchable onPress={image.onRemove} style={styles.removeBadge} accessibilityLabel={t.attachmentRemove} hitSlop={8}>
                                    <X size={14} color={colors.white} />
                                </Touchable>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {files.map((file) => (
                <View key={file.key} style={[styles.fileRow, file.isPending && styles.pending]}>
                    <Touchable onPress={() => (file.isPending ? undefined : openFile(file.uri))} style={styles.fileInfo} accessibilityLabel={file.name}>
                        <FileText size={20} color={colors.primary} />
                        <View style={styles.fileText}>
                            <AppText variant="body" numberOfLines={1}>
                                {file.name}
                            </AppText>
                            {!!file.size && (
                                <AppText variant="caption" tone="muted">
                                    {formatFileSize(file.size)}
                                </AppText>
                            )}
                        </View>
                    </Touchable>
                    {file.onRemove && (
                        <Touchable onPress={file.onRemove} style={styles.removeButton} accessibilityLabel={t.attachmentRemove}>
                            <X size={18} color={colors.textMuted} />
                        </Touchable>
                    )}
                </View>
            ))}

            {pendingFiles.length > 0 && !!pendingNote && (
                <AppText variant="caption" tone="muted">
                    {pendingNote}
                </AppText>
            )}

            {uploadProgress && (
                <View style={styles.progressRow}>
                    <ActivityIndicator color={colors.primary} />
                    <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.progressText}>
                        {fmt(t.attachmentUploading, {
                            position: uploadProgress.position,
                            total: uploadProgress.total,
                            name: uploadProgress.fileName,
                            percent: Math.round(uploadProgress.progress * 100),
                        })}
                    </AppText>
                </View>
            )}

            {canUpload && (
                <View style={styles.addRow}>
                    {ADD_SOURCES.map(({ source, label, icon: Icon }) => (
                        <View key={source} style={styles.addButton}>
                            <Button
                                label={label}
                                variant="soft"
                                size="sm"
                                onPress={() => onAdd(source)}
                                disabled={isUploading}
                                icon={<Icon size={16} color={colors.primaryDark} />}
                            />
                        </View>
                    ))}
                </View>
            )}

            <PhotoViewer uris={images.map((image) => image.uri)} index={viewerIndex} onClose={() => setViewerIndex(null)} />
        </View>
    );
};

export default AttachmentsSection;

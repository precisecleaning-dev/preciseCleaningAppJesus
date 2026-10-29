import { Image } from 'expo-image';
import { Camera, ImagePlus, RefreshCw, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { usePhotoQueue, type QueuedPhoto } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import { pickPhotos, type PhotoSource } from '../services/photoService';
import { accents, colors } from '../theme/tokens';
import type { PhotoKind } from '../types';
import { errorCode } from '../utils/ids';
import { styles } from './PhotoSection.styles';
import PhotoViewer from './PhotoViewer';
import AppText from './ui/AppText';
import Button from './ui/Button';
import ProgressRing from './ui/ProgressRing';
import Touchable from './ui/Touchable';

interface Props {
    kind: PhotoKind;
    urls: string[];
    propertyId: string;
    clientName: string;
    address: string;
    label: string;
    canAdd: boolean;
}

interface AddTile {
    type: 'add';
    key: string;
    source: PhotoSource;
}

interface PhotoTile {
    type: 'photo';
    key: string;
    uri: string;
    isPending: boolean;
    hasFailed: boolean;
    progress?: number;
}

type Tile = AddTile | PhotoTile;

interface AddTileLook {
    icon: LucideIcon;
    label: string;
    tileStyle: StyleProp<ViewStyle>;
    textStyle: StyleProp<TextStyle>;
    iconColor: string;
}

const ADD_TILE_LOOK: Record<PhotoSource, AddTileLook> = {
    camera: { icon: Camera, label: t.takePhoto, tileStyle: styles.addCamera, textStyle: styles.addCamText, iconColor: accents.violet.ink },
    library: { icon: ImagePlus, label: t.pickPhoto, tileStyle: styles.addGallery, textStyle: styles.addGalText, iconColor: accents.sky.ink },
};

const PhotoSection = ({ kind, urls, propertyId, clientName, address, label, canAdd }: Props) => {
    const { photoConfig } = useCatalogs();
    const { isElementVisible, isFieldReadOnly } = useSession();
    const { pendingFor, enqueue, current, localUri, needsManualRetry, retryAll } = usePhotoQueue();
    const [isAdding, setAdding] = useState(false);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    const pendingPhotos = pendingFor(propertyId, kind);
    const stuckCount = pendingPhotos.filter(needsManualRetry).length;
    const uploadingPhoto = pendingPhotos.find((queuedPhoto) => current?.id === queuedPhoto.id);
    const uploadProgress = uploadingPhoto ? (current?.progress ?? 0) : 0;

    const toPendingTile = (queuedPhoto: QueuedPhoto): PhotoTile => ({
        type: 'photo',
        key: queuedPhoto.id,
        uri: localUri(queuedPhoto),
        isPending: true,
        hasFailed: !!queuedPhoto.blocked || queuedPhoto.attempts > 0,
        progress: current?.id === queuedPhoto.id ? current.progress : undefined,
    });
    const photoTiles: PhotoTile[] = [
        ...urls.map((url): PhotoTile => ({ type: 'photo', key: url, uri: url, isPending: false, hasFailed: false })),
        ...pendingPhotos.map(toPendingTile),
    ];

    const isWritable = canAdd && !isFieldReadOnly(`${kind}Photos`);
    const addSources: PhotoSource[] = [
        ...(isWritable && photoConfig.allowTakePhoto && isElementVisible('btn_takePhoto') ? ['camera' as const] : []),
        ...(isWritable && photoConfig.allowUploadFromDevice && isElementVisible('btn_uploadPhoto') ? ['library' as const] : []),
    ];
    const tiles: Tile[] = [...addSources.map((source): AddTile => ({ type: 'add', key: `add-${source}`, source })), ...photoTiles];

    const totalCount = urls.length + pendingPhotos.length;
    const ringProgress = totalCount === 0 ? 0 : (urls.length + uploadProgress) / totalCount;
    const hasPending = pendingPhotos.length > 0;

    const subtitleText = (): string => {
        if (stuckCount > 0) return fmt(t.photosNotUploaded, { n: stuckCount });
        if (uploadingPhoto) return fmt(t.uploading, { pct: Math.round(uploadProgress * 100) });
        if (hasPending) return fmt(t.queued, { n: pendingPhotos.length });
        return totalCount === 0 ? t.noPhotos : `${urls.length} ✓`;
    };

    const handleAddPress = async (source: PhotoSource) => {
        try {
            const result = await pickPhotos(source);
            if ('denied' in result) {
                Alert.alert(t.error, source === 'camera' ? t.cameraDenied : t.galleryDenied);
                return;
            }
            if (result.photoUris.length === 0) return;
            setAdding(true);
            await enqueue({ propertyId, clientName, address, label, kind }, result.photoUris);
        } catch (error) {
            console.error('Error adding photos:', error);
            Alert.alert(t.error, `${t.uploadError}\n${errorCode(error)}`);
        }
        setAdding(false);
    };

    const photoUris = photoTiles.map((photoTile) => photoTile.uri);

    const renderTile = ({ item: tile }: { item: Tile }) => {
        if (tile.type === 'add') {
            const look = ADD_TILE_LOOK[tile.source];
            const Icon = look.icon;
            return (
                <Touchable onPress={() => handleAddPress(tile.source)} disabled={isAdding} style={[styles.addTile, look.tileStyle]} accessibilityLabel={look.label}>
                    <Icon size={24} color={look.iconColor} strokeWidth={2.2} />
                    <AppText variant="caption" style={look.textStyle}>
                        {look.label}
                    </AppText>
                </Touchable>
            );
        }
        return (
            <Touchable onPress={() => setViewerIndex(photoUris.indexOf(tile.uri))} accessibilityRole="imagebutton">
                <Image source={{ uri: tile.uri }} style={styles.thumb} contentFit="cover" />
                {tile.isPending && (
                    <View style={styles.thumbOverlay}>
                        {tile.hasFailed ? <TriangleAlert size={20} color={colors.white} /> : <ActivityIndicator color={colors.white} />}
                        {typeof tile.progress === 'number' && (
                            <AppText variant="caption" tone="inverse">
                                {Math.round(tile.progress * 100)}%
                            </AppText>
                        )}
                    </View>
                )}
            </Touchable>
        );
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.header}>
                <ProgressRing size={44} stroke={5} progress={ringProgress} color={hasPending ? accents.amber.solid : accents.mint.solid} track={colors.border}>
                    <AppText variant="caption">{totalCount}</AppText>
                </ProgressRing>
                <View style={styles.titles}>
                    <AppText variant="title">{kind === 'before' ? t.before : t.after}</AppText>
                    <AppText variant="caption" style={hasPending ? styles.subPending : styles.sub}>
                        {subtitleText()}
                    </AppText>
                </View>
                {isAdding && <ActivityIndicator color={colors.primary} />}
                {!isAdding && stuckCount > 0 && (
                    <Button variant="soft" size="sm" label={t.retryUpload} onPress={retryAll} icon={<RefreshCw size={16} color={colors.primaryDark} />} />
                )}
            </View>

            {tiles.length > 0 && (
                <FlatList
                    horizontal
                    data={tiles}
                    keyExtractor={(tile) => tile.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.strip}
                    renderItem={renderTile}
                />
            )}

            <PhotoViewer uris={photoUris} index={viewerIndex} onClose={() => setViewerIndex(null)} />
        </View>
    );
};

export default PhotoSection;

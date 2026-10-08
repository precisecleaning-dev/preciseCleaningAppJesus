// src/components/PhotoSection.tsx
// ⭐ Fotos Before o After de una casa.
//    · Anillo de color: verde cuando todo está en la nube, ámbar mientras hay
//      fotos en cola (con el % de la que está subiendo).
//    · Botones Cámara / Galería como las primeras miniaturas de la tira,
//      respetando Photo Settings (allowTakePhoto / allowUploadFromDevice) y
//      Configure Fields (btn_takePhoto / btn_uploadPhoto) de la web.
//    · Cada foto nueva entra con un pequeño "zoom".
import { Image } from 'expo-image';
import { Camera, ImagePlus, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useCatalogs } from '../context/CatalogsContext';
import { useLanguage } from '../context/LanguageContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import { fmt } from '../i18n/strings';
import { pickPhotos } from '../services/photoService';
import { accents, colors } from '../theme/tokens';
import type { PhotoKind } from '../types';
import { styles } from './PhotoSection.styles';
import PhotoViewer from './PhotoViewer';
import AppText from './ui/AppText';
import PressableScale from './ui/PressableScale';
import ProgressRing from './ui/ProgressRing';

interface Props {
  kind: PhotoKind;
  urls: string[];
  propertyId: string;
  clientName: string;
  address: string;
  label: string;
  canAdd: boolean;
}

type Tile =
  | { type: 'add'; key: string; source: 'camera' | 'library' }
  | { type: 'photo'; key: string; uri: string; pending: boolean; failed: boolean; progress?: number };

export default function PhotoSection({ kind, urls, propertyId, clientName, address, label, canAdd }: Props) {
  const { t } = useLanguage();
  const { photoConfig } = useCatalogs();
  const { isElementVisible } = useSession();
  const { pendingFor, enqueue, current, localUri } = usePhotoQueue();
  const [busy, setBusy] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const pending = pendingFor(propertyId, kind);
  const photos: Tile[] = [
    ...urls.map((u): Tile => ({ type: 'photo', key: u, uri: u, pending: false, failed: false })),
    ...pending.map(
      (q): Tile => ({ type: 'photo', key: q.id, uri: localUri(q), pending: true, failed: !!q.blocked || q.attempts > 0, progress: current?.id === q.id ? current.progress : undefined }),
    ),
  ];
  const showCamera = canAdd && photoConfig.allowTakePhoto && isElementVisible('btn_takePhoto');
  const showGallery = canAdd && photoConfig.allowUploadFromDevice && isElementVisible('btn_uploadPhoto');
  const tiles: Tile[] = [
    ...(showCamera ? [{ type: 'add', key: 'add-camera', source: 'camera' } as Tile] : []),
    ...(showGallery ? [{ type: 'add', key: 'add-library', source: 'library' } as Tile] : []),
    ...photos,
  ];

  const total = urls.length + pending.length;
  const uploadingNow = pending.find((q) => current?.id === q.id);
  const ringProgress = total === 0 ? 0 : (urls.length + (uploadingNow ? current?.progress || 0 : 0)) / total;
  const ringColor = pending.length > 0 ? accents.amber.solid : accents.mint.solid;
  const subtitle =
    pending.length > 0
      ? uploadingNow
        ? fmt(t.uploading, { pct: Math.round((current?.progress || 0) * 100) })
        : fmt(t.queued, { n: pending.length })
      : total === 0
        ? t.noPhotos
        : `${urls.length} ✓`;

  const add = async (source: 'camera' | 'library') => {
    try {
      const res = await pickPhotos(source);
      if ('denied' in res) {
        Alert.alert(t.error, source === 'camera' ? t.cameraDenied : t.galleryDenied);
        return;
      }
      if (res.photos.length === 0) return;
      setBusy(true);
      await enqueue({ propertyId, clientName, address, label, kind, photos: res.photos });
    } catch (err) {
      console.error('Error agregando fotos:', err);
      Alert.alert(t.error, `${t.uploadError}\n${String((err as Error)?.message || err)}`);
    } finally {
      setBusy(false);
    }
  };

  const photoUris = photos.flatMap((p) => (p.type === 'photo' ? [p.uri] : []));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ProgressRing size={44} stroke={5} progress={ringProgress} color={ringColor} track={colors.border}>
          <AppText variant="caption">{total}</AppText>
        </ProgressRing>
        <View style={styles.titles}>
          <AppText variant="title">{kind === 'before' ? t.before : t.after}</AppText>
          <AppText variant="caption" style={pending.length > 0 ? styles.subPending : styles.sub}>
            {subtitle}
          </AppText>
        </View>
        {busy && <ActivityIndicator color={colors.primary} />}
      </View>

      {tiles.length > 0 && (
        <FlatList
          horizontal
          data={tiles}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          renderItem={({ item }) => {
            if (item.type === 'add') {
              const isCam = item.source === 'camera';
              const Icon = isCam ? Camera : ImagePlus;
              return (
                <PressableScale
                  onPress={() => add(item.source)}
                  disabled={busy}
                  style={[styles.addTile, isCam ? styles.addCamera : styles.addGallery]}
                  accessibilityLabel={isCam ? t.takePhoto : t.pickPhoto}
                >
                  <Icon size={24} color={isCam ? accents.violet.ink : accents.sky.ink} strokeWidth={2.2} />
                  <AppText variant="caption" style={isCam ? styles.addCamText : styles.addGalText}>
                    {isCam ? t.takePhoto : t.pickPhoto}
                  </AppText>
                </PressableScale>
              );
            }
            const idx = photoUris.indexOf(item.uri);
            return (
              <Animated.View entering={ZoomIn.springify().damping(14)}>
                <Pressable onPress={() => setViewerIndex(idx)} accessibilityRole="imagebutton">
                  <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" transition={200} />
                  {item.pending && (
                    <View style={styles.thumbOverlay}>
                      {item.failed ? <TriangleAlert size={20} color={colors.white} /> : <ActivityIndicator color={colors.white} />}
                      {typeof item.progress === 'number' && (
                        <AppText variant="caption" tone="inverse">
                          {Math.round(item.progress * 100)}%
                        </AppText>
                      )}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          }}
        />
      )}

      <PhotoViewer uris={photoUris} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

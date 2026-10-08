// src/components/PhotoSection.tsx
// ⭐ Fotos Before o After de una casa: las ya subidas (URLs en Firestore) más
//    las que siguen en la cola local, con su progreso. Los botones Cámara /
//    Galería respetan Photo Settings (allowTakePhoto / allowUploadFromDevice)
//    y Configure Fields (btn_takePhoto / btn_uploadPhoto) de la web.
import { Image } from 'expo-image';
import { Camera, CloudUpload, ImagePlus, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useCatalogs } from '../context/CatalogsContext';
import { useLanguage } from '../context/LanguageContext';
import { usePhotoQueue } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import { pickPhotos } from '../services/photoService';
import { colors } from '../theme/tokens';
import type { PhotoKind } from '../types';
import ActionButton from './ActionButton';
import { styles } from './PhotoSection.styles';
import PhotoViewer from './PhotoViewer';

interface Props {
  kind: PhotoKind;
  urls: string[];
  propertyId: string;
  clientName: string;
  address: string;
  label: string;
  canAdd: boolean;
}

type Tile = { key: string; uri: string; pending: boolean; failed: boolean; progress?: number };

export default function PhotoSection({ kind, urls, propertyId, clientName, address, label, canAdd }: Props) {
  const { t } = useLanguage();
  const { photoConfig } = useCatalogs();
  const { isElementVisible } = useSession();
  const { pendingFor, enqueue, current, localUri } = usePhotoQueue();
  const [busy, setBusy] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const pending = pendingFor(propertyId, kind);
  const tiles: Tile[] = [
    ...urls.map((u) => ({ key: u, uri: u, pending: false, failed: false })),
    ...pending.map((q) => ({
      key: q.id,
      uri: localUri(q),
      pending: true,
      failed: !!q.blocked || q.attempts > 0,
      progress: current?.id === q.id ? current.progress : undefined,
    })),
  ];

  const showCamera = canAdd && photoConfig.allowTakePhoto && isElementVisible('btn_takePhoto');
  const showGallery = canAdd && photoConfig.allowUploadFromDevice && isElementVisible('btn_uploadPhoto');

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

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {kind === 'before' ? t.before : t.after} · {urls.length}
        </Text>
        {pending.length > 0 && (
          <View style={styles.pendingTag}>
            <CloudUpload size={14} color={colors.warning} />
            <Text style={styles.pendingText}>{pending.length}</Text>
          </View>
        )}
      </View>

      {tiles.length === 0 ? (
        <Text style={styles.empty}>{t.noPhotos}</Text>
      ) : (
        <FlatList
          horizontal
          data={tiles}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setViewerIndex(index)} accessibilityRole="imagebutton">
              <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" transition={150} />
              {item.pending && (
                <View style={styles.thumbOverlay}>
                  {item.failed ? (
                    <TriangleAlert size={20} color={colors.white} />
                  ) : (
                    <ActivityIndicator color={colors.white} />
                  )}
                  {typeof item.progress === 'number' && (
                    <Text style={styles.thumbProgress}>{Math.round(item.progress * 100)}%</Text>
                  )}
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      {(showCamera || showGallery) && (
        <View style={styles.actions}>
          {showCamera && (
            <View style={styles.actionItem}>
              <ActionButton
                compact
                variant="outline"
                label={t.takePhoto}
                icon={<Camera size={18} color={colors.primary} />}
                onPress={() => add('camera')}
                loading={busy}
              />
            </View>
          )}
          {showGallery && (
            <View style={styles.actionItem}>
              <ActionButton
                compact
                variant="outline"
                label={t.pickPhoto}
                icon={<ImagePlus size={18} color={colors.primary} />}
                onPress={() => add('library')}
                disabled={busy}
              />
            </View>
          )}
        </View>
      )}

      <PhotoViewer uris={tiles.map((x) => x.uri)} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

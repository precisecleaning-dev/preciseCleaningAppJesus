// src/services/photoService.ts
// ⭐ Captura, compresión y subida de fotos Before/After.
//
//    Compatibilidad con la web (storageService.ts):
//    · MISMA ruta de Storage: {Cliente}/BeforePhotos|AfterPhotos/{dirección}_{marca única}.jpg
//    · MISMO nombre único por construcción (tiempo + contador + azar): nunca
//      se pisan fotos aunque se suban varias en el mismo milisegundo.
//    · Las URLs se agregan a `beforePhotos` / `afterPhotos` de la casa.
//      Aquí con arrayUnion (atómico): si la web y el teléfono suben a la vez,
//      no se pierde ninguna URL.
//    · Compresión con la config de app_settings/photo_config (Photo Settings).
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

export function storagePathFor(clientName: string, address: string, kind: PhotoKind): string {
  const folder = kind === 'before' ? 'BeforePhotos' : 'AfterPhotos';
  return `${sanitizeForPath(clientName)}/${folder}/${uniqueFileName(sanitizeForPath(address))}`;
}

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

export type PickResult = { photos: PickedPhoto[] } | { denied: true };

const toPicked = (res: ImagePicker.ImagePickerResult): PickedPhoto[] =>
  res.canceled ? [] : res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));

/** Abre la cámara o la galería. La galería permite varias fotos a la vez. */
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

/**
 * Misma regla que imageCompression.ts de la web:
 *  · el LADO MÁS LARGO queda en maxImageWidth (una foto vertical también se reduce);
 *  · se comprime con compressionQuality y, si el archivo sigue pasando de
 *    maxSizeMB, se baja la calidad por pasos hasta entrar (mínimo 0.4).
 * Devuelve el uri del JPEG resultante.
 */
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
      try {
        prev.delete();
      } catch {
        /* archivo temporal: si no se borra, el sistema limpia la caché */
      }
    }
    return saved.uri;
  } finally {
    // Liberar la memoria nativa: elegir 30 fotos seguidas no debe agotar la RAM.
    image.release();
    ctx.release();
  }
}

/** Sin avance en este tiempo, la subida se cancela y se reintenta (como el vigilante de la web). */
const STALL_MS = 45_000;

/** Sube un archivo local a Storage y devuelve la URL de descarga. */
export async function uploadFile(localUri: string, storagePath: string, onProgress?: (pct: number) => void): Promise<string> {
  const blob = await (await fetch(localUri)).blob();
  const task = uploadBytesResumable(ref(storage, storagePath), blob, { contentType: 'image/jpeg' });
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
          onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0);
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

export async function attachPhotoUrl(propertyId: string, kind: PhotoKind, url: string): Promise<void> {
  const field = kind === 'before' ? 'beforePhotos' : 'afterPhotos';
  await updateDoc(doc(db, 'properties', propertyId), { [field]: arrayUnion(url) });
}

/** Errores que NO se arreglan reintentando (reglas de Storage, cuota, casa borrada). */
export function isPermanentUploadError(err: unknown): boolean {
  const code = String((err as { code?: string })?.code || '');
  return ['storage/unauthorized', 'storage/quota-exceeded', 'permission-denied', 'not-found'].some((c) => code.includes(c));
}

/** Fallos de CONEXIÓN: no cuentan como intento fallido, solo se espera y se reintenta. */
export function isConnectivityError(err: unknown): boolean {
  const code = String((err as { code?: string })?.code || '');
  const msg = String((err as { message?: string })?.message || '').toLowerCase();
  return (
    ['storage/retry-limit-exceeded', 'storage/canceled', 'storage/unknown', 'unavailable', 'deadline-exceeded'].some((c) => code.includes(c)) ||
    msg.includes('network')
  );
}

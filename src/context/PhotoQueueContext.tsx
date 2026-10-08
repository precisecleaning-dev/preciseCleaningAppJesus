// src/context/PhotoQueueContext.tsx
// ⭐ COLA DE FOTOS EN DISCO — equivalente móvil de offlinePhotoQueue.ts (web).
//
//    Firebase Storage no funciona sin conexión. Por eso TODA foto pasa por esta
//    cola, haya señal o no:
//      1. Se comprime y se guarda en el almacenamiento de la app (no en caché:
//         el sistema no la borra).
//      2. Se anota en la cola (AsyncStorage) con la casa, el tipo y el empleado.
//      3. Se sube en orden; al terminar, la URL se agrega a la casa y el
//         archivo local se borra.
//    Si no hay señal, o se cierra la app a mitad de la subida, la foto queda en
//    la cola y se reintenta sola al volver la conexión o al reabrir la app.
//
//    Detalles que importan:
//    · Se guarda solo el NOMBRE del archivo, no la ruta completa: en iOS la
//      carpeta de la app cambia de ruta con cada actualización.
//    · Un fallo de conexión NO cuenta como intento: se espera (cada vez más) y
//      se reintenta. Solo los errores reales (permisos, casa borrada) cuentan.
//    · Cada foto lleva el id del empleado: si otra persona inicia sesión en el
//      mismo teléfono, no sube fotos ajenas a su nombre.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { logActivity } from '../services/activityLog';
import {
  attachPhotoUrl,
  compressPhoto,
  isConnectivityError,
  isPermanentUploadError,
  storagePathFor,
  uploadFile,
  type PickedPhoto,
} from '../services/photoService';
import type { PhotoKind } from '../types';
import { useCatalogs } from './CatalogsContext';
import { checkOnline, useOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';

const QUEUE_KEY = 'pc_crew_photo_queue_v1';
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 10 * 60_000;

export interface QueuedPhoto {
  id: string;
  userId: string;
  propertyId: string;
  clientName: string;
  address: string;
  label: string;
  kind: PhotoKind;
  /** Nombre del archivo dentro de pending-photos/ (la ruta se arma al usarla). */
  fileName: string;
  /** Solo en registros antiguos: ruta absoluta. */
  fileUri?: string;
  createdAt: number;
  /** Intentos fallidos por errores REALES (los de conexión no cuentan). */
  attempts: number;
  lastError?: string;
  /** Error permanente: no se reintenta solo (el empleado puede reintentar en Perfil). */
  blocked?: boolean;
}

interface EnqueueInput {
  propertyId: string;
  clientName: string;
  address: string;
  label: string;
  kind: PhotoKind;
  photos: PickedPhoto[];
}

interface PhotoQueueValue {
  /** Solo las fotos del empleado con sesión. */
  queue: QueuedPhoto[];
  /** Foto subiendo ahora y su progreso 0..1. */
  current: { id: string; progress: number } | null;
  enqueue: (input: EnqueueInput) => Promise<void>;
  retryAll: () => void;
  pendingFor: (propertyId: string, kind?: PhotoKind) => QueuedPhoto[];
  /** Uri local para mostrar la miniatura de una foto en cola. */
  localUri: (q: QueuedPhoto) => string;
}

const PhotoQueueContext = createContext<PhotoQueueValue | null>(null);

const photosDir = () => {
  const dir = new Directory(Paths.document, 'pending-photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

const fileOf = (q: QueuedPhoto): File => {
  const byName = new File(photosDir(), q.fileName);
  if (byName.exists || !q.fileUri) return byName;
  return new File(q.fileUri);
};

const makeId = () => `pp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function loadQueue(): Promise<QueuedPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const list = raw ? (JSON.parse(raw) as QueuedPhoto[]) : [];
    // Compatibilidad: entradas sin fileName (ruta absoluta vieja).
    return list.map((q) => ({ ...q, fileName: q.fileName || String(q.fileUri || '').split('/').pop() || `${q.id}.jpg` }));
  } catch {
    return [];
  }
}

export function PhotoQueueProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const { photoConfig } = useCatalogs();
  const online = useOnline();
  const [all, setAll] = useState<QueuedPhoto[]>([]);
  const [current, setCurrent] = useState<{ id: string; progress: number } | null>(null);

  // La fuente de verdad vive en refs para que el procesador (async, largo)
  // siempre vea la cola y el usuario actuales, no una copia de un render viejo.
  const queueRef = useRef<QueuedPhoto[]>([]);
  const loadedRef = useRef(false);
  const runningRef = useRef(false);
  const activeRef = useRef(true);
  const backoffRef = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const commit = useCallback((updater: (prev: QueuedPhoto[]) => QueuedPhoto[]) => {
    const next = updater(queueRef.current);
    queueRef.current = next;
    setAll(next);
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next)).catch((e) => console.error('No se pudo guardar la cola', e));
  }, []);

  const process = useCallback(async () => {
    // ⚠ El candado se toma ANTES de cualquier await: NetInfo y AppState suelen
    //   disparar varios eventos juntos y dos ciclos subirían la misma foto dos veces.
    if (runningRef.current || !loadedRef.current) return;
    runningRef.current = true;
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    const uploadedByHouse = new Map<string, { before: number; after: number; label: string }>();
    let waitForNetwork = false;
    try {
      if (!(await checkOnline())) return;
      while (activeRef.current) {
        const me = userRef.current.id;
        const item = queueRef.current.find((q) => q.userId === me && !q.blocked && q.attempts < MAX_ATTEMPTS);
        if (!item) break;
        setCurrent({ id: item.id, progress: 0 });
        try {
          const file = fileOf(item);
          if (!file.exists) {
            // Sin archivo no hay nada que subir: se marca como error visible, no se borra en silencio.
            commit((prev) => prev.map((q) => (q.id === item.id ? { ...q, blocked: true, lastError: 'file-missing' } : q)));
            continue;
          }
          const url = await uploadFile(file.uri, storagePathFor(item.clientName, item.address, item.kind), (p) =>
            setCurrent({ id: item.id, progress: p }),
          );
          await attachPhotoUrl(item.propertyId, item.kind, url);
          try {
            file.delete();
          } catch {
            /* si no se puede borrar, no afecta: ya está en la nube */
          }
          commit((prev) => prev.filter((q) => q.id !== item.id));
          backoffRef.current = 0;
          const agg = uploadedByHouse.get(item.propertyId) || { before: 0, after: 0, label: item.label };
          agg[item.kind] += 1;
          uploadedByHouse.set(item.propertyId, agg);
        } catch (err) {
          console.error('Error subiendo foto:', err);
          const code = String((err as { code?: string })?.code || (err as Error)?.message || err);
          if (isConnectivityError(err) || !(await checkOnline())) {
            commit((prev) => prev.map((q) => (q.id === item.id ? { ...q, lastError: code } : q)));
            waitForNetwork = true;
            break;
          }
          const permanent = isPermanentUploadError(err);
          commit((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, attempts: q.attempts + 1, lastError: code, blocked: permanent } : q)),
          );
        }
      }
    } finally {
      setCurrent(null);
      runningRef.current = false;
      // Bitácora: una entrada por casa, como la web ("N foto(s) Before, M After").
      uploadedByHouse.forEach((agg, propertyId) =>
        logActivity({
          action: 'photo_upload',
          user: userRef.current,
          targetId: propertyId,
          targetLabel: agg.label,
          detail: `${agg.before} foto(s) Before, ${agg.after} foto(s) After`,
        }),
      );
      // Conexión inestable: reintentar más tarde, esperando cada vez más.
      if (waitForNetwork && activeRef.current) {
        const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** backoffRef.current);
        backoffRef.current += 1;
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          process();
        }, delay);
      }
    }
  }, [commit]);

  // Cargar la cola guardada al abrir la app; parar el ciclo al cerrar sesión.
  useEffect(() => {
    activeRef.current = true;
    loadQueue().then((q) => {
      queueRef.current = q;
      setAll(q);
      loadedRef.current = true;
      process();
    });
    return () => {
      activeRef.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [process]);

  // Reintentar en cuanto vuelve la señal (sin esperar el backoff) y al volver la app al frente.
  useEffect(() => {
    if (online) {
      backoffRef.current = 0;
      process();
    }
  }, [online, process]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') process();
    });
    return () => sub.remove();
  }, [process]);

  const enqueue = useCallback(
    async (input: EnqueueInput) => {
      const dir = photosDir();
      try {
        // Cada foto entra a la cola apenas está lista: si falla la 3 de 10, las
        // 2 primeras ya quedaron guardadas y no se duplican al reintentar.
        for (const photo of input.photos) {
          const compressed = await compressPhoto(photo, photoConfig);
          const id = makeId();
          const fileName = `${id}.jpg`;
          await new File(compressed).move(new File(dir, fileName));
          const item: QueuedPhoto = {
            id,
            userId: userRef.current.id,
            propertyId: input.propertyId,
            clientName: input.clientName,
            address: input.address,
            label: input.label,
            kind: input.kind,
            fileName,
            createdAt: Date.now(),
            attempts: 0,
          };
          commit((prev) => [...prev, item]);
        }
      } finally {
        process();
      }
    },
    [commit, process, photoConfig],
  );

  const retryAll = useCallback(() => {
    const me = userRef.current.id;
    commit((prev) => prev.map((q) => (q.userId === me ? { ...q, attempts: 0, blocked: q.lastError === 'file-missing' } : q)));
    backoffRef.current = 0;
    process();
  }, [commit, process]);

  const value = useMemo<PhotoQueueValue>(() => {
    const queue = all.filter((q) => q.userId === user.id);
    return {
      queue,
      current,
      enqueue,
      retryAll,
      pendingFor: (propertyId, kind) => queue.filter((q) => q.propertyId === propertyId && (!kind || q.kind === kind)),
      localUri: (q) => fileOf(q).uri,
    };
  }, [all, user.id, current, enqueue, retryAll]);

  return <PhotoQueueContext.Provider value={value}>{children}</PhotoQueueContext.Provider>;
}

export function usePhotoQueue(): PhotoQueueValue {
  const ctx = useContext(PhotoQueueContext);
  if (!ctx) throw new Error('usePhotoQueue debe usarse dentro de <PhotoQueueProvider>');
  return ctx;
}

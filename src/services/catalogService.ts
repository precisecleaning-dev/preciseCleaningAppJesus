import { doc, getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CatalogItem, PhotoConfig, Status } from '../types';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { typedCollection } from './firestore';

export const DEFAULT_PHOTO_CONFIG: PhotoConfig = {
  allowTakePhoto: true,
  allowUploadFromDevice: true,
  compressionQuality: 0.85,
  maxImageWidth: 1920,
  maxSizeMB: 1,
};

export interface Catalogs {
  statuses: Status[];
  teams: CatalogItem[];
  priorities: CatalogItem[];
  products: CatalogItem[];
  services: CatalogItem[];
  photoConfig: PhotoConfig;
}

async function readAll<T extends { id: string }>(path: string): Promise<T[]> {
  try {
    return (await getDocsFromServer(typedCollection<T>(path))).docs.map((d) => d.data());
  } catch (err) {
    if (/permission-denied/.test(String((err as { code?: string })?.code))) {
      console.error(`Sin acceso a ${path}:`, err);
      return [];
    }
    throw err;
  }
}

async function readCatalogs(): Promise<Catalogs> {
  const [statuses, teams, priorities, products, services, photoConfig] = await Promise.all([
    readAll<Status>('settings_statuses'),
    readAll<CatalogItem>('settings_teams'),
    readAll<CatalogItem>('settings_priorities'),
    readAll<CatalogItem>('settings_products'),
    readAll<CatalogItem>('settings_services'),
    getDocFromServer(doc(db, 'app_settings', 'photo_config')).then((snap) => ({ ...DEFAULT_PHOTO_CONFIG, ...(snap.data() as Partial<PhotoConfig> | undefined) })),
  ]);
  return { statuses, teams, priorities, products, services, photoConfig };
}

export const loadCatalogs = () => cached('catalogs', CONFIG_TTL, readCatalogs);

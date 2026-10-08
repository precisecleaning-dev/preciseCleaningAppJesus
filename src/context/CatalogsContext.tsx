// src/context/CatalogsContext.tsx
// ⭐ Catálogos que la web administra en Settings y el empleado solo LEE:
//    statuses, equipos, prioridades, servicios/productos, clientes y la
//    configuración de fotos. Escuchan en tiempo real: si la oficina cambia el
//    color de un status o la calidad de compresión, el teléfono lo refleja solo.
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../config/firebase';
import type { CatalogItem, Customer, PhotoConfig, Status } from '../types';
import { mapCustomerDoc } from '../utils/relations';

export const DEFAULT_PHOTO_CONFIG: PhotoConfig = {
  allowTakePhoto: true,
  allowUploadFromDevice: true,
  compressionQuality: 0.85,
  maxImageWidth: 1920,
  maxSizeMB: 1,
};

interface CatalogsValue {
  statuses: Status[];
  statusesLoaded: boolean;
  teams: CatalogItem[];
  priorities: CatalogItem[];
  products: CatalogItem[];
  services: CatalogItem[];
  customers: Customer[];
  photoConfig: PhotoConfig;
}

const CatalogsContext = createContext<CatalogsValue | null>(null);

const asItems = <T extends CatalogItem>(docs: { id: string; data: () => object }[]) =>
  docs.map((d) => ({ ...d.data(), id: d.id }) as T);

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusesLoaded, setStatusesLoaded] = useState(false);
  const [teams, setTeams] = useState<CatalogItem[]>([]);
  const [priorities, setPriorities] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [photoConfig, setPhotoConfig] = useState<PhotoConfig>(DEFAULT_PHOTO_CONFIG);

  useEffect(() => {
    const onErr = (name: string) => (err: Error) => console.error(`Error cargando ${name}:`, err);
    const unsubs = [
      onSnapshot(
        collection(db, 'settings_statuses'),
        (s) => {
          setStatuses(asItems<Status>(s.docs));
          setStatusesLoaded(true);
        },
        (err) => {
          onErr('settings_statuses')(err);
          setStatusesLoaded(true);
        },
      ),
      onSnapshot(collection(db, 'settings_teams'), (s) => setTeams(asItems(s.docs)), onErr('settings_teams')),
      onSnapshot(collection(db, 'settings_priorities'), (s) => setPriorities(asItems(s.docs)), onErr('settings_priorities')),
      onSnapshot(collection(db, 'settings_products'), (s) => setProducts(asItems(s.docs)), onErr('settings_products')),
      onSnapshot(collection(db, 'settings_services'), (s) => setServices(asItems(s.docs)), onErr('settings_services')),
      onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(mapCustomerDoc)), onErr('customers')),
      onSnapshot(
        doc(db, 'app_settings', 'photo_config'),
        (s) => setPhotoConfig({ ...DEFAULT_PHOTO_CONFIG, ...(s.exists() ? (s.data() as Partial<PhotoConfig>) : {}) }),
        onErr('photo_config'),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const value = useMemo(
    () => ({ statuses, statusesLoaded, teams, priorities, products, services, customers, photoConfig }),
    [statuses, statusesLoaded, teams, priorities, products, services, customers, photoConfig],
  );
  return <CatalogsContext.Provider value={value}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs(): CatalogsValue {
  const ctx = useContext(CatalogsContext);
  if (!ctx) throw new Error('useCatalogs debe usarse dentro de <CatalogsProvider>');
  return ctx;
}

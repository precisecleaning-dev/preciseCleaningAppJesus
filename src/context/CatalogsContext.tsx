import { createContext, useContext, useState, type ReactNode } from 'react';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { DEFAULT_PHOTO_CONFIG, loadCatalogs, type Catalogs } from '../services/catalogService';

interface CatalogsValue extends Catalogs {
  loaded: boolean;
}

const EMPTY: Catalogs = { statuses: [], teams: [], priorities: [], products: [], services: [], photoConfig: DEFAULT_PHOTO_CONFIG };
const CatalogsContext = createContext<CatalogsValue | null>(null);

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);

  useWhenOnline(() => {
    loadCatalogs()
      .then(setCatalogs)
      .catch((err) => console.error('Error cargando catálogos:', err));
  }, true);

  return <CatalogsContext.Provider value={{ ...(catalogs ?? EMPTY), loaded: catalogs !== null }}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs(): CatalogsValue {
  const ctx = useContext(CatalogsContext);
  if (!ctx) throw new Error('useCatalogs debe usarse dentro de <CatalogsProvider>');
  return ctx;
}

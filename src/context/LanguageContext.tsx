// src/context/LanguageContext.tsx
// ⭐ Idioma: por defecto el del teléfono (español si no es inglés), y el
//    empleado puede cambiarlo en Perfil; la elección se recuerda en el equipo.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Lang, type Strings } from '../i18n/strings';

const STORAGE_KEY = 'pc_crew_lang';

interface LanguageValue {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

const deviceLang = (): Lang => (getLocales()[0]?.languageCode === 'en' ? 'en' : 'es');

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'es' || saved === 'en') setLangState(saved);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      t: dictionaries[lang],
      setLang: (l) => {
        setLangState(l);
        AsyncStorage.setItem(STORAGE_KEY, l).catch(() => undefined);
      },
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider>');
  return ctx;
}

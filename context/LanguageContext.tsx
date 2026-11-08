import { shopText } from '../constants/shopCopy';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  FALLBACK_LANGUAGE,
  Language,
  LANGUAGES,
  normalizeLanguagePreference,
  translations,
} from '../constants/i18n';

type Translation = (typeof translations)[Language];

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: Translation;
  languages: typeof LANGUAGES;
  ready: boolean;
};

const LANGUAGE_STORAGE_KEY = '@opsps_language';

const getWebStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
};

const readStoredLanguage = async () => {
  const webStorage = getWebStorage();
  if (webStorage) {
    return webStorage.getItem(LANGUAGE_STORAGE_KEY);
  }

  return AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
};

const writeStoredLanguage = async (value: string) => {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    return;
  }

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, value);
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(FALLBACK_LANGUAGE);
  const [ready, setReady] = useState(false);

  const changed = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void readStoredLanguage().then(saved => {
      if (active && !changed.current) setLanguageState(normalizeLanguagePreference(saved));
    }).catch(() => {
      // Keep the current selection when storage is unavailable.
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    changed.current = true;
    const normalizedLanguage = normalizeLanguagePreference(newLanguage);
    setLanguageState(normalizedLanguage);
    // Persist rapid selections in order so an older write cannot win after reload.
    const next = writes.current.then(() => writeStoredLanguage(normalizedLanguage)).catch(() => undefined);
    writes.current = next;
    await next;
  };

  const value: LanguageContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      languages: LANGUAGES,
      ready,
    }),
    [language, ready],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}

// Supports standalone screen rendering with the same English fallback as the provider.
export function useAppCopy() {
  const context = useContext(LanguageContext);
  const language = context?.language ?? FALLBACK_LANGUAGE;
  return { tx: (source:string) => shopText(language,source) };
}

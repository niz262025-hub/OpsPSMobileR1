import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

  useEffect(() => {
    void loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await readStoredLanguage();
      const normalized = normalizeLanguagePreference(savedLanguage);
      setLanguageState(normalized);
    } catch (error) {
      console.warn('Unable to load saved language:', error);
      setLanguageState(FALLBACK_LANGUAGE);
    } finally {
      setReady(true);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    const normalizedLanguage = normalizeLanguagePreference(newLanguage);
    setLanguageState(normalizedLanguage);

    try {
      await writeStoredLanguage(normalizedLanguage);
    } catch (error) {
      console.warn('Unable to save language:', error);
    }
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

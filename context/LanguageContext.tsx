import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Language,
  LANGUAGES,
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

const LanguageContext =
  createContext<LanguageContextValue | undefined>(
    undefined,
  );

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>('BM');

  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage =
        await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY,
        );

      if (
        savedLanguage === 'BM' ||
        savedLanguage === 'EN' ||
        savedLanguage === 'HI' ||
        savedLanguage === 'ZH'
      ) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn(
        'Unable to load saved language:',
        error,
      );
    } finally {
      setReady(true);
    }
  };

  const setLanguage = async (
    newLanguage: Language,
  ) => {
    setLanguageState(newLanguage);

    try {
      await AsyncStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        newLanguage,
      );
    } catch (error) {
      console.warn(
        'Unable to save language:',
        error,
      );
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
    throw new Error(
      'useLanguage must be used inside LanguageProvider',
    );
  }

  return context;
}
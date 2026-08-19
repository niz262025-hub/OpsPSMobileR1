import ms from './ms';
import en from './en';
import zh from './zh';
import ta from './ta';

export const translations = {
  ms,
  en,
  zh,
  ta,
};

export type LanguageCode = keyof typeof translations;

export const DEFAULT_LANGUAGE: LanguageCode = 'ms';

export const LANGUAGE_OPTIONS = [
  {
    code: 'ms' as const,
    label: 'Bahasa Melayu',
    shortLabel: 'BM',
  },
  {
    code: 'en' as const,
    label: 'English',
    shortLabel: 'EN',
  },
  {
    code: 'zh' as const,
    label: '中文',
    shortLabel: '中文',
  },
  {
    code: 'ta' as const,
    label: 'தமிழ்',
    shortLabel: 'TA',
  },
];

export function getTranslations(language: LanguageCode = DEFAULT_LANGUAGE) {
  return translations[language];
}
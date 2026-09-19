import { LanguageMeta, SupportedLanguage } from './types';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // 8 Indian Regional Languages
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'bn',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'ta',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'gu',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'pa',
    label: 'Punjabi',
    nativeLabel: 'ਪੰਜਾਬੀ',
    region: 'indian',
    dir: 'ltr',
    script: 'indic',
  },

  // 12 Major Global Languages
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    region: 'global',
    dir: 'rtl',
    script: 'arabic',
  },
  {
    code: 'pt',
    label: 'Portuguese',
    nativeLabel: 'Português',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'ru',
    label: 'Russian',
    nativeLabel: 'Русский',
    region: 'global',
    dir: 'ltr',
    script: 'cyrillic',
  },
  {
    code: 'zh',
    label: 'Chinese (Simplified)',
    nativeLabel: '简体中文',
    region: 'global',
    dir: 'ltr',
    script: 'cjk',
  },
  {
    code: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
    region: 'global',
    dir: 'ltr',
    script: 'cjk',
  },
  {
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'ne',
    label: 'Nepali',
    nativeLabel: 'नेपाली',
    region: 'global',
    dir: 'ltr',
    script: 'indic',
  },
  {
    code: 'id',
    label: 'Indonesian',
    nativeLabel: 'Bahasa Indonesia',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
  {
    code: 'tr',
    label: 'Turkish',
    nativeLabel: 'Türkçe',
    region: 'global',
    dir: 'ltr',
    script: 'latin',
  },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function getLanguageMeta(code: string): LanguageMeta {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found || SUPPORTED_LANGUAGES.find((lang) => lang.code === DEFAULT_LANGUAGE)!;
}
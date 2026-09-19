import { SupportedLanguage, TranslationDictionary } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { mr } from './locales/mr';
import { bn } from './locales/bn';
import { te } from './locales/te';
import { ta } from './locales/ta';
import { gu } from './locales/gu';
import { kn } from './locales/kn';
import { pa } from './locales/pa';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { de } from './locales/de';
import { ne } from './locales/ne';
import { id } from './locales/id';
import { tr } from './locales/tr';

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  mr,
  bn,
  te,
  ta,
  gu,
  kn,
  pa,
  es,
  fr,
  ar,
  pt,
  ru,
  zh,
  ja,
  de,
  ne,
  id,
  tr,
};

export function getTranslation(lang: SupportedLanguage): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
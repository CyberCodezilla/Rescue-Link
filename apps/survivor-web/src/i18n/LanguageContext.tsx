'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SupportedLanguage, LanguageMeta, TranslationDictionary } from './types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getLanguageMeta } from './languages';
import { getTranslation } from './translations';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  meta: LanguageMeta;
  t: TranslationDictionary;
  dir: 'ltr' | 'rtl';
  isIndic: boolean;
}

const STORAGE_KEY = 'rescuelink_survivor_lang';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }
  const browserCode = navigator.language.toLowerCase();
  
  // Exact match first (e.g. 'zh', 'hi', 'mr')
  const exact = SUPPORTED_LANGUAGES.find((l) => l.code === browserCode);
  if (exact) return exact.code;

  // Prefix match (e.g. 'hi-IN' -> 'hi', 'mr-IN' -> 'mr', 'es-ES' -> 'es')
  const primaryPrefix = browserCode.split('-')[0];
  const prefixMatch = SUPPORTED_LANGUAGES.find((l) => l.code === primaryPrefix);
  if (prefixMatch) return prefixMatch.code;

  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
      } else {
        const detected = detectBrowserLanguage();
        setLanguageState(detected);
      }
    } catch {
      // Fallback gracefully on storage access errors
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors in private browsing
    }
  }, []);

  const meta = useMemo(() => getLanguageMeta(language), [language]);
  const t = useMemo(() => getTranslation(language), [language]);
  const dir = meta.dir;
  const isIndic = meta.script === 'indic';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      meta,
      t,
      dir,
      isIndic,
    }),
    [language, setLanguage, meta, t, dir, isIndic]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return fallback context if accessed outside of provider
    const fallbackMeta = getLanguageMeta(DEFAULT_LANGUAGE);
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      meta: fallbackMeta,
      t: getTranslation(DEFAULT_LANGUAGE),
      dir: 'ltr',
      isIndic: false,
    };
  }
  return context;
}
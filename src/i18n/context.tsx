'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Locale = 'nl' | 'en' | 'es';

export const localeNames: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español',
};

export const localeFlags: Record<Locale, string> = {
  nl: '🇳🇱',
  en: '🇬🇧',
  es: '🇪🇸',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

function getNestedValue(obj: Dict, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Dict)) {
      current = (current as Dict)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children, dictionaries }: { children: ReactNode; dictionaries: Record<Locale, Dict> }) {
  const [locale, setLocaleState] = useState<Locale>('nl');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language') as Locale;
    if (saved && ['nl', 'en', 'es'].includes(saved)) {
      setLocaleState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'es') setLocaleState('es');
      else if (browserLang === 'en') setLocaleState('en');
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('language', l);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let val = getNestedValue(dictionaries[locale], key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  }, [locale, dictionaries]);

  if (!mounted) {
    // SSR/initial render — use Dutch as default to avoid hydration mismatch
    const tDefault = (key: string, params?: Record<string, string | number>): string => {
      let val = getNestedValue(dictionaries.nl, key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(`{${k}}`, String(v));
        });
      }
      return val;
    };
    return (
      <LanguageContext.Provider value={{ locale: 'nl', setLocale, t: tDefault }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

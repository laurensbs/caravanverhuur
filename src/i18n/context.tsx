'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { nl as nlDict, loadDictionary } from './translations';

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('nl');
  const [activeDict, setActiveDict] = useState<Dict>(nlDict);
  const [mounted, setMounted] = useState(false);

  // Detect initial locale from storage/cookie/browser. Triggers a dictionary
  // load if it's not NL (which is already in memory).
  useEffect(() => {
    let initial: Locale = 'nl';
    const saved = localStorage.getItem('language') as Locale;
    if (saved && ['nl', 'en', 'es'].includes(saved)) {
      initial = saved;
    } else {
      const cookieMatch = document.cookie.match(/(?:^|; )locale=(\w+)/);
      const cookieLocale = cookieMatch?.[1] as Locale;
      if (cookieLocale && ['nl', 'en', 'es'].includes(cookieLocale)) {
        initial = cookieLocale;
        localStorage.setItem('language', cookieLocale);
      } else {
        const browserLang = navigator.language.slice(0, 2);
        if (browserLang === 'es') initial = 'es';
        else if (browserLang === 'en') initial = 'en';
      }
    }
    setLocaleState(initial);
    if (initial === 'nl') {
      setMounted(true);
    } else {
      // Load the non-default dict before unblocking render — voorkomt een
      // flash-of-nl-content tijdens initial mount voor EN/ES gebruikers.
      loadDictionary(initial).then((d) => {
        setActiveDict(d);
        setMounted(true);
      });
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('language', l);
    document.cookie = `locale=${l};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    if (l === 'nl') {
      setActiveDict(nlDict);
    } else {
      loadDictionary(l).then(setActiveDict);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let val = getNestedValue(activeDict, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  }, [activeDict]);

  if (!mounted) {
    // SSR/initial render — gebruik NL synchroon zodat eerste paint geen
    // hydration mismatch veroorzaakt.
    const tDefault = (key: string, params?: Record<string, string | number>): string => {
      let val = getNestedValue(nlDict, key);
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

'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, createT, type AdminLocale, type AdminRole } from './admin-translations';

interface AdminContextType {
  role: AdminRole;
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Translate a DB status enum value (e.g. NIEUW → New) */
  ts: (status: string) => string;
  dateLocale: string;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

interface AdminProviderProps {
  children: ReactNode;
  role: AdminRole;
}

export function AdminProvider({ children, role }: AdminProviderProps) {
  const [locale, setLocaleState] = useState<AdminLocale>('nl');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_locale') as AdminLocale | null;
    if (saved && (saved === 'nl' || saved === 'en')) setLocaleState(saved);
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: AdminLocale) => {
    setLocaleState(l);
    localStorage.setItem('admin_locale', l);
  }, []);

  const t = useCallback(createT(locale), [locale]);

  const ts = useCallback(
    (status: string): string => {
      const dict = translations[locale].status;
      return dict[status] ?? status.replace(/_/g, ' ');
    },
    [locale],
  );

  const dateLocale = locale === 'nl' ? 'nl-NL' : 'en-GB';

  if (!mounted) return null;

  return (
    <AdminContext.Provider value={{ role, locale, setLocale, t, ts, dateLocale }}>
      {children}
    </AdminContext.Provider>
  );
}

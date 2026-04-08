'use client';

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { Truck, LogOut, Globe, Loader2 } from 'lucide-react';
import { type DriverLocale, getDriverTranslation } from '@/i18n/driver-translations';

interface DriverSession {
  id: string;
  name: string;
  locale: DriverLocale;
}

interface DriverCtx {
  driver: DriverSession;
  t: (key: string) => string;
  locale: DriverLocale;
  setLocale: (l: DriverLocale) => void;
}

const DriverContext = createContext<DriverCtx | null>(null);
export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverLayout');
  return ctx;
}

const LOCALES: { code: DriverLocale; flag: string }[] = [
  { code: 'nl', flag: '🇳🇱' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' },
];

export default function DriverLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [locale, setLocaleState] = useState<DriverLocale>('nl');
  const [loginLocale, setLoginLocale] = useState<DriverLocale>('nl');

  const t = getDriverTranslation(authenticated ? locale : loginLocale);

  useEffect(() => {
    fetch('/api/driver/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setDriver(data.driver);
          setLocaleState(data.driver.locale || 'nl');
          setAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async () => {
    if (!pin.trim()) return;
    setLoginLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDriver(data.driver);
        setLocaleState(data.driver.locale || 'nl');
        setAuthenticated(true);
      } else {
        setError(t('login.error'));
      }
    } catch {
      setError(t('login.error'));
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/driver/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setDriver(null);
    setPin('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!authenticated || !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t('login.title')}</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex justify-center gap-2 mb-2">
              {LOCALES.map(l => (
                <button key={l.code} onClick={() => setLoginLocale(l.code)}
                  className={`text-xl px-2 py-1 rounded-lg transition cursor-pointer ${loginLocale === l.code ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}>
                  {l.flag}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('login.pin')}</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={t('login.pinPlaceholder')}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loginLoading || !pin.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? t('login.loading') : t('login.button')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DriverContext.Provider value={{ driver, t, locale, setLocale: setLocaleState }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{t('nav.hello')}, {driver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => setLocaleState(l.code)}
                    className={`text-sm px-1.5 py-0.5 rounded transition cursor-pointer ${locale === l.code ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                    {l.flag}
                  </button>
                ))}
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 py-4">
          {children}
        </main>
      </div>
    </DriverContext.Provider>
  );
}

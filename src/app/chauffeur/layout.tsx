'use client';

import { useState, useEffect, useRef, ReactNode, createContext, useContext } from 'react';
import { Truck, LogOut, ChevronDown, Loader2, ArrowLeft, Lock, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { type DriverLocale, getDriverTranslation } from '@/i18n/driver-translations';

interface DriverSession {
  id: string;
  name: string;
  locale: DriverLocale;
}

interface DriverListItem {
  id: string;
  name: string;
  hasPassword: boolean;
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

const LOCALES: { code: DriverLocale; flag: string; label: string }[] = [
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

type LoginStep = 'select-driver' | 'setup' | 'password';

export default function DriverLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [locale, setLocaleState] = useState<DriverLocale>('nl');

  // Login flow
  const [step, setStep] = useState<LoginStep>('select-driver');
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);
  const [loginLocale, setLoginLocale] = useState<DriverLocale>('nl');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupLocale, setSetupLocale] = useState<DriverLocale | null>(null);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Header dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const ONBOARDING_STEPS = 4;

  const t = getDriverTranslation(authenticated ? locale : loginLocale);

  // Check existing session
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

  // Load driver list
  useEffect(() => {
    if (!authenticated) {
      fetch('/api/driver/auth/drivers')
        .then(r => r.json())
        .then(data => setDrivers(data.drivers || []))
        .catch(() => {});
    }
  }, [authenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Show onboarding on first login
  useEffect(() => {
    if (authenticated && driver) {
      const key = `driver_onboarded_v1_${driver.id}`;
      if (!localStorage.getItem(key)) {
        setShowOnboarding(true);
        setOnboardingStep(0);
      }
    }
  }, [authenticated, driver]);

  const finishOnboarding = () => {
    if (driver) localStorage.setItem(`driver_onboarded_v1_${driver.id}`, 'true');
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const selectDriver = (d: DriverListItem) => {
    setSelectedDriver(d);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setSetupLocale(null);
    if (d.hasPassword) {
      setStep('password');
    } else {
      setStep('setup');
    }
  };

  const goBack = () => {
    setStep('select-driver');
    setSelectedDriver(null);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setSetupLocale(null);
  };

  const handleLogin = async () => {
    if (!selectedDriver || !password.trim()) return;
    setLoginLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver.id, password: password.trim() }),
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

  const handleSetup = async () => {
    if (!selectedDriver || !setupLocale) return;
    if (password.length < 4) { setError(t('setup.tooShort')); return; }
    if (password !== confirmPassword) { setError(t('setup.mismatch')); return; }
    setLoginLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver.id, password, locale: setupLocale }),
      });
      const data = await res.json();
      if (data.success) {
        setDriver(data.driver);
        setLocaleState(data.driver.locale || setupLocale);
        setLoginLocale(setupLocale);
        setAuthenticated(true);
      } else {
        setError(data.error || t('login.error'));
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
    setStep('select-driver');
    setSelectedDriver(null);
    setPassword('');
    setShowDropdown(false);
    setShowPasswordModal(false);
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess(false);
    if (newPw.length < 4) { setPwError(t('setup.tooShort')); return; }
    if (newPw !== confirmPw) { setPwError(t('password.mismatch')); return; }
    setPwLoading(true);
    try {
      const res = await fetch('/api/driver/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess(true);
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwSuccess(false);
          setCurrentPw('');
          setNewPw('');
          setConfirmPw('');
        }, 1500);
      } else {
        setPwError(data.error === 'wrong_current' ? t('password.wrongCurrent') : t('login.error'));
      }
    } catch {
      setPwError(t('login.error'));
    }
    setPwLoading(false);
  };

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

          {/* Step 1: Select driver */}
          {step === 'select-driver' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
              <p className="text-sm font-semibold text-gray-600 text-center mb-2">{t('login.selectDriver')}</p>
              {drivers.map(d => (
                <button key={d.id} onClick={() => selectDriver(d)}
                  className="w-full py-3 px-4 bg-gray-50 hover:bg-blue-50 rounded-xl text-left font-medium text-gray-900 transition cursor-pointer flex items-center justify-between group">
                  <span>{d.name}</span>
                  <span className="text-gray-300 group-hover:text-blue-400 transition">→</span>
                </button>
              ))}
              {drivers.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">{t('login.loading')}</p>
              )}
            </div>
          )}

          {/* Step 2a: Setup (first time - language + create password) */}
          {step === 'setup' && selectedDriver && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> {t('login.back')}
              </button>

              <div className="text-center">
                <p className="font-semibold text-gray-900">{selectedDriver.name}</p>
                <p className="text-sm text-gray-500">{t('setup.title')}</p>
              </div>

              {/* Language selection */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{t('setup.selectLanguage')}</p>
                <div className="flex gap-2">
                  {LOCALES.map(l => (
                    <button key={l.code} onClick={() => { setSetupLocale(l.code); setLoginLocale(l.code); }}
                      className={`flex-1 py-2.5 rounded-xl text-center transition cursor-pointer border-2 ${setupLocale === l.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-lg block">{l.flag}</span>
                      <span className="text-xs text-gray-600 block mt-0.5">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Create password */}
              {setupLocale && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('setup.createPassword')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t('setup.passwordPlaceholder')}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('setup.confirmPassword')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSetup()}
                      placeholder={t('setup.confirmPlaceholder')}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}

                  <button onClick={handleSetup}
                    disabled={loginLoading || !password || !confirmPassword}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                    {loginLoading ? t('login.loading') : t('setup.button')}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2b: Password login (returning driver) */}
          {step === 'password' && selectedDriver && (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> {t('login.back')}
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">{selectedDriver.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">{t('login.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}

              <button onClick={handleLogin}
                disabled={loginLoading || !password.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                {loginLoading ? t('login.loading') : t('login.button')}
              </button>
            </div>
          )}
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
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer">
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
                    <button onClick={() => { setShowDropdown(false); setShowPasswordModal(true); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); setPwSuccess(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                      <Lock className="w-4 h-4" /> {t('nav.changePassword')}
                    </button>
                    <button onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Password change modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900">{t('password.title')}</h3>

              {pwSuccess ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">{t('password.success')}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">{t('password.current')}</label>
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" autoFocus />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">{t('password.new')}</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">{t('password.confirm')}</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>

                  {pwError && <p className="text-sm text-red-600 text-center font-medium">{pwError}</p>}

                  <button onClick={handleChangePassword}
                    disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                    {pwLoading ? t('login.loading') : t('password.button')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 py-4">
          {children}
        </main>

        {/* ═══ DRIVER ONBOARDING ═══ */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={finishOnboarding}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="h-1.5 bg-blue-600" />
              <div className="p-6">
                {/* Progress */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('onboarding.step')} {onboardingStep + 1} / {ONBOARDING_STEPS}
                  </span>
                  <button onClick={finishOnboarding} className="text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer">
                    {t('onboarding.skip')}
                  </button>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-400" style={{ width: `${((onboardingStep + 1) / ONBOARDING_STEPS) * 100}%` }} />
                </div>

                {/* Step content */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
                    <span className="text-4xl">{['👋', '📋', '✅', '🔒'][onboardingStep]}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">{t(`onboarding.${onboardingStep + 1}.title`)}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(`onboarding.${onboardingStep + 1}.desc`)}</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  {onboardingStep > 0 ? (
                    <button onClick={() => setOnboardingStep(s => s - 1)}
                      className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition cursor-pointer">
                      <ChevronLeft className="w-4 h-4" /> {t('onboarding.back')}
                    </button>
                  ) : <div />}
                  {onboardingStep < ONBOARDING_STEPS - 1 ? (
                    <button onClick={() => setOnboardingStep(s => s + 1)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold transition hover:bg-blue-700 cursor-pointer">
                      {t('onboarding.next')} <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={finishOnboarding}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold transition hover:bg-blue-700 cursor-pointer">
                      {t('onboarding.done')} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverContext.Provider>
  );
}

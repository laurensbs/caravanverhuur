'use client';

import { useState, useEffect, ReactNode, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Mail,
  CarFront,
  ClipboardCheck,
  Users,
  LogOut,
  X,
  Lock,
  Eye,
  EyeOff,
  Newspaper,
  Shield,
  AlertCircle,
  Tag,
  Globe,
  User,
  ArrowRight,
  ClipboardList,
  MessageCircle,
  PanelRightOpen,
  PanelRightClose,
  ChevronRight,
  ChevronLeft,
  Tent,
  GripVertical,
  ExternalLink,
  Search,
  History,
  Bell,
  BellOff,
  Percent,
  Truck,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { AdminProvider, useAdmin as useAdminCtx } from '@/i18n/admin-context';
import { createT, type AdminLocale, type AdminRole } from '@/i18n/admin-translations';
import dynamic from 'next/dynamic';
import { ToastProvider, useToast } from '@/components/AdminToast';

const AdminAssistant = dynamic(() => import('@/components/AdminAssistant'), { ssr: false });

/* ── Credentials ─────────────────────────────────── */
// Credentials are now server-side only (src/lib/admin-auth.ts)
// The login form calls /api/admin/auth/login

/* ── Nav items with role-based access ───────────── */
type NavItem = { sub: string; key: string; icon: typeof LayoutDashboard; roles: AdminRole[] };
type NavSection = { sectionKey: string; items: NavItem[] };
type NavItemWithHref = NavItem & { href: string };
type NavSectionFiltered = { sectionKey: string; items: NavItemWithHref[] };

const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: 'nav.section.overview',
    items: [
      { sub: '', key: 'nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    ],
  },
  {
    sectionKey: 'nav.section.bookings',
    items: [
      { sub: '/planning', key: 'nav.planning', icon: ClipboardList, roles: ['admin', 'staff'] },
      { sub: '/boekingen', key: 'nav.bookings', icon: CalendarCheck, roles: ['admin', 'staff'] },
      { sub: '/betalingen', key: 'nav.payments', icon: CreditCard, roles: ['admin'] },
      { sub: '/borg', key: 'nav.deposit', icon: ClipboardCheck, roles: ['admin', 'staff'] },
      { sub: '/chauffeurs', key: 'nav.drivers', icon: Truck, roles: ['admin', 'staff'] },
    ],
  },
  {
    sectionKey: 'nav.section.customers',
    items: [
      { sub: '/klanten', key: 'nav.customers', icon: Users, roles: ['admin', 'staff'] },
      { sub: '/berichten', key: 'nav.messages', icon: Mail, roles: ['admin', 'staff'] },
      { sub: '/chat', key: 'nav.chat', icon: MessageCircle, roles: ['admin', 'staff'] },
      { sub: '/nieuwsbrieven', key: 'nav.newsletters', icon: Newspaper, roles: ['admin', 'staff'] },
    ],
  },
  {
    sectionKey: 'nav.section.website',
    items: [
      { sub: '/caravans', key: 'nav.caravans', icon: CarFront, roles: ['admin'] },
      { sub: '/campings', key: 'nav.campings', icon: Tent, roles: ['admin'] },
      { sub: '/kortingscodes', key: 'nav.discountCodes', icon: Tag, roles: ['admin'] },
      { sub: '/prijzen', key: 'nav.pricing', icon: Percent, roles: ['admin'] },
      { sub: '/activiteit', key: 'nav.activity', icon: History, roles: ['admin', 'staff'] },
    ],
  },
];

/* ── Page-level actions context (renders buttons next to page title) ── */
const PageActionsContext = createContext<{
  actions: ReactNode;
  setActions: (a: ReactNode) => void;
}>({ actions: null, setActions: () => {} });

/** Pages call this hook to register action buttons (e.g. +New, Refresh) in the title bar. */
export function usePageActions(actions: ReactNode) {
  const { setActions } = useContext(PageActionsContext);
  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [role, setRole] = useState<AdminRole>('staff');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginLocale, setLoginLocale] = useState<AdminLocale>('nl');
  const [showDriverLogin, setShowDriverLogin] = useState(false);
  const [driverList, setDriverList] = useState<{id: string; name: string; hasPassword: boolean}[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<{id: string; name: string; hasPassword: boolean} | null>(null);
  const [driverStep, setDriverStep] = useState<'select' | 'setup' | 'password'>('select');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverConfirmPw, setDriverConfirmPw] = useState('');
  const [driverSetupLocale, setDriverSetupLocale] = useState<'nl' | 'en' | 'es' | null>(null);
  const [driverError, setDriverError] = useState('');
  const [driverLoading, setDriverLoading] = useState(false);
  const pathname = usePathname();

  /* First-login flow states */
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showLocaleSelect, setShowLocaleSelect] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [localeSelectLoading, setLocaleSelectLoading] = useState(false);

  /* Translation helper for login screen (before context) */
  const lt = useMemo(() => createT(loginLocale), [loginLocale]);

  /* Subdomain-aware admin paths */
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');

  useEffect(() => {
    /* Restore locale */
    const savedLocale = localStorage.getItem('admin_locale') as AdminLocale | null;
    if (savedLocale && (savedLocale === 'nl' || savedLocale === 'en')) setLoginLocale(savedLocale);

    /* Verify existing session with server */
    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async (data) => {
        if (data?.authenticated) {
          setRole(data.role);
          setUsername(data.user);
          setDisplayName(data.displayName || data.user);
          if (data.mustChangePassword) {
            setAuthenticated(true);
            setShowPasswordChange(true);
          } else if (data.user !== 'staff' && !data.locale) {
            setAuthenticated(true);
            setShowLocaleSelect(true);
          } else {
            setAuthenticated(true);
            if (data.locale) {
              setLoginLocale(data.locale);
              localStorage.setItem('admin_locale', data.locale);
            }
          }
        }
      })
      .catch((e) => console.error('Fetch error:', e))
      .finally(() => setCheckingAuth(false));

    if (window.location.hostname.startsWith('admin.')) {
      setMainSiteUrl(`https://${window.location.hostname.replace('admin.', '')}`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user: username.toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRole(data.role);
        setDisplayName(data.displayName || username);
        setError('');
        localStorage.setItem('admin_last_user', username.toLowerCase());
        if (data.mustChangePassword) {
          setAuthenticated(true);
          setShowPasswordChange(true);
        } else if (data.user !== 'staff' && !data.locale) {
          setAuthenticated(true);
          setShowLocaleSelect(true);
        } else {
          setAuthenticated(true);
          if (data.locale) {
            setLoginLocale(data.locale);
            localStorage.setItem('admin_locale', data.locale);
          }
        }
      } else {
        setError(data.error || lt('auth.wrongCredentials'));
      }
    } catch {
      setError(lt('auth.wrongCredentials'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      setPasswordChangeError(lt('auth.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError(lt('auth.passwordsNoMatch'));
      return;
    }
    setPasswordChangeLoading(true);
    setPasswordChangeError('');
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPasswordChange(false);
        setNewPassword('');
        setConfirmPassword('');
        // Check if locale needs to be set
        if (username !== 'staff') {
          setShowLocaleSelect(true);
        }
      } else {
        setPasswordChangeError(data.error || 'Error');
      }
    } catch {
      setPasswordChangeError('Network error');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleLocaleSelect = async (selectedLocale: AdminLocale) => {
    setLocaleSelectLoading(true);
    try {
      await fetch('/api/admin/auth/update-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locale: selectedLocale }),
      });
      setLoginLocale(selectedLocale);
      localStorage.setItem('admin_locale', selectedLocale);
    } catch {}
    setShowLocaleSelect(false);
    setLocaleSelectLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setAuthenticated(false);
    setPassword('');
    setUsername('');
    setDisplayName('');
    setShowPasswordChange(false);
    setShowLocaleSelect(false);
  };

  /* ── Driver login from admin login page ── */
  const openDriverLogin = async () => {
    setShowDriverLogin(true);
    setDriverStep('select');
    setSelectedDriver(null);
    setDriverPassword('');
    setDriverConfirmPw('');
    setDriverSetupLocale(null);
    setDriverError('');
    try {
      const res = await fetch('/api/driver/auth/drivers');
      const data = await res.json();
      setDriverList(data.drivers || []);
    } catch { setDriverList([]); }
  };

  const closeDriverLogin = () => {
    setShowDriverLogin(false);
    setSelectedDriver(null);
    setDriverStep('select');
    setDriverPassword('');
    setDriverConfirmPw('');
    setDriverSetupLocale(null);
    setDriverError('');
  };

  const selectDriverForLogin = (d: {id: string; name: string; hasPassword: boolean}) => {
    setSelectedDriver(d);
    setDriverPassword('');
    setDriverConfirmPw('');
    setDriverSetupLocale(null);
    setDriverError('');
    setDriverStep(d.hasPassword ? 'password' : 'setup');
  };

  const handleDriverPasswordLogin = async () => {
    if (!selectedDriver || !driverPassword.trim()) return;
    setDriverLoading(true);
    setDriverError('');
    try {
      const res = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver.id, password: driverPassword.trim() }),
      });
      if (res.ok) {
        window.location.href = '/chauffeur';
      } else {
        setDriverError(lt('auth.wrongCredentials'));
      }
    } catch {
      setDriverError(lt('auth.wrongCredentials'));
    }
    setDriverLoading(false);
  };

  const handleDriverSetup = async () => {
    if (!selectedDriver || !driverSetupLocale) return;
    if (driverPassword.length < 4) { setDriverError(loginLocale === 'nl' ? 'Minimaal 4 tekens' : 'Minimum 4 characters'); return; }
    if (driverPassword !== driverConfirmPw) { setDriverError(loginLocale === 'nl' ? 'Wachtwoorden komen niet overeen' : 'Passwords do not match'); return; }
    setDriverLoading(true);
    setDriverError('');
    try {
      const res = await fetch('/api/driver/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver.id, password: driverPassword, locale: driverSetupLocale }),
      });
      if (res.ok) {
        window.location.href = '/chauffeur';
      } else {
        const data = await res.json();
        setDriverError(data.error || 'Error');
      }
    } catch {
      setDriverError('Error');
    }
    setDriverLoading(false);
  };

  /* ── Login Screen ───────────────────────────────── */
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex min-h-screen">
          {/* ====== LEFT HERO (desktop only) ====== */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <Image
                src="/images/campings/begur_sa_tuna.jpg"
                alt="Costa Brava"
                fill
                className="object-cover"
               
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-foreground/90" />
            <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
              <div>
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={240}
                  height={70}
                  className="w-44 xl:w-52 h-auto"
                 
                />
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight whitespace-pre-line">
                    {lt('auth.heroTitle')}
                  </h2>
                  <p className="text-white/60 mt-3 text-sm xl:text-base max-w-md leading-relaxed">
                    {lt('auth.heroDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { icon: <LayoutDashboard size={18} />, text: lt('auth.featDashboard') },
                    { icon: <CalendarCheck size={18} />, text: lt('auth.featBookings') },
                    { icon: <ClipboardCheck size={18} />, text: lt('auth.featDeposit') },
                    { icon: <Users size={18} />, text: lt('auth.featCustomers') },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2.5 text-white/90 text-sm"
                    >
                      <span className="text-white/60">{f.icon}</span>
                      {f.text}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="text-white/30 text-xs">© {new Date().getFullYear()} Caravanverhuur Spanje</p>
            </div>
          </div>

          {/* ====== RIGHT SIDE — FORM ====== */}
          <div className="w-full lg:w-1/2 flex flex-col relative">
            {/* Mobile hero header */}
            <div className="lg:hidden bg-foreground px-5 pt-6 pb-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <Image
                  src="/images/campings/begur_sa_tuna.jpg"
                  alt="Costa Brava"
                  fill
                  className="object-cover"
                 
                />
              </div>
              <div className="relative z-10">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={200}
                  height={60}
                  className="w-40 h-auto mb-3"
                 
                />
                <h1 className="text-xl font-bold text-white">{lt('auth.welcomeBack')}</h1>
                <p className="text-white/60 text-sm mt-1">{lt('auth.loginSubtitle')}</p>
              </div>
            </div>

            {/* Language toggle */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => { const next = loginLocale === 'nl' ? 'en' : 'nl'; setLoginLocale(next); localStorage.setItem('admin_locale', next); }}
                className="flex items-center gap-1.5 text-sm font-medium transition-all cursor-pointer px-3 py-1.5 rounded-full shadow-sm bg-white text-foreground/70 hover:text-foreground hover:shadow-md lg:bg-white/15 lg:backdrop-blur-sm lg:text-white/80 lg:hover:text-white lg:hover:bg-white/25"
              >
                <Globe className="w-4 h-4" />
                {loginLocale === 'nl' ? 'EN' : 'NL'}
              </button>
            </div>

            {/* Form container */}
            <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 -mt-4 lg:mt-0">
              <div className="w-full max-w-[420px] py-6 lg:py-0">
                {/* Desktop heading */}
                <div className="hidden lg:block mb-8">
                  <h1 className="text-2xl xl:text-3xl font-bold text-foreground">
                    {lt('auth.welcomeBack')}
                  </h1>
                  <p className="text-muted text-sm mt-1.5">
                    {lt('auth.loginSubtitle')}
                  </p>
                </div>

                {/* Form card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-5 sm:p-7"
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* User selector */}
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                        {lt('auth.selectUser')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'jake', name: 'Jake', initials: 'JK', color: 'bg-blue-500' },
                          { id: 'johan', name: 'Johan', initials: 'JH', color: 'bg-emerald-500' },
                          { id: 'helen', name: 'Helen', initials: 'HL', color: 'bg-purple-500' },
                          { id: 'dominique', name: 'Dominique', initials: 'DM', color: 'bg-amber-500' },
                          { id: 'laurens', name: 'Laurens', initials: 'LB', color: 'bg-rose-500' },
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setUsername(u.id); setError(''); }}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border-2 ${
                              username === u.id
                                ? 'border-foreground bg-foreground/5 text-foreground'
                                : 'border-transparent bg-surface text-muted hover:border-gray-200 hover:text-foreground'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-full ${u.color} flex items-center justify-center text-white text-xs font-bold`}>
                              {u.initials}
                            </div>
                            {u.name}
                          </button>
                        ))}
                        {/* Chauffeur portal entry */}
                        <button
                          type="button"
                          onClick={openDriverLogin}
                          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border-2 border-transparent bg-surface text-muted hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Truck className="w-4.5 h-4.5" />
                          </div>
                          Chauffeur
                        </button>
                      </div>
                    </div>

                    {/* Password field */}
                    {username && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                          {lt('auth.password')}
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="w-full pl-10 pr-12 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 focus:bg-white outline-none transition-all"
                            placeholder={lt('auth.enterPassword')}
                            autoFocus
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex items-start gap-2.5 bg-red-50 text-red-600 text-sm p-3 rounded-xl"
                        >
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3.5 bg-foreground text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-foreground/90 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                    >
                      {loginLoading ? lt('auth.loggingIn') || 'Bezig...' : lt('auth.login')}
                      {!loginLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                </motion.div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                  {[
                    { icon: <Shield size={13} />, text: lt('auth.trustSecure') },
                    { icon: <Lock size={13} />, text: lt('auth.trustEncrypted') },
                  ].map((badge, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-muted font-medium">
                      <span className="text-muted">{badge.icon}</span>
                      {badge.text}
                    </span>
                  ))}
                </div>

                {/* PWA install hint */}
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">💡 {lt('auth.pwaTip')}</p>
                  <p className="text-blue-600 leading-relaxed">{lt('auth.pwaInstructions')}</p>
                </div>

                {/* Back to website */}
                <a
                  href={mainSiteUrl}
                  className="block text-center text-sm text-muted mt-4 hover:text-foreground transition-colors"
                >
                  ← {lt('auth.backToWebsite')}
                </a>
              </div>
            </div>

            {/* ═══ DRIVER LOGIN MODAL ═══ */}
            <AnimatePresence>
              {showDriverLogin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                  onClick={closeDriverLogin}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="h-1.5 bg-blue-600" />
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-foreground">Chauffeur Login</h2>
                            <p className="text-xs text-muted">{loginLocale === 'nl' ? 'Selecteer je naam' : 'Select your name'}</p>
                          </div>
                        </div>
                        <button onClick={closeDriverLogin} className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Step: Select driver */}
                      {driverStep === 'select' && (
                        <div className="space-y-2">
                          {driverList.length === 0 ? (
                            <p className="text-sm text-muted text-center py-6">{loginLocale === 'nl' ? 'Laden...' : 'Loading...'}</p>
                          ) : driverList.map(d => (
                            <button key={d.id} onClick={() => selectDriverForLogin(d)}
                              className="w-full py-3 px-4 bg-gray-50 hover:bg-blue-50 rounded-xl text-left font-medium text-foreground transition cursor-pointer flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                                  {d.name.charAt(0)}
                                </div>
                                <span>{d.name}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step: Password login */}
                      {driverStep === 'password' && selectedDriver && (
                        <div className="space-y-4">
                          <button onClick={() => { setDriverStep('select'); setSelectedDriver(null); setDriverError(''); }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
                            <ChevronLeft className="w-4 h-4" /> {loginLocale === 'nl' ? 'Terug' : 'Back'}
                          </button>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Lock className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="font-semibold text-foreground">{selectedDriver.name}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{loginLocale === 'nl' ? 'Wachtwoord' : 'Password'}</label>
                            <input type="password" value={driverPassword}
                              onChange={e => setDriverPassword(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleDriverPasswordLogin()}
                              placeholder={loginLocale === 'nl' ? 'Voer wachtwoord in' : 'Enter password'}
                              className="w-full px-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none" autoFocus />
                          </div>
                          {driverError && <p className="text-sm text-red-600 text-center font-medium">{driverError}</p>}
                          <button onClick={handleDriverPasswordLogin}
                            disabled={driverLoading || !driverPassword.trim()}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                            {driverLoading ? '...' : loginLocale === 'nl' ? 'Inloggen' : 'Log in'}
                          </button>
                        </div>
                      )}

                      {/* Step: First-time setup */}
                      {driverStep === 'setup' && selectedDriver && (
                        <div className="space-y-4">
                          <button onClick={() => { setDriverStep('select'); setSelectedDriver(null); setDriverError(''); }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
                            <ChevronLeft className="w-4 h-4" /> {loginLocale === 'nl' ? 'Terug' : 'Back'}
                          </button>
                          <div className="text-center">
                            <p className="font-semibold text-foreground">{selectedDriver.name}</p>
                            <p className="text-sm text-muted">{loginLocale === 'nl' ? 'Account instellen' : 'Account setup'}</p>
                          </div>
                          {/* Language selection */}
                          <div>
                            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{loginLocale === 'nl' ? 'Kies je taal' : 'Choose your language'}</p>
                            <div className="flex gap-2">
                              {([{code: 'nl' as const, flag: '🇳🇱', label: 'NL'}, {code: 'en' as const, flag: '🇬🇧', label: 'EN'}, {code: 'es' as const, flag: '🇪🇸', label: 'ES'}]).map(l => (
                                <button key={l.code} onClick={() => setDriverSetupLocale(l.code)}
                                  className={`flex-1 py-2.5 rounded-xl text-center transition cursor-pointer border-2 ${driverSetupLocale === l.code ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                  <span className="text-lg block">{l.flag}</span>
                                  <span className="text-xs text-muted block mt-0.5">{l.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          {driverSetupLocale && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{loginLocale === 'nl' ? 'Wachtwoord' : 'Password'}</label>
                                <input type="password" value={driverPassword} onChange={e => setDriverPassword(e.target.value)}
                                  placeholder={loginLocale === 'nl' ? 'Minimaal 4 tekens' : 'Min. 4 characters'}
                                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none" autoFocus />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{loginLocale === 'nl' ? 'Bevestig' : 'Confirm'}</label>
                                <input type="password" value={driverConfirmPw} onChange={e => setDriverConfirmPw(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleDriverSetup()}
                                  placeholder={loginLocale === 'nl' ? 'Herhaal wachtwoord' : 'Repeat password'}
                                  className="w-full px-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                              </div>
                              {driverError && <p className="text-sm text-red-600 text-center font-medium">{driverError}</p>}
                              <button onClick={handleDriverSetup}
                                disabled={driverLoading || !driverPassword || !driverConfirmPw}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                                {driverLoading ? '...' : loginLocale === 'nl' ? 'Account aanmaken' : 'Create account'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  /* ── First-login: Password Change Modal ─────────── */
  if (showPasswordChange) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="h-1.5 bg-foreground" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground/5 mb-4">
                <span className="text-4xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{lt('auth.changePasswordTitle')}</h2>
              <p className="text-muted text-sm mt-1.5">{lt('auth.changePasswordDesc').replace('{name}', displayName)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{lt('auth.newPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPasswordChangeError(''); }}
                    className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 focus:bg-white outline-none transition-all"
                    placeholder={lt('auth.newPasswordPlaceholder')}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{lt('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordChangeError(''); }}
                    className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 focus:bg-white outline-none transition-all"
                    placeholder={lt('auth.confirmPasswordPlaceholder')}
                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordChange(); }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {passwordChangeError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 bg-red-50 text-red-600 text-sm p-3 rounded-xl"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{passwordChangeError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handlePasswordChange}
                disabled={passwordChangeLoading || !newPassword || !confirmPassword}
                className="w-full py-3.5 bg-foreground text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-foreground/90 active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {passwordChangeLoading ? '...' : lt('auth.setPassword')}
                {!passwordChangeLoading && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── First-login: Language Selection ─────────────── */
  if (showLocaleSelect) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="h-1.5 bg-foreground" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground/5 mb-4">
                <span className="text-4xl">🌍</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Choose your language</h2>
              <p className="text-muted text-sm mt-1.5">Kies je taal / Select your language</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLocaleSelect('nl')}
                disabled={localeSelectLoading}
                className="flex flex-col items-center gap-3 p-6 bg-surface rounded-xl border-2 border-transparent hover:border-foreground transition-all cursor-pointer active:scale-[0.97] disabled:opacity-60"
              >
                <span className="text-4xl">🇳🇱</span>
                <span className="font-semibold text-foreground">Nederlands</span>
              </button>
              <button
                onClick={() => handleLocaleSelect('en')}
                disabled={localeSelectLoading}
                className="flex flex-col items-center gap-3 p-6 bg-surface rounded-xl border-2 border-transparent hover:border-foreground transition-all cursor-pointer active:scale-[0.97] disabled:opacity-60"
              >
                <span className="text-4xl">🇬🇧</span>
                <span className="font-semibold text-foreground">English</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Authenticated Layout ───────────────────────── */
  const navSections: NavSectionFiltered[] = NAV_SECTIONS
    .map(section => ({
      sectionKey: section.sectionKey,
      items: section.items
        .filter(item => item.roles.includes(role))
        .map(i => ({ ...i, href: p(i.sub) })),
    }))
    .filter(section => section.items.length > 0);
  const allNavItems = navSections.flatMap(s => s.items);

  return (
    <AdminProvider role={role} username={username} displayName={displayName}>
      <ToastProvider>
        <AdminLayoutInner
          navSections={navSections}
          allNavItems={allNavItems}
          role={role}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mainSiteUrl={mainSiteUrl}
          onLogout={handleLogout}
        >
          {children}
        </AdminLayoutInner>
      </ToastProvider>
    </AdminProvider>
  );
}

/* ── Inner layout (has access to AdminProvider context) ── */
type OnboardingStep = { title: string; desc: string; icon: string };

const ONBOARDING_ADMIN_NL: OnboardingStep[] = [
  { title: 'Welkom bij het beheerpaneel!', desc: 'We laten je in een paar stappen zien hoe alles werkt. Je hebt een persoonlijk account — zo kunnen we bijhouden wie wat aanpast en jouw voorkeuren onthouden.', icon: '👋' },
  { title: 'Dashboard — jouw startpunt', desc: 'Het dashboard geeft direct een overzicht van nieuwe boekingen, openstaande taken en de maandomzet. Klik op een kaart om naar de details te gaan.', icon: '📊' },
  { title: 'Navigatie & Sidebar', desc: 'Links zie je de sidebar met alle menu-items. Sleep items om de volgorde aan te passen. Druk op Escape om de sidebar in/uit te klappen. Op mobiel open je het menu met de hamburger-knop.', icon: '📱' },
  { title: 'Boekingen & Planning', desc: 'Beheer alle boekingen en bekijk de visuele bezettingskalender. Via "Nieuwe boeking" kun je ook telefonische reserveringen aanmaken — de klant ontvangt automatisch een betaallink.', icon: '📅' },
  { title: 'Betalingen & Borg', desc: 'Volg betalingen en verwerk terugbetalingen via Stripe. Bij vertrek gebruik je "Mobiel Inspecteren" om samen met de klant de borgchecklist af te lopen.', icon: '💳' },
  { title: 'Klanten & Communicatie', desc: 'Bekijk klantgegevens, beantwoord contactberichten en reageer op live chats. Bij elke wijziging zie je subtiel wie de laatste aanpassing heeft gedaan.', icon: '👥' },
  { title: 'Caravans & Campings', desc: 'Beheer je caravanaanbod (prijzen, foto\'s, faciliteiten) en de campinglijst. Sleep campings om de volgorde op de website aan te passen.', icon: '🏕️' },
  { title: 'Chauffeurs', desc: 'Beheer je chauffeurs via het chauffeurscherm. Chauffeurs loggen in via het loginscherm (klik op "Chauffeur"). Je kunt wachtwoorden resetten en chauffeurs deactiveren in het admin paneel.', icon: '🚐' },
  { title: 'Sneltoetsen & Hulp', desc: 'Escape = sidebar in/uitklappen. ⌘K = zoeken. Klik op het vraagteken (?) voor hulp per pagina. Je taalvoorkeur wordt per account opgeslagen. Veel succes!', icon: '🚀' },
];

const ONBOARDING_ADMIN_EN: OnboardingStep[] = [
  { title: 'Welcome to the admin panel!', desc: 'We\'ll walk you through how everything works in a few quick steps. You have a personal account — so we can track who changed what and remember your preferences.', icon: '👋' },
  { title: 'Dashboard — your starting point', desc: 'The dashboard gives you an instant overview of new bookings, open tasks, and monthly revenue. Click any card to go straight to the details.', icon: '📊' },
  { title: 'Navigation & Sidebar', desc: 'The sidebar on the left shows all menu items. Drag items to reorder them. Press Escape to collapse/expand the sidebar. On mobile, open the menu with the hamburger button.', icon: '📱' },
  { title: 'Bookings & Planning', desc: 'Manage all bookings and view the visual occupancy calendar. Use "New booking" to create phone reservations — the customer automatically receives a payment link.', icon: '📅' },
  { title: 'Payments & Deposit', desc: 'Track payments and process refunds through Stripe. At check-out, use "Mobile Inspect" to walk through the deposit checklist together with the customer.', icon: '💳' },
  { title: 'Customers & Communication', desc: 'View customer data, answer contact form messages, and respond to live chats. Each change subtly shows who made the last modification.', icon: '👥' },
  { title: 'Caravans & Campings', desc: 'Manage your caravan inventory (prices, photos, facilities) and the camping list. Drag campings to reorder them on the website.', icon: '🏕️' },
  { title: 'Drivers', desc: 'Manage your drivers from the drivers page. Drivers log in via the login screen (click "Chauffeur"). You can reset passwords and deactivate drivers from the admin panel.', icon: '🚐' },
  { title: 'Keyboard Shortcuts & Help', desc: 'Escape = toggle sidebar. ⌘K = search. Click the question mark (?) in the top-right for context-sensitive help per page. Your language preference is saved per account. Good luck!', icon: '🚀' },
];

const ONBOARDING_STAFF_NL: OnboardingStep[] = [
  { title: 'Welkom bij het portaal!', desc: 'Als staff-medewerker kun je boekingen beheren, chats beantwoorden en borginspecties uitvoeren. We laten je snel zien hoe alles werkt.', icon: '👋' },
  { title: 'Dashboard — jouw overzicht', desc: 'Het dashboard toont openstaande taken en recente boekingen. Controleer dit dagelijks zodat je niets mist.', icon: '📊' },
  { title: 'Navigatie & Sidebar', desc: 'Links zie je het menu. Druk op Escape om de sidebar in/uit te klappen. Op mobiel open je het menu met de hamburger-knop linksboven.', icon: '📱' },
  { title: 'Boekingen beheren', desc: 'Bekijk alle boekingen, zoek op naam of referentie, en maak telefonische boekingen aan. De klant ontvangt automatisch een betaallink per e-mail.', icon: '📅' },
  { title: 'Borg & Inspectie', desc: 'Gebruik de mobiele inspectietool om samen met de klant de borgchecklist stap voor stap door te lopen. Maak foto\'s van eventuele schade als bewijs.', icon: '📋' },
  { title: 'Live Chat', desc: 'Beantwoord vragen van websitebezoekers via de live chat. Reageer zo snel mogelijk — bezoekers verwachten een snel antwoord.', icon: '💬' },
  { title: 'Hulp & Sneltoetsen', desc: 'Escape = sidebar in/uitklappen. ⌘K = zoeken. Klik op het vraagteken (?) rechtsboven voor hulp per pagina. Succes!', icon: '🚀' },
];

const ONBOARDING_STAFF_EN: OnboardingStep[] = [
  { title: 'Welcome to the portal!', desc: 'As a staff member, you can manage bookings, answer chats, and perform deposit inspections. Let\'s show you how everything works.', icon: '👋' },
  { title: 'Dashboard — your overview', desc: 'The dashboard shows open tasks and recent bookings. Check this daily so you don\'t miss anything.', icon: '📊' },
  { title: 'Navigation & Sidebar', desc: 'The menu is on the left. Press Escape to collapse/expand the sidebar. On mobile, open the menu with the hamburger button top-left.', icon: '📱' },
  { title: 'Manage bookings', desc: 'View all bookings, search by name or reference, and create phone bookings. The customer automatically receives a payment link by email.', icon: '📅' },
  { title: 'Deposit & Inspection', desc: 'Use the mobile inspection tool to walk through the deposit checklist step by step with the customer. Take photos of any damage as evidence.', icon: '📋' },
  { title: 'Live Chat', desc: 'Answer questions from website visitors via live chat. Respond as quickly as possible — visitors expect a fast reply.', icon: '💬' },
  { title: 'Help & Keyboard Shortcuts', desc: 'Escape = toggle sidebar. ⌘K = search. Click the question mark (?) in the top-right for page-specific help. Good luck!', icon: '🚀' },
];


/* ── Sidebar Nav Item with dedicated drag handle ── */
function SidebarNavItem({
  item,
  isActive,
  onNavigate,
  t,
  badge,
  isMobile,
  collapsed,
}: {
  item: { href: string; key: string; icon: typeof LayoutDashboard };
  isActive: boolean;
  onNavigate: () => void;
  t: (key: string) => string;
  badge?: number;
  isMobile?: boolean;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const controls = useDragControls();
  const isDraggingRef = useRef(false);
  const Icon = item.icon;

  const linkContent = (
    <div className="relative group/nav">
      {/* Drag handle — outside the link, only on desktop expanded */}
      {!isMobile && !collapsed && (
        <div
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover/nav:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-3 h-3 text-gray-300" />
        </div>
      )}
      <Link
        href={item.href}
        onClick={(e) => {
          if (isDraggingRef.current) {
            e.preventDefault();
            return;
          }
          e.preventDefault();
          router.push(item.href);
          onNavigate();
        }}
        draggable={false}
        title={collapsed ? t(item.key) : undefined}
        className={`flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-foreground text-white shadow-sm'
            : 'text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground'
        }`}
      >
        <div className="relative shrink-0">
          <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : ''}`} />
          {collapsed && badge && badge > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{t(item.key)}</span>
            {badge && badge > 0 ? (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shrink-0">
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </>
        )}
      </Link>
    </div>
  );

  if (isMobile) {
    return <li className="list-none">{linkContent}</li>;
  }

  if (collapsed) {
    return (
      <li className="list-none relative group">
        {linkContent}
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[60] shadow-lg">
          {t(item.key)}
        </div>
      </li>
    );
  }

  return (
    <Reorder.Item
      value={item.href}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 200); }}
      whileDrag={{ scale: 1.04, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 50 }}
      className="list-none"
    >
      {linkContent}
    </Reorder.Item>
  );
}

function AdminLayoutInner({
  navSections,
  allNavItems,
  role,
  pathname,
  sidebarOpen,
  setSidebarOpen,
  mainSiteUrl,
  onLogout,
  children,
}: {
  navSections: NavSectionFiltered[];
  allNavItems: NavItemWithHref[];
  role: AdminRole;
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  mainSiteUrl: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  /* Use the admin context for translations */
  const { t, locale, setLocale, username: ctxUsername, displayName: ctxDisplayName, role: ctxRole } = useAdminCtx();
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');
  const [pageActions, setPageActions] = useState<ReactNode>(null);
  const pageActionsValue = useMemo(() => ({ actions: pageActions, setActions: setPageActions }), [pageActions]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [settingsCurrentPw, setSettingsCurrentPw] = useState('');
  const [settingsNewPw, setSettingsNewPw] = useState('');
  const [settingsConfirmPw, setSettingsConfirmPw] = useState('');
  const [settingsPwError, setSettingsPwError] = useState('');
  const [settingsPwLoading, setSettingsPwLoading] = useState(false);
  const [settingsShowCurrent, setSettingsShowCurrent] = useState(false);
  const [settingsShowNew, setSettingsShowNew] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showAssistant, setShowAssistant] = useState(false);
  const [navOrders, setNavOrders] = useState<Record<string, string[]>>({});
  const [badges, setBadges] = useState<Record<string, number>>({});
  const prevBadgesRef = useRef<Record<string, number>>({});
  const initialBadgeLoadRef = useRef(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ bookings: Record<string, unknown>[]; contacts: Record<string, unknown>[]; customers: Record<string, unknown>[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const hoverExpandedRef = useRef(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Notification sound via Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(784, ctx.currentTime + 0.15); // G5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587 * 1.5, ctx.currentTime);
      osc2.frequency.setValueAtTime(784 * 1.5, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch { /* audio not available */ }
  }, []);

  // Restore notification preference
  useEffect(() => {
    const saved = localStorage.getItem('admin_notif_enabled');
    if (saved === 'true') setNotifEnabled(true);
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!notifEnabled) {
      // Enable: request permission if needed
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm !== 'granted') {
          toast(t('common.notificationsDisabled'), 'warning');
          return;
        }
      }
      setNotifEnabled(true);
      localStorage.setItem('admin_notif_enabled', 'true');
      toast(t('common.notificationsEnabled'), 'success');
    } else {
      setNotifEnabled(false);
      localStorage.setItem('admin_notif_enabled', 'false');
      toast(t('common.notificationsDisabled'), 'info');
    }
  }, [notifEnabled, toast, t]);

  // Send notification (sound + browser + toast)
  const sendNotification = useCallback((title: string, body: string, href: string) => {
    // Sound
    playNotificationSound();

    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: 'https://u.cubeupload.com/laurensbos/Caravanverhuur1.png',
        tag: 'admin-notif-' + Date.now(),
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = href;
        notif.close();
      };
    }

    // Toast
    toast(`${title}: ${body}`, 'info');
  }, [playNotificationSound, toast]);

  // Settings: change password
  const handleSettingsPasswordChange = async () => {
    if (!settingsCurrentPw) {
      setSettingsPwError(t('auth.currentPassword') + ' ' + t('common.required'));
      return;
    }
    if (settingsNewPw.length < 8) {
      setSettingsPwError(t('auth.passwordMinLength'));
      return;
    }
    if (settingsNewPw !== settingsConfirmPw) {
      setSettingsPwError(t('auth.passwordsNoMatch'));
      return;
    }
    setSettingsPwLoading(true);
    setSettingsPwError('');
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: settingsCurrentPw, newPassword: settingsNewPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSettingsPassword(false);
        setSettingsCurrentPw('');
        setSettingsNewPw('');
        setSettingsConfirmPw('');
        toast(t('auth.passwordChanged'), 'success');
      } else {
        setSettingsPwError(data.error || t('common.error'));
      }
    } catch {
      setSettingsPwError(t('common.error'));
    } finally {
      setSettingsPwLoading(false);
    }
  };

  // Detect mobile (< lg breakpoint)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Restore sidebar open/closed from localStorage (desktop defaults to open)
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    } else {
      // Default: open on desktop, closed on mobile
      const isCurrentlyMobile = window.matchMedia('(max-width: 1023px)').matches;
      setSidebarOpen(!isCurrentlyMobile);
    }
  }, []);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSidebar = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem('admin_sidebar_open', String(next));
    hoverExpandedRef.current = false;
  };

  const handleSidebarMouseEnter = () => {
    if (isMobile || sidebarOpen) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      hoverExpandedRef.current = true;
      setSidebarOpen(true);
      hoverTimerRef.current = null;
    }, 300);
  };

  const handleSidebarMouseLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    if (isMobile || !hoverExpandedRef.current) return;
    hoverTimerRef.current = setTimeout(() => {
      hoverExpandedRef.current = false;
      setSidebarOpen(false);
      hoverTimerRef.current = null;
    }, 200);
  };

  // Fetch badge counts periodically & trigger notifications on changes
  useEffect(() => {
    const fetchBadges = () => {
      fetch('/api/admin/badges', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            const map: Record<string, number> = {};
            if (data.bookings > 0) map['nav.bookings'] = data.bookings;
            if (data.contacts > 0) map['nav.messages'] = data.contacts;
            if (data.chats > 0) map['nav.chat'] = data.chats;
            if (data.payments > 0) map['nav.payments'] = data.payments;

            // Detect increases and send notifications
            if (notifEnabled && !initialBadgeLoadRef.current) {
              const prev = prevBadgesRef.current;
              const prevChats = prev['nav.chat'] || 0;
              const prevContacts = prev['nav.messages'] || 0;
              const newChats = map['nav.chat'] || 0;
              const newContacts = map['nav.messages'] || 0;

              if (newChats > prevChats && prevChats >= 0) {
                sendNotification(
                  t('common.newChat'),
                  t('common.newChatDesc'),
                  '/admin/chat'
                );
              }
              if (newContacts > prevContacts && prevContacts >= 0) {
                sendNotification(
                  t('common.newContact'),
                  t('common.newContactDesc'),
                  '/admin/berichten'
                );
              }
            }

            prevBadgesRef.current = map;
            setBadges(map);
            initialBadgeLoadRef.current = false;
          }
        })
        .catch(() => {});
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000); // every 15s
    return () => clearInterval(interval);
  }, [notifEnabled, sendNotification, t]);

  // Global search debounced
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setSearchResults(data);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => {
          const input = searchRef.current?.querySelector('input');
          input?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Restore nav orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`admin_nav_orders_${role}`);
    if (saved) {
      try {
        setNavOrders(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, [role]);

  // Get ordered items for a section
  const getOrderedItems = (sectionKey: string, items: NavItemWithHref[]) => {
    const order = navOrders[sectionKey];
    if (!order || order.length === 0) return items;
    return [...items].sort((a, b) => {
      const ai = order.indexOf(a.href);
      const bi = order.indexOf(b.href);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  };

  const handleSectionReorder = (sectionKey: string, newOrder: string[]) => {
    setNavOrders(prev => {
      const updated = { ...prev, [sectionKey]: newOrder };
      localStorage.setItem(`admin_nav_orders_${role}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Show onboarding on first login (or after tour update)
  useEffect(() => {
    const key = `admin_onboarded_v4_${role}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [role]);

  const finishOnboarding = () => {
    localStorage.setItem(`admin_onboarded_v4_${role}`, 'true');
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const onboardingSteps = role === 'admin'
    ? (locale === 'nl' ? ONBOARDING_ADMIN_NL : ONBOARDING_ADMIN_EN)
    : (locale === 'nl' ? ONBOARDING_STAFF_NL : ONBOARDING_STAFF_EN);

  const restartTour = () => {
    setOnboardingStep(0);
    setShowOnboarding(true);
  };

  // Close modals/sidebar on Escape (toggle sidebar on desktop)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showOnboarding) finishOnboarding();
        else if (showAssistant) setShowAssistant(false);
        else if (showSettingsPassword) setShowSettingsPassword(false);
        else {
          // Toggle sidebar on Escape (collapse/expand)
          const next = !sidebarOpen;
          setSidebarOpen(next);
          localStorage.setItem('admin_sidebar_open', String(next));
          hoverExpandedRef.current = false;
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [showOnboarding, showAssistant, showSettingsPassword, sidebarOpen]);

  return (
    <div className="min-h-screen bg-surface-alt flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => { setSidebarOpen(false); localStorage.setItem('admin_sidebar_open', 'false'); }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={`fixed inset-y-0 left-0 z-50 bg-[#F1F5F9] text-foreground flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-border ${
          isMobile
            ? `w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : sidebarOpen ? 'w-64 overflow-x-hidden' : 'w-16'
        }`}
      >
        {/* Logo + close button */}
        <div className={`${sidebarOpen ? 'px-4 lg:px-5' : 'px-2'} pt-3 pb-1 lg:pt-4 lg:pb-2`}>
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Costa Brava"
                  width={200}
                  height={56}
                  className="w-32 lg:w-40 h-auto"
                />
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-foreground hover:bg-gray-200/60 transition-colors cursor-pointer"
                  title="Sidebar sluiten"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer mx-auto"
                title="Sidebar openen (Esc)"
              >
                <ChevronRight size={18} className="text-foreground/70" />
              </button>
            )}
          </div>
        </div>

        <nav className={`flex-1 ${sidebarOpen ? 'p-3' : 'p-1.5'} overflow-y-auto space-y-2`}>
          {navSections.map((section) => {
            const orderedItems = getOrderedItems(section.sectionKey, section.items);
            const collapsed = !sidebarOpen && !isMobile;
            return (
              <div key={section.sectionKey}>
                {!collapsed && !isMobile && (
                  <div>
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/50">{t(section.sectionKey)}</p>
                    <Reorder.Group
                      axis="y"
                      values={orderedItems.map(i => i.href)}
                      onReorder={(newOrder) => handleSectionReorder(section.sectionKey, newOrder)}
                      className="space-y-0.5"
                    >
                      {orderedItems.map((item) => (
                        <SidebarNavItem
                          key={item.href}
                          item={item}
                          isActive={pathname === item.href}
                          onNavigate={() => {}}
                          t={t}
                          badge={badges[item.key]}
                        />
                      ))}
                    </Reorder.Group>
                  </div>
                )}
                {collapsed && (
                  <ul className="space-y-0.5">
                    {orderedItems.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        onNavigate={() => {}}
                        t={t}
                        badge={badges[item.key]}
                        collapsed
                      />
                    ))}
                  </ul>
                )}
                {isMobile && (
                  <div>
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/50">{t(section.sectionKey)}</p>
                    <ul className="space-y-0.5">
                    {orderedItems.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        onNavigate={() => { setSidebarOpen(false); localStorage.setItem('admin_sidebar_open', 'false'); }}
                        t={t}
                        badge={badges[item.key]}
                        isMobile
                      />
                    ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          {sidebarOpen ? (
            <div className="flex items-center gap-1 px-2">
              <a
                href={mainSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-200/60 hover:text-foreground transition-colors flex-1 min-w-0"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('nav.viewWebsite')}</span>
              </a>
            </div>
          ) : !isMobile ? (
            <div className="flex flex-col items-center gap-1">
              <div className="relative group">
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/60 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[60] shadow-lg">
                  {t('nav.viewWebsite')}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        !isMobile ? (sidebarOpen ? 'lg:ml-64' : 'lg:ml-16') : ''
      }`}>
        {/* Top bar — utility row */}
        <header className="bg-[#F8FAFC] sticky top-0 z-30 border-b border-border">
          {/* Row 1: utility items */}
          <div className="px-3 py-2 flex items-center gap-1.5 lg:px-6 lg:gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 -ml-1 rounded-xl hover:bg-surface-alt transition-colors cursor-pointer text-foreground"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 min-w-0" />

            {/* Global search */}
            <div ref={searchRef} className="relative hidden sm:block">
              <div
                className={`flex items-center gap-2 rounded-xl border transition-all duration-200 ${
                  searchOpen
                    ? 'w-64 lg:w-80 border-foreground/20 bg-white shadow-md'
                    : 'w-40 lg:w-52 border-border bg-surface hover:border-foreground/10 cursor-pointer'
                }`}
                onClick={() => { if (!searchOpen) setSearchOpen(true); }}
              >
                <Search size={15} className="ml-3 text-muted shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={locale === 'nl' ? 'Zoeken... ⌘K' : 'Search... ⌘K'}
                  className="flex-1 py-2 pr-3 text-sm bg-transparent outline-none placeholder:text-muted/60"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="pr-3 text-muted hover:text-foreground cursor-pointer">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search results dropdown */}
              <AnimatePresence>
                {searchOpen && searchQuery.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1.5 w-80 lg:w-96 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                  >
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm text-muted">{t('common.loading')}</div>
                    ) : !searchResults || (searchResults.bookings.length === 0 && searchResults.contacts.length === 0 && searchResults.customers.length === 0) ? (
                      <div className="p-4 text-center text-sm text-muted">{t('common.noResults')}</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {searchResults.bookings.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-gray-50 text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                              <CalendarCheck size={12} /> {t('nav.bookings')} ({searchResults.bookings.length})
                            </div>
                            {searchResults.bookings.slice(0, 5).map((b) => (
                              <Link
                                key={b.id as string}
                                href={p('/boekingen')}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors"
                              >
                                <CalendarCheck size={14} className="text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{b.guest_name as string}</p>
                                  <p className="text-xs text-muted truncate">{b.reference as string} · {b.guest_email as string}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  b.status === 'NIEUW' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>{b.status as string}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.contacts.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-gray-50 text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                              <Mail size={12} /> {t('nav.messages')} ({searchResults.contacts.length})
                            </div>
                            {searchResults.contacts.slice(0, 5).map((c) => (
                              <Link
                                key={c.id as string}
                                href={p('/berichten')}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors"
                              >
                                <Mail size={14} className="text-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{c.name as string}</p>
                                  <p className="text-xs text-muted truncate">{c.subject as string}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  c.status === 'NIEUW' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>{c.status as string}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.customers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-gray-50 text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                              <Users size={12} /> {t('nav.customers')} ({searchResults.customers.length})
                            </div>
                            {searchResults.customers.slice(0, 5).map((cu) => (
                              <Link
                                key={cu.id as string}
                                href={p('/klanten')}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors"
                              >
                                <User size={14} className="text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{cu.name as string}</p>
                                  <p className="text-xs text-muted truncate">{cu.email as string} · {cu.phone as string}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile search button */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); }}
              className="sm:hidden p-2 rounded-xl hover:bg-surface-alt transition-colors cursor-pointer text-muted hover:text-foreground"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === 'nl' ? 'en' : 'nl')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-muted hover:bg-surface-alt hover:text-foreground transition-colors cursor-pointer"
              title={locale === 'nl' ? 'Switch to English' : 'Wissel naar Nederlands'}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'nl' ? 'EN' : 'NL'}</span>
            </button>

            {/* User dropdown */}
            {ctxUsername && ctxUsername !== 'staff' && (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs text-muted font-medium px-2 py-1.5 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-[11px] font-bold text-foreground">
                    {ctxDisplayName.charAt(0)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-border py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{ctxDisplayName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{ctxRole}</p>
                      </div>
                      <button
                        onClick={() => { setUserDropdownOpen(false); setShowSettingsPassword(true); setSettingsPwError(''); setSettingsCurrentPw(''); setSettingsNewPw(''); setSettingsConfirmPw(''); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-gray-400" />
                        {t('auth.changePassword')}
                      </button>
                      <div className="h-px bg-border mx-2" />
                      <button
                        onClick={() => { setUserDropdownOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notifications */}
            <button
              onClick={toggleNotifications}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                notifEnabled
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted hover:bg-surface-alt hover:text-foreground'
              }`}
              aria-label={t('common.notifications')}
              title={notifEnabled ? t('common.notificationsEnabled') : t('common.enableNotifications')}
            >
              {notifEnabled ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
              {notifEnabled && (badges['nav.chat'] || badges['nav.messages']) ? (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              ) : null}
            </button>

            {/* Smart Suggestions toggle */}
            <button
              onClick={() => setShowAssistant(!showAssistant)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${showAssistant ? 'bg-violet-100 text-violet-700' : 'text-muted hover:bg-surface-alt hover:text-foreground'}`}
              aria-label="Smart Suggestions"
              title="Smart Suggestions"
            >
              {showAssistant ? <PanelRightClose className="w-4.5 h-4.5" /> : <PanelRightOpen className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Row 2: page title + page actions */}
          <div className="px-3 py-2 lg:px-6 flex items-center gap-3 border-t border-border/50 bg-white">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                {allNavItems.find((n) => n.href === pathname)
                  ? t(allNavItems.find((n) => n.href === pathname)!.key)
                  : 'Admin'}
              </h1>
              {(() => {
                const navItem = allNavItems.find((n) => n.href === pathname);
                if (!navItem) return null;
                const shortKey = navItem.key.replace('nav.', '');
                const desc = t(`nav.desc.${shortKey}`);
                return desc && desc !== `nav.desc.${shortKey}` ? (
                  <p className="text-xs text-muted truncate hidden sm:block">{desc}</p>
                ) : null;
              })()}
            </div>
            {/* Page-level actions injected via usePageActions */}
            {pageActions && (
              <div className="flex items-center gap-1.5">
                {pageActions}
              </div>
            )}
          </div>
        </header>

        {/* Mobile search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden bg-white border-b border-border overflow-hidden"
            >
              <div className="px-3 py-2" ref={searchRef}>
                <div className="flex items-center gap-2 bg-surface rounded-xl px-3">
                  <Search size={15} className="text-muted shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'nl' ? 'Zoek boekingen, klanten...' : 'Search bookings, customers...'}
                    className="flex-1 py-2.5 text-sm bg-transparent outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="text-muted cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {/* Mobile search results */}
                {searchQuery.length >= 2 && (
                  <div className="mt-2 rounded-xl border border-border overflow-hidden max-h-[50vh] overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-3 text-center text-sm text-muted">{t('common.loading')}</div>
                    ) : !searchResults || (searchResults.bookings.length === 0 && searchResults.contacts.length === 0 && searchResults.customers.length === 0) ? (
                      <div className="p-3 text-center text-sm text-muted">{t('common.noResults')}</div>
                    ) : (
                      <>
                        {searchResults.bookings.slice(0, 3).map((b) => (
                          <Link key={b.id as string} href={p('/boekingen')} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5">
                            <CalendarCheck size={14} className="text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{b.guest_name as string}</p>
                              <p className="text-xs text-muted truncate">{b.reference as string}</p>
                            </div>
                          </Link>
                        ))}
                        {searchResults.contacts.slice(0, 3).map((c) => (
                          <Link key={c.id as string} href={p('/berichten')} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5">
                            <Mail size={14} className="text-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.name as string}</p>
                              <p className="text-xs text-muted truncate">{c.subject as string}</p>
                            </div>
                          </Link>
                        ))}
                        {searchResults.customers.slice(0, 3).map((cu) => (
                          <Link key={cu.id as string} href={p('/klanten')} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5">
                            <User size={14} className="text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{cu.name as string}</p>
                              <p className="text-xs text-muted truncate">{cu.email as string}</p>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content with fade-in */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-3 lg:p-6 overflow-auto"
        >
          <PageActionsContext.Provider value={pageActionsValue}>
            {children}
          </PageActionsContext.Provider>
        </motion.main>
      </div>

      {/* ═══ ONBOARDING MODAL ═══ */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={finishOnboarding}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Top gradient accent bar */}
              <div className="h-1.5 bg-foreground" />

              <div className="p-6 sm:p-8">
                {/* Step counter + progress bar */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    {locale === 'nl' ? 'Stap' : 'Step'} {onboardingStep + 1} / {onboardingSteps.length}
                  </span>
                  <button
                    onClick={finishOnboarding}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {locale === 'nl' ? 'Overslaan' : 'Skip tour'}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-100 rounded-full mb-8 overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground rounded-full"
                    initial={false}
                    animate={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={onboardingStep}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="text-center"
                  >
                    {/* Icon with gradient background */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground/5 mb-5">
                      <span className="text-5xl leading-none">{onboardingSteps[onboardingStep].icon}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{onboardingSteps[onboardingStep].title}</h2>
                    <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{onboardingSteps[onboardingStep].desc}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10">
                  {onboardingStep > 0 ? (
                    <button
                      onClick={() => setOnboardingStep(s => s - 1)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      {locale === 'nl' ? 'Vorige' : 'Back'}
                    </button>
                  ) : (
                    <div />
                  )}
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <button
                      onClick={() => setOnboardingStep(s => s + 1)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-white rounded-xl font-semibold transition-all hover:bg-foreground/90 cursor-pointer active:scale-[0.97]"
                    >
                      {locale === 'nl' ? 'Volgende' : 'Next'}
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={finishOnboarding}
                      className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-white rounded-xl font-semibold transition-all hover:bg-foreground/90 cursor-pointer active:scale-[0.97]"
                    >
                      {locale === 'nl' ? 'Aan de slag!' : 'Get started!'}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SETTINGS: CHANGE PASSWORD MODAL ═══ */}
      <AnimatePresence>
        {showSettingsPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowSettingsPassword(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1.5 bg-foreground" />
              <div className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-foreground/5 mb-3">
                    <Lock className="w-7 h-7 text-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{t('auth.changePasswordSettingsTitle')}</h2>
                  <p className="text-muted text-sm mt-1.5">{t('auth.changePasswordSettingsDesc')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t('auth.currentPassword')}</label>
                    <div className="relative">
                      <input
                        type={settingsShowCurrent ? 'text' : 'password'}
                        value={settingsCurrentPw}
                        onChange={e => setSettingsCurrentPw(e.target.value)}
                        placeholder={t('auth.currentPasswordPlaceholder')}
                        className="w-full px-4 py-3 bg-surface rounded-xl text-sm outline-none focus:ring-2 focus:ring-foreground/20 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setSettingsShowCurrent(!settingsShowCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                      >
                        {settingsShowCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t('auth.newPassword')}</label>
                    <div className="relative">
                      <input
                        type={settingsShowNew ? 'text' : 'password'}
                        value={settingsNewPw}
                        onChange={e => setSettingsNewPw(e.target.value)}
                        placeholder={t('auth.newPasswordPlaceholder')}
                        className="w-full px-4 py-3 bg-surface rounded-xl text-sm outline-none focus:ring-2 focus:ring-foreground/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setSettingsShowNew(!settingsShowNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                      >
                        {settingsShowNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t('auth.confirmPassword')}</label>
                    <input
                      type="password"
                      value={settingsConfirmPw}
                      onChange={e => setSettingsConfirmPw(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className="w-full px-4 py-3 bg-surface rounded-xl text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                      onKeyDown={e => { if (e.key === 'Enter') handleSettingsPasswordChange(); }}
                    />
                  </div>

                  {settingsPwError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                      <AlertCircle size={14} className="shrink-0" />
                      {settingsPwError}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSettingsPassword(false)}
                    className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSettingsPasswordChange}
                    disabled={settingsPwLoading}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-foreground rounded-xl hover:bg-foreground/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {settingsPwLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} />
                        {t('auth.changePassword')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SMART SUGGESTIONS ═══ */}
      <AdminAssistant
        locale={locale as 'nl' | 'en'}
        pathname={pathname}
        open={showAssistant}
        onClose={() => setShowAssistant(false)}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, ReactNode, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Mail,
  CarFront,
  ClipboardCheck,
  Users,
  LogOut,
  Menu,
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
} from 'lucide-react';
import { AdminProvider, useAdmin as useAdminCtx } from '@/i18n/admin-context';
import { createT, type AdminLocale, type AdminRole } from '@/i18n/admin-translations';

/* ── Credentials ─────────────────────────────────── */
const CREDENTIALS: Record<string, { password: string; role: AdminRole }> = {
  admin: { password: 'CostaAdmin2026!', role: 'admin' },
  staff: { password: 'CostaStaff2026!', role: 'staff' },
};

/* ── Nav items with role-based access ───────────── */
const NAV_ITEMS: { sub: string; key: string; icon: typeof LayoutDashboard; roles: AdminRole[] }[] = [
  { sub: '', key: 'nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { sub: '/boekingen', key: 'nav.bookings', icon: CalendarCheck, roles: ['admin', 'staff'] },
  { sub: '/betalingen', key: 'nav.payments', icon: CreditCard, roles: ['admin'] },
  { sub: '/berichten', key: 'nav.messages', icon: Mail, roles: ['admin'] },
  { sub: '/caravans', key: 'nav.caravans', icon: CarFront, roles: ['admin'] },
  { sub: '/borg', key: 'nav.deposit', icon: ClipboardCheck, roles: ['admin', 'staff'] },
  { sub: '/klanten', key: 'nav.customers', icon: Users, roles: ['admin'] },
  { sub: '/nieuwsbrieven', key: 'nav.newsletters', icon: Newspaper, roles: ['admin'] },
  { sub: '/kortingscodes', key: 'nav.discountCodes', icon: Tag, roles: ['admin'] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AdminRole>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');
  const [loginLocale, setLoginLocale] = useState<AdminLocale>('nl');
  const pathname = usePathname();

  /* Translation helper for login screen (before context) */
  const lt = useMemo(() => createT(loginLocale), [loginLocale]);

  /* Subdomain-aware admin paths */
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');

  useEffect(() => {
    /* Restore locale */
    const savedLocale = localStorage.getItem('admin_locale') as AdminLocale | null;
    if (savedLocale && (savedLocale === 'nl' || savedLocale === 'en')) setLoginLocale(savedLocale);

    /* Restore auth */
    const storedAuth = sessionStorage.getItem('admin_auth') || localStorage.getItem('admin_auth');
    const storedRole = (sessionStorage.getItem('admin_role') || localStorage.getItem('admin_role')) as AdminRole | null;
    if (storedAuth === 'true') {
      setAuthenticated(true);
      if (storedRole === 'admin' || storedRole === 'staff') setRole(storedRole);
    }
    if (window.location.hostname.startsWith('admin.')) {
      setMainSiteUrl(`https://${window.location.hostname.replace('admin.', '')}`);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cred = CREDENTIALS[username.toLowerCase()];
    if (cred && password === cred.password) {
      sessionStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_role', cred.role);
      if (rememberMe) {
        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_role', cred.role);
      }
      setRole(cred.role);
      setAuthenticated(true);
      setError('');
    } else {
      setError(lt('auth.wrongCredentials'));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_role');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_role');
    setAuthenticated(false);
    setPassword('');
    setUsername('');
  };

  /* ── Login Screen ───────────────────────────────── */
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex min-h-screen">
          {/* ====== LEFT HERO (desktop only) ====== */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-[#0C4A6E] overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Begur_Sa_Tuna_05_JMM.JPG/1280px-Begur_Sa_Tuna_05_JMM.JPG"
                alt="Costa Brava"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C4A6E]/80 via-[#0C4A6E]/60 to-[#0C4A6E]/90" />
            <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
              <div>
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={240}
                  height={70}
                  className="w-44 xl:w-52 h-auto"
                  unoptimized
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
                      <span className="text-sky-300">{f.icon}</span>
                      {f.text}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="text-white/30 text-xs">© {new Date().getFullYear()} Caravanverhuur Spanje</p>
            </div>
          </div>

          {/* ====== RIGHT SIDE — FORM ====== */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {/* Mobile hero header */}
            <div className="lg:hidden bg-[#0C4A6E] px-5 pt-6 pb-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Begur_Sa_Tuna_05_JMM.JPG/1280px-Begur_Sa_Tuna_05_JMM.JPG"
                  alt="Costa Brava"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="relative z-10">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={200}
                  height={60}
                  className="w-40 h-auto mb-3"
                  unoptimized
                />
                <h1 className="text-xl font-bold text-white">{lt('auth.welcomeBack')}</h1>
                <p className="text-white/60 text-sm mt-1">{lt('auth.loginSubtitle')}</p>
              </div>
            </div>

            {/* Language toggle */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => { const next = loginLocale === 'nl' ? 'en' : 'nl'; setLoginLocale(next); localStorage.setItem('admin_locale', next); }}
                className="flex items-center gap-1.5 text-muted hover:text-foreground text-sm transition-colors cursor-pointer bg-surface px-3 py-1.5 rounded-full shadow-sm lg:bg-white/10 lg:text-white/70 lg:hover:text-white"
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
                    {/* Role selector (tab style) */}
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                        {lt('auth.selectRole')}
                      </label>
                      <div className="flex bg-surface rounded-xl p-1">
                        {(['admin', 'staff'] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => { setUsername(u); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              username === u
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                            {u === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            {u.charAt(0).toUpperCase() + u.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                        {lt('auth.password')}
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); }}
                          className="w-full pl-10 pr-12 py-3 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
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
                    </div>

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

                    {/* Remember me */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                      />
                      <span className="text-sm text-muted">{lt('auth.rememberMe')}</span>
                    </label>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] cursor-pointer"
                    >
                      {lt('auth.login')}
                      <ArrowRight size={16} />
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

                {/* Back to website */}
                <a
                  href={mainSiteUrl}
                  className="block text-center text-sm text-muted mt-4 hover:text-primary transition-colors"
                >
                  ← {lt('auth.backToWebsite')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Authenticated Layout ───────────────────────── */
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));
  const navItems = filteredNav.map(i => ({ ...i, href: p(i.sub) }));

  return (
    <AdminProvider role={role}>
      <AdminLayoutInner
        navItems={navItems}
        role={role}
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mainSiteUrl={mainSiteUrl}
        onLogout={handleLogout}
      >
        {children}
      </AdminLayoutInner>
    </AdminProvider>
  );
}

/* ── Inner layout (has access to AdminProvider context) ── */
function AdminLayoutInner({
  navItems,
  role,
  pathname,
  sidebarOpen,
  setSidebarOpen,
  mainSiteUrl,
  onLogout,
  children,
}: {
  navItems: { sub: string; key: string; icon: typeof LayoutDashboard; href: string; roles: AdminRole[] }[];
  role: AdminRole;
  pathname: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  mainSiteUrl: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  /* Use the admin context for translations */
  const { t, locale, setLocale } = useAdminCtx();

  return (
    <div className="min-h-screen bg-surface-alt flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0284C7] text-white flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5">
          <div className="flex items-center justify-center">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={200}
              height={56}
              className="w-44 h-auto drop-shadow-lg"
              unoptimized
            />
          </div>
          {/* Role badge */}
          <div className="mt-2 flex items-center justify-center">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              role === 'admin' ? 'bg-amber-400/20 text-amber-300' : 'bg-white/15 text-white/80'
            }`}>
              {role}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {t(item.key)}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 bg-primary-light rounded-full"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-3 space-y-1">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === 'nl' ? 'en' : 'nl')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors w-full cursor-pointer"
          >
            <Globe className="w-5 h-5" />
            {locale === 'nl' ? 'English' : 'Nederlands'}
          </button>

          <a
            href={mainSiteUrl}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            {t('nav.viewWebsite')}
          </a>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white px-3 py-2.5 flex items-center gap-2 lg:px-6 lg:py-3 lg:gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => n.href === pathname)
              ? t(navItems.find((n) => n.href === pathname)!.key)
              : 'Admin'}
          </h1>
        </header>

        {/* Page content with fade-in */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-3 lg:p-6 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

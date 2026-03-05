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
      <div className="min-h-screen bg-[#0C4A6E] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        </div>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1.5\' fill=\'white\'/%3E%3C/svg%3E")' }} />
        </div>

        {/* Language toggle (top-right) */}
        <button
          onClick={() => { const next = loginLocale === 'nl' ? 'en' : 'nl'; setLoginLocale(next); localStorage.setItem('admin_locale', next); }}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors cursor-pointer bg-white/10 px-3 py-1.5 rounded-full"
        >
          <Globe className="w-4 h-4" />
          {loginLocale === 'nl' ? 'EN' : 'NL'}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative"
        >
          {/* Glowing effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-[28px] blur-sm" />

          <form
            onSubmit={handleLogin}
            className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="text-center mb-4"
            >
              <div className="mx-auto relative">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={280}
                  height={80}
                  className="mx-auto w-56 sm:w-64 h-auto"
                  unoptimized
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="space-y-4"
            >
              {/* Role selector */}
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {(['admin', 'staff'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => { setUsername(u); setError(''); }}
                      className={`py-3 rounded-xl font-semibold text-base transition-all cursor-pointer ${
                        username === u
                          ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary'
                          : 'bg-surface text-muted hover:bg-gray-100'
                      }`}
                    >
                      {u === 'admin' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <User className="w-4 h-4" />
                          Staff
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  {lt('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-base bg-surface"
                    placeholder={lt('auth.enterPassword')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 px-3 py-2.5 rounded-lg border-red-100"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                />
                <span className="text-sm text-muted">{lt('auth.rememberMe')}</span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {lt('auth.login')}
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <a
                href={mainSiteUrl}
                className="block text-center text-sm text-muted mt-5 hover:text-primary transition-colors"
              >
                {lt('auth.backToWebsite')}
              </a>
            </motion.div>
          </form>
        </motion.div>
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
        <header className="bg-white px-4 py-3 flex items-center gap-3 lg:px-6 sticky top-0 z-30">
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
          className="flex-1 p-4 lg:p-6 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

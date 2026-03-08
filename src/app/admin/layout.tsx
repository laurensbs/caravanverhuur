'use client';

import { useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  ClipboardList,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  Tent,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import { AdminProvider, useAdmin as useAdminCtx } from '@/i18n/admin-context';
import { createT, type AdminLocale, type AdminRole } from '@/i18n/admin-translations';
import AdminHelpGuide from '@/components/AdminHelpGuide';

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
    ],
  },
  {
    sectionKey: 'nav.section.customers',
    items: [
      { sub: '/klanten', key: 'nav.customers', icon: Users, roles: ['admin'] },
      { sub: '/berichten', key: 'nav.messages', icon: Mail, roles: ['admin'] },
      { sub: '/chat', key: 'nav.chat', icon: MessageCircle, roles: ['admin', 'staff'] },
      { sub: '/nieuwsbrieven', key: 'nav.newsletters', icon: Newspaper, roles: ['admin'] },
    ],
  },
  {
    sectionKey: 'nav.section.website',
    items: [
      { sub: '/caravans', key: 'nav.caravans', icon: CarFront, roles: ['admin'] },
      { sub: '/campings', key: 'nav.campings', icon: Tent, roles: ['admin'] },
      { sub: '/kortingscodes', key: 'nav.discountCodes', icon: Tag, roles: ['admin'] },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AdminRole>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');
  const [loginLoading, setLoginLoading] = useState(false);
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

    /* Verify existing session with server */
    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.authenticated) {
          setAuthenticated(true);
          setRole(data.role);
        }
      })
      .catch(() => {});

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
        setAuthenticated(true);
        setError('');
      } else {
        setError(data.error || lt('auth.wrongCredentials'));
      }
    } catch {
      setError(lt('auth.wrongCredentials'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
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

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] cursor-pointer disabled:opacity-60"
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
    <AdminProvider role={role}>
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
    </AdminProvider>
  );
}

/* ── Inner layout (has access to AdminProvider context) ── */
const ONBOARDING_STEPS_NL = [
  { title: 'Welkom!', desc: 'Dit is het admin/staff portaal van Caravanverhuur Spanje. Hier beheer je alles rondom boekingen, caravans en klanten.', icon: '👋' },
  { title: 'Navigatie', desc: 'Gebruik het menu links (of het hamburger-icoon op mobiel) om tussen pagina\'s te navigeren.', icon: '📱' },
  { title: 'Dashboard', desc: 'Het dashboard toont een overzicht van boekingen, berichten en openstaande taken.', icon: '📊' },
  { title: 'Borg & Inspectie', desc: 'Bij Borg kun je checklists aanmaken en de mobiele inspectie starten. Klanten krijgen automatisch een link.', icon: '📋' },
  { title: 'Hulp nodig?', desc: 'Klik op het vraagteken-icoon rechtsboven voor hulp. Succes!', icon: '❓' },
];
const ONBOARDING_STEPS_EN = [
  { title: 'Welcome!', desc: 'This is the admin/staff portal for Caravanverhuur Spanje. Manage bookings, caravans and customers here.', icon: '👋' },
  { title: 'Navigation', desc: 'Use the sidebar (or hamburger icon on mobile) to navigate between pages.', icon: '📱' },
  { title: 'Dashboard', desc: 'The dashboard shows an overview of bookings, messages and open tasks.', icon: '📊' },
  { title: 'Deposit & Inspection', desc: 'Under Deposit you can create checklists and start a mobile inspection. Customers get a link automatically.', icon: '📋' },
  { title: 'Need help?', desc: 'Click the question mark icon in the top-right for help. Good luck!', icon: '❓' },
];


/* ── Sidebar Nav Item with dedicated drag handle ── */
function SidebarNavItem({
  item,
  isActive,
  onNavigate,
  t,
}: {
  item: { href: string; key: string; icon: typeof LayoutDashboard };
  isActive: boolean;
  onNavigate: () => void;
  t: (key: string) => string;
}) {
  const controls = useDragControls();
  const isDraggingRef = useRef(false);
  const Icon = item.icon;

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
      <Link
        href={item.href}
        onClick={(e) => {
          if (isDraggingRef.current) {
            e.preventDefault();
            return;
          }
          onNavigate();
        }}
        draggable={false}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        <GripVertical
          className="w-3.5 h-3.5 text-white/30 shrink-0 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: 'none' }}
        />
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1">{t(item.key)}</span>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="w-1.5 h-1.5 bg-primary-light rounded-full shrink-0"
          />
        )}
      </Link>
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
  const { t, locale, setLocale } = useAdminCtx();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [navOrders, setNavOrders] = useState<Record<string, string[]>>({});

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

  // Show onboarding on first login
  useEffect(() => {
    const key = `admin_onboarded_${role}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [role]);

  const finishOnboarding = () => {
    localStorage.setItem(`admin_onboarded_${role}`, 'true');
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const onboardingSteps = locale === 'nl' ? ONBOARDING_STEPS_NL : ONBOARDING_STEPS_EN;

  const restartTour = () => {
    setOnboardingStep(0);
    setShowOnboarding(true);
  };

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
        <div className="p-4 lg:p-5">
          <div className="flex items-center justify-center">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={200}
              height={56}
              className="w-36 lg:w-44 h-auto drop-shadow-lg"
              unoptimized
            />
          </div>
          <div className="mt-3 flex justify-center">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              role === 'admin' ? 'bg-amber-400/20 text-amber-200' : 'bg-white/15 text-white/70'
            }`}>
              {role === 'admin' ? '⚡ Admin' : '👤 Staff'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {navSections.map((section) => {
            const orderedItems = getOrderedItems(section.sectionKey, section.items);
            return (
              <div key={section.sectionKey}>
                <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {t(section.sectionKey)}
                </div>
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
                      onNavigate={() => setSidebarOpen(false)}
                      t={t}
                    />
                  ))}
                </Reorder.Group>
              </div>
            );
          })}
        </nav>

        <div className="p-3 space-y-1 border-t border-white/10">
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
            <ExternalLink className="w-5 h-5" />
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
        <header className="bg-white px-3 py-2.5 flex items-center gap-2 lg:px-6 lg:py-3 lg:gap-3 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-foreground flex-1">
            {allNavItems.find((n) => n.href === pathname)
              ? t(allNavItems.find((n) => n.href === pathname)!.key)
              : 'Admin'}
          </h1>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer text-muted hover:text-foreground"
            aria-label={locale === 'nl' ? 'Hulp' : 'Help'}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
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

      {/* ═══ ONBOARDING MODAL ═══ */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={finishOnboarding}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {onboardingSteps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === onboardingStep ? 'w-6 bg-sky-500' : i < onboardingStep ? 'w-1.5 bg-sky-300' : 'w-1.5 bg-gray-200'
                  }`} />
                ))}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={onboardingStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-4">{onboardingSteps[onboardingStep].icon}</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{onboardingSteps[onboardingStep].title}</h2>
                  <p className="text-gray-600 leading-relaxed">{onboardingSteps[onboardingStep].desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={finishOnboarding}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {locale === 'nl' ? 'Overslaan' : 'Skip'}
                </button>
                {onboardingStep < onboardingSteps.length - 1 ? (
                  <button
                    onClick={() => setOnboardingStep(s => s + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold transition-colors hover:bg-sky-600 cursor-pointer active:scale-[0.98]"
                  >
                    {locale === 'nl' ? 'Volgende' : 'Next'}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={finishOnboarding}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold transition-colors hover:bg-sky-600 cursor-pointer active:scale-[0.98]"
                  >
                    {locale === 'nl' ? 'Aan de slag!' : 'Get started!'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HELP GUIDE ═══ */}
      <AdminHelpGuide
        show={showHelp}
        onClose={() => setShowHelp(false)}
        locale={locale as 'nl' | 'en'}
        pathname={pathname}
        onRestartTour={restartTour}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, ReactNode } from 'react';
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
} from 'lucide-react';

const ADMIN_PASSWORD = 'CostaAdmin2026!';

const NAV_ITEMS = [
  { sub: '', label: 'Dashboard', icon: LayoutDashboard },
  { sub: '/boekingen', label: 'Boekingen', icon: CalendarCheck },
  { sub: '/betalingen', label: 'Betalingen', icon: CreditCard },
  { sub: '/berichten', label: 'Berichten', icon: Mail },
  { sub: '/caravans', label: 'Caravans', icon: CarFront },
  { sub: '/borg', label: 'Borgchecklist', icon: ClipboardCheck },
  { sub: '/klanten', label: 'Klanten', icon: Users },
  { sub: '/nieuwsbrieven', label: 'Nieuwsbrieven', icon: Newspaper },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');
  const pathname = usePathname();

  /* Subdomain-aware admin paths */
  const p = (sub: string) => pathname.startsWith('/admin') ? `/admin${sub}` : (sub || '/');
  const navItems = NAV_ITEMS.map(i => ({ ...i, href: p(i.sub) }));

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_auth') || localStorage.getItem('admin_auth');
    if (stored === 'true') setAuthenticated(true);
    if (window.location.hostname.startsWith('admin.')) {
      setMainSiteUrl(`https://${window.location.hostname.replace('admin.', '')}`);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      if (rememberMe) {
        localStorage.setItem('admin_auth', 'true');
      }
      setAuthenticated(true);
      setError('');
    } else {
      setError('Onjuist wachtwoord');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_auth');
    setAuthenticated(false);
    setPassword('');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1D4ED8] to-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl relative"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="text-center mb-8"
            >
              <div className="mx-auto mb-5 relative">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
                  alt="Caravanverhuur Costa Brava"
                  width={160}
                  height={48}
                  className="mx-auto w-36 h-auto"
                  unoptimized
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted mt-1">Log in om het dashboard te beheren</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base"
                  placeholder="Voer wachtwoord in..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 font-medium"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                />
                <span className="text-sm text-muted">Onthoud mij</span>
              </label>

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/25"
              >
                Inloggen
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <a
                href={mainSiteUrl}
                className="block text-center text-sm text-muted mt-5 hover:text-primary transition-colors"
              >
                ← Terug naar website
              </a>
            </motion.div>
          </form>
        </motion.div>
      </div>
    );
  }

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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1D4ED8] text-white flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Logo"
              width={120}
              height={36}
              className="w-24 h-auto"
              unoptimized
            />
            <div>
              <h2 className="text-base font-bold tracking-tight">Admin Panel</h2>
              <p className="text-[10px] text-white/50">Caravanverhuur Costa Brava</p>
            </div>
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
                  {item.label}
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
        <div className="p-3 border-t border-white/10">
          <a
            href={mainSiteUrl}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-1"
          >
            ← Website bekijken
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => n.href === pathname)?.label || 'Admin'}
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

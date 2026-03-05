'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
} from 'lucide-react';

const STAFF_PASSWORD = 'CostaStaff2026!';

const NAV_ITEMS = [
  { sub: '', label: 'Dashboard', icon: LayoutDashboard },
  { sub: '/boekingen', label: 'Boekingen', icon: CalendarCheck },
  { sub: '/borg', label: 'Borgchecklist', icon: ClipboardCheck },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');
  const pathname = usePathname();

  const p = (sub: string) => pathname.startsWith('/staff') ? `/staff${sub}` : (sub || '/');
  const navItems = NAV_ITEMS.map(i => ({ ...i, href: p(i.sub) }));

  useEffect(() => {
    const stored = sessionStorage.getItem('staff_auth') || localStorage.getItem('staff_auth');
    if (stored === 'true') setAuthenticated(true);
    if (window.location.hostname.startsWith('staff.')) {
      setMainSiteUrl(`https://${window.location.hostname.replace('staff.', '')}`);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === STAFF_PASSWORD) {
      sessionStorage.setItem('staff_auth', 'true');
      if (rememberMe) localStorage.setItem('staff_auth', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Onjuist wachtwoord');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('staff_auth');
    localStorage.removeItem('staff_auth');
    setAuthenticated(false);
    setPassword('');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0C4A6E] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1.5\' fill=\'white\'/%3E%3C/svg%3E")' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-[28px] blur-sm" />
          <form onSubmit={handleLogin} className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="text-center mb-8"
            >
              <div className="mx-auto mb-5">
                <Image
                  src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                  alt="Caravanverhuur Spanje"
                  width={280} height={80}
                  className="mx-auto w-56 sm:w-64 h-auto"
                  unoptimized
                />
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
                <Shield className="w-3.5 h-3.5" />
                Staff Portal
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Lock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Wachtwoord
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-base bg-surface"
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
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 px-3 py-2.5 rounded-lg border border-red-100"
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
                <span className="text-sm text-muted">Onthoud mij</span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Inloggen
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <a href={mainSiteUrl} className="block text-center text-sm text-muted mt-5 hover:text-primary transition-colors">
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-emerald-700 text-white flex flex-col transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5">
          <div className="flex items-center justify-center">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={200} height={56}
              className="w-44 h-auto drop-shadow-lg"
              unoptimized
            />
          </div>
          <div className="text-center mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-200 bg-emerald-600/50 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Staff Portal
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
                  {item.label}
                  {isActive && (
                    <motion.div layoutId="staffActiveIndicator" className="ml-auto w-1.5 h-1.5 bg-emerald-300 rounded-full" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-3">
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
        <header className="bg-white px-4 py-3 flex items-center gap-3 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => n.href === pathname)?.label || 'Staff'}
          </h1>
        </header>

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

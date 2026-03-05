'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { X, ArrowRight, ChevronDown, ChevronRight, User, Globe, Calendar, CreditCard, Shield, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { caravans } from '@/data/caravans';
import { destinations } from '@/data/destinations';
import WeatherBar from './WeatherBar';
import { useLanguage, localeFlags, type Locale } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const caravansByType = {
  LUXE: caravans.filter(c => c.type === 'LUXE'),
  FAMILIE: caravans.filter(c => c.type === 'FAMILIE'),
  COMPACT: caravans.filter(c => c.type === 'COMPACT'),
};

const typeLabel: Record<string, { name: string; color: string }> = {
  LUXE: { name: 'Luxe', color: 'text-primary-dark' },
  FAMILIE: { name: 'Familie', color: 'text-primary' },
  COMPACT: { name: 'Compact', color: 'text-primary-dark' },
};

const destinationsByRegion: Record<string, typeof destinations> = {};
destinations.forEach(d => {
  if (!destinationsByRegion[d.region]) destinationsByRegion[d.region] = [];
  destinationsByRegion[d.region].push(d);
});
const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'];

const featuredCaravan = caravansByType.LUXE[0] || caravans[0];
const featuredDest = destinations.find(d => d.slug === 'tossa-de-mar') || destinations[0];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState<'caravans' | 'bestemmingen' | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<'caravans' | 'bestemmingen' | null>(null);
  const [langDropdown, setLangDropdown] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; email: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountTimeout = useRef<NodeJS.Timeout | null>(null);
  const { t, locale, setLocale } = useLanguage();

  // Check login status
  useEffect(() => {
    fetch('/api/auth/me').then(res => {
      if (res.ok) return res.json();
      throw new Error('not logged in');
    }).then(data => {
      setLoggedInUser({ name: data.customer.name, email: data.customer.email });
    }).catch(() => setLoggedInUser(null));
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedInUser(null);
    setAccountDropdown(false);
    router.push('/');
  }, [router]);

  useEffect(() => { setMegaMenu(null); setMenuOpen(false); setMobileSubmenu(null); setLangDropdown(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangDropdown(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openAccount = () => { if (accountTimeout.current) clearTimeout(accountTimeout.current); setAccountDropdown(true); };
  const closeAccount = () => { accountTimeout.current = setTimeout(() => setAccountDropdown(false), 150); };

  const openMega = (m: 'caravans' | 'bestemmingen') => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaMenu(m);
  };
  const closeMega = () => { megaTimeout.current = setTimeout(() => setMegaMenu(null), 120); };
  const keepMega = () => { if (megaTimeout.current) clearTimeout(megaTimeout.current); };

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const navCls = (href: string) =>
    `px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${active(href) ? 'text-primary' : 'text-muted'}`;

  return (
    <>
    <div className="sticky top-0 z-50">
      <WeatherBar />

        <header className="bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={280} height={70}
              className="w-44 sm:w-56 lg:w-60 h-auto object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            <Link href="/" className={navCls('/')}>{t('nav.home')}</Link>

            <div className="relative" onMouseEnter={() => openMega('caravans')} onMouseLeave={closeMega}>
              <Link href="/caravans" className={`flex items-center gap-1 ${navCls('/caravans')}`}>
                {t('nav.caravans')}
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'caravans' ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            <div className="relative" onMouseEnter={() => openMega('bestemmingen')} onMouseLeave={closeMega}>
              <Link href="/bestemmingen" className={`flex items-center gap-1 ${navCls('/bestemmingen')}`}>
                {t('nav.destinations')}
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'bestemmingen' ? 'rotate-180' : ''}`} /> </Link> </div> <Link href="/over-ons" className={navCls('/over-ons')}>{t('nav.about')}</Link> <Link href="/faq" className={navCls('/faq')}>{t('nav.faq')}</Link> <Link href="/contact" className={navCls('/contact')}>{t('nav.contact')}</Link> {/* Language switcher */} <div className="relative" ref={langRef}> <button onClick={() => setLangDropdown(!langDropdown)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted transition-colors" aria-label="Language"> <Globe size={17} /> </button> <AnimatePresence> {langDropdown && ( <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg py-1 min-w-[140px] z-50"> {(['nl', 'en', 'es'] as Locale[]).map(l => ( <button key={l} onClick={() => { setLocale(l); setLangDropdown(false); }} className={`w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 transition-colors ${locale === l ?'text-primary font-semibold' : 'text-foreground-light'}`}>
                        <span className="text-base">{localeFlags[l]}</span>
                        {l === 'nl' ? 'Nederlands' : l === 'en' ? 'English' : 'Español'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account dropdown */}
            <div className="relative" ref={accountRef} onMouseEnter={openAccount} onMouseLeave={closeAccount}>
              {loggedInUser ? (
                <button
                  onClick={() => setAccountDropdown(!accountDropdown)}
                  className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs transition-colors"
                >
                  {loggedInUser.name.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Link href="/account" className="w-8 h-8 flex items-center justify-center rounded-full text-muted transition-colors" aria-label="Account">
                  <User size={17} />
                </Link>
              )}
              <AnimatePresence>
                {accountDropdown && loggedInUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl w-64 z-50 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                          {loggedInUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{loggedInUser.name}</p>
                          <p className="text-xs text-muted truncate">{loggedInUser.email}</p>
                        </div>
                      </div>
                    </div>
                    {/* Quick links */}
                    <div className="py-1.5">
                      {[
                        { href: '/mijn-account', icon: <User size={15} />, label: t('nav.myDashboard') },
                        { href: '/mijn-account?tab=boekingen', icon: <Calendar size={15} />, label: t('nav.myBookings') },
                        { href: '/mijn-account?tab=betalingen', icon: <CreditCard size={15} />, label: t('nav.myPayments') },
                        { href: '/mijn-account?tab=borg', icon: <Shield size={15} />, label: t('nav.myDeposit') },
                        { href: '/mijn-account?tab=profiel', icon: <Settings size={15} />, label: t('nav.accountSettings') },
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setAccountDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-light transition-colors"
                        >
                          <span className="text-muted">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    {/* Logout */}
                    <div className="py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger/70 transition-colors"
                      >
                        <LogOut size={15} />
                        {t('myAccount.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/boeken" className="ml-3 px-6 py-2.5 bg-primary text-white text-[15px] font-semibold rounded-full transition-all flex items-center gap-2 shadow-sm">
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden w-10 h-10 flex items-center justify-center" aria-label="Menu">
            <div className="relative w-5 h-3.5">
              <motion.span animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-0 left-0 w-full h-0.5 bg-foreground rounded-full origin-center" />
              <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }} className="absolute top-[5px] left-0 w-full h-0.5 bg-foreground rounded-full" />
              <motion.span animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-2.5 left-0 w-full h-0.5 bg-foreground rounded-full origin-center" />
            </div>
          </button>
        </div>

        {/* ============ MEGA MENUS ============ */}
        <AnimatePresence>
          {megaMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white shadow-xl z-40"
              onMouseEnter={keepMega}
              onMouseLeave={closeMega}
            >
              {/* ---- CARAVANS ---- */}
              {megaMenu === 'caravans' && (
                <div className="max-w-6xl mx-auto px-8 py-7">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground">{t('nav.ourCaravans')}</h3>
                    <Link href="/caravans" className="text-xs text-primary flex items-center gap-1 font-medium">
                      {t('nav.viewAll')} <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {(['LUXE', 'FAMILIE', 'COMPACT'] as const).map(type => (
                      <div key={type}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${typeLabel[type].color}`}>
                          {type === 'LUXE' ? t('nav.luxe') : type === 'FAMILIE' ? t('nav.familie') : t('nav.compact')}
                        </p>
                        <div className="space-y-0.5">
                          {caravansByType[type].map(c => (
                            <Link key={c.id} href={`/caravans/${c.id}`} className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors">
                              <div className="w-12 h-8 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                                <Image src={c.photos[0]} alt={c.name} fill className="object-cover transition-transform duration-300" unoptimized />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground-light truncate transition-colors">{c.name}</p>
                                <p className="text-xs text-muted">{c.maxPersons} pers · €{c.pricePerWeek}/wk</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Featured */}
                    <div className="relative rounded-xl overflow-hidden">
                      <Image src={featuredCaravan.photos[0]} alt={featuredCaravan.name} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{t('nav.featured')}</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredCaravan.name}</p>
                        <Link href={`/caravans/${featuredCaravan.id}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
                          {t('nav.view')} <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- BESTEMMINGEN ---- */}
              {megaMenu === 'bestemmingen' && (
                <div className="max-w-6xl mx-auto px-8 py-7">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground">{t('nav.destinations')}</h3>
                    <Link href="/bestemmingen" className="text-xs text-primary flex items-center gap-1 font-medium">
                      {t('nav.viewAll')} <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {regionOrder.map(region => (
                      <div key={region}>
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">{region}</p>
                        <div className="space-y-0.5">
                          {(destinationsByRegion[region] || []).map(d => (
                            <Link key={d.id} href={`/bestemmingen/${d.slug}`} className="group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg transition-colors">
                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                                <Image src={d.heroImage} alt={d.name} fill className="object-cover transition-transform duration-300" unoptimized />
                              </div>
                              <p className="text-sm text-foreground-light transition-colors">{d.name}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Featured */}
                    <div className="relative rounded-xl overflow-hidden">
                      <Image src={featuredDest.heroImage} alt={featuredDest.name} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{featuredDest.region}</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredDest.name}</p>
                        <Link href={`/bestemmingen/${featuredDest.slug}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
                          {t('home.explore')} <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </header>
    </div>

    {/* ============ MOBILE PANEL (outside sticky container for iOS fix) ============ */}
    <AnimatePresence>
      {menuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] lg:hidden"
            onClick={() => setMenuOpen(false)}
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-[101] lg:hidden shadow-2xl flex flex-col"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png" alt="Caravanverhuur Costa Brava" width={200} height={56} className="w-36 h-auto" unoptimized />
              </Link>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center">
                <X size={16} className="text-muted" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
              <MobLink href="/" label={t('nav.home')} on={active('/') && pathname === '/'} close={() => setMenuOpen(false)} />

              {/* Caravans — expandable */}
              <button
                onClick={() => setMobileSubmenu(mobileSubmenu === 'caravans' ? null : 'caravans')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${active('/caravans') ? 'text-primary' : 'text-foreground-light'}`}
              >
                {t('nav.caravans')}
                <ChevronDown size={16} className={`text-muted transition-transform ${mobileSubmenu === 'caravans' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {mobileSubmenu === 'caravans' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="pl-4 pr-1 pb-2">
                      <Link href="/caravans" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-primary mb-1">
                        {t('home.allCaravans')} →
                      </Link>
                      {caravans.map(c => (
                        <Link key={c.id} href={`/caravans/${c.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground-light">
                          <div className="w-10 h-7 rounded overflow-hidden relative shrink-0 bg-surface-alt">
                            <Image src={c.photos[0]} alt={c.name} fill className="object-cover" unoptimized />
                          </div>
                          <span className="truncate">{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bestemmingen — expandable */}
              <button
                onClick={() => setMobileSubmenu(mobileSubmenu === 'bestemmingen' ? null : 'bestemmingen')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${active('/bestemmingen') ? 'text-primary' : 'text-foreground-light'}`}
              >
                {t('nav.destinations')}
                <ChevronDown size={16} className={`text-muted transition-transform ${mobileSubmenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {mobileSubmenu === 'bestemmingen' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="pl-4 pr-1 pb-2">
                      <Link href="/bestemmingen" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-primary mb-1">
                        {t('home.allDestinations')} →
                      </Link>
                      {destinations.map(d => (
                        <Link key={d.id} href={`/bestemmingen/${d.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground-light">
                          <div className="w-8 h-8 rounded overflow-hidden relative shrink-0 bg-surface-alt">
                            <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized />
                          </div>
                          <span>{d.name}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <MobLink href="/boeken" label={t('nav.bookNow')} on={active('/boeken')} close={() => setMenuOpen(false)} />
              <MobLink href="/over-ons" label={t('nav.about')} on={active('/over-ons')} close={() => setMenuOpen(false)} />
              <MobLink href="/faq" label={t('nav.faq')} on={active('/faq')} close={() => setMenuOpen(false)} />
              <MobLink href="/contact" label={t('nav.contact')} on={active('/contact')} close={() => setMenuOpen(false)} />
            </nav>

            {/* Bottom CTA */}
            <div className="p-4 space-y-2">
              {/* Mobile language switcher */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {(['nl', 'en', 'es'] as Locale[]).map(l => (
                  <button key={l} onClick={() => setLocale(l)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${locale === l ? 'bg-primary text-white' : 'bg-surface-alt text-foreground-light'}`}>
                    {localeFlags[l]}
                  </button>
                ))}
              </div>
              <Link href="/boeken" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-bold rounded-xl text-sm transition-transform">
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 text-foreground-light font-medium rounded-xl text-sm transition-colors">
                <User size={15} /> {t('footer.myAccount')}
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

/* Mobile nav link helper */
function MobLink({ href, label, on, close }: { href: string; label: string; on: boolean; close: () => void }) {
  return (
    <Link href={href} onClick={close} className={`flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${on ? 'text-primary' : 'text-foreground-light'}`}>
      {label}
      <ChevronRight size={16} className="text-muted" />
    </Link>
  );
}

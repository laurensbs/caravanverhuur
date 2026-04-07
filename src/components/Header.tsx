'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { X, ArrowRight, ChevronDown, ChevronRight, User, Calendar, CreditCard, Shield, Settings, LogOut, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { caravans as staticCaravansData } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { campings as staticCampingsData, type Camping } from '@/data/campings';
import { destinations } from '@/data/destinations';

import { useLanguage, localeFlags, type Locale } from '@/i18n/context';
import { useData } from '@/lib/data-context';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const campingsByRegion: Record<string, Camping[]> = {};
staticCampingsData.forEach(c => {
  if (!campingsByRegion[c.region]) campingsByRegion[c.region] = [];
  campingsByRegion[c.region].push(c);
});
const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'];

/* Curated attractions for the mega menu */
const attractions = [
  { name: 'Dalí Theatre-Museum', place: 'Figueres', slug: 'figueres', img: '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg' },
  { name: 'Vila Vella', place: 'Tossa de Mar', slug: 'tossa-de-mar', img: '/images/destinations/tossa_de_mar_torre_n_jmm.jpg' },
  { name: 'Illes Medes', place: "L'Estartit", slug: 'estartit', img: '/images/campings/spain__catalonia__illes_medes__medes_islands_.jpg' },
  { name: 'Jardí Botànic Marimurtra', place: 'Blanes', slug: 'blanes', img: '/images/campings/marimurtra_botanic_garden_blanes_costa_brava_catalonia_spain.jpg' },
  { name: 'Cap de Creus', place: 'Cadaqués', slug: 'cadaques', img: '/images/campings/cap_de_creus_landscape.jpg' },
  { name: 'Kasteel van Begur', place: 'Begur', slug: 'begur', img: '/images/campings/begurcastle.jpg' },
  { name: 'Jardí de Cap Roig', place: 'Calella', slug: 'calella-de-palafrugell', img: '/images/destinations/jardines_de_cap_roig-calella_de_palafurgell-8-2013__11_.jpg' },
  { name: 'Kanalen', place: 'Empuriabrava', slug: 'empuriabrava', img: '/images/campings/canal_principal_de_empuriabrava.jpg' },
  { name: 'Santa Clotilde tuinen', place: 'Lloret de Mar', slug: 'lloret-de-mar', img: '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg' },
  { name: 'Ruïnes Empúries', place: "L'Escala", slug: 'sant-pere-pescador', img: '/images/campings/msodaiguistperefigueres1.jpg' },
];

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
  const { campings: allCampings } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountTimeout = useRef<NodeJS.Timeout | null>(null);
  const { t, locale, setLocale } = useLanguage();

  const featuredCamping = allCampings.find(c => c.slug === 'cypsela-resort') || allCampings[0];

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

  // Close menus/dropdowns on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (megaMenu) setMegaMenu(null);
        if (langDropdown) setLangDropdown(false);
        if (accountDropdown) setAccountDropdown(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [menuOpen, megaMenu, langDropdown, accountDropdown]);

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
    `px-3 py-2 text-[15px] font-semibold tracking-tight font-heading transition-colors relative ${active(href) ? 'text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full' : 'text-foreground-light hover:text-foreground'}`;

  return (
    <>
    <div className="sticky top-0 z-50">
      {/* ===== TOP UTILITY BAR ===== */}
      <div className="bg-foreground text-white text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <p className="font-semibold uppercase tracking-wide">
            <span className="hidden sm:inline">{t('nav.season')}</span>
            <span className="sm:hidden">{t('nav.seasonShort')}</span>
          </p>
          <div className="flex items-center">
            {/* Language */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdown(!langDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Language"
              >
                <span className="text-sm leading-none">{localeFlags[locale]}</span>
                <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {langDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1.5 min-w-[160px] z-50"
                  >
                    {(['nl', 'en', 'es'] as Locale[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLocale(l); setLangDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-gray-50 ${locale === l ? 'text-primary font-semibold bg-primary/5' : 'text-foreground-light'}`}
                      >
                        <span className="text-lg leading-none">{localeFlags[l]}</span>
                        <span>{l === 'nl' ? 'Nederlands' : l === 'en' ? 'English' : 'Español'}</span>
                        {locale === l && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-3.5 bg-white/20 mx-1 hidden sm:block" />

            {/* Account */}
            <div className="relative" ref={accountRef} onMouseEnter={openAccount} onMouseLeave={closeAccount}>
              {loggedInUser ? (
                <button
                  onClick={() => setAccountDropdown(!accountDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold leading-none">
                    {loggedInUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{locale === 'nl' ? 'Mijn Account' : locale === 'es' ? 'Mi Cuenta' : 'My Account'}</span>
                  <ChevronDown size={10} className="hidden sm:block" />
                </button>
              ) : (
                <Link href="/account" className="flex items-center gap-1.5 px-2 py-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                  <User size={14} />
                  <span className="hidden sm:inline">{locale === 'nl' ? 'Inloggen' : locale === 'es' ? 'Iniciar sesión' : 'Sign in'}</span>
                </Link>
              )}
              <AnimatePresence>
                {accountDropdown && loggedInUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl w-64 z-50 overflow-hidden"
                  >
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
                    <div className="py-1.5">
                      {[
                        { href: '/mijn-account', icon: <User size={15} />, label: t('nav.myDashboard') },
                        { href: '/mijn-account?tab=boekingen', icon: <Calendar size={15} />, label: t('nav.myBookings') },
                        { href: '/mijn-account?tab=betalingen', icon: <CreditCard size={15} />, label: t('nav.myPayments') },
                        { href: '/mijn-account?tab=borg', icon: <Shield size={15} />, label: t('nav.myDeposit') },
                        { href: '/mijn-account?tab=profiel', icon: <Settings size={15} />, label: t('nav.accountSettings') },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setAccountDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-light hover:bg-gray-50 transition-colors">
                          <span className="text-muted">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 py-1.5">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger/70 hover:bg-gray-50 transition-colors">
                        <LogOut size={15} />
                        {t('myAccount.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-3.5 bg-white/20 mx-1 hidden sm:block" />

            {/* Chat */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-chatbot'))}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Chat"
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">Live Chat</span>
            </button>
          </div>
        </div>
      </div>

      <header className="relative bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={320} height={80}
              className="w-36 sm:w-48 lg:w-56 h-auto object-contain"
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 208px, 260px"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link href="/" className={navCls('/')}>{t('nav.home')}</Link>

            <div className="relative h-full flex items-center" onMouseEnter={() => openMega('bestemmingen')} onMouseLeave={closeMega}>
              <Link href="/bestemmingen" className={`flex items-center gap-1 ${navCls('/bestemmingen')}`}>
                {t('nav.destinations')}
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
              </Link>
            </div>
            <Link href="/over-ons" className={navCls('/over-ons')}>{t('nav.about')}</Link>
            <Link href="/faq" className={navCls('/faq')}>{t('nav.faq')}</Link>
            <Link href="/contact" className={navCls('/contact')}>{t('nav.contact')}</Link>

            <Link href="/boeken" className="ml-3 px-6 py-2.5 bg-primary text-white text-sm font-bold tracking-tight rounded-lg transition-all flex items-center gap-1.5 hover:bg-primary-dark">
              {t('nav.bookNow')} <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile actions */}
          <div className="lg:hidden flex items-center gap-1.5">
            <Link href="/boeken" className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1">
              {t('nav.bookNow')} <ArrowRight size={11} />
            </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform" aria-label="Menu">
            <div className="relative w-[18px] h-3">
              <motion.span animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 300 }} className="absolute top-0 left-0 w-full h-[1.5px] bg-foreground rounded-full origin-center" />
              <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.15 }} className="absolute top-[5px] left-0 w-full h-[1.5px] bg-foreground rounded-full" />
              <motion.span animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 300 }} className="absolute top-2.5 left-0 w-full h-[1.5px] bg-foreground rounded-full origin-center" />
            </div>
          </button>
          </div>
        </div>

        {/* ============ MEGA MENUS ============ */}
        <AnimatePresence>
          {megaMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white/[0.98] backdrop-blur-md shadow-xl border-t border-gray-100 z-40"
              onMouseEnter={keepMega}
              onMouseLeave={closeMega}
            >
              {/* ---- BESTEMMINGEN ---- */}
              {megaMenu === 'bestemmingen' && (
                <div className="max-w-6xl mx-auto px-8 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">{t('nav.destinations')}</h3>
                    <Link href="/bestemmingen" className="text-xs text-primary flex items-center gap-1 font-medium">
                      {t('nav.viewAll')} <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {/* Column 1: Campings */}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                        Campings
                      </p>
                      <div className="space-y-0.5">
                        {allCampings.slice(0, 6).map(c => (
                          <Link key={c.id} href={`/bestemmingen/${c.slug}`} className="group flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg hover:bg-surface-alt transition-colors">
                            <div className="w-7 h-7 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                              <Image src={c.photos?.[0] || '/og-image.jpg'} alt={c.name} fill className="object-cover" sizes="28px" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground-light truncate">{c.name}</p>
                              <p className="text-[11px] text-muted">{c.location}</p>
                            </div>
                          </Link>
                        ))}
                        <Link href="/bestemmingen#campings" className="block px-2 py-1.5 text-xs text-primary font-medium">
                          {t('destinations.allCampings')} ({allCampings.length}) →
                        </Link>
                      </div>
                    </div>

                    {/* Column 2: Plaatsen */}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                        {t('destinations.placesLabel')}
                      </p>
                      <div className="space-y-0.5">
                        {destinations.slice(0, 6).map(d => (
                          <Link key={d.slug} href={`/bestemmingen/${d.slug}`} className="group flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg hover:bg-surface-alt transition-colors">
                            <div className="w-7 h-7 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                              <Image src={d.heroImage} alt={d.name} fill className="object-cover" sizes="28px" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground-light truncate">{d.name}</p>
                              <p className="text-[11px] text-muted">{d.region}</p>
                            </div>
                          </Link>
                        ))}
                        <Link href="/bestemmingen#plaatsen" className="block px-2 py-1.5 text-xs text-primary font-medium">
                          Alle plaatsen ({destinations.length}) →
                        </Link>
                      </div>
                    </div>

                    {/* Column 3: Bezienswaardigheden */}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                        Bezienswaardigheden
                      </p>
                      <div className="space-y-0.5">
                        {attractions.slice(0, 6).map(a => (
                          <Link key={a.slug} href={`/bestemmingen/${a.slug}`} className="group flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg hover:bg-surface-alt transition-colors">
                            <div className="w-7 h-7 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                              <Image src={a.img} alt={a.name} fill className="object-cover" sizes="28px" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground-light truncate">{a.name}</p>
                              <p className="text-[11px] text-muted">{a.place}</p>
                            </div>
                          </Link>
                        ))}
                        <Link href="/bestemmingen#bezienswaardigheden" className="block px-2 py-1.5 text-xs text-primary font-medium">
                          Alle bezienswaardigheden →
                        </Link>
                      </div>
                    </div>

                    {/* Column 4: Featured image */}
                    <div className="relative rounded-xl overflow-hidden">
                      <Image src={featuredCamping.photos?.[0] || '/og-image.jpg'} alt={featuredCamping.name} fill className="object-cover" sizes="250px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{featuredCamping.region}</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredCamping.name}</p>
                        <Link href={`/bestemmingen/${featuredCamping.slug}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden"
            onClick={() => setMenuOpen(false)}
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[85vw] sm:max-w-[380px] bg-white z-[101] lg:hidden shadow-2xl flex flex-col"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png" alt="Caravanverhuur Costa Brava" width={200} height={56} className="w-28 h-auto" />
              </Link>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              <div className="space-y-0.5">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                  <MobLink href="/" label={t('nav.home')} on={active('/') && pathname === '/'} close={() => setMenuOpen(false)} />
                </motion.div>

                {/* Bestemmingen — link + expandable chevron */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.11 }}>
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-semibold transition-all ${active('/bestemmingen') ? 'text-primary bg-primary/5' : 'text-gray-800 active:bg-gray-50'}`}>
                    <Link href="/bestemmingen" onClick={() => setMenuOpen(false)} className="flex-1">
                      {t('nav.destinations')}
                    </Link>
                    <button onClick={() => setMobileSubmenu(mobileSubmenu === 'bestemmingen' ? null : 'bestemmingen')} className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
                      <motion.div animate={{ rotate: mobileSubmenu === 'bestemmingen' ? 180 : 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
                        <ChevronDown size={15} className="text-gray-400" />
                      </motion.div>
                    </button>
                  </div>
                </motion.div>
                <AnimatePresence>
                  {mobileSubmenu === 'bestemmingen' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <div className="pl-3 pr-2 pb-2 pt-1">
                        <Link href="/bestemmingen" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary bg-primary/5 rounded-lg mb-2 active:bg-primary/10 transition-colors">
                          {t('destinations.allDestinations')} <ArrowRight size={12} />
                        </Link>

                        {/* Campings */}
                        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-[0.15em]">Campings</p>
                        <div className="space-y-0.5 mb-2">
                          {allCampings.slice(0, 5).map((c, i) => (
                            <motion.div key={c.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                              <Link href={`/bestemmingen/${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                <div className="w-7 h-7 rounded-md overflow-hidden relative shrink-0 bg-gray-100">
                                  <Image src={c.photos?.[0] || '/og-image.jpg'} alt={c.name} fill className="object-cover" sizes="28px" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block truncate text-[13px] font-medium">{c.name}</span>
                                  <span className="block text-[10px] text-gray-400">{c.location}</span>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                          <Link href="/bestemmingen#campings" onClick={() => setMenuOpen(false)} className="block px-3 py-1 text-xs text-primary font-semibold hover:underline">
                            Alle campings ({allCampings.length}) →
                          </Link>
                        </div>

                        {/* Plaatsen */}
                        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-[0.15em]">Plaatsen</p>
                        <div className="space-y-0.5 mb-2">
                          {destinations.slice(0, 5).map((d, i) => (
                            <motion.div key={d.slug} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                              <Link href={`/bestemmingen/${d.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                <div className="w-7 h-7 rounded-md overflow-hidden relative shrink-0 bg-gray-100">
                                  <Image src={d.heroImage} alt={d.name} fill className="object-cover" sizes="28px" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block truncate text-[13px] font-medium">{d.name}</span>
                                  <span className="block text-[10px] text-gray-400">{d.region}</span>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>

                        {/* Bezienswaardigheden */}
                        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-[0.15em]">Bezienswaardigheden</p>
                        <div className="space-y-0.5">
                          {attractions.slice(0, 5).map((a, i) => (
                            <motion.div key={a.slug} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                              <Link href={`/bestemmingen/${a.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                <div className="w-7 h-7 rounded-md overflow-hidden relative shrink-0 bg-gray-100">
                                  <Image src={a.img} alt={a.name} fill className="object-cover" sizes="28px" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block truncate text-[13px] font-medium">{a.name}</span>
                                  <span className="block text-[10px] text-gray-400">{a.place}</span>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100/80">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}>
                  <MobLink href="/over-ons" label={t('nav.about')} on={active('/over-ons')} close={() => setMenuOpen(false)} />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.17 }}>
                  <MobLink href="/faq" label={t('nav.faq')} on={active('/faq')} close={() => setMenuOpen(false)} />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.20 }}>
                  <MobLink href="/contact" label={t('nav.contact')} on={active('/contact')} close={() => setMenuOpen(false)} />
                </motion.div>
              </div>
            </nav>

            {/* Bottom CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="px-4 pt-4 pb-6 border-t border-gray-100/80 bg-gray-50/60">
              <Link href="/boeken" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-bold rounded-xl text-[15px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform">
                {t('nav.bookNow')} <ArrowRight size={15} />
              </Link>
            </motion.div>
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
    <Link href={href} onClick={close} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-semibold transition-all ${on ? 'text-primary bg-primary/5' : 'text-gray-800 active:bg-gray-50'}`}>
      {label}
      <ChevronRight size={13} className={`transition-colors ${on ? 'text-primary' : 'text-gray-300'}`} />
    </Link>
  );
}

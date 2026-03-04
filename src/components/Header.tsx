'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ArrowRight, ChevronDown, ChevronRight, User, Globe } from 'lucide-react';
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
  LUXE: { name: 'Luxe', color: 'text-accent-dark' },
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
  const pathname = usePathname();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useLanguage();

  useEffect(() => { setMegaMenu(null); setMenuOpen(false); setMobileSubmenu(null); setLangDropdown(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openMega = (m: 'caravans' | 'bestemmingen') => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaMenu(m);
  };
  const closeMega = () => { megaTimeout.current = setTimeout(() => setMegaMenu(null), 120); };
  const keepMega = () => { if (megaTimeout.current) clearTimeout(megaTimeout.current); };

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const navCls = (href: string) =>
    `px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${active(href) ? 'text-primary' : 'text-muted hover:text-foreground'}`;

  return (
    <div className="sticky top-0 z-50">
      <WeatherBar />

        <header className="bg-white/95 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Caravans Costa Brava"
              width={240} height={60}
              className="w-40 sm:w-48 h-auto max-h-14 object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            <Link href="/" className={navCls('/')}>{t('nav.home')}</Link>

            <div className="relative" onMouseEnter={() => openMega('caravans')} onMouseLeave={closeMega}>
              <button className={`flex items-center gap-1 ${navCls('/caravans')}`}>
                {t('nav.caravans')}
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'caravans' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="relative" onMouseEnter={() => openMega('bestemmingen')} onMouseLeave={closeMega}>
              <button className={`flex items-center gap-1 ${navCls('/bestemmingen')}`}>
                {t('nav.destinations')}
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Link href="/over-ons" className={navCls('/over-ons')}>{t('nav.about')}</Link>
            <Link href="/faq" className={navCls('/faq')}>{t('nav.faq')}</Link>
            <Link href="/contact" className={navCls('/contact')}>{t('nav.contact')}</Link>

            <div className="w-px h-5 bg-border mx-3" />

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangDropdown(!langDropdown)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-alt transition-colors" aria-label="Language">
                <Globe size={17} />
              </button>
              <AnimatePresence>
                {langDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[140px] z-50">
                    {(['nl', 'en', 'es'] as Locale[]).map(l => (
                      <button key={l} onClick={() => { setLocale(l); setLangDropdown(false); }} className={`w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-surface transition-colors ${locale === l ? 'text-primary font-semibold' : 'text-foreground-light'}`}>
                        <span className="text-base">{localeFlags[l]}</span>
                        {l === 'nl' ? 'Nederlands' : l === 'en' ? 'English' : 'Español'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/account" className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-alt transition-colors" aria-label="Account">
              <User size={17} />
            </Link>

            <Link href="/boeken" className="ml-3 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-[15px] font-semibold rounded-full transition-all flex items-center gap-2 shadow-sm hover:shadow">
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center" aria-label="Menu">
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
              className="hidden lg:block absolute left-0 right-0 top-full bg-white border-t border-border/80 shadow-xl z-40"
              onMouseEnter={keepMega}
              onMouseLeave={closeMega}
            >
              {/* ---- CARAVANS ---- */}
              {megaMenu === 'caravans' && (
                <div className="max-w-6xl mx-auto px-8 py-7">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground">{t('nav.ourCaravans')}</h3>
                    <Link href="/caravans" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                      {t('nav.viewAll')} <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {(['LUXE', 'FAMILIE', 'COMPACT'] as const).map(type => (
                      <div key={type}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${typeLabel[type].color}`}>
                          {type === 'LUXE' ? t('nav.luxe') : type === 'FAMILIE' ? t('nav.familie') : t('nav.compact')}
                        </p>
                        <div className="space-y-0.5">
                          {caravansByType[type].map(c => (
                            <Link key={c.id} href={`/caravans/${c.id}`} className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-surface transition-colors">
                              <div className="w-12 h-8 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                                <Image src={c.photos[0]} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground-light truncate group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[11px] text-muted">{c.maxPersons} pers · €{c.pricePerWeek}/wk</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Featured */}
                    <div className="relative rounded-xl overflow-hidden">
                      <Image src={featuredCaravan.photos[0]} alt={featuredCaravan.name} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">{t('nav.featured')}</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredCaravan.name}</p>
                        <Link href={`/caravans/${featuredCaravan.id}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white transition-colors">
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
                    <Link href="/bestemmingen" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                      {t('nav.viewAll')} <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {regionOrder.map(region => (
                      <div key={region}>
                        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">{region}</p>
                        <div className="space-y-0.5">
                          {(destinationsByRegion[region] || []).map(d => (
                            <Link key={d.id} href={`/bestemmingen/${d.slug}`} className="group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg hover:bg-surface transition-colors">
                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 relative bg-surface-alt">
                                <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                              </div>
                              <p className="text-sm text-foreground-light group-hover:text-primary transition-colors">{d.name}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Featured */}
                    <div className="relative rounded-xl overflow-hidden">
                      <Image src={featuredDest.heroImage} alt={featuredDest.name} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">{featuredDest.region}</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredDest.name}</p>
                        <Link href={`/bestemmingen/${featuredDest.slug}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white transition-colors">
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

        {/* ============ MOBILE PANEL ============ */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setMenuOpen(false)}
              />

              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed top-0 right-0 bottom-0 w-[80vw] max-w-xs bg-white z-50 lg:hidden shadow-2xl flex flex-col"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                  <Link href="/" onClick={() => setMenuOpen(false)}>
                    <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png" alt="Logo" width={100} height={28} className="w-24 h-auto" unoptimized />
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
                            <Link key={c.id} href={`/caravans/${c.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface text-sm text-foreground-light">
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
                            <Link key={d.id} href={`/bestemmingen/${d.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface text-sm text-foreground-light">
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
                <div className="p-4 border-t border-border space-y-2">
                  {/* Mobile language switcher */}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {(['nl', 'en', 'es'] as Locale[]).map(l => (
                      <button key={l} onClick={() => setLocale(l)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${locale === l ? 'bg-primary text-white' : 'bg-surface-alt text-foreground-light hover:bg-surface'}`}>
                        {localeFlags[l]}
                      </button>
                    ))}
                  </div>
                  <Link href="/boeken" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform">
                    {t('nav.bookNow')} <ArrowRight size={16} />
                  </Link>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 border border-border text-foreground-light font-medium rounded-xl text-sm hover:bg-surface transition-colors">
                    <User size={15} /> {t('footer.myAccount')}
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </div>
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

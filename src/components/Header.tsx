'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, ArrowRight, ChevronDown, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { caravans } from '@/data/caravans';
import { destinations } from '@/data/destinations';
import WeatherBar from './WeatherBar';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const caravansByType = {
  LUXE: caravans.filter(c => c.type === 'LUXE'),
  FAMILIE: caravans.filter(c => c.type === 'FAMILIE'),
  COMPACT: caravans.filter(c => c.type === 'COMPACT'),
};

const typeLabel: Record<string, { name: string; color: string }> = {
  LUXE: { name: 'Luxe', color: 'text-amber-600' },
  FAMILIE: { name: 'Familie', color: 'text-sky-600' },
  COMPACT: { name: 'Compact', color: 'text-emerald-600' },
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
  const pathname = usePathname();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMegaMenu(null); setMenuOpen(false); setMobileSubmenu(null); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const openMega = (m: 'caravans' | 'bestemmingen') => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaMenu(m);
  };
  const closeMega = () => { megaTimeout.current = setTimeout(() => setMegaMenu(null), 120); };
  const keepMega = () => { if (megaTimeout.current) clearTimeout(megaTimeout.current); };

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const navCls = (href: string) =>
    `px-3 py-2 text-[13px] font-medium rounded-lg transition-colors ${active(href) ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`;

  return (
    <div className="sticky top-0 z-50">
      <WeatherBar />

      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Caravans Costa Brava"
              width={200} height={50}
              className="w-32 sm:w-40 h-auto max-h-11 object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            <Link href="/" className={navCls('/')}>Home</Link>

            <div className="relative" onMouseEnter={() => openMega('caravans')} onMouseLeave={closeMega}>
              <button className={`flex items-center gap-1 ${navCls('/caravans')}`}>
                Caravans
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'caravans' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="relative" onMouseEnter={() => openMega('bestemmingen')} onMouseLeave={closeMega}>
              <button className={`flex items-center gap-1 ${navCls('/bestemmingen')}`}>
                Bestemmingen
                <ChevronDown size={13} className={`transition-transform duration-200 ${megaMenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Link href="/over-ons" className={navCls('/over-ons')}>Over Ons</Link>
            <Link href="/faq" className={navCls('/faq')}>FAQ</Link>
            <Link href="/contact" className={navCls('/contact')}>Contact</Link>

            <div className="w-px h-5 bg-gray-200 mx-3" />

            <Link href="/account" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Account">
              <User size={17} />
            </Link>

            <Link href="/boeken" className="ml-3 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 shadow-sm hover:shadow">
              Boek Nu <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center" aria-label="Menu">
            <div className="relative w-5 h-3.5">
              <motion.span animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-0 left-0 w-full h-0.5 bg-gray-700 rounded-full origin-center" />
              <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }} className="absolute top-[5px] left-0 w-full h-0.5 bg-gray-700 rounded-full" />
              <motion.span animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-2.5 left-0 w-full h-0.5 bg-gray-700 rounded-full origin-center" />
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
              className="hidden lg:block absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-xl z-40"
              onMouseEnter={keepMega}
              onMouseLeave={closeMega}
            >
              {/* ---- CARAVANS ---- */}
              {megaMenu === 'caravans' && (
                <div className="max-w-6xl mx-auto px-8 py-7">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-gray-900">Onze Caravans</h3>
                    <Link href="/caravans" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                      Bekijk alles <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {(['LUXE', 'FAMILIE', 'COMPACT'] as const).map(type => (
                      <div key={type}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${typeLabel[type].color}`}>
                          {typeLabel[type].name}
                        </p>
                        <div className="space-y-0.5">
                          {caravansByType[type].map(c => (
                            <Link key={c.id} href={`/caravans/${c.id}`} className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="w-12 h-8 rounded overflow-hidden shrink-0 relative bg-gray-100">
                                <Image src={c.photos[0]} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-700 truncate group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[11px] text-gray-400">{c.maxPersons} pers · €{c.pricePerWeek}/wk</p>
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
                        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Uitgelicht</p>
                        <p className="text-white font-bold text-sm mb-3">{featuredCaravan.name}</p>
                        <Link href={`/caravans/${featuredCaravan.id}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white transition-colors">
                          Bekijken <ArrowRight size={11} />
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
                    <h3 className="text-sm font-bold text-gray-900">Bestemmingen</h3>
                    <Link href="/bestemmingen" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                      Bekijk alles <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {regionOrder.map(region => (
                      <div key={region}>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{region}</p>
                        <div className="space-y-0.5">
                          {(destinationsByRegion[region] || []).map(d => (
                            <Link key={d.id} href={`/bestemmingen/${d.slug}`} className="group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 relative bg-gray-100">
                                <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                              </div>
                              <p className="text-sm text-gray-700 group-hover:text-primary transition-colors">{d.name}</p>
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
                        <Link href={`/bestemmingen/${featuredDest.slug}`} className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white transition-colors">
                          Ontdekken <ArrowRight size={11} />
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
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <Link href="/" onClick={() => setMenuOpen(false)}>
                    <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png" alt="Logo" width={100} height={28} className="w-24 h-auto" unoptimized />
                  </Link>
                  <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-2 px-2">
                  <MobLink href="/" label="Home" on={active('/') && pathname === '/'} close={() => setMenuOpen(false)} />

                  {/* Caravans — expandable */}
                  <button
                    onClick={() => setMobileSubmenu(mobileSubmenu === 'caravans' ? null : 'caravans')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${active('/caravans') ? 'text-primary' : 'text-gray-700'}`}
                  >
                    Caravans
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${mobileSubmenu === 'caravans' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileSubmenu === 'caravans' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="pl-4 pr-1 pb-2">
                          <Link href="/caravans" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-primary mb-1">
                            Alle caravans →
                          </Link>
                          {caravans.map(c => (
                            <Link key={c.id} href={`/caravans/${c.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                              <div className="w-10 h-7 rounded overflow-hidden relative shrink-0 bg-gray-100">
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${active('/bestemmingen') ? 'text-primary' : 'text-gray-700'}`}
                  >
                    Bestemmingen
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${mobileSubmenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileSubmenu === 'bestemmingen' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="pl-4 pr-1 pb-2">
                          <Link href="/bestemmingen" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-primary mb-1">
                            Alle bestemmingen →
                          </Link>
                          {destinations.map(d => (
                            <Link key={d.id} href={`/bestemmingen/${d.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                              <div className="w-8 h-8 rounded overflow-hidden relative shrink-0 bg-gray-100">
                                <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized />
                              </div>
                              <span>{d.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <MobLink href="/boeken" label="Boeken" on={active('/boeken')} close={() => setMenuOpen(false)} />
                  <MobLink href="/over-ons" label="Over Ons" on={active('/over-ons')} close={() => setMenuOpen(false)} />
                  <MobLink href="/faq" label="FAQ" on={active('/faq')} close={() => setMenuOpen(false)} />
                  <MobLink href="/contact" label="Contact" on={active('/contact')} close={() => setMenuOpen(false)} />
                </nav>

                {/* Bottom CTA */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                  <Link href="/boeken" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform">
                    Boek Nu <ArrowRight size={16} />
                  </Link>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    <User size={15} /> Mijn Account
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
    <Link href={href} onClick={close} className={`flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium ${on ? 'text-primary' : 'text-gray-700'}`}>
      {label}
      <ChevronRight size={16} className="text-gray-300" />
    </Link>
  );
}

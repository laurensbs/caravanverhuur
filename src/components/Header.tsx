'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Mail, ArrowRight, ChevronRight, ChevronDown, User, MapPin, Users, Sparkles, Star, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { caravans } from '@/data/caravans';
import { destinations } from '@/data/destinations';
import WeatherBar from './WeatherBar';

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

const caravansByType = {
  LUXE: caravans.filter(c => c.type === 'LUXE'),
  FAMILIE: caravans.filter(c => c.type === 'FAMILIE'),
  COMPACT: caravans.filter(c => c.type === 'COMPACT'),
};

const typeInfo: Record<string, { label: string; color: string; desc: string; icon: React.ReactNode }> = {
  LUXE: { label: 'Luxe', color: 'from-amber-500 to-yellow-400', desc: 'Premium comfort & afwerking', icon: <Sparkles size={16} /> },
  FAMILIE: { label: 'Familie', color: 'from-blue-500 to-blue-400', desc: 'Ruimte voor het hele gezin', icon: <Users size={16} /> },
  COMPACT: { label: 'Compact', color: 'from-emerald-500 to-green-400', desc: 'Ideaal voor koppels', icon: <Star size={16} /> },
};

const destinationsByRegion: Record<string, typeof destinations> = {};
destinations.forEach(d => {
  if (!destinationsByRegion[d.region]) destinationsByRegion[d.region] = [];
  destinationsByRegion[d.region].push(d);
});

const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'];

/* Featured caravan image – pick luxe first */
const featuredCaravan = caravansByType.LUXE[0] || caravans[0];
const featuredDest = destinations.find(d => d.slug === 'tossa-de-mar') || destinations[0];

/* ------------------------------------------------------------------ */
/*  Simple nav items                                                   */
/* ------------------------------------------------------------------ */

const simpleLinks = [
  { href: '/', label: 'Home' },
  { href: '/over-ons', label: 'Over Ons' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState<'caravans' | 'bestemmingen' | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<'caravans' | 'bestemmingen' | null>(null);
  const pathname = usePathname();
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  // Close mega menu on route change
  useEffect(() => {
    setMegaMenu(null);
    setMenuOpen(false);
    setMobileSubmenu(null);
  }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const openMega = (menu: 'caravans' | 'bestemmingen') => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaMenu(menu);
  };

  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setMegaMenu(null), 150);
  };

  const keepMega = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
  };

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="sticky top-0 z-50">
      <WeatherBar />

      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className={`shrink-0 transition-opacity ${menuOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}>
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Caravanverhuur Costa Brava"
              width={220} height={60}
              className="w-36 sm:w-44 lg:w-48 h-auto max-h-14 object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {/* Home */}
            <Link href="/" className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/') && pathname === '/' ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
              Home
            </Link>

            {/* Caravans – mega trigger */}
            <div
              className="relative"
              onMouseEnter={() => openMega('caravans')}
              onMouseLeave={closeMega}
            >
              <button className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/caravans') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
                Caravans
                <ChevronDown size={14} className={`transition-transform ${megaMenu === 'caravans' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Bestemmingen – mega trigger */}
            <div
              className="relative"
              onMouseEnter={() => openMega('bestemmingen')}
              onMouseLeave={closeMega}
            >
              <button className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/bestemmingen') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
                Bestemmingen
                <ChevronDown size={14} className={`transition-transform ${megaMenu === 'bestemmingen' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Link href="/boeken" className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/boeken') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
              Boeken
            </Link>
            <Link href="/over-ons" className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/over-ons') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
              Over Ons
            </Link>
            <Link href="/faq" className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/faq') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
              FAQ
            </Link>
            <Link href="/contact" className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/contact') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}>
              Contact
            </Link>

            <Link href="/account" className="ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors" aria-label="Mijn Account">
              <User size={18} />
            </Link>

            <Link href="/boeken" className="ml-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm">
              Boek Nu
              <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" aria-label="Menu">
            <div className="relative w-5 h-4">
              <motion.span animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-0 left-0 w-full h-0.5 bg-gray-800 rounded-full origin-center" />
              <motion.span animate={menuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="absolute top-[6px] left-0 w-full h-0.5 bg-gray-800 rounded-full" />
              <motion.span animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="absolute top-3 left-0 w-full h-0.5 bg-gray-800 rounded-full origin-center" />
            </div>
          </button>
        </div>

        {/* ============ DESKTOP MEGA MENUS ============ */}
        <AnimatePresence>
          {megaMenu && (
            <motion.div
              ref={megaRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-2xl z-40"
              onMouseEnter={keepMega}
              onMouseLeave={closeMega}
            >
              {/* CARAVANS MEGA */}
              {megaMenu === 'caravans' && (
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left: categories with caravans */}
                    <div className="col-span-8">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Onze Caravans</h3>
                        <Link href="/caravans" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                          Bekijk alles <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                        {(['LUXE', 'FAMILIE', 'COMPACT'] as const).map(type => {
                          const info = typeInfo[type];
                          const items = caravansByType[type];
                          return (
                            <div key={type} className="space-y-3">
                              {/* Category header */}
                              <div className={`bg-gradient-to-r ${info.color} rounded-xl p-3 text-white`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  {info.icon}
                                  <span className="font-bold text-sm">{info.label}</span>
                                </div>
                                <p className="text-white/80 text-xs">{info.desc}</p>
                              </div>
                              {/* Items */}
                              {items.map(c => (
                                <Link key={c.id} href={`/caravans/${c.id}`} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 relative">
                                    <Image src={c.photos[0]} alt={c.name} fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.maxPersons} pers. &middot; &euro;{c.pricePerWeek}/week</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Featured / CTA */}
                    <div className="col-span-4">
                      <div className="relative rounded-2xl overflow-hidden h-full min-h-[260px]">
                        <Image src={featuredCaravan.photos[0]} alt={featuredCaravan.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full mb-2">
                            <Sparkles size={12} /> Uitgelicht
                          </span>
                          <h4 className="text-white font-bold text-lg mb-1">{featuredCaravan.name}</h4>
                          <p className="text-white/70 text-xs mb-3 line-clamp-2">{featuredCaravan.description}</p>
                          <Link href={`/caravans/${featuredCaravan.id}`} className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                            Bekijken <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BESTEMMINGEN MEGA */}
              {megaMenu === 'bestemmingen' && (
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left: destinations by region */}
                    <div className="col-span-8">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Bestemmingen aan de Costa Brava</h3>
                        <Link href="/bestemmingen" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                          Bekijk alles <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        {regionOrder.map(region => {
                          const items = destinationsByRegion[region] || [];
                          return (
                            <div key={region}>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{region}</h4>
                              <div className="space-y-1">
                                {items.map(d => (
                                  <Link key={d.id} href={`/bestemmingen/${d.slug}`} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                                      <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{d.name}</p>
                                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <Sun size={10} /> {d.weather.summer}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Featured destination */}
                    <div className="col-span-4">
                      <div className="relative rounded-2xl overflow-hidden h-full min-h-[260px]">
                        <Image src={featuredDest.heroImage} alt={featuredDest.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1.5">
                            <MapPin size={12} /> {featuredDest.region}
                          </div>
                          <h4 className="text-white font-bold text-lg mb-1">{featuredDest.name}</h4>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {featuredDest.bestFor.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">{tag}</span>
                            ))}
                          </div>
                          <Link href={`/bestemmingen/${featuredDest.slug}`} className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                            Ontdekken <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============ MOBILE SLIDE PANEL ============ */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMenuOpen(false)} />

              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col">
                {/* Panel header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <Link href="/" onClick={() => setMenuOpen(false)}>
                    <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png" alt="Logo" width={120} height={36} className="w-24 h-auto" unoptimized />
                  </Link>
                  <button onClick={() => setMenuOpen(false)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto py-3 px-3">
                  {/* Home */}
                  <Link href="/" onClick={() => setMenuOpen(false)} className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive('/') && pathname === '/' ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span className="text-[15px] font-medium">Home</span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>

                  {/* Caravans — expandable */}
                  <div>
                    <button onClick={() => setMobileSubmenu(mobileSubmenu === 'caravans' ? null : 'caravans')} className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive('/caravans') ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className="text-[15px] font-medium">Caravans</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${mobileSubmenu === 'caravans' ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileSubmenu === 'caravans' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="pl-4 pr-2 pb-2 space-y-1">
                            <Link href="/caravans" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 text-primary text-sm font-semibold">
                              Alle caravans bekijken
                              <ArrowRight size={14} />
                            </Link>
                            {(['LUXE', 'FAMILIE', 'COMPACT'] as const).map(type => (
                              <div key={type} className="pt-2">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${typeInfo[type].color} text-white text-xs font-bold mb-1.5`}>
                                  {typeInfo[type].icon}
                                  {typeInfo[type].label}
                                </div>
                                {caravansByType[type].map(c => (
                                  <Link key={c.id} href={`/caravans/${c.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="w-11 h-8 rounded-md overflow-hidden relative shrink-0">
                                      <Image src={c.photos[0]} alt={c.name} fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                                      <p className="text-[11px] text-gray-400">{c.maxPersons} pers. &middot; &euro;{c.pricePerWeek}/wk</p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bestemmingen — expandable */}
                  <div>
                    <button onClick={() => setMobileSubmenu(mobileSubmenu === 'bestemmingen' ? null : 'bestemmingen')} className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive('/bestemmingen') ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className="text-[15px] font-medium">Bestemmingen</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${mobileSubmenu === 'bestemmingen' ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileSubmenu === 'bestemmingen' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="pl-4 pr-2 pb-2 space-y-1">
                            <Link href="/bestemmingen" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 text-primary text-sm font-semibold">
                              Alle bestemmingen bekijken
                              <ArrowRight size={14} />
                            </Link>
                            {regionOrder.map(region => {
                              const items = destinationsByRegion[region] || [];
                              return (
                                <div key={region} className="pt-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">{region}</p>
                                  {items.map(d => (
                                    <Link key={d.id} href={`/bestemmingen/${d.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                      <div className="w-9 h-9 rounded-lg overflow-hidden relative shrink-0">
                                        <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{d.name}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={10} /> {d.region}</p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Simple links */}
                  {[{ href: '/boeken', label: 'Boeken' }, { href: '/over-ons', label: 'Over Ons' }, { href: '/faq', label: 'FAQ' }, { href: '/contact', label: 'Contact' }].map(link => (
                    <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isActive(link.href) ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className="text-[15px] font-medium">{link.label}</span>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </nav>

                {/* CTA + contact */}
                <div className="p-4 border-t border-gray-100 space-y-3">
                  <Link href="/boeken" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-base transition-all active:scale-95 shadow-md">
                    Boek Nu <ArrowRight size={18} />
                  </Link>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    <User size={16} /> Mijn Account
                  </Link>
                  <div className="flex gap-3 pt-1">
                    <a href="tel:+34600000000" className="flex items-center gap-2.5 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Phone size={14} /></div>
                      +34 600 000 000
                    </a>
                    <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-2.5 text-gray-500 hover:text-gray-700 transition-colors text-sm truncate">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0"><Mail size={14} /></div>
                      info@caravanverhuur...
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile floating CTA */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40">
        <Link href="/boeken" className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-full text-base transition-all active:scale-95 shadow-lg shadow-primary/30">
          Boek Nu <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

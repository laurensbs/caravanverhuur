'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { destinations as staticDestinations } from '@/data/destinations';
import {
  MapPin, ArrowRight, Search, X, Tent, ChevronRight,
  Waves, Heart, Sparkles, Umbrella, Wifi, ShoppingCart,
  Dumbbell, Star, UtensilsCrossed, Mountain, Clock, ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { motion, AnimatePresence } from 'framer-motion';
import BookingCTA from '@/components/BookingCTA';
import { useData } from '@/lib/data-context';

/* ── Types ─────────────────────────────── */
type Tab = 'stranden' | 'dorpen' | 'campings';

const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'] as const;

/* ── Facility icons ───────────────── */
const facilityIcons: Record<string, React.ReactNode> = {
  Zwembad: <Waves size={14} className="text-primary/60" />,
  Waterpark: <Waves size={14} className="text-primary/60" />,
  Aquapark: <Waves size={14} className="text-primary/60" />,
  Strand: <Umbrella size={14} className="text-primary/60" />,
  Restaurant: <span className="text-sm">🍽️</span>,
  Supermarkt: <ShoppingCart size={14} className="text-primary/60" />,
  WiFi: <Wifi size={14} className="text-primary/60" />,
  Animatie: <Sparkles size={14} className="text-primary/60" />,
  Speeltuin: <span className="text-sm">🎪</span>,
  Sportterreinen: <Dumbbell size={14} className="text-primary/60" />,
  Wellness: <Heart size={14} className="text-primary/60" />,
  Spa: <Heart size={14} className="text-primary/60" />,
  Fietsverhuur: <span className="text-sm">🚲</span>,
  Watersport: <Waves size={14} className="text-primary/60" />,
  Kajak: <span className="text-sm">🛶</span>,
};

/* ── Beach type / vibe label maps ─── */
const beachTypeLabel: Record<string, string> = {
  zand: '🏖️ Zandstrand',
  kiezel: '🪨 Kiezelstrand',
  rotsen: '🪨 Rotsstrand',
  mix: '🏝️ Gemengd',
};
const beachVibeLabel: Record<string, string> = {
  rustig: '🧘 Rustig',
  levendig: '🎉 Levendig',
  wild: '🌊 Wild',
  familiaal: '👨‍👩‍👧 Familiaal',
};

/* ── Build flat beaches array from destinations ── */
function getAllBeaches(dests: typeof staticDestinations) {
  return dests.flatMap(d =>
    d.beaches.map(b => ({
      ...b,
      destination: d.name,
      destinationSlug: d.slug,
      region: d.region,
      // Per-strand foto heeft voorrang; valt anders terug op de bestemming-hero.
      heroImage: b.photo || d.heroImage,
    }))
  );
}

/* ── Camping card component ───────────────── */
function CampingCard({ camping, t, destinations }: { camping: Camping; t: (k: string) => string; destinations: typeof staticDestinations }) {
  const nearDests = destinations.filter(d => camping.nearestDestinations?.includes(d.slug));

  return (
    <Link
      href={`/bestemmingen/${camping.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {camping.photos?.[0] ? (
          camping.photos[0].startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={camping.photos[0]}
              alt={`${camping.name} — ${camping.location}, Costa Brava`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <Image
              src={camping.photos[0]}
              alt={`${camping.name} — ${camping.location}, Costa Brava`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Tent size={32} className="text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-foreground shadow-sm">
            <MapPin size={9} className="text-primary" /> {camping.region}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-sm sm:text-lg font-bold text-white leading-tight drop-shadow-sm">{camping.name}</h3>
        </div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-xs sm:text-[13px] text-gray-500 line-clamp-2 mb-2.5">{camping.description}</p>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {camping.facilities?.slice(0, 4).map(f => (
            <span key={f} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-md text-[10px] text-gray-500">
              {facilityIcons[f] || <Tent size={9} />} {f}
            </span>
          ))}
          {(camping.facilities?.length || 0) > 4 && (
            <span className="px-1.5 py-0.5 bg-gray-50 rounded-md text-[10px] text-gray-400">
              +{(camping.facilities?.length || 0) - 4}
            </span>
          )}
        </div>
        {nearDests.length > 0 && (
          <div className="mt-auto pt-2.5 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{t('destinations.nearbyPlaces')}</p>
            <div className="flex items-center gap-2">
              {nearDests.slice(0, 3).map(d => (
                <span key={d.slug} className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                  <div className="w-4 h-4 rounded-full overflow-hidden relative bg-gray-100 shrink-0">
                    <Image src={d.heroImage} alt={d.name} fill className="object-cover" sizes="16px" unoptimized={d.heroImage.startsWith('http')} />
                  </div>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <span className="flex items-center justify-center gap-1.5 w-full py-2 bg-foreground/5 text-foreground font-semibold rounded-xl text-xs group-hover:bg-foreground group-hover:text-white transition-colors">
          {t('destinations.viewCamping')} <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}


/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */
export default function BestemmingenPage() {
  const { t } = useLanguage();
  const { destinations: ctxDestinations } = useData();
  const destinations = ctxDestinations.length > 0 ? ctxDestinations : staticDestinations;
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [allCampings, setAllCampings] = useState<Camping[]>(staticCampings);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trails, setTrails] = useState<any[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch campings + trails from API
  useEffect(() => {
    fetch('/api/campings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.campings?.length) setAllCampings(data.campings as Camping[]);
      })
      .catch((e) => console.error('Fetch error:', e));
    fetch('/api/trails')
      .then(res => res.json())
      .then(data => setTrails(data.trails || []))
      .catch((e) => console.error('Fetch trails error:', e));
  }, []);

  // Handle hash routing
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (['stranden', 'dorpen', 'campings'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // All beaches flattened
  const allBeaches = useMemo(() => getAllBeaches(destinations), [destinations]);

  // Filtered data
  const filteredCampings = useMemo(() => {
    let result = allCampings;
    if (selectedRegion) result = result.filter(c => c.region === selectedRegion);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) || c.facilities?.some(f => f.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedRegion, allCampings]);

  const filteredDests = useMemo(() => {
    let result = [...destinations];
    if (selectedRegion) result = result.filter(d => d.region === selectedRegion);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedRegion]);

  const filteredBeaches = useMemo(() => {
    let result = allBeaches;
    if (selectedRegion) result = result.filter(b => b.region === selectedRegion);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) || b.destination.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) ||
        b.vibe.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedRegion, allBeaches]);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearch('');
    setSelectedRegion(null);
    window.history.replaceState(null, '', `#${tab}`);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const goBack = () => {
    setActiveTab(null);
    setSearch('');
    setSelectedRegion(null);
    window.history.replaceState(null, '', '/bestemmingen');
  };

  const totalBeaches = allBeaches.length;

  const tabs: { key: Tab; icon: React.ReactNode; label: string; count: number; img: string }[] = [
    {
      key: 'stranden',
      icon: <Umbrella size={22} />,
      label: t('destinations.tabBeaches'),
      count: totalBeaches,
      img: '/images/campings/begur_sa_tuna.jpg',
    },
    {
      key: 'dorpen',
      icon: <MapPin size={22} />,
      label: t('destinations.tabCities'),
      count: destinations.length,
      img: '/images/campings/els_masos_de_pals.jpg',
    },
    {
      key: 'campings',
      icon: <Tent size={22} />,
      label: t('destinations.tabCampings'),
      count: allCampings.length,
      img: '/images/campings/cap_de_creus_landscape.jpg',
    },
  ];

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Bestemmingen', href: '/bestemmingen' },
  ]);
  const destList = itemListJsonLd(
    staticDestinations.slice(0, 20).map((d) => ({
      name: d.name,
      href: `/bestemmingen/${d.slug}`,
      image: d.heroImage,
    })),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(destList) }} />
      {/* ═══ PAGE HEADER ═══ */}
      <div className="bg-background border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <nav className="flex items-center gap-1.5 text-muted text-xs mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            {activeTab ? (
              <>
                <button onClick={goBack} className="hover:text-foreground transition-colors cursor-pointer">Costa Brava</button>
                <span>/</span>
                <span className="text-foreground">{tabs.find(tb => tb.key === activeTab)?.label}</span>
              </>
            ) : (
              <span className="text-foreground">Costa Brava</span>
            )}
          </nav>

          {activeTab && (
            <>
              <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight mb-1">
                {t('destinations.heroTitle')}
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
                {t('destinations.heroSubtitle')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ═══ CATEGORY SELECTOR ═══ */}
      <AnimatePresence mode="wait">
        {!activeTab && (
          <motion.section
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-7xl mx-auto px-4 py-6 sm:py-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => selectTab(tab.key)}
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[3/4] text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Image
                    src={tab.img}
                    alt={tab.label}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/85 transition-colors duration-500" />

                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">{tab.label}</h3>
                      <p className="text-white/50 text-sm mt-0.5">{tab.count} {tab.label.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-white/70 group-hover:text-white text-sm font-medium transition-colors">
                      {t('destinations.discover')}
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Quick stats row */}
            <div className="mt-10 sm:mt-14 flex justify-center">
              <div className="grid grid-cols-2 sm:inline-flex sm:items-center bg-white rounded-2xl shadow-sm border border-gray-100 sm:divide-x divide-gray-100">
                {[
                  { value: '3', label: t('destinations.regionsLabel'), icon: <MapPin size={14} className="text-primary" /> },
                  { value: String(destinations.length), label: t('destinations.placesLabel'), icon: <Star size={14} className="text-amber-500" /> },
                  { value: String(totalBeaches), label: t('destinations.beaches'), icon: <Umbrella size={14} className="text-cyan-500" /> },
                  { value: String(allCampings.length), label: t('destinations.tabCampings'), icon: <Tent size={14} className="text-emerald-500" /> },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">{s.icon}</div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{s.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══ ACTIVE TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            key={activeTab}
            ref={contentRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-[64px]"
          >
            {/* Tab bar + search (sticky) */}
            <section className="sticky top-[64px] sm:top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
              <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
                {/* Tab pills */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 sm:pb-0">
                  <button
                    onClick={goBack}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    ← {t('destinations.backToOverview')}
                  </button>
                  <div className="flex-1 min-w-0" />
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => selectTab(tab.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        activeTab === tab.key
                          ? 'bg-foreground text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search + region filter */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="relative flex-1 min-w-0">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={t('destinations.searchPlaceholder')}
                      className="w-full pl-10 pr-8 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5 sm:pb-0">
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        !selectedRegion ? 'bg-foreground text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {t('destinations.allRegions')}
                    </button>
                    {regionOrder.map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedRegion === r ? 'bg-foreground text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ═════ STRANDEN TAB ═════ */}
            {activeTab === 'stranden' && (
              <section className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
                <div className="mb-5">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Umbrella size={18} className="text-cyan-500" />
                    {t('destinations.beachesTitle')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {filteredBeaches.length} {t('destinations.beaches')}
                  </p>
                </div>

                {filteredBeaches.length === 0 ? (
                  <div className="text-center py-16">
                    <Umbrella size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('destinations.noBeaches')}</p>
                    <button onClick={() => { setSearch(''); setSelectedRegion(null); }} className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer">
                      {t('destinations.clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredBeaches.map((beach, i) => (
                      <Link
                        key={`${beach.destinationSlug}-${beach.name}-${i}`}
                        href={`/bestemmingen/${beach.destinationSlug}`}
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={beach.heroImage}
                            alt={beach.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized={beach.heroImage.startsWith('http')}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                            <span className="px-2 py-0.5 bg-cyan-500/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white shadow-sm">
                              {beachTypeLabel[beach.type] || beach.type}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <h3 className="text-sm sm:text-lg font-bold text-white leading-tight drop-shadow-sm">{beach.name}</h3>
                            <p className="text-[11px] text-white/60 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {beach.destination}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="text-xs sm:text-[13px] text-gray-500 line-clamp-2 mb-2">{beach.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-50 rounded-full text-[10px] text-gray-500 font-medium">
                              {beachVibeLabel[beach.vibe] || beach.vibe}
                            </span>
                            {beach.facilities && (
                              <span className="px-2 py-0.5 bg-emerald-50 rounded-full text-[10px] text-emerald-600 font-medium">
                                ✓ {t('destinations.facilities')}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 ml-auto">{beach.region}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ═════ DORPEN TAB ═════ */}
            {activeTab === 'dorpen' && (
              <section className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
                <div className="mb-5">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={18} className="text-amber-500" />
                    {t('destinations.citiesTitle')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {filteredDests.length} {t('destinations.destinationsCount')}
                  </p>
                </div>

                {filteredDests.length === 0 ? (
                  <div className="text-center py-16">
                    <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('destinations.noDestinations')}</p>
                    <button onClick={() => { setSearch(''); setSelectedRegion(null); }} className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer">
                      {t('destinations.clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {filteredDests.map(d => {
                      const nearbyCampings = allCampings.filter(c => c.nearestDestinations?.includes(d.slug));
                      return (
                        <Link
                          key={d.slug}
                          href={`/bestemmingen/${d.slug}`}
                          className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={d.heroImage}
                              alt={d.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              unoptimized={d.heroImage.startsWith('http')}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-2.5 left-2.5">
                              <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white shadow-sm">
                                {d.region}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{d.name}</h3>
                            </div>
                          </div>
                          <div className="p-2.5 sm:p-3">
                            <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 mb-2">{d.description}</p>
                            <div className="flex items-center gap-2.5 text-[10px] text-gray-400">
                              <span className="flex items-center gap-0.5"><Umbrella size={10} className="text-cyan-400" /> {d.beaches.length}</span>
                              <span className="flex items-center gap-0.5"><UtensilsCrossed size={10} className="text-amber-400" /> {d.restaurants.length}</span>
                              {nearbyCampings.length > 0 && (
                                <span className="flex items-center gap-0.5"><Tent size={10} className="text-emerald-400" /> {nearbyCampings.length}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ═════ CAMPINGS TAB ═════ */}
            {activeTab === 'campings' && (
              <section className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Tent size={18} className="text-emerald-500" />
                      {t('destinations.campingsTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      {filteredCampings.length} {t('destinations.campingsFound')}
                    </p>
                  </div>
                  {selectedRegion && (
                    <button onClick={() => setSelectedRegion(null)} className="text-xs sm:text-sm text-primary font-medium flex items-center gap-1 hover:text-primary-dark transition-colors cursor-pointer">
                      {t('destinations.allRegions')} <X size={14} />
                    </button>
                  )}
                </div>

                {/* Region cards — only when no filter */}
                {!search && !selectedRegion && (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
                    {regionOrder.map(region => {
                      const count = allCampings.filter(c => c.region === region).length;
                      return (
                        <button
                          key={region}
                          onClick={() => setSelectedRegion(region)}
                          className="group relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-[4/3] text-left cursor-pointer"
                        >
                          <Image
                            src={
                              region === 'Baix Empordà' ? '/images/campings/cala_d_aiguablava__begur.jpg'
                              : region === 'Alt Empordà' ? '/images/campings/cap_de_creus_landscape.jpg'
                              : '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg'
                            }
                            alt={region}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 640px) 33vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/85 transition-colors" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5">
                            <h3 className="text-sm sm:text-xl font-bold text-white leading-tight">{region}</h3>
                            <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 flex items-center gap-1">
                              <Tent size={10} className="shrink-0" /> {count} campings
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredCampings.length === 0 ? (
                  <div className="text-center py-16">
                    <Tent size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('destinations.noCampingsFound')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('destinations.tryDifferentSearch')}</p>
                    <button onClick={() => { setSearch(''); setSelectedRegion(null); }} className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium cursor-pointer">
                      {t('destinations.clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredCampings.map(c => <CampingCard key={c.id} camping={c} t={t} destinations={destinations} />)}
                  </div>
                )}
              </section>
            )}

            {/* ═════ HIGHLIGHTS — shown at bottom of every tab ═════ */}
            <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12 border-t border-gray-200">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-0.5">
                <Star size={18} className="text-primary" /> {t('destinations.highlightsTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mb-5">{t('destinations.highlightsSub')}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  { name: 'Dalí Theatre-Museum', place: 'Figueres', slug: 'figueres', icon: '🎨', img: '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg' },
                  { name: 'Vila Vella', place: 'Tossa de Mar', slug: 'tossa-de-mar', icon: '🏰', img: '/images/destinations/tossa_de_mar_torre_n_jmm.jpg' },
                  { name: 'Illes Medes', place: "L'Estartit", slug: 'estartit', icon: '🏝️', img: '/images/campings/spain__catalonia__illes_medes__medes_islands_.jpg' },
                  { name: 'Cap de Creus', place: 'Cadaqués', slug: 'cadaques', icon: '⛰️', img: '/images/campings/cap_de_creus_landscape.jpg' },
                  { name: 'Cala Sa Tuna', place: 'Begur', slug: 'begur', icon: '🏖️', img: '/images/campings/begur_sa_tuna.jpg' },
                  { name: 'Middeleeuws Pals', place: 'Pals', slug: 'pals', icon: '🏘️', img: '/images/campings/els_masos_de_pals.jpg' },
                  { name: 'Jardins de Cap Roig', place: 'Calella', slug: 'calella-de-palafrugell', icon: '🎭', img: '/images/destinations/jardines_de_cap_roig-calella_de_palafurgell-8-2013__11_.jpg' },
                  { name: 'Empuriabrava', place: 'Empuriabrava', slug: 'empuriabrava', icon: '⛵', img: '/images/campings/canal_principal_de_empuriabrava.jpg' },
                ].map((a) => (
                  <Link key={a.slug + a.name} href={`/bestemmingen/${a.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={a.img} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="text-base">{a.icon}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">{a.name}</h3>
                        <p className="text-[9px] sm:text-[10px] text-white/60 flex items-center gap-0.5 mt-0.5"><MapPin size={8} /> {a.place}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== WANDELROUTES ===== */}
      {trails.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Mountain size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{t('trails.heroTitle')}</h2>
                <p className="text-xs sm:text-sm text-muted">{t('trails.heroSubtitle')}</p>
              </div>
            </div>
            <Link href="/wandelroutes" className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
              {t('nav.viewAll') || 'Bekijk alles'} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trails.slice(0, 6).map(trail => (
              <div key={trail.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                {trail.photos?.[0] && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={trail.photos[0]}
                      alt={trail.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={trail.photos[0].startsWith('http')}
                    />
                    {trail.difficulty && (
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        trail.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        trail.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{trail.difficulty}</span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm">{trail.name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1 mt-1"><MapPin size={12} /> {trail.location}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    {trail.distanceKm && <span>{trail.distanceKm} km</span>}
                    {trail.durationMinutes && (
                      <span className="flex items-center gap-0.5"><Clock size={11} /> {Math.floor(trail.durationMinutes / 60)}u{trail.durationMinutes % 60 > 0 ? `${trail.durationMinutes % 60}m` : ''}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {trail.alltrailsUrl && (
                      <a href={trail.alltrailsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                        <ExternalLink size={11} /> AllTrails
                      </a>
                    )}
                    {trail.googleMapsUrl && (
                      <a href={trail.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                        <MapPin size={11} /> Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {trails.length > 6 && (
            <div className="text-center mt-6">
              <Link href="/wandelroutes" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                {t('trails.heroTitle')} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ===== BOOKING CTA ===== */}
      <BookingCTA />
    </div>
  );
}

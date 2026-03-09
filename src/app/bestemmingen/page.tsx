'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { destinations } from '@/data/destinations';
import {
  MapPin, ArrowRight, Star, Search, X, Tent, Filter, Globe, ChevronDown,
  Waves, Users, Heart, TreePine, Sparkles, Award, Umbrella, Wifi, ShoppingCart,
  Dumbbell,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Facility icons                                                     */
/* ------------------------------------------------------------------ */
const facilityIcons: Record<string, React.ReactNode> = {
  Zwembad: <Waves size={14} className="text-cyan-500" />,
  Waterpark: <Waves size={14} className="text-blue-500" />,
  Aquapark: <Waves size={14} className="text-blue-600" />,
  Strand: <Umbrella size={14} className="text-amber-500" />,
  Restaurant: <span className="text-sm">🍽️</span>,
  Supermarkt: <ShoppingCart size={14} className="text-green-500" />,
  WiFi: <Wifi size={14} className="text-indigo-500" />,
  Animatie: <Sparkles size={14} className="text-pink-500" />,
  Speeltuin: <span className="text-sm">🎪</span>,
  Sportterreinen: <Dumbbell size={14} className="text-orange-500" />,
  Wellness: <Heart size={14} className="text-rose-400" />,
  Spa: <Heart size={14} className="text-rose-500" />,
  Fietsverhuur: <span className="text-sm">🚲</span>,
  Watersport: <Waves size={14} className="text-teal-500" />,
  Kajak: <span className="text-sm">🛶</span>,
};

const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'] as const;

/* ------------------------------------------------------------------ */
/*  Stars component                                                    */
/* ------------------------------------------------------------------ */
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Camping card                                                       */
/* ------------------------------------------------------------------ */
function CampingCard({ camping, t }: { camping: Camping; t: (k: string) => string }) {
  const nearDests = destinations.filter(d => camping.nearestDestinations?.includes(d.slug));

  return (
    <Link
      href={`/bestemmingen/${camping.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100/50 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-cyan-50">
        <Image
          src={camping.photos?.[0] || '/og-image.jpg'}
          alt={`${camping.name} — ${camping.location}, Costa Brava`}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Stars badge */}
        {camping.stars && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 shadow-sm">
              <Stars count={camping.stars} />
            </span>
          </div>
        )}

        {/* Region badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white shadow-sm">
            <MapPin size={10} /> {camping.region}
          </span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 drop-shadow-lg">{camping.name}</h3>
          <div className="flex items-center gap-1.5 text-white/80 text-xs">
            <MapPin size={12} /> {camping.location}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{camping.description}</p>

        {/* Facilities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {camping.facilities?.slice(0, 5).map(f => (
            <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full text-[11px] text-gray-600 border border-gray-100">
              {facilityIcons[f] || <Tent size={10} />} {f}
            </span>
          ))}
          {(camping.facilities?.length || 0) > 5 && (
            <span className="px-2 py-0.5 bg-gray-50 rounded-full text-[11px] text-gray-400 border border-gray-100">
              +{(camping.facilities?.length || 0) - 5}
            </span>
          )}
        </div>

        {/* Nearby places */}
        {nearDests.length > 0 && (
          <div className="mt-auto pt-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">{t('destinations.nearbyPlaces')}</p>
            <div className="flex items-center gap-2">
              {nearDests.slice(0, 3).map(d => (
                <span key={d.slug} className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-full overflow-hidden relative bg-gray-100 shrink-0">
                    <Image src={d.heroImage} alt={d.name} fill className="object-cover" sizes="20px" />
                  </div>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/5 text-primary font-semibold rounded-xl text-sm group-hover:bg-primary group-hover:text-white transition-colors">
          {t('destinations.viewCamping')} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  DB camping card (simpler, for admin-added campings without photos) */
/* ------------------------------------------------------------------ */
function DbCampingCard({ camping, t }: { camping: Record<string, unknown>; t: (k: string) => string }) {
  const name = camping.name as string;
  const location = camping.location as string;
  const description = camping.description as string;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 flex flex-col">
      {/* Placeholder image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-cyan-50 flex items-center justify-center">
        <Tent size={48} className="text-primary/30" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
          <h3 className="text-lg font-bold text-white drop-shadow-lg">{name}</h3>
          <div className="flex items-center gap-1.5 text-white/80 text-xs">
            <MapPin size={12} /> {location}
          </div>
        </div>
      </div>
      <div className="p-4 flex-1">
        <p className="text-sm text-gray-600 line-clamp-2">{description || t('destinations.noCampingDesc')}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function BestemmingenPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dbCampings, setDbCampings] = useState<Record<string, unknown>[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch DB campings (admin-managed)
  useEffect(() => {
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => {
        if (data.source === 'db' && data.campings?.length) {
          // Filter out campings that are already in the static list by name
          const staticNames = new Set(staticCampings.map(c => c.name.toLowerCase()));
          const extra = data.campings.filter((c: Record<string, unknown>) => !staticNames.has((c.name as string).toLowerCase()));
          setDbCampings(extra);
        }
      })
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  // Filter campings
  const filteredCampings = useMemo(() => {
    let result = staticCampings;
    if (selectedRegion) {
      result = result.filter(c => c.region === selectedRegion);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.facilities?.some(f => f.toLowerCase().includes(q)) ||
        c.bestFor?.some(b => b.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedRegion]);

  // Filter DB campings
  const filteredDbCampings = useMemo(() => {
    if (!search.trim()) return dbCampings;
    const q = search.toLowerCase();
    return dbCampings.filter(c =>
      (c.name as string).toLowerCase().includes(q) ||
      (c.location as string).toLowerCase().includes(q)
    );
  }, [search, dbCampings]);

  // Stats
  const totalCampings = staticCampings.length + dbCampings.length;
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of regionOrder) {
      counts[r] = staticCampings.filter(c => c.region === r).length;
    }
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Playa_de_Pals_%28Costa_Brava%29.jpg/1280px-Playa_de_Pals_%28Costa_Brava%29.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <nav className="flex items-center gap-1.5 text-white/50 text-xs mb-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">{t('nav.destinations')}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('destinations.heroTitle')}
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mb-8">
            {t('destinations.heroSubtitle')}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Tent size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCampings}</p>
                <p className="text-xs text-white/60">{t('destinations.campingsLabel')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-white/60">{t('destinations.regionsLabel')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{destinations.length}</p>
                <p className="text-xs text-white/60">{t('destinations.placesLabel')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & filters */}
      <section className="relative z-10 -mt-7 max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('destinations.searchPlaceholder')}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Region filter (mobile toggle) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 border border-gray-200"
            >
              <Filter size={16} /> {t('destinations.filters')} {selectedRegion && <span className="w-2 h-2 bg-primary rounded-full" />}
            </button>

            {/* Region filter (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${!selectedRegion ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
              >
                {t('destinations.allRegions')} ({totalCampings})
              </button>
              {regionOrder.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${selectedRegion === r ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {r} ({regionCounts[r]})
                </button>
              ))}
            </div>
          </div>

          {/* Mobile region filter (expandable) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden sm:hidden"
              >
                <div className="flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => { setSelectedRegion(null); setShowFilters(false); }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!selectedRegion ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                  >
                    {t('destinations.allRegions')}
                  </button>
                  {regionOrder.map(r => (
                    <button
                      key={r}
                      onClick={() => { setSelectedRegion(selectedRegion === r ? null : r); setShowFilters(false); }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedRegion === r ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                    >
                      {r} ({regionCounts[r]})
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results count */}
      <section className="max-w-7xl mx-auto px-4 mt-6 mb-2">
        <p className="text-sm text-gray-500">
          {filteredCampings.length + filteredDbCampings.length} {t('destinations.campingsFound')}
          {selectedRegion && <span className="text-primary font-medium"> — {selectedRegion}</span>}
          {search && <span className="text-primary font-medium"> — &quot;{search}&quot;</span>}
        </p>
      </section>

      {/* Camping grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {filteredCampings.length === 0 && filteredDbCampings.length === 0 ? (
          <div className="text-center py-20">
            <Tent size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">{t('destinations.noCampingsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('destinations.tryDifferentSearch')}</p>
            <button
              onClick={() => { setSearch(''); setSelectedRegion(null); }}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium"
            >
              {t('destinations.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            {/* Group by region when no search/filter active */}
            {!search && !selectedRegion ? (
              <>
                {regionOrder.map(region => {
                  const regionCampings = staticCampings.filter(c => c.region === region);
                  return (
                    <div key={region} className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{region}</h2>
                        <span className="text-sm text-gray-400 font-medium">{regionCampings.length} campings</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regionCampings.map(c => (
                          <CampingCard key={c.id} camping={c} t={t} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* DB campings */}
                {filteredDbCampings.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('destinations.moreCampings')}</h2>
                      <span className="text-sm text-gray-400 font-medium">{filteredDbCampings.length} campings</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDbCampings.map((c, i) => (
                        <DbCampingCard key={`db-${i}`} camping={c} t={t} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Flat grid when searching/filtering */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {filteredCampings.map(c => (
                  <CampingCard key={c.id} camping={c} t={t} />
                ))}
                {filteredDbCampings.map((c, i) => (
                  <DbCampingCard key={`db-${i}`} camping={c} t={t} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA section */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('destinations.ctaTitle')}</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">{t('destinations.ctaSubtitle')}</p>
            <Link
              href="/boeken"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full text-sm transition-transform hover:scale-105 shadow-lg"
            >
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { destinations } from '@/data/destinations';
import {
  MapPin, ArrowRight, Search, X, Tent,
  Waves, Heart, Sparkles, Umbrella, Wifi, ShoppingCart,
  Dumbbell, Landmark, UtensilsCrossed, Star, Map as MapIcon, ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

/* Dynamic map — Leaflet needs browser */
const CostaBravaMap = dynamic(() => import('@/components/CostaBravaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] sm:h-[420px] md:h-[500px] lg:h-[560px] bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Kaart laden...</p>
      </div>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Facility icons                                                     */
/* ------------------------------------------------------------------ */
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

const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'] as const;

const regionImages: Record<string, string> = {
  'Baix Empordà': '/images/campings/cala_d_aiguablava__begur.jpg',
  'Alt Empordà': '/images/campings/cap_de_creus_landscape.jpg',
  'La Selva': '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg',
};

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
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary-50">
        {camping.photos?.[0] ? (
          camping.photos[0].startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={camping.photos[0]}
              alt={`${camping.name} — ${camping.location}, Costa Brava`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <Image
              src={camping.photos[0]}
              alt={`${camping.name} — ${camping.location}, Costa Brava`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Tent size={40} className="text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Region badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-primary/90 backdrop-blur-sm rounded-full text-[10px] sm:text-[11px] font-semibold text-white shadow-sm">
            <MapPin size={10} /> {camping.region}
          </span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 drop-shadow-lg leading-tight">{camping.name}</h3>
          <div className="flex items-center gap-1.5 text-white/80 text-[11px]">
            <MapPin size={11} /> {camping.location}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <p className="text-[13px] sm:text-sm text-gray-600 line-clamp-2 mb-3">{camping.description}</p>

        {/* Facilities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {camping.facilities?.slice(0, 4).map(f => (
            <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full text-[11px] text-gray-600 border border-gray-100">
              {facilityIcons[f] || <Tent size={10} />} {f}
            </span>
          ))}
          {(camping.facilities?.length || 0) > 4 && (
            <span className="px-2 py-0.5 bg-gray-50 rounded-full text-[11px] text-gray-400 border border-gray-100">
              +{(camping.facilities?.length || 0) - 4}
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
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
        <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/5 text-primary font-semibold rounded-xl text-sm group-hover:bg-primary group-hover:text-white transition-colors">
          {t('destinations.viewCamping')} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Curated attractions (top 6 shown on overview)                      */
/* ------------------------------------------------------------------ */
const attractionCards = [
  { name: 'Dalí Theatre-Museum', place: 'Figueres', slug: 'figueres', icon: '🎨', img: '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg', desc: 'Het surrealistische meesterwerk van Salvador Dalí' },
  { name: 'Vila Vella', place: 'Tossa de Mar', slug: 'tossa-de-mar', icon: '🏰', img: '/images/destinations/tossa_de_mar_torre_n_jmm.jpg', desc: 'De enige versterkte middeleeuwse stad aan de kust' },
  { name: 'Illes Medes', place: "L'Estartit", slug: 'estartit', icon: '🏝️', img: '/images/campings/spain__catalonia__illes_medes__medes_islands_.jpg', desc: 'Snorkelen en duiken in een beschermd marien reservaat' },
  { name: 'Cap de Creus', place: 'Cadaqués', slug: 'cadaques', icon: '⛰️', img: '/images/campings/cap_de_creus_landscape.jpg', desc: 'Het meest oostelijke punt van het Iberisch schiereiland' },
  { name: 'Jardí Botànic Marimurtra', place: 'Blanes', slug: 'blanes', icon: '🌺', img: '/images/campings/marimurtra_botanic_garden_blanes_costa_brava_catalonia_spain.jpg', desc: 'Botanische tuin met panoramisch uitzicht op de kust' },
  { name: 'Middeleeuws Pals', place: 'Pals', slug: 'pals', icon: '🏘️', img: '/images/campings/els_masos_de_pals.jpg', desc: 'Prachtig bewaard middeleeuws dorpje op een heuvel' },
  { name: 'Jardins de Cap Roig', place: 'Calella de Palafrugell', slug: 'calella-de-palafrugell', icon: '🎭', img: '/images/destinations/jardines_de_cap_roig-calella_de_palafurgell-8-2013__11_.jpg', desc: 'Botanische tuin met zomerfestival en zeezicht' },
  { name: 'Aiguamolls de l\'Empordà', place: 'Sant Pere Pescador', slug: 'sant-pere-pescador', icon: '🦩', img: '/images/campings/animales-aiguamolls_l_emporda-2013.jpg', desc: 'Natuurpark met flamingo\'s, reigers en wandelroutes' },
  { name: 'Cala Sa Tuna', place: 'Begur', slug: 'begur', icon: '🏖️', img: '/images/campings/begur_sa_tuna.jpg', desc: 'Schilderachtige baai met kristalhelder turquoise water' },
  { name: 'Empuriabrava Kanalen', place: 'Empuriabrava', slug: 'empuriabrava', icon: '⛵', img: '/images/campings/canal_principal_de_empuriabrava.jpg', desc: 'Europa\'s grootste residentiële jachthaven' },
  { name: 'Kasteel van Begur', place: 'Begur', slug: 'begur', icon: '🏰', img: '/images/campings/begurcastle.jpg', desc: 'Ruïne met 360° panoramisch uitzicht over de Costa Brava' },
  { name: 'Ciutadella de Roses', place: 'Roses', slug: 'roses', icon: '🏛️', img: '/images/campings/ciutadella_de_roses-2022.jpg', desc: 'Historische vesting met Griekse, Romeinse en middeleeuwse resten' },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function BestemmingenPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [allCampings, setAllCampings] = useState<Camping[]>(staticCampings);
  const [showAllCampings, setShowAllCampings] = useState(false);

  // Fetch campings from API — only active campings are returned
  useEffect(() => {
    fetch('/api/campings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.campings?.length) {
          setAllCampings(data.campings as Camping[]);
        }
      })
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  // Handle hash for direct linking + section scroll
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      // Region filtering
      const region = regionOrder.find(r => r.toLowerCase().replace(/\s+/g, '-') === hash);
      if (region) { setSelectedRegion(region); return; }
      // Section scrolling
      if (['campings', 'plaatsen', 'bezienswaardigheden'].includes(hash)) {
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Filter campings
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

  // Filter destinations by search
  const filteredDests = useMemo(() => {
    if (!search.trim()) return destinations;
    const q = search.toLowerCase();
    return destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }, [search]);

  const totalCampings = allCampings.length;
  const visibleCampings = showAllCampings ? filteredCampings : filteredCampings.slice(0, 9);
  const hasMore = filteredCampings.length > 9 && !showAllCampings;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero — compact, camping-first messaging */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden min-h-[40vh] sm:min-h-[35vh] flex flex-col justify-end">
        <div className="absolute inset-0 bg-[url('/images/campings/els_masos_de_pals.jpg')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-8 sm:pt-16 sm:pb-10 w-full">
          <nav className="flex items-center gap-1.5 text-white/50 text-xs mb-4 sm:mb-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">{t('nav.destinations')}</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
            {t('destinations.heroTitle')}
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-2xl mb-6">
            {t('destinations.heroSubtitle')}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 sm:gap-5">
            {[
              { icon: <Tent size={15} />, value: totalCampings, label: 'Campings' },
              { icon: <MapPin size={15} />, value: destinations.length, label: t('destinations.placesLabel') },
              { icon: <Umbrella size={15} />, value: destinations.reduce((acc, d) => acc + d.beaches.length, 0), label: t('destinations.beaches') },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">{s.icon}</div>
                <div>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-[10px] text-white/60">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search + region filter bar (sticky) */}
      <section className="sticky top-[80px] sm:top-[100px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('destinations.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
            </div>
            {/* Region pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`px-3 py-1.5 rounded-full text-[12px] sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedRegion ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('destinations.allRegions')} ({totalCampings})
              </button>
              {regionOrder.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  className={`px-3 py-1.5 rounded-full text-[12px] sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRegion === r ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r} ({allCampings.filter(c => c.region === r).length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== REGION CARDS — visual selector (only when no search, no region filter) ===== */}
      {!search && !selectedRegion && (
        <section className="max-w-7xl mx-auto px-4 pt-6 sm:pt-10 pb-2">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">{t('destinations.chooseRegion')}</h2>
          <p className="text-sm text-gray-500 mb-4 sm:mb-6">{t('destinations.chooseRegionSub')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {regionOrder.map(region => {
              const count = allCampings.filter(c => c.region === region).length;
              const desc = t(`destinations.region${region === 'Baix Empordà' ? 'BaixDesc' : region === 'Alt Empordà' ? 'AltDesc' : 'SelvaDesc'}`);
              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className="group relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[4/3] text-left"
                >
                  <Image src={regionImages[region]} alt={region} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5">{region}</h3>
                    <p className="text-xs sm:text-[13px] text-white/70 line-clamp-2 mb-2">{desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
                      <Tent size={12} /> {count} campings <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== CAMPINGS GRID — main content ===== */}
      <section id="campings" className="max-w-7xl mx-auto px-4 py-6 sm:py-8 scroll-mt-[120px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tent size={20} className="text-primary" />
              {selectedRegion ? selectedRegion : t('destinations.campingsTitle').replace('{count}', String(totalCampings))}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredCampings.length} {t('destinations.campingsFound')}
            </p>
          </div>
          {selectedRegion && (
            <button onClick={() => setSelectedRegion(null)} className="text-sm text-primary font-medium flex items-center gap-1">
              {t('destinations.allRegions')} <X size={14} />
            </button>
          )}
        </div>

        {filteredCampings.length === 0 ? (
          <div className="text-center py-16">
            <Tent size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('destinations.noCampingsFound')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('destinations.tryDifferentSearch')}</p>
            <button onClick={() => { setSearch(''); setSelectedRegion(null); }} className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium">
              {t('destinations.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {visibleCampings.map(c => <CampingCard key={c.id} camping={c} t={t} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllCampings(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-200 transition-colors"
                >
                  {t('destinations.moreCampings')} ({filteredCampings.length - 9}) <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== INTERACTIVE MAP ===== */}
      {!search && (
        <section className="bg-white py-8 sm:py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-1">
              <MapIcon size={20} className="text-primary" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{t('destinations.interactiveMap')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('destinations.mapSub')}</p>
            <CostaBravaMap destinations={destinations} campings={allCampings} />
          </div>
        </section>
      )}

      {/* ===== PLACES TO EXPLORE — destinations grid ===== */}
      {!search && (
        <section id="plaatsen" className="bg-surface py-10 sm:py-14 scroll-mt-[120px]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" /> {t('destinations.exploreTitle')}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{t('destinations.exploreSub')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {destinations.map(d => {
                const nearbyCampings = allCampings.filter(c => c.nearestDestinations?.includes(d.slug));
                const gmUrl = `https://www.google.com/maps/search/?api=1&query=${d.coordinates.lat},${d.coordinates.lng}`;
                return (
                  <div key={d.slug} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                    <Link href={`/bestemmingen/${d.slug}`}>
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                          <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{d.name}</h3>
                          <p className="text-[10px] sm:text-[11px] text-white/70">{d.region}</p>
                        </div>
                      </div>
                    </Link>
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Umbrella size={10} className="text-primary/50" /> {d.beaches.length}</span>
                          <span className="flex items-center gap-0.5"><UtensilsCrossed size={10} className="text-primary/50" /> {d.restaurants.length}</span>
                          {nearbyCampings.length > 0 && (
                            <span className="flex items-center gap-0.5"><Tent size={10} className="text-primary/50" /> {nearbyCampings.length}</span>
                          )}
                        </div>
                        <a href={gmUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-[11px] text-blue-400 hover:text-blue-600 font-medium inline-flex items-center gap-0.5 transition-colors">
                          <ExternalLink size={9} /> Maps
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== SEARCH RESULTS — show destinations when searching ===== */}
      {search && filteredDests.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-primary" /> {t('destinations.placesLabel')} ({filteredDests.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDests.map(d => (
              <Link key={d.slug} href={`/bestemmingen/${d.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all flex">
                <div className="relative w-28 sm:w-32 shrink-0 overflow-hidden">
                  <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="128px" />
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 mb-0.5">{d.name}</h3>
                  <p className="text-[11px] text-gray-400 mb-1.5">{d.region}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{d.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== HIGHLIGHTS — attractions grid ===== */}
      {!search && (
        <section id="bezienswaardigheden" className="max-w-7xl mx-auto px-4 py-8 sm:py-12 scroll-mt-[120px]">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Star size={20} className="text-primary" /> {t('destinations.highlightsTitle')}
          </h2>
          <p className="text-sm text-gray-500 mb-5">{t('destinations.highlightsSub')}</p>

          {/* Featured — first 2 cards large */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            {attractionCards.slice(0, 2).map((a) => {
              const dest = destinations.find(d => d.slug === a.slug);
              const gmUrl = dest ? `https://www.google.com/maps/search/?api=1&query=${dest.coordinates.lat},${dest.coordinates.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ' ' + a.place + ' Costa Brava')}`;
              return (
                <div key={a.slug + a.name} className="group relative rounded-xl overflow-hidden aspect-[16/9] sm:aspect-[16/10]">
                  <Image src={a.img} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <span className="text-2xl sm:text-3xl block mb-1">{a.icon}</span>
                    <h3 className="text-base sm:text-xl font-bold text-white leading-tight">{a.name}</h3>
                    <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5 mb-2"><MapPin size={11} /> {a.place}</p>
                    <p className="text-xs sm:text-sm text-white/80 line-clamp-2 mb-3">{a.desc}</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/bestemmingen/${a.slug}`} className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-lg hover:bg-white/30 transition-colors">
                        Ontdek →
                      </Link>
                      <a href={gmUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-1">
                        <ExternalLink size={10} /> Maps
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining cards — compact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {attractionCards.slice(2).map((a) => {
              const dest = destinations.find(d => d.slug === a.slug);
              const gmUrl = dest ? `https://www.google.com/maps/search/?api=1&query=${dest.coordinates.lat},${dest.coordinates.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ' ' + a.place + ' Costa Brava')}`;
              return (
                <div key={a.slug + a.name} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={a.img} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-lg">{a.icon}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{a.name}</h3>
                      <p className="text-[10px] sm:text-[11px] text-white/70 flex items-center gap-1 mt-0.5"><MapPin size={9} /> {a.place}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{a.desc}</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/bestemmingen/${a.slug}`} className="flex-1 text-center py-1.5 bg-primary/5 text-primary font-semibold rounded-lg text-xs hover:bg-primary hover:text-white transition-colors">
                        Ontdek →
                      </Link>
                      <a href={gmUrl} target="_blank" rel="noopener noreferrer" className="py-1.5 px-2.5 bg-blue-50 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors inline-flex items-center gap-1">
                        <ExternalLink size={10} /> Maps
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

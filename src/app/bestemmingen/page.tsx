'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { destinations, type Destination, type Restaurant, type Beach } from '@/data/destinations';
import { locationActivities, getCategoryLabel, type Activity } from '@/data/activities';
import {
  MapPin, ArrowRight, Sun, Users, ChevronRight, Compass, Star, Waves, Camera, TreePine,
  Heart, Thermometer, Anchor, Palette, Search, X, UtensilsCrossed, Umbrella,
  Mountain, Map, Grid3X3, ChevronDown, Sparkles, Award, Bike, Wine, Fish, Castle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

// Lazy-load map to avoid SSR issues with Leaflet
const CostaBravaMap = dynamic(() => import('@/components/CostaBravaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] md:h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Kaart laden...</p>
      </div>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Tab / category types                                               */
/* ------------------------------------------------------------------ */
type TabKey = 'overzicht' | 'steden' | 'stranden' | 'restaurants' | 'activiteiten';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overzicht', label: 'Overzicht', icon: <Grid3X3 size={16} /> },
  { key: 'steden', label: 'Steden & Dorpen', icon: <Castle size={16} /> },
  { key: 'stranden', label: 'Stranden', icon: <Umbrella size={16} /> },
  { key: 'restaurants', label: 'Restaurants', icon: <UtensilsCrossed size={16} /> },
  { key: 'activiteiten', label: 'Activiteiten', icon: <Bike size={16} /> },
];

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */
const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'];

const regionIcons: Record<string, React.ReactNode> = {
  'Baix Empordà': <Anchor size={16} />,
  'Alt Empordà': <Palette size={16} />,
  'La Selva': <TreePine size={16} />,
};

// Collect all beaches across all destinations
const allBeaches: (Beach & { destination: string; destSlug: string })[] = destinations.flatMap(d =>
  d.beaches.map(b => ({ ...b, destination: d.name, destSlug: d.slug }))
);

// Collect all restaurants
const allRestaurants: (Restaurant & { destination: string; destSlug: string })[] = destinations.flatMap(d =>
  d.restaurants.map(r => ({ ...r, destination: d.name, destSlug: d.slug }))
);

// Collect all activities
const allActivities: (Activity & { location: string })[] = locationActivities.flatMap(la =>
  la.activities.map(a => ({ ...a, location: la.location }))
);

const bestForIcons: Record<string, React.ReactNode> = {
  Gezinnen: <Users size={14} />,
  Koppels: <Heart size={14} />,
  Cultuurliefhebbers: <Palette size={14} />,
  Strandvakantie: <Waves size={14} />,
  Duikers: <Anchor size={14} />,
  Natuurliefhebbers: <TreePine size={14} />,
  Watersporters: <Waves size={14} />,
  Jongeren: <Star size={14} />,
  Fotografen: <Camera size={14} />,
  Surfers: <Waves size={14} />,
  Strandliefhebbers: <Sun size={14} />,
  Kunstenaars: <Palette size={14} />,
  Families: <Users size={14} />,
  Budgetvriendelijk: <Star size={14} />,
  'Rust zoekers': <TreePine size={14} />,
  Culinair: <UtensilsCrossed size={14} />,
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DestinationCard({ dest }: { dest: Destination }) {
  return (
    <Link
      href={`/bestemmingen/${dest.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={dest.heroImage} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
            <Sun size={12} className="text-primary" /> {dest.weather.summer}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{dest.name}</h3>
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <MapPin size={13} /> {dest.region}
            {dest.population && <span className="ml-2 text-white/60">· {dest.population}</span>}
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{dest.description}</p>
        {dest.knownFor && (
          <p className="text-xs text-primary font-semibold mb-3 flex items-center gap-1">
            <Sparkles size={12} /> {dest.knownFor}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {dest.bestFor.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
              {bestForIcons[tag] || <Star size={10} />} {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {dest.beaches.length > 0 && (
              <span className="flex items-center gap-1"><Umbrella size={13} /> {dest.beaches.length} stranden</span>
            )}
            {dest.restaurants.length > 0 && (
              <span className="flex items-center gap-1"><UtensilsCrossed size={13} /> {dest.restaurants.length} restaurants</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ontdek <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BeachCard({ beach }: { beach: Beach & { destination: string; destSlug: string } }) {
  const vibeColors: Record<string, string> = {
    rustig: 'bg-emerald-50 text-emerald-700',
    levendig: 'bg-amber-50 text-amber-700',
    wild: 'bg-violet-50 text-violet-700',
    familiaal: 'bg-blue-50 text-blue-700',
  };
  const typeLabels: Record<string, string> = {
    zand: 'Zandstrand',
    kiezel: 'Kiezelstrand',
    rotsen: 'Rotsenstrand',
    mix: 'Gemengd',
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-gray-900">{beach.name}</h4>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vibeColors[beach.vibe] || 'bg-gray-100 text-gray-600'}`}>
          {beach.vibe}
        </span>
      </div>
      <Link href={`/bestemmingen/${beach.destSlug}`} className="text-xs text-primary font-medium mb-2 inline-flex items-center gap-1 hover:underline">
        <MapPin size={11} /> {beach.destination}
      </Link>
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{beach.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Waves size={12} /> {typeLabels[beach.type]}
        </span>
        {beach.facilities && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            ✓ Faciliteiten
          </span>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant & { destination: string; destSlug: string } }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-bold text-gray-900">{restaurant.name}</h4>
        <span className="text-sm font-bold text-primary">{restaurant.price}</span>
      </div>
      <Link href={`/bestemmingen/${restaurant.destSlug}`} className="text-xs text-primary font-medium mb-2 inline-flex items-center gap-1 hover:underline">
        <MapPin size={11} /> {restaurant.destination}
      </Link>
      <p className="text-xs text-gray-500 mb-2">{restaurant.cuisine}</p>
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{restaurant.description}</p>
      {restaurant.mustTry && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/8 px-2.5 py-1 rounded-full w-fit">
          <Award size={12} /> Must try: {restaurant.mustTry}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity, location }: { activity: Activity; location: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl">{activity.icon}</span>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{activity.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <MapPin size={11} /> {location}
            {activity.distance && <span>· {activity.distance}</span>}
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {getCategoryLabel(activity.category)}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
      {activity.tip && (
        <p className="text-xs text-primary mt-2 italic">💡 {activity.tip}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat counters                                                      */
/* ------------------------------------------------------------------ */
function StatsBar() {
  const stats = [
    { label: 'Bestemmingen', value: destinations.length, icon: <MapPin size={18} /> },
    { label: 'Stranden', value: allBeaches.length, icon: <Umbrella size={18} /> },
    { label: 'Restaurants', value: allRestaurants.length, icon: <UtensilsCrossed size={18} /> },
    { label: 'Activiteiten', value: allActivities.length, icon: <Bike size={18} /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm">
          <div className="flex justify-center text-primary mb-2">{s.icon}</div>
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function DestinationsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('overzicht');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [beachFilter, setBeachFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [activityCat, setActivityCat] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Search filter
  const filteredDestinations = useMemo(() => {
    let filtered = destinations;
    if (selectedRegion) {
      filtered = filtered.filter(d => d.region === selectedRegion);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.knownFor?.toLowerCase().includes(q) ||
        d.bestFor.some(b => b.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [searchQuery, selectedRegion]);

  const filteredBeaches = useMemo(() => {
    let filtered = allBeaches;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    }
    if (beachFilter) {
      if (beachFilter === 'faciliteiten') {
        filtered = filtered.filter(b => b.facilities);
      } else {
        filtered = filtered.filter(b => b.vibe === beachFilter);
      }
    }
    return filtered;
  }, [searchQuery, beachFilter]);

  const filteredRestaurants = useMemo(() => {
    let filtered = allRestaurants;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
      );
    }
    if (priceFilter) {
      filtered = filtered.filter(r => r.price === priceFilter);
    }
    return filtered;
  }, [searchQuery, priceFilter]);

  const filteredActivities = useMemo(() => {
    let filtered = allActivities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (activityCat) {
      filtered = filtered.filter(a => a.category === activityCat);
    }
    return filtered;
  }, [searchQuery, activityCat]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HERO ===== */}
      <section className="relative h-[50vh] min-h-[380px] lg:h-[55vh] overflow-hidden">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg"
          alt="Costa Brava kust"
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold mb-4 uppercase tracking-wider">
            <Compass size={14} /> Encyclopedie
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
            Costa Brava <span className="text-primary">Gids</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto drop-shadow mb-6">
            Ontdek {destinations.length} bestemmingen, {allBeaches.length} stranden, {allRestaurants.length} restaurants en {allActivities.length}+ activiteiten aan de mooiste kust van Spanje.
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-10 mb-8">
        <StatsBar />
      </section>

      {/* ===== TABS + SEARCH ===== */}
      <section className="sticky top-[112px] sm:top-[116px] z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar flex-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setSelectedRegion(null); setBeachFilter(null); setPriceFilter(null); setActivityCat(null); }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek..."
                className="w-full pl-9 pr-8 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ---------- OVERZICHT ---------- */}
        {activeTab === 'overzicht' && (
          <>
            {/* Interactive Map */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Map size={22} className="text-primary" /> Interactieve Kaart
                </h2>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {showMap ? 'Verberg kaart' : 'Toon kaart'} <ChevronDown size={14} className={`transition-transform ${showMap ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showMap && <CostaBravaMap destinations={destinations} />}
            </div>

            {/* Region filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedRegion ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alle regio&apos;s
              </button>
              {regionOrder.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedRegion === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {regionIcons[r]} {r}
                </button>
              ))}
            </div>

            {/* Destination cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {filteredDestinations.map(dest => (
                <DestinationCard key={dest.id} dest={dest} />
              ))}
            </div>

            {filteredDestinations.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Geen bestemmingen gevonden voor &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {/* Quick highlights: top stranden & restaurants */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Umbrella size={18} className="text-primary" /> Top stranden
                </h3>
                <div className="space-y-3">
                  {allBeaches.filter(b => b.facilities && b.type === 'zand').slice(0, 5).map((b, i) => (
                    <div key={`${b.destSlug}-${b.name}`} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary/30">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.destination} · {b.vibe}</p>
                      </div>
                      <Link href={`/bestemmingen/${b.destSlug}`} className="text-primary">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-primary" /> Culinaire highlights
                </h3>
                <div className="space-y-3">
                  {allRestaurants.filter(r => r.price === '€€€' || r.price === '€€€€').slice(0, 5).map((r, i) => (
                    <div key={`${r.destSlug}-${r.name}`} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary/30">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.destination} · {r.price}</p>
                      </div>
                      <Link href={`/bestemmingen/${r.destSlug}`} className="text-primary">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------- STEDEN ---------- */}
        {activeTab === 'steden' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Steden & Dorpen aan de Costa Brava</h2>
              <p className="text-gray-500">Van middeleeuwse bergdorpjes tot bruisende kustplaatsen — ontdek alle {destinations.length} bestemmingen.</p>
            </div>

            {/* Region filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setSelectedRegion(null)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedRegion ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Alle regio&apos;s
              </button>
              {regionOrder.map(r => (
                <button key={r} onClick={() => setSelectedRegion(selectedRegion === r ? null : r)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedRegion === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {regionIcons[r]} {r}
                </button>
              ))}
            </div>

            {/* City list with more detail */}
            <div className="space-y-6">
              {filteredDestinations.map(dest => (
                <Link
                  key={dest.id}
                  href={`/bestemmingen/${dest.slug}`}
                  className="group grid md:grid-cols-[300px_1fr] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative h-48 md:h-auto overflow-hidden">
                    <Image src={dest.heroImage} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{dest.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={14} /> {dest.region}
                          {dest.population && <span>· {dest.population} inwoners</span>}
                        </div>
                      </div>
                      {dest.knownFor && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Sparkles size={11} /> {dest.knownFor}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{dest.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {dest.bestFor.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                          {bestForIcons[tag] || <Star size={10} />} {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Sun size={13} className="text-primary" /> {dest.weather.summer}</span>
                      <span className="flex items-center gap-1 hidden sm:flex"><Waves size={13} /> {dest.weather.water}</span>
                      <span className="flex items-center gap-1"><Umbrella size={13} /> {dest.beaches.length} stranden</span>
                      <span className="flex items-center gap-1 hidden sm:flex"><UtensilsCrossed size={13} /> {dest.restaurants.length} restaurants</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Meer info <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredDestinations.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Geen steden gevonden</p>
              </div>
            )}
          </>
        )}

        {/* ---------- STRANDEN ---------- */}
        {activeTab === 'stranden' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stranden van de Costa Brava</h2>
              <p className="text-gray-500">{allBeaches.length} stranden en baaien — van uitgestrekte zandstranden tot verborgen rotsbaaien.</p>
            </div>

            {/* Beach filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: null, label: 'Alle stranden' },
                { key: 'familiaal', label: '👨‍👩‍👧 Familiaal' },
                { key: 'rustig', label: '🧘 Rustig' },
                { key: 'levendig', label: '🎉 Levendig' },
                { key: 'wild', label: '🌿 Wild & ongerept' },
                { key: 'faciliteiten', label: '🏪 Met faciliteiten' },
              ].map(f => (
                <button
                  key={f.key ?? 'all'}
                  onClick={() => setBeachFilter(beachFilter === f.key ? null : f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    beachFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBeaches.map((b, i) => (
                <BeachCard key={`${b.destSlug}-${b.name}-${i}`} beach={b} />
              ))}
            </div>

            {filteredBeaches.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Geen stranden gevonden</p>
              </div>
            )}
          </>
        )}

        {/* ---------- RESTAURANTS ---------- */}
        {activeTab === 'restaurants' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurants aan de Costa Brava</h2>
              <p className="text-gray-500">{allRestaurants.length} restaurants — van strandtenten tot Michelinster-restaurants.</p>
            </div>

            {/* Price filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: null, label: 'Alle prijzen' },
                { key: '€', label: '€ Budget' },
                { key: '€€', label: '€€ Middensegment' },
                { key: '€€€', label: '€€€ Fine dining' },
                { key: '€€€€', label: '€€€€ Michelin' },
              ].map(f => (
                <button
                  key={f.key ?? 'all'}
                  onClick={() => setPriceFilter(priceFilter === f.key ? null : f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    priceFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map((r, i) => (
                <RestaurantCard key={`${r.destSlug}-${r.name}-${i}`} restaurant={r} />
              ))}
            </div>

            {filteredRestaurants.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Geen restaurants gevonden</p>
              </div>
            )}
          </>
        )}

        {/* ---------- ACTIVITEITEN ---------- */}
        {activeTab === 'activiteiten' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activiteiten aan de Costa Brava</h2>
              <p className="text-gray-500">{allActivities.length} tips voor uitjes, sport, cultuur en meer.</p>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: null, label: 'Alle categorieën' },
                { key: 'strand', label: '🏖️ Strand & Zee' },
                { key: 'cultuur', label: '🏛️ Cultuur' },
                { key: 'natuur', label: '🌲 Natuur' },
                { key: 'sport', label: '⛵ Sport' },
                { key: 'kinderen', label: '👧 Kinderen' },
                { key: 'culinair', label: '🍷 Culinair' },
              ].map(f => (
                <button
                  key={f.key ?? 'all'}
                  onClick={() => setActivityCat(activityCat === f.key ? null : f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activityCat === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((a, i) => (
                <ActivityCard key={`${a.location}-${a.id}-${i}`} activity={a} location={a.location} />
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">Geen activiteiten gevonden</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== CTA ===== */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cadaques_Pueblo_Marinero.JPG/1200px-Cadaques_Pueblo_Marinero.JPG"
            alt="Costa Brava"
            fill className="object-cover" unoptimized
          />
          <div className="absolute inset-0 bg-primary/85" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Klaar voor jouw Costa Brava avontuur?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Kies je droombestemming, wij zorgen dat je caravan klaarstaat. Boek vandaag nog en profiteer van vroegboekkorting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/boeken" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all shadow-lg">
              Boek nu <ArrowRight size={20} />
            </Link>
            <Link href="/caravans" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-4 rounded-full font-semibold hover:bg-white/25 transition-all">
              Bekijk caravans <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Scrollbar hide utility */}
      <style jsx global>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

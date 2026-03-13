'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { campings as staticCampings, type Camping } from '@/data/campings';
import { destinations } from '@/data/destinations';
import {
  MapPin, ArrowRight, Search, X, Tent, Globe, ChevronLeft, ChevronRight as ChevronRightIcon,
  Waves, Users, Heart, Sparkles, Umbrella, Wifi, ShoppingCart,
  Dumbbell, Landmark, UtensilsCrossed,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

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
            /* External URLs: use unoptimized to bypass Next.js image proxy */
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

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
/*  Horizontal scroll row helper                                       */
/* ------------------------------------------------------------------ */
function ScrollRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const check = () => {
    const el = ref.current; if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };
  useEffect(() => { check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check); }, []);
  const scroll = (dir: number) => { ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' }); setTimeout(check, 350); };

  return (
    <div className={`relative group/row ${className}`}>
      {canL && <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity -ml-3"><ChevronLeft size={18} /></button>}
      <div ref={ref} onScroll={check} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth -mx-1 px-1">
        {children}
      </div>
      {canR && <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity -mr-3"><ChevronRightIcon size={18} /></button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header helper                                              */
/* ------------------------------------------------------------------ */
function SectionHeader({ icon, title, subtitle, onAction, linkText }: { icon: React.ReactNode; title: string; subtitle: string; onAction?: () => void; linkText?: string }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-3">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">{icon} {title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {onAction && <button onClick={onAction} className="text-sm text-primary font-medium flex items-center gap-1 shrink-0">{linkText} <ArrowRight size={14} /></button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Curated attractions                                                */
/* ------------------------------------------------------------------ */
const attractionCards = [
  { name: 'Dalí Theatre-Museum', place: 'Figueres', slug: 'figueres', icon: '🎨', desc: 'Het meest bezochte museum van Spanje na het Prado — een must‑see voor elke bezoeker', img: '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg' },
  { name: 'Vila Vella', place: 'Tossa de Mar', slug: 'tossa-de-mar', icon: '🏰', desc: 'Sprookjesachtige ommuurde stad recht boven de azuurblauwe zee', img: '/images/destinations/tossa_de_mar_torre_n_jmm.jpg' },
  { name: 'Illes Medes', place: "L'Estartit", slug: 'estartit', icon: '🏝️', desc: 'Beschermd marien reservaat — het beste duik- en snorkelgebied van de westkust', img: '/images/campings/spain__catalonia__illes_medes__medes_islands_.jpg' },
  { name: 'Jardí Botànic Marimurtra', place: 'Blanes', slug: 'blanes', icon: '🌺', desc: 'Adembenemende botanische tuin hoog boven de kust met 4.000+ plantensoorten', img: '/images/campings/marimurtra_botanic_garden_blanes_costa_brava_catalonia_spain.jpg' },
  { name: 'Cap de Creus', place: 'Cadaqués', slug: 'cadaques', icon: '⛰️', desc: 'Het meest oostelijke punt van Spanje — ruig, windgebeeldhouwd en betoverend mooi', img: '/images/campings/cap_de_creus_landscape.jpg' },
  { name: 'Kasteel van Begur', place: 'Begur', slug: 'begur', icon: '🏯', desc: 'Beklim de kasteelruïne voor een onvergetelijk 360° panorama over de hele kust', img: '/images/campings/begurcastle.jpg' },
  { name: 'Jardí de Cap Roig', place: 'Calella', slug: 'calella-de-palafrugell', icon: '🎵', desc: 'Prachtige botanische tuin aan zee, in de zomer het decor van het beroemde muziekfestival', img: '/images/destinations/jardines_de_cap_roig-calella_de_palafurgell-8-2013__11_.jpg' },
  { name: 'Kanalen Empuriabrava', place: 'Empuriabrava', slug: 'empuriabrava', icon: '🚤', desc: 'Europa\'s grootste residentiële jachthaven — 24 km kanalen in \'het Venetië van Spanje\'', img: '/images/campings/canal_principal_de_empuriabrava.jpg' },
  { name: 'Middeleeuws Pals', place: 'Pals', slug: 'pals', icon: '🏘️', desc: 'Dwaal door het best bewaarde middeleeuwse dorp van Catalonië met uitzicht op de rijstvelden', img: '/images/campings/els_masos_de_pals.jpg' },
  { name: 'Santa Clotilde tuinen', place: 'Lloret de Mar', slug: 'lloret-de-mar', icon: '🌿', desc: 'Prachtige Italiaanse tuinen op de kliffen met spectaculair uitzicht over de Middellandse Zee', img: '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg' },
  { name: 'Casa-Museu Dalí', place: 'Portlligat', slug: 'cadaques', icon: '🖼️', desc: 'Stap binnen in het surrealistisch woonhuis en atelier van Salvador Dalí', img: '/images/campings/portlligat.jpg' },
  { name: 'Ciutadella de Roses', place: 'Roses', slug: 'roses', icon: '🏛️', desc: 'Indrukwekkende citadel met 3.000 jaar geschiedenis — van Grieken tot middeleeuwen', img: '/images/campings/ciutadella_de_roses-2022.jpg' },
  { name: 'Aiguamolls de l\'Empordà', place: 'Sant Pere Pescador', slug: 'sant-pere-pescador', icon: '🦩', desc: 'Beschermd natuurpark waar flamingo\'s, ooievaars en 300+ vogelsoorten thuis zijn', img: '/images/campings/animales-aiguamolls_l_emporda-2013.jpg' },
  { name: 'Sa Palomera', place: 'Blanes', slug: 'blanes', icon: '🪨', desc: 'Iconische rotsformatie die het officiële beginpunt van de Costa Brava markeert', img: '/images/campings/sa_palomera_a_blanes.jpg' },
  { name: 'Cala Aiguablava', place: 'Begur', slug: 'begur', icon: '💎', desc: 'Turkooisblauw water omringd door dennenbossen — een van de mooiste baaien van Spanje', img: '/images/campings/cala_d_aiguablava__begur.jpg' },
];

/* ------------------------------------------------------------------ */
/*  Collect all beaches from destinations                              */
/* ------------------------------------------------------------------ */
const allBeaches = destinations.flatMap(d =>
  d.beaches.map(b => ({ ...b, destination: d.name, destSlug: d.slug, destImage: d.heroImage }))
);
const featuredBeaches = allBeaches.filter(b => b.facilities && b.vibe !== 'wild').slice(0, 10);

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function BestemmingenPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'campings' | 'plaatsen' | 'bezienswaardigheden'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [allCampings, setAllCampings] = useState<Camping[]>(staticCampings);

  // Fetch campings from API — only active campings are returned
  // DB campings replace static entirely so active/inactive is respected
  useEffect(() => {
    fetch('/api/campings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.campings?.length) {
          // API now returns Camping interface format (camelCase) — use directly
          setAllCampings(data.campings as Camping[]);
        }
      })
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  // Handle hash for direct linking + hashchange
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'campings') setActiveTab('campings');
      else if (hash === 'plaatsen') setActiveTab('plaatsen');
      else if (hash === 'bezienswaardigheden') setActiveTab('bezienswaardigheden');
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

  // Filter destinations
  const filteredDests = useMemo(() => {
    if (!search.trim()) return destinations;
    const q = search.toLowerCase();
    return destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) || d.highlights.some(h => h.toLowerCase().includes(q))
    );
  }, [search]);

  const totalCampings = allCampings.length;
  const tabs = [
    { key: 'all' as const, label: 'Alles', icon: <Globe size={16} /> },
    { key: 'campings' as const, label: `Campings (${totalCampings})`, icon: <Tent size={16} /> },
    { key: 'plaatsen' as const, label: `Plaatsen (${destinations.length})`, icon: <MapPin size={16} /> },
    { key: 'bezienswaardigheden' as const, label: 'Bezienswaardigheden', icon: <Landmark size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/campings/els_masos_de_pals.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-8 sm:pt-20 sm:pb-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-xs mb-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">{t('nav.destinations')}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            {t('destinations.heroTitle')}
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mb-6">
            {t('destinations.heroSubtitle')}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-5 mb-8">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><Tent size={18} /></div>
              <div><p className="text-xl font-bold">{totalCampings}</p><p className="text-[11px] text-white/60">Campings</p></div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><MapPin size={18} /></div>
              <div><p className="text-xl font-bold">{destinations.length}</p><p className="text-[11px] text-white/60">Plaatsen</p></div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><Umbrella size={18} /></div>
              <div><p className="text-xl font-bold">{allBeaches.length}</p><p className="text-[11px] text-white/60">Stranden</p></div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center"><Landmark size={18} /></div>
              <div><p className="text-xl font-bold">{attractionCards.length}</p><p className="text-[11px] text-white/60">Bezienswaardigheden</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab bar + search (sticky) */}
      <section className="sticky top-[88px] sm:top-[136px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search — full width on mobile, inline on desktop */}
          <div className="pt-3 pb-2 lg:hidden">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('destinations.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
            </div>
          </div>
          <div className="flex items-center gap-2 py-2 lg:py-3 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key !== 'campings') setSelectedRegion(null); }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-[13px] sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            {/* Search — inline on desktop only */}
            <div className="relative flex-1 min-w-[200px] ml-auto hidden lg:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('destinations.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 rounded-full text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TAB: ALL — Booking.com style mixed rows ===== */}
      {activeTab === 'all' && !search && (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">
          {/* Row 1: Popular Destinations */}
          <section>
            <SectionHeader
              icon={<MapPin size={22} className="text-primary" />}
              title="Populaire kustplaatsen"
              subtitle="Van pittoreske vissersdorpjes tot levendige badplaatsen — vind jouw favoriete plek"
              onAction={() => setActiveTab('plaatsen')} linkText="Alle plaatsen"
            />
            <ScrollRow>
              {destinations.map(d => (
                <Link key={d.slug} href={`/bestemmingen/${d.slug}`} className="group shrink-0 w-[260px] sm:w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="280px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-base font-bold text-white">{d.name}</h3>
                      <p className="text-xs text-white/70 flex items-center gap-1"><MapPin size={10} /> {d.region}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{d.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Umbrella size={10} className="text-primary/50" /> {d.beaches.length} stranden</span>
                      <span className="flex items-center gap-0.5"><UtensilsCrossed size={10} className="text-primary/50" /> {d.restaurants.length} restaurants</span>
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollRow>
          </section>

          {/* Row 2: Top Campings */}
          <section id="campings">
            <SectionHeader
              icon={<Tent size={22} className="text-primary" />}
              title="Topcampings met caravan"
              subtitle={`Kies uit ${totalCampings} campings — van familieresorts met zwembad tot rustige parken aan het strand`}
              onAction={() => setActiveTab('campings')} linkText="Alle campings"
            />
            <ScrollRow>
              {allCampings.slice(0, 12).map(c => (
                <Link key={c.id} href={`/bestemmingen/${c.slug}`} className="group shrink-0 w-[260px] sm:w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-primary-50">
                    <Image src={c.photos?.[0] || '/og-image.jpg'} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="280px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-base font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-white/70 flex items-center gap-1"><MapPin size={10} /> {c.location}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{c.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.facilities?.slice(0, 3).map(f => (
                        <span key={f} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-50 rounded-full text-[10px] text-gray-500 border border-gray-100">
                          {facilityIcons[f] || <Tent size={10} />} {f}
                        </span>
                      ))}
                      {(c.facilities?.length || 0) > 3 && <span className="px-1.5 py-0.5 bg-gray-50 rounded-full text-[10px] text-gray-400 border border-gray-100">+{(c.facilities?.length || 0) - 3}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollRow>
          </section>

          {/* Row 3: Bezienswaardigheden */}
          <section>
            <SectionHeader
              icon={<Landmark size={22} className="text-primary" />}
              title="Niet missen"
              subtitle="De mooiste musea, natuurparken en historische plekken op loopafstand van je camping"
            />
            <ScrollRow>
              {attractionCards.map(a => (
                <Link key={a.slug} href={`/bestemmingen/${a.slug}`} className="group shrink-0 w-[240px] sm:w-[260px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={a.img} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="260px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-bold text-white">{a.name}</h3>
                      <p className="text-[11px] text-white/70">{a.place}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </ScrollRow>
          </section>

          {/* Row 4: Stranden */}
          <section>
            <SectionHeader
              icon={<Umbrella size={22} className="text-primary" />}
              title="Mooiste stranden & baaien"
              subtitle={`${allBeaches.length} stranden langs 200 km kust — van brede zandstranden tot verborgen calas`}
            />
            <ScrollRow>
              {featuredBeaches.map((b, i) => (
                <Link key={`${b.destSlug}-${i}`} href={`/bestemmingen/${b.destSlug}`} className="group shrink-0 w-[220px] sm:w-[240px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={b.destImage} alt={b.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="240px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-bold text-white">{b.name}</h3>
                      <p className="text-[11px] text-white/70">{b.destination}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.type === 'zand' ? 'bg-primary/5 text-primary' : b.type === 'kiezel' ? 'bg-gray-100 text-gray-600' : 'bg-primary/5 text-primary/70'}`}>
                        {b.type === 'zand' ? '🏖️ Zand' : b.type === 'kiezel' ? '🪨 Kiezel' : b.type === 'rotsen' ? '🪨 Rotsen' : '🏖️ Mix'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.vibe === 'familiaal' ? 'bg-accent/10 text-accent-dark' : b.vibe === 'levendig' ? 'bg-primary/5 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                        {b.vibe === 'familiaal' ? '👨‍👩‍👧 Familiaal' : b.vibe === 'levendig' ? '🎉 Levendig' : b.vibe === 'rustig' ? '🧘 Rustig' : '🌊 Wild'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{b.description}</p>
                  </div>
                </Link>
              ))}
            </ScrollRow>
          </section>
        </div>
      )}

      {/* ===== TAB: CAMPINGS ===== */}
      {(activeTab === 'campings' || (activeTab === 'all' && search)) && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'campings' && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setSelectedRegion(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedRegion ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Alle regio&apos;s ({totalCampings})
              </button>
              {regionOrder.map(r => (
                <button key={r} onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedRegion === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {r} ({allCampings.filter(c => c.region === r).length})
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">{filteredCampings.length} campings gevonden — boek een caravan op de camping van je keuze</p>

          {filteredCampings.length === 0 ? (
            <div className="text-center py-16">
              <Tent size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Geen campings gevonden</p>
              <button onClick={() => { setSearch(''); setSelectedRegion(null); }} className="mt-3 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium">Filters wissen</button>
            </div>
          ) : !search && !selectedRegion && activeTab === 'campings' ? (
            regionOrder.map(region => {
              const rc = allCampings.filter(c => c.region === region);
              return (
                <div key={region} className="mb-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{region} <span className="text-sm font-normal text-gray-400">— {rc.length} campings</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rc.map(c => <CampingCard key={c.id} camping={c} t={t} />)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampings.map(c => <CampingCard key={c.id} camping={c} t={t} />)}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: PLAATSEN ===== */}
      {activeTab === 'plaatsen' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-gray-500 mb-6">{filteredDests.length} prachtige kustplaatsen aan de Costa Brava om te ontdekken tijdens je caravanvakantie</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDests.map(d => (
              <Link key={d.slug} href={`/bestemmingen/${d.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 bg-primary/80 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full">{d.region}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-0.5">{d.name}</h3>
                    {d.knownFor && <p className="text-xs text-white/70">{d.knownFor}</p>}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{d.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Umbrella size={12} className="text-primary/50" /> {d.beaches.length} stranden</span>
                    <span className="flex items-center gap-1"><UtensilsCrossed size={12} className="text-primary/50" /> {d.restaurants.length} restaurants</span>
                    {d.population && <span className="flex items-center gap-1"><Users size={12} className="text-gray-400" /> {d.population}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB: BEZIENSWAARDIGHEDEN ===== */}
      {activeTab === 'bezienswaardigheden' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-gray-500 mb-6">Ontdek de mooiste bezienswaardigheden tijdens je vakantie aan de Costa Brava</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {attractionCards.map(a => (
              <Link key={a.slug} href={`/bestemmingen/${a.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={a.img} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white">{a.name}</h3>
                    <p className="text-xs text-white/70 flex items-center gap-1"><MapPin size={10} /> {a.place}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}

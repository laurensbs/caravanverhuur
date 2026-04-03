'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Users, Filter, X, Search, Euro, ArrowUpDown, Check, SlidersHorizontal, ChevronDown, Tent, CheckCircle, XCircle } from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'persons-desc';

export default function CaravansPage() {
  const { t } = useLanguage();
  const [personFilter, setPersonFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('ALL');
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/caravans?all=true')
      .then(res => res.json())
      .then(data => {
        setCustomCaravans(data.caravans || []);
        setUnavailableIds(data.unavailableIds || []);
      })
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  const caravans: Caravan[] = useMemo(() => {
    if (customCaravans.length > 0) return customCaravans;
    return staticCaravans;
  }, [customCaravans]);

  // Get unique amenities and manufacturers from all caravans
  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    caravans.forEach(c => c.amenities.forEach(a => set.add(a)));
    return Array.from(set).sort();
  }, [caravans]);

  const allManufacturers = useMemo(() => {
    const set = new Set<string>();
    caravans.forEach(c => set.add(c.manufacturer));
    return Array.from(set).sort();
  }, [caravans]);

  const filtered = useMemo(() => {
    let result = caravans.filter(c => {
      if (personFilter > 0 && c.maxPersons < personFilter) return false;
      if (maxPrice > 0 && c.pricePerWeek > maxPrice) return false;
      if (manufacturerFilter !== 'ALL' && c.manufacturer !== manufacturerFilter) return false;
      if (amenityFilters.length > 0 && !amenityFilters.every(a => c.amenities.includes(a))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.manufacturer.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.pricePerWeek - b.pricePerWeek); break;
      case 'price-desc': result.sort((a, b) => b.pricePerWeek - a.pricePerWeek); break;
      case 'persons-desc': result.sort((a, b) => b.maxPersons - a.maxPersons); break;
    }
    return result;
  }, [personFilter, searchQuery, maxPrice, sortBy, manufacturerFilter, amenityFilters, caravans]);

  const activeFilterCount = (personFilter > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (manufacturerFilter !== 'ALL' ? 1 : 0) + amenityFilters.length;

  const toggleAmenity = (amenity: string) => {
    setAmenityFilters(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setPersonFilter(0);
    setMaxPrice(0);
    setSearchQuery('');
    setSortBy('default');
    setManufacturerFilter('ALL');
    setAmenityFilters([]);
  };

  /* ---- Sidebar filter content (shared between desktop & mobile) ---- */
  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.searchPlaceholderShort')}</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('caravans.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 outline-none bg-surface border border-border"
          />
        </div>
      </div>

      {/* Persons */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.filterPersons')}</label>
        <div className="flex flex-wrap gap-2">
          {[0, 2, 4, 5].map(num => (
            <button
              key={num}
              onClick={() => setPersonFilter(num)}
              aria-pressed={personFilter === num}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                personFilter === num ? 'bg-foreground text-white' : 'bg-surface text-foreground-light hover:bg-surface-alt border border-border'
              }`}
            >
              {num === 0 ? t('caravans.filterAll') : `${num}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.filterMaxPrice')}</label>
        <select
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 outline-none bg-surface border border-border"
        >
          <option value={0}>{t('caravans.filterNoLimit')}</option>
          <option value={350}>{'\u2264 \u20AC350/week'}</option>
          <option value={400}>{'\u2264 \u20AC400/week'}</option>
          <option value={500}>{'\u2264 \u20AC500/week'}</option>
          <option value={600}>{'\u2264 \u20AC600/week'}</option>
          <option value={700}>{'\u2264 \u20AC700/week'}</option>
        </select>
      </div>

      {/* Manufacturer */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.filterManufacturer')}</label>
        <select
          value={manufacturerFilter}
          onChange={e => setManufacturerFilter(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 outline-none bg-surface border border-border"
        >
          <option value="ALL">{t('caravans.filterAll')}</option>
          {allManufacturers.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.filterAmenities')}</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {allAmenities.map(amenity => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                amenityFilters.includes(amenity)
                  ? 'bg-foreground/10 text-foreground font-medium'
                  : 'text-foreground-light hover:bg-surface'
              }`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                amenityFilters.includes(amenity) ? 'bg-foreground text-white' : 'border border-border'
              }`}>
                {amenityFilters.includes(amenity) && <Check size={10} />}
              </span>
              <span className="truncate">{amenity}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">{t('caravans.filterSort')}</label>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-foreground/10 outline-none bg-surface border border-border"
        >
          <option value="default">{t('caravans.sortDefault')}</option>
          <option value="price-asc">{t('caravans.sortPriceAsc')}</option>
          <option value="price-desc">{t('caravans.sortPriceDesc2')}</option>
          <option value="persons-desc">{t('caravans.sortPersonsDesc')}</option>
        </select>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-alt rounded-xl text-sm font-medium text-foreground-light transition-colors"
        >
          <X size={14} /> {t('caravans.resetAll')}
        </button>
      )}
    </div>
  );

  return (
    <>
      <section className="pt-8 sm:pt-10 pb-8 sm:pb-12 bg-background min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight mb-3">{t('caravans.heroTitle')}</h1>
          <div className="flex items-start gap-3 mb-4 text-xs sm:text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span className="leading-relaxed">{t('termsPage.caravanDisclaimer')}</span>
          </div>
          <div className="flex items-center gap-2 mb-6 text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Tent size={14} className="shrink-0" />
            <span>{t('caravans.campingFirstNote')}</span>
          </div>
          {/* Mobile: filter toggle + sort bar */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border border-border shadow-sm"
            >
              <SlidersHorizontal size={16} />
              <span>{t('caravans.filtersLabel')}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-foreground text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <div className="flex-1" />
            <span className="text-sm text-muted">
              <span className="font-semibold text-foreground">{filtered.length}</span> {t('caravans.results')}
            </span>
          </div>

          {/* Mobile filter panel */}
          {showMobileFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-2xl p-5 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">{t('caravans.filtersLabel')}</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-surface rounded-lg">
                  <X size={18} className="text-muted" />
                </button>
              </div>
              {filterContent}
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-[90px] bg-white rounded-2xl p-5 shadow-sm border border-border max-h-[calc(100vh-110px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-foreground" />
                    {t('caravans.filtersLabel')}
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="text-xs bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-semibold">{activeFilterCount}</span>
                  )}
                </div>
                {filterContent}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="hidden lg:flex items-center justify-between mb-5">
                <p className="text-sm text-muted">
                  <span className="font-semibold text-foreground">{filtered.length}</span> caravan{filtered.length !== 1 ? 's' : ''} {t('caravans.resultsFound')}
                </p>

              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-muted mb-4">{t('caravans.noResults')}</p>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-white rounded-lg font-medium transition-colors"
                  >
                    <X size={16} /> {t('caravans.resetFilters')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {filtered.map((caravan) => (
                    <div
                      key={caravan.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
                    >
                      <div className="relative h-48 sm:h-52 overflow-hidden">
                        {(() => {
                          const gm = caravan.videoUrl?.match(/gumlet\.tv\/watch\/([\w-]+)/);
                          if (gm) return (
                            <>
                              <iframe
                              src={`https://play.gumlet.io/embed/${gm[1]}?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p`}
                                title={caravan.name}
                                allow="autoplay"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full border-0"
                                style={{ pointerEvents: 'none' }}
                              />
                              <div className="absolute inset-0 z-10" />
                            </>
                          );
                          return (
                            <Image
                              src={caravan.photos[0]}
                              alt={`${caravan.name} — voor ${caravan.maxPersons} personen`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          );
                        })()}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          {unavailableIds.includes(caravan.id) ? (
                            <span className="flex items-center gap-1 bg-red-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm">
                              <XCircle size={12} /> {t('caravans.unavailable')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-green-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm">
                              <CheckCircle size={12} /> {t('caravans.available')}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                          <span className="text-sm font-bold text-foreground">{t('caravans.fromPerWeek', { price: '550' })}</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted mb-2">
                          <span className="flex items-center gap-1">
                            <Users size={14} /> Max {caravan.maxPersons} {t('caravans.persShort')}
                          </span>
                          <span>{caravan.manufacturer}</span>
                        </div>
                        <p className="text-sm text-foreground-light mb-3 line-clamp-2 min-h-[2.5rem]">{caravan.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {caravan.amenities.slice(0, 3).map(a => (
                            <span key={a} className="text-xs px-2 py-1 bg-surface rounded-md text-muted">{a}</span>
                          ))}
                          {caravan.amenities.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 3}</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-auto">
                          <Link
                            href={`/caravans/${caravan.id}`}
                            className="flex-1 text-center py-2.5 border border-border text-foreground font-semibold rounded-xl hover:bg-surface transition-colors text-sm"
                          >
                            {t('caravans.details')}
                          </Link>
                          <Link
                            href={`/boeken?caravan=${caravan.id}`}
                            className="flex-1 text-center py-2.5 bg-foreground text-white font-semibold rounded-xl hover:bg-foreground/90 transition-all text-sm"
                          >
                            {t('caravans.bookNow')}
                          </Link>
                        </div>
                        <p className="text-xs text-muted text-center mt-2">{t('caravans.orSimilar')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

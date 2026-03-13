'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Users, Filter, X, Search, Euro, ArrowUpDown, Check, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { caravans as staticCaravans, CaravanType } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'persons-desc';

export default function CaravansPage() {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<CaravanType | 'ALL'>('ALL');
  const [personFilter, setPersonFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  const caravans: Caravan[] = useMemo(() => [...staticCaravans, ...customCaravans], [customCaravans]);

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
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
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
  }, [typeFilter, personFilter, searchQuery, maxPrice, sortBy, manufacturerFilter, amenityFilters, caravans]);

  const activeFilterCount = (typeFilter !== 'ALL' ? 1 : 0) + (personFilter > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0) + (searchQuery.trim() ? 1 : 0) + (manufacturerFilter !== 'ALL' ? 1 : 0) + amenityFilters.length;

  const toggleAmenity = (amenity: string) => {
    setAmenityFilters(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setTypeFilter('ALL');
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
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.searchPlaceholderShort')}</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('caravans.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50 border border-gray-200"
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterType')}</label>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'FAMILIE', 'COMPACT'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              aria-pressed={typeFilter === type}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === type ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {type === 'ALL' ? t('caravans.filterAll') : type === 'FAMILIE' ? t('caravans.filterFamily') : t('caravans.filterCompact')}
            </button>
          ))}
        </div>
      </div>

      {/* Persons */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterPersons')}</label>
        <div className="flex flex-wrap gap-2">
          {[0, 2, 4, 5].map(num => (
            <button
              key={num}
              onClick={() => setPersonFilter(num)}
              aria-pressed={personFilter === num}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                personFilter === num ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {num === 0 ? t('caravans.filterAll') : `${num}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterMaxPrice')}</label>
        <select
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50 border border-gray-200"
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
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterManufacturer')}</label>
        <select
          value={manufacturerFilter}
          onChange={e => setManufacturerFilter(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50 border border-gray-200"
        >
          <option value="ALL">{t('caravans.filterAll')}</option>
          {allManufacturers.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterAmenities')}</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {allAmenities.map(amenity => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                amenityFilters.includes(amenity)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                amenityFilters.includes(amenity) ? 'bg-primary text-white' : 'border border-gray-300'
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
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{t('caravans.filterSort')}</label>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50 border border-gray-200"
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors"
        >
          <X size={14} /> {t('caravans.resetAll')}
        </button>
      )}
    </div>
  );

  return (
    <>
      <section className="pt-8 sm:pt-10 pb-8 sm:pb-12 bg-gray-50 min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">{t('caravans.heroTitle')}</h1>
          {/* Mobile: filter toggle + sort bar */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border border-gray-200 shadow-sm"
            >
              <SlidersHorizontal size={16} />
              <span>{t('caravans.filtersLabel')}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <div className="flex-1" />
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{filtered.length}</span> {t('caravans.results')}
            </span>
          </div>

          {/* Mobile filter panel */}
          {showMobileFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{t('caravans.filtersLabel')}</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              {filterContent}
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-[90px] bg-white rounded-2xl p-5 shadow-sm border border-gray-100 max-h-[calc(100vh-110px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-primary" />
                    {t('caravans.filtersLabel')}
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{activeFilterCount}</span>
                  )}
                </div>
                {filterContent}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="hidden lg:flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filtered.length}</span> caravan{filtered.length !== 1 ? 's' : ''} {t('caravans.resultsFound')}
                </p>

              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-400 mb-4">{t('caravans.noResults')}</p>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium transition-colors"
                  >
                    <X size={16} /> {t('caravans.resetFilters')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {filtered.map((caravan) => (
                    <div
                      key={caravan.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="relative h-48 sm:h-52 overflow-hidden">
                        <Image
                          src={caravan.photos[0]}
                          alt={`${caravan.name} — ${caravan.type} voor ${caravan.maxPersons} personen`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                         
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-primary">
                            {caravan.type}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}/week</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{caravan.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Users size={14} /> Max {caravan.maxPersons} {t('caravans.persShort')}
                          </span>
                          <span>{caravan.manufacturer} &bull; {caravan.year}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{caravan.description}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {caravan.amenities.slice(0, 4).map(a => (
                            <span key={a} className="text-xs px-2 py-1 bg-gray-50 rounded-md text-gray-500">{a}</span>
                          ))}
                          {caravan.amenities.length > 4 && (
                            <span className="text-xs px-2 py-1 bg-gray-50 rounded-md text-gray-500">+{caravan.amenities.length - 4}</span>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href={`/caravans/${caravan.id}`}
                            className="flex-1 text-center py-2.5 border border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-sm"
                          >
                            {t('caravans.details')}
                          </Link>
                          <Link
                            href={`/boeken?caravan=${caravan.id}`}
                            className="flex-1 text-center py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-md"
                          >
                            {t('caravans.bookNow')}
                          </Link>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">{t('caravans.orSimilar')}</p>
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

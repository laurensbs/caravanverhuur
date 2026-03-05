'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Users, Filter, X, Search, Euro, ArrowUpDown } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);

  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch(() => {});
  }, []);

  const caravans: Caravan[] = useMemo(() => [...staticCaravans, ...customCaravans], [customCaravans]);

  const filtered = useMemo(() => {
    let result = caravans.filter(c => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (personFilter > 0 && c.maxPersons < personFilter) return false;
      if (maxPrice > 0 && c.pricePerWeek > maxPrice) return false;
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
  }, [typeFilter, personFilter, searchQuery, maxPrice, sortBy, caravans]);

  const activeFilterCount = (typeFilter !== 'ALL' ? 1 : 0) + (personFilter > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const resetFilters = () => {
    setTypeFilter('ALL');
    setPersonFilter(0);
    setMaxPrice(0);
    setSearchQuery('');
    setSortBy('default');
  };

  return (
    <>
      {/* Sticky Filter Bar */}
      <section className="bg-white sticky top-[72px] z-40 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Desktop filters */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('caravans.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('caravans.filterType')}</span>
              {(['ALL', 'FAMILIE', 'COMPACT'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    typeFilter === type ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'ALL' ? t('caravans.filterAll') : type === 'FAMILIE' ? t('caravans.filterFamily') : t('caravans.filterCompact')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              {[0, 2, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setPersonFilter(num)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    personFilter === num ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num === 0 ? t('caravans.filterAll') : `${num}+`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Euro size={14} className="text-gray-400" />
              <select
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50"
              >
                <option value={0}>{t('caravans.filterMaxPrice')}</option>
                <option value={400}>{'\u2264 \u20AC400/week'}</option>
                <option value={500}>{'\u2264 \u20AC500/week'}</option>
                <option value={600}>{'\u2264 \u20AC600/week'}</option>
                <option value={700}>{'\u2264 \u20AC700/week'}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50"
              >
                <option value="default">{t('caravans.sortDefault')}</option>
                <option value="price-asc">{t('caravans.sortPriceAsc')}</option>
                <option value="price-desc">{t('caravans.sortPriceDesc2')}</option>
                <option value="persons-desc">{t('caravans.sortPersonsDesc')}</option>
              </select>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <X size={12} /> Reset
                </button>
              )}
              <span className="text-xs text-gray-400">{filtered.length} caravan{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Mobile / Tablet */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('caravans.searchPlaceholderShort')}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-gray-50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} {t('caravans.results')}</span>
          </div>

          {/* Expanded mobile filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pb-2 space-y-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t('caravans.filterType')}</span>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'FAMILIE', 'COMPACT'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        typeFilter === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type === 'ALL' ? t('caravans.filterAll') : type === 'FAMILIE' ? t('caravans.filterFamily') : t('caravans.filterCompact')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t('caravans.filterPersons')}</span>
                <div className="flex flex-wrap gap-2">
                  {[0, 2, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setPersonFilter(num)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        personFilter === num ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {num === 0 ? t('caravans.filterAll') : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t('caravans.filterMaxPrice')}</span>
                  <select
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white border border-gray-200"
                  >
                    <option value={0}>{t('caravans.filterNoLimit')}</option>
                    <option value={400}>{'\u2264 \u20AC400/week'}</option>
                    <option value={500}>{'\u2264 \u20AC500/week'}</option>
                    <option value={600}>{'\u2264 \u20AC600/week'}</option>
                    <option value={700}>{'\u2264 \u20AC700/week'}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">{t('caravans.filterSort')}</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white border border-gray-200"
                  >
                    <option value="default">{t('caravans.sortDefault')}</option>
                    <option value="price-asc">{t('caravans.sortPriceAsc')}</option>
                    <option value="price-desc">{t('caravans.sortPriceDesc2')}</option>
                    <option value="persons-desc">{t('caravans.sortPersonsDesc')}</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-sm text-primary flex items-center gap-1">
                  <X size={14} /> {t('caravans.resetAll')}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Caravan Grid */}
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{filtered.length}</span> caravan{filtered.length !== 1 ? 's' : ''} {t('caravans.resultsFound')}
            </p>
            {filtered.length > 0 && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {t('caravans.seasonAvailable')}
              </p>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((caravan) => (
                <div
                  key={caravan.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={caravan.photos[0]}
                      alt={caravan.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary">
                        {caravan.type}
                      </span>
                      {caravan.status === 'BESCHIKBAAR' && (
                        <span className="px-2.5 py-0.5 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          {t('caravans.available')}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}/week</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{caravan.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> Max {caravan.maxPersons} {t('caravans.persShort')}
                      </span>
                      <span>{caravan.manufacturer} &bull; {caravan.year}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{caravan.description}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

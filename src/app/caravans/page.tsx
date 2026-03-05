'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, X, Search, Euro, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { caravans as staticCaravans, CaravanType } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' as const },
  }),
};

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

  const priceRange = useMemo(() => {
    const prices = caravans.map(c => c.pricePerWeek);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, []);

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
  }, [typeFilter, personFilter, searchQuery, maxPrice, sortBy]);

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
      {/* Hero with Costa Brava image */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Bucht_von_Roses%2C_Spanien.jpg/1280px-Bucht_von_Roses%2C_Spanien.jpg"
          alt="Costa Brava kustlijn"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg"
            >
              {t('caravans.heroTitle')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow"
            >
              {t('caravans.heroSubtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-[120px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Desktop filters */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('caravans.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" /> </div> {/* Type filter */} <div className="flex items-center gap-2"> <span className="text-xs font-medium text-muted uppercase tracking-wide">{t('caravans.filterType')}</span>
              {(['ALL', 'FAMILIE', 'COMPACT'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    typeFilter === type
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground'
                  }`} > {type === 'ALL' ? t('caravans.filterAll') : type === 'FAMILIE' ? t('caravans.filterFamily') : t('caravans.filterCompact')} </button> ))} </div> {/* Persons filter */} <div className="flex items-center gap-2"> <Users size={14} className="text-muted" /> {[0, 2, 4, 5].map(num => ( <button key={num} onClick={() => setPersonFilter(num)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${ personFilter === num ?'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground'
                  }`}
                >
                  {num === 0 ? t('caravans.filterAll') : `${num}+`} </button> ))} </div> {/* Price filter */} <div className="flex items-center gap-2"> <Euro size={14} className="text-muted" /> <select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-white" > <option value={0}>{t('caravans.filterMaxPrice')}</option> <option value={400}>&le; &euro;400/week</option> <option value={500}>&le; &euro;500/week</option> <option value={600}>&le; &euro;600/week</option> <option value={700}>&le; &euro;700/week</option> </select> </div> {/* Sort */} <div className="flex items-center gap-2"> <ArrowUpDown size={14} className="text-muted" /> <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="px-3 py-1.5 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none bg-white" > <option value="default">{t('caravans.sortDefault')}</option> <option value="price-asc">{t('caravans.sortPriceAsc')}</option> <option value="price-desc">{t('caravans.sortPriceDesc2')}</option> <option value="persons-desc">{t('caravans.sortPersonsDesc')}</option> </select> </div> {/* Result count + reset */} <div className="ml-auto flex items-center gap-3"> {activeFilterCount > 0 && ( <button onClick={resetFilters} className="text-xs text-primary flex items-center gap-1"> <X size={12} /> Reset </button> )} <span className="text-xs text-muted">{filtered.length} caravan{filtered.length !== 1 ? 's' : ''}</span> </div> </div> {/* Tablet filters */} <div className="hidden md:flex lg:hidden items-center gap-3"> <div className="relative flex-1"> <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('caravans.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" /> </div> <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg text-sm font-medium" > <SlidersHorizontal size={16} /> {t('caravans.filterFilters')} {activeFilterCount > 0 && ( <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span> )} </button> <span className="text-xs text-muted whitespace-nowrap">{filtered.length} {t('caravans.results')}</span> </div> {/* Mobile filter button */} <div className="flex md:hidden items-center justify-between gap-3"> <div className="relative flex-1"> <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /> <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('caravans.searchPlaceholderShort')} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" /> </div> <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg text-sm font-medium" > <Filter size={16} /> {activeFilterCount > 0 && ( <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span> )} </button> </div> {/* Expanded filters (mobile + tablet) */} {showFilters && ( <div className="lg:hidden mt-4 pb-2 space-y-4 pt-4"> <div> <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">{t('caravans.filterType')}</span> <div className="flex flex-wrap gap-2"> {(['ALL', 'FAMILIE', 'COMPACT'] as const).map(type => ( <button key={type} onClick={() => setTypeFilter(type)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        typeFilter === type
                          ? 'bg-primary text-white'
                          : 'bg-surface text-foreground'
                      }`}
                    >
                      {type === 'ALL' ? t('caravans.filterAll') : type === 'FAMILIE' ? t('caravans.filterFamily') : t('caravans.filterCompact')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">{t('caravans.filterPersons')}</span>
                <div className="flex flex-wrap gap-2">
                  {[0, 2, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setPersonFilter(num)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        personFilter === num ? 'bg-primary text-white' : 'bg-surface text-foreground'
                      }`}
                    >
                      {num === 0 ? t('caravans.filterAll') : `${num}+`} </button> ))} </div> </div> <div className="flex gap-3"> <div className="flex-1"> <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">{t('caravans.filterMaxPrice')}</span> <select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white" > <option value={0}>{t('caravans.filterNoLimit')}</option> <option value={400}>&le; &euro;400/week</option> <option value={500}>&le; &euro;500/week</option> <option value={600}>&le; &euro;600/week</option> <option value={700}>&le; &euro;700/week</option> </select> </div> <div className="flex-1"> <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">{t('caravans.filterSort')}</span> <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white" > <option value="default">{t('caravans.sortDefault')}</option> <option value="price-asc">{t('caravans.sortPriceAsc')}</option> <option value="price-desc">{t('caravans.sortPriceDesc2')}</option> <option value="persons-desc">{t('caravans.sortPersonsDesc')}</option> </select> </div> </div> {activeFilterCount > 0 && ( <button onClick={resetFilters} className="text-sm text-primary flex items-center gap-1"> <X size={14} /> {t('caravans.resetAll')} </button> )} </div> )} </div> </section> {/* Grid */} <section className="py-12 bg-surface-alt min-h-[60vh]"> <div className="max-w-7xl mx-auto px-4"> {/* Results header */} <div className="flex items-center justify-between mb-6"> <p className="text-sm text-muted"> <span className="font-semibold text-foreground">{filtered.length}</span> caravan{filtered.length !== 1 ? 's' : ''} {t('caravans.resultsFound')} </p> {filtered.length > 0 && ( <p className="text-xs text-primary font-medium flex items-center gap-1"> <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> {t('caravans.seasonAvailable')} </p> )} </div> {filtered.length === 0 ? ( <div className="text-center py-20"> <p className="text-xl text-muted mb-4">{t('caravans.noResults')}</p> <button onClick={resetFilters} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium transition-colors" > <X size={16} /> {t('caravans.resetFilters')} </button> </div> ) : ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {filtered.map((caravan, i) => ( <motion.div key={caravan.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group" > <div className="relative h-56 overflow-hidden"> <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover transition-transform duration-500" unoptimized /> <div className="absolute top-4 left-4 flex flex-col gap-2 items-start"> <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary'
                      }`}>
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
                    <h3 className="text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted mb-3">
                      <span className="flex items-center gap-1"><Users size={14} /> Max {caravan.maxPersons} {t('caravans.persShort')}</span> <span>{caravan.manufacturer} &bull; {caravan.year}</span> </div> <p className="text-sm text-muted mb-4 line-clamp-2">{caravan.description}</p> <div className="flex flex-wrap gap-1 mb-4"> {caravan.amenities.slice(0, 4).map(a => ( <span key={a} className="text-xs px-2 py-1 bg-surface rounded-md text-muted">{a}</span> ))} {caravan.amenities.length > 4 && ( <span className="text-xs px-2 py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 4}</span> )} </div> <div className="flex gap-3"> <Link href={`/caravans/${caravan.id}`} className="flex-1 text-center py-2.5 border-primary text-primary font-semibold rounded-xl transition-colors text-sm" > {t('caravans.details')} </Link> <Link href={`/boeken?caravan=${caravan.id}`}
                        className="flex-1 text-center py-2.5 bg-primary text-white font-semibold rounded-xl transition-all text-sm shadow-md"
                      >
                        {t('caravans.bookNow')}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

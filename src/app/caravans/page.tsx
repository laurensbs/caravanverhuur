'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, X, Search, Euro, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { caravans, CaravanType } from '@/data/caravans';

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
  const [typeFilter, setTypeFilter] = useState<CaravanType | 'ALL'>('ALL');
  const [personFilter, setPersonFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showFilters, setShowFilters] = useState(false);

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
          src="https://images.unsplash.com/photo-1583946099379-25a3e4b29d8c?w=1920&q=80"
          alt="Costa Brava kustlijn"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg"
            >
              Onze Caravans
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow"
            >
              Volledig uitgeruste caravans klaar op de camping van jouw keuze aan de prachtige Costa Brava
            </motion.p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-border sticky top-[120px] z-40 shadow-sm">
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
                placeholder="Zoek caravan..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">Type</span>
              {(['ALL', 'FAMILIE', 'COMPACT', 'LUXE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    typeFilter === type
                      ? type === 'LUXE' ? 'bg-yellow-500 text-white shadow-md' :
                        type === 'FAMILIE' ? 'bg-primary text-white shadow-md' :
                        type === 'COMPACT' ? 'bg-green-500 text-white shadow-md' :
                        'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground hover:bg-surface-alt'
                  }`}
                >
                  {type === 'ALL' ? 'Alle' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Persons filter */}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-muted" />
              {[0, 2, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setPersonFilter(num)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    personFilter === num
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground hover:bg-surface-alt'
                  }`}
                >
                  {num === 0 ? 'Alle' : `${num}+`}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Price filter */}
            <div className="flex items-center gap-2">
              <Euro size={14} className="text-muted" />
              <select
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value={0}>Max prijs</option>
                <option value={400}>&le; &euro;400/week</option>
                <option value={500}>&le; &euro;500/week</option>
                <option value={600}>&le; &euro;600/week</option>
                <option value={700}>&le; &euro;700/week</option>
              </select>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="default">Standaard</option>
                <option value="price-asc">Prijs laag → hoog</option>
                <option value="price-desc">Prijs hoog → laag</option>
                <option value="persons-desc">Meeste personen</option>
              </select>
            </div>

            {/* Result count + reset */}
            <div className="ml-auto flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <X size={12} /> Reset
                </button>
              )}
              <span className="text-xs text-muted">{filtered.length} caravan{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Tablet filters */}
          <div className="hidden md:flex lg:hidden items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek caravan..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg text-sm font-medium border border-border"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <span className="text-xs text-muted whitespace-nowrap">{filtered.length} resultaten</span>
          </div>

          {/* Mobile filter button */}
          <div className="flex md:hidden items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg text-sm font-medium border border-border"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Expanded filters (mobile + tablet) */}
          {showFilters && (
            <div className="lg:hidden mt-4 pb-2 space-y-4 border-t border-border pt-4">
              <div>
                <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">Type</span>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'FAMILIE', 'COMPACT', 'LUXE'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        typeFilter === type
                          ? type === 'LUXE' ? 'bg-yellow-500 text-white' :
                            type === 'FAMILIE' ? 'bg-primary text-white' :
                            type === 'COMPACT' ? 'bg-green-500 text-white' :
                            'bg-primary text-white'
                          : 'bg-surface text-foreground'
                      }`}
                    >
                      {type === 'ALL' ? 'Alle' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">Min. personen</span>
                <div className="flex flex-wrap gap-2">
                  {[0, 2, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setPersonFilter(num)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        personFilter === num ? 'bg-primary text-white' : 'bg-surface text-foreground'
                      }`}
                    >
                      {num === 0 ? 'Alle' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">Max prijs</span>
                  <select
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    <option value={0}>Geen limiet</option>
                    <option value={400}>&le; &euro;400/week</option>
                    <option value={500}>&le; &euro;500/week</option>
                    <option value={600}>&le; &euro;600/week</option>
                    <option value={700}>&le; &euro;700/week</option>
                  </select>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">Sorteren</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    <option value="default">Standaard</option>
                    <option value="price-asc">Prijs laag → hoog</option>
                    <option value="price-desc">Prijs hoog → laag</option>
                    <option value="persons-desc">Meeste personen</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <X size={14} /> Alle filters wissen
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-surface-alt min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted mb-4">Geen caravans gevonden met deze filters.</p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
              >
                <X size={16} /> Filters resetten
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((caravan, i) => (
                <motion.div
                  key={caravan.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={caravan.photos[0]}
                      alt={caravan.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        caravan.type === 'LUXE' ? 'bg-yellow-500' :
                        caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-green-500'
                      }`}>
                        {caravan.type}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}/week</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted mb-3">
                      <span className="flex items-center gap-1"><Users size={14} /> Max {caravan.maxPersons} pers.</span>
                      <span>{caravan.manufacturer} &bull; {caravan.year}</span>
                    </div>
                    <p className="text-sm text-muted mb-4 line-clamp-2">{caravan.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {caravan.amenities.slice(0, 4).map(a => (
                        <span key={a} className="text-xs px-2 py-1 bg-surface rounded-md text-muted">{a}</span>
                      ))}
                      {caravan.amenities.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 4}</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/caravans/${caravan.id}`}
                        className="flex-1 text-center py-2.5 border border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-sm"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/boeken?caravan=${caravan.id}`}
                        className="flex-1 text-center py-2.5 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-xl transition-all text-sm shadow-md"
                      >
                        Boek Nu
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

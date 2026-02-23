'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, X } from 'lucide-react';
import { caravans, CaravanType } from '@/data/caravans';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function CaravansPage() {
  const [typeFilter, setTypeFilter] = useState<CaravanType | 'ALL'>('ALL');
  const [personFilter, setPersonFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = caravans.filter(c => {
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
    if (personFilter > 0 && c.maxPersons < personFilter) return false;
    return true;
  });

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-dark via-primary to-cyan-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Onze Caravans
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-cyan-100 text-lg max-w-2xl mx-auto"
          >
            Bekijk ons volledige aanbod van goed onderhouden caravans. Allemaal volledig uitgerust en klaar op de camping van jouw keuze.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-muted">Type:</span>
              {(['ALL', 'FAMILIE', 'COMPACT', 'LUXE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    typeFilter === type
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground hover:bg-surface-alt'
                  }`}
                >
                  {type === 'ALL' ? 'Alle' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}

              <div className="w-px h-8 bg-border mx-2" />

              <span className="text-sm font-medium text-muted">Personen:</span>
              {[0, 2, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setPersonFilter(num)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    personFilter === num
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface text-foreground hover:bg-surface-alt'
                  }`}
                >
                  {num === 0 ? 'Alle' : `${num}+`}
                </button>
              ))}
            </div>

            {/* Mobile filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-surface rounded-full text-sm font-medium"
            >
              <Filter size={16} />
              Filters
              {(typeFilter !== 'ALL' || personFilter > 0) && (
                <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center">
                  {(typeFilter !== 'ALL' ? 1 : 0) + (personFilter > 0 ? 1 : 0)}
                </span>
              )}
            </button>

            <span className="text-sm text-muted">{filtered.length} caravan{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Mobile filters expanded */}
          {showFilters && (
            <div className="md:hidden mt-4 pb-2 space-y-3">
              <div>
                <span className="text-sm font-medium text-muted block mb-2">Type:</span>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'FAMILIE', 'COMPACT', 'LUXE'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        typeFilter === type
                          ? 'bg-primary text-white'
                          : 'bg-surface text-foreground'
                      }`}
                    >
                      {type === 'ALL' ? 'Alle' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted block mb-2">Min. personen:</span>
                <div className="flex flex-wrap gap-2">
                  {[0, 2, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setPersonFilter(num)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        personFilter === num
                          ? 'bg-primary text-white'
                          : 'bg-surface text-foreground'
                      }`}
                    >
                      {num === 0 ? 'Alle' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
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
                onClick={() => { setTypeFilter('ALL'); setPersonFilter(0); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium"
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

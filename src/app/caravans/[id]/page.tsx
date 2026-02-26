'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle, ArrowRight, X, ChevronLeft, ChevronRight, Wifi, Wind, Flame, Droplets, Tv, Star, Shield, Calendar, MapPin } from 'lucide-react';
import { getCaravanById, caravans } from '@/data/caravans';
import { useState } from 'react';

const amenityIcons: Record<string, React.ReactNode> = {
  'Airco': <Wind size={16} />,
  'Verwarming': <Flame size={16} />,
  'Warmtepomp': <Wind size={16} />,
  'Koelkast': <Droplets size={16} />,
  'Koelkast met vriezer': <Droplets size={16} />,
  'TV': <Tv size={16} />,
};

export default function CaravanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const caravan = getCaravanById(id);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!caravan) {
    notFound();
  }

  const similarCaravans = caravans.filter(c => c.id !== caravan.id && c.status === 'BESCHIKBAAR').slice(0, 3);

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            <div className="flex items-center justify-between p-4">
              <span className="text-white/60 text-sm">{activePhoto + 1} / {caravan.photos.length}</span>
              <button onClick={() => setLightboxOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative">
              <Image
                src={caravan.photos[activePhoto]}
                alt={caravan.name}
                fill
                className="object-contain"
                unoptimized
              />
              {/* Nav arrows */}
              {activePhoto > 0 && (
                <button
                  onClick={() => setActivePhoto(p => p - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {activePhoto < caravan.photos.length - 1 && (
                <button
                  onClick={() => setActivePhoto(p => p + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 p-4 justify-center">
              {caravan.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all ${activePhoto === i ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
                >
                  <Image src={photo} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb - mobile compact */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Link href="/caravans" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors">
              <ArrowLeft size={16} />
              <span className="sm:hidden">Terug</span>
              <span className="hidden sm:inline">Terug naar caravans</span>
            </Link>
          </div>
        </div>

        {/* Photo gallery - mobile swipe, desktop grid */}
        <div className="bg-white">
          {/* Mobile: full-width swipeable */}
          <div className="sm:hidden relative">
            <button onClick={() => setLightboxOpen(true)} className="block w-full">
              <div className="relative aspect-[4/3]">
                <Image src={caravan.photos[activePhoto]} alt={caravan.name} fill className="object-cover" priority unoptimized />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    caravan.type === 'LUXE' ? 'bg-primary-dark' : caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                  }`}>{caravan.type}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {activePhoto + 1}/{caravan.photos.length} foto&apos;s
                </div>
              </div>
            </button>
            <div className="flex gap-1.5 p-3 overflow-x-auto scrollbar-hide">
              {caravan.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${activePhoto === i ? 'ring-2 ring-primary' : 'opacity-60'}`}
                >
                  <Image src={photo} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: grid layout */}
          <div className="hidden sm:block max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-4 gap-3 h-80 lg:h-96">
              <button
                onClick={() => { setActivePhoto(0); setLightboxOpen(true); }}
                className="col-span-2 relative rounded-xl overflow-hidden group"
              >
                <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" priority unoptimized />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    caravan.type === 'LUXE' ? 'bg-primary-dark' : caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                  }`}>{caravan.type}</span>
                </div>
              </button>
              {caravan.photos.slice(1).map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setActivePhoto(i + 1); setLightboxOpen(true); }}
                  className="relative rounded-xl overflow-hidden group"
                >
                  <Image src={photo} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Title & meta */}
              <div className="bg-white rounded-2xl p-5 sm:p-6">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-mono text-gray-400">{caravan.reference}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} className="fill-amber-400" />
                    <span className="text-xs font-semibold">Nieuw</span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{caravan.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Users size={15} /> Max {caravan.maxPersons} personen</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>{caravan.manufacturer}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>Bouwjaar {caravan.year}</span>
                </div>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{caravan.description}</p>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Voorzieningen</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {caravan.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-xl">
                      <span className="text-primary">{amenityIcons[a] || <CheckCircle size={16} />}</span>
                      <span className="text-sm text-gray-700">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Inventaris</h2>
                <p className="text-xs text-gray-400 mb-4">Alles inbegrepen in de huurprijs</p>
                <div className="grid grid-cols-2 gap-2">
                  {caravan.inventory.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className="text-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Shield size={20} className="text-primary" />, label: 'Veilig betalen' },
                  { icon: <Calendar size={20} className="text-primary" />, label: 'Gratis annuleren' },
                  { icon: <MapPin size={20} className="text-primary" />, label: '30+ campings' },
                ].map(t => (
                  <div key={t.label} className="bg-white rounded-xl p-3 text-center">
                    <div className="flex justify-center mb-1">{t.icon}</div>
                    <span className="text-[11px] font-medium text-gray-600">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - pricing & CTA */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32">
                <h3 className="font-bold text-gray-800 mb-4">Prijzen</h3>
                
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl">
                    <span className="text-sm text-gray-600">Per dag</span>
                    <span className="text-xl font-bold text-primary">&euro;{caravan.pricePerDay}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl">
                    <span className="text-sm text-gray-600">Per week</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">&euro;{caravan.pricePerWeek}</span>
                      <div className="text-[10px] text-gray-400">
                        {Math.round((1 - caravan.pricePerWeek / (caravan.pricePerDay * 7)) * 100)}% korting
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Borg (retour)</span>
                    <span className="text-lg font-semibold text-gray-700">&euro;{caravan.deposit}</span>
                  </div>
                </div>

                <Link
                  href={`/boeken?caravan=${caravan.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors active:scale-[0.98] mb-3"
                >
                  Boek deze caravan
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center justify-center w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Stel een vraag
                </Link>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                  <Shield size={14} />
                  <span>Veilig betalen via Stripe. Borg retour na controle.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Similar caravans */}
          {similarCaravans.length > 0 && (
            <div className="mt-8 sm:mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Vergelijkbare caravans</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarCaravans.map(c => (
                  <Link key={c.id} href={`/caravans/${c.id}`} className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="relative aspect-[16/10]">
                      <Image src={c.photos[0]} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        c.type === 'LUXE' ? 'bg-primary-dark' : c.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                      }`}>{c.type}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-sm">{c.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={12} /> Max {c.maxPersons}</span>
                        <span className="font-bold text-primary">&euro;{c.pricePerDay}<span className="text-xs text-gray-400 font-normal">/dag</span></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky CTA bar */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-lg font-bold text-primary">&euro;{caravan.pricePerDay}<span className="text-xs text-gray-400 font-normal">/dag</span></div>
            <div className="text-[10px] text-gray-400">&euro;{caravan.pricePerWeek}/week</div>
          </div>
          <Link
            href={`/boeken?caravan=${caravan.id}`}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-full text-sm transition-colors active:scale-[0.98]"
          >
            Boeken <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}

'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle, ArrowRight, X, ChevronLeft, ChevronRight, Wifi, Wind, Flame, Droplets, Tv, Star, Shield, Calendar, MapPin, Quote } from 'lucide-react';
import { getCaravanById as getStaticCaravanById, caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useState, useRef, useEffect, TouchEvent } from 'react';
import { useLanguage } from '@/i18n/context';

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
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch(() => {});
  }, []);

  const caravan = getStaticCaravanById(id) || customCaravans.find(c => c.id === id) || null;
  const allCaravans = [...staticCaravans, ...customCaravans];

  const handleTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: TouchEvent) => {
    if (!caravan) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activePhoto < caravan.photos.length - 1) setActivePhoto(p => p + 1);
      if (diff < 0 && activePhoto > 0) setActivePhoto(p => p - 1);
    }
  };

  if (!caravan) {
    notFound();
  }

  const similarCaravans = allCaravans.filter(c => c.id !== caravan.id && c.status === 'BESCHIKBAAR').slice(0, 3);

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
              <button onClick={() => setLightboxOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {activePhoto < caravan.photos.length - 1 && (
                <button
                  onClick={() => setActivePhoto(p => p + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"
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
                  className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all ${activePhoto === i ? 'ring-2 ring-white' : 'opacity-50'}`}
                >
                  <Image src={photo} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-surface">
        {/* Breadcrumb - mobile compact */}
        <div className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Link href="/caravans" className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors">
              <ArrowLeft size={16} />
              <span className="sm:hidden">{t('caravans.back')}</span>
              <span className="hidden sm:inline">{t('caravans.backToCaravans')}</span>
            </Link>
          </div>
        </div>

        {/* Photo gallery - mobile swipe, desktop grid */}
        <div className="bg-white">
          {/* Mobile: full-width swipeable */}
          <div className="sm:hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <button onClick={() => setLightboxOpen(true)} className="block w-full">
              <div className="relative aspect-[4/3]">
                <Image src={caravan.photos[activePhoto]} alt={caravan.name} fill className="object-cover" priority unoptimized />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                  }`}>{caravan.type}</span>
                  {activePhoto + 1}/{caravan.photos.length} {t('caravans.photos')}
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
                <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover transition-transform duration-500" priority unoptimized />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                  }`}>{caravan.type}</span> </div> </button> {caravan.photos.slice(1).map((photo, i) => ( <button key={i} onClick={() => { setActivePhoto(i + 1); setLightboxOpen(true); }} className="relative rounded-xl overflow-hidden group" > <Image src={photo} alt="" fill className="object-cover transition-transform duration-500" unoptimized /> </button> ))} </div> </div> </div> {/* Content */} <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8"> <div className="grid lg:grid-cols-3 gap-6 lg:gap-8"> {/* Main */} <div className="lg:col-span-2 space-y-4 sm:space-y-6"> {/* Title & meta */} <div className="bg-white rounded-2xl p-5 sm:p-6"> <div className="flex items-start justify-between mb-1"> <span className="text-xs font-mono text-muted">{caravan.reference}</span> <div className="flex items-center gap-1 text-primary"> <Star size={14} className="fill-primary" /> <span className="text-xs font-semibold">{caravan.type}</span> </div> </div> <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{caravan.name}</h1> <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-4"> <span className="flex items-center gap-1"><Users size={15} /> Max {caravan.maxPersons} {t('caravans.persShort')}</span> <span>{caravan.manufacturer}</span> <span>{t('caravans.yearBuilt')} {caravan.year}</span> </div> <p className="text-foreground-light text-sm sm:text-base leading-relaxed">{caravan.description}</p> </div> {/* Video */} {caravan.videoUrl && (() => { const match = caravan.videoUrl!.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]+)/); const videoId = match?.[1]; return videoId ? ( <div className="bg-white rounded-2xl p-5 sm:p-6"> <h2 className="text-lg font-bold text-foreground mb-4">Video</h2> <div className="relative w-full aspect-video rounded-xl overflow-hidden"> <iframe src={`https://www.youtube.com/embed/${videoId}`} title={caravan.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full" /> </div> </div> ) : null; })()} {/* Amenities */} <div className="bg-white rounded-2xl p-5 sm:p-6"> <h2 className="text-lg font-bold text-foreground mb-4">{t('caravans.amenities')}</h2> <div className="grid grid-cols-2 gap-2.5"> {caravan.amenities.map(a => ( <div key={a} className="flex items-center gap-2.5 py-2 px-3 bg-surface rounded-xl"> <span className="text-primary">{amenityIcons[a] || <CheckCircle size={16} />}</span> <span className="text-sm text-foreground-light">{a}</span> </div> ))} </div> </div> {/* Inventory */} <div className="bg-white rounded-2xl p-5 sm:p-6"> <h2 className="text-lg font-bold text-foreground mb-1">{t('caravans.inventory')}</h2> <p className="text-xs text-muted mb-4">{t('caravans.inventoryIncluded')}</p> <div className="grid grid-cols-2 gap-2"> {caravan.inventory.map(item => ( <div key={item} className="flex items-center gap-2 text-sm text-foreground-light"> <CheckCircle size={14} className="text-primary shrink-0" /> {item} </div> ))} </div> </div> {/* Trust signals */} <div className="grid grid-cols-3 gap-3"> {[ { icon: <Shield size={20} className="text-primary" />, label: t('caravans.trustSafe') }, { icon: <Calendar size={20} className="text-primary" />, label: t('caravans.trustFlex') }, { icon: <MapPin size={20} className="text-primary" />, label: t('caravans.trustCampings') }, ].map(t2 => ( <div key={t2.label} className="bg-white rounded-xl p-3 text-center"> <div className="flex justify-center mb-1">{t2.icon}</div> <span className="text-xs font-medium text-foreground-light">{t2.label}</span> </div> ))} </div> </div> {/* Sidebar - pricing & CTA */} <div className="space-y-4"> <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32"> <h3 className="font-bold text-foreground mb-4">{t('caravans.prices')}</h3> <div className="space-y-3 mb-5"> <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.pricePerDay')}</span> <span className="text-xl font-bold text-primary">&euro;{caravan.pricePerDay}</span> </div> <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.pricePerWeek')}</span> <div className="text-right"> <span className="text-xl font-bold text-primary">&euro;{caravan.pricePerWeek}</span> <div className="text-xs text-muted"> {Math.round((1 - caravan.pricePerWeek / (caravan.pricePerDay * 7)) * 100)}% {t('caravans.discount')} </div> </div> </div> <div className="flex items-center justify-between py-2.5 px-3 bg-surface rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.depositReturn')}</span> <span className="text-lg font-semibold text-foreground-light">&euro;{caravan.deposit}</span> </div> </div> <Link href={`/boeken?caravan=${caravan.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold rounded-xl transition-colors mb-2"
                >
                  {t('caravans.bookThisCaravan')}
                  <ArrowRight size={16} />
                </Link>
                <p className="text-[11px] text-muted text-center mb-3">{t('caravans.orSimilar')}</p>

                <Link
                  href="/contact"
                  className="flex items-center justify-center w-full py-3 text-foreground-light font-semibold rounded-xl transition-colors text-sm"
                >
                  {t('caravans.askQuestion')}
                </Link>

                <div className="mt-4 pt-4 flex items-center gap-2 text-xs text-muted">
                  <Shield size={14} />
                  <span>{t('caravans.safePaymentNote')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest reviews */}
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold text-foreground mb-4">{t('caravans.guestReviews')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: t('caravans.review1Name'), text: t('caravans.review1Text'), rating: 5, date: 'Okt 2025' },
                { name: t('caravans.review2Name'), text: t('caravans.review2Text'), rating: 5, date: 'Sep 2025' },
              ].map((review, ri) => (
                <div key={ri} className="bg-white rounded-2xl p-5 relative">
                  <Quote size={28} className="absolute top-4 right-4 text-primary/10" />
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} size={14} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground-light mb-3">&ldquo;{review.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{review.name}</span>
                    <span className="text-xs text-muted">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar caravans */}
          {similarCaravans.length > 0 && (
            <div className="mt-8 sm:mt-12">
              <h2 className="text-xl font-bold text-foreground mb-4">{t('caravans.similarCaravans')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarCaravans.map(c => (
                  <Link key={c.id} href={`/caravans/${c.id}`} className="bg-white rounded-2xl overflow-hidden transition-shadow group">
                    <div className="relative aspect-[16/10]">
                      <Image src={c.photos[0]} alt={c.name} fill className="object-cover transition-transform duration-500" unoptimized />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                        c.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                      }`}>{c.type}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted flex items-center gap-1"><Users size={12} /> Max {c.maxPersons}</span>
                        <span className="font-bold text-primary">&euro;{c.pricePerDay}<span className="text-xs text-muted font-normal">/{t('caravans.perDay')}</span></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky CTA bar */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white px-4 py-3 flex items-center gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] border-t border-gray-100">
          <div className="flex-1">
            <div className="text-lg font-bold text-primary">&euro;{caravan.pricePerDay}<span className="text-xs text-muted font-normal">/{t('caravans.perDay')}</span></div>
            <div className="text-xs text-muted">&euro;{caravan.pricePerWeek}/{t('caravans.perWeek')}</div>
          </div>
          <Link
            href={`/boeken?caravan=${caravan.id}`}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full text-sm transition-colors"
          >
            {t('caravans.bookButton')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle, ArrowRight, X, ChevronLeft, ChevronRight, Wifi, Wind, Flame, Droplets, Tv, Star, Shield, Calendar, MapPin, Quote, Truck } from 'lucide-react';
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

export default function CaravanDetailContent({ id }: { id: string }) {
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const { t } = useLanguage();

  const [lightboxPhoto, setLightboxPhoto] = useState(0);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightboxOpen]);

  useEffect(() => {
    fetch('/api/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch((e) => { console.error('Fetch error:', e); })
      .finally(() => setLoadingCustom(false));
  }, []);

  // Prefer API data (which includes DB overrides) over static
  const caravan = customCaravans.find(c => c.id === id) || (!loadingCustom ? getStaticCaravanById(id) : null);
  const allCaravans = customCaravans.length > 0 ? customCaravans : staticCaravans;

  // Detect Gumlet video
  const gumletMatch = caravan?.videoUrl?.match(/gumlet\.tv\/watch\/([\w-]+)/);
  const gumletId = gumletMatch?.[1] || null;
  // Media items: video (if gumlet) as first slide, then photos
  const mediaCount = (caravan?.photos.length || 0) + (gumletId ? 1 : 0);
  const isVideoSlide = (index: number) => gumletId !== null && index === 0;
  const photoIndexFor = (index: number) => gumletId ? index - 1 : index;

  const pauseAutoRef = useRef(false);
  const handleTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; pauseAutoRef.current = true; };
  const handleTouchEnd = (e: TouchEvent) => {
    if (!caravan) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activePhoto < mediaCount - 1) setActivePhoto(p => p + 1);
      if (diff < 0 && activePhoto > 0) setActivePhoto(p => p - 1);
    }
    setTimeout(() => { pauseAutoRef.current = false; }, 3000);
  };

  // Auto-advance mobile gallery
  useEffect(() => {
    if (!mediaCount) return;
    const iv = setInterval(() => {
      if (pauseAutoRef.current) return;
      setActivePhoto(p => (p + 1) % mediaCount);
    }, 4000);
    return () => clearInterval(iv);
  }, [mediaCount]);

  if (!caravan) {
    if (loadingCustom) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
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
              <span className="text-white/60 text-sm">{lightboxPhoto + 1} / {caravan.photos.length}</span>
              <button onClick={() => setLightboxOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 relative">
              <Image
                src={caravan.photos[lightboxPhoto]}
                alt={`${caravan.name} foto ${lightboxPhoto + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
              {/* Nav arrows */}
              {lightboxPhoto > 0 && (
                <button
                  onClick={() => setLightboxPhoto(p => p - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {lightboxPhoto < caravan.photos.length - 1 && (
                <button
                  onClick={() => setLightboxPhoto(p => p + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 p-4 justify-center overflow-x-auto">
              {caravan.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxPhoto(i)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${lightboxPhoto === i ? 'ring-2 ring-white' : 'opacity-50'}`}
                >
                  <Image src={photo} alt={`${caravan.name} miniatuur ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-surface">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <Link href="/caravans" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors">
              <ArrowLeft size={14} />
              <span className="sm:hidden">{t('caravans.back')}</span>
              <span className="hidden sm:inline">{t('caravans.backToCaravans')}</span>
            </Link>
          </div>
        </div>

        {/* Photo gallery - mobile swipe, desktop grid */}
        <div className="bg-white">
          {/* Mobile: full-width swipeable (video as first slide if available) */}
          <div className="sm:hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <button onClick={() => { if (!isVideoSlide(activePhoto)) { setLightboxPhoto(photoIndexFor(activePhoto)); setLightboxOpen(true); } }} className="block w-full">
              <div className="relative aspect-[4/3]">
                {isVideoSlide(activePhoto) ? (
                  <iframe
                    src={`https://play.gumlet.io/embed/${gumletId}?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p`}
                    title={caravan.name}
                    allow="autoplay"
                    loading="eager"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                ) : (
                  <Image src={caravan.photos[photoIndexFor(activePhoto)]} alt={caravan.name} fill className="object-cover" priority sizes="100vw" />
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-primary">{caravan.manufacturer}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-xs font-medium text-white">{activePhoto + 1}/{mediaCount}</span>
                </div>
              </div>
            </button>
            <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide">
              {gumletId && (
                <button
                  onClick={() => setActivePhoto(0)}
                  className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 transition-all bg-black flex items-center justify-center ${activePhoto === 0 ? 'ring-2 ring-primary' : 'opacity-50'}`}
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><polygon points="5,3 19,12 5,21" /></svg>
                </button>
              )}
              {caravan.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(gumletId ? i + 1 : i)}
                  className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 transition-all ${activePhoto === (gumletId ? i + 1 : i) ? 'ring-2 ring-primary' : 'opacity-50'}`}
                >
                  <Image src={photo} alt={`${caravan.name} miniatuur ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: grid layout (video replaces first large cell if present) */}
          <div className="hidden sm:block max-w-6xl mx-auto px-4 py-4">
            <div className="grid grid-cols-4 gap-2.5 h-72 lg:h-80">
              {/* First large cell: video or photo */}
              {gumletId ? (
                <div className="col-span-2 relative rounded-xl overflow-hidden">
                  <iframe
                    src={`https://play.gumlet.io/embed/${gumletId}?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p`}
                    title={caravan.name}
                    allow="autoplay"
                    loading="eager"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-primary">{caravan.manufacturer}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setLightboxPhoto(0); setLightboxOpen(true); }}
                  className="col-span-2 relative rounded-xl overflow-hidden group"
                >
                  <Image src={caravan.photos[0]} alt={caravan.name} fill className="object-cover transition-transform duration-500" priority sizes="(max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-primary">{caravan.manufacturer}</span>
                  </div>
                </button>
              )}
              {/* Remaining photo cells */}
              {(gumletId ? caravan.photos : caravan.photos.slice(1)).slice(0, 4).map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setLightboxPhoto(gumletId ? i : i + 1); setLightboxOpen(true); }}
                  className="relative rounded-xl overflow-hidden group"
                >
                  <Image src={photo} alt={`${caravan.name} foto ${i + 1}`} fill className="object-cover transition-transform duration-500" />
                  {/* Show remaining count on last visible cell */}
                  {i === 3 && caravan.photos.length > (gumletId ? 4 : 5) && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{caravan.photos.length - (gumletId ? 4 : 5)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div> {/* Content */} <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 pb-28 lg:pb-8"> <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"> {/* Main */} <div className="lg:col-span-2 space-y-3 sm:space-y-6"> {/* Title & meta */} <div className="bg-white rounded-2xl p-4 sm:p-6"> <div className="flex items-start justify-between mb-1"> <span className="text-[11px] font-mono text-muted">{caravan.reference}</span> <div className="flex items-center gap-1 text-primary"> <Star size={14} className="fill-primary" /> <span className="text-xs font-semibold">{caravan.manufacturer}</span> </div> </div> <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-2">{caravan.name}</h1> <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted mb-3"> <span className="flex items-center gap-1 bg-surface px-2 py-1 rounded-full"><Users size={14} /> Max {caravan.maxPersons} {t('caravans.persShort')}</span> <span className="bg-surface px-2 py-1 rounded-full">{caravan.manufacturer}</span> <span className="bg-surface px-2 py-1 rounded-full">{t('caravans.yearBuilt')} {caravan.year}</span> </div> <p className="text-foreground-light text-sm leading-relaxed">{caravan.description}</p> <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><p className="text-xs text-blue-800 leading-relaxed">{t('termsPage.caravanDisclaimerShort')}</p></div> </div> {/* Video */} {caravan.videoUrl && (() => { const ytMatch = caravan.videoUrl!.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]+)/); const gumletMatch = caravan.videoUrl!.match(/gumlet\.tv\/watch\/([\w-]+)/); if (gumletMatch) { return null; } const videoId = ytMatch?.[1]; return videoId ? ( <div className="bg-white rounded-2xl p-4 sm:p-6"> <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">Video</h2> <div className="relative w-full aspect-video rounded-xl overflow-hidden"> <iframe src={`https://www.youtube.com/embed/${videoId}`} title={caravan.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="absolute inset-0 w-full h-full" /> </div> </div> ) : null; })()} {/* Amenities */} <div className="bg-white rounded-2xl p-4 sm:p-6"> <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">{t('caravans.amenities')}</h2> <div className="grid grid-cols-2 gap-2"> {caravan.amenities.map(a => ( <div key={a} className="flex items-center gap-2 py-2 px-2.5 bg-surface rounded-xl"> <span className="text-primary">{amenityIcons[a] || <CheckCircle size={14} />}</span> <span className="text-xs sm:text-sm text-foreground-light">{a}</span> </div> ))} </div> </div> {/* Inventory */} <div className="bg-white rounded-2xl p-4 sm:p-6"> <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">{t('caravans.inventory')}</h2> <p className="text-[11px] text-muted mb-3">{t('caravans.inventoryIncluded')}</p> <div className="grid grid-cols-2 gap-1.5"> {caravan.inventory.map(item => ( <div key={item} className="flex items-center gap-2 text-xs sm:text-sm text-foreground-light py-0.5"> <CheckCircle size={13} className="text-primary shrink-0" /> {item} </div> ))} </div> </div> {/* Service included */} <div className="bg-primary-50 border border-primary-light rounded-2xl p-4 sm:p-6"> <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 flex items-center gap-2"><Truck size={18} className="text-primary" /> {t('caravans.serviceIncluded')}</h2> <div className="grid grid-cols-2 gap-2 mb-2"> {[t('caravans.serviceSetup'), t('caravans.serviceAwningUp'), t('caravans.servicePickup'), t('caravans.serviceAwningDown')].map(item => ( <div key={item} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5"> <CheckCircle size={14} className="text-primary shrink-0" /> <span className="text-xs sm:text-sm font-medium text-foreground">{item}</span> </div> ))} </div> <p className="text-xs sm:text-sm text-primary font-semibold">{t('caravans.serviceNote')}</p> </div> {/* Trust signals */} <div className="grid grid-cols-3 gap-2 sm:gap-3"> {[ { icon: <Shield size={18} className="text-primary" />, label: t('caravans.trustSafe') }, { icon: <Calendar size={18} className="text-primary" />, label: t('caravans.trustFlex') }, { icon: <MapPin size={18} className="text-primary" />, label: t('caravans.trustCampings') }, ].map(t2 => ( <div key={t2.label} className="bg-white rounded-xl p-2.5 sm:p-3 text-center"> <div className="flex justify-center mb-1">{t2.icon}</div> <span className="text-[10px] sm:text-xs font-medium text-foreground-light leading-tight">{t2.label}</span> </div> ))} </div> </div> {/* Sidebar - pricing & CTA */} <div className="space-y-4"> <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32"> <h3 className="font-bold text-foreground mb-1">{t('caravans.seasonalPricing')}</h3> <p className="text-xs text-muted mb-4">{t('caravans.basedOn')} &bull; {t('caravans.inclVat')}</p> <div className="space-y-3 mb-5"> <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.preSeason')}</span> <span className="text-xl font-bold text-primary">&euro;550<span className="text-xs text-muted font-normal">{t('caravans.perWeek')}</span></span> </div> <div className="flex items-center justify-between py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-200"> <span className="text-sm font-semibold text-amber-800">{t('caravans.highSeason')}</span> <span className="text-xl font-bold text-amber-700">&euro;650<span className="text-xs text-amber-600 font-normal">{t('caravans.perWeek')}</span></span> </div> <div className="flex items-center justify-between py-2.5 px-3 bg-primary/5 rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.postSeason')}</span> <span className="text-xl font-bold text-primary">&euro;550<span className="text-xs text-muted font-normal">{t('caravans.perWeek')}</span></span> </div> <div className="flex items-center justify-between py-2.5 px-3 bg-surface rounded-xl"> <span className="text-sm text-foreground-light">{t('caravans.depositReturn')}</span> <span className="text-lg font-semibold text-foreground-light">&euro;300</span> </div> </div> <Link href={`/boeken?caravan=${caravan.id}`}
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
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">{t('caravans.campingNotice')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guest reviews */}
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold text-foreground mb-4">{t('caravans.guestReviews')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: t('caravans.review1Name'), text: t('caravans.review1Text'), rating: 5, date: t('caravans.review1Date') },
                { name: t('caravans.review2Name'), text: t('caravans.review2Text'), rating: 5, date: t('caravans.review2Date') },
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
                      <Image src={c.photos[0]} alt={c.name} fill className="object-cover transition-transform duration-500" />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                        'bg-primary'
                      }`}>{c.manufacturer}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted flex items-center gap-1"><Users size={12} /> Max {c.maxPersons}</span>
                        <span className="font-bold text-primary">&euro;550<span className="text-xs text-muted font-normal">/{t('caravans.perWeek')}</span></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky CTA bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-primary leading-tight">&euro;550<span className="text-[11px] text-muted font-normal">/{t('caravans.perWeek')}</span></div>
            <div className="text-[11px] text-muted">{t('caravans.highSeason')}: &euro;650/{t('caravans.perWeek')}</div>
          </div>
          <Link
            href={`/boeken?caravan=${caravan.id}`}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full text-sm transition-colors shrink-0 shadow-lg shadow-primary/25"
          >
            {t('caravans.bookButton')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import BookingCTA from '@/components/BookingCTA';
import { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Tent, Package, ArrowRight, Info, Bed, Mountain, Refrigerator, Snowflake, ChevronDown, Armchair, UtensilsCrossed, Wine, Utensils, Trash2, BedDouble, Truck } from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Slow-motion marquee — continuous CSS scroll, premium feel          */
/* ------------------------------------------------------------------ */
function SlowMarquee({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(40);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const contentW = el.scrollWidth / 2;
    setDur(contentW / 35);
  }, [children]);

  return (
    <div className="overflow-hidden">
      <div
        ref={trackRef}
        className="flex gap-3 w-max hover:[animation-play-state:paused] active:[animation-play-state:paused]"
        style={{ animation: `marquee-scroll ${dur}s linear infinite` }}
        onTouchStart={e => { e.currentTarget.style.animationPlayState = 'paused'; }}
        onTouchEnd={e => { e.currentTarget.style.animationPlayState = 'running'; }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Categorized inventory — collapsible cards                          */
/* ------------------------------------------------------------------ */
const invCategories = [
  {
    label: 'Buiten',
    icon: <Armchair size={16} />,
    items: ['4 tuinstoelen', '1 tuintafel', '1 parasol'],
  },
  {
    label: 'Keuken',
    icon: <UtensilsCrossed size={16} />,
    items: ['1 koffiezetapparaat (Senseo)', '1 waterkoker', '2 koekenpannen', '2 kookpannen', 'Snijplanken', '3 pannenonderzetters', '1 vergiet', '1 maatbeker', '1 rasp', '1 gasfles'],
  },
  {
    label: 'Servies & glazen',
    icon: <Wine size={16} />,
    items: ['6 grote platte borden', '6 ontbijtborden', '6 soepkommen', '6 theeglazen', '6 koffiemokken', '6 longdrink glazen', '6 bierglazen', '6 wijnglazen'],
  },
  {
    label: 'Bestek & keukengerief',
    icon: <Utensils size={16} />,
    items: ['6 lepels', '6 vorken', '6 messen', '6 theelepels', '2 schilmessen', '2 opscheplepels', '1 snijmes', '1 schaar', '1 flessenopener', '1 kaasschaaf', '1 blikopener'],
  },
  {
    label: 'Schoonmaak',
    icon: <Trash2 size={16} />,
    items: ['1 pedaalemmer', '1 stoffer + blik', '1 afwasbak', '1 emmer', '1 vloerveger', '1 droogrek', 'Wasknijpers'],
  },
  {
    label: 'Slaapkamers',
    icon: <BedDouble size={16} />,
    items: ['4 slaapplekken (2 slaapkamers)', '10 kledinghangers', '1 lampje'],
  },
];

function CaravanInventoryCategories() {
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const allOpen = openCats.size === invCategories.length;
  const toggleAll = () => {
    if (allOpen) setOpenCats(new Set());
    else setOpenCats(new Set(invCategories.map((_, i) => i)));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Package size={16} className="text-primary" /> Complete inventarislijst
          </h3>
          <p className="text-[11px] text-muted mt-0.5">{invCategories.reduce((a, c) => a + c.items.length, 0)} items inbegrepen</p>
        </div>
        <button onClick={toggleAll} className="text-[11px] font-medium text-primary hover:underline cursor-pointer">
          {allOpen ? 'Alles inklappen' : 'Alles uitklappen'}
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {invCategories.map((cat, i) => {
          const isOpen = openCats.has(i);
          return (
            <div key={cat.label}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-primary">{cat.icon}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{cat.label}</span>
                <span className="text-[11px] text-muted bg-gray-100 rounded-full px-2 py-0.5">{cat.items.length}</span>
                <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {cat.items.map(item => (
                    <span key={item} className="text-xs text-foreground-light bg-surface rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-primary shrink-0" /> {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CaravansPage() {
  const { t } = useLanguage();
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);

  useEffect(() => {
    fetch('/api/caravans?all=true')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  const caravans: Caravan[] = useMemo(() => {
    if (customCaravans.length > 0) return customCaravans;
    return staticCaravans;
  }, [customCaravans]);

  const amenities = staticCaravans[0]?.amenities || [];
  const allPhotos = useMemo(() => caravans.flatMap(c => c.photos).filter(p => p && p.startsWith('http')), [caravans]);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative bg-foreground text-white overflow-hidden">
        <div className="absolute inset-0">
          {allPhotos[0] && (
            <Image
              src={allPhotos[0]}
              alt="Caravan Costa Brava"
              fill
              className="object-cover opacity-30"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/80 to-foreground/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 sm:pt-28 pb-12 sm:pb-16">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
            {t('caravans.heroTitle')}
          </h1>
          <p className="text-sm sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            {t('caravans.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/90 text-xs">
              <Info size={12} className="text-blue-300 shrink-0" />
              <span>{t('termsPage.caravanDisclaimer')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/90 text-xs">
              <Tent size={12} className="text-amber-300 shrink-0" />
              <span>{t('caravans.campingFirstNote')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PHOTO MARQUEE ===== */}
      <section className="py-8 sm:py-12 bg-surface">
        <SlowMarquee>
          {allPhotos.slice(0, 8).map((photo, i) => (
            <div key={i} className="shrink-0 w-[55vw] sm:w-[28vw] md:w-[22vw] lg:w-[18vw] relative rounded-2xl overflow-hidden shadow-md aspect-[4/3]">
              <Image
                src={photo}
                alt={`Caravan foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 55vw, (max-width: 768px) 28vw, (max-width: 1024px) 22vw, 18vw"
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <p className="text-[10px] text-white/80">{t('caravans.orSimilar')}</p>
              </div>
            </div>
          ))}
        </SlowMarquee>
      </section>

      {/* ===== SERVICE & EXTRAS ===== */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t('caravans.serviceIncluded')}
            </h2>
            <p className="text-muted mt-3 text-sm sm:text-lg max-w-xl mx-auto">
              {t('caravans.serviceNote')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12 sm:mb-16">
            {[
              { label: t('caravans.serviceSetup'), icon: <Truck size={22} /> },
              { label: t('caravans.serviceAwningUp'), icon: <Tent size={22} /> },
              { label: t('caravans.servicePickup'), icon: <Truck size={22} /> },
              { label: t('caravans.serviceAwningDown'), icon: <Tent size={22} /> },
            ].map((item, i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 text-white shadow-md">
                  {item.icon}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="text-center mb-10 sm:mb-14">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {t('home.extrasTitle')}
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { name: t('home.extraItemBedlinnen'), price: t('home.extraItemBedlinnenPrice'), icon: <Bed size={22} className="text-white" /> },
              { name: t('home.extraItemMountainbikes'), price: t('home.extraItemMountainbikesPrice'), icon: <Mountain size={22} className="text-white" /> },
              { name: t('home.extraItemKoelkast'), price: t('home.extraItemKoelkastPrice'), icon: <Refrigerator size={22} className="text-white" /> },
              { name: t('home.extraItemAirco'), price: t('home.extraItemAircoPrice'), icon: <Snowflake size={22} className="text-white" /> },
            ].map((extra, i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-dark rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  {extra.icon}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">{extra.name}</p>
                <p className="text-xs font-bold text-primary mt-1">{extra.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRANSPORT VISUAL ===== */}
      <section className="py-14 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <Image
                src="https://u.cubeupload.com/laurensbos/IMG3797.jpg"
                alt="Transport caravan naar camping"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
                {t('home.roadTripTitle')}
              </h2>
              <p className="text-foreground-light text-sm sm:text-base leading-relaxed mb-6">
                {t('home.roadTripSubtitle')}
              </p>
              <div className="space-y-4">
                {[
                  { icon: <CheckCircle className="w-5 h-5" />, text: t('caravans.serviceSetup') },
                  { icon: <CheckCircle className="w-5 h-5" />, text: t('caravans.serviceAwningUp') },
                  { icon: <CheckCircle className="w-5 h-5" />, text: t('caravans.servicePickup') },
                  { icon: <CheckCircle className="w-5 h-5" />, text: t('caravans.serviceAwningDown') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INVENTORY ===== */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t('home.inventoryTitle')}
            </h2>
            <p className="text-muted text-sm sm:text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
              {t('home.inventorySubtitle')}
            </p>
          </div>

          {/* Amenities as compact pill grid */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 sm:mb-12">
            {amenities.map(a => (
              <span key={a} className="text-xs font-medium bg-primary/5 text-primary-dark px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle size={10} className="text-primary" />{a}
              </span>
            ))}
          </div>

          {/* Categorized inventory — collapsible */}
          <div className="max-w-2xl mx-auto">
            <CaravanInventoryCategories />
          </div>
        </div>
      </section>

      <BookingCTA />
    </>
  );
}

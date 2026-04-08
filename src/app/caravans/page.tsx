'use client';

import Image from 'next/image';
import Link from 'next/link';
import BookingCTA from '@/components/BookingCTA';
import { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Tent, Package, Sparkles, ArrowRight, Info, Bed, Mountain, Refrigerator, Snowflake, ChevronDown, Armchair, UtensilsCrossed, Wine, Utensils, Trash2, BedDouble, Truck } from 'lucide-react';
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
      <section className="bg-background min-h-[80vh]">
        {/* ── Hero ── */}
        <div className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12 pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight">
            {t('caravans.heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted mt-2 max-w-2xl leading-relaxed">
            {t('caravans.heroSubtitle')}
          </p>
        </div>

        {/* ── Photo gallery marquee ── */}
        <div className="pb-8 sm:pb-10">
          <SlowMarquee>
            {allPhotos.slice(0, 8).map((photo, i) => (
              <div key={i} className="shrink-0 w-[65vw] sm:w-[32vw] md:w-[24vw] lg:w-[20vw] relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
                <Image
                  src={photo}
                  alt={`Caravan foto ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 65vw, (max-width: 768px) 32vw, (max-width: 1024px) 24vw, 20vw"
                  className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <p className="text-[10px] text-white/80">{t('caravans.orSimilar')}</p>
                </div>
              </div>
            ))}
          </SlowMarquee>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12 sm:pb-16">
          {/* ── Notices ── */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-8">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 flex-1">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{t('termsPage.caravanDisclaimer')}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 sm:max-w-sm">
              <Tent size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{t('caravans.campingFirstNote')}</span>
            </div>
          </div>

          {/* ── Two-column layout: Service + Extras side by side on desktop ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-12">
            {/* Service included card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck size={16} className="text-primary" />
                </div>
                {t('caravans.serviceIncluded')}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  t('caravans.serviceSetup'),
                  t('caravans.serviceAwningUp'),
                  t('caravans.servicePickup'),
                  t('caravans.serviceAwningDown'),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5">
                    <CheckCircle size={14} className="text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-primary font-semibold mt-3">{t('caravans.serviceNote')}</p>
            </div>

            {/* Extras for surcharge card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                {t('home.extrasTitle')}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: t('home.extraItemBedlinnen'), price: t('home.extraItemBedlinnenPrice'), icon: <Bed size={18} className="text-primary" /> },
                  { name: t('home.extraItemMountainbikes'), price: t('home.extraItemMountainbikesPrice'), icon: <Mountain size={18} className="text-primary" /> },
                  { name: t('home.extraItemKoelkast'), price: t('home.extraItemKoelkastPrice'), icon: <Refrigerator size={18} className="text-primary" /> },
                  { name: t('home.extraItemAirco'), price: t('home.extraItemAircoPrice'), icon: <Snowflake size={18} className="text-primary" /> },
                ].map((extra) => (
                  <div key={extra.name} className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                      {extra.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs sm:text-sm leading-tight">{extra.name}</p>
                      <p className="text-xs font-bold text-primary">{extra.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Transport visual ── */}
          <div className="relative rounded-2xl overflow-hidden mb-10 sm:mb-12 aspect-[3/1]">
            <Image
              src="https://u.cubeupload.com/laurensbos/IMG3797.jpg"
              alt="Transport caravan naar camping"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 sm:p-6">
              <p className="text-white font-bold text-sm sm:text-lg">{t('home.roadTripTitle')}</p>
              <p className="text-white/60 text-[11px] sm:text-xs mt-0.5">{t('home.roadTripSubtitle')}</p>
            </div>
          </div>

          {/* ── Standard amenities ── */}
          <div className="mb-10 sm:mb-12">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle size={16} className="text-primary" />
              </div>
              {t('home.inventoryTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-muted mb-4">{t('home.inventorySubtitle')}</p>

            {/* Amenities as compact pill grid */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
              {amenities.map(a => (
                <span key={a} className="text-xs font-medium bg-primary/5 text-primary-dark px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle size={10} className="text-primary" />{a}
                </span>
              ))}
            </div>

            {/* Categorized inventory — collapsible */}
            <CaravanInventoryCategories />
          </div>

          {/* ── Book CTA inline ── */}
          <Link
            href="/boeken"
            className="group flex items-center justify-between bg-foreground text-white rounded-2xl px-5 sm:px-8 py-4 sm:py-5 hover:bg-foreground/90 transition-all duration-200"
          >
            <div>
              <p className="font-bold text-sm sm:text-base">{t('caravans.bookThisCaravan')}</p>
              <p className="text-xs text-white/60 mt-0.5">{t('caravans.serviceNote')}</p>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <BookingCTA />
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle, Tent, Package, Sparkles, ArrowRight, Info, Bed, Mountain, Refrigerator, ChevronDown, Armchair, UtensilsCrossed, Wine, Utensils, Trash2, BedDouble } from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Auto-sliding photo carousel                                        */
/* ------------------------------------------------------------------ */
function CaravanPhotoCarousel({ photos, t }: { photos: string[]; t: (k: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const touchRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(max-width: 640px)');
    if (!mq.matches) return;

    const iv = setInterval(() => {
      if (touchRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 10;
      el.scrollTo({ left: atEnd ? 0 : scrollLeft + clientWidth * 0.82, behavior: 'smooth' });
    }, 3500);

    const onTouchStart = () => { touchRef.current = true; };
    const onTouchEnd = () => { setTimeout(() => { touchRef.current = false; }, 3000); };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      clearInterval(iv);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div ref={ref} className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 sm:overflow-visible scrollbar-hide touch-pan-y">
      {photos.map((photo, i) => (
        <div key={i} className="snap-center shrink-0 w-[72vw] sm:w-auto relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
          <Image
            src={photo}
            alt={`Caravan foto ${i + 1}`}
            fill
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <p className="text-[10px] text-white/80">{t('caravans.orSimilar')}</p>
          </div>
        </div>
      ))}
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
    items: ['1 tweepersoonsbed', 'Dekbed (2x 1-persoons mogelijk)', '1 molton', '2 kussens', '10 kledinghangers', '2 eenpersoonsbedden', '2 moltons', '2 dekbedden', '2 kussens', '1 lampje'],
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
        <button onClick={toggleAll} className="text-[11px] font-medium text-primary hover:underline">
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
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
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
      .then(data => {
        setCustomCaravans(data.caravans || []);
      })
      .catch((e) => console.error('Fetch error:', e));
  }, []);

  const caravans: Caravan[] = useMemo(() => {
    if (customCaravans.length > 0) return customCaravans;
    return staticCaravans;
  }, [customCaravans]);

  // Get shared inventory from first caravan
  // Use static data for shared inventory & amenities (always complete)
  const inventory = staticCaravans[0]?.inventory || [];
  const amenities = staticCaravans[0]?.amenities || [];

  // Collect all photos from all caravans
  const allPhotos = useMemo(() => caravans.flatMap(c => c.photos), [caravans]);

  return (
    <>
      <section className="pt-8 sm:pt-10 pb-8 sm:pb-12 bg-background min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight mb-3">{t('caravans.heroTitle')}</h1>
          <p className="text-sm sm:text-base text-muted mb-4 max-w-2xl">{t('caravans.heroSubtitle')}</p>

          {/* Assignment notice */}
          <div className="flex items-start gap-3 mb-4 text-xs sm:text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{t('termsPage.caravanDisclaimer')}</span>
          </div>
          <div className="flex items-center gap-2 mb-6 text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Tent size={14} className="shrink-0" />
            <span>{t('caravans.campingFirstNote')}</span>
          </div>

          {/* Extras for surcharge */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> {t('home.extrasTitle')}
            </h2>
            <p className="text-sm text-muted mb-4">{t('home.extrasSubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: t('home.extraItemBedlinnen'), price: t('home.extraItemBedlinnenPrice'), icon: <Bed size={22} className="text-primary" /> },
                { name: t('home.extraItemMountainbikes'), price: t('home.extraItemMountainbikesPrice'), icon: <Mountain size={22} className="text-primary" /> },
                { name: t('home.extraItemKoelkast'), price: t('home.extraItemKoelkastPrice'), icon: <Refrigerator size={22} className="text-primary" /> },
              ].map((extra) => (
                <div key={extra.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                    {extra.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm leading-tight">{extra.name}</h3>
                    <p className="text-xs font-bold text-primary">{extra.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo gallery — horizontal scroll, auto-slides on mobile */}
          <div className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Package size={18} className="text-primary" /> {t('home.featuredCaravansTitle')}
            </h2>
            <CaravanPhotoCarousel photos={allPhotos.slice(0, 8)} t={t} />
          </div>

          {/* Standard amenities */}
          <div className="mb-12">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-primary" /> {t('home.inventoryTitle')}
            </h2>
            <p className="text-sm text-muted mb-6">{t('home.inventorySubtitle')}</p>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-6">
              {amenities.map(a => (
                <span key={a} className="text-xs sm:text-sm font-medium bg-primary-50 text-primary-dark px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-primary" />{a}
                </span>
              ))}
            </div>

            {/* Categorized inventory — collapsible */}
            <CaravanInventoryCategories />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/boeken"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm hover:bg-primary-dark shadow-lg"
            >
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

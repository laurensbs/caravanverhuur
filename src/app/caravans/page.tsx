'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Users, CheckCircle, Tent, Package, Sparkles, ArrowRight, Info, Bed, Mountain, Refrigerator } from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';

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
            <div className="grid grid-cols-3 gap-3">
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

          {/* Photo gallery */}
          <div className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Package size={18} className="text-primary" /> {t('home.featuredCaravansTitle')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {caravans.map((caravan) => (
                <div key={caravan.id} className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <Image
                      src={caravan.photos[0]}
                      alt={`Caravan ${caravan.id}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                      <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1">
                        <Users size={12} className="text-primary" /> Max {caravan.maxPersons} {t('caravans.persShort')}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-xs text-muted text-center">{t('caravans.orSimilar')}</p>
                  </div>
                </div>
              ))}
              {/* Extra photos */}
              {allPhotos.slice(caravans.length, caravans.length + 4).map((photo, idx) => (
                <div key={`extra-${idx}`} className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
                  <Image src={photo} alt={`Caravan foto ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
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

            {/* Inventory grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {inventory.map(item => (
                  <span key={item} className="text-xs sm:text-sm text-foreground-light bg-surface rounded-lg px-3 py-2 truncate">{item}</span>
                ))}
              </div>
            </div>
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

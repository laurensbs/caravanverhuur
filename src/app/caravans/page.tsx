'use client';

import Image from 'next/image';
import Link from 'next/link';
import BookingCTA from '@/components/BookingCTA';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Tent, Package, ArrowRight, Info, Bed, Mountain, Refrigerator, Snowflake, ChevronDown, ChevronRight, Armchair, UtensilsCrossed, Wine, Utensils, Trash2, BedDouble, Truck, MapPin, Sparkles } from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
import { useLanguage } from '@/i18n/context';
import { useData } from '@/lib/data-context';

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
    items: ['4 Tuinstoelen', '1 Tuintafel', '1 Parasol'],
  },
  {
    label: 'Keuken',
    icon: <UtensilsCrossed size={16} />,
    items: ['1 Koffiezetapparaat (Senseo)', '1 Waterkoker', '2 Koekenpannen', '2 Kookpannen', 'Snijplanken', '3 Pannenonderzetters', '1 Vergiet', '1 Maatbeker', '1 Rasp', '1 Gasfles'],
  },
  {
    label: 'Servies & Glazen',
    icon: <Wine size={16} />,
    items: ['6 Grote Platte Borden', '6 Ontbijtborden', '6 Soepkommen', '6 Theeglazen', '6 Koffiemokken', '6 Longdrink Glazen', '6 Bierglazen', '6 Wijnglazen'],
  },
  {
    label: 'Bestek & Keukengerief',
    icon: <Utensils size={16} />,
    items: ['6 Lepels', '6 Vorken', '6 Messen', '6 Theelepels', '2 Schilmessen', '2 Opscheplepels', '1 Snijmes', '1 Schaar', '1 Flessenopener', '1 Kaasschaaf', '1 Blikopener'],
  },
  {
    label: 'Schoonmaak',
    icon: <Trash2 size={16} />,
    items: ['1 Pedaalemmer', '1 Stoffer + Blik', '1 Afwasbak', '1 Emmer', '1 Vloerveger', '1 Droogrek', 'Wasknijpers'],
  },
  {
    label: 'Slaapkamers',
    icon: <BedDouble size={16} />,
    items: ['4 Slaapplekken (2 Slaapkamers)', '10 Kledinghangers', '1 Lampje'],
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

/* ------------------------------------------------------------------ */
/*  Animation variants — matching homepage patterns                    */
/* ------------------------------------------------------------------ */
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.06, duration: 0.45, ease },
  }),
};

export default function CaravansPage() {
  const { t } = useLanguage();
  const { campings: allCampings } = useData();
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
      {/* ===== CINEMATIC HERO ===== */}
      <section className="relative bg-foreground text-white overflow-hidden">
        <div className="absolute inset-0">
          {allPhotos[0] && (
            <Image
              src={allPhotos[0]}
              alt="Caravan Costa Brava"
              fill
              className="object-cover opacity-25"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/70 to-foreground" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 sm:pt-24 pb-10 sm:pb-14">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-white/80 text-xs font-medium mb-5">
              <Sparkles size={12} /> Seizoen 2026
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-4 max-w-3xl">
              {t('caravans.heroTitle')}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-sm sm:text-lg text-white/60 max-w-xl leading-relaxed mb-3">
              {t('caravans.heroSubtitle')}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/8 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full text-white/50 text-xs">
                <Info size={11} className="shrink-0" />
                {t('termsPage.caravanDisclaimerShort')}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/8 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full text-white/50 text-xs">
                <Tent size={11} className="shrink-0" />
                {t('caravans.campingFirstNote')}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== PHOTO STRIP ===== */}
      <section className="py-5 sm:py-8 bg-surface">
        <SlowMarquee>
          {allPhotos.slice(0, 8).map((photo, i) => (
            <div key={i} className="shrink-0 w-[48vw] sm:w-[26vw] md:w-[20vw] lg:w-[16vw] relative rounded-2xl overflow-hidden shadow-md aspect-[4/3]">
              <Image
                src={photo}
                alt={`Caravan foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 48vw, (max-width: 768px) 26vw, (max-width: 1024px) 20vw, 16vw"
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

      {/* ===== HOW IT WORKS — SERVICE + EXTRAS ===== */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t('caravans.serviceIncluded')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-3 text-sm sm:text-lg max-w-xl mx-auto">
              {t('caravans.serviceNote')}
            </motion.p>
          </motion.div>

          {/* Service timeline — 4 animated steps */}
          <div className="relative max-w-3xl mx-auto mb-16 sm:mb-20">
            {/* Vertical connector (mobile) / Horizontal connector (desktop) */}
            <div className="sm:hidden absolute top-0 bottom-0 left-6 w-0.5 bg-primary/10 z-0" />
            <div className="hidden sm:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-primary/10 z-0" />

            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0">
              {[
                { label: t('caravans.serviceSetup'), icon: <Truck size={20} />, step: 1 },
                { label: t('caravans.serviceAwningUp'), icon: <Tent size={20} />, step: 2 },
                { label: t('caravans.servicePickup'), icon: <Truck size={20} />, step: 3 },
                { label: t('caravans.serviceAwningDown'), icon: <Tent size={20} />, step: 4 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease }}
                  className="flex-1 relative z-10 flex sm:flex-col items-center gap-4 sm:gap-0"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shrink-0 sm:mb-4 relative">
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center shadow-sm border border-primary/20">{item.step}</span>
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold text-foreground sm:text-center leading-snug">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.h3 variants={fadeUp} custom={0} className="text-center text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mb-6 sm:mb-8">
              {t('home.extrasTitle')}
            </motion.h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: t('home.extraItemBedlinnen'), price: t('home.extraItemBedlinnenPrice'), icon: <Bed size={20} />, color: 'from-blue-500/10 to-blue-500/5 border-blue-200' },
                { name: t('home.extraItemMountainbikes'), price: t('home.extraItemMountainbikesPrice'), icon: <Mountain size={20} />, color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200' },
                { name: t('home.extraItemKoelkast'), price: t('home.extraItemKoelkastPrice'), icon: <Refrigerator size={20} />, color: 'from-amber-500/10 to-amber-500/5 border-amber-200' },
                { name: t('home.extraItemAirco'), price: t('home.extraItemAircoPrice'), icon: <Snowflake size={20} />, color: 'from-cyan-500/10 to-cyan-500/5 border-cyan-200' },
              ].map((extra, i) => (
                <motion.div key={i} variants={scaleIn} custom={i + 1} className={`rounded-2xl bg-gradient-to-b ${extra.color} border p-4 sm:p-5 text-center`}>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-foreground">
                    {extra.icon}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">{extra.name}</p>
                  <p className="text-xs font-bold text-primary mt-1">{extra.price}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CAMPINGS ===== */}
      {allCampings.length > 0 && (
        <section className="py-14 sm:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="flex items-end justify-between mb-8 sm:mb-10"
            >
              <div>
                <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {t('caravans.campingsTitle')}
                </motion.h2>
                <motion.p variants={fadeUp} custom={1} className="text-muted text-sm mt-1.5 max-w-md">{t('caravans.campingsSubtitle')}</motion.p>
              </div>
              <motion.div variants={fadeUp} custom={2}>
                <Link href="/bestemmingen" className="hidden sm:flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  {t('caravans.allCampings')} <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Mobile: horizontal scroll, Desktop: 4-col grid */}
            <div className="flex gap-3.5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {allCampings.slice(0, 8).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease }}
                  className="snap-start shrink-0 w-[75vw] sm:w-auto"
                >
                  <Link href={`/bestemmingen/${c.slug}`} className="group block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-2.5 shadow-sm">
                      <Image
                        src={c.photos?.[0] || '/og-image.jpg'}
                        alt={c.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized={(c.photos?.[0] || '').startsWith('http')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-foreground shadow-sm">
                        {c.region}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><MapPin size={11} /> {c.location}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="sm:hidden mt-5 text-center">
              <Link href="/bestemmingen" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold">
                {t('caravans.viewAllCampings')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== TRANSPORT VISUAL ===== */}
      <section className="py-14 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease }}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg"
            >
              <Image
                src="https://u.cubeupload.com/laurensbos/IMG3797.jpg"
                alt="Transport caravan naar camping"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
                {t('home.roadTripTitle')}
              </h2>
              <p className="text-foreground-light text-sm sm:text-base leading-relaxed mb-6">
                {t('home.roadTripSubtitle')}
              </p>
              <Link
                href="/boeken"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
              >
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== INVENTORY ===== */}
      <section className="py-14 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t('home.inventoryTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted text-sm sm:text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
              {t('home.inventorySubtitle')}
            </motion.p>
          </motion.div>

          {/* Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 sm:mb-12"
          >
            {amenities.map(a => (
              <span key={a} className="text-xs font-medium bg-primary/5 text-primary-dark px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle size={10} className="text-primary" />{a}
              </span>
            ))}
          </motion.div>

          {/* Categorized inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <CaravanInventoryCategories />
          </motion.div>
        </div>
      </section>

      <BookingCTA />
    </>
  );
}

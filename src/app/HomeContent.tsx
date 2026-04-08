'use client';

import Image from 'next/image';
import Link from 'next/link';
import BookingCTA from '@/components/BookingCTA';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Shield,
  Truck,
  CheckCircle,
  Star,
  Users,
  CalendarDays,
  ArrowRight,
  Tent,
  Package,
  CreditCard,
  Camera,
  Heart,
  ThumbsUp,
  Clock,
  Wallet,
  Sun,
  MapPin,
  LayoutDashboard,
  Umbrella,
  ChevronDown,
  Armchair,
  UtensilsCrossed,
  Wine,
  Utensils,
  Scissors,
  Trash2,
  BedDouble,
} from 'lucide-react';
import type { Caravan } from '@/data/caravans';
import { destinations } from '@/data/destinations';
import BookingWidget from '@/components/BookingWidget';
import WeatherChecker from '@/components/WeatherChecker';
import { useLanguage } from '@/i18n/context';
import { GOOGLE_REVIEW_URL } from '@/lib/constants';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};




/* ------------------------------------------------------------------ */
/*  Slow-motion marquee — continuous CSS scroll, premium feel          */
/* ------------------------------------------------------------------ */
function SlowMarquee({ children, speed = 40, className = '' }: { children: React.ReactNode; speed?: number; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(speed);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // Calculate duration based on content width for consistent perceived speed
    const contentW = el.scrollWidth / 2; // half because we duplicate
    setDur(contentW / 35); // px per second ≈ 35 → slow & smooth
  }, [children]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        className="flex gap-4 w-max hover:[animation-play-state:paused] active:[animation-play-state:paused]"
        style={{ animation: `marquee-scroll ${dur}s linear infinite` }}
        onTouchStart={e => { (e.currentTarget.style.animationPlayState = 'paused'); }}
        onTouchEnd={e => { (e.currentTarget.style.animationPlayState = 'running'); }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Categorized inventory — borgchecker style, collapsible             */
/* ------------------------------------------------------------------ */
const inventoryCategories = [
  {
    label: 'Buiten',
    icon: <Armchair size={16} />,
    items: ['4 tuinstoelen', '1 tuintafel'],
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

function InventoryCategories() {
  const [openCat, setOpenCat] = useState<number | null>(null);

  return (
    <div className="bg-surface rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-primary/5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Package size={16} className="text-primary" /> Complete inventarislijst
        </h3>
        <p className="text-[11px] text-muted mt-0.5">{inventoryCategories.reduce((a, c) => a + c.items.length, 0)} items inbegrepen</p>
      </div>
      <div className="divide-y divide-gray-100">
        {inventoryCategories.map((cat, i) => {
          const isOpen = openCat === i;
          return (
            <div key={cat.label}>
              <button
                onClick={() => setOpenCat(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-primary">{cat.icon}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{cat.label}</span>
                <span className="text-[11px] text-muted mr-1">{cat.items.length}</span>
                <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
                  {cat.items.map(item => (
                    <span key={item} className="text-xs text-foreground-light bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
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


export default function HomeContent({ caravans }: { caravans: Caravan[] }) {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <>
      {/* ===== HERO with Booking Widget ===== */}
      <section ref={heroRef} className="relative min-h-[85svh] sm:min-h-[82svh] flex flex-col justify-end overflow-hidden">
        {/* Video background */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <div className="absolute inset-0 overflow-hidden">
            {/* Poster image fallback */}
            <img
              src="https://video.gumlet.io/69b470b7bf83f6c336bc88cc/69b49548dc37184fc78c660f/thumbnail-1-0.png?format=auto&ar=1920:1080&mode=crop&w=1600"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Mobile: native video with object-cover (fills portrait screen properly) */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover sm:hidden"
              poster="https://video.gumlet.io/69b470b7bf83f6c336bc88cc/69b49548dc37184fc78c660f/thumbnail-1-0.png?format=auto&ar=1920:1080&mode=crop&w=800"
            >
              <source src="https://video.gumlet.io/69b470b7bf83f6c336bc88cc/69b49548dc37184fc78c660f/main.m3u8" type="application/x-mpegURL" />
            </video>
            {/* Desktop: iframe (better quality, autoplay works reliably) */}
            <iframe
              src="https://play.gumlet.io/embed/69b49548dc37184fc78c660f?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p&t=30"
              title="Costa Brava hero video"
              allow="autoplay; fullscreen"
              loading="eager"
              className="border-0 absolute inset-0 w-full h-full scale-[1.4] hidden sm:block"
              style={{ pointerEvents: 'none' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20 sm:from-black/80 sm:via-black/40 sm:to-black/15" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8 sm:pb-12 w-full">
          <div className="max-w-2xl mb-5 sm:mb-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-xs mb-3"
            >
              <Sun size={12} className="text-primary-light" />
              <span className="hidden sm:inline">{t('nav.season')}</span>
              <span className="sm:hidden">{t('nav.seasonShort')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 tracking-tight"
            >
              {t('home.heroTitle1')}{' '}
              {t('home.heroTitle2')}
              <br />
              {t('home.heroTitle3')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-sm sm:text-base text-white/70 leading-relaxed max-w-lg"
            >
              {t('home.heroSubtitle')} <span className="text-white font-medium">{t('home.heroHighlight')}</span> {t('home.heroSuffix')}
            </motion.p>
          </div>

          {/* Booking Widget */}
          <BookingWidget />

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex items-center gap-5 sm:gap-6 mt-5"
          >
            {[
              { value: '30+', label: t('home.statCampings') },
              { value: '100%', label: t('home.statRelaxed') },
            ].map((stat, si) => (
              <div key={si} className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-white">{stat.value}</span>
                <span className="text-white/45 text-[11px] sm:text-xs">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

      </section>

      {/* ===== VOORDELEN / USP ===== */}
      <section className="py-14 sm:py-24 bg-surface relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.whyUsTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-4 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed">
              {t('home.whyUsSubtitle')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8"
          >
            {[
              {
                icon: <Tent size={24} />,
                title: t('home.uspReady'),
                desc: t('home.uspReadyDesc'),
                color: 'bg-primary',
              },
              {
                icon: <Package size={24} />,
                title: t('home.uspInventory'),
                desc: t('home.uspInventoryDesc'),
                color: 'bg-primary-dark',
              },
              {
                icon: <Camera size={24} />,
                title: t('home.uspPhotos'),
                desc: t('home.uspPhotosDesc'),
                color: 'bg-primary',
              },
              {
                icon: <Wallet size={24} />,
                title: t('home.uspPayment'),
                desc: t('home.uspPaymentDesc'),
                color: 'bg-primary',
              },
              {
                icon: <Shield size={24} />,
                title: t('home.uspDeposit'),
                desc: t('home.uspDepositDesc'),
                color: 'bg-primary-dark',
              },
              {
                icon: <Truck size={24} />,
                title: t('home.uspTransport'),
                desc: t('home.uspTransportDesc'),
                color: 'bg-primary-dark',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
                    <div className="text-white">{item.icon}</div>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-14 sm:py-24 overflow-hidden bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.howItWorksTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-4 max-w-lg mx-auto text-sm sm:text-lg">
              {t('home.howItWorksSubtitle')}
            </motion.p>
          </motion.div>

          {/* Desktop: horizontal */}
          <div className="hidden md:block">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
              className="grid grid-cols-5 gap-4 lg:gap-6"
            >
              {[
                { step: '1', title: t('home.step1'), desc: t('home.step1Desc'), icon: <Tent size={22} /> },
                { step: '2', title: t('home.step2'), desc: t('home.step2Desc'), icon: <Heart size={22} /> },
                { step: '3', title: t('home.step3'), desc: t('home.step3Desc'), icon: <CreditCard size={22} /> },
                { step: '4', title: t('home.step4'), desc: t('home.step4Desc'), icon: <LayoutDashboard size={22} /> },
                { step: '5', title: t('home.step5'), desc: t('home.step5Desc'), icon: <Star size={22} /> },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center relative group">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg transition-all duration-300">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('home.step')} {item.step}</div>
                  <h3 className="font-semibold text-foreground mb-1.5 text-sm lg:text-base">{item.title}</h3>
                  <p className="text-xs lg:text-sm text-muted">{item.desc}</p>
                  {i < 4 && (
                    <div className="absolute top-7 left-[60%] w-[80%] h-0.5 bg-primary/20" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile: compact vertical list */}
          <div className="md:hidden space-y-3">
              {[
                { step: '1', title: t('home.step1'), desc: t('home.step1Desc'), icon: <Tent size={18} /> },
                { step: '2', title: t('home.step2'), desc: t('home.step2Desc'), icon: <Heart size={18} /> },
                { step: '3', title: t('home.step3'), desc: t('home.step3Desc'), icon: <CreditCard size={18} /> },
                { step: '4', title: t('home.step4'), desc: t('home.step4Desc'), icon: <LayoutDashboard size={18} /> },
                { step: '5', title: t('home.step5'), desc: t('home.step5DescShort'), icon: <Star size={18} /> },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex items-start gap-3 bg-white rounded-xl p-3.5 shadow-sm border border-gray-100"
                >
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('home.step')} {item.step}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-[14px] leading-tight">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* ===== HERO IMAGE — car + caravan on the road ===== */}
      <section className="relative overflow-hidden">
        <div className="relative w-full aspect-[16/9] sm:aspect-[5/2]">
          <Image
            src="https://u.cubeupload.com/laurensbos/IMG3797.jpg"
            alt="Auto met caravan onderweg naar de Costa Brava"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-12 max-w-7xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-white/90 text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight"
            >
              {t('home.roadTripTitle')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/60 text-xs sm:text-sm mt-1"
            >
              {t('home.roadTripSubtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* ===== OUR CARAVANS — playful photo gallery ===== */}
      <section className="py-14 sm:py-24 bg-surface relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.featuredCaravansTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-4 max-w-xl mx-auto text-sm sm:text-lg">
              {t('home.featuredCaravansSubtitle')}
            </motion.p>
          </motion.div>

          {/* Info notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-8 max-w-2xl mx-auto"
          >
            <Users size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">{t('home.caravanAssignedNote')}</p>
          </motion.div>

          {/* Slow-motion photo marquee — premium sliding feel */}
          <SlowMarquee>
            {caravans.flatMap(c => c.photos).slice(0, 8).map((photo, i) => (
              <div
                key={i}
                className="shrink-0 w-[55vw] sm:w-[32vw] lg:w-[22vw] relative rounded-2xl overflow-hidden shadow-md aspect-[4/3]"
              >
                <Image
                  src={photo}
                  alt={`Caravan impressie ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 55vw, (max-width: 1024px) 32vw, 22vw"
                  className="object-cover"
                />
              </div>
            ))}
          </SlowMarquee>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-8 sm:mt-12"
          >
            <Link
              href="/boeken"
              className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm hover:bg-primary-dark"
            >
              {t('nav.bookNow')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== DESTINATIONS / CAMPINGS SECTION ===== */}
      <section className="py-14 sm:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.destinationsTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-4 max-w-xl mx-auto text-sm sm:text-lg">
              {t('home.destinationsSubtitle')}
            </motion.p>
          </motion.div>

          {/* Region cards — 3 columns on desktop, scroll on mobile */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-hide touch-pan-y">
            {[
              {
                region: 'Baix Empordà',
                img: '/images/campings/cala_d_aiguablava__begur.jpg',
                desc: t('destinations.regionBaixDesc'),
              },
              {
                region: 'Alt Empordà',
                img: '/images/campings/cap_de_creus_landscape.jpg',
                desc: t('destinations.regionAltDesc'),
              },
              {
                region: 'La Selva',
                img: '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg',
                desc: t('destinations.regionSelvaDesc'),
              },
            ].map((item, i) => {
              const regionDests = destinations.filter(d => d.region === item.region);
              return (
                <motion.div
                  key={item.region}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="snap-center shrink-0 w-[80vw] sm:w-auto"
                >
                  <Link href={`/bestemmingen#${item.region.toLowerCase().replace(/\s+/g, '-')}`} className="group block rounded-2xl overflow-hidden relative aspect-[4/3]">
                    <Image src={item.img} alt={item.region} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 640px) 80vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{item.region}</h3>
                      <p className="text-xs sm:text-[13px] text-white/70 line-clamp-2 mb-2">{item.desc}</p>
                      <div className="flex items-center gap-3 text-[11px] text-white/60">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {regionDests.length} {t('destinations.placesLabel').toLowerCase()}</span>
                        <span className="flex items-center gap-1"><Umbrella size={11} /> {regionDests.reduce((a, d) => a + d.beaches.length, 0)} {t('destinations.beaches')}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Featured destinations — compact row */}
          <div className="mt-8 sm:mt-12">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Star size={18} className="text-primary" /> {t('home.popularPlaces')}
            </h3>
            <SlowMarquee>
              {destinations.slice(0, 8).map((d, i) => (
                <div
                  key={d.slug}
                  className="shrink-0"
                >
                  <Link href={`/bestemmingen/${d.slug}`} className="group block w-[120px] sm:w-[140px]">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-1.5">
                      <Image src={d.heroImage} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="140px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground text-center truncate">{d.name}</h4>
                    <p className="text-[10px] text-muted text-center">{d.beaches.length} {t('destinations.beaches')}</p>
                  </Link>
                </div>
              ))}
            </SlowMarquee>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-8 sm:mt-10"
          >
            <Link
              href="/bestemmingen"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm hover:bg-primary-dark"
            >
              {t('home.allDestinations')} <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== INVENTORY SECTION ===== */}
      <section className="py-14 sm:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.inventoryTitle')}
            </h2>
            <p className="text-muted text-sm sm:text-lg mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed">
              {t('home.inventorySubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Caravan video */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
                <iframe
                  src="https://play.gumlet.io/embed/69b48353bf83f6c336be24eb?background=true&disable_player_controls=true&preload=true&subtitles=off&resolution=1080p"
                  title="Caravan interieur volledig ingericht"
                  allow="autoplay"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ pointerEvents: 'none' }}
                />
                <div className="absolute inset-0 z-10" />
              </div>
              <Link
                href="/boeken"
                className="inline-flex items-center gap-2 mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm shadow-lg"
              >
                {t('nav.bookNow')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Categorized inventory list */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <InventoryCategories />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES HIGHLIGHT ===== */}
      <section className="py-14 sm:py-24 text-white overflow-hidden relative">
        {/* Background photo */}
        <div className="absolute inset-0 bg-[url('/images/campings/platja_gran_platja_d_aro.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-primary/85" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">{t('home.advantagesTitle')}</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: <Clock size={22} />, title: t('home.advNoHassle'), desc: t('home.advNoHassleDesc') },
              { icon: <ThumbsUp size={22} />, title: t('home.advReliable'), desc: t('home.advReliableDesc') },
              { icon: <Wallet size={22} />, title: t('home.advAffordable'), desc: t('home.advAffordableDesc') },
              { icon: <Shield size={22} />, title: t('home.advSafePayment'), desc: t('home.advSafePaymentDesc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6"
              >
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/15 rounded-xl flex items-center justify-center mb-2.5 sm:mb-4 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* 20+ jaar ervaring banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 sm:mt-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center"
          >
            <p className="text-sm sm:text-base text-primary-light/80 leading-relaxed">
              <span className="text-white font-bold">{t('home.advExperience')}</span> {t('home.advExperienceDesc')}{' '}
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary-light underline underline-offset-2 transition-colors">
                caravanstalling-spanje.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== WEATHER CHECKER ===== */}
      <WeatherChecker />

      {/* ===== REVIEWS / SOCIAL PROOF ===== */}
      <section className="py-14 sm:py-24 bg-surface overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              {t('home.reviewsTitle2')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted mt-4 max-w-lg mx-auto text-sm sm:text-lg">
              {t('home.reviewsSubtitle2')}
            </motion.p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible scrollbar-hide">
            {[
              {
                name: t('home.review1Name'),
                location: t('home.review1Location'),
                rating: 5,
                text: t('home.review1Text'),
                date: t('home.review1Date'),
              },
              {
                name: t('home.review2Name'),
                location: t('home.review2Location'),
                rating: 5,
                text: t('home.review2Text'),
                date: t('home.review2Date'),
              },
              {
                name: t('home.review5Name'),
                location: t('home.review5Location'),
                rating: 5,
                text: t('home.review5Text'),
                date: t('home.review5Date'),
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl p-5 sm:p-6 shadow-sm relative"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, s) => (
                    <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{review.name}</div>
                    <div className="text-xs text-muted flex items-center gap-1"><MapPin size={10} />{review.location}</div>
                  </div>
                  <span className="text-xs text-muted">{review.date}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Google Review CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 sm:mt-14 text-center"
          >
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              {t('home.reviewCtaButton')} <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <BookingCTA />
    </>
  );
}

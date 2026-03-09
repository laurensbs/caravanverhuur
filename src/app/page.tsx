'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
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
  Quote,
  Sun,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import { caravans as staticCaravans } from '@/data/caravans';
import type { Caravan } from '@/data/caravans';
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

// Decorative floating blob component
const FloatingBlob = ({ className = '' }: { className?: string }) => (
  <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
);

// WhatsApp SVG icon component
const WhatsAppIcon = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Decorative wave SVG for section transitions
const WaveDivider = ({ className = '', flip = false }: { className?: string; flip?: boolean }) => (
  <div className={`absolute left-0 right-0 overflow-hidden leading-none ${flip ? 'top-0 rotate-180' : 'bottom-0'} ${className}`}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[60px] lg:h-[80px]">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="currentColor" />
    </svg>
  </div>
);

// Section label component for consistent styling
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-primary font-bold text-xs sm:text-xs uppercase tracking-[0.15em]">
    <span className="w-8 h-[2px] bg-primary/40 rounded-full" />
    {children}
    <span className="w-8 h-[2px] bg-primary/40 rounded-full" />
  </span>
);

export default function HomePage() {
  const { t } = useLanguage();
  const [customCaravans, setCustomCaravans] = useState<Caravan[]>([]);
  useEffect(() => {
    fetch('/api/admin/caravans')
      .then(res => res.json())
      .then(data => setCustomCaravans(data.caravans || []))
      .catch((e) => console.error('Fetch error:', e));
  }, []);
  const caravans = useMemo(() => [...staticCaravans, ...customCaravans], [customCaravans]);
  const featuredCaravans = caravans.filter(c => c.status === 'BESCHIKBAAR').slice(0, 3);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <>
      {/* ===== HERO with Booking Widget ===== */}
      <section ref={heroRef} className="relative min-h-[105svh] sm:min-h-[100svh] flex flex-col justify-center overflow-hidden">
        {/* Parallax background */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Lloret_de_Mar_-_Panorama_of_main_beach.jpg/1280px-Lloret_de_Mar_-_Panorama_of_main_beach.jpg"
            alt={t('home.heroAlt')}
            fill
            className="object-cover"
            sizes="100vw"
            priority
           
          />
          {/* Layered gradient overlay for depth */}
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        {/* Floating decorative particles */}
        <motion.div
          className="absolute top-1/4 right-[15%] w-2 h-2 bg-white/30 rounded-full z-[5] hidden lg:block"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-[25%] w-3 h-3 bg-white/15 rounded-full z-[5] hidden lg:block"
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute bottom-1/3 right-[20%] w-1.5 h-1.5 bg-white/20 rounded-full z-[5] hidden lg:block"
          animate={{ y: [0, -25, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 2 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 pb-16 sm:pt-10 sm:pb-20 w-full">
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white/90 text-xs sm:text-sm mb-4 sm:mb-6"
            >
              <Sun size={14} className="text-primary-light animate-pulse-soft" />
              <span className="hidden sm:inline">{t('nav.season')}</span>
              <span className="sm:hidden">{t('nav.seasonShort')}</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span className="text-primary-light text-xs font-semibold">{t('nav.popularThisWeek')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-4 sm:mb-6 tracking-tight"
            >
              {t('home.heroTitle1')}
              <span className="block sm:inline text-white/95"> {t('home.heroTitle2')}</span>
              <br className="hidden sm:block" />
              <span className="text-white/90"> {t('home.heroTitle3')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-light"
            >
              {t('home.heroSubtitle')} <span className="text-white font-medium">{t('home.heroHighlight')}</span> {t('home.heroSuffix')}
            </motion.p>

            {/* Mobile stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="grid grid-cols-3 gap-4 max-w-xs mx-auto lg:mx-0 mb-8 lg:hidden"
            >
              {[
                { value: '4', label: t('home.statCaravans'), color: 'text-primary-light' },
                { value: '30+', label: t('home.statCampings'), color: 'text-white/80' },
                { value: '100%', label: t('home.statRelaxed'), color: 'text-primary-light' },
              ].map((stat, si) => (
                <div key={si} className="text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Booking Widget */}
          <BookingWidget />

          {/* Desktop stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className="hidden lg:flex gap-8 mt-8 max-w-md"
          >
            {[
              { value: '4', label: t('home.statCaravansAvailable'), color: 'text-primary-light' },
              { value: '30+', label: t('home.statCampingsCB'), color: 'text-white/80' },
              { value: '100%', label: t('home.statFullyRelaxed'), color: 'text-primary-light' },
            ].map((stat, si) => (
              <div key={si}>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-white/60 text-xs">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' as const }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/70 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Wave transition to next section */}
        <WaveDivider className="text-warm z-10" />
      </section>

      {/* ===== VOORDELEN / USP ===== */}
      <section className="py-14 sm:py-24 bg-surface relative overflow-hidden">
        {/* Decorative background blobs */}
        <FloatingBlob className="w-72 h-72 bg-primary/30 -top-20 -left-20" />
        <FloatingBlob className="w-56 h-56 bg-primary/20 bottom-10 right-10" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.div variants={fadeUp} custom={0}>
              <SectionLabel>{t('home.whyUs')}</SectionLabel>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 tracking-tight">
              {t('home.whyUsTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-4 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed">
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
                <div className={`w-10 h-10 sm:w-14 sm:h-14 ${item.color} rounded-xl flex items-center justify-center mb-3 sm:mb-5 shadow-md transition-transform duration-300`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-foreground mb-1.5 sm:mb-3">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <WaveDivider className="text-white" />
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
            <motion.div variants={fadeUp} custom={0}>
              <SectionLabel>{t('home.howItWorks')}</SectionLabel>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 tracking-tight">
              {t('home.howItWorksTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-4 max-w-lg mx-auto text-sm sm:text-lg">
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
                { step: '1', title: t('home.step1'), desc: t('home.step1Desc'), icon: <Heart size={22} /> },
                { step: '2', title: t('home.step2'), desc: t('home.step2Desc'), icon: <CalendarDays size={22} /> },
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

          {/* Mobile: vertical timeline */}
          <div className="md:hidden space-y-0">
            {[
              { step: '1', title: t('home.step1'), desc: t('home.step1Desc'), icon: <Heart size={18} /> },
              { step: '2', title: t('home.step2'), desc: t('home.step2Desc'), icon: <CalendarDays size={18} /> },
              { step: '3', title: t('home.step3'), desc: t('home.step3Desc'), icon: <CreditCard size={18} /> },
              { step: '4', title: t('home.step4'), desc: t('home.step4Desc'), icon: <LayoutDashboard size={18} /> },
              { step: '5', title: t('home.step5'), desc: t('home.step5DescShort'), icon: <Star size={18} /> },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex gap-4 relative"
              >
                {/* Line */}
                {i < 4 && (
                  <div className="absolute left-[19px] top-10 w-0.5 h-full bg-primary/20" />
                )}
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shrink-0 z-10">
                  {item.icon}
                </div>
                <div className="pb-6">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">{t('home.step')} {item.step}</div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED CARAVANS ===== */}
      <section className="py-14 sm:py-24 bg-surface relative overflow-hidden">
        <FloatingBlob className="w-80 h-80 bg-primary/15 -top-40 right-0" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.div variants={fadeUp} custom={0}>
              <SectionLabel>{t('home.featuredCaravans')}</SectionLabel>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 tracking-tight">
              {t('home.featuredCaravansTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-4 max-w-xl mx-auto text-sm sm:text-lg">
              {t('home.featuredCaravansSubtitle')}
            </motion.p>
          </motion.div>

          {/* Mobile: horizontal scroll / Desktop: grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 sm:overflow-visible scrollbar-hide">
            {featuredCaravans.map((caravan, i) => (
              <motion.div
                key={caravan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl overflow-hidden shadow-md"
              >
                <div className="relative h-44 sm:h-56 overflow-hidden">
                  <Image
                    src={caravan.photos[0]}
                    alt={caravan.name}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out"
                   
                  />
                  {/* Warm gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/20" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs sm:text-xs font-semibold text-white shadow-md ${
                      caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-primary-light'
                    }`}>
                      {caravan.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md">
                    <span className="text-xs sm:text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}<span className="text-muted font-normal">{t('home.perWeek')}</span></span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-sm sm:text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted mb-2 sm:mb-3">
                    <span className="flex items-center gap-1"><Users size={12} className="text-primary" /> Max {caravan.maxPersons}</span>
                    <span>{caravan.manufacturer}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4 line-clamp-2 hidden sm:block">{caravan.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                    {caravan.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary-50 text-primary-dark rounded-md">{a}</span>
                    ))}
                    {caravan.amenities.length > 3 && (
                      <span className="text-xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Link
                      href={`/caravans/${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 border-2 border-primary text-primary font-semibold rounded-xl transition-all duration-200 text-xs sm:text-sm"
                    >
                      {t('caravans.details')}
                    </Link>
                    <Link
                      href={`/boeken?caravan=${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 bg-primary text-white font-semibold rounded-xl transition-all duration-200 text-xs sm:text-sm shadow-md"
                    >
                      {t('nav.bookNow')}
                    </Link>
                  </div>
                  <p className="text-xs text-muted text-center mt-2">{t('caravans.orSimilar')}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-8 sm:mt-12"
          >
            <Link
              href="/caravans"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-primary text-primary font-semibold rounded-full transition-all duration-300 text-sm"
            >
              {t('home.allCaravans')}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== INVENTORY SECTION ===== */}
      <section className="py-14 sm:py-24 bg-white relative overflow-hidden">
        <FloatingBlob className="w-64 h-64 bg-primary/15 top-20 -right-20" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <SectionLabel>{t('home.inventoryLabel')}</SectionLabel>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-4 sm:mb-6 tracking-tight">
                {t('home.inventoryTitle')}
              </h2>
              <p className="text-muted text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed">
                {t('home.inventorySubtitle')}
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {[
                  t('home.inventoryItem1'),
                  t('home.inventoryItem2'),
                  t('home.inventoryItem3'),
                  t('home.inventoryItem4'),
                  t('home.inventoryItem5'),
                  t('home.inventoryItem6'),
                  t('home.inventoryItem7'),
                  t('home.inventoryItem8'),
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-1.5 sm:gap-2"
                  >
                    <CheckCircle size={14} className="text-primary shrink-0 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/caravans"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm shadow-lg"
              >
                {t('home.inventoryViewCaravans')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Golfo_de_Rosas.jpg/1280px-Golfo_de_Rosas.jpg"
                  alt="Caravan interieur volledig ingericht"
                  width={600}
                  height={400}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full object-cover transition-transform duration-700"
                 
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-primary/10" />

            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES HIGHLIGHT ===== */}
      <section className="py-14 sm:py-24 bg-primary text-white overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-white/20" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-flex items-center gap-1.5 text-white/60 font-bold text-xs sm:text-xs uppercase tracking-[0.15em]">
              <span className="w-8 h-[2px] bg-white/30 rounded-full" />
              {t('home.advantagesLabel')}
              <span className="w-8 h-[2px] bg-white/30 rounded-full" />
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mt-3 tracking-tight">{t('home.advantagesTitle')}</h2>
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
        {/* Decorative floating circles */}
        <motion.div
          className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.08, 0.05] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut', delay: 4 }}
        />
      </section>

      {/* ===== WEATHER CHECKER ===== */}
      <WeatherChecker />

      {/* ===== REVIEWS / SOCIAL PROOF ===== */}
      <section className="py-14 sm:py-24 bg-surface overflow-hidden relative">
        <FloatingBlob className="w-64 h-64 bg-primary/10 -top-20 left-1/3" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.div variants={fadeUp} custom={0}>
              <SectionLabel>{t('home.reviewsLabel')}</SectionLabel>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 tracking-tight">
              {t('home.reviewsTitle2')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-4 max-w-lg mx-auto text-sm sm:text-lg">
              {t('home.reviewsSubtitle2')}
            </motion.p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible scrollbar-hide">
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
                name: t('home.review3Name'),
                location: t('home.review3Location'),
                rating: 4,
                text: t('home.review3Text'),
                date: t('home.review3Date'),
              },
              {
                name: t('home.review4Name'),
                location: t('home.review4Location'),
                rating: 5,
                text: t('home.review4Text'),
                date: t('home.review4Date'),
              },
              {
                name: t('home.review5Name'),
                location: t('home.review5Location'),
                rating: 5,
                text: t('home.review5Text'),
                date: t('home.review5Date'),
              },
              {
                name: t('home.review6Name'),
                location: t('home.review6Location'),
                rating: 5,
                text: t('home.review6Text'),
                date: t('home.review6Date'),
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-300 relative"
              >

                <Quote size={32} className="absolute top-4 right-4 text-primary/10" />
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted bg-surface-alt px-2 py-1 rounded-full">{review.date}</span>
                    <span className="text-xs text-primary flex items-center gap-0.5"><CheckCircle size={10} />{t('home.reviewVerified')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 sm:mt-14 flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap sm:justify-center sm:overflow-visible scrollbar-hide"
          >
            {[
              { icon: <Shield size={18} className="text-primary" />, text: t('home.trustSafePayment') },
              { icon: <CheckCircle size={18} className="text-primary" />, text: t('home.trustFullInventory') },
              { icon: <Star size={18} className="text-amber-400 fill-amber-400" />, text: t('home.trustRating') },
              { icon: <Users size={18} className="text-primary" />, text: t('home.trustGuests') },
              { icon: <Clock size={18} className="text-primary" />, text: t('home.trustExperience') },
            ].map((badge, bi) => (
              <div key={bi} className="snap-center shrink-0 flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </motion.div>

          {/* Google Review CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 sm:mt-14 text-center"
          >
            <div className="inline-flex flex-col items-center bg-white rounded-2xl px-8 py-6 shadow-sm border border-gray-100">
              <p className="text-foreground font-semibold text-sm sm:text-base mb-1">{t('home.reviewCta')}</p>
              <p className="text-muted text-xs sm:text-sm mb-4">{t('home.reviewCtaSub')}</p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#EA4335] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#d33426] transition-colors"
              >
                <svg viewBox="0 0 24 24" width={18} height={18} fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {t('home.reviewCtaButton')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

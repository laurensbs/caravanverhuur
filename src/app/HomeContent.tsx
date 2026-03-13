'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
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


export default function HomeContent({ caravans }: { caravans: Caravan[] }) {
  const { t } = useLanguage();
  const featuredCaravans = caravans.filter(c => c.status === 'BESCHIKBAAR').slice(0, 3);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <>
      {/* ===== HERO with Booking Widget ===== */}
      <section ref={heroRef} className="relative min-h-[85svh] sm:min-h-[82svh] flex flex-col justify-end overflow-hidden">
        {/* Video background */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <div className="absolute inset-[-100%] sm:inset-[-20%] w-[300%] sm:w-[140%] h-[300%] sm:h-[140%]">
            <iframe
              src="https://play.gumlet.io/embed/69b49548dc37184fc78c660f?background=true&preload=true&t=30"
              title="Costa Brava hero video"
              allow="autoplay"
              loading="eager"
              className="w-full h-full border-0"
              style={{ pointerEvents: 'none' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8 sm:pb-12 w-full">
          <div className="max-w-2xl mb-5 sm:mb-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-xs mb-3"
            >
              <Sun size={12} className="text-primary-light" />
              <span className="hidden sm:inline">{t('nav.season')}</span>
              <span className="sm:hidden">{t('nav.seasonShort')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 tracking-tight"
            >
              {t('home.heroTitle1')}{' '}
              {t('home.heroTitle2')}
              <br />
              {t('home.heroTitle3')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
              { value: '4', label: t('home.statCaravans') },
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

          {/* Mobile: horizontal scroll / Desktop: grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8 sm:overflow-visible scrollbar-hide">
            {featuredCaravans.map((caravan, i) => (
              <motion.div
                key={caravan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl overflow-hidden shadow-md flex flex-col"
              >
                <div className="relative h-44 sm:h-56 overflow-hidden">
                  {caravan.videoUrl?.includes('gumlet.tv') ? (() => {
                    const gMatch = caravan.videoUrl!.match(/gumlet\.tv\/watch\/(\w+)/);
                    return gMatch ? (
                      <div className="absolute inset-0 overflow-hidden">
                        <iframe
                          src={`https://play.gumlet.io/embed/${gMatch[1]}?background=true&preload=true`}
                          title={caravan.name}
                          allow="autoplay"
                          loading="lazy"
                          className="absolute inset-0 w-full h-full border-0 scale-[1.5] origin-center"
                          style={{ pointerEvents: 'none' }}
                        />
                        <div className="absolute inset-0 z-10" />
                      </div>
                    ) : (
                      <Image src={caravan.photos[0]} alt={caravan.name} fill sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    );
                  })() : (
                    <Image
                      src={caravan.photos[0]}
                      alt={caravan.name}
                      fill
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out"
                    />
                  )}
                  {/* Subtle gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />

                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md">
                    <span className="text-xs sm:text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}<span className="text-muted font-normal">{t('home.perWeek')}</span></span>
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-sm sm:text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted mb-2 sm:mb-3">
                    <span className="flex items-center gap-1"><Users size={12} className="text-primary" /> Max {caravan.maxPersons}</span>
                    <span>{caravan.manufacturer}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4 line-clamp-2 hidden sm:block sm:min-h-[2.5rem]">{caravan.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                    {caravan.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary-50 text-primary-dark rounded-md">{a}</span>
                    ))}
                    {caravan.amenities.length > 3 && (
                      <span className="text-xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2 sm:gap-3 mt-auto">
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
              className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm hover:bg-primary-dark"
            >
              {t('home.allCaravans')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== INVENTORY SECTION ===== */}
      <section className="py-14 sm:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 sm:mb-6 tracking-tight">
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
                <iframe
                  src="https://play.gumlet.io/embed/69b48353bf83f6c336be24eb?background=true&preload=true"
                  title="Caravan interieur volledig ingericht"
                  allow="autoplay"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-0 scale-[1.15] origin-center"
                  style={{ pointerEvents: 'none' }}
                />
                <div className="absolute inset-0 z-10" />
              </div>
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
    </>
  );
}

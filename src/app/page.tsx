'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
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
  Sparkles,
  ThumbsUp,
  Clock,
  Wallet,
  Quote,
  Sun,
  MapPin,
} from 'lucide-react';
import { caravans } from '@/data/caravans';
import BookingWidget from '@/components/BookingWidget';
import WeatherChecker from '@/components/WeatherChecker';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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

export default function HomePage() {
  const featuredCaravans = caravans.filter(c => c.status === 'BESCHIKBAAR').slice(0, 3);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <>
      {/* ===== HERO with Booking Widget ===== */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
        {/* Parallax background */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <Image
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600&q=80"
            alt="Camping Costa Brava"
            fill
            className="object-cover scale-110"
            priority
            unoptimized
          />
          {/* Warmer, lighter overlay so the image shines through */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-primary-dark/40 to-black/70 sm:bg-gradient-to-r sm:from-black/70 sm:via-primary-dark/50 sm:to-transparent" />
          {/* Warm color wash */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/10" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-20 w-full">
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white/90 text-xs sm:text-sm mb-4 sm:mb-6 border border-white/25"
            >
              <Sun size={14} className="text-amber-300" />
              Seizoen 2026 – nu boeken!
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6"
            >
              Zorgeloze
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400"> caravanvakantie</span>
              <br className="hidden sm:block" /> op de Costa Brava
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-sm sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Jouw caravan staat klaar op de camping. Volledig ingericht met inventaris, beddengoed en kookgerei. Geen transport, geen gedoe – alleen genieten.
            </motion.p>

            {/* Mobile stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="grid grid-cols-3 gap-4 max-w-xs mx-auto lg:mx-0 mb-8 lg:hidden"
            >
              {[
                { value: '6+', label: 'Caravans', color: 'text-cyan-300' },
                { value: '30+', label: 'Campings', color: 'text-amber-300' },
                { value: '100%', label: 'Ontzorgd', color: 'text-emerald-300' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/60 text-[11px]">{stat.label}</div>
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
              { value: '6+', label: 'Caravans beschikbaar', color: 'text-cyan-300' },
              { value: '30+', label: 'Campings Costa Brava', color: 'text-amber-300' },
              { value: '100%', label: 'Volledig ontzorgd', color: 'text-emerald-300' },
            ].map(stat => (
              <div key={stat.label}>
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
      <section className="py-12 sm:py-20 bg-warm relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Waarom kiezen voor ons
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
              Volledig ontzorgd op vakantie
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-3 max-w-2xl mx-auto text-sm sm:text-lg">
              Wij regelen alles zodat jij alleen maar hoeft te genieten van de zon, zee en strand op de Costa Brava.
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
                title: 'Klaar op de camping',
                desc: 'Je caravan staat al klaar op de camping van je keuze. Gewoon uitstappen en genieten.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
              },
              {
                icon: <Package size={24} />,
                title: 'Volledige inventaris',
                desc: 'Beddengoed, kookgerei, servies, handdoeken – alles aanwezig. Niets meenemen.',
                color: 'text-sky-500',
                bg: 'bg-sky-50',
              },
              {
                icon: <Camera size={24} />,
                title: "Foto's vooraf",
                desc: "Foto's van exact jouw caravan of een vergelijkbare. Geen verrassingen.",
                color: 'text-violet-500',
                bg: 'bg-violet-50',
              },
              {
                icon: <Wallet size={24} />,
                title: 'Flexibel betalen',
                desc: '30% aanbetaling, restbedrag vlak voor je vakantie. Veilig via Stripe.',
                color: 'text-amber-500',
                bg: 'bg-amber-50',
              },
              {
                icon: <Shield size={24} />,
                title: 'Borg bescherming',
                desc: 'Duidelijke borgvoorwaarden. Na controle krijg je je borg volledig retour.',
                color: 'text-primary',
                bg: 'bg-cyan-50',
              },
              {
                icon: <Truck size={24} />,
                title: 'Transport mogelijk',
                desc: 'Via Caravanstalling-Spanje kun je optioneel transport boeken.',
                color: 'text-rose-500',
                bg: 'bg-rose-50',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={scaleIn}
                custom={i}
                className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 group"
              >
                <div className={`w-10 h-10 sm:w-14 sm:h-14 ${item.bg} rounded-xl flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-all duration-300`}>
                  <div className={item.color}>{item.icon}</div>
                </div>
                <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground mb-1.5 sm:mb-3">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <WaveDivider className="text-white" />
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-12 sm:py-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Hoe het werkt
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
              In 5 stappen op vakantie
            </motion.h2>
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
                { step: '1', title: 'Caravan kiezen', desc: 'Bekijk ons aanbod en kies de caravan die bij je past.', icon: <Heart size={22} />, gradient: 'from-rose-400 to-pink-500' },
                { step: '2', title: 'Datum & camping', desc: 'Kies je datum en camping op de Costa Brava.', icon: <CalendarDays size={22} />, gradient: 'from-amber-400 to-orange-500' },
                { step: '3', title: 'Aanbetalen', desc: 'Betaal 30% aanbetaling per bank of cash.', icon: <CreditCard size={22} />, gradient: 'from-cyan-400 to-primary' },
                { step: '4', title: 'Restbedrag', desc: 'Betaal het restbedrag via Stripe.', icon: <CheckCircle size={22} />, gradient: 'from-emerald-400 to-teal-500' },
                { step: '5', title: 'Genieten!', desc: 'Je caravan staat klaar. Uitstappen en genieten!', icon: <Star size={22} />, gradient: 'from-yellow-400 to-amber-500' },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center relative">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Stap {item.step}</div>
                  <h3 className="font-semibold text-foreground mb-1.5 text-sm lg:text-base">{item.title}</h3>
                  <p className="text-xs lg:text-sm text-muted">{item.desc}</p>
                  {i < 4 && (
                    <div className="absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="md:hidden space-y-0">
            {[
              { step: '1', title: 'Caravan kiezen', desc: 'Bekijk ons aanbod en kies de caravan die bij je past.', icon: <Heart size={18} />, gradient: 'from-rose-400 to-pink-500' },
              { step: '2', title: 'Datum & camping', desc: 'Kies je datum en camping op de Costa Brava.', icon: <CalendarDays size={18} />, gradient: 'from-amber-400 to-orange-500' },
              { step: '3', title: 'Aanbetalen', desc: 'Betaal 30% aanbetaling per bank of cash.', icon: <CreditCard size={18} />, gradient: 'from-cyan-400 to-primary' },
              { step: '4', title: 'Restbedrag', desc: 'Betaal het restbedrag via Stripe.', icon: <CheckCircle size={18} />, gradient: 'from-emerald-400 to-teal-500' },
              { step: '5', title: 'Genieten!', desc: 'Je caravan staat klaar!', icon: <Star size={18} />, gradient: 'from-yellow-400 to-amber-500' },
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
                  <div className="absolute left-[19px] top-10 w-0.5 h-full bg-gradient-to-b from-border to-transparent" />
                )}
                <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center text-white shadow-lg shrink-0 z-10`}>
                  {item.icon}
                </div>
                <div className="pb-6">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Stap {item.step}</div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED CARAVANS ===== */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-surface to-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Ons aanbod
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
              Uitgelichte caravans
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted mt-3 max-w-xl mx-auto text-sm sm:text-lg">
              Goed onderhouden, volledig uitgerust en klaar voor jouw vakantie.
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
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 border border-border/50 group"
              >
                <div className="relative h-44 sm:h-56 overflow-hidden">
                  <Image
                    src={caravan.photos[0]}
                    alt={caravan.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    unoptimized
                  />
                  {/* Warm gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-white shadow-md ${
                      caravan.type === 'LUXE' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                      caravan.type === 'FAMILIE' ? 'bg-gradient-to-r from-cyan-500 to-primary' : 'bg-gradient-to-r from-emerald-400 to-green-500'
                    }`}>
                      {caravan.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md">
                    <span className="text-xs sm:text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}<span className="text-muted font-normal">/week</span></span>
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
                      <span key={a} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-cyan-50 text-primary-dark rounded-md">{a}</span>
                    ))}
                    {caravan.amenities.length > 3 && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Link
                      href={`/caravans/${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-200 text-xs sm:text-sm"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/boeken?caravan=${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-xl transition-all duration-200 text-xs sm:text-sm active:scale-95 shadow-md"
                    >
                      Boek Nu
                    </Link>
                  </div>
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
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-300 text-sm active:scale-95"
            >
              Bekijk alle caravans
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== INVENTORY SECTION ===== */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider">Volledig uitgerust</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2 mb-4 sm:mb-6">
                Alles inbegrepen in elke caravan
              </h2>
              <p className="text-muted text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed">
                Je hoeft niets mee te nemen. Al onze caravans zijn voorzien van een complete inventaris.
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {[
                  { item: 'Dekbedden & kussens', color: 'text-cyan-500' },
                  { item: 'Volledig servies', color: 'text-amber-500' },
                  { item: 'Kookgerei & pannen', color: 'text-emerald-500' },
                  { item: 'Handdoeken', color: 'text-sky-500' },
                  { item: 'Verwarming & gas', color: 'text-orange-500' },
                  { item: 'Elektra & accu', color: 'text-violet-500' },
                  { item: 'Rolgordijnen & horren', color: 'text-rose-500' },
                  { item: 'Schoonmaakmiddelen', color: 'text-teal-500' },
                ].map((entry, i) => (
                  <motion.div
                    key={entry.item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-1.5 sm:gap-2"
                  >
                    <CheckCircle size={14} className={`${entry.color} shrink-0 sm:w-[18px] sm:h-[18px]`} />
                    <span className="text-xs sm:text-sm text-foreground">{entry.item}</span>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/caravans"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold rounded-full transition-all duration-300 text-sm active:scale-95 shadow-lg"
              >
                Bekijk onze caravans
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80"
                  alt="Caravan interieur"
                  width={600}
                  height={400}
                  className="w-full object-cover"
                  unoptimized
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-gradient-to-br from-primary-light/20 to-accent/20" />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-border/50"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-xs sm:text-base">100% Compleet</div>
                    <div className="text-[10px] sm:text-sm text-muted">Inventaris gecontroleerd</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES HIGHLIGHT ===== */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-primary-dark via-primary to-cyan-400 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-amber-300 font-semibold text-xs sm:text-sm uppercase tracking-wider">De voordelen</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">Waarom bij ons huren?</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: <Clock size={22} />, title: 'Geen gedoe', desc: 'Geen transport, geen opbouwen. Alles staat klaar.', accent: 'group-hover:bg-amber-400/30' },
              { icon: <ThumbsUp size={22} />, title: 'Betrouwbaar', desc: 'Onderdeel van Caravanstalling-Spanje. Bewezen kwaliteit.', accent: 'group-hover:bg-emerald-400/30' },
              { icon: <Wallet size={22} />, title: 'Betaalbaar', desc: 'Eerlijke prijzen inclusief volledige inventaris.', accent: 'group-hover:bg-cyan-400/30' },
              { icon: <Shield size={22} />, title: 'Veilig betalen', desc: 'Stripe PCI-compliant. 3D Secure. Borg bescherming.', accent: 'group-hover:bg-rose-400/30' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`w-9 h-9 sm:w-12 sm:h-12 bg-white/15 rounded-xl flex items-center justify-center mb-2.5 sm:mb-4 group-hover:scale-110 transition-all duration-300 ${item.accent}`}>
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-cyan-100 text-[11px] sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* 20+ jaar ervaring banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 sm:mt-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/15 text-center"
          >
            <p className="text-sm sm:text-base text-cyan-100 leading-relaxed">
              <span className="text-white font-bold">Meer dan 20 jaar actief</span> in de caravansbranche in de Costa Brava.
              Onderdeel van{' '}
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline underline-offset-2 hover:text-white transition-colors">
                caravanstalling-spanje.com
              </a>
            </p>
          </motion.div>
        </div>
        {/* Decorative blurred circles */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
      </section>

      {/* ===== WEATHER CHECKER ===== */}
      <WeatherChecker />

      {/* ===== REVIEWS / SOCIAL PROOF ===== */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-warm to-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Ervaringen
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
              Wat onze gasten zeggen
            </motion.h2>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible scrollbar-hide">
            {[
              {
                name: 'Familie de Vries',
                location: 'Utrecht',
                rating: 5,
                text: 'Fantastische ervaring! De caravan stond helemaal klaar met alles erop en eraan. De kinderen vonden het geweldig. Zeker een aanrader!',
                date: 'Augustus 2025',
              },
              {
                name: 'Mark & Lisa',
                location: 'Amsterdam',
                rating: 5,
                text: 'Super makkelijk geboekt en alles was perfect geregeld. Geen stress met transport of opbouwen. Gewoon uitstappen en genieten van de zon.',
                date: 'Juli 2025',
              },
              {
                name: 'Familie Bakker',
                location: 'Rotterdam',
                rating: 5,
                text: 'De camping was prachtig en de caravan was schoon en compleet ingericht. De communicatie verliep heel vlot. Volgend jaar boeken we weer!',
                date: 'September 2025',
              },
              {
                name: 'Jan & Petra',
                location: 'Den Haag',
                rating: 5,
                text: 'Wat een service! Alles was tot in de puntjes geregeld. De inventaris was compleet en de locatie op de camping was top.',
                date: 'Juni 2025',
              },
              {
                name: 'Familie Jansen',
                location: 'Eindhoven',
                rating: 5,
                text: 'Onze derde keer en weer helemaal tevreden. De kinderen vragen elk jaar opnieuw om een caravanvakantie aan de Costa Brava.',
                date: 'Augustus 2025',
              },
              {
                name: 'Sophie & Tom',
                location: 'Groningen',
                rating: 5,
                text: 'Beste vakantie ooit! Geen gedoe met slepen, alles stond al klaar. Het voelde als thuiskomen. Absolute aanrader!',
                date: 'Juli 2025',
              },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-border/50 hover:shadow-xl transition-all duration-300 relative group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-accent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <span className="text-[10px] text-muted bg-warm px-2 py-1 rounded-full">{review.date}</span>
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
              { icon: <Shield size={18} className="text-primary" />, text: 'Veilig betalen via Stripe' },
              { icon: <CheckCircle size={18} className="text-emerald-500" />, text: 'Volledige inventaris' },
              { icon: <Star size={18} className="text-amber-500 fill-amber-500" />, text: '5/5 beoordeling' },
              { icon: <Users size={18} className="text-primary" />, text: '100+ tevreden gasten' },
              { icon: <Clock size={18} className="text-violet-500" />, text: '20+ jaar ervaring' },
            ].map(badge => (
              <div key={badge.text} className="snap-center shrink-0 flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm border border-border/50 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap hover:shadow-md transition-shadow">
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent to-amber-400 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg"
            >
              <Sun className="text-white" size={28} />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Klaar voor jouw zorgeloze vakantie?
            </h2>
            <p className="text-muted text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
              Boek nu je caravan op de Costa Brava. Seizoen 2026 is beschikbaar!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/boeken"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 sm:hover:-translate-y-1 text-base sm:text-lg active:scale-95"
              >
                Start met boeken
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-300 text-base sm:text-lg active:scale-95"
              >
                Neem contact op
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== WHATSAPP FLOATING BUTTON ===== */}
      <motion.a
        href="https://wa.me/34600000000?text=Hallo%2C%20ik%20heb%20interesse%20in%20het%20huren%20van%20een%20caravan%20op%20de%20Costa%20Brava."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.3, type: 'spring', stiffness: 300 }}
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#1da851] rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 group"
        aria-label="Chat via WhatsApp"
      >
        <WhatsAppIcon size={26} />
        <span className="absolute right-full mr-3 bg-white text-foreground text-xs sm:text-sm font-medium px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none border border-border/50">
          WhatsApp ons!
        </span>
      </motion.a>
    </>
  );
}

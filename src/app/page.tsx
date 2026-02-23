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
  MessageCircle,
} from 'lucide-react';
import { caravans } from '@/data/caravans';
import BookingWidget from '@/components/BookingWidget';
import WeatherChecker from '@/components/WeatherChecker';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function HomePage() {
  const featuredCaravans = caravans.filter(c => c.status === 'BESCHIKBAAR').slice(0, 3);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary/60 to-primary-dark/90 sm:bg-gradient-to-r sm:from-primary-dark/90 sm:via-primary/70 sm:to-primary-dark/50" />
        </motion.div>

        <motion.div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-20 w-full" style={{ opacity: heroOpacity }}>
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white/90 text-xs sm:text-sm mb-4 sm:mb-6 border border-white/20"
            >
              <Sparkles size={14} className="text-accent-light" />
              Seizoen 2026 – nu boeken!
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6"
            >
              Zorgeloze
              <span className="text-accent-light"> caravanvakantie</span>
              <br className="hidden sm:block" /> op de Costa Brava
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-sm sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Jouw caravan staat klaar op de camping. Volledig ingericht met inventaris, beddengoed en kookgerei. Geen transport, geen gedoe – alleen genieten.
            </motion.p>

            {/* Mobile stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-4 max-w-xs mx-auto lg:mx-0 mb-8 lg:hidden"
            >
              {[
                { value: '6+', label: 'Caravans' },
                { value: '30+', label: 'Campings' },
                { value: '100%', label: 'Ontzorgd' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-blue-200 text-[11px]">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Booking Widget */}
          <BookingWidget />

          {/* Desktop stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hidden lg:flex gap-8 mt-8 max-w-md"
          >
            {[
              { value: '6+', label: 'Caravans beschikbaar' },
              { value: '30+', label: 'Campings Costa Brava' },
              { value: '100%', label: 'Volledig ontzorgd' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-xs">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
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
      </section>

      {/* ===== VOORDELEN / USP ===== */}
      <section className="py-12 sm:py-20 bg-surface">
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
                icon: <Tent className="text-primary" size={24} />,
                title: 'Klaar op de camping',
                desc: 'Je caravan staat al klaar op de camping van je keuze. Gewoon uitstappen en genieten.',
              },
              {
                icon: <Package className="text-primary" size={24} />,
                title: 'Volledige inventaris',
                desc: 'Beddengoed, kookgerei, servies, handdoeken – alles aanwezig. Niets meenemen.',
              },
              {
                icon: <Camera className="text-primary" size={24} />,
                title: "Foto's vooraf",
                desc: "Foto's van exact jouw caravan of een vergelijkbare. Geen verrassingen.",
              },
              {
                icon: <Wallet className="text-primary" size={24} />,
                title: 'Flexibel betalen',
                desc: '30% aanbetaling, restbedrag vlak voor je vakantie. Veilig via Stripe.',
              },
              {
                icon: <Shield className="text-primary" size={24} />,
                title: 'Borg bescherming',
                desc: 'Duidelijke borgvoorwaarden. Na controle krijg je je borg volledig retour.',
              },
              {
                icon: <Truck className="text-primary" size={24} />,
                title: 'Transport mogelijk',
                desc: 'Via Caravanstalling-Spanje kun je optioneel transport boeken.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={scaleIn}
                custom={i}
                className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border group"
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground mb-1.5 sm:mb-3">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-12 sm:py-20 overflow-hidden">
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

          {/* Mobile: vertical timeline / Desktop: horizontal */}
          <div className="hidden md:block">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
              className="grid grid-cols-5 gap-4 lg:gap-6"
            >
              {[
                { step: '1', title: 'Caravan kiezen', desc: 'Bekijk ons aanbod en kies de caravan die bij je past.', icon: <Heart size={22} /> },
                { step: '2', title: 'Datum & camping', desc: 'Kies je datum en camping op de Costa Brava.', icon: <CalendarDays size={22} /> },
                { step: '3', title: 'Aanbetalen', desc: 'Betaal 30% aanbetaling per bank of cash.', icon: <CreditCard size={22} /> },
                { step: '4', title: 'Restbedrag', desc: 'Betaal het restbedrag via Stripe.', icon: <CheckCircle size={22} /> },
                { step: '5', title: 'Genieten!', desc: 'Je caravan staat klaar. Uitstappen en genieten!', icon: <Star size={22} /> },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center relative">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                    {item.icon}
                  </div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Stap {item.step}</div>
                  <h3 className="font-semibold text-foreground mb-1.5 text-sm lg:text-base">{item.title}</h3>
                  <p className="text-xs lg:text-sm text-muted">{item.desc}</p>
                  {i < 4 && (
                    <div className="absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="md:hidden space-y-0">
            {[
              { step: '1', title: 'Caravan kiezen', desc: 'Bekijk ons aanbod en kies de caravan die bij je past.', icon: <Heart size={18} /> },
              { step: '2', title: 'Datum & camping', desc: 'Kies je datum en camping op de Costa Brava.', icon: <CalendarDays size={18} /> },
              { step: '3', title: 'Aanbetalen', desc: 'Betaal 30% aanbetaling per bank of cash.', icon: <CreditCard size={18} /> },
              { step: '4', title: 'Restbedrag', desc: 'Betaal het restbedrag via Stripe.', icon: <CheckCircle size={18} /> },
              { step: '5', title: 'Genieten!', desc: 'Je caravan staat klaar!', icon: <Star size={18} /> },
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
                  <div className="absolute left-[19px] top-10 w-0.5 h-full bg-gradient-to-b from-primary/30 to-primary/10" />
                )}
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shrink-0 z-10">
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
      <section className="py-12 sm:py-20 bg-surface">
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
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 sm:hover:-translate-y-2 border border-border group"
              >
                <div className="relative h-44 sm:h-56 overflow-hidden">
                  <Image
                    src={caravan.photos[0]}
                    alt={caravan.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    unoptimized
                  />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-white ${
                      caravan.type === 'LUXE' ? 'bg-yellow-500' :
                      caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-green-500'
                    }`}>
                      {caravan.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <span className="text-xs sm:text-sm font-bold text-primary">&euro;{caravan.pricePerWeek}/week</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-sm sm:text-lg font-bold text-foreground mb-1">{caravan.name}</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted mb-2 sm:mb-3">
                    <span className="flex items-center gap-1"><Users size={12} /> Max {caravan.maxPersons}</span>
                    <span>{caravan.manufacturer}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4 line-clamp-2 hidden sm:block">{caravan.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                    {caravan.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-surface rounded-md text-muted">{a}</span>
                    ))}
                    {caravan.amenities.length > 3 && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-surface rounded-md text-muted">+{caravan.amenities.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Link
                      href={`/caravans/${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 border border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-xs sm:text-sm"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/boeken?caravan=${caravan.id}`}
                      className="flex-1 text-center py-2 sm:py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors text-xs sm:text-sm active:scale-95"
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
      <section className="py-12 sm:py-20">
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
                  'Dekbedden & kussens',
                  'Volledig servies',
                  'Kookgerei & pannen',
                  'Handdoeken',
                  'Verwarming & gas',
                  'Elektra & accu',
                  'Rolgordijnen & horren',
                  'Schoonmaakmiddelen',
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-1.5 sm:gap-2"
                  >
                    <CheckCircle size={14} className="text-green-500 shrink-0 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/caravans"
                className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all duration-300 text-sm active:scale-95"
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl p-3 sm:p-4 shadow-lg border border-border"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-500" size={18} />
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
      <section className="py-12 sm:py-20 bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-accent-light font-semibold text-xs sm:text-sm uppercase tracking-wider">De voordelen</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">Waarom bij ons huren?</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: <Clock size={24} />, title: 'Geen gedoe', desc: 'Geen transport, geen opbouwen. Alles staat klaar.' },
              { icon: <ThumbsUp size={24} />, title: 'Betrouwbaar', desc: 'Onderdeel van Caravanstalling-Spanje. Bewezen kwaliteit.' },
              { icon: <Wallet size={24} />, title: 'Betaalbaar', desc: 'Eerlijke prijzen inclusief volledige inventaris. Geen verborgen kosten.' },
              { icon: <Shield size={24} />, title: 'Veilig betalen', desc: 'Stripe PCI-compliant. 3D Secure. Borg bescherming.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{item.title}</h3>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WEATHER CHECKER ===== */}
      <WeatherChecker />

      {/* ===== REVIEWS / SOCIAL PROOF ===== */}
      <section className="py-12 sm:py-20 bg-surface overflow-hidden">
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
                className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300 relative"
              >
                <Quote size={32} className="absolute top-4 right-4 text-primary/10" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, s) => (
                    <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{review.name}</div>
                    <div className="text-xs text-muted">{review.location}</div>
                  </div>
                  <span className="text-[10px] text-muted bg-surface px-2 py-1 rounded-full">{review.date}</span>
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
            className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-8"
          >
            {[
              { icon: <Shield size={20} className="text-primary" />, text: 'Veilig betalen via Stripe' },
              { icon: <CheckCircle size={20} className="text-green-500" />, text: 'Volledige inventaris' },
              { icon: <Star size={20} className="text-yellow-500 fill-yellow-500" />, text: '5/5 beoordeling' },
              { icon: <Users size={20} className="text-primary" />, text: '100+ tevreden gasten' },
            ].map(badge => (
              <div key={badge.text} className="flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm border border-border text-xs sm:text-sm font-medium text-foreground">
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-12 sm:py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 text-center">
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
              className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
            >
              <Sparkles className="text-accent" size={28} />
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
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 sm:hover:-translate-y-1 text-base sm:text-lg active:scale-95"
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
        transition={{ delay: 2, duration: 0.4, type: 'spring' }}
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle size={28} className="text-white" />
        <span className="absolute right-full mr-3 bg-white text-foreground text-xs sm:text-sm font-medium px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          WhatsApp ons!
        </span>
      </motion.a>
    </>
  );
}
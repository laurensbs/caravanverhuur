'use client';

import Image from 'next/image';
import Link from 'next/link';
import BookingCTA from '@/components/BookingCTA';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Heart,
  Shield,
  Target,
  Award,
  Truck,
  Search,
  CalendarDays,
  Wrench,
  CreditCard,
  Sun,
  MapPin,
  Users,
  Star,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function OverOnsPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* ===== PAGE HEADER ===== */}
      <div className="bg-background border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 pt-8 sm:pt-10 pb-6 sm:pb-8">
          <nav className="flex items-center gap-1.5 text-muted text-xs mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">{t('about.heroSubtitle')}</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight mb-2">
            {t('about.heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            {t('about.missionText')}
          </p>
        </div>
      </div>

      {/* ===== ONS VERHAAL ===== */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-sm font-bold text-primary uppercase tracking-wider">{t('about.story')}</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-foreground mt-2 mb-6">
                {t('about.whoWeAreTitle')}
              </h2>
              <p className="text-muted text-base sm:text-lg mb-4 sm:mb-5 leading-relaxed">
                {t('about.whoWeAreText1')}
              </p>
              <p className="text-muted text-base sm:text-lg mb-4 sm:mb-5 leading-relaxed">
                {t('about.whoWeAreText2')}
              </p>
              <p className="text-muted text-base sm:text-lg leading-relaxed">
                {t('about.whoWeAreText3pre')}{' '}
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium hover:text-primary-dark transition-colors">Caravanstalling-Spanje</a>{' '}
                {t('about.whoWeAreText3post')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[3/4]">
                    <Image
                      src="https://u.cubeupload.com/laurensbos/IMG3809.jpg"
                      alt="Auto met caravan onderweg naar de Costa Brava"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[3/4] mt-8">
                    <Image
                      src="/images/campings/platja_gran_platja_d_aro.jpg"
                      alt="Strand Costa Brava"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                {/* Floating accent card */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 sm:p-5 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <Sun className="text-white" size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">100%</div>
                      <div className="text-sm text-muted">{t('home.statRelaxed')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WAARDEN ===== */}
      <section className="py-14 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-sm font-bold text-primary uppercase tracking-wider">
              {t('about.valuesTitle')}
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-foreground mt-2">
              {t('about.advantagesTitle')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {[
              { icon: <Heart size={24} />, title: t('about.adv1Title'), desc: t('about.adv1Desc'), color: 'from-primary to-primary-dark' },
              { icon: <Shield size={24} />, title: t('about.adv2Title'), desc: t('about.adv2Desc'), color: 'from-primary-dark to-primary' },
              { icon: <Target size={24} />, title: t('about.adv3Title'), desc: t('about.adv3Desc'), color: 'from-primary to-primary-dark' },
              { icon: <Award size={24} />, title: t('about.adv4Title'), desc: t('about.adv4Desc'), color: 'from-primary-dark to-primary' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-md mb-4`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PROCES TIMELINE ===== */}
      <section className="py-14 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12 sm:mb-20"
          >
            <motion.span variants={fadeUp} custom={0} className="text-sm font-bold text-primary uppercase tracking-wider">
              {t('about.processLabel')}
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-foreground mt-2">
              {t('about.processTitle')}
            </motion.h2>
          </motion.div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:block">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
              className="grid grid-cols-5 gap-4 lg:gap-6"
            >
              {[
                { step: '1', title: t('about.proc1Title'), desc: t('about.proc1Desc'), icon: <Search size={22} /> },
                { step: '2', title: t('about.proc2Title'), desc: t('about.proc2Desc'), icon: <CalendarDays size={22} /> },
                { step: '3', title: t('about.proc3Title'), desc: t('about.proc3Desc'), icon: <Wrench size={22} /> },
                { step: '4', title: t('about.proc4Title'), desc: t('about.proc4Desc'), icon: <CreditCard size={22} /> },
                { step: '5', title: t('about.proc5Title'), desc: t('about.proc5Desc'), icon: <Sun size={22} /> },
              ].map((item, i) => (
                <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center relative">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Stap {item.step}</div>
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
              { step: '1', title: t('about.proc1Title'), desc: t('about.proc1Desc'), icon: <Search size={18} /> },
              { step: '2', title: t('about.proc2Title'), desc: t('about.proc2Desc'), icon: <CalendarDays size={18} /> },
              { step: '3', title: t('about.proc3Title'), desc: t('about.proc3Desc'), icon: <Wrench size={18} /> },
              { step: '4', title: t('about.proc4Title'), desc: t('about.proc4Desc'), icon: <CreditCard size={18} /> },
              { step: '5', title: t('about.proc5Title'), desc: t('about.proc5Desc'), icon: <Sun size={18} /> },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex gap-4 relative"
              >
                {i < 4 && (
                  <div className="absolute left-[19px] top-10 w-0.5 h-full bg-primary/20" />
                )}
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shrink-0 z-10">
                  {item.icon}
                </div>
                <div className="pb-6">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Stap {item.step}</div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CIJFERS ===== */}
      <section className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/campings/begur_sa_tuna.jpg"
            alt="Costa Brava"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-sm font-bold text-white/70 uppercase tracking-wider">
              {t('about.numbersLabel')}
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white mt-2">
              {t('about.numbersTitle')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto"
          >
            {[
              { number: '30+', label: t('about.stat1Label'), sub: t('about.stat1Sub'), icon: <Users size={24} /> },
              { number: '100+', label: t('about.stat2Label'), sub: t('about.stat2Sub'), icon: <Star size={24} /> },
              { number: '4.8/5', label: t('about.stat3Label'), sub: t('about.stat3Sub'), icon: <Award size={24} /> },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center p-4 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">{stat.icon}</div>
                </div>
                <div className="text-3xl sm:text-5xl font-extrabold text-white mb-1">{stat.number}</div>
                <div className="font-semibold text-white text-sm sm:text-base">{stat.label}</div>
                <div className="text-xs sm:text-sm text-white/60 mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== MOEDERBEDRIJF ===== */}
      <section className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/campings/palam_s_-_view_from_beach.jpg"
            alt="Costa Brava kust"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary-dark/85" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Truck className="text-white" size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mb-4">{t('about.parentCompany')}</h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('about.parentCompanyText')}
            </p>
            <a
              href="https://caravanstalling-spanje.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-foreground font-semibold rounded-full transition-all hover:scale-105 shadow-lg"
            >
              {t('about.visitParent')}
              <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <BookingCTA />
    </>
  );
}

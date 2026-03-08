'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Truck,
  Heart,
  Users,
  Target,
  Award,
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

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function OverOnsPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Wat we doen */}
      <section className="pt-8 sm:pt-10 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t('about.whoWeAre')}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-6">
                {t('about.whoWeAreTitle')}
              </h2>
              <p className="text-muted text-lg mb-6 leading-relaxed">
                {t('about.whoWeAreText1')}
              </p>
              <p className="text-muted text-lg mb-6 leading-relaxed">
                {t('about.whoWeAreText2')}
              </p>
              <p className="text-muted text-lg leading-relaxed">
                {t('about.whoWeAreText3pre')}{' '}
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Caravanstalling-Spanje</a>{' '}
                {t('about.whoWeAreText3post')}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG/1280px-La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG"
                  alt="Costa Brava camping"
                  width={600}
                  height={400}
                  className="w-full object-cover"
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Voordelen vs concurrentie */}
      <section className="py-12 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-primary font-semibold text-sm uppercase tracking-wider">
              {t('about.advantagesLabel')}
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
              {t('about.advantagesTitle')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: <Heart className="text-primary" size={28} />, title: t('about.adv1Title'), desc: t('about.adv1Desc') },
              { icon: <Shield className="text-primary" size={28} />, title: t('about.adv2Title'), desc: t('about.adv2Desc') },
              { icon: <Target className="text-primary" size={28} />, title: t('about.adv3Title'), desc: t('about.adv3Desc') },
              { icon: <Award className="text-primary" size={28} />, title: t('about.adv4Title'), desc: t('about.adv4Desc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-6 shadow-sm text-center transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Proces */}
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t('about.processLabel')}</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mt-2">{t('about.processTitle')}</h2>
          </div>

          <div className="space-y-8">
            {[
              { step: '1', title: t('about.proc1Title'), desc: t('about.proc1Desc') },
              { step: '2', title: t('about.proc2Title'), desc: t('about.proc2Desc') },
              { step: '3', title: t('about.proc3Title'), desc: t('about.proc3Desc') },
              { step: '4', title: t('about.proc4Title'), desc: t('about.proc4Desc') },
              { step: '5', title: t('about.proc5Title'), desc: t('about.proc5Desc') },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Moederbedrijf */}
      <section className="py-12 sm:py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Truck className="text-primary" size={28} />
              <h2 className="text-2xl font-bold text-foreground">{t('about.parentCompany')}</h2>
            </div>
            <p className="text-muted text-lg mb-6 max-w-2xl mx-auto">
              {t('about.parentCompanyText')}
            </p>
            <a
              href="https://caravanstalling-spanje.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-full transition-all shadow-md"
            >
              {t('about.visitParent')}
              <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Cijfers & Sociaal bewijs */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t('about.numbersLabel')}</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground mt-2">{t('about.numbersTitle')}</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { number: '30+', label: t('about.stat1Label'), sub: t('about.stat1Sub') },
              { number: '6', label: t('about.stat2Label'), sub: t('about.stat2Sub') },
              { number: '100+', label: t('about.stat3Label'), sub: t('about.stat3Sub') },
              { number: '4.8/5', label: t('about.stat4Label'), sub: t('about.stat4Sub') },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="font-semibold text-foreground text-sm">{stat.label}</div>
                <div className="text-xs text-muted mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </>
  );
}

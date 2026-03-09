'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <div className="relative w-52 h-24 sm:w-64 sm:h-28 mx-auto mb-6">
          <Image
            src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
            alt="Caravanverhuur Costa Brava"
            fill
            className="object-contain opacity-30"
           
          />
        </div>
        <h1 className="text-6xl sm:text-8xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">{t('notFound.title')}</h2>
        <p className="text-muted text-sm sm:text-base mb-8">
          {t('notFound.text')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full transition-all"
          >
            <Home size={18} />
            {t('notFound.toHome')} </Link> <Link href="/caravans" className="inline-flex items-center justify-center gap-2 px-6 py-3 border-primary text-primary font-semibold rounded-full transition-all" > {t('notFound.viewCaravans')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

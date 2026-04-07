'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function BookingCTA() {
  const { t } = useLanguage();

  return (
    <section className="px-4 pb-10 sm:pb-16">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Sparkles size={22} className="text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2">
          {t('destinations.readyTitle')}
        </h2>
        <p className="text-sm sm:text-base text-muted max-w-md mx-auto leading-relaxed mb-6">
          {t('destinations.readySubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/boeken"
            className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-white font-semibold rounded-full transition-all duration-300 text-sm hover:bg-primary-dark shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            {t('destinations.bookNowBtn')} <ArrowRight size={16} />
          </Link>
          <Link
            href="/caravans"
            className="inline-flex items-center gap-2 px-7 py-3 bg-foreground/5 text-foreground font-semibold rounded-full transition-all duration-300 text-sm hover:bg-foreground/10"
          >
            {t('destinations.viewAllCaravans')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

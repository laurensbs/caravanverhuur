'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { StarIcon } from '@/components/Footer';

import { GOOGLE_REVIEW_URL } from '@/lib/constants';

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div className="bg-foreground text-white text-[11px] sm:text-xs relative">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2.5">
        <p className="text-center flex items-center gap-1.5 flex-wrap justify-center tracking-wide">
          <span className="font-semibold uppercase">{t('weather.barSeason')}</span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 transition-opacity hover:opacity-80"
          >
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} size={11} fill={Math.min(1, Math.max(0, 4.9 - i))} prefix={`wb-star-${i}`} />
            ))}
            <span className="text-white/90 font-semibold text-xs ml-0.5">4.9</span>
          </a>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-white/70 hidden sm:inline">{t('weather.barCta')}</span>
          <Link
            href="/boeken"
            className="ml-1 underline underline-offset-2 font-semibold transition-colors"
          >
            {t('weather.barLink')}
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          aria-label={t('weather.barClose')}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

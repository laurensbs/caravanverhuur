'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Sun } from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { StarIcon } from '@/components/Footer';

import { GOOGLE_REVIEW_URL } from '@/lib/constants';

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div className="bg-primary-dark/80 text-white text-xs sm:text-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
        <Sun size={14} className="text-primary-light shrink-0 hidden sm:block" />
        <p className="text-center flex items-center gap-1.5 flex-wrap justify-center">
          <span className="font-semibold">{t('weather.barSeason')}</span>
          <span className="text-white/50 mx-0.5 hidden sm:inline">·</span>
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
          <span className="text-white/50 mx-0.5 hidden sm:inline">·</span>
          <span className="text-white/85 hidden sm:inline">{t('weather.barCta')}</span>
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
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

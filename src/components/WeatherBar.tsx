'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Sun } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div className="bg-primary-dark/80 text-white text-xs sm:text-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
        <Sun size={14} className="text-primary-light shrink-0 hidden sm:block" />
        <p className="text-center">
          <span className="font-semibold">{t('weather.barSeason')}</span>
          <span className="text-white/50 mx-1.5 hidden sm:inline">•</span>
          <span className="text-white/85 hidden sm:inline">{t('weather.barCta')}</span>
          <Link
            href="/boeken"
            className="ml-2 underline underline-offset-2 font-semibold hover:text-primary-light/80 transition-colors"
          >
            {t('weather.barLink')}
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 p-1 hover:bg-white/15 rounded-full transition-colors"
          aria-label={t('weather.barClose')}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

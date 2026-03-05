'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Sun, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Caravan+storage+spain/@41.9512941,3.091582,17z/data=!4m6!3m5!1s0x12baff513f9bfd3b:0xd29f4672d9b15353!8m2!3d41.9512941!4d3.091582!16s%2Fg%2F11cs3nd4xr';

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
            {[...Array(5)].map((_, i) => {
              const fill = Math.min(1, Math.max(0, 4.7 - i));
              if (fill >= 1) return <Star key={i} size={11} className="text-amber-400 fill-amber-400" />;
              if (fill <= 0) return <Star key={i} size={11} className="text-amber-400/30" />;
              return (
                <span key={i} className="relative" style={{ width: 11, height: 11 }}>
                  <Star size={11} className="absolute text-amber-400/30" />
                  <span className="absolute overflow-hidden" style={{ width: `${fill * 100}%` }}>
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                  </span>
                </span>
              );
            })}
            <span className="text-white/90 font-semibold text-xs ml-0.5">4.7</span>
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
          className="absolute right-3 p-1 rounded-full transition-colors"
          aria-label={t('weather.barClose')}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

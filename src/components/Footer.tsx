'use client';

import { useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

import { GOOGLE_REVIEW_URL } from '@/lib/constants';

/* SVG star path (viewBox 0 0 24 24) */
const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function StarIcon({ size, fill, prefix }: { size: number; fill: number; prefix: string }) {
  const id = `${prefix}-${Math.round(fill * 100)}`;
  if (fill >= 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <path d={STAR_PATH} fill="#fbbf24" stroke="#fbbf24" strokeWidth="1" />
      </svg>
    );
  }
  if (fill <= 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <path d={STAR_PATH} fill="#d1d5db" stroke="#d1d5db" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
          <stop offset={`${fill * 100}%`} stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <path d={STAR_PATH} fill={`url(#${id})`} stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}

const GoogleStars = ({ size = 14, rating = 4.9, showLabel = true }: { size?: number; rating?: number; showLabel?: boolean }) => {
  const uid = useId();
  return (
  <a
    href={GOOGLE_REVIEW_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 transition-opacity hover:opacity-80"
  >
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <StarIcon key={i} size={size} fill={Math.min(1, Math.max(0, rating - i))} prefix={`${uid}-star-${i}`} />
      ))}
    </span>
    {showLabel && <span className="font-bold text-foreground text-xs ml-0.5">{rating}</span>}
  </a>
  );
};

export { GoogleStars, StarIcon, STAR_PATH };

export default function Footer() {
  const { t } = useLanguage();

  const links = [
    { href: '/bestemmingen', label: t('nav.destinations') },
    { href: '/boeken', label: t('footer.directBooking') },
    { href: '/over-ons', label: t('nav.about') },
    { href: '/faq', label: t('nav.faq') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const legal = [
    { href: '/voorwaarden', label: t('footer.terms') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/voorwaarden#annulering', label: t('footer.cancellation') },
    { href: '/voorwaarden#borg', label: t('footer.deposit') },
  ];

  return (
    <footer className="bg-foreground text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-8 sm:grid sm:grid-cols-4 sm:gap-8">
          {/* Brand — centered on mobile */}
          <div className="text-center sm:text-left">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={240}
              height={70}
              className="w-36 h-auto mb-3 mx-auto sm:mx-0"
              sizes="144px"
            />
            <div className="flex justify-center sm:justify-start">
              <GoogleStars size={12} />
            </div>
            <p className="text-white/50 text-xs leading-relaxed mt-2 max-w-[260px] mx-auto sm:mx-0">
              {t('footer.tagline')}
            </p>
            <p className="text-white/30 text-[11px] mt-2">
              {t('footer.partOf')}{' '}
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">
                Caravanstalling-Spanje.com
              </a>
            </p>
          </div>

          {/* Links + Legal side-by-side on mobile */}
          <div className="grid grid-cols-2 gap-6 sm:contents">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">{t('footer.links')}</h3>
              <ul className="space-y-2.5 sm:space-y-1.5">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white text-[13px] sm:text-xs transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">{t('footer.legal')}</h3>
              <ul className="space-y-2.5 sm:space-y-1.5">
                {legal.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white text-[13px] sm:text-xs transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact — full-width on mobile */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">{t('footer.contactTitle')}</h3>
            <ul className="space-y-2.5 sm:space-y-1.5">
              <li>
                <a href="mailto:info@caravanverhuurspanje.com" className="text-white/60 hover:text-white text-[13px] sm:text-xs flex items-center gap-2 sm:gap-1.5 transition-colors">
                  <Mail size={14} className="shrink-0 text-white/30 sm:w-3 sm:h-3" />
                  <span className="break-all sm:break-normal">info@caravanverhuurspanje.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+34650036755" className="text-white/60 hover:text-white text-[13px] sm:text-xs flex items-center gap-2 sm:gap-1.5 transition-colors">
                  <Phone size={14} className="shrink-0 text-white/30 sm:w-3 sm:h-3" />
                  +34 650 036 755
                </a>
              </li>
              <li className="text-white/60 text-[13px] sm:text-xs flex items-center gap-2 sm:gap-1.5">
                <MapPin size={14} className="shrink-0 text-white/30 sm:w-3 sm:h-3" />
                {t('footer.location')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[11px] text-white/30 order-2 sm:order-none">&copy; {new Date().getFullYear()} Caravanverhuur Costa Brava</p>
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center order-1 sm:order-none">
            <img src="/images/badges/eu-flag.png" alt="Financiado por la Unión Europea – NextGenerationEU" className="h-5 object-contain opacity-50" />
            <img src="/images/badges/gobierno-espana.svg" alt="Gobierno de España" className="h-5 object-contain opacity-50" />
            <img src="/images/badges/red-es.svg" alt="Red.es" className="h-4 object-contain opacity-50" />
            <img src="/images/badges/kit-digital.svg" alt="Kit Digital" className="h-5 object-contain opacity-50" />
          </div>
        </div>
      </div>
    </footer>
  );
}

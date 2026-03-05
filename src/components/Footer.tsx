'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Caravan+storage+spain/@41.9512941,3.091582,17z/data=!4m6!3m5!1s0x12baff513f9bfd3b:0xd29f4672d9b15353!8m2!3d41.9512941!4d3.091582!16s%2Fg%2F11cs3nd4xr';

/* SVG star path (viewBox 0 0 24 24) */
const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function StarIcon({ size, fill }: { size: number; fill: number }) {
  const id = `star-grad-${size}-${Math.round(fill * 100)}`;
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
        <path d={STAR_PATH} fill="#fbbf2430" stroke="#fbbf2430" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
          <stop offset={`${fill * 100}%`} stopColor="#fbbf2430" />
        </linearGradient>
      </defs>
      <path d={STAR_PATH} fill={`url(#${id})`} stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}

const GoogleStars = ({ size = 14, rating = 4.7, showLabel = true }: { size?: number; rating?: number; showLabel?: boolean }) => (
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
        <StarIcon key={i} size={size} fill={Math.min(1, Math.max(0, rating - i))} />
      ))}
    </span>
    {showLabel && <span className="font-bold text-foreground text-xs ml-0.5">{rating}</span>}
  </a>
);

export { GoogleStars, StarIcon, STAR_PATH };

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white">
      {/* CTA strip */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm sm:text-base text-center sm:text-left">
            {t('footer.ctaText')}
          </p>
          <Link
            href="/boeken"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold rounded-full text-sm transition-colors shrink-0"
          >
            {t('nav.bookNow')}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-14">
        {/* Mobile: logo centered + stacked columns */}
        <div className="flex flex-col items-center text-center lg:hidden mb-6">
          <Image
            src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
            alt="Caravanverhuur Costa Brava"
            width={240}
            height={70}
            className="w-40 sm:w-52 h-auto mb-2"
            unoptimized
          />
          <GoogleStars size={13} />
          <p className="text-muted text-xs leading-relaxed max-w-xs mt-2">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Mobile: 2-col grid for links + legal */}
        <div className="grid grid-cols-2 gap-4 lg:hidden">
          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-xs mb-2 text-foreground uppercase tracking-wider">{t('footer.links')}</h3>
            <ul className="space-y-1.5">
              {[
                { href: '/caravans', label: t('footer.ourCaravans') },
                { href: '/bestemmingen', label: t('nav.destinations') },
                { href: '/boeken', label: t('footer.directBooking') },
                { href: '/over-ons', label: t('nav.about') },
                { href: '/faq', label: t('nav.faq') },
                { href: '/contact', label: t('nav.contact') },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted text-xs">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact combined */}
          <div>
            <h3 className="font-semibold text-xs mb-2 text-foreground uppercase tracking-wider">{t('footer.legal')}</h3>
            <ul className="space-y-1.5 mb-4">
              {[
                { href: '/voorwaarden', label: t('footer.terms') },
                { href: '/privacy', label: t('footer.privacy') },
                { href: '/voorwaarden#annulering', label: t('footer.cancellation') },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted text-xs">{link.label}</Link>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-xs mb-2 text-foreground uppercase tracking-wider">{t('footer.contactTitle')}</h3>
            <ul className="space-y-1.5">
              <li>
                <a href="mailto:info@caravanverhuurspanje.com" className="text-muted text-xs flex items-center gap-1.5">
                  <Mail size={12} className="text-primary shrink-0" />
                  <span className="truncate">info@caravanverhuur...</span>
                </a>
              </li>
              <li>
                <a href="tel:+34650036755" className="text-muted text-xs flex items-center gap-1.5">
                  <Phone size={12} className="text-primary shrink-0" />
                  +34 650 036 755
                </a>
              </li>
              <li className="text-muted text-xs flex items-center gap-1.5">
                <MapPin size={12} className="text-primary shrink-0" />
                {t('footer.location')}
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden lg:grid grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={240}
              height={70}
              className="w-48 h-auto"
              unoptimized
            />
            <GoogleStars size={13} />
            <p className="text-muted text-sm leading-relaxed">
              {t('footer.taglineLong')}
            </p>
            <div className="text-muted text-xs">
              {t('footer.partOf')}{' '}
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Caravanstalling-Spanje.com
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground uppercase tracking-wider">{t('footer.links')}</h3>
            <ul className="space-y-2">
              {[
                { href: '/caravans', label: t('footer.ourCaravans') },
                { href: '/bestemmingen', label: t('nav.destinations') },
                { href: '/boeken', label: t('footer.directBooking') },
                { href: '/over-ons', label: t('nav.about') },
                { href: '/faq', label: t('nav.faq') },
                { href: '/contact', label: t('nav.contact') },
                { href: '/account', label: t('footer.myAccount') },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground uppercase tracking-wider">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              {[
                { href: '/voorwaarden', label: t('footer.terms') },
                { href: '/privacy', label: t('footer.privacy') },
                { href: '/voorwaarden#annulering', label: t('footer.cancellation') },
                { href: '/voorwaarden#borg', label: t('footer.deposit') },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-foreground uppercase tracking-wider">{t('footer.contactTitle')}</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:info@caravanverhuurspanje.com" className="text-muted transition-colors text-sm flex items-start gap-2">
                  <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>info@caravanverhuurspanje.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+34650036755" className="text-muted transition-colors text-sm flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  +34 650 036 755
                </a>
              </li>
              <li className="text-muted text-sm flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                {t('footer.location')}
              </li>
              <li>
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-muted transition-colors text-sm flex items-center gap-2">
                  <ExternalLink size={14} className="text-primary shrink-0" />
                  Caravanstalling-Spanje
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Caravanverhuur Costa Brava</p>
          <div className="flex gap-4">
            <Link href="/voorwaarden" className="transition-colors">{t('footer.terms')}</Link>
            <Link href="/privacy" className="transition-colors">{t('footer.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

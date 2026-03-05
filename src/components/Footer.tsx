'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t">
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
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        {/* Mobile: logo centered + stacked columns */}
        <div className="flex flex-col items-center text-center lg:hidden mb-8">
          <Image
            src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
            alt="Caravanverhuur Costa Brava"
            width={240}
            height={70}
            className="w-44 sm:w-52 h-auto mb-4"
            unoptimized
          />
          <p className="text-muted text-sm leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
          <div className="mt-3 text-muted text-xs">
            {t('footer.partOf')}{' '}
            <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Caravanstalling-Spanje.com
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand - desktop only */}
          <div className="hidden lg:block space-y-4">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
              alt="Caravanverhuur Costa Brava"
              width={240}
              height={70}
              className="w-48 h-auto"
              unoptimized
            />
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
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-foreground uppercase tracking-wider">{t('footer.links')}</h3>
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
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-foreground uppercase tracking-wider">{t('footer.legal')}</h3>
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
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-foreground uppercase tracking-wider">{t('footer.contactTitle')}</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:info@caravanverhuurspanje.com" className="text-muted transition-colors text-sm flex items-start gap-2">
                  <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="break-all">info@caravanverhuur<wbr />spanje.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+34600000000" className="text-muted transition-colors text-sm flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  +34 600 000 000
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

      {/* Google Reviews */}
      <div className="border-t bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 className="font-bold text-foreground text-base sm:text-lg">{t('footer.googleReviews')}</h3>
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
              ))}
              <span className="ml-1.5 font-bold text-foreground">5.0</span>
            </div>
            <p className="text-xs text-muted">Caravanstalling-Spanje.com</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
            {[
              { name: 'Familie de Vries', text: t('footer.review1'), date: '2025' },
              { name: 'Mark & Anja', text: t('footer.review2'), date: '2025' },
              { name: 'Peter Bakker', text: t('footer.review3'), date: '2024' },
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground-light leading-relaxed mb-3">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted">{review.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://www.google.com/maps/place/Caravan+storage+spain/@41.9512941,3.091582,17z/data=!4m6!3m5!1s0x12baff513f9bfd3b:0xd29f4672d9b15353!8m2!3d41.9512941!4d3.091582!16s%2Fg%2F11cs3nd4xr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-sm font-semibold text-foreground transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('footer.viewAllReviews')}
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
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

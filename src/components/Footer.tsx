'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-border">
      {/* CTA strip */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm sm:text-base text-center sm:text-left">
            {t('footer.ctaText')}
          </p>
          <Link
            href="/boeken"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold rounded-full text-sm hover:bg-surface transition-colors active:scale-95 shrink-0"
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
                  <Link href={link.href} className="text-muted hover:text-primary transition-colors text-sm">
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
                  <Link href={link.href} className="text-muted hover:text-primary transition-colors text-sm">
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
                <a href="mailto:info@caravanverhuurspanje.com" className="text-muted hover:text-primary transition-colors text-sm flex items-start gap-2">
                  <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="break-all">info@caravanverhuur<wbr />spanje.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+34600000000" className="text-muted hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  +34 600 000 000
                </a>
              </li>
              <li className="text-muted text-sm flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                {t('footer.location')}
              </li>
              <li>
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <ExternalLink size={14} className="text-primary shrink-0" />
                  Caravanstalling-Spanje
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Caravanverhuur Costa Brava</p>
          <div className="flex gap-4">
            <Link href="/voorwaarden" className="hover:text-foreground-light transition-colors">{t('footer.terms')}</Link>
            <Link href="/privacy" className="hover:text-foreground-light transition-colors">{t('footer.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

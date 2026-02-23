import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* CTA strip */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm sm:text-base text-center sm:text-left">
            Klaar om te boeken? Seizoen 2026 beschikbaar!
          </p>
          <Link
            href="/boeken"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold rounded-full text-sm hover:bg-gray-50 transition-colors active:scale-95 shrink-0"
          >
            Boek nu
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        {/* Mobile: logo centered + stacked columns */}
        <div className="flex flex-col items-center text-center lg:hidden mb-8">
          <Image
            src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
            alt="Caravanverhuur Costa Brava"
            width={160}
            height={48}
            className="w-32 sm:w-36 h-auto mb-4"
            unoptimized
          />
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Zorgeloze caravanvakantie op de mooiste campings van de Costa Brava.
          </p>
          <div className="mt-3 text-gray-400 text-xs">
            Onderdeel van{' '}
            <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Caravanstalling-Spanje.com
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand - desktop only */}
          <div className="hidden lg:block space-y-4">
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Caravanverhuur Costa Brava"
              width={160}
              height={48}
              className="w-32 h-auto"
              unoptimized
            />
            <p className="text-gray-500 text-sm leading-relaxed">
              Zorgeloze caravanvakantie op de mooiste campings van de Costa Brava. Wij regelen alles, jij geniet.
            </p>
            <div className="text-gray-400 text-xs">
              Onderdeel van{' '}
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Caravanstalling-Spanje.com
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-gray-800 uppercase tracking-wider">Links</h3>
            <ul className="space-y-2">
              {[
                { href: '/caravans', label: 'Onze Caravans' },
                { href: '/boeken', label: 'Direct Boeken' },
                { href: '/over-ons', label: 'Over Ons' },
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: 'Contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Juridisch */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-gray-800 uppercase tracking-wider">Juridisch</h3>
            <ul className="space-y-2">
              {[
                { href: '/voorwaarden', label: 'Voorwaarden' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/voorwaarden#annulering', label: 'Annulering' },
                { href: '/voorwaarden#borg', label: 'Borg & Verzekering' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-gray-800 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:info@caravanverhuurcostabrava.com" className="text-gray-500 hover:text-primary transition-colors text-sm flex items-start gap-2">
                  <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="break-all">info@caravanhuur<wbr />costabrava.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+34600000000" className="text-gray-500 hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  +34 600 000 000
                </a>
              </li>
              <li className="text-gray-500 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                Costa Brava, Spanje
              </li>
              <li>
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <ExternalLink size={14} className="text-primary shrink-0" />
                  Caravanstalling-Spanje
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Caravanverhuur Costa Brava</p>
          <div className="flex gap-4">
            <Link href="/voorwaarden" className="hover:text-gray-600 transition-colors">Voorwaarden</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

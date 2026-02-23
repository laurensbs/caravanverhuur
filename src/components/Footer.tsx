import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="https://u.cubeupload.com/laurensbos/8e603c0dabfd4df3a61f.jpeg"
              alt="Caravanverhuur Costa Brava"
              width={56}
              height={56}
              className="rounded-xl mb-1"
              unoptimized
            />
            <p className="text-blue-200 text-sm leading-relaxed">
              Zorgeloze caravanvakantie op de mooiste campings van de Costa Brava. Wij regelen alles, jij geniet.
            </p>
            <div className="pt-2">
              <span className="text-blue-300 text-xs">Onderdeel van </span>
              <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-accent-light text-xs underline hover:text-accent transition-colors">
                Caravanstalling-Spanje.com
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Snelle Links</h3>
            <ul className="space-y-2">
              {[
                { href: '/caravans', label: 'Onze Caravans' },
                { href: '/boeken', label: 'Direct Boeken' },
                { href: '/over-ons', label: 'Over Ons' },
                { href: '/faq', label: 'Veelgestelde Vragen' },
                { href: '/contact', label: 'Contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-200 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Juridisch */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Juridisch</h3>
            <ul className="space-y-2">
              {[
                { href: '/voorwaarden', label: 'Algemene Voorwaarden' },
                { href: '/privacy', label: 'Privacybeleid' },
                { href: '/voorwaarden#annulering', label: 'Annuleringsbeleid' },
                { href: '/voorwaarden#borg', label: 'Borg & Verzekering' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-200 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:info@caravanverhuurcostabrava.com" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Mail size={16} className="text-accent-light shrink-0" />
                  info@caravanverhuurcostabrava.com
                </a>
              </li>
              <li>
                <a href="tel:+34600000000" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <Phone size={16} className="text-accent-light shrink-0" />
                  +34 600 000 000
                </a>
              </li>
              <li className="text-blue-200 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-accent-light shrink-0" />
                Costa Brava, Spanje
              </li>
              <li>
                <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <ExternalLink size={16} className="text-accent-light shrink-0" />
                  Caravanstalling-Spanje
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-blue-300">
          <p>&copy; {new Date().getFullYear()} Caravanverhuur Costa Brava. Alle rechten voorbehouden.</p>
          <div className="flex gap-4">
            <Link href="/voorwaarden" className="hover:text-white transition-colors">Voorwaarden</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

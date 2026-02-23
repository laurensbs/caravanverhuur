'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/caravans', label: 'Caravans' },
  { href: '/boeken', label: 'Boeken' },
  { href: '/over-ons', label: 'Over Ons' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary text-white text-sm py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-1 hover:text-accent-light transition-colors">
              <Mail size={14} />
              info@caravanverhuurcostabrava.com
            </a>
            <a href="tel:+34600000000" className="flex items-center gap-1 hover:text-accent-light transition-colors">
              <Phone size={14} />
              +34 600 000 000
            </a>
          </div>
          <div>
            <span className="text-blue-200">Onderdeel van </span>
            <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent-light transition-colors">
              Caravanstalling-Spanje
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-24 sm:h-28">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="https://u.cubeupload.com/laurensbos/8e603c0dabfd4df3a61f.jpeg"
              alt="Caravanverhuur Costa Brava"
              width={112}
              height={112}
              className="rounded-2xl w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 hover:scale-105 transition-transform duration-200 shadow-md"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/boeken"
              className="ml-4 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Boek Nu
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border bg-white overflow-hidden"
            >
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/boeken"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-full text-center transition-all shadow-md"
                >
                  Boek Nu
                </Link>
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-sm text-muted">
                  <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-2">
                    <Mail size={14} /> info@caravanverhuurcostabrava.com
                  </a>
                  <a href="tel:+34600000000" className="flex items-center gap-2">
                    <Phone size={14} /> +34 600 000 000
                  </a>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

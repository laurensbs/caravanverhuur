'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Mail, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherBar from './WeatherBar';

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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* Weather bar */}
      <WeatherBar />

      {/* Top bar - desktop */}
      <div className="bg-primary-dark text-white text-xs py-1.5 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-1.5 hover:text-accent-light transition-colors">
              <Mail size={12} />
              info@caravanverhuurcostabrava.com
            </a>
            <a href="tel:+34600000000" className="flex items-center gap-1.5 hover:text-accent-light transition-colors">
              <Phone size={12} />
              +34 600 000 000
            </a>
          </div>
          <div className="text-white/70">
            Onderdeel van{' '}
            <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-accent-light transition-colors">
              Caravanstalling-Spanje
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20 sm:h-22 lg:h-24">
          {/* Logo */}
          <Link href="/" className="shrink-0 relative z-[60]">
            <Image
              src="https://u.cubeupload.com/laurensbos/8e603c0dabfd4df3a61f.jpeg"
              alt="Caravanverhuur Costa Brava"
              width={112}
              height={112}
              className="rounded-2xl w-14 h-14 sm:w-18 sm:h-18 lg:w-24 lg:h-24 hover:scale-105 transition-transform duration-200 shadow-md"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-primary rounded-lg hover:bg-primary/5 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/boeken"
              className="ml-3 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-full transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
            >
              Boek Nu
              <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile/tablet menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface transition-colors"
            aria-label="Menu"
          >
            <div className="relative w-5 h-4">
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 w-full h-0.5 bg-foreground rounded-full origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[6px] left-0 w-full h-0.5 bg-foreground rounded-full"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 left-0 w-full h-0.5 bg-foreground rounded-full origin-center"
              />
            </div>
          </button>
        </div>

        {/* ===== SLIDE-IN SIDE PANEL MOBILE MENU ===== */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setMenuOpen(false)}
              />

              {/* Side panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                    <Image
                      src="https://u.cubeupload.com/laurensbos/8e603c0dabfd4df3a61f.jpeg"
                      alt="Logo"
                      width={40}
                      height={40}
                      className="rounded-xl shadow-sm"
                      unoptimized
                    />
                    <span className="font-bold text-sm text-foreground">Costa Brava</span>
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center hover:bg-border transition-colors cursor-pointer"
                  >
                    <X size={20} className="text-foreground" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between px-4 py-3.5 rounded-xl text-foreground hover:bg-surface transition-colors"
                      >
                        <span className="text-base font-semibold">{link.label}</span>
                        <ChevronRight size={18} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* CTA + contact */}
                <div className="p-5 border-t border-border space-y-4">
                  <Link
                    href="/boeken"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-bold rounded-2xl text-base transition-all active:scale-95 shadow-lg"
                  >
                    Direct boeken
                    <ArrowRight size={18} />
                  </Link>

                  <div className="space-y-2">
                    <a href="tel:+34600000000" className="flex items-center gap-3 text-muted hover:text-foreground transition-colors">
                      <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center">
                        <Phone size={14} />
                      </div>
                      <span className="text-sm">+34 600 000 000</span>
                    </a>
                    <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-3 text-muted hover:text-foreground transition-colors">
                      <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center">
                        <Mail size={14} />
                      </div>
                      <span className="text-sm">info@caravanverhuurcostabrava.com</span>
                    </a>
                  </div>

                  <p className="text-xs text-muted pt-2">
                    Onderdeel van{' '}
                    <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                      Caravanstalling-Spanje
                    </a>
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

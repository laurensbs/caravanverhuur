'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Mail, ArrowRight, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherBar from './WeatherBar';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/caravans', label: 'Caravans' },
  { href: '/bestemmingen', label: 'Bestemmingen' },
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
    <div className="sticky top-0 z-50">
      {/* Weather bar */}
      <WeatherBar />

      {/* Main nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-24 sm:h-26 lg:h-28 py-2">
          {/* Logo — hidden on mobile when menu is open so only the panel logo shows */}
          <Link href="/" className={`shrink-0 transition-opacity duration-200 ${menuOpen ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}>
            <Image
              src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
              alt="Caravanverhuur Costa Brava"
              width={260}
              height={80}
              className="w-44 sm:w-52 lg:w-60 h-auto max-h-20 sm:max-h-22 lg:max-h-24 object-contain"
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              className="ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
              aria-label="Mijn Account"
            >
              <User size={18} />
            </Link>
            <Link
              href="/boeken"
              className="ml-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all duration-150 shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              Boek Nu
              <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile/tablet menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <div className="relative w-5 h-4">
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 w-full h-0.5 bg-gray-800 rounded-full origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[6px] left-0 w-full h-0.5 bg-gray-800 rounded-full"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 left-0 w-full h-0.5 bg-gray-800 rounded-full origin-center"
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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setMenuOpen(false)}
              />

              {/* Side panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-[80vw] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <Link href="/" onClick={() => setMenuOpen(false)}>
                    <Image
                      src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
                      alt="Logo"
                      width={120}
                      height={36}
                      className="w-24 h-auto"
                      unoptimized
                    />
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <X size={20} className="text-gray-600" />
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
                        className="group flex items-center justify-between px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-base font-medium">{link.label}</span>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* CTA + contact */}
                <div className="p-5 border-t border-gray-100 space-y-3">
                  <Link
                    href="/boeken"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-base transition-all active:scale-95 shadow-md"
                  >
                    Boek Nu
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} />
                    Mijn Account
                  </Link>

                  <div className="space-y-2">
                    <a href="tel:+34600000000" className="flex items-center gap-3 text-gray-500 hover:text-gray-700 transition-colors">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Phone size={14} />
                      </div>
                      <span className="text-sm">+34 600 000 000</span>
                    </a>
                    <a href="mailto:info@caravanverhuurcostabrava.com" className="flex items-center gap-3 text-gray-500 hover:text-gray-700 transition-colors">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail size={14} />
                      </div>
                      <span className="text-sm">info@caravanverhuurcostabrava.com</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile floating Boek Nu button */}
      <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40">
        <Link
          href="/boeken"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-full text-base transition-all active:scale-95 shadow-lg"
        >
          Boek Nu
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

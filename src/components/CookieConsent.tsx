'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/context';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent');
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-border p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Cookie className="text-primary" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">{t('cookie.title')}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {t('cookie.text')}{' '}
                  <Link href="/privacy" className="text-primary underline hover:text-primary-dark">
                    {t('cookie.privacyPolicy')}
                  </Link>.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                  <button
                    onClick={accept}
                    className="px-4 sm:px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    {t('cookie.accept')}
                  </button>
                  <button
                    onClick={decline}
                    className="px-4 sm:px-6 py-2 border border-border text-muted hover:text-foreground font-medium rounded-full text-xs sm:text-sm transition-colors active:scale-95"
                  >
                    {t('cookie.essentialOnly')}
                  </button>
                </div>
              </div>
              <button
                onClick={decline}
                className="p-1 hover:bg-surface rounded-lg transition-colors shrink-0"
                aria-label={t('cookie.close')}
              >
                <X size={18} className="text-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

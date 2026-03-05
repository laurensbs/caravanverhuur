'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/context';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 left-5 sm:bottom-8 sm:left-8 z-50 w-10 h-10 sm:w-14 sm:h-14 bg-white text-primary rounded-full flex items-center justify-center shadow-lg border transition-all duration-300"
          aria-label={t('nav.scrollToTop')}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

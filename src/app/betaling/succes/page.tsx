'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/context';

function SuccesContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Short delay so the animation feels rewarding
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted mt-4">{t('paymentPage.verifying')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-xl mx-auto px-4 py-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center"
        >
          {/* Animated check */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle size={48} className="text-primary" />
            </motion.div>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: Math.sin(i * 45 * Math.PI / 180) * 60,
                }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.8 }}
                className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full ${
                  ['bg-primary', 'bg-primary', 'bg-primary', 'bg-primary-light'][i % 4]
                }`}
              />
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {t('paymentPage.successTitle')}
          </h1>
          <p className="text-muted text-lg mb-8">
            {t('paymentPage.successDesc')}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 mb-8"
          >
            <div className="flex items-center gap-3 justify-center text-primary mb-3">
              <CheckCircle size={20} />
              <span className="font-semibold">{t('paymentPage.received')}</span>
            </div>
            <p className="text-sm text-muted">
              {t('paymentPage.receivedDesc')}
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mijn-account"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('paymentPage.toMyAccount')} <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-surface-alt text-foreground-light px-6 py-3 rounded-xl font-semibold hover:bg-surface-alt transition-colors"
            >
              {t('paymentPage.backToHome')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BetalingSuccesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <SuccesContent />
    </Suspense>
  );
}

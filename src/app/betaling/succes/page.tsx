'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/context';
import { INSTAGRAM_URL } from '@/lib/constants';

interface BookingSummary {
  reference: string;
  caravanName: string;
  campingName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  depositAmount: number;
  guestEmail: string;
}

function SuccesContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const verify = async () => {
      // iDEAL is async — probeer een paar keer, daarna toch de succespagina tonen
      // (de Stripe webhook is de echte source of truth voor de DB-status).
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          const res = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (data.booking && !cancelled) setBooking(data.booking as BookingSummary);
          if (typeof data.amount === 'number' && !cancelled) setAmount(data.amount);
          if (data.paid === true) {
            if (!cancelled) { setVerified(true); setLoading(false); }
            return;
          }
        } catch {
          // negeren — we proberen opnieuw of vallen aan het eind terug op true
        }
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
      }
      // Na 3 pogingen nog niet bevestigd — toon toch succes; de webhook regelt
      // de definitieve status, en de klant ziet de boeking in /mijn-account.
      if (!cancelled) { setVerified(true); setLoading(false); }
    };
    verify();
    return () => { cancelled = true; };
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

  if (!sessionId || !verified) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-foreground mb-3">{t('paymentPage.notVerifiedTitle')}</h1>
          <p className="text-muted mb-6">{t('paymentPage.notVerifiedDesc')}</p>
          <Link href="/mijn-account" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold">
            {t('paymentPage.toMyAccount')} <ArrowRight size={16} />
          </Link>
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
            className="bg-white rounded-2xl p-6 shadow-sm mb-4"
          >
            <div className="flex items-center gap-3 justify-center text-primary mb-3">
              <CheckCircle size={20} />
              <span className="font-semibold">{t('paymentPage.received')}</span>
            </div>
            <p className="text-sm text-muted">
              {t('paymentPage.receivedDesc')}
            </p>
          </motion.div>

          {booking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-left"
            >
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">Boekingsreferentie</p>
              <p className="text-lg font-bold text-foreground mb-4">{booking.reference}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted">Caravan</span><span className="font-medium text-right">{booking.caravanName}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted">Camping</span><span className="font-medium text-right">{booking.campingName}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted">Verblijf</span><span className="font-medium text-right">{new Date(booking.checkIn).toLocaleDateString('nl-NL')} → {new Date(booking.checkOut).toLocaleDateString('nl-NL')} ({booking.nights}n)</span></div>
                <div className="flex justify-between gap-4 pt-2 border-t border-gray-100"><span className="text-muted">Totale huurprijs</span><span className="font-medium">€{booking.totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted">Aanbetaling betaald</span><span className="font-bold text-primary">€{(amount ?? booking.depositAmount).toFixed(2)}</span></div>
              </div>
            </motion.div>
          )}

          {booking?.guestEmail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8 text-left"
            >
              <p className="font-semibold text-indigo-900 text-sm mb-1">🔐 Jouw klant-account</p>
              <p className="text-xs text-indigo-800 leading-relaxed mb-3">
                We hebben een account voor je aangemaakt op <strong>{booking.guestEmail}</strong>. Het tijdelijke wachtwoord staat in je bevestigingsmail. Bij je eerste login vragen we je een eigen wachtwoord te kiezen.
              </p>
              <Link
                href={`/account?email=${encodeURIComponent(booking.guestEmail)}`}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Inloggen <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {/* Bestemmingen CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 mb-8"
          >
            <div className="flex items-center gap-2 justify-center mb-2">
              <span className="text-base">🌊</span>
              <span className="font-semibold text-cyan-900 text-sm">Bekijk alvast de mooiste bestemmingen</span>
            </div>
            <Link
              href="/bestemmingen"
              className="inline-flex items-center gap-2 bg-white text-cyan-700 border border-cyan-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-100 transition-colors"
            >
              Ontdek de Costa Brava <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Instagram CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 mb-8"
          >
            <div className="flex items-center gap-2 justify-center mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500 shrink-0">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span className="font-semibold text-purple-800 text-sm">{t('paymentPage.instagramHint')}</span>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-purple-700 border border-purple-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500 shrink-0">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              {t('paymentPage.followInstagram')}
            </a>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mijn-account"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {t('paymentPage.toMyAccount')} <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-surface-alt text-foreground-light px-6 py-3 rounded-xl font-semibold transition-colors"
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

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function GeannuleerdContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const handleRetry = async () => {
    if (!paymentId) return;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // fallback — go to account
      window.location.href = '/mijn-account';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-surface">
      <div className="max-w-xl mx-auto px-4 py-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Betaling geannuleerd
          </h1>
          <p className="text-muted text-lg mb-8">
            Je iDEAL betaling is niet afgerond. Er is geen bedrag afgeschreven.
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 mb-8">
            <p className="text-sm text-muted">
              Je kunt het opnieuw proberen of later betalen via je account. 
              De openstaande betaling blijft beschikbaar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {paymentId && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <RefreshCw size={16} /> Opnieuw proberen
              </button>
            )}
            <Link
              href="/mijn-account"
              className="inline-flex items-center justify-center gap-2 bg-surface-alt text-foreground-light px-6 py-3 rounded-xl font-semibold hover:bg-surface-alt transition-colors"
            >
              Naar Mijn Account <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BetalingGeannuleerdPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <GeannuleerdContent />
    </Suspense>
  );
}

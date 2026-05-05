'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/context';
import { readConsent, writeConsent } from '@/lib/consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [granular, setGranular] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (readConsent()) return;
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const acceptAll = () => {
    writeConsent({ analytics: true, marketing: true });
    setShow(false);
  };

  const rejectAll = () => {
    writeConsent({ analytics: false, marketing: false });
    setShow(false);
  };

  const saveGranular = () => {
    writeConsent({ analytics, marketing });
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Cookie className="text-primary" size={20} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="cookie-title" className="font-semibold text-foreground text-sm sm:text-base mb-1">{t('cookie.title')}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {t('cookie.text')}{' '}
                  <Link href="/privacy" className="text-primary underline">
                    {t('cookie.privacyPolicy')}
                  </Link>.
                </p>

                {granular && (
                  <fieldset className="mt-3 space-y-2 border border-border rounded-lg p-3">
                    <legend className="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">
                      {t('cookie.preferencesTitle') || 'Voorkeuren'}
                    </legend>
                    <label className="flex items-start gap-2.5 text-xs cursor-not-allowed opacity-70">
                      <input type="checkbox" checked disabled className="mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{t('cookie.functional') || 'Noodzakelijk'}</div>
                        <div className="text-muted">{t('cookie.functionalDesc') || 'Vereist voor de werking van de site (taalvoorkeur, sessies). Altijd actief.'}</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{t('cookie.analytics') || 'Statistieken'}</div>
                        <div className="text-muted">{t('cookie.analyticsDesc') || 'Anoniem meten hoe de site wordt gebruikt om \'m te verbeteren.'}</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{t('cookie.marketing') || 'Marketing'}</div>
                        <div className="text-muted">{t('cookie.marketingDesc') || 'Persoonlijke aanbiedingen via externe netwerken (bijv. social ads).'}</div>
                      </div>
                    </label>
                  </fieldset>
                )}

                {/* Equal-prominence knoppen — GDPR vereist dat 'weiger' net zo
                    toegankelijk is als 'accepteer'. Beide solid, zelfde maat. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 sm:mt-4">
                  {granular ? (
                    <>
                      <button
                        onClick={saveGranular}
                        className="px-4 sm:px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-xs sm:text-sm hover:bg-primary-dark transition-colors"
                      >
                        {t('cookie.savePreferences') || 'Voorkeuren opslaan'}
                      </button>
                      <button
                        onClick={() => setGranular(false)}
                        className="px-4 sm:px-6 py-2.5 bg-surface text-foreground font-semibold rounded-full text-xs sm:text-sm hover:bg-surface-alt border border-border transition-colors"
                      >
                        {t('cookie.back') || 'Terug'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={acceptAll}
                        className="px-4 sm:px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-xs sm:text-sm hover:bg-primary-dark transition-colors"
                      >
                        {t('cookie.accept') || 'Accepteer alles'}
                      </button>
                      <button
                        onClick={rejectAll}
                        className="px-4 sm:px-6 py-2.5 bg-foreground text-white font-semibold rounded-full text-xs sm:text-sm hover:bg-foreground-light transition-colors"
                      >
                        {t('cookie.essentialOnly') || 'Alleen noodzakelijk'}
                      </button>
                    </>
                  )}
                </div>
                {!granular && (
                  <button
                    onClick={() => setGranular(true)}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-foreground underline underline-offset-2"
                  >
                    <Settings2 size={12} aria-hidden="true" />
                    {t('cookie.preferences') || 'Voorkeuren beheren'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

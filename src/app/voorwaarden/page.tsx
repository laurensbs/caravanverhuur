'use client';

import Link from 'next/link';
import { AlertTriangle, CreditCard, Clock, Shield, Info, Bike } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function VoorwaardenPage() {
  const { t } = useLanguage();

  const articles = [
    { key: 'a1', highlight: false },
    { key: 'a2', highlight: false },
    { key: 'a3', highlight: false },
    { key: 'a4', highlight: true },
    { key: 'a5', highlight: true },
    { key: 'a6', highlight: true },
    { key: 'a7', highlight: true },
    { key: 'a8', highlight: false },
    { key: 'a9', highlight: true },
    { key: 'a10', highlight: false },
    { key: 'a11', highlight: false },
    { key: 'a12', highlight: false },
    { key: 'a13', highlight: false },
    { key: 'a14', highlight: false },
    { key: 'a15', highlight: false },
    { key: 'a16', highlight: false },
    { key: 'a17', highlight: false },
    { key: 'a18', highlight: false },
    { key: 'a19', highlight: false },
  ];

  return (
    <>
      {/* Quick nav */}
      <section className="bg-white sticky top-[80px] sm:top-[96px] z-30 border-b border-gray-100 pt-8 sm:pt-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {articles.map(a => (
              <a key={a.key} href={`#${a.key}`}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-muted hover:bg-surface transition-colors"
              >
                {(t(`termsPage.${a.key}Title`) as string).replace(/^Artikel \d+ — |^Article \d+ — |^Artículo \d+ — /, '')}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t('termsPage.pageTitle')}</h1>
            <p className="text-lg text-primary font-semibold italic">{t('termsPage.pageSubtitle')}</p>
            <p className="text-muted mt-3 max-w-2xl mx-auto">{t('termsPage.pageIntro')}</p>
          </div>

          {/* Caravan disclaimer banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
            <Info size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">Let op / Please note</p>
              <p className="text-sm text-amber-800 leading-relaxed">{t('termsPage.caravanDisclaimer')}</p>
            </div>
          </div>

          {/* Check-in/out highlight */}
          <div id="a4" className="grid sm:grid-cols-2 gap-4 scroll-mt-20">
            <div className="bg-primary-50 border-primary-light rounded-2xl p-5 text-center">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Check-in</p>
              <p className="text-3xl font-bold text-foreground">15:00</p>
              <p className="text-sm text-muted mt-1">{t('termsPage.a4Title')}</p>
            </div>
            <div className="bg-surface rounded-2xl p-5 text-center">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Check-out</p>
              <p className="text-3xl font-bold text-foreground">10:00</p>
              <p className="text-sm text-muted mt-1">{t('termsPage.a4Title')}</p>
            </div>
          </div>

          {/* Payment summary highlight */}
          <div id="a5" className="bg-white rounded-2xl p-6 sm:p-8 scroll-mt-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <CreditCard size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('termsPage.a5Title')}</h2>
            </div>
            <p className="text-muted leading-relaxed mb-4">{t('termsPage.a5Text')}</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">25%</p>
                <p className="text-xs text-muted mt-1">Aanbetaling bij boeking</p>
              </div>
              <div className="bg-surface rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">€400+</p>
                <p className="text-xs text-muted mt-1">Borg (+ €200/fiets)</p>
              </div>
              <div className="bg-surface rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">75%</p>
                <p className="text-xs text-muted mt-1">Rest na ontvangst borg</p>
              </div>
            </div>
            {/* Seasonal pricing table */}
            <div className="bg-surface rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-foreground mb-3">{t('caravans.seasonalPricing')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t('caravans.preSeason')}</span><span className="font-bold text-foreground">€550/week</span></div>
                <div className="flex justify-between"><span className="text-amber-700 font-medium">{t('caravans.highSeason')}</span><span className="font-bold text-amber-700">€650/week</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('caravans.postSeason')}</span><span className="font-bold text-foreground">€550/week</span></div>
              </div>
              <p className="text-xs text-muted mt-2">{t('caravans.basedOn')} &bull; {t('caravans.inclVat')}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-1" />
              <p className="text-sm text-amber-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.a7Note') }} />
            </div>
          </div>

          {/* Borg highlight (Article 6) */}
          <div id="a6" className="bg-white rounded-2xl p-6 sm:p-8 scroll-mt-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Shield size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('termsPage.a6Title')}</h2>
            </div>
            <div className="space-y-3">
              <p className="text-muted leading-relaxed">{t('termsPage.a6Text')}</p>
              <p className="text-muted leading-relaxed">{t('termsPage.a6Text2')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-surface rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">&euro;400</p>
                  <p className="text-xs text-muted mt-1">Standaard borg caravan</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Bike size={18} className="text-amber-700" />
                    <p className="text-2xl font-bold text-amber-700">+ &euro;200</p>
                  </div>
                  <p className="text-xs text-amber-800">Extra borg per (mountain)fiets</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-1" />
                <p className="text-sm text-amber-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.a6Note') }} />
              </div>
            </div>
          </div>

          {/* Cancellation highlight */}
          <div id="a9" className="bg-white rounded-2xl p-6 sm:p-8 scroll-mt-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Clock size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('termsPage.a9Title')}</h2>
            </div>
            <div className="space-y-3">
              <p className="text-muted leading-relaxed">{t('termsPage.a9Text')}</p>
              <p className="text-muted leading-relaxed">{t('termsPage.a9Text2')}</p>
              <div className="flex gap-3 bg-surface rounded-xl p-4">
                <Shield size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted leading-relaxed">{t('termsPage.a9Text3')}</p>
              </div>
            </div>
          </div>

          {/* All articles */}
          {articles.map(a => {
            // Skip a4, a5, a6, a9 since they have their own highlight sections above
            if (['a4', 'a5', 'a6', 'a9'].includes(a.key)) return null;
            const title = t(`termsPage.${a.key}Title`) as string;
            const text = t(`termsPage.${a.key}Text`) as string;
            const text2 = t(`termsPage.${a.key}Text2`);
            const text3 = t(`termsPage.${a.key}Text3`);
            const note = t(`termsPage.${a.key}Note`);

            return (
              <div key={a.key} id={a.key} className="bg-white rounded-2xl p-6 sm:p-8 scroll-mt-20">
                <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
                <div className="space-y-3">
                  <p className="text-muted leading-relaxed">{text}</p>
                  {text2 && typeof text2 === 'string' && !text2.startsWith('termsPage.') && (
                    <p className="text-muted leading-relaxed">{text2}</p>
                  )}
                  {text3 && typeof text3 === 'string' && !text3.startsWith('termsPage.') && (
                    <p className="text-muted leading-relaxed">{text3}</p>
                  )}
                  {note && typeof note === 'string' && !note.startsWith('termsPage.') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: note }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Closing */}
          <div className="text-center py-6">
            <p className="text-lg font-semibold text-primary italic">{t('termsPage.closingText')}</p>
            <div className="mt-4 text-sm text-muted space-y-0.5">
              <p className="font-bold text-foreground">{t('termsPage.companyName')}</p>
              <p>{t('termsPage.companyAddress')}</p>
              <p>{t('termsPage.companyNif')}</p>
              <p>{t('termsPage.companyWeb')}</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link href="/" className="text-primary text-sm font-medium flex items-center gap-1">
              ← {t('legal.backToHome')}
            </Link>
            <Link href="/privacy" className="text-primary text-sm font-medium flex items-center gap-1">
              {t('legal.privacy')} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import Link from 'next/link';
import {
  FileText, CreditCard, XCircle, Shield, UserCheck, Package,
  Scale, Clock, Gavel, Mail, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function VoorwaardenPage() {
  const { t } = useLanguage();

  const sections = [
    {
      id: 'definities',
      icon: FileText,
      title: t('termsPage.s1Title'),
      content: (
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            { term: t('termsPage.s1Term1'), def: t('termsPage.s1Def1') },
            { term: t('termsPage.s1Term2'), def: t('termsPage.s1Def2') },
            { term: t('termsPage.s1Term3'), def: t('termsPage.s1Def3') },
            { term: t('termsPage.s1Term4'), def: t('termsPage.s1Def4') },
          ]).map(d => (
            <div key={d.term} className="bg-surface rounded-xl p-4">
              <p className="font-semibold text-foreground text-sm mb-1">{d.term}</p>
              <p className="text-muted text-sm leading-relaxed">{d.def}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'betaling',
      icon: CreditCard,
      title: t('termsPage.s2Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s2P1') }} />
          <div className="bg-primary-50 border-primary-light rounded-xl p-4 flex gap-3">
            <CreditCard size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s2Note') }} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s2CampingNote') }} />
          </div>
        </div>
      ),
    },
    {
      id: 'annulering',
      icon: XCircle,
      title: t('termsPage.s3Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('termsPage.s3Intro')}</p>
          <div className="space-y-3">
            {([
              { period: t('termsPage.s3Period1'), pct: '100%', desc: t('termsPage.s3Desc1'), color: 'bg-primary-50 border-primary-light text-primary-dark' },
              { period: t('termsPage.s3Period2'), pct: '50%', desc: t('termsPage.s3Desc2'), color: 'bg-primary-50/50 border-primary-light/50 text-primary' },
              { period: t('termsPage.s3Period3'), pct: '0%', desc: t('termsPage.s3Desc3'), color: 'bg-danger/5 border-danger/20 text-danger' },
            ]).map(r => (
              <div key={r.period} className={`flex items-center gap-4 p-4 rounded-xl ${r.color}`}>
                <span className="text-xl font-bold shrink-0 w-14 text-center">{r.pct}</span>
                <div>
                  <p className="font-semibold text-sm">{r.period} {t('termsPage.s3BeforeArrival')}</p>
                  <p className="text-sm opacity-80">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 bg-surface rounded-xl p-4">
            <AlertTriangle size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s3Note') }} />
          </div>
        </div>
      ),
    },
    {
      id: 'borg',
      icon: Shield,
      title: t('termsPage.s4Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s4P1') }} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-4">
              <p className="font-semibold text-foreground text-sm mb-1">{t('termsPage.s4Coverage')}</p>
              <p className="text-muted text-sm leading-relaxed">{t('termsPage.s4CoverageDef')}</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <p className="font-semibold text-foreground text-sm mb-1">{t('termsPage.s4Refund')}</p>
              <p className="text-muted text-sm leading-relaxed">{t('termsPage.s4RefundDef')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'verplichtingen',
      icon: UserCheck,
      title: t('termsPage.s5Title'),
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            t('termsPage.s5Rule1'), t('termsPage.s5Rule2'), t('termsPage.s5Rule3'),
            t('termsPage.s5Rule4'), t('termsPage.s5Rule5'), t('termsPage.s5Rule6'),
          ]).map((rule, i) => (
            <div key={i} className="flex gap-3 bg-surface rounded-xl p-4">
              <ChevronRight size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'inventaris',
      icon: Package,
      title: t('termsPage.s6Title'),
      content: <p className="text-muted leading-relaxed">{t('termsPage.s6P1')}</p>,
    },
    {
      id: 'aansprakelijkheid',
      icon: Scale,
      title: t('termsPage.s7Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('termsPage.s7Intro')}</p>
          <ul className="space-y-2">
            {([t('termsPage.s7Item1'), t('termsPage.s7Item2'), t('termsPage.s7Item3')]).map((item, i) => (
              <li key={i} className="flex gap-3 items-start text-muted text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-muted mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="bg-primary-50 border-primary-light rounded-xl p-4 flex gap-3">
            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('termsPage.s7Note') }} />
          </div>
        </div>
      ),
    },
    {
      id: 'check-in-out',
      icon: Clock,
      title: t('termsPage.s8Title'),
      content: (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-primary-50 border-primary-light rounded-xl p-5 text-center">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{t('termsPage.s8CheckIn')}</p>
            <p className="text-2xl font-bold text-foreground">15:00</p>
            <p className="text-sm text-muted mt-1">{t('termsPage.s8OnArrival')}</p>
          </div>
          <div className="bg-surface rounded-xl p-5 text-center">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{t('termsPage.s8CheckOut')}</p>
            <p className="text-2xl font-bold text-foreground">11:00</p>
            <p className="text-sm text-muted mt-1">{t('termsPage.s8OnDeparture')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'geschillen',
      icon: Gavel,
      title: t('termsPage.s9Title'),
      content: <p className="text-muted leading-relaxed">{t('termsPage.s9P1')}</p>,
    },
    {
      id: 'contact',
      icon: Mail,
      title: t('termsPage.s10Title'),
      content: (
        <p className="text-muted leading-relaxed">
          {t('termsPage.s10P1')}{' '}
          <a href="mailto:info@caravanverhuurspanje.com" className="text-primary font-medium">
            info@caravanverhuurspanje.com
          </a>.
        </p>
      ),
    },
  ];

  return (
    <>
      {/* Quick nav */}
      <section className="bg-white sticky top-[80px] sm:top-[96px] z-30 border-b border-gray-100 pt-8 sm:pt-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-muted transition-colors"
              >
                {s.title.replace(/^\d+\.\s/, '')}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t('termsPage.pageTitle')}</h1>
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} id={s.id} className="bg-white rounded-2xl p-6 sm:p-8 scroll-mt-20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
                </div>
                {s.content}
              </div>
            );
          })}

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

'use client';

import Link from 'next/link';
import {
  Eye, Database, CreditCard, Clock, UserCheck, Cookie,
  Lock, Share2, Mail, ChevronRight, Shield,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

export default function PrivacyPage() {
  const { t } = useLanguage();

  const sections = [
    {
      id: 'gegevens',
      icon: Database,
      title: t('privacyPage.s1Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s1Intro')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              t('privacyPage.s1Item1'), t('privacyPage.s1Item2'), t('privacyPage.s1Item3'),
              t('privacyPage.s1Item4'), t('privacyPage.s1Item5'), t('privacyPage.s1Item6'),
              t('privacyPage.s1Item7'),
            ]).map((item, i) => (
              <div key={i} className="flex gap-3 bg-surface rounded-xl p-3.5">
                <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'doel',
      icon: Eye,
      title: t('privacyPage.s2Title'),
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            t('privacyPage.s2Item1'), t('privacyPage.s2Item2'), t('privacyPage.s2Item3'),
            t('privacyPage.s2Item4'), t('privacyPage.s2Item5'), t('privacyPage.s2Item6'),
          ]).map((item, i) => (
            <div key={i} className="flex gap-3 bg-surface rounded-xl p-3.5">
              <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted">{item}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'betalingen',
      icon: CreditCard,
      title: t('privacyPage.s3Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s3P1')}</p>
          <div className="bg-primary-50 border-primary-light rounded-xl p-4 flex gap-3">
            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('privacyPage.s3Note') }} />
          </div>
        </div>
      ),
    },
    {
      id: 'bewaartermijn',
      icon: Clock,
      title: t('privacyPage.s4Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s4Intro')}</p>
          <div className="space-y-3">
            {([
              { label: t('privacyPage.s4Label1'), period: t('privacyPage.s4Period1'), note: t('privacyPage.s4Note1') },
              { label: t('privacyPage.s4Label2'), period: t('privacyPage.s4Period2'), note: t('privacyPage.s4Note2') },
              { label: t('privacyPage.s4Label3'), period: t('privacyPage.s4Period3'), note: t('privacyPage.s4Note3') },
            ]).map(item => (
              <div key={item.label} className="flex items-center gap-4 bg-surface rounded-xl p-4">
                <span className="text-lg font-bold text-primary shrink-0 w-20 text-center">{item.period}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  {item.note && <p className="text-xs text-muted">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'rechten',
      icon: UserCheck,
      title: t('privacyPage.s5Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s5Intro')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { right: t('privacyPage.s5Right1'), desc: t('privacyPage.s5Desc1') },
              { right: t('privacyPage.s5Right2'), desc: t('privacyPage.s5Desc2') },
              { right: t('privacyPage.s5Right3'), desc: t('privacyPage.s5Desc3') },
              { right: t('privacyPage.s5Right4'), desc: t('privacyPage.s5Desc4') },
              { right: t('privacyPage.s5Right5'), desc: t('privacyPage.s5Desc5') },
            ]).map(r => (
              <div key={r.right} className="bg-surface rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-1">{r.right}</p>
                <p className="text-muted text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'cookies',
      icon: Cookie,
      title: t('privacyPage.s6Title'),
      content: (
        <p className="text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t('privacyPage.s6P1') }} />
      ),
    },
    {
      id: 'beveiliging',
      icon: Lock,
      title: t('privacyPage.s7Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s7Intro')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              t('privacyPage.s7Item1'), t('privacyPage.s7Item2'),
              t('privacyPage.s7Item3'), t('privacyPage.s7Item4'),
            ]).map((item, i) => (
              <div key={i} className="flex gap-3 bg-primary-50 border-primary-light rounded-xl p-3.5">
                <Lock size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'derden',
      icon: Share2,
      title: t('privacyPage.s8Title'),
      content: (
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">{t('privacyPage.s8Intro')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { party: t('privacyPage.s8Party1'), reason: t('privacyPage.s8Reason1') },
              { party: t('privacyPage.s8Party2'), reason: t('privacyPage.s8Reason2') },
              { party: t('privacyPage.s8Party3'), reason: t('privacyPage.s8Reason3') },
              { party: t('privacyPage.s8Party4'), reason: t('privacyPage.s8Reason4') },
            ]).map(p => (
              <div key={p.party} className="bg-surface rounded-xl p-4">
                <p className="font-semibold text-foreground text-sm mb-1">{p.party}</p>
                <p className="text-muted text-sm">{p.reason}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      icon: Mail,
      title: t('privacyPage.s9Title'),
      content: (
        <p className="text-muted leading-relaxed">
          {t('privacyPage.s9P1')}{' '}
          <a href="mailto:info@caravanverhuurspanje.com" className="text-primary font-medium">
            info@caravanverhuurspanje.com
          </a>
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
              <a
                key={s.id}
                href={`#${s.id}`}
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
          {/* Intro */}
          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('privacyPage.pageTitle')}</h1>
            <p className="text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t('privacyPage.intro') }} />
          </div>

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
            <Link href="/voorwaarden" className="text-primary text-sm font-medium flex items-center gap-1">
              ← {t('legal.terms')}
            </Link>
            <Link href="/" className="text-primary text-sm font-medium flex items-center gap-1">
              {t('legal.backToHome')} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

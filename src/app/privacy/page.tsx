'use client';

import Link from 'next/link';
import {
  Eye, Database, CreditCard, Clock, UserCheck, Cookie,
  Lock, Share2, Mail, ChevronRight, Shield,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const sections = [
  {
    id: 'gegevens',
    icon: Database,
    title: '1. Welke gegevens verzamelen wij?',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Wij verzamelen de volgende persoonsgegevens:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Voor- en achternaam',
            'E-mailadres',
            'Telefoonnummer',
            'Adresgegevens (indien nodig voor facturatie)',
            'Betaalgegevens (via iDEAL/Stripe, niet door ons opgeslagen)',
            'Boekingsgegevens (datum, camping, personen, caravankeuze)',
            'Communicatie (berichten via contactformulier)',
          ].map((item, i) => (
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
    title: '2. Waarvoor gebruiken wij uw gegevens?',
    content: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          'Het verwerken en bevestigen van boekingen',
          'Het versturen van betalingsherinneringen en boekingsbevestigingen',
          'Communicatie over uw boeking',
          'Het uitvoeren van de huurovereenkomst',
          'Het verbeteren van onze dienstverlening',
          'Voldoen aan wettelijke verplichtingen',
        ].map((item, i) => (
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
    title: '3. Betalingsverwerking',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">
          Betalingen worden verwerkt via iDEAL, gefaciliteerd door Stripe, een PCI DSS Level 1 gecertificeerde betalingsverwerker.
        </p>
        <div className="bg-primary-50 border border-primary-light rounded-xl p-4 flex gap-3">
          <Shield size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            Wij slaan <strong>geen bankgegevens</strong> op onze servers op. Alle betaalgegevens worden direct en versleuteld verwerkt door uw bank via iDEAL.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'bewaartermijn',
    icon: Clock,
    title: '4. Bewaartermijn',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Wij bewaren uw gegevens niet langer dan noodzakelijk:</p>
        <div className="space-y-3">
          {[
            { label: 'Boekingsgegevens', period: '7 jaar', note: 'Wettelijke bewaarplicht' },
            { label: 'Contactformulierberichten', period: '1 jaar', note: '' },
            { label: 'Marketingcommunicatie', period: 'Tot intrekking', note: 'U kunt uw toestemming altijd intrekken' },
          ].map(item => (
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
    title: '5. Uw Rechten',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Onder de AVG/GDPR heeft u de volgende rechten:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { right: 'Recht op inzage', desc: 'U kunt opvragen welke gegevens wij van u hebben' },
            { right: 'Recht op rectificatie', desc: 'U kunt onjuiste gegevens laten corrigeren' },
            { right: 'Recht op verwijdering', desc: 'U kunt verzoeken uw gegevens te verwijderen' },
            { right: 'Recht op overdraagbaarheid', desc: 'U kunt uw gegevens in een gangbaar formaat opvragen' },
            { right: 'Recht op bezwaar', desc: 'U kunt bezwaar maken tegen de verwerking' },
          ].map(r => (
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
    title: '6. Cookies',
    content: (
      <p className="text-muted leading-relaxed">
        Onze website maakt gebruik van <strong className="text-foreground">functionele cookies</strong> die noodzakelijk zijn voor het functioneren van de website.
        Wij gebruiken geen tracking cookies zonder uw toestemming.
        Als wij analytics gebruiken, doen wij dit met een privacy-vriendelijke oplossing.
      </p>
    ),
  },
  {
    id: 'beveiliging',
    icon: Lock,
    title: '7. Beveiliging',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Wij nemen passende maatregelen om uw gegevens te beschermen:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'SSL/TLS versleuteling op onze website',
            'Versleutelde opslag van gevoelige gegevens',
            'Beperkte toegang tot persoonsgegevens',
            'Regelmatige beveiligingsaudits',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 bg-primary-50 border border-primary-light rounded-xl p-3.5">
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
    title: '8. Delen met Derden',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Wij delen uw gegevens niet met derden, behalve:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { party: 'Stripe / iDEAL', reason: 'Betalingsverwerking' },
            { party: 'E-maildienstverlener', reason: 'Boekingsbevestigingen' },
            { party: 'Campingbeheerders', reason: 'Voor uw reservering' },
            { party: 'Overheid', reason: 'Wanneer wettelijk verplicht' },
          ].map(p => (
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
    title: '9. Contact',
    content: (
      <p className="text-muted leading-relaxed">
        Voor vragen over dit privacybeleid of om uw rechten uit te oefenen, kunt u contact opnemen via:{' '}
        <a href="mailto:info@caravanverhuurspanje.com" className="text-primary font-medium">
          info@caravanverhuurcostabrava.com
        </a>
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-primary-dark text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")' }} />
        <div className="max-w-4xl mx-auto px-4 relative">
          <div className="flex items-center gap-3 text-primary-light text-sm mb-4">
            <Link href="/" className="transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span>{t('legal.privacy')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3">{t('legal.privacy')}</h1>
          <p className="text-primary-light text-lg">{t('legal.lastUpdated')}</p>
        </div>
      </section>

      {/* Quick nav */}
      <section className="border-b bg-white sticky top-0 z-30">
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
          <div className="bg-white rounded-2xl border p-6 sm:p-8">
            <p className="text-muted leading-relaxed">
              Caravanverhuur Costa Brava (onderdeel van Caravanstalling-Spanje) respecteert uw privacy en gaat zorgvuldig om met uw persoonsgegevens.
              Dit privacybeleid beschrijft hoe wij uw gegevens verzamelen, gebruiken en beschermen conform de
              <strong className="text-foreground"> Algemene Verordening Gegevensbescherming (AVG/GDPR)</strong>.
            </p>
          </div>

          {sections.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} id={s.id} className="bg-white rounded-2xl border p-6 sm:p-8 scroll-mt-20">
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

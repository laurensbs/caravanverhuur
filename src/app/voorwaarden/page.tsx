'use client';

import Link from 'next/link';
import {
  FileText, CreditCard, XCircle, Shield, UserCheck, Package,
  Scale, Clock, Gavel, Mail, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const sections = [
  {
    id: 'definities',
    icon: FileText,
    title: '1. Definities',
    content: (
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { term: 'Verhuurder', def: 'Caravanverhuur Costa Brava, onderdeel van Caravanstalling-Spanje.' },
          { term: 'Huurder', def: 'De persoon die een caravan huurt via onze website of telefonisch.' },
          { term: 'Caravan', def: 'Het gehuurde object inclusief alle aanwezige inventaris.' },
          { term: 'Huurperiode', def: 'De periode tussen de overeengekomen aankomst- en vertrekdatum.' },
        ].map(d => (
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
    title: '2. Boeking en Betaling', content: ( <div className="space-y-4"> <p className="text-muted leading-relaxed"> Een boeking is definitief na ontvangst van de aanbetaling van <strong className="text-foreground">30%</strong> van de totale huurprijs. De aanbetaling wordt voldaan via iDEAL/Wero bij het boeken. </p> <div className="bg-primary-50 border-primary-light rounded-xl p-4 flex gap-3"> <CreditCard size={20} className="text-primary shrink-0 mt-0.5" /> <p className="text-sm text-foreground leading-relaxed"> Het restbedrag (70%) dient uiterlijk <strong>7 dagen voor aanvang</strong> van de huurperiode te zijn voldaan via iDEAL/Wero. </p> </div> </div> ), }, { id:'annulering',
    icon: XCircle,
    title: '3. Annuleringsbeleid',
    content: (
      <div className="space-y-4">
        <p className="text-muted leading-relaxed">Bij annulering gelden de volgende voorwaarden:</p>
        <div className="space-y-3"> {[ { period: 'Meer dan 30 dagen', pct: '100%', desc: 'Volledige restitutie van de aanbetaling', color: 'bg-primary-50 border-primary-light text-primary-dark' }, { period: '14 – 30 dagen', pct: '50%', desc: '50% restitutie van de aanbetaling', color: 'bg-primary-50/50 border-primary-light/50 text-primary' }, { period: 'Minder dan 14 dagen', pct: '0%', desc: 'Geen restitutie mogelijk', color: 'bg-danger/5 border-danger/20 text-danger' }, ].map(r => ( <div key={r.period} className={`flex items-center gap-4 p-4 rounded-xl ${r.color}`}> <span className="text-xl font-bold shrink-0 w-14 text-center">{r.pct}</span> <div> <p className="font-semibold text-sm">{r.period} voor aankomst</p> <p className="text-sm opacity-80">{r.desc}</p> </div> </div> ))} </div> <div className="flex gap-3 bg-surface rounded-xl p-4"> <AlertTriangle size={18} className="text-primary shrink-0 mt-0.5" /> <p className="text-sm text-muted leading-relaxed"> Annuleringen dienen <strong className="text-foreground">schriftelijk per e-mail</strong> te worden ingediend. De datum van ontvangst geldt als annuleringsdatum. </p> </div> </div> ), }, { id: 'borg', icon: Shield, title: '4. Borg', content: ( <div className="space-y-4"> <p className="text-muted leading-relaxed"> Bij aanvang van de huurperiode wordt een borg van <strong className="text-foreground">€200 tot €500</strong> gereserveerd via iDEAL/Wero (afhankelijk van het type caravan). </p> <div className="grid sm:grid-cols-2 gap-3"> <div className="bg-surface rounded-xl p-4"> <p className="font-semibold text-foreground text-sm mb-1">Dekking</p> <p className="text-muted text-sm leading-relaxed">Eventuele schade aan de caravan of ontbrekende inventaris.</p> </div> <div className="bg-surface rounded-xl p-4"> <p className="font-semibold text-foreground text-sm mb-1">Terugbetaling</p> <p className="text-muted text-sm leading-relaxed">Na controle bij vertrek: binnen 7 werkdagen teruggestort, verminderd met eventuele schadekosten.</p> </div> </div> </div> ), }, { id: 'verplichtingen', icon: UserCheck, title: '5. Verplichtingen Huurder', content: ( <div className="grid sm:grid-cols-2 gap-3"> {[ 'De huurder dient de caravan als een goed huurder te gebruiken', 'Roken in de caravan is niet toegestaan', 'Huisdieren alleen na voorafgaand overleg en akkoord', 'Aansprakelijk voor schade tijdens de huurperiode', 'Caravan schoon en in dezelfde staat achterlaten', 'Maximaal aantal personen als aangegeven bij boeking', ].map((rule, i) => ( <div key={i} className="flex gap-3 bg-surface rounded-xl p-4"> <ChevronRight size={16} className="text-primary shrink-0 mt-0.5" /> <p className="text-sm text-muted leading-relaxed">{rule}</p> </div> ))} </div> ), }, { id: 'inventaris', icon: Package, title: '6. Inventaris', content: ( <p className="text-muted leading-relaxed"> Elke caravan wordt verhuurd inclusief een volledige inventaris. Bij aankomst dient de huurder de inventarislijst te controleren. Ontbrekende of beschadigde items worden verrekend met de borg. De inventarislijst wordt bij elke caravan getoond op de website. </p> ), }, { id: 'aansprakelijkheid', icon: Scale, title: '7. Aansprakelijkheid', content: ( <div className="space-y-4"> <p className="text-muted leading-relaxed"> Caravanverhuur Costa Brava is niet aansprakelijk voor: </p> <ul className="space-y-2"> {[ 'Persoonlijk letsel', 'Diefstal of verlies van persoonlijke bezittingen', 'Weersomstandigheden of andere zaken buiten onze controle', ].map((item, i) => ( <li key={i} className="flex gap-3 items-start text-muted text-sm"> <span className="w-1.5 h-1.5 rounded-full bg-muted mt-2 shrink-0" /> {item} </li> ))} </ul> <div className="bg-primary-50 border-primary-light rounded-xl p-4 flex gap-3"> <Shield size={18} className="text-primary shrink-0 mt-0.5" /> <p className="text-sm text-foreground leading-relaxed"> Wij adviseren huurders een <strong>reisverzekering</strong> af te sluiten. </p> </div> </div> ), }, { id:'check-in-out', icon: Clock, title: '8. Check-in en Check-out', content: ( <div className="grid sm:grid-cols-2 gap-4"> <div className="bg-primary-50 border-primary-light rounded-xl p-5 text-center"> <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Check-in</p> <p className="text-2xl font-bold text-foreground">15:00</p> <p className="text-sm text-muted mt-1">uur op de aankomstdatum</p> </div> <div className="bg-surface rounded-xl p-5 text-center"> <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Check-out</p> <p className="text-2xl font-bold text-foreground">11:00</p> <p className="text-sm text-muted mt-1">uur op de vertrekdatum</p> </div> </div> ), }, { id:'geschillen', icon: Gavel, title: '9. Geschillen', content: ( <p className="text-muted leading-relaxed"> Op deze voorwaarden is het Spaans recht van toepassing. Geschillen zullen in eerste instantie in onderling overleg worden opgelost. </p> ), }, { id: 'contact', icon: Mail, title: '10. Contact', content: ( <p className="text-muted leading-relaxed"> Voor vragen over deze voorwaarden kunt u contact opnemen via{' '} <a href="mailto:info@caravanverhuurspanje.com" className="text-primary font-medium"> info@caravanverhuurspanje.com </a>. </p> ), }, ]; export default function VoorwaardenPage() { const { t } = useLanguage(); return ( <> {/* Quick nav */} <section className="bg-white sticky top-[80px] sm:top-[96px] z-30 border-b border-gray-100 pt-8 sm:pt-10"> <div className="max-w-4xl mx-auto px-4"> <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide"> {sections.map(s => ( <a key={s.id} href={`#${s.id}`}
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

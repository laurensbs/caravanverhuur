import Link from 'next/link';

export const metadata = {
  title: 'Privacybeleid | Caravanverhuur Costa Brava',
};

export default function PrivacyPage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-4 prose prose-blue max-w-none">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacybeleid</h1>
        <p className="text-muted mb-8">Laatst bijgewerkt: 1 februari 2026</p>

        <p className="text-muted leading-relaxed mb-6">
          Caravanverhuur Costa Brava (onderdeel van Caravanstalling-Spanje) respecteert uw privacy en gaat zorgvuldig om met uw persoonsgegevens. 
          Dit privacybeleid beschrijft hoe wij uw gegevens verzamelen, gebruiken en beschermen conform de Algemene Verordening Gegevensbescherming (AVG/GDPR).
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">1. Welke gegevens verzamelen wij?</h2>
        <p className="text-muted leading-relaxed mb-2">Wij verzamelen de volgende persoonsgegevens:</p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>Voor- en achternaam</li>
          <li>E-mailadres</li>
          <li>Telefoonnummer</li>
          <li>Adresgegevens (indien nodig voor facturatie)</li>
          <li>Betaalgegevens (verwerkt via Stripe, niet door ons opgeslagen)</li>
          <li>Boekingsgegevens (datum, camping, personen, caravankeuze)</li>
          <li>Communicatie (berichten via contactformulier)</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">2. Waarvoor gebruiken wij uw gegevens?</h2>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>Het verwerken en bevestigen van boekingen</li>
          <li>Het versturen van betalingsherinneringen en boekingsbevestigingen</li>
          <li>Communicatie over uw boeking</li>
          <li>Het uitvoeren van de huurovereenkomst</li>
          <li>Het verbeteren van onze dienstverlening</li>
          <li>Voldoen aan wettelijke verplichtingen</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">3. Betalingsverwerking</h2>
        <p className="text-muted leading-relaxed mb-4">
          Betalingen worden verwerkt via Stripe, een PCI DSS Level 1 gecertificeerde betalingsverwerker. 
          Wij slaan geen creditcardgegevens of bankpasgegevens op onze servers op. 
          Alle betaalgegevens worden direct en versleuteld verwerkt door Stripe.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">4. Bewaartermijn</h2>
        <p className="text-muted leading-relaxed mb-4">
          Wij bewaren uw gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld:
        </p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>Boekingsgegevens: 7 jaar (wettelijke bewaarplicht)</li>
          <li>Contactformulierberichten: 1 jaar</li>
          <li>Marketingcommunicatie: tot intrekking toestemming</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">5. Uw Rechten</h2>
        <p className="text-muted leading-relaxed mb-2">Onder de AVG/GDPR heeft u de volgende rechten:</p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li><strong>Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u hebben</li>
          <li><strong>Recht op rectificatie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
          <li><strong>Recht op verwijdering:</strong> U kunt verzoeken uw gegevens te laten verwijderen</li>
          <li><strong>Recht op overdraagbaarheid:</strong> U kunt uw gegevens in een gangbaar formaat opvragen</li>
          <li><strong>Recht op bezwaar:</strong> U kunt bezwaar maken tegen de verwerking van uw gegevens</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">6. Cookies</h2>
        <p className="text-muted leading-relaxed mb-4">
          Onze website maakt gebruik van functionele cookies die noodzakelijk zijn voor het functioneren van de website. 
          Wij gebruiken geen tracking cookies zonder uw toestemming. 
          Als wij analytics gebruiken, doen wij dit met een privacy-vriendelijke oplossing.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">7. Beveiliging</h2>
        <p className="text-muted leading-relaxed mb-4">
          Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen:
        </p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>SSL/TLS versleuteling op onze website</li>
          <li>Versleutelde opslag van gevoelige gegevens</li>
          <li>Beperkte toegang tot persoonsgegevens</li>
          <li>Regelmatige beveiligingsaudits</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">8. Delen met Derden</h2>
        <p className="text-muted leading-relaxed mb-4">
          Wij delen uw gegevens niet met derden, behalve:
        </p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>Stripe (betalingsverwerking)</li>
          <li>E-maildienstverlener (boekingsbevestigingen)</li>
          <li>Campingbeheerders (voor uw reservering)</li>
          <li>Wanneer wettelijk verplicht</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">9. Contact</h2>
        <p className="text-muted leading-relaxed mb-4">
          Voor vragen over dit privacybeleid of om uw rechten uit te oefenen, kunt u contact opnemen via:<br />
          <a href="mailto:info@caravanverhuurcostabrava.com" className="text-primary underline">info@caravanverhuurcostabrava.com</a>
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary underline text-sm">
            &larr; Terug naar home
          </Link>
        </div>
      </div>
    </section>
  );
}

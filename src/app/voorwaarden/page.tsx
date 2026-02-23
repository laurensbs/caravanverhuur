import Link from 'next/link';

export const metadata = {
  title: 'Algemene Voorwaarden | Caravanverhuur Costa Brava',
};

export default function VoorwaardenPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-primary-dark to-primary text-white py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Algemene Voorwaarden</h1>
          <p className="text-blue-100">Laatst bijgewerkt: 1 februari 2026</p>
        </div>
      </section>
      <section className="py-16">
      <div className="max-w-3xl mx-auto px-4 prose prose-blue max-w-none">

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">1. Definities</h2>
        <p className="text-muted leading-relaxed mb-4">
          <strong>Verhuurder:</strong> Caravanverhuur Costa Brava, onderdeel van Caravanstalling-Spanje.<br />
          <strong>Huurder:</strong> De persoon die een caravan huurt via onze website of telefonisch.<br />
          <strong>Caravan:</strong> Het gehuurde object inclusief alle aanwezige inventaris.<br />
          <strong>Huurperiode:</strong> De periode tussen de overeengekomen aankomst- en vertrekdatum.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">2. Boeking en Betaling</h2>
        <p className="text-muted leading-relaxed mb-4">
          Een boeking is definitief na ontvangst van de aanbetaling van 30% van de totale huurprijs. De aanbetaling kan worden voldaan per bankoverschrijving of contant. Het restbedrag (70%) dient uiterlijk 7 dagen voor aanvang van de huurperiode te zijn voldaan via Stripe.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4" id="annulering">3. Annuleringsbeleid</h2>
        <p className="text-muted leading-relaxed mb-4">
          Bij annulering gelden de volgende voorwaarden:
        </p>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li><strong>Meer dan 30 dagen voor aankomst:</strong> 100% restitutie van de aanbetaling</li>
          <li><strong>14-30 dagen voor aankomst:</strong> 50% restitutie van de aanbetaling</li>
          <li><strong>Minder dan 14 dagen voor aankomst:</strong> Geen restitutie</li>
        </ul>
        <p className="text-muted leading-relaxed mb-4">
          Annuleringen dienen schriftelijk (per e-mail) te worden ingediend. De datum van ontvangst geldt als annuleringsdatum.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4" id="borg">4. Borg</h2>
        <p className="text-muted leading-relaxed mb-4">
          Bij aanvang van de huurperiode wordt een borg van €200 tot €500 gereserveerd via Stripe (afhankelijk van het type caravan). 
          De borg dient ter dekking van eventuele schade aan de caravan of ontbrekende inventaris. 
          Na controle bij vertrek wordt de borg binnen 7 werkdagen teruggestort, verminderd met eventuele schadekosten.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">5. Verplichtingen Huurder</h2>
        <ul className="list-disc pl-6 text-muted space-y-2 mb-4">
          <li>De huurder dient de caravan als een goed huurder te gebruiken</li>
          <li>Roken in de caravan is niet toegestaan</li>
          <li>Huisdieren alleen na voorafgaand overleg en akkoord</li>
          <li>De huurder is aansprakelijk voor schade veroorzaakt tijdens de huurperiode</li>
          <li>De caravan dient schoon en in dezelfde staat te worden achtergelaten</li>
          <li>Maximaal aantal personen als aangegeven bij boeking</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">6. Inventaris</h2>
        <p className="text-muted leading-relaxed mb-4">
          Elke caravan wordt verhuurd inclusief een volledige inventaris. Bij aankomst dient de huurder de inventarislijst te controleren. 
          Ontbrekende of beschadigde items worden verrekend met de borg. De inventarislijst wordt bij elke caravan getoond op de website.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">7. Aansprakelijkheid</h2>
        <p className="text-muted leading-relaxed mb-4">
          Caravanverhuur Costa Brava is niet aansprakelijk voor persoonlijk letsel, diefstal of verlies van persoonlijke bezittingen, 
          weersomstandigheden of andere zaken buiten onze controle. Wij adviseren huurders een reisverzekering af te sluiten.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">8. Check-in en Check-out</h2>
        <p className="text-muted leading-relaxed mb-4">
          <strong>Check-in:</strong> vanaf 15:00 uur op de aankomstdatum.<br />
          <strong>Check-out:</strong> voor 11:00 uur op de vertrekdatum.<br />
          Afwijkende tijden zijn uitsluitend mogelijk na voorafgaand overleg.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">9. Geschillen</h2>
        <p className="text-muted leading-relaxed mb-4">
          Op deze voorwaarden is het Spaans recht van toepassing. Geschillen zullen in eerste instantie in onderling overleg worden opgelost.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">10. Contact</h2>
        <p className="text-muted leading-relaxed mb-4">
          Voor vragen over deze voorwaarden kunt u contact opnemen via{' '}
          <a href="mailto:info@caravanverhuurcostabrava.com" className="text-primary underline">info@caravanverhuurcostabrava.com</a>.
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary underline text-sm">
            &larr; Terug naar home
          </Link>
        </div>
      </div>
    </section>
    </>
  );
}

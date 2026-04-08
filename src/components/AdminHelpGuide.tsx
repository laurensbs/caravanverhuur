'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  ClipboardCheck,
  Users,
  Mail,
  MessageCircle,
  Newspaper,
  CarFront,
  Tent,
  Tag,
  Shield,
  Lightbulb,
  Banknote,
  History,
  Percent,
  Smartphone,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
type GuideSection = {
  id: string;
  icon: React.ReactNode;
  title: string;
  paths?: string[];          // which admin pages this section is relevant to
  description: string;       // short intro
  content: string[];         // detailed paragraphs / instructions
  tips: string[];            // quick tips
  adminOnly?: boolean;       // mark sections only for admin role
};

type Props = {
  show: boolean;
  onClose: () => void;
  locale: 'nl' | 'en';
  pathname: string;
  onRestartTour: () => void;
};

/* ═══════════════════════════════════════════════════
   Guide content: DUTCH
   ═══════════════════════════════════════════════════ */
const ICON_CLASS = 'w-5 h-5';

const GUIDE_NL: GuideSection[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className={ICON_CLASS} />,
    title: 'Dashboard',
    paths: ['/admin'],
    description: 'Het startscherm met een overzicht van alle belangrijke informatie.',
    content: [
      'Het dashboard toont statistieken zoals het aantal boekingen, openstaande betalingen, nieuwe berichten en de omzet van de huidige maand.',
      'Klik op een statistiekkaart om direct naar de betreffende pagina te gaan (bijv. klik op "Boekingen" om alle boekingen te zien).',
      'Openstaande taken (zoals onbeantwoorde berichten of verlopen betalingen) verschijnen automatisch in de takenlijst.',
      'Admin-gebruikers kunnen data exporteren via de "Exporteer" knop. Staff-gebruikers zien deze optie niet.',
    ],
    tips: [
      'Controleer het dashboard dagelijks voor nieuwe taken.',
      'De omzetgrafiek toont de trend over de afgelopen maanden.',
      'Rode badges geven dringende acties aan.',
    ],
  },
  {
    id: 'planning',
    icon: <CalendarCheck className={ICON_CLASS} />,
    title: 'Planning',
    paths: ['/admin/planning'],
    description: 'Beheer alle taken per boeking: klaarmaken, bezorgen, ophalen en inspecteren.',
    content: [
      'De planning toont alle boekingen als takenlijsten. Elke boeking heeft 5 stappen die je in volgorde afwerkt.',
      '',
      '── De 5 stappen per boeking ──',
      '1. Klaarmaken — Caravan schoonmaken, beddengoed klaarzetten, gasflessen controleren en inventaris checken.',
      '2. Borgcheck (intern) — Borgchecklist doorlopen vóór vertrek. De klant ontvangt automatisch een borgmail.',
      '3. Bezorgen (15:00) — Caravan naar de camping rijden, op de juiste plek neerzetten. Luifel opzetten, gas en stroom aansluiten.',
      '4. Ophalen (10:00) — Borgcheck met de klant op de camping. Caravan opruimen, afkoppelen en terugrijden naar de stalling.',
      '5. Eindcontrole — Na terugkomst: controleer op schade en tel de inventaris na.',
      '',
      '── Hoe werkt het? ──',
      'Elke taak heeft een status: ○ Te doen, ▶ Bezig, ✓ Afgerond.',
      'Taken zijn vergrendeld totdat de vorige stap is afgerond (je kunt niet bezorgen als de borgcheck nog niet klaar is).',
      'Klik op het ronde statusbolletje om de status te veranderen.',
      'Klik op de taaknaam om details te zien, een chauffeur toe te wijzen of notities toe te voegen.',
      '',
      '── Weergaven ──',
      '• Overzicht — Alle boekingen met hun taken, gesorteerd op aankomstdatum.',
      '• Transport — Alleen bezorgingen en ophaalacties, ideaal voor chauffeurs.',
      '• Caravans — Per caravan de huidige of komende boeking met taken.',
      '',
      '── Betaling & Facturatie ──',
      'Onderaan elke boeking zie je de betaalstatus: betaallink verstuurd, aanbetaling ontvangen, en Holded facturen.',
      'Klik op een Holded-item om te markeren dat de factuur is aangemaakt.',
    ],
    tips: [
      'Boekingen met taken voor vandaag of te laat worden automatisch uitgeklapt.',
      'Rode badges en knipperende ⚠️ iconen geven dringende taken aan.',
      'Wijs altijd een chauffeur toe aan transport- en ophaaltaken.',
      'Gebruik de zoekbalk om snel een boeking te vinden op naam, referentie of camping.',
      'Gebruik de Transport-weergave om een dagplanning voor chauffeurs te maken.',
    ],
  },
  {
    id: 'boekingen',
    icon: <CalendarCheck className={ICON_CLASS} />,
    title: 'Boekingen',
    paths: ['/admin/boekingen'],
    description: 'Beheer alle boekingen: bekijken, filteren, en telefonische boekingen aanmaken.',
    content: [
      'Op de boekingenpagina zie je een overzicht van alle boekingen met status, datum, klantgegevens en bedrag.',
      'Gebruik de zoekbalk om te zoeken op naam, e-mailadres of boekingsnummer.',
      'Met de tabbladen bovenaan kun je filteren op status: Alles, In afwachting, Bevestigd, Geannuleerd, enz.',
      'Klik op een boeking om de volledige details te zien, inclusief betaalinformatie en borgstatus.',
      '── Telefonische boeking aanmaken ──',
      'Klik op de "Nieuwe boeking" knop rechtsboven om een boeking aan te maken voor een klant die telefonisch belt.',
      'Vul de klantgegevens in (naam, e-mail, telefoon), kies een caravan en camping, selecteer de data en het aantal reizigers.',
      'Het systeem berekent automatisch de prijs op basis van de gekozen caravan, periode en reizigersaantal.',
      'Na het aanmaken krijgt de klant automatisch een e-mail met een iDEAL/Wero betaallink.',
      'Als de klant nog geen account heeft, wordt er automatisch een account aangemaakt en ontvangt de klant de inloggegevens per e-mail.',
      'Je kunt de betaallink ook kopiëren en handmatig delen (bijv. via WhatsApp).',
    ],
    tips: [
      'Zoek op boekingsnummer (bijv. "CVS-2025-0001") voor snelle resultaten.',
      'Filter op "In afwachting" om boekingen te zien die nog betaald moeten worden.',
      'Bij telefonische boekingen: controleer altijd het e-mailadres voordat je verstuurt.',
      'Status kleuren: groen = bevestigd, oranje = in afwachting, rood = geannuleerd.',
    ],
  },
  {
    id: 'betalingen',
    icon: <CreditCard className={ICON_CLASS} />,
    title: 'Betalingen',
    paths: ['/admin/betalingen'],
    description: 'Overzicht van alle betalingen, statussen en terugbetalingen.',
    adminOnly: true,
    content: [
      'De betalingenpagina toont alle betalingen gekoppeld aan boekingen, met status, bedrag en type.',
      'Betalingsstatussen: BETAALD (groen), OPENSTAAND (oranje), VERLOPEN (rood), TERUGBETAALD (grijs).',
      'Betalingstypen: HUUR (de huurbetaling), BORG (borgsom), BORG_RETOUR (borg terugbetaling).',
      'Filter op type of status met de knoppen bovenaan.',
      '── Terugbetalingen ──',
      'Om een terugbetaling te doen: open de boeking via de boekingenpagina, scroll naar betalingen, klik op "Terugbetalen".',
      'Terugbetalingen worden direct verwerkt via Stripe en de klant ontvangt het geld binnen 5-10 werkdagen.',
      'Alleen betalingen met status BETAALD kunnen terugbetaald worden.',
      '── Stripe ──',
      'Alle betalingen worden verwerkt via Stripe (iDEAL en Wero). Je kunt het Stripe dashboard raadplegen voor gedetailleerde transactie-informatie.',
    ],
    tips: [
      'Controleer dagelijks op verlopen betalingen.',
      'Bij problemen met een betaling: controleer eerst de status in Stripe.',
      'Terugbetalingen kunnen alleen door admin-gebruikers worden gedaan.',
      'Deze pagina is alleen zichtbaar voor admin-gebruikers.',
    ],
  },
  {
    id: 'borg',
    icon: <ClipboardCheck className={ICON_CLASS} />,
    title: 'Borg & Inspectie',
    paths: ['/admin/borg'],
    description: 'Beheer borgchecklists en voer mobiele inspecties uit.',
    content: [
      'De borgpagina toont alle borgchecklists gekoppeld aan boekingen.',
      'Een borgchecklist wordt automatisch aangemaakt wanneer een boeking wordt bevestigd.',
      '── Checklist items ──',
      'De checklist bevat standaard items die gecontroleerd moeten worden bij bezorging en ophalen (bijv. inventaris, schoonmaak, schade).',
      'Elk item kan worden gemarkeerd als: Goed, Beschadigd, of Ontbreekt.',
      'Bij schade of ontbrekende items kun je foto\'s toevoegen als bewijs.',
      '── Mobiele inspectie ──',
      'Klik op "Mobiel Inspecteren" om de inspectie stap-voor-stap uit te voeren op je telefoon.',
      'Dit opent een fullscreen-weergave die ideaal is voor gebruik op locatie.',
      'Na voltooiing van de inspectie krijgt de klant automatisch een e-mail met een link om de checklist te bekijken en goed te keuren.',
      '── Borg terugbetaling ──',
      'Als alles in orde is, kun je de borg terugbetalen via de borgpagina.',
      'Bij schade kun je een gedeeltelijke borg terugbetaling doen en het schadebedrag inhouden.',
    ],
    tips: [
      'Doe de inspectie altijd samen met de klant voor transparantie.',
      'Maak foto\'s van eventuele schade als bewijs.',
      'De klant krijgt automatisch een link om de inspectie te bekijken.',
      'Controleer of alle items zijn afgevinkt voordat je de inspectie afrondt.',
    ],
  },
  {
    id: 'klanten',
    icon: <Users className={ICON_CLASS} />,
    title: 'Klanten',
    paths: ['/admin/klanten'],
    description: 'Bekijk en beheer alle klantaccounts.',
    content: [
      'De klantenpagina toont een overzicht van alle geregistreerde klanten.',
      'Je kunt zoeken op naam of e-mailadres.',
      'Klik op een klant om diens boekinggeschiedenis, contactgegevens en accountstatus te bekijken.',
      'Klantaccounts worden automatisch aangemaakt bij het plaatsen van een boeking (via de website of telefonisch door staff).',
      'Elke klant heeft een uniek e-mailadres. Bij een telefonische boeking wordt gecontroleerd of het e-mailadres al bestaat.',
    ],
    tips: [
      'Gebruik de zoekbalk om snel een klant te vinden.',
      'Controleer het aantal boekingen per klant voor herhaalbezoekers.',
    ],
  },
  {
    id: 'berichten',
    icon: <Mail className={ICON_CLASS} />,
    title: 'Berichten',
    paths: ['/admin/berichten'],
    description: 'Inkomende berichten van het contactformulier.',
    content: [
      'Hier verschijnen alle berichten die binnenkomen via het contactformulier op de website.',
      'Elk bericht bevat: naam, e-mailadres, onderwerp en tekst.',
      'Berichten van het type "Campingaanvraag" komen van klanten die een camping hebben aangevraagd die niet in de lijst staat.',
      'Markeer berichten als gelezen/beantwoord om het overzicht te bewaren.',
      'Reageer op berichten door de klant direct per e-mail te mailen (kopieer het e-mailadres).',
    ],
    tips: [
      'Controleer dagelijks op nieuwe berichten.',
      'Campingaanvragen: voeg de gevraagde camping toe als deze geschikt is.',
      'Bewaar je inbox schoon door gelezen berichten te markeren.',
    ],
  },
  {
    id: 'chat',
    icon: <MessageCircle className={ICON_CLASS} />,
    title: 'Chat',
    paths: ['/admin/chat'],
    description: 'Live chatgesprekken met websitebezoekers.',
    content: [
      'De chatpagina toont alle live chatgesprekken die gestart zijn door bezoekers op de website.',
      'Chatberichten verschijnen in realtime. Klik op een gesprek in de linkerkolom om het te openen.',
      'Typ je antwoord onderaan en druk op Enter of klik op "Verstuur".',
      'Gesprekken waarin de klant hulp nodig heeft worden gemarkeerd met een speciaal icoon.',
      'Je kunt chats verwijderen via het prullenbak-icoon.',
      'Oude chats worden na 30 dagen automatisch verwijderd.',
    ],
    tips: [
      'Reageer zo snel mogelijk op chats — bezoekers verwachten een snel antwoord.',
      'Gebruik de chat om veelgestelde vragen te beantwoorden.',
      'Als een vraag complex is, verwijs de bezoeker naar het contactformulier of bel ze terug.',
    ],
  },
  {
    id: 'nieuwsbrieven',
    icon: <Newspaper className={ICON_CLASS} />,
    title: 'Nieuwsbrieven',
    paths: ['/admin/nieuwsbrieven'],
    description: 'Beheer nieuwsbrief-abonnees en hun voorkeuren.',
    content: [
      'Op de nieuwsbrievenpagina zie je alle abonnees die zich via de website hebben aangemeld.',
      'Je kunt abonnees bekijken, zoeken en hun status controleren (actief/afgemeld).',
      'Abonnees die zich uitschrijven worden automatisch gemarkeerd als "Afgemeld".',
      'Je kunt het e-mailadressenbestand exporteren voor gebruik in een extern e-mailsysteem.',
    ],
    tips: [
      'Stuur niet te veel nieuwsbrieven — 1-2x per maand is ideaal.',
      'Controleer de afmeldingsratio als indicator van klanttevredenheid.',
    ],
  },
  {
    id: 'caravans',
    icon: <CarFront className={ICON_CLASS} />,
    title: 'Caravans',
    paths: ['/admin/caravans'],
    description: 'Beheer de caravans die beschikbaar zijn voor verhuur.',
    adminOnly: true,
    content: [
      'Op de caravanpagina kun je caravans toevoegen, bewerken en verwijderen.',
      'Elke caravan heeft: naam, beschrijving, foto\'s, capaciteit (personen), prijs per nacht, en faciliteiten.',
      'Actieve caravans worden getoond op de website en zijn beschikbaar voor boeking.',
      'Inactieve caravans zijn verborgen voor klanten maar blijven behouden in het systeem.',
      '── Prijzen ──',
      'Prijzen worden ingesteld per nacht en kunnen variëren per seizoen.',
      'Het systeem berekent automatisch de totaalprijs bij het boeken op basis van de gekozen periode.',
      '── Foto\'s ──',
      'Upload meerdere foto\'s per caravan. De eerste foto wordt als hoofdfoto gebruikt op de website.',
      'Gebruik hoge kwaliteit foto\'s (minimaal 1200x800 pixels) voor het beste resultaat.',
    ],
    tips: [
      'Houd de caravanbeschrijvingen actueel en compleet.',
      'Voeg minstens 5 foto\'s toe per caravan voor een goed beeld.',
      'Controleer seizoensprijzen voor het nieuwe seizoen.',
      'Deze pagina is alleen zichtbaar voor admin-gebruikers.',
    ],
  },
  {
    id: 'campings',
    icon: <Tent className={ICON_CLASS} />,
    title: 'Campings',
    paths: ['/admin/campings'],
    description: 'Beheer de campings waar caravans geplaatst kunnen worden.',
    adminOnly: true,
    content: [
      'De campingpagina toont alle campings die beschikbaar zijn in het boekingssysteem.',
      'Campings kunnen worden toegevoegd, bewerkt en verwijderd.',
      'Sleep campings om de volgorde aan te passen — dit is de volgorde waarin ze op de website worden getoond.',
      'Actieve campings verschijnen in de campingkiezer tijdens het boekingsproces.',
      '── Eerste gebruik ──',
      'Bij eerste gebruik kun je de standaard 30 Costa Brava campings importeren met één klik.',
      'Daarna kun je campings toevoegen of verwijderen naar wens.',
      '── Campingaanvragen ──',
      'Klanten kunnen via het boekingsformulier een camping aanvragen die niet in de lijst staat.',
      'Deze aanvragen verschijnen als berichten op de Berichten-pagina.',
      'Als een gevraagde camping geschikt is, kun je deze toevoegen aan de lijst.',
    ],
    tips: [
      'Houd de campinglijst actueel — verwijder campings die niet meer beschikbaar zijn.',
      'De volgorde is belangrijk: zet populaire campings bovenaan.',
      'Controleer regelmatig de berichten voor campingaanvragen.',
      'Deze pagina is alleen zichtbaar voor admin-gebruikers.',
    ],
  },
  {
    id: 'kortingscodes',
    icon: <Tag className={ICON_CLASS} />,
    title: 'Kortingscodes',
    paths: ['/admin/kortingscodes'],
    description: 'Maak en beheer kortingscodes voor klanten.',
    adminOnly: true,
    content: [
      'Op de kortingscodepagina kun je codes aanmaken die klanten kunnen invoeren tijdens het boeken.',
      'Elke code heeft: een unieke code, type korting (percentage of vast bedrag), en optioneel een vervaldatum.',
      'Je kunt instellen hoe vaak een code gebruikt mag worden (bijv. eenmalig of onbeperkt).',
      'Verlopen codes worden automatisch gedeactiveerd.',
      '── Een kortingscode aanmaken ──',
      '1. Klik op "Nieuwe code".',
      '2. Vul de code in (bijv. "ZOMER2025").',
      '3. Kies het kortingstype (percentage of vast bedrag).',
      '4. Stel de waarde in (bijv. 10% of €50).',
      '5. Optioneel: stel een vervaldatum en/of maximaal gebruik in.',
      '6. Klik op "Opslaan".',
    ],
    tips: [
      'Gebruik duidelijke, makkelijk te onthouden codes (bijv. ZOMER2025).',
      'Stel altijd een vervaldatum in om misbruik te voorkomen.',
      'Controleer regelmatig welke codes veel gebruikt worden.',
      'Deze pagina is alleen zichtbaar voor admin-gebruikers.',
    ],
  },
  {
    id: 'activiteit',
    icon: <History className={ICON_CLASS} />,
    title: 'Activiteitenlog',
    paths: ['/admin/activiteit'],
    description: 'Overzicht van alle recente acties in het systeem.',
    content: [
      'De activiteitenpagina toont een chronologisch overzicht van alle acties die in het beheerpaneel zijn uitgevoerd.',
      'Hier zie je wie wat heeft gedaan en wanneer — ideaal om wijzigingen te traceren.',
      '── Wat wordt gelogd? ──',
      '• Nieuwe boekingen (online en telefonisch)',
      '• Statuswijzigingen van boekingen',
      '• Betalingen en terugbetalingen',
      '• Borginspecties',
      '• Wijzigingen aan caravans en campings',
      '• Admin- en staffacties',
      '',
      'Gebruik de zoekbalk en filters om specifieke acties terug te vinden.',
    ],
    tips: [
      'Gebruik de activiteitenlog om te controleren wat er is gebeurd bij problemen.',
      'De log is handig om het werk van staff-medewerkers te volgen.',
      'Oudere logs worden na verloop van tijd automatisch opgeschoond.',
    ],
  },
  {
    id: 'betalingsmodel',
    icon: <Banknote className={ICON_CLASS} />,
    title: 'Betalingsmodel',
    description: 'Hoe het betalingssysteem werkt.',
    content: [
      '── Hoe werkt het? ──',
      'Het systeem werkt met een aanbetaling van 25% bij boeking. De rest wordt op de camping afgehandeld.',
      '── Betaalflow ──',
      'De betaalflow werkt als volgt:',
      '• Aanbetaling (25%): bij boeking via iDEAL/Wero.',
      '• Borg (€400): na goedkeuring door de klant op de camping bij de caravanplaats.',
      '• Restbetaling (75%): direct na ontvangst van de borg (contant of overboeking).',
      '── Betaalmethoden ──',
      'Aanbetaling: iDEAL of Wero (via Stripe). Op de camping: contant of overboeking.',
      '── Automatische herinneringen ──',
      'Het systeem stuurt automatisch betaalherinneringen per e-mail als de deadline nadert (3 dagen en 1 dag voor de deadline).',
      'Als een betaling niet op tijd binnenkomt, wordt de boeking automatisch geannuleerd.',
      '── Annulering en terugbetaling ──',
      'Klanten kunnen hun boeking annuleren via hun account. Bij annulering meer dan 30 dagen voor aankomst volgt een volledige terugbetaling.',
      'Admin-gebruikers kunnen handmatig terugbetalingen doen via de betalingenpagina.',
      '── Borg ──',
      'De borgsom is een apart bedrag dat betaald wordt bij aankomst.',
      'Na de inspectie bij vertrek wordt de borg terugbetaald (geheel of gedeeltelijk).',
    ],
    tips: [
      'De betaaldeadline wordt automatisch berekend — je hoeft niets handmatig in te stellen.',
      'Bij twijfel over een terugbetaling: neem altijd eerst contact op met de klant.',
      'Check het Stripe dashboard voor gedetailleerde betalinginformatie.',
    ],
  },
  {
    id: 'rollen',
    icon: <Shield className={ICON_CLASS} />,
    title: 'Rollen & Rechten',
    description: 'Verschil tussen Admin en Staff rechten.',
    content: [
      '── Admin ──',
      'Admin-gebruikers hebben volledige toegang tot alle functies van het systeem:',
      '• Dashboard (inclusief exportfunctie)',
      '• Planning, Boekingen, Betalingen, Borg',
      '• Klanten, Berichten, Chat, Nieuwsbrieven',
      '• Caravans, Campings, Kortingscodes',
      '• Terugbetalingen verwerken',
      '• Data exporteren',
      '',
      '── Staff ──',
      'Staff-gebruikers hebben beperkte toegang:',
      '• Dashboard (zonder export)',
      '• Planning, Boekingen, Borg',
      '• Klanten, Berichten, Chat, Nieuwsbrieven',
      '• Activiteitenlog',
      '',
      'Staff heeft GEEN toegang tot:',
      '• Betalingen (geen financieel inzicht)',
      '• Caravans, Campings, Kortingscodes (geen beheer)',
      '• Terugbetalingen',
    ],
    tips: [
      'Geef staff-accounts alleen aan medewerkers die op locatie werken.',
      'Admin-accounts zijn bedoeld voor eigenaren en management.',
      'Beide rollen kunnen boekingen aanmaken (bijv. telefonische boekingen).',
    ],
  },
  {
    id: 'pricing',
    icon: <Percent className={ICON_CLASS} />,
    title: 'Prijsregels',
    paths: ['/admin/prijzen'],
    description: 'Beheer seizoensprijzen, vroegboekkorting en last-minute deals.',
    content: [
      '── Overzicht ──',
      'Op deze pagina beheer je prijsregels die automatisch worden toegepast op boekingen. Er zijn drie typen:',
      '',
      '── Seizoensprijs ──',
      'Pas prijzen aan voor bepaalde periodes. Stel een startdatum en einddatum in.',
      'Gebruik een positief percentage voor toeslag (bijv. +20% voor hoogseizoen) of negatief voor korting (bijv. -10% laagseizoen).',
      'Voorbeeld: "Hoogseizoen 2026" met +20% van 1 juli t/m 31 augustus.',
      '',
      '── Vroegboekkorting ──',
      'Geef korting aan klanten die ruim van tevoren boeken.',
      'Stel het minimum aantal dagen vóór aankomst in (bijv. 90 dagen).',
      'Gebruik een negatief percentage (bijv. -10%).',
      'Voorbeeld: "Vroegboekkorting" met -10% als minstens 90 dagen vóór aankomst geboekt.',
      '',
      '── Last Minute ──',
      'Geef korting voor last-minute boekingen.',
      'Stel het maximum aantal dagen vóór aankomst in (bijv. 14 dagen).',
      'Gebruik een negatief percentage (bijv. -15%).',
      'Voorbeeld: "Last Minute Deal" met -15% als minder dan 14 dagen vóór aankomst geboekt.',
      '',
      '── Beheer ──',
      'Klik op "Nieuwe regel" om een regel aan te maken.',
      'Gebruik de toggle om regels te activeren/deactiveren zonder ze te verwijderen.',
      'Hogere prioriteit wordt eerst toegepast. Meerdere regels kunnen tegelijk actief zijn.',
    ],
    tips: [
      'Seizoensprijzen worden automatisch berekend op basis van de incheckdatum.',
      'Je kunt meerdere regels combineren (bijv. seizoen + vroegboek).',
      'Deactiveer regels in plaats van verwijderen — zo kun je ze later hergebruiken.',
      'Controleer de prijsberekening op de boekingspagina na het aanmaken van regels.',
    ],
    adminOnly: true,
  },
  {
    id: 'inspectie-wizard',
    icon: <Smartphone className={ICON_CLASS} />,
    title: 'Mobiele Inspectie (stap-voor-stap)',
    paths: ['/admin/inspectie'],
    description: 'Hoe je de mobiele inspectie-wizard gebruikt bij bezorging en ophalen.',
    content: [
      '── Wanneer gebruik je dit? ──',
      'De inspectie-wizard gebruik je op locatie (bij de caravan) om de staat van de caravan vast te leggen bij bezorging of ophalen.',
      '',
      '── Stappen ──',
      '1. Ga naar Borg-pagina → klik op "Mobiel Inspecteren" bij de betreffende boeking.',
      '2. De wizard opent fullscreen op je telefoon. Ideaal voor gebruik met één hand.',
      '3. Loop alle items af: keuken, badkamer, slaapkamer, buitenkant, inventaris.',
      '4. Markeer elk item als ✅ Goed, ⚠️ Beschadigd, of ❌ Ontbreekt.',
      '5. Bij schade: maak direct een foto met je camera. De foto wordt automatisch gecomprimeerd.',
      '6. Noteer eventuele opmerkingen per item.',
      '7. Aan het einde kun je vooraf ingestelde aftrekposten kiezen (bijv. "Schoonmaak €75").',
      '8. Het systeem berekent automatisch het totale schadebedrag.',
      '9. Laat de klant een handtekening zetten op het scherm.',
      '10. Klik op "Afronden" — de klant ontvangt automatisch een e-mail met een link om de inspectie te bekijken en goed te keuren.',
      '',
      '── Na de inspectie ──',
      'De klant kan via de link akkoord gaan of bezwaar indienen.',
      'Je ziet de status op de Borg-pagina: "Wachtend op klant" of "Akkoord".',
      'Bij akkoord wordt de borg terugbetaald (minus eventuele inhoudingen).',
    ],
    tips: [
      'Doe de inspectie altijd samen met de klant — voorkomt discussies achteraf.',
      'Maak foto\'s bij twijfel, zelfs als er geen schade is (bewijs van goede staat).',
      'Gebruik de presets voor veelvoorkomende aftrekposten (bijv. schoonmaak, gasfles).',
      'De handtekening is juridisch niet vereist maar geeft extra bewijs.',
      'Controleer of je goede wifi/4G hebt voordat je begint — foto\'s moeten geüpload worden.',
    ],
  },
  {
    id: 'nieuws-editor',
    icon: <Newspaper className={ICON_CLASS} />,
    title: 'Nieuwsbrief Editor',
    paths: ['/admin/nieuwsbrieven'],
    description: 'Hoe je nieuwsbrieven schrijft, plant en verstuurt.',
    content: [
      '── Nieuwsbrief aanmaken ──',
      '1. Klik op "Nieuwe nieuwsbrief" op de nieuwsbrieven-pagina.',
      '2. Vul een titel en categorie in (algemeen, activiteit, feestdag, markt, evenement).',
      '3. Schrijf de inhoud in de editor. Je kunt opmaak gebruiken (vet, cursief, links).',
      '4. Optioneel: voeg foto\'s toe door URL\'s te plakken.',
      '5. Optioneel: stel een datum en locatie in (voor evenementen).',
      '',
      '── Plannen vs. direct versturen ──',
      'Klik op "Opslaan als concept" om later verder te werken.',
      'Klik op "Versturen" om de nieuwsbrief direct te mailen naar alle actieve abonnees.',
      'Klik op "Inplannen" om op een later tijdstip te versturen.',
      '',
      '── Wie ontvangt de nieuwsbrief? ──',
      'Alle klanten met een actief account die zich niet hebben uitgeschreven.',
      'Klanten die zich hebben afgemeld ontvangen geen nieuwsbrieven meer.',
    ],
    tips: [
      'Stuur maximaal 1-2 nieuwsbrieven per maand — te veel = uitschrijvingen.',
      'Gebruik pakkende titels (bijv. "🌊 Nieuwe campings beschikbaar!").',
      'Voeg altijd minimaal één foto toe — visuele content werkt beter.',
      'Sla altijd eerst op als concept, lees nog eens na, en verstuur dan.',
    ],
  },
  {
    id: 'tips',
    icon: <Lightbulb className={ICON_CLASS} />,
    title: 'Tips & Trucs',
    description: 'Handige tips voor dagelijks gebruik.',
    content: [
      '── Navigatie ──',
      'Gebruik het zijmenu om tussen pagina\'s te navigeren. Op mobiel: tik op het ☰ icoon linksboven.',
      'Je kunt de volgorde van menu-items aanpassen door ze te verslepen.',
      '',
      '── Taal ──',
      'Wissel tussen Nederlands en Engels via de taalknop onderaan het zijmenu.',
      'Alle paginatitels, knoppen en meldingen worden automatisch vertaald.',
      '',
      '── Sneltoetsen ──',
      'Druk op Cmd+K (Mac) of Ctrl+K (Windows) om de globale zoekbalk te openen.',
      'Klik op het ? icoon rechtsboven voor contextgevoelige hulp per pagina.',
      'Gebruik de zoekbalken op pagina\'s om snel te vinden wat je zoekt.',
      '',
      '── Als App Opslaan (PWA) ──',
      'Je kunt het admin-paneel opslaan als app op je telefoon of tablet:',
      '',
      'iPhone / iPad (Safari):',
      '1. Open het admin-paneel in Safari.',
      '2. Tik op het Deel-icoon (vierkant met pijl omhoog) onderaan het scherm.',
      '3. Scroll naar beneden en tik op "Zet op beginscherm".',
      '4. Geef het een naam (bijv. "Admin Panel") en tik op "Voeg toe".',
      '5. Je hebt nu een icoon op je beginscherm — 1 tik en je bent er!',
      '',
      'Android (Chrome):',
      '1. Open het admin-paneel in Chrome.',
      '2. Tik op de drie puntjes (⋮) rechtsboven.',
      '3. Tik op "Toevoegen aan startscherm" of "Installeren".',
      '4. Bevestig en het icoon verschijnt op je startscherm.',
      '',
      '── Problemen oplossen ──',
      'Pagina laadt niet? Ververs de pagina (Ctrl+R of Cmd+R).',
      'Inlogprobleem? Controleer of je het juiste wachtwoord gebruikt. Neem contact op met de admin als het niet lukt.',
      'Betaling niet verwerkt? Controleer de status in Stripe. Betaallinks zijn 24 uur geldig.',
      'E-mail niet ontvangen? Controleer de spammap. E-mails worden verzonden via Resend.',
      '',
      '── Contact ──',
      'Bij technische problemen: neem contact op met de systeembeheerder.',
    ],
    tips: [
      'Sla de admin-URL op als favoriet of als app op je telefoon voor snelle toegang.',
      'Gebruik Chrome of Safari voor de beste ervaring.',
      'Log altijd uit als je klaar bent (vooral op gedeelde apparaten).',
      'iPhone: Safari → Deel → Zet op beginscherm.',
      'Android: Chrome → ⋮ → Toevoegen aan startscherm.',
    ],
  },
];

/* ═══════════════════════════════════════════════════
   Guide content: ENGLISH
   ═══════════════════════════════════════════════════ */
const GUIDE_EN: GuideSection[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className={ICON_CLASS} />,
    title: 'Dashboard',
    paths: ['/admin'],
    description: 'The home screen with an overview of all important information.',
    content: [
      'The dashboard shows statistics such as number of bookings, pending payments, new messages, and revenue for the current month.',
      'Click a stat card to go directly to that page (e.g., click "Bookings" to see all bookings).',
      'Open tasks (such as unanswered messages or expired payments) appear automatically in the task list.',
      'Admin users can export data via the "Export" button. Staff users don\'t see this option.',
    ],
    tips: [
      'Check the dashboard daily for new tasks.',
      'The revenue graph shows the trend over recent months.',
      'Red badges indicate urgent actions.',
    ],
  },
  {
    id: 'planning',
    icon: <CalendarCheck className={ICON_CLASS} />,
    title: 'Planning',
    paths: ['/admin/planning'],
    description: 'Manage all tasks per booking: prepare, deliver, pick up, and inspect.',
    content: [
      'The planning page shows all bookings as task lists. Each booking has 5 steps that you complete in order.',
      '',
      '── The 5 steps per booking ──',
      '1. Prepare — Clean the caravan, set up bedding, check gas bottles and verify inventory.',
      '2. Deposit check (internal) — Complete the deposit checklist before departure. The customer automatically receives a deposit email.',
      '3. Deliver (15:00) — Drive the caravan to the campsite, place it on the correct pitch. Set up awning, connect gas and electricity.',
      '4. Pick up (10:00) — Deposit check with the customer on site. Clear the caravan, disconnect and drive back to storage.',
      '5. Final inspection — After return: check for damage and count the inventory.',
      '',
      '── How does it work? ──',
      'Each task has a status: ○ To do, ▶ In progress, ✓ Done.',
      'Tasks are locked until the previous step is completed (you cannot deliver if the deposit check is not done yet).',
      'Click the round status circle to change the status.',
      'Click the task name to see details, assign a driver or add notes.',
      '',
      '── Views ──',
      '• Overview — All bookings with their tasks, sorted by arrival date.',
      '• Transport — Only deliveries and pick-ups, ideal for drivers.',
      '• Caravans — Per caravan the current or upcoming booking with tasks.',
      '',
      '── Payment & Invoicing ──',
      'At the bottom of each booking you can see the payment status: payment link sent, deposit received, and Holded invoices.',
      'Click a Holded item to mark that the invoice has been created.',
    ],
    tips: [
      'Bookings with tasks for today or overdue are automatically expanded.',
      'Red badges and flashing ⚠️ icons indicate urgent tasks.',
      'Always assign a driver to transport and pick-up tasks.',
      'Use the search bar to quickly find a booking by name, reference or campsite.',
      'Use the Transport view to create a daily schedule for drivers.',
    ],
  },
  {
    id: 'boekingen',
    icon: <CalendarCheck className={ICON_CLASS} />,
    title: 'Bookings',
    paths: ['/admin/boekingen'],
    description: 'Manage all bookings: view, filter, and create phone bookings.',
    content: [
      'The bookings page shows an overview of all bookings with status, date, customer details, and amount.',
      'Use the search bar to search by name, email address, or booking reference.',
      'Use the tabs at the top to filter by status: All, Pending, Confirmed, Cancelled, etc.',
      'Click a booking to view full details, including payment info and deposit status.',
      '── Creating a phone booking ──',
      'Click the "New booking" button in the top-right to create a booking for a customer who calls by phone.',
      'Fill in customer details (name, email, phone), choose a caravan and camping, select dates and number of travelers.',
      'The system automatically calculates the price based on the chosen caravan, period, and number of travelers.',
      'After creation, the customer automatically receives an email with an iDEAL/Wero payment link.',
      'If the customer doesn\'t have an account yet, one is automatically created and login credentials are sent by email.',
      'You can also copy the payment link and share it manually (e.g., via WhatsApp).',
    ],
    tips: [
      'Search by booking reference (e.g., "CVS-2025-0001") for quick results.',
      'Filter by "Pending" to see bookings that still need payment.',
      'For phone bookings: always verify the email address before submitting.',
      'Status colors: green = confirmed, orange = pending, red = cancelled.',
    ],
  },
  {
    id: 'betalingen',
    icon: <CreditCard className={ICON_CLASS} />,
    title: 'Payments',
    paths: ['/admin/betalingen'],
    description: 'Overview of all payments, statuses, and refunds.',
    adminOnly: true,
    content: [
      'The payments page shows all payments linked to bookings, with status, amount, and type.',
      'Payment statuses: PAID (green), PENDING (orange), EXPIRED (red), REFUNDED (gray).',
      'Payment types: HUUR (rent payment), BORG (deposit), BORG_RETOUR (deposit refund).',
      'Filter by type or status using the buttons at the top.',
      '── Refunds ──',
      'To issue a refund: open the booking via the bookings page, scroll to payments, click "Refund".',
      'Refunds are processed immediately through Stripe. The customer receives the money within 5-10 business days.',
      'Only payments with status PAID can be refunded.',
      '── Stripe ──',
      'All payments are processed via Stripe (iDEAL and Wero). You can consult the Stripe dashboard for detailed transaction information.',
    ],
    tips: [
      'Check daily for expired payments.',
      'For payment issues: check the status in Stripe first.',
      'Refunds can only be processed by admin users.',
      'This page is only visible to admin users.',
    ],
  },
  {
    id: 'borg',
    icon: <ClipboardCheck className={ICON_CLASS} />,
    title: 'Deposit & Inspection',
    paths: ['/admin/borg'],
    description: 'Manage deposit checklists and perform mobile inspections.',
    content: [
      'The deposit page shows all deposit checklists linked to bookings.',
      'A deposit checklist is automatically created when a booking is confirmed.',
      '── Checklist items ──',
      'The checklist contains standard items that need to be checked at delivery and pick-up (e.g., inventory, cleaning, damage).',
      'Each item can be marked as: Good, Damaged, or Missing.',
      'For damage or missing items, you can add photos as evidence.',
      '── Mobile inspection ──',
      'Click "Mobile Inspect" to perform the inspection step-by-step on your phone.',
      'This opens a fullscreen view ideal for use on location.',
      'After completing the inspection, the customer automatically receives an email with a link to view and approve the checklist.',
      '── Deposit refund ──',
      'If everything is in order, you can refund the deposit via the deposit page.',
      'For damage, you can do a partial deposit refund and withhold the damage amount.',
    ],
    tips: [
      'Always do the inspection together with the customer for transparency.',
      'Take photos of any damage as evidence.',
      'The customer automatically receives a link to view the inspection.',
      'Make sure all items are checked before completing the inspection.',
    ],
  },
  {
    id: 'klanten',
    icon: <Users className={ICON_CLASS} />,
    title: 'Customers',
    paths: ['/admin/klanten'],
    description: 'View and manage all customer accounts.',
    content: [
      'The customers page shows an overview of all registered customers.',
      'You can search by name or email address.',
      'Click a customer to view their booking history, contact details, and account status.',
      'Customer accounts are automatically created when a booking is placed (via the website or by phone through staff).',
      'Each customer has a unique email address. For phone bookings, the system checks if the email already exists.',
    ],
    tips: [
      'Use the search bar to quickly find a customer.',
      'Check the number of bookings per customer for repeat visitors.',
    ],
  },
  {
    id: 'berichten',
    icon: <Mail className={ICON_CLASS} />,
    title: 'Messages',
    paths: ['/admin/berichten'],
    description: 'Incoming messages from the contact form.',
    content: [
      'All messages received via the website\'s contact form appear here.',
      'Each message contains: name, email address, subject, and text.',
      'Messages with type "Camping request" come from customers who requested a camping that\'s not in the list.',
      'Mark messages as read/answered to keep the overview clean.',
      'Reply to messages by emailing the customer directly (copy the email address).',
    ],
    tips: [
      'Check daily for new messages.',
      'Camping requests: add the requested camping if it\'s suitable.',
      'Keep your inbox clean by marking read messages.',
    ],
  },
  {
    id: 'chat',
    icon: <MessageCircle className={ICON_CLASS} />,
    title: 'Chat',
    paths: ['/admin/chat'],
    description: 'Live chat conversations with website visitors.',
    content: [
      'The chat page shows all live chat conversations started by visitors on the website.',
      'Chat messages appear in real-time. Click a conversation in the left column to open it.',
      'Type your reply at the bottom and press Enter or click "Send".',
      'Conversations where the customer needs help are marked with a special icon.',
      'You can delete chats via the trash icon.',
      'Old chats are automatically deleted after 30 days.',
    ],
    tips: [
      'Respond as quickly as possible to chats — visitors expect a fast answer.',
      'Use the chat to answer frequently asked questions.',
      'If a question is complex, refer the visitor to the contact form or call them back.',
    ],
  },
  {
    id: 'nieuwsbrieven',
    icon: <Newspaper className={ICON_CLASS} />,
    title: 'Newsletters',
    paths: ['/admin/nieuwsbrieven'],
    description: 'Manage newsletter subscribers and their preferences.',
    content: [
      'The newsletters page shows all subscribers who signed up via the website.',
      'You can view, search, and check the status of subscribers (active/unsubscribed).',
      'Subscribers who unsubscribe are automatically marked as "Unsubscribed".',
      'You can export the email list for use in an external email system.',
    ],
    tips: [
      'Don\'t send too many newsletters — 1-2x per month is ideal.',
      'Monitor the unsubscribe rate as an indicator of customer satisfaction.',
    ],
  },
  {
    id: 'caravans',
    icon: <CarFront className={ICON_CLASS} />,
    title: 'Caravans',
    paths: ['/admin/caravans'],
    description: 'Manage the caravans available for rent.',
    adminOnly: true,
    content: [
      'On the caravans page, you can add, edit, and delete caravans.',
      'Each caravan has: name, description, photos, capacity (persons), price per night, and facilities.',
      'Active caravans are shown on the website and available for booking.',
      'Inactive caravans are hidden from customers but remain in the system.',
      '── Pricing ──',
      'Prices are set per night and can vary by season.',
      'The system automatically calculates the total price when booking based on the chosen period.',
      '── Photos ──',
      'Upload multiple photos per caravan. The first photo is used as the main photo on the website.',
      'Use high-quality photos (minimum 1200x800 pixels) for the best result.',
    ],
    tips: [
      'Keep caravan descriptions up to date and complete.',
      'Add at least 5 photos per caravan for a good impression.',
      'Check seasonal prices before the new season.',
      'This page is only visible to admin users.',
    ],
  },
  {
    id: 'campings',
    icon: <Tent className={ICON_CLASS} />,
    title: 'Campings',
    paths: ['/admin/campings'],
    description: 'Manage the campings where caravans can be placed.',
    adminOnly: true,
    content: [
      'The campings page shows all campings available in the booking system.',
      'Campings can be added, edited, and deleted.',
      'Drag campings to adjust the order — this is the order they appear on the website.',
      'Active campings appear in the camping selector during the booking process.',
      '── First use ──',
      'On first use, you can import the default 30 Costa Brava campings with one click.',
      'After that, you can add or remove campings as needed.',
      '── Camping requests ──',
      'Customers can request a camping that\'s not in the list via the booking form.',
      'These requests appear as messages on the Messages page.',
      'If a requested camping is suitable, you can add it to the list.',
    ],
    tips: [
      'Keep the camping list up to date — remove campings that are no longer available.',
      'The order matters: put popular campings at the top.',
      'Regularly check messages for camping requests.',
      'This page is only visible to admin users.',
    ],
  },
  {
    id: 'kortingscodes',
    icon: <Tag className={ICON_CLASS} />,
    title: 'Discount Codes',
    paths: ['/admin/kortingscodes'],
    description: 'Create and manage discount codes for customers.',
    adminOnly: true,
    content: [
      'On the discount codes page, you can create codes that customers can enter during booking.',
      'Each code has: a unique code, discount type (percentage or fixed amount), and optionally an expiry date.',
      'You can set how many times a code can be used (e.g., one-time or unlimited).',
      'Expired codes are automatically deactivated.',
      '── Creating a discount code ──',
      '1. Click "New code".',
      '2. Enter the code (e.g., "SUMMER2025").',
      '3. Choose the discount type (percentage or fixed amount).',
      '4. Set the value (e.g., 10% or €50).',
      '5. Optional: set an expiry date and/or maximum usage.',
      '6. Click "Save".',
    ],
    tips: [
      'Use clear, easy-to-remember codes (e.g., SUMMER2025).',
      'Always set an expiry date to prevent abuse.',
      'Regularly check which codes are being used frequently.',
      'This page is only visible to admin users.',
    ],
  },
  {
    id: 'activiteit',
    icon: <History className={ICON_CLASS} />,
    title: 'Activity Log',
    paths: ['/admin/activiteit'],
    description: 'Overview of all recent actions in the system.',
    content: [
      'The activity page shows a chronological overview of all actions performed in the admin panel.',
      'Here you can see who did what and when — ideal for tracking changes.',
      '── What is logged? ──',
      '• New bookings (online and by phone)',
      '• Booking status changes',
      '• Payments and refunds',
      '• Deposit inspections',
      '• Changes to caravans and campings',
      '• Admin and staff actions',
      '',
      'Use the search bar and filters to find specific actions.',
    ],
    tips: [
      'Use the activity log to investigate what happened when there are issues.',
      'The log is useful for tracking staff member activity.',
      'Older logs are automatically cleaned up over time.',
    ],
  },
  {
    id: 'betalingsmodel',
    icon: <Banknote className={ICON_CLASS} />,
    title: 'Payment Model',
    description: 'How the payment system works.',
    content: [
      '── How does it work? ──',
      'The system works with a 25% down payment at booking. The rest is handled at the campsite.',
      '── Payment flow ──',
      'The payment flow works as follows:',
      '• Down payment (25%): at booking via iDEAL/Wero.',
      '• Security deposit (€400): after customer approval at the campsite at the caravan pitch.',
      '• Remaining payment (75%): immediately after receipt of the deposit (cash or bank transfer).',
      '── Payment methods ──',
      'Down payment: iDEAL or Wero (through Stripe). At campsite: cash or bank transfer.',
      '── Automatic reminders ──',
      'The system automatically sends payment reminders by email as the deadline approaches (3 days and 1 day before the deadline).',
      'If payment is not received on time, the booking is automatically cancelled.',
      '── Cancellation and refund ──',
      'Customers can cancel their booking via their account. For cancellations more than 30 days before arrival, a full refund is issued.',
      'Admin users can manually issue refunds via the payments page.',
      '── Deposit ──',
      'The security deposit is a separate amount paid upon arrival.',
      'After the departure inspection, the deposit is refunded (fully or partially).',
    ],
    tips: [
      'The payment deadline is calculated automatically — you don\'t need to set anything manually.',
      'If in doubt about a refund: always contact the customer first.',
      'Check the Stripe dashboard for detailed payment information.',
    ],
  },
  {
    id: 'rollen',
    icon: <Shield className={ICON_CLASS} />,
    title: 'Roles & Permissions',
    description: 'Difference between Admin and Staff permissions.',
    content: [
      '── Admin ──',
      'Admin users have full access to all system features:',
      '• Dashboard (including export function)',
      '• Planning, Bookings, Payments, Deposit',
      '• Customers, Messages, Chat, Newsletters',
      '• Caravans, Campings, Discount Codes',
      '• Process refunds',
      '• Export data',
      '',
      '── Staff ──',
      'Staff users have limited access:',
      '• Dashboard (without export)',
      '• Planning, Bookings, Deposit',
      '• Customers, Messages, Chat, Newsletters',
      '• Activity Log',
      '',
      'Staff does NOT have access to:',
      '• Payments (no financial insight)',
      '• Caravans, Campings, Discount Codes (no management)',
      '• Refunds',
    ],
    tips: [
      'Give staff accounts only to employees who work on-site.',
      'Admin accounts are intended for owners and management.',
      'Both roles can create bookings (e.g., phone bookings).',
    ],
  },
  {
    id: 'pricing',
    icon: <Percent className={ICON_CLASS} />,
    title: 'Pricing Rules',
    paths: ['/admin/prijzen'],
    description: 'Manage seasonal pricing, early bird discounts, and last-minute deals.',
    content: [
      '── Overview ──',
      'This page lets you manage pricing rules that are automatically applied to bookings. There are three types:',
      '',
      '── Seasonal Price ──',
      'Adjust prices for specific periods. Set a start and end date.',
      'Use a positive percentage for surcharge (e.g. +20% for peak season) or negative for discount (e.g. -10% low season).',
      'Example: "Peak Season 2026" with +20% from July 1 to August 31.',
      '',
      '── Early Bird Discount ──',
      'Give discounts to customers who book well in advance.',
      'Set the minimum number of days before arrival (e.g. 90 days).',
      'Use a negative percentage (e.g. -10%).',
      'Example: "Early Bird" with -10% if booked at least 90 days before arrival.',
      '',
      '── Last Minute ──',
      'Give discounts for last-minute bookings.',
      'Set the maximum number of days before arrival (e.g. 14 days).',
      'Use a negative percentage (e.g. -15%).',
      'Example: "Last Minute Deal" with -15% if booked less than 14 days before arrival.',
      '',
      '── Management ──',
      'Click "New rule" to create a rule.',
      'Use the toggle to activate/deactivate rules without deleting them.',
      'Higher priority is applied first. Multiple rules can be active at the same time.',
    ],
    tips: [
      'Seasonal prices are automatically calculated based on the check-in date.',
      'You can combine multiple rules (e.g. seasonal + early bird).',
      'Deactivate rules instead of deleting — you can reuse them later.',
      'Check the price calculation on the booking page after creating rules.',
    ],
    adminOnly: true,
  },
  {
    id: 'inspectie-wizard',
    icon: <Smartphone className={ICON_CLASS} />,
    title: 'Mobile Inspection (step-by-step)',
    paths: ['/admin/inspectie'],
    description: 'How to use the mobile inspection wizard at delivery and pick-up.',
    content: [
      '── When to use this? ──',
      'Use the inspection wizard on-site (at the caravan) to record the condition of the caravan at delivery or pick-up.',
      '',
      '── Steps ──',
      '1. Go to the Deposit page → click "Mobile Inspect" on the relevant booking.',
      '2. The wizard opens fullscreen on your phone. Ideal for one-handed use.',
      '3. Go through all items: kitchen, bathroom, bedroom, exterior, inventory.',
      '4. Mark each item as ✅ Good, ⚠️ Damaged, or ❌ Missing.',
      '5. For damage: take a photo directly with your camera. Photos are automatically compressed.',
      '6. Note any remarks per item.',
      '7. At the end, choose preset deductions (e.g., "Cleaning €75").',
      '8. The system automatically calculates the total damage amount.',
      '9. Have the customer sign on the screen.',
      '10. Click "Complete" — the customer automatically receives an email with a link to review and approve the inspection.',
      '',
      '── After the inspection ──',
      'The customer can approve or file an objection via the link.',
      'You can see the status on the Deposit page: "Awaiting customer" or "Approved".',
      'Upon approval, the deposit is refunded (minus any deductions).',
    ],
    tips: [
      'Always do the inspection together with the customer — prevents disputes afterwards.',
      'Take photos in case of doubt, even if there\'s no damage (proof of good condition).',
      'Use presets for common deductions (e.g., cleaning, gas bottle).',
      'The signature is not legally required but provides extra evidence.',
      'Check you have good WiFi/4G before starting — photos need to be uploaded.',
    ],
  },
  {
    id: 'nieuws-editor',
    icon: <Newspaper className={ICON_CLASS} />,
    title: 'Newsletter Editor',
    paths: ['/admin/nieuwsbrieven'],
    description: 'How to write, schedule, and send newsletters.',
    content: [
      '── Creating a newsletter ──',
      '1. Click "New newsletter" on the newsletters page.',
      '2. Enter a title and category (general, activity, holiday, market, event).',
      '3. Write the content in the editor. You can use formatting (bold, italic, links).',
      '4. Optional: add photos by pasting URLs.',
      '5. Optional: set a date and location (for events).',
      '',
      '── Schedule vs. send immediately ──',
      'Click "Save as draft" to continue working later.',
      'Click "Send" to email the newsletter immediately to all active subscribers.',
      'Click "Schedule" to send the newsletter at a later time.',
      '',
      '── Who receives the newsletter? ──',
      'All customers with an active account who have not unsubscribed.',
      'Customers who unsubscribed will no longer receive newsletters.',
    ],
    tips: [
      'Send a maximum of 1-2 newsletters per month — too many = unsubscribes.',
      'Use catchy titles (e.g., "🌊 New campings available!").',
      'Always add at least one photo — visual content works better.',
      'Always save as draft first, proofread, then send.',
    ],
  },
  {
    id: 'tips',
    icon: <Lightbulb className={ICON_CLASS} />,
    title: 'Tips & Tricks',
    description: 'Useful tips for daily use.',
    content: [
      '── Navigation ──',
      'Use the sidebar menu to navigate between pages. On mobile: tap the ☰ icon in the top-left.',
      'You can customize the order of menu items by dragging them.',
      '',
      '── Language ──',
      'Switch between Dutch and English via the language button at the bottom of the sidebar.',
      'All page titles, buttons, and messages are automatically translated.',
      '',
      '── Quick access ──',
      'Press Cmd+K (Mac) or Ctrl+K (Windows) to open the global search bar.',
      'Click the ? icon in the top-right for context-sensitive help per page.',
      'Use the search bars on pages to quickly find what you\'re looking for.',
      '',
      '── Save as App (PWA) ──',
      'You can save the admin panel as an app on your phone or tablet:',
      '',
      'iPhone / iPad (Safari):',
      '1. Open the admin panel in Safari.',
      '2. Tap the Share icon (square with arrow up) at the bottom of the screen.',
      '3. Scroll down and tap "Add to Home Screen".',
      '4. Give it a name (e.g. "Admin Panel") and tap "Add".',
      '5. You now have an icon on your home screen — 1 tap and you\'re in!',
      '',
      'Android (Chrome):',
      '1. Open the admin panel in Chrome.',
      '2. Tap the three dots (⋮) in the top-right.',
      '3. Tap "Add to Home screen" or "Install".',
      '4. Confirm and the icon appears on your home screen.',
      '',
      '── Troubleshooting ──',
      'Page won\'t load? Refresh the page (Ctrl+R or Cmd+R).',
      'Login issue? Make sure you\'re using the correct password. Contact the admin if it doesn\'t work.',
      'Payment not processed? Check the status in Stripe. Payment links are valid for 24 hours.',
      'Email not received? Check the spam folder. Emails are sent via Resend.',
      '',
      '── Contact ──',
      'For technical issues: contact the system administrator.',
    ],
    tips: [
      'Save the admin URL as a bookmark or as an app on your phone for quick access.',
      'Use Chrome or Safari for the best experience.',
      'Always log out when you\'re done (especially on shared devices).',
      'iPhone: Safari → Share → Add to Home Screen.',
      'Android: Chrome → ⋮ → Add to Home screen.',
    ],
  },
];

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export default function AdminHelpGuide({ show, onClose, locale, pathname, onRestartTour }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'page' | 'guide'>('page');

  const guide = locale === 'nl' ? GUIDE_NL : GUIDE_EN;

  // Normalize pathname: strip /admin prefix for matching
  // On admin subdomain: pathname = "/caravans", on localhost: pathname = "/admin/caravans"
  const normalizedPath = pathname.startsWith('/admin') ? pathname : `/admin${pathname === '/' ? '' : pathname}`;

  // Find the section relevant to the current page
  const currentPageSection = useMemo(() => {
    return guide.find(s => s.paths?.includes(normalizedPath));
  }, [guide, normalizedPath]);

  // Filter guide sections by search query
  const filteredGuide = useMemo(() => {
    if (!searchQuery.trim()) return guide;
    const q = searchQuery.toLowerCase();
    return guide.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.content.some(c => c.toLowerCase().includes(q)) ||
      s.tips.some(t => t.toLowerCase().includes(q))
    );
  }, [guide, searchQuery]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(filteredGuide.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Reset state when opening
  const handleClose = () => {
    setSearchQuery('');
    setActiveTab('page');
    onClose();
  };

  const labels = locale === 'nl'
    ? {
        help: 'Hulp & Gids',
        thisPage: 'Deze pagina',
        fullGuide: 'Complete gids',
        searchPlaceholder: 'Zoek in de gids...',
        expandAll: 'Alles openen',
        collapseAll: 'Alles sluiten',
        tips: 'Tips',
        noResults: 'Geen resultaten gevonden.',
        adminOnly: 'Alleen admin',
        restartTour: 'Rondleiding opnieuw bekijken',
        generalTips: 'Algemene tips',
        noPageHelp: 'Geen specifieke hulp voor deze pagina. Bekijk de complete gids voor alle informatie.',
        goToGuide: 'Open complete gids →',
      }
    : {
        help: 'Help & Guide',
        thisPage: 'This page',
        fullGuide: 'Complete guide',
        searchPlaceholder: 'Search the guide...',
        expandAll: 'Expand all',
        collapseAll: 'Collapse all',
        tips: 'Tips',
        noResults: 'No results found.',
        adminOnly: 'Admin only',
        restartTour: 'View tour again',
        generalTips: 'General tips',
        noPageHelp: 'No specific help for this page. Check the complete guide for all information.',
        goToGuide: 'Open complete guide →',
      };

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [show, handleClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[55] flex items-start justify-end"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-white h-full w-full sm:w-[480px] sm:max-w-[90vw] shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Top accent bar ── */}
            <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shrink-0" />

            {/* ── Header ── */}
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-50 rounded-lg">
                    <BookOpen size={18} className="text-sky-500" />
                  </div>
                  {labels.help}
                </h2>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveTab('page')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'page'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {labels.thisPage}
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'guide'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {labels.fullGuide}
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'page' ? (
                /* ═══ THIS PAGE TAB ═══ */
                <div className="p-4 sm:p-5">
                  {currentPageSection ? (
                    <>
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-5 p-3 bg-sky-50/60 rounded-xl border border-sky-100/50">
                        <div className="p-2.5 bg-white rounded-xl text-sky-600 shadow-sm">
                          {currentPageSection.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{currentPageSection.title}</h3>
                          <p className="text-sm text-gray-500">{currentPageSection.description}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 mb-6">
                        {currentPageSection.content.map((paragraph, i) => {
                          if (paragraph === '') return <div key={i} className="h-2" />;
                          if (paragraph.startsWith('──')) {
                            return (
                              <h4 key={i} className="font-semibold text-gray-800 text-sm pt-3 pb-1 border-b border-gray-100">
                                {paragraph.replace(/──/g, '').trim()}
                              </h4>
                            );
                          }
                          if (paragraph.startsWith('•')) {
                            return (
                              <div key={i} className="flex items-start gap-2 pl-2">
                                <span className="text-sky-500 mt-1 text-xs">●</span>
                                <p className="text-sm text-gray-600">{paragraph.slice(2)}</p>
                              </div>
                            );
                          }
                          if (/^\d+\./.test(paragraph)) {
                            return (
                              <div key={i} className="flex items-start gap-2 pl-2">
                                <span className="text-sky-500 font-semibold text-sm min-w-[1.5rem]">{paragraph.match(/^\d+/)?.[0]}.</span>
                                <p className="text-sm text-gray-600">{paragraph.replace(/^\d+\.\s*/, '')}</p>
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-sm text-gray-600 leading-relaxed">{paragraph}</p>
                          );
                        })}
                      </div>

                      {/* Tips */}
                      {currentPageSection.tips.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <Lightbulb size={14} className="text-amber-500" />
                            {labels.tips}
                          </h4>
                          <div className="space-y-2">
                            {currentPageSection.tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-4 py-3">
                                <span className="text-amber-500 font-bold text-sm mt-0.5">💡</span>
                                <p className="text-sm text-gray-700">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* No page-specific help */
                    <div className="text-center py-16 px-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl mb-5">
                        <HelpCircle size={32} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">{labels.noPageHelp}</p>
                      <button
                        onClick={() => setActiveTab('guide')}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-sky-600 font-medium hover:text-sky-700 cursor-pointer bg-sky-50 px-4 py-2 rounded-xl hover:bg-sky-100 transition-colors"
                      >
                        {labels.goToGuide}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ═══ FULL GUIDE TAB ═══ */
                <div className="p-4 sm:p-5">
                  {/* Search bar */}
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={labels.searchPlaceholder}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all"
                    />
                  </div>

                  {/* Expand/collapse controls */}
                  <div className="flex items-center justify-end gap-3 mb-4">
                    <button onClick={expandAll} className="text-xs text-sky-600 hover:text-sky-700 font-medium cursor-pointer">
                      {labels.expandAll}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button onClick={collapseAll} className="text-xs text-sky-600 hover:text-sky-700 font-medium cursor-pointer">
                      {labels.collapseAll}
                    </button>
                  </div>

                  {/* Guide sections accordion */}
                  {filteredGuide.length === 0 ? (
                    <div className="text-center py-8">
                      <Search size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">{labels.noResults}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGuide.map(section => {
                        const isExpanded = expandedSections.has(section.id);
                        return (
                          <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Accordion header */}
                            <button
                              onClick={() => toggleSection(section.id)}
                              className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'} transition-colors`}>
                                {section.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                                  {section.adminOnly && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                      {labels.adminOnly}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{section.description}</p>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={16} className="text-gray-400" />
                              </motion.div>
                            </button>

                            {/* Accordion content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 pt-3">
                                    {/* Content paragraphs */}
                                    <div className="space-y-2 mb-4">
                                      {section.content.map((paragraph, i) => {
                                        if (paragraph === '') return <div key={i} className="h-2" />;
                                        if (paragraph.startsWith('──')) {
                                          return (
                                            <h4 key={i} className="font-semibold text-gray-800 text-sm pt-2 pb-1 border-b border-gray-100">
                                              {paragraph.replace(/──/g, '').trim()}
                                            </h4>
                                          );
                                        }
                                        if (paragraph.startsWith('•')) {
                                          return (
                                            <div key={i} className="flex items-start gap-2 pl-2">
                                              <span className="text-sky-500 mt-1 text-xs">●</span>
                                              <p className="text-sm text-gray-600">{paragraph.slice(2)}</p>
                                            </div>
                                          );
                                        }
                                        if (/^\d+\./.test(paragraph)) {
                                          return (
                                            <div key={i} className="flex items-start gap-2 pl-2">
                                              <span className="text-sky-500 font-semibold text-sm min-w-[1.5rem]">{paragraph.match(/^\d+/)?.[0]}.</span>
                                              <p className="text-sm text-gray-600">{paragraph.replace(/^\d+\.\s*/, '')}</p>
                                            </div>
                                          );
                                        }
                                        return (
                                          <p key={i} className="text-sm text-gray-600 leading-relaxed">{paragraph}</p>
                                        );
                                      })}
                                    </div>

                                    {/* Tips */}
                                    {section.tips.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                                          <Lightbulb size={12} className="text-amber-500" />
                                          {labels.tips}
                                        </h4>
                                        <div className="space-y-1.5">
                                          {section.tips.map((tip, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-amber-50/70 rounded-lg px-3 py-2">
                                              <span className="text-amber-400 text-xs mt-0.5">💡</span>
                                              <p className="text-xs text-gray-600">{tip}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="p-4 sm:p-5 border-t border-gray-100 space-y-2">
              <button
                onClick={() => { handleClose(); onRestartTour(); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-sky-600 bg-sky-50 rounded-xl font-medium hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <span>🎓</span>
                {labels.restartTour}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                {locale === 'nl' ? 'Druk op Esc om te sluiten' : 'Press Esc to close'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

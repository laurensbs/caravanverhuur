'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
type SmartAction = {
  label: string;
  urgency: 'high' | 'medium' | 'info';
  description: string;
};

type QA = { q: string; a: string };

type PageKnowledge = {
  intro: string;
  actions: SmartAction[];
  questions: QA[];
};

type Props = {
  locale: 'nl' | 'en';
  pathname: string;
  open: boolean;
  onClose: () => void;
  onRestartTour: () => void;
};

/* ─── urgency colours ─── */
const URGENCY = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle, dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Info, dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: CheckCircle2, dot: 'bg-blue-500' },
};

/* ═══════════════════════════════════════════════════
   Knowledge base — DUTCH
   ═══════════════════════════════════════════════════ */
const KNOWLEDGE_NL: Record<string, PageKnowledge> = {
  '/admin': {
    intro: 'Het dashboard geeft een overzicht van alle belangrijke gegevens: openstaande boekingen, betalingen, berichten en recente activiteit.',
    actions: [
      { label: 'Controleer openstaande betalingen', urgency: 'high', description: 'Ga naar Betalingen en controleer of er onbetaalde facturen zijn. Stuur herinneringen voor facturen die meer dan 7 dagen openstaan.' },
      { label: 'Bekijk nieuwe boekingen', urgency: 'medium', description: 'Controleer of nieuwe boekingen correct zijn aangemaakt en of locaties & data kloppen.' },
      { label: 'Lees ongelezen berichten', urgency: 'medium', description: 'Beantwoord klantberichten binnen 24 uur voor een goede klanttevredenheid.' },
      { label: 'Bekijk de planning voor komende week', urgency: 'info', description: 'Check aankomsten en vertrekken voor de komende 7 dagen ter voorbereiding.' },
    ],
    questions: [
      { q: 'Hoe werkt het dashboard?', a: 'Het dashboard toont samenvattingen (boekingen, inkomsten, berichten). Klik op een kaart om naar de detailpagina te gaan.' },
      { q: 'Wat betekenen de kleuren?', a: 'Groen = alles in orde, Oranje = aandacht nodig, Rood = urgent. De badges op de navigatie tonen aantallen.' },
      { q: 'Hoe kan ik snel zoeken?', a: 'Gebruik de zoekbalk bovenin (Ctrl/Cmd+K) om snel boekingen, klanten of caravans te vinden.' },
    ],
  },

  '/admin/planning': {
    intro: 'De planning toont alle boekingen op een visuele tijdlijn per caravan. Gebruik het om beschikbaarheid te controleren en conflicten te voorkomen.',
    actions: [
      { label: 'Controleer overlappende boekingen', urgency: 'high', description: 'Zoek naar boekingen die overlappen op dezelfde caravan. Dit moet direct opgelost worden.' },
      { label: 'Bevestig aanstaande aankomsten', urgency: 'medium', description: 'Controleer of alle voorbereidingen klaar zijn voor gasten die deze week aankomen.' },
      { label: 'Bekijk schoonmaakplanning', urgency: 'info', description: 'Zorg dat er voldoende tijd zit tussen vertrek en aankomst voor schoonmaak (minimaal 1 dag).' },
    ],
    questions: [
      { q: 'Hoe maak ik een boeking aan?', a: 'Ga naar Boekingen → Nieuwe boeking. Selecteer caravan, camping, data en vul klantgegevens in.' },
      { q: 'Hoe wijzig ik een boeking?', a: 'Klik op een boeking in de planning of boekingslijst. Pas de gewenste velden aan en sla op.' },
      { q: 'Wat als er een overlap is?', a: 'Het systeem waarschuwt bij overlappingen. Los het op door een boeking te verplaatsen of een andere caravan toe te wijzen.' },
    ],
  },

  '/admin/boekingen': {
    intro: 'Hier beheer je alle boekingen. Je kunt zoeken, filteren, en de voortgang van elke boeking volgen.',
    actions: [
      { label: 'Verwerk nieuwe boekingen', urgency: 'high', description: 'Nieuwe boekingen moeten bevestigd of geweigerd worden. Controleer beschikbaarheid en stuur een bevestigingsmail.' },
      { label: 'Controleer incomplete boekingen', urgency: 'medium', description: 'Sommige boekingen missen mogelijk klantgegevens, camping-info of betalingen. Vul ontbrekende data aan.' },
      { label: 'Check aankomende check-ins', urgency: 'medium', description: 'Boekingen met check-in deze week: stuur aankomstinformatie naar de gast (adres, sleutels, regels).' },
      { label: 'Archiveer verlopen boekingen', urgency: 'info', description: 'Boekingen die volledig afgerond zijn (vertrokken + betaald + borg terug) kunnen gearchiveerd worden.' },
    ],
    questions: [
      { q: 'Hoe maak ik een nieuwe boeking?', a: 'Klik op "Nieuwe boeking" rechtsboven. Vul alle verplichte velden in: caravan, camping, periode, klant.' },
      { q: 'Hoe annuleer ik een boeking?', a: 'Open de boeking, klik op "Annuleren". Het systeem berekent automatisch de annuleringskosten volgens de voorwaarden.' },
      { q: 'Hoe stuur ik een factuur?', a: 'In de boekingsdetails klik je op "Factuur versturen". De factuur wordt automatisch gegenereerd en verstuurd.' },
      { q: 'Wat betekenen de statusopties?', a: 'Nieuw = nog niet bevestigd, Bevestigd = goedgekeurd, Betaald = volledige betaling ontvangen, Geannuleerd = geannuleerd, Afgerond = na vertrek.' },
    ],
  },

  '/admin/betalingen': {
    intro: 'Overzicht van alle betalingen, facturen en openstaande bedragen. Volg betalingen en stuur herinneringen.',
    actions: [
      { label: 'Stuur herinneringen voor openstaande facturen', urgency: 'high', description: 'Facturen die > 7 dagen openstaan moeten een herinnering krijgen. Check de vervaldatums.' },
      { label: 'Markeer ontvangen betalingen', urgency: 'medium', description: 'Controleer je bankafschriften en markeer handmatig ontvangen betalingen als "betaald".' },
      { label: 'Reconcilieer Stripe-betalingen', urgency: 'info', description: 'Online betalingen via Stripe worden automatisch bijgewerkt. Controleer of alles gesynchroniseerd is.' },
    ],
    questions: [
      { q: 'Hoe registreer ik een handmatige betaling?', a: 'Bij de boeking kun je "Betaling toevoegen" kiezen. Vul het bedrag in en selecteer de betaalmethode (bank/contant).' },
      { q: 'Hoe werkt Stripe?', a: 'Stripe verwerkt online betalingen automatisch. De status wordt bijgewerkt zodra de betaling is afgerond.' },
      { q: 'Hoe maak ik een terugbetaling?', a: 'Bij Stripe-betalingen kun je via het Stripe-dashboard een terugbetaling initiëren. Voor handmatige betalingen registreer je dit handmatig.' },
    ],
  },

  '/admin/borg': {
    intro: 'Beheer waarborgkeuringen: stuur borgformulieren, bekijk schade-inspecties en verwerk borgretouren.',
    actions: [
      { label: 'Verwerk openstaande borginspecties', urgency: 'high', description: 'Na terugkomst van gasten moeten borginspecties zo snel mogelijk verwerkt worden.' },
      { label: 'Stuur borgformulieren voor aanstaande boekingen', urgency: 'medium', description: 'Gasten die binnenkort aankomen moeten hun borgformulier al ontvangen hebben.' },
      { label: 'Retourneer borg na goedkeuring', urgency: 'info', description: 'Als de inspectie in orde is, retourneer de borg binnen 14 dagen na vertrek.' },
    ],
    questions: [
      { q: 'Hoe stuur ik een borgformulier?', a: 'Bij de boeking klik je op "Borgformulier verzenden". De gast ontvangt een e-mail met een link om de borg af te handelen.' },
      { q: 'Wat bij schade?', a: 'Bij schade: documenteer met foto\'s in de inspectie, bereken het schadebedrag en trek dit af van de borg voordat je retourneert.' },
    ],
  },

  '/admin/berichten': {
    intro: 'Alle klantcommunicatie op één plek. Bekijk, beantwoord en beheer berichten.',
    actions: [
      { label: 'Beantwoord ongelezen berichten', urgency: 'high', description: 'Onbeantwoorde berichten ouder dan 24 uur moeten met spoed opgepakt worden.' },
      { label: 'Check automatische mails', urgency: 'info', description: 'Verifieer dat automatische bevestigingsmails en herinneringen correct verzonden worden.' },
    ],
    questions: [
      { q: 'Hoe beantwoord ik een bericht?', a: 'Klik op het bericht om het te openen en type je antwoord. Het wordt verstuurd naar het e-mailadres van de klant.' },
      { q: 'Kan ik templates gebruiken?', a: 'Ja, veelgebruikte antwoorden kun je opslaan als template en hergebruiken bij vergelijkbare vragen.' },
    ],
  },

  '/admin/chat': {
    intro: 'Live chatberichten van de website. Beantwoord real-time vragen van bezoekers.',
    actions: [
      { label: 'Beantwoord actieve chats', urgency: 'high', description: 'Open chats wachten op een reactie. Reageer binnen 5 minuten voor de beste klantervaring.' },
    ],
    questions: [
      { q: 'Hoe werkt de chat?', a: 'Bezoekers op de website kunnen een chatbericht sturen. Je ziet het hier in real-time verschijnen.' },
      { q: 'Krijg ik meldingen?', a: 'Ja, als notificaties ingeschakeld zijn krijg je een melding bij nieuwe chatberichten.' },
    ],
  },

  '/admin/caravans': {
    intro: 'Beheer alle caravans: specificaties, foto\'s, beschikbaarheid en onderhoudsstatus.',
    actions: [
      { label: 'Controleer caravan-onderhoud', urgency: 'medium', description: 'Check of alle caravans up-to-date zijn qua onderhoud voor het komende seizoen.' },
      { label: 'Update foto\'s en beschrijvingen', urgency: 'info', description: 'Zorg dat alle caravans actuele foto\'s en beschrijvingen hebben voor de website.' },
    ],
    questions: [
      { q: 'Hoe voeg ik een caravan toe?', a: 'Klik op "Nieuwe caravan" en vul alle gegevens in: naam, type, capaciteit, voorzieningen, foto\'s.' },
      { q: 'Hoe wijzig ik de beschikbaarheid?', a: 'In de caravan-instellingen kun je periodes blokkeren of vrijgeven.' },
    ],
  },

  '/admin/campings': {
    intro: 'Beheer campings waar de caravans geplaatst worden. Inclusief locatie, faciliteiten en contactgegevens.',
    actions: [
      { label: 'Verifieer campinggegevens', urgency: 'info', description: 'Controleer of alle campinggegevens actueel zijn: adres, contactpersoon, faciliteiten.' },
    ],
    questions: [
      { q: 'Hoe voeg ik een camping toe?', a: 'Klik op "Nieuwe camping" en vul de gegevens in: naam, adres, faciliteiten, foto\'s, beschrijving.' },
      { q: 'Kan ik campings koppelen aan caravans?', a: 'Ja, bij het aanmaken van een boeking selecteer je zowel de caravan als de camping.' },
    ],
  },

  '/admin/klanten': {
    intro: 'Klantenoverzicht met contactgegevens, boekingshistorie en communicatie.',
    actions: [
      { label: 'Controleer klantgegevens', urgency: 'info', description: 'Verifieer dat contactgegevens up-to-date zijn, vooral telefoonnummers en e-mailadressen.' },
    ],
    questions: [
      { q: 'Hoe vind ik een klant?', a: 'Gebruik de zoekbalk om te zoeken op naam, e-mail of telefoonnummer.' },
      { q: 'Kan ik klanten verwijderen?', a: 'Klanten die gekoppeld zijn aan boekingen of facturen in Holded kunnen niet verwijderd worden ter bescherming van de boekhouding.' },
    ],
  },

  '/admin/kortingscodes': {
    intro: 'Maak en beheer kortingscodes voor speciale aanbiedingen, early bird deals en terugkerende klanten.',
    actions: [
      { label: 'Check verlopen codes', urgency: 'info', description: 'Deactiveer kortingscodes die verlopen zijn om misbruik te voorkomen.' },
    ],
    questions: [
      { q: 'Hoe maak ik een kortingscode?', a: 'Klik op "Nieuwe code", stel percentage of vast bedrag in, kies de geldigheidsperiode en eventuele beperkingen.' },
      { q: 'Kan ik codes beperken?', a: 'Ja, je kunt codes beperken tot specifieke periodes, maximaal gebruik en minimaal boekingsbedrag.' },
    ],
  },

  '/admin/nieuwsbrieven': {
    intro: 'Verstuur nieuwsbrieven naar klanten en geïnteresseerden. Beheer de mailinglijst.',
    actions: [
      { label: 'Plan seizoensnieuwsbrief', urgency: 'info', description: 'Stuur een nieuwsbrief bij het begin van het seizoen met nieuwe bestemmingen/aanbiedingen.' },
    ],
    questions: [
      { q: 'Hoe verstuur ik een nieuwsbrief?', a: 'Maak een nieuwe nieuwsbrief aan, schrijf de inhoud, selecteer ontvangers en klik op "Verzenden".' },
      { q: 'Kan ik segmenteren?', a: 'Ja, je kunt filteren op eerdere boekingen, aanmeldperiode of specifieke interesses.' },
    ],
  },

  '/admin/prijzen': {
    intro: 'Stel seizoensprijzen in per caravan en periode. Beheer toeslagen en extra kosten.',
    actions: [
      { label: 'Stel prijzen in voor volgend seizoen', urgency: 'medium', description: 'Controleer of alle prijzen voor het komende seizoen correct zijn ingesteld.' },
      { label: 'Check toeslagen', urgency: 'info', description: 'Verifieer dat extra kosten (schoonmaak, beddengoed, etc.) correct zijn geconfigureerd.' },
    ],
    questions: [
      { q: 'Hoe stel ik prijzen in?', a: 'Selecteer een caravan en periode. Voer de weekprijs in. Eventuele toeslagen stel je apart in.' },
      { q: 'Kan ik seizoensprijzen instellen?', a: 'Ja, je kunt hoogseizoen, tussenseizoen en laagseizoen apart configureren met verschillende prijzen.' },
    ],
  },

  '/admin/activiteit': {
    intro: 'Bekijk alle recente activiteit en wijzigingen in het systeem als auditlog.',
    actions: [
      { label: 'Review recente wijzigingen', urgency: 'info', description: 'Check of recente wijzigingen door medewerkers correct zijn uitgevoerd.' },
    ],
    questions: [
      { q: 'Wat wordt gelogd?', a: 'Alle belangrijke acties: boekingswijzigingen, betalingen, klantwijzigingen, instellingen, inlogpogingen.' },
      { q: 'Hoe ver gaat de log terug?', a: 'De activiteitenlog bewaard gegevens van de afgelopen 90 dagen.' },
    ],
  },
};

/* ═══════════════════════════════════════════════════
   Knowledge base — ENGLISH
   ═══════════════════════════════════════════════════ */
const KNOWLEDGE_EN: Record<string, PageKnowledge> = {
  '/admin': {
    intro: 'The dashboard gives an overview of key data: pending bookings, payments, messages, and recent activity.',
    actions: [
      { label: 'Check outstanding payments', urgency: 'high', description: 'Go to Payments and check for unpaid invoices. Send reminders for invoices overdue by more than 7 days.' },
      { label: 'Review new bookings', urgency: 'medium', description: 'Check if new bookings are correctly created with proper locations & dates.' },
      { label: 'Read unread messages', urgency: 'medium', description: 'Reply to customer messages within 24 hours for good customer satisfaction.' },
      { label: 'View next week\'s schedule', urgency: 'info', description: 'Check arrivals and departures for the coming 7 days.' },
    ],
    questions: [
      { q: 'How does the dashboard work?', a: 'The dashboard shows summaries (bookings, revenue, messages). Click a card to go to the detail page.' },
      { q: 'What do the colors mean?', a: 'Green = all good, Orange = needs attention, Red = urgent. Navigation badges show counts.' },
      { q: 'How can I search quickly?', a: 'Use the search bar at the top (Ctrl/Cmd+K) to quickly find bookings, customers, or caravans.' },
    ],
  },

  '/admin/planning': {
    intro: 'The planning shows all bookings on a visual timeline per caravan.',
    actions: [
      { label: 'Check overlapping bookings', urgency: 'high', description: 'Look for bookings that overlap on the same caravan. This must be resolved immediately.' },
      { label: 'Confirm upcoming arrivals', urgency: 'medium', description: 'Check if all preparations are ready for guests arriving this week.' },
    ],
    questions: [
      { q: 'How do I create a booking?', a: 'Go to Bookings → New booking. Select caravan, campsite, dates, and fill in customer details.' },
      { q: 'What if there\'s an overlap?', a: 'The system warns about overlaps. Resolve by moving a booking or assigning a different caravan.' },
    ],
  },

  '/admin/boekingen': {
    intro: 'Manage all bookings. Search, filter, and track the progress of each booking.',
    actions: [
      { label: 'Process new bookings', urgency: 'high', description: 'New bookings need to be confirmed or declined. Check availability and send confirmation.' },
      { label: 'Check incomplete bookings', urgency: 'medium', description: 'Some bookings may be missing customer details, campsite info, or payments.' },
      { label: 'Review upcoming check-ins', urgency: 'medium', description: 'Bookings checking in this week: send arrival information to the guest.' },
    ],
    questions: [
      { q: 'How do I create a booking?', a: 'Click "New booking" at the top right. Fill in all required fields: caravan, campsite, period, customer.' },
      { q: 'How do I cancel a booking?', a: 'Open the booking and click "Cancel". The system calculates cancellation costs automatically.' },
      { q: 'What do the statuses mean?', a: 'New = not confirmed, Confirmed = approved, Paid = full payment received, Cancelled = cancelled, Completed = after departure.' },
    ],
  },

  '/admin/betalingen': {
    intro: 'Overview of all payments, invoices, and outstanding amounts.',
    actions: [
      { label: 'Send reminders for overdue invoices', urgency: 'high', description: 'Invoices overdue by > 7 days need a reminder.' },
      { label: 'Mark received payments', urgency: 'medium', description: 'Check bank statements and manually mark received payments as "paid".' },
    ],
    questions: [
      { q: 'How do I register a manual payment?', a: 'In the booking, choose "Add payment". Enter the amount and select payment method.' },
      { q: 'How does Stripe work?', a: 'Stripe processes online payments automatically. Status updates when payment is completed.' },
    ],
  },

  '/admin/borg': {
    intro: 'Manage deposit inspections: send deposit forms, review damage inspections, and process deposit returns.',
    actions: [
      { label: 'Process pending deposit inspections', urgency: 'high', description: 'After guests return, deposit inspections should be processed as soon as possible.' },
      { label: 'Send deposit forms for upcoming bookings', urgency: 'medium', description: 'Guests arriving soon should have already received their deposit form.' },
    ],
    questions: [
      { q: 'How do I send a deposit form?', a: 'In the booking, click "Send deposit form". The guest receives an email with a link.' },
      { q: 'What about damage?', a: 'Document damage with photos in the inspection, calculate the damage amount, and deduct from the deposit.' },
    ],
  },

  '/admin/berichten': {
    intro: 'All customer communication in one place.',
    actions: [
      { label: 'Reply to unread messages', urgency: 'high', description: 'Unanswered messages older than 24 hours need urgent attention.' },
    ],
    questions: [
      { q: 'How do I reply to a message?', a: 'Click on the message to open it and type your reply.' },
    ],
  },

  '/admin/chat': {
    intro: 'Live chat messages from the website.',
    actions: [
      { label: 'Answer active chats', urgency: 'high', description: 'Open chats are waiting for a response. Reply within 5 minutes for the best experience.' },
    ],
    questions: [
      { q: 'How does chat work?', a: 'Website visitors can send a chat message. It appears here in real time.' },
    ],
  },

  '/admin/caravans': {
    intro: 'Manage all caravans: specifications, photos, availability, and maintenance status.',
    actions: [
      { label: 'Check caravan maintenance', urgency: 'medium', description: 'Ensure all caravans are up to date on maintenance.' },
      { label: 'Update photos and descriptions', urgency: 'info', description: 'Make sure all caravans have current photos and descriptions.' },
    ],
    questions: [
      { q: 'How do I add a caravan?', a: 'Click "New caravan" and fill in all details: name, type, capacity, amenities, photos.' },
    ],
  },

  '/admin/campings': {
    intro: 'Manage campsites where caravans are placed.',
    actions: [
      { label: 'Verify campsite details', urgency: 'info', description: 'Check that all campsite information is up to date.' },
    ],
    questions: [
      { q: 'How do I add a campsite?', a: 'Click "New campsite" and fill in the details.' },
    ],
  },

  '/admin/klanten': {
    intro: 'Customer overview with contact details, booking history, and communication.',
    actions: [
      { label: 'Verify customer details', urgency: 'info', description: 'Check that contact details are up to date.' },
    ],
    questions: [
      { q: 'How do I find a customer?', a: 'Use the search bar to search by name, email, or phone number.' },
      { q: 'Can I delete customers?', a: 'Customers linked to bookings or Holded invoices cannot be deleted to protect accounting records.' },
    ],
  },

  '/admin/prijzen': {
    intro: 'Set seasonal prices per caravan and period.',
    actions: [
      { label: 'Set next season prices', urgency: 'medium', description: 'Check that all prices for the coming season are correctly set.' },
    ],
    questions: [
      { q: 'How do I set prices?', a: 'Select a caravan and period. Enter the weekly price. Additional surcharges are set separately.' },
    ],
  },

  '/admin/activiteit': {
    intro: 'View all recent activity and system changes as an audit log.',
    actions: [
      { label: 'Review recent changes', urgency: 'info', description: 'Check if recent changes by staff were executed correctly.' },
    ],
    questions: [
      { q: 'What gets logged?', a: 'All important actions: booking changes, payments, customer changes, settings, login attempts.' },
    ],
  },
};

/* ═══════════════════════════════════════════════════
   General FAQ (fallback)
   ═══════════════════════════════════════════════════ */
const FAQ_NL: QA[] = [
  { q: 'Hoe kan ik mijn wachtwoord wijzigen?', a: 'Klik op het tandwiel-icoon linksboven → Wachtwoord wijzigen.' },
  { q: 'Hoe wissel ik van taal?', a: 'Klik op het taalicoon (🌐) in de bovenste balk om te wisselen tussen NL en EN.' },
  { q: 'Hoe werkt de zoekopdracht?', a: 'Gebruik Ctrl/Cmd+K of de zoekbalk bovenin. Je kunt zoeken op boekingsnummer, klantnaam, e-mail of caravan.' },
  { q: 'Wat is de rolverdeling?', a: 'Admin heeft volledige toegang. Medewerker heeft beperkte toegang en ziet geen financiële gegevens of instellingen.' },
  { q: 'Hoe pas ik de navigatie-volgorde aan?', a: 'Klik lang op een navigatie-item in de zijbalk en sleep het naar de gewenste positie.' },
];

const FAQ_EN: QA[] = [
  { q: 'How do I change my password?', a: 'Click the gear icon at the top left → Change password.' },
  { q: 'How do I switch languages?', a: 'Click the language icon (🌐) in the top bar to switch between NL and EN.' },
  { q: 'How does search work?', a: 'Use Ctrl/Cmd+K or the search bar. You can search by booking number, customer name, email, or caravan.' },
  { q: 'What are the roles?', a: 'Admin has full access. Staff has limited access and cannot see financial data or settings.' },
  { q: 'How do I reorder navigation?', a: 'Long-press a navigation item in the sidebar and drag it to the desired position.' },
];

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
export default function AdminAssistant({ locale, pathname, open, onClose, onRestartTour }: Props) {
  const [tab, setTab] = useState<'actions' | 'help'>('actions');
  const [expandedAction, setExpandedAction] = useState<number | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const nl = locale === 'nl';
  const KB = nl ? KNOWLEDGE_NL : KNOWLEDGE_EN;
  const faq = nl ? FAQ_NL : FAQ_EN;

  // Find best matching page knowledge
  const pageKey = useMemo(() => {
    if (KB[pathname]) return pathname;
    // Try parent path
    const parent = pathname.replace(/\/[^/]+$/, '');
    if (KB[parent]) return parent;
    return '/admin';
  }, [pathname, KB]);

  const knowledge = KB[pageKey] || KB['/admin']!;

  // Filter actions & questions by search
  const filteredActions = useMemo(() => {
    if (!search.trim()) return knowledge.actions;
    const s = search.toLowerCase();
    return knowledge.actions.filter(
      (a) => a.label.toLowerCase().includes(s) || a.description.toLowerCase().includes(s)
    );
  }, [knowledge.actions, search]);

  const filteredQuestions = useMemo(() => {
    const allQ = [...knowledge.questions, ...faq];
    if (!search.trim()) return allQ;
    const s = search.toLowerCase();
    return allQ.filter((q) => q.q.toLowerCase().includes(s) || q.a.toLowerCase().includes(s));
  }, [knowledge.questions, faq, search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing immediately
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  // Reset state when opening or changing pages
  useEffect(() => {
    setExpandedAction(null);
    setExpandedQ(null);
    setSearch('');
    setTab('actions');
  }, [pathname, open]);

  if (!open) return null;

  const urgentCount = knowledge.actions.filter((a) => a.urgency === 'high').length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="fixed top-14 right-3 sm:right-5 w-[340px] sm:w-[380px] max-h-[calc(100vh-80px)] bg-white rounded-xl shadow-xl border border-border/60 z-[60] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4.5 h-4.5" />
              <span className="font-semibold text-sm">
                {nl ? 'Smart Suggestions' : 'Smart Suggestions'}
              </span>
              {urgentCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {urgentCount} {nl ? 'urgent' : 'urgent'}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Page Intro */}
          <div className="px-4 py-2.5 bg-violet-50/50 border-b border-border/30 text-xs text-muted leading-relaxed shrink-0">
            {knowledge.intro}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/50 shrink-0">
            <button
              onClick={() => setTab('actions')}
              className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                tab === 'actions'
                  ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/30'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                {nl ? 'Acties' : 'Actions'}
                {urgentCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    {urgentCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setTab('help')}
              className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                tab === 'help'
                  ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/30'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                {nl ? 'Hulp & FAQ' : 'Help & FAQ'}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border/30 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={nl ? 'Zoek acties of vragen...' : 'Search actions or questions...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-alt rounded-lg border border-border/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 text-foreground placeholder:text-muted"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {tab === 'actions' && (
              <div className="p-3 space-y-2">
                {filteredActions.length === 0 && (
                  <p className="text-xs text-muted text-center py-4">
                    {nl ? 'Geen acties gevonden.' : 'No actions found.'}
                  </p>
                )}
                {filteredActions.map((action, i) => {
                  const u = URGENCY[action.urgency];
                  const Icon = u.icon;
                  const isExpanded = expandedAction === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setExpandedAction(isExpanded ? null : i)}
                      className={`w-full text-left rounded-lg border ${u.border} ${u.bg} p-2.5 transition-all hover:shadow-sm cursor-pointer`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 shrink-0 ${u.text}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${u.text}`}>
                              {action.label}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.dot} shrink-0`} />
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <p className="mt-1.5 text-[11px] text-foreground/70 leading-relaxed">
                                  {action.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-muted shrink-0 mt-0.5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === 'help' && (
              <div className="p-3 space-y-2">
                {filteredQuestions.length === 0 && (
                  <p className="text-xs text-muted text-center py-4">
                    {nl ? 'Geen vragen gevonden.' : 'No questions found.'}
                  </p>
                )}
                {filteredQuestions.map((qa, i) => {
                  const isExpanded = expandedQ === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setExpandedQ(isExpanded ? null : i)}
                      className="w-full text-left rounded-lg border border-border/50 bg-surface-alt/30 hover:bg-surface-alt p-2.5 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-muted shrink-0 mt-0.5 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">{qa.q}</span>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <p className="mt-1.5 text-[11px] text-foreground/70 leading-relaxed">
                                  {qa.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: restart tour */}
          <div className="px-3 py-2.5 border-t border-border/40 bg-gray-50/50 shrink-0">
            <button
              onClick={() => { onRestartTour(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {nl ? 'Tutorial opnieuw starten' : 'Restart tutorial'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

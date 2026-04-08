'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Lightbulb,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Knowledge base — contextual help per admin page
   ═══════════════════════════════════════════════════ */

type QA = { q: string; a: string };

const KNOWLEDGE_NL: Record<string, { intro: string; questions: QA[] }> = {
  '/admin': {
    intro: 'Dit is het dashboard — je startpagina met een overzicht van alles wat er speelt.',
    questions: [
      { q: 'Wat moet ik hier doen?', a: 'Controleer dagelijks de openstaande taken, nieuwe berichten en verlopen betalingen. Klik op een statistiekkaart om direct naar die pagina te gaan.' },
      { q: 'Wat betekenen de rode badges?', a: 'Rode badges geven dringende acties aan — bijvoorbeeld onbeantwoorde berichten of betalingen die verlopen zijn. Pak deze als eerste op.' },
      { q: 'Hoe exporteer ik data?', a: 'Klik op de "Exporteer" knop (alleen zichtbaar voor admin-accounts). Je kunt boekingen, betalingen en klantgegevens exporteren als CSV.' },
      { q: 'Wat is het verschil tussen admin en staff?', a: 'Admin heeft volledige toegang (inclusief betalingen, caravans, campings, kortingscodes en export). Staff kan boekingen, planning, borg, berichten en chat beheren, maar geen financiële gegevens zien.' },
    ],
  },
  '/admin/planning': {
    intro: 'De planning toont alle boekingen als takenlijsten. Werk de 5 stappen per boeking in volgorde af.',
    questions: [
      { q: 'Wat zijn de 5 stappen?', a: '1. Klaarmaken — Caravan schoonmaken, beddengoed, gas en inventaris checken.\n2. Borgcheck (intern) — Checklist doorlopen vóór vertrek, klant krijgt borgmail.\n3. Bezorgen (15:00) — Caravan naar camping rijden, luifel/gas/stroom aansluiten.\n4. Ophalen (10:00) — Borgcheck met klant, caravan opruimen en terugrijden.\n5. Eindcontrole — Schade en inventaris controleren na terugkomst.' },
      { q: 'Waarom kan ik een taak niet aanklikken?', a: 'Taken zijn vergrendeld (grijs) totdat de vorige stap is afgerond. Rond eerst de eerdere taak af door op het statusbolletje te klikken.' },
      { q: 'Hoe wijs ik een chauffeur toe?', a: 'Klik op de taaknaam (bijv. "Bezorgen") om het detailscherm te openen. Daar kun je een chauffeur selecteren uit de lijst of handmatig invoeren.' },
      { q: 'Wat is de Transport-weergave?', a: 'De Transport-tab toont alleen bezorgingen en ophaalacties, gesorteerd op datum. Ideaal om een dagplanning voor chauffeurs te maken.' },
      { q: 'Wat is Holded?', a: 'Holded is het boekhoudsysteem. Bij elke betaalde betaling moet je een factuur aanmaken in Holded. Klik op het Holded-item om te markeren dat dit gedaan is.' },
      { q: 'Wat betekent het ⚠️ icoon?', a: 'Een knipperend ⚠️ icoon betekent dat een taak vandaag af moet of al te laat is. Pak deze als eerste op.' },
    ],
  },
  '/admin/boekingen': {
    intro: 'Hier beheer je alle boekingen. Je kunt zoeken, filteren en telefonische boekingen aanmaken.',
    questions: [
      { q: 'Hoe maak ik een telefonische boeking?', a: 'Klik op "Nieuwe boeking" rechtsboven. Vul klantgegevens in, kies caravan + camping, selecteer data. Na aanmaken krijgt de klant een betaalmail. Heeft de klant geen account? Dat wordt automatisch aangemaakt.' },
      { q: 'Wat betekenen de kleuren?', a: 'Groen = bevestigd (betaald), Oranje = in afwachting (nog niet betaald), Rood = geannuleerd.' },
      { q: 'Hoe annuleer ik een boeking?', a: 'Open de boeking, scroll naar beneden en klik op "Annuleren". Bij annulering > 30 dagen voor aankomst krijgt de klant automatisch een volledige terugbetaling.' },
      { q: 'Hoe deel ik de betaallink?', a: 'Open de boeking en kopieer de betaallink . Je kunt deze via WhatsApp of e-mail delen met de klant.' },
    ],
  },
  '/admin/betalingen': {
    intro: 'Overzicht van alle betalingen. Alleen zichtbaar voor admin-accounts.',
    questions: [
      { q: 'Hoe doe ik een terugbetaling?', a: 'Open de boeking via de boekingenpagina, scroll naar betalingen en klik op "Terugbetalen". Alleen betalingen met status BETAALD kunnen terugbetaald worden. Het bedrag wordt via Stripe verwerkt (5-10 werkdagen).' },
      { q: 'Wat zijn de betalingstypen?', a: 'AANBETALING = 25% bij boeking via iDEAL/Wero. BORG = €400 borgsom op de camping. BORG_RETOUR = borg terugbetaling na inspectie.' },
      { q: 'Wat als een betaling verlopen is?', a: 'Verlopen betalingen (rood) betekenen dat de klant niet op tijd heeft betaald. De boeking wordt automatisch geannuleerd. Je kunt via boekingen een nieuwe betaallink versturen.' },
    ],
  },
  '/admin/borg': {
    intro: 'Beheer borgchecklists en voer inspecties uit op locatie.',
    questions: [
      { q: 'Hoe voer ik een inspectie uit?', a: 'Klik op "Mobiel Inspecteren" bij de boeking. De wizard opent fullscreen op je telefoon. Loop alle items af, markeer als Goed/Beschadigd/Ontbreekt, maak foto\'s bij schade, en laat de klant tekenen.' },
      { q: 'Wanneer doe ik een borgcheck?', a: 'Bij vertrek (voordat je de caravan wegbrengt) en bij ophalen (samen met de klant op de camping).' },
      { q: 'Hoe betaal ik borg terug?', a: 'Na een goede inspectie kun je via de borgpagina de volledige borg terugbetalen. Bij schade kun je een gedeeltelijke terugbetaling doen en het schadebedrag inhouden.' },
    ],
  },
  '/admin/berichten': {
    intro: 'Inkomende berichten van het contactformulier op de website.',
    questions: [
      { q: 'Hoe beantwoord ik een bericht?', a: 'Kopieer het e-mailadres van de afzender en stuur direct een e-mail. Of bel de klant als er een telefoonnummer is vermeld.' },
      { q: 'Wat is een campingaanvraag?', a: 'Als een klant een camping aanvraagt die niet in de lijst staat, komt dat hier binnen als "Campingaanvraag". Als de camping geschikt is, kun je deze toevoegen via de Campings-pagina.' },
    ],
  },
  '/admin/chat': {
    intro: 'Live chatgesprekken met bezoekers op de website.',
    questions: [
      { q: 'Hoe beantwoord ik een chat?', a: 'Klik op het gesprek links, typ je antwoord onderaan en druk op Enter. Bezoekers verwachten snel antwoord!' },
      { q: 'Worden chats bewaard?', a: 'Ja, maar oude chats worden na 30 dagen automatisch verwijderd.' },
    ],
  },
  '/admin/caravans': {
    intro: 'Beheer de caravans voor verhuur. Alleen voor admin-accounts.',
    questions: [
      { q: 'Hoe voeg ik een caravan toe?', a: 'Klik op "Nieuwe caravan", vul naam, beschrijving, capaciteit en prijs in. Upload minstens 5 foto\'s. De eerste foto wordt de hoofdfoto op de website.' },
      { q: 'Wat als ik een caravan tijdelijk wil uitschakelen?', a: 'Zet de caravan op "Inactief". De caravan verdwijnt van de website maar de data blijft behouden.' },
    ],
  },
  '/admin/campings': {
    intro: 'Beheer de campings waar caravans geplaatst worden. Alleen voor admin-accounts.',
    questions: [
      { q: 'Hoe wijzig ik de volgorde?', a: 'Sleep campings naar boven of beneden om de volgorde aan te passen. Dit is ook de volgorde op de website.' },
      { q: 'Hoe importeer ik campings?', a: 'Bij eerste gebruik kun je de standaard 30 Costa Brava campings importeren met één klik.' },
    ],
  },
  '/admin/kortingscodes': {
    intro: 'Maak en beheer kortingscodes voor klanten. Alleen voor admin-accounts.',
    questions: [
      { q: 'Hoe maak ik een code aan?', a: 'Klik op "Nieuwe code", vul de code in (bijv. ZOMER2025), kies percentage of vast bedrag, stel optioneel een vervaldatum in, en sla op.' },
    ],
  },
  '/admin/nieuwsbrieven': {
    intro: 'Beheer nieuwsbrief-abonnees en verstuur nieuwsbrieven.',
    questions: [
      { q: 'Hoe verstuur ik een nieuwsbrief?', a: 'Klik op "Nieuwe nieuwsbrief", schrijf de inhoud, voeg optioneel foto\'s toe. Je kunt direct versturen of inplannen voor later. Tip: stuur maximaal 1-2 per maand.' },
    ],
  },
  '/admin/prijzen': {
    intro: 'Beheer seizoensprijzen, vroegboekkorting en last-minute deals. Alleen voor admin-accounts.',
    questions: [
      { q: 'Hoe werken seizoensprijzen?', a: 'Maak een regel met start/einddatum en percentage. Positief = toeslag (bijv. +20% hoogseizoen), negatief = korting (bijv. -10% laagseizoen). Regels worden automatisch toegepast.' },
      { q: 'Kan ik meerdere regels combineren?', a: 'Ja! Seizoensprijzen, vroegboekkorting en last-minute kunnen tegelijk actief zijn. Hogere prioriteit wordt eerst toegepast.' },
    ],
  },
  '/admin/activiteit': {
    intro: 'Chronologisch overzicht van alle acties in het systeem.',
    questions: [
      { q: 'Wat wordt gelogd?', a: 'Nieuwe boekingen, statuswijzigingen, betalingen, terugbetalingen, borginspecties, wijzigingen aan caravans/campings, en admin/staff acties.' },
    ],
  },
  '/admin/klanten': {
    intro: 'Overzicht van alle klantaccounts.',
    questions: [
      { q: 'Worden accounts automatisch aangemaakt?', a: 'Ja, bij elke boeking (online of telefonisch) wordt automatisch een account aangemaakt als het e-mailadres nog niet bestaat.' },
    ],
  },
};

const KNOWLEDGE_EN: Record<string, { intro: string; questions: QA[] }> = {
  '/admin': {
    intro: 'This is the dashboard — your home page with an overview of everything happening.',
    questions: [
      { q: 'What should I do here?', a: 'Check daily for open tasks, new messages and overdue payments. Click a stat card to go directly to that page.' },
      { q: 'What do the red badges mean?', a: 'Red badges indicate urgent actions — for example unanswered messages or overdue payments. Handle these first.' },
      { q: 'How do I export data?', a: 'Click the "Export" button (only visible for admin accounts). You can export bookings, payments, and customer data as CSV.' },
    ],
  },
  '/admin/planning': {
    intro: 'The planning shows all bookings as task lists. Complete 5 steps per booking in order.',
    questions: [
      { q: 'What are the 5 steps?', a: '1. Prepare — Clean caravan, check bedding, gas and inventory.\n2. Deposit check — Complete checklist before departure, customer gets deposit email.\n3. Deliver (15:00) — Drive caravan to campsite, set up awning/gas/electricity.\n4. Pick up (10:00) — Deposit check with customer, clear caravan and drive back.\n5. Final inspection — Check for damage and inventory after return.' },
      { q: 'Why is a task greyed out?', a: 'Tasks are locked until the previous step is completed. Complete the earlier task first by clicking its status circle.' },
      { q: 'How do I assign a driver?', a: 'Click the task name (e.g. "Deliver") to open the detail screen. There you can select a driver from the list or enter one manually.' },
      { q: 'What is Holded?', a: 'Holded is the accounting system. For each paid payment, you need to create an invoice in Holded. Click the Holded item to mark it as done.' },
    ],
  },
  '/admin/boekingen': {
    intro: 'Manage all bookings. Search, filter, and create phone bookings.',
    questions: [
      { q: 'How do I create a phone booking?', a: 'Click "New booking" top-right. Fill in customer details, choose caravan + campsite, select dates. The customer will receive a payment email. No account? One is created automatically.' },
      { q: 'What do the colors mean?', a: 'Green = confirmed (paid), Orange = pending (not yet paid), Red = cancelled.' },
    ],
  },
  '/admin/borg': {
    intro: 'Manage deposit checklists and perform inspections on location.',
    questions: [
      { q: 'How do I perform an inspection?', a: 'Click "Mobile Inspect" on the booking. The wizard opens fullscreen on your phone. Check all items, mark as Good/Damaged/Missing, take photos for damage, and have the customer sign.' },
      { q: 'How do I refund a deposit?', a: 'After a good inspection, you can refund the full deposit via the deposit page. For damage, you can do a partial refund.' },
    ],
  },
};

/* ═══════════════════════════════════════════════════
   General FAQ (not tied to a page)
   ═══════════════════════════════════════════════════ */
const GENERAL_NL: QA[] = [
  { q: 'Hoe werkt het betalingssysteem?', a: 'Het systeem werkt met een aanbetaling van 25% bij boeking (via iDEAL/Wero). De borg (€400) wordt op de camping afgehandeld. De restbetaling (75%) volgt direct na ontvangst van de borg.' },
  { q: 'Hoe sla ik het admin-paneel op als app?', a: 'iPhone: open in Safari → Deel-icoon → "Zet op beginscherm". Android: open in Chrome → ⋮ → "Toevoegen aan startscherm".' },
  { q: 'Pagina laadt niet, wat nu?', a: 'Ververs de pagina (Cmd+R of Ctrl+R). Als het probleem aanhoudt, probeer de cache te legen of een ander apparaat.' },
  { q: 'Hoe zoek ik snel iets?', a: 'Druk op Cmd+K (Mac) of Ctrl+K (Windows) om de globale zoekbalk te openen. Je kunt zoeken op pagina\'s, boekingen en meer.' },
];

const GENERAL_EN: QA[] = [
  { q: 'How does the payment system work?', a: 'The system uses a 25% down payment at booking (via iDEAL/Wero). The deposit (€400) is handled at the campsite. The remaining payment (75%) follows directly after receiving the deposit.' },
  { q: 'How do I save the admin panel as an app?', a: 'iPhone: open in Safari → Share icon → "Add to Home Screen". Android: open in Chrome → ⋮ → "Add to Home screen".' },
  { q: 'Page won\'t load, what now?', a: 'Refresh the page (Cmd+R or Ctrl+R). If the problem persists, try clearing the cache or using a different device.' },
];

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */

type Props = {
  locale: 'nl' | 'en';
  pathname: string;
};

interface Message {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

export default function AdminAssistant({ locale, pathname }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNl = locale !== 'en';

  // Determine current page knowledge
  const knowledge = isNl ? KNOWLEDGE_NL : KNOWLEDGE_EN;
  const general = isNl ? GENERAL_NL : GENERAL_EN;

  // Match current page — try exact match, then prefix match
  const pageKey = Object.keys(knowledge).find(k => pathname === k || pathname.startsWith(k + '/')) || '/admin';
  const pageKnowledge = knowledge[pageKey] || knowledge['/admin'];

  // Reset messages when page changes
  useEffect(() => {
    setMessages([]);
  }, [pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const addAssistantMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text }]);
  }, []);

  const handleQuestionClick = (qa: QA) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text: qa.q },
      { id: Date.now() + 1, role: 'assistant', text: qa.a },
    ]);
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: q }]);

    // Search for best matching answer
    const allQA = [...(pageKnowledge?.questions || []), ...general];
    // Also search other pages
    const otherPages = Object.values(knowledge).flatMap(k => k.questions);
    const allSearchable = [...allQA, ...otherPages];

    const qLower = q.toLowerCase();
    const words = qLower.split(/\s+/).filter(w => w.length > 2);

    let bestMatch: QA | null = null;
    let bestScore = 0;

    for (const qa of allSearchable) {
      const combined = (qa.q + ' ' + qa.a).toLowerCase();
      let score = 0;
      for (const word of words) {
        if (combined.includes(word)) score += 1;
      }
      // Bonus for question match
      for (const word of words) {
        if (qa.q.toLowerCase().includes(word)) score += 0.5;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = qa;
      }
    }

    if (bestMatch && bestScore >= 1) {
      setTimeout(() => {
        addAssistantMessage(bestMatch!.a);
      }, 300);
    } else {
      setTimeout(() => {
        addAssistantMessage(
          isNl
            ? 'Ik kon geen exact antwoord vinden. Probeer een van de voorgestelde vragen hieronder, of klik op het ❓ icoon rechtsboven voor de volledige helpgids.'
            : 'I couldn\'t find an exact answer. Try one of the suggested questions below, or click the ❓ icon top-right for the full help guide.'
        );
      }, 300);
    }
  };

  // Suggested questions for current context
  const suggestions = pageKnowledge?.questions.slice(0, 4) || [];
  const shownSuggestions = messages.length === 0 ? suggestions : suggestions.filter(s => !messages.some(m => m.text === s.q));

  const labels = isNl
    ? { title: 'Assistent', placeholder: 'Stel een vraag...', intro: pageKnowledge?.intro, sugTitle: 'Snel antwoord', genTitle: 'Algemeen' }
    : { title: 'Assistant', placeholder: 'Ask a question...', intro: pageKnowledge?.intro, sugTitle: 'Quick answer', genTitle: 'General' };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-shadow"
            aria-label={labels.title}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">{labels.title}</h3>
                <p className="text-white/70 text-[10px]">{isNl ? 'Hulp bij het adminportaal' : 'Admin portal help'}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[calc(70vh-120px)]">
              {/* Intro message */}
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="bg-sky-50 rounded-xl p-3">
                    <p className="text-sm text-sky-800 leading-relaxed">
                      {labels.intro}
                    </p>
                  </div>

                  {/* Suggested questions */}
                  {shownSuggestions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />{labels.sugTitle}
                      </p>
                      <div className="space-y-1.5">
                        {shownSuggestions.map((qa, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuestionClick(qa)}
                            className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <span className="text-xs text-foreground font-medium flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-sky-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              {qa.q}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General questions */}
                  {general.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">{labels.genTitle}</p>
                      <div className="space-y-1.5">
                        {general.slice(0, 2).map((qa, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuestionClick(qa)}
                            className="w-full text-left p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <span className="text-xs text-foreground font-medium flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              {qa.q}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conversation messages */}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-foreground rounded-bl-md'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Follow-up suggestions after messages */}
              {messages.length > 0 && shownSuggestions.length > 0 && (
                <div className="space-y-1">
                  {shownSuggestions.slice(0, 3).map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuestionClick(qa)}
                      className="w-full text-left p-2 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-sky-700 font-medium flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 shrink-0" />{qa.q}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-2.5 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={labels.placeholder}
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 bg-sky-500 text-white rounded-xl disabled:opacity-30 hover:bg-sky-600 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

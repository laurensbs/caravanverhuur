'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown, ArrowLeft } from 'lucide-react';
import { useLanguage, type Locale } from '@/i18n/context';
import { caravans } from '@/data/caravans';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  quickReplies?: string[];
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  Knowledge base per language                                        */
/* ------------------------------------------------------------------ */
interface KnowledgeEntry {
  keywords: string[];
  answer: string;
  followUp?: string[];
}

function getKnowledgeBase(locale: Locale): KnowledgeEntry[] {
  const bases: Record<Locale, KnowledgeEntry[]> = {
    nl: [
      {
        keywords: ['prijs', 'kosten', 'kost', 'tarief', 'goedkoop', 'duur', 'euro', 'betalen', 'bedrag', 'per dag', 'per week'],
        answer: `Onze caravans zijn er vanaf **€${Math.min(...caravans.map(c => c.pricePerDay))}/dag** of **€${Math.min(...caravans.map(c => c.pricePerWeek))}/week**. De prijs hangt af van het type caravan:\n\n${caravans.map(c => `• **${c.name}** — €${c.pricePerDay}/dag · €${c.pricePerWeek}/week`).join('\n')}\n\nBij een weekboeking profiteer je van korting!`,
        followUp: ['Hoe boek ik?', 'Wat zit er in de caravan?', 'Welke campings?'],
      },
      {
        keywords: ['boek', 'reserv', 'aanvraag', 'hoe boek', 'boeken'],
        answer: 'Boeken gaat heel eenvoudig:\n\n1️⃣ Kies een caravan op onze website\n2️⃣ Selecteer een camping\n3️⃣ Kies je gewenste datum\n4️⃣ Vul je gegevens in\n5️⃣ Betaal 30% aanbetaling via iDEAL/Wero\n\nJe ontvangt direct een bevestiging per e-mail! Het restbedrag (70%) betaal je uiterlijk 1 week voor aankomst.',
        followUp: ['Wat kost het?', 'Kan ik annuleren?', 'Welke campings?'],
      },
      {
        keywords: ['annul', 'terug', 'geld terug', 'restitutie'],
        answer: 'Ja, annuleren is mogelijk:\n\n• **30+ dagen** voor aankomst → 100% terug\n• **14-30 dagen** → 50% terug\n• **< 14 dagen** → niet restitueerbaar\n\nZie onze Algemene Voorwaarden voor alle details.',
        followUp: ['Hoe boek ik?', 'Hoe werkt de borg?'],
      },
      {
        keywords: ['borg', 'waarborg', 'deposit'],
        answer: 'Bij aankomst wordt een borg van **€250 – €500** (afhankelijk van de caravan) gereserveerd via iDEAL/Wero. Na controle bij vertrek wordt de borg binnen **7 dagen** teruggestort als er geen schade is.',
        followUp: ['Kan ik annuleren?', 'Wat zit er in de caravan?'],
      },
      {
        keywords: ['campings', 'camping', 'locatie', 'waar', 'welke camping', 'plek', 'pals', 'estartit', 'roses', 'lloret', 'blanes', 'tossa', 'begur'],
        answer: 'Wij werken samen met **30+ campings** verspreid over de volledige Costa Brava, van Blanes tot Cadaqués! Populaire regio\'s:\n\n🏖️ **Baix Empordà** — Pals, Begur, Calella de Palafrugell\n🌊 **Alt Empordà** — Roses, L\'Estartit, Empuriabrava\n☀️ **La Selva** — Lloret de Mar, Blanes, Tossa de Mar\n\nBij het boeken kun je je gewenste camping selecteren.',
        followUp: ['Wat kost het?', 'Hoe boek ik?', 'Staat de caravan klaar?'],
      },
      {
        keywords: ['inventaris', 'inbegrepen', 'wat zit', 'uitrusting', 'beddengoed', 'servies', 'kookgerei', 'handdoek'],
        answer: 'Elke caravan is **compleet uitgerust** met:\n\n🛏️ Dekbedden & kussens\n🍽️ Volledig servies & kookgerei\n🧹 Schoonmaakmiddelen\n🪥 Handdoeken & toiletpapier\n🪟 Rolgordijnen & horren\n\nSommige caravans hebben ook airco en een voortent!',
        followUp: ['Welke caravans zijn er?', 'Wat kost het?'],
      },
      {
        keywords: ['caravan', 'welke', 'type', 'model', 'knaus', 'homecar', 'hobby', 'adria', 'airco', 'personen'],
        answer: `We hebben momenteel **${caravans.length} caravans** beschikbaar:\n\n${caravans.map(c => `🚐 **${c.name}** (${c.type}) — max ${c.maxPersons} pers · €${c.pricePerDay}/dag\n   ${c.amenities.slice(0, 4).join(', ')}`).join('\n\n')}\n\nBekijk ze op onze [Caravans pagina](/caravans)!`,
        followUp: ['Wat kost het?', 'Hoe boek ik?', 'Welke campings?'],
      },
      {
        keywords: ['klaar', 'opbouw', 'plaatsen', 'inchecken', 'check-in', 'uitchecken', 'check-out', 'aankomst'],
        answer: 'Ja! Dat is ons concept 🎉\n\nDe caravan staat **al op de camping**, schoongemaakt en ingericht met inventaris. Je hoeft alleen maar in te checken en te genieten!\n\n⏰ **Check-in** vanaf 15:00 uur\n⏰ **Check-out** voor 11:00 uur\n\nAfwijkende tijden zijn in overleg mogelijk.',
        followUp: ['Wat zit er in de caravan?', 'Welke campings?'],
      },
      {
        keywords: ['huisdier', 'hond', 'kat', 'dier'],
        answer: 'Huisdieren zijn mogelijk afhankelijk van de camping en caravan. Neem contact met ons op om dit te bespreken — in sommige gevallen is het mogelijk tegen een kleine toeslag. 🐕',
        followUp: ['Hoe neem ik contact op?', 'Welke campings?'],
      },
      {
        keywords: ['contact', 'telefoon', 'bellen', 'mail', 'email', 'whatsapp', 'bereik'],
        answer: 'Je kunt ons op meerdere manieren bereiken:\n\n📱 **WhatsApp**: +34 650 036 755\n📧 **E-mail**: info@caravanverhuurspanje.com\n\nWe zijn **7 dagen per week** bereikbaar! Je kunt ook ons [contactformulier](/contact) gebruiken.',
        followUp: ['Hoe boek ik?', 'Wat kost het?'],
      },
      {
        keywords: ['wifi', 'internet', 'elektriciteit', 'stroom', 'gas', 'water'],
        answer: '⚡ **Elektriciteit** is inbegrepen bij de campingplaats\n⛽ **Gas** voor koken is aanwezig bij aankomst\n📶 **WiFi** is beschikbaar op de meeste campings (soms gratis, soms tegen toeslag)\n💧 **Water** is op alle campings aanwezig',
        followUp: ['Welke campings?', 'Wat zit er in de caravan?'],
      },
      {
        keywords: ['schoonma', 'opruim', 'vertrek', 'achterlaten'],
        answer: 'We vragen je de caravan **bezemschoon** op te leveren:\n\n✅ Afwas doen\n✅ Vuilnis meenemen\n✅ Vloer aanvegen\n\nDiepte-reiniging is niet nodig — dat doen wij! 🧹',
        followUp: ['Hoe werkt de borg?', 'Hoe laat check-out?'],
      },
      {
        keywords: ['betaal', 'ideal', 'wero', 'aanbetaling', 'betaalmethod'],
        answer: 'Alle betalingen verlopen veilig via **iDEAL/Wero**:\n\n1. **Aanbetaling**: 30% bij boeking\n2. **Restbedrag**: 70% uiterlijk 1 week voor aankomst\n3. **Borg**: reservering bij aankomst (retour na controle)\n\nVeilig, snel en vertrouwd! 🔒',
        followUp: ['Hoe boek ik?', 'Hoe werkt de borg?'],
      },
      {
        keywords: ['transport', 'slepen', 'vervoer', 'eigen caravan'],
        answer: 'Via ons moederbedrijf **Caravanstalling-Spanje** kun je transport boeken voor je eigen caravan naar Spanje. Bezoek [caravanstalling-spanje.com](https://caravanstalling-spanje.com) voor meer informatie. 🚗',
        followUp: ['Hoe boek ik?', 'Welke campings?'],
      },
      {
        keywords: ['seizoen', '2026', 'wanneer', 'periode', 'beschikbaar', 'datum', 'zomer'],
        answer: '☀️ **Seizoen 2026** is nu te boeken! De caravans staan klaar van **mei t/m september** op de Costa Brava.\n\nPopulair? Boek vroeg voor de beste data en campingkeuze!',
        followUp: ['Hoe boek ik?', 'Wat kost het?', 'Welke campings?'],
      },
    ],
    en: [
      {
        keywords: ['price', 'cost', 'cheap', 'expensive', 'euro', 'pay', 'rate', 'per day', 'per week'],
        answer: `Our caravans start from **€${Math.min(...caravans.map(c => c.pricePerDay))}/day** or **€${Math.min(...caravans.map(c => c.pricePerWeek))}/week**. Prices per caravan:\n\n${caravans.map(c => `• **${c.name}** — €${c.pricePerDay}/day · €${c.pricePerWeek}/week`).join('\n')}\n\nWeekly bookings include a discount!`,
        followUp: ['How do I book?', 'What\'s included?', 'Which campings?'],
      },
      {
        keywords: ['book', 'reserv', 'how to book'],
        answer: 'Booking is easy:\n\n1️⃣ Choose a caravan on our website\n2️⃣ Select a camping\n3️⃣ Pick your dates\n4️⃣ Fill in your details\n5️⃣ Pay 30% deposit via iDEAL/Wero\n\nYou\'ll receive instant confirmation by email! The remaining 70% is due 1 week before arrival.',
        followUp: ['What does it cost?', 'Can I cancel?', 'Which campings?'],
      },
      {
        keywords: ['cancel', 'refund', 'money back'],
        answer: 'Yes, cancellation is possible:\n\n• **30+ days** before arrival → 100% refund\n• **14-30 days** → 50% refund\n• **< 14 days** → non-refundable\n\nSee our Terms & Conditions for full details.',
        followUp: ['How do I book?', 'How does the deposit work?'],
      },
      {
        keywords: ['deposit', 'guarantee'],
        answer: 'A deposit of **€250 – €500** (depending on the caravan) is reserved upon arrival via iDEAL/Wero. After inspection at checkout, the deposit is refunded within **7 days** if there\'s no damage.',
        followUp: ['Can I cancel?', 'What\'s included?'],
      },
      {
        keywords: ['camping', 'location', 'where', 'which camping', 'place'],
        answer: 'We partner with **30+ campings** across the entire Costa Brava, from Blanes to Cadaqués! Popular regions:\n\n🏖️ **Baix Empordà** — Pals, Begur, Calella de Palafrugell\n🌊 **Alt Empordà** — Roses, L\'Estartit, Empuriabrava\n☀️ **La Selva** — Lloret de Mar, Blanes, Tossa de Mar',
        followUp: ['What does it cost?', 'How do I book?'],
      },
      {
        keywords: ['included', 'equipment', 'inventory', 'bedding', 'towels'],
        answer: 'Every caravan comes **fully equipped** with:\n\n🛏️ Duvets & pillows\n🍽️ Full tableware & cookware\n🧹 Cleaning supplies\n🪥 Towels & toilet paper\n🪟 Blinds & mosquito nets\n\nSome caravans also feature AC and an awning!',
        followUp: ['Which caravans?', 'What does it cost?'],
      },
      {
        keywords: ['caravan', 'which', 'type', 'model', 'persons', 'airco'],
        answer: `We have **${caravans.length} caravans** available:\n\n${caravans.map(c => `🚐 **${c.name}** (${c.type}) — max ${c.maxPersons} pers · €${c.pricePerDay}/day`).join('\n\n')}\n\nCheck them on our [Caravans page](/caravans)!`,
        followUp: ['What does it cost?', 'How do I book?'],
      },
      {
        keywords: ['check-in', 'check-out', 'arrival', 'ready', 'setup'],
        answer: 'Yes! That\'s our concept 🎉\n\nThe caravan is **already on the camping**, cleaned and set up with inventory. Just check in and enjoy!\n\n⏰ **Check-in** from 15:00\n⏰ **Check-out** before 11:00',
        followUp: ['What\'s included?', 'Which campings?'],
      },
      {
        keywords: ['contact', 'phone', 'call', 'email', 'whatsapp', 'reach'],
        answer: 'You can reach us in multiple ways:\n\n📱 **WhatsApp**: +34 650 036 755\n📧 **Email**: info@caravanverhuurspanje.com\n\nWe\'re available **7 days a week**! You can also use our [contact form](/contact).',
        followUp: ['How do I book?', 'What does it cost?'],
      },
      {
        keywords: ['season', '2026', 'when', 'period', 'available', 'summer'],
        answer: '☀️ **Season 2026** is now bookable! Caravans are ready from **May to September** on the Costa Brava.\n\nBook early for the best dates and camping choice!',
        followUp: ['How do I book?', 'What does it cost?'],
      },
      {
        keywords: ['pet', 'dog', 'cat', 'animal'],
        answer: 'Pets may be allowed depending on the camping and caravan. Contact us to discuss — in some cases it\'s possible for a small surcharge. 🐕',
        followUp: ['How to contact?', 'Which campings?'],
      },
      {
        keywords: ['payment', 'ideal', 'wero', 'pay method'],
        answer: 'All payments are processed securely via **iDEAL/Wero**:\n\n1. **Deposit**: 30% at booking\n2. **Remainder**: 70% due 1 week before arrival\n3. **Security deposit**: reserved upon arrival (refunded after inspection)\n\nSafe, fast and trusted! 🔒',
        followUp: ['How do I book?', 'How does the deposit work?'],
      },
    ],
    es: [
      {
        keywords: ['precio', 'costo', 'cuesta', 'tarifa', 'barato', 'caro', 'euro', 'pagar', 'por día', 'por semana'],
        answer: `Nuestras caravanas desde **€${Math.min(...caravans.map(c => c.pricePerDay))}/día** o **€${Math.min(...caravans.map(c => c.pricePerWeek))}/semana**:\n\n${caravans.map(c => `• **${c.name}** — €${c.pricePerDay}/día · €${c.pricePerWeek}/semana`).join('\n')}\n\n¡Las reservas semanales incluyen descuento!`,
        followUp: ['¿Cómo reservo?', '¿Qué incluye?', '¿Qué campings?'],
      },
      {
        keywords: ['reserv', 'cómo reserv', 'reservar'],
        answer: 'Reservar es fácil:\n\n1️⃣ Elige una caravana\n2️⃣ Selecciona un camping\n3️⃣ Elige tus fechas\n4️⃣ Rellena tus datos\n5️⃣ Paga el 30% de anticipo vía iDEAL/Wero\n\n¡Recibirás confirmación al instante! El 70% restante se paga 1 semana antes de la llegada.',
        followUp: ['¿Cuánto cuesta?', '¿Puedo cancelar?', '¿Qué campings?'],
      },
      {
        keywords: ['cancel', 'reembols', 'devolver dinero'],
        answer: 'Sí, es posible cancelar:\n\n• **30+ días** antes → reembolso del 100%\n• **14-30 días** → 50%\n• **< 14 días** → no reembolsable\n\nConsulta nuestros Términos y Condiciones.',
        followUp: ['¿Cómo reservo?', '¿Cómo funciona el depósito?'],
      },
      {
        keywords: ['depósito', 'garantía', 'fianza'],
        answer: 'A la llegada se reserva un depósito de **€250 – €500** (según la caravana) vía iDEAL/Wero. Tras la inspección, se devuelve en **7 días** si no hay daños.',
        followUp: ['¿Puedo cancelar?', '¿Qué incluye?'],
      },
      {
        keywords: ['camping', 'ubicación', 'dónde', 'cuál camping', 'lugar'],
        answer: 'Colaboramos con **más de 30 campings** en toda la Costa Brava:\n\n🏖️ **Baix Empordà** — Pals, Begur, Calella\n🌊 **Alt Empordà** — Roses, L\'Estartit, Empuriabrava\n☀️ **La Selva** — Lloret de Mar, Blanes, Tossa',
        followUp: ['¿Cuánto cuesta?', '¿Cómo reservo?'],
      },
      {
        keywords: ['incluido', 'equipamiento', 'inventario', 'ropa de cama', 'toallas'],
        answer: 'Cada caravana viene **completamente equipada**:\n\n🛏️ Edredones y almohadas\n🍽️ Vajilla y utensilios de cocina\n🧹 Productos de limpieza\n🪥 Toallas y papel higiénico\n🪟 Persianas y mosquiteras',
        followUp: ['¿Qué caravanas hay?', '¿Cuánto cuesta?'],
      },
      {
        keywords: ['caravana', 'cuál', 'tipo', 'modelo', 'personas', 'aire acondicionado'],
        answer: `Tenemos **${caravans.length} caravanas** disponibles:\n\n${caravans.map(c => `🚐 **${c.name}** (${c.type}) — máx ${c.maxPersons} pers · €${c.pricePerDay}/día`).join('\n\n')}\n\n¡Consulta nuestra [página de Caravanas](/caravans)!`,
        followUp: ['¿Cuánto cuesta?', '¿Cómo reservo?'],
      },
      {
        keywords: ['check-in', 'check-out', 'llegada', 'lista', 'montada'],
        answer: '¡Sí! Ese es nuestro concepto 🎉\n\nLa caravana **ya está en el camping**, limpia y equipada. ¡Solo tienes que llegar y disfrutar!\n\n⏰ **Check-in** desde las 15:00\n⏰ **Check-out** antes de las 11:00',
        followUp: ['¿Qué incluye?', '¿Qué campings?'],
      },
      {
        keywords: ['contacto', 'teléfono', 'llamar', 'email', 'whatsapp'],
        answer: 'Puedes contactarnos:\n\n📱 **WhatsApp**: +34 650 036 755\n📧 **Email**: info@caravanverhuurspanje.com\n\n¡Disponibles **7 días a la semana**!',
        followUp: ['¿Cómo reservo?', '¿Cuánto cuesta?'],
      },
      {
        keywords: ['temporada', '2026', 'cuándo', 'período', 'disponible', 'verano'],
        answer: '☀️ **Temporada 2026** ¡ya se puede reservar! Las caravanas están listas de **mayo a septiembre**.\n\n¡Reserva pronto para las mejores fechas!',
        followUp: ['¿Cómo reservo?', '¿Cuánto cuesta?'],
      },
      {
        keywords: ['mascota', 'perro', 'gato', 'animal'],
        answer: 'Las mascotas pueden ser permitidas según el camping. Contáctanos para consultarlo — en algunos casos es posible con un pequeño suplemento. 🐕',
        followUp: ['¿Cómo contactar?', '¿Qué campings?'],
      },
      {
        keywords: ['pago', 'ideal', 'wero', 'método de pago'],
        answer: 'Todos los pagos se procesan de forma segura vía **iDEAL/Wero**:\n\n1. **Anticipo**: 30% al reservar\n2. **Resto**: 70% una semana antes\n3. **Depósito**: se reserva a la llegada\n\n¡Seguro, rápido y de confianza! 🔒',
        followUp: ['¿Cómo reservo?', '¿Cómo funciona el depósito?'],
      },
    ],
  };
  return bases[locale] || bases.nl;
}

function getGreeting(locale: Locale): { text: string; quickReplies: string[] } {
  const greetings: Record<Locale, { text: string; quickReplies: string[] }> = {
    nl: {
      text: 'Hoi! 👋 Ik ben de virtuele assistent van **Caravanverhuur Spanje**. Hoe kan ik je helpen?',
      quickReplies: ['Wat kost het?', 'Hoe boek ik?', 'Welke caravans?', 'Welke campings?', 'Contact'],
    },
    en: {
      text: 'Hi! 👋 I\'m the virtual assistant of **Caravanverhuur Spanje**. How can I help you?',
      quickReplies: ['What does it cost?', 'How do I book?', 'Which caravans?', 'Which campings?', 'Contact'],
    },
    es: {
      text: '¡Hola! 👋 Soy el asistente virtual de **Caravanverhuur Spanje**. ¿En qué puedo ayudarte?',
      quickReplies: ['¿Cuánto cuesta?', '¿Cómo reservo?', '¿Qué caravanas?', '¿Qué campings?', 'Contacto'],
    },
  };
  return greetings[locale] || greetings.nl;
}

function getFallback(locale: Locale): string {
  const fallbacks: Record<Locale, string> = {
    nl: 'Hmm, daar heb ik niet direct een antwoord op. Je kunt ons bereiken via:\n\n📱 **WhatsApp**: [+34 650 036 755](https://wa.me/34650036755)\n📧 **E-mail**: info@caravanverhuurspanje.com\n\nOf stel je vraag via ons [contactformulier](/contact)!',
    en: 'Hmm, I don\'t have an answer for that. You can reach us via:\n\n📱 **WhatsApp**: [+34 650 036 755](https://wa.me/34650036755)\n📧 **Email**: info@caravanverhuurspanje.com\n\nOr ask via our [contact form](/contact)!',
    es: 'Hmm, no tengo respuesta para eso. Puedes contactarnos:\n\n📱 **WhatsApp**: [+34 650 036 755](https://wa.me/34650036755)\n📧 **Email**: info@caravanverhuurspanje.com\n\n¡O usa nuestro [formulario de contacto](/contact)!',
  };
  return fallbacks[locale] || fallbacks.nl;
}

/* ------------------------------------------------------------------ */
/*  Matching logic                                                     */
/* ------------------------------------------------------------------ */
function findBestMatch(input: string, locale: Locale): { answer: string; followUp?: string[] } {
  const kb = getKnowledgeBase(locale);
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestScore = 0;
  let bestEntry: KnowledgeEntry | null = null;

  for (const entry of kb) {
    let score = 0;
    for (const kw of entry.keywords) {
      const normalKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalKw)) {
        score += normalKw.length; // Longer keyword matches = better
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 3) {
    return { answer: bestEntry.answer, followUp: bestEntry.followUp };
  }

  return { answer: getFallback(locale) };
}

/* ------------------------------------------------------------------ */
/*  Simple markdown renderer                                           */
/* ------------------------------------------------------------------ */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold
    let processed: React.ReactNode[] = [];
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        processed.push(<strong key={j} className="font-bold">{part.slice(2, -2)}</strong>);
      } else {
        // Links
        const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
        linkParts.forEach((lp, k) => {
          const linkMatch = lp.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            processed.push(
              <a key={`${j}-${k}`} href={linkMatch[2]} className="text-primary underline" target={linkMatch[2].startsWith('http') ? '_blank' : undefined} rel={linkMatch[2].startsWith('http') ? 'noopener noreferrer' : undefined}>
                {linkMatch[1]}
              </a>
            );
          } else {
            processed.push(lp);
          }
        });
      }
    });
    return (
      <span key={i}>
        {processed}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

/* ------------------------------------------------------------------ */
/*  ChatBot Component                                                  */
/* ------------------------------------------------------------------ */
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { locale } = useLanguage();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Initialize with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting(locale as Locale);
      setMessages([{
        id: '1',
        role: 'bot',
        text: greeting.text,
        quickReplies: greeting.quickReplies,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, locale, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    const delay = 400 + Math.random() * 600;
    setTimeout(() => {
      const result = findBestMatch(text, locale as Locale);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: result.answer,
        quickReplies: result.followUp,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    }, delay);
  }, [locale, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const chatTitle: Record<string, string> = {
    nl: 'Chat met ons',
    en: 'Chat with us',
    es: 'Chatea con nosotros',
  };

  const placeholders: Record<string, string> = {
    nl: 'Stel je vraag...',
    en: 'Ask your question...',
    es: 'Haz tu pregunta...',
  };

  const poweredBy: Record<string, string> = {
    nl: 'Caravanverhuur Spanje',
    en: 'Caravanverhuur Spanje',
    es: 'Caravanverhuur Spanje',
  };

  return (
    <>
      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-5 z-[90] sm:w-[380px] sm:h-[520px] sm:max-h-[70vh] flex flex-col bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3 shrink-0 safe-area-top">
            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
              aria-label="Terug"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
              <Image
                src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png"
                alt="Bot"
                width={28}
                height={28}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{chatTitle[locale] || chatTitle.nl}</p>
              <p className="text-white/70 text-xs">{poweredBy[locale] || poweredBy.nl}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Sluiten"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 overscroll-contain">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5'
                  : 'bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm border border-gray-100'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {renderMarkdown(msg.text)}
                  </div>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Quick replies */}
            {messages.length > 0 && messages[messages.length - 1].role === 'bot' && messages[messages.length - 1].quickReplies && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {messages[messages.length - 1].quickReplies!.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qr)}
                    className="px-3 py-1.5 bg-white border border-primary/30 text-primary text-xs font-medium rounded-full hover:bg-primary/5 transition-colors active:scale-95"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2 safe-area-bottom">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholders[locale] || placeholders.nl}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-opacity active:scale-95"
              aria-label="Verstuur"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ===== FLOATING BUTTON ===== */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessage(false);
        }}
        className={`fixed bottom-20 left-5 sm:bottom-8 sm:left-5 z-[89] w-14 h-14 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 rotate-0'
            : 'bg-primary hover:scale-105'
        }`}
        aria-label={isOpen ? 'Sluit chat' : 'Open chat'}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageCircle size={22} className="text-white" />
            {hasNewMessage && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            )}
          </>
        )}
      </button>

      <style jsx>{`
        .animate-in {
          animation: chatSlideIn 0.25s ease-out;
        }
        @keyframes chatSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(0.625rem, env(safe-area-inset-bottom));
        }
        @media (max-width: 639px) {
          .safe-area-top {
            padding-top: max(2.5rem, env(safe-area-inset-top));
          }
        }
      `}</style>
    </>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown, User, Mail, Phone, Sparkles } from 'lucide-react';
import { useLanguage, type Locale } from '@/i18n/context';
import { caravans } from '@/data/caravans';
import { campings as staticCampings, type Camping } from '@/data/campings';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  id: string;
  role: 'user' | 'bot' | 'staff' | 'system';
  text: string;
  quickReplies?: string[];
  timestamp: Date;
}

type ChatMode = 'bot' | 'waiting-human' | 'live-chat' | 'leave-message';

/* ------------------------------------------------------------------ */
/*  Conversation context for follow-up tracking                        */
/* ------------------------------------------------------------------ */
interface ConversationContext {
  lastTopic: string | null;
  mentionedPersons: number | null;
  mentionedLocation: string | null;
  mentionedMonth: string | null;
  mentionedCaravan: string | null;
  askedQuestions: string[];
}

/* ------------------------------------------------------------------ */
/*  Entity extraction                                                  */
/* ------------------------------------------------------------------ */
function extractEntities(input: string) {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Person count
  const personPatterns = [
    /(\d+)\s*(persoon|personen|mensen|pers|person|people|persona|gasten|volwassenen)/,
    /met\s+z'n\s+(\d+)/,
    /met\s+(\d+)/,
    /voor\s+(\d+)/,
    /(\d+)\s*(?:man|vrouw|kind)/,
  ];
  let persons: number | null = null;
  for (const pat of personPatterns) {
    const m = lower.match(pat);
    if (m) { persons = parseInt(m[1]); break; }
  }
  // Text numbers
  if (!persons) {
    const textNums: Record<string, number> = { twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, two: 2, three: 3, four: 4, five: 5, six: 6, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
    for (const [word, num] of Object.entries(textNums)) {
      if (lower.includes(word) && /persoon|personen|mensen|pers|people|persona|gasten/.test(lower)) { persons = num; break; }
    }
  }

  // Month
  const monthMap: Record<string, string> = {
    januari: 'januari', februari: 'februari', maart: 'maart', april: 'april', mei: 'mei', juni: 'juni',
    juli: 'juli', augustus: 'augustus', september: 'september', oktober: 'oktober', november: 'november', december: 'december',
    january: 'januari', february: 'februari', march: 'maart', may: 'mei', june: 'juni', july: 'juli',
    august: 'augustus', october: 'oktober',
    enero: 'januari', febrero: 'februari', marzo: 'maart', abril: 'april', mayo: 'mei', junio: 'juni',
    julio: 'juli', agosto: 'augustus', septiembre: 'september', noviembre: 'november', diciembre: 'december',
    voorjaar: 'mei', lente: 'mei', spring: 'mei', zomer: 'juli', summer: 'juli', verano: 'juli',
    najaar: 'september', herfst: 'september', autumn: 'september',
    pasen: 'april', pinksteren: 'juni', hemelvaart: 'mei',
  };
  let month: string | null = null;
  for (const [word, mapped] of Object.entries(monthMap)) {
    if (lower.includes(word)) { month = mapped; break; }
  }

  // Location
  const locationMap: Record<string, string> = {
    pals: 'Pals', begur: 'Begur', calella: 'Calella', roses: 'Roses', estartit: 'Estartit',
    "l'estartit": 'Estartit', empuriabrava: 'Empuriabrava', lloret: 'Lloret de Mar',
    'lloret de mar': 'Lloret de Mar', blanes: 'Blanes', tossa: 'Tossa de Mar',
    'tossa de mar': 'Tossa de Mar', 'santa cristina': "Santa Cristina d'Aro",
    calonge: 'Calonge', "platja d'aro": "Platja d'Aro", 'platja daro': "Platja d'Aro",
    'sant pere': 'Sant Pere Pescador', 'sant pere pescador': 'Sant Pere Pescador',
    cadaques: 'Cadaques', "castello d'empuries": "Castello d'Empuries",
    "l'escala": "L'Escala", lescala: "L'Escala", torroella: 'Torroella de Montgri',
    colera: 'Colera', "santa cristina d'aro": "Santa Cristina d'Aro",
    'costa brava': 'Costa Brava',
  };
  let location: string | null = null;
  for (const [key, val] of Object.entries(locationMap)) {
    if (lower.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) { location = val; break; }
  }

  // Caravan name
  let caravanName: string | null = null;
  const caravanPatterns = ['knaus', 'homecar', 'hobby', 'adria', 'prestige', '450 racer', '430 unica'];
  for (const pat of caravanPatterns) {
    if (lower.includes(pat)) {
      const found = caravans.find(c => c.name.toLowerCase().includes(pat) || c.manufacturer.toLowerCase() === pat);
      if (found) { caravanName = found.name; break; }
    }
  }

  // Duration
  let duration: string | null = null;
  if (/week|weken|semana/.test(lower)) {
    const weekMatch = lower.match(/(\d+)\s*(?:week|weken|semana)/);
    duration = weekMatch ? `${weekMatch[1]} weken` : '1 week';
  } else if (/dag|dagen|day|days|dia/.test(lower)) {
    const dayMatch = lower.match(/(\d+)\s*(?:dag|dagen|day|days|dia)/);
    duration = dayMatch ? `${dayMatch[1]} dagen` : null;
  }

  // Budget
  let budget: string | null = null;
  const budgetMatch = lower.match(/budget.*?(\d+)|(\d+).*?budget|max.*?€\s*(\d+)|€\s*(\d+)/);
  if (budgetMatch) {
    budget = budgetMatch[1] || budgetMatch[2] || budgetMatch[3] || budgetMatch[4];
  }

  // Yes/no
  const isYes = /^(ja|yes|si|sí|jep|yep|ok|oké|oke|graag|absoluut|zeker|tuurlijk|sure|yeah|naturally|por supuesto|claro)/.test(lower.trim());
  const isNo = /^(nee|no|nope|niet|nah|liever niet)/.test(lower.trim());

  return { persons, month, location, caravanName, duration, budget, isYes, isNo };
}

/* ------------------------------------------------------------------ */
/*  Season checking                                                    */
/* ------------------------------------------------------------------ */
const SEASON_MONTHS = ['mei', 'juni', 'juli', 'augustus', 'september'];
function isInSeason(month: string | null): boolean {
  if (!month) return true;
  return SEASON_MONTHS.includes(month.toLowerCase());
}

/* ------------------------------------------------------------------ */
/*  Smart matching with context                                        */
/* ------------------------------------------------------------------ */
function smartMatch(
  input: string,
  locale: Locale,
  userName: string | undefined,
  ctx: ConversationContext,
  messageHistory: Message[],
  campings: Camping[],
): { answer: string; followUp?: string[]; confidence: number; topic?: string } {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const entities = extractEntities(input);
  const isNl = locale === 'nl';
  const isEs = locale === 'es';
  const name = userName ? `, ${userName}` : '';

  // Merge context with current entities
  const persons = entities.persons || ctx.mentionedPersons;
  const location = entities.location || ctx.mentionedLocation;
  const month = entities.month || ctx.mentionedMonth;
  const caravanName = entities.caravanName || ctx.mentionedCaravan;

  // ===== GREETINGS =====
  if (/^(hoi|hey|hallo|hi|hello|goedemorgen|goedemiddag|goedenavond|hola|buenos|buenas|yo)\b/.test(lower)) {
    return {
      answer: isNl
        ? `Hoi${name}! 😊 Leuk dat je er bent! Waar kan ik je mee helpen?\n\nJe kunt me alles vragen over onze caravans, campings aan de Costa Brava, prijzen, beschikbaarheid of het boekingsproces.`
        : isEs
        ? `¡Hola${name}! 😊 ¿En qué puedo ayudarte?`
        : `Hi${name}! 😊 Great to have you here! What can I help you with?`,
      followUp: isNl
        ? ['Wat kost het?', 'Welke caravans?', 'Hoe boek ik?', 'Welke campings?']
        : isEs ? ['¿Cuánto cuesta?', '¿Qué caravanas?', '¿Cómo reservo?']
        : ['What does it cost?', 'Which caravans?', 'How to book?'],
      confidence: 0.9,
      topic: 'greeting',
    };
  }

  // ===== YES/NO FOLLOW-UPS based on last topic =====
  if (entities.isYes && ctx.lastTopic) {
    if (ctx.lastTopic === 'caravan-recommendation' || ctx.lastTopic === 'complex-query') {
      return {
        answer: isNl
          ? `Top${name}! 🎉 Je kunt direct boeken via onze boekingspagina:\n\n👉 **[Direct boeken](/boeken)**\n\nKies daar je caravan, camping en datum. Je betaalt slechts 30% aanbetaling en ontvangt direct bevestiging per e-mail!\n\nHeb je nog vragen over het boekingsproces?`
          : isEs ? `¡Genial${name}! 🎉 Puedes reservar directamente:\n\n👉 **[Reservar ahora](/boeken)**`
          : `Great${name}! 🎉 You can book directly:\n\n👉 **[Book now](/boeken)**`,
        followUp: isNl ? ['Hoe werkt betalen?', 'Kan ik annuleren?', 'Wat zit erin?'] : ['How does payment work?', 'Can I cancel?'],
        confidence: 0.95,
        topic: 'booking-redirect',
      };
    }
    if (ctx.lastTopic === 'pricing') {
      return {
        answer: isNl
          ? `Mooi${name}! Hier nog wat handige info:\n\n💰 **Aanbetaling**: 30% bij boeking\n💰 **Restbedrag**: 70% uiterlijk 1 week voor aankomst\n🔒 **Borg**: €250-€500, retour na inspectie\n\nAlles gaat via **iDEAL/Wero** — veilig en vertrouwd!\n\n👉 **[Bekijk caravans](/caravans)** of **[Direct boeken](/boeken)**`
          : `More payment info:\n\n💰 **Deposit**: 30% at booking\n💰 **Remainder**: 70% due 1 week before\n🔒 **Security**: €250-€500, refunded after inspection`,
        followUp: isNl ? ['Hoe boek ik?', 'Kan ik annuleren?'] : ['How to book?', 'Can I cancel?'],
        confidence: 0.9,
        topic: 'payment-details',
      };
    }
  }

  if (entities.isNo && ctx.lastTopic) {
    return {
      answer: isNl
        ? `Geen probleem${name}! Is er iets anders waar ik je mee kan helpen? 😊`
        : isEs ? `¡No hay problema${name}! ¿Algo más?`
        : `No problem${name}! Anything else I can help with? 😊`,
      followUp: isNl ? ['Welke caravans?', 'Wat kost het?', 'Welke campings?', 'Nee, bedankt!'] : ['Which caravans?', 'Cost?', 'No thanks!'],
      confidence: 0.85,
      topic: 'other',
    };
  }

  // ===== COMPLEX MULTI-ENTITY QUERIES =====
  if (persons || (location && location !== 'Costa Brava') || month) {
    const matchingCaravans = persons ? caravans.filter(c => c.maxPersons >= persons) : caravans;
    const matchingCampings = (location && location !== 'Costa Brava')
      ? campings.filter(c => {
          const campLoc = c.location.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const campName = c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const searchLoc = location!.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return campLoc.includes(searchLoc) || campName.includes(searchLoc) || searchLoc.includes(campLoc);
        })
      : null;

    let answer = '';
    if (isNl) {
      answer = `${userName ? `Goed nieuws, ${userName}` : 'Goed nieuws'}! 🎉\n\n`;

      if (month) {
        if (isInSeason(month)) {
          answer += `📅 **${month.charAt(0).toUpperCase() + month.slice(1)}** valt in ons seizoen (mei – september), dus dat is zeker mogelijk!\n\n`;
        } else {
          answer += `📅 Helaas, **${month.charAt(0).toUpperCase() + month.slice(1)}** valt buiten ons seizoen. Onze caravans zijn beschikbaar van **mei t/m september**.\n\nWil je voor een andere periode kijken?\n`;
          return {
            answer,
            followUp: ['Welke maanden kan het?', 'Hoe boek ik?', 'Welke caravans?'],
            confidence: 0.95,
            topic: 'out-of-season',
          };
        }
      }

      if (persons) {
        answer += `Voor **${persons} ${persons === 1 ? 'persoon' : 'personen'}** zijn deze caravans geschikt:\n\n`;
        matchingCaravans.forEach(c => {
          const airco = c.amenities.some(a => a.toLowerCase().includes('airco')) ? ' · ❄️ Airco' : '';
          answer += `🚐 **${c.name}** — max ${c.maxPersons} pers · €${c.pricePerWeek}/week${airco}\n`;
        });
        answer += '\n';
        if (matchingCaravans.length === 0) {
          answer += '⚠️ Helaas hebben we geen caravans voor zoveel personen. Het maximum is 5 personen.\n\n';
        }
      }

      if (matchingCampings && matchingCampings.length > 0) {
        answer += `📍 Campings bij **${location}**:\n\n`;
        matchingCampings.slice(0, 4).forEach(c => {
          answer += `⛺ **${c.name}** — ${c.location}\n   ${c.description}\n\n`;
        });
      } else if (location && location !== 'Costa Brava' && (!matchingCampings || matchingCampings.length === 0)) {
        answer += `📍 We hebben geen campings exact in **${location}**, maar we werken met 30+ campings verspreid over de hele Costa Brava. Wil je campings bij een andere locatie zien?\n\n`;
      }

      answer += '💡 Wil je dat ik je help met boeken?';
    } else if (isEs) {
      answer = `${userName ? `¡Buenas noticias, ${userName}` : '¡Buenas noticias'}! 🎉\n\n`;
      if (persons) {
        answer += `Para **${persons} personas**:\n\n`;
        matchingCaravans.forEach(c => { answer += `🚐 **${c.name}** — máx ${c.maxPersons} pers · €${c.pricePerWeek}/semana\n`; });
      }
      if (matchingCampings && matchingCampings.length > 0) {
        answer += `\n📍 Campings cerca de **${location}**:\n\n`;
        matchingCampings.slice(0, 3).forEach(c => { answer += `⛺ **${c.name}** — ${c.location}\n`; });
      }
      answer += '\n💡 ¿Quieres que te ayude a reservar?';
    } else {
      answer = `${userName ? `Great news, ${userName}` : 'Great news'}! 🎉\n\n`;
      if (persons) {
        answer += `For **${persons} people**:\n\n`;
        matchingCaravans.forEach(c => { answer += `🚐 **${c.name}** — max ${c.maxPersons} people · €${c.pricePerWeek}/week\n`; });
      }
      if (matchingCampings && matchingCampings.length > 0) {
        answer += `\n📍 Campings near **${location}**:\n\n`;
        matchingCampings.slice(0, 3).forEach(c => { answer += `⛺ **${c.name}** — ${c.location}\n`; });
      }
      answer += '\n💡 Want me to help you book?';
    }

    return {
      answer,
      followUp: isNl
        ? ['Ja, help me boeken!', 'Wat kost het precies?', 'Bekijk caravans', 'Spreek een medewerker']
        : isEs ? ['¡Sí, ayúdame!', '¿Cuánto cuesta?'] : ['Yes, help me book!', 'What does it cost?', 'Talk to staff'],
      confidence: 0.95,
      topic: 'complex-query',
    };
  }

  // ===== SPECIFIC CARAVAN QUESTION =====
  if (caravanName) {
    const caravan = caravans.find(c => c.name === caravanName)!;
    return {
      answer: isNl
        ? `De **${caravan.name}** is een ${caravan.type === 'FAMILIE' ? 'ruime familie' : 'compacte'}caravan (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Max **${caravan.maxPersons} personen**\n💰 €${caravan.pricePerDay}/dag · €${caravan.pricePerWeek}/week\n🔒 Borg: €${caravan.deposit}\n\n🔧 **Uitrusting**: ${caravan.amenities.join(', ')}\n\n📝 ${caravan.description}\n\n👉 **[Bekijk details](/caravans/${caravan.id})**`
        : isEs
        ? `La **${caravan.name}** (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Máx **${caravan.maxPersons} personas**\n💰 €${caravan.pricePerDay}/día · €${caravan.pricePerWeek}/semana\n\n👉 **[Ver detalles](/caravans/${caravan.id})**`
        : `The **${caravan.name}** (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Max **${caravan.maxPersons} people**\n💰 €${caravan.pricePerDay}/day · €${caravan.pricePerWeek}/week\n\n👉 **[View details](/caravans/${caravan.id})**`,
      followUp: isNl ? ['Hoe boek ik deze?', 'Andere caravans?', 'Welke campings?'] : ['How to book?', 'Other caravans?'],
      confidence: 0.9,
      topic: 'specific-caravan',
    };
  }

  // ===== PRICING =====
  if (/prijs|kosten|kost|tarief|goedkoop|duur|euro|bedrag|per dag|per week|price|cost|cheap|rate|precio|cuesta|tarifa|hoeveel|budget/.test(lower)) {
    const cheapest = caravans.reduce((a, b) => a.pricePerWeek < b.pricePerWeek ? a : b);
    return {
      answer: isNl
        ? `Onze prijzen${name}:\n\n${caravans.map(c => {
            const airco = c.amenities.some(a => a.toLowerCase().includes('airco')) ? ' ❄️' : '';
            return `🚐 **${c.name}**${airco}\n   €${c.pricePerDay}/dag · €${c.pricePerWeek}/week · max ${c.maxPersons} pers`;
          }).join('\n\n')}\n\n💡 Tip: de **${cheapest.name}** is onze voordeligste optie!\n\nBij een weekboeking profiteer je van extra korting. Wil je meer weten over de betaling?`
        : isEs
        ? `Nuestros precios:\n\n${caravans.map(c => `🚐 **${c.name}** — €${c.pricePerDay}/día · €${c.pricePerWeek}/semana`).join('\n')}`
        : `Our prices:\n\n${caravans.map(c => `🚐 **${c.name}** — €${c.pricePerDay}/day · €${c.pricePerWeek}/week`).join('\n')}`,
      followUp: isNl ? ['Ja, hoe werkt betalen?', 'Hoe boek ik?', 'Welke caravans?'] : ['How does payment work?', 'How to book?'],
      confidence: 0.9,
      topic: 'pricing',
    };
  }

  // ===== BOOKING =====
  if (/boek|reserv|aanvraag|hoe.*boek|how.*book|reservar|como reserv|help.*boeken|wil.*boeken|wil.*huren/.test(lower)) {
    return {
      answer: isNl
        ? `Boeken is heel eenvoudig${name}! 🎉\n\n1️⃣ Kies een caravan op onze [caravans pagina](/caravans)\n2️⃣ Selecteer je camping\n3️⃣ Kies je datum\n4️⃣ Vul je gegevens in\n5️⃣ Betaal 30% aanbetaling via iDEAL/Wero\n\nJe ontvangt direct een bevestiging per e-mail!\n\n👉 **[Direct boeken](/boeken)**\n\nWil je dat ik je help bij het kiezen van een caravan of camping?`
        : isEs ? `¡Reservar es muy fácil! 🎉\n\n1️⃣ Elige una caravana\n2️⃣ Selecciona el camping\n3️⃣ Elige tus fechas\n4️⃣ Rellena tus datos\n5️⃣ Paga el 30%\n\n👉 **[Reservar ahora](/boeken)**`
        : `Booking is super easy${name}! 🎉\n\n1️⃣ Choose a caravan\n2️⃣ Select camping\n3️⃣ Pick dates\n4️⃣ Fill in details\n5️⃣ Pay 30% deposit\n\n👉 **[Book now](/boeken)**`,
      followUp: isNl ? ['Ja, help me kiezen!', 'Wat kost het?', 'Kan ik annuleren?'] : ['Help me choose!', 'Cost?', 'Can I cancel?'],
      confidence: 0.9,
      topic: 'booking',
    };
  }

  // ===== CANCELLATION =====
  if (/annul|terug|geld terug|restitutie|cancel|refund|money back|cancelar|reembols/.test(lower)) {
    return {
      answer: isNl
        ? `Ja${name}, annuleren is mogelijk:\n\n✅ **30+ dagen** voor aankomst → 100% terug\n⚠️ **14-30 dagen** → 50% terug\n❌ **< 14 dagen** → niet restitueerbaar\n\nZie onze [Algemene Voorwaarden](/voorwaarden) voor alle details.\n\nWe raden altijd een reis- of annuleringsverzekering aan!`
        : isEs ? 'Sí, es posible cancelar:\n\n✅ **30+ días** → 100% reembolso\n⚠️ **14-30 días** → 50%\n❌ **< 14 días** → no reembolsable'
        : 'Yes, cancellation is possible:\n\n✅ **30+ days** → 100% refund\n⚠️ **14-30 days** → 50%\n❌ **< 14 days** → non-refundable',
      followUp: isNl ? ['Hoe boek ik?', 'Hoe werkt de borg?', 'Welke voorwaarden?'] : ['How to book?', 'Deposit info?'],
      confidence: 0.85,
      topic: 'cancellation',
    };
  }

  // ===== DEPOSIT/BORG =====
  if (/borg|waarborg|deposit|garantia|fianza|waarborgsom/.test(lower)) {
    return {
      answer: isNl
        ? `De borg werkt zo${name}:\n\n🔒 Bij aankomst wordt **€250 – €500** gereserveerd via iDEAL/Wero (afhankelijk van de caravan)\n✅ Na inspectie bij vertrek zonder schade: terugstorting binnen **7 dagen**\n\nPer caravan:\n${caravans.map(c => `• **${c.name}** → €${c.deposit} borg`).join('\n')}\n\nDe borg is geen extra kosten, maar een waarborg die je gewoon terugkrijgt!`
        : 'A deposit of **€250 – €500** is reserved upon arrival. Refunded within **7 days** if no damage.',
      followUp: isNl ? ['Kan ik annuleren?', 'Wat zit erin?', 'Hoe boek ik?'] : ['Can I cancel?', "What's included?"],
      confidence: 0.85,
      topic: 'deposit',
    };
  }

  // ===== PAYMENT =====
  if (/betaal|ideal|wero|aanbetaling|betaalmethod|payment|pay method|pago|metodo de pago|betaling|creditcard|pinnen/.test(lower)) {
    return {
      answer: isNl
        ? `Alle betalingen verlopen veilig via **iDEAL/Wero**${name}:\n\n1️⃣ **Aanbetaling**: 30% bij boeking\n2️⃣ **Restbedrag**: 70% uiterlijk 1 week voor aankomst\n3️⃣ **Borg**: reservering bij aankomst op de camping\n\n🔒 Veilig, snel en vertrouwd!\n\nNa betaling ontvang je direct een bevestigingsmail met alle details.`
        : 'Payments via **iDEAL/Wero**:\n\n1. **Deposit**: 30% at booking\n2. **Remainder**: 70% due 1 week before\n3. **Security**: reserved on arrival',
      followUp: isNl ? ['Hoe boek ik?', 'Hoe werkt de borg?', 'Kan ik annuleren?'] : ['How to book?', 'Deposit info?'],
      confidence: 0.85,
      topic: 'payment',
    };
  }

  // ===== CAMPINGS / LOCATIONS =====
  if (/camping|locatie|waar|welke camping|plek|location|where|which camping|ubicacion|donde|bestemming/.test(lower)) {
    return {
      answer: isNl
        ? `We werken samen met **30+ campings** over de hele Costa Brava${name}! 🏖️\n\n📍 **Baix Emporda** — Pals, Begur, Calella\n📍 **Alt Emporda** — Roses, L'Estartit, Empuriabrava\n📍 **La Selva** — Lloret de Mar, Blanes, Tossa\n📍 **Costa Brava Zuid** — Platja d'Aro, Calonge, Santa Cristina d'Aro\n\nPopulaire campings:\n⛺ Cypsela Resort (Pals) — 5 sterren, direct aan strand\n⛺ La Ballena Alegre (Sant Pere) — breed zandstrand\n⛺ Cala Gogo (Calonge) — uitgebreide faciliteiten\n\n👉 Bekijk alles op onze [bestemmingen pagina](/bestemmingen)!\n\nHeb je een voorkeur voor een regio?`
        : isEs ? 'Colaboramos con **más de 30 campings** en toda la Costa Brava! 🏖️\n\nConsulta nuestros [destinos](/bestemmingen).'
        : 'We partner with **30+ campings** across the Costa Brava! 🏖️\n\nCheck our [destinations page](/bestemmingen)!',
      followUp: isNl ? ['Campings in Pals', 'Campings in Roses', 'Campings in Lloret', 'Welke caravans?'] : ['Campings in Pals', 'Campings in Roses'],
      confidence: 0.85,
      topic: 'campings',
    };
  }

  // ===== CARAVANS =====
  if (/caravan|welke|type|model|airco|which.*caravan|que caravana|overzicht|aanbod/.test(lower)) {
    return {
      answer: isNl
        ? `We hebben **${caravans.length} caravans** beschikbaar${name}:\n\n${caravans.map(c => {
            const highlights: string[] = [];
            if (c.amenities.some(a => a.toLowerCase().includes('airco'))) highlights.push('❄️ Airco');
            if (c.amenities.some(a => a.toLowerCase().includes('douche'))) highlights.push('🚿 Douche');
            if (c.amenities.some(a => a.toLowerCase().includes('voortent'))) highlights.push('⛺ Voortent');
            return `🚐 **${c.name}** (${c.type === 'FAMILIE' ? 'Familie' : 'Compact'})\n   Max ${c.maxPersons} pers · €${c.pricePerDay}/dag · €${c.pricePerWeek}/week\n   ${highlights.join(' · ')}`;
          }).join('\n\n')}\n\n👉 [Bekijk alle caravans](/caravans)\n\nWil je meer weten over een specifieke caravan?`
        : isEs ? `Tenemos **${caravans.length} caravanas**:\n\n${caravans.map(c => `🚐 **${c.name}** — máx ${c.maxPersons} pers · €${c.pricePerDay}/día`).join('\n\n')}\n\n👉 [Ver caravanas](/caravans)`
        : `We have **${caravans.length} caravans**:\n\n${caravans.map(c => `🚐 **${c.name}** — max ${c.maxPersons} people · €${c.pricePerDay}/day`).join('\n\n')}\n\n👉 [View caravans](/caravans)`,
      followUp: isNl ? ['Vertel meer over de Knaus', 'Vertel meer over de HomeCar', 'Wat kost het?', 'Hoe boek ik?'] : ['Tell me about Knaus', 'Cost?'],
      confidence: 0.85,
      topic: 'caravans',
    };
  }

  // ===== AIRCO =====
  if (/airco|airconditioning|koeling|warm|heet|temperatuur|koel/.test(lower)) {
    const withAirco = caravans.filter(c => c.amenities.some(a => a.toLowerCase().includes('airco')));
    return {
      answer: isNl
        ? `Goede vraag${name}! In de zomermaanden kan het flink warm worden aan de Costa Brava. ☀️\n\n${withAirco.length > 0
            ? `De volgende caravan${withAirco.length > 1 ? 's hebben' : ' heeft'} **airco**:\n\n${withAirco.map(c => `❄️ **${c.name}** — €${c.pricePerWeek}/week`).join('\n')}\n\nDe andere caravans hebben goede ventilatie en luifels voor schaduw.`
            : 'Op dit moment heeft geen van onze caravans airco, maar ze hebben wel goede ventilatie.'}`
        : `The **${withAirco.map(c => c.name).join(', ')}** ${withAirco.length > 1 ? 'have' : 'has'} air conditioning.`,
      followUp: isNl ? ['Vertel meer over de HomeCar', 'Welke caravans?', 'Hoe boek ik?'] : ['Tell me about HomeCar', 'How to book?'],
      confidence: 0.85,
      topic: 'airco',
    };
  }

  // ===== INVENTORY / INCLUDED =====
  if (/inventaris|inbegrepen|wat zit|uitrusting|beddengoed|servies|kookgerei|handdoek|included|equipment|inventory|meenemen|paklijst/.test(lower)) {
    return {
      answer: isNl
        ? `Elke caravan is **compleet uitgerust**${name}:\n\n🛏️ Dekbedden & kussens\n🍽️ Volledig servies & kookgerei\n🧹 Schoonmaakmiddelen\n🪥 Handdoeken & toiletpapier\n🪟 Rolgordijnen & horren\n⛺ Luifel & grondzeil (bij de meeste)\n\nSommige caravans hebben ook:\n❄️ Airco\n⛺ Voortent\n🚿 Douche & toilet\n\n💡 Je hoeft eigenlijk alleen je kleding en persoonlijke spullen mee te nemen!`
        : 'Every caravan comes **fully equipped** with duvets, tableware, cleaning supplies, towels, and more!',
      followUp: isNl ? ['Welke caravans?', 'Wat kost het?', 'Hoe boek ik?'] : ['Which caravans?', 'Cost?'],
      confidence: 0.85,
      topic: 'inventory',
    };
  }

  // ===== CHECK-IN/CHECK-OUT =====
  if (/klaar|opbouw|plaatsen|inchecken|check.?in|check.?out|uitchecken|aankomst|arrival|ready|setup|hoe laat|wat tijd|ophalen|afhalen/.test(lower)) {
    return {
      answer: isNl
        ? `Het mooie van ons concept${name}: de caravan staat **al op de camping**! 🎉\n\nSchoongemaakt, ingericht en klaar om in te checken.\n\n⏰ **Check-in**: vanaf **15:00 uur**\n⏰ **Check-out**: voor **11:00 uur**\n\nAfwijkende check-in/out tijden zijn in overleg vaak mogelijk. Heb je een vroege of late aankomst?`
        : 'The caravan is **already on the camping**, cleaned and set up! 🎉\n\n⏰ **Check-in** from 15:00\n⏰ **Check-out** before 11:00',
      followUp: isNl ? ['Wat zit erin?', 'Hoe werkt vertrek?', 'Welke campings?'] : ["What's included?", 'Which campings?'],
      confidence: 0.85,
      topic: 'checkin',
    };
  }

  // ===== CLEANING / DEPARTURE =====
  if (/schoonma|opruim|vertrek|achterlaten|clean|tidy|departure|bij vertrek|hoe vertrek/.test(lower)) {
    return {
      answer: isNl
        ? `Bij vertrek vragen we je de caravan **bezemschoon** achter te laten${name}:\n\n✅ Afwas doen\n✅ Vuilnis meenemen naar container\n✅ Vloer aanvegen\n✅ Koelkast leegmaken\n\n🧹 De dieptereiniging doen wij! Daar hoef je je geen zorgen over te maken.\n\nNa onze inspectie ontvang je de borg binnen 7 dagen terug.`
        : 'Please leave the caravan **broom clean**. Deep cleaning is on us! 🧹',
      followUp: isNl ? ['Hoe werkt de borg?', 'Hoe laat check-out?'] : ['Deposit info?', 'Check-out time?'],
      confidence: 0.85,
      topic: 'cleaning',
    };
  }

  // ===== PETS =====
  if (/huisdier|hond|kat|dier|pet|dog|cat|animal|mascota|perro|gato/.test(lower)) {
    return {
      answer: isNl
        ? `Huisdieren zijn mogelijk afhankelijk van de camping en caravan${name}. 🐕\n\nBij sommige campings is het toegestaan (soms tegen een kleine toeslag). Neem contact met ons op zodat we dit voor je kunnen uitzoeken!\n\nWil je dat ik je doorverbind met een medewerker?`
        : 'Pets may be allowed depending on the camping. Contact us to discuss! 🐕',
      followUp: isNl ? ['Spreek een medewerker', 'Welke campings?', 'Hoe boek ik?'] : ['Talk to staff', 'Which campings?'],
      confidence: 0.85,
      topic: 'pets',
    };
  }

  // ===== WIFI / ELECTRICITY =====
  if (/wifi|internet|elektriciteit|stroom|gas|water|electricity|oplaad/.test(lower)) {
    return {
      answer: isNl
        ? `Goede vraag${name}! Hier is de info over voorzieningen:\n\n⚡ **Elektriciteit** — inbegrepen bij de campingplaats\n⛽ **Gas** — aanwezig voor koken\n📶 **WiFi** — beschikbaar op de meeste campings (soms gratis, soms tegen toeslag)\n💧 **Water** — op alle campings aanwezig\n🔌 **Oplaadpunten** — stopcontacten in de caravan\n\nDe campings hebben ook sanitairgebouwen, winkels en vaak restaurants!`
        : 'Electricity included, gas provided, WiFi on most campings, water on all sites.',
      followUp: isNl ? ['Welke campings?', 'Wat zit erin?', 'Hoe boek ik?'] : ['Which campings?', "What's included?"],
      confidence: 0.8,
      topic: 'facilities',
    };
  }

  // ===== SEASON / AVAILABILITY =====
  if (/seizoen|2026|wanneer|periode|beschikbaar|datum|zomer|season|when|available|summer|temporada|cuando|welke maanden/.test(lower)) {
    return {
      answer: isNl
        ? `☀️ **Seizoen 2026** loopt van **mei t/m september**${name}!\n\nHoogseizoen (juli/augustus) is het populairst, dus boek op tijd!\n📅 Tussei-/laagseizoen (mei, juni, september) geeft vaak betere tarieven en meer rust.\n\nMomenteel is alles nog beschikbaar. Wil je voor een bepaalde maand kijken?\n\n👉 **[Direct boeken](/boeken)**`
        : '☀️ **Season 2026** runs from **May to September**. Book early!',
      followUp: isNl ? ['Hoe boek ik?', 'Wat kost het?', 'Welke caravans?'] : ['How to book?', 'Cost?'],
      confidence: 0.85,
      topic: 'season',
    };
  }

  // ===== VACATION / HOLIDAY =====
  if (/vakantie|holiday|vacation|op reis|reizen|travel|viaje|vacaciones|weekendje|uitje/.test(lower)) {
    return {
      answer: isNl
        ? `Droom je van een heerlijke vakantie aan de Costa Brava${name}? ☀️🏖️\n\nWij maken het je makkelijk:\n✅ Caravan staat al klaar op de camping\n✅ Volledig ingericht met inventaris\n✅ 30+ campings om uit te kiezen\n✅ Vanaf €${Math.min(...caravans.map(c => c.pricePerWeek))}/week\n\nVertel me meer! Hoeveel personen zijn jullie, welke periode, en heb je een voorkeur voor een locatie?`
        : `Dreaming of a Costa Brava holiday? ☀️🏖️\n\nTell me more: how many people, when, any preference?`,
      followUp: isNl ? ['We zijn met 4 personen', 'In juli', 'Bij Lloret de Mar', 'Wat kost het?'] : ['4 people', 'In July', 'Near Lloret'],
      confidence: 0.85,
      topic: 'vacation',
    };
  }

  // ===== FAMILY / KIDS =====
  if (/gezin|kinderen|kind|baby|familie|peuter|family|children|kids|baby|ninos|familia/.test(lower)) {
    return {
      answer: isNl
        ? `We zijn heel geschikt voor gezinnen met kinderen${name}! 👨‍👩‍👧‍👦\n\n🏖️ Veel campings hebben **zwembaden, speeltuinen en animatie**\n🚐 Onze familiecaravans bieden tot 5 slaapplaatsen\n🛏️ Dekbedden en kussens aanwezig\n⛺ Voortent als extra leefruimte\n\nAanraders voor gezinnen:\n⛺ **Cypsela Resort** (Pals) — zwembadcomplex\n⛺ **Cala Gogo** (Calonge) — animatieprogramma\n⛺ **Tucan** (Lloret) — waterpark!\n\nWil je dat ik een geschikte caravan voor je gezin zoek?`
        : 'We are very family-friendly! Many campings have pools, playgrounds and activities for children.',
      followUp: isNl ? ['Ja graag!', 'Welke caravans voor gezin?', 'Hoe boek ik?'] : ['Yes please!', 'Which caravans?'],
      confidence: 0.85,
      topic: 'family',
    };
  }

  // ===== COUPLE / ROMANTIC =====
  if (/koppel|stelletje|samen|romantisch|twee personen|couple|romantic|pareja|romantico/.test(lower)) {
    return {
      answer: isNl
        ? `Een romantisch uitje aan de Costa Brava${name}? ❤️\n\nOnze compacte caravans zijn perfect voor koppels:\n\n🚐 **Knaus 1997** — €329/week, gezellige rondzit\n🚐 **Adria 430 Unica** — €329/week, compact en knus\n\nTips voor koppels:\n🌅 Begur & Pals — prachtige dorpjes en verborgen stranden\n🍷 L'Escala — Griekse ruines en heerlijke vis\n🏖️ Cadaques — kunstenaarsdorp met charme\n\nZal ik een optie voor jullie samenstellen?`
        : 'Our compact caravans are perfect for couples! Starting from €329/week.',
      followUp: isNl ? ['Ja, stel iets samen!', 'Wat kost het?', 'Welke campings?'] : ['Yes!', 'Cost?'],
      confidence: 0.85,
      topic: 'couple',
    };
  }

  // ===== TRANSPORT =====
  if (/transport|slepen|vervoer|eigen caravan|hoe kom|rijden|reizen naar|how to get|como llegar/.test(lower)) {
    return {
      answer: isNl
        ? `Je hoeft je caravan niet zelf te vervoeren${name}! 🚗\n\nDe caravan staat **al op de camping** als je aankomt. Je rijdt gewoon naar de camping en checkt in!\n\n🚗 **Met de auto**: ca. 12-14 uur rijden vanaf Nederland\n✈️ **Met het vliegtuig**: naar Girona (30 min) of Barcelona (1,5 uur)\n\nHeb je een eigen caravan? Via ons moederbedrijf [Caravanstalling-Spanje](https://caravanstalling-spanje.com) kun je transport boeken.`
        : 'The caravan is already at the camping! You just drive there or fly to Girona/Barcelona.',
      followUp: isNl ? ['Hoe boek ik?', 'Welke campings?', 'Wat kost het?'] : ['How to book?', 'Which campings?'],
      confidence: 0.85,
      topic: 'transport',
    };
  }

  // ===== WEATHER =====
  if (/weer|temperatuur|regen|zon|klimaat|weather|temperature|rain|sun|clima|tiempo/.test(lower)) {
    return {
      answer: isNl
        ? `Het weer aan de Costa Brava is heerlijk${name}! ☀️\n\n🌡️ **Mei**: 18-23°C, lekker warm\n🌡️ **Juni**: 22-28°C, ideaal\n🌡️ **Juli/Aug**: 25-33°C, volop zomer!\n🌡️ **September**: 22-28°C, aangenaam warm\n\nGemiddeld 300 dagen zon per jaar! Regenachtige dagen zijn zeldzaam in het seizoen.\n\n💡 Tip: de **HomeCar 450 Racer** heeft airco voor de warmste dagen!`
        : 'Costa Brava weather is wonderful! 25-33°C in summer with 300 sunny days a year. ☀️',
      followUp: isNl ? ['Welke caravans met airco?', 'Welke maanden?', 'Hoe boek ik?'] : ['Caravans with AC?', 'How to book?'],
      confidence: 0.85,
      topic: 'weather',
    };
  }

  // ===== ACTIVITIES / THINGS TO DO =====
  if (/activiteit|uitje|bezienswaardigh|doen|strand|zwem|snorkel|wandel|fiets|activity|things to do|beach|swim|actividad|playa/.test(lower)) {
    return {
      answer: isNl
        ? `Er is zoveel te doen aan de Costa Brava${name}! 🎉\n\n🏖️ **Stranden** — verborgen baaien, brede zandstranden\n🤿 **Snorkelen/Duiken** — Medes Eilanden (Estartit)\n🚴 **Fietsen** — routes door het achterland\n🏰 **Cultuur** — Dali Museum (Figueres), Romeinse ruines (Empuries)\n🌊 **Watersport** — kajakken, SUP, zeilen\n🍷 **Wijnproeven** — Emporda wijnstreek\n🎢 **Waterpret** — Aquabrava, campingzwembaden\n👨‍👩‍👧 **Kids** — dierparken, aquariums, speeltuinen\n\nBekijk onze [bestemmingen pagina](/bestemmingen) voor meer inspiratie!`
        : 'So much to do at the Costa Brava! Beaches, snorkeling, cycling, culture, water sports, and more!',
      followUp: isNl ? ['Welke campings bij het strand?', 'Hoe boek ik?', 'Welke caravans?'] : ['Beach campings?', 'How to book?'],
      confidence: 0.85,
      topic: 'activities',
    };
  }

  // ===== SAFETY / INSURANCE =====
  if (/veilig|verzekering|insurance|safe|diefstal|theft|segur/.test(lower)) {
    return {
      answer: isNl
        ? `Veiligheid is belangrijk${name}! 🔒\n\n✅ Campings hebben 24/7 bewaking\n✅ Je bezittingen zijn veilig in de caravan\n✅ Onze caravans zijn goed onderhouden\n\n💡 We raden een reis- of annuleringsverzekering aan. De borgregeling beschermt ons both sides:\n\n🔒 Borg: €250-€500 via iDEAL/Wero\n✅ Retour binnen 7 dagen bij geen schade`
        : 'Safety is important! Campings have 24/7 security. We recommend travel insurance.',
      followUp: isNl ? ['Hoe werkt de borg?', 'Kan ik annuleren?'] : ['Deposit info?', 'Cancel?'],
      confidence: 0.8,
      topic: 'safety',
    };
  }

  // ===== VOORWAARDEN =====
  if (/voorwaarden|terms|regels|rules|conditi|terms and conditions|terminos/.test(lower)) {
    return {
      answer: isNl
        ? `Je kunt al onze voorwaarden vinden op onze website${name}:\n\n📋 **[Algemene Voorwaarden](/voorwaarden)**\n🔒 **[Privacybeleid](/privacy)**\n\nBelangrijkste punten:\n• 30% aanbetaling bij boeking\n• 70% restbedrag 1 week voor aankomst\n• Gratis annuleren tot 30 dagen voor aankomst\n• Borg: €250-€500 (retour na inspectie)\n\nHeb je specifieke vragen over de voorwaarden?`
        : 'Find our terms at [Terms & Conditions](/voorwaarden) and [Privacy Policy](/privacy).',
      followUp: isNl ? ['Kan ik annuleren?', 'Hoe werkt de borg?', 'Hoe boek ik?'] : ['Cancel?', 'Deposit?'],
      confidence: 0.8,
      topic: 'terms',
    };
  }

  // ===== OVER ONS / ABOUT =====
  if (/wie zijn|over jullie|over ons|bedrijf|about|who are|sobre nosotros|quienes/.test(lower)) {
    return {
      answer: isNl
        ? `Wij zijn **Caravanverhuur Spanje**${name}! 🇪🇸\n\nOns concept is simpel: wij zorgen ervoor dat er een volledig ingerichte caravan op de camping van jouw keuze staat. Jij hoeft alleen maar te genieten!\n\n✅ 30+ campings aan de Costa Brava\n✅ 4 goed onderhouden caravans\n✅ Alles inclusief (inventaris, beddengoed, etc.)\n✅ Nederlandse service\n\nOns moederbedrijf [Caravanstalling-Spanje](https://caravanstalling-spanje.com) regelt het transport.\n\n👉 Lees meer op onze [Over Ons pagina](/over-ons)!`
        : 'We are **Caravanverhuur Spanje**! We place fully equipped caravans on campings across the Costa Brava.',
      followUp: isNl ? ['Welke caravans?', 'Welke campings?', 'Hoe boek ik?'] : ['Which caravans?', 'How to book?'],
      confidence: 0.85,
      topic: 'about',
    };
  }

  // ===== CONTACT / SPEAK TO HUMAN =====
  if (/contact|telefoon|bellen|mail|email|bereik|medewerker|persoon|iemand|spreek|menselijk|echt|live|chat met|speak|talk|human|real|staff|person|contacto|hablar/.test(lower)) {
    return {
      answer: isNl
        ? `${userName ? `Natuurlijk, ${userName}! ` : ''}Ik verbind je graag door met een medewerker. Even geduld...`
        : isEs ? 'Te conecto con un empleado. Un momento...'
        : `${userName ? `No problem, ${userName}! ` : ''}Connecting you with a staff member...`,
      followUp: [],
      confidence: 1.0,
      topic: 'human-request',
    };
  }

  // ===== RECOMMENDATIONS =====
  if (/tip|aanrader|recommend|advies|advice|welke.*beste|which.*best|favoriet|anraden|suggestie/.test(lower)) {
    return {
      answer: isNl
        ? `Hier zijn mijn tips${name}! 🌟\n\n**Voor gezinnen:**\n🚐 Hobby Prestige 650 (5 pers) + Cypsela Resort (Pals)\n\n**Voor koppels:**\n🚐 Knaus 1997 (4 pers, gezellig) + Camping Begur\n\n**Met airco (aanrader bij zomerhitte!):**\n🚐 HomeCar 450 Racer + La Ballena Alegre\n\n**Budget-optie:**\n🚐 Knaus 1997 of Adria 430 — vanaf €329/week!\n\nWil je dat ik iets specifieks voor je uitzoek?`
        : 'My recommendations: Hobby Prestige for families, Knaus for couples, HomeCar for AC!',
      followUp: isNl ? ['Vertel meer over Hobby Prestige', 'Vertel meer over HomeCar', 'Hoe boek ik?'] : ['Tell me about Hobby', 'How to book?'],
      confidence: 0.85,
      topic: 'recommendations',
    };
  }

  // ===== THANKS =====
  if (/bedankt|dankje|dank|thanks|thank you|gracias|top|super|mooi|fijn|geweldig|perfect/.test(lower)) {
    return {
      answer: isNl
        ? `Graag gedaan${name}! 😊 Kan ik je nog ergens anders mee helpen?\n\nIk weet alles over onze caravans, campings, prijzen en boekingsproces!`
        : isEs ? `¡De nada${name}! 😊 ¿Algo más?`
        : `You're welcome${name}! 😊 Anything else?`,
      followUp: isNl ? ['Hoe boek ik?', 'Wat kost het?', 'Nee, bedankt!'] : ['How to book?', 'No thanks!'],
      confidence: 0.9,
      topic: 'thanks',
    };
  }

  // ===== FAREWELL =====
  if (/^(nee.*bedankt|doei|dag|bye|goodbye|adios|tot ziens|nee.*dank|tot snel|ciao)/.test(lower)) {
    return {
      answer: isNl
        ? `Tot snel${name}! 👋 Mocht je nog vragen hebben, ik ben er altijd.\n\nFijne dag en hopelijk tot ziens aan de Costa Brava! ☀️🏖️`
        : isEs ? `¡Hasta luego${name}! 👋 ☀️`
        : `Goodbye${name}! 👋 Have a great day! ☀️`,
      followUp: [],
      confidence: 0.9,
      topic: 'farewell',
    };
  }

  // ===== NO MATCH =====
  return { answer: '', confidence: 0 };
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer                                                  */
/* ------------------------------------------------------------------ */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const processed: React.ReactNode[] = [];
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        processed.push(<strong key={j} className="font-bold">{part.slice(2, -2)}</strong>);
      } else {
        const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
        linkParts.forEach((lp, k) => {
          const linkMatch = lp.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            processed.push(
              <a key={`${j}-${k}`} href={linkMatch[2]} className="text-primary underline font-medium" target={linkMatch[2].startsWith('http') ? '_blank' : undefined}>
                {linkMatch[1]}
              </a>
            );
          } else {
            processed.push(lp);
          }
        });
      }
    });
    return <span key={i}>{processed}{i < lines.length - 1 && <br />}</span>;
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
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [userName, setUserName] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('bot');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [humanWaitStart, setHumanWaitStart] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [askingName, setAskingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [convContext, setConvContext] = useState<ConversationContext>({
    lastTopic: null,
    mentionedPersons: null,
    mentionedLocation: null,
    mentionedMonth: null,
    mentionedCaravan: null,
    askedQuestions: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch campings from DB (admin-managed)
  const [campings, setCampings] = useState<Camping[]>(staticCampings);
  useEffect(() => {
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch(() => {});
  }, []);
  const { locale } = useLanguage();
  const isNl = locale === 'nl';
  const isEs = locale === 'es';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  // Close chat on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen]);

  // Playful bubble after 5s, auto-dismiss after 8s
  useEffect(() => {
    if (bubbleDismissed || isOpen) return;
    const showTimer = setTimeout(() => setShowBubble(true), 5000);
    const hideTimer = setTimeout(() => { setShowBubble(false); setBubbleDismissed(true); }, 13000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [bubbleDismissed, isOpen]);

  // Init conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', locale }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) setConversationId(data.id);
          // If the customer is logged in, auto-fill their data
          if (data.customer) {
            setLoggedInCustomer(data.customer);
            setUserName(data.customer.name || '');
            setContactForm({
              name: data.customer.name || '',
              email: data.customer.email || '',
              phone: data.customer.phone || '',
            });
            const greeting = isNl
              ? `Hoi **${data.customer.name}**! 👋 Welkom terug!\n\nWaar kan ik je mee helpen? 😊`
              : isEs
              ? `¡Hola **${data.customer.name}**! 👋 ¡Bienvenido! ¿En qué puedo ayudarte? 😊`
              : `Hi **${data.customer.name}**! 👋 Welcome back! How can I help you? 😊`;
            setMessages([{
              id: '1', role: 'bot', text: greeting,
              quickReplies: isNl
                ? ['Wat kost het?', 'Welke caravans?', 'Hoe boek ik?', 'Welke campings?']
                : isEs ? ['¿Cuánto cuesta?', '¿Qué caravanas?', '¿Cómo reservo?']
                : ['What does it cost?', 'Which caravans?', 'How to book?'],
              timestamp: new Date(),
            }]);
          } else {
            // Ask for name first
            setAskingName(true);
            const askNameMsg = isNl
              ? 'Hoi! 👋 Welkom bij Caravanverhuur Spanje.\n\nWat is je naam? Dan kan ik je persoonlijk helpen! 😊'
              : isEs
              ? '¡Hola! 👋 Bienvenido. ¿Cómo te llamas? 😊'
              : "Hi! 👋 Welcome to Caravanverhuur Spanje.\n\nWhat's your name? So I can help you personally! 😊";
            setMessages([{
              id: '1', role: 'bot', text: askNameMsg,
              timestamp: new Date(),
            }]);
          }
        })
        .catch(() => {
          setAskingName(true);
          const askNameMsg = isNl
            ? 'Hoi! 👋 Welkom bij Caravanverhuur Spanje.\n\nWat is je naam? Dan kan ik je persoonlijk helpen! 😊'
            : isEs
            ? '¡Hola! 👋 Bienvenido. ¿Cómo te llamas? 😊'
            : "Hi! 👋 Welcome to Caravanverhuur Spanje.\n\nWhat's your name? So I can help you personally! 😊";
          setMessages([{
            id: '1', role: 'bot', text: askNameMsg,
            timestamp: new Date(),
          }]);
        });
    }
  }, [isOpen, locale, messages.length, isNl, isEs]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Poll for staff messages
  useEffect(() => {
    if ((chatMode === 'waiting-human' || chatMode === 'live-chat') && conversationId) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/chat?id=${conversationId}`);
          const data = await res.json();
          if (data.messages) {
            const staffMsgs = data.messages.filter((m: { role: string }) => m.role === 'staff');
            const currentStaffCount = messages.filter(m => m.role === 'staff').length;
            if (staffMsgs.length > currentStaffCount) {
              const newStaffMsgs = staffMsgs.slice(currentStaffCount);
              for (const msg of newStaffMsgs) {
                setMessages(prev => [...prev, {
                  id: msg.id,
                  role: 'staff' as const,
                  text: msg.message,
                  timestamp: new Date(msg.created_at),
                }]);
              }
              setChatMode('live-chat');
              setHumanWaitStart(null);
              if (!isOpen) setHasNewMessage(true);
            }
          }
          if (chatMode === 'waiting-human' && humanWaitStart) {
            if (Date.now() - humanWaitStart > 180_000) {
              setChatMode('leave-message');
              setShowContactForm(true);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'bot',
                text: isNl
                  ? 'Helaas is er op dit moment niemand beschikbaar. 😔\n\nLaat je gegevens achter en we nemen zo snel mogelijk contact met je op!'
                  : isEs
                  ? 'Lo siento, no hay nadie disponible. 😔\n\nDeja tus datos y te contactamos.'
                  : "Sorry, no one is available right now. 😔\n\nLeave your details and we'll get back to you!",
                timestamp: new Date(),
              }]);
            }
          }
        } catch { /* silent */ }
      }, 8000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [chatMode, conversationId, messages, humanWaitStart, isOpen, isNl, isEs]);

  const saveMessage = useCallback(async (role: string, message: string) => {
    if (!conversationId) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', conversationId, role, message }),
      });
    } catch { /* silent */ }
  }, [conversationId]);

  const handleNameSubmit = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    setContactForm(prev => ({ ...prev, name }));
    setAskingName(false);
    setNameInput('');

    // Save name to conversation
    if (conversationId) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateVisitor', conversationId, name }),
      }).catch(() => {});
    }

    // Show user's name as a message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: name,
      timestamp: new Date(),
    }]);

    // Show welcome message with quick replies
    setTimeout(() => {
      const welcome = isNl
        ? `Leuk je te ontmoeten, **${name}**! 😊\n\nWaar kan ik je mee helpen?`
        : isEs
        ? `¡Encantado, **${name}**! 😊 ¿En qué puedo ayudarte?`
        : `Nice to meet you, **${name}**! 😊\n\nHow can I help you?`;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: welcome,
        quickReplies: isNl
          ? ['Wat kost het?', 'Welke caravans?', 'Hoe boek ik?', 'Welke campings?']
          : isEs ? ['¿Cuánto cuesta?', '¿Qué caravanas?', '¿Cómo reservo?']
          : ['What does it cost?', 'Which caravans?', 'How to book?'],
        timestamp: new Date(),
      }]);
    }, 300);
  }, [nameInput, conversationId, isNl, isEs]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    saveMessage('user', trimmed);

    if (chatMode === 'live-chat' || chatMode === 'waiting-human') return;

    setIsTyping(true);
    setTimeout(() => {
      // Extract entities & update context
      const entities = extractEntities(trimmed);
      setConvContext(prev => ({
        lastTopic: prev.lastTopic,
        mentionedPersons: entities.persons || prev.mentionedPersons,
        mentionedLocation: entities.location || prev.mentionedLocation,
        mentionedMonth: entities.month || prev.mentionedMonth,
        mentionedCaravan: entities.caravanName || prev.mentionedCaravan,
        askedQuestions: [...prev.askedQuestions, trimmed],
      }));

      // Check for human request
      if (/medewerker|persoon|iemand|spreek|menselijk|echt|live|chat met|speak|talk|human|real|staff|person|hablar/.test(trimmed.toLowerCase())) {
        setChatMode('waiting-human');
        setHumanWaitStart(Date.now());
        if (conversationId) {
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'needsHuman', conversationId }),
          }).catch(() => {});
        }
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: isNl
            ? `${userName ? `Geen probleem, ${userName}! ` : ''}Ik verbind je door met een medewerker. Even geduld... 🔄\n\nEen collega neemt het zo van mij over. Je kunt alvast je vraag typen!`
            : isEs ? 'Te conecto con un empleado. Un momento... 🔄'
            : `${userName ? `No problem, ${userName}! ` : ''}Connecting you with a staff member... 🔄`,
          timestamp: new Date(),
        }]);
        setIsTyping(false);
        saveMessage('bot', 'Connecting to staff...');
        return;
      }

      const result = smartMatch(trimmed, locale as Locale, userName, convContext, messages, campings);

      // Update last topic in context
      if (result.topic) {
        setConvContext(prev => ({ ...prev, lastTopic: result.topic! }));
      }

      if (result.confidence === 0) {
        const fallback: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: isNl
            ? `Hmm${userName ? `, ${userName}` : ''}, dat snap ik niet helemaal. 🤔\n\nIk kan je helpen met:\n• Prijzen & boeken\n• Caravans & campings\n• Beschikbaarheid & seizoen\n• Tips & aanbevelingen\n\nKun je het anders formuleren? Of wil je met een medewerker praten?`
            : isEs ? 'Hmm, no lo entiendo. 🤔 ¿Puedes reformularlo?'
            : `Hmm${userName ? `, ${userName}` : ''}, I don't quite understand. 🤔\n\nCould you rephrase? Or talk to staff?`,
          quickReplies: isNl
            ? ['Spreek een medewerker', 'Wat kost het?', 'Hoe boek ik?', 'Welke caravans?', 'Welke campings?']
            : isEs ? ['Hablar con empleado', '¿Cuanto cuesta?', '¿Como reservo?']
            : ['Talk to staff', 'Cost?', 'How to book?', 'Which caravans?'],
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallback]);
        setIsTyping(false);
        saveMessage('bot', fallback.text);
        return;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: result.answer,
        quickReplies: result.followUp,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      saveMessage('bot', result.answer);
      if (!isOpen) setHasNewMessage(true);
    }, 500 + Math.random() * 500);
  }, [locale, isOpen, userName, chatMode, conversationId, saveMessage, isNl, isEs, convContext, messages]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

  const handleContactSubmit = async () => {
    if (!contactForm.name || (!contactForm.email && !contactForm.phone)) return;
    if (conversationId) {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateVisitor', conversationId, name: contactForm.name, email: contactForm.email, phone: contactForm.phone }),
      }).catch(() => {});
    }
    setShowContactForm(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'bot',
      text: isNl
        ? `Bedankt, ${contactForm.name}! ✅\n\nWe hebben je gegevens ontvangen en nemen zo snel mogelijk contact op via ${contactForm.email || contactForm.phone}.\n\nFijne dag! ☀️`
        : isEs ? `¡Gracias, ${contactForm.name}! ✅ Te contactaremos.`
        : `Thanks, ${contactForm.name}! ✅ We'll reach out via ${contactForm.email || contactForm.phone}.`,
      timestamp: new Date(),
    }]);
  };

  const bubbleTexts: Record<string, string> = {
    nl: 'Heb je een vraag? Ik help je graag! 💬',
    en: "Need help? I'm here for you! 💬",
    es: '¿Necesitas ayuda? ¡Estoy aqui! 💬',
  };

  const placeholders: Record<string, string> = {
    nl: chatMode === 'live-chat' ? 'Typ een bericht...' : 'Stel je vraag...',
    en: chatMode === 'live-chat' ? 'Type a message...' : 'Ask a question...',
    es: chatMode === 'live-chat' ? 'Escribe...' : 'Haz tu pregunta...',
  };

  return (
    <>
      {/* ===== CHAT WINDOW ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-[4.5rem] right-3 left-3 sm:left-auto sm:bottom-24 sm:right-5 z-[90] sm:w-[400px] h-[70vh] sm:h-[560px] max-h-[560px] sm:max-h-[75vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 shrink-0 rounded-t-2xl">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png" alt="Luna" width={28} height={28} className="object-contain sm:w-[30px] sm:h-[30px]" unoptimized />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[13px] sm:text-sm flex items-center gap-1.5">
                  {isNl ? 'Persoonlijke Assistent' : isEs ? 'Asistente Personal' : 'Personal Assistant'}
                  {chatMode === 'live-chat' && <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">Live</span>}
                </p>
                <p className="text-white/70 text-xs sm:text-xs">
                  {chatMode === 'waiting-human' ? (isNl ? 'Medewerker zoeken...' : 'Finding staff...')
                    : chatMode === 'live-chat' ? (isNl ? 'Je praat met een medewerker' : 'Talking to staff')
                    : 'Caravanverhuur Spanje'}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label={isNl ? 'Sluit chat' : isEs ? 'Cerrar chat' : 'Close chat'}>
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 bg-gray-50 overscroll-contain scroll-smooth">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && msg.role !== 'system' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2 mt-1">
                      {msg.role === 'staff' ? <User className="w-3 h-3 text-primary" /> : <Sparkles className="w-3 h-3 text-primary" />}
                    </div>
                  )}
                  <div className={`max-w-[85%] sm:max-w-[80%] ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-2xl rounded-br-sm px-3.5 sm:px-4 py-2 sm:py-2.5'
                    : msg.role === 'staff'
                    ? 'bg-blue-50 text-gray-800 rounded-2xl rounded-bl-sm px-3.5 sm:px-4 py-2 sm:py-2.5 border border-blue-200'
                    : msg.role === 'system'
                    ? 'bg-gray-200 text-gray-600 rounded-xl px-3 py-1.5 text-xs text-center w-full max-w-full'
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-gray-100'
                  }`}>
                    <div className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-line">{renderMarkdown(msg.text)}</div>
                    {msg.role !== 'system' && (
                      <p className={`text-[11px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick replies */}
              {messages.length > 0 && messages[messages.length - 1].role === 'bot' && messages[messages.length - 1].quickReplies && !isTyping && chatMode === 'bot' && (
                <div className="flex sm:flex-wrap gap-1.5 pt-1 pl-8 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-x-visible">
                  {messages[messages.length - 1].quickReplies!.map((qr, i) => (
                    <button key={i} onClick={() => sendMessage(qr)} className="px-3 py-2 sm:py-1.5 bg-white border border-primary/30 text-primary text-xs font-medium rounded-full hover:bg-primary/5 transition-colors active:scale-95 cursor-pointer whitespace-nowrap shrink-0 sm:shrink">
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* Contact form */}
              {showContactForm && (
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 space-y-2.5 sm:space-y-3">
                  <p className="text-xs sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {isNl ? 'Laat je gegevens achter' : isEs ? 'Deja tus datos' : 'Leave your details'}
                  </p>
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder={isNl ? 'Je naam *' : 'Your name *'} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-[13px] sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder={isNl ? 'E-mailadres' : 'Email address'} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-[13px] sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder={isNl ? 'Telefoonnummer' : 'Phone number'} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-[13px] sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                  </div>
                  <button onClick={handleContactSubmit} disabled={!contactForm.name || (!contactForm.email && !contactForm.phone)} className="w-full py-2.5 bg-primary text-white text-[13px] sm:text-sm font-semibold rounded-xl disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-all">
                    {isNl ? 'Versturen' : isEs ? 'Enviar' : 'Send'}
                  </button>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="w-3 h-3 text-primary" /></div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting indicator */}
              {chatMode === 'waiting-human' && !isTyping && (
                <div className="flex justify-center py-2">
                  <div className="bg-amber-50 text-amber-700 text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    {isNl ? 'Wachten op medewerker...' : isEs ? 'Esperando...' : 'Waiting for staff...'}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!showContactForm && askingName ? (
              <form onSubmit={(e) => { e.preventDefault(); handleNameSubmit(); }} className="shrink-0 bg-white border-t border-gray-100 px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center gap-2 safe-area-bottom">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder={isNl ? 'Je naam...' : isEs ? 'Tu nombre...' : 'Your name...'}
                    enterKeyHint="send"
                    autoComplete="name"
                    className="w-full bg-gray-50 rounded-full pl-9 pr-4 py-2.5 text-[16px] sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button type="submit" disabled={!nameInput.trim()} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-30 transition-opacity active:scale-90 cursor-pointer">
                  <Send size={16} />
                </button>
              </form>
            ) : !showContactForm && (
              <form onSubmit={handleSubmit} className="shrink-0 bg-white border-t border-gray-100 px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center gap-2 safe-area-bottom">
                <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={placeholders[locale] || placeholders.nl} enterKeyHint="send" autoComplete="off" className="flex-1 bg-gray-50 rounded-full px-3.5 sm:px-4 py-2.5 text-[16px] sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <button type="submit" disabled={!input.trim()} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-30 transition-opacity active:scale-90 cursor-pointer">
                  <Send size={16} />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PLAYFUL BUBBLE ===== */}
      <AnimatePresence>
        {showBubble && !isOpen && !bubbleDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-[5rem] right-[4.5rem] sm:bottom-[5.5rem] sm:right-24 z-[88] max-w-[200px] sm:max-w-[220px]"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 pr-8 relative">
              <button onClick={(e) => { e.stopPropagation(); setBubbleDismissed(true); setShowBubble(false); }} className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer">
                <X size={12} className="text-gray-500" />
              </button>
              <p className="text-[13px] sm:text-sm text-foreground font-medium leading-snug">{bubbleTexts[locale] || bubbleTexts.nl}</p>
              <div className="absolute -right-2 bottom-3 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-[-45deg]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FLOATING BUTTON (RIGHT CORNER) ===== */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        onClick={() => { setIsOpen(!isOpen); setHasNewMessage(false); setBubbleDismissed(true); setShowBubble(false); }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[89] w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer safe-area-fab ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-primary hover:scale-110 hover:shadow-xl'
        }`}
        aria-label={isOpen ? (isNl ? 'Sluit chat' : isEs ? 'Cerrar chat' : 'Close chat') : (isNl ? 'Open chat' : isEs ? 'Abrir chat' : 'Open chat')}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageCircle size={22} className="text-white" />
            {hasNewMessage && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
          </>
        )}
      </motion.button>

      <style jsx>{`
        .safe-area-bottom { padding-bottom: max(0.625rem, env(safe-area-inset-bottom)); }
        .safe-area-fab { margin-bottom: env(safe-area-inset-bottom, 0px); }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 639px) {
          .w-13 { width: 3.25rem; }
          .h-13 { height: 3.25rem; }
        }
      `}</style>
    </>
  );
}

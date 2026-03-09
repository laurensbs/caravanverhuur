'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown, User, Mail, Phone, Sparkles, CalendarDays, MapPin, Users, Minus, Plus, ArrowRight, Check, CreditCard, Tent } from 'lucide-react';
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

type BookingStep = 'dates' | 'camping' | 'persons' | 'caravan' | 'contact' | 'summary' | 'processing' | 'complete';

interface BookingFlowState {
  active: boolean;
  step: BookingStep;
  checkIn: string;
  checkOut: string;
  campingId: string;
  campingName: string;
  adults: number;
  children: number;
  caravanId: string;
  caravanName: string;
  name: string;
  email: string;
  phone: string;
  specialRequests: string;
  termsAccepted: boolean;
  discountCode: string;
  totalPrice: number;
  nights: number;
  bookingRef: string;
  paymentUrl: string;
  error: string;
}

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
/*  Pick random variation, avoiding recently used ones                  */
/* ------------------------------------------------------------------ */
function pick(variations: string[], askedQuestions: string[]): string {
  if (variations.length <= 1) return variations[0] || '';
  // Use conversation length as seed for variety
  const idx = (askedQuestions.length + Date.now()) % variations.length;
  return variations[idx];
}

/* ------------------------------------------------------------------ */
/*  Smart matching with context & response variation                   */
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
  const asked = ctx.askedQuestions;

  // Check if topic was already answered recently
  const recentTopics = messageHistory.slice(-8).filter(m => m.role === 'bot').map(m => m.text);
  const wasRecentlyAsked = (topic: string) => {
    if (!ctx.lastTopic) return false;
    return ctx.lastTopic === topic && messageHistory.length > 2;
  };

  // Merge context with current entities
  const persons = entities.persons || ctx.mentionedPersons;
  const location = entities.location || ctx.mentionedLocation;
  const month = entities.month || ctx.mentionedMonth;
  const caravanName = entities.caravanName || ctx.mentionedCaravan;

  // ===== GREETINGS =====
  if (/^(hoi|hey|hallo|hi|hello|goedemorgen|goedemiddag|goedenavond|hola|buenos|buenas|yo)\b/.test(lower)) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    const greetings = isNl ? [
      `Hoi${name}! 😊 Leuk dat je er bent! Waar kan ik je mee helpen?\n\nJe kunt me alles vragen over onze caravans, campings aan de Costa Brava, prijzen, beschikbaarheid of het boekingsproces.`,
      `${timeGreeting}${name}! 👋 Welkom bij Caravanverhuur Spanje!\n\nIk help je graag met alles rondom je caravanvakantie aan de Costa Brava. Stel gerust je vraag!`,
      `Hey${name}! 🌞 Wat leuk dat je langskom! Droom je al van de Costa Brava?\n\nVraag me alles over caravans, campings, prijzen of boeken — ik weet er alles van!`,
    ] : isEs ? [
      `¡Hola${name}! 😊 ¿En qué puedo ayudarte?`,
      `¡Bienvenido${name}! 🌞 ¿Qué te gustaría saber sobre nuestras caravanas?`,
    ] : [
      `Hi${name}! 😊 Great to have you here! What can I help you with?`,
      `Hello${name}! 🌞 Welcome! Ask me anything about our caravans on the Costa Brava!`,
    ];
    return {
      answer: pick(greetings, asked),
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
      const yesBooking = isNl ? [
        `Top${name}! 🎉 Ik kan je direct hier in de chat helpen met boeken!\n\nKlik op **"Ja, help me boeken!"** om te starten. Je kunt ook via onze **[boekingspagina](/boeken)** boeken.`,
        `Super${name}! 🙌 Laten we je boeking regelen!\n\nKlik hieronder om direct te starten, of ga naar **[de boekingspagina](/boeken)**.`,
      ] : [`Great${name}! 🎉 I can help you book right here in the chat!\n\nClick below to start.`];
      return {
        answer: pick(yesBooking, asked),
        followUp: isNl ? ['Ja, help me boeken!', 'Hoe werkt betalen?', 'Kan ik annuleren?'] : ['Yes, help me book!', 'How does payment work?'],
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
    if (ctx.lastTopic === 'family') {
      const biggest = caravans.reduce((a, b) => a.maxPersons > b.maxPersons ? a : b);
      return {
        answer: isNl
          ? `Voor gezinnen raad ik de **${biggest.name}** aan${name}! 👨‍👩‍👧‍👦\n\n👥 Max ${biggest.maxPersons} personen\n💰 €${biggest.pricePerWeek}/week\n\nCombineer met een familiecamping zoals **Cypsela Resort** (Pals) met zwembadcomplex!\n\n👉 **[Direct boeken](/boeken)**`
          : `For families I recommend the **${biggest.name}**! Book at [Book now](/boeken)`,
        followUp: isNl ? ['Hoe boek ik?', 'Wat zit erin?', 'Andere campings?'] : ['How to book?', "What's included?"],
        confidence: 0.9,
        topic: 'booking-redirect',
      };
    }
    if (ctx.lastTopic === 'couple') {
      return {
        answer: isNl
          ? `Goed idee${name}! 💕 Ga naar onze boekingspagina en kies een compacte caravan:\n\n👉 **[Direct boeken](/boeken)**\n\nTip: kies een camping bij Begur of Pals voor de mooiste verborgen baaien!`
          : `Great choice${name}! 💕 Book at [Book now](/boeken)`,
        followUp: isNl ? ['Campings in Begur', 'Campings in Pals', 'Wat kost het?'] : ['Campings in Begur', 'Cost?'],
        confidence: 0.9,
        topic: 'booking-redirect',
      };
    }
    // Generic yes
    return {
      answer: isNl
        ? `Fijn${name}! 👍 Zal ik je doorverwijzen naar het boeken, of heb je nog andere vragen?`
        : `Great${name}! 👍 Shall I direct you to booking?`,
      followUp: isNl ? ['Ja, naar boeken!', 'Nog een vraag', 'Nee, bedankt'] : ['Yes, book!', 'Another question'],
      confidence: 0.85,
      topic: 'other',
    };
  }

  if (entities.isNo && ctx.lastTopic) {
    const noResponses = isNl ? [
      `Geen probleem${name}! Is er iets anders waar ik je mee kan helpen? 😊`,
      `Oké${name}, geen punt! 😊 Waar kan ik je wél mee helpen?`,
      `Prima${name}! Mocht je later nog vragen hebben, ik ben er altijd! 😊`,
    ] : isEs ? [`¡No hay problema${name}! ¿Algo más?`] : [`No problem${name}! Anything else? 😊`];
    return {
      answer: pick(noResponses, asked),
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
      const intros = [
        `${userName ? `Goed nieuws, ${userName}` : 'Goed nieuws'}! 🎉\n\n`,
        `${userName ? `Ik heb wat opties voor je, ${userName}` : 'Hier zijn je opties'}! ✨\n\n`,
        `${userName ? `Even kijken, ${userName}` : 'Even kijken'}... gevonden! 🔍\n\n`,
      ];
      answer = pick(intros, asked);

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
    const caravanAnswers = isNl ? [
      `De **${caravan.name}** is een ${caravan.type === 'FAMILIE' ? 'ruime familie' : 'compacte'}caravan (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Max **${caravan.maxPersons} personen**\n💰 €${caravan.pricePerDay}/dag · €${caravan.pricePerWeek}/week\n🔒 Borg: €${caravan.deposit}\n\n🔧 **Uitrusting**: ${caravan.amenities.join(', ')}\n\n📝 ${caravan.description}\n\n👉 **[Bekijk details](/caravans/${caravan.id})**`,
      `Goede keuze${name}! De **${caravan.name}** is ${caravan.type === 'FAMILIE' ? 'onze ruimste familiecaravan' : 'een heerlijk compacte caravan'}! ✨\n\n🏷️ ${caravan.manufacturer} (${caravan.year})\n👥 Plek voor **${caravan.maxPersons} personen**\n💰 Vanaf **€${caravan.pricePerDay}/dag** of **€${caravan.pricePerWeek}/week**\n\n${caravan.amenities.some(a => a.toLowerCase().includes('airco')) ? '❄️ **Met airco** — heerlijk in de zomer!' : ''}\n\n👉 **[Bekijk alle details & foto\'s](/caravans/${caravan.id})**`,
    ] : isEs ? [
      `La **${caravan.name}** (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Máx **${caravan.maxPersons} personas**\n💰 €${caravan.pricePerDay}/día · €${caravan.pricePerWeek}/semana\n\n👉 **[Ver detalles](/caravans/${caravan.id})**`,
    ] : [
      `The **${caravan.name}** (${caravan.manufacturer}, ${caravan.year}):\n\n👥 Max **${caravan.maxPersons} people**\n💰 €${caravan.pricePerDay}/day · €${caravan.pricePerWeek}/week\n\n👉 **[View details](/caravans/${caravan.id})**`,
    ];
    return {
      answer: pick(caravanAnswers, asked),
      followUp: isNl ? ['Hoe boek ik deze?', 'Andere caravans?', 'Welke campings?'] : ['How to book?', 'Other caravans?'],
      confidence: 0.9,
      topic: 'specific-caravan',
    };
  }

  // ===== PRICING =====
  if (/prijs|kosten|kost|tarief|goedkoop|duur|euro|bedrag|per dag|per week|price|cost|cheap|rate|precio|cuesta|tarifa|hoeveel|budget/.test(lower)) {
    const cheapest = caravans.reduce((a, b) => a.pricePerWeek < b.pricePerWeek ? a : b);
    const pricingAnswers = isNl ? [
      `Onze prijzen${name}:\n\n${caravans.map(c => {
        const airco = c.amenities.some(a => a.toLowerCase().includes('airco')) ? ' ❄️' : '';
        return `🚐 **${c.name}**${airco}\n   €${c.pricePerDay}/dag · €${c.pricePerWeek}/week · max ${c.maxPersons} pers`;
      }).join('\n\n')}\n\n💡 Tip: de **${cheapest.name}** is onze voordeligste optie!\n\nBij een weekboeking profiteer je van extra korting. Wil je meer weten over de betaling?`,
      `Dit zijn onze tarieven${name}! 💰\n\n${caravans.map(c => {
        const airco = c.amenities.some(a => a.toLowerCase().includes('airco')) ? ' (met airco!)' : '';
        return `🚐 **${c.name}**${airco} — €${c.pricePerDay}/dag of €${c.pricePerWeek}/week`;
      }).join('\n')}\n\n🔑 Alles is **volledig ingericht** — beddengoed, servies, kookgerei erbij!\n\nDe prijzen zijn inclusief inventaris. Enige extra kosten: campingplaats (apart bij de camping).\n\nZal ik je helpen kiezen?`,
      `Goed dat je het vraagt${name}! Hier zijn de prijzen:\n\n${caravans.map(c => `💶 **${c.name}** → €${c.pricePerDay}/dag · €${c.pricePerWeek}/week (max ${c.maxPersons} pers)`).join('\n')}\n\n🏷️ Tip: de **${cheapest.name}** start al vanaf €${cheapest.pricePerDay}/dag — ideaal voor budget-bewuste reizigers!\n\n👉 **[Bekijk alle caravans](/caravans)**`,
    ] : isEs ? [
      `Nuestros precios:\n\n${caravans.map(c => `🚐 **${c.name}** — €${c.pricePerDay}/día · €${c.pricePerWeek}/semana`).join('\n')}`,
    ] : [
      `Our prices:\n\n${caravans.map(c => `🚐 **${c.name}** — €${c.pricePerDay}/day · €${c.pricePerWeek}/week`).join('\n')}`,
    ];
    return {
      answer: pick(pricingAnswers, asked),
      followUp: isNl ? ['Ja, hoe werkt betalen?', 'Hoe boek ik?', 'Welke caravans?'] : ['How does payment work?', 'How to book?'],
      confidence: 0.9,
      topic: 'pricing',
    };
  }

  // ===== BOOKING =====
  if (/boek|reserv|aanvraag|hoe.*boek|how.*book|reservar|como reserv|help.*boeken|wil.*boeken|wil.*huren|huren|vastleggen|inschrijv|aanmelden|vastgelegd|kan ik.*huren|ik wil.*huren|wil graag|graag boeken|graag huren|boeking maken|hoe werkt.*boek|stappen|hoe gaat.*boek|hoe kan ik|boeking|booking|how does.*book|i want.*book|i.d like|make.*reservation/.test(lower)) {
    const bookingAnswers = isNl ? [
      `Boeken is heel eenvoudig${name}! 🎉\n\n1️⃣ Kies je datum\n2️⃣ Selecteer je camping\n3️⃣ Kies een caravan\n4️⃣ Vul je gegevens in\n5️⃣ Betaal via iDEAL/Wero\n\nJe kunt dit direct hier in de chat doen, of via onze **[boekingspagina](/boeken)**.\n\nWil je nu boeken? Klik dan op **"Ja, help me boeken!"** 👇`,
      `Het boekingsproces is super simpel${name}! ✨\n\nJe kiest je caravan en camping, selecteert je data en betaalt slechts **30% aanbetaling**. Klaar!\n\nDe rest betaal je uiterlijk 30 dagen voor vertrek.\n\n⏱️ Het hele proces duurt nog geen 5 minuten.\n📧 Je krijgt meteen een bevestiging per mail.\n\nIk kan je ook **direct hier in de chat** helpen met boeken! 💬`,
      `Wil je boeken${name}? Dat kan in een paar stappen! 🚀\n\n🚐 Kies je favoriete caravan\n📍 Selecteer een camping\n📅 Kies je periode\n💳 Betaal de aanbetaling\n\nIk kan je **hier in de chat** door het hele boekingsproces begeleiden. Wil je dat? 😊`,
    ] : isEs ? [
      `¡Reservar es muy fácil! 🎉\n\n¡Puedo ayudarte directamente aquí en el chat!\n\n👉 Haz clic en **"¡Sí, ayúdame!"** abajo.`,
    ] : [
      `Booking is super easy${name}! 🎉\n\nI can help you book right here in the chat!\n\nClick **"Yes, help me book!"** below to get started.`,
    ];
    return {
      answer: pick(bookingAnswers, asked),
      followUp: isNl ? ['Ja, help me boeken!', 'Wat kost het?', 'Kan ik annuleren?'] : isEs ? ['¡Sí, ayúdame!', '¿Cuánto cuesta?'] : ['Yes, help me book!', 'Cost?', 'Can I cancel?'],
      confidence: 0.9,
      topic: 'booking',
    };
  }

  // ===== CANCELLATION =====
  if (/annul|terug|geld terug|restitutie|cancel|refund|money back|cancelar|reembols|afzeggen|niet doorgaan|toch niet|omboek|wijzig|verander|change|modify|umbuch|niet kunnen komen|verhinderd|ziek/.test(lower)) {
    const cancelAnswers = isNl ? [
      `Ja${name}, annuleren is mogelijk:\n\n✅ **30+ dagen** voor aankomst → 100% terug\n⚠️ **14-30 dagen** → 50% terug\n❌ **< 14 dagen** → niet restitueerbaar\n\nZie onze [Algemene Voorwaarden](/voorwaarden) voor alle details.\n\nWe raden altijd een reis- of annuleringsverzekering aan!`,
      `Natuurlijk${name}, er is een flexibele annuleringsregeling:\n\n📋 **Meer dan 30 dagen** voor aankomst? → **Volledig terugbetaald!**\n📋 **14 tot 30 dagen** → 50% terug\n📋 **Minder dan 14 dagen** → helaas geen restitutie\n\n💡 Tip: neem een **annuleringsverzekering** voor extra zekerheid.\n\nAlle details vind je bij onze [Voorwaarden](/voorwaarden).`,
    ] : isEs ? ['Sí, es posible cancelar:\n\n✅ **30+ días** → 100% reembolso\n⚠️ **14-30 días** → 50%\n❌ **< 14 días** → no reembolsable']
    : ['Yes, cancellation is possible:\n\n✅ **30+ days** → 100% refund\n⚠️ **14-30 days** → 50%\n❌ **< 14 days** → non-refundable'];
    return {
      answer: pick(cancelAnswers, asked),
      followUp: isNl ? ['Hoe boek ik?', 'Hoe werkt de borg?', 'Welke voorwaarden?'] : ['How to book?', 'Deposit info?'],
      confidence: 0.85,
      topic: 'cancellation',
    };
  }

  // ===== DEPOSIT/BORG =====
  if (/borg|waarborg|deposit|garantia|fianza|waarborgsom|borgsom|borggeld|borg terug|borg betalen|security deposit|garantie|cautie|schade|damage|kapot|beschadigd|iets stuk/.test(lower)) {
    const depositAnswers = isNl ? [
      `De borg werkt zo${name}:\n\n🔒 Bij aankomst wordt **€250 – €500** gereserveerd via iDEAL/Wero (afhankelijk van de caravan)\n✅ Na inspectie bij vertrek zonder schade: terugstorting binnen **7 dagen**\n\nPer caravan:\n${caravans.map(c => `• **${c.name}** → €${c.deposit} borg`).join('\n')}\n\nDe borg is geen extra kosten, maar een waarborg die je gewoon terugkrijgt!\n\n❓ **Bij schade?**\nKleine slijtage is normaal en wordt niet verrekend. Bij echte schade wordt het schadebedrag van de borg afgetrokken en de rest teruggestort.`,
      `Goede vraag${name}! De borg is een **tijdelijke reservering** — je krijgt het gewoon terug! 🔄\n\n${caravans.map(c => `🚐 **${c.name}** → €${c.deposit}`).join('\n')}\n\n✅ Je krijgt het binnen **7 werkdagen** terug na de inspectie.\n⚡ Betaling via **iDEAL/Wero** — snel en veilig.\n\n💡 **Tips om je borg 100% terug te krijgen:**\n🧹 Caravan bezemschoon achterlaten\n🗑️ Vuilnis meenemen naar container\n🧊 Koelkast leegmaken\n🍽️ Afwas doen\n\nBij overmatige schade of vermissing van inventaris kan een deel worden ingehouden, maar dat komt zelden voor!`,
      `De borg regeling in het kort${name}:\n\n💰 **Bedrag**: €250-€500 (afhankelijk van caravan)\n💳 **Betaling**: via iDEAL/Wero bij aankomst op de camping\n🔄 **Terugbetaling**: binnen 7 werkdagen na inspectie\n\n✅ **Geen schade** → volledige borg terug\n⚠️ **Kleine schade** → schadebedrag wordt ingehouden, rest terug\n❌ **Grote schade** → borg (deels) ingehouden + eventueel extra kosten\n\nMaak je niet te druk — normale slijtage telt niet! De meeste gasten krijgen hun borg **volledig** terug. 😊`,
    ] : ['A deposit of **€250 – €500** is reserved upon arrival. Refunded within **7 days** if no damage.'];
    return {
      answer: pick(depositAnswers, asked),
      followUp: isNl ? ['Kan ik annuleren?', 'Wat zit erin?', 'Hoe boek ik?'] : ['Can I cancel?', "What's included?"],
      confidence: 0.85,
      topic: 'deposit',
    };
  }

  // ===== PAYMENT =====
  if (/betaal|ideal|wero|aanbetaling|betaalmethod|payment|pay method|pago|metodo de pago|betaling|creditcard|pinnen|hoe betaal|wanneer betalen|hoeveel betalen|overmaken|overboeking|factuur|rekening|contant|cash|bancontact|visa|mastercard|tikkie/.test(lower)) {
    const paymentAnswers = isNl ? [
      `Alle betalingen verlopen veilig via **iDEAL/Wero**${name}:\n\n1️⃣ **Aanbetaling**: 30% bij boeking\n2️⃣ **Restbedrag**: 70% uiterlijk 1 week voor aankomst\n3️⃣ **Borg**: reservering bij aankomst op de camping\n\n🔒 Veilig, snel en vertrouwd!\n\nNa betaling ontvang je direct een bevestigingsmail met alle details.`,
      `We werken met **iDEAL en Wero**${name} — veilig en snel! 🔐\n\nZo werkt het:\n💳 **Stap 1**: 30% aanbetaling bij je boeking\n💳 **Stap 2**: 70% restbedrag uiterlijk 1 week voor vertrek\n🔒 **Stap 3**: Borg (€250-€500) bij aankomst\n\nGeen creditcard nodig! Na elke betaling krijg je een bevestiging per e-mail.`,
    ] : ['Payments via **iDEAL/Wero**:\n\n1. **Deposit**: 30% at booking\n2. **Remainder**: 70% due 1 week before\n3. **Security**: reserved on arrival'];
    return {
      answer: pick(paymentAnswers, asked),
      followUp: isNl ? ['Hoe boek ik?', 'Hoe werkt de borg?', 'Kan ik annuleren?'] : ['How to book?', 'Deposit info?'],
      confidence: 0.85,
      topic: 'payment',
    };
  }

  // ===== CAMPINGS / LOCATIONS =====
  if (/camping|locatie|waar|welke camping|plek|plekken|location|where|which camping|ubicacion|donde|bestemming|welke plek|waar staan|waar staat|standplaats|welke locatie|welke plaatsen|places|welke plekken|welke bestemmingen|welke dorpen|welke steden|in de buurt|dichtbij|welke regio/.test(lower)) {
    const campingAnswers = isNl ? [
      `We werken samen met **30+ campings** over de hele Costa Brava${name}! 🏖️\n\n📍 **Baix Empordà** — Pals, Begur, Calella\n📍 **Alt Empordà** — Roses, L'Estartit, Empuriabrava\n📍 **La Selva** — Lloret de Mar, Blanes, Tossa\n📍 **Costa Brava Zuid** — Platja d'Aro, Calonge, Santa Cristina d'Aro\n\nPopulaire campings:\n⛺ Cypsela Resort (Pals) — 5 sterren, direct aan strand\n⛺ La Ballena Alegre (Sant Pere) — breed zandstrand\n⛺ Cala Gogo (Calonge) — uitgebreide faciliteiten\n\n👉 Bekijk alles op onze [bestemmingen pagina](/bestemmingen)!\n\nHeb je een voorkeur voor een regio?`,
      `Wij zijn actief op **30+ campings** langs de mooiste Costa Brava kust${name}! 🌊\n\nEen paar toppers:\n\n⭐ **Cypsela Resort** (Pals) — luxe 5-sterren, direct aan strand\n⭐ **La Ballena Alegre** (Sant Pere) — groot, gezellig, mooi strand\n⭐ **Cala Gogo** (Calonge) — zwembaden, animatie, familievriendelijk\n⭐ **Tucan** (Lloret) — waterpark voor de kids!\n\nVan rustige familieplekjes tot bruisende resorts — wij hebben het.\n\n👉 Ontdek alle locaties op onze [bestemmingen pagina](/bestemmingen)\n\nIn welke regio ben je geïnteresseerd?`,
    ] : isEs ? ['Colaboramos con **más de 30 campings** en toda la Costa Brava! 🏖️\n\nConsulta nuestros [destinos](/bestemmingen).']
    : ['We partner with **30+ campings** across the Costa Brava! 🏖️\n\nCheck our [destinations page](/bestemmingen)!'];
    return {
      answer: pick(campingAnswers, asked),
      followUp: isNl ? ['Campings in Pals', 'Campings in Roses', 'Campings in Lloret', 'Welke caravans?'] : ['Campings in Pals', 'Campings in Roses'],
      confidence: 0.85,
      topic: 'campings',
    };
  }

  // ===== CARAVANS =====
  if (/caravan|welke.*caravan|type|model|which.*caravan|que caravana|overzicht|aanbod|camper|stacaravan|mobilhome|mobile home|welke wagens|hoeveel personen|hoeveel slaapplaats|slaapplaats|slaapplek|hoe groot|formaat|afmeting|lengte caravan/.test(lower)) {
    const caravanAnswers = isNl ? [
      `We hebben **${caravans.length} caravans** beschikbaar${name}:\n\n${caravans.map(c => {
        const highlights: string[] = [];
        if (c.amenities.some(a => a.toLowerCase().includes('airco'))) highlights.push('❄️ Airco');
        if (c.amenities.some(a => a.toLowerCase().includes('douche'))) highlights.push('🚿 Douche');
        if (c.amenities.some(a => a.toLowerCase().includes('voortent'))) highlights.push('⛺ Voortent');
        return `🚐 **${c.name}** (${c.type === 'FAMILIE' ? 'Familie' : 'Compact'})\n   Max ${c.maxPersons} pers · €${c.pricePerDay}/dag · €${c.pricePerWeek}/week\n   ${highlights.join(' · ')}`;
      }).join('\n\n')}\n\n👉 [Bekijk alle caravans](/caravans)\n\nWil je meer weten over een specifieke caravan?`,
      `Hier is ons aanbod${name}! 🚐\n\n${caravans.map(c => {
        const typeLabel = c.type === 'FAMILIE' ? '👨‍👩‍👧‍👦 Familie' : '💑 Compact';
        return `**${c.name}** — ${typeLabel}\n   ${c.maxPersons} pers · €${c.pricePerWeek}/week · ${c.amenities.slice(0, 3).join(', ')}`;
      }).join('\n\n')}\n\nElke caravan is **compleet uitgerust** met beddengoed, servies, kookgerei en meer!\n\n👉 [Alle details & foto's](/caravans)`,
    ] : isEs ? [`Tenemos **${caravans.length} caravanas**:\n\n${caravans.map(c => `🚐 **${c.name}** — máx ${c.maxPersons} pers · €${c.pricePerDay}/día`).join('\n\n')}\n\n👉 [Ver caravanas](/caravans)`]
    : [`We have **${caravans.length} caravans**:\n\n${caravans.map(c => `🚐 **${c.name}** — max ${c.maxPersons} people · €${c.pricePerDay}/day`).join('\n\n')}\n\n👉 [View caravans](/caravans)`];
    return {
      answer: pick(caravanAnswers, asked),
      followUp: isNl ? ['Vertel meer over de Knaus', 'Vertel meer over de HomeCar', 'Wat kost het?', 'Hoe boek ik?'] : ['Tell me about Knaus', 'Cost?'],
      confidence: 0.85,
      topic: 'caravans',
    };
  }

  // ===== AIRCO =====
  if (/airco|airconditioning|koeling|warm|heet|temperatuur|koel/.test(lower)) {
    const withAirco = caravans.filter(c => c.amenities.some(a => a.toLowerCase().includes('airco')));
    const aircoAnswers = isNl ? [
      `Goede vraag${name}! In de zomermaanden kan het flink warm worden aan de Costa Brava. ☀️\n\n${withAirco.length > 0
        ? `De volgende caravan${withAirco.length > 1 ? 's hebben' : ' heeft'} **airco**:\n\n${withAirco.map(c => `❄️ **${c.name}** — €${c.pricePerWeek}/week`).join('\n')}\n\nDe andere caravans hebben goede ventilatie en luifels voor schaduw.`
        : 'Op dit moment heeft geen van onze caravans airco, maar ze hebben wel goede ventilatie.'}`,
      `Bij 30°C+ wil je airco${name}! ☀️🥵\n\n${withAirco.length > 0
        ? `Deze caravan${withAirco.length > 1 ? 's zijn' : ' is'} voorzien van **airconditioning**:\n\n${withAirco.map(c => `❄️ **${c.name}** — max ${c.maxPersons} pers · €${c.pricePerWeek}/week`).join('\n')}\n\n💡 Onze tip: in juli/augustus is airco echt een aanrader aan de Costa Brava!\n\nDe caravans zonder airco hebben wél goede ventilatie, luifels en rolgordijnen.`
        : 'Helaas, momenteel hebben onze caravans geen airco. Wél goede ventilatie en luifels!'}`,
    ] : [`The **${withAirco.map(c => c.name).join(', ')}** ${withAirco.length > 1 ? 'have' : 'has'} air conditioning.`];
    return {
      answer: pick(aircoAnswers, asked),
      followUp: isNl ? ['Vertel meer over de HomeCar', 'Welke caravans?', 'Hoe boek ik?'] : ['Tell me about HomeCar', 'How to book?'],
      confidence: 0.85,
      topic: 'airco',
    };
  }

  // ===== INVENTORY / INCLUDED =====
  if (/inventaris|inbegrepen|wat zit|uitrusting|beddengoed|servies|kookgerei|handdoek|included|equipment|inventory|meenemen|paklijst/.test(lower)) {
    const inventoryAnswers = isNl ? [
      `Elke caravan is **compleet uitgerust**${name}:\n\n🛏️ Dekbedden & kussens\n🍽️ Volledig servies & kookgerei\n🧹 Schoonmaakmiddelen\n🪥 Handdoeken & toiletpapier\n🪟 Rolgordijnen & horren\n⛺ Luifel & grondzeil (bij de meeste)\n\nSommige caravans hebben ook:\n❄️ Airco\n⛺ Voortent\n🚿 Douche & toilet\n\n💡 Je hoeft eigenlijk alleen je kleding en persoonlijke spullen mee te nemen!`,
      `Alles zit erin${name}! Je hoeft bijna niks mee te nemen 🎒\n\n✅ **Slapen**: dekbedden, kussens, lakens\n✅ **Koken**: pannen, borden, bestek, kookgerei\n✅ **Badkamer**: handdoeken, toiletpapier\n✅ **Comfort**: rolgordijnen, horren, luifel\n✅ **Schoonmaak**: bezem, vaatdoekjes, afwasmiddel\n\nSommige caravans hebben zelfs een **eigen douche, toilet en airco**!\n\n🧳 Neem alleen kleding, zonnebrand en je goede humeur mee! 😄`,
    ] : ['Every caravan comes **fully equipped** with duvets, tableware, cleaning supplies, towels, and more!'];
    return {
      answer: pick(inventoryAnswers, asked),
      followUp: isNl ? ['Welke caravans?', 'Wat kost het?', 'Hoe boek ik?'] : ['Which caravans?', 'Cost?'],
      confidence: 0.85,
      topic: 'inventory',
    };
  }

  // ===== CHECK-IN/CHECK-OUT =====
  if (/klaar|opbouw|plaatsen|inchecken|check.?in|check.?out|uitchecken|aankomst|arrival|ready|setup|hoe laat|wat tijd|ophalen|afhalen/.test(lower)) {
    const checkinAnswers = isNl ? [
      `Het mooie van ons concept${name}: de caravan staat **al op de camping**! 🎉\n\nSchoongemaakt, ingericht en klaar om in te checken.\n\n⏰ **Check-in**: vanaf **15:00 uur**\n⏰ **Check-out**: voor **11:00 uur**\n\nAfwijkende check-in/out tijden zijn in overleg vaak mogelijk. Heb je een vroege of late aankomst?`,
      `Geen gedoe met opbouwen${name}! De caravan is **startklaar** als je aankomt. 🏕️\n\n📍 Je rijdt naar de camping, meldt je aan bij de receptie, en loopt naar je caravan.\n⏰ Check-in vanaf **15:00**, check-out vóór **11:00**.\n\nAlles is schoongemaakt, opgemaakt en voorzien van inventaris. Uitstappen en genieten!\n\n💡 Vroege aankomst of laat vertrek? Overleg is vaak mogelijk!`,
    ] : ['The caravan is **already on the camping**, cleaned and set up! 🎉\n\n⏰ **Check-in** from 15:00\n⏰ **Check-out** before 11:00'];
    return {
      answer: pick(checkinAnswers, asked),
      followUp: isNl ? ['Wat zit erin?', 'Hoe werkt vertrek?', 'Welke campings?'] : ["What's included?", 'Which campings?'],
      confidence: 0.85,
      topic: 'checkin',
    };
  }

  // ===== CLEANING / DEPARTURE =====
  if (/schoonma|opruim|vertrek|achterlaten|clean|tidy|departure|bij vertrek|hoe vertrek/.test(lower)) {
    const cleanAnswers = isNl ? [
      `Bij vertrek vragen we je de caravan **bezemschoon** achter te laten${name}:\n\n✅ Afwas doen\n✅ Vuilnis meenemen naar container\n✅ Vloer aanvegen\n✅ Koelkast leegmaken\n\n🧹 De dieptereiniging doen wij! Daar hoef je je geen zorgen over te maken.\n\nNa onze inspectie ontvang je de borg binnen 7 dagen terug.`,
      `Het vertrek is heel relaxed${name}! 😌\n\nWe vragen alleen het basale:\n🧹 Vloer even vegen\n🍽️ Afwas gedaan\n🗑️ Vuilnis naar de container\n🧊 Koelkast leeg\n\nDe **grondige schoonmaak** regelen wij — dat hoef jij niet te doen!\n\n✅ Na inspectie borg binnen 7 dagen terug.`,
    ] : ['Please leave the caravan **broom clean**. Deep cleaning is on us! 🧹'];
    return {
      answer: pick(cleanAnswers, asked),
      followUp: isNl ? ['Hoe werkt de borg?', 'Hoe laat check-out?'] : ['Deposit info?', 'Check-out time?'],
      confidence: 0.85,
      topic: 'cleaning',
    };
  }

  // ===== PETS =====
  if (/huisdier|hond|kat|dier|pet|dog|cat|animal|mascota|perro|gato|viervoeter|poes|puppy|kitten|dieren mee|hond mee|kat mee|beest|huisdieren toegestaan|mag.*hond|mag.*kat|mag.*dier|honden welkom|dieren welkom|huisdierbeleid|met de hond|met mijn hond|met onze hond|viervoeters/.test(lower)) {
    const petAnswers = isNl ? [
      `Huisdieren zijn mogelijk afhankelijk van de camping en caravan${name}. 🐕\n\nBij sommige campings is het toegestaan (soms tegen een kleine toeslag). Neem contact met ons op zodat we dit voor je kunnen uitzoeken!\n\n📌 **Belangrijk om te weten:**\n• Niet alle campings staan huisdieren toe\n• Sommige campings rekenen €3-€5/dag extra\n• Honden moeten vaak aangelijnd zijn\n• Informeer altijd vooraf bij ons!\n\nWil je dat ik je doorverbind met een medewerker die het precies kan uitzoeken?`,
      `Wil je je viervoeter meenemen${name}? 🐾\n\nDat verschilt per camping:\n✅ Sommige campings staan huisdieren toe\n💰 Soms geldt een kleine dagelijkse toeslag (€3-€5/dag)\n⚠️ Niet alle campings accepteren huisdieren\n🐕 Honden moeten meestal aangelijnd zijn op de camping\n\nHet hangt ook af van de caravan en het campingbeleid.\n\n💡 **Tip**: laat ons het even voor je uitzoeken! Wij weten precies welke campings huisdiervriendelijk zijn.\n\nZal ik je doorverbinden met een medewerker?`,
      `Goeie vraag${name}! 🐶\n\nHuisdieren meenemen is op veel campings mogelijk, maar niet overal:\n\n🐕 **Honden** — vaak welkom, soms met toeslag\n🐱 **Katten** — minder gebruikelijk maar soms mogelijk\n📋 **Regels** — variëren per camping (aanlijnen, max. aantal)\n💰 **Kosten** — €0 tot €5 per dag\n\nWij zoeken graag een **huisdiervriendelijke camping** voor je uit! Vertel me welke regio je voorkeur heeft, dan kijk ik wat er mogelijk is.\n\nOf wil je direct met een medewerker spreken?`,
    ] : ['Pets may be allowed depending on the camping. Contact us to discuss! 🐕'];
    return {
      answer: pick(petAnswers, asked),
      followUp: isNl ? ['Spreek een medewerker', 'Welke campings?', 'Hoe boek ik?'] : ['Talk to staff', 'Which campings?'],
      confidence: 0.85,
      topic: 'pets',
    };
  }

  // ===== WIFI / ELECTRICITY =====
  if (/wifi|internet|elektriciteit|stroom|gas|water|electricity|oplaad/.test(lower)) {
    const wifiAnswers = isNl ? [
      `Goede vraag${name}! Hier is de info over voorzieningen:\n\n⚡ **Elektriciteit** — inbegrepen bij de campingplaats\n⛽ **Gas** — aanwezig voor koken\n📶 **WiFi** — beschikbaar op de meeste campings (soms gratis, soms tegen toeslag)\n💧 **Water** — op alle campings aanwezig\n🔌 **Oplaadpunten** — stopcontacten in de caravan\n\nDe campings hebben ook sanitairgebouwen, winkels en vaak restaurants!`,
      `Alle basis-voorzieningen zijn geregeld${name}! 👍\n\n⚡ Stroom: inbegrepen bij de campingplaats\n📶 WiFi: op bijna alle campings (gratis of kleine toeslag)\n⛽ Gasfles: aanwezig voor koken\n💧 Water: altijd beschikbaar\n🔌 Stopcontacten: in de caravan\n\nPlus: de meeste campings hebben een supermarkt, sanitair, zwembad en restaurant op het terrein!`,
    ] : ['Electricity included, gas provided, WiFi on most campings, water on all sites.'];
    return {
      answer: pick(wifiAnswers, asked),
      followUp: isNl ? ['Welke campings?', 'Wat zit erin?', 'Hoe boek ik?'] : ['Which campings?', "What's included?"],
      confidence: 0.8,
      topic: 'facilities',
    };
  }

  // ===== SEASON / AVAILABILITY =====
  if (/seizoen|2026|wanneer|periode|beschikbaar|datum|zomer|season|when|available|summer|temporada|cuando|welke maanden|nog beschikbaar|nog plek|nog vrij|vrij|vrije plek|plek vrij|is er nog|availability|openstaand|beschikbaarheid|kan ik nog|zijn er nog|nog iets vrij|wanneer kan|welke data|welke periode|welke weken/.test(lower)) {
    const seasonAnswers = isNl ? [
      `☀️ **Seizoen 2026** loopt van **mei t/m september**${name}!\n\nHoogseizoen (juli/augustus) is het populairst, dus boek op tijd!\n📅 Tussei-/laagseizoen (mei, juni, september) geeft vaak betere tarieven en meer rust.\n\nMomenteel is alles nog beschikbaar. Wil je voor een bepaalde maand kijken?\n\n👉 **[Direct boeken](/boeken)**`,
      `Ons seizoen is van **mei tot en met september** 2026${name}! 🌞\n\n📅 **Mei/Juni** — rustig, aangenaam weer, lagere prijzen\n📅 **Juli/Augustus** — hoogseizoen, warmst, het populairst\n📅 **September** — heerlijk nazomeren, rustig op de campings\n\n💡 Tip: juni en september zijn ideaal voor wie rust wil + mooi weer!\n\nWanneer dacht je te gaan?`,
    ] : ['☀️ **Season 2026** runs from **May to September**. Book early!'];
    return {
      answer: pick(seasonAnswers, asked),
      followUp: isNl ? ['Hoe boek ik?', 'Wat kost het?', 'Welke caravans?'] : ['How to book?', 'Cost?'],
      confidence: 0.85,
      topic: 'season',
    };
  }

  // ===== VACATION / HOLIDAY =====
  if (/vakantie|holiday|vacation|op reis|reizen|travel|viaje|vacaciones|weekendje|uitje/.test(lower)) {
    const vacationAnswers = isNl ? [
      `Droom je van een heerlijke vakantie aan de Costa Brava${name}? ☀️🏖️\n\nWij maken het je makkelijk:\n✅ Caravan staat al klaar op de camping\n✅ Volledig ingericht met inventaris\n✅ 30+ campings om uit te kiezen\n✅ Vanaf €${Math.min(...caravans.map(c => c.pricePerWeek))}/week\n\nVertel me meer! Hoeveel personen zijn jullie, welke periode, en heb je een voorkeur voor een locatie?`,
      `Een caravanvakantie aan de Costa Brava is onvergetelijk${name}! 🌅\n\n🏖️ Prachtige stranden en verborgen baaien\n🍽️ Heerlijk eten en lokale wijnen\n☀️ 300 dagen zon per jaar\n🚐 Caravan staat klaar — gewoon instappen!\n\nVan gezinnen tot koppels, van rustzoekers tot avonturiers — er is voor ieder wat.\n\nVertel: met hoeveel personen ga je? En heb je al een voorkeur voor een plek?`,
    ] : ['Dreaming of a Costa Brava holiday? ☀️🏖️\n\nTell me more: how many people, when, any preference?'];
    return {
      answer: pick(vacationAnswers, asked),
      followUp: isNl ? ['We zijn met 4 personen', 'In juli', 'Bij Lloret de Mar', 'Wat kost het?'] : ['4 people', 'In July', 'Near Lloret'],
      confidence: 0.85,
      topic: 'vacation',
    };
  }

  // ===== FAMILY / KIDS =====
  if (/gezin|kinderen|kind|baby|familie|peuter|family|children|kids|baby|ninos|familia/.test(lower)) {
    const familyAnswers = isNl ? [
      `We zijn heel geschikt voor gezinnen met kinderen${name}! 👨‍👩‍👧‍👦\n\n🏖️ Veel campings hebben **zwembaden, speeltuinen en animatie**\n🚐 Onze familiecaravans bieden tot 5 slaapplaatsen\n🛏️ Dekbedden en kussens aanwezig\n⛺ Voortent als extra leefruimte\n\nAanraders voor gezinnen:\n⛺ **Cypsela Resort** (Pals) — zwembadcomplex\n⛺ **Cala Gogo** (Calonge) — animatieprogramma\n⛺ **Tucan** (Lloret) — waterpark!\n\nWil je dat ik een geschikte caravan voor je gezin zoek?`,
      `Perfect voor gezinnen${name}! 👨‍👩‍👧‍👦\n\nOnze caravans zijn ideaal voor kids:\n🛏️ Ruime slaapplaatsen (tot 5 personen)\n🍳 Eigen kookgelegenheid — scheelt enorm in kosten!\n⛺ Voortent als speelruimte\n\nDe campings bieden ook:\n🏊 Zwembaden & waterglijbanen\n🎪 Animatieprogramma's\n🎮 Speeltuinen & sportfaciliteiten\n🛒 Supermarkt op het terrein\n\nFavoriete kindercampings:\n⛺ **Tucan** (Lloret) — waterpark met glijbanen!\n⛺ **Cypsela** (Pals) — groot zwembad + strand\n⛺ **Cala Gogo** (Calonge) — animatie hele dag`,
    ] : ['We are very family-friendly! Many campings have pools, playgrounds and activities for children.'];
    return {
      answer: pick(familyAnswers, asked),
      followUp: isNl ? ['Ja graag!', 'Welke caravans voor gezin?', 'Hoe boek ik?'] : ['Yes please!', 'Which caravans?'],
      confidence: 0.85,
      topic: 'family',
    };
  }

  // ===== COUPLE / ROMANTIC =====
  if (/koppel|stelletje|samen|romantisch|twee personen|couple|romantic|pareja|romantico/.test(lower)) {
    const coupleAnswers = isNl ? [
      `Een romantisch uitje aan de Costa Brava${name}? ❤️\n\nOnze compacte caravans zijn perfect voor koppels:\n\n🚐 **Knaus 1997** — €329/week, gezellige rondzit\n🚐 **Adria 430 Unica** — €329/week, compact en knus\n\nTips voor koppels:\n🌅 Begur & Pals — prachtige dorpjes en verborgen stranden\n🍷 L'Escala — Griekse ruines en heerlijke vis\n🏖️ Cadaques — kunstenaarsdorp met charme\n\nZal ik een optie voor jullie samenstellen?`,
      `Costa Brava is dé plek voor een romantische vakantie${name}! 💕\n\nVoor koppels raden we aan:\n\n🚐 **Compacte caravans** — knus, betaalbaar, alles wat je nodig hebt\n📍 **Begur** — verborgen baaien, charmante straatjes\n📍 **Cadaqués** — artistiek, romantisch, prachtige zonsondergangen\n📍 **Pals** — middeleeuws dorp, heerlijke rijstgerechten\n\nVanaf slechts **€${Math.min(...caravans.map(c => c.pricePerWeek))}/week** — inclusief alles!\n\nWil je dat ik een romantisch pakketje voor jullie samenstel?`,
    ] : ['Our compact caravans are perfect for couples! Starting from €329/week.'];
    return {
      answer: pick(coupleAnswers, asked),
      followUp: isNl ? ['Ja, stel iets samen!', 'Wat kost het?', 'Welke campings?'] : ['Yes!', 'Cost?'],
      confidence: 0.85,
      topic: 'couple',
    };
  }

  // ===== TRANSPORT =====
  if (/transport|slepen|vervoer|eigen caravan|hoe kom|rijden|reizen naar|how to get|como llegar/.test(lower)) {
    const transportAnswers = isNl ? [
      `Je hoeft je caravan niet zelf te vervoeren${name}! 🚗\n\nDe caravan staat **al op de camping** als je aankomt. Je rijdt gewoon naar de camping en checkt in!\n\n🚗 **Met de auto**: ca. 12-14 uur rijden vanaf Nederland\n✈️ **Met het vliegtuig**: naar Girona (30 min) of Barcelona (1,5 uur)\n\nHeb je een eigen caravan? Via ons moederbedrijf [Caravanstalling-Spanje](https://caravanstalling-spanje.com) kun je transport boeken.`,
      `Geen gesleep met caravans${name}! 🎉\n\nDe caravan staat al op de camping, klaar voor gebruik. Jij hoeft alleen jezelf te vervoeren:\n\n🚗 **Auto**: ~12-14 uur vanuit Nederland (via Lyon of Zwitserland)\n✈️ **Vliegtuig**: Girona airport is maar 30 min rijden!\n🚌 Huurauto beschikbaar bij elk vliegveld\n\n💡 Veel campings liggen op slechts 15-30 min van Girona Airport. Ideaal voor een fly & camp vakantie!`,
    ] : ['The caravan is already at the camping! You just drive there or fly to Girona/Barcelona.'];
    return {
      answer: pick(transportAnswers, asked),
      followUp: isNl ? ['Hoe boek ik?', 'Welke campings?', 'Wat kost het?'] : ['How to book?', 'Which campings?'],
      confidence: 0.85,
      topic: 'transport',
    };
  }

  // ===== WEATHER =====
  if (/weer|temperatuur|regen|zon|klimaat|weather|temperature|rain|sun|clima|tiempo/.test(lower)) {
    const weatherAnswers = isNl ? [
      `Het weer aan de Costa Brava is heerlijk${name}! ☀️\n\n🌡️ **Mei**: 18-23°C, lekker warm\n🌡️ **Juni**: 22-28°C, ideaal\n🌡️ **Juli/Aug**: 25-33°C, volop zomer!\n🌡️ **September**: 22-28°C, aangenaam warm\n\nGemiddeld 300 dagen zon per jaar! Regenachtige dagen zijn zeldzaam in het seizoen.\n\n💡 Tip: de **HomeCar 450 Racer** heeft airco voor de warmste dagen!`,
      `De Costa Brava heeft fantastisch weer${name}! ☀️\n\nWat je kunt verwachten per maand:\n\n🌞 **Mei** — 18-23°C, ideaal voor wandelen\n🌞 **Juni** — 22-28°C, lekker strandweer\n🔥 **Juli/Aug** — 25-33°C, heerlijk warm!\n🌞 **Sept** — 22-28°C, nazomeren op z'n best\n\n🌊 Zeewatertemperatuur: 20-25°C\n☁️ Gemiddeld 300 zonnedagen per jaar\n\nIn juli/augustus kan een caravan met **airco** fijn zijn — de HomeCar 450 Racer heeft dat!`,
    ] : ['Costa Brava weather is wonderful! 25-33°C in summer with 300 sunny days a year. ☀️'];
    return {
      answer: pick(weatherAnswers, asked),
      followUp: isNl ? ['Welke caravans met airco?', 'Welke maanden?', 'Hoe boek ik?'] : ['Caravans with AC?', 'How to book?'],
      confidence: 0.85,
      topic: 'weather',
    };
  }

  // ===== ACTIVITIES / THINGS TO DO =====
  if (/activiteit|uitje|bezienswaardigh|doen|strand|zwem|snorkel|wandel|fiets|activity|things to do|beach|swim|actividad|playa/.test(lower)) {
    const activityAnswers = isNl ? [
      `Er is zoveel te doen aan de Costa Brava${name}! 🎉\n\n🏖️ **Stranden** — verborgen baaien, brede zandstranden\n🤿 **Snorkelen/Duiken** — Medes Eilanden (Estartit)\n🚴 **Fietsen** — routes door het achterland\n🏰 **Cultuur** — Dali Museum (Figueres), Romeinse ruines (Empuries)\n🌊 **Watersport** — kajakken, SUP, zeilen\n🍷 **Wijnproeven** — Emporda wijnstreek\n🎢 **Waterpret** — Aquabrava, campingzwembaden\n👨‍👩‍👧 **Kids** — dierparken, aquariums, speeltuinen\n\nBekijk onze [bestemmingen pagina](/bestemmingen) voor meer inspiratie!`,
      `De Costa Brava is een paradijs voor activiteiten${name}! 🌟\n\n🏊 **Water**: snorkelen bij de Medes Eilanden, kajakken langs de kust, SUP-pen\n🥾 **Natuur**: Camí de Ronda kustpad, Cap de Creus natuurpark\n🏛️ **Cultuur**: Dalí Museum in Figueres, Empúries ruïnes\n🍽️ **Food**: wijntours, lokale markten, Catalaanse keuken\n🚴 **Sport**: mountainbiken, golfen, zeilen\n🎡 **Fun**: Marineland, Aquabrava waterpark\n\nElke bestemming heeft zijn eigen charme! Bekijk onze [bestemmingen](/bestemmingen) voor tips per locatie.`,
    ] : ['So much to do at the Costa Brava! Beaches, snorkeling, cycling, culture, water sports, and more!'];
    return {
      answer: pick(activityAnswers, asked),
      followUp: isNl ? ['Welke campings bij het strand?', 'Hoe boek ik?', 'Welke caravans?'] : ['Beach campings?', 'How to book?'],
      confidence: 0.85,
      topic: 'activities',
    };
  }

  // ===== SAFETY / INSURANCE =====
  if (/veilig|verzekering|insurance|safe|diefstal|theft|segur/.test(lower)) {
    return {
      answer: isNl
        ? `Veiligheid is belangrijk${name}! 🔒\n\n✅ Campings hebben 24/7 bewaking en receptie\n✅ Je bezittingen zijn veilig in de afgesloten caravan\n✅ Onze caravans worden elk seizoen grondig gecontroleerd\n\n💡 We raden een **reis- en annuleringsverzekering** aan voor extra zekerheid.\n\nDe borgregeling:\n🔒 €250-€500 via iDEAL/Wero bij aankomst\n✅ Retour binnen 7 dagen bij geen schade`
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
    const aboutAnswers = isNl ? [
      `Wij zijn **Caravanverhuur Spanje**${name}! 🇪🇸\n\nOns concept is simpel: wij zorgen ervoor dat er een volledig ingerichte caravan op de camping van jouw keuze staat. Jij hoeft alleen maar te genieten!\n\n✅ 30+ campings aan de Costa Brava\n✅ ${caravans.length} goed onderhouden caravans\n✅ Alles inclusief (inventaris, beddengoed, etc.)\n✅ Nederlandse service\n\nOns moederbedrijf [Caravanstalling-Spanje](https://caravanstalling-spanje.com) regelt het transport.\n\n👉 Lees meer op onze [Over Ons pagina](/over-ons)!`,
      `Leuk dat je meer wilt weten${name}! 😊\n\nWij zijn een Nederlands bedrijf dat **caravans verhuurt op de Costa Brava**. Ons concept:\n\n🚐 Wij plaatsen de caravan op de camping\n🛏️ Wij richten alles in (beddengoed, kookgerei, etc.)\n🧹 Wij maken schoon voor en na je verblijf\n😎 Jij hoeft alleen maar te genieten!\n\nWe werken samen met 30+ campings en hebben ${caravans.length} caravans.\n\n👉 Meer info op onze [Over Ons pagina](/over-ons)`,
    ] : ['We are **Caravanverhuur Spanje**! We place fully equipped caravans on campings across the Costa Brava.'];
    return {
      answer: pick(aboutAnswers, asked),
      followUp: isNl ? ['Welke caravans?', 'Welke campings?', 'Hoe boek ik?'] : ['Which caravans?', 'How to book?'],
      confidence: 0.85,
      topic: 'about',
    };
  }

  // ===== CONTACT / SPEAK TO HUMAN =====
  if (/contact|telefoon|bellen|mail|email|bereik|medewerker|persoon|iemand|spreek|menselijk|echt|live|chat met|speak|talk|human|real|staff|person|contacto|hablar|WhatsApp|whatsapp|app|bericht sturen|nummmer|telefoonnummer|hoe bereik|hoe kan ik.*bereiken|bereikbaar|klantenservice|helpdesk|support/.test(lower)) {
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
    const recoAnswers = isNl ? [
      `Hier zijn mijn tips${name}! 🌟\n\n**Voor gezinnen:**\n🚐 Hobby Prestige 650 (5 pers) + Cypsela Resort (Pals)\n\n**Voor koppels:**\n🚐 Knaus 1997 (4 pers, gezellig) + Camping Begur\n\n**Met airco (aanrader bij zomerhitte!):**\n🚐 HomeCar 450 Racer + La Ballena Alegre\n\n**Budget-optie:**\n🚐 Knaus 1997 of Adria 430 — vanaf €329/week!\n\nWil je dat ik iets specifieks voor je uitzoek?`,
      `Graag${name}! Hier mijn persoonlijke aanbevelingen: ✨\n\n🏆 **Beste camping** → Cypsela Resort (Pals) — luxe, direct aan het strand\n🚐 **Beste familiecaravan** → Hobby Prestige 650 — ruimst, comfortabel\n❄️ **Beste voor de zomer** → HomeCar 450 Racer — mét airco!\n💰 **Beste budget-optie** → Knaus 1997 — vanaf €329/week\n🌅 **Mooiste bestemming** → Begur — verborgen baaien + charme\n🤿 **Meeste activiteiten** → Estartit — duiken bij Medes Eilanden\n\nVertel me wat jij belangrijk vindt, en ik geef persoonlijk advies!`,
    ] : ['My recommendations: Hobby Prestige for families, Knaus for couples, HomeCar for AC!'];
    return {
      answer: pick(recoAnswers, asked),
      followUp: isNl ? ['Vertel meer over Hobby Prestige', 'Vertel meer over HomeCar', 'Hoe boek ik?'] : ['Tell me about Hobby', 'How to book?'],
      confidence: 0.85,
      topic: 'recommendations',
    };
  }

  // ===== THANKS =====
  if (/bedankt|dankje|dank|thanks|thank you|gracias|top|super|mooi|fijn|geweldig|perfect/.test(lower)) {
    const thanksAnswers = isNl ? [
      `Graag gedaan${name}! 😊 Kan ik je nog ergens anders mee helpen?`,
      `Met plezier${name}! 🙌 Laat het gerust weten als je nog vragen hebt!`,
      `Fijn dat ik kon helpen${name}! 😊 Mocht er nog iets zijn, ik ben hier!`,
    ] : isEs ? [`¡De nada${name}! 😊 ¿Algo más?`] : [`You're welcome${name}! 😊 Anything else?`];
    return {
      answer: pick(thanksAnswers, asked),
      followUp: isNl ? ['Hoe boek ik?', 'Wat kost het?', 'Nee, bedankt!'] : ['How to book?', 'No thanks!'],
      confidence: 0.9,
      topic: 'thanks',
    };
  }

  // ===== FAREWELL =====
  if (/^(nee.*bedankt|doei|dag|bye|goodbye|adios|tot ziens|nee.*dank|tot snel|ciao)/.test(lower)) {
    const farewellAnswers = isNl ? [
      `Tot snel${name}! 👋 Mocht je nog vragen hebben, ik ben er altijd.\n\nFijne dag en hopelijk tot ziens aan de Costa Brava! ☀️🏖️`,
      `Doei${name}! 👋 Het was leuk je te helpen. Geniet van je dag!\n\nWe hopen je snel te verwelkomen aan de Costa Brava! 🌞`,
    ] : isEs ? [`¡Hasta luego${name}! 👋 ☀️`] : [`Goodbye${name}! 👋 Have a great day! ☀️`];
    return {
      answer: pick(farewellAnswers, asked),
      followUp: [],
      confidence: 0.9,
      topic: 'farewell',
    };
  }

  // ===== FUZZY MATCHING: catch broader questions =====
  if (/wanneer|hoe lang|hoelang|how long|duration|duur|minimaal|minimum/.test(lower)) {
    return {
      answer: isNl
        ? `Er is geen minimale huurduur${name}! Je kunt vanaf 1 dag boeken. 📅\n\nPrijzen:\n• Per dag: vanaf €${Math.min(...caravans.map(c => c.pricePerDay))}\n• Per week: vanaf €${Math.min(...caravans.map(c => c.pricePerWeek))} (voordeliger!)\n\nHet seizoen loopt van mei t/m september 2026.\n\n👉 **[Bekijk beschikbaarheid](/boeken)**`
        : 'No minimum rental! From 1 day. Season: May-September.',
      followUp: isNl ? ['Wat kost het?', 'Hoe boek ik?', 'Welke caravans?'] : ['Cost?', 'How to book?'],
      confidence: 0.8,
      topic: 'duration',
    };
  }

  if (/foto|picture|image|video|filmpje|beeld/.test(lower)) {
    return {
      answer: isNl
        ? `Bekijk foto's en details van al onze caravans${name}! 📸\n\n👉 **[Caravans met foto's](/caravans)**\n👉 **[Bestemmingen met foto's](/bestemmingen)**\n\nElke caravan en bestemming heeft een uitgebreide fotogalerij!`
        : 'Check out photos of all our caravans and destinations on our website! 📸',
      followUp: isNl ? ['Welke caravans?', 'Welke bestemmingen?'] : ['Which caravans?', 'Destinations?'],
      confidence: 0.8,
      topic: 'photos',
    };
  }

  if (/korting|discount|actie|aanbieding|coupon|code|sale|oferta|descuento/.test(lower)) {
    return {
      answer: isNl
        ? `Goed dat je ernaar vraagt${name}! 🏷️\n\nHeb je een kortingscode? Die kun je invoeren tijdens het boekingsproces.\n\nDaarnaast geldt: hoe langer je boekt, hoe voordeliger het wordt! Weekprijzen zijn aanzienlijk lager dan dagprijzen.\n\n👉 **[Boek nu en voer je code in](/boeken)**`
        : 'Got a discount code? Enter it during checkout! Book longer for better rates.',
      followUp: isNl ? ['Hoe boek ik?', 'Wat kost het?'] : ['How to book?', 'Cost?'],
      confidence: 0.8,
      topic: 'discount',
    };
  }

  // ===== HOW DOES IT WORK (general) =====
  if (/hoe werkt|hoe gaat|concept|wat doen jullie|wat bieden|wat is|uitleg|explain|how does it work|how it works|como funciona|wat houd.*in/.test(lower)) {
    return {
      answer: isNl
        ? `Ons concept is heel simpel${name}! 🚐✨\n\n**Wij regelen alles — jij geniet!**\n\n1️⃣ **Kies** je camping, caravan en periode\n2️⃣ **Boek** en betaal 30% aanbetaling via iDEAL\n3️⃣ **Wij plaatsen** de caravan op de camping\n4️⃣ **Jij rijdt** naar de camping en checkt in\n5️⃣ **Geniet** van je vakantie!\n\nDe caravan staat **al klaar** met beddengoed, kookgerei, servies en meer.\n\nBij vertrek laat je de caravan bezemschoon achter en wij doen de rest!\n\n✅ 30+ campings aan de Costa Brava\n✅ ${caravans.length} caravans, volledig uitgerust\n✅ Nederlandse service\n\nWat wil je nog meer weten?`
        : 'Our concept is simple: we place a fully equipped caravan on your chosen camping. You just enjoy! 🚐✨',
      followUp: isNl ? ['Wat kost het?', 'Welke caravans?', 'Welke campings?', 'Hoe boek ik?'] : ['Cost?', 'Which caravans?', 'How to book?'],
      confidence: 0.85,
      topic: 'how-it-works',
    };
  }

  // ===== COSTA BRAVA / SPAIN =====
  if (/costa brava|spanje|spain|espana|catalonië|catalonie|cataluna|girona|barcelona|emporda|mediterranean|middellandse/.test(lower)) {
    return {
      answer: isNl
        ? `De **Costa Brava** is een van de mooiste kusten van Spanje${name}! 🇪🇸🌊\n\n📍 **Waar**: Noordoost-Spanje, in de regio Catalonië\n☀️ **Weer**: 300+ zonnedagen, 25-33°C in de zomer\n🏖️ **Bekende plaatsen**: Lloret de Mar, Tossa de Mar, Cadaqués, Roses, Begur, Pals\n\n⭐ **Waarom Costa Brava?**\n• Prachtige verborgen baaien en brede stranden\n• Heerlijke Catalaanse keuken en lokale wijnen\n• Rijke cultuur (Dalí Museum!)\n• Ideaal klimaat voor een caravanvakantie\n\nWij hebben 30+ campings verspreid over de hele regio. Welke plek spreekt je aan?`
        : 'The **Costa Brava** is one of Spain\'s most beautiful coasts! 300+ sunny days, stunning beaches, great food. 🇪🇸🌊',
      followUp: isNl ? ['Welke campings?', 'Welke bestemmingen?', 'Hoe boek ik?'] : ['Which campings?', 'How to book?'],
      confidence: 0.85,
      topic: 'costa-brava',
    };
  }

  // ===== SWIMMING / POOL =====
  if (/zwembad|zwemmen|pool|aquapark|waterpark|waterglijbaan|glijbaan|piscina/.test(lower)) {
    return {
      answer: isNl
        ? `Veel van onze campings hebben fantastische zwembaden${name}! 🏊‍♂️\n\n🏆 **Top campings met zwembad:**\n\n⛺ **Cypsela Resort** (Pals) — groot zwembadcomplex\n⛺ **Cala Gogo** (Calonge) — meerdere zwembaden + glijbanen\n⛺ **Tucan** (Lloret) — waterpark met wilde glijbanen! 🎢\n⛺ **La Ballena Alegre** (Sant Pere) — zwembad + direct aan strand\n\nDaarnaast zijn veel stranden geschikt om te zwemmen — het water is helder en warm in de zomer!\n\n👉 Bekijk alle campings op onze [bestemmingen pagina](/bestemmingen)`
        : 'Many of our campings have great swimming pools! Cypsela Resort, Cala Gogo, and Tucan have the best water parks. 🏊‍♂️',
      followUp: isNl ? ['Welke campings?', 'Campings met animatie', 'Hoe boek ik?'] : ['Which campings?', 'How to book?'],
      confidence: 0.85,
      topic: 'pool',
    };
  }

  // ===== SUPERMARKET / SHOPS =====
  if (/supermarkt|winkel|boodschappen|shop|tienda|supermercado|restaurant|eten|dining/.test(lower)) {
    return {
      answer: isNl
        ? `De meeste campings hebben uitstekende voorzieningen${name}! 🛒\n\n🛒 **Supermarkt** — op vrijwel alle campings aanwezig\n🍕 **Restaurant/snackbar** — op de meeste campings\n🍞 **Vers brood** — dagelijks verkrijgbaar\n🏪 **Dorpswinkels** — op loop-/rijafstand\n\nLidl, Mercadona en Bonàrea zijn populaire supermarkten in de buurt. De lokale markten (elke week in bijna elk dorp) zijn een must!\n\n🍽️ **Eten uit**: Spanje is betaalbaar! Een 3-gangen menu del día kost vaak maar €10-€15.\n\nMaar met een eigen keuken in de caravan kun je ook lekker zelf koken! 🍳`
        : 'Most campings have a supermarket, restaurant, and fresh bread daily! 🛒',
      followUp: isNl ? ['Wat zit er in de caravan?', 'Welke campings?', 'Hoe boek ik?'] : ['What\'s included?', 'How to book?'],
      confidence: 0.8,
      topic: 'shops',
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

  const defaultBookingFlow: BookingFlowState = {
    active: false, step: 'dates', checkIn: '', checkOut: '', campingId: '', campingName: '',
    adults: 2, children: 0, caravanId: '', caravanName: '', name: '', email: '', phone: '',
    specialRequests: '', termsAccepted: false, discountCode: '', totalPrice: 0, nights: 0,
    bookingRef: '', paymentUrl: '', error: '',
  };
  const [bookingFlow, setBookingFlow] = useState<BookingFlowState>(defaultBookingFlow);
  const [bookingCampingSearch, setBookingCampingSearch] = useState('');

  // Fetch campings from DB (admin-managed)
  const [campings, setCampings] = useState<Camping[]>(staticCampings);
  useEffect(() => {
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setCampings(data.campings); })
      .catch((e) => console.error('Fetch error:', e));
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
      }).catch((e) => console.error('Fetch error:', e));
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

  /* ------------------------------------------------------------------ */
  /*  Booking Flow Functions                                             */
  /* ------------------------------------------------------------------ */
  const startBookingFlow = useCallback(() => {
    setBookingFlow({ ...defaultBookingFlow, active: true, step: 'dates', name: userName || contactForm.name, email: contactForm.email, phone: contactForm.phone });
    setBookingCampingSearch('');
    const msg = isNl
      ? `Laten we je boeking regelen! 🎉\n\nKies hieronder je aankomst- en vertrekdatum.`
      : isEs
      ? `¡Vamos a organizar tu reserva! 🎉\n\nElige tus fechas abajo.`
      : `Let's set up your booking! 🎉\n\nChoose your check-in and check-out dates below.`;
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'bot', text: msg, timestamp: new Date(),
    }]);
    saveMessage('bot', msg);
  }, [userName, contactForm, isNl, isEs, saveMessage]);

  const advanceBookingStep = useCallback((nextStep: BookingStep, message: string) => {
    setBookingFlow(prev => ({ ...prev, step: nextStep }));
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'bot', text: message, timestamp: new Date(),
    }]);
    saveMessage('bot', message);
  }, [saveMessage]);

  const handleBookingDatesConfirm = useCallback(() => {
    if (!bookingFlow.checkIn || !bookingFlow.checkOut) return;
    const nights = Math.round((new Date(bookingFlow.checkOut).getTime() - new Date(bookingFlow.checkIn).getTime()) / 86400000);
    if (nights <= 0) return;
    setBookingFlow(prev => ({ ...prev, nights }));
    const userText = isNl
      ? `📅 ${bookingFlow.checkIn} – ${bookingFlow.checkOut} (${nights} ${nights === 1 ? 'nacht' : 'nachten'})`
      : `📅 ${bookingFlow.checkIn} – ${bookingFlow.checkOut} (${nights} ${nights === 1 ? 'night' : 'nights'})`;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: new Date() }]);
    saveMessage('user', userText);
    setTimeout(() => {
      const msg = isNl
        ? `Top! ${nights} ${nights === 1 ? 'nacht' : 'nachten'} ☀️\n\nOp welke camping wil je staan?`
        : isEs
        ? `¡Perfecto! ${nights} noches ☀️\n\n¿En qué camping quieres estar?`
        : `Great! ${nights} ${nights === 1 ? 'night' : 'nights'} ☀️\n\nWhich camping do you prefer?`;
      advanceBookingStep('camping', msg);
    }, 400);
  }, [bookingFlow.checkIn, bookingFlow.checkOut, isNl, isEs, saveMessage, advanceBookingStep]);

  const handleBookingCampingSelect = useCallback((camping: Camping) => {
    setBookingFlow(prev => ({ ...prev, campingId: camping.id, campingName: camping.name }));
    const userText = `⛺ ${camping.name} — ${camping.location}`;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: new Date() }]);
    saveMessage('user', userText);
    setTimeout(() => {
      const msg = isNl
        ? `Mooie keuze! 🏕️\n\nMet hoeveel personen gaan jullie? Kies hieronder het aantal en selecteer een caravan.`
        : isEs
        ? `¡Buena elección! 🏕️\n\n¿Cuántas personas? Elige abajo.`
        : `Great choice! 🏕️\n\nHow many people? Choose below and select a caravan.`;
      advanceBookingStep('persons', msg);
    }, 400);
  }, [isNl, isEs, saveMessage, advanceBookingStep]);

  const handleBookingCaravanSelect = useCallback((caravan: typeof caravans[0]) => {
    const nights = bookingFlow.nights;
    const price = Math.floor(nights / 7) * caravan.pricePerWeek + (nights % 7) * caravan.pricePerDay;
    setBookingFlow(prev => ({ ...prev, caravanId: caravan.id, caravanName: caravan.name, totalPrice: price }));
    const userText = `🚐 ${caravan.name} — €${price} (${nights} ${isNl ? 'nachten' : 'nights'})`;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: new Date() }]);
    saveMessage('user', userText);
    setTimeout(() => {
      const msg = isNl
        ? `Uitstekende keuze! 🎉\n\nVul nu je gegevens in om de boeking af te ronden.`
        : isEs
        ? `¡Excelente elección! 🎉\n\nRellena tus datos para completar la reserva.`
        : `Excellent choice! 🎉\n\nFill in your details to complete the booking.`;
      advanceBookingStep('contact', msg);
    }, 400);
  }, [bookingFlow.nights, isNl, isEs, saveMessage, advanceBookingStep]);

  const handleBookingContactConfirm = useCallback(() => {
    if (!bookingFlow.name || !bookingFlow.email || !bookingFlow.phone) return;
    const userText = isNl
      ? `👤 ${bookingFlow.name}\n📧 ${bookingFlow.email}\n📞 ${bookingFlow.phone}`
      : `👤 ${bookingFlow.name}\n📧 ${bookingFlow.email}\n📞 ${bookingFlow.phone}`;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: new Date() }]);
    saveMessage('user', userText);
    setTimeout(() => {
      const caravan = caravans.find(c => c.id === bookingFlow.caravanId);
      const msg = isNl
        ? `Hier is je boekingsoverzicht:\n\n📅 **${bookingFlow.checkIn}** – **${bookingFlow.checkOut}** (${bookingFlow.nights} nachten)\n⛺ **${bookingFlow.campingName}**\n🚐 **${bookingFlow.caravanName}**\n👥 ${bookingFlow.adults} volwassenen${bookingFlow.children > 0 ? `, ${bookingFlow.children} kinderen` : ''}\n\n💰 **Totaal: €${bookingFlow.totalPrice}**\n🔒 Borg: €${caravan?.deposit || 0} (retour na inspectie)\n\nKlopt alles? Bevestig je boeking hieronder!`
        : isEs
        ? `Tu resumen:\n\n📅 **${bookingFlow.checkIn}** – **${bookingFlow.checkOut}** (${bookingFlow.nights} noches)\n⛺ **${bookingFlow.campingName}**\n🚐 **${bookingFlow.caravanName}**\n👥 ${bookingFlow.adults} adultos${bookingFlow.children > 0 ? `, ${bookingFlow.children} niños` : ''}\n\n💰 **Total: €${bookingFlow.totalPrice}**\n\n¡Confirma tu reserva abajo!`
        : `Your summary:\n\n📅 **${bookingFlow.checkIn}** – **${bookingFlow.checkOut}** (${bookingFlow.nights} nights)\n⛺ **${bookingFlow.campingName}**\n🚐 **${bookingFlow.caravanName}**\n👥 ${bookingFlow.adults} adults${bookingFlow.children > 0 ? `, ${bookingFlow.children} children` : ''}\n\n💰 **Total: €${bookingFlow.totalPrice}**\n\nConfirm your booking below!`;
      advanceBookingStep('summary', msg);
    }, 400);
  }, [bookingFlow, isNl, isEs, saveMessage, advanceBookingStep]);

  const handleBookingSubmit = useCallback(async () => {
    if (!bookingFlow.termsAccepted) return;
    setBookingFlow(prev => ({ ...prev, step: 'processing', error: '' }));
    const caravan = caravans.find(c => c.id === bookingFlow.caravanId);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: bookingFlow.name, guestEmail: bookingFlow.email, guestPhone: bookingFlow.phone,
          adults: bookingFlow.adults, children: bookingFlow.children,
          specialRequests: bookingFlow.specialRequests || undefined,
          caravanId: bookingFlow.caravanId, campingId: bookingFlow.campingId,
          checkIn: bookingFlow.checkIn, checkOut: bookingFlow.checkOut,
          nights: bookingFlow.nights, totalPrice: bookingFlow.totalPrice,
          borgAmount: caravan?.deposit || 0,
        }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setBookingFlow(prev => ({ ...prev, bookingRef: data.reference }));

      // Check if immediate payment is needed
      if (data.immediatePayment && data.paymentId) {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: data.paymentId }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.url) {
          setBookingFlow(prev => ({ ...prev, step: 'complete', paymentUrl: checkoutData.url }));
          const msg = isNl
            ? `Je boeking is geplaatst! 🎉\n\n📋 Referentie: **${data.reference}**\n\nJe aankomst is binnen 30 dagen, dus directe betaling is vereist.\n\n💳 Klik op de knop hieronder om veilig te betalen via iDEAL/Wero.`
            : isEs
            ? `¡Tu reserva está hecha! 🎉\n\nReferencia: **${data.reference}**\n\nPago inmediato requerido. Haz clic abajo.`
            : `Your booking is placed! 🎉\n\nReference: **${data.reference}**\n\nImmediate payment required. Click below to pay securely.`;
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: msg, timestamp: new Date() }]);
          saveMessage('bot', msg);
          return;
        }
      }

      // Deferred payment
      const deadline = new Date(new Date(bookingFlow.checkIn).getTime() - 30 * 24 * 60 * 60 * 1000);
      const deadlineStr = deadline.toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      setBookingFlow(prev => ({ ...prev, step: 'complete' }));
      const msg = isNl
        ? `Je boeking is bevestigd! 🎉🥳\n\n📋 Referentie: **${data.reference}**\n\n📧 Je ontvangt een bevestiging per e-mail op ${bookingFlow.email}.\n\n💰 Betaling van **€${bookingFlow.totalPrice}** is verschuldigd voor **${deadlineStr}**.\nJe ontvangt tijdig een betaallink per e-mail.\n\n🔒 Borg: €${caravan?.deposit || 0} bij aankomst op de camping.\n\nBedankt en tot ziens aan de Costa Brava! ☀️🏖️`
        : isEs
        ? `¡Tu reserva está confirmada! 🎉\n\nReferencia: **${data.reference}**\nPago de €${bookingFlow.totalPrice} antes del ${deadlineStr}.\n\n¡Gracias y nos vemos en la Costa Brava! ☀️`
        : `Your booking is confirmed! 🎉\n\nReference: **${data.reference}**\nPayment of €${bookingFlow.totalPrice} due before ${deadlineStr}.\n\nSee you at the Costa Brava! ☀️`;
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: msg, timestamp: new Date() }]);
      saveMessage('bot', msg);
    } catch {
      setBookingFlow(prev => ({ ...prev, step: 'summary', error: isNl ? 'Er ging iets mis. Probeer het opnieuw.' : 'Something went wrong. Please try again.' }));
      const errMsg = isNl
        ? 'Oeps, er ging iets mis bij het plaatsen van je boeking. 😔 Probeer het opnieuw!'
        : 'Oops, something went wrong. Please try again!';
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: errMsg, timestamp: new Date() }]);
    }
  }, [bookingFlow, isNl, isEs, saveMessage]);

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
          }).catch((e) => console.error('Fetch error:', e));
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

      // Check for direct booking intent — start inline booking flow
      const bookingTrigger = /^(ja.*help.*boeken|ja.*boeken|direct.*boek|boek\s*nu|wil.*boeken|start.*boeking|ik.*wil.*huren|wil.*reserv|book\s*now|i.*want.*book|want.*book|reservar\s*ahora|quiero\s*reservar|ja.*naar\s*boeken|help.*me.*boeken|laten.*boeken)$/i.test(trimmed.toLowerCase()) ||
        /^(boek nu|book now|reservar ahora|ja, help me boeken!|ja, help me kiezen!|ja,? naar boeken!|yes,? help me book!|yes,? book!|¡sí,? ayúdame!)$/i.test(trimmed);

      if (bookingTrigger && !bookingFlow.active) {
        setIsTyping(false);
        startBookingFlow();
        return;
      }

      const result = smartMatch(trimmed, locale as Locale, userName, convContext, messages, campings);

      // Update last topic in context
      if (result.topic) {
        setConvContext(prev => ({ ...prev, lastTopic: result.topic! }));
      }

      if (result.confidence === 0) {
        const fallbacks = isNl ? [
          `Hmm${userName ? `, ${userName}` : ''}, dat snap ik niet helemaal. 🤔\n\nIk kan je helpen met:\n• Prijzen & boeken\n• Caravans & campings\n• Beschikbaarheid & seizoen\n• Tips & aanbevelingen\n\nKun je het anders formuleren? Of wil je met een medewerker praten?`,
          `Sorry${userName ? `, ${userName}` : ''}, ik begrijp je vraag niet helemaal. 😅\n\nProbeer eens een van deze onderwerpen:\n🚐 Caravans & prijzen\n📍 Campings & bestemmingen\n📅 Seizoen & boeken\n\nOf klik op een van de snelknoppen hieronder!`,
          `Oeps${userName ? `, ${userName}` : ''}, die vraag kan ik helaas niet beantwoorden. 🤷\n\nMaar ik weet alles over caravanvakantie aan de Costa Brava! Stel een vraag over prijzen, caravans, campings of het boekingsproces.\n\nOf praat direct met een medewerker!`,
        ] : isEs ? ['Hmm, no lo entiendo. 🤔 ¿Puedes reformularlo?']
        : [`Hmm${userName ? `, ${userName}` : ''}, I don't quite understand. 🤔\n\nCould you rephrase? Or talk to staff?`];
        const fallbackText = fallbacks[(convContext.askedQuestions.length + Date.now()) % fallbacks.length];
        const fallback: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: fallbackText,
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
  }, [locale, isOpen, userName, chatMode, conversationId, saveMessage, isNl, isEs, convContext, messages, bookingFlow.active, startBookingFlow, campings]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

  const handleContactSubmit = async () => {
    if (!contactForm.name || (!contactForm.email && !contactForm.phone)) return;
    if (conversationId) {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateVisitor', conversationId, name: contactForm.name, email: contactForm.email, phone: contactForm.phone }),
      }).catch((e) => console.error('Fetch error:', e));
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
            className="fixed bottom-[7rem] right-3 left-3 sm:left-auto sm:bottom-24 sm:right-5 z-[90] sm:w-[400px] h-[60vh] sm:h-[560px] max-h-[560px] sm:max-h-[75vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 shrink-0 rounded-t-2xl">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                <Image src="https://u.cubeupload.com/laurensbos/Caravanverhuur1.png" alt="Luna" width={28} height={28} className="object-contain sm:w-[30px] sm:h-[30px]" />
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
              {messages.length > 0 && messages[messages.length - 1].role === 'bot' && messages[messages.length - 1].quickReplies && !isTyping && chatMode === 'bot' && !bookingFlow.active && (
                <div className="flex sm:flex-wrap gap-1.5 pt-1 pl-8 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-x-visible">
                  {messages[messages.length - 1].quickReplies!.map((qr, i) => (
                    <button key={i} onClick={() => sendMessage(qr)} className="px-3 py-2 sm:py-1.5 bg-white border border-primary/30 text-primary text-xs font-medium rounded-full hover:bg-primary/5 transition-colors active:scale-95 cursor-pointer whitespace-nowrap shrink-0 sm:shrink">
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* ===== INLINE BOOKING FLOW UI ===== */}
              {bookingFlow.active && bookingFlow.step !== 'complete' && bookingFlow.step !== 'processing' && (
                <div className="bg-white rounded-xl border border-primary/20 overflow-hidden shadow-sm mx-1">
                  {/* Step indicator */}
                  <div className="bg-primary/5 px-3 py-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      {['dates','camping','persons','caravan','contact','summary'].map((s, i) => (
                        <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
                          s === bookingFlow.step ? 'bg-primary scale-125' :
                          ['dates','camping','persons','caravan','contact','summary'].indexOf(bookingFlow.step) > i ? 'bg-primary/50' : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-primary ml-1">
                      {isNl ? 'Boeking' : isEs ? 'Reserva' : 'Booking'} — {
                        bookingFlow.step === 'dates' ? (isNl ? 'Datum' : isEs ? 'Fechas' : 'Dates') :
                        bookingFlow.step === 'camping' ? 'Camping' :
                        bookingFlow.step === 'persons' ? (isNl ? 'Reizigers' : isEs ? 'Viajeros' : 'Travelers') :
                        bookingFlow.step === 'caravan' ? 'Caravan' :
                        bookingFlow.step === 'contact' ? (isNl ? 'Gegevens' : isEs ? 'Datos' : 'Details') :
                        (isNl ? 'Overzicht' : isEs ? 'Resumen' : 'Summary')
                      }
                    </span>
                    <button onClick={() => setBookingFlow(defaultBookingFlow)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" title={isNl ? 'Annuleren' : 'Cancel'}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* STEP: DATES */}
                    {bookingFlow.step === 'dates' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={11} /> {isNl ? 'Aankomst' : isEs ? 'Llegada' : 'Check-in'}</label>
                            <input type="date" value={bookingFlow.checkIn} onChange={e => setBookingFlow(p => ({ ...p, checkIn: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-2.5 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={11} /> {isNl ? 'Vertrek' : isEs ? 'Salida' : 'Check-out'}</label>
                            <input type="date" value={bookingFlow.checkOut} onChange={e => setBookingFlow(p => ({ ...p, checkOut: e.target.value }))}
                              min={bookingFlow.checkIn || new Date().toISOString().split('T')[0]}
                              className="w-full px-2.5 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                          </div>
                        </div>
                        {bookingFlow.checkIn && bookingFlow.checkOut && (() => {
                          const n = Math.round((new Date(bookingFlow.checkOut).getTime() - new Date(bookingFlow.checkIn).getTime()) / 86400000);
                          return n > 0 ? (
                            <p className="text-xs text-primary font-medium flex items-center gap-1"><Check size={12} /> {n} {n === 1 ? (isNl ? 'nacht' : 'night') : (isNl ? 'nachten' : 'nights')}</p>
                          ) : null;
                        })()}
                        <button onClick={handleBookingDatesConfirm}
                          disabled={!bookingFlow.checkIn || !bookingFlow.checkOut || Math.round((new Date(bookingFlow.checkOut).getTime() - new Date(bookingFlow.checkIn).getTime()) / 86400000) <= 0}
                          className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                          {isNl ? 'Bevestig datums' : isEs ? 'Confirmar fechas' : 'Confirm dates'} <ArrowRight size={14} />
                        </button>
                      </>
                    )}

                    {/* STEP: CAMPING */}
                    {bookingFlow.step === 'camping' && (
                      <>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" value={bookingCampingSearch} onChange={e => setBookingCampingSearch(e.target.value)}
                            placeholder={isNl ? 'Zoek camping...' : isEs ? 'Buscar camping...' : 'Search camping...'}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-1 -mx-1 px-1">
                          {campings.filter(c => {
                            if ((c as Camping & { active?: boolean }).active === false) return false;
                            if (!bookingCampingSearch.trim()) return true;
                            const q = bookingCampingSearch.toLowerCase();
                            return c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
                          }).map(c => (
                            <button key={c.id} onClick={() => handleBookingCampingSelect(c)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all active:scale-[0.98] ${
                                bookingFlow.campingId === c.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-50 border border-transparent'
                              }`}>
                              <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                                <Tent size={12} className="text-primary shrink-0" /> {c.name}
                              </p>
                              <p className="text-[11px] text-gray-500 ml-[18px]">{c.location}</p>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* STEP: PERSONS + CARAVAN SELECTION */}
                    {(bookingFlow.step === 'persons' || bookingFlow.step === 'caravan') && (() => {
                      const totalPersons = bookingFlow.adults + bookingFlow.children;
                      const availableCaravans = caravans.filter(c => c.maxPersons >= totalPersons);
                      return (
                        <>
                          {/* Person counters */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[13px] font-semibold text-gray-800">{isNl ? 'Volwassenen' : isEs ? 'Adultos' : 'Adults'}</p>
                                <p className="text-[11px] text-gray-500">18+</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setBookingFlow(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 active:bg-gray-100">
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold w-5 text-center">{bookingFlow.adults}</span>
                                <button onClick={() => setBookingFlow(p => ({ ...p, adults: Math.min(6, p.adults + 1) }))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 active:bg-gray-100">
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[13px] font-semibold text-gray-800">{isNl ? 'Kinderen' : isEs ? 'Niños' : 'Children'}</p>
                                <p className="text-[11px] text-gray-500">0-17</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setBookingFlow(p => ({ ...p, children: Math.max(0, p.children - 1) }))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 active:bg-gray-100">
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold w-5 text-center">{bookingFlow.children}</span>
                                <button onClick={() => setBookingFlow(p => ({ ...p, children: Math.min(4, p.children + 1) }))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 active:bg-gray-100">
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-primary font-medium flex items-center gap-1"><Users size={11} /> {totalPersons} {isNl ? 'personen' : isEs ? 'personas' : 'people'}</p>
                          </div>

                          {/* Caravan selection */}
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isNl ? 'Kies een caravan' : isEs ? 'Elige una caravana' : 'Choose a caravan'} ({availableCaravans.length})</p>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {availableCaravans.map(c => {
                                const price = Math.floor(bookingFlow.nights / 7) * c.pricePerWeek + (bookingFlow.nights % 7) * c.pricePerDay;
                                return (
                                  <button key={c.id} onClick={() => handleBookingCaravanSelect(c)}
                                    className={`w-full text-left rounded-lg overflow-hidden border transition-all active:scale-[0.98] ${
                                      bookingFlow.caravanId === c.id ? 'border-primary ring-1 ring-primary/30' : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <div className="flex gap-2.5">
                                      <div className="relative w-20 h-16 shrink-0">
                                        <Image src={c.photos[0]} alt={c.name} fill className="object-cover" />
                                      </div>
                                      <div className="py-1.5 pr-2 flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-800 truncate">{c.name}</p>
                                        <p className="text-[11px] text-gray-500">{c.maxPersons} pers · {c.type}</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                          <span className="text-[13px] font-bold text-primary">€{price}</span>
                                          <span className="text-[10px] text-gray-400">{bookingFlow.nights} {isNl ? 'nachten' : 'nights'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* STEP: CONTACT */}
                    {bookingFlow.step === 'contact' && (
                      <>
                        <div className="space-y-2">
                          <div className="relative">
                            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" value={bookingFlow.name} onChange={e => setBookingFlow(p => ({ ...p, name: e.target.value }))}
                              placeholder={isNl ? 'Volledige naam *' : isEs ? 'Nombre completo *' : 'Full name *'}
                              className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="email" value={bookingFlow.email} onChange={e => setBookingFlow(p => ({ ...p, email: e.target.value }))}
                              placeholder={isNl ? 'E-mailadres *' : isEs ? 'Correo electrónico *' : 'Email address *'}
                              className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="tel" value={bookingFlow.phone} onChange={e => setBookingFlow(p => ({ ...p, phone: e.target.value }))}
                              placeholder={isNl ? 'Telefoonnummer *' : isEs ? 'Teléfono *' : 'Phone number *'}
                              className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-[13px] border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
                          </div>
                        </div>
                        <button onClick={handleBookingContactConfirm}
                          disabled={!bookingFlow.name || !bookingFlow.email || !bookingFlow.phone}
                          className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                          {isNl ? 'Verder naar overzicht' : isEs ? 'Continuar' : 'Continue to summary'} <ArrowRight size={14} />
                        </button>
                      </>
                    )}

                    {/* STEP: SUMMARY */}
                    {bookingFlow.step === 'summary' && (() => {
                      const caravan = caravans.find(c => c.id === bookingFlow.caravanId);
                      return (
                        <>
                          <div className="space-y-1.5 text-[13px]">
                            <div className="flex items-center gap-2"><CalendarDays size={12} className="text-primary" /> <span>{bookingFlow.checkIn} – {bookingFlow.checkOut}</span></div>
                            <div className="flex items-center gap-2"><Tent size={12} className="text-primary" /> <span>{bookingFlow.campingName}</span></div>
                            <div className="flex items-center gap-2"><Users size={12} className="text-primary" /> <span>{bookingFlow.adults + bookingFlow.children} {isNl ? 'personen' : 'people'}</span></div>
                            {caravan && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm overflow-hidden relative shrink-0">
                                  <Image src={caravan.photos[0]} alt="" fill className="object-cover" />
                                </div>
                                <span>{caravan.name}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1.5">
                              <span className="font-semibold">{isNl ? 'Totaal' : 'Total'}</span>
                              <span className="font-bold text-primary text-base">€{bookingFlow.totalPrice}</span>
                            </div>
                          </div>

                          {/* Terms */}
                          <label className="flex items-start gap-2 cursor-pointer">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${bookingFlow.termsAccepted ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                              {bookingFlow.termsAccepted && <Check size={10} className="text-white" />}
                            </div>
                            <input type="checkbox" checked={bookingFlow.termsAccepted} onChange={e => setBookingFlow(p => ({ ...p, termsAccepted: e.target.checked }))} className="sr-only" />
                            <span className="text-[11px] text-gray-600">
                              {isNl ? 'Ik ga akkoord met de ' : isEs ? 'Acepto los ' : 'I agree to the '}
                              <a href="/voorwaarden" target="_blank" className="text-primary underline">{isNl ? 'voorwaarden' : isEs ? 'términos' : 'terms'}</a>
                              {isNl ? ' en het ' : isEs ? ' y la ' : ' and '}
                              <a href="/privacy" target="_blank" className="text-primary underline">{isNl ? 'privacybeleid' : isEs ? 'política de privacidad' : 'privacy policy'}</a>
                            </span>
                          </label>

                          {bookingFlow.error && (
                            <p className="text-[11px] text-red-500 font-medium">{bookingFlow.error}</p>
                          )}

                          <button onClick={handleBookingSubmit}
                            disabled={!bookingFlow.termsAccepted}
                            className="w-full py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            <CreditCard size={14} /> {isNl ? 'Boek & Betaal' : isEs ? 'Reservar y Pagar' : 'Book & Pay'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Booking processing spinner */}
              {bookingFlow.active && bookingFlow.step === 'processing' && (
                <div className="flex justify-center py-4">
                  <div className="bg-primary/5 rounded-xl px-4 py-3 flex items-center gap-2.5">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-[13px] font-medium text-primary">{isNl ? 'Boeking verwerken...' : isEs ? 'Procesando reserva...' : 'Processing booking...'}</span>
                  </div>
                </div>
              )}

              {/* Booking complete payment button */}
              {bookingFlow.active && bookingFlow.step === 'complete' && bookingFlow.paymentUrl && (
                <div className="mx-1">
                  <a href={bookingFlow.paymentUrl}
                    className="w-full py-3 bg-primary text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all">
                    <CreditCard size={16} /> {isNl ? 'Betaal nu via iDEAL/Wero' : isEs ? 'Pagar ahora' : 'Pay now'}
                  </a>
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
            className="fixed bottom-[7rem] right-[4.5rem] sm:bottom-[5.5rem] sm:right-24 z-[88] max-w-[200px] sm:max-w-[220px]"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 pr-8 relative cursor-pointer" onClick={() => { setIsOpen(true); setHasNewMessage(false); setBubbleDismissed(true); setShowBubble(false); }}>
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
        className={`fixed bottom-[5.5rem] right-4 sm:bottom-6 sm:right-6 z-[89] w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer safe-area-fab ${
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

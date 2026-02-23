'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

const faqCategories = [
  {
    category: 'Boeken & Betalen',
    items: [
      {
        q: 'Hoe boek ik een caravan?',
        a: 'Je kunt eenvoudig boeken via onze website. Kies een datum, camping en caravan, vul je gegevens in en verstuur je boekingsaanvraag. Je ontvangt direct een bevestiging per e-mail.',
      },
      {
        q: 'Hoeveel aanbetaling moet ik doen?',
        a: 'Bij boeking betaal je 30% aanbetaling. Dit kan per bankoverschrijving of cash. Het restbedrag (70%) betaal je uiterlijk 1 week voor aanvang via Stripe.',
      },
      {
        q: 'Welke betaalmethodes accepteren jullie?',
        a: 'Aanbetaling kan per bankoverschrijving of cash. Het restbedrag wordt veilig verwerkt via Stripe (creditcard, debitcard). In de toekomst voegen we meer methodes toe.',
      },
      {
        q: 'Hoe werkt de borgregeling?',
        a: 'Bij aankomst wordt een borg van €200-€500 (afhankelijk van de caravan) gereserveerd via Stripe. Na controle bij vertrek wordt de borg binnen 7 dagen teruggestort als er geen schade is.',
      },
      {
        q: 'Kan ik annuleren?',
        a: 'Ja, annuleren is mogelijk. Tot 30 dagen voor aankomst krijg je 100% van je aanbetaling terug. Tussen 14-30 dagen 50%. Minder dan 14 dagen voor aankomst is de aanbetaling niet restitueerbaar. Zie onze Algemene Voorwaarden voor details.',
      },
    ],
  },
  {
    category: 'De Caravans',
    items: [
      {
        q: 'Zijn dit nieuwe caravans?',
        a: 'Nee, wij verhuren goed onderhouden tweedehands caravans van bekende merken als Dethleffs, Tabbert en Knaus. Ze zijn 5-15 jaar oud maar in uitstekende staat.',
      },
      {
        q: 'Wat zit er allemaal in de caravan?',
        a: 'Elke caravan is voorzien van: dekbedden, kussens, volledig servies, kookgerei, handdoeken, toiletpapier, schoonmaakmiddelen, rolgordijnen en horren. Luxe caravans hebben ook airco, warmtepomp en TV.',
      },
      {
        q: 'Krijg ik precies de caravan die ik zie op de foto\'s?',
        a: 'We tonen foto\'s van de caravan of een vergelijkbaar model. De exacte caravan kan enigszins afwijken, maar is altijd van gelijkwaardig type en kwaliteitsniveau.',
      },
      {
        q: 'Mag ik huisdieren meenemen?',
        a: 'Dit is afhankelijk van de camping en de caravan. Neem contact met ons op om dit te bespreken. In sommige gevallen is het mogelijk tegen een kleine toeslag.',
      },
    ],
  },
  {
    category: 'Op de Camping',
    items: [
      {
        q: 'Op welke campings staan jullie caravans?',
        a: 'Wij werken samen met meer dan 30 campings verspreid over de volledige Costa Brava, van Blanes tot Cadaqués. Je kunt bij het boeken je gewenste camping selecteren.',
      },
      {
        q: 'Staat de caravan al klaar bij aankomst?',
        a: 'Ja! Dat is ons concept. De caravan is al geplaatst, schoongemaakt en volledig ingericht met inventaris. Je hoeft alleen in te checken en te genieten.',
      },
      {
        q: 'Hoe laat kan ik inchecken en uitchecken?',
        a: 'Check-in is vanaf 15:00 uur, check-out voor 11:00 uur. Afwijkende tijden zijn in overleg mogelijk.',
      },
      {
        q: 'Wat als er een probleem is met de caravan?',
        a: 'Je kunt ons 7 dagen per week bereiken via WhatsApp of telefoon. We zorgen zo snel mogelijk voor een oplossing, vaak al dezelfde dag.',
      },
    ],
  },
  {
    category: 'Transport & Extra\'s',
    items: [
      {
        q: 'Kan ik transport boeken voor mijn eigen caravan?',
        a: 'Ja, via ons moederbedrijf Caravanstalling-Spanje kun je transport boeken. Bezoek caravanstalling-spanje.com voor meer informatie.',
      },
      {
        q: 'Zijn er extra opties beschikbaar?',
        a: 'In de toekomst bieden we extra opties aan zoals fietsverhuur, BBQ-pakket en strandspullen. Neem contact op voor de huidige mogelijkheden.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
  };

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-dark via-primary to-cyan-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold mb-4">
            Veelgestelde vragen
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-cyan-100 text-lg max-w-2xl mx-auto">
            Vind snel antwoord op de meest gestelde vragen over onze caravans, het boekingsproces en meer.
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          {faqCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.1, duration: 0.5 }}
              className="mb-10"
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle size={22} className="text-primary" />
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="border border-border rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
                      >
                        <span className="font-medium text-foreground pr-4">{item.q}</span>
                        <ChevronDown
                          size={20}
                          className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-muted text-sm leading-relaxed border-t border-border pt-3">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* CTA */}
          <div className="bg-surface rounded-2xl p-8 text-center border border-border mt-12">
            <h3 className="text-xl font-bold text-foreground mb-2">Vraag niet gevonden?</h3>
            <p className="text-muted mb-6">Neem gerust contact met ons op. We helpen je graag verder!</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-full transition-all shadow-md"
            >
              Neem contact op
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

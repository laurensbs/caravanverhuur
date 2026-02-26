'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Truck,
  Heart,
  Users,
  Target,
  Award,
  Instagram,
  Facebook,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function OverOnsPage() {
  return (
    <>
      {/* Header */}
      <section className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1583946099379-25a3e4b29d8c?w=1920&q=80"
          alt="Costa Brava kust"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
              Over Ons
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/90 text-lg max-w-2xl mx-auto drop-shadow">
              Wij zijn Caravanverhuur Costa Brava – jouw partner voor een zorgeloze caravanvakantie aan de Spaanse kust.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Wat we doen */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Wie zijn wij</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-6">
                Zorgeloos op vakantie met een caravan
              </h2>
              <p className="text-muted text-lg mb-6 leading-relaxed">
                Caravanverhuur Costa Brava is ontstaan vanuit een simpel idee: <strong>iedereen moet kunnen genieten van een caravanvakantie, zonder het gedoe</strong>. 
                Geen transport regelen, geen caravan kopen, geen inventaris verzamelen. Wij regelen alles.
              </p>
              <p className="text-muted text-lg mb-6 leading-relaxed">
                Wij verhuren goed onderhouden, tweedehands caravans die al op de camping van jouw keuze klaarstaan. 
                Volledig ingericht met beddengoed, kookgerei, servies en alles wat je nodig hebt. Je stapt uit de auto en je vakantie begint.
              </p>
              <p className="text-muted text-lg leading-relaxed">
                Als onderdeel van <a href="https://caravanstalling-spanje.com" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Caravanstalling-Spanje</a> beschikken 
                wij over een uitgebreid netwerk van caravans en contacten op de mooiste campings van de Costa Brava.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&q=80"
                  alt="Costa Brava camping"
                  width={600}
                  height={400}
                  className="w-full object-cover"
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Voordelen vs concurrentie */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-accent font-semibold text-sm uppercase tracking-wider">
              Onze voordelen
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
              Waarom Caravanverhuur Costa Brava?
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: <Heart className="text-primary" size={28} />, title: 'Persoonlijke service', desc: 'Geen groot bedrijf maar persoonlijke aandacht. Je hebt altijd een vast aanspreekpunt.' },
              { icon: <Shield className="text-primary" size={28} />, title: 'Eerlijke prijzen', desc: 'Geen verborgen kosten. Wat je ziet is wat je betaalt, inclusief volledige inventaris.' },
              { icon: <Target className="text-primary" size={28} />, title: 'Lokale kennis', desc: 'Wij kennen de Costa Brava als geen ander en adviseren je graag over de beste campings.' },
              { icon: <Award className="text-primary" size={28} />, title: 'Kwaliteit gegarandeerd', desc: 'Elke caravan wordt voor vertrek gecontroleerd op inventaris, netheid en technische staat.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-border text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Proces */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Het proces</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">Van boeking tot vakantie</h2>
          </div>

          <div className="space-y-8">
            {[
              { step: '1', title: 'Je kiest een caravan en datum', desc: 'Bekijk ons aanbod, kies de caravan die bij je past en selecteer een camping op de Costa Brava.' },
              { step: '2', title: 'Aanbetaling van 30%', desc: 'Na het invullen van je gegevens betaal je 30% aanbetaling per bank of cash. Je boeking is nu bevestigd.' },
              { step: '3', title: 'Voorbereiding', desc: 'Wij zorgen ervoor dat jouw caravan wordt klaargezet op de camping, volledig schoongemaakt en uitgerust.' },
              { step: '4', title: 'Restbedrag betalen', desc: 'Een week voor je vakantie betaal je het restbedrag (70%) veilig via Stripe.' },
              { step: '5', title: 'Uitstappen en genieten!', desc: 'Je caravan staat klaar met volledige inventaris. Check in, installeer je en geniet van de Costa Brava!' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Moederbedrijf */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Truck className="text-primary" size={28} />
              <h2 className="text-2xl font-bold text-foreground">Onderdeel van Caravanstalling-Spanje</h2>
            </div>
            <p className="text-muted text-lg mb-6 max-w-2xl mx-auto">
              Caravanverhuur Costa Brava is onderdeel van Caravanstalling-Spanje, specialist in caravanstalling, transport en tweedehands caravans in Spanje. 
              Heb je een eigen caravan en wil je die laten transporteren? Dat kan via ons moederbedrijf.
            </p>
            <a
              href="https://caravanstalling-spanje.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all shadow-md"
            >
              Bezoek Caravanstalling-Spanje
              <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Cijfers & Sociaal bewijs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">In cijfers</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">Waarom gasten ons vertrouwen</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { number: '30+', label: 'Campings', sub: 'Verspreid over de Costa Brava' },
              { number: '6', label: 'Caravans', sub: 'Van compact tot luxe' },
              { number: '100+', label: 'Tevreden gasten', sub: 'Sinds 2024' },
              { number: '4.8/5', label: 'Beoordeling', sub: 'Gemiddelde score' },
            ].map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-border">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="font-semibold text-foreground text-sm">{stat.label}</div>
                <div className="text-xs text-muted mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Social media */}
          <div className="mt-12 text-center">
            <p className="text-muted text-sm mb-4">Volg ons voor updates, tips en foto&apos;s van de Costa Brava</p>
            <div className="flex justify-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                <Instagram size={22} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                <Facebook size={22} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-dark via-primary to-blue-400 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Overtuigd?</h2>
          <p className="text-blue-100 text-lg mb-8">Boek nu je zorgeloze caravanvakantie op de Costa Brava.</p>
          <Link
            href="/boeken"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-lg"
          >
            Direct boeken
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}

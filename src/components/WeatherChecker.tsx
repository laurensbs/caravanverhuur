'use client';

import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, ExternalLink, Thermometer } from 'lucide-react';

const weatherData = [
  { month: 'Apr', temp: 18, icon: 'sun-cloud', rain: 5 },
  { month: 'Mei', temp: 22, icon: 'sun', rain: 4 },
  { month: 'Jun', temp: 26, icon: 'sun', rain: 2 },
  { month: 'Jul', temp: 30, icon: 'sun', rain: 1 },
  { month: 'Aug', temp: 30, icon: 'sun', rain: 2 },
  { month: 'Sep', temp: 26, icon: 'sun-cloud', rain: 4 },
  { month: 'Okt', temp: 21, icon: 'sun-cloud', rain: 6 },
];

function WeatherIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'sun':
      return <Sun className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

export default function WeatherChecker() {
  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Weer Costa Brava</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
            Wanneer is het beste weer?
          </h2>
          <p className="text-muted mt-3 max-w-xl mx-auto text-sm sm:text-base">
            De Costa Brava geniet van een mediterraan klimaat met warme zomers en milde winters. Ideaal voor een caravanvakantie!
          </p>
        </motion.div>

        {/* Weather cards - horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center sm:flex-wrap scrollbar-hide"
        >
          {weatherData.map((w, i) => (
            <motion.div
              key={w.month}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="snap-center shrink-0 w-[100px] sm:w-[120px] bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{w.month}</div>
              <WeatherIcon
                type={w.icon}
                className={`mx-auto mb-2 ${
                  w.icon === 'sun' ? 'text-yellow-500' : 'text-cyan-400'
                }`}
              />
              <div className="flex items-center justify-center gap-1 mb-1">
                <Thermometer size={12} className="text-accent" />
                <span className="text-lg sm:text-xl font-bold text-foreground">{w.temp}°</span>
              </div>
              <div className="text-[10px] text-muted">{w.rain} regendagen</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Live weather link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-6 sm:mt-8"
        >
          <a
            href="https://www.google.com/search?q=weer+costa+brava+spanje"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary/5 hover:bg-primary/10 text-primary font-medium rounded-full transition-all duration-300 text-sm group"
          >
            <Sun size={16} className="group-hover:rotate-45 transition-transform duration-300" />
            Bekijk het actuele weer
            <ExternalLink size={14} />
          </a>
          <p className="text-xs text-muted mt-2">Via Google Weer — live en actueel</p>
        </motion.div>
      </div>
    </section>
  );
}

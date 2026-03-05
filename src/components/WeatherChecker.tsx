'use client';

import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, ExternalLink, Thermometer, Droplets } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

function WeatherIcon({ type, size = 24 }: { type: string; size?: number }) {
  switch (type) {
    case 'sun':
      return <Sun size={size} className="text-amber-400" />;
    case 'rain':
      return <CloudRain size={size} className="text-blue-400" />;
    case 'sun-cloud':
      return (
        <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
          <Sun size={size * 0.7} className="text-amber-400 absolute -top-0.5 -right-0.5" />
          <Cloud size={size * 0.75} className="text-slate-300 absolute -bottom-0.5 -left-0.5" />
        </span>
      );
    default:
      return <Cloud size={size} className="text-slate-300" />;
  }
}

export default function WeatherChecker() {
  const { t } = useLanguage();

  const weatherData = [
    { month: t('weather.apr'), temp: 18, icon: 'sun-cloud', rain: 5 },
    { month: t('weather.may'), temp: 22, icon: 'sun', rain: 4 },
    { month: t('weather.jun'), temp: 26, icon: 'sun', rain: 2 },
    { month: t('weather.jul'), temp: 30, icon: 'sun', rain: 1 },
    { month: t('weather.aug'), temp: 30, icon: 'sun', rain: 2 },
    { month: t('weather.sep'), temp: 26, icon: 'sun-cloud', rain: 4 },
    { month: t('weather.oct'), temp: 21, icon: 'sun-cloud', rain: 6 },
  ];

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
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t('weather.title')}</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
            {t('weather.bestWeather')}
          </h2>
          <p className="text-muted mt-3 max-w-xl mx-auto text-sm sm:text-base">
            {t('weather.checkerDesc')}
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
              className="snap-center shrink-0 w-[100px] sm:w-[120px] bg-white rounded-2xl p-3 sm:p-4 shadow-sm border transition-all duration-300 text-center"
            >
              <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{w.month}</div>
              <div className="flex items-center justify-center">
                <WeatherIcon type={w.icon} size={28} />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2 mb-1">
                <Thermometer size={12} className="text-orange-400" />
                <span className="text-lg sm:text-xl font-bold text-foreground">{w.temp}°</span>
              </div>
              <div className="text-xs text-muted flex items-center justify-center gap-0.5">
                <Droplets size={9} className="text-blue-300" />
                {w.rain} {t('weather.rainDays')}
              </div>
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
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary/5 text-primary font-medium rounded-full transition-all duration-300 text-sm group"
          >
            <Sun size={16} className="text-amber-400 transition-transform duration-300" />
            {t('weather.viewCurrentWeather')}
            <ExternalLink size={14} />
          </a>
          <p className="text-xs text-muted mt-2">{t('weather.viaGoogle')}</p>
        </motion.div>
      </div>
    </section>
  );
}

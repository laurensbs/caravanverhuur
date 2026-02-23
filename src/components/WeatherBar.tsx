'use client';

import { useState } from 'react';
import { Sun, Cloud, CloudRain, X, ExternalLink } from 'lucide-react';

// Approximate Costa Brava weather data by month
const weatherData: Record<number, { temp: number; icon: 'sun' | 'cloud' | 'rain'; desc: string }> = {
  1: { temp: 11, icon: 'cloud', desc: 'Bewolkt' },
  2: { temp: 12, icon: 'cloud', desc: 'Bewolkt' },
  3: { temp: 14, icon: 'sun', desc: 'Zonnig' },
  4: { temp: 17, icon: 'sun', desc: 'Zonnig' },
  5: { temp: 20, icon: 'sun', desc: 'Zonnig' },
  6: { temp: 25, icon: 'sun', desc: 'Zonnig' },
  7: { temp: 28, icon: 'sun', desc: 'Zonnig' },
  8: { temp: 28, icon: 'sun', desc: 'Zonnig' },
  9: { temp: 24, icon: 'sun', desc: 'Zonnig' },
  10: { temp: 19, icon: 'cloud', desc: 'Wisselend' },
  11: { temp: 14, icon: 'rain', desc: 'Regenachtig' },
  12: { temp: 12, icon: 'cloud', desc: 'Bewolkt' },
};

const icons = {
  sun: <Sun size={14} className="text-yellow-300" />,
  cloud: <Cloud size={14} className="text-cyan-200" />,
  rain: <CloudRain size={14} className="text-cyan-300" />,
};

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);
  const month = new Date().getMonth() + 1;
  const weather = weatherData[month];

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-primary via-cyan-500 to-primary-light text-white text-xs sm:text-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5">
          {icons[weather.icon]}
          <span className="font-medium">Costa Brava nu:</span>
          <span className="font-bold">{weather.temp}°C</span>
          <span className="hidden sm:inline text-white/80">— {weather.desc}</span>
        </div>
        <span className="text-white/60 hidden sm:inline">|</span>
        <a
          href="https://www.google.com/search?q=weer+costa+brava+spanje"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-yellow-200 transition-colors underline underline-offset-2"
        >
          <span className="hidden sm:inline">Bekijk</span> Weersvoorspelling
          <ExternalLink size={11} />
        </a>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 sm:right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Sluiten"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

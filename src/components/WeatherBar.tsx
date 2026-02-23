'use client';

import { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, X, ExternalLink } from 'lucide-react';

// Approximate Costa Brava weather data by month
const weatherData: Record<number, { temp: number; type: 'sun' | 'partly' | 'cloud' | 'drizzle' | 'rain' | 'snow'; desc: string }> = {
  1: { temp: 11, type: 'cloud', desc: 'Bewolkt' },
  2: { temp: 12, type: 'cloud', desc: 'Bewolkt' },
  3: { temp: 14, type: 'partly', desc: 'Wisselend bewolkt' },
  4: { temp: 17, type: 'sun', desc: 'Zonnig' },
  5: { temp: 20, type: 'sun', desc: 'Zonnig' },
  6: { temp: 25, type: 'sun', desc: 'Zonnig & warm' },
  7: { temp: 28, type: 'sun', desc: 'Zonnig & heet' },
  8: { temp: 28, type: 'sun', desc: 'Zonnig & heet' },
  9: { temp: 24, type: 'sun', desc: 'Zonnig' },
  10: { temp: 19, type: 'partly', desc: 'Wisselend' },
  11: { temp: 14, type: 'drizzle', desc: 'Regenachtig' },
  12: { temp: 12, type: 'cloud', desc: 'Bewolkt' },
};

const weatherConfig = {
  sun: {
    bg: 'bg-amber-400',
    text: 'text-amber-900',
    textMuted: 'text-amber-800/70',
    hoverText: 'hover:text-amber-950',
    closeBg: 'hover:bg-amber-500/30',
    icon: <Sun size={15} />,
  },
  partly: {
    bg: 'bg-sky-300',
    text: 'text-sky-900',
    textMuted: 'text-sky-800/70',
    hoverText: 'hover:text-sky-950',
    closeBg: 'hover:bg-sky-400/30',
    icon: <Cloud size={15} />,
  },
  cloud: {
    bg: 'bg-gray-400',
    text: 'text-gray-900',
    textMuted: 'text-gray-700',
    hoverText: 'hover:text-gray-950',
    closeBg: 'hover:bg-gray-500/30',
    icon: <Cloud size={15} />,
  },
  drizzle: {
    bg: 'bg-blue-400',
    text: 'text-blue-950',
    textMuted: 'text-blue-900/70',
    hoverText: 'hover:text-blue-950',
    closeBg: 'hover:bg-blue-500/30',
    icon: <CloudDrizzle size={15} />,
  },
  rain: {
    bg: 'bg-blue-500',
    text: 'text-blue-50',
    textMuted: 'text-blue-100/80',
    hoverText: 'hover:text-white',
    closeBg: 'hover:bg-blue-600/30',
    icon: <CloudRain size={15} />,
  },
  snow: {
    bg: 'bg-slate-200',
    text: 'text-slate-800',
    textMuted: 'text-slate-600',
    hoverText: 'hover:text-slate-900',
    closeBg: 'hover:bg-slate-300/50',
    icon: <CloudSnow size={15} />,
  },
};

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);
  const month = new Date().getMonth() + 1;
  const weather = weatherData[month];
  const config = weatherConfig[weather.type];

  if (!visible) return null;

  return (
    <div className={`${config.bg} ${config.text} text-xs sm:text-sm relative`}>
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5">
          {config.icon}
          <span className="font-medium">Costa Brava:</span>
          <span className="font-bold">{weather.temp}°C</span>
          <span className={`hidden sm:inline ${config.textMuted}`}>— {weather.desc}</span>
        </div>
        <span className={`${config.textMuted} hidden sm:inline`}>|</span>
        <a
          href="https://www.google.com/search?q=weer+costa+brava+spanje"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 ${config.hoverText} transition-colors underline underline-offset-2`}
        >
          <span className="hidden sm:inline">Bekijk</span> Weer
          <ExternalLink size={11} />
        </a>
        <button
          onClick={() => setVisible(false)}
          className={`absolute right-2 sm:right-4 p-1 ${config.closeBg} rounded-full transition-colors`}
          aria-label="Sluiten"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Sun } from 'lucide-react';

export default function WeatherBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-primary-dark via-primary to-sky-500 text-white text-xs sm:text-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
        <Sun size={14} className="text-amber-300 shrink-0 hidden sm:block" />
        <p className="text-center">
          <span className="font-semibold">Zomer 2026</span>
          <span className="text-white/50 mx-1.5 hidden sm:inline">•</span>
          <span className="text-white/85 hidden sm:inline">Nu boeken vanaf €450/week</span>
          <Link
            href="/boeken"
            className="ml-2 underline underline-offset-2 font-semibold hover:text-amber-200 transition-colors"
          >
            Bekijk aanbod →
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 p-1 hover:bg-white/15 rounded-full transition-colors"
          aria-label="Sluiten"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

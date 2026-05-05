// Lazy translation loader — bespaart ~150 KB JS naar elke client.
//
// NL is synchronously geïmporteerd omdat het de SSR-default is en
// >50% van bezoekers Nederlandstalig is. EN/ES worden via dynamic
// import opgehaald wanneer de gebruiker daadwerkelijk wisselt.
//
// Volume-impact (raw, vóór gzip):
//   - Vóór: één bundle van ~239 KB met alle 3 talen.
//   - Na:   NL bundle ~80 KB sync, EN/ES elk ~80 KB lazy.

import nl from './nl';
import type { Dict } from './types';
import type { Locale } from '../context';

// Synchronous NL — altijd direct beschikbaar, geen await.
export { nl };

// Cache van gelade dicts zodat één keer wisselen niet meerdere fetches doet.
const cache: Partial<Record<Locale, Dict>> = { nl };

export async function loadDictionary(locale: Locale): Promise<Dict> {
  if (cache[locale]) return cache[locale]!;
  const mod = locale === 'en'
    ? await import('./en')
    : locale === 'es'
      ? await import('./es')
      : null;
  const dict = mod?.default ?? nl;
  cache[locale] = dict;
  return dict;
}

// Re-export voor backwards-compat met code die nog
// `import { dictionaries } from '@/i18n/translations'` gebruikte.
// Bevat alleen NL synchronously; gebruik loadDictionary() voor EN/ES.
export const dictionaries: Record<Locale, Dict> = {
  nl,
  en: nl, // placeholder — wordt vervangen wanneer EN geladen is
  es: nl, // placeholder
};

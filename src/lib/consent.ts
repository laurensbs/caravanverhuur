// Granular cookie/tracking consent. Single source of truth for the
// cookie banner + any future analytics/marketing scripts.
//
// Categories follow the standard GDPR breakdown:
//   - functional: required for the site to operate (auth, language, basket).
//                 Always granted. Can't be opted out — these aren't tracking.
//   - analytics:  Plausible/GA/Umami/Sentry replay etc. — measure usage.
//   - marketing:  ad pixels, retargeting (Meta, Google Ads, ...).
//
// Storage: localStorage key 'cookie-consent-v2' as JSON (we keep the
// legacy 'cookie-consent' string in code for back-compat detection so
// returning users with the old key get a re-prompt to refine choices).

import { useEffect, useState } from 'react';

export type ConsentCategory = 'functional' | 'analytics' | 'marketing';

export interface ConsentState {
  functional: true;
  analytics: boolean;
  marketing: boolean;
  // ISO timestamp when the user last made a choice. Used to re-prompt
  // periodically (legal: consent should be refreshed at most ~12 months).
  decidedAt: string;
}

const STORAGE_KEY = 'cookie-consent-v2';
const LEGACY_KEY = 'cookie-consent';
const CONSENT_EVENT = 'consent-changed';
// Re-prompt after this many days even if the user already chose.
const REFRESH_AFTER_DAYS = 365;

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed.decidedAt) return null;
    const ageMs = Date.now() - new Date(parsed.decidedAt).getTime();
    if (ageMs > REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000) return null;
    return { ...parsed, functional: true };
  } catch {
    return null;
  }
}

export function writeConsent(state: Omit<ConsentState, 'functional' | 'decidedAt'>): ConsentState {
  const full: ConsentState = {
    functional: true,
    analytics: !!state.analytics,
    marketing: !!state.marketing,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  // Drop the legacy single-string key so we never re-prompt a v2 user.
  localStorage.removeItem(LEGACY_KEY);
  // Notify any listening scripts (analytics loader, etc.) so they can
  // load/unload without a page-reload.
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: full }));
  return full;
}

// React hook: returns current consent + a setter. Re-renders when the
// consent state changes (own writeConsent or another tab via storage event).
export function useConsent(): {
  consent: ConsentState | null;
  setConsent: (next: Omit<ConsentState, 'functional' | 'decidedAt'>) => void;
} {
  const [consent, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    setState(readConsent());

    const onChange = () => setState(readConsent());
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return {
    consent,
    setConsent: (next) => setState(writeConsent(next)),
  };
}

// Helper for one-shot category checks in non-React code. Use sparingly;
// prefer useConsent() in components.
export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'functional') return true;
  const c = readConsent();
  return !!c?.[category];
}

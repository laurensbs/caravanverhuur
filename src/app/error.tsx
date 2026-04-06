'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

const errorTranslations: Record<string, { title: string; desc: string; retry: string }> = {
  nl: { title: 'Er is iets misgegaan', desc: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.', retry: 'Opnieuw proberen' },
  en: { title: 'Something went wrong', desc: 'An unexpected error occurred. Please try again.', retry: 'Try again' },
  es: { title: 'Algo salió mal', desc: 'Se produjo un error inesperado. Por favor, inténtelo de nuevo.', retry: 'Reintentar' },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  let lang = 'nl';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale } = useLanguage();
    lang = locale;
  } catch {
    // Context may not be available in error boundary
  }
  const t = errorTranslations[lang] || errorTranslations.nl;

  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {t.title}
        </h2>
        <p className="text-muted mb-6">
          {t.desc}
        </p>
        <button
          onClick={reset}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
}

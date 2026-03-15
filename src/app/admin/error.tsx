'use client';

import { useEffect } from 'react';
import { useAdmin } from '@/i18n/admin-context';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  let t: (k: string) => string;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ({ t } = useAdmin());
  } catch {
    t = (k: string) => {
      const fallback: Record<string, string> = {
        'common.error': 'Er is een fout opgetreden',
        'common.errorDesc': 'Probeer het opnieuw of neem contact op met de beheerder.',
        'common.retry': 'Opnieuw proberen',
      };
      return fallback[k] || k;
    };
  }

  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          {t('common.error')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('common.errorDesc')}
        </p>
        <button
          onClick={reset}
          className="bg-primary-dark text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          {t('common.retry')}
        </button>
      </div>
    </div>
  );
}

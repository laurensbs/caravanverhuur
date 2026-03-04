'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { LanguageProvider } from '@/i18n/context';
import { dictionaries } from '@/i18n/translations';

export function LayoutWrapper({
  children,
  header,
  footer,
  scrollToTop,
  cookieConsent,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  scrollToTop: ReactNode;
  cookieConsent: ReactNode;
}) {
  const pathname = usePathname();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    setIsAdminSubdomain(window.location.hostname.startsWith('admin.'));
  }, []);

  const isAdmin = pathname.startsWith('/admin') || isAdminSubdomain;
  const isBorg = pathname.startsWith('/borg');

  if (isAdmin || isBorg) {
    return <>{children}</>;
  }

  return (
    <LanguageProvider dictionaries={dictionaries}>
      {header}
      <main className="min-h-screen">{children}</main>
      {footer}
      {scrollToTop}
      {cookieConsent}
    </LanguageProvider>
  );
}

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

  // Admin pages: no header/footer/cookie, no LanguageProvider
  if (isAdmin) {
    return <>{children}</>;
  }

  // Borg pages: need LanguageProvider for translations, but no header/footer
  if (isBorg) {
    return (
      <LanguageProvider dictionaries={dictionaries}>
        {children}
      </LanguageProvider>
    );
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

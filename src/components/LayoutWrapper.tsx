'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/i18n/context';
import { dictionaries } from '@/i18n/translations';
import { DataProvider } from '@/lib/data-context';
import dynamic from 'next/dynamic';

const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false });

function HtmlLangSync() {
  const { locale } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export function LayoutWrapper({
  children,
  header,
  footer,
  cookieConsent,
  isAdminSubdomain = false,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  cookieConsent: ReactNode;
  isAdminSubdomain?: boolean;
}) {
  const pathname = usePathname();

  const isPayment = pathname.startsWith('/betaling');
  // Payment pages moeten LanguageProvider hebben — ook als ze worden geserveerd
  // op een admin-subdomein (Stripe redirect kan vanaf admin.* terugkomen).
  const isAdmin = (pathname.startsWith('/admin') || isAdminSubdomain) && !isPayment;
  const isDriver = pathname.startsWith('/chauffeur');
  const isBorg = pathname.startsWith('/borg');

  // Admin pages: no header/footer/cookie, no LanguageProvider
  if (isAdmin) {
    return <>{children}</>;
  }

  // Driver pages: own layout, no header/footer/cookie/dataProvider
  if (isDriver) {
    return <>{children}</>;
  }

  // Borg pages: need LanguageProvider for translations, but no header/footer
  if (isBorg) {
    return (
      <LanguageProvider dictionaries={dictionaries}>
        <HtmlLangSync />
        {children}
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider dictionaries={dictionaries}>
      <DataProvider>
        <HtmlLangSync />
        {header}
        <main className="min-h-screen">{children}</main>
        {footer}
        {cookieConsent}
        <ChatBot />
      </DataProvider>
    </LanguageProvider>
  );
}

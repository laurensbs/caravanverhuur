'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/i18n/context';
import { dictionaries } from '@/i18n/translations';
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
        <HtmlLangSync />
        {children}
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider dictionaries={dictionaries}>
      <HtmlLangSync />
      {header}
      <main className="min-h-screen">{children}</main>
      {footer}
      {scrollToTop}
      {cookieConsent}
      <ChatBot />
    </LanguageProvider>
  );
}

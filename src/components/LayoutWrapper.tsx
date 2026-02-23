'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

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
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="min-h-screen">{children}</main>
      {footer}
      {scrollToTop}
      {cookieConsent}
    </>
  );
}

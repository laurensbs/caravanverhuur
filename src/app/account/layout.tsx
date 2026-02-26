import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inloggen | Caravanverhuur Costa Brava',
  description:
    'Log in op je account of registreer je bij Caravanverhuur Costa Brava. Bekijk je boekingen, betalingen en borgstatus.',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}

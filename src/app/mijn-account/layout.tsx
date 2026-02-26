import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mijn Account | Caravanverhuur Costa Brava',
  description:
    'Beheer je boekingen, betalingen en borgstatus in je persoonlijke klantportaal.',
  robots: { index: false, follow: false },
};

export default function MijnAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}

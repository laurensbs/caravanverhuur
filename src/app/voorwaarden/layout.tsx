import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden | Caravanverhuur Costa Brava',
  description: 'Lees de algemene voorwaarden van Caravanverhuur Costa Brava. Boekingsvoorwaarden, annulering en huurovereenkomst.',
  alternates: { canonical: '/voorwaarden' },
  openGraph: {
    title: 'Algemene Voorwaarden – Caravanverhuur Costa Brava',
    description: 'Boekingsvoorwaarden, annulering en huurovereenkomst.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Algemene Voorwaarden – Caravanverhuur Costa Brava',
    description: 'Boekingsvoorwaarden, annulering en huurovereenkomst.',
  },
};

export default function VoorwaardenLayout({ children }: { children: React.ReactNode }) {
  return children;
}

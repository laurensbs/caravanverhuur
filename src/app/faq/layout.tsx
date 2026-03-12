import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veelgestelde Vragen (FAQ) | Caravanverhuur Costa Brava',
  description:
    'Antwoorden op veelgestelde vragen over caravan huren aan de Costa Brava. Boeken, betalen, borgregeling, campings en meer.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQ – Caravanverhuur Costa Brava',
    description:
      'Antwoorden op veelgestelde vragen over caravan huren aan de Costa Brava.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ – Caravanverhuur Costa Brava',
    description: 'Antwoorden op veelgestelde vragen over caravan huren aan de Costa Brava.',
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}

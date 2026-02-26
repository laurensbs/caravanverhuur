import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Over Ons | Caravanverhuur Costa Brava',
  description:
    'Leer meer over Caravanverhuur Costa Brava. Ons verhaal, ons team en waarom wij de beste keuze zijn voor je vakantie aan de Costa Brava.',
  openGraph: {
    title: 'Over Ons – Caravanverhuur Costa Brava',
    description:
      'Leer meer over Caravanverhuur Costa Brava. Ons verhaal en ons team.',
  },
};

export default function OverOnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onze Caravans | Caravanverhuur Costa Brava',
  description:
    'Bekijk ons aanbod van luxe stacaravans aan de Costa Brava. Van gezellige 2-persoons tot ruime familiecaravans met airco. Vanaf €45/dag.',
  openGraph: {
    title: 'Onze Caravans – Caravanverhuur Costa Brava',
    description:
      'Bekijk ons aanbod van luxe stacaravans aan de Costa Brava. Vanaf €45/dag.',
  },
};

export default function CaravansLayout({ children }: { children: React.ReactNode }) {
  return children;
}

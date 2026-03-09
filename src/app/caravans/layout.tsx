import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onze Caravans | Caravanverhuur Costa Brava',
  description:
    'Bekijk ons aanbod van luxe stacaravans aan de Costa Brava. Van gezellige 2-persoons tot ruime familiecaravans met airco. Vanaf €45/dag.',
  alternates: { canonical: '/caravans', languages: { nl: '/caravans', en: '/caravans', es: '/caravans', 'x-default': '/caravans' } },
  openGraph: {
    title: 'Onze Caravans – Caravanverhuur Costa Brava',
    description:
      'Bekijk ons aanbod van luxe stacaravans aan de Costa Brava. Vanaf €45/dag.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Onze Caravans – Caravanverhuur Costa Brava',
    description: 'Bekijk ons aanbod van luxe stacaravans aan de Costa Brava. Vanaf €45/dag.',
  },
};

export default function CaravansLayout({ children }: { children: React.ReactNode }) {
  return children;
}

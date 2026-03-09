import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boek je Caravan | Caravanverhuur Costa Brava',
  description:
    'Boek direct je stacaravan aan de Costa Brava. Kies je datum, camping en caravan. Eenvoudig online boeken met bevestiging per e-mail.',
  alternates: { canonical: '/boeken', languages: { nl: '/boeken', en: '/boeken', es: '/boeken', 'x-default': '/boeken' } },
  openGraph: {
    title: 'Direct Boeken – Caravanverhuur Costa Brava',
    description:
      'Boek direct je stacaravan aan de Costa Brava. Eenvoudig online boeken.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Direct Boeken – Caravanverhuur Costa Brava',
    description: 'Boek direct je stacaravan aan de Costa Brava. Eenvoudig online boeken.',
  },
};

export default function BoekenLayout({ children }: { children: React.ReactNode }) {
  return children;
}

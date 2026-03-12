import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacybeleid | Caravanverhuur Costa Brava',
  description: 'Lees ons privacybeleid. Hoe wij omgaan met je persoonsgegevens bij Caravanverhuur Costa Brava.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacybeleid – Caravanverhuur Costa Brava',
    description: 'Lees ons privacybeleid. Hoe wij omgaan met je persoonsgegevens.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacybeleid – Caravanverhuur Costa Brava',
    description: 'Lees ons privacybeleid. Hoe wij omgaan met je persoonsgegevens.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

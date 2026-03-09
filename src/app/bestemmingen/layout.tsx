import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bestemmingen Costa Brava | Caravanverhuur Costa Brava',
  description: 'Ontdek de mooiste plaatsen aan de Costa Brava. Van Cadaqués tot Lloret de Mar — vind jouw perfecte vakantiebestemming.',
  alternates: { canonical: '/bestemmingen', languages: { nl: '/bestemmingen', en: '/bestemmingen', es: '/bestemmingen', 'x-default': '/bestemmingen' } },
  openGraph: {
    title: 'Bestemmingen – Caravanverhuur Costa Brava',
    description: 'Ontdek 8 prachtige bestemmingen aan de Costa Brava voor je caravanvakantie.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bestemmingen – Caravanverhuur Costa Brava',
    description: 'Ontdek de mooiste plaatsen aan de Costa Brava voor je caravanvakantie.',
  },
};

export default function DestinatiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campings Costa Brava | Alle Aangesloten Campings | Caravanverhuur Costa Brava',
  description: 'Bekijk alle aangesloten campings aan de Costa Brava. Van luxe resorts tot gezellige familiecampings — kies jouw ideale camping en ontdek de omgeving.',
  alternates: { canonical: '/bestemmingen', languages: { nl: '/bestemmingen', en: '/bestemmingen', es: '/bestemmingen', 'x-default': '/bestemmingen' } },
  openGraph: {
    title: 'Campings Costa Brava – Caravanverhuur Costa Brava',
    description: 'Ontdek 30+ aangesloten campings aan de Costa Brava. Bekijk faciliteiten, foto\'s en plaatsen in de omgeving.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campings Costa Brava – Caravanverhuur Costa Brava',
    description: 'Alle aangesloten campings aan de Costa Brava voor je caravanvakantie. Bekijk faciliteiten en boek direct.',
  },
};

export default function DestinatiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

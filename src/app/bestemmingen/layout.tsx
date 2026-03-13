import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bestemmingen & Campings Costa Brava | Caravan Huren Spanje',
  description: 'Ontdek 30+ campings, 14 kustdorpen en de mooiste stranden aan de Costa Brava. Vind jouw ideale bestemming en boek een volledig ingerichte caravan voor een zorgeloze vakantie.',
  alternates: { canonical: '/bestemmingen' },
  openGraph: {
    title: 'Bestemmingen & Campings Costa Brava — Caravanverhuur Spanje',
    description: 'Van middeleeuwse dorpjes tot luxe campingresorts: ontdek alle bestemmingen aan de Costa Brava en boek direct je caravan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bestemmingen & Campings Costa Brava — Caravanverhuur Spanje',
    description: 'Campings, kustdorpen, stranden en bezienswaardigheden aan de Costa Brava. Boek een luxe caravan en geniet.',
  },
};

export default function DestinatiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

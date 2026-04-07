import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onze Caravans — Luxe Stacaravans aan de Costa Brava | Caravan Huren Spanje',
  description: 'Bekijk onze volledig ingerichte stacaravans op de mooiste campings aan de Costa Brava. Moderne caravans met airco, groot terras en alles wat je nodig hebt voor een zorgeloze vakantie.',
  alternates: { canonical: '/caravans' },
};

export default function CaravansLayout({ children }: { children: React.ReactNode }) {
  return children;
}

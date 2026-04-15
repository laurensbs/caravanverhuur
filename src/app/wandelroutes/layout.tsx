import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wandelroutes Costa Brava | Caravanverhuur Spanje',
  description: 'Ontdek de mooiste wandelroutes aan de Costa Brava. Van kustpaden tot bergwandelingen. Bekijk routes op AllTrails, voeg toe aan Google Maps en sla op in je account.',
  openGraph: {
    title: 'Wandelroutes Costa Brava',
    description: 'Ontdek de mooiste wandelroutes aan de Costa Brava.',
  },
  alternates: {
    canonical: '/wandelroutes',
  },
};

export default function WandelroutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

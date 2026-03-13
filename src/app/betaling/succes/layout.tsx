import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Betaling geslaagd | Caravanverhuur Costa Brava',
  description: 'Je betaling is succesvol verwerkt. Bedankt voor je boeking bij Caravanverhuur Costa Brava.',
  robots: { index: false, follow: false },
};

export default function BetalingSuccesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

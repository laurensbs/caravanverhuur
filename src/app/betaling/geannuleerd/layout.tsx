import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Betaling geannuleerd | Caravanverhuur Costa Brava',
  description: 'Je betaling is geannuleerd. Probeer het opnieuw of neem contact op met Caravanverhuur Costa Brava.',
  robots: { index: false, follow: false },
};

export default function BetalingGeannuleerdLayout({ children }: { children: React.ReactNode }) {
  return children;
}

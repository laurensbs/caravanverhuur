import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Caravanverhuur Costa Brava',
  description:
    'Neem contact op met Caravanverhuur Costa Brava. Stel je vraag via e-mail, telefoon of WhatsApp. We reageren binnen 24 uur.',
  openGraph: {
    title: 'Contact – Caravanverhuur Costa Brava',
    description:
      'Neem contact op met Caravanverhuur Costa Brava. We reageren binnen 24 uur.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

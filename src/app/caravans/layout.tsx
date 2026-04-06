import { redirect } from 'next/navigation';

export default function CaravansLayout({ children }: { children: React.ReactNode }) {
  redirect('/');
  return children;
}

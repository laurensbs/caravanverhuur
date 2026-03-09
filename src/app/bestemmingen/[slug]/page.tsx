import { Metadata } from 'next';
import { destinations, getDestinationBySlug } from '@/data/destinations';
import { notFound } from 'next/navigation';
import DestinationDetailContent from './DestinationDetailContent';

export async function generateStaticParams() {
  return destinations.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);
  if (!dest) return { title: 'Not found' };
  return {
    title: `${dest.name} — Costa Brava | Caravanverhuur`,
    description: dest.description.slice(0, 160),
    openGraph: {
      title: `${dest.name} — Caravanverhuur Costa Brava`,
      description: dest.description.slice(0, 160),
      images: [dest.heroImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dest.name} — Caravanverhuur Costa Brava`,
      description: dest.description.slice(0, 160),
      images: [dest.heroImage],
    },
    alternates: { canonical: `/bestemmingen/${slug}`, languages: { nl: `/bestemmingen/${slug}`, en: `/bestemmingen/${slug}`, es: `/bestemmingen/${slug}`, 'x-default': `/bestemmingen/${slug}` } },
  };
}

export default async function DestinationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);
  if (!dest) notFound();

  const otherDestinations = destinations.filter(d => d.id !== dest.id).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: dest.name,
    description: dest.description,
    image: dest.heroImage,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: dest.coordinates.lat,
      longitude: dest.coordinates.lng,
    },
    containedInPlace: {
      '@type': 'Place',
      name: 'Costa Brava, Spain',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DestinationDetailContent dest={dest} otherDestinations={otherDestinations} />
    </>
  );
}

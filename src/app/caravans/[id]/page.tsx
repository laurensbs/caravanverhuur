import type { Metadata } from 'next';
import { getCaravanById, caravans } from '@/data/caravans';
import CaravanDetailContent from './CaravanDetailContent';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const caravan = getCaravanById(id);
  if (!caravan) {
    return { title: 'Caravan niet gevonden | Caravanverhuur Costa Brava' };
  }

  const title = `${caravan.name} huren | Caravanverhuur Costa Brava`;
  const description = `Huur de ${caravan.name} (${caravan.type.toLowerCase()}, max ${caravan.maxPersons} pers.) op de Costa Brava. ${caravan.description.slice(0, 120)}… Vanaf €${caravan.pricePerDay}/dag.`;

  return {
    title,
    description,
    alternates: { canonical: `/caravans/${id}` },
    openGraph: {
      title,
      description,
      url: `https://caravanverhuurspanje.com/caravans/${id}`,
      images: caravan.photos.map((url, i) => ({
        url,
        width: 1200,
        height: 630,
        alt: `${caravan.name} foto ${i + 1}`,
      })),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [caravan.photos[0]],
    },
  };
}

export function generateStaticParams() {
  return caravans.map((c) => ({ id: c.id }));
}

export default async function CaravanDetailPage({ params }: Props) {
  const { id } = await params;
  const caravan = getCaravanById(id);

  // Product + Offer JSON-LD for rich results
  const jsonLd = caravan ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: caravan.name,
    description: caravan.description,
    image: caravan.photos,
    brand: { '@type': 'Brand', name: caravan.manufacturer },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: caravan.pricePerDay,
      priceValidUntil: '2026-12-31',
      availability: caravan.status === 'BESCHIKBAAR'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://caravanverhuurspanje.com/caravans/${id}`,
      unitCode: 'DAY',
    },
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://caravanverhuurspanje.com' },
      { '@type': 'ListItem', position: 2, name: 'Caravans', item: 'https://caravanverhuurspanje.com/caravans' },
      ...(caravan ? [{ '@type': 'ListItem', position: 3, name: caravan.name, item: `https://caravanverhuurspanje.com/caravans/${id}` }] : []),
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <CaravanDetailContent id={id} />
    </>
  );
}

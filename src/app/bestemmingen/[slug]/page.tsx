import { Metadata } from 'next';
import { campings, getCampingBySlug } from '@/data/campings';
import { destinations, getDestinationBySlug } from '@/data/destinations';
import { notFound } from 'next/navigation';
import CampingDetailContent from './CampingDetailContent';
import DestinationDetailContent from './DestinationDetailContent';

export async function generateStaticParams() {
  const campingParams = campings.map(c => ({ slug: c.slug }));
  const destinationParams = destinations.map(d => ({ slug: d.slug }));
  return [...campingParams, ...destinationParams];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const camping = getCampingBySlug(slug);

  if (camping) {
    const title = `${camping.name} — ${camping.location}, Costa Brava | Caravanverhuur`;
    const description = `${camping.description} Boek nu je caravan op ${camping.name} in ${camping.location}. ${camping.facilities?.slice(0, 4).join(', ')}.`.slice(0, 160);

    return {
      title,
      description,
      openGraph: {
        title: `${camping.name} — Caravanverhuur Costa Brava`,
        description,
        images: camping.photos?.[0] ? [camping.photos[0]] : ['/og-image.jpg'],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${camping.name} — Caravanverhuur Costa Brava`,
        description,
        images: camping.photos?.[0] ? [camping.photos[0]] : ['/og-image.jpg'],
      },
      alternates: {
        canonical: `/bestemmingen/${slug}`,
        languages: { nl: `/bestemmingen/${slug}`, en: `/bestemmingen/${slug}`, es: `/bestemmingen/${slug}`, 'x-default': `/bestemmingen/${slug}` },
      },
    };
  }

  const destination = getDestinationBySlug(slug);
  if (destination) {
    const title = `${destination.name} — ${destination.region}, Costa Brava | Caravanverhuur`;
    const description = destination.description.slice(0, 160);

    return {
      title,
      description,
      openGraph: {
        title: `${destination.name} — Costa Brava`,
        description,
        images: [destination.heroImage],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${destination.name} — Costa Brava`,
        description,
        images: [destination.heroImage],
      },
      alternates: {
        canonical: `/bestemmingen/${slug}`,
        languages: { nl: `/bestemmingen/${slug}`, en: `/bestemmingen/${slug}`, es: `/bestemmingen/${slug}`, 'x-default': `/bestemmingen/${slug}` },
      },
    };
  }

  return { title: 'Not found' };
}

export default async function CampingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try camping first
  const camping = getCampingBySlug(slug);
  if (camping) {
    const nearbyDestinations = (camping.nearestDestinations || [])
      .map(s => getDestinationBySlug(s))
      .filter(Boolean);

    const otherCampings = campings
      .filter(c => c.id !== camping.id && c.region === camping.region)
      .slice(0, 3);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Campground',
      name: camping.name,
      description: camping.longDescription || camping.description,
      image: camping.photos?.[0],
      address: {
        '@type': 'PostalAddress',
        addressLocality: camping.location,
        addressRegion: camping.region,
        addressCountry: 'ES',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: camping.coordinates?.lat,
        longitude: camping.coordinates?.lng,
      },
      amenityFeature: (camping.facilities || []).map(f => ({
        '@type': 'LocationFeatureSpecification',
        name: f,
        value: true,
      })),
      ...(camping.website && { url: camping.website }),
      containedInPlace: {
        '@type': 'Place',
        name: 'Costa Brava, Spain',
      },
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://caravanverhuurspanje.com' },
        { '@type': 'ListItem', position: 2, name: 'Bestemmingen', item: 'https://caravanverhuurspanje.com/bestemmingen' },
        { '@type': 'ListItem', position: 3, name: camping.name, item: `https://caravanverhuurspanje.com/bestemmingen/${slug}` },
      ],
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <CampingDetailContent
          camping={camping}
          nearbyDestinations={nearbyDestinations as typeof destinations}
          otherCampings={otherCampings}
        />
      </>
    );
  }

  // Try destination
  const destination = getDestinationBySlug(slug);
  if (destination) {
    // Find campings near this destination
    const nearbyCampings = campings
      .filter(c => (c.nearestDestinations || []).includes(destination.slug) || c.region === destination.region)
      .slice(0, 6);

    // Find other destinations in the same region
    const otherDestinations = destinations
      .filter(d => d.id !== destination.id && d.region === destination.region)
      .slice(0, 4);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: destination.name,
      description: destination.longDescription || destination.description,
      image: destination.heroImage,
      address: {
        '@type': 'PostalAddress',
        addressLocality: destination.name,
        addressRegion: destination.region,
        addressCountry: 'ES',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: destination.coordinates.lat,
        longitude: destination.coordinates.lng,
      },
      containedInPlace: {
        '@type': 'Place',
        name: 'Costa Brava, Spain',
      },
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://caravanverhuurspanje.com' },
        { '@type': 'ListItem', position: 2, name: 'Bestemmingen', item: 'https://caravanverhuurspanje.com/bestemmingen' },
        { '@type': 'ListItem', position: 3, name: destination.name, item: `https://caravanverhuurspanje.com/bestemmingen/${slug}` },
      ],
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <DestinationDetailContent
          destination={destination}
          nearbyCampings={nearbyCampings}
          otherDestinations={otherDestinations}
        />
      </>
    );
  }

  notFound();
}

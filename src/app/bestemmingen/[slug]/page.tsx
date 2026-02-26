import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { destinations, getDestinationBySlug } from '@/data/destinations';
import { MapPin, ArrowRight, Sun, Droplets, Lightbulb, ChevronRight, Tent, Star, Heart } from 'lucide-react';

export async function generateStaticParams() {
  return destinations.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);
  if (!dest) return { title: 'Niet gevonden' };
  return {
    title: `${dest.name} — Costa Brava | Caravanverhuur`,
    description: dest.description.slice(0, 160),
    openGraph: {
      title: `${dest.name} — Caravanverhuur Costa Brava`,
      description: dest.description.slice(0, 160),
      images: [dest.heroImage],
    },
  };
}

export default async function DestinationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = getDestinationBySlug(slug);
  if (!dest) notFound();

  const otherDestinations = destinations.filter(d => d.id !== dest.id).slice(0, 3);

  // JSON-LD for SEO
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
      name: 'Costa Brava, Spanje',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
          <Image
            src={dest.heroImage}
            alt={dest.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-3">
                <Link href="/" className="hover:text-white">Home</Link>
                <ChevronRight size={12} />
                <Link href="/bestemmingen" className="hover:text-white">Bestemmingen</Link>
                <ChevronRight size={12} />
                <span className="text-white">{dest.name}</span>
              </nav>
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-1">{dest.name}</h1>
              <div className="flex items-center gap-3 text-white/80 text-sm">
                <span className="flex items-center gap-1"><MapPin size={14} />{dest.region}</span>
                <span className="flex items-center gap-1"><Sun size={14} />{dest.weather.summer}</span>
                <span className="flex items-center gap-1"><Droplets size={14} />Zee: {dest.weather.water}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Over {dest.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{dest.description}</p>
              </div>

              {/* Highlights */}
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star size={18} className="text-primary" />
                  Highlights
                </h2>
                <div className="space-y-3">
                  {dest.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="text-sm text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel tip */}
              <div className="bg-amber-50 rounded-2xl p-5 sm:p-6 flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Lightbulb size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 text-sm mb-1">Insider tip</h3>
                  <p className="text-sm text-amber-700 leading-relaxed">{dest.travelTip}</p>
                </div>
              </div>

              {/* Nearby campings */}
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Tent size={18} className="text-primary" />
                  Campings bij {dest.name}
                </h2>
                <div className="space-y-2">
                  {dest.nearestCampings.map(c => (
                    <div key={c} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick info card */}
              <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32">
                <h3 className="font-bold text-gray-800 mb-4">Praktische info</h3>
                
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Regio</span>
                    <span className="font-medium text-gray-800">{dest.region}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Zomertemperatuur</span>
                    <span className="font-medium text-gray-800">{dest.weather.summer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Watertemperatuur</span>
                    <span className="font-medium text-gray-800">{dest.weather.water}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Campings</span>
                    <span className="font-medium text-gray-800">{dest.nearestCampings.length} nabij</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {dest.bestFor.map(tag => (
                    <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Heart size={10} /> {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href="/boeken"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors active:scale-[0.98]"
                >
                  Boek bij {dest.name} <ArrowRight size={16} />
                </Link>
              </div>

              {/* Other destinations */}
              <div className="bg-white rounded-2xl p-5">
                <h3 className="font-bold text-gray-800 mb-3">Andere bestemmingen</h3>
                <div className="space-y-2">
                  {otherDestinations.map(d => (
                    <Link
                      key={d.id}
                      href={`/bestemmingen/${d.slug}`}
                      className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">{d.name}</div>
                        <div className="text-xs text-gray-400">{d.region}</div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </Link>
                  ))}
                  <Link href="/bestemmingen" className="block text-center text-sm text-primary font-medium pt-2">
                    Alle bestemmingen →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

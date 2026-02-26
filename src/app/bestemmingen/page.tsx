import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { destinations } from '@/data/destinations';
import { MapPin, ArrowRight, Sun, Users, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bestemmingen Costa Brava | Caravanverhuur Costa Brava',
  description: 'Ontdek de mooiste plaatsen aan de Costa Brava. Van Cadaqués tot Lloret de Mar — vind jouw perfecte vakantiebestemming.',
};

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&q=80"
            alt="Costa Brava"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:py-20 text-center">
          <span className="text-white/60 font-semibold text-xs uppercase tracking-wider">Ontdek de Costa Brava</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 mb-3">
            Bestemmingen
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto">
            De Costa Brava strekt zich uit van Blanes tot de Franse grens. Ontdek de mooiste plaatsen voor jouw caravanvakantie.
          </p>
        </div>
      </section>

      {/* Destinations grid */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={`/bestemmingen/${dest.slug}`}
              className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={dest.heroImage}
                  alt={dest.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-xl font-bold text-white">{dest.name}</h2>
                  <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                    <MapPin size={12} />
                    {dest.region}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{dest.description}</p>
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {dest.bestFor.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="flex items-center gap-1"><Sun size={14} />{dest.weather.summer}</span>
                    <span className="flex items-center gap-1"><Users size={14} />{dest.nearestCampings.length} campings</span>
                  </div>
                  <ChevronRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-primary rounded-2xl p-6 sm:p-10 text-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Klaar om te boeken?</h2>
          <p className="text-white/70 text-sm mb-5">Kies je bestemming en wij regelen de rest. Caravan staat klaar!</p>
          <Link
            href="/boeken"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Boek nu <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

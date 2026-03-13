'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, ChevronRight, Tent, Globe,
  Umbrella, Sun, Droplets, Star, UtensilsCrossed, Lightbulb,
  Users, Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { type Destination } from '@/data/destinations';
import { type Camping } from '@/data/campings';

interface Props {
  destination: Destination;
  nearbyCampings: Camping[];
  otherDestinations: Destination[];
}

export default function DestinationDetailContent({ destination, nearbyCampings, otherDestinations }: Props) {
  const { t } = useLanguage();
  const [activePhoto, setActivePhoto] = useState(0);

  const allPhotos = [destination.heroImage, ...destination.gallery.filter(g => g !== destination.heroImage)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="relative h-[35vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          src={allPhotos[activePhoto] || destination.heroImage}
          alt={`${destination.name} — ${destination.region}, Costa Brava`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Photo dots */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {allPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePhoto ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <nav className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs mb-3">
              <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/bestemmingen" className="hover:text-white/80 transition-colors">{t('nav.destinations')}</Link>
              <ChevronRight size={12} />
              <span className="text-white">{destination.name}</span>
            </nav>

            <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-white mb-1.5 sm:mb-3 leading-tight">{destination.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {destination.region}</span>
              {destination.population && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {destination.population}</span>
                </>
              )}
              {destination.knownFor && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="flex items-center gap-1.5"><Star size={14} /> {destination.knownFor}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="relative z-10 -mt-5 sm:-mt-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <Globe size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{destination.region}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Regio</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <Umbrella size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{destination.beaches.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Stranden</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <UtensilsCrossed size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{destination.restaurants.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Restaurants</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <Sun size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{destination.weather.summer}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Zomer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ontdek {destination.name}</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {destination.longDescription || destination.description}
              </p>
              {destination.bestFor.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {destination.bestFor.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold">
                      <Sparkles size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights */}
            {destination.highlights.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Wat maakt {destination.name} bijzonder?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.highlights.map(h => (
                    <div key={h} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Star size={14} className="text-primary" />
                      </div>
                      <span className="text-sm text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {destination.restaurants.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  <span className="flex items-center gap-2"><UtensilsCrossed size={20} className="text-primary sm:w-[22px] sm:h-[22px]" /> Waar eten in {destination.name}?</span>
                </h2>
                <div className="space-y-3">
                  {destination.restaurants.map(r => (
                    <div key={r.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{r.name}</h3>
                          <p className="text-xs text-gray-500">{r.cuisine}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{r.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                      {r.mustTry && (
                        <div className="flex items-center gap-1.5 text-xs text-primary/70 bg-primary/5 px-2.5 py-1 rounded-lg w-fit">
                          <Star size={12} /> Must try: {r.mustTry}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Beaches */}
            {destination.beaches.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  <span className="flex items-center gap-2"><Umbrella size={20} className="text-primary sm:w-[22px] sm:h-[22px]" /> Stranden bij {destination.name}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.beaches.map(b => (
                    <div key={b.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{b.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.type === 'zand' ? 'bg-primary/5 text-primary' : b.type === 'kiezel' ? 'bg-gray-100 text-gray-600' : 'bg-primary/5 text-primary/70'}`}>
                          {b.type === 'zand' ? '🏖️ Zand' : b.type === 'kiezel' ? '🪨 Kiezel' : b.type === 'rotsen' ? '🪨 Rotsen' : '🏖️ Mix'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.vibe === 'familiaal' ? 'bg-accent/10 text-accent-dark' : b.vibe === 'levendig' ? 'bg-primary/5 text-primary' : b.vibe === 'rustig' ? 'bg-gray-100 text-gray-600' : 'bg-primary/10 text-primary'}`}>
                          {b.vibe === 'familiaal' ? '👨‍👩‍👧 Familiaal' : b.vibe === 'levendig' ? '🎉 Levendig' : b.vibe === 'rustig' ? '🧘 Rustig' : '🌊 Wild'}
                        </span>
                        {b.facilities && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/5 text-primary/70">
                            ✓ Faciliteiten
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo gallery */}
            {allPhotos.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Foto&apos;s van {destination.name}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {allPhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => { setActivePhoto(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="relative aspect-[16/10] rounded-2xl overflow-hidden group"
                    >
                      <Image
                        src={photo}
                        alt={`${destination.name} foto ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other destinations in region */}
            {otherDestinations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Meer ontdekken in {destination.region}</h2>
                <p className="text-gray-500 text-sm mb-4">Andere prachtige plaatsen op korte rijafstand van {destination.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {otherDestinations.map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/bestemmingen/${dest.slug}`}
                      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={dest.heroImage}
                          alt={`${dest.name} — ${dest.region}, Costa Brava`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-sm font-bold text-white">{dest.name}</h3>
                          <div className="flex items-center gap-1.5 text-white/70 text-[11px] mt-0.5">
                            <MapPin size={10} /> {dest.region}
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-gray-600 line-clamp-2">{dest.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Book CTA */}
            <div className="hidden lg:block bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white sticky top-28">
              <h3 className="text-lg font-bold mb-2">Caravan huren vlakbij {destination.name}?</h3>
              <p className="text-white/80 text-sm mb-4">
                Slaap op een camping op loopafstand of korte rijafstand van {destination.name}. Wij regelen alles — jij geniet.
              </p>
              <Link
                href="/boeken"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary font-bold rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg"
              >
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Weather & Travel tip */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sun size={16} className="text-primary" /> Weer & reistip
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Sun size={12} /> Zomer</span>
                  <span className="font-medium text-gray-900">{destination.weather.summer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Droplets size={12} /> Watertemperatuur</span>
                  <span className="font-medium text-gray-900">{destination.weather.water}</span>
                </div>
                {destination.travelTip && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-primary/80">{destination.travelTip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nearby campings */}
            {nearbyCampings.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Tent size={16} className="text-primary" /> Campings in de buurt
                </h3>
                <div className="space-y-2">
                  {nearbyCampings.map(c => (
                    <Link
                      key={c.id}
                      href={`/bestemmingen/${c.slug}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-12 h-9 rounded-lg overflow-hidden relative bg-gray-100 shrink-0">
                        {(c.photos?.[0] || '').startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photos![0]}
                            alt={c.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <Image
                            src={c.photos?.[0] || '/og-image.jpg'}
                            alt={c.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/bestemmingen#campings"
                  className="flex items-center justify-center gap-1.5 w-full mt-3 pt-3 border-t border-gray-100 text-primary text-sm font-semibold"
                >
                  Alle campings bekijken <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden py-14 sm:py-16">
        <div className="absolute inset-0 bg-[url('/images/campings/golfo_de_rosas.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 drop-shadow-sm">
            Klaar voor {destination.name}?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Jouw volledig ingerichte caravan staat klaar op een camping in de buurt. Inclusief beddengoed, kookgerei en inventaris.
          </p>
          <Link
            href="/boeken"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-bold rounded-xl text-sm transition-all hover:scale-105 hover:shadow-xl shadow-lg"
          >
            {t('nav.bookNow')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 safe-area-bottom">
        <Link
          href="/boeken"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-lg"
        >
          {t('nav.bookNow')} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

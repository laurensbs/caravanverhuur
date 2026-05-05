'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BookingCTA from '@/components/BookingCTA';
import {
  MapPin, ArrowRight, ChevronRight, Tent, Globe,
  Umbrella, Sun, Droplets, Star, UtensilsCrossed, Lightbulb,
  Users, Sparkles, CheckCircle, Mountain, Clock, ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { type Destination } from '@/data/destinations';
import { type Camping } from '@/data/campings';
import { useData } from '@/lib/data-context';

interface Props {
  destination: Destination;
  nearbyCampings: Camping[];
  otherDestinations: Destination[];
}

export default function DestinationDetailContent({ destination, nearbyCampings, otherDestinations }: Props) {
  const { t } = useLanguage();
  const { destinations: ctxDestinations, campings: dbCampings } = useData();
  const [trails, setTrails] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/trails').then(r => r.json())
      .then(data => {
        const all = data.trails || [];
        const slug = destination.slug;
        const nearby = all.filter((t: any) =>
          t.tags?.includes(slug) ||
          t.location?.toLowerCase() === destination.name.toLowerCase()
        );
        setTrails(nearby);
      })
      .catch(() => {});
  }, [destination.slug, destination.name]);

  // Use DB-overridden photos if available
  const dbDest = ctxDestinations.find(d => d.slug === destination.slug);
  const heroImage = dbDest?.heroImage || destination.heroImage;
  const gallery = (dbDest?.gallery?.length ? dbDest.gallery : destination.gallery);

  // Enrich nearbyCampings with DB data (admin-uploaded photos)
  const enrichedNearbyCampings = nearbyCampings.map(c => {
    const db = dbCampings.find(d => d.id === c.id || d.slug === c.slug);
    if (!db) return c;
    return { ...c, photos: db.photos?.length ? db.photos : c.photos, location: db.location || c.location };
  });

  const allPhotos = [heroImage, ...gallery.filter(g => g !== heroImage)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero — full-width */}
      <section className="relative">
        <div className="h-[55vh] sm:h-[60vh] md:h-[65vh] overflow-hidden">
          {allPhotos[0].startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={allPhotos[0]}
              alt={`${destination.name} — ${destination.region}, Costa Brava`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={allPhotos[0]}
              alt={`${destination.name} — ${destination.region}, Costa Brava`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 sm:p-8 sm:pb-10">
            <div className="max-w-6xl mx-auto">
              <nav className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs mb-3">
                <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
                <ChevronRight size={12} />
                <Link href="/bestemmingen" className="hover:text-white/80 transition-colors">{t('nav.destinations')}</Link>
                <ChevronRight size={12} />
                <span className="text-white">{destination.name}</span>
              </nav>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">{destination.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/90 text-sm">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full"><MapPin size={14} /> {destination.region}</span>
                {destination.population && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full"><Users size={14} /> {destination.population}</span>
                )}
                {destination.knownFor && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full"><Star size={14} /> {destination.knownFor}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + Gallery row */}
      <section className="relative z-10 -mt-6 sm:-mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
            {/* Stats */}
            <div className="grid grid-cols-4 divide-x divide-gray-100 mb-0">
              <div className="text-center px-1 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary truncate">{destination.region}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">Regio</p>
              </div>
              <div className="text-center px-1 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary">{destination.beaches.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">Stranden</p>
              </div>
              <div className="text-center px-1 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary">{destination.restaurants.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">Restaurants</p>
              </div>
              <div className="text-center px-1 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary">{destination.weather.summer}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">Zomer</p>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Weather & travel tip — mobile */}
      <div className="lg:hidden max-w-6xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                <Sun size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Zomer {destination.weather.summer}</p>
                <p className="text-xs text-gray-500">Water: {destination.weather.water}</p>
              </div>
            </div>
            {destination.travelTip && (
              <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1.5 rounded-lg max-w-[50%]">
                <Lightbulb size={12} className="text-primary shrink-0" />
                <p className="text-[11px] text-primary/80 leading-tight line-clamp-2">{destination.travelTip}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-14 pb-24 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-10 sm:space-y-12">
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">Wat maakt {destination.name} bijzonder?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.highlights.map((h, i) => (
                    <div key={h} className="flex items-start gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{i + 1}</span>
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed pt-1">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {destination.restaurants.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">
                  <span className="flex items-center gap-2.5"><UtensilsCrossed size={20} className="text-primary" /> Waar eten in {destination.name}?</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {destination.restaurants.map(r => (
                    <div key={r.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{r.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{r.cuisine}</p>
                        </div>
                        <span className="text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-lg shrink-0 ml-2">{r.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.description}</p>
                      {r.mustTry && (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-2 rounded-xl">
                          <Star size={13} className="shrink-0" /> Must try: <span className="font-bold">{r.mustTry}</span>
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">
                  <span className="flex items-center gap-2.5"><Umbrella size={20} className="text-primary" /> Stranden bij {destination.name}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.beaches.map(b => (
                    <div key={b.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {b.photo && b.photo.startsWith('http') && (
                        <div className="relative w-full aspect-[16/9] bg-gray-100">
                          <Image
                            src={b.photo}
                            alt={b.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 50vw"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="p-4 sm:p-5">
                      <h3 className="font-bold text-gray-900 text-base mb-2">{b.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${b.type === 'zand' ? 'bg-amber-50 text-amber-700' : b.type === 'kiezel' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                          {b.type === 'zand' ? '🏖️ Zand' : b.type === 'kiezel' ? '🪨 Kiezel' : b.type === 'rotsen' ? '🪨 Rotsen' : '🏖️ Mix'}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${b.vibe === 'familiaal' ? 'bg-green-50 text-green-700' : b.vibe === 'levendig' ? 'bg-purple-50 text-purple-700' : b.vibe === 'rustig' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-700'}`}>
                          {b.vibe === 'familiaal' ? '👨‍👩‍👧 Familiaal' : b.vibe === 'levendig' ? '🎉 Levendig' : b.vibe === 'rustig' ? '🧘 Rustig' : '🌊 Wild'}
                        </span>
                        {b.facilities && (
                          <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-primary/5 text-primary">
                            <CheckCircle size={11} className="inline mr-0.5 -mt-0.5" /> Faciliteiten
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wandelroutes in de buurt */}
            {trails.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  <span className="flex items-center gap-2.5"><Mountain size={20} className="text-emerald-600" /> Wandelroutes bij {destination.name}</span>
                </h2>
                <p className="text-gray-500 text-sm mb-4 sm:mb-5">Ontdek de mooiste wandelpaden in de buurt</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trails.slice(0, 4).map(trail => (
                    <div key={trail.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight">{trail.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {trail.location}</p>
                        </div>
                        {trail.difficulty && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ml-2 ${trail.difficulty === 'easy' ? 'bg-green-100 text-green-700' : trail.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {trail.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">{trail.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {trail.distanceKm && <span>{trail.distanceKm} km</span>}
                          {trail.durationMinutes && (
                            <span className="flex items-center gap-0.5"><Clock size={11} /> {Math.floor(trail.durationMinutes / 60)}u{trail.durationMinutes % 60 > 0 ? `${trail.durationMinutes % 60}m` : ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {trail.alltrailsUrl && (
                            <a href={trail.alltrailsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-medium hover:bg-emerald-100 transition-colors">
                              <ExternalLink size={10} /> AllTrails
                            </a>
                          )}
                          {trail.googleMapsUrl && (
                            <a href={trail.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium hover:bg-blue-100 transition-colors">
                              <MapPin size={10} /> Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/wandelroutes"
                  className="flex items-center justify-center gap-1.5 w-full mt-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                >
                  Alle wandelroutes bekijken <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* Other destinations in region */}
            {otherDestinations.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Meer ontdekken in {destination.region}</h2>
                <p className="text-gray-500 text-sm mb-4 sm:mb-5">Andere prachtige plaatsen op korte rijafstand van {destination.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {otherDestinations.slice(0, 6).map(dest => {
                    const dbOther = ctxDestinations.find(d => d.slug === dest.slug);
                    const otherHero = dbOther?.heroImage || dest.heroImage;
                    return (
                    <Link
                      key={dest.slug}
                      href={`/bestemmingen/${dest.slug}`}
                      className="group relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                    >
                      <Image
                        src={otherHero}
                        alt={`${dest.name} — ${dest.region}, Costa Brava`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized={otherHero.startsWith('http')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="text-sm sm:text-base font-bold text-white">{dest.name}</h3>
                        <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1">
                          <MapPin size={12} /> {dest.region}
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Book CTA — desktop only, mobile has sticky bar */}
            <div className="hidden lg:block bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white lg:sticky lg:top-[108px]">
              <h3 className="text-base sm:text-lg font-bold mb-2">Caravan huren vlakbij {destination.name}?</h3>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                Slaap op een camping op loopafstand of korte rijafstand van {destination.name}. Wij regelen alles — jij geniet.
              </p>
              <Link
                href="/boeken"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary font-bold rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg"
              >
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Weather & Travel tip — desktop only */}
            <div className="hidden lg:block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
            {enrichedNearbyCampings.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Tent size={16} className="text-primary" /> Campings in de buurt
                </h3>
                <div className="space-y-1.5">
                  {enrichedNearbyCampings.map(c => (
                    <Link
                      key={c.id}
                      href={`/bestemmingen/${c.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {(c.photos?.[0] || '').startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photos![0]}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Image
                            src={c.photos?.[0] || '/og-image.jpg'}
                            alt={c.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.location}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link
                  href="/bestemmingen#campings"
                  className="flex items-center justify-center gap-1.5 w-full mt-3 pt-3 border-t border-gray-100 text-primary text-sm font-semibold hover:text-primary-dark transition-colors"
                >
                  Alle campings bekijken <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <BookingCTA />

      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 safe-area-bottom">
        <Link
          href="/boeken"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg"
        >
          {t('nav.bookNow')} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

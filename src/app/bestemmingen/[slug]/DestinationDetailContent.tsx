'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { MapPin, ArrowRight, Sun, Droplets, Lightbulb, ChevronRight, Tent, Star, Heart, Umbrella, UtensilsCrossed, Waves, Award, Sparkles, Camera, ThermometerSun, Users, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { type Destination } from '@/data/destinations';
import { campings as staticCampings } from '@/data/campings';
import { locationActivities, getCategoryLabel } from '@/data/activities';

const CostaBravaMap = dynamic(() => import('@/components/CostaBravaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function DestinationDetailContent({ dest, otherDestinations }: { dest: Destination; otherDestinations: Destination[] }) {
  const { t } = useLanguage();

  // Fetch campings from DB (admin-managed), fall back to static
  const [allCampings, setAllCampings] = useState(staticCampings);
  useEffect(() => {
    fetch('/api/campings')
      .then(res => res.json())
      .then(data => { if (data.campings?.length) setAllCampings(data.campings); })
      .catch(() => {});
  }, []);

  // Find activities for this destination
  const destActivities = locationActivities.find(
    la => la.location.toLowerCase() === dest.name.toLowerCase() ||
          dest.name.toLowerCase().includes(la.location.toLowerCase()) ||
          la.location.toLowerCase().includes(dest.name.toLowerCase().replace("l'", '').replace("'", ''))
  );

  const tagMap: Record<string, string> = {
    Gezinnen: t('destinations.tagFamilies'),
    Koppels: t('destinations.tagCouples'),
    Cultuurliefhebbers: t('destinations.tagCulture'),
    Strandvakantie: t('destinations.tagBeach'),
    Duikers: t('destinations.tagDivers'),
    Natuurliefhebbers: t('destinations.tagNature'),
    Watersporters: t('destinations.tagWatersports'),
    Jongeren: t('destinations.tagYouth'),
    Fotografen: t('destinations.tagPhotographers'),
    Surfers: t('destinations.tagSurfers'),
    Strandliefhebbers: t('destinations.tagBeachLovers'),
    Kunstenaars: t('destinations.tagArtists'),
    Families: t('destinations.tagFamiliesAlt'),
    Budgetvriendelijk: t('destinations.tagBudget'),
    'Rust zoekers': t('destinations.tagPeaceSeekers'),
    Culinair: t('destinations.tagCulinary'),
  };

  const vibeColors: Record<string, string> = {
    rustig: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    levendig: 'bg-amber-50 text-amber-700 border-amber-100',
    wild: 'bg-violet-50 text-violet-700 border-violet-100',
    familiaal: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  const vibeIcons: Record<string, string> = {
    rustig: '🌿',
    levendig: '🎉',
    wild: '🌊',
    familiaal: '👨‍👩‍👧‍👦',
  };

  const typeLabels: Record<string, string> = {
    zand: '🏖️ Zandstrand',
    kiezel: '🪨 Kiezelstrand',
    rotsen: '⛰️ Rotsenstrand',
    mix: '🏝️ Gemengd',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <Image
          src={dest.heroImage}
          alt={`${dest.name} – ${dest.region}, Costa Brava`}
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-3">
              <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/bestemmingen" className="hover:text-white/80 transition-colors">{t('destinations.allDestinations')}</Link>
              <ChevronRight size={12} />
              <span className="text-white">{dest.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">{dest.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1.5"><MapPin size={14} />{dest.region}</span>
              {dest.population && <span className="text-white/50">·</span>}
              {dest.population && <span className="flex items-center gap-1.5"><Users size={14} />{dest.population}</span>}
              <span className="text-white/50">·</span>
              <span className="flex items-center gap-1.5"><Sun size={14} />{dest.weather.summer}</span>
              <span className="text-white/50">·</span>
              <span className="flex items-center gap-1.5"><Droplets size={14} />{dest.weather.water}</span>
              {dest.knownFor && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white text-xs font-semibold border border-white/20">
                  <Sparkles size={11} /> {dest.knownFor}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats bar */}
      <section className="relative z-10 -mt-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <ThermometerSun size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('destinations.summerTemp')}</p>
                <p className="text-sm font-bold text-gray-900">{dest.weather.summer}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Droplets size={16} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('destinations.waterTemp')}</p>
                <p className="text-sm font-bold text-gray-900">{dest.weather.water}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                <Umbrella size={16} className="text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stranden</p>
                <p className="text-sm font-bold text-gray-900">{dest.beaches.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50">
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
                <UtensilsCrossed size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Restaurants</p>
                <p className="text-sm font-bold text-gray-900">{dest.restaurants.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Over {dest.name}</h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">{dest.description}</p>
              {dest.longDescription && (
                <p className="text-gray-500 text-sm leading-relaxed">{dest.longDescription}</p>
              )}
            </div>

            {/* Photo gallery */}
            {dest.gallery.length > 1 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera size={18} className="text-primary" /> Foto&apos;s van {dest.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dest.gallery.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                      <Image src={img} alt={`${dest.name} foto ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={18} className="text-primary" />
                {t('destinations.highlights')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {dest.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-primary/5 transition-colors">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beaches */}
            {dest.beaches.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Umbrella size={18} className="text-primary" /> Stranden
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {dest.beaches.map((beach, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`px-4 py-2.5 ${vibeColors[beach.vibe]?.split(' ').slice(0, 1).join(' ') || 'bg-gray-50'} border-b ${vibeColors[beach.vibe]?.split(' ').slice(2).join(' ') || 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-sm">{beach.name}</h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vibeColors[beach.vibe] || 'bg-gray-100 text-gray-600'}`}>
                            {vibeIcons[beach.vibe]} {beach.vibe}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{beach.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{typeLabels[beach.type]}</span>
                          {beach.facilities && (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              ✓ Faciliteiten
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {dest.restaurants.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-primary" /> Restaurants
                </h2>
                <div className="space-y-3">
                  {dest.restaurants.map((r, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow hover:border-primary/20">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{r.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{r.cuisine}</p>
                        </div>
                        <span className="text-sm font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-lg">{r.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.description}</p>
                      {r.mustTry && (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Award size={12} /> Must try: {r.mustTry}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {destActivities && destActivities.activities.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Star size={18} className="text-primary" /> Activiteiten
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {destActivities.activities.map(a => (
                    <div key={a.id} className="rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow hover:border-primary/20">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-sm">{a.title}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap shrink-0">
                              {getCategoryLabel(a.category)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{a.description}</p>
                          {a.tip && <p className="text-xs text-primary mt-2 flex items-start gap-1"><Lightbulb size={11} className="shrink-0 mt-0.5" /> {a.tip}</p>}
                          {a.distance && <p className="text-xs text-gray-400 mt-1">📍 {a.distance}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel tip */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15 rounded-2xl p-5 sm:p-6 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Lightbulb size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{t('destinations.travelTip')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{dest.travelTip}</p>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Locatie
              </h2>
              <div className="rounded-xl overflow-hidden">
                <CostaBravaMap destinations={[dest]} activeDestination={dest.slug} />
              </div>
            </div>

            {/* Campings */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tent size={18} className="text-primary" />
                {t('destinations.nearCampings')}
              </h2>
              <div className="space-y-3">
                {dest.nearestCampings.map(campingName => {
                  const campingData = allCampings.find(c => c.name.toLowerCase() === campingName.toLowerCase());
                  return (
                    <div key={campingName} className="bg-gray-50 rounded-xl p-4 hover:bg-primary/5 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <Tent size={14} className="text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">{campingName}</h3>
                          </div>
                          {campingData?.description && (
                            <p className="text-sm text-gray-500 mt-1 ml-10">{campingData.description}</p>
                          )}
                          {campingData?.website && (
                            <a href={campingData.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 ml-10 hover:underline">
                              <ExternalLink size={11} /> Website
                            </a>
                          )}
                        </div>
                        <Link
                          href={`/boeken?camping=${encodeURIComponent(campingData?.id || campingName)}`}
                          className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity mt-0.5"
                        >
                          {t('destinations.bookCaravan')} <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">

            {/* Info card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> {dest.name}
                </h3>
                {dest.knownFor && (
                  <p className="text-xs text-gray-500 mt-0.5">{dest.knownFor}</p>
                )}
              </div>

              <div className="p-5">
                <div className="space-y-0 divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-500">{t('destinations.region')}</span>
                    <span className="font-semibold text-gray-900">{dest.region}</span>
                  </div>
                  {dest.population && (
                    <div className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-gray-500">Inwoners</span>
                      <span className="font-semibold text-gray-900">{dest.population}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-500">Stranden</span>
                    <span className="font-semibold text-gray-900">{dest.beaches.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-500">Restaurants</span>
                    <span className="font-semibold text-gray-900">{dest.restaurants.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-500">{t('destinations.campings')}</span>
                    <span className="font-semibold text-gray-900">{dest.nearestCampings.length}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
                  {dest.bestFor.map(tag => (
                    <span key={tag} className="text-xs font-medium text-primary bg-primary/8 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-primary/10">
                      <Heart size={9} /> {tagMap[tag] || tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/boeken?bestemming=${encodeURIComponent(dest.name)}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  {t('destinations.bookCaravan')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Other destinations */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider text-gray-500">
                Andere bestemmingen
              </h3>
              <div className="space-y-1">
                {otherDestinations.slice(0, 5).map(d => (
                  <Link
                    key={d.id}
                    href={`/bestemmingen/${d.slug}`}
                    className="flex items-center gap-3 py-2.5 rounded-xl px-2.5 -mx-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 ring-1 ring-gray-100">
                      <Image src={d.heroImage} alt={`${d.name}, ${d.region}`} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{d.name}</div>
                      <div className="text-xs text-gray-400">{d.region}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
              <Link href="/bestemmingen" className="flex items-center justify-center gap-1 text-sm text-primary font-medium pt-3 mt-2 border-t border-gray-100 hover:underline">
                {t('destinations.allDestinations')} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

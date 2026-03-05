'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { MapPin, ArrowRight, Sun, Droplets, Lightbulb, ChevronRight, Tent, Star, Heart, Umbrella, UtensilsCrossed, Waves, Award, Sparkles, Camera } from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { type Destination } from '@/data/destinations';
import { locationActivities, getCategoryLabel } from '@/data/activities';

const CostaBravaMap = dynamic(() => import('@/components/CostaBravaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#e07b12] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function DestinationDetailContent({ dest, otherDestinations }: { dest: Destination; otherDestinations: Destination[] }) {
  const { t } = useLanguage();

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
    rustig: 'bg-emerald-50 text-emerald-700',
    levendig: 'bg-amber-50 text-amber-700',
    wild: 'bg-violet-50 text-violet-700',
    familiaal: 'bg-blue-50 text-blue-700',
  };

  const typeLabels: Record<string, string> = {
    zand: 'Zandstrand',
    kiezel: 'Kiezelstrand',
    rotsen: 'Rotsenstrand',
    mix: 'Gemengd',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <Image
          src={dest.heroImage}
          alt={`${dest.name} – ${dest.region}, Costa Brava`}
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-3">
              <Link href="/">Home</Link>
              <ChevronRight size={12} />
              <Link href="/bestemmingen">{t('destinations.allDestinations')}</Link>
              <ChevronRight size={12} />
              <span className="text-white">{dest.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{dest.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} />{dest.region}</span>
              {dest.population && <span className="text-white/60">· {dest.population} inwoners</span>}
              <span className="flex items-center gap-1"><Sun size={14} />{dest.weather.summer}</span>
              <span className="flex items-center gap-1"><Droplets size={14} />{dest.weather.water}</span>
              {dest.knownFor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#e07b12] rounded-full text-white text-xs font-semibold">
                  <Sparkles size={11} /> {dest.knownFor}
                </span>
              )}
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{dest.name}</h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">{dest.description}</p>
              {dest.longDescription && (
                <p className="text-gray-500 text-sm leading-relaxed">{dest.longDescription}</p>
              )}
            </div>

            {/* Photo gallery */}
            {dest.gallery.length > 1 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera size={18} className="text-[#e07b12]" /> Foto&apos;s van {dest.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dest.gallery.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      <Image src={img} alt={`${dest.name} foto ${i + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={18} className="text-[#e07b12]" />
                {t('destinations.highlights')}
              </h2>
              <div className="space-y-3">
                {dest.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#e07b12]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#e07b12] text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-gray-600">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beaches */}
            {dest.beaches.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Umbrella size={18} className="text-[#e07b12]" /> Stranden ({dest.beaches.length})
                </h2>
                <div className="space-y-4">
                  {dest.beaches.map((beach, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{beach.name}</h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vibeColors[beach.vibe] || 'bg-gray-100 text-gray-600'}`}>
                          {beach.vibe}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{beach.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Waves size={12} /> {typeLabels[beach.type]}</span>
                        {beach.facilities && <span className="text-emerald-600">✓ Faciliteiten</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {dest.restaurants.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-[#e07b12]" /> Restaurants ({dest.restaurants.length})
                </h2>
                <div className="space-y-4">
                  {dest.restaurants.map((r, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-gray-900">{r.name}</h4>
                        <span className="text-sm font-bold text-[#e07b12]">{r.price}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{r.cuisine}</p>
                      <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                      {r.mustTry && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#e07b12] font-semibold bg-[#e07b12]/8 px-2.5 py-1 rounded-full">
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
              <div className="bg-white rounded-2xl p-5 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={18} className="text-[#e07b12]" /> Activiteiten ({destActivities.activities.length})
                </h2>
                <div className="space-y-3">
                  {destActivities.activities.map(a => (
                    <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{a.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-900">{a.title}</h4>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {getCategoryLabel(a.category)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{a.description}</p>
                          {a.tip && <p className="text-xs text-[#e07b12] mt-1 italic">💡 {a.tip}</p>}
                          {a.distance && <p className="text-xs text-gray-400 mt-1">📍 {a.distance}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel tip */}
            <div className="bg-[#e07b12]/5 border border-[#e07b12]/20 rounded-2xl p-5 sm:p-6 flex gap-4">
              <div className="w-10 h-10 bg-[#e07b12]/10 rounded-full flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-[#e07b12]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{t('destinations.travelTip')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{dest.travelTip}</p>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#e07b12]" /> Locatie
              </h2>
              <CostaBravaMap destinations={[dest]} activeDestination={dest.slug} />
            </div>

            {/* Campings */}
            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tent size={18} className="text-[#e07b12]" />
                {t('destinations.nearCampings')}
              </h2>
              <div className="space-y-2">
                {dest.nearestCampings.map(c => (
                  <div key={c} className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
                    <MapPin size={14} className="text-[#e07b12] shrink-0" />
                    <span className="text-sm text-gray-600">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32">
              <h3 className="font-bold text-gray-900 mb-4">Info</h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('destinations.region')}</span>
                  <span className="font-medium text-gray-900">{dest.region}</span>
                </div>
                {dest.population && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Inwoners</span>
                    <span className="font-medium text-gray-900">{dest.population}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('destinations.summerTemp')}</span>
                  <span className="font-medium text-gray-900">{dest.weather.summer}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('destinations.waterTemp')}</span>
                  <span className="font-medium text-gray-900">{dest.weather.water}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Stranden</span>
                  <span className="font-medium text-gray-900">{dest.beaches.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Restaurants</span>
                  <span className="font-medium text-gray-900">{dest.restaurants.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('destinations.campings')}</span>
                  <span className="font-medium text-gray-900">{dest.nearestCampings.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {dest.bestFor.map(tag => (
                  <span key={tag} className="text-xs font-semibold text-[#e07b12] bg-[#e07b12]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Heart size={10} /> {tagMap[tag] || tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/boeken?bestemming=${encodeURIComponent(dest.name)}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#e07b12] text-white font-bold rounded-xl hover:bg-[#c4650c] transition-colors"
              >
                {t('destinations.bookCaravan')} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Other destinations */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 mb-3">{t('destinations.allDestinations')}</h3>
              <div className="space-y-2">
                {otherDestinations.map(d => (
                  <Link
                    key={d.id}
                    href={`/bestemmingen/${d.slug}`}
                    className="flex items-center gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={d.heroImage} alt={`${d.name}, ${d.region}`} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.region}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  </Link>
                ))}
                <Link href="/bestemmingen" className="block text-center text-sm text-[#e07b12] font-medium pt-2 hover:underline">
                  Alle bestemmingen →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

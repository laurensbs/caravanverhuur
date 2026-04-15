'use client';

import Link from 'next/link';
import Image from 'next/image';
import BookingCTA from '@/components/BookingCTA';
import {
  MapPin, ArrowRight, ChevronRight, Tent, Globe, ExternalLink,
  Waves, Users, Heart, TreePine, Sparkles, Umbrella, Wifi, ShoppingCart,
  Dumbbell, CheckCircle, Navigation, Sun, Droplets,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { useData } from '@/lib/data-context';
import { type Camping } from '@/data/campings';
import { type Destination } from '@/data/destinations';

/* ------------------------------------------------------------------ */
/*  Facility icons                                                     */
/* ------------------------------------------------------------------ */
const facilityIcons: Record<string, React.ReactNode> = {
  Zwembad: <Waves size={16} className="text-primary/60" />,
  Waterpark: <Waves size={16} className="text-primary/60" />,
  Aquapark: <Waves size={16} className="text-primary/60" />,
  Strand: <Umbrella size={16} className="text-primary/60" />,
  Restaurant: <span className="text-base">🍽️</span>,
  Supermarkt: <ShoppingCart size={16} className="text-primary/60" />,
  WiFi: <Wifi size={16} className="text-primary/60" />,
  Animatie: <Sparkles size={16} className="text-primary/60" />,
  Speeltuin: <span className="text-base">🎪</span>,
  Sportterreinen: <Dumbbell size={16} className="text-primary/60" />,
  Wellness: <Heart size={16} className="text-primary/60" />,
  Spa: <Heart size={16} className="text-primary/60" />,
  Fietsverhuur: <span className="text-base">🚲</span>,
  Watersport: <Waves size={16} className="text-primary/60" />,
  Kajak: <span className="text-base">🛶</span>,
  Uitzicht: <span className="text-base">🏔️</span>,
  Vogelobservatie: <span className="text-base">🦅</span>,
  Disco: <span className="text-base">🎵</span>,
  Duikschool: <span className="text-base">🤿</span>,
  'Nederlandse sfeer': <span className="text-base">🇳🇱</span>,
};

/* ------------------------------------------------------------------ */

/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  camping: Camping;
  nearbyDestinations: Destination[];
  otherCampings: Camping[];
}

export default function CampingDetailContent({ camping, nearbyDestinations, otherCampings }: Props) {
  const { t } = useLanguage();
  const { campings: dbCampings } = useData();

  // Use DB camping data (admin-uploaded photos + edited text) when available, fall back to static
  const dbCamping = dbCampings.find(c => c.id === camping.id || c.slug === camping.slug);
  const photos = (dbCamping?.photos?.length ? dbCamping.photos : camping.photos) || [];

  // Enrich otherCampings with DB data (admin-uploaded photos)
  const enrichedOtherCampings = otherCampings.map(c => {
    const db = dbCampings.find(d => d.id === c.id || d.slug === c.slug);
    if (!db) return c;
    return { ...c, photos: db.photos?.length ? db.photos : c.photos, location: db.location || c.location };
  });
  const description = dbCamping?.description || camping.description;
  const longDescription = dbCamping?.longDescription || camping.longDescription;
  const facilities = dbCamping?.facilities?.length ? dbCamping.facilities : camping.facilities;
  const bestFor = dbCamping?.bestFor?.length ? dbCamping.bestFor : camping.bestFor;
  const website = dbCamping?.website || camping.website;
  const location = dbCamping?.location || camping.location;
  const region = dbCamping?.region || camping.region;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero — full-width */}
      <section className="relative">
        <div className="h-[55vh] sm:h-[60vh] md:h-[65vh] overflow-hidden">
          {(() => {
            const src = photos[0] || '/og-image.jpg';
            return src.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`${camping.name} — ${camping.location}, Costa Brava`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={src}
                alt={`${camping.name} — ${camping.location}, Costa Brava`}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            );
          })()}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 sm:p-8 sm:pb-10">
            <div className="max-w-6xl mx-auto">
              <nav className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs mb-3">
                <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
                <ChevronRight size={12} />
                <Link href="/bestemmingen" className="hover:text-white/80 transition-colors">{t('nav.destinations')}</Link>
                <ChevronRight size={12} />
                <span className="text-white">{camping.name}</span>
              </nav>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">{camping.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/90 text-sm">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full"><MapPin size={14} /> {location}</span>
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full"><Globe size={14} /> {region}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-6 sm:-mt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="text-center px-2 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary truncate">{location}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{t('destinations.locationLabel')}</p>
              </div>
              <div className="text-center px-2 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary">{facilities?.length || 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{t('destinations.facilitiesLabel')}</p>
              </div>
              <div className="text-center px-2 sm:px-4">
                <p className="text-sm sm:text-lg font-bold text-primary">{nearbyDestinations.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{t('destinations.nearbyPlacesCount')}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-14 pb-24 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{t('destinations.aboutCamping')}</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {longDescription || description}
              </p>
              {bestFor && bestFor.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {bestFor.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold">
                      <Sparkles size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Facilities */}
            {facilities && facilities.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">{t('destinations.facilitiesTitle')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {facilities.map(f => (
                    <div key={f} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                        {facilityIcons[f] || <Tent size={16} className="text-gray-400" />}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plaatsen in de omgeving */}
            {nearbyDestinations.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('destinations.nearbyPlacesTitle')}</h2>
                <p className="text-gray-500 text-sm mb-4 sm:mb-5">{t('destinations.nearbyPlacesSubtitle')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {nearbyDestinations.slice(0, 6).map(dest => (
                    <Link
                      key={dest.slug}
                      href={`/bestemmingen/${dest.slug}`}
                      className="group relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                    >
                      <Image
                        src={dest.heroImage}
                        alt={`${dest.name} — ${dest.region}, Costa Brava`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="text-sm sm:text-base font-bold text-white">{dest.name}</h3>
                        <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1">
                          <MapPin size={12} /> {dest.region}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Book CTA — desktop only, mobile has sticky bar */}
            <div className="hidden lg:block bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white lg:sticky lg:top-[108px]">
              <h3 className="text-base sm:text-lg font-bold mb-2">{t('destinations.bookAtCamping')}</h3>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">{t('destinations.bookAtCampingDesc').replace('{name}', camping.name)}</p>
              <Link
                href="/boeken"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary font-bold rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg"
              >
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-white/15 text-white font-medium rounded-xl text-sm transition-colors hover:bg-white/25"
                >
                  {t('destinations.visitWebsite')} <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Location info — desktop only */}
            <div className="hidden lg:block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> {t('destinations.locationInfoTitle')}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('destinations.place')}</span>
                  <span className="font-medium text-gray-900">{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('destinations.regionLabel')}</span>
                  <span className="font-medium text-gray-900">{region}</span>
                </div>
              </div>
            </div>

            {/* Other campings in region */}
            {enrichedOtherCampings.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Tent size={16} className="text-primary" /> {t('destinations.otherCampingsInRegion')}
                </h3>
                <div className="space-y-1.5">
                  {enrichedOtherCampings.map(c => (
                    <Link
                      key={c.id}
                      href={`/bestemmingen/${c.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {(c.photos?.[0] || '').startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photos[0]}
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
                  href="/bestemmingen"
                  className="flex items-center justify-center gap-1.5 w-full mt-3 pt-3 border-t border-gray-100 text-primary text-sm font-semibold"
                >
                  {t('destinations.viewAllCampings')} <ArrowRight size={14} />
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

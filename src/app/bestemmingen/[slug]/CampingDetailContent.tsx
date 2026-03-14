'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, ChevronRight, Tent, Globe, ExternalLink,
  Waves, Users, Heart, TreePine, Sparkles, Umbrella, Wifi, ShoppingCart,
  Dumbbell, CheckCircle, Navigation, Sun, Droplets,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
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
  const [activePhoto, setActivePhoto] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        {(() => {
          const src = camping.photos?.[activePhoto] || camping.photos?.[0] || '/og-image.jpg';
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Photo gallery dots */}
        {camping.photos && camping.photos.length > 1 && (
          <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {camping.photos.map((_, i) => (
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
            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs mb-3">
              <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/bestemmingen" className="hover:text-white/80 transition-colors">{t('nav.destinations')}</Link>
              <ChevronRight size={12} />
              <span className="text-white">{camping.name}</span>
            </nav>

            <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-white mb-1.5 sm:mb-3 leading-tight">{camping.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {camping.location}</span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1.5"><Globe size={14} /> {camping.region}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="relative z-10 -mt-5 sm:-mt-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <MapPin size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{camping.location}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('destinations.locationLabel')}</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <CheckCircle size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{camping.facilities?.length || 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('destinations.facilitiesLabel')}</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1">
                  <Navigation size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{nearbyDestinations.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('destinations.nearbyPlacesCount')}</p>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{t('destinations.aboutCamping')}</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {camping.longDescription || camping.description}
              </p>
              {camping.bestFor && camping.bestFor.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {camping.bestFor.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold">
                      <Sparkles size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Facilities */}
            {camping.facilities && camping.facilities.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{t('destinations.facilitiesTitle')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {camping.facilities.map(f => (
                    <div key={f} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                        {facilityIcons[f] || <Tent size={16} className="text-gray-400" />}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo gallery */}
            {camping.photos && camping.photos.length > 1 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{t('destinations.photosTitle')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {camping.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => { setActivePhoto(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="relative aspect-[16/10] rounded-2xl overflow-hidden group"
                    >
                      {photo.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt={`${camping.name} foto ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          src={photo}
                          alt={`${camping.name} foto ${i + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plaatsen in de omgeving */}
            {nearbyDestinations.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('destinations.nearbyPlacesTitle')}</h2>
                <p className="text-gray-500 text-sm mb-4">{t('destinations.nearbyPlacesSubtitle')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nearbyDestinations.map(dest => (
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
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{dest.description}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          {dest.weather && <span className="flex items-center gap-0.5"><Sun size={10} className="text-primary/50" /> {dest.weather.summer}</span>}
                          {dest.beaches?.length > 0 && <span className="flex items-center gap-0.5"><Umbrella size={10} className="text-primary/50" /> {dest.beaches.length} {t('destinations.beachesShort')}</span>}
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
            {/* Book CTA */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 sm:p-6 text-white lg:sticky lg:top-[108px]">
              <h3 className="text-base sm:text-lg font-bold mb-2">{t('destinations.bookAtCamping')}</h3>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">{t('destinations.bookAtCampingDesc').replace('{name}', camping.name)}</p>
              <Link
                href="/boeken"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary font-bold rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg"
              >
                {t('nav.bookNow')} <ArrowRight size={16} />
              </Link>
              {camping.website && (
                <a
                  href={camping.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-white/15 text-white font-medium rounded-xl text-sm transition-colors hover:bg-white/25"
                >
                  {t('destinations.visitWebsite')} <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Location info */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> {t('destinations.locationInfoTitle')}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('destinations.place')}</span>
                  <span className="font-medium text-gray-900">{camping.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('destinations.regionLabel')}</span>
                  <span className="font-medium text-gray-900">{camping.region}</span>
                </div>
              </div>
            </div>

            {/* Other campings in region */}
            {otherCampings.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Tent size={16} className="text-primary" /> {t('destinations.otherCampingsInRegion')}
                </h3>
                <div className="space-y-1.5">
                  {otherCampings.map(c => (
                    <Link
                      key={c.id}
                      href={`/bestemmingen/${c.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative bg-gray-100 shrink-0">
                        {(c.photos?.[0] || '').startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photos[0]}
                            alt={c.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Image
                            src={c.photos?.[0] || '/og-image.jpg'}
                            alt={c.name}
                            fill
                            className="object-cover"
                            sizes="40px"
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

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-4 pb-24 lg:pb-16">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/campings/cala_d_aiguablava__begur.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative">
            <h2 className="text-xl sm:text-3xl font-bold mb-3">{t('destinations.ctaTitle')}</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto text-sm sm:text-base">{t('destinations.ctaSubtitle')}</p>
            <Link
              href="/boeken"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full text-sm transition-transform hover:scale-105 shadow-lg"
            >
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

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

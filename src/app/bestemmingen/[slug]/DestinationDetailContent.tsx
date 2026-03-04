'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Sun, Droplets, Lightbulb, ChevronRight, Tent, Star, Heart } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface Destination {
  id: string;
  name: string;
  slug: string;
  region: string;
  description: string;
  heroImage: string;
  highlights: string[];
  bestFor: string[];
  travelTip: string;
  nearestCampings: string[];
  weather: { summer: string; water: string };
  coordinates: { lat: number; lng: number };
}

export default function DestinationDetailContent({ dest, otherDestinations }: { dest: Destination; otherDestinations: Destination[] }) {
  const { t } = useLanguage();

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

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <Image
          src={dest.heroImage}
          alt={`${dest.name} – ${dest.region}, Costa Brava`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-3">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight size={12} />
              <Link href="/bestemmingen" className="hover:text-white">{t('destinations.allDestinations')}</Link>
              <ChevronRight size={12} />
              <span className="text-white">{dest.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-1">{dest.name}</h1>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} />{dest.region}</span>
              <span className="flex items-center gap-1"><Sun size={14} />{dest.weather.summer}</span>
              <span className="flex items-center gap-1"><Droplets size={14} />{t('destinations.waterTemp')}: {dest.weather.water}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{dest.name}</h2>
              <p className="text-foreground-light text-sm sm:text-base leading-relaxed">{dest.description}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Star size={18} className="text-primary" />
                {t('destinations.highlights')}
              </h2>
              <div className="space-y-3">
                {dest.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-foreground-light">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-50 rounded-2xl p-5 sm:p-6 flex gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-accent-dark text-sm mb-1">{t('destinations.travelTip')}</h3>
                <p className="text-sm text-accent leading-relaxed">{dest.travelTip}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Tent size={18} className="text-primary" />
                {t('destinations.nearCampings')}
              </h2>
              <div className="space-y-2">
                {dest.nearestCampings.map(c => (
                  <div key={c} className="flex items-center gap-3 py-2.5 px-3 bg-surface rounded-xl">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span className="text-sm text-foreground-light">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 sm:sticky sm:top-32">
              <h3 className="font-bold text-foreground mb-4">{t('destinations.weather')}</h3>
              
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t('destinations.region')}</span>
                  <span className="font-medium text-foreground">{dest.region}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t('destinations.summerTemp')}</span>
                  <span className="font-medium text-foreground">{dest.weather.summer}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t('destinations.waterTemp')}</span>
                  <span className="font-medium text-foreground">{dest.weather.water}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t('destinations.campings')}</span>
                  <span className="font-medium text-foreground">{dest.nearestCampings.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {dest.bestFor.map(tag => (
                  <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Heart size={10} /> {tagMap[tag] || tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/boeken?bestemming=${encodeURIComponent(dest.name)}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors active:scale-[0.98]"
              >
                {t('destinations.bookCaravan')} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-3">{t('destinations.allDestinations')}</h3>
              <div className="space-y-2">
                {otherDestinations.map(d => (
                  <Link
                    key={d.id}
                    href={`/bestemmingen/${d.slug}`}
                    className="flex items-center gap-3 py-2 hover:bg-surface rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={d.heroImage} alt={`${d.name}, ${d.region}`} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{d.name}</div>
                      <div className="text-xs text-muted">{d.region}</div>
                    </div>
                    <ChevronRight size={14} className="text-border shrink-0" />
                  </Link>
                ))}
                <Link href="/bestemmingen" className="block text-center text-sm text-primary font-medium pt-2">
                  {t('destinations.allDestinations')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

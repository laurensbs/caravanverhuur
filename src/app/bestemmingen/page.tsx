'use client';

import Link from 'next/link';
import Image from 'next/image';
import { destinations } from '@/data/destinations';
import { MapPin, ArrowRight, Sun, Users, ChevronRight, Compass, Star, Waves, Camera, TreePine, Heart, Thermometer, Anchor, Palette } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

const regionOrder = ['Baix Empordà', 'Alt Empordà', 'La Selva'];
const regionDescriptions: Record<string, string> = {
  'Baix Empordà': 'Middeleeuwse dorpjes, gouden stranden en de beste rijstgerechten van Catalonië',
  'Alt Empordà': 'Wild, kunstzinnig en ongerept — van Dalí tot Cap de Creus',
  'La Selva': 'Levendige badplaatsen, botanische tuinen en de mooiste kustpaden',
};

const regionIcons: Record<string, React.ReactNode> = {
  'Baix Empordà': <Anchor size={18} />,
  'Alt Empordà': <Palette size={18} />,
  'La Selva': <TreePine size={18} />,
};

const destinationsByRegion = regionOrder.map(region => ({
  region,
  items: destinations.filter(d => d.region === region),
}));

/* Featured destination */
const featured = destinations.find(d => d.slug === 'tossa-de-mar') || destinations[0];

/* Best-for icons */
const bestForIcons: Record<string, React.ReactNode> = {
  Gezinnen: <Users size={14} />,
  Koppels: <Heart size={14} />,
  Cultuurliefhebbers: <Palette size={14} />,
  Strandvakantie: <Waves size={14} />,
  Duikers: <Anchor size={14} />,
  Natuurliefhebbers: <TreePine size={14} />,
  Watersporters: <Waves size={14} />,
  Jongeren: <Star size={14} />,
  Fotografen: <Camera size={14} />,
  Surfers: <Waves size={14} />,
  Strandliefhebbers: <Sun size={14} />,
  Kunstenaars: <Palette size={14} />,
  Families: <Users size={14} />,
  Budgetvriendelijk: <Star size={14} />,
  'Rust zoekers': <TreePine size={14} />,
  Culinair: <Star size={14} />,
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DestinationsPage() {
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

  const regionDescMap: Record<string, string> = {
    'Baix Empordà': t('destinations.regionBaixDesc'),
    'Alt Empordà': t('destinations.regionAltDesc'),
    'La Selva': t('destinations.regionSelvaDesc'),
  };

  return (
    <div className="min-h-screen">
      {/* ===== IMMERSIVE HERO ===== */}
      <section className="relative h-[55vh] min-h-[400px] lg:h-[60vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=80"
          alt="Costa Brava coastline"
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold mb-4 uppercase tracking-wider">
            <Compass size={14} /> {t('destinations.discoverCostaBrava')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {destinations.length} {t('destinations.uniqueDestinations')} <span className="text-primary">{t('destinations.destinationsWord')}</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto drop-shadow mb-6">
            {t('destinations.heroDesc')}
          </p>

          {/* Region quick links */}
          <div className="flex flex-wrap justify-center gap-3">
            {regionOrder.map(region => (
              <a key={region} href={`#${region.toLowerCase().replace(/\s/g, '-')}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors"> {regionIcons[region]} {region} </a> ))} </div> </div> {/* Scroll indicator */} <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"> <div className="w-6 h-10 rounded-full flex justify-center pt-2"> <div className="w-1 h-2.5 bg-white/60 rounded-full" /> </div> </div> </section> {/* ===== FEATURED DESTINATION ===== */} <section className="max-w-7xl mx-auto px-4 -mt-16 relative z-10 mb-12"> <Link href={`/bestemmingen/${featured.slug}`} className="group block"> <div className="bg-white rounded-3xl shadow-xl overflow-hidden"> <div className="grid lg:grid-cols-2"> <div className="relative h-64 lg:h-auto lg:min-h-[350px] overflow-hidden"> <Image src={featured.heroImage} alt={featured.name} fill className="object-cover transition-transform duration-700" unoptimized /> <div className="absolute top-4 left-4"> <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-md"> <Star size={12} /> {t('destinations.recommended')}
                  </span>
                </div>
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-muted mb-2">
                  <MapPin size={14} /> {featured.region}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3 transition-colors">{featured.name}</h2>
                <p className="text-foreground-light mb-5 leading-relaxed">{featured.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {featured.bestFor.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {bestForIcons[tag] || <Star size={12} />} {tagMap[tag] || tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-primary mb-0.5"><Thermometer size={12} /> {t('destinations.summerTemp')}</div>
                    <p className="font-bold text-primary-dark">{featured.weather.summer}</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-primary mb-0.5"><Waves size={12} /> {t('destinations.waterTemp')}</div>
                    <p className="font-bold text-primary-dark">{featured.weather.water}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-primary font-semibold transition-all">
                  {t('destinations.discover')} {featured.name} <ArrowRight size={18} />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ===== DESTINATIONS BY REGION ===== */}
      {destinationsByRegion.map(({ region, items }) => (
        <section key={region} id={region.toLowerCase().replace(/\s/g, '-')} className="py-12 lg:py-16 scroll-mt-28">
          <div className="max-w-7xl mx-auto px-4">
            {/* Region header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  {regionIcons[region]} {region}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{region}</h2>
                <p className="text-muted mt-1">{regionDescMap[region] || regionDescriptions[region]}</p>
              </div>
              <p className="text-sm text-muted mt-2 sm:mt-0">{items.length} {t('destinations.destinationsCount')}</p>
            </div>

            {/* Destinations grid */}
            <div className={`grid gap-6 ${items.length >= 3 ? 'lg:grid-cols-3' : items.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl'} sm:grid-cols-2`}>
              {items.map((dest, i) => (
                <Link
                  key={dest.id}
                  href={`/bestemmingen/${dest.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300" > {/* Image */} <div className="relative aspect-[16/10] overflow-hidden"> <Image src={dest.heroImage} alt={dest.name} fill className="object-cover transition-transform duration-700" unoptimized /> <div className="absolute inset-0 bg-black/30" /> {/* Weather badge */} <div className="absolute top-3 right-3"> <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-foreground"> <Sun size={12} className="text-primary" /> {dest.weather.summer} </span> </div> {/* Name overlay */} <div className="absolute bottom-0 left-0 right-0 p-5"> <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{dest.name}</h3> <div className="flex items-center gap-1.5 text-white/80 text-sm"> <MapPin size={13} /> {dest.region} </div> </div> </div> {/* Content */} <div className="p-5"> <p className="text-sm text-foreground-light line-clamp-2 mb-4 leading-relaxed">{dest.description}</p> {/* Tags */} <div className="flex flex-wrap gap-1.5 mb-4"> {dest.bestFor.map(tag => ( <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full"> {bestForIcons[tag] || <Star size={10} />} {tagMap[tag] || tag} </span> ))} </div> {/* Highlights peek */} <div className="space-y-1.5 mb-4"> {dest.highlights.slice(0, 3).map(h => ( <div key={h} className="flex items-start gap-2 text-xs text-muted"> <div className="w-1 h-1 bg-primary rounded-full shrink-0 mt-1.5" /> {h} </div> ))} </div> {/* Footer */} <div className="flex items-center justify-between pt-4"> <div className="flex items-center gap-3 text-xs text-muted"> <span className="flex items-center gap-1"><Waves size={13} className="text-primary" /> {dest.weather.water}</span> <span className="flex items-center gap-1"><Users size={13} className="text-muted" /> {dest.nearestCampings.length} {t('destinations.campings')}</span> </div> <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-all"> {t('destinations.discover')} <ChevronRight size={14} /> </span> </div> </div> </Link> ))} </div> </div> </section> ))} {/* ===== TRAVEL TIP BAR ===== */} <section className="bg-primary-50 py-12"> <div className="max-w-6xl mx-auto px-4"> <h2 className="text-2xl font-bold text-foreground mb-6 text-center">{t('destinations.insiderTips')}</h2> <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"> {destinations.slice(0, 4).map(d => ( <div key={d.id} className="bg-white rounded-xl p-4 shadow-sm"> <div className="flex items-center gap-2 mb-2"> <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0"> <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized /> </div> <div> <p className="text-sm font-bold text-foreground">{d.name}</p> <p className="text-xs text-muted">{d.region}</p> </div> </div> <p className="text-xs text-foreground-light leading-relaxed">{d.travelTip}</p> </div> ))} </div> </div> </section> {/* ===== COMPARISON BAR ===== */} <section className="bg-white py-12 lg:py-16"> <div className="max-w-6xl mx-auto px-4"> <h2 className="text-2xl font-bold text-foreground mb-2 text-center">{t('destinations.compareTitle')}</h2> <p className="text-muted text-center mb-8">{t('destinations.compareSubtitle')}</p> <div className="overflow-x-auto -mx-4 px-4"> <table className="w-full min-w-[640px] border-collapse"> <thead> <tr className=""> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thDestination')}</th> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thRegion')}</th> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thSummer')}</th> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thWater')}</th> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thCampings')}</th> <th className="text-left py-3 px-4 text-sm font-bold text-foreground">{t('destinations.thBestFor')}</th> <th className="py-3 px-4"></th> </tr> </thead> <tbody> {destinations.map(d => ( <tr key={d.id} className="transition-colors"> <td className="py-3 px-4"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0"> <Image src={d.heroImage} alt={d.name} fill className="object-cover" unoptimized /> </div> <span className="text-sm font-semibold text-foreground">{d.name}</span> </div> </td> <td className="py-3 px-4 text-sm text-muted">{d.region}</td> <td className="py-3 px-4"> <span className="inline-flex items-center gap-1 text-sm font-medium text-primary"> <Sun size={13} className="text-primary" /> {d.weather.summer} </span> </td> <td className="py-3 px-4"> <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark"> <Waves size={13} className="text-primary" /> {d.weather.water} </span> </td> <td className="py-3 px-4 text-sm text-foreground-light">{d.nearestCampings.length}</td> <td className="py-3 px-4"> <div className="flex flex-wrap gap-1"> {d.bestFor.slice(0, 2).map(tag => ( <span key={tag} className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tagMap[tag] || tag}</span> ))} </div> </td> <td className="py-3 px-4"> <Link href={`/bestemmingen/${d.slug}`} className="text-primary transition-colors">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80" alt="Costa Brava strand" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-primary/85" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('destinations.ctaReady')}</h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            {t('destinations.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/boeken" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg">
              {t('destinations.bookNow')} <ArrowRight size={20} />
            </Link>
            <Link href="/caravans" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-4 rounded-full font-semibold transition-all">
              {t('destinations.viewCaravans')} <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

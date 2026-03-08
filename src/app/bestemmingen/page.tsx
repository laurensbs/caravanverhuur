'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { destinations, type Destination, type Restaurant, type Beach } from '@/data/destinations';
import { locationActivities, getCategoryLabel, type Activity } from '@/data/activities';
import {
  MapPin, ArrowRight, Sun, Users, ChevronRight, Compass, Star, Waves, Camera, TreePine,
  Heart, Anchor, Palette, Search, X, UtensilsCrossed, Umbrella,
  Map, Grid3X3, ChevronDown, Sparkles, Award, Bike, Castle, Filter,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

const CostaBravaMap = dynamic(() => import('@/components/CostaBravaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Kaart laden...</p>
      </div>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */
type TabKey = 'overzicht' | 'steden' | 'stranden' | 'restaurants' | 'activiteiten';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overzicht', label: 'Overzicht', icon: <Grid3X3 size={16} /> },
  { key: 'steden', label: 'Steden & Dorpen', icon: <Castle size={16} /> },
  { key: 'stranden', label: 'Stranden', icon: <Umbrella size={16} /> },
  { key: 'restaurants', label: 'Restaurants', icon: <UtensilsCrossed size={16} /> },
  { key: 'activiteiten', label: 'Activiteiten', icon: <Bike size={16} /> },
];

const regionOrder = ['Baix Empord\u00e0', 'Alt Empord\u00e0', 'La Selva'];
const regionIcons: Record<string, React.ReactNode> = {
  'Baix Empord\u00e0': <Anchor size={14} />,
  'Alt Empord\u00e0': <Palette size={14} />,
  'La Selva': <TreePine size={14} />,
};

const bestForIcons: Record<string, React.ReactNode> = {
  Gezinnen: <Users size={12} />,
  Koppels: <Heart size={12} />,
  Cultuurliefhebbers: <Palette size={12} />,
  Strandvakantie: <Waves size={12} />,
  Duikers: <Anchor size={12} />,
  Natuurliefhebbers: <TreePine size={12} />,
  Watersporters: <Waves size={12} />,
  Jongeren: <Star size={12} />,
  Fotografen: <Camera size={12} />,
  Surfers: <Waves size={12} />,
  Strandliefhebbers: <Sun size={12} />,
  Kunstenaars: <Palette size={12} />,
  Families: <Users size={12} />,
  Budgetvriendelijk: <Star size={12} />,
  'Rust zoekers': <TreePine size={12} />,
  Culinair: <UtensilsCrossed size={12} />,
};

/* ------------------------------------------------------------------ */
/*  Beach photos (matched to actual locations)                         */
/* ------------------------------------------------------------------ */
const beachPhotos: Record<string, string> = {
  'Platja Gran (Pals)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Playa_de_Pals_%28Costa_Brava%29.jpg/1280px-Playa_de_Pals_%28Costa_Brava%29.jpg',
  'Platja de Pals': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Playa_de_Pals_%28Costa_Brava%29.jpg/1280px-Playa_de_Pals_%28Costa_Brava%29.jpg',
  'Platja del Grau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Arr%C3%B2s_de_Pals.jpg/1280px-Arr%C3%B2s_de_Pals.jpg',
  "Platja de L'Estartit": 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Estartit_-_panoramio_%281%29.jpg/1280px-Estartit_-_panoramio_%281%29.jpg',
  "Platja de l'Estartit": 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Estartit_-_panoramio_%281%29.jpg/1280px-Estartit_-_panoramio_%281%29.jpg',
  'Platja de la Pletera': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Estartit.jpg/1200px-Estartit.jpg',
  'Platja de Santa Margarida': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Roses_mar.jpg/1280px-Roses_mar.jpg',
  'Platja de Roses': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Golfo_de_Rosas.jpg/1280px-Golfo_de_Rosas.jpg',
  'Cala Montjoi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Ciutadella_de_Roses-2022.jpg/1280px-Ciutadella_de_Roses-2022.jpg',
  'Cala Jóncols': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Roses_mit_Sporthafen.jpg/1200px-Roses_mit_Sporthafen.jpg',
  'Platja de Lloret': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Lloret_de_Mar_2013.jpg/1280px-Lloret_de_Mar_2013.jpg',
  'Cala Boadella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Platja_de_sa_Boadella_%28Lloret_de_Mar%29.jpg/1280px-Platja_de_sa_Boadella_%28Lloret_de_Mar%29.jpg',
  'Sa Caleta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Platja_de_Lloret.jpg/1200px-Platja_de_Lloret.jpg',
  'Cala Banys': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Platja_de_Lloret.jpg/1200px-Platja_de_Lloret.jpg',
  'Portlligat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Portlligat.jpg/1280px-Portlligat.jpg',
  "Platja Gran (Cadaqués)": 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cadaques_Pueblo_Marinero.JPG/1200px-Cadaques_Pueblo_Marinero.JPG',
  'Cala Nans': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cap_de_Creus_landscape.jpg/1280px-Cap_de_Creus_landscape.jpg',
  'Platja de Blanes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Blanes%2C_Spain_Overview.jpg/1200px-Blanes%2C_Spain_Overview.jpg',
  "Platja de S'Abanell": 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Blanes%2C_Spain_Overview.jpg/1200px-Blanes%2C_Spain_Overview.jpg',
  'Cala Sant Francesc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Sa_Palomera_a_Blanes.jpg/1280px-Sa_Palomera_a_Blanes.jpg',
  'Platja de Sant Pere Pescador': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/SPP056.jpg/1200px-SPP056.jpg',
  'Platja Gran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tossa_de_Mar_Torre%C3%B3n_JMM.JPG/1200px-Tossa_de_Mar_Torre%C3%B3n_JMM.JPG',
  'Platja Mar Menuda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Tossa_A%C3%A9rea.JPG/1280px-Tossa_A%C3%A9rea.JPG',
  'Cala Pola': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Costa_Brava_-_Tossa_de_Mar_-_La_Vila_Vella_-_Passeig_del_Mar_-_View_ENE_through_Portal_%28Passeig_de_la_Vila_Vella%29.jpg/1280px-Costa_Brava_-_Tossa_de_Mar_-_La_Vila_Vella_-_Passeig_del_Mar_-_View_ENE_through_Portal_%28Passeig_de_la_Vila_Vella%29.jpg',
  'Cala Giverola': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Tossa_A%C3%A9rea.JPG/1280px-Tossa_A%C3%A9rea.JPG',
  'Sa Tuna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg',
  'Aiguafreda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/BegurCastle.jpg/1280px-BegurCastle.jpg',
  'Platja de Sa Riera': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Begur_-_2013-07-15_-_Albert_Torello.jpg/1280px-Begur_-_2013-07-15_-_Albert_Torello.jpg',
  'Aiguablava': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg',
  'Platja de Calella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Calella_de_Palafrugell_%2826023087965%29.jpg/1200px-Calella_de_Palafrugell_%2826023087965%29.jpg',
  'Platja del Canadell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Calella_de_Palafrugell_-_53619347398.jpg/1280px-Calella_de_Palafrugell_-_53619347398.jpg',
  'Platja de Llafranc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Calella_de_Palafrugell_%2826023087965%29.jpg/1200px-Calella_de_Palafrugell_%2826023087965%29.jpg',
  "Platja Gran (Platja d'Aro)": 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Platja_Gran_Platja_d%27Aro.jpg/1280px-Platja_Gran_Platja_d%27Aro.jpg',
  'Cala Rovira': 'https://upload.wikimedia.org/wikipedia/commons/9/95/Playa_de_Aro.jpg',
  'Cala del Pi': 'https://upload.wikimedia.org/wikipedia/commons/9/95/Playa_de_Aro.jpg',
  "Platja d'Empuriabrava": 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Panoramic_view_of_Empuriabrava_and_Roses_20090813_1.jpg/1280px-Panoramic_view_of_Empuriabrava_and_Roses_20090813_1.jpg',
  "Platja Gran (Palamós)": 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Palam%C3%B3s_-_view_from_beach.jpg/1280px-Palam%C3%B3s_-_view_from_beach.jpg',
  'Platja de la Fosca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Palam%C3%B3s_-_view_from_beach.jpg/1280px-Palam%C3%B3s_-_view_from_beach.jpg',
  "Cala S'Alguer": 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Cala_Margarida_Palam%C3%B3s.jpg/1280px-Cala_Margarida_Palam%C3%B3s.jpg',
  'Cala Margarida': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Cala_Margarida_Palam%C3%B3s.jpg/1280px-Cala_Margarida_Palam%C3%B3s.jpg',
};

/* ------------------------------------------------------------------ */
/*  Activity photos (matched to locations)                             */
/* ------------------------------------------------------------------ */
const activityPhotos: Record<string, string> = {
  'pals-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Playa_de_Pals_%28Costa_Brava%29.jpg/1280px-Playa_de_Pals_%28Costa_Brava%29.jpg',
  'pals-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Els_Masos_de_Pals.jpg/1280px-Els_Masos_de_Pals.jpg',
  'pals-4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Playa_de_Pals_%28Costa_Brava%29.jpg/1280px-Playa_de_Pals_%28Costa_Brava%29.jpg',
  'pals-6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg',
  'pals-7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Spain%2C_Catalonia%2C_Illes_Medes_%28Medes_Islands%29.JPG/1280px-Spain%2C_Catalonia%2C_Illes_Medes_%28Medes_Islands%29.JPG',
  'est-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Spain%2C_Catalonia%2C_Illes_Medes_%28Medes_Islands%29.JPG/1280px-Spain%2C_Catalonia%2C_Illes_Medes_%28Medes_Islands%29.JPG',
  'est-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Estartit_-_panoramio_%281%29.jpg/1280px-Estartit_-_panoramio_%281%29.jpg',
  'est-6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Estartit.jpg/1200px-Estartit.jpg',
  'ros-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Golfo_de_Rosas.jpg/1280px-Golfo_de_Rosas.jpg',
  'ros-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Ciutadella_de_Roses-2022.jpg/1280px-Ciutadella_de_Roses-2022.jpg',
  'ros-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cap_de_Creus_landscape.jpg/1280px-Cap_de_Creus_landscape.jpg',
  'ros-5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cadaques_Pueblo_Marinero.JPG/1200px-Cadaques_Pueblo_Marinero.JPG',
  'llo-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Lloret_de_Mar_2013.jpg/1280px-Lloret_de_Mar_2013.jpg',
  'llo-2': 'https://upload.wikimedia.org/wikipedia/commons/6/66/Jardins_de_Santa_Clotilde%2C_Lloret_de_Mar.JPG',
  'llo-4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Platja_de_sa_Boadella_%28Lloret_de_Mar%29.jpg/1280px-Platja_de_sa_Boadella_%28Lloret_de_Mar%29.jpg',
  'llo-7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tossa_de_Mar_Torre%C3%B3n_JMM.JPG/1200px-Tossa_de_Mar_Torre%C3%B3n_JMM.JPG',
  'spp-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/SPP056.jpg/1200px-SPP056.jpg',
  'spp-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Kitesurf_a_Sant_Pere_Pescador_-_panoramio.jpg/1280px-Kitesurf_a_Sant_Pere_Pescador_-_panoramio.jpg',
  'spp-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Animales-aiguamolls_l%27emporda-2013.JPG/1280px-Animales-aiguamolls_l%27emporda-2013.JPG',
  'spp-6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Teater_Museu_Gala_Salvador_Dali_building_from_outside.jpg/1200px-Teater_Museu_Gala_Salvador_Dali_building_from_outside.jpg',
  'pda-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Platja_Gran_Platja_d%27Aro.jpg/1280px-Platja_Gran_Platja_d%27Aro.jpg',
  'bla-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Marimurtra_Botanic_Garden_Blanes_Costa_Brava_Catalonia_Spain.jpg/1280px-Marimurtra_Botanic_Garden_Blanes_Costa_Brava_Catalonia_Spain.jpg',
  'bla-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Sa_Palomera_a_Blanes.jpg/1280px-Sa_Palomera_a_Blanes.jpg',
  'bla-7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Blanes%2C_Spain_Overview.jpg/1200px-Blanes%2C_Spain_Overview.jpg',
  'cad-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Portlligat.jpg/1280px-Portlligat.jpg',
  'cad-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cap_de_Creus_landscape.jpg/1280px-Cap_de_Creus_landscape.jpg',
  'beg-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg',
  'beg-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/BegurCastle.jpg/1280px-BegurCastle.jpg',
  'esc-1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/MSodaiguiSTPereFigueres1.jpg/1200px-MSodaiguiSTPereFigueres1.jpg',
  'ce-2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Canal_principal_de_Empuriabrava.jpg/1280px-Canal_principal_de_Empuriabrava.jpg',
  'ce-5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Animales-aiguamolls_l%27emporda-2013.JPG/1280px-Animales-aiguamolls_l%27emporda-2013.JPG',
};

/* ------------------------------------------------------------------ */
/*  Data aggregation                                                   */
/* ------------------------------------------------------------------ */
const allBeaches: (Beach & { destination: string; destSlug: string })[] = destinations.flatMap(d =>
  d.beaches.map(b => ({ ...b, destination: d.name, destSlug: d.slug }))
);

const allRestaurants: (Restaurant & { destination: string; destSlug: string })[] = destinations.flatMap(d =>
  d.restaurants.map(r => ({ ...r, destination: d.name, destSlug: d.slug }))
);

const allActivities: (Activity & { location: string })[] = locationActivities.flatMap(la =>
  la.activities.map(a => ({ ...a, location: la.location }))
);

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatsBar() {
  const stats = [
    { label: 'Bestemmingen', value: destinations.length, icon: <MapPin size={18} /> },
    { label: 'Stranden', value: allBeaches.length, icon: <Umbrella size={18} /> },
    { label: 'Restaurants', value: allRestaurants.length, icon: <UtensilsCrossed size={18} /> },
    { label: 'Activiteiten', value: allActivities.length, icon: <Bike size={18} /> },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="flex justify-center text-primary mb-1">{s.icon}</div>
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function DestinationCard({ dest }: { dest: Destination }) {
  return (
    <Link
      href={`/bestemmingen/${dest.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={dest.heroImage} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
            <Sun size={12} className="text-primary" /> {dest.weather.summer}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-0.5 drop-shadow-lg">{dest.name}</h3>
          <div className="flex items-center gap-1.5 text-white/80 text-xs">
            <MapPin size={12} /> {dest.region}
            {dest.population && <span className="ml-1 text-white/60">&middot; {dest.population}</span>}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">{dest.description}</p>
        {dest.knownFor && (
          <p className="text-xs text-primary font-semibold mb-2 flex items-center gap-1">
            <Sparkles size={11} /> {dest.knownFor}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-2">
          {dest.bestFor.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">
              {bestForIcons[tag] || <Star size={10} />} {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {dest.beaches.length > 0 && <span className="flex items-center gap-1"><Umbrella size={12} /> {dest.beaches.length}</span>}
            {dest.restaurants.length > 0 && <span className="flex items-center gap-1"><UtensilsCrossed size={12} /> {dest.restaurants.length}</span>}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ontdek <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BeachCard({ beach }: { beach: Beach & { destination: string; destSlug: string } }) {
  const vibeColors: Record<string, string> = {
    rustig: 'bg-emerald-100/90 text-emerald-800',
    levendig: 'bg-amber-100/90 text-amber-800',
    wild: 'bg-violet-100/90 text-violet-800',
    familiaal: 'bg-blue-100/90 text-blue-800',
  };
  const vibeIcons: Record<string, string> = {
    rustig: '🌿',
    levendig: '🎉',
    wild: '🌊',
    familiaal: '👨‍👩‍👧‍👦',
  };
  const typeLabels: Record<string, string> = {
    zand: 'Zandstrand',
    kiezel: 'Kiezelstrand',
    rotsen: 'Rotsenstrand',
    mix: 'Gemengd',
  };
  const typeIcons: Record<string, string> = {
    zand: '🏖️',
    kiezel: '🪨',
    rotsen: '⛰️',
    mix: '🏝️',
  };
  const photo = beachPhotos[beach.name];

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="relative h-44 overflow-hidden">
        {photo ? (
          <Image src={photo} alt={beach.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 flex items-center justify-center">
            <Waves size={48} className="text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${vibeColors[beach.vibe] || 'bg-gray-100/90 text-gray-600'}`}>
          {vibeIcons[beach.vibe] || ''} {beach.vibe}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="font-bold text-white text-sm drop-shadow-lg">{beach.name}</h4>
          <Link href={`/bestemmingen/${beach.destSlug}`} className="text-xs text-white/80 font-medium inline-flex items-center gap-1 hover:text-white transition-colors">
            <MapPin size={10} /> {beach.destination}
          </Link>
        </div>
      </div>
      <div className="p-3.5">
        <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">{beach.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
              {typeIcons[beach.type]} {typeLabels[beach.type]}
            </span>
          </div>
          {beach.facilities && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              ✓ Faciliteiten
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant & { destination: string; destSlug: string } }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-bold text-gray-900 text-sm">{restaurant.name}</h4>
        <span className="text-sm font-bold text-primary">{restaurant.price}</span>
      </div>
      <Link href={`/bestemmingen/${restaurant.destSlug}`} className="text-xs text-primary font-medium mb-1 inline-flex items-center gap-1 hover:underline">
        <MapPin size={10} /> {restaurant.destination}
      </Link>
      <p className="text-xs text-gray-500 mb-1">{restaurant.cuisine}</p>
      <p className="text-xs text-gray-600 mb-2 leading-relaxed">{restaurant.description}</p>
      {restaurant.mustTry && (
        <div className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/8 px-2 py-1 rounded-full w-fit">
          <Award size={11} /> Must try: {restaurant.mustTry}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity, location }: { activity: Activity; location: string }) {
  const catColors: Record<string, string> = {
    strand: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    cultuur: 'bg-purple-50 text-purple-700 border-purple-200',
    natuur: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sport: 'bg-orange-50 text-orange-700 border-orange-200',
    kinderen: 'bg-pink-50 text-pink-700 border-pink-200',
    culinair: 'bg-amber-50 text-amber-700 border-amber-200',
    uitstap: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  const catBorder: Record<string, string> = {
    strand: 'border-l-cyan-400',
    cultuur: 'border-l-purple-400',
    natuur: 'border-l-emerald-400',
    sport: 'border-l-orange-400',
    kinderen: 'border-l-pink-400',
    culinair: 'border-l-amber-400',
    uitstap: 'border-l-blue-400',
  };
  const photo = activityPhotos[activity.id];

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 ${photo ? '' : `border-l-4 ${catBorder[activity.category] || 'border-l-gray-300'}`}`}>
      {photo && (
        <div className="relative h-36 overflow-hidden">
          <Image src={photo} alt={activity.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl drop-shadow-lg">{activity.icon}</span>
              <h4 className="font-bold text-white text-sm drop-shadow-lg">{activity.title}</h4>
            </div>
          </div>
          <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${catColors[activity.category] || 'bg-gray-100 text-gray-600'}`}>
            {getCategoryLabel(activity.category)}
          </span>
        </div>
      )}
      <div className="p-4">
        {!photo && (
          <div className="flex items-start gap-3 mb-2">
            <span className="text-2xl">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm">{activity.title}</h4>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${catColors[activity.category] || 'bg-gray-100 text-gray-600'}`}>
              {getCategoryLabel(activity.category)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <MapPin size={10} /> {location}
          {activity.distance && <span className="text-gray-300">&middot;</span>}
          {activity.distance && <span>{activity.distance}</span>}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{activity.description}</p>
        {activity.tip && (
          <div className="mt-2.5 flex items-start gap-2 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100">
            <span className="text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-amber-800 leading-relaxed">{activity.tip}</p>
          </div>
        )}
        {activity.url && (
          <a href={activity.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Meer info <ChevronRight size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Sidebar                                                    */
/* ------------------------------------------------------------------ */
function SidebarFilters({
  activeTab, setActiveTab,
  selectedRegion, setSelectedRegion,
  beachFilter, setBeachFilter,
  priceFilter, setPriceFilter,
  activityCat, setActivityCat,
  showMap, setShowMap,
  filteredCount,
}: {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  selectedRegion: string | null;
  setSelectedRegion: (r: string | null) => void;
  beachFilter: string | null;
  setBeachFilter: (f: string | null) => void;
  priceFilter: string | null;
  setPriceFilter: (f: string | null) => void;
  activityCat: string | null;
  setActivityCat: (c: string | null) => void;
  showMap: boolean;
  setShowMap: (s: boolean) => void;
  filteredCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categorie</p>
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Regio */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Regio</p>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedRegion(null)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
              !selectedRegion ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Alle regio&apos;s
          </button>
          {regionOrder.map(r => (
            <button
              key={r}
              onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                selectedRegion === r ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {regionIcons[r]} {r}
            </button>
          ))}
        </div>
      </div>

      {/* Beach type */}
      {activeTab === 'stranden' && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Strandtype</p>
          <div className="space-y-1">
            {[
              { key: null, label: 'Alle stranden' },
              { key: 'familiaal', label: 'Familiaal' },
              { key: 'rustig', label: 'Rustig' },
              { key: 'levendig', label: 'Levendig' },
              { key: 'wild', label: 'Wild' },
              { key: 'faciliteiten', label: 'Met faciliteiten' },
            ].map(f => (
              <button
                key={f.key ?? 'all'}
                onClick={() => setBeachFilter(beachFilter === f.key ? null : f.key)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                  beachFilter === f.key ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      {activeTab === 'restaurants' && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Prijsklasse</p>
          <div className="space-y-1">
            {[
              { key: null, label: 'Alle prijzen' },
              { key: '\u20AC', label: '\u20AC Budget' },
              { key: '\u20AC\u20AC', label: '\u20AC\u20AC Midden' },
              { key: '\u20AC\u20AC\u20AC', label: '\u20AC\u20AC\u20AC Fine dining' },
              { key: '\u20AC\u20AC\u20AC\u20AC', label: '\u20AC\u20AC\u20AC\u20AC Michelin' },
            ].map(f => (
              <button
                key={f.key ?? 'all'}
                onClick={() => setPriceFilter(priceFilter === f.key ? null : f.key)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                  priceFilter === f.key ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity category */}
      {activeTab === 'activiteiten' && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Type activiteit</p>
          <div className="space-y-1">
            {[
              { key: null, label: 'Alle' },
              { key: 'strand', label: 'Strand & Zee' },
              { key: 'cultuur', label: 'Cultuur' },
              { key: 'natuur', label: 'Natuur' },
              { key: 'sport', label: 'Sport' },
              { key: 'kinderen', label: 'Kinderen' },
              { key: 'culinair', label: 'Culinair' },
              { key: 'uitstap', label: 'Uitstap' },
            ].map(f => (
              <button
                key={f.key ?? 'all'}
                onClick={() => setActivityCat(activityCat === f.key ? null : f.key)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left ${
                  activityCat === f.key ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map toggle (desktop only — map hidden on mobile) */}
      {(activeTab === 'overzicht' || activeTab === 'steden') && (
        <button
          onClick={() => setShowMap(!showMap)}
          className="w-full hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
        >
          <Map size={14} /> {showMap ? 'Verberg kaart' : 'Toon kaart'}
        </button>
      )}

      {/* Result count */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-600">{filteredCount}</span> resultaten
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function DestinationsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('overzicht');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [beachFilter, setBeachFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [activityCat, setActivityCat] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedRegion(null);
    setBeachFilter(null);
    setPriceFilter(null);
    setActivityCat(null);
  };

  const filteredDestinations = useMemo(() => {
    let filtered = destinations;
    if (selectedRegion) filtered = filtered.filter(d => d.region === selectedRegion);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.knownFor?.toLowerCase().includes(q) ||
        d.bestFor.some(b => b.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [searchQuery, selectedRegion]);

  const filteredBeaches = useMemo(() => {
    let filtered = allBeaches;
    if (selectedRegion) {
      const regionDests = destinations.filter(d => d.region === selectedRegion).map(d => d.slug);
      filtered = filtered.filter(b => regionDests.includes(b.destSlug));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.name.toLowerCase().includes(q) || b.destination.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
    }
    if (beachFilter) {
      if (beachFilter === 'faciliteiten') filtered = filtered.filter(b => b.facilities);
      else filtered = filtered.filter(b => b.vibe === beachFilter);
    }
    return filtered;
  }, [searchQuery, beachFilter, selectedRegion]);

  const filteredRestaurants = useMemo(() => {
    let filtered = allRestaurants;
    if (selectedRegion) {
      const regionDests = destinations.filter(d => d.region === selectedRegion).map(d => d.slug);
      filtered = filtered.filter(r => regionDests.includes(r.destSlug));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));
    }
    if (priceFilter) filtered = filtered.filter(r => r.price === priceFilter);
    return filtered;
  }, [searchQuery, priceFilter, selectedRegion]);

  const filteredActivities = useMemo(() => {
    let filtered = allActivities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    if (activityCat) filtered = filtered.filter(a => a.category === activityCat);
    return filtered;
  }, [searchQuery, activityCat]);

  const filteredCount = activeTab === 'overzicht' || activeTab === 'steden'
    ? filteredDestinations.length
    : activeTab === 'stranden'
    ? filteredBeaches.length
    : activeTab === 'restaurants'
    ? filteredRestaurants.length
    : filteredActivities.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HERO ===== */}
      <section className="relative h-[40vh] min-h-[300px] lg:h-[45vh] overflow-hidden">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg"
          alt="Costa Brava kust"
          fill className="object-cover" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold mb-3 uppercase tracking-wider">
            <Compass size={13} /> Encyclopedie
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Costa Brava <span className="text-primary">Gids</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto drop-shadow">
            Ontdek {destinations.length} bestemmingen, {allBeaches.length} stranden, {allRestaurants.length} restaurants en {allActivities.length}+ activiteiten.
          </p>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-10 mb-6">
        <StatsBar />
      </section>

      {/* ===== MOBILE: Tab bar + Search + Filters ===== */}
      <section className="lg:hidden sticky top-[80px] sm:top-[96px] z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="px-4 py-2">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar mb-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600"
            >
              <Filter size={13} /> Filters
              <ChevronDown size={12} className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showMobileFilters && (
          <div className="px-4 pb-3 pt-1 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Regio</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${!selectedRegion ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Alle
                </button>
                {regionOrder.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedRegion === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'stranden' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: null, label: 'Alle' },
                    { key: 'familiaal', label: 'Familiaal' },
                    { key: 'rustig', label: 'Rustig' },
                    { key: 'levendig', label: 'Levendig' },
                    { key: 'wild', label: 'Wild' },
                    { key: 'faciliteiten', label: 'Faciliteiten' },
                  ].map(f => (
                    <button
                      key={f.key ?? 'all'}
                      onClick={() => setBeachFilter(beachFilter === f.key ? null : f.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${beachFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'restaurants' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Prijs</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: null, label: 'Alle' },
                    { key: '\u20AC', label: '\u20AC' },
                    { key: '\u20AC\u20AC', label: '\u20AC\u20AC' },
                    { key: '\u20AC\u20AC\u20AC', label: '\u20AC\u20AC\u20AC' },
                    { key: '\u20AC\u20AC\u20AC\u20AC', label: '\u20AC\u20AC\u20AC\u20AC' },
                  ].map(f => (
                    <button
                      key={f.key ?? 'all'}
                      onClick={() => setPriceFilter(priceFilter === f.key ? null : f.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${priceFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activiteiten' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: null, label: 'Alle' },
                    { key: 'strand', label: 'Strand' },
                    { key: 'cultuur', label: 'Cultuur' },
                    { key: 'natuur', label: 'Natuur' },
                    { key: 'sport', label: 'Sport' },
                    { key: 'kinderen', label: 'Kinderen' },
                    { key: 'culinair', label: 'Culinair' },
                  ].map(f => (
                    <button
                      key={f.key ?? 'all'}
                      onClick={() => setActivityCat(activityCat === f.key ? null : f.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${activityCat === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{filteredCount}</span> resultaten</p>
          </div>
        )}
      </section>

      {/* ===== MAIN LAYOUT: Sidebar + Content ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[90px] bg-white rounded-2xl p-5 shadow-sm">
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Zoek..."
                  className="w-full pl-8 pr-7 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
              <SidebarFilters
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                beachFilter={beachFilter}
                setBeachFilter={setBeachFilter}
                priceFilter={priceFilter}
                setPriceFilter={setPriceFilter}
                activityCat={activityCat}
                setActivityCat={setActivityCat}
                showMap={showMap}
                setShowMap={setShowMap}
                filteredCount={filteredCount}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">

            {/* ========== OVERZICHT ========== */}
            {activeTab === 'overzicht' && (
              <>
                {showMap && (
                  <div className="mb-8 hidden lg:block">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Map size={20} className="text-primary" /> Interactieve Kaart
                    </h2>
                    <CostaBravaMap destinations={destinations} />
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 mb-10">
                  {filteredDestinations.map(dest => (
                    <DestinationCard key={dest.id} dest={dest} />
                  ))}
                </div>

                {filteredDestinations.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-400 text-lg">Geen bestemmingen gevonden</p>
                  </div>
                )}

                {/* Quick highlights */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Umbrella size={16} className="text-primary" /> Top stranden
                    </h3>
                    <div className="space-y-2">
                      {allBeaches.filter(b => b.facilities && b.type === 'zand').slice(0, 5).map((b, i) => (
                        <Link key={`${b.destSlug}-${b.name}`} href={`/bestemmingen/${b.destSlug}`} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                          <span className="text-xl font-bold text-primary/30">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{b.name}</p>
                            <p className="text-xs text-gray-500">{b.destination} &middot; {b.vibe}</p>
                          </div>
                          <ChevronRight size={16} className="text-primary flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <UtensilsCrossed size={16} className="text-primary" /> Culinaire highlights
                    </h3>
                    <div className="space-y-2">
                      {allRestaurants.filter(r => r.price === '\u20AC\u20AC\u20AC' || r.price === '\u20AC\u20AC\u20AC\u20AC').slice(0, 5).map((r, i) => (
                        <Link key={`${r.destSlug}-${r.name}`} href={`/bestemmingen/${r.destSlug}`} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                          <span className="text-xl font-bold text-primary/30">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{r.name}</p>
                            <p className="text-xs text-gray-500">{r.destination} &middot; {r.price}</p>
                          </div>
                          <ChevronRight size={16} className="text-primary flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========== STEDEN ========== */}
            {activeTab === 'steden' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Steden &amp; Dorpen aan de Costa Brava</h2>
                <p className="text-gray-500 text-sm mb-5">Van middeleeuwse bergdorpjes tot bruisende kustplaatsen.</p>

                <div className="space-y-4">
                  {filteredDestinations.map(dest => (
                    <Link
                      key={dest.id}
                      href={`/bestemmingen/${dest.slug}`}
                      className="group grid md:grid-cols-[260px_1fr] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="relative h-44 md:h-auto overflow-hidden">
                        <Image src={dest.heroImage} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-0.5">{dest.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin size={12} /> {dest.region}
                              {dest.population && <span>&middot; {dest.population}</span>}
                            </div>
                          </div>
                          {dest.knownFor && (
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{dest.knownFor}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">{dest.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {dest.bestFor.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">
                              {bestForIcons[tag] || <Star size={10} />} {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><Sun size={12} className="text-primary" /> {dest.weather.summer}</span>
                          <span className="flex items-center gap-1"><Umbrella size={12} /> {dest.beaches.length} stranden</span>
                          <span className="flex items-center gap-1"><UtensilsCrossed size={12} /> {dest.restaurants.length} restaurants</span>
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            Meer info <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredDestinations.length === 0 && (
                  <div className="text-center py-16"><p className="text-gray-400 text-lg">Geen steden gevonden</p></div>
                )}
              </>
            )}

            {/* ========== STRANDEN ========== */}
            {activeTab === 'stranden' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Stranden van de Costa Brava</h2>
                <p className="text-gray-500 text-sm mb-5">{allBeaches.length} stranden en baaien &mdash; van uitgestrekte zandstranden tot verborgen rotsbaaien.</p>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredBeaches.map((b, i) => (
                    <BeachCard key={`${b.destSlug}-${b.name}-${i}`} beach={b} />
                  ))}
                </div>

                {filteredBeaches.length === 0 && (
                  <div className="text-center py-16"><p className="text-gray-400 text-lg">Geen stranden gevonden</p></div>
                )}
              </>
            )}

            {/* ========== RESTAURANTS ========== */}
            {activeTab === 'restaurants' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Restaurants aan de Costa Brava</h2>
                <p className="text-gray-500 text-sm mb-5">{allRestaurants.length} restaurants &mdash; van strandtenten tot Michelinster-restaurants.</p>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRestaurants.map((r, i) => (
                    <RestaurantCard key={`${r.destSlug}-${r.name}-${i}`} restaurant={r} />
                  ))}
                </div>

                {filteredRestaurants.length === 0 && (
                  <div className="text-center py-16"><p className="text-gray-400 text-lg">Geen restaurants gevonden</p></div>
                )}
              </>
            )}

            {/* ========== ACTIVITEITEN ========== */}
            {activeTab === 'activiteiten' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Activiteiten aan de Costa Brava</h2>
                <p className="text-gray-500 text-sm mb-5">{allActivities.length} tips voor uitjes, sport, cultuur en meer.</p>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredActivities.map((a, i) => (
                    <ActivityCard key={`${a.location}-${a.id}-${i}`} activity={a} location={a.location} />
                  ))}
                </div>

                {filteredActivities.length === 0 && (
                  <div className="text-center py-16"><p className="text-gray-400 text-lg">Geen activiteiten gevonden</p></div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* End of content */}

      <style jsx global>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

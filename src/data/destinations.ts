export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  heroImage: string;
  description: string;
  highlights: string[];
  bestFor: string[];
  nearestCampings: string[];
  weather: { summer: string; water: string };
  travelTip: string;
  coordinates: { lat: number; lng: number };
}

export const destinations: Destination[] = [
  {
    id: '1',
    slug: 'pals',
    name: 'Pals',
    region: 'Baix Empordà',
    heroImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
    description: 'Pals is een betoverend middeleeuws dorpje op een heuvel met uitzicht over rijstvelden en de Middellandse Zee. De smalle straatjes, gotische kerk en romaanse toren maken het tot een pareltje aan de Costa Brava. Het uitgestrekte strand van Platja de Pals biedt kilometers fijn zand omringd door pijnbomen.',
    highlights: [
      'Middeleeuws centrum met gotische architectuur',
      'Platja de Pals — breed zandstrand met duinen',
      'Rijstvelden van Pals (lokale delicatesse)',
      'Golfbaan direct aan zee',
      'Wandelroutes door het Massís de Begur',
    ],
    bestFor: ['Gezinnen', 'Cultuurliefhebbers', 'Strandvakantie'],
    nearestCampings: ['Camping Cypsela Resort', 'Camping Playa Brava', 'Camping Interpals'],
    weather: { summer: '28-32°C', water: '22-25°C' },
    travelTip: 'Bezoek de wekelijkse markt op dinsdag voor lokale producten. De rijst van Pals is beroemd in heel Catalonië!',
    coordinates: { lat: 41.971, lng: 3.148 },
  },
  {
    id: '2',
    slug: 'estartit',
    name: 'L\'Estartit',
    region: 'Baix Empordà',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    description: 'L\'Estartit is dé plaats voor duikers en snorkelaars aan de Costa Brava. Het beschermde Nationaal Park Illes Medes ligt op slechts een korte boottocht van de kust en herbergt een ongekende onderwaterwereld. De lange boulevard en het brede strand maken het ook perfect voor families.',
    highlights: [
      'Illes Medes — top duik- en snorkelbestemming',
      'Breed zandstrand met ondiepe zee',
      'Strandpromenade met restaurants',
      'Bootexcursies naar de eilanden',
      'GR-92 kustpad richting Begur',
    ],
    bestFor: ['Duikers', 'Gezinnen', 'Natuurliefhebbers'],
    nearestCampings: ['Camping Les Medes', 'Camping Castell Montgri'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Boek een glasbodemboot naar de Illes Medes — je ziet de onderwaterwereld zonder nat te worden. Perfecte activiteit met kinderen!',
    coordinates: { lat: 42.051, lng: 3.199 },
  },
  {
    id: '3',
    slug: 'roses',
    name: 'Roses',
    region: 'Alt Empordà',
    heroImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
    description: 'Roses combineert een bruisende badplaats met indrukwekkende historie. De enorme baai biedt beschut water, ideaal voor watersport. De Ciutadella — een 16e-eeuwse citadel — kijkt uit over de jachthaven. In de omgeving liggen verborgen baaien in het Cap de Creus natuurpark.',
    highlights: [
      'Prachtige baai met zonsondergangen',
      'Ciutadella de Roses (historische citadel)',
      'Cap de Creus Natuurpark',
      'Watersportmogelijkheden (kajakken, SUP)',
      'Levendig centrum met terrassen',
    ],
    bestFor: ['Watersporters', 'Families', 'Culinair'],
    nearestCampings: ['Camping Rodas', 'Camping Joncar Mar'],
    weather: { summer: '28-33°C', water: '22-25°C' },
    travelTip: 'Rijd naar Cap de Creus voor de zonsondergang — het meest oostelijke puntje van Spanje. Dalí liet zich hier inspireren!',
    coordinates: { lat: 42.263, lng: 3.176 },
  },
  {
    id: '4',
    slug: 'lloret-de-mar',
    name: 'Lloret de Mar',
    region: 'La Selva',
    heroImage: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=1200&q=80',
    description: 'Lloret de Mar is de levendigste badplaats aan de Costa Brava. Naast het beroemde hoofdstrand zijn er verborgen baaien zoals Cala Boadella en Sa Caleta. De botanische tuinen Santa Clotilde bieden een oase van rust met spectaculair uitzicht over de Middellandse Zee.',
    highlights: [
      'Hoofdstrand met helder turquoise water',
      'Jardins de Santa Clotilde',
      'Cala Boadella (rustig naaktstrand)',
      'Kasteel Sant Joan met panoramisch uitzicht',
      'Waterpark Water World',
    ],
    bestFor: ['Jongeren', 'Gezinnen', 'Strandliefhebbers'],
    nearestCampings: ['Camping Tucan', 'Camping Lloret Blau'],
    weather: { summer: '28-32°C', water: '23-26°C' },
    travelTip: 'Loop het Camí de Ronda kustpad naar Tossa de Mar — een spectaculaire wandeling van 12 km langs kliffen en verborgen baaien.',
    coordinates: { lat: 41.700, lng: 2.845 },
  },
  {
    id: '5',
    slug: 'cadaques',
    name: 'Cadaqués',
    region: 'Alt Empordà',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    description: 'Cadaqués is het kunstenaarsdorp aan de Costa Brava waar Salvador Dalí jarenlang woonde en werkte. De witgekalkte huizen, smalle straatjes en kristalheldere baaien creëren een magische sfeer. Het Dalí-huis en museum in Portlligat is een must-see.',
    highlights: [
      'Casa-Museu Salvador Dalí',
      'Witgekalkt historisch centrum',
      'Kristalheldere baaien (Portlligat)',
      'Cap de Creus wandelingen',
      'Lokale vis- en zeevruchten restaurants',
    ],
    bestFor: ['Cultuurliefhebbers', 'Koppels', 'Kunstenaars'],
    nearestCampings: ['Camping Cadaqués'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Reserveer vooraf voor het Dalí-huis — het is erg populair. Bezoek in de ochtend voor het beste licht in het dorp.',
    coordinates: { lat: 42.289, lng: 3.278 },
  },
  {
    id: '6',
    slug: 'blanes',
    name: 'Blanes',
    region: 'La Selva',
    heroImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
    description: 'Blanes wordt beschouwd als de poort tot de Costa Brava. De Jardí Botànic Marimurtra is een van de mooiste tuinen van Europa. De Sa Palomera rots verdeelt het strand in twee: het bruisende stadscentrum en de rustigere kant richting de haven.',
    highlights: [
      'Jardí Botànic Marimurtra',
      'Sa Palomera rots (icoon van de Costa Brava)',
      'Groot stadsstrand en haven',
      'Vuurwerkfestival in juli',
      'Nabij Tordera Delta natuurgebied',
    ],
    bestFor: ['Gezinnen', 'Natuurliefhebbers', 'Budgetvriendelijk'],
    nearestCampings: ['Camping Blanes', 'Camping S\'Abanell'],
    weather: { summer: '28-32°C', water: '23-26°C' },
    travelTip: 'Het internationale vuurwerkfestival eind juli is spectaculair — elke avond een andere show boven de baai!',
    coordinates: { lat: 41.674, lng: 2.790 },
  },
  {
    id: '7',
    slug: 'sant-pere-pescador',
    name: 'Sant Pere Pescador',
    region: 'Alt Empordà',
    heroImage: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    description: 'Sant Pere Pescador ligt aan de monding van de rivier Fluvià en is omringd door het Natuurpark Aiguamolls de l\'Empordà. Het uitgestrekte wild strand is een van de langste van de Costa Brava — perfect voor kitesurfen en windsurfen. Hier vind je rust, natuur en ruimte.',
    highlights: [
      'Kilometerlang wild strand',
      'Natuurpark Aiguamolls (vogelrijk)',
      'Kitesurfen & windsurfen hotspot',
      'Fietsen langs de rivier Fluvià',
      'Biologische landbouw en lokale producten',
    ],
    bestFor: ['Surfers', 'Natuurliefhebbers', 'Rust zoekers'],
    nearestCampings: ['Camping Las Dunas', 'Camping L\'Àmfora', 'Camping Aquarius'],
    weather: { summer: '27-31°C', water: '20-23°C' },
    travelTip: 'Huur een fiets en rijd door het Aiguamolls natuurpark — flamingo\'s, ooievaars en ijsvogels spotten!',
    coordinates: { lat: 42.189, lng: 3.099 },
  },
  {
    id: '8',
    slug: 'tossa-de-mar',
    name: 'Tossa de Mar',
    region: 'La Selva',
    heroImage: 'https://images.unsplash.com/photo-1530538987395-032d1800fdd4?w=1200&q=80',
    description: 'Tossa de Mar is misschien wel de mooiste badplaats aan de Costa Brava. De Vila Vella — een ommuurde middeleeuwse stad op de rotsen boven het strand — is het enige bewaarde versterkte middeleeuwse dorp aan de Catalaanse kust. Het hoofdstrand Platja Gran biedt helder water met uitzicht op de oude stadsmuren.',
    highlights: [
      'Vila Vella — UNESCO beschermd middeleeuws dorp',
      'Platja Gran met uitzicht op de muren',
      'Museo Municipal (eerste Chagall museum)',
      'Verborgen baaien per kustpad',
      'Nachtleven en restaurants in het centrum',
    ],
    bestFor: ['Koppels', 'Cultuurliefhebbers', 'Fotografen'],
    nearestCampings: ['Camping Cala Llevadó', 'Camping Pola'],
    weather: { summer: '28-32°C', water: '22-25°C' },
    travelTip: 'Beklim de Vila Vella bij zonsopgang voor het mooiste licht en lege straten — overdag kan het druk zijn.',
    coordinates: { lat: 41.722, lng: 2.933 },
  },
];

export function getDestinationBySlug(slug: string): Destination | undefined {
  return destinations.find(d => d.slug === slug);
}

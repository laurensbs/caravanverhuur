export interface Restaurant {
  name: string;
  cuisine: string;
  price: '€' | '€€' | '€€€' | '€€€€';
  description: string;
  mustTry?: string;
}

export interface Beach {
  name: string;
  type: 'zand' | 'kiezel' | 'rotsen' | 'mix';
  vibe: 'rustig' | 'levendig' | 'wild' | 'familiaal';
  description: string;
  facilities: boolean;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  heroImage: string;
  gallery: string[];
  description: string;
  longDescription?: string;
  highlights: string[];
  bestFor: string[];
  nearestCampings: string[];
  weather: { summer: string; water: string };
  travelTip: string;
  coordinates: { lat: number; lng: number };
  restaurants: Restaurant[];
  beaches: Beach[];
  population?: string;
  knownFor?: string;
}

export const destinations: Destination[] = [
  {
    id: '1',
    slug: 'pals',
    name: 'Pals',
    region: 'Baix Empordà',
    heroImage: '/images/campings/els_masos_de_pals.jpg',
    gallery: [
      '/images/campings/els_masos_de_pals.jpg',
      '/images/destinations/arr_s_de_pals.jpg',
    ],
    description: 'Pals is een betoverend middeleeuws dorpje op een heuvel met uitzicht over rijstvelden en de Middellandse Zee. De smalle straatjes, gotische kerk en romaanse toren maken het tot een pareltje aan de Costa Brava. Het uitgestrekte strand van Platja de Pals biedt kilometers fijn zand omringd door pijnbomen.',
    longDescription: 'Het historisch centrum van Pals, lokaal bekend als "El Pedró", is een van de best bewaarde middeleeuwse kernen van Catalonië. De romaanse toren uit de 11e-12e eeuw domineert het silhouet van het dorp en biedt een spectaculair uitzicht over de vlakte van het Empordà tot aan de Illes Medes. De rijstvelden rondom Pals zijn uniek voor de Costa Brava — hier wordt al eeuwenlang rijst verbouwd, wat heeft geleid tot een rijke culinaire traditie.',
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
    population: '~2.800',
    knownFor: 'Middeleeuws dorp & rijstvelden',
    restaurants: [
      { name: 'Restaurant Sa Punta', cuisine: 'Mediterraan / Rijstgerechten', price: '€€€', description: 'Iconisch restaurant aan de rijstvelden met de beste arròs de Pals van de regio.', mustTry: 'Arròs de Pals' },
      { name: 'Vicus Restaurant', cuisine: 'Catalaans modern', price: '€€', description: 'Creatieve Catalaanse keuken in het middeleeuwse centrum. Rustige binnenplaats.', mustTry: 'Gecremeerde risotto met truffel' },
      { name: 'Mas Pou', cuisine: 'Traditioneel Catalaans', price: '€€', description: 'Historische masía met authentieke gerechten uit het Empordà.', mustTry: 'Gegrild vlees op houtvuur' },
    ],
    beaches: [
      { name: 'Platja de Pals', type: 'zand', vibe: 'familiaal', description: 'Kilometers breed goudkleurig zandstrand omringd door pijnbomenbossen.', facilities: true },
      { name: 'Platja del Grau', type: 'zand', vibe: 'rustig', description: 'Smaller, natuurlijker strand aan de noordkant met duinlandschap.', facilities: false },
    ],
  },
  {
    id: '2',
    slug: 'estartit',
    name: "L'Estartit",
    region: 'Baix Empordà',
    heroImage: '/images/campings/estartit.jpg',
    gallery: [
      '/images/campings/estartit.jpg',
      '/images/campings/spain__catalonia__illes_medes__medes_islands_.jpg',
    ],
    description: "L'Estartit is dé plaats voor duikers en snorkelaars aan de Costa Brava. Het beschermde Nationaal Park Illes Medes herbergt een ongekende onderwaterwereld. De lange boulevard en het brede strand maken het ook perfect voor families.",
    longDescription: 'De Illes Medes vormen een van de belangrijkste mariene reservaten van de westelijke Mediterrane Zee. Het archipel van zeven eilandjes herbergt meer dan 1.400 diersoorten. Vanuit de haven vertrekken dagelijks glasbodem boten en duikexcursies.',
    highlights: ['Illes Medes — top duik- en snorkelbestemming', 'Breed zandstrand met ondiepe zee', 'Strandpromenade met restaurants', 'Bootexcursies naar de eilanden', 'GR-92 kustpad richting Begur'],
    bestFor: ['Duikers', 'Gezinnen', 'Natuurliefhebbers'],
    nearestCampings: ['Camping Les Medes', 'Camping Castell Montgri'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Boek een glasbodemboot naar de Illes Medes — je ziet de onderwaterwereld zonder nat te worden!',
    coordinates: { lat: 42.051, lng: 3.199 },
    population: '~3.100',
    knownFor: 'Illes Medes & duiken',
    restaurants: [
      { name: 'Restaurant Les Corones', cuisine: 'Vis & zeevruchten', price: '€€€', description: 'Boulevard-restaurant met dagverse vis direct van de haven.', mustTry: 'Suquet de peix' },
      { name: 'La Sal', cuisine: 'Mediterraan', price: '€€', description: 'Modern restaurant aan het strand met heerlijke tapas en paella.', mustTry: 'Paella mixta' },
      { name: 'Carpe Diem', cuisine: 'Italiaans / Mediterraan', price: '€', description: 'Populair familierestaurant op de boulevard.', mustTry: 'Huisgemaakte pasta' },
    ],
    beaches: [
      { name: "Platja de l'Estartit", type: 'zand', vibe: 'levendig', description: 'Twee kilometer stadsstrand met alle faciliteiten.', facilities: true },
      { name: 'Platja de la Pletera', type: 'zand', vibe: 'wild', description: 'Ongerept duin-strand in het beschermde Ter Vell natuurgebied.', facilities: false },
    ],
  },
  {
    id: '3',
    slug: 'roses',
    name: 'Roses',
    region: 'Alt Empordà',
    heroImage: '/images/campings/roses_mit_sporthafen.jpg',
    gallery: [
      '/images/campings/roses_mit_sporthafen.jpg',
      '/images/campings/ciutadella_de_roses-2022.jpg',
      '/images/campings/golfo_de_rosas.jpg',
    ],
    description: 'Roses combineert een bruisende badplaats met indrukwekkende historie. De enorme baai biedt beschut water, ideaal voor watersport. In de omgeving liggen verborgen baaien in het Cap de Creus natuurpark.',
    longDescription: 'De Golf van Roses is een van de grootste baaien van de Middellandse Zee. Het voormalige restaurant elBulli van Ferran Adrià lag in de heuvels boven Roses en maakte de stad wereldberoemd in de culinaire wereld.',
    highlights: ['Prachtige baai met zonsondergangen', 'Ciutadella de Roses', 'Cap de Creus Natuurpark', 'Watersportmogelijkheden', 'Levendig centrum met terrassen'],
    bestFor: ['Watersporters', 'Families', 'Culinair'],
    nearestCampings: ['Camping Rodas', 'Camping Joncar Mar'],
    weather: { summer: '28-33°C', water: '22-25°C' },
    travelTip: 'Rijd naar Cap de Creus voor de zonsondergang — het meest oostelijke puntje van Spanje.',
    coordinates: { lat: 42.263, lng: 3.176 },
    population: '~20.000',
    knownFor: 'Baai & zonsondergangen',
    restaurants: [
      { name: 'Restaurant Els Brancs', cuisine: 'Moderne Catalaanse keuken', price: '€€€€', description: 'Michelinster-restaurant met spectaculair zeezicht.', mustTry: 'Degustatiemenu' },
      { name: 'La Llar', cuisine: 'Vis & zeevruchten', price: '€€', description: 'Havenrestaurant met de verste vis van de dag.', mustTry: 'Fideuà' },
      { name: 'Restaurant Roc Fort', cuisine: 'Mediterraan', price: '€€', description: 'Terras met vista op de Ciutadella.', mustTry: 'Gegrilde inktvis met romesco' },
    ],
    beaches: [
      { name: 'Platja de Roses', type: 'zand', vibe: 'levendig', description: 'Groot stadsstrand met watersport.', facilities: true },
      { name: 'Cala Montjoi', type: 'kiezel', vibe: 'rustig', description: 'Verborgen baai waar elBulli lag. Kristalhelder water.', facilities: false },
      { name: 'Cala Jóncols', type: 'kiezel', vibe: 'wild', description: 'Afgelegen baai in het Cap de Creus park.', facilities: false },
    ],
  },
  {
    id: '4',
    slug: 'lloret-de-mar',
    name: 'Lloret de Mar',
    region: 'La Selva',
    heroImage: '/images/campings/platja_de_lloret.jpg',
    gallery: [
      '/images/campings/platja_de_lloret.jpg',
      '/images/destinations/jardins_de_santa_clotilde__lloret_de_mar.jpg',
      '/images/campings/platja_de_sa_boadella__lloret_de_mar_.jpg',
    ],
    description: 'Lloret de Mar is de levendigste badplaats aan de Costa Brava. Naast het beroemde hoofdstrand zijn er verborgen baaien zoals Cala Boadella en Sa Caleta. De botanische tuinen Santa Clotilde bieden een oase van rust.',
    longDescription: 'Lloret de Mar heeft zich ontwikkeld van een klein vissersdorp tot de grootste toeristische gemeente aan de Costa Brava. De Jardins de Santa Clotilde, aangelegd in 1919, zijn een van de mooiste tuincreaties aan de Middellandse Zee.',
    highlights: ['Hoofdstrand met turquoise water', 'Jardins de Santa Clotilde', 'Cala Boadella', 'Kasteel Sant Joan', 'Waterpark Water World'],
    bestFor: ['Jongeren', 'Gezinnen', 'Strandliefhebbers'],
    nearestCampings: ['Camping Tucan', 'Camping Lloret Blau'],
    weather: { summer: '28-32°C', water: '23-26°C' },
    travelTip: 'Loop het Camí de Ronda naar Tossa de Mar — 12 km langs kliffen en verborgen baaien.',
    coordinates: { lat: 41.700, lng: 2.845 },
    population: '~40.000',
    knownFor: 'Stranden & uitgaansleven',
    restaurants: [
      { name: 'Restaurant El Trull', cuisine: 'Catalaans traditioneel', price: '€€€', description: 'Historisch restaurant in een oude olijfmolen.', mustTry: 'Solomillo op houtvuur' },
      { name: 'Ca la Nuri', cuisine: 'Vis & zeevruchten', price: '€€', description: 'Authentiek visrestaurant. Favoriet van de locals.', mustTry: 'Arròs a la cassola' },
      { name: 'Es Tint', cuisine: 'Mediterraan fusion', price: '€€', description: 'Trendy restaurant met creatieve tapas en cocktails.', mustTry: 'Tonijn tataki' },
    ],
    beaches: [
      { name: 'Platja de Lloret', type: 'zand', vibe: 'levendig', description: '1,6 km lang iconisch strand met turquoise water.', facilities: true },
      { name: 'Cala Boadella', type: 'zand', vibe: 'rustig', description: 'Verborgen baai omringd door pijnbomen. Naturistenstrand.', facilities: false },
      { name: 'Sa Caleta', type: 'zand', vibe: 'familiaal', description: 'Klein beschut strandje, ideaal voor kinderen.', facilities: true },
      { name: 'Cala Banys', type: 'rotsen', vibe: 'rustig', description: 'Rotsachtige baai perfect voor snorkelen.', facilities: false },
    ],
  },
  {
    id: '5',
    slug: 'cadaques',
    name: 'Cadaqués',
    region: 'Alt Empordà',
    heroImage: '/images/campings/cadaques_pueblo_marinero.jpg',
    gallery: [
      '/images/campings/cadaques_pueblo_marinero.jpg',
      '/images/campings/portlligat.jpg',
      '/images/campings/cap_de_creus_landscape.jpg',
    ],
    description: 'Cadaqués is het kunstenaarsdorp aan de Costa Brava waar Salvador Dalí jarenlang woonde. De witgekalkte huizen, smalle straatjes en kristalheldere baaien creëren een magische sfeer.',
    longDescription: 'Geïsoleerd achter de Serra de Rodes trok Cadaqués kunstenaars aan: Picasso, Duchamp en vooral Dalí. De witgekalkte huizen met blauwe luiken en de kristalheldere baaien vormen het meest fotogenieke dorp van de Costa Brava.',
    highlights: ['Casa-Museu Salvador Dalí', 'Witgekalkt centrum', 'Kristalheldere baaien', 'Cap de Creus wandelingen', 'Vis- en zeevruchten restaurants'],
    bestFor: ['Cultuurliefhebbers', 'Koppels', 'Kunstenaars'],
    nearestCampings: ['Camping Cadaqués'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Reserveer vooraf voor het Dalí-huis — het is erg populair.',
    coordinates: { lat: 42.289, lng: 3.278 },
    population: '~2.900',
    knownFor: 'Dalí & kunstenaarsdorp',
    restaurants: [
      { name: 'Compartir', cuisine: 'Mediterraan / Tapas', price: '€€€', description: 'Van voormalige elBulli chefs. Creatieve deelgerechten.', mustTry: 'Brioix de gambas' },
      { name: 'Casa Anita', cuisine: 'Traditionele zeevruchten', price: '€€', description: "Legendarisch restaurant waar Dalí at. Geen menu — je eet wat er is.", mustTry: 'Verse vis van de dag' },
      { name: 'Es Baluard', cuisine: 'Vis & zeevruchten', price: '€€€', description: 'Elegant restaurant direct aan het water met zonsondergangview.', mustTry: 'Kreeftenrijst' },
    ],
    beaches: [
      { name: 'Platja Gran (Cadaqués)', type: 'kiezel', vibe: 'levendig', description: 'Hoofdstrandje met kleurrijke vissersboten.', facilities: true },
      { name: 'Portlligat', type: 'kiezel', vibe: 'rustig', description: 'De baai waar Dalí zwom. Kristalhelder water.', facilities: false },
      { name: 'Cala Nans', type: 'kiezel', vibe: 'wild', description: 'Afgelegen baai via het kustpad. Snorkelparadijs.', facilities: false },
    ],
  },
  {
    id: '6',
    slug: 'blanes',
    name: 'Blanes',
    region: 'La Selva',
    heroImage: '/images/campings/blanes__spain_overview.jpg',
    gallery: [
      '/images/campings/blanes__spain_overview.jpg',
      '/images/campings/marimurtra_botanic_garden_blanes_costa_brava_catalonia_spain.jpg',
      '/images/campings/sa_palomera_a_blanes.jpg',
    ],
    description: 'Blanes wordt beschouwd als de poort tot de Costa Brava. De Jardí Botànic Marimurtra is een van de mooiste tuinen van Europa. De Sa Palomera rots verdeelt het strand in twee.',
    longDescription: 'De Jardí Botànic Marimurtra bezit meer dan 3.000 plantensoorten en biedt adembenemend uitzicht over de kust. Het vuurwerkfestival eind juli trekt duizenden bezoekers.',
    highlights: ['Jardí Botànic Marimurtra', 'Sa Palomera rots', 'Groot stadsstrand', 'Vuurwerkfestival in juli', 'Tordera Delta natuurgebied'],
    bestFor: ['Gezinnen', 'Natuurliefhebbers', 'Budgetvriendelijk'],
    nearestCampings: ["Camping Blanes", "Camping S'Abanell"],
    weather: { summer: '28-32°C', water: '23-26°C' },
    travelTip: 'Het vuurwerkfestival eind juli is spectaculair — elke avond een andere show!',
    coordinates: { lat: 41.674, lng: 2.790 },
    population: '~39.000',
    knownFor: 'Poort tot de Costa Brava',
    restaurants: [
      { name: 'El Ventall', cuisine: 'Mediterraan', price: '€€€', description: 'Op de kliffen met panoramisch zeezicht.', mustTry: 'Suquet de rap' },
      { name: 'Ca la Maria Cristina', cuisine: 'Vis & zeevruchten', price: '€€', description: 'Familierestaurant bij de haven.', mustTry: 'Fritura mixta' },
      { name: "S'Auguer", cuisine: 'Tapas & grill', price: '€', description: 'Populaire tapasbar. Geweldige sfeer.', mustTry: 'Patatas bravas' },
    ],
    beaches: [
      { name: 'Platja de Blanes', type: 'zand', vibe: 'levendig', description: 'Breed stadsstrand tot aan Sa Palomera.', facilities: true },
      { name: "Platja de S'Abanell", type: 'zand', vibe: 'familiaal', description: 'Langste strand van de Costa Brava — 2,5 km.', facilities: true },
      { name: 'Cala Sant Francesc', type: 'zand', vibe: 'rustig', description: 'Beschutte baai met pijnbomen en strandtent.', facilities: true },
    ],
  },
  {
    id: '7',
    slug: 'sant-pere-pescador',
    name: 'Sant Pere Pescador',
    region: 'Alt Empordà',
    heroImage: '/images/campings/spp056.jpg',
    gallery: [
      '/images/campings/spp056.jpg',
      '/images/campings/kitesurf_a_sant_pere_pescador_-_panoramio.jpg',
      '/images/campings/animales-aiguamolls_l_emporda-2013.jpg',
    ],
    description: "Sant Pere Pescador ligt aan de monding van de Fluvià en is omringd door het Natuurpark Aiguamolls. Het uitgestrekte wild strand is perfect voor kitesurfen en windsurfen.",
    longDescription: "Het Aiguamolls de l'Empordà, het tweede grootste wetland van Catalonië, biedt ongeëvenaarde vogelobservatie. Meer dan 300 vogelsoorten zijn waargenomen. De Tramontana-wind maakt het strand een internationaal erkende kitesurfbestemming.",
    highlights: ['Kilometerlang wild strand', 'Natuurpark Aiguamolls', 'Kitesurfen & windsurfen', 'Fietsen langs de Fluvià', 'Biologische producten'],
    bestFor: ['Surfers', 'Natuurliefhebbers', 'Rust zoekers'],
    nearestCampings: ["Camping Las Dunas", "Camping L'Àmfora", 'Camping Aquarius'],
    weather: { summer: '27-31°C', water: '20-23°C' },
    travelTip: "Huur een fiets en rijd door het Aiguamolls natuurpark — flamingo's spotten!",
    coordinates: { lat: 42.189, lng: 3.099 },
    population: '~2.100',
    knownFor: 'Kitesurfen & natuur',
    restaurants: [
      { name: "El Molí de l'Escala", cuisine: 'Catalaans / Vis', price: '€€', description: 'Sfeervolle oude molen met uitstekende rijstgerechten.', mustTry: 'Arròs negre' },
      { name: 'Can Trona', cuisine: 'Grill & Catalaans', price: '€€', description: 'Dorpsrestaurant met gegrild vlees en lokale wijnen.', mustTry: 'Botifarra amb mongetes' },
      { name: "Restaurant L'Àmfora", cuisine: 'Mediterraan', price: '€', description: 'Goede paella en verse salades.', mustTry: 'Paella de mariscos' },
    ],
    beaches: [
      { name: 'Platja de Sant Pere Pescador', type: 'zand', vibe: 'wild', description: 'Meer dan 6 km ongerept strand met duinen en uitzicht op de Pyreneeën.', facilities: false },
    ],
  },
  {
    id: '8',
    slug: 'tossa-de-mar',
    name: 'Tossa de Mar',
    region: 'La Selva',
    heroImage: '/images/destinations/tossa_de_mar_torre_n_jmm.jpg',
    gallery: [
      '/images/destinations/tossa_de_mar_torre_n_jmm.jpg',
      '/images/destinations/tossa_a_rea.jpg',
      '/images/destinations/costa_brava_-_tossa_de_mar_-_la_vila_vella_-_passeig_del_mar_-_view_ene_through_portal__passeig_de_la_vila_vella_.jpg',
    ],
    description: 'Tossa de Mar is misschien wel de mooiste badplaats aan de Costa Brava. De Vila Vella — een ommuurde middeleeuwse stad boven het strand — is het enige bewaarde versterkte dorp aan de Catalaanse kust.',
    longDescription: 'Marc Chagall noemde Tossa "het blauwe paradijs". De Vila Vella uit de 12e-14e eeuw met drie cilindrische torens en de resten van een gotische kerk is uniek. Het Museu Municipal was het eerste museum ter wereld dat een Chagall tentoonstelde.',
    highlights: ['Vila Vella — middeleeuws dorp', 'Platja Gran', 'Museo Municipal (Chagall)', 'Verborgen baaien per kustpad', 'Restaurants in het centrum'],
    bestFor: ['Koppels', 'Cultuurliefhebbers', 'Fotografen'],
    nearestCampings: ['Camping Cala Llevadó', 'Camping Pola'],
    weather: { summer: '28-32°C', water: '22-25°C' },
    travelTip: 'Beklim de Vila Vella bij zonsopgang voor het mooiste licht.',
    coordinates: { lat: 41.722, lng: 2.933 },
    population: '~6.000',
    knownFor: 'Vila Vella & middeleeuwen',
    restaurants: [
      { name: 'La Cuina de Can Simón', cuisine: 'Modern Catalaans', price: '€€€€', description: 'Michelinster-waardig. Innovatieve Catalaanse gerechten.', mustTry: 'Arroz de carabineros' },
      { name: 'Es Molí', cuisine: 'Grill & Mediterraan', price: '€€', description: 'Rustiek restaurant in een oude molen met houtvuur.', mustTry: 'Chuletón' },
      { name: 'Restaurant Bahía', cuisine: 'Vis & zeevruchten', price: '€€', description: 'Terras aan Platja Gran met uitzicht op de Vila Vella.', mustTry: 'Sarsuela de peix' },
    ],
    beaches: [
      { name: 'Platja Gran', type: 'zand', vibe: 'levendig', description: 'Iconisch strand met uitzicht op middeleeuwse muren.', facilities: true },
      { name: 'Platja Mar Menuda', type: 'zand', vibe: 'familiaal', description: 'Beschut strand aan de andere kant van het schiereiland.', facilities: true },
      { name: 'Cala Pola', type: 'zand', vibe: 'wild', description: 'Verborgen baai in het bos. Kristalhelder snorkelwater.', facilities: false },
      { name: 'Cala Giverola', type: 'kiezel', vibe: 'rustig', description: 'Idyllische baai omringd door pijnbomen met strandtent.', facilities: true },
    ],
  },
  {
    id: '9',
    slug: 'begur',
    name: 'Begur',
    region: 'Baix Empordà',
    heroImage: '/images/destinations/begur_-_2013-07-15_-_albert_torello.jpg',
    gallery: [
      '/images/destinations/begur_-_2013-07-15_-_albert_torello.jpg',
      '/images/campings/begurcastle.jpg',
      '/images/campings/cala_d_aiguablava__begur.jpg',
    ],
    description: 'Begur is een charmant dorpje op een heuvel met middeleeuws kasteel en adembenemende uitzichten. Rondom liggen de mooiste baaien: Sa Tuna, Aiguafreda, Sa Riera en Aiguablava.',
    longDescription: 'Het kasteel uit de 11e eeuw biedt 360° panorama. De "Cases dels Indians" — luxueuze huizen in koloniale stijl gebouwd door inwoners die fortuin maakten in Cuba — geven het dorp een exotisch tintje.',
    highlights: ['Kasteel met 360° panorama', 'Sa Tuna — vissersbaai', 'Aiguafreda — snorkelwater', 'Camí de Ronda kustpaden', 'Indiaanse architectuur'],
    bestFor: ['Koppels', 'Natuurliefhebbers', 'Fotografen'],
    nearestCampings: ['Camping Begur', 'Camping Sa Riera'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Loop het kustpad van Sa Tuna naar Aiguafreda — spectaculair!',
    coordinates: { lat: 41.954, lng: 3.213 },
    population: '~4.200',
    knownFor: 'Verborgen baaien & kasteel',
    restaurants: [
      { name: 'Rostei', cuisine: 'Modern Catalaans', price: '€€€', description: 'Innovatief restaurant met lokale seizoensproducten.', mustTry: 'Kreeft uit Begur' },
      { name: 'Restaurant Sa Riera', cuisine: 'Vis & strandkeuken', price: '€€', description: 'Direct aan het strand met dagverse vis.', mustTry: 'Gegrilde zeebaars' },
      { name: 'Fonda Caner', cuisine: 'Traditioneel Catalaans', price: '€€', description: 'Historische herberg met overvloedige thuiskeuken.', mustTry: 'Escudella' },
    ],
    beaches: [
      { name: 'Sa Tuna', type: 'kiezel', vibe: 'rustig', description: 'Schilderachtige vissersbaai met kleurrijke huisjes.', facilities: true },
      { name: 'Aiguafreda', type: 'rotsen', vibe: 'wild', description: 'Het beste snorkelplekje van de Costa Brava.', facilities: false },
      { name: 'Platja de Sa Riera', type: 'zand', vibe: 'familiaal', description: 'Het enige zandstrand van Begur.', facilities: true },
      { name: 'Aiguablava', type: 'zand', vibe: 'rustig', description: 'Turquoise lagune. Meest gefotografeerd.', facilities: true },
    ],
  },
  {
    id: '10',
    slug: 'calella-de-palafrugell',
    name: 'Calella de Palafrugell',
    region: 'Baix Empordà',
    heroImage: '/images/destinations/calella_de_palafrugell__26023087965_.jpg',
    gallery: [
      '/images/destinations/calella_de_palafrugell__26023087965_.jpg',
      '/images/destinations/calella_de_palafrugell_-_53619347398.jpg',
      '/images/destinations/jardines_de_cap_roig-calella_de_palafurgell-8-2013__11_.jpg',
    ],
    description: 'Calella de Palafrugell is het pittoreske vissersdorpje met witte huizen, blauwe deuren en kleurrijke boten. In juli vindt het beroemde Havaneres Festival plaats bij fakkellicht.',
    longDescription: 'De traditie van de Havaneres — liederen meegebracht door zeelieden die naar Cuba voeren — leeft hier. De Jardí Botànic de Cap Roig huisvest in de zomer het prestigieuze muziekfestival.',
    highlights: ['Cap Roig botanische tuin', 'Havaneres Festival', 'Kleurrijke vissersboten', 'Camí de Ronda naar Llafranc', 'Verse vis restaurants'],
    bestFor: ['Koppels', 'Cultuurliefhebbers', 'Strandvakantie'],
    nearestCampings: ['Camping Moby Dick', 'Camping La Siesta'],
    weather: { summer: '27-31°C', water: '21-24°C' },
    travelTip: 'Bezoek de Jardí Botànic de Cap Roig voor tuinen en concerten.',
    coordinates: { lat: 41.890, lng: 3.185 },
    population: '~800',
    knownFor: 'Havaneres & vissersdorp',
    restaurants: [
      { name: 'Tragamar', cuisine: 'Moderne zeevruchten', price: '€€€', description: 'Beach club met spectaculair zeezicht.', mustTry: 'Carpaccio van gambas' },
      { name: 'La Blanca', cuisine: 'Mediterraan', price: '€€', description: 'Wit terras boven het strand.', mustTry: 'Fideuà amb llamàntol' },
      { name: 'Port Bo', cuisine: 'Vis & tapas', price: '€€', description: 'Terras direct aan de vissersboten.', mustTry: 'Anxoves de L\'Escala' },
    ],
    beaches: [
      { name: 'Platja de Calella', type: 'zand', vibe: 'levendig', description: 'Beroemde strandjes met kleurrijke boten.', facilities: true },
      { name: 'Platja del Canadell', type: 'zand', vibe: 'familiaal', description: 'Rustiger strand naast het hoofdstrand.', facilities: true },
      { name: 'Platja de Llafranc', type: 'zand', vibe: 'levendig', description: 'Elegant strand in het naburige Llafranc.', facilities: true },
    ],
  },
  {
    id: '11',
    slug: 'platja-daro',
    name: "Platja d'Aro",
    region: 'Baix Empordà',
    heroImage: '/images/campings/playa_de_aro.jpg',
    gallery: [
      '/images/campings/playa_de_aro.jpg',
      '/images/campings/platja_gran_platja_d_aro.jpg',
    ],
    description: "Platja d'Aro is de mix van strandvakantie en entertainment. Twee kilometer strand, eindeloos winkelen en bruisend uitgaansleven.",
    longDescription: "De boulevard is gevuld met winkels. Ondanks de drukte zijn er rustgevende plekjes: Cala Rovira en het middeleeuwse Castell d'Aro.",
    highlights: ['2 km breed zandstrand', 'Boulevard & winkels', 'Aquadiver Waterpark', 'Nachtleven', 'Cala Rovira'],
    bestFor: ['Gezinnen', 'Jongeren', 'Strandliefhebbers'],
    nearestCampings: ['Camping Valldaro', 'Camping Riembau', 'Camping Internacional de Calonge'],
    weather: { summer: '28-32°C', water: '22-25°C' },
    travelTip: 'Bezoek de dinsdagmarkt voor lokale producten.',
    coordinates: { lat: 41.818, lng: 3.068 },
    population: '~11.000',
    knownFor: 'Winkelen & strandleven',
    restaurants: [
      { name: 'Aradi', cuisine: 'Catalaans modern', price: '€€€', description: 'Traditionele en moderne Catalaanse keuken.', mustTry: 'Gamba de Palamós a la planxa' },
      { name: 'Big Rock', cuisine: 'Mediterraan / Fusion', price: '€€€€', description: 'Van sterrenchef Carme Ruscalleda.', mustTry: 'Degustatiemenu' },
      { name: 'La Taverna del Mar', cuisine: 'Tapas & vis', price: '€€', description: 'Gezellige tapasbar op de boulevard.', mustTry: 'Pulpo a la gallega' },
    ],
    beaches: [
      { name: "Platja Gran (Platja d'Aro)", type: 'zand', vibe: 'levendig', description: 'Twee kilometer stadsstrand met alles.', facilities: true },
      { name: 'Cala Rovira', type: 'zand', vibe: 'rustig', description: 'Prachtige baai met pijnbomen en snorkelen.', facilities: true },
      { name: 'Cala del Pi', type: 'zand', vibe: 'rustig', description: "Romantisch strand onder pijnbomen richting S'Agaró.", facilities: false },
    ],
  },
  {
    id: '12',
    slug: 'empuriabrava',
    name: 'Empuriabrava',
    region: 'Alt Empordà',
    heroImage: '/images/destinations/empuriabrava.jpg',
    gallery: [
      '/images/destinations/empuriabrava.jpg',
      '/images/campings/panoramic_view_of_empuriabrava_and_roses_20090813_1.jpg',
      '/images/campings/canal_principal_de_empuriabrava.jpg',
    ],
    description: 'Empuriabrava wordt het "Venetië van Spanje" genoemd met 24 km kanalen. De grootste woonmarina van Europa combineert water, zon en relaxte levensstijl.',
    longDescription: 'Veel huizen hebben een eigen aanlegsteiger. Skydive Empuriabrava is een van de beroemdste dropzones ter wereld.',
    highlights: ['24 km kanalen', 'Skydiven', 'Breed strand met Pyreneeën-uitzicht', 'Watersport', 'Butterfly Park'],
    bestFor: ['Watersporters', 'Gezinnen', 'Strandliefhebbers'],
    nearestCampings: ['Camping Castell Mar', 'Camping Almata'],
    weather: { summer: '28-33°C', water: '22-25°C' },
    travelTip: 'Maak een skydive — uitzicht op zee, bergen en het meer!',
    coordinates: { lat: 42.237, lng: 3.119 },
    population: '~8.000',
    knownFor: 'Kanalen & skydiven',
    restaurants: [
      { name: 'Can Salinas', cuisine: 'Vis & Grill', price: '€€', description: 'Terras aan de kanalen met dagverse vis.', mustTry: 'Paella de marisco' },
      { name: "L'Emporium", cuisine: 'Mediterraan', price: '€€€', description: 'Elegant restaurant met jachthaven-uitzicht.', mustTry: 'Kreeftcanelloni' },
      { name: 'Dolce Vita', cuisine: 'Italiaans', price: '€', description: 'Huisgemaakte pasta en pizza. Kindvriendelijk.', mustTry: 'Tiramisù' },
    ],
    beaches: [
      { name: "Platja d'Empuriabrava", type: 'zand', vibe: 'familiaal', description: 'Breed strand met uitzicht op de Pyreneeën.', facilities: true },
    ],
  },
  {
    id: '13',
    slug: 'figueres',
    name: 'Figueres',
    region: 'Alt Empordà',
    heroImage: '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg',
    gallery: [
      '/images/destinations/teater_museu_gala_salvador_dali_building_from_outside.jpg',
      '/images/campings/msodaiguistperefigueres1.jpg',
    ],
    description: 'Figueres is de culturele hoofdstad van de Costa Brava. Het Dalí Theatre-Museum is het meest bezochte museum van Spanje na het Prado. De Rambla is het hart van de stad.',
    longDescription: 'Salvador Dalí creëerde zijn Theatre-Museum in het voormalige stadstheater — een surrealistisch gesamtkunstwerk waar hij zelf is begraven. Het Castell de Sant Ferran is het grootste bastion-fort van Europa.',
    highlights: ['Dalí Theatre-Museum', 'De Rambla', 'Castell de Sant Ferran', 'Speelgoedmuseum', 'Empordà gastronomie'],
    bestFor: ['Cultuurliefhebbers', 'Gezinnen', 'Culinair'],
    nearestCampings: ['Camping Mas Patoxas', 'Camping Esponellà'],
    weather: { summer: '29-34°C', water: 'n.v.t.' },
    travelTip: 'Combineer met het Dalí-huis in Portlligat en het kasteel in Púbol voor de Dalí-driehoek!',
    coordinates: { lat: 42.266, lng: 2.961 },
    population: '~47.000',
    knownFor: 'Dalí Museum & cultuur',
    restaurants: [
      { name: 'Hotel Durán', cuisine: 'Catalaans klassiek', price: '€€€', description: "Waar Dalí zijn vaste tafel had. Klassieke Empordà-keuken.", mustTry: 'Suquet de peix' },
      { name: 'Bocam', cuisine: 'Modern Catalaans', price: '€€€', description: 'Michelinster-restaurant met lokale interpretaties.', mustTry: 'Degustatiemenu' },
      { name: "Sidrería Txot's", cuisine: 'Baskisch / Tapas', price: '€€', description: 'Levendige tapasbar op de Rambla.', mustTry: 'Txuleta' },
    ],
    beaches: [],
  },
  {
    id: '14',
    slug: 'palamos',
    name: 'Palamós',
    region: 'Baix Empordà',
    heroImage: '/images/campings/palam_s_-_view_from_beach.jpg',
    gallery: [
      '/images/campings/palam_s_-_view_from_beach.jpg',
      '/images/campings/cala_margarida_palam_s.jpg',
    ],
    description: 'Palamós is wereldberoemd om de Gamba de Palamós. Deze authentieke vissersstad combineert een werkende haven met prachtige stranden.',
    longDescription: 'Elke middag rond 17:00 uur keert de vloot terug voor de live visveiling. De Gamba de Palamós — een diepzeegarnaal met intense rode kleur — wordt in de beste restaurants van Spanje geserveerd.',
    highlights: ['Gamba de Palamós', 'Visserijmuseum', 'Platja de la Fosca', "Cala S'Alguer", 'Live visveiling'],
    bestFor: ['Culinair', 'Gezinnen', 'Cultuurliefhebbers'],
    nearestCampings: ['Camping Kings', 'Camping Benelux'],
    weather: { summer: '27-31°C', water: '22-25°C' },
    travelTip: 'Bezoek de visveiling rond 17:00 — dan dezelfde vis proeven in de restaurants!',
    coordinates: { lat: 41.848, lng: 3.130 },
    population: '~18.000',
    knownFor: 'Gamba de Palamós & visserij',
    restaurants: [
      { name: 'La Gamba', cuisine: 'Vis & zeevruchten', price: '€€€', description: 'Dé plek voor de beroemde rode garnalen.', mustTry: 'Gamba de Palamós a la planxa' },
      { name: 'Restaurant Ticus', cuisine: 'Modern Catalaans', price: '€€€', description: 'Creatief restaurant met lokale producten.', mustTry: 'Suquet de gamba' },
      { name: 'Maria de Cadaqués', cuisine: 'Havenkeuken', price: '€€', description: 'Haven-restaurant met verse vis van de boot.', mustTry: 'Peix fregit' },
    ],
    beaches: [
      { name: 'Platja Gran (Palamós)', type: 'zand', vibe: 'levendig', description: 'Stadsstrand naast de haven.', facilities: true },
      { name: 'Platja de la Fosca', type: 'zand', vibe: 'familiaal', description: 'Beschutte baai met ondiep water voor kinderen.', facilities: true },
      { name: "Cala S'Alguer", type: 'kiezel', vibe: 'rustig', description: 'Verborgen baai met kleurrijke vissershutten.', facilities: false },
      { name: 'Cala Margarida', type: 'rotsen', vibe: 'wild', description: 'Intieme rotsbaai met glashelder water.', facilities: false },
    ],
  },
];

export function getDestinationBySlug(slug: string): Destination | undefined {
  return destinations.find(d => d.slug === slug);
}

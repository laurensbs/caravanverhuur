export type CaravanType = 'FAMILIE' | 'COMPACT' | 'LUXE';

export interface Caravan {
  id: string;
  reference: string;
  name: string;
  type: CaravanType;
  maxPersons: number;
  manufacturer: string;
  year: number;
  description: string;
  photos: string[];
  amenities: string[];
  inventory: string[];
  pricePerDay: number;
  pricePerWeek: number;
  deposit: number;
  status: 'BESCHIKBAAR' | 'ONDERHOUD' | 'GEBOEKT';
}

export const caravans: Caravan[] = [
  {
    id: '1',
    reference: 'CV-001',
    name: 'Dethleffs Camper 560 FMK',
    type: 'FAMILIE',
    maxPersons: 6,
    manufacturer: 'Dethleffs',
    year: 2016,
    description: 'Ruime familiecaravan met twee aparte slaapkamers, grote L-keuken en gezellige zithoek. Perfect voor het hele gezin op de Costa Brava.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Lloret_de_Mar_-_Panorama_of_main_beach.jpg/1280px-Lloret_de_Mar_-_Panorama_of_main_beach.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sa_Riera_beach.JPG/1280px-Sa_Riera_beach.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Portlligat.jpg/1280px-Portlligat.jpg',
    ],
    amenities: ['Airco', 'Verwarming', 'Koelkast', 'Oven', 'Douche', 'Toilet', 'Luifel', 'TV'],
    inventory: ['Dekbedden (6x)', 'Kussens (6x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Schoonmaakmiddelen', 'Rolgordijnen', 'Horren'],
    pricePerDay: 75,
    pricePerWeek: 450,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '2',
    reference: 'CV-002',
    name: 'Knaus Sport 500 EU',
    type: 'COMPACT',
    maxPersons: 3,
    manufacturer: 'Knaus',
    year: 2017,
    description: 'Compacte en efficiënte caravan, ideaal voor koppels of een klein gezin. Moderne inrichting met alles wat je nodig hebt.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Golfo_de_Rosas.jpg/1280px-Golfo_de_Rosas.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG/1280px-La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cap_de_Creus_landscape.jpg/1280px-Cap_de_Creus_landscape.jpg',
    ],
    amenities: ['Verwarming', 'Koelkast', 'Kookplaat', 'Douche', 'Toilet', 'Luifel'],
    inventory: ['Dekbedden (3x)', 'Kussens (3x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Rolgordijnen', 'Horren'],
    pricePerDay: 50,
    pricePerWeek: 299,
    deposit: 250,
    status: 'BESCHIKBAAR',
  },
  {
    id: '3',
    reference: 'CV-003',
    name: 'Tabbert Puccini 560 TD',
    type: 'LUXE',
    maxPersons: 4,
    manufacturer: 'Tabbert',
    year: 2018,
    description: 'Luxe caravan met premium afwerking. Inclusief airconditioning, moderne keuken en extra groot tweepersoonsbed. De ultieme kampeerervaring.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Tossa_A%C3%A9rea.JPG/1280px-Tossa_A%C3%A9rea.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cadaques_Pueblo_Marinero.JPG/1280px-Cadaques_Pueblo_Marinero.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Platja_Gran_Platja_d%27Aro.jpg/1280px-Platja_Gran_Platja_d%27Aro.jpg',
    ],
    amenities: ['Airco', 'Warmtepomp', 'Verwarming', 'Koelkast met vriezer', 'Oven', 'Douche', 'Toilet', 'Luifel', 'TV', 'Bluetooth speakers'],
    inventory: ['Luxe dekbedden (4x)', 'Kussens (4x)', 'Premium servies', 'Kookgerei deluxe', 'Luxe handdoeken', 'Toiletpapier', 'Schoonmaakmiddelen', 'Verduisterende gordijnen', 'Horren'],
    pricePerDay: 95,
    pricePerWeek: 595,
    deposit: 500,
    status: 'BESCHIKBAAR',
  },
  {
    id: '4',
    reference: 'CV-004',
    name: 'Dethleffs C\'Go 495 QSK',
    type: 'FAMILIE',
    maxPersons: 5,
    manufacturer: 'Dethleffs',
    year: 2015,
    description: 'Gezellige familiecaravan met stapelbed voor de kinderen en comfortabel tweepersoonsbed. Veel opbergruimte en een praktische keuken.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Bucht_von_Roses%2C_Spanien.jpg/1280px-Bucht_von_Roses%2C_Spanien.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Lloret_de_Mar_-_Panorama_of_main_beach.jpg/1280px-Lloret_de_Mar_-_Panorama_of_main_beach.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Cala_d%27Aiguablava%2C_Begur.jpg/1280px-Cala_d%27Aiguablava%2C_Begur.jpg',
    ],
    amenities: ['Verwarming', 'Koelkast', 'Kookplaat', 'Oven', 'Douche', 'Toilet', 'Luifel'],
    inventory: ['Dekbedden (5x)', 'Kussens (5x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Rolgordijnen', 'Horren'],
    pricePerDay: 65,
    pricePerWeek: 399,
    deposit: 350,
    status: 'BESCHIKBAAR',
  },
  {
    id: '5',
    reference: 'CV-005',
    name: 'Knaus Südwind 460 EU',
    type: 'COMPACT',
    maxPersons: 2,
    manufacturer: 'Knaus',
    year: 2019,
    description: 'De perfecte caravan voor een romantisch uitje. Compact maar luxueus ingericht met een groot bed en handige keuken.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Cap_de_Creus_landscape.jpg/1280px-Cap_de_Creus_landscape.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Golfo_de_Rosas.jpg/1280px-Golfo_de_Rosas.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG/1280px-La_banyera_de_la_russa-calella_de_palafurgell-8-2013.JPG',
    ],
    amenities: ['Airco', 'Verwarming', 'Koelkast', 'Kookplaat', 'Douche', 'Toilet', 'Luifel'],
    inventory: ['Dekbedden (2x)', 'Kussens (2x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Rolgordijnen', 'Horren'],
    pricePerDay: 55,
    pricePerWeek: 329,
    deposit: 250,
    status: 'BESCHIKBAAR',
  },
  {
    id: '6',
    reference: 'CV-006',
    name: 'Tabbert Da Vinci 495 HE',
    type: 'LUXE',
    maxPersons: 5,
    manufacturer: 'Tabbert',
    year: 2017,
    description: 'Stijlvolle luxe caravan met ruime woonkamer, aparte slaapkamer en volledig uitgeruste keuken. Premium comfort op de camping.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cadaques_Pueblo_Marinero.JPG/1280px-Cadaques_Pueblo_Marinero.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sa_Riera_beach.JPG/1280px-Sa_Riera_beach.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Portlligat.jpg/1280px-Portlligat.jpg',
    ],
    amenities: ['Airco', 'Warmtepomp', 'Verwarming', 'Koelkast met vriezer', 'Oven', 'Vaatwasser', 'Douche', 'Toilet', 'Luifel', 'TV'],
    inventory: ['Luxe dekbedden (5x)', 'Kussens (5x)', 'Premium servies', 'Kookgerei deluxe', 'Luxe handdoeken', 'Toiletpapier', 'Schoonmaakmiddelen', 'Verduisterende gordijnen', 'Horren'],
    pricePerDay: 89,
    pricePerWeek: 549,
    deposit: 500,
    status: 'BESCHIKBAAR',
  },
];

export function getCaravansByType(type: CaravanType): Caravan[] {
  return caravans.filter(c => c.type === type);
}

export function getCaravanById(id: string): Caravan | undefined {
  return caravans.find(c => c.id === id);
}

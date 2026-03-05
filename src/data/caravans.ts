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
  videoUrl?: string;
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
    name: 'Knaus 1997',
    type: 'FAMILIE',
    maxPersons: 4,
    manufacturer: 'Knaus',
    year: 1997,
    description: 'Een hele nette caravan ideaal voor gezinnen met kinderen. Ruime indeling met rondzit, volledig uitgerust met keuken, douche en toilet. Inclusief voortent, luifel en grondzeil. Opbouw: 5,10m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/knaus-1997-1.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/knaus-1997-2.jpg',
    ],
    videoUrl: 'https://youtu.be/m0KMoDeh8Sk',
    amenities: ['Verwarming', 'Koelkast', 'Kookplaat (3 pits)', 'Douche', 'Toilet', 'Luifel', 'Voortent', 'Grondzeil', 'Rondzit'],
    inventory: ['Dekbedden (4x)', 'Kussens (4x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Rolgordijnen', 'Horren'],
    pricePerDay: 55,
    pricePerWeek: 329,
    deposit: 300,
    status: 'BESCHIKBAAR',
  },
  {
    id: '2',
    reference: 'CV-002',
    name: 'HomeCar 450 Racer',
    type: 'COMPACT',
    maxPersons: 4,
    manufacturer: 'HomeCar',
    year: 2003,
    description: 'Zeer nette caravan met een dak airco Dometic 2200 FJ. Inclusief Frans bed, rondzit, voortent, luifel en grondzeil. Caravan wordt geleverd met een kleine inventaris.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/homecar-450-1.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/homecar-450-2.jpg',
    ],
    videoUrl: 'https://youtu.be/--AEni2AQTQ',
    amenities: ['Airco (Dometic 2200FJ)', 'Verwarming', 'Koelkast', 'Kookplaat (3 pits)', 'Toilet', 'Luifel', 'Voortent', 'Grondzeil', 'Rondzit', 'Frans bed'],
    inventory: ['Dekbedden (4x)', 'Kussens (4x)', 'Volledig servies', 'Kookgerei', 'Handdoeken', 'Toiletpapier', 'Rolgordijnen', 'Horren'],
    pricePerDay: 65,
    pricePerWeek: 399,
    deposit: 350,
    status: 'BESCHIKBAAR',
  },
  {
    id: '3',
    reference: 'CV-003',
    name: 'Hobby Prestige 650',
    type: 'FAMILIE',
    maxPersons: 5,
    manufacturer: 'Hobby',
    year: 2002,
    description: 'Een Hobby 650 met kleine punten tot verbetering. Er zit geen toiletruimte in deze caravan. Het is een caravan uit Engeland waardoor er geen kenteken op zit. Caravan kan door ons elk jaar op de camping worden gezet. Caravan kan tegen een kleine vergoeding worden uitgerust met een inventaris. Opbouw: 650.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/hobby-650.jpg',
    ],
    videoUrl: 'https://youtu.be/KX9H92_Fo5Q',
    amenities: ['Verwarming', 'Koelkast', 'Kookplaat (3 pits)', 'Rondzit', 'Treinzit', 'Vast bed'],
    inventory: ['Inventaris optioneel tegen vergoeding'],
    pricePerDay: 60,
    pricePerWeek: 369,
    deposit: 300,
    status: 'BESCHIKBAAR',
  },
  {
    id: '4',
    reference: 'CV-004',
    name: 'Adria 430 Unica',
    type: 'COMPACT',
    maxPersons: 4,
    manufacturer: 'Adria',
    year: 2001,
    description: 'Hele mooie Adria 430 Unica met luifel. Caravan wordt geleverd met een grote servicebeurt en een uitgebreide interne en externe reiniging. Caravan kan worden geleverd met een kleine inventaris. Opbouw: 4,30m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/adria4302.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/adria430-min.png',
    ],
    videoUrl: 'https://youtu.be/wnpMiZH1PzE',
    amenities: ['Verwarming', 'Koelkast', 'Kookplaat (3 pits)', 'Toilet', 'Luifel', 'Grondzeil', 'Treinzit', 'Vast bed'],
    inventory: ['Inventaris optioneel tegen vergoeding'],
    pricePerDay: 55,
    pricePerWeek: 329,
    deposit: 300,
    status: 'BESCHIKBAAR',
  },
];

export function getCaravansByType(type: CaravanType): Caravan[] {
  return caravans.filter(c => c.type === type);
}

export function getCaravanById(id: string): Caravan | undefined {
  return caravans.find(c => c.id === id);
}

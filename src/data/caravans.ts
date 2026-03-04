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
      'https://images.unsplash.com/photo-1626680114529-3f6ffa002b80?w=800&q=80',
      'https://images.unsplash.com/photo-1757589223000-d23c4a72176e?w=800&q=80',
      'https://images.unsplash.com/photo-1752324658757-ca9e690772e5?w=800&q=80',
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
      'https://images.unsplash.com/photo-1599889917438-211ac4924647?w=800&q=80',
      'https://images.unsplash.com/photo-1745419037385-18611f4fc7b4?w=800&q=80',
      'https://images.unsplash.com/photo-1621195219180-3ca2f604b446?w=800&q=80',
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
      'https://images.unsplash.com/photo-1761395027517-97c1b3732c3a?w=800&q=80',
      'https://images.unsplash.com/photo-1767721989811-6db1e5264a3e?w=800&q=80',
      'https://images.unsplash.com/photo-1761395035659-bd7845411472?w=800&q=80',
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
      'https://images.unsplash.com/photo-1757589945384-1cdd7cba6eb4?w=800&q=80',
      'https://images.unsplash.com/photo-1626680114529-3f6ffa002b80?w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
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
      'https://images.unsplash.com/photo-1621195219180-3ca2f604b446?w=800&q=80',
      'https://images.unsplash.com/photo-1599889917438-211ac4924647?w=800&q=80',
      'https://images.unsplash.com/photo-1745419037385-18611f4fc7b4?w=800&q=80',
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
      'https://images.unsplash.com/photo-1767721989811-6db1e5264a3e?w=800&q=80',
      'https://images.unsplash.com/photo-1757589223000-d23c4a72176e?w=800&q=80',
      'https://images.unsplash.com/photo-1752324658757-ca9e690772e5?w=800&q=80',
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

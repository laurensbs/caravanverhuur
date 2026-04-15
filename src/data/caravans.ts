export interface Caravan {
  id: string;
  reference: string;
  name: string;
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

/* ------------------------------------------------------------------ */
/*  Shared inventory — identical for every caravan                     */
/* ------------------------------------------------------------------ */
const sharedInventory: string[] = [
  /* Buiten */
  '4 Tuinstoelen', '1 Tuintafel',
  /* Keuken */
  '1 Koffiezetapparaat (Senseo)', '1 Waterkoker', '2 Koekenpannen', '2 Kookpannen',
  'Snijplanken', '3 Pannenonderzetters', '1 Vergiet', '1 Maatbeker', '1 Rasp', '1 Gasfles',
  /* Servies & glaswerk */
  '6 Grote Platte Borden', '6 Ontbijtborden', '6 Soepkommen',
  '6 Theeglazen', '6 Koffiemokken', '6 Longdrink Glazen', '6 Bierglazen', '6 Wijnglazen',
  /* Bestek */
  '6 Lepels', '6 Vorken', '6 Messen', '6 Theelepels',
  /* Overig keuken */
  '2 Schilmessen', '2 Opscheplepels', '1 Snijmes', '1 Schaar', '1 Flessenopener', '1 Kaasschaaf', '1 Blikopener',
  /* Overig */
  '1 Pedaalemmer', '1 Stoffer + Blik', '1 Afwasbak', '1 Emmer', '1 Vloerveger', '1 Droogrek', 'Wasknijpers',
  /* Ouderslaapkamer */
  '4 Slaapplekken (2 Slaapkamers)', '10 Kledinghangers',
  /* Tweede slaapkamer */
  '1 Lampje',
];

const sharedAmenities: string[] = [
  'Koelkast', 'Kookplaat (3 pits)', 'Toilet', 'Luifel',
];

export const caravans: Caravan[] = [
  {
    id: '1',
    reference: 'WS-SG-02',
    name: 'Klompe – Knaus (WS-SG-02)',
    maxPersons: 4,
    manufacturer: 'Knaus',
    year: 1997,
    description: 'Nette en ruime Knaus caravan met volledig uitgeruste keuken en toilet. Inclusief luifel.',
    photos: [],
    amenities: sharedAmenities,
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '2',
    reference: 'WV-67-TR',
    name: 'Drenth – Knaus (WV-67-TR)',
    maxPersons: 4,
    manufacturer: 'Knaus',
    year: 1997,
    description: 'Nette Knaus caravan met volledig uitgeruste keuken en toilet. Inclusief luifel.',
    photos: [],
    amenities: sharedAmenities,
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '3',
    reference: 'WD-FJ-91',
    name: 'Paalvast – Adria (WD-FJ-91)',
    maxPersons: 4,
    manufacturer: 'Adria',
    year: 2001,
    description: 'Mooie en compacte Adria caravan met luifel. Volledig uitgerust.',
    photos: [],
    amenities: sharedAmenities,
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '4',
    reference: 'WP-02-XB',
    name: 'Bras – Hobby (WP-02-XB)',
    maxPersons: 4,
    manufacturer: 'Hobby',
    year: 2002,
    description: 'Ruime Hobby caravan met volledig uitgeruste keuken en toilet. Inclusief luifel.',
    photos: [],
    amenities: sharedAmenities,
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '5',
    reference: 'WF-JB-06',
    name: 'Van Dijk – Fendt (WF-JB-06)',
    maxPersons: 4,
    manufacturer: 'Fendt',
    year: 2000,
    description: 'Nette Fendt caravan met volledig uitgeruste keuken en toilet. Inclusief luifel.',
    photos: [],
    amenities: sharedAmenities,
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
];

export function getCaravanById(id: string): Caravan | undefined {
  return caravans.find(c => c.id === id);
}

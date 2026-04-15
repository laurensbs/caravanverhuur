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
  '4 tuinstoelen', '1 tuintafel',
  /* Keuken */
  '1 koffiezetapparaat (Senseo)', '1 waterkoker', '2 koekenpannen', '2 kookpannen',
  'Snijplanken', '3 pannenonderzetters', '1 vergiet', '1 maatbeker', '1 rasp', '1 gasfles',
  /* Servies & glaswerk */
  '6 grote platte borden', '6 ontbijtborden', '6 soepkommen',
  '6 theeglazen', '6 koffiemokken', '6 longdrink glazen', '6 bierglazen', '6 wijnglazen',
  /* Bestek */
  '6 lepels', '6 vorken', '6 messen', '6 theelepels',
  /* Overig keuken */
  '2 schilmessen', '2 opscheplepels', '1 snijmes', '1 schaar', '1 flessenopener', '1 kaasschaaf', '1 blikopener',
  /* Overig */
  '1 pedaalemmer', '1 stoffer + blik', '1 afwasbak', '1 emmer', '1 vloerveger', '1 droogrek', 'Wasknijpers',
  /* Ouderslaapkamer */
  '4 slaapplekken (2 slaapkamers)', '10 kledinghangers',
  /* Tweede slaapkamer */
  '1 lampje',
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

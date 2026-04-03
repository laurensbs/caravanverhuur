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
  '4 tuinstoelen', '1 tuintafel', '1 parasol',
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
  '1 tweepersoonsbed', 'Dekbed (2x 1-persoons mogelijk)', '1 molton', '2 kussens', '10 kledinghangers',
  /* Tweede slaapkamer */
  '2 eenpersoonsbedden', '2 moltons', '2 dekbedden', '2 kussens', '1 lampje',
];

const sharedAmenities: string[] = [
  'Verwarming', 'Koelkast', 'Kookplaat (3 pits)', 'Toilet', 'Luifel', 'Voortent', 'Grondzeil',
];

export const caravans: Caravan[] = [
  {
    id: '1',
    reference: 'CV-001',
    name: 'Knaus 1997',
    maxPersons: 4,
    manufacturer: 'Knaus',
    year: 1997,
    description: 'Nette en ruime caravan met rondzit, volledig uitgeruste keuken en toilet. Inclusief voortent, luifel en grondzeil. Opbouw: 5,10m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/knaus-1997-1.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/knaus-1997-2.jpg',
    ],
    videoUrl: 'https://youtu.be/m0KMoDeh8Sk',
    amenities: [...sharedAmenities, 'Rondzit'],
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '2',
    reference: 'CV-002',
    name: 'HomeCar 450 Racer',
    maxPersons: 4,
    manufacturer: 'HomeCar',
    year: 2003,
    description: 'Zeer nette caravan met dak-airco (Dometic 2200 FJ) voor heerlijk koele zomers. Voorzien van Frans bed, rondzit, voortent, luifel en grondzeil. Opbouw: 4,50m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/homecar-450-1.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/homecar-450-2.jpg',
    ],
    videoUrl: 'https://youtu.be/--AEni2AQTQ',
    amenities: [...sharedAmenities, 'Airco (Dometic 2200FJ)', 'Rondzit', 'Frans bed'],
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '3',
    reference: 'CV-003',
    name: 'Hobby Prestige 650',
    maxPersons: 4,
    manufacturer: 'Hobby',
    year: 2002,
    description: 'Extra ruime Hobby Prestige 650 met rondzit, treinzit en vast bed. Inclusief voortent, luifel en grondzeil. Opbouw: 6,50m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/hobby-650.jpg',
    ],
    videoUrl: 'https://gumlet.tv/watch/69b48353bf83f6c336be24eb/',
    amenities: [...sharedAmenities, 'Rondzit', 'Treinzit', 'Vast bed'],
    inventory: sharedInventory,
    pricePerDay: 79,
    pricePerWeek: 550,
    deposit: 400,
    status: 'BESCHIKBAAR',
  },
  {
    id: '4',
    reference: 'CV-004',
    name: 'Adria 430 Unica',
    maxPersons: 4,
    manufacturer: 'Adria',
    year: 2001,
    description: 'Mooie en compacte Adria 430 Unica met luifel, treinzit, vast bed en grondzeil. Opbouw: 4,30m.',
    photos: [
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/adria4302.jpg',
      'https://caravanstalling-spanje.com/wp-content/uploads/2025/10/adria430-min.png',
    ],
    videoUrl: 'https://youtu.be/wnpMiZH1PzE',
    amenities: [...sharedAmenities, 'Treinzit', 'Vast bed'],
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

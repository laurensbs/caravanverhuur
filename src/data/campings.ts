export interface Camping {
  id: string;
  name: string;
  location: string;
  description: string;
  website?: string;
}

export const campings: Camping[] = [
  { id: '1', name: 'Camping Cypsela Resort', location: 'Pals', description: 'Luxe 5-sterren camping direct aan het strand van Pals.', website: 'https://www.campingcypsela.com' },
  { id: '2', name: 'Camping Interpals', location: 'Pals', description: 'Gezinsvriendelijke camping met groot zwembadcomplex.', website: 'https://www.interpals.com' },
  { id: '3', name: 'Camping La Ballena Alegre', location: 'Sant Pere Pescador', description: 'Populaire camping aan een prachtig breed zandstrand.', website: 'https://www.ballena-alegre.com' },
  { id: '4', name: 'Camping Aquarius', location: 'Sant Pere Pescador', description: 'Direct aan de baai van Roses met prachtige zonsondergangen.', website: 'https://www.campingaquarius.com' },
  { id: '5', name: 'Camping Castell Montgri', location: 'Estartit', description: 'Rustige familiecamping nabij het natuurpark Montgri.', website: '' },
  { id: '6', name: 'Camping Les Medes', location: 'Estartit', description: 'Gezellige camping op loopafstand van het centrum.', website: '' },
  { id: '7', name: 'Camping Mas Sant Josep', location: 'Santa Cristina d\'Aro', description: 'Charmante camping in de heuvels met panoramisch uitzicht.', website: '' },
  { id: '8', name: 'Camping Cala Gogo', location: 'Calonge', description: 'Grote camping met uitgebreide faciliteiten en animatie.', website: 'https://www.calagogo.es' },
  { id: '9', name: 'Camping Tucan', location: 'Lloret de Mar', description: 'Actieve camping met waterpark, perfect voor tieners.', website: '' },
  { id: '10', name: 'Camping Santa Elena Ciutat', location: 'Lloret de Mar', description: 'Moderne camping vlakbij het drukke centrum.', website: '' },
  { id: '11', name: 'Camping Valldaro', location: 'Platja d\'Aro', description: 'Familiecamping met zwembad en entertainment.', website: '' },
  { id: '12', name: 'Camping Internacional de Calonge', location: 'Calonge', description: 'Grote internationale camping met veel voorzieningen.', website: '' },
  { id: '13', name: 'Camping Delfin Verde', location: 'Torroella de Montgrí', description: 'Mooie camping direct aan een lang zandstrand.', website: '' },
  { id: '14', name: 'Camping El Delfin Verde', location: 'Torroella de Montgrí', description: 'Populaire keuze voor Nederlandse en Belgische families.', website: '' },
  { id: '15', name: 'Camping Salatà', location: 'Roses', description: 'Kleinschalige camping met prachtig uitzicht over de baai.', website: '' },
  { id: '16', name: 'Camping Rodas', location: 'Roses', description: 'Gezellige familiecamping op loopafstand van het strand.', website: '' },
  { id: '17', name: 'Camping Joncar Mar', location: 'Roses', description: 'Rustige camping aan de rand van het natuurpark.', website: '' },
  { id: '18', name: 'Camping Nautic Almata', location: 'Castelló d\'Empúries', description: 'Camping in het natuurpark Aiguamolls de l\'Empordà.', website: '' },
  { id: '19', name: 'Camping Empordà', location: 'L\'Escala', description: 'Familiecamping nabij de Griekse ruïnes van Empúries.', website: '' },
  { id: '20', name: 'Camping Illa Mateua', location: 'L\'Escala', description: 'Prachtige camping met uitzicht op de Middellandse Zee.', website: '' },
  { id: '21', name: 'Camping Begur', location: 'Begur', description: 'Camping in de nabijheid van de mooiste calas van de Costa Brava.', website: '' },
  { id: '22', name: 'Camping Playa Brava', location: 'Pals', description: 'Charmante camping met directe strandtoegang.', website: '' },
  { id: '23', name: 'Camping Amberes', location: 'Platja d\'Aro', description: 'Gezellige camping met Nederlandse sfeer.', website: '' },
  { id: '24', name: 'Camping Kim\'s', location: 'Lloret de Mar', description: 'Familiecamping met groot zwembad en animatieprogramma.', website: '' },
  { id: '25', name: 'Camping Bella Terra', location: 'Blanes', description: 'Grote camping aan het begin van de Costa Brava.', website: '' },
  { id: '26', name: 'Camping S\'Abanell', location: 'Blanes', description: 'Direct aan het langste strand van de Costa Brava.', website: '' },
  { id: '27', name: 'Camping La Masia', location: 'Blanes', description: 'Rustige camping omringd door natuur.', website: '' },
  { id: '28', name: 'Camping Sant Miquel', location: 'Colera', description: 'Kleine camping aan de noordelijke Costa Brava met authentieke sfeer.', website: '' },
  { id: '29', name: 'Camping Cadaqués', location: 'Cadaqués', description: 'Camping vlakbij het charmante kunstenaarsdorp Cadaqués.', website: '' },
  { id: '30', name: 'Camping Mas Nou', location: 'Castelló d\'Empúries', description: 'Luxe camping met uitgebreid aquapark.', website: '' },
];

export function getCampingsByLocation(location: string): Camping[] {
  return campings.filter(c => c.location.toLowerCase().includes(location.toLowerCase()));
}

export function getCampingById(id: string): Camping | undefined {
  return campings.find(c => c.id === id);
}

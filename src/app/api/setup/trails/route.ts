import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, createTrail, getAllTrails } from '@/lib/db';

const TRAILS = [
  // ===== LA SELVA =====
  {
    name: 'Camí de Ronda: Lloret de Mar – Tossa de Mar',
    location: 'Lloret de Mar',
    description: 'Spectaculaire kustroute langs kliffen en verborgen baaien tussen Lloret en Tossa de Mar.',
    long_description: 'Een van de mooiste etappes van het GR-92 kustpad. Je loopt langs de Cala Boadella, Sa Caleta en geniet van adembenemende uitzichten over de Middellandse Zee. De route eindigt bij de middeleeuwse muren van Tossa de Mar.',
    distance_km: 12.5,
    duration_minutes: 240,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cam%C3%AD+de+Ronda+Lloret+Tossa+de+Mar',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+Lloret+de+Mar+Tossa+de+Mar',
    tags: ['lloret-de-mar', 'tossa-de-mar', 'la-selva', 'kust', 'gr-92'],
  },
  {
    name: 'Passeig de Sa Palomera – Blanes',
    location: 'Blanes',
    description: 'Ontspannen wandeling langs de iconische rots van Sa Palomera en de kust van Blanes.',
    long_description: 'Start bij de beroemde Sa Palomera rots — het officiële begin van de Costa Brava — en wandel langs de promenade en stranden van Blanes. Ideaal voor een avondwandeling bij zonsondergang.',
    distance_km: 3.5,
    duration_minutes: 60,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Sa+Palomera+Blanes+Costa+Brava',
    google_maps_url: 'https://www.google.com/maps/search/Sa+Palomera+Blanes',
    tags: ['blanes', 'la-selva', 'kust', 'familie'],
  },
  {
    name: 'Castell de Tossa de Mar – Vila Vella',
    location: 'Tossa de Mar',
    description: 'Korte wandeling naar het middeleeuwse kasteel met panoramisch uitzicht over de baai.',
    long_description: 'Wandel door de smalle steegjes van de Vila Vella, het enige bewaarde middeleeuwse ommuurde stadje aan de Catalaanse kust. Boven aangekomen heb je een onvergetelijk uitzicht over de baai en de Middellandse Zee.',
    distance_km: 2.5,
    duration_minutes: 60,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Castell+Tossa+de+Mar+Vila+Vella',
    google_maps_url: 'https://www.google.com/maps/search/Vila+Vella+Tossa+de+Mar',
    tags: ['tossa-de-mar', 'la-selva', 'cultuur', 'familie'],
  },
  // ===== BAIX EMPORDÀ =====
  {
    name: 'Camí de Ronda: S\'Agaró – Platja d\'Aro',
    location: 'Platja d\'Aro',
    description: 'Prachtige kustroute langs de luxueuze baaien van S\'Agaró naar Platja d\'Aro.',
    long_description: 'Deze route voert je langs de exclusieve coves van S\'Agaró, een van de mooiste stukken kust aan de Costa Brava. Passeer verborgen stranden, dennenbossen en geniet van de azuurblauwe zee.',
    distance_km: 5.0,
    duration_minutes: 120,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cam%C3%AD+de+Ronda+S%27Agaró+Platja+d%27Aro',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+S%27Agar%C3%B3+Platja+d%27Aro',
    tags: ['platja-daro', 'sant-feliu-de-guixols', 'baix-emporda', 'kust', 'gr-92'],
  },
  {
    name: 'Camí de Ronda: Calella de Palafrugell – Llafranc – Tamariu',
    location: 'Calella de Palafrugell',
    description: 'Iconische triple-baai wandeling langs de drie mooiste dorpen van de Baix Empordà.',
    long_description: 'Deze klassieke kustroute verbindt drie juwelen van de Costa Brava. Van de witte huisjes van Calella loop je via het vissersdorpje Llafranc naar de idyllische baai van Tamariu. Onderweg passeer je de Jardí Botànic de Cap Roig.',
    distance_km: 8.0,
    duration_minutes: 180,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Calella+Palafrugell+Llafranc+Tamariu+Cam%C3%AD+de+Ronda',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+Calella+de+Palafrugell+Tamariu',
    tags: ['calella-de-palafrugell', 'baix-emporda', 'kust', 'gr-92'],
  },
  {
    name: 'Jardí Botànic de Cap Roig',
    location: 'Calella de Palafrugell',
    description: 'Wandeling door de beroemde botanische tuinen met uitzicht op de Middellandse Zee.',
    long_description: 'De tuinen van Cap Roig, aangelegd in de jaren 1920, zijn een van de mooiste botanische tuinen aan de Middellandse Zee. Wandel langs meer dan 1.000 plantensoorten en geniet van panoramische uitzichten over de baaien van Calella.',
    distance_km: 3.5,
    duration_minutes: 90,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Jard%C3%AD+Bot%C3%A0nic+Cap+Roig+Calella',
    google_maps_url: 'https://www.google.com/maps/search/Jard%C3%AD+Bot%C3%A0nic+Cap+Roig',
    tags: ['calella-de-palafrugell', 'palamos', 'baix-emporda', 'natuur', 'familie'],
  },
  {
    name: 'Puig de Sa Guàrdia – Begur',
    location: 'Begur',
    description: 'Beklim het kasteel van Begur voor 360° uitzicht over de Costa Brava.',
    long_description: 'Vanuit het centrum van het charmante Begur wandel je omhoog naar de ruïnes van het middeleeuwse kasteel op 200 meter hoogte. Het uitzicht strekt zich uit van de Illes Medes tot aan de Pyreneeën.',
    distance_km: 4.0,
    duration_minutes: 90,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Castell+de+Begur+Puig+Sa+Gu%C3%A0rdia',
    google_maps_url: 'https://www.google.com/maps/search/Castell+de+Begur',
    tags: ['begur', 'baix-emporda', 'cultuur', 'uitzicht'],
  },
  {
    name: 'Sa Tuna – Aiguafreda – Fornells',
    location: 'Begur',
    description: 'Verborgen baaien route langs de wildste kust bij Begur.',
    long_description: 'Start bij het pittoreske vissersdorpje Sa Tuna en wandel via het steile pad naar Aiguafreda en Fornells. Dit is de Costa Brava op zijn rauwst — kristalhelder water, steile kliffen en nauwelijks andere wandelaars.',
    distance_km: 5.5,
    duration_minutes: 150,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Sa+Tuna+Aiguafreda+Begur',
    google_maps_url: 'https://www.google.com/maps/search/Sa+Tuna+Aiguafreda+Begur',
    tags: ['begur', 'baix-emporda', 'kust', 'avontuur'],
  },
  {
    name: 'Camí de Ronda: Palamós – La Fosca – Castell',
    location: 'Palamós',
    description: 'Kustpad langs het strand van La Fosca naar de Iberiaanse ruïnes van Castell.',
    long_description: 'Wandel van de visserijhaven van Palamós langs het prachtige strand van La Fosca naar de Iberiaanse nederzetting van Castell. Onderweg passeer je verborgen baaien en geniet je van de wilde kust.',
    distance_km: 7.0,
    duration_minutes: 150,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cam%C3%AD+de+Ronda+Palam%C3%B3s+La+Fosca+Castell',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+Palam%C3%B3s+Castell',
    tags: ['palamos', 'calonge', 'baix-emporda', 'kust', 'gr-92'],
  },
  {
    name: 'Ruta dels Arrossars de Pals',
    location: 'Pals',
    description: 'Vlakke route door de rijstvelden van Pals met uitzicht op de Illes Medes.',
    long_description: 'Een unieke wandeling door de rijstvelden in het laagland achter de duinen van Pals. In het voorjaar staan de velden onder water en vormen een spiegel voor de Montgrí. Een paradijs voor vogelliefhebbers.',
    distance_km: 9.0,
    duration_minutes: 150,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Arrossars+de+Pals+rijstvelden',
    google_maps_url: 'https://www.google.com/maps/search/Arrossars+de+Pals',
    tags: ['pals', 'estartit', 'baix-emporda', 'natuur', 'vogels', 'familie'],
  },
  {
    name: 'Camí de Ronda: Platja d\'Aro – Palamós',
    location: 'Platja d\'Aro',
    description: 'Langere kustroute van Platja d\'Aro via Calonge naar de haven van Palamós.',
    long_description: 'Een mooie etappe die je langs de rotsachtige kust voert van Platja d\'Aro via de baaien van Calonge naar Palamós. Je passeert de Torre Valentina, verborgen stranden en dennenbossen.',
    distance_km: 10.0,
    duration_minutes: 210,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cam%C3%AD+de+Ronda+Platja+d%27Aro+Palam%C3%B3s',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+Platja+d%27Aro+Palam%C3%B3s',
    tags: ['platja-daro', 'palamos', 'calonge', 'baix-emporda', 'kust', 'gr-92'],
  },
  // ===== ALT EMPORDÀ =====
  {
    name: 'Castell del Montgrí',
    location: 'L\'Estartit',
    description: 'Beklimming naar het imposante 13e-eeuwse kasteel boven Torroella de Montgrí.',
    long_description: 'Een stevig klimmetje naar de nooit voltooide burcht uit 1294 op 303 meter hoogte. Bovenaan een onvergetelijk 360° panorama: de Illes Medes, de rijstvelden van Pals, de Pyreneeën en de hele Golf de Roses.',
    distance_km: 8.0,
    duration_minutes: 180,
    difficulty: 'hard',
    alltrails_url: 'https://www.alltrails.com/explore?q=Castell+del+Montgr%C3%AD+Torroella',
    google_maps_url: 'https://www.google.com/maps/search/Castell+del+Montgr%C3%AD',
    tags: ['estartit', 'pals', 'alt-emporda', 'cultuur', 'uitzicht'],
  },
  {
    name: 'Ruta de les Illes Medes – Mirador',
    location: 'L\'Estartit',
    description: 'Kustpad naar het uitzichtpunt over de Illes Medes natuurreservaat.',
    long_description: 'Loop langs de kust van L\'Estartit naar het mirador boven de Punta del Molinet met spectaculair uitzicht op de Illes Medes. Dit beschermde zeegebied is een van de rijkste ecosystemen van de westelijke Middellandse Zee.',
    distance_km: 4.5,
    duration_minutes: 90,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Illes+Medes+mirador+L%27Estartit',
    google_maps_url: 'https://www.google.com/maps/search/Mirador+Illes+Medes+L%27Estartit',
    tags: ['estartit', 'alt-emporda', 'natuur', 'familie'],
  },
  {
    name: 'Ruïnes d\'Empúries',
    location: 'L\'Escala',
    description: 'Wandeling langs Griekse en Romeinse ruïnes aan de kust bij L\'Escala.',
    long_description: 'Verken de enige plek in Spanje waar een Griekse stad naast een Romeinse stad ligt. De archeologische site van Empúries biedt een unieke combinatie van cultuur, geschiedenis en kust. Na de wandeling kun je afkoelen in de baai ernaast.',
    distance_km: 5.0,
    duration_minutes: 120,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Ru%C3%AFnes+Emp%C3%BAries+L%27Escala',
    google_maps_url: 'https://www.google.com/maps/search/Ruines+Empuries+L%27Escala',
    tags: ['estartit', 'sant-pere-pescador', 'alt-emporda', 'cultuur', 'familie'],
  },
  {
    name: 'Parc Natural Aiguamolls de l\'Empordà',
    location: 'Sant Pere Pescador',
    description: 'Vlakke route door het grootste wetland van Catalonië — vogelspotters paradijs.',
    long_description: 'Het natuurpark Aiguamolls de l\'Empordà is het tweede grootste wetland van Catalonië. Wandel over vlonderpaden langs meren en rietvelden. Spot flamingo\'s, reigers en ijsvogels. Ideaal voor gezinnen en natuurliefhebbers.',
    distance_km: 10.0,
    duration_minutes: 180,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Aiguamolls+Empord%C3%A0+parc+natural',
    google_maps_url: 'https://www.google.com/maps/search/Parc+Natural+Aiguamolls+de+l%27Empord%C3%A0',
    tags: ['sant-pere-pescador', 'empuriabrava', 'roses', 'alt-emporda', 'natuur', 'vogels', 'familie'],
  },
  {
    name: 'Camí de Ronda: Roses – Cala Montjoi',
    location: 'Roses',
    description: 'Spectaculaire kustroute naar de baai waar elBulli ooit stond.',
    long_description: 'Wandel langs de wilde noordkust van de Golf de Roses naar de legendarische Cala Montjoi, waar Ferran Adrià\'s elBulli restaurant ooit de gastronomische wereld veranderde. De route biedt ruige kliffen en kristalhelder water.',
    distance_km: 9.0,
    duration_minutes: 210,
    difficulty: 'hard',
    alltrails_url: 'https://www.alltrails.com/explore?q=Roses+Cala+Montjoi+Cam%C3%AD+de+Ronda',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+Roses+Cala+Montjoi',
    tags: ['roses', 'cadaques', 'alt-emporda', 'kust', 'gr-92', 'avontuur'],
  },
  {
    name: 'Far de Cap de Creus',
    location: 'Cadaqués',
    description: 'Epische trail naar het meest oostelijke punt van het Iberisch schiereiland.',
    long_description: 'Wandel door het surrealistisch landschap van het Parc Natural de Cap de Creus naar de vuurtoren op het meest oostelijke punt van Spanje. Het maanlandschap inspireerde Salvador Dalí — en dat snap je meteen.',
    distance_km: 11.0,
    duration_minutes: 240,
    difficulty: 'hard',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cap+de+Creus+vuurtoren+Cadaqu%C3%A9s',
    google_maps_url: 'https://www.google.com/maps/search/Far+Cap+de+Creus+Cadaqu%C3%A9s',
    tags: ['cadaques', 'roses', 'alt-emporda', 'natuur', 'avontuur'],
  },
  {
    name: 'Paratge de Tudela – Cadaqués',
    location: 'Cadaqués',
    description: 'Maanlandschap route door het hart van Cap de Creus vanuit Cadaqués.',
    long_description: 'Een bijzondere wandeling door het Paratge de Tudela, een woest rotslandschap gevormd door eeuwen van wind en zee. De grillige rotsformaties en het ontbreken van begroeiing creëren een buitenaards landschap.',
    distance_km: 7.0,
    duration_minutes: 150,
    difficulty: 'medium',
    alltrails_url: 'https://www.alltrails.com/explore?q=Paratge+de+Tudela+Cadaqu%C3%A9s',
    google_maps_url: 'https://www.google.com/maps/search/Paratge+de+Tudela+Cadaqu%C3%A9s',
    tags: ['cadaques', 'alt-emporda', 'natuur', 'avontuur'],
  },
  {
    name: 'Castell de Sant Ferran – Figueres',
    location: 'Figueres',
    description: 'Rondwandeling om het grootste bastion-fort van Europa.',
    long_description: 'Het Castell de Sant Ferran is het grootste monument van Catalonië en het grootste bastion-fort van Europa. Wandel rondom de indrukwekkende 18e-eeuwse vestingmuren en geniet van het uitzicht over de Empordà-vlakte.',
    distance_km: 4.0,
    duration_minutes: 75,
    difficulty: 'easy',
    alltrails_url: 'https://www.alltrails.com/explore?q=Castell+Sant+Ferran+Figueres',
    google_maps_url: 'https://www.google.com/maps/search/Castell+de+Sant+Ferran+Figueres',
    tags: ['figueres', 'alt-emporda', 'cultuur', 'familie'],
  },
  {
    name: 'Camí de Ronda: L\'Escala – L\'Estartit',
    location: 'L\'Estartit',
    description: 'Lange kustroute langs Empúries en de duinen naar L\'Estartit.',
    long_description: 'Een uitdagende dagroute die de archeologische site van Empúries verbindt met L\'Estartit. Wandel langs uitgestrekte duinen, door de Montgrí en geniet van schitterende vergezichten over de Golf de Roses en de Illes Medes.',
    distance_km: 14.0,
    duration_minutes: 300,
    difficulty: 'hard',
    alltrails_url: 'https://www.alltrails.com/explore?q=Cam%C3%AD+de+Ronda+L%27Escala+L%27Estartit',
    google_maps_url: 'https://www.google.com/maps/search/Cam%C3%AD+de+Ronda+L%27Escala+L%27Estartit',
    tags: ['estartit', 'sant-pere-pescador', 'alt-emporda', 'kust', 'gr-92', 'avontuur'],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const secret = process.env.SETUP_SECRET;

  if (!secret || key !== secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Niet toegestaan' }, { status: 403 });
    }
  }

  try {
    await setupDatabase();

    // Check if trails already exist
    const existing = await getAllTrails();
    if (existing.length > 0) {
      return NextResponse.json({
        message: `Er zijn al ${existing.length} wandelroutes aanwezig. Verwijder ze eerst als je opnieuw wilt seeden.`,
        existingCount: existing.length,
      });
    }

    const created: string[] = [];
    for (const trail of TRAILS) {
      const result = await createTrail(trail);
      created.push(result.id);
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} wandelroutes aangemaakt`,
      ids: created,
    });
  } catch (error) {
    console.error('Seed trails error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

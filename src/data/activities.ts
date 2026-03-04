// Personalized activity tips per location/region for the Costa Brava
// Used in the customer portal to show relevant activities based on booking location

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: 'strand' | 'cultuur' | 'natuur' | 'sport' | 'kinderen' | 'culinair' | 'uitstap';
  icon: string; // emoji
  tip?: string;
  distance?: string; // e.g. "5 min rijden"
  url?: string;
}

export interface LocationActivities {
  location: string; // matches camping.location
  activities: Activity[];
}

const categoryLabels: Record<Activity['category'], { nl: string; en: string; es: string }> = {
  strand: { nl: 'Strand & Zee', en: 'Beach & Sea', es: 'Playa y Mar' },
  cultuur: { nl: 'Cultuur & Geschiedenis', en: 'Culture & History', es: 'Cultura e Historia' },
  natuur: { nl: 'Natuur & Wandelen', en: 'Nature & Hiking', es: 'Naturaleza y Senderismo' },
  sport: { nl: 'Sport & Actief', en: 'Sports & Active', es: 'Deporte y Activo' },
  kinderen: { nl: 'Met Kinderen', en: 'With Kids', es: 'Con Niños' },
  culinair: { nl: 'Eten & Drinken', en: 'Food & Drinks', es: 'Comida y Bebida' },
  uitstap: { nl: 'Daguitstap', en: 'Day Trip', es: 'Excursión' },
};

export function getCategoryLabel(category: Activity['category'], locale: string = 'nl'): string {
  const loc = locale as 'nl' | 'en' | 'es';
  return categoryLabels[category]?.[loc] || categoryLabels[category]?.nl || category;
}

// ===== ACTIVITIES PER LOCATION =====
export const locationActivities: LocationActivities[] = [
  {
    location: 'Pals',
    activities: [
      { id: 'pals-1', title: 'Platja de Pals', description: 'Kilometers breed zandstrand omringd door pijnbomen. Ideaal voor gezinnen met ondiepe zee.', category: 'strand', icon: '🏖️', tip: 'Bewaar je plek vroeg in de ochtend in het hoogseizoen — het strand is erg populair.' },
      { id: 'pals-2', title: 'Middeleeuws centrum Pals', description: 'Wandel door de prachtige middeleeuwse straatjes met gotische kerk en romaanse toren.', category: 'cultuur', icon: '🏰', distance: '5 min rijden' },
      { id: 'pals-3', title: 'Rijstvelden van Pals', description: 'Unieke rijstvelden direct aan de kust. Proef de beroemde Pals-rijst in lokale restaurants.', category: 'culinair', icon: '🍚', tip: 'Restaurant Sa Punta serveert de beste rijstgerechten van de regio.' },
      { id: 'pals-4', title: 'Golf Platja de Pals', description: 'Schitterende 18-holes golfbaan direct aan zee met uitzicht op de Medes-eilanden.', category: 'sport', icon: '⛳', distance: '2 min rijden' },
      { id: 'pals-5', title: 'Fietsen door het Baix Empordà', description: 'Huur een fiets en ontdek de Via Verda route door rijstvelden, dorpjes en langs de kust.', category: 'natuur', icon: '🚴', tip: 'Fietsverhuur beschikbaar bij de camping of in het dorp.' },
      { id: 'pals-6', title: 'Begur & verborgen baaien', description: 'Het nabijgelegen Begur heeft de mooiste baaien: Sa Tuna, Aiguafreda en Sa Riera.', category: 'uitstap', icon: '🚗', distance: '10 min rijden' },
      { id: 'pals-7', title: 'Snorkelen bij Illes Medes', description: 'Boek een bootexcursie naar het beschermde onderwaterreservaat vanuit L\'Estartit.', category: 'sport', icon: '🤿', distance: '15 min rijden' },
      { id: 'pals-8', title: 'Wekelijkse markt', description: 'Elke dinsdag markt in Pals met lokale producten, kazen, olijfolie en ambachten.', category: 'culinair', icon: '🛒', tip: 'Kom vroeg voor de beste producten — vanaf 9:00 uur.' },
    ],
  },
  {
    location: 'Estartit',
    activities: [
      { id: 'est-1', title: 'Illes Medes duiken', description: 'Top 10 duikplek van Europa! Beschermd onderwaterreservaat met koraal, octopussen en koraalgarnalen.', category: 'sport', icon: '🤿', tip: 'Boek je duik minstens een dag vooruit bij Unisub of Lassdive.' },
      { id: 'est-2', title: 'Glasbodemboot excursie', description: 'Bekijk de onderwaterwereld droog! Perfecte activiteit met kinderen.', category: 'kinderen', icon: '🚤', tip: 'Vaart meerdere keren per dag vanuit de haven — koop tickets op de boulevard.' },
      { id: 'est-3', title: 'Strand L\'Estartit', description: 'Breed zandstrand met ondiepe zee, ideaal voor gezinnen. Strandtenten en parasolverhuur aanwezig.', category: 'strand', icon: '🏖️' },
      { id: 'est-4', title: 'GR-92 kustpad', description: 'Wandel het spectaculaire kustpad richting Begur langs kliffen en verborgen baaien.', category: 'natuur', icon: '🥾', tip: 'Neem water mee en ga vroeg — weinig schaduw onderweg.' },
      { id: 'est-5', title: 'Kajakken langs de kust', description: 'Paddle langs de kliffen en ontdek verborgen grotten en strandjes alleen bereikbaar per water.', category: 'sport', icon: '🛶', distance: 'Vertrek vanuit de haven' },
      { id: 'est-6', title: 'Montgri kasteel wandeling', description: 'Uitdagende wandeling naar het kasteel op de Montgri berg met 360° panorama.', category: 'natuur', icon: '🏔️', distance: 'Start vanuit Torroella (5 min rijden)', tip: 'Alleen voor ervaren wandelaars — zorg voor stevige schoenen.' },
      { id: 'est-7', title: 'Torroella de Montgri', description: 'Gezellig dorpje met maandagmarkt, leuke restaurants en het muziekfestival in augustus.', category: 'cultuur', icon: '🎵', distance: '5 min rijden' },
      { id: 'est-8', title: 'Waterpark Aquadiver', description: 'Leuk waterpark in Platja d\'Aro met glijbanen en golfslagbad.', category: 'kinderen', icon: '🎢', distance: '25 min rijden' },
    ],
  },
  {
    location: 'Roses',
    activities: [
      { id: 'ros-1', title: 'Strand & baai van Roses', description: 'De brede baai biedt beschut water met spectaculaire zonsondergangen. Ideaal voor watersport.', category: 'strand', icon: '🌅' },
      { id: 'ros-2', title: 'Ciutadella de Roses', description: 'Historische 16e-eeuwse citadel met Griekse en Romeinse opgravingen. Prachtig bij avondlicht.', category: 'cultuur', icon: '🏛️', tip: 'Bezoek de avondopenstelling voor een bijzondere sfeer.' },
      { id: 'ros-3', title: 'Cap de Creus wandeling', description: 'Het meest oostelijke punt van Spanje. Surrealistische rotsformaties die Dalí inspireerden.', category: 'natuur', icon: '🏜️', distance: '20 min rijden', tip: 'Perfect voor zonsondergang — Dalí\'s favoriete plek.' },
      { id: 'ros-4', title: 'Kajakken & SUP', description: 'Huur een kajak of stand-up paddleboard op het strand en verken de kust.', category: 'sport', icon: '🏄', tip: 'Ga \'s ochtends vroeg voor rustig water.' },
      { id: 'ros-5', title: 'Cadaqués bezoeken', description: 'Het beroemde kunstenaarsdorp waar Dalí woonde. Prachtige witte huisjes langs de zee.', category: 'uitstap', icon: '🎨', distance: '20 min rijden' },
      { id: 'ros-6', title: 'Aquabrava Waterpark', description: 'Groot waterpark met glijbanen, golfslagbad en kinderbad. Perfect op warme dagen.', category: 'kinderen', icon: '💦', distance: '5 min rijden' },
      { id: 'ros-7', title: 'Visserij & verse vis', description: 'Bezoek de vissershaven en eet ultraverse vis in de haven restaurants.', category: 'culinair', icon: '🐟', tip: 'Restaurant El Llagut aan de haven is een lokale favoriet.' },
      { id: 'ros-8', title: 'Megalithische route', description: 'Dolmens en menhirs uit de steentijd in de heuvels rondom Roses.', category: 'cultuur', icon: '🗿', distance: '15 min rijden' },
    ],
  },
  {
    location: 'Lloret de Mar',
    activities: [
      { id: 'llo-1', title: 'Hoofdstrand Lloret', description: 'Breed zandstrand met helder turquoise water. Strandtenten en watersporten beschikbaar.', category: 'strand', icon: '🏖️' },
      { id: 'llo-2', title: 'Jardins de Santa Clotilde', description: 'Schitterende Italiaans geïnspireerde tuinen op de kliffen met adembenemend zeezicht.', category: 'natuur', icon: '🌺', tip: 'Geschikt voor alle leeftijden — neem een picknick mee.' },
      { id: 'llo-3', title: 'Water World', description: 'Het grootste waterpark van de Costa Brava! Glijbanen, kamikaze en lazy river.', category: 'kinderen', icon: '🎢', distance: '5 min rijden', tip: 'Koop tickets online voor 15% korting.' },
      { id: 'llo-4', title: 'Cala Boadella', description: 'Verborgen baai met kristalhelder water, alleen bereikbaar via een pad door het bos.', category: 'strand', icon: '🏝️', distance: '10 min lopen', tip: 'Neem eten en drinken mee — geen strandtent aanwezig.' },
      { id: 'llo-5', title: 'Camí de Ronda naar Tossa', description: '12 km kustpad langs spectaculaire kliffen en verborgen baaien naar Tossa de Mar.', category: 'natuur', icon: '🥾' },
      { id: 'llo-6', title: 'Kasteel Sant Joan', description: 'Loop naar de ruïne van het kasteel voor een panoramisch uitzicht over de hele kust.', category: 'cultuur', icon: '🏰', tip: 'Fantastisch bij zonsondergang.' },
      { id: 'llo-7', title: 'Tossa de Mar bezoeken', description: 'De prachtige Vila Vella (middeleeuwse muren direct aan zee) op slechts 20 min rijden.', category: 'uitstap', icon: '🚗', distance: '20 min rijden' },
      { id: 'llo-8', title: 'Gnomo Park', description: 'Avonturenpark in het bos voor kinderen met klimbanen, trampolines en kabelbaan.', category: 'kinderen', icon: '🧗', distance: '10 min rijden' },
    ],
  },
  {
    location: 'Sant Pere Pescador',
    activities: [
      { id: 'spp-1', title: 'Kilometerlang wild strand', description: 'Een van de langste stranden van de Costa Brava, omringd door natuur zonder bebouwing.', category: 'strand', icon: '🏖️', tip: 'Breng eigen parasol mee — weinig verhuur op het wilde strand.' },
      { id: 'spp-2', title: 'Kitesurfen & windsurfen', description: 'Dé hotspot voor wind-watersport aan de Costa Brava. Scholen en verhuur op het strand.', category: 'sport', icon: '🪁', tip: 'De Tramontana-wind waait meestal in de middag. Ideaal voor beginners.' },
      { id: 'spp-3', title: 'Aiguamolls Natuurpark', description: 'Vogels spotten in het moerasgebied: flamingo\'s, ooievaars, ijsvogels en roerdompen.', category: 'natuur', icon: '🦩', tip: 'Neem een verrekijker mee. Bezoek de uitkijktorens bij zonsopgang.' },
      { id: 'spp-4', title: 'Fietsen langs de Fluvià', description: 'Mooie fietsroute langs de rivier door authentieke Catalaanse dorpjes.', category: 'sport', icon: '🚴', tip: 'Fietsverhuur bij de camping of in het dorp.' },
      { id: 'spp-5', title: 'Empúries Griekse ruïnes', description: 'Indrukwekkende Griekse en Romeinse opgravingen direct aan zee in L\'Escala.', category: 'uitstap', icon: '🏛️', distance: '10 min rijden' },
      { id: 'spp-6', title: 'Figueres & Dalí Museum', description: 'Het spectaculaire Dalí Theatre-Museum — het meest bezochte museum van Spanje na het Prado.', category: 'uitstap', icon: '🎨', distance: '20 min rijden' },
      { id: 'spp-7', title: 'Lokale biologische producten', description: 'De Empordà staat bekend om biologische landbouw. Bezoek boerderijwinkels voor olijfolie, kaas en wijn.', category: 'culinair', icon: '🫒' },
      { id: 'spp-8', title: 'Kanoën op de Fluvià', description: 'Rustige kanotocht op de rivier — perfect voor gezinnen met kinderen.', category: 'kinderen', icon: '🛶' },
    ],
  },
  {
    location: 'Platja d\'Aro',
    activities: [
      { id: 'pda-1', title: 'Strand Platja d\'Aro', description: 'Twee kilometer breed zandstrand met alle faciliteiten. Strandtenten, sport en watplezier.', category: 'strand', icon: '🏖️' },
      { id: 'pda-2', title: 'Aquadiver Waterpark', description: 'Waterpark met spectaculaire glijbanen en golfslagbad. Leuks voor het hele gezin.', category: 'kinderen', icon: '🎢', tip: 'Online tickets zijn goedkoper. Ga op doordeweekse dagen voor minder drukte.' },
      { id: 'pda-3', title: 'Cala Rovira', description: 'Rustige baai met pijnbomen tot aan het water. Heerlijk snorkelen bij de rotsen.', category: 'strand', icon: '🏝️', distance: '5 min lopen' },
      { id: 'pda-4', title: 'Winkelen op de boulevard', description: 'Eindeloos shoppen langs de lange boulevard met Spaanse en internationale merken.', category: 'cultuur', icon: '🛍️' },
      { id: 'pda-5', title: 'Dinsdagmarkt', description: 'Grote markt met lokale producten, kleding en souvenirs door het hele centrum.', category: 'culinair', icon: '🛒', tip: 'Start vroeg — de beste kraampjes zijn rond 10:00 al druk.' },
      { id: 'pda-6', title: 'Uitgaansleven', description: 'Na zonsondergang komt het centrum tot leven met bars, restaurants en clubs.', category: 'culinair', icon: '🍹' },
      { id: 'pda-7', title: 'Palamós & de rode garnaal', description: 'Bezoek de visserij-stad Palamós voor de beroemde rode garnaal en het visserijmuseum.', category: 'uitstap', icon: '🦐', distance: '10 min rijden' },
      { id: 'pda-8', title: 'Pitch & Putt en minigolf', description: 'Verschillende minigolf- en pitch & putt banen in en rondom Platja d\'Aro.', category: 'sport', icon: '⛳' },
    ],
  },
  {
    location: 'Calonge',
    activities: [
      { id: 'cal-1', title: 'Strand Torre Valentina', description: 'Breed strand met uitzicht op de historische toren. Rustig en gezinsvriendelijk.', category: 'strand', icon: '🏖️' },
      { id: 'cal-2', title: 'Middeleeuws Calonge', description: 'Kasteel van Calonge en het middeleeuwse festival in de zomer. Schitterende oude kern.', category: 'cultuur', icon: '🏰', tip: 'In augustus middeleeuws festival met markt, muziek en riddergevechten.' },
      { id: 'cal-3', title: 'Platja d\'Aro waterpark', description: 'Aquadiver vlakbij met glijbanen voor alle leeftijden.', category: 'kinderen', icon: '🎢', distance: '5 min rijden' },
      { id: 'cal-4', title: 'Golfclub Costa Brava', description: 'Prachtige 18-holes golfbaan in de groene heuvels van het Empordà.', category: 'sport', icon: '⛳', distance: '5 min rijden' },
      { id: 'cal-5', title: 'Camí de Ronda kustpad', description: 'Wandel het prachtige kustpad naar Palamós of richting Sant Antoni de Calonge.', category: 'natuur', icon: '🥾' },
      { id: 'cal-6', title: 'Palamós visserij', description: 'De beroemde Gamba de Palamós proeven en de live visveiling bekijken.', category: 'uitstap', icon: '🦐', distance: '10 min rijden' },
      { id: 'cal-7', title: 'Wijnproeverij Empordà', description: 'Bezoek een lokale bodega en proef de DO Empordà wijnen.', category: 'culinair', icon: '🍷', distance: '15 min rijden' },
      { id: 'cal-8', title: 'Girona dagtrip', description: 'De prachtige stad Girona met kathedraal, Joodse wijk en Game of Thrones locaties.', category: 'uitstap', icon: '🏙️', distance: '35 min rijden' },
    ],
  },
  {
    location: 'Blanes',
    activities: [
      { id: 'bla-1', title: 'Jardí Botànic Marimurtra', description: 'Een van de mooiste botanische tuinen van Europa met spectaculair zeezicht.', category: 'natuur', icon: '🌺', tip: 'Neem de tijd — je hebt minstens 1,5 uur nodig om alles te zien.' },
      { id: 'bla-2', title: 'Sa Palomera rots', description: 'Het icoon van de Costa Brava! Loop over de rots voor prachtige foto\'s en uitzicht.', category: 'strand', icon: '🪨' },
      { id: 'bla-3', title: 'Vuurwerkfestival (juli)', description: 'Internationaal vuurwerkfestival eind juli — elke avond een spectaculaire show boven de baai.', category: 'cultuur', icon: '🎆', tip: 'Reserveer een restaurant aan het strand voor de beste ervaring.' },
      { id: 'bla-4', title: 'Strand S\'Abanell', description: 'Het langste strand van de Costa Brava — 2,5 km fijn zand met alle faciliteiten.', category: 'strand', icon: '🏖️' },
      { id: 'bla-5', title: 'Lloret de Mar Water World', description: 'Het grootste waterpark van de Costa Brava op slechts 10 min rijden.', category: 'kinderen', icon: '🎢', distance: '10 min rijden' },
      { id: 'bla-6', title: 'Tordera Delta wandeling', description: 'Natuurwandeling door de rivierdelta — flamingo\'s spotten in het najaar.', category: 'natuur', icon: '🦩', distance: '5 min rijden' },
      { id: 'bla-7', title: 'Trein naar Barcelona', description: 'Blanes heeft een treinstation! In 1,5 uur ben je in het centrum van Barcelona.', category: 'uitstap', icon: '🚂', tip: 'Koop retourtickets (ida y vuelta) voor korting bij Renfe.' },
      { id: 'bla-8', title: 'Vis & zeevruchten haven', description: 'Verse vis direct van de boot in de haven restaurants van Blanes.', category: 'culinair', icon: '🐟' },
    ],
  },
  {
    location: 'Santa Cristina d\'Aro',
    activities: [
      { id: 'sca-1', title: 'Middeleeuwse kerk Santa Cristina', description: 'Prachtige romaanse kerk en het rustige dorpscentrum verkennen.', category: 'cultuur', icon: '⛪' },
      { id: 'sca-2', title: 'Golf Costa Brava', description: 'Uitstekende golfbaan in een prachtige groene omgeving.', category: 'sport', icon: '⛳', distance: '5 min rijden' },
      { id: 'sca-3', title: 'Platja d\'Aro stranden', description: 'In 10 min op het brede strand van Platja d\'Aro met alle faciliteiten.', category: 'strand', icon: '🏖️', distance: '10 min rijden' },
      { id: 'sca-4', title: 'Mountainbiken Gavarres', description: 'Het Gavarres gebergte biedt fantastische mountainbike routes door het bos.', category: 'sport', icon: '🚵', tip: 'Routes variërend van makkelijk tot expert niveau.' },
      { id: 'sca-5', title: 'Wandelen in het Gavarres massief', description: 'Mooie wandelroutes door eikenbossen en kurkeiken met panoramisch uitzicht.', category: 'natuur', icon: '🥾' },
      { id: 'sca-6', title: 'Girona daguitstap', description: 'De prachtige middeleeuwse stad met de beroemde gekleurde huizen aan de rivier.', category: 'uitstap', icon: '🏙️', distance: '25 min rijden' },
      { id: 'sca-7', title: 'Wijngaarden Empordà', description: 'Bezoek lokale bodegas voor wijnproeverijen met uitzicht op de bergen.', category: 'culinair', icon: '🍷' },
      { id: 'sca-8', title: 'Aquadiver Waterpark', description: 'Waterpark in Platja d\'Aro voor een leuke dag met het gezin.', category: 'kinderen', icon: '🎢', distance: '10 min rijden' },
    ],
  },
  {
    location: 'Torroella de Montgrí',
    activities: [
      { id: 'tdm-1', title: 'Kasteel van Montgri', description: 'Imposant kasteel op de bergtop met 360° panorama over de hele kust en de Pyreneeën.', category: 'natuur', icon: '🏔️', tip: 'Stevige wandeling van 45 min omhoog — breng water mee.' },
      { id: 'tdm-2', title: 'Illes Medes (L\'Estartit)', description: 'Het beroemde duik- en snorkelreservaat is op 5 minuten rijden.', category: 'sport', icon: '🤿', distance: '5 min rijden' },
      { id: 'tdm-3', title: 'Strand L\'Estartit', description: 'Breed familiestand met ondiepe zee en strandtenten.', category: 'strand', icon: '🏖️', distance: '5 min rijden' },
      { id: 'tdm-4', title: 'Maandagmarkt', description: 'Grote wekelijkse markt in Torroella met lokale producten en ambachten.', category: 'culinair', icon: '🛒' },
      { id: 'tdm-5', title: 'Festival de Torroella', description: 'Internationaal muziekfestival in augustus — klassieke muziek op unieke locaties.', category: 'cultuur', icon: '🎵' },
      { id: 'tdm-6', title: 'Fietsen naar L\'Estartit', description: 'Mooi en vlak fietspad van Torroella naar L\'Estartit en het strand.', category: 'sport', icon: '🚴' },
      { id: 'tdm-7', title: 'Ter Vell natuurgebied', description: 'Rustig moerasgebied met vogels en schildpadden — ideaal voor een rustige wandeling.', category: 'natuur', icon: '🐢' },
      { id: 'tdm-8', title: 'Glasbodemboot', description: 'Glasbodemboot vanuit L\'Estartit naar de Illes Medes — super met kinderen.', category: 'kinderen', icon: '🚤', distance: '5 min rijden' },
    ],
  },
  {
    location: 'L\'Escala',
    activities: [
      { id: 'esc-1', title: 'Ruïnes van Empúries', description: 'Griekse en Romeinse opgravingen direct aan zee — een van de belangrijkste archeologische sites van Spanje.', category: 'cultuur', icon: '🏛️', tip: 'Neem de audioguide voor het volledige verhaal. Combineer met een strandbezoek.' },
      { id: 'esc-2', title: 'Ansjovis proeven', description: 'L\'Escala is de ansjovis-hoofdstad van Spanje! Proef ze vers bij de haven.', category: 'culinair', icon: '🐟', tip: 'Bezoek het Ansjovis Museum (MARAM) en proef ze bij het Anchovy Festival in juni.' },
      { id: 'esc-3', title: 'Strand Riells & Moll Grec', description: 'Gezellig stadsstrand en het mooie strand bij de Griekse ruïnes.', category: 'strand', icon: '🏖️' },
      { id: 'esc-4', title: 'Camí de Ronda kustpad', description: 'Prachtige kustpaden richting Sant Martí d\'Empúries en Empuriabrava.', category: 'natuur', icon: '🥾' },
      { id: 'esc-5', title: 'Aiguamolls Natuurpark', description: 'Groot natuurpark met unieke flora en fauna op slechts 15 min rijden.', category: 'natuur', icon: '🦩', distance: '15 min rijden' },
      { id: 'esc-6', title: 'Fietsen door fruit-tuinen', description: 'Vlakke fietsroutes door olijfgaarden en fruittunnels naar de binnenlanden.', category: 'sport', icon: '🚴' },
      { id: 'esc-7', title: 'Figueres & Dalí Museum', description: 'Het surrealistisch museum op 25 min rijden — een must-see!', category: 'uitstap', icon: '🎨', distance: '25 min rijden' },
      { id: 'esc-8', title: 'Zondagmarkt', description: 'Elke zondag in L\'Escala — ideaal voor snuisterijen en lokale producten.', category: 'culinair', icon: '🛒' },
    ],
  },
  {
    location: 'Castelló d\'Empúries',
    activities: [
      { id: 'ce-1', title: 'Basilica Santa Maria', description: 'Imposante gotische kathedraal — de "kathedraal van het Empordà".', category: 'cultuur', icon: '⛪' },
      { id: 'ce-2', title: 'Empuriabrava kanalen', description: 'Verken het "Venetië van Spanje" met 24 km kanalen per boot of kayak.', category: 'sport', icon: '🛶', distance: '5 min rijden' },
      { id: 'ce-3', title: 'Butterfly Park', description: 'Tropische vlindertuin in Empuriabrava — magisch voor kinderen én volwassenen.', category: 'kinderen', icon: '🦋', distance: '5 min rijden' },
      { id: 'ce-4', title: 'Skydiven', description: 'Skydive Empuriabrava — een van de beroemdste dropzones ter wereld!', category: 'sport', icon: '🪂', distance: '5 min rijden' },
      { id: 'ce-5', title: 'Aiguamolls Natuurpark', description: 'Direct naast de deur: vogels spotten, wandelen en fietsen in het moerasgebied.', category: 'natuur', icon: '🦩' },
      { id: 'ce-6', title: 'Middeleeuws centrum', description: 'Wandel door de sfeervolle middeleeuwse straten van Castelló.', category: 'cultuur', icon: '🏰' },
      { id: 'ce-7', title: 'Roses bezoeken', description: 'De levendige badplaats Roses met prachtige baai op 10 min rijden.', category: 'uitstap', icon: '🚗', distance: '10 min rijden' },
      { id: 'ce-8', title: 'Strand Empuriabrava', description: 'Breed strand met uitzicht op de Pyreneeën.', category: 'strand', icon: '🏖️', distance: '5 min rijden' },
    ],
  },
  {
    location: 'Begur',
    activities: [
      { id: 'beg-1', title: 'Sa Tuna', description: 'Schilderachtige vissersbaai met restaurantje aan het water. De mooiste plek van de Costa Brava.', category: 'strand', icon: '🏝️', distance: '5 min rijden', tip: 'Parkeer bovenaan en loop het klif-pad naar beneden.' },
      { id: 'beg-2', title: 'Aiguafreda', description: 'Kristalhelder snorkelwater tussen de rotsen. Bring je eigen snorkelset mee!', category: 'sport', icon: '🤿', distance: '5 min rijden' },
      { id: 'beg-3', title: 'Kasteel van Begur', description: '360° panorama over de hele Costa Brava. De mooiste view van de regio.', category: 'cultuur', icon: '🏰', tip: 'Wandel er heen via het pad vanuit het dorpscentrum (10 min).' },
      { id: 'beg-4', title: 'Camí de Ronda Sa Tuna → Aiguafreda', description: 'Korte maar spectaculaire kustpad-wandeling langs verborgen baaien.', category: 'natuur', icon: '🥾' },
      { id: 'beg-5', title: 'Indiaansche huizen tour', description: 'Ontdek de prachtige koloniale huizen gebouwd door teruggekeerde kolonisten.', category: 'cultuur', icon: '🏡' },
      { id: 'beg-6', title: 'Fornells strand', description: 'Grotere baai met horecagelegenheid — geschikt voor gezinnen.', category: 'strand', icon: '🏖️', distance: '5 min rijden' },
      { id: 'beg-7', title: 'Pals middeleeuws centrum', description: 'Het nabijgelegen Pals met prachtige middeleeuwse straatjes en toren.', category: 'uitstap', icon: '🏰', distance: '10 min rijden' },
      { id: 'beg-8', title: 'Duiken bij Medes eilanden', description: 'Boek een duikexcursie vanuit L\'Estartit naar het beschermde onderwaterreservaat.', category: 'sport', icon: '🤿', distance: '20 min rijden' },
    ],
  },
  {
    location: 'Colera',
    activities: [
      { id: 'col-1', title: 'Strand Colera', description: 'Klein, authentiek strand in een rustig vissersdorpje. Geen massatoerisme hier!', category: 'strand', icon: '🏖️' },
      { id: 'col-2', title: 'Portbou grens-uitstap', description: 'Bezoek het grensplaatsje met het Walter Benjamin monument en het spectaculaire treinstation.', category: 'uitstap', icon: '🚂', distance: '5 min rijden' },
      { id: 'col-3', title: 'Cap de Creus wandelen', description: 'Het meest oostelijke punt van Spanje met surrealistische rotsformaties.', category: 'natuur', icon: '🏜️', distance: '25 min rijden' },
      { id: 'col-4', title: 'Cadaqués bezoeken', description: 'Het droomachtige kunstenaarsdorp van Dalí op 30 min rijden.', category: 'uitstap', icon: '🎨', distance: '30 min rijden' },
      { id: 'col-5', title: 'Snorkelen bij de rotsen', description: 'Het heldere water rondom Colera is perfect voor snorkelen bij de kliffen.', category: 'sport', icon: '🤿' },
      { id: 'col-6', title: 'Frankrijk over de grens', description: 'In 15 min ben je aan de Franse Côte Vermeille — Collioure en Banyuls!', category: 'uitstap', icon: '🇫🇷', distance: '15 min rijden' },
      { id: 'col-7', title: 'Verse vis in het dorp', description: 'Eet ultravese vis in een van de kleine restaurants langs de kust.', category: 'culinair', icon: '🐟' },
      { id: 'col-8', title: 'GR-92 kustpad noord', description: 'Wandel het ruige kustpad naar Llançà of Portbou — wild en ongerept.', category: 'natuur', icon: '🥾' },
    ],
  },
  {
    location: 'Cadaqués',
    activities: [
      { id: 'cad-1', title: 'Casa-Museu Salvador Dalí', description: 'Het huis en atelier van Dalí in Portlligat. Reserveer vooraf — erg populair!', category: 'cultuur', icon: '🎨', tip: 'Tickets zijn snel uitverkocht — boek online minstens een week vooruit.' },
      { id: 'cad-2', title: 'Portlligat baai', description: 'Kristalhelder water in de baai waar Dalí zwom. Ideaal om te snorkelen.', category: 'strand', icon: '🏝️' },
      { id: 'cad-3', title: 'Wandelen Cap de Creus', description: 'Surrealistische rotsformaties op het meest oostelijke punt van Spanje.', category: 'natuur', icon: '🏜️', tip: 'Ga bij zonsondergang voor een magische ervaring.' },
      { id: 'cad-4', title: 'Witgekalkt centrum', description: 'Dwaal door de sfeervolle witte straatjes en geniet van galeries en terrassen.', category: 'cultuur', icon: '🏘️' },
      { id: 'cad-5', title: 'Kayakken langs de kust', description: 'Ontdek verborgen baaien die alleen via water bereikbaar zijn.', category: 'sport', icon: '🛶' },
      { id: 'cad-6', title: 'Verse vis restaurants', description: 'De beste zeevruchten van de Costa Brava in de haven restaurants.', category: 'culinair', icon: '🐟', tip: 'Restaurant Casa Anita is legendarisch — reserveer!' },
      { id: 'cad-7', title: 'Figueres & Dalí Museum', description: 'Combineer met het Dalí Theatre-Museum voor de complete Dalí-driehoek.', category: 'uitstap', icon: '🏛️', distance: '35 min rijden' },
      { id: 'cad-8', title: 'Roses bezoeken', description: 'De levendige badplaats met groot strand en watersport.', category: 'uitstap', icon: '🚗', distance: '20 min rijden' },
    ],
  },
];

// ===== GENERAL TIPS (shown to all regardless of location) =====
export const generalTips: Activity[] = [
  { id: 'gen-1', title: 'Figueres & Dalí Museum', description: 'Het meest bezochte museum van Spanje na het Prado. Surrealistisch meesterwerk van Dalí.', category: 'uitstap', icon: '🎨', tip: 'Koop tickets online om de rij te vermijden.' },
  { id: 'gen-2', title: 'Girona dagtrip', description: 'Middeleeuwse stad met kleurrijke huizen, kathedraal en Game of Thrones locaties.', category: 'uitstap', icon: '🏙️', tip: 'Combineer met een culinaire tour — Girona heeft fantastische restaurants.' },
  { id: 'gen-3', title: 'Barcelona dagtrip', description: 'De Sagrada Familia, Park Güell, La Rambla — een must-visit op 1-2 uur rijden.', category: 'uitstap', icon: '🏙️', tip: 'Neem de trein vanuit Blanes of Figueres om parkeerkosten te vermijden.' },
  { id: 'gen-4', title: 'Wijnproeverij Empordà', description: 'DO Empordà wijnen proeven bij lokale bodegas met uitzicht op de zee.', category: 'culinair', icon: '🍷' },
  { id: 'gen-5', title: 'Camí de Ronda kustpaden', description: 'Historische kustpaden die de hele Costa Brava verbinden — spectaculaire uitzichten.', category: 'natuur', icon: '🥾', tip: 'Draag goede wandelschoenen en neem voldoende water mee.' },
];

// ===== HELPER FUNCTIONS =====

/**
 * Get activities for a specific camping location.
 * Falls back to general tips if no location-specific activities found.
 */
export function getActivitiesForLocation(campingLocation: string): Activity[] {
  const locActs = locationActivities.find(
    la => la.location.toLowerCase() === campingLocation.toLowerCase()
  );
  return locActs?.activities || generalTips;
}

/**
 * Get activities for a camping by its ID (looks up the camping's location first).
 */
export function getActivitiesForCampingId(campingId: string, campingsData: { id: string; location: string }[]): Activity[] {
  const camping = campingsData.find(c => c.id === campingId);
  if (!camping) return generalTips;
  return getActivitiesForLocation(camping.location);
}

/**
 * Group activities by category.
 */
export function groupActivitiesByCategory(activities: Activity[]): Record<string, Activity[]> {
  return activities.reduce((acc, act) => {
    if (!acc[act.category]) acc[act.category] = [];
    acc[act.category].push(act);
    return acc;
  }, {} as Record<string, Activity[]>);
}

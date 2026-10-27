// =============================================================================
// Europa im Hintergrund (Detailstufe 3 „Profil“): Länder, Ligagrößen, Städte.
// Vereine heißen nach Stadt (+ Farbe bei mehreren Vereinen einer Stadt) –
// keine echten Vereinsnamen. Die bekannten Europapokal-Gegner aus europe.ts
// werden als Spitzenvereine ihres Landes übernommen.
// =============================================================================

export interface CountrySeed {
  /** Anzeigename (wie in europe.ts `country`). */
  name: string;
  /** Herkunfts-ID für Spielernamen (data/origins.ts). */
  origin: string;
  /** Grundniveau der 1. Liga 1975 (Skala wie Vereinsstärke). */
  base: number;
  tier1: number;
  tier2: number;
  /** Städte für erfundene Vereine (die ersten sind die größten). */
  cities: string[];
}

export const COUNTRY_SEEDS: CountrySeed[] = [
  { name: 'England', origin: 'eng', base: 70, tier1: 22, tier2: 22, cities: ['Manchester', 'Birmingham', 'Newcastle', 'Sheffield', 'Nottingham', 'Southampton', 'Coventry', 'Norwich', 'Middlesbrough', 'Sunderland', 'Wolverhampton', 'Bristol', 'Leicester', 'Portsmouth', 'Blackburn', 'Bolton', 'Burnley', 'Hull', 'Oxford', 'Luton', 'Plymouth', 'Cardiff', 'Swansea', 'Reading', 'Preston', 'Blackpool', 'Carlisle', 'Oldham', 'Bradford', 'Watford', 'Brighton', 'Charlton', 'Millwall', 'York', 'Notts', 'Walsall', 'Fulham', 'Orient'] },
  { name: 'Schottland', origin: 'sco', base: 62, tier1: 10, tier2: 14, cities: ['Aberdeen', 'Motherwell', 'Kilmarnock', 'Paisley', 'Perth', 'Falkirk', 'Greenock', 'Ayr', 'Dunfermline', 'Arbroath', 'Airdrie', 'Hamilton', 'Clydebank', 'Montrose', 'Stirling', 'Dumbarton', 'Raith', 'Dundee Nord', 'Inverness', 'Partick'] },
  { name: 'Italien', origin: 'ita', base: 69, tier1: 16, tier2: 20, cities: ['Rom', 'Bologna', 'Genua', 'Verona', 'Cagliari', 'Perugia', 'Bergamo', 'Udine', 'Bari', 'Palermo', 'Catania', 'Como', 'Brescia', 'Ascoli', 'Avellino', 'Pescara', 'Lecce', 'Cesena', 'Varese', 'Ternana', 'Foggia', 'Sampdoria-Genua', 'Taranto', 'Modena', 'Parma', 'Vicenza'] },
  { name: 'Spanien', origin: 'esp', base: 69, tier1: 18, tier2: 20, cities: ['Valencia', 'Sevilla', 'San Sebastián', 'Gijón', 'Vigo', 'Las Palmas', 'Santander', 'Salamanca', 'Elche', 'Oviedo', 'Málaga', 'Granada', 'Hércules-Alicante', 'Burgos', 'Córdoba', 'Murcia', 'Cádiz', 'Valladolid', 'Pamplona', 'Logroño', 'Castellón', 'Mallorca', 'La Coruña', 'Huelva'] },
  { name: 'Frankreich', origin: 'fra', base: 64, tier1: 20, tier2: 18, cities: ['Paris', 'Bordeaux', 'Nantes', 'Monaco', 'Metz', 'Reims', 'Lens', 'Lille', 'Straßburg', 'Sochaux', 'Rennes', 'Troyes', 'Bastia', 'Valenciennes', 'Angers', 'Laval', 'Nancy', 'Rouen', 'Toulouse', 'Auxerre', 'Montpellier', 'Brest', 'Le Havre', 'Caen'] },
  { name: 'Niederlande', origin: 'ned', base: 66, tier1: 18, tier2: 18, cities: ['Den Haag', 'Utrecht', 'Alkmaar', 'Arnheim', 'Breda', 'Groningen', 'Tilburg', 'Nimwegen', 'Venlo', 'Haarlem', 'Maastricht', 'Zwolle', 'Deventer', 'Kerkrade', 'Leeuwarden', 'Heerenveen', 'Sittard', 'Volendam', 'Helmond', 'Dordrecht'] },
  { name: 'Belgien', origin: 'bel', base: 64, tier1: 18, tier2: 16, cities: ['Antwerpen', 'Gent', 'Mechelen', 'Charleroi', 'Lierse', 'Beveren', 'Waregem', 'Kortrijk', 'Lokeren', 'Beerschot', 'Molenbeek', 'Berchem', 'Winterslag', 'Ostende', 'Seraing', 'Tongeren', 'Hasselt', 'Namur'] },
  { name: 'Portugal', origin: 'por', base: 63, tier1: 16, tier2: 18, cities: ['Braga', 'Guimarães', 'Setúbal', 'Coimbra', 'Belenenses-Lissabon', 'Boavista-Porto', 'Funchal', 'Faro', 'Leiria', 'Aveiro', 'Viseu', 'Chaves', 'Portimão', 'Barreiro', 'Estoril', 'Penafiel'] },
  { name: 'Oesterreich', origin: 'aut', base: 60, tier1: 10, tier2: 16, cities: ['Innsbruck', 'Graz', 'Linz', 'Salzburg', 'Klagenfurt', 'Wels', 'Steyr', 'Villach', 'St. Pölten', 'Wiener Neustadt', 'Dornbirn', 'Kapfenberg'] },
  { name: 'Schweiz', origin: 'sui', base: 58, tier1: 14, tier2: 16, cities: ['Basel', 'Bern', 'Genf', 'Lausanne', 'Luzern', 'St. Gallen', 'Sitten', 'Neuenburg', 'Winterthur', 'Lugano', 'Aarau', 'Chiasso', 'Bellinzona', 'Grenchen'] },
  { name: 'Schweden', origin: 'swe', base: 58, tier1: 14, tier2: 14, cities: ['Göteborg', 'Stockholm', 'Norrköping', 'Halmstad', 'Örebro', 'Kalmar', 'Västerås', 'Helsingborg', 'Östersund', 'Landskrona', 'Åtvidaberg', 'Gävle', 'Uppsala', 'Sundsvall'] },
  { name: 'Daenemark', origin: 'den', base: 57, tier1: 16, tier2: 16, cities: ['Kopenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Vejle', 'Brøndby', 'Næstved', 'Randers', 'Horsens', 'Silkeborg', 'Herning', 'Frem', 'Køge'] },
  { name: 'Jugoslawien', origin: 'yug', base: 63, tier1: 18, tier2: 18, cities: ['Sarajevo', 'Mostar', 'Rijeka', 'Skopje', 'Novi Sad', 'Niš', 'Osijek', 'Tuzla', 'Banja Luka', 'Priština', 'Titograd', 'Ljubljana', 'Zenica', 'Maribor', 'Kragujevac', 'Subotica'] },
  { name: 'Ungarn', origin: 'hun', base: 61, tier1: 16, tier2: 18, cities: ['Győr', 'Debrecen', 'Pécs', 'Szeged', 'Tatabánya', 'Székesfehérvár', 'Miskolc', 'Szombathely', 'Kaposvár', 'Zalaegerszeg', 'Nyíregyháza', 'Békéscsaba', 'Salgótarján', 'Dunaújváros'] },
  { name: 'Tschechoslowakei', origin: 'cze', base: 62, tier1: 16, tier2: 16, cities: ['Prag', 'Brünn', 'Pilsen', 'Košice', 'Nitra', 'Olmütz', 'Trnava', 'Žilina', 'Liberec', 'Hradec Králové', 'Teplice', 'Most', 'Cheb', 'Trenčín'] },
  { name: 'Polen', origin: 'pol', base: 61, tier1: 16, tier2: 18, cities: ['Warschau', 'Krakau', 'Łódź', 'Posen', 'Breslau', 'Stettin', 'Danzig', 'Kattowitz', 'Bytom', 'Lublin', 'Bielsko', 'Mielec', 'Stal-Rzeszów', 'Zagłębie'] },
  { name: 'Sowjetunion', origin: 'rus', base: 64, tier1: 16, tier2: 22, cities: ['Leningrad', 'Minsk', 'Odessa', 'Charkow', 'Donezk', 'Jerewan', 'Baku', 'Taschkent', 'Rostow', 'Dnipro', 'Woronesch', 'Kuibyschew', 'Alma-Ata', 'Wilna', 'Riga', 'Kischinjow'] },
  { name: 'Griechenland', origin: 'gre', base: 59, tier1: 18, tier2: 20, cities: ['Athen Gelb', 'Patras', 'Larisa', 'Iraklio', 'Volos', 'Ioannina', 'Kalamata', 'Kavala', 'Serres', 'Veria', 'Xanthi', 'Korinth', 'Trikala', 'Drama'] },
  { name: 'Tuerkei', origin: 'tur', base: 58, tier1: 16, tier2: 18, cities: ['Istanbul Gelb-Rot', 'Istanbul Schwarz-Weiß', 'Trabzon', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Eskişehir', 'Samsun', 'Konya', 'Kayseri', 'Antalya', 'Malatya', 'Gaziantep'] },
  { name: 'Rumaenien', origin: 'hun', base: 59, tier1: 18, tier2: 18, cities: ['Bukarest Rot-Weiß', 'Craiova', 'Timișoara', 'Cluj', 'Arad', 'Ploiești', 'Brașov', 'Pitești', 'Constanța', 'Bacău', 'Iași', 'Galați', 'Sibiu', 'Oradea'] },
];

/** Grundniveau eines Landes im Lauf der Jahrzehnte (Verschiebungen der Kräfteverhältnisse). */
export const COUNTRY_TRENDS: Record<string, [number, number][]> = {
  // [Jahr, Veränderung des Grundniveaus ggü. 1975]
  England: [[1985, -1], [1995, 1], [2005, 3], [2015, 4]],
  Spanien: [[1995, 1], [2005, 2], [2015, 3]],
  Italien: [[1985, 1], [1995, 2], [2005, 0], [2015, -1]],
  Frankreich: [[1995, 1], [2010, 2]],
  Niederlande: [[1995, -1], [2005, -2], [2015, -3]],
  Portugal: [[2000, 1], [2015, 1]],
  Sowjetunion: [[1992, -3], [2005, -2]],
  Jugoslawien: [[1992, -5], [2005, -4]],
  Tschechoslowakei: [[1993, -3]],
  Ungarn: [[1990, -3], [2005, -4]],
  Rumaenien: [[1985, 2], [1995, -1], [2005, -3]],
  Schottland: [[1995, -2], [2005, -3]],
  Tuerkei: [[2000, 2]],
  Griechenland: [[2005, 1]],
};

/**
 * Staatenteilungen (angelehnt an die echte Geschichte). Vereine aus `cities` wechseln in
 * das neue Land; Vereine aus `dropCities` spielen danach in Ligen, die nicht simuliert
 * werden (sie verschwinden still aus Europa). Das Restland kann umbenannt werden.
 */
export interface CountrySplit {
  year: number;
  from: string;
  renameRest?: string;
  restOrigin?: string;
  restBaseDelta?: number;
  restCities?: string[];
  dropCities: string[];
  parts: CountrySeed[];
}

export const COUNTRY_SPLITS: CountrySplit[] = [
  {
    year: 1992, from: 'Sowjetunion', renameRest: 'Russland', restBaseDelta: -2,
    restCities: ['Samara', 'Wolgograd', 'Jaroslawl', 'Nischni Nowgorod', 'Krasnodar', 'Kasan', 'Perm', 'Wladikawkas', 'Tomsk', 'Saratow'],
    dropCities: ['Minsk', 'Jerewan', 'Baku', 'Taschkent', 'Alma-Ata', 'Wilna', 'Riga', 'Kischinjow', 'Tiflis'],
    parts: [{ name: 'Ukraine', origin: 'rus', base: 60, tier1: 16, tier2: 16, cities: ['Kiew', 'Odessa', 'Charkow', 'Donezk', 'Dnipro', 'Lwiw', 'Saporischschja', 'Poltawa', 'Luhansk', 'Mykolajiw', 'Krywyj Rih', 'Tscherkassy', 'Sumy', 'Winnyzja'] }],
  },
  {
    year: 1992, from: 'Jugoslawien', renameRest: 'Serbien', restOrigin: 'srb', restBaseDelta: -3,
    restCities: ['Čačak', 'Smederevo', 'Zrenjanin', 'Pančevo', 'Kruševac'],
    dropCities: ['Sarajevo', 'Mostar', 'Tuzla', 'Banja Luka', 'Zenica', 'Skopje', 'Ljubljana', 'Maribor'],
    parts: [{ name: 'Kroatien', origin: 'cro', base: 59, tier1: 16, tier2: 12, cities: ['Split', 'Zagreb', 'Rijeka', 'Osijek', 'Pula', 'Varaždin', 'Zadar', 'Šibenik', 'Karlovac', 'Vinkovci', 'Slaven-Koprivnica', 'Dubrovnik'] }],
  },
  {
    year: 1993, from: 'Tschechoslowakei', renameRest: 'Tschechien', restBaseDelta: -1,
    restCities: ['Ostrava', 'Jablonec', 'Zlín', 'Příbram', 'Budweis'],
    dropCities: [],
    parts: [{ name: 'Slowakei', origin: 'cze', base: 55, tier1: 12, tier2: 12, cities: ['Bratislava', 'Košice', 'Nitra', 'Trnava', 'Žilina', 'Trenčín', 'Banská Bystrica', 'Prešov', 'Dunajská Streda', 'Ružomberok', 'Senica', 'Michalovce'] }],
  },
];

/**
 * Historische Regeln für die Teilnahme am Europapokal (bis 2026/27 angelehnt an die echte
 * Geschichte): englische Vereine waren 1985/86–1989/90 ausgeschlossen.
 */
export const EURO_EXCLUSIONS: { country: string; from: number; to: number }[] = [
  { country: 'England', from: 1985, to: 1989 },
];

// =============================================================================
// PRIVATLEBEN – Stammdaten (Wunsch Pascal #47). Preise in 1975-Basis (× economyScale),
// alle Namen neutral (keine Marken, keine echten Personen).
// -----------------------------------------------------------------------------
// Vorbild EA Fußball Manager (Privatleben: Partner, Familie, Hobbys, Autos, Immobilien,
// Vermögen/Aktien; Golf bringt Kontakte; Sohn kann in der Jugend auftauchen). Dort ohne
// spürbare Wirkung („Sahnehäubchen“) – hier bewusst mit Folgen: Energie und
// Weiterbildung wirken auf Training/Gespräche, Kontakte auf Vorstand/Sponsoren,
// Kinder werden Spieler oder übernehmen den Verein (Generationen).
// Recherche: docs/recherche/privatleben.md
// Geld privat NOMINAL (wie Vereinskonten, DM-Werte, Anzeige fmtDM): Preise unten in
// DM von 1975 × Verbraucherpreise `cpi(year)` – nicht × economyScale, denn Häuser und
// Brötchen werden nicht so schnell teurer wie Fußballergehälter.
// =============================================================================

/** Verbraucherpreise relativ zu 1975 (grob, Deutschland, in DM gerechnet). */
const CPI: [number, number][] = [[1975, 1], [1980, 1.25], [1985, 1.47], [1990, 1.55], [1995, 1.82], [2000, 1.95], [2005, 2.1], [2010, 2.25], [2015, 2.37], [2020, 2.48], [2022, 2.8], [2024, 2.95]];
export function cpi(year: number): number {
  if (year <= CPI[0][0]) return 1;
  for (let i = 1; i < CPI.length; i++) {
    const [y1, v1] = CPI[i];
    if (year <= y1) { const [y0, v0] = CPI[i - 1]; return v0 + (v1 - v0) * (year - y0) / (y1 - y0); }
  }
  const [yl, vl] = CPI[CPI.length - 1];
  return vl * Math.pow(1.02, year - yl);
}
/** Immobilienpreise: wie die Verbraucherpreise, dazu der Boom 2010–2022. */
export const housing = (year: number) => cpi(year) * (year >= 2010 ? 1 + (Math.min(year, 2022) - 2010) * 0.045 : 1);

export type Sex = 'm' | 'w';

// -----------------------------------------------------------------------------
// Vornamen je Jahrzehnt (häufige Namen im deutschsprachigen Raum, gemischt)
// -----------------------------------------------------------------------------
const M: [number, string[]][] = [
  [1920, ['Heinz', 'Günter', 'Werner', 'Gerhard', 'Horst', 'Helmut', 'Walter', 'Karl', 'Kurt', 'Herbert', 'Willi', 'Erich']],
  [1940, ['Peter', 'Klaus', 'Hans', 'Jürgen', 'Dieter', 'Manfred', 'Wolfgang', 'Bernd', 'Rolf', 'Gerd', 'Uwe', 'Rainer']],
  [1955, ['Michael', 'Thomas', 'Andreas', 'Frank', 'Ralf', 'Stefan', 'Jörg', 'Matthias', 'Martin', 'Uwe', 'Bernd', 'Holger']],
  [1965, ['Christian', 'Markus', 'Torsten', 'Sven', 'Oliver', 'Dirk', 'Carsten', 'Thorsten', 'Jens', 'Marco', 'Stefan', 'Michael']],
  [1975, ['Daniel', 'Sebastian', 'Tobias', 'Florian', 'Alexander', 'Dennis', 'Patrick', 'Marcel', 'Benjamin', 'Jan', 'Philipp', 'Christoph']],
  [1985, ['Lukas', 'Jan', 'Tim', 'Kevin', 'Niklas', 'Felix', 'Maximilian', 'Jonas', 'Marvin', 'Fabian', 'Pascal', 'Dominik']],
  [1995, ['Leon', 'Luca', 'Finn', 'Jonas', 'Paul', 'Lukas', 'Tim', 'Niklas', 'Moritz', 'Elias', 'Jannik', 'Max']],
  [2005, ['Ben', 'Noah', 'Elias', 'Paul', 'Leon', 'Finn', 'Emil', 'Henry', 'Luis', 'Felix', 'Anton', 'Theo']],
  [2015, ['Matteo', 'Noah', 'Emil', 'Theo', 'Leo', 'Finn', 'Henry', 'Paul', 'Mats', 'Ben', 'Elias', 'Jakob']],
];
const W: [number, string[]][] = [
  [1920, ['Ursula', 'Ilse', 'Gisela', 'Gertrud', 'Hildegard', 'Inge', 'Ruth', 'Erika', 'Helga', 'Liselotte', 'Elfriede', 'Irmgard']],
  [1940, ['Karin', 'Renate', 'Monika', 'Brigitte', 'Helga', 'Ingrid', 'Barbara', 'Christa', 'Marianne', 'Elke', 'Heike', 'Petra']],
  [1955, ['Sabine', 'Susanne', 'Petra', 'Andrea', 'Claudia', 'Birgit', 'Martina', 'Gabriele', 'Kerstin', 'Angelika', 'Ute', 'Heike']],
  [1965, ['Stefanie', 'Nicole', 'Anja', 'Katrin', 'Sandra', 'Silke', 'Tanja', 'Bianca', 'Daniela', 'Melanie', 'Christina', 'Simone']],
  [1975, ['Julia', 'Katharina', 'Sarah', 'Christina', 'Anna', 'Melanie', 'Nadine', 'Jennifer', 'Jessica', 'Stephanie', 'Miriam', 'Vanessa']],
  [1985, ['Laura', 'Lisa', 'Julia', 'Lena', 'Sarah', 'Anna', 'Vanessa', 'Jana', 'Carina', 'Franziska', 'Johanna', 'Kathrin']],
  [1995, ['Lea', 'Hannah', 'Lena', 'Anna', 'Sophie', 'Laura', 'Marie', 'Lara', 'Michelle', 'Jana', 'Celina', 'Leonie']],
  [2005, ['Mia', 'Emma', 'Hannah', 'Lea', 'Sophia', 'Emilia', 'Lina', 'Marie', 'Lena', 'Mila', 'Clara', 'Ella']],
  [2015, ['Emilia', 'Mia', 'Ella', 'Lina', 'Clara', 'Ida', 'Lea', 'Mila', 'Frieda', 'Leni', 'Mathilda', 'Luisa']],
];
export const LAST_NAMES = ['Albers', 'Brandt', 'Claasen', 'Decker', 'Ebert', 'Falk', 'Gerlach', 'Hagen', 'Imhoff', 'Jäger', 'Kessler', 'Lorenz', 'Matthes', 'Nolte', 'Ostermann', 'Petersen', 'Quast', 'Reuter', 'Sander', 'Thiele', 'Ulrich', 'Voigt', 'Wendt', 'Ziegler', 'Brinkmann', 'Hesse', 'Kramer', 'Lindner', 'Martens', 'Rieger'];

export function firstNamesFor(sex: Sex, birthYear: number): string[] {
  const t = sex === 'm' ? M : W;
  let pool = t[0][1];
  for (const [y, names] of t) if (birthYear >= y) pool = names;
  return pool;
}

// -----------------------------------------------------------------------------
// Wohnen (Stufe 0 = Miete). Bezeichnung je Epoche, Kaufpreis, Monatskosten, Status.
// -----------------------------------------------------------------------------
export interface HomeDef { lvl: number; label: string; text: string; price: number; monthly: number; status: number; family: number }
export const HOMES: HomeDef[] = [
  { lvl: 0, label: 'Mietwohnung', text: 'Drei Zimmer, Küche, Bad – reicht für den Anfang.', price: 0, monthly: 700, status: 0, family: 0 },
  { lvl: 1, label: 'Eigentumswohnung', text: 'Vier Zimmer mit Balkon, zentral gelegen.', price: 180000, monthly: 350, status: 6, family: 4 },
  { lvl: 2, label: 'Reihenhaus', text: 'Kleiner Garten, Platz für Kinder.', price: 320000, monthly: 450, status: 10, family: 10 },
  { lvl: 3, label: 'Einfamilienhaus', text: 'Freistehend am Stadtrand, mit Garage.', price: 520000, monthly: 650, status: 16, family: 14 },
  { lvl: 4, label: 'Villa', text: 'Großes Grundstück, Pool, viel Ruhe.', price: 1100000, monthly: 1400, status: 26, family: 16 },
  { lvl: 5, label: 'Landsitz', text: 'Altes Gut mit Park – hier wohnt eine Dynastie.', price: 2400000, monthly: 3000, status: 36, family: 18 },
];

// -----------------------------------------------------------------------------
// Auto (Klassen, Bezeichnung neutral; Name je Epoche leicht anders)
// -----------------------------------------------------------------------------
export interface CarDef { lvl: number; label: string; price: number; monthly: number; status: number }
export function carsFor(year: number): CarDef[] {
  return [
    { lvl: 0, label: 'Kein Auto (Bus und Bahn)', price: 0, monthly: 40, status: 0 },
    { lvl: 1, label: year < 1990 ? 'Kleinwagen' : 'Kompaktwagen', price: 9000, monthly: 120, status: 2 },
    { lvl: 2, label: year < 1985 ? 'Mittelklasse-Limousine' : year < 2005 ? 'Kombi der Mittelklasse' : 'SUV der Mittelklasse', price: 18000, monthly: 200, status: 5 },
    { lvl: 3, label: year < 2015 ? 'Oberklasse-Limousine' : 'Elektro-Oberklasse', price: 38000, monthly: 340, status: 9 },
    { lvl: 4, label: 'Sportwagen', price: 70000, monthly: 520, status: 14 },
  ];
}

// -----------------------------------------------------------------------------
// Hobbys (Freizeit). energy/mood je Einheit, net = Kontaktchance, health = Gesundheit.
// -----------------------------------------------------------------------------
export interface HobbyDef { id: string; label: string; from: number; monthly: number; energy: number; mood: number; net: number; health: number; text: string }
export const HOBBIES: HobbyDef[] = [
  { id: 'laufen', label: 'Laufen', from: 1975, monthly: 0, energy: 5, mood: 2, net: 0, health: 3, text: 'Kopf frei, Kondition gut. Kostet nichts.' },
  { id: 'tennis', label: 'Tennis', from: 1975, monthly: 60, energy: 4, mood: 3, net: 1, health: 2, text: 'Im Club triffst du Geschäftsleute aus der Stadt.' },
  { id: 'golf', label: 'Golf', from: 1975, monthly: 220, energy: 4, mood: 3, net: 3, health: 1, text: 'Teuer, langsam – aber auf dem Platz werden Sponsoren gemacht.' },
  { id: 'segeln', label: 'Segeln', from: 1975, monthly: 300, energy: 6, mood: 4, net: 2, health: 1, text: 'Wochenenden auf dem Wasser, fern vom Telefon.' },
  { id: 'angeln', label: 'Angeln', from: 1975, monthly: 20, energy: 7, mood: 2, net: 0, health: 0, text: 'Stille. Mehr Erholung gibt es kaum.' },
  { id: 'kochen', label: 'Kochen', from: 1975, monthly: 50, energy: 3, mood: 4, net: 1, health: 0, text: 'Gäste zu Hause – Familie und Freunde freuen sich.' },
  { id: 'schach', label: 'Schach', from: 1975, monthly: 10, energy: 3, mood: 2, net: 0, health: 0, text: 'Schärft den Blick fürs Spiel.' },
  { id: 'musik', label: 'Musik', from: 1975, monthly: 40, energy: 4, mood: 4, net: 0, health: 0, text: 'Gitarre im Keller. Hilft gegen Ärger nach Niederlagen.' },
  { id: 'fitness', label: 'Fitnessstudio', from: 1982, monthly: 40, energy: 4, mood: 2, net: 0, health: 3, text: 'Neu in Mode: Geräte, Spiegel, Musik.' },
  { id: 'rad', label: 'Rennrad', from: 1985, monthly: 30, energy: 5, mood: 2, net: 1, health: 3, text: 'Lange Runden am Sonntagmorgen.' },
];
export const hobbiesFor = (year: number) => HOBBIES.filter((h) => year >= h.from);

// -----------------------------------------------------------------------------
// Weiterbildung (Managerfähigkeiten 0–20) und ihre Wirkung im Spiel
// -----------------------------------------------------------------------------
export type SkillKey = 'taktik' | 'menschen' | 'medien' | 'wirtschaft';
export const SKILLS: { k: SkillKey; label: string; text: string }[] = [
  { k: 'taktik', label: 'Trainingslehre', text: 'Bis +4 % Lernwirkung im Training.' },
  { k: 'menschen', label: 'Menschenführung', text: 'Bessere Aussichten in Spielergesprächen.' },
  { k: 'medien', label: 'Medien', text: 'Ansehen steigt schneller, Skandale schaden weniger.' },
  { k: 'wirtschaft', label: 'Wirtschaft', text: 'Bessere Rendite privat, mehr aus Sponsorenkontakten.' },
];

// -----------------------------------------------------------------------------
// Wochenplan: Freizeit-Einheiten (Prioritäten 0–5)
// -----------------------------------------------------------------------------
export type PlanKey = 'erholung' | 'partner' | 'familie' | 'hobby' | 'netzwerk' | 'bildung';
export const PLAN_DEF: { k: PlanKey; label: string; text: string }[] = [
  { k: 'erholung', label: 'Erholung', text: 'Schlafen, abschalten. Energie zurück.' },
  { k: 'partner', label: 'Partner', text: 'Gemeinsame Abende. Ohne Partner: Leute kennenlernen.' },
  { k: 'familie', label: 'Familie', text: 'Zeit mit den Kindern – sie prägt, was aus ihnen wird.' },
  { k: 'hobby', label: 'Hobby', text: 'Dein Hobby. Energie, Laune, je nach Hobby auch Kontakte.' },
  { k: 'netzwerk', label: 'Kontakte', text: 'Empfänge, Stammtisch, Geschäftsessen. Vorstand und Sponsoren.' },
  { k: 'bildung', label: 'Weiterbildung', text: 'Lehrgänge und Bücher – baut deine Fähigkeiten aus.' },
];

/** Freizeit-Einheiten je Woche: wenig in englischen Wochen, viel in Sommer- und Winterpause. */
export const FREE_UNITS = { base: 6, perMatch: -1, offSeason: 4 };

// -----------------------------------------------------------------------------
// Geldanlage: Sparbuchzins und Aktienfonds-Rendite je Jahr (gerundet, neutraler Index)
// -----------------------------------------------------------------------------
export function savingsRate(year: number): number {
  if (year < 1982) return 0.045; if (year < 1992) return 0.035; if (year < 2002) return 0.03;
  if (year < 2009) return 0.025; if (year < 2015) return 0.01; if (year < 2022) return 0.002; return 0.025;
}
/** Grobe Jahresrendite eines breiten Aktienfonds (Verlauf der großen Indizes, gerundet). */
const STOCK: Record<number, number> = {
  1975: 0.35, 1976: -0.05, 1977: 0.05, 1978: 0.04, 1979: -0.13, 1980: 0.02, 1981: 0.01, 1982: 0.13, 1983: 0.39, 1984: 0.06, 1985: 0.66, 1986: 0.05,
  1987: -0.32, 1988: 0.33, 1989: 0.35, 1990: -0.22, 1991: 0.13, 1992: -0.02, 1993: 0.47, 1994: -0.07, 1995: 0.07, 1996: 0.28, 1997: 0.47, 1998: 0.18,
  1999: 0.39, 2000: -0.08, 2001: -0.20, 2002: -0.44, 2003: 0.37, 2004: 0.07, 2005: 0.27, 2006: 0.22, 2007: 0.22, 2008: -0.40, 2009: 0.24, 2010: 0.16,
  2011: -0.15, 2012: 0.29, 2013: 0.25, 2014: 0.03, 2015: 0.10, 2016: 0.07, 2017: 0.13, 2018: -0.18, 2019: 0.25, 2020: 0.04, 2021: 0.16, 2022: -0.12, 2023: 0.20, 2024: 0.19,
};
export const stockYear = (year: number) => STOCK[year] ?? 0.06;

// -----------------------------------------------------------------------------
// Familie
// -----------------------------------------------------------------------------
/** Kosten je Kind und Monat (1975-Basis). */
export const CHILD_MONTHLY = 250;
/** Lebenshaltung je Erwachsenem und Monat (1975-Basis, ohne Wohnen/Auto). */
export const LIVING_MONTHLY = 600;
/** Hochzeit (1975-Basis). */
export const WEDDING_COST = 15000;
/** Ab diesem Alter darf ein Kind den Verein übernehmen. */
export const HEIR_MIN_AGE = 18;
/** Ab diesem Alter denkt der Vorstand über deinen Ruhestand nach. */
export const RETIRE_HINT_AGE = 68;
/** Spätestens dann gibt der Manager ab. */
export const RETIRE_FORCE_AGE = 78;

// -----------------------------------------------------------------------------
// Junger Manager: Hintergrundgeschichten (Spielstart)
// -----------------------------------------------------------------------------
export interface StoryDef {
  id: string;
  title: string;
  teaser: string;
  /** Platzhalter {club}, {city}, {name}, {year}. */
  text: string;
  /** Start: Ansehen ±, Privatvermögen (1975-Basis), Energie, Fähigkeiten, Kontakte. */
  rep: number; money: number; energy: number; skills: Partial<Record<SkillKey, number>>; net: number;
  /** Ein Elternteil lebt und hilft (Startbonus Kontakte, später Erbe). */
  parent?: 'vater' | 'mutter';
}
export const STORIES: StoryDef[] = [
  {
    id: 'erbe', title: 'Das Erbe', teaser: 'Dein Vater führte den Verein 20 Jahre. Nach seinem plötzlichen Tod will der Vorstand einen Namen, den die Leute kennen.',
    text: 'Im Frühjahr {year} stirbt dein Vater – zwei Jahrzehnte war er das Gesicht von {club}. Bei der Beerdigung nimmt dich der Präsident zur Seite: Die Fans wollen einen aus der Familie, die Sponsoren auch. Du bist {age}, hast gerade die Trainerlizenz-Lehrgänge begonnen und keine Ahnung, ob du das kannst. Du sagst trotzdem ja.\n\nSein Erbe hilft: alte Kontakte, ein wenig Geld – und jeder vergleicht dich mit ihm.',
    rep: 4, money: 60000, energy: 70, skills: { medien: 3 }, net: 30, parent: 'mutter',
  },
  {
    id: 'knie', title: 'Das Knie', teaser: 'Mit 19 warst du das größte Talent der Stadt. Dann riss das Kreuzband – zweimal. Vom Krankenbett aus hast du angefangen, Spiele zu analysieren.',
    text: 'Mit 17 Profivertrag, mit 19 das zweite gerissene Kreuzband – Sportinvalide. Während der Reha hast du jedes Spiel von {club} auf Video zerlegt und dem Trainer Zettel geschrieben. Als der im Sommer {year} hinwirft, holt der Vorstand den Jungen mit den Zetteln.\n\nDie Spieler kennen dich noch aus der Jugend. Ob sie dir folgen, entscheidet der Platz.',
    rep: 0, money: 15000, energy: 80, skills: { taktik: 4, menschen: 2 }, net: 10,
  },
  {
    id: 'wunderkind', title: 'Das Wunderkind', teaser: 'Jüngster Absolvent der Trainerschule, Bestnote. Die Zeitungen nennen dich „den Professor“ – und warten auf deinen ersten Fehler.',
    text: 'Mit {age} der jüngste Absolvent der Trainerschule, Abschlussarbeit über Raumdeckung. {club} gibt dir die Chance, weil du billig bist und die Presse dich liebt. Im Verein halten dich viele für einen Theoretiker, der nie im Matsch gestanden hat.\n\nDu hast Wissen – Erfahrung musst du dir holen.',
    rep: -2, money: 8000, energy: 85, skills: { taktik: 6, medien: 2 }, net: 5,
  },
  {
    id: 'notnagel', title: 'Der Notnagel', teaser: 'Du warst Jugendtrainer. Trainer weg, Co-Trainer weg, Geld weg – bis eine Lösung gefunden ist, sollst du das machen. Nur übergangsweise.',
    text: 'Eigentlich trainierst du die A-Jugend von {club}. Dann geht im Sommer {year} alles schief: Der Trainer wechselt, der Co-Trainer folgt ihm, die Kasse ist leer. „Bis wir jemanden haben“, sagt der Präsident. Das ist jetzt deine Chance.\n\nDie Jugendspieler kennst du alle. Den Rest musst du überzeugen.',
    rep: -4, money: 4000, energy: 75, skills: { menschen: 4 }, net: 15,
  },
];
export const storyById = (id?: string) => STORIES.find((s) => s.id === id);

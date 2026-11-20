// =============================================================================
// JUGENDCAMPS IM AUSLAND (Wunsch Pascal): mögliche Standorte, Stufen, Kosten.
// -----------------------------------------------------------------------------
// Historischer Rahmen (vereinfacht): Ab den 1990ern bauten europäische Vereine
// Partnerschaften und eigene Fußballschulen in Westafrika und Südamerika auf,
// später in Nordamerika und Asien. Ab der Saison 2001/02 schützt die FIFA
// Minderjährige (Reglement Status und Transfer, Art. 19): internationale
// Wechsel erst ab 18 – Ausnahmen u. a. innerhalb von EU/EWR ab 16. Vorher
// wechselten Talente oft schon mit 16. Im Spiel: Talente aus dem Camp dürfen
// erst ab `joinAge` in deine Jugend, bis dahin spielen sie beim Partnerverein.
// KOSTEN (grobe Schätzung nach Berichten über Akademien europäischer Vereine in
// Afrika/Südamerika um 2005): Partnerschule ≈ 0,25 Mio. € Aufbau / 0,12 Mio. €
// Betrieb im Jahr, eigenes Camp ≈ 0,9 / 0,4 Mio. €, Akademie ≈ 2,5 / 1,0 Mio. €.
// Umgerechnet in 1975-DM (Kaufkraft): € × 1,95583 ÷ 2,17 (Verbraucherpreise
// 2005); gebucht × Verbraucherpreise des Jahres × Kostenfaktor des Landes.
// =============================================================================

export interface CampSite {
  /** Herkunft in data/origins.ts (Name, Nationalität, Gesicht) */
  id: string;
  name: string;
  continent: 'Afrika' | 'Südamerika' | 'Nordamerika' | 'Asien' | 'Europa';
  /** Lage [Breite, Länge] für die Karte */
  geo: [number, number];
  /** ab diesem Jahr möglich */
  from: number;
  /** Jahr des EU-/EWR-Beitritts (Ausnahme der FIFA-Regel ab 16) */
  eu?: number;
  /** Kostenfaktor (Löhne, Bau, Reisen) */
  cost: number;
  /** Talent-Bonus in Sternen auf das Potenzial */
  talent: number;
  note: string;
}

export const CAMP_SITES: CampSite[] = [
  { id: 'bra', name: 'Brasilien', continent: 'Südamerika', geo: [-23.5, -46.6], from: 1990, cost: 0.85, talent: 0.3, note: 'Riesige Auswahl, starke Konkurrenz heimischer Vereine.' },
  { id: 'arg', name: 'Argentinien', continent: 'Südamerika', geo: [-34.6, -58.4], from: 1993, cost: 0.85, talent: 0.25, note: 'Technisch stark, früh profireif.' },
  { id: 'gha', name: 'Ghana', continent: 'Afrika', geo: [5.6, -0.2], from: 1995, cost: 0.7, talent: 0.15, note: 'Günstig, viele athletische Talente.' },
  { id: 'nga', name: 'Nigeria', continent: 'Afrika', geo: [6.5, 3.4], from: 1998, cost: 0.75, talent: 0.15, note: 'Großes Land, viele Straßenfußballer.' },
  { id: 'cmr', name: 'Kamerun', continent: 'Afrika', geo: [4.05, 9.7], from: 1998, cost: 0.7, talent: 0.1, note: 'Kräftige Spieler, viele Verbindungen nach Frankreich.' },
  { id: 'mar', name: 'Marokko', continent: 'Afrika', geo: [33.6, -7.6], from: 2002, cost: 0.8, talent: 0.05, note: 'Kurze Wege nach Europa, technisch gute Spieler.' },
  { id: 'tur', name: 'Türkei', continent: 'Europa', geo: [41.0, 29.0], from: 1990, cost: 0.9, talent: 0.05, note: 'Leidenschaftliche Fußballkultur, viele Familien in Deutschland.' },
  { id: 'pol', name: 'Polen', continent: 'Europa', geo: [52.2, 21.0], from: 1991, eu: 2004, cost: 0.8, talent: 0.05, note: 'Nah und günstig; ab 2004 in der EU (Wechsel ab 16).' },
  { id: 'cro', name: 'Kroatien', continent: 'Europa', geo: [45.8, 16.0], from: 1993, eu: 2013, cost: 0.85, talent: 0.15, note: 'Kleines Land, große Ausbildungstradition; ab 2013 in der EU.' },
  { id: 'srb', name: 'Serbien', continent: 'Europa', geo: [44.8, 20.5], from: 2002, cost: 0.8, talent: 0.15, note: 'Viele Talente, die früh ins Ausland gehen.' },
  { id: 'usa', name: 'USA', continent: 'Nordamerika', geo: [34.0, -118.2], from: 1996, cost: 1.3, talent: 0, note: 'Teuer, aber gut organisiert; Hochschulfußball als Konkurrenz.' },
  { id: 'jpn', name: 'Japan', continent: 'Asien', geo: [35.7, 139.7], from: 1995, cost: 1.4, talent: 0.05, note: 'Diszipliniert und technisch sauber, sehr teuer.' },
  { id: 'kor', name: 'Südkorea', continent: 'Asien', geo: [37.6, 127.0], from: 2002, cost: 1.2, talent: 0.05, note: 'Laufstark; Wehrdienst bremst manche Karriere.' },
];

export const CAMP_SITE_BY_ID: Record<string, CampSite> = Object.fromEntries(CAMP_SITES.map((s) => [s.id, s]));

export interface CampLevelDef {
  level: 1 | 2 | 3;
  name: string;
  /** frühestes Jahr der Stufe (zusätzlich zum Standort) */
  from: number;
  /** Aufbau in 1975-DM (Kaufkraft) */
  build: number;
  /** Betrieb je Monat in 1975-DM */
  monthly: number;
  /** Bauzeit in Tagen */
  days: number;
  /** Talente je Jahrgang */
  talents: number;
  /** Potenzial-Bonus in Sternen */
  potBias: number;
  desc: string;
}

export const CAMP_LEVELS: CampLevelDef[] = [
  { level: 1, name: 'Partnerschule', from: 1990, build: 225000, monthly: 9000, days: 120, talents: 1, potBias: 0,
    desc: 'Kooperation mit einer örtlichen Fußballschule: Trainer vor Ort, ein Sichtungsturnier im Jahr.' },
  { level: 2, name: 'Eigenes Camp', from: 1995, build: 811000, monthly: 30000, days: 240, talents: 2, potBias: 0.25,
    desc: 'Eigener Platz, Internat und Schule, Trainer aus dem Verein.' },
  { level: 3, name: 'Akademie', from: 2000, build: 2250000, monthly: 75000, days: 365, talents: 3, potBias: 0.5,
    desc: 'Akademie nach dem Vorbild des Nachwuchszentrums daheim, mit eigener Liga-Mannschaft.' },
];

/** Höchstzahl eigener Camps. */
export const MAX_CAMPS = 3;
/** Ab der Saison 2001/02 gilt der FIFA-Minderjährigenschutz. */
export const FIFA_MINOR_RULE = 2001;

/** Ab welchem Alter darf ein Talent aus dem Camp in die eigene Jugend? */
export function joinAge(site: CampSite, date: string): number {
  const y = Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) >= 7 ? 0 : -1); // Saisonjahr
  if (y < FIFA_MINOR_RULE) return 16;
  if (site.eu != null && y >= site.eu) return 16;
  return 18;
}

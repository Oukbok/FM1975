// =============================================================================
// JUGENDWETTBEWERBE — erzeugte Ortsvereine für die Staffeln der C- bis F-Jugend
// -----------------------------------------------------------------------------
// Name, Farbe und Stärke ergeben sich deterministisch aus der kurzen ID
// `x_yl.<Region><Ebene><n>` (z. B. `x_yl.wk4`: West, Kreis/Bezirk, Nr. 4) – im Spielstand
// steht nur die ID (Speicher klein). Namen: übliche Vereinskürzel + regional typische
// Ortsnamen; auf Kreis-/Bezirksebene auch Stadtteilvereine der Stadt des eigenen Vereins
// (`setLocalCity`, gesetzt beim Aufsetzen der Saison und beim Laden).
// =============================================================================
import type { YcRegion } from '../../data/youthCompetitions';

export const LOCAL_PREFIX = 'x_yl.';
export const isLocalClub = (id: string) => id.startsWith(LOCAL_PREFIX);

function h32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rnd(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(a: T[], r: () => number): T => a[Math.floor(r() * a.length)];

const KURZ = ['SV', 'SV', 'TSV', 'TSV', 'FC', 'SC', 'TuS', 'VfB', 'VfL', 'SpVgg', 'DJK', 'FV', 'SG', 'TSG', 'SSV', 'ESV', 'ASV', 'TuRa', 'BSV', 'SpVg'];
const BEINAME = ['Germania', 'Eintracht', 'Borussia', 'Viktoria', 'Fortuna', 'Concordia', 'Blau-Weiß', 'Rot-Weiß', 'Grün-Weiß', 'Union', 'Alemannia', 'Teutonia', 'Olympia', 'Sportfreunde', 'Phönix', 'Adler'];
const ORT: Record<YcRegion, [string[], string[]]> = {
  nord: [['Holt', 'Wester', 'Oster', 'Elm', 'Moor', 'Bar', 'Rot', 'Linden', 'Hasel', 'Buch', 'Ell', 'Wil', 'Asch', 'Brok', 'Heid', 'Sted'], ['stedt', 'büttel', 'dorf', 'horn', 'feld', 'burg', 'hude', 'loh', 'wede', 'rade', 'sen', 'fleth']],
  nordost: [['Grün', 'Wend', 'Lieb', 'Schön', 'Ros', 'Burg', 'Alt', 'Neu', 'Wald', 'Lind', 'Sand', 'Kirch', 'Mark', 'Lau', 'Treb', 'Dob'], ['ow', 'itz', 'au', 'witz', 'walde', 'hagen', 'berg', 'dorf', 'see', 'stedt', 'nitz', 'ritz']],
  west: [['Bruch', 'Holt', 'Kamp', 'Heide', 'Velb', 'Esch', 'Broich', 'Lüt', 'Rade', 'Sölde', 'Wer', 'Hül', 'Kettw', 'Dahl', 'Nie', 'Oster'], ['hausen', 'beck', 'horst', 'rath', 'scheid', 'kirchen', 'hagen', 'dorf', 'feld', 'berg', 'ich', 'ern']],
  suedwest: [['Ober', 'Nieder', 'Kirch', 'Wald', 'Bach', 'Hoch', 'Lind', 'Eich', 'Alt', 'Neu', 'Wein', 'Mühl', 'Rod', 'Hett', 'Frei', 'Wolf'], ['bach', 'heim', 'weiler', 'ingen', 'hausen', 'stein', 'born', 'scheid', 'dorf', 'feld']],
  sued: [['Ober', 'Unter', 'Kirch', 'Wald', 'Bach', 'Hoch', 'Lind', 'Eich', 'Alt', 'Neu', 'Mühl', 'Berg', 'Pfaff', 'Holz', 'Sulz', 'Gmünd'], ['hausen', 'heim', 'ach', 'ing', 'hofen', 'dorf', 'stetten', 'weiler', 'bronn', 'feld', 'kirchen', 'ried']],
};
const VIERTEL = ['Nord', 'Süd', 'Ost', 'West', 'Mitte', 'Altstadt', 'Neustadt', 'Hafen', 'Heide', 'Feld'];
const FARBEN = ['#2F5DA8', '#B3282D', '#1E7A46', '#E3B505', '#222222', '#6B2C91', '#D35F12', '#4A90C2', '#7A1F2B', '#2E8B8B'];

const R_CODE: Record<YcRegion, string> = { nord: 'n', nordost: 'o', west: 'w', suedwest: 'x', sued: 's' };
const R_OF: Record<string, YcRegion> = { n: 'nord', o: 'nordost', w: 'west', x: 'suedwest', s: 'sued' };

let localCity = '';
/** Stadt des eigenen Vereins für Stadtteilvereine (Anzeige). */
export function setLocalCity(city: string): void { if (city !== localCity) { localCity = city; cache.clear(); } }

/** `kreis` = Kreis-/Bezirksebene (auch Stadtteilvereine), sonst Landes-/Regionalebene. */
export function localClubId(region: YcRegion, kreis: boolean, i: number): string {
  return `${LOCAL_PREFIX}${R_CODE[region] ?? 'w'}${kreis ? 'k' : 'l'}${i}`;
}

const cache = new Map<string, string>();
export function localClubName(id: string): string {
  const hit = cache.get(id);
  if (hit) return hit;
  const code = id.slice(LOCAL_PREFIX.length);
  const region = R_OF[code[0]] ?? 'west';
  const city = code[1] === 'k' ? localCity : '';
  const r = rnd(h32(id));
  const [stems, ends] = ORT[region];
  const kurz = pick(KURZ, r);
  const bein = r() < 0.3 ? `${pick(BEINAME, r)} ` : '';
  const district = r() < 0.3;
  const ort = district && city ? `${city}-${pick(VIERTEL, r)}` : `${pick(stems, r)}${pick(ends, r)}`;
  const name = `${kurz} ${bein}${ort}`;
  cache.set(id, name);
  return name;
}

export function localClubColor(id: string): string {
  return FARBEN[h32(id + '|c') % FARBEN.length];
}

/** Ausbildungsqualität eines Ortsvereins (5–30, Breitensport). */
export function localClubQuality(id: string): number {
  return 5 + (h32(id + '|q') % 26);
}

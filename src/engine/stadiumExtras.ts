// =============================================================================
// STADION-AUSSTATTUNG (eigener Verein, Wunsch Pascal): Anzeigetafel nach Art und
// Ort, Banden, Laufbahn – dazu die Fan-Tribünen (Gästeblock, Fankurve).
// -----------------------------------------------------------------------------
// • Anzeigetafel: Art je Epoche (Handtafel → Glühlampen-Tafel → Videowand →
//   LED-Wand → Videowürfel über dem Mittelkreis), an 1–2 Orten hinter den Toren
//   oder in den Ecken; der Würfel hängt unter dem Dach und braucht geschlossene
//   Dächer über beiden Geraden. Wirkt auf den Komfort (Teil „Anzeigetafel“).
// • Banden: Holz → Kunststoff → Prismenwender → LED; wirkt auf den Wert der
//   Bandenwerbung (engine/sponsorship.ts boardValue, nur eigener Verein).
// • Laufbahn: die Zuschauer sitzen weiter weg (Komfortteil „Nähe zum Feld“).
// • Fehlt `Stadium.extras` (alte Spielstände), wird sie aus den Blöcken und der
//   Epoche abgeleitet – ohne Änderung an Zuschauern oder Erlösen.
// • Fan-Tribünen (`Stadium.fans`): Gästeblock auf einer Tribüne (das Kontingent
//   kommt dann von dort, engine/seating.ts capsFor/standCaps) und die Fankurve
//   der eigenen Anhänger; günstige Stehplätze dort heben die Stimmung
//   (fanStandMood, game/environmentGame.ts). Gäste- und Heimbereich gibt es in
//   allen Ländern (DFL 10 %, England 3.000 bzw. 10 %, Uefa/Spanien 5 %); Stehen
//   ist nicht überall erlaubt (data/fanCulture.ts).
// Reine Rechenlogik – Bau über game/stadiumGame.ts (startBlockBuild mit extras).
// =============================================================================
import type { BlockId, Club, StadiumBlock, StandId } from '../types';
import { BLOCK_SIDE } from './stadiumBlocks';

export type BoardKind = 'hand' | 'elektro' | 'video' | 'led' | 'cube';
export type BoardSpot = 'north' | 'south' | 'nw' | 'ne' | 'sw' | 'se' | 'center';
export type AdsKind = 'holz' | 'druck' | 'prisma' | 'led';
export interface StadiumExtras {
  board: BoardKind | 'none';
  spots: BoardSpot[];
  ads: AdsKind;
  track: boolean;
}

export interface KindDef<K extends string> { id: K; name: string; from: number; until?: number; text: string; cost: number; value: number }

/** Anzeigetafeln je Epoche (Kosten in 1975-Basis je Ort, Wert = Komfortanteil 0…1). */
export const BOARD_KINDS: KindDef<BoardKind>[] = [
  { id: 'hand', name: 'Handanzeigetafel', from: 0, until: 1995, cost: 8000, value: 0.35, text: 'Zahlentafeln, von Hand umgesteckt – Spielstand ja, Spielzeit nein.' },
  { id: 'elektro', name: 'Elektronische Tafel', from: 1965, until: 2012, cost: 20000, value: 0.6, text: 'Glühlampen-Matrix mit Uhr, Torschützen und Laufschrift.' },
  { id: 'video', name: 'Videowand', from: 1994, cost: 250000, value: 0.8, text: 'Großbildleinwand mit Wiederholungen und Stadionprogramm.' },
  { id: 'led', name: 'LED-Videowand', from: 2004, cost: 320000, value: 0.9, text: 'Helle LED-Wand, auch bei Sonne gut lesbar, Werbung zwischen den Szenen.' },
  { id: 'cube', name: 'Videowürfel', from: 2005, cost: 900000, value: 1, text: 'Vier Bildschirme über dem Mittelkreis unter dem Dach – jeder Platz sieht ein Bild.' },
];
/** Banden je Epoche (Kosten in 1975-Basis für das ganze Feld, Wert = Faktor der Bandenwerbung). */
export const ADS_KINDS: KindDef<AdsKind>[] = [
  { id: 'holz', name: 'Holzbanden', from: 0, until: 2005, cost: 6000, value: 0.95, text: 'Von Hand bemalte Holztafeln, ein Motiv für die ganze Saison.' },
  { id: 'druck', name: 'Kunststoffbanden', from: 1978, cost: 30000, value: 1, text: 'Bedruckte Kunststoff- und Planenbanden, schnell gewechselt.' },
  { id: 'prisma', name: 'Prismenwender', from: 1990, until: 2015, cost: 90000, value: 1.08, text: 'Drehende Prismen zeigen drei Motive im Wechsel.' },
  { id: 'led', name: 'LED-Banden', from: 2006, cost: 300000, value: 1.2, text: 'Leuchtbanden mit wechselnden Motiven im Minutentakt – mehr Werbezeit je Spiel.' },
];
export const TRACK_ADD_COST = 80000;
export const TRACK_REMOVE_COST = 60000;

export const SPOT_NAME: Record<BoardSpot, string> = {
  north: 'Hinter dem Tor Nord', south: 'Hinter dem Tor Süd', nw: 'Ecke Nordwest', ne: 'Ecke Nordost', sw: 'Ecke Südwest', se: 'Ecke Südost', center: 'Über dem Mittelkreis',
};
/** Block, auf dem eine Tafel steht (Zeichnung). */
export const SPOT_BLOCK: Record<Exclude<BoardSpot, 'center'>, BlockId> = {
  north: 'north_e', south: 'south_w', nw: 'curve_nw', ne: 'curve_ne', sw: 'curve_sw', se: 'curve_se',
};
const BLOCK_SPOT: Partial<Record<BlockId, BoardSpot>> = {
  north_e: 'north', north_w: 'north', south_w: 'south', south_e: 'south', curve_nw: 'nw', curve_ne: 'ne', curve_sw: 'sw', curve_se: 'se',
};
export const MAX_SPOTS = 2;

const inEra = (k: { from: number; until?: number }, year: number) => year >= k.from && (k.until == null || year <= k.until);
export const boardKindsFor = (year: number, keep?: string) => BOARD_KINDS.filter((k) => inEra(k, year) || k.id === keep);
export const adsKindsFor = (year: number, keep?: string) => ADS_KINDS.filter((k) => inEra(k, year) || k.id === keep);
export const boardDef = (id: BoardKind) => BOARD_KINDS.find((k) => k.id === id)!;
export const adsDef = (id: AdsKind) => ADS_KINDS.find((k) => k.id === id)!;

/** Banden der Epoche (Standard für alte Spielstände und KI-Vereine). */
export function adsOfEra(year: number): AdsKind { return year < 1988 ? 'holz' : year < 1995 ? 'druck' : year < 2010 ? 'prisma' : 'led'; }
/** Tafel der Epoche, wenn ein Block eine Anzeigetafel hat. */
function boardOfEra(year: number): BoardKind { return year >= 2008 ? 'led' : year >= 1994 ? 'video' : year >= 1972 ? 'elektro' : 'hand'; }

function hashId(s: string): number { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }

/** Ausstattung eines Stadions (abgeleitet, wenn noch nicht gespeichert). */
export function extrasOf(club: Club, year: number): StadiumExtras {
  const st = club.stadium;
  if (st.extras) return st.extras;
  const spots = [...new Set((st.blocks ?? []).filter((b) => b.scoreboard).map((b) => BLOCK_SPOT[b.id]).filter((s): s is BoardSpot => !!s))].slice(0, MAX_SPOTS);
  return {
    board: spots.length ? boardOfEra(year) : 'none', spots, ads: adsOfEra(year),
    track: (st.built ?? 1970) < 1980 && hashId(club.id) % 4 === 0,
  };
}
/** Gespeicherte Ausstattung anlegen (idempotent). */
export function ensureExtras(club: Club, year: number): StadiumExtras {
  if (!club.stadium.extras) club.stadium.extras = extrasOf(club, year);
  return club.stadium.extras;
}

/** Würfel möglich? Geschlossenes Dach über beiden Geraden. */
export function cubeAllowed(blocks: StadiumBlock[]): boolean {
  const straight = blocks.filter((b) => BLOCK_SIDE[b.id] === 'main' || BLOCK_SIDE[b.id] === 'opposite');
  return straight.length > 0 && straight.every((b) => b.roof === 'full');
}

/** Komfortanteil der Anzeigetafel (0…1). */
export function boardComfort(x: StadiumExtras): number {
  if (x.board === 'none' || !x.spots.length) return 0;
  const v = boardDef(x.board).value;
  return x.board === 'cube' ? v : v * (x.spots.length >= 2 ? 1 : 0.75);
}
/** Komfortanteil „Nähe zum Feld“ (0…1). */
export const sightComfort = (x: StadiumExtras): number => (x.track ? 0.4 : 1);

export interface ExtrasPlan { costBase: number; months: number; mood: number; notes: string[]; errors: string[]; changed: boolean }
/** Umbau der Ausstattung: Kosten (1975-Basis), Bauzeit, Stimmung, Prüfung. */
export function planExtras(cur: StadiumExtras, target: StadiumExtras, year: number, blocks: StadiumBlock[]): ExtrasPlan {
  const errors: string[] = [], notes: string[] = [];
  let cost = 0, months = 0, mood = 0;
  const boardChanged = cur.board !== target.board || JSON.stringify([...cur.spots].sort()) !== JSON.stringify([...target.spots].sort());
  if (boardChanged && target.board !== 'none') {
    const def = boardDef(target.board);
    if (!inEra(def, year) && cur.board !== target.board) errors.push(`${def.name} gibt es ${year < def.from ? 'erst ab ' + def.from : 'nicht mehr'}.`);
    if (target.board === 'cube') {
      if (!cubeAllowed(blocks)) errors.push('Der Videowürfel hängt unter dem Dach – beide Geraden brauchen ein volles Dach.');
      if (target.spots.length !== 1 || target.spots[0] !== 'center') errors.push('Der Videowürfel hängt über dem Mittelkreis.');
    } else {
      if (target.spots.includes('center')) errors.push('Über dem Mittelkreis hängt nur ein Videowürfel.');
      if (!target.spots.length) errors.push('Wähle mindestens einen Ort für die Anzeigetafel.');
      if (target.spots.length > MAX_SPOTS) errors.push(`Höchstens ${MAX_SPOTS} Anzeigetafeln.`);
    }
    const fresh = target.spots.filter((s) => cur.board !== target.board || !cur.spots.includes(s)).length;
    cost += def.cost * Math.max(1, fresh);
    months = Math.max(months, target.board === 'cube' ? 5 : def.cost >= 200000 ? 3 : 1);
    if (boardComfort(target) > boardComfort(cur)) mood += 0.5;
  }
  if (cur.ads !== target.ads) {
    const def = adsDef(target.ads);
    if (!inEra(def, year)) errors.push(`${def.name} gibt es ${year < def.from ? 'erst ab ' + def.from : 'nicht mehr'}.`);
    cost += def.cost;
    months = Math.max(months, 1);
  }
  if (cur.track !== target.track) {
    cost += target.track ? TRACK_ADD_COST : TRACK_REMOVE_COST;
    months = Math.max(months, 4);
    mood += target.track ? -2 : 2;
    notes.push(target.track ? 'Eine Laufbahn rückt die Zuschauer vom Spielfeld weg – die Fans mögen das nicht.' : 'Ohne Laufbahn sitzen die Fans näher am Spielfeld – die Stimmung profitiert.');
  }
  const changed = boardChanged || cur.ads !== target.ads || cur.track !== target.track;
  return { costBase: Math.round(cost / 1000) * 1000, months, mood, notes, errors, changed };
}

// -----------------------------------------------------------------------------
// Fan-Tribünen
// -----------------------------------------------------------------------------
export interface FanStands {
  away?: StandId;
  /** Fankurve: eine Tribüne (ältere Stände). */
  home?: StandId;
  /** Fankurve über mehrere Tribünen (Wunsch Pascal: z. B. Hintertor + Ecke). */
  homes?: StandId[];
}
export const fansOf = (club: Club): FanStands => club.stadium.fans ?? {};
/** Tribünen der Fankurve (neu: `homes`, alt: `home`). */
export const homeStands = (f: FanStands | undefined): StandId[] => f?.homes ?? (f?.home ? [f.home] : []);

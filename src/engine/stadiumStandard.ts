// =============================================================================
// STADION-STANDARD (eigener Verein, Wunsch Pascal): Baujahr, Bauweise, Komfort
// -----------------------------------------------------------------------------
// • Bauweise („Look“) je Block: vier Generationen nach dem Jahr, in dessen Stil
//   gebaut wurde. Beim Umbau wählst du: wie der Bestand oder im aktuellen Look.
//   Rein optisch – ein Block im neuen Look passt nur nicht mehr zum Rest.
// • Baujahr der Bausubstanz (`Stadium.built`): setzt die Komfort-Obergrenze
//   (Stand der Technik des Baujahrs) und die Zahl möglicher Logen. Sie steigt
//   über die Jahrzehnte – auch nach 2030 – und ändert sich nur durch einen
//   kompletten Neubau.
// • Komfort = Obergrenze × Ausstattung (Sitzarten, Dach, Zustand, Anzeigetafel,
//   Verpflegung und Anreise). Die Fans erwarten jedes Jahr mehr
//   (`fanExpectation`); der Abstand verschiebt die Nachfrage um −15 … +8 %.
// Reine Rechenlogik – Spielablauf in game/stadiumGame.ts.
// =============================================================================
import type { BlockId, Club, RoofType, SeatType, Stadium, StadiumBlock, StadiumTier } from '../types';
import {
  BLOCK_IDS, BLOCK_SIDE, LOUNGE_COST, MAX_LOUNGES, VIP_COST, blockCapacity, blocksCapacity, growToCapacity, loungesAvailable, roofShare,
  scoreboardAllowed, seatAvailable, tierCapacity, videoWall, vipAvailable,
} from './stadiumBlocks';
import { clubTier } from './economy';
import { boardComfort, extrasOf, sightComfort } from './stadiumExtras';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ----------------------------------------------------------------------------- Bauweise
export interface StadiumLook { id: number; from: number; name: string; text: string }
export const LOOKS: StadiumLook[] = [
  { id: 0, from: 0, name: 'Betonschüssel', text: 'Sichtbeton, Stahlrohrdach auf Stützen, Flutlichtmasten' },
  { id: 1, from: 1988, name: 'Stahl & Farbe', text: 'Kragdach an Pylonen, Kunststoffsitze in Vereinsfarben' },
  { id: 2, from: 2003, name: 'Arena', text: 'Glasfassade, helles Dach mit Lichtband, Flutlicht im Dach' },
  { id: 3, from: 2022, name: 'Moderne Arena', text: 'Lamellenfassade, Membrandach mit Solarfeldern, LED-Band' },
];
/** Bauweise (0–3) eines Jahres. */
export function lookOf(year: number): number {
  let id = 0;
  for (const l of LOOKS) if (year >= l.from) id = l.id;
  return id;
}
/** Bauweise eines Blocks (fehlt `look`: Baujahr des Stadions). */
export const blockLook = (b: StadiumBlock, st: Pick<Stadium, 'built'>): number => lookOf(b.look ?? st.built ?? 1960);
/** Vorherrschende Bauweise des Stadions (nach Plätzen). */
export function stadiumLook(st: Pick<Stadium, 'built' | 'blocks'>): number {
  const w = [0, 0, 0, 0];
  for (const b of st.blocks ?? []) w[blockLook(b, st)] += blockCapacity(b);
  const top = Math.max(...w);
  return top > 0 ? w.indexOf(top) : lookOf(st.built ?? 1960);
}
/** Ein Jahr, das für die vorherrschende Bauweise steht (für `StadiumBlock.look`). */
export const lookYear = (look: number, st: Pick<Stadium, 'built'>): number => (lookOf(st.built ?? 1960) === look ? st.built ?? 1960 : Math.max(1950, LOOKS[look].from));

// ----------------------------------------------------------------------------- Komfort
/** Komfort-Obergrenze eines Baujahrs (Stand der Technik): 1930 = 28, 1975 = 56, 2030 = 90, danach +0,4 je Jahr. */
export function standardCap(built: number): number {
  const y = Math.max(1930, built);
  return Math.round((y <= 2030 ? 28 + (y - 1930) * 0.62 : 90 + (y - 2030) * 0.4) * 10) / 10;
}
/** Anspruch der Fans im Jahr `year`: der Stand der Technik von vor 14 Jahren, zu drei Vierteln; unterklassig weniger. */
export function fanExpectation(year: number, tier = 1): number {
  return Math.round((standardCap(year - 14) * 0.76 - (tier >= 100 ? 4 : Math.max(0, tier - 1) * 5)) * 10) / 10;
}
const SEAT_SCORE: Record<SeatType, number> = { steh: 0.25, bank: 0.5, schale: 0.8, komfort: 1, business: 1 };

export interface ComfortPart { key: 'seats' | 'roof' | 'amen' | 'board' | 'cond' | 'sight'; name: string; value: number; max: number; /** Teil des Umfelds (nicht des Stadions selbst). */ outside?: boolean }
export interface StadiumComfort {
  built: number;
  cap: number;
  comfort: number;
  expect: number;
  /** Ausstattung 0…1. */
  equip: number;
  parts: ComfortPart[];
  /** Nachfragefaktor (0,85 … 1,08). */
  factor: number;
  /** Aufteilung (Wunsch Pascal): Punkte aus dem Stadion selbst und aus dem Umfeld (Verpflegung & Anreise). */
  inside: number; outside: number;
  /** Höchstwerte beider Teile bei voller Ausstattung. */
  insideMax: number; outsideMax: number;
}
/** Ausstattung 0…1 aus Blöcken, Ausstattung (Anzeigetafel, Laufbahn) und Umfeld. */
function equipment(club: Club, year: number): { equip: number; parts: ComfortPart[] } {
  const blocks = club.stadium.blocks ?? [];
  let cap = 0, seat = 0;
  for (const b of blocks) for (const t of b.tiers) { const c = tierCapacity(b.id, t); cap += c; seat += c * SEAT_SCORE[t.seat]; }
  const inf = club.infrastructure as unknown as Record<string, number> | undefined;
  const gm = club.grounds?.modules as unknown as Record<string, { level?: number }> | undefined;
  const amen = clamp(((inf?.catering ?? 1) / 5) * 0.5 + ((gm?.transit?.level ?? 0) / 4) * 0.2 + ((gm?.parking?.level ?? 0) / 4) * 0.15 + ((gm?.fanZone?.level ?? 0) / 2) * 0.15, 0, 1);
  const x = extrasOf(club, year);
  const parts: ComfortPart[] = [
    { key: 'seats', name: 'Sitzqualität', value: cap ? seat / cap : 0, max: 0.33 },
    { key: 'roof', name: 'Überdachung', value: roofShare(blocks), max: 0.24 },
    { key: 'board', name: 'Anzeigetafel', value: boardComfort(x), max: 0.1 },
    { key: 'sight', name: 'Nähe zum Feld', value: sightComfort(x), max: 0.05 },
    { key: 'cond', name: 'Zustand', value: clamp((club.stadium.condition ?? 70) / 100, 0, 1), max: 0.13 },
    { key: 'amen', name: 'Verpflegung & Anreise', value: amen, max: 0.15, outside: true },
  ];
  return { equip: parts.reduce((s, p) => s + p.value * p.max, 0), parts };
}
/** Komfort des eigenen Stadions (null: Verein ohne Blöcke/Baujahr – KI-Vereine bleiben neutral). */
export function stadiumComfort(club: Club, year: number): StadiumComfort | null {
  const st = club.stadium;
  if (!st.blocks?.length || st.built == null) return null;
  const cap = standardCap(st.built);
  const { equip, parts } = equipment(club, year);
  const comfort = Math.round(cap * (0.6 + 0.4 * equip) * 10) / 10;
  const expect = fanExpectation(year, clubTier(club));
  const outShare = parts.filter((p) => p.outside).reduce((s2, p) => s2 + p.value * p.max, 0);
  const outMaxShare = parts.filter((p) => p.outside).reduce((s2, p) => s2 + p.max, 0);
  const outside = Math.round(cap * 0.4 * outShare * 10) / 10;
  return {
    built: st.built, cap, comfort, expect, equip, parts, factor: clamp(1 + (comfort - expect) * 0.006, 0.85, 1.08),
    inside: Math.round((comfort - outside) * 10) / 10, outside,
    insideMax: Math.round(cap * (1 - 0.4 * outMaxShare) * 10) / 10, outsideMax: Math.round(cap * 0.4 * outMaxShare * 10) / 10,
  };
}
/** Nachfragefaktor aus Komfort gegen Anspruch (1 ohne Baujahr). */
export const comfortDemandFactor = (club: Club, year: number): number => stadiumComfort(club, year)?.factor ?? 1;

/** Logen je Block nach Baujahr: moderne Arenen fassen mehr (ab 1998 ×1,5, ab 2015 ×2). */
export function loungeLimit(id: BlockId, built: number | undefined): number {
  const f = (built ?? 0) >= 2015 ? 2 : (built ?? 0) >= 1998 ? 1.5 : 1;
  return Math.round(MAX_LOUNGES[id] * f);
}

/** Baujahr, mit dem das Stadion die Ansprüche gerade erfüllt (Einführung in alten Spielständen). */
export function neutralBuilt(club: Club, year: number): number {
  const { equip } = equipment(club, year);
  const expect = fanExpectation(year, clubTier(club));
  for (let y = 1950; y < year; y++) if (standardCap(y) * (0.6 + 0.4 * equip) >= expect - 0.5) return y;
  return year - 1;
}
/** Baujahr eines Stadions bei Spielbeginn: größere Ausbaustufe = jünger (1951–1975), fest je Verein. */
export function initialBuilt(club: Club, year: number): number {
  let h = 0;
  for (const ch of club.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const L = clamp(club.infrastructure?.stadium ?? 1, 1, 5);
  return Math.min(year - 1, [1951, 1957, 1963, 1969, 1973][L - 1] + (h % 5) - 2 + Math.max(0, year - 1975));
}

// ----------------------------------------------------------------------------- Neubau
export interface RebuildSpec {
  capacity: number;
  /** Stehplätze: 0 keine, 1 eine Hintertor-Tribüne, 2 beide Hintertor-Tribünen und Kurven (Unterrang). */
  standing: 0 | 1 | 2;
  roof: Exclude<RoofType, 'none'>;
  lounges: number;
  vip: boolean;
}
export const REBUILD_MIN = 8000;
/** Blöcke eines neuen Stadions nach Vorgabe (Bauweise = aktuelles Jahr). */
export function rebuildBlocks(spec: RebuildSpec, year: number): StadiumBlock[] {
  const seat: SeatType = seatAvailable('schale', year) && year >= 1985 ? 'schale' : 'bank';
  const t = (s: SeatType, rows = 18): StadiumTier => ({ seat: s, rows });
  const standOn = (id: BlockId) => {
    const side = BLOCK_SIDE[id];
    if (spec.standing === 0 || side === 'main' || side === 'opposite') return false;
    if (spec.standing === 2) return true;
    return side === 'south' || id === 'curve_sw' || id === 'curve_se';
  };
  const blocks: StadiumBlock[] = BLOCK_IDS.map((id) => ({
    id, tiers: [t(standOn(id) ? 'steh' : seat)], roof: BLOCK_SIDE[id] === 'curve' && spec.roof !== 'full' ? 'none' : spec.roof,
    vip: false, lounges: 0, scoreboard: false, look: year,
  }));
  growToCapacity(blocks, clamp(spec.capacity, REBUILD_MIN, 90000), () => seat);
  const by = (id: BlockId) => blocks.find((b) => b.id === id)!;
  if (spec.vip && vipAvailable(year)) { by('main_m').vip = true; if (year >= 2000 && spec.capacity >= 40000) by('opp_m').vip = true; }
  by('north_e').scoreboard = scoreboardAllowed('north_e');
  if (videoWall(year)) by('south_w').scoreboard = true;
  if (loungesAvailable(year)) {
    let left = Math.max(0, Math.round(spec.lounges));
    for (const id of ['main_m', 'main_n', 'main_s', 'opp_m', 'opp_n', 'opp_s', 'north_w', 'north_e', 'south_w', 'south_e'] as BlockId[]) {
      const b = by(id);
      if (b.tiers.length < 2 && b.roof !== 'full') continue;
      const n = Math.min(left, loungeLimit(id, year));
      b.lounges = n; left -= n;
    }
  }
  return blocks;
}
/** Höchstzahl Logen eines Neubaus im Jahr `year`. */
export const rebuildMaxLounges = (year: number): number => (loungesAvailable(year)
  ? (['main_m', 'main_n', 'main_s', 'opp_m', 'opp_n', 'opp_s', 'north_w', 'north_e', 'south_w', 'south_e'] as BlockId[]).reduce((s, id) => s + loungeLimit(id, year), 0) : 0);

const SEAT_COST: Record<SeatType, number> = { steh: 35, bank: 65, schale: 120, komfort: 210, business: 550 };
const ROOF_COST: Record<RoofType, number> = { none: 0, partial: 22, full: 55 };
export interface RebuildPlan { blocks: StadiumBlock[]; capacity: number; costBase: number; months: number; capWhile: number; newCap: number; errors: string[] }
/** Kosten (1975-Basis), Bauzeit und Wirkung eines Neubaus. Neu bauen kostet 20 % mehr als Aufstocken (Abriss, Fundamente, Erschließung). */
export function planRebuild(club: Club, spec: RebuildSpec, year: number): RebuildPlan {
  const blocks = rebuildBlocks(spec, year);
  const capacity = blocksCapacity(blocks);
  let cost = 0;
  for (const b of blocks) {
    const c = blockCapacity(b);
    for (const tr of b.tiers) cost += tierCapacity(b.id, tr) * SEAT_COST[tr.seat] * (tr.seat === 'schale' && year < 1985 ? 1.4 : 1) * 1.3;
    cost += c * ROOF_COST[b.roof] + (b.vip ? VIP_COST : 0) + b.lounges * LOUNGE_COST + (b.scoreboard ? (videoWall(year) ? 250000 : 20000) : 0);
  }
  cost = cost * 1.2 + blocksCapacity(club.stadium.blocks ?? []) * 15;
  const errors: string[] = [];
  if (spec.capacity < REBUILD_MIN) errors.push(`Ein Neubau hat mindestens ${REBUILD_MIN.toLocaleString('de-DE')} Plätze.`);
  if (club.stadium.built != null && year - club.stadium.built < 10) errors.push('Das Stadion ist noch keine zehn Jahre alt – ein Neubau wird nicht genehmigt.');
  return {
    blocks, capacity, costBase: Math.round(cost / 10000) * 10000, months: clamp(Math.round(16 + capacity / 4000), 18, 36),
    capWhile: Math.max(1000, Math.round((blocksCapacity(club.stadium.blocks ?? []) * 0.6) / 100) * 100), newCap: standardCap(year + 2), errors,
  };
}

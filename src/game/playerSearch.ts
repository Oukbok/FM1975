// =============================================================================
// SPIELERSUCHE (Transfermarkt › „Spieler suchen“): Suchvorgaben und Filter über
// alle Spieler der Vereine mit vollem Kader. Verdeckte Werte nur über die
// Einschätzung der Scouts (Potenzial = Scout-Spanne `scoutRange`), Attribute wie
// im Spielerprofil. Epochen: Ausstiegsklausel ab 1996, Rückkaufoption ab 2005,
// ablösefrei bei Vertragsende ab Bosman (1996). Oberfläche views/transfers/search/.
// =============================================================================
import { bosmanActive } from '../engine/contractTalks';
import { familiarity, positionSuitability, sideOf } from '../engine/positions';
import { scoutRange } from '../engine/scouting';
import { POSITION_GROUPS, type AttributeKey, type Player, type Position, type PositionGroup } from '../types';
import { homeRegionOf, wishesFor } from './playerWishesGame';
import type { Game } from './state';

export type Side = 'L' | 'C' | 'R';
export interface SearchCriteria {
  name: string;
  /** '' = alle, 'GER' = Deutsche, 'foreign' = Ausländer, sonst Ländercode */
  nat: string;
  ageMin: number; ageMax: number;
  ovMin: number; ovMax: number;
  /** Potenzial in Sternen (Scout-Spanne muss den Bereich berühren) */
  potMin: number; potMax: number;
  formMin: number;
  expMin: number;
  foot: '' | 'left' | 'right' | 'both';
  heightMin: number;
  notInjured: boolean;
  /** Position 2.0 oder Gruppe ('GK' …), '' = alle */
  pos: string;
  sides: Side[];
  bestOnly: boolean;
  /** Herkunft: Heimatregion („Westfalen“ …) oder „nat:XXX“ */
  origins: string[];
  attrs: { k: AttributeKey; min: number }[];
  famPos: '' | Position; famMin: number;
  valueMin: number; valueMax: number;
  wageMin: number; wageMax: number;
  contract: '' | 'expiring' | 'long';
  transfer: '' | 'listed' | 'available';
  releaseClause: boolean;
  realistic: boolean;
  buyBack: boolean;
  /** '' = alle, 'league' = eigene Liga, 'lower' = Amateure/Unterklasse */
  area: '' | 'league' | 'lower';
}

export const MAX_ATTRS = 4;
export const NO_LIMIT = 0;

export function defaultCriteria(): SearchCriteria {
  return {
    name: '', nat: '', ageMin: 15, ageMax: 40, ovMin: 0, ovMax: 99, potMin: 0, potMax: 5, formMin: 0, expMin: 0, foot: '', heightMin: 0,
    notInjured: false, pos: '', sides: [], bestOnly: false, origins: [], attrs: [], famPos: '', famMin: 0,
    valueMin: 0, valueMax: NO_LIMIT, wageMin: 0, wageMax: NO_LIMIT, contract: '', transfer: '', releaseClause: false,
    realistic: false, buyBack: false, area: '',
  };
}

/** Welche Optionen kennt die Epoche bzw. der Spielstand? */
export function searchOptions(g: Game) {
  const year = Number(g.calendar.currentDate.slice(0, 4));
  return {
    year,
    bosman: bosmanActive(g.calendar.currentDate),
    releaseClause: year >= 1996,
    buyBack: year >= 2005 || Object.values(g.players).some((p) => p.contract.buyBack?.clubId === g.managedClubId),
  };
}

const POS_GROUP_KEYS: PositionGroup[] = ['GK', 'DEF', 'MID', 'ATT'];
const monthsLeft = (today: string, end: string) => (Date.parse(end) - Date.parse(today)) / (30.44 * 864e5);

/** Herkunfts-Schlüssel eines Spielers: Heimatregion bzw. Nationalität. */
export function originKeys(g: Game, p: Player): string[] {
  const keys = [`nat:${p.nationality || 'GER'}`];
  const r = homeRegionOf(g, p);
  if (r) keys.push(r);
  return keys;
}

/** Spieler, die durchsucht werden (alle außer dem eigenen Kader und Jugend). */
export function searchPool(g: Game): Player[] {
  return Object.values(g.players).filter((p) => p.clubId !== g.managedClubId && !p.isYouth);
}

function posMatch(p: Player, c: SearchCriteria): boolean {
  if (!c.pos) return true;
  const isGroup = (POS_GROUP_KEYS as string[]).includes(c.pos);
  const cands: Position[] = c.bestOnly ? [p.naturalPosition] : [p.naturalPosition, ...(p.secondaryPositions ?? [])];
  const ok = cands.some((pos) => (isGroup ? POSITION_GROUPS[pos] === c.pos : pos === c.pos)
    && (!c.sides.length || c.sides.includes(sideOf(pos))));
  if (ok) return true;
  // Ohne „Nur beste Position“: auch Spieler, die die Position gut beherrschen.
  if (c.bestOnly || isGroup) return false;
  return positionSuitability(p, c.pos as Position) >= p.overall - 4 && (!c.sides.length || c.sides.includes(sideOf(c.pos as Position)));
}

/** Einzelprüfung (ohne „realistisch“, das ist teurer). */
export function matches(g: Game, p: Player, c: SearchCriteria, today = g.calendar.currentDate): boolean {
  if (c.name && !p.fullName.toLowerCase().includes(c.name.trim().toLowerCase())) return false;
  if (c.nat === 'GER' && (p.nationality || 'GER') !== 'GER') return false;
  if (c.nat === 'foreign' && (p.nationality || 'GER') === 'GER') return false;
  if (c.nat && c.nat !== 'GER' && c.nat !== 'foreign' && p.nationality !== c.nat) return false;
  if (p.age < c.ageMin || p.age > c.ageMax) return false;
  if (p.overall < c.ovMin || p.overall > c.ovMax) return false;
  if (c.potMin > 0 || c.potMax < 5) {
    const [a, b] = scoutRange(p);
    if (b < c.potMin || a > c.potMax) return false;
  }
  if ((p.form ?? 50) < c.formMin) return false;
  if ((p.attributes.experience ?? 0) < c.expMin) return false;
  if (c.foot && p.preferredFoot !== c.foot && p.preferredFoot !== 'both') return false;
  if (p.height < c.heightMin) return false;
  if (c.notInjured && p.injury) return false;
  if (!posMatch(p, c)) return false;
  if (c.origins.length) {
    const keys = originKeys(g, p);
    if (!c.origins.some((o) => keys.includes(o))) return false;
  }
  for (const a of c.attrs) if ((p.attributes[a.k] ?? 0) < a.min) return false;
  if (c.famPos && Math.round(familiarity(p, c.famPos) * 100) < c.famMin) return false;
  const v = p.contract.transferValue, w = p.contract.weeklyWage;
  if (v < c.valueMin || (c.valueMax > 0 && v > c.valueMax)) return false;
  if (w < c.wageMin || (c.wageMax > 0 && w > c.wageMax)) return false;
  const ml = monthsLeft(today, p.contract.expiryDate);
  if (c.contract === 'expiring' && ml > 12) return false;
  if (c.contract === 'long' && ml <= 24) return false;
  if (c.transfer === 'listed' && !p.transferListed) return false;
  if (c.transfer === 'available' && !(p.transferListed || p.contract.satisfaction < 60)) return false;
  if (c.releaseClause && !p.contract.releaseClause) return false;
  if (c.buyBack && p.contract.buyBack?.clubId !== g.managedClubId) return false;
  if (c.area) {
    const inLeague = g.table.rows.some((r) => r.clubId === p.clubId);
    if (c.area === 'league' && !inLeague) return false;
    if (c.area === 'lower' && inLeague) return false;
  }
  return true;
}

/** Würde er grundsätzlich zu deinem Verein wechseln? (Spielerwünsche, ohne Zufall) */
export function wouldJoin(g: Game, p: Player): boolean {
  const own = g.clubs[g.managedClubId];
  if (!own) return true;
  const w = wishesFor(g, p, own);
  return !w.appeal.dealBreaker && w.appeal.score >= 45;
}

/** Suche ausführen: Treffer nach Stärke, höchstens `limit`. */
export function runSearch(g: Game, c: SearchCriteria, limit = 200): Player[] {
  const out: Player[] = [];
  const pool = searchPool(g).sort((a, b) => b.overall - a.overall);
  for (const p of pool) {
    if (!matches(g, p, c)) continue;
    if (c.realistic && !wouldJoin(g, p)) continue;
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/** Anzahl der von den Vorgaben abweichenden Felder (für „Suche aktiv“). */
export function activeCount(c: SearchCriteria): number {
  const d = defaultCriteria() as unknown as Record<string, unknown>;
  return Object.entries(c).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(d[k])).length;
}

// ---------------------------------------------------------- gespeicherte Suchen
const STORE_KEY = 'fm1975.playerSearches';
export interface SavedSearch { name: string; c: SearchCriteria }
export function loadSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? (JSON.parse(raw) as SavedSearch[]) : [];
    return Array.isArray(list) ? list.filter((x) => x && typeof x.name === 'string' && x.c).map((x) => ({ name: x.name, c: { ...defaultCriteria(), ...x.c } })) : [];
  } catch { return []; }
}
export function storeSavedSearches(list: SavedSearch[]): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 30))); } catch { /* Speicher nicht verfügbar */ }
}

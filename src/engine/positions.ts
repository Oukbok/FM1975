// =============================================================================
// FOOTBALL MANAGER 1980 — Positions-Eignung & Attribut-Gewichtungen
// =============================================================================
// Zentrale Quelle für die *positionsspezifische Stärke* eines Spielers.
//
// Jede Position (TW, LIB, IV, RV, LV, DM, ZM, RM, LM, OM, RA, LA, HS, MS) besitzt eine eigene
// Gewichtungstabelle über die Spieler-Attribute. Daraus wird die
// „Positionseignung" (0–100) berechnet — ein Spieler kann also auf mehreren
// Positionen unterschiedlich stark sein. Die Werte fließen 1:1 in die
// Match-Engine (Team-Stärke pro Mannschaftsteil) und in die Aufstellungs-UI
// (Farbcodierung grün/gelb/orange/rot) ein.
//
// WICHTIG: Diese Tabelle ist auch im Entwickler-Wiki dokumentiert
// (Kategorie „Aufstellung & Taktik"). Bei Änderungen hier bitte Wiki angleichen.
// =============================================================================

import type { Player, Position, AttributeKey } from '../types';
import { POSITION_GROUPS } from '../types';

/** Gewichtungstabelle: pro Position → Attribut → Gewicht (>0). */
export type PositionWeights = Partial<Record<AttributeKey, number>>;

/**
 * Exakte Attribut-Gewichtungen je Position.
 * Die Eignung ist der mit diesen Gewichten gebildete Mittelwert der
 * Spieler-Attribute (0–100). Absolute Summen sind egal — es zählt das
 * Verhältnis der Gewichte zueinander.
 */
const FULLBACK: PositionWeights = {
  tackling: 2.0, speed: 2.0, stamina: 2.0, marking: 1.8,
  crossing: 1.5, positioning: 1.5, workRate: 1.5, interceptions: 1.5,
  acceleration: 1.5, passing: 1.2,
};
const WINGER: PositionWeights = {
  speed: 2.4, dribbling: 2.2, crossing: 2.0, acceleration: 2.0,
  technique: 1.6, agility: 1.5, stamina: 1.4, flair: 1.4,
  firstTouch: 1.2, passing: 1.2,
};
const WIDE_MID: PositionWeights = {
  crossing: 2.2, stamina: 2.0, workRate: 1.8, speed: 1.8,
  passing: 1.6, dribbling: 1.5, acceleration: 1.4, technique: 1.3,
  teamwork: 1.2, tackling: 1.0, decisions: 1.0,
};

export const POSITION_WEIGHTS: Record<Position, PositionWeights> = {
  // Torwart
  TW: {
    reflexes: 3.0, handling: 2.5, oneOnOnes: 2.0, aerialReach: 1.5,
    positioning: 1.5, kicking: 1.0, communication: 1.0, concentration: 1.0,
    agility: 1.0, composure: 0.8,
  },
  // Libero (freier Mann hinter der Kette – Spieleröffnung + Absicherung)
  LIB: {
    positioning: 2.5, interceptions: 2.2, marking: 1.8, tackling: 1.8,
    passing: 1.8, vision: 1.6, composure: 1.5, decisions: 1.5,
    heading: 1.2, technique: 1.2, leadership: 1.0, strength: 1.0,
  },
  // Innenverteidiger (in Libero-Systemen als Vorstopper/Manndecker)
  IV: {
    marking: 2.8, tackling: 2.8, heading: 2.2, strength: 2.0,
    positioning: 2.0, interceptions: 2.0, jumping: 1.5, concentration: 1.2,
    aggression: 1.0, composure: 1.0,
  },
  // Rechter / Linker Verteidiger (gleiche Gewichte; Seite über Fuß + Vertrautheit)
  RV: FULLBACK,
  LV: FULLBACK,
  // Defensives Mittelfeld
  DM: {
    tackling: 2.2, interceptions: 2.2, positioning: 2.0, passing: 2.0,
    stamina: 1.8, workRate: 1.8, marking: 1.6, decisions: 1.5,
    vision: 1.4, strength: 1.2,
  },
  // Zentrales Mittelfeld
  ZM: {
    passing: 2.5, vision: 2.2, technique: 2.0, stamina: 1.8,
    ballControl: 1.8, decisions: 1.6, workRate: 1.5, longPassing: 1.5,
    composure: 1.3, teamwork: 1.3,
  },
  // Rechter / Linker Mittelfeldspieler: Flanken, Laufarbeit, auch nach hinten arbeiten
  RM: WIDE_MID,
  LM: WIDE_MID,
  // Offensives Mittelfeld / Spielmacher
  OM: {
    technique: 2.2, vision: 2.2, passing: 2.0, dribbling: 1.8,
    ballControl: 1.8, flair: 1.6, firstTouch: 1.5, longShots: 1.4,
    composure: 1.4, decisions: 1.3,
  },
  // Rechtsaußen / Linksaußen
  RA: WINGER,
  LA: WINGER,
  // Mittelstürmer / Zielspieler
  MS: {
    shooting: 2.8, heading: 2.0, shotPower: 1.8, composure: 1.8,
    positioning: 1.8, strength: 1.6, firstTouch: 1.6, jumping: 1.4,
    dribbling: 1.2, technique: 1.2,
  },
  // Hängende Spitze / zweiter Stürmer
  HS: {
    shooting: 2.0, dribbling: 2.0, technique: 2.0, firstTouch: 1.8,
    ballControl: 1.6, composure: 1.6, flair: 1.6, vision: 1.5,
    passing: 1.4, longShots: 1.4,
  },
};

/** Menschlich lesbare Positionsnamen (deutsch). */
export const POSITION_NAMES_DE: Record<Position, string> = {
  TW: 'Torwart',
  LIB: 'Libero',
  IV: 'Innenverteidiger',
  RV: 'Rechter Verteidiger',
  LV: 'Linker Verteidiger',
  DM: 'Defensives Mittelfeld',
  ZM: 'Zentrales Mittelfeld',
  RM: 'Rechter Mittelfeldspieler',
  LM: 'Linker Mittelfeldspieler',
  OM: 'Offensives Mittelfeld',
  RA: 'Rechtsaußen',
  LA: 'Linksaußen',
  HS: 'Hängende Spitze',
  MS: 'Mittelstürmer',
};

/**
 * Vertrautheits-Faktor aus der Positionsvertrautheit (0–100, `Player.positionSkill`):
 * 100 bzw. ≥ 95 → 1.00, 90 → 0.97, 75 → 0.89, 60 → 0.80, 50 → 0.73, 30 → 0.60, 0 → 0.30.
 * Vorberechnet als Tabelle in ganzen Schritten.
 */
const FAM_TABLE: number[] = Array.from({ length: 101 }, (_, i) => Math.min(1, 0.3 + 0.7 * Math.pow(i / 95, 0.75)));
export function famFactor(v: number): number {
  const i = Math.round(v < 0 ? 0 : v > 100 ? 100 : v);
  return FAM_TABLE[i];
}

/** Zähler, der bei jeder Änderung einer Positionsvertrautheit steigt (für Zwischenspeicher). */
let skillRev = 0;
export function bumpSkillRev(): void { skillRev++; }
export function getSkillRev(): number { return skillRev; }

/**
 * Vertrautheits-Faktor: wie gut kennt der Spieler die Position?
 * Mit `positionSkill` (alle Spieler nach der Nachrüstung) aus der Vertrautheit 0–100.
 * Ohne (Rohspieler bei der Erzeugung) die alte Faustregel:
 *  Stammposition 1.00 · Nebenposition 0.92 · selbe Gruppe 0.82 · Nachbargruppe 0.70 ·
 *  weit entfernt 0.55 · Torwart ↔ Feld 0.30.
 */
export function familiarity(player: Player, pos: Position): number {
  const v = player.positionSkill?.v[pos];
  if (v != null) return famFactor(v);
  if (player.naturalPosition === pos) return 1.0;
  if (player.secondaryPositions?.includes(pos)) return 0.92;

  const g1 = POSITION_GROUPS[player.naturalPosition];
  const g2 = POSITION_GROUPS[pos];

  // Torwart ist eine Welt für sich.
  if (g1 === 'GK' || g2 === 'GK') return 0.3;

  if (g1 === g2) return 0.82;

  // Gruppen-Reihenfolge für „Nachbarschaft": DEF < MID < ATT
  const order: Record<string, number> = { DEF: 0, MID: 1, ATT: 2 };
  const dist = Math.abs((order[g1] ?? 1) - (order[g2] ?? 1));
  return dist <= 1 ? 0.7 : 0.55;
}

/**
 * Positionseignung eines Spielers (0–100).
 * = gewichteter Attribut-Mittelwert × Vertrautheits-Faktor.
 */
// -----------------------------------------------------------------------------
// Epochen: Der Fußball verändert sich – und damit, was eine Position ausmacht.
// Die Änderungen wirken kumulativ ab dem jeweiligen Jahr (Faktor auf das Gewicht;
// fehlt das Attribut in der Grundtabelle, ist der Wert das neue Gewicht).
// -----------------------------------------------------------------------------
type EraMod = [number, Partial<Record<Position, Partial<Record<AttributeKey, number>>>>];
const ERA_MODS: EraMod[] = [
  // Rückpassregel 1992: Torhüter müssen mitspielen.
  [1992, { TW: { kicking: 1.8, communication: 1.2, composure: 1.2 }, LIB: { passing: 1.2, speed: 1.0 } }],
  // Viererkette verdrängt Libero und Manndeckung.
  [1995, { LIB: { speed: 1.2, acceleration: 1.0, marking: 0.8 }, IV: { speed: 1.0, passing: 0.8, marking: 0.85 }, RV: { crossing: 1.3, stamina: 1.2 }, LV: { crossing: 1.3, stamina: 1.2 } }],
  // Pressing-Zeit: Laufbereitschaft und Antritt überall wichtiger.
  [2005, {
    DM: { stamina: 1.2, workRate: 1.3 }, RA: { workRate: 1.0, acceleration: 1.2 }, LA: { workRate: 1.0, acceleration: 1.2 },
    RM: { workRate: 1.2, stamina: 1.1 }, LM: { workRate: 1.2, stamina: 1.1 },
    MS: { workRate: 0.8, speed: 1.0 }, RV: { stamina: 1.2 }, LV: { stamina: 1.2 },
  }],
  // Spielaufbau von hinten, Datenzeitalter.
  [2015, {
    TW: { kicking: 1.4, passing: 1.0 }, IV: { passing: 1.5, composure: 1.4 }, DM: { passing: 1.3, decisions: 1.3 },
    RV: { dribbling: 1.0 }, LV: { dribbling: 1.0 }, MS: { decisions: 1.0 },
  }],
];

let eraYear = 1975;
const weightCache = new Map<string, PositionWeights>();

/** Setzt das Spieljahr für die Positionsbewertung (täglich aus dem Spielablauf). */
export function setEraYear(year: number): void {
  if (year !== eraYear) { eraYear = year; weightCache.clear(); }
}
export function getEraYear(): number { return eraYear; }

/** Gewichte einer Position im aktuellen Spieljahr. */
export function weightsFor(pos: Position): PositionWeights {
  const key = `${pos}:${eraYear}`;
  const hit = weightCache.get(key);
  if (hit) return hit;
  const w: PositionWeights = { ...POSITION_WEIGHTS[pos] };
  for (const [from, mods] of ERA_MODS) {
    if (eraYear < from) continue;
    const m = mods[pos];
    if (!m) continue;
    for (const k of Object.keys(m) as AttributeKey[]) {
      const f = m[k]!;
      w[k] = w[k] != null ? w[k]! * f : f;
    }
  }
  weightCache.set(key, w);
  return w;
}

/**
 * Positionsstärke eines Spielers (1–99):
 *  1. gewichteter Mittelwert der für die Position wichtigen Attribute (epochenabhängig),
 *  2. Abzug für eine deutliche Schwachstelle in einem Kernwert (Gewicht ≥ 2),
 *  3. × Vertrautheit mit der Position.
 */
export function positionSuitability(player: Player, pos: Position): number {
  const rating = rawSuitability(player, pos) * familiarity(player, pos) * footFactor(player, pos);
  return Math.max(1, Math.min(99, Math.round(rating)));
}

/** Positionsstärke allein aus den Attributen (ohne Vertrautheit, ungerundet). */
export function rawSuitability(player: Player, pos: Position): number {
  const weights = weightsFor(pos);
  let sum = 0;
  let wsum = 0;
  let weakest = 99;
  for (const key in weights) {
    const w = weights[key as AttributeKey]!;
    const v = player.attributes[key as AttributeKey] ?? 50;
    sum += w * v;
    wsum += w;
    if (w >= 2 && v < weakest) weakest = v;
  }
  const base = wsum > 0 ? sum / wsum : player.overall;
  // Eine klare Schwäche in einem Kernwert kostet (z. B. ein Vorstopper ohne Kopfball).
  const gap = base - weakest;
  const penalty = gap > 15 ? (gap - 15) * 0.12 : 0;
  return base - penalty;
}

/** Eignung für alle Positionen auf einmal (für die Kader-/Aufstellungs-UI). */
export function allSuitabilities(player: Player): Record<Position, number> {
  const out = {} as Record<Position, number>;
  (Object.keys(POSITION_WEIGHTS) as Position[]).forEach((pos) => {
    out[pos] = positionSuitability(player, pos);
  });
  return out;
}

/** Beste natürliche Position eines Spielers per Eignung (für CPU-Aufstellung). */
export function bestPosition(player: Player): { pos: Position; value: number } {
  let best: Position = player.naturalPosition;
  let bestVal = -1;
  (Object.keys(POSITION_WEIGHTS) as Position[]).forEach((pos) => {
    const v = positionSuitability(player, pos);
    if (v > bestVal) { bestVal = v; best = pos; }
  });
  return { pos: best, value: bestVal };
}

// -----------------------------------------------------------------------------
// Seiten & Rollen (Positionen 2.0) – Helfer für Match-Engine, KI und Anzeige
// -----------------------------------------------------------------------------

/** Seite einer Position: R = rechts, L = links, C = zentral (TW, LIB, IV, DM, ZM, OM, HS, MS). */
export type PitchSide = 'R' | 'L' | 'C';
/**
 * Rolle ohne Seite: TW, LIB, IV, AV (Außenverteidiger = RV/LV), DM, ZM,
 * SM (seitliches Mittelfeld = RM/LM), OM, FL (Flügel = RA/LA), HS, MS.
 */
export type PosRole = 'TW' | 'LIB' | 'IV' | 'AV' | 'DM' | 'ZM' | 'SM' | 'OM' | 'FL' | 'HS' | 'MS';

const SIDE: Record<Position, PitchSide> = {
  TW: 'C', LIB: 'C', IV: 'C', RV: 'R', LV: 'L', DM: 'C', ZM: 'C', RM: 'R', LM: 'L', OM: 'C', RA: 'R', LA: 'L', HS: 'C', MS: 'C',
};
const ROLE_OF: Record<Position, PosRole> = {
  TW: 'TW', LIB: 'LIB', IV: 'IV', RV: 'AV', LV: 'AV', DM: 'DM', ZM: 'ZM', RM: 'SM', LM: 'SM', OM: 'OM', RA: 'FL', LA: 'FL', HS: 'HS', MS: 'MS',
};
const BY_ROLE: Record<PosRole, Partial<Record<PitchSide, Position>>> = {
  TW: { C: 'TW' }, LIB: { C: 'LIB' }, IV: { C: 'IV' }, AV: { R: 'RV', L: 'LV' }, DM: { C: 'DM' }, ZM: { C: 'ZM' },
  SM: { R: 'RM', L: 'LM' }, OM: { C: 'OM' }, FL: { R: 'RA', L: 'LA' }, HS: { C: 'HS' }, MS: { C: 'MS' },
};

/** Positionsgruppe (GK/DEF/MID/ATT). */
export const positionGroup = (pos: Position) => POSITION_GROUPS[pos];
/** Seite einer Position (R/L/C). */
export const sideOf = (pos: Position): PitchSide => SIDE[pos];
/** Rolle ohne Seite (RV/LV → AV, RM/LM → SM, RA/LA → FL). */
export const roleOf = (pos: Position): PosRole => ROLE_OF[pos];
/** Position einer Rolle auf einer Seite (zentrale Rollen ignorieren die Seite). */
export function withSide(role: PosRole, side: PitchSide): Position {
  const m = BY_ROLE[role];
  return m[side] ?? m.C ?? m.R!;
}
/** Gegenstück auf der anderen Seite (zentrale Positionen bleiben). */
export function mirrorPosition(pos: Position): Position {
  const s = SIDE[pos];
  return s === 'C' ? pos : withSide(ROLE_OF[pos], s === 'R' ? 'L' : 'R');
}
/** Außenverteidiger (RV/LV). */
export const isFullBack = (pos: Position) => pos === 'RV' || pos === 'LV';
/** Außenbahn vor der Abwehr (RM/LM/RA/LA) – entspricht dem früheren Flügel „FL“. */
export const isWide = (pos: Position) => pos === 'RM' || pos === 'LM' || pos === 'RA' || pos === 'LA';
/** Flügelstürmer (RA/LA). */
export const isWinger = (pos: Position) => pos === 'RA' || pos === 'LA';

/** Seite eines Punkts auf dem hochkant gezeichneten Feld (x in %, 0 = links). */
export const sideAtX = (x: number): PitchSide => (x < 42 ? 'L' : x > 58 ? 'R' : 'C');

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Bevorzugte Seite eines Spielers: starker Fuß; beidfüßig → Hinweis (z. B. bisherige
 * Slot-Seite), sonst deterministisch aus der ID.
 */
export function sideForFoot(foot: Player['preferredFoot'] | undefined, id: string, hint?: PitchSide): 'R' | 'L' {
  if (foot === 'right') return 'R';
  if (foot === 'left') return 'L';
  if (hint === 'R' || hint === 'L') return hint;
  return hashStr(`${id}|side`) < 0.5 ? 'R' : 'L';
}

/**
 * Fuß passend zur Seite (Spielererzeugung): Ein Linksverteidiger ist meist Linksfuß.
 * Deterministisch aus der ID, verbraucht keine Zufallszahlen (Welt bleibt reproduzierbar).
 */
export function footForSide(pos: Position, foot: Player['preferredFoot'], id: string): Player['preferredFoot'] {
  const s = SIDE[pos];
  if (s === 'C' || foot === 'both') return foot;
  const u = hashStr(`${id}|foot`);
  if (s === 'L' && foot === 'right') return u < 0.7 ? 'left' : u < 0.8 ? 'both' : 'right';
  if (s === 'R' && foot === 'left') return u < 0.75 ? 'right' : u < 0.85 ? 'both' : 'left';
  return foot;
}

/**
 * Fuß-Faktor auf die Positionsstärke: Auf der Seite des schwachen Fußes verliert ein
 * Spieler etwas (Flanken, Ballmitnahme zur Linie). Beidfüßig = kein Abzug. Flügelstürmer
 * auf der „falschen“ Seite (inverse Flügel, die nach innen ziehen) werden ab den 2000ern normal.
 */
export function footFactor(player: Player, pos: Position): number {
  const s = SIDE[pos];
  const f = player.preferredFoot;
  if (s === 'C' || !f || f === 'both') return 1;
  if ((s === 'R' && f === 'right') || (s === 'L' && f === 'left')) return 1;
  if (ROLE_OF[pos] === 'FL') return eraYear >= 2005 ? 1 : eraYear >= 1995 ? 0.98 : 0.96;
  return 0.96;
}

/** Alte Kürzel (vor Positionen 2.0). */
export const LEGACY_POSITIONS = ['VS', 'AV', 'FL'] as const;

/**
 * Liest ein Positionskürzel ein – auch alte Kürzel aus Spielständen/Datensätzen:
 * VS → IV, AV → RV/LV, FL → RA/LA (Seite über Fuß, Slot-Seite oder ID). Unbekannt → null.
 */
export function normalizePosition(code: string | undefined | null, ctx?: { foot?: Player['preferredFoot']; id?: string; side?: PitchSide }): Position | null {
  if (!code) return null;
  const c = String(code).trim().toUpperCase();
  if (c in POSITION_GROUPS) return c as Position;
  if (c === 'VS') return 'IV';
  if (c === 'AV' || c === 'FL') {
    const side = ctx?.side === 'R' || ctx?.side === 'L' ? ctx.side : sideForFoot(ctx?.foot, ctx?.id ?? c);
    return withSide(c === 'AV' ? 'AV' : 'FL', side);
  }
  return null;
}

/** Farbklasse (analog zur restlichen UI) für einen Eignungswert. */
export function suitabilityColor(v: number): string {
  return v >= 75 ? 'var(--green)' : v >= 60 ? 'var(--yellow)' : v >= 45 ? 'var(--orange)' : 'var(--red)';
}

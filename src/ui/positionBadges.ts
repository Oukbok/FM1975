// =============================================================================
// Positionsetiketten (Wunsch Pascal): Farbe je Mannschaftsteil + mehrere Positionen
// =============================================================================
// Farbe: Torwart türkis, Abwehr grün (LIB/IV/RV/LV), Mittelfeld blau
// (DM/ZM/RM/LM/OM), Angriff rot (RA/LA/HS/MS) – Gruppe aus `positionGroup`.
//
// Mehrere Positionen: Ein Spieler „kann“ eine Position, wenn seine
// Positionsvertrautheit dort mindestens 80 ist (Wunsch Pascal; strenger als die
// Stufe „gut“ ab 75 bzw. `secondaryPositions`); die Stammposition zählt immer.
// Reihenfolge: stärkste Position zuerst (Positionsstärke `positionSuitability`
// = dieselbe Rechnung wie „Beste Positionen“ im Spielerprofil), bei Gleichstand
// die in den letzten 20 Spielen am häufigsten gespielte (`history.matches[].pos`,
// nur eigener Kader und erst ab dieser Version gespeichert), danach höhere
// Vertrautheit, dann die Stammposition.
// =============================================================================
import { ALL_POSITIONS, type Player, type Position } from '../types';
import { normalizePosition, positionGroup, positionSuitability } from '../engine/positions';
import { skillOf, skillTier, TIER_MIN, type SkillTier } from '../engine/positionSkill';

export type PosGroupKey = 'gk' | 'def' | 'mid' | 'att';
const GROUP_KEY = { GK: 'gk', DEF: 'def', MID: 'mid', ATT: 'att' } as const;
export const GROUP_DE: Record<PosGroupKey, string> = { gk: 'Torwart', def: 'Abwehr', mid: 'Mittelfeld', att: 'Angriff' };

/** Gruppen-Schlüssel eines Kürzels (auch alte Kürzel VS/AV/FL aus Archiven); unbekannt = null. */
export function posGroupKey(code: string | null | undefined): PosGroupKey | null {
  const pos = normalizePosition(code);
  return pos ? GROUP_KEY[positionGroup(pos)] : null;
}

/** CSS-Klasse für die Gruppenfarbe (`pg-gk` …), leer bei unbekanntem Kürzel. */
export function posGroupClass(code: string | null | undefined): string {
  const k = posGroupKey(code);
  return k ? `pg-${k}` : '';
}

/** Ab dieser Vertrautheit wird eine Position als weiteres Etikett gezeigt (Wunsch Pascal: 80). */
export const BADGE_MIN = 80;
/** So viele zurückliegende Spiele zählen beim Gleichstand. */
export const RECENT_GAMES = 20;

export interface PosEntry {
  pos: Position;
  /** Positionsstärke 1–99 (inkl. Vertrautheit und Fuß). */
  value: number;
  /** Vertrautheit 0–100 und Stufe. */
  skill: number;
  tier: SkillTier;
  /** Einsätze auf der Position in den letzten {@link RECENT_GAMES} Spielen. */
  games: number;
}

/** Einsätze je Position in den letzten n Spielen (nur Einträge mit gespeicherter Position). */
export function recentPositionCounts(p: Player, n = RECENT_GAMES): Partial<Record<Position, number>> {
  const out: Partial<Record<Position, number>> = {};
  const list = p.history?.matches;
  if (!list?.length) return out;
  for (const m of list.slice(-n)) if (m.pos) out[m.pos] = (out[m.pos] ?? 0) + 1;
  return out;
}

function entry(p: Player, pos: Position, counts: Partial<Record<Position, number>>): PosEntry {
  const skill = p.positionSkill ? skillOf(p, pos) : pos === p.naturalPosition ? 100 : TIER_MIN.good;
  return { pos, value: positionSuitability(p, pos), skill, tier: skillTier(skill), games: counts[pos] ?? 0 };
}

function byStrength(p: Player) {
  return (a: PosEntry, b: PosEntry) => b.value - a.value || b.games - a.games || b.skill - a.skill
    || (a.pos === p.naturalPosition ? -1 : b.pos === p.naturalPosition ? 1 : 0)
    || ALL_POSITIONS.indexOf(a.pos) - ALL_POSITIONS.indexOf(b.pos);
}

/**
 * Positionen, auf denen der Spieler einsetzbar ist (Vertrautheit ≥ {@link BADGE_MIN}, Stammposition immer),
 * stärkste zuerst. Ohne Vertrautheitsdaten: Stamm- + Nebenpositionen.
 */
export function playablePositions(p: Player): PosEntry[] {
  const counts = recentPositionCounts(p);
  const cand = p.positionSkill
    ? ALL_POSITIONS.filter((pos) => pos === p.naturalPosition || skillOf(p, pos) >= BADGE_MIN)
    : [...new Set([p.naturalPosition, ...(p.secondaryPositions ?? [])])].filter((x) => (ALL_POSITIONS as string[]).includes(x));
  return cand.map((pos) => entry(p, pos, counts)).sort(byStrength(p));
}

/** Positionen mit Vertrautheit 50 bis unter {@link BADGE_MIN} (für die Einblendung), stärkste zuerst. */
export function fallbackPositions(p: Player): PosEntry[] {
  if (!p.positionSkill) return [];
  const counts = recentPositionCounts(p);
  return ALL_POSITIONS
    .filter((pos) => pos !== p.naturalPosition && skillOf(p, pos) >= TIER_MIN.ok && skillOf(p, pos) < BADGE_MIN)
    .map((pos) => entry(p, pos, counts)).sort(byStrength(p));
}

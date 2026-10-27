// =============================================================================
// FOOTBALL MANAGER 1980 — Positions-Eignung & Attribut-Gewichtungen
// =============================================================================
// Zentrale Quelle für die *positionsspezifische Stärke* eines Spielers.
//
// Jede Position (TW, LIB, VS, AV, DM, ZM, OM, FL, MS, HS) besitzt eine eigene
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
  // Vorstopper / zentraler Manndecker
  VS: {
    marking: 2.8, tackling: 2.8, heading: 2.2, strength: 2.0,
    positioning: 2.0, interceptions: 2.0, jumping: 1.5, concentration: 1.2,
    aggression: 1.0, composure: 1.0,
  },
  // Außenverteidiger
  AV: {
    tackling: 2.0, speed: 2.0, stamina: 2.0, marking: 1.8,
    crossing: 1.5, positioning: 1.5, workRate: 1.5, interceptions: 1.5,
    acceleration: 1.5, passing: 1.2,
  },
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
  // Offensives Mittelfeld / Spielmacher
  OM: {
    technique: 2.2, vision: 2.2, passing: 2.0, dribbling: 1.8,
    ballControl: 1.8, flair: 1.6, firstTouch: 1.5, longShots: 1.4,
    composure: 1.4, decisions: 1.3,
  },
  // Flügelspieler
  FL: {
    speed: 2.4, dribbling: 2.2, crossing: 2.0, acceleration: 2.0,
    technique: 1.6, agility: 1.5, stamina: 1.4, flair: 1.4,
    firstTouch: 1.2, passing: 1.2,
  },
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
  VS: 'Vorstopper',
  AV: 'Außenverteidiger',
  DM: 'Defensives Mittelfeld',
  ZM: 'Zentrales Mittelfeld',
  OM: 'Offensives Mittelfeld',
  FL: 'Flügelspieler',
  MS: 'Mittelstürmer',
  HS: 'Hängende Spitze',
};

/**
 * Vertrautheits-Faktor: wie gut kennt der Spieler die Position?
 *  - Stammposition            → 1.00
 *  - Nebenposition            → 0.92
 *  - selbe Positionsgruppe    → 0.82
 *  - benachbarte Gruppe       → 0.70
 *  - weit entfernte Gruppe    → 0.55
 *  - TW-Sonderfall (falsch)   → 0.30
 */
function familiarity(player: Player, pos: Position): number {
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
export function positionSuitability(player: Player, pos: Position): number {
  const weights = POSITION_WEIGHTS[pos];
  let sum = 0;
  let wsum = 0;
  for (const key in weights) {
    const w = weights[key as AttributeKey]!;
    const v = player.attributes[key as AttributeKey] ?? 50;
    sum += w * v;
    wsum += w;
  }
  const base = wsum > 0 ? sum / wsum : player.overall;
  const rating = base * familiarity(player, pos);
  return Math.max(1, Math.min(99, Math.round(rating)));
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

/** Farbklasse (analog zur restlichen UI) für einen Eignungswert. */
export function suitabilityColor(v: number): string {
  return v >= 75 ? 'var(--green)' : v >= 60 ? 'var(--yellow)' : v >= 45 ? 'var(--orange)' : 'var(--red)';
}

// =============================================================================
// FOOTBALL MANAGER 1980 — Aufstellungs-KI (CPU + „Auto-Aufstellen")
// =============================================================================
// Wählt für einen Verein eine sinnvolle Formation, besetzt jeden Positions-Slot
// mit dem am besten geeigneten verfügbaren Spieler (per Positionseignung) und
// legt passende Standard-Schützen, Kapitän und Taktik-Werte fest.
//
// Wird für ALLE Computer-Vereine bei der Weltgenerierung genutzt und dient dem
// Manager-Verein als „Auto-Aufstellen"-Helfer in der Aufstellungs-Ansicht.
// Deterministisch (seedbar über die Vereins-ID), damit Ergebnisse reproduzierbar
// bleiben.
// =============================================================================

import type { Club, Player, Position, Tactics } from '../types';
import { FORMATIONS, getFormation, Formation, DEFAULT_FORMATION_ID } from '../data/formations';
import { positionSuitability } from './positions';

/** Kleiner deterministischer Hash → 32-Bit-Seed. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Verfügbare Spieler eines Vereins (fit, nicht gesperrt). */
function availablePlayers(club: Club, players: Record<string, Player>): Player[] {
  return club.playerIds
    .map((id) => players[id])
    .filter((p): p is Player =>
      !!p && p.availability === 'available' && !p.injury && p.suspensionMatches === 0);
}

/** Ergebnis einer Slot-Besetzung. */
export interface LineupAssignment {
  lineupMap: Record<string, string>;        // slotId → playerId
  assignedPositions: Record<string, Position>; // playerId → Position
  startingXI: string[];                      // playerIds in Slot-Reihenfolge
  substitutes: string[];
}

/**
 * Besetzt die Slots einer Formation per Greedy-Zuordnung:
 * Alle (Slot, Spieler)-Paare werden nach Eignung sortiert und der Reihe nach
 * vergeben, solange Slot und Spieler noch frei sind.
 */
export function assignToFormation(
  formation: Formation,
  pool: Player[],
): LineupAssignment {
  const pairs: { slotId: string; playerId: string; value: number }[] = [];
  for (const slot of formation.slots) {
    for (const p of pool) {
      pairs.push({ slotId: slot.id, playerId: p.id, value: positionSuitability(p, slot.position) });
    }
  }
  pairs.sort((a, b) => b.value - a.value);

  const lineupMap: Record<string, string> = {};
  const assignedPositions: Record<string, Position> = {};
  const usedSlots = new Set<string>();
  const usedPlayers = new Set<string>();
  const slotPos: Record<string, Position> = {};
  formation.slots.forEach((s) => (slotPos[s.id] = s.position));

  for (const pair of pairs) {
    if (usedSlots.has(pair.slotId) || usedPlayers.has(pair.playerId)) continue;
    lineupMap[pair.slotId] = pair.playerId;
    assignedPositions[pair.playerId] = slotPos[pair.slotId];
    usedSlots.add(pair.slotId);
    usedPlayers.add(pair.playerId);
    if (usedSlots.size >= formation.slots.length) break;
  }

  // Startelf in Slot-Reihenfolge
  const startingXI = formation.slots.map((s) => lineupMap[s.id]).filter(Boolean) as string[];
  // Ersatzbank: beste verbleibende Spieler
  const substitutes = pool
    .filter((p) => !usedPlayers.has(p.id))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 5)
    .map((p) => p.id);

  return { lineupMap, assignedPositions, startingXI, substitutes };
}

/**
 * Wählt die Formation, die am besten zum Kader passt (höchste Summe der
 * Eignungen bei optimaler Besetzung). Libero-Systeme erhalten in der 80er-Ära
 * einen kleinen Bonus, damit die CPU zeitgemäß aufstellt.
 */
export function pickBestFormation(pool: Player[]): Formation {
  let best = getFormation(DEFAULT_FORMATION_ID);
  let bestScore = -Infinity;
  for (const f of FORMATIONS) {
    const asg = assignToFormation(f, pool);
    let score = 0;
    for (const slot of f.slots) {
      const pid = asg.lineupMap[slot.id];
      if (pid) {
        const p = pool.find((x) => x.id === pid)!;
        score += positionSuitability(p, slot.position);
      }
    }
    if (f.libero) score += 12; // Ära-Bonus (mehrere Slots → moderat)
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return best;
}

/** Besten Schützen für ein Attribut aus einer Spielerliste. */
function bestBy(pool: Player[], key: 'penalties' | 'freeKicks' | 'corners' | 'leadership'): Player | undefined {
  return pool.reduce<Player | undefined>((best, p) =>
    !best || p.attributes[key] > best.attributes[key] ? p : best, undefined);
}

/**
 * Baut eine vollständige, sinnvolle Taktik für einen Verein.
 * @param existing optionale Bestandstaktik, deren Feineinstellungen (Stil,
 *   Pressing, …) erhalten bleiben sollen (für „Auto-Aufstellen").
 * @param formationId optionale feste Formation (sonst automatisch gewählt).
 */
export function buildAutoTactics(
  club: Club,
  players: Record<string, Player>,
  existing?: Tactics,
  formationId?: string,
): Tactics {
  const pool = availablePlayers(club, players);
  const rng = mulberry32(hashString(club.id));

  const formation = formationId
    ? getFormation(formationId)
    : existing?.formation
      ? getFormation(existing.formation)
      : pickBestFormation(pool);

  const asg = assignToFormation(formation, pool);
  const xiPlayers = asg.startingXI.map((id) => players[id]).filter(Boolean) as Player[];

  const penalty = bestBy(xiPlayers, 'penalties') ?? xiPlayers[0];
  const freeKick = bestBy(xiPlayers, 'freeKicks') ?? xiPlayers[0];
  const corner = bestBy(xiPlayers, 'corners') ?? xiPlayers[0];
  const captain = bestBy(xiPlayers, 'leadership') ?? xiPlayers[0];

  // Taktik-Grundwerte: aus Bestand übernehmen, sonst leicht variiert erzeugen.
  const styles: Tactics['style'][] = ['defensive', 'balanced', 'attacking', 'counter'];
  const style = existing?.style ?? styles[Math.floor(rng() * styles.length)];
  const vary = (base: number, spread: number) => Math.round(base + (rng() - 0.5) * 2 * spread);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  return {
    formation: formation.id,
    style,
    pressing: existing?.pressing ?? clamp(vary(50, 20)),
    tempo: existing?.tempo ?? clamp(vary(50, 20)),
    defensiveLine: existing?.defensiveLine ?? clamp(vary(50, 18)),
    tackleHardness: existing?.tackleHardness ?? clamp(vary(50, 18)),
    offsideTrap: existing?.offsideTrap ?? rng() < 0.35,
    widthFocus: existing?.widthFocus ?? clamp(vary(50, 22)),
    buildup: existing?.buildup ?? (rng() < 0.5 ? 'short' : 'long'),
    startingXI: asg.startingXI,
    substitutes: asg.substitutes,
    captainId: captain?.id ?? null,
    penaltyTakerId: penalty?.id ?? null,
    freeKickTakerId: freeKick?.id ?? null,
    cornerTakerId: corner?.id ?? null,
    lineupMap: asg.lineupMap,
    assignedPositions: asg.assignedPositions,
  };
}

/**
 * „Auto-Aufstellen" für den Manager-Verein: besetzt nur die Startelf/Bank neu
 * (per Eignung) und lässt die bestehenden Taktik-Feineinstellungen unangetastet.
 * Behält die aktuell gewählte Formation bei, sofern vorhanden.
 */
export function autoFillLineup(
  club: Club,
  players: Record<string, Player>,
  tactics: Tactics,
): Tactics {
  const pool = availablePlayers(club, players);
  const formation = getFormation(tactics.formation);
  const asg = assignToFormation(formation, pool);
  const xiPlayers = asg.startingXI.map((id) => players[id]).filter(Boolean) as Player[];

  return {
    ...tactics,
    formation: formation.id,
    startingXI: asg.startingXI,
    substitutes: asg.substitutes,
    lineupMap: asg.lineupMap,
    assignedPositions: asg.assignedPositions,
    captainId: tactics.captainId && asg.startingXI.includes(tactics.captainId)
      ? tactics.captainId
      : (bestBy(xiPlayers, 'leadership')?.id ?? null),
    penaltyTakerId: tactics.penaltyTakerId && asg.startingXI.includes(tactics.penaltyTakerId)
      ? tactics.penaltyTakerId : (bestBy(xiPlayers, 'penalties')?.id ?? null),
    freeKickTakerId: tactics.freeKickTakerId && asg.startingXI.includes(tactics.freeKickTakerId)
      ? tactics.freeKickTakerId : (bestBy(xiPlayers, 'freeKicks')?.id ?? null),
    cornerTakerId: tactics.cornerTakerId && asg.startingXI.includes(tactics.cornerTakerId)
      ? tactics.cornerTakerId : (bestBy(xiPlayers, 'corners')?.id ?? null),
  };
}

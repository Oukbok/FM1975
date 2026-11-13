// =============================================================================
// Positionsvertrautheit im Spielablauf: Nachrüstung, Monatsabbau, Positions-
// training der KI-Vereine und Nachricht bei neuer Stufe (eigener Verein).
// Rechnung in engine/positionSkill.ts.
// =============================================================================
import type { Player, Position } from '../types';
import { ALL_POSITIONS } from '../types';
import type { Game } from './state';
import { getFormation, liberoOut } from '../data/formations';
import { rawSuitability } from '../engine/positions';
import {
  decayPositions, ensurePositionSkill, setTrainingPosition, skillOf, skillTier, TIER_DE, TIER_MIN,
  TRAIN_CAP, trainPositionDays,
} from '../engine/positionSkill';
import { makeMessage, pushMessage } from '../engine/messages';
import { POSITION_NAMES_DE } from '../engine/positions';

const allPlayers = (g: Game): Player[] => [...Object.values(g.players), ...Object.values(g.youthPlayers ?? {})];

/** Vertrautheiten für alle Spieler nachrüsten (idempotent; beim Laden und Spielstart). */
export function migratePositionSkills(g: Game): number {
  const today = g.calendar.currentDate;
  let n = 0;
  for (const p of allPlayers(g)) if (!p.positionSkill) { ensurePositionSkill(p, today); n++; }
  return n;
}

/**
 * Monatlich (am 1.): Abbau ungenutzter Positionen für alle Spieler, Positionstraining
 * der KI-Vereine (≈ 20 Trainingstage), am 1. Juli neue Trainingsziele der KI.
 */
export function monthlyPositions(g: Game, today: string): void {
  migratePositionSkills(g);
  const own = g.managedClubId;
  for (const p of allPlayers(g)) {
    decayPositions(p, today);
    if (p.clubId !== own && p.positionSkill?.train) {
      trainPositionDays(p, 20, today);
      if (skillOf(p, p.positionSkill.train) >= TRAIN_CAP - 0.5) delete p.positionSkill.train;
    }
  }
  if (today.slice(5, 10) === '07-01') aiPositionPlans(g, today);
}

/**
 * KI: Je Verein höchstens ein junger Spieler lernt eine Position, auf der die Formation
 * zu dünn besetzt ist und für die seine Anlagen fast so gut passen wie für die Stammposition.
 */
export function aiPositionPlans(g: Game, today: string): number {
  let n = 0;
  for (const club of Object.values(g.clubs)) {
    if (club.id === g.managedClubId) continue;
    const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p);
    if (squad.some((p) => p.positionSkill?.train)) continue;
    const need = new Map<Position, number>();
    for (const s of getFormation(club.tactics?.formation).slots) need.set(s.position, (need.get(s.position) ?? 0) + 1);
    let best: { p: Player; pos: Position; score: number } | null = null;
    for (const [pos, slots] of need) {
      if (pos === 'LIB' && liberoOut(Number(today.slice(0, 4)))) continue; // kein Trainer bildet mehr Liberos aus
      const cover = squad.filter((p) => skillOf(p, pos) >= TIER_MIN.good).length;
      if (cover >= slots * 2) continue;
      for (const p of squad) {
        if (p.age > 27 || p.naturalPosition === 'TW' || pos === 'TW' || skillOf(p, pos) >= TIER_MIN.good) continue;
        const gap = rawSuitability(p, pos) - rawSuitability(p, p.naturalPosition);
        if (gap < -4) continue;
        const score = gap + (slots * 2 - cover) * 2 + skillOf(p, pos) * 0.05;
        if (!best || score > best.score) best = { p, pos, score };
      }
    }
    if (best) { setTrainingPosition(best.p, best.pos, today); n++; }
  }
  return n;
}

/**
 * Eigenes Training (täglich an Trainingstagen, aus `applyDailyTraining`): Positionstraining
 * der eigenen Spieler; erreicht ein Spieler eine neue Stufe, meldet sich der Trainerstab.
 */
export function ownPositionTraining(g: Game, today: string, quality = 1): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  for (const id of club.playerIds) {
    const p = g.players[id];
    const t = p?.positionSkill?.train;
    if (!p || !t || p.injury) continue;
    if (trainPositionDays(p, 1, today, quality)) {
      const tier = skillTier(skillOf(p, t));
      pushMessage(g.messages, makeMessage({
        date: today, category: 'training', from: 'Trainerstab',
        subject: `${p.lastName}: ${POSITION_NAMES_DE[t]} jetzt „${TIER_DE[tier]}“`,
        shortText: `${p.fullName} hat im Positionstraining die Stufe „${TIER_DE[tier]}“ als ${POSITION_NAMES_DE[t]} erreicht.`,
        bodyText: `${p.fullName} macht im Positionstraining Fortschritte: Als ${POSITION_NAMES_DE[t]} gilt er jetzt als „${TIER_DE[tier]}“. `
          + (skillOf(p, t) >= TRAIN_CAP - 0.5 ? 'Mehr bringt das Training allein nicht – den letzten Schliff holt er sich in Spielen auf dieser Position.' : 'Einsätze auf der Position beschleunigen den Lernprozess.'),
        relatedId: p.id,
      }));
    }
  }
}

/** Anzahl Positionen je Stufe (für Tests/Berichte). */
export function tierCounts(p: Player): Record<string, number> {
  const out: Record<string, number> = { natural: 0, good: 0, ok: 0, none: 0 };
  for (const pos of ALL_POSITIONS) out[skillTier(skillOf(p, pos))]++;
  return out;
}

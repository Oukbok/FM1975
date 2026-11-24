// =============================================================================
// EINGESPIELTHEIT – Spielablauf (Rechnung: engine/cohesion.ts)
// -----------------------------------------------------------------------------
// - Pflichtspiele üben für alle Vereine ein (engine/match/finish.ts `noteMatch`).
// - Eigener Verein: jede taktische Trainingseinheit des Tages rückt das Eingeübte
//   an die Vorgabe (Taktik & Positionsspiel, Spielform, Pressing, Videoanalyse;
//   der Lernfaktor des Trainerteams wirkt mit). Trainingslager mit Taktik-Punkten
//   geben bei der Rückkehr einen kräftigen Schub.
// - KI-Vereine: montags eine feste Portion (ihr Training ist nicht geplant).
// - Ältere Spielstände/neues Spiel: jeder Verein startet eingespielt auf seine Taktik.
// Feld `Club.cohesion` (optional).
// =============================================================================
import type { Club } from '../types';
import { BLOCKS_BY_ID } from '../engine/weeklyTraining';
import { SLOT_KEYS, addDaysISO, effectiveDay, locksFor, weekdayIdx } from '../engine/trainingPlan';
import { cohesionOf, initCohesion, instructionGap, practice, validCohesion, type CohesionView } from '../engine/cohesion';
import { seasonYearOf } from '../engine/match/era';
import { blockFactorFn } from './trainerTeam';
import { ownFixtures } from './trainingWeek';
import type { Game } from './state';

/** Gewicht der Trainingsbausteine fürs Einüben (1 = volle taktische Einheit). */
export const COHESION_BLOCKS: Record<string, number> = { taktik: 1, spielform: 0.8, pressing: 0.6, videoanalyse: 0.5, standards: 0.15 };

export function ensureCohesion(g: Game, club: Club, year = seasonYearOf(g.calendar.currentDate)): void {
  if (!validCohesion(club.cohesion) && club.tactics) club.cohesion = initCohesion(club.tactics, year);
}
/**
 * Spielstart und Spielstände von vor der Eingespieltheit: alle Vereine mit Kader bekommen eine
 * Eingespieltheit auf ihre aktuelle Taktik. Kennt der Spielstand sie schon (mindestens ein Verein
 * hat sie), bleibt es beim Ablauf des laufenden Spiels: neue Vereine (Aufsteiger, zweite Mannschaften,
 * Pokal-Amateure) bekommen sie am nächsten Montag bzw. der eigene Verein am nächsten Tag
 * (`cohesionDaily`) – sonst spielte ein geladener Stand anders weiter als der nie gespeicherte
 * (tests/savecompat-test.ts).
 */
export function migrateCohesion(g: Game): void {
  const clubs = Object.values(g.clubs);
  if (clubs.some((c) => validCohesion(c.cohesion))) return;
  const year = seasonYearOf(g.calendar.currentDate);
  for (const c of clubs) ensureCohesion(g, c, year);
}

/** Taktische Einheiten des eigenen Trainingstags (Summe der Gewichte × Lernfaktor des Trainerteams). */
export function ownTacticUnits(g: Game, today: string): number {
  const plan = g.trainingPlan?.days?.[weekdayIdx(today)];
  if (!plan) return 0;
  const day = effectiveDay(plan, locksFor(today, ownFixtures(g, addDaysISO(today, -1), addDaysISO(today, 1))));
  const f = blockFactorFn(g);
  let u = 0;
  for (const k of SLOT_KEYS) {
    const id = day[k];
    const b = id ? BLOCKS_BY_ID[id] : undefined;
    if (b && COHESION_BLOCKS[b.id]) u += COHESION_BLOCKS[b.id] * f(b);
  }
  return u;
}

export function cohesionDaily(g: Game, today: string): void {
  const year = seasonYearOf(today);
  const me = g.clubs[g.managedClubId];
  if (me?.tactics) {
    ensureCohesion(g, me, year);
    const u = ownTacticUnits(g, today);
    if (u > 0) practice(me.cohesion!, me.tactics, year, 0.035 * u, 0.02 * u);
  }
  if (new Date(`${today}T00:00:00Z`).getUTCDay() !== 1) return;
  for (const c of Object.values(g.clubs)) {
    if (c.id === g.managedClubId || !c.tactics) continue;
    ensureCohesion(g, c, year);
    practice(c.cohesion!, c.tactics, year, 0.07, 0.035);
  }
}

/** Trainingslager: Taktik-Punkte des Programms üben bei der Rückkehr kräftig ein. */
export function campCohesion(g: Game, club: Club, tacticPoints: number, today: string): void {
  if (!club.tactics || tacticPoints <= 0) return;
  const year = seasonYearOf(today);
  ensureCohesion(g, club, year);
  practice(club.cohesion!, club.tactics, year, Math.min(0.55, 0.06 * tacticPoints), Math.min(0.3, 0.03 * tacticPoints));
}

/** Aufgestellte Elf des Vereins (Aufstellung › Formations-Slots); leer = unbekannt. */
export const plannedXI = (club: Club): string[] | undefined => {
  const ids = Object.values(club.tactics?.lineupMap ?? {});
  return ids.length ? ids : undefined;
};

export interface CohesionInfo extends CohesionView {
  /** Anweisungen, die vom Eingeübten abweichen (größte zuerst). */
  gaps: { key: string; label: string; gap: number }[];
  /** Wirkung in Prozent auf Angriff/Kontrolle/Abwehr. */
  effectPct: number;
}
/** Anzeige für die Taktik-Seite: Eingespieltheit des eigenen Vereins für die aktuelle Vorgabe. */
export function cohesionInfo(g: Game, club: Club = g.clubs[g.managedClubId]): CohesionInfo | null {
  if (!club?.tactics) return null;
  const year = seasonYearOf(g.calendar.currentDate);
  ensureCohesion(g, club, year);
  const co = club.cohesion!;
  const v = cohesionOf(co, club.tactics, year, club.tactics.formation, plannedXI(club));
  const gaps = instructionGap(co, club.tactics, year).parts.filter((p) => p.gap >= 0.12).sort((a, b) => b.gap - a.gap);
  return { ...v, gaps, effectPct: Math.round((v.total - 80) * 0.08 * 10) / 10 };
}

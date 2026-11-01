// =============================================================================
// TRAININGSWOCHE IM SPIELABLAUF — Vorlage + echte Spiele, täglicher Einstieg
// (game/day.ts), Wirkung des Trainerteams, Verletzungen aus der Belastung.
// =============================================================================
import { Game } from './state';
import { Club, DaySlots } from '../types';
import { yearOf } from '../engine/economy';
import { applyDailyTraining, dayLoad } from '../engine/weeklyTraining';
import { recordInjury } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  DayInfo, OwnFixture, addDaysISO, dailyInjuryRisk, effectiveDay, locksFor, mondayOf, sanitizePlan, weekEffect, WeekEffect, weekdayIdx,
} from '../engine/trainingPlan';
import { blockFactorFn, trainingInjuryReduction } from './trainerTeam';
import { staffEffectsOf } from './staffGame';

/** Eigene Pflichtspiele (Liga, Pokal, Europapokal) im Zeitraum [from, to]. */
export function ownFixtures(g: Game, from: string, to: string): Map<string, OwnFixture> {
  const out = new Map<string, OwnFixture>();
  const me = g.managedClubId;
  const add = (date: string, home: string, away: string, comp: string) => {
    if (date < from || date > to || (home !== me && away !== me)) return;
    out.set(date, { date, home: home === me, oppId: home === me ? away : home, comp });
  };
  for (const m of g.fixtures) if (m.involvesPlayerClub) add(m.date, m.homeClubId, m.awayClubId, 'Liga');
  for (const r of g.cup?.rounds ?? []) for (const t of r.ties ?? []) add(t.date, t.homeClubId, t.awayClubId, 'Pokal');
  for (const cup of Object.values(g.euroCups ?? {})) {
    for (const r of cup?.rounds ?? []) for (const t of r.ties ?? []) add(t.date, t.homeClubId, t.awayClubId, 'Europapokal');
  }
  return out;
}

/** Tagesinfos der Woche ab Montag. */
export function weekInfos(g: Game, monday: string): DayInfo[] {
  const fx = ownFixtures(g, addDaysISO(monday, -1), addDaysISO(monday, 8));
  return Array.from({ length: 7 }, (_, i) => locksFor(addDaysISO(monday, i), fx));
}

export function effectiveWeek(g: Game, monday: string): { infos: DayInfo[]; days: DaySlots[] } {
  const infos = weekInfos(g, monday);
  return { infos, days: infos.map((inf, i) => effectiveDay(g.trainingPlan.days[i], inf)) };
}

/** Wochenwirkung der laufenden Woche (inkl. Trainerteam). */
export function currentWeekEffect(g: Game, monday = mondayOf(g.calendar.currentDate)): WeekEffect {
  const { infos, days } = effectiveWeek(g, monday);
  return weekEffect(days, infos, blockFactorFn(g));
}

/** Entwicklungsfaktor aus dem Trainingsumfang der laufenden Woche (für devContextFor). */
export function planDevFactor(g: Game): number {
  try { return currentWeekEffect(g).devFactor; } catch { return 1; }
}

/** Alte Spielstände: Plan bereinigen (unbekannte/zu neue Bausteine ersetzen). */
export function migrateTrainingPlan(g: Game): void {
  g.trainingPlan = sanitizePlan(g.trainingPlan, yearOf(g.calendar.currentDate));
}

/**
 * Trainingstag des eigenen Vereins (statt des reinen Wochenplans): Sperren durch
 * Spiele, Lernfaktor des Trainerteams, Verletzungsrisiko aus der Belastung.
 */
export function ownTrainingDay(g: Game, club: Club, today: string): void {
  const fx = ownFixtures(g, addDaysISO(today, -1), addDaysISO(today, 1));
  const day = effectiveDay(g.trainingPlan.days[weekdayIdx(today)], locksFor(today, fx));
  applyDailyTraining(club, g.players, day, false, blockFactorFn(g));
  if (!g.injuriesEnabled) return;
  const load = dayLoad(day);
  if (load <= 6) return;
  const red = trainingInjuryReduction(g) + staffEffectsOf(g).injuryReduction * 0.5;
  for (const id of club.playerIds) {
    const p = g.players[id];
    if (!p || p.injury) continue;
    if (Math.random() >= dailyInjuryRisk(load, p.attributes.fitness, red) * (0.6 + (p.development.injuryProneness ?? 50) / 125)) continue;
    const days = 3 + Math.floor(Math.random() * (load > 12 ? 18 : 9));
    const inj = {
      id: `inj-tp-${today}-${Math.floor(Math.random() * 1e6)}`, type: 'muscle' as const,
      severity: (days > 10 ? 'moderate' : 'minor') as 'moderate' | 'minor',
      description: days > 10 ? 'Muskelfaserriss im Training' : 'Zerrung im Training', startDate: today,
      expectedReturnDate: addDaysISO(today, days), daysRemaining: days, totalDays: days, fromTraining: true,
    };
    p.injury = inj;
    p.availability = 'injured';
    recordInjury(p, inj);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'injury', from: 'Mannschaftsarzt',
      subject: `${p.fullName} verletzt sich im Training`, shortText: `Voraussichtlich ${days} Tage.`,
      bodyText: `${p.fullName} hat sich bei einer intensiven Einheit verletzt (${inj.description}) und fällt etwa ${days} Tage aus. `
        + `Viele harte Einheiten am Stück erhöhen das Risiko – Fitness- und Athletiktrainer senken es.`,
    }));
  }
}

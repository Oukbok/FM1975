// =============================================================================
// TRAINING › LANGFRISTIG — Saisonverlauf je Woche + vorgemerkte Wochenvorlagen.
// -----------------------------------------------------------------------------
// Der Wochenplan bleibt eine einzige Vorlage (game.trainingPlan.days). Neu ist nur
// das optionale `trainingPlan.schedule` (Montag → Vorlagen-ID): Ab diesem Montag
// lädt der Trainerstab die Vorlage in den Wochenplan (wie „Vorlage laden“ von Hand).
// Fehlt das Feld (alte Spielstände), ändert sich nichts.
// Die Vorschau rechnet jede kommende Woche mit den echten Spielterminen und dem
// Plan, der dann gilt (aktueller Plan bzw. vorgemerkte Vorlage).
// =============================================================================
import { Game } from './state';
import { DaySlots } from '../types';
import { yearOf } from '../engine/economy';
import {
  EFFECT_GROUPS, OwnFixture, PLAN_TEMPLATES, WeekEffect, addDaysISO, applyTemplate, effectiveDay, mondayOf, weekEffect,
} from '../engine/trainingPlan';
import { blockFactorFn } from './trainerTeam';
import { ownFixtures, weekInfos } from './trainingWeek';
import { ownCampDays, inWinterBreak } from './winterShared';
import { campDestination } from '../data/campDestinations';


/** Vorlage für eine kommende Woche vormerken (null = Vormerkung löschen). Die laufende Woche wird sofort geladen. */
export function setWeekTemplate(g: Game, monday: string, tplId: string | null): void {
  const today = g.calendar.currentDate;
  const plan = g.trainingPlan;
  if (monday <= mondayOf(today)) {
    if (tplId) applyTemplate(plan, tplId, yearOf(today));
    return;
  }
  const s = { ...(plan.schedule ?? {}) };
  if (tplId) s[monday] = tplId; else delete s[monday];
  if (Object.keys(s).length) plan.schedule = s; else delete plan.schedule;
}

/** Fällige Vormerkungen anwenden (aus ownTrainingDay). Gibt die geladene Vorlage zurück. */
export function applyScheduledTemplate(g: Game, today: string): string | null {
  const plan = g.trainingPlan;
  const s = plan.schedule;
  if (!s) return null;
  const due = Object.keys(s).filter((k) => k <= today).sort();
  if (!due.length) return null;
  const id = s[due[due.length - 1]];
  for (const k of due) delete s[k];
  if (!Object.keys(s).length) delete plan.schedule;
  applyTemplate(plan, id, yearOf(today));
  return id;
}

/** Name der Vorlage, der der Plan genau entspricht (sonst null = eigener Plan). */
export function matchingTemplate(days: DaySlots[], year: number): string | null {
  for (const t of PLAN_TEMPLATES) {
    const tmp = { days: [] as DaySlots[] };
    applyTemplate(tmp, t.id, year);
    if (tmp.days.every((d, i) => d.slot1 === days[i]?.slot1 && d.slot2 === days[i]?.slot2 && d.extra === days[i]?.extra)) return t.id;
  }
  return null;
}

export interface SeasonWeek {
  monday: string;
  /** Laufende Woche. */
  current: boolean;
  /** Vorlage, die in dieser Woche gilt (null = eigener Plan). */
  tplId: string | null;
  /** In dieser Woche beginnt eine Vormerkung. */
  scheduled: boolean;
  matches: OwnFixture[];
  fx: WeekEffect;
  /** Trainingslager (Name), Winterpause. */
  camp: string | null;
  winter: boolean;
  /** Stärkster Bereich der Woche. */
  focus: string | null;
}

/** Saisonende: 30. Juni. */
function seasonEnd(g: Game): string {
  const y1 = parseInt(g.season.slice(0, 4), 10) + 1;
  return `${y1}-06-30`;
}

/** Wochen von der laufenden bis zum Saisonende mit Wirkung nach den echten Spielterminen. */
export function seasonWeeks(g: Game): SeasonWeek[] {
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const end = seasonEnd(g);
  const sched = g.trainingPlan.schedule ?? {};
  const factor = blockFactorFn(g);
  const camps = ownCampDays(g);
  const fixtures = ownFixtures(g, mondayOf(today), addDaysISO(end, 7));
  let days: DaySlots[] = g.trainingPlan.days.map((d) => ({ ...d }));
  let tplId = matchingTemplate(days, year);
  const out: SeasonWeek[] = [];
  for (let mon = mondayOf(today); mon <= end; mon = addDaysISO(mon, 7)) {
    const scheduled = !!sched[mon] && mon > mondayOf(today);
    if (scheduled) {
      const tmp = { days: [] as DaySlots[] };
      applyTemplate(tmp, sched[mon], year);
      days = tmp.days; tplId = sched[mon];
    }
    const infos = weekInfos(g, mon);
    const eff = infos.map((inf, i) => effectiveDay(days[i], inf));
    const fx = weekEffect(eff, infos, factor);
    const matches: OwnFixture[] = [];
    let camp: string | null = null, winter = false;
    for (let i = 0; i < 7; i++) {
      const d = addDaysISO(mon, i);
      const m = fixtures.get(d);
      if (m) matches.push(m);
      const c = camps.get(d);
      if (c && !camp) camp = campDestination(c.destId)?.name ?? 'Trainingslager';
      if (!winter && inWinterBreak(g, d)) winter = true;
    }
    let focus: string | null = null, best = 0;
    for (const gr of EFFECT_GROUPS) if (fx.groups[gr.key] > best) { best = fx.groups[gr.key]; focus = gr.label; }
    out.push({ monday: mon, current: mon === mondayOf(today), tplId, scheduled, matches, fx, camp, winter, focus });
  }
  return out;
}

export function templateName(id: string | null): string {
  return id ? PLAN_TEMPLATES.find((t) => t.id === id)?.name ?? id : 'Eigener Plan';
}

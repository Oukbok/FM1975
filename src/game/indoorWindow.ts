// =============================================================================
// WINTERPAUSE JE VEREIN – Wunsch Pascal: „Keine Hallenturniere, solange die Bundesliga
// noch läuft. Erst wenn die Winterpause begonnen hat.“
//
// Die Pause eines Vereins beginnt nach seinem LETZTEN Pflichtspiel vor der Liga-Pause
// (Liga, Landespokal inkl. Wiederholung, Europapokal) und endet vor seinem ERSTEN danach.
// Hallenturniere (game/indoorGame.ts), Trainingslager (game/trainingCampGame.ts) und
// Sponsor-Pflichtreisen nutzen dieses Fenster (game/winterShared.ts `winterWindow`).
// Abstand: frühestens zwei Tage nach dem letzten Pflichtspiel (ein freier Tag dazwischen),
// spätestens drei Tage vor dem ersten danach (zwei freie Tage) – wie bisher.
//
// Pflichtspiele zählen, solange der Verein sie nach heutigem Stand noch spielen kann
// (Pokal: noch im Wettbewerb bzw. in der gelosten Runde; Europapokal: `mayPlayOn`).
// Scheidet ein Verein aus, wird sein Fenster nur größer – einmal gültige Hallentermine
// bleiben gültig (Abgleich `reconcileIndoor` in game/indoorReconcile.ts ist idempotent).
// =============================================================================
import { INDOOR_GAP_DAYS } from '../data/matchCalendarRules';
import { CalendarEngine } from '../engine/calendar';
import { findWinterBreak } from '../engine/winterBreak';
import { inEuroCup, mayPlayOn } from './euroFixture';
import { cupPossible } from './fixtureWatch';
import type { Game } from './state';

export interface BreakWindow { from: string; to: string }

/** Ligatermine eines Vereins (eigene Liga oder simulierte Liga). */
export function leagueDatesOf(g: Game, id: string): string[] {
  const own = g.fixtures.some((m) => m.homeClubId === id || m.awayClubId === id);
  const list = own ? g.fixtures : g.leagues?.otherDivisions.find((d) => d.clubIds.includes(id))?.fixtures ?? [];
  const out: string[] = [];
  for (const m of list) if (m.homeClubId === id || m.awayClubId === id) out.push(m.date);
  return out;
}

/** Alle Pflichtspieltermine eines Vereins (Liga, Landespokal, Europapokal), nach heutigem Stand. */
export function pflichtDatesOf(g: Game, id: string): string[] {
  const out = leagueDatesOf(g, id);
  for (const ev of g.calendar.events) {
    if (ev.type === 'cup_matchday') {
      if (g.cup?.participantIds.includes(id) && cupPossible(g, ev, id)) out.push(ev.date);
    } else if (ev.type === 'euro_matchday' && ev.euroComp) {
      if (inEuroCup(g.euroCups?.[ev.euroComp], id) && mayPlayOn(g, ev, id)) out.push(ev.date);
    }
  }
  return out;
}

/**
 * Winterpause eines Vereins (null = keine Liga mit Pause, z. B. Amateure/Auslandsgäste:
 * dann gilt nur der Abstand zu seinen Pflichtspielen).
 */
export function clubBreakWindow(g: Game, id: string): BreakWindow | null {
  const y0 = parseInt(g.season.slice(0, 4), 10);
  const wb = findWinterBreak(leagueDatesOf(g, id), y0);
  if (!wb) return null;
  const mid = CalendarEngine.addDays(wb.last, Math.floor(daysDiff(wb.last, wb.first) / 2));
  let last = wb.last, first = wb.first;
  for (const d of pflichtDatesOf(g, id)) {
    if (d <= mid && d > last) last = d;
    if (d > mid && d < first) first = d;
  }
  return { from: CalendarEngine.addDays(last, INDOOR_GAP_DAYS), to: CalendarEngine.addDays(first, -(INDOOR_GAP_DAYS + 1)) };
}

function daysDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
}

/** Zwischenspeicher für viele Abfragen am selben Tag (Turnier-Aufbau, Abgleich). */
export class BreakCache {
  private win = new Map<string, BreakWindow | null>();
  private busy = new Map<string, string[]>();
  constructor(private g: Game) {}
  window(id: string): BreakWindow | null {
    if (!this.win.has(id)) this.win.set(id, clubBreakWindow(this.g, id));
    return this.win.get(id)!;
  }
  /**
   * Darf der Verein an `date` (und `days − 1` Folgetagen) in der Halle spielen?
   * Mit Liga: nur innerhalb seiner Winterpause. Ohne Liga: Abstand ≥ 2 Tage zu Pflichtspielen.
   */
  fits(id: string, date: string, days = 1): boolean {
    const w = this.window(id);
    const end = CalendarEngine.addDays(date, days - 1);
    if (w) return date >= w.from && end <= w.to;
    if (!this.busy.has(id)) this.busy.set(id, pflichtDatesOf(this.g, id));
    return this.busy.get(id)!.every((d) => daysDiff(end, d) >= INDOOR_GAP_DAYS || daysDiff(d, date) >= INDOOR_GAP_DAYS);
  }
}

/** Feiertage ohne Hallenturniere: Heiligabend, 1. Weihnachtstag, Silvester, Neujahr. */
export function indoorHoliday(d: string): boolean {
  const md = d.slice(5);
  return md === '12-24' || md === '12-25' || md === '12-31' || md === '01-01';
}

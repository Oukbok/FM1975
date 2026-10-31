// =============================================================================
// WINTER-SYSTEME – gemeinsamer Spielstand-Zugriff für Hallenfußball
// (game/indoorGame.ts) und Trainingslager (game/trainingCampGame.ts).
// Beide Felder hängen OPTIONAL am Spielstand (wie `clubRecords`) und werden über
// diese schmalen Zugriffe gelesen; Altstände ohne Felder bekommen sie per
// `migrateWinter` (Aufruf in App.tsx beim Laden) bzw. beim ersten Tag.
// =============================================================================
import type { IndoorPhase } from '../data/indoorHistory';
import type { IndoorResult, IndoorSquad, TourStat } from '../engine/indoor';
import { CalendarEngine } from '../engine/calendar';
import { Game } from './state';

// -----------------------------------------------------------------------------
// Hallenfußball
// -----------------------------------------------------------------------------
export type IndoorKind = 'invite' | 'qualifier' | 'masters' | 'regional';
export type IndoorDecision = IndoorSquad | 'decline';

export interface IndoorTournament {
  id: string;
  name: string;
  city: string;
  hall: string;
  /** Erster Turniertag (ISO, UTC). */
  date: string;
  days: 1 | 2;
  kind: IndoorKind;
  clubIds: string[];
  /** Kaderwahl je Verein. */
  squads: Record<string, IndoorSquad>;
  /** Eigener Verein eingeladen: Entscheidung (null = offen). */
  own?: IndoorDecision | null;
  result?: IndoorResult;
  strengths?: Record<string, number>;
  done: boolean;
}

export interface IndoorWinter {
  season: string;
  /** Januar-Jahr („1991“ für 1990/91). */
  winterYear: number;
  phase: IndoorPhase;
  tournaments: IndoorTournament[];
  masters?: IndoorTournament;
  /** Tour-Wertung (Qualifikation zur Endrunde). */
  tour?: TourStat[];
  /** Vereine, die ihren Endrunden-Platz nicht wahrgenommen haben. */
  mastersDeclined?: string[];
  finished?: boolean;
}

export interface IndoorHistoryEntry {
  year: number;
  phase: IndoorPhase;
  mastersWinner?: string;
  mastersRunnerUp?: string;
  mastersScore?: string;
  city?: string;
  /** Bestes Ergebnis deines Vereins in diesem Winter (Text). */
  own?: string;
  /** Turniersieger (Einladungs-/Qualifikationsturniere): Vereins-IDs. */
  winners?: string[];
}

export interface IndoorState {
  v: 1;
  current?: IndoorWinter;
  history: IndoorHistoryEntry[];
  /** Verärgerung der Veranstalter über Absagen deines Vereins (sinkt je Winter). */
  snub: number;
  /** Masters-Titel je Verein (inkl. KI). */
  titles: Record<string, number>;
  /** Turniersiege je Verein (alle Hallenturniere). */
  wins: Record<string, number>;
}

// -----------------------------------------------------------------------------
// Trainingslager
// -----------------------------------------------------------------------------
export type CampSeason = 'summer' | 'winter';

export interface CampBooking {
  id: string;
  destId: string;
  season: CampSeason;
  start: string;
  end: string;
  /** Anzahl Testspiele vor Ort. */
  tests: number;
  /** Gebuchte Kosten (nominal). */
  cost: number;
  bookedOn: string;
  /** Bereits angewandt / abgeschlossen. */
  done: boolean;
  /** Ergebnisnotiz nach Rückkehr. */
  report?: string;
}

export interface AiCampEntry { clubId: string; destId: string; season: CampSeason; start: string; end: string; applied: boolean }

export interface CampState {
  v: 1;
  bookings: CampBooking[];
  /** KI-Vereine der laufenden Saison (vereinfachte Lager). */
  ai: AiCampEntry[];
  aiSeason?: string;
  /** Verlauf deiner Lager (Saison, Ziel, Ergebnis). */
  history: { season: string; destId: string; campSeason: CampSeason; note: string }[];
}

type WinterGame = Game & { indoor?: IndoorState; camps?: CampState };

export function indoorState(g: Game): IndoorState {
  const wg = g as WinterGame;
  if (!wg.indoor) wg.indoor = { v: 1, history: [], snub: 0, titles: {}, wins: {} };
  return wg.indoor;
}

export function campState(g: Game): CampState {
  const wg = g as WinterGame;
  if (!wg.camps) wg.camps = { v: 1, bookings: [], ai: [], history: [] };
  return wg.camps;
}

/** Idempotente Nachrüstung alter Spielstände (App.tsx beim Laden). */
export function migrateWinter(g: Game): void {
  const s = indoorState(g);
  s.history ??= []; s.titles ??= {}; s.wins ??= {}; s.snub ??= 0;
  const c = campState(g);
  c.bookings ??= []; c.ai ??= []; c.history ??= [];
}

/** Alle Tage (inklusive) zwischen zwei ISO-Daten. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let d = from;
  for (let i = 0; i < 400 && d <= to; i++) { out.push(d); d = CalendarEngine.addDays(d, 1); }
  return out;
}

/** Tage, an denen dein Verein in der Halle spielt (zugesagt oder offen). */
export function ownIndoorDays(g: Game, includePending = true): Map<string, IndoorTournament> {
  const out = new Map<string, IndoorTournament>();
  const cur = indoorState(g).current;
  if (!cur) return out;
  for (const t of [...cur.tournaments, ...(cur.masters ? [cur.masters] : [])]) {
    if (t.own === undefined || t.own === 'decline') continue;
    if (t.own === null && !includePending) continue;
    for (let i = 0; i < t.days; i++) out.set(CalendarEngine.addDays(t.date, i), t);
  }
  return out;
}

/** Tage, an denen dein Verein im Trainingslager ist (gebuchte, nicht abgeschlossene). */
export function ownCampDays(g: Game): Map<string, CampBooking> {
  const out = new Map<string, CampBooking>();
  for (const b of campState(g).bookings) {
    if (b.done) continue;
    for (const d of daysBetween(b.start, b.end)) out.set(d, b);
  }
  return out;
}

/**
 * Freies Winterfenster der laufenden Saison: zwei Tage nach dem letzten Hinrunden-
 * Spieltag bis drei Tage vor dem Rückrundenstart (Liga deines Vereins).
 */
export function winterWindow(g: Game, season = g.season): { from: string; to: string } {
  const y0 = parseInt(season.slice(0, 4), 10);
  const mid = `${y0}-12-24`;
  let last = '', first = '';
  for (const m of g.fixtures) {
    if (m.date <= mid && m.date.startsWith(`${y0}-`) && m.date > last) last = m.date;
    if (m.date > mid && (!first || m.date < first)) first = m.date;
  }
  if (!last || !first || !first.startsWith(`${y0 + 1}-`)) return { from: `${y0}-12-07`, to: `${y0}-12-30` };
  return { from: CalendarEngine.addDays(last, 2), to: CalendarEngine.addDays(first, -3) };
}

/** Sommerfenster der Vorbereitung: Saisonstart bis eine Woche vor dem ersten Spieltag. */
export function summerWindow(g: Game, season = g.season): { from: string; to: string } {
  const y0 = parseInt(season.slice(0, 4), 10);
  let first = '';
  for (const m of g.fixtures) if (m.date.startsWith(`${y0}-`) && (!first || m.date < first)) first = m.date;
  const to = first ? CalendarEngine.addDays(first, -5) : `${y0}-08-08`;
  return { from: `${y0}-07-03`, to };
}

/** Tage mit Pflichtspielen (Liga deines Vereins, Pokal, Europapokal). */
export function competitiveDays(g: Game): Set<string> {
  const s = new Set<string>();
  for (const e of g.calendar.events) if (e.type === 'cup_matchday' || e.type === 'euro_matchday') s.add(e.date);
  for (const m of g.fixtures) if (m.involvesPlayerClub) s.add(m.date);
  return s;
}

// =============================================================================
// WINTER-SYSTEME – gemeinsamer Spielstand-Zugriff für Hallenfußball
// (game/indoorGame.ts) und Trainingslager (game/trainingCampGame.ts).
// Beide Felder hängen OPTIONAL am Spielstand (wie `clubRecords`) und werden über
// diese schmalen Zugriffe gelesen; Altstände ohne Felder bekommen sie per
// `migrateWinter` (Aufruf in App.tsx beim Laden) bzw. beim ersten Tag.
// =============================================================================
import { mayPlayOn } from './euroFixture';
import type { IndoorPhase } from '../data/indoorHistory';
import type { IndoorResult, IndoorSquad, TourStat } from '../engine/indoor';
import { CalendarEngine } from '../engine/calendar';
import { findWinterBreak } from '../engine/winterBreak';
import { Game } from './state';
import type { CampFocus } from '../engine/trainingCamp';
import { defaultLodging } from '../data/campLodgings';

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
  /** Unterkunft/Anlage (data/campLodgings.ts) und Trainingsschwerpunkt; alte Stände: Standard per Migration. */
  lodgingId?: string;
  focus?: CampFocus;
  /** Anzahl Testspiele vor Ort. */
  tests: number;
  /** Gebuchte Kosten (nominal). */
  cost: number;
  bookedOn: string;
  /** Bereits angewandt / abgeschlossen. */
  done: boolean;
  /** Ergebnisnotiz nach Rückkehr. */
  report?: string;
  /** Höhentraining: verzögerte Fitness-Wirkung (fällig am Datum). */
  delayed?: { due: string; fitness: number; done?: boolean };
  /** Reisegruppe (Planer): Profis bzw. eingeladene Jugendspieler. Fehlt = alle Profis (alte Stände). */
  squad?: string[];
  youth?: string[];
  /** Gemessene Wirkung nach der Rückkehr (game/campResult.ts). */
  result?: CampResult;
}

/** Wirkung eines Lagers auf einen Spieler (Vorher/Nachher, kompakt). */
export interface CampPlayerDelta {
  id: string; name: string; pos: string; age: number; youth?: boolean;
  /** Fitness-Attribut, Form, Entwicklungspunkte, Moral-Stufen (Δ). */
  fit: number; form: number; dev: number; morale: number;
  injured?: string; incident?: boolean;
  /** Nutzen-Wert für die Rangliste. */
  score: number;
}

/** Gemessene Wirkung eines Lagers (Archiv, Zusammenfassung). */
export interface CampResult {
  /** Gesamterfolg 0–100. */
  score: number;
  /** Wetterglück (1 = Mittel). */
  luck: number;
  travelers: number; youth: number; stayed: number;
  /** Mittelwerte der Reisenden vorher/nachher. */
  fit: [number, number]; form: [number, number]; frische: [number, number];
  /** Teamgeist: mittlere Moral des Kaders 0–100 vorher/nachher. */
  spirit: [number, number];
  dev: number;
  moraleUp: number; moraleDown: number; injuries: number; incidents: number; healed: number;
  /** Nominal: Kosten, Testspiel- und Marketingerlöse; Fan-Stimmung Δ. */
  cost: number; income: number; sponsor: number; fans: number;
  /** Höhentraining: Fitness nach der Rückkehr (eingetragen, sobald es greift). */
  altitude?: number; altitudeDue?: string;
  best: CampPlayerDelta[]; worst: CampPlayerDelta[];
}

export interface AiCampEntry { clubId: string; destId: string; season: CampSeason; start: string; end: string; applied: boolean; lodgingId?: string; focus?: CampFocus }

export interface CampState {
  v: 1;
  bookings: CampBooking[];
  /** KI-Vereine der laufenden Saison (vereinfachte Lager). */
  ai: AiCampEntry[];
  aiSeason?: string;
  /** Verlauf deiner Lager (Saison, Ziel, Ergebnis). */
  history: CampHistoryEntry[];
}

export interface CampHistoryEntry {
  season: string; destId: string; campSeason: CampSeason; note: string;
  /** Ab dem Planer: Buchung, Zeitraum, Unterkunft, Schwerpunkt und gemessene Wirkung. */
  bookingId?: string; start?: string; end?: string; lodgingId?: string; focus?: CampFocus; result?: CampResult;
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
  // Buchungen vor der Unterkunfts-Wahl: Standard-Unterkunft + ausgewogener Schwerpunkt (idempotent).
  for (const b of [...c.bookings, ...c.ai]) {
    if (!b.destId) continue;
    const y = parseInt(b.start.slice(0, 4), 10);
    b.lodgingId ??= defaultLodging(b.destId, y)?.id;
    b.focus ??= 'ausgewogen';
  }
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
 * Freies Winterfenster der laufenden Saison: zwei Tage nach dem letzten Spieltag vor
 * der Winterpause bis drei Tage vor dem ersten danach (Liga deines Vereins). Die Lage
 * der Pause kommt aus dem Spielplan (historisch je Saison, data/winterBreaks.ts).
 */
export function winterWindow(g: Game, season = g.season): { from: string; to: string } {
  const y0 = parseInt(season.slice(0, 4), 10);
  const wb = findWinterBreak(g.fixtures.map((m) => m.date), y0);
  if (!wb) return { from: `${y0}-12-07`, to: `${y0}-12-30` };
  return { from: CalendarEngine.addDays(wb.last, 2), to: CalendarEngine.addDays(wb.first, -3) };
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
  // Europapokal 2.0: nur Termine, an denen der eigene Verein (noch) spielen kann (game/euroFixture.ts).
  for (const e of g.calendar.events) if ((e.type === 'cup_matchday' || e.type === 'euro_matchday') && mayPlayOn(g, e)) s.add(e.date);
  for (const m of g.fixtures) if (m.involvesPlayerClub) s.add(m.date);
  return s;
}

/** Liegt `today` in der Winterpause der eigenen Liga (ab dem 4. Tag nach dem letzten Spieltag)? */
export function inWinterBreak(g: Game, today: string): boolean {
  const y0 = parseInt(g.season.slice(0, 4), 10);
  const wb = findWinterBreak(g.fixtures.map((m) => m.date), y0);
  return !!wb && today >= CalendarEngine.addDays(wb.last, 4) && today < wb.first;
}

/**
 * Fehlender Spielrhythmus in der Winterpause: Die Form aller Ligaspieler driftet
 * täglich um 0,5 % Richtung Mitte (50) – Formstarke verlieren etwas, Formschwache
 * fangen sich. 3 Wochen Pause ≈ −1,5 Formpunkte bei Form 70, 11 Wochen ≈ −6. Gilt
 * für alle Vereine (die KI hatte ohne Spiele bisher gar keine Formänderung); das
 * Training deines Vereins bringt in der Pause kein Form-Plus (game/day.ts).
 * Frische/Fitness erholen sich ohnehin täglich (engine/form.ts, engine/training.ts).
 */
export function winterBreakDaily(g: Game, today: string): void {
  if (!inWinterBreak(g, today)) return;
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am')) continue;
    for (const pid of c.playerIds) {
      const p = g.players[pid];
      if (!p || p.injury) continue;
      p.form = Math.max(0, Math.min(100, p.form + (50 - p.form) * 0.005));
    }
  }
}

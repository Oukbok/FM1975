// =============================================================================
// EINZEL-SCOUTING (Transfers › Scouting, Wunsch Pascal)
// -----------------------------------------------------------------------------
// Aus dem Spielerpool schickst du einen Scout zu einem Spieler. Ein Auftrag dauert
// je nach Entfernung und Abteilung Tage bis Wochen und kostet Reisegeld (1975-Basis,
// gebucht beim Start). Danach liegt ein Bericht vor: Die Bekanntheit steigt auf
// 0,75–0,95 (Qualität der Scouts), Stärke/Potenzial/Wert werden damit fast genau.
// Berichte veralten mit 0,12 Bekanntheit je Jahr – Spieler verändern sich.
//
// Plätze: 1 + je Scouting-Mitarbeiter (Scout, Chefscout, internationaler Scout,
// Nachwuchskoordinator), höchstens 8. Auslandsreisen: vor 1993 ohne internationalen
// Scout teuer und lang; Video-/Datenanalysten verkürzen die Dauer.
// Warteschlange (Wunsch Pascal: mehrere Spieler auf einmal scouten): Aufträge
// ohne freien Scout warten in `queue` (höchstens MAX_QUEUE) und starten täglich,
// sobald ein Platz frei ist – Reisekosten erst beim Start.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { staffEffectsOf } from './staffGame';
import { MERCH_CPI } from '../data/merchCatalog';
import type { Game } from './state';

export interface ScoutJob {
  /** Spieler-ID (voller Kader, Jugend oder Weltspieler). */
  id: string;
  name: string;
  clubName: string;
  abroad: boolean;
  youth: boolean;
  start: string;
  days: number;
  /** Reisekosten (1975-Basis). */
  cost: number;
}
export interface ScoutReport { k: number; date: string }
export type ScoutArgs = { id: string; name: string; clubName: string; abroad: boolean; youth: boolean };
export interface ScoutingState { v: 1; jobs: ScoutJob[]; reports: Record<string, ScoutReport>; /** wartende Aufträge */ queue?: ScoutArgs[] }

function cpi(year: number): number {
  const t = MERCH_CPI;
  if (year <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) if (year <= t[i][0]) { const [y0, a] = t[i - 1], [y1, b] = t[i]; return a + (b - a) * (year - y0) / (y1 - y0); }
  const [yl, last] = t[t.length - 1];
  return last * Math.pow(1.02, year - yl);
}

const SCOUT_ROLES = ['scout_1975', 'chefscout', 'intl_scout', 'nachwuchskoord'];
const MAX_REPORTS = 600;
export const MAX_QUEUE = 40;

export function scoutingOf(g: Game): ScoutingState {
  return (g.scouting ??= { v: 1, jobs: [], reports: {} });
}

/** Gleichzeitige Aufträge. */
export function scoutSlots(g: Game): number {
  const staff = g.hiredStaff ?? [];
  return Math.min(8, 1 + staff.filter((r) => SCOUT_ROLES.includes(r)).length);
}

/** Dauer (Tage) und Kosten (1975-Basis) eines Auftrags. */
export function jobTerms(g: Game, abroad: boolean, youth: boolean): { days: number; cost: number } {
  const year = yearOf(g.calendar.currentDate);
  const staff = g.hiredStaff ?? [];
  const fx = staffEffectsOf(g).scouting ?? 0;
  const intl = staff.includes('intl_scout');
  let days = abroad ? (intl ? 18 : 28) : 10;
  if (youth) days += 4;
  days -= Math.round(fx * 40);
  if (staff.includes('videoanalyst')) days -= abroad ? 4 : 2;
  if (staff.includes('datenanalyst') || staff.includes('dateningenieur')) days = Math.round(days * 0.7);
  days = Math.max(4, days);
  // Reisekosten folgen den Verbraucherpreisen, nicht dem Fußballgeld (Preisschild in 1975-Basis = ÷ economyScale).
  const travel = (abroad ? (year < 1990 ? 5000 : 3500) * (intl ? 0.75 : 1) : 1200) * cpi(year) / economyScale(year);
  return { days, cost: Math.max(50, Math.round(travel / 50) * 50) };
}

/** Bekanntheit aus einem (veraltenden) Bericht, null ohne Bericht. */
export function scoutReport(g: Game, id: string): number | null {
  const r = g.scouting?.reports[id];
  if (!r) return null;
  const years = (Date.parse(g.calendar.currentDate) - Date.parse(r.date)) / (365.25 * 864e5);
  const k = r.k - Math.max(0, years) * 0.12;
  return k > 0.05 ? k : null;
}

export function activeJob(g: Game, id: string): ScoutJob | undefined {
  return g.scouting?.jobs.find((j) => j.id === id);
}

export function queuedJob(g: Game, id: string): number {
  return (g.scouting?.queue ?? []).findIndex((q) => q.id === id);
}

export function jobProgress(g: Game, j: ScoutJob): number {
  const done = (Date.parse(g.calendar.currentDate) - Date.parse(j.start)) / 864e5;
  return Math.max(0, Math.min(1, done / j.days));
}

/** Auftrag erteilen. Rückgabe: Fehlertext oder null. */
export function startScouting(g: Game, job: ScoutArgs): string | null {
  const s = scoutingOf(g);
  if (activeJob(g, job.id)) return 'Ein Scout ist bereits unterwegs.';
  if (s.jobs.length >= scoutSlots(g)) return `Alle ${scoutSlots(g)} Scouts sind unterwegs. Mehr Scouting-Mitarbeiter = mehr Aufträge gleichzeitig.`;
  const own = g.clubs[g.managedClubId];
  const t = jobTerms(g, job.abroad, job.youth);
  const today = g.calendar.currentDate;
  const nominal = Math.round(t.cost * economyScale(yearOf(today)));
  if (own.finances.balance < nominal) return 'Für die Reise ist kein Geld in der Kasse.';
  book(own.finances, today, -nominal, 'other', `Scouting: ${job.name}`, true);
  s.jobs.push({ ...job, start: today, days: t.days, cost: t.cost });
  return null;
}

/** Auftrag erteilen oder – ohne freien Scout – vormerken. Rückgabe: 'started' | 'queued' | Fehlertext. */
export function queueScouting(g: Game, job: ScoutArgs): 'started' | 'queued' | string {
  const s = scoutingOf(g);
  if (activeJob(g, job.id)) return 'Ein Scout ist bereits unterwegs.';
  if (queuedJob(g, job.id) >= 0) return 'Der Spieler ist schon vorgemerkt.';
  if (s.jobs.length < scoutSlots(g)) {
    const err = startScouting(g, job);
    return err ?? 'started';
  }
  const q = (s.queue ??= []);
  if (q.length >= MAX_QUEUE) return `Die Warteschlange ist voll (${MAX_QUEUE} Spieler).`;
  q.push(job);
  return 'queued';
}

export function cancelScouting(g: Game, id: string): void {
  const s = g.scouting;
  if (!s) return;
  s.jobs = s.jobs.filter((j) => j.id !== id);
  if (s.queue) s.queue = s.queue.filter((q) => q.id !== id);
}

/** Vorgemerkte Aufträge starten, solange Scouts frei sind und Geld da ist. */
function startQueued(g: Game): void {
  const s = g.scouting;
  if (!s?.queue?.length) return;
  while (s.queue.length && s.jobs.length < scoutSlots(g)) {
    const next = s.queue[0];
    if (activeJob(g, next.id)) { s.queue.shift(); continue; }
    if (startScouting(g, next)) break; // kein Geld: warten
    s.queue.shift();
  }
}

/** Täglich: fertige Aufträge abschließen. */
export function scoutingDaily(g: Game, today: string): void {
  const s = g.scouting;
  if (!s) return;
  if (!s.jobs.length) { startQueued(g); return; }
  const fx = staffEffectsOf(g).scouting ?? 0;
  const done = s.jobs.filter((j) => CalendarEngine.addDays(j.start, j.days) <= today);
  if (!done.length) { startQueued(g); return; }
  s.jobs = s.jobs.filter((j) => !done.includes(j));
  for (const j of done) {
    const k = Math.min(j.youth ? 0.9 : 0.95, 0.75 + fx * 1.4);
    s.reports[j.id] = { k, date: today };
    pushMessage(g.messages, makeMessage({
      date: today, category: 'transfer', from: 'Scouting', relatedId: j.id,
      subject: `Scoutingbericht: ${j.name}`,
      shortText: `Dein Scout hat ${j.name} (${j.clubName}) beobachtet.`,
      bodyText: `Dein Scout ist von ${j.clubName} zurück und hat ${j.name} mehrfach gesehen. Stärke, Potenzial und Marktwert sind jetzt deutlich genauer eingeschätzt – du findest ihn unter Transfers › Spielerpool (Filter „Gescoutet“) und unter Transfers › Scouting.`,
    }));
  }
  startQueued(g);
  const ids = Object.keys(s.reports);
  if (ids.length > MAX_REPORTS) {
    ids.sort((a, b) => s.reports[a].date.localeCompare(s.reports[b].date));
    for (const id of ids.slice(0, ids.length - MAX_REPORTS)) delete s.reports[id];
  }
}

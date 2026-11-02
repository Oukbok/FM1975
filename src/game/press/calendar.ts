// =============================================================================
// Presse: Erscheinungstage, Nummern, Zeitungskopf je Epoche.
// Die Zeitung erscheint montags und donnerstags (wie die großen Fußball-
// Fachblätter); dazu gibt es immer die aktuelle Ausgabe des Tages.
// Blattnamen sind frei erfunden.
// =============================================================================
import { CalendarEngine } from '../../engine/calendar';
import type { PressMasthead } from './types';

const dow = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay();
/** Regulärer Erscheinungstag (Montag oder Donnerstag)? */
export const isIssueDay = (iso: string) => dow(iso) === 1 || dow(iso) === 4;

/** Letzter regulärer Erscheinungstag strikt vor `iso`. */
export function prevIssueDay(iso: string): string {
  let d = CalendarEngine.addDays(iso, -1);
  for (let i = 0; i < 7 && !isIssueDay(d); i++) d = CalendarEngine.addDays(d, -1);
  return d;
}

/**
 * Ausgaben bis heute (neueste zuerst): heute (auch außerhalb der Erscheinungstage)
 * und die regulären Ausgaben davor, höchstens bis `since` und `max` Stück.
 */
export function issueDates(today: string, since: string, max = 12): string[] {
  const out = [today];
  let d = today;
  while (out.length < max) {
    d = prevIssueDay(d);
    if (d < since) break;
    out.push(d);
  }
  return out;
}

/** Laufende Nummer im Kalenderjahr (Montag + Donnerstag zählen). */
export function issueNumber(iso: string): number {
  const jan1 = `${iso.slice(0, 4)}-01-01`;
  let n = 0;
  for (let d = jan1; d <= iso; d = CalendarEngine.addDays(d, 1)) if (isIssueDay(d)) n++;
  return Math.max(1, n);
}

/** Zeitungskopf je Epoche (fiktive Blätter). */
const MASTHEADS: { from: number; m: PressMasthead }[] = [
  { from: 0, m: { name: 'Eckball', claim: 'Das Fußball-Fachblatt', founded: 1949 } },
  { from: 1986, m: { name: 'Steilpass', claim: 'Die Fußball-Zeitung', founded: 1986 } },
  { from: 1998, m: { name: 'Torlinie', claim: 'Fußball. Jeden Montag und Donnerstag.', founded: 1998 } },
  { from: 2012, m: { name: 'Abpfiff', claim: 'Fußball · Print & Digital', founded: 2012 } },
];

export function mastheadFor(year: number): PressMasthead {
  let m = MASTHEADS[0].m;
  for (const x of MASTHEADS) if (year >= x.from) m = x.m;
  return m;
}

export const WEEKDAY_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const weekdayOf = (iso: string) => WEEKDAY_FULL[dow(iso)];

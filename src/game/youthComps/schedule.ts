// =============================================================================
// JUGENDWETTBEWERBE — Spielpläne: Doppelrunden, Sonntage, Winterpause, K.-o.-Termine
// =============================================================================
import { LEAGUE_WINDOW, isoAdd, sundayOnOrAfter, weekdayOnOrAfter, type YcFormat } from '../../data/youthCompetitions';
import { seasonSchedule } from '../../engine/winterBreak';
import type { YcFix, YcRound } from './types';

/** Doppelrunde (Kreismethode); ungerade Anzahl → spielfrei. Rückgabe: Runden mit Paarungen. */
export function doubleRoundRobin(clubs: string[], r: () => number): [string, string][][] {
  const ids = [...clubs];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  if (ids.length % 2) ids.push('');
  const n = ids.length;
  const first: [string, string][][] = [];
  const arr = [...ids];
  for (let k = 0; k < n - 1; k++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a && b) round.push(k % 2 === 0 ? [a, b] : [b, a]);
    }
    first.push(round);
    arr.splice(1, 0, arr.pop()!);
  }
  return [...first, ...first.map((rd) => rd.map(([a, b]) => [b, a] as [string, string]))];
}

const md = (y0: number, [y, s]: [number, string]) => `${y0 + y}-${s}`;

/** Winterpause der Profis (Bundesliga- bzw. DDR-Rhythmus) als Sperrfenster für Jugendspiele. */
export function breakWindow(y0: number, ddr: boolean): [string, string] {
  try {
    const s = seasonSchedule(y0, ddr ? 26 : 34, 1, ddr ? 'ddr' : 'west');
    return [isoAdd(s.breakLast, 2), isoAdd(s.breakFirst, -1)];
  } catch {
    return [`${y0}-12-14`, `${y0 + 1}-02-20`];
  }
}

/** Gleichmäßig verteilte Sonntage im Fenster (ohne Winterpause); notfalls Mittwoche dazu. */
export function leagueDates(y0: number, rounds: number, win: keyof typeof LEAGUE_WINDOW, ddr = false, cap?: string): string[] {
  const w = LEAGUE_WINDOW[win];
  const from = sundayOnOrAfter(md(y0, w.from));
  const to = cap && cap < md(y0, w.to) ? cap : md(y0, w.to);
  const [b0, b1] = breakWindow(y0, ddr);
  const free = (d: string) => d < b0 || d > b1;
  const sundays: string[] = [];
  for (let d = from; d <= to; d = isoAdd(d, 7)) if (free(d)) sundays.push(d);
  let pool = sundays;
  if (pool.length < rounds) {
    const weds: string[] = [];
    for (let d = weekdayOnOrAfter(md(y0, w.from), 3); d <= to; d = isoAdd(d, 7)) if (free(d) && d.slice(5) >= '03-01' && d.slice(5) <= '06-15') weds.push(d);
    pool = [...sundays, ...weds.slice(0, rounds - sundays.length)].sort();
  }
  if (pool.length < rounds) { // letzte Absicherung
    let d = pool.length ? pool[pool.length - 1] : from;
    while (pool.length < rounds) { d = isoAdd(d, 3); pool.push(d); }
  }
  if (pool.length === rounds) return pool;
  // Gleichmäßig auswählen (Hin- und Rückrunde verteilen sich über das Fenster).
  const out: string[] = [];
  for (let i = 0; i < rounds; i++) out.push(pool[Math.round((i * (pool.length - 1)) / Math.max(1, rounds - 1))]);
  return out;
}

export function fixturesFor(clubs: string[], dates: string[], r: () => number): YcFix[] {
  const rounds = doubleRoundRobin(clubs, r);
  const fx: YcFix[] = [];
  rounds.forEach((rd, i) => { for (const [h, a] of rd) fx.push([dates[i] ?? dates[dates.length - 1], h, a, -1, -1]); });
  return fx;
}

// -----------------------------------------------------------------------------
// K.-o.-Runden
// -----------------------------------------------------------------------------
const R = (name: string, legs: 1 | 2, dates: string[], path?: 'dcp'): YcRound => ({ name, legs, dates, ties: [], drawn: false, ...(path ? { path } : {}) });

export function roundName(teams: number): string {
  return teams === 2 ? 'Finale' : teams === 4 ? 'Halbfinale' : teams === 8 ? 'Viertelfinale' : teams === 16 ? 'Achtelfinale' : teams === 32 ? 'Sechzehntelfinale' : `Runde der ${teams}`;
}

/** Letzter Sonntag vor dem Saisonende (Spiele am Saisonende-Tag laufen nicht mehr). */
export function lastSundayBefore(end: string): string {
  return sundayOnOrAfter(isoAdd(end, -7));
}

/** Endrunde rückwärts vom Saisonende: Finale am letzten Sonntag, davor je Woche eine Runde (Hin- mittwochs, Rück- sonntags). */
function backwards(names: string[], legs: (1 | 2)[], end: string): YcRound[] {
  const fin = lastSundayBefore(end);
  return names.map((n, i) => {
    const wk = names.length - 1 - i;
    const sun = isoAdd(fin, -7 * wk);
    return R(n, legs[i], legs[i] === 2 ? [isoAdd(sun, -4), sun] : [sun]);
  });
}

/** Erster Termin der Endrunde (für das Ende der Ligaphase). */
export function koStart(rounds: YcRound[]): string | undefined {
  return rounds.length ? rounds.map((r) => r.dates[0]).sort()[0] : undefined;
}

/** K.-o.-Runden je Format (Termine nach dem historischen Rhythmus, alles vor dem Saisonende). */
export function koRounds(fmt: YcFormat, y0: number, end = `${y0 + 1}-06-28`): YcRound[] {
  const y1 = y0 + 1;
  const sun = (s: string) => sundayOnOrAfter(s);
  const capd = (d: string) => (d < end ? d : isoAdd(lastSundayBefore(end), -2));
  switch (fmt) {
    case 'lv16': return backwards(['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'], [2, 2, 2, 1], end);
    case 'rl8': return backwards(['Viertelfinale', 'Halbfinale', 'Finale'], [2, 2, 1], end);
    case 'bl4': return backwards(['Halbfinale', 'Finale'], [2, 1], end);
    case 'nwl': return backwards(['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'], [1, 1, 1, 1], end);
    case 'cup16': case 'cup21': case 'cup32': case 'cup64': {
      const fin = capd(weekdayOnOrAfter(`${y1}-05-18`, 5));
      const late = [R('Viertelfinale', 1, [sun(`${y0}-12-01`)]), R('Halbfinale', 1, [sun(`${y1}-03-14`)]), R('Finale', 1, [fin])];
      const af = R('Achtelfinale', 1, [sun(`${y0}-10-01`)]);
      if (fmt === 'cup16') return [af, ...late];
      if (fmt === 'cup21') return [R('Vorrunde', 1, [sun(`${y0}-09-10`)]), af, ...late];
      if (fmt === 'cup32') return [R('1. Runde', 1, [sun(`${y0}-09-03`)]), af, ...late];
      return [R('1. Runde', 1, [sun(`${y0}-08-20`)]), R('2. Runde', 1, [sun(`${y0}-09-10`)]), af, ...late];
    }
    case 'uyl1': case 'uyl2': case 'uyl3': {
      const wed = (s: string) => weekdayOnOrAfter(s, 3);
      const sf = weekdayOnOrAfter(`${y1}-04-18`, 5);
      const tail = [R('Viertelfinale', 1, [wed(`${y1}-03-08`)]), R('Halbfinale', 1, [sf]), R('Finale', 1, [isoAdd(sf, 3)])];
      if (fmt === 'uyl1') return [R('Achtelfinale', 1, [wed(`${y1}-02-22`)]), ...tail];
      if (fmt === 'uyl2') return [R('Meisterweg', 2, [wed(`${y0}-10-22`), wed(`${y0}-11-05`)], 'dcp'), R('Play-offs', 1, [wed(`${y1}-02-08`)]), R('Achtelfinale', 1, [wed(`${y1}-02-22`)]), ...tail];
      return [R('Meisterweg', 2, [wed(`${y0}-10-22`), wed(`${y0}-11-05`)], 'dcp'), R('Sechzehntelfinale', 1, [weekdayOnOrAfter(`${y1}-02-10`, 2)]), R('Achtelfinale', 1, [weekdayOnOrAfter(`${y1}-03-03`, 2)]), ...tail];
    }
    default: return [];
  }
}

/** Gruppenspieltage der UEFA Youth League (mittwochs, wie die Champions League). */
export function uylGroupDates(y0: number, n: number): string[] {
  const anchors = ['09-17', '10-01', '10-22', '11-05', '11-26', '12-10'];
  return anchors.slice(0, n).map((a) => weekdayOnOrAfter(`${y0}-${a}`, 3));
}

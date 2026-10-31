// =============================================================================
// WINTERPAUSE – Terminierung der Ligaspieltage einer Saison.
// Daten/Quellen: data/winterBreaks.ts. Aufruf: engine/league.ts (generateFixtures).
//
// Ablauf: Saisonstart (erster Spieltag) → Spieltage bis zum letzten Termin vor der
// Pause → Winterpause → erster Termin danach → Spieltage bis zum Saisonende.
// Spieltage liegen samstags; passen sie nicht in die Samstage einer Phase, kommen
// englische Wochen (Mittwoch) dazu. Bleiben Samstage übrig, entstehen freie
// Wochenenden (gleichmäßig verteilt). Alle Daten in UTC.
// =============================================================================
import {
  LeagueKind, addDaysIso, bundesligaRounds, saturdayOnOrBefore, seasonFirstDay, seasonLastDay, weekday, winterBreakFor,
} from '../data/winterBreaks';

/** Mindestabstand zweier Spieltage in Tagen. */
const MIN_GAP = 3;

interface Phase { sats: string[]; mids: string[] }

/** Samstage zwischen `from` und `to` (beide inklusive als feste Termine) + Mittwochs-Kandidaten. */
function phase(from: string, to: string): Phase {
  const out: string[] = [from];
  let d = addDaysIso(from, (6 - weekday(from) + 7) % 7 || 7);
  while (d < to) {
    if (diff(out[out.length - 1], d) >= MIN_GAP && diff(d, to) >= MIN_GAP) out.push(d);
    d = addDaysIso(d, 7);
  }
  if (to !== from) out.push(to);
  const mids: string[] = [];
  for (let i = 0; i + 1 < out.length; i++) {
    if (diff(out[i], out[i + 1]) < 7) continue;
    const w = addDaysIso(out[i], (3 - weekday(out[i]) + 7) % 7 || 7); // nächster Mittwoch
    if (diff(out[i], w) >= MIN_GAP && diff(w, out[i + 1]) >= MIN_GAP) mids.push(w);
  }
  return { sats: out, mids };
}

function diff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
}

/** k Elemente gleichmäßig aus einer Liste wählen (erstes und letztes immer dabei). */
function spread<T>(list: T[], k: number, keep: 'first' | 'last'): T[] {
  if (k <= 0) return [];
  if (k >= list.length) return [...list];
  if (k === 1) return [keep === 'first' ? list[0] : list[list.length - 1]];
  const out: T[] = [];
  for (let i = 0; i < k; i++) out.push(list[Math.round((i * (list.length - 1)) / (k - 1))]);
  return out;
}

function fill(p: Phase, k: number, keep: 'first' | 'last'): string[] {
  if (k <= p.sats.length) return spread(p.sats, k, keep);
  const extra = spread(p.mids, k - p.sats.length, keep);
  return [...p.sats, ...extra].sort();
}

const cap = (p: Phase) => p.sats.length + p.mids.length;

export interface SeasonSchedule {
  dates: string[];
  /** Letzter Spieltag vor / erster nach der Pause (wie tatsächlich terminiert). */
  breakLast: string;
  breakFirst: string;
  before: number;
}

/**
 * Termine aller Spieltage einer Liga.
 * @param y0     Startjahr der Saison (1986 = 1986/87)
 * @param rounds Anzahl Spieltage (2 × (Vereine − 1))
 * @param tier   Spielklasse (1 = Bundesliga; 2. Liga startet früher)
 * @param kind   'west' (Bundesliga-Rhythmus) oder 'ddr'
 */
export function seasonSchedule(y0: number, rounds: number, tier = 1, kind: LeagueKind = 'west'): SeasonSchedule {
  const br = winterBreakFor(y0, kind);
  const start = seasonFirstDay(y0, tier, kind);
  let end = seasonLastDay(y0, kind);
  const pre = phase(start, br.last);
  let post = phase(br.first, end);
  // Spieltage vor der Pause: Beleg (auf die Liga-Größe umgerechnet) oder Hinrunde.
  let before = br.before && kind === 'west'
    ? Math.round((br.before * rounds) / bundesligaRounds(y0))
    : Math.round(rounds / 2);
  // Notfalls Saisonende wochenweise nach hinten schieben (spätestens 20.6.).
  const limit = saturdayOnOrBefore(`${y0 + 1}-06-20`);
  while (cap(pre) + cap(post) < rounds && end < limit) {
    end = addDaysIso(end, 7);
    post = phase(br.first, end);
  }
  before = Math.max(Math.min(before, cap(pre)), rounds - cap(post), 1);
  before = Math.min(before, cap(pre), rounds - 1);
  const dates = [...fill(pre, before, 'first'), ...fill(post, rounds - before, 'last')];
  // Letzte Absicherung (sollte nie greifen): fehlende Spieltage wöchentlich anhängen.
  while (dates.length < rounds) dates.push(addDaysIso(dates[dates.length - 1], 7));
  return { dates: dates.slice(0, rounds), breakLast: dates[before - 1], breakFirst: dates[before], before };
}

/**
 * Winterpause aus einer Menge von Spieltagsdaten: die größte Lücke zwischen zwei
 * aufeinanderfolgenden Terminen von Oktober bis März (mind. 12 Tage).
 */
export function findWinterBreak(dates: Iterable<string>, y0: number): { last: string; first: string } | null {
  const sorted = [...new Set(dates)].filter((d) => d >= `${y0}-10-01` && d <= `${y0 + 1}-03-31`).sort();
  let best: { last: string; first: string } | null = null;
  let bestGap = 11;
  for (let i = 0; i + 1 < sorted.length; i++) {
    const g = diff(sorted[i], sorted[i + 1]);
    if (g > bestGap) { bestGap = g; best = { last: sorted[i], first: sorted[i + 1] }; }
  }
  return best;
}

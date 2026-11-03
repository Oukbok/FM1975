// =============================================================================
// TERMINREGELN – reine Rechnung für Spielansetzungen (ohne Spielstand).
// Regeln/Quellen: data/matchCalendarRules.ts. Genutzt von engine/league.ts (Spieltag auf
// Fr–Mo verteilen), engine/cup.ts + game/cupReplay.ts (Pokaltermine), game/euroSetup.ts
// (Europapokal) und game/fixtureWatch.ts (Verlegungen, Nachholspiele, Spielausfall).
// Alle Daten ISO, UTC.
// =============================================================================
import {
  MIN_GAP_DAYS, WANT_GAP_DAYS, heatingShare, postponeOdds, weekendSplit, type PostponeReason,
} from '../data/matchCalendarRules';
import type { Match } from '../types';

const DAY = 86_400_000;
const ms = (d: string) => Date.parse(d + 'T00:00:00Z');
export const addD = (d: string, n: number) => new Date(ms(d) + n * DAY).toISOString().slice(0, 10);
export const wdOf = (d: string) => new Date(ms(d)).getUTCDay();
export const dayDiff = (a: string, b: string) => Math.round((ms(b) - ms(a)) / DAY);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Deterministische Zahl in [0, 1) aus einem Schlüssel. */
export const unit = (key: string) => hash(key) / 4294967296;

/** Kleinster Abstand (Tage) von `d` zu einem Termin der Menge (Infinity, wenn leer). */
export function gapTo(d: string, dates: Iterable<string>): number {
  let best = Infinity;
  for (const x of dates) {
    const g = Math.abs(dayDiff(x, d));
    if (g < best) best = g;
  }
  return best;
}

export interface SlotRule {
  /** Termine, zu denen mindestens `gap` Tage Abstand gehalten werden. */
  busy: Iterable<string>;
  gap: number;
}

export interface SlotQuery {
  preferred: string;
  /** Erlaubte Wochentage (leer = alle). */
  weekdays?: number[];
  /** Frühester/spätester Termin (inklusive). */
  from?: string;
  to?: string;
  /** Größte Verschiebung vom Wunschtermin in Tagen (Standard 10). */
  maxShift?: number;
  /** Bei gleichem Abstand: lieber später (Standard) oder früher. */
  preferEarlier?: boolean;
  /** Tage, die nicht in Frage kommen (Winterpause, Feiertage). */
  skip?: (d: string) => boolean;
  rules: SlotRule[];
}

/** Nächstgelegener Termin, der alle Regeln erfüllt; null, wenn keiner im Rahmen liegt. */
export function findSlot(q: SlotQuery): string | null {
  const max = q.maxShift ?? 10;
  const rules = q.rules.map((r) => ({ busy: [...r.busy], gap: r.gap }));
  for (let s = 0; s <= max; s++) {
    const cands = s === 0 ? [q.preferred] : q.preferEarlier ? [addD(q.preferred, -s), addD(q.preferred, s)] : [addD(q.preferred, s), addD(q.preferred, -s)];
    for (const d of cands) {
      if (q.from && d < q.from) continue;
      if (q.to && d > q.to) continue;
      if (q.weekdays?.length && !q.weekdays.includes(wdOf(d))) continue;
      if (q.skip?.(d)) continue;
      if (rules.every((r) => gapTo(d, r.busy) >= r.gap)) return d;
    }
  }
  return null;
}

/**
 * Stufenweise Suche: erst Wunschabstand (3 Tage) auf den erlaubten Wochentagen, dann
 * Mindestabstand (2 Tage), zuletzt beliebiger Wochentag mit Mindestabstand.
 */
export function findSlotTiered(q: Omit<SlotQuery, 'rules'> & { busy: Iterable<string>; extra?: SlotRule[] }): string | null {
  const busy = [...q.busy];
  const extra = q.extra ?? [];
  return findSlot({ ...q, rules: [{ busy, gap: WANT_GAP_DAYS }, ...extra] })
    ?? findSlot({ ...q, rules: [{ busy, gap: MIN_GAP_DAYS }, ...extra] })
    ?? findSlot({ ...q, weekdays: [], rules: [{ busy, gap: MIN_GAP_DAYS }, ...extra] });
}

/** Häufigstes Datum je Spieltag = Hauptspieltag (Samstag bzw. Wochenspieltag). */
export function matchdayBaseDates(fixtures: Match[]): Map<number, string> {
  const cnt = new Map<number, Map<string, number>>();
  for (const m of fixtures) {
    const c = cnt.get(m.matchday) ?? new Map<string, number>();
    cnt.set(m.matchday, c);
    // Verlegte Spiele zählen mit ihrem Ursprungstermin.
    const d = m.moved?.orig ?? m.date;
    c.set(d, (c.get(d) ?? 0) + 1);
  }
  const out = new Map<number, string>();
  for (const [md, c] of cnt) {
    let best = ''; let n = -1;
    for (const [d, k] of c) if (k > n || (k === n && d < best)) { best = d; n = k; }
    // Wochenend-Spieltag (Fr–Mo verteilt): Hauptspieltag ist der Samstag.
    const ds = [...c.keys()].sort();
    const sat = ds.find((d) => wdOf(d) === 6);
    if (sat && dayDiff(ds[0], ds[ds.length - 1]) <= 3) best = sat;
    out.set(md, best);
  }
  return out;
}

/**
 * Verteilt die Spiele normaler Wochenend-Spieltage nach der Epoche auf Fr/Sa/So/Mo
 * (data/matchCalendarRules.ts). Zeitgleich bleiben: erster Spieltag, die letzten zwei
 * Spieltage, Wochenspieltage und Spieltage mit einer englischen Woche davor oder danach
 * (sonst wäre der Abstand zu knapp). Verändert `fixtures` (Datum je Spiel).
 */
export function spreadWeekend(fixtures: Match[], y0: number, tier: number, ddr = false): void {
  const split = weekendSplit(y0, tier, ddr);
  if (split[1] >= 1) return;
  const base = matchdayBaseDates(fixtures);
  const mds = [...base.keys()].sort((a, b) => a - b);
  const last = mds[mds.length - 1];
  for (let i = 0; i < mds.length; i++) {
    const md = mds[i];
    const b = base.get(md)!;
    if (md === mds[0] || md >= last - 1 || wdOf(b) !== 6) continue;
    const prev = i > 0 ? base.get(mds[i - 1])! : null;
    const next = i + 1 < mds.length ? base.get(mds[i + 1])! : null;
    if ((prev && dayDiff(prev, b) < 7) || (next && dayDiff(b, next) < 7)) continue;
    const games = fixtures.filter((m) => m.matchday === md)
      .sort((a, c) => unit(`wk:${y0}:${tier}:${md}:${a.homeClubId}`) - unit(`wk:${y0}:${tier}:${md}:${c.homeClubId}`));
    const n = games.length;
    const fr = Math.round(split[0] * n), so = Math.round(split[2] * n), mo = Math.round(split[3] * n);
    games.forEach((m, k) => {
      const off = k < fr ? -1 : k < fr + so ? 1 : k < fr + so + mo ? 2 : 0;
      m.date = addD(b, off);
    });
  }
}

/** Hat das Stadion des Heimvereins eine Rasenheizung? (deterministisch je Verein und Jahr) */
export function hasHeating(homeId: string, tier: number, year: number): boolean {
  return unit(`heat:${homeId}`) < heatingShare(year, tier);
}

/**
 * Wird das Spiel wegen des Wetters abgesagt? Wetter = Spielwetter der Vorschau
 * (`fixedWeather`), Würfel fest aus Datum und Paarung – dieselbe Antwort bei jedem Aufruf.
 */
export function weatherPostponement(date: string, homeId: string, awayId: string, tier: number, weather: string): PostponeReason | null {
  const year = Number(date.slice(0, 4));
  const odds = postponeOdds(weather, Number(date.slice(5, 7)), hasHeating(homeId, tier, year), year);
  if (!odds) return null;
  return unit(`ppd:${date}:${homeId}:${awayId}`) < odds.p ? odds.reason : null;
}

/**
 * Termin für Landespokal-Runden und Wiederholungsspiele: am Pokal-Wochentag, Liga-Hauptspieltage
 * mit Wunschabstand, Europapokal-Wochen nach Möglichkeit meiden (der Europapokal wird danach
 * angesetzt und weicht dem Pokal aus); notfalls Mindestabstand bzw. ein anderer Wochentag.
 */
export function findCupSlot(q: Omit<SlotQuery, 'rules' | 'weekdays'>, weekdays: number[], league: string[], euro: string[]): string | null {
  const L = (gap: number) => ({ busy: league, gap });
  const E = (gap: number) => ({ busy: euro, gap });
  return findSlot({ ...q, weekdays, rules: [L(WANT_GAP_DAYS), E(WANT_GAP_DAYS)] })
    ?? findSlot({ ...q, weekdays, rules: [L(WANT_GAP_DAYS), E(MIN_GAP_DAYS)] })
    ?? findSlot({ ...q, weekdays, rules: [L(WANT_GAP_DAYS)] })
    ?? findSlot({ ...q, weekdays, rules: [L(MIN_GAP_DAYS), E(MIN_GAP_DAYS)] })
    ?? findSlot({ ...q, weekdays, rules: [L(MIN_GAP_DAYS)] })
    ?? findSlot({ ...q, weekdays: [], rules: [L(MIN_GAP_DAYS)] });
}

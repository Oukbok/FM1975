// =============================================================================
// RELEGATION IN DEN AUSLANDSLIGEN (Hintergrund, schlank wie LeanDiv/LeanCup)
// -----------------------------------------------------------------------------
// Sobald alle beteiligten Ligen eines Landes ihren letzten Spieltag gespielt haben
// (game/worldLeagues.ts `worldLiveDaily`), werden alle Klammern der Saison im
// Schnellmodell der Auslandsligen (`worldMatchGoals`) ausgespielt und als kleine
// Datensätze in `world.live.rel[Land]` gemerkt (Termine nach dem letzten Spieltag –
// angezeigt werden nur Spiele bis heute). Am Saisonende tauscht
// `applyWorldRelegation` nach `advanceWorldSeason` die Plätze (game/relegationCore.ts
// `relSwap`), die Welt-Historie behält die Ergebnisse (`WorldSeasonRecord.rel`).
// Geloste Aufstiegsspiele der Meister ('champs', nur Heimatland Deutschland) gibt es
// im Hintergrund nicht.
// =============================================================================
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { relegationFormats, type RelBracket } from '../data/relegationRules';
import { seasonStartYear } from '../data/timeline';
import { CalendarEngine } from '../engine/calendar';
import { worldMatchGoals, type WorldLive, type WorldState } from '../engine/world';
import type { Game } from './state';
import { awayGoalsIn, playBracketQuick, relSwap, roundOf, seedOf, type RelOutcome, type RelRecord, type RelTables } from './relegationCore';
import { leanDates, leanTable, leanTierOf } from './worldLeagues';

const addDays = (d: string, n: number) => CalendarEngine.addDays(d, n);

/** Ligen eines Landes nach Ebene: Ebene → [Index je Staffel] (Schlüssel `Land|Index` in `live.divs`). */
function levelsOf(live: WorldLive, key: string): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (const k of Object.keys(live.divs)) {
    const [kk, t] = k.split('|');
    if (kk !== key) continue;
    const idx = Number(t);
    const { tier } = leanTierOf(idx);
    const l = out.get(tier) ?? [];
    l.push(idx);
    out.set(tier, l);
  }
  for (const l of out.values()) l.sort((a, b) => a - b);
  return out;
}

/** Klammern eines Landes ausspielen, sobald die beteiligten Ligen fertig sind; `force` am Saisonende. */
function decideCountry(g: Game, live: WorldLive, key: string, force: boolean): RelRecord[] | null {
  const cc = COUNTRY_BY_KEY[key]?.cc;
  if (!cc) return [];
  const y = seasonStartYear(live.season);
  const fmts = relegationFormats(cc, y).filter((f) => f.brackets !== 'champs');
  if (!fmts.length) return [];
  const lv = levelsOf(live, key);
  const str = (id: string) => g.euroClubs?.[id]?.strength ?? 50;
  const out: RelRecord[] = [];
  for (const f of fmts) {
    const up = lv.get(f.lv) ?? [], low = lv.get(f.lv + 1) ?? [];
    if (up.length !== 1) continue;
    const needLow = (f.brackets as RelBracket[]).some((b) => b.m.some((m) => [m.a, m.b].some((s) => 's' in s && s.s === 'l')));
    if (needLow && !low.length) continue;
    const divs = [...up, ...low].map((i) => live.divs[`${key}|${i}`]);
    if (!force && divs.some((d) => d.md < d.n)) return null;
    const table = (i: number) => {
      const rows = leanTable(live.divs[`${key}|${i}`], key, live.season);
      return { ids: rows.map((r) => r.clubId), pts: Object.fromEntries(rows.map((r) => [r.clubId, r.pts])) };
    };
    const t: RelTables = { upper: table(up[0]), lower: low.map(table) };
    const last = divs.map((d) => leanDates(live.season, d.n)[d.n - 1]).reduce((a, b) => (b > a ? b : a), '');
    const base = addDays(last, 4);
    const ag = awayGoalsIn(f, y);
    (f.brackets as RelBracket[]).forEach((b, bi) => {
      const rec = playBracketQuick(b, f.lv, bi, t, {
        goals: (h, a, neutral, r) => {
          if (neutral && r() < 0.5) { const [x, z] = worldMatchGoals(str(a), str(h), r); return [z, x]; }
          return worldMatchGoals(str(h), str(a), r);
        },
        strength: str, awayGoals: ag, tieBetter: !!f.tieBetter,
        better: (a, c) => (seedOf(a, t) <= seedOf(c, t) ? a : c),
      }, `${key}|${live.season}|${f.lv}|${bi}`, (mi, leg) => addDays(base, 7 * roundOf(b, mi) + 3 * leg));
      if (rec) out.push(rec);
    });
  }
  return out;
}

/** Täglich aus worldLiveDaily (und am Saisonende mit `force`): fertige Länder entscheiden. */
export function worldRelDaily(g: Game, live: WorldLive, force = false): void {
  const keys = new Set(Object.keys(live.divs).map((k) => k.split('|')[0]));
  for (const key of keys) {
    if (live.rel?.[key]) continue;
    const recs = decideCountry(g, live, key, force);
    if (recs === null || (!recs.length && !force)) {
      if (recs && !recs.length) (live.rel ??= {})[key] = [];
      continue;
    }
    (live.rel ??= {})[key] = recs;
  }
}

/** Nach `advanceWorldSeason`: Relegationssieger auf die umkämpften Plätze tauschen. Rückgabe: Zahl der Tausche. */
export function applyWorldRelegation(w: WorldState, rel: Record<string, RelRecord[]> | undefined): number {
  let n = 0;
  for (const [key, recs] of Object.entries(rel ?? {})) {
    const c = w.countries[key];
    if (!c || !recs.length) continue;
    const arrays = [c.tiers[0] ?? [], c.tiers[1] ?? [], c.deep?.[0]?.ids ?? [], c.deep?.[1]?.ids ?? [], c.pool ?? []];
    const levels = [1, 2, 3, 4, 99];
    const outs: RelOutcome[] = recs.filter((r) => r.w && !r.skip).map((r) => ({ lv: r.lv, ent: r.ent, w: r.w!, upper: r.up }));
    n += relSwap(arrays, (i) => levels[i], outs);
  }
  return n;
}

/** Relegation eines Landes in einer Saison (laufend oder Historie). */
export function worldRelOf(g: Game, key: string, season: string): RelRecord[] {
  if (g.world?.live?.season === season) return g.world.live.rel?.[key] ?? [];
  return g.world?.history.find((r) => r.season === season)?.rel?.[key] ?? [];
}

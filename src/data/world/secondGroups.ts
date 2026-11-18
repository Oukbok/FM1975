// =============================================================================
// STAFFELN DER 2. EBENE (Wunsch Pascal: „Mehrere zweite Ligen im Ausland sollen alle
// simuliert werden.“)
// -----------------------------------------------------------------------------
// Die Weltdaten führen eine mehrgleisige 2. Liga als `t2` (erste Staffel) + `t2b` (weitere
// Staffeln derselben Größe hintereinander). In den Daten sind das (Stand 11/2026):
//   Frankreich 1975/76–1992/93   2 × 18 (Division 2 Groupe A = Nord/West, Groupe B = Süd/Ost)
//   Portugal   1976/77, 1980/81–1982/83, 1988/89–1989/90   3 × 16 bzw. 3 × 18 (Zona Norte/Centro/Sul;
//              in den Datenlücken 1977–79 und 1983–87 bleiben die drei Zonen bestehen)
//   Deutschland 1975/76–1980/81, 1991/92   2 × 20 (1980/81 22 + 20) bzw. 2 × 12 (Nord/Süd)
// Jede Staffel wird als eigene Liga gespielt (Hintergrund: engine/worldSecond.ts,
// Heimatland: game/homeStructure.ts). Zuordnung eines Vereins zu einer Staffel (feste Regel,
// keine Koordinaten nötig):
//   1. bisherige Staffel (gleiche Staffelzahl), sonst
//   2. die Staffel, in der er laut Weltdaten in der nächstgelegenen mehrgleisigen Saison spielte
//      (Weltdaten sind nach Lage eingeteilt), sonst
//   3. die Staffel, in der die meisten Vereine seiner Stadt laut Weltdaten spielten, sonst
//   4. die Staffel mit den meisten freien Plätzen.
// Ist die Wunsch-Staffel voll, rückt der Verein in die Staffel mit den meisten freien Plätzen.
// Namen: zwei Staffeln Nord/Süd, drei Nord/Mitte/Süd, sonst Staffel 1, 2, …
// =============================================================================
import type { LeagueGroup } from '../../engine/leagues';
import { realClub, worldDataVersion, worldSeason, worldYears } from './index';
import type { SeasonRow } from './types';

/** Staffeln der 2. Ebene einer Saison (Vereins-IDs je Staffel; leer = keine 2. Liga in den Daten). */
export function rowGroups(r: SeasonRow): string[][] {
  const a = r.t2 ?? [], b = r.t2b ?? [];
  if (!a.length) return [];
  if (!b.length) return [a];
  const k = b.length % a.length === 0 ? b.length / a.length : 1;
  const n = Math.ceil(b.length / k);
  return [a, ...Array.from({ length: k }, (_, i) => b.slice(i * n, (i + 1) * n))];
}

/** Namen der Staffeln (ohne „2. Liga“). */
export function groupNames(n: number): string[] {
  if (n === 2) return ['Nord', 'Süd'];
  if (n === 3) return ['Nord', 'Mitte', 'Süd'];
  return Array.from({ length: n }, (_, i) => `Staffel ${i + 1}`);
}

/** Anzeigename einer Staffel der 2. Ebene: „2. Liga“ (eingleisig) bzw. „2. Liga Nord“. */
export function secondLabel(n: number, i: number, base = '2. Liga'): string {
  return n > 1 ? `${base} ${groupNames(n)[i] ?? `Staffel ${i + 1}`}` : base;
}

/** Staffelkennungen im Heimatland (Divisionen `tier2-<kennung>`). */
export function homeGroupKeys(n: number): LeagueGroup[] {
  if (n <= 1) return [null];
  if (n === 2) return ['nord', 'sued'];
  if (n === 3) return ['nord', 'west', 'sued'];
  if (n === 4) return ['nord', 'west', 'suedwest', 'sued'];
  return (['nord', 'nordost', 'west', 'suedwest', 'sued', 'bayern'] as LeagueGroup[]).slice(0, Math.min(6, n));
}

// -----------------------------------------------------------------------------
// Zonen aus den Weltdaten
// -----------------------------------------------------------------------------
interface ZoneHit { y: number; i: number; n: number }
interface ZoneTable { ids: Map<string, ZoneHit[]>; cities: Map<string, number[]> }
let zoneVersion = -1;
const zoneCache = new Map<string, ZoneTable>();

function zonesOf(cc: string): ZoneTable {
  const v = worldDataVersion();
  if (v !== zoneVersion) { zoneCache.clear(); zoneVersion = v; }
  const hit = zoneCache.get(cc);
  if (hit) return hit;
  const ids = new Map<string, ZoneHit[]>(), cities = new Map<string, number[]>();
  for (const y of worldYears(cc)) {
    const gs = rowGroups(worldSeason(cc, y)!);
    if (gs.length < 2) continue;
    gs.forEach((list, i) => {
      for (const id of list) {
        const arr = ids.get(id) ?? [];
        arr.push({ y, i, n: gs.length });
        ids.set(id, arr);
        const city = realClub(cc, id)?.city;
        if (!city) continue;
        const key = `${gs.length}|${city}`;
        const cnt = cities.get(key) ?? new Array(gs.length).fill(0);
        cnt[i]++;
        cities.set(key, cnt);
      }
    });
  }
  const t = { ids, cities };
  zoneCache.set(cc, t);
  return t;
}

/** Staffel laut Weltdaten (Index bei `n` Staffeln) für einen Verein (Weltdaten-ID) bzw. seine Stadt; null = unbekannt. */
export function dataZoneOf(cc: string | undefined, realId: string | null, city: string | undefined, n: number, year: number): number | null {
  if (!cc || n < 2) return null;
  const t = zonesOf(cc);
  const hits = realId ? t.ids.get(realId) : undefined;
  if (hits?.length) {
    const same = hits.filter((h) => h.n === n);
    const list = same.length ? same : hits;
    const best = list.reduce((a, b) => (Math.abs(b.y - year) < Math.abs(a.y - year) ? b : a));
    return best.n === n ? best.i : Math.round((best.i * (n - 1)) / Math.max(1, best.n - 1));
  }
  const cnt = city ? t.cities.get(`${n}|${city}`) : undefined;
  if (cnt) {
    const max = Math.max(...cnt);
    if (max > 0) return cnt.indexOf(max);
  }
  return null;
}

/**
 * Verteilt Vereine auf Staffeln mit festen Größen: in der übergebenen Reihenfolge zuerst in die
 * Wunsch-Staffel (`prefOf`), sonst – und wenn sie voll ist – in die Staffel mit den meisten freien
 * Plätzen (bei Gleichstand die vordere). Wer keinen Platz mehr findet, steht in `overflow`.
 */
export function assignToGroups(ids: string[], sizes: number[], prefOf: (id: string) => number | null): { buckets: string[][]; overflow: string[] } {
  const buckets: string[][] = sizes.map(() => []);
  const free = (k: number) => sizes[k] - buckets[k].length;
  const rest: string[] = [];
  for (const id of ids) {
    const p = prefOf(id);
    if (p != null && p >= 0 && p < sizes.length && free(p) > 0) buckets[p].push(id); else rest.push(id);
  }
  const overflow: string[] = [];
  for (const id of rest) {
    let k = -1;
    for (let i = 0; i < sizes.length; i++) if (free(i) > 0 && (k < 0 || free(i) > free(k))) k = i;
    if (k >= 0) buckets[k].push(id); else overflow.push(id);
  }
  return { buckets, overflow };
}

/** Liste nach Staffelgrößen teilen (Rest in die letzte Staffel). */
export function splitBySizes(ids: string[], sizes: number[]): string[][] {
  const out: string[][] = [];
  let at = 0;
  sizes.forEach((n, i) => { out.push(ids.slice(at, i === sizes.length - 1 ? ids.length : at + n)); at += n; });
  return out;
}

/**
 * Datenlücke ohne 2. Liga (z. B. Portugal 1977–79, 1983–87): Staffeln aus der nächstgelegenen Saison mit
 * mehreren Staffeln (zuerst früher, dann später, bis 12 Jahre), ohne die Erstligisten `t1` dieser Saison;
 * frei gewordene Plätze nehmen die übrigen Erstligisten der Nachbarsaison nach ihrer Zone ein.
 * null = Nachbarsaison eingleisig bzw. keine gefunden (dann gilt game/worldCompose.ts `completeRow`).
 */
export function gapGroups(cc: string, year: number, t1: string[]): string[][] | null {
  for (let d = 1; d <= 12; d++) {
    for (const y of [year - d, year + d]) {
      const near = worldSeason(cc, y);
      const gs = near ? rowGroups(near) : [];
      if (!gs.length) continue;
      if (gs.length < 2) return null;
      const taken = new Set(t1);
      const cands = [...new Set([...gs.flat(), ...near!.t1])].filter((id) => !taken.has(id));
      const sizes = gs.map((x) => x.length - (x.length % 2));
      const { buckets } = assignToGroups(cands, sizes, (id) => dataZoneOf(cc, id, realClub(cc, id)?.city, gs.length, y));
      return buckets;
    }
  }
  return null;
}

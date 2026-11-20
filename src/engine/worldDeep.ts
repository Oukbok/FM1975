// =============================================================================
// TIEFERE EBENEN DER HINTERGRUND-WELT (Wunsch Pascal: Auslandsligen bis zur 3./4. Ebene)
// -----------------------------------------------------------------------------
// `WorldCountry.deep` = [Ebene 3, Ebene 4], je Ebene alle Staffeln hintereinander + Größen.
// Tiefe je Land nach Rang der Länderwertung (data/world/deepStructure.ts `nextDepth`): beim
// Spielstart bzw. beim ersten Saisonwechsel älterer Spielstände festgelegt, danach alle fünf Jahre
// geprüft (mit Puffer). Neue Ebenen entstehen aus dem Unterbau (`WorldCountry.pool`: übrige Vereine
// der Weltdaten, erfundene Städtevereine), Rest erfundene Vereine aus data/world/deepTowns.ts;
// eine wegfallende Ebene geht in den Unterbau.
// Saisonwechsel `exchangeDeep` (nach `exchangeSecond`): Absteiger der 2. Ebene kommen in die
// 3. Ebene, ihre Aufsteiger hat `exchangeSecond` schon aus den Staffelsiegern der 3. Ebene geholt;
// Ebene für Ebene steigen die Schlechtesten jeder Staffel reihum ab, Aufsteiger sind die Staffelsieger
// (dann Zweite …, je Runde die stärksten) – so viele, dass jede Ebene die Größe der NEUEN Saison hat;
// die unterste Ebene tauscht mit dem Unterbau (2 je Staffel). Alle Vereine einer Ebene werden auf die
// Staffeln der neuen Saison verteilt (bisherige Staffel, sonst Zone laut Weltdaten, sonst freie Staffel).
// Spielbetrieb: game/worldLeagues.ts (Schlüssel `Land|100+i` = Ebene 3 Staffel i, `Land|200+i` = Ebene 4).
// Vereinfachungen: keine Kader (keine Weltspieler, keine Einzelstatistik), keine Aufstiegsrunden,
// höchstens vier Staffeln je Ebene.
// =============================================================================
import type { EuroClub } from '../data/europe';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { deepLevelsFor, hasDeepData, leagueRanking, nextDepth, startDepthOf, type DeepLevel } from '../data/world/deepStructure';
import { DEEP_TOWNS } from '../data/world/deepTowns';
import { assignToGroups, splitBySizes } from '../data/world/secondGroups';
import { countryLevel, ensureCountryPool, newClub, softClubStrength, targetStrength } from './worldCountries';
import { clamp, gauss, hash, rng } from './worldRandom';
import { zonePref } from './worldSecond';
import { WORLD_DEEP_KEEP, type WorldCountry, type WorldState } from './worldTypes';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const ccOf = (c: WorldCountry) => COUNTRY_BY_KEY[c.name]?.cc;

/** Staffeln einer tieferen Ebene (k = 0 → Ebene 3). */
export function deepGroupsOf(c: WorldCountry, k: number): string[][] {
  const d = c.deep?.[k];
  if (!d?.ids.length) return [];
  return d.groups.length > 1 && sum(d.groups) === d.ids.length ? splitBySizes(d.ids, d.groups) : [d.ids];
}

/** Alle Vereine der tieferen Ebenen eines Landes. */
export const deepIdsOf = (c: WorldCountry): string[] => (c.deep ?? []).flatMap((d) => d.ids);

/** Ebene (3/4) eines Vereins in den tieferen Ebenen; 0 = nicht dort. */
export function deepTierOf(c: WorldCountry, id: string): number {
  const k = (c.deep ?? []).findIndex((d) => d.ids.includes(id));
  return k < 0 ? 0 : k + 3;
}

function setDeepGroups(c: WorldCountry, k: number, groups: string[][]): void {
  const list = groups.filter((g) => g.length);
  (c.deep ??= [])[k] = { ids: list.flat(), groups: list.map((g) => g.length) };
}

/** Zielstärke eines Vereins der Ebene `tier` (3/4): unter der 2. Liga, über dem Unterbau. */
export function deepTarget(level: number, size: number, tier: number): number {
  return targetStrength(level, size, 1) - (tier === 3 ? 2 : 3.5);
}

/** Abschlag des Unterbaus bei tieferen Ebenen (der Unterbau liegt dann unter Ebene 4). */
export const poolShift = (c: WorldCountry) => (c.deep?.length ? 1.5 * c.deep.length : 0);

/** Freie Stadt für einen erfundenen Verein der tieferen Ebenen. */
function nextTown(c: WorldCountry, euroClubs: Record<string, EuroClub>, r: () => number): string {
  const used = new Set(Object.values(euroClubs).filter((e) => e.country === c.name).map((e) => e.city));
  const towns = DEEP_TOWNS[ccOf(c) ?? ''] ?? [];
  const free = towns.find((t) => !used.has(t));
  if (free) return free;
  const spare = c.spareCities.shift();
  if (spare) return spare;
  const cities = [...used];
  return cities[Math.floor(r() * Math.max(1, cities.length))] ?? c.name;
}

/** Eine Ebene neu anlegen: stärkste Vereine des Unterbaus, Rest erfundene Vereine. */
function buildLevel(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, k: number, lv: DeepLevel, year: number, r: () => number): void {
  const need = sum(lv.groups);
  const str = (id: string) => euroClubs[id]?.strength ?? 0;
  const pool = (c.pool ?? []).filter((id) => euroClubs[id] && w.meta[id]).sort((a, b) => str(b) - str(a) || a.localeCompare(b));
  const take = pool.slice(0, Math.min(need, Math.max(0, pool.length - 4)));
  const takeSet = new Set(take);
  c.pool = pool.filter((id) => !takeSet.has(id));
  const level = countryLevel(c, year);
  const usedShort = new Set(Object.values(euroClubs).map((e) => e.shortName));
  const ids = [...take];
  while (ids.length < need) {
    const size = clamp((k === 0 ? 0.18 : 0.13) + gauss(r) * 0.05, 0.03, 0.32);
    ids.push(newClub(w, euroClubs, c, nextTown(c, euroClubs, r), deepTarget(level, size, k + 3) + gauss(r) * 1.5, size, r, usedShort));
  }
  for (const id of take) {
    const m = w.meta[id];
    if (m) m.size = clamp(m.size, 0.03, 0.32);
  }
  const n = lv.groups.length;
  const { buckets, overflow } = assignToGroups(ids, lv.groups, n > 1 ? zonePref(c, euroClubs, n, year) : () => 0);
  setDeepGroups(c, k, buckets);
  if (overflow.length) c.pool = [...(c.pool ?? []), ...overflow];
}

/** Höchstzahl im Unterbau eines Landes mit tieferen Ebenen (darüber werden alte erfundene Vereine gestrichen). */
const POOL_KEEP = 30;

/**
 * Unterbau klein halten (Spielstand): wird eine Ebene aufgelöst oder verkleinert, landen viele Vereine im
 * Unterbau. Gestrichen werden nur erfundene Vereine (`w_<Zahl>`), die in den letzten Saisons nicht in einer
 * Liga standen (die gespeicherten Tabellen der Historie kennen sie nicht mehr); die stärksten bleiben.
 */
export function trimPool(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, year: number): void {
  const pool = c.pool ?? [];
  if (pool.length <= POOL_KEEP) return;
  const p = w.places;
  const recent = (id: string) => {
    if (!p?.y0) return false;
    const from = Math.max(0, (year - WORLD_DEEP_KEEP - 1 - p.y0) * 2);
    const hit = (s?: string) => !!s && /[^.]/.test(s.slice(from));
    return hit(p.c[id]) || hit(p.d?.[id]);
  };
  const str = (id: string) => euroClubs[id]?.strength ?? 0;
  const order = [...pool].sort((a, b) => str(b) - str(a) || a.localeCompare(b));
  const keep: string[] = [];
  for (const id of order) {
    if (keep.length < POOL_KEEP || !/^w_\d+$/.test(id) || recent(id)) { keep.push(id); continue; }
    delete euroClubs[id]; delete w.meta[id];
    if (p) { delete p.c[id]; delete p.d?.[id]; delete p.s?.[id]; }
  }
  c.pool = keep;
}

/** Tiefe eines Landes ändern: fehlende Ebenen anlegen, überzählige in den Unterbau. */
export function applyDepth(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, depth: number, year: number, r: () => number): void {
  const levels = deepLevelsFor(ccOf(c), year, depth);
  const have = c.deep?.length ?? 0;
  if (levels.length < have) {
    const gone = (c.deep ?? []).slice(levels.length).flatMap((d) => d.ids);
    c.pool = [...(c.pool ?? []), ...gone];
    c.deep = (c.deep ?? []).slice(0, levels.length);
  }
  for (let k = c.deep?.length ?? 0; k < levels.length; k++) {
    ensureCountryPool(w, euroClubs, c, year, r, 10);
    buildLevel(w, euroClubs, c, k, levels[k], year, r);
  }
  if (!c.deep?.length) delete c.deep;
  c.depth = 2 + (c.deep?.length ?? 0);
  ensureCountryPool(w, euroClubs, c, year, r, 10);
  trimPool(w, euroClubs, c, year);
}

/**
 * Tiefe aller Hintergrund-Länder festlegen bzw. prüfen (Spielstart, Saisonwechsel). `year` = Startjahr
 * der Saison, `force` = immer prüfen (sonst nur beim ersten Mal und alle fünf Jahre).
 * Das Heimatland zählt in der Rangliste mit (historische Kurve), wird hier aber nicht verändert (es ist kein Hintergrund-Land).
 */
export function updateWorldDepths(w: WorldState, euroClubs: Record<string, EuroClub>, year: number, force = false): void {
  const r = rng(hash(`world-deep|${year}`));
  const repOf = (key: string) => w.countries[key]?.rep;
  const ranking = leagueRanking(year, repOf);
  for (const c of Object.values(w.countries)) {
    if (!c.active || !hasDeepData(ccOf(c)) || !(c.tiers[1]?.length)) continue;
    const first = c.depth == null;
    if (!first && !force && year % 5 !== 0) continue;
    const rank = ranking.indexOf(c.name) + 1 || 99;
    const depth = first ? startDepthOf(c.name, year) : nextDepth(c.depth!, rank);
    if (depth !== (c.depth ?? 2) || first) applyDepth(w, euroClubs, c, depth, year, r);
  }
}

/** Aufsteiger aus Staffeltabellen: zuerst die Sieger, dann die Zweiten … (je Runde die stärksten). */
export function pickPromoted(tables: string[][], n: number, str: (id: string) => number): string[] {
  const out: string[] = [];
  const longest = Math.max(0, ...tables.map((g) => g.length));
  for (let k = 0; out.length < n && k < longest; k++) {
    const cand = tables.map((g) => g[k]).filter(Boolean).sort((a, b) => str(b) - str(a) || a.localeCompare(b));
    for (const id of cand) if (out.length < n) out.push(id);
  }
  return out;
}

/** Staffelgrößen an eine Gesamtzahl anpassen (reihum ±1). */
function fit(sizes: number[], total: number): number[] {
  const out = [...sizes];
  let diff = total - sum(out), guard = 0;
  while (diff !== 0 && guard++ < 2000) {
    const k = out.map((v, i) => ({ v, i })).sort((a, b) => (diff > 0 ? a.v - b.v : b.v - a.v) || a.i - b.i)[0].i;
    if (diff < 0 && out[k] <= 2) break;
    out[k] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return out;
}

/**
 * Saisonwechsel der tieferen Ebenen. `tables[k]` = Endtabellen der Staffeln der Ebene 3+k,
 * `fromAbove` = Absteiger aus der 2. Ebene, `upTaken` = schon in die 2. Ebene aufgestiegene Vereine
 * der 3. Ebene. Setzt `c.deep` und `c.pool` für die Saison mit Startjahr `endYear`.
 */
export function exchangeDeep(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, tables: string[][][], fromAbove0: string[], upTaken0: string[], endYear: number, r: () => number): void {
  const L = c.deep?.length ?? 0;
  if (!L) return;
  const str = (id: string) => euroClubs[id]?.strength ?? 0;
  const next = deepLevelsFor(ccOf(c), endYear, c.depth ?? 2 + L);
  let fromAbove = fromAbove0.filter((id) => euroClubs[id]);
  let upTaken = new Set(upTaken0);
  for (let k = 0; k < L; k++) {
    const cur = tables[k]?.length ? tables[k] : deepGroupsOf(c, k);
    const sizes = next[k]?.groups ?? c.deep![k].groups;
    const T = sum(sizes);
    const stay = cur.map((g) => g.filter((id) => !upTaken.has(id) && euroClubs[id]));
    const stayN = sum(stay.map((g) => g.length));
    const last = k === L - 1;
    const below = last ? null : (tables[k + 1]?.length ? tables[k + 1] : deepGroupsOf(c, k + 1));
    const E = last ? 2 * stay.length : Math.max(below!.length, Math.round(stayN / 6));
    let down = Math.max(0, Math.min(E, stayN - 4));
    let inBelow = T - (stayN - down) - fromAbove.length;
    if (inBelow < 0) { down = Math.min(stayN - 2, down - inBelow); inBelow = Math.max(0, T - (stayN - down) - fromAbove.length); }
    // Absteiger reihum vom Tabellenende jeder Staffel.
    const out: string[] = [];
    const longest = Math.max(0, ...stay.map((g) => g.length));
    for (let j = 0; out.length < down && j < longest; j++) {
      for (const g of stay) {
        const id = g[g.length - 1 - j];
        if (id && out.length < down && g.length - j > 2) out.push(id);
      }
    }
    const outSet = new Set(out);
    let inn: string[];
    if (last) {
      ensureCountryPool(w, euroClubs, c, endYear, r, inBelow + 4);
      const pool = (c.pool ?? []).filter((id) => euroClubs[id] && !fromAbove.includes(id));
      inn = pool.map((id) => ({ id, v: str(id) + gauss(r) * 3 })).sort((a, b) => b.v - a.v).slice(0, inBelow).map((x) => x.id);
      const innSet = new Set(inn);
      c.pool = [...pool.filter((id) => !innSet.has(id)), ...out];
    } else inn = pickPromoted(below!, inBelow, str);
    // Reihenfolge = Vorrang bei der Verteilung: Verbliebene behalten ihre Staffel, dann Absteiger, dann Aufsteiger.
    const cands = [...stay.flat().filter((id) => !outSet.has(id)), ...fromAbove, ...inn];
    const n = sizes.length;
    const fitted = fit(sizes, Math.min(cands.length, T + 2 * n));
    const { buckets, overflow } = assignToGroups(cands, fitted, n > 1 ? zonePref(c, euroClubs, n, endYear, stay) : () => 0);
    setDeepGroups(c, k, buckets);
    fromAbove = [...out, ...overflow];
    upTaken = new Set(inn);
    if (last && overflow.length) c.pool = [...(c.pool ?? []), ...overflow];
  }
  ensureCountryPool(w, euroClubs, c, endYear, r, 10);
  trimPool(w, euroClubs, c, endYear);
}

/** Stärke-Entwicklung der tieferen Ebenen (wie die Ligen, Ziel unterhalb der 2. Liga). */
export function deepStrength(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, endYear: number, r: () => number): void {
  if (!c.deep?.length) return;
  const level = countryLevel(c, endYear);
  c.deep.forEach((d, k) => {
    for (const id of d.ids) {
      const club = euroClubs[id], m = w.meta[id];
      if (!club || !m) continue;
      m.home = clamp(m.home + gauss(r) * 0.02, 0.03, 0.6);
      m.size = clamp(m.size + (m.home - m.size) * 0.06 + gauss(r) * 0.01, 0.02, 0.45);
      m.cycle = m.cycle * 0.85 + gauss(r) * 2.6;
      const target = softClubStrength(deepTarget(level, m.size, k + 3) + m.cycle);
      club.strength = Math.round(clamp(club.strength + (target - club.strength) * 0.4 + gauss(r) * 1.5, 35, 82));
    }
  });
}

/** Staatenteilung: tiefere Ebenen des aufgelösten Landes entfallen (Vereine aus der Welt). */
export function dropDeep(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry): void {
  for (const id of deepIdsOf(c)) { delete w.meta[id]; delete euroClubs[id]; }
  delete c.deep;
  delete c.depth;
}

// =============================================================================
// 2. EBENE DER HINTERGRUND-WELT MIT MEHREREN STAFFELN (Wunsch Pascal: „Mehrere zweite
// Ligen im Ausland sollen alle simuliert werden.“)
// -----------------------------------------------------------------------------
// `WorldCountry.tiers[1]` hält die ganze 2. Ebene, bei mehreren Staffeln Staffel für Staffel
// hintereinander; `WorldCountry.groups` die Größen (fehlt = eingleisig, alte Spielstände).
// Jede Staffel spielt als eigene Liga (game/worldLeagues.ts). Saisonwechsel `exchangeSecond`:
//  • Aufsteiger in historischer Zahl: zuerst die Staffelsieger, dann die Zweiten … (innerhalb
//    einer Runde die stärksten; weniger Aufsteiger als Staffeln = die stärksten Sieger);
//  • Absteiger in den Unterbau reihum vom Tabellenende jeder Staffel, Nachrücker = stärkste
//    Amateurvereine (mit Zufall);
//  • alle Vereine der neuen 2. Ebene werden auf die Staffeln der NEUEN Saison verteilt
//    (data/world/secondGroups.ts `assignToGroups`: bisherige Staffel, sonst Zone laut Weltdaten
//    bzw. Stadt, sonst die Staffel mit den meisten freien Plätzen) – das deckt Zusammenlegen
//    (Frankreich 1993/94) und Aufteilen (Portugal) in beide Richtungen ab.
// =============================================================================
import type { EuroClub } from '../data/europe';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { assignToGroups, dataZoneOf, splitBySizes } from '../data/world/secondGroups';
import { carriedGroups, worldExchangePlan, worldStructureOfKey } from '../data/world/structure';
import { ensureCountryPool } from './worldCountries';
import { pickPromoted } from './worldDeep';
import { gauss } from './worldRandom';
import type { WorldCountry, WorldState } from './worldTypes';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Staffeln der 2. Ebene eines Landes (eine Liste = eingleisig; leer = keine 2. Liga). */
export function secondGroups(c: WorldCountry): string[][] {
  const t2 = c.tiers[1] ?? [];
  const sz = c.groups;
  if (!sz || sz.length < 2 || sum(sz) !== t2.length) return t2.length ? [t2] : [];
  return splitBySizes(t2, sz);
}

/** 2. Ebene aus Staffeln setzen (`groups` nur bei mehreren Staffeln). */
export function setSecondGroups(c: WorldCountry, groups: string[][]): void {
  const list = groups.filter((g) => g.length);
  c.tiers[1] = list.flat();
  if (list.length > 1) c.groups = list.map((g) => g.length); else delete c.groups;
  c.tier2 = c.tiers[1].length;
}

/** Wunsch-Staffel eines Vereins bei `n` Staffeln: bisherige Staffel (gleiche Zahl), sonst Zone laut Weltdaten/Stadt. */
export function zonePref(c: WorldCountry, euroClubs: Record<string, EuroClub>, n: number, year: number, prev?: string[][]): (id: string) => number | null {
  const cc = COUNTRY_BY_KEY[c.name]?.cc;
  const prevIdx = new Map<string, number>();
  if (prev && prev.length === n) prev.forEach((g, i) => g.forEach((id) => prevIdx.set(id, i)));
  return (id) => prevIdx.get(id) ?? dataZoneOf(cc, id.startsWith('w_') ? id.slice(2) : null, euroClubs[id]?.city, n, year);
}

/** Staffelgrößen an eine andere Gesamtzahl anpassen (reihum ±1, große Staffeln geben zuerst ab). */
function fitSizes(sizes: number[], total: number): number[] {
  const out = [...sizes];
  let diff = total - sum(out);
  let guard = 0;
  while (diff !== 0 && guard++ < 1000) {
    const order = out.map((v, i) => ({ v, i })).sort((a, b) => (diff > 0 ? a.v - b.v : b.v - a.v) || a.i - b.i);
    const k = order[0].i;
    if (diff < 0 && out[k] <= 2) break;
    out[k] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return out;
}

/**
 * Auf-/Abstieg eines Hintergrund-Landes: `t1` = Endtabelle 1. Liga, `t2g` = Endtabellen der Staffeln
 * der 2. Ebene. Setzt `c.tiers`, `c.groups`, `c.pool` für die Saison mit Startjahr `endYear`.
 */
export function exchangeSecond(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, t1: string[], t2g: string[][], endYear: number, r: () => number,
  /** Endtabellen der 3. Ebene (engine/worldDeep.ts): Aufsteiger kommen dann von dort statt aus dem Unterbau, Absteiger gehen dorthin. */
  below?: string[][]): { out: string[]; inn: string[] } {
  const old = t2g.map((g) => g.length);
  // Datenlücke: mehrgleisige Staffeln der letzten bekannten Saison (ältere Spielstände mit eingleisiger 2. Liga teilen so auf).
  const st0 = worldStructureOfKey(c.name, endYear), cc = COUNTRY_BY_KEY[c.name]?.cc;
  const carry = st0 && !st0.groups && cc ? carriedGroups(cc, endYear) : null;
  const plan = worldExchangePlan(carry ? { ...st0!, groups: carry } : st0, t1.length, old);
  const str = (id: string) => euroClubs[id]?.strength ?? 0;
  const up: string[] = [];
  for (let k = 0; up.length < plan.up1 && k < Math.max(0, ...old); k++) {
    const cand = t2g.map((g) => g[k]).filter(Boolean).sort((a, b) => str(b) - str(a) || a.localeCompare(b));
    for (const id of cand) if (up.length < plan.up1) up.push(id);
  }
  const down = t1.slice(t1.length - plan.down1);
  c.tiers[0] = [...t1.slice(0, t1.length - plan.down1), ...up];
  c.tier1 = c.tiers[0].length;
  const upSet = new Set(up);
  const stay = t2g.map((g) => g.filter((id) => !upSet.has(id)));
  const out: string[] = [];
  let inn: string[] = [];
  const swap = sum(old) >= 8 && (plan.out2 || plan.in2) > 0;
  if (swap && below?.length) {
    const longest = Math.max(0, ...stay.map((g) => g.length));
    for (let k = 0; out.length < plan.out2 && k < longest; k++) {
      for (const g of stay) {
        const id = g[g.length - 1 - k];
        if (id && out.length < plan.out2 && g.length - k > 2) out.push(id);
      }
    }
    inn = pickPromoted(below, plan.in2, str);
  } else if (swap) {
    ensureCountryPool(w, euroClubs, c, endYear, r, plan.in2 + 2);
    const pool = (c.pool ?? []).filter((id) => euroClubs[id]);
    // Reihum vom Tabellenende jeder Staffel (schwächste Staffel zuerst).
    const longest = Math.max(0, ...stay.map((g) => g.length));
    for (let k = 0; out.length < plan.out2 && k < longest; k++) {
      for (const g of stay) {
        const id = g[g.length - 1 - k];
        if (id && out.length < plan.out2 && g.length - k > 2) out.push(id);
      }
    }
    const rank = pool.map((id) => ({ id, v: str(id) + gauss(r) * 3 })).sort((a, b) => b.v - a.v);
    inn = rank.slice(0, plan.in2).map((x) => x.id);
    const innSet = new Set(inn);
    c.pool = [...pool.filter((id) => !innSet.has(id)), ...out];
  }
  const outSet = new Set(out);
  // Reihenfolge = Vorrang bei der Verteilung: Verbliebene behalten ihre Staffel, dann Absteiger, dann Nachrücker.
  const cands = [...stay.flat().filter((id) => !outSet.has(id)), ...down, ...inn];
  const n = plan.sizes.length;
  if (n <= 1) setSecondGroups(c, [cands]);
  else {
    const sizes = fitSizes(plan.sizes, cands.length);
    const { buckets, overflow } = assignToGroups(cands, sizes, zonePref(c, euroClubs, n, endYear, stay));
    setSecondGroups(c, buckets);
    if (overflow.length) c.pool = [...(c.pool ?? []), ...overflow];
  }
  if (swap && !below?.length) ensureCountryPool(w, euroClubs, c, endYear, r); // wieder mindestens 10 (wie beim Laden, game/loadMigrations.ts)
  return { out: below?.length ? out : [], inn: below?.length ? inn : [] };
}

// =============================================================================
// JUGENDWETTBEWERBE — Teamstärke, Aufstellung, Spiel-Simulation, Statistik
// -----------------------------------------------------------------------------
// Leichtgewichtig: keine Match-Engine. Stärke eines Jugendteams
//   • echte Mannschaft (≥ 11 Spieler der Altersklasse, v. a. der eigene Verein):
//     Schnitt der besten Elf,
//   • sonst aus Ausbildungsqualität/Ruf (youthInvest) bzw. Vereinsstärke, geeicht am
//     Schnitt der echten Jugendspieler der KI-Vereine; ihre echten Talente spielen mit,
//     der Rest der Elf sind erzeugte Spieler (Name/ID deterministisch, nicht gespeichert).
// Tore Poisson-verteilt nach Stärkeunterschied; Torschützen/Vorlagen/Karten werden
// nach Position und Stärke verteilt.
// =============================================================================
import { isLowKey } from '../../data/youthLowerLeagues';
import { CITY_LV, LV_REGION, type Lv, type YcCls, type YcKey, type YcRegion } from '../../data/youthCompetitions';
import { ORIGINS, makeName, pickOrigin } from '../../data/origins';
import type { CompTuple } from '../../engine/compStats';
import { isForeignId } from '../../engine/world';
import { youthAgeClass, type Player, type Position } from '../../types';
import type { Game } from '../state';
import type { YouthCompsState } from './types';

export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Vereine: Ebene, Region
// -----------------------------------------------------------------------------
export function tierOfClub(g: Game, id: string): number {
  const s = g.simClubs[id];
  if (s) return s.tier;
  if (g.clubs[id]) return g.leagues.playerDivision.tier;
  return 99;
}
export const isDdr = (g: Game, id: string) => tierOfClub(g, id) >= 100;

export function cityOf(g: Game, id: string): string {
  return g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '';
}

export function lvOf(g: Game, id: string): Lv {
  const lv = CITY_LV[cityOf(g, id)];
  if (lv) return lv;
  const grp = g.simClubs[id]?.group;
  return grp === 'sued' ? 'BY' : grp === 'nordost' ? 'SN' : grp === 'west' ? 'NR' : 'NI';
}
export const regionOf = (g: Game, id: string): YcRegion => LV_REGION[lvOf(g, id)];

/** Deutsche Vereine mit Jugend (ohne Pokal-Amateure/Ausland), getrennt nach West/DDR. */
export function germanPool(g: Game, ddr: boolean): string[] {
  const out: string[] = [];
  for (const c of Object.values(g.clubs)) if (!c.id.startsWith('am') && !isForeignId(c.id) && isDdr(g, c.id) === ddr) out.push(c.id);
  for (const s of Object.values(g.simClubs)) if (s.tier < 200 && (s.tier >= 100) === ddr && !g.clubs[s.id]) out.push(s.id);
  return out;
}

// -----------------------------------------------------------------------------
// Stärke
// -----------------------------------------------------------------------------
function youthOf(g: Game, clubId: string, cls: YcCls): Player[] {
  const c = g.clubs[clubId];
  if (!c) return [];
  const out: Player[] = [];
  for (const id of c.youthPlayerIds) {
    const p = g.youthPlayers[id];
    if (p && youthAgeClass(p.age) === cls) out.push(p);
  }
  return out.sort((a, b) => b.overall - a.overall);
}

/** Bezugswert: Schnitt der echten Jugendspieler der Altersklasse bei KI-Vereinen. */
export function refStrength(g: Game, cls: YcCls): number {
  let sum = 0, n = 0;
  for (const c of Object.values(g.clubs)) {
    if (c.id === g.managedClubId || c.id.startsWith('am')) continue;
    for (const p of youthOf(g, c.id, cls)) { sum += p.overall; n++; }
  }
  return n >= 6 ? sum / n : cls === 'A' ? 52 : 46;
}

/** Stärke für die Saison (ohne echte volle Mannschaft). */
export function modelStrength(g: Game, id: string, cls: YcCls, ref: number, seed: string): number {
  const noise = (rng32(hash32(`${seed}|${id}|${cls}`))() - 0.5) * 5;
  const eu = g.euroClubs?.[id];
  if (eu) return ref + (eu.strength - 72) * 0.35 + 1 + noise;
  const c = g.clubs[id];
  const s = g.simClubs[id];
  const q = c?.youthInvest?.quality ?? clamp(((s?.strength ?? 55) - 48) * 1.6, 5, 55);
  const rep = c?.reputation ?? (s?.strength ?? 55);
  let v = ref + 0.12 * (q - 35) + 0.08 * (rep - 70) + noise;
  if (s && s.tier >= 100 && s.tier < 109) v += 1.5; // DDR: staatlich geförderte Leistungszentren
  const real = youthOf(g, id, cls);
  if (real.length) v = v * 0.75 + (real.slice(0, 3).reduce((a, p) => a + p.overall, 0) / Math.min(3, real.length)) * 0.25;
  return Math.round(v * 10) / 10;
}

// -----------------------------------------------------------------------------
// Aufstellung (echte + erzeugte Spieler)
// -----------------------------------------------------------------------------
export interface YcSlot { id: string; pos: Position; ovr: number; real: boolean }
const TEMPLATE: Position[] = ['TW', 'IV', 'IV', 'RV', 'LV', 'DM', 'ZM', 'OM', 'RA', 'LA', 'MS'];

export function virtualId(clubId: string, cls: YcCls, y0: number, i: number): string {
  return `yv.${clubId}.${cls}.${y0}.${i}`;
}
export const isVirtual = (pid: string) => pid.startsWith('yv.');

const COUNTRY_ORIGIN: Record<string, string> = {
  Spanien: 'esp', England: 'eng', Frankreich: 'fra', Italien: 'ita', Niederlande: 'ned', Belgien: 'bel', Portugal: 'por',
  Schottland: 'sco', Griechenland: 'gre', Tuerkei: 'tur', Türkei: 'tur', Oesterreich: 'aut', Österreich: 'aut', Schweiz: 'sui',
  Polen: 'pol', Ungarn: 'hun', Rumaenien: 'yug', Jugoslawien: 'yug', Serbien: 'srb', Kroatien: 'cro', Sowjetunion: 'rus',
  Russland: 'rus', Ukraine: 'rus', Tschechoslowakei: 'cze', Tschechien: 'cze', Schweden: 'swe', Daenemark: 'den', Dänemark: 'den', Norwegen: 'nor',
};

/** Name, Verein, Position eines erzeugten Spielers (deterministisch aus der ID). */
export function virtualPerson(g: Game, pid: string): [string, string, string] {
  const parts = pid.split('.');
  const i = Number(parts[parts.length - 1]);
  const y0 = Number(parts[parts.length - 2]);
  const club = parts.slice(1, parts.length - 3).join('.');
  const rnd = rng32(hash32(pid));
  const country = g.euroClubs?.[club]?.country;
  const o = (country && ORIGINS[COUNTRY_ORIGIN[country] ?? '']) || pickOrigin(y0 + 18, rnd, !country);
  // Ohne Jahrgang: die Namen werden bei jedem Anzeigen neu aus der ID gebildet und
  // dürfen sich in bestehenden Spielständen nicht ändern.
  const n = makeName(o, rnd);
  return [`${n.firstName} ${n.lastName}`, club, TEMPLATE[i] ?? 'ZM'];
}

/** Elf eines Jugendteams; echte Spieler zuerst (Torhüter garantiert). */
/** Kleinfeld: welche Plätze der Elfer-Vorlage besetzt sind (Index in TEMPLATE). */
const SLOT_IDX: Record<number, number[]> = { 11: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9: [0, 1, 2, 3, 5, 6, 7, 8, 10], 7: [0, 1, 3, 6, 7, 8, 10] };

export function lineupOf(g: Game, st: YouthCompsState, clubId: string, cls: YcCls, y0: number, n = 11): { slots: YcSlot[]; strength: number } {
  const real = youthOf(g, clubId, cls);
  const base = st.str[`${clubId}|${cls}`] ?? 45;
  const idx = SLOT_IDX[n] ?? SLOT_IDX[11];
  const virt = (i: number): YcSlot => ({ id: virtualId(clubId, cls, y0, i), pos: TEMPLATE[i], ovr: Math.round(base + ((i * 7) % 5) - 2), real: false });
  const tw = real.find((p) => p.naturalPosition === 'TW');
  const slots: YcSlot[] = [tw ? { id: tw.id, pos: 'TW', ovr: tw.overall, real: true } : virt(0)];
  for (const p of real) { if (slots.length >= idx.length) break; if (p.naturalPosition !== 'TW') slots.push({ id: p.id, pos: p.naturalPosition, ovr: p.overall, real: true }); }
  for (let k = 1; slots.length < idx.length; k++) slots.push(virt(idx[k]));
  const full = slots.every((s) => s.real);
  const strength = full ? slots.reduce((a, s) => a + s.ovr, 0) / slots.length : base;
  return { slots, strength };
}

// -----------------------------------------------------------------------------
// Spiel
// -----------------------------------------------------------------------------
function poisson(l: number, r: () => number): number {
  const L = Math.exp(-l);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L && k < 15);
  return k - 1;
}

/** Tore eines Jugendspiels (mehr Tore als bei den Profis). */
export function simGoals(hs: number, as: number, neutral: boolean, r: () => number = Math.random, base = 1.65): [number, number] {
  const d = clamp(hs - as, -20, 20) * 0.07;
  const home = neutral ? 0 : 0.12;
  return [poisson(base * Math.exp(d / 2 + home), r), poisson(base * Math.exp(-d / 2 - (neutral ? 0 : 0.05)), r)];
}

const GOAL_W: Partial<Record<Position, number>> = { MS: 5, HS: 4.5, RA: 3.5, LA: 3.5, OM: 3, RM: 2.4, LM: 2.4, ZM: 1.6, DM: 1, RV: 0.8, LV: 0.8, IV: 0.6, LIB: 0.6, TW: 0.02 };
const ASSIST_W: Partial<Record<Position, number>> = { OM: 4, RA: 4, LA: 4, RM: 4, LM: 4, ZM: 3, HS: 3, MS: 2, DM: 1.5, RV: 1.5, LV: 1.5, IV: 0.6, LIB: 0.8, TW: 0.1 };
const CARD_W: Partial<Record<Position, number>> = { IV: 3, DM: 3, RV: 2.5, LV: 2.5, LIB: 2.5, ZM: 2, RM: 1.5, LM: 1.5, OM: 1, RA: 1, LA: 1, MS: 1.2, HS: 1, TW: 0.4 };

function pick(slots: YcSlot[], w: Partial<Record<Position, number>>, r: () => number, skip?: string): YcSlot | null {
  let tot = 0;
  const ws = slots.map((s) => { const v = s.id === skip ? 0 : (w[s.pos] ?? 1) * Math.pow(Math.max(20, s.ovr) / 50, 2); tot += v; return v; });
  if (tot <= 0) return null;
  let x = r() * tot;
  for (let i = 0; i < slots.length; i++) { x -= ws[i]; if (x <= 0) return slots[i]; }
  return slots[slots.length - 1];
}

function tup(st: YouthCompsState, key: YcKey, pid: string): CompTuple {
  const m = (st.stats[key] ??= {});
  return (m[pid] ??= [0, 0, 0, 0, 0, 0, 0]);
}

function remember(g: Game, st: YouthCompsState, s: YcSlot, clubId: string): void {
  if (!s.real || st.people[s.id]) return;
  const p = g.youthPlayers[s.id] ?? g.players[s.id];
  if (p) st.people[s.id] = [p.fullName, clubId, p.naturalPosition];
}

/** Verbucht Einsätze, Tore, Vorlagen, Karten und Zu-null-Spiele einer Mannschaft. */
export function recordSide(
  g: Game, st: YouthCompsState, key: YcKey, clubId: string, slots: YcSlot[], goals: number, conceded: number, year: number, r: () => number = Math.random,
  extraTime = false, cards = 1,
): void {
  if (!extraTime) for (const s of slots) if (s.real) { tup(st, key, s.id)[0]++; remember(g, st, s, clubId); }
  for (let i = 0; i < goals; i++) {
    const sc = pick(slots, GOAL_W, r);
    if (!sc) continue;
    tup(st, key, sc.id)[1]++; remember(g, st, sc, clubId);
    if (r() < 0.72) { const as = pick(slots, ASSIST_W, r, sc.id); if (as) { tup(st, key, as.id)[2]++; remember(g, st, as, clubId); } }
  }
  if (extraTime) return;
  const yellows = cards > 0 ? poisson(1.25 * cards, r) : 0;
  for (let i = 0; i < yellows; i++) { const p = pick(slots, CARD_W, r); if (p) { tup(st, key, p.id)[3]++; remember(g, st, p, clubId); } }
  if (year >= 1991 && r() < 0.035 * cards) { const p = pick(slots, CARD_W, r); if (p) { tup(st, key, p.id)[4]++; remember(g, st, p, clubId); } }
  if (r() < 0.025 * cards) { const p = pick(slots, CARD_W, r); if (p) { tup(st, key, p.id)[5]++; remember(g, st, p, clubId); } }
  if (conceded === 0) { const k = slots.find((s) => s.pos === 'TW'); if (k) { tup(st, key, k.id)[6]++; remember(g, st, k, clubId); } }
}

/** Hält die Statistik klein: erzeugte Spieler außerhalb der Top 40 jeder Kategorie fallen weg. */
/** Schalter für Tests: Statistik ausdünnen; C- bis G-Jugend aufsetzen (Messung vorher/nachher). */
export const ycOpts = { prune: true, lower: true };
export function pruneStats(st: YouthCompsState): void {
  if (!ycOpts.prune) return;
  for (const [key, m] of Object.entries(st.stats)) {
    if (!m) continue;
    const keep = new Set<string>();
    const virt = Object.entries(m).filter(([pid]) => isVirtual(pid));
    // C–F-Staffeln (eine Staffel): früher und knapper ausdünnen.
    const low = isLowKey(key);
    const lim = low ? 60 : 300, top = low ? 18 : 40;
    if (virt.length < lim) continue;
    for (const idx of [1, 2, 3, 6]) virt.sort((a, b) => b[1][idx] - a[1][idx]).slice(0, top).forEach(([pid]) => keep.add(pid));
    virt.sort((a, b) => b[1][1] + b[1][2] - a[1][1] - a[1][2]).slice(0, top).forEach(([pid]) => keep.add(pid));
    virt.sort((a, b) => b[1][4] + b[1][5] - a[1][4] - a[1][5]).slice(0, top).forEach(([pid]) => keep.add(pid));
    for (const [pid] of virt) if (!keep.has(pid)) delete m[pid];
  }
}

/** Elfmeterschießen (leicht stärkeabhängig). */
export function shootout(hs: number, as: number, r: () => number = Math.random): [number, number] {
  let h = 0, a = 0;
  const ph = 0.76 + clamp(hs - as, -10, 10) * 0.004, pa = 0.76 - clamp(hs - as, -10, 10) * 0.004;
  for (let i = 0; i < 5; i++) { if (r() < ph) h++; if (r() < pa) a++; }
  while (h === a) { const x = r() < ph, y = r() < pa; if (x) h++; if (y) a++; if (x !== y) break; }
  return [h, a];
}

// =============================================================================
// NATIONALMANNSCHAFTEN – Spielerpool, Aufgebote, Stärke (Wunsch Pascal, #36).
// Kandidaten = alle vollen Spieler der Spielwelt (g.players, im Kader eines
// Vereins) + Weltspieler (game/worldPool.ts) nach Nationalität; zerfallene
// Nationen gehen an den Nachfolger (URS → RUS …). Der Bundestrainer beruft die
// Besten (3 Torhüter, Rest nach Stärke, leichte persönliche Note je Spieler).
// Stärke einer Nation = Startelf aus dem Aufgebot, gemischt mit der Grundstärke
// (data/nationalTeams.ts) – je weniger Spieler die Spielwelt kennt, desto mehr.
// =============================================================================
import type { Position } from '../../types';
import type { Game } from '../state';
import { NATION_BY_CODE, NATIONS, SUCCESSOR, baseStrength, nationExists, squadSizeOf } from '../../data/nationalTeams';
import { WP_FIELD as W } from '../worldPool';
import { hashStr } from '../../engine/leagues';

export interface Cand { id: string; name: string; nat: string; pos: Position; ov: number; age: number; clubId: string; full: boolean }

const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);

/** Nation, für die ein Kürzel im Jahr spielt (Nachfolger bei zerfallenen Staaten). */
export function nationFor(code: string, year: number): string | null {
  let c = code;
  for (let i = 0; i < 3; i++) {
    const n = NATION_BY_CODE[c];
    if (n && nationExists(n, year)) return c;
    if (n && n.from != null && year < n.from) return null;
    c = SUCCESSOR[c] ?? '';
    if (!c) return null;
  }
  return null;
}

let cache: { key: string; by: Map<string, Cand[]> } | null = null;

/** Alle Kandidaten je Nation (zwischengespeichert je Tag). */
export function candidatesByNation(g: Game, date = g.calendar.currentDate): Map<string, Cand[]> {
  const key = `${date}|${Object.keys(g.players).length}|${g.worldPool?.p.length ?? 0}`;
  if (cache?.key === key) return cache.by;
  const year = yearOf(date);
  const by = new Map<string, Cand[]>();
  const add = (c: Cand) => { const l = by.get(c.nat); if (l) l.push(c); else by.set(c.nat, [c]); };
  for (const p of Object.values(g.players)) {
    if (!p.clubId || !g.clubs[p.clubId] || p.age < 17 || p.age > 38) continue;
    const nat = nationFor(p.nationality, year);
    if (!nat) continue;
    add({ id: p.id, name: p.fullName, nat, pos: p.naturalPosition, ov: p.overall, age: p.age, clubId: p.clubId, full: true });
  }
  for (const w of g.worldPool?.p ?? []) {
    if (w[W.youth]) continue;
    const age = year - w[W.born];
    if (age < 17 || age > 37) continue;
    const nat = nationFor(w[W.nat], year);
    if (!nat) continue;
    add({ id: w[W.id], name: `${w[W.first]} ${w[W.last]}`, nat, pos: w[W.pos], ov: w[W.ov], age, clubId: w[W.club], full: false });
  }
  for (const l of by.values()) l.sort((a, b) => b.ov - a.ov);
  cache = { key, by };
  return by;
}

/** Persönliche Note des Bundestrainers (fest je Spieler und Jahr, ±2). */
const taste = (id: string, year: number) => ((hashStr(`${id}|${year}|nt`) % 41) - 20) / 10;

/** Aufgebot einer Nation (3 Torhüter + Feldspieler); `exclude` = verletzt/nicht verfügbar. */
export function pickSquad(g: Game, nat: string, date: string, size = squadSizeOf(yearOf(date)), exclude?: (c: Cand) => boolean): Cand[] {
  const year = yearOf(date);
  const all = (candidatesByNation(g, date).get(nat) ?? []).filter((c) => !exclude?.(c));
  const score = (c: Cand) => c.ov + taste(c.id, year) - (c.age >= 34 ? (c.age - 33) * 1.5 : 0);
  const sorted = [...all].sort((a, b) => score(b) - score(a));
  const gks = sorted.filter((c) => c.pos === 'TW').slice(0, 3);
  const field = sorted.filter((c) => c.pos !== 'TW').slice(0, size - gks.length);
  return [...gks, ...field];
}

/** Startelf eines Aufgebots: bester Torwart + zehn beste Feldspieler. */
export function startingXI(squad: Cand[]): Cand[] {
  const gk = squad.filter((c) => c.pos === 'TW').sort((a, b) => b.ov - a.ov)[0];
  const field = squad.filter((c) => c.pos !== 'TW').sort((a, b) => b.ov - a.ov).slice(0, 10);
  return gk ? [gk, ...field] : field;
}

/** Stärke einer Nation aus dem Aufgebot (Lücken = Grundstärke − 3). */
export function nationStrength(nat: string, squad: Cand[], year: number, depth = squad.length): number {
  const def = NATION_BY_CODE[nat];
  const base = def ? baseStrength(def, year) : 60;
  const xi = startingXI(squad);
  const known = xi.reduce((a, c) => a + c.ov, 0) + Math.max(0, 11 - xi.length) * (base - 3);
  const kAvg = known / 11;
  // Tiefer Pool (Liga in der Spielwelt) = aussagekräftig; sonst nur Legionäre → Grundstärke zählt mehr.
  const w = (depth >= 40 ? 0.7 : 0.25) * Math.min(1, xi.length / 11);
  return Math.round((kAvg * w + base * (1 - w)) * 10) / 10;
}

/** Alle bestehenden Nationen im Jahr (ohne gesperrte). */
export function activeNations(year: number): string[] {
  return NATIONS.filter((n) => nationExists(n, year) && !(n.bannedFrom && year >= n.bannedFrom)).map((n) => n.code);
}

/** Stärke aller Nationen (zwischengespeichert je Tag). */
let rankCache: { key: string; v: Map<string, number> } | null = null;
export function allStrengths(g: Game, date = g.calendar.currentDate): Map<string, number> {
  const key = `${date}|${Object.keys(g.players).length}`;
  if (rankCache?.key === key) return rankCache.v;
  const year = yearOf(date);
  const v = new Map<string, number>();
  const by = candidatesByNation(g, date);
  for (const nat of activeNations(year)) v.set(nat, nationStrength(nat, pickSquad(g, nat, date), year, by.get(nat)?.length ?? 0));
  rankCache = { key, v };
  return v;
}

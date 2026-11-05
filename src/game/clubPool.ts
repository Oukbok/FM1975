// =============================================================================
// VEREINS-POOL: Vereine unterhalb der simulierten Ligen (Amateurligen)
// -----------------------------------------------------------------------------
// Frühere Bundesligisten/Zweitligisten (Oberhausen, Neunkirchen, Berlin Neukölln …)
// und Amateur-Spitzenvereine leben als schlanke Sim-Vereine im Pool (simClubs mit
// tier 9 = West bzw. tier 109 = DDR, data/history/historicClubs.ts). Beim
// Saisonwechsel tauschen die Schlechtesten der untersten simulierten West-Liga mit
// den stärksten Pool-Vereinen ihrer Region (2 Staffeln: je 4, eingleisig: 3, ab
// 3 Staffeln: je 2); in der DDR steigen die zwei Letzten der Oberliga ab, die zwei
// Besten der DDR-Liga auf, und die zwei Letzten der DDR-Liga tauschen mit dem DDR-
// Pool. Ligareformen füllen neue Plätze zuerst aus dem Pool, erst dann mit
// fiktiven Platzhaltern; aus der Pyramide fallende Vereine gehen in den Pool.
// Steigt ein Pool-Verein in die Spielerliga auf, erhält er wie jeder Aufsteiger
// einen vollen Kader (data/generate.ts → buildProClub).
// Spielstand: keine neuen Felder außer der Pool-Vereine in `simClubs` – alte Stände
// bekommen sie per migrateLeaguePool (App.tsx) nachgerüstet.
// =============================================================================
import { DDR_LIGA_SEEDS, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { DDR_POOL_TIER, POOL_TIER, ddrPoolSeeds, westPoolSeeds } from '../data/history/historicClubs';
import { HISTORIC_SEASONS, historicDivisions, historicFinal, HIST_RELEGATED } from '../data/history/seasons';
import type { CurrentDivision, TransitionResult } from '../data/reforms';
import { seasonStartYear } from '../data/timeline';
import { DivisionMeta, LeagueGroup, SimClub, divisionLabel, hashStr, mulberry32 } from '../engine/leagues';
import { addHistoricSeason, addHistoricTitle } from './clubRecords';
import { ensureArchive, leagueArchive } from './leagueArchive';
import type { Game } from './state';

export const isPoolClub = (s: SimClub | undefined) => !!s && (s.tier === POOL_TIER || s.tier === DDR_POOL_TIER);

function reunified(g: Game): boolean {
  return g.appliedReforms.includes('reform-1991-reunification') || seasonStartYear(g.season) >= 1991;
}

function poolOf(g: Game, ddr: boolean): SimClub[] {
  const tier = ddr ? DDR_POOL_TIER : POOL_TIER;
  return Object.values(g.simClubs).filter((s) => s.tier === tier);
}

/** Pool-Kandidaten nach Stärke + Zufall, bevorzugt aus `group`. */
function pickFromPool(pool: SimClub[], n: number, group: LeagueGroup, rnd: () => number, taken: Set<string>): string[] {
  const score = new Map(pool.map((s) => [s.id, s.strength + rnd() * 6]));
  const free = pool.filter((s) => !taken.has(s.id));
  const sorted = (xs: SimClub[]) => xs.sort((a, b) => score.get(b.id)! - score.get(a.id)!);
  const ordered = group ? [...sorted(free.filter((s) => s.group === group)), ...sorted(free.filter((s) => s.group !== group))] : sorted(free);
  const out = ordered.slice(0, n).map((s) => s.id);
  out.forEach((id) => taken.add(id));
  return out;
}

// -----------------------------------------------------------------------------
// Ligareformen: Platzhalter durch Pool-Vereine ersetzen, Absteiger in den Pool
// -----------------------------------------------------------------------------
export function absorbPlaceholders(g: Game, res: TransitionResult, season: string): void {
  if (!res.placeholders.length) return;
  const rnd = mulberry32(hashStr(`pool-ph:${season}`));
  const pool = poolOf(g, false);
  const taken = new Set<string>();
  const keep: SimClub[] = [];
  for (const ph of res.placeholders) {
    const [id] = pickFromPool(pool, 1, ph.group, rnd, taken);
    const div = res.divisions.find((d) => d.ids.includes(ph.id));
    if (!id || !div) { keep.push(ph); continue; }
    div.ids[div.ids.indexOf(ph.id)] = id;
  }
  res.placeholders = keep;
}

// -----------------------------------------------------------------------------
// Regulärer Tausch: unterste West-Liga ↔ Pool
// -----------------------------------------------------------------------------
/**
 * Tauscht die Schlechtesten der untersten West-Liga gegen Pool-Vereine. Gibt die
 * IDs zurück, die in den Pool wechseln (Ebene wird nach dem Kader-Abgleich gesetzt,
 * settlePool). Nicht in Reform-Saisons (die Reform regelt die Besetzung selbst).
 */
export function poolExchange(
  g: Game, membership: Record<string, { ids: string[]; meta: DivisionMeta }>, current: CurrentDivision[], season: string, protectedId: string,
): string[] {
  const west = Object.values(membership).filter((m) => m.meta.tier < 100);
  if (!west.length) return [];
  const lowest = Math.max(...west.map((m) => m.meta.tier));
  const divs = west.filter((m) => m.meta.tier === lowest);
  const k = divs.length >= 3 ? 2 : divs.length === 2 ? 4 : 3;
  const rnd = mulberry32(hashStr(`pool:${season}`));
  const pool = poolOf(g, false);
  const taken = new Set<string>();
  const out: string[] = [];
  for (const m of divs) {
    const cur = current.find((c) => c.id === m.meta.id);
    if (!cur) continue;
    const down = [...cur.orderedIds].reverse().filter((id) => m.ids.includes(id) && id !== protectedId).slice(0, k);
    const up = pickFromPool(pool, down.length, m.meta.group, rnd, taken);
    const n = Math.min(down.length, up.length);
    for (let i = 0; i < n; i++) {
      m.ids[m.ids.indexOf(down[i])] = up[i];
      out.push(down[i]);
    }
  }
  return out;
}

/** In den Pool gewechselte Vereine einordnen (nach dem Kader-Abgleich in startNextSeason). */
export function settlePool(g: Game, ids: string[]): void {
  const ddrOpen = !reunified(g);
  for (const id of ids) {
    const s = g.simClubs[id];
    if (!s) continue;
    s.tier = s.ddr && ddrOpen ? DDR_POOL_TIER : POOL_TIER;
    if (s.tier === POOL_TIER && s.ddr) s.group = 'nordost';
    s.strength = Math.max(40, s.strength - 2);
  }
}

/** Pool-Vereine entwickeln sich langsam auf ein Amateur-Niveau unterhalb der untersten Liga. */
export function poolDrift(g: Game, season: string): void {
  const avg = (ids: string[]) => ids.length ? ids.reduce((s, id) => s + (g.simClubs[id]?.strength ?? 55), 0) / ids.length : 55;
  const west = g.leagues.otherDivisions.filter((d) => d.tier < 100);
  const lowest = west.length ? Math.max(...west.map((d) => d.tier)) : 2;
  const baseW = avg(west.filter((d) => d.tier === lowest).flatMap((d) => d.clubIds)) - 6;
  const ddrLiga = g.leagues.otherDivisions.find((d) => d.tier === 102);
  const baseD = ddrLiga ? avg(ddrLiga.clubIds) - 4 : baseW;
  for (const s of Object.values(g.simClubs)) {
    if (!isPoolClub(s)) continue;
    const rnd = mulberry32(hashStr(`drift:${season}:${s.id}`));
    const base = s.tier === DDR_POOL_TIER ? baseD : baseW;
    s.strength = Math.round(Math.max(38, Math.min(72, s.strength + (base - s.strength) * 0.25 + (rnd() - 0.5) * 5)));
  }
}

// -----------------------------------------------------------------------------
// DDR: Auf-/Abstieg Oberliga ↔ DDR-Liga ↔ DDR-Pool (bis 1990/91)
// -----------------------------------------------------------------------------
export function ddrExchange(g: Game, orders: { id: string; tier: number; orderedIds: string[] }[], season: string): Record<string, string[]> {
  const ober = orders.find((d) => d.tier === 101);
  const liga = orders.find((d) => d.tier === 102);
  const out: Record<string, string[]> = {};
  if (!ober || !liga) return out;
  const down = ober.orderedIds.slice(-2);
  const up = liga.orderedIds.slice(0, 2);
  const newOber = ober.orderedIds.filter((id) => !down.includes(id)).concat(up);
  let newLiga = liga.orderedIds.filter((id) => !up.includes(id)).concat(down);
  const rnd = mulberry32(hashStr(`ddrpool:${season}`));
  const toPool = liga.orderedIds.filter((id) => !up.includes(id)).slice(-2);
  const fromPool = pickFromPool(poolOf(g, true), toPool.length, 'nordost', rnd, new Set());
  for (let i = 0; i < Math.min(toPool.length, fromPool.length); i++) {
    newLiga = newLiga.map((id) => (id === toPool[i] ? fromPool[i] : id));
    const s = g.simClubs[toPool[i]];
    if (s) { s.tier = DDR_POOL_TIER; s.strength = Math.max(40, s.strength - 2); }
  }
  for (const id of newOber) if (g.simClubs[id]) g.simClubs[id].tier = 101;
  for (const id of newLiga) if (g.simClubs[id]) g.simClubs[id].tier = 102;
  out[ober.id] = newOber; out[liga.id] = newLiga;
  return out;
}

/** Wiedervereinigung: DDR-Pool wird Teil des West-Pools (Region Nordost). */
export function mergeDdrPool(g: Game): void {
  for (const s of Object.values(g.simClubs)) if (s.tier === DDR_POOL_TIER) { s.tier = POOL_TIER; s.group = 'nordost'; }
}

// -----------------------------------------------------------------------------
// Neues Spiel / alte Spielstände
// -----------------------------------------------------------------------------
/** Pool-Vereine ergänzen, die der Spielstand noch nicht kennt (idempotent). */
export function ensurePool(g: Game): void {
  const known = (id: string) => !!g.clubs[id] || !!g.simClubs[id];
  const ddrOpen = !reunified(g);
  for (const s of westPoolSeeds()) if (!known(s.id)) g.simClubs[s.id] = s;
  // DDR: frühere Oberligisten + Oberligisten 1975/76, die alte Spielstände nicht kennen.
  const ddrExtra = [...ddrPoolSeeds(), ...DDR_OBERLIGA_SEEDS, ...DDR_LIGA_SEEDS].filter((s) => !s.id.startsWith('ddr-li-ph'));
  for (const s0 of ddrExtra) {
    if (known(s0.id)) continue;
    const s: SimClub = { ...s0, colors: { ...s0.colors }, tier: ddrOpen ? DDR_POOL_TIER : POOL_TIER, group: 'nordost', strength: Math.min(s0.strength, 60) };
    g.simClubs[s.id] = s;
  }
}

/** Historie 1963/64–1974/75 in die Vereins-Historie (Endplätze, Titel) übernehmen. */
export function seedHistoricRecords(g: Game): void {
  const arch = ensureArchive(g);
  if (arch.histSeeded) return;
  for (const season of HISTORIC_SEASONS) {
    for (const d of historicDivisions(season)) {
      const ids = d.rows.map((r) => r[0]);
      const label = d.tier === 101 ? 'DDR-Oberliga' : divisionLabel(d.tier, d.group);
      addHistoricSeason(g, season, label, d.tier, ids);
      if (d.tier === 1) addHistoricTitle(g, ids[0], 'meister', season);
      if (d.tier === 101) addHistoricTitle(g, ids[0], 'ddr', season);
    }
    const cup = historicFinal(season, 'cup');
    if (cup) addHistoricTitle(g, cup.winner, 'pokal', season);
    for (const k of ['ec', 'cwc', 'uefa'] as const) {
      const f = historicFinal(season, k);
      // Messepokal (bis 1970/71) zählt nicht als UEFA-Titel; deutsche/DDR-Sieger eintragen.
      if (f && !f.winner.startsWith('eu_') && !f.winner.startsWith('x_') && !(k === 'uefa' && f.note)) addHistoricTitle(g, f.winner, k, season);
    }
  }
  arch.histSeeded = true;
}

/** Aufruf beim Laden (App.tsx) und beim neuen Spiel (newGame.ts). */
export function migrateLeaguePool(g: Game): void {
  if (!g.simClubs || !g.leagues) return;
  // Anderes Heimatland (Weltdaten): kein deutscher Unterbau, keine deutsche Historie.
  if (g.homeCountry && g.homeCountry !== 'ger') return;
  ensurePool(g);
  seedHistoricRecords(g);
}

/** Absteiger der Historie (für die Tabellenzonen der historischen Saisons). */
export const historicRelegated = HIST_RELEGATED;
export const hasArchive = (g: Game) => !!leagueArchive(g)?.seasons.length;

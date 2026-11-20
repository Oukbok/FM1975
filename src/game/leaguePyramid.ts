// =============================================================================
// ÜBERSICHT LIGENSYSTEM — Datenmodell für <LeaguePyramid>
// -----------------------------------------------------------------------------
// Baut die Ligapyramide für West (BRD), DDR und das Ausland – einmal vor dem
// Spielstart aus den Stammdaten (Assistent „Neues Spiel“) und einmal aus einem
// laufenden Spielstand (Statistiken › Ligensystem). Die Zonen (Meister/Europa,
// Aufstieg, Aufstiegschance, Abstieg) folgen denselben Regeln wie der Saison-
// wechsel: data/reforms.ts (normalTransition: P = Staffeln ≥ 3 ? Staffeln : 3),
// game/clubPool.ts (unterste West-Liga ↔ Pool: 1 Staffel 3, 2 Staffeln je 4,
// ab 3 Staffeln je 2; DDR je 2), engine/world.ts (Ausland: 3 bzw. 2) und
// data/euroFormats.ts `accessSlots` (Europapokal-Startplätze nach Länderrang).
// =============================================================================
import { DDR_LIGA_ID, DDR_LIGA_SEEDS, DDR_OBERLIGA_ID, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { accessSlots } from '../data/euroFormats';
import { allEuroClubs } from '../data/europe';
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../data/generate';
import { DDR_POOL_TIER, POOL_TIER, ddrPoolSeeds, westPoolSeeds } from '../data/history/historicClubs';
import { LEAGUE_REFORMS, structureForSeason } from '../data/reforms';
import { groupOrder } from '../data/regionGeo';
import { seasonStartYear } from '../data/timeline';
import { LeagueGroup, SimClub, simDisplayName } from '../engine/leagues';
import { germanRank, initWorld } from '../engine/world';
import { homeCountryOf, type Game } from './state';
import { COUNTRY_BY_CC, COUNTRY_BY_KEY } from '../data/world/countries';
import { historicTiers, tierText } from '../data/leagueTiers';
import { homeGroupKeys } from '../data/world/secondGroups';
import { leagueLabel, leagueName, structTierName } from '../data/leagueNames';
import { worldStructureOfKey } from '../data/world/structure';
import { secondGroups } from '../engine/worldSecond';
import { deepGroupsOf, updateWorldDepths } from '../engine/worldDeep';
import type { WorldCountry } from '../engine/worldTypes';

export type PyramidSide = 'west' | 'ddr' | 'abroad';
export type PyrZone = 'zone-cl' | 'zone-po' | 'zone-rel' | '';

export interface PyrClub {
  id: string; name: string; shortName: string; city: string;
  colors: { primary: string; secondary: string };
  strength: number;
  /** Ausland: kein Wappen, nur Farbpunkt. */
  dotOnly?: boolean;
}

export interface PyrDivision {
  id: string; name: string; level: number; group: LeagueGroup;
  clubs: PyrClub[];
  /** Reihenfolge: laufende Tabelle oder Stärke-Prognose. */
  order: 'table' | 'strength' | 'pool';
  champion: number; europe: number; up: number; upChance: number; down: number;
  /** Text unter dem Kasten, z. B. „Abstieg in die Amateurligen“. */
  downTo?: string;
  pool?: boolean;
  /** Reine Strukturangabe (Ebene ohne simulierte Vereine, data/leagueTiers.ts): Staffeln/Mannschaften. */
  struct?: string;
}

export interface PyrSystem {
  side: PyramidSide; key: string; title: string;
  levels: PyrDivision[][];
  available: boolean;
  note?: string;
  /** Liga besteht in dieser Saison nicht mehr (DDR nach 1991, aufgelöste Länder) – Anzeige „(Archiv)“. */
  archive?: boolean;
}

export interface PyramidData {
  season: string;
  west: PyrSystem;
  ddr: PyrSystem;
  abroad: PyrSystem[];
  reforms: { season: string; title: string; past: boolean }[];
}

// -----------------------------------------------------------------------------
// Zonen
// -----------------------------------------------------------------------------
/** Zone eines Tabellenplatzes in einer Division. */
export function pyrZone(d: PyrDivision, pos: number): PyrZone {
  const n = d.clubs.length;
  if (d.pool) return '';
  if (pos <= d.champion + d.up) return 'zone-cl';
  if (pos <= d.champion + d.up + d.europe + d.upChance) return 'zone-po';
  if (d.down > 0 && pos > n - d.down) return 'zone-rel';
  return '';
}

/** Auf-/Abstiegszahlen der West-Pyramide wie im Saisonwechsel. */
function westZones(levels: PyrDivision[][], euroChamp: number, euroMore: number): void {
  levels.forEach((lv, i) => {
    const lower = levels[i + 1];
    const isLast = !lower || lower[0]?.pool;
    for (const d of lv) {
      if (d.pool) continue;
      if (i === 0) { d.champion = euroChamp; d.europe = euroMore; }
      if (lower && !isLast) {
        const G = lower.length;
        d.down = G >= 3 ? G : 3;
        d.downTo = `Abstieg in die ${lower[0].name.replace(/ (Nord|Süd|Nordost|West)$/, '')}`;
      } else {
        d.down = lv.length >= 3 ? 2 : lv.length === 2 ? 4 : 3;
        d.downTo = 'Tausch mit dem Amateur-Pool';
      }
      if (i > 0) {
        const G = lv.length;
        d.up = G === 1 ? 3 : 1;
        d.upChance = G === 2 ? 1 : 0; // bester Zweiter beider Staffeln steigt auf
      }
    }
  });
}

// -----------------------------------------------------------------------------
// Hilfen
// -----------------------------------------------------------------------------
const simToPyr = (s: SimClub, year: number): PyrClub => ({
  id: s.id, name: simDisplayName(s, year), shortName: s.shortName, city: s.city, colors: s.colors, strength: s.strength,
});
const div = (id: string, name: string, level: number, group: LeagueGroup, clubs: PyrClub[], order: PyrDivision['order']): PyrDivision => ({
  id, name, level, group, clubs, order, champion: 0, europe: 0, up: 0, upChance: 0, down: 0,
});
const byStrength = (a: PyrClub, b: PyrClub) => b.strength - a.strength || a.name.localeCompare(b.name, 'de');

function poolDiv(clubs: PyrClub[], level: number, ddr: boolean): PyrDivision {
  const d = div(ddr ? 'ddr-pool' : 'pool', ddr ? 'Bezirksligen' : 'Amateurligen', level, null, [...clubs].sort(byStrength), 'pool');
  d.pool = true;
  return d;
}

function euroSlots(year: number, rank: number): { champ: number; more: number } {
  const s = accessSlots(year, rank);
  return { champ: 1, more: Math.max(0, s.ec - 1) + s.uefa };
}

function reformList(season: string): PyramidData['reforms'] {
  const y = seasonStartYear(season);
  return LEAGUE_REFORMS.map((r) => ({ season: r.effectiveSeason, title: r.title.replace('2. 1. Liga', '2. Liga'), past: seasonStartYear(r.effectiveSeason) <= y }));
}

function abroadSystems(countries: { name: string; tiers: string[][]; groups?: number[]; active: boolean; pool?: string[]; deep?: WorldCountry['deep'] }[], clubs: Record<string, { id: string; name: string; shortName: string; city: string; colors: { primary: string; secondary: string }; strength: number }>, ordered: boolean, year: number): PyrSystem[] {
  const gone = countries.filter((c) => !c.active).map((c): PyrSystem => ({
    side: 'abroad', key: c.name, title: c.name, levels: [], available: false, archive: true,
    note: `Die Ligen von ${COUNTRY_BY_KEY[c.name]?.name ?? c.name} gibt es in dieser Saison nicht mehr – Tabellen früherer Saisons unter Statistiken › Liga.`,
  }));
  const pyr = (ids: string[]) => ids.map((id) => clubs[id]).filter(Boolean).map((e) => ({ id: e.id, name: e.name, shortName: e.shortName, city: e.city, colors: e.colors, strength: e.strength, dotOnly: true }));
  return [...gone, ...countries.filter((c) => c.active).map((c) => {
    const lv: PyrDivision[][] = [];
    // Namen in der Landessprache (data/leagueNames.ts): „1. League“, „2. Ligue Nord“ …
    const cc = COUNTRY_BY_KEY[c.name]?.cc;
    if (c.tiers[0]) { const l = pyr(c.tiers[0]); lv.push([div(`w:${c.name}:0`, leagueLabel(cc, 1), 1, null, ordered ? l : l.sort(byStrength), 'strength')]); }
    // 2. Ebene Staffel für Staffel (engine/worldSecond.ts).
    const groups = secondGroups(c as WorldCountry);
    const keys = homeGroupKeys(groups.length);
    if (groups.length) lv.push(groups.map((ids, k) => { const l = pyr(ids); return div(`w:${c.name}:${k + 1}`, leagueLabel(cc, 2, { n: groups.length, i: k }), 2, keys[k] ?? null, ordered ? l : l.sort(byStrength), 'strength'); }));
    // Auf-/Abstieg zur Folgesaison nach der historischen Struktur (data/world/structure.ts), sonst 3 bzw. 2.
    const st = worldStructureOfKey(c.name, year + 1);
    const n = st ? st.down : (lv[0]?.[0]?.clubs.length ?? 0) >= 16 ? 3 : 2;
    const up = st ? st.up : n;
    if (lv[0]) { lv[0][0].champion = 1; lv[0][0].down = n; lv[0][0].downTo = `Abstieg in die ${leagueName(cc, 2)}`; }
    const G = lv[1]?.length ?? 1;
    for (const d of lv[1] ?? []) { d.up = Math.floor(up / G); d.upChance = up % G ? 1 : 0; }
    const pool = pyr(c.pool ?? []);
    const d2 = st?.down2 != null ? Math.max(1, Math.round(st.down2 / G)) : 2;
    // Tiefere Ebenen (engine/worldDeep.ts): echte Ligen statt Strukturkästen; Zahlen wie im Saisonwechsel.
    const wc = c as WorldCountry, deep = wc.deep ?? [];
    if (lv[1] && deep.length) for (const d of lv[1]) { d.down = d2; d.downTo = `Abstieg in die ${leagueName(cc, 3)}`; }
    deep.forEach((_, k) => {
      const gs = deepGroupsOf(wc, k), n = gs.length, keysK = homeGroupKeys(n);
      const size = gs.reduce((a, x) => a + x.length, 0);
      const aboveN = lv[lv.length - 1].reduce((a, d) => a + d.clubs.length, 0);
      const upT = k === 0 ? Math.max(n, st?.down2 ?? 2 * G) : Math.max(n, Math.round(aboveN / 6));
      const last = k === deep.length - 1;
      const below = last ? 0 : deepGroupsOf(wc, k + 1).length;
      const down = last ? 2 : Math.max(1, Math.round(Math.max(below, Math.round(size / 6)) / n));
      lv.push(gs.map((ids, i) => {
        const d = div(`w:${c.name}:d${k + 3}:${i}`, leagueLabel(cc, k + 3, { n, i, year }), k + 3, keysK[i] ?? null, pyr(ids).sort(byStrength), 'strength');
        d.up = Math.floor(upT / n); d.upChance = upT % n ? 1 : 0; d.down = down;
        d.downTo = last ? 'Tausch mit dem Unterbau' : `Abstieg in die ${leagueName(cc, k + 4, year)}`;
        return d;
      }));
    });
    if (pool.length && lv[1]) {
      if (!deep.length) for (const d of lv[1]) { d.down = d2; d.downTo = 'Tausch mit dem Unterbau'; }
      const pd = div(`w:${c.name}:pool`, 'Unterbau', lv.length + 1, null, pool.sort(byStrength), 'pool');
      pd.pool = true;
      lv.push([pd]);
    }
    return { side: 'abroad' as const, key: c.name, title: c.name, levels: withHistoricTiers(lv, cc, year, true), available: true };
  })];
}

// -----------------------------------------------------------------------------
// Historische Struktur bis zur 4. Ebene (data/leagueTiers.ts, Wunsch Pascal)
// -----------------------------------------------------------------------------
/**
 * Ergänzt eine Pyramide um die nicht simulierten Ebenen bis zur 4. Ebene (reine Strukturangabe vor
 * dem Unterbau, Name nach data/leagueNames.ts `structTierName`). `rename` = Auslandspyramide: der
 * Abstieg der untersten simulierten Ebene führt in die erste Strukturebene. Simulierte Ebenen tragen
 * schon ihren Namen in der Landessprache (keine geschützten historischen Namen mehr).
 */
export function withHistoricTiers(levels: PyrDivision[][], cc: string | undefined, year: number, rename: boolean): PyrDivision[][] {
  const rows = cc ? historicTiers(cc, year) : null;
  if (!rows) return levels;
  const sim = levels.filter((lv) => !lv[0]?.pool);
  const pool = levels.filter((lv) => lv[0]?.pool);
  const extra: PyrDivision[][] = [];
  for (let i = sim.length; i < rows.length; i++) {
    const r = rows[i];
    const d = div(`struct:${cc}:${i + 1}`, structTierName(cc, i + 1, year), i + 1, null, [], 'strength');
    d.struct = tierText(r);
    extra.push([d]);
  }
  // Abstieg der untersten simulierten Ebene führt jetzt in die nächste Strukturebene.
  if (extra.length && rename) {
    const last = sim[sim.length - 1];
    for (const d of last ?? []) if (d.down && !pool.length) d.downTo = `Abstieg in die ${extra[0][0].name}`;
  }
  return [...sim, ...extra, ...pool];
}

// -----------------------------------------------------------------------------
// Vor dem Spielstart (1975/76, aus den Stammdaten)
// -----------------------------------------------------------------------------
export function pyramidPreGame(season = '1975/76'): PyramidData {
  const year = seasonStartYear(season);
  const t1: PyrClub[] = CLUB_SEEDS.map((s) => ({ id: s.id, name: s.name, shortName: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary }, strength: s.reputation }));
  const second = (list: typeof SECOND_LIGA_NORD_SEEDS) => list.map((s) => ({ id: s.id, name: s.name, shortName: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary }, strength: s.strength }));
  const westLv: PyrDivision[][] = [
    [div('tier1', '1. Liga', 1, null, t1.sort(byStrength), 'strength')],
    [div('tier2-nord', '2. Liga Nord', 2, 'nord', second(SECOND_LIGA_NORD_SEEDS).sort(byStrength), 'strength'),
      div('tier2-sued', '2. Liga Süd', 2, 'sued', second(SECOND_LIGA_SUED_SEEDS).sort(byStrength), 'strength')],
    [poolDiv(westPoolSeeds().map((s) => simToPyr(s, year)), 3, false)],
  ];
  const e = euroSlots(year, germanRank(undefined, year));
  westZones(westLv, e.champ, e.more);
  const ddrLv: PyrDivision[][] = [
    [div(DDR_OBERLIGA_ID, 'DDR-Oberliga', 1, 'nordost', DDR_OBERLIGA_SEEDS.map((s) => simToPyr(s, year)).sort(byStrength), 'strength')],
    [div(DDR_LIGA_ID, 'DDR-Liga', 2, 'nordost', DDR_LIGA_SEEDS.map((s) => simToPyr(s, year)).sort(byStrength), 'strength')],
    [poolDiv(ddrPoolSeeds().map((s) => simToPyr(s, year)), 3, true)],
  ];
  ddrZones(ddrLv);
  const euro = { ...allEuroClubs() };
  const world = initWorld(euro, year);
  updateWorldDepths(world, euro, year);
  return {
    season,
    west: { side: 'west', key: 'west', title: 'Deutschland', levels: withHistoricTiers(westLv, 'ger', year, false), available: true },
    ddr: { side: 'ddr', key: 'ddr', title: 'DDR', levels: ddrLv, available: true, note: 'Die DDR spielt bis 1991 in eigenen Ligen. Ihre Vereine sind nicht wählbar, laufen aber im Hintergrund mit.' },
    abroad: abroadSystems(Object.values(world.countries), euro, false, year),
    reforms: reformList(season),
  };
}

function ddrZones(lv: PyrDivision[][]): void {
  const [ober, liga] = [lv[0]?.[0], lv[1]?.[0]];
  if (ober) { ober.champion = 1; ober.down = 2; ober.downTo = 'Abstieg in die DDR-Liga'; }
  if (liga) { liga.up = 2; liga.down = 2; liga.downTo = 'Tausch mit den Bezirksligen'; }
}

// -----------------------------------------------------------------------------
// Laufendes Spiel
// -----------------------------------------------------------------------------
export function pyramidFromGame(g: Game): PyramidData {
  const season = g.season;
  const year = seasonStartYear(season);
  const fromId = (id: string): PyrClub | null => {
    const c = g.clubs[id];
    if (c) {
      const top = c.playerIds.map((p) => g.players[p]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
      return { id, name: c.name, shortName: c.shortName, city: c.city, colors: c.colors, strength: top.reduce((a, b) => a + b, 0) / Math.max(1, top.length) };
    }
    const s = g.simClubs[id];
    return s ? simToPyr(s, year) : null;
  };
  const list = (ids: string[]) => ids.map(fromId).filter((x): x is PyrClub => !!x);
  const pd = g.leagues.playerDivision;
  const all = [
    { meta: pd, ids: g.table.rows.slice().sort((a, b) => a.position - b.position).map((r) => r.clubId) },
    ...g.leagues.otherDivisions.map((d) => ({ meta: d as typeof pd, ids: d.table.rows.slice().sort((a, b) => a.position - b.position).map((r) => r.clubId) })),
  ];
  const build = (pred: (tier: number) => boolean, base: number): PyrDivision[][] => {
    const tiers = [...new Set(all.filter((x) => pred(x.meta.tier)).map((x) => x.meta.tier))].sort((a, b) => a - b);
    return tiers.map((t) => all.filter((x) => x.meta.tier === t)
      .sort((a, b) => groupRank(a.meta.group) - groupRank(b.meta.group))
      .map((x) => div(x.meta.id, x.meta.name, t - base, x.meta.group, list(x.ids), 'table')));
  };
  const westLv = build((t) => t < 100, 0);
  const westPool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER).map((s) => simToPyr(s, year));
  if (westPool.length) westLv.push([poolDiv(westPool, westLv.length + 1, false)]);
  const e = euroSlots(year, germanRank(g.world, year));
  westZones(westLv, e.champ, e.more);
  const ddrLv = build((t) => t > 100 && t < 109, 100);
  const ddrOpen = ddrLv.length > 0;
  const ddrPool = Object.values(g.simClubs).filter((s) => s.tier === DDR_POOL_TIER).map((s) => simToPyr(s, year));
  if (ddrOpen && ddrPool.length) ddrLv.push([poolDiv(ddrPool, ddrLv.length + 1, true)]);
  ddrZones(ddrLv);
  const countries = Object.values(g.world?.countries ?? {});
  return {
    season,
    west: { side: 'west', key: homeCountryOf(g) === 'ger' ? 'west' : COUNTRY_BY_CC[homeCountryOf(g)]?.key ?? 'west', title: COUNTRY_BY_CC[homeCountryOf(g)]?.name ?? 'Deutschland', levels: withHistoricTiers(westLv, homeCountryOf(g), year, false), available: true },
    ddr: ddrOpen
      ? { side: 'ddr', key: 'ddr', title: 'DDR', levels: ddrLv, available: true, note: g.ddrHome ? 'Dein Land: Die DDR spielt bis 1991 in eigenen Ligen, die Bundesliga läuft im Hintergrund mit.' : 'Die DDR spielt bis 1991 in eigenen Ligen und läuft im Hintergrund mit.' }
      : { side: 'ddr', key: 'ddr', title: 'DDR', levels: [], available: false, archive: true, note: 'Seit der Wiedervereinigung 1991/92 spielen die Vereine aus dem Osten in der gesamtdeutschen Pyramide.' },
    abroad: abroadSystems(countries, (g.euroClubs ?? {}) as never, false, year),
    reforms: homeCountryOf(g) === 'ger' ? reformList(season) : [],
  };
}

function groupRank(gr: LeagueGroup): number {
  return gr == null ? 9 : groupOrder(gr);
}

/** Gültige Soll-Struktur (für Hinweise), re-exportiert für die Oberfläche. */
export const structureOf = structureForSeason;

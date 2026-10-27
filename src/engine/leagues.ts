// -----------------------------------------------------------------------------
// LIGASYSTEM — mehrstufig & erweiterbar
// -----------------------------------------------------------------------------
// Dieses Modul verwaltet die Ligastruktur oberhalb der reinen Spielerliga.
//
//  • Ebene 1 (Tier 1): 1. Liga, 18 Vereine, 34 Spieltage. Die Liga, in der der
//    Spieler aktuell antritt, wird mit der VOLLEN Match-Engine gespielt
//    (siehe App.tsx / simulateMatchday). Alle anderen Ligen/Staffeln werden
//    hier performant per Stärke-Simulation geführt (kein Tick-Lag).
//  • Ebene 2 (Tier 2): 2. Liga, ab Saison 1975/76 ZWEIGLEISIG:
//    Staffel Nord (~20) + Staffel Süd (~20).
//
// Die Datenstrukturen sind bewusst generisch (tier/group), damit spätere
// Reformen (eingleisige 2. Liga 1981/82, 3. Ebene ab 1994/2008, DDR-Ligen +
// Wiedervereinigung 1991/92) ohne Bruch angedockt werden können.
// -----------------------------------------------------------------------------

import { Club, Match, LeagueTable, PointSystem, MatchResult } from '../types';
import { generateFixtures, calculateTable } from './league';

// Staffel-Kennung einer Liga-Ebene. `null` = eingleisig. Über Nord/Süd hinaus
// gibt es ab den Ligareformen weitere regionale Staffeln (Regionalliga:
// Nord, Nordost, West, Süd), deshalb ist der Typ bewusst breit gehalten.
export type LeagueGroup = 'nord' | 'sued' | 'nordost' | 'west' | null;

// Aggregierter Nicht-Spieler-Verein: nur Stärke + Optik, kein voller Kader.
export interface SimClub {
  id: string;
  name: string;
  shortName: string;
  city: string;
  strength: number;
  colors: { primary: string; secondary: string };
  tier: number;
  group: LeagueGroup;
  // --- Optionale Identitäts-/Historien-Felder (v6, für DDR-Umbenennungen) ---
  /** Kanonische Vereinsidentität – überdauert historische Umbenennungen. */
  canonicalId?: string;
  /** Früherer (historischer) Name, gültig VOR `renamedYear` (z. B. „Karl-Marx-Stadt"). */
  historicalName?: string;
  /** Jahr der Umbenennung: bis (exkl.) diesem Kalenderjahr gilt `historicalName`. */
  renamedYear?: number;
  /** Markiert einen DDR-Verein (bis zur Wiedervereinigung 1991/92 separat geführt). */
  ddr?: boolean;
}

/**
 * Zeit-korrekter Anzeigename eines Sim-Vereins. Trägt der Verein einen
 * historischen Namen (`historicalName`) samt Umbenennungsjahr (`renamedYear`),
 * wird VOR diesem Jahr der historische, ab diesem Jahr der aktuelle Name gezeigt
 * (z. B. „Karl-Marx-Stadt" bis 1989, „Chemnitz" ab 1990).
 */
export function simDisplayName(sim: SimClub, year: number): string {
  if (sim.historicalName && sim.renamedYear && year < sim.renamedYear) return sim.historicalName;
  return sim.name;
}

export interface DivisionMeta {
  id: string;
  name: string;
  tier: number;
  group: LeagueGroup;
}

// Eine per Stärke simulierte Liga/Staffel (alle außer der Spielerliga).
export interface LeagueDivision extends DivisionMeta {
  clubIds: string[];
  fixtures: Match[];
  table: LeagueTable;
  nextMatchday: number;
}

export interface LeagueSystem {
  // Meta-Info zur aktuellen Liga des Spielers (deren Tabelle lebt in game.table).
  playerDivision: DivisionMeta;
  // Alle übrigen (rein simulierten) Ligen/Staffeln.
  otherDivisions: LeagueDivision[];
  season: string;
}

// -----------------------------------------------------------------------------
// Beschriftungen
// -----------------------------------------------------------------------------
/** Deutsches Label einer Staffel-Kennung ("Nord", "Süd", "Nordost", "West"). */
export function groupLabel(group: LeagueGroup): string {
  switch (group) {
    case 'nord': return 'Nord';
    case 'sued': return 'Süd';
    case 'nordost': return 'Nordost';
    case 'west': return 'West';
    default: return '';
  }
}

export function divisionLabel(tier: number, group: LeagueGroup): string {
  if (tier === 1) return 'Deutschland 1. Liga';
  if (tier === 2) {
    if (group) return `2. Liga ${groupLabel(group)}`;
    return '2. Liga';
  }
  // Tier 3/4 werden je nach Epoche unterschiedlich benannt (Regionalliga vs.
  // 3. Liga). Für exakte Anzeige trägt jede Division ihren `name`; dieses Label
  // ist der generische Fallback.
  if (tier === 3) return group ? `Regionalliga ${groupLabel(group)}` : '3. Liga';
  if (tier === 4) return group ? `Regionalliga ${groupLabel(group)}` : `${tier}. Liga`;
  return `${tier}. Liga`;
}

// -----------------------------------------------------------------------------
// Deterministischer RNG (mulberry32)
// -----------------------------------------------------------------------------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// -----------------------------------------------------------------------------
// Stärke-basierte Ergebnis-Simulation
// -----------------------------------------------------------------------------
// Erwartete Tore aus Stärkedifferenz + Heimvorteil; Poisson-artige Ziehung über
// den seed-basierten RNG. Schnell und deterministisch.
function drawGoals(expected: number, rnd: () => number): number {
  // Einfache Poisson-Approximation per Summe von Zufallszahlen (Knuth).
  const L = Math.exp(-Math.max(0.05, expected));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rnd();
  } while (p > L && k < 12);
  return k - 1;
}

export function simMatchGoals(
  homeStr: number,
  awayStr: number,
  rnd: () => number,
): { home: number; away: number } {
  const diff = (homeStr - awayStr) / 100;
  const homeExp = Math.max(0.2, 1.35 + diff * 2.2 + 0.25); // +0.25 Heimvorteil
  const awayExp = Math.max(0.15, 1.05 - diff * 2.2);
  return { home: drawGoals(homeExp, rnd), away: drawGoals(awayExp, rnd) };
}

// -----------------------------------------------------------------------------
// Fixtures & Tabellen für simulierte Ligen (nutzt die vorhandene League-Engine
// mit minimalen Club-Stubs — nur die ID wird gebraucht).
// -----------------------------------------------------------------------------
export function simFixtures(clubIds: string[], seasonStart: string): Match[] {
  const stubs = clubIds.map((id) => ({ id }) as Club);
  return generateFixtures(stubs, seasonStart);
}

export function simTable(
  clubIds: string[],
  matches: Match[],
  pointSystem: PointSystem,
  season: string,
  previous?: LeagueTable,
): LeagueTable {
  const stubs = clubIds.map((id) => ({ id }) as Club);
  return calculateTable(stubs, matches, pointSystem, season, previous);
}

function emptyResult(home: number, away: number): MatchResult {
  return {
    homeGoals: home, awayGoals: away,
    homePossession: 50, homeShots: 0, awayShots: 0,
    homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeCorners: 0, awayCorners: 0, homeFouls: 0, awayFouls: 0,
    homeYellowCards: 0, awayYellowCards: 0, homeRedCards: 0, awayRedCards: 0,
    attendance: 0,
  };
}

// -----------------------------------------------------------------------------
// Spieltag-Fortschritt einer simulierten Liga
// -----------------------------------------------------------------------------
// Simuliert genau den nächsten offenen Spieltag der Division, aktualisiert die
// Tabelle und erhöht nextMatchday. Kein Effekt, wenn die Saison durch ist.
export function advanceDivision(
  div: LeagueDivision,
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
): void {
  const md = div.nextMatchday;
  const dayMatches = div.fixtures.filter((m) => m.matchday === md);
  if (dayMatches.length === 0) return; // Saison durch

  const rnd = mulberry32(hashStr(`${div.id}:${season}:md${md}`));
  for (const m of dayMatches) {
    if (m.status === 'finished') continue;
    const hs = simClubs[m.homeClubId]?.strength ?? 50;
    const as = simClubs[m.awayClubId]?.strength ?? 50;
    const g = simMatchGoals(hs, as, rnd);
    m.result = emptyResult(g.home, g.away);
    m.status = 'finished';
  }
  div.table = simTable(div.clubIds, div.fixtures, pointSystem, season, div.table);
  div.nextMatchday = md + 1;
}

// Simuliert alle noch offenen Spieltage der Division zu Ende.
export function flushDivision(
  div: LeagueDivision,
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
): void {
  let guard = 0;
  while (div.fixtures.some((m) => m.matchday === div.nextMatchday) && guard < 80) {
    advanceDivision(div, simClubs, pointSystem, season);
    guard++;
  }
}

// -----------------------------------------------------------------------------
// Aufbau der simulierten Divisionen
// -----------------------------------------------------------------------------
export function buildDivision(
  meta: DivisionMeta,
  clubIds: string[],
  pointSystem: PointSystem,
  season: string,
  seasonStart: string,
): LeagueDivision {
  const fixtures = simFixtures(clubIds, seasonStart);
  const table = simTable(clubIds, fixtures, pointSystem, season);
  return { ...meta, clubIds, fixtures, table, nextMatchday: 1 };
}

// Leitet aus einem vollen (verlassenen) Verein einen SimClub ab. Wird beim
// Abstieg des Spielervereins bzw. eines vollen KI-Vereins in die 2. Liga
// benutzt: Stärke = Durchschnitts-Overall des Kaders.
export function simClubFromClub(
  club: Club,
  players: Record<string, { overall: number }>,
  tier: number,
  group: LeagueGroup,
): SimClub {
  const ovs = club.playerIds.map((id) => players[id]?.overall ?? 50);
  const strength = ovs.length
    ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length)
    : club.reputation;
  return {
    id: club.id, name: club.name, shortName: club.shortName, city: club.city,
    strength, colors: { primary: club.colors.primary, secondary: club.colors.secondary },
    tier, group,
  };
}

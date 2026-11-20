// =============================================================================
// LÄNDERWAHL der Wettbewerbs-Seiten (Statistiken › Liga / Pokal; Wunsch Pascal)
// -----------------------------------------------------------------------------
// Legt eine Länderebene über game/competitionView.ts:
//  - Heimatland: wie bisher (Historie, Archiv, laufend) + Weltdaten-Saisons vor dem Startjahr.
//  - DDR (Heimat Deutschland): Ligen aus Archiv/laufender Saison
//    (bekannte Schlüssel, z. B. `ddr-oberliga`) + Weltdaten vor dem Startjahr.
//  - Übrige Länder (engine/world.ts + game/worldLeagues.ts): laufende Saison als echte Tabelle,
//    Spieltag für Spieltag (r1/r2); abgeschlossene Saisons mit vollen Tabellen aus der
//    Welt-Historie samt Ergebnissen (`WorldSeasonRecord.divs`, letzte 10 Saisons; ältere
//    Spielstände nur Reihenfolge aus `tables`), davor Meister/Pokalsieger.
// Eigene Schlüssel: d1/d2/d2b/xcup (Weltdaten), w1/w2 (abgeschlossen), r1/r2 (laufend); mehrere Staffeln
// der 2. Ebene (engine/worldSecond.ts): r2/w2 = erste Staffel, r2:<n>/w2:<n> = Staffel n (n ≥ 2), d2:<n> Weltdaten.
// =============================================================================
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { worldSeason, worldYears } from '../data/world/index';
import { rowGroups } from '../data/world/secondGroups';
import { seasonStartYear } from '../data/timeline';
import { archivedSeason, leagueArchive } from './leagueArchive';
import {
  buildSnapshot, compClubName, competitionOptions, seasonOptions,
  type CompOption, type CompSnapshot, type RoundLite, type Source,
} from './competitionView';
import { homeCountryOf, type Game } from './state';
import { DDR_POOL_TIER, POOL_TIER } from '../data/history/historicClubs';
import { simDisplayName } from '../engine/leagues';
import { leagueRepInfo } from './leagueRepGame';
import { accessSlots } from '../data/euroFormats';
import { countryRanking, germanRank, type LeanCup, type LeanDiv } from '../engine/world';
import type { ResTuple } from './leagueResults';
import { deepIdx, leanTierOf, ensureWorldLive, leanGames, leanMatchdays, leanResTuples, leanTable, leanWinPts, worldLiveDiv, type LeanGame } from './worldLeagues';
import { leanCupDates, leanCupRounds, leanCupRoundsN, leanCupWinner, roundName } from './worldCups';
import { leagueLabel, leagueName } from '../data/leagueNames';
import { secondGroups } from '../engine/worldSecond';
import { worldStructureOfKey } from '../data/world/structure';
import { deepGroupsOf } from '../engine/worldDeep';
import { DEEP_NOTE, deepHistDiv, deepOptions, deepZones } from './worldDeepView';
import { emptyLeanStats, leanCupStats, leanStats, unpackScorers, unpackStats, type LeanStats, type PackedStats } from './worldScorers';

export type CountryMode = 'home' | 'div' | 'world';
export interface StatsCountry { cc: string; name: string; flag: string; mode: CountryMode; worldKey?: string; hint: string }
export type CSource = Source | 'data' | 'world' | 'roster';
export interface CSeasonOption { season: string; source: CSource }

const OWN_KEYS = new Set(['d1', 'd2', 'd2b', 'xcup', 'w1', 'w2', 'r1', 'r2', 'pool']);
const isOwnKey = (key: string) => OWN_KEYS.has(key) || /^[rwd]2:\d+$/.test(key) || /^[rw][34](:\d+)?$/.test(key);
/**
 * Index der schlanken Liga zu einem Schlüssel r1/r2/r2:n bzw. w1/w2/w2:n (0 = 1. Liga, 1… = Staffeln), tiefere
 * Ebenen r3/r3:n/r4 … (engine/worldDeep.ts: 100 + Staffel bzw. 200 + Staffel); −1 = keiner.
 */
export function leanIdxOf(key: string): number {
  const m = /^[rw]([1-4])(?::(\d+))?$/.exec(key);
  if (!m) return -1;
  const t = Number(m[1]), n = Math.max(1, Number(m[2] ?? 1));
  return t === 1 ? 0 : t === 2 ? n : deepIdx(t, n - 1);
}
/** Schlüssel der Staffel `i` (0-basiert) der 2. Ebene: r2, r2:2, r2:3 … (auch r3/w3/r4/w4 der tieferen Ebenen). */
const groupKey = (base: string, i: number) => (i === 0 ? base : `${base}:${i + 1}`);
/** Gruppe der Wettbewerbswahl (Wunsch Pascal: alle Ligen des Landes, nach Ebene geordnet). */
const levelSection = (tier: number) => `${tier >= 100 ? tier % 100 : tier}. Ebene`;
const UNTERBAU = 'Unterbau';
const startYearOf = (g: Game) => g.startYear ?? 1975;
const nameOf = (cc: string, key?: string) => COUNTRY_BY_CC[cc]?.name ?? key ?? cc;

// -----------------------------------------------------------------------------
// Länder
// -----------------------------------------------------------------------------
export function statsCountries(g: Game): StatsCountry[] {
  const home = homeCountryOf(g);
  // ALLE Länder in EINER alphabetischen Liste – auch das Heimatland (Wunsch Pascal; vorgewählt über
  // `homeStatsCountry`); Ligen, die es in der laufenden Saison nicht mehr gibt, tragen den Hinweis „Archiv“.
  const rest: StatsCountry[] = [{ cc: home, name: nameOf(home), flag: COUNTRY_BY_CC[home]?.key ?? 'Deutschland', mode: 'home', hint: 'Heimatland' }];
  // DDR-Start (game/ddrHome.ts): die DDR ist dein Land – Hinweis „Heimatland“, Vorauswahl über `homeStatsCountry`.
  if (home === 'ger') rest.push({ cc: 'gdr', name: 'DDR', flag: 'DDR', mode: 'div', hint: g.ddrHome ? 'Heimatland' : g.leagues?.otherDivisions.some((d) => d.id.startsWith('ddr-')) ? '' : 'Archiv' });
  if (g.ddrHome) rest[0] = { ...rest[0], hint: '' };
  for (const c of Object.values(g.world?.countries ?? {})) {
    const cc = COUNTRY_BY_KEY[c.name]?.cc ?? c.name;
    if (cc === home || rest.some((x) => x.cc === cc)) continue;
    rest.push({ cc, name: nameOf(cc, c.name), flag: c.name, mode: 'world', worldKey: c.name, hint: c.active ? '' : 'Archiv' });
  }
  rest.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return rest;
}

/** Heimatland aus der Länderliste (Vorauswahl). */
export function homeStatsCountry(list: StatsCountry[]): StatsCountry {
  return list.find((c) => c.hint === 'Heimatland') ?? list.find((c) => c.mode === 'home') ?? list[0];
}

/** Land einer Auswahl der Basis-Optionen (für Vorauswahl aus der Zentrale). */
export function countryOfKey(g: Game, season: string, key: string): { cc: string; key: string } {
  const home = homeCountryOf(g);
  if (key.startsWith('w:')) return { cc: COUNTRY_BY_KEY[key.slice(2)]?.cc ?? key.slice(2), key: season === g.season ? 'r1' : 'w1' };
  const m = /^x-([a-z]+)-\d$/.exec(key);
  if (m) return { cc: m[1], key };
  const opt = competitionOptions(g, season).find((o) => o.key === key);
  if (opt?.section === 'DDR') return { cc: 'gdr', key };
  return { cc: home, key };
}

/** Gehört eine Basis-Option zu diesem Land? */
function belongs(o: CompOption, c: StatsCountry, ddrCup = false): boolean {
  // DDR-Start: der laufende Landespokal ist der FDGB-Pokal.
  if (o.key === 'cup' && ddrCup) return c.cc === 'gdr';
  if (c.mode === 'home') return o.section !== 'DDR' && o.section !== 'Länder Spiel für Spiel' && o.section !== 'Ausland';
  if (c.cc === 'gdr') return o.section === 'DDR';
  return o.key.startsWith(`x-${c.cc}-`);
}

// -----------------------------------------------------------------------------
// Saisons je Land
// -----------------------------------------------------------------------------
/** Weltdaten-Saisons vor dem Startjahr (vor Spielbeginn), ohne die schon vorhandenen. */
function dataSeasons(g: Game, cc: string, have: Set<string>): CSeasonOption[] {
  const sy = startYearOf(g);
  return worldYears(cc).filter((y) => y < sy).map(seasonLabelOf).filter((s) => !have.has(s)).map((season) => ({ season, source: 'data' as CSource }));
}

export function countrySeasons(g: Game, c: StatsCountry): CSeasonOption[] {
  let out: CSeasonOption[] = [];
  if (c.mode !== 'world') {
    const base = seasonOptions(g);
    out = c.mode === 'home' ? base : base.filter((s) => competitionOptions(g, s.season).some((o) => belongs(o, c, !!g.ddrHome && s.season === g.season)));
  } else {
    const wc = g.world?.countries[c.worldKey!];
    for (const rec of g.world?.history ?? []) {
      if (rec.champions[c.worldKey!] || rec.tables?.[c.worldKey!]) out.push({ season: rec.season, source: 'world' });
    }
    if (wc?.active) out.push({ season: g.season, source: 'roster' });
  }
  out = [...out, ...dataSeasons(g, c.cc, new Set(out.map((s) => s.season)))];
  return out.sort((a, b) => a.season.localeCompare(b.season));
}

/** Startsaison beim Wechsel ins Land: gewählte Saison, falls vorhanden – sonst laufend bzw. letzte abgeschlossene. */
export function pickSeason(list: CSeasonOption[], want: string): string {
  const hit = list.find((s) => s.season === want);
  if (hit) return hit.season; // auch die laufende Saison der Auslandsligen hat eine echte Tabelle
  const done = [...list].reverse().find((s) => s.source !== 'roster');
  return done?.season ?? list[list.length - 1]?.season ?? want;
}

// -----------------------------------------------------------------------------
// Wettbewerbe je Land und Saison
// -----------------------------------------------------------------------------
function dataLeagueOpts(cc: string, year: number): CompOption[] {
  const row = worldSeason(cc, year);
  if (!row) return [];
  const out: CompOption[] = [{ key: 'd1', label: leagueLabel(cc, 1), kind: 'league', section: levelSection(1), tier: 1 }];
  const gs = rowGroups(row);
  // Mehrere Staffeln: eine Wahl je Staffel (Nord/Süd bzw. Nord/Mitte/Süd in der Landessprache, data/leagueNames.ts).
  gs.forEach((_, i) => out.push({ key: groupKey('d2', i), label: leagueLabel(cc, 2, { n: gs.length, i }), kind: 'league', section: levelSection(2), tier: 2 }));
  return out;
}

const cupLabel = (cc: string) => (cc === 'gdr' ? 'FDGB-Pokal' : 'Landespokal');

export function countryOptions(g: Game, c: StatsCountry, season: string, source: CSource): CompOption[] {
  const y = seasonStartYear(season);
  const cup: CompOption = { key: 'xcup', label: cupLabel(c.cc), kind: 'cup', section: 'Pokal' };
  if (source === 'data') return [...dataLeagueOpts(c.cc, y), cup];
  const pool = season === g.season ? poolOption(g, c) : [];
  if (c.mode !== 'world') {
    // Alle Ligen, die das Spiel führt (1./2. Liga, Oberligen, Regionalligen, 3. Liga … je Epoche), nach Ebene gruppiert.
    const base = competitionOptions(g, season).filter((o) => belongs(o, c, !!g.ddrHome && season === g.season))
      .map((o) => (o.kind === 'league' && o.tier != null ? { ...o, section: levelSection(o.tier) } : o));
    const leagues = base.filter((o) => o.kind === 'league'), rest = base.filter((o) => o.kind !== 'league');
    return c.mode === 'home' ? [...leagues, ...pool, ...rest] : [...leagues, ...pool, ...rest, cup];
  }
  const l1 = leagueLabel(c.cc, 1);
  const s1 = levelSection(1), s2 = levelSection(2);
  const wc = g.world?.countries[c.worldKey!];
  if (source === 'roster') {
    const n = wc ? secondGroups(wc).length : 0;
    return [
      { key: 'r1', label: l1, kind: 'league', section: s1, tier: 1 },
      ...Array.from({ length: n }, (_, i): CompOption => ({ key: groupKey('r2', i), label: leagueLabel(c.cc, 2, { n, i }), kind: 'league', section: s2, tier: 2 })),
      ...deepOptions(c.cc, y, wc ? (wc.deep ?? []).map((_, k) => deepGroupsOf(wc, k).length) : [], 'r', levelSection),
      ...pool,
      cup,
    ];
  }
  const rec = g.world?.history.find((r) => r.season === season);
  const stored = (rec?.divs?.[c.worldKey!] ?? []).slice(1);
  const n = stored.length > 1 ? stored.length : stored[0] || archivedSeason(g, season)?.divisions.some((d) => d.id === `x-${c.cc}-2`) ? 1 : 0;
  return [
    { key: 'w1', label: l1, kind: 'league', section: s1, tier: 1 },
    ...Array.from({ length: n }, (_, i): CompOption => ({ key: groupKey('w2', i), label: leagueLabel(c.cc, 2, { n, i }), kind: 'league', section: s2, tier: 2 })),
    ...deepOptions(c.cc, y, (rec?.deep?.[c.worldKey!] ?? []).map((lv) => lv.length), 'w', levelSection),
    cup,
  ];
}

// -----------------------------------------------------------------------------
// Unterbau: Vereine unterhalb der simulierten Ligen (Pool, game/clubPool.ts bzw. Unterbau der Welt)
// -----------------------------------------------------------------------------
interface PoolInfo { ids: string[]; label: string; strength: (id: string) => number; above: string }
function poolInfo(g: Game, c: StatsCountry): PoolInfo | null {
  if (c.mode === 'world') {
    const wc = g.world?.countries[c.worldKey!];
    const ids = wc?.active ? wc.pool ?? [] : [];
    return ids.length ? { ids, label: 'Unterbau', strength: (id) => g.euroClubs?.[id]?.strength ?? 0, above: leagueLabel(c.cc, Math.max(2, ...(wc?.deep ?? []).map((_, k) => k + 3))) } : null;
  }
  const ddr = c.cc === 'gdr';
  const pd = g.leagues.playerDivision;
  const divs = [...g.leagues.otherDivisions, ...(pd.tier > 100 && pd.tier < 109 ? [{ tier: pd.tier, name: pd.name }] : [])].filter((d) => (ddr ? d.tier > 100 && d.tier < 109 : d.tier < 100));
  if (ddr && !divs.length) return null; // nach der Wiedervereinigung kein eigener DDR-Unterbau mehr
  const tier = ddr ? DDR_POOL_TIER : POOL_TIER;
  const ids = Object.values(g.simClubs).filter((s) => s.tier === tier).map((s) => s.id);
  if (!ids.length) return null;
  const lowest = Math.max(ddr ? 101 : pd.tier < 100 ? pd.tier : 1, ...divs.map((d) => d.tier));
  const above = [...new Set(divs.filter((d) => d.tier === lowest).map((d) => d.name.replace(/ (Nord|Süd|Nordost|West)$/, '')))].join(' / ')
    || g.leagues.playerDivision.name;
  return { ids, label: ddr ? 'Bezirksligen' : homeCountryOf(g) === 'ger' ? 'Amateurligen' : 'Unterbau', strength: (id) => g.simClubs[id]?.strength ?? 0, above };
}

function poolOption(g: Game, c: StatsCountry): CompOption[] {
  const p = poolInfo(g, c);
  return p ? [{ key: 'pool', label: p.label, kind: 'league', section: UNTERBAU }] : [];
}

/** Unterbau als Teilnehmerliste: kein Spielbetrieb, nur Vereine nach Stärke (Auf-/Abstieg am Saisonende). */
function poolSnapshot(g: Game, c: StatsCountry, season: string, base: CompSnapshot): CompSnapshot | null {
  const p = poolInfo(g, c);
  if (!p) return null;
  const year = seasonStartYear(season);
  const ids = [...p.ids].sort((a, b) => p.strength(b) - p.strength(a) || compClubName(g, a, season).localeCompare(compClubName(g, b, season), 'de'));
  const strongest = ids[0];
  const sim = strongest ? g.simClubs[strongest] : undefined;
  return {
    ...base, source: 'live', roster: true, placingsOnly: true, table: placings(ids),
    caption: `${p.label} ${season} · ${ids.length} Vereine, nach Stärke`,
    facts: [
      { k: 'Vereine', text: String(ids.length) },
      ...(strongest ? [{ k: 'Stärkster Verein', id: strongest }] : []),
      { k: 'Spielbetrieb', text: 'nicht einzeln simuliert' },
      { k: 'Aufstieg', text: `am Saisonende Tausch mit den Letzten der ${p.above}` },
    ],
    note: `${p.label}: Unterhalb der ${p.above} werden keine Spiele einzeln simuliert. Die Vereine stehen hier nach Stärke${sim ? ` (${simDisplayName(sim, year)} vorn)` : ''}; am Saisonende tauschen die Stärksten mit den Schlechtesten der untersten Liga.`,
  };
}

// -----------------------------------------------------------------------------
// Schnappschuss
// -----------------------------------------------------------------------------
const placings = (ids: string[]) => ids.map((clubId, i) => ({ clubId, pos: i + 1, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));

/** Vereins-ID im Spielstand bzw. `w_<id>` (Name aus den Weltdaten). */
function mapId(g: Game, id: string): string {
  if (g.clubs[id] || g.simClubs[id]) return id;
  return `w_${id}`;
}

/** Meistertitel je Verein seit Spielbeginn (Hintergrund). */
function titleList(g: Game, worldKey: string) {
  const t = g.world?.countries[worldKey]?.titles ?? {};
  return Object.entries(t).map(([clubId, value]) => ({ clubId, value })).sort((a, b) => b.value - a.value).slice(0, 10);
}

/** Pokalsieger eines Landes über alle bekannten Saisons (Weltdaten, Welt-Historie, Archiv). */
function cupWinners(g: Game, c: StatsCountry): { season: string; winner: string | null; finalist?: string }[] {
  const out = new Map<string, { season: string; winner: string | null; finalist?: string }>();
  const sy = startYearOf(g);
  for (const y of worldYears(c.cc)) {
    if (y >= sy) continue;
    const row = worldSeason(c.cc, y);
    if (row?.cup) out.set(seasonLabelOf(y), { season: seasonLabelOf(y), winner: mapId(g, row.cup), finalist: row.cupFinalist ? mapId(g, row.cupFinalist) : undefined });
  }
  const key = c.worldKey ?? COUNTRY_BY_CC[c.cc]?.key;
  if (c.mode !== 'home' && key) for (const rec of g.world?.history ?? []) if (rec.cupWinners[key]) out.set(rec.season, { season: rec.season, winner: rec.cupWinners[key] });
  if (c.mode === 'home') for (const a of leagueArchive(g)?.seasons ?? []) if (a.cups.cup?.winner) out.set(a.season, { season: a.season, winner: a.cups.cup.winner });
  return [...out.values()].sort((a, b) => b.season.localeCompare(a.season));
}

function cupCounts(list: { winner: string | null }[]) {
  const m = new Map<string, number>();
  for (const w of list) if (w.winner) m.set(w.winner, (m.get(w.winner) ?? 0) + 1);
  return [...m.entries()].map(([clubId, value]) => ({ clubId, value })).sort((a, b) => b.value - a.value).slice(0, 10);
}

/** Stand aller Auslandsligen (1. Liga) für die Übersicht unter Statistiken › Ligensystem. */
export interface WorldLeagueRow { cc: string; key: string; name: string; league: string; md: number; total: number; /** Staffeln der 2. Ebene (mehr als 1 = mehrgleisig, alle simuliert). */ groups: number; leader?: string; rep?: { rep: number; hist: number; delta: number | null } }
export function worldLeagueOverview(g: Game): WorldLeagueRow[] {
  const out: WorldLeagueRow[] = [];
  const year = seasonStartYear(g.season);
  for (const c of statsCountries(g)) {
    if (c.mode !== 'world' || !c.worldKey) continue;
    const d = worldLiveDiv(g, c.worldKey, 0);
    if (!d) continue;
    const rep = leagueRepInfo(g, c.worldKey, year) ?? undefined;
    const wc = g.world?.countries[c.worldKey];
    out.push({ cc: c.cc, key: c.worldKey, name: c.name, league: leagueLabel(c.cc, 1), groups: wc ? secondGroups(wc).length : 0, md: d.md, total: d.n, leader: d.md ? leanTable(d, c.worldKey, g.season)[0]?.clubId : undefined, rep });
  }
  // Mit Ligaruf (Option „Entwicklung der Ligen“): stärkste Ligen zuerst.
  if (out.some((r) => r.rep)) out.sort((a, b) => (b.rep?.rep ?? -1) - (a.rep?.rep ?? -1));
  return out;
}

/** Schlanke Auslandsliga zu Saison und Schlüssel: laufend (r1/r2) oder aus der Welt-Historie (w1/w2). */
function leanDivFor(g: Game, wk: string, season: string, key: string): { div: LeanDiv; live: boolean; md: number; total: number } | null {
  const idx = leanIdxOf(key);
  if (idx < 0) return null;
  if (key[0] === 'r') {
    if (season !== g.season) return null;
    const d = worldLiveDiv(g, wk, idx);
    return d ? { div: d, live: true, md: d.md, total: d.n } : null;
  }
  const rec = g.world?.history.find((r) => r.season === season);
  const d = idx >= 100 ? deepHistDiv(rec, wk, idx) : rec?.divs?.[wk]?.[idx];
  if (!d?.ids.length) return null;
  const total = leanMatchdays(d.ids.length);
  return { div: d, live: false, md: total, total };
}

/** Tabellenzonen einer Auslandsliga: Meister, Europapokal-Plätze nach Rang des Landes, Auf-/Abstieg wie in engine/world.ts. */
function leanZones(g: Game, wk: string, season: string, tier2: boolean, n: number, groups = 1): string[] {
  const w = g.world, c = w?.countries[wk];
  const zones = new Array<string>(n).fill('');
  if (!w || !c) return zones;
  // Auf-/Absteiger zwischen 1. und 2. Liga zur Folgesaison (data/world/structure.ts), sonst wie bisher 3 bzw. 2.
  const st = worldStructureOfKey(wk, seasonStartYear(season) + 1);
  const moves = !c.tiers[1]?.length ? 0 : st ? st.down : c.tier1 >= 16 ? 3 : 2;
  if (tier2) {
    // Mehrere Staffeln: sicher je Staffel ⌊Aufsteiger / Staffeln⌋, ein weiterer Platz = Chance (bester der Runde).
    const up = st ? st.up : moves;
    const sure = Math.floor(up / groups), chance = up % groups ? 1 : 0;
    for (let i = 0; i < sure && i < n; i++) zones[i] = 'zone-cl';
    if (chance && sure < n) zones[sure] = 'zone-po';
    const down = st?.down2 != null ? Math.round(st.down2 / groups) : 2;
    if (n >= 8) for (let i = Math.max(sure + chance, n - down); i < n; i++) zones[i] = 'zone-rel';
    return zones;
  }
  const y = seasonStartYear(season) + 1; // Europapokal der Folgesaison
  const rank = countryRanking(w, y).findIndex((x) => x.name === wk);
  let euro = 0;
  if (rank >= 0) {
    const de = germanRank(w, y);
    const a = accessSlots(y, rank + 1 >= de ? rank + 2 : rank + 1);
    euro = a.ec + a.uefa - (y >= 1999 ? 1 : 0);
  }
  for (let i = 0; i < Math.min(euro, n); i++) zones[i] = i === 0 ? 'zone-cl' : 'zone-eu';
  if (n) zones[0] = 'zone-cl';
  for (let i = Math.max(1, n - moves); i < n; i++) zones[i] = 'zone-rel';
  return zones;
}

/**
 * Spieltage einer Auslandsliga für Tabelle (Stand nach Spieltag, Heim/Auswärts, Form) und die Box
 * „Begegnungen“: alle Spiele mit Termin, gespielte mit Ergebnis. null = keine Einzelergebnisse.
 */
export function countryMatchdays(g: Game, c: StatsCountry, season: string, key: string): { games: LeanGame[]; res: ResTuple[]; ptsWin: number } | null {
  if (c.mode !== 'world' || !c.worldKey) return null;
  const lean = leanDivFor(g, c.worldKey, season, key);
  if (!lean) return null;
  const games = leanGames(lean.div, season, lean.md);
  return { games, res: leanResTuples(games), ptsWin: leanWinPts(c.worldKey, season) };
}

/**
 * Einzelstatistik einer abgeschlossenen Auslandssaison: gespeicherte Wertungen (`pstats`), sonst – ältere
 * Spielstände, die nur die Torschützen kennen – aus den heutigen Kadern nachgerechnet (Tore bleiben die gespeicherten).
 */
function archivedStats(rec: { scorers?: Record<string, [string, string, string, number][]>; pstats?: Record<string, PackedStats> } | undefined, key: string, recompute: () => LeanStats): LeanStats {
  const saved = unpackStats(rec?.pstats?.[key]);
  if (saved) return saved;
  const st = recompute();
  const goals = unpackScorers(rec?.scorers?.[key]);
  return goals.length ? { ...st, goals } : st;
}

export function countrySnapshot(g: Game, c: StatsCountry, season: string, source: CSource, key: string): CompSnapshot | null {
  const opt = countryOptions(g, c, season, source).find((o) => o.key === key);
  if (!opt) return null;
  if (!isOwnKey(key)) {
    const s = buildSnapshot(g, season, key);
    if (s && c.mode === 'div' && s.kind === 'league') s.caption = s.source === 'live' ? undefined : `Abschlusstabelle ${season}`;
    return s;
  }
  const y = seasonStartYear(season);
  const base = { key, label: opt.label, season, kind: opt.kind, source: (source === 'roster' ? 'live' : 'archive') as Source } as CompSnapshot;
  const wk = c.worldKey ?? COUNTRY_BY_CC[c.cc]?.key ?? c.name;
  if (key === 'pool') return poolSnapshot(g, c, season, base);

  if (key === 'xcup') {
    const list = cupWinners(g, c);
    const hit = list.find((w) => w.season === season);
    // Landespokal mit echten Runden (game/worldCups.ts): laufende Saison und die letzten Saisons.
    const lc: { cup: LeanCup; live: boolean } | null = c.mode !== 'world' ? null
      : season === g.season ? ((x) => (x ? { cup: x, live: true } : null))(ensureWorldLive(g)?.cups?.[wk])
        : ((x) => (x ? { cup: x, live: false } : null))(g.world?.history.find((r) => r.season === season)?.cups?.[wk]);
    if (lc) {
      const played = leanCupRounds(wk, season, lc.cup);
      const total = leanCupRoundsN(lc.cup.ids.length);
      const dates = leanCupDates(season, total);
      const rounds: RoundLite[] = played.map((r) => ({
        index: r.index, name: r.name, date: r.date, drawn: true,
        ties: r.ties.map((t, i) => ({ id: `${wk}-${r.index}-${i}`, home: t.home, away: t.away, hg: t.hg, ag: t.ag, dec: t.dec, pen: t.pen, winner: t.winner, date: r.date })),
      }));
      for (let i = played.length; i < total; i++) rounds.push({ index: i, name: roundName(2 ** (total - 1 - i), i), date: dates[i], drawn: false, drawDate: dates[i - 1], ties: [] });
      const winner = leanCupWinner(wk, season, lc.cup);
      const final = played[played.length - 1]?.ties.length === 1 ? played[played.length - 1].ties[0] : null;
      const byes = played[0]?.byes.length ?? 0;
      const next = played.find((r) => !r.played);
      // Vereinswerte aus den gespielten Runden; „Beste Abwehr“ nur unter Vereinen, die (fast) so weit kamen wie die Besten.
      const cs = new Map<string, { n: number; gf: number; ga: number; w: number }>();
      for (const r of played) for (const t of r.ties) {
        if (t.hg == null || t.ag == null) continue;
        for (const [id, gf, ga] of [[t.home, t.hg, t.ag], [t.away, t.ag, t.hg]] as [string, number, number][]) {
          const e = cs.get(id) ?? { n: 0, gf: 0, ga: 0, w: 0 };
          e.n++; e.gf += gf; e.ga += ga; if (t.winner === id) e.w++;
          cs.set(id, e);
        }
      }
      const all = [...cs].map(([clubId, e]) => ({ clubId, ...e }));
      const most = Math.max(0, ...all.map((e) => e.n));
      const topOf = (f: (e: (typeof all)[number]) => number, low = false, min = 1) => all.filter((e) => e.n >= min)
        .sort((a, b) => (low ? f(a) - f(b) : f(b) - f(a)) || b.n - a.n || a.clubId.localeCompare(b.clubId)).slice(0, 10).map((e) => ({ clubId: e.clubId, value: f(e) }));
      const stats = lc.live ? leanCupStats(g, wk, season, lc.cup)
        : archivedStats(g.world?.history.find((r) => r.season === season), `${wk}|cup`, () => leanCupStats(g, wk, season, lc.cup));
      return {
        ...base, source: lc.live ? 'live' : 'archive', rounds, winner, stats, finals: list,
        clubStats: { cw: cupCounts(list), ...(all.length ? { gf: topOf((e) => e.gf), ga: topOf((e) => e.ga, true, Math.max(1, most - 1)), w: topOf((e) => e.w) } : {}) },
        facts: [
          { k: 'Teilnehmer', text: `${lc.cup.ids.length} Vereine der ${leagueName(c.cc, 1)} und ${leagueName(c.cc, 2)}` },
          ...(winner ? [{ k: 'Pokalsieger', id: winner }] : next ? [{ k: 'Nächste Runde', text: `${next.name} am ${next.date.slice(8)}.${next.date.slice(5, 7)}.` }] : []),
          ...(winner && final ? [{ k: 'Finalgegner', id: final.winner === final.home ? final.away : final.home }] : []),
          ...(byes ? [{ k: 'Freilose 1. Runde', text: String(byes) }] : []),
        ],
        note: `Der ${cupLabel(c.cc)} von ${c.name} wird Runde für Runde gespielt: jede Runde neu gelost, ein Spiel, bei Gleichstand Verlängerung und Elfmeterschießen. Ergebnis aus Vereinsstärke und Heimvorteil, ohne Kader.`,
      };
    }
    const simulated = c.mode === 'world' || (c.mode === 'div' && c.cc !== 'gdr');
    const note = source === 'data'
      ? 'Vor Spielbeginn: Pokalsieger und Finalgegner aus den Weltdaten (Vereine verfremdet).'
      : simulated
        ? `Aus dieser Saison ist vom ${cupLabel(c.cc)} in ${c.name} nur der Sieger gespeichert. Neue Saisons haben alle Runden.`
        : `Der ${cupLabel(c.cc)} wird im Spiel nicht simuliert – bekannt sind nur die Sieger vor Spielbeginn.`;
    return {
      ...base, winner: hit?.winner ?? null, winners: list, note,
      clubStats: { cw: cupCounts(list) },
      facts: [
        hit?.winner ? { k: 'Pokalsieger', id: hit.winner } : { k: 'Pokalsieger', text: source === 'roster' || source === 'live' ? (simulated ? 'wird am Saisonende ermittelt' : 'nicht simuliert') : 'nicht simuliert' },
        ...(hit?.finalist ? [{ k: 'Finalgegner', id: hit.finalist }] : []),
      ],
    };
  }

  if (key === 'd1' || /^d2(:\d+)?$/.test(key) || key === 'd2b') {
    const row = worldSeason(c.cc, y)!;
    const gi = key === 'd2b' ? 1 : key.startsWith('d2:') ? Number(key.slice(3)) - 1 : 0;
    const ids = (key === 'd1' ? row.t1 : rowGroups(row)[gi] ?? []).map((id) => mapId(g, id));
    return {
      ...base, tier: key === 'd1' ? (c.cc === 'gdr' ? 101 : 1) : 2, placingsOnly: true, table: placings(ids),
      caption: `Abschlusstabelle ${season} · vor Spielbeginn`,
      facts: [
        { k: key === 'd1' ? 'Meister' : 'Erster', id: ids[0] },
        ...(key === 'd1' && row.cup ? [{ k: 'Pokalsieger', id: mapId(g, row.cup) }] : []),
        ...(row.note ? [{ k: 'Anmerkung', text: row.note }] : []),
      ],
      note: key === 'd1'
        ? 'Vor Spielbeginn: Reihenfolge der echten Abschlusstabelle aus den Weltdaten, Vereine verfremdet. Punkte und Tore liegen nicht vor.'
        : 'Vor Spielbeginn: Reihenfolge laut Weltdaten, soweit bekannt.',
    };
  }

  const wc = g.world?.countries[wk];
  // Schlanke Spieltag-Simulation (game/worldLeagues.ts): laufende Saison und die letzten Saisons mit allen Ergebnissen.
  const lean = leanDivFor(g, wk, season, key);
  if (lean) {
    let rows = leanTable(lean.div, wk, season);
    if (!lean.md) rows = [...rows].sort((a, b) => compClubName(g, a.clubId, season).localeCompare(compClubName(g, b.clubId, season), 'de')).map((r, i) => ({ ...r, pos: i + 1 }));
    const top = (f: (r: (typeof rows)[number]) => number, low = false) => [...rows].sort((a, b) => (low ? f(a) - f(b) : f(b) - f(a)) || a.pos - b.pos).slice(0, 10).map((r) => ({ clubId: r.clubId, value: f(r) }));
    const idx = leanIdxOf(key), tier2 = idx > 0, tierN = leanTierOf(idx).tier;
    const nGroups = Math.max(1, countryOptions(g, c, season, source).filter((o) => o.kind === 'league' && o.tier === tierN).length);
    const prev = [...(g.world?.history ?? [])].reverse().find((r) => r.season < season && r.champions[wk]);
    const rec = g.world?.history.find((r) => r.season === season);
    const games = rows.reduce((a, r) => a + r.p, 0) / 2, goals = rows.reduce((a, r) => a + r.gf, 0);
    return {
      ...base, source: lean.live ? 'live' : 'archive', tier: tierN,
      table: rows.map((r) => ({ clubId: r.clubId, pos: r.pos, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts, form: r.form })),
      zones: !lean.md ? [] : tierN >= 3 ? deepZones(g, wk, season, tierN, rows.length, nGroups) : leanZones(g, wk, season, tier2, rows.length, nGroups),
      // Laufende Saison ohne Zeile über der Tabelle (Wunsch Pascal) – Land und Spieltag stehen schon in Kopf und Spieltag-Wahl.
      caption: !lean.live ? `Abschlusstabelle ${season}` : undefined,
      clubStats: lean.md ? { gf: top((r) => r.gf), ga: top((r) => r.ga, true), w: top((r) => r.w), cs: top((r) => r.cs), ti: titleList(g, wk) } : { ti: titleList(g, wk) },
      facts: [
        ...(lean.live ? [{ k: 'Spieltag', text: `${lean.md} von ${lean.total}` }] : []),
        ...(lean.md && rows[0] ? [{ k: lean.live ? 'Tabellenführer' : tier2 ? 'Erster' : 'Meister', id: rows[0].clubId }] : []),
        ...(!lean.live && !tier2 && rec?.cupWinners[wk] ? [{ k: 'Pokalsieger', id: rec.cupWinners[wk] }] : []),
        ...(lean.live && prev && !tier2 ? [{ k: `Meister ${prev.season}`, id: prev.champions[wk] }] : []),
        ...(games ? [{ k: 'Tore gesamt · Ø pro Spiel', text: `${goals} · ${(goals / games).toFixed(2).replace('.', ',')}` }] : []),
      ],
      // Einzelstatistik wie bei der Heimatliga (Wunsch Pascal): fest aus den Kadern des Spielerpools verteilt.
      stats: !lean.md || tierN >= 3 ? emptyLeanStats() : lean.live ? leanStats(g, lean.div, season) : archivedStats(rec, `${wk}|${idx}`, () => leanStats(g, lean.div, season)),
      note: tierN >= 3 ? DEEP_NOTE(c.name) : `${c.name} wird Spieltag für Spieltag simuliert: Ergebnis aus Vereinsstärke und Heimvorteil. Torschützen, Vorlagen, Karten und Zu-null-Spiele werden daraus auf die Kader des Spielerpools verteilt.`,
    };
  }
  if (key[0] === 'r' && leanIdxOf(key) >= 0) {
    const ri = leanIdxOf(key);
    const ids = [...((ri === 0 ? wc?.tiers[0] : ri >= 100 ? (wc ? deepGroupsOf(wc, leanTierOf(ri).tier - 3)[leanTierOf(ri).group] : undefined) : wc ? secondGroups(wc)[ri - 1] : undefined) ?? [])].sort((a, b) => compClubName(g, a, season).localeCompare(compClubName(g, b, season), 'de'));
    const prev = [...(g.world?.history ?? [])].reverse().find((r) => r.champions[wk]);
    return {
      ...base, roster: true, placingsOnly: true, table: placings(ids),
      caption: `Teilnehmer ${season} · ${ids.length} Vereine, alphabetisch`,
      clubStats: { ti: titleList(g, wk) },
      facts: [
        { k: 'Saison', text: 'läuft im Hintergrund' },
        ...(prev ? [{ k: `Meister ${prev.season}`, id: prev.champions[wk] }] : []),
      ],
      note: `${c.name} läuft im Hintergrund: die Saison wird am Saisonende in einem Zug ausgespielt – eine laufende Tabelle gibt es nicht. Die letzte Abschlusstabelle findest du eine Saison zurück.`,
    };
  }

  if (key.startsWith('w2:')) return null;
  // w1: abgeschlossene Hintergrund-Saison
  const hist = g.world?.history ?? [];
  const idx = hist.findIndex((r) => r.season === season);
  const rec = hist[idx];
  const isLast = idx === hist.length - 1;
  const ids = rec?.tables?.[wk] ?? (isLast ? wc?.lastTable ?? [] : []);
  const champ = rec?.champions[wk];
  // Frühere „Spiel für Spiel“-Länder (game/fullCountries.ts): volle Abschlusstabelle aus dem Liga-Archiv.
  const archId = `x-${c.cc}-${key === 'w2' ? 2 : 1}`;
  if (archivedSeason(g, season)?.divisions.some((d) => d.id === archId)) {
    const s = buildSnapshot(g, season, archId);
    if (s?.table?.length) {
      const games = s.table.reduce((a, r) => a + r.p, 0) / 2, goals = s.table.reduce((a, r) => a + r.gf, 0);
      return {
        ...s, key, label: opt.label, tier: key === 'w2' ? 2 : 1, caption: `Abschlusstabelle ${season}`,
        clubStats: { ...s.clubStats, ti: titleList(g, wk) },
        zones: leanZones(g, wk, season, key === 'w2', s.table.length),
        facts: [
          { k: key === 'w2' ? 'Erster' : 'Meister', id: s.table[0].clubId },
          ...(key === 'w1' && rec?.cupWinners[wk] ? [{ k: 'Pokalsieger', id: rec.cupWinners[wk] }] : []),
          ...(games ? [{ k: 'Tore gesamt · Ø pro Spiel', text: `${goals} · ${(goals / games).toFixed(2).replace('.', ',')}` }] : []),
        ],
        note: 'Aus dieser Saison ist die Abschlusstabelle gespeichert; Begegnungen und Spieltage gibt es für neuere Saisons.',
      };
    }
  }
  if (key.startsWith('w2')) return null;
  return {
    ...base, tier: 1, placingsOnly: true, table: placings(ids),
    caption: `Abschlusstabelle ${season} · Hintergrund-Simulation`,
    clubStats: { ti: titleList(g, wk) },
    emptyText: !ids.length && champ ? `Für ${season} ist nur der Meister gespeichert – die Abschluss-Reihenfolge behält das Spiel für die letzten 10 Saisons.` : undefined,
    facts: [
      ...(champ ? [{ k: 'Meister', id: champ }] : []),
      ...(rec?.cupWinners[wk] ? [{ k: 'Pokalsieger', id: rec.cupWinners[wk] }] : []),
    ],
    note: 'Aus dieser Saison ist nur die Abschluss-Reihenfolge gespeichert (älterer Spielstand). Neue Saisons haben volle Tabellen mit Punkten und Toren.',
  };
}

/** Saison-Suffix in der Auswahl. */
export function seasonSuffix(s: CSeasonOption): string {
  return s.source === 'live' || s.source === 'roster' ? '' : s.source === 'history' || s.source === 'data' ? ' (vor Spielbeginn)' : '';
}

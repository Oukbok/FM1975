// =============================================================================
// Spielstart in einem beliebigen Jahr / Land (Wunsch Pascal) – Bausteine für newGame.ts
// -----------------------------------------------------------------------------
// Ligen unterhalb der 2. Liga (Struktur des Jahres), Vereins-Pool, Europapokal-Starter
// der Startsaison, Historie vor dem Start aus den Weltdaten. Deutschland 1975 ohne
// Weltdaten läuft weiter über den alten Weg in newGame.ts.
// =============================================================================
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../data/generate';
import { COUNTRY_SEEDS, EURO_EXCLUSIONS } from '../data/worldSeed';
import { COUNTRY_BY_CC, seasonLabelOf } from '../data/world/countries';
import { worldSeason } from '../data/world/index';
import { makePlaceholder, structureForSeason, LEAGUE_REFORMS } from '../data/reforms';
import { POOL_TIER } from '../data/history/historicClubs';
import { seasonStartYear } from '../data/timeline';
import { accessSlots } from '../data/euroFormats';
import type { EuroCompId } from '../data/europe';
import { buildDivision, LeagueGroup, SimClub } from '../engine/leagues';
import { EURO_MAP } from '../engine/worldData';
import { addHistoricSeason, addHistoricTitle } from './clubRecords';
import { ComposedHome, countryLevelOf, poolClubsOf } from './worldCompose';
import type { Game } from './state';
import type { EuroComp } from '../data/world/types';

export const MIN_START_YEAR = 1975;
export const MAX_START_YEAR = 2025;
export const clampStartYear = (y?: number) => Math.max(MIN_START_YEAR, Math.min(MAX_START_YEAR, Math.round(y ?? 1975)));

/** Reformen, die zum Startjahr schon gelten (Deutschland) bzw. alle (andere Heimatländer). */
export function reformsAppliedAt(year: number, home: string): string[] {
  return LEAGUE_REFORMS.filter((r) => home !== 'ger' || seasonStartYear(r.effectiveSeason) <= year).map((r) => r.reformId);
}

/** Pool-Kandidaten bei Start mit Weltdaten: übrige Vereine des Landes + (Deutschland) Vereine von 1975. */
export function seedStartPool(g: Game, home: string, year: number): void {
  const known = (id: string) => !!g.clubs[id] || !!g.simClubs[id];
  const taken = new Set<string>([...Object.keys(g.clubs), ...Object.keys(g.simClubs)]);
  for (const s of poolClubsOf(home, year, taken, POOL_TIER)) if (!known(s.id)) g.simClubs[s.id] = s;
  if (home !== 'ger') return;
  // Erstligisten/Zweitligisten von 1975 ohne Platz: im Unterbau weiterführen.
  for (const s of CLUB_SEEDS) {
    if (known(s.id)) continue;
    g.simClubs[s.id] = { id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: 56, colors: { primary: s.primary, secondary: s.secondary }, tier: POOL_TIER, group: 'west' };
  }
  for (const [list, group] of [[SECOND_LIGA_NORD_SEEDS, 'nord'], [SECOND_LIGA_SUED_SEEDS, 'sued']] as const) {
    for (const s of list) {
      if (known(s.id)) continue;
      g.simClubs[s.id] = { id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: Math.min(56, s.strength - 4), colors: { primary: s.primary, secondary: s.secondary }, tier: POOL_TIER, group };
    }
  }
}

/** Ebenen ab Tier 3 (Struktur des Startjahres, Deutschland) aus dem Pool füllen, Rest Platzhalter. */
export function fillLowerTiers(g: Game, year: number, ligaStart: string): void {
  const season = seasonLabelOf(year);
  const targets = structureForSeason(season).filter((t) => t.tier >= 3);
  if (!targets.length) return;
  const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
  const used = new Set<string>();
  for (const t of targets) {
    const want = t.teamCount;
    const pick = (pred: (s: SimClub) => boolean) => pool.filter((s) => !used.has(s.id) && pred(s));
    const ids: string[] = [];
    for (const s of [...pick((s) => s.group === t.group), ...pick(() => true)]) {
      if (ids.length >= want) break;
      if (used.has(s.id)) continue;
      used.add(s.id); ids.push(s.id);
    }
    while (ids.length < want) {
      const ph = makePlaceholder(`start:${season}`, t.tier, t.group);
      g.simClubs[ph.id] = ph;
      ids.push(ph.id);
    }
    for (const id of ids) { g.simClubs[id].tier = t.tier; g.simClubs[id].group = t.group as LeagueGroup; }
    g.leagues.otherDivisions.push(buildDivision({ id: t.id, name: t.name, tier: t.tier, group: t.group }, ids, g.pointSystem, season, ligaStart));
  }
}

/** Grober Rang des Landes in der Fünfjahreswertung beim Start (nach Grundniveau). */
export function startCountryRank(home: string, year: number): number {
  const mine = countryLevelOf(home, year);
  const others = [...COUNTRY_SEEDS.map((s) => s.name), 'Deutschland'].filter((k) => k !== COUNTRY_BY_CC[home]?.key);
  const lvl = (key: string) => key === 'Deutschland' ? 68 : countryLevelOf(Object.values(COUNTRY_BY_CC).find((c) => c.key === key)?.cc ?? '', year);
  return 1 + others.filter((k) => lvl(k) > mine).length;
}

/**
 * Europapokal-Starter des Heimatlandes in der Startsaison: aus den Weltdaten (`euro`),
 * sonst nach Ansehen mit den Startplätzen des Formats.
 */
export function startEuroQualifiers(g: Pick<Game, 'clubs' | 'simClubs'>, home: string, year: number, comp: ComposedHome | null): Record<EuroCompId, string[]> {
  const exists = (id: string) => !!g.clubs[id] || !!g.simClubs[id];
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  if (homeExcluded(home, year)) return out;
  const euro = (comp?.row ?? worldSeason(home, year))?.euro;
  if (euro) {
    for (const [k, ids] of Object.entries(euro) as [EuroComp, string[]][]) {
      const c = EURO_MAP[k];
      for (const id of ids ?? []) if (exists(id) && !out.ec.includes(id) && !out.cwc.includes(id) && !out.uefa.includes(id)) out[c].push(id);
    }
    if (out.ec.length + out.cwc.length + out.uefa.length) return out;
  }
  const slots = accessSlots(year, startCountryRank(home, year));
  const t1 = (comp?.tier1.map((s) => s.id) ?? Object.keys(g.clubs)).filter((id) => g.clubs[id] && !id.startsWith('am'));
  const ranked = [...t1].sort((a, b) => (g.clubs[b]?.reputation ?? 0) - (g.clubs[a]?.reputation ?? 0));
  const take = (n: number) => ranked.splice(0, n);
  out.ec = take(slots.ec);
  out.cwc = take(slots.cwc);
  out.uefa = take(slots.uefa);
  return out;
}

/** Endplätze/Titel der Saisons vor dem Start aus den Weltdaten in die Vereins-Historie. */
export function seedPreStartHistory(g: Game, home: string, year: number): void {
  for (let y = Math.max(1975, year - 25); y < year; y++) {
    const row = worldSeason(home, y);
    if (!row) continue;
    const season = seasonLabelOf(y);
    const known = (ids: string[]) => ids.filter((id) => g.clubs[id] || g.simClubs[id]);
    addHistoricSeason(g, season, '1. Liga', 1, row.t1);
    if (row.t2b?.length) {
      addHistoricSeason(g, season, '2. Liga Nord', 2, row.t2 ?? []);
      addHistoricSeason(g, season, '2. Liga Süd', 2, row.t2b);
    } else if (row.t2?.length) addHistoricSeason(g, season, '2. Liga', 2, row.t2);
    if (known([row.t1[0]]).length) addHistoricTitle(g, row.t1[0], 'meister', season);
    if (row.cup && known([row.cup]).length) addHistoricTitle(g, row.cup, 'pokal', season);
  }
  if (home === 'ger') {
    for (let y = Math.max(1975, year - 25); y < Math.min(year, 1991); y++) {
      const row = worldSeason('gdr', y);
      if (!row) continue;
      addHistoricSeason(g, seasonLabelOf(y), 'DDR-Oberliga', 101, row.t1);
      addHistoricTitle(g, row.t1[0], 'ddr', seasonLabelOf(y));
    }
  }
}

/** Städte für Pokal-Amateure eines Landes (ohne Städte der Ligavereine). */
export function amateurTownsFor(home: string, usedCities: Set<string>): string[] | undefined {
  if (home === 'ger') return undefined;
  const seed = COUNTRY_SEEDS.find((s) => s.name === COUNTRY_BY_CC[home]?.key);
  const towns = (seed?.cities ?? []).filter((c) => !usedCities.has(c));
  return towns.length >= 6 ? towns : [...towns, ...['Nord', 'Süd', 'Ost', 'West', 'Mitte', 'Hafen', 'Altstadt', 'Neustadt'].map((x) => `${COUNTRY_BY_CC[home]?.name ?? ''} ${x}`.trim())];
}

/** Heimatland in der Saison vom Europapokal ausgeschlossen (z. B. England 1985–1990). */
export function homeExcluded(home: string, year: number): boolean {
  const key = COUNTRY_BY_CC[home]?.key;
  return home !== 'ger' && EURO_EXCLUSIONS.some((e) => e.country === key && year >= e.from && year <= e.to);
}

/**
 * Deutschland mit Weltdaten: hat die simulierte 2. Liga weniger Vereine als die Struktur des
 * Spiels (z. B. 18 statt 20 ab 1994), mit den stärksten Pool-Vereinen auffüllen – sonst
 * verschieben die Größenkorrekturen beim Saisonwechsel ungerade Zahlen in die Regionalligen.
 */
export function padSecondTier(g: Game, year: number, ligaStart: string): void {
  const season = seasonLabelOf(year);
  for (const t of structureForSeason(season).filter((x) => x.tier === 2)) {
    const i = g.leagues.otherDivisions.findIndex((d) => d.id === t.id);
    if (i < 0) continue;
    const d = g.leagues.otherDivisions[i];
    if (d.clubIds.length >= t.teamCount) continue;
    const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
    const ids = [...d.clubIds];
    for (const s of pool) { if (ids.length >= t.teamCount) break; s.tier = 2; s.group = t.group as LeagueGroup; ids.push(s.id); }
    g.leagues.otherDivisions[i] = buildDivision({ id: d.id, name: d.name, tier: d.tier, group: d.group }, ids, g.pointSystem, season, ligaStart);
  }
}

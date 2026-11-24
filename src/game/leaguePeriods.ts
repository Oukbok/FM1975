// =============================================================================
// ZEITRÄUME DES LIGENSYSTEMS (Statistiken › Ligensystem, Wunsch Pascal)
// -----------------------------------------------------------------------------
// Je Land die Abschnitte, in denen die Ligastruktur gleich war („1975/76 – 1980/81“,
// „2012/13 – heute“), und die Pyramide eines früheren Abschnitts. Keine zweite Wahrheit:
// abgeleitet aus denselben Daten, mit denen das Spiel die Ligen aufbaut –
//  • Deutschland: data/reforms.ts `structureForSeason` (simulierte Ebenen, Ligareformen)
//    + data/leagueTiers.ts (nicht simulierte Ebenen bis zur 4. Ebene);
//  • DDR: die feste Pyramide aus game/leagueSetup.ts (DDR-Oberliga, DDR-Liga) bis 1990/91;
//  • jedes andere Land (auch ein anderes Heimatland): data/world/structure.ts (1. Liga,
//    Staffeln der 2. Ebene, Auf-/Abstieg), data/world/deepStructure.ts (3./4. Ebene) und
//    data/leagueTiers.ts.
// Gleiche Struktur = gleiche Ebenen mit gleichem Namen, gleicher Staffelzahl und -größe.
// Abschnitte nach der laufenden Saison werden nie gezeigt (keine Spoiler). Ligen, die es nicht
// mehr gibt (DDR ab 1991/92, Sowjetunion, Jugoslawien, Tschechoslowakei), enden mit ihrer letzten
// Saison; ihr letzter Stand ist vorgewählt (Stempel „Archiviert“ in LeaguePyramid.tsx).
// Der laufende Abschnitt zeigt die Pyramide aus dem Spielstand (game/leaguePyramid.ts).
// =============================================================================
import { DDR_LIGA_ID, DDR_LIGA_SEEDS, DDR_OBERLIGA_ID, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { LEAGUE_REFORMS, structureForSeason } from '../data/reforms';
import { historicTiers } from '../data/leagueTiers';
import { leagueLabel, homeGroupKeys, structTierName } from '../data/leagueNames';
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { worldStructureFor } from '../data/world/structure';
import { deepLevelsFor } from '../data/world/deepStructure';
import { seasonStartYear } from '../data/timeline';
import { germanRank } from '../engine/world';
import {
  abroadZones, ddrZones, div, euroSlots, westZones, withHistoricTiers,
  type PyrDivision, type PyrSystem, type PyramidData, type PyramidSide,
} from './leaguePyramid';

export interface LeaguePeriod {
  /** Erste und letzte Saison (Startjahr) des Abschnitts. */
  from: number;
  to: number;
  /** Abschnitt der laufenden Saison (Pyramide aus dem Spielstand). */
  current: boolean;
  /** „1975/76 – 1980/81“, „2012/13 – heute“, „1985/86“. */
  label: string;
  /** Deutschland: Ligareform, die in diesem Abschnitt gilt (`effectiveSeason`). */
  reform?: string;
}

export interface PeriodSet {
  periods: LeaguePeriod[];
  /** Archivierte Liga: erste Saison ohne sie („1991/92“). */
  since?: string;
}

/** Auswahl im Ligensystem: Seite und bei „abroad“ der Länder-Schlüssel der Hintergrund-Welt. */
export interface PyrPick { side: PyramidSide; country: string }

interface Ctx { side: PyramidSide; cc: string; key: string; depth: number }

const FIRST_YEAR = 1975;

/** Ländercode einer Auswahl (Heimatland = Schlüssel der West-Pyramide). */
function ctxOf(data: PyramidData, pick: PyrPick): Ctx {
  if (pick.side === 'ddr') return { side: 'ddr', cc: 'gdr', key: 'ddr', depth: 2 };
  const sys = pick.side === 'west' ? data.west : data.abroad.find((a) => a.key === pick.country);
  const key = pick.side === 'west' ? (data.west.key === 'west' ? 'Deutschland' : data.west.key) : pick.country;
  const cc = COUNTRY_BY_KEY[key]?.cc ?? 'ger';
  // Simulierte Ebenen des Landes heute (Tiefe wächst nur, data/world/deepStructure.ts): Maß auch für frühere Abschnitte.
  const depth = Math.max(2, (sys?.levels ?? []).filter((lv) => !lv[0]?.pool && !lv[0]?.struct).length);
  return { side: pick.side, cc, key, depth };
}

/** Struktur-Kennung einer Saison: Ebenen mit Name und Staffelgrößen. */
function signature(c: Ctx, y: number): string {
  if (c.side === 'ddr') return 'ddr';
  if (c.cc === 'ger' && c.side === 'west') {
    const sim = structureForSeason(seasonLabelOf(y));
    const n = new Set(sim.map((t) => t.tier)).size;
    const rest = (historicTiers('ger', y) ?? []).slice(n).map((r) => `${r.name}:${r.groups}:${r.teams}`);
    return [...sim.map((t) => `${t.tier}:${t.name}:${t.teamCount}`), ...rest].join('|');
  }
  const st = worldStructureFor(c.cc, y);
  const deep = deepLevelsFor(c.cc, y, c.depth);
  const rows = historicTiers(c.cc, y) ?? [];
  const rest = rows.slice(2 + deep.length).map((r, i) => `${structTierName(c.cc, 3 + deep.length + i, y)}:${r.groups}:${r.teams}`);
  return [st?.t1 ?? '', (st?.groups ?? []).join(','), ...deep.map((d) => `${d.name}:${d.groups.join(',')}`), ...rest].join('|');
}

/** Letzte Saison (Startjahr) einer Liga, die es nicht mehr gibt; null = besteht. */
function lastYearOf(c: Ctx, year: number, sys: PyrSystem | undefined): number | null {
  const def = c.side === 'ddr' ? COUNTRY_BY_CC.gdr : COUNTRY_BY_CC[c.cc];
  if (c.side === 'west') return null;
  if (def?.to != null && def.to < year) return def.to;
  return sys?.archive ? Math.min(year - 1, def?.to ?? year - 1) : null;
}

/** Abschnitte gleicher Struktur eines Landes bis zur laufenden Saison (bzw. bis zur letzten Saison der Liga). */
export function leaguePeriods(data: PyramidData, pick: PyrPick): PeriodSet {
  const year = seasonStartYear(data.season);
  const c = ctxOf(data, pick);
  const sys = pick.side === 'west' ? data.west : pick.side === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === pick.country);
  const last = lastYearOf(c, year, sys);
  const def = c.side === 'ddr' ? COUNTRY_BY_CC.gdr : COUNTRY_BY_CC[c.cc];
  const first = Math.min(year, Math.max(FIRST_YEAR, def?.from ?? FIRST_YEAR));
  const end = last ?? year;
  const periods: LeaguePeriod[] = [];
  let sig = '';
  for (let y = first; y <= end; y++) {
    const s = signature(c, y);
    if (y === first || s !== sig) periods.push({ from: y, to: y, current: false, label: '' });
    else periods[periods.length - 1].to = y;
    sig = s;
  }
  for (const p of periods) {
    p.current = last == null && p.to === year;
    const a = seasonLabelOf(p.from);
    p.label = p.current ? `${a} – heute` : p.from === p.to ? a : `${a} – ${seasonLabelOf(p.to)}`;
    if (c.cc === 'ger' && c.side === 'west') {
      const r = [...LEAGUE_REFORMS].reverse().find((x) => seasonStartYear(x.effectiveSeason) <= p.from);
      p.reform = r?.effectiveSeason;
    }
  }
  return { periods, since: last != null ? seasonLabelOf(last + 1) : undefined };
}

// -----------------------------------------------------------------------------
// Pyramide eines früheren Abschnitts (letzte Saison des Abschnitts, nur Struktur)
// -----------------------------------------------------------------------------
const sized = (d: PyrDivision, n: number): PyrDivision => { d.size = n; return d; };

function gerLevels(y: number): PyrDivision[][] {
  const sim = structureForSeason(seasonLabelOf(y));
  const tiers = [...new Set(sim.map((t) => t.tier))].sort((a, b) => a - b);
  const lv = tiers.map((t) => sim.filter((x) => x.tier === t).map((x) => sized(div(x.id, x.name, t, x.group, [], 'table'), x.teamCount)));
  const e = euroSlots(y, germanRank(undefined, y));
  westZones(lv, e.champ, e.more);
  // Unterste simulierte Ebene: Absteiger in die erste Strukturebene (withHistoricTiers), sonst „Amateurligen“.
  for (const d of lv[lv.length - 1] ?? []) d.downTo = 'Abstieg in die Amateurligen';
  return withHistoricTiers(lv, 'ger', y, true);
}

function ddrLevels(): PyrDivision[][] {
  const lv = [
    [sized(div(DDR_OBERLIGA_ID, 'DDR-Oberliga', 1, 'nordost', [], 'table'), DDR_OBERLIGA_SEEDS.length)],
    [sized(div(DDR_LIGA_ID, 'DDR-Liga', 2, 'nordost', [], 'table'), DDR_LIGA_SEEDS.length)],
  ];
  ddrZones(lv);
  lv[1][0].downTo = 'Abstieg in die Bezirksligen';
  return lv;
}

function worldLevels(c: Ctx, y: number): PyrDivision[][] {
  const st = worldStructureFor(c.cc, y);
  const lv: PyrDivision[][] = [];
  lv.push([sized(div(`p:${c.key}:0`, leagueLabel(c.cc, 1), 1, null, [], 'table'), st?.t1 ?? COUNTRY_BY_CC[c.cc]?.t1 ?? 18)]);
  const gs = st?.groups ?? (COUNTRY_BY_CC[c.cc]?.t2 ? [COUNTRY_BY_CC[c.cc]!.t2!] : []);
  const keys = homeGroupKeys(gs.length);
  if (gs.length) lv.push(gs.map((n, k) => sized(div(`p:${c.key}:${k + 1}`, leagueLabel(c.cc, 2, { n: gs.length, i: k }), 2, keys[k] ?? null, [], 'table'), n)));
  const deep = gs.length ? deepLevelsFor(c.cc, y, c.depth) : [];
  for (const d of deep) {
    const n = d.groups.length, keysK = homeGroupKeys(n);
    lv.push(d.groups.map((size, i) => sized(div(`p:${c.key}:d${d.tier}:${i}`, leagueLabel(c.cc, d.tier, { n, i, year: y }), d.tier, keysK[i] ?? null, [], 'table'), size)));
  }
  abroadZones(lv, c.cc, st, deep.length, true, y);
  return withHistoricTiers(lv, c.cc, y, true);
}

/** Pyramide eines früheren Abschnitts bzw. letzter Stand einer archivierten Liga (Stand: letzte Saison). */
export function periodSystem(data: PyramidData, pick: PyrPick, p: LeaguePeriod, since?: string): PyrSystem {
  const c = ctxOf(data, pick);
  const base = pick.side === 'west' ? data.west : pick.side === 'ddr' ? data.ddr : data.abroad.find((a) => a.key === pick.country);
  const levels = c.side === 'ddr' ? ddrLevels() : c.cc === 'ger' && c.side === 'west' ? gerLevels(p.to) : worldLevels(c, p.to);
  const name = c.side === 'ddr' ? 'DDR' : COUNTRY_BY_CC[c.cc]?.name ?? c.key;
  const note = since
    ? `Letzter Stand der Saison ${seasonLabelOf(p.to)}. ${c.side === 'ddr' ? 'Seit der Wiedervereinigung spielen die Vereine aus dem Osten in der gesamtdeutschen Pyramide.' : `Danach spielen die Vereine in den Ligen der Nachfolgestaaten.`}`
    : `Struktur der Saison ${seasonLabelOf(p.to)} (${name}). Vereinszahlen und Auf-/Abstieg wie im Saisonwechsel dieser Zeit.`;
  return {
    side: base?.side ?? pick.side, key: base?.key ?? c.key, title: base?.title ?? name,
    levels, available: true, past: true, stand: seasonLabelOf(p.to), archive: !!since, since, note,
  };
}

/** Pyramidendaten mit dem System des gewählten Abschnitts (laufender Abschnitt = Spielstand unverändert). */
export function withPeriod(data: PyramidData, pick: PyrPick, set: PeriodSet, p: LeaguePeriod | undefined): PyramidData {
  const reforms = data.reforms.map((r) => ({ ...r, on: !!p?.reform && r.season === p.reform }));
  if (!p || p.current) return { ...data, reforms };
  const sys = periodSystem(data, pick, p, set.since);
  if (pick.side === 'west') return { ...data, reforms, west: sys };
  if (pick.side === 'ddr') return { ...data, reforms, ddr: sys };
  return { ...data, reforms, abroad: data.abroad.map((a) => (a.key === pick.country ? sys : a)) };
}

/** Vorauswahl: dein Verein in der DDR (DDR-Start) → DDR, sonst das Heimatland. */
export function defaultPick(data: PyramidData, mineId?: string): PyrPick {
  const mineInDdr = !!mineId && !!data.ddr.available && data.ddr.levels.flat().some((d) => d.clubs.some((x) => x.id === mineId));
  return { side: mineInDdr ? 'ddr' : 'west', country: data.abroad.find((a) => a.available)?.key ?? '' };
}

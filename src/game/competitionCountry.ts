// =============================================================================
// LÄNDERWAHL der Wettbewerbs-Seiten (Statistiken › Liga / Pokal; Wunsch Pascal)
// -----------------------------------------------------------------------------
// Legt eine Länderebene über game/competitionView.ts:
//  - Heimatland: wie bisher (Historie, Archiv, laufend) + Weltdaten-Saisons vor dem Startjahr.
//  - DDR (Heimat Deutschland) und Länder „Spiel für Spiel“: Ligen aus Archiv/laufender Saison
//    (bekannte Schlüssel, z. B. `ddr-oberliga`, `x-eng-1`) + Weltdaten vor dem Startjahr.
//  - Hintergrund-Länder (engine/world.ts): Abschluss-Reihenfolge aus der Welt-Historie
//    (`WorldSeasonRecord.tables`, letzte 10 Saisons), Meister/Pokalsieger älterer Saisons,
//    die laufende Saison nur als Teilnehmerliste (wird am Saisonende in einem Zug gerechnet).
// Eigene Schlüssel: d1/d2/d2b/xcup (Weltdaten), w1 (Hintergrund), r1/r2 (Teilnehmer).
// =============================================================================
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { worldSeason, worldYears } from '../data/world/index';
import { seasonStartYear } from '../data/timeline';
import { leagueArchive } from './leagueArchive';
import {
  buildSnapshot, compClubName, competitionOptions, seasonOptions,
  type CompOption, type CompSnapshot, type Source,
} from './competitionView';
import { homeCountryOf, type Game } from './state';

export type CountryMode = 'home' | 'div' | 'world';
export interface StatsCountry { cc: string; name: string; flag: string; mode: CountryMode; worldKey?: string; hint: string }
export type CSource = Source | 'data' | 'world' | 'roster';
export interface CSeasonOption { season: string; source: CSource }

const OWN_KEYS = new Set(['d1', 'd2', 'd2b', 'xcup', 'w1', 'r1', 'r2']);
const startYearOf = (g: Game) => g.startYear ?? 1975;
const nameOf = (cc: string, key?: string) => COUNTRY_BY_CC[cc]?.name ?? key ?? cc;

// -----------------------------------------------------------------------------
// Länder
// -----------------------------------------------------------------------------
export function statsCountries(g: Game): StatsCountry[] {
  const home = homeCountryOf(g);
  const out: StatsCountry[] = [{ cc: home, name: nameOf(home), flag: COUNTRY_BY_CC[home]?.key ?? 'Deutschland', mode: 'home', hint: 'Heimatland' }];
  if (home === 'ger') out.push({ cc: 'gdr', name: 'DDR', flag: 'DDR', mode: 'div', hint: 'bis 1990/91' });
  for (const cc of g.fullCountries ?? []) if (!out.some((c) => c.cc === cc)) out.push({ cc, name: nameOf(cc), flag: COUNTRY_BY_CC[cc]?.key ?? cc, mode: 'div', hint: 'Spiel für Spiel' });
  const rest: StatsCountry[] = [];
  for (const c of Object.values(g.world?.countries ?? {})) {
    const cc = COUNTRY_BY_KEY[c.name]?.cc ?? c.name;
    if (out.some((x) => x.cc === cc)) continue;
    rest.push({ cc, name: nameOf(cc, c.name), flag: c.name, mode: 'world', worldKey: c.name, hint: c.active ? 'Hintergrund' : 'aufgelöst' });
  }
  rest.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return [...out, ...rest];
}

/** Land einer Auswahl der Basis-Optionen (für Vorauswahl aus der Zentrale). */
export function countryOfKey(g: Game, season: string, key: string): { cc: string; key: string } {
  const home = homeCountryOf(g);
  if (key.startsWith('w:')) return { cc: COUNTRY_BY_KEY[key.slice(2)]?.cc ?? key.slice(2), key: 'w1' };
  const m = /^x-([a-z]+)-\d$/.exec(key);
  if (m) return { cc: m[1], key };
  const opt = competitionOptions(g, season).find((o) => o.key === key);
  if (opt?.section === 'DDR') return { cc: 'gdr', key };
  return { cc: home, key };
}

/** Gehört eine Basis-Option zu diesem Land? */
function belongs(o: CompOption, c: StatsCountry): boolean {
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
    out = c.mode === 'home' ? base : base.filter((s) => competitionOptions(g, s.season).some((o) => belongs(o, c)));
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
  if (hit && hit.source !== 'roster') return hit.season;
  const done = [...list].reverse().find((s) => s.source !== 'roster');
  return done?.season ?? list[list.length - 1]?.season ?? want;
}

// -----------------------------------------------------------------------------
// Wettbewerbe je Land und Saison
// -----------------------------------------------------------------------------
function dataLeagueOpts(cc: string, year: number): CompOption[] {
  const row = worldSeason(cc, year);
  if (!row) return [];
  const sec = nameOf(cc);
  const out: CompOption[] = [{ key: 'd1', label: cc === 'gdr' ? 'DDR-Oberliga' : '1. Liga', kind: 'league', section: sec }];
  if (row.t2?.length) out.push({ key: 'd2', label: row.t2b?.length ? (cc === 'ger' ? '2. Liga Nord' : '2. Liga (Staffel 1)') : cc === 'gdr' ? 'DDR-Liga' : '2. Liga', kind: 'league', section: sec });
  if (row.t2b?.length) out.push({ key: 'd2b', label: cc === 'ger' ? '2. Liga Süd' : '2. Liga (Staffel 2)', kind: 'league', section: sec });
  return out;
}

const cupLabel = (cc: string) => (cc === 'gdr' ? 'FDGB-Pokal' : 'Landespokal');

export function countryOptions(g: Game, c: StatsCountry, season: string, source: CSource): CompOption[] {
  const y = seasonStartYear(season);
  const cup: CompOption = { key: 'xcup', label: cupLabel(c.cc), kind: 'cup', section: 'Pokal' };
  if (source === 'data') return [...dataLeagueOpts(c.cc, y), cup];
  if (c.mode !== 'world') {
    const base = competitionOptions(g, season).filter((o) => belongs(o, c));
    return c.mode === 'home' ? base : [...base, cup];
  }
  const l1 = c.cc === 'gdr' ? 'DDR-Oberliga' : '1. Liga', l2 = c.cc === 'gdr' ? 'DDR-Liga' : '2. Liga';
  if (source === 'roster') return [
    { key: 'r1', label: l1, kind: 'league', section: c.name },
    ...(g.world?.countries[c.worldKey!]?.tiers[1]?.length ? [{ key: 'r2', label: l2, kind: 'league' as const, section: c.name }] : []),
    cup,
  ];
  return [{ key: 'w1', label: l1, kind: 'league', section: c.name }, cup];
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

export function countrySnapshot(g: Game, c: StatsCountry, season: string, source: CSource, key: string): CompSnapshot | null {
  const opt = countryOptions(g, c, season, source).find((o) => o.key === key);
  if (!opt) return null;
  if (!OWN_KEYS.has(key)) {
    const s = buildSnapshot(g, season, key);
    if (s && c.mode === 'div' && s.kind === 'league') s.caption = s.source === 'live' ? `${c.name} · laufende Saison, Spiel für Spiel` : `Abschlusstabelle ${season}`;
    return s;
  }
  const y = seasonStartYear(season);
  const base = { key, label: opt.label, season, kind: opt.kind, source: (source === 'roster' ? 'live' : 'archive') as Source } as CompSnapshot;
  const wk = c.worldKey ?? COUNTRY_BY_CC[c.cc]?.key ?? c.name;

  if (key === 'xcup') {
    const list = cupWinners(g, c);
    const hit = list.find((w) => w.season === season);
    const simulated = c.mode === 'world' || (c.mode === 'div' && c.cc !== 'gdr');
    const note = source === 'data'
      ? 'Vor Spielbeginn: Pokalsieger und Finalgegner aus den Weltdaten (Vereine verfremdet).'
      : simulated
        ? `Der ${cupLabel(c.cc)} von ${c.name} wird nicht Spiel für Spiel simuliert – im Hintergrund wird am Saisonende nur der Sieger ermittelt.`
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

  if (key === 'd1' || key === 'd2' || key === 'd2b') {
    const row = worldSeason(c.cc, y)!;
    const ids = (key === 'd1' ? row.t1 : key === 'd2' ? row.t2 ?? [] : row.t2b ?? []).map((id) => mapId(g, id));
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
  if (key === 'r1' || key === 'r2') {
    const ids = [...(wc?.tiers[key === 'r1' ? 0 : 1] ?? [])].sort((a, b) => compClubName(g, a, season).localeCompare(compClubName(g, b, season), 'de'));
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

  // w1: abgeschlossene Hintergrund-Saison
  const hist = g.world?.history ?? [];
  const idx = hist.findIndex((r) => r.season === season);
  const rec = hist[idx];
  const isLast = idx === hist.length - 1;
  const ids = rec?.tables?.[wk] ?? (isLast ? wc?.lastTable ?? [] : []);
  const champ = rec?.champions[wk];
  return {
    ...base, tier: 1, placingsOnly: true, table: placings(ids),
    caption: `Abschlusstabelle ${season} · Hintergrund-Simulation`,
    clubStats: { ti: titleList(g, wk) },
    emptyText: !ids.length && champ ? `Für ${season} ist nur der Meister gespeichert – die Abschluss-Reihenfolge behält das Spiel für die letzten 10 Saisons.` : undefined,
    facts: [
      ...(champ ? [{ k: 'Meister', id: champ }] : []),
      ...(rec?.cupWinners[wk] ? [{ k: 'Pokalsieger', id: rec.cupWinners[wk] }] : []),
    ],
    note: 'Europa im Hintergrund: von Auslandsligen ist nur die Abschluss-Reihenfolge bekannt (keine Punkte, Tore oder Einzelstatistiken).',
  };
}

/** Saison-Suffix in der Auswahl. */
export function seasonSuffix(s: CSeasonOption): string {
  return s.source === 'live' ? '' : s.source === 'roster' ? ' (läuft)' : s.source === 'history' || s.source === 'data' ? ' (vor Spielbeginn)' : '';
}

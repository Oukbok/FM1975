// =============================================================================
// WETTBEWERBS-ANSICHT: einheitliche Sicht auf Ligen und Pokale je Saison
// -----------------------------------------------------------------------------
// Quellen: laufende Saison (Spielstand), Archiv (game/leagueArchive.ts) und
// Historie vor Spielbeginn (data/history/). Die Seiten in views/statistiken/
// (Liga, Pokal, International) lesen nur diesen Schnappschuss.
// =============================================================================
import { COUNTRY_BY_CC } from '../data/world/countries';
import { homeCountryOf } from './state';
import { isLocalClub, localClubName } from './youthComps/localClubs';
import { EURO_COMP_NAMES } from '../data/europe';
import { HIST_FOREIGN, HIST_TOP_SCORERS } from '../data/history/finals';
import { HISTORIC_SEASONS, historicDivisions, historicFinal, type HistFinal } from '../data/history/seasons';
import { seasonLabel } from '../engine/calendar';
import type { LeagueGroup } from '../engine/leagues';
import { seasonStartYear } from '../data/timeline';
import type { CompTuple } from '../engine/compStats';
import type { CupState, CupTie, Match } from '../types';
import { euroCompName, euroFormat } from '../data/euroFormats';
import { groupStandings } from '../engine/euroGroups';
import type { GroupTable, GroupZone } from '../components/competition/GroupTables';
import { clubView } from './clubProfile';
import {
  STAT_CATS, archivedSeason, euroClubSet, leagueArchive, liveEntries, topLists, xEntries,
  type ArchCup, type ArchRow, type CupKey, type StatCat,
} from './leagueArchive';
import type { Game } from './state';

export type Source = 'history' | 'archive' | 'live';
export interface SeasonOption { season: string; source: Source }
export interface CompOption { key: string; label: string; kind: 'league' | 'cup'; section: string }

export interface TableRowLite {
  clubId: string; pos: number; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
  ded?: number; form?: ('W' | 'D' | 'L')[];
}
export interface TieLite {
  id: string; home: string; away: string; hg: number | null; ag: number | null; dec: 0 | 1 | 2;
  pen?: [number, number]; winner: string | null; date?: string; matchId?: string; mine?: boolean; scoreText?: string;
  /** Hin-/Rückspiel bzw. erstes Spiel + Wiederholung, Tore in Sicht der Begegnung (Heim = home). */
  legs?: [number, number][];
  /** Gesamtergebnis aus Hin- und Rückspiel (sonst: Wiederholungsspiel). */
  agg?: boolean;
  /** Durch Auswärtstore entschieden. */
  awayGoals?: boolean;
  /** Termine der Spiele (Hin-/Rückspiel, Wiederholung). */
  legDates?: string[];
}
export interface RoundLite {
  index: number; name: string; date?: string; drawn: boolean; drawDate?: string; hasDraw?: boolean; ties: TieLite[];
  /** Europapokal 2.0: K.-o.-Runde, Gruppen oder Ligaphase. */
  kind?: 'ko' | 'groups' | 'league';
  legs?: number;
  groups?: GroupTable[];
  zones?: GroupZone[];
  /** 1997/98: als beste Gruppenzweite weiter. */
  extraAdvance?: string[];
  /** Laufende Saison: Spiele der Gruppen/Ligaphase. */
  matches?: { id: string; md: number; date: string; group: string; home: string; away: string; hg: number | null; ag: number | null; matchId?: string; mine: boolean }[];
}
export interface StatRow { pid: string; name: string; clubId: string; pos: string; value: number; apps: number }
export type ClubStatCat = 'gf' | 'ga' | 'w' | 'cs' | 'ti';
export interface ClubStatRow { clubId: string; value: number }

export interface CompSnapshot {
  key: string; label: string; season: string; kind: 'league' | 'cup'; source: Source;
  tier?: number; group?: LeagueGroup;
  table?: TableRowLite[];
  /** Nur laufende Saison: Heim-/Auswärtstabelle. */
  split?: { home: TableRowLite[]; away: TableRowLite[] };
  /** Ausländische Liga: nur Platzierungen bekannt. */
  placingsOnly?: boolean;
  rounds?: RoundLite[];
  winner?: string | null;
  final?: HistFinal;
  stats?: Record<StatCat, StatRow[]> | null;
  clubStats?: Partial<Record<ClubStatCat, ClubStatRow[]>>;
  topScorer?: { clubs: string[]; goals: number };
  note?: string;
  /** Eigene Tabellenzonen je Platz (Index = Platz − 1), z. B. Jugend: Endrunde/Abstieg. */
  zones?: string[];
}

const CUP_LABEL = (k: CupKey, season: string) => (k === 'cup' ? 'Landespokal' : euroCompName(k, seasonStartYear(season)) ?? EURO_COMP_NAMES[k]);

/** Zonen einer Gruppen-/Ligarunde (Weiterkommen, Zwischenrunde, Wechsel) nach Format der Saison. */
function zonesFor(k: CupKey, season: string, roundName: string): { zones: GroupZone[]; legs?: number } {
  if (k === 'cup') return { zones: [] };
  const y = seasonStartYear(season);
  const fmt = euroFormat(k, y);
  const st = fmt?.stages.find((x) => x.name === roundName);
  if (!fmt || !st) return { zones: [] };
  const zones: GroupZone[] = (st.advance ?? []).map((a) => {
    const tgt = (a.comp ? euroFormat(a.comp, y) : fmt)?.stages.find((x) => x.key === a.target)?.name ?? a.target;
    const kind: GroupZone['kind'] = a.comp && a.comp !== k ? 'move' : a.target === 'po' && st.advance!.some((b) => b.target === 'af' && !b.comp) ? 'po' : 'adv';
    return { from: a.from, to: a.to, label: a.comp && a.comp !== k ? `${euroCompName(a.comp, y)} (${tgt})` : tgt, kind };
  });
  return { zones, legs: st.legs };
}

function tieLegs(t: CupTie): Pick<TieLite, 'legs' | 'agg' | 'awayGoals' | 'legDates'> {
  const ls = t.legs;
  if (!ls || (ls.length < 2 && !ls[0]?.played)) return {};
  const played = ls.filter((l) => l.played);
  const replay = t.id.startsWith('cup_');
  if (replay && ls.length < 2) return {};
  return {
    legs: played.map((l) => (l.home === t.homeClubId ? [l.homeGoals ?? 0, l.awayGoals ?? 0] : [l.awayGoals ?? 0, l.homeGoals ?? 0]) as [number, number]),
    agg: ls.length === 2 && !replay, awayGoals: !!t.awayGoalsWin, legDates: ls.map((l) => l.date),
  };
}

// -----------------------------------------------------------------------------
// Auswahl
// -----------------------------------------------------------------------------
export function seasonOptions(g: Game): SeasonOption[] {
  // Historie 1963–1975 gehört zu Deutschland (andere Heimatländer: erst ab Spielbeginn).
  const out: SeasonOption[] = homeCountryOf(g) === 'ger' ? HISTORIC_SEASONS.map((season) => ({ season, source: 'history' as Source })) : [];
  for (const s of leagueArchive(g)?.seasons ?? []) if (!out.some((o) => o.season === s.season)) out.push({ season: s.season, source: 'archive' });
  if (!out.some((o) => o.season === g.season)) out.push({ season: g.season, source: 'live' });
  return out.sort((a, b) => a.season.localeCompare(b.season));
}

function sourceOf(g: Game, season: string): Source | null {
  return seasonOptions(g).find((o) => o.season === season)?.source ?? null;
}

/** Abschnitt einer Liga in der Auswahl: Heimatland (Weltdaten), DDR, bzw. Länder Spiel für Spiel. */
const leagueSection = (tier: number, g?: Game) => (tier >= 200 ? 'Länder Spiel für Spiel' : tier >= 100 ? 'DDR' : homeName(g));
const homeName = (g?: Game) => (g ? COUNTRY_BY_CC[homeCountryOf(g)]?.name ?? 'Deutschland' : 'Deutschland');
const tierSort = (a: { tier: number; id: string }, b: { tier: number; id: string }) => a.tier - b.tier || a.id.localeCompare(b.id);

export function competitionOptions(g: Game, season: string): CompOption[] {
  const src = sourceOf(g, season);
  const out: CompOption[] = [];
  if (src === 'history') {
    for (const d of historicDivisions(season)) out.push({ key: d.id, label: d.name, kind: 'league', section: leagueSection(d.tier) });
    for (const k of ['cup', 'ec', 'cwc', 'uefa'] as CupKey[]) if (historicFinal(season, k)) out.push({ key: k, label: CUP_LABEL(k, season), kind: 'cup', section: k === 'cup' ? 'Pokal' : 'Europa' });
    return out;
  }
  if (src === 'archive') {
    const a = archivedSeason(g, season)!;
    for (const d of [...a.divisions].sort(tierSort)) out.push({ key: d.id, label: d.name, kind: 'league', section: leagueSection(d.tier, g) });
    for (const k of ['cup', 'ec', 'cwc', 'uefa'] as CupKey[]) if (a.cups[k]) out.push({ key: k, label: CUP_LABEL(k, season), kind: 'cup', section: k === 'cup' ? 'Pokal' : 'Europa' });
    // Auslandsligen: letzte Abschlusstabelle der Welt-Simulation gehört zur zuletzt beendeten Saison.
    if (g.world && season === seasonLabel(seasonStartYear(g.season) - 1)) {
      for (const c of Object.values(g.world.countries)) if (c.active && c.lastTable.length) out.push({ key: `w:${c.name}`, label: c.name, kind: 'league', section: 'Ausland' });
    }
    return out;
  }
  if (src === 'live') {
    const pd = g.leagues.playerDivision;
    const divs = [{ id: pd.id, name: pd.name, tier: pd.tier }, ...g.leagues.otherDivisions.map((d) => ({ id: d.id, name: d.name, tier: d.tier }))].sort(tierSort);
    for (const d of divs) out.push({ key: d.id, label: d.name, kind: 'league', section: leagueSection(d.tier, g) });
    if (g.cup) out.push({ key: 'cup', label: CUP_LABEL('cup', season), kind: 'cup', section: 'Pokal' });
    for (const k of ['ec', 'cwc', 'uefa'] as const) if (g.euroCups?.[k]) out.push({ key: k, label: CUP_LABEL(k, season), kind: 'cup', section: 'Europa' });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Bausteine
// -----------------------------------------------------------------------------
const fromArchRows = (rows: ArchRow[]): TableRowLite[] => rows.map((r, i) => ({
  clubId: r[0], pos: i + 1, p: r[1] + r[2] + r[3], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[6], ded: r[7],
}));

/** Heim- bzw. Auswärtstabelle aus beendeten Spielen. */
function splitTable(ids: string[], matches: Match[], side: 'home' | 'away', ptsWin: number): TableRowLite[] {
  const rows = new Map(ids.map((id) => [id, { clubId: id, pos: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } as TableRowLite]));
  for (const m of matches) {
    if (m.status !== 'finished' || !m.result) continue;
    const id = side === 'home' ? m.homeClubId : m.awayClubId;
    const r = rows.get(id);
    if (!r) continue;
    const f = side === 'home' ? m.result.homeGoals : m.result.awayGoals;
    const a = side === 'home' ? m.result.awayGoals : m.result.homeGoals;
    r.p++; r.gf += f; r.ga += a;
    if (f > a) { r.w++; r.pts += ptsWin; } else if (f === a) { r.d++; r.pts++; } else r.l++;
  }
  return [...rows.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf).map((r, i) => ({ ...r, pos: i + 1 }));
}

function clubStatsFromRows(rows: TableRowLite[], matches?: Match[]): CompSnapshot['clubStats'] {
  const top = (f: (r: TableRowLite) => number, low = false) => [...rows].sort((a, b) => (low ? f(a) - f(b) : f(b) - f(a))).slice(0, 10).map((r) => ({ clubId: r.clubId, value: f(r) }));
  const out: CompSnapshot['clubStats'] = { gf: top((r) => r.gf), ga: top((r) => r.ga, true), w: top((r) => r.w) };
  if (matches) {
    const cs = new Map(rows.map((r) => [r.clubId, 0]));
    for (const m of matches) {
      if (m.status !== 'finished' || !m.result) continue;
      if (m.result.awayGoals === 0 && cs.has(m.homeClubId)) cs.set(m.homeClubId, cs.get(m.homeClubId)! + 1);
      if (m.result.homeGoals === 0 && cs.has(m.awayClubId)) cs.set(m.awayClubId, cs.get(m.awayClubId)! + 1);
    }
    out.cs = [...cs.entries()].map(([clubId, value]) => ({ clubId, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }
  return out;
}

function liveStats(g: Game, code: 'L' | 'P' | 'E', filter?: (c: string) => boolean, n = 15): Record<StatCat, StatRow[]> {
  const entries = liveEntries(g, code, filter);
  const byPid = new Map<string, CompTuple>(entries.map((e) => [e.pid, e.t]));
  const lists = topLists(entries, n);
  const out = {} as Record<StatCat, StatRow[]>;
  for (const cat of STAT_CATS) {
    out[cat] = lists[cat].map(([pid, value]) => {
      const p = g.players[pid];
      return { pid, name: p?.fullName ?? pid, clubId: p?.clubId ?? '', pos: p?.naturalPosition ?? '', value, apps: byPid.get(pid)?.[0] ?? 0 };
    });
  }
  return out;
}

/** Bestenliste aus der Statistik am Wettbewerb (Europapokal 2.0: alle Spiele). */
function cupStats(g: Game, cup: CupState, n: number): Record<StatCat, StatRow[]> {
  const entries = xEntries(cup);
  const byPid = new Map<string, CompTuple>(entries.map((e) => [e.pid, e.t]));
  const lists = topLists(entries, n);
  const out = {} as Record<StatCat, StatRow[]>;
  for (const cat of STAT_CATS) {
    out[cat] = lists[cat].map(([pid, value]) => {
      const p = g.players[pid];
      const x = cup.xpeople?.[pid];
      return { pid, name: p?.fullName ?? x?.[0] ?? pid, clubId: p?.clubId ?? x?.[1] ?? '', pos: p?.naturalPosition ?? x?.[2] ?? '', value, apps: byPid.get(pid)?.[0] ?? 0 };
    });
  }
  return out;
}

function tiesOfCup(cup: CupState, mid: string, key: CupKey, strengthOf: (id: string) => number): RoundLite[] {
  const y = Number(cup.season.slice(0, 4));
  const fmt = key !== 'cup' && cup.v2 ? euroFormat(key, y) : null;
  return cup.rounds.map((r) => {
    const z = r.groups ? zonesFor(key, cup.season, r.name) : { zones: [] as GroupZone[] };
    const groups: GroupTable[] | undefined = r.groups?.map((gr) => ({
      name: gr.name,
      rows: groupStandings(gr, fmt?.winPts ?? 3, fmt?.tiebreak ?? 'h2h', strengthOf)
        .map((x) => ({ id: x.id, played: x.p, won: x.w, drawn: x.d, lost: x.l, gf: x.gf, ga: x.ga, pts: x.pts })),
    }));
    const best = fmt?.stages[r.index]?.bestRunnersUp;
    const extra = best ? (cup.rounds.find((x) => x.key === best.target)?.entrants ?? []).filter((id) => cup.rounds[r.index].groups?.some((gr) => gr.final?.[1] === id)) : undefined;
    return {
      index: r.index, name: r.name, date: r.date, drawn: r.drawn, drawDate: r.drawDate, hasDraw: !!r.draw,
      kind: r.kind, legs: r.legs, groups, zones: z.zones, extraAdvance: extra,
      matches: r.groups?.flatMap((gr) => gr.matches.map((m) => ({
        id: m.id, md: m.md, date: m.date, group: gr.name, home: m.home, away: m.away, hg: m.hg, ag: m.ag,
        matchId: m.match?.id, mine: m.home === mid || m.away === mid,
      }))),
      ties: r.ties.map((t) => ({
        id: t.id, home: t.homeClubId, away: t.awayClubId, hg: t.played ? t.homeGoals : null, ag: t.played ? t.awayGoals : null,
        dec: (t.decision === 'penalties' ? 2 : t.decision === 'aet' ? 1 : 0) as 0 | 1 | 2,
        pen: t.penalties ? [t.penalties.home, t.penalties.away] as [number, number] : undefined,
        winner: t.winnerClubId, date: t.date, matchId: t.match?.id ?? [...(t.legs ?? [])].reverse().find((l) => l.match)?.match?.id,
        mine: t.homeClubId === mid || t.awayClubId === mid, ...tieLegs(t),
      })),
    };
  });
}

function tiesOfArch(cup: ArchCup, mid: string, key: CupKey, season: string): RoundLite[] {
  return cup.rounds.map((r, i) => {
    const z = r.g ? zonesFor(key, season, r.n) : { zones: [] as GroupZone[] };
    return {
      index: i, name: r.n, drawn: true, kind: r.k === 'l' ? 'league' : r.k === 'g' ? 'groups' : 'ko', zones: z.zones,
      legs: r.l ? 2 : undefined,
      groups: r.g?.map((gr) => ({ name: gr.n, rows: gr.r.map((x) => ({ id: x[0], played: x[1], won: x[2], drawn: x[3], lost: x[4], gf: x[5], ga: x[6], pts: x[7] })) })),
      ties: r.t.map((t, j) => {
        const l = r.l?.[j];
        return {
          id: `${i}-${j}`, home: t[0], away: t[1], hg: t[2], ag: t[3], dec: t[4] as 0 | 1 | 2, winner: t[5] || null,
          pen: t[6] != null ? [t[6], t[7] ?? 0] as [number, number] : undefined, mine: t[0] === mid || t[1] === mid,
          ...(l ? {
            legs: (l[2] === 2 ? [[l[0], l[1]], [t[2], t[3]]] : [[l[0], l[1]], [t[2] - l[0], t[3] - l[1]]]) as [number, number][],
            agg: l[2] !== 2, awayGoals: l[2] === 1,
          } : {}),
        };
      }),
    } as RoundLite;
  });
}

// -----------------------------------------------------------------------------
// Schnappschuss
// -----------------------------------------------------------------------------
export function buildSnapshot(g: Game, season: string, key: string): CompSnapshot | null {
  const src = sourceOf(g, season);
  if (!src) return null;
  const mid = g.managedClubId;
  const opt = competitionOptions(g, season).find((o) => o.key === key);
  if (!opt) return null;
  const base = { key, label: opt.label, season, source: src, kind: opt.kind } as CompSnapshot;

  if (src === 'history') {
    if (opt.kind === 'league') {
      const d = historicDivisions(season).find((x) => x.id === key)!;
      const table = fromArchRows(d.rows);
      return {
        ...base, tier: d.tier, group: d.group, table, clubStats: clubStatsFromRows(table),
        topScorer: d.tier === 1 ? HIST_TOP_SCORERS[season] : undefined,
        note: 'Historie vor Spielbeginn: Abschlusstabelle der echten Saison, Vereine nach Städten benannt. Einzelstatistiken liegen nicht vor.',
      };
    }
    const f = historicFinal(season, key as CupKey)!;
    return {
      ...base, final: f, winner: f.winner,
      rounds: [{ index: 0, name: 'Finale', drawn: true, ties: [{ id: 'final', home: f.winner, away: f.runnerUp, hg: null, ag: null, dec: 0, winner: f.winner, scoreText: f.score, mine: false }] }],
      note: `Historie vor Spielbeginn: überliefert ist das Endspiel${f.venue ? ` (${f.venue})` : ''}${f.note ? ` – ${f.note}` : ''}.`,
    };
  }

  if (src === 'archive') {
    const a = archivedSeason(g, season)!;
    if (key.startsWith('w:')) {
      const c = Object.values(g.world?.countries ?? {}).find((x) => `w:${x.name}` === key);
      return {
        ...base, placingsOnly: true,
        table: (c?.lastTable ?? []).map((id, i) => ({ clubId: id, pos: i + 1, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 })),
        clubStats: { ti: Object.entries(c?.titles ?? {}).map(([clubId, value]) => ({ clubId, value })).sort((x, y) => y.value - x.value).slice(0, 10) },
        note: 'Europa im Hintergrund: von Auslandsligen ist nur die Abschluss-Reihenfolge bekannt.',
      };
    }
    const people = (pid: string) => a.people[pid] ?? [pid, '', ''];
    const statsFor = (k: string): Record<StatCat, StatRow[]> | null => {
      const s = a.stats[k];
      if (!s) return null;
      const out = {} as Record<StatCat, StatRow[]>;
      for (const cat of STAT_CATS) out[cat] = (s[cat] ?? []).map(([pid, value, apps]) => ({ pid, name: people(pid)[0], clubId: people(pid)[1], pos: people(pid)[2], value, apps }));
      return out;
    };
    if (opt.kind === 'league') {
      const d = a.divisions.find((x) => x.id === key)!;
      const table = fromArchRows(d.rows);
      return { ...base, tier: d.tier, group: d.group, table, stats: key === a.playerDiv ? statsFor(key) : null, clubStats: clubStatsFromRows(table) };
    }
    const cup = a.cups[key as CupKey]!;
    return { ...base, rounds: tiesOfArch(cup, mid, key as CupKey, season), winner: cup.winner, stats: statsFor(key) };
  }

  // Laufende Saison
  const pts = g.pointSystem === '3-point' ? 3 : 2;
  if (opt.kind === 'league') {
    const pd = g.leagues.playerDivision;
    if (key === pd.id) {
      const table: TableRowLite[] = g.table.rows.map((r) => ({ clubId: r.clubId, pos: r.position, p: r.played, w: r.won, d: r.drawn, l: r.lost, gf: r.goalsFor, ga: r.goalsAgainst, pts: r.points, ded: r.deduction, form: r.form }));
      const ids = table.map((r) => r.clubId);
      return {
        ...base, tier: pd.tier, group: pd.group, table, stats: liveStats(g, 'L'),
        split: { home: splitTable(ids, g.fixtures, 'home', pts), away: splitTable(ids, g.fixtures, 'away', pts) },
        clubStats: clubStatsFromRows(table, g.fixtures),
      };
    }
    const d = g.leagues.otherDivisions.find((x) => x.id === key)!;
    const table: TableRowLite[] = d.table.rows.map((r) => ({ clubId: r.clubId, pos: r.position, p: r.played, w: r.won, d: r.drawn, l: r.lost, gf: r.goalsFor, ga: r.goalsAgainst, pts: r.points, ded: r.deduction, form: r.form }));
    const ids = table.map((r) => r.clubId);
    return {
      ...base, tier: d.tier, group: d.group, table, stats: null,
      split: { home: splitTable(ids, d.fixtures, 'home', pts), away: splitTable(ids, d.fixtures, 'away', pts) },
      clubStats: clubStatsFromRows(table, d.fixtures),
      note: 'Diese Liga wird vereinsweise simuliert – statt Einzelstatistiken siehst du Vereinswerte.',
    };
  }
  const str = (id: string) => g.euroClubs?.[id]?.strength ?? g.simClubs?.[id]?.strength ?? g.clubs[id]?.reputation ?? 50;
  if (key === 'cup') return { ...base, rounds: tiesOfCup(g.cup, mid, 'cup', str), winner: g.cup.winnerClubId, stats: liveStats(g, 'P', undefined, 10) };
  const cup = g.euroCups?.[key as 'ec' | 'cwc' | 'uefa'];
  if (!cup) return null;
  if (cup.xstats) {
    return {
      ...base, rounds: tiesOfCup(cup, mid, key as CupKey, str), winner: cup.winnerClubId, stats: cupStats(g, cup, 10),
      note: 'Spiele ohne eigenen Verein laufen im Hintergrund – Torschützen, Vorlagen und Karten zählen trotzdem für die Bestenliste.',
    };
  }
  const set = euroClubSet(cup);
  return {
    ...base, rounds: tiesOfCup(cup, mid, key as CupKey, str), winner: cup.winnerClubId, stats: liveStats(g, 'E', (c) => set.has(c), 10),
    note: 'Spiele ohne deutsche Beteiligung werden vereinsweise simuliert; die Bestenliste zählt die voll simulierten Spiele.',
  };
}

// -----------------------------------------------------------------------------
// Namen (alle Quellen)
// -----------------------------------------------------------------------------
export function compClubName(g: Game, id: string, season: string, short = false): string {
  if (!id) return '–';
  const year = seasonStartYear(season);
  const eu = g.euroClubs?.[id];
  if (eu) return short ? eu.shortName : eu.name;
  const hf = HIST_FOREIGN[id];
  if (hf) return hf.name;
  if (isLocalClub(id)) return localClubName(id); // erzeugte Ortsvereine der Jugendstaffeln
  const archName = archivedSeason(g, season)?.names[id];
  if (!g.clubs[id] && !g.simClubs[id] && archName) return archName;
  const v = clubView(g, id, year);
  return short ? v.shortName : v.name;
}

export function foreignCountry(g: Game, id: string): string | undefined {
  return g.euroClubs?.[id]?.country ?? HIST_FOREIGN[id]?.country;
}

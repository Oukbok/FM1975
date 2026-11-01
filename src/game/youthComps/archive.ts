// =============================================================================
// JUGENDWETTBEWERBE — Archiv vergangener Saisons (klein: Tabellen, Runden, Top-N)
// -----------------------------------------------------------------------------
// Je Saison ≈ 5–9 KB unkomprimiert; höchstens MAX_SEASONS Saisons.
// =============================================================================
import type { CompTuple } from '../../engine/compStats';
import type { ArchRow, StatEntry } from '../leagueArchive';
import { topLists } from '../leagueArchive';
import type { Game } from '../state';
import { isVirtual, virtualPerson } from './sim';
import { leagueTable } from './table';
import type { YcArchComp, YcArchSeason, YcComp, YouthCompsState } from './types';

export const MAX_SEASONS = 50;
export const TOP_N = 6;
export const TOP_N_LOW = 3;

/** Spiele eines Vereins in einem Wettbewerb (Einsätze erzeugter Spieler). */
export function teamGames(comp: YcComp): Map<string, number> {
  const m = new Map<string, number>();
  const add = (id: string) => m.set(id, (m.get(id) ?? 0) + 1);
  for (const l of comp.leagues) for (const f of l.fx) if (f[3] >= 0) { add(f[1]); add(f[2]); }
  for (const rd of comp.ko) for (const t of rd.ties) for (let i = 0; i < t.g.length; i++) { add(t.h); add(t.a); }
  return m;
}

/** Statistik-Einträge eines Wettbewerbs (Einsätze erzeugter Spieler = Spiele des Teams). */
export function statEntries(g: Game, st: YouthCompsState, comp: YcComp): StatEntry[] {
  const games = teamGames(comp);
  return Object.entries(st.stats[comp.key] ?? {}).map(([pid, t]) => {
    if (!isVirtual(pid)) return { pid, t };
    const club = virtualPerson(g, pid)[1];
    return { pid, t: [games.get(club) ?? t[0], ...t.slice(1)] as CompTuple };
  });
}

/** Name/Verein/Position eines Spielers der Bestenliste. */
export function personOf(g: Game, st: YouthCompsState, pid: string): [string, string, string] {
  if (isVirtual(pid)) return virtualPerson(g, pid);
  const p = g.youthPlayers[pid] ?? g.players[pid];
  return st.people[pid] ?? (p ? [p.fullName, p.clubId, p.naturalPosition] : [pid, '', '']);
}

export function archiveComp(g: Game, st: YouthCompsState, comp: YcComp, people: YcArchSeason['people']): YcArchComp {
  // C–G: nur die Spitze der Bestenlisten (Archiv klein), Spielfeste ohne Bestenliste.
  const lists = topLists(comp.fest ? [] : statEntries(g, st, comp), comp.fmt === 'stf' ? TOP_N_LOW : TOP_N);
  if (comp.fmt === 'stf') for (const cat of ['scorer', 'yellow', 'red', 'clean'] as const) lists[cat] = [];
  // Erzeugte Spieler lassen sich aus der ID wiederherstellen – nur echte Spieler speichern.
  for (const l of Object.values(lists)) for (const [pid] of l) if (!isVirtual(pid)) people[pid] ??= personOf(g, st, pid);
  return {
    key: comp.key, label: comp.label, section: comp.section, winner: comp.winner ?? null, stats: lists,
    ...(comp.lvl != null ? { lvl: comp.lvl } : {}), ...(comp.play ? { play: comp.play } : {}), ...(comp.fest ? { fest: comp.fest.d.length } : {}),
    leagues: comp.leagues.map((l) => ({
      id: l.id, name: l.name, stage: l.stage, group: l.group, slots: l.slots, down: l.down,
      rows: leagueTable(l, comp.pts).map((r) => [r.clubId, r.w, r.d, r.l, r.gf, r.ga, r.pts] as ArchRow),
    })),
    ko: comp.ko.filter((rd) => rd.drawn).map((rd) => ({
      n: rd.name,
      t: rd.ties.filter((t) => t.w).map((t) => {
        const sh = t.g.reduce((s, x) => s + x[0], 0), sa = t.g.reduce((s, x) => s + x[1], 0);
        return [t.h, t.a, sh, sa, t.dec ?? 0, t.w!, t.pen?.[0], t.pen?.[1], t.g.length > 1 ? t.g.map((x) => `${x[0]}:${x[1]}`).join(', ') : undefined];
      }),
    })),
  };
}

export function archiveSeason(g: Game, st: YouthCompsState): void {
  if (!st.comps.length || st.archive.some((a) => a.season === st.season)) return;
  const people: YcArchSeason['people'] = {};
  const comps = st.comps.map((c) => archiveComp(g, st, c, people));
  st.archive.push({ season: st.season, comps, people });
  if (st.archive.length > MAX_SEASONS) st.archive.splice(0, st.archive.length - MAX_SEASONS);
  st.lastWinners = {};
  for (const c of st.comps) if (c.winner) st.lastWinners[c.key] = c.winner;
}

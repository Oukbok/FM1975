// =============================================================================
// LIGA-ARCHIV: Abschlusstabellen, Pokalrunden und Bestenlisten vergangener Saisons
// -----------------------------------------------------------------------------
// Beim Saisonwechsel (game/season.ts → startNextSeason) wird festgehalten:
//   • Abschlusstabelle jeder simulierten Liga (alle Ebenen, DDR),
//   • alle Runden von Landespokal und Europapokalen (kompakte Tupel),
//   • Bestenlisten je Wettbewerb (nur Top-N je Kategorie): Tore, Vorlagen, Scorer,
//     Gelbe, Rote (inkl. Gelb-Rot), Weiße Weste (Zu-null-Spiele der Torhüter).
// Optionales Feld `leagueArchive` am Spielstand (fehlt bei alten Spielständen →
// das Archiv beginnt mit der nächsten Saison). Speicher: ≈ 6–10 KB je Saison
// unkomprimiert, höchstens MAX_SEASONS Saisons.
// =============================================================================
import { compStatsOf, clearCompStats, type CompTuple } from '../engine/compStats';
import type { LeagueGroup } from '../engine/leagues';
import { isForeignId } from '../engine/world';
import type { CupState, CupTie } from '../types';
import type { CupGroup } from '../types/euro2';
import type { Game } from './state';

export type ArchRow = [id: string, w: number, d: number, l: number, gf: number, ga: number, pts: number, deduction?: number];
export interface ArchDivision { id: string; name: string; tier: number; group: LeagueGroup; rows: ArchRow[] }
/** [Heim, Gast, Tore H, Tore G, Entscheidung 0 regulär/1 n. V./2 i. E., Sieger, Elfer H, Elfer G] */
export type ArchTie = [string, string, number, number, number, string, number?, number?];
/**
 * Hin-/Rückspiel bzw. Wiederholung, Sicht der Begegnung: [Tore H, Tore G im 1. Spiel,
 * 0 / 1 = Auswärtstore / 2 = Wiederholung]. Das 2. Spiel ergibt sich aus dem Gesamtstand
 * (bei der Wiederholung steht das Ergebnis der Wiederholung in der Begegnung selbst).
 */
export type ArchLegs = [number, number, number];
/** Gruppenzeile: [Verein, Sp, S, U, N, Tore, Gegentore, Punkte] */
export type ArchGroupRow = [string, number, number, number, number, number, number, number];
export interface ArchRound {
  n: string; t: ArchTie[];
  /** Europapokal 2.0: Spiele je Begegnung (Index wie `t`). */
  l?: (ArchLegs | null)[];
  /** Gruppen/Ligaphase: 'g' bzw. 'l', Tabellen in Abschluss-Reihenfolge. */
  k?: 'g' | 'l';
  g?: { n: string; r: ArchGroupRow[] }[];
}
export interface ArchCup { rounds: ArchRound[]; winner: string | null }
export type CupKey = 'cup' | 'ec' | 'cwc' | 'uefa';
export type StatCat = 'goals' | 'assists' | 'scorer' | 'yellow' | 'red' | 'clean';
export const STAT_CATS: StatCat[] = ['goals', 'assists', 'scorer', 'yellow', 'red', 'clean'];
/** Bestenliste: [Spieler-ID, Wert, Einsätze] */
export type ArchStatList = Partial<Record<StatCat, [string, number, number][]>>;

export interface ArchSeason {
  season: string;
  divisions: ArchDivision[];
  /** Liga mit vollen Kadern (Bestenliste „Liga“ gehört zu ihr). */
  playerDiv: string;
  cups: Partial<Record<CupKey, ArchCup>>;
  /** Bestenlisten je Wettbewerb: Liga-ID der Spielerliga bzw. CupKey. */
  stats: Record<string, ArchStatList>;
  /** Spieler der Bestenlisten: ID → [Name, Verein, Position]. */
  people: Record<string, [string, string, string]>;
  /** Namen von Vereinen, die später verschwinden können (Ausland, Platzhalter). */
  names: Record<string, string>;
}

export interface LeagueArchive { v: 1; seasons: ArchSeason[]; histSeeded?: boolean }

const MAX_SEASONS = 100;
const TOP_LEAGUE = 10;
const TOP_CUP = 5;

type GameWithArchive = Game & { leagueArchive?: LeagueArchive };

export function leagueArchive(g: Game): LeagueArchive | undefined {
  return (g as GameWithArchive).leagueArchive;
}
export function ensureArchive(g: Game): LeagueArchive {
  const gg = g as GameWithArchive;
  return (gg.leagueArchive ??= { v: 1, seasons: [] });
}
export function archivedSeason(g: Game, season: string): ArchSeason | undefined {
  return leagueArchive(g)?.seasons.find((s) => s.season === season);
}

// -----------------------------------------------------------------------------
// Bestenlisten
// -----------------------------------------------------------------------------
export function statValue(cat: StatCat, t: CompTuple): number {
  switch (cat) {
    case 'goals': return t[1];
    case 'assists': return t[2];
    case 'scorer': return t[1] + t[2];
    case 'yellow': return t[3];
    case 'red': return t[4] + t[5];
    case 'clean': return t[6];
  }
}

export interface StatEntry { pid: string; t: CompTuple }

/** Top-N je Kategorie (Wert > 0; Gleichstand: weniger Einsätze zuerst). */
export function topLists(entries: StatEntry[], n: number): Record<StatCat, [string, number, number][]> {
  const out = {} as Record<StatCat, [string, number, number][]>;
  for (const cat of STAT_CATS) {
    out[cat] = entries
      .map((e) => [e.pid, statValue(cat, e.t), e.t[0]] as [string, number, number])
      .filter((x) => x[1] > 0)
      .sort((a, b) => b[1] - a[1] || a[2] - b[2])
      .slice(0, n);
  }
  return out;
}

/** Laufende Saison: Einträge eines Wettbewerbs (Code L/P/E, bei E nur Spieler aus Vereinen dieses Pokals). */
export function liveEntries(g: Game, code: 'L' | 'P' | 'E', clubFilter?: (clubId: string) => boolean): StatEntry[] {
  const out: StatEntry[] = [];
  for (const p of Object.values(g.players)) {
    const t = compStatsOf(p)?.[code];
    if (!t || (clubFilter && !clubFilter(p.clubId))) continue;
    out.push({ pid: p.id, t });
  }
  return out;
}

/** Europapokal 2.0: Statistik am Wettbewerb (alle Spiele). */
export function xEntries(cup: CupState): StatEntry[] {
  return Object.entries(cup.xstats ?? {}).map(([pid, t]) => ({ pid, t }));
}

export function euroClubSet(cup: CupState | null | undefined): Set<string> {
  return new Set(cup?.participantIds ?? []);
}

// -----------------------------------------------------------------------------
// Saisonende archivieren
// -----------------------------------------------------------------------------
/** Spiele einer Begegnung kompakt (Sicht der Begegnung: Heim = zuerst gezogener Verein). */
export function packLegs(t: CupTie): ArchLegs | null {
  const l = t.legs;
  if (!l || l.length < 2 || !l[1].played) return null;
  return [l[0].homeGoals ?? 0, l[0].awayGoals ?? 0, t.id.startsWith('cup_') ? 2 : t.awayGoalsWin ? 1 : 0];
}

/** Gruppentabelle (Abschluss-Reihenfolge, sonst Punkte/Tordifferenz) als Zeilen. */
export function groupRows(gr: CupGroup, winPts: number): ArchGroupRow[] {
  const rows = new Map<string, ArchGroupRow>(gr.ids.map((id) => [id, [id, 0, 0, 0, 0, 0, 0, 0]]));
  for (const m of gr.matches) {
    if (m.hg == null || m.ag == null) continue;
    const h = rows.get(m.home)!, a = rows.get(m.away)!;
    h[1]++; a[1]++; h[5] += m.hg; h[6] += m.ag; a[5] += m.ag; a[6] += m.hg;
    if (m.hg > m.ag) { h[2]++; a[4]++; h[7] += winPts; } else if (m.hg < m.ag) { a[2]++; h[4]++; a[7] += winPts; } else { h[3]++; a[3]++; h[7]++; a[7]++; }
  }
  const order = gr.final ?? [...rows.keys()].sort((x, y) => {
    const a = rows.get(x)!, b = rows.get(y)!;
    return b[7] - a[7] || (b[5] - b[6]) - (a[5] - a[6]) || b[5] - a[5];
  });
  return order.map((id) => rows.get(id)!);
}

function packCup(cup: CupState | null | undefined): ArchCup | undefined {
  if (!cup) return undefined;
  const winPts = Number(cup.season.slice(0, 4)) >= 1995 ? 3 : 2;
  return {
    winner: cup.winnerClubId ?? null,
    rounds: cup.rounds.filter((r) => r.drawn).map((r) => {
      const ties = r.ties.filter((t) => t.played);
      const out: ArchRound = {
        n: r.name,
        t: ties.map((t) => {
          const dec = t.decision === 'penalties' ? 2 : t.decision === 'aet' ? 1 : 0;
          const tie: ArchTie = [t.homeClubId, t.awayClubId, t.homeGoals ?? 0, t.awayGoals ?? 0, dec, t.winnerClubId ?? ''];
          if (t.penalties) tie.push(t.penalties.home, t.penalties.away);
          return tie;
        }),
      };
      if (ties.some((t) => t.legs && t.legs.length > 1)) out.l = ties.map(packLegs);
      if (r.groups?.length) {
        out.k = r.kind === 'league' ? 'l' : 'g';
        out.g = r.groups.map((gr) => ({ n: gr.name, r: groupRows(gr, winPts) }));
      }
      return out;
    }),
  };
}

/**
 * Abgelaufene Saison ins Archiv. Aufruf in startNextSeason, nachdem alle Ligen zu
 * Ende simuliert sind und BEVOR Tabellen, Pokale und Kader überschrieben werden.
 */
export function archiveSeasonEnd(g: Game, season: string): void {
  const arch = ensureArchive(g);
  if (arch.seasons.some((s) => s.season === season)) { clearCompStats(g.players); return; }
  const names: Record<string, string> = {};
  const remember = (id: string) => {
    if (!id || names[id]) return;
    if (isForeignId(id) || id.startsWith('ph-') || id.startsWith('am')) {
      names[id] = g.euroClubs?.[id]?.name ?? g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id;
    }
  };
  const rowsOf = (rows: Game['table']['rows']): ArchRow[] => rows.map((r) => {
    remember(r.clubId);
    const row: ArchRow = [r.clubId, r.won, r.drawn, r.lost, r.goalsFor, r.goalsAgainst, r.points];
    if (r.deduction) row.push(r.deduction);
    return row;
  });

  const pd = g.leagues.playerDivision;
  const divisions: ArchDivision[] = [
    { id: pd.id, name: pd.name, tier: pd.tier, group: pd.group, rows: rowsOf(g.table.rows.filter((r) => !isForeignId(r.clubId))) },
    ...g.leagues.otherDivisions.map((d) => ({ id: d.id, name: d.name, tier: d.tier, group: d.group, rows: rowsOf(d.table.rows) })),
  ];

  const cups: ArchSeason['cups'] = {};
  const src: Record<CupKey, CupState | null | undefined> = { cup: g.cup, ec: g.euroCups?.ec, cwc: g.euroCups?.cwc, uefa: g.euroCups?.uefa };
  for (const k of Object.keys(src) as CupKey[]) {
    const packed = packCup(src[k]);
    if (!packed) continue;
    cups[k] = packed;
    for (const r of packed.rounds) {
      for (const t of r.t) { remember(t[0]); remember(t[1]); }
      for (const gr of r.g ?? []) for (const row of gr.r) remember(row[0]);
    }
  }

  // Bestenlisten
  const stats: Record<string, ArchStatList> = {};
  const people: ArchSeason['people'] = {};
  const keep = (lists: Record<StatCat, [string, number, number][]>, key: string) => {
    const pruned: ArchStatList = {};
    for (const cat of STAT_CATS) {
      if (!lists[cat].length) continue;
      pruned[cat] = lists[cat];
      for (const [pid] of lists[cat]) {
        const p = g.players[pid];
        if (p && !people[pid]) people[pid] = [p.fullName, p.clubId, p.naturalPosition];
        if (p) remember(p.clubId);
      }
    }
    if (Object.keys(pruned).length) stats[key] = pruned;
  };
  keep(topLists(liveEntries(g, 'L'), TOP_LEAGUE), pd.id);
  keep(topLists(liveEntries(g, 'P'), TOP_CUP), 'cup');
  for (const k of ['ec', 'cwc', 'uefa'] as const) {
    const cup = src[k];
    if (!cup) continue;
    if (cup.xstats) {
      // Europapokal 2.0: alle Spiele des Wettbewerbs (auch Kurzkader ausländischer Vereine).
      // Kurz halten (Spielstand-Größe): Karten und Weiße Weste nur die ersten drei.
      const lists = topLists(xEntries(cup), TOP_CUP);
      for (const cat of ['yellow', 'red', 'clean'] as StatCat[]) lists[cat] = lists[cat].slice(0, 3);
      for (const cat of STAT_CATS) for (const [pid] of lists[cat]) {
        const x = cup.xpeople?.[pid];
        if (x && !people[pid]) { people[pid] = [x[0], x[1], x[2]]; remember(x[1]); }
      }
      keep(lists, k);
      continue;
    }
    const set = euroClubSet(cup);
    keep(topLists(liveEntries(g, 'E', (c) => set.has(c)), TOP_CUP), k);
  }

  arch.seasons.push({ season, divisions, playerDiv: pd.id, cups, stats, people, names });
  if (arch.seasons.length > MAX_SEASONS) arch.seasons.splice(0, arch.seasons.length - MAX_SEASONS);
  clearCompStats(g.players);
}

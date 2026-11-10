// =============================================================================
// MANAGERBILANZ — Anzeigedaten für Zentrale › Karriere (nur lesen)
// Gespeicherte Saisons (managerLog.ts) + laufende Saison live, Endplätze aus der
// Vereins-Historie (clubRecords), Pokalrunden aus dem Liga-Archiv, Titel aus
// trophyCabinet.ts, Ansehen/Saisonziele aus den Karriere-Stationen.
// =============================================================================
import { euroCompName } from '../data/euroFormats';
type EuroCompId = 'ec' | 'cwc' | 'uefa';
import { seasonStartYear } from '../data/timeline';
import { economyScale, yearOf } from '../engine/economy';
import type { CupState } from '../types';
import { ensureCareer } from './careerState';
import { recordBook, seasonsOf } from './clubRecords';
import { archivedSeason, type ArchCup } from './leagueArchive';
import {
  addToWDL, cloneTally, Comp, emptyWDL, ensureMgr, MgrGame, MgrPlayer, MgrStreak, MgrTally, MgrTransfer, MILESTONES,
  seasonGames, tallyGames, WDL,
} from './managerLog';
import { trophiesOf, type TrophyEntry } from './trophyCabinet';
import type { Game } from './state';

export interface SeasonRow {
  season: string;
  tier?: number;
  league?: string;
  pos?: number;
  size?: number;
  goal?: string;
  ok?: boolean;
  cup?: string;
  euro?: string;
  titles: string[];
  rep?: number;
  L: WDL;
  live?: boolean;
  coach?: string;
}

export interface PlayerLine { id: string; name: string; pos: string; apps: number; goals: number; from: string; to: string; hg: boolean; active: boolean }
export interface RecordLine { k: string; v: string; sub?: string }
export interface OppLine { id: string; name: string; r: WDL }

export interface CareerData {
  from: string;
  seasonsDone: number;
  totals: Record<Comp | 'all', WDL>;
  seasons: SeasonRow[];
  tally: MgrTally;
  nextMile?: { n: number; left: number };
  titles: TrophyEntry[];
  records: RecordLine[];
  players: PlayerLine[];
  tin: number;
  tout: number;
  buys: MgrTransfer[];
  sells: MgrTransfer[];
  repSeries: { season: string; rep: number }[];
  /** Lieblingsgegner / Angstgegner (mind. 4 Pflichtspiele). */
  oppBest: OppLine[];
  oppWorst: OppLine[];
  /** Saisonziele erreicht / bewertet. */
  goalsOk: number;
  goalsJudged: number;
}

export const ppg = (r: WDL) => { const n = r[0] + r[1] + r[2]; return n ? (r[0] * 3 + r[1]) / n : 0; };
export const games = (r: WDL) => r[0] + r[1] + r[2];
const sumWDL = (a: WDL, b: WDL): WDL => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4]];

const FINAL_SHORT: Record<string, string> = { Finale: 'Finale', Endspiel: 'Finale' };

/** Erreichte Runde in einem archivierten Wettbewerb. */
function reachArch(cup: ArchCup | undefined, id: string): string | undefined {
  if (!cup) return undefined;
  if (cup.winner === id) return 'Sieger';
  let last = -1;
  cup.rounds.forEach((r, i) => {
    if (r.t.some((t) => t[0] === id || t[1] === id) || r.g?.some((gr) => gr.r.some((x) => x[0] === id))) last = i;
  });
  return last < 0 ? undefined : FINAL_SHORT[cup.rounds[last].n] ?? cup.rounds[last].n;
}

/** Erreichte Runde im laufenden Wettbewerb. */
function reachLive(cup: CupState | null | undefined, id: string): string | undefined {
  if (!cup) return undefined;
  if (cup.winnerClubId === id) return 'Sieger';
  let last = -1;
  cup.rounds.forEach((r, i) => {
    if (r.ties.some((t) => t.homeClubId === id || t.awayClubId === id) || r.groups?.some((gr) => gr.ids.includes(id))) last = i;
  });
  return last < 0 ? undefined : cup.rounds[last].name;
}

const EURO_KEYS: EuroCompId[] = ['ec', 'cwc', 'uefa'];
/** Kurzname eines Europapokals für Tabellen (Langname über euroCompName). */
export function euroShort(k: EuroCompId, season: string): string {
  const y = seasonStartYear(season);
  if (k === 'ec') return y >= 1992 ? 'Meisterliga' : 'Landesmeister-Cup';
  if (k === 'cwc') return y >= 2021 ? 'Konferenz-Liga' : 'Pokalsieger-Cup';
  return euroCompName(k, y);
}
const EURO_SHORT = euroShort;

function seasonCups(g: Game, season: string, id: string, live: boolean): { cup?: string; euro?: string } {
  if (live) {
    const cup = reachLive(g.cup, id);
    for (const k of EURO_KEYS) { const r = reachLive(g.euroCups?.[k], id); if (r) return { cup, euro: `${EURO_SHORT(k, season)} · ${r}` }; }
    return { cup };
  }
  const a = archivedSeason(g, season);
  if (!a) return {};
  const cup = reachArch(a.cups.cup, id);
  for (const k of EURO_KEYS) { const r = reachArch(a.cups[k], id); if (r) return { cup, euro: `${EURO_SHORT(k, season)} · ${r}` }; }
  return { cup };
}

const SKIP_TITLES = new Set(['jugendC', 'jugendD', 'jugendE', 'jugendF', 'jugendEReg', 'jugendFReg']);
const SHORT_TITLE = (e: TrophyEntry) => e.kind === 'meister' ? 'Meister' : e.kind === 'pokal' ? 'Landespokal' : e.kind === 'aufstieg' ? 'Aufstieg'
  : e.kind === 'staffel' ? 'Staffelsieger' : e.kind === 'ec' || e.kind === 'cwc' || e.kind === 'uefa' ? euroShort(e.kind, e.season)
  : e.cat === 'jugend' ? 'Jugendtitel' : e.title;

export function careerData(g: Game): CareerData | null {
  const c = ensureCareer(g);
  const log = ensureMgr(g);
  const club = g.clubs[g.managedClubId];
  if (!log || !club) return null;
  const me = club.id;
  const live = seasonGames(g);
  const tally = cloneTally(log);
  tallyGames(tally, live);

  // Saisons
  const place = new Map(seasonsOf(g, me).map((s) => [s.season, s]));
  const goals = new Map<string, { goal?: string; ok?: boolean }>();
  for (const st of c.stints) if (st.clubId === me) for (const x of st.seasons) goals.set(x.season, { goal: x.goal, ok: x.ok });
  const titles = trophiesOf(g, me).filter((e) => e.season >= log.from && !e.historic && !SKIP_TITLES.has(e.kind));
  const titlesBy = new Map<string, string[]>();
  for (const e of titles) { if (!titlesBy.has(e.season)) titlesBy.set(e.season, []); titlesBy.get(e.season)!.push(SHORT_TITLE(e)); }
  const seasons: SeasonRow[] = Object.keys(log.seasons).sort().map((s) => {
    const r = log.seasons[s];
    const p = place.get(s);
    return { season: s, tier: p?.tier, league: p?.league?.replace(/^Deutschland /, ''), pos: p?.pos, size: p?.size, ...goals.get(s), ...seasonCups(g, s, me, false), titles: titlesBy.get(s) ?? [], rep: r.rep, L: r.L, coach: r.coach };
  });
  const liveRec = { L: emptyWDL(), P: emptyWDL(), E: emptyWDL() } as Record<Comp, WDL>;
  for (const x of live) addToWDL(liveRec[x[1]], x);
  const row = g.table.rows.find((r) => r.clubId === me);
  if (!log.seasons[g.season]) {
    seasons.push({
      season: g.season, tier: g.leagues?.playerDivision?.tier, league: g.leagues?.playerDivision?.name, pos: row?.position, size: g.table.rows.length,
      goal: club.boardExpectation, ...seasonCups(g, g.season, me, true), titles: [], rep: c.rep, L: liveRec.L, live: true,
      coach: c.coaches?.filter((e) => !e.to).pop()?.name,
    });
  }

  // Summen
  const totals: Record<Comp | 'all', WDL> = { L: emptyWDL(), P: emptyWDL(), E: emptyWDL(), all: emptyWDL() };
  for (const s of Object.keys(log.seasons)) for (const k of ['L', 'P', 'E'] as Comp[]) totals[k] = sumWDL(totals[k], log.seasons[s][k]);
  if (!log.seasons[g.season]) for (const k of ['L', 'P', 'E'] as Comp[]) totals[k] = sumWDL(totals[k], liveRec[k]);
  totals.all = sumWDL(sumWDL(totals.L, totals.P), totals.E);

  // Rekorde
  const done = seasons.filter((s) => !s.live);
  const records: RecordLine[] = [];
  const best = [...done].filter((s) => s.tier && s.pos).sort((a, b) => (a.tier! - b.tier!) || (a.pos! - b.pos!))[0];
  if (best) records.push({ k: 'Beste Platzierung', v: `${best.pos}. Platz`, sub: `${best.league ?? ''} ${best.season}`.trim() });
  const pts = (s: SeasonRow) => s.L[0] * 3 + s.L[1];
  const maxPts = [...done].filter((s) => games(s.L)).sort((a, b) => ppg(b.L) - ppg(a.L))[0];
  if (maxPts) records.push({ k: 'Beste Ligasaison', v: `${pts(maxPts)} Punkte`, sub: `${maxPts.season} · ${maxPts.L[0]}-${maxPts.L[1]}-${maxPts.L[2]} (3-Punkte-Wertung)` });
  const maxGoals = [...done].filter((s) => games(s.L)).sort((a, b) => b.L[3] - a.L[3])[0];
  if (maxGoals) records.push({ k: 'Meiste Ligatore', v: `${maxGoals.L[3]} Tore`, sub: maxGoals.season });
  const minGa = [...done].filter((s) => games(s.L) >= 20).sort((a, b) => a.L[4] / games(a.L) - b.L[4] / games(b.L))[0];
  if (minGa) records.push({ k: 'Beste Abwehr', v: `${minGa.L[4]} Gegentore`, sub: `${minGa.season} · ${games(minGa.L)} Spiele` });
  const streak = (s?: MgrStreak) => (s ? `${s[1].slice(8, 10)}.${s[1].slice(5, 7)}.${s[1].slice(0, 4)} – ${s[2].slice(8, 10)}.${s[2].slice(5, 7)}.${s[2].slice(0, 4)}` : undefined);
  if (tally.best.w) records.push({ k: 'Längste Siegesserie', v: `${tally.best.w[0]} Spiele`, sub: streak(tally.best.w) });
  if (tally.best.u) records.push({ k: 'Längste Serie ohne Niederlage', v: `${tally.best.u[0]} Spiele`, sub: streak(tally.best.u) });

  const next = MILESTONES.find((n) => n > tally.n);

  // Spieler (gespeichert + laufende Saison)
  const players = new Map<string, MgrPlayer>(Object.entries(log.players).map(([id, p]) => [id, [...p] as MgrPlayer]));
  if (!log.seasons[g.season]) {
    for (const id of club.playerIds) {
      const p = g.players[id];
      const st = p?.seasonStats;
      if (!p || !st?.appearances) continue;
      const cur = players.get(id);
      const hg = id.startsWith(`${me}_y_`) ? 1 : 0;
      if (cur) { cur[2] += st.appearances; cur[3] += st.goals; cur[5] = g.season; cur[0] = p.fullName; }
      else players.set(id, [p.fullName, p.naturalPosition, st.appearances, st.goals, g.season, g.season, hg]);
    }
  }
  const squad = new Set(club.playerIds);
  const pl: PlayerLine[] = [...players.entries()].map(([id, p]) => ({ id, name: p[0], pos: p[1], apps: p[2], goals: p[3], from: p[4], to: p[5], hg: !!p[6], active: squad.has(id) }));

  // Transfers (1975-Basis)
  let tin = 0, tout = 0;
  for (const s of Object.values(log.seasons)) { tin += s.tin ?? 0; tout += s.tout ?? 0; }
  if (!log.seasons[g.season]) {
    const sc = economyScale(yearOf(g.calendar.currentDate));
    tin += Math.round((club.finances.income.transferIncome ?? 0) / sc);
    tout += Math.round((club.finances.expenses.transferExpense ?? 0) / sc);
  }

  // Gegner: direkter Vergleich seit Amtsantritt (Vereins-Historie + laufende Saison).
  const opp = new Map<string, OppLine>();
  const addOpp = (id: string, name: string, x: MgrGame) => {
    const o = opp.get(id) ?? { id, name, r: emptyWDL() };
    addToWDL(o.r, x); opp.set(id, o);
  };
  const book = recordBook(g);
  if (book && book.h2hClub === me) {
    for (const [id, list] of Object.entries(book.h2h)) for (const t of list) {
      if (t[0] < log.from || t[0] >= g.season) continue;
      addOpp(id, g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name ?? id, [t[1], t[2], id, t[3], t[4], t[5], '']);
    }
  }
  for (const x of live) addOpp(x[2], x[6], x);
  const oppList = [...opp.values()].filter((o) => games(o.r) >= 6);
  const oppBest = [...oppList].sort((a, b) => ppg(b.r) - ppg(a.r) || games(b.r) - games(a.r)).slice(0, 3);
  const oppWorst = [...oppList].sort((a, b) => ppg(a.r) - ppg(b.r) || games(b.r) - games(a.r)).filter((o) => !oppBest.includes(o)).slice(0, 3);
  const judged = done.filter((s) => s.ok != null);

  const repSeries = seasons.filter((s) => s.rep != null).map((s) => ({ season: s.season, rep: s.rep! }));
  return {
    from: log.from, seasonsDone: done.length, totals, seasons: seasons.reverse(), tally,
    nextMile: next ? { n: next, left: next - tally.n } : undefined,
    titles, records, players: pl, tin, tout, buys: log.buys, sells: log.sells, repSeries,
    oppBest, oppWorst, goalsOk: judged.filter((s) => s.ok).length, goalsJudged: judged.length,
  };
}

export type { MgrGame };

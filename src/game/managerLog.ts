// =============================================================================
// MANAGERBILANZ — alles, was du als Manager deines Vereins über die Jahrzehnte
// erreicht hast (Seite Privat › Karriere, views/zentrale/career/)
// -----------------------------------------------------------------------------
// Gespeichert in `game.career.mgr` (optional, kompakt, nur Abgeschlossenes):
//   • Bilanz je Saison und Wettbewerb (Liga/Landespokal/Europapokal),
//   • höchste Siege/Niederlagen, Meilensteine (1., 100., 250. … Pflichtspiel),
//     längste Sieges-/Ungeschlagen-Serie (laufende Serie wird übertragen),
//   • Spieler unter dir (Einsätze/Tore aller Pflichtspiele, Eigengewächs),
//   • Transfers: Summen je Saison und Rekordtransfers (Preisniveau 1975 → fmtPrice).
// Die laufende Saison kommt live dazu (managerView.ts). Fortschreibung beim
// Saisonwechsel `mgrSeasonEnd` (careerGame.ts), Transfers über `noteMgrTransfer`
// (Empfänger in transferLog.ts). Alte Spielstände: `ensureMgr` rekonstruiert aus
// Vereins-Historie (clubRecords), Liga-Archiv, Spielerstationen und Finanzbilanzen.
// =============================================================================
import { seasonLabel } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { originClubOf } from '../engine/persona';
import type { Player } from '../types';
import { archivedSeason } from './leagueArchive';
import { recordBook } from './clubRecords';
import type { Game } from './state';

export type Comp = 'L' | 'P' | 'E';
/** [Siege, Remis, Niederlagen, Tore, Gegentore] */
export type WDL = [number, number, number, number, number];
/** [Datum, Wettbewerb, Gegner-ID, Heim 1/0, Tore, Gegentore, Gegnername] */
export type MgrGame = [string, Comp, string, number, number, number, string];
/** [Datum, Spieler-ID, Name, anderer Verein (ID oder Name), Ablöse in 1975-Basis, Vereinsname] */
export type MgrTransfer = [string, string, string, string, number, string];
/** [Name, Position, Einsätze, Tore, erste Saison, letzte Saison, Eigengewächs 1/0] */
export type MgrPlayer = [string, string, number, number, string, string, number];
/** [Länge, erstes Spiel, letztes Spiel] */
export type MgrStreak = [number, string, string];

export interface MgrSeasonRec {
  L: WDL; P: WDL; E: WDL;
  /** Ansehen nach der Saison. */
  rep?: number;
  /** Transfereinnahmen/-ausgaben der Saison (1975-Basis). */
  tin?: number; tout?: number;
  /** Cheftrainer am Saisonende. */
  coach?: string;
}

export interface MgrTally {
  /** Pflichtspiele. */
  n: number;
  big: MgrGame[];
  bad: MgrGame[];
  miles: [number, MgrGame][];
  /** Laufende Serien: Siege / ungeschlagen (Länge, Beginn). */
  run: { w: number; u: number; wFrom: string; uFrom: string };
  best: { w?: MgrStreak; u?: MgrStreak };
}

export interface MgrLog extends MgrTally {
  v: 1;
  club: string;
  /** Erste Saison unter dir. */
  from: string;
  /** Zuletzt abgeschlossene Saison. */
  last?: string;
  seasons: Record<string, MgrSeasonRec>;
  players: Record<string, MgrPlayer>;
  buys: MgrTransfer[];
  sells: MgrTransfer[];
}

export const MILESTONES = [1, 50, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 900, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
const TOP_GAMES = 6;
const TOP_TRANSFERS = 8;
const MAX_PLAYERS = 120;

export const emptyWDL = (): WDL => [0, 0, 0, 0, 0];
const clubName = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name ?? id;

export function seasonOfDate(date: string): string {
  const y = Number(date.slice(0, 4));
  return seasonLabel(Number(date.slice(5, 7)) >= 7 ? y : y - 1);
}

// -----------------------------------------------------------------------------
// Spiele der laufenden Saison (Liga, Landespokal inkl. Wiederholung, Europapokal)
// -----------------------------------------------------------------------------
export function seasonGames(g: Game): MgrGame[] {
  const me = g.managedClubId;
  const out: MgrGame[] = [];
  const add = (c: Comp, date: string, h: string, a: string, hg: number | null | undefined, ag: number | null | undefined) => {
    if ((h !== me && a !== me) || hg == null || ag == null || !date) return;
    const home = h === me;
    const opp = home ? a : h;
    out.push([date, c, opp, home ? 1 : 0, home ? hg : ag, home ? ag : hg, clubName(g, opp)]);
  };
  for (const m of g.fixtures) if (m.status === 'finished' && m.result) add('L', m.date, m.homeClubId, m.awayClubId, m.result.homeGoals, m.result.awayGoals);
  const cups: [Comp, typeof g.cup][] = [['P', g.cup], ['E', g.euroCups?.ec ?? null], ['E', g.euroCups?.cwc ?? null], ['E', g.euroCups?.uefa ?? null]];
  for (const [c, cup] of cups) {
    for (const r of cup?.rounds ?? []) {
      for (const t of r.ties ?? []) {
        if (t.legs?.length) { for (const l of t.legs) if (l.played) add(c, l.date, l.home, l.away, l.homeGoals, l.awayGoals); }
        else if (t.played) add(c, t.date, t.homeClubId, t.awayClubId, t.homeGoals, t.awayGoals);
      }
      for (const gr of r.groups ?? []) for (const m of gr.matches) add(c, m.date, m.home, m.away, m.hg, m.ag);
    }
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

export function addToWDL(r: WDL, x: MgrGame): void {
  if (x[4] > x[5]) r[0]++; else if (x[4] < x[5]) r[2]++; else r[1]++;
  r[3] += x[4]; r[4] += x[5];
}

const margin = (x: MgrGame) => x[4] - x[5];
const bigSort = (a: MgrGame, b: MgrGame) => margin(b) - margin(a) || b[4] - a[4] || a[0].localeCompare(b[0]);
const badSort = (a: MgrGame, b: MgrGame) => margin(a) - margin(b) || b[5] - a[5] || a[0].localeCompare(b[0]);

export function emptyTally(): MgrTally {
  return { n: 0, big: [], bad: [], miles: [], run: { w: 0, u: 0, wFrom: '', uFrom: '' }, best: {} };
}

/** Spiele (chronologisch) in eine Zählung aufnehmen. Mutiert `t`. */
export function tallyGames(t: MgrTally, games: MgrGame[]): void {
  for (const x of games) {
    t.n++;
    if (MILESTONES.includes(t.n)) t.miles.push([t.n, x]);
    if (margin(x) >= 2) { t.big.push(x); t.big.sort(bigSort); if (t.big.length > TOP_GAMES) t.big.length = TOP_GAMES; }
    if (margin(x) <= -2) { t.bad.push(x); t.bad.sort(badSort); if (t.bad.length > TOP_GAMES) t.bad.length = TOP_GAMES; }
    const win = x[4] > x[5], lost = x[4] < x[5];
    if (win) { if (!t.run.w) t.run.wFrom = x[0]; t.run.w++; } else t.run.w = 0;
    if (!lost) { if (!t.run.u) t.run.uFrom = x[0]; t.run.u++; } else t.run.u = 0;
    if (t.run.w && t.run.w > (t.best.w?.[0] ?? 0)) t.best.w = [t.run.w, t.run.wFrom, x[0]];
    if (t.run.u && t.run.u > (t.best.u?.[0] ?? 0)) t.best.u = [t.run.u, t.run.uFrom, x[0]];
  }
}

export function cloneTally(t: MgrTally): MgrTally {
  return { n: t.n, big: [...t.big], bad: [...t.bad], miles: [...t.miles], run: { ...t.run }, best: { ...t.best } };
}

function seasonRecOf(games: MgrGame[]): MgrSeasonRec {
  const r: MgrSeasonRec = { L: emptyWDL(), P: emptyWDL(), E: emptyWDL() };
  for (const x of games) addToWDL(r[x[1]], x);
  return r;
}

// -----------------------------------------------------------------------------
// Spieler und Transfers
// -----------------------------------------------------------------------------
function notePlayer(log: MgrLog, p: Player, season: string, apps: number, goals: number): void {
  if (apps <= 0) return;
  const o = originClubOf(p.id);
  const hg = o.homegrown && o.clubId === log.club ? 1 : 0;
  const cur = log.players[p.id];
  if (cur) { cur[0] = p.fullName; cur[1] = p.naturalPosition; cur[2] += apps; cur[3] += goals; if (season < cur[4]) cur[4] = season; if (season > cur[5]) cur[5] = season; cur[6] = cur[6] || hg; }
  else log.players[p.id] = [p.fullName, p.naturalPosition, apps, goals, season, season, hg];
}

function trimPlayers(log: MgrLog): void {
  const ids = Object.keys(log.players);
  if (ids.length <= MAX_PLAYERS) return;
  const keep = new Set<string>();
  const by = (k: 2 | 3) => [...ids].sort((a, b) => log.players[b][k] - log.players[a][k]).slice(0, 50);
  for (const id of [...by(2), ...by(3)]) keep.add(id);
  for (const id of ids) if (log.players[id][6] && keep.size < MAX_PLAYERS) keep.add(id);
  for (const id of ids) if (!keep.has(id)) delete log.players[id];
}

function pushTransfer(list: MgrTransfer[], t: MgrTransfer): void {
  if (list.some((x) => x[0] === t[0] && x[1] === t[1])) return;
  list.push(t);
  list.sort((a, b) => b[4] - a[4]);
  if (list.length > TOP_TRANSFERS) list.length = TOP_TRANSFERS;
}

/** Empfänger für jeden Wechsel (transferLog.ts): Rekordtransfers des eigenen Vereins. */
export function noteMgrTransfer(g: Game, p: Player, from: string, to: string, feeNominal: number, date: string): void {
  const log = g.career?.mgr;
  if (!log || feeNominal <= 0 || (from !== log.club && to !== log.club) || from === to) return;
  const base = Math.round(feeNominal / economyScale(yearOf(date)));
  if (to === log.club) pushTransfer(log.buys, [date, p.id, p.fullName, from, base, clubName(g, from)]);
  else pushTransfer(log.sells, [date, p.id, p.fullName, to, base, clubName(g, to)]);
}

// -----------------------------------------------------------------------------
// Anlegen (mit Rekonstruktion alter Spielstände) und Saisonwechsel
// -----------------------------------------------------------------------------
function backfill(g: Game, log: MgrLog): void {
  const cur = g.season;
  const book = recordBook(g);
  const past: MgrGame[] = [];
  if (book && book.h2hClub === log.club) {
    for (const [opp, list] of Object.entries(book.h2h)) {
      for (const [season, date, comp, home, gf, ga] of list) {
        if (season < log.from || season >= cur) continue;
        past.push([date, comp, opp, home, gf, ga, clubName(g, opp)]);
      }
    }
  }
  past.sort((a, b) => a[0].localeCompare(b[0]));
  const bySeason = new Map<string, MgrGame[]>();
  for (const x of past) {
    const s = seasonOfDate(x[0]);
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(x);
  }
  const seasons = new Set<string>([...bySeason.keys()]);
  for (const [s] of book?.seasons[log.club] ?? []) if (s >= log.from && s < cur) seasons.add(s);
  for (const s of [...seasons].sort()) {
    const rec = seasonRecOf(bySeason.get(s) ?? []);
    // Liga aus dem Archiv (vollständig, der direkte Vergleich ist je Gegner gekürzt).
    const row = archivedSeason(g, s)?.divisions.flatMap((d) => d.rows).find((r) => r[0] === log.club);
    if (row) rec.L = [row[1], row[2], row[3], row[4], row[5]];
    log.seasons[s] = rec;
    log.last = s;
  }
  tallyGames(log, past);
  // Ansehen je Saison: rückwärts aus den gespeicherten Änderungen.
  const st = g.career?.stints?.[g.career.stints.length - 1];
  if (st && g.career) {
    let rep = g.career.rep;
    for (const x of [...st.seasons].reverse()) {
      if (log.seasons[x.season]) log.seasons[x.season].rep = Math.round(rep * 10) / 10;
      rep -= x.dRep ?? 0;
    }
  }
  // Transfersummen aus den Finanzbilanzen.
  const club = g.clubs[log.club];
  for (const h of club?.finances.seasonHistory ?? []) {
    const r = log.seasons[h.season];
    if (!r) continue;
    const sc = economyScale(Number(h.season.slice(0, 4)) + 1);
    r.tin = Math.round((h.income.transferIncome ?? 0) / sc);
    r.tout = Math.round((h.expenses.transferExpense ?? 0) / sc);
  }
  // Spieler aus den Saisonstationen, Transfers aus den Spielerverläufen.
  const fromDate = `${log.from.slice(0, 4)}-07-01`;
  for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers ?? {})]) {
    for (const s of p.history?.stations ?? []) if (s.clubId === log.club && s.season >= log.from && s.season < cur) notePlayer(log, p, s.season, s.appearances, s.goals);
    for (const t of p.history?.transfers ?? []) {
      if (t.date < fromDate || t.fee <= 0 || (t.fromClub !== log.club && t.toClub !== log.club)) continue;
      const base = Math.round(t.fee / economyScale(yearOf(t.date)));
      if (t.toClub === log.club) pushTransfer(log.buys, [t.date, p.id, p.fullName, t.fromClub, base, clubName(g, t.fromClub)]);
      else pushTransfer(log.sells, [t.date, p.id, p.fullName, t.toClub, base, clubName(g, t.toClub)]);
    }
  }
  for (const w of g.transferLog?.wins ?? []) {
    for (const e of w.e) {
      if (e.d < fromDate || e.fee <= 0 || (e.f !== log.club && e.t !== log.club)) continue;
      if (e.t === log.club) pushTransfer(log.buys, [e.d, e.p, e.n, e.f, e.fee, clubName(g, e.f)]);
      else pushTransfer(log.sells, [e.d, e.p, e.n, e.t, e.fee, clubName(g, e.t)]);
    }
  }
  trimPlayers(log);
}

/** Managerbilanz anlegen bzw. holen (idempotent). Vereinswechsel alter Spielstände: Bilanz beginnt neu. */
export function ensureMgr(g: Game): MgrLog | null {
  const c = g.career;
  if (!c || !g.clubs[g.managedClubId]) return null;
  if (c.mgr && c.mgr.club === g.managedClubId) return c.mgr;
  const st = c.stints[c.stints.length - 1];
  const from = st && st.clubId === g.managedClubId ? seasonOfDate(st.from) : g.season;
  const log: MgrLog = { v: 1, club: g.managedClubId, from, seasons: {}, players: {}, buys: [], sells: [], ...emptyTally() };
  c.mgr = log;
  if (from < g.season) backfill(g, log);
  return log;
}

/** Saisonwechsel (startNextSeason, Spielplan/Pokale/Spielerstatistik der alten Saison liegen noch vor). */
export function mgrSeasonEnd(g: Game): void {
  const log = ensureMgr(g);
  if (!log || (log.last && log.last >= g.season)) return;
  const games = seasonGames(g);
  const rec = seasonRecOf(games);
  const club = g.clubs[log.club];
  const sc = economyScale(yearOf(g.calendar.currentDate));
  rec.tin = Math.round((club.finances.income.transferIncome ?? 0) / sc);
  rec.tout = Math.round((club.finances.expenses.transferExpense ?? 0) / sc);
  rec.rep = g.career ? Math.round(g.career.rep * 10) / 10 : undefined;
  rec.coach = g.career?.coaches?.filter((e) => !e.to).pop()?.name;
  log.seasons[g.season] = rec;
  tallyGames(log, games);
  for (const id of club.playerIds) {
    const p = g.players[id];
    if (p?.seasonStats) notePlayer(log, p, g.season, p.seasonStats.appearances, p.seasonStats.goals);
  }
  trimPlayers(log);
  log.last = g.season;
}

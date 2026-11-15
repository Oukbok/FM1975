// =============================================================================
// WEITERE AUSZEICHNUNGEN — Goldener Schuh, Trainer des Jahres, Elf der Saison
// -----------------------------------------------------------------------------
// Wunsch Pascal: mehr Ehrungen auf Statistiken › Auszeichnungen (Wahl oben).
//   • Trainer des Jahres (Heimatland, Liga des eigenen Vereins) + Elf der Saison
//     der eigenen Liga: `homeExtraAwards` ganz am Anfang von startNextSeason
//     (Endtabelle, Pokal- und Europapokalsieger stehen fest, KI-Trainer noch im Amt).
//   • Goldener Schuh (alle 1. Ligen): `worldExtraAwards` in startNextSeason nach
//     `worldLiveResults` (Auslandsligen fertig, Ligastatistik der eigenen Liga noch vorhanden).
//     Die Elf der Saison im Ausland vergibt game/worldAwardsGame.ts mit den Besten der Saison.
// Wertungen rein in engine/goldenShoe.ts, engine/coachAward.ts, engine/teamOfSeason.ts.
// Archiv im optionalen Feld `game.extraAwards` (kompakt; früheres Feld `xiw` = Elf der
// Auslandsligen wird beim Laden nach `seasonAwards.wv` umgerechnet). Keine Popups – nur Nachrichten.
// Alte Spielstände ohne Feld: leer (`migrateExtraAwards` säubert nur).
// =============================================================================
import { seasonStartYear } from '../data/timeline';
import { euroCompName } from '../data/euroFormats';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { type CoachCandidate, type CoachEuro, rankCoaches } from '../engine/coachAward';
import { expectedPosition } from '../engine/environment';
import { rankGoldenShoe, SHOE_WEIGHTED_FROM, type ShoeCandidate } from '../engine/goldenShoe';
import { makeMessage, pushMessage } from '../engine/messages';
import { countryRanking, germanRank, type LeanDiv } from '../engine/world';
import { headCoachNow } from './headCoaches';
import { awardCandidates } from './seasonAwardsGame';
import { type Game, homeCountryKey } from './state';
import { homeTeamOfSeason, type TosSeason, MAX_XI_SEASONS } from './teamOfSeasonGame';
import { WP_FIELD as W } from './worldPool';
import { leanLines } from './worldScorers';

/** Goldener Schuh: ein Platz (k = Länderschlüssel, h = Heimatliga). */
export interface GSEntry { p: string; n: string; c: string; cn: string; k: string; h?: 1; pos: string; ap: number; gl: number; f: number; pts: number }
export interface GSSeason { s: string; top: GSEntry[] }
/** Trainer des Jahres: Verein, Name, Endplatz, erwarteter Platz, Punkte, Begründung, eigener Verein. */
export interface CoachEntry { c: string; cn: string; n: string; rk: number; ex: number; pts: number; why: string; me?: 1 }
export interface CoachSeason { s: string; dn: string; top: CoachEntry[] }
export interface ExtraAwardsState {
  v: 1; shoe: GSSeason[]; coach: CoachSeason[]; xi: TosSeason[];
  /** Älteres Format der Elf der Auslandsligen – beim Laden nach `seasonAwards.wv` (game/worldAwardsMigration.ts). */
  xiw?: TosSeason[];
}

export const MAX_EXTRA_SEASONS = 80;

type G = Game & { extraAwards?: ExtraAwardsState };
export const extraAwardsState = (g: Game) => (g as G).extraAwards;
export function ensureExtraAwards(g: Game): ExtraAwardsState {
  return ((g as G).extraAwards ??= { v: 1, shoe: [], coach: [], xi: [] });
}
export const goldenShoeOf = (g: Game, season: string) => extraAwardsState(g)?.shoe.find((x) => x.s === season);
export const coachAwardOf = (g: Game, season: string) => extraAwardsState(g)?.coach.find((x) => x.s === season);

const cap = <T>(list: T[], n: number) => { if (list.length > n) list.splice(0, list.length - n); };

/** Rang der Länder in der Fünfjahreswertung (1 = bestes) – Länderschlüssel → Rang, dazu das Heimatland. */
export function leagueRanks(g: Game, year: number): { ranks: Map<string, number>; home: number } {
  const ranks = new Map<string, number>();
  const w = g.world;
  if (!w) return { ranks, home: 1 };
  const home = germanRank(w, year);
  countryRanking(w, year).forEach((c, i) => ranks.set(c.name, i + 1 + (i + 1 >= home ? 1 : 0)));
  return { ranks, home };
}

// -----------------------------------------------------------------------------
// Trainer des Jahres
// -----------------------------------------------------------------------------
function euroRun(g: Game, clubId: string, startYear: number): CoachCandidate['euro'] {
  let best: CoachCandidate['euro'];
  for (const comp of ['ec', 'cwc', 'uefa'] as CoachEuro[]) {
    const cup = g.euroCups?.[comp];
    if (!cup?.rounds?.length) continue;
    let reached = -1;
    for (const r of cup.rounds) if (r.ties?.some((t) => t.homeClubId === clubId || t.awayClubId === clubId)) reached = Math.max(reached, r.index ?? 0);
    if (reached < 0) continue;
    const won = cup.winnerClubId === clubId;
    const e = { comp, round: reached, rounds: cup.rounds.length, won, label: cup.rounds[reached]?.name ?? '', name: euroCompName(comp, startYear) };
    if (!best || won || (!best.won && e.round / e.rounds > best.round / best.rounds)) best = e;
  }
  return best;
}

const strengthOf = (g: Game, id: string) => {
  const ovs = (g.clubs[id]?.playerIds ?? []).map((pid) => g.players[pid]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
  return ovs.length ? ovs.reduce((a, b) => a + b, 0) / ovs.length : 0;
};

export function coachCandidates(g: Game): CoachCandidate[] {
  const rows = g.table.rows.filter((r) => g.clubs[r.clubId]);
  const teams = rows.length;
  if (teams < 4) return [];
  const y = seasonStartYear(g.season);
  const start = Date.parse(`${y}-07-01`), end = Date.parse(`${y + 1}-06-30`);
  const byStr = rows.map((r) => r.clubId).sort((a, b) => strengthOf(g, b) - strengthOf(g, a));
  const out: CoachCandidate[] = [];
  rows.forEach((r, i) => {
    const club = g.clubs[r.clubId];
    const own = r.clubId === g.managedClubId;
    const hc = own ? headCoachNow(g) : undefined;
    const coach = own ? hc?.name ?? g.manager?.name : club.coach?.name;
    if (!coach) return;
    const since = own ? hc?.hired : club.coach?.since;
    const from = since ? Math.max(start, Date.parse(since) || start) : start;
    const tenure = Math.max(0, Math.min(1, (end - from) / (end - start)));
    const sr = byStr.indexOf(r.clubId) + 1;
    const goal = club.boardExpectation ? (/Obere/i.test(club.boardExpectation) ? Math.round(teams / 2) : expectedPosition(club.boardExpectation, teams)) : sr;
    out.push({
      clubId: r.clubId, clubName: club.name, coach, rank: i + 1, expected: Math.round((sr + goal) / 2), teams,
      champion: i === 0, cup: g.cup?.winnerClubId === r.clubId, euro: euroRun(g, r.clubId, y), tenure,
    });
  });
  return out;
}

function awardCoach(g: Game, date: string): CoachSeason | null {
  const st = ensureExtraAwards(g);
  if (st.coach.some((x) => x.s === g.season)) return null;
  const top = rankCoaches(coachCandidates(g), 3);
  if (!top.length) return null;
  const res: CoachSeason = {
    s: g.season, dn: g.leagues.playerDivision.name,
    top: top.map((c) => {
      const e: CoachEntry = { c: c.clubId, cn: c.clubName, n: c.coach, rk: c.rank, ex: c.expected, pts: Math.round(c.score * 10) / 10, why: c.why };
      if (c.clubId === g.managedClubId) e.me = 1;
      return e;
    }),
  };
  st.coach.push(res);
  cap(st.coach, MAX_EXTRA_SEASONS);
  const w = res.top[0];
  const mineAt = res.top.findIndex((e) => e.me);
  pushMessage(g.messages, makeMessage({
    date, category: 'media', from: 'Sportredaktion',
    subject: `Trainer des Jahres ${res.s}: ${w.n}`,
    shortText: `${w.n} (${w.cn}) ist Trainer des Jahres der ${res.dn}.`,
    bodyText: [
      `Die Sportredaktion wählt ${w.n} (${w.cn}) zum Trainer des Jahres ${res.s}. ${w.why}`,
      '',
      ...res.top.map((e, i) => `${i + 1}. ${e.n} (${e.cn}) – Platz ${e.rk}, erwartet Platz ${e.ex}`),
      ...(mineAt >= 0 ? ['', mineAt === 0 ? 'Glückwunsch: Die Ehrung geht an deinen Verein.' : `Dein Verein ist mit Platz ${mineAt + 1} vertreten.`] : []),
      '', 'Alle Jahrgänge findest du unter Statistiken › Auszeichnungen.',
    ].join('\n'),
  }));
  return res;
}

/** Saisonende, ganz am Anfang von startNextSeason: Trainer des Jahres + Elf der Saison der eigenen Liga. */
export function homeExtraAwards(g: Game, date: string): void {
  awardCoach(g, date);
  homeTeamOfSeason(g);
}

// -----------------------------------------------------------------------------
// Goldener Schuh
// -----------------------------------------------------------------------------
export function shoeCandidates(g: Game, season: string, divs: Record<string, (LeanDiv | null)[]>): ShoeCandidate[] {
  const endYear = seasonStartYear(season) + 1;
  const { ranks, home } = leagueRanks(g, endYear);
  const out: ShoeCandidate[] = [];
  const homeKey = homeCountryKey(g);
  if (g.leagues.playerDivision.tier === 1) {
    for (const c of awardCandidates(g).cands) {
      if (c.goals > 0) out.push({ pid: c.pid, name: c.name, clubId: c.clubId, clubName: c.clubName, country: homeKey, home: true, pos: c.pos, apps: c.apps, goals: c.goals, rank: home });
    }
  }
  for (const [key, tiers] of Object.entries(divs)) {
    const d = tiers[0];
    if (!d?.r || key === homeKey) continue;
    const rank = ranks.get(key) ?? 99;
    for (const l of leanLines(g, d, season)) {
      if (l.goals <= 0) continue;
      out.push({
        pid: l.w[W.id], name: `${l.w[W.first]} ${l.w[W.last]}`.trim(), clubId: l.clubId, clubName: g.euroClubs?.[l.clubId]?.name ?? l.clubId,
        country: key, home: false, pos: l.w[W.pos], apps: l.apps, goals: l.goals, rank,
      });
    }
  }
  return out;
}

function awardShoe(g: Game, season: string, divs: Record<string, (LeanDiv | null)[]>, date: string): GSSeason | null {
  const st = ensureExtraAwards(g);
  if (st.shoe.some((x) => x.s === season)) return null;
  const endYear = seasonStartYear(season) + 1;
  const top = rankGoldenShoe(shoeCandidates(g, season, divs), endYear, 10);
  if (!top.length) return null;
  const res: GSSeason = {
    s: season,
    top: top.map((c) => {
      const e: GSEntry = { p: c.pid, n: c.name, c: c.clubId, cn: c.clubName, k: c.country, pos: c.pos, ap: c.apps, gl: c.goals, f: c.factor, pts: c.points };
      if (c.home) e.h = 1;
      return e;
    }),
  };
  st.shoe.push(res);
  cap(st.shoe, MAX_EXTRA_SEASONS);
  const w = res.top[0];
  const land = (e: GSEntry) => COUNTRY_BY_KEY[e.k]?.name ?? e.k;
  const mine = res.top.filter((e) => e.c === g.managedClubId);
  pushMessage(g.messages, makeMessage({
    date, category: 'media', from: 'Sportredaktion',
    subject: `Goldener Schuh ${season}: ${w.n}`,
    shortText: `Europas bester Torjäger: ${w.n} (${w.cn}) mit ${w.gl} Toren.`,
    bodyText: [
      `Der Goldene Schuh ${season} für den besten Torjäger Europas geht an ${w.n} (${w.cn}, ${land(w)}) – ${w.gl} Ligatore${w.f !== 1 ? `, Faktor ${String(w.f).replace('.', ',')} = ${String(w.pts).replace('.', ',')} Punkte` : ''}.`,
      '',
      ...res.top.slice(0, 5).map((e, i) => `${i + 1}. ${e.n} (${e.cn}, ${land(e)}) – ${e.gl} Tore${e.f !== 1 ? ` × ${String(e.f).replace('.', ',')}` : ''}`),
      ...(mine.length ? ['', `Aus deinem Kader in den Top 10: ${mine.map((e) => e.n).join(', ')}.`] : []),
      '', endYear >= SHOE_WEIGHTED_FROM ? 'Gewertet werden die Ligatore, gewichtet nach der Stärke der Liga (Fünfjahreswertung).' : 'Gewertet werden die Ligatore aller 1. Ligen Europas.',
    ].join('\n'),
  }));
  return res;
}

/** Saisonende nach worldLiveResults: Goldener Schuh aller 1. Ligen. */
export function worldExtraAwards(g: Game, season: string, divs: Record<string, (LeanDiv | null)[]>, date: string): void {
  awardShoe(g, season, divs, date);
}

const okXi = (x: TosSeason) => !!x && typeof x.s === 'string' && Array.isArray(x.x) && Array.isArray(x.c);

/** Alte Spielstände: ohne Feld nichts tun; sonst säubern und begrenzen (idempotent). */
export function migrateExtraAwards(g: Game): void {
  const st = extraAwardsState(g);
  if (!st) return;
  st.shoe = Array.isArray(st.shoe) ? st.shoe.filter((x) => x && typeof x.s === 'string' && Array.isArray(x.top)) : [];
  st.coach = Array.isArray(st.coach) ? st.coach.filter((x) => x && typeof x.s === 'string' && Array.isArray(x.top)) : [];
  st.xi = Array.isArray(st.xi) ? st.xi.filter(okXi) : [];
  if (st.xiw && !Array.isArray(st.xiw)) delete st.xiw;
  if (st.xiw) st.xiw = st.xiw.filter(okXi);
  cap(st.shoe, MAX_EXTRA_SEASONS); cap(st.coach, MAX_EXTRA_SEASONS); cap(st.xi, MAX_XI_SEASONS);
  st.v = 1;
}

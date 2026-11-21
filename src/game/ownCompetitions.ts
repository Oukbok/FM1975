// =============================================================================
// Wettbewerbe des eigenen Vereins in der laufenden Saison (Aufstellung › Spielplan,
// Wunsch Pascal): Liga, Landespokal, Europapokal, Supercup – je Wettbewerb Trophäe,
// erreichte Runde, Stand (läuft / ausgeschieden / Sieger) und letztes Ergebnis.
// Nur gelesen, kein Spielstand-Feld.
// =============================================================================
import { nOf } from '../engine/textNum';
import type { CupState, CupTie } from '../types';
import type { Game } from './state';
import type { TrophyShape } from './trophyCabinet';
import { euroCompName } from '../data/euroFormats';
import { seasonStartYear } from '../data/timeline';
import { euroStatus } from './euroFixture';
import { oppName } from './opponentView';
import { superCupState, ROUND_DE } from './superCupGame';

export type CompState = 'live' | 'out' | 'won' | 'wait';
export interface OwnComp {
  key: string;
  name: string;
  shape: TrophyShape;
  state: CompState;
  /** Stand in Worten: „4. Platz · 21 Punkte“, „Viertelfinale“, „Aus im Achtelfinale“. */
  status: string;
  /** Runden des Wettbewerbs und davon erreicht (Fortschrittsleiste); Liga ohne. */
  steps?: { n: number; at: number };
  /** Letztes Spiel: Gegner, Ergebnis aus eigener Sicht, gewonnen? */
  last?: { opp: string; oppId: string; score: string; res: 'W' | 'D' | 'L' };
  /** Nächster Gegner (falls gelost). */
  next?: { opp: string; oppId: string; home: boolean };
}

const extra = (t: { decision?: string | null; penalties?: { home: number; away: number } | null }, me: boolean) =>
  t.decision === 'penalties' && t.penalties ? ` i. E. ${me ? `${t.penalties.home}:${t.penalties.away}` : `${t.penalties.away}:${t.penalties.home}`}` : t.decision === 'aet' ? ' n. V.' : '';

function tieLine(g: Game, t: CupTie, id: string): OwnComp['last'] {
  const home = t.homeClubId === id;
  const oppId = home ? t.awayClubId : t.homeClubId;
  const gf = home ? t.homeGoals : t.awayGoals, ga = home ? t.awayGoals : t.homeGoals;
  if (gf == null || ga == null) return undefined;
  const res = t.winnerClubId ? (t.winnerClubId === id ? 'W' : 'L') : gf > ga ? 'W' : gf < ga ? 'L' : 'D';
  return { opp: oppName(g, oppId), oppId, score: `${gf}:${ga}${extra(t, home)}`, res };
}

function cupEntry(g: Game, cup: CupState, id: string, key: string, name: string, shape: TrophyShape): OwnComp | null {
  let at = -1;
  let lastTie: CupTie | undefined;
  let nextTie: CupTie | undefined;
  cup.rounds.forEach((r, i) => {
    const t = r.ties.find((x) => x.homeClubId === id || x.awayClubId === id);
    if (t || r.groups?.some((gr) => gr.ids.includes(id)) || r.entrants?.includes(id)) at = i;
    if (t?.played) lastTie = t;
    else if (t && !nextTie) nextTie = t;
  });
  if (at < 0 && !cup.participantIds.includes(id)) return null;
  const n = cup.rounds.length;
  const round = at >= 0 ? cup.rounds[at] : cup.rounds[0];
  let state: CompState, status: string;
  if (cup.winnerClubId === id) { state = 'won'; status = 'Sieger'; }
  else if (cup.v2 && at >= 0) {
    const s = euroStatus(cup, id);
    state = /^ausgeschieden/.test(s) ? 'out' : 'live';
    status = state === 'out' ? s.replace(/^ausgeschieden \((.+)\)$/, 'Aus: $1').replace(/^ausgeschieden$/, 'Ausgeschieden') : s;
  } else {
    const t = round?.ties.find((x) => x.homeClubId === id || x.awayClubId === id);
    if (t?.played && t.winnerClubId && t.winnerClubId !== id) { state = 'out'; status = `Aus im ${round.name}`; }
    else if (at < 0) { state = 'wait'; status = `Start: ${cup.rounds[0]?.name ?? '1. Runde'}`; }
    else { state = 'live'; status = round.name; }
  }
  const nx = state === 'live' && nextTie ? { opp: oppName(g, (nextTie as CupTie).homeClubId === id ? (nextTie as CupTie).awayClubId : (nextTie as CupTie).homeClubId), oppId: (nextTie as CupTie).homeClubId === id ? (nextTie as CupTie).awayClubId : (nextTie as CupTie).homeClubId, home: (nextTie as CupTie).homeClubId === id } : undefined;
  return { key, name, shape, state, status, steps: { n, at: state === 'won' ? n : Math.max(0, at) }, last: lastTie ? tieLine(g, lastTie, id) : undefined, next: nx };
}

/** Alle Wettbewerbe des eigenen Vereins in der laufenden Saison (Liga zuerst). */
export function ownCompetitions(g: Game): OwnComp[] {
  const id = g.managedClubId;
  const y = seasonStartYear(g.season);
  const out: OwnComp[] = [];
  const pd = g.leagues.playerDivision;
  const rows = g.table.rows;
  const pos = rows.findIndex((r) => r.clubId === id);
  const row = rows[pos];
  const played = g.fixtures.filter((m) => m.involvesPlayerClub && m.status === 'finished').length;
  const total = g.fixtures.filter((m) => m.involvesPlayerClub).length;
  out.push({
    key: 'liga', name: pd.name, shape: pd.tier === 1 || pd.tier === 101 ? 'schale' : 'teller', state: played >= total && total > 0 ? (pos === 0 ? 'won' : 'out') : 'live',
    status: row ? `${pos + 1}. Platz · ${nOf(row.points, 'Punkt', 'Punkte')}` : 'Saison beginnt', steps: total ? { n: total, at: played } : undefined,
  });
  if (g.cup) { const e = cupEntry(g, g.cup, id, 'cup', 'Landespokal', 'pokal'); if (e) out.push(e); }
  for (const k of ['ec', 'cwc', 'uefa'] as const) {
    const cup = g.euroCups?.[k];
    if (!cup) continue;
    const e = cupEntry(g, cup, id, k, euroCompName(k, y), k === 'ec' ? 'henkel' : k === 'cwc' ? (y >= 2021 ? 'konferenz' : 'cwc') : 'uefa');
    if (e) out.push(e);
  }
  const sc = superCupState(g);
  if (sc.season === g.season) {
    for (const ev of sc.events) {
      if (!ev.teams.includes(id)) continue;
      const mine = ev.matches.filter((m) => m.home === id || m.away === id);
      const last = [...mine].reverse().find((m) => m.played);
      const next = mine.find((m) => !m.played);
      const lost = !!last?.winner && last.winner !== id && !ev.winner;
      const state: CompState = ev.winner ? (ev.winner === id || ev.shared ? 'won' : 'out') : lost ? 'out' : 'live';
      const stage = (last ?? next)?.stage;
      const status = state === 'won' ? 'Sieger' : state === 'out' ? `Aus im ${stage ? ROUND_DE[stage] : 'Finale'}` : stage ? ROUND_DE[stage] : 'angesetzt';
      const lastLine = last && last.hg != null && last.ag != null ? (() => {
        const home = last.home === id;
        const gf = home ? last.hg! : last.ag!, ga = home ? last.ag! : last.hg!;
        const pens = last.pens ? ` i. E. ${home ? `${last.pens[0]}:${last.pens[1]}` : `${last.pens[1]}:${last.pens[0]}`}` : last.aet ? ' n. V.' : '';
        const oppId = home ? last.away : last.home;
        return { opp: oppName(g, oppId), oppId, score: `${gf}:${ga}${pens}`, res: (last.winner ? (last.winner === id ? 'W' : 'L') : gf > ga ? 'W' : gf < ga ? 'L' : 'D') as 'W' | 'D' | 'L' };
      })() : undefined;
      out.push({ key: `sc-${ev.key}`, name: ev.name, shape: 'pokal', state, status, last: lastLine,
        next: state === 'live' && next ? { opp: oppName(g, next.home === id ? next.away : next.home), oppId: next.home === id ? next.away : next.home, home: next.home === id } : undefined });
    }
  }
  return out;
}

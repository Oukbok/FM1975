// =============================================================================
// Eigenes Spiel des Tages: erkennen, vorbereiten (Schnellsimulation oder
// Textmodus) und das Ergebnis für den regulären Spieltagsablauf hinterlegen.
// Der Spieltag (Liga/Pokal/Europapokal) verbucht danach alles wie gewohnt.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { createMatchSim, hasPreparedMatch, registerPreparedMatch, type MatchSim } from '../engine/match';
import { finishMatch } from '../engine/match/finish';
import type { MatchOutcome, Side } from '../engine/match/types';
import { EURO_COMP_NAMES } from '../data/europe';
import { buildEuroClubFull } from '../data/generate';
import type { CupState, CupTie, Match } from '../types';
import type { Game } from './state';

export interface OwnMatchInfo {
  kind: 'liga' | 'pokal' | 'euro';
  homeId: string;
  awayId: string;
  date: string;
  competition: 'Liga' | 'Pokal' | 'Europapokal';
  knockout: boolean;
  /** Anzeige, z. B. „Liga · 12. Spieltag“. */
  label: string;
  /** ID des späteren Match-Objekts (Spielbericht). */
  matchId: string;
  /** Seite des eigenen Vereins. */
  side: Side;
}

function tieInfo(g: Game, kind: 'pokal' | 'euro', cup: CupState, ri: number, tie: CupTie, label: string): OwnMatchInfo {
  return {
    kind, homeId: tie.homeClubId, awayId: tie.awayClubId, date: tie.date,
    competition: kind === 'pokal' ? 'Pokal' : 'Europapokal', knockout: true,
    label: `${label} · ${cup.rounds[ri].name}`, matchId: tie.id,
    side: tie.homeClubId === g.managedClubId ? 'home' : 'away',
  };
}

/** Steht heute ein eigenes, noch nicht gespieltes Spiel an? */
export function findOwnMatchDue(g: Game): OwnMatchInfo | null {
  const cal = g.calendar;
  if (cal.pendingAdvance || CalendarEngine.isSeasonOver(cal)) return null;
  const today = cal.currentDate;
  const mid = g.managedClubId;
  for (const ev of CalendarEngine.eventsOn(cal, today)) {
    if (ev.processed) continue;
    if (ev.type === 'matchday' && ev.matchId) {
      const m0 = g.fixtures.find((m) => m.id === ev.matchId);
      if (!m0 || m0.status !== 'scheduled') continue;
      const m = g.fixtures.find((x) => x.matchday === m0.matchday && x.involvesPlayerClub && x.status === 'scheduled');
      if (!m) continue;
      return {
        kind: 'liga', homeId: m.homeClubId, awayId: m.awayClubId, date: m.date, competition: 'Liga', knockout: false,
        label: `Liga · ${m.matchday}. Spieltag`, matchId: m.id, side: m.homeClubId === mid ? 'home' : 'away',
      };
    }
    if (ev.type === 'cup_matchday' && ev.cupRoundIndex != null && g.cup) {
      const round = g.cup.rounds[ev.cupRoundIndex];
      const tie = round?.drawn ? round.ties.find((t) => t.involvesPlayerClub && !t.played) : undefined;
      if (tie) return tieInfo(g, 'pokal', g.cup, ev.cupRoundIndex, tie, 'Pokal');
    }
    if (ev.type === 'euro_matchday' && ev.euroComp && ev.cupRoundIndex != null) {
      const cup = g.euroCups?.[ev.euroComp];
      const round = cup?.rounds[ev.cupRoundIndex];
      const tie = round?.drawn ? round.ties.find((t) => (t.homeClubId === mid || t.awayClubId === mid) && !t.played) : undefined;
      if (cup && tie) return tieInfo(g, 'euro', cup, ev.cupRoundIndex, tie, EURO_COMP_NAMES[ev.euroComp] ?? 'Europapokal');
    }
  }
  return null;
}

export function isPrepared(info: OwnMatchInfo): boolean {
  return hasPreparedMatch(info.homeId, info.awayId, info.date);
}

/** Ausländischen Gegner bei Bedarf als vollen Verein anlegen (wie im Europapokal-Ablauf). */
function ensureClubs(g: Game, info: OwnMatchInfo): boolean {
  for (const id of [info.homeId, info.awayId]) {
    if (g.clubs[id]) continue;
    const euro = g.euroClubs?.[id];
    if (!euro) return false;
    g.clubs[id] = buildEuroClubFull(euro, g.calendar?.seasonStartDate ?? '', g.players);
  }
  return true;
}

/** Live-Simulation für den Textmodus (der Mensch coacht die eigene Seite). */
export function createOwnMatchSim(g: Game, info: OwnMatchInfo, live = true): MatchSim | null {
  if (!ensureClubs(g, info)) return null;
  return createMatchSim(g.clubs[info.homeId], g.clubs[info.awayId], g.players, {
    date: info.date, knockout: info.knockout, humanSides: live ? [info.side] : [],
    humanClubIds: [g.managedClubId], live,
  });
}

/** Spiel abschließen, verbuchen und für den Spieltag hinterlegen. */
export function completeOwnMatch(g: Game, info: OwnMatchInfo, sim: MatchSim, watched: boolean): MatchOutcome {
  const outcome = finishMatch(sim, {
    date: info.date, competition: info.competition, logClubIds: [g.managedClubId],
    applyInjuries: g.injuriesEnabled, watched,
  });
  registerPreparedMatch(info.homeId, info.awayId, info.date, outcome);
  return outcome;
}

/** „Schnell simulieren“: sofortiges Ergebnis. */
export function quickSimOwnMatch(g: Game, info: OwnMatchInfo): MatchOutcome | null {
  const sim = createOwnMatchSim(g, info, false);
  if (!sim) return null;
  sim.runToEnd();
  return completeOwnMatch(g, info, sim, false);
}

/** Match-Objekt zu einer ID (Liga, Pokal, Europapokal). */
export function findMatch(g: Game, id: string): { match: Match; label: string } | null {
  const f = g.fixtures.find((x) => x.id === id);
  if (f) return { match: f, label: `Liga · ${f.matchday}. Spieltag` };
  const cups: [CupState | null | undefined, string][] = [[g.cup, 'Pokal']];
  if (g.euroCups) for (const k of Object.keys(g.euroCups) as (keyof NonNullable<Game['euroCups']>)[]) cups.push([g.euroCups[k], EURO_COMP_NAMES[k] ?? 'Europapokal']);
  for (const [cup, name] of cups) {
    if (!cup) continue;
    for (const r of cup.rounds) {
      const t = r.ties.find((x) => x.id === id || x.match?.id === id);
      if (t?.match) return { match: t.match, label: `${name} · ${r.name}` };
    }
  }
  return null;
}

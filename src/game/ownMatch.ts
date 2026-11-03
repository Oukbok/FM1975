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
import type { KoRule } from '../engine/match/sim';
import type { EuroCompId } from '../data/europe';
import { withEuroSink } from '../engine/compStats';
import { euroCompName } from '../data/euroFormats';
import { isV2, cupStartYear } from './euroSetup';
import { legKoRule } from './euroFlow';
import { cupKoRule } from './cupReplay';
import { forecastWeather } from './matchWeather';

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
  /** K.-o.-Regel im Detail (Rückspiel mit Gesamtstand, Wiederholungsspiel). */
  ko?: KoRule;
  /** Europapokal: Wettbewerb (Statistik je Wettbewerb). */
  euroComp?: EuroCompId;
  /** Rückspiel: Ergebnis des Hinspiels (Heim/Gast des Hinspiels) und ob Auswärtstore zählen. */
  firstLeg?: { home: string; away: string; hg: number; ag: number; awayGoals: boolean };
  /** Gruppen-/Ligaspiel bzw. Hinspiel (kein K.-o.-Ende). */
  stageNote?: string;
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
    if (ev.type === 'cup_matchday' && ev.cupRoundIndex != null && isV2(g.cup)) {
      const cup = g.cup;
      const round = cup.rounds[ev.cupRoundIndex];
      const replay = ev.leg === 1;
      const tie = round?.drawn ? round.ties.find((t) => t.involvesPlayerClub && !t.played && (replay ? !!t.legs?.[1] && !t.legs[1].played : !t.legs?.[0]?.played)) : undefined;
      if (tie) {
        const home = replay ? tie.awayClubId : tie.homeClubId, away = replay ? tie.homeClubId : tie.awayClubId;
        return {
          kind: 'pokal', homeId: home, awayId: away, date: replay ? tie.legs![1].date : tie.date, competition: 'Pokal', knockout: true,
          label: `Pokal · ${round.name}${replay ? ' (Wiederholungsspiel)' : ''}`, matchId: replay ? `${tie.id}_w` : tie.id,
          side: home === mid ? 'home' : 'away', ko: cupKoRule(cup, ev.cupRoundIndex, replay) ?? { extraTime: true, shootout: true },
          stageNote: !replay && cupKoRule(cup, ev.cupRoundIndex, false) ? 'Unentschieden nach Verlängerung: Wiederholungsspiel' : undefined,
        };
      }
      continue;
    }
    if (ev.type === 'euro_matchday' && ev.euroComp && ev.cupRoundIndex != null && isV2(g.euroCups?.[ev.euroComp])) {
      const comp = ev.euroComp;
      const cup = g.euroCups![comp]!;
      const round = cup.rounds[ev.cupRoundIndex];
      const slot = ev.leg ?? 0;
      const label = `${euroCompName(comp, cupStartYear(cup))} · ${round?.name ?? ''}`;
      if (round?.drawn && round.kind === 'ko') {
        const tie = round.ties.find((t) => !t.played && t.legs?.[slot] && !t.legs[slot].played && (t.legs[slot].home === mid || t.legs[slot].away === mid));
        if (tie) {
          const leg = tie.legs![slot];
          const ko = legKoRule(cup, comp, tie, slot);
          const l0 = tie.legs!.length === 2 && slot === 1 ? tie.legs![0] : null;
          return {
            kind: 'euro', homeId: leg.home, awayId: leg.away, date: leg.date, competition: 'Europapokal', knockout: !!ko,
            label: `${label}${tie.legs!.length === 2 ? (slot ? ' · Rückspiel' : ' · Hinspiel') : ''}`, matchId: `${tie.id}_l${slot}`,
            side: leg.home === mid ? 'home' : 'away', ko: ko ?? undefined, euroComp: comp,
            firstLeg: l0 ? { home: l0.home, away: l0.away, hg: l0.homeGoals ?? 0, ag: l0.awayGoals ?? 0, awayGoals: !!ko?.awayGoals } : undefined,
            stageNote: tie.legs!.length === 2 && slot === 0 ? 'Hinspiel' : undefined,
          };
        }
      } else if (round?.drawn) {
        for (const gr of round.groups ?? []) {
          const m = gr.matches.find((x) => x.md === slot && x.hg == null && (x.home === mid || x.away === mid));
          if (m) return {
            kind: 'euro', homeId: m.home, awayId: m.away, date: m.date, competition: 'Europapokal', knockout: false,
            label: `${label}${gr.name !== 'Ligaphase' ? ` · Gruppe ${gr.name}` : ''} · ${slot + 1}. Spieltag`, matchId: m.id,
            side: m.home === mid ? 'home' : 'away', euroComp: comp, stageNote: round.kind === 'league' ? 'Ligaphase' : `Gruppe ${gr.name}`,
          };
        }
      }
      continue;
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
export function ensureClubs(g: Game, info: OwnMatchInfo): boolean {
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
    humanClubIds: [g.managedClubId], live, competition: info.competition, ko: info.knockout ? info.ko : undefined,
    weather: forecastWeather(info.date, info.homeId),
  });
}

/** Spiel abschließen, verbuchen und für den Spieltag hinterlegen. */
export function completeOwnMatch(g: Game, info: OwnMatchInfo, sim: MatchSim, watched: boolean): MatchOutcome {
  const ecup = info.euroComp ? g.euroCups?.[info.euroComp] : null;
  const sink = ecup ? (ecup.xstats ??= {}) : null;
  const outcome = withEuroSink(sink, () => finishMatch(sim, {
    date: info.date, competition: info.competition, logClubIds: [g.managedClubId],
    applyInjuries: g.injuriesEnabled, watched,
  }));
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
      if (t?.match && (t.match.id === id || !t.legs)) return { match: t.match, label: `${name} · ${r.name}` };
      for (const x of r.ties) for (const [k, l] of (x.legs ?? []).entries()) {
        if (l.match?.id === id) return { match: l.match, label: `${name} · ${r.name}${x.legs!.length === 2 ? (k ? ' · Rückspiel' : ' · Hinspiel') : k ? ' · Wiederholungsspiel' : ''}` };
      }
      for (const gr of r.groups ?? []) {
        const m = gr.matches.find((x) => x.id === id);
        if (m?.match) return { match: m.match, label: `${name} · ${r.name} · ${m.md + 1}. Spieltag` };
      }
    }
  }
  return null;
}

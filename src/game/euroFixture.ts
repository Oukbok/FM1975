// =============================================================================
// Eigenes Spiel an einem Pokal-/Europapokal-Termin (für Kalender und Anzeigen):
// berücksichtigt Hin-/Rückspiel, Gruppen-/Ligaspieltage und Wiederholungsspiele.
// =============================================================================
import { euroCompName } from '../data/euroFormats';
import type { CalendarEvent, Match } from '../types';
import { isV2 } from './euroSetup';
import type { Game } from './state';

export interface OwnFixture { opp: string; home: boolean; match: Match | null; comp: string }

/** `null` = kein eigenes Spiel an diesem Termin; `undefined` = alter Modus (Aufrufer entscheidet). */
export function ownFixtureOn(g: Game, ev: CalendarEvent): OwnFixture | null | undefined {
  const me = g.managedClubId;
  const slot = ev.leg ?? 0;
  if (ev.type === 'cup_matchday') {
    const cup = g.cup;
    if (!isV2(cup) || ev.cupRoundIndex == null) return undefined;
    const round = cup.rounds[ev.cupRoundIndex];
    const tie = round?.ties.find((t) => t.homeClubId === me || t.awayClubId === me);
    if (!tie) return slot === 0 ? undefined : null;
    if (slot === 1) {
      const l = tie.legs?.[1];
      if (!l) return null;
      return { opp: l.home === me ? l.away : l.home, home: l.home === me, match: l.match, comp: `Pokal · ${round.name} (Wiederholung)` };
    }
    return undefined;
  }
  if (ev.type !== 'euro_matchday' || !ev.euroComp || ev.cupRoundIndex == null) return undefined;
  const cup = g.euroCups?.[ev.euroComp];
  if (!isV2(cup)) return undefined;
  const round = cup.rounds[ev.cupRoundIndex];
  if (!round?.drawn) return null;
  const name = `${euroCompName(ev.euroComp, Number(cup.season.slice(0, 4)))} · ${round.name}`;
  if (round.kind === 'ko') {
    const tie = round.ties.find((t) => t.homeClubId === me || t.awayClubId === me);
    const l = tie?.legs?.[slot];
    if (!l) return null;
    return { opp: l.home === me ? l.away : l.home, home: l.home === me, match: l.match, comp: name + (tie!.legs!.length === 2 ? (slot ? ' (Rückspiel)' : ' (Hinspiel)') : '') };
  }
  for (const gr of round.groups ?? []) {
    const m = gr.matches.find((x) => x.md === slot && (x.home === me || x.away === me));
    if (m) return { opp: m.home === me ? m.away : m.home, home: m.home === me, match: m.match ?? null, comp: `${name}, ${slot + 1}. Spieltag` };
  }
  return null;
}

/** Ist der Verein (auch nach Wechsel aus einem anderen Wettbewerb) in diesem Wettbewerb? */
export function inEuroCup(cup: import('../types').CupState | null | undefined, id: string): boolean {
  return !!cup && (cup.participantIds.includes(id) || cup.rounds.some((r) => r.entrants?.includes(id)));
}

/** Kurzstatus des eigenen Vereins in einem Wettbewerb (neuer Modus). */
export function euroStatus(cup: import('../types').CupState, id: string): string {
  if (cup.winnerClubId === id) return 'Sieger!';
  for (let i = cup.rounds.length - 1; i >= 0; i--) {
    const r = cup.rounds[i];
    const inRound = r.entrants?.includes(id) || r.ties.some((t) => t.homeClubId === id || t.awayClubId === id) || r.groups?.some((gr) => gr.ids.includes(id));
    if (!inRound) continue;
    const tie = r.ties.find((t) => t.homeClubId === id || t.awayClubId === id);
    if (tie?.played && tie.winnerClubId !== id) return `ausgeschieden (${r.name})`;
    const gr = r.groups?.find((x) => x.ids.includes(id));
    if (gr?.final) {
      const nextIn = cup.rounds.slice(i + 1).some((x) => x.entrants?.includes(id));
      if (!nextIn) return `ausgeschieden (${r.name}, Platz ${gr.final.indexOf(id) + 1})`;
      continue;
    }
    return r.name;
  }
  return 'ausgeschieden';
}

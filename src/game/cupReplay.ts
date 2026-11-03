// =============================================================================
// Landespokal mit Wiederholungsspielen (Vorbild DFB-Pokal, data/euroFormats.ts
// `cupReplay`): Bis 1990/91 wird ein nach Verlängerung unentschiedenes Spiel beim
// bisherigen Gast wiederholt, erst die Wiederholung endet notfalls im Elfmeter-
// schießen; das Endspiel zuletzt 1976/77 (Final-Wiederholung 1977). Ab 1991/92
// Verlängerung und Elfmeterschießen im ersten Spiel.
// Jede Runde bekommt einen Wiederholungstermin (`CupRound.dates[1]`, eine Woche
// später, Finale zwei Tage später) nach dem Rahmenterminkalender (Abstände zur Liga). Alte Spielstände
// (ohne `CupState.v2`) spielen den laufenden Pokal wie bisher zu Ende.
// =============================================================================
import { cupReplay } from '../data/euroFormats';
import { MIN_GAP_DAYS, WANT_GAP_DAYS, calendarEra } from '../data/matchCalendarRules';
import { findCupSlot, findSlotTiered } from '../engine/fixtureRules';
import { CalendarEngine } from '../engine/calendar';
import { MatchEngine, type KoRule } from '../engine/match';
import { economyScale, yearOf } from '../engine/economy';
import { bookCupHomeMatch, bookCupPrize } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { makeMessage, pushMessage } from '../engine/messages';
import { drawRound, roundWinners } from '../engine/cup';
import type { CupState, CupTie, GameCalendar, Match } from '../types';
import type { CupLeg } from '../types/euro2';
import { cupNextDrawMessage, cupResultMessage } from './competitions';
import { hasScheduledDraw } from './cupDraw';
import { hashSeed, type Game } from './state';

const startYearOf = (cup: CupState) => Number(cup.season.slice(0, 4));
/** Keine Wiederholungsspiele über die Feiertage (21.12.–6.1.). */
const holiday = (d: string) => { const md = d.slice(5); return md >= '12-21' || md <= '01-06'; };

/**
 * Neuer Pokal (noch nichts gelost): Wiederholungstermine anlegen und Modus markieren.
 * Termin nach dem Rahmenterminkalender (engine/fixtureRules.ts): eine Woche später am
 * Pokal-Wochentag, mindestens drei (notfalls zwei) Tage Abstand zu Liga-Hauptspieltagen,
 * Europapokal-Wochen (`avoid`) und den anderen Pokalrunden; Finale zwei Tage später.
 */
export function enableCupReplays(cup: CupState, calendar: GameCalendar, avoid?: Set<string>, euroWeeks?: Set<string>): void {
  if (cup.v2 || cup.rounds.some((r) => r.drawn)) return;
  cup.v2 = 1;
  const y = startYearOf(cup);
  const busy = new Set(avoid ?? calendar.events.filter((e) => e.type === 'matchday').map((e) => e.date));
  for (const r of cup.rounds) busy.add(r.date);
  const era = calendarEra(y);
  cup.rounds.forEach((r, i) => {
    const isFinal = i === cup.rounds.length - 1;
    if (!cupReplay(y, isFinal)) { r.dates = [r.date]; return; }
    let pref = CalendarEngine.addDays(r.date, isFinal ? 2 : 7);
    // Nicht über die Feiertage: dann schon nach drei Tagen.
    const md = pref.slice(5);
    if (md >= '12-21' || md <= '01-06') pref = CalendarEngine.addDays(r.date, 3);
    const from = CalendarEngine.addDays(r.date, isFinal ? MIN_GAP_DAYS : WANT_GAP_DAYS);
    const league = [...busy].filter((x) => x !== r.date);
    let d = isFinal
      ? findSlotTiered({ preferred: pref, from, to: `${y + 1}-06-29`, maxShift: 10, busy: league }) // 30.6. = Saisonende
      : findCupSlot({ preferred: pref, from, maxShift: 10, skip: holiday }, era.cupDays, league, [...(euroWeeks ?? [])]);
    if (!d) { d = pref; while (busy.has(d)) d = CalendarEngine.addDays(d, 1); }
    busy.add(d);
    r.dates = [r.date, d];
    calendar.events.push({
      id: `cupev_${i}_1`, date: d, type: 'cup_matchday', title: `Landespokal: ${r.name} (Wiederholungsspiele)`,
      description: `Wiederholungsspiele ${r.name}, Landespokal ${cup.season} – nur bei Unentschieden nach Verlängerung.`,
      cupRoundIndex: i, leg: 1, processed: false, requiresAction: false,
    });
  });
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

/** K.-o.-Regel des ersten Spiels bzw. der Wiederholung. */
export function cupKoRule(cup: CupState, ri: number, replay: boolean): KoRule | undefined {
  if (replay || !cup.v2) return undefined;
  return cupReplay(startYearOf(cup), ri === cup.rounds.length - 1) && (cup.rounds[ri].dates?.length ?? 1) > 1
    ? { extraTime: true, shootout: false } : undefined;
}

function play(g: Game, cup: CupState, tie: CupTie, home: string, away: string, date: string, id: string, ko: KoRule | undefined) {
  const engine = new MatchEngine(g.clubs[home], g.clubs[away], g.players, g.pointSystem, {
    seed: hashSeed(`${cup.seed}:${id}`), date, competition: 'Pokal', logClubIds: [g.managedClubId],
    applyInjuries: g.injuriesEnabled, ko: ko ?? { extraTime: true, shootout: true },
  });
  const o = engine.simulateCup();
  const match: Match = {
    id, matchday: tie.round + 1, date, homeClubId: home, awayClubId: away, status: 'finished',
    result: o.result, events: o.events, involvesPlayerClub: tie.involvesPlayerClub,
  };
  const draw = !o.penalties && o.result.homeGoals === o.result.awayGoals;
  return { o, match, draw };
}

/** Spieltag eines Pokals mit Wiederholungsmodus. Rückgabe: Match-ID des eigenen Spiels. */
export function cupMatchdayV2(g: Game, ri: number, slot: number, today: string): string | null {
  const cup = g.cup;
  const round = cup?.rounds[ri];
  if (!cup || !round?.drawn) return null;
  const mid = g.managedClubId;
  const prize = cup.prizeByRound[ri];
  const scale = economyScale(yearOf(today));
  let own: string | null = null;
  for (const tie of round.ties) {
    if (tie.played) continue;
    const replay = slot === 1;
    if (replay && !tie.legs?.[1]) continue;
    if (!replay && tie.legs?.[0]?.played) continue;
    const home = replay ? tie.awayClubId : tie.homeClubId;
    const away = replay ? tie.homeClubId : tie.awayClubId;
    const date = replay ? tie.legs![1].date : tie.date;
    const id = replay ? `${tie.id}_w` : tie.id;
    const { o, match, draw } = play(g, cup, tie, home, away, date, id, cupKoRule(cup, ri, replay));
    if (g.clubs[home]) bookCupHomeMatch(g.clubs[home], o.result, date, home === mid, scale);
    const leg: CupLeg = {
      home, away, date, played: true, homeGoals: o.result.homeGoals, awayGoals: o.result.awayGoals,
      decision: o.decision, penalties: o.penalties, match,
    };
    if (!replay && draw) {
      // Unentschieden nach Verlängerung → Wiederholung beim Gast.
      tie.legs = [leg, { home: away, away: home, date: round.dates?.[1] ?? CalendarEngine.addDays(date, 7), played: false, homeGoals: null, awayGoals: null, decision: null, penalties: null, match: null }];
      tie.match = match;
      for (const id2 of [home, away]) if (g.clubs[id2]) applyMatchEffects(g.clubs[id2], g.players, 'D');
      if (tie.involvesPlayerClub) {
        own = match.id;
        const opp = g.clubs[home === mid ? away : home]?.name ?? '';
        pushMessage(g.messages, makeMessage({
          date, category: 'cup', from: 'Spielbericht Pokal', relatedId: match.id,
          subject: `Pokal: ${g.clubs[home]?.name} ${o.result.homeGoals}:${o.result.awayGoals} n.V. ${g.clubs[away]?.name}`,
          shortText: `Unentschieden – Wiederholungsspiel am ${CalendarEngine.formatDate(tie.legs[1].date)}.`,
          bodyText: `${round.name}, Landespokal ${cup.season}: Auch nach Verlängerung steht es ${o.result.homeGoals}:${o.result.awayGoals}.\n\n`
            + `Nach den Regeln dieser Zeit gibt es kein Elfmeterschießen: Das Spiel wird am ${CalendarEngine.formatDate(tie.legs[1].date)} wiederholt – mit getauschtem Heimrecht ${home === mid ? 'bei' : 'gegen'} ${opp}.`,
        }));
      }
      continue;
    }
    // Entschieden (erstes Spiel oder Wiederholung).
    const homeWins = o.penalties ? o.penalties.home > o.penalties.away : o.result.homeGoals > o.result.awayGoals;
    const winner = homeWins ? home : away;
    if (replay) tie.legs![1] = leg; else if (tie.legs) tie.legs[0] = leg;
    // Ergebnis in Richtung der Begegnung (Heim = zuerst gezogener Verein).
    const flip = home !== tie.homeClubId;
    tie.homeGoals = flip ? o.result.awayGoals : o.result.homeGoals;
    tie.awayGoals = flip ? o.result.homeGoals : o.result.awayGoals;
    tie.penalties = o.penalties ? (flip ? { home: o.penalties.away, away: o.penalties.home } : o.penalties) : null;
    tie.decision = o.decision;
    tie.match = match;
    tie.winnerClubId = winner;
    tie.played = true;
    if (g.clubs[winner]) bookCupPrize(g.clubs[winner], prize, round.name, date, winner === mid);
    applyMatchEffects(g.clubs[home], g.players, homeWins ? 'W' : 'L');
    applyMatchEffects(g.clubs[away], g.players, homeWins ? 'L' : 'W');
    if (tie.involvesPlayerClub) {
      own = match.id;
      pushMessage(g.messages, cupResultMessage(cup, g.clubs, mid, tie, ri, Math.round(prize * scale)));
    }
  }
  if (round.ties.every((t) => t.played)) {
    if (ri < cup.rounds.length - 1) {
      cup.currentRoundIndex = ri + 1;
      if (!hasScheduledDraw(cup, ri + 1) && !cup.rounds[ri + 1].drawn) {
        drawRound(cup, ri + 1, roundWinners(round), mid);
        pushMessage(g.messages, cupNextDrawMessage(cup, g.clubs, mid, ri + 1, today));
      }
    } else if (!cup.winnerClubId) {
      cup.winnerClubId = round.ties[0]?.winnerClubId ?? null;
      const w = cup.winnerClubId;
      if (w && w !== mid) {
        pushMessage(g.messages, makeMessage({
          date: today, category: 'cup', from: 'Landespokal-Kommission',
          subject: `Landespokalsieger ${cup.season}: ${g.clubs[w]?.name ?? ''}`,
          shortText: `${g.clubs[w]?.name ?? ''} gewinnt den Landespokal.`,
          bodyText: `Das Finale des Landespokals ${cup.season} ist entschieden. ${g.clubs[w]?.name ?? ''} sichert sich den Titel.`,
        }));
      }
    }
  }
  return own;
}

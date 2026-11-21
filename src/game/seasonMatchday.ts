// =============================================================================
// Spieltag der Spielerliga (volle Match-Engine, Form/Fitness, Heimspiel-Buchungen),
// Fortschreiben der simulierten Ligen und Spielbericht-Nachricht des eigenen Spiels.
// Teil von game/season.ts (dort weitergereicht).
// =============================================================================
import { isForeignId } from '../engine/world';
import { economyScale, yearOf } from '../engine/economy';
import { bookHomeMatch } from '../engine/finances';
import { SideResult, applyMatchEffects } from '../engine/form';
import { calculateTable } from '../engine/league';
import { advanceDivision } from '../engine/leagues';
import { MatchEngine } from '../engine/match';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club, Match } from '../types';
import { Game } from './state';

// -----------------------------------------------------------------------------
// Spieltag simulieren + Form/Fitness-Effekte + Nachrichten
// -----------------------------------------------------------------------------
export function simulateMatchday(game: Game, matchday: number, today?: string): void {
  // Mit `today`: nur die Spiele dieses Tages (Fr/Sa/So/Mo-Verteilung, verlegte Spiele und
  // Nachholspiele haben eigene Termine, game/fixtureWatch.ts).
  const dayMatches = game.fixtures.filter((m) => m.matchday === matchday && m.status === 'scheduled' && (!today || m.date <= today));
  for (const match of dayMatches) {
    const home = game.clubs[match.homeClubId];
    const away = game.clubs[match.awayClubId];
    const engine = new MatchEngine(home, away, game.players, game.pointSystem, {
      date: match.date, competition: 'Liga', logClubIds: [game.managedClubId], applyInjuries: game.injuriesEnabled,
    });
    const { result, events } = engine.simulate();
    match.result = result;
    match.events = events;
    match.status = 'finished';

    // Form & Fitness beider Mannschaften aktualisieren.
    const homeSide: SideResult = result.homeGoals > result.awayGoals ? 'W' : result.homeGoals < result.awayGoals ? 'L' : 'D';
    const awaySide: SideResult = homeSide === 'W' ? 'L' : homeSide === 'L' ? 'W' : 'D';
    applyMatchEffects(home, game.players, homeSide);
    applyMatchEffects(away, game.players, awaySide);

    // Finanz-Buchungen: Heimspiel-Einnahmen + Leistungsprämien beider Vereine.
    const mid = game.managedClubId;
    const mScale = economyScale(yearOf(match.date));
    bookHomeMatch(home, result, true, homeSide === 'W', homeSide === 'D', match.date, home.id === mid, mScale);
    bookHomeMatch(away, result, false, awaySide === 'W', awaySide === 'D', match.date, away.id === mid, mScale);
  }
  game.table = calculateTable(leagueClubs(game), game.fixtures, game.pointSystem, game.table.season, game.table);

  // Nicht-Spieler-Ligen performant per Stärke bis zu diesem Datum nachziehen.
  if (dayMatches[0]) advanceDivisionsTo(game, dayMatches[0].date);
}

/**
 * Simulierte Ligen nach ihrem eigenen Spielplan fortführen: alle Spieltage, deren
 * Termin erreicht ist (eigene Winterpause, englische Wochen; DDR im DDR-Rhythmus).
 * Täglich aus processDay (game/day.ts) und nach jedem eigenen Spieltag.
 */
export function advanceDivisionsTo(game: Game, date: string): void {
  if (!game.leagues) return;
  for (const div of game.leagues.otherDivisions) {
    for (let guard = 0; guard < 80; guard++) {
      const next = div.fixtures.find((m) => m.matchday === div.nextMatchday);
      if (!next || next.date > date) break;
      advanceDivision(div, game.simClubs, game.pointSystem, game.season);
    }
  }
}

/** Nur die 1. Liga-Vereine (ohne die Pokal-Amateurvereine mit Präfix "am"). */
export function leagueClubs(game: Game): Club[] {
  // Ohne Pokal-Amateure und ohne für den Europapokal materialisierte Auslandsvereine.
  return Object.values(game.clubs).filter((c) => !c.guest && !c.id.startsWith('am') && !isForeignId(c.id));
}

/** Erzeugt eine Spielbericht-Nachricht für das Spiel des Nutzers. */
export function emitMatchMessage(game: Game, m: Match): void {
  if (!m.result) return;
  const h = game.clubs[m.homeClubId]; const a = game.clubs[m.awayClubId];
  const myHome = m.homeClubId === game.managedClubId;
  const myGoals = myHome ? m.result.homeGoals : m.result.awayGoals;
  const oppGoals = myHome ? m.result.awayGoals : m.result.homeGoals;
  const outcome = myGoals > oppGoals ? 'Sieg' : myGoals < oppGoals ? 'Niederlage' : 'Unentschieden';
  const opp = myHome ? a : h;
  pushMessage(game.messages, makeMessage({
    date: m.date, category: 'match', from: 'Spielbericht',
    subject: `${m.matchday}. Spieltag: ${h.shortName} ${m.result.homeGoals}:${m.result.awayGoals} ${a.shortName}`,
    shortText: `${outcome} ${myGoals}:${oppGoals} gegen ${opp.shortName}.`,
    bodyText: `Am ${m.matchday}. Spieltag ${myHome ? `empfing ${h.name} ${a.name}` : `gastierte ${a.name} bei ${h.name}`}.\n\nEndstand: ${h.name} ${m.result.homeGoals}:${m.result.awayGoals} ${a.name} – ${outcome === 'Niederlage' ? 'eine' : 'ein'} ${outcome} aus deiner Sicht.\n\nBallbesitz: ${m.result.homePossession} % : ${100 - m.result.homePossession} %\nSchüsse: ${m.result.homeShots} : ${m.result.awayShots}\nZuschauer: ${m.result.attendance.toLocaleString('de-DE')}\n\nDen ausführlichen Spielbericht öffnest du über den Spielplan.`,
    relatedId: m.id,
  }));
}

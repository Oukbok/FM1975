// =============================================================================
// Tagesablauf, Teil 1: Kalender-Ereignisse des Tages (Liga-/Pokal-/Europapokal-
// Spieltage, Bewertungsrunden, Transferfenster, Saisonende) und die Vorschau des
// Trainerstabs eine Woche vor jeder Bewertungsrunde. Aufgerufen aus game/day.ts.
// =============================================================================
import { superCupMatchday } from './superCupGame';
import { snapshotAttributes } from '../engine/history';
import { EURO_COMP_NAMES } from '../data/europe';
import { staffEffectsOf } from './staffGame';
import { CalendarEngine } from '../engine/calendar';
import { drawRound, roundWinners, simulateCupTie } from '../engine/cup';
import { RatingResult, RatingType, runRatingCeremony, ratingTendencies } from '../engine/development';
import { economyScale, euroMoneyFactor, yearOf } from '../engine/economy';
import { drawEuroRound, simulateEuroTie } from '../engine/euro';
import { book, bookCupHomeMatch, bookCupPrize } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { dataScoutingBonus } from '../engine/infrastructure';
import { makeMessage, pushMessage } from '../engine/messages';
import { aiWindowClose } from './aiClubs';
import { cupNextDrawMessage, cupResultMessage, euroDrawMessage, euroResultMessage, euroWinnerChronicle } from './competitions';
import { emitMatchMessage, simulateMatchday } from './seasonMatchday';
import { Game } from './state';
import { ratingTicker, snapshotLeague } from './leagueBalance';
import { ensureDrawn, hasScheduledDraw } from './cupDraw';
import { cupMatchdayV2 } from './cupReplay';
import { euroMatchdayV2 } from './euroFlow';
import { isV2 } from './euroSetup';
import { ownCoaching } from './coachingGame';
import type { CalendarEvent, Club } from '../types';
import type { DayUi } from './dayUi';

/**
 * Verarbeitet die noch offenen Kalender-Ereignisse des Tages (in Kalender-Reihenfolge).
 * Rückgabe true = ein Ereignis verlangt eine Aktion (Vorlauf anhalten).
 */
export function processDayEvents(g: Game, ui: DayUi, todaysEvents: CalendarEvent[], today: string, myClub: Club): boolean {
  let stopForAction = false;
  for (const ev of todaysEvents) {
    ev.processed = true;
    switch (ev.type) {
      case 'matchday': {
        if (ev.matchId) {
          const match = g.fixtures.find((m) => m.id === ev.matchId);
          if (match && match.status === 'scheduled') {
            const md = match.matchday;
            const playerMatch = g.fixtures.find((m) => m.matchday === md && m.involvesPlayerClub && m.status === 'scheduled' && m.date <= today);
            simulateMatchday(g, md, today);
            if (playerMatch && playerMatch.result) {
              emitMatchMessage(g, playerMatch);
              ui.onOwnMatch(playerMatch.id); // Textmodus öffnen
              stopForAction = true;
            }
          }
        }
        break;
      }
      case 'rating_update': {
        const desc = ev.description;
        const type: RatingType = desc.includes('Große') ? 'large'
          : (desc.includes('Winter') || desc.includes('Jahreswechsel')) ? 'medium' : 'small';
        const fx = staffEffectsOf(g);
        const scoutQ = Math.min(1, 0.3 + (fx.scouting ?? 0) * 2 + dataScoutingBonus(myClub.infrastructure?.dataCenter ?? 1) * 2);
        // ALLE Spieler werden bewertet; gezeigt wird nur der eigene Kader.
        const leagueBefore = type !== 'small' ? snapshotLeague(g) : null;
        const results = runRatingCeremony(g.players, g.clubs, g.managedClubId, type, today, scoutQ,
          type === 'large' ? 'Große Saison-Bewertung' : type === 'medium' ? 'Winter-Bewertung' : 'Herbst-Bewertung');
        for (const pid of myClub.playerIds) {
          const p = g.players[pid];
          if (p) snapshotAttributes(p, today, `${type === 'large' ? 'Saisonbewertung' : type === 'medium' ? 'Winterbewertung' : 'Herbstbewertung'} ${g.season}`);
        }
        const label = type === 'large' ? 'Große Saison-Bewertung' : type === 'medium' ? 'Winter-Bewertung' : 'Herbst-Bewertung';
        {
          const rounds = g.ratingRounds ?? (g.ratingRounds = []);
          const delta = (r: RatingResult) => r.newOverall - r.oldOverall;
          rounds.push({ date: today, label, n: results.length, ups: results.filter((r) => delta(r) > 0).length,
            downs: results.filter((r) => delta(r) < 0).length, sum: results.reduce((a, r) => a + delta(r), 0) });
          if (rounds.length > 12) rounds.splice(0, rounds.length - 12);
        }
        ui.onRatingCeremony({ results, type: type === 'small' ? 'medium' : type, anlass: label });
        if (leagueBefore) ratingTicker(g, leagueBefore, label, today);
        const ups = results.filter((r) => r.change > 0).length;
        const downs = results.filter((r) => r.change < 0).length;
        const special = results.filter((r) => r.tag).map((r) => `• ${r.playerName}: ${r.tag} (${r.change > 0 ? '+' : ''}${r.change})`);
        pushMessage(g.messages, makeMessage({
          date: today, category: 'training', from: 'Trainerstab',
          subject: `${label}: ${ups} Aufwertungen, ${downs} Abwertungen`,
          shortText: special.length ? `${special.length} besondere Entwicklung(en) im Kader.` : 'Die Spielerwerte wurden neu bewertet.',
          bodyText: `Der Trainerstab hat die ${label} abgeschlossen.\n\n`
            + (special.length ? `Besonders:\n${special.join('\n')}\n\n` : '')
            + (type !== 'small' ? 'Die Scouts haben ihre Potenzial-Einschätzungen aktualisiert.\n\n' : '')
            + 'Details siehst du im Kader und im Spielerprofil (Reiter „Entwicklung“).',
        }));
        stopForAction = true;
        break;
      }
      case 'transfer_window_open':
        pushMessage(g.messages, makeMessage({
          date: today, category: 'transfer', from: 'Sportdirektor',
          subject: ev.title, shortText: 'Das Transferfenster ist geöffnet.',
          bodyText: `${ev.title}. Du kannst jetzt auf dem Transfermarkt aktiv werden und Spieler verpflichten oder abgeben.`,
        }));
        break;
      case 'transfer_window_close': {
        const tnews = aiWindowClose(g, today);
        pushMessage(g.messages, makeMessage({
          date: today, category: 'transfer', from: 'Sportdirektor',
          subject: ev.title,
          shortText: 'Das Transferfenster ist geschlossen.',
          bodyText: `${ev.title}.\n\nAktuelle Marktbewegungen:\n${tnews.slice(0, 6).map((n) => '• ' + n).join('\n') || '• Keine nennenswerten Transfers.'}`,
        }));
        break;
      }
      case 'season_end':
        pushMessage(g.messages, makeMessage({
          date: today, category: 'board', from: 'Vereinsvorstand',
          subject: 'Die Saison ist beendet!',
          shortText: 'Endstand und Saisonfazit.',
          bodyText: `Die Saison ${g.season} ist beendet. Den Endstand findest du in der Tabelle. Der Vorstand wird das Saisonziel auswerten.\n\nÜber den Button „Neue Saison“ oben rechts startest du die nächste Spielzeit – Spielplan, Landespokal und die fälligen Chronik-Meilensteine werden dann neu aufgesetzt.`,
        }));
        ui.onSeasonEnd();
        // Kein eigener Halt: am nächsten Tag (30.6.) ist die Saison vorbei und der Zeitlauf hält ohnehin.
        break;
      case 'cup_draw': break; // Ziehung unten (cupDrawsDaily)
      case 'super_cup': {
        // Supercup / Ligapokal / Europäischer Supercup (game/superCupGame.ts).
        const own = superCupMatchday(g, ev.matchId, today);
        if (own) { ui.onOwnMatch(own); stopForAction = true; }
        break;
      }
      case 'cup_matchday': {
        const cup = g.cup;
        const ri = ev.cupRoundIndex;
        if (ri != null) ensureDrawn(g, 'cup', ri, today);
        // Neuer Modus: Wiederholungsspiele nach historischer Regel (game/cupReplay.ts).
        if (isV2(cup) && ri != null) {
          const own = cupMatchdayV2(g, ri, ev.leg ?? 0, today);
          if (own) { ui.onOwnMatch(own); stopForAction = true; }
          break;
        }
        if (cup && ri != null && cup.rounds[ri] && cup.rounds[ri].drawn) {
          const round = cup.rounds[ri];
          const prize = cup.prizeByRound[ri];
          const mid = g.managedClubId;
          // Alle noch nicht gespielten Begegnungen der Runde simulieren.
          for (const tie of round.ties) {
            if (tie.played) continue;
            simulateCupTie(tie, g.clubs, g.players, g.pointSystem, cup.seed, {
              logClubIds: [g.managedClubId], applyInjuries: g.injuriesEnabled,
            });
            const home = g.clubs[tie.homeClubId];
            const away = g.clubs[tie.awayClubId];
            if (tie.match?.result) {
              // Heimspiel-Einnahmen des Ausrichters + Preisgeld des Siegers.
              bookCupHomeMatch(home, tie.match.result, tie.date, tie.homeClubId === mid, economyScale(yearOf(tie.date)));
              if (tie.winnerClubId) {
                bookCupPrize(g.clubs[tie.winnerClubId], prize, round.name, tie.date, tie.winnerClubId === mid);
              }
              // Form & Fitness beider Mannschaften (Pokal kennt kein Remis).
              const homeWon = tie.winnerClubId === tie.homeClubId;
              applyMatchEffects(home, g.players, homeWon ? 'W' : 'L');
              applyMatchEffects(away, g.players, homeWon ? 'L' : 'W');
            }
          }
          // Eigene Begegnung: Ergebnis-Nachricht + Textmodus zum Nachverfolgen.
          const myTie = round.ties.find((t) => t.involvesPlayerClub);
          if (myTie && myTie.match) {
            pushMessage(g.messages, cupResultMessage(cup, g.clubs, mid, myTie, ri, Math.round(prize * economyScale(yearOf(today)))));
            ui.onOwnMatch(myTie.match.id);
            stopForAction = true;
          }
          // Nächste Runde auslosen (bzw. Sieger küren) und Nachricht erzeugen.
          if (ri < cup.rounds.length - 1) {
            cup.currentRoundIndex = ri + 1;
            // Neues Verfahren: Ziehung am eigenen Termin (game/cupDraw.ts).
            if (!hasScheduledDraw(cup, ri + 1)) {
              drawRound(cup, ri + 1, roundWinners(round), mid);
              pushMessage(g.messages, cupNextDrawMessage(cup, g.clubs, mid, ri + 1, today));
            }
          } else {
            cup.winnerClubId = round.ties[0]?.winnerClubId ?? null;
            if (cup.winnerClubId && cup.winnerClubId !== mid) {
              pushMessage(g.messages, makeMessage({
                date: today, category: 'cup', from: 'Landespokal-Kommission',
                subject: `Landespokalsieger ${cup.season}: ${g.clubs[cup.winnerClubId]?.name ?? ''}`,
                shortText: `${g.clubs[cup.winnerClubId]?.name ?? ''} gewinnt den Landespokal.`,
                bodyText: `Das Finale des Landespokals ${cup.season} ist entschieden. ${g.clubs[cup.winnerClubId]?.name ?? ''} sichert sich den Titel.`,
              }));
            }
          }
        }
        break;
      }
      case 'euro_matchday': {
        const comp = ev.euroComp;
        const cup = comp ? g.euroCups?.[comp] : null;
        const ri = ev.cupRoundIndex;
        // Europapokal 2.0: Hin-/Rückspiel, Gruppen, Ligaphase (game/euroFlow.ts).
        if (comp && ri != null && isV2(cup)) {
          const own = euroMatchdayV2(g, comp, cup, ri, ev.leg ?? 0, today);
          if (own) { ui.onOwnMatch(own); stopForAction = true; }
          break;
        }
        if (comp && ri != null) ensureDrawn(g, comp, ri, today);
        if (comp && cup && ri != null && cup.rounds[ri] && cup.rounds[ri].drawn) {
          const round = cup.rounds[ri];
          const prize = cup.prizeByRound[ri];
          const mid = g.managedClubId;
          // Alle noch offenen Begegnungen der Runde simulieren.
          for (const tie of round.ties) {
            if (tie.played) continue;
            simulateEuroTie(g, cup, tie, cup.seed);
            // Finanz-/Formeffekte nur für materialisierte (volle) Vereine.
            if (tie.match?.result) {
              const home = g.clubs[tie.homeClubId];
              const away = g.clubs[tie.awayClubId];
              const homeWon = tie.winnerClubId === tie.homeClubId;
              if (home) {
                bookCupHomeMatch(home, tie.match.result, tie.date, tie.homeClubId === mid, economyScale(yearOf(tie.date)));
                applyMatchEffects(home, g.players, homeWon ? 'W' : 'L');
              }
              if (away) applyMatchEffects(away, g.players, homeWon ? 'L' : 'W');
            }
            // Preisgeld an den Sieger (nur falls voller Club vorhanden).
            if (tie.winnerClubId && g.clubs[tie.winnerClubId]) {
              book(
                g.clubs[tie.winnerClubId].finances, tie.date,
                Math.round(prize * economyScale(yearOf(tie.date)) * euroMoneyFactor(comp, yearOf(tie.date))), 'prize_money',
                `${EURO_COMP_NAMES[comp]} - Praemie (${round.name})`,
                tie.winnerClubId === mid,
              );
            }
          }
          // Eigene Begegnung: Ergebnis-Nachricht + Textmodus zum Nachverfolgen.
          const myTie = round.ties.find((t) => t.involvesPlayerClub);
          if (myTie && myTie.played) {
            pushMessage(g.messages, euroResultMessage(comp, cup, g.clubs, g.euroClubs ?? {}, mid, myTie, ri, Math.round(prize * economyScale(yearOf(today)) * euroMoneyFactor(comp, yearOf(today)))));
            if (myTie.match) { ui.onOwnMatch(myTie.match.id); stopForAction = true; }
          }
          // Nächste Runde auslosen (bzw. Sieger küren) und Nachricht erzeugen.
          if (ri < cup.rounds.length - 1) {
            cup.currentRoundIndex = ri + 1;
            if (!hasScheduledDraw(cup, ri + 1)) {
              drawEuroRound(cup, comp, ri + 1, roundWinners(round), mid);
              const dmsg = euroDrawMessage(comp, cup, g.clubs, g.euroClubs ?? {}, mid, ri + 1, today);
              if (dmsg) pushMessage(g.messages, dmsg);
            }
          } else {
            cup.winnerClubId = round.ties[0]?.winnerClubId ?? null;
            // Dezente Chronik-Notiz, sofern nicht der Spielerverein Sieger ist.
            if (cup.winnerClubId && cup.winnerClubId !== mid) {
              pushMessage(g.messages, euroWinnerChronicle(comp, cup, g.clubs, g.euroClubs ?? {}, today));
            }
          }
        }
        break;
      }
      default:
        pushMessage(g.messages, makeMessage({
          date: today, category: 'general', from: 'Verein',
          subject: ev.title, shortText: ev.description || ev.title,
          bodyText: ev.description || ev.title,
        }));
    }
  }
  return stopForAction;
}

/** VORSCHAU: eine Woche vor jeder Bewertungsrunde nennt der Trainerstab Tendenzen. */
export function ratingPreview(g: Game, today: string, myClub: Club): void {
  const inAWeek = CalendarEngine.addDays(today, 7);
  const upcoming = g.calendar.events.find((e) => e.type === 'rating_update' && e.date === inAWeek && !e.processed);
  if (upcoming) {
    const staffQ = Math.min(1, ownCoaching(g).strength / 25);
    const tips = ratingTendencies(myClub.playerIds.map((id) => g.players[id]).filter(Boolean), staffQ);
    if (tips.length) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'training', from: 'Co-Trainer',
        subject: `Tendenzen vor der ${upcoming.description}`,
        shortText: `${tips.length} Spieler mit deutlicher Tendenz.`,
        bodyText: `In einer Woche steht die ${upcoming.description} an. Mein Eindruck aus dem Training:\n\n`
          + tips.map((t) => `• ${t.player.fullName}: ${t.up ? 'macht große Fortschritte' : 'stagniert oder baut ab'}`).join('\n')
          + `\n\nOhne Gewähr – ganz sicher sind wir uns erst bei der Bewertung.`,
      }));
    }
  }
}

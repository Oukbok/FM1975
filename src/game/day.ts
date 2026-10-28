// =============================================================================
// Tagesablauf: verarbeitet genau EINEN Kalendertag (Spiele, Training, Finanzen,
// Jugend, Entwicklung …). Ohne Oberfläche – die Shell reagiert über `ui`.
// Rückgabe: true = Vorlauf darf weiterlaufen, false = anhalten (Aktion nötig).
// =============================================================================
import { setEraYear } from '../engine/positions';
import { snapshotAttributes } from '../engine/history';
import { ACTIVITY_DEFS, activityIncomeBase } from '../data/activities';
import { EURO_COMP_NAMES } from '../data/europe';
import { marketingIncomeBase, marketingMonthlyBase, marketingReputationNudge } from '../data/marketing';
import { staffMonthlyTotal } from '../data/staff';
import { monthlyEnvironmentUpdate } from './environmentGame';
import { spawnLegends } from './legendsGame';
import { autoResolveEvents, monthlyEvents } from './eventsGame';
import { setInjuryRiskHook } from '../engine/injuryRisk';
import { focusEffect } from '../engine/staffPeople';
import { applyFocusLoad, currentFocus, devContextFor, ensureStaff, monthlyTrainingReport, staffEffectsOf } from './staffGame';
import { coachingReport, memberMonthlySalary } from '../engine/staffPeople';
import { CalendarEngine } from '../engine/calendar';
import { drawRound, roundWinners, simulateCupTie } from '../engine/cup';
import { RatingResult, RatingType, runRatingCeremony, weeklyDevelopment, ratingTendencies, updateAges } from '../engine/development';
import { economyScale, euroMoneyFactor, yearOf } from '../engine/economy';
import { bookDebtInterest } from '../engine/clubEconomy';
import { drawEuroRound, simulateEuroTie } from '../engine/euro';
import { book, bookCupHomeMatch, bookCupPrize, bookMonthly } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { dataScoutingBonus, medicalRecoveryBonus, medicalRehabBonus, nlzGrowthBonus, rehaRecoveryBonus, rehaRehabBonus } from '../engine/infrastructure';
import { makeMessage, pushMessage } from '../engine/messages';
import { dailyRecovery } from '../engine/training';
import { runAITransfers, setTransferDate } from '../engine/transfers';
import { applyDailyTraining } from '../engine/weeklyTraining';
import { applyYouthGem, GEM_CHANCE_YOUTH, maybeMakeGem } from '../engine/gems';
import { academyIntake, ageYouthPlayers, developYouthWeekly, graduateYouth } from '../engine/youth';
import { cupNextDrawMessage, cupResultMessage, euroDrawMessage, euroResultMessage, euroWinnerChronicle } from './competitions';
import { emitMatchMessage, simulateMatchday, startNextSeason } from './season';
import { OwnMatchInfo, findOwnMatchDue, isPrepared } from './ownMatch';
import { Game, bumpMorale } from './state';
import { contractReminders, handleContractExpiry } from './contracts';
import { monthlySquadHarmony, rollAiOffers } from './aiOffers';
import { applyEuphoria, monthlyClubEvents } from './clubEventsGame';
import { announceUpcomingRules } from './ruleNotice';
import { applyLeagueBalance, ratingTicker, seasonLeagueBalance, snapshotLeague } from './leagueBalance';
import { monthlyClubBusiness } from './clubBusiness';
import { PlayerDevReveal } from '../types';
import { fmtDM, fmtDMfull, fmtDateFull, setDisplayYear } from '../ui/format';
import { RatingResult as _RatingResult } from '../engine/development';

export interface DayUi {
  /** Eigenes Spiel wurde gespielt → Spielbericht/Textmodus öffnen. */
  onOwnMatch(matchId: string): void;
  /** Große Bewertungsrunde → Zeremonie zeigen. */
  onRatingCeremony(c: { results: _RatingResult[]; type: 'medium' | 'large'; anlass: string }): void;
  /** Saisonende erreicht (z. B. Autospeichern). */
  onSeasonEnd(): void;
  /**
   * Eigenes Spiel steht heute an und ist noch nicht gespielt → anhalten und
   * „Schnell simulieren“ / „Textmodus“ anbieten. Fehlt der Rückruf (Simulation),
   * wird das Spiel wie jedes andere im Spieltag simuliert.
   */
  onOwnMatchDue?(info: OwnMatchInfo): void;
}

/** Oberfläche ohne Reaktion – für Simulationen und Tests. */
export const HEADLESS_UI: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {} };

export function processDay(g: Game, ui: DayUi): boolean {
  const myClub = g.clubs[g.managedClubId];

  const cal = g.calendar;
  // Wurde der Vorlauf zuletzt für eine Aktion angehalten (z.B. AM Spieltag),
  // blieb das Datum stehen. Der fällige Tageswechsel wird jetzt – beim
  // Fortsetzen – nachgeholt, BEVOR der neue Tag verarbeitet wird. So bleibt
  // jeder Tag genau einmal dran und die Pause landet auf dem richtigen Tag.
  if (cal.pendingAdvance) {
    cal.pendingAdvance = false;
    cal.currentDate = CalendarEngine.nextDay(cal.currentDate);
    // Diesen Tick hier beenden: der nachgeholte Tag wird jetzt nur angezeigt
    // und erst im naechsten Tick verarbeitet. So schaltet der Kalender beim
    // Fortsetzen genau EINEN Tag weiter (kein Doppelsprung) und kein Tag wird
    // doppelt verarbeitet.
    if (CalendarEngine.isSeasonOver(cal)) { return false; }
    return true;
  }
  if (CalendarEngine.isSeasonOver(cal)) { return false; }

  const today = cal.currentDate;
  // Verletzungsrisiko im Spiel: medizinisches Personal und Trainingsphilosophie (nur eigener Verein).
  {
    const red = staffEffectsOf(g).injuryReduction;
    const focus = currentFocus(g, today);
    setInjuryRiskHook((p) => (p.clubId === g.managedClubId ? (1 - red) * focusEffect(focus, p).injury : 1));
    applyLeagueBalance(g);
    applyEuphoria(g);
  }
  setDisplayYear(yearOf(today));
  setEraYear(yearOf(today));
  if (ui.onOwnMatchDue) {
    const due = findOwnMatchDue(g);
    if (due && !isPrepared(due)) { ui.onOwnMatchDue(due); return false; }
  }
  setTransferDate(today);
  const todaysEvents = CalendarEngine.eventsOn(cal, today).filter((e) => !e.processed);
  let stopForAction = false;

  for (const ev of todaysEvents) {
    ev.processed = true;
    switch (ev.type) {
      case 'matchday': {
        if (ev.matchId) {
          const match = g.fixtures.find((m) => m.id === ev.matchId);
          if (match && match.status === 'scheduled') {
            const md = match.matchday;
            const playerMatch = g.fixtures.find((m) => m.matchday === md && m.involvesPlayerClub);
            simulateMatchday(g, md);
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
        const results = runRatingCeremony(g.players, g.clubs, g.managedClubId, type, today, scoutQ);
        for (const pid of myClub.playerIds) {
          const p = g.players[pid];
          if (p) snapshotAttributes(p, today, `${type === 'large' ? 'Saisonbewertung' : type === 'medium' ? 'Winterbewertung' : 'Herbstbewertung'} ${g.season}`);
        }
        const label = type === 'large' ? 'Große Saison-Bewertung' : type === 'medium' ? 'Winter-Bewertung' : 'Herbst-Bewertung';
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
        const tnews = runAITransfers(g.clubs, g.players, g.managedClubId);
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
        stopForAction = true;
        break;
      case 'cup_matchday': {
        const cup = g.cup;
        const ri = ev.cupRoundIndex;
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
            const winners = roundWinners(round);
            drawRound(cup, ri + 1, winners, mid);
            cup.currentRoundIndex = ri + 1;
            pushMessage(g.messages, cupNextDrawMessage(cup, g.clubs, mid, ri + 1, today));
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
            const winners = roundWinners(round);
            drawEuroRound(cup, comp, ri + 1, winners, mid);
            cup.currentRoundIndex = ri + 1;
            const dmsg = euroDrawMessage(comp, cup, g.clubs, g.euroClubs ?? {}, mid, ri + 1, today);
            if (dmsg) pushMessage(g.messages, dmsg);
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

  // -------------------------------------------------------------------------
  // VORSCHAU: eine Woche vor jeder Bewertungsrunde nennt der Trainerstab Tendenzen.
  // -------------------------------------------------------------------------
  {
    const inAWeek = CalendarEngine.addDays(today, 7);
    const upcoming = g.calendar.events.find((e) => e.type === 'rating_update' && e.date === inAWeek && !e.processed);
    if (upcoming) {
      const staffQ = Math.min(1, coachingReport(ensureStaff(g), myClub.playerIds.length, yearOf(today)).strength / 25);
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

  // -------------------------------------------------------------------------
  // TRAINING & REGENERATION
  // -------------------------------------------------------------------------
  const userIds = new Set(myClub.playerIds);
  // Wochentag als Plan-Index (0=Mo … 6=So), UTC-basiert.
  const utcDay = new Date(today + 'T00:00:00Z').getUTCDay(); // 0=So … 6=Sa
  const planIdx = (utcDay + 6) % 7;
  // War heute ein Pflichtspiel des Manager-Vereins? Dann kein Training.
  const isMyMatchDay = todaysEvents.some(
    (ev) => ev.type === 'matchday' && (() => {
      const m = g.fixtures.find((x) => x.id === ev.matchId);
      return !!m && m.involvesPlayerClub;
    })(),
  );

  if (!isMyMatchDay) {
    // Manager-Verein trainiert gemäß Wochenplan (füllt den Entwicklungs-Akku).
    applyDailyTraining(myClub, g.players, g.trainingPlan.days[planIdx], false);
    applyFocusLoad(g, myClub, today, staffEffectsOf(g).injuryReduction);
    // Übrige Liga regeneriert normal; Manager-Verein ist über das Training abgedeckt.
    dailyRecovery(g.players, userIds);
  } else {
    // An Spieltagen regenerieren alle normal (Startelf hat Match-Ermüdung).
    dailyRecovery(g.players);
  }
  updateAges(g.players, today);

  // -------------------------------------------------------------------------
  // MEDIZINISCHE ABTEILUNG: zusätzliche Regeneration + schnellere Reha für den
  // Manager-Verein (Effekt der Infrastruktur, real & beobachtbar).
  // -------------------------------------------------------------------------
  {
    const medLvl = myClub.infrastructure?.medical ?? 1;
    const rehaLvl = myClub.infrastructure?.rehaCenter ?? 1;
    // Mitarbeiter-Effekte (Block p11): Reha-Verkürzung (Anteil) + Regeneration (Punkte).
    const staffFx = staffEffectsOf(g);
    // Tägliche Regeneration: Medizin + Reha-Zentrum + medizinisches Personal.
    const recoverBonus = medicalRecoveryBonus(medLvl) + rehaRecoveryBonus(rehaLvl) + (staffFx.recovery ?? 0);
    // Reha-Tage pro Tag: Gebäude (ganze Tage) + Personal-Anteil (auf Reha-Downtime).
    const rehabBonus = medicalRehabBonus(medLvl) + rehaRehabBonus(rehaLvl)
      + (staffFx.rehabReduction > 0 ? 1 : 0);
    if (recoverBonus > 0 || rehabBonus > 0) {
      for (const pid of myClub.playerIds) {
        const p = g.players[pid];
        if (!p) continue;
        if (recoverBonus > 0 && p.attributes.fitness < 100) {
          p.attributes.fitness = Math.min(100, p.attributes.fitness + recoverBonus);
        }
        if (rehabBonus > 0 && p.injury && p.injury.daysRemaining > 0) {
          p.injury.daysRemaining = Math.max(0, p.injury.daysRemaining - rehabBonus);
          if (p.injury.daysRemaining <= 0) {
            p.injury = null;
            p.availability = 'available';
            p.attributes.fitness = Math.max(p.attributes.fitness, 70);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // JÄHRLICHER NACHWUCHS-JAHRGANG: zum 1. Juli neue Talente in allen Akademien.
  // -------------------------------------------------------------------------
  {
    const utcMon = new Date(today + 'T00:00:00Z').getUTCMonth() + 1; // 1–12
    const domNow = new Date(today + 'T00:00:00Z').getUTCDate();
    const yearNow = new Date(today + 'T00:00:00Z').getUTCFullYear();
    if (utcMon === 7 && domNow === 1) {
      // Fiktive Legenden des Jahrgangs tauchen in einer Akademie auf (data/legends.ts).
      // Liga-Gleichgewicht vor dem neuen Nachwuchs-Jahrgang nachführen.
      seasonLeagueBalance(g);
      spawnLegends(g, today);
      // Vertragsende: Wechsel (vor Bosman gegen Ablöse) oder Verlängerung (game/contracts.ts).
      handleContractExpiry(g, today);
      for (const club of Object.values(g.clubs)) {
        if ((club.infrastructure.lastYouthIntakeYear ?? 0) >= yearNow) continue;
        club.infrastructure.lastYouthIntakeYear = yearNow;
        const isMine = club.id === g.managedClubId;

        // 1) Alle Talente rücken einen Jahrgang auf (Alter +1, Altersklasse steigt).
        ageYouthPlayers(club, g.youthPlayers);
        // Verborgene Juwelen der Jugend: mit 18/19 platzt der Knoten.
        for (const yid of club.youthPlayerIds) {
          const yp = g.youthPlayers[yid];
          if (yp && applyYouthGem(yp) && isMine) {
            pushMessage(g.messages, makeMessage({
              date: today, category: 'training', from: 'Leiter Jugendakademie',
              subject: `${yp.fullName} macht einen gewaltigen Sprung`,
              shortText: 'Ein Talent, das wir unterschätzt haben?',
              bodyText: `Bei ${yp.fullName} (${yp.naturalPosition}, ${yp.age}) ist im Sommer der Knoten geplatzt. Im Training zeigt er Dinge, die wir ihm nicht zugetraut hätten. Unsere Scouts werden ihre Einschätzung nach oben korrigieren.`,
            }));
          }
        }
        // 2) Jahrgangsabschluss: A-Jugend (nun ≥20) verlässt die Akademie –
        //    die Besten werden hochgezogen, der Rest verlässt den Verein.
        const grad = graduateYouth(club, g.players, g.youthPlayers, isMine);
        // 3) Neuer jüngster Jahrgang (G-Jugend/Bambini, 7 Jahre) rückt nach.
        const cohort = academyIntake(club, today, `${yearNow}`);
        for (const yp of cohort) maybeMakeGem(yp, GEM_CHANCE_YOUTH);
        for (const yp of cohort) {
          g.youthPlayers[yp.id] = yp;
          club.youthPlayerIds.push(yp.id);
        }

        if (isMine) {
          if (cohort.length > 0) {
            pushMessage(g.messages, makeMessage({
              date: today, category: 'training', from: 'Leiter Jugendakademie',
              subject: 'Neuer G-Jugend-Jahrgang (Bambini) in der Jugendakademie',
              shortText: `${cohort.length} neue(s) Talent(e) (G-Jugend/Bambini, 7 Jahre) sind eingetroffen.`,
              bodyText: `Unsere Jugendakademie (Stufe ${club.infrastructure.youthAcademy}) hat einen neuen G-Jugend-Jahrgang (Bambini) aufgenommen: `
                + `${cohort.length} Nachwuchsspieler im Alter von 7 Jahren.\n\n`
                + cohort.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`).join('\n')
                + `\n\nSo junge Talente lassen sich kaum einschätzen – unsere Scouts geben eine sehr breite Potenzial-Spanne an, die sich über die Jahre präzisiert. Schau im Bereich „Jugend“ vorbei.`,
            }));
          }
          if (grad.promoted.length > 0 || grad.released.length > 0) {
            const lines: string[] = [];
            if (grad.promoted.length > 0) {
              lines.push('In den Profikader hochgezogen:');
              lines.push(...grad.promoted.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
            }
            if (grad.released.length > 0) {
              if (lines.length > 0) lines.push('');
              lines.push('Haben den Verein verlassen (kein Vertrag):');
              lines.push(...grad.released.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
            }
            pushMessage(g.messages, makeMessage({
              date: today, category: 'training', from: 'Leiter Jugendakademie',
              subject: 'Jahrgangsabschluss der A-Jugend',
              shortText: `${grad.promoted.length} hochgezogen, ${grad.released.length} abgegeben.`,
              bodyText: `Die A-Jugend hat den Jahrgang abgeschlossen. `
                + `Die vielversprechendsten Talente wurden in den Profikader übernommen, die übrigen verlassen den Verein.\n\n`
                + lines.join('\n'),
            }));
          }
          if (cohort.length > 0 || grad.promoted.length > 0 || grad.released.length > 0) {
            stopForAction = true;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // MONATSABSCHLUSS: am 1. eines Monats Gehälter, Fixkosten, Sponsoring buchen.
  // -------------------------------------------------------------------------
  const utcDom = new Date(today + 'T00:00:00Z').getUTCDate();
  const curMonth = today.slice(0, 7);
  autoResolveEvents(g, today);
  contractReminders(g, today);
  announceUpcomingRules(g, today);
  rollAiOffers(g, today);
  if (utcDom === 1) {
    monthlyTrainingReport(g, today);
    monthlySquadHarmony(g, today);
    monthlyEnvironmentUpdate(g, today);
    monthlyEvents(g, today);
    monthlyClubEvents(g, today);
    // Kreditraten, Stadion-Bauprojekte, Namensrechte (game/clubBusiness.ts).
    monthlyClubBusiness(g, today);
    for (const club of Object.values(g.clubs)) {
      if (club.finances.lastMonthlyBooking === curMonth) continue;
      const isMine = club.id === g.managedClubId;
      const m = bookMonthly(club, g.players, today, g.table, isMine, economyScale(yearOf(today)));
      bookDebtInterest(club, today, isMine);
      if (isMine) {
        const net = m.net;
        pushMessage(g.messages, makeMessage({
          date: today, category: 'board', from: 'Finanzabteilung',
          subject: `Monatsabschluss – Kontostand ${fmtDM(club.finances.balance)}`,
          shortText: `${net >= 0 ? 'Überschuss' : 'Fehlbetrag'}: ${fmtDM(Math.abs(net))} im Monat.`,
          bodyText: `Der Monatsabschluss wurde gebucht.\n\n`
            + `Trikotsponsoring: +${fmtDM(m.sponsorship)}\n`
            + `Bandenwerbung: +${fmtDM(m.advertising)}\n`
            + (m.tv > 0 ? `TV-Gelder: +${fmtDM(m.tv)}\n` : '')
            + `Mitgliedsbeitraege: +${fmtDM(m.membership)}\n`
            + (m.cateringLease > 0 ? `Catering-Pacht: +${fmtDM(m.cateringLease)}\n` : '')
            + (m.placementBonus > 0 ? `Platzierungsbonus: +${fmtDM(m.placementBonus)}\n` : '')
            + `Spielergehälter: -${fmtDM(m.wages)}\n`
            + `Betreuerstab: -${fmtDM(m.staffWages)}\n`
            + `Stadionunterhalt: -${fmtDM(m.stadiumMaintenance)}\n`
            + `Gebäude-Fixkosten: -${fmtDM(m.facilities)}\n`
            + `Sonstige Kosten: -${fmtDM(m.otherFixed)}\n\n`
            + `Monatssaldo: ${net >= 0 ? '+' : '-'}${fmtDM(Math.abs(net))}\n`
            + `Neuer Kontostand: ${fmtDM(club.finances.balance)}\n\n`
            + `Details findest du im Bereich Finanzen.`,
        }));
        if (club.finances.balance < 0) {
          pushMessage(g.messages, makeMessage({
            date: today, category: 'board', from: 'Vereinsvorstand',
            subject: 'Konto im Minus!',
            shortText: 'Der Verein steckt in den roten Zahlen.',
            bodyText: `Achtung: Das Vereinskonto ist mit ${fmtDM(club.finances.balance)} im Minus. `
              + `Der Vorstand erwartet, dass du die Ausgaben (v. a. Gehälter) senkst oder über Transfers/Erfolg neue Einnahmen generierst.`,
            actionRequired: true,
          }));
        }
      }
    }
    // -----------------------------------------------------------------------
    // BLOCK p11 — Monatliche Buchung von Mitarbeitergehältern & Marketing
    // (nur Manager-Verein). Gehälter/Kosten skalieren mit der Wirtschaftslage.
    // -----------------------------------------------------------------------
    {
      const scale = economyScale(yearOf(today));
      const mine = g.clubs[g.managedClubId];
      // 1) Mitarbeitergehälter → Ausgabe-Kategorie 'staff_wages'.
      const staffCost = g.staff
        ? g.staff.reduce((a, m) => a + memberMonthlySalary(m, scale), 0)
        : staffMonthlyTotal(g.hiredStaff ?? [], scale);
      if (staffCost > 0 && mine) {
        book(mine.finances, today, -staffCost, 'staff_wages', 'Gehälter Mitarbeiterstab (Monat)', true);
      }
      // 2) Marketing-Ausgaben (linear) → 'other'; kleine Zusatzerlöse → merch/sponsor.
      const mkt = g.marketing ?? {};
      const mktCost = Math.round(marketingMonthlyBase(mkt) * scale);
      if (mktCost > 0 && mine) {
        book(mine.finances, today, -mktCost, 'other', 'Marketing & Werbung (Monat)', true);
        const inc = marketingIncomeBase(mkt);
        const merch = Math.round(inc.merch * scale);
        const sponsor = Math.round(inc.sponsor * scale);
        if (merch > 0) book(mine.finances, today, merch, 'merchandise', 'Merchandising aus Marketing (Monat)', true);
        if (sponsor > 0) book(mine.finances, today, sponsor, 'sponsorship', 'Sponsoring aus Marketing (Monat)', true);
        // Sehr kleiner Reputations-Impuls (max +0,05/Monat).
        const rep = marketingReputationNudge(mkt);
        if (rep > 0 && typeof mine.reputation === 'number') {
          mine.reputation = Math.min(100, mine.reputation + rep);
        }
      }
    }
    stopForAction = true;
  }

  // -------------------------------------------------------------------------
  // WOCHEN-ENTWICKLUNG: sonntags Auswertung des versteckten Entwicklungs-Akkus
  // -------------------------------------------------------------------------
  if (utcDay === 0) {
    // Wochen-Entwicklung läuft still im Hintergrund: die Spielerwerte werden
    // direkt verändert (runWeeklyDevelopment mutiert die Attribute/OVR), aber
    // es erscheint KEIN Popup und der Lauf pausiert nicht mehr. Eine Meldung
    // gibt es nur noch bei den großen Auf-/Abwertungsrunden (rating_update).
    weeklyDevelopment(g.players, g.clubs, yearOf(today), devContextFor(g, today));
    // Jugendentwicklung aller Vereine (Talente wachsen; Scouting präzisiert sich).
    // Manager-Verein erhält Boni aus Mitarbeitern (Scouting) und Zukunfts-Bauten
    // (NLZ → Wachstum, Datenanalyse-Zentrum → Scouting) — Block p11.
    const myStaffFx = staffEffectsOf(g);
    const myInfra = g.clubs[g.managedClubId]?.infrastructure;
    const myGrowthBonus = nlzGrowthBonus(myInfra?.nlz ?? 1);
    const myScoutBonus = (myStaffFx.scouting ?? 0) + dataScoutingBonus(myInfra?.dataCenter ?? 1);
    for (const club of Object.values(g.clubs)) {
      if (club.id === g.managedClubId) {
        developYouthWeekly(club, g.youthPlayers, { growthBonus: myGrowthBonus, scoutBonus: myScoutBonus });
      } else {
        developYouthWeekly(club, g.youthPlayers);
      }
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK p11 — Geplante Aktivitäten: Effekt anwenden, sobald das Enddatum
  // erreicht ist (Fitness/Form/Moral auf den Kader; Freundschaftsspiel-Erlös).
  // Kosten wurden bereits bei der Planung gebucht.
  // -------------------------------------------------------------------------
  if (Array.isArray(g.activities) && g.activities.length > 0) {
    const mine = g.clubs[g.managedClubId];
    for (const act of g.activities) {
      if (act.applied || act.endDate > today) continue;
      act.applied = true;
      const def = ACTIVITY_DEFS[act.type];
      if (mine) {
        for (const pid of mine.playerIds) {
          const p = g.players[pid];
          if (!p) continue;
          if (def.fitness) p.attributes.fitness = Math.min(100, (p.attributes.fitness ?? 0) + def.fitness);
          if (def.form) p.form = Math.max(0, Math.min(100, (p.form ?? 50) + def.form));
          if (def.morale) p.morale = bumpMorale(p.morale, def.morale);
        }
        // Freundschaftsspiel: kleiner Erlös (ära-gerecht skaliert).
        const incBase = activityIncomeBase(act.type);
        if (incBase > 0) {
          const inc = Math.round(incBase * economyScale(yearOf(today)));
          book(mine.finances, today, inc, 'other', `Einnahmen ${def.name}`, true);
        }
      }
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Trainerstab',
        subject: `${def.icon} ${act.label} abgeschlossen`,
        shortText: `${def.name} beendet – die Mannschaft profitiert.`,
        bodyText: `Die geplante Aktivität „${act.label}" (${def.name}) ist abgeschlossen.\n\n`
          + (def.fitness ? `Fitness: +${def.fitness}\n` : '')
          + (def.form ? `Form: +${def.form}\n` : '')
          + (def.morale ? `Moral: verbessert\n` : '')
          + (activityIncomeBase(act.type) > 0 ? `Erlös: +${fmtDM(Math.round(activityIncomeBase(act.type) * economyScale(yearOf(today))))}\n` : '')
          + `\nDie Effekte wirken sofort auf den Kader.`,
      }));
    }
  }

  if (stopForAction) {
    // Auf dem heutigen Datum stehen bleiben (z.B. AM Spieltag), damit die
    // Zentrale den korrekten Tag zeigt. Der Tageswechsel wird beim Fortsetzen
    // des Vorlaufs nachgeholt (siehe Anfang von processDay).
    cal.pendingAdvance = true;
    return false;
  }
  cal.currentDate = CalendarEngine.nextDay(today);
  return true;
}

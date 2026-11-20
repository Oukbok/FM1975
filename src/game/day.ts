// =============================================================================
// Tagesablauf: verarbeitet genau EINEN Kalendertag (Spiele, Training, Finanzen,
// Jugend, Entwicklung …). Ohne Oberfläche – die Shell reagiert über `ui`.
// Rückgabe: true = Vorlauf darf weiterlaufen, false = anhalten (Aktion nötig).
// =============================================================================
import { bindMarketing, marketingMonthly } from './marketingGame';
import { privateDaily } from './private/privateGame';
import { fixtureWatchDaily } from './fixtureWatch';
import { weekdayIdx } from '../engine/trainingPlan';
import { setEraYear } from '../engine/positions';
import { monthlyEnvironmentUpdate } from './environmentGame';
import { autoResolveEvents, monthlyEvents } from './eventsGame';
import { setInjuryRiskHook } from '../engine/injuryRisk';
import { focusEffect } from '../engine/staffPeople';
import { applyFocusLoad, currentFocus, devContextFor, monthlyTrainingReport, staffEffectsOf } from './staffGame';
import { CalendarEngine } from '../engine/calendar';
import { weeklyDevelopment, updateAges } from '../engine/development';
import { setCurrencyDate, yearOf } from '../engine/economy';
import { dataScoutingBonus, medicalRecoveryBonus, medicalRehabBonus, rehaRecoveryBonus, rehaRehabBonus } from '../engine/infrastructure';
import { dailyRecovery } from '../engine/training';
import { setTransferDate } from '../engine/transfers';
import { aiClubsDaily } from './aiClubs';
import { aiContractsDaily } from './aiContracts';
import { careerDaily } from './careerGame';
import { aiLoansDaily } from './aiLoans';
import { loanLifeDaily } from './loanLife';
import { loanMarketDaily } from './loanMarket';
import { loanTalksDaily } from './loanTalks';
import { bindTransferLog, transferWindowDue } from './transferLog';
import { youthCompsDaily } from './youthComps/daily';
import { ownTrainingDay } from './trainingWeek';
import { legendsDaily } from './legendsGame';
import { developYouthWeekly } from '../engine/youth';
import { advanceDivisionsTo } from './season';
import { inWinterBreak, winterBreakDaily } from './winterShared';
import { findOwnMatchDue, isPrepared } from './ownMatch';
import { Game, homeCountryOf } from './state';
import { contractReminders, transferPlayer } from './contracts';
import { monthlySquadHarmony, rollAiOffers } from './aiOffers';
import { checkPromises } from './promises';
import { seasonPromisesDaily, seasonPromisesFitness } from './seasonPromisesGame';
import { transferTalkDaily } from './transferTalks';
import { scoutingDaily } from './scoutingGame';
import { softwareMonthly } from './scoutSoftware';
import { abroadDaily } from './scoutAbroad';
import { youthCampsDaily } from './youthCamps';
import { ensureWorldPool, worldPoolWinter } from './worldPool';
import { worldLiveDaily } from './worldLeagues';
import { cohesionDaily } from './cohesionGame';
import { buyBackDaily, contractClausesDaily } from './playerWishesGame';
import { contractBonusesDaily, contractSeasonEndDaily } from './contractClausesGame';
import { assignShirtNumbers, repairSquadLists } from './squads';
import { shirtSeasonOf } from '../engine/shirtNumbers';
import { applyEuphoria, monthlyClubEvents } from './clubEventsGame';
import { announceUpcomingRules } from './ruleNotice';
import { monthlyYouthRecruit } from './youthRecruit';
import { monthlyYouthInvest, withReserve } from './youthInvest';
import { stadiumDaily } from './stadiumGame';
import { ticketsDaily } from './ticketsGame';
import { ensureYouthTeams } from './youthTeams';
import { applyLeagueBalance } from './leagueBalance';
import { monthlyClubBusiness } from './clubBusiness';
import { indoorDaily } from './indoorGame';
import { campDaily } from './trainingCampGame';
import { groundsDaily } from './groundsGame';
import { merchDaily } from './merchGame';
import { cupDrawsDaily } from './cupDraw';
import { monthlySponsoring } from './sponsorGame';
import { monthlyPositions, ownPositionTraining } from './positionsGame';
import { applyScheduledTemplate } from './trainingSeason';
import { aiDressingRoomsWeekly, dressingRoomDaily } from './dressingRoomGame';
import { dressingRoomIncidents } from './dressingRoomEvents';
import { setDisplayYear } from '../ui/format';
import { awardsDaily } from './seasonAwardsGame';
import { goldenBallDaily } from './goldenBallGame';
import { recordProfileWeek } from './profileWeeks';
import { recordMonthlyOv } from './ovHistory';
import { standNamesMonthly } from './standNames';
import { bindRegistration, registrationDaily } from './registrationGame';
import { reserveDaily } from './reserveTeam';
import { amateurLeaguesDaily } from './amateurLeagues';
import { nationalDaily } from './national/nationalGame';
import { bindHonours } from './clubHonours';
import { bindGameIds } from './resetModuleState';
import { bindStaffFactor } from './staffGame';
import { bindCoaching } from './coachingGame';
import type { DayUi } from './dayUi';
import { processDayEvents, ratingPreview } from './dayEvents';
import { youthIntakeDaily } from './dayYouthIntake';
import { finishActivities, monthlyFinanceClose } from './dayFinance';

export type { DayUi } from './dayUi';
export { HEADLESS_UI } from './dayUi';

export function processDay(g: Game, ui: DayUi): boolean {
  bindGameIds(g); // IDs aus diesem Spielstand (engine/idSeq.ts)
  bindHonours(g); // Wirkungen der Vereinsauszeichnungen (nur bei neuem Spielstand neu)
  bindMarketing(g); // Werbewirkung des eigenen Vereins (game/marketingGame.ts)
  bindStaffFactor(g); // Stab → Spielstärke des eigenen Vereins (game/staffGame.ts)
  bindCoaching(g); // Niveau der Trainerteams → Entwicklung (game/coachingGame.ts)
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
  bindTransferLog(g); // Transferprotokoll: jeder Wechsel des Tages landet im Fenster
  // Verletzungsrisiko im Spiel: medizinisches Personal und Trainingsphilosophie (nur eigener Verein).
  {
    const red = staffEffectsOf(g).injuryReduction;
    const focus = currentFocus(g, today);
    setInjuryRiskHook((p) => (p.clubId === g.managedClubId ? (1 - red) * focusEffect(focus, p).injury : 1));
    applyLeagueBalance(g);
    ensureYouthTeams(g, today);
    stadiumDaily(g, today);
    ticketsDaily(g); // Kartenverkauf: Prognose-Schärfe, Topzuschlag-Gegner
    applyEuphoria(g);
  }
  setDisplayYear(yearOf(today));
  setCurrencyDate(today); // Währungsumstellung taggenau (engine/economy.ts currencyAt)
  setEraYear(yearOf(today));
  // Terminwart: Platzbegehung für morgen, Wochenend-Verlegungen (game/fixtureWatch.ts).
  fixtureWatchDaily(g, today);
  if (ui.onOwnMatchDue) {
    const due = findOwnMatchDue(g);
    if (due && !isPrepared(due)) { ui.onOwnMatchDue(due); return false; }
  }
  setTransferDate(today);
  seasonPromisesFitness(g, today); // „Wer nicht fit ist, spielt nicht“: Frische der Startelf vor dem Anpfiff
  const todaysEvents = CalendarEngine.eventsOn(cal, today).filter((e) => !e.processed);
  const decisionsBefore = new Set(g.messages.filter((m) => m.choices?.length).map((m) => m.id));

  // Kalender-Ereignisse des Tages (game/dayEvents.ts).
  let stopForAction = processDayEvents(g, ui, todaysEvents, today, myClub);

  // -------------------------------------------------------------------------
  // VORSCHAU: eine Woche vor jeder Bewertungsrunde nennt der Trainerstab Tendenzen.
  // -------------------------------------------------------------------------
  ratingPreview(g, today, myClub);

  // -------------------------------------------------------------------------
  // TRAINING & REGENERATION
  // -------------------------------------------------------------------------
  const userIds = new Set(myClub.playerIds);
  const utcDay = new Date(today + 'T00:00:00Z').getUTCDay(); // 0=So … 6=Sa
  // War heute ein Pflichtspiel des Manager-Vereins? Dann kein Training.
  const isMyMatchDay = todaysEvents.some(
    (ev) => ev.type === 'matchday' && (() => {
      const m = g.fixtures.find((x) => x.id === ev.matchId);
      return !!m && m.involvesPlayerClub;
    })(),
  );

  if (!isMyMatchDay) {
    // Manager-Verein trainiert gemäß Wochenplan (füllt den Entwicklungs-Akku).
    // Winterpause: Training baut Fitness auf, aber keine Spielform (kein Form-Plus).
    const breakForm = inWinterBreak(g, today) ? new Map(myClub.playerIds.map((id) => [id, g.players[id]?.form ?? 0])) : null;
    // Trainingsplan mit Spiel-Sperren, Trainerteam und Belastungsverletzungen (game/trainingWeek.ts).
    // Vorgemerkte Wochenvorlage (Training › Langfristig) ab ihrem Montag laden.
    applyScheduledTemplate(g, today);
    ownTrainingDay(g, myClub, today);
    // Positionstraining (eine Zielposition je Spieler, game/positionsGame.ts)
    { const d = g.trainingPlan.days[weekdayIdx(today)]; if (d?.slot1 || d?.slot2) ownPositionTraining(g, today, 0.8 + 0.4 * ((myClub.trainingSchedule?.facilitiesQuality ?? 70) / 100)); }
    // Erstes Training der Saison: Versprechen-Popup (game/seasonPromisesGame.ts).
    { const d = g.trainingPlan.days[weekdayIdx(today)]; if (seasonPromisesDaily(g, today, !!(d?.slot1 || d?.slot2))) stopForAction = true; }
    if (breakForm) for (const [id, f] of breakForm) { const p = g.players[id]; if (p && p.form > f) p.form = f; }
    applyFocusLoad(g, myClub, today, staffEffectsOf(g).injuryReduction);
    // Übrige Liga regeneriert normal; Manager-Verein ist über das Training abgedeckt.
    dailyRecovery(g.players, userIds);
  } else {
    seasonPromisesDaily(g, today, false);
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
  youthIntakeDaily(g, today); // game/dayYouthIntake.ts

  youthCampsDaily(g, today); // Jugendcamps im Ausland: Bau, Betrieb, Talente am 1.7., KI-Talente (game/youthCamps.ts)

  legendsDaily(g, today); // 1. Juli: Ausnahmetalente der Fußballgeschichte (still, game/legendsGame.ts)

  // -------------------------------------------------------------------------
  // MONATSABSCHLUSS: am 1. eines Monats Gehälter, Fixkosten, Sponsoring buchen.
  // -------------------------------------------------------------------------
  const utcDom = new Date(today + 'T00:00:00Z').getUTCDate();
  const curMonth = today.slice(0, 7);
  autoResolveEvents(g, today);
  contractReminders(g, today);
  announceUpcomingRules(g, today);
  aiClubsDaily(g, today);
  careerDaily(g, today); // Managerkarriere: Trainer-Historie, Vorstandsdruck gegen den Trainer (game/careerGame.ts)
  // Jugendwettbewerbe gibt es nur in Deutschland (Heimatland, Weltdaten).
  const germanHome = homeCountryOf(g) === 'ger';
  if (germanHome) youthCompsDaily(g, today);
  rollAiOffers(g, today);
  aiContractsDaily(g, today); // KI: vorzeitige Verlängerungen, Altstars, Bosman-Verkäufe, Vorverträge (game/aiContracts.ts)
  loanLifeDaily(g, today); // Leihen: Gehaltsanteile, Rückkehr, Rückruf, Strafzahlung/Kaufpflicht am 29.6. (game/loanLife.ts)
  aiLoansDaily(g, today); // KI-Leihen, Rückkehr/Kaufoption am 30.6. (game/aiLoans.ts)
  loanMarketDaily(g, today); // Leihangebote für deine Spieler (game/loanMarket.ts)
  loanTalksDaily(g, today); // deine Leihgespräche: Vollzug im Fenster (game/loanTalks.ts)
  checkPromises(g, today);
  contractClausesDaily(g, today); // Treueprämie, Erfolgsklausel, Leihe mit Kaufoption (game/playerWishesGame.ts)
  contractBonusesDaily(g, today); // Vertrag 2.0: Einsatz-/Tor-/Zu-null-Prämien (game/contractClausesGame.ts)
  contractSeasonEndDaily(g, today); // Vertrag 2.0: Titelprämie, Klassenerhalt vormerken (29.6.)
  { const mc = g.clubs[g.managedClubId]; if (mc) assignShirtNumbers(mc, g.players, shirtSeasonOf(today)); }
  buyBackDaily(g, today, (p, from, to, fee) => { transferPlayer(g, p, from, to, fee, today); repairSquadLists(g); });
  transferTalkDaily(g, today);
  scoutingDaily(g, today); // Einzel-Scouting (Transfers › Scouting)
  abroadDaily(g, today); // Scouts im Ausland: Rückkehr, Länderwissen, Funde (game/scoutAbroad.ts)
  softwareMonthly(g, today); // Scouting-Abos am 1. abbuchen, Kündigungen (game/scoutSoftware.ts)
  bindRegistration(g); registrationDaily(g, today); // Spielermeldung & Ausländerregeln (game/registrationGame.ts)
  nationalDaily(g, today); // Nationalmannschaften, Länderspiele, WM/EM (game/national/nationalGame.ts)
  privateDaily(g, today); // Privatleben: Wochenplan, Monatsabschluss, Familie, Generationen (game/private/privateGame.ts)
  worldLiveDaily(g, today); // Auslandsligen: fällige Spieltage spielen (game/worldLeagues.ts)
  worldPoolWinter(g, today); // Winterfenster der Weltspieler am 5.1. (game/worldTransfers.ts)
  cohesionDaily(g, today);  // Eingespieltheit: taktisches Training des eigenen Vereins, KI montags (game/cohesionGame.ts)
  if (g.worldPool && new Date(`${today}T00:00:00Z`).getUTCDay() === 1) ensureWorldPool(g); // montags: Weltspieler mit den Vereinen abgleichen (neue/aufgestiegene Vereine)
  // Winter-Systeme: Hallenturniere/Masters (game/indoorGame.ts) und Trainingslager (game/trainingCampGame.ts).
  // Deutsche Turniere nur mit Heimatland Deutschland (setupIndoorWinter), Auslandsturniere immer (game/indoorAbroad.ts).
  const indoorShow = indoorDaily(g, today, ui.onIndoorShow ? (t) => ui.onIndoorShow!(t.id) : undefined);
  const campsEnded = campDaily(g, today);
  winterBreakDaily(g, today);   // Formdrift in der Winterpause (game/winterShared.ts)
  advanceDivisionsTo(g, today); // Sim-Ligen nach eigenem Spielplan (game/season.ts)
  groundsDaily(g, today); // Stadionumfeld: Bauvorhaben, Spiele, Monat, Saison (game/groundsGame.ts)
  merchDaily(g, today); // Fanartikel: Wochenabschluss, Nachverkauf, Assistent (game/merchGame.ts)
  { const room = dressingRoomDaily(g, today); if (room) dressingRoomIncidents(g, today, room); } // Kabine (game/dressingRoomGame.ts)
  if (utcDom === 1) {
    recordMonthlyOv(g, today); // Stärke-Verlauf aller Spieler (game/ovHistory.ts)
    monthlyTrainingReport(g, today);
    monthlySquadHarmony(g, today);
    monthlyEnvironmentUpdate(g, today);
    monthlyEvents(g, today);
    monthlyClubEvents(g, today);
    monthlyYouthRecruit(g, today);
    monthlyYouthInvest(g, today);
    // Kreditraten, Stadion-Bauprojekte, Namensrechte (game/clubBusiness.ts).
    monthlyClubBusiness(g, today);
    standNamesMonthly(g, today); // Tribünennamen: Sponsorgeld, Ablauf (game/standNames.ts)
    // Sponsoring 2.0: Verlängerungen, neue Interessenten, Pflichtreisen, Image (game/sponsorGame.ts).
    monthlySponsoring(g, today);
    // Positionsvertrautheit: Abbau ungenutzter Positionen, KI-Positionstraining (game/positionsGame.ts).
    monthlyPositions(g, today);
    monthlyFinanceClose(g, today, curMonth); // game/dayFinance.ts
    // Monatsabschluss läuft still – keine Pause.
  }

  // -------------------------------------------------------------------------
  // WOCHEN-ENTWICKLUNG: sonntags Auswertung des versteckten Entwicklungs-Akkus
  // -------------------------------------------------------------------------
  if (utcDay === 0) {
    aiDressingRoomsWeekly(g); // Kabine der KI-Vereine: Stimmung → Moral
    // Wochen-Entwicklung läuft still im Hintergrund: die Spielerwerte werden
    // direkt verändert (runWeeklyDevelopment mutiert die Attribute/OVR), aber
    // es erscheint KEIN Popup und der Lauf pausiert nicht mehr. Eine Meldung
    // gibt es nur noch bei den großen Auf-/Abwertungsrunden (rating_update).
    reserveDaily(g, today); // Spieltag der zweiten Mannschaft (game/reserveTeam.ts) – vor der Entwicklung
    amateurLeaguesDaily(g, today); // höchste Amateurligen mit den KI-Amateuren (game/amateurLeagues.ts)
    weeklyDevelopment(g.players, g.clubs, yearOf(today), withReserve(devContextFor(g, today), today, g), g.managedClubId);
    recordProfileWeek(g, today); // Wochenverlauf fürs Spielerprofil (nur eigener Kader)
    // Jugendentwicklung aller Vereine (Talente wachsen; Scouting präzisiert sich).
    // Manager-Verein erhält Boni aus Mitarbeitern (Scouting) und Zukunfts-Bauten
    // (NLZ → Wachstum, Datenanalyse-Zentrum → Scouting) — Block p11.
    const myStaffFx = staffEffectsOf(g);
    const myInfra = g.clubs[g.managedClubId]?.infrastructure;
    // NLZ-Wachstum steckt seit den Nachwuchs-Investitionen in academyGrowthOf (engine/youthAcademy.ts).
    const myGrowthBonus = 0;
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
  finishActivities(g, today); // game/dayFinance.ts

  // Pokalauslosungen des Tages (nach den Spielen, wie die Ziehung am Abend).
  for (const d of cupDrawsDaily(g, today)) {
    if (ui.onCupDraw?.(d)) stopForAction = true;
  }
  // Rückkehr aus dem Trainingslager: animierte Zusammenfassung.
  for (const id of campsEnded) if (ui.onCampEnd?.(id)) stopForAction = true;
  // Hallenturnier deines Vereins als Show (game.indoor.current.live).
  if (indoorShow) stopForAction = true;
  // Tag nach dem Fensterschluss: Transferbilanz.
  const twKey = transferWindowDue(g, today);
  if (twKey && ui.onTransferWindow?.(twKey)) stopForAction = true;
  // Die Besten der Saison: am Tag nach dem letzten Ligaspieltag (Popup über game.seasonAwards.pending).
  if (awardsDaily(g, today)) stopForAction = true;
  // Goldener Ball (Fußballer des Jahres) am 20. Dezember: Gala über game.goldenBall.pending.
  if (goldenBallDaily(g, today)) stopForAction = true;

  // Pause nur, wenn heute eine neue Entscheidung ansteht (Ereignis mit Auswahl).
  if (g.messages.some((m) => m.choices?.length && m.eventRef && !m.eventRef.resolved && m.date === today && !decisionsBefore.has(m.id))) {
    stopForAction = true;
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

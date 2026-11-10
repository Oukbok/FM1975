// =============================================================================
// Spielstand laden: Datensatz anwenden + alle Nachrüstungen alter Spielstände
// (vorher inline in App.tsx). Reihenfolge ist verbindlich; jede Migration ist
// idempotent. Genutzt von App.tsx (Laden) und tests/season-test.ts.
// =============================================================================
import { setHomeOrigin } from '../data/origins';
import { bindRegistration } from './registrationGame';
import { COUNTRY_BY_CC, countryOrigin } from '../data/world/countries';
import { setHomeLabel } from '../engine/leagues';
import { applyDataset } from '../data/dataset/apply';
import { BUILTIN_ID } from '../data/dataset/builtin';
import { cachedDataset } from '../data/dataset/storage';
import { setEraYear } from '../engine/positions';
import { ensureDevFields, refreshOverall } from '../engine/development';
import { updateScoutEstimate } from '../engine/scouting';
import { snapshotAttributes } from '../engine/history';
import { EuroCompId, allEuroClubs } from '../data/europe';
import { generateCupAmateurs } from '../data/generate';
import { LEAGUE_REFORMS } from '../data/reforms';
import { seasonStartYear, timelineEventsUpTo } from '../data/timeline';
import { CalendarEngine } from '../engine/calendar';
import { createCup } from '../engine/cup';
import { isForeignId } from '../engine/world';
import { setCurrencyDate, setHomeCurrency, yearOf } from '../engine/economy';
import { computeGermanEuroQualifiers } from '../engine/euro';
import { applyFacilityEffects, makeInfrastructure } from '../engine/infrastructure';
import { advanceDivision } from '../engine/leagues';
import { autoFillLineup } from '../engine/lineupAI';
import { makeMessage, pushMessage } from '../engine/messages';
import { createDefaultWeeklyPlan } from '../engine/weeklyTraining';
import { academyStartingCohort, generateYouthPlayer, migrateYouthContracts } from '../engine/youth';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, cupDrawMessage, euroDrawMessage, leagueDateSet } from './competitions';
import { buildDdrDivisions, buildLeagueSystem, buildSecondLigaSimClubs, historicPointSystem } from './leagueSetup';
import { applyTimelineEffect } from './season';
import { Game, hashSeed, migrateCommerce } from './state';
import { YOUTH_ENTRY_AGE } from '../types';
import { setDisplayYear } from '../ui/format';
import { ensureYouthTeams } from './youthTeams';
import { migrateAiClubs } from './aiClubs';
import { migrateFinanceLevel } from './financeMigration';
import { migrateWinter } from './winterShared';
import { migrateIndoorDates } from './indoorGame';
import { migrateGrounds } from './groundsGame';
import { migrateSeating } from './seatingGame';
import { migrateLeaguePool } from './clubPool';
import { migrateYouthInvest } from './youthInvest';
import { migrateSponsorship } from './sponsorGame';
import { migrateSponsorNames } from './sponsorRenameMigration';
import { migrateMerch } from './merchGame';
import { migrateBriefing } from './seasonBriefing';
import { migrateBudget } from './budgetPlan';
import { migrateSeasonAwards } from './seasonAwardsGame';
import { migrateGoldenBall } from './goldenBallGame';
import { migrateLegacyLegends } from './playerMigration';
import { migratePersonas } from './playerWishesGame';
import { migrateContracts2 } from './contractClausesGame';
import { migratePositionSkills } from './positionsGame';
import { migratePositions2 } from './positions2Migration';
import { migrateDressingRoom } from './dressingRoomGame';
import { migrateTrainingPlan } from './trainingWeek';
import { migrateStaffPeople } from './staffWorld';
import { migrateYouthComps } from './youthComps/daily';
import { migrateHistoryMode } from './historicSteer';
import { migrateTransferLog } from './transferLog';
import { migrateCareer } from './careerGame';
import { assignShirtNumbers } from './squads';
import { bindHonours } from './clubHonours';
import { bindStaffFactor } from './staffGame';
import { ensureWorldPool } from './worldPool';
import { ensureCountryPools } from '../engine/world';

/** Bereitet einen gerade gelesenen Spielstand zum Weiterspielen vor (verändert `g`). */
export function prepareLoadedGame(g: Game): void {
  // Datensatz des Spielstands anwenden (fehlt er, gilt der eingebaute).
  const dsId = g.datasetId ?? BUILTIN_ID;
  const ds = cachedDataset(dsId);
  applyDataset(ds);
  if (dsId !== BUILTIN_ID && !ds) {
    g.messages.unshift(makeMessage({
      date: g.calendar.currentDate, category: 'general', from: 'System',
      subject: 'Datensatz nicht gefunden',
      shortText: `„${g.datasetName ?? dsId}“ ist auf diesem Rechner nicht installiert.`,
      bodyText: `Dieser Spielstand wurde mit dem Datensatz „${g.datasetName ?? dsId}“ begonnen. Er ist hier nicht installiert, deshalb gelten die Standardwerte für Geschichte, Namen und neue Vereine. Importiere den Datensatz im Hauptmenü unter „Datensätze & Editor“ und lade den Spielstand erneut.`,
    }));
  }
  // Heimatland (Weltdaten): Herkunft der Einheimischen für neue Spieler/Jugend.
  setHomeOrigin(g.homeCountry && g.homeCountry !== 'ger' ? countryOrigin(g.homeCountry) : null);
  bindRegistration(g);
  setHomeCurrency(g.homeCountry); // Anzeige in der Heimatwährung (data/currencies.ts)
  setHomeLabel(COUNTRY_BY_CC[g.homeCountry ?? 'ger']?.name ?? 'Deutschland');
  // Positionsbewertung auf das Spieljahr einstellen; ältere Spielstände auf Entwicklung 2.0 heben.
  setEraYear(Number(g.calendar.currentDate.slice(0, 4)));
  // Positionen 2.0: alte Kürzel VS/AV/FL → IV, RV/LV, RA/LA (vor allem, was Positionen bewertet).
  try { migratePositions2(g); } catch (err) { console.error('Positionen-2.0-Umrechnung fehlgeschlagen:', err); }
  for (const p of Object.values(g.players)) {
    if (p.isYouth) continue;
    if (p.development.basePotential == null) { ensureDevFields(p); refreshOverall(p); updateScoutEstimate(p, 0.3, p.clubId === g.managedClubId); }
  }
  // Ältere Spielstände ohne Attribut-Verlauf: Ausgangswert für den eigenen Kader setzen.
  for (const pid of g.clubs[g.managedClubId]?.playerIds ?? []) {
    const p = g.players[pid];
    if (p && !p.history?.attributeSnapshots?.length) snapshotAttributes(p, g.calendar.currentDate, 'Stand beim Laden');
  }
  // Alte Spielstände kennen den Wochen-Trainingsplan noch nicht → nachrüsten.
  if (!g.trainingPlan || !Array.isArray(g.trainingPlan.days) || g.trainingPlan.days.length !== 7) {
    g.trainingPlan = createDefaultWeeklyPlan();
  }
  // Alte Spielstände ohne erweiterte Aufstellung → Startelf/Positionen nachrüsten.
  for (const c of Object.values(g.clubs) as any[]) {
    if (c.tactics && !c.tactics.assignedPositions) {
      Object.assign(c.tactics, autoFillLineup(c, g.players, c.tactics));
    }
  }
  // Alte Spielstände ohne Jugend/Infrastruktur → nachrüsten.
  if (!g.youthPlayers) g.youthPlayers = {};
  for (const c of Object.values(g.clubs) as any[]) {
    if (!c.infrastructure) c.infrastructure = makeInfrastructure(c.reputation ?? 65);
    if (!Array.isArray(c.youthPlayerIds)) c.youthPlayerIds = [];
    // Zukunfts-Einrichtungen (Block p11) auf Grundausbau nachrüsten.
    if (c.infrastructure.rehaCenter == null) c.infrastructure.rehaCenter = 1;
    if (c.infrastructure.nlz == null) c.infrastructure.nlz = 1;
    if (c.infrastructure.performanceCenter == null) c.infrastructure.performanceCenter = 1;
    if (c.infrastructure.dataCenter == null) c.infrastructure.dataCenter = 1;
    // Finanzsystem-Migration (SAVE_VERSION 9): Catering-Gebaeude, neue Buckets, Kommerz.
    if (c.infrastructure.catering == null) c.infrastructure.catering = (c.reputation ?? 65) >= 80 ? 2 : 1;
    if (c.finances) {
      const inc = c.finances.income ?? (c.finances.income = {} as any);
      for (const k of ['ticketSales', 'tvMoney', 'sponsorship', 'merchandise', 'transferIncome', 'prizeMoney', 'catering', 'advertising', 'commercial', 'membership', 'matchday', 'other']) {
        if (inc[k] == null) inc[k] = 0;
      }
      const exp = c.finances.expenses ?? (c.finances.expenses = {} as any);
      for (const k of ['wages', 'transferExpense', 'stadiumMaintenance', 'trainingFacilities', 'facilities', 'staffWages', 'other']) {
        if (exp[k] == null) exp[k] = 0;
      }
    }
    if (!c.commerce) {
      c.commerce = migrateCommerce(c, c.id === g.managedClubId);
    } else if (!c.commerce.cateringMode) {
      c.commerce.cateringMode = 'verpachtung';
    }
    applyFacilityEffects(c);
    const curDate = g.calendar.currentDate;
    // Pokal-Amateure und Auslandsvereine führen keine Jugend (wie im neuen Spiel).
    if (c.id.startsWith('am') || isForeignId(c.id)) continue;
    if (c.youthPlayerIds.length === 0) {
      // Noch gar keine Talente → kompletten Altersaufbau F–A erzeugen.
      for (const yp of academyStartingCohort(c, curDate)) {
        g.youthPlayers[yp.id] = yp;
        c.youthPlayerIds.push(yp.id);
      }
    } else {
      // Bestehende Jugend nachrüsten: fehlende jüngere Jahrgänge (7–16)
      // auffüllen, damit auch Altstände einen vollen Altersaufbau erhalten.
      const agesPresent = new Set<number>(
        c.youthPlayerIds
          .map((id: string) => g.youthPlayers[id]?.age)
          .filter((a: number | undefined): a is number => typeof a === 'number'),
      );
      const lvl = c.infrastructure.youthAcademy ?? 1;
      for (let age = YOUTH_ENTRY_AGE; age <= 16; age++) {
        if (!agesPresent.has(age)) {
          const yp = generateYouthPlayer(c.id, `retrofill_${age}`, curDate, lvl, age);
          g.youthPlayers[yp.id] = yp;
          c.youthPlayerIds.push(yp.id);
        }
      }
    }
  }
  // Saisonende-Ereignis lag früher auf dem 30.6. (wird nie verarbeitet) → auf den 29.6. ziehen.
  for (const ev of g.calendar.events ?? []) {
    if (ev.type === 'season_end' && !ev.processed && ev.date === g.calendar.seasonEndDate) ev.date = CalendarEngine.addDays(ev.date, -1);
  }
  // Alte Spielstände ohne Landespokal → sauber nachrüsten (darf nicht crashen).
  if (!g.cup) {
    try {
      const amateurs = generateCupAmateurs(14);
      Object.assign(g.clubs, amateurs.clubs);
      Object.assign(g.players, amateurs.players);
      const blClubIds = Object.values(g.clubs)
        .filter((c: any) => !c.id.startsWith('am'))
        .map((c: any) => c.id);
      const curDate = g.calendar.currentDate;
      const cup = createCup(
        blClubIds,
        Object.keys(amateurs.clubs),
        leagueDateSet(g.fixtures),
        hashSeed(g.managedClubId + ':1980'),
        curDate,
        g.managedClubId,
      );
      addCupCalendarEvents(g.calendar, cup);
      g.cup = cup;
      pushMessage(g.messages, cupDrawMessage(cup, g.clubs, g.managedClubId, curDate));
    } catch (err) {
      console.error('Pokal-Nachrüstung fehlgeschlagen:', err);
    }
  }
  // Alte Spielstände ohne Europapokale → defensiv nachrüsten (darf nicht crashen).
  if (!g.euroClubs || !g.euroCups) {
    try {
      const euroClubs = g.euroClubs ?? allEuroClubs();
      g.euroClubs = euroClubs;
      const firstSeason = g.season === '1975/76';
      const quals = computeGermanEuroQualifiers(g, firstSeason);
      g.euroCups = buildEuroCupsForSeason(
        quals, euroClubs, leagueDateSet(g.fixtures), cupDateSet(g.cup),
        g.managedClubId + ':euroload', g.calendar.currentDate,
        g.managedClubId, g.calendar,
      );
      for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
        const ec = g.euroCups[comp];
        if (!ec) continue;
        const dmsg = euroDrawMessage(comp, ec, g.clubs, euroClubs, g.managedClubId, 0, g.calendar.currentDate);
        if (dmsg) pushMessage(g.messages, dmsg);
      }
    } catch (err) {
      console.error('Europapokal-Nachrüstung fehlgeschlagen:', err);
    }
  }
  // Alte Spielstände ohne Epochen-/Timeline-System → nachrüsten. Die bis zur
  // aktuellen Saison fälligen Meilensteine werden STILL angewandt (Effekte wie
  // Punktesystem/Feature-Flags korrekt setzen), ohne die Inbox zu überfluten.
  if (!Array.isArray(g.firedMilestones)) g.firedMilestones = [];
  if (!Array.isArray(g.unlockedFeatures)) g.unlockedFeatures = [];
  if (g.firedMilestones.length === 0) {
    // ALLE bis zur aktuellen Saison fälligen Meilensteine still anwenden
    // (Effekte wie Punktesystem/Feature-Flags korrekt setzen) und als
    // ausgelöst markieren, ohne die Inbox rückwirkend zu fluten.
    for (const ev of timelineEventsUpTo(g.season)) {
      g.firedMilestones.push(ev.id);
      applyTimelineEffect(g, ev);
    }
  }
  // Robustheit: Fehlt/verunreinigt das Punktesystem in einem Altstand, historisch
  // aus der aktuellen Saison ableiten (bis 1994/95 → 2 Punkte, ab 1995/96 → 3 Punkte).
  if (g.pointSystem !== '2-point' && g.pointSystem !== '3-point') {
    g.pointSystem = historicPointSystem(g.season);
  }
  // Neues Attribut "Frische" (SAVE_VERSION 7) → in Altständen ergänzen. Standard 100
  // (bzw. aktuelle Fitness als sinnvoller Startwert), damit alte Saves nicht brechen.
  const retrofitFrische = (rec: any) => {
    for (const p of Object.values(rec ?? {}) as any[]) {
      if (p && typeof p.frische !== 'number') {
        p.frische = typeof p?.attributes?.fitness === 'number' ? p.attributes.fitness : 100;
      }
    }
  };
  retrofitFrische(g.players);
  retrofitFrische(g.youthPlayers);
  // Block p11 (Mitarbeiter / Marketing / Kalender) → fehlende Felder nachrüsten.
  if (!Array.isArray(g.hiredStaff)) g.hiredStaff = [];
  if (!g.marketing || typeof g.marketing !== 'object') g.marketing = {};
  if (!Array.isArray(g.activities)) g.activities = [];
  // Mehrstufiges Ligasystem (SAVE_VERSION 4) → alte Einliga-Spielstände auf die
  // neue Struktur heben: bestehende Profivereine bleiben Tier 1 (Spielerliga),
  // die 2. Liga Nord/Süd wird als aggregierte Sim-Ligen ergänzt.
  if (!g.simClubs || typeof g.simClubs !== 'object') g.simClubs = {};
  if (!g.leagues) {
    try {
      const simClubs = buildSecondLigaSimClubs();
      g.simClubs = simClubs;
      const seasonStart = g.fixtures[0]?.date ?? g.calendar.seasonStartDate;
      g.leagues = buildLeagueSystem(simClubs, g.pointSystem, g.season, seasonStart);
      // Sim-Ligen bis zum aktuellen Liga-Spieltag der laufenden Saison nachziehen,
      // damit die 2.-Liga-Tabellen zum Spielstand passen.
      const playedMd = Math.max(
        0,
        ...g.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
      );
      for (const div of g.leagues.otherDivisions) {
        let guard = 0;
        while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
          advanceDivision(div, simClubs, g.pointSystem, g.season);
          guard++;
        }
      }
    } catch (err) {
      console.error('Ligasystem-Nachrüstung fehlgeschlagen:', err);
    }
  }
  // Ligareform-System (SAVE_VERSION 5) → nachrüsten. Bei Altständen ohne dieses
  // Feld werden bereits VERGANGENE Reformen als „angewandt" markiert, damit an
  // schon durchlaufenen Saison-Grenzen keine rückwirkende Struktur-Migration
  // ausgelöst wird (verhindert Doppel-Migration beim Laden).
  if (!Array.isArray(g.appliedReforms)) {
    g.appliedReforms = LEAGUE_REFORMS
      .filter((r) => seasonStartYear(r.effectiveSeason) <= seasonStartYear(g.season))
      .map((r) => r.reformId);
  }
  // DDR-Ligasystem (SAVE_VERSION 6) → nachrüsten. Spielstände VOR der
  // Wiedervereinigung (Saison-Startjahr < 1991) ohne separate DDR-Divisionen
  // erhalten die parallele DDR-Pyramide nachträglich; die DDR-Tabellen werden
  // bis zum aktuellen Liga-Spieltag nachgezogen. Stände AB 1991/92 gelten als
  // bereits integriert (die DDR-Struktur wurde dort aufgelöst) – nichts zu tun.
  try {
    const hasDdr = g.leagues?.otherDivisions?.some((d: any) => String(d.id).startsWith('ddr-'));
    const beforeWende = seasonStartYear(g.season) < 1991;
    const reunified = Array.isArray(g.appliedReforms)
      && g.appliedReforms.includes('reform-1991-reunification');
    if (g.leagues && !hasDdr && beforeWende && !reunified) {
      const seasonStart = g.fixtures[0]?.date ?? g.calendar.seasonStartDate;
      const ddrDivs = buildDdrDivisions(g.simClubs, g.pointSystem, g.season, seasonStart);
      const playedMd = Math.max(
        0,
        ...g.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
      );
      for (const div of ddrDivs) {
        let guard = 0;
        while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
          advanceDivision(div, g.simClubs, g.pointSystem, g.season);
          guard++;
        }
      }
      g.leagues.otherDivisions.push(...ddrDivs);
    }
  } catch (err) {
    console.error('DDR-Nachrüstung fehlgeschlagen:', err);
  }
  // Anzeige-Währung auf das aktuelle Spieljahr setzen (DM ≤2001, EUR ≥2002).
  setDisplayYear(yearOf(g.calendar.currentDate));
  setCurrencyDate(g.calendar.currentDate);
  ensureYouthTeams(g, g.calendar.currentDate);
  // Manager-KI (SAVE_VERSION 10): Trainer der KI-Vereine nachrüsten.
  try { migrateAiClubs(g); } catch (err) { console.error('Trainer-Nachrüstung fehlgeschlagen:', err); }
  // Finanzniveau (v11, Sammel-Update): alte Spielstände auf das realistische Niveau umrechnen.
  try { migrateFinanceLevel(g); } catch (err) { console.error('Finanz-Umstellung fehlgeschlagen:', err); }
  // Hallenfußball + Trainingslager (v11 Sammel-Update): optionale Felder nachrüsten.
  try { migrateWinter(g); } catch (err) { console.error('Winter-Nachrüstung fehlgeschlagen:', err); }
  // Hallentermine nur in der Winterpause (Wunsch Pascal): künftige Termine in Pflichtspielzeit verlegen/absagen.
  try { migrateIndoorDates(g); } catch (err) { console.error('Hallentermine-Abgleich fehlgeschlagen:', err); }
  // Stadionumfeld (v11-Sammel-Update): Lage, Fläche, epochentypische Ausstattung nachrüsten.
  try { migrateGrounds(g); } catch (err) { console.error('Umfeld-Nachrüstung fehlgeschlagen:', err); }
  try { migrateSeating(g); } catch (err) { console.error('Platzkategorien-Nachrüstung fehlgeschlagen:', err); }
  // Vereins-Pool (Amateurligen) + Historie 1963–1975 (game/clubPool.ts).
  try { migrateLeaguePool(g); } catch (err) { console.error('Liga-Historie-Nachrüstung fehlgeschlagen:', err); }
  // Nachwuchs-Investitionen (v11): Bausteine aus der alten Akademie-Stufe ableiten.
  try { migrateYouthInvest(g); } catch (err) { console.error('Nachwuchs-Nachrüstung fehlgeschlagen:', err); }
  // Echt klingende Firmen-/Hallennamen alter Stände ersetzen (data/sponsorRenames.ts).
  try { migrateSponsorNames(g); } catch (err) { console.error('Sponsornamen-Umbenennung fehlgeschlagen:', err); }
  // Sponsoring 2.0: Trikot-/Bandenvertrag übernehmen, Werbeflächen der Epoche (game/sponsorGame.ts).
  try { migrateSponsorship(g); } catch (err) { console.error('Sponsoring-Nachrüstung fehlgeschlagen:', err); }
  // Fanartikel: Laden mit Startbestand für den eigenen Verein (game/merchGame.ts).
  try { migrateMerch(g); } catch (err) { console.error('Fanartikel-Nachrüstung fehlgeschlagen:', err); }
  // Saison-Briefing: Archiv ab der aktuellen Saison, beim Laden kein automatisches Popup.
  try { migrateBriefing(g); } catch (err) { console.error('Briefing-Nachrüstung fehlgeschlagen:', err); }
  try { migrateGoldenBall(g); } catch (err) { console.error('Goldener-Ball-Nachrüstung fehlgeschlagen:', err); }
  try { migrateSeasonAwards(g); } catch (err) { console.error('Auszeichnungen-Nachrüstung fehlgeschlagen:', err); }
  // Legenden-System entfernt: frühere Legenden werden ganz normale Spieler.
  try { migrateLegacyLegends(g); } catch (err) { console.error('Legenden-Bereinigung fehlgeschlagen:', err); }
  // Transfer 2.0: Spielerpersönlichkeit (Wünsche, Gehaltsforderung) nachrüsten.
  try { migratePersonas(g); } catch (err) { console.error('Persönlichkeits-Nachrüstung fehlgeschlagen:', err); }
  // Positionsvertrautheit je Position (game/positionsGame.ts).
  try { migratePositionSkills(g); } catch (err) { console.error('Positions-Nachrüstung fehlgeschlagen:', err); }
  // Kabine: Moral 0–100 und Kabinenzustand des eigenen Vereins nachrüsten.
  try { migrateDressingRoom(g); } catch (err) { console.error('Kabinen-Nachrüstung fehlgeschlagen:', err); }
  try { migrateTrainingPlan(g); migrateStaffPeople(g); } catch (err) { console.error('Trainerteam-Nachrüstung fehlgeschlagen:', err); }
  // Jugendwettbewerbe: laufende Saison sofort, vergangene Spieltage werden nachsimuliert.
  try { for (const c of Object.values(g.clubs)) assignShirtNumbers(c, g.players); } catch (err) { console.error('Rückennummern-Nachrüstung fehlgeschlagen:', err); }
  try { migrateYouthContracts(g); } catch (err) { console.error('Jugendverträge-Nachrüstung fehlgeschlagen:', err); }
  try { migrateYouthComps(g); } catch (err) { console.error('Jugendwettbewerbe-Nachrüstung fehlgeschlagen:', err); }
  migrateHistoryMode(g);
  try { migrateTransferLog(g); } catch (err) { console.error('Transferprotokoll-Nachrüstung fehlgeschlagen:', err); }
  try { migrateCareer(g); } catch (err) { console.error('Karriere-Bereinigung fehlgeschlagen:', err); }
  try { migrateBudget(g); } catch (err) { console.error('Saisonbudget-Nachrüstung fehlgeschlagen:', err); }
  try { migrateContracts2(g); } catch (err) { console.error('Vertrag-2.0-Nachrüstung fehlgeschlagen:', err); }
  bindHonours(g, true); // Vereinsauszeichnungen: Wirkungstabelle des geladenen Spielstands
  bindStaffFactor(g); // Stab → Spielstärke
  fixStaleContracts(g); // Spieler im Kader mit abgelaufenem Vertrag (Hochziehen nach dem 1. Juli, alte Spielstände)
  ensureCountryPools(g.world, g.euroClubs, Number(g.season.slice(0, 4))); // Unterbau der Auslandsligen (engine/world.ts)
  if (!g.worldPool) ensureWorldPool(g); // Weltspieler (Spielerpool) für alte Spielstände anlegen
}

/** Abgelaufene Verträge von Kaderspielern (sollte es nicht geben): bis zum Ende der nächsten Saison verlängern. */
export function fixStaleContracts(g: Game): void {
  const today = g.calendar.currentDate;
  const endYear = Number(today.slice(0, 4)) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0);
  for (const c of Object.values(g.clubs)) for (const id of c.playerIds) {
    const p = g.players[id];
    if (p && p.contract.expiryDate < today) p.contract.expiryDate = `${endYear + 1}-06-30`;
  }
}

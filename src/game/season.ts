import { leagueName } from '../data/leagueNames';
import { retireLibero } from './liberoEra';
import { rescueLegends } from './legendsGame';
import { careerSeasonStart, careerSeasonSwitchFinish } from './careerGame';
import { relegationSeasonEnd } from './relegationGame';
import { recordSeasonBriefing } from './seasonBriefing';
import { recordBudgetPlan } from './budgetPlan';
import { seasonPromiseSnapshot, settleSeasonPromises } from './seasonPromisesGame';
import { awardSeasonEnd, clearPendingAwards } from './seasonAwardsGame';
import { clearPendingGoldenBall } from './goldenBallGame';
import { EuroCompId, allEuroClubs } from '../data/europe';
import { setEraYear } from '../engine/positions';
import { refreshOverall } from '../engine/development';
import { manageSquads, seasonShirtNumbers } from './squads';
import { aiSeasonEnd } from './aiClubs';
import { closeFinancialSeason, openFinancialSeason } from './seasonFinance';
import { historicMoney, historicSeasonClose, historicSimClubs, historicWorld, historicWorldAfter } from './historicSteer';
import { applyForcedRelegation } from './clubBusiness';
import { staffSeasonChange } from './staffGame';
import { youthPoachingAtSeasonChange } from './youthMarket';
import { environmentSeasonChange, setSeasonGoal } from './environmentGame';
import { advanceWorldSeason, initWorld, isForeignId } from '../engine/world';
import { leagueRepHook } from './leagueRepGame';
import { closeSeason, recordTransfer } from '../engine/history';
import { buildProClub } from '../data/generate';
import { recordSeasonEnd } from './clubRecords';
import { archiveSeasonEnd } from './leagueArchive';
import { closeAmateurLeagues } from './amateurLeagues';
import { ddrReserveTransition, syncDdrReserves } from './ddrReserves';
import { ownAmateurTable } from './reserveTeam';
import { homeBTeamTransition, isReserveCupId, reserveCupClubs, reserveTransition, syncReserveClubs } from './reservePyramid';
import { cupField } from '../engine/worldReserves';
import { absorbPlaceholders, ddrExchange, mergeDdrPool, poolDrift, poolExchange, refillPool, settlePool } from './clubPool';
import { structureForSeason } from '../data/reforms';
import { balanceDivisions } from '../data/reformSteady';
import { CurrentDivision, TransitionResult, computeSeasonTransition } from '../data/reformTransition';
import { applyHomePlan, homeRegionHint, homeSeasonPlan, homeZoneOf } from './homeStructure';
import { seasonStartYear } from '../data/timeline';
import { generateSeasonCalendar, seasonLabel } from '../engine/calendar';
import { createCup } from '../engine/cup';
import { computeGermanEuroQualifiers } from '../engine/euro';
import { setupSuperCups, superCupSeeds } from './superCupGame';
import { ensureContinents } from './continents';
import { calculateTable, generateFixtures } from '../engine/league';
import { DivisionMeta, LeagueDivision, LeagueGroup, buildDivision, flushDivision, hashStr, mulberry32, simClubFromClub, simMatchGoals } from '../engine/leagues';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club } from '../types';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, euroDrawMessage, leagueDateSet } from './competitions';
import { euroFrameDates } from './euroSetup';
import { harmonizeSeason } from './fixtureWatch';
import { nextDrawDate, scheduleDraws } from './cupDraw';
import { CalendarEngine } from '../engine/calendar';
import { Game, bestOffer, hashSeed, homeCountryKey, homeCountryOf, migrateCommerce, offerToContract } from './state';
import { countryPointSystem } from '../data/world/countries';
import { homeExcluded } from './startYear';
import { retireFullCountries } from './fullCountries';
import { worldLiveResults } from './worldLeagues';
import { withLeanMemo } from './worldScorers';
import { updateWorldDepths } from '../engine/worldDeep';
import { worldSeasonAwards } from './worldAwardsGame';
import { homeExtraAwards, worldExtraAwards } from './extraAwardsGame';

const isGermanHome = (g: Game) => homeCountryOf(g) === 'ger';
import { sponsorSeasonStart } from './sponsorGame';
import { cateringSeasonStart } from './cateringGame';
import { contractSeasonStart } from './contractClausesGame';
import { honoursSeasonEnd } from './clubHonours';
import { worldPoolSeason } from './worldPool';
import { storeSeasonResults } from './leagueResults';
import { bindGameIds } from './resetModuleState';
import { ddrEuroQualifiers, ddrRenameClubs, ddrReunifyHome, isDdrClub, isDdrHome, levelOfTier, mergeQualifiers } from './ddrHome';
import { DDR_POOL_TIER } from '../data/history/historicClubs';

// Spieltag, Sim-Ligen, Spielbericht (game/seasonMatchday.ts) und Meilensteine (game/seasonTimeline.ts).
export { advanceDivisionsTo, emitMatchMessage, leagueClubs, simulateMatchday } from './seasonMatchday';
export { applyTimelineEffect, fireTimelineForSeason } from './seasonTimeline';
import { fireTimelineForSeason } from './seasonTimeline';

/**
 * Startet die nächste Saison: Spielplan, Kalender, Tabelle und Landespokal werden
 * neu erzeugt, das Saison-Label hochgezählt und die zu Saisonbeginn fälligen
 * Chronik-Meilensteine ausgelöst. Der Kaderbestand, die Finanzen und die
 * Jugendakademien bleiben erhalten (Nachwuchs rückt am 1. Juli automatisch nach).
 */
// Aktuelle Stärke eines Vereins (Sim-Wert oder Durchschnitts-Overall des Kaders).
export function clubStrengthFor(g: Game, id: string): number {
  const sc = g.simClubs[id];
  if (sc) return sc.strength;
  const c = g.clubs[id];
  if (c) {
    const ovs = c.playerIds.map((pid) => g.players[pid]?.overall ?? 50);
    return ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : c.reputation;
  }
  return 50;
}

// Anzeigename eines Vereins (voll oder Sim) für Auf-/Abstiegs-Nachrichten.
export function clubDisplayName(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id;
}

// Deterministisches Aufstiegs-Playoff (Hin-/Rückspiel) zwischen den beiden
// Staffel-Zweiten. Gesamt-Tore entscheiden, bei Gleichstand die Stärke.
export function decidePlayoff(g: Game, aId: string, bId: string, season: string): string {
  const aStr = clubStrengthFor(g, aId);
  const bStr = clubStrengthFor(g, bId);
  const rnd = mulberry32(hashStr(`playoff:${season}:${aId}:${bId}`));
  const leg1 = simMatchGoals(aStr, bStr, rnd); // a heim
  const leg2 = simMatchGoals(bStr, aStr, rnd); // b heim
  const aTotal = leg1.home + leg2.away;
  const bTotal = leg1.away + leg2.home;
  if (aTotal !== bTotal) return aTotal > bTotal ? aId : bId;
  return aStr >= bStr ? aId : bId;
}

// Endstand (geordnete Verein-IDs) einer Division – Spielerliga aus game.table,
// alle anderen aus ihrer Sim-Tabelle.
export function finalOrder(g: Game, divId: string): string[] {
  // Auslandsvereine (Europapokal) gehören nie in eine deutsche Liga (Altstände reparieren).
  if (g.leagues.playerDivision.id === divId) {
    // Zwangsabstieg wegen Überschuldung: betroffene Vereine ans Ende (game/clubBusiness.ts).
    return applyForcedRelegation(g, g.table.rows.map((r) => r.clubId).filter((id) => !isForeignId(id)), g.season);
  }
  const d = g.leagues.otherDivisions.find((x) => x.id === divId);
  return d ? d.table.rows.map((r) => r.clubId).filter((id) => !isForeignId(id)) : [];
}

export function startNextSeason(g: Game): void {
  bindGameIds(g); // IDs aus diesem Spielstand (engine/idSeq.ts)
  // Abstieg aus der untersten Liga: Spielende (kein Saisonwechsel) bzw. Vereinswechsel vormerken (game/relegationGame.ts).
  if (relegationSeasonEnd(g)) return;
  // Trainer des Jahres + Elf der Saison (eigene Liga): Endtabelle/Pokale stehen, KI-Trainer noch im Amt.
  homeExtraAwards(g, g.calendar.currentDate);
  // Trainerbilanz und -karussell der KI-Vereine, solange die Endtabelle vorliegt.
  aiSeasonEnd(g);
  // Die Besten der Saison: Rückfall, falls das Saisonende-Ereignis nicht lief (ältere Stände).
  awardSeasonEnd(g, g.calendar.currentDate, false);
  clearPendingAwards(g);
  clearPendingGoldenBall(g); // eine nicht gezeigte Gala des Vorjahres verfällt
  const oldSeason = g.season;
  const nextStartYear = seasonStartYear(g.season) + 1;
  const nextEndYear = nextStartYear + 1;
  const newSeason = seasonLabel(nextStartYear);
  const seasonStart = `${nextStartYear}-07-01`;
  const fixturesStart = `${nextStartYear}-08-15`;
  const seasonEnd = `${nextEndYear}-06-30`;

  // Europapokal-Starter der neuen Saison AUS der abgelaufenen Saison ableiten
  // (Endtabelle + Landespokalsieger) – VOR dem Überschreiben von g.table/g.cup.
  // DDR-Start (game/ddrHome.ts): BRD-Starter ohne den FDGB-Pokal, dazu die DDR-Starter aus der Oberliga.
  const euroQuals = isDdrHome(g)
    ? mergeQualifiers(ddrEuroQualifiers(g), computeGermanEuroQualifiers({ ...g, cup: null } as Game, false))
    : computeGermanEuroQualifiers(g, false);
  // Supercup/Ligapokal: Teilnehmer ebenfalls jetzt festhalten (game/superCupGame.ts).
  const scSeeds = superCupSeeds(g);
  // Punkteregel des Heimatlandes (Deutschland: Chronik-Meilenstein 1995/96).
  if (!isGermanHome(g)) g.pointSystem = countryPointSystem(homeCountryOf(g), nextStartYear);
  if (homeExcluded(homeCountryOf(g), nextStartYear)) { euroQuals.ec = []; euroQuals.cwc = []; euroQuals.uefa = []; }
  // Versprechen zum ersten Training: Endstand festhalten, Auswertung nach dem Auf-/Abstieg.
  const promSnap = seasonPromiseSnapshot(g, Object.values(euroQuals).some((ids) => ids.includes(g.managedClubId)));
  const promDate = g.calendar.currentDate;
  // Finanzsaison abschließen (Bilanz, Marke, Ruf) solange Tabelle/Pokale noch vorliegen.
  const prevPerf = closeFinancialSeason(g, oldSeason, g.calendar.currentDate);
  historicSeasonClose(g, nextStartYear); // Option „Entwicklung der anderen Vereine“
  environmentSeasonChange(g, oldSeason, g.calendar.currentDate);

  // --- 1) Sim-Ligen zu Ende simulieren, damit alle Endtabellen feststehen ---
  for (const div of g.leagues.otherDivisions) {
    flushDivision(div, g.simClubs, g.pointSystem, g.season);
  }

  const oldPlayerTier = g.leagues.playerDivision.tier;
  // Auslandsligen: Spieltag-Simulation zu Ende spielen (game/worldLeagues.ts); die Endtabellen gehen an engine/world.ts.
  retireFullCountries(g); // ältere Spielstände ohne Lade-Migration (Sicherheitsnetz)
  // Bestenlisten, Die Besten der Saison und Goldener Schuh verteilen dieselben Tore auf dieselben
  // Kader – einmal je Liga rechnen (game/worldScorers.ts withLeanMemo; der Pool ändert sich hier nicht).
  const leanResults = withLeanMemo(() => {
    const res = worldLiveResults(g);
    // Die Besten der Saison in den 1. Ligen im Ausland (Note nach dem Maßstab der eigenen Liga).
    worldSeasonAwards(g, oldSeason, res.divs);
    // Goldener Schuh (alle 1. Ligen) + Elf der Saison im Ausland (game/extraAwardsGame.ts).
    worldExtraAwards(g, oldSeason, res.divs, g.calendar.currentDate);
    return res;
  });

  // --- 2) Endstände ALLER aktuellen Divisionen einlesen (Spielerliga + Sim) ---
  const pd = g.leagues.playerDivision;
  const isReunify = newSeason === '1991/92'
    && !g.appliedReforms.includes('reform-1991-reunification');
  // DDR-Start: Spielerliga ist eine DDR-Liga – bis zur Wiedervereinigung läuft sie mit den DDR-Ligen getrennt.
  const ddrSep = pd.id.startsWith('ddr-') && !isReunify;
  const pdEntry: CurrentDivision = { id: pd.id, tier: pd.tier, group: pd.group, name: pd.name, orderedIds: finalOrder(g, pd.id) };
  const current: CurrentDivision[] = ddrSep ? [] : [pdEntry];
  // DDR-Divisionen (tier 101/102) laufen normalerweise SEPARAT und dürfen den
  // West-Auf-/Abstieg nicht berühren – daher aus `current` heraushalten. NUR zur
  // Wiedervereinigungs-Saison 1991/92 werden sie mitgegeben, damit migrate1991
  // die DDR-Endstände in die gesamtdeutsche Pyramide integrieren kann.
  const ddrDivs = g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-'));
  for (const div of g.leagues.otherDivisions) {
    if (div.id.startsWith('ddr-') && !isReunify) continue;
    current.push({ id: div.id, tier: div.tier, group: div.group, name: div.name, orderedIds: finalOrder(g, div.id) });
  }
  // Vereinsprofil-Historie (Endplätze, Titel, direkter Vergleich) vor dem Überschreiben sichern.
  recordSeasonEnd(g, oldSeason, [...current, ...(ddrSep ? [pdEntry] : []), ...(isReunify ? [] : ddrDivs.map((d) => ({ id: d.id, tier: d.tier, group: d.group, name: d.name, orderedIds: finalOrder(g, d.id) })))]);
  // Liga-Archiv: Tabellen, Pokalrunden, Bestenlisten (game/leagueArchive.ts).
  archiveSeasonEnd(g, oldSeason);
  // Ergebnisse je Spieltag aller Ligen (Statistiken › Liga: Spieltage, Heim/Auswärts/Form) – game/leagueResults.ts.
  storeSeasonResults(g, oldSeason);
  // Höchste Amateurligen: Endstand vor dem Pool-Tausch (Meister haben Vorrang, game/amateurLeagues.ts).
  closeAmateurLeagues(g, ownAmateurTable(g));
  // Vereinsauszeichnungen (Bronze/Silber/Gold) für alle Vereine mit vollem Kader.
  honoursSeasonEnd(g, oldSeason);
  // Managerkarriere: Ansehen, Trainer- und Managerbilanz; Vereinswechsel nur nach dem Abstieg aus der untersten Liga
  const careerSw = careerSeasonStart(g);

  // --- 3) Auf-/Abstieg + evtl. Ligareform datengetrieben berechnen ---
  // Liegt für die neue Saison eine noch nicht angewandte Reform vor (z. B. 1981/82
  // eingleisige 2. Liga), führt computeSeasonTransition die Struktur-Migration aus;
  // sonst den generischen, strukturunabhängigen Auf-/Abstieg.
  // Anderes Heimatland: Zielgrößen aus der historischen Struktur des Landes (game/homeStructure.ts).
  const homePlan = isGermanHome(g) ? null : homeSeasonPlan(homeCountryOf(g), current, newSeason);
  const res: TransitionResult = computeSeasonTransition({
    newSeason,
    current,
    strengthOf: (id) => clubStrengthFor(g, id),
    cityOf: (id) => g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '',
    appliedReforms: g.appliedReforms,
    protectedId: ddrSep ? undefined : g.managedClubId,
    ...(homePlan ? { targets: homePlan.transition ?? homePlan.targets, regionHint: homeRegionHint(g, current, newSeason) } : {}),
  });
  const homePoolSwap = homePlan ? applyHomePlan(res, homePlan, current, newSeason, g.managedClubId, (id, n) => homeZoneOf(homeCountryOf(g), id, g.clubs[id]?.city ?? g.simClubs[id]?.city, n, nextStartYear)) : undefined;

  // Neue Plätze zuerst aus dem Vereins-Pool besetzen (game/clubPool.ts), dann fiktive
  // Platzhalter aufnehmen; entfallene Vereine wechseln in den Pool (Platzhalter verschwinden).
  absorbPlaceholders(g, res, newSeason);
  for (const ph of res.placeholders) g.simClubs[ph.id] = ph;
  const pooled: string[] = [];
  for (const id of res.dropped) {
    if (id.startsWith('ph-')) delete g.simClubs[id];
    else pooled.push(id);
  }

  const promoted = res.promotedTop;
  const relegated = res.relegatedTop;

  // --- 4) Mitgliedschaften + Spielerliga bestimmen ---
  const membership: Record<string, { ids: string[]; meta: DivisionMeta }> = {};
  for (const d of res.divisions) membership[d.meta.id] = { ids: d.ids, meta: d.meta };
  // Sollgrößen absichern (Reform-/Relegationssonderfälle dürfen keine Liga
  // dauerhaft verzerren). Ausnahme: die bewusst übergroße Wiedervereinigungssaison.
  // Anderes Heimatland (Weltdaten): Ligagrößen nach der historischen Struktur, keine deutschen Reformen.
  const homeTargets = homePlan ? homePlan.targets : structureForSeason(newSeason);
  if (!isReunify) balanceDivisions(membership, homeTargets, (id) => clubStrengthFor(g, id), g.managedClubId);
  // Auf-/Abstieg zwischen unterster simulierter Liga und Amateurligen (Vereins-Pool).
  if (!res.reform) pooled.push(...poolExchange(g, membership, current, newSeason, g.managedClubId, homePoolSwap));
  // Zweite Mannschaften nach den Regeln der Zeit einordnen (game/reservePyramid.ts).
  const resT = reserveTransition(g, membership, newSeason);
  pooled.push(...homeBTeamTransition(g, membership, newSeason)); // B-Teams im Heimatland (Spanien, Portugal)
  pooled.push(...resT.pooled);
  // DDR-Start: Auf-/Abstieg Oberliga ↔ DDR-Liga ↔ DDR-Pool inkl. Spielerliga (eigener Verein nie in den Pool).
  if (ddrSep && nextStartYear < 1991) {
    const orders = [pdEntry, ...ddrDivs.map((d) => ({ id: d.id, tier: d.tier, group: d.group, name: d.name, orderedIds: finalOrder(g, d.id) }))];
    const ddrNew = ddrExchange(g, orders, newSeason, g.managedClubId);
    const ob = orders.find((d) => d.tier === 101), li = orders.find((d) => d.tier === 102);
    if (ob && li) ddrReserveTransition(g, ddrNew, ob.id, li.id, nextStartYear);
    for (const d of orders) membership[d.id] = { ids: ddrNew[d.id] ?? d.orderedIds, meta: { id: d.id, name: d.name, tier: d.tier, group: d.group } };
  }

  const playerDivId = Object.keys(membership).find((k) => membership[k].ids.includes(g.managedClubId))
    || res.divisions[0].meta.id;
  const playerIds = membership[playerDivId].ids;
  const playerSet = new Set(playerIds);

  // Reverse-Map: Verein-ID → Tier/Gruppe der neuen Saison.
  const divOf: Record<string, { tier: number; group: LeagueGroup }> = {};
  for (const key of Object.keys(membership)) {
    for (const id of membership[key].ids) divOf[id] = { tier: membership[key].meta.tier, group: membership[key].meta.group };
  }

  // --- 5) Repräsentation abgleichen: NUR die Spielerliga hat volle Kader ---
  // 5a) Sim → Voll für Vereine, die in die Spielerliga aufsteigen/einziehen.
  for (const id of playerIds) {
    if (!g.clubs[id]) {
      const sc = g.simClubs[id];
      if (sc) {
        g.clubs[id] = buildProClub(sc, g.managedClubId, seasonStart, g.players, g.youthPlayers, levelOfTier(membership[playerDivId].meta.tier));
        delete g.simClubs[id];
      }
    }
  }
  // Ausnahmetalente bleiben in der Spielerliga (game/legendsGame.ts).
  rescueLegends(g, playerSet, seasonStart);
  // 5b) Voll → Sim für volle Vereine, die die Spielerliga verlassen (Amateur-
  //     vereine des Pokals bleiben unangetastet).
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am')) continue;
    // Für den Europapokal materialisierte Auslandsvereine nicht in deutsche Ligen
    // übernehmen – der Kader wird beim nächsten Duell neu erzeugt.
    if (isForeignId(c.id)) {
      for (const pid of c.playerIds) delete g.players[pid];
      delete g.clubs[c.id];
      continue;
    }
    if (playerSet.has(c.id)) continue;
    // DDR-Verein ohne neue Liga (DDR-Pool) bzw. nach der Wende: Kennung `ddr` bleibt (game/ddrHome.ts).
    const ddrClub = isDdrHome(g) && isDdrClub(g, c.id);
    const dest = divOf[c.id] ?? (ddrClub && ddrSep ? { tier: DDR_POOL_TIER, group: 'nordost' as LeagueGroup } : { tier: 2, group: 'nord' as LeagueGroup });
    g.simClubs[c.id] = simClubFromClub(c, g.players, dest.tier, dest.group);
    if (ddrClub) g.simClubs[c.id].ddr = true;
    for (const pid of c.playerIds) delete g.players[pid];
    for (const yid of (c.youthPlayerIds || [])) delete g.youthPlayers[yid];
    delete g.clubs[c.id];
  }
  // 5c) Tier/Gruppe aller Sim-Vereine auf die neue Saison aktualisieren.
  for (const id of Object.keys(g.simClubs)) {
    if (divOf[id]) { g.simClubs[id].tier = divOf[id].tier; g.simClubs[id].group = divOf[id].group; }
  }

  settlePool(g, pooled);
  if (isReunify) { mergeDdrPool(g); syncDdrReserves(g, [], [], 1991); } // DDR-Reserven gibt es seit 1990/91 nicht mehr
  // DDR-Start: ab 1991/92 gesamtdeutsch, Heimatland Deutschland (game/ddrHome.ts).
  if (isDdrHome(g)) ddrRenameClubs(g, nextStartYear); // Umbenennungen (Weltdaten), auch noch zur Wende-Saison
  if (isReunify && isDdrHome(g)) ddrReunifyHome(g, membership[playerDivId].meta.name);

  // --- 6) Spielerliga: neuer Spielplan + Tabelle (volle Engine) ---
  const playerClubList = playerIds.map((id) => g.clubs[id]).filter(Boolean) as Club[];
  const newPdTier = membership[playerDivId].meta.tier;
  const fixtures = generateFixtures(playerClubList, fixturesStart, { tier: levelOfTier(newPdTier), spread: true, ...(newPdTier > 100 && newPdTier < 109 ? { kind: 'ddr' as const } : {}) });
  for (const m of fixtures) {
    m.involvesPlayerClub = m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId;
  }
  g.fixtures = fixtures;
  g.table = calculateTable(playerClubList, fixtures, g.pointSystem, newSeason);

  // --- 7) Übrige Divisionen als Sim-Ligen neu aufbauen ---
  const otherDivisions: LeagueDivision[] = [];
  for (const key of Object.keys(membership)) {
    if (key === playerDivId) continue;
    otherDivisions.push(buildDivision(membership[key].meta, membership[key].ids, g.pointSystem, newSeason, fixturesStart));
  }
  // DDR-Ligen bleiben bis zur Wiedervereinigung SEPARAT bestehen: mit gleicher
  // Mannschaftsbesetzung für die neue Saison neu aufbauen. Ab 1991/92 (isReunify)
  // sind die DDR-Vereine integriert und die separate Struktur ist aufgelöst.
  if (nextStartYear < 1991 && !isReunify && !ddrSep) {
    // Auf-/Abstieg Oberliga ↔ DDR-Liga ↔ DDR-Pool (game/clubPool.ts).
    const ddrNew = ddrExchange(g, ddrDivs.map((d) => ({ id: d.id, tier: d.tier, orderedIds: finalOrder(g, d.id) })), newSeason);
    // Zweite Mannschaften der Oberligisten: DDR-Liga / Nachwuchsoberliga je Epoche (game/ddrReserves.ts).
    const ob = ddrDivs.find((d) => d.tier === 101), li = ddrDivs.find((d) => d.tier === 102);
    if (ob && li) ddrReserveTransition(g, ddrNew, ob.id, li.id, nextStartYear);
    for (const d of ddrDivs) {
      otherDivisions.push(buildDivision(
        { id: d.id, name: d.name, tier: d.tier, group: d.group },
        ddrNew[d.id] ?? d.clubIds, g.pointSystem, newSeason, fixturesStart,
      ));
    }
  }
  g.leagues = { playerDivision: membership[playerDivId].meta, otherDivisions, season: newSeason };
  poolDrift(g, newSeason);
  refillPool(g, newSeason); // Pool nie leer laufen lassen (game/clubPool.ts)
  syncReserveClubs(g, nextStartYear); // Namen/Stärke der zweiten Mannschaften
  historicSimClubs(g, nextStartYear);

  const calendar = generateSeasonCalendar(fixtures, seasonStart, seasonEnd);
  calendar.speedMs = g.calendar.speedMs;

  // --- 8) Landespokal der neuen Saison (Feld bleibt 32: volle Ligavereine + Amateure) ---
  // Amateure der Lizenzvereine im Pokal bis 2007/08 (game/reservePyramid.ts).
  const resCup = reserveCupClubs(g, resT.cup, seasonStart);
  const allAm = Object.keys(g.clubs).filter((id) => id.startsWith('am') && !isReserveCupId(id));
  // Anderes Heimatland: B-Teams im Pokal nur nach Landesregel (engine/worldReserves.ts).
  const blClubIds = cupField(homeCountryKey(g), nextStartYear, playerClubList.map((c) => c.id));
  const amateurIds = [...resCup, ...allAm].slice(0, Math.max(0, 32 - blClubIds.length));
  // Rahmenterminkalender: Pokalrunden meiden Liga-Hauptspieltage und Europapokal-Wochen.
  const cupAvoid = leagueDateSet(fixtures);
  const euroWeeks = euroFrameDates(nextStartYear);
  const cup = createCup(
    blClubIds, amateurIds, cupAvoid,
    hashSeed(g.managedClubId + ':' + nextStartYear), calendar.seasonStartDate, g.managedClubId, true, euroWeeks,
  );
  addCupCalendarEvents(calendar, cup, cupAvoid, euroWeeks);
  // Auslosung erst am historischen Termin (game/cupDraw.ts).
  scheduleDraws(cup, 'cup', calendar);
  g.cup = cup;
  g.calendar = calendar;
  g.season = newSeason;

  // --- 7c) Sponsoring 2.0: Laufzeiten, Abstiegsklauseln, Angebote, KI-Abschlüsse (game/sponsorGame.ts) ---
  sponsorSeasonStart(g, newSeason, calendar.seasonStartDate);
  cateringSeasonStart(g, newSeason); // Catering-Vertrag läuft ab → Eigenbetrieb, neue Angebote
  // Vertrag 2.0: Abstiegsklausel, gestaffelte Gehälter, Klassenerhalt-Prämien (game/contractClausesGame.ts)
  contractSeasonStart(g);

  // --- 8a) Europapokale der neuen Saison (drei Wettbewerbe, EC/CWC/Europa-Verband) ---
  const euroClubs = g.euroClubs ?? allEuroClubs();
  g.euroClubs = euroClubs;
  // Europa im Hintergrund: abgelaufene Saison aller Auslandsligen durchrechnen,
  // Koeffizienten werten und die ausländischen Starter bestimmen.
  if (!g.world) g.world = initWorld(euroClubs, nextStartYear);
  historicWorld(g, g.world, euroClubs, nextStartYear);
  const worldRes = advanceWorldSeason(
    g.world, euroClubs, oldSeason, nextStartYear, g.pointSystem === '3-point' ? 3 : 2,
    g.euroCups as any, (id) => !!g.clubs[id] || (!!g.simClubs?.[id] && g.simClubs[id].tier < 200),
    leanResults.fixed, leagueRepHook(g),
  );
  { // Auslandsligen mit allen Ergebnissen in die Welt-Historie; die neue Saison legt `worldLiveDaily` an
    const rec = g.world.history[g.world.history.length - 1];
    if (rec && rec.season === oldSeason && Object.keys(leanResults.divs).length) rec.divs = leanResults.divs;
    if (rec && rec.season === oldSeason && Object.keys(leanResults.cups).length) rec.cups = leanResults.cups;
    if (rec && rec.season === oldSeason && Object.keys(leanResults.scorers).length) {
      // Bestenlisten (`pstats`, kompakt); die reine Torschützenliste nur noch, wo keine Bestenliste vorliegt
      // (sie wird nur dann gelesen – game/competitionCountry.ts archivedStats; Spielstand-Größe).
      rec.pstats = leanResults.pstats;
      const sc = Object.fromEntries(Object.entries(leanResults.scorers).filter(([k]) => !leanResults.pstats[k]));
      if (Object.keys(sc).length) rec.scorers = sc;
    }
    if (rec && rec.season === oldSeason && Object.keys(leanResults.deep).length) rec.deep = leanResults.deep;
    g.world.live = undefined;
  }
  // Tiefere Ebenen der Auslandsligen nach Rang der Länderwertung (engine/worldDeep.ts; alte Spielstände bekommen sie hier).
  updateWorldDepths(g.world, euroClubs, nextStartYear);
  historicWorldAfter(g, g.world, euroClubs, nextStartYear);
  for (const note of worldRes.notes) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'milestone', from: 'Fußball-Chronik',
      subject: 'Europas Fußball-Landkarte ändert sich', shortText: note, bodyText: note, actionRequired: false,
    }));
  }
  g.euroCups = buildEuroCupsForSeason(
    euroQuals, euroClubs, leagueDateSet(fixtures, otherDivisions.filter((d) => d.tier === 1)), cupDateSet(cup),
    g.managedClubId + ':' + nextStartYear, calendar.seasonStartDate, g.managedClubId, calendar,
    worldRes.participants, true,
  );
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const ec = g.euroCups[comp];
    if (!ec) continue;
    const dmsg = euroDrawMessage(comp, ec, g.clubs, euroClubs, g.managedClubId, 0, calendar.currentDate);
    if (dmsg) pushMessage(g.messages, dmsg);
  }
  // Rahmenterminkalender: Fr/So/Mo-Spiele an Pokal-/Europapokalwochen anpassen (game/fixtureWatch.ts).
  harmonizeSeason(g);
  // Andere Kontinente: Meister des Vorjahres + Kontinentalpokale (game/continents.ts) – Teilnehmer für den Weltpokal.
  ensureContinents(g, nextStartYear);
  // Supercups & Ligapokal vor dem Ligastart, übrige Länder ins Archiv (game/superCupGame.ts);
  // danach Weltpokal/Klub-WM (game/intercontinental.ts).
  setupSuperCups(g, scSeeds);

  // --- 8b) Ligareform: Meilenstein-Nachricht + Reform als angewandt vormerken ---
  // Wurde diese Saison eine Struktur-Reform ausgeführt, meldet die Fußball-Chronik
  // den Umbau. Die Reform wird gespeichert, damit sie beim erneuten Laden eines
  // Spielstands nicht ein zweites Mal migriert (Doppel-Migration verhindert).
  // Die Reform selbst erklärt das Saison-Briefing („Neu im Spiel“, game/seasonBriefing.ts).
  if (res.reform) {
    const rf = res.reform;
    if (!g.appliedReforms.includes(rf.reformId)) g.appliedReforms.push(rf.reformId);
  }

  // Meilensteine dieser Saison auslösen (z. B. 1995/96 → 3-Punkte-Regel). Ohne Einzel-
  // Nachrichten: Sie stehen gesammelt im Saison-Briefing (recordSeasonBriefing unten).
  fireTimelineForSeason(g, newSeason, calendar.currentDate, true);

  // --- 9) Nachrichten: Auf-/Abstieg des eigenen Vereins + Ligaüberblick ---
  const newPlayerTier = membership[playerDivId].meta.tier;
  const playerDivName = membership[playerDivId].meta.name;
  if (careerSw) {
    // Vereinswechsel: Willkommen kommt aus game/careerSwitch.ts, kein Auf-/Abstiegstext.
  } else if (newPlayerTier < oldPlayerTier) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
      subject: `Aufstieg! Willkommen in der ${playerDivName}`,
      shortText: 'Der Verein ist aufgestiegen – ein historischer Erfolg!',
      bodyText: `Herzlichen Glückwunsch! ${g.clubs[g.managedClubId].name} hat den Aufstieg geschafft und `
        + `spielt in der Saison ${newSeason} in der ${playerDivName}. `
        + `Der Vorstand ist stolz auf die Mannschaft und das Trainerteam.`,
    }));
  } else if (newPlayerTier > oldPlayerTier) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
      subject: `Abstieg in die ${playerDivName}`,
      shortText: 'Der Verein ist abgestiegen – jetzt gilt der direkte Wiederaufstieg.',
      bodyText: `Die Saison endete mit dem Abstieg. ${g.clubs[g.managedClubId].name} tritt ${newSeason} in der `
        + `${playerDivName} an. Der Vorstand erwartet den `
        + `sofortigen Wiederaufstieg – Kader und Etat werden angepasst.`,
    }));
  }
  const l1 = leagueName(homeCountryOf(g), 1);
  const ruleText = res.reform
    ? `Aufstiegsregel: ${res.reform.qualificationRule}`
    : `Aufstiegsregel: Die Staffelmeister der unteren Ebene steigen auf, die Schlechtesten der oberen `
      + `Ebene ab; alle Staffelgrößen bleiben konstant.`;
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'media', from: 'Sportredaktion',
    subject: `Auf- und Abstieg ${oldSeason} → ${newSeason}`,
    shortText: `Aufsteiger in die ${l1} und Absteiger stehen fest.`,
    bodyText: `Aufsteiger in die ${l1}: ${promoted.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n`
      + `Absteiger aus der ${l1}: ${relegated.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n\n`
      + `${ruleText}`,
  }));

  const firstDraw = nextDrawDate(cup);
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
    subject: `Die neue Saison ${newSeason} beginnt`,
    shortText: `Spielplan und Landespokal für ${newSeason} stehen fest.`,
    bodyText: `Willkommen zur Saison ${newSeason}! Der Spielplan der Liga steht. `
      + (firstDraw ? `Die ${firstDraw.round} des Landespokals wird am ${CalendarEngine.formatDate(firstDraw.date)} ausgelost. ` : '')
      + `Die Vorbereitung läuft – nutze die Transferphase und das Training.`,
  }));
  careerSeasonSwitchFinish(g, careerSw);
  // Saisonbilanz als Station festhalten, Saisonstatistik für die neue Saison leeren.
  closeSeason(g.players, g.clubs, oldSeason);
  manageSquads(g, calendar.currentDate, !!(g as any).simAutoManage);
  seasonShirtNumbers(g, nextStartYear); // Rückennummern: bis 1992/93 Stammelf 1–11 nach Position (engine/shirtNumbers.ts)
  historicMoney(g, nextStartYear, calendar.currentDate);
  openFinancialSeason(g, newSeason, calendar.currentDate, prevPerf);
  staffSeasonChange(g, calendar.currentDate);
  youthPoachingAtSeasonChange(g, calendar.currentDate);
  setSeasonGoal(g, calendar.currentDate);
  // Neue Saison, evtl. neue Epoche: Positionsstärken aller Spieler neu bewerten.
  setEraYear(Number(calendar.currentDate.slice(0, 4)));
  retireLibero(g, Number(calendar.currentDate.slice(0, 4))); // ab 2000/01 keine Libero-Systeme/-Stammpositionen mehr
  for (const p of Object.values(g.players)) if (!p.isYouth) refreshOverall(p);
  // Weltspieler: Entwicklung, Karriereende, Nachrücker, Wechsel (game/worldPool.ts).
  worldPoolSeason(g);
  // Saison-Briefing („Was ist neu?“) festhalten und zum Anzeigen vormerken.
  settleSeasonPromises(g, promSnap, promDate);
  recordSeasonBriefing(g);
  // Saisonbudget des Finanzberaters (game/budgetPlan.ts): Plan anlegen, Popup nach dem Briefing.
  recordBudgetPlan(g, { pending: true });
}

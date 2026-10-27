// Erzeugt ein neues Spiel (Welt, Spielplan, Pokale, Ligen) – ohne Oberfläche, auch für Simulationen.
import { setEraYear } from '../engine/positions';
import { updateScoutEstimate } from '../engine/scouting';
import { snapshotAttributes } from '../engine/history';
import { EuroCompId, allEuroClubs } from '../data/europe';
import { generateCupAmateurs, generateWorld } from '../data/generate';
import { LEAGUE_REFORMS } from '../data/reforms';
import { seasonStartYear, timelineEventsUpTo } from '../data/timeline';
import { generateSeasonCalendar } from '../engine/calendar';
import { createCup } from '../engine/cup';
import { yearOf } from '../engine/economy';
import { computeGermanEuroQualifiers } from '../engine/euro';
import { applyFacilityEffects, makeInfrastructure } from '../engine/infrastructure';
import { calculateTable, generateFixtures } from '../engine/league';
import { advanceDivision } from '../engine/leagues';
import { autoFillLineup } from '../engine/lineupAI';
import { makeMessage, pushMessage } from '../engine/messages';
import { AppSettings, loadGame, loadSettings, saveSettings } from '../engine/save';
import { createDefaultWeeklyPlan } from '../engine/weeklyTraining';
import { academyStartingCohort, generateYouthPlayer } from '../engine/youth';
import { initWorld } from '../engine/world';
import { makeCandidates } from '../engine/staffPeople';
import { allocateTv, commercialAnnualFor, isLeagueClub, refreshMarketValues } from '../engine/clubEconomy';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, cupDrawMessage, euroDrawMessage, leagueDateSet } from './competitions';
import { buildDivision, DivisionMeta, simClubFromClub } from '../engine/leagues';
import { buildProClub } from '../data/generate';
import { seasonExpectation } from '../engine/environment';
import { buildDdrDivisions, buildLeagueSystem, buildSecondLigaSimClubs, historicPointSystem } from './leagueSetup';
import { applyTimelineEffect, fireTimelineForSeason } from './season';
import { Game, hashSeed, migrateCommerce } from './state';
import { InboxMessage, NewGameOptions, YOUTH_ENTRY_AGE } from '../types';
import { setDisplayYear } from '../ui/format';

export function createNewGame(opts: NewGameOptions): Game {
  setEraYear(1975);
  // Punktesystem historisch fest ableiten (Spielstart immer 1975/76 → 2-Punkte-Regel).
  // Die Umstellung auf 3 Punkte erfolgt automatisch beim Meilenstein 1995/96.
  const pointSystem = historicPointSystem('1975/76');
  const world = generateWorld(opts.managedClubId);
  // --- Start in der 2. Liga? Dann wird deren Staffel zur Spielerliga (volle Kader),
  //     die 1. Liga läuft simuliert. Jeder Verein ist wählbar. ---
  const simClubs = buildSecondLigaSimClubs();
  const startSim = simClubs[opts.managedClubId];
  let playerDivMeta: DivisionMeta = { id: 'tier1', name: '1. Liga', tier: 1, group: null };
  let tier1SimIds: string[] = [];
  if (startSim) {
    tier1SimIds = Object.keys(world.clubs);
    for (const id of tier1SimIds) {
      const c = world.clubs[id];
      simClubs[id] = simClubFromClub(c, world.players, 1, null);
      for (const pid of c.playerIds) delete world.players[pid];
      for (const yid of c.youthPlayerIds ?? []) delete world.youthPlayers[yid];
      delete world.clubs[id];
    }
    const group = startSim.group;
    for (const sc of Object.values(simClubs).filter((x) => x.tier === 2 && x.group === group)) {
      world.clubs[sc.id] = buildProClub(sc, opts.managedClubId, '1975-07-01', world.players, world.youthPlayers);
      delete simClubs[sc.id];
    }
    playerDivMeta = { id: `tier2-${group}`, name: `2. Liga ${group === 'nord' ? 'Nord' : 'Süd'}`, tier: 2, group };
  }
  const clubList = Object.values(world.clubs);
  const fixtures = generateFixtures(clubList);
  for (const m of fixtures) {
    m.involvesPlayerClub = m.homeClubId === opts.managedClubId || m.awayClubId === opts.managedClubId;
  }
  const table = calculateTable(clubList, fixtures, pointSystem);
  const calendar = generateSeasonCalendar(fixtures);
  calendar.speedMs = opts.speedMs;
  const club = world.clubs[opts.managedClubId];
  if (startSim && club) {
    // Saisonziel in der 2. Liga aus der Kaderstärke ableiten.
    const str = (c: typeof club) => {
      const o = c.playerIds.map((id) => world.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
      return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length);
    };
    const ranked = [...clubList].sort((a, b) => str(b) - str(a));
    club.boardExpectation = seasonExpectation(ranked.findIndex((c) => c.id === club.id) + 1, ranked.length, 2);
  }

  // --- Landespokal aufsetzen: 14 Amateurvereine ergänzen (→ 32er-Feld) ---
  const amateurs = generateCupAmateurs(Math.max(0, 32 - clubList.length));
  Object.assign(world.clubs, amateurs.clubs);
  Object.assign(world.players, amateurs.players);
  const blClubIds = clubList.map((c) => c.id);
  const cup = createCup(
    blClubIds,
    Object.keys(amateurs.clubs).slice(0, Math.max(0, 32 - blClubIds.length)),
    leagueDateSet(fixtures),
    hashSeed(opts.managedClubId + ':1980'),
    calendar.seasonStartDate,
    opts.managedClubId,
  );
  addCupCalendarEvents(calendar, cup);
  const welcome = makeMessage({
    date: calendar.currentDate,
    category: 'board',
    from: 'Vereinsvorstand',
    subject: `Willkommen bei ${club.name}, ${opts.manager.name}!`,
    shortText: 'Der Vorstand heißt dich willkommen und nennt das Saisonziel.',
    bodyText: `Sehr geehrte(r) ${opts.manager.name},\n\nherzlich willkommen als neue(r) Cheftrainer(in) von ${club.name}! Wir freuen uns auf die Zusammenarbeit in der Saison 1975/76.\n\nUnser Ziel: ${club.boardExpectation}\n\nDie Mannschaft steht bereit, der Kader ist einsatzfähig. Nutze das Training und den Transfermarkt klug. Wir vertrauen auf dein Geschick.\n\nSportliche Grüße\nDer Vorstand von ${club.name}`,
    actionRequired: false,
  });
  const cupDraw = cupDrawMessage(cup, world.clubs, opts.managedClubId, calendar.currentDate);
  // --- Europapokal 1975/76: feste historische deutsche Starter aufsetzen ---
  const euroClubs = allEuroClubs();
  const euroQuals = computeGermanEuroQualifiers(
    { clubs: world.clubs, simClubs, players: world.players, managedClubId: opts.managedClubId, pointSystem } as any,
    true,
  );
  const euroCups = buildEuroCupsForSeason(
    euroQuals, euroClubs, leagueDateSet(fixtures), cupDateSet(cup),
    opts.managedClubId + ':1975', calendar.seasonStartDate, opts.managedClubId, calendar,
  );
  const euroDrawMsgs: InboxMessage[] = [];
  (['ec', 'cwc', 'uefa'] as EuroCompId[]).forEach((comp) => {
    const ec = euroCups[comp];
    if (ec) {
      const m = euroDrawMessage(comp, ec, world.clubs, euroClubs, opts.managedClubId, 0, calendar.currentDate);
      if (m) euroDrawMsgs.push(m);
    }
  });
  // --- Mehrstufiges Ligasystem: 2. Liga Nord/Süd (aggregiert simuliert) ---
  const ligaStart = fixtures[0]?.date ?? calendar.seasonStartDate;
  const leagues = startSim
    ? {
      playerDivision: playerDivMeta,
      otherDivisions: [
        buildDivision({ id: 'tier1', name: '1. Liga', tier: 1, group: null }, tier1SimIds, pointSystem, '1975/76', ligaStart),
        ...(['nord', 'sued'] as const).filter((gr) => gr !== startSim.group).map((gr) => buildDivision(
          { id: `tier2-${gr}`, name: `2. Liga ${gr === 'nord' ? 'Nord' : 'Süd'}`, tier: 2, group: gr },
          Object.values(simClubs).filter((x) => x.tier === 2 && x.group === gr).map((x) => x.id), pointSystem, '1975/76', ligaStart,
        )),
      ],
      season: '1975/76',
    }
    : buildLeagueSystem(simClubs, pointSystem, '1975/76', ligaStart);
  // Parallele DDR-Ligapyramide (bis zur Wiedervereinigung 1991/92) ergänzen.
  leagues.otherDivisions.push(...buildDdrDivisions(simClubs, pointSystem, '1975/76', ligaStart));
  const g0: Game = {
    clubs: world.clubs, players: world.players, youthPlayers: world.youthPlayers,
    fixtures, table, calendar,
    pointSystem, managedClubId: opts.managedClubId, season: '1975/76',
    manager: opts.manager, difficulty: opts.difficulty, injuriesEnabled: opts.injuriesEnabled,
    messages: [cupDraw, ...euroDrawMsgs, welcome],
    trainingPlan: createDefaultWeeklyPlan(),
    cup,
    euroCups,
    euroClubs,
    world: initWorld(euroClubs),
    firedMilestones: [],
    unlockedFeatures: [],
    hiredStaff: [],
    marketing: {},
    activities: [],
    leagues,
    simClubs,
    appliedReforms: [],
  };
  // Startsaison-Meilensteine (1975/76) sofort auslösen → Chronik-Nachricht + Effekte.
  fireTimelineForSeason(g0, '1975/76', calendar.currentDate);
  for (const pid of g0.clubs[g0.managedClubId]?.playerIds ?? []) {
    const p = g0.players[pid];
    if (p) snapshotAttributes(p, calendar.currentDate, 'Spielbeginn');
  }
  // Erste Scout-Einschätzung: eigener Kader genauer als fremde Spieler.
  for (const p of Object.values(g0.players)) if (!p.isYouth) updateScoutEstimate(p, p.clubId === g0.managedClubId ? 0.4 : 0.2, p.clubId === g0.managedClubId);
  // Finanzen 2.0: zentrale TV-Verteilung der ersten Saison (Ruf als Leistungsmaß).
  const leagueClubs = Object.values(g0.clubs).filter(isLeagueClub);
  const byRep = [...leagueClubs].sort((a, b) => b.reputation - a.reputation).map((c) => c.id);
  refreshMarketValues(g0.players);
  // Grundausstattung des Stabs: Co-Trainer, Masseur, Mannschaftsarzt (je eine erfahrene Kraft).
  g0.staff = ['cotrainer', 'masseur', 'mannschaftsarzt'].map((roleId) => ({
    ...makeCandidates(roleId, 1975, g0.clubs[g0.managedClubId]?.reputation ?? 60, Math.random)[1], hired: calendar.currentDate,
  }));
  g0.hiredStaff = g0.staff.map((m) => m.roleId);
  const startTier = g0.leagues.playerDivision.tier;
  for (const c of leagueClubs) c.finances.commercialAnnual = commercialAnnualFor(c, startTier, 1975);
  allocateTv(leagueClubs, startTier, 1975, (id) => 1 - byRep.indexOf(id) / Math.max(1, byRep.length - 1));
  return g0;
}

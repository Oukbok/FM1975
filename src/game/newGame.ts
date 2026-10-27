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
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, cupDrawMessage, euroDrawMessage, leagueDateSet } from './competitions';
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
  const clubList = Object.values(world.clubs);
  const fixtures = generateFixtures(clubList);
  for (const m of fixtures) {
    m.involvesPlayerClub = m.homeClubId === opts.managedClubId || m.awayClubId === opts.managedClubId;
  }
  const table = calculateTable(clubList, fixtures, pointSystem);
  const calendar = generateSeasonCalendar(fixtures);
  calendar.speedMs = opts.speedMs;
  const club = world.clubs[opts.managedClubId];

  // --- Landespokal aufsetzen: 14 Amateurvereine ergänzen (→ 32er-Feld) ---
  const amateurs = generateCupAmateurs(14);
  Object.assign(world.clubs, amateurs.clubs);
  Object.assign(world.players, amateurs.players);
  const blClubIds = clubList.map((c) => c.id);
  const cup = createCup(
    blClubIds,
    Object.keys(amateurs.clubs),
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
    { clubs: world.clubs, players: world.players, managedClubId: opts.managedClubId, pointSystem } as any,
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
  const simClubs = buildSecondLigaSimClubs();
  const ligaStart = fixtures[0]?.date ?? calendar.seasonStartDate;
  const leagues = buildLeagueSystem(simClubs, pointSystem, '1975/76', ligaStart);
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
  return g0;
}

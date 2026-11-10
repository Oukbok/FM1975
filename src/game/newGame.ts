import { recordSeasonBriefing } from './seasonBriefing';
import { recordBudgetPlan } from './budgetPlan';
import { migratePositionSkills } from './positionsGame';
import { ensureStadiumBlocks } from './stadiumGame';
import { migrateSeating } from './seatingGame';
import { ensureYouthTeams } from './youthTeams';
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
import { ensureStaffWorld } from './staffWorld';
import { academyStartingCohort, generateYouthPlayer, setYouthSalt } from '../engine/youth';
import { initWorld } from '../engine/world';
import { makeCandidates } from '../engine/staffPeople';
import { allocateTv, commercialAnnualFor, isLeagueClub, refreshMarketValues } from '../engine/clubEconomy';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, euroDrawMessage, leagueDateSet } from './competitions';
import { euroFrameDates } from './euroSetup';
import { harmonizeSeason } from './fixtureWatch';
import { scheduleDraws } from './cupDraw';
import { buildDivision, DivisionMeta, simClubFromClub } from '../engine/leagues';
import { buildProClub } from '../data/generate';
import { seasonExpectation } from '../engine/environment';
import { buildDdrDivisions, buildSecondLigaSimClubs, historicPointSystem } from './leagueSetup';
import { COUNTRY_BY_CC, countryOrigin, countryPointSystem, seasonLabelOf } from '../data/world/countries';
import { setHomeOrigin } from '../data/origins';
import { composeHome, ddrSeedsFor, secondSimClubs } from './worldCompose';
import { amateurTownsFor, clampStartYear, fillLowerTiers, padSecondTier, reformsAppliedAt, seedPreStartHistory, seedStartPool, startEuroQualifiers } from './startYear';
import { needsOverlay, worldOverlay } from '../engine/worldData';
import { buildFullCountries, fullCandidates } from './fullCountries';
import { setHomeLabel, type LeagueDivision, type LeagueGroup } from '../engine/leagues';
import { applyTimelineEffect, fireTimelineForSeason } from './season';
import { Game, hashSeed, migrateCommerce } from './state';
import { initSponsorship } from './sponsorGame';
import { InboxMessage, NewGameOptions, YOUTH_ENTRY_AGE } from '../types';
import { setDisplayYear } from '../ui/format';
import { ensureCoaches } from './coachCarousel';
import { migrateYouthInvest } from './youthInvest';
import { migrateYouthComps } from './youthComps/daily';
import { FINANCE_LEVEL } from './financeMigration';
import { migrateLeaguePool } from './clubPool';
import { initLegends } from './legendsGame';
import { migrateContracts2 } from './contractClausesGame';
import { bindHonours } from './clubHonours';
import { ensureWorldPool } from './worldPool';
import { ensureCountryPools } from '../engine/world';

export function createNewGame(opts: NewGameOptions): Game {
  // Startjahr/Heimatland (Wunsch Pascal, Weltdaten): Standard 1. Juli 1975 in Deutschland.
  const year = clampStartYear(opts.startYear);
  const home = opts.country && COUNTRY_BY_CC[opts.country] && opts.country !== 'gdr' ? opts.country : 'ger';
  const isGer = home === 'ger';
  const season = seasonLabelOf(year);
  const startISO = `${year}-07-01`;
  const fxStart = `${year}-08-15`;
  setHomeOrigin(isGer ? null : countryOrigin(home));
  setHomeLabel(COUNTRY_BY_CC[home].name);
  setEraYear(year);
  // Punktesystem historisch fest ableiten (Deutschland: 3 Punkte ab 1995/96 über den Meilenstein;
  // andere Länder nach ihrem Einführungsjahr, data/world/countries.ts).
  const pointSystem = isGer ? historicPointSystem(season) : countryPointSystem(home, year);
  // Eigenes Salz je Spiel: Talente entstehen in jedem Spiel anders (engine/youth.ts).
  const youthSalt = `|${Math.floor(Math.random() * 2 ** 31).toString(36)}`;
  setYouthSalt(youthSalt);
  // Zusammensetzung der Ligen (game/worldCompose.ts); null = Deutschland 1975 wie bisher.
  const comp = composeHome(home, year);
  if (!isGer && !comp) throw new Error(`Keine Ligadaten für ${home} ${season}.`);
  const world = generateWorld(opts.managedClubId, comp ? { seeds: comp.tier1, date: startISO } : undefined);
  // --- Start in der 2. Liga? Dann wird deren Staffel zur Spielerliga (volle Kader),
  //     die 1. Liga läuft simuliert. Jeder Verein ist wählbar. ---
  const seconds: { group: LeagueGroup; name: string }[] = comp
    ? comp.second.map((x) => ({ group: x.group, name: x.name }))
    : [{ group: 'nord', name: '2. Liga Nord' }, { group: 'sued', name: '2. Liga Süd' }];
  const simClubs = comp ? secondSimClubs(comp) : buildSecondLigaSimClubs();
  const secondId = (gr: LeagueGroup) => (gr ? `tier2-${gr}` : 'tier2');
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
      world.clubs[sc.id] = buildProClub(sc, opts.managedClubId, startISO, world.players, world.youthPlayers);
      delete simClubs[sc.id];
    }
    playerDivMeta = { id: secondId(group), name: seconds.find((x) => x.group === group)?.name ?? '2. Liga', tier: 2, group };
  }
  const clubList = Object.values(world.clubs);
  const fixtures = generateFixtures(clubList, fxStart, { tier: playerDivMeta.tier, spread: true });
  for (const m of fixtures) {
    m.involvesPlayerClub = m.homeClubId === opts.managedClubId || m.awayClubId === opts.managedClubId;
  }
  const table = calculateTable(clubList, fixtures, pointSystem);
  const calendar = generateSeasonCalendar(fixtures, startISO, `${year + 1}-06-30`);
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

  // --- Landespokal aufsetzen: Amateurvereine ergänzen (→ 32er-Feld) ---
  const legacy = isGer && !comp;
  const amateurs = generateCupAmateurs(Math.max(0, 32 - clubList.length), legacy ? undefined : {
    date: startISO, towns: amateurTownsFor(home, new Set(clubList.map((c) => c.city))), foreignStyle: !isGer,
  });
  Object.assign(world.clubs, amateurs.clubs);
  Object.assign(world.players, amateurs.players);
  const blClubIds = clubList.map((c) => c.id);
  // Rahmenterminkalender: Pokalrunden meiden Liga-Hauptspieltage und Europapokal-Wochen.
  const cupAvoid = leagueDateSet(fixtures);
  const euroWeeks = euroFrameDates(year);
  const cup = createCup(
    blClubIds,
    Object.keys(amateurs.clubs).slice(0, Math.max(0, 32 - blClubIds.length)),
    cupAvoid,
    hashSeed(opts.managedClubId + (legacy ? ':1980' : `:${year + 5}`)),
    calendar.seasonStartDate,
    opts.managedClubId,
    true,
    euroWeeks,
  );
  addCupCalendarEvents(calendar, cup, cupAvoid, euroWeeks);
  // Auslosung erst am historischen Termin (game/cupDraw.ts, Mitte Juli).
  scheduleDraws(cup, 'cup', calendar);
  const welcome = makeMessage({
    date: calendar.currentDate,
    category: 'board',
    from: 'Vereinsvorstand',
    subject: `Willkommen bei ${club.name}, ${opts.manager.name}!`,
    shortText: 'Der Vorstand heißt dich willkommen und nennt das Saisonziel.',
    bodyText: `Sehr geehrte(r) ${opts.manager.name},\n\nherzlich willkommen als neue(r) Manager(in) von ${club.name}! Wir freuen uns auf die Zusammenarbeit in der Saison ${season}.\n\nUnser Ziel: ${club.boardExpectation}\n\nDie Mannschaft steht bereit, der Kader ist einsatzfähig. Nutze Training, Trainerteam und Transfermarkt klug – einen Cheftrainer stellst du unter Training › Trainerteam ein. Wir vertrauen auf dein Geschick.\n\nSportliche Grüße\nDer Vorstand von ${club.name}`,
    actionRequired: false,
  });
  // --- Europapokal der Startsaison ---
  // Ohne Weltdaten 1975 in Deutschland: feste historische Starter (data/europe.ts), Hintergrund-
  // Europa danach. Sonst: Europa zuerst aufbauen (engine/worldData.ts), Starter aus den Daten.
  const euroClubs = allEuroClubs();
  const overlay = needsOverlay(year, home);
  const worldState = overlay ? initWorld(euroClubs, year, { overlay: worldOverlay({ home }) }) : null;
  const euroQuals = legacy
    ? computeGermanEuroQualifiers(
      { clubs: world.clubs, simClubs, players: world.players, managedClubId: opts.managedClubId, pointSystem } as any,
      true,
    )
    : startEuroQualifiers({ clubs: world.clubs, simClubs }, home, year, comp);
  const euroCups = buildEuroCupsForSeason(
    euroQuals, euroClubs, leagueDateSet([...fixtures, ...generateFixtures(clubList, fxStart, { tier: 1 })]), cupDateSet(cup),
    opts.managedClubId + ':' + year, calendar.seasonStartDate, opts.managedClubId, calendar, worldState?.participants ?? null, true,
  );
  const euroDrawMsgs: InboxMessage[] = [];
  (['ec', 'cwc', 'uefa'] as EuroCompId[]).forEach((comp) => {
    const ec = euroCups[comp];
    if (ec) {
      const m = euroDrawMessage(comp, ec, world.clubs, euroClubs, opts.managedClubId, 0, calendar.currentDate);
      if (m) euroDrawMsgs.push(m);
    }
  });
  // --- Mehrstufiges Ligasystem: 1. Liga/2. Liga (aggregiert simuliert) ---
  const ligaStart = fixtures[0]?.date ?? calendar.seasonStartDate;
  const otherDivisions: LeagueDivision[] = [];
  if (startSim) otherDivisions.push(buildDivision({ id: 'tier1', name: '1. Liga', tier: 1, group: null }, tier1SimIds, pointSystem, season, ligaStart));
  for (const sec of seconds) {
    if (startSim && sec.group === startSim.group) continue;
    otherDivisions.push(buildDivision(
      { id: secondId(sec.group), name: sec.name, tier: 2, group: sec.group },
      Object.values(simClubs).filter((x) => x.tier === 2 && x.group === sec.group).map((x) => x.id), pointSystem, season, ligaStart,
    ));
  }
  const leagues = { playerDivision: playerDivMeta, otherDivisions, season };
  // Parallele DDR-Ligapyramide (bis zur Wiedervereinigung 1991/92) ergänzen.
  if (isGer && year <= 1990) leagues.otherDivisions.push(...buildDdrDivisions(simClubs, pointSystem, season, ligaStart, legacy ? undefined : ddrSeedsFor(year) ?? undefined));
  const g0: Game = {
    clubs: world.clubs, players: world.players, youthPlayers: world.youthPlayers,
    fixtures, table, calendar,
    pointSystem, managedClubId: opts.managedClubId, season,
    manager: opts.manager, difficulty: opts.difficulty, injuriesEnabled: opts.injuriesEnabled,
    historyMode: isGer ? opts.historyMode ?? 'off' : 'off',
    messages: [...euroDrawMsgs, welcome],
    trainingPlan: createDefaultWeeklyPlan(),
    cup,
    euroCups,
    euroClubs,
    world: worldState ?? initWorld(euroClubs),
    firedMilestones: [],
    unlockedFeatures: [],
    hiredStaff: [],
    marketing: {},
    activities: [],
    leagues,
    simClubs,
    appliedReforms: legacy ? [] : reformsAppliedAt(year, home),
    financeLevel: FINANCE_LEVEL,
    youthSalt,
    ...(legacy ? {} : { startYear: year }),
    ...(isGer ? {} : { homeCountry: home }),
  };
  // Vereins-Pool (Amateurligen) + Historie 1963–1975 (game/clubPool.ts).
  if (comp) seedStartPool(g0, home, year); // übrige Vereine des Landes (Weltdaten)
  migrateLeaguePool(g0);
  // Ebenen unterhalb der 2. Liga, die es im Startjahr schon gibt (Regionalligen, 3. Liga).
  if (isGer && !legacy) { padSecondTier(g0, year, ligaStart); fillLowerTiers(g0, year, ligaStart); }
  if (!legacy) seedPreStartHistory(g0, home, year);
  // Meilensteine bis zur Startsaison sofort auslösen (Effekte); erklärt werden sie im Saison-Briefing.
  for (let y = 1975; y <= year; y++) fireTimelineForSeason(g0, seasonLabelOf(y), calendar.currentDate, true);
  if (!isGer) g0.pointSystem = pointSystem; // Chronik-Effekte sind deutsch; Punkteregel des Landes
  // Weitere Länder Spiel für Spiel (game/fullCountries.ts).
  if (opts.fullAll) { g0.fullAll = true; g0.fullCountries = fullCandidates(g0); }
  const full = (opts.fullAll ? g0.fullCountries! : opts.fullCountries ?? []).filter((cc) => cc !== home && !(isGer && cc === 'gdr') && COUNTRY_BY_CC[cc]);
  if (full.length) { g0.fullCountries = full; buildFullCountries(g0, ligaStart); }
  for (const pid of g0.clubs[g0.managedClubId]?.playerIds ?? []) {
    const p = g0.players[pid];
    if (p) snapshotAttributes(p, calendar.currentDate, 'Spielbeginn');
  }
  // Erste Scout-Einschätzung: eigener Kader genauer als fremde Spieler.
  for (const p of Object.values(g0.players)) if (!p.isYouth) updateScoutEstimate(p, p.clubId === g0.managedClubId ? 0.4 : 0.2, p.clubId === g0.managedClubId);
  // Finanzen 2.0: zentrale TV-Verteilung der ersten Saison (Ruf als Leistungsmaß).
  const leagueClubs = Object.values(g0.clubs).filter(isLeagueClub);
  const byRep = [...leagueClubs].sort((a, b) => b.reputation - a.reputation).map((c) => c.id);
  refreshMarketValues(g0.players, year);
  // Grundausstattung des Stabs: Co-Trainer, Masseur, Mannschaftsarzt (je eine erfahrene Kraft).
  g0.staff = ['cotrainer', 'masseur', 'mannschaftsarzt'].map((roleId) => ({
    ...makeCandidates(roleId, year, g0.clubs[g0.managedClubId]?.reputation ?? 60, Math.random)[1], hired: calendar.currentDate,
  }));
  g0.hiredStaff = g0.staff.map((m) => m.roleId);
  const startTier = g0.leagues.playerDivision.tier;
  for (const c of leagueClubs) { c.finances.commercialAnnual = commercialAnnualFor(c, startTier, year); c.finances.leagueTier = startTier; }
  allocateTv(leagueClubs, startTier, year, (id) => 1 - byRep.indexOf(id) / Math.max(1, byRep.length - 1));
  // Volle Jugendmannschaften des eigenen Vereins (game/youthTeams.ts).
  ensureYouthTeams(g0, g0.calendar.currentDate);
  // Stadion in vier Blöcken (game/stadiumGame.ts).
  ensureStadiumBlocks(g0);
  // Platzkategorien aller Vereine (game/seatingGame.ts).
  migrateSeating(g0);
  // Trainer der KI-Vereine (game/coachCarousel.ts).
  ensureCoaches(g0, calendar.currentDate);
  migrateYouthInvest(g0);
  // Arbeitsmarkt für Trainer und Betreuer (game/staffWorld.ts).
  ensureStaffWorld(g0);
  // Sponsoring 2.0: Werbeflächen 1975 (Brust, Ausrüster, Banden, Regionalpartner) – KI unterschreibt, du bekommst Angebote.
  initSponsorship(g0);
  // Saison-Briefing „So anders ist der Fußball 1975/76“ (game/seasonBriefing.ts).
  recordSeasonBriefing(g0, true);
  recordBudgetPlan(g0, { pending: true }); // Saisonbudget (game/budgetPlan.ts)
  migratePositionSkills(g0); // Positionsvertrautheit aller Spieler (game/positionsGame.ts)
  migrateYouthComps(g0); // Jugendwettbewerbe der Saison (game/youthComps/)
  initLegends(g0, opts.legends !== false); // Ausnahmetalente der Fußballgeschichte (still, game/legendsGame.ts)
  migrateContracts2(g0); // Vertragsbausteine-Zustand von Beginn an (wie beim Laden, game/contractClausesGame.ts)
  harmonizeSeason(g0); // Rahmenterminkalender: Wochenendspiele an Pokal-/Europapokalwochen (game/fixtureWatch.ts)
  ensureCountryPools(g0.world, g0.euroClubs, Number(g0.season.slice(0, 4))); // Unterbau der Auslandsligen (engine/world.ts)
  ensureWorldPool(g0); // Weltspieler aller Vereine ohne vollen Kader (Spielerpool)
  bindHonours(g0, true); // Vereinsauszeichnungen: leere Wirkungstabelle für das neue Spiel
  return g0;
}

import { EuroCompId, allEuroClubs } from '../data/europe';
import { setEraYear } from '../engine/positions';
import { refreshOverall } from '../engine/development';
import { manageSquads } from './squads';
import { closeFinancialSeason, openFinancialSeason } from './seasonFinance';
import { staffSeasonChange } from './staffGame';
import { youthPoachingAtSeasonChange } from './youthMarket';
import { environmentSeasonChange, setSeasonGoal } from './environmentGame';
import { advanceWorldSeason, initWorld, isForeignId } from '../engine/world';
import { closeSeason, recordTransfer } from '../engine/history';
import { buildProClub } from '../data/generate';
import { CurrentDivision, TransitionResult, computeSeasonTransition, structureForSeason } from '../data/reforms';
import { TIMELINE_TYPE_META, TimelineEvent, dueTimelineEvents, seasonStartYear } from '../data/timeline';
import { generateSeasonCalendar, seasonLabel } from '../engine/calendar';
import { createCup } from '../engine/cup';
import { economyScale, yearOf } from '../engine/economy';
import { computeGermanEuroQualifiers } from '../engine/euro';
import { bookHomeMatch, generateBandenOffers, generateShirtOffers } from '../engine/finances';
import { SideResult, applyMatchEffects } from '../engine/form';
import { calculateTable, generateFixtures } from '../engine/league';
import { DivisionMeta, LeagueDivision, LeagueGroup, advanceDivision, buildDivision, flushDivision, hashStr, mulberry32, simClubFromClub, simMatchGoals } from '../engine/leagues';
import { MatchEngine } from '../engine/match';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club, Match } from '../types';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, cupDrawMessage, euroDrawMessage, leagueDateSet } from './competitions';
import { Game, bestOffer, hashSeed, migrateCommerce, offerToContract } from './state';

// -----------------------------------------------------------------------------
// Spieltag simulieren + Form/Fitness-Effekte + Nachrichten
// -----------------------------------------------------------------------------
export function simulateMatchday(game: Game, matchday: number): void {
  const dayMatches = game.fixtures.filter((m) => m.matchday === matchday && m.status === 'scheduled');
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

  // Nicht-Spieler-Ligen (2. Liga Nord/Süd) performant per Stärke um einen
  // Spieltag weiterführen. Kein voller Match-Engine-Lauf → kein Tick-Lag.
  if (game.leagues) {
    for (const div of game.leagues.otherDivisions) {
      advanceDivision(div, game.simClubs, game.pointSystem, game.season);
    }
  }
}

/** Nur die 1. Liga-Vereine (ohne die Pokal-Amateurvereine mit Präfix "am"). */
export function leagueClubs(game: Game): Club[] {
  // Ohne Pokal-Amateure und ohne für den Europapokal materialisierte Auslandsvereine.
  return Object.values(game.clubs).filter((c) => !c.id.startsWith('am') && !isForeignId(c.id));
}

// -----------------------------------------------------------------------------
// EPOCHEN-/TIMELINE-SYSTEM — Meilensteine auslösen & Effekte anwenden
// -----------------------------------------------------------------------------

/** Wendet den Spiel-Effekt eines Meilensteins an (Punktesystem, Feature-Flag). */
export function applyTimelineEffect(g: Game, ev: TimelineEvent): void {
  if (!ev.effect) return;
  if (ev.effect.pointSystem) {
    g.pointSystem = ev.effect.pointSystem;
    // Tabelle mit dem neuen Punktesystem SOFORT neu berechnen, damit z. B. die
    // Umstellung auf 3 Punkte 1995/96 die Tabellenrechnung wirklich verändert.
    g.table = calculateTable(leagueClubs(g), g.fixtures, g.pointSystem, g.season, g.table);
  }
  if (ev.effect.attendanceBoost) {
    for (const c of Object.values(g.clubs)) {
      c.stadium.averageAttendanceRate = Math.min(0.98, c.stadium.averageAttendanceRate + ev.effect.attendanceBoost);
    }
  }
  if (ev.effect.unlock && !g.unlockedFeatures.includes(ev.effect.unlock)) {
    g.unlockedFeatures.push(ev.effect.unlock);
  }
}

/**
 * Löst alle für `season` fälligen Meilensteine aus: Effekt anwenden, in
 * firedMilestones vermerken und (außer bei silent) eine Chronik-Nachricht in die
 * Inbox legen. Gibt die ausgelösten Ereignisse zurück.
 */
export function fireTimelineForSeason(g: Game, season: string, dateISO: string, silent = false): TimelineEvent[] {
  const due = dueTimelineEvents(season, g.firedMilestones);
  for (const ev of due) {
    g.firedMilestones.push(ev.id);
    applyTimelineEffect(g, ev);
    if (!silent) {
      const meta = TIMELINE_TYPE_META[ev.type];
      pushMessage(g.messages, makeMessage({
        date: dateISO, category: 'milestone', from: 'Fußball-Chronik',
        subject: `${ev.year}: ${ev.title}`,
        shortText: `${meta.label}-Meilenstein ${ev.season}: ${ev.title}.`,
        bodyText: `${ev.title}  (${ev.season} · ${meta.label})\n\n${ev.description}\n\n`
          + `Diesen und alle weiteren Meilensteine findest du im Bereich „Chronik“.`,
      }));
    }
  }
  return due;
}

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
  if (g.leagues.playerDivision.id === divId) return g.table.rows.map((r) => r.clubId).filter((id) => !isForeignId(id));
  const d = g.leagues.otherDivisions.find((x) => x.id === divId);
  return d ? d.table.rows.map((r) => r.clubId).filter((id) => !isForeignId(id)) : [];
}

export function startNextSeason(g: Game): void {
  const oldSeason = g.season;
  const nextStartYear = seasonStartYear(g.season) + 1;
  const nextEndYear = nextStartYear + 1;
  const newSeason = seasonLabel(nextStartYear);
  const seasonStart = `${nextStartYear}-07-01`;
  const fixturesStart = `${nextStartYear}-08-15`;
  const seasonEnd = `${nextEndYear}-06-30`;

  // Europapokal-Starter der neuen Saison AUS der abgelaufenen Saison ableiten
  // (Endtabelle + Landespokalsieger) – VOR dem Überschreiben von g.table/g.cup.
  const euroQuals = computeGermanEuroQualifiers(g, false);
  // Finanzsaison abschließen (Bilanz, Marke, Ruf) solange Tabelle/Pokale noch vorliegen.
  const prevPerf = closeFinancialSeason(g, oldSeason, g.calendar.currentDate);
  environmentSeasonChange(g, oldSeason, g.calendar.currentDate);

  // --- 1) Sim-Ligen zu Ende simulieren, damit alle Endtabellen feststehen ---
  for (const div of g.leagues.otherDivisions) {
    flushDivision(div, g.simClubs, g.pointSystem, g.season);
  }

  const oldPlayerTier = g.leagues.playerDivision.tier;

  // --- 2) Endstände ALLER aktuellen Divisionen einlesen (Spielerliga + Sim) ---
  const pd = g.leagues.playerDivision;
  const current: CurrentDivision[] = [
    { id: pd.id, tier: pd.tier, group: pd.group, name: pd.name, orderedIds: finalOrder(g, pd.id) },
  ];
  // DDR-Divisionen (tier 101/102) laufen normalerweise SEPARAT und dürfen den
  // West-Auf-/Abstieg nicht berühren – daher aus `current` heraushalten. NUR zur
  // Wiedervereinigungs-Saison 1991/92 werden sie mitgegeben, damit migrate1991
  // die DDR-Endstände in die gesamtdeutsche Pyramide integrieren kann.
  const isReunify = newSeason === '1991/92'
    && !g.appliedReforms.includes('reform-1991-reunification');
  const ddrDivs = g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-'));
  for (const div of g.leagues.otherDivisions) {
    if (div.id.startsWith('ddr-') && !isReunify) continue;
    current.push({ id: div.id, tier: div.tier, group: div.group, name: div.name, orderedIds: finalOrder(g, div.id) });
  }

  // --- 3) Auf-/Abstieg + evtl. Ligareform datengetrieben berechnen ---
  // Liegt für die neue Saison eine noch nicht angewandte Reform vor (z. B. 1981/82
  // eingleisige 2. Liga), führt computeSeasonTransition die Struktur-Migration aus;
  // sonst den generischen, strukturunabhängigen Auf-/Abstieg.
  const res: TransitionResult = computeSeasonTransition({
    newSeason,
    current,
    strengthOf: (id) => clubStrengthFor(g, id),
    cityOf: (id) => g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '',
    appliedReforms: g.appliedReforms,
    protectedId: g.managedClubId,
  });

  // Neu erzeugte fiktive Platzhalter aufnehmen, entfallene Vereine austragen.
  for (const ph of res.placeholders) g.simClubs[ph.id] = ph;
  for (const id of res.dropped) delete g.simClubs[id];

  const promoted = res.promotedTop;
  const relegated = res.relegatedTop;

  // --- 4) Mitgliedschaften + Spielerliga bestimmen ---
  const membership: Record<string, { ids: string[]; meta: DivisionMeta }> = {};
  for (const d of res.divisions) membership[d.meta.id] = { ids: d.ids, meta: d.meta };
  // Sollgrößen absichern (Reform-/Relegationssonderfälle dürfen keine Liga
  // dauerhaft verzerren). Ausnahme: die bewusst übergroße Wiedervereinigungssaison.
  if (!isReunify) balanceDivisions(membership, structureForSeason(newSeason), (id) => clubStrengthFor(g, id), g.managedClubId);

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
        g.clubs[id] = buildProClub(sc, g.managedClubId, seasonStart, g.players, g.youthPlayers);
        delete g.simClubs[id];
      }
    }
  }
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
    // Legenden gehen nicht verloren: Sie wechseln zu einem Verein der Spielerliga.
    rescueLegends(g, c, playerSet, calendar0Date(g));
    const dest = divOf[c.id] ?? { tier: 2, group: 'nord' as LeagueGroup };
    g.simClubs[c.id] = simClubFromClub(c, g.players, dest.tier, dest.group);
    for (const pid of c.playerIds) delete g.players[pid];
    for (const yid of (c.youthPlayerIds || [])) delete g.youthPlayers[yid];
    delete g.clubs[c.id];
  }
  // 5c) Tier/Gruppe aller Sim-Vereine auf die neue Saison aktualisieren.
  for (const id of Object.keys(g.simClubs)) {
    if (divOf[id]) { g.simClubs[id].tier = divOf[id].tier; g.simClubs[id].group = divOf[id].group; }
  }

  // --- 6) Spielerliga: neuer Spielplan + Tabelle (volle Engine) ---
  const playerClubList = playerIds.map((id) => g.clubs[id]).filter(Boolean) as Club[];
  const fixtures = generateFixtures(playerClubList, fixturesStart);
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
  if (nextStartYear < 1991 && !isReunify) {
    for (const d of ddrDivs) {
      otherDivisions.push(buildDivision(
        { id: d.id, name: d.name, tier: d.tier, group: d.group },
        d.clubIds, g.pointSystem, newSeason, fixturesStart,
      ));
    }
  }
  g.leagues = { playerDivision: membership[playerDivId].meta, otherDivisions, season: newSeason };

  const calendar = generateSeasonCalendar(fixtures, seasonStart, seasonEnd);
  calendar.speedMs = g.calendar.speedMs;

  // --- 8) Landespokal der neuen Saison (Feld bleibt 32: volle Ligavereine + Amateure) ---
  const allAm = Object.keys(g.clubs).filter((id) => id.startsWith('am'));
  const blClubIds = playerClubList.map((c) => c.id);
  const amateurIds = allAm.slice(0, Math.max(0, 32 - blClubIds.length));
  const cup = createCup(
    blClubIds, amateurIds, leagueDateSet(fixtures),
    hashSeed(g.managedClubId + ':' + nextStartYear), calendar.seasonStartDate, g.managedClubId,
  );
  addCupCalendarEvents(calendar, cup);
  g.cup = cup;
  g.calendar = calendar;
  g.season = newSeason;

  // --- 7c) Kommerz-Vertraege (Trikot/Banden) fortschreiben ---------------------
  // Restlaufzeiten verringern, abgelaufene Vertraege entfernen, je Saison neue
  // Angebote erzeugen. KI-Vereine verlaengern automatisch mit dem besten Angebot,
  // damit ihre Bilanz stimmt; der Manager erhaelt Angebote zum Unterschreiben.
  for (const club of Object.values(g.clubs)) {
    if (!club.commerce) club.commerce = migrateCommerce(club, club.id === g.managedClubId);
    const com = club.commerce;
    const seed = `${club.id}:${newSeason}`;
    if (com.shirtSponsor) {
      com.shirtSponsor.yearsLeft -= 1;
      if (com.shirtSponsor.yearsLeft <= 0) com.shirtSponsor = undefined;
    }
    if (com.banden) {
      com.banden.yearsLeft -= 1;
      if (com.banden.yearsLeft <= 0) com.banden = undefined;
    }
    const shirtOffers = generateShirtOffers(club, `shirt-${seed}`);
    const bandenOffers = generateBandenOffers(club, `banden-${seed}`);
    if (club.id === g.managedClubId) {
      // Angebote nur speichern, wenn (noch) kein laufender Vertrag besteht.
      com.shirtOffers = shirtOffers;
      com.bandenOffers = bandenOffers;
    } else {
      if (!com.shirtSponsor) {
        const s = bestOffer(shirtOffers);
        if (s) com.shirtSponsor = offerToContract(s);
      }
      if (!com.banden) {
        const b = bestOffer(bandenOffers);
        if (b) com.banden = offerToContract(b);
      }
    }
  }

  // --- 8a) Europapokale der neuen Saison (drei Wettbewerbe, EC/CWC/Europa-Verband) ---
  const euroClubs = g.euroClubs ?? allEuroClubs();
  g.euroClubs = euroClubs;
  // Europa im Hintergrund: abgelaufene Saison aller Auslandsligen durchrechnen,
  // Koeffizienten werten und die ausländischen Starter bestimmen.
  if (!g.world) g.world = initWorld(euroClubs, nextStartYear);
  const worldRes = advanceWorldSeason(
    g.world, euroClubs, oldSeason, nextStartYear, g.pointSystem === '3-point' ? 3 : 2,
    g.euroCups as any, (id) => !!g.clubs[id] || !!g.simClubs?.[id],
  );
  for (const note of worldRes.notes) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'milestone', from: 'Fußball-Chronik',
      subject: 'Europas Fußball-Landkarte ändert sich', shortText: note, bodyText: note, actionRequired: false,
    }));
  }
  g.euroCups = buildEuroCupsForSeason(
    euroQuals, euroClubs, leagueDateSet(fixtures), cupDateSet(cup),
    g.managedClubId + ':' + nextStartYear, calendar.seasonStartDate, g.managedClubId, calendar,
    worldRes.participants,
  );
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const ec = g.euroCups[comp];
    if (!ec) continue;
    const dmsg = euroDrawMessage(comp, ec, g.clubs, euroClubs, g.managedClubId, 0, calendar.currentDate);
    if (dmsg) pushMessage(g.messages, dmsg);
  }

  // --- 8b) Ligareform: Meilenstein-Nachricht + Reform als angewandt vormerken ---
  // Wurde diese Saison eine Struktur-Reform ausgeführt, meldet die Fußball-Chronik
  // den Umbau. Die Reform wird gespeichert, damit sie beim erneuten Laden eines
  // Spielstands nicht ein zweites Mal migriert (Doppel-Migration verhindert).
  if (res.reform) {
    const rf = res.reform;
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'milestone', from: 'Fußball-Chronik',
      subject: `${seasonStartYear(newSeason)}: ${rf.title}`,
      shortText: `Ligareform ${rf.effectiveSeason}: ${rf.title}.`,
      bodyText: `${rf.title}  (Ligareform ${rf.effectiveSeason})\n\n${rf.description}\n\n`
        + `Qualifikation & Zuordnung: ${rf.qualificationRule}\n\n`
        + `Details zum Reformsystem findest du im Bereich „Wiki“ (Ligastruktur & Auf-/Abstieg).`,
    }));
    if (!g.appliedReforms.includes(rf.reformId)) g.appliedReforms.push(rf.reformId);
  }

  // Meilensteine dieser Saison auslösen (z. B. 1995/96 → 3-Punkte-Regel).
  fireTimelineForSeason(g, newSeason, calendar.currentDate);

  // --- 9) Nachrichten: Auf-/Abstieg des eigenen Vereins + Ligaüberblick ---
  const newPlayerTier = membership[playerDivId].meta.tier;
  const playerDivName = membership[playerDivId].meta.name;
  if (newPlayerTier < oldPlayerTier) {
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
  const ruleText = res.reform
    ? `Aufstiegsregel: ${res.reform.qualificationRule}`
    : `Aufstiegsregel: Die Staffelmeister der unteren Ebene steigen auf, die Schlechtesten der oberen `
      + `Ebene ab; alle Staffelgrößen bleiben konstant.`;
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'media', from: 'Sportredaktion',
    subject: `Auf- und Abstieg ${oldSeason} → ${newSeason}`,
    shortText: 'Aufsteiger in die 1. Liga und Absteiger stehen fest.',
    bodyText: `Aufsteiger in die 1. Liga: ${promoted.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n`
      + `Absteiger aus der 1. Liga: ${relegated.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n\n`
      + `${ruleText}`,
  }));

  pushMessage(g.messages, cupDrawMessage(cup, g.clubs, g.managedClubId, calendar.currentDate));
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
    subject: `Die neue Saison ${newSeason} beginnt`,
    shortText: `Spielplan und Landespokal für ${newSeason} stehen fest.`,
    bodyText: `Willkommen zur Saison ${newSeason}! Der Spielplan der Liga und die 1. Runde des `
      + `Landespokals wurden ausgelost. Die Vorbereitung läuft – nutze die Transferphase und das Training.`,
  }));
  // Saisonbilanz als Station festhalten, Saisonstatistik für die neue Saison leeren.
  closeSeason(g.players, g.clubs, oldSeason);
  manageSquads(g, calendar.currentDate, !!(g as any).simAutoManage);
  openFinancialSeason(g, newSeason, calendar.currentDate, prevPerf);
  staffSeasonChange(g, calendar.currentDate);
  youthPoachingAtSeasonChange(g, calendar.currentDate);
  setSeasonGoal(g, calendar.currentDate);
  // Neue Saison, evtl. neue Epoche: Positionsstärken aller Spieler neu bewerten.
  setEraYear(Number(calendar.currentDate.slice(0, 4)));
  for (const p of Object.values(g.players)) if (!p.isYouth) refreshOverall(p);
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
    bodyText: `Am ${m.matchday}. Spieltag ${myHome ? 'empfing' : 'gastierte'} ${myHome ? h.name + ' ' + a.name : h.name + ' gegen ' + a.name}.\n\nEndstand: ${h.name} ${m.result.homeGoals}:${m.result.awayGoals} ${a.name} — ein ${outcome} aus deiner Sicht.\n\nBallbesitz: ${m.result.homePossession}% : ${100 - m.result.homePossession}%\nSchüsse: ${m.result.homeShots} : ${m.result.awayShots}\nZuschauer: ${m.result.attendance.toLocaleString('de-DE')}\n\nDen ausführlichen Spielbericht öffnest du über den Spielplan.`,
    relatedId: m.id,
  }));
}

/**
 * Gleicht Ligagrößen an die Sollstruktur an: Überzählige (schwächste) wandern eine
 * Ebene tiefer, fehlende Plätze werden mit den stärksten Vereinen der Ebene darunter
 * aufgefüllt. Auf der untersten Ebene werden Überzählige gestrichen.
 */
function balanceDivisions(
  membership: Record<string, { ids: string[]; meta: DivisionMeta }>,
  target: { id: string; tier: number; teamCount: number }[],
  strengthOf: (id: string) => number,
  protectedId: string,
): void {
  const want: Record<string, number> = {};
  for (const t of target) want[t.id] = t.teamCount;
  const keys = Object.keys(membership).filter((k) => want[k] != null);
  const tiers = [...new Set(keys.map((k) => membership[k].meta.tier))].sort((a, b) => a - b);
  for (const tier of tiers) {
    const here = keys.filter((k) => membership[k].meta.tier === tier);
    const below = keys.filter((k) => membership[k].meta.tier === tier + 1);
    for (const k of here) {
      const ids = membership[k].ids;
      // Zu viele: schwächste nach unten (nie den eigenen Verein).
      while (ids.length > want[k]) {
        const sorted = ids.filter((id) => id !== protectedId).sort((a, b) => strengthOf(a) - strengthOf(b));
        const out = sorted[0];
        if (!out) break;
        ids.splice(ids.indexOf(out), 1);
        if (below.length) {
          const dest = below.sort((a, b) => (membership[a].ids.length - want[a]) - (membership[b].ids.length - want[b]))[0];
          membership[dest].ids.push(out);
        }
      }
      // Zu wenige: stärkste von unten holen.
      while (ids.length < want[k] && below.length) {
        const src = below.sort((a, b) => membership[b].ids.length - membership[a].ids.length)[0];
        const pool = membership[src].ids.filter((id) => id !== protectedId).sort((a, b) => strengthOf(b) - strengthOf(a));
        const inn = pool[0];
        if (!inn) break;
        membership[src].ids.splice(membership[src].ids.indexOf(inn), 1);
        ids.push(inn);
      }
    }
  }
}

function calendar0Date(g: Game): string { return g.calendar.currentDate; }

/** Legenden eines Vereins, der die Spielerliga verlässt, wechseln zu einem verbleibenden Verein. */
function rescueLegends(g: Game, from: Club, stay: Set<string>, date: string): void {
  const targets = [...stay].map((id) => g.clubs[id]).filter((c): c is Club => !!c && c.id !== g.managedClubId);
  if (!targets.length) return;
  const pick = () => targets.sort((a, b) => b.reputation - a.reputation)[Math.floor(Math.random() * Math.min(6, targets.length))];
  for (const id of [...from.playerIds]) {
    const p = g.players[id];
    if (!p?.development.legendId) continue;
    const to = pick();
    from.playerIds = from.playerIds.filter((x) => x !== id);
    to.playerIds.push(id);
    p.clubId = to.id;
    recordTransfer(p, from.name, to.name, Math.round(p.contract.transferValue * economyScale(yearOf(date))), date);
  }
  for (const id of [...(from.youthPlayerIds ?? [])]) {
    const p = g.youthPlayers[id];
    if (!p?.development.legendId) continue;
    const to = pick();
    from.youthPlayerIds = from.youthPlayerIds.filter((x) => x !== id);
    (to.youthPlayerIds ??= []).push(id);
    p.clubId = to.id;
  }
}

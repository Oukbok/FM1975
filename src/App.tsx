import { hydrateClubOverrides } from './data/clubOverrides';
import { setEraYear } from './engine/positions';
import { ensureDevFields, refreshOverall } from './engine/development';
import { updateScoutEstimate } from './engine/scouting';
import { snapshotAttributes } from './engine/history';
import { EuroCompId, allEuroClubs } from './data/europe';
import { generateCupAmateurs, generateWorld } from './data/generate';
import { LEAGUE_REFORMS } from './data/reforms';
import { seasonStartYear, timelineEventsUpTo } from './data/timeline';
import { generateSeasonCalendar } from './engine/calendar';
import { createCup } from './engine/cup';
import { yearOf } from './engine/economy';
import { computeGermanEuroQualifiers } from './engine/euro';
import { applyFacilityEffects, makeInfrastructure } from './engine/infrastructure';
import { calculateTable, generateFixtures } from './engine/league';
import { advanceDivision } from './engine/leagues';
import { autoFillLineup } from './engine/lineupAI';
import { makeMessage, pushMessage } from './engine/messages';
import { AppSettings, loadGame, loadSettings, saveSettings } from './engine/save';
import { createDefaultWeeklyPlan } from './engine/weeklyTraining';
import { academyStartingCohort, generateYouthPlayer } from './engine/youth';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, cupDrawMessage, euroDrawMessage, leagueDateSet } from './game/competitions';
import { buildDdrDivisions, buildLeagueSystem, buildSecondLigaSimClubs, historicPointSystem } from './game/leagueSetup';
import { applyTimelineEffect, fireTimelineForSeason } from './game/season';
import { Game, hashSeed, migrateCommerce } from './game/state';
import { MainMenu } from './screens/MainMenu';
import { GameShell } from './shell/GameShell';
import { createNewGame } from './game/newGame';
import { InboxMessage, NewGameOptions, YOUTH_ENTRY_AGE } from './types';
import { DisplayFrame, applyDisplayMode } from './ui/DisplayFrame';
import { setDisplayYear } from './ui/format';
import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// ROOT: Startmenü ⇄ Spiel
// =============================================================================
export default function App() {
  const gameRef = useRef<Game | null>(null);
  const [inGame, setInGame] = useState(false);
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);

  // Spielweiten Vereins-Override-Store (IndexedDB) einmalig beim Start laden und
  // danach neu rendern, damit hochgeladene Wappen/Trikots nach dem asynchronen
  // Laden erscheinen.
  useEffect(() => { hydrateClubOverrides().then(rerender).catch(() => {}); }, [rerender]);

  // --- Neues Spiel starten ---
  const startGame = useCallback((opts: NewGameOptions) => {
    const g0 = createNewGame(opts);
    const calendar = g0.calendar;
    setDisplayYear(yearOf(calendar.currentDate));
    gameRef.current = g0;
    setCurrentSlot(null);
    setInGame(true);
    rerender();
  }, [rerender]);

  // --- Spiel laden ---
  const doLoad = useCallback((slot: string) => {
    const s = loadGame<Game>(slot);
    if (!s) return;
    // Positionsbewertung auf das Spieljahr einstellen; ältere Spielstände auf Entwicklung 2.0 heben.
    setEraYear(Number(s.game.calendar.currentDate.slice(0, 4)));
    for (const p of Object.values(s.game.players)) {
      if (p.isYouth) continue;
      if (p.development.basePotential == null) { ensureDevFields(p); refreshOverall(p); updateScoutEstimate(p, 0.3, p.clubId === s.game.managedClubId); }
    }
    // Ältere Spielstände ohne Attribut-Verlauf: Ausgangswert für den eigenen Kader setzen.
    for (const pid of s.game.clubs[s.game.managedClubId]?.playerIds ?? []) {
      const p = s.game.players[pid];
      if (p && !p.history?.attributeSnapshots?.length) snapshotAttributes(p, s.game.calendar.currentDate, 'Stand beim Laden');
    }
    // Alte Spielstände kennen den Wochen-Trainingsplan noch nicht → nachrüsten.
    if (!s.game.trainingPlan || !Array.isArray(s.game.trainingPlan.days) || s.game.trainingPlan.days.length !== 7) {
      s.game.trainingPlan = createDefaultWeeklyPlan();
    }
    // Alte Spielstände ohne erweiterte Aufstellung → Startelf/Positionen nachrüsten.
    for (const c of Object.values(s.game.clubs) as any[]) {
      if (c.tactics && !c.tactics.assignedPositions) {
        Object.assign(c.tactics, autoFillLineup(c, s.game.players, c.tactics));
      }
    }
    // Alte Spielstände ohne Jugend/Infrastruktur → nachrüsten.
    if (!s.game.youthPlayers) s.game.youthPlayers = {};
    for (const c of Object.values(s.game.clubs) as any[]) {
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
        c.commerce = migrateCommerce(c, c.id === s.game.managedClubId);
      } else if (!c.commerce.cateringMode) {
        c.commerce.cateringMode = 'verpachtung';
      }
      applyFacilityEffects(c);
      const curDate = s.game.calendar.currentDate;
      if (c.youthPlayerIds.length === 0) {
        // Noch gar keine Talente → kompletten Altersaufbau F–A erzeugen.
        for (const yp of academyStartingCohort(c, curDate)) {
          s.game.youthPlayers[yp.id] = yp;
          c.youthPlayerIds.push(yp.id);
        }
      } else {
        // Bestehende Jugend nachrüsten: fehlende jüngere Jahrgänge (7–16)
        // auffüllen, damit auch Altstände einen vollen Altersaufbau erhalten.
        const agesPresent = new Set<number>(
          c.youthPlayerIds
            .map((id: string) => s.game.youthPlayers[id]?.age)
            .filter((a: number | undefined): a is number => typeof a === 'number'),
        );
        const lvl = c.infrastructure.youthAcademy ?? 1;
        for (let age = YOUTH_ENTRY_AGE; age <= 16; age++) {
          if (!agesPresent.has(age)) {
            const yp = generateYouthPlayer(c.id, `retrofill_${age}`, curDate, lvl, age);
            s.game.youthPlayers[yp.id] = yp;
            c.youthPlayerIds.push(yp.id);
          }
        }
      }
    }
    // Alte Spielstände ohne Landespokal → sauber nachrüsten (darf nicht crashen).
    if (!s.game.cup) {
      try {
        const amateurs = generateCupAmateurs(14);
        Object.assign(s.game.clubs, amateurs.clubs);
        Object.assign(s.game.players, amateurs.players);
        const blClubIds = Object.values(s.game.clubs)
          .filter((c: any) => !c.id.startsWith('am'))
          .map((c: any) => c.id);
        const curDate = s.game.calendar.currentDate;
        const cup = createCup(
          blClubIds,
          Object.keys(amateurs.clubs),
          leagueDateSet(s.game.fixtures),
          hashSeed(s.game.managedClubId + ':1980'),
          curDate,
          s.game.managedClubId,
        );
        addCupCalendarEvents(s.game.calendar, cup);
        s.game.cup = cup;
        pushMessage(s.game.messages, cupDrawMessage(cup, s.game.clubs, s.game.managedClubId, curDate));
      } catch (err) {
        console.error('Pokal-Nachrüstung fehlgeschlagen:', err);
      }
    }
    // Alte Spielstände ohne Europapokale → defensiv nachrüsten (darf nicht crashen).
    if (!s.game.euroClubs || !s.game.euroCups) {
      try {
        const euroClubs = s.game.euroClubs ?? allEuroClubs();
        s.game.euroClubs = euroClubs;
        const firstSeason = s.game.season === '1975/76';
        const quals = computeGermanEuroQualifiers(s.game, firstSeason);
        s.game.euroCups = buildEuroCupsForSeason(
          quals, euroClubs, leagueDateSet(s.game.fixtures), cupDateSet(s.game.cup),
          s.game.managedClubId + ':euroload', s.game.calendar.currentDate,
          s.game.managedClubId, s.game.calendar,
        );
        for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
          const ec = s.game.euroCups[comp];
          if (!ec) continue;
          const dmsg = euroDrawMessage(comp, ec, s.game.clubs, euroClubs, s.game.managedClubId, 0, s.game.calendar.currentDate);
          if (dmsg) pushMessage(s.game.messages, dmsg);
        }
      } catch (err) {
        console.error('Europapokal-Nachrüstung fehlgeschlagen:', err);
      }
    }
    // Alte Spielstände ohne Epochen-/Timeline-System → nachrüsten. Die bis zur
    // aktuellen Saison fälligen Meilensteine werden STILL angewandt (Effekte wie
    // Punktesystem/Feature-Flags korrekt setzen), ohne die Inbox zu überfluten.
    if (!Array.isArray(s.game.firedMilestones)) s.game.firedMilestones = [];
    if (!Array.isArray(s.game.unlockedFeatures)) s.game.unlockedFeatures = [];
    if (s.game.firedMilestones.length === 0) {
      // ALLE bis zur aktuellen Saison fälligen Meilensteine still anwenden
      // (Effekte wie Punktesystem/Feature-Flags korrekt setzen) und als
      // ausgelöst markieren, ohne die Inbox rückwirkend zu fluten.
      for (const ev of timelineEventsUpTo(s.game.season)) {
        s.game.firedMilestones.push(ev.id);
        applyTimelineEffect(s.game, ev);
      }
    }
    // Robustheit: Fehlt/verunreinigt das Punktesystem in einem Altstand, historisch
    // aus der aktuellen Saison ableiten (bis 1994/95 → 2 Punkte, ab 1995/96 → 3 Punkte).
    if (s.game.pointSystem !== '2-point' && s.game.pointSystem !== '3-point') {
      s.game.pointSystem = historicPointSystem(s.game.season);
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
    retrofitFrische(s.game.players);
    retrofitFrische(s.game.youthPlayers);
    // Block p11 (Mitarbeiter / Marketing / Kalender) → fehlende Felder nachrüsten.
    if (!Array.isArray(s.game.hiredStaff)) s.game.hiredStaff = [];
    if (!s.game.marketing || typeof s.game.marketing !== 'object') s.game.marketing = {};
    if (!Array.isArray(s.game.activities)) s.game.activities = [];
    // Mehrstufiges Ligasystem (SAVE_VERSION 4) → alte Einliga-Spielstände auf die
    // neue Struktur heben: bestehende Profivereine bleiben Tier 1 (Spielerliga),
    // die 2. Liga Nord/Süd wird als aggregierte Sim-Ligen ergänzt.
    if (!s.game.simClubs || typeof s.game.simClubs !== 'object') s.game.simClubs = {};
    if (!s.game.leagues) {
      try {
        const simClubs = buildSecondLigaSimClubs();
        s.game.simClubs = simClubs;
        const seasonStart = s.game.fixtures[0]?.date ?? s.game.calendar.seasonStartDate;
        s.game.leagues = buildLeagueSystem(simClubs, s.game.pointSystem, s.game.season, seasonStart);
        // Sim-Ligen bis zum aktuellen Liga-Spieltag der laufenden Saison nachziehen,
        // damit die 2.-Liga-Tabellen zum Spielstand passen.
        const playedMd = Math.max(
          0,
          ...s.game.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
        );
        for (const div of s.game.leagues.otherDivisions) {
          let guard = 0;
          while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
            advanceDivision(div, simClubs, s.game.pointSystem, s.game.season);
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
    if (!Array.isArray(s.game.appliedReforms)) {
      s.game.appliedReforms = LEAGUE_REFORMS
        .filter((r) => seasonStartYear(r.effectiveSeason) <= seasonStartYear(s.game.season))
        .map((r) => r.reformId);
    }
    // DDR-Ligasystem (SAVE_VERSION 6) → nachrüsten. Spielstände VOR der
    // Wiedervereinigung (Saison-Startjahr < 1991) ohne separate DDR-Divisionen
    // erhalten die parallele DDR-Pyramide nachträglich; die DDR-Tabellen werden
    // bis zum aktuellen Liga-Spieltag nachgezogen. Stände AB 1991/92 gelten als
    // bereits integriert (die DDR-Struktur wurde dort aufgelöst) – nichts zu tun.
    try {
      const hasDdr = s.game.leagues?.otherDivisions?.some((d: any) => String(d.id).startsWith('ddr-'));
      const beforeWende = seasonStartYear(s.game.season) < 1991;
      const reunified = Array.isArray(s.game.appliedReforms)
        && s.game.appliedReforms.includes('reform-1991-reunification');
      if (s.game.leagues && !hasDdr && beforeWende && !reunified) {
        const seasonStart = s.game.fixtures[0]?.date ?? s.game.calendar.seasonStartDate;
        const ddrDivs = buildDdrDivisions(s.game.simClubs, s.game.pointSystem, s.game.season, seasonStart);
        const playedMd = Math.max(
          0,
          ...s.game.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
        );
        for (const div of ddrDivs) {
          let guard = 0;
          while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
            advanceDivision(div, s.game.simClubs, s.game.pointSystem, s.game.season);
            guard++;
          }
        }
        s.game.leagues.otherDivisions.push(...ddrDivs);
      }
    } catch (err) {
      console.error('DDR-Nachrüstung fehlgeschlagen:', err);
    }
    // Anzeige-Währung auf das aktuelle Spieljahr setzen (DM ≤2001, EUR ≥2002).
    setDisplayYear(yearOf(s.game.calendar.currentDate));
    gameRef.current = s.game;
    setCurrentSlot(slot);
    setInGame(true);
    rerender();
  }, [rerender]);

  // --- Spiel verlassen (zurück ins Menü) ---
  const exitToMenu = useCallback(() => {
    setInGame(false);
    rerender();
  }, [rerender]);

  const updateSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
    if (gameRef.current) gameRef.current.calendar.speedMs = s.speedMs;
    // Anzeige-Modus direkt im Klick-Kontext anwenden (Fullscreen-API benötigt
    // eine Nutzer-Geste — der "Speichern"-Klick zählt als solche).
    applyDisplayMode(s.displayMode);
  }, []);

  // Anzeige-Modus beim Start bestmöglich wiederherstellen (ohne Nutzer-Geste
  // kann der Browser Vollbild ablehnen — das wird sauber abgefangen).
  useEffect(() => {
    applyDisplayMode(settings.displayMode);
    // nur einmal beim Mounten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (!inGame || !gameRef.current) ? (
    <MainMenu
      settings={settings}
      onNewGame={startGame}
      onLoad={doLoad}
      onUpdateSettings={updateSettings}
    />
  ) : (
    <GameShell
      game={gameRef.current}
      rerender={rerender}
      currentSlot={currentSlot}
      setCurrentSlot={setCurrentSlot}
      settings={settings}
      onExit={exitToMenu}
      onLoad={doLoad}
      onUpdateSettings={updateSettings}
    />
  );

  return (
    <DisplayFrame resolution={settings.resolution} uiScale={settings.uiScale}>
      {content}
    </DisplayFrame>
  );
}

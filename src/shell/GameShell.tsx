import ClubCrest from '../components/ClubCrest';
import { snapshotAttributes } from '../engine/history';
import ClubEditorModal from '../components/ClubEditorModal';
import { ClubProfileProvider } from '../components/club/ClubProfileContext';
import Icon from '../components/Icon';
import LineupView from '../components/LineupView';
import { MatchScreen } from '../screens/match/MatchScreen';
import { OwnMatchInfo, completeOwnMatch, createOwnMatchSim, findOwnMatchDue, quickSimOwnMatch } from '../game/ownMatch';
import type { MatchSim } from '../engine/match/sim';
import TacticsView from '../components/TacticsView';
import { ACTIVITY_DEFS, activityIncomeBase } from '../data/activities';
import { EURO_COMP_NAMES } from '../data/europe';
import { marketingIncomeBase, marketingMonthlyBase, marketingReputationNudge } from '../data/marketing';
import { computeStaffEffects, staffMonthlyTotal } from '../data/staff';
import { CalendarEngine } from '../engine/calendar';
import { drawRound, roundWinners, simulateCupTie } from '../engine/cup';
import { RatingResult } from '../engine/development';
import { economyScale, yearOf } from '../engine/economy';
import { drawEuroRound, simulateEuroTie } from '../engine/euro';
import { book, bookCupHomeMatch, bookCupPrize, bookMonthly } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { dataScoutingBonus, medicalRecoveryBonus, medicalRehabBonus, nlzGrowthBonus, rehaRecoveryBonus, rehaRehabBonus } from '../engine/infrastructure';
import { makeMessage, pushMessage } from '../engine/messages';
import { AppSettings, nextFreeSlot, saveGame } from '../engine/save';
import { dailyRecovery } from '../engine/training';
import { runAITransfers, setTransferDate } from '../engine/transfers';
import { applyDailyTraining } from '../engine/weeklyTraining';
import { academyIntake, ageYouthPlayers, developYouthWeekly, graduateYouth } from '../engine/youth';
import { cupNextDrawMessage, cupResultMessage, euroDrawMessage, euroResultMessage, euroWinnerChronicle } from '../game/competitions';
import { emitMatchMessage, simulateMatchday, startNextSeason } from '../game/season';
import { Game, bumpMorale } from '../game/state';
import { PlayerDevReveal } from '../types';
import { fmtDM, fmtDMfull, fmtDateFull, setDisplayYear } from '../ui/format';
import { FinanzenDashboard, KaderDashboard, SpieltagDashboard, StatistikenDashboard, TransfersDashboard, VereinDashboard } from '../views/categoryDashboards';
import { FinancesView } from '../views/finanzen/FinancesView';
import { MarketingView } from '../views/finanzen/MarketingView';
import { SponsoringView } from '../views/finanzen/SponsoringView';
import { DevelopmentReveal, RatingCeremony } from '../views/kader/DevelopmentReveal';
import { SquadView } from '../views/kader/SquadView';
import { TrainingPlanView } from '../views/training/TrainingPlanView';
import { TrainerTeamView } from '../views/training/TrainerTeamView';
import { TrainingDashboard } from '../views/training/TrainingDashboard';
import { JugendDashboard } from '../views/jugend/JugendDashboard';
import { YouthCompetitionsView } from '../views/jugend/YouthCompetitionsView';
import { VertraegeView } from '../views/kader/VertraegeView';
import { YouthView } from '../views/kader/YouthView';
import { AcademyView } from '../views/kader/AcademyView';
import { SaveLoadModal, SettingsModal } from '../views/modals/SaveLoadModal';
import { FixturesView } from '../views/spieltag/FixturesView';
import { MatchModal } from '../views/spieltag/MatchModal';
import { ChronicleModal } from '../views/statistiken/ChronicleModal';
import { HallOfFameView } from '../views/statistiken/HallOfFameView';
import { CupView } from '../views/statistiken/CupView';
import { InternationalView } from '../views/statistiken/InternationalView';
import { IndoorView } from '../views/statistiken/IndoorView';
import { TrainingCampView } from '../views/kader/TrainingCampView';
import { DressingRoomView } from '../views/kader/DressingRoomView';
import { TableView } from '../views/statistiken/TableView';
import { BeobachtungView, TransfersView, VerhandlungenView } from '../views/transfers/TransfersView';
import { FacilitiesView } from '../views/verein/FacilitiesView';
import { FansView } from '../views/verein/FansView';
import { StadiumView } from '../views/verein/StadiumView';
import { BoardView } from '../views/verein/BoardView';
import { StaffView } from '../views/verein/StaffView';
import { WikiView } from '../views/wiki/WikiView';
import { CalendarView } from '../views/zentrale/CalendarView';
import { BriefingView } from '../views/zentrale/BriefingView';
import { BriefingModal } from '../views/zentrale/BriefingModal';
import { briefingLog, briefingOfRecord, clearPendingBriefing } from '../game/seasonBriefing';
import { Dashboard } from '../views/zentrale/Dashboard';
import { NewsView } from '../views/zentrale/NewsView';
import { PresseView } from '../views/zentrale/PresseView';
import { CalendarOverlay } from './CalendarOverlay';
import { MENU_STRUCTURE, Screen, TopNav } from './navigation';
import { processDay as processGameDay } from '../game/day';
import { DrawShow } from '../screens/draw/DrawShow';
import { CampRecap } from '../views/kader/camp/CampRecap';
import { compCup } from '../game/cupDraw';
import type { DrawComp } from '../types/draw';
import { setWikiOpener } from '../ui/InfoTip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// =============================================================================
// SPIEL-SHELL (In-Game UI)
// =============================================================================
export function GameShell({ game, rerender, currentSlot, setCurrentSlot, settings, onExit, onLoad, onUpdateSettings }: {
  game: Game; rerender: () => void; currentSlot: string | null;
  setCurrentSlot: (s: string | null) => void; settings: AppSettings; onExit: () => void;
  onLoad: (slot: string) => void; onUpdateSettings: (s: AppSettings) => void;
}) {
  const [screen, setScreenRaw] = useState<Screen>('dashboard');
  // Chronik ist kein Menüpunkt mehr: 'chronicle' öffnet das große Fenster (Footer rechts).
  const [chronicleOpen, setChronicleOpen] = useState(false);
  // Verlauf für „Zurück“ (bis zu 20 Seiten); wird geleert, sobald Zeit vergeht (neuer Tag).
  const [history, setHistory] = useState<Screen[]>([]);
  const screenRef = useRef<Screen>('dashboard');
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const setScreen = useCallback((s: Screen) => {
    if (s === 'chronicle') { setChronicleOpen(true); return; }
    const cur = screenRef.current;
    if (s !== cur) setHistory((h) => [...h, cur].slice(-20));
    setScreenRaw(s);
  }, []);
  const goBack = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setScreenRaw(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);
  // i-Hilfen: „Mehr im Wiki“ öffnet den Artikel (ui/InfoTip.tsx)
  const [wikiArticle, setWikiArticle] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => setWikiOpener((id) => { setWikiArticle((w) => ({ id, n: (w?.n ?? 0) + 1 })); setScreen('wiki'); }), []);
  const [running, setRunning] = useState(false);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  // Textmodus: laufende Live-Simulation des eigenen Spiels (eigene Oberfläche ohne Menü)
  const [textMatch, setTextMatch] = useState<{ sim: MatchSim; info: OwnMatchInfo } | null>(null);
  const watchedRef = useRef(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [devReveal, setDevReveal] = useState<PlayerDevReveal[] | null>(null);
  // Pokalauslosungen: Warteschlange der Shows (live am Auslosungstag oder Wiederholung).
  const [drawQueue, setDrawQueue] = useState<{ comp: DrawComp; roundIndex: number; replay?: boolean; n: number }[]>([]);
  const drawSeq = useRef(0);
  const replayDraw = useCallback((comp: DrawComp, roundIndex: number) => setDrawQueue((q) => [...q, { comp, roundIndex, replay: true, n: ++drawSeq.current }]), []);
  // Rückkehr aus dem Trainingslager: Buchungs-IDs für die animierte Zusammenfassung.
  const [campQueue, setCampQueue] = useState<string[]>([]);
  const [ratingCeremony, setRatingCeremony] = useState<{ results: RatingResult[]; type: 'medium' | 'large'; anlass: string } | null>(null);
  // In-Game-Overlays: Menü-Dropdown, Einstellungen, Speichern/Laden-Popup.
  const [menuOpen, setMenuOpen] = useState(false);
  // Das Zahnrad-Menü öffnet/schließt NUR per Klick (kein Hover). Ein Klick
  // außerhalb des Menüs schließt es wieder.
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  // Vereins-Editor (kosmetisch): erreichbar über das Zahnrad-Menü UND über den
  // „Bearbeiten"-Button im VEREINSÜBERBLICK. Auf GameShell-Ebene gehalten,
  // damit beide Zugänge dasselbe Modal öffnen.
  const [clubEditorOpen, setClubEditorOpen] = useState(false);
  const runningRef = useRef(false);
  useEffect(() => { runningRef.current = running; if (running) setMenuOpen(false); }, [running]);

  const g = game;
  const myClub = g.clubs[g.managedClubId];

  // Saison-Briefing: zu Spielbeginn und nach dem Saisonwechsel automatisch zeigen
  // (game/seasonBriefing.ts merkt es in g.briefing.pending vor; Laden setzt es zurück).
  const pendingSeason = g.briefing?.pending;
  const autoBriefing = settings.briefingAuto !== false;
  const pendingRec = pendingSeason && autoBriefing ? briefingLog(g).records.find((r) => r.season === pendingSeason) : undefined;
  useEffect(() => {
    if (pendingSeason && (!autoBriefing || !pendingRec)) { clearPendingBriefing(g); rerender(); }
  }, [pendingSeason, autoBriefing, pendingRec, g, rerender]);
  useEffect(() => { if (pendingRec) setRunning(false); }, [pendingRec]);
  const pendingBriefing = useMemo(() => (pendingRec ? briefingOfRecord(pendingRec) : null), [pendingRec]);
  const closeBriefing = useCallback(() => { clearPendingBriefing(g); rerender(); }, [g, rerender]);

  // --- Speichern ---
  const doSave = useCallback((slot?: string, name?: string) => {
    const useSlot = slot ?? currentSlot ?? nextFreeSlot();
    const ok = saveGame(useSlot, {
      name: (name && name.trim()) ? name.trim() : `${myClub.name} · ${g.season}`,
      managerName: g.manager.name,
      clubName: myClub.name,
      clubId: g.managedClubId,
      season: g.season,
      gameDate: g.calendar.currentDate,
    }, g);
    if (ok) {
      setCurrentSlot(useSlot);
      setSaveMsg('Spiel gespeichert');
    } else {
      setSaveMsg('Speichern fehlgeschlagen');
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }, [currentSlot, g, myClub, setCurrentSlot]);

  // ---------------------------------------------------------------------------
  // Kalender-Logik: einen Tag verarbeiten
  // ---------------------------------------------------------------------------
  const processDay = useCallback((): boolean => {
    const ok = processGameDay(g, {
      // Spielbericht nach „Schnell simulieren“; nach dem Textmodus nicht nochmal.
      onOwnMatch: (id) => { if (watchedRef.current) watchedRef.current = false; else setLiveMatchId(id); },
      onOwnMatchDue: () => setRunning(false),
      onRatingCeremony: (c) => setRatingCeremony(c),
      onSeasonEnd: () => { if (settings.autosave) doSave(); },
      onCupDraw: (d) => {
        const mode = settings.drawShow ?? 'eigener';
        if (mode === 'aus' || (mode === 'eigener' && !d.involvesMe)) return false;
        setDrawQueue((q) => [...q, { comp: d.comp, roundIndex: d.roundIndex, n: ++drawSeq.current }]);
        return true;
      },
      onCampEnd: (id) => { setCampQueue((q) => [...q, id]); return true; },
    });
    if (!ok) setRunning(false);
    return ok;
  }, [g, settings.autosave, settings.drawShow, doSave, myClub]);

  useEffect(() => { setHistory([]); }, [g.calendar.currentDate]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { processDay(); rerender(); }, g.calendar.speedMs);
    return () => clearInterval(id);
  }, [running, processDay, rerender, g.calendar.speedMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !liveMatchId && !textMatch && !g.briefing?.pending && !drawOpenRef.current) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [liveMatchId, textMatch]);
  const drawOpenRef = useRef(false);
  useEffect(() => { drawOpenRef.current = drawQueue.length > 0 || campQueue.length > 0; }, [drawQueue, campQueue]);

  const seasonOver = CalendarEngine.isSeasonOver(g.calendar);

  // Eigenes Spiel heute fällig → „Schnell simulieren“ / „Textmodus“ statt „Weiter“.
  const due = !running && !seasonOver && !textMatch ? findOwnMatchDue(g) : null;
  const quickSim = () => {
    if (!due) return;
    quickSimOwnMatch(g, due);
    processDay();
    rerender();
  };
  const startText = () => {
    if (!due) return;
    const sim = createOwnMatchSim(g, due, true);
    if (sim) setTextMatch({ sim, info: due });
  };
  // Header-Button: nur Text (kein Icon/Datum) – Zustand bleibt sprechend.
  const hdrBtnLabel = seasonOver ? 'Neue Saison' : running ? 'Pause' : 'Weiter';
  // Aktive Hauptkategorie für die Header-Navigation.
  const navMatched = MENU_STRUCTURE.find((c) => c.dash === screen || c.subs.some((s) => s.screen === screen));

  const isZentrale = screen === 'dashboard';
  // Dashboard-aehnliche Seiten: Zentrale + die 6 Kategorie-Dashboards. Teilen sich
  // das fuellende Flex-Layout (Boxen mit fixer Geometrie, Kalenderstreifen oben).
  // Seit dem Seiten-Umbau nutzen ALLE Seiten das Zentrale-Raster (src/ui/DashPage.tsx).
  const isDashLike = true;
  // Szenen-Seiten (gezeichnetes Bild füllt alles unter der Menüleiste): ohne Footer und
  // Hintergrundfoto.
  const isScene = screen === 'stadium';
  // Kalender-Overlay (CalendarOverlay.tsx): nur solange die Zeit läuft und kein Popup offen ist.
  const calLive = running && !textMatch && !liveMatchId && !ratingCeremony && !pendingBriefing && !devReveal
    && drawQueue.length === 0 && !showSettings && !saveLoadMode && !clubEditorOpen;

  return (
    // Vereinsprofil: jeder <ClubLink> im Spiel öffnet es (components/club/ClubProfileContext.tsx).
    <ClubProfileProvider g={g} onChange={rerender}>
    <div className={`app-shell ${isZentrale ? 'shell-zentrale' : ''} ${isDashLike ? 'shell-dashlike' : ''} ${isScene ? 'shell-scene' : ''} ${calLive ? 'cal-live' : ''}`}>
      {/* ---------------- HEADER (eine Leiste) ---------------- */}
      <header className={`hd-bar ${isZentrale ? 'hd-bar--zentrale' : ''}`}>
        {/* Logo */}
        <div className="hd-logo">
          <span className="hd-logo-year">1975</span>
          <span className="hd-logo-div" aria-hidden="true" />
          <span className="hd-logo-title"><span>A Football</span><span>Manager</span></span>
        </div>

        {/* Hauptnavigation (7 Kategorien) */}
        <nav className="hd-nav">
          {MENU_STRUCTURE.map((cat) => {
            const active = !!navMatched && cat.key === navMatched.key;
            return (
              <button
                key={cat.key}
                className={`hd-nav-item ${active ? 'active' : ''}`}
                onClick={() => setScreen(cat.dash)}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Rechter Block: Kontostand, Verein, Weiter, Einstellungen */}
        <div className="hd-right">
          {saveMsg && <span className="save-toast">{saveMsg}</span>}
          <div className="hd-club" title={myClub.name}>
            <ClubCrest club={myClub} size={60} />
            <span className="hd-club-name">{myClub.name}</span>
          </div>
          <span className="hd-sep" aria-hidden="true" />
          <div className="hd-balance">
            <span className="hd-balance-ico"><Icon name="finances" /></span>
            <span className="hd-balance-lbl">Kontostand:</span>
            <span className={`hd-balance-val ${myClub.finances.balance < 0 ? 'neg' : 'pos'}`}>{fmtDMfull(myClub.finances.balance)}</span>
          </div>
          <span className="hd-sep" aria-hidden="true" />
          <div className="hdr-menu" ref={menuRef}>
            <button
              className="hd-gear"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              title="Menü & Einstellungen"
            >
              <Icon name="settings" />
            </button>
            {menuOpen && (
              <div className="menu-dropdown" role="menu">
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setShowSettings(true); }}>
                  <Icon name="settings" /> <span>Einstellungen</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setScreen('wiki'); }}>
                  <Icon name="wiki" /> <span>Wiki / Spielhilfe</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setClubEditorOpen(true); }}>
                  <Icon name="dashVerein" /> <span>Editor</span>
                </button>
                <div className="menu-dd-sep" />
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setSaveLoadMode('save'); }}>
                  <Icon name="save" /> <span>Speichern</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setSaveLoadMode('load'); }}>
                  <Icon name="loadGame" /> <span>Laden</span>
                </button>
                <div className="menu-dd-sep" />
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); if (confirm('Zurück zum Hauptmenü? Nicht gespeicherter Fortschritt geht verloren.')) onExit(); }}>
                  <Icon name="mainmenu" /> <span>Hauptmenü</span>
                </button>
                <button className="menu-dd-item danger" role="menuitem" onClick={() => { setMenuOpen(false); if (confirm('Spiel wirklich beenden? Nicht gespeicherter Fortschritt geht verloren.')) onExit(); }}>
                  <Icon name="quit" /> <span>Spiel beenden</span>
                </button>
              </div>
            )}
          </div>
          <span className="hd-sep" aria-hidden="true" />
          {due ? (
            <div className="hd-match-btns">
              <button className="hd-continue compact" onClick={quickSim} title="Sofortiges Ergebnis">
                <span className="hd-continue-ico" aria-hidden="true"><Icon name="skip" size={34} /></span>
                <span className="hd-continue-lbl">Schnell simulieren</span>
              </button>
              <button className="hd-continue compact text" onClick={startText} title="Spiel im Textmodus verfolgen und eingreifen">
                <span className="hd-continue-ico" aria-hidden="true"><Icon name="matchball" size={34} /></span>
                <span className="hd-continue-lbl">Textmodus</span>
              </button>
            </div>
          ) : (
            <button
              className={`hd-continue ${running ? 'running' : ''} ${seasonOver ? 'season' : ''}`}
              onClick={() => {
                if (seasonOver) { startNextSeason(g); setRunning(false); rerender(); }
                else setRunning((r) => !r);
              }}
              title={seasonOver ? 'Nächste Saison starten' : 'Leertaste'}
            >
              <span className="hd-continue-ico" aria-hidden="true">
                {running ? (
                  <svg viewBox="0 0 24 24" width="38" height="38"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="45" height="45"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
                )}
              </span>
              <span className="hd-continue-txt">
                <span className="hd-continue-lbl">{hdrBtnLabel}</span>
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ---------------- UNTERMENÜ (Unterpunkte der aktiven Kategorie) ---------------- */}
      <TopNav screen={screen} setScreen={setScreen} dateLabel={fmtDateFull(g.calendar.currentDate)} onBack={history.length ? goBack : undefined} />

      {/* ---------------- HAUPTINHALT ---------------- */}
      <main className="app-main">
        {screen === 'dashboard' && <Dashboard g={g} onGoto={setScreen} onWatch={(id) => setLiveMatchId(id)} onOpenEditor={() => setClubEditorOpen(true)} />}
        {screen === 'table' && <TableView g={g} />}
        {screen === 'fixtures' && <FixturesView g={g} onWatch={(id) => setLiveMatchId(id)} />}
        {screen === 'squad' && <SquadView g={g} onChange={rerender} />}
        {screen === 'lineup' && <LineupView g={g as any} onChange={rerender} />}
        {screen === 'training' && <TrainingPlanView g={g} onChange={rerender} />}
        {screen === 'transfers' && <TransfersView g={g} onDone={rerender} />}
        {screen === 'finances' && <FinancesView g={g} />}
        {screen === 'youth' && <YouthView g={g} onChange={rerender} />}
        {screen === 'akademie' && <AcademyView g={g} onChange={rerender} />}
        {screen === 'facilities' && <FacilitiesView g={g} onChange={rerender} onGoto={(sc) => setScreen(sc)} />}
        {screen === 'staff' && <StaffView g={g} onChange={rerender} />}
        {screen === 'marketing' && <MarketingView g={g} onChange={rerender} />}
        {screen === 'calendar' && <CalendarView g={g} onChange={rerender} onGoto={setScreen} />}
        {screen === 'briefing' && <BriefingView g={g} onGoto={setScreen} onOpen={() => setRunning(false)} />}
        {screen === 'cup' && <CupView g={g} onWatch={(id) => setLiveMatchId(id)} onReplayDraw={(ri) => replayDraw('cup', ri)} />}
        {screen === 'ruhmeshalle' && <HallOfFameView g={g} />}
        {screen === 'news' && <NewsView g={g} onRead={rerender} />}
        {screen === 'wiki' && <WikiView key={wikiArticle?.n ?? 0} g={g} openArticle={wikiArticle?.id} />}
        {screen === 'tactics' && <TacticsView g={g as any} onChange={rerender} />}
        {screen === 'stadium' && <StadiumView g={g} onChange={rerender} onGoto={(sc) => setScreen(sc)} />}
        {/* Kategorie-Dashboards */}
        {screen === 'cat-spieltag' && <SpieltagDashboard g={g} onGoto={setScreen} onWatch={(id) => setLiveMatchId(id)} />}
        {screen === 'cat-kader' && <KaderDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-transfers' && <TransfersDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-finanzen' && <FinanzenDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-verein' && <VereinDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-statistiken' && <StatistikenDashboard g={g} onGoto={setScreen} />}
        {/* Rudimentäre Einzelseiten */}
        {screen === 'presse' && <PresseView g={g} onWatch={(id) => setLiveMatchId(id)} onGoto={setScreen} />}
        {screen === 'vertraege' && <VertraegeView g={g} onChange={rerender} />}
        {screen === 'beobachtung' && <BeobachtungView g={g} onChange={rerender} />}
        {screen === 'verhandlungen' && <VerhandlungenView g={g} onChange={rerender} />}
        {screen === 'sponsoring' && <SponsoringView g={g} onGoto={setScreen} onChange={rerender} />}
        {screen === 'fans' && <FansView g={g} />}
        {screen === 'vorstand' && <BoardView g={g} onChange={rerender} />}
        {screen === 'international' && <InternationalView g={g} onWatch={(id) => setLiveMatchId(id)} onReplayDraw={replayDraw} />}
        {screen === 'halle' && <IndoorView g={g} onChange={rerender} />}
        {screen === 'trainingslager' && <TrainingCampView g={g} onChange={rerender} />}
        {screen === 'kabine' && <DressingRoomView g={g} onChange={rerender} />}
        {screen === 'trainerteam' && <TrainerTeamView g={g} onChange={rerender} />}
        {screen === 'cat-training' && <TrainingDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-jugend' && <JugendDashboard g={g} onGoto={setScreen} />}
        {screen === 'jugendwettbewerbe' && <YouthCompetitionsView g={g} />}
      </main>

      {/* Persistenter Footer auf ALLEN Seiten (Dashboard inklusive) - voll buendig
          am unteren Rand, Shell-Ebene, einheitlich. */}
      {!isScene && (
        <footer className="dashx-foot">
          <span className="dashx-foot-l">1975 A FOOTBALL MANAGER</span>
          <span className="dashx-foot-c">SAISON {g.season}</span>
          <span className="dashx-foot-r"><button type="button" className="dashx-foot-link" onClick={() => setChronicleOpen(true)}>Chronik des deutschen Fußballs</button></span>
        </footer>
      )}

      {/* ---------------- IN-GAME-OVERLAYS ---------------- */}
      {chronicleOpen && <ChronicleModal g={g} onClose={() => setChronicleOpen(false)} />}
      <CalendarOverlay g={g} show={calLive} speedMs={g.calendar.speedMs} delayMs={150} onPause={() => setRunning(false)} />
      {showSettings && (
        <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onSave={onUpdateSettings} />
      )}
      {saveLoadMode && (
        <SaveLoadModal
          mode={saveLoadMode}
          currentSlot={currentSlot}
          onClose={() => setSaveLoadMode(null)}
          onSave={(slot, name) => { doSave(slot, name); setSaveLoadMode(null); }}
          onLoad={(slot) => { setSaveLoadMode(null); onLoad(slot); }}
        />
      )}
      {clubEditorOpen && (
        <ClubEditorModal
          club={myClub}
          clubs={Object.values(g.clubs)}
          onClose={() => setClubEditorOpen(false)}
          onSaved={(clubId, patch) => { if (clubId === g.managedClubId) Object.assign(myClub, patch); rerender(); doSave(); }}
        />
      )}

      {textMatch && (
        <MatchScreen g={g} sim={textMatch.sim} info={textMatch.info} settings={settings} onSettings={onUpdateSettings}
          onComplete={() => completeOwnMatch(g, textMatch.info, textMatch.sim, true)}
          onFinish={() => { watchedRef.current = true; processDay(); setTextMatch(null); rerender(); }} />
      )}

      {/* Ziehungs-Show: erst wenn Spielbericht/Textmodus/Zeremonie/Briefing zu sind. */}
      {(() => {
        const d = drawQueue[0];
        if (!d || textMatch || liveMatchId || ratingCeremony || pendingBriefing) return null;
        const rec = compCup(g, d.comp)?.rounds[d.roundIndex]?.draw;
        if (!rec) { setTimeout(() => setDrawQueue((q) => q.slice(1)), 0); return null; }
        return (
          <DrawShow key={d.n} g={g} rec={rec} replay={d.replay} settings={settings} onSettings={onUpdateSettings}
            onClose={() => { setDrawQueue((q) => q.slice(1)); rerender(); }} />
        );
      })()}

      {/* Bilanz des Trainingslagers: nach Spielbericht/Zeremonie/Briefing/Auslosung. */}
      {campQueue[0] && !textMatch && !liveMatchId && !ratingCeremony && !pendingBriefing && !drawQueue.length && (
        <CampRecap key={campQueue[0]} g={g} bookingId={campQueue[0]} onClose={() => { setCampQueue((q) => q.slice(1)); rerender(); }} />
      )}

      {liveMatchId && (
        <MatchModal g={g} matchId={liveMatchId} onClose={() => { setLiveMatchId(null); rerender(); }} />
      )}

      {devReveal && (
        <DevelopmentReveal
          g={g}
          reveals={devReveal}
          onClose={() => { setDevReveal(null); rerender(); }}
        />
      )}

      {pendingBriefing && (
        <BriefingModal b={pendingBriefing} g={g} auto intro={settings.briefingIntro !== false}
          onClose={closeBriefing} onGoto={setScreen} />
      )}

      {ratingCeremony && (
        <RatingCeremony
          results={ratingCeremony.results}
          type={ratingCeremony.type}
          anlass={ratingCeremony.anlass}
          onClose={() => { setRatingCeremony(null); rerender(); }}
        />
      )}
    </div>
    </ClubProfileProvider>
  );
}

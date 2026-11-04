// =============================================================================
// SPIEL-SHELL (In-Game UI): nur Oberfläche. Der Tagesablauf liegt komplett in
// game/day.ts (`processDay`); hier: Zeitlauf-Takt, Fensterkette (usePopupQueue +
// PopupLayer), Kopfleiste (HeaderBar), Routing der Seiten (ScreenRouter).
// =============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClubProfileProvider } from '../components/club/ClubProfileContext';
import { PlayerMenuProvider } from '../components/playerMenu/PlayerContextMenu';
import { CalendarEngine } from '../engine/calendar';
import { JUMP_DECISION_EVENT, pendingDecisions } from '../engine/messages';
import { AppSettings, nextFreeSlot, saveGame } from '../engine/save';
import { processDay as processGameDay } from '../game/day';
import { createOwnMatchSim, findOwnMatchDue, quickSimOwnMatch } from '../game/ownMatch';
import { startNextSeason } from '../game/season';
import { Game } from '../game/state';
import { setEventFrequency } from '../engine/randomEvents';
import { setWikiOpener } from '../ui/InfoTip';
import { fmtDateFull } from '../ui/format';
import { HeaderBar } from './HeaderBar';
import { preloadEarlyParts, preloadShellParts } from './lazyParts';
import { Screen, TopNav } from './navigation';
import { PopupLayer } from './PopupLayer';
import { ScreenRouter } from './ScreenRouter';
import { chainFlags, usePopupQueue } from './usePopupQueue';
import { useScreenHistory } from './useScreenHistory';
import { CONTRACT_SCREEN_EVENT, ContractOpenReq } from '../screens/contract/contractOpen';

/**
 * Automatisierte Oberflächentests (Playwright setzt navigator.webdriver): die Sperre „Weiter“
 * bei offenen Entscheidungen greift dort nicht, sonst bliebe jeder Zeitlauf-Test hängen.
 * `localStorage.fmTestMail = '1'` schaltet sie für den eigenen Test (tests/mailbtn-shots.mjs) wieder ein.
 */
function automatedRun(): boolean {
  try { return typeof navigator !== 'undefined' && !!navigator.webdriver && localStorage.getItem('fmTestMail') !== '1'; } catch { return false; }
}

export function GameShell({ game, rerender, currentSlot, setCurrentSlot, settings, onExit, onLoad, onUpdateSettings }: {
  game: Game; rerender: () => void; currentSlot: string | null;
  setCurrentSlot: (s: string | null) => void; settings: AppSettings; onExit: () => void;
  onLoad: (slot: string) => void; onUpdateSettings: (s: AppSettings) => void;
}) {
  // Seitenwahl + Verlauf Zurück/Vorwärts (Alt+←/→), Chronik-Fenster (shell/useScreenHistory.ts).
  const nav = useScreenHistory(game.calendar.currentDate);
  const { screen, setScreen, chronicleOpen, setChronicleOpen } = nav;
  // i-Hilfen: „Mehr im Wiki“ öffnet den Artikel (ui/InfoTip.tsx)
  const [wikiArticle, setWikiArticle] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => setWikiOpener((id) => { setWikiArticle((w) => ({ id, n: (w?.n ?? 0) + 1 })); setScreen('wiki'); }), []);
  // Häufigkeit der Zufallsereignisse (Einstellung) – hier statt in App.tsx, damit das Hauptmenü ohne Spiel-Code startet.
  useEffect(() => { setEventFrequency(settings.eventFrequency); }, [settings.eventFrequency]);
  // Nachgeladene Seiten/Fenster im Leerlauf vorladen (shell/lazyParts.ts).
  useEffect(() => { preloadEarlyParts(); return preloadShellParts(); }, []);
  const [running, setRunning] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  // Vereins-Editor (kosmetisch): über das Zahnrad-Menü UND „Bearbeiten“ im Vereinsüberblick.
  const [clubEditorOpen, setClubEditorOpen] = useState(false);

  const g = game;
  const myClub = g.clubs[g.managedClubId];
  const q = usePopupQueue(g, settings, rerender, setRunning);
  // Verhandlungstisch (screens/contract/): von überall per Ereignis geöffnet, hält die Zeit an.
  const [contractReq, setContractReq] = useState<(ContractOpenReq & { n: number }) | null>(null);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => { const d = (e as CustomEvent<ContractOpenReq>).detail; if (d) { setRunning(false); setContractReq({ ...d, n: ++n }); } };
    window.addEventListener(CONTRACT_SCREEN_EVENT, on);
    return () => window.removeEventListener(CONTRACT_SCREEN_EVENT, on);
  }, []);

  // --- Speichern ---
  const doSave = useCallback((slot?: string, name?: string) => {
    const useSlot = slot ?? currentSlot ?? nextFreeSlot();
    const ok = saveGame(useSlot, {
      name: (name && name.trim()) ? name.trim() : `${myClub.name} · ${g.season}`,
      managerName: g.manager.name, clubName: myClub.name, clubId: g.managedClubId,
      season: g.season, gameDate: g.calendar.currentDate,
    }, g);
    if (ok) setCurrentSlot(useSlot);
    setSaveMsg(ok ? 'Spiel gespeichert' : 'Speichern fehlgeschlagen');
    setTimeout(() => setSaveMsg(''), 2500);
  }, [currentSlot, g, myClub, setCurrentSlot]);

  // --- Einen Tag verarbeiten (game/day.ts); Rückrufe merken Fenster vor ---
  const { dayUi } = q;
  const processDay = useCallback((): boolean => {
    const ok = processGameDay(g, dayUi(() => { if (settings.autosave) doSave(); }));
    if (!ok) setRunning(false);
    return ok;
  }, [g, dayUi, settings.autosave, doSave]);


  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { processDay(); rerender(); }, g.calendar.speedMs);
    return () => clearInterval(id);
  }, [running, processDay, rerender, g.calendar.speedMs]);

  const drawOpenRef = useRef(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !q.liveMatchId && !q.textMatch && !g.briefing?.pending && !g.budget?.pending && !drawOpenRef.current && !document.querySelector('.ct-root')) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setRunning((r) => (r ? false : automatedRun() || pendingDecisions(g.messages ?? []).length === 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q.liveMatchId, q.textMatch]);
  useEffect(() => { drawOpenRef.current = q.drawQueue.length > 0 || q.campQueue.length > 0 || !!q.twKey || !!q.indoorDue; }, [q.drawQueue, q.campQueue, q.twKey, q.indoorDue]);

  const seasonOver = CalendarEngine.isSeasonOver(g.calendar);
  // Eigenes Spiel heute fällig → Vorschau bzw. „Schnell simulieren“ / „Textmodus“ statt „Weiter“.
  const due = !running && !seasonOver && !q.textMatch ? findOwnMatchDue(g) : null;
  const quickSim = () => {
    if (!due) return;
    quickSimOwnMatch(g, due);
    processDay();
    rerender();
  };
  const startText = () => {
    if (!due) return;
    const sim = createOwnMatchSim(g, due, true);
    if (sim) q.setTextMatch({ sim, info: due });
  };
  const finishText = () => { q.watchedRef.current = true; processDay(); q.setTextMatch(null); rerender(); };
  // Vorschau „Nächstes Spiel“ (screens/prematch/): ersetzt die zwei Knöpfe, solange sie eingeschaltet ist.
  const prematchOn = settings.prematchScreen !== false;
  const flags = chainFlags(q, due, prematchOn);
  // Wichtige Nachrichten (offene Entscheidungen): „Weiter“ gesperrt, Knopf verweist auf die Nachrichten.
  const mustRead = !running && !seasonOver && !automatedRun() && pendingDecisions(g.messages ?? []).length > 0;

  // Szenen-Seiten (gezeichnetes Bild füllt alles unter der Menüleiste): ohne Footer und Hintergrundfoto.
  const isScene = screen === 'stadium';
  // Kalender-Overlay (CalendarOverlay.tsx): nur solange die Zeit läuft und kein Popup offen ist.
  const calLive = running && !q.textMatch && !q.liveMatchId && !q.ratingCeremony && !q.popupHold && !q.devReveal
    && q.drawQueue.length === 0 && !showSettings && !saveLoadMode && !clubEditorOpen && !q.indoorDue && !contractReq;

  return (
    // Vereinsprofil: jeder <ClubLink> im Spiel öffnet es (components/club/ClubProfileContext.tsx).
    <ClubProfileProvider g={g} onChange={rerender}>
    <PlayerMenuProvider g={g} onChange={rerender} onGoto={(s) => setScreen(s as Screen)}>
    <div className={`app-shell ${screen === 'dashboard' ? 'shell-zentrale' : ''} shell-dashlike ${isScene ? 'shell-scene' : ''} ${calLive ? 'cal-live' : ''}`}>
      <HeaderBar g={g} settings={settings} onSettings={onUpdateSettings} screen={screen} setScreen={setScreen} saveMsg={saveMsg} running={running} seasonOver={seasonOver}
        due={due} prematchOn={prematchOn} mustRead={mustRead}
        menu={{
          settings: () => setShowSettings(true), wiki: () => setScreen('wiki'), editor: () => setClubEditorOpen(true),
          save: () => setSaveLoadMode('save'), load: () => setSaveLoadMode('load'), exit: onExit,
        }}
        onOpenPrematch={() => q.setPrematchClosed(null)} onQuickSim={quickSim} onStartText={startText}
        onReadMail={() => { setScreen('dashboard'); setTimeout(() => window.dispatchEvent(new Event(JUMP_DECISION_EVENT)), 0); }}
        onContinue={() => {
          if (seasonOver) { startNextSeason(g); setRunning(false); rerender(); }
          else setRunning((r) => !r);
        }} />

      {/* Untermenü (Unterpunkte der aktiven Kategorie) */}
      <TopNav screen={screen} setScreen={setScreen} dateLabel={fmtDateFull(g.calendar.currentDate)} onBack={nav.onBack} onForward={nav.onForward} />

      <main className="app-main">
        <ScreenRouter screen={screen} g={g} rerender={rerender} setScreen={setScreen} wikiArticle={wikiArticle}
          onWatch={(id) => q.setLiveMatchId(id)} onReplayDraw={q.replayDraw}
          onOpenEditor={() => setClubEditorOpen(true)} onPause={() => setRunning(false)} />
      </main>

      {/* Persistenter Footer auf allen Seiten außer Szenen-Seiten. */}
      {!isScene && (
        <footer className="dashx-foot">
          <span className="dashx-foot-l">1975 A FOOTBALL MANAGER</span>
          <span className="dashx-foot-c">SAISON {g.season}</span>
          <span className="dashx-foot-r"><button type="button" className="dashx-foot-link" onClick={() => setChronicleOpen(true)}>Chronik des deutschen Fußballs</button></span>
        </footer>
      )}

      <PopupLayer g={g} settings={settings} onSettings={onUpdateSettings} rerender={rerender} q={q} f={flags} due={due}
        calLive={calLive} setRunning={setRunning} quickSim={quickSim} startText={startText} finishText={finishText} setScreen={setScreen}
        w={{
          chronicleOpen, closeChronicle: () => setChronicleOpen(false),
          showSettings, closeSettings: () => setShowSettings(false),
          saveLoadMode, closeSaveLoad: () => setSaveLoadMode(null),
          clubEditorOpen, closeClubEditor: () => setClubEditorOpen(false),
          currentSlot, doSave, onLoad,
          contractReq, closeContract: () => { setContractReq(null); rerender(); },
        }} />
    </div>
    </PlayerMenuProvider>
    </ClubProfileProvider>
  );
}

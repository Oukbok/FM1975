import { applyDataset } from './data/dataset/apply';
import { BUILTIN_ID } from './data/dataset/builtin';
import { cachedDataset, hydrateDatasets } from './data/dataset/storage';
import { hydrateClubOverrides } from './data/clubOverrides';
import { yearOf } from './engine/economy';
import { AppSettings, loadGame, loadSettings, saveSettings } from './engine/save';
import { Game } from './game/state';
import { MainMenu } from './screens/MainMenu';
import { GameShell } from './shell/GameShell';
import { createNewGame } from './game/newGame';
import { prepareLoadedGame } from './game/loadMigrations';
import { NewGameOptions } from './types';
import { DisplayFrame, applyDisplayMode } from './ui/DisplayFrame';
import { setDisplayYear, setWagePeriod } from './ui/format';
import { setEventFrequency } from './engine/randomEvents';
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
  // Eigene Datensätze (IndexedDB) in den Zwischenspeicher laden.
  useEffect(() => { hydrateDatasets().then(rerender).catch(() => {}); }, [rerender]);

  // --- Neues Spiel starten ---
  const startGame = useCallback((opts: NewGameOptions, prebuilt?: Game) => {
    // Gewählten Datensatz anwenden (Vereine, Ligen, Geschichte …), dann das Spiel erzeugen
    // (bzw. das im Assistenten für „Willkommen beim Verein“ schon erzeugte übernehmen).
    const ds = cachedDataset(opts.datasetId);
    applyDataset(ds);
    const g0 = prebuilt ?? createNewGame(opts);
    g0.datasetId = ds?.meta.id ?? BUILTIN_ID;
    g0.datasetName = ds?.meta.name ?? 'Standard (1975)';
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
    prepareLoadedGame(s.game);
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
    setEventFrequency(s.eventFrequency);
  }, []);

  // Anzeige-Modus beim Start bestmöglich wiederherstellen (ohne Nutzer-Geste
  // kann der Browser Vollbild ablehnen — das wird sauber abgefangen).
  useEffect(() => {
    applyDisplayMode(settings.displayMode);
    setEventFrequency(settings.eventFrequency);
    // nur einmal beim Mounten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  setWagePeriod(settings.wagePeriod); // Gehaltsanzeige pro Jahr/Woche (vor dem Rendern der Seiten)
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

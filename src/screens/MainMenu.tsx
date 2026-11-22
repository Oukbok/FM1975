import { AppSettings, SaveMeta, deleteSave, listSaves, storageAvailable } from '../engine/save';
import { desktopApi } from '../engine/saveStore';
import { versionLabel } from '../engine/appVersion';
import { NewGameOptions } from '../types';
import type { Game } from '../game/state';
import { LoadGameScreen } from './LoadGameScreen';
import { SettingsScreen } from './SettingsScreen';
import { Suspense, useState } from 'react';
import { lazyNamed } from '../ui/lazyNamed';

// Assistent „Neues Spiel“ und Datensatz-Verwaltung werden erst beim Öffnen geladen (Code-Splitting).
const newGameScreen = lazyNamed(() => import('./NewGameScreen'), 'NewGameScreen');
const NewGameScreen = newGameScreen.component;
/** Vom Hauptmenü aus im Leerlauf vorladen (App.tsx). */
export const preloadNewGameScreen = newGameScreen.preload;
const DatasetScreen = lazyNamed(() => import('./DatasetScreen'), 'DatasetScreen').component;
const loading = <div className="lazy-page" role="status"><span className="lazy-note">Lädt …</span></div>;

// =============================================================================
// STARTBILDSCHIRM (Menü) – Entwurf „Abendhimmel“: Tribünenfoto mit drei
// Epochen, Logo im Himmel, Menüleiste auf dem Rasen.
// =============================================================================
export type MenuView = 'main' | 'new' | 'load' | 'settings' | 'datasets';

export function MainMenu({ settings, onNewGame, onLoad, onUpdateSettings }: {
  settings: AppSettings;
  onNewGame: (o: NewGameOptions, prebuilt?: Game) => void;
  onLoad: (slot: string) => void;
  onUpdateSettings: (s: AppSettings) => void;
}) {
  const [view, setView] = useState<MenuView>('main');
  const [saves, setSaves] = useState<SaveMeta[]>(() => listSaves());
  const refreshSaves = () => setSaves(listSaves());

  // Neues Spiel: eigener Vollbild-Assistent statt schmaler Menüspalte.
  if (view === 'new') {
    return (
      <div className="menu-bg ng-host">
        <Suspense fallback={loading}>
          <NewGameScreen defaults={settings} onBack={() => setView('main')} onStart={onNewGame} onSettings={onUpdateSettings} />
        </Suspense>
      </div>
    );
  }

  const desktop = desktopApi();
  const quit = () => {
    if (desktop) { desktop.quit(); return; }
    // "Spiel verlassen": Tab/Fenster schließen; sonst Hinweis.
    window.open('', '_self');
    window.close();
    setTimeout(() => alert('Du kannst den Tab jetzt schließen. Dein Fortschritt ist gespeichert, sofern du gespeichert hast.'), 50);
  };

  return (
    <div className="st-start">
      <div className="st-img">
        <img src="assets/start-grandstand.jpg" alt="" draggable={false} />
      </div>
      <div className="st-scrim" />

      {view === 'main' && <>
        <div className="st-logo">
          <span className="y">1975</span>
          <span className="n">A FOOTBALL MANAGER</span>
          <span className="t">Ein Verein. Fünf Jahrzehnte.</span>
        </div>
        <nav className="st-menu" aria-label="Hauptmenü">
          <button className="st-btn primary" onClick={() => setView('new')}>Neues Spiel</button>
          <button className="st-btn" onClick={() => { refreshSaves(); setView('load'); }}>
            Spiel laden{saves.filter((x) => !x.slot.startsWith('vorlage-')).length > 0 && <span className="cnt">{saves.filter((x) => !x.slot.startsWith('vorlage-')).length}</span>}
          </button>
          <button className="st-btn" onClick={() => setView('settings')}>Einstellungen</button>
          <button className="st-btn" onClick={() => setView('datasets')}>Datensätze &amp; Editor</button>
          <button className="st-btn" onClick={quit}>Beenden</button>
        </nav>
        {!storageAvailable() && <div className="st-note">Speichern/Laden ist in dieser Umgebung nicht verfügbar (localStorage gesperrt).</div>}
        <div className="st-version">
          <span>{versionLabel()}</span>
          {desktop && <button onClick={() => { desktop.saves.openFolder(); }}>Spielstand-Ordner öffnen</button>}
        </div>
      </>}

      {view !== 'main' && (
        <div className="st-sub" onClick={(e) => { if (e.target === e.currentTarget) setView('main'); }}>
          {view === 'datasets' && <Suspense fallback={loading}><DatasetScreen onBack={() => setView('main')} /></Suspense>}
          {view === 'load' && (
            <LoadGameScreen
              saves={saves}
              onBack={() => setView('main')}
              onLoad={onLoad}
              onDelete={(slot) => { deleteSave(slot); refreshSaves(); }}
            />
          )}
          {view === 'settings' && (
            <SettingsScreen settings={settings} onBack={() => setView('main')} onSave={onUpdateSettings} />
          )}
        </div>
      )}
    </div>
  );
}

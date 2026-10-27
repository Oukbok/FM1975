import Icon from '../components/Icon';
import { AppSettings, SaveMeta, deleteSave, listSaves, storageAvailable } from '../engine/save';
import { NewGameOptions } from '../types';
import { LoadGameScreen } from './LoadGameScreen';
import { NewGameScreen } from './NewGameScreen';
import { SettingsScreen } from './SettingsScreen';
import { DatasetScreen } from './DatasetScreen';
import { useState } from 'react';

// =============================================================================
// STARTBILDSCHIRM (Menü)
// =============================================================================
export type MenuView = 'main' | 'new' | 'load' | 'settings' | 'datasets';

export function MainMenu({ settings, onNewGame, onLoad, onUpdateSettings }: {
  settings: AppSettings;
  onNewGame: (o: NewGameOptions) => void;
  onLoad: (slot: string) => void;
  onUpdateSettings: (s: AppSettings) => void;
}) {
  const [view, setView] = useState<MenuView>('main');
  const [saves, setSaves] = useState<SaveMeta[]>(() => listSaves());
  const refreshSaves = () => setSaves(listSaves());

  return (
    <div className="menu-bg">
      <div className="menu-wrap">
        <div className="menu-hero">
          {/* Wiederverwendbares SVG-Logo (public/assets/logo-1975.svg).
              Beide Zeilen sind im SVG bereits exakt gleich breit — dadurch
              braucht es keine Laufzeit-Breitenmessung mehr, und das Logo liegt
              als eigenes DOM-Element über dem Hintergrund, sodass das Menü es
              bei keiner Auflösung überdecken kann. */}
          <img
            className="menu-logo"
            src="assets/logo-1975.svg"
            alt="1975 – A Football Manager"
            draggable={false}
          />
        </div>

        {view === 'main' && (
          <div className="menu-panel">
            <button className="menu-btn primary" onClick={() => setView('new')}>
              <span className="mi"><Icon name="newGame" /></span><span>Neues Spiel</span>
            </button>
            <button className="menu-btn" disabled={saves.length === 0} onClick={() => { refreshSaves(); setView('load'); }}>
              <span className="mi"><Icon name="loadGame" /></span><span>Spiel laden</span>
              {saves.length > 0 && <span className="menu-tag">{saves.length}</span>}
            </button>
            <button className="menu-btn" onClick={() => setView('datasets')}>
              <span className="mi"><Icon name="contracts" /></span><span>Datensätze & Editor</span>
            </button>
            <button className="menu-btn" onClick={() => setView('settings')}>
              <span className="mi"><Icon name="settings" /></span><span>Einstellungen</span>
            </button>
            <button className="menu-btn danger" onClick={() => {
              // "Spiel verlassen": Tab/Fenster schließen; sonst Hinweis.
              window.open('', '_self');
              window.close();
              setTimeout(() => alert('Du kannst den Tab jetzt schließen. Dein Fortschritt ist gespeichert, sofern du gespeichert hast.'), 50);
            }}>
              <span className="mi"><Icon name="quit" /></span><span>Spiel verlassen</span>
            </button>
            {!storageAvailable() && (
              <div className="mini red mt12" style={{ textAlign: 'center' }}>
                Speichern/Laden ist in dieser Umgebung nicht verfügbar (localStorage gesperrt).
              </div>
            )}
          </div>
        )}

        {view === 'datasets' && <DatasetScreen onBack={() => setView('main')} />}

        {view === 'new' && (
          <NewGameScreen defaults={settings} onBack={() => setView('main')} onStart={onNewGame} />
        )}

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
    </div>
  );
}

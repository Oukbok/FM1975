import { AppSettings, SaveMeta, deleteSave, listSaves, storageAvailable } from '../engine/save';
import { NewGameOptions } from '../types';
import { LoadGameScreen } from './LoadGameScreen';
import { NewGameScreen } from './NewGameScreen';
import { SettingsScreen } from './SettingsScreen';
import { DatasetScreen } from './DatasetScreen';
import { useState } from 'react';

// =============================================================================
// STARTBILDSCHIRM (Menü) – Entwurf „Abendhimmel“: Tribünenfoto mit drei
// Epochen, Logo im Himmel, Menüleiste auf dem Rasen, Zeitreise-Umschalter.
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
  // Zeitreise: -1 = ganzes Bild, 0/1/2 = 1970er/1990er/2020er hervorheben.
  const [era, setEra] = useState(-1);

  // Neues Spiel: eigener Vollbild-Assistent statt schmaler Menüspalte.
  if (view === 'new') {
    return (
      <div className="menu-bg ng-host">
        <NewGameScreen defaults={settings} onBack={() => setView('main')} onStart={onNewGame} />
      </div>
    );
  }

  const quit = () => {
    // "Spiel verlassen": Tab/Fenster schließen; sonst Hinweis.
    window.open('', '_self');
    window.close();
    setTimeout(() => alert('Du kannst den Tab jetzt schließen. Dein Fortschritt ist gespeichert, sofern du gespeichert hast.'), 50);
  };
  const ERAS: { k: number; l: string }[] = [{ k: -1, l: 'Heute' }, { k: 0, l: '1975' }, { k: 1, l: '1995' }, { k: 2, l: '2025' }];

  return (
    <div className="st-start">
      <div className={`st-img era-${era}`}>
        <img src="assets/start-tribuene.jpg" alt="" draggable={false} />
        {[0, 1, 2].map((i) => <div key={i} className={`st-shade s${i} ${era >= 0 && era !== i ? 'dim' : ''}`} />)}
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
          <button className="st-btn" disabled={saves.length === 0} onClick={() => { refreshSaves(); setView('load'); }}>
            Spiel laden{saves.length > 0 && <span className="cnt">{saves.length}</span>}
          </button>
          <button className="st-btn" onClick={() => setView('settings')}>Einstellungen</button>
          <button className="st-btn" onClick={() => setView('datasets')}>Datensätze &amp; Editor</button>
          <button className="st-btn" onClick={quit}>Beenden</button>
        </nav>
        {!storageAvailable() && <div className="st-note">Speichern/Laden ist in dieser Umgebung nicht verfügbar (localStorage gesperrt).</div>}
        <div className="st-era" role="group" aria-label="Zeitreise">
          <span className="lbl">ZEITREISE</span>
          {ERAS.map((x) => (
            <button key={x.k} className={era === x.k ? 'on' : ''} aria-pressed={era === x.k} onClick={() => setEra(x.k)}>{x.l}</button>
          ))}
        </div>
      </>}

      {view !== 'main' && (
        <div className="st-sub" onClick={(e) => { if (e.target === e.currentTarget) setView('main'); }}>
          {view === 'datasets' && <DatasetScreen onBack={() => setView('main')} />}
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

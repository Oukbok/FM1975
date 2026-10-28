import Icon from '../../components/Icon';
import { cachedSummaries } from '../../data/dataset/storage';
import { Difficulty } from '../../types';
import type { LegendMode, NewGameDraft } from '../NewGameScreen';

// Schritt 1: Spielwelt — Datensatz, Spieloptionen, historische Spieler, Tempo
const DIFF: [Difficulty, string, string][] = [
  ['easy', 'Leicht', 'Zum Kennenlernen.'],
  ['normal', 'Normal', 'Der vorgesehene Weg.'],
  ['hard', 'Schwer', 'Für erfahrene Manager.'],
];
const LEGEND: [LegendMode, string][] = [['off', 'Aus'], ['fictional', 'Fiktive Legenden'], ['custom', 'Eigene Namensdatei']];

export function StepSetup({ d, set, customNames, chooseDataset }: {
  d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; customNames: number; chooseDataset: (id: string) => void;
}) {
  const datasets = cachedSummaries();
  const legendText = d.legendMode === 'off'
    ? 'Keine Legenden: Alle Talente entstehen zufällig.'
    : d.legendMode === 'custom'
      ? `Legenden tragen die Namen aus deiner Namensdatei (${customNames} Einträge, nur in diesem Browser).`
      : 'Erfundene Ausnahmespieler tauchen zu festen Jahrgängen auf – ob sie Stars werden, entscheidet das Spiel.';
  return (
    <div className="ng-grid3">
      <section className="ng-box">
        <h3 className="ng-box-title"><Icon name="contracts" size={20} /> Datensatz</h3>
        <p className="ng-note">Vereine, Ligen, Namen und Geschichte stammen aus dem gewählten Datensatz. Eigene Datensätze legst du im Editor an.</p>
        <div className="ng-list">
          {datasets.map((ds) => (
            <button key={ds.id} className={`ng-card ${d.datasetId === ds.id ? 'on' : ''}`} onClick={() => chooseDataset(ds.id)}>
              <b>{ds.name}</b>
              <small>{ds.builtin ? 'Eingebaut' : ds.author ? `von ${ds.author}` : 'Eigener Datensatz'} · {ds.clubs} Vereine</small>
              {ds.description && <span>{ds.description}</span>}
            </button>
          ))}
        </div>
        <div className="ng-fact ng-push"><span>Startsaison</span><b>1975/76</b></div>
        <div className="ng-fact"><span>Startdatum</span><b>1. Juli 1975</b></div>
        <div className="ng-fact"><span>Währung</span><b>DM (ab 2002 Euro)</b></div>
      </section>

      <section className="ng-box">
        <h3 className="ng-box-title"><Icon name="settings" size={20} /> Spieloptionen</h3>
        <div className="ng-label">Schwierigkeit</div>
        <div className="ng-seg3">
          {DIFF.map(([k, l, t]) => (
            <button key={k} className={`ng-card small ${d.difficulty === k ? 'on' : ''}`} onClick={() => set({ difficulty: k })}>
              <b>{l}</b><small>{t}</small>
            </button>
          ))}
        </div>
        <div className="ng-toggles">
          <label className="toggle-item">
            <input type="checkbox" checked={d.injuries} onChange={(e) => set({ injuries: e.target.checked })} />
            <span className={`toggle ${d.injuries ? 'on' : ''}`}></span>
            Verletzungen
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={d.realistic} onChange={(e) => set({ realistic: e.target.checked })} />
            <span className={`toggle ${d.realistic ? 'on' : ''}`}></span>
            Realistische Kader
          </label>
        </div>
        <div className="ng-label">Spieltempo <b className="accent-text">{d.speedMs} ms/Tag</b> · {d.speedMs <= 600 ? 'schnell' : d.speedMs >= 1200 ? 'langsam' : 'mittel'}</div>
        <div className="ng-speed">
          <input type="range" min={300} max={1600} step={100} value={d.speedMs} onChange={(e) => set({ speedMs: +e.target.value })} />
        </div>
        <p className="ng-note">Das Tempo kannst du jederzeit im Spiel ändern.</p>
        <p className="ng-note ng-push">Die Spielwelt beginnt am 1. Juli 1975 mit der 2-Punkte-Regel. Regeln, Wettbewerbe und Ligen ändern sich über die Jahrzehnte – die Chronik im Spiel zeigt, was wann kommt.</p>
      </section>

      <section className="ng-box">
        <h3 className="ng-box-title"><Icon name="youth" size={20} /> Historische Spieler</h3>
        <div className="ng-list">
          {LEGEND.map(([k, l]) => (
            <button key={k} className={`ng-card ${d.legendMode === k ? 'on' : ''}`} disabled={k === 'custom' && !customNames}
              onClick={() => set({ legendMode: k })}>
              <b>{l}</b>
              <small>{k === 'off' ? 'Nur zufällige Talente' : k === 'fictional' ? 'Empfohlen' : customNames ? `${customNames} Namen geladen` : 'Keine Namensdatei geladen'}</small>
            </button>
          ))}
        </div>
        <p className="ng-note ng-push">{legendText}{!customNames && ' Eine eigene Namensdatei lädst du in den Einstellungen.'}</p>
      </section>
    </div>
  );
}

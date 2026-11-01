import Icon from '../../components/Icon';
import { cachedSummaries } from '../../data/dataset/storage';
import { Difficulty } from '../../types';
import type { NewGameDraft } from '../NewGameScreen';

// Schritt 1: Spielwelt — Datensatz, Spieloptionen, Tempo, Hinweis zu Talenten
const DIFF: [Difficulty, string, string][] = [
  ['easy', 'Leicht', 'Zum Kennenlernen.'],
  ['normal', 'Normal', 'Der vorgesehene Weg.'],
  ['hard', 'Schwer', 'Für erfahrene Manager.'],
];

export function StepSetup({ d, set, chooseDataset }: {
  d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; chooseDataset: (id: string) => void;
}) {
  const datasets = cachedSummaries();
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
        <h3 className="ng-box-title"><Icon name="youth" size={20} /> Talente &amp; Stars</h3>
        <p className="ng-note">Alle Spieler entwickeln sich nach denselben Regeln: Talent, Training, Spielpraxis, Charakter und etwas Glück.</p>
        <p className="ng-note">Ganz selten wächst ein Jahrhunderttalent heran, das schon mit 18 oder 19 zur Spitze gehört. Wo es auftaucht, weiß vorher niemand – vielleicht in deiner Akademie.</p>
        <div className="ng-fact ng-push"><span>Höhepunkt der meisten Profis</span><b>26–29 Jahre</b></div>
        <div className="ng-fact"><span>Weltklasse (85+) in der 1. Liga</span><b>10–15 Spieler</b></div>
        <div className="ng-fact"><span>Jahrhunderttalent</span><b>alle 10–20 Jahre</b></div>
      </section>
    </div>
  );
}

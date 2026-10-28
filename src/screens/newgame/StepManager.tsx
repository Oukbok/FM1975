import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { cachedSummaries } from '../../data/dataset/storage';
import { ManagerBackground, ManagerStyle } from '../../types';
import { BG_DE, STYLE_DE, type NewGameDraft } from '../NewGameScreen';
import { LEAGUES, leaguePreview } from './clubPreview';

// Schritt 3: Manager — Profil und Zusammenfassung vor dem Start
const DIFF_DE = { easy: 'Leicht', normal: 'Normal', hard: 'Schwer' } as const;
const LEGEND_DE = { off: 'Aus', fictional: 'Fiktive Legenden', custom: 'Eigene Namensdatei' } as const;

export function StepManager({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const club = leaguePreview(d.league).find((c) => c.id === d.clubId);
  const league = LEAGUES.find((l) => l.key === d.league);
  const ds = cachedSummaries().find((x) => x.id === d.datasetId);
  const age = 1975 - d.birthYear;
  return (
    <div className="ng-grid2">
      <section className="ng-box">
        <h3 className="ng-box-title"><Icon name="squad" size={20} /> Dein Managerprofil</h3>
        <div className="ng-form">
          <label>Name
            <input autoFocus value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Max Mustermann" maxLength={40} />
          </label>
          <label>Nationalität
            <input value={d.nationality} onChange={(e) => set({ nationality: e.target.value })} />
          </label>
          <label><span className="ng-inline">Geburtsjahr <small>({age} Jahre beim Start)</small></span>
            <input type="number" min={1910} max={1955} value={d.birthYear} onChange={(e) => set({ birthYear: +e.target.value })} />
          </label>
          <label>Bevorzugter Spielstil
            <div className="seg-group">
              {(Object.keys(STYLE_DE) as ManagerStyle[]).map((s) => (
                <button key={s} type="button" className={`seg-btn ${d.style === s ? 'active' : ''}`} onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>
              ))}
            </div>
          </label>
        </div>
        <div className="ng-label">Trainer-Hintergrund</div>
        <div className="ng-seg4">
          {(Object.keys(BG_DE) as ManagerBackground[]).map((b) => (
            <button key={b} className={`ng-card small ${d.background === b ? 'on' : ''}`} onClick={() => set({ background: b })}>
              <b>{BG_DE[b].label}</b><small>{BG_DE[b].desc}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="ng-box ng-summary">
        <h3 className="ng-box-title"><Icon name="contracts" size={20} /> Zusammenfassung</h3>
        {club && (
          <div className="ng-sum-club">
            <ClubCrest club={club.club} size={96} />
            <div>
              <div className="ng-detail-name">{club.name}</div>
              <div className="ng-note">{league?.name} · Saison 1975/76</div>
              <div className="ng-kv"><span>Ziel des Vorstands</span><b className="accent-text">{club.expectation}</b></div>
            </div>
          </div>
        )}
        <div className="ng-kv"><span>Manager</span><b>{d.name.trim() || '–'}{d.name.trim() ? ` (${age})` : ''}</b></div>
        <div className="ng-kv"><span>Spielstil</span><b>{STYLE_DE[d.style]}</b></div>
        <div className="ng-kv"><span>Hintergrund</span><b>{BG_DE[d.background].label}</b></div>
        <div className="ng-kv"><span>Datensatz</span><b>{ds?.name ?? 'Standard'}</b></div>
        <div className="ng-kv"><span>Schwierigkeit</span><b>{DIFF_DE[d.difficulty]}</b></div>
        <div className="ng-kv"><span>Verletzungen</span><b>{d.injuries ? 'an' : 'aus'}</b></div>
        <div className="ng-kv"><span>Historische Spieler</span><b>{LEGEND_DE[d.legendMode]}</b></div>
        <div className="ng-kv"><span>Spieltempo</span><b>{d.speedMs} ms/Tag</b></div>
        <p className="ng-note ng-push">Einen Vereinswechsel gibt es nicht: Du führst diesen Verein durch die Jahrzehnte.</p>
      </section>
    </div>
  );
}

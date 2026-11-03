import { useMemo } from 'react';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { countryInfo } from '../../data/countryFlags';
import { cachedSummaries } from '../../data/dataset/storage';
import { pyramidPreGame, type PyrSystem } from '../../game/leaguePyramid';
import type { NewGameDraft } from './draft';

// Schritt 3: Spielwelt — Datensatz und die simulierten Länder/Ligen
const MODE_TXT = {
  full: 'Deine Liga Minute für Minute, die übrigen Spiel für Spiel',
  sim: 'Spiel für Spiel nach Vereinsstärke',
  bg: 'Saison im Hintergrund, Tabelle und Pokal',
};

function count(s: PyrSystem): number { return s.levels.flat().filter((d) => !d.pool).reduce((a, d) => a + d.clubs.length, 0); }
function names(s: PyrSystem): string { return s.levels.flat().filter((d) => !d.pool).map((d) => d.name).join(' · '); }

export function StepWorld({ d, chooseDataset }: { d: NewGameDraft; chooseDataset: (id: string) => void }) {
  const datasets = cachedSummaries();
  const pyr = useMemo(() => pyramidPreGame(), [d.datasetId]);
  const rows: { key: string; country: string; leagues: string; clubs: number; pool?: number; mode: keyof typeof MODE_TXT; badge: string }[] = [
    { key: 'west', country: 'Deutschland', leagues: names(pyr.west), clubs: count(pyr.west), pool: pyr.west.levels.flat().find((x) => x.pool)?.clubs.length, mode: 'full', badge: 'Spielbar' },
    { key: 'ddr', country: 'DDR', leagues: names(pyr.ddr), clubs: count(pyr.ddr), pool: pyr.ddr.levels.flat().find((x) => x.pool)?.clubs.length, mode: 'sim', badge: 'bis 1991' },
    ...pyr.abroad.map((a) => ({ key: a.key, country: a.key, leagues: names(a), clubs: count(a), mode: 'bg' as const, badge: 'Europa' })),
  ];
  const total = rows.reduce((a, r) => a + r.clubs, 0);
  const leagues = rows.reduce((a, r) => a + r.leagues.split(' · ').length, 0);
  return (
    <div className="ng-cols ng-cols-world">
      <section className="ng-card">
        <h3 className="ng-h">Datensatz</h3>
        <p className="ng-note">Vereine, Ligen, Namen und Geschichte stammen aus dem Datensatz. Eigene Datensätze legst du im Editor an.</p>
        <div className="ng-optlist">
          {datasets.map((ds) => (
            <button key={ds.id} type="button" className={`ng-opt wide ${d.datasetId === ds.id ? 'on' : ''}`} onClick={() => chooseDataset(ds.id)}>
              <b>{ds.name}</b>
              <small>{ds.builtin ? 'Eingebaut' : ds.author ? `von ${ds.author}` : 'Eigener Datensatz'} · {ds.clubs} Vereine</small>
              {ds.description && <span>{ds.description}</span>}
            </button>
          ))}
        </div>
        <div className="ng-facts ng-push">
          <div className="ng-kv"><span>Startdatum</span><b>1. Juli 1975</b></div>
          <div className="ng-kv"><span>Punkteregel</span><b>2 Punkte je Sieg</b></div>
          <div className="ng-kv"><span>Währung</span><b>DM (ab 2002 Euro)</b></div>
        </div>
      </section>

      <section className="ng-card">
        <div className="ng-h-row">
          <h3 className="ng-h">Simulierte Länder</h3>
          <span className="ng-h-side">{rows.length} Länder · {leagues} Ligen · {total.toLocaleString('de-DE')} Vereine</span>
        </div>
        <div className="ng-ctable">
          <div className="ng-crow head"><span>Land</span><span>Ligen</span><span className="num">Vereine</span><span>Simulation</span></div>
          <div className="ng-crows">
            {rows.map((r) => (
              <div key={r.key} className={`ng-crow ${r.key === 'west' ? 'main' : ''}`}>
                <span className="ng-ccountry"><CountryFlag country={r.country} height={16} /><b>{countryInfo(r.country).name}</b><em>{countryInfo(r.country).code}</em></span>
                <span className="ng-cleagues">{r.leagues}{r.pool ? <small> + {r.pool} Vereine im Unterbau</small> : null}</span>
                <span className="num">{r.clubs}</span>
                <span className="ng-cmode"><i className={`ng-badge ${r.key === 'west' ? 'on' : ''}`}>{r.badge}</i>{MODE_TXT[r.mode]}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="ng-note">Die Spielwelt hängt zusammen – Europapokal, Transfers, Trainer und Talente kommen aus allen Ländern, deshalb laufen immer alle mit.
          Rechenzeit kostet fast nur deine eigene Liga; das Ausland rechnet einmal je Saison. Nach den Staatsteilungen ab 1992 kommen weitere Länder hinzu.</p>
      </section>
    </div>
  );
}

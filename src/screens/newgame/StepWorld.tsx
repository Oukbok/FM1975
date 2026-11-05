import { CountryFlag } from '../../components/competition/CountryFlag';
import { InfoTip } from '../../ui/InfoTip';
import { cachedSummaries } from '../../data/dataset/storage';
import { COUNTRY_SEEDS } from '../../data/worldSeed';
import { WORLD_COUNTRIES, countryExists, countryPointSystem, seasonLabelOf } from '../../data/world/countries';
import { worldSeason } from '../../data/world/index';
import { MAX_START_YEAR, MIN_START_YEAR } from '../../game/startYear';
import type { NewGameDraft } from './draft';

// Schritt 3: Spielwelt — Startjahr (Standard 1975), Datensatz und die Länder mit ihrer
// Simulationstiefe: deine Liga mit vollen Kadern, gewählte Länder Spiel für Spiel, übrige
// Länder einmal je Saison im Hintergrund (Wunsch Pascal).
const ERA_STOPS = [1975, 1985, 1995, 2005, 2015, 2025];

/** Was im Startjahr anders ist (kurz, für den Hinweis unter dem Jahr). */
function eraNotes(y: number, home: string): string[] {
  const out: string[] = [];
  if (home === 'ger') {
    out.push(y < 1981 ? '2. Liga in zwei Staffeln (Nord/Süd)' : y < 1994 ? 'Eingleisige 2. Liga' : y < 2008 ? 'Regionalligen als dritte Ebene' : '3. Liga als Profiliga');
    if (y <= 1990) out.push('DDR-Oberliga spielt getrennt');
    else if (y <= 1993) out.push('Ostvereine in der gesamtdeutschen Pyramide');
  }
  out.push(countryPointSystem(home, y) === '3-point' ? '3 Punkte je Sieg' : '2 Punkte je Sieg');
  if (y >= 1995) out.push('Bosman: ablösefreie Wechsel nach Vertragsende');
  out.push(y >= 2024 ? 'Champions League mit Ligaphase' : y >= 1992 ? 'Champions League' : 'Europapokal der Landesmeister');
  if (y < 1999) out.push('Europapokal der Pokalsieger');
  return out;
}

function leaguesText(cc: string, key: string, y: number): { text: string; clubs: number; data: boolean } {
  const row = worldSeason(cc, y);
  if (row) {
    const t2 = (row.t2?.length ?? 0) + (row.t2b?.length ?? 0);
    return { text: `1. Liga ${row.t1.length}${t2 ? ` · 2. Liga ${t2}` : ''}`, clubs: row.t1.length + t2, data: true };
  }
  if (cc === 'ger') return { text: y < 1981 ? '1. Liga 18 · 2. Liga Nord/Süd 40' : '1. Liga 18 · 2. Liga 20 · Unterbau', clubs: y < 1981 ? 58 : 38, data: false };
  if (cc === 'gdr') return { text: 'DDR-Oberliga 14 · DDR-Liga', clubs: 26, data: false };
  const s = COUNTRY_SEEDS.find((x) => x.name === key);
  return s ? { text: `1. Liga ${s.tier1} · 2. Liga ${s.tier2}`, clubs: s.tier1 + s.tier2, data: false } : { text: 'nach der Teilung', clubs: 0, data: false };
}

export function StepWorld({ d, chooseDataset, chooseYear, toggleFull }: {
  d: NewGameDraft; chooseDataset: (id: string) => void; chooseYear: (y: number) => void; toggleFull: (cc: string) => void;
}) {
  const datasets = cachedSummaries();
  const y = d.startYear;
  const home = d.country;
  // Länder des Startjahres: Heimatland zuerst, dann Länder mit Weltdaten, dann übrige.
  const rows = WORLD_COUNTRIES.filter((c) => countryExists(c, y) && (c.cc !== 'gdr' || home === 'ger') && (c.cc === home || c.cc === 'ger' || c.cc === 'gdr' || !!worldSeason(c.cc, y) || COUNTRY_SEEDS.some((s) => s.name === c.key)))
    .map((c) => ({ c, ...leaguesText(c.cc, c.key, y) }))
    .sort((a, b) => Number(b.c.cc === home) - Number(a.c.cc === home) || Number(b.data) - Number(a.data) || a.c.name.localeCompare(b.c.name, 'de'));
  const total = rows.reduce((a, r) => a + r.clubs, 0);
  const withData = rows.filter((r) => r.data).length;
  return (
    <div className="ng-cols ng-cols-world">
      <section className="ng-card">
        <h3 className="ng-h">Startjahr <InfoTip k="startjahr" /></h3>
        <div className="ng-year">
          <button type="button" className="ng-btn ghost ng-year-step" aria-label="Ein Jahr früher" disabled={y <= MIN_START_YEAR} onClick={() => chooseYear(y - 1)}>−</button>
          <div className="ng-year-val"><b>{y}</b><small>Saison {seasonLabelOf(y)}</small></div>
          <button type="button" className="ng-btn ghost ng-year-step" aria-label="Ein Jahr später" disabled={y >= MAX_START_YEAR} onClick={() => chooseYear(y + 1)}>+</button>
        </div>
        <input className="ng-year-range" type="range" min={MIN_START_YEAR} max={MAX_START_YEAR} step={1} value={y} aria-label="Startjahr" onChange={(e) => chooseYear(+e.target.value)} />
        <div className="ng-seg small ng-year-stops">
          {ERA_STOPS.map((s) => <button key={s} type="button" className={y === s ? 'on' : ''} onClick={() => chooseYear(s)}>{s}</button>)}
        </div>
        <ul className="ng-era">{eraNotes(y, home).map((t) => <li key={t}>{t}</li>)}</ul>
        <h3 className="ng-h">Datensatz</h3>
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
          <div className="ng-kv"><span>Startdatum</span><b>1. Juli {y}</b></div>
          <div className="ng-kv"><span>Währung</span><b>{y >= 2002 ? 'Euro' : 'DM (ab 2002 Euro)'}</b></div>
        </div>
      </section>

      <section className="ng-card">
        <div className="ng-h-row">
          <h3 className="ng-h">Länder {seasonLabelOf(y)} <InfoTip k="simtiefe" /></h3>
          <span className="ng-h-side">{rows.length} Länder · {withData} mit echten Vereinen · {total.toLocaleString('de-DE')} Vereine</span>
        </div>
        <div className="ng-ctable">
          <div className="ng-crow head"><span>Land</span><span>Ligen</span><span className="num">Vereine</span><span>Simulation</span></div>
          <div className="ng-crows">
            {rows.map(({ c, text, clubs, data }) => {
              const mine = c.cc === home;
              const fixed = mine || (home === 'ger' && c.cc === 'gdr');
              const full = fixed || d.fullCountries.includes(c.cc);
              return (
                <div key={c.cc} className={`ng-crow ${mine ? 'main' : ''}`} data-cc={c.cc}>
                  <span className="ng-ccountry"><CountryFlag country={c.key} height={16} /><b>{c.name}</b><em>{c.cc.toUpperCase()}</em></span>
                  <span className="ng-cleagues">{text}<small> · {data ? 'echte Vereine' : 'Städtevereine'}</small></span>
                  <span className="num">{clubs || '–'}</span>
                  <span className="ng-cmode">
                    {fixed
                      ? <><i className={`ng-badge ${mine ? 'on' : ''}`}>{mine ? 'Deine Liga' : 'bis 1991'}</i>{mine ? 'Volle Kader, Spiel für Spiel' : 'Spiel für Spiel'}</>
                      : (
                        <span className="ng-seg small">
                          <button type="button" className={full ? 'on' : ''} onClick={() => !full && toggleFull(c.cc)}>Spiel für Spiel</button>
                          <button type="button" className={full ? '' : 'on'} onClick={() => full && toggleFull(c.cc)}>Hintergrund</button>
                        </span>
                      )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="ng-note">Deine Liga läuft mit vollen Kadern. „Spiel für Spiel“ rechnet ein Land wie die 2. Liga mit Spielplan, Tabelle und Auf-/Abstieg – sichtbar unter Statistiken; „Hintergrund“ rechnet es einmal je Saison. Europapokal, Transfers und Talente kommen aus allen Ländern. Länder mit echten Vereinen kannst du im nächsten Schritt als Heimatland wählen.</p>
      </section>
    </div>
  );
}

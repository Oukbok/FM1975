import { useState } from 'react';
import { Dataset } from '../../data/dataset/schema';
import { EuroClub } from '../../data/europe';
import { CountrySeed } from '../../data/worldSeed';
import { JsonBlock } from '../JsonBlock';
import { Col, Explain, TableEditor } from '../TableEditor';

// =============================================================================
// EUROPA: Länder der Hintergrund-Simulation, Trends, Teilungen, Sperren,
// Europapokal-Starter der ersten Saison.
// =============================================================================
type Tab = 'countries' | 'trends' | 'splits' | 'exclusions' | 'clubs' | 'german';

const COUNTRY_COLS: Col[] = [
  { key: 'name', label: 'Land', width: 140, hint: 'Gleicher Name wie bei den Vereinen' },
  { key: 'origin', label: 'Herkunft', width: 90, hint: 'ID aus Namen → Herkünfte' },
  { key: 'base', label: 'Niveau', type: 'number', width: 80, hint: 'Grundstärke 1975 (etwa 55–72)' },
  { key: 'tier1', label: '1. Liga', type: 'number', width: 80 },
  { key: 'tier2', label: '2. Liga', type: 'number', width: 80 },
  { key: 'cities', label: 'Städte (Komma-getrennt, größte zuerst)', type: 'list', width: 420 },
];

const EURO_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 90, hint: 'beginnt mit eu_' },
  { key: 'name', label: 'Name', width: 170 },
  { key: 'shortName', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 120 },
  { key: 'country', label: 'Land', width: 120 },
  { key: 'strength', label: 'Stärke', type: 'number', width: 80 },
  { key: 'comp', label: 'Wettbewerb', type: 'select', width: 170, options: [
    { value: 'ec', label: 'Landesmeister' }, { value: 'cwc', label: 'Pokalsieger' }, { value: 'uefa', label: 'Europa-Pokal' }] },
  { key: 'colors.primary', label: 'Farbe 1', type: 'color', width: 150 },
  { key: 'colors.secondary', label: 'Farbe 2', type: 'color', width: 150 },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'countries', label: 'Länder' }, { key: 'trends', label: 'Trends' }, { key: 'splits', label: 'Staatenteilungen' },
  { key: 'exclusions', label: 'Sperren' }, { key: 'clubs', label: 'Europapokal 1975/76' }, { key: 'german', label: 'Deutsche Starter' },
];

export function EuropeSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const [tab, setTab] = useState<Tab>('countries');
  const e = ds.europe;
  return (
    <div className="ed-section">
      <div className="ed-tabs">
        {TABS.map((t) => <button key={t.key} className={`ed-tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
      {tab === 'countries' && <>
        <Explain>Jedes Land wird mit 1. und 2. Liga im Hintergrund simuliert. Das <b>Niveau</b> bestimmt die Stärke der Vereine, die Städte werden nacheinander zu erfundenen Vereinen („Stadt“ bzw. „Stadt Farbe“). Ligagrößen müssen gerade sein. Die Rangliste (Fünfjahreswertung) entscheidet über die Europapokal-Plätze.</Explain>
        <TableEditor rows={e.countries} cols={COUNTRY_COLS} onChange={onChange} searchKeys={['name']}
          makeRow={(): CountrySeed => ({ name: 'Neues Land', origin: 'eng', base: 58, tier1: 16, tier2: 16, cities: [] })} />
      </>}
      {tab === 'trends' && <TrendsEditor ds={ds} onChange={onChange} />}
      {tab === 'splits' && <>
        <Explain>Staatenteilungen: Im Jahr <code>year</code> zerfällt <code>from</code>. Vereine aus den <code>cities</code> eines Teils wechseln in das neue Land, Vereine aus <code>dropCities</code> verschwinden aus der Simulation, das Restland kann umbenannt werden (<code>renameRest</code>). Bearbeitung als JSON.</Explain>
        <JsonBlock value={e.splits} rows={22} onApply={(v) => { e.splits = v; onChange(); }} />
      </>}
      {tab === 'exclusions' && <>
        <Explain>Länder, deren Vereine in bestimmten Jahren (Saison-Startjahr von–bis) nicht an den Europapokalen teilnehmen dürfen.</Explain>
        <TableEditor rows={e.exclusions} onChange={onChange} searchKeys={['country']}
          cols={[{ key: 'country', label: 'Land', width: 160 }, { key: 'from', label: 'von', type: 'number', width: 90 }, { key: 'to', label: 'bis', type: 'number', width: 90 }]}
          makeRow={() => ({ country: 'England', from: 1985, to: 1989 })} />
      </>}
      {tab === 'clubs' && <>
        <Explain>Die ausländischen Starter der allerersten Saison. Ab der zweiten Saison qualifizieren sich die Vereine sportlich über die Hintergrund-Ligen; diese Vereine werden dort als Spitzenclubs ihres Landes übernommen. Felder: Landesmeister 15, Pokalsieger 15, Europa-Pokal 29 ausländische Vereine (plus deutsche Starter = 16/16/32).</Explain>
        <TableEditor rows={e.clubs} cols={EURO_COLS} onChange={onChange} searchKeys={['id', 'name', 'country']}
          makeRow={(): EuroClub => ({ id: `eu_neu${e.clubs.length + 1}`, name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', country: e.countries[0]?.name ?? 'England', strength: 70, colors: { primary: '#C8102E', secondary: '#FFFFFF' }, comp: 'uefa' })} />
      </>}
      {tab === 'german' && <GermanStarters ds={ds} onChange={onChange} />}
    </div>
  );
}

function TrendsEditor({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const t = ds.europe.trends;
  const fmt = (arr: [number, number][]) => arr.map(([y, d]) => `${y}:${d}`).join(', ');
  const parse = (s: string): [number, number][] => s.split(',').map((x) => x.trim()).filter(Boolean)
    .map((x) => x.split(':').map(Number) as [number, number]).filter(([y, d]) => Number.isFinite(y) && Number.isFinite(d));
  return (
    <>
      <Explain>Wie sich das Niveau eines Landes über die Jahrzehnte verschiebt: <code>Jahr:Änderung</code> gegenüber 1975, z. B. <code>1995:1, 2005:3</code>. Ab dem Jahr gilt die Änderung bis zum nächsten Eintrag.</Explain>
      <div className="ed-table-scroll">
        <table className="ed-table">
          <thead><tr><th style={{ width: 180 }}>Land</th><th>Verlauf</th></tr></thead>
          <tbody>
            {ds.europe.countries.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td><input className="ed-in" defaultValue={fmt(t[c.name] ?? [])}
                  onBlur={(e) => { const v = parse(e.target.value); if (v.length) t[c.name] = v; else delete t[c.name]; onChange(); }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GermanStarters({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const fsg = ds.europe.firstSeasonGerman;
  const opts = [...ds.clubs.tier1, ...ds.clubs.secondNord, ...ds.clubs.secondSued];
  const slots: { key: 'ec' | 'cwc' | 'uefa'; label: string; n: number }[] = [
    { key: 'ec', label: 'Landesmeister-Pokal (Meister der Vorsaison)', n: 1 },
    { key: 'cwc', label: 'Pokalsieger-Pokal (Pokalsieger der Vorsaison)', n: 1 },
    { key: 'uefa', label: 'Europa-Pokal (Plätze 2–4 der Vorsaison)', n: 3 },
  ];
  return (
    <>
      <Explain>Die deutschen Teilnehmer der ersten Saison 1975/76 (die Vorsaison wird nicht gespielt). Fehlt ein Verein, wählt das Spiel automatisch den angesehensten freien Verein.</Explain>
      <div className="ed-form">
        {slots.map((s) => (
          <div key={s.key} className="ed-field">
            <span className="ed-label">{s.label}</span>
            <div className="ed-row">
              {Array.from({ length: s.n }, (_, i) => (
                <select key={i} className="ed-in" value={fsg[s.key][i] ?? ''} onChange={(e) => { fsg[s.key][i] = e.target.value; fsg[s.key] = fsg[s.key].filter(Boolean); onChange(); }}>
                  <option value="">–</option>
                  {opts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

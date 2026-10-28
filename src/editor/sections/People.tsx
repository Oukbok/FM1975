import { useState } from 'react';
import { Dataset, OriginData } from '../../data/dataset/schema';
import { LegendSeed } from '../../data/legends';
import { LEGEND_ARCHETYPES } from '../../data/legendArchetypes';
import { Col, Explain, FieldForm, TableEditor } from '../TableEditor';

// =============================================================================
// ALLGEMEIN, NAMEN, LEGENDEN, WIRTSCHAFT, GESCHICHTE
// =============================================================================
type P = { ds: Dataset; onChange: () => void };

export function GeneralSection({ ds, onChange }: P) {
  const m = ds.meta as unknown as Record<string, unknown>;
  const c = ds.clubs;
  return (
    <div className="ed-section">
      <Explain>Name und Beschreibung deines Datensatzes – so erscheint er im Spiel unter <b>Datensätze</b> und bei „Neues Spiel“. Die <b>ID</b> ist der Dateiname und der Speicherschlüssel: nur Kleinbuchstaben, Ziffern, <code>-</code> und <code>_</code>. Ein Datensatz mit gleicher ID ersetzt beim Übernehmen den alten.</Explain>
      <FieldForm obj={m} onChange={onChange} cols={[
        { key: 'id', label: 'ID', hint: 'z. B. meine-liga-1975' },
        { key: 'name', label: 'Name' },
        { key: 'author', label: 'Autor', optional: true },
        { key: 'description', label: 'Beschreibung', type: 'longtext', optional: true },
        { key: 'created', label: 'Erstellt', hint: 'JJJJ-MM-TT' },
      ]} />
      <div className="ed-sec">Inhalt</div>
      <div className="ed-stats">
        <Stat n={c.tier1.length} l="1. Liga" /><Stat n={c.secondNord.length + c.secondSued.length} l="2. Liga" />
        <Stat n={c.ddrOberliga.length + c.ddrLiga.length} l="DDR" /><Stat n={ds.europe.countries.length} l="Länder" />
        <Stat n={ds.timeline.length} l="Chronik" /><Stat n={ds.legends.length} l="Legenden" />
        <Stat n={Object.keys(ds.crests ?? {}).length} l="Wappen" /><Stat n={Object.keys(ds.kits ?? {}).length} l="Trikotsätze" />
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="ed-stat"><b>{n}</b><span>{l}</span></div>;
}

const FACES = ['mitteleuropa', 'nordeuropa', 'suedeuropa', 'osteuropa', 'balkan', 'tuerkei', 'westafrika', 'lateinamerika', 'ostasien', 'nordafrika']
  .map((f) => ({ value: f, label: f }));

export function NamesSection({ ds, onChange }: P) {
  const [tab, setTab] = useState<'origins' | 'mix' | 'blocked'>('origins');
  const n = ds.names;
  return (
    <div className="ed-section">
      <div className="ed-tabs">
        {([['origins', 'Herkünfte'], ['mix', 'Mischung je Jahr'], ['blocked', 'Gesperrte Namen']] as const).map(([k, l]) =>
          <button key={k} className={`ed-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'origins' && <>
        <Explain>Herkünfte liefern Vor- und Nachnamen, Nationalität und Gesichtstyp der erzeugten Spieler. Namen werden zufällig kombiniert – je mehr Namen, desto vielfältiger. Listen mit Komma trennen.</Explain>
        <TableEditor rows={n.origins} onChange={onChange} searchKeys={['id', 'nationality']}
          cols={[
            { key: 'id', label: 'ID', width: 90 }, { key: 'nationality', label: 'Nation', width: 70, hint: 'Kürzel, z. B. GER' },
            { key: 'face', label: 'Gesicht', type: 'select', options: FACES, width: 130 },
            { key: 'first', label: 'Vornamen', type: 'list', width: 380 }, { key: 'last', label: 'Nachnamen', type: 'list', width: 380 },
          ]}
          makeRow={(): OriginData => ({ id: `herkunft${n.origins.length + 1}`, nationality: 'GER', face: 'mitteleuropa', first: [], last: [] })} />
      </>}
      {tab === 'mix' && <MixEditor ds={ds} onChange={onChange} />}
      {tab === 'blocked' && <>
        <Explain>Namenskombinationen, die nie erzeugt werden (z. B. um Ähnlichkeiten mit echten Personen zu vermeiden). Ein Name pro Zeile: „Vorname Nachname“.</Explain>
        <textarea key={n.blocked.length} className="ed-in ed-code" rows={18} defaultValue={n.blocked.join('\n')}
          onBlur={(e) => { n.blocked = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); onChange(); }} />
      </>}
    </div>
  );
}

function MixEditor({ ds, onChange }: P) {
  const mix = ds.names.mix;
  const fmt = (r: Record<string, number>) => Object.entries(r).map(([k, v]) => `${k}:${v}`).join(', ');
  const parse = (s: string) => Object.fromEntries(s.split(',').map((x) => x.trim().split(':')).filter((p) => p.length === 2 && p[0] && Number.isFinite(Number(p[1]))).map(([k, v]) => [k.trim(), Number(v)]));
  return (
    <>
      <Explain>Anteile der Herkünfte bei neu erzeugten Spielern, je Stützjahr (<code>herkunft:gewicht</code>). Zwischen den Jahren wird übergeblendet. Die Gewichte müssen nicht 100 ergeben.</Explain>
      <div className="ed-table-scroll">
        <table className="ed-table">
          <thead><tr><th style={{ width: 90 }}>Jahr</th><th>Gewichte</th><th style={{ width: 40 }} /></tr></thead>
          <tbody>
            {mix.map((row, i) => (
              <tr key={`${i}-${row[0]}`}>
                <td><input className="ed-in num" type="number" defaultValue={row[0]} onBlur={(e) => { row[0] = Number(e.target.value); mix.sort((a, b) => a[0] - b[0]); onChange(); }} /></td>
                <td><textarea className="ed-in ed-list" defaultValue={fmt(row[1])} onBlur={(e) => { row[1] = parse(e.target.value); onChange(); }} /></td>
                <td><button className="ed-mini danger" title="Löschen" onClick={() => { mix.splice(i, 1); onChange(); }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ed-row"><button className="ed-btn on" onClick={() => { const last = mix[mix.length - 1]; mix.push([(last?.[0] ?? 2020) + 10, { ...(last?.[1] ?? { ger: 100 }) }]); onChange(); }}>Stützjahr hinzufügen</button></div>
    </>
  );
}

const POS = ['TW', 'LIB', 'VS', 'AV', 'DM', 'ZM', 'OM', 'FL', 'MS', 'HS'].map((p) => ({ value: p, label: p }));

export function LegendsSection({ ds, onChange }: P) {
  const cols: Col[] = [
    { key: 'id', label: 'ID', width: 100 }, { key: 'firstName', label: 'Vorname', width: 110 }, { key: 'lastName', label: 'Nachname', width: 120 },
    { key: 'origin', label: 'Herkunft', type: 'select', options: ds.names.origins.map((o) => ({ value: o.id, label: o.id })), width: 110 },
    { key: 'position', label: 'Pos.', type: 'select', options: POS, width: 70 },
    { key: 'birthYear', label: 'Geboren', type: 'number', width: 80 }, { key: 'peak', label: 'Höchststärke', type: 'number', width: 90 },
    { key: 'professionalism', label: 'Profi', type: 'number', width: 70, hint: '0–100' }, { key: 'ambition', label: 'Ehrgeiz', type: 'number', width: 70, hint: '0–100' },
    { key: 'rarity', label: 'Seltenheit', type: 'select', optional: true, width: 130, hint: 'Talent-Korridor', options: [
      { value: 'weltklasse', label: 'Weltklasse 4,0–5,0 ★' },
      { value: 'national', label: 'Nationalspieler 3,5–4,5 ★' }, { value: 'liebling', label: 'Publikumsliebling 3,0–4,0 ★' }] },
    { key: 'archetype', label: 'Archetyp', type: 'select', optional: true, width: 150, options: [
      ...LEGEND_ARCHETYPES.map((a) => ({ value: a.id, label: a.label }))] },
    { key: 'curve', label: 'Kurve', type: 'select', optional: true, width: 100, options: [
      { value: 'frueh', label: 'Frühstarter' }, { value: 'normal', label: 'normal' }, { value: 'spaet', label: 'Spätzünder' }] },
    { key: 'signature', label: 'Signatur-Werte', type: 'list', optional: true, width: 170, hint: 'z. B. heading:90-95' },
    { key: 'cities', label: 'Bevorzugte Städte', type: 'list', optional: true, width: 180 },
    { key: 'homeClub', label: 'Jugendverein (ID)', optional: true, width: 110 },
    { key: 'ddr', label: 'DDR', type: 'bool', optional: true, width: 60, hint: 'erst nach der Wende' },
    { key: 'bio', label: 'Steckbrief', type: 'longtext', width: 280 },
  ];
  return (
    <div className="ed-section">
      <Explain>Legenden sind fest geplante Ausnahmetalente. Sie tauchen mit 15 Jahren zum Jahrgangswechsel (1. Juli) auf: meist beim <b>Jugendverein</b> oder in ihren <b>Städten</b>, manchmal als Geheimtipp bei einem Amateurverein; Legenden ohne Städte aus dem Ausland erscheinen als Auslandstalente. Wer 1975 schon 15 oder älter ist, steht beim Spielstart im Kader. Die <b>Seltenheit</b> legt den verdeckten Talent-Korridor fest (das Spiel würfelt das Ziel aus), die <b>Höchststärke</b> ist die Obergrenze. <b>Archetyp</b> und <b>Signatur-Werte</b> („heading:90-95“) bestimmen, welche Attribute herausragen; die <b>Kurve</b>, wann der Sprung kommt. Nur erfundene Namen verwenden.</Explain>
      <TableEditor rows={ds.legends} cols={cols} onChange={onChange} searchKeys={['id', 'firstName', 'lastName']}
        makeRow={(): LegendSeed => ({ id: `legende${ds.legends.length + 1}`, firstName: 'Vorname', lastName: 'Nachname', origin: 'ger', position: 'ZM', birthYear: 1990, peak: 90, bio: '', professionalism: 70, ambition: 70 })} />
    </div>
  );
}

export function EconomySection({ ds, onChange }: P) {
  const e = ds.economy;
  return (
    <div className="ed-section">
      <Explain>Die Geldmenge im Fußball über die Zeit: <b>Stützwerte</b> geben den typischen Jahresumsatz eines Erstligisten in EUR an (dazwischen wird interpoliert). Der <b>Erlös-Mix</b> verteilt die Einnahmen auf Spieltag, TV und Vermarktung – die drei Anteile ergeben zusammen etwa 0,9 (der Rest sind Prämien und Beiträge).</Explain>
      <div className="ed-split even">
        <TableEditor rows={e.anchors} onChange={onChange} searchKeys={['year']} title="Stützwerte"
          cols={[{ key: 'year', label: 'Jahr', type: 'number', width: 80 }, { key: 'value', label: 'Umsatz EUR', type: 'number', width: 140 }]}
          makeRow={() => ({ year: (e.anchors[e.anchors.length - 1]?.year ?? 2025) + 5, value: e.anchors[e.anchors.length - 1]?.value ?? 100_000_000 })} />
        <TableEditor rows={e.revenueMix} onChange={onChange} searchKeys={['year']} title="Erlös-Mix"
          cols={[
            { key: 'year', label: 'Jahr', type: 'number', width: 80 }, { key: 'matchday', label: 'Spieltag', type: 'number', step: 0.01, width: 90 },
            { key: 'tv', label: 'TV', type: 'number', step: 0.01, width: 90 }, { key: 'commercial', label: 'Vermarktung', type: 'number', step: 0.01, width: 90 },
          ]}
          makeRow={() => ({ year: (e.revenueMix[e.revenueMix.length - 1]?.year ?? 2025) + 5, matchday: 0.15, tv: 0.45, commercial: 0.3 })} />
      </div>
    </div>
  );
}

export function HistorySection({ ds, onChange }: P) {
  const h = ds.history;
  return (
    <div className="ed-section">
      <Explain>Besondere Zeitabschnitte: das Ende des Pokalsieger-Wettbewerbs, Zeiträume mit Zuschauer-Beschränkungen (Faktor 0 = Spiele ohne Publikum) und Schwankungen des TV-Markts (1 = normal).</Explain>
      <FieldForm obj={h as unknown as Record<string, unknown>} onChange={onChange} cols={[
        { key: 'cupWinnersCupLastSeason', label: 'Letzte Saison Pokalsieger-Pokal', type: 'number', hint: 'Startjahr, z. B. 1998 = 1998/99' },
      ]} />
      <div className="ed-split even">
        <TableEditor rows={h.attendanceRestrictions} onChange={onChange} searchKeys={['from']} title="Zuschauer-Beschränkungen"
          cols={[{ key: 'from', label: 'Von', width: 110, hint: 'JJJJ-MM-TT' }, { key: 'to', label: 'Bis', width: 110 }, { key: 'factor', label: 'Faktor', type: 'number', step: 0.05, width: 80 }]}
          makeRow={() => ({ from: '2040-01-01', to: '2040-06-30', factor: 0.5 })} />
        <TableEditor rows={h.tvMarket} onChange={onChange} searchKeys={['year']} title="TV-Markt"
          cols={[{ key: 'year', label: 'Jahr', type: 'number', width: 80 }, { key: 'factor', label: 'Faktor', type: 'number', step: 0.05, width: 80 }]}
          makeRow={() => ({ year: 2040, factor: 1 })} />
      </div>
    </div>
  );
}

import { useNavTarget } from '../nav';
import { CLUB_IDS_LIST } from '../TableEditor';
import { useMemo, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { Dataset } from '../../data/dataset/schema';
import { WORLD_COUNTRIES, seasonLabelOf } from '../../data/world/countries';
import type { RealClub, SeasonRow } from '../../data/world/types';
import type { Club } from '../../types';
import { Col, Explain, TableEditor } from '../TableEditor';

// =============================================================================
// WELTDATEN (Wunsch Pascal): jedes Land – auch Deutschland – mit Vereinen und
// Ligazusammensetzung je Saison, Pokalsieger und Europapokal-Teilnehmern.
// Format: docs/specs/WELTDATEN_SPEC.md; im Datensatz das Feld `worldData`.
// =============================================================================
type Entry = NonNullable<Dataset['worldData']>[string];
const YEARS = Array.from({ length: 51 }, (_, i) => 1975 + i);
const EURO_KEYS: { k: keyof NonNullable<SeasonRow['euro']>; label: string }[] = [
  { k: 'ec', label: 'Landesmeister' }, { k: 'cwc', label: 'Pokalsieger' }, { k: 'uefa', label: 'UEFA-Pokal' },
  { k: 'cl', label: 'Champions League' }, { k: 'el', label: 'Europa League' }, { k: 'ecl', label: 'Conference League' },
];

const CLUB_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 160, hint: '<land>-<name>, nie ändern (Spielstände)' },
  { key: 'name', label: 'Name', width: 170 },
  { key: 'short', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 130 },
  { key: 'colors.primary', label: 'Farbe 1', type: 'color', width: 150 },
  { key: 'colors.secondary', label: 'Farbe 2', type: 'color', width: 150 },
];

/** Deutschland/DDR ohne eigene Daten: aus den Startvereinen 1975 übernehmen (gleiche IDs). */
function seedEntry(ds: Dataset, cc: string): Entry {
  const c = ds.clubs;
  if (cc === 'ger') {
    const clubs: RealClub[] = [
      ...c.tier1.map((s) => ({ id: s.id, name: s.name, short: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary } })),
      ...[...c.secondNord, ...c.secondSued].map((s) => ({ id: s.id, name: s.name, short: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary } })),
    ];
    return { clubs, seasons: { 1975: { t1: c.tier1.map((s) => s.id), t2: c.secondNord.map((s) => s.id), t2b: c.secondSued.map((s) => s.id) } } };
  }
  if (cc === 'gdr') {
    const clubs: RealClub[] = [...c.ddrOberliga, ...c.ddrLiga].map((s) => ({ id: s.id, name: s.name, short: s.shortName, city: s.city, colors: { ...s.colors } }));
    return { clubs, seasons: { 1975: { t1: c.ddrOberliga.map((s) => s.id), t2: c.ddrLiga.map((s) => s.id) } } };
  }
  return { clubs: [], seasons: {} };
}

const lines = (ids?: string[]) => (ids ?? []).join('\n');
const parse = (t: string) => t.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

function IdList({ label, ids, known, onSet }: { label: string; ids?: string[]; known: Map<string, RealClub>; onSet: (ids: string[] | undefined) => void }) {
  const text = lines(ids);
  const unknown = (ids ?? []).filter((id) => !known.has(id));
  return (
    <div className="ed-wd-col">
      <div className="ed-sec">{label} <span className="ed-badge">{ids?.length ?? 0}</span></div>
      <textarea key={text} className="ed-in ed-wd-ids" defaultValue={text} placeholder="Vereins-IDs, eine je Zeile (Reihenfolge = Abschlusstabelle)"
        onBlur={(e) => { const next = parse(e.target.value); if (next.join('\n') !== text) onSet(next.length ? next : undefined); }} />
      <input className="ed-in ed-wd-add" list={CLUB_IDS_LIST} placeholder="ID anhängen (Vorschläge beim Tippen), Enter"
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          const v = (e.target as HTMLInputElement).value.trim();
          if (!v) return;
          (e.target as HTMLInputElement).value = '';
          onSet([...(ids ?? []), ...parse(v)]);
        }} />
      <ol className="ed-wd-names">{(ids ?? []).map((id) => <li key={id} className={known.has(id) ? '' : 'bad'}>{known.get(id)?.name ?? `unbekannt: ${id}`}</li>)}</ol>
      {unknown.length > 0 && <div className="ed-err">{unknown.length} unbekannte ID(s) – Verein unter „Vereine“ anlegen.</div>}
    </div>
  );
}

function SeasonEditor({ entry, partner, year, onChange }: { entry: Entry; partner?: Entry; year: number; onChange: () => void }) {
  // Deutschland nutzt ab 1991/92 die IDs der DDR-Vereine (und umgekehrt).
  const known = useMemo(() => new Map([...(partner?.clubs ?? []), ...entry.clubs].map((c) => [c.id, c])), [entry.clubs, entry.clubs.length, partner]);
  const row = entry.seasons[year] as SeasonRow | undefined;
  if (!row) {
    const prev = Object.keys(entry.seasons).map(Number).filter((y) => y < year).sort((a, b) => b - a)[0];
    return (
      <div className="ed-row">
        <span className="ed-hint">Keine Daten für {seasonLabelOf(year)}. Ohne Daten nutzt das Spiel einen Rückfall (Vorjahr bzw. erfundene Vereine).</span>
        <button className="ed-btn on" onClick={() => {
          const base = prev != null ? (entry.seasons[prev] as SeasonRow) : { t1: [] };
          entry.seasons[year] = { t1: [...base.t1], ...(base.t2 ? { t2: [...base.t2] } : {}), ...(base.t2b ? { t2b: [...base.t2b] } : {}) };
          onChange();
        }}>Saison anlegen{prev != null ? ` (aus ${seasonLabelOf(prev)})` : ''}</button>
      </div>
    );
  }
  const set = (k: 't1' | 't2' | 't2b', ids: string[] | undefined) => { if (k === 't1') row.t1 = ids ?? []; else if (ids) row[k] = ids; else delete row[k]; onChange(); };
  const opts = [...entry.clubs].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return (
    <div className="ed-wd-season">
      <div className="ed-wd-cols">
        <IdList label="1. Liga" ids={row.t1} known={known} onSet={(v) => set('t1', v)} />
        <IdList label="2. Liga" ids={row.t2} known={known} onSet={(v) => set('t2', v)} />
        <IdList label="2. Liga, zweite Staffel" ids={row.t2b} known={known} onSet={(v) => set('t2b', v)} />
      </div>
      <div className="ed-row">
        <label className="ed-field"><span className="ed-label">Pokalsieger</span>
          <select className="ed-in" value={row.cup ?? ''} onChange={(e) => { if (e.target.value) row.cup = e.target.value; else delete row.cup; onChange(); }}>
            <option value="">–</option>{opts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className="ed-field"><span className="ed-label">Pokalfinalist</span>
          <select className="ed-in" value={row.cupFinalist ?? ''} onChange={(e) => { if (e.target.value) row.cupFinalist = e.target.value; else delete row.cupFinalist; onChange(); }}>
            <option value="">–</option>{opts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <button className="ed-btn" onClick={() => { delete entry.seasons[year]; onChange(); }}>Saison entfernen</button>
      </div>
      <div className="ed-sec">Europapokal-Teilnehmer {seasonLabelOf(year)}</div>
      <div className="ed-wd-euro">
        {EURO_KEYS.map(({ k, label }) => {
          const ids = row.euro?.[k];
          const t = (ids ?? []).join(', ');
          return (
            <label key={k} className="ed-field"><span className="ed-label">{label}</span>
              <textarea key={t} className="ed-in ed-list" defaultValue={t} onBlur={(e) => {
                const next = parse(e.target.value);
                if (next.join(', ') === t) return;
                row.euro ??= {};
                if (next.length) row.euro[k] = next; else delete row.euro[k];
                if (!Object.keys(row.euro).length) delete row.euro;
                onChange();
              }} />
              <span className="ed-hint">{(ids ?? []).map((id) => known.get(id)?.name ?? `? ${id}`).join(', ')}</span>
            </label>
          );
        })}
      </div>
      <label className="ed-field"><span className="ed-label">Hinweis</span>
        <input className="ed-in" value={row.note ?? ''} onChange={(e) => { if (e.target.value) row.note = e.target.value; else delete row.note; onChange(); }} /></label>
    </div>
  );
}

export function WorldSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const target = useNavTarget();
  const [cc, setCc] = useState(target?.cc ?? 'ger');
  const [tab, setTab] = useState<'clubs' | 'seasons'>(target?.tab === 'seasons' ? 'seasons' : 'clubs');
  const [year, setYear] = useState(target?.year ?? 1975);
  const [sel, setSel] = useState<number | null>(0);
  const wd = ds.worldData ?? {};
  const entry = wd[cc];
  const def = WORLD_COUNTRIES.find((c) => c.cc === cc)!;
  const create = () => { ds.worldData ??= {}; ds.worldData[cc] = seedEntry(ds, cc); onChange(); };
  const club = entry && sel != null ? entry.clubs[sel] : undefined;
  return (
    <div className="ed-section">
      <Explain>Weltdaten aller Europapokal-Länder – Deutschland eingeschlossen. Je Land die Vereine (verfremdete Namen: Stadt, bei mehreren Vereinen einer Stadt plus Farbe, keine Markennamen) und je Saison die 1./2. Liga in Tabellenreihenfolge, Pokalsieger und Europapokal-Teilnehmer. Daraus baut das Spiel die Welt beim Start in einem beliebigen Jahr; Länder mit Daten sind im Assistenten spielbar. Deutschland nutzt die IDs der Startvereine.</Explain>
      <div className="ed-split">
        <div className="ed-wd-countries">
          {WORLD_COUNTRIES.map((c) => {
            const e = wd[c.cc];
            const n = e ? Object.keys(e.seasons).length : 0;
            return (
              <button key={c.cc} data-cc={c.cc} className={`ed-wd-country ${cc === c.cc ? 'on' : ''}`} onClick={() => { setCc(c.cc); setSel(0); }}>
                <CountryFlag country={c.key} height={12} /><b>{c.name}</b>
                <span className={`ed-badge ${n ? 'good' : ''}`}>{n ? `${n} Saisons` : '–'}</span>
              </button>
            );
          })}
        </div>
        <div className="ed-wd-main">
          <div className="ed-row"><b className="ed-side-title">{def.name}</b><span className="ed-hint">Code {def.cc} · {def.from}{def.to ? `–${def.to}` : ''} · 3-Punkte-Regel ab {def.points3From > 2099 ? '–' : seasonLabelOf(def.points3From)}{def.top8 ? ' · 1. und 2. Liga' : ''}</span></div>
          {!entry ? (
            <div className="ed-row">
              <span className="ed-hint">Für {def.name} gibt es in diesem Datensatz noch keine Weltdaten – das Spiel nutzt {cc === 'ger' ? 'die Startvereine 1975' : 'erfundene Städtevereine im Hintergrund'}.</span>
              <button className="ed-btn on" data-act="wd-create" onClick={create}>{cc === 'ger' || cc === 'gdr' ? 'Aus den Startvereinen 1975 anlegen' : 'Land anlegen'}</button>
            </div>
          ) : (
            <>
              <div className="ed-tabs">
                <button className={`ed-tab ${tab === 'clubs' ? 'on' : ''}`} onClick={() => setTab('clubs')}>Vereine <span className="ed-badge">{entry.clubs.length}</span></button>
                <button className={`ed-tab ${tab === 'seasons' ? 'on' : ''}`} onClick={() => setTab('seasons')}>Saisons <span className="ed-badge">{Object.keys(entry.seasons).length}</span></button>
              </div>
              {tab === 'clubs' ? (
                <div className="ed-split">
                  <TableEditor rows={entry.clubs} cols={CLUB_COLS} onChange={onChange} selected={sel} onSelect={setSel}
                    makeRow={() => ({ id: `${cc}-neu-${entry.clubs.length + 1}`, name: 'Neue Stadt', short: 'NEU', city: 'Neue Stadt', colors: { primary: '#1E56A0', secondary: '#FFFFFF' } })} />
                  {club && (
                    <aside className="ed-side">
                      <div className="ed-side-head">
                        <ClubCrest club={{ id: club.id, name: club.name, shortName: club.short, city: club.city, colors: club.colors, customCrest: ds.crests?.[club.id] } as unknown as Club} size={72} />
                        <div><div className="ed-side-title">{club.name}</div><div className="ed-hint">{club.city} · ID {club.id}</div></div>
                      </div>
                      <div className="ed-hint">Saisons: {Object.entries(entry.seasons).filter(([, r]) => [...r.t1, ...(r.t2 ?? []), ...(r.t2b ?? [])].includes(club.id)).map(([y]) => seasonLabelOf(Number(y))).join(', ') || 'keine'}</div>
                      <div className="ed-hint">Wappen und Trikots: Bereich „Vereine“ bzw. per ID im Datensatz (`crests`/`kits`).</div>
                    </aside>
                  )}
                </div>
              ) : (
                <>
                  <div className="ed-row">
                    <span className="ed-label">Saison</span>
                    <select className="ed-in" data-act="wd-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                      {YEARS.map((y) => <option key={y} value={y}>{seasonLabelOf(y)}{entry.seasons[y] ? ' · Daten' : ''}</option>)}
                    </select>
                  </div>
                  <SeasonEditor entry={entry} partner={wd[cc === 'ger' ? 'gdr' : cc === 'gdr' ? 'ger' : ''] } year={year} onChange={onChange} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

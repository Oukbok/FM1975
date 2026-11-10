import { useState, type ReactNode } from 'react';
import ClubCrest from '../../components/ClubCrest';
import JerseySVG from '../../components/JerseySVG';
import { Dataset } from '../../data/dataset/schema';
import { builtinDataset } from '../../data/dataset/builtin';
import { Club, Kit, KitPattern } from '../../types';
import { CrestEras } from './CrestEras';
import { Col, Explain, TableEditor } from '../TableEditor';
import { WORLD_COUNTRIES, seasonLabelOf } from '../../data/world/countries';
import type { RealClub } from '../../data/world/types';
import { Target, useNavTarget } from '../nav';

// =============================================================================
// VEREINE (Wunsch Pascal): Land → Liga → Vereine, damit jeder Verein der Welt
// editierbar ist (Daten, Wappen, Trikots).
//   • Deutschland/DDR „Start 1975/76“: die Startvereine (`clubs.*`) mit Ansehen,
//     Stadion usw.; Name/Kürzel/Stadt/Farben werden in die Weltdaten gespiegelt.
//   • Jedes Land mit Weltdaten (`worldData`): 1./2. Liga einer Saison, Vereine
//     ohne Liga in dieser Saison, alle Vereine.
// =============================================================================
type StartTab = 'tier1' | 'secondNord' | 'secondSued' | 'ddrOberliga' | 'ddrLiga';
type League = `start:${StartTab}` | 'season:t1' | 'season:t2' | 'season:t2b' | 'other' | 'all';
const START: { cc: string; key: StartTab; label: string; info: string }[] = [
  { cc: 'ger', key: 'tier1', label: 'Start 1975/76 · 1. Liga', info: 'Die Spielerliga zum Start 1975/76. Kader werden aus dem Ansehen erzeugt (höheres Ansehen = stärkere Spieler, mehr Geld, größere Erwartungen).' },
  { cc: 'ger', key: 'secondNord', label: 'Start 1975/76 · 2. Liga Nord', info: 'Simulierte Zweitligisten (Staffel Nord). Die Stärke steuert Kader, Stadion und Zuschauer, sobald der Verein in deine Liga kommt. Auch als Startverein wählbar.' },
  { cc: 'ger', key: 'secondSued', label: 'Start 1975/76 · 2. Liga Süd', info: 'Simulierte Zweitligisten (Staffel Süd).' },
  { cc: 'gdr', key: 'ddrOberliga', label: 'Start 1975/76 · DDR-Oberliga', info: 'Getrennte Liga bis zur Wiedervereinigung 1991/92. Ebene 101; die Ligareform 1991 übernimmt diese Vereine.' },
  { cc: 'gdr', key: 'ddrLiga', label: 'Start 1975/76 · DDR-Liga', info: 'Zweite DDR-Liga (Ebene 102).' },
];
const SEASON_LABEL: Record<'t1' | 't2' | 't2b', string> = { t1: '1. Liga', t2: '2. Liga', t2b: '2. Liga, zweite Staffel' };
const PATTERNS: { value: KitPattern; label: string }[] = [
  { value: 'solid', label: 'Einfarbig' }, { value: 'stripes', label: 'Streifen' }, { value: 'hoops', label: 'Ringel' },
  { value: 'sash', label: 'Schärpe' }, { value: 'mittelstreifen', label: 'Mittelstreifen' }, { value: 'halves', label: 'Hälften' },
];

const TIER1_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 90, hint: 'Eindeutig, Kleinbuchstaben' },
  { key: 'name', label: 'Name', width: 170 },
  { key: 'shortName', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 130 },
  { key: 'founded', label: 'Gegründet', type: 'number', width: 90 },
  { key: 'reputation', label: 'Ansehen', type: 'number', width: 80, hint: '1–99' },
  { key: 'primary', label: 'Farbe 1', type: 'color', width: 150 },
  { key: 'secondary', label: 'Farbe 2', type: 'color', width: 150 },
  { key: 'stadium', label: 'Stadion', width: 170 },
  { key: 'capacity', label: 'Plätze', type: 'number', width: 90 },
];
const SECOND_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 90 }, { key: 'name', label: 'Name', width: 170 }, { key: 'shortName', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 130 }, { key: 'strength', label: 'Stärke', type: 'number', width: 80, hint: 'etwa 50–75' },
  { key: 'primary', label: 'Farbe 1', type: 'color', width: 150 }, { key: 'secondary', label: 'Farbe 2', type: 'color', width: 150 },
];
const SIM_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 110 }, { key: 'name', label: 'Name', width: 170 }, { key: 'shortName', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 130 }, { key: 'strength', label: 'Stärke', type: 'number', width: 80 },
  { key: 'colors.primary', label: 'Farbe 1', type: 'color', width: 150 }, { key: 'colors.secondary', label: 'Farbe 2', type: 'color', width: 150 },
  { key: 'historicalName', label: 'Früherer Name', optional: true, width: 150 },
  { key: 'renamedYear', label: 'Umbenannt', type: 'number', optional: true, width: 90 },
];

interface AnyClub { id: string; name: string; shortName?: string; short?: string; city: string; primary?: string; secondary?: string; colors?: { primary: string; secondary: string } }
type WEntry = NonNullable<Dataset['worldData']>[string];

const WORLD_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 160, hint: '<land>-<name>, nie ändern (Spielstände)' },
  { key: 'name', label: 'Name', width: 170 },
  { key: 'short', label: 'Kürzel', width: 70 },
  { key: 'city', label: 'Stadt', width: 130 },
  { key: 'colors.primary', label: 'Farbe 1', type: 'color', width: 150 },
  { key: 'colors.secondary', label: 'Farbe 2', type: 'color', width: 150 },
];

function colorsOf(c: AnyClub) {
  return { primary: c.primary ?? c.colors?.primary ?? '#888888', secondary: c.secondary ?? c.colors?.secondary ?? '#FFFFFF' };
}

function newId(prefix: string, ds: Dataset): string {
  const all = new Set([...ds.clubs.tier1, ...ds.clubs.secondNord, ...ds.clubs.secondSued, ...ds.clubs.ddrOberliga, ...ds.clubs.ddrLiga].map((c) => c.id));
  for (const w of Object.values(ds.worldData ?? {})) for (const c of w.clubs) all.add(c.id);
  let i = 1;
  while (all.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

/** Startvereine → Weltdaten (gleiche IDs). Nur Felder, die vom Standard abweichen, werden
 *  gespiegelt; ein auf den Standard zurückgesetztes Feld holt auch in den Weltdaten den
 *  Standard zurück. So bleiben zeitbezogene Namen der Weltdaten (Karl-Marx-Stadt, Umzüge)
 *  unberührt, solange niemand den Verein ändert. */
let stdCache: Dataset | null = null;
export function mirrorStart(ds: Dataset): void {
  const std = (stdCache ??= builtinDataset());
  const startOfDs = (d: Dataset): [string, AnyClub[]][] => [['ger', [...d.clubs.tier1, ...d.clubs.secondNord, ...d.clubs.secondSued] as unknown as AnyClub[]], ['gdr', [...d.clubs.ddrOberliga, ...d.clubs.ddrLiga] as unknown as AnyClub[]]];
  const stdStart = new Map(startOfDs(std).flatMap(([, l]) => l).map((c) => [c.id, c]));
  for (const [cc, list] of startOfDs(ds)) {
    const w = ds.worldData?.[cc];
    if (!w) continue;
    const by = new Map(w.clubs.map((c) => [c.id, c]));
    const stdW = new Map((std.worldData?.[cc]?.clubs ?? []).map((c) => [c.id, c]));
    for (const c of list) {
      const r = by.get(c.id);
      if (!r) continue;
      const s0 = stdStart.get(c.id), w0 = stdW.get(c.id);
      const col = colorsOf(c), col0 = s0 ? colorsOf(s0) : null;
      const pick = <V,>(mine: V, std0: V | undefined, world0: V | undefined, cur: V): V => (s0 && mine === std0 ? (world0 ?? cur) : mine);
      r.name = pick(c.name, s0?.name, w0?.name, r.name);
      if (c.shortName) r.short = pick(c.shortName, s0?.shortName, w0?.short, r.short);
      r.city = pick(c.city, s0?.city, w0?.city, r.city);
      const same = col0 && col.primary === col0.primary && col.secondary === col0.secondary;
      const nextCol = same && w0 ? w0.colors : col;
      if (r.colors.primary !== nextCol.primary || r.colors.secondary !== nextCol.secondary) r.colors = { ...nextCol };
    }
  }
}

function seasonYears(e?: WEntry): number[] {
  return Object.keys(e?.seasons ?? {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
}

/** Sprungziel → Land + Liga (Startvereine bzw. „Alle Vereine des Landes“). */
function startOf(ds: Dataset, t: Target | null): { cc: string; league: League } {
  const def = { cc: 'ger', league: 'start:tier1' as League };
  if (!t) return def;
  const st = START.find((x) => x.key === t.tab);
  if (st) return { cc: st.cc, league: `start:${st.key}` };
  if (t.tab === 'all' && t.cc) return { cc: t.cc, league: 'all' };
  if (t.id) {
    for (const x of START) if ((ds.clubs[x.key] as { id: string }[]).some((c) => c.id === t.id)) return { cc: x.cc, league: `start:${x.key}` };
    for (const [cc, w] of Object.entries(ds.worldData ?? {})) if (w.clubs.some((c) => c.id === t.id)) return { cc, league: 'all' };
  }
  return def;
}

export function ClubsSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const target = useNavTarget();
  const [init] = useState(() => startOf(ds, target));
  const [cc, setCc] = useState(init.cc);
  const [league, setLeague] = useState<League>(init.league);
  const [year, setYear] = useState(1975);
  const [sel, setSel] = useState<number | null>(0);
  const wd = ds.worldData ?? {};
  const entry = wd[cc];
  const years = seasonYears(entry);
  const yr = years.includes(year) ? year : years.find((y) => y >= 1975) ?? years[0] ?? 1975;
  const row = entry?.seasons[yr];
  const countries = WORLD_COUNTRIES.filter((c) => wd[c.cc]?.clubs.length || c.cc === 'ger' || c.cc === 'gdr');

  // Ligen dieses Landes
  const leagues: { value: League; label: string }[] = [
    ...START.filter((x) => x.cc === cc).map((x) => ({ value: `start:${x.key}` as League, label: x.label })),
    ...(entry ? (['t1', 't2', 't2b'] as const).filter((k) => years.some((y) => entry.seasons[y]?.[k]?.length)).map((k) => ({ value: `season:${k}` as League, label: `${SEASON_LABEL[k]} je Saison` })) : []),
    ...(entry ? [{ value: 'other' as League, label: 'Ohne Liga in der Saison' }, { value: 'all' as League, label: 'Alle Vereine des Landes' }] : []),
  ];
  const lg = leagues.some((l) => l.value === league) ? league : leagues[0]?.value;
  const pickCountry = (next: string) => {
    setCc(next); setSel(0);
    const st = START.find((x) => x.cc === next);
    setLeague(st ? `start:${st.key}` : 'season:t1');
  };
  const change = () => { if (lg?.startsWith('start:')) mirrorStart(ds); onChange(); };

  let body: ReactNode = null;
  let info = '';
  let current: AnyClub | undefined;
  if (lg?.startsWith('start:')) {
    const tab = lg.slice(6) as StartTab;
    const st = START.find((x) => x.key === tab)!;
    info = `${st.info} Die Zahl der Vereine je Liga muss gerade sein. IDs bleiben über alle Ligen eindeutig – Spielstände und Wappen hängen an ihnen. Name, Kürzel, Stadt und Farben gelten auch in den Weltdaten.`;
    const rows = ds.clubs[tab] as unknown as AnyClub[];
    current = sel != null ? rows[sel] : undefined;
    const make = (): AnyClub => {
      if (tab === 'tier1') return { id: newId('verein', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', founded: 1900, reputation: 60, primary: '#1E56A0', secondary: '#FFFFFF', stadium: 'Stadion Neue Stadt', capacity: 30000 } as AnyClub;
      if (tab === 'secondNord' || tab === 'secondSued') return { id: newId(tab === 'secondNord' ? 'n_neu' : 's_neu', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', primary: '#1E56A0', secondary: '#FFFFFF', strength: 60 } as AnyClub;
      return { id: newId('ddr_neu', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', strength: 55, colors: { primary: '#1E56A0', secondary: '#FFFFFF' }, tier: tab === 'ddrOberliga' ? 101 : 102, group: 'nordost' } as unknown as AnyClub;
    };
    const cols = tab === 'tier1' ? TIER1_COLS : tab.startsWith('second') ? SECOND_COLS : SIM_COLS;
    body = <TableEditor key={lg} rows={rows} cols={cols} onChange={change} makeRow={make} selected={sel} onSelect={setSel} />;
  } else if (entry && lg) {
    const inSeason = new Set([...(row?.t1 ?? []), ...(row?.t2 ?? []), ...(row?.t2b ?? [])]);
    const byId = new Map(entry.clubs.map((c) => [c.id, c]));
    let rows: RealClub[];
    if (lg.startsWith('season:')) {
      const k = lg.slice(7) as 't1' | 't2' | 't2b';
      rows = (row?.[k] ?? []).map((id) => byId.get(id)).filter((c): c is RealClub => !!c);
      info = `${SEASON_LABEL[k]} ${seasonLabelOf(yr)} in Tabellenreihenfolge. „Hinzufügen“ legt einen neuen Verein an und setzt ihn in diese Liga; × nimmt ihn nur aus der Liga dieser Saison (der Verein bleibt erhalten). Die Ligazusammensetzung aller Saisons pflegst du unter „Ligen je Saison“.`;
    } else if (lg === 'other') {
      rows = entry.clubs.filter((c) => !inSeason.has(c.id));
      info = `Vereine des Landes ohne Liga in ${seasonLabelOf(yr)} (andere Jahre, Pokal, Unterbau). × löscht den Verein ganz – auch aus allen Saisons.`;
    } else {
      rows = entry.clubs;
      info = 'Alle Vereine des Landes. × löscht den Verein ganz – auch aus allen Saisons. IDs nie ändern: Spielstände, Wappen und Trikots hängen an ihnen.';
    }
    current = sel != null ? rows[sel] as unknown as AnyClub : undefined;
    const addClub = () => {
      const c: RealClub = { id: newId(`${cc}-neu-`, ds), name: 'Neue Stadt', short: 'NEU', city: 'Neue Stadt', colors: { primary: '#1E56A0', secondary: '#FFFFFF' } };
      entry.clubs.push(c);
      if (lg.startsWith('season:')) {
        const k = lg.slice(7) as 't1' | 't2' | 't2b';
        entry.seasons[yr] ??= { t1: [] };
        const r = entry.seasons[yr];
        if (k === 't1') r.t1.push(c.id); else (r[k] ??= []).push(c.id);
      }
      setSel(rows.length);
    };
    const delClub = (c: RealClub) => {
      if (lg.startsWith('season:')) {
        const k = lg.slice(7) as 't1' | 't2' | 't2b';
        const r = entry.seasons[yr];
        if (r) { if (k === 't1') r.t1 = r.t1.filter((x) => x !== c.id); else r[k] = (r[k] ?? []).filter((x) => x !== c.id); }
        return;
      }
      entry.clubs.splice(entry.clubs.indexOf(c), 1);
      for (const r of Object.values(entry.seasons)) {
        r.t1 = r.t1.filter((x) => x !== c.id);
        if (r.t2) r.t2 = r.t2.filter((x) => x !== c.id);
        if (r.t2b) r.t2b = r.t2b.filter((x) => x !== c.id);
      }
    };
    body = <TableEditor key={`${lg}-${yr}`} rows={rows} cols={WORLD_COLS} onChange={onChange} onAdd={addClub} onDelete={delClub}
      canMove={false} selected={sel} onSelect={setSel} />;
  } else {
    info = 'Für dieses Land gibt es im Datensatz noch keine Weltdaten. Lege es unter „Ligen je Saison“ an.';
  }

  return (
    <div className="ed-section">
      <div className="ed-row ed-club-pick">
        <label className="ed-field"><span className="ed-label">Land</span>
          <select className="ed-in" data-act="club-country" value={cc} onChange={(e) => pickCountry(e.target.value)}>
            {countries.map((c) => <option key={c.cc} value={c.cc}>{c.name}{wd[c.cc] ? ` (${wd[c.cc].clubs.length})` : ''}</option>)}
          </select></label>
        <label className="ed-field"><span className="ed-label">Liga</span>
          <select className="ed-in" data-act="club-league" value={lg ?? ''} onChange={(e) => { setLeague(e.target.value as League); setSel(0); }}>
            {leagues.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select></label>
        {entry && lg && !lg.startsWith('start:') && lg !== 'all' && (
          <label className="ed-field"><span className="ed-label">Saison</span>
            <select className="ed-in" data-act="club-year" value={yr} onChange={(e) => { setYear(Number(e.target.value)); setSel(0); }}>
              {years.map((y) => <option key={y} value={y}>{seasonLabelOf(y)}</option>)}
            </select></label>
        )}
      </div>
      <Explain>{info}</Explain>
      <div className="ed-split">
        {body}
        {current && <ClubCosmetics ds={ds} club={current} onChange={onChange} />}
      </div>
    </div>
  );
}

function ClubCosmetics({ ds, club, onChange }: { ds: Dataset; club: AnyClub; onChange: () => void }) {
  const colors = colorsOf(club);
  const crest = ds.crests?.[club.id];
  const kits = ds.kits?.[club.id];
  const preview = { id: club.id, name: club.name, shortName: club.shortName ?? club.short, city: club.city, colors, customCrest: crest } as unknown as Club;

  const setKit = (side: 'home' | 'away', patch: Partial<Kit>) => {
    ds.kits ??= {};
    const cur = ds.kits[club.id] ?? {};
    const home: Kit = cur.home ?? { primary: colors.primary, secondary: colors.secondary, pattern: 'solid' };
    const away: Kit = cur.away ?? { primary: colors.secondary, secondary: colors.primary, pattern: 'solid' };
    const next = { home, away };
    next[side] = { ...next[side], ...patch };
    ds.kits[club.id] = next;
    onChange();
  };
  const resetKits = () => { if (ds.kits) delete ds.kits[club.id]; onChange(); };

  return (
    <aside className="ed-side">
      <div className="ed-side-head">
        <ClubCrest club={preview} size={72} />
        <div>
          <div className="ed-side-title">{club.name || '–'}</div>
          <div className="ed-hint">{club.city} · ID {club.id}</div>
        </div>
      </div>
      <CrestEras ds={ds} club={preview} onChange={onChange} />
      <div className="ed-sec">Trikots</div>
      <div className="ed-kits">
        {(['home', 'away'] as const).map((side) => {
          const k = kits?.[side] ?? (side === 'home'
            ? { primary: colors.primary, secondary: colors.secondary, pattern: 'solid' as KitPattern }
            : { primary: colors.secondary, secondary: colors.primary, pattern: 'solid' as KitPattern });
          return (
            <div key={side} className="ed-kit">
              <JerseySVG primary={k.primary} secondary={k.secondary} pattern={k.pattern} size={96} />
              <div className="ed-hint">{side === 'home' ? 'Heim' : 'Auswärts'}{kits?.[side] ? '' : ' (Standard)'}</div>
              <span className="ed-color">
                <input type="color" value={k.primary.length === 7 ? k.primary : '#000000'} onChange={(e) => setKit(side, { primary: e.target.value.toUpperCase() })} />
                <input type="color" value={k.secondary.length === 7 ? k.secondary : '#FFFFFF'} onChange={(e) => setKit(side, { secondary: e.target.value.toUpperCase() })} />
              </span>
              <select className="ed-in" value={k.pattern} onChange={(e) => setKit(side, { pattern: e.target.value as KitPattern })}>
                {PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      {kits && <button className="ed-btn mt8" onClick={resetKits}>Trikots auf Standard zurücksetzen</button>}
      <div className="ed-hint mt8">Trikots gelten nur, wenn Heim und Auswärts gesetzt sind (eines anpassen setzt beide).</div>
    </aside>
  );
}

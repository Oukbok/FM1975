import { useRef, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import JerseySVG from '../../components/JerseySVG';
import { Dataset } from '../../data/dataset/schema';
import { Club, Kit, KitPattern } from '../../types';
import { imageToDataUrl } from '../store';
import { Col, Explain, TableEditor } from '../TableEditor';

// =============================================================================
// VEREINE: 1. Liga, 2. Liga Nord/Süd, DDR-Ligen + Wappen und Trikots je Verein.
// =============================================================================
type Tab = 'tier1' | 'secondNord' | 'secondSued' | 'ddrOberliga' | 'ddrLiga';
const TABS: { key: Tab; label: string; info: string }[] = [
  { key: 'tier1', label: '1. Liga', info: 'Die Spielerliga zum Start 1975/76. Kader werden aus dem Ansehen erzeugt (höheres Ansehen = stärkere Spieler, mehr Geld, größere Erwartungen).' },
  { key: 'secondNord', label: '2. Liga Nord', info: 'Simulierte Zweitligisten (Staffel Nord). Die Stärke steuert Kader, Stadion und Zuschauer, sobald der Verein in deine Liga kommt. Auch als Startverein wählbar.' },
  { key: 'secondSued', label: '2. Liga Süd', info: 'Simulierte Zweitligisten (Staffel Süd).' },
  { key: 'ddrOberliga', label: 'DDR-Oberliga', info: 'Getrennte Liga bis zur Wiedervereinigung 1991/92. Ebene 101; die Ligareform 1991 übernimmt diese Vereine.' },
  { key: 'ddrLiga', label: 'DDR-Liga', info: 'Zweite DDR-Liga (Ebene 102).' },
];

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

interface AnyClub { id: string; name: string; shortName: string; city: string; primary?: string; secondary?: string; colors?: { primary: string; secondary: string } }

function colorsOf(c: AnyClub) {
  return { primary: c.primary ?? c.colors?.primary ?? '#888888', secondary: c.secondary ?? c.colors?.secondary ?? '#FFFFFF' };
}

function newId(prefix: string, ds: Dataset): string {
  const all = new Set([...ds.clubs.tier1, ...ds.clubs.secondNord, ...ds.clubs.secondSued, ...ds.clubs.ddrOberliga, ...ds.clubs.ddrLiga].map((c) => c.id));
  let i = 1;
  while (all.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

export function ClubsSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const [tab, setTab] = useState<Tab>('tier1');
  const [sel, setSel] = useState<number | null>(0);
  const info = TABS.find((t) => t.key === tab)!;
  const rows = ds.clubs[tab] as unknown as AnyClub[];
  const club = sel != null ? rows[sel] : undefined;

  const make = (): AnyClub => {
    if (tab === 'tier1') return { id: newId('verein', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', founded: 1900, reputation: 60, primary: '#1E56A0', secondary: '#FFFFFF', stadium: 'Stadion Neue Stadt', capacity: 30000 } as AnyClub;
    if (tab === 'secondNord' || tab === 'secondSued') return { id: newId(tab === 'secondNord' ? 'n_neu' : 's_neu', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', primary: '#1E56A0', secondary: '#FFFFFF', strength: 60 } as AnyClub;
    return { id: newId('ddr_neu', ds), name: 'Neue Stadt', shortName: 'NEU', city: 'Neue Stadt', strength: 55, colors: { primary: '#1E56A0', secondary: '#FFFFFF' }, tier: tab === 'ddrOberliga' ? 101 : 102, group: 'nordost' } as unknown as AnyClub;
  };
  const cols = tab === 'tier1' ? TIER1_COLS : tab.startsWith('second') ? SECOND_COLS : SIM_COLS;

  return (
    <div className="ed-section">
      <div className="ed-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`ed-tab ${tab === t.key ? 'on' : ''}`} onClick={() => { setTab(t.key); setSel(0); }}>
            {t.label} <span className="ed-badge">{(ds.clubs[t.key] as unknown[]).length}</span>
          </button>
        ))}
      </div>
      <Explain>{info.info} Die Zahl der Vereine je Liga muss gerade sein. IDs bleiben über alle Ligen eindeutig – Spielstände und Wappen hängen an ihnen.</Explain>
      <div className="ed-split">
        <TableEditor rows={rows} cols={cols} onChange={onChange} makeRow={make} selected={sel} onSelect={setSel} />
        {club && <ClubCosmetics ds={ds} club={club} onChange={onChange} />}
      </div>
    </div>
  );
}

function ClubCosmetics({ ds, club, onChange }: { ds: Dataset; club: AnyClub; onChange: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const colors = colorsOf(club);
  const crest = ds.crests?.[club.id];
  const kits = ds.kits?.[club.id];
  const preview = { id: club.id, name: club.name, shortName: club.shortName, city: club.city, colors, customCrest: crest } as unknown as Club;

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

  const upload = async (f?: File) => {
    if (!f) return;
    try {
      const url = await imageToDataUrl(f);
      ds.crests ??= {};
      ds.crests[club.id] = url;
      setErr(null);
      onChange();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <aside className="ed-side">
      <div className="ed-side-head">
        <ClubCrest club={preview} size={72} />
        <div>
          <div className="ed-side-title">{club.name || '–'}</div>
          <div className="ed-hint">{club.city} · ID {club.id}</div>
        </div>
      </div>
      <div className="ed-sec">Wappen</div>
      <div className="ed-row">
        <button className="ed-btn" onClick={() => file.current?.click()}>Bild hochladen</button>
        {crest && <button className="ed-btn" onClick={() => { delete ds.crests![club.id]; onChange(); }}>Entfernen</button>}
        <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="ed-hint">PNG, JPG oder SVG. Bilder werden auf 256 px verkleinert. Ohne eigenes Wappen erzeugt das Spiel eines aus Farben und Kürzel.</div>
      {err && <div className="ed-err">{err}</div>}
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

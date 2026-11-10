// =============================================================================
// GRAFIKPAKETE (Wunsch Pascal): Wappen massenhaft importieren und exportieren
// -----------------------------------------------------------------------------
// • Export: Liste aller Vereins-IDs (CSV) + Vorlage-Paket (ZIP mit Anleitung und
//   Liste) + die Wappen dieses Datensatzes als Grafikpaket.
// • Import: ZIP, einzelne Bilder oder ganzer Ordner. Dateiname = Vereins-ID
//   („eng-liverpool-rot.png“), optional mit Jahr für spätere Wappen
//   („eng-liverpool-rot@1999.png“). Ohne passende ID wird nach Name/Stadt
//   gesucht; eine Datei `zuordnung.csv` (Datei;ID) im Paket hat Vorrang.
//   Vor dem Übernehmen zeigt eine Tabelle jede Datei mit Vorschau und Ziel.
// =============================================================================
import { useMemo, useRef, useState } from 'react';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { Dataset } from '../../data/dataset/schema';
import { WORLD_COUNTRIES } from '../../data/world/countries';
import { imageToDataUrl } from '../store';
import { Explain, SortTh, useSort } from '../TableEditor';

export interface ClubRef { id: string; name: string; short: string; city: string; country: string; league: string }

const IMG = /\.(png|jpe?g|webp|gif|svg)$/i;
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
const slug = (s: string) => s.toLowerCase().replace(/[^a-zäöüß]/g, '');

/** Alle Vereine des Datensatzes: Startvereine, Weltdaten aller Länder, Amateur-Pool. */
export function allClubs(ds: Dataset): ClubRef[] {
  const out = new Map<string, ClubRef>();
  const put = (c: ClubRef) => { if (!out.has(c.id)) out.set(c.id, c); };
  const start: [string, string, { id: string; name: string; shortName: string; city: string }[]][] = [
    ['Deutschland', '1. Liga 1975/76', ds.clubs.tier1], ['Deutschland', '2. Liga Nord 1975/76', ds.clubs.secondNord], ['Deutschland', '2. Liga Süd 1975/76', ds.clubs.secondSued],
    ['DDR', 'DDR-Oberliga 1975/76', ds.clubs.ddrOberliga], ['DDR', 'DDR-Liga 1975/76', ds.clubs.ddrLiga],
  ];
  for (const [country, league, list] of start) for (const c of list) put({ id: c.id, name: c.name, short: c.shortName, city: c.city, country, league });
  for (const def of WORLD_COUNTRIES) {
    const w = ds.worldData?.[def.cc];
    if (!w) continue;
    const years = Object.keys(w.seasons).map(Number).sort((a, b) => b - a);
    const leagueOf = (id: string) => {
      for (const y of years) {
        const r = w.seasons[y];
        if (r.t1.includes(id)) return `1. Liga ${y}/${String(y + 1).slice(2)}`;
        if (r.t2?.includes(id) || r.t2b?.includes(id)) return `2. Liga ${y}/${String(y + 1).slice(2)}`;
      }
      return '–';
    };
    for (const c of w.clubs) put({ id: c.id, name: c.name, short: c.short, city: c.city, country: def.name, league: leagueOf(c.id) });
  }
  for (const t of ds.poolTowns ?? []) put({ id: `pool-${slug(t.town)}`, name: t.town, short: t.town.slice(0, 3).toUpperCase(), city: t.town, country: 'Deutschland', league: 'Amateur-Pool (wenn nachgerückt)' });
  return [...out.values()];
}

function download(name: string, data: Uint8Array | string, type: string) {
  const blob = new Blob([data as BlobPart], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const csvCell = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
function clubsCsv(list: ClubRef[]): string {
  // BOM, damit Tabellenprogramme Umlaute richtig lesen.
  return '﻿' + ['id;name;kuerzel;stadt;land;liga', ...list.map((c) => [c.id, c.name, c.short, c.city, c.country, c.league].map(csvCell).join(';'))].join('\r\n');
}

const README = `FM1975 – Grafikpaket
=====================

Wappen benennen
- Dateiname = Vereins-ID aus vereine.csv, z. B.  eng-liverpool-rot.png
- Späteres Wappen ab Saisonbeginn eines Jahres:  eng-liverpool-rot@1999.png
- Formate: PNG, JPG, WEBP, GIF, SVG. Bilder werden beim Import auf 256 px verkleinert.
- Ordner sind egal (z. B. crests/england/…); nur der Dateiname zählt.

Eigene Dateinamen
- Lege eine Datei zuordnung.csv ins Paket:  datei;id
  z. B.  liverpool_fc_logo.png;eng-liverpool-rot
- Ohne ID im Namen sucht der Editor nach Vereinsname bzw. Stadt und zeigt jede
  Zuordnung vor dem Übernehmen zur Kontrolle.

Import
- Datensatz-Editor › Datensatz › Grafikpakete › Grafikpaket importieren
  (ZIP, einzelne Bilder oder ganzen Ordner wählen).
`;

interface Row { key: string; file: string; url: string; blob: Blob; target: string; year?: number; how: string; use: boolean }

function parseMapping(text: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const [f, id] = line.split(/[;,\t]/).map((x) => x?.trim().replace(/^"|"$/g, ''));
    if (f && id && !/^datei$/i.test(f)) m.set(f.split('/').pop()!.toLowerCase(), id);
  }
  return m;
}

function matchFile(name: string, clubs: ClubRef[], byId: Map<string, ClubRef>, byNorm: Map<string, ClubRef[]>, mapping: Map<string, string>): { target: string; year?: number; how: string } {
  const base = name.split('/').pop()!;
  const mapped = mapping.get(base.toLowerCase());
  let stem = base.replace(IMG, '');
  let year: number | undefined;
  const ym = stem.match(/^(.*?)[@_ -]((?:19|20|21)\d\d)$/);
  if (ym) { stem = ym[1]; year = Number(ym[2]); }
  if (mapped) return { target: byId.has(mapped) ? mapped : '', year, how: byId.has(mapped) ? 'zuordnung.csv' : `zuordnung.csv: unbekannte ID ${mapped}` };
  const id = stem.toLowerCase().replace(/^w_/, '');
  if (byId.has(id)) return { target: id, year, how: 'ID' };
  const n = norm(stem);
  const hits = byNorm.get(n) ?? [];
  if (hits.length === 1) return { target: hits[0].id, year, how: 'Name' };
  if (hits.length > 1) return { target: '', year, how: `mehrdeutig (${hits.length} Vereine)` };
  // Teiltreffer: Dateiname enthält genau einen Vereinsnamen (mind. 5 Zeichen).
  const part = clubs.filter((c) => { const cn = norm(c.name); return cn.length >= 5 && n.includes(cn); });
  if (part.length === 1) return { target: part[0].id, year, how: 'Name (Teil)' };
  return { target: '', year, how: 'nicht erkannt' };
}

export function GraphicsSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const clubs = useMemo(() => allClubs(ds), [ds]);
  const byId = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);
  const byNorm = useMemo(() => {
    const m = new Map<string, ClubRef[]>();
    const add = (k: string, c: ClubRef) => { if (!k) return; const l = m.get(k) ?? []; if (!l.includes(c)) l.push(c); m.set(k, l); };
    for (const c of clubs) { add(norm(c.name), c); add(norm(c.id), c); add(norm(c.id.replace(/^[a-z]{3}-/, '')), c); }
    return m;
  }, [clubs]);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ok' | 'open'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const st = useSort();
  const nCrests = Object.keys(ds.crests ?? {}).length + Object.values(ds.crestEras ?? {}).reduce((a, l) => a + l.length, 0);

  const exportCsv = () => download('fm1975-vereine.csv', clubsCsv(clubs), 'text/csv;charset=utf-8');
  const exportTemplate = () => {
    const zip = zipSync({ 'LIESMICH.txt': strToU8(README), 'vereine.csv': strToU8(clubsCsv(clubs)), 'zuordnung.csv': strToU8('datei;id\r\n'), 'crests/': new Uint8Array(0) });
    download('fm1975-grafikpaket-vorlage.zip', zip, 'application/zip');
  };
  const exportPack = () => {
    const files: Record<string, Uint8Array> = { 'LIESMICH.txt': strToU8(README), 'vereine.csv': strToU8(clubsCsv(clubs)) };
    const put = (name: string, url: string) => {
      const m = url.match(/^data:image\/([a-z+]+);base64,(.*)$/);
      if (!m) return;
      const ext = m[1] === 'svg+xml' ? 'svg' : m[1] === 'jpeg' ? 'jpg' : m[1];
      const bin = atob(m[2]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      files[`crests/${name}.${ext}`] = u8;
    };
    for (const [id, url] of Object.entries(ds.crests ?? {})) put(id, url);
    for (const [id, list] of Object.entries(ds.crestEras ?? {})) for (const e of list) put(`${id}@${e.from}`, e.crest);
    download(`${ds.meta.id}-wappen.zip`, zipSync(files), 'application/zip');
  };

  const read = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy('Lese Dateien …'); setMsg(null);
    const entries: { name: string; blob: Blob }[] = [];
    let mapping = new Map<string, string>();
    for (const f of [...list]) {
      const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      if (/\.zip$/i.test(f.name)) {
        const files = unzipSync(new Uint8Array(await f.arrayBuffer()));
        for (const [name, data] of Object.entries(files)) {
          if (name.startsWith('__MACOSX/') || name.endsWith('/')) continue;
          if (/(^|\/)zuordnung\.csv$/i.test(name)) { mapping = new Map([...mapping, ...parseMapping(new TextDecoder().decode(data))]); continue; }
          if (!IMG.test(name)) continue;
          const ext = name.split('.').pop()!.toLowerCase();
          entries.push({ name, blob: new Blob([data as BlobPart], { type: MIME[ext] ?? 'image/png' }) });
        }
      } else if (/(^|\/)zuordnung\.csv$/i.test(path)) mapping = new Map([...mapping, ...parseMapping(await f.text())]);
      else if (IMG.test(f.name)) entries.push({ name: path, blob: f });
    }
    const next: Row[] = entries.map((e, i) => {
      const m = matchFile(e.name, clubs, byId, byNorm, mapping);
      return { key: `${i}-${e.name}`, file: e.name, url: URL.createObjectURL(e.blob), blob: e.blob, target: m.target, year: m.year, how: m.how, use: !!m.target };
    });
    for (const r of rows) URL.revokeObjectURL(r.url);
    setRows(next);
    setBusy(null);
    setMsg(entries.length ? `${entries.length} Bilder gelesen, ${next.filter((r) => r.target).length} zugeordnet.` : 'Keine Bilder gefunden (PNG, JPG, WEBP, GIF, SVG).');
  };

  const setTarget = (r: Row, v: string) => {
    const id = v.split(' — ')[0].trim();
    setRows(rows.map((x) => (x === r ? { ...x, target: byId.has(id) ? id : '', how: byId.has(id) ? 'von Hand' : 'nicht erkannt', use: byId.has(id) } : x)));
  };
  const exists = (r: Row) => !!r.target && (r.year ? !!ds.crestEras?.[r.target]?.some((e) => e.from === r.year) : !!ds.crests?.[r.target]);

  const apply = async () => {
    const todo = rows.filter((r) => r.use && r.target && (overwrite || !exists(r)));
    if (!todo.length) return;
    setBusy(`Übernehme 0 / ${todo.length} …`);
    let done = 0;
    const failed: string[] = [];
    for (const r of todo) {
      try {
        const file = new File([r.blob], r.file.split('/').pop()!, { type: r.blob.type });
        const url = await imageToDataUrl(file);
        if (r.year) {
          ds.crestEras ??= {};
          const list = (ds.crestEras[r.target] ??= []).filter((e) => e.from !== r.year);
          list.push({ from: r.year, crest: url });
          ds.crestEras[r.target] = list.sort((a, b) => a.from - b.from);
        } else { ds.crests ??= {}; ds.crests[r.target] = url; }
        done++;
      } catch { failed.push(r.file); }
      if (done % 20 === 0) setBusy(`Übernehme ${done} / ${todo.length} …`);
    }
    onChange();
    setBusy(null);
    setRows(rows.filter((r) => !todo.includes(r) || failed.includes(r.file)));
    setMsg(`${done} Wappen übernommen${failed.length ? `, ${failed.length} Bilder nicht lesbar` : ''}.`);
  };

  const shown = st.sorted(rows.filter((r) => filter === 'all' || (filter === 'ok' ? !!r.target : !r.target)), (r, k) =>
    k === 'file' ? r.file : k === 'target' ? byId.get(r.target)?.name ?? '' : k === 'year' ? r.year ?? 0 : k === 'how' ? r.how : exists(r) ? 1 : 0);
  const nUse = rows.filter((r) => r.use && r.target && (overwrite || !exists(r))).length;

  return (
    <div className="ed-section">
      <Explain>Wappen für viele Vereine auf einmal: Exportiere die <b>Vereins-IDs</b>, benenne die Bilder danach (<code>eng-liverpool-rot.png</code>, spätere Wappen mit Jahr: <code>eng-liverpool-rot@1999.png</code>) und importiere das Paket als ZIP, Ordner oder einzelne Bilder. Andere Dateinamen ordnet der Editor nach Vereinsname zu, oder du legst eine <code>zuordnung.csv</code> (<code>datei;id</code>) ins Paket. Vor dem Übernehmen siehst du jede Datei mit Vorschau und Ziel. Dieser Datensatz enthält {nCrests} Wappen für {clubs.length} Vereine.</Explain>

      <div className="ed-sec">Exportieren</div>
      <div className="ed-row">
        <button className="ed-btn" data-act="gfx-csv" onClick={exportCsv}>Vereins-IDs als CSV</button>
        <button className="ed-btn" data-act="gfx-template" onClick={exportTemplate}>Vorlage-Paket (ZIP mit Anleitung)</button>
        <button className="ed-btn" data-act="gfx-pack" disabled={!nCrests} onClick={exportPack}>Wappen dieses Datensatzes als Grafikpaket</button>
      </div>

      <div className="ed-sec">Grafikpaket importieren</div>
      <div className="ed-row">
        <button className="ed-btn on" onClick={() => fileRef.current?.click()}>ZIP oder Bilder wählen</button>
        <button className="ed-btn" onClick={() => dirRef.current?.click()}>Ordner wählen</button>
        <label className="ed-check"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Vorhandene Wappen ersetzen</label>
        {busy && <span className="ed-hint">{busy}</span>}
        {msg && !busy && <span className="ed-hint">{msg}</span>}
        <input ref={fileRef} type="file" multiple accept=".zip,image/*,.svg,.csv" style={{ display: 'none' }} data-act="gfx-files"
          onChange={(e) => { const f = e.target.files; read(f).finally(() => { e.target.value = ''; }); }} />
        <input ref={dirRef} type="file" multiple style={{ display: 'none' }} {...{ webkitdirectory: '', directory: '' } as Record<string, string>}
          onChange={(e) => { const f = e.target.files; read(f).finally(() => { e.target.value = ''; }); }} />
      </div>

      {rows.length > 0 && <>
        <div className="ed-row">
          <div className="ed-tabs">
            {([['all', `Alle ${rows.length}`], ['ok', `Zugeordnet ${rows.filter((r) => r.target).length}`], ['open', `Offen ${rows.filter((r) => !r.target).length}`]] as const).map(([k, l]) => (
              <button key={k} className={`ed-tab ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <button className="ed-btn on" data-act="gfx-apply" disabled={!nUse || !!busy} onClick={apply}>{nUse} Wappen übernehmen</button>
          <button className="ed-btn" onClick={() => { for (const r of rows) URL.revokeObjectURL(r.url); setRows([]); setMsg(null); }}>Verwerfen</button>
        </div>
        <datalist id="ed-club-ids">{clubs.map((c) => <option key={c.id} value={`${c.id} — ${c.name} (${c.country})`} />)}</datalist>
        <div className="ed-table-scroll">
          <table className="ed-table ed-gfx">
            <thead><tr>
              <th style={{ width: 40 }} />
              <th style={{ width: 64 }}>Bild</th>
              <SortTh k="file" label="Datei" sort={st.sort} onSort={st.toggle} />
              <SortTh k="target" label="Verein" sort={st.sort} onSort={st.toggle} style={{ minWidth: 320 }} />
              <SortTh k="year" label="Ab Jahr" sort={st.sort} onSort={st.toggle} style={{ width: 90 }} />
              <SortTh k="how" label="Erkannt über" sort={st.sort} onSort={st.toggle} style={{ width: 170 }} />
              <SortTh k="exists" label="Status" sort={st.sort} onSort={st.toggle} style={{ width: 120 }} />
            </tr></thead>
            <tbody>
              {shown.map((r) => {
                const c = byId.get(r.target);
                return (
                  <tr key={r.key} className={r.target ? '' : 'ed-gfx-open'}>
                    <td><input type="checkbox" checked={r.use} disabled={!r.target} onChange={(e) => setRows(rows.map((x) => (x === r ? { ...x, use: e.target.checked } : x)))} /></td>
                    <td><img className="ed-gfx-img" src={r.url} alt="" /></td>
                    <td className="ed-gfx-file">{r.file}</td>
                    <td>
                      <input className="ed-in" list="ed-club-ids" key={`${r.key}-${r.target}`} defaultValue={c ? `${c.id} — ${c.name} (${c.country})` : ''}
                        placeholder="ID oder Name eingeben …" onBlur={(e) => setTarget(r, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                    </td>
                    <td><input className="ed-in num" type="number" value={r.year ?? ''} placeholder="Start"
                      onChange={(e) => setRows(rows.map((x) => (x === r ? { ...x, year: e.target.value ? Number(e.target.value) : undefined } : x)))} /></td>
                    <td className="ed-hint">{r.how}</td>
                    <td className="ed-hint">{!r.target ? '–' : exists(r) ? (overwrite ? 'ersetzt' : 'vorhanden') : 'neu'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
}

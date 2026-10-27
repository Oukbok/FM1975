import { useRef, useState } from 'react';
import Icon from '../components/Icon';
import { builtinDataset, BUILTIN_ID } from '../data/dataset/builtin';
import { cachedDataset, cachedSummaries, downloadDataset, readDatasetFile, removeDataset, storeDataset } from '../data/dataset/storage';

// =============================================================================
// DATENSÄTZE: importieren, exportieren, löschen; Link zum externen Editor.
// =============================================================================
export function DatasetScreen({ onBack }: { onBack: () => void }) {
  const [, setTick] = useState(0);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = cachedSummaries();

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const r = await readDatasetFile(f);
    if (!r.data) { setMsg({ text: r.errors.join(' '), error: true }); return; }
    const errs = await storeDataset(r.data);
    setMsg(errs.length ? { text: errs.join(' '), error: true } : { text: `Datensatz „${r.data.meta.name}“ importiert.` });
    setTick((t) => t + 1);
  };

  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Datensätze</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="contracts" /></span> Was ist ein Datensatz?</div>
        <div className="dim mini" style={{ lineHeight: 1.6 }}>
          Ein Datensatz legt fest, mit welchen Vereinen, Ligen, Wappen, Trikots, Namen, Legenden und welcher Geschichte ein neues Spiel beginnt –
          bis hin zu den Jahren, in denen Regeln, Gebäude oder Mitarbeiter-Rollen auftauchen oder veralten. Mit dem <b>Datensatz-Editor</b> erstellst du eigene
          Datensätze und teilst sie als Datei. Eigene Datensätze bleiben auf deinem Rechner.
        </div>
        <div className="chip-row mt12">
          <a className="chip active" href="editor/" target="_blank" rel="noopener"><Icon name="settings" /> Editor öffnen</a>
          <button className="chip" onClick={() => fileRef.current?.click()}><Icon name="loadGame" /> Datensatz importieren</button>
          <button className="chip" onClick={() => downloadDataset(builtinDataset())}><Icon name="contracts" /> Standard als Vorlage exportieren</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {msg && <div className={`mini mt8 ${msg.error ? 'red' : 'accent-text'}`}>{msg.text}</div>}
      </div>
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="dashVerein" /></span> Vorhandene Datensätze</div>
        {list.map((d) => (
          <div key={d.id} className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--border)', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{d.name}{d.builtin && <span className="dim2 mini"> · eingebaut</span>}</div>
              <div className="dim2 mini">{[d.author, d.updated, `${d.clubs} Vereine`].filter(Boolean).join(' · ')}</div>
              {d.description && <div className="dim mini">{d.description}</div>}
            </div>
            <button className="btn-sm" onClick={() => downloadDataset(d.id === BUILTIN_ID ? builtinDataset() : cachedDataset(d.id)!)}>Exportieren</button>
            {!d.builtin && <button className="btn-sm" onClick={async () => { await removeDataset(d.id); setMsg({ text: `„${d.name}“ gelöscht.` }); setTick((t) => t + 1); }}>Löschen</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Dataset } from '../../data/dataset/schema';
import { BUILTIN_ID, builtinDataset } from '../../data/dataset/builtin';
import {
  activeDatasetChoice, DATASET_ACCEPT, datasetFileName, downloadDataset, freeDatasetId, loadAllDatasets,
  readDatasetFile, removeDataset, setActiveDatasetChoice, slugId, storeDataset,
} from '../../data/dataset/storage';
import { datasetStats, fmtBytes, fmtStand, type DatasetStats } from '../library';
import { Explain } from '../TableEditor';

// =============================================================================
// DATENSÄTZE – Startseite des Editors (Wunsch Pascal: übersichtlich speichern,
// exportieren, importieren und im Spiel als Datenbank verwenden).
// Oben: geöffnete Arbeitskopie (Speichern/Speichern unter/Export/Im Spiel
// verwenden) und welcher Datensatz im Spiel aktiv ist. Darunter die Bibliothek
// aller gespeicherten Datensätze (IndexedDB `fm1975-datasets`, dieselbe wie im
// Spiel) mit Laden, Umbenennen, Duplizieren, Exportieren, Löschen; Import per
// Datei wählen oder Ziehen auf die Seite. Feste Dialoggröße (`.ed-dlg`).
// =============================================================================
export type Msg = { kind: 'ok' | 'err' | 'info'; text: string } | null;

type Dlg =
  | { kind: 'name'; title: string; label: string; value: string; okLabel: string; ok: (v: string) => void }
  | { kind: 'ask'; title: string; text: string; buttons: { label: string; run: () => void; primary?: boolean; act?: string }[] };

export interface HomeProps {
  ds: Dataset;
  dirty: boolean;
  libVer: number;
  onSave: () => Promise<boolean>;
  onSaveAs: (name: string) => Promise<boolean>;
  onNew: (name: string) => Promise<void>;
  onOpen: (d: Dataset, text: string) => void;
  onExportWork: () => void;
  onWorkMeta: (name: string) => void;
  onWorkUnsaved: () => void;
  onMsg: (m: Msg) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function HomeSection(p: HomeProps) {
  const { ds, dirty, libVer, onMsg } = p;
  const [list, setList] = useState<Dataset[] | null>(null);
  const [stats, setStats] = useState<Record<string, DatasetStats>>({});
  const [active, setActive] = useState(activeDatasetChoice());
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [drop, setDrop] = useState(false);
  const [importErr, setImportErr] = useState<string[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [ver, setVer] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const std = useMemo(() => builtinDataset(), []);

  const reload = () => setVer((v) => v + 1);
  useEffect(() => {
    let alive = true;
    loadAllDatasets().then((all) => {
      if (!alive) return;
      all.sort((a, b) => (b.meta.savedAt ?? b.meta.updated ?? '').localeCompare(a.meta.savedAt ?? a.meta.updated ?? ''));
      setList(all);
      setActive(activeDatasetChoice());
      // Kennzahlen nacheinander rechnen (Vergleich mit dem Standard), damit die Seite sofort steht.
      const out: Record<string, DatasetStats> = {};
      let i = 0;
      const next = () => {
        if (!alive || i >= all.length) return;
        const d = all[i++];
        try { out[d.meta.id] = datasetStats(d, std); } catch { /* fremde Daten */ }
        setStats({ ...out });
        window.setTimeout(next, 0);
      };
      window.setTimeout(next, 0);
    }).catch(() => setList([]));
    return () => { alive = false; };
  }, [libVer, ver, std]);

  const byId = (id: string) => list?.find((d) => d.meta.id === id);
  const stored = byId(ds.meta.id);
  const inLib = !!stored;
  const ids = () => (list ?? []).map((d) => d.meta.id);
  const activeName = active === BUILTIN_ID ? 'Standard (eingebaut)' : byId(active)?.meta.name ?? active;
  const activeMissing = active !== BUILTIN_ID && list != null && !byId(active);

  const use = (id: string, name: string) => {
    setActiveDatasetChoice(id);
    setActive(id);
    onMsg({ kind: 'ok', text: `„${name}“ ist jetzt im Spiel aktiv – neue Spiele starten damit.` });
  };
  const useWork = async () => {
    if (dirty || !inLib) { if (!(await p.onSave())) return; }
    use(ds.meta.id, ds.meta.name);
  };
  const askName = (title: string, label: string, value: string, okLabel: string, ok: (v: string) => void) =>
    setDlg({ kind: 'name', title, label, value, okLabel, ok });

  const load = (d: Dataset) => {
    const go = () => p.onOpen(clone(d), `„${d.meta.name}“ geladen.`);
    if (!dirty) { go(); return; }
    setDlg({ kind: 'ask', title: 'Ungespeicherte Änderungen', text: `„${ds.meta.name}“ hat ungespeicherte Änderungen. Was soll damit passieren, bevor „${d.meta.name}“ geladen wird?`, buttons: [
      { label: 'Erst speichern', primary: true, act: 'save-first', run: async () => { if (await p.onSave()) go(); } },
      { label: 'Verwerfen und laden', act: 'discard', run: go },
    ] });
  };
  const newFromStd = () => {
    const go = () => askName('Neuer Datensatz', 'Name des neuen Datensatzes (Kopie des Standards)', 'Mein Datensatz', 'Anlegen', (v) => { void p.onNew(v); });
    if (!dirty) { go(); return; }
    setDlg({ kind: 'ask', title: 'Ungespeicherte Änderungen', text: `„${ds.meta.name}“ hat ungespeicherte Änderungen.`, buttons: [
      { label: 'Erst speichern', primary: true, run: async () => { if (await p.onSave()) go(); } },
      { label: 'Verwerfen', run: go },
    ] });
  };
  const rename = (d: Dataset) => askName('Umbenennen', 'Neuer Name (die ID bleibt gleich, Spielstände finden ihn weiter)', d.meta.name, 'Umbenennen', async (v) => {
    const c = clone(d); c.meta.name = v;
    const errs = await storeDataset(c);
    if (errs.length) { onMsg({ kind: 'err', text: errs.join(' ') }); return; }
    if (d.meta.id === ds.meta.id) p.onWorkMeta(v);
    onMsg({ kind: 'ok', text: `Umbenannt in „${v}“.` });
    reload();
  });
  const duplicate = (d: Dataset) => askName('Duplizieren', 'Name der Kopie', `${d.meta.name} (Kopie)`, 'Kopie anlegen', async (v) => {
    const c = clone(d);
    c.meta = { ...c.meta, id: freeDatasetId(slugId(v), ids()), name: v, created: today() };
    const errs = await storeDataset(c);
    if (errs.length) { onMsg({ kind: 'err', text: errs.join(' ') }); return; }
    onMsg({ kind: 'ok', text: `Kopie „${v}“ angelegt (ID ${c.meta.id}).` });
    setFlash(c.meta.id); reload();
  });
  const del = (d: Dataset) => setDlg({ kind: 'ask', title: 'Löschen', text: `„${d.meta.name}“ endgültig aus der Bibliothek löschen? Spielstände mit diesem Datensatz laden danach mit den Standardwerten. Vorher exportieren sichert ihn als Datei.`, buttons: [
    { label: 'Löschen', primary: true, act: 'confirm-delete', run: async () => {
      await removeDataset(d.meta.id);
      if (d.meta.id === ds.meta.id) p.onWorkUnsaved();
      onMsg({ kind: 'info', text: `„${d.meta.name}“ gelöscht.` });
      reload();
    } },
  ] });

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    setImportErr(null);
    const r = await readDatasetFile(f);
    if (!r.data) { setImportErr(r.errors); onMsg({ kind: 'err', text: 'Import fehlgeschlagen – siehe Hinweis unter „Importieren“.' }); return; }
    const d = r.data;
    const save = async (x: Dataset, text: string) => {
      const errs = await storeDataset(x);
      if (errs.length) { setImportErr(errs); return; }
      onMsg({ kind: 'ok', text }); setFlash(x.meta.id); reload();
    };
    const asCopy = () => {
      const x = clone(d);
      x.meta = { ...x.meta, id: freeDatasetId(slugId(d.meta.id === BUILTIN_ID ? d.meta.name || 'standard' : d.meta.id), ids()), name: d.meta.id === BUILTIN_ID ? `${d.meta.name} (Import)` : d.meta.name };
      void save(x, `„${x.meta.name}“ importiert (ID ${x.meta.id}).`);
    };
    if (d.meta.id === BUILTIN_ID) { asCopy(); return; }
    const old = byId(d.meta.id);
    if (!old) { void save(d, `„${d.meta.name}“ importiert.`); return; }
    setDlg({ kind: 'ask', title: 'Datensatz gibt es schon', text: `In der Bibliothek liegt bereits „${old.meta.name}“ mit der ID „${d.meta.id}“ (Stand ${fmtStand(old.meta)}). Ersetzen gilt auch für Spielstände mit diesem Datensatz.`, buttons: [
      { label: 'Ersetzen', act: 'import-replace', run: () => { void save(d, `„${d.meta.name}“ ersetzt.`).then(() => { if (d.meta.id === ds.meta.id && !dirty) p.onOpen(clone(d), `„${d.meta.name}“ ersetzt und neu geladen.`); }); } },
      { label: 'Als Kopie importieren', primary: true, act: 'import-copy', run: asCopy },
    ] });
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrop(false); void importFile(e.dataTransfer.files?.[0]); };
  const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer.types ?? []).includes('Files');

  const status: ReactNode = dirty
    ? <span className="ed-state dirty" data-state="dirty">Ungespeicherte Änderungen</span>
    : inLib ? <span className="ed-state ok" data-state="saved">Gespeichert</span>
      : <span className="ed-state new" data-state="new">Noch nicht in der Bibliothek</span>;

  return (
    <div className={`ed-section ed-home ${drop ? 'drop' : ''}`}
      onDragOver={(e) => { if (isFileDrag(e)) { e.preventDefault(); setDrop(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDrop(false); }} onDrop={onDrop}>
      <Explain>Hier verwaltest du alle Datensätze. <b>Speichern</b> legt die Arbeitskopie in die <b>Bibliothek</b> – dieselbe, die das Spiel benutzt. <b>Im Spiel verwenden</b> markiert einen Datensatz als aktiv: Neue Spiele starten damit (im Assistenten vorausgewählt). Spielstände merken sich ihren Datensatz und laden beim nächsten Mal dessen gespeicherten Stand. <b>Exportieren</b> schreibt eine Datei <code>.fm1975</code> mit allen Daten und hochgeladenen Bildern – zum Sichern oder Weitergeben; <b>Importieren</b> liest sie wieder ein (Datei wählen oder auf diese Seite ziehen).</Explain>

      <div className="ed-home-top">
        <div className="ed-card" data-card="work">
          <div className="ed-card-title">Geöffnet</div>
          <div className="ed-card-name">{ds.meta.name} <span className="ed-hint">{ds.meta.id}</span></div>
          <div className="ed-card-line">{status}{inLib && <span className="ed-hint">Bibliothek: Stand {fmtStand(stored!.meta)}</span>}{active === ds.meta.id && <span className="ed-badge good">Im Spiel aktiv</span>}</div>
          <div className="ed-row">
            <button className={`ed-btn ${dirty || !inLib ? 'on' : ''}`} data-act="home-save" onClick={() => void p.onSave()}>Speichern</button>
            <button className="ed-btn" data-act="home-saveas" onClick={() => askName('Speichern unter', 'Name des neuen Datensatzes (bekommt eine eigene ID)', `${ds.meta.name} (Kopie)`, 'Speichern', (v) => { void p.onSaveAs(v); })}>Speichern unter …</button>
            <button className="ed-btn" data-act="home-export" onClick={p.onExportWork}>Exportieren</button>
            {active !== ds.meta.id && <button className="ed-btn" data-act="home-use" onClick={() => void useWork()}>{dirty || !inLib ? 'Speichern & im Spiel verwenden' : 'Im Spiel verwenden'}</button>}
          </div>
        </div>
        <div className="ed-card" data-card="active">
          <div className="ed-card-title">Im Spiel aktiv</div>
          <div className="ed-card-name" data-active-name>{activeName}</div>
          <div className="ed-hint">{activeMissing
            ? 'Dieser Datensatz ist nicht mehr in der Bibliothek – neue Spiele starten mit dem Standard.'
            : 'Neue Spiele starten mit diesem Datensatz. Laufende Spielstände behalten ihren eigenen.'}</div>
          {active !== BUILTIN_ID && <div className="ed-row"><button className="ed-btn" data-act="use-std" onClick={() => use(BUILTIN_ID, 'Standard')}>Standard verwenden</button></div>}
        </div>
      </div>

      <div className="ed-home-bar">
        <div className="ed-sec">Bibliothek{list ? ` · ${list.length + 1} Datensätze` : ''}</div>
        <button className="ed-btn" data-act="home-new" onClick={newFromStd}>Neu (vom Standard)</button>
        <button className="ed-btn" data-act="home-import" onClick={() => fileRef.current?.click()}>Importieren …</button>
        <span className="ed-hint">oder Datei (.fm1975 / .json) hierher ziehen</span>
        <input ref={fileRef} type="file" accept={DATASET_ACCEPT} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void importFile(f); }} />
      </div>
      {importErr && (
        <div className="ed-import-err" data-import-err role="alert">
          <b>Import nicht möglich</b>
          {importErr.map((t, i) => <span key={i}>{t}</span>)}
          <button className="ed-mini" onClick={() => setImportErr(null)} title="Schließen">×</button>
        </div>
      )}

      <table className="ed-table ed-lib">
        <thead><tr><th>Name</th><th>Stand</th><th className="num">Größe</th><th className="num">Änderungen</th><th className="num">Bilder</th><th>Status</th><th /></tr></thead>
        <tbody>
          <tr data-lib="builtin">
            <td><b>Standard (eingebaut)</b><div className="ed-hint">Werte im Code, nicht änderbar</div></td>
            <td>–</td><td className="num">–</td><td className="num">0</td><td className="num">0</td>
            <td>{active === BUILTIN_ID && <span className="ed-badge good">Im Spiel aktiv</span>}</td>
            <td className="ed-lib-acts">
              <button className="ed-mini-btn" onClick={newFromStd}>Neu daraus</button>
              {active !== BUILTIN_ID && <button className="ed-mini-btn" data-act="lib-use" onClick={() => use(BUILTIN_ID, 'Standard')}>Im Spiel verwenden</button>}
              <button className="ed-mini-btn" onClick={() => downloadDataset(std)}>Exportieren</button>
            </td>
          </tr>
          {(list ?? []).map((d) => {
            const st = stats[d.meta.id];
            const open = d.meta.id === ds.meta.id;
            return (
              <tr key={d.meta.id} data-lib={d.meta.id} className={`${open ? 'open' : ''} ${flash === d.meta.id ? 'flash' : ''}`}>
                <td><b>{d.meta.name}</b><div className="ed-hint">{d.meta.id}{d.meta.author ? ` · ${d.meta.author}` : ''}</div></td>
                <td>{fmtStand(d.meta)}</td>
                <td className="num">{st ? fmtBytes(st.bytes) : '…'}</td>
                <td className="num">{st ? `${st.changes}${st.moreChanges ? '+' : ''}` : '…'}</td>
                <td className="num" title={st ? `${st.portraits} Spielerbilder` : undefined}>{st ? st.images : '…'}</td>
                <td className="ed-lib-state">
                  {active === d.meta.id && <span className="ed-badge good">Im Spiel aktiv</span>}
                  {open && <span className={`ed-badge ${dirty ? 'bad' : ''}`}>{dirty ? 'Geöffnet · ungespeichert' : 'Geöffnet'}</span>}
                </td>
                <td className="ed-lib-acts">
                  <button className="ed-mini-btn" data-act="lib-load" onClick={() => load(d)}>Laden</button>
                  {active !== d.meta.id && <button className="ed-mini-btn" data-act="lib-use" onClick={() => use(d.meta.id, d.meta.name)}>Im Spiel verwenden</button>}
                  <button className="ed-mini-btn" data-act="lib-rename" onClick={() => rename(d)}>Umbenennen</button>
                  <button className="ed-mini-btn" data-act="lib-dup" onClick={() => duplicate(d)}>Duplizieren</button>
                  <button className="ed-mini-btn" data-act="lib-export" title={datasetFileName(d)} onClick={() => downloadDataset(d)}>Exportieren</button>
                  <button className="ed-mini-btn danger" data-act="lib-del" onClick={() => del(d)}>Löschen</button>
                </td>
              </tr>
            );
          })}
          {list && !list.length && <tr><td colSpan={7} className="ed-hint">Noch keine eigenen Datensätze – „Speichern“ legt die Arbeitskopie hier ab.</td></tr>}
        </tbody>
      </table>
      {drop && <div className="ed-drop-hint">Datei loslassen, um sie zu importieren</div>}
      {dlg && <Dialog dlg={dlg} close={() => setDlg(null)} />}
    </div>
  );
}

function Dialog({ dlg, close }: { dlg: Dlg; close: () => void }) {
  const [v, setV] = useState(dlg.kind === 'name' ? dlg.value : '');
  const ok = () => { if (dlg.kind !== 'name' || !v.trim()) return; close(); dlg.ok(v.trim()); };
  return (
    <div className="ed-dlg-back" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="ed-dlg" role="dialog" aria-label={dlg.title}>
        <div className="ed-dlg-title">{dlg.title}</div>
        <div className="ed-dlg-body">
          {dlg.kind === 'name' ? (
            <label className="ed-field">
              <span className="ed-label">{dlg.label}</span>
              <input className="ed-in" autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(); }} />
              <span className="ed-hint">ID: {slugId(v || 'datensatz')}</span>
            </label>
          ) : <p>{dlg.text}</p>}
        </div>
        <div className="ed-dlg-foot">
          {dlg.kind === 'name'
            ? <button className="ed-btn on" data-act="dlg-ok" disabled={!v.trim()} onClick={ok}>{dlg.okLabel}</button>
            : dlg.buttons.map((b) => <button key={b.label} className={`ed-btn ${b.primary ? 'on' : ''}`} data-act={b.act} onClick={() => { close(); b.run(); }}>{b.label}</button>)}
          <button className="ed-btn" data-act="dlg-cancel" onClick={close}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

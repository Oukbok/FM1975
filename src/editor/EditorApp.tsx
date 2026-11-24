import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from '../components/Icon';
import { Dataset } from '../data/dataset/schema';
import { builtinDataset } from '../data/dataset/builtin';
import { activeDatasetChoice, datasetFileName, downloadDataset, freeDatasetId, loadAllDatasets, slugId, storeDataset } from '../data/dataset/storage';
import { loadWork, loadWorkState, saveWork, saveWorkState } from './store';
import { HomeSection, type Msg } from './sections/Home';
import { checkDataset, Issue } from './validate';
import { ClubsSection } from './sections/Clubs';
import { EuropeSection } from './sections/Europe';
import { CompetitionsSection } from './sections/Competitions';
import { FacilitiesSection, LeaguesSection, MarketingSection, StaffSection, TimelineSection } from './sections/Rules';
import { EconomySection, GeneralSection, HistorySection, NamesSection } from './sections/People';
import { CheckSection } from './sections/Check';
import { LegendsSection } from './sections/Legends';
import { PhotosSection } from './sections/Photos';
import { FormationsSection } from './sections/Formations';
import { WorldSection } from './sections/World';
import { PoolSection } from './sections/Pool';
import { GraphicsSection } from './sections/Graphics';
import { ChangesSection } from './sections/Changes';
import { SearchBox } from './SearchBox';
import { EditHistory } from './history';
import { locate, NavContext, Sec, SECTIONS, secOfArea, Target } from './nav';
import { CLUB_IDS_LIST } from './TableEditor';

/** Vorschlagsliste aller Vereins-IDs (Felder mit `ref: 'club'`, Ligalisten). */
const ClubIdList = memo(function ClubIdList({ sig, ids }: { sig: string; ids: [string, string][] }) {
  void sig;
  return <datalist id={CLUB_IDS_LIST}>{ids.map(([id, nm]) => <option key={id} value={id}>{nm}</option>)}</datalist>;
}, (a, b) => a.sig === b.sig);

function clubIds(ds: Dataset): [string, string][] {
  const m = new Map<string, string>();
  const c = ds.clubs;
  for (const x of [...c.tier1, ...c.secondNord, ...c.secondSued, ...c.ddrOberliga, ...c.ddrLiga]) m.set(x.id, x.name);
  for (const w of Object.values(ds.worldData ?? {})) for (const x of w.clubs) if (!m.has(x.id)) m.set(x.id, x.name);
  return [...m];
}

// =============================================================================
// DATENSATZ-EDITOR (eigenständige Seite unter /editor/)
// Arbeitskopie im Browser (automatisch gesichert, store.ts), Bibliothek der
// Datensätze auf der Startseite (sections/Home.tsx: Speichern/Laden/Export/
// Import/Im Spiel verwenden), Prüfen. „Ungespeichert“ = Arbeitskopie weicht von
// ihrem Stand in der Bibliothek ab (Zustand `dirty`, mit der Kopie gesichert).
// =============================================================================
const GROUPS = [...new Set(SECTIONS.map((x) => x.group))];

function freshFromBuiltin(id = 'mein-datensatz', name = 'Mein Datensatz'): Dataset {
  const d = builtinDataset();
  d.meta = { id, name, author: '', description: '', created: new Date().toISOString().slice(0, 10) };
  return d;
}

export default function EditorApp() {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [gen, setGen] = useState(0);
  const [, setVer] = useState(0);
  const [sec, setSec] = useState<Sec>('home');
  const [msg, setMsg] = useState<Msg>(null);
  const [saved, setSaved] = useState<'ok' | 'pending' | 'fail'>('ok');
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [dirty, setDirtyS] = useState(false);
  const [libVer, setLibVer] = useState(0);
  const [ver, setVerN] = useState(0);
  const [nav, setNav] = useState<{ target: Target | null; nonce: number }>({ target: null, nonce: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const dsRef = useRef<Dataset | null>(null);
  const hist = useRef<EditHistory | null>(null);
  const [, setHv] = useState(0);
  dsRef.current = ds;

  const dirtyRef = useRef(false);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);
  const setDirty = (v: boolean) => { if (dirtyRef.current !== v) { dirtyRef.current = v; void saveWorkState({ dirty: v }); } setDirtyS(v); };
  useEffect(() => {
    Promise.all([loadWork(), loadWorkState()]).then(([w, st]) => {
      const d = w ?? freshFromBuiltin(); dsRef.current = d; hist.current = new EditHistory(() => JSON.stringify(dsRef.current));
      dirtyRef.current = !!(w && st.dirty); setDirtyS(dirtyRef.current); setDs(d);
    });
  }, []);

  const persist = (d: Dataset) => {
    setSaved('pending');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveWork(d).then((ok) => setSaved(ok ? 'ok' : 'fail')), 600);
  };
  const onChange = () => {
    setVer((v) => v + 1); setVerN((v) => v + 1);
    setIssues(null);
    if (ds) persist(ds);
    setDirty(true);
    hist.current?.touch(() => setHv((v) => v + 1));
    setHv((v) => v + 1);
  };

  /** Arbeitskopie ersetzen (Laden/Neu/Speichern unter); `unsaved` = weicht von der Bibliothek ab. */
  const replace = (d: Dataset, text: string, unsaved = false) => {
    dsRef.current = d;
    setDs(d); setGen((g) => g + 1); setIssues(null); setNav((n) => ({ target: null, nonce: n.nonce + 1 })); setMsg({ kind: 'info', text });
    hist.current?.reset();
    setDirty(unsaved);
    saveWork(d).then((ok) => setSaved(ok ? 'ok' : 'fail'));
  };

  // Rückgängig/Wiederholen: Schnappschuss laden, Bereich neu aufbauen (Auswahl bleibt beim Bereich).
  const step = useCallback((dir: 'undo' | 'redo') => {
    const h = hist.current;
    if (!h) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    const json = dir === 'undo' ? h.undo() : h.redo();
    if (json == null) { setMsg({ kind: 'info', text: dir === 'undo' ? 'Nichts rückgängig zu machen.' : 'Nichts zu wiederholen.' }); return; }
    const d = JSON.parse(json) as Dataset;
    dsRef.current = d;
    setDs(d); setGen((g) => g + 1); setIssues(null); setVerN((v) => v + 1); setHv((v) => v + 1);
    setMsg({ kind: 'info', text: dir === 'undo' ? 'Letzte Änderung rückgängig gemacht.' : 'Änderung wiederhergestellt.' });
    setDirty(true);
    persist(d);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); void saveRef.current?.(); return; }
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); step('undo'); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); step('redo'); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step]);

  const goto = useCallback((s: Sec, t?: Target) => { setSec(s); setNav((n) => ({ target: t ?? null, nonce: n.nonce + 1 })); }, []);
  const pick = (s: Sec) => { setSec(s); setNav((n) => ({ target: null, nonce: n.nonce })); };
  // Nach einem Sprung den Eintrag suchen (Bereiche bauen Listen teils verzögert auf).
  useEffect(() => {
    const t = nav.target;
    if (!t) return;
    let tries = 0;
    const run = () => { if (!locate(contentRef.current, t) && ++tries < 6) h = window.setTimeout(run, 120); };
    let h = window.setTimeout(run, 60);
    return () => window.clearTimeout(h);
  }, [nav]);
  const runCheck = (): Issue[] => {
    const list = ds ? checkDataset(ds) : [];
    setIssues(list);
    return list;
  };
  const doExport = () => {
    if (!ds) return;
    const list = runCheck();
    downloadDataset(ds);
    const errs = list.filter((i) => i.level === 'error').length;
    setMsg(errs ? { kind: 'err', text: `Exportiert, aber mit ${errs} Fehler(n) – das Spiel lehnt die Datei evtl. ab.` } : { kind: 'ok', text: `Exportiert als ${datasetFileName(ds)} (alle Daten und Bilder in einer Datei).` });
  };
  /** Datensatz prüfen und in die Bibliothek speichern (gleiche ID = ersetzt). */
  const saveTo = async (d: Dataset): Promise<boolean> => {
    const list = checkDataset(d);
    const errs = list.filter((i) => i.level === 'error');
    if (errs.length) { setIssues(list); setSec('check'); setMsg({ kind: 'err', text: `Nicht gespeichert: ${errs.length} Fehler. Siehe „Prüfen“.` }); return false; }
    try {
      const copy = JSON.parse(JSON.stringify(d)) as Dataset;
      const res = await storeDataset(copy);
      if (res.length) { setMsg({ kind: 'err', text: res.join(' ') }); return false; }
      d.meta.updated = copy.meta.updated; d.meta.savedAt = copy.meta.savedAt;
      setLibVer((v) => v + 1);
      return true;
    } catch (e) { setMsg({ kind: 'err', text: `Speichern fehlgeschlagen: ${(e as Error).message}` }); return false; }
  };
  const doSave = async (): Promise<boolean> => {
    const d = dsRef.current;
    if (!d) return false;
    if (!(await saveTo(d))) return false;
    setDirty(false); persist(d);
    const act = activeDatasetChoice() === d.meta.id;
    setMsg({ kind: 'ok', text: `„${d.meta.name}“ gespeichert.${act ? ' Er ist im Spiel aktiv – neue Spiele starten mit diesem Stand.' : ' Unter „Datensätze“ kannst du ihn im Spiel verwenden.'}` });
    return true;
  };
  saveRef.current = doSave;
  const doSaveAs = async (name: string): Promise<boolean> => {
    const d = dsRef.current;
    if (!d) return false;
    const ids = (await loadAllDatasets()).map((x) => x.meta.id);
    const c = JSON.parse(JSON.stringify(d)) as Dataset;
    c.meta = { ...c.meta, id: freeDatasetId(slugId(name), ids), name, created: new Date().toISOString().slice(0, 10) };
    if (!(await saveTo(c))) return false;
    replace(c, `Als „${name}“ gespeichert (ID ${c.meta.id}).`);
    return true;
  };
  const doNew = async (name: string) => {
    const ids = (await loadAllDatasets()).map((x) => x.meta.id);
    const d = freshFromBuiltin(freeDatasetId(slugId(name), ids), name);
    if (await saveTo(d)) replace(d, `Neuer Datensatz „${name}“ auf Basis des Standards angelegt und gespeichert.`);
  };

  if (!ds) return <div className="ed-app ed-loading">Lade Editor …</div>;
  const cur = SECTIONS.find((s) => s.key === sec)!;
  const nErr = issues?.filter((i) => i.level === 'error').length ?? 0;
  const p = { ds, onChange };
  const ids = clubIds(ds);
  const navApi = { target: nav.target, goto };
  const body: Record<Sec, ReactNode> = {
    general: <GeneralSection {...p} />, clubs: <ClubsSection {...p} />, world: <WorldSection {...p} />, pool: <PoolSection {...p} />, graphics: <GraphicsSection {...p} />, europe: <EuropeSection {...p} />, competitions: <CompetitionsSection {...p} />,
    changes: <ChangesSection {...p} />, timeline: <TimelineSection {...p} />, leagues: <LeaguesSection {...p} />, facilities: <FacilitiesSection {...p} />,
    staff: <StaffSection {...p} />, marketing: <MarketingSection {...p} />, names: <NamesSection {...p} />, legends: <LegendsSection {...p} />, photos: <PhotosSection {...p} />, formations: <FormationsSection {...p} />,
    economy: <EconomySection {...p} />, history: <HistorySection {...p} />,
    home: <HomeSection ds={ds} dirty={dirty} libVer={libVer} onSave={doSave} onSaveAs={doSaveAs} onNew={doNew} onOpen={(d, t) => replace(d, t)}
      onExportWork={doExport} onMsg={setMsg} onWorkUnsaved={() => setDirty(true)}
      onWorkMeta={(name) => { ds.meta.name = name; setVerN((v) => v + 1); persist(ds); }} />,
    check: <CheckSection ds={ds} issues={issues} onCheck={runCheck} onExport={doExport} onStore={() => void doSave()}
      onJump={(i) => { const cc = i.area.startsWith('Weltdaten ') ? i.area.slice(10) : undefined; goto(secOfArea(i.area), { id: i.find, text: i.find, cc, year: i.year, tab: i.year != null ? 'seasons' : undefined }); }} />,
  };

  return (
    <div className="ed-app">
      <ClubIdList sig={`${ids.length}:${ids.map((x) => x[0]).join(',').length}:${gen}`} ids={ids} />
      <header className="ed-top">
        <div className="ed-brand"><span className="ed-logo">1975</span><span>Datensatz-Editor</span></div>
        <div className="ed-ds-name" title={ds.meta.description}>{ds.meta.name} <span className="ed-hint">{ds.meta.id}</span></div>
        {dirty && <span className="ed-state dirty" data-state="dirty" title="Die Arbeitskopie ist gesichert, aber noch nicht in der Bibliothek gespeichert.">Ungespeichert</span>}
        <div className="ed-quick">
          <SearchBox ds={ds} ver={ver} onGo={goto} />
          <button className="ed-btn" data-act="undo" disabled={!hist.current?.canUndo()} title="Rückgängig (Strg+Z)" onClick={() => step('undo')}>Rückgängig</button>
          <button className="ed-btn" data-act="redo" disabled={!hist.current?.canRedo()} title="Wiederholen (Strg+Umschalt+Z / Strg+Y)" onClick={() => step('redo')}>Wiederholen</button>
        </div>
        <div className="ed-tools">
          <button className="ed-btn" data-act="datasets" onClick={() => pick('home')}><Icon name="loadGame" /> Datensätze</button>
          <button className="ed-btn" onClick={() => { runCheck(); setSec('check'); }}><Icon name="whistle" /> Prüfen</button>
          <button className="ed-btn" data-act="export" onClick={doExport}><Icon name="contracts" /> Exportieren</button>
          <button className={`ed-btn ${dirty ? 'on' : ''}`} data-act="save" title="In die Bibliothek speichern (Strg+S)" onClick={() => void doSave()}><Icon name="save" /> Speichern</button>
        </div>
      </header>
      <div className="ed-body">
        <nav className="ed-nav">
          {GROUPS.map((grp) => (
            <div key={grp} className="ed-nav-group">
              <div className="ed-nav-cat">{grp}</div>
              {SECTIONS.filter((s) => s.group === grp).map((s) => (
                <button key={s.key} className={`ed-nav-item ${sec === s.key ? 'on' : ''}`} onClick={() => pick(s.key)} data-sec={s.key}>
                  <span>{s.label}</span>
                  {s.key === 'check' && issues && <span className={`ed-badge ${nErr ? 'bad' : 'good'}`}>{nErr || 'OK'}</span>}
                </button>
              ))}
            </div>
          ))}
          <div className="ed-nav-foot">
            <span className={`ed-dot ${saved}`} />
            {saved === 'ok' ? 'Arbeitskopie gesichert' : saved === 'pending' ? 'Sichert …' : 'Sichern nicht möglich'}
          </div>
        </nav>
        <main className="ed-main">
          <div className="ed-head">
            <h1>{cur.title}</h1>
            {msg && <div className={`ed-msg ${msg.kind}`} onClick={() => setMsg(null)}>{msg.text}</div>}
          </div>
          <NavContext.Provider value={navApi}>
            <div className="ed-content" ref={contentRef} key={`${sec}-${gen}-${nav.nonce}`}>{body[sec]}</div>
          </NavContext.Provider>
        </main>
      </div>
    </div>
  );
}

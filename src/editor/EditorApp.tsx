import { useEffect, useRef, useState, type ReactNode } from 'react';
import Icon, { type IconName } from '../components/Icon';
import { Dataset, DatasetSummary } from '../data/dataset/schema';
import { BUILTIN_ID, builtinDataset } from '../data/dataset/builtin';
import { downloadDataset, listDatasets, loadDataset, readDatasetFile, storeDataset } from '../data/dataset/storage';
import { loadWork, saveWork } from './store';
import { checkDataset, Issue } from './validate';
import { ClubsSection } from './sections/Clubs';
import { EuropeSection } from './sections/Europe';
import { FacilitiesSection, LeaguesSection, MarketingSection, StaffSection, TimelineSection } from './sections/Rules';
import { EconomySection, GeneralSection, HistorySection, LegendsSection, NamesSection } from './sections/People';
import { CheckSection } from './sections/Check';

// =============================================================================
// DATENSATZ-EDITOR (eigenständige Seite unter /editor/)
// Arbeitskopie im Browser, Prüfen, Export als Datei, Übernahme ins Spiel.
// =============================================================================
type Sec = 'general' | 'clubs' | 'europe' | 'timeline' | 'leagues' | 'facilities' | 'staff' | 'marketing' | 'names' | 'legends' | 'economy' | 'history' | 'check';

const SECTIONS: { key: Sec; label: string; icon: IconName; title: string }[] = [
  { key: 'general', label: 'Allgemein', icon: 'settings', title: 'Allgemein' },
  { key: 'clubs', label: 'Vereine', icon: 'dashVerein', title: 'Vereine, Wappen & Trikots' },
  { key: 'europe', label: 'Europa', icon: 'international', title: 'Europa & Europapokal' },
  { key: 'timeline', label: 'Chronik', icon: 'chronicle', title: 'Chronik & Regeländerungen' },
  { key: 'leagues', label: 'Ligen', icon: 'dashTabelle', title: 'Ligasystem & Reformen' },
  { key: 'facilities', label: 'Einrichtungen', icon: 'facilities', title: 'Einrichtungen' },
  { key: 'staff', label: 'Mitarbeiter', icon: 'staff', title: 'Mitarbeiter-Rollen' },
  { key: 'marketing', label: 'Marketing', icon: 'marketing', title: 'Marketing-Kanäle' },
  { key: 'names', label: 'Namen', icon: 'squad', title: 'Namen & Herkünfte' },
  { key: 'legends', label: 'Legenden', icon: 'trophy', title: 'Legenden' },
  { key: 'economy', label: 'Wirtschaft', icon: 'finances', title: 'Wirtschaft' },
  { key: 'history', label: 'Geschichte', icon: 'kalender', title: 'Besondere Zeitabschnitte' },
  { key: 'check', label: 'Prüfen', icon: 'whistle', title: 'Prüfen & Übernehmen' },
];

function freshFromBuiltin(): Dataset {
  const d = builtinDataset();
  d.meta = { id: 'mein-datensatz', name: 'Mein Datensatz', author: '', description: '', created: new Date().toISOString().slice(0, 10) };
  return d;
}

type Msg = { kind: 'ok' | 'err' | 'info'; text: string } | null;

export default function EditorApp() {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [gen, setGen] = useState(0);
  const [, setVer] = useState(0);
  const [sec, setSec] = useState<Sec>('general');
  const [msg, setMsg] = useState<Msg>(null);
  const [saved, setSaved] = useState<'ok' | 'pending' | 'fail'>('ok');
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [stored, setStored] = useState<DatasetSummary[]>([]);
  const [confirm, setConfirm] = useState<{ text: string; run: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadWork().then((w) => setDs(w ?? freshFromBuiltin()));
    listDatasets().then(setStored).catch(() => setStored([]));
  }, []);

  const onChange = () => {
    setVer((v) => v + 1);
    setIssues(null);
    setSaved('pending');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { if (ds) saveWork(ds).then((ok) => setSaved(ok ? 'ok' : 'fail')); }, 600);
  };

  const replace = (d: Dataset, text: string) => {
    setDs(d); setGen((g) => g + 1); setIssues(null); setSec('general'); setMsg({ kind: 'info', text });
    saveWork(d).then((ok) => setSaved(ok ? 'ok' : 'fail'));
  };
  const ask = (text: string, run: () => void) => setConfirm({ text, run });

  const openFile = async (f?: File) => {
    if (!f) return;
    const r = await readDatasetFile(f);
    if (!r.data) { setMsg({ kind: 'err', text: `Datei nicht geladen: ${r.errors.join(' ')}` }); return; }
    replace(r.data, `„${r.data.meta.name}“ aus Datei geöffnet.`);
  };
  const openStored = async (id: string) => {
    const d = await loadDataset(id);
    if (!d) { setMsg({ kind: 'err', text: 'Datensatz nicht gefunden.' }); return; }
    if (id === BUILTIN_ID) { replace(freshFromBuiltin(), 'Neuer Datensatz auf Basis des Standards angelegt.'); return; }
    replace(d, `„${d.meta.name}“ aus dem Spiel geöffnet.`);
  };

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
    setMsg(errs ? { kind: 'err', text: `Exportiert, aber mit ${errs} Fehler(n) – das Spiel lehnt die Datei evtl. ab.` } : { kind: 'ok', text: `Exportiert als ${ds.meta.id}.fm1975.json` });
  };
  const doStore = async () => {
    if (!ds) return;
    const list = runCheck();
    const errs = list.filter((i) => i.level === 'error');
    if (errs.length) { setSec('check'); setMsg({ kind: 'err', text: `Nicht übernommen: ${errs.length} Fehler. Siehe „Prüfen“.` }); return; }
    try {
      const res = await storeDataset(JSON.parse(JSON.stringify(ds)));
      if (res.length) { setMsg({ kind: 'err', text: res.join(' ') }); return; }
      setMsg({ kind: 'ok', text: `„${ds.meta.name}“ ist im Spiel unter „Datensätze“ verfügbar (neues Spiel starten).` });
      listDatasets().then(setStored).catch(() => undefined);
    } catch (e) { setMsg({ kind: 'err', text: `Speichern fehlgeschlagen: ${(e as Error).message}` }); }
  };

  if (!ds) return <div className="ed-app ed-loading">Lade Editor …</div>;
  const cur = SECTIONS.find((s) => s.key === sec)!;
  const nErr = issues?.filter((i) => i.level === 'error').length ?? 0;
  const p = { ds, onChange };
  const body: Record<Sec, ReactNode> = {
    general: <GeneralSection {...p} />, clubs: <ClubsSection {...p} />, europe: <EuropeSection {...p} />,
    timeline: <TimelineSection {...p} />, leagues: <LeaguesSection {...p} />, facilities: <FacilitiesSection {...p} />,
    staff: <StaffSection {...p} />, marketing: <MarketingSection {...p} />, names: <NamesSection {...p} />,
    legends: <LegendsSection {...p} />, economy: <EconomySection {...p} />, history: <HistorySection {...p} />,
    check: <CheckSection ds={ds} issues={issues} onCheck={runCheck} onExport={doExport} onStore={doStore} />,
  };

  return (
    <div className="ed-app">
      <header className="ed-top">
        <div className="ed-brand"><span className="ed-logo">1975</span><span>Datensatz-Editor</span></div>
        <div className="ed-ds-name" title={ds.meta.description}>{ds.meta.name} <span className="ed-hint">{ds.meta.id}</span></div>
        <div className="ed-tools">
          <button className="ed-btn" onClick={() => ask('Neuen Datensatz auf Basis des Standards anlegen? Die Arbeitskopie wird ersetzt.', () => replace(freshFromBuiltin(), 'Neuer Datensatz auf Basis des Standards angelegt.'))}><Icon name="newGame" /> Neu</button>
          <button className="ed-btn" onClick={() => fileRef.current?.click()}><Icon name="loadGame" /> Datei öffnen</button>
          <select className="ed-in ed-open" value="" onChange={(e) => { const id = e.target.value; if (id) ask('Diesen Datensatz öffnen? Die Arbeitskopie wird ersetzt.', () => openStored(id)); }}>
            <option value="">Aus dem Spiel öffnen …</option>
            {stored.map((s) => <option key={s.id} value={s.id}>{s.builtin ? 'Standard (Vorlage)' : s.name}</option>)}
          </select>
          <button className="ed-btn" onClick={() => { runCheck(); setSec('check'); }}><Icon name="whistle" /> Prüfen</button>
          <button className="ed-btn" onClick={doExport}><Icon name="save" /> Exportieren</button>
          <button className="ed-btn on" onClick={doStore}><Icon name="play" /> Ins Spiel übernehmen</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; ask('Datei öffnen? Die Arbeitskopie wird ersetzt.', () => openFile(f)); }} />
        </div>
      </header>
      {confirm && (
        <div className="ed-confirm">
          <span>{confirm.text}</span>
          <button className="ed-btn on" onClick={() => { const c = confirm; setConfirm(null); c.run(); }}>Ja</button>
          <button className="ed-btn" onClick={() => setConfirm(null)}>Abbrechen</button>
        </div>
      )}
      <div className="ed-body">
        <nav className="ed-nav">
          {SECTIONS.map((s) => (
            <button key={s.key} className={`ed-nav-item ${sec === s.key ? 'on' : ''}`} onClick={() => setSec(s.key)} data-sec={s.key}>
              <Icon name={s.icon} size={18} /><span>{s.label}</span>
              {s.key === 'check' && issues && <span className={`ed-badge ${nErr ? 'bad' : 'good'}`}>{nErr || 'OK'}</span>}
            </button>
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
          <div className="ed-content" key={`${sec}-${gen}`}>{body[sec]}</div>
        </main>
      </div>
    </div>
  );
}

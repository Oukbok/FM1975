import { useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from '../components/Icon';
import { Dataset, DatasetSummary } from '../data/dataset/schema';
import { BUILTIN_ID, builtinDataset } from '../data/dataset/builtin';
import { downloadDataset, listDatasets, loadDataset, readDatasetFile, storeDataset } from '../data/dataset/storage';
import { loadWork, saveWork } from './store';
import { checkDataset, Issue } from './validate';
import { ClubsSection } from './sections/Clubs';
import { EuropeSection } from './sections/Europe';
import { FacilitiesSection, LeaguesSection, MarketingSection, StaffSection, TimelineSection } from './sections/Rules';
import { EconomySection, GeneralSection, HistorySection, NamesSection } from './sections/People';
import { CheckSection } from './sections/Check';
import { LegendsSection } from './sections/Legends';
import { WorldSection } from './sections/World';
import { PoolSection } from './sections/Pool';
import { GraphicsSection } from './sections/Graphics';

// =============================================================================
// DATENSATZ-EDITOR (eigenständige Seite unter /editor/)
// Arbeitskopie im Browser, Prüfen, Export als Datei, Übernahme ins Spiel.
// =============================================================================
type Sec = 'general' | 'graphics' | 'clubs' | 'world' | 'pool' | 'europe' | 'timeline' | 'leagues' | 'facilities' | 'staff' | 'marketing' | 'names' | 'legends' | 'economy' | 'history' | 'check';

// Menü nach Kategorien, ohne Symbole (Wunsch Pascal).
const SECTIONS: { key: Sec; label: string; group: string; title: string }[] = [
  { key: 'general', label: 'Allgemein', group: 'Datensatz', title: 'Allgemein' },
  { key: 'graphics', label: 'Grafikpakete', group: 'Datensatz', title: 'Grafikpakete: Wappen importieren & Vereins-IDs exportieren' },
  { key: 'check', label: 'Prüfen & Übernehmen', group: 'Datensatz', title: 'Prüfen & Übernehmen' },
  { key: 'clubs', label: 'Vereine', group: 'Vereine & Wettbewerbe', title: 'Vereine nach Land und Liga: Daten, Wappen & Trikots' },
  { key: 'world', label: 'Ligen je Saison', group: 'Vereine & Wettbewerbe', title: 'Weltdaten: Länder, Ligazusammensetzung je Saison' },
  { key: 'pool', label: 'Amateur-Pool', group: 'Vereine & Wettbewerbe', title: 'Amateur-Pool: Nachrücker für Auf- und Abstieg' },
  { key: 'leagues', label: 'Ligasystem & Reformen', group: 'Vereine & Wettbewerbe', title: 'Ligasystem & Reformen' },
  { key: 'europe', label: 'Europa & Europapokal', group: 'Vereine & Wettbewerbe', title: 'Europa & Europapokal' },
  { key: 'names', label: 'Namen & Herkünfte', group: 'Spieler & Personal', title: 'Namen, Herkünfte & Ethnie' },
  { key: 'legends', label: 'Ausnahmetalente', group: 'Spieler & Personal', title: 'Ausnahmetalente der Fußballgeschichte' },
  { key: 'staff', label: 'Mitarbeiter', group: 'Spieler & Personal', title: 'Mitarbeiter-Rollen' },
  { key: 'economy', label: 'Wirtschaft', group: 'Verein & Wirtschaft', title: 'Wirtschaft' },
  { key: 'facilities', label: 'Einrichtungen', group: 'Verein & Wirtschaft', title: 'Einrichtungen' },
  { key: 'marketing', label: 'Marketing', group: 'Verein & Wirtschaft', title: 'Marketing-Kanäle' },
  { key: 'timeline', label: 'Chronik & Regeln', group: 'Geschichte', title: 'Chronik & Regeländerungen' },
  { key: 'history', label: 'Zeitabschnitte', group: 'Geschichte', title: 'Besondere Zeitabschnitte' },
];
const GROUPS = [...new Set(SECTIONS.map((x) => x.group))];

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
    general: <GeneralSection {...p} />, clubs: <ClubsSection {...p} />, world: <WorldSection {...p} />, pool: <PoolSection {...p} />, graphics: <GraphicsSection {...p} />, europe: <EuropeSection {...p} />,
    timeline: <TimelineSection {...p} />, leagues: <LeaguesSection {...p} />, facilities: <FacilitiesSection {...p} />,
    staff: <StaffSection {...p} />, marketing: <MarketingSection {...p} />, names: <NamesSection {...p} />, legends: <LegendsSection {...p} />,
    economy: <EconomySection {...p} />, history: <HistorySection {...p} />,
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
          {GROUPS.map((grp) => (
            <div key={grp} className="ed-nav-group">
              <div className="ed-nav-cat">{grp}</div>
              {SECTIONS.filter((s) => s.group === grp).map((s) => (
                <button key={s.key} className={`ed-nav-item ${sec === s.key ? 'on' : ''}`} onClick={() => setSec(s.key)} data-sec={s.key}>
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
          <div className="ed-content" key={`${sec}-${gen}`}>{body[sec]}</div>
        </main>
      </div>
    </div>
  );
}

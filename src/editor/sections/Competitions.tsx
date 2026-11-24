// =============================================================================
// EDITOR › WETTBEWERBE (Wunsch Pascal: „Im Editor muss jeder Wettbewerb editierbar
// sein … Am besten stellst du dafür Perioden ein (die auch editierbar sein müssen),
// in welchen das Reglement mehr oder weniger gleich ist durch die man dann wechseln kann.“)
// Links alle Wettbewerbe nach Gruppen, rechts die Zeitleiste der Perioden und das
// Formular der gewählten Periode. Daten: Datensatz-Feld `competitions`
// (data/competitions/overrides.ts), Standard aus data/competitions/registry.ts.
// =============================================================================
import { useMemo, useState } from 'react';
import type { CompPeriod } from '../../data/competitions/overrides';
import { COMP_GROUPS, competitionDefs, mergedValues, type CompDef } from '../../data/competitions/registry';
import type { Dataset } from '../../data/dataset/schema';
import { useNavTarget } from '../nav';
import { Explain } from '../TableEditor';
import { PeriodForm } from './competitions/PeriodForm';
import { PeriodTimeline } from './competitions/PeriodTimeline';
import { hasValues, isOwn, mergeNext, moveEnd, moveStart, periodProblems, periodsOf, resetCompetition, setValue, splitAt } from './competitions/model';

type P = { ds: Dataset; onChange: () => void };
/** Vorauswahl: Periode der ersten spielbaren Saison. */
const START = 1975;

export function CompetitionsSection({ ds, onChange }: P) {
  const target = useNavTarget();
  const defs = competitionDefs();
  const [id, setId] = useState<string>(() => (target?.id && defs.some((d) => d.id === target.id) ? target.id : 'ec'));
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => -(target?.year ?? START));
  const [err, setErr] = useState<string | null>(null);
  const def = defs.find((d) => d.id === id) ?? defs[0];
  const periods = periodsOf(ds, def);
  // Sprung mit Saison (Prüfen/Änderungen): Periode der Saison wählen.
  const idx = sel < 0 ? Math.max(0, periods.findIndex((p) => -sel >= p.from && -sel <= p.to)) : Math.min(sel, periods.length - 1);
  const p = periods[idx];

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return defs.filter((d) => !s || `${d.label} ${d.sub ?? ''} ${d.id} ${(ds.competitions?.[d.id] ?? []).map((x) => x.name ?? '').join(' ')}`.toLowerCase().includes(s));
  }, [q, defs, ds.competitions]);

  const vals = periods.map((x) => mergedValues(def, x.from, x));
  const pick = (d: CompDef) => { setId(d.id); setSel(-START); setErr(null); };
  const done = (ok: boolean, msg: string) => { setErr(ok ? null : msg); if (ok) onChange(); };
  const set = <K extends keyof CompPeriod>(k: K, v: CompPeriod[K] | undefined) => { setValue(ds, def, idx, k, v); onChange(); };
  const own = isOwn(ds, def);
  const problems = own ? periodProblems(periods) : [];
  const changed = periods.filter(hasValues).length;

  return (
    <div className="ed-section">
      <Explain>Jeder Wettbewerb läuft in <b>Perioden</b>, in denen das Reglement gleich bleibt. Die Standard-Perioden entstehen aus den eingebauten Daten (Namen, Formate, Startplätze, Supercup-Epochen). Wähle links einen Wettbewerb, schalte rechts mit den Pfeilen oder auf der Zeitleiste durch die Perioden, <b>teile</b> sie, <b>lege sie zusammen</b> oder verschiebe ihre Grenzen. Leere Felder bedeuten „wie im Standard“. Was die Engine wirklich liest, ist mit <span className="ed-badge good">wirksam</span> markiert; alles mit <span className="ed-badge">nur Anzeige</span> steht fest im Spiel. Änderungen gelten für neue Spiele und beim Laden eines Spielstands mit diesem Datensatz (bereits ausgeloste Runden behalten ihr Format).</Explain>
      <div className="ed-comp">
        <aside className="ed-comp-list">
          <input className="ed-in" placeholder="Wettbewerb suchen …" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="ed-comp-scroll">
            {COMP_GROUPS.map((g) => {
              const list = shown.filter((d) => d.group === g);
              if (!list.length) return null;
              return (
                <div key={g} className="ed-comp-group">
                  <div className="ed-nav-cat">{g}</div>
                  {list.map((d) => {
                    const mine = ds.competitions?.[d.id];
                    return (
                      <button key={d.id} data-rowid={d.id} className={`ed-comp-item ${d.id === def.id ? 'sel' : ''}`} onClick={() => pick(d)}>
                        <span className="ed-comp-item-name">{d.label}</span>
                        {d.sub && <span className="ed-hint">{d.sub}</span>}
                        {mine && <span className="ed-badge good" title="Im Datensatz geändert">{mine.filter(hasValues).length || '±'}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>
        <section className="ed-comp-main" data-comp={def.id}>
          <div className="ed-comp-title">
            <div>
              <div className="ed-side-title">{def.label}{def.sub ? ` · ${def.sub}` : ''}</div>
              <span className="ed-hint">Schlüssel <code>{def.id}</code> · {periods.length} Perioden{changed ? ` · ${changed} geändert` : ''}{own ? '' : ' · Standard'}</span>
            </div>
            {own && <button className="ed-btn" data-act="comp-reset" onClick={() => { resetCompetition(ds, def); setSel(-START); onChange(); }}>Alles zurücksetzen</button>}
          </div>
          <PeriodTimeline periods={periods} names={vals.map((v) => v.name)} held={vals.map((v) => v.held)} sel={idx}
            onSel={(i) => { setSel(i); setErr(null); }}
            onSplit={(y) => { const n = splitAt(ds, def, idx, y); if (n != null) setSel(n); done(n != null, `Teilen ab ${y} geht nicht – das Jahr muss innerhalb der Periode liegen (nach ihrem Beginn).`); }}
            onMerge={() => done(mergeNext(ds, def, idx), 'Keine nächste Periode.')}
            onStart={(y) => done(moveStart(ds, def, idx, y), `Beginn ${y} geht nicht – er muss nach dem Beginn der vorigen und vor dem Ende dieser Periode liegen.`)}
            onEnd={(y) => done(moveEnd(ds, def, idx, y), `Ende ${y} geht nicht – es muss vor dem Ende der nächsten Periode liegen.`)} />
          {err && <div className="ed-err">{err}</div>}
          {problems.map((t) => <div key={t} className="ed-err">Perioden: {t}</div>)}
          {p && <PeriodForm key={`${def.id}-${idx}-${p.from}-${p.to}-${own ? 1 : 0}`} ds={ds} def={def} p={p} onSet={set} />}
        </section>
      </div>
    </div>
  );
}

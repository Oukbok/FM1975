// =============================================================================
// AUFSTELLUNGEN JE EPOCHE (Wunsch Pascal, Datensatz-Feld `formationEras`).
// Zwei Ansichten auf dieselben Daten: „Je Aufstellung“ (Zeitrahmen je System) und
// „Je Epoche“ (Systeme je Jahrzehnt). Ein Häkchen in der einen Ansicht ist sofort
// auch in der anderen gesetzt. Wirkung im Spiel: „Typisch für …“ in der Aufstellung,
// Wahl der KI-Trainer (engine/aiManager.ts chooseFormation).
// =============================================================================
import { useState } from 'react';
import type { Dataset } from '../../data/dataset/schema';
import { BUILTIN_FORMATION_ERAS, decadeLabel, FORMATION_DECADES, FORMATIONS, LIBERO_END } from '../../data/formations';
import { Explain } from '../TableEditor';

type P = { ds: Dataset; onChange: () => void };

function erasOf(ds: Dataset): Record<string, number[]> {
  if (!ds.formationEras || typeof ds.formationEras !== 'object') ds.formationEras = JSON.parse(JSON.stringify(BUILTIN_FORMATION_ERAS));
  const m = ds.formationEras!;
  for (const f of FORMATIONS) if (!Array.isArray(m[f.id])) m[f.id] = [...(BUILTIN_FORMATION_ERAS[f.id] ?? [])];
  return m;
}

export function FormationsSection({ ds, onChange }: P) {
  const [tab, setTab] = useState<'form' | 'era'>('form');
  const m = erasOf(ds);
  const has = (id: string, d: number) => m[id].includes(d);
  const toggle = (id: string, d: number) => {
    m[id] = has(id, d) ? m[id].filter((x) => x !== d) : [...m[id], d].sort((a, b) => a - b);
    onChange();
  };
  const reset = () => { ds.formationEras = JSON.parse(JSON.stringify(BUILTIN_FORMATION_ERAS)); onChange(); };
  return (
    <div className="ed-section">
      <Explain>Welche Aufstellungen in welcher Zeit typisch sind. Im Spiel stehen sie in der Aufstellung unter <b>Typisch für …</b> ganz oben, und die KI-Trainer wählen sie bevorzugt. Beide Ansichten bearbeiten dieselbe Zuordnung. Libero-Systeme verwendet ab {LIBERO_END} kein Trainer mehr – egal, was hier steht.</Explain>
      <div className="ed-tabs">
        <button className={`ed-tab ${tab === 'form' ? 'on' : ''}`} onClick={() => setTab('form')}>Je Aufstellung</button>
        <button className={`ed-tab ${tab === 'era' ? 'on' : ''}`} onClick={() => setTab('era')}>Je Epoche</button>
        <button className="ed-tab" onClick={reset} title="Eingebaute Zuordnung wiederherstellen">Standard wiederherstellen</button>
      </div>
      {tab === 'form' ? (
        <div className="ed-table-scroll">
          <table className="ed-table ed-form-eras">
            <thead><tr><th>Aufstellung</th>{FORMATION_DECADES.map((d) => <th key={d}>{decadeLabel(d)}</th>)}</tr></thead>
            <tbody>
              {FORMATIONS.map((f) => (
                <tr key={f.id} data-rowid={f.id}>
                  <td><b>{f.label}</b>{f.libero ? <span className="ed-dim"> · Libero</span> : null}<div className="ed-dim">{f.desc}</div></td>
                  {FORMATION_DECADES.map((d) => (
                    <td key={d} className="ed-c"><input type="checkbox" aria-label={`${f.label} ${decadeLabel(d)}`} checked={has(f.id, d)} onChange={() => toggle(f.id, d)} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ed-era-grid">
          {FORMATION_DECADES.map((d) => (
            <section key={d} className="ed-era-col">
              <div className="ed-sec">{decadeLabel(d)} <span className="ed-dim">· {FORMATIONS.filter((f) => has(f.id, d)).length} typisch</span></div>
              {FORMATIONS.map((f) => (
                <label key={f.id} className={`ed-check ed-era-row ${has(f.id, d) ? 'on' : ''}`}>
                  <input type="checkbox" checked={has(f.id, d)} onChange={() => toggle(f.id, d)} />
                  {f.label}{f.libero && d >= LIBERO_END ? <span className="ed-dim"> (ab {LIBERO_END} ungenutzt)</span> : null}
                </label>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

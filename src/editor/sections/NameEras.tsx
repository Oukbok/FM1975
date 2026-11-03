import { useState } from 'react';
import { Dataset } from '../../data/dataset/schema';
import { Explain } from '../TableEditor';

// =============================================================================
// Namen › Vornamen je Jahrgang: je Herkunft Stufen „ab Geburtsjahr: Namen“.
// =============================================================================
type P = { ds: Dataset; onChange: () => void };

const fmt = (eras: [number, string[]][] | undefined) =>
  (eras ?? []).map(([y, n]) => `${y}: ${n.join(', ')}`).join('\n');

function parse(text: string): [number, string[]][] {
  const out: [number, string[]][] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(\d{1,4})\s*:\s*(.*)$/);
    if (!m) continue;
    const names = m[2].split(',').map((x) => x.trim()).filter(Boolean);
    if (names.length) out.push([Number(m[1]), names]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

export function NameErasEditor({ ds, onChange }: P) {
  const origins = ds.names.origins;
  const [id, setId] = useState(origins[0]?.id ?? '');
  const o = origins.find((x) => x.id === id);
  return (
    <>
      <Explain>Vornamen ändern sich mit der Zeit: Ein 1975 aufgestellter Kader besteht aus Jahrgängen der 1940er/50er (Klaus, Horst), die Jugend von 2025 aus Jahrgängen um 2008 (Ben, Finn). Je Herkunft eine Zeile pro Stufe: <code>abGeburtsjahr: Name, Name, …</code> – die erste Stufe gilt auch für alle älteren Jahrgänge (<code>0:</code>). Leer = für diese Herkunft gilt nur die normale Vornamen-Liste.</Explain>
      <div className="ed-row">
        <select className="ed-in" value={id} onChange={(e) => setId(e.target.value)}>
          {origins.map((x) => <option key={x.id} value={x.id}>{x.id} ({x.nationality}){x.firstByEra?.length ? ` · ${x.firstByEra.length} Stufen` : ''}</option>)}
        </select>
      </div>
      {o && <textarea key={o.id} className="ed-in ed-code" rows={18} defaultValue={fmt(o.firstByEra)}
        placeholder={'0: Klaus, Horst, Manfred\n1970: Christian, Sven, Oliver\n2000: Leon, Finn, Luca'}
        onBlur={(e) => { o.firstByEra = parse(e.target.value); onChange(); }} />}
    </>
  );
}

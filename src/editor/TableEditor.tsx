// =============================================================================
// Generische Tabelle für Datensatz-Listen: Zellen je Spaltenbeschreibung,
// Zeilen hinzufügen/löschen/verschieben, Suchfilter, Auswahl einer Zeile.
// Die Zeilen werden IN PLACE geändert; `onChange` meldet jede Änderung.
// =============================================================================
import { useMemo, useState, type ReactNode } from 'react';
import Icon from '../components/Icon';

export type ColType = 'text' | 'number' | 'color' | 'select' | 'bool' | 'list' | 'longtext';

export interface Col {
  /** Pfad im Objekt, z. B. "name" oder "colors.primary" oder "effect.unlock". */
  key: string;
  label: string;
  type?: ColType;
  options?: { value: string; label: string }[];
  width?: number;
  hint?: string;
  /** Leeres Feld als `undefined` speichern (optionale Felder). */
  optional?: boolean;
  step?: number;
}

export function getPath(o: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), o);
}

export function setPath(o: Record<string, unknown>, path: string, v: unknown): void {
  const keys = path.split('.');
  let cur: Record<string, unknown> = o;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (v === undefined) delete cur[last]; else cur[last] = v;
}

export function Cell({ row, col, onChange }: { row: Record<string, unknown>; col: Col; onChange: () => void }) {
  const v = getPath(row, col.key);
  const set = (nv: unknown) => { setPath(row, col.key, nv); onChange(); };
  const t = col.type ?? 'text';
  if (t === 'bool') return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked || undefined)} />;
  if (t === 'color') {
    return (
      <span className="ed-color">
        <input type="color" value={typeof v === 'string' && v.startsWith('#') && v.length === 7 ? v : '#000000'} onChange={(e) => set(e.target.value.toUpperCase())} />
        <input className="ed-in" value={(v as string) ?? ''} onChange={(e) => set(e.target.value)} />
      </span>
    );
  }
  if (t === 'select') {
    return (
      <select className="ed-in" value={v == null ? '' : String(v)} onChange={(e) => set(e.target.value === '' && col.optional ? undefined : e.target.value)}>
        {col.optional && <option value="">–</option>}
        {col.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (t === 'number') {
    return (
      <input className="ed-in num" type="number" step={col.step ?? 'any'} value={v == null ? '' : String(v)}
        onChange={(e) => set(e.target.value === '' ? (col.optional ? undefined : 0) : Number(e.target.value))} />
    );
  }
  if (t === 'list') {
    const joined = (Array.isArray(v) ? (v as string[]) : []).join(', ');
    // Erst beim Verlassen übernehmen, sonst verschluckt das Filtern Kommas beim Tippen.
    return <textarea key={joined} className="ed-in ed-list" defaultValue={joined}
      onBlur={(e) => { if (e.target.value !== joined) set(e.target.value.split(',').map((x) => x.trim()).filter(Boolean)); }} />;
  }
  if (t === 'longtext') return <textarea className="ed-in ed-long" value={(v as string) ?? ''} onChange={(e) => set(e.target.value)} />;
  return <input className="ed-in" value={v == null ? '' : String(v)} onChange={(e) => set(e.target.value === '' && col.optional ? undefined : e.target.value)} />;
}

export function TableEditor<T extends object>({
  rows, cols, onChange, makeRow, selected, onSelect, searchKeys = ['id', 'name'], title,
}: {
  rows: T[];
  cols: Col[];
  onChange: () => void;
  makeRow?: () => T;
  selected?: number | null;
  onSelect?: (i: number) => void;
  searchKeys?: string[];
  title?: string;
}) {
  const [q, setQ] = useState('');
  const idx = useMemo(() => rows.map((_, i) => i).filter((i) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return searchKeys.some((k) => String(getPath(rows[i], k) ?? '').toLowerCase().includes(s));
  }), [rows, q, searchKeys, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    onChange();
  };
  const del = (i: number) => { rows.splice(i, 1); onChange(); };
  const add = () => { if (makeRow) { rows.push(makeRow()); onChange(); onSelect?.(rows.length - 1); } };

  return (
    <div className="ed-table-wrap">
      <div className="ed-table-bar">
        {title && <b>{title}</b>}
        <span className="ed-count">{rows.length} Einträge</span>
        <input className="ed-in ed-search" placeholder="Suchen …" value={q} onChange={(e) => setQ(e.target.value)} />
        {makeRow && <button className="ed-btn on" onClick={add}><Icon name="newGame" /> Hinzufügen</button>}
      </div>
      <div className="ed-table-scroll">
        <table className="ed-table">
          <thead>
            <tr>
              <th style={{ width: 70 }} />
              {cols.map((c) => <th key={c.key} style={{ minWidth: c.width ?? 110 }} title={c.hint}>{c.label}</th>)}
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {idx.map((i) => (
              <tr key={i} className={selected === i ? 'sel' : ''} onClick={() => onSelect?.(i)}>
                <td className="ed-ctrl">
                  <button className="ed-mini" title="Nach oben" onClick={(e) => { e.stopPropagation(); move(i, -1); }}>▲</button>
                  <button className="ed-mini" title="Nach unten" onClick={(e) => { e.stopPropagation(); move(i, 1); }}>▼</button>
                </td>
                {cols.map((c) => <td key={c.key}><Cell row={rows[i] as Record<string, unknown>} col={c} onChange={onChange} /></td>)}
                <td><button className="ed-mini danger" title="Löschen" onClick={(e) => { e.stopPropagation(); del(i); }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Formular für ein einzelnes Objekt (Feld je Zeile). */
export function FieldForm({ obj, cols, onChange }: { obj: Record<string, unknown>; cols: Col[]; onChange: () => void }) {
  return (
    <div className="ed-form">
      {cols.map((c) => (
        <label key={c.key} className="ed-field">
          <span className="ed-label">{c.label}</span>
          <Cell row={obj} col={c} onChange={onChange} />
          {c.hint && <span className="ed-hint">{c.hint}</span>}
        </label>
      ))}
    </div>
  );
}

/** Erklärtext-Kasten oben in einem Bereich. */
export function Explain({ children }: { children: ReactNode }) {
  return <div className="ed-explain">{children}</div>;
}

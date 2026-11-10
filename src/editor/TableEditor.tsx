// =============================================================================
// Generische Tabelle für Datensatz-Listen: Zellen je Spaltenbeschreibung,
// Zeilen hinzufügen/löschen/verschieben, Suchfilter, Auswahl einer Zeile.
// Sortieren (Wunsch Pascal): Klick auf einen Spaltenkopf sortiert aufsteigend,
// noch einmal absteigend, ein dritter Klick zeigt wieder die gespeicherte
// Reihenfolge. Sortieren ändert nur die Anzeige, nicht die Daten.
// Die Zeilen werden IN PLACE geändert; `onChange` meldet jede Änderung.
// QoL (Wunsch Pascal): Zeilen markieren (Häkchen, Umschalt = Bereich) und
// gemeinsam ändern/duplizieren/löschen, einzelne Zeile duplizieren, CSV-Export
// und -Import je Tabelle, Vereins-IDs mit Vorschlagsliste (`ref: 'club'`).
// Jede Zeile trägt `data-rowid` (Sprungziel von Suche/Änderungen/Prüfen).
// =============================================================================
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Icon from '../components/Icon';
import { rowKey } from './nav';
import { applyCsv, downloadText, fromCell, toCsv } from './csv';

/** Datalist mit allen Vereins-IDs (gerendert in EditorApp). */
export const CLUB_IDS_LIST = 'ed-club-ids';

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
  /** Feld enthält eine Vereins-ID: Vorschlagsliste beim Tippen, unbekannte IDs rot. */
  ref?: 'club';
}

export type SortState = { key: string; dir: 1 | -1 } | null;

/** Vergleich für die Sortierung: Zahlen numerisch, Listen nach Länge, sonst Text (deutsch). */
export function compareValues(a: unknown, b: unknown): number {
  const norm = (v: unknown) => Array.isArray(v) ? v.length : typeof v === 'boolean' ? Number(v) : v;
  const x = norm(a), y = norm(b);
  if (x == null || x === '') return y == null || y === '' ? 0 : 1;
  if (y == null || y === '') return -1;
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  return String(x).localeCompare(String(y), 'de', { numeric: true, sensitivity: 'base' });
}

/** Sortier-Zustand für eigene Tabellen: `sorted(indices, get)` + `head(key, label)`. */
export function useSort() {
  const [sort, setSort] = useState<SortState>(null);
  const toggle = (key: string) => setSort((s) => !s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null);
  const sorted = <X,>(items: X[], get: (x: X, key: string) => unknown): X[] => {
    if (!sort) return items;
    return [...items].sort((a, b) => compareValues(get(a, sort.key), get(b, sort.key)) * sort.dir);
  };
  return { sort, toggle, sorted };
}

/** Sortierbarer Spaltenkopf. */
export function SortTh({ k, label, sort, onSort, style, title }: { k: string; label: ReactNode; sort: SortState; onSort: (k: string) => void; style?: CSSProperties; title?: string }) {
  const on = sort?.key === k;
  return (
    <th style={style} title={title ?? 'Sortieren'} className={`ed-sortable ${on ? 'on' : ''}`} onClick={() => onSort(k)}
      aria-sort={on ? (sort!.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      {label}<span className="ed-sort-mark">{on ? (sort!.dir === 1 ? '▲' : '▼') : ''}</span>
    </th>
  );
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
  if (col.ref === 'club') {
    const known = typeof document !== 'undefined' ? document.getElementById(CLUB_IDS_LIST) : null;
    const bad = !!v && !!known && !known.querySelector(`option[value="${String(v).replace(/"/g, '')}"]`);
    return <input className={`ed-in ${bad ? 'bad' : ''}`} list={CLUB_IDS_LIST} title={bad ? 'Unbekannte Vereins-ID' : undefined} value={v == null ? '' : String(v)}
      onChange={(e) => set(e.target.value === '' && col.optional ? undefined : e.target.value)} />;
  }
  return <input className="ed-in" value={v == null ? '' : String(v)} onChange={(e) => set(e.target.value === '' && col.optional ? undefined : e.target.value)} />;
}

/** Wert für „Für markierte setzen“: Zahlen auch relativ (+5, -3, *1,1, /2). */
function bulkValue(col: Col, raw: string, old: unknown): { ok: boolean; v: unknown } {
  if ((col.type ?? 'text') === 'number') {
    const m = raw.trim().match(/^([+\-*/])\s*(-?[\d.,]+)$/);
    if (m) {
      const n = Number(m[2].replace(',', '.'));
      const o = typeof old === 'number' ? old : 0;
      if (!Number.isFinite(n)) return { ok: false, v: undefined };
      const r = m[1] === '+' ? o + n : m[1] === '-' ? o - n : m[1] === '*' ? o * n : n ? o / n : o;
      return { ok: true, v: Number.isInteger(o) && Number.isInteger(n) && m[1] !== '/' ? Math.round(r) : Math.round(r * 1000) / 1000 };
    }
  }
  return fromCell(col, raw);
}

/** Kopie einer Zeile mit freier ID („…-2“, „…-3“). */
export function duplicateRow<T extends object>(rows: T[], row: T): T {
  const copy = JSON.parse(JSON.stringify(row)) as T;
  const k = rowKey(row);
  if (k) {
    const field = (['id', 'key', 'reformId', 'town'] as const).find((f) => (row as Record<string, unknown>)[f] === k)!;
    const taken = new Set(rows.map(rowKey));
    const base = k.replace(/-\d+$/, '');
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    (copy as Record<string, unknown>)[field] = `${base}-${i}`;
  }
  return copy;
}

export function TableEditor<T extends object>({
  rows, cols, onChange, makeRow, selected, onSelect, searchKeys = ['id', 'name'], title, onAdd, onDelete, canMove = true, csvName,
}: {
  rows: T[];
  cols: Col[];
  onChange: () => void;
  makeRow?: () => T;
  selected?: number | null;
  onSelect?: (i: number) => void;
  searchKeys?: string[];
  title?: string;
  /** Eigene Logik fürs Hinzufügen (z. B. gefilterte Listen); sonst `makeRow` + push. */
  onAdd?: () => void;
  /** Eigene Logik fürs Löschen einer Zeile; sonst splice. */
  onDelete?: (row: T, i: number) => void;
  /** Verschieben erlauben (gefilterte Ansichten: aus). */
  canMove?: boolean;
  /** Dateiname für den CSV-Export (ohne Endung). */
  csvName?: string;
}) {
  const [q, setQ] = useState('');
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [bulkCol, setBulkCol] = useState(cols.find((c) => !['id', 'key', 'reformId', 'town'].includes(c.key))?.key ?? cols[0]?.key ?? '');
  const [bulkVal, setBulkVal] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Zeilenliste ist die echte Datenliste, nicht eine gefilterte Ansicht (dann geht Duplizieren/CSV-Anhängen).
  const own = !onAdd;
  const { sort, toggle, sorted } = useSort();
  const filtered = rows.map((_, i) => i).filter((i) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return searchKeys.some((k) => String(getPath(rows[i], k) ?? '').toLowerCase().includes(s));
  });
  const idx = sorted(filtered, (i, key) => getPath(rows[i], key));
  const movable = canMove && !sort;

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    onChange();
  };
  const del = (i: number) => { if (onDelete) onDelete(rows[i], i); else rows.splice(i, 1); setMarked(new Set()); onChange(); };
  const mark = (i: number, on: boolean, range: boolean) => {
    const next = new Set([...marked].filter((x) => x < rows.length));
    if (range && anchor != null) {
      const a = idx.indexOf(anchor), b = idx.indexOf(i);
      if (a >= 0 && b >= 0) for (let k = Math.min(a, b); k <= Math.max(a, b); k++) { if (on) next.add(idx[k]); else next.delete(idx[k]); }
    } else if (on) next.add(i); else next.delete(i);
    setMarked(next); setAnchor(i);
  };
  const sel = [...marked].filter((i) => i < rows.length).sort((a, b) => a - b);
  const allOn = idx.length > 0 && idx.every((i) => marked.has(i));
  const toggleAll = () => setMarked(allOn ? new Set() : new Set(idx));
  const dup = (list: number[]) => {
    const copies = [...list].sort((a, b) => b - a).map((i) => { const c = duplicateRow(rows, rows[i]); rows.splice(i + 1, 0, c); return c; });
    setMarked(new Set()); setNote(`${copies.length} Zeile(n) dupliziert.`); onChange();
  };
  const delMarked = () => {
    const list = [...sel].sort((a, b) => b - a);
    const objs = list.map((i) => rows[i]);
    objs.forEach((r) => { const i = rows.indexOf(r); if (i < 0) return; if (onDelete) onDelete(r, i); else rows.splice(i, 1); });
    setMarked(new Set()); setNote(`${objs.length} Zeile(n) gelöscht.`); onChange();
  };
  const bulkSet = () => {
    const col = cols.find((c) => c.key === bulkCol);
    if (!col) return;
    let n = 0, bad = 0;
    for (const i of sel) {
      const r = rows[i] as Record<string, unknown>;
      const { ok, v } = bulkValue(col, bulkVal, getPath(r, col.key));
      if (!ok) { bad++; continue; }
      setPath(r, col.key, v); n++;
    }
    setNote(bad ? `${n} geändert, ${bad} ungültig („${bulkVal}“).` : `${col.label} in ${n} Zeile(n) gesetzt.`);
    onChange();
  };
  const exportCsv = () => downloadText(`${(csvName ?? title ?? 'tabelle').toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-')}.csv`, toCsv(sel.length ? sel.map((i) => rows[i]) : idx.map((i) => rows[i]), cols));
  const importCsv = async (f?: File) => {
    if (!f) return;
    const text = await f.text();
    const make = own ? (makeRow ?? (rows[0] ? () => JSON.parse(JSON.stringify(rows[0])) as T : undefined)) : undefined;
    const r = applyCsv(rows, cols, text, make);
    setNote(`CSV: ${r.updated} geändert, ${r.added} neu${r.skipped ? `, ${r.skipped} übersprungen (unbekannte ID)` : ''}${r.bad.length ? ` – ${r.bad.join(' · ')}` : ''}`);
    onChange();
  };
  const bulkDef = cols.find((c) => c.key === bulkCol);
  const add = () => {
    if (onAdd) { onAdd(); onChange(); return; }
    if (makeRow) { rows.push(makeRow()); onChange(); onSelect?.(rows.length - 1); }
  };

  return (
    <div className="ed-table-wrap">
      <div className="ed-table-bar">
        {title && <b>{title}</b>}
        <span className="ed-count">{rows.length} Einträge</span>
        <input className="ed-in ed-search" placeholder="Suchen …" value={q} onChange={(e) => setQ(e.target.value)} />
        {sort && <button className="ed-btn" onClick={() => toggle(sort.key)} title="Sortierung aufheben">{sort.dir === 1 ? 'aufsteigend' : 'absteigend'} sortiert</button>}
        <button className="ed-btn" data-act="csv-export" title={sel.length ? 'Markierte Zeilen als CSV' : 'Sichtbare Zeilen als CSV (Semikolon, für Tabellenprogramme)'} onClick={exportCsv}>CSV-Export</button>
        <button className="ed-btn" data-act="csv-import" title="CSV einlesen: Zeilen mit bekannter ID werden geändert, neue angehängt" onClick={() => fileRef.current?.click()}>CSV-Import</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void importCsv(f); }} />
        {(makeRow || onAdd) && <button className="ed-btn on" onClick={add}><Icon name="newGame" /> Hinzufügen</button>}
      </div>
      {sel.length > 0 && (
        <div className="ed-bulk" data-act="bulk-bar">
          <b>{sel.length} markiert</b>
          <select className="ed-in" value={bulkCol} onChange={(e) => { setBulkCol(e.target.value); setBulkVal(''); }}>
            {cols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {bulkDef?.type === 'select' ? (
            <select className="ed-in" value={bulkVal} onChange={(e) => setBulkVal(e.target.value)}>
              <option value="">{bulkDef.optional ? '– (leer)' : 'wählen …'}</option>
              {bulkDef.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : bulkDef?.type === 'bool' ? (
            <select className="ed-in" value={bulkVal} onChange={(e) => setBulkVal(e.target.value)}><option value="ja">ja</option><option value="">nein</option></select>
          ) : (
            <input className="ed-in ed-bulk-val" value={bulkVal} placeholder={bulkDef?.type === 'number' ? 'Wert, +5, -3, *1,1' : 'Wert'} onChange={(e) => setBulkVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') bulkSet(); }} />
          )}
          <button className="ed-btn on" data-act="bulk-set" onClick={bulkSet}>Setzen</button>
          {own && <button className="ed-btn" data-act="bulk-dup" onClick={() => dup(sel)}>Duplizieren</button>}
          <button className="ed-btn" data-act="bulk-del" onClick={delMarked}>Löschen</button>
          <button className="ed-btn" onClick={() => setMarked(new Set())}>Markierung aufheben</button>
        </div>
      )}
      {note && <div className="ed-note" onClick={() => setNote(null)}>{note}</div>}
      <div className="ed-table-scroll">
        <table className="ed-table">
          <thead>
            <tr>
              {movable && <th style={{ width: 70 }} title="Reihenfolge (nur ohne Sortierung)" />}
              {cols.map((c) => <SortTh key={c.key} k={c.key} label={c.label} sort={sort} onSort={toggle} style={{ minWidth: c.width ?? 110 }} title={c.hint ? `${c.hint} · Klick sortiert` : 'Klick sortiert'} />)}
              <th style={{ width: own ? 120 : 70 }} className="ed-th-act">
                <input type="checkbox" title="Alle sichtbaren markieren" checked={allOn} onChange={toggleAll} />
              </th>
            </tr>
          </thead>
          <tbody>
            {idx.map((i) => (
              <tr key={i} className={`${selected === i ? 'sel' : ''} ${marked.has(i) ? 'marked' : ''}`} data-rowid={rowKey(rows[i]) ?? ''} onClick={() => onSelect?.(i)}>
                {movable && <td className="ed-ctrl">
                  <button className="ed-mini" title="Nach oben" onClick={(e) => { e.stopPropagation(); move(i, -1); }}>▲</button>
                  <button className="ed-mini" title="Nach unten" onClick={(e) => { e.stopPropagation(); move(i, 1); }}>▼</button>
                </td>}
                {cols.map((c) => <td key={c.key}><Cell row={rows[i] as Record<string, unknown>} col={c} onChange={onChange} /></td>)}
                <td className="ed-row-act">
                  <input type="checkbox" title="Markieren (Umschalt: Bereich)" checked={marked.has(i)} onClick={(e) => { e.stopPropagation(); mark(i, (e.target as HTMLInputElement).checked, e.shiftKey); }} onChange={() => undefined} />
                  {own && <button className="ed-mini ed-mini-w" title="Zeile duplizieren" data-act="row-dup" onClick={(e) => { e.stopPropagation(); dup([i]); }}>Kopie</button>}
                  <button className="ed-mini danger" title="Löschen" onClick={(e) => { e.stopPropagation(); del(i); }}>×</button>
                </td>
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

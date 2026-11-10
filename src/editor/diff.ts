// =============================================================================
// ÄNDERUNGEN GEGENÜBER DEM STANDARD (Wunsch Pascal: QoL für Modder)
// Vergleicht die Arbeitskopie mit dem eingebauten Datensatz. Listen mit
// Schlüssel (id/key/reformId/town) werden nach Schlüssel verglichen, sonst nach
// Position; Listen aus Texten/Zahlen als Ganzes. Jede Änderung bringt eine
// Rücksetz-Funktion mit (wirkt direkt auf die Arbeitskopie).
// =============================================================================
import { Dataset } from '../data/dataset/schema';
import { rowKey } from './nav';
import type { Path } from './search';

export type ChangeKind = 'changed' | 'added' | 'removed';
export interface Change { kind: ChangeKind; path: Path; before?: unknown; after?: unknown; revert: () => void }

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const scalarList = (a: unknown[]) => a.every((x) => x == null || typeof x !== 'object');
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function keyed(a: unknown[]): boolean {
  if (!a.length) return false;
  const ks = a.map(rowKey);
  return ks.every(Boolean) && new Set(ks).size === ks.length;
}

export function diffDataset(std: Dataset, cur: Dataset, limit = 2000): { changes: Change[]; more: boolean } {
  const out: Change[] = [];
  let more = false;
  const add = (c: Change) => { if (out.length >= limit) { more = true; return; } out.push(c); };

  const walk = (s: unknown, c: unknown, path: Path, setC: (v: unknown) => void, delC: () => void) => {
    if (out.length >= limit) { more = true; return; }
    if (same(s, c)) return;
    if (Array.isArray(s) && Array.isArray(c)) {
      if (scalarList(s) && scalarList(c)) { add({ kind: 'changed', path, before: s, after: c, revert: () => setC(clone(s)) }); return; }
      if (keyed(s) && keyed(c)) {
        const sm = new Map(s.map((x) => [rowKey(x)!, x]));
        const cm = new Map(c.map((x, i) => [rowKey(x)!, i]));
        c.forEach((x, i) => {
          const k = rowKey(x)!;
          const sx = sm.get(k);
          if (sx === undefined) add({ kind: 'added', path: [...path, i], after: x, revert: () => { const j = c.indexOf(x); if (j >= 0) c.splice(j, 1); } });
          else walk(sx, x, [...path, i], (v) => { const j = c.indexOf(x); if (j >= 0) c[j] = v; }, () => { const j = c.indexOf(x); if (j >= 0) c.splice(j, 1); });
        });
        s.forEach((x, i) => {
          const k = rowKey(x)!;
          if (!cm.has(k)) add({ kind: 'removed', path: [...path, k], before: x, revert: () => c.splice(Math.min(i, c.length), 0, clone(x)) });
        });
        return;
      }
      const n = Math.max(s.length, c.length);
      for (let i = 0; i < n; i++) {
        if (i >= s.length) { const x = c[i]; add({ kind: 'added', path: [...path, i], after: x, revert: () => { const j = c.indexOf(x); if (j >= 0) c.splice(j, 1); } }); }
        else if (i >= c.length) { const x = s[i]; add({ kind: 'removed', path: [...path, i], before: x, revert: () => c.splice(Math.min(i, c.length), 0, clone(x)) }); }
        else walk(s[i], c[i], [...path, i], (v) => { c[i] = v; }, () => c.splice(i, 1));
      }
      return;
    }
    if (isObj(s) && isObj(c)) {
      for (const k of new Set([...Object.keys(s), ...Object.keys(c)])) {
        if (!(k in c) || c[k] === undefined) { if (s[k] !== undefined) add({ kind: 'removed', path: [...path, k], before: s[k], revert: () => { c[k] = clone(s[k]); } }); continue; }
        if (!(k in s) || s[k] === undefined) { add({ kind: 'added', path: [...path, k], after: c[k], revert: () => { delete c[k]; } }); continue; }
        walk(s[k], c[k], [...path, k], (v) => { c[k] = v; }, () => { delete c[k]; });
      }
      return;
    }
    if (c === undefined) { add({ kind: 'removed', path, before: s, revert: () => setC(clone(s)) }); return; }
    if (s === undefined) { add({ kind: 'added', path, after: c, revert: delC }); return; }
    add({ kind: 'changed', path, before: s, after: c, revert: () => setC(clone(s)) });
  };

  const sr = std as unknown as Record<string, unknown>;
  const cr = cur as unknown as Record<string, unknown>;
  for (const k of new Set([...Object.keys(sr), ...Object.keys(cr)])) {
    if (k === 'meta' || k === 'format' || k === 'version' || k === 'legends') continue;
    const s = sr[k], c = cr[k];
    if (c === undefined && s !== undefined) { add({ kind: 'removed', path: [k], before: s, revert: () => { cr[k] = clone(s); } }); continue; }
    if (s === undefined && c !== undefined) { add({ kind: 'added', path: [k], after: c, revert: () => { delete cr[k]; } }); continue; }
    walk(s, c, [k], (v) => { cr[k] = v; }, () => { delete cr[k]; });
  }
  return { changes: out, more };
}

/** Kurzform eines Werts für die Liste. */
export function shortValue(v: unknown): string {
  if (v === undefined) return '–';
  if (typeof v === 'string') return v.startsWith('data:') ? 'Bild' : v.length > 60 ? `„${v.slice(0, 57)}…“` : `„${v}“`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return scalarList(v) ? (v.length > 6 ? `${v.slice(0, 6).join(', ')} … (${v.length})` : v.join(', ') || 'leer') : `${v.length} Einträge`;
  const k = rowKey(v);
  const o = v as Record<string, unknown>;
  return k ? `${String(o.name ?? o.title ?? k)}` : `${Object.keys(o).length} Felder`;
}

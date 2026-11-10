// =============================================================================
// CSV je Tabelle (Wunsch Pascal: QoL für Modder) – Semikolon wie in deutschen
// Tabellenprogrammen, Kopfzeile = Feldpfade (z. B. `colors.primary`), Listen mit
// Komma in einer Zelle. Beim Import zählt die Spalte per Feldpfad oder Beschriftung.
// =============================================================================
import type { Col } from './TableEditor';
import { getPath, setPath } from './TableEditor';
import { rowKey } from './nav';

const SEP = ';';

function cell(v: unknown): string {
  const s = v == null ? '' : Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'ja' : '') : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: object[], cols: Col[]): string {
  const head = cols.map((c) => cell(c.key)).join(SEP);
  const body = rows.map((r) => cols.map((c) => cell(getPath(r, c.key))).join(SEP));
  return '﻿' + [head, ...body].join('\r\n') + '\r\n';
}

/** CSV in Zeilen aus Zellen (Anführungszeichen, Zeilenumbrüche in Zellen). Trenner ; oder , automatisch. */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const first = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ';' : ',';
  const out: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x !== '')) out.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((x) => x !== '')) out.push(row);
  return out;
}

/** Text einer Zelle in den Wert der Spalte umwandeln; null = ungültig (Zeile bleibt unverändert). */
export function fromCell(col: Col, s: string): { ok: boolean; v: unknown } {
  const t = col.type ?? 'text';
  const raw = s.trim();
  if (raw === '' && col.optional) return { ok: true, v: undefined };
  if (t === 'number') {
    if (raw === '') return { ok: true, v: 0 };
    const n = Number(raw.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? { ok: true, v: n } : { ok: false, v: undefined };
  }
  if (t === 'bool') return { ok: true, v: /^(ja|1|true|x|wahr)$/i.test(raw) || undefined };
  if (t === 'list') return { ok: true, v: raw.split(',').map((x) => x.trim()).filter(Boolean) };
  if (t === 'select' && col.options && !col.options.some((o) => o.value === raw)) {
    const byLabel = col.options.find((o) => o.label.toLowerCase() === raw.toLowerCase());
    return byLabel ? { ok: true, v: byLabel.value } : { ok: false, v: undefined };
  }
  return { ok: true, v: s };
}

export interface CsvResult { updated: number; added: number; skipped: number; bad: string[] }

/**
 * CSV übernehmen: Zeilen mit vorhandenem Schlüssel (id/key/reformId/town) werden
 * aktualisiert, neue angehängt (`make` liefert die Vorlage, sonst fehlt das Anhängen).
 * Ohne Schlüsselspalte ersetzt die Datei die Zeilen der Reihe nach.
 */
export function applyCsv<T extends object>(rows: T[], cols: Col[], text: string, make?: () => T): CsvResult {
  const res: CsvResult = { updated: 0, added: 0, skipped: 0, bad: [] };
  const data = parseCsv(text);
  if (data.length < 2) { res.bad.push('Datei ohne Datenzeilen.'); return res; }
  const head = data[0].map((h) => h.trim());
  const map = head.map((h) => cols.find((c) => c.key === h) ?? cols.find((c) => c.label.toLowerCase() === h.toLowerCase()));
  const unknown = head.filter((_, i) => !map[i]);
  if (unknown.length) res.bad.push(`Unbekannte Spalten ignoriert: ${unknown.join(', ')}`);
  const keyCol = map.findIndex((c) => c && ['id', 'key', 'reformId', 'town'].includes(c.key));
  const index = new Map(rows.map((r) => [rowKey(r), r]));
  data.slice(1).forEach((line, li) => {
    let target: T | undefined;
    if (keyCol >= 0) target = index.get(line[keyCol]?.trim());
    else target = rows[li];
    const isNew = !target;
    if (isNew) {
      if (!make) { res.skipped++; return; }
      target = make();
    }
    let changed = false;
    map.forEach((c, i) => {
      if (!c || i >= line.length) return;
      const { ok, v } = fromCell(c, line[i]);
      if (!ok) { if (res.bad.length < 12) res.bad.push(`Zeile ${li + 2}, ${c.label}: „${line[i]}“ ungültig`); return; }
      const before = JSON.stringify(getPath(target, c.key));
      setPath(target as Record<string, unknown>, c.key, v);
      if (JSON.stringify(getPath(target, c.key)) !== before) changed = true;
    });
    if (isNew) { rows.push(target!); index.set(rowKey(target), target!); res.added++; }
    else if (changed) res.updated++;
  });
  return res;
}

export function downloadText(name: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

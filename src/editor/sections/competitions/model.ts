// =============================================================================
// EDITOR › WETTBEWERBE – Perioden bearbeiten (ohne Oberfläche)
// -----------------------------------------------------------------------------
// Solange ein Wettbewerb nicht geändert wurde, steht nichts im Datensatz: der
// Editor zeigt die Standard-Perioden aus data/competitions/registry.ts. Bei der
// ersten Änderung werden die Standard-Grenzen in den Datensatz übernommen (ohne
// Werte) – danach lassen sich Grenzen verschieben, Perioden teilen/zusammenlegen.
// Enthält der Wettbewerb wieder nur die Standard-Grenzen ohne Werte, wird er
// aus dem Datensatz entfernt (Änderungsübersicht bleibt sauber).
// =============================================================================
import type { Dataset } from '../../../data/dataset/schema';
import type { CompPeriod } from '../../../data/competitions/overrides';
import { COMP_FIRST, OPEN_END, defaultPeriods, type CompDef } from '../../../data/competitions/registry';

export const seasonLabel = (y: number) => (y >= OPEN_END ? 'offen' : `${y}/${String((y + 1) % 100).padStart(2, '0')}`);
export const periodLabel = (p: { from: number; to: number }) => `${seasonLabel(p.from)} – ${p.to >= OPEN_END ? 'offen' : seasonLabel(p.to)}`;

/** Perioden zur Anzeige: aus dem Datensatz oder die Standard-Perioden. */
export function periodsOf(ds: Dataset, def: CompDef): CompPeriod[] {
  return ds.competitions?.[def.id] ?? defaultPeriods(def).map((p) => ({ ...p }));
}
export const isOwn = (ds: Dataset, def: CompDef) => !!ds.competitions?.[def.id];

/** Perioden im Datensatz anlegen (falls noch Standard) und zurückgeben. */
export function ensurePeriods(ds: Dataset, def: CompDef): CompPeriod[] {
  ds.competitions ??= {};
  return (ds.competitions[def.id] ??= defaultPeriods(def).map((p) => ({ ...p })));
}

const VALUE_KEYS = (p: CompPeriod) => Object.keys(p).filter((k) => k !== 'from' && k !== 'to');
/** Hat die Periode eigene Werte? */
export const hasValues = (p: CompPeriod) => VALUE_KEYS(p).length > 0;

/** Wettbewerb entfernen, wenn er wieder genau dem Standard entspricht. */
export function tidy(ds: Dataset, def: CompDef): void {
  const list = ds.competitions?.[def.id];
  if (!list) return;
  const std = defaultPeriods(def);
  const same = list.length === std.length && list.every((p, i) => p.from === std[i].from && p.to === std[i].to && !hasValues(p));
  if (same) delete ds.competitions![def.id];
  if (ds.competitions && !Object.keys(ds.competitions).length) delete ds.competitions;
}

/** Wert setzen (undefined = Standard) in der Periode mit Index `i`. */
export function setValue<K extends keyof CompPeriod>(ds: Dataset, def: CompDef, i: number, key: K, v: CompPeriod[K] | undefined): void {
  const list = ensurePeriods(ds, def);
  const p = list[i];
  if (!p) return;
  if (v === undefined || v === '' || (typeof v === 'object' && v !== null && !Array.isArray(v) && !Object.keys(v).length)) delete p[key];
  else p[key] = v;
  tidy(ds, def);
}

/** Periode `i` ab Saison `y` teilen (beide Teile behalten die Werte). Liefert den Index des neuen Teils. */
export function splitAt(ds: Dataset, def: CompDef, i: number, y: number): number | null {
  const list = ensurePeriods(ds, def);
  const p = list[i];
  if (!p || y <= p.from || y > Math.min(p.to, 2100)) return null;
  const copy: CompPeriod = JSON.parse(JSON.stringify(p));
  copy.from = y;
  p.to = y - 1;
  list.splice(i + 1, 0, copy);
  tidy(ds, def);
  return i + 1;
}

/** Periode `i` mit der folgenden zusammenlegen (Werte der ersten gelten weiter). */
export function mergeNext(ds: Dataset, def: CompDef, i: number): boolean {
  const list = ensurePeriods(ds, def);
  if (!list[i] || !list[i + 1]) return false;
  list[i].to = list[i + 1].to;
  list.splice(i + 1, 1);
  tidy(ds, def);
  return true;
}

/** Beginn der Periode `i` verschieben (Ende der vorigen wandert mit). */
export function moveStart(ds: Dataset, def: CompDef, i: number, y: number): boolean {
  const list = ensurePeriods(ds, def);
  const p = list[i], prev = list[i - 1];
  if (!p || !prev || !Number.isInteger(y) || y <= prev.from || y > Math.min(p.to, 2100)) return false;
  p.from = y; prev.to = y - 1;
  tidy(ds, def);
  return true;
}

/** Ende der Periode `i` verschieben (Beginn der nächsten wandert mit). */
export function moveEnd(ds: Dataset, def: CompDef, i: number, y: number): boolean {
  const list = ensurePeriods(ds, def);
  const p = list[i], next = list[i + 1];
  if (!p || !next || !Number.isInteger(y) || y < p.from || y >= Math.min(next.to, 2100)) return false;
  p.to = y; next.from = y + 1;
  tidy(ds, def);
  return true;
}

/** Alle Änderungen eines Wettbewerbs verwerfen. */
export function resetCompetition(ds: Dataset, def: CompDef): void {
  if (ds.competitions) delete ds.competitions[def.id];
  if (ds.competitions && !Object.keys(ds.competitions).length) delete ds.competitions;
}

/** Prüfung einer Periodenliste: lückenlos, ohne Überschneidung, aufsteigend (Text je Fehler). */
export function periodProblems(list: CompPeriod[]): string[] {
  const out: string[] = [];
  if (!list.length) return ['keine Perioden'];
  if (list[0].from > COMP_FIRST) out.push(`beginnt erst ${seasonLabel(list[0].from)} (davor gilt der Standard)`);
  list.forEach((p, i) => {
    if (!Number.isInteger(p.from) || !Number.isInteger(p.to) || p.to < p.from) out.push(`Periode ${i + 1}: Ende vor Beginn`);
    const n = list[i + 1];
    if (!n) return;
    if (n.from <= p.to) out.push(`Periode ${i + 1} und ${i + 2} überschneiden sich (${seasonLabel(n.from)})`);
    else if (n.from > p.to + 1) out.push(`Lücke zwischen ${seasonLabel(p.to)} und ${seasonLabel(n.from)}`);
  });
  if (list[list.length - 1].to < OPEN_END) out.push(`endet ${seasonLabel(list[list.length - 1].to)} (danach gilt der Standard)`);
  return out;
}

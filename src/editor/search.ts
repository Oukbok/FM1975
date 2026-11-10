// =============================================================================
// GLOBALE SUCHE + PFAD → BEREICH (Wunsch Pascal: QoL für Modder)
// Durchsucht alle Texte und IDs des Datensatzes; `targetFor` übersetzt einen
// Pfad im Datensatz in Bereich + Sprungziel (auch für „Änderungen“).
// =============================================================================
import { Dataset } from '../data/dataset/schema';
import { rowKey, Sec, Target } from './nav';

export type Path = (string | number)[];

export interface Hit { sec: Sec; target: Target; path: Path; value: string; label: string }

const TOP: Record<string, Sec> = {
  meta: 'general', clubs: 'clubs', crests: 'clubs', kits: 'clubs', crestEras: 'clubs', europe: 'europe', timeline: 'timeline',
  leagues: 'leagues', facilities: 'facilities', staff: 'staff', marketing: 'marketing', names: 'names', legendsV2: 'legends',
  worldData: 'world', poolTowns: 'pool', economy: 'economy', history: 'history',
};

/** Wert am Pfad (Zahlen = Listenindex). */
export function at(root: unknown, path: Path): unknown {
  let cur: unknown = root;
  for (const k of path) { if (cur == null || typeof cur !== 'object') return undefined; cur = (cur as Record<string, unknown>)[k as string]; }
  return cur;
}

/** Bereich und Sprungziel zu einem Pfad im Datensatz. */
export function targetFor(ds: Dataset, path: Path, text?: string): { sec: Sec; target: Target } {
  const [top, a, b, c] = path;
  let sec = TOP[String(top)] ?? 'general';
  const t: Target = { text };
  // Letztes Listenelement mit Schlüssel auf dem Pfad = Zeile.
  for (let i = 1; i <= path.length; i++) {
    if (typeof path[i - 1] === 'number') { const k = rowKey(at(ds, path.slice(0, i))); if (k) t.id = k; }
  }
  if (top === 'crests' || top === 'kits' || top === 'crestEras') t.id = String(a);
  if (top === 'clubs') {
    t.tab = String(a);
    if (a === 'ddrOberliga' || a === 'ddrLiga') t.cc = 'gdr';
  }
  if (top === 'worldData') {
    t.cc = String(a);
    if (b === 'clubs') { sec = 'clubs'; t.tab = 'all'; }
    else if (b === 'seasons') { t.tab = 'seasons'; t.year = Number(c); }
  }
  if (top === 'europe') {
    const tabs: Record<string, string> = { countries: 'countries', trends: 'trends', splits: 'splits', exclusions: 'exclusions', clubs: 'clubs', firstSeasonGerman: 'german' };
    t.tab = tabs[String(a)] ?? 'countries';
    if (a === 'countries' && typeof b === 'number') t.id = (at(ds, ['europe', 'countries', b, 'name']) as string) ?? t.id;
  }
  if (top === 'names') t.tab = a === 'mix' ? 'mix' : a === 'blocked' ? 'blocked' : 'origins';
  return { sec, target: t };
}

const WORDS: Record<string, string> = {
  clubs: 'Vereine', tier1: '1. Liga 1975', secondNord: '2. Liga Nord 1975', secondSued: '2. Liga Süd 1975', ddrOberliga: 'DDR-Oberliga 1975', ddrLiga: 'DDR-Liga 1975',
  worldData: 'Weltdaten', seasons: 'Saisons', europe: 'Europa', countries: 'Länder', timeline: 'Chronik', leagues: 'Ligasystem', reforms: 'Reformen',
  facilities: 'Einrichtungen', staff: 'Mitarbeiter', marketing: 'Marketing', names: 'Namen', origins: 'Herkünfte', legendsV2: 'Ausnahmetalente',
  poolTowns: 'Amateur-Pool', economy: 'Wirtschaft', history: 'Zeitabschnitte', crests: 'Wappen', crestEras: 'Spätere Wappen', kits: 'Trikots',
  name: 'Name', shortName: 'Kürzel', short: 'Kürzel', city: 'Stadt', primary: 'Farbe 1', secondary: 'Farbe 2', colors: 'Farben', strength: 'Stärke',
  reputation: 'Ansehen', capacity: 'Plätze', stadium: 'Stadion', founded: 'Gegründet', title: 'Titel', year: 'Jahr', season: 'Saison',
  firstName: 'Vorname', lastName: 'Nachname', potential: 'Potenzial', first: 'Vornamen', last: 'Nachnamen', town: 'Stadt', group: 'Region',
};

/** Lesbare Beschriftung eines Pfads („Vereine › frankfurt-rot › Name“). */
export function pathLabel(ds: Dataset, path: Path): string {
  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (typeof k === 'number') {
      const o = at(ds, path.slice(0, i + 1)) as Record<string, unknown> | undefined;
      const nm = o && typeof o === 'object' ? (o.name ?? o.title ?? (o.firstName ? `${o.firstName} ${o.lastName ?? ''}` : undefined)) : undefined;
      parts.push(String(nm ?? rowKey(o) ?? `#${k + 1}`));
    } else parts.push(WORDS[k] ?? k);
  }
  return parts.join(' › ');
}

function seasonsText(ys: number[]): string {
  const u = [...new Set(ys)].sort((a, b) => a - b);
  return u.length > 4 ? `${u.length} Saisons (${u[0]}–${u[u.length - 1]})` : `Saison ${u.join(', ')}`;
}

/** Volltextsuche über den Datensatz (Groß-/Kleinschreibung egal, Bilder übersprungen). */
export function searchDataset(ds: Dataset, query: string, limit = 120): { hits: Hit[]; more: boolean } {
  const q = query.trim().toLowerCase();
  const hits: Hit[] = [];
  if (q.length < 2) return { hits, more: false };
  let more = false;
  const walk = (v: unknown, path: Path) => {
    if (hits.length >= limit) { more = true; return; }
    if (typeof v === 'string') {
      if (v.startsWith('data:')) return;
      if (v.toLowerCase().includes(q)) push(path, v);
      return;
    }
    if (typeof v === 'number') { if (String(v) === q) push(path, String(v)); return; }
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...path, i])); return; }
    for (const [k, x] of Object.entries(v)) {
      // Schlüssel von Wappen/Trikots sind Vereins-IDs.
      if (path.length === 1 && ['crests', 'kits', 'crestEras'].includes(String(path[0])) && k.toLowerCase().includes(q)) push([...path, k], k);
      walk(x, [...path, k]);
    }
  };
  // Ligalisten je Saison: ein Treffer je Land und Wert (statt einer Zeile je Saison).
  const seasonHits = new Map<string, Hit & { years: number[] }>();
  const push = (path: Path, value: string) => {
    if (path[0] === 'worldData' && path[2] === 'seasons') {
      const k = `${path[1]}|${value}`;
      const y = Number(path[3]);
      const prev = seasonHits.get(k);
      if (prev) { prev.years.push(y); prev.label = `Ligen je Saison › ${path[1]} › ${seasonsText(prev.years)}`; return; }
      if (hits.length >= limit) { more = true; return; }
      const { sec, target } = targetFor(ds, path, value);
      const h = { sec, target, path, value, label: `Ligen je Saison › ${path[1]} › ${y}`, years: [y] };
      seasonHits.set(k, h);
      hits.push(h);
      return;
    }
    if (hits.length >= limit) { more = true; return; }
    const { sec, target } = targetFor(ds, path, value);
    hits.push({ sec, target, path, value, label: pathLabel(ds, path) });
  };
  for (const [k, v] of Object.entries(ds)) if (k !== 'format' && k !== 'version' && k !== 'legends') walk(v, [k]);
  return { hits, more };
}

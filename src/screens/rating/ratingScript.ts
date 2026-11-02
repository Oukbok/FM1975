// =============================================================================
// Daten + Kommentar der Bewertungs-Show: Spieler alphabetisch (Nachname),
// Veränderung, Begründung; variantenreiche Sätze für die Kommentarzeile
// (Auswahl deterministisch je Spieler, nie zweimal hintereinander dieselbe Form).
// =============================================================================
import type { RatingResult } from '../../engine/development';
import type { RatingReason } from '../../engine/devLog';
import type { Game } from '../../game/state';
import type { Player } from '../../types';

export interface ShowRow {
  r: RatingResult;
  p: Player | undefined;
  last: string;
  first: string;
  delta: number;
  reasons: RatingReason[];
}

export type Tone = 'neutral' | 'mine' | 'hot' | 'rule';
export interface Line { text: string; tone: Tone }

export function buildRows(g: Game, results: RatingResult[]): ShowRow[] {
  const rows = results.map((r) => {
    const p = g.players[r.playerId];
    const last = p?.lastName ?? r.playerName.split(' ').slice(-1)[0];
    const first = p?.firstName ?? r.playerName.split(' ')[0];
    return { r, p, last, first, delta: r.newOverall - r.oldOverall, reasons: r.reasons ?? [] };
  });
  return rows.sort((a, b) => a.last.localeCompare(b.last, 'de') || a.first.localeCompare(b.first, 'de'));
}

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

const UP = [
  '{name} legt zu: von {old} auf {new}.',
  'Ein Schritt nach vorn für {name} – jetzt {new}.',
  'Das Trainerteam ist zufrieden: {name} steigt auf {new}.',
  'Aufwertung für {name}. {why}',
  '{last} hat sich gesteigert, {old} auf {new}. {why}',
  'Daumen hoch für {name}: {plus} auf {new}.',
];
const UP_BIG = [
  'Was für ein Sprung! {name} legt {plus} Punkte zu.',
  '{name} ist kaum wiederzuerkennen: von {old} auf {new}.',
  'Der Trainerstab staunt – {name} macht {plus} Punkte gut. {why}',
];
const DOWN = [
  '{name} muss Federn lassen: {old} auf {new}.',
  'Abwertung für {name}. {why}',
  'Ein Rückschritt für {last}, jetzt {new}.',
  '{name} verliert an Boden: {minus}. {why}',
  'Für {name} geht es nach unten, auf {new}.',
];
const DOWN_BIG = [
  'Ein deutlicher Einbruch: {name} fällt von {old} auf {new}.',
  'Bittere Nachricht für {name} – {minus} Punkte. {why}',
];
const FLAT = [
  '{name} bleibt bei {old}.',
  'Keine Veränderung bei {name}.',
  'Stillstand bei {last}: weiter {old}.',
  '{name} hält sein Niveau, {old}.',
  'Alles beim Alten für {name}. {why}',
];
const TAG: Record<string, string[]> = {
  Durchbruch: ['Der Durchbruch! {name} springt auf {new}.', 'Jetzt ist der Knoten gerissen: {name} mit {plus} auf {new}.'],
  Juwel: ['Ein verborgenes Juwel: bei {name} ist der Knoten geplatzt – {new}.'],
  'Spätzünder': ['Spätzünder {name}: neuer Ehrgeiz, {plus} auf {new}.'],
  Knick: ['Ein Leistungsknick bei {name}: {old} auf {new}.'],
};

/** Hauptursache in Richtung des Ergebnisses (das Alter nur, wenn es nichts anderes gibt). */
export function mainReason(row: ShowRow): RatingReason | undefined {
  const fits = row.reasons.filter((x) => x.v !== 0 && (row.delta === 0 || Math.sign(x.v) === Math.sign(row.delta)));
  return fits.find((x) => x.k !== 'alter' && x.k !== 'abbau') ?? fits[0];
}

function whyOf(row: ShowRow): string {
  const main = mainReason(row);
  if (!main) return '';
  const t = main.text.replace(/\s*\(.*\)$/, '');
  return `Ausschlaggebend: ${t}.`;
}

export function lineFor(row: ShowRow, idx: number, prevForm: number): { line: Line; form: number } {
  const big = Math.abs(row.delta) >= 2;
  const pool = row.r.tag && TAG[row.r.tag] && (row.delta !== 0)
    ? TAG[row.r.tag]
    : row.delta > 0 ? (big ? UP_BIG : UP) : row.delta < 0 ? (big ? DOWN_BIG : DOWN) : FLAT;
  let form = (hash(row.r.playerId) + idx) % pool.length;
  if (pool.length > 1 && form === prevForm) form = (form + 1) % pool.length;
  const text = fill(pool[form], {
    name: `${row.first} ${row.last}`, last: row.last, old: row.r.oldOverall, new: row.r.newOverall,
    plus: `+${row.delta}`, minus: `${row.delta}`.replace('-', '−'), why: whyOf(row),
  }).replace(/\s+$/, '');
  const tone: Tone = row.r.tag && row.delta !== 0 ? 'hot' : big ? 'mine' : 'neutral';
  return { line: { text, tone }, form };
}

export function scriptFor(rows: ShowRow[]): Line[] {
  let prev = -1;
  return rows.map((row, i) => { const { line, form } = lineFor(row, i, prev); prev = form; return line; });
}

export function introLine(n: number, label: string): string {
  return `${label}: Das Trainerteam hat ${n} Profis beobachtet – jetzt gibt es die Bewertung, alphabetisch nach Nachnamen.`;
}

export function endLine(rows: ShowRow[]): string {
  const ups = rows.filter((x) => x.delta > 0).length, downs = rows.filter((x) => x.delta < 0).length;
  if (!rows.length) return 'Keine Spieler zu bewerten.';
  if (ups > downs * 2) return `${ups} Aufwertungen, ${downs} Abwertungen – der Kader ist auf einem guten Weg.`;
  if (downs > ups * 2) return `${downs} Abwertungen, nur ${ups} Aufwertungen – Zeit, über Training und Kader nachzudenken.`;
  return `${ups} Aufwertungen, ${downs} Abwertungen – eine durchwachsene Runde.`;
}

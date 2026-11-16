// =============================================================================
// Spielticker des eigenen Vereins für den Spielbericht (Wunsch Pascal: der Bericht
// sieht aus wie das Ende eines im Textmodus verfolgten Spiels).
//
// Nachspielen aus Startwert + Aufstellung geht nicht verlässlich (Spieler, Form,
// Taktik und Kader ändern sich nach dem Spiel), deshalb werden die Zeilen beim
// Simulieren mitgeschrieben – kompakt als Tupel, nur für die letzten
// TICKER_KEEP eigenen Spiele (≈ 190 Zeilen, ≈ 20 KB roh bzw. ≈ 8 KB im
// komprimierten Spielstand je Spiel). Optionales Feld `game.matchTickers`:
// fehlt (alte Spielstände) bzw. kein Eintrag → der Bericht zeigt das bisherige Layout.
//
// „Simulieren“: die Engine läuft wie bisher (gleiche Zufallsfolge, `live` aus),
// zeichnet aber mit `trace` alle Szenen auf; der Erzähler (data/ticker/narrator.ts,
// eigene Zufallsfolge aus `sim.seed`) erzählt Minute für Minute mit.
// Textmodus: die gezeigten Zeilen kommen aus useTicker (screens/match/useTicker.ts).
// =============================================================================
import type { MatchSim } from '../engine/match/sim';
import { onPitch } from '../engine/match/state';
import { rating } from '../engine/match/team';
import type { Side } from '../engine/match/types';
import { Narrator, type Line, type LineKind } from '../data/ticker/narrator';
import type { Game } from './state';

/** So viele eigene Spiele behalten ihren vollen Ticker. */
export const TICKER_KEEP = 10;

/** Zusatzangaben einer Zeile (nur wenn vorhanden). */
interface TkExtra { s?: [number, number]; p?: [number, number]; n?: string; id?: string; w?: string; g?: boolean | null }
/** Zeile: [Ereignis-Nr. (0 = keine), Minute, Art, Seite 0/1 Heim/2 Gast, Ereignisart, Text mit Namensmarkierung, Zusatz]. */
export type TkLine = [number, string, LineKind, 0 | 1 | 2, string, string, TkExtra?];

export interface MatchTicker {
  /** Schlüssel „Datum|Heim|Gast“ (eindeutig, unabhängig von der Match-ID). */
  k: string;
  lines: TkLine[];
  /** Trainer, Tabellenplatz vor dem Spiel (nur Liga), Mannschaftsstärke am Ende – je Heim/Gast. */
  coach: [string, string];
  rank: [number | null, number | null];
  str: [number, number];
  /** Saisontore der Torschützen vor dem Spiel („3. Tor in dieser Saison“). */
  sg: Record<string, number>;
  /** Seite des eigenen Vereins. */
  me: Side;
  /** Im Textmodus verfolgt. */
  w?: boolean;
  /** Rückspiel: Hinspiel (Heim/Gast des Hinspiels) + ob Auswärtstore zählen – Gesamtstand im Bericht. */
  fl?: { home: string; away: string; hg: number; ag: number; awayGoals: boolean };
}

export const tickerKey = (date: string, home: string, away: string): string => `${date}|${home}|${away}`;

const SIDE: Record<string, 0 | 1 | 2> = { home: 1, away: 2 };

function pack(l: Line): TkLine {
  const x: TkExtra = {};
  if (l.score) x.s = l.score;
  if (l.pens) x.p = l.pens;
  if (l.scorer) x.n = l.scorer;
  if (l.scorerId) x.id = l.scorerId;
  if (l.suspense) { x.w = l.suspense.word; x.g = l.suspense.good; }
  const t: TkLine = [l.seq ?? 0, l.minute, l.kind, l.side ? SIDE[l.side] : 0, l.evk ?? '', l.text];
  if (Object.keys(x).length) t.push(x);
  return t;
}

/** Gespeicherte Zeilen → Zeilen wie im Textmodus (älteste zuerst). */
export function unpackLines(t: MatchTicker): Line[] {
  return t.lines.map(([seq, minute, kind, sd, evk, text, x], i) => ({
    id: i + 1, minute, text, kind,
    side: sd === 1 ? 'home' : sd === 2 ? 'away' : undefined,
    seq: seq || undefined, evk: (evk || undefined) as Line['evk'],
    score: x?.s, pens: x?.p, scorer: x?.n, scorerId: x?.id,
    suspense: x?.w != null ? { word: x.w, good: x.g ?? null } : undefined,
  }));
}

/** Schnellsimulation mit Erzähler: spielt bis zum Ende und liefert alle Zeilen (älteste zuerst). */
export function runNarrated(sim: MatchSim, mySide: Side): Line[] {
  sim.trace = true;
  const nar = new Narrator(sim, { mySide, suspense: true, markup: true });
  const out: Line[] = [];
  let guard = 0;
  while (!sim.finished && guard++ < 800) out.push(...nar.narrate(sim.step()));
  return out;
}

/** Ticker eines eigenen Spiels merken (vor dem Verbuchen aufrufen: Saisontore/Tabellenplatz von vorher). */
export function recordTicker(g: Game, sim: MatchSim, date: string, mySide: Side, kind: 'liga' | 'pokal' | 'euro', lines: Line[], watched: boolean, fl?: MatchTicker['fl']): void {
  const H = sim.home.club, A = sim.away.club;
  const rank = (id: string) => (kind === 'liga' && g.table.rows.some((r) => r.played > 0) ? g.table.rows.find((r) => r.clubId === id)?.position ?? null : null);
  const coach = (s: Side) => (s === mySide ? g.manager?.name : sim.team(s).club.coach?.name) ?? '–';
  const strength = (s: Side) => Math.round(onPitch(sim.team(s)).reduce((x, m) => x + rating(m), 0) / 11);
  const sg: Record<string, number> = {};
  for (const l of lines) if (l.scorerId && sg[l.scorerId] == null) sg[l.scorerId] = sim.players[l.scorerId]?.seasonStats?.goals ?? 0;
  const t: MatchTicker = {
    k: tickerKey(date, H.id, A.id), lines: lines.map(pack),
    coach: [coach('home'), coach('away')], rank: [rank(H.id), rank(A.id)], str: [strength('home'), strength('away')],
    sg, me: mySide,
  };
  if (watched) t.w = true;
  if (fl) t.fl = fl;
  const list = (g.matchTickers ?? []).filter((x) => x.k !== t.k);
  list.push(t);
  g.matchTickers = list.slice(-TICKER_KEEP);
}

/** Gespeicherter Ticker zu einem Spiel (oder null → bisheriges Layout). */
export function tickerFor(g: Game, date: string, home: string, away: string): MatchTicker | null {
  const k = tickerKey(date, home, away);
  return g.matchTickers?.find((x) => x.k === k) ?? null;
}

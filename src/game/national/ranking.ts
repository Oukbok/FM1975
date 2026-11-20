// =============================================================================
// WELTRANGLISTE der Nationalmannschaften (Wunsch Pascal) – Elo-Verfahren wie die
// World Football Elo Ratings (Formel/Quellen: docs/recherche/weltrangliste.md).
// -----------------------------------------------------------------------------
// • Start: Elo-Punkte je Nation aus den historischen Stützwerten (data/eloAnchors.ts)
//   zum Startdatum – die Liste ähnelt zu Spielbeginn der echten Rangfolge.
// • Fortschreibung NUR aus den im Spiel ausgespielten Länderspielen (Fenster und
//   WM/EM aus game/national/nationalGame.ts + tournament.ts): jeder Spieltag wird
//   am Tag danach verbucht (Turniere sind beim Nominieren schon ausgespielt, die
//   Liste kennt nur, was schon gespielt ist).
//   Neu = Alt + K · G · (W − We); We = 1 / (10^(−dr/400) + 1), dr = Differenz +
//   100 für die Heimmannschaft; K: WM-Endrunde 60, EM-Endrunde 50, Qualifikation/
//   Nations League 40 (außerhalb Europas in EM-Fenstern: Freundschaftsspiel), Freund-
//   schaftsspiel 20; G (Tordifferenz): 1 / 1,5 / (11+N)/8.
//   Elfmeterschießen zählt als Remis, Verlängerung als Sieg.
// • Drift am Monatsersten: Annäherung an den Richtwert = historischer Wert + Abweichung
//   der Stärke im Spiel von der Grundstärke, bereinigt um den Schnitt des Verbands (DRIFT 6 % der Lücke, ohne Länderspiel seit
//   12 Monaten 10 %). Nötig, weil Länderspiele fast nur im eigenen Verband stattfinden
//   (abgeschottete Töpfe) und Ergebnisse im Spiel enger beieinander liegen als echte –
//   ohne Drift wanderte z. B. der Stärkste eines kleinen Verbands weit nach vorn.
//   Ergebnisse wirken kurzfristig (Turniersieg ≈ +60…100, Halbwertszeit ≈ 1 Jahr).
// • Ausgabe am Monatsersten (wie die FIFA-Liste): Rang/Punkte + Vergleich zur
//   Ausgabe davor; Januar-Ausgabe → Rang des Vorjahres in den Verlauf.
// • Neue Nationen starten beim Richtwert, Nachfolger übernehmen die Punkte
//   (Russland ← UdSSR, Serbien ← Jugoslawien, Tschechien ← Tschechoslowakei).
// Spielstand: optionales `game.natRanking` (≈ 3–6 KB). Fehlt es (alter Spielstand),
// legt `ensureRanking` es beim Laden aus den Richtwerten an.
// =============================================================================
import type { Game } from '../state';
import { NATIONS, NATION_BY_CODE, baseStrength, nationExists, confOf, type Conf } from '../../data/nationalTeams';
import { eloTarget } from '../../data/eloAnchors';
import { addDaysISO } from '../../engine/trainingPlan';
import type { NtMatch } from './tournament';
import type { NationalState } from './nationalGame';

export interface NatRanking {
  v: 1;
  /** Laufende Elo-Punkte (eine Nachkommastelle). */
  pts: Record<string, number>;
  /** Spiele bis einschließlich dieses Tages verbucht. */
  upto: string;
  /** Datum der aktuellen Ausgabe. */
  ed: string;
  /** Rang/Punkte der aktuellen Ausgabe. */
  rk: Record<string, number>;
  ep: Record<string, number>;
  /** Rang/Punkte der Ausgabe davor (für ±). */
  pr: Record<string, number>;
  pp: Record<string, number>;
  /** Letztes Länderspiel je Nation als Monatszahl (Jahr · 12 + Monat). */
  seen: Record<string, number>;
  /** Verlauf: Rang je Jahr (Ausgabe am Jahresende) ab Jahr `hy`, 0 = nicht dabei. */
  hy: number;
  hist: Record<string, number[]>;
}

export const HIST_YEARS = 30;
const INHERIT: Record<string, string> = { RUS: 'URS', SRB: 'YUG', CZE: 'TCH' };
const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);
const monthNo = (iso: string) => yearOf(iso) * 12 + parseInt(iso.slice(5, 7), 10) - 1;
/** Jahr als Bruchteil (1. Juli 1975 = 1975,5). */
const yearFrac = (iso: string) => yearOf(iso) + (parseInt(iso.slice(5, 7), 10) - 1) / 12;
const r1 = (x: number) => Math.round(x * 10) / 10;

// -----------------------------------------------------------------------------
// Formel
// -----------------------------------------------------------------------------
/** K-Faktor je Spielart (Bezeichnung wie im Spiel: Fenster-Label bzw. Turnier). */
export function eloK(kind: string): number {
  if (kind === 'WM') return 60;
  if (kind === 'EM') return 50;
  if (/Qualifikation|Nations League/.test(kind)) return 40;
  return 20;
}
/** Zuschlag nach Tordifferenz. */
export const goalMul = (n: number) => (n <= 1 ? 1 : n === 2 ? 1.5 : (11 + n) / 8);
/** Erwartetes Ergebnis für A (dr inkl. Heimvorteil). */
export const expected = (dr: number) => 1 / (10 ** (-dr / 400) + 1);
/** Punkteänderung für A (B bekommt das Negative). `home`: 1 = A zu Hause, −1 = B zu Hause, 0 = neutral. */
export function eloDelta(ra: number, rb: number, ga: number, gb: number, k: number, home: 1 | 0 | -1, shootout = false): number {
  const we = expected(ra - rb + home * 100);
  const w = shootout || ga === gb ? 0.5 : ga > gb ? 1 : 0;
  return k * (shootout ? 1 : goalMul(Math.abs(ga - gb))) * (w - we);
}

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
type G = Game & { natRanking?: NatRanking };

/** Bestehende Nationen im Jahr (gesperrte bleiben in der Liste, spielen aber nicht). */
const existing = (year: number) => NATIONS.filter((n) => nationExists(n, year));

function sortedCodes(pts: Record<string, number>): string[] {
  return Object.keys(pts).sort((a, b) => pts[b] - pts[a] || a.localeCompare(b));
}

/** Ausgabe veröffentlichen: aktuelle Punkte → Rang; bisherige Ausgabe → „davor“. */
function publish(R: NatRanking, date: string): void {
  R.pr = R.rk; R.pp = R.ep;
  const rk: Record<string, number> = {}, ep: Record<string, number> = {};
  sortedCodes(R.pts).forEach((c, i) => { rk[c] = i + 1; ep[c] = Math.round(R.pts[c]); });
  R.rk = rk; R.ep = ep; R.ed = date;
}

/** Rang je Jahr in den Verlauf (Jahr `y`), höchstens HIST_YEARS Jahre. */
function pushHistory(R: NatRanking, y: number): void {
  if (y < R.hy) return;
  const idx = y - R.hy;
  for (const c of new Set([...Object.keys(R.hist), ...Object.keys(R.rk)])) {
    const l = (R.hist[c] ??= []);
    while (l.length < idx) l.push(0);
    l[idx] = R.rk[c] ?? 0;
  }
  const len = idx + 1;
  if (len > HIST_YEARS) {
    const cut = len - HIST_YEARS;
    for (const c of Object.keys(R.hist)) { R.hist[c] = R.hist[c].slice(cut); if (!R.hist[c].some((x) => x > 0)) delete R.hist[c]; }
    R.hy += cut;
  }
}

/** Rang je Nation aus den Richtwerten zu einem Zeitpunkt (Jahr als Bruchteil). */
function targetRanks(yf: number): Record<string, number> {
  const y = Math.floor(yf);
  const pts: Record<string, number> = {};
  for (const n of existing(y)) pts[n.code] = eloTarget(n, yf);
  const rk: Record<string, number> = {};
  sortedCodes(pts).forEach((c, i) => { rk[c] = i + 1; });
  return rk;
}

/**
 * Neue Rangliste aus den Richtwerten zum Datum (neues Spiel, alter Spielstand).
 * `fromYear` < Jahr (nur alter Spielstand): Verlauf ab dem Startjahr des Spielstands
 * und Ausgabe davor aus den Richtwerten – sonst stünde dort nur „±0“ und ein Punkt.
 */
export function createRanking(date: string, fromYear?: number): NatRanking {
  const y = yearOf(date), yf = yearFrac(date);
  const pts: Record<string, number> = {};
  for (const n of existing(y)) pts[n.code] = r1(eloTarget(n, yf));
  const hy = fromYear != null && fromYear < y ? Math.max(fromYear, y - HIST_YEARS + 1) : y;
  const R: NatRanking = { v: 1, pts, upto: addDaysISO(date, -1), ed: date, rk: {}, ep: {}, pr: {}, pp: {}, seen: {}, hy, hist: {} };
  if (hy < y) {
    // Vormonat: Richtwerte als „Ausgabe davor“ (Rang und Punkte).
    const prev = yf - 1 / 12;
    R.rk = targetRanks(prev);
    for (const c of Object.keys(R.rk)) R.ep[c] = Math.round(eloTarget(c, prev));
    // Rang am Ende jedes Jahres seit dem Start (Dezember-Richtwert).
    for (let yy = hy; yy < y; yy++) {
      const rk = targetRanks(yy + 11 / 12);
      for (const c of Object.keys(rk)) {
        const l = (R.hist[c] ??= []);
        while (l.length < yy - hy) l.push(0);
        l[yy - hy] = rk[c];
      }
    }
  }
  publish(R, date);
  if (hy === y) { R.pr = R.rk; R.pp = R.ep; }
  return R;
}

export function rankingOf(g: Game): NatRanking | null {
  return (g as G).natRanking ?? null;
}

/** Rangliste anlegen, falls sie fehlt (newGame.ts, loadMigrations.ts). */
export function ensureRanking(g: Game): NatRanking {
  const gg = g as G;
  if (!gg.natRanking || gg.natRanking.v !== 1) {
    gg.natRanking = createRanking(g.calendar.currentDate, g.startYear ?? 1975);
  }
  return gg.natRanking;
}

/** Nationen, die im Jahr entstehen/vergehen, nachziehen (Nachfolger erben die Punkte). */
function syncNations(R: NatRanking, date: string): void {
  const y = yearOf(date), yf = yearFrac(date);
  const live = new Set(existing(y).map((n) => n.code));
  const gone: Record<string, number> = {};
  for (const c of Object.keys(R.pts)) if (!live.has(c)) { gone[c] = R.pts[c]; delete R.pts[c]; }
  for (const c of live) {
    if (R.pts[c] != null) continue;
    const from = INHERIT[c];
    R.pts[c] = from && gone[from] != null ? gone[from] : r1(eloTarget(c, yf));
  }
}

// -----------------------------------------------------------------------------
// Tagesablauf
// -----------------------------------------------------------------------------
interface Booked { m: NtMatch; k: number; home: 1 | 0 | -1 }

/** Länderspiele zwischen `upto` (exkl.) und `until` (inkl.) aus Fenstern und Turnier. */
function matchesBetween(st: NationalState, after: string, until: string): Booked[] {
  const out: Booked[] = [];
  for (const w of st.windows) {
    for (const m of w.matches) {
      if (m.date <= after || m.date > until) continue;
      // EM-Qualifikation/Nations League betreffen nur Europa – andere Verbände spielen in diesen Fenstern Freundschaftsspiele.
      const europeOnly = /EM-|Nations League/.test(m.stage) && NATION_BY_CODE[m.a] && confOf(NATION_BY_CODE[m.a], yearOf(m.date)) !== 'UEFA';
      out.push({ m, k: europeOnly ? eloK('Freundschaftsspiel') : eloK(m.stage), home: 1 });
    }
  }
  const t = st.tourn;
  if (t) {
    const host = new Set(t.hosts);
    for (const m of t.matches) {
      if (m.date <= after || m.date > until) continue;
      const ha = host.has(m.a), hb = host.has(m.b);
      out.push({ m, k: eloK(t.kind), home: ha && !hb ? 1 : hb && !ha ? -1 : 0 });
    }
  }
  return out.sort((a, b) => a.m.date.localeCompare(b.m.date));
}

/** Spiele verbuchen (öffentlich für Tests). */
export function bookRankingMatch(R: NatRanking, b: Booked): void {
  const { m } = b;
  const ra = R.pts[m.a], rb = R.pts[m.b];
  if (ra == null || rb == null) return;
  const d = eloDelta(ra, rb, m.ga, m.gb, b.k, b.home, m.extra === 'iE');
  R.pts[m.a] = r1(ra + d); R.pts[m.b] = r1(rb - d);
  const mn = monthNo(m.date);
  R.seen[m.a] = mn; R.seen[m.b] = mn;
}

/** Elo je Punkt Grundstärke (Ausgleichsgerade, data/eloAnchors.ts `eloFromBase`). */
const ELO_PER_STRENGTH = 17.8;
export const DRIFT = 0.06;
export const DRIFT_IDLE = 0.1;

/** Abweichung der Stärke im Spiel von der Grundstärke je Nation (±8), bereinigt um den Schnitt ihres
 *  Verbands: das Niveau zwischen den Verbänden bleibt historisch (Spieler aus Europa sind im Spiel
 *  vollständig erfasst, andere Kontinente nur über Legionäre – ein Vergleich über Verbände hinweg
 *  wäre schief); innerhalb eines Verbands zählt, wer im Spiel stärker oder schwächer geworden ist. */
export function strengthDeviation(strengths: Map<string, number>, date: string): Map<string, number> {
  const y = yearOf(date);
  const raw = new Map<string, number>();
  const sum = new Map<Conf, [number, number]>();
  for (const [c, v] of strengths) {
    const def = NATION_BY_CODE[c];
    if (!def) continue;
    const d = Math.max(-8, Math.min(8, v - baseStrength(def, y)));
    raw.set(c, d);
    const k = confOf(def, y), t = sum.get(k) ?? [0, 0];
    sum.set(k, [t[0] + d, t[1] + 1]);
  }
  const out = new Map<string, number>();
  for (const [c, d] of raw) { const t = sum.get(confOf(NATION_BY_CODE[c], y))!; out.set(c, d - t[0] / t[1]); }
  return out;
}

/** Richtwert einer Nation: historischer Wert + bereinigte Stärke-Abweichung (`strengthDeviation`) × 17,8. */
export function driftTarget(code: string, date: string, dev = 0): number {
  return eloTarget(code, yearFrac(date)) + dev * ELO_PER_STRENGTH;
}

/** Monatliche Annäherung an den Richtwert (`strengths` = Stärke im Spiel, fehlt = nur historisch). */
function drift(R: NatRanking, date: string, strengths?: Map<string, number>): void {
  const now = monthNo(date);
  const dev = strengths ? strengthDeviation(strengths, date) : null;
  for (const c of Object.keys(R.pts)) {
    const idle = R.seen[c] == null || now - R.seen[c] > 12;
    const gap = driftTarget(c, date, dev?.get(c) ?? 0) - R.pts[c];
    R.pts[c] = r1(R.pts[c] + gap * (idle ? DRIFT_IDLE : DRIFT));
  }
}

/** Täglich aus nationalDaily (game/national/nationalGame.ts): gestrige Spiele, Monatsausgabe. */
export function rankingDaily(g: Game, st: NationalState, today: string, strengths?: () => Map<string, number>): void {
  const R = ensureRanking(g);
  const until = addDaysISO(today, -1);
  if (until > R.upto) {
    for (const b of matchesBetween(st, R.upto, until)) bookRankingMatch(R, b);
    R.upto = until;
  }
  if (today.slice(8, 10) === '01' && R.ed !== today) {
    syncNations(R, today);
    drift(R, today, strengths?.());
    publish(R, today);
    if (today.slice(5, 7) === '01') pushHistory(R, yearOf(today) - 1);
  }
}

// -----------------------------------------------------------------------------
// Anzeige
// -----------------------------------------------------------------------------
export interface RankRow { code: string; rank: number; pts: number; delta: number | null; dPts: number | null; conf: Conf }

/** Aktuelle Ausgabe als Liste (Rang, Punkte, ± Plätze/Punkte zur Ausgabe davor). */
export function rankingRows(g: Game): RankRow[] {
  const R = rankingOf(g);
  if (!R) return [];
  const y = yearOf(R.ed);
  return Object.keys(R.rk).sort((a, b) => R.rk[a] - R.rk[b]).map((c) => {
    const n = NATIONS.find((x) => x.code === c)!;
    return {
      code: c, rank: R.rk[c], pts: R.ep[c],
      delta: R.pr[c] != null ? R.pr[c] - R.rk[c] : null,
      dPts: R.pp[c] != null ? R.ep[c] - R.pp[c] : null,
      conf: confOf(n, y),
    };
  });
}

/** Verlauf des Rangs einer Nation: [Jahr, Rang] (Jahresenden + aktuelle Ausgabe). */
export function rankHistory(g: Game, code: string): [number, number][] {
  const R = rankingOf(g);
  if (!R) return [];
  const out: [number, number][] = [];
  (R.hist[code] ?? []).forEach((r, i) => { if (r > 0) out.push([R.hy + i, r]); });
  if (R.rk[code]) {
    const yf = yearFrac(R.ed);
    if (!out.length || out[out.length - 1][0] < yf - 0.05) out.push([Math.round(yf * 100) / 100, R.rk[code]]);
  }
  return out;
}

/** Kurzinfo für Länderprofil/Nationalteam-Seiten. */
export function worldRank(g: Game, code: string): { rank: number; of: number; pts: number; delta: number | null; ed: string } | null {
  const R = rankingOf(g);
  if (!R || !R.rk[code]) return null;
  return { rank: R.rk[code], of: Object.keys(R.rk).length, pts: R.ep[code], delta: R.pr[code] != null ? R.pr[code] - R.rk[code] : null, ed: R.ed };
}

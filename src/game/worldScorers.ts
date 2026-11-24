// =============================================================================
// EINZELSTATISTIK DER AUSLANDSLIGEN (Wunsch Pascal: Statistikseite wie bei der
// Heimatliga – Torschützen, Vorlagen, Scorer, Gelbe/Rote Karten, Weiße Weste) – ohne Spielereignisse
// -----------------------------------------------------------------------------
// Die Auslandsligen kennen nur Ergebnisse (game/worldLeagues.ts). Die Tore jedes
// Vereins werden Tor für Tor fest auf seinen Kader aus dem Spielerpool verteilt
// (game/worldPool.ts): gewichtet nach Position, Stärke und Stammplatz, der Zufall
// hängt nur an Saison, Verein und laufender Nummer des Tores. So wächst die Liste
// mit jedem Spieltag folgerichtig weiter, ohne dass etwas gespeichert wird.
// Genauso die Landespokale (game/worldCups.ts) mit eigener Zufallsfolge.
// Vorlagen, Karten und Zu-null-Spiele entstehen genauso (eigene Zufallsfolgen je Tor bzw. Spiel).
// Am Saisonende behält die Welt-Historie die besten zehn je Wertung, Liga und Pokal
// (`WorldSeasonRecord.pstats`, Schlüssel `Land|Ebene` bzw. `Land|cup`; ältere Spielstände
// nur `scorers`) – die Kader ändern sich ja zur neuen Saison.
// =============================================================================
import type { LeanCup, LeanDiv } from '../engine/world';
import type { WorldPackedStats, WorldStatRow } from '../engine/worldTypes';
import type { StatRow } from './competitionView';
import type { StatCat } from './leagueArchive';
import type { Game } from './state';
import { leanCupRounds } from './worldCups';
import { leanGames } from './worldLeagues';
import { WP_FIELD as W, type WP } from './worldPool';

/** Torgefahr je Position (Mittelstürmer 10 … Torwart 0). */
const POS_W: Record<string, number> = { MS: 10, HS: 8, RA: 5, LA: 5, OM: 4.5, RM: 3, LM: 3, ZM: 2.2, DM: 1, IV: 0.7, RV: 0.6, LV: 0.6, LIB: 0.6, TW: 0 };
/** Vorlagen: Spielmacher und Außen vorn. */
const AST_W: Record<string, number> = { OM: 9, RA: 8, LA: 8, RM: 7, LM: 7, ZM: 6, HS: 6, MS: 3.5, RV: 3, LV: 3, DM: 2.5, LIB: 1.2, IV: 0.6, TW: 0.1 };
/** Karten: Abräumer und Verteidiger vorn. */
const CARD_W: Record<string, number> = { DM: 9, IV: 8, RV: 7, LV: 7, LIB: 6, ZM: 6, RM: 4, LM: 4, OM: 3.5, MS: 3.5, HS: 3, RA: 3, LA: 3, TW: 0.8 };

interface ScoredGame { home: string; away: string; hg: number | null; ag: number | null }
export type LeanStats = Record<StatCat, StatRow[]>;
const EMPTY = (): LeanStats => ({ goals: [], assists: [], scorer: [], yellow: [], red: [], clean: [] });

/**
 * Einzelstatistik einer Reihe von Spielen fest auf die Kader verteilen (beste `n` je Wertung):
 * Tore, Vorlagen (rund sieben von zehn Toren), Scorer, Gelbe und Rote Karten je Spiel, Zu-null-Spiele
 * des Stammtorwarts. `tag` trennt die Wettbewerbe: dieselbe Mannschaft hat in Liga und Pokal eigene
 * Zufallsfolgen. Die Torverteilung ist dieselbe wie in der früheren reinen Torschützenliste.
 */
/** Saisonzeile eines Weltspielers (für Auszeichnungen/Kristallstern): Einsätze geschätzt nach Stammplatz. */
export interface LeanLine { w: WP; clubId: string; apps: number; goals: number; assists: number; clean: number; played: number }

/** FNV-1a wie engine/leagues.ts hashStr, aber mit Zwischenstand (hashStr(a + b) = fnv(fnv(FNV0, a), b) >>> 0). */
const FNV0 = 2166136261;
function fnv(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h;
}
/** Erster Wert von mulberry32(seed) (engine/leagues.ts), ohne Funktion anzulegen. */
function first32(seed: number): number {
  let a = seed >>> 0;
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Verteilung eines Vereins: Kader nach Stärke, je Spieler Tore/Vorlagen/Gelb/Rot, Stammtorwart. */
interface ClubDist { clubId: string; played: number; sorted: WP[]; gl: number[]; as: number[]; ye: number[]; re: number[]; keeper: WP | undefined; cs: number }

/**
 * Zwischenspeicher für die Dauer eines Abschnitts (`withLeanMemo`, z. B. Saisonwechsel: Bestenlisten,
 * Die Besten der Saison und Goldener Schuh rechnen dieselbe Verteilung je Liga sonst dreimal). Der
 * Spielerpool darf sich im Abschnitt nicht ändern. Schlüssel = Wettbewerb + Vereine + alle Ergebnisse.
 */
let memo: Map<string, ClubDist[]> | null = null;
/** Zwischenspeicher leeren (game/resetModuleState.ts). */
export function clearLeanMemo(): void { memo = null; }
export function withLeanMemo<T>(fn: () => T): T {
  if (memo) return fn();
  memo = new Map();
  try { return fn(); } finally { memo = null; }
}

function distribute(g: Game, clubIds: string[], list: ScoredGame[], tag: string): ClubDist[] {
  const pool = g.worldPool!.p;
  const clubs = new Set(clubIds);
  const squads = new Map<string, WP[]>();
  for (const w of pool) {
    if (w[W.youth] || !clubs.has(w[W.club])) continue;
    const l = squads.get(w[W.club]);
    if (l) l.push(w); else squads.set(w[W.club], [w]);
  }
  const goals = new Map<string, number>(), games = new Map<string, number>(), clean = new Map<string, number>();
  for (const x of list) {
    if (x.hg == null) continue;
    goals.set(x.home, (goals.get(x.home) ?? 0) + x.hg); goals.set(x.away, (goals.get(x.away) ?? 0) + x.ag!);
    games.set(x.home, (games.get(x.home) ?? 0) + 1); games.set(x.away, (games.get(x.away) ?? 0) + 1);
    if (x.ag === 0) clean.set(x.home, (clean.get(x.home) ?? 0) + 1);
    if (x.hg === 0) clean.set(x.away, (clean.get(x.away) ?? 0) + 1);
  }
  const out: ClubDist[] = [];
  for (const [clubId, squad] of squads) {
    // Zufall je Tor/Spiel = mulberry32(hashStr(Schlüssel)) wie bisher, der feste Anfang des Schlüssels
    // (Wettbewerb, Verein) wird aber nur einmal gehasht (FNV-1a läuft Zeichen für Zeichen weiter).
    const P = (mid: string) => fnv(FNV0, `${tag}:${mid}${clubId}:`);
    const pG = P(''), pA = P('a:'), pAp = P('ap:'), pAq = P('aq:'), pY = P('y:'), pYp = P('yp:'), pR = P('r:'), pRp = P('rp:');
    const rnd = (prefix: number, rest: string) => first32(fnv(prefix, rest) >>> 0);
    const played = games.get(clubId) ?? 0;
    if (!played) continue;
    // Stammelf voll, Ergänzungsspieler deutlich weniger.
    const sorted = [...squad].sort((a, b) => b[W.ov] - a[W.ov] || a[W.id].localeCompare(b[W.id]));
    const share = (i: number) => (i < 11 ? 1 : i < 16 ? 0.35 : 0.08);
    const weights = (tab: Record<string, number>, pow: number) => sorted.map((w, i) => (tab[w[W.pos]] ?? 1) * Math.pow(w[W.ov] / 70, pow) * share(i));
    const pick = (ws: number[], sum: number, u: number) => { let x = u * sum, i = 0; for (; i < ws.length - 1; i++) { x -= ws[i]; if (x <= 0) break; } return i; };
    const zero = () => new Array<number>(sorted.length).fill(0);
    const gl = zero(), as = zero(), ye = zero(), re = zero();
    const gw = weights(POS_W, 3), gsum = gw.reduce((a, b) => a + b, 0);
    const aw = weights(AST_W, 2), asum = aw.reduce((a, b) => a + b, 0);
    const cw = weights(CARD_W, 0), csum = cw.reduce((a, b) => a + b, 0);
    const total = goals.get(clubId) ?? 0;
    if (gsum > 0) for (let k = 0; k < total; k++) {
      const ks = String(k);
      const s = pick(gw, gsum, rnd(pG, ks));
      gl[s]++;
      if (asum > 0 && rnd(pA, ks) < 0.72) {
        let a = pick(aw, asum, rnd(pAp, ks));
        if (a === s) a = pick(aw, asum, rnd(pAq, ks));
        if (a !== s) as[a]++;
      }
    }
    if (csum > 0) for (let j = 0; j < played; j++) {
      const js = String(j);
      const u = rnd(pY, js);
      const cards = u < 0.22 ? 0 : u < 0.56 ? 1 : u < 0.83 ? 2 : u < 0.95 ? 3 : 4;
      for (let c = 0; c < cards; c++) ye[pick(cw, csum, rnd(pYp, `${js}:${c}`))]++;
      if (rnd(pR, js) < 0.045) re[pick(cw, csum, rnd(pRp, js))]++;
    }
    const keeper = sorted.find((w) => w[W.pos] === 'TW');
    out.push({ clubId, played, sorted, gl, as, ye, re, keeper, cs: clean.get(clubId) ?? 0 });
  }
  return out;
}

function statsFrom(g: Game, clubIds: string[], list: ScoredGame[], tag: string, n: number, sink?: (l: LeanLine) => void): LeanStats {
  const out = EMPTY();
  const pool = g.worldPool?.p;
  if (!pool?.length) return out;
  let dists: ClubDist[];
  if (memo) {
    let key = `${tag}|${clubIds.join(',')}|`;
    for (const x of list) key += `${x.home},${x.away},${x.hg ?? '-'},${x.ag ?? '-'};`;
    dists = memo.get(key) ?? distribute(g, clubIds, list, tag);
    memo.set(key, dists);
  } else dists = distribute(g, clubIds, list, tag);
  if (n <= 0 && !sink) return out;
  for (const { clubId, played, sorted, gl, as, ye, re, keeper, cs } of dists) {
    if (n <= 0) { // nur Saisonzeilen (leanLines): Bestenlisten blieben ohnehin leer
      sorted.forEach((w, i) => {
        const apps = Math.round(played * (i < 11 ? 0.9 : i < 16 ? 0.4 : 0.1));
        if (apps) sink!({ w, clubId, apps, goals: gl[i], assists: as[i], clean: w === keeper ? cs : 0, played });
      });
      continue;
    }
    const row = (w: WP, value: number): StatRow => ({ pid: w[W.id], name: `${w[W.first]} ${w[W.last]}`.trim(), clubId, pos: w[W.pos], value, apps: played, face: w[W.face], born: w[W.born] });
    sorted.forEach((w, i) => {
      if (gl[i]) out.goals.push(row(w, gl[i]));
      if (as[i]) out.assists.push(row(w, as[i]));
      if (gl[i] + as[i]) out.scorer.push(row(w, gl[i] + as[i]));
      if (ye[i]) out.yellow.push(row(w, ye[i]));
      if (re[i]) out.red.push(row(w, re[i]));
    });
    if (keeper && cs) out.clean.push(row(keeper, cs));
    if (sink) sorted.forEach((w, i) => {
      const apps = Math.round(played * (i < 11 ? 0.9 : i < 16 ? 0.4 : 0.1));
      if (apps) sink({ w, clubId, apps, goals: gl[i], assists: as[i], clean: w === keeper ? cs : 0, played });
    });
  }
  if (n <= 0) return out;
  for (const k of Object.keys(out) as StatCat[]) out[k] = out[k].sort((a, b) => b.value - a.value || DE.compare(a.name, b.name)).slice(0, n);
  return out;
}
/** Wie `localeCompare(…, 'de')`, aber einmal angelegt (localeCompare mit Sprache baut je Aufruf einen Collator). */
const DE = new Intl.Collator('de');
const scorersFrom = (g: Game, clubIds: string[], list: ScoredGame[], tag: string, n: number): StatRow[] => statsFrom(g, clubIds, list, tag, n).goals;

/** Alle Einzelwertungen einer schlanken Liga bis zum heutigen Stand (beste `n` je Wertung). */
export function leanStats(g: Game, d: LeanDiv, season: string, n = 10): LeanStats {
  return d.r ? statsFrom(g, d.ids, leanGames(d, season), `wsc:${season}`, n) : EMPTY();
}
/** Alle Spieler einer schlanken Liga mit ihrer Saisonzeile (gleiche Verteilung wie die Bestenlisten). */
export function leanLines(g: Game, d: LeanDiv, season: string): LeanLine[] {
  const out: LeanLine[] = [];
  if (d.r) statsFrom(g, d.ids, leanGames(d, season), `wsc:${season}`, 0, (l) => out.push(l));
  return out;
}
/**
 * Einzelwertungen einer vereinsweise simulierten Liga des Heimatlandes (2. Liga, Regionalligen …, laufende
 * Saison): dieselbe Verteilung auf die Kader des Spielerpools wie bei den Auslandsligen. null = keine Kader
 * im Pool (z. B. DDR) oder noch kein Spiel.
 */
export function simDivStats(g: Game, ids: string[], fixtures: { homeClubId: string; awayClubId: string; status: string; result?: { homeGoals: number; awayGoals: number } | null }[], season: string, divId: string, n = 10): LeanStats | null {
  const list: ScoredGame[] = [];
  for (const m of fixtures) if (m.status === 'finished' && m.result) list.push({ home: m.homeClubId, away: m.awayClubId, hg: m.result.homeGoals, ag: m.result.awayGoals });
  if (!list.length) return null;
  const st = statsFrom(g, ids, list, `hsd:${season}:${divId}`, n);
  return st.goals.length || st.yellow.length ? st : null;
}
/** Alle Einzelwertungen eines Landespokals über die gespielten Runden. */
export function leanCupStats(g: Game, key: string, season: string, c: LeanCup, n = 10): LeanStats {
  return c.r ? statsFrom(g, c.ids, leanCupRounds(key, season, c).flatMap((r) => r.ties), `wcs:${season}`, n) : EMPTY();
}
/** Für die Historie: je Wertung [Name, Verein, Position, Wert, Gesichtsgruppe, Geburtsjahr]. */
/** Zeile alt: [Name, Verein, Position, Wert, Gesicht, Geburtsjahr]; kompakt: [Nummer in `p`, Wert]. */
type StatRowOld = [string, string, string, number, string, number];
export type PackedStats = WorldPackedStats;
/** Bestenlisten einer Liga speichern: dieselben Spieler stehen in mehreren Wertungen → Spielertabelle `p`. */
export const packStats = (st: LeanStats): PackedStats => {
  const out: PackedStats = { p: [] };
  const idx = new Map<string, number>();
  for (const k of Object.keys(st) as StatCat[]) if (st[k].length) out[k] = st[k].map((r) => {
    const e: [string, string, string, string, number] = [r.name, r.clubId, r.pos, r.face ?? '', r.born ?? 0];
    const key = JSON.stringify(e);
    let i = idx.get(key);
    if (i === undefined) { i = out.p!.length; out.p!.push(e); idx.set(key, i); }
    return [i, r.value];
  });
  return out;
};
export const unpackStats = (p: PackedStats | undefined): LeanStats | null => {
  if (!p) return null;
  const out = EMPTY();
  const row = (x: WorldStatRow): StatRowOld => {
    if (x.length !== 2) return x as StatRowOld;
    const e = p.p?.[x[0] as number];
    return e ? [e[0], e[1], e[2], x[1] as number, e[3], e[4]] : ['', '', 'ZM', x[1] as number, '', 0];
  };
  for (const k of Object.keys(out) as StatCat[]) out[k] = (p[k] ?? []).map((x, i) => { const [name, clubId, pos, value, face, born] = row(x); return { pid: `ws${k}${i}:${name}`, name, clubId, pos, value, apps: 0, face: face || undefined, born: born || undefined }; });
  return out;
};
/** Alte Spielstände: Bestenlisten der Welt-Historie ins kompakte Format, doppelte Torschützenlisten weg (idempotent). */
export function compactWorldStats(rec: { scorers?: Record<string, unknown>; pstats?: Record<string, PackedStats> }): void {
  for (const [k, ps] of Object.entries(rec.pstats ?? {})) {
    if (!ps.p) rec.pstats![k] = packStats(unpackStats(ps)!);
    if (rec.scorers) delete rec.scorers[k]; // gelesen nur, wenn `pstats` fehlt (competitionCountry.ts archivedStats)
  }
  if (rec.scorers && !Object.keys(rec.scorers).length) delete rec.scorers;
}
export function migrateWorldStats(g: Game): void { for (const rec of g.world?.history ?? []) compactWorldStats(rec); }
export const emptyLeanStats = EMPTY;

/** Torschützen einer schlanken Liga bis zum heutigen Stand (beste `n`). */
export function leanScorers(g: Game, d: LeanDiv, season: string, n = 15): StatRow[] {
  return d.r ? scorersFrom(g, d.ids, leanGames(d, season), `wsc:${season}`, n) : [];
}

/** Torschützen eines Landespokals (game/worldCups.ts) über alle gespielten Runden. */
export function leanCupScorers(g: Game, key: string, season: string, c: LeanCup, n = 15): StatRow[] {
  return c.r ? scorersFrom(g, c.ids, leanCupRounds(key, season, c).flatMap((r) => r.ties), `wcs:${season}`, n) : [];
}

/** Für die Historie: [Name, Verein, Position, Tore]. */
export const packScorers = (rows: StatRow[]): [string, string, string, number][] => rows.map((r) => [r.name, r.clubId, r.pos, r.value]);
export const unpackScorers = (list: [string, string, string, number][] | undefined): StatRow[] =>
  (list ?? []).map(([name, clubId, pos, value], i) => ({ pid: `ws${i}:${name}`, name, clubId, pos, value, apps: 0 }));

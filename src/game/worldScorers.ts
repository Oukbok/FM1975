// =============================================================================
// TORSCHÜTZENLISTEN DER AUSLANDSLIGEN (Wunsch Pascal) – ohne Spielereignisse
// -----------------------------------------------------------------------------
// Die Auslandsligen kennen nur Ergebnisse (game/worldLeagues.ts). Die Tore jedes
// Vereins werden Tor für Tor fest auf seinen Kader aus dem Spielerpool verteilt
// (game/worldPool.ts): gewichtet nach Position, Stärke und Stammplatz, der Zufall
// hängt nur an Saison, Verein und laufender Nummer des Tores. So wächst die Liste
// mit jedem Spieltag folgerichtig weiter, ohne dass etwas gespeichert wird.
// Genauso die Landespokale (game/worldCups.ts) mit eigener Zufallsfolge.
// Am Saisonende behält die Welt-Historie die besten zehn je Liga und Pokal
// (`WorldSeasonRecord.scorers`, Schlüssel `Land|Ebene` bzw. `Land|cup`) – die
// Kader ändern sich ja zur neuen Saison.
// =============================================================================
import { hashStr, mulberry32 } from '../engine/leagues';
import type { LeanCup, LeanDiv } from '../engine/world';
import type { StatRow } from './competitionView';
import type { Game } from './state';
import { leanCupRounds } from './worldCups';
import { leanGames } from './worldLeagues';
import { WP_FIELD as W, type WP } from './worldPool';

/** Torgefahr je Position (Mittelstürmer 10 … Torwart 0). */
const POS_W: Record<string, number> = { MS: 10, HS: 8, RA: 5, LA: 5, OM: 4.5, RM: 3, LM: 3, ZM: 2.2, DM: 1, IV: 0.7, RV: 0.6, LV: 0.6, LIB: 0.6, TW: 0 };

interface ScoredGame { home: string; away: string; hg: number | null; ag: number | null }

/**
 * Tore einer Reihe von Spielen fest auf die Kader verteilen (beste `n`).
 * `tag` trennt die Wettbewerbe: dieselbe Mannschaft trifft in Liga und Pokal mit eigener Zufallsfolge.
 */
function scorersFrom(g: Game, clubIds: string[], list: ScoredGame[], tag: string, n: number): StatRow[] {
  const pool = g.worldPool?.p;
  if (!pool?.length) return [];
  const clubs = new Set(clubIds);
  const squads = new Map<string, WP[]>();
  for (const w of pool) {
    if (w[W.youth] || !clubs.has(w[W.club])) continue;
    const l = squads.get(w[W.club]);
    if (l) l.push(w); else squads.set(w[W.club], [w]);
  }
  const goals = new Map<string, number>(), games = new Map<string, number>();
  for (const x of list) {
    if (x.hg == null) continue;
    goals.set(x.home, (goals.get(x.home) ?? 0) + x.hg); goals.set(x.away, (goals.get(x.away) ?? 0) + x.ag!);
    games.set(x.home, (games.get(x.home) ?? 0) + 1); games.set(x.away, (games.get(x.away) ?? 0) + 1);
  }
  const rows: StatRow[] = [];
  for (const [clubId, squad] of squads) {
    const total = goals.get(clubId) ?? 0;
    if (!total) continue;
    // Stammelf voll, Ergänzungsspieler deutlich weniger.
    const sorted = [...squad].sort((a, b) => b[W.ov] - a[W.ov] || a[W.id].localeCompare(b[W.id]));
    const ws = sorted.map((w, i) => (POS_W[w[W.pos]] ?? 1) * Math.pow(w[W.ov] / 70, 3) * (i < 11 ? 1 : i < 16 ? 0.35 : 0.08));
    const sum = ws.reduce((a, b) => a + b, 0);
    if (sum <= 0) continue;
    const cnt = new Array<number>(sorted.length).fill(0);
    for (let k = 0; k < total; k++) {
      let x = mulberry32(hashStr(`${tag}:${clubId}:${k}`))() * sum;
      let i = 0;
      for (; i < ws.length - 1; i++) { x -= ws[i]; if (x <= 0) break; }
      cnt[i]++;
    }
    sorted.forEach((w, i) => { if (cnt[i]) rows.push({ pid: w[W.id], name: `${w[W.first]} ${w[W.last]}`.trim(), clubId, pos: w[W.pos], value: cnt[i], apps: games.get(clubId) ?? 0 }); });
  }
  return rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'de')).slice(0, n);
}

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

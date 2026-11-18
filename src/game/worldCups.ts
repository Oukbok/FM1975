// =============================================================================
// LANDESPOKALE IM AUSLAND MIT ECHTEN RUNDEN (Wunsch Pascal) – schlanke Fassung
// -----------------------------------------------------------------------------
// Jedes Land außer dem Heimatland spielt seinen Pokal Runde für Runde: alle
// Erst- und Zweitligisten, jede Runde neu gelost (wie in den Pokalen der Zeit),
// ein Spiel, bei Gleichstand Verlängerung und Elfmeterschießen. Die erste Runde
// bringt das Feld auf eine Zweierpotenz – wer nicht gezogen wird, hat ein Freilos.
// Vereinfacht wie die Auslandsligen (game/worldLeagues.ts): keine Kader, Ergebnis
// aus der Vereinsstärke (`worldMatchGoals`), gespeichert werden nur die Teilnehmer
// und eine Zeichenkette mit den Ergebnissen (`LeanCup`). Auslosung und Termine
// ergeben sich fest aus Land, Saison und Runde – daraus baut `leanCupRounds` alle
// Runden für die Anzeige (Statistiken › Pokal, Länderwahl).
// Am Saisonende liefert der Pokal den Pokalsieger an die Welt (engine/world.ts
// `FixedCountryResult.cup`) und bleibt in der Historie (`WorldSeasonRecord.cups`).
// =============================================================================
import { cupField } from '../engine/worldReserves';
import { seasonStartYear } from '../data/timeline';
import { hashStr, mulberry32 } from '../engine/leagues';
import { worldMatchGoals, type LeanCup, type WorldLiveCup } from '../engine/world';
import type { Game } from './state';

const DAY = 86_400_000;
const G36 = (n: number) => Math.min(35, Math.max(0, n)).toString(36);

/** Zahl der Runden für ein Feld. */
export const leanCupRoundsN = (n: number): number => Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));

/** Termine der Runden: gleichmäßig von Ende September bis Ende Mai, mittwochs; das Endspiel am Samstag. */
export function leanCupDates(season: string, n: number): string[] {
  const y = seasonStartYear(season);
  const t0 = Date.UTC(y, 8, 22), t1 = Date.UTC(y + 1, 4, 22);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? t1 : t0 + Math.round(((t1 - t0) / DAY) * (i / (n - 1))) * DAY;
    const want = i === n - 1 ? 6 : 3; // Sa bzw. Mi
    const d = t + ((want - new Date(t).getUTCDay() + 7) % 7) * DAY;
    out.push(new Date(d).toISOString().slice(0, 10));
  }
  return out;
}

export function roundName(ties: number, index: number): string {
  return ties === 1 ? 'Finale' : ties === 2 ? 'Halbfinale' : ties === 4 ? 'Viertelfinale' : ties === 8 ? 'Achtelfinale' : `${index + 1}. Runde`;
}

/** Feste Auslosung einer Runde: gemischtes Feld; in der ersten Runde spielen nur so viele, dass eine Zweierpotenz bleibt. */
function drawRound(key: string, season: string, ri: number, field: string[]): { pairs: [string, string][]; byes: string[] } {
  const rnd = mulberry32(hashStr(`wcd:${key}:${season}:${ri}`));
  const list = [...field].sort();
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  let pow = 1;
  while (pow * 2 <= list.length) pow *= 2;
  const m = list.length === pow ? pow / 2 : list.length - pow;
  const pairs: [string, string][] = [];
  for (let i = 0; i < m; i++) pairs.push([list[2 * i], list[2 * i + 1]]);
  return { pairs, byes: list.slice(2 * m) };
}

export interface LeanCupTie { home: string; away: string; hg: number | null; ag: number | null; dec: 0 | 1 | 2; pen?: [number, number]; winner: string | null }
export interface LeanCupRound { index: number; name: string; date: string; ties: LeanCupTie[]; byes: string[]; played: boolean }

/** Alle Runden eines Pokals: gespielte mit Ergebnis, die nächste ausgeloste ohne; spätere Runden fehlen noch. */
export function leanCupRounds(key: string, season: string, c: LeanCup): LeanCupRound[] {
  const n = leanCupRoundsN(c.ids.length);
  const dates = leanCupDates(season, n);
  const out: LeanCupRound[] = [];
  let field = c.ids, off = 0;
  for (let ri = 0; ri < n && field.length > 1; ri++) {
    const { pairs, byes } = drawRound(key, season, ri, field);
    const played = c.r.length >= off + pairs.length * 3;
    const winners: string[] = [];
    const ties = pairs.map(([home, away], i): LeanCupTie => {
      if (!played) return { home, away, hg: null, ag: null, dec: 0, winner: null };
      const o = off + i * 3;
      const hg = parseInt(c.r[o], 36), ag = parseInt(c.r[o + 1], 36), d = Number(c.r[o + 2]);
      let winner = hg > ag ? home : ag > hg ? away : d === 3 ? away : home;
      let pen: [number, number] | undefined;
      if (d >= 2) {
        // Ergebnis des Elfmeterschießens: fest aus dem Spiel abgeleitet (nicht gespeichert).
        const h = hashStr(`wcp:${key}:${season}:${ri}:${i}`) >>> 0;
        const lose = 2 + (h % 3), win = Math.min(5, lose + 1 + ((h >>> 3) % 2));
        pen = d === 2 ? [win, lose] : [lose, win];
        winner = d === 2 ? home : away;
      }
      winners.push(winner);
      return { home, away, hg, ag, dec: d >= 2 ? 2 : (d as 0 | 1), pen, winner };
    });
    out.push({ index: ri, name: roundName(pairs.length, ri), date: dates[ri], ties, byes, played });
    if (!played) break;
    off += pairs.length * 3;
    field = [...winners, ...byes];
  }
  return out;
}

/** Sieger eines zu Ende gespielten Pokals (sonst null). */
export function leanCupWinner(key: string, season: string, c: LeanCup): string | null {
  const rounds = leanCupRounds(key, season, c);
  const last = rounds[rounds.length - 1];
  return last && last.played && last.ties.length === 1 ? last.ties[0].winner : null;
}

/** Teilnehmerfeld: alle Erst- und Zweitligisten des Landes (mindestens vier, B-Teams nach Landesregel). */
export function newLeanCup(g: Game, tiers: string[][], countryKey?: string): WorldLiveCup | null {
  // B-Teams nur, wenn das Land sie im Pokal zulässt (engine/worldReserves.ts).
  const all = [...new Set([...(tiers[0] ?? []), ...(tiers[1] ?? [])])].filter((id) => g.euroClubs?.[id]).sort();
  const ids = countryKey ? cupField(countryKey, Number(g.season.slice(0, 4)), all) : all;
  if (ids.length < 4) return null;
  return { ids, r: '', rd: 0, n: leanCupRoundsN(ids.length) };
}

/** Die nächste Runde spielen (Ergebnisse an `r` anhängen). */
export function playCupRound(g: Game, key: string, season: string, c: WorldLiveCup): void {
  const rounds = leanCupRounds(key, season, c);
  const cur = rounds[rounds.length - 1];
  if (!cur || cur.played) { c.rd = c.n; return; }
  const rnd = mulberry32(hashStr(`wcg:${key}:${season}:${cur.index}`));
  let out = '';
  for (const t of cur.ties) {
    const sh = g.euroClubs?.[t.home]?.strength ?? 50, sa = g.euroClubs?.[t.away]?.strength ?? 50;
    let [hg, ag] = worldMatchGoals(sh, sa, rnd);
    let dec = 0;
    if (hg === ag) {
      const p = 1 / (1 + Math.exp(-(sh - sa) / 6));
      if (rnd() < 0.42) { if (rnd() < p) hg++; else ag++; dec = 1; } // Entscheidung in der Verlängerung
      else dec = rnd() < 0.5 + (p - 0.5) * 0.3 ? 2 : 3; // Elfmeterschießen
    }
    out += G36(hg) + G36(ag) + String(dec);
  }
  c.r += out;
  c.rd = cur.index + 1;
  if (cur.ties.length === 1) c.rd = c.n;
}

/** Täglich: fällige Pokalrunden aller Länder spielen (holt nach dem Laden nach). */
export function worldCupsDaily(g: Game, season: string, cups: Record<string, WorldLiveCup>, today: string): void {
  for (const [key, c] of Object.entries(cups)) {
    if (c.rd >= c.n) continue;
    const dates = leanCupDates(season, c.n);
    let guard = 0;
    while (c.rd < c.n && dates[c.rd] <= today && guard++ < 12) playCupRound(g, key, season, c);
  }
}

/** Saisonende: alle Pokale zu Ende spielen; Sieger je Land und die Pokale für die Historie. */
export function finishWorldCups(g: Game, season: string, cups: Record<string, WorldLiveCup>): { winners: Record<string, string>; cups: Record<string, LeanCup> } {
  const winners: Record<string, string> = {}, keep: Record<string, LeanCup> = {};
  for (const [key, c] of Object.entries(cups)) {
    let guard = 0;
    while (c.rd < c.n && guard++ < 12) playCupRound(g, key, season, c);
    const w = leanCupWinner(key, season, c);
    if (w) { winners[key] = w; keep[key] = { ids: c.ids, r: c.r }; }
  }
  return { winners, cups: keep };
}

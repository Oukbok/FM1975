// =============================================================================
// DIE BESTEN DER SAISON — Wertung (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Am Saisonende kürt die Liga mit vollen Kadern (Liga des eigenen Vereins) je
// Mannschaftsteil – Torwart, Abwehr, Mittelfeld, Sturm – die drei Besten. Dazu
// „Spieler der Saison“ und „Newcomer der Saison“ (höchstens 21 Jahre).
// Spielablauf/Archiv: game/seasonAwardsGame.ts. Oberfläche: views/statistiken/awards/.
//
// Formel (Wertungspunkte, höher = besser) – nur Ligaspiele:
//   Leistung        3,0 × (4,0 − Notenschnitt)               (Note 2,5 → 4,5 Punkte)
//   Einsätze        1,0 × Einsätze / Spieltage
//   Mannschaft      1,0 × (Mannschaften − Platz) / (Mannschaften − 1)   (Meister 1,0, Letzter 0)
//   Torwart         3,0 × Zu-null-Quote + 1,5 × (1,6 − Gegentore je Spiel), 0 … 1,2
//   Abwehr          2,0 × Zu-null-Quote + 1,0 × (1,6 − Gegentore je Spiel) + 2,0 × (Tore + Vorlagen) je Spiel
//   Mittelfeld      4,0 × (0,7 × Tore + Vorlagen) je Spiel
//   Sturm           5,0 × (Tore + 0,4 × Vorlagen) je Spiel
// Wertbar ist, wer mindestens die Hälfte der Spieltage gespielt hat (Newcomer: 40 %).
// Gesamtsieger und Newcomer werden über den Abstand zur eigenen Konkurrenz
// verglichen (Standardabweichungen über dem Mittel des Mannschaftsteils), damit
// Torhüter und Stürmer fair gegeneinander stehen.
// =============================================================================
import type { PositionGroup } from '../types';

export type AwardCat = PositionGroup; // 'GK' | 'DEF' | 'MID' | 'ATT'
export const AWARD_CATS: AwardCat[] = ['GK', 'DEF', 'MID', 'ATT'];
export const AWARD_CAT_LABEL: Record<AwardCat, string> = { GK: 'Torwart', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Sturm' };
const CAT_PLURAL: Record<AwardCat, string> = { GK: 'Torhüter', DEF: 'Abwehrspieler', MID: 'Mittelfeldspieler', ATT: 'Stürmer' };

/** Eingabe je Spieler (Ligastatistik der Saison). */
export interface AwardCandidate {
  pid: string;
  name: string;
  clubId: string;
  clubName: string;
  pos: string;
  cat: AwardCat;
  age: number;
  apps: number;
  /** Notenschnitt (1,0 sehr gut … 6,0). */
  avg: number;
  goals: number;
  assists: number;
  /** Zu-null-Spiele, in denen er auf dem Platz stand. */
  clean: number;
  /** Gegentore je Spiel seiner Mannschaft. */
  gaPerGame: number;
  /** Tabellenplatz seiner Mannschaft (1 = Meister). */
  rank: number;
}

export interface AwardContext {
  /** Spieltage der Saison (je Mannschaft). */
  matchdays: number;
  /** Mannschaften der Liga. */
  teams: number;
}

export interface AwardPart { k: string; v: number }
export interface ScoredCandidate extends AwardCandidate { score: number; parts: AwardPart[] }

export interface AwardResult {
  cats: Record<AwardCat, ScoredCandidate[]>;
  /** Kategorie des Spielers der Saison (er ist dort Platz 1). */
  best: AwardCat | null;
  /** Newcomer (≤ 21), falls einer wertbar ist. */
  rookie: ScoredCandidate | null;
  /** Begründungen (Platz 1–3 je Kategorie, Newcomer) je Spieler-ID. */
  why: Record<string, string>;
}

export const MIN_SHARE = 0.5;
export const ROOKIE_SHARE = 0.4;
export const ROOKIE_AGE = 21;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Wertungspunkte eines Spielers samt Einzelbeiträgen (für Begründung und i-Hilfe). */
export function awardScore(c: AwardCandidate, ctx: AwardContext): { score: number; parts: AwardPart[] } {
  const per = (v: number) => v / Math.max(1, c.apps);
  const parts: AwardPart[] = [
    { k: 'Leistung', v: 3.0 * (4.0 - c.avg) },
    { k: 'Einsätze', v: 1.0 * clamp(c.apps / Math.max(1, ctx.matchdays), 0, 1) },
    { k: 'Mannschaft', v: ctx.teams > 1 ? (ctx.teams - c.rank) / (ctx.teams - 1) : 0 },
  ];
  const defence = clamp(1.6 - c.gaPerGame, 0, 1.2);
  if (c.cat === 'GK') {
    parts.push({ k: 'Zu null', v: 3.0 * per(c.clean) }, { k: 'Gegentore', v: 1.5 * defence });
  } else if (c.cat === 'DEF') {
    parts.push({ k: 'Zu null', v: 2.0 * per(c.clean) }, { k: 'Gegentore', v: 1.0 * defence }, { k: 'Torbeteiligung', v: 2.0 * per(c.goals + c.assists) });
  } else if (c.cat === 'MID') {
    parts.push({ k: 'Torbeteiligung', v: 4.0 * per(0.7 * c.goals + c.assists) });
  } else {
    parts.push({ k: 'Tore', v: 5.0 * per(c.goals + 0.4 * c.assists) });
  }
  for (const p of parts) p.v = r2(p.v);
  return { score: r2(parts.reduce((a, p) => a + p.v, 0)), parts };
}

export function minApps(ctx: AwardContext, share = MIN_SHARE): number {
  return Math.max(1, Math.ceil(ctx.matchdays * share));
}

const fmtAvg = (v: number) => v.toFixed(2).replace('.', ',');

/** Kurze Begründung (ein Satz) – nennt das, was ihn heraushebt. */
function reason(c: ScoredCandidate, all: ScoredCandidate[], ctx: AwardContext, leagueTopScorer: number): string {
  const same = all.filter((x) => x.cat === c.cat);
  const bestAvg = same.every((x) => x.avg >= c.avg);
  const bits: string[] = [];
  if (c.cat === 'GK') {
    bits.push(`${c.clean} Spiele zu null, Notenschnitt ${fmtAvg(c.avg)}`);
    if (same.every((x) => x.gaPerGame >= c.gaPerGame)) bits.push('die wenigsten Gegentore aller Stammtorhüter');
  } else if (c.cat === 'DEF') {
    bits.push(`Notenschnitt ${fmtAvg(c.avg)}, ${c.clean} Spiele zu null`);
    if (c.goals + c.assists >= 6) bits.push(`dazu ${c.goals} Tore und ${c.assists} Vorlagen`);
  } else if (c.cat === 'MID') {
    bits.push(`${c.goals} Tore und ${c.assists} Vorlagen, Notenschnitt ${fmtAvg(c.avg)}`);
  } else {
    bits.push(`${c.goals} Tore und ${c.assists} Vorlagen in ${c.apps} Spielen`);
    if (c.goals > 0 && c.goals >= leagueTopScorer) bits.push('Torschützenkönig');
  }
  if (bestAvg && c.cat !== 'GK') bits.push(`bester Notenschnitt aller ${CAT_PLURAL[c.cat]}`);
  if (c.rank === 1) bits.push('Meister');
  else if (c.rank >= ctx.teams - 2 && ctx.teams > 6) bits.push('stark trotz Abstiegskampf');
  return bits.join(' – ').replace(/^./, (s) => s.toUpperCase()) + '.';
}

/** Mittel und Streuung der Wertung einer Gruppe. */
function spread(list: ScoredCandidate[]): { mean: number; sd: number } {
  if (!list.length) return { mean: 0, sd: 1 };
  const mean = list.reduce((a, c) => a + c.score, 0) / list.length;
  const sd = Math.sqrt(list.reduce((a, c) => a + (c.score - mean) ** 2, 0) / list.length);
  return { mean, sd: Math.max(0.25, sd) };
}

/** Komplette Wertung einer Liga. */
export function computeAwards(cands: AwardCandidate[], ctx: AwardContext): AwardResult {
  const need = minApps(ctx);
  const needRookie = minApps(ctx, ROOKIE_SHARE);
  const scored: ScoredCandidate[] = cands
    .filter((c) => c.apps >= needRookie && Number.isFinite(c.avg) && c.avg > 0)
    .map((c) => ({ ...c, ...awardScore(c, ctx) }));
  const sortFn = (a: ScoredCandidate, b: ScoredCandidate) => b.score - a.score || a.avg - b.avg || b.apps - a.apps || a.pid.localeCompare(b.pid);
  const eligible = scored.filter((c) => c.apps >= need);
  const cats = {} as Record<AwardCat, ScoredCandidate[]>;
  const stat = {} as Record<AwardCat, { mean: number; sd: number }>;
  for (const cat of AWARD_CATS) {
    const list = eligible.filter((c) => c.cat === cat).sort(sortFn);
    stat[cat] = spread(list);
    cats[cat] = list.slice(0, 3);
  }
  const z = (c: ScoredCandidate) => (c.score - stat[c.cat].mean) / stat[c.cat].sd;
  let best: AwardCat | null = null;
  for (const cat of AWARD_CATS) {
    const w = cats[cat][0];
    if (w && (!best || z(w) > z(cats[best][0]))) best = cat;
  }
  const rookies = scored.filter((c) => c.age <= ROOKIE_AGE).sort((a, b) => z(b) - z(a) || sortFn(a, b));
  const rookie = rookies[0] ?? null;

  const topScorer = Math.max(0, ...cands.map((c) => c.goals));
  const why: Record<string, string> = {};
  for (const cat of AWARD_CATS) for (const c of cats[cat]) why[c.pid] = reason(c, eligible, ctx, topScorer);
  if (rookie && !why[rookie.pid]) why[rookie.pid] = reason(rookie, eligible, ctx, topScorer);
  return { cats, best, rookie, why };
}

/** Prüft die Grundannahmen der Formel (für Tests): bessere Note → mehr Punkte. */
export function awardFormulaText(): string[] {
  return [
    'Leistung: 3 × (4,0 − Notenschnitt)',
    'Einsätze: Anteil der Spieltage (bis 1 Punkt)',
    'Mannschaftserfolg: Meister 1 Punkt, Letzter 0',
    'Torwart: Zu-null-Quote × 3 und wenige Gegentore',
    'Abwehr: Zu-null-Quote × 2, wenige Gegentore, Torbeteiligung',
    'Mittelfeld: Tore (× 0,7) und Vorlagen je Spiel × 4',
    'Sturm: Tore (und 0,4 × Vorlagen) je Spiel × 5',
  ];
}

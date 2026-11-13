// =============================================================================
// Anzeigedaten der Spielertabelle im Transfermarkt (Wunsch Pascal, Vorbild EA FM):
// je Spieler Schätzung (game/playerPool.ts: Bekanntheit → Spannen), Sterne für
// Fähigkeit und Potenzial (sicherer Teil + geschätzter Teil), Spannen für
// Transferwert und Gehalt, Empfehlung gegen den eigenen Kader, Info-Etiketten.
// Nur gelesen – nichts wird am Spielstand geändert.
// =============================================================================
import type { Player } from '../types';
import { potentialToStars } from '../types';
import { positionGroup } from '../engine/positions';
import type { Game } from './state';
import { estimate, knowCtx, knowledge, poolRows, type Estimate, type PoolRow } from './playerPool';
import { scoutReport } from './scoutingGame';

export interface StarRange { lo: number; hi: number }
export interface Recommendation { grade: string; text: string; tone: 1 | 2 | 3 | 4 | 5 | 0 }
export interface MarketInfo {
  k: number;
  est: Estimate | null;
  ability: StarRange;
  potential: StarRange;
  value: [number, number];
  wage: [number, number];
  rec: Recommendation;
  tags: string[];
  scouted: boolean;
}

const q4 = (x: number) => Math.round(x * 4) / 4;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const starsOf = (ov: number) => clamp(q4(potentialToStars(ov)), 0.5, 5);
const months = (from: string, to: string) => {
  const a = new Date(from + 'T00:00:00Z'), b = new Date(to + 'T00:00:00Z');
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
};

/** Startelf-Plätze je Mannschaftsteil (Richtwert für die Empfehlung). */
const STARTERS: Record<string, number> = { GK: 1, DEF: 4, MID: 4, ATT: 2 };

/** Empfehlung: geschätzte Stärke gegen den eigenen Kader im selben Mannschaftsteil. */
function recommend(g: Game, p: Player, est: Estimate | null, k: number): Recommendation {
  if (!est || k < 0.22) return { grade: '–', text: 'Scouting erforderlich', tone: 0 };
  const grp = positionGroup(p.naturalPosition);
  const own = (g.clubs[g.managedClubId]?.playerIds ?? []).map((id) => g.players[id]).filter((x): x is Player => !!x && positionGroup(x.naturalPosition) === grp)
    .map((x) => x.overall).sort((a, b) => b - a);
  const best = own[0] ?? 0;
  const lastStarter = own[(STARTERS[grp] ?? 2) - 1] ?? 0;
  const ov = est.ov;
  const young = p.age <= 21 && est.st >= 3.75;
  if (ov >= best + 3) return { grade: '1+', text: 'Schlüsselspieler', tone: 5 };
  if (ov >= best) return { grade: '1', text: 'Sofort Leistungsträger', tone: 5 };
  if (ov >= lastStarter + 3) return { grade: '2+', text: 'Stammspieler', tone: 4 };
  if (ov >= lastStarter) return { grade: '2', text: 'Kandidat für die Startelf', tone: 4 };
  if (young) return { grade: '2-', text: 'Großes Talent', tone: 4 };
  if (ov >= lastStarter - 5) return { grade: '3', text: 'Ergänzung für die Breite', tone: 3 };
  if (p.age <= 23 && est.st >= 3.25) return { grade: '3-', text: 'Talent für später', tone: 3 };
  return { grade: '4', text: 'Keine Verstärkung', tone: 1 };
}

/** Marktdaten für eine Liste von Spielern (Bekanntheit einmal je Aufruf). */
export function marketInfo(g: Game, list: Player[]): Map<string, MarketInfo> {
  const rows = new Map<string, PoolRow>();
  for (const r of poolRows(g).rows) rows.set(r.id, r);
  const ctx = knowCtx(g);
  const today = g.calendar.currentDate;
  const out = new Map<string, MarketInfo>();
  for (const p of list) {
    const r = rows.get(p.id);
    const k = r ? knowledge(ctx, r) : p.clubId === g.managedClubId ? 1 : 0.3;
    const est = r ? estimate(r, k) : null;
    const u = 1 - k;
    const ability = est ? { lo: starsOf(est.ovLo), hi: starsOf(est.ovHi) } : { lo: starsOf(p.overall), hi: starsOf(p.overall) };
    const potential = est ? { lo: clamp(q4(est.stLo), 0.5, 5), hi: clamp(q4(est.stHi), 0.5, 5) } : { lo: q4(p.potentialStars), hi: q4(p.potentialStars) };
    const v = est?.value ?? p.contract.transferValue;
    const vs = u * 0.45;
    const value: [number, number] = vs < 0.04 ? [v, v] : [v * (1 - vs), v * (1 + vs)];
    const w = p.contract.weeklyWage;
    const ws = u * 0.35;
    const wage: [number, number] = ws < 0.04 ? [w, w] : [w * (1 - ws), w * (1 + ws)];
    const tags: string[] = [];
    const m = months(today, p.contract.expiryDate);
    if (m <= 6) tags.push('Ablösefrei bald');
    else if (m <= 12) tags.push('Vertrag endet');
    if (p.transferListed) tags.push('Transferliste');
    if ((p.intl?.caps ?? 0) >= 5) tags.push('Nationalspieler');
    if (p.loan) tags.push('Leihe');
    out.set(p.id, { k, est, ability, potential, value, wage, rec: recommend(g, p, est, k), tags, scouted: k >= 0.7 || scoutReport(g, p.id) != null });
  }
  return out;
}

/** Kurzform der Etiketten für die Info-Spalte. */
export const TAG_SHORT: Record<string, string> = { 'Ablösefrei bald': 'Frei', 'Vertrag endet': 'Vtr', Transferliste: 'Liste', Nationalspieler: 'Nat', Leihe: 'Leihe' };

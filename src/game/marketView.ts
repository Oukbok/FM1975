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
import { wageForOverall } from '../engine/economy';
import { marketValueFor } from '../engine/clubEconomy';
import { isForeignId } from '../engine/world';
import { worldClubs } from './worldPool';
import { scoutReport } from './scoutingGame';

export interface StarRange { lo: number; hi: number }
export interface Recommendation { grade: string; text: string; tone: 1 | 2 | 3 | 4 | 5 | 0 }
export interface MarketInfo {
  k: number;
  est: Estimate;
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
type OwnDepth = Map<string, { best: number; last: number }>;
/** Eigener Kader je Mannschaftsteil: bester Spieler und letzter Startelf-Platz. */
function ownDepth(g: Game): OwnDepth {
  const by = new Map<string, number[]>();
  for (const id of g.clubs[g.managedClubId]?.playerIds ?? []) {
    const x = g.players[id];
    if (!x) continue;
    const k = positionGroup(x.naturalPosition);
    (by.get(k) ?? by.set(k, []).get(k)!).push(x.overall);
  }
  const out: OwnDepth = new Map();
  for (const k of Object.keys(STARTERS)) {
    const xs = (by.get(k) ?? []).sort((a, b) => b - a);
    out.set(k, { best: xs[0] ?? 0, last: xs[(STARTERS[k] ?? 2) - 1] ?? 0 });
  }
  return out;
}

function recommend(depth: OwnDepth, p: { pos: Player['naturalPosition']; age: number }, est: Estimate | null, k: number): Recommendation {
  if (!est || k < 0.22) return { grade: '–', text: 'Scouting erforderlich', tone: 0 };
  const d = depth.get(positionGroup(p.pos)) ?? { best: 0, last: 0 };
  const best = d.best, lastStarter = d.last;
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

/** Marktdaten je Zeile des Spielerpools (volle Spieler und Weltspieler). */
export function marketInfoRows(g: Game, rows: PoolRow[]): Map<string, MarketInfo> {
  const ctx = knowCtx(g);
  const depth = ownDepth(g);
  const today = g.calendar.currentDate;
  const out = new Map<string, MarketInfo>();
  for (const r of rows) {
    const p = r.player;
    const k = p?.clubId === g.managedClubId ? 1 : knowledge(ctx, r);
    const est = estimate(r, k);
    const u = 1 - k;
    const ability = { lo: starsOf(est.ovLo), hi: starsOf(est.ovHi) };
    const potential = { lo: clamp(q4(est.stLo), 0.5, 5), hi: clamp(q4(est.stHi), 0.5, 5) };
    const v = est.value;
    const vs = u * 0.45;
    const value: [number, number] = vs < 0.04 ? [v, v] : [v * (1 - vs), v * (1 + vs)];
    // Gehalt: bei vollen Spielern der Vertrag, bei Weltspielern das Marktgehalt zur Stärke.
    const w = p?.contract.weeklyWage ?? wageForOverall(r.ov);
    const ws = Math.max(p ? 0 : 0.12, u * 0.35);
    const wage: [number, number] = ws < 0.04 ? [w, w] : [w * (1 - ws), w * (1 + ws)];
    const tags: string[] = [];
    if (p) {
      const m = months(today, p.contract.expiryDate);
      if (m <= 6) tags.push('Ablösefrei bald');
      else if (m <= 12) tags.push('Vertrag endet');
      if (p.transferListed) tags.push('Transferliste');
      if ((p.intl?.caps ?? 0) >= 5) tags.push('Nationalspieler');
      if (p.loan) tags.push('Leihe');
    }
    if (r.youth) tags.push('Jugend');
    out.set(r.id, { k, est, ability, potential, value, wage, rec: recommend(depth, { pos: r.pos, age: r.age }, est, k), tags, scouted: k >= 0.7 || scoutReport(g, r.id) != null });
  }
  return out;
}

/** Zeilen des Spielerpools zu vollen Spielern (Transfermarkt, Beobachtung). */
export function rowsFor(g: Game, list: Player[]): PoolRow[] {
  const byId = new Map<string, PoolRow>();
  for (const r of poolRows(g).rows) byId.set(r.id, r);
  const world = worldClubs(g);
  const year = Number(g.calendar.currentDate.slice(0, 4));
  // Nicht im Pool (z. B. alte Europapokal-Kader `w_*`): Land/Liga aus den Weltvereinen, Marktwert frisch berechnet.
  return list.map((p) => byId.get(p.id) ?? ({
    id: p.id, kind: 'pro', name: p.fullName, clubId: p.clubId, country: world.get(p.clubId)?.country ?? 'Deutschland', level: world.get(p.clubId)?.level ?? 1, nat: p.nationality, face: p.face, age: p.age,
    born: Number(p.dateOfBirth.slice(0, 4)), pos: p.naturalPosition, ov: p.overall, pot: p.development?.potentialAbility ?? p.overall, value: isForeignId(p.clubId) ? marketValueFor(p, year) : p.contract.transferValue,
    youth: false, foot: p.preferredFoot, height: p.height, contractEnd: p.contract.expiryDate, player: p,
  } as unknown as PoolRow));
}

/** Kurzform der Etiketten für die Info-Spalte. */
export const TAG_SHORT: Record<string, string> = { 'Ablösefrei bald': 'Frei', 'Vertrag endet': 'Vtr', Transferliste: 'Liste', Nationalspieler: 'Nat', Leihe: 'Leihe', Jugend: 'Jgd' };

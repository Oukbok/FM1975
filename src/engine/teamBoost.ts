// =============================================================================
// TEAMBONUS DURCH FÜHRUNGSSPIELER (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Sehr seltene Spieler mit überragender Führungsstärke UND Erfahrung reißen die
// Mannschaft mit: Bronze +0,5 %, Silber +1 %, Gold +2 % auf Angriff, Spielkontrolle
// und Abwehr ihrer Mannschaft, solange sie auf dem Platz stehen (zusammen höchstens
// +3 %; engine/match/state.ts wie Stab und Heimstärke).
// Verliehen wird die Qualität NUR in der Auf- und Abwertungsrunde (development.ts
// runRatingCeremony → `teamBoostRound`). Wer im Alter 10 % seiner Bestform verloren hat,
// verliert sie langsam wieder (Chance steigt), ab 15 % drastisch.
// Ziel: im ganzen Spiel mit vollen Kadern durchschnittlich etwa 5–20 Träger.
// =============================================================================
import type { Player } from '../types';

export type TeamBoost = 'bronze' | 'silver' | 'gold';
export const BOOST_PCT: Record<TeamBoost, number> = { bronze: 0.005, silver: 0.01, gold: 0.02 };
export const BOOST_DE: Record<TeamBoost, string> = { bronze: 'Bronze', silver: 'Silber', gold: 'Gold' };
export const TEAM_BOOST_CAP = 0.03;
const ORDER: TeamBoost[] = ['bronze', 'silver', 'gold'];

/** Führungswert aus Führungsstärke und Erfahrung (0–100). */
export const leaderScore = (p: Player) => (p.attributes.leadership ?? 50) * 0.55 + (p.attributes.experience ?? 50) * 0.45;

/** Stufe, für die ein Spieler infrage kommt (oder null). */
export function boostTier(p: Player): TeamBoost | null {
  const a = p.attributes;
  if ((a.leadership ?? 0) < 76 || (a.experience ?? 0) < 66 || p.overall < 66 || p.age < 25) return null;
  const s = leaderScore(p);
  return s >= 85 ? 'gold' : s >= 81 ? 'silver' : s >= 77 ? 'bronze' : null;
}

/** Summe der Teamboni einer Mannschaft auf dem Platz (höchstens +3 %). */
export function teamBoostOf(players: Player[]): number {
  let s = 0;
  for (const p of players) if (p.teamBoost) s += BOOST_PCT[p.teamBoost];
  return Math.min(TEAM_BOOST_CAP, s);
}

/** Verlust von Bestform (0..1) gegenüber dem Höchstwert der Karriere. */
export const peakDrop = (p: Player) => {
  const peak = Math.max(p.development.peakOverall ?? p.overall, p.overall);
  return peak > 0 ? Math.max(0, 1 - p.overall / peak) : 0;
};

/** Chance je Bewertungsrunde, die Qualität zu verlieren (Alter, Formverlust). */
export function loseChance(p: Player): number {
  const d = peakDrop(p);
  if (d < 0.10) return 0.004;
  if (d < 0.15) return 0.03 + (d - 0.10) * 3;   // 3 % … 18 %
  return Math.min(0.9, 0.3 + (d - 0.15) * 8);    // ab 30 %, steil
}

export interface BoostChange { kind: 'neu' | 'auf' | 'verloren'; from?: TeamBoost; to?: TeamBoost }

/**
 * Eine Bewertungsrunde: Bestform merken, Qualität verleihen/aufwerten/verlieren.
 * `rng` deterministisch je Spieler und Runde. Kleine Runden verleihen seltener.
 */
export function teamBoostRound(p: Player, rng: () => number, big: boolean): BoostChange | null {
  const d = p.development;
  d.peakOverall = Math.max(d.peakOverall ?? p.overall, p.overall);
  const cur = p.teamBoost;
  if (cur) {
    if (rng() < loseChance(p)) { delete p.teamBoost; return { kind: 'verloren', from: cur }; }
    const tier = boostTier(p);
    if (tier && ORDER.indexOf(tier) > ORDER.indexOf(cur) && rng() < (big ? 0.25 : 0.1)) {
      p.teamBoost = ORDER[ORDER.indexOf(cur) + 1];
      return { kind: 'auf', from: cur, to: p.teamBoost };
    }
    return null;
  }
  if (peakDrop(p) >= 0.08) return null; // auf dem absteigenden Ast wird niemand mehr Anführer
  const tier = boostTier(p);
  if (!tier || rng() >= (big ? 0.18 : 0.06)) return null;
  p.teamBoost = tier === 'gold' ? 'silver' : 'bronze'; // man fängt klein an, Gold nur über Aufwertung
  if (tier === 'gold' && rng() < 0.3) p.teamBoost = 'gold';
  return { kind: 'neu', to: p.teamBoost };
}

/** Satz für die Bewertungsrunde. */
export function boostText(b: BoostChange): string {
  const pct = (t: TeamBoost) => `+${String(BOOST_PCT[t] * 100).replace('.', ',')} %`;
  if (b.kind === 'neu') return `Neuer Führungsspieler: Teambonus ${BOOST_DE[b.to!]} (${pct(b.to!)})`;
  if (b.kind === 'auf') return `Führungsspieler steigt auf: Teambonus ${BOOST_DE[b.to!]} (${pct(b.to!)})`;
  return `Verliert seinen Teambonus (${BOOST_DE[b.from!]}) – die einstige Klasse ist dahin`;
}

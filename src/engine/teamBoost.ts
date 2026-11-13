// =============================================================================
// TEAMBONUS DURCH FÜHRUNGSSPIELER (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Sehr seltene Spieler mit überragender Führungsstärke UND Erfahrung reißen die
// Mannschaft mit: Bronze +0,5 %, Silber +1 %, Gold +2 % auf Angriff, Spielkontrolle
// und Abwehr ihrer Mannschaft, solange sie auf dem Platz stehen (zusammen höchstens
// +3 %; engine/match/state.ts wie Stab und Heimstärke).
// Verliehen wird die Qualität NUR in der Auf- und Abwertungsrunde (development.ts
// runRatingCeremony → `teamBoostRound`). Maßstab ist die HÖCHSTE jemals erreichte Stärke
// (nicht die Form): Wer im Alter 10 % davon verloren hat, verliert den Bonus langsam wieder
// (Chance steigt), ab 15 % drastisch. Auch die Vergabe richtet sich nach der Höchststärke.
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

/** Höchste jemals erreichte Stärke (gemerkter Höchstwert, Stärke-Verlauf, aktuelle Stärke). */
export function peakOf(p: Player): number {
  let m = Math.max(p.overall, p.development.peakOverall ?? 0);
  for (const h of p.development.abilityHistory ?? []) if (h.ability > m) m = h.ability;
  return m;
}

/** Höchststärke merken (aufgerufen bei jeder Neuberechnung der Stärke). */
export function notePeak(p: Player): void {
  const d = p.development;
  if (d) d.peakOverall = peakOf(p);
}

/**
 * Geschätzte Höchststärke für Spieler, die schon im Karriereherbst erzeugt werden
 * (Startkader 1975, Nachrücker): typischer Abbau je Alter, ohne Zufall.
 */
export function estimatedPeak(age: number, overall: number): number {
  const loss = age <= 30 ? 0 : age === 31 ? 0.03 : age === 32 ? 0.06 : age === 33 ? 0.1 : age === 34 ? 0.14 : age === 35 ? 0.18 : 0.23;
  return Math.min(99, Math.round(overall / (1 - loss)));
}

/** Stufe, für die ein Spieler infrage kommt (oder null) – Stärke = Höchststärke der Karriere. */
export function boostTier(p: Player): TeamBoost | null {
  const a = p.attributes;
  if ((a.leadership ?? 0) < 76 || (a.experience ?? 0) < 66 || peakOf(p) < 66 || p.age < 25) return null;
  const s = leaderScore(p);
  return s >= 85 ? 'gold' : s >= 81 ? 'silver' : s >= 77 ? 'bronze' : null;
}

/** Summe der Teamboni einer Mannschaft auf dem Platz (höchstens +3 %). */
export function teamBoostOf(players: Player[]): number {
  let s = 0;
  for (const p of players) if (p.teamBoost) s += BOOST_PCT[p.teamBoost];
  return Math.min(TEAM_BOOST_CAP, s);
}

/** Verlust (0..1) der aktuellen Stärke gegenüber der höchsten jemals erreichten Stärke. */
export const peakDrop = (p: Player) => {
  const peak = peakOf(p);
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
 * Eine Bewertungsrunde: Höchststärke merken, Qualität verleihen/aufwerten/verlieren.
 * `rng` deterministisch je Spieler und Runde. Kleine Runden verleihen seltener.
 */
export function teamBoostRound(p: Player, rng: () => number, big: boolean): BoostChange | null {
  notePeak(p);
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
  if (peakDrop(p) >= 0.10) return null; // ab 10 % unter der Höchststärke keine neue Vergabe mehr
  const tier = boostTier(p);
  if (!tier || rng() >= (big ? 0.14 : 0.05)) return null;
  p.teamBoost = tier === 'gold' ? 'silver' : 'bronze'; // man fängt klein an, Gold nur über Aufwertung
  if (tier === 'gold' && rng() < 0.3) p.teamBoost = 'gold';
  return { kind: 'neu', to: p.teamBoost };
}

/** Satz für die Bewertungsrunde. */
export function boostText(b: BoostChange): string {
  const pct = (t: TeamBoost) => `+${String(BOOST_PCT[t] * 100).replace('.', ',')} %`;
  if (b.kind === 'neu') return `Neuer Führungsspieler: Teambonus ${BOOST_DE[b.to!]} (${pct(b.to!)})`;
  if (b.kind === 'auf') return `Führungsspieler steigt auf: Teambonus ${BOOST_DE[b.to!]} (${pct(b.to!)})`;
  return `Verliert seinen Teambonus (${BOOST_DE[b.from!]}) – zu weit unter seiner einstigen Höchststärke`;
}

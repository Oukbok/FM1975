// =============================================================================
// TRAINER DES JAHRES (Heimatland) — Wertung (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Vorbild ist die Wahl der Fachpresse am Saisonende. Belohnt wird, wer mehr aus
// seiner Mannschaft holt, als man erwarten durfte – oder große Titel gewinnt.
//   Leistung    6,0 × (erwarteter Platz − Endplatz) / (Mannschaften − 1)
//               erwarteter Platz = Mittel aus Stärke-Rang des Kaders und Saisonziel
//   Meister     +1,0, dazu +0,5 je Platz, den der Meister schlechter erwartet war (höchstens +1,5)
//               – der klare Favorit gewinnt die Wahl nicht automatisch jedes Jahr
//   Pokalsieger +0,8
//   Europapokal Sieg: Landesmeister/Meisterliga 2,5 · Pokalsieger 1,8 · UEFA-/Europa-Pokal 1,8;
//               sonst erreichte Runde: Gewicht × (Runde / letzte Runde)², Gewicht 1,2/0,8/0,8
//   Abstieg     −1,5
//   Amtszeit    unter einer vollen Saison anteilig (mindestens 40 %)
// =============================================================================

export type CoachEuro = 'ec' | 'cwc' | 'uefa';
const EURO_WIN: Record<CoachEuro, number> = { ec: 2.5, cwc: 1.8, uefa: 1.8 };
const EURO_RUN: Record<CoachEuro, number> = { ec: 1.2, cwc: 0.8, uefa: 0.8 };

export interface CoachCandidate {
  clubId: string; clubName: string; coach: string;
  rank: number; expected: number; teams: number;
  champion: boolean; cup: boolean;
  /** Europapokal: Wettbewerb, erreichte Runde (0-basiert), Zahl der Runden, gewonnen. */
  euro?: { comp: CoachEuro; round: number; rounds: number; won: boolean; label: string; name: string };
  /** Anteil der Saison im Amt (0..1). */
  tenure: number;
}
export interface CoachScored extends CoachCandidate { score: number; why: string }

export function coachScore(c: CoachCandidate): number {
  let s = 6 * (c.expected - c.rank) / Math.max(1, c.teams - 1);
  if (c.champion) s += 1.0 + 0.5 * Math.min(3, Math.max(0, c.expected - 1));
  if (c.cup) s += 0.8;
  if (c.euro) s += c.euro.won ? EURO_WIN[c.euro.comp] : EURO_RUN[c.euro.comp] * (c.euro.round / Math.max(1, c.euro.rounds - 1)) ** 2;
  if (c.rank > c.teams - 3) s -= 1.5;
  return Math.round(s * Math.max(0.4, Math.min(1, c.tenure)) * 100) / 100;
}

/** Ein Satz Begründung. */
export function coachReason(c: CoachCandidate): string {
  const bits: string[] = [];
  if (c.euro?.won) bits.push(`Sieg im ${c.euro.name}`);
  if (c.champion && c.cup) bits.push('Double aus Meisterschaft und Pokal');
  else if (c.champion) bits.push('Meisterschaft');
  else if (c.cup) bits.push('Pokalsieg');
  const diff = c.expected - c.rank;
  if (diff >= 2) bits.push(`Platz ${c.rank} statt des erwarteten ${c.expected}. Platzes`);
  else if (!c.champion) bits.push(`Platz ${c.rank} in der Abschlusstabelle`);
  if (c.euro && !c.euro.won && c.euro.round >= c.euro.rounds - 3) bits.push(`${c.euro.label} im ${c.euro.name}`);
  if (c.tenure < 0.9) bits.push('erst während der Saison übernommen');
  return bits.join(' – ').replace(/^./, (s) => s.toUpperCase()) + '.';
}

export function rankCoaches(cands: CoachCandidate[], n = 3): CoachScored[] {
  return cands
    .map((c) => ({ ...c, score: coachScore(c), why: coachReason(c) }))
    .sort((a, b) => b.score - a.score || a.rank - b.rank || a.clubId.localeCompare(b.clubId))
    .slice(0, n);
}

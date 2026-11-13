// =============================================================================
// ERFAHRUNG (Wunsch Pascal): wächst mit Pflichtspielen, wirkt auf die Konstanz
// (Streuung der Tagesform, match/skills.ts `dayForm`) und in wichtigen Spielen
// leicht auf die Leistung (Nervenstärke unter Druck, `nerveF`).
// -----------------------------------------------------------------------------
// Zuwachs je Spiel ≈ 0,18 × Spielanteil × Wettbewerb × Alter × (1 − Erfahrung/110):
// ein 20-Jähriger mit 40 Einsätzen gewinnt ≈ 5 Punkte je Saison, ein erfahrener
// Spieler (70) noch ≈ 2–3. Bruchteile sammeln sich in `development.expProg`, die
// Attribut-Zahl bleibt ganzzahlig. Aufruf aus match/finish.ts.
// =============================================================================
import type { Player } from '../types';

const COMP = { Liga: 1, Pokal: 1.15, Europapokal: 1.5 } as const;

export function addExperience(p: Player, minutes: number, competition: keyof typeof COMP, pressure = 0): void {
  const a = p.attributes;
  const exp = a.experience ?? 50;
  if (exp >= 99 || minutes <= 0) return;
  const share = Math.min(1, minutes / 90);
  const age = p.age <= 22 ? 1.2 : p.age >= 32 ? 0.7 : 1;
  const gain = 0.18 * share * COMP[competition] * (1 + pressure * 0.3) * age * Math.max(0.05, 1 - exp / 110);
  const dev = p.development as Player['development'] & { expProg?: number };
  const prog = (dev.expProg ?? 0) + gain;
  const whole = Math.floor(prog);
  dev.expProg = Math.round((prog - whole) * 1000) / 1000;
  if (whole > 0) a.experience = Math.min(99, exp + whole);
}

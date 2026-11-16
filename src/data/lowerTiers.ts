// Niveau der Vereine ab der 3. Ebene (Start in 3. Liga/Regionalliga, Aufstieg in eine untere Spielerliga).
/** Niveau eines Vereins der 3./4. Ebene (Wunsch Pascal: Start in der 3. Liga/Regionalliga):
 *  Kadergrundwert eine Stufe unter der 2. Liga (Basis = 35 + Ruf/2 → `squadRep`), Ruf und
 *  Stadion für einige tausend Zuschauer. Auch für die Vorschau im Assistenten (clubPreview.ts) und data/generate.ts `buildProClub`. */
export function lowerTierLevel(strength: number, tier: number): { squadRep: number; reputation: number; capacity: number } {
  const base = Math.max(48, Math.min(62, (tier === 3 ? 56 : 53) + (strength - 46) * 0.6));
  return {
    squadRep: Math.round(2 * (base - 35)),
    reputation: Math.max(25, Math.min(55, Math.round(strength - 8 - (tier - 3) * 3))),
    capacity: Math.max(2500, Math.min(15000, Math.round(((3000 + (strength - 40) * 650) * (tier === 3 ? 1 : 0.7)) / 500) * 500)),
  };
}

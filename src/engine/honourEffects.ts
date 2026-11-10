// =============================================================================
// Wirkungen der Vereinsauszeichnungen (Wunsch Pascal) – Lesezugriff für die Engine
// -----------------------------------------------------------------------------
// Die Auszeichnungen selbst (Hürden, Stufen, Laufzeit) liegen in game/clubHonours.ts
// und data/clubHonours.ts. Hier nur eine kleine Tabelle Verein → Wirkungssumme, die
// game/clubHonours.ts `bindHonours` beim Laden, beim Spielstart, täglich bei einem
// neuen Spielstand und nach jeder Saisonwertung setzt. So brauchen Engine-Module
// (Nachfrage, Match, Wünsche, Kredite …) keinen Zugriff auf den ganzen Spielstand.
// Ohne Tabelle (Tests, alte Spielstände ohne Auszeichnungen) ist jede Wirkung 0.
// =============================================================================

/** Wirkungsschlüssel; Werte sind Anteile (0,05 = 5 %), `interest` in Prozentpunkten (0,005 = 0,5 pp). */
export type HonourEffectKey =
  | 'youthAppeal' | 'youngWage' | 'youthDev'
  | 'appeal' | 'wage' | 'foreignAppeal' | 'defAppeal' | 'coachAppeal'
  | 'sponsor' | 'cupDemand' | 'tickets' | 'demand' | 'merch' | 'members'
  | 'homeStrength' | 'moraleHold' | 'renewWage' | 'interest' | 'feeCut' | 'agentCut';

export type HonourEffects = Partial<Record<HonourEffectKey, number>>;

let table: Record<string, HonourEffects> = {};

export function setHonourTable(t: Record<string, HonourEffects>): void { table = t; }

/** Summe einer Wirkung für einen Verein (0 ohne aktive Auszeichnung). */
export function honourFx(clubId: string | undefined, key: HonourEffectKey): number {
  if (!clubId) return 0;
  return table[clubId]?.[key] ?? 0;
}

// -----------------------------------------------------------------------------
// Stab des eigenen Vereins (Wunsch Pascal): unbesetzte Stellen kosten etwas Spielstärke.
// Gesetzt von game/staffGame.ts `bindStaffFactor` (täglich), gelesen in match/state.ts.
// -----------------------------------------------------------------------------
let staffFactor: Record<string, number> = {};
export function setStaffFactor(t: Record<string, number>): void { staffFactor = t; }
/** Faktor auf die Teamstärke (1 = neutral, < 1 = Stab fehlt). */
export function staffStrength(clubId: string | undefined): number {
  return clubId ? staffFactor[clubId] ?? 1 : 1;
}

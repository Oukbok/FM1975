// =============================================================================
// Länder „Spiel für Spiel“ – ABGELÖST (game/worldLeagues.ts)
// -----------------------------------------------------------------------------
// Früher liefen im Assistenten gewählte Länder als eigene Divisionen (tier ≥ 200) wie die
// 2. Liga. Seit der schlanken Spieltag-Simulation laufen ALLE Auslandsligen Spieltag für
// Spieltag (Tabellen, Begegnungen, Auf-/Abstieg) – mit dem Stärkemodell der Welt, kleinerem
// Spielstand und denselben Regeln für jedes Land. Diese Datei räumt nur noch ältere
// Spielstände auf: Divisionen und Sim-Vereine der früheren „Spiel für Spiel“-Länder
// werden entfernt; die Abschlusstabellen vergangener Saisons bleiben im Liga-Archiv
// (Schlüssel `x-<land>-<liga>`) und werden unter Statistiken › Liga weiter gezeigt.
// =============================================================================
import type { Game } from './state';

export const FULL_TIER_BASE = 200;
export const isFullDivision = (d: { tier: number }) => d.tier >= FULL_TIER_BASE;

/** Ältere Spielstände: frühere „Spiel für Spiel“-Divisionen entfernen (true = es gab welche). */
export function retireFullCountries(g: Game): boolean {
  const had = !!g.fullCountries?.length || !!g.fullAll || g.leagues.otherDivisions.some(isFullDivision);
  if (!had) return false;
  g.leagues.otherDivisions = g.leagues.otherDivisions.filter((d) => !isFullDivision(d));
  for (const id of Object.keys(g.simClubs ?? {})) if (g.simClubs[id].tier >= FULL_TIER_BASE) delete g.simClubs[id];
  delete g.fullCountries;
  delete g.fullAll;
  return true;
}

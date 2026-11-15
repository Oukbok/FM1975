// Rückennummern aller Vereine (Wunsch Pascal: Spieler anderer Vereine brauchen Rückennummern).
// Regeln in engine/shirtNumbers.ts. Spielbeginn: alle Kader nach Position; Laden: KI-Kader
// einmalig neu (Markierung `game.shirtsV`), eigener Verein behält seine Nummern, Weltspieler
// und schon angelegte Weltspieler-Objekte bekommen ihre Nummer. Idempotent.
import { shirtSeasonOf } from '../engine/shirtNumbers';
import type { Player } from '../types';
import type { Game } from './state';
import { assignShirtNumbers, renumberSquad } from './squads';
import { numberWorldPool, worldEntry, WP_FIELD as W } from './worldPool';

/** Spielbeginn: jeder Kader nach Position (noch hat niemand eine Nummer gewählt). */
export function startShirtNumbers(g: Game): void {
  const year = shirtSeasonOf(g.calendar.currentDate);
  for (const c of Object.values(g.clubs)) renumberSquad(c, g.players, year);
  if (g.worldPool) numberWorldPool(g.worldPool, year);
  g.shirtsV = 1;
}

/** Laden: Nachrüstung älterer Spielstände. */
export function migrateShirtNumbers(g: Game): void {
  const year = shirtSeasonOf(g.calendar.currentDate);
  for (const c of Object.values(g.clubs)) {
    if (!g.shirtsV && c.id !== g.managedClubId) renumberSquad(c, g.players, year);
    else assignShirtNumbers(c, g.players, year);
  }
  g.shirtsV = 1;
  if (!g.worldPool) return;
  numberWorldPool(g.worldPool, year);
  // Weltspieler, die schon als volle Spieler angelegt sind (Verhandlung), aber in keinem Kader stehen.
  for (const p of Object.values(g.players) as (Player & { world?: boolean })[]) {
    if (!p.world || p.shirtNumber) continue;
    const w = worldEntry(g, p.id);
    if (w) p.shirtNumber = w[W.shirt] ?? 0;
  }
}

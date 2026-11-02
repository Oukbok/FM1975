// =============================================================================
// Spielplan aus der Taktik: Wie oft greift eine Mannschaft über welchen Weg an
// (Kombination durch die Mitte, Flanke, Steilpass, Dribbling, langer Ball), wie
// hoch fliegen die Flanken, wie oft wird aus der Distanz geschossen, wie stark
// wirken Pressing, Linie, Härte und Abseitsfalle in den Einzelduellen?
// Neutral (alle Regler 50, kurz, gemischt) ergibt die Epochen-Grundverteilung.
// =============================================================================
import type { Tactics } from '../../types';
import type { TacticMods } from './team';

export type Route = 'kurz' | 'flanke' | 'steil' | 'dribbling' | 'weit';
export const ROUTES: Route[] = ['kurz', 'flanke', 'steil', 'dribbling', 'weit'];

export interface TacticPlan {
  /** Gewichte der Angriffswege (Summe 1). */
  route: Record<Route, number>;
  /** Anteil hoher Flanken (Rest flach). */
  highCross: number;
  /** Neigung zum Distanzschuss nach einer Kombination (Anteil). */
  longShot: number;
  /** Logit-Verschiebungen in Duellen (positiv = Vorteil der eigenen Seite). */
  passBias: number;     // eigene Pässe kommen an (kurz/ruhig besser, Tempo/lang riskanter)
  pressBias: number;    // eigenes Pressing: gegnerische Pässe werden eher abgefangen
  tackleBias: number;   // eigene Zweikämpfe in der Abwehr (Härte, Einsatz)
  workBias: number;     // eigene Laufduelle/Dribblings im Angriff (Einsatz)
  lineHigh: number;     // -1 tief … +1 hoch: Raum hinter der Abwehr / Abseits
  trap: number;         // Abseitsfalle 0/1
  /** Eigene Konter nach Ballgewinn (Faktor). */
  counter: number;
  /** Fouls in Duellen (Faktor). */
  foul: number;
}

const norm = (v: number | undefined) => ((v ?? 50) - 50) / 50;

/** Grundverteilung der Angriffswege je Epoche (mehr Flanken und lange Bälle in den 70ern). */
function eraRoutes(year: number): Record<Route, number> {
  if (year < 1985) return { kurz: 0.24, flanke: 0.36, steil: 0.11, dribbling: 0.12, weit: 0.17 };
  if (year < 1995) return { kurz: 0.25, flanke: 0.36, steil: 0.11, dribbling: 0.12, weit: 0.16 };
  if (year < 2008) return { kurz: 0.28, flanke: 0.35, steil: 0.12, dribbling: 0.12, weit: 0.14 };
  return { kurz: 0.31, flanke: 0.33, steil: 0.13, dribbling: 0.13, weit: 0.1 };
}

export function tacticPlan(t: Tactics | undefined, year: number, mods?: TacticMods): TacticPlan {
  const r = eraRoutes(year);
  const width = norm(t?.widthFocus), tempo = norm(t?.tempo), press = norm(t?.pressing), line = norm(t?.defensiveLine);
  const hard = norm(t?.tackleHardness), eff = norm(t?.effort);
  const long = t?.buildup === 'long';
  // Breite: Flügel ↔ Mitte
  r.flanke *= 1 + 0.75 * width;
  r.kurz *= 1 - 0.4 * width;
  r.steil *= 1 - 0.2 * width;
  r.dribbling *= 1 + 0.1 * width;
  // Aufbau: lang = direkt (lange Bälle, Steilpässe), kurz = Kombination
  if (long) { r.weit *= 2.1; r.steil *= 1.2; r.kurz *= 0.65; r.flanke *= 1.08; }
  else { r.kurz *= 1.1; r.weit *= 0.65; }
  // Tempo: vertikaler, mehr Steilpässe und Dribblings, weniger Geduld
  r.steil *= 1 + 0.45 * tempo;
  r.dribbling *= 1 + 0.2 * tempo;
  r.kurz *= 1 - 0.2 * tempo;
  // Grundausrichtung
  if (t?.style === 'attacking') { r.dribbling *= 1.12; r.steil *= 1.1; }
  if (t?.style === 'defensive') { r.weit *= 1.25; r.kurz *= 0.92; }
  if (t?.style === 'counter') { r.steil *= 1.2; r.kurz *= 0.85; }
  // Zuruf „Über die Flügel“
  if (mods) r.flanke *= mods.cross;
  let sum = 0;
  for (const k of ROUTES) sum += r[k];
  for (const k of ROUTES) r[k] /= sum;

  const eraHigh = year < 1990 ? 0.72 : year < 2005 ? 0.62 : 0.52;
  const cs = t?.crossStyle ?? 'mixed';
  const highCross = cs === 'high' ? Math.min(0.92, eraHigh + 0.25) : cs === 'low' ? Math.max(0.15, eraHigh - 0.35) : eraHigh;
  const eraLong = year < 1985 ? 0.5 : year < 1995 ? 0.45 : year < 2008 ? 0.38 : 0.3;
  return {
    route: r,
    highCross,
    longShot: eraLong * (1 - 0.15 * tempo) * (t?.style === 'defensive' ? 1.1 : 1),
    passBias: (long ? -0.15 : 0.1) - 0.25 * tempo,
    pressBias: 0.3 * press + 0.1 * line,
    tackleBias: 0.32 * hard + 0.22 * eff,
    workBias: 0.15 * eff,
    lineHigh: line,
    trap: t?.offsideTrap ? 1 : 0,
    counter: (t?.style === 'counter' ? 1.55 : t?.style === 'attacking' ? 0.95 : 1) * (1 + 0.25 * tempo) * (1 + 0.3 * press),
    foul: (1 + 0.3 * hard + 0.15 * press) * (1 + 0.1 * eff),
  };
}

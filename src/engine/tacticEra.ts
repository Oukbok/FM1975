// =============================================================================
// TAKTIK IM WANDEL DER JAHRZEHNTE (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Welche Anweisung gibt es wann, und was schließt sich aus?
//  - Stufen statt Regler: jede Anweisung hat fünf Stufen (Werte 10/30/50/70/90).
//  - Raumdeckung kommt Anfang der 80er auf (Vorreiter mit Pressing und Abseitsfalle; nie mit Libero),
//    wirkt aber erst mit eingespielter Mannschaft und setzt sich in den 90ern durch.
//  - Angriffspressing (höchste Pressing-Stufe) ab 1988 – wie der Trainingsbaustein
//    „Pressing & Umschalten“ (engine/weeklyTraining.ts).
//  - Gegenpressing (sofortiges Nachsetzen nach Ballverlust) ab 2008.
//  - Abwehrlinie: mit Libero höchstens „normal“ (der freie Mann steht hinter der Linie),
//    in Manndeckung höchstens „hoch“, „sehr hoch“ nur mit Raumdeckung.
//  - Abseitsfalle: mit Libero etwas schwächer (85 %).
// Die Grenzen gelten für alle Vereine: die Engine rechnet immer mit `effectiveTactics`.
// =============================================================================
import type { Tactics } from '../types';
import { getFormation } from '../data/formations';

export const STEPS = [10, 30, 50, 70, 90] as const;
const clampI = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** Stufe 0–4 eines Reglerwerts (alte Spielstände mit freien Werten: nächste Stufe). */
export const stepOf = (v: number | undefined): number => clampI(Math.round(((v ?? 50) - 10) / 20), 0, 4);
export const stepValue = (i: number): number => STEPS[clampI(Math.round(i), 0, 4)];

export const ZONE_FROM = 1981;
export const HIGH_PRESS_FROM = 1988;
export const COUNTERPRESS_FROM = 2008;
/** Ab hier ist Raumdeckung der Normalfall (Voreinstellung für Taktiken ohne Angabe). */
export const ZONE_DEFAULT_FROM = 1996;

export type Marking = 'man' | 'zone';
/** Deckungsart, die gilt (Altbestand ohne Angabe: Manndeckung, ab Mitte der 90er Raumdeckung; mit Libero immer Manndeckung). */
export const markingOf = (t: Tactics | undefined, year: number): Marking =>
  !getFormation(t?.formation).libero && ((t?.marking === 'zone' && year >= ZONE_FROM) || (!t?.marking && year >= ZONE_DEFAULT_FROM)) ? 'zone' : 'man';

/** Wie gut der Fußball der Zeit die Raumdeckung beherrscht (0,7 Anfang der 80er … 1 ab 1996). */
export const zoneKnowhow = (year: number): number => clampI(0.7 + (year - ZONE_FROM) * 0.02, 0.7, 1);

export interface TacticLimits {
  libero: boolean;
  /** Raumdeckung wählbar. */
  zone: boolean;
  /** Gegenpressing wählbar. */
  counterPress: boolean;
  /** Höchste wählbare Stufe (0–4). */
  maxPressStep: number;
  maxLineStep: number;
  /** Wirkung der Abseitsfalle (1 = voll, 0,85 mit Libero). */
  trapFactor: number;
}

export function tacticLimits(t: Tactics | undefined, year: number): TacticLimits {
  const libero = !!getFormation(t?.formation).libero;
  const zone = markingOf(t, year) === 'zone';
  return {
    libero,
    zone: year >= ZONE_FROM && !libero,
    counterPress: year >= COUNTERPRESS_FROM,
    maxPressStep: year >= HIGH_PRESS_FROM ? 4 : 3,
    maxLineStep: libero ? 2 : zone ? 4 : 3,
    trapFactor: libero ? 0.85 : 1,
  };
}

/** Obergrenze als Reglerwert: bis knapp unter die nächste Stufe (freie KI-Werte bleiben erhalten). */
const capOf = (step: number) => (step >= 4 ? 100 : stepValue(step) + 9);

/** Taktik, wie sie die Engine rechnet: Werte auf die Grenzen der Epoche und der Formation gekappt. */
export function effectiveTactics(t: Tactics | undefined, year: number): Tactics | undefined {
  if (!t) return t;
  const lim = tacticLimits(t, year);
  const press = Math.min(t.pressing ?? 50, capOf(lim.maxPressStep));
  const line = Math.min(t.defensiveLine ?? 50, capOf(lim.maxLineStep));
  const marking = markingOf(t, year);
  const cp = !!t.counterPress && lim.counterPress;
  if (press === t.pressing && line === t.defensiveLine && marking === t.marking && cp === !!t.counterPress) return t;
  return { ...t, pressing: press, defensiveLine: line, marking, counterPress: cp };
}

/** Kurzer Epochen-Steckbrief für die Taktik-Seite: was die Zeit prägt und was als Nächstes kommt. */
export function tacticEraNotes(year: number): { now: string[]; next: { year: number; text: string } | null } {
  const now: string[] = [];
  if (year < 1990) now.push('Abseits schon bei gleicher Höhe – Steilpässe laufen öfter ins Abseits.');
  else if (year < 2005) now.push('Gleiche Höhe ist kein Abseits mehr (seit 1990).');
  else now.push('Passives Abseits wird nicht mehr gepfiffen (seit 2005) – die Falle ist riskanter.');
  if (year < 1992) now.push('Der Torwart darf Rückpässe aufnehmen.');
  else now.push('Rückpassregel: der Torwart muss mitspielen.');
  if (year < ZONE_FROM) now.push('Manndeckung mit Libero ist Standard.');
  else if (year < ZONE_DEFAULT_FROM) now.push('Raumdeckung ist möglich, aber noch Sache der Vorreiter.');
  else now.push('Raumdeckung mit Viererkette ist Standard.');
  const steps: [number, string][] = [
    [ZONE_FROM, 'Raumdeckung wird wählbar.'],
    [HIGH_PRESS_FROM, 'Angriffspressing: die höchste Pressing-Stufe.'],
    [1990, 'Neue Abseitsregel: gleiche Höhe ist kein Abseits.'],
    [1992, 'Rückpassregel und mitspielender Torwart.'],
    [COUNTERPRESS_FROM, 'Gegenpressing nach Ballverlust.'],
  ];
  const n = steps.find(([y]) => y > year);
  return { now, next: n ? { year: n[0], text: n[1] } : null };
}

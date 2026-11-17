// =============================================================================
// PASST DIE TAKTIK ZUM KADER? (Wunsch Pascal) – Profil der Spieler auf dem Platz,
// das die Wirkung der Anweisungen verschiebt (engine/match/tacticPlan.ts):
//   • Passspiel: riskanter Aufbau (lang/schnell) kostet mit guten Passspielern
//     kaum Ballverluste und wird zur besten Wahl; mit schwachen sehr viele. Sicheres
//     Passspiel liefert immer solide.
//   • Laufstärke (Ausdauer, Einsatzwille): hohes Pressing wirkt stärker bzw. schwächer.
//   • Tempo der Abwehr: eine hohe Linie mit schnellen Verteidigern ist kaum zu
//     überlaufen, mit langsamen ein Risiko.
//   • Dribbling/Antritt: hohes Tempo bringt mehr gewonnene Dribblings.
//   • Flanken und Lufthoheit: Flügelspiel und hohe Flanken lohnen sich nur damit.
// Jede Größe −1 … +1, gemessen am eigenen Durchschnitt der sechs Werte (zu 70 %) und am
// festen Bezug 62 ≈ solider Erstligist (zu 30 %): Es zählt vor allem das Profil – was kann
// diese Elf besser als anderes –, eine Spitzenelf ist nicht überall „stark“. Die Hinweise
// des Trainerteams (components/tactics/TacticHints.tsx) lesen dasselbe Profil –
// ohne Zahlen, der Spieler soll ausprobieren.
// =============================================================================
import type { Player } from '../../types';

export interface TeamFit { pass: number; engine: number; pace: number; dribble: number; cross: number; aerial: number }
export const NEUTRAL_FIT: TeamFit = { pass: 0, engine: 0, pace: 0, dribble: 0, cross: 0, aerial: 0 };

const REF = 62;
const SPREAD = 11;
const q = (v: number, ref: number) => Math.max(-1, Math.min(1, (v - ref) / SPREAD));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : REF);
const DEF = /^(LIB|IV|RV|LV)$/;
const WIDE = /^(RV|LV|RM|LM|RA|LA)$/;
const ATT = /^(MS|HS|OM|RA|LA)$/;

/** Profil aus Feldspielern und ihren Positionen (Startelf bzw. auf dem Platz). */
export function teamFit(list: { p: Player; pos: string }[]): TeamFit {
  const field = list.filter((x) => x.pos !== 'TW');
  if (!field.length) return NEUTRAL_FIT;
  const a = (x: { p: Player }) => x.p.attributes;
  const pass = avg(field.map((x) => a(x).passing * 0.55 + a(x).vision * 0.25 + a(x).firstTouch * 0.2));
  const engine = avg(field.map((x) => a(x).stamina * 0.6 + a(x).workRate * 0.4));
  const defs = field.filter((x) => DEF.test(x.pos));
  const pace = avg((defs.length ? defs : field).map((x) => a(x).speed * 0.6 + a(x).acceleration * 0.4));
  const dribble = avg(field.filter((x) => !DEF.test(x.pos)).map((x) => a(x).dribbling * 0.55 + a(x).acceleration * 0.25 + a(x).agility * 0.2));
  const wide = field.filter((x) => WIDE.test(x.pos));
  const cross = avg((wide.length ? wide : field).map((x) => a(x).crossing));
  const att = field.filter((x) => ATT.test(x.pos));
  const aerial = avg((att.length ? att : field).map((x) => a(x).heading * 0.6 + a(x).jumping * 0.4));
  const ref = 0.7 * ((pass + engine + pace + dribble + cross + aerial) / 6) + 0.3 * REF;
  return { pass: q(pass, ref), engine: q(engine, ref), pace: q(pace, ref), dribble: q(dribble, ref), cross: q(cross, ref), aerial: q(aerial, ref) };
}

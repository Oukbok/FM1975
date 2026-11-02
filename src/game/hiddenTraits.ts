// =============================================================================
// Verdeckte Spielerwerte als EINSCHÄTZUNG (nie als exakte Zahl)
// =============================================================================
// Konstanz, Nervenstärke, Verletzungsanfälligkeit und Entwicklungstempo stehen
// in `Player.development` und bleiben verdeckt. Die Oberfläche zeigt nur ein
// grobes Urteil, dessen Treffsicherheit von der Kenntnis abhängt:
//  - eigener Spieler: Trainerteam, wächst mit der Zeit im Verein (+ Scouting);
//  - fremder Spieler: Scouts (`scoutKnowledge`), etwas mehr bei langer Karriere.
// Jeder Spieler hat je Wert einen festen Schätzfehler (aus der ID), der mit
// wachsender Kenntnis schrumpft – das Urteil kann also danebenliegen.
// =============================================================================
import type { Player } from '../types';
import type { Game } from './state';
import { hash01 } from '../engine/transferMarket';
import { yearsAtClub } from './playerWishesGame';
import { scoutKnowledge } from './transferTalks';
import { staffEffectsOf } from './staffGame';

export type HiddenTrait = 'konstanz' | 'nerven' | 'verletzung' | 'tempo';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Wahrer Wert 0–100 (hoch = „mehr davon“; bei Verletzung = anfälliger). */
function trueValue(p: Player, t: HiddenTrait): number {
  const d = p.development;
  if (t === 'konstanz') return d.consistency ?? 50;
  if (t === 'nerven') return d.bigMatchTemperament ?? 50;
  if (t === 'verletzung') return d.injuryProneness ?? 30;
  return clamp(((d.growthRate ?? 1) - 0.5) / 1.5 * 100, 0, 100);
}

/** Wörter je Wert, von niedrig nach hoch, mit den Untergrenzen der Stufen. */
const WORDS: Record<HiddenTrait, [number, string][]> = {
  konstanz: [[0, 'schwankt stark'], [42, 'mal so, mal so'], [60, 'meist verlässlich'], [75, 'sehr konstant']],
  nerven: [[0, 'wirkt nervös'], [42, 'unauffällig'], [60, 'wirkt gefestigt'], [75, 'nervenstark']],
  verletzung: [[0, 'robust'], [30, 'normal'], [55, 'anfällig']],
  tempo: [[0, 'langsam'], [22, 'normal'], [44, 'schnell']],
};

export const HIDDEN_LABEL: Record<HiddenTrait, string> = {
  konstanz: 'Konstanz', nerven: 'Nervenstärke', verletzung: 'Verletzungsanfälligkeit', tempo: 'Entwicklungstempo',
};

/**
 * Wie gut kennt dein Verein diesen Spieler (0–1)?
 * Eigene Spieler: 0,25 + 0,3 je Jahr im Verein (+ Scouting), höchstens 0,95.
 * Fremde: Scouting-Kenntnis × 0,8 (+ bis 0,15 für lange Karrieren), höchstens 0,7.
 * Ohne Spielstand (z. B. Vorschau): 0,3.
 */
export function hiddenKnowledge(g: Game | undefined, p: Player): number {
  if (!g) return 0.3;
  const scouting = staffEffectsOf(g).scouting ?? 0;
  if (p.clubId === g.managedClubId) {
    return clamp(0.25 + yearsAtClub(p, g.calendar.currentDate) * 0.3 + scouting * 1.5, 0, 0.95);
  }
  const career = Math.min(0.15, (p.careerStats?.appearances ?? 0) / 1500);
  return clamp(scoutKnowledge(g, p) * 0.8 + career, 0, 0.7);
}

export interface HiddenEstimate {
  /** Urteil, z. B. „wirkt nervenstark“; `null` = noch kein Urteil. */
  word: string | null;
  /** Wer urteilt. */
  source: 'Trainerteam' | 'Scouts';
  /** Sicherheit in Worten. */
  certainty: 'erster Eindruck' | 'Einschätzung' | 'gesichert';
}

/** Grobe Einschätzung eines verdeckten Werts. */
export function estimateHidden(p: Player, t: HiddenTrait, knowledge: number, own: boolean): HiddenEstimate {
  const source = own ? 'Trainerteam' : 'Scouts';
  const k = clamp(knowledge, 0, 1);
  const certainty = k >= 0.75 ? 'gesichert' : k >= 0.45 ? 'Einschätzung' : 'erster Eindruck';
  if (k < 0.2) return { word: null, source, certainty };
  // Fester Schätzfehler je Spieler und Wert, schrumpft mit der Kenntnis (bis ±24 → ±2).
  const err = 26 - 24 * k;
  const v = trueValue(p, t) + (hash01(`${p.id}|hidden|${t}`) * 2 - 1) * err;
  const words = WORDS[t];
  let word = words[0][1];
  for (const [min, w] of words) if (v >= min) word = w;
  return { word, source, certainty };
}

/** Bequemer Zugriff: Einschätzung aus Sicht deines Vereins. */
export function hiddenFor(g: Game | undefined, p: Player, t: HiddenTrait): HiddenEstimate {
  return estimateHidden(p, t, hiddenKnowledge(g, p), !!g && p.clubId === g.managedClubId);
}

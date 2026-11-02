// =============================================================================
// Einzelduelle der Match-Engine: Welche Attribute entscheiden welche Aktion?
// Jede Fähigkeit ist ein gewichteter Mittelwert passender Attribute (0–100),
// skaliert mit Tagesform, Kraft und (mild) der Eignung für die gespielte Position.
// Ein Duell wird logistisch entschieden: 60 gegen 85 gewinnt der Bessere in
// gut drei von vier Fällen – deutlich, aber mit Zufall.
// =============================================================================
import type { MPlayer } from './types';
import { cachedSuitability } from './team';

/** Breite der Duell-Kurve: Differenz / DUEL_K = Logit-Vorsprung. */
export const DUEL_K = 21;

export const logistic = (x: number) => 1 / (1 + Math.exp(-x));

/** Gewinnwahrscheinlichkeit von a gegen d (bias = Logit-Verschiebung für die Situation). */
export function duelP(a: number, d: number, bias = 0): number {
  return logistic((a - d) / DUEL_K + bias);
}

/**
 * Spieler-Faktor ohne Kraft: Tagesform × Tagesleistung (Konstanz) × milde Positionseignung
 * (Kopfball bleibt Kopfball, auch fehlbesetzt). Die Kraft wirkt beim Abruf (`energyF`).
 */
export function phys(m: MPlayer): number {
  // Eignungsfaktor zwischenspeichern; ändert sich nur mit der Position (Wechsel, Torwart-Ersatz).
  if (m.fitBase !== m.base) {
    const nat = cachedSuitability(m.p, m.p.naturalPosition) || 1;
    m.fitF = 0.55 + 0.45 * Math.min(1.02, Math.max(0.55, m.base / Math.max(1, nat * 0.82 + Math.min(m.p.overall, nat) * 0.18)));
    m.fitBase = m.base;
  }
  return m.cond * (m.fitF ?? 1) * (m.day ?? 1);
}
/** Kraft im Spiel: müde Spieler verlieren bis zu 18 % in jedem Duell. */
export const energyF = (m: MPlayer): number => 0.82 + 0.18 * m.energy / 100;

/**
 * Tagesleistung aus der Konstanz: niedrige Konstanz streut stärker (gleiches Mittel),
 * Erfahrung stabilisiert leicht. Wird je Spiel einmal gewürfelt (MatchSim).
 */
export function dayForm(m: MPlayer, rng: () => number): number {
  const cons = m.p.development?.consistency ?? 60;
  const exp = m.p.attributes.experience ?? 50;
  const sigma = Math.max(0.01, 0.015 + (100 - cons) / 100 * 0.055 - exp / 100 * 0.01);
  // Summe von drei Gleichverteilungen ≈ Normalverteilung (Mittel 0, Streuung 1)
  const g = (rng() + rng() + rng() - 1.5) * 2;
  return Math.max(0.85, Math.min(1.15, 1 + g * sigma));
}

/**
 * Nervenstärke unter Druck (Big-Match-Temperament + Ruhe am Ball). `pressure` 0–1 aus der Spielsituation
 * (Derby, Pokal, Europapokal, enge Schlussphase, Elfmeterschießen). Faktor um 1, bis etwa ±6 %.
 */
export function nerveF(m: MPlayer, pressure: number): number {
  if (pressure <= 0) return 1;
  const nerve = (m.p.development?.bigMatchTemperament ?? 55) * 0.6 + m.p.attributes.composure * 0.4;
  return 1 + (nerve - 55) / 100 * 0.14 * pressure;
}

const A = (m: MPlayer) => m.p.attributes;
const heightBonus = (m: MPlayer) => 50 + ((m.p.height || 182) - 182) * 2.2;

// --- Ballführung & Zweikampf --------------------------------------------------
const raw_dribbleSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.dribbling * 0.34 + a.ballControl * 0.2 + a.agility * 0.12 + a.balance * 0.1 + a.acceleration * 0.14 + a.flair * 0.1) * phys(m);
};
const raw_tackleSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.tackling * 0.34 + a.strength * 0.15 + a.aggression * 0.08 + a.acceleration * 0.13 + a.marking * 0.15 + a.positioning * 0.15) * phys(m);
};
/** Körperliches Duell um einen freien Ball (Hintergrund-Zweikämpfe). */
const raw_duelSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.strength * 0.3 + a.balance * 0.2 + a.ballControl * 0.15 + a.tackling * 0.15 + a.aggression * 0.1 + a.workRate * 0.1) * phys(m);
};
// --- Luft ---------------------------------------------------------------------
const raw_aerialSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.heading * 0.42 + a.jumping * 0.26 + a.strength * 0.16 + heightBonus(m) * 0.16) * phys(m);
};
// --- Pass ---------------------------------------------------------------------
const raw_passSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.passing * 0.45 + a.technique * 0.15 + a.vision * 0.2 + a.decisions * 0.2) * phys(m);
};
const raw_longPassSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.longPassing * 0.55 + a.vision * 0.2 + a.technique * 0.15 + a.decisions * 0.1) * phys(m);
};
const raw_crossSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.crossing * 0.65 + a.technique * 0.15 + a.vision * 0.1 + a.decisions * 0.1) * phys(m);
};
/** Antizipation des Abfangenden (kein eigenes Attribut: Abfangen, Stellungsspiel, Konzentration, Entscheidungen). */
const raw_interceptSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.interceptions * 0.4 + a.positioning * 0.3 + a.concentration * 0.15 + a.decisions * 0.15) * phys(m);
};
// --- Tempo ----------------------------------------------------------------------
const raw_paceSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.speed * 0.55 + a.acceleration * 0.45) * phys(m);
};
/** Laufduell des Verteidigers: Tempo plus Stellungsspiel (wer richtig steht, muss weniger laufen). */
const raw_recoverSkill = (m: MPlayer) => raw_paceSkill(m) * 0.7 + A(m).positioning * 0.3 * phys(m);
/** Timing des Läufers gegen die Abseitslinie. */
const raw_timingSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.decisions * 0.45 + a.concentration * 0.25 + a.vision * 0.15 + a.composure * 0.15) * m.cond * (m.day ?? 1);
};

// --- Abschluss ------------------------------------------------------------------
export type ShotKind = 'foot' | 'header' | 'long' | 'penalty' | 'freekick';
export function finishSkill(m: MPlayer, kind: ShotKind, pressure = 0): number {
  const a = A(m);
  let v: number;
  switch (kind) {
    case 'header': v = a.heading * 0.6 + a.jumping * 0.2 + a.strength * 0.1 + a.composure * 0.1; break;
    case 'long': v = a.longShots * 0.6 + a.shotPower * 0.25 + a.technique * 0.15; break;
    case 'penalty': v = (a.penalties ?? 55) * 0.7 + a.composure * 0.3; break;
    case 'freekick': v = (a.freeKicks ?? 50) * 0.75 + a.shotPower * 0.1 + a.technique * 0.15; break;
    default: v = a.shooting * 0.45 + a.shotPower * 0.12 + a.composure * 0.23 + a.technique * 0.12 + a.firstTouch * 0.08;
  }
  return v * (m.cond * (m.day ?? 1) * (0.85 + 0.15 * m.energy / 100)) * nerveF(m, pressure);
}
/** Wer sich im Strafraum freiläuft und den Ball verarbeitet (flache Hereingabe, Abpraller). */
const raw_boxSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.firstTouch * 0.25 + a.decisions * 0.2 + a.acceleration * 0.2 + a.composure * 0.15 + a.shooting * 0.2) * phys(m);
};
/** Blocken eines Schusses. */
const raw_blockSkill = (m: MPlayer) => {
  const a = A(m);
  return (a.positioning * 0.45 + a.marking * 0.25 + a.concentration * 0.15 + a.agility * 0.15) * phys(m);
};

// --- Torwart ----------------------------------------------------------------------
export type KeeperSituation = 'shot' | 'oneOnOne' | 'air' | 'long' | 'penalty';
/** Torwart in einer Situation. Feldspieler im Tor sind kaum besser als 25. */
export function keeperValue(m: MPlayer | undefined, s: KeeperSituation, pressure = 0): number {
  if (!m) return 25;
  if (m.group !== 'GK') return 25 + A(m).agility * 0.15;
  const a = A(m);
  const f = m.cond * (m.day ?? 1) * (0.9 + 0.1 * m.energy / 100) * nerveF(m, pressure);
  switch (s) {
    case 'oneOnOne': return (a.oneOnOnes * 0.45 + a.reflexes * 0.25 + a.positioning * 0.2 + a.composure * 0.1) * f;
    case 'air': return (a.aerialReach * 0.45 + a.handling * 0.2 + a.jumping * 0.15 + a.communication * 0.2) * f;
    case 'long': return (a.positioning * 0.35 + a.reflexes * 0.35 + a.handling * 0.3) * f;
    case 'penalty': return (a.reflexes * 0.5 + a.agility * 0.2 + a.composure * 0.3) * f;
    default: return (a.reflexes * 0.45 + a.positioning * 0.3 + a.handling * 0.15 + a.agility * 0.1) * f;
  }
}

/** Zufällige Auswahl nach Gewicht (ohne Speicheranlage: Gewichte in einem festen Puffer). */
const WBUF = new Float64Array(64);
export function weighted<T>(rng: () => number, items: T[], w: (x: T) => number): T | undefined {
  const n = Math.min(items.length, WBUF.length);
  let sum = 0;
  for (let i = 0; i < n; i++) { const v = w(items[i]); const x = v > 0 ? v : 0; WBUF[i] = x; sum += x; }
  if (sum <= 0) return undefined;
  let r = rng() * sum;
  for (let i = 0; i < n; i++) { r -= WBUF[i]; if (r <= 0 && WBUF[i] > 0) return items[i]; }
  for (let i = n - 1; i >= 0; i--) if (WBUF[i] > 0) return items[i];
  return undefined;
}

/** Zweikampf mitzählen (beide Spieler, Gewinner). */
export function countDuel(win: MPlayer | undefined, lose: MPlayer | undefined, statsW?: { duels: number; duelsWon: number }, statsL?: { duels: number }): void {
  if (win) { win.duels++; win.duelsWon++; }
  if (lose) lose.duels++;
  if (statsW) { statsW.duels++; statsW.duelsWon++; }
  if (statsL) statsL.duels++;
}

// --- Zwischenspeicher: alle Fähigkeiten je Spieler, neu berechnet bei refresh() (alle 5 Minuten, nach Wechseln) ---
const RAW = [raw_dribbleSkill, raw_tackleSkill, raw_duelSkill, raw_aerialSkill, raw_passSkill, raw_longPassSkill, raw_crossSkill, raw_interceptSkill, raw_paceSkill, raw_recoverSkill, raw_timingSkill, raw_boxSkill, raw_blockSkill];
let GEN = 1;
/** Zwischenspeicher verwerfen (Positionen ändern sich nur nach Wechseln; die Kraft wirkt beim Abruf). */
export function refreshSkills(): void { GEN++; }
/** Aktuelle Generation des Zwischenspeichers (für abgeleitete Tabellen). */
export const skillGen = (): number => GEN;
function cached(m: MPlayer, i: number): number {
  const g = m.skg!, sk = m.sk!;
  if (g[i] !== GEN) { sk[i] = RAW[i](m); g[i] = GEN; }
  return sk[i];
}
export const dribbleSkill = (m: MPlayer): number => cached(m, 0) * energyF(m);
export const tackleSkill = (m: MPlayer): number => cached(m, 1) * energyF(m);
export const duelSkill = (m: MPlayer): number => cached(m, 2) * energyF(m);
export const aerialSkill = (m: MPlayer): number => cached(m, 3) * energyF(m);
export const passSkill = (m: MPlayer): number => cached(m, 4) * energyF(m);
export const longPassSkill = (m: MPlayer): number => cached(m, 5) * energyF(m);
export const crossSkill = (m: MPlayer): number => cached(m, 6) * energyF(m);
export const interceptSkill = (m: MPlayer): number => cached(m, 7) * energyF(m);
export const paceSkill = (m: MPlayer): number => cached(m, 8) * energyF(m);
export const recoverSkill = (m: MPlayer): number => cached(m, 9) * energyF(m);
export const timingSkill = (m: MPlayer): number => cached(m, 10) * energyF(m);
export const boxSkill = (m: MPlayer): number => cached(m, 11) * energyF(m);
export const blockSkill = (m: MPlayer): number => cached(m, 12) * energyF(m);

// =============================================================================
// REALISTISCHE ALTERSKURVEN JE ATTRIBUT (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Jeder Wert hat seine eigene Kurve – angelehnt an die Sportwissenschaft
// (Schnelligkeit gipfelt Mitte 20, Kraft/Ausdauer etwas später, Technik hält
// lange, Spielintelligenz wächst bis in die 30er, Erfahrung sinkt nie):
//   tempo    Schnelligkeit, Antritt, Beweglichkeit, Balance, Reflexe (TW)
//            → jung stärkster Zuwachs, Gipfel ≈ 23–27, Abbau ab ≈ 29, ab 31 deutlich
//   kraft    Kraft, Sprungkraft, Ausdauer
//            → wächst bis ≈ 27, Abbau ab ≈ 31
//   technik  Ballbehandlung, Passen, Schießen, Flanken, Kopfball, Zweikampf, Standards, TW-Technik
//            → gleichmäßiger Zuwachs bis ≈ 30, Abbau spät und langsam
//   kopf     Stellungsspiel, Deckung, Antizipation, Übersicht, Entscheidungen, Ruhe,
//            Konzentration, Teamwork, TW-Kommunikation/1-gegen-1
//            → wächst bis in die 30er, sinkt kaum
//   charakter Einsatzwille, Aggressivität, Kreativität, Führung
//            → angeboren, früh hoch möglich, ändert sich kaum (Führung wächst mit den Jahren)
//   Erfahrung sinkt nie (engine/experience.ts), Fitness ist ein Tageszustand.
// Wirkung: `growthMul`/`declineMul` steuern, welche Werte eine Auf-/Abwertung in
// development.ts `applyOverallChange` trifft; `naturalDrift` lässt die für die
// Position unwichtigen Werte je Bewertungsrunde dem Alter folgen (ohne Einfluss
// auf die Stärke – die hängt nur an den gewichteten Werten).
// =============================================================================
import type { AttributeKey, Player } from '../types';

export type AttrGroup = 'tempo' | 'kraft' | 'technik' | 'kopf' | 'charakter' | 'fest';

const GROUP: Partial<Record<AttributeKey, AttrGroup>> = {
  speed: 'tempo', acceleration: 'tempo', agility: 'tempo', balance: 'tempo', reflexes: 'tempo',
  strength: 'kraft', jumping: 'kraft', stamina: 'kraft',
  technique: 'technik', firstTouch: 'technik', ballControl: 'technik', dribbling: 'technik', passing: 'technik',
  longPassing: 'technik', crossing: 'technik', shooting: 'technik', shotPower: 'technik', longShots: 'technik',
  heading: 'technik', tackling: 'technik', penalties: 'technik', freeKicks: 'technik', corners: 'technik',
  handling: 'technik', kicking: 'technik', aerialReach: 'technik',
  positioning: 'kopf', marking: 'kopf', interceptions: 'kopf', vision: 'kopf', decisions: 'kopf', composure: 'kopf',
  concentration: 'kopf', teamwork: 'kopf', oneOnOnes: 'kopf', communication: 'kopf',
  workRate: 'charakter', aggression: 'charakter', flair: 'charakter', leadership: 'charakter',
  experience: 'fest', fitness: 'fest',
};
export const groupOf = (k: AttributeKey): AttrGroup => GROUP[k] ?? 'technik';

/** Anteil eines Werts am Zuwachs je Alter (1 = durchschnittlich). */
export function growthMul(k: AttributeKey, age: number): number {
  switch (groupOf(k)) {
    case 'tempo': return age <= 20 ? 2.2 : age <= 23 ? 1.6 : age <= 26 ? 0.9 : age <= 28 ? 0.4 : 0.1;
    case 'kraft': return age <= 20 ? 1.7 : age <= 24 ? 1.5 : age <= 27 ? 1.1 : age <= 29 ? 0.6 : 0.15;
    case 'technik': return age <= 20 ? 1.0 : age <= 27 ? 1.1 : age <= 30 ? 0.9 : 0.6;
    case 'kopf': return age <= 20 ? 0.6 : age <= 24 ? 0.9 : age <= 29 ? 1.3 : 1.6;
    case 'charakter': return k === 'leadership' ? (age <= 22 ? 0.3 : age <= 28 ? 0.7 : 1.0) : 0.35;
    default: return 0;
  }
}

/** Anteil eines Werts am Abbau je Alter (0 = sinkt nie). */
export function declineMul(k: AttributeKey, age: number): number {
  switch (groupOf(k)) {
    case 'tempo': return age < 26 ? 0.6 : age < 29 ? 1.3 : age < 32 ? 2.6 : 3.6;
    case 'kraft': return (age < 28 ? 0.6 : age < 31 ? 1.0 : age < 33 ? 2.0 : 2.8) * (k === 'strength' ? 0.6 : 1);
    case 'technik': return age < 30 ? 1.0 : age < 33 ? 0.6 : 0.8;
    case 'kopf': return age < 30 ? 0.5 : age < 34 ? 0.12 : 0.3;
    case 'charakter': return k === 'leadership' ? 0 : 0.1;
    default: return 0;
  }
}

/**
 * Natürliche Veränderung der für die Position UNWICHTIGEN Werte je Bewertungsrunde
 * (Anteil `scale`: klein 0,5 / mittel 0,7 / groß 1). Ändert die Stärke nicht.
 * `drive` 0..1 = Einsatzwille/Professionalität (fleißige Spieler legen mehr zu, bauen langsamer ab).
 */
export function naturalDrift(p: Player, weighted: Set<string>, scale: number, drive: number, rnd: () => number = Math.random): void {
  const a = p.attributes as unknown as Record<string, number>;
  const age = p.age;
  const gk = p.naturalPosition === 'TW';
  for (const k of Object.keys(a) as AttributeKey[]) {
    if (weighted.has(k)) continue;
    const g = groupOf(k);
    if (g === 'fest') continue;
    // Torwart-Werte beim Feldspieler (und Stürmer-Werte beim Torwart) bleiben, wie sie sind.
    if (!gk && (k === 'reflexes' || k === 'handling' || k === 'aerialReach' || k === 'oneOnOnes' || k === 'communication' || k === 'kicking')) continue;
    const v = a[k] ?? 50;
    const up = growthMul(k, age) * (age <= 30 ? 1 : 0.4) * (0.75 + drive * 0.5) * (v >= 85 ? 0.4 : 1);
    const down = age >= 28 ? declineMul(k, age) * Math.max(0, age - 27) * 0.18 * (1.15 - drive * 0.3) : 0;
    if (rnd() < 0.09 * up * scale && v < 99) a[k] = v + 1;
    else if (down > 0 && rnd() < 0.09 * down * scale && v > 5) a[k] = v - 1;
  }
}

/**
 * Einsatzwille bei der Erzeugung: angeboren, früh hoch möglich; Starspieler fast immer
 * mit hohem Wert (Wunsch Pascal). `quality` 0..1 = Stärke bzw. Potenzial auf der Skala.
 */
export function bornWorkRate(current: number, quality: number, noise: number): number {
  const target = 42 + quality * 48 + noise;
  return Math.max(1, Math.min(99, Math.round(Math.max(current, current * 0.4 + target * 0.6))));
}

/**
 * Reifung ab Mitte 20 (Wunsch Pascal): Körper gibt etwas ab, Kopf legt zu – bei gleicher
 * Stärke. Je Bewertungsrunde einige Tauschschritte zwischen gewichteten Werten; ein
 * Schritt gilt nur, wenn die Positionsstärke gleich bleibt (`strengthOf`).
 */
export function matureShift(p: Player, keys: AttributeKey[], w: Partial<Record<AttributeKey, number>>, scale: number, strengthOf: () => number, rnd: () => number = Math.random): void {
  const age = p.age;
  if (age < 25) return;
  const steps = Math.round((age <= 27 ? 1 : age <= 30 ? 2 : 3) * scale * (0.5 + rnd()));
  const a = p.attributes as unknown as Record<string, number>;
  const pick = (list: { k: AttributeKey; s: number }[]) => {
    const sum = list.reduce((x, y) => x + y.s, 0);
    let r = rnd() * sum;
    for (const x of list) { r -= x.s; if (r <= 0) return x.k; }
    return list[list.length - 1]?.k;
  };
  for (let i = 0; i < steps; i++) {
    const body = keys.filter((k) => { const g = groupOf(k); return (g === 'tempo' || g === 'kraft') && (a[k] ?? 0) > 5; }).map((k) => ({ k, s: (w[k] ?? 1) * declineMul(k, age) }));
    const mind = keys.filter((k) => groupOf(k) === 'kopf' && (a[k] ?? 0) < 97).map((k) => ({ k, s: (w[k] ?? 1) * growthMul(k, age) }));
    if (!body.length || !mind.length) return;
    const down = pick(body), up = pick(mind);
    if (!down || !up) return;
    const before = strengthOf();
    a[down] -= 1; a[up] += 1;
    if (strengthOf() !== before) { a[down] += 1; a[up] -= 1; }
  }
}

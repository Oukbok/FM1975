// =============================================================================
// TRAININGSLAGER – Trainingsprogramm (Planer Schritt 3, Vorbild EA FM „Trainingslager“):
// 21 Punkte auf sieben Bereiche verteilt; die Verteilung ergibt die Faktoren der
// Lager-Rechnung (`FocusDef` in engine/trainingCamp.ts – gleiche Größen wie die festen
// Schwerpunkte). Die Punkte auf „Taktik“ bezahlen Taktik-Inhalte (Kosten 1–3), die
// gezielt Attribute trainieren (`applyCampDrills`, Rückkehr in game/trainingCampGame.ts).
// Ausgeglichen (3 je Bereich) = Schwerpunkt „Ausgewogen“; die alten Schwerpunkte sind
// Vorlagen (`presetProgram`) – KI-Vereine planen weiter mit festen Schwerpunkten.
// =============================================================================
import type { AttributeKey, Player } from '../types';
import { refreshOverall } from './development';
import { familiarity, footFactor, rawSuitability } from './positions';
import type { CampFocus, FocusDef } from './trainingCamp';
import { ageFactor } from './weeklyTraining';

export type CampArea = 'kondition' | 'technik' | 'taktik' | 'kopf' | 'teamgeist' | 'regeneration' | 'jugend';
export const CAMP_AREA_ORDER: CampArea[] = ['kondition', 'technik', 'taktik', 'kopf', 'teamgeist', 'regeneration', 'jugend'];
/** Punkte gesamt, Höchstwert je Bereich; ausgeglichen = 3 je Bereich. */
export const CAMP_POINTS = 21;
export const CAMP_AREA_MAX = 8;
const EVEN = CAMP_POINTS / CAMP_AREA_ORDER.length;

export interface CampAreaDef { label: string; icon: string; text: string }
export const CAMP_AREAS: Record<CampArea, CampAreaDef> = {
  kondition: { label: 'Kondition', icon: 'trEndurance', text: 'Läufe, Zirkel, Kraft: mehr Fitness – aber müde Beine und mehr Verletzungen.' },
  technik: { label: 'Technik & Spielformen', icon: 'trTechnique', text: 'Ballarbeit und Spielformen: zusätzliche Entwicklungsschritte.' },
  taktik: { label: 'Taktik', icon: 'trTactics', text: 'Spielzüge und Abläufe: Form und Eingespieltheit. Die Punkte bezahlen die Taktik-Inhalte unten.' },
  kopf: { label: 'Disziplin & Kopf', icon: 'trMental', text: 'Feste Abläufe, Gespräche, Zapfenstreich: weniger Verstöße, Unprofessionelle werden gefestigt.' },
  teamgeist: { label: 'Mannschaftsgeist', icon: 'talk', text: 'Ausflüge und Abende: bessere Stimmung und Zufriedenheit, etwas weniger Fitness. Kostet etwas mehr.' },
  regeneration: { label: 'Regeneration', icon: 'trRecovery', text: 'Physio, Bäder, kurze Umfänge: frische Beine, weniger Verletzungen, Verletzte heilen schneller. Kostet etwas mehr.' },
  jugend: { label: 'Jugendintegration', icon: 'youth', text: 'Junge Spieler (bis 21) trainieren eng mit und lernen deutlich mehr.' },
};

// -----------------------------------------------------------------------------
// Taktik-Inhalte
// -----------------------------------------------------------------------------
export type CampDrillId =
  | 'abwehr' | 'pressing' | 'abseits' | 'konter' | 'aufbau' | 'kurzpass' | 'langball'
  | 'flanken' | 'ecken' | 'freistoss' | 'elfmeter' | 'torwart';
export interface CampDrillDef {
  label: string; cost: number;
  /** Trainierte Attribute (Gewicht = Anteil an der Auswahl). */
  attrs: Partial<Record<AttributeKey, number>>;
  /** Nur für Torhüter bzw. nur für Feldspieler (Standard). */
  keepers?: boolean;
}
export const CAMP_DRILLS: Record<CampDrillId, CampDrillDef> = {
  abwehr: { label: 'Abwehrverhalten', cost: 2, attrs: { marking: 1, tackling: 1, positioning: 1 } },
  pressing: { label: 'Pressing', cost: 3, attrs: { workRate: 1, interceptions: 1, aggression: 0.5 } },
  abseits: { label: 'Abseitsfalle', cost: 2, attrs: { positioning: 1, concentration: 1 } },
  konter: { label: 'Konterspiel', cost: 2, attrs: { decisions: 1, vision: 0.7, acceleration: 0.5 } },
  aufbau: { label: 'Spielaufbau', cost: 2, attrs: { passing: 1, vision: 1, composure: 0.6 } },
  kurzpass: { label: 'Kurzpassspiel', cost: 1, attrs: { passing: 1, firstTouch: 1 } },
  langball: { label: 'Lange Bälle', cost: 1, attrs: { longPassing: 1 } },
  flanken: { label: 'Flanken', cost: 2, attrs: { crossing: 1, heading: 0.8 } },
  ecken: { label: 'Ecken', cost: 1, attrs: { corners: 1, heading: 0.6 } },
  freistoss: { label: 'Freistöße', cost: 1, attrs: { freeKicks: 1, longShots: 0.5 } },
  elfmeter: { label: 'Elfmeter', cost: 1, attrs: { penalties: 1, composure: 0.4 } },
  torwart: { label: 'Torwartspiel', cost: 2, attrs: { reflexes: 1, handling: 1, oneOnOnes: 0.7 }, keepers: true },
};
export const CAMP_DRILL_ORDER: CampDrillId[] = ['abwehr', 'pressing', 'abseits', 'konter', 'aufbau', 'kurzpass', 'langball', 'flanken', 'ecken', 'freistoss', 'elfmeter', 'torwart'];

export interface CampProgram { pts: Record<CampArea, number>; drills: CampDrillId[] }

const P = (k: number, te: number, ta: number, ko: number, tg: number, r: number, j: number): Record<CampArea, number> =>
  ({ kondition: k, technik: te, taktik: ta, kopf: ko, teamgeist: tg, regeneration: r, jugend: j });
/** Vorlagen = die festen Schwerpunkte (gleiche Wirkung wie bisher, ungefähr). */
const PRESETS: Record<CampFocus, Record<CampArea, number>> = {
  ausgewogen: P(3, 3, 3, 3, 3, 3, 3),
  kondition: P(8, 2, 3, 2, 2, 2, 2),
  taktik: P(2, 5, 6, 2, 2, 2, 2),
  teamgeist: P(2, 2, 3, 2, 8, 2, 2),
  regeneration: P(1, 2, 3, 2, 3, 8, 2),
  jugend: P(2, 3, 2, 2, 2, 2, 8),
};
export function presetProgram(f: CampFocus): CampProgram {
  return { pts: { ...PRESETS[f] }, drills: [] };
}

export const programUsed = (p: CampProgram) => CAMP_AREA_ORDER.reduce((s, a) => s + (p.pts[a] ?? 0), 0);
export const drillCost = (p: CampProgram) => p.drills.reduce((s, d) => s + (CAMP_DRILLS[d]?.cost ?? 0), 0);

/** Programm gültig? Liefert null oder den Grund. */
export function programError(p: CampProgram): string | null {
  if (CAMP_AREA_ORDER.some((a) => (p.pts[a] ?? 0) < 0 || (p.pts[a] ?? 0) > CAMP_AREA_MAX)) return `Je Bereich höchstens ${CAMP_AREA_MAX} Punkte.`;
  const used = programUsed(p);
  if (used !== CAMP_POINTS) return used < CAMP_POINTS ? `Noch ${CAMP_POINTS - used} Punkte verteilen.` : `${used - CAMP_POINTS} Punkte zu viel verteilt.`;
  if (drillCost(p) > (p.pts.taktik ?? 0)) return 'Taktik-Inhalte kosten mehr Punkte, als auf Taktik liegen.';
  return null;
}

/** Unbezahlbare Inhalte (nach Senken der Taktik-Punkte) von hinten streichen. */
export function trimDrills(p: CampProgram): CampProgram {
  const drills = [...p.drills];
  while (drills.length && drills.reduce((s, d) => s + CAMP_DRILLS[d].cost, 0) > p.pts.taktik) drills.pop();
  return drills.length === p.drills.length ? p : { ...p, drills };
}

/** Kurzname der Verteilung: Vorlage, wenn sie genau passt, sonst der stärkste Bereich. */
export function programLabel(p: CampProgram): string {
  const same = (Object.keys(PRESETS) as CampFocus[]).find((f) => CAMP_AREA_ORDER.every((a) => PRESETS[f][a] === p.pts[a]));
  if (same === 'ausgewogen') return 'Ausgewogen';
  const top = [...CAMP_AREA_ORDER].sort((a, b) => p.pts[b] - p.pts[a]);
  if (p.pts[top[0]] <= EVEN) return 'Ausgewogen';
  return p.pts[top[1]] === p.pts[top[0]] ? `${CAMP_AREAS[top[0]].label} / ${CAMP_AREAS[top[1]].label}` : CAMP_AREAS[top[0]].label;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Faktoren der Lager-Rechnung aus der Verteilung. d = Abweichung des Anteils vom
 * Gleichstand (−1/7 … +0,24); je Größe lineare Gewichte, so dass die Vorlagen etwa die
 * festen Schwerpunkte treffen (Kondition: Fitness ×1,4, Verletzungen ×1,3; Regeneration:
 * Frische +14, Heilung 0,7; Mannschaftsgeist: Stimmung ×1,9; Jugend: Lernen der Jungen ×2,8).
 */
export function programDef(p: CampProgram): FocusDef {
  const d = (a: CampArea) => ((p.pts[a] ?? 0) - EVEN) / CAMP_POINTS;
  const k = d('kondition'), te = d('technik'), ta = d('taktik'), ko = d('kopf'), tg = d('teamgeist'), r = d('regeneration'), j = d('jugend');
  return {
    label: programLabel(p), text: '',
    fit: clamp(1 + 1.3 * k - 1.0 * r - 0.6 * tg - 0.2 * te, 0.5, 1.5),
    dev: clamp(1 + 1.8 * te + 0.6 * ta - 0.4 * k - 0.3 * tg - 0.6 * r, 0.55, 1.6),
    form: clamp(1 + 1.2 * ta + 0.5 * te + 0.4 * r - 0.5 * k, 0.7, 1.35),
    morale: clamp(1 + 3.6 * tg - 0.6 * k + 0.6 * r + 0.4 * ko, 0.55, 2),
    inj: clamp(1 + 0.9 * k - 2.2 * r, 0.4, 1.4),
    disc: clamp(1 - 2.2 * ko + 0.4 * tg + 0.6 * r, 0.45, 1.4),
    discGain: clamp(1 + 3 * ko, 0.55, 1.75),
    frische: Math.round(-26 * k + 50 * r + 8 * tg),
    heal: Math.round(Math.max(0, r) * 3 * 100) / 100,
    sat: Math.round(12 * tg + 4 * r - 4 * k),
    cost: clamp(1 + 0.25 * Math.max(0, tg) + 0.35 * Math.max(0, r), 1, 1.12),
    youth: j >= 0 ? 1 + 7.6 * j : 1 + 1.5 * j,
  };
}

// -----------------------------------------------------------------------------
// Wirkung der Taktik-Inhalte (Rückkehr aus dem Lager, nur eigener Verein)
// -----------------------------------------------------------------------------
// Die Inhalte lenken die Entwicklung des Lagers auf bestimmte Attribute: ein +1 kommt
// sofort, kostet aber Entwicklungspunkte des Lagers (`DRILL_COST` je Punkt Stärke).
// Mehr als `budget / DRILL_COST` Stärke bringen sie nie – so bleibt ein Lager auch mit
// vollem Programm etwa beim Wochentraining derselben Tage (Messung tests/simCamp.ts).
/** Grundchance je Inhalt und Spieler auf +1 in einem trainierten Attribut (9-Tage-Lager, 25 Jahre, ≥ 10 Punkte Luft zum Potenzial). */
export const DRILL_CHANCE = 0.45;
/** Schub für den Trainings-Akkumulator (lenkt die nächsten Aufwertungen auf diese Attribute). */
export const DRILL_FOCUS = 1.5;
/** Entwicklungspunkte des Lagers je Punkt Stärke aus Taktik-Inhalten (< 1 = kleiner Bonus fürs gezielte Lernen). */
export const DRILL_COST = 0.8;
/** Mindest-Gegenwert eines +1 in Stärkepunkten (Standards zählen in der Match-Engine, kaum in der Stärke). */
export const DRILL_MIN_GAIN = 0.03;

/** Chance auf +1 für einen Spieler (Vorschau im Planer und Rechnung). */
export function drillChance(p: Player, days: number, luck = 1): number {
  const headroom = p.development.potentialAbility - p.development.currentAbility;
  if (headroom <= 0.5) return 0;
  // Luft nach oben: schon wenig Abstand zum Potenzial lässt gezieltes Lernen zu (0,35 … 1).
  const room = clamp(0.35 + headroom / 15, 0, 1);
  return clamp(DRILL_CHANCE * (days / 9) * ageFactor(p.age) * room * luck, 0, 0.6);
}

/** Stärke auf der eigenen Position ungerundet (wie positionSuitability ohne Rundung). */
const rawStrength = (p: Player) => rawSuitability(p, p.naturalPosition) * familiarity(p, p.naturalPosition) * footFactor(p, p.naturalPosition);

/**
 * Wendet die Taktik-Inhalte auf einen Spieler an: Akkumulator-Schub auf die Attribute
 * und mit `drillChance` +1 auf eines davon, solange das Budget (Entwicklungspunkte des
 * Lagers für diesen Spieler) reicht und die Stärke unter dem Potenzial bleibt. Liefert
 * die gestiegenen Attribute je Inhalt und die verbrauchten Entwicklungspunkte.
 */
export function applyCampDrills(p: Player, drills: CampDrillId[], days: number, luck: number, rng: () => number, budget = Infinity): { ups: { drill: CampDrillId; attr: AttributeKey }[]; spent: number } {
  const ups: { drill: CampDrillId; attr: AttributeKey }[] = [];
  let spent = 0;
  const keeper = p.naturalPosition === 'TW';
  const acc = (p.development.attributeProgress ??= {});
  const pot = p.development.potentialAbility;
  const attrs = p.attributes as unknown as Record<string, number>;
  for (const id of drills) {
    const def = CAMP_DRILLS[id];
    if (!def || !!def.keepers !== keeper) continue;
    const keys = (Object.keys(def.attrs) as AttributeKey[]).filter((a) => (p.attributes[a] ?? 0) < 99);
    if (!keys.length) continue;
    for (const a of keys) acc[a] = Math.round(((acc[a] ?? 0) + DRILL_FOCUS * (def.attrs[a] ?? 1)) * 10) / 10;
    if (rng() >= drillChance(p, days, luck)) continue;
    const total = keys.reduce((s, a) => s + (def.attrs[a] ?? 1), 0);
    let x = rng() * total;
    let attr = keys[keys.length - 1];
    for (const a of keys) { x -= def.attrs[a] ?? 1; if (x <= 0) { attr = a; break; } }
    const before = rawStrength(p);
    attrs[attr] = Math.min(99, (p.attributes[attr] ?? 50) + 1);
    const after = rawStrength(p);
    // Auch Attribute ohne Gewicht auf der eigenen Position (Standards) kosten etwas.
    const cost = Math.max(DRILL_MIN_GAIN, after - before) * DRILL_COST;
    // Budget erschöpft oder über dem Potenzial: zurücknehmen (der Akkumulator-Schub bleibt).
    if (spent + cost > budget + 1e-9 || after > pot + 0.5) { attrs[attr] -= 1; continue; }
    spent += cost;
    ups.push({ drill: id, attr });
  }
  if (ups.length) refreshOverall(p);
  return { ups, spent: Math.round(spent * 1000) / 1000 };
}

/** Nächster fester Schwerpunkt (gespeichert an der Buchung für ältere Anzeigen). */
export function programFocus(p: CampProgram): CampFocus {
  const top = CAMP_AREA_ORDER.reduce((b, a) => (p.pts[a] > p.pts[b] ? a : b), 'kondition' as CampArea);
  if (p.pts[top] <= EVEN) return 'ausgewogen';
  return top === 'technik' ? 'taktik' : top === 'kopf' ? 'ausgewogen' : top;
}

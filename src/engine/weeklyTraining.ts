// =============================================================================
// FOOTBALL MANAGER 1980 — Wochen-Trainingsplaner-Engine
// -----------------------------------------------------------------------------
// Vorgefertigte Trainingsblöcke (decken ALLE Fähigkeitsbereiche ab), ein
// 7×3-Wochenplan (Mo..So, je Einheit 1 / Einheit 2 / Extraeinheit) sowie die
// tägliche Anwendung auf den Kader:
//   • FITNESS: 2 durchschnittliche Einheiten/Tag ≈ leichte Regeneration. Höhere
//     Intensität kostet mehr Fitness, die Extraeinheit belastet zusätzlich.
//     Wenig/kein Training = stärkere Regeneration.
//   • ENTWICKLUNG: Gezieltes Training füllt einen VERSTECKTEN Akkumulator je
//     Attribut in 0.1-Schritten. Sichtbar wird ein +1 erst bei Erreichen von
//     1.0 (siehe engine/development.ts). Junge Spieler mit viel Potenzial
//     wachsen schneller (Alters- & Potenzialfaktor).
// =============================================================================

import { Club, Player, AttributeKey, TrainingBlock, WeeklyTrainingPlan, DaySlots } from '../types';
import { recoverFreshness } from './form';

// -----------------------------------------------------------------------------
// FITNESS-MODELL (Konstanten)
// -----------------------------------------------------------------------------
/** Tägliche Grund-Regeneration (Fitness-Punkte), bevor Trainingskosten abgezogen werden. */
export const DAILY_BASE_RECOVERY = 10;
/** Multiplikator der Belastung einer Extraeinheit (dritter Slot). */
export const EXTRA_SLOT_MULTIPLIER = 1.3;
/** Basis-Lernrate je Attribut und Einheit (in Attribut-Punkten, 0.1-gerundet). */
const BASE_GAIN = 0.11;

/** Fitness-Kosten-Basis je Intensitätsstufe (dient als Referenz für Block-Load). */
export const INTENSITY_LOAD: Record<TrainingBlock['intensity'], number> = {
  low: 2,
  medium: 3.5,
  high: 6,
};

/** Lerntempo-Faktor je Intensität (höhere Intensität = etwas schnelleres Lernen). */
const INTENSITY_LEARN: Record<TrainingBlock['intensity'], number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.3,
};

// -----------------------------------------------------------------------------
// TRAININGSBLÖCE — decken alle Fähigkeitsbereiche ab
// -----------------------------------------------------------------------------
export const TRAINING_BLOCKS: TrainingBlock[] = [
  {
    id: 'ausdauerlauf',
    name: 'Ausdauerlauf',
    icon: '🏃',
    category: 'conditioning',
    intensity: 'high',
    load: 6,
    attributes: { stamina: 1.0, fitness: 0.3, workRate: 0.3 },
    description: 'Lange Läufe für die Grundlagenausdauer. Hart, aber die Basis jeder Saison.',
  },
  {
    id: 'kondition',
    name: 'Konditionszirkel',
    icon: '💪',
    category: 'conditioning',
    intensity: 'medium',
    load: 3.5,
    attributes: { stamina: 0.7, fitness: 0.4, strength: 0.3, workRate: 0.2 },
    description: 'Intervall- und Zirkeltraining für Ausdauer und allgemeine Fitness.',
  },
  {
    id: 'sprinttraining',
    name: 'Sprinttraining',
    icon: '⚡',
    category: 'speed',
    intensity: 'high',
    load: 5.5,
    attributes: { speed: 0.9, acceleration: 1.0, agility: 0.4 },
    description: 'Kurze, explosive Sprints für Antritt und Höchstgeschwindigkeit.',
  },
  {
    id: 'beweglichkeit',
    name: 'Beweglichkeit & Balance',
    icon: '🤸',
    category: 'speed',
    intensity: 'medium',
    load: 3,
    attributes: { agility: 0.8, balance: 0.8, acceleration: 0.3 },
    description: 'Koordinations- und Wendigkeitsübungen für Agilität und Balance.',
  },
  {
    id: 'krafttraining',
    name: 'Krafttraining',
    icon: '🏋️',
    category: 'strength',
    intensity: 'high',
    load: 5.5,
    attributes: { strength: 1.0, jumping: 0.5, aggression: 0.2 },
    description: 'Gewichte und Athletik für Körperkraft und Zweikampfstärke.',
  },
  {
    id: 'technik',
    name: 'Technikschulung',
    icon: '⚽',
    category: 'technique',
    intensity: 'medium',
    load: 3,
    attributes: { technique: 1.0, firstTouch: 0.8, ballControl: 0.8, dribbling: 0.4 },
    description: 'Ballführung, Annahme und Ballkontrolle unter Druck.',
  },
  {
    id: 'dribbling',
    name: 'Dribbling & Finten',
    icon: '🕺',
    category: 'technique',
    intensity: 'medium',
    load: 3,
    attributes: { dribbling: 1.0, ballControl: 0.6, flair: 0.5, agility: 0.3 },
    description: 'Eins-gegen-eins, Finten und enge Ballführung.',
  },
  {
    id: 'passspiel',
    name: 'Passspiel',
    icon: '🎯',
    category: 'passing',
    intensity: 'medium',
    load: 3,
    attributes: { passing: 1.0, longPassing: 0.6, vision: 0.5, firstTouch: 0.3 },
    description: 'Kurz- und Langpassspiel, Spielaufbau und Übersicht.',
  },
  {
    id: 'flanken',
    name: 'Flankentraining',
    icon: '↗️',
    category: 'passing',
    intensity: 'low',
    load: 2,
    attributes: { crossing: 1.0, longPassing: 0.4, technique: 0.3 },
    description: 'Flanken aus Halbfeld und Grundlinie, Timing der Hereingaben.',
  },
  {
    id: 'torschuss',
    name: 'Abschlusstraining',
    icon: '🥅',
    category: 'shooting',
    intensity: 'medium',
    load: 3.5,
    attributes: { shooting: 1.0, shotPower: 0.7, longShots: 0.5, composure: 0.3 },
    description: 'Torschüsse aus allen Lagen, Abschlussstärke und Kaltschnäuzigkeit.',
  },
  {
    id: 'kopfball',
    name: 'Kopfballtraining',
    icon: '🗣️',
    category: 'heading',
    intensity: 'medium',
    load: 3.5,
    attributes: { heading: 1.0, jumping: 0.7, aggression: 0.3 },
    description: 'Kopfbälle in Offensive und Defensive, Timing der Sprünge.',
  },
  {
    id: 'verteidigung',
    name: 'Zweikampf & Verteidigung',
    icon: '🛡️',
    category: 'defending',
    intensity: 'high',
    load: 5,
    attributes: { tackling: 1.0, marking: 0.8, interceptions: 0.7, positioning: 0.4, aggression: 0.3 },
    description: 'Tackling, Manndeckung und Abfangen — die Kunst des Verteidigens.',
  },
  {
    id: 'taktik',
    name: 'Taktik & Positionsspiel',
    icon: '📋',
    category: 'tactics',
    intensity: 'low',
    load: 2,
    attributes: { positioning: 0.9, decisions: 0.8, concentration: 0.6, teamwork: 0.6, vision: 0.3 },
    description: 'Verschieben im Verbund, Laufwege und Entscheidungsfindung.',
  },
  {
    id: 'spielform',
    name: 'Spielform (Match Practice)',
    icon: '🆚',
    category: 'matchplay',
    intensity: 'high',
    load: 5,
    attributes: {
      teamwork: 0.7, decisions: 0.6, positioning: 0.5, passing: 0.4,
      composure: 0.4, workRate: 0.3, ballControl: 0.3,
    },
    description: 'Trainingsspiele unter Wettkampfbedingungen — bringt vieles gleichzeitig.',
  },
  {
    id: 'torwart',
    name: 'Torwarttraining',
    icon: '🧤',
    category: 'goalkeeping',
    intensity: 'medium',
    load: 3.5,
    attributes: {
      reflexes: 1.0, handling: 0.8, oneOnOnes: 0.6, aerialReach: 0.5,
      kicking: 0.4, communication: 0.3,
    },
    description: 'Reflexe, Fangsicherheit und Strafraumbeherrschung für Torhüter.',
  },
  {
    id: 'standards',
    name: 'Standardsituationen',
    icon: '🚩',
    category: 'setpieces',
    intensity: 'low',
    load: 2,
    attributes: { freeKicks: 1.0, corners: 0.8, penalties: 0.8, crossing: 0.4 },
    description: 'Freistöße, Ecken und Elfmeter — Punkte aus ruhenden Bällen.',
  },
  {
    id: 'mental',
    name: 'Mentaltraining',
    icon: '🧠',
    category: 'mental',
    intensity: 'low',
    load: 1.5,
    attributes: { composure: 0.8, concentration: 0.8, decisions: 0.6, leadership: 0.4 },
    description: 'Konzentration, Nervenstärke und Führungsqualitäten im Kopf.',
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    icon: '🧖',
    category: 'recovery',
    intensity: 'low',
    load: -4,
    attributes: {},
    description: 'Auslaufen, Massage, Physio. Kein Lerneffekt, aber starke Erholung.',
  },
];

/** Schneller Zugriff auf einen Block per ID. */
export const BLOCKS_BY_ID: Record<string, TrainingBlock> = Object.fromEntries(
  TRAINING_BLOCKS.map((b) => [b.id, b]),
);

/** Deutsche Labels der Intensitätsstufen (für die UI). */
export const INTENSITY_LABELS: Record<TrainingBlock['intensity'], string> = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
};

// -----------------------------------------------------------------------------
// STANDARD-WOCHENPLAN
// -----------------------------------------------------------------------------
/**
 * Erstellt einen sinnvollen Standard-Wochenplan:
 *  - Mo–Fr je zwei Einheiten (ausgewogene Mischung), keine Extraeinheiten.
 *  - Fr etwas lockerer (Standards/Taktik) zur Spieltagsvorbereitung.
 *  - Sa Spielformen light, So Regeneration.
 * Der Manager kann alles frei umstellen.
 */
export function createDefaultWeeklyPlan(): WeeklyTrainingPlan {
  const d = (slot1: string | null, slot2: string | null, extra: string | null = null): DaySlots => ({
    slot1, slot2, extra,
  });
  return {
    days: [
      d('kondition', 'passspiel'),        // Mo
      d('krafttraining', 'technik'),      // Di
      d('sprinttraining', 'torschuss'),   // Mi
      d('verteidigung', 'spielform'),     // Do
      d('taktik', 'standards'),           // Fr
      d('technik', 'regeneration'),       // Sa
      d('regeneration', null),            // So
    ],
  };
}

// -----------------------------------------------------------------------------
// FITNESS-VORSCHAU
// -----------------------------------------------------------------------------
/** Belastung eines einzelnen Tages (Summe der Slot-Kosten, Extra ×1.3). */
export function dayLoad(day: DaySlots): number {
  let load = 0;
  const s1 = day.slot1 ? BLOCKS_BY_ID[day.slot1] : null;
  const s2 = day.slot2 ? BLOCKS_BY_ID[day.slot2] : null;
  const ex = day.extra ? BLOCKS_BY_ID[day.extra] : null;
  if (s1) load += s1.load;
  if (s2) load += s2.load;
  if (ex) load += ex.load * EXTRA_SLOT_MULTIPLIER;
  return load;
}

/**
 * Erwartete Fitness-Veränderung eines Tages (für die UI-Vorschau).
 * Positiv = Regeneration, negativ = Ermüdung.
 */
export function expectedFitnessDelta(day: DaySlots): number {
  return Math.round((DAILY_BASE_RECOVERY - dayLoad(day)) * 10) / 10;
}

// -----------------------------------------------------------------------------
// ENTWICKLUNGS-FAKTOREN
// -----------------------------------------------------------------------------
/** Altersfaktor: junge Spieler lernen deutlich schneller. */
export function ageFactor(age: number): number {
  if (age <= 20) return 1.5;
  if (age <= 23) return 1.2;
  if (age <= 27) return 1.0;
  if (age <= 30) return 0.7;
  if (age <= 33) return 0.4;
  return 0.2;
}

/**
 * Potenzialfaktor: je größer der Abstand zwischen aktueller und maximaler
 * Stärke (Kopffreiheit), desto schneller das Wachstum. 0.1..1.0.
 */
export function potentialFactor(p: Player): number {
  const headroom = p.development.potentialAbility - p.development.currentAbility;
  return Math.max(0.1, Math.min(1, headroom / 20));
}

// -----------------------------------------------------------------------------
// TÄGLICHE ANWENDUNG DES TRAININGS
// -----------------------------------------------------------------------------
/**
 * Wendet den Tagesplan auf den Kader eines Vereins an:
 *  - Füllt den versteckten Attribut-Akkumulator (0.1-Schritte) je Einheit.
 *  - Passt die Fitness gemäß Fitness-Modell an (Grund-Regeneration − Belastung).
 *  - Kleiner Form-Effekt je nach Auslastung.
 * An Spieltagen wird NICHT trainiert (isMatchDay = true → nur Countdown/Regen
 * bleibt der Match-Engine überlassen; hier passiert nichts).
 *
 * @returns Anzahl der angewandten Einheiten (0 bei Spieltag/leer).
 */
export function applyDailyTraining(
  club: Club,
  players: Record<string, Player>,
  day: DaySlots,
  isMatchDay: boolean,
): number {
  if (isMatchDay) return 0;

  const slots: (TrainingBlock | null)[] = [
    day.slot1 ? BLOCKS_BY_ID[day.slot1] : null,
    day.slot2 ? BLOCKS_BY_ID[day.slot2] : null,
    day.extra ? BLOCKS_BY_ID[day.extra] : null,
  ];
  const isExtra = [false, false, true];
  const facilities = (club.trainingSchedule?.facilitiesQuality ?? 70) / 100;
  const totalLoad = dayLoad(day);

  for (const pid of club.playerIds) {
    const p = players[pid];
    if (!p) continue;

    // Verletzte Spieler trainieren nicht — nur Verletzungs-Countdown.
    if (p.injury || p.availability === 'injured') {
      if (p.injury) {
        p.injury.daysRemaining--;
        if (p.injury.daysRemaining <= 0) {
          p.injury = null;
          p.availability = 'available';
          p.attributes.fitness = 70;
          p.frische = 100;
        }
      }
      continue;
    }

    if (!p.development.attributeProgress) p.development.attributeProgress = {};
    const acc = p.development.attributeProgress;
    const aFactor = ageFactor(p.age);
    const pFactor = potentialFactor(p);

    // --- Entwicklungs-Akkumulator füllen ---
    for (let i = 0; i < slots.length; i++) {
      const block = slots[i];
      if (!block) continue;
      const learn = INTENSITY_LEARN[block.intensity];
      // Fitness dämpft den Lerneffekt bei müden Spielern.
      const freshness = 0.6 + 0.4 * (p.attributes.fitness / 100);
      for (const [attr, weight] of Object.entries(block.attributes) as [AttributeKey, number][]) {
        const cur = p.attributes[attr] as number;
        if (cur >= 99) continue;
        let gain = BASE_GAIN * weight * aFactor * pFactor * learn * facilities * freshness;
        // Extraeinheit bringt etwas mehr Lernreiz (aber auch mehr Belastung).
        if (isExtra[i]) gain *= 1.15;
        // In 0.1-Schritten akkumulieren.
        gain = Math.round(gain * 10) / 10;
        if (gain <= 0) continue;
        acc[attr] = Math.round(((acc[attr] ?? 0) + gain) * 10) / 10;
      }
    }

    // --- Fitness anpassen (Grund-Regeneration − Tagesbelastung) ---
    const delta = DAILY_BASE_RECOVERY - totalLoad;
    p.attributes.fitness = Math.max(15, Math.min(100, p.attributes.fitness + delta));
    // --- Frische erholt sich täglich (unabhängig von der Fitness) ---
    recoverFreshness(p);
    // Trainingslast steigt mit der Belastung, sinkt bei Erholung.
    p.trainingLoad = Math.max(0, p.trainingLoad + Math.round(totalLoad) - DAILY_BASE_RECOVERY + 5);

    // --- Kleiner Form-Effekt ---
    if (totalLoad <= 0) {
      // reiner Erholungstag: leichte Drift zur Mitte
      p.form = Math.max(0, Math.min(100, p.form + (50 - p.form) * 0.04));
    } else if (totalLoad > 12 && p.attributes.fitness < 45) {
      p.form = Math.max(0, Math.min(100, p.form - 1.2)); // Überlastung schadet
    } else {
      p.form = Math.max(0, Math.min(100, p.form + 0.3)); // sinnvolles Training hilft
    }
  }

  return slots.filter(Boolean).length;
}

// =============================================================================
// FOOTBALL MANAGER 1980 — Trainings-Engine (vereinfacht)
// Erhöht Attribute je nach Fokus; hohe Intensität -> Müdigkeit/Verletzungsrisiko.
// =============================================================================

import {
  Club, Player, TrainingFocus, AttributeKey, Injury, TrainingReport,
} from '../types';
import { recoverFreshness } from './form';

// Zuordnung Trainingsfokus -> betroffene Attribute
const FOCUS_ATTRS: Record<TrainingFocus, AttributeKey[]> = {
  fitness: ['stamina', 'speed', 'acceleration'],
  technique: ['technique', 'firstTouch', 'ballControl', 'dribbling'],
  tactics: ['positioning', 'decisions', 'concentration', 'teamwork'],
  strength: ['strength', 'jumping', 'aggression'],
  standards: ['penalties', 'freeKicks', 'corners', 'crossing'],
  shooting: ['shooting', 'shotPower', 'longShots', 'composure'],
  defending: ['tackling', 'marking', 'interceptions', 'positioning'],
  passing: ['passing', 'longPassing', 'vision', 'crossing'],
  recovery: [],
  rest: [],
};

/** Intensitätsfaktor 0..1 (0 = Ruhe, 1 = Vollgas). */
export function intensityFactor(intensity: number): number {
  return Math.max(0, Math.min(1, intensity / 100));
}

/**
 * Trainiert den gesamten Kader eines Vereins.
 * @param intensity 0..100
 */
export function trainPlayers(
  club: Club,
  players: Record<string, Player>,
  focus: TrainingFocus,
  intensity: number,
  date: string,
): TrainingReport[] {
  const reports: TrainingReport[] = [];
  const factor = intensityFactor(intensity);
  const facilities = club.trainingSchedule.facilitiesQuality / 100;
  const attrs = FOCUS_ATTRS[focus];

  for (const pid of club.playerIds) {
    const p = players[pid];
    if (!p || p.availability === 'injured') continue;

    const report: TrainingReport = {
      playerId: pid, date, attributeChanges: {}, fitnessChange: 0,
      injuryOccurred: false, note: '',
    };

    // Regeneration bei Ruhe/Recovery
    if (focus === 'rest' || focus === 'recovery') {
      const rec = focus === 'rest' ? 8 : 5;
      p.attributes.fitness = Math.min(100, p.attributes.fitness + rec);
      p.trainingLoad = Math.max(0, p.trainingLoad - 15);
      report.fitnessChange = rec;
      report.note = 'Regeneration';
      reports.push(report);
      continue;
    }

    // Attribut-Wachstum: nur wenn unter Potenzial, jung & gute Anlagen begünstigt
    const room = p.development.potentialAbility - p.development.currentAbility;
    if (room > 0) {
      const growthChance = 0.06 * factor * facilities * p.development.growthRate * (room / 20);
      for (const attr of attrs) {
        if (Math.random() < growthChance && (p.attributes[attr] as number) < 99) {
          (p.attributes[attr] as number)++;
          report.attributeChanges[attr] = ((report.attributeChanges[attr] as number) || 0) + 1;
        }
      }
      const gained = Object.keys(report.attributeChanges).length;
      if (gained > 0) {
        p.development.currentAbility = Math.min(p.development.potentialAbility, p.development.currentAbility + gained * 0.3);
      }
    }

    // Fitness sinkt durch Belastung
    const drain = Math.round(factor * 12);
    p.attributes.fitness = Math.max(20, p.attributes.fitness - drain);
    p.trainingLoad += Math.round(factor * 20);
    report.fitnessChange = -drain;

    // Verletzungsrisiko: steigt mit Intensität, Trainingslast & Anfälligkeit
    const injRisk = 0.002 + factor * 0.02 + (p.trainingLoad / 5000) + (p.development.injuryProneness / 8000);
    if (Math.random() < injRisk) {
      const inj = makeTrainingInjury(date);
      p.injury = inj;
      p.availability = 'injured';
      report.injuryOccurred = true;
      report.note = `Verletzung im Training: ${inj.description}`;
    } else {
      report.note = `Training: ${focus}`;
    }

    reports.push(report);
  }

  return reports;
}

function makeTrainingInjury(date: string): Injury {
  const options = [
    { type: 'muscle' as const, severity: 'minor' as const, desc: 'Muskelzerrung', days: 7 },
    { type: 'muscle' as const, severity: 'moderate' as const, desc: 'Muskelfaserriss', days: 21 },
    { type: 'bruise' as const, severity: 'minor' as const, desc: 'Prellung', days: 4 },
    { type: 'ligament' as const, severity: 'moderate' as const, desc: 'Bänderdehnung', days: 28 },
    { type: 'fatigue' as const, severity: 'minor' as const, desc: 'Überlastung', days: 5 },
  ];
  const o = options[Math.floor(Math.random() * options.length)];
  const start = new Date(date + 'T00:00:00');
  const ret = new Date(start);
  ret.setDate(ret.getDate() + o.days);
  return {
    id: `inj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: o.type, severity: o.severity, description: o.desc,
    startDate: date, expectedReturnDate: ret.toISOString().slice(0, 10),
    daysRemaining: o.days, totalDays: o.days, fromTraining: true,
  };
}

/**
 * Tägliche Fitness-Regeneration & Verletzungs-Countdown für alle Spieler.
 * @param excludeIds Spieler-IDs, die ausgenommen werden (z.B. der Manager-Verein,
 *   dessen Fitness an Trainingstagen bereits über den Wochenplan geregelt wird).
 */
export function dailyRecovery(players: Record<string, Player>, excludeIds?: Set<string>): void {
  for (const p of Object.values(players)) {
    if (excludeIds && excludeIds.has(p.id)) continue;
    if (p.injury) {
      p.injury.daysRemaining--;
      if (p.injury.daysRemaining <= 0) {
        p.injury = null;
        p.availability = 'available';
        p.attributes.fitness = 70;
        p.frische = 100;
      }
    } else {
      p.attributes.fitness = Math.min(100, p.attributes.fitness + 3);
      p.trainingLoad = Math.max(0, p.trainingLoad - 5);
      recoverFreshness(p);
    }
  }
}

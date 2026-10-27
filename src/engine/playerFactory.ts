// =============================================================================
// Spielerfabrik: erzeugt Profis mit Herkunft, positionsgerechten Werten,
// verdecktem Charakter und verdecktem Potenzial. Genutzt von der Weltgenerierung
// (1975) und vom Nachrücken neuer Spieler in späteren Jahren (Regens).
// =============================================================================
import { Player, Position, PlayerAttributes, AttributeKey, createEmptyStats, potentialToStars, clampStars } from '../types';
import { weightsFor, positionSuitability } from './positions';
import { pickOrigin, makeName, Origin } from '../data/origins';

export interface NewPlayerSpec {
  id: string;
  clubId: string;
  pos: Position;
  age: number;
  /** Ziel-Gesamtstärke heute. */
  strength: number;
  /** Spieljahr (für Herkunftsmischung, Geburtsjahr, Vertrag). */
  year: number;
  /** Heutiges Datum (ISO). */
  date: string;
  rng: () => number;
  shirt?: number;
  /** Nur einheimische Herkunft (z. B. Nachwuchs). */
  domestic?: boolean;
  origin?: Origin;
}

const ALL_KEYS: AttributeKey[] = [
  'fitness', 'stamina', 'speed', 'acceleration', 'strength', 'jumping', 'agility', 'balance',
  'technique', 'firstTouch', 'shooting', 'shotPower', 'longShots', 'passing', 'longPassing', 'crossing',
  'dribbling', 'ballControl', 'heading', 'tackling', 'marking', 'positioning', 'interceptions',
  'experience', 'vision', 'composure', 'concentration', 'decisions', 'leadership', 'workRate', 'aggression',
  'teamwork', 'flair', 'reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication',
  'penalties', 'freeKicks', 'corners',
];
const GK_ONLY: AttributeKey[] = ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'];
const OUTFIELD_ATTACK: AttributeKey[] = ['shooting', 'dribbling', 'longShots', 'crossing', 'shotPower', 'flair'];

const clamp = (v: number, lo = 1, hi = 99) => Math.max(lo, Math.min(hi, Math.round(v)));

/**
 * Positionsgerechte Attribute: Schlüsselwerte der Position liegen über dem
 * Grundniveau, fachfremde darunter. Danach wird so verschoben, dass die
 * Positionsstärke genau die Zielstärke trifft.
 */
export function makePositionAttributes(pos: Position, strength: number, age: number, rng: () => number): PlayerAttributes {
  const w = weightsFor(pos) as Partial<Record<AttributeKey, number>>;
  const noise = (s: number) => (rng() + rng() + rng() - 1.5) * s; // ~normalverteilt
  const gk = pos === 'TW';
  const a = {} as PlayerAttributes;
  for (const k of ALL_KEYS) {
    let v: number;
    if (k === 'fitness') v = 88 + rng() * 12;
    else if (GK_ONLY.includes(k)) v = gk ? strength + 2 + noise(8) : 8 + rng() * 18;
    else if (gk && OUTFIELD_ATTACK.includes(k)) v = 18 + rng() * 22;
    else {
      const wk = w[k] ?? 0;
      v = strength + (wk > 0 ? 2 + wk * 2.5 : -9) + noise(10);
    }
    (a as any)[k] = clamp(v);
  }
  // Erfahrung wächst mit dem Alter, nicht mit der Position.
  a.experience = clamp(20 + (age - 16) * 4 + noise(8), 5, 95);
  // Feinjustierung auf die Zielstärke.
  const probe = { attributes: a, naturalPosition: pos, secondaryPositions: [], overall: strength } as unknown as Player;
  const delta = strength - positionSuitability(probe, pos);
  if (delta !== 0) for (const k of Object.keys(w) as AttributeKey[]) (a as any)[k] = clamp(a[k] + delta);
  return a;
}

/** Verdecktes Charakter-Set (1–100). */
export function makePersonality(rng: () => number) {
  const tri = () => Math.round(20 + (rng() + rng() + rng()) / 3 * 75);
  return { professionalism: tri(), ambition: tri(), adaptability: tri() };
}

/** Grundpotenzial abhängig von Alter und heutiger Stärke (OVR-Skala). */
export function rollBasePotential(age: number, strength: number, rng: () => number): number {
  const headroomByAge = age <= 17 ? 18 : age <= 19 ? 14 : age <= 21 ? 10 : age <= 23 ? 6 : age <= 26 ? 3 : 1;
  const u = (rng() + rng() + rng()) / 3; // 0..1, mittig
  // Je näher an der Weltspitze, desto weniger Luft nach oben.
  const room = Math.pow(Math.max(0, 99 - strength) / 25, 0.9);
  let pot = strength + headroomByAge * (0.2 + u * 1.2) * room;
  if (age <= 20 && rng() < 0.02) pot += 5 + rng() * 6; // seltenes Ausnahmetalent
  return clamp(pot, strength, 96);
}

function birthDate(age: number, year: number, rng: () => number): string {
  return `${year - age}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`;
}

export function createPlayer(spec: NewPlayerSpec): Player {
  const { rng, pos, age, strength, year, date } = spec;
  const origin = spec.origin ?? pickOrigin(year, rng, spec.domestic);
  const { firstName, lastName } = makeName(origin, rng);
  const attributes = makePositionAttributes(pos, strength, age, rng);
  const probe = { attributes, naturalPosition: pos, secondaryPositions: [] } as unknown as Player;
  const overall = positionSuitability(probe, pos);
  const pers = makePersonality(rng);
  const basePotential = Math.max(overall, rollBasePotential(age, overall, rng));
  const value = Math.round(overall * overall * 1000 * (age < 24 ? 1.5 : age < 29 ? 1.2 : 0.6));
  const scoutBias = Math.round((rng() - 0.5) * 4) / 4; // −0,5 … +0,5 Sterne
  const stars = potentialToStars(basePotential);
  return {
    id: spec.id,
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    shirtNumber: spec.shirt ?? 0,
    nationality: origin.nationality,
    origin: origin.id, face: origin.face,
    dateOfBirth: birthDate(age, year, rng), age,
    height: pos === 'TW' ? 182 + Math.floor(rng() * 14) : 168 + Math.floor(rng() * 24),
    weight: 64 + Math.floor(rng() * 24),
    preferredFoot: rng() < 0.72 ? 'right' : (rng() < 0.8 ? 'left' : 'both'),
    naturalPosition: pos, secondaryPositions: [],
    positionRatings: { [pos]: overall },
    attributes, overall,
    form: 45 + Math.floor(rng() * 30), frische: 100, morale: 'good', availability: 'available',
    injury: null, suspensionMatches: 0, yellowCardCount: 0,
    clubId: spec.clubId,
    contract: {
      weeklyWage: Math.round(overall * 120 + rng() * 500),
      expiryDate: `${year + 1 + Math.floor(rng() * 4)}-06-30`,
      transferValue: value, satisfaction: 55 + Math.floor(rng() * 35),
    },
    development: {
      currentAbility: overall, potentialAbility: basePotential,
      growthRate: 0.8 + rng() * 0.5,
      injuryProneness: 5 + Math.floor(rng() * 45), consistency: 35 + Math.floor(rng() * 55),
      bigMatchTemperament: 35 + Math.floor(rng() * 55), lastRatingChange: 0,
      abilityHistory: [{ date, ability: overall }],
      seasonStarChange: 0,
      basePotential, unfold: 0, ...pers, devPoints: 0, recentMinutes: 0, lastMinutesSeen: 0, scoutBias,
    },
    potentialStars: clampStars(stars),
    seasonStats: createEmptyStats(), careerStats: createEmptyStats(),
    trainingLoad: 0, transferListed: false,
  };
}

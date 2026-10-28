// =============================================================================
// Legenden erzeugen: Jugendspieler oder Profi passend zu Alter, Archetyp,
// verdeckt ausgewürfeltem Potenzial und Entwicklungskurve.
// =============================================================================
import { Game } from './state';
import { LegendSeed } from '../data/legends';
import {
  CURVE_PEAK_AGE, LegendRarity, RARITY_BOOST, RARITY_CORRIDOR, archetypeFor, parseSignature, rarityFromPeak, rollLegendPeak,
} from '../data/legendArchetypes';
import { loadLegendNames, splitName } from '../data/legendNames';
import { ORIGINS } from '../data/origins';
import { createPlayer, makePositionAttributes } from '../engine/playerFactory';
import { generateYouthPlayer } from '../engine/youth';
import { refreshOverall } from '../engine/development';
import { marketWage } from '../engine/clubEconomy';
import { Club, Player, clampStars, potentialToStars } from '../types';

export function rarityOf(seed: LegendSeed): LegendRarity {
  return seed.rarity ?? rarityFromPeak(seed.peak);
}

export function isForeignLegend(seed: LegendSeed): boolean {
  return (ORIGINS[seed.origin]?.nationality ?? 'GER') !== 'GER' && !seed.cities?.length;
}

let nameCache: Record<string, string> | null = null;
/** Name der Legende (eigene Namensdatei, falls gewählt). */
function legendName(g: Game, seed: LegendSeed): { firstName: string; lastName: string } {
  if (g.legendMode === 'custom') {
    nameCache ??= loadLegendNames();
    const n = nameCache[seed.id];
    if (n) return splitName(n);
  }
  return { firstName: seed.firstName, lastName: seed.lastName };
}
/** Nach einem Import neu einlesen. */
export function resetLegendNameCache(): void { nameCache = null; }

/** Erwartete Stärke in einem Alter (Karrierephase) bei gegebenem Höchstwert. */
export function legendStrengthAt(peak: number, curve: LegendSeed['curve'], age: number): number {
  const peakAge = CURVE_PEAK_AGE[curve ?? 'normal'];
  let v = peak;
  if (age < peakAge) v = peak - (peakAge - age) * (age < 20 ? 3.2 : 2.2);
  else if (age > peakAge + 4) v = peak - (age - peakAge - 4) * 2.4;
  return Math.max(48, Math.min(peak, Math.round(v)));
}

/** Gemeinsame Legenden-Eigenschaften auf einen Spieler legen. */
function applyProfile(g: Game, p: Player, seed: LegendSeed, peak: number): void {
  const { firstName, lastName } = legendName(g, seed);
  p.firstName = firstName; p.lastName = lastName; p.fullName = `${firstName} ${lastName}`;
  const origin = ORIGINS[seed.origin];
  if (origin) { p.nationality = origin.nationality; p.origin = origin.id; p.face = origin.face; }
  const rarity = rarityOf(seed);
  const d = p.development;
  d.legendId = seed.id;
  d.legendBoost = RARITY_BOOST[rarity];
  d.legendCurve = seed.curve ?? 'normal';
  d.legendSignature = (seed.signature ?? []).map(parseSignature).filter((x): x is NonNullable<typeof x> => !!x);
  d.potentialAbility = peak;
  d.basePotential = Math.max(p.overall, peak);
  d.professionalism = seed.professionalism;
  d.ambition = seed.ambition;
  p.potentialStars = clampStars(potentialToStars(peak));
  // Scouts sehen nur den Korridor der Seltenheit, nicht das ausgewürfelte Ziel.
  const [lo, hi] = RARITY_CORRIDOR[rarity];
  p.scoutedPotentialMin = lo;
  p.scoutedPotentialMax = hi;
}

/** Archetyp-Attribute anheben (Startprofil) und Stärke neu berechnen. */
function boostArchetype(p: Player, seed: LegendSeed, amount: number): void {
  const arch = archetypeFor(seed.archetype, seed.position);
  for (const k of arch.attrs) (p.attributes as any)[k] = Math.min(99, (p.attributes[k] ?? 40) + amount);
  refreshOverall(p);
}

/** Legende als Jugendspieler (Alter 15–17) in einer Akademie oder als Interessent. */
export function makeLegendYouth(g: Game, seed: LegendSeed, clubId: string, date: string, academy: number, age: number): Player {
  const peak = rollLegendPeak(rarityOf(seed), seed.peak, Math.random);
  const p = generateYouthPlayer(clubId, `legend_${seed.id}`, date, Math.max(3, academy), age);
  p.id = `legend_${seed.id}`;
  p.naturalPosition = seed.position;
  p.secondaryPositions = [];
  // Positionsgerechte Grundwerte statt der zufälligen Jugendposition.
  p.attributes = makePositionAttributes(seed.position, Math.max(30, p.overall), age, Math.random);
  boostArchetype(p, seed, 5);
  p.dateOfBirth = `${seed.birthYear}-${p.dateOfBirth.slice(5)}`;
  p.age = Number(date.slice(0, 4)) - seed.birthYear - (date.slice(5) < p.dateOfBirth.slice(5) ? 1 : 0);
  applyProfile(g, p, seed, peak);
  return p;
}

/** Legende als Profi passend zur Karrierephase (Spielstart, Wende, Auslandswechsel). */
export function makeLegendPro(g: Game, seed: LegendSeed, club: Club, date: string, age: number, id?: string, shirt?: number): Player {
  const peak = rollLegendPeak(rarityOf(seed), seed.peak, Math.random);
  const year = Number(date.slice(0, 4));
  const strength = legendStrengthAt(peak, seed.curve, age);
  const p = createPlayer({
    id: id ?? `legend_${seed.id}`, clubId: club.id, pos: seed.position, age, strength, year, date,
    rng: Math.random, shirt, origin: ORIGINS[seed.origin],
  });
  boostArchetype(p, seed, 3);
  p.dateOfBirth = `${seed.birthYear}-${p.dateOfBirth.slice(5)}`;
  applyProfile(g, p, seed, peak);
  // Etablierte Legenden verdienen und kosten entsprechend.
  p.contract.weeklyWage = marketWage(p);
  p.contract.expiryDate = `${year + 2 + Math.floor(Math.random() * 3)}-06-30`;
  return p;
}

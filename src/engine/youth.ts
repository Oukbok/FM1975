// =============================================================================
// FOOTBALL MANAGER 1980 — Jugendsystem (Jugendakademie)
// =============================================================================
// Jeder Verein besitzt eine Jugendakademie, deren Ausbaustufe (Infrastruktur,
// siehe engine/infrastructure.ts) steuert, WIE VIELE und WIE GUTE Talente
// entstehen und WIE SCHNELL sie sich entwickeln.
//
// Besonderheit: das ECHTE Potenzial eines Talents ist verborgen. Die Scouting-
// Einschätzung wird als STERNE-SPANNE (min–max) angezeigt und engt sich mit der
// Zeit (und je nach Akademie-Stufe) immer weiter an das wahre Potenzial an,
// bis es schließlich feststeht.
//
// Talente altern und entwickeln sich wöchentlich (Lernrate × Akademie-Faktor).
// Über "Hochziehen in den Profikader" wandert ein Talent in die A-Mannschaft.
// =============================================================================

import { ensureDevFields, refreshOverall } from './development';
import { updateScoutEstimate } from './scouting';
import { pickOrigin, makeName } from '../data/origins';
import { makePersonality } from './playerFactory';
import {
  Player, Club, PlayerAttributes, Position, AttributeKey,
  createEmptyStats, clampStars, starsToPotential, potentialToStars,
  YOUTH_ENTRY_AGE, YOUTH_GRADUATE_AGE,
} from '../types';
import {
  academyIntakeCount, academyQualityBonus, academyGrowthFactor,
} from './infrastructure';
import { ageFactor, potentialFactor } from './weeklyTraining';

// -----------------------------------------------------------------------------
// Deterministischer RNG (mulberry32) — aus einem String-Seed abgeleitet.
// -----------------------------------------------------------------------------
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -----------------------------------------------------------------------------
// Namens-Pools (Ära-gerecht, jüngerer Jahrgang)
// -----------------------------------------------------------------------------
const FIRST_NAMES = ['Michael', 'Thomas', 'Andreas', 'Stefan', 'Frank', 'Markus', 'Oliver', 'Dirk', 'Jörg', 'Sven', 'Ralf', 'Holger', 'Carsten', 'Matthias', 'Christian', 'Marco', 'Torsten', 'Kai', 'Guido', 'Jens', 'Uwe', 'Bernd', 'Achim', 'Detlef'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter', 'Vogel', 'Seidel', 'Brandt', 'Scholz'];

// Mögliche Positionen für Talente (gewichtete Grundverteilung).
const YOUTH_POSITIONS: Position[] = [
  'TW', 'LIB', 'VS', 'VS', 'AV', 'AV', 'DM', 'ZM', 'ZM', 'OM', 'FL', 'FL', 'MS', 'MS', 'HS',
];

// -----------------------------------------------------------------------------
// Attribut-Erzeugung (analog generate.ts, aber auf Jugendniveau abgesenkt)
// -----------------------------------------------------------------------------
function makeYouthAttributes(rand: () => number, base: number, pos: Position): PlayerAttributes {
  const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const v = (spread = 11) => Math.max(1, Math.min(99, base + ri(-spread, spread)));
  const g = pos === 'TW';
  return {
    fitness: 88 + ri(0, 12), stamina: v(), speed: v(), acceleration: v(),
    strength: Math.max(1, v() - 6), jumping: v(), agility: v(), balance: v(),
    technique: v(), firstTouch: v(), shooting: g ? ri(8, 26) : v(), shotPower: v(),
    longShots: v(), passing: v(), longPassing: v(), crossing: v(),
    dribbling: g ? ri(8, 26) : v(), ballControl: v(), heading: v(),
    tackling: v(), marking: v(), positioning: v(), interceptions: v(),
    experience: Math.max(1, ri(4, 16)), vision: v(), composure: Math.max(1, v() - 5), concentration: v(),
    decisions: v(), leadership: Math.max(1, ri(6, 30)), workRate: v(), aggression: v(),
    teamwork: v(), flair: v(),
    reflexes: g ? v() : ri(4, 18), handling: g ? v() : ri(4, 18),
    kicking: g ? v() : ri(18, 38), aerialReach: g ? v() : ri(4, 18),
    oneOnOnes: g ? v() : ri(4, 18), communication: g ? v() : ri(16, 40),
    penalties: v(), freeKicks: v(), corners: v(),
  };
}

function computeOverall(a: PlayerAttributes, pos: Position): number {
  let keys: AttributeKey[];
  if (pos === 'TW') keys = ['reflexes', 'handling', 'positioning', 'oneOnOnes', 'aerialReach', 'communication'];
  else if (['LIB', 'VS', 'AV'].includes(pos)) keys = ['tackling', 'marking', 'positioning', 'strength', 'heading', 'interceptions'];
  else if (['DM', 'ZM', 'OM'].includes(pos)) keys = ['passing', 'vision', 'technique', 'stamina', 'ballControl', 'decisions'];
  else keys = ['shooting', 'dribbling', 'speed', 'composure', 'firstTouch', 'heading'];
  const sum = keys.reduce((s, k) => s + (a[k] as number), 0);
  return Math.round(sum / keys.length);
}

function birthDate(rand: () => number, age: number, currentYear: number): string {
  const year = currentYear - age;
  const mo = Math.floor(rand() * 12) + 1;
  const day = Math.floor(rand() * 28) + 1;
  return `${year}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// Verstecktes Potenzial + Scouting-Spanne
// -----------------------------------------------------------------------------
/**
 * Vergibt das WAHRE (verborgene) Potenzial eines Talents. Bessere Akademien
 * heben die Talent-Obergrenze leicht an; echte Ausnahmetalente sind selten.
 */
function assignYouthPotential(rand: () => number, academyLevel: number): number {
  const lift = (academyLevel - 1) * 0.05; // bessere Akademie → etwas mehr Talent
  const roll = rand();
  let stars: number;
  if (roll < 0.015 + lift * 0.1) stars = 4.5 + rand() * 0.5;        // Ausnahmetalent (sehr selten)
  else if (roll < 0.11 + lift * 0.5) stars = 3.75 + rand() * 0.75;  // hohes Talent
  else if (roll < 0.50 + lift) stars = 3.0 + rand() * 0.75;         // solides Talent
  else stars = 2.0 + rand() * 1.0;                                  // Durchschnitt
  return clampStars(stars);
}

/**
 * Altersabhängiger Unschärfe-Faktor für die Scouting-Spanne. Sehr junge Talente
 * (F/E/D-Jugend) lassen sich kaum einschätzen → sehr breite Spanne; mit
 * steigendem Alter (C/B/A) wird die Einschätzung deutlich präziser.
 */
function ageUncertaintyFactor(age: number): number {
  if (age <= 9) return 2.2;    // G-/F-Jugend (Bambini): praktisch nicht einzuschätzen
  if (age <= 11) return 1.9;   // E-Jugend: kaum einzuschätzen
  if (age <= 13) return 1.55;  // D-Jugend
  if (age <= 15) return 1.25;  // C-Jugend
  if (age <= 17) return 1.05;  // B-Jugend
  return 0.9;                  // A-Jugend: relativ konkret
}

/**
 * Legt die anfängliche Scouting-SPANNE um das wahre Potenzial fest. Je besser
 * die Akademie und je älter das Talent, desto präziser (engere) die erste
 * Einschätzung.
 * @returns [min, max] Sterne (0.25-Raster), stets min ≤ wahr ≤ max.
 */
function initialScoutRange(rand: () => number, truePot: number, academyLevel: number, age: number): [number, number] {
  // Unschärfe je Seite: Grundstreuung × Alters-Faktor, reduziert durch Akademie.
  const baseSpread = (1.5 - academyLevel * 0.12) * ageUncertaintyFactor(age);
  const below = Math.max(0.25, baseSpread * (0.5 + rand() * 0.5));
  const above = Math.max(0.25, baseSpread * (0.5 + rand() * 0.5));
  const min = clampStars(truePot - below);
  const max = clampStars(truePot + above);
  return [Math.min(min, truePot), Math.max(max, truePot)];
}

// -----------------------------------------------------------------------------
// Einzelnes Talent erzeugen
// -----------------------------------------------------------------------------
/**
 * Erzeugt ein einzelnes Jugendtalent mit echten Attributen und VERBORGENEM
 * Potenzial (nur als Scouting-Spanne sichtbar).
 *
 * Jugendspieler treten mit 7 Jahren (G-Jugend/Bambini) ein; das Alter bestimmt
 * die aktuelle Fähigkeit (sehr junge Talente sind spielerisch noch schwach)
 * sowie die Breite der anfänglichen Scouting-Spanne (jünger = unsicherer).
 *
 * @param uniqueSeed eindeutiger String-Seed (z.B. clubId + Jahr + Laufindex)
 * @param age        gewünschtes Alter; ohne Angabe zufällig 16–19 (Altkompat.)
 */
export function generateYouthPlayer(
  clubId: string,
  uniqueSeed: string,
  currentDate: string,
  academyLevel: number,
  age?: number,
): Player {
  const rand = mulberry32(hashSeed(`${clubId}|${uniqueSeed}`));
  const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const currentYear = Number(currentDate.slice(0, 4));
  const origin = pickOrigin(currentYear, rand, rand() < 0.9);
  const { firstName, lastName } = makeName(origin, rand);
  const pos = pick(YOUTH_POSITIONS);
  const useAge = age != null
    ? Math.max(YOUTH_ENTRY_AGE, Math.min(19, Math.round(age)))
    : ri(16, 19);

  // Grundstärke: stark altersabhängig. Ein 7-jähriges Bambini ist spielerisch
  // noch sehr schwach (~8), ein 19-Jähriger deutlich weiter (~52); dazu kommt der
  // Akademie-Qualitätsbonus und etwas Streuung.
  const qBonus = academyQualityBonus(academyLevel);
  const ageBase = 8 + (useAge - YOUTH_ENTRY_AGE) * 3.7; // Alter 7→8 … 19→52.4
  const base = Math.max(6, Math.min(70, Math.round(ageBase + qBonus * 0.55 + ri(-5, 5))));
  const attributes = makeYouthAttributes(rand, base, pos);
  const overall = computeOverall(attributes, pos);

  // Wahres Potenzial (verborgen) — nie unter dem aktuellen OVR.
  let truePot = assignYouthPotential(rand, academyLevel);
  const minStarsForOverall = potentialToStars(overall + 4);
  if (truePot < minStarsForOverall) truePot = minStarsForOverall;
  const potentialAbility = Math.max(overall + 3, starsToPotential(truePot));

  const [scoutMin, scoutMax] = initialScoutRange(rand, truePot, academyLevel, useAge);

  const value = Math.round(overall * overall * 400);

  return {
    id: `${clubId}_y_${uniqueSeed}`,
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    shirtNumber: 30 + ri(0, 69),
    nationality: origin.nationality, origin: origin.id, face: origin.face,
    dateOfBirth: birthDate(rand, useAge, currentYear), age: useAge,
    height: ri(168, 192), weight: ri(60, 82),
    preferredFoot: rand() < 0.7 ? 'right' : (rand() < 0.7 ? 'left' : 'both'),
    naturalPosition: pos, secondaryPositions: [],
    positionRatings: { [pos]: overall },
    attributes, overall,
    form: ri(40, 65), frische: 100, morale: 'good', availability: 'available',
    injury: null, suspensionMatches: 0, yellowCardCount: 0,
    clubId,
    contract: {
      weeklyWage: Math.round(overall * 25 + ri(0, 150)),
      expiryDate: `${currentYear + ri(2, 4)}-06-30`,
      transferValue: value, satisfaction: ri(60, 90),
    },
    development: {
      currentAbility: overall, potentialAbility,
      growthRate: 1.3 + rand() * 0.8,
      injuryProneness: ri(5, 35), consistency: ri(35, 70),
      bigMatchTemperament: ri(35, 75), lastRatingChange: 0,
      abilityHistory: [{ date: currentDate, ability: overall }],
      seasonStarChange: 0,
      attributeProgress: {}, ovrProgress: 0,
      basePotential: potentialAbility, unfold: 0, ...makePersonality(rand),
      devPoints: 0, recentMinutes: 0, lastMinutesSeen: 0, scoutBias: Math.round((rand() - 0.5) * 4) / 4,
    },
    potentialStars: truePot,          // WAHRES Potenzial (verborgen in der UI)
    seasonStats: createEmptyStats(), careerStats: createEmptyStats(),
    trainingLoad: 0, transferListed: false,
    isYouth: true,
    scoutedPotentialMin: scoutMin,
    scoutedPotentialMax: scoutMax,
  };
}

// -----------------------------------------------------------------------------
// Nachwuchsrunde (Intake)
// -----------------------------------------------------------------------------
/**
 * Erzeugt einen kompletten neuen Jahrgang für einen Verein. Anzahl richtet sich
 * nach der Akademie-Stufe (academyIntakeCount).
 * @returns Liste neuer Talente (noch NICHT in den Verein eingehängt).
 */
export function academyIntake(club: Club, currentDate: string, cohortTag: string): Player[] {
  const level = club.infrastructure.youthAcademy;
  const count = academyIntakeCount(level);
  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    // Neuzugänge treten stets als jüngster Jahrgang mit 7 Jahren (G-Jugend/Bambini) ein.
    players.push(generateYouthPlayer(club.id, `${cohortTag}_${i}`, currentDate, level, YOUTH_ENTRY_AGE));
  }
  return players;
}

// -----------------------------------------------------------------------------
// Start-Jahrgänge (kompletter Altersaufbau F–A) für Spielbeginn / Retrofit
// -----------------------------------------------------------------------------
/**
 * Erzeugt einen kompletten, über alle Altersklassen verteilten Jugendstamm für
 * einen Verein: für jeden Jahrgang von 7 (G-Jugend/Bambini) bis 19 (A-Jugend)
 * werden je nach Akademie-Stufe ein oder zwei Talente erzeugt. So besitzt jeder
 * Verein von Beginn an einen glaubhaften Altersaufbau über alle deutschen
 * Nachwuchs-Altersklassen statt nur eines einzigen Jahrgangs.
 * @returns Liste neuer Talente (noch NICHT in den Verein eingehängt).
 */
export function academyStartingCohort(club: Club, currentDate: string): Player[] {
  const level = club.infrastructure.youthAcademy;
  const perYear = level >= 4 ? 2 : 1;
  const players: Player[] = [];
  for (let age = YOUTH_ENTRY_AGE; age < YOUTH_GRADUATE_AGE; age++) {
    for (let i = 0; i < perYear; i++) {
      players.push(generateYouthPlayer(club.id, `init_${age}_${i}`, currentDate, level, age));
    }
  }
  return players;
}

// -----------------------------------------------------------------------------
// Jahrgangsabschluss: Talente verlassen am Ende der A-Jugend die Akademie
// -----------------------------------------------------------------------------
export interface GraduateResult {
  promoted: Player[]; // in den Profikader hochgezogen
  released: Player[]; // haben den Verein verlassen
}

/**
 * Wickelt den Jahrgangsabschluss ab: Talente, die die A-Jugend beendet haben
 * (Alter ≥ YOUTH_GRADUATE_AGE, i.d.R. 20), verlassen die Jugendakademie.
 *  - Der eigene (gemanagte) Verein zieht die besten Talente in den Profikader
 *    hoch (Potenzial-Sterne ≥ 3.0, solange Kaderplatz frei ist), der Rest
 *    verlässt den Verein.
 *  - CPU-Vereine ziehen höchstens das beste Talent hoch (Potenzial ≥ 3.5) und
 *    lassen den Rest ziehen (bewusst simpel gehalten).
 *
 * Wird NACH ageYouthPlayers und VOR academyIntake aufgerufen.
 * @returns Listen der hochgezogenen und der abgegebenen Talente.
 */
export function graduateYouth(
  club: Club,
  players: Record<string, Player>,
  youthPlayers: Record<string, Player>,
  isManaged: boolean,
  maxSquad = 26,
): GraduateResult {
  const result: GraduateResult = { promoted: [], released: [] };

  // Absolventen (Alter ≥ Abschlussalter) ermitteln, bestes Potenzial zuerst.
  const graduates = club.youthPlayerIds
    .map((id) => youthPlayers[id])
    .filter((p): p is Player => !!p && p.age >= YOUTH_GRADUATE_AGE)
    .sort((a, b) => b.potentialStars - a.potentialStars);

  let cpuPromoted = false;

  for (const p of graduates) {
    let promote = false;
    if (isManaged) {
      // Bester Nachwuchs wird hochgezogen, solange Kaderplatz frei ist.
      promote = p.potentialStars >= 3.0 && club.playerIds.length < maxSquad;
    } else {
      // CPU: höchstens ein Talent pro Jahr, nur echte Perspektivspieler.
      promote = !cpuPromoted && p.potentialStars >= 3.5 && club.playerIds.length < maxSquad;
    }

    if (promote) {
      const res = promoteYouth(club, p.id, players, youthPlayers, maxSquad);
      if (res.ok) {
        result.promoted.push(p);
        cpuPromoted = true;
        continue;
      }
    }

    // Nicht hochgezogen → Talent verlässt den Verein.
    const idx = club.youthPlayerIds.indexOf(p.id);
    if (idx >= 0) club.youthPlayerIds.splice(idx, 1);
    delete youthPlayers[p.id];
    result.released.push(p);
  }

  return result;
}

// -----------------------------------------------------------------------------
// Wöchentliche Entwicklung der Talente
// -----------------------------------------------------------------------------
export interface YouthDevReveal {
  playerId: string;
  name: string;
  upAttrs: string[];
  ovrUp: boolean;
  newOverall: number;
}

const YOUTH_BASE_GAIN = 0.26;      // Grundlernreiz pro Woche
const OVR_PER_ATTR_POINT = 0.34;   // wie in development.ts

/**
 * Entwickelt die Talente eines Vereins um eine Woche weiter:
 *  - füllt den Attribut-Akkumulator (Lernrate × Alter × Kopffreiheit × Akademie),
 *  - schreibt sichtbare +1-Aufwertungen gut (Softcap aus wahrem Potenzial),
 *  - engt die Scouting-Spanne Schritt für Schritt an das wahre Potenzial an.
 * @param youthPlayers globale Talent-Sammlung (wird in-place verändert)
 */
export function developYouthWeekly(
  club: Club,
  youthPlayers: Record<string, Player>,
  opts?: { growthBonus?: number; scoutBonus?: number },
): YouthDevReveal[] {
  const reveals: YouthDevReveal[] = [];
  // NLZ (Block p11) erhöht das Wachstum zusätzlich zur klassischen Akademie.
  const growthBonus = Math.max(0, opts?.growthBonus ?? 0);
  const scoutBonus = Math.max(0, opts?.scoutBonus ?? 0);
  const growth = academyGrowthFactor(club.infrastructure.youthAcademy) * (1 + growthBonus);
  if (growth <= 0) return reveals;

  for (const pid of club.youthPlayerIds) {
    const p = youthPlayers[pid];
    if (!p) continue;

    if (!p.development.attributeProgress) p.development.attributeProgress = {};
    if (p.development.ovrProgress == null) p.development.ovrProgress = 0;
    const acc = p.development.attributeProgress;
    // Altersgerechte Obergrenze: ein 16-Jähriger ist noch weit vom Endstand entfernt.
    const maxRating = Math.min(starsToPotential(p.potentialStars), Math.round(starsToPotential(p.potentialStars) * (0.35 + 0.035 * Math.max(0, p.age - 7))));

    const aFactor = ageFactor(p.age);
    const pFactor = potentialFactor(p);
    const weekGain = YOUTH_BASE_GAIN * aFactor * pFactor * growth;

    // --- Akkumulator über eine Auswahl entwicklungsrelevanter Attribute füllen
    const devAttrs = developmentAttrsFor(p.naturalPosition);
    for (const key of devAttrs) {
      const cur = p.attributes[key] as number;
      if (cur >= 99) continue;
      // leichte Streuung je Attribut, deterministisch aus id+key+ability
      const jitter = 0.75 + 0.5 * pseudo(`${p.id}:${key}:${p.development.currentAbility}`);
      const gain = Math.round(weekGain * jitter * 10) / 10;
      if (gain <= 0) continue;
      acc[key] = Math.round(((acc[key] ?? 0) + gain) * 10) / 10;
    }

    // --- sichtbare Aufwertungen (max. +1 je Attribut/Woche) ---
    const upAttrs: string[] = [];
    for (const key of Object.keys(acc) as AttributeKey[]) {
      const progress = acc[key] ?? 0;
      if (progress < 1.0) continue;
      const cur = p.attributes[key] as number;
      const atCap = p.development.currentAbility >= maxRating || cur >= 99;
      if (atCap) { acc[key] = Math.min(progress, 0.95); continue; }
      (p.attributes[key] as number) = cur + 1;
      acc[key] = Math.round((progress - 1.0) * 10) / 10;
      upAttrs.push(key);
      p.development.ovrProgress += OVR_PER_ATTR_POINT;
    }

    // --- OVR-Aufwertung ---
    let ovrUp = false;
    if (p.development.ovrProgress >= 1.0 && p.overall < 99 && p.development.currentAbility < maxRating) {
      p.overall = Math.min(99, p.overall + 1);
      p.development.ovrProgress -= 1.0;
      p.development.currentAbility = Math.min(99, p.development.currentAbility + 1);
      p.positionRatings[p.naturalPosition] = p.overall;
      p.contract.transferValue = Math.round(p.overall * p.overall * 400);
      ovrUp = true;
    }

    // --- Scouting-Spanne an das wahre Potenzial annähern ---
    narrowScoutRange(p, club.infrastructure.youthAcademy, scoutBonus);

    if (upAttrs.length > 0 || ovrUp) {
      reveals.push({ playerId: p.id, name: p.fullName, upAttrs, ovrUp, newOverall: p.overall });
    }
  }

  return reveals;
}

/** Deterministischer Pseudo-Zufall 0..1 aus einem String (ohne Zustand). */
function pseudo(str: string): number {
  return mulberry32(hashSeed(str))();
}

function developmentAttrsFor(pos: Position): AttributeKey[] {
  const common: AttributeKey[] = ['stamina', 'speed', 'strength', 'technique', 'firstTouch', 'passing', 'decisions', 'composure', 'concentration', 'workRate'];
  if (pos === 'TW') return ['reflexes', 'handling', 'positioning', 'oneOnOnes', 'aerialReach', 'communication', 'kicking', 'concentration', 'agility', 'composure'];
  if (['LIB', 'VS', 'AV'].includes(pos)) return [...common, 'tackling', 'marking', 'positioning', 'heading', 'interceptions'];
  if (['DM', 'ZM', 'OM'].includes(pos)) return [...common, 'vision', 'ballControl', 'longPassing', 'dribbling', 'positioning'];
  return [...common, 'shooting', 'dribbling', 'ballControl', 'heading', 'shotPower', 'longShots'];
}

/**
 * Engt die Scouting-Spanne [min,max] pro Woche etwas weiter an das wahre
 * Potenzial an. Bessere Akademien scouten präziser (schnellere Annäherung).
 */
function narrowScoutRange(p: Player, academyLevel: number, scoutBonus = 0): void {
  const truePot = p.potentialStars;
  if (p.scoutedPotentialMin == null) p.scoutedPotentialMin = truePot;
  if (p.scoutedPotentialMax == null) p.scoutedPotentialMax = truePot;
  const step = 0.25; // ein Raster-Schritt je Woche
  // Höhere Stufe → gelegentlich zwei Schritte (schnellere Konvergenz).
  const fast = academyLevel >= 4 && pseudo(`${p.id}:${p.overall}:fast`) < 0.5;
  // Scouting-Bonus (Mitarbeiter + Datenanalyse-Zentrum, Block p11): zusätzliche
  // Chance auf einen weiteren Raster-Schritt → präzisere Talentbewertung.
  const bonusStep = scoutBonus > 0 && pseudo(`${p.id}:${p.overall}:scout`) < Math.min(0.9, scoutBonus * 3) ? step : 0;
  const shrink = (fast ? step * 2 : step) + bonusStep;

  if (p.scoutedPotentialMin < truePot) {
    p.scoutedPotentialMin = clampStars(Math.min(truePot, p.scoutedPotentialMin + shrink));
  }
  if (p.scoutedPotentialMax > truePot) {
    p.scoutedPotentialMax = clampStars(Math.max(truePot, p.scoutedPotentialMax - shrink));
  }
}

// -----------------------------------------------------------------------------
// Altern der Talente (jährlich)
// -----------------------------------------------------------------------------
/** Erhöht das Alter aller Talente eines Vereins um 1 Jahr. */
export function ageYouthPlayers(club: Club, youthPlayers: Record<string, Player>): void {
  for (const pid of club.youthPlayerIds) {
    const p = youthPlayers[pid];
    if (p) p.age += 1;
  }
}

// -----------------------------------------------------------------------------
// Hochziehen in den Profikader
// -----------------------------------------------------------------------------
export interface PromoteResult { ok: boolean; reason?: string }

/**
 * Zieht ein Talent in den Profikader hoch:
 *  - entfernt es aus youthPlayers + club.youthPlayerIds,
 *  - fügt es players + club.playerIds hinzu,
 *  - markiert es als Profi (isYouth=false) und legt das verborgene Potenzial
 *    als sichtbaren Sterne-Wert offen.
 * @param maxSquad maximale Kadergröße (Standard 26)
 */
export function promoteYouth(
  club: Club,
  playerId: string,
  players: Record<string, Player>,
  youthPlayers: Record<string, Player>,
  maxSquad = 26,
): PromoteResult {
  const idx = club.youthPlayerIds.indexOf(playerId);
  if (idx < 0) return { ok: false, reason: 'Talent nicht in der Jugend gefunden' };
  if (club.playerIds.length >= maxSquad) {
    return { ok: false, reason: `Profikader voll (max. ${maxSquad} Spieler)` };
  }
  const p = youthPlayers[playerId];
  if (!p) return { ok: false, reason: 'Talent nicht gefunden' };

  // Aus der Jugend entfernen.
  club.youthPlayerIds.splice(idx, 1);
  delete youthPlayers[playerId];

  // Als Profi übernehmen: Stärke nach Profi-Maßstab, Potenzial bleibt eine Einschätzung.
  p.isYouth = false;
  p.development.basePotential = Math.max(p.overall, starsToPotential(p.potentialStars));
  ensureDevFields(p);
  refreshOverall(p);
  updateScoutEstimate(p, 0.6, true);
  // Freie Rückennummer im Profikader suchen.
  p.shirtNumber = freeShirtNumber(club, players);

  players[playerId] = p;
  club.playerIds.push(playerId);

  return { ok: true };
}

function freeShirtNumber(club: Club, players: Record<string, Player>): number {
  const used = new Set(club.playerIds.map((id) => players[id]?.shirtNumber).filter(Boolean));
  for (let n = 1; n <= 40; n++) if (!used.has(n)) return n;
  return 40;
}

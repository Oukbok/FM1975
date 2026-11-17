// =============================================================================
// FOOTBALL MANAGER 1980 — Jugendsystem (Jugendakademie)
// =============================================================================
// Jeder Verein besitzt eine Jugendakademie, deren Nachwuchs-Investitionen
// (Bausteine, Etat, Ruf – engine/youthAcademy.ts, game/youthInvest.ts) steuern,
// WIE VIELE und WIE GUTE Talente entstehen und WIE SCHNELL sie sich entwickeln.
// Ohne `club.youthInvest` gilt die alte Ausbaustufe (engine/infrastructure.ts).
//
// Besonderheit: das ECHTE Potenzial eines Talents ist verborgen. Die Scouting-
// Einschätzung wird als STERNE-SPANNE (min–max) angezeigt und engt sich mit der
// Zeit (und je nach Akademie-Stufe) immer weiter an das wahre Potenzial an,
// bis es schließlich feststeht.
//
// Talente altern und entwickeln sich wöchentlich (Lernrate × Akademie-Faktor).
// Über "Hochziehen in den Profikader" wandert ein Talent in die A-Mannschaft.
// =============================================================================

import { eraPosition } from '../data/formations';
import { ensurePositionSkill } from './positionSkill';
import { footForSide } from './positions';
import { baseMarketValue, hashSeed, mulberry32 } from './youthShared';
// Wöchentliche Entwicklung der Talente: engine/youthWeekly.ts.
export { developYouthWeekly } from './youthWeekly';
export type { YouthDevReveal } from './youthWeekly';
import { ensureDevFields, refreshOverall } from './development';
import { updateScoutEstimate } from './scouting';
import { pickOrigin, makeName, faceFor } from '../data/origins';
import { makePersonality } from './playerFactory';
import {
  Player, Club, PlayerAttributes, Position, AttributeKey,
  createEmptyStats, clampStars, starsToPotential, potentialToStars,
  YOUTH_ENTRY_AGE, YOUTH_GRADUATE_AGE,
} from '../types';
import { academyQualityBonus } from './infrastructure';
import { academyLevelOf, cpuPromotionPolicy, intakeCountOf } from './youthAcademy';
import { bornWorkRate } from './attributeAging';
import { youthTalentPotential } from './talent';
import { maybeRisingStar } from './clubStars';
import { FIXED_SHIRTS_FROM, numberSquad, shirtSeasonOf } from './shirtNumbers';

// -----------------------------------------------------------------------------
// Namens-Pools (Ära-gerecht, jüngerer Jahrgang)
// -----------------------------------------------------------------------------
const FIRST_NAMES = ['Michael', 'Thomas', 'Andreas', 'Stefan', 'Frank', 'Markus', 'Oliver', 'Dirk', 'Jörg', 'Sven', 'Ralf', 'Holger', 'Carsten', 'Matthias', 'Christian', 'Marco', 'Torsten', 'Kai', 'Guido', 'Jens', 'Uwe', 'Bernd', 'Achim', 'Detlef'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter', 'Vogel', 'Seidel', 'Brandt', 'Scholz'];

// Mögliche Positionen für Talente (gewichtete Grundverteilung).
const YOUTH_POSITIONS: Position[] = [
  'TW', 'LIB', 'IV', 'IV', 'RV', 'LV', 'DM', 'ZM', 'ZM', 'OM', 'RA', 'LA', 'MS', 'MS', 'HS',
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
  else if (['LIB', 'IV', 'RV', 'LV'].includes(pos)) keys = ['tackling', 'marking', 'positioning', 'strength', 'heading', 'interceptions'];
  else if (['DM', 'ZM', 'RM', 'LM', 'OM'].includes(pos)) keys = ['passing', 'vision', 'technique', 'stamina', 'ballControl', 'decisions'];
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
 * Vergibt das WAHRE (verborgene) Potenzial eines Talents auf der OVR-Skala
 * (engine/talent.ts). Bessere Akademien heben die Chance auf hohe Talente
 * leicht an; Ausnahmetalente stammen aus einem seltenen Ausreißer-Schwanz.
 */
function assignYouthPotential(rand: () => number, academyLevel: number): number {
  const lift = (academyLevel - 1) * 0.05; // bessere Akademie → etwas mehr Talent
  return youthTalentPotential(rand, lift);
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
/** Liga-Gleichgewicht: Verschiebung des Jugendpotenzials in Sternen (game/leagueBalance.ts). */
let youthPotentialShift = 0;
export function setYouthPotentialShift(stars: number): void { youthPotentialShift = stars; }
/**
 * Spielstand-Salz für die Talent-Würfel: Ohne es entstünde in jedem neuen Spiel
 * beim selben Verein im selben Jahrgang dasselbe Talent (verkappte Legende).
 * Alte Spielstände ohne Salz würfeln wie bisher.
 */
let youthSalt = '';
export function setYouthSalt(salt: string): void { youthSalt = salt; }
export function getYouthSalt(): string { return youthSalt; }
/** Ausgangszustand (game/resetModuleState.ts). */
export function resetYouthState(): void { youthPotentialShift = 0; youthSalt = ''; }

/** Zusatzoptionen: Breitensport-Auffüller oder Rekrutierungsereignis (game/youthRecruit.ts). */
export interface YouthGenOpts {
  /** 'breite' = Mannschaftsauffüller mit meist geringem Potenzial. */
  pool?: 'talent' | 'breite';
  /** Verschiebung des Potenzials in Sternen. */
  potBias?: number;
  positions?: Position[];
  boosts?: Partial<Record<AttributeKey, [number, number]>>;
  weak?: Partial<Record<AttributeKey, [number, number]>>;
  /** Ausländische Herkunft (je Epoche). */
  foreign?: boolean;
  ambition?: number;
  professionalism?: number;
}

/**
 * Potenzial der Breite: die meisten Jugendspieler werden keine Profis.
 * ~70 % unter 2 Sternen, ~22 % 2–2,75, ~7 % 3–3,5, ~1 % darüber.
 */
function breitePotential(rand: () => number): number {
  const r = rand();
  if (r < 0.70) return clampStars(0.75 + rand() * 1.25);
  if (r < 0.92) return clampStars(2.0 + rand() * 0.75);
  if (r < 0.99) return clampStars(3.0 + rand() * 0.5);
  return clampStars(3.75 + rand() * 0.75);
}

function tunePersonality<T extends { ambition?: number; professionalism?: number }>(pers: T, opts: YouthGenOpts): T {
  if (opts.ambition && pers.ambition != null) pers.ambition = Math.max(1, Math.min(99, pers.ambition + opts.ambition));
  if (opts.professionalism && pers.professionalism != null) pers.professionalism = Math.max(1, Math.min(99, pers.professionalism + opts.professionalism));
  return pers;
}

export function generateYouthPlayer(
  clubId: string,
  uniqueSeed: string,
  currentDate: string,
  academyLevel: number,
  age?: number,
  opts: YouthGenOpts = {},
): Player {
  const rand = mulberry32(hashSeed(`${clubId}|${uniqueSeed}${youthSalt}`));
  const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const currentYear = Number(currentDate.slice(0, 4));
  let origin = pickOrigin(currentYear, rand, !opts.foreign && rand() < 0.9);
  for (let t = 0; opts.foreign && origin.nationality === 'GER' && t < 8; t++) origin = pickOrigin(currentYear, rand, false);
  const { firstName, lastName } = makeName(origin, rand, currentYear - (age ?? 17));
  const pos0 = opts.positions?.length ? pick(opts.positions) : pick(YOUTH_POSITIONS);
  // Libero ausgestorben: niemand bildet mehr Liberos aus (Wunsch Pascal, data/formations.ts).
  const pos: Position = eraPosition(pos0, currentYear);
  const useAge = age != null
    ? Math.max(YOUTH_ENTRY_AGE, Math.min(19, Math.round(age)))
    : ri(16, 19);

  // Grundstärke: stark altersabhängig. Ein 7-jähriges Bambini ist spielerisch
  // noch sehr schwach (~8), ein 19-Jähriger deutlich weiter (~52); dazu kommt der
  // Akademie-Qualitätsbonus und etwas Streuung.
  const qBonus = academyQualityBonus(academyLevel);
  const ageBase = 8 + (useAge - YOUTH_ENTRY_AGE) * 3.7; // Alter 7→8 … 19→52.4
  const base = Math.max(6, Math.min(70, Math.round(ageBase + qBonus * 0.55 + ri(-5, 5) - (opts.pool === 'breite' ? 4 : 0))));
  const attributes = makeYouthAttributes(rand, base, pos);
  for (const [k, r] of Object.entries(opts.boosts ?? {}) as [AttributeKey, [number, number]][]) {
    (attributes as any)[k] = Math.min(99, (attributes[k] as number) + ri(r[0], r[1]));
  }
  for (const [k, r] of Object.entries(opts.weak ?? {}) as [AttributeKey, [number, number]][]) {
    (attributes as any)[k] = Math.max(1, (attributes[k] as number) - ri(r[0], r[1]));
  }
  const overall = computeOverall(attributes, pos);

  // Wahres Potenzial (verborgen) — nie unter dem aktuellen OVR.
  // Fein ausgewürfelt auf der OVR-Skala; Verschiebungen in Sternen ≈ 8 OVR-Punkte je Stern.
  const rawPot = opts.pool === 'breite' ? starsToPotential(breitePotential(rand)) : assignYouthPotential(rand, academyLevel);
  const potentialAbility = Math.round(Math.max(overall + 4, Math.min(99, rawPot + ((opts.potBias ?? 0) + youthPotentialShift) * 8)));
  const truePot = clampStars(potentialToStars(potentialAbility));
  // Einsatzwille angeboren – große Talente haben ihn meist schon früh (Wunsch Pascal).
  attributes.workRate = bornWorkRate(attributes.workRate, Math.max(0, Math.min(1, (potentialAbility - 55) / 40)), ri(-8, 8));

  const [scoutMin, scoutMax] = initialScoutRange(rand, truePot, academyLevel, useAge);

  const value = Math.round(overall * overall * 400);

  const youth: Player = {
    id: `${clubId}_y_${uniqueSeed}`,
    youthJoined: currentDate,
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    shirtNumber: 30 + ri(0, 69),
    nationality: origin.nationality, origin: origin.id, face: faceFor(origin, currentYear - useAge, `${clubId}_y_${uniqueSeed}`),
    dateOfBirth: birthDate(rand, useAge, currentYear), age: useAge,
    height: ri(168, 192), weight: ri(60, 82),
    preferredFoot: footForSide(pos, rand() < 0.7 ? 'right' : (rand() < 0.7 ? 'left' : 'both'), `${clubId}_y_${uniqueSeed}`),
    naturalPosition: pos, secondaryPositions: [],
    positionRatings: { [pos]: overall },
    attributes, overall,
    form: ri(40, 65), frische: 100, morale: 'good', availability: 'available',
    injury: null, suspensionMatches: 0, yellowCardCount: 0,
    clubId,
    contract: {
      weeklyWage: Math.round(overall * 8 + ri(0, 50)),
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
      basePotential: potentialAbility, unfold: 0, ...tunePersonality(makePersonality(rand), opts),
      devPoints: 0, recentMinutes: 0, lastMinutesSeen: 0, scoutBias: Math.round((rand() - 0.5) * 4) / 4,
    },
    potentialStars: truePot,          // WAHRES Potenzial (verborgen in der UI)
    seasonStats: createEmptyStats(), careerStats: createEmptyStats(),
    trainingLoad: 0, transferListed: false,
    isYouth: true,
    scoutedPotentialMin: scoutMin,
    scoutedPotentialMax: scoutMax,
  };
  ensurePositionSkill(youth, currentDate); // Positionsvertrautheit (engine/positionSkill.ts)
  // Förderverträge: Marktwert wie nach `migrateYouthContracts` gedeckelt – sonst sank er erst beim Laden.
  youth.contract.transferValue = Math.min(value, baseMarketValue(youth));
  return youth;
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
  // Nachwuchs-Investitionen (engine/youthAcademy.ts): Breite und Qualität des Jahrgangs.
  const level = academyLevelOf(club);
  const count = intakeCountOf(club);
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
  const level = academyLevelOf(club);
  const perYear = level >= 4 ? 2 : 1;
  const players: Player[] = [];
  const rs = mulberry32(hashSeed(`${club.id}|kommende-stars${youthSalt}`));
  for (let age = YOUTH_ENTRY_AGE; age < YOUTH_GRADUATE_AGE; age++) {
    for (let i = 0; i < perYear; i++) {
      const yp = generateYouthPlayer(club.id, `init_${age}_${i}`, currentDate, level, age);
      // Der Jugend-Stamm zum Spielstart enthält auch kommende Stars (engine/clubStars.ts).
      if (age >= 12 && maybeRisingStar(yp, 70, rs, 0.1)) yp.scoutedPotentialMax = Math.max(yp.scoutedPotentialMax ?? 0, yp.potentialStars);
      players.push(yp);
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
 *  - CPU-Vereine ziehen je nach Akademie und Trainerphilosophie 1–3 Talente
 *    ab 3,0–3,75 Sternen hoch (engine/youthAcademy.ts cpuPromotionPolicy);
 *    früher war es höchstens eines ab 3,5 – dadurch kamen kaum Eigengewächse an.
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

  let cpuPromoted = 0;
  const policy = cpuPromotionPolicy(club);

  for (const p of graduates) {
    let promote = false;
    if (isManaged) {
      // Bester Nachwuchs wird hochgezogen, solange Kaderplatz frei ist.
      promote = p.potentialStars >= 3.0 && club.playerIds.length < maxSquad;
    } else {
      // CPU: wenige Talente pro Jahr, nur echte Perspektivspieler (Hürde je Akademie/Philosophie).
      promote = cpuPromoted < policy.max && p.potentialStars >= policy.minStars && club.playerIds.length < maxSquad;
    }

    // Ausnahmetalente (schon profireif oder höchstes Potenzial) schickt niemand fort –
    // notfalls wird der Kader kurz um zwei Plätze größer.
    const exceptional = p.overall >= 68 || p.potentialStars >= 4.5;
    if (exceptional) promote = true;
    if (promote) {
      const res = promoteYouth(club, p.id, players, youthPlayers, exceptional ? maxSquad + 2 : maxSquad);
      if (res.ok) {
        result.promoted.push(p);
        cpuPromoted++;
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
// Altern der Talente (jährlich)
// -----------------------------------------------------------------------------
/** Erhöht das Alter aller Talente eines Vereins um 1 Jahr. */
export function ageYouthPlayers(club: Club, youthPlayers: Record<string, Player>, year?: number): void {
  for (const pid of club.youthPlayerIds) {
    const p = youthPlayers[pid];
    if (!p) continue;
    p.age += 1;
    // Jugendverträge (Förderverträge) laufen mit: abgelaufene um 2 Jahre verlängern und den
    // Marktwert neu einordnen (sonst stand bei KI-Talenten z. B. „bis 30.6.2007“ im Jahr 2016).
    if (year && p.contract.expiryDate <= `${year}-06-30`) p.contract.expiryDate = `${year + 2}-06-30`;
    if (year) p.contract.transferValue = Math.min(p.contract.transferValue, baseMarketValue(p));
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
  /** Datum des Hochziehens (für „Eigengewächs“, game/clubHonours.ts). */
  date?: string,
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
  if (date) {
    p.youthPromoted = date;
    // Jugendvertrag schon abgelaufen (Hochziehen nach dem 1. Juli): Profivertrag bis Ende der übernächsten Saison.
    if (p.contract.expiryDate <= date) {
      const endYear = Number(date.slice(0, 4)) + (Number(date.slice(5, 7)) >= 7 ? 1 : 0);
      p.contract.expiryDate = `${endYear + 2}-06-30`;
    }
  }
  // Das fein ausgewürfelte Höchstpotenzial bleibt erhalten (keine Sterne-Rundung).
  p.development.basePotential = Math.max(p.overall, p.development.potentialAbility ?? starsToPotential(p.potentialStars));
  ensureDevFields(p);
  refreshOverall(p);
  updateScoutEstimate(p, 0.6, true);
  // Freie Rückennummer im Profikader suchen.
  p.shirtNumber = freeShirtNumber(club, players, p, date);

  players[playerId] = p;
  club.playerIds.push(playerId);

  return { ok: true };
}

/** Freie Rückennummer für ein hochgezogenes Talent (ab 1993/94 eher 30–40, vorher fortlaufend ab 12; engine/shirtNumbers.ts). */
function freeShirtNumber(club: Club, players: Record<string, Player>, p: Player, date?: string): number {
  const list = club.playerIds.map((id) => players[id]).filter(Boolean)
    .map((x) => ({ id: x.id, pos: x.naturalPosition, ov: x.overall, cur: x.shirtNumber }));
  list.push({ id: p.id, pos: p.naturalPosition, ov: p.overall, cur: 0, youth: true } as typeof list[number]);
  return numberSquad(list, date ? shirtSeasonOf(date) : FIXED_SHIRTS_FROM, false).get(p.id) ?? 40;
}

/**
 * Nachrüstung beim Laden: Jugend-Marktwerte auf die Profikurve begrenzen und abgelaufene
 * Jugendverträge verlängern (alte Spielstände hatten Werte bis overall² × 400 und Verträge,
 * die nie verlängert wurden). Idempotent.
 */
export function migrateYouthContracts(g: { youthPlayers?: Record<string, Player>; calendar: { currentDate: string } }): void {
  const year = Number(g.calendar.currentDate.slice(0, 4)) - (Number(g.calendar.currentDate.slice(5, 7)) < 7 ? 1 : 0);
  for (const p of Object.values(g.youthPlayers ?? {})) {
    p.contract.transferValue = Math.min(p.contract.transferValue, baseMarketValue(p));
    if (p.contract.expiryDate < g.calendar.currentDate) p.contract.expiryDate = `${year + 2}-06-30`;
  }
}

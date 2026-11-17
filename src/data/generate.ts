import { lowerTierLevel } from './lowerTiers';
import { liberoTrainOut, setFormationYear } from './formations';
import { datasetCrest, datasetKits } from './dataset/apply';
// =============================================================================
// FOOTBALL MANAGER 1980 — Daten-Generator
// Erzeugt die 18 Erstliga-Vereine der Saison 1975/76 samt Kader.
// Alle Vereine tragen rechtssichere Städtenamen statt geschützter Klubnamen.
// =============================================================================

import { createPlayer } from '../engine/playerFactory';
import { maybeRisingStar, seedClubStars, seedStarRng, starRng } from '../engine/clubStars';
import { ORIGINS, Origin } from './origins';
import {
  Player, Club, PlayerAttributes, Position, AttributeKey,
  createEmptyStats, TrainingSchedule, Tactics, ClubFinances, Stadium,
  clampStars, starsToPotential,
} from '../types';
import { buildAutoTactics } from '../engine/lineupAI';
import { makeInfrastructure, applyFacilityEffects } from '../engine/infrastructure';
import { generateShirtOffers, generateBandenOffers } from '../engine/finances';
import { academyStartingCohort, getYouthSalt } from '../engine/youth';
import { economyScale } from '../engine/economy';
import { COUNTRY_BY_KEY } from './world/countries';
import type { ClubCommerce, SponsorOffer } from '../types';
import type { EuroClub } from './europe';

// Vereins-Stammdaten 1. Liga + 2. Liga Nord/Süd: data/clubSeeds.ts.
export { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from './clubSeeds';
export type { ClubSeed, SecondLigaSeed } from './clubSeeds';
import { CLUB_SEEDS, type ClubSeed } from './clubSeeds';
import { numberClub, shirtSeasonOf } from '../engine/shirtNumbers';

// -----------------------------------------------------------------------------
// Seeded RNG (deterministisch, damit jeder Neustart dieselbe Welt erzeugt)
// -----------------------------------------------------------------------------
let _seed = 1980;
function rng(): number {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 0xffffffff;
}
function ri(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// -----------------------------------------------------------------------------
// Namens-Pools
// -----------------------------------------------------------------------------
const FIRST_NAMES = ['Klaus', 'Hans', 'Jürgen', 'Uwe', 'Manfred', 'Wolfgang', 'Rainer', 'Dieter', 'Rudi', 'Bernd', 'Karl', 'Günter', 'Horst', 'Werner', 'Norbert', 'Herbert', 'Reinhard', 'Michael', 'Thomas', 'Andreas', 'Stefan', 'Franz', 'Paul', 'Lothar', 'Toni', 'Sepp', 'Pierre', 'Erwin', 'Bernard', 'Felix'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter'];

// Positions-Struktur eines Kaders (18 Spieler)
const SQUAD_TEMPLATE: Position[] = [
  'TW', 'TW',
  'LIB', 'IV', 'IV', 'RV', 'LV',
  'DM', 'ZM', 'ZM', 'OM', 'RA', 'LA',
  'MS', 'MS', 'HS',
  'ZM', 'LV',
];

// -----------------------------------------------------------------------------
// Attribut-Erzeugung
// -----------------------------------------------------------------------------
function makeAttributes(base: number, pos: Position): PlayerAttributes {
  const v = (spread = 12) => Math.max(1, Math.min(99, base + ri(-spread, spread)));
  const g = pos === 'TW';
  return {
    fitness: 90 + ri(0, 10), stamina: v(), speed: v(), acceleration: v(),
    strength: v(), jumping: v(), agility: v(), balance: v(),
    technique: v(), firstTouch: v(), shooting: g ? ri(10, 30) : v(), shotPower: v(),
    longShots: v(), passing: v(), longPassing: v(), crossing: v(),
    dribbling: g ? ri(10, 30) : v(), ballControl: v(), heading: v(),
    tackling: v(), marking: v(), positioning: v(), interceptions: v(),
    experience: v(), vision: v(), composure: v(), concentration: v(),
    decisions: v(), leadership: v(), workRate: v(), aggression: v(),
    teamwork: v(), flair: v(),
    reflexes: g ? v() : ri(5, 20), handling: g ? v() : ri(5, 20),
    kicking: g ? v() : ri(20, 40), aerialReach: g ? v() : ri(5, 20),
    oneOnOnes: g ? v() : ri(5, 20), communication: g ? v() : ri(20, 45),
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

const CURRENT_DATE = '1975-07-01';
function birthDate(age: number): string {
  const year = 1975 - age;
  return `${year}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`;
}

/**
 * Vergibt realistische Potenzial-Sterne (1.0–5.0) je nach Alter und aktueller
 * Stärke. Jüngere/stärkere Spieler tendieren zu mehr Sternen, Veteranen zu
 * wenigen (kaum Entwicklung mehr). Rückgabe im 0.25-Raster.
 */
function assignPotentialStars(age: number, overall: number): number {
  let stars: number;

  if (age <= 19) {
    // Jugendspieler: 10% Ausnahmetalent (4.5–5.0), sonst 2.5–4.5
    if (rng() < 0.10) stars = 4.5 + rng() * 0.5;
    else stars = 2.5 + rng() * 2.0;
  } else if (age <= 23) {
    // Junge Spieler: gute Spieler 3.5–4.5, sonst 3.0–4.0
    if (overall >= 72) stars = 3.5 + rng() * 1.0;
    else stars = 3.0 + rng() * 1.0;
  } else if (age <= 29) {
    // Etablierte Spieler: Standard 3.0–4.0
    stars = 3.0 + rng() * 1.0;
  } else {
    // Erfahrene Spieler (30+): kaum Entwicklung, 2.5–3.5
    stars = 2.5 + rng() * 1.0;
  }

  stars = clampStars(stars);

  // Konsistenz: Bei Spielern unter 30 darf das Potenzial (max. Rating) nicht
  // unter dem aktuellen OVR liegen — sie sollen noch Reserve nach oben haben.
  if (age < 30) {
    const headroom = age <= 23 ? 3 : 1;
    while (stars < 5 && starsToPotential(stars) < overall + headroom) {
      stars = clampStars(stars + 0.25);
    }
  }
  return stars;
}

const COUNTRY_ORIGIN: Record<string, string> = {
  England: 'eng', Italien: 'ita', Spanien: 'esp', Frankreich: 'fra', Schottland: 'sco', Niederlande: 'ned',
  Sowjetunion: 'rus', Portugal: 'por', Jugoslawien: 'yug', Griechenland: 'gre', Belgien: 'bel', Ungarn: 'hun',
  Tschechoslowakei: 'cze', Polen: 'pol', Oesterreich: 'aut', Tuerkei: 'tur', Schweiz: 'sui', Schweden: 'swe', Rumaenien: 'hun', Daenemark: 'den', Ukraine: 'rus', Russland: 'rus', Kroatien: 'cro', Serbien: 'srb', Slowakei: 'cze', Tschechien: 'cze',
};

/**
 * Höchste Erzeugungsstärke deutscher Kader (Start, Aufsteiger, Pokal-Amateure):
 * Weltklasse (≥85) entsteht durch Entwicklung, nicht am Reißbrett.
 */
const GEN_CAP = 84;

// Erzeugungsjahr (1975 beim Spielstart; später für aufsteigende/neue Vereine das aktuelle Jahr).
let genYear = 1975;
let genDate = CURRENT_DATE;
function setGenDate(date: string): void { genDate = date; genYear = Number(date.slice(0, 4)); }
/** Ausgangszustand des Generators (game/resetModuleState.ts): Startwert und Erzeugungsdatum. */
export function resetGenerateState(): void { _seed = 1980; setGenDate(CURRENT_DATE); }

/** @param cap Obergrenze der Erzeugungsstärke (deutsche Vereine 84, Europapokal-Gegner 88). */
/**
 * Stärke nach Alter: Junge Spieler sind meist noch nicht fertig (18 J. ≈ −9),
 * Veteranen bauen ab. Nur selten ist ein Junger schon auf dem Niveau der Etablierten.
 */
function ageStrengthAdj(age: number): number {
  if (age <= 23 && rng() < 0.04) return 0; // frühreif
  return age <= 18 ? -9 : age <= 19 ? -7 : age <= 20 ? -5 : age <= 21 ? -3.5 : age <= 22 ? -2 : age <= 23 ? -1
    : age <= 30 ? 1.5 : age <= 31 ? 0.5 : age <= 32 ? -1 : age <= 33 ? -2 : -3;
}

function makePlayer(clubId: string, index: number, pos: Position, strength: number, shirt: number, origin?: Origin, cap = GEN_CAP): Player {
  // Altersverteilung um 25 (18–34), wenige ganz Junge/ganz Alte.
  const age = Math.max(18, Math.min(34, Math.round(25 + (rng() + rng() + rng() - 1.5) * 9)));
  const p = createPlayer({
    id: `${clubId}_p${index}`, clubId, pos, age,
    strength: Math.max(35, Math.min(age <= 21 ? cap - 4 : cap, Math.round(strength + ageStrengthAdj(age)) + ri(-8, 8))),
    year: genYear, date: genDate, rng, shirt, origin,
  });
  p.form = ri(45, 75);
  p.transferListed = rng() < 0.08;
  p.contract.expiryDate = `${genYear + 1 + ri(0, 5)}-06-30`;
  maybeRisingStar(p, strength, starRng); // kommende Stars (engine/clubStars.ts)
  return p;
}

function defaultTrainingSchedule(): TrainingSchedule {
  return {
    sessions: [
      { id: 's0', dayOfWeek: 0, focus: 'fitness', intensity: 'medium', loadValue: 40 },
      { id: 's1', dayOfWeek: 1, focus: 'technique', intensity: 'medium', loadValue: 35 },
      { id: 's2', dayOfWeek: 2, focus: 'tactics', intensity: 'medium', loadValue: 30 },
      { id: 's3', dayOfWeek: 3, focus: 'passing', intensity: 'medium', loadValue: 35 },
      { id: 's4', dayOfWeek: 4, focus: 'shooting', intensity: 'low', loadValue: 25 },
      { id: 's5', dayOfWeek: 5, focus: 'recovery', intensity: 'low', loadValue: 15 },
      { id: 's6', dayOfWeek: 6, focus: 'rest', intensity: 'low', loadValue: 0 },
    ],
    weeklyIntensity: 45, overloadWarning: false, facilitiesQuality: ri(50, 85),
  };
}

function makeTactics(clubId: string, playerIds: string[], players: Record<string, Player>): Tactics {
  // Nutzt die Aufstellungs-KI: passende Formation + positionsgenaue Besetzung
  // nach Eignung + sinnvolle Taktik-Werte + Standard-Schützen (deterministisch).
  const stubClub = { id: clubId, playerIds } as Club;
  return buildAutoTactics(stubClub, players);
}

/**
 * Start-Finanzen (1975-DM). Guthaben ≈ ein Viertel des Jahresumsatzes (Ruf 86 ≈ 1,6 Mio.,
 * Ruf 65 ≈ 0,9 Mio. DM); Gehaltsrahmen ≈ 55 % eines zum Ruf passenden Umsatzes.
 */
function makeFinances(rep: number): ClubFinances {
  const scale = rep * rep * 200;
  return {
    balance: scale + ri(0, 150000), transferBudget: Math.round(scale * 0.6),
    wageBudget: Math.round(rep * rep * 8), currentWageBill: Math.round(rep * rep * 7),
    income: { ticketSales: 0, tvMoney: 0, sponsorship: 0, merchandise: 0, transferIncome: 0, prizeMoney: 0, catering: 0, advertising: 0, commercial: 0, membership: 0, matchday: 0, other: 0 },
    expenses: { wages: 0, transferExpense: 0, stadiumMaintenance: 0, trainingFacilities: 0, facilities: 0, staffWages: 0, other: 0 },
    transactions: [],
  };
}

function makeStadium(seed: ClubSeed): Stadium {
  return {
    name: seed.stadium, capacity: seed.capacity,
    // 1975/76: Ø 23.180 Zuschauer bei großen Stadien (Ø ≈ 50.000 Plätze) → Auslastung ≈ 0,35–0,65.
    averageAttendanceRate: Math.round((0.17 + seed.reputation * 0.0036 + (rng() - 0.5) * 0.1) * 100) / 100,
    ticketPrice: Math.max(5, Math.min(11, Math.round(3 + seed.reputation * 0.07 + (rng() - 0.5) * 2))),
    condition: ri(55, 90),
  };
}

/**
 * Erzeugt das Kommerz-Objekt eines Vereins. KI-Vereine erhalten sofort einen
 * passenden Trikot- und Bandenvertrag (bestes Saison-Angebot), damit ihre
 * Bilanz von Beginn an stimmt. Der vom Spieler gefuehrte Verein startet ohne
 * Vertraege, bekommt aber Angebote zum Unterschreiben.
 */
function makeCommerce(club: Club, isManaged: boolean): ClubCommerce {
  const cateringMode: ClubCommerce['cateringMode'] = 'verpachtung';
  const shirtOffers = generateShirtOffers(club, `init-shirt-${club.id}`);
  const bandenOffers = generateBandenOffers(club, `init-banden-${club.id}`);
  if (isManaged) {
    return { cateringMode, shirtOffers, bandenOffers };
  }
  const bestShirt = shirtOffers.slice().sort((a: SponsorOffer, b: SponsorOffer) => b.annualValue - a.annualValue)[0];
  const bestBanden = bandenOffers.slice().sort((a: SponsorOffer, b: SponsorOffer) => b.annualValue - a.annualValue)[0];
  return {
    cateringMode,
    shirtSponsor: bestShirt
      ? { name: bestShirt.name, annualValue: bestShirt.annualValue, yearsTotal: bestShirt.years, yearsLeft: bestShirt.years }
      : undefined,
    banden: bestBanden
      ? { name: bestBanden.name, annualValue: bestBanden.annualValue, yearsTotal: bestBanden.years, yearsLeft: bestBanden.years }
      : undefined,
  };
}

// -----------------------------------------------------------------------------
// Haupt-Generator
// -----------------------------------------------------------------------------
export interface GeneratedWorld {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  youthPlayers: Record<string, Player>;
}

// Baut aus einem Seed einen vollständigen Verein inkl. Kader + Jugend.
// Wird sowohl für die Erstliga-Grundgeneration als auch für Aufsteiger aus der
// 2. Liga genutzt (dann kommt der Seed aus einem SimClub, siehe buildProClub).
function buildClubFromSeed(
  seed: ClubSeed,
  managedClubId: string,
  currentDate: string,
  players: Record<string, Player>,
  youthPlayers: Record<string, Player>,
): Club {
  const playerIds: string[] = [];
  const strengthBase = 35 + Math.round(seed.reputation * 0.5);
  let shirt = 1;
  const noLib = liberoTrainOut(Number(currentDate.slice(0, 4)));
  setFormationYear(Number(currentDate.slice(0, 4)));
  SQUAD_TEMPLATE.forEach((pos0, idx) => {
    const pos = pos0 === 'LIB' && noLib ? 'IV' : pos0; // ab 1996 keine neuen Liberos (data/formations.ts)
    const p = makePlayer(seed.id, idx, pos, strengthBase, shirt++);
    players[p.id] = p;
    playerIds.push(p.id);
  });

  // Verteilungs-Deckel: max. 2 Spieler mit 5.0 Sternen pro Verein.
  // Überzählige Ausnahmetalente werden auf 4.75 Sterne herabgestuft.
  const fiveStar = playerIds
    .map((id) => players[id])
    .filter((p) => p.potentialStars >= 5)
    .sort((a, b) => b.overall - a.overall);
  fiveStar.slice(2).forEach((p) => {
    p.potentialStars = 4.75;
    p.development.potentialAbility = Math.max(p.overall, starsToPotential(4.75));
  });

  // Starke Kader bringen ihre Leistungsträger mit (engine/clubStars.ts).
  seedClubStars(playerIds, players, starRng);

  const infrastructure = makeInfrastructure(seed.reputation);
  const youthPlayerIds: string[] = [];

  const club: Club = {
    id: seed.id, name: seed.name, shortName: seed.shortName, city: seed.city,
    founded: seed.founded, colors: { primary: seed.primary, secondary: seed.secondary },
    reputation: seed.reputation, playerIds,
    stadium: makeStadium(seed), finances: makeFinances(seed.reputation),
    tactics: makeTactics(seed.id, playerIds, players),
    trainingSchedule: defaultTrainingSchedule(),
    isPlayerControlled: seed.id === managedClubId,
    aiManagerSkill: ri(45, 85),
    boardExpectation: seed.reputation > 82 ? 'Meisterschaft' : seed.reputation > 72 ? 'Europa-Pokal-Platz' : seed.reputation > 65 ? 'Gesicherter Mittelfeldplatz' : 'Klassenerhalt',
    boardConfidence: ri(55, 80),
    youthPlayerIds,
    infrastructure,
  };

  // Wappen/Trikots aus dem aktiven Datensatz (data/dataset).
  const dsCrest = datasetCrest(seed.id);
  if (dsCrest) club.customCrest = dsCrest;
  const dsKits = datasetKits(seed.id);
  if (dsKits?.home && dsKits?.away) club.kits = { home: dsKits.home, away: dsKits.away };

  // Trainingsqualität an die Trainingszentrum-Stufe koppeln.
  applyFacilityEffects(club);
  club.commerce = makeCommerce(club, club.isPlayerControlled);

  // Anfangs-Jugendstamm: kompletter Altersaufbau G–A (7–19 Jahre); die
  // Akademie-Stufe steuert Anzahl je Jahrgang und Qualität der Talente.
  for (const yp of academyStartingCohort(club, currentDate)) {
    youthPlayers[yp.id] = yp;
    youthPlayerIds.push(yp.id);
  }

  return club;
}

/**
 * Spielerliga zum Start. Ohne `opts` wie immer: Vereine von 1975 (CLUB_SEEDS) am 1.7.1975.
 * Startjahr/Land (game/worldCompose.ts): eigene Seeds und Datum; Startguthaben auf das
 * Wirtschaftsniveau des Jahres (nominal), Herkunft der Spieler über `origin` (Heimatland).
 */
export function generateWorld(managedClubId: string, opts?: { seeds?: ClubSeed[]; date?: string }): GeneratedWorld {
  _seed = 1980; // reset für Determinismus
  seedStarRng(getYouthSalt());
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};
  const youthPlayers: Record<string, Player> = {};
  const date = opts?.date ?? CURRENT_DATE;
  setGenDate(date);
  try {
    for (const seed of opts?.seeds ?? CLUB_SEEDS) {
      clubs[seed.id] = buildClubFromSeed(seed, managedClubId, date, players, youthPlayers);
    }
  } finally {
    setGenDate(CURRENT_DATE);
  }
  const year = Number(date.slice(0, 4));
  if (year > 1975) for (const c of Object.values(clubs)) c.finances.balance = Math.round(c.finances.balance * economyScale(year));
  return { clubs, players, youthPlayers };
}

// Wandelt einen 2.-Liga-Seed / SimClub-artigen Datensatz in einen echten
// ClubSeed um und baut daraus einen vollständigen Profiverein (Aufstieg in die
// Spielerliga). Stadion/Kapazität/Ruf werden aus der Stärke abgeleitet.
export function buildProClub(
  src: { id: string; name: string; shortName: string; city: string; strength: number; colors: { primary: string; secondary: string } },
  managedClubId: string,
  currentDate: string,
  players: Record<string, Player>,
  youthPlayers: Record<string, Player>,
  /** Ebene der Spielerliga: ab 3 (3. Liga/Regionalliga) kleinere Kader-, Stadion- und Ruf-Niveaus. */
  tier = 2,
): Club {
  // Vereine aus den simulierten Ligen: Ruf, Stadion und Zuschauerzuspruch richten
  // sich nach ihrer Stärke (ein Zweitligist hat kleinere Ränge und weniger Publikum).
  const low = tier >= 3;
  const lt = lowerTierLevel(src.strength, tier);
  const reputation = low ? lt.squadRep : Math.max(55, Math.min(80, Math.round(src.strength)));
  const capacity = low ? lt.capacity : 12000 + Math.max(0, Math.round((src.strength - 50) * 1100));
  const seed: ClubSeed = {
    id: src.id, name: src.name, shortName: src.shortName, city: src.city,
    founded: 1900 + ri(0, 20), primary: src.colors.primary, secondary: src.colors.secondary,
    reputation, stadium: `Stadion ${src.city}`, capacity,
  };
  setGenDate(currentDate);
  try {
    const club = buildClubFromSeed(seed, managedClubId, currentDate, players, youthPlayers);
    club.stadium.averageAttendanceRate = Math.max(0.3, Math.min(0.85, 0.3 + (src.strength - 58) * 0.025 + rng() * 0.08));
    club.stadium.ticketPrice = Math.max(4, Math.min(9, Math.round(src.strength / 9)));
    club.reputation = low ? lt.reputation : Math.max(40, Math.min(80, Math.round(src.strength - 6)));
    // Startguthaben ist nominal: auf das Wirtschaftsniveau des Jahres hochrechnen. Sonst
    // begann ein später aufsteigender oder neu vollsimulierter Verein mit 1975-Beträgen
    // (z. B. 3,6 Mio. DM bei 200 Mio. Jahresumsatz) und rutschte sofort ins Minus.
    club.finances.balance = Math.round(club.finances.balance * economyScale(Number(currentDate.slice(0, 4))));
    // Gehaltsniveau unterhalb der 1. Liga deutlich niedriger.
    const wf = Math.max(0.3, Math.min(1, (src.strength - 50) / 25));
    for (const id of club.playerIds) { const p = players[id]; if (p) p.contract.weeklyWage = Math.round(p.contract.weeklyWage * wf); }
    return club;
  } finally {
    setGenDate(CURRENT_DATE);
  }
}

export function getClubSeeds(): ClubSeed[] {
  return CLUB_SEEDS;
}

// -----------------------------------------------------------------------------
// Verband-POKAL — Amateur- / Unterklassevereine
// -----------------------------------------------------------------------------
// Für den Pokal werden zusätzlich kleine Vereine erzeugt, damit ein sauberes
// 32er-Feld entsteht (18 Bundesligisten + 14 Amateure). Sie sind schwächer,
// haben kleine Stadien und einen schlanken Kader (13 Spieler, inkl. TW).

const AMATEUR_PREFIXES = ['SpVgg', 'TuS', 'VfR', 'SV', 'FC', 'SC', '1. FC', 'VfB', 'TSV', 'Rot-Weiß', 'SVg', 'FV'];
const AMATEUR_TOWNS = [
  'Lüneburg', 'Ahlen', 'Vestenbergsgreuth', 'Wattenscheid', 'Oberhausen',
  'Wuppertal', 'Fürth', 'Neunkirchen', 'Osnabrück', 'Bocholt',
  'Emden', 'Hildesheim', 'Baunatal', 'Worms', 'Salmrohr',
  'Pirmasens', 'Kassel', 'Trier', 'Solingen', 'Herford',
];

/** Kader-Struktur eines Amateurvereins (13 Spieler, inkl. 2 TW). */
const AMATEUR_SQUAD_TEMPLATE: Position[] = [
  'TW', 'TW',
  'LIB', 'IV', 'RV', 'LV',
  'DM', 'ZM', 'ZM', 'OM', 'RA',
  'MS', 'HS',
];

export interface CupAmateurs {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
}

/**
 * Erzeugt `count` Amateur-/Unterklassevereine für den Landespokal.
 * Deterministisch (fester Seed), damit jeder Spielstart dasselbe Feld erhält.
 * Die Vereine bekommen KEINEN Jugendstamm (kein Akademie-Kohortenaufbau).
 */
export function generateCupAmateurs(count: number, opts?: { towns?: string[]; date?: string; foreignStyle?: boolean }): CupAmateurs {
  _seed = 4711; // fester Seed für reproduzierbares Pokal-Feld
  const date = opts?.date ?? CURRENT_DATE;
  setGenDate(date);
  try { return buildAmateurs(count, opts?.towns?.length ? opts.towns : AMATEUR_TOWNS, !!opts?.foreignStyle); } finally { setGenDate(CURRENT_DATE); }
}

function buildAmateurs(count: number, towns: string[], foreignStyle: boolean): CupAmateurs {
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};

  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const id = `am${i + 1}`;
    const reputation = ri(30, 55);
    const strengthBase = 32 + Math.round(reputation * 0.35);

    // Eindeutigen Vereinsnamen bauen
    let prefix = pick(AMATEUR_PREFIXES);
    let town = pick(towns);
    const label = () => (foreignStyle ? `${town} Amateure` : `${prefix} ${town}`);
    let name = label();
    let guard = 0;
    while (usedNames.has(name) && guard++ < 40) {
      prefix = pick(AMATEUR_PREFIXES);
      town = pick(towns);
      name = label();
    }
    usedNames.add(name);
    const shortName = town.slice(0, 3).toUpperCase();

    const playerIds: string[] = [];
    let shirt = 1;
    AMATEUR_SQUAD_TEMPLATE.forEach((pos, idx) => {
      const p = makePlayer(id, idx, pos, strengthBase, shirt++);
      players[p.id] = p;
      playerIds.push(p.id);
    });

    const capacity = ri(3000, 13000);
    const stadium: Stadium = {
      name: foreignStyle ? `Sportplatz ${town}` : `Stadion am ${town}er Weg`,
      capacity,
      averageAttendanceRate: 0.35 + rng() * 0.35,
      ticketPrice: ri(3, 6),
      condition: ri(35, 70),
    };

    const infrastructure = makeInfrastructure(reputation);

    const club: Club = {
      id,
      name,
      shortName,
      city: town,
      founded: ri(1900, 1930),
      colors: { primary: pick(['#1B5E20', '#0D47A1', '#B71C1C', '#4A148C', '#37474F']), secondary: '#FFFFFF' },
      reputation,
      playerIds,
      stadium,
      finances: makeFinances(reputation),
      tactics: buildAutoTactics({ id, playerIds } as Club, players),
      trainingSchedule: defaultTrainingSchedule(),
      isPlayerControlled: false,
      aiManagerSkill: ri(25, 55),
      boardExpectation: 'Pokal-Überraschung',
      boardConfidence: ri(50, 75),
      youthPlayerIds: [],
      infrastructure,
    };

    applyFacilityEffects(club);
    club.commerce = makeCommerce(club, false);
    clubs[id] = club;
  }

  return { clubs, players };
}

// -----------------------------------------------------------------------------
// EUROPAPOKAL — Lazy-Kadergenerierung fuer auslaendische Gegner des Spielers
// -----------------------------------------------------------------------------
/**
 * Erzeugt EINMALIG einen vollen `Club` fuer einen auslaendischen Europapokal-
 * Gegner (EuroClub), passend zu dessen `strength`. Wird nur aufgerufen, wenn der
 * Spielerverein tatsaechlich gegen diesen Verein antritt -> der Save bleibt klein.
 * Analog `buildClubFromSeed`, aber OHNE Jugendstamm (kein Akademie-Kohortenaufbau).
 * Die neuen Spieler werden in `players` geschrieben; die Club-ID = euro.id.
 */
export function buildEuroClubFull(
  euro: EuroClub,
  seasonStart: string,
  players: Record<string, Player>,
): Club {
  // Deterministischer Seed aus der EuroClub-ID, damit derselbe Gegner immer
  // denselben Kader erhaelt (reproduzierbar ueber Spielstaende hinweg).
  let h = 2166136261 >>> 0;
  for (let i = 0; i < euro.id.length; i++) { h ^= euro.id.charCodeAt(i); h = Math.imul(h, 16777619); }
  _seed = h >>> 0;

  setGenDate(seasonStart);
  const reputation = Math.max(55, Math.min(85, Math.round(euro.strength)));
  const strengthBase = Math.max(40, Math.min(90, Math.round(euro.strength)));

  const playerIds: string[] = [];
  let shirt = 1;
  SQUAD_TEMPLATE.forEach((pos, idx) => {
    const p = makePlayer(euro.id, idx, pos, strengthBase, shirt++, ORIGINS[COUNTRY_ORIGIN[euro.country] ?? COUNTRY_BY_KEY[euro.country]?.origin ?? 'eng'], 88);
    players[p.id] = p;
    playerIds.push(p.id);
  });

  const capacity = 25000 + Math.round(euro.strength * 500);
  const stadium: Stadium = {
    name: `Stadion ${euro.city}`,
    capacity,
    averageAttendanceRate: 0.6 + rng() * 0.3,
    ticketPrice: ri(6, 11),
    condition: ri(55, 90),
  };

  const infrastructure = makeInfrastructure(reputation);

  const club: Club = {
    id: euro.id,
    name: euro.name,
    shortName: euro.shortName,
    city: euro.city,
    founded: 1900 + ri(0, 20),
    colors: { primary: euro.colors.primary, secondary: euro.colors.secondary },
    reputation,
    playerIds,
    stadium,
    finances: makeFinances(reputation),
    tactics: buildAutoTactics({ id: euro.id, playerIds } as Club, players),
    trainingSchedule: defaultTrainingSchedule(),
    isPlayerControlled: false,
    aiManagerSkill: ri(45, 85),
    boardExpectation: 'Europapokal-Erfolg',
    boardConfidence: ri(55, 80),
    youthPlayerIds: [],
    infrastructure,
  };

  applyFacilityEffects(club);
  club.commerce = makeCommerce(club, false);
  numberClub(club, players, shirtSeasonOf(seasonStart || CURRENT_DATE), true); // Rückennummern nach Position (engine/shirtNumbers.ts)
  setGenDate(CURRENT_DATE);
  return club;
}

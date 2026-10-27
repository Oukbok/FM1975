// =============================================================================
// FOOTBALL MANAGER 1980 — Daten-Generator
// Erzeugt die 18 Erstliga-Vereine der Saison 1975/76 samt Kader.
// Alle Vereine tragen rechtssichere Städtenamen statt geschützter Klubnamen.
// =============================================================================

import { createPlayer } from '../engine/playerFactory';
import { ORIGINS, Origin } from './origins';
import {
  Player, Club, PlayerAttributes, Position, AttributeKey,
  createEmptyStats, TrainingSchedule, Tactics, ClubFinances, Stadium,
  clampStars, starsToPotential,
} from '../types';
import { buildAutoTactics } from '../engine/lineupAI';
import { makeInfrastructure, applyFacilityEffects } from '../engine/infrastructure';
import { generateShirtOffers, generateBandenOffers } from '../engine/finances';
import { academyStartingCohort } from '../engine/youth';
import type { ClubCommerce, SponsorOffer } from '../types';
import type { EuroClub } from './europe';

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
// Vereins-Stammdaten (1. Liga 1980/81)
// -----------------------------------------------------------------------------
interface ClubSeed {
  id: string; name: string; shortName: string; city: string;
  founded: number; primary: string; secondary: string;
  reputation: number; stadium: string; capacity: number;
}

// -----------------------------------------------------------------------------
// RECHTSSICHERE VEREINSNAMEN = STÄDTENAMEN
// -----------------------------------------------------------------------------
// Um geschützte Vereinsnamen und Logos zu vermeiden, tragen alle Vereine den
// Namen ihrer Stadt. Die 18 Erstliga-Vereine bilden den realen Teilnehmerkreis
// der Saison 1975/76 (belegt in den Design-Recherchedaten) – jeweils als reine
// Stadt abgebildet. Kommen zwei Vereine aus derselben Stadt (z. B. München,
// Berlin, Essen, Frankfurt, Köln, Hamburg – teils in Liga 1, teils in Liga 2),
// werden sie per belegter Vereinsfarbe unterschieden (München Rot/Blau, Essen
// Rot/Schwarz …); nur wo Farbe kollidiert/unbelegt ist, per Stadtteil.
// Farben werden generisch aus Stadttradition abgeleitet (Farben sind nicht
// schützbar); Stadionnamen sind generisch gehalten.
const CLUB_SEEDS: ClubSeed[] = [
  { id: 'mgl', name: 'Mönchengladbach', shortName: 'MGL', city: 'Mönchengladbach', founded: 1900, primary: '#000000', secondary: '#00A650', reputation: 86, stadium: 'Stadion am Gladbacher Hang', capacity: 34500 },
  { id: 'ham', name: 'Hamburg Blau', shortName: 'HAB', city: 'Hamburg', founded: 1887, primary: '#003DA5', secondary: '#FFFFFF', reputation: 84, stadium: 'Elbpark-Stadion', capacity: 61000 },
  { id: 'bra', name: 'Braunschweig', shortName: 'BRA', city: 'Braunschweig', founded: 1895, primary: '#F6C500', secondary: '#004A99', reputation: 74, stadium: 'Oker-Stadion', capacity: 38000 },
  { id: 'muc', name: 'München Rot', shortName: 'MÜR', city: 'München', founded: 1900, primary: '#DC052D', secondary: '#0066B2', reputation: 85, stadium: 'Isar-Stadion', capacity: 69000 },
  { id: 'kai', name: 'Kaiserslautern', shortName: 'KAI', city: 'Kaiserslautern', founded: 1900, primary: '#E30613', secondary: '#FFFFFF', reputation: 78, stadium: 'Bergstadion Lautern', capacity: 38000 },
  { id: 'gel', name: 'Gelsenkirchen', shortName: 'GEL', city: 'Gelsenkirchen', founded: 1904, primary: '#004D9D', secondary: '#FFFFFF', reputation: 77, stadium: 'Emscherpark-Stadion', capacity: 70000 },
  { id: 'kln', name: 'Köln Rot', shortName: 'KÖR', city: 'Köln', founded: 1948, primary: '#ED1C24', secondary: '#FFFFFF', reputation: 82, stadium: 'Rheinwiesen-Stadion', capacity: 61000 },
  { id: 'ber', name: 'Berlin Blau', shortName: 'BEB', city: 'Berlin', founded: 1892, primary: '#004A99', secondary: '#FFFFFF', reputation: 79, stadium: 'Havel-Stadion', capacity: 76000 },
  { id: 'fra', name: 'Frankfurt Rot', shortName: 'FRR', city: 'Frankfurt', founded: 1899, primary: '#E1000F', secondary: '#000000', reputation: 80, stadium: 'Mainwald-Stadion', capacity: 62000 },
  { id: 'ess', name: 'Essen Rot', shortName: 'ESR', city: 'Essen', founded: 1907, primary: '#E30613', secondary: '#FFFFFF', reputation: 71, stadium: 'Stadion an der Zeche', capacity: 40000 },
  { id: 'dus', name: 'Düsseldorf', shortName: 'DÜS', city: 'Düsseldorf', founded: 1895, primary: '#E2001A', secondary: '#FFFFFF', reputation: 73, stadium: 'Rheinufer-Stadion', capacity: 68000 },
  { id: 'dui', name: 'Duisburg', shortName: 'DUI', city: 'Duisburg', founded: 1902, primary: '#0055A5', secondary: '#FFFFFF', reputation: 70, stadium: 'Stadion am Kanal', capacity: 38500 },
  { id: 'bre', name: 'Bremen', shortName: 'BRE', city: 'Bremen', founded: 1899, primary: '#009A44', secondary: '#FFFFFF', reputation: 72, stadium: 'Hanse-Stadion', capacity: 36000 },
  { id: 'kre', name: 'Krefeld', shortName: 'KRE', city: 'Krefeld', founded: 1905, primary: '#E2001A', secondary: '#0055A5', reputation: 66, stadium: 'Seidenweber-Stadion', capacity: 34500 },
  { id: 'kar', name: 'Karlsruhe', shortName: 'KAR', city: 'Karlsruhe', founded: 1894, primary: '#0033A0', secondary: '#FFFFFF', reputation: 67, stadium: 'Schlossgarten-Stadion', capacity: 35000 },
  { id: 'han', name: 'Hannover', shortName: 'HAN', city: 'Hannover', founded: 1896, primary: '#00963E', secondary: '#000000', reputation: 68, stadium: 'Leine-Stadion', capacity: 60000 },
  { id: 'boc', name: 'Bochum', shortName: 'BOC', city: 'Bochum', founded: 1848, primary: '#005CA9', secondary: '#FFFFFF', reputation: 66, stadium: 'Hellweg-Stadion', capacity: 40000 },
  { id: 'off', name: 'Offenbach', shortName: 'OFF', city: 'Offenbach', founded: 1901, primary: '#E30613', secondary: '#FFFFFF', reputation: 65, stadium: 'Stadion am Mainbogen', capacity: 30000 },
];

// -----------------------------------------------------------------------------
// Namens-Pools
// -----------------------------------------------------------------------------
const FIRST_NAMES = ['Klaus', 'Hans', 'Jürgen', 'Uwe', 'Manfred', 'Wolfgang', 'Rainer', 'Dieter', 'Rudi', 'Bernd', 'Karl', 'Günter', 'Horst', 'Werner', 'Norbert', 'Herbert', 'Reinhard', 'Michael', 'Thomas', 'Andreas', 'Stefan', 'Franz', 'Paul', 'Lothar', 'Toni', 'Sepp', 'Pierre', 'Erwin', 'Bernard', 'Felix'];
const LAST_NAMES = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'Walter'];

// Positions-Struktur eines Kaders (18 Spieler)
const SQUAD_TEMPLATE: Position[] = [
  'TW', 'TW',
  'LIB', 'VS', 'VS', 'AV', 'AV',
  'DM', 'ZM', 'ZM', 'OM', 'FL', 'FL',
  'MS', 'MS', 'HS',
  'ZM', 'AV',
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
  else if (['LIB', 'VS', 'AV'].includes(pos)) keys = ['tackling', 'marking', 'positioning', 'strength', 'heading', 'interceptions'];
  else if (['DM', 'ZM', 'OM'].includes(pos)) keys = ['passing', 'vision', 'technique', 'stamina', 'ballControl', 'decisions'];
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

// Erzeugungsjahr (1975 beim Spielstart; später für aufsteigende/neue Vereine das aktuelle Jahr).
let genYear = 1975;
let genDate = CURRENT_DATE;
function setGenDate(date: string): void { genDate = date; genYear = Number(date.slice(0, 4)); }

function makePlayer(clubId: string, index: number, pos: Position, strength: number, shirt: number, origin?: Origin): Player {
  // Altersverteilung um 25 (18–34), wenige ganz Junge/ganz Alte.
  const age = Math.max(18, Math.min(34, Math.round(25 + (rng() + rng() + rng() - 1.5) * 9)));
  const p = createPlayer({
    id: `${clubId}_p${index}`, clubId, pos, age,
    strength: Math.max(35, Math.min(88, strength + ri(-8, 8))),
    year: genYear, date: genDate, rng, shirt, origin,
  });
  p.form = ri(45, 75);
  p.transferListed = rng() < 0.08;
  p.contract.expiryDate = `${1976 + ri(0, 5)}-06-30`;
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

function makeFinances(rep: number): ClubFinances {
  const scale = rep * rep * 1000;
  return {
    balance: scale + ri(0, 500000), transferBudget: Math.round(scale * 0.6),
    wageBudget: Math.round(rep * 3000), currentWageBill: Math.round(rep * 2500),
    income: { ticketSales: 0, tvMoney: 0, sponsorship: 0, merchandise: 0, transferIncome: 0, prizeMoney: 0, catering: 0, advertising: 0, commercial: 0, membership: 0, matchday: 0, other: 0 },
    expenses: { wages: 0, transferExpense: 0, stadiumMaintenance: 0, trainingFacilities: 0, facilities: 0, staffWages: 0, other: 0 },
    transactions: [],
  };
}

function makeStadium(seed: ClubSeed): Stadium {
  return {
    name: seed.stadium, capacity: seed.capacity,
    averageAttendanceRate: 0.6 + rng() * 0.3, ticketPrice: ri(8, 20), condition: ri(55, 90),
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
  SQUAD_TEMPLATE.forEach((pos, idx) => {
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

export function generateWorld(managedClubId: string): GeneratedWorld {
  _seed = 1980; // reset für Determinismus
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};
  const youthPlayers: Record<string, Player> = {};

  for (const seed of CLUB_SEEDS) {
    clubs[seed.id] = buildClubFromSeed(seed, managedClubId, CURRENT_DATE, players, youthPlayers);
  }

  return { clubs, players, youthPlayers };
}

// -----------------------------------------------------------------------------
// 2. LIGA 1975/76 — zweigleisig (Staffel Nord / Staffel Süd)
// -----------------------------------------------------------------------------
// Rechtssicher als reine Städtenamen. Ein Teil sind reale, in den Design-Daten
// belegte Standorte der Saison 1975/76 (z. B. Berlin, Dortmund, Saarbrücken);
// der Rest sind klar fiktive Platzhalter aus kleineren realen Städten, die
// keinem bekannten Profiverein zugeordnet sind. Jede Mannschaft hat nur eine
// aggregierte Stärke + Farben (kein voller Kader) und wird performant per
// Stärke-Simulation geführt. Erst bei Aufstieg in die Spielerliga wird ein
// vollständiger Kader generiert (buildProClub).
export interface SecondLigaSeed {
  id: string; name: string; shortName: string; city: string;
  primary: string; secondary: string; strength: number;
}

export const SECOND_LIGA_NORD_SEEDS: SecondLigaSeed[] = [
  // Reale Teilnehmer der 2. 1. Liga Nord 1975/76 (als rechtssichere Stadt-
  // namen). Doppelstädte werden per belegter Vereinsfarbe unterschieden; wo
  // Farbe kollidiert/unbelegt ist, per belegtem Stadtteil (Köln Süd = Südstadt,
  // Berlin Reinickendorf = Wacker 04, dessen Lila mit Berlin Lila/TeBe kollidiert).
  { id: 'n_tebe', name: 'Berlin Lila', shortName: 'BEL', city: 'Berlin', primary: '#5B2A86', secondary: '#FFFFFF', strength: 66 },
  { id: 'n_dor', name: 'Dortmund', shortName: 'DOR', city: 'Dortmund', primary: '#FDE100', secondary: '#000000', strength: 68 },
  { id: 'n_mun', name: 'Münster', shortName: 'MÜN', city: 'Münster', primary: '#00693C', secondary: '#FFFFFF', strength: 60 },
  { id: 'n_koes', name: 'Köln Süd', shortName: 'KÖS', city: 'Köln', primary: '#E30613', secondary: '#FFFFFF', strength: 62 },
  { id: 'n_wup', name: 'Wuppertal', shortName: 'WUP', city: 'Wuppertal', primary: '#E30613', secondary: '#0055A5', strength: 63 },
  { id: 'n_osn', name: 'Osnabrück', shortName: 'OSN', city: 'Osnabrück', primary: '#5B2A86', secondary: '#FFFFFF', strength: 58 },
  { id: 'n_ess', name: 'Essen Schwarz', shortName: 'ESZ', city: 'Essen', primary: '#000000', secondary: '#FFFFFF', strength: 57 },
  { id: 'n_wat', name: 'Wattenscheid', shortName: 'WAT', city: 'Wattenscheid', primary: '#000000', secondary: '#FFFFFF', strength: 56 },
  { id: 'n_bie', name: 'Bielefeld', shortName: 'BIE', city: 'Bielefeld', primary: '#004B87', secondary: '#000000', strength: 61 },
  { id: 'n_hern', name: 'Herne', shortName: 'HRN', city: 'Herne', primary: '#0055A5', secondary: '#FFFFFF', strength: 54 },
  { id: 'n_goe', name: 'Göttingen', shortName: 'GÖT', city: 'Göttingen', primary: '#000000', secondary: '#F2C200', strength: 52 },
  { id: 'n_aac', name: 'Aachen', shortName: 'AAC', city: 'Aachen', primary: '#000000', secondary: '#F2C200', strength: 59 },
  { id: 'n_sol', name: 'Solingen', shortName: 'SOL', city: 'Solingen', primary: '#E30613', secondary: '#000000', strength: 53 },
  { id: 'n_ham', name: 'Hamburg Braun', shortName: 'HBR', city: 'Hamburg', primary: '#6A3B23', secondary: '#FFFFFF', strength: 58 },
  { id: 'n_lev', name: 'Leverkusen', shortName: 'LEV', city: 'Leverkusen', primary: '#E30613', secondary: '#000000', strength: 60 },
  { id: 'n_wac', name: 'Berlin Reinickendorf', shortName: 'BRK', city: 'Berlin', primary: '#5B2A86', secondary: '#FFFFFF', strength: 52 },
  { id: 'n_mue', name: 'Mülheim', shortName: 'MÜL', city: 'Mülheim', primary: '#0055A5', secondary: '#FFFFFF', strength: 51 },
  { id: 'n_erk', name: 'Erkenschwick', shortName: 'ERK', city: 'Erkenschwick', primary: '#E30613', secondary: '#FFFFFF', strength: 49 },
  { id: 'n_gue', name: 'Gütersloh', shortName: 'GÜT', city: 'Gütersloh', primary: '#00963E', secondary: '#FFFFFF', strength: 50 },
  { id: 'n_spa', name: 'Berlin Rot', shortName: 'BER', city: 'Berlin', primary: '#E30613', secondary: '#FFFFFF', strength: 50 },
];

export const SECOND_LIGA_SUED_SEEDS: SecondLigaSeed[] = [
  // Reale Teilnehmer der 2. 1. Liga Süd 1975/76 (als rechtssichere Stadt-
  // namen). Doppelstädte per Farbe: München Blau = 1860, Stuttgart Rot/Blau =
  // VfB/Kickers, Frankfurt Blau = FSV (Gegenstueck zu Frankfurt Rot in Liga 1).
  { id: 's_saa', name: 'Saarbrücken', shortName: 'SAA', city: 'Saarbrücken', primary: '#000000', secondary: '#0055A5', strength: 67 },
  { id: 's_nue', name: 'Nürnberg', shortName: 'NÜR', city: 'Nürnberg', primary: '#8C1D18', secondary: '#FFFFFF', strength: 65 },
  { id: 's_muc', name: 'München Blau', shortName: 'MÜB', city: 'München', primary: '#0066B2', secondary: '#FFFFFF', strength: 62 },
  { id: 's_hom', name: 'Homburg', shortName: 'HOM', city: 'Homburg', primary: '#00693C', secondary: '#FFFFFF', strength: 55 },
  { id: 's_bay', name: 'Bayreuth', shortName: 'BAY', city: 'Bayreuth', primary: '#F2C200', secondary: '#000000', strength: 56 },
  { id: 's_voe', name: 'Völklingen', shortName: 'VÖL', city: 'Völklingen', primary: '#004D9D', secondary: '#FFFFFF', strength: 54 },
  { id: 's_dar', name: 'Darmstadt', shortName: 'DAR', city: 'Darmstadt', primary: '#005CA9', secondary: '#FFFFFF', strength: 58 },
  { id: 's_man', name: 'Mannheim', shortName: 'MAN', city: 'Mannheim', primary: '#0055A5', secondary: '#000000', strength: 60 },
  { id: 's_hof', name: 'Hof', shortName: 'HOF', city: 'Hof', primary: '#E2001A', secondary: '#FFFFFF', strength: 53 },
  { id: 's_fue', name: 'Fürth', shortName: 'FÜR', city: 'Fürth', primary: '#00693C', secondary: '#FFFFFF', strength: 57 },
  { id: 's_vfb', name: 'Stuttgart Rot', shortName: 'STR', city: 'Stuttgart', primary: '#E30613', secondary: '#FFFFFF', strength: 64 },
  { id: 's_mai', name: 'Mainz', shortName: 'MAI', city: 'Mainz', primary: '#E2001A', secondary: '#FFFFFF', strength: 56 },
  { id: 's_fsv', name: 'Frankfurt Blau', shortName: 'FRB', city: 'Frankfurt', primary: '#003DA5', secondary: '#000000', strength: 55 },
  { id: 's_pir', name: 'Pirmasens', shortName: 'PIR', city: 'Pirmasens', primary: '#E30613', secondary: '#FFFFFF', strength: 52 },
  { id: 's_aug', name: 'Augsburg', shortName: 'AUG', city: 'Augsburg', primary: '#E30613', secondary: '#00693C', strength: 58 },
  { id: 's_stk', name: 'Stuttgart Blau', shortName: 'STB', city: 'Stuttgart', primary: '#0055A5', secondary: '#FFFFFF', strength: 55 },
  { id: 's_reg', name: 'Regensburg', shortName: 'REG', city: 'Regensburg', primary: '#E2001A', secondary: '#FFFFFF', strength: 53 },
  { id: 's_sch', name: 'Schweinfurt', shortName: 'SCW', city: 'Schweinfurt', primary: '#00693C', secondary: '#FFFFFF', strength: 56 },
  { id: 's_bkr', name: 'Bad Kreuznach', shortName: 'BKR', city: 'Bad Kreuznach', primary: '#005CA9', secondary: '#E2001A', strength: 50 },
  { id: 's_reu', name: 'Reutlingen', shortName: 'REU', city: 'Reutlingen', primary: '#E2001A', secondary: '#FFFFFF', strength: 54 },
];

// Wandelt einen 2.-Liga-Seed / SimClub-artigen Datensatz in einen echten
// ClubSeed um und baut daraus einen vollständigen Profiverein (Aufstieg in die
// Spielerliga). Stadion/Kapazität/Ruf werden aus der Stärke abgeleitet.
export function buildProClub(
  src: { id: string; name: string; shortName: string; city: string; strength: number; colors: { primary: string; secondary: string } },
  managedClubId: string,
  currentDate: string,
  players: Record<string, Player>,
  youthPlayers: Record<string, Player>,
): Club {
  const reputation = Math.max(55, Math.min(80, Math.round(src.strength)));
  const seed: ClubSeed = {
    id: src.id, name: src.name, shortName: src.shortName, city: src.city,
    founded: 1900 + ri(0, 20), primary: src.colors.primary, secondary: src.colors.secondary,
    reputation, stadium: `Stadion ${src.city}`, capacity: 18000 + Math.round(src.strength * 400),
  };
  setGenDate(currentDate);
  try {
    return buildClubFromSeed(seed, managedClubId, currentDate, players, youthPlayers);
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
  'LIB', 'VS', 'AV', 'AV',
  'DM', 'ZM', 'ZM', 'OM', 'FL',
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
export function generateCupAmateurs(count: number): CupAmateurs {
  _seed = 4711; // fester Seed für reproduzierbares Pokal-Feld
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};

  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const id = `am${i + 1}`;
    const reputation = ri(30, 55);
    const strengthBase = 32 + Math.round(reputation * 0.35);

    // Eindeutigen Vereinsnamen bauen
    let prefix = pick(AMATEUR_PREFIXES);
    let town = pick(AMATEUR_TOWNS);
    let name = `${prefix} ${town}`;
    let guard = 0;
    while (usedNames.has(name) && guard++ < 40) {
      prefix = pick(AMATEUR_PREFIXES);
      town = pick(AMATEUR_TOWNS);
      name = `${prefix} ${town}`;
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
      name: `Stadion am ${town}er Weg`,
      capacity,
      averageAttendanceRate: 0.35 + rng() * 0.35,
      ticketPrice: ri(5, 12),
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
    const p = makePlayer(euro.id, idx, pos, strengthBase, shirt++, ORIGINS[COUNTRY_ORIGIN[euro.country] ?? 'eng']);
    players[p.id] = p;
    playerIds.push(p.id);
  });

  const capacity = 25000 + Math.round(euro.strength * 500);
  const stadium: Stadium = {
    name: `Stadion ${euro.city}`,
    capacity,
    averageAttendanceRate: 0.6 + rng() * 0.3,
    ticketPrice: ri(8, 20),
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
  setGenDate(CURRENT_DATE);
  return club;
}

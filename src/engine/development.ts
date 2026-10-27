// =============================================================================
// Entwicklungs-Engine 2.0
// -----------------------------------------------------------------------------
// 1) Jede Woche sammelt JEDER Profi verdeckt Entwicklungspunkte:
//      Fortschritt = Basis(Alter) · Training · Spielpraxis · Charakter · Umfeld
//                    · Abstand zum Potenzial · Epoche
//    Ab ~29 Jahren kommt Abbau dazu (Epoche verschiebt den Beginn).
// 2) In den Bewertungsrunden (Herbst, Winter, Saisonende) werden die Punkte
//    ausgezahlt: auf die für die Position wichtigen Attribute verteilt, die
//    Gesamtstärke ergibt sich daraus. Dazu Durchbrüche, Spätzünder, Knicke.
// 3) Das wahre Potenzial (Grundpotenzial + Entfaltung) ist verdeckt; die Sterne
//    sind eine Scout-Einschätzung mit Spanne (siehe engine/scouting.ts).
// Alle Vereine nutzen dieselbe Formel – nur Training/Spielzeit unterscheiden sich.
// =============================================================================
import { Player, Club, AttributeKey, potentialToStars, clampStars } from '../types';
import { POSITION_WEIGHTS, positionSuitability } from './positions';
import { updateScoutEstimate } from './scouting';

/** Ergebnis der Leistungsbewertung je Spieler (auch bei change === 0). */
export interface RatingResult {
  playerId: string;
  playerName: string;
  clubId: string;
  clubShort: string;
  position: string;
  age: number;
  oldOverall: number;
  newOverall: number;
  change: number;
  isUserClub: boolean;
  /** Besonderes Ergebnis für die Einblendung. */
  tag?: 'Durchbruch' | 'Spätzünder' | 'Knick';
}

export type RatingType = 'small' | 'medium' | 'large';

// -----------------------------------------------------------------------------
// Hilfen & Migration
// -----------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Ergänzt fehlende 2.0-Felder (alte Spielstände, alte Generatoren). */
export function ensureDevFields(p: Player): void {
  const d = p.development;
  if (d.basePotential == null) d.basePotential = Math.max(p.overall, d.potentialAbility ?? p.overall);
  if (d.unfold == null) d.unfold = 0;
  if (d.professionalism == null) {
    const h = hash(p.id);
    d.professionalism = 30 + (h % 60);
    d.ambition = 30 + ((h >> 7) % 60);
    d.adaptability = 30 + ((h >> 13) % 60);
  }
  if (d.devPoints == null) d.devPoints = 0;
  if (d.recentMinutes == null) d.recentMinutes = 0;
  if (d.lastMinutesSeen == null) d.lastMinutesSeen = p.careerStats?.minutesPlayed ?? 0;
  if (d.scoutBias == null) d.scoutBias = ((hash(p.id + 's') % 5) - 2) / 4;
}

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Wahres (verdecktes) Potenzial. */
export function truePotential(p: Player): number {
  ensureDevFields(p);
  return clamp((p.development.basePotential ?? p.overall) + (p.development.unfold ?? 0), 30, 99);
}

/** Epochenfaktoren: Sportwissenschaft beschleunigt Entwicklung und verschiebt den Abbau. */
export function eraFactors(year: number): { growth: number; declineShift: number } {
  if (year < 1984) return { growth: 0.92, declineShift: 0 };
  if (year < 1993) return { growth: 0.96, declineShift: 0.5 };
  if (year < 2004) return { growth: 1.0, declineShift: 1 };
  if (year < 2014) return { growth: 1.05, declineShift: 1.5 };
  return { growth: 1.08, declineShift: 2.5 };
}

/** Wöchentliche Basisrate (OVR-Punkte) nach Alter. Negativ = Abbau. */
export function baseWeeklyRate(age: number, declineShift: number): number {
  const a = age - declineShift;
  if (age <= 20) return 0.11;
  if (age <= 24) return 0.065;
  if (age <= 28) return a <= 27 ? 0.025 : 0.01;
  if (a <= 30) return -0.03;
  if (a <= 32) return -0.055;
  if (a <= 34) return -0.08;
  return -0.11;
}

// -----------------------------------------------------------------------------
// Faktoren
// -----------------------------------------------------------------------------
export interface ClubDevContext {
  /** 0.75 … 1.35: Trainingsqualität (Anlagen, Stab, Plan). */
  training: number;
  /** 0.9 … 1.1: Umfeld (Unruhe im Verein, Erfolg). */
  environment: number;
}

/** Trainingsfaktor eines Vereins. Eigener Verein erhält zusätzlich den Stab-/Plan-Bonus. */
export function clubTrainingFactor(club: Club, extra = 0): number {
  const inf = club.infrastructure;
  const tc = inf?.trainingCenter ?? 1;
  const perf = inf?.performanceCenter ?? 1;
  const rep = club.reputation ?? 60;
  // Anlagen bis +0,20, Leistungszentrum bis +0,08, Vereinsgröße (Trainerstab-Proxy) bis +0,10
  const f = 0.88 + (tc - 1) * 0.05 + (perf - 1) * 0.02 + clamp((rep - 55) / 300, 0, 0.1) + extra;
  return clamp(f, 0.75, 1.35);
}

function practiceFactor(p: Player): number {
  // recentMinutes ≈ gleitende Minuten der letzten ~8 Wochen; 540 ≈ 6 volle Spiele.
  const r = clamp((p.development.recentMinutes ?? 0) / 540, 0, 1);
  return 0.6 + r * 0.8;
}

function characterFactor(p: Player): number {
  const d = p.development;
  const v = ((d.professionalism ?? 50) * 0.6 + (d.ambition ?? 50) * 0.4) / 100; // 0..1
  return 0.7 + v * 0.6;
}

function moraleFactor(p: Player): number {
  return { very_low: 0.88, low: 0.94, okay: 1, good: 1.04, excellent: 1.08 }[p.morale] ?? 1;
}

function distanceFactor(p: Player): number {
  const gap = truePotential(p) - (p.development.currentAbility ?? p.overall);
  if (gap <= 0) return 0;
  // Weiche Bremse: die letzten Punkte sind am schwersten (nur mit sehr guten Bedingungen erreichbar).
  const f = Math.min(1, gap / 10);
  return gap < 2 ? f * 0.35 : f;
}

// -----------------------------------------------------------------------------
// 1) WÖCHENTLICH: Punkte sammeln (alle Profis)
// -----------------------------------------------------------------------------
export function weeklyDevelopment(
  players: Record<string, Player>,
  clubs: Record<string, Club>,
  year: number,
  ctxFor: (club: Club) => ClubDevContext,
): void {
  const era = eraFactors(year);
  const ctxCache = new Map<string, ClubDevContext>();
  for (const p of Object.values(players)) {
    if (p.isYouth) continue;
    ensureDevFields(p);
    const d = p.development;
    // Spielpraxis: Minuten seit letzter Woche in den gleitenden Wert einrechnen.
    const total = p.careerStats?.minutesPlayed ?? 0;
    const delta = Math.max(0, total - (d.lastMinutesSeen ?? total));
    d.lastMinutesSeen = total;
    d.recentMinutes = (d.recentMinutes ?? 0) * 0.88 + delta;

    const club = clubs[p.clubId];
    let ctx = club ? ctxCache.get(club.id) : undefined;
    if (club && !ctx) { ctx = ctxFor(club); ctxCache.set(club.id, ctx); }
    const training = ctx?.training ?? 0.9;
    const environment = ctx?.environment ?? 1;

    const base = baseWeeklyRate(p.age, era.declineShift);
    let pts: number;
    if (base >= 0) {
      pts = base * training * practiceFactor(p) * characterFactor(p) * environment * moraleFactor(p)
        * distanceFactor(p) * era.growth;
    } else {
      // Abbau: gutes Training und Professionalität bremsen ihn (bis −35 %), stoppen ihn nicht.
      const brake = clamp(1 - (training - 0.9) * 0.6 - ((d.professionalism ?? 50) - 50) / 400, 0.65, 1.15);
      pts = base * brake;
    }
    d.devPoints = (d.devPoints ?? 0) + pts;
  }
}

// -----------------------------------------------------------------------------
// 2) BEWERTUNGSRUNDE: Punkte auszahlen
// -----------------------------------------------------------------------------
const PAYOUT_SHARE: Record<RatingType, number> = { small: 0.5, medium: 0.7, large: 1 };
const MAX_STEP: Record<RatingType, number> = { small: 2, medium: 3, large: 6 };

/** Verteilt eine OVR-Änderung auf die Attribute (positionsgewichtet, Abbau zuerst physisch). */
export function applyOverallChange(p: Player, change: number): void {
  if (change === 0) return;
  const w = POSITION_WEIGHTS[p.naturalPosition] as Partial<Record<AttributeKey, number>>;
  const keys = Object.keys(w) as AttributeKey[];
  const physical: AttributeKey[] = ['speed', 'acceleration', 'stamina', 'agility', 'jumping', 'strength', 'balance'];
  const target = p.overall + change;
  // Schrittweise Punkte vergeben, bis die Positionsstärke das Ziel erreicht.
  let guard = 0;
  while (guard++ < 120) {
    const cur = positionSuitability(p, p.naturalPosition);
    if ((change > 0 && cur >= target) || (change < 0 && cur <= target)) break;
    let k: AttributeKey;
    if (change > 0) {
      // Training-Akkumulator (eigener Verein) gibt Schwerpunkt vor, sonst nach Gewicht.
      const acc = p.development.attributeProgress ?? {};
      const weighted = keys.map((key) => ({ key, s: (w[key] ?? 1) * (1 + (acc[key] ?? 0)) * (0.6 + Math.random()) }));
      weighted.sort((a, b) => b.s - a.s);
      k = weighted[0].key;
    } else {
      const pool = (p.age >= 31 ? physical : keys).filter((key) => (p.attributes[key] ?? 0) > 5);
      k = pool[Math.floor(Math.random() * pool.length)] ?? keys[0];
    }
    (p.attributes as any)[k] = clamp((p.attributes[k] ?? 50) + (change > 0 ? 1 : -1), 1, 99);
    // Mental-Werte altern kaum, Erfahrung steigt mit Spielen weiter.
  }
  // Auch fachfremde Physis baut im Alter ab.
  if (change < 0 && p.age >= 30) {
    for (const k of physical) if (Math.random() < 0.25) (p.attributes as any)[k] = clamp(p.attributes[k] - 1, 1, 99);
  }
  refreshOverall(p);
}

/** Gesamtstärke und Positionswerte aus den Attributen neu berechnen. */
export function refreshOverall(p: Player): void {
  p.overall = positionSuitability(p, p.naturalPosition);
  p.development.currentAbility = p.overall;
  const ratings: Partial<Record<string, number>> = { [p.naturalPosition]: p.overall };
  for (const pos of p.secondaryPositions ?? []) ratings[pos] = positionSuitability(p, pos);
  p.positionRatings = ratings as Player['positionRatings'];
}

function applyRatingToPlayer(p: Player, type: RatingType, dateISO: string): { change: number; tag?: RatingResult['tag'] } {
  ensureDevFields(p);
  const d = p.development;
  let tag: RatingResult['tag'];

  // --- Entfaltung & Sonderfälle nur in der großen Runde ---
  if (type === 'large') {
    if (p.age <= 23) {
      const practice = practiceFactor(p);
      let du = 0;
      if (practice >= 1.15 && (d.professionalism ?? 50) >= 55) du += 1;
      if (practice >= 1.3 && p.form >= 65) du += 1;
      if (practice <= 0.75) du -= 1;
      if (p.injury && (p.injury.severity === 'severe' || p.injury.severity === 'critical')) du -= 1;
      d.unfold = clamp((d.unfold ?? 0) + clamp(du, -2, 2), -6, 6);
    }
    // Durchbruch: jung, viel Spielpraxis, Entfaltung im Plus.
    if (p.age <= 22 && (d.unfold ?? 0) >= 2 && practiceFactor(p) >= 1.2 && Math.random() < 0.08) {
      d.devPoints = (d.devPoints ?? 0) + 3 + Math.random() * 2;
      tag = 'Durchbruch';
    } else if (p.age >= 24 && p.age <= 27 && (d.ambition ?? 50) >= 80 && Math.random() < 0.03) {
      d.basePotential = clamp((d.basePotential ?? p.overall) + 3, 30, 97);
      d.devPoints = (d.devPoints ?? 0) + 3;
      tag = 'Spätzünder';
    } else if ((p.injury && p.injury.severity === 'critical') || (p.trainingLoad > 900 && Math.random() < 0.3)) {
      d.devPoints = (d.devPoints ?? 0) - 3;
      tag = 'Knick';
    }
  }

  const pts = d.devPoints ?? 0;
  const share = PAYOUT_SHARE[type];
  // Kleine Unschärfe (±0,6), damit Runden nicht völlig vorhersagbar sind.
  const raw = pts * share + (Math.random() - 0.5) * 1.2;
  let change = Math.trunc(raw);
  const cap = MAX_STEP[type];
  change = clamp(change, -cap, cap);
  // Nie über das wahre Potenzial (+1 Toleranz) wachsen.
  if (change > 0) change = Math.min(change, Math.max(0, truePotential(p) + 1 - p.overall));
  d.devPoints = pts - change;
  // Nicht ausgezahlte Reste begrenzen (keine endlose Ansammlung).
  d.devPoints = clamp(d.devPoints, -4, 4);

  if (change !== 0) {
    applyOverallChange(p, change);
    d.lastRatingChange = change;
    d.abilityHistory.push({ date: dateISO, ability: p.overall });
    if (d.abilityHistory.length > 40) d.abilityHistory.splice(0, d.abilityHistory.length - 40);
  } else {
    d.lastRatingChange = 0;
  }
  if (tag === 'Knick' && change >= 0) tag = undefined;
  if (tag === 'Durchbruch' && change < 3) tag = undefined;
  return { change, tag };
}

/**
 * Bewertungsrunde für ALLE Spieler. Ergebnisliste nur für den eigenen Verein
 * (für die Zeremonie). `scoutQuality` (0–1) steuert die Genauigkeit der
 * neuen Sterne-Einschätzung des eigenen Kaders.
 */
export function runRatingCeremony(
  players: Record<string, Player>,
  clubs: Record<string, Club>,
  managedClubId: string,
  type: RatingType,
  dateISO: string,
  scoutQuality = 0.5,
): RatingResult[] {
  const managed = clubs[managedClubId];
  const managedIds = new Set(managed ? managed.playerIds : []);
  const results: RatingResult[] = [];
  for (const p of Object.values(players)) {
    if (p.isYouth) continue;
    const old = p.overall;
    const { change, tag } = applyRatingToPlayer(p, type, dateISO);
    if (type !== 'small') updateScoutEstimate(p, managedIds.has(p.id) ? scoutQuality : 0.2, managedIds.has(p.id));
    if (managedIds.has(p.id)) {
      results.push({
        playerId: p.id, playerName: p.fullName, clubId: managedClubId, clubShort: managed?.shortName ?? '—',
        position: p.naturalPosition, age: p.age, oldOverall: old, newOverall: p.overall, change, isUserClub: true, tag,
      });
    }
  }
  // Spannung: erst die Kleinen, die größten Sprünge zuletzt.
  results.sort((a, b) => Math.abs(a.change) - Math.abs(b.change));
  return results;
}

/**
 * Trainer-Tendenzen vor einer Bewertungsrunde (eigener Verein). Ein schwacher
 * Stab irrt sich öfter (bis 30 %).
 */
export function ratingTendencies(players: Player[], staffQuality: number): { player: Player; up: boolean }[] {
  const err = clamp(0.3 - staffQuality * 0.25, 0.05, 0.3);
  const scored = players.filter((p) => !p.isYouth).map((p) => { ensureDevFields(p); return { p, pts: p.development.devPoints ?? 0 }; });
  scored.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
  return scored.slice(0, 5).filter((x) => Math.abs(x.pts) >= 0.8).map((x) => ({ player: x.p, up: Math.random() < err ? x.pts < 0 : x.pts > 0 }));
}

/** Aktualisiert das Alter aller Spieler zum aktuellen Datum (UTC). */
export function updateAges(players: Record<string, Player>, currentDateISO: string): void {
  const now = new Date(currentDateISO + 'T00:00:00Z');
  for (const p of Object.values(players)) {
    const dob = new Date(p.dateOfBirth + 'T00:00:00Z');
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    const m = now.getUTCMonth() - dob.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
    p.age = age;
  }
}

/** Sterne aus einem Potenzialwert (für Anzeigen). */
export function starsFor(potential: number): number {
  return clampStars(potentialToStars(potential));
}

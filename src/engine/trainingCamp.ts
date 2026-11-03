// =============================================================================
// TRAININGSLAGER – Rechenlogik (ohne Spielstand): Verfügbarkeit je Epoche, Unterkunft
// und Anlage, Trainingsschwerpunkt, Kosten, erwartete Wirkung, Wahl der KI.
// Ziele/Quellen in data/campDestinations.ts, Unterkünfte in data/campLodgings.ts.
// =============================================================================
import { CAMP_CLIMATE, CAMP_DESTINATIONS, CampDestination, CampOpp } from '../data/campDestinations';
import { CampLodging, lodgingsFor } from '../data/campLodgings';
import type { CampSeason } from '../game/winterShared';
import type { CoachPhilosophy, CoachStyle } from '../types';
import { CampProgram, programDef } from './campProgram';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export const CAMP_MIN_DAYS = 5;
export const CAMP_MAX_DAYS = 14;
/** Buchung mindestens so viele Tage im Voraus. */
export const CAMP_LEAD_DAYS = 7;
/** Kurzfristig (< 21 Tage vorher) kostet 20 % Aufschlag. */
export const CAMP_SHORT_NOTICE_DAYS = 21;
export const CAMP_SHORT_NOTICE_SURCHARGE = 0.2;
/** Storno: 50 % werden erstattet. */
export const CAMP_REFUND = 0.5;
/** Höhentraining: Zusatzwirkung so viele Tage nach der Rückkehr. */
export const CAMP_ALTITUDE_DELAY = 12;

// -----------------------------------------------------------------------------
// Trainingsschwerpunkte
// -----------------------------------------------------------------------------
export type CampFocus = 'ausgewogen' | 'kondition' | 'taktik' | 'teamgeist' | 'regeneration' | 'jugend';

export interface FocusDef {
  label: string; text: string;
  fit: number; dev: number; form: number; morale: number; inj: number; disc: number;
  /** Frische bei Rückkehr (Punkte), Heilung laufender Verletzungen (Anteil der Lagertage). */
  frische: number; heal: number; sat: number; cost: number;
  /** Lernen der Jungen (≤ 21) relativ zu `dev`; Chance auf Disziplingewinn (Faktor). Fehlt = 1. */
  youth?: number; discGain?: number;
}
export const CAMP_FOCUS: Record<CampFocus, FocusDef> = {
  ausgewogen:   { label: 'Ausgewogen', text: 'Kondition, Taktik und Spielformen im üblichen Mix.', fit: 1, dev: 1, form: 1, morale: 1, inj: 1, disc: 1, frische: 0, heal: 0, sat: 0, cost: 1 },
  kondition:    { label: 'Kondition', text: 'Läufe, Zirkel, zwei bis drei Einheiten am Tag. Viel Fitness, müde Beine, mehr Verletzungen.', fit: 1.35, dev: 0.75, form: 0.85, morale: 0.75, inj: 1.3, disc: 0.8, frische: -8, heal: 0, sat: -1, cost: 1 },
  taktik:       { label: 'Taktik', text: 'Spielzüge, Pressing, Standards, Videoanalyse. Bringt Entwicklung und Form, weniger Fitness.', fit: 0.8, dev: 1.5, form: 1.25, morale: 0.9, inj: 0.85, disc: 1, frische: 0, heal: 0, sat: 0, cost: 1.03 },
  teamgeist:    { label: 'Mannschaftsgeist', text: 'Gemeinsame Ausflüge, Abende, Rituale. Stärkt Moral und Zufriedenheit.', fit: 0.75, dev: 0.8, form: 1, morale: 2, inj: 0.8, disc: 1.1, frische: 2, heal: 0, sat: 3, cost: 1.06 },
  regeneration: { label: 'Regeneration', text: 'Wenig Umfänge, viel Physio. Frische Spieler, Verletzte kommen schneller zurück.', fit: 0.55, dev: 0.6, form: 1.15, morale: 1.2, inj: 0.45, disc: 1.2, frische: 12, heal: 0.7, sat: 1, cost: 1.08 },
  jugend:       { label: 'Jugendintegration', text: 'Junge Spieler (bis 21) trainieren mit, bekommen Einsätze in den Testspielen und Anschluss an die Kabine.', fit: 0.9, dev: 0.85, form: 0.95, morale: 1, inj: 1, disc: 1, frische: 0, heal: 0, sat: 0, cost: 1, youth: 2.4 / 0.85 },
};
/** Faktoren eines Lagers: Punkteverteilung (Planer) oder fester Schwerpunkt (KI, alte Buchungen). */
export function focusDef(focus: CampFocus, program?: CampProgram): FocusDef {
  return program ? programDef(program) : CAMP_FOCUS[focus];
}
export const CAMP_FOCUS_ORDER: CampFocus[] = ['ausgewogen', 'kondition', 'taktik', 'teamgeist', 'regeneration', 'jugend'];
/** Alter, bis zu dem ein Spieler als Nachwuchs gilt (Jugendintegration). */
export const CAMP_YOUTH_AGE = 21;

/** Kalenderjahr, nach dem ein Lager historisch eingeordnet wird (Winter = Januar-Jahr). */
export function campYear(season: string, campSeason: CampSeason): number {
  const y0 = parseInt(season.slice(0, 4), 10);
  return campSeason === 'winter' ? y0 + 1 : y0;
}

export interface CampStatus { ok: boolean; reason?: string }

/**
 * Ist ein Ziel in diesem Jahr für einen Verein mit diesem Ansehen buchbar? Mit `obligation`
 * (Sponsor-Pflicht für dieses Fenster) ist nur das Pflichtziel buchbar – ohne Ansehensgrenze.
 */
export function destinationStatus(d: CampDestination, campSeason: CampSeason, year: number, rep: number, obligation?: string): CampStatus {
  if (!d.seasons.includes(campSeason)) return { ok: false, reason: campSeason === 'winter' ? 'nur im Sommer' : 'nur im Winter' };
  const first = d.access[0];
  if (year < first.from) return { ok: false, reason: `erst ab ${first.from}` };
  if (d.closed?.includes(year)) return { ok: false, reason: `${year}: Reisebeschränkungen (Corona)` };
  if (obligation && obligation !== d.id) return { ok: false, reason: 'Sponsor-Vertrag schreibt ein anderes Ziel vor' };
  if (obligation === d.id) return { ok: true };
  const acc = [...d.access].reverse().find((a) => a.from <= year)!;
  if (rep < acc.minRep) {
    const next = d.access.find((a) => a.from > year && a.minRep <= rep);
    return { ok: false, reason: `nur für Spitzenvereine (Ansehen ≥ ${acc.minRep})${next ? `, für euch ab ${next.from}` : ''}` };
  }
  return { ok: true };
}

/** Alle Ziele mit Status (für Seite, KI und Test). */
export function destinationsFor(campSeason: CampSeason, year: number, rep: number, obligation?: string): { d: CampDestination; status: CampStatus }[] {
  return CAMP_DESTINATIONS.filter((d) => d.seasons.includes(campSeason)).map((d) => ({ d, status: destinationStatus(d, campSeason, year, rep, obligation) }));
}

/** Größe des Trosses / Betreuerstab nach Ansehen (0,85 … 1,2). */
export function entourageFactor(rep: number): number {
  return clamp(0.85 + (rep - 50) / 115, 0.85, 1.2);
}

/** Übliche Reisegruppe (Spieler), auf die Reise- und Tagessätze kalkuliert sind. */
export const CAMP_STD_HEADS = 24;
/** Kostenfaktor nach Größe der Reisegruppe (Spieler + rund neun Betreuer). */
export function headsFactor(heads: number | undefined): number {
  return heads == null ? 1 : clamp((heads + 9) / (CAMP_STD_HEADS + 9), 0.55, 1.35);
}

/** Kosten in 1975-Basis (ohne Kurzfrist-Aufschlag); `heads` = mitreisende Spieler (Planer). */
export function campCostBase(d: CampDestination, l: CampLodging, days: number, rep: number, focus: CampFocus = 'ausgewogen', heads?: number, program?: CampProgram): number {
  return Math.round((d.travel + l.rate * days * focusDef(focus, program).cost) * entourageFactor(rep) * headsFactor(heads) / 100) * 100;
}

// -----------------------------------------------------------------------------
// Ausstattung je Epoche
// -----------------------------------------------------------------------------
/** Kraftraum: vor 1985 höchstens Hantelraum. */
export const gymLevel = (l: CampLodging, year: number) => Math.min(l.gym, year < 1985 ? 1 : 2);
/** Regeneration: Stufe 3 erst ab 1998 (Eisbad), vorher wie 2. */
export const regenLevel = (l: CampLodging, year: number) => Math.min(l.regen, year < 1998 ? 2 : 3);
/** Ernährung wirkt erst mit der modernen Sportmedizin (Gewicht 0,2 → 0,5 → 1). */
export const kitchenWeight = (year: number) => (year < 1985 ? 0.2 : year < 2000 ? 0.5 : 1);
export const hasHall = (l: CampLodging, year: number) => l.hall != null && l.hall <= year;
export const hasTurf = (l: CampLodging, year: number) => l.turf != null && l.turf <= year;
export const lodgingAltitude = (d: CampDestination, l: CampLodging) => l.altitude ?? d.altitude;

export function gymLabel(l: CampLodging, year: number): string {
  const g = gymLevel(l, year);
  return g === 0 ? '–' : year < 1985 ? 'Hantelraum' : g === 1 ? 'einfach' : 'modern';
}
export function regenLabel(l: CampLodging, year: number): string {
  const r = regenLevel(l, year);
  if (r === 0) return '–';
  if (r === 1) return 'Sauna';
  if (r === 2) return year < 1990 ? 'Sauna, Massage' : 'Physio, Bäder';
  return year < 2012 ? 'Physio, Eisbad' : 'Eisbad, Kältekammer';
}
export function kitchenLabel(l: CampLodging, year: number): string {
  if (l.kitchen === 0) return 'Hausmannskost';
  if (l.kitchen === 1) return year < 1990 ? 'kräftige Küche' : 'Sportlerküche';
  return year < 2000 ? 'gehobene Küche' : 'Ernährungsplan';
}
export function groundLabel(l: CampLodging, year: number): string {
  const parts = [`${l.pitches} ${l.pitches === 1 ? 'Platz' : 'Plätze'}`];
  if (hasTurf(l, year)) parts.push('Kunstrasen');
  if (hasHall(l, year)) parts.push('Halle');
  return parts.join(' · ');
}

// -----------------------------------------------------------------------------
// Wetter je Monat
// -----------------------------------------------------------------------------
export function campMonth(start: string | undefined, campSeason: CampSeason): number {
  if (start) return parseInt(start.slice(5, 7), 10) - 1;
  return campSeason === 'summer' ? 6 : 0;
}
/** Wetterrisiko und Platzzustand am Ort im Monat (0 = Januar). */
export function campWeather(d: CampDestination, month: number): { risk: number; ground: number; label: string } {
  const c = CAMP_CLIMATE[d.climate];
  return { risk: c.risk[month], ground: c.ground[month], label: c.label };
}

const OPP: Record<CampOpp, { income: number; form: number; inj: number }> = {
  amateur: { income: 1, form: 0.25, inj: 0.003 },
  regional: { income: 1, form: 0.35, inj: 0.004 },
  international: { income: 1, form: 0.45, inj: 0.005 },
  top: { income: 1, form: 0.5, inj: 0.007 },
};
const RUNS_FIT: Record<string, number> = { duenen: 1.15, berg: 1.12, strand: 1.08, wald: 1.06 };

export interface CampPlanInput {
  d: CampDestination; l: CampLodging; focus: CampFocus; season: CampSeason;
  days: number; tests: number; year: number; rep: number;
  /** Starttag (ISO) für das Wetter des Monats; ohne: Juli bzw. Januar. */
  start?: string;
  /** Punkteverteilung aus dem Planer (ersetzt den festen Schwerpunkt). */
  program?: CampProgram;
}

export interface CampOutlook {
  /** Fitness-Aufbau je Spieler (Erwartung, sofort) und Spanne je nach Wetter. */
  fitness: number; fitnessLo: number; fitnessHi: number;
  /** Form-Zuwachs je Spieler (nach Reisestrapazen) und Spanne. */
  form: number; formLo: number; formHi: number;
  /** Entwicklungspunkte je Spieler; Nachwuchs (≤ 21) gesondert. */
  dev: number; devYouth: number;
  /** Chance je Spieler auf eine Moral-Stufe mehr; Zufriedenheit. */
  morale: number; satisfaction: number;
  /** Ältere Stars murren über einfache Unterkünfte (Chance je Spieler ≥ 28 bei großem Verein). */
  starGrumble: number;
  /** Verletzungsrisiko je Spieler über das ganze Lager. */
  injury: number;
  /** Disziplin: Chance je Spieler (Professionalität 50) auf einen Verstoß; Chance auf Disziplingewinn. */
  discipline: number; disciplineGain: number;
  /** Reisestrapazen bei Rückkehr: Frische und Form. */
  travelFrische: number; travelForm: number;
  /** Frische-Änderung durch das Lager selbst (Schwerpunkt, Regeneration, Höhe). */
  campFrische: number;
  /** Tage weniger Ausfall für Verletzte, die mitreisen (Regeneration). */
  heal: number;
  /** Höhentraining: zusätzliche Fitness nach CAMP_ALTITUDE_DELAY Tagen. */
  altitudeFitness: number; altitude: number;
  testIncome: number; brandIntl: number; sponsorBase: number;
  /** Fan-Stimmung: + durch heimatnahe Lager (Zaungäste), − durch Kritik. */
  fanMood: number; criticism: number; criticismText?: string;
  weatherLoss: number; weatherRisk: number; pitch: number;
}

/** Erwartete Wirkung eines Lagers. */
export function campOutlook(p: CampPlanInput): CampOutlook {
  const { d, l, focus, season, days, tests, year, rep } = p;
  const f = focusDef(focus, p.program);
  const w = campWeather(d, campMonth(p.start, season));
  const turf = hasTurf(l, year), hall = hasHall(l, year);
  const cover = Math.min(0.8, (turf ? 0.6 : 0) + (hall ? 0.35 : 0));
  const weatherRisk = w.risk * (1 - cover);
  const weatherLoss = weatherRisk * 0.5;
  let pitch = l.pitchQ * (0.3 + 0.7 * w.ground);
  if (turf) pitch = Math.max(pitch, 0.7);
  else if (hall) pitch = Math.max(pitch, 0.45);
  const cap = l.pitches <= 0 ? 0.6 : l.pitches === 1 ? 0.88 : l.pitches === 2 ? 1 : 1.05;
  const buzz = d.buzz * (1 - l.quiet * 0.6);
  const work = Math.max(0, days * (1 - weatherLoss) * (1 - 0.1 * buzz) - tests * 0.4);
  const trainShare = d.marketing >= 0.8 ? 0.45 : 1;
  const gym = gymLevel(l, year), regen = regenLevel(l, year);
  const kE = l.kitchen * kitchenWeight(year);
  const runsOn = p.program ? p.program.pts.kondition >= 3 : focus === 'kondition' || focus === 'ausgewogen';
  const runs = l.runs && runsOn ? RUNS_FIT[l.runs] : 1;
  const alt = lodgingAltitude(d, l);
  const altShare = alt >= 1500 ? 0.45 : alt >= 1000 ? 0.15 : 0;

  const fitTotal = work * (season === 'summer' ? 1.6 : 1.3) * (0.55 + 0.45 * pitch) * trainShare * f.fit
    * (1 + 0.05 * gym) * (1 + 0.05 * kE) * runs;
  const fitness = fitTotal * (alt >= 1500 ? 0.8 : alt >= 1000 ? 0.95 : 1);
  const altitudeFitness = fitTotal * altShare;
  const dev = work * 0.035 * pitch * cap * trainShare * f.dev;
  const devYouth = dev * (f.youth ?? 1);
  const o = OPP[d.opp];
  const formRaw = Math.min(6, work * 0.35 * (0.5 + 0.5 * pitch)) * trainShare * f.form * (0.9 + 0.1 * cap) + tests * o.form + kE * 0.3;
  const comfort = l.tier - 2;
  const morale = clamp((0.2 + days * 0.025 + (d.region === 'sueden' || d.region === 'fern' ? 0.1 : 0) + l.quiet * 0.08 + comfort * 0.04) * f.morale, 0, 0.85);
  const satisfaction = Math.round(2 + comfort * 1.5 + f.sat);
  const starGrumble = l.tier === 1 && rep >= 70 ? 0.2 : l.tier === 1 && rep >= 60 ? 0.08 : 0;
  const injury = 0.0015 * days * (1 + (1 - pitch) * 2.2) * f.inj * (1 - 0.08 * regen) * (1 - 0.04 * gym)
    * (l.runs === 'duenen' && (p.program ? p.program.pts.kondition >= 6 : focus === 'kondition') ? 1.08 : 1) + tests * o.inj;
  const discipline = clamp(l.lure * 0.22 * (1 - l.quiet * 0.5) * f.disc * 0.8, 0, 0.4);
  const disciplineGain = !p.program && focus === 'regeneration' ? 0 : clamp(l.quiet * 0.25 * (1 - l.lure) * (f.discGain ?? 1), 0, 0.4);
  const travelFrische = d.transport === 'flug' ? d.travelH * 1.6 + Math.abs(d.tz) * 3 : d.travelH * (d.transport === 'bus' ? 0.8 : 0.5);
  const travelForm = Math.abs(d.tz) * 0.7 + (d.transport === 'flug' && d.travelH >= 8 ? 1 : 0);
  const campFrische = f.frische + regen * 2 - (alt >= 1500 ? 6 : 0);
  const heal = f.heal > 0 ? days * f.heal * (0.6 + 0.2 * regen) : 0;
  const testIncome = Math.round(d.testIncome * o.income * tests * (0.5 + rep / 100));
  const brandIntl = d.marketing * (year >= 2000 ? 2.5 : 1.2);
  const sponsorBase = Math.round(d.marketing * (year >= 2010 ? 30000 : 10000) * (rep / 80));
  const home = d.region === 'inland' || d.region === 'kueste' || d.region === 'mittelgebirge' || d.country === 'Deutschland';
  const crit = [...(d.criticism ?? [])].reverse().find((c) => c.from <= year);
  const spreadLo = 1 - weatherRisk * 0.6, spreadHi = 1 + weatherRisk * 0.3;
  const form = formRaw - travelForm;
  return {
    fitness: r1(fitness), fitnessLo: r1(fitness * spreadLo), fitnessHi: r1(fitness * spreadHi),
    form: r1(form), formLo: r1(formRaw * spreadLo - travelForm), formHi: r1(formRaw * spreadHi - travelForm),
    dev: Math.round(dev * 100) / 100, devYouth: Math.round(devYouth * 100) / 100,
    morale, satisfaction, starGrumble, injury, discipline, disciplineGain,
    travelFrische: Math.round(travelFrische), travelForm: r1(travelForm), campFrische: Math.round(campFrische), heal: Math.round(heal),
    altitudeFitness: r1(altitudeFitness), altitude: alt,
    testIncome, brandIntl, sponsorBase,
    fanMood: home ? r1(buzz * 1.5) : 0, criticism: crit?.fan ?? 0, criticismText: crit?.text,
    weatherLoss, weatherRisk, pitch,
  };
}

// -----------------------------------------------------------------------------
// KI-Vereine
// -----------------------------------------------------------------------------
export interface AiCampPick { d: CampDestination; l: CampLodging; focus: CampFocus }

/** Schwerpunkt passend zum Trainerstil (KI). */
export function aiCampFocus(campSeason: CampSeason, style: CoachStyle | undefined, philosophy: CoachPhilosophy | undefined, rng: () => number): CampFocus {
  if (philosophy === 'jugend' && rng() < 0.35) return 'jugend';
  const r = rng();
  if (campSeason === 'winter' && r < 0.2) return 'regeneration';
  switch (style) {
    case 'konter': return r < 0.55 ? 'kondition' : r < 0.8 ? 'teamgeist' : 'ausgewogen';
    case 'defensiv': return r < 0.45 ? 'taktik' : r < 0.75 ? 'kondition' : 'ausgewogen';
    case 'offensiv': return r < 0.5 ? 'taktik' : r < 0.7 ? 'teamgeist' : 'ausgewogen';
    default: return r < 0.5 ? 'ausgewogen' : r < 0.7 ? 'kondition' : r < 0.85 ? 'teamgeist' : 'taktik';
  }
}

/**
 * Wahl eines KI-Vereins: das „übliche“ Ziel seiner Größe und Epoche, die Unterkunft nach
 * Kasse und Ansehen, der Schwerpunkt nach Trainerstil. Mit Sponsor-Pflicht nur dieses Ziel.
 */
export function aiCampChoice(
  campSeason: CampSeason, year: number, rep: number, balance: number, scale: number, rng: () => number,
  opts: { style?: CoachStyle; philosophy?: CoachPhilosophy; obligation?: string } = {},
): AiCampPick | null {
  const focus = aiCampFocus(campSeason, opts.style, opts.philosophy, rng);
  const budget = Math.max(0, balance) * 0.04;
  const avail = destinationsFor(campSeason, year, rep, opts.obligation).filter((x) => x.status.ok).map((x) => x.d)
    .filter((d) => lodgingsFor(d.id, year).length);
  if (!avail.length) return null;
  const cheapest = (d: CampDestination) => campCostBase(d, lodgingsFor(d.id, year)[0], 8, rep, focus) * scale;
  const affordable = opts.obligation ? avail : avail.filter((d) => cheapest(d) < budget);
  const pool = affordable.length ? affordable : avail.filter((d) => d.region === 'inland' || d.region === 'mittelgebirge');
  if (!pool.length) return null;
  const weight = (d: CampDestination) => {
    let w = 1;
    if (d.region === 'fern') w = rep >= 80 ? 1.2 : 0.25;
    if (d.region === 'sueden') w = year >= 1985 ? 2.2 / 3 : 0.4;
    if (d.region === 'alpen') w = 2 / 4;
    if (d.region === 'inland') w = (rep < 60 ? 1.5 : 0.4) / 4;
    if (d.region === 'mittelgebirge') w = (rep < 60 ? 1 : 0.3) / 3;
    if (d.region === 'kueste') w = (year < 1990 ? 0.8 : 0.3) / 2;
    // Winter: Ab Mitte der 80er zieht es die Profis in den Süden (Kanaren [C2], ab 1992 Türkei [C3]).
    const home = d.region === 'inland' || d.region === 'mittelgebirge' || d.region === 'kueste';
    if (campSeason === 'winter' && home) w *= year >= 1995 ? 0.12 : year >= 1985 ? 0.3 : 1;
    if (d.id === 'tegernsee') w *= 2;
    if (d.id === 'tuerkei' && year >= 1998 && year <= 2016) w *= 6; // Belek-Boom [C3]
    if ((d.id === 'spanien' || d.id === 'lamanga') && year >= 2017) w *= 3; // Rückkehr nach Spanien [C7]
    if (d.id === 'kanaren' && year < 1992) w *= 3; // 80er: meist Kanaren [C2]
    if (d.id === 'engadin' && focus === 'kondition') w *= 1.5;
    if (d.criticism?.some((c) => c.from <= year && c.fan >= 3)) w *= 0.3;
    return w;
  };
  const total = pool.reduce((s, d) => s + weight(d), 0);
  let r = rng() * total;
  let d = pool[pool.length - 1];
  for (const x of pool) { r -= weight(x); if (r <= 0) { d = x; break; } }
  // Unterkunft: größere Vereine wohnen komfortabler, sofern die Kasse reicht.
  const ls = lodgingsFor(d.id, year);
  const fits = ls.filter((l) => campCostBase(d, l, 8, rep, focus) * scale < budget * 1.2);
  const choice = fits.length ? fits : [ls[0]];
  const wantTier = rep >= 80 ? 4 : rep >= 68 ? 3 : rep >= 55 ? 2 : 1;
  const l = [...choice].sort((a, b) => Math.abs(a.tier - wantTier) - Math.abs(b.tier - wantTier) || (rng() - 0.5))[0];
  return { d, l, focus };
}

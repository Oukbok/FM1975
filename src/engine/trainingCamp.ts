// =============================================================================
// TRAININGSLAGER – Rechenlogik (ohne Spielstand): Verfügbarkeit je Epoche,
// Kosten, erwartete Wirkung. Ziele/Quellen in data/campDestinations.ts.
// =============================================================================
import { CAMP_DESTINATIONS, CampDestination } from '../data/campDestinations';
import type { CampSeason } from '../game/winterShared';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const CAMP_MIN_DAYS = 5;
export const CAMP_MAX_DAYS = 14;
/** Buchung mindestens so viele Tage im Voraus. */
export const CAMP_LEAD_DAYS = 7;
/** Kurzfristig (< 21 Tage vorher) kostet 20 % Aufschlag. */
export const CAMP_SHORT_NOTICE_DAYS = 21;
export const CAMP_SHORT_NOTICE_SURCHARGE = 0.2;
/** Storno: 50 % werden erstattet. */
export const CAMP_REFUND = 0.5;

/** Kalenderjahr, nach dem ein Lager historisch eingeordnet wird (Winter = Januar-Jahr). */
export function campYear(season: string, campSeason: CampSeason): number {
  const y0 = parseInt(season.slice(0, 4), 10);
  return campSeason === 'winter' ? y0 + 1 : y0;
}

export interface CampStatus { ok: boolean; reason?: string }

/** Ist ein Ziel in diesem Jahr für einen Verein mit diesem Ansehen buchbar? */
export function destinationStatus(d: CampDestination, campSeason: CampSeason, year: number, rep: number): CampStatus {
  if (!d.seasons.includes(campSeason)) return { ok: false, reason: campSeason === 'winter' ? 'nur im Sommer' : 'nur im Winter' };
  const first = d.access[0];
  if (year < first.from) return { ok: false, reason: `erst ab ${first.from}` };
  if (d.closed?.includes(year)) return { ok: false, reason: `${year}: Reisebeschränkungen (Corona)` };
  const acc = [...d.access].reverse().find((a) => a.from <= year)!;
  if (rep < acc.minRep) {
    const next = d.access.find((a) => a.from > year && a.minRep <= rep);
    return { ok: false, reason: `nur für Spitzenvereine (Ansehen ≥ ${acc.minRep})${next ? `, für euch ab ${next.from}` : ''}` };
  }
  return { ok: true };
}

/** Alle Ziele mit Status (für Seite, KI und Test). */
export function destinationsFor(campSeason: CampSeason, year: number, rep: number): { d: CampDestination; status: CampStatus }[] {
  return CAMP_DESTINATIONS.filter((d) => d.seasons.includes(campSeason)).map((d) => ({ d, status: destinationStatus(d, campSeason, year, rep) }));
}

/** Größe des Trosses / Hotelklasse nach Ansehen (0,85 … 1,2). */
export function entourageFactor(rep: number): number {
  return clamp(0.85 + (rep - 50) / 115, 0.85, 1.2);
}

/** Kosten in 1975-Basis (ohne Kurzfrist-Aufschlag). */
export function campCostBase(d: CampDestination, days: number, rep: number): number {
  return Math.round((d.travel + d.costDay * days) * entourageFactor(rep) / 100) * 100;
}

export interface CampOutlook {
  /** Fitness-Aufbau je Spieler (Punkte). */
  fitness: number;
  /** Form-Zuwachs je Spieler. */
  form: number;
  /** Entwicklungspunkte je Spieler (Taktik/Technik-Einheiten). */
  dev: number;
  /** Wahrscheinlichkeit je Spieler, eine Moral-Stufe zu steigen (Mannschaftsgefüge). */
  morale: number;
  /** Verletzungsrisiko je Spieler über das ganze Lager. */
  injury: number;
  /** Reisestrapazen bei Rückkehr: Frische-Abzug und Form-Abzug. */
  travelFrische: number;
  travelForm: number;
  /** Erlös der Testspiele (1975-Basis). */
  testIncome: number;
  /** Marketing (internationale Marke +, Sponsoring-Erlös in 1975-Basis). */
  brandIntl: number;
  sponsorBase: number;
  /** Fan-Kritik (Abzug Fan-Stimmung) + Begründung. */
  criticism: number;
  criticismText?: string;
  /** Wetterrisiko (Anteil ausfallender Einheiten im Mittel). */
  weatherLoss: number;
}

/** Erwartete Wirkung eines Lagers. */
export function campOutlook(d: CampDestination, campSeason: CampSeason, days: number, tests: number, year: number, rep: number): CampOutlook {
  const si = campSeason === 'summer' ? 0 : 1;
  const pitch = d.pitch[si];
  const weather = d.weather[si];
  const weatherLoss = weather * 0.5;
  const work = days * (1 - weatherLoss);
  // Marketingreisen: viel Programm, wenig Training.
  const trainShare = d.marketing >= 0.8 ? 0.45 : 1;
  const fitness = work * (campSeason === 'summer' ? 1.6 : 1.3) * (0.55 + 0.45 * pitch) * trainShare;
  const dev = work * 0.035 * pitch * trainShare;
  const form = Math.min(6, work * 0.35 * (0.5 + 0.5 * pitch)) * trainShare + tests * 0.4;
  const morale = clamp(0.2 + days * 0.025 + (d.region === 'inland' ? 0 : 0.1), 0, 0.65);
  const injury = 0.0015 * days * (1 + (1 - pitch) * 2.2) + tests * 0.004;
  const travelFrische = d.flightH * 1.6 + Math.abs(d.tz) * 3;
  const travelForm = Math.abs(d.tz) * 0.7 + (d.flightH >= 8 ? 1 : 0);
  const testIncome = Math.round(d.testIncome * tests * (0.5 + rep / 100));
  const brandIntl = d.marketing * (year >= 2000 ? 2.5 : 1.2);
  const sponsorBase = Math.round(d.marketing * (year >= 2010 ? 30000 : 10000) * (rep / 80));
  const crit = [...(d.criticism ?? [])].reverse().find((c) => c.from <= year);
  return {
    fitness: Math.round(fitness * 10) / 10, form: Math.round(form * 10) / 10, dev: Math.round(dev * 100) / 100,
    morale, injury, travelFrische: Math.round(travelFrische), travelForm: Math.round(travelForm * 10) / 10,
    testIncome, brandIntl, sponsorBase, criticism: crit?.fan ?? 0, criticismText: crit?.text, weatherLoss,
  };
}

/**
 * Wahl eines KI-Vereins: das „übliche“ Ziel seiner Größe und Epoche. Größere Vereine
 * reisen weiter; knappe Kassen führen in die Sportschule.
 */
export function aiCampChoice(campSeason: CampSeason, year: number, rep: number, balance: number, scale: number, rng: () => number): CampDestination | null {
  const opts = destinationsFor(campSeason, year, rep).filter((x) => x.status.ok).map((x) => x.d);
  if (!opts.length) return null;
  const affordable = opts.filter((d) => campCostBase(d, 8, rep) * scale < Math.max(0, balance) * 0.04);
  const pool = affordable.length ? affordable : opts.filter((d) => d.region === 'inland');
  if (!pool.length) return null;
  const weight = (d: CampDestination) => {
    let w = 1;
    if (d.region === 'fern') w = rep >= 80 ? 1.2 : 0.25;
    if (d.region === 'sueden') w = year >= 1985 ? 2.2 : 1;
    if (d.region === 'alpen') w = 2;
    if (d.region === 'inland') w = rep < 60 ? 1.5 : 0.4;
    if (d.id === 'tuerkei' && year >= 1998 && year <= 2016) w *= 2.5; // Belek-Boom [C3]
    if (d.id === 'spanien' && year >= 2017) w *= 2.5; // Rückkehr nach Spanien [C7]
    if (d.criticism?.some((c) => c.from <= year && c.fan >= 3)) w *= 0.3;
    return w;
  };
  const total = pool.reduce((s, d) => s + weight(d), 0);
  let r = rng() * total;
  for (const d of pool) { r -= weight(d); if (r <= 0) return d; }
  return pool[pool.length - 1];
}

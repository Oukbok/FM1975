// =============================================================================
// FOOTBALL MANAGER 1980 — Finanz-Engine
// =============================================================================
// Bucht Einnahmen und Ausgaben fortlaufend über die Saison und schreibt den
// Kontostand real fort. Alle Beträge in Deutscher Mark (DM), Größenordnungen
// der Ära 1980/81 (keine modernen Millionenbeträge).
//
// EINNAHMEN
//   • Stadioneinnahmen  = Zuschauer × Ticketpreis   (pro Heimspiel)
//   • Fanartikel        = Zuschauer × ProKopf(rep,Erfolg) (pro Heimspiel)
//   • TV-/Mediengelder  = kleiner Pauschalbetrag je Heimspiel (Ära-gerecht)
//   • Sponsoring        = monatlicher Pauschalbetrag (rep-abhängig)
//   • Prämien           = Siegprämie / Remisprämie + Platzierungsbonus (monatl.)
//   • Transfererlöse    = Spielerverkäufe (siehe transfers.ts → bookTransfer)
//
// AUSGABEN
//   • Spielergehälter   = Summe Kader-Wochengehälter × 4.33  (monatlich)
//   • Betreuerstab      = ~18 % der Spielergehälter          (monatlich)
//   • Stadionunterhalt  = Kapazität × Faktor                 (monatlich)
//   • Trainingsbetrieb  = Anlagenqualität × Faktor           (monatlich)
//   • Sonstige Fixkosten= Reputation × Faktor                (monatlich)
//   • Transferausgaben  = Spielerkäufe (siehe transfers.ts → bookTransfer)
// =============================================================================

import { vipIncome } from './clubBusiness';
import { ticketFactor } from './stadiumBlocks';
import {
  Club, Player, MatchResult, ClubFinances, FinanceCategory, FinanceTransaction, LeagueTable,
  CateringMode, SponsorOffer,
} from '../types';
import { facilityUpkeep } from './infrastructure';
import { economyScale, revenueScale, yearOf } from './economy';
import { commercialMultiplier } from './clubEconomy';

/**
 * Finanzen 2.0: Skalierung je Erlösart aus dem Buchungsdatum. Stadion-Erlöse wachsen
 * langsamer als der Gesamtmarkt, Vermarktung (× Marke) schneller; TV läuft zentral
 * über engine/clubEconomy.ts (monatliche Rate aus `finances.tvAnnual`).
 */
function scalesFor(club: Club, date: string) {
  const y = yearOf(date);
  return {
    base: economyScale(y),
    matchday: revenueScale('matchday', y),
    commercial: revenueScale('commercial', y) * commercialMultiplier(club, y),
    // Fanartikel: an Stadionbesucher gekoppelt, mit der Marke wachsend.
    merch: revenueScale('matchday', y) * commercialMultiplier(club, y),
  };
}

let txCounter = 0;
function txId(): string {
  txCounter += 1;
  return `tx-${Date.now().toString(36)}-${txCounter}`;
}

/** Zuordnung Kategorie → Einnahmen-Bucket. */
const INCOME_BUCKET: Partial<Record<FinanceCategory, keyof ClubFinances['income']>> = {
  ticket_sales: 'ticketSales',
  tv_money: 'tvMoney',
  sponsorship: 'sponsorship',
  merchandise: 'merchandise',
  transfer_income: 'transferIncome',
  prize_money: 'prizeMoney',
  catering: 'catering',
  advertising: 'advertising',
  commercial: 'commercial',
  membership: 'membership',
  matchday: 'matchday',
  other: 'other',
};

/** Zuordnung Kategorie → Ausgaben-Bucket. */
const EXPENSE_BUCKET: Partial<Record<FinanceCategory, keyof ClubFinances['expenses']>> = {
  wages: 'wages',
  transfer_expense: 'transferExpense',
  stadium_maintenance: 'stadiumMaintenance',
  training_facilities: 'trainingFacilities',
  staff_wages: 'staffWages',
  facilities: 'facilities',
  other: 'other',
};

// -----------------------------------------------------------------------------
// Catering / Wuerstchenbuden — Tabellen (1975-DM-Basis, era-skaliert bei Buchung)
// -----------------------------------------------------------------------------

/**
 * Netto-Erloes je Besucher (DM, 1975-Basis) je Betriebsform & Stufe (1..5).
 * Eigenbetrieb = hoechster Pro-Kopf-Erloes; Verpachtung = niedrigster.
 */
export const CATERING_NETPERHEAD: Record<CateringMode, number[]> = {
  eigenbetrieb: [0, 0.60, 0.85, 1.10, 1.35, 1.60],
  umsatz: [0, 0.45, 0.62, 0.80, 0.98, 1.18],
  verpachtung: [0, 0.20, 0.28, 0.36, 0.44, 0.52],
};

/** Feste Monatspacht (DM, 1975-Basis) — nur bei Verpachtung (Index=Stufe 1..5). */
export const CATERING_LEASE = [0, 4000, 6000, 8000, 11000, 14000];

/** Monatliche Fixkosten der Catering-Einrichtung je Betriebsform & Stufe (1..5). */
export const CATERING_UPKEEP: Record<CateringMode, number[]> = {
  eigenbetrieb: [0, 3000, 4500, 6500, 9000, 12000],
  umsatz: [0, 1500, 2200, 3000, 4200, 5500],
  verpachtung: [0, 800, 1100, 1500, 2000, 2600],
};

function clampCateringLevel(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

/** Netto-Catering-Erloes eines Heimspiels (bereits era-skaliert). */
export function cateringMatchIncome(club: Club, attendance: number, scale = 1): number {
  const mode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const level = clampCateringLevel(club.infrastructure?.catering ?? 1);
  return Math.round(attendance * CATERING_NETPERHEAD[mode][level] * scale);
}

/**
 * Erwartete Auslastungsrate bei gegebenem Ticketpreis (Elastizitaets-Vorschau, ohne Zufall).
 * Spiegelt match.ts `estimateAttendance` ohne den +/-0.10-Zufallsterm.
 */
export function expectedAttendanceRate(club: Club, ticketPrice?: number): number {
  const baseRate = club.stadium.averageAttendanceRate ?? 0.7;
  const price = ticketPrice ?? club.stadium.ticketPrice ?? 14;
  const refPrice = Math.round(8 + club.reputation * 0.12);
  const priceFactor = Math.max(0.6, Math.min(1.15, 1 - ((price - refPrice) / refPrice) * 0.5));
  return Math.max(0.3, Math.min(1.0, baseRate * priceFactor));
}

/** Erwartete Zuschauerzahl bei gegebenem Ticketpreis (Vorschau). */
export function expectedAttendance(club: Club, ticketPrice?: number): number {
  return Math.round(club.stadium.capacity * expectedAttendanceRate(club, ticketPrice));
}

/** Programmhefte & sonstige Spieltagserloese eines Heimspiels (era-skaliert). */
export function matchdayIncome(attendance: number, scale = 1): number {
  return Math.round(attendance * 0.25 * scale);
}

// -----------------------------------------------------------------------------
// Vertrags-Angebotsgeneratoren (Trikot & Banden) — 1975-DM-Basis
// -----------------------------------------------------------------------------

/** Historische Trikot-Anker (1975-DM/Jahr). */
export const SHIRT_TIERS = [
  { label: 'Regional', tier: 100000 },
  { label: 'National', tier: 275000 },
  { label: 'Premium', tier: 500000 },
];

const SHIRT_SPONSOR_NAMES = [
  'Adler Bekleidung', 'Nordsee Versicherung', 'Rheinmetall', 'Bavaria Bräu',
  'Hansa Elektro', 'Merkur Bank', 'Continental Reifen', 'Salamander',
  'Weltmarke Kaffee', 'Union Möbel', 'Phoenix Chemie', 'Sonnen Molkerei',
];
const BANDEN_PARTNER_NAMES = [
  'Regio Werbung', 'Plakat & Co.', 'Stadion-Marketing GmbH', 'Fortuna Media',
  'City Reklame', 'Panorama Werbung', 'Arena Promotion',
];

/** Deterministischer Zufall aus einem String-Seed. */
function seedRand(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const round5000 = (n: number) => Math.round(n / 5000) * 5000;

/**
 * Erzeugt 2–3 Trikotsponsoring-Angebote (1975-DM/Jahr) abhaengig von Reputation.
 * `annual = tier * (0.85 + reputation/100 * 0.4)`, gerundet auf 5.000; Laufzeit 1–5 J.
 */
export function generateShirtOffers(club: Club, seasonSeed: string): SponsorOffer[] {
  const rnd = seedRand(`${club.id}-shirt-${seasonSeed}`);
  const rep = club.reputation;
  const factor = 0.85 + (rep / 100) * 0.4;
  // Tier-Auswahl nach Reputation: kleine Vereine Regional/National, grosse National/Premium.
  const tiers = rep >= 78 ? [275000, 500000, 275000] : rep >= 62 ? [275000, 100000, 275000] : [100000, 100000, 275000];
  const count = rnd() > 0.5 ? 3 : 2;
  const offers: SponsorOffer[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = SHIRT_SPONSOR_NAMES[Math.floor(rnd() * SHIRT_SPONSOR_NAMES.length)];
    while (usedNames.has(name)) name = SHIRT_SPONSOR_NAMES[Math.floor(rnd() * SHIRT_SPONSOR_NAMES.length)];
    usedNames.add(name);
    const variance = 0.9 + rnd() * 0.25;
    const annual = round5000(tiers[i] * factor * variance);
    const years = 1 + Math.floor(rnd() * 5);
    offers.push({ name, annualValue: annual, years });
  }
  return offers.sort((a, b) => b.annualValue - a.annualValue);
}

/**
 * Banden-Grundwert (1975-DM/Jahr): `base = 80.000 + capacity/1000*1500 + reputation*800`,
 * gedeckelt auf 300.000, Boden 100.000.
 */
export function bandenBaseValue(club: Club): number {
  const cap = club.stadium?.capacity ?? 30000;
  const base = 80000 + (cap / 1000) * 1500 + club.reputation * 800;
  return Math.max(100000, Math.min(300000, base));
}

/** Erzeugt 2–3 Banden-Angebote (1975-DM/Jahr), Laufzeit 1–3 J. */
export function generateBandenOffers(club: Club, seasonSeed: string): SponsorOffer[] {
  const rnd = seedRand(`${club.id}-banden-${seasonSeed}`);
  const base = bandenBaseValue(club);
  const count = rnd() > 0.5 ? 3 : 2;
  const offers: SponsorOffer[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = BANDEN_PARTNER_NAMES[Math.floor(rnd() * BANDEN_PARTNER_NAMES.length)];
    while (usedNames.has(name)) name = BANDEN_PARTNER_NAMES[Math.floor(rnd() * BANDEN_PARTNER_NAMES.length)];
    usedNames.add(name);
    const variance = 0.88 + rnd() * 0.28;
    const annual = Math.max(100000, Math.min(300000, round5000(base * variance)));
    const years = 1 + Math.floor(rnd() * 3);
    offers.push({ name, annualValue: annual, years });
  }
  return offers.sort((a, b) => b.annualValue - a.annualValue);
}

/**
 * Zentrale Buchung. amount > 0 = Einnahme, amount < 0 = Ausgabe.
 * `trackDetail` legt die Einzelbuchung in der Historie ab (nur Manager-Verein,
 * damit Speicherstände nicht unbegrenzt wachsen).
 */
export function book(
  fin: ClubFinances,
  date: string,
  amount: number,
  category: FinanceCategory,
  description: string,
  trackDetail: boolean,
): void {
  fin.balance += amount;
  if (amount >= 0) {
    const k = INCOME_BUCKET[category];
    if (k) fin.income[k] += amount;
  } else {
    const k = EXPENSE_BUCKET[category];
    if (k) fin.expenses[k] += -amount;
  }
  if (trackDetail) {
    const tx: FinanceTransaction = { id: txId(), date, amount, category, description };
    fin.transactions.unshift(tx);
    if (fin.transactions.length > 400) fin.transactions.length = 400;
  }
}

/** Summe der Wochengehälter des aktuellen Kaders (DM/Woche). */
export function weeklyWageBill(club: Club, players: Record<string, Player>): number {
  return club.playerIds.reduce((s, id) => s + (players[id]?.contract.weeklyWage ?? 0), 0);
}

// Multiplikator des Fanshops je Ausbaustufe (Spiegel von
// infrastructure.merchandisingFactor — hier inline, um einen Import-Zyklus mit
// infrastructure.ts zu vermeiden).
const MERCH_FACTOR = [1, 1, 1.15, 1.3, 1.5, 1.75];

/** Fanartikel-Erlös pro Kopf (DM) — steigt mit Reputation und Fanshop-Ausbau. */
function merchPerHead(club: Club): number {
  const base = 2 + (club.reputation / 100) * 4; // ~2–6 DM je Zuschauer
  const lvl = Math.max(0, Math.min(5, Math.round(club.infrastructure?.merchandising ?? 1)));
  return base * MERCH_FACTOR[lvl];
}

/**
 * Bucht die Einnahmen eines Heimspiels (Stadion, Fanartikel, TV) sowie die
 * Sieg-/Remisprämie beider Vereine. `result.attendance` liefert die reale
 * Zuschauerzahl der Match-Engine.
 */
export function bookHomeMatch(
  club: Club,
  result: MatchResult,
  isHome: boolean,
  won: boolean,
  drawn: boolean,
  date: string,
  trackDetail: boolean,
  scale = 1,
): void {
  const fin = club.finances;
  if (isHome) {
    const sc = scalesFor(club, date);
    const attendance = result.attendance;
    const ticket = Math.round(attendance * club.stadium.ticketPrice * ticketFactor(club) * sc.matchday);
    const merch = Math.round(attendance * merchPerHead(club) * sc.merch);
    const catering = cateringMatchIncome(club, attendance, sc.matchday);
    const matchday = matchdayIncome(attendance, sc.matchday);
    book(fin, date, ticket, 'ticket_sales', `Stadioneinnahmen (${attendance.toLocaleString('de-DE')} Zuschauer)`, trackDetail);
    book(fin, date, merch, 'merchandise', `Fanartikel-Verkauf (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
    // TV-Gelder: zentral vermarktet, monatliche Rate (bookMonthly).
    if (!fin.tvAnnual) {
      // Alte Spielstände ohne TV-Verteilung: bisherige Heimspiel-Pauschale.
      book(fin, date, Math.round((20000 + club.reputation * 400) * scale), 'tv_money', 'TV- und Mediengelder (Heimspiel)', trackDetail);
    }
    if (catering > 0) book(fin, date, catering, 'catering', `Catering / Wuerstchenbuden (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
    if (matchday > 0) book(fin, date, matchday, 'matchday', `Programmhefte & Spieltagserloese (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
    const vip = vipIncome(club, sc.matchday, Number(date.slice(0, 4)));
    if (vip > 0) book(fin, date, vip, 'commercial', `Logen & VIP-Bereich (${club.stadium.vipBoxes} Logen)`, trackDetail);
  }
  // Leistungsprämie (2-Punkte-Ära: bescheiden)
  const bonus = Math.round((won ? 25000 + club.reputation * 200 : drawn ? 8000 : 0) * scale);
  if (bonus > 0) {
    book(fin, date, bonus, 'prize_money', won ? 'Siegprämie' : 'Prämie für Unentschieden', trackDetail);
  }
}

/**
 * Bucht die Stadioneinnahmen eines Landespokal-Heimspiels (Ticket, Fanartikel,
 * TV). Anders als in der Liga gibt es KEINE Leistungsprämie an dieser Stelle —
 * das Preisgeld pro Runde wird separat über {@link bookCupPrize} gebucht.
 */
export function bookCupHomeMatch(
  club: Club,
  result: MatchResult,
  date: string,
  trackDetail: boolean,
  scale = 1,
): void {
  const fin = club.finances;
  const sc = scalesFor(club, date);
  const attendance = result.attendance;
  const ticket = Math.round(attendance * club.stadium.ticketPrice * ticketFactor(club) * sc.matchday);
  const merch = Math.round(attendance * merchPerHead(club) * sc.merch);
  // Pokal-TV: Übertragungsrechte je Spiel (wächst mit dem TV-Markt).
  const tv = Math.round((25000 + club.reputation * 500) * revenueScale('tv', yearOf(date)) * (scale > 0 ? 1 : 0));
  const catering = cateringMatchIncome(club, attendance, sc.matchday);
  const matchday = matchdayIncome(attendance, sc.matchday);
  book(fin, date, ticket, 'ticket_sales', `Pokal-Stadioneinnahmen (${attendance.toLocaleString('de-DE')} Zuschauer)`, trackDetail);
  book(fin, date, merch, 'merchandise', `Fanartikel-Verkauf Pokalspiel (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
  book(fin, date, tv, 'tv_money', 'TV- und Mediengelder (Pokalspiel)', trackDetail);
  if (catering > 0) book(fin, date, catering, 'catering', `Catering Pokalspiel (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
  if (matchday > 0) book(fin, date, matchday, 'matchday', `Programmhefte Pokalspiel (${attendance.toLocaleString('de-DE')} Besucher)`, trackDetail);
}

/** Bucht das rundenabhängige Landespokal-Preisgeld (Einnahme, in DM). */
export function bookCupPrize(
  club: Club,
  amount: number,
  roundName: string,
  date: string,
  trackDetail: boolean,
): void {
  if (amount <= 0) return;
  // Prämien liegen in 1975-Basis vor (Preisschild) → nominal buchen.
  const nominal = Math.round(amount * economyScale(yearOf(date)));
  book(club.finances, date, nominal, 'prize_money', `Landespokal-Prämie (${roundName})`, trackDetail);
}

/** Monatliche Fixkosten & Erträge eines Vereins (aufgeschlüsselt). */
export interface MonthlyBooking {
  wages: number;
  staffWages: number;
  stadiumMaintenance: number;
  /** Summe aller Gebaeude-Fixkosten (inkl. Catering), ersetzt trainingFacilities. */
  facilities: number;
  otherFixed: number;
  /** Trikotsponsoring-Monatsrate. */
  sponsorship: number;
  /** Bandenwerbe-Monatsrate. */
  advertising: number;
  /** Mitgliedsbeitraege (Monat). */
  membership: number;
  /** Catering-Pacht (nur bei Verpachtung). */
  cateringLease: number;
  /** Zentrale TV-Vermarktung (Monatsrate). */
  tv: number;
  /** Vermarktung & Hospitality (Monatsrate). */
  commercial: number;
  placementBonus: number;
  net: number;
}

/**
 * Berechnet die monatlichen Posten (ohne zu buchen) — auch für die Prognose.
 * `scale` ist die jährlich steigende Wirtschafts-Basis (1975 ≈ 1, 2030 ≈ 130):
 * Sponsoring, Boni UND die kostenseitigen Fixposten wachsen gemeinsam, sodass
 * das gesamte Finanz-Niveau des Fußballs über die Jahrzehnte real ansteigt.
 * Die Beträge bleiben nominal in DM; die Anzeige rechnet ära-gerecht in DM/EUR um.
 */
export function computeMonthly(
  club: Club,
  players: Record<string, Player>,
  table?: LeagueTable,
  scale = 1,
  year?: number,
): MonthlyBooking {
  // Vermarktungs-Skala (Finanzen 2.0): mit Jahr nach Erlös-Mix × Marke, sonst wie bisher.
  const commScale = year != null ? revenueScale('commercial', year) * commercialMultiplier(club, year) : scale;
  const weekly = weeklyWageBill(club, players);
  const wages = Math.round(weekly * 4.33 * scale);
  const staffWages = Math.round(wages * 0.18);
  const stadiumMaintenance = Math.round((club.stadium.capacity * 0.9 + (100 - club.stadium.condition) * 800) * scale);
  // Gebaeude-Fixkosten ersetzen den alten trainingFacilities-Pauschalposten.
  const facilities = facilityUpkeep(club, scale);
  const otherFixed = Math.round((6000 + club.reputation * 500) * scale);

  // Trikotsponsoring (nur aus aktivem Vertrag).
  const sponsorship = club.commerce?.shirtSponsor
    ? Math.round((club.commerce.shirtSponsor.annualValue / 12) * commScale) : 0;
  // Bandenwerbung (nur aus aktivem Vertrag).
  const advertising = club.commerce?.banden
    ? Math.round((club.commerce.banden.annualValue / 12) * commScale) : 0;
  const tv = Math.round((club.finances.tvAnnual ?? 0) / 12);
  const commercial = Math.round((club.finances.commercialAnnual ?? 0) / 12);
  // Mitgliedsbeitraege.
  // Mitglieder (eigener Verein, Vereinsumfeld) × Jahresbeitrag 40 DM (1975-Basis); sonst Schätzung über den Ruf.
  const membershipYear = Math.round((club.members ? club.members * 40 : 30000 + club.reputation * 1000) * scale);
  const membership = Math.round(membershipYear / 12);
  // Catering-Pacht nur bei Verpachtung.
  const cLevel = Math.max(1, Math.min(5, Math.round(club.infrastructure?.catering ?? 1)));
  const cateringLease = (club.commerce?.cateringMode ?? 'verpachtung') === 'verpachtung'
    ? Math.round(CATERING_LEASE[cLevel] * scale) : 0;

  // Platzierungsbonus vom Sponsor (monatlich, je besser die Tabellenposition)
  let placementBonus = 0;
  if (table) {
    const row = table.rows.find((r) => r.clubId === club.id);
    if (row) {
      if (row.position <= 3) placementBonus = 30000;
      else if (row.position <= 6) placementBonus = 15000;
      else if (row.position <= 10) placementBonus = 6000;
    }
  }
  placementBonus = Math.round(placementBonus * scale);
  const net = sponsorship + advertising + membership + cateringLease + tv + commercial + placementBonus
    - wages - staffWages - stadiumMaintenance - facilities - otherFixed;
  return { wages, staffWages, stadiumMaintenance, facilities, otherFixed, sponsorship, advertising, membership, cateringLease, tv, commercial, placementBonus, net };
}

/** Bucht den Monatsabschluss (Gehälter, Fixkosten, Sponsoring, Platzierungsbonus). */
export function bookMonthly(
  club: Club,
  players: Record<string, Player>,
  date: string,
  table: LeagueTable | undefined,
  trackDetail: boolean,
  scale = 1,
): MonthlyBooking {
  const m = computeMonthly(club, players, table, scale, yearOf(date));
  const fin = club.finances;
  fin.currentWageBill = weeklyWageBill(club, players);
  // Einnahmen
  if (m.sponsorship > 0) book(fin, date, m.sponsorship, 'sponsorship', 'Trikotsponsoring (Monatsrate)', trackDetail);
  if (m.advertising > 0) book(fin, date, m.advertising, 'advertising', 'Bandenwerbung (Monatsrate)', trackDetail);
  if (m.membership > 0) book(fin, date, m.membership, 'membership', 'Mitgliedsbeitraege (Monat)', trackDetail);
  if (m.cateringLease > 0) book(fin, date, m.cateringLease, 'catering', 'Catering-Pacht (Monat)', trackDetail);
  if (m.tv > 0) book(fin, date, m.tv, 'tv_money', 'TV-Gelder (zentrale Vermarktung)', trackDetail);
  if (m.commercial > 0) book(fin, date, m.commercial, 'commercial', 'Vermarktung & Hospitality (Monat)', trackDetail);
  if (m.placementBonus > 0) book(fin, date, m.placementBonus, 'prize_money', 'Sponsor-Platzierungsbonus', trackDetail);
  // Ausgaben
  book(fin, date, -m.wages, 'wages', 'Spielergehälter (Monat)', trackDetail);
  book(fin, date, -m.staffWages, 'staff_wages', 'Gehälter Betreuerstab (Monat)', trackDetail);
  book(fin, date, -m.stadiumMaintenance, 'stadium_maintenance', 'Stadionunterhalt (Monat)', trackDetail);
  book(fin, date, -m.facilities, 'facilities', 'Gebaeude-Fixkosten (Monat)', trackDetail);
  book(fin, date, -m.otherFixed, 'other', 'Sonstige Betriebskosten (Monat)', trackDetail);

  if (trackDetail) {
    if (!fin.balanceHistory) fin.balanceHistory = [];
    fin.balanceHistory.push({ date, balance: Math.round(fin.balance) });
    if (fin.balanceHistory.length > 24) fin.balanceHistory.shift();
  }
  fin.lastMonthlyBooking = date.slice(0, 7);
  return m;
}

/** Bucht einen abgeschlossenen Transfer (Kauf = Ausgabe, Verkauf = Einnahme). */
export function bookTransfer(
  club: Club,
  amount: number,
  isPurchase: boolean,
  playerName: string,
  date: string,
  trackDetail: boolean,
): void {
  // Ablösen sind Preisschilder in 1975-Basis → nominal zum Transferdatum buchen.
  const nominal = Math.round(Math.abs(amount) * economyScale(yearOf(date)));
  if (isPurchase) {
    book(club.finances, date, -nominal, 'transfer_expense', `Transfer: Verpflichtung ${playerName}`, trackDetail);
  } else {
    book(club.finances, date, nominal, 'transfer_income', `Transfer: Abgang ${playerName}`, trackDetail);
  }
}

/** Gesamt-Einnahmen der Saison bislang (DM). */
export function totalIncome(fin: ClubFinances): number {
  const i = fin.income;
  return i.ticketSales + i.tvMoney + i.sponsorship + i.merchandise + i.transferIncome + i.prizeMoney
    + (i.catering ?? 0) + (i.advertising ?? 0) + (i.commercial ?? 0) + (i.membership ?? 0) + (i.matchday ?? 0) + i.other;
}

/** Gesamt-Ausgaben der Saison bislang (DM). */
export function totalExpense(fin: ClubFinances): number {
  const e = fin.expenses;
  return e.wages + e.transferExpense + e.stadiumMaintenance + e.trainingFacilities
    + (e.facilities ?? 0) + e.staffWages + e.other;
}

/** Prognose bis Saisonende. */
export interface Forecast {
  monthsRemaining: number;
  homeMatchesRemaining: number;
  projectedIncome: number;
  projectedExpense: number;
  projectedEndBalance: number;
}

/**
 * Hochrechnung des Kontostands bis Saisonende:
 *  - Monatliche Fixkosten/Erträge × verbleibende Monate
 *  - Erwartete Heimspiel-Einnahmen × verbleibende Heimspiele
 */
export function forecastSeasonEnd(
  club: Club,
  players: Record<string, Player>,
  table: LeagueTable | undefined,
  currentDate: string,
  seasonEndDate: string,
  homeMatchesRemaining: number,
): Forecast {
  const now = new Date(currentDate + 'T00:00:00Z');
  const end = new Date(seasonEndDate + 'T00:00:00Z');
  const days = Math.max(0, (end.getTime() - now.getTime()) / 86400000);
  const monthsRemaining = Math.max(0, Math.round((days / 30.4) * 10) / 10);

  const m = computeMonthly(club, players, table);
  const monthlyNet = m.net;

  // Erwartete Einnahme je Heimspiel (Ticket + Catering + Fanartikel + Matchday + TV)
  const expAtt = Math.round(club.stadium.capacity * club.stadium.averageAttendanceRate);
  const perHome = Math.round(
    expAtt * club.stadium.ticketPrice * ticketFactor(club)
    + cateringMatchIncome(club, expAtt, 1)
    + expAtt * merchPerHead(club)
    + matchdayIncome(expAtt, 1)
    + 20000 + club.reputation * 400,
  );

  const projectedFixedNet = Math.round(monthlyNet * monthsRemaining);
  const projectedHome = perHome * homeMatchesRemaining;
  const projectedEndBalance = Math.round(club.finances.balance + projectedFixedNet + projectedHome);

  const projectedIncome = Math.round(
    (m.sponsorship + m.advertising + m.membership + m.cateringLease + m.tv + m.commercial + m.placementBonus) * monthsRemaining + projectedHome,
  );
  const projectedExpense = Math.round(
    (m.wages + m.staffWages + m.stadiumMaintenance + m.facilities + m.otherFixed) * monthsRemaining,
  );

  return { monthsRemaining, homeMatchesRemaining, projectedIncome, projectedExpense, projectedEndBalance };
}

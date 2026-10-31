// =============================================================================
// PLATZKATEGORIEN — Nachfrage, Preise, Verkauf je Heimspiel (alle Vereine)
// -----------------------------------------------------------------------------
// Sieben Kategorien (data/seatingCatalog.ts): Steh, Sitz offen, Sitz überdacht,
// Premium, Business, Logen, Gästeblock. Jede hat einen eigenen Preis und eine
// eigene, unabhängige Nachfrage:
//   Fans    G = Potenzial × Zuspruch × Nachfrage der Epoche × Gegner × Derby
//           → aufgeteilt nach Vorlieben der Epoche (Steh/Sitz/Dach/Premium),
//             Gäste als eigener Anteil (Gegner, Derby).
//   VIP     Business/Logen: absolute Märkte aus Vereinsgröße (Ruf), Marke,
//           Wirtschaftskraft der Region, Reife des Hospitality-Markts und dem
//           Hospitality-Modul des Stadionumfelds → nicht beliebig ausbaubar.
//   Preis   Nachfrage × (1 − Elastizität × (Preis/Richtpreis − 1)), je Kategorie.
//   Verkauf min(Kontingent, Nachfrage); wer keinen Platz bekommt, weicht zum Teil
//           in die Nachbarkategorie aus.
// Das Potenzial (`seating.market`) hängt NICHT an der Kapazität: ein zu großes
// Stadion bleibt leer; ein Neubau zieht über Jahre neue Fans an, aber nur bis zur
// Obergrenze, die der Ruf hergibt (seasonDrift).
// Preise in 1975-Basis; Anzeige/Buchung × seatPriceScale (Spieltagsskala × Liga).
// =============================================================================
import type { Club, SeatCat, SeatNums, StadiumBlock, StadiumSeating } from '../types';
import {
  BUSINESS_ERA, BUSINESS_REGION, CAT_KEYS, EAST_CITIES, FAN_CATS, GUEST_SHARE, GUEST_SHARE_EURO, LOGE_ERA, LOGE_GUESTS, PREMIUM_SHARE,
  PRICE_ANCHORS, ROOF_PREF, SEAT_CAT, STEH_SHARE, VIP_AREA_SEATS_PER_LENGTH, lerpTable,
} from '../data/seatingCatalog';
import { attendanceDemand, clubTier, fairTicketPrice, matchdayPriceScale, tierScale } from './economy';
import { ROOF_COVER, blockLength, tierCapacity } from './stadiumBlocks';
import { hospitalityMultiplier } from './grounds';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Freigeschaltet? */
export const catAvailable = (k: SeatCat, year: number) => year >= SEAT_CAT[k].unlock;

/** Preis-Skala je Besucher eines Vereins (1975 = 1; Unterklassige wachsen langsamer). */
export function seatPriceScale(club: Club, year: number): number {
  return tierScale(matchdayPriceScale(year), clubTier(club), 'matchday');
}

// -----------------------------------------------------------------------------
// Richtpreise
// -----------------------------------------------------------------------------
function anchorNominal(k: SeatCat, year: number): number {
  const A = PRICE_ANCHORS;
  if (year <= A[0].year) return A[0].p[k];
  for (let i = 0; i < A.length - 1; i++) {
    const a = A[i], b = A[i + 1];
    if (year <= b.year) return a.p[k] * Math.pow(b.p[k] / a.p[k], (year - a.year) / (b.year - a.year));
  }
  const last = A[A.length - 1];
  return last.p[k] * matchdayPriceScale(year) / matchdayPriceScale(last.year); // Fortschreibung
}

/** Ruf-Faktor des Preises: Fans (wie fairTicketPrice), VIP steiler. */
function repFactor(k: SeatCat, rep: number): number {
  if (k === 'business' || k === 'loge') return Math.pow(clamp(rep, 30, 99) / 70, 1.6);
  return fairTicketPrice(rep) / fairTicketPrice(70);
}

/** Richtpreis (1975-Basis) einer Kategorie: was ein Verein dieses Rufs verlangen kann. */
export function refPrice(club: Club, k: SeatCat, year: number): number {
  const hosp = k === 'business' || k === 'loge' ? 1 + (hospitalityMultiplier(club, year) - 1) * 0.5 : 1;
  return (anchorNominal(k, year) / matchdayPriceScale(year)) * repFactor(k, club.reputation ?? 60) * hosp;
}

/** Nominaler Anzeigepreis (DM bzw. als DM-Betrag für die €-Anzeige). */
export function nominalPrice(club: Club, k: SeatCat, year: number, base?: number): number {
  return (base ?? priceOf(club, k, year)) * seatPriceScale(club, year);
}

export function priceOf(club: Club, k: SeatCat, year: number): number {
  return club.stadium.seating?.prices[k] ?? refPrice(club, k, year);
}

/** Preisfaktor der Nachfrage. */
export function priceResponse(k: SeatCat, ratio: number): number {
  const e = SEAT_CAT[k].elasticity;
  if (ratio <= 1) return Math.min(1 + 0.45 * e, 1 + 0.6 * e * (1 - ratio));
  return Math.max(0.02, 1 - e * (ratio - 1));
}

// -----------------------------------------------------------------------------
// Anlegen (idempotent): Potenzial = heutige Kapazität, Preise nach Preisniveau
// -----------------------------------------------------------------------------
export function ensureSeating(club: Club, year: number): StadiumSeating {
  const st = club.stadium;
  if (st.seating) return st.seating;
  const idx = clamp((st.ticketPrice ?? fairTicketPrice(club.reputation)) / fairTicketPrice(club.reputation ?? 60), 0.5, 2);
  const prices: SeatNums = {};
  for (const k of CAT_KEYS) prices[k] = round2(refPrice(club, k, year) * (FAN_CATS.includes(k) ? idx : 1));
  const seating: StadiumSeating = { market: Math.max(1500, st.capacity), prices };
  st.seating = seating;
  if (!st.blocks?.length) seating.caps = aiTargetCaps(club, year, st.capacity, (st.vipBoxes ?? 0));
  return seating;
}
const round2 = (v: number) => Math.round(v * 100) / 100;

// -----------------------------------------------------------------------------
// Kontingente
// -----------------------------------------------------------------------------
export interface CapInfo { caps: SeatNums; stehCover: number; wheelchair: number }

/** Kontingente aus den Blöcken des eigenen Vereins. */
export function blockCaps(blocks: StadiumBlock[]): { caps: SeatNums; stehCover: number } {
  const c: Required<SeatNums> = { steh: 0, sitz: 0, dach: 0, premium: 0, business: 0, loge: 0, gast: 0 };
  let stehCov = 0;
  for (const b of blocks) {
    const cov = ROOF_COVER(b.roof);
    for (const t of b.tiers) {
      const n = tierCapacity(b.id, t);
      if (t.seat === 'steh') { c.steh += n; stehCov += n * cov; }
      else if (t.seat === 'komfort') c.premium += n;
      else if (t.seat === 'business') c.business += n;
      else { c.dach += n * cov; c.sitz += n * (1 - cov); }
    }
    if (b.vip) c.business += vipAreaSeats(b);
    c.loge += b.lounges;
  }
  for (const k of CAT_KEYS) c[k] = Math.round(c[k]);
  return { caps: c, stehCover: c.steh ? stehCov / c.steh : 0 };
}
/** Business-Plätze eines VIP-Bereichs (Gerade ≈ 200). */
export const vipAreaSeats = (b: StadiumBlock) => Math.round((VIP_AREA_SEATS_PER_LENGTH * blockLength(b.id)) / 10) * 10;

/** Ziel-Mix eines KI-Stadions (Personen; Business/Logen aus der erwarteten Nachfrage). */
export function aiTargetCaps(club: Club, year: number, capacity: number, boxes: number): SeatNums {
  const lvl = club.infrastructure?.stadium ?? 2;
  const steh = clamp(lerpTable([[1975, 0.74], [1985, 0.69], [1992, 0.57], [1998, 0.44], [2006, 0.31], [2015, 0.27], [2030, 0.25]], year) - (lvl - 3) * 0.03, 0.15, 0.85);
  const prem = catAvailable('premium', year) ? lerpTable(PREMIUM_SHARE, year) * 0.8 : 0;
  const cover = clamp(lerpTable([[1975, 0.45], [1990, 0.6], [2000, 0.85], [2006, 1]], year) + (lvl - 3) * 0.1, 0.2, 1);
  const bus = catAvailable('business', year) ? Math.min(capacity * 0.06, vipPool(club, 'business', year) * 0.85) : 0;
  const loge = catAvailable('loge', year) ? Math.max(boxes, Math.round(vipPool(club, 'loge', year) * 0.8)) : 0;
  const seats = Math.max(0, capacity - bus) * (1 - steh - prem);
  return {
    steh: Math.round(Math.max(0, capacity - bus) * steh), premium: Math.round(Math.max(0, capacity - bus) * prem),
    dach: Math.round(seats * cover), sitz: Math.round(seats * (1 - cover)), business: Math.round(bus / 10) * 10, loge, gast: 0,
  };
}

/** Kontingente eines Spiels (Gästeblock, Europapokal-Bestuhlung, Bausperren). */
export function capsFor(club: Club, year: number, opts: { euro?: boolean; date?: string } = {}): CapInfo {
  const st = club.stadium;
  const seating = ensureSeating(club, year);
  let caps: SeatNums, stehCover: number;
  if (st.blocks?.length) {
    const r = blockCaps(st.blocks);
    caps = { ...r.caps }; stehCover = r.stehCover;
    // Bausperre/abweichende Kapazität: Zuschauerkategorien anteilig.
    const general = caps.steh! + caps.sitz! + caps.dach! + caps.premium! + Math.max(0, caps.business! - st.blocks.reduce((a, b) => a + (b.vip ? vipAreaSeats(b) : 0), 0));
    const f = general > 0 ? clamp(st.capacity / general, 0, 1) : 1;
    if (f < 0.999) for (const k of ['steh', 'sitz', 'dach', 'premium'] as SeatCat[]) caps[k] = Math.round(caps[k]! * f);
  } else {
    caps = { ...(seating.caps ?? aiTargetCaps(club, year, st.capacity, st.vipBoxes ?? 0)) };
    const lvl = club.infrastructure?.stadium ?? 2;
    stehCover = clamp(lerpTable([[1975, 0.15], [1990, 0.3], [2000, 0.6], [2006, 0.9]], year) + (lvl - 3) * 0.1, 0, 1);
    // Kapazität von außen verändert (KI-Ausbau): Zuschauerkategorien anteilig anpassen.
    const gen = caps.steh! + caps.sitz! + caps.dach! + caps.premium! + (caps.business ?? 0);
    const f = gen > 0 ? st.capacity / gen : 1;
    if (Math.abs(f - 1) > 0.01) for (const k of ['steh', 'sitz', 'dach', 'premium'] as SeatCat[]) caps[k] = Math.round((caps[k] ?? 0) * f);
  }
  for (const k of CAT_KEYS) if (!catAvailable(k, year) && k !== 'gast') { // nicht freigeschaltet (alte Blöcke/KI) → Normalplatz
    if (k === 'premium') caps.dach = (caps.dach ?? 0) + (caps[k] ?? 0);
    if (k === 'premium' || k === 'business' || k === 'loge') caps[k] = 0;
  }
  // Europapokal ab 1998/99: nur Sitzplätze – Stehränge werden bestuhlt (halbe Kapazität).
  if (opts.euro && (opts.date ?? `${year}-12-31`) >= '1998-07-01' && caps.steh) {
    const s = caps.steh;
    caps.dach = (caps.dach ?? 0) + Math.round((s / 2) * stehCover);
    caps.sitz = (caps.sitz ?? 0) + Math.round((s / 2) * (1 - stehCover));
    caps.steh = 0;
  }
  // Gästeblock: 10 % der Plätze (Europapokal 5 %), zuerst aus Steh-, dann aus Sitzplätzen.
  caps.gast = 0;
  if (opts.euro || catAvailable('gast', year)) {
    const general = (caps.steh ?? 0) + (caps.sitz ?? 0) + (caps.dach ?? 0);
    let need = Math.round(general * (opts.euro ? GUEST_SHARE_EURO : GUEST_SHARE));
    caps.gast = need;
    for (const k of ['steh', 'sitz', 'dach'] as SeatCat[]) {
      const take = Math.min(need, Math.round((caps[k] ?? 0) * (k === 'steh' ? 0.6 : 1)));
      caps[k] = (caps[k] ?? 0) - take; need -= take;
    }
  }
  const seatedAll = (caps.sitz ?? 0) + (caps.dach ?? 0) + (caps.premium ?? 0) + (caps.business ?? 0);
  return { caps, stehCover, wheelchair: year >= 2002 ? Math.max(2, Math.round(seatedAll * 0.01)) : 0 };
}

// -----------------------------------------------------------------------------
// Nachfrage
// -----------------------------------------------------------------------------
export interface DemandCtx {
  year: number;
  away?: Club | null;
  derby?: boolean;
  weather?: string;
  month?: number;
  euro?: boolean;
}

function regionFactor(club: Club, year: number): number {
  const city = club.city ?? '';
  if (EAST_CITIES.some((c) => city.includes(c))) return year < 1991 ? 0 : year < 2005 ? 0.7 : 0.85;
  return BUSINESS_REGION.find(([c]) => city.includes(c))?.[1] ?? 1;
}

/** Größe des Hospitality-Markts eines Vereins (Business: Plätze, Logen: Stück) bei Richtpreis. */
export function vipPool(club: Club, k: 'business' | 'loge', year: number): number {
  if (clubTier(club) >= 100 && year < 1991) return 0; // DDR-Oberliga: keine Logen, keine Business-Plätze
  const rep = clamp(club.reputation ?? 50, 30, 99);
  const size = Math.pow(clamp((rep - 35) / 65, 0, 1), 2.4);
  const base = k === 'business' ? 100 + 4200 * size : 3 + 115 * size;
  const era = lerpTable(k === 'business' ? BUSINESS_ERA : LOGE_ERA, year);
  const brand = club.brand ? clamp(0.75 + (club.brand.regional + club.brand.national) / 400, 0.8, 1.3) : 1;
  const tier = clubTier(club);
  const tierF = tier <= 1 ? 1 : tier === 2 ? 0.45 : 0.15;
  const success = clamp(0.75 + (club.stadium.averageAttendanceRate ?? 0.5) * 0.55, 0.85, 1.25);
  return base * era * regionFactor(club, year) * brand * tierF * success * hospitalityMultiplier(club, year);
}

/** Nachfrage je Kategorie (Personen bzw. Logen) bei den aktuellen Preisen – ohne Kapazitätsgrenze. */
export function demandFor(club: Club, ctx: DemandCtx, stehCover = 0.3): Required<SeatNums> {
  const { year } = ctx;
  const st = club.stadium;
  const seating = ensureSeating(club, year);
  const rep = club.reputation ?? 60;
  const awayRep = ctx.away?.reputation ?? 62;
  const opp = clamp(1 + (awayRep - 70) / 120, 0.88, 1.2);
  const G = seating.market * (st.averageAttendanceRate ?? 0.5) * attendanceDemand(year) * opp * (ctx.derby ? 1.15 : 1);
  const awayShare = 0.06 * clamp(0.35 + Math.pow(Math.max(0, awayRep - 40) / 50, 2) * 1.3, 0.3, 1.8) * (ctx.derby ? 1.8 : 1) * (ctx.euro ? 0.6 : 1);
  const AD = G * awayShare, Gh = G - AD;
  const s = lerpTable(STEH_SHARE, year);
  const pr = catAvailable('premium', year) ? lerpTable(PREMIUM_SHARE, year) * clamp(rep / 70, 0.6, 1.4) : 0;
  const seats = 1 - s - pr, rp = lerpTable(ROOF_PREF, year);
  const pf = (k: SeatCat) => priceResponse(k, priceOf(club, k, year) / refPrice(club, k, year));
  const rain = ctx.weather === 'regen' || ctx.weather === 'schnee';
  const winter = ctx.month != null && (ctx.month >= 11 || ctx.month <= 2);
  const wxOpen = rain ? 0.82 : winter ? 0.9 : 1;
  const wxSteh = 1 - (1 - stehCover) * (rain ? 0.12 : winter ? 0.05 : 0);
  const guestBlock = ctx.euro || catAvailable('gast', year);
  const d: Required<SeatNums> = {
    steh: (Gh * s + (guestBlock ? 0 : AD * 0.8)) * pf('steh') * wxSteh,
    sitz: (Gh * seats * (1 - rp) + (guestBlock ? 0 : AD * 0.2)) * pf('sitz') * wxOpen,
    dach: Gh * seats * rp * pf('dach') * (rain ? 1.03 : 1),
    premium: Gh * pr * pf('premium'),
    business: catAvailable('business', year) ? vipPool(club, 'business', year) * Math.pow(opp, 0.3) * pf('business') : 0,
    loge: catAvailable('loge', year) ? vipPool(club, 'loge', year) * pf('loge') : 0,
    gast: guestBlock ? AD * pf('gast') : 0,
  };
  return d;
}

// -----------------------------------------------------------------------------
// Verkauf
// -----------------------------------------------------------------------------
export interface SeatSale {
  sold: Required<SeatNums>;
  caps: SeatNums;
  demand: Required<SeatNums>;
  /** Zuschauer (Logen × Gäste je Loge). */
  attendance: number;
  /** Gegner (Anzeige im Verlauf). */
  opponent?: string;
}

/** Wer keinen Platz bekommt, weicht zum Teil aus: [von, nach, Anteil]. */
const SPILL: [SeatCat, SeatCat, number][] = [
  ['steh', 'sitz', 0.25], ['steh', 'dach', 0.1], ['sitz', 'dach', 0.5], ['dach', 'sitz', 0.45], ['dach', 'premium', 0.08],
  ['premium', 'dach', 0.6], ['business', 'premium', 0.25], ['loge', 'business', 0.3 * LOGE_GUESTS],
];

export function sellSeats(caps: SeatNums, demand: Required<SeatNums>, rng?: () => number, restriction = 1): SeatSale {
  const common = rng ? 1 + (rng() - 0.5) * 0.1 : 1;
  const D: Required<SeatNums> = { ...demand };
  for (const k of CAT_KEYS) D[k] = Math.max(0, D[k] * (k === 'business' || k === 'loge' ? 1 : common) * (rng ? 1 + (rng() - 0.5) * 0.08 : 1));
  const cap = (k: SeatCat) => Math.floor((caps[k] ?? 0) * restriction);
  const sold = {} as Required<SeatNums>;
  for (const k of CAT_KEYS) sold[k] = Math.min(cap(k), D[k]);
  for (const [a, b, f] of SPILL) {
    const over = D[a] - sold[a];
    if (over <= 0) continue;
    const add = Math.min(cap(b) - sold[b], over * f);
    if (add > 0) sold[b] += add;
  }
  for (const k of CAT_KEYS) sold[k] = Math.round(sold[k]);
  const attendance = CAT_KEYS.reduce((a, k) => a + (k === 'loge' ? sold[k] * LOGE_GUESTS : sold[k]), 0);
  return { sold, caps, demand: D, attendance };
}

/** Kompletter Verkauf eines Heimspiels (Match-Engine). */
export function simulateSeatSales(club: Club, away: Club | null, ctx: DemandCtx & { date?: string; restriction?: number }, rng: () => number): SeatSale {
  const ci = capsFor(club, ctx.year, { euro: ctx.euro, date: ctx.date });
  return { ...sellSeats(ci.caps, demandFor(club, ctx, ci.stehCover), rng, ctx.restriction ?? 1), opponent: away?.name };
}

/** Erwarteter Verkauf ohne Zufall (Vorschau, KI): durchschnittlicher Gegner, trockenes Herbstwetter. */
export function expectedSale(club: Club, year: number, opts: { awayRep?: number; caps?: SeatNums } = {}): SeatSale {
  const ci = capsFor(club, year);
  const away = { reputation: opts.awayRep ?? 62 } as Club;
  return sellSeats(opts.caps ?? ci.caps, demandFor(club, { year, away, month: 10, weather: 'bewoelkt' }, ci.stehCover));
}

/** Erlös je Kategorie (nominal) für einen Verkauf. */
export function saleRevenue(club: Club, sold: SeatNums, year: number): Required<SeatNums> {
  const sc = seatPriceScale(club, year);
  const out = {} as Required<SeatNums>;
  for (const k of CAT_KEYS) out[k] = Math.round((sold[k] ?? 0) * priceOf(club, k, year) * sc);
  return out;
}

/** Verkaufte Plätze eines Spielergebnisses (von der Match-Engine hinterlegt; nicht im Spielstand). */
export const SEAT_SALES = new WeakMap<object, SeatSale>();

/** Verkauf zu einem Ergebnis: hinterlegt oder (ältere Ergebnisse) aus der Zuschauerzahl geschätzt. */
export function saleForResult(club: Club, result: { attendance: number }, year: number): SeatSale {
  const s = SEAT_SALES.get(result);
  if (s) return s;
  const e = expectedSale(club, year);
  const f = e.attendance > 0 ? result.attendance / e.attendance : 0;
  const sold = {} as Required<SeatNums>;
  for (const k of CAT_KEYS) sold[k] = Math.round(e.sold[k] * Math.min(1.2, f));
  return { ...e, sold, attendance: result.attendance };
}

// -----------------------------------------------------------------------------
// Preisindex (für Fanstimmung und alte Anzeigen): ticketPrice = fairer Preis × Index der Fan-Kategorien
// -----------------------------------------------------------------------------
export function fanPriceIndex(club: Club, year: number): number {
  const caps = capsFor(club, year).caps;
  let w = 0, v = 0;
  for (const k of FAN_CATS) {
    const c = (caps[k] ?? 0) * (k === 'steh' ? 1.5 : 1);
    if (c <= 0) continue;
    w += c; v += c * (priceOf(club, k, year) / refPrice(club, k, year));
  }
  return w ? v / w : 1;
}
export function syncTicketPrice(club: Club, year: number): void {
  club.stadium.ticketPrice = Math.round(fairTicketPrice(club.reputation ?? 60) * fanPriceIndex(club, year) * 10) / 10;
}
/** Alle Fan-Preise um einen Faktor ändern (Ereignisse, Fanproteste). */
export function scaleFanPrices(club: Club, year: number, f: number): void {
  const s = ensureSeating(club, year);
  for (const k of FAN_CATS) s.prices[k] = round2(priceOf(club, k, year) * f);
  syncTicketPrice(club, year);
}

/** Obergrenze des Zuschauerpotenzials nach Ruf (Personen bei Zuspruch 1 und Nachfrage 1975). */
export function marketCeiling(rep: number): number {
  return 6000 + 135000 * Math.pow(clamp((rep - 30) / 70, 0, 1), 2.2);
}

/** Saisonwechsel: Potenzial wächst mit einem größeren Stadion (bis zur Ruf-Obergrenze), schrumpft über der Grenze. */
export function seasonDrift(club: Club, year: number): void {
  const s = ensureSeating(club, year);
  const C = marketCeiling(club.reputation ?? 60);
  const cap = club.stadium.capacity;
  if (cap > s.market && s.market < C) s.market = Math.round(s.market + (Math.min(cap, C) - s.market) * 0.15);
  else if (s.market > C * 1.1) s.market = Math.round(s.market + (C - s.market) * 0.1);
}

// -----------------------------------------------------------------------------
// Verlauf des eigenen Vereins (letzte Heimspiele, Saisonbilanz je Kategorie)
// -----------------------------------------------------------------------------
export const seasonIdOf = (date: string) => { const y = Number(date.slice(0, 4)); const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1; return `${s}/${String((s + 1) % 100).padStart(2, '0')}`; };

export function logSeatSale(club: Club, date: string, sale: SeatSale, rev: SeatNums): void {
  const s = ensureSeating(club, Number(date.slice(0, 4)));
  (s.log ??= []).unshift({ date, opponent: sale.opponent ?? '', sold: { ...sale.sold }, cap: { ...sale.caps }, rev: { ...rev } });
  if (s.log.length > 8) s.log.length = 8;
  const id = seasonIdOf(date);
  if (!s.season || s.season.id !== id) { if (s.season) s.prevSeason = s.season; s.season = { id, games: 0, rev: {}, sold: {} }; }
  s.season.games++;
  for (const k of CAT_KEYS) {
    s.season.rev[k] = (s.season.rev[k] ?? 0) + (rev[k] ?? 0);
    s.season.sold[k] = (s.season.sold[k] ?? 0) + (sale.sold[k] ?? 0);
  }
}

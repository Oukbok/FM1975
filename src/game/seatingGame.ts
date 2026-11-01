// =============================================================================
// PLATZKATEGORIEN im Spielablauf
// -----------------------------------------------------------------------------
// • migrateSeating: alte Spielstände bekommen Preise je Kategorie (aus dem alten
//   Eintrittspreis) und ein Zuschauerpotenzial (= heutige Kapazität). Idempotent.
// • seatingNewSeason (Saisonwechsel, alle Vereine): Preise wachsen mit dem Richtpreis
//   der Epoche mit, Potenzial folgt dem Stadion bis zur Ruf-Obergrenze; KI-Vereine
//   bauen ihren Platzmix um (Sitzplatz-Boom, Business, Logen nach Nachfrage) und
//   passen Preise an die Auslastung an.
// • demandEstimate: Der Spieler sieht die Nachfrage nur geschätzt – Kaufmännischer
//   Leiter, Marketing, Eventmanager, CRM und Datenanalyse sowie Erfahrung aus
//   eigenen Heimspielen machen die Spanne enger. Ausverkauft heißt: Nachfrage
//   mindestens so groß wie das Kontingent, mehr weiß man nicht.
// Rechnung: engine/seating.ts, Stammdaten: data/seatingCatalog.ts.
// =============================================================================
import { CAT_KEYS, FAN_CATS, SEAT_CAT } from '../data/seatingCatalog';
import { isLeagueClub } from '../engine/clubEconomy';
import { yearOf } from '../engine/economy';
import {
  aiTargetCaps, capsFor, ensureSeating, expectedSale, priceOf, refPrice, seasonDrift, seasonIdOf, syncTicketPrice,
} from '../engine/seating';
import type { Club, SeatCat } from '../types';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Beim Laden und beim neuen Spiel: alle Vereine mit Platzkategorien ausstatten (idempotent). */
export function migrateSeating(g: Game): boolean {
  const year = yearOf(g.calendar.currentDate);
  let changed = false;
  for (const c of Object.values(g.clubs)) {
    if (c.stadium.seating) continue;
    ensureSeating(c, year);
    changed = true;
  }
  return changed;
}

/** Preise an den neuen Richtpreis anpassen (Preisniveau bleibt gleich). */
function carryPrices(c: Club, year: number): void {
  const s = ensureSeating(c, year);
  for (const k of CAT_KEYS) {
    const prev = refPrice(c, k, year - 1), now = refPrice(c, k, year);
    if (prev > 0 && s.prices[k] != null) s.prices[k] = Math.round(s.prices[k]! * (now / prev) * 100) / 100;
  }
}

/** KI: Platzmix langsam zum Ziel der Epoche, Preise nach Auslastung. */
export function aiSeatingSeason(c: Club, year: number): void {
  const s = ensureSeating(c, year);
  if (c.stadium.blocks?.length) return;
  const cur = { ...(s.caps ?? {}) };
  const target = aiTargetCaps(c, year, c.stadium.capacity, cur.loge ?? 0);
  const next = { ...cur };
  for (const k of CAT_KEYS) {
    const a = cur[k] ?? 0, b = target[k] ?? 0;
    const rate = k === 'business' || k === 'loge' ? (b > a ? 0.35 : 0.1) : 0.2;
    next[k] = Math.round(a + (b - a) * rate);
  }
  s.caps = next;
  // Preise: ausverkauft → teurer, leer → günstiger (Stehplätze bleiben fanfreundlich).
  const sale = expectedSale(c, year);
  for (const k of CAT_KEYS) {
    const cap = sale.caps[k] ?? 0;
    if (cap <= 0) continue;
    const ref = refPrice(c, k, year);
    let idx = priceOf(c, k, year) / ref;
    const dr = sale.demand[k] / cap;
    if (dr > 1.15) idx += 0.06; else if (dr < 0.75) idx -= 0.05;
    idx = clamp(idx, 0.8, k === 'steh' ? 1.25 : 1.5);
    s.prices[k] = Math.round(ref * idx * 100) / 100;
  }
  syncTicketPrice(c, year);
}

/** Saisonwechsel aller Vereine (aufgerufen aus game/seasonFinance.ts). */
export function seatingNewSeason(g: Game, date: string): void {
  const year = yearOf(date);
  const auto = !!(g as any).simAutoManage;
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c)) continue;
    carryPrices(c, year);
    seasonDrift(c, year);
    if (c.id !== g.managedClubId || auto) aiSeatingSeason(c, year);
    else syncTicketPrice(c, year);
  }
}

/** Preis einer Kategorie setzen (1975-Basis), begrenzt auf 30–300 % des Richtpreises. */
export function setSeatPrice(g: Game, k: SeatCat, base: number): void {
  const c = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const s = ensureSeating(c, year);
  const ref = refPrice(c, k, year);
  s.prices[k] = Math.round(clamp(base, ref * 0.3, ref * 3) * 100) / 100;
  syncTicketPrice(c, year);
}

/** Alle Preise auf den Richtpreis setzen. */
export function resetSeatPrices(g: Game): void {
  const c = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  for (const k of CAT_KEYS) setSeatPrice(g, k, refPrice(c, k, year));
}

// -----------------------------------------------------------------------------
// Geschätzte Nachfrage (Spanne) für die Anzeige
// -----------------------------------------------------------------------------
const STAFF_WEIGHT: Record<string, number> = { kaufm_leiter: 0.12, marketingmanager: 0.15, eventmanager: 0.18, crm_manager: 0.2, datenanalyst: 0.12 };

/** Anteil, um den Mitarbeiter die Schätzung schärfen (0–0,55), und wer dazu beiträgt. */
export function forecastStaff(g: Game): { share: number; names: string[] } {
  let share = 0;
  const names: string[] = [];
  for (const m of g.staff ?? []) {
    const w = STAFF_WEIGHT[m.roleId];
    if (!w) continue;
    share += w * clamp(m.quality / 20, 0, 1);
    names.push(m.name);
  }
  return { share: Math.min(0.55, share), names };
}

function hashU(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

export interface DemandEstimate {
  lo: number; hi: number; mid: number;
  /** Unschärfe (Anteil). */
  fog: number;
  /** Zuletzt ausverkauft: Nachfrage ≥ Kontingent. */
  soldOut: boolean;
  /** Ausgewertete Heimspiele dieser Kategorie. */
  seen: number;
}

/** Geschätzte Nachfrage des nächsten Heimspiels (Durchschnittsgegner) bei den aktuellen Preisen. */
export function demandEstimate(g: Game, k: SeatCat, club?: Club): DemandEstimate {
  const c = club ?? g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const sale = expectedSale(c, year);
  const truth = sale.demand[k];
  const log = (c.stadium.seating?.log ?? []).filter((e) => (e.cap[k] ?? 0) > 0);
  const open = log.filter((e) => (e.sold[k] ?? 0) < (e.cap[k] ?? 0) * 0.97).length;
  const soldOut = log.length > 0 && log.slice(0, 3).every((e) => (e.sold[k] ?? 0) >= (e.cap[k] ?? 0) * 0.97);
  const staff = forecastStaff(g).share;
  const fog = SEAT_CAT[k].fog * (1 - staff) * Math.max(0.55, 1 - open * 0.06);
  const mid = Math.max(0, truth * (1 + hashU(`${c.id}:${seasonIdOf(today)}:${k}`) * fog * 0.8));
  let lo = mid * (1 - fog), hi = mid * (1 + fog);
  const cap = sale.caps[k] ?? 0;
  if (soldOut && cap > 0) { lo = Math.max(lo, cap); hi = Math.max(hi, cap * (1 + fog)); }
  const r = (v: number) => (k === 'loge' ? Math.round(v) : Math.round(v / 50) * 50);
  return { lo: r(lo), hi: r(hi), mid: r(mid), fog, soldOut, seen: log.length };
}

/** Kontingente des eigenen Vereins für die Anzeige. */
export function ownCaps(g: Game) {
  const c = g.clubs[g.managedClubId];
  return capsFor(c, yearOf(g.calendar.currentDate));
}

export { FAN_CATS };

// =============================================================================
// KARTENVERKAUF im Spielablauf (eigener Verein)
// -----------------------------------------------------------------------------
// • ticketsDaily: Prognose-Schärfe aus den Mitarbeitern und die Gegner mit
//   automatischem Topzuschlag (n Beste der Tabelle) täglich nachführen.
// • homeGames: alle Heimspiele der Saison (Liga, Pokal, Europapokal) mit Preis-
//   kategorie, Prognose-Spanne (künftig) bzw. Prognose am Spieltag und Ist (gespielt).
// • Preise je Tribüne × Kategorie, Preiskategorie je Spiel, Besondere Preise.
// Rechnung: engine/seating.ts (ticketedSale, Tribünen), engine/ticketForecast.ts.
// Seite: views/verein/TicketsView.tsx.
// =============================================================================
import { attendanceRestriction } from '../data/history';
import { CAT_KEYS, LOGE_GUESTS, STANDS } from '../data/seatingCatalog';
import { yearOf } from '../engine/economy';
import { fixedWeather } from '../engine/match/sim';
import {
  capsFor, ensureSeating, ensureTickets, matchPriceCat, priceOf, refPrice, splitByStand, syncTicketPrice, ticketedSale, type SeatSale,
} from '../engine/seating';
import { ticketKey, ticketUncertainty, type CatWindows } from '../engine/ticketForecast';
import type { Club, SeatCat, SeatMatchLog, SeatNums, StandId, TicketPriceCat } from '../types';
import { ownFixtureOn } from './euroFixture';
import { forecastStaff } from './seatingGame';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const DAY = 86400000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

/** Täglich: Prognose-Schärfe und Topzuschlag-Gegner des eigenen Vereins nachführen. */
export function ticketsDaily(g: Game): void {
  const c = g.clubs[g.managedClubId];
  if (!c?.stadium.blocks?.length) return;
  const t = ensureTickets(c, yearOf(g.calendar.currentDate));
  t.staff = Math.round(forecastStaff(g).share * 1000) / 1000;
  t.topIds = t.autoTop > 0 ? topClubs(g, t.autoTop) : undefined;
}

/** Die n besten Mannschaften der eigenen Liga (vor dem 1. Spieltag nach Ansehen). */
export function topClubs(g: Game, n: number): string[] {
  const rows = (g.table?.rows ?? []).filter((r) => r.clubId !== g.managedClubId);
  const played = rows.some((r: any) => (r.played ?? 0) > 0);
  const ids = played ? rows.map((r) => r.clubId) : rows.map((r) => r.clubId).sort((a, b) => (g.clubs[b]?.reputation ?? 0) - (g.clubs[a]?.reputation ?? 0));
  return ids.slice(0, n);
}

// -----------------------------------------------------------------------------
// Heimspiele der Saison
// -----------------------------------------------------------------------------
export type GameKind = 'Liga' | 'Pokal' | 'Europapokal';
export interface HomeGame {
  key: string;
  date: string;
  awayId: string;
  kind: GameKind;
  label: string;
  /** Gespielt (Verlauf vorhanden oder Datum vorbei). */
  played: boolean;
  log?: SeatMatchLog;
}

export function homeGames(g: Game): HomeGame[] {
  const me = g.managedClubId;
  const out = new Map<string, HomeGame>();
  const log = g.clubs[me]?.stadium.seating?.log ?? [];
  const today = g.calendar.currentDate;
  const add = (date: string, awayId: string, kind: GameKind, label: string) => {
    const key = ticketKey(date, awayId);
    if (out.has(key)) return;
    const l = log.find((e) => e.key === key) ?? log.find((e) => !e.key && e.date === date);
    out.set(key, { key, date, awayId, kind, label, played: !!l || date < today, log: l });
  };
  for (const m of g.fixtures ?? []) if (m.homeClubId === me) add(m.date, m.awayClubId, 'Liga', `${m.matchday}. Spieltag`);
  const seen = new Set<string>();
  for (const ev of g.calendar.events) {
    if (ev.type !== 'cup_matchday' && ev.type !== 'euro_matchday') continue;
    const id = `${ev.type}|${ev.euroComp ?? ''}|${ev.cupRoundIndex}|${ev.leg ?? 0}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const f = ownFixtureOn(g, ev);
    const kind: GameKind = ev.type === 'cup_matchday' ? 'Pokal' : 'Europapokal';
    if (f) { if (f.home) add(f.match?.date ?? ev.date, f.opp, kind, f.comp.replace(/^.*? · /, '')); continue; }
    if (f === null || ev.cupRoundIndex == null) continue;
    const cup = ev.type === 'cup_matchday' ? g.cup : g.euroCups?.[ev.euroComp!];
    const round = cup?.rounds?.[ev.cupRoundIndex];
    const tie = round?.drawn ? round.ties.find((t) => t.homeClubId === me) : undefined;
    if (tie) add(tie.date, tie.awayClubId, kind, round!.name);
  }
  return [...out.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// -----------------------------------------------------------------------------
// Prognose eines Heimspiels
// -----------------------------------------------------------------------------
export interface GameForecast {
  fc: CatWindows;
  caps: SeatNums;
  /** Zuschauer-Spanne (Logen × Gäste). */
  total: [number, number];
  /** Mögliche Verkäufe (Plätze des Spiels). */
  capacity: number;
  priceCat: TicketPriceCat;
  auto: boolean;
  reasons: string[];
  mult: number;
  /** Nur intern: wahrer Verkauf nach heutigem Stand (für die Aufteilung je Tribüne, nie anzeigen). */
  sale: SeatSale;
}

const persons = (k: SeatCat, v: number) => (k === 'loge' ? v * LOGE_GUESTS : v);
export function totalOf(fc: CatWindows): [number, number] {
  let lo = 0, hi = 0;
  for (const k of CAT_KEYS) { const w = fc[k]; if (w) { lo += persons(k, w[0]); hi += persons(k, w[1]); } }
  return [Math.floor(lo / 10) * 10, Math.ceil(hi / 10) * 10];
}
export function capacityOf(caps: SeatNums, restriction = 1): number {
  return CAT_KEYS.reduce((a, k) => a + persons(k, Math.floor((caps[k] ?? 0) * restriction)), 0);
}

/** Prognose für ein künftiges Heimspiel nach heutigem Stand (null = Gegner unbekannt). */
export function forecastGame(g: Game, hg: HomeGame): GameForecast | null {
  const club = g.clubs[g.managedClubId];
  const away = g.clubs[hg.awayId];
  if (!club?.stadium.blocks?.length || !away) return null;
  const today = g.calendar.currentDate;
  const ctx = {
    year: yearOf(hg.date), date: hg.date, away, derby: !!club.city && club.city === away.city,
    weather: fixedWeather(hg.date, club.id), month: Number(hg.date.slice(5, 7)),
    euro: hg.kind === 'Europapokal', cup: hg.kind === 'Pokal', restriction: attendanceRestriction(hg.date),
  };
  const daysAhead = Math.max(0, daysBetween(today, hg.date));
  const sale = ticketedSale(club, away, ctx, daysAhead);
  const pc = matchPriceCat(club, away, hg.key, ctx);
  const unc = ticketUncertainty({ ...ctx, daysAhead, seen: club.stadium.seating?.log?.length ?? 0 });
  return {
    fc: sale.fc ?? {}, caps: sale.caps, total: totalOf(sale.fc ?? {}), capacity: capacityOf(sale.caps, ctx.restriction),
    priceCat: pc.cat, auto: pc.auto, reasons: unc.reasons, mult: pc.mult, sale,
  };
}

/** Spanne einer Kategorie auf einer Tribüne: Spanne der Kategorie × Anteil der Tribüne am Verkauf. */
export function standWindow(club: Club, f: GameForecast, s: StandId, k: SeatCat, year: number): [number, number] | null {
  const w = f.fc[k];
  const sold = f.sale.sold[k] ?? 0;
  if (!w) return null;
  const split = splitByStand(club, k, year, Math.max(sold, 1), f.caps, f.mult);
  if (!split) return null;
  const tot = Object.values(split).reduce((a, v) => a + v, 0);
  if (tot <= 0 || split[s] <= 0) return null;
  const share = split[s] / tot;
  const step = k === 'loge' ? 1 : 10;
  return [Math.floor((w[0] * share) / step) * step, Math.ceil((w[1] * share) / step) * step];
}

// -----------------------------------------------------------------------------
// Einstellungen
// -----------------------------------------------------------------------------
/** Preis einer Kategorie auf einer Tribüne setzen (1975-Basis, 30–300 % des Richtpreises). Gleich wie die Kategorie = Eintrag löschen. */
export function setStandPrice(g: Game, s: StandId, k: SeatCat, base: number): void {
  const c = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const t = ensureTickets(c, year);
  const ref = refPrice(c, k, year);
  const v = Math.round(clamp(base, ref * 0.3, ref * 3) * 100) / 100;
  const row = ((t.stand ??= {})[s] ??= {});
  if (Math.abs(v - priceOf(c, k, year)) < 0.005) delete row[k]; else row[k] = v;
  if (!Object.keys(row).length) delete t.stand[s];
  syncTicketPrice(c, year);
}

/** Alle Tribünen einer Kategorie auf einen Preis setzen (Kategoriepreis, Tribünen-Einträge weg). */
export function setCategoryPrice(g: Game, k: SeatCat, base: number): void {
  const c = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const s = ensureSeating(c, year);
  const ref = refPrice(c, k, year);
  s.prices[k] = Math.round(clamp(base, ref * 0.3, ref * 3) * 100) / 100;
  for (const d of STANDS) { const row = s.tickets?.stand?.[d.id]; if (row) { delete row[k]; if (!Object.keys(row).length) delete s.tickets!.stand![d.id]; } }
  syncTicketPrice(c, year);
}

/** Alle Preise auf den Richtpreis, Tribünenpreise gelöscht. */
export function resetTicketPrices(g: Game): void {
  const c = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  for (const k of CAT_KEYS) setCategoryPrice(g, k, refPrice(c, k, year));
}

/** Preiskategorie eines Spiels weiterschalten: automatisch → normal → Top → Rabatt → automatisch. */
export function cycleMatchCat(g: Game, key: string): void {
  const c = g.clubs[g.managedClubId];
  const t = ensureTickets(c, yearOf(g.calendar.currentDate));
  const cur = t.match?.[key];
  const next: TicketPriceCat | undefined = cur == null ? 'normal' : cur === 'normal' ? 'top' : cur === 'top' ? 'rabatt' : undefined;
  t.match ??= {};
  if (next) t.match[key] = next; else delete t.match[key];
  // Vergangene Saisons aufräumen
  const today = g.calendar.currentDate;
  for (const k of Object.keys(t.match)) if (k.slice(0, 10) < today && daysBetween(k.slice(0, 10), today) > 400) delete t.match[k];
}

export function setTicketOption(g: Game, patch: Partial<{ topPct: number; rabattPct: number; autoTop: number; autoRabatt: boolean }>): void {
  const c = g.clubs[g.managedClubId];
  const t = ensureTickets(c, yearOf(g.calendar.currentDate));
  if (patch.topPct != null) t.topPct = clamp(Math.round(patch.topPct), 5, 100);
  if (patch.rabattPct != null) t.rabattPct = clamp(Math.round(patch.rabattPct), 5, 75);
  if (patch.autoTop != null) t.autoTop = clamp(Math.round(patch.autoTop), 0, 8);
  if (patch.autoRabatt != null) t.autoRabatt = patch.autoRabatt;
  t.topIds = t.autoTop > 0 ? topClubs(g, t.autoTop) : undefined;
}

// -----------------------------------------------------------------------------
// Bilanz der Prognosen (gespielte Spiele mit Spanne)
// -----------------------------------------------------------------------------
export function forecastRecord(club: Club): { games: number; n: number; hits: number; low: number; high: number } {
  let n = 0, hits = 0, low = 0, high = 0, games = 0;
  for (const e of club.stadium.seating?.log ?? []) {
    if (!e.fc) continue;
    games++;
    for (const k of CAT_KEYS) {
      const w = e.fc[k];
      if (!w) continue;
      const v = e.sold[k] ?? 0;
      n++;
      if (v < w[0]) low++; else if (v > w[1]) high++; else hits++;
    }
  }
  return { games, n, hits, low, high };
}

/** Kontingente des Normalfalls (Liga) für die Preistabelle. */
export const leagueCaps = (c: Club, year: number) => capsFor(c, year).caps;

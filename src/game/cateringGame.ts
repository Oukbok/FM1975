// =============================================================================
// Catering als Jahresentscheidung (Wunsch Pascal: Mini-Spiel statt fester Rechnung)
// -----------------------------------------------------------------------------
// Zu jeder Saison bieten drei Caterer einen Jahresvertrag mit fester Summe an –
// mal über, mal unter dem, was der Eigenbetrieb voraussichtlich bringt. Bis zum
// 31. Juli entscheidest du: Eigenbetrieb (Erlös je Besucher, hohe Fixkosten – läuft
// es sportlich, verdienst du mehr) oder Vertrag (feste Summe in Monatsraten,
// kaum Kosten – sichert dich gegen leere Ränge ab). Ohne Entscheidung: Eigenbetrieb.
// Angebote sind fest aus Saison und Verein abgeleitet (nichts gespeichert); gespeichert
// wird nur der unterschriebene Vertrag `ClubCommerce.cateringDeal`. Die Buchung läuft
// über die bestehende Verpachtung (engine/finances.ts: Pacht = Vertragssumme ÷ 12,
// kein Erlös je Besucher). Nur der eigene Verein.
// =============================================================================
import { CATERING_NETPERHEAD, CATERING_UPKEEP, clubPriceScale, expectedAttendance } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { hashStr, mulberry32 } from '../engine/leagues';
import type { Club } from '../types';
import type { Game } from './state';

export interface CateringOffer { caterer: string; annual: number }

const NAMES = ['Partyservice Brandt', 'Großküche Lehmann', 'Stadionküche {city}', 'Gastro-Service {city}', 'Imbissbetriebe Kröger', 'Feinkost Westphal', 'Bratwurst & Co. {city}', 'Kantinenwerk Sommer'];

const level = (c: Club) => Math.max(1, Math.min(5, Math.round(c.infrastructure?.catering ?? 1)));
const startYear = (season: string) => Number(season.slice(0, 4));

/** Letzter Tag der Entscheidung (31. Juli der Saison). */
export const cateringDeadline = (season: string) => `${startYear(season)}-07-31`;
export const cateringOpen = (g: Game) => g.calendar.currentDate <= cateringDeadline(g.season);

/** Heimspiele der Liga in dieser Saison. */
function homeGames(g: Game): number {
  return Math.max(5, (g.table?.rows?.length ?? 18) - 1);
}

/** Erwarteter Mehrertrag des Eigenbetriebs gegenüber einem Vertrag ohne Pacht (Saison, nominal) und Spanne. */
export function cateringExpectation(g: Game, c: Club): { mid: number; lo: number; hi: number; perGame: number } {
  const y = yearOf(g.calendar.currentDate);
  const lv = level(c);
  const att = expectedAttendance(c, undefined, y);
  const perGame = att * CATERING_NETPERHEAD.eigenbetrieb[lv] * clubPriceScale(c, y);
  const extraUpkeep = (CATERING_UPKEEP.eigenbetrieb[lv] - CATERING_UPKEEP.verpachtung[lv]) * 12 * economyScale(y);
  const mid = Math.max(0, perGame * homeGames(g) - extraUpkeep);
  // Zuschauer schwanken mit dem Erfolg: Spanne ±25 % auf den Erlös.
  const lo = Math.max(0, perGame * homeGames(g) * 0.75 - extraUpkeep), hi = perGame * homeGames(g) * 1.25 - extraUpkeep;
  return { mid: Math.round(mid), lo: Math.round(lo), hi: Math.round(hi), perGame: Math.round(perGame) };
}

/** Drei Angebote der Saison (fest aus Saison + Verein). Faktoren grob 0,78–1,08 des Erwartungswerts. */
export function cateringOffers(g: Game): CateringOffer[] {
  const c = g.clubs[g.managedClubId];
  const { mid } = cateringExpectation(g, c);
  const r = mulberry32(hashStr(`catering:${g.season}:${c.id}`));
  const names = [...NAMES].sort(() => r() - 0.5).slice(0, 3);
  const round = (x: number) => Math.max(1000, Math.round(x / 1000) * 1000);
  const f = [0.78 + r() * 0.1, 0.88 + r() * 0.1, 0.96 + r() * 0.12].sort((a, b) => b - a);
  return names.map((n, i) => ({ caterer: n.replace('{city}', c.city), annual: round(mid * f[i]) }));
}

/** Laufender Vertrag dieser Saison (null = Eigenbetrieb). */
export function cateringDealNow(g: Game): { caterer: string; annual: number } | null {
  const d = g.clubs[g.managedClubId]?.commerce?.cateringDeal;
  return d && d.season === g.season ? d : null;
}

/** Vertrag annehmen (index) bzw. null = Eigenbetrieb. Nur bis zum Stichtag. */
export function chooseCatering(g: Game, idx: number | null): string | null {
  if (!cateringOpen(g)) return `Die Entscheidung für ${g.season} ist gefallen – nächste Saison wieder.`;
  const c = g.clubs[g.managedClubId];
  const com = c.commerce ?? (c.commerce = { cateringMode: 'eigenbetrieb' });
  if (idx == null) { delete com.cateringDeal; com.cateringMode = 'eigenbetrieb'; return null; }
  const o = cateringOffers(g)[idx];
  if (!o) return 'Angebot nicht gefunden.';
  com.cateringDeal = { season: g.season, caterer: o.caterer, annual: o.annual };
  com.cateringMode = 'verpachtung';
  return null;
}

/** Saisonwechsel (game/season.ts) und Laden: abgelaufener Vertrag → Eigenbetrieb. Auch alte Spielstände
 *  (Verpachtung/Umsatzbeteiligung ohne Vertrag) wechseln zum nächsten Saisonstart in den Eigenbetrieb. */
export function cateringSeasonStart(g: Game, season = g.season): void {
  const c = g.clubs[g.managedClubId];
  const com = c?.commerce;
  if (!com) return;
  if (com.cateringDeal && com.cateringDeal.season === season) return;
  delete com.cateringDeal;
  com.cateringMode = 'eigenbetrieb';
}

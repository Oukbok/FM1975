// =============================================================================
// Umstellung alter Spielstände auf das realistische Finanzniveau (v11, Sammel-Update)
// -----------------------------------------------------------------------------
// Bis v10 lag das Finanzniveau beim Dreifachen der Recherche (Erstligist 1975 ≈ 15 Mio.
// statt ≈ 4,5 Mio. DM Umsatz, Gehälter ≈ das Fünffache). Ablösen und Marktwerte folgen
// weiter der echten Rekordkurve und bleiben unverändert. Diese Funktion rechnet alles
// Übrige eines alten Spielstands einmalig um; die Markierung `game.financeLevel`
// macht sie idempotent (zweiter Aufruf ändert nichts).
// =============================================================================
import type { Game } from './state';
import type { Club, Player } from '../types';
import { fairTicketPrice, wageForOverall } from '../engine/economy';
import { isLeagueClub } from '../engine/clubEconomy';

/** Aktuelles Finanzniveau (Markierung am Spielstand). */
export const FINANCE_LEVEL = 2;

/** Verhältnis neues ÷ altes Geldniveau (Umsätze, Kontostände, Kosten). */
export const FINANCE_FACTOR = 0.3;

/** Marktgehalt bis v10 (1975-Basis, DM/Woche). */
function oldMarketWage(overall: number): number {
  const top = Math.max(0, overall - 70);
  return Math.round(overall * 110 + top * top * 18);
}

/** Faktor, um ein altes Wochengehalt auf das neue Niveau zu bringen (Gefüge bleibt). */
function wageFactor(overall: number): number {
  return wageForOverall(overall) / Math.max(1, oldMarketWage(overall));
}

const r = (v: number, f: number) => Math.round(v * f);

function scaleRecord<T extends Record<string, number | undefined>>(o: T | undefined, f: number): void {
  if (!o) return;
  for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number') (o as Record<string, number>)[k] = r(v, f); }
}

function migrateClub(c: Club, players: Record<string, Player>, managed: boolean): void {
  const F = FINANCE_FACTOR;
  const fin = c.finances;
  if (fin) {
    fin.balance = r(fin.balance, F);
    fin.transferBudget = r(fin.transferBudget ?? 0, F);
    scaleRecord(fin.income as any, F);
    scaleRecord(fin.expenses as any, F);
    // TV-Topf 14 → 4,2 Mio., Vermarktungs-Bezug 11 → 4,5 Mio. (1975-Basis).
    if (fin.tvAnnual) fin.tvAnnual = r(fin.tvAnnual, 0.3);
    if (fin.commercialAnnual) fin.commercialAnnual = r(fin.commercialAnnual, 4.5 / 11);
    for (const h of fin.seasonHistory ?? []) {
      h.revenue = r(h.revenue, F); h.result = r(h.result, F); h.balanceEnd = r(h.balanceEnd, F);
      scaleRecord(h.income as any, F); scaleRecord(h.expenses as any, F);
    }
    for (const b of fin.balanceHistory ?? []) b.balance = r(b.balance, F);
    for (const t of fin.transactions ?? []) t.amount = r(t.amount, F);
    // Gehälter: Die Lohnsumme sinkt wie der Umsatz (Gehaltsquote bleibt), verteilt wird sie
    // nach der neuen, steileren Marktgehalts-Kurve – mit dem bisherigen Über-/Unterbezahlt-Verhältnis.
    const squad = c.playerIds.map((id) => players[id]).filter(Boolean);
    const oldSum = squad.reduce((a, p) => a + p.contract.weeklyWage, 0);
    const shaped = squad.map((p) => p.contract.weeklyWage * wageFactor(p.overall));
    const shapedSum = shaped.reduce((a, v) => a + v, 0);
    const k = shapedSum > 0 ? (oldSum * F) / shapedSum : 0;
    squad.forEach((p, i) => { p.contract.weeklyWage = Math.max(80, Math.round(shaped[i] * k)); });
    fin.wageBudget = Math.round((fin.wageBudget ?? 0) * F / 100) * 100;
    fin.currentWageBill = squad.reduce((a, p) => a + p.contract.weeklyWage, 0);
  }
  for (const l of c.loans ?? []) { l.principal = r(l.principal, F); l.remaining = r(l.remaining, F); l.monthlyRate = r(l.monthlyRate, F); }
  if (c.stadiumProject) c.stadiumProject.cost = r(c.stadiumProject.cost, F);
  if (c.namingRights) c.namingRights.annualValue = r(c.namingRights.annualValue, 0.5);
  if (c.corporate) {
    c.corporate.capitalRaised = r(c.corporate.capitalRaised, F);
    if (c.corporate.dividendsPaid) c.corporate.dividendsPaid = r(c.corporate.dividendsPaid, F);
  }
  // Eintritt: bisher 8–20 DM um einen fairen Preis von 8 + Ruf × 0,12; jetzt ≈ 5–10 DM.
  if (c.stadium) {
    const rep = c.reputation ?? 60;
    const oldFair = 8 + rep * 0.12;
    c.stadium.ticketPrice = Math.max(2, Math.round(c.stadium.ticketPrice * fairTicketPrice(rep) / oldFair * 2) / 2);
    // Auslastung: bisher ≈ 0,75 im Schnitt, jetzt Grundwert ≈ 0,5 × Nachfrage der Epoche.
    // Für den eigenen Verein bleibt der Abstand zur Liga (Fanstimmung) erhalten.
    c.stadium.averageAttendanceRate = Math.max(managed ? 0.2 : 0.15, Math.round(c.stadium.averageAttendanceRate * 0.67 * 1000) / 1000);
  }
}

/**
 * Rechnet einen alten Spielstand einmalig auf das neue Finanzniveau um (idempotent über
 * `game.financeLevel`). Neue Spiele setzen die Markierung bereits beim Anlegen.
 */
export function migrateFinanceLevel(g: Game): boolean {
  if ((g.financeLevel ?? 1) >= FINANCE_LEVEL) return false;
  const F = FINANCE_FACTOR;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  for (const c of Object.values(g.clubs)) {
    migrateClub(c, g.players, c.id === g.managedClubId);
    if (isLeagueClub(c)) c.finances.leagueTier = tier;
  }
  // Spieler ohne Verein (z. B. vereinslos) auf das neue Gehaltsniveau.
  const inClub = new Set(Object.values(g.clubs).flatMap((c) => c.playerIds));
  for (const p of Object.values(g.players)) {
    if (!inClub.has(p.id)) p.contract.weeklyWage = Math.max(80, r(p.contract.weeklyWage, wageFactor(p.overall)));
  }
  // Jugendspieler: 25 → 8 DM je Stärkepunkt.
  for (const p of Object.values(g.youthPlayers ?? {})) p.contract.weeklyWage = Math.max(40, r(p.contract.weeklyWage, 0.32));
  // Laufende Gehaltsverhandlungen (Ablösen bleiben, nur Gehälter).
  for (const t of g.transferTalks ?? []) {
    const p = g.players[t.playerId];
    if (t.terms && p) t.terms.wage = Math.max(80, r(t.terms.wage, wageFactor(p.overall)));
  }
  // Preisgelder der laufenden Wettbewerbe.
  const cups = [g.cup, ...Object.values(g.euroCups ?? {})] as ({ prizeByRound?: number[] } | null | undefined)[];
  for (const cup of cups) if (cup?.prizeByRound) cup.prizeByRound = cup.prizeByRound.map((v) => r(v, F));
  g.financeLevel = FINANCE_LEVEL;
  return true;
}

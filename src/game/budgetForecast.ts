// =============================================================================
// SAISONBUDGET — Prognose der Einnahmen und festen Kosten einer Saison
// -----------------------------------------------------------------------------
// Rechnet mit denselben Formeln wie die Buchungen (engine/finances.ts
// computeMonthly/homeMatchForecast, Stadionumfeld engine/grounds.ts, Nachwuchs
// engine/youthAcademy.ts, Mitarbeiter/Marketing wie game/day.ts): bereits Gebuchtes
// der laufenden Saison + Hochrechnung der restlichen Monate und Heimspiele.
// Alle Beträge nominal (DM bis 2001, danach intern weiter DM, Anzeige in EUR).
// =============================================================================
import { Club, ClubFinances } from '../types';
import { economyScale, revenueScale, tierScale, yearOf, clubTier } from '../engine/economy';
import { computeMonthly, homeMatchForecast, PLAYER_DRAW_BONUS, PLAYER_WIN_BONUS, weeklyWageBill } from '../engine/finances';
import { matchdayItems, monthlyItems } from '../engine/grounds';
import { annualCostBase } from '../engine/youthAcademy';
import { memberMonthlySalary } from '../engine/staffPeople';
import { staffMonthlyTotal } from '../data/staff';
import { marketingIncomeBase, marketingMonthlyBase } from '../data/marketing';
import { monthlyLoanCost } from '../engine/clubBusiness';
import { fanEra } from '../engine/environment';
import { PRIZE_BY_ROUND } from '../engine/cup';
import { Game } from './state';

/** Einnahme-Bereiche des Saisonbudgets (Spalte „Erwartete Einnahmen“). */
export type IncomeArea = 'tv' | 'sponsor' | 'tickets' | 'merch' | 'members' | 'prizes' | 'other';
export type IncomeSplit = Record<IncomeArea, number>;
export const INCOME_AREAS: { key: IncomeArea; label: string }[] = [
  { key: 'tv', label: 'Fernsehgelder' },
  { key: 'sponsor', label: 'Sponsoren & Vermarktung' },
  { key: 'tickets', label: 'Zuschauer & Spieltag' },
  { key: 'merch', label: 'Fanartikel' },
  { key: 'members', label: 'Mitgliedsbeiträge' },
  { key: 'prizes', label: 'Prämien' },
  { key: 'other', label: 'Sonstiges' },
];

export const emptyIncome = (): IncomeSplit => ({ tv: 0, sponsor: 0, tickets: 0, merch: 0, members: 0, prizes: 0, other: 0 });
export const sumIncome = (s: IncomeSplit) => Object.values(s).reduce((a, b) => a + b, 0);

/** Ist-Einnahmen der laufenden Saison je Bereich (ohne Transfererlöse, wie der Umsatz). */
export function incomeSoFar(fin: ClubFinances): IncomeSplit {
  const i = fin.income;
  return {
    tv: i.tvMoney,
    sponsor: i.sponsorship + (i.advertising ?? 0) + (i.commercial ?? 0),
    tickets: i.ticketSales + (i.catering ?? 0) + (i.matchday ?? 0),
    merch: i.merchandise,
    members: i.membership ?? 0,
    prizes: i.prizeMoney,
    other: i.other,
  };
}

/** Noch ausstehende Monatsabschlüsse bis Saisonende. */
export function monthsLeft(g: Game, fin: ClubFinances): number {
  const today = g.calendar.currentDate;
  const end = g.calendar.seasonEndDate;
  let y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7));
  let n = 0;
  for (let k = 0; k < 14; k++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const first = `${key}-01`;
    if (first > end) break;
    if (first >= today || (key === today.slice(0, 7) && fin.lastMonthlyBooking !== key)) n++;
    m++; if (m > 12) { m = 1; y++; }
  }
  return n;
}

/** Stärke-Rang 0..1 des Kaders in der Liga (1 = stärkster) – für erwartete Punkte/Prämien. */
export function strengthShare(g: Game, club: Club): number {
  const rows = g.table?.rows ?? [];
  const top = (c: Club) => {
    const o = c.playerIds.map((id) => g.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length);
  };
  const list = rows.map((r) => g.clubs[r.clubId]).filter(Boolean).map((c) => ({ id: c.id, s: top(c) })).sort((a, b) => b.s - a.s);
  const rank = list.findIndex((x) => x.id === club.id);
  if (rank < 0 || list.length < 2) return 0.5;
  return 1 - rank / (list.length - 1);
}

export interface SeasonForecast {
  /** Erwartete Einnahmen der ganzen Saison (gebucht + Hochrechnung). */
  income: IncomeSplit;
  /** Personal: Spieler, Betreuerstab, Mitarbeiter, Prämien (ganze Saison). */
  personnel: number;
  /** Betrieb: Stadion, Gebäude, Verwaltung, Vermarktung, Sicherheit, Kreditraten (ganze Saison). */
  operations: number;
  /** Laufende Kosten der Nachwuchsarbeit (ganze Saison). */
  youthRunning: number;
  /** Verbleibende Ligaheimspiele und Monate (Hochrechnung). */
  homeLeft: number;
  monthsLeft: number;
  /** Erwartete Siege/Remis der restlichen Ligaspiele. */
  winsLeft: number;
  drawsLeft: number;
}

/** Bisherige Ausgaben je Budgetposten (ohne Infrastruktur/Jugend-Investitionen – die führt budgetPlan.ts). */
export function personnelSoFar(fin: ClubFinances): number { return fin.expenses.wages + fin.expenses.staffWages; }

/**
 * Prognose der Saison aus dem Spielstand. Mitte der Saison: Gebuchtes + Rest.
 * Europapokal-Prämien über das bereits gebuchte Startgeld hinaus sind bewusst nicht
 * eingerechnet (vorsichtige Planung); der Landespokal mit zwei Runden.
 */
export function forecastSeason(g: Game, club: Club = g.clubs[g.managedClubId]): SeasonForecast {
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const scale = economyScale(year);
  const tier = clubTier(club);
  const fin = club.finances;
  const months = monthsLeft(g, fin);
  const m = computeMonthly(club, g.players, g.table, scale, year);
  const own = g.fixtures.filter((f) => !f.result && f.date >= today && f.date <= g.calendar.seasonEndDate
    && (f.homeClubId === club.id || f.awayClubId === club.id));
  const homeLeft = own.filter((f) => f.homeClubId === club.id).length;
  const share = strengthShare(g, club);
  const winRate = 0.22 + 0.3 * share, drawRate = 0.27;
  const winsLeft = own.length * winRate, drawsLeft = own.length * drawRate;
  const started = months < 11 || fin.income.ticketSales > 0;

  // --- Einnahmen (Rest der Saison) ---------------------------------------------------
  // Gegner im Schnitt: Ruf der Ligakonkurrenz (Zuschauer-Nachfrage hängt am Gegner).
  const opps = (g.table?.rows ?? []).map((r) => g.clubs[r.clubId]).filter((c) => c && c.id !== club.id);
  const awayRep = opps.length ? opps.reduce((a, c) => a + (c.reputation ?? 60), 0) / opps.length : 62;
  const hm = homeMatchForecast(club, year, awayRep);
  // Pokal: im Schnitt ein Heimspiel; Europapokal: eine Runde mit Heimspiel (vorsichtig).
  const inEuro = ['ec', 'cwc', 'uefa'].some((k) => (g.euroCups as any)?.[k]?.participantIds?.includes(club.id));
  const cupHome = started ? 0 : 1 + (inEuro ? 1 : 0);
  const gr = club.grounds;
  let grMatch = 0, grMatchCost = 0, grMonth = 0, grMonthCost = 0;
  if (gr) {
    for (const it of matchdayItems(club, gr, hm.attendance, year)) { if (it.amount > 0) grMatch += it.amount; else grMatchCost -= it.amount; }
    for (const it of monthlyItems(club, gr, year)) { if (it.amount > 0) grMonth += it.amount; else grMonthCost -= it.amount; }
  }
  const mkt = g.marketing ?? {};
  const mktInc = club.id === g.managedClubId ? marketingIncomeBase(mkt) : { merch: 0, sponsor: 0 };
  const md = tierScale(revenueScale('matchday', year), tier, 'matchday');
  // Sponsor-Leistungsprämien je Sieg/Remis (engine/finances.ts bookHomeMatch) + Platzierungsbonus.
  const winBonus = (6000 + club.reputation * 50) * md, drawBonus = 2000 * md;
  const placeMonthly = (share > 0.82 ? 9000 : share > 0.65 ? 4500 : share > 0.45 ? 2000 : 0) * tierScale(scale, tier, 'commercial');
  const cupPrize = started ? 0 : (PRIZE_BY_ROUND[0] + PRIZE_BY_ROUND[1] * (0.4 + 0.4 * share)) * scale;
  const rest: IncomeSplit = {
    tv: m.tv * months + cupHome * (2500 + club.reputation * 50) * revenueScale('tv', year)
      + (fin.tvAnnual ? 0 : (6000 + club.reputation * 120) * scale * homeLeft),
    sponsor: (m.sponsorship + m.advertising + m.commercial + mktInc.sponsor * scale) * months,
    tickets: (hm.tickets + hm.catering + hm.matchday) * (homeLeft + cupHome) + m.cateringLease * months,
    merch: hm.merch * (homeLeft + cupHome) + (m.merchGlobal + mktInc.merch * scale) * months,
    members: m.membership * months,
    prizes: winsLeft * winBonus + drawsLeft * drawBonus + placeMonthly * Math.max(0, months - 2) + cupPrize,
    other: 0,
  };
  // Stadionumfeld: Pachten/Shops monatlich (Vermarktung) und je Heimspiel (Spieltag).
  rest.tickets += grMatch * (homeLeft + cupHome);
  rest.sponsor += grMonth * months;

  const so = incomeSoFar(fin);
  const income = emptyIncome();
  for (const k of Object.keys(income) as IncomeArea[]) income[k] = Math.round(so[k] + rest[k]);

  // --- Kosten ---------------------------------------------------------------------------
  const weekly = weeklyWageBill(club, g.players);
  const staffMonthly = club.id === g.managedClubId
    ? (g.staff ? g.staff.reduce((a, s) => a + memberMonthlySalary(s, scale), 0) : staffMonthlyTotal(g.hiredStaff ?? [], scale)) : 0;
  const squadBonus = weekly * scale * (winsLeft * PLAYER_WIN_BONUS + drawsLeft * PLAYER_DRAW_BONUS);
  const personnel = personnelSoFar(fin) + (m.wages + m.staffWages + staffMonthly) * months + squadBonus;
  const revenue = sumIncome(income);
  const opsMonthly = m.stadiumMaintenance + m.facilities + m.otherFixed + m.operations
    + (club.id === g.managedClubId ? marketingMonthlyBase(mkt) * scale : 0) + monthlyLoanCost(club) + grMonthCost
    + (revenue * fanEra(year).securityShare) / 12;
  const inv = club.youthInvest;
  const youthRunning = inv ? annualCostBase(inv) / 12 * tierScale(scale, tier, 'matchday') * months : 0;
  const opsSoFar = fin.expenses.stadiumMaintenance + (fin.expenses.facilities ?? 0) + (fin.expenses.operations ?? 0) + fin.expenses.other;
  return {
    income,
    personnel: Math.round(personnel),
    operations: Math.round(opsSoFar + opsMonthly * months + grMatchCost * homeLeft),
    youthRunning: Math.round(youthRunning),
    homeLeft, monthsLeft: months, winsLeft, drawsLeft,
  };
}

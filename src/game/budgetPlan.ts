// =============================================================================
// SAISONBUDGET — Planung, Wirkung und Saisonbilanz (Wunsch Pascal, Vorbild EA FM)
// -----------------------------------------------------------------------------
// Zu Saisonbeginn legt der Finanzberater einen Plan vor (Einnahmen-Prognose aus
// game/budgetForecast.ts, Budgets je Posten). Du verschiebst die Budgets oder
// bestätigst einfach – ohne Bestätigung gilt der Vorschlag des Beraters.
// Wirkung:
//  • Gehälter  → finances.wageBudget (Wochen-Grundgehalt, 1975-Basis) = harte Obergrenze
//                für neue Verträge/Verlängerungen (contracts.ts, transferTalks.ts).
//  • Transfers → finances.transferBudget (Änderungen werden als Differenz verbucht).
//  • Infrastruktur / Jugend → Rahmen für Bauvorhaben (Stadion, Gelände, Akademie);
//                laufende Akademie-Kosten zählen aufs Jugendbudget.
//  • Reserve   → was am Saisonende auf dem Konto bleiben soll (Vorgabe des Vorstands).
// Saisonende: Soll/Ist, Bilanz des Beraters, Vorstand reagiert (nur auf bestätigte Pläne).
// Optionales Spielstandfeld `game.budget`, Migration `migrateBudget` (idempotent).
// =============================================================================
import { Club } from '../types';
import { economyScale, yearOf } from '../engine/economy';
import { totalExpense, WAGE_OVERHEAD } from '../engine/finances';
import { hasTransferBan, lastRevenue } from '../engine/clubEconomy';
import { boardBudgetShare } from '../engine/environment';
import { makeMessage, pushMessage } from '../engine/messages';
import { memberMonthlySalary } from '../engine/staffPeople';
import { staffMonthlyTotal } from '../data/staff';
import { formatMoney } from '../engine/economy';
import { forecastSeason, IncomeSplit, incomeSoFar, personnelSoFar, sumIncome } from './budgetForecast';
import { Game } from './state';

export type BudgetKey = 'wages' | 'transfers' | 'infra' | 'youth' | 'other';
export type BudgetSplit = Record<BudgetKey, number>;
export const BUDGET_KEYS: { key: BudgetKey; label: string; short: string }[] = [
  { key: 'wages', label: 'Gehälter', short: 'Gehälter' },
  { key: 'transfers', label: 'Transfers', short: 'Transfer' },
  { key: 'infra', label: 'Infrastruktur', short: 'Infrastr.' },
  { key: 'youth', label: 'Jugend', short: 'Jugend' },
  { key: 'other', label: 'Betrieb & Sonstiges', short: 'Sonstiges' },
];

export interface BudgetPlan {
  season: string;
  date: string;
  /** Erwartete Einnahmen der Saison je Bereich (nominal). */
  income: IncomeSplit;
  /** Kontostand vor allen Buchungen der Saison (nominal). */
  balanceBase: number;
  /** Mindestreserve des Vorstands am Saisonende (nominal). */
  reserveMin: number;
  /** Feste Kosten laut Prognose: Personal (aktueller Kader), Betrieb, laufende Nachwuchskosten. */
  fixed: { personnel: number; operations: number; youthRunning: number; staffAnnual: number };
  advice: BudgetSplit;
  chosen: BudgetSplit;
  confirmed?: boolean;
  /** Bereits angewandte Reaktionen (Vorstand/Fans), damit erneutes Bestätigen nicht stapelt. */
  applied?: { board: number; fans: number };
  /** Ausgaben für Bau/Akademie seit Saisonbeginn (nominal). */
  spent: { infra: number; youth: number; youthBuild?: number };
  /** Saisonbilanz (beim Saisonwechsel geschrieben). */
  result?: { income: IncomeSplit; spent: BudgetSplit; balanceEnd: number; boardDelta: number };
}

export interface BudgetState { plans: BudgetPlan[]; pending?: string; advisor?: { name: string } }

const r3 = (v: number) => { // auf drei gültige Stellen runden (ruhigere Zahlen)
  if (!v) return 0;
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(v))) - 2));
  return Math.round(v / p) * p;
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sim = (g: Game) => !!(g as any).simAutoManage;

export function budgetState(g: Game): BudgetState {
  if (!g.budget) g.budget = { plans: [] };
  return g.budget;
}
export function planFor(g: Game, season = g.season): BudgetPlan | undefined {
  return g.budget?.plans.find((p) => p.season === season);
}

/** Mindestreserve-Anteil am Umsatz: strenger nach 2002 (Lizenzierung, Kirch-Pleite), bei Schulden/Auflagen. */
export function reserveShare(g: Game, club: Club, year: number): number {
  let s = year < 1988 ? 0.08 : year < 2002 ? 0.1 : 0.12;
  if ((club.loans ?? []).length) s += 0.03;
  if ((club.finances.ffp?.warnings ?? 0) > 0 || club.finances.ffp?.banSeason) s += 0.04;
  if ((club.boardConfidence ?? 60) < 40) s += 0.02;
  return s;
}

/** Verfügbare Mittel der Saison = Kontostand zu Saisonbeginn + erwartete Einnahmen. */
export const planFunds = (p: BudgetPlan) => p.balanceBase + sumIncome(p.income);
export const planRevenue = (p: BudgetPlan) => Math.max(1, sumIncome(p.income));
/** Wirksame Ausgaben je Posten: gebundene Kosten zählen, auch wenn das Budget darunter liegt. */
export function effectiveSpend(p: BudgetPlan, s: BudgetSplit): BudgetSplit {
  return {
    wages: Math.max(s.wages, p.fixed.personnel),
    transfers: s.transfers,
    infra: s.infra,
    youth: Math.max(s.youth, p.fixed.youthRunning),
    other: p.fixed.operations,
  };
}
/** Erwarteter Kontostand am Saisonende bei diesen Budgets (= Reserve). */
export function plannedReserve(p: BudgetPlan, s: BudgetSplit = p.chosen): number {
  const e = effectiveSpend(p, s);
  return planFunds(p) - e.wages - e.transfers - e.infra - e.youth - e.other;
}

/** Spannweite der Regler je Posten (nominal). */
export function sliderRange(p: BudgetPlan, key: BudgetKey, ist: number): [number, number] {
  const rev = planRevenue(p);
  const lo = Math.max(0, ist);
  switch (key) {
    case 'wages': return [Math.max(lo, r3(rev * 0.35)), r3(Math.max(rev * 1.1, p.fixed.personnel * 1.3))];
    case 'transfers': return [lo, r3(Math.max(rev * 0.6, p.advice.transfers * 2.5, lo))];
    case 'infra': return [lo, r3(Math.max(rev * 0.3, lo))];
    case 'youth': return [lo, r3(Math.max(rev * 0.12, p.fixed.youthRunning * 2, lo))];
    default: return [p.fixed.operations, p.fixed.operations];
  }
}

function staffAnnual(g: Game, scale: number): number {
  const m = g.staff ? g.staff.reduce((a, s) => a + memberMonthlySalary(s, scale), 0) : staffMonthlyTotal(g.hiredStaff ?? [], scale);
  return m * 12;
}

/** Vorschlag des Beraters (setzt die bisherige Vorstandslogik fort, ohne die Reserve zu verletzen). */
function adviceFor(g: Game, club: Club, p: BudgetPlan, boardRelease: number, banned: boolean): BudgetSplit {
  const rev = planRevenue(p);
  // Gehaltsrahmen wie bisher (game/seasonFinance.ts): 60 % des Umsatzes für Spieler, Stab und Prämien,
  // dazu die Mitarbeiter des Vereins.
  const wages = r3(0.6 * rev + p.fixed.staffAnnual);
  const youthRun = p.fixed.youthRunning;
  let rest = planFunds(p) - Math.max(wages, p.fixed.personnel) - p.fixed.operations - youthRun - p.reserveMin;
  const transfers = banned ? 0 : r3(clamp(Math.min(boardRelease, rest), 0, Infinity));
  rest -= transfers;
  const infra = r3(clamp(Math.min(0.06 * rev, rest * 0.5), 0, Infinity));
  rest -= infra;
  const youth = r3(youthRun + clamp(Math.min(0.02 * rev, rest * 0.4), 0, Infinity));
  void club;
  return { wages, transfers, infra, youth, other: p.fixed.operations };
}

/** Plan der laufenden Saison neu anlegen (Saisonwechsel, Spielbeginn) und zum Anzeigen vormerken. */
export function recordBudgetPlan(g: Game, opts: { pending?: boolean; keepBudgets?: boolean } = {}): BudgetPlan | undefined {
  const club = g.clubs[g.managedClubId];
  if (!club) return undefined;
  const st = budgetState(g);
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const fc = forecastSeason(g, club);
  const fin = club.finances;
  const soFar = sumIncome(incomeSoFar(fin));
  const balanceBase = Math.round(fin.balance - soFar + totalExpense(fin));
  const income = fc.income;
  const rev = Math.max(1, sumIncome(income));
  const sa = Math.round(staffAnnual(g, scale));
  const p: BudgetPlan = {
    season: g.season, date: g.calendar.currentDate, income, balanceBase,
    reserveMin: r3(rev * reserveShare(g, club, year)),
    fixed: { personnel: fc.personnel, operations: r3(fc.operations), youthRunning: r3(fc.youthRunning), staffAnnual: sa },
    advice: { wages: 0, transfers: 0, infra: 0, youth: 0, other: 0 },
    chosen: { wages: 0, transfers: 0, infra: 0, youth: 0, other: 0 },
    spent: { infra: 0, youth: 0 },
  };
  const banned = hasTransferBan(club, g.season);
  if (opts.keepBudgets) {
    // Alter Spielstand mitten in der Saison: bestehende Budgets übernehmen (nichts ändern).
    const wages = Math.round(fin.wageBudget * 52 * WAGE_OVERHEAD * scale + sa);
    const transfers = Math.round(fin.transferBudget * scale + fin.expenses.transferExpense);
    p.advice = { wages, transfers, infra: r3(Math.max(0, 0.04 * rev)), youth: r3(p.fixed.youthRunning * 1.1), other: p.fixed.operations };
  } else {
    // Freigabe des Vorstands wie bisher (Polster über einem Viertel Umsatz × Vertrauensanteil).
    const release = Math.max(0, fin.balance - 0.25 * lastRevenue(club, year)) * boardBudgetShare(club.boardConfidence ?? 60);
    p.advice = adviceFor(g, club, p, release, banned);
  }
  p.chosen = { ...p.advice };
  st.plans = st.plans.filter((x) => x.season !== g.season);
  st.plans.push(p);
  if (st.plans.length > 60) st.plans.splice(0, st.plans.length - 60);
  if (!opts.keepBudgets) applyBudget(g, p, undefined);
  if (opts.pending && !sim(g)) st.pending = g.season;
  return p;
}

/** Budgets im Spiel wirksam machen (Gehaltsrahmen, Transferbudget). `prev` = vorherige Wahl. */
export function applyBudget(g: Game, p: BudgetPlan, prev: BudgetSplit | undefined): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const fin = club.finances;
  fin.wageBudget = Math.max(0, Math.round((p.chosen.wages - p.fixed.staffAnnual) / (52 * WAGE_OVERHEAD * scale) / 100) * 100);
  if (hasTransferBan(club, g.season)) { fin.transferBudget = 0; return; }
  if (!prev) {
    // Neuer Plan: Transferbudget = Budget abzüglich der in dieser Saison schon gezahlten Ablösen.
    fin.transferBudget = Math.max(0, Math.round((p.chosen.transfers - fin.expenses.transferExpense) / scale / 1000) * 1000);
  } else {
    fin.transferBudget = Math.max(0, Math.round((fin.transferBudget + (p.chosen.transfers - prev.transfers) / scale) / 1000) * 1000);
  }
}

/** Ist-Werte der laufenden Saison je Posten (nominal). */
export function spentNow(g: Game, p: BudgetPlan): BudgetSplit {
  const fin = g.clubs[g.managedClubId].finances;
  const wages = personnelSoFar(fin);
  const transfers = fin.expenses.transferExpense;
  const infra = p.spent.infra, youth = p.spent.youth;
  const other = Math.max(0, totalExpense(fin) - wages - transfers - infra - youth);
  return { wages, transfers, infra, youth, other };
}

// -----------------------------------------------------------------------------
// Reaktionen von Vorstand, Fans und Sponsoren (0–100)
// -----------------------------------------------------------------------------
export interface Reactions { board: number; fans: number; sponsors: number }
export function reactionsFor(g: Game, p: BudgetPlan, s: BudgetSplit): Reactions {
  const club = g.clubs[g.managedClubId];
  const rev = planRevenue(p);
  const reserveGap = (plannedReserve(p, s) - p.reserveMin) / rev;
  const amb = (s.transfers + s.wages) / Math.max(1, p.advice.transfers + p.advice.wages) - 1;
  const wageRatio = Math.max(s.wages, p.fixed.personnel) / rev;
  const mood = g.environment?.fanMood ?? 55;
  const conf = club?.boardConfidence ?? 60;
  return {
    board: Math.round(clamp(64 + clamp(reserveGap, -0.6, 0.25) * 110 - Math.max(0, wageRatio - 0.7) * 120 + (conf - 60) / 4 + (s.youth - p.advice.youth) / rev * 60, 2, 98)),
    fans: Math.round(clamp(56 + clamp(amb, -0.5, 0.6) * 70 + (s.infra - p.advice.infra) / rev * 90 + (mood - 55) / 3, 2, 98)),
    sponsors: Math.round(clamp(58 + clamp(amb, -0.5, 0.5) * 35 + (s.infra - p.advice.infra) / rev * 110 - Math.max(0, -reserveGap) * 70, 2, 98)),
  };
}
export const reactionLabel = (v: number) => v >= 75 ? 'Begeistert' : v >= 60 ? 'Zufrieden' : v >= 45 ? 'Abwartend' : v >= 30 ? 'Unzufrieden' : 'Verärgert';

/** Wirkung einer Wahl gegenüber dem Vorschlag: Vorstandsvertrauen und Fan-Stimmung (Punkte). */
export function reactionEffects(g: Game, p: BudgetPlan, s: BudgetSplit): { board: number; fans: number } {
  const a = reactionsFor(g, p, p.advice), r = reactionsFor(g, p, s);
  return { board: clamp(Math.round((r.board - a.board) / 7), -6, 3), fans: clamp(Math.round((r.fans - a.fans) / 8), -3, 3) };
}

/** Wahl übernehmen und bestätigen (Popup oder Finanzen › Budget). */
export function confirmBudget(g: Game, chosen: BudgetSplit): BudgetPlan | undefined {
  const p = planFor(g);
  if (!p) return undefined;
  const club = g.clubs[g.managedClubId];
  const ist = spentNow(g, p);
  const next: BudgetSplit = { ...chosen, other: p.fixed.operations };
  for (const k of ['wages', 'transfers', 'infra', 'youth'] as BudgetKey[]) next[k] = Math.max(Math.round(next[k]), k === 'wages' ? 0 : Math.round(ist[k]));
  if (hasTransferBan(club, g.season)) next.transfers = 0;
  const prev = { ...p.chosen };
  p.chosen = next;
  p.confirmed = true;
  const eff = reactionEffects(g, p, next);
  const before = p.applied ?? { board: 0, fans: 0 };
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + eff.board - before.board, 0, 100);
  if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood + eff.fans - before.fans, 0, 100);
  p.applied = eff;
  applyBudget(g, p, prev);
  return p;
}

export function clearPendingBudget(g: Game): void { if (g.budget) g.budget.pending = undefined; }

// -----------------------------------------------------------------------------
// Grenzen im Spiel
// -----------------------------------------------------------------------------
/** Faktor auf den Gehaltsrahmen: mit Saisonbudget harte Grenze, sonst wie früher 115 %. */
export function wageLimitFactor(g: Game): number { return planFor(g) ? 1 : 1.15; }

/** Freier Rahmen für Bau (infra) bzw. Akademie-Ausbau (youth), nominal. */
export function budgetRoom(g: Game, key: 'infra' | 'youth'): number | undefined {
  const p = planFor(g);
  if (!p || sim(g)) return undefined;
  if (key === 'infra') return p.chosen.infra - p.spent.infra;
  // Jugend: laufende Kosten der ganzen Saison sind schon verplant.
  const build = p.spent.youthBuild ?? 0;
  return p.chosen.youth - Math.max(p.fixed.youthRunning, p.spent.youth - build) - build;
}

/** Prüft eine Ausgabe gegen das Budget (eigener Verein). null = erlaubt. */
export function checkBudget(g: Game, key: 'infra' | 'youth', nominal: number): string | null {
  const room = budgetRoom(g, key);
  if (room == null || nominal <= 0) return null;
  if (nominal <= room + 1) return null;
  const y = yearOf(g.calendar.currentDate);
  const label = key === 'infra' ? 'Infrastruktur-Budget' : 'Jugendbudget';
  return `Das ${label} reicht nicht: frei sind noch ${formatMoney(Math.max(0, room), y)}, nötig wären ${formatMoney(nominal, y)}. Du kannst die Budgets unter Finanzen › Budget umschichten.`;
}

/** Ausgabe auf ein Budget buchen (nur der eigene Verein). */
export function noteBudgetSpend(g: Game, key: 'infra' | 'youth', nominal: number, build = true): void {
  const p = planFor(g);
  if (!p || nominal <= 0) return;
  p.spent[key] = Math.round(p.spent[key] + nominal);
  if (key === 'youth' && build) p.spent.youthBuild = Math.round((p.spent.youthBuild ?? 0) + nominal);
}

// -----------------------------------------------------------------------------
// Saisonende
// -----------------------------------------------------------------------------
/** Bilanz schreiben (vor closeFinancialSeason, solange die Saisontöpfe noch gefüllt sind). */
export function closeBudgetPlan(g: Game, season: string, date: string): void {
  const p = planFor(g, season);
  const club = g.clubs[g.managedClubId];
  if (!p || !club || p.result) return;
  const year = yearOf(date);
  const spent = spentNow(g, p);
  const income = incomeSoFar(club.finances);
  const balanceEnd = Math.round(club.finances.balance);
  const rev = planRevenue(p);
  let boardDelta = 0;
  if (p.confirmed && !sim(g)) {
    boardDelta = balanceEnd >= p.reserveMin ? (balanceEnd >= p.reserveMin + 0.1 * rev ? 2 : 1)
      : -clamp(Math.round((p.reserveMin - balanceEnd) / rev * 20), 1, 6);
    if (spent.wages > p.chosen.wages * 1.05) boardDelta -= 1;
    club.boardConfidence = clamp((club.boardConfidence ?? 60) + boardDelta, 0, 100);
  }
  p.result = { income, spent, balanceEnd, boardDelta };
  if (sim(g)) return;
  const f = (v: number) => formatMoney(v, year);
  const inc = sumIncome(income), plan = sumIncome(p.income);
  const dev = Math.round((inc / Math.max(1, plan) - 1) * 100);
  pushMessage(g.messages, makeMessage({
    date, category: 'board', from: 'Finanzberater',
    subject: `Budgetbilanz ${season}: Kontostand ${f(balanceEnd)}`,
    shortText: balanceEnd >= p.reserveMin ? 'Die Reserve des Vorstands ist gehalten.' : 'Die Reserve des Vorstands wurde unterschritten.',
    bodyText: [
      `Einnahmen ${f(inc)} statt geplanter ${f(plan)} (${dev >= 0 ? '+' : ''}${dev} %).`,
      `Gehälter ${f(spent.wages)} (Budget ${f(p.chosen.wages)}), Ablösen ${f(spent.transfers)} (Budget ${f(p.chosen.transfers)}), Infrastruktur ${f(spent.infra)} (Budget ${f(p.chosen.infra)}), Jugend ${f(spent.youth)} (Budget ${f(p.chosen.youth)}).`,
      `Kontostand am Saisonende ${f(balanceEnd)}, Mindestreserve ${f(p.reserveMin)}.`,
      p.confirmed ? `Der Vorstand ${boardDelta >= 0 ? 'ist zufrieden' : 'ist verärgert'} (Vertrauen ${boardDelta >= 0 ? '+' : ''}${boardDelta}).` : 'Du hattest den Vorschlag des Beraters übernommen; der Vorstand bewertet das Ergebnis nicht gesondert.',
      'Den Plan der neuen Saison findest du unter Finanzen › Budget.',
    ].join('\n'),
  }));
}

/** Alter Spielstand: Plan der laufenden Saison aus den bestehenden Budgets anlegen (nie Popup). */
export function migrateBudget(g: Game): void {
  const st = budgetState(g);
  st.pending = undefined;
  if (!g.clubs[g.managedClubId]) return;
  if (!planFor(g)) recordBudgetPlan(g, { keepBudgets: true });
}

// =============================================================================
// SAISONBUDGET — Anzeigedaten: Saisonziele, Finanzberater, Kontext für die Texte
// =============================================================================
import { Club } from '../types';
import { DM_PER_EUR, economyScale, yearOf } from '../engine/economy';
import { AdvisorCtx, advisorText, AdvisorText } from '../engine/budgetAdvisor';
import { tvPoolFor } from '../engine/tvMoney';
import { monthlyLoanCost } from '../engine/clubBusiness';
import { hasTransferBan } from '../engine/clubEconomy';
import { recordFeeEUR } from '../data/transferRecords';
import { EURO_COMP_NAMES, EuroCompId } from '../data/europe';
import { makeName, pickOrigin } from '../data/origins';
import { mulberry32, hashStr } from '../engine/leagues';
import { STAFF_BY_ID } from '../data/staff';
import { BudgetPlan, BudgetSplit, budgetState, planRevenue, plannedReserve } from './budgetPlan';
import { strengthShare, sumIncome } from './budgetForecast';
import { Game } from './state';

export interface SeasonGoal { kind: 'league' | 'cup' | 'euro'; title: string; goal: string }

/** Saisonziele des Vorstands (nur Anzeige): Liga aus `boardExpectation`, Pokal/Europa nach Kaderstärke. */
export function seasonGoals(g: Game): SeasonGoal[] {
  const club = g.clubs[g.managedClubId];
  const out: SeasonGoal[] = [];
  if (!club) return out;
  out.push({ kind: 'league', title: g.leagues?.playerDivision?.name ?? 'Liga', goal: club.boardExpectation || 'Gesicherter Mittelfeldplatz' });
  const share = strengthShare(g, club);
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  if (g.cup?.participantIds?.includes(club.id)) {
    const cg = tier >= 2 ? (share > 0.7 ? '2. Runde' : '1. Runde überstehen')
      : share > 0.85 ? 'Halbfinale' : share > 0.6 ? 'Viertelfinale' : share > 0.35 ? 'Achtelfinale' : '2. Runde';
    out.push({ kind: 'cup', title: 'Landespokal', goal: cg });
  }
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const cup = (g.euroCups as any)?.[comp];
    if (cup?.participantIds?.includes(club.id)) {
      out.push({ kind: 'euro', title: EURO_COMP_NAMES[comp], goal: share > 0.85 ? 'Viertelfinale' : share > 0.6 ? 'Achtelfinale' : '2. Runde' });
    }
  }
  return out;
}

export interface AdvisorPerson { name: string; role: string; id: string }

/** Finanzberater: kaufmännischer Leiter, Schatzmeister oder Geschäftsstelle aus dem Stab; sonst der Schatzmeister des Präsidiums. */
export function advisorOf(g: Game): AdvisorPerson {
  const staff = g.staff ?? [];
  for (const role of ['kaufm_leiter', 'schatzmeister', 'verwaltung']) {
    const m = staff.find((s) => s.roleId === role);
    if (m) return { name: m.name, role: STAFF_BY_ID[role]?.name ?? 'Finanzen', id: `staff:${m.id}` };
  }
  const st = budgetState(g);
  if (!st.advisor) {
    const r = mulberry32(hashStr(`budget-advisor:${g.managedClubId}`));
    const n = makeName(pickOrigin(1975, r, true), r);
    st.advisor = { name: `${n.firstName} ${n.lastName}` };
  }
  const corp = !!g.clubs[g.managedClubId]?.corporate;
  return { name: st.advisor.name, role: corp ? 'Finanzvorstand' : 'Schatzmeister (Präsidium)', id: `advisor:${g.managedClubId}` };
}

/** Ablöse eines Stammspielers auf Vereinsniveau (Median der Liga, nominal). */
function typicalFee(g: Game, club: Club, year: number): number {
  const ids = new Set((g.table?.rows ?? []).map((r) => r.clubId));
  const top = club.playerIds.map((id) => g.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
  const avg = top.reduce((a, b) => a + b, 0) / Math.max(1, top.length);
  const vals = Object.values(g.players)
    .filter((p) => ids.has(p.clubId) && !p.isYouth && Math.abs(p.overall - avg) <= 3 && p.contract?.transferValue > 0)
    .map((p) => p.contract.transferValue).sort((a, b) => a - b);
  if (!vals.length) return 0;
  return vals[vals.length >> 1] * economyScale(year);
}

/** Texte des Beraters für einen Plan und eine (vorläufige) Wahl. */
export function advisorFor(g: Game, p: BudgetPlan, s: BudgetSplit): AdvisorText {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(p.date);
  const rev = planRevenue(p);
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const sh = (v: number) => v / rev;
  const goal = club.boardExpectation ?? '';
  const ctx: AdvisorCtx = {
    year, seed: `${p.season}:${g.managedClubId}`, tier, revenue: sumIncome(p.income),
    shares: { tv: sh(p.income.tv), sponsor: sh(p.income.sponsor), tickets: sh(p.income.tickets), merch: sh(p.income.merch), members: sh(p.income.members), prizes: sh(p.income.prizes) },
    balanceBase: p.balanceBase, reserveMin: p.reserveMin, reservePlanned: plannedReserve(p, s),
    personnelFixed: p.fixed.personnel, operations: p.fixed.operations, youthRunning: p.fixed.youthRunning,
    loansAnnual: monthlyLoanCost(club) * 12,
    b: { wages: s.wages, transfers: s.transfers, infra: s.infra, youth: s.youth },
    advice: { wages: p.advice.wages, transfers: p.advice.transfers, infra: p.advice.infra, youth: p.advice.youth },
    typicalFee: typicalFee(g, club, year),
    recordFee: recordFeeEUR(year, 'germany') * DM_PER_EUR,
    goal, relegation: /Klassenerhalt/i.test(goal) || strengthShare(g, club) < 0.3,
    euro: seasonGoals(g).some((x) => x.kind === 'euro'),
    banned: hasTransferBan(club, p.season),
    tvDropShare: tier < 4 ? tvPoolFor(tier + 1, year) / Math.max(1, tvPoolFor(tier, year)) : 0,
    lastWageRatio: club.finances.seasonHistory?.slice(-1)[0]?.wageRatio,
  };
  return advisorText(ctx);
}

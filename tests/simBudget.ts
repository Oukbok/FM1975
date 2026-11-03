// =============================================================================
// Sim-Bericht Saisonbudget (BUDGET=1 in tests/sim.ts): Würden die Grenzen aus
// game/budgetPlan.ts einen menschlich geführten eigenen Verein unsinnig blockieren?
// Die Simulation führt den eigenen Verein automatisch (simAutoManage, dort greifen die
// Grenzen nicht) – hier wird je Saison nachgerechnet, was ein Mensch mit dem Vorschlag
// des Beraters dürfte: Gehaltsauslastung zum Saisonstart, Verlängerungen der auslaufenden
// Verträge zur Forderung, Transferbudget, Infrastruktur-Rahmen gegen einen Stadionausbau.
// =============================================================================
import type { Game } from '../src/game/state';
import { planFor, plannedReserve, planRevenue } from '../src/game/budgetPlan';
import { demandFor } from '../src/game/contracts';
import { economyScale, yearOf } from '../src/engine/economy';
import { stadiumPlan } from '../src/engine/clubBusiness';

const S = { on: false, seen: '', rows: [] as { s: string; use: number; renew: number; renewN: number; tr: number; infra: number; stad: number; res: number }[] };
export function budgetInit(on: boolean): void { S.on = on; }

/** Täglich vor processDay: am 15.9. (Plan steht, Sommer-Transfers durch) und 15.3. (Verlängerungen) messen. */
export function budgetCheck(g: Game): void {
  if (!S.on) return;
  const today = g.calendar.currentDate;
  const md = today.slice(5);
  if (md !== '09-15' && md !== '03-15') return;
  const p = planFor(g);
  const club = g.clubs[g.managedClubId];
  if (!p || !club) return;
  const sq = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const sum = sq.reduce((a, x) => a + x.contract.weeklyWage, 0);
  const lim = club.finances.wageBudget || 1;
  const year = yearOf(today);
  const scale = economyScale(year);
  const rev = planRevenue(p);
  if (md === '09-15') {
    const sp = stadiumPlan(club, year);
    S.rows.push({ s: g.season, use: sum / lim, renew: 0, renewN: 0, tr: (p.chosen.transfers / rev), infra: p.chosen.infra / rev, stad: sp ? p.chosen.infra / sp.cost : -1, res: plannedReserve(p) / rev });
    return;
  }
  // 15.3.: Verträge, die am 30.6. auslaufen – würde der Vorstand die Forderung freigeben?
  const row = S.rows.find((r) => r.s === g.season);
  if (!row) return;
  const endY = Number(g.season.slice(0, 4)) + 1;
  const exp = sq.filter((x) => Number(x.contract.expiryDate.slice(0, 4)) <= endY && x.overall >= 55);
  let blocked = 0;
  for (const x of exp) {
    const d = demandFor(g, x);
    const wages = sum - x.contract.weeklyWage + d.wage;
    if (d.wage > x.contract.weeklyWage && wages > lim) blocked++;
  }
  row.renew = blocked; row.renewN = exp.length;
  void scale;
}

export function budgetSummary(): void {
  if (!S.on || !S.rows.length) return;
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  console.log('BUDGET Saison  | Gehälter/Rahmen 15.9. | Verlängerungen blockiert | Transfer/Umsatz | Infra/Umsatz | Infra/Stadionausbau | Reserve/Umsatz');
  for (const r of S.rows) console.log(`BUDGET ${r.s} | ${pct(r.use).padStart(6)} | ${r.renew}/${r.renewN} | ${pct(r.tr)} | ${pct(r.infra)} | ${r.stad < 0 ? '–' : pct(r.stad)} | ${pct(r.res)}`);
  const over = S.rows.filter((r) => r.use > 1).length;
  const bl = S.rows.reduce((a, r) => a + r.renew, 0), n = S.rows.reduce((a, r) => a + r.renewN, 0);
  console.log(`BUDGET gesamt: Saisons mit Gehältern über dem Rahmen ${over}/${S.rows.length}, Verlängerungen blockiert ${bl}/${n}, Ø Transfer ${pct(S.rows.reduce((a, r) => a + r.tr, 0) / S.rows.length)}, Ø Infra ${pct(S.rows.reduce((a, r) => a + r.infra, 0) / S.rows.length)} des Umsatzes`);
}

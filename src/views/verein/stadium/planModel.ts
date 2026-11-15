// =============================================================================
// PLANUNGSMODUS „STADION AUSBAUEN“ (Wunsch Pascal) – nur Oberfläche, ohne eigene
// Bau-Rechnung: Der Entwurf ist eine Liste geplanter Blöcke (Zielzustand je Block).
// Kosten, Bauzeit, Fanstimmung und Genehmigung kommen aus groupPlanFor
// (game/stadiumGame.ts → engine/stadiumBlocks.ts planBlock), die gesperrten Plätze
// aus buildLoss, Kasse/Saisonbudget/Bank aus buildBlocker, Plätze je Kategorie aus
// blockCaps (engine/seating.ts), Eintritt/Zuschauer aus expectedSale, Komfort aus
// stadiumComfort. Gebaut wird mit startBlockBuild – alle Blöcke in einem Projekt.
// =============================================================================
import { addMonths, BLOCK_IDS, blocksCapacity } from '../../../engine/stadiumBlocks';
import { blockCaps, expectedSale, saleRevenue } from '../../../engine/seating';
import { stadiumComfort } from '../../../engine/stadiumStandard';
import { yearOf } from '../../../engine/economy';
import { checkBudget } from '../../../game/budgetPlan';
import { buildBlocker, buildLoss, groupPlanFor } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { BlockId, Club, SeatNums, StadiumBlock } from '../../../types';

export type PlanMap = Partial<Record<BlockId, StadiumBlock>>;
export type PlanFin = 'cash' | 10 | 20;

const same = (a: StadiumBlock | undefined, b: StadiumBlock | undefined) => JSON.stringify(a) === JSON.stringify(b);
const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Stadion, wie es nach allen geplanten Umbauten aussieht. */
export function applyPlan(blocks: StadiumBlock[], plan: PlanMap): StadiumBlock[] {
  return blocks.map((b) => plan[b.id] ?? b);
}

/** Geplante Blöcke in fester Reihenfolge (nur solche, die sich wirklich ändern). */
export function planList(blocks: StadiumBlock[], plan: PlanMap): StadiumBlock[] {
  return BLOCK_IDS.map((id) => plan[id]).filter((t): t is StadiumBlock => !!t && !same(t, blocks.find((b) => b.id === t.id)) && blocks.some((b) => b.id === t.id));
}

/** Ziele in den Entwurf übernehmen; ein Block, der wieder dem Bestand entspricht, fällt heraus. */
export function putInPlan(blocks: StadiumBlock[], plan: PlanMap, targets: StadiumBlock[]): PlanMap {
  const next: PlanMap = { ...plan };
  for (const t of targets) {
    const cur = blocks.find((b) => b.id === t.id);
    if (!cur || same(t, cur)) delete next[t.id]; else next[t.id] = copy(t);
  }
  return next;
}

/** Entwurf an den heutigen Bestand anpassen (fertige Umbauten, fehlende Blöcke). */
export function cleanPlan(blocks: StadiumBlock[], plan: PlanMap): PlanMap {
  const out: PlanMap = {};
  for (const t of planList(blocks, plan)) out[t.id] = t;
  return out;
}

/** Erwarteter Eintritt je Heimspiel (alle Kategorien, nominal) und Zuschauer für einen Blockzustand. */
export function perMatch(club: Club, blocks: StadiumBlock[], year: number): { rev: number; visitors: number } {
  const st = { ...club.stadium, blocks, capacity: blocksCapacity(blocks) };
  const c = { ...club, stadium: st } as Club;
  const sale = expectedSale(c, year);
  return { rev: Object.values(saleRevenue(c, sale.sold, year)).reduce((a, v) => a + (v ?? 0), 0), visitors: sale.attendance };
}

export interface PlanCheck { key: string; label: string; ok: boolean; text: string; relevant: boolean }
export interface PlanSummary {
  targets: StadiumBlock[];
  rows: { t: StadiumBlock; add: number; cost: number; months: number; bad: boolean }[];
  cost: number; rate: number; monthly: (years: number) => number;
  months: number; finish: string; mood: number; addCapacity: number;
  capsBefore: Required<SeatNums>; capsAfter: Required<SeatNums>;
  capBefore: number; capAfter: number; capWhile: number; loss: number;
  before: { rev: number; visitors: number }; after: { rev: number; visitors: number };
  comfortBefore: number | null; comfortAfter: number | null; expect: number | null;
  notes: string[]; errors: string[];
  checks: PlanCheck[];
  /** Hinderungsgrund für die gewählte Finanzierung (null = Bauen möglich). */
  blocker: string | null;
}

export function summarize(g: Game, blocks: StadiumBlock[], plan: PlanMap, fin: PlanFin): PlanSummary {
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const targets = planList(blocks, plan);
  const planned = applyPlan(blocks, plan);
  const grp = groupPlanFor(g, targets);
  const rows = targets.map((t) => { const one = groupPlanFor(g, [t]); return { t, add: one.plan.addCapacity, cost: one.cost, months: one.plan.months, bad: !one.plan.ok }; });
  const capsOf = (bl: StadiumBlock[]) => blockCaps(bl).caps as Required<SeatNums>;
  const loss = targets.length ? buildLoss(g, targets) : 0;
  const comfortOf = (bl: StadiumBlock[]) => stadiumComfort({ ...club, stadium: { ...st, blocks: bl } } as Club, year);
  const cB = comfortOf(blocks), cA = comfortOf(planned);
  const n = targets.length;
  const cost = n ? grp.cost : 0;
  const busy = !!st.blockProject || !!club.stadiumProject;
  const budget = n ? checkBudget(g, 'infra', cost) : null;
  const loan = (y: number) => (n ? buildBlocker(g, cost, 'loan', y) : null);
  const approval = n ? grp.plan.errors : [];
  const checks: PlanCheck[] = [
    { key: 'permit', label: 'Genehmigung', ok: !approval.length, relevant: true, text: approval.length ? approval[0] : 'Stadt und Bauamt haben keine Einwände.' },
    { key: 'site', label: 'Baustelle', ok: !busy, relevant: true, text: busy ? 'Im Stadion wird gerade gebaut – der Entwurf wartet, bis der Umbau fertig ist.' : 'Frei – es läuft kein anderer Umbau.' },
    { key: 'cash', label: 'Kasse', ok: club.finances.balance >= cost, relevant: fin === 'cash', text: club.finances.balance >= cost ? 'Der Kontostand reicht für eine Barzahlung.' : 'Der Kontostand reicht für eine Barzahlung nicht.' },
    { key: 'budget', label: 'Saisonbudget', ok: !budget, relevant: fin === 'cash', text: budget ?? 'Das Infrastruktur-Budget deckt die Kosten.' },
    { key: 'bank', label: 'Bank', ok: !loan(fin === 20 ? 20 : 10), relevant: fin !== 'cash', text: loan(fin === 20 ? 20 : 10) ?? 'Die Bank gibt den Kredit.' },
  ];
  const blocker = !n ? 'Noch ist nichts geplant.' : approval.length ? approval[0]
    : buildBlocker(g, cost, fin === 'cash' ? 'cash' : 'loan', fin === 'cash' ? 0 : fin);
  const months = n ? grp.plan.months : 0;
  return {
    targets, rows, cost, rate: grp.rate, monthly: grp.monthly,
    months, finish: addMonths(today, months), mood: n ? grp.plan.mood : 0, addCapacity: n ? grp.plan.addCapacity : 0,
    capsBefore: capsOf(blocks), capsAfter: capsOf(planned),
    capBefore: blocksCapacity(blocks), capAfter: blocksCapacity(planned), capWhile: Math.max(1000, st.capacity - loss), loss,
    before: perMatch(club, blocks, year), after: n ? perMatch(club, planned, year) : perMatch(club, blocks, year),
    comfortBefore: cB ? cB.comfort : null, comfortAfter: cA ? cA.comfort : null, expect: cB ? cB.expect : null,
    notes: n ? grp.plan.notes : [], errors: approval, checks, blocker,
  };
}

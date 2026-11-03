// =============================================================================
// SAISONBUDGET — Bausteine für Fenster und Seite Finanzen › Budget
//   Ziele · Finanzberater · Reaktionen · Einnahmen-Tabelle · Gesamtbalken · Säulen
// Farben: Budgetposten in Grau-/Schieferstufen (ruhig), Reserve grün/rot nur als
// echtes Signal (über/unter der Mindestreserve des Vorstands).
// =============================================================================
import { type ReactNode } from 'react';
import Icon, { type IconName } from '../../../components/Icon';
import PlayerAvatar from '../../../components/PlayerAvatar';
import type { Player } from '../../../types';
import { INCOME_AREAS, IncomeSplit, sumIncome } from '../../../game/budgetForecast';
import { BudgetKey, BudgetPlan, BudgetSplit, effectiveSpend, plannedReserve, reactionLabel, Reactions } from '../../../game/budgetPlan';
import type { AdvisorPerson, SeasonGoal } from '../../../game/budgetView';
import { fmtDM } from '../../../ui/format';

/** Spalten des Budgets: fünf Posten + Reserve (berechnet). */
export type BudgetCol = BudgetKey | 'reserve';
export const BUDGET_COLS: { key: BudgetCol; label: string; short: string }[] = [
  { key: 'wages', label: 'Gehälter', short: 'Gehälter' },
  { key: 'transfers', label: 'Transfers', short: 'Transfer' },
  { key: 'infra', label: 'Infrastruktur', short: 'Infrastr.' },
  { key: 'youth', label: 'Jugend', short: 'Jugend' },
  { key: 'other', label: 'Betrieb & Sonstiges', short: 'Sonstiges' },
  { key: 'reserve', label: 'Reserve', short: 'Reserve' },
];

/** Rundet einen Schritt auf 1/2/5 × 10^n. */
export function niceStep(v: number): number {
  if (v <= 0) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : 5) * p;
}

const GOAL_ICON: Record<SeasonGoal['kind'], IconName> = { league: 'dashTabelle', cup: 'trophy', euro: 'international' };

export function GoalList({ goals }: { goals: SeasonGoal[] }) {
  return (
    <div className="bud-goals">
      {goals.map((x) => (
        <div key={x.kind + x.title} className="bud-goal">
          <span className="bud-goal-ico"><Icon name={GOAL_ICON[x.kind]} size={30} /></span>
          <span className="bud-goal-t">{x.title}</span>
          <span className="bud-goal-v">{x.goal}</span>
        </div>
      ))}
    </div>
  );
}

/** Finanzberater mit Gesicht und 3–6 Sätzen (Einordnung der Epoche + Lage des Vereins). */
export function AdvisorBox({ person, era, lines, compact }: { person: AdvisorPerson; era: string; lines: string[]; compact?: boolean }) {
  const fake = { id: person.id, fullName: person.name } as Player;
  return (
    <div className={`bud-adv ${compact ? 'compact' : ''}`}>
      <div className="bud-adv-who">
        <span className="bud-adv-face"><PlayerAvatar player={fake} size={compact ? 56 : 72} /></span>
        <span className="bud-adv-id"><b>{person.name}</b><span>{person.role}</span></span>
      </div>
      <div className="bud-adv-text">
        <p className="bud-adv-era">{era}</p>
        {lines.map((l, i) => <p key={i}>{l}</p>)}
      </div>
    </div>
  );
}

const reactColor = (v: number) => v < 30 ? 'var(--neg)' : v < 45 ? 'var(--warn)' : 'var(--bar-fill-hi)';

export function ReactionBars({ r, boardStatus }: { r: Reactions; boardStatus?: ReactNode }) {
  const rows: [string, number][] = [['Vorstand', r.board], ['Fans', r.fans], ['Sponsoren', r.sponsors]];
  return (
    <div className="bud-react">
      {rows.map(([k, v]) => (
        <div key={k} className="bud-react-row">
          <span className="bud-react-k">{k}</span>
          <span className="bud-react-track"><span style={{ width: `${v}%`, background: reactColor(v) }} /></span>
          <span className="bud-react-v">{reactionLabel(v)}</span>
        </div>
      ))}
      {boardStatus}
    </div>
  );
}

/** Erwartete Einnahmen je Bereich (+ optional Ist bisher) und Kontostand. */
export function IncomeTable({ income, ist, balance, balanceLabel = 'Kontostand zu Saisonbeginn', reserveMin }: {
  income: IncomeSplit; ist?: IncomeSplit; balance: number; balanceLabel?: string; reserveMin?: number;
}) {
  const total = Math.max(1, sumIncome(income));
  const rows = INCOME_AREAS.filter((a) => income[a.key] > 0 || (ist && ist[a.key] > 0));
  return (
    <table className="bud-inc">
      <thead><tr><th>Bereich</th>{ist && <th className="num">Bisher</th>}<th className="num">Kalkuliert</th><th className="num">Anteil</th></tr></thead>
      <tbody>
        {rows.map((a) => (
          <tr key={a.key}>
            <td>{a.label}</td>
            {ist && <td className="num dim">{fmtDM(ist[a.key])}</td>}
            <td className="num">{fmtDM(income[a.key])}</td>
            <td className="num dim">{Math.round((income[a.key] / total) * 100)} %</td>
          </tr>
        ))}
        <tr className="sum"><td>Einnahmen gesamt</td>{ist && <td className="num">{fmtDM(sumIncome(ist))}</td>}<td className="num">{fmtDM(total)}</td><td /></tr>
        <tr className="bal"><td>{balanceLabel}</td>{ist && <td />}<td className={`num ${balance < 0 ? 'neg' : ''}`}>{fmtDM(balance)}</td><td /></tr>
        {reserveMin != null && <tr><td className="dim">Mindestreserve des Vorstands</td>{ist && <td />}<td className="num dim">{fmtDM(reserveMin)}</td><td /></tr>}
      </tbody>
    </table>
  );
}

/** Wert je Spalte bei einer Wahl (Reserve = was am Saisonende übrig bleibt). */
export function colValues(p: BudgetPlan, s: BudgetSplit): Record<BudgetCol, number> {
  const e = effectiveSpend(p, s);
  return { ...e, reserve: plannedReserve(p, s) };
}

/** Gebundener Teil je Spalte: laufende Verträge, Akademie-Kosten, Betrieb – bzw. schon ausgegeben. */
export function colBound(p: BudgetPlan, ist?: BudgetSplit): Record<BudgetCol, number> {
  return {
    wages: Math.max(p.fixed.personnel, ist?.wages ?? 0),
    transfers: ist?.transfers ?? 0,
    infra: ist?.infra ?? 0,
    youth: Math.max(p.fixed.youthRunning, ist?.youth ?? 0),
    other: p.fixed.operations,
    reserve: 0,
  };
}

/** Gesamtbalken: Mittel der Saison (Konto + Einnahmen), aufgeteilt auf die Posten. */
export function StackBar({ p, s }: { p: BudgetPlan; s: BudgetSplit }) {
  const v = colValues(p, s);
  const total = Math.max(1, BUDGET_COLS.reduce((a, c) => a + Math.max(0, v[c.key]), 0));
  return (
    <div className="bud-stack">
      <div className="bud-stack-bar">
        {BUDGET_COLS.map((c) => v[c.key] > 0 && (
          <span key={c.key} className={`bud-c-${c.key} ${c.key === 'reserve' && v.reserve < p.reserveMin ? 'low' : ''}`}
            style={{ width: `${(v[c.key] / total) * 100}%` }} title={`${c.label}: ${fmtDM(v[c.key])}`} />
        ))}
      </div>
      <div className="bud-stack-lbl">Verfügbar in dieser Saison: <b>{fmtDM(p.balanceBase + sumIncome(p.income))}</b>
        <span className="dim"> (Kontostand + erwartete Einnahmen)</span></div>
    </div>
  );
}

/** Säulen je Posten: hell = Budget, schraffiert = gebunden/ausgegeben; Linie = Mindestreserve. */
export function BudgetColumns({ p, s, ist, sel, onSel, onStep, readOnly }: {
  p: BudgetPlan; s: BudgetSplit; ist?: BudgetSplit;
  sel?: BudgetCol; onSel?: (k: BudgetCol) => void; onStep?: (k: BudgetKey, dir: 1 | -1) => void; readOnly?: boolean;
}) {
  const v = colValues(p, s);
  const bound = colBound(p, ist);
  const max = Math.max(1, ...BUDGET_COLS.map((c) => Math.max(v[c.key], bound[c.key])), p.reserveMin) * 1.08;
  const h = (x: number) => `${Math.max(0, Math.min(100, (x / max) * 100))}%`;
  return (
    <div className="bud-cols">
      <div className="bud-cols-plot">
        <span className="bud-grid" style={{ bottom: '50%' }}><i>{fmtDM(max / 2)}</i></span>
        <span className="bud-grid" style={{ bottom: '100%' }}><i>{fmtDM(max)}</i></span>
        {BUDGET_COLS.map((c) => {
          const val = v[c.key];
          const low = c.key === 'reserve' && val < p.reserveMin;
          return (
            <button key={c.key} type="button" className={`bud-col ${sel === c.key ? 'sel' : ''}`} onClick={() => onSel?.(c.key)}
              aria-label={`${c.label}: ${fmtDM(val)}`}>
              <span className={`bud-col-bar bud-c-${c.key} ${low ? 'low' : ''}`} style={{ height: h(val) }} />
              {bound[c.key] > 0 && <span className="bud-col-bound" style={{ height: h(Math.min(bound[c.key], Math.max(val, bound[c.key]))) }} />}
              {c.key === 'reserve' && <span className="bud-col-min" style={{ bottom: h(p.reserveMin) }} title={`Mindestreserve ${fmtDM(p.reserveMin)}`} />}
            </button>
          );
        })}
      </div>
      <div className="bud-cols-foot">
        {BUDGET_COLS.map((c) => {
          const fixed = c.key === 'other' || c.key === 'reserve' || readOnly;
          return (
            <div key={c.key} className={`bud-colf ${sel === c.key ? 'sel' : ''}`}>
              <button type="button" className="bud-colf-name" onClick={() => onSel?.(c.key)}>{c.short}</button>
              <span className={`bud-colf-val ${c.key === 'reserve' && v.reserve < p.reserveMin ? 'neg' : ''}`}>{fmtDM(v[c.key])}</span>
              {!readOnly && (
                <div className="bud-colf-steps">
                  {!fixed && <button type="button" className="bud-step" aria-label={`${c.label} senken`} onClick={() => onStep?.(c.key as BudgetKey, -1)}>−</button>}
                  {!fixed && <button type="button" className="bud-step" aria-label={`${c.label} erhöhen`} onClick={() => onStep?.(c.key as BudgetKey, 1)}>+</button>}
                  {fixed && <span className="bud-colf-fixed">{c.key === 'reserve' ? 'ergibt sich' : 'fest'}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// SAISONBUDGET — Fenster (Wunsch Pascal, Vorbild EA FM „Budgetverhandlungen“)
// Kein Verhandeln: Der Finanzberater legt einen Plan vor, du verschiebst die Budgets.
//   links  Saisonziele (nur Anzeige), Finanzberater (Epoche + Lage), Reaktionen
//   rechts Erwartete Einnahmen + Kontostand, Budgets (Gesamtbalken, Säulen, Regler)
// Öffnet automatisch nach dem Saison-Briefing (g.budget.pending, GameShell) und
// aus Finanzen › Budget. Logik: game/budgetPlan.ts, Texte game/budgetView.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import { sumIncome } from '../../../game/budgetForecast';
import {
  BudgetKey, BudgetSplit, clearPendingBudget, confirmBudget, planFor, planRevenue, reactionsFor, sliderRange, spentNow,
} from '../../../game/budgetPlan';
import { advisorFor, advisorOf, seasonGoals } from '../../../game/budgetView';
import type { Game } from '../../../game/state';
import { InfoTip } from '../../../ui/InfoTip';
import { fmtDM } from '../../../ui/format';
import { AdvisorBox, BUDGET_COLS, BudgetCol, BudgetColumns, GoalList, IncomeTable, niceStep, ReactionBars, StackBar, colValues } from './BudgetParts';

const boardLabel = (v: number) => v >= 80 ? 'Sehr gut' : v >= 60 ? 'Gut' : v >= 40 ? 'Normal' : v >= 25 ? 'Angespannt' : 'Kritisch';

export function BudgetModal({ g, auto = false, onClose }: {
  g: Game;
  /** Automatisch zum Saisonstart geöffnet (Schließen = Vorschlag gilt). */
  auto?: boolean;
  onClose: () => void;
}) {
  const p = planFor(g);
  const club = g.clubs[g.managedClubId];
  const [s, setS] = useState<BudgetSplit | null>(p ? { ...p.chosen } : null);
  const [sel, setSel] = useState<BudgetCol>('wages');
  const ist = useMemo(() => (p ? spentNow(g, p) : null), [g, p]);

  const close = () => { if (auto) clearPendingBudget(g); onClose(); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === ' ' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!p || !s || !ist || !club) return null;
  const rev = planRevenue(p);
  const step = niceStep(rev / 100);
  const range = (k: BudgetKey) => sliderRange(p, k, k === 'wages' ? 0 : ist[k]);
  const set = (k: BudgetKey, v: number) => {
    const [lo, hi] = range(k);
    setS({ ...s, [k]: Math.round(Math.max(lo, Math.min(hi, v)) / step) * step });
  };
  const onStep = (k: BudgetKey, dir: 1 | -1) => set(k, s[k] + dir * step);
  const r = reactionsFor(g, p, s);
  const adv = advisorFor(g, p, s);
  const person = advisorOf(g);
  const changed = (['wages', 'transfers', 'infra', 'youth'] as BudgetKey[]).some((k) => s[k] !== p.advice[k]);
  const selKey = sel === 'reserve' || sel === 'other' ? null : sel;
  const tip = sel === 'reserve' ? adv.tips.reserve
    : sel === 'other' ? `Stadion, Gebäude, Verwaltung, Vermarktung, Sicherheit und Kreditraten: rund ${fmtDM(p.fixed.operations)} in dieser Saison. Diese Kosten sind fest eingeplant.`
      : adv.tips[sel];
  const v = colValues(p, s);
  const confirm = () => { confirmBudget(g, s); clearPendingBudget(g); onClose(); };

  return (
    <div className="modal-overlay bud-overlay">
      <div className="modal modal-xl bud-modal" role="dialog" aria-label={`Saisonbudget ${p.season}`}>
        <div className="mx-head bud-head">
          <ClubCrest club={club} size={52} />
          <div className="bud-head-id">
            <div className="mx-sub">{club.name} · {g.manager?.name ?? ''}</div>
            <h2>Saisonbudget {p.season}</h2>
          </div>
          <button className="modal-close" onClick={close} aria-label="Schließen">×</button>
        </div>

        <div className="mx-body bud-body">
          <section className="bud-page bud-left">
            <h4 className="bud-sec">Saisonziele des Vorstands</h4>
            <GoalList goals={seasonGoals(g)} />
            <h4 className="bud-sec">Dein Finanzberater<InfoTip k="budgetBerater" /></h4>
            <AdvisorBox person={person} era={adv.era} lines={adv.lines} year={Number(g.calendar.currentDate.slice(0, 4))} />
            <div className="bud-react-box">
              <h4 className="bud-sec">Zu erwartende Reaktionen<InfoTip k="budgetReaktionen" /></h4>
              <ReactionBars r={r} boardStatus={
                <div className="bud-board"><span>Vorstandsvertrauen</span><b>{boardLabel(club.boardConfidence ?? 60)}</b></div>} />
            </div>
          </section>

          <section className="bud-page bud-right">
            <h4 className="bud-sec">Erwartete Einnahmen<InfoTip k="budgetPrognose" /></h4>
            <IncomeTable income={p.income} balance={p.balanceBase} reserveMin={p.reserveMin} />
            <h4 className="bud-sec">Budgets<InfoTip k="budgetPosten" /></h4>
            <StackBar p={p} s={s} />
            <BudgetColumns p={p} s={s} ist={ist} sel={sel} onSel={setSel} onStep={onStep} />
            <div className="bud-edit">
              <div className="bud-edit-head">
                <b>{BUDGET_COLS.find((c) => c.key === sel)?.label}</b>
                <span className={sel === 'reserve' && v.reserve < p.reserveMin ? 'neg' : ''}>{fmtDM(v[sel])}</span>
              </div>
              {selKey && (() => {
                const [lo, hi] = range(selKey);
                return (
                  <input type="range" className="bud-range" min={lo} max={Math.max(lo, hi)} step={step} value={s[selKey]}
                    aria-label={`${BUDGET_COLS.find((c) => c.key === sel)?.label} einstellen`}
                    onChange={(e) => set(selKey, Number(e.target.value))} />
                );
              })()}
              <p className="bud-tip">{tip}</p>
            </div>
          </section>
        </div>

        <div className="mx-foot bud-foot">
          <span className="bud-foot-note">
            {auto ? 'Schließt du das Fenster, gilt der Vorschlag deines Beraters. ' : ''}
            Anpassen kannst du die Budgets jederzeit unter Finanzen › Budget. Einnahmen gesamt {fmtDM(sumIncome(p.income))} · {Math.round(((s.wages > p.fixed.personnel ? s.wages : p.fixed.personnel) / rev) * 100)} % für Personal.
          </span>
          <button className="btn btn-ghost bud-reset" disabled={!changed} onClick={() => setS({ ...p.advice })}>Vorschlag des Beraters</button>
          <button className="btn btn-primary bud-confirm" onClick={confirm}>Budget bestätigen</button>
        </div>
      </div>
    </div>
  );
}

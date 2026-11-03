// =============================================================================
// Finanzen › Budget — Saisonbudget mit Soll/Ist, Einnahmen-Prognose gegen Ist,
// Finanzberater und Bilanz der Vorjahre. „Budget anpassen“ öffnet das Fenster
// (views/finanzen/budget/BudgetModal.tsx). Logik: game/budgetPlan.ts.
// =============================================================================
import { useState } from 'react';
import { incomeSoFar, sumIncome } from '../../game/budgetForecast';
import { budgetState, planFor, plannedReserve, spentNow } from '../../game/budgetPlan';
import { advisorFor, advisorOf } from '../../game/budgetView';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty, Kpi } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { AdvisorBox, BUDGET_COLS, BudgetColumns, colValues, IncomeTable } from './budget/BudgetParts';
import { BudgetModal } from './budget/BudgetModal';

export function BudgetView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'split' | 'archive'>('split');
  const p = planFor(g);
  const club = g.clubs[g.managedClubId];
  if (!p || !club) {
    return <DashPage><DashBox title="Saisonbudget" icon="finances" span={3} rows={2}><Empty icon="finances">Für diese Saison liegt noch kein Budget vor.</Empty></DashBox></DashPage>;
  }
  const ist = spentNow(g, p);
  const v = colValues(p, p.chosen);
  const adv = advisorFor(g, p, p.chosen);
  const incIst = incomeSoFar(club.finances);
  const reserve = plannedReserve(p, p.chosen);
  const archive = budgetState(g).plans.filter((x) => x.result).slice(-8).reverse();
  const used = (k: typeof BUDGET_COLS[number]['key']) => (k === 'reserve' ? 0 : ist[k]);

  return (
    <DashPage>
      <DashBox title={`Saisonbudget ${p.season}`} info="budgetPosten" icon="finances" span={2}
        right={<button className="dchip on" onClick={() => setOpen(true)}>Budget anpassen</button>}>
        <div className="bud-page-top">
          <div className="dkpis">
            <Kpi value={fmtDM(club.finances.balance)} label="Kontostand" color={club.finances.balance < 0 ? 'var(--neg)' : undefined} />
            <Kpi value={fmtDM(reserve)} label="Geplante Reserve" color={reserve < p.reserveMin ? 'var(--neg)' : undefined} sub={`Vorgabe ${fmtDM(p.reserveMin)}`} />
            <Kpi value={p.confirmed ? 'Bestätigt' : 'Vorschlag'} label="Status" sub={p.confirmed ? 'deine Aufteilung' : 'des Beraters'} />
          </div>
          <table className="bud-soll">
            <thead><tr><th>Posten</th><th className="num">Budget</th><th className="num">Ausgegeben</th><th className="num">Frei</th><th className="bud-soll-bar">Auslastung</th></tr></thead>
            <tbody>
              {BUDGET_COLS.filter((c) => c.key !== 'reserve').map((c) => {
                const b = v[c.key], u = used(c.key), free = b - u;
                const pct = b > 0 ? Math.min(100, (u / b) * 100) : 0;
                return (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td className="num">{fmtDM(b)}</td>
                    <td className="num dim">{fmtDM(u)}</td>
                    <td className={`num ${free < 0 ? 'neg' : ''}`}>{fmtDM(free)}</td>
                    <td className="bud-soll-bar"><span className="bud-soll-track"><span style={{ width: `${pct}%`, background: u > b * 1.02 ? 'var(--neg)' : 'var(--bar-fill-hi)' }} /></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashBox>

      <DashBox title="Finanzberater" info="budgetBerater" icon="briefing" rows={2}>
        <AdvisorBox person={advisorOf(g)} era={adv.era} lines={adv.lines} compact year={Number(g.calendar.currentDate.slice(0, 4))} />
      </DashBox>

      <DashBox title="Einnahmen: Prognose und Ist" info="budgetPrognose" icon="dashFinanzen">
        <IncomeTable income={p.income} ist={incIst} balance={p.balanceBase} />
      </DashBox>

      <DashBox title={tab === 'split' ? 'Aufteilung' : 'Bilanz der Vorjahre'} icon="stats"
        right={<span className="dbtnrow">
          <button className={`dchip ${tab === 'split' ? 'on' : ''}`} onClick={() => setTab('split')}>Aufteilung</button>
          <button className={`dchip ${tab === 'archive' ? 'on' : ''}`} onClick={() => setTab('archive')}>Vorjahre</button>
        </span>}>
        {tab === 'split' ? <BudgetColumns p={p} s={p.chosen} ist={ist} readOnly />
          : archive.length ? (
            <table className="bud-soll">
              <thead><tr><th>Saison</th><th className="num">Einnahmen Plan</th><th className="num">Ist</th><th className="num">Konto Ende</th><th className="num">Vorstand</th></tr></thead>
              <tbody>
                {archive.map((x) => {
                  const r = x.result!;
                  return (
                    <tr key={x.season}>
                      <td>{x.season}</td>
                      <td className="num dim">{fmtDM(sumIncome(x.income))}</td>
                      <td className="num">{fmtDM(sumIncome(r.income))}</td>
                      <td className={`num ${r.balanceEnd < x.reserveMin ? 'neg' : ''}`}>{fmtDM(r.balanceEnd)}</td>
                      <td className={`num ${r.boardDelta < 0 ? 'neg' : r.boardDelta > 0 ? 'pos' : 'dim'}`}>{x.confirmed ? `${r.boardDelta > 0 ? '+' : ''}${r.boardDelta}` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty icon="stats">Die erste Bilanz schreibt dein Berater zum Saisonende.</Empty>}
      </DashBox>

      {open && <BudgetModal g={g} onClose={() => { setOpen(false); onChange(); }} />}
    </DashPage>
  );
}

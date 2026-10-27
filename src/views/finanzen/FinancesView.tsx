import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { CalendarEngine } from '../../engine/calendar';
import { computeMonthly, forecastSeasonEnd, totalExpense, totalIncome, weeklyWageBill } from '../../engine/finances';
import { Game } from '../../game/state';
import { ClubFinances } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtCompactDM, fmtFullDM, vColor } from '../../ui/format';
import { type ReactNode } from 'react';

export const INCOME_ROWS: { key: keyof ClubFinances['income']; label: string; icon: ReactNode }[] = [
  { key: 'ticketSales', label: 'Stadioneinnahmen', icon: '🎟️' },
  { key: 'catering', label: 'Catering / Würstchenbuden', icon: <Icon name="catering" /> },
  { key: 'matchday', label: 'Programmhefte & Spieltag', icon: <Icon name="marketing" /> },
  { key: 'merchandise', label: 'Fanartikel', icon: '🧣' },
  { key: 'tvMoney', label: 'TV- & Mediengelder', icon: '📺' },
  { key: 'sponsorship', label: 'Trikotsponsoring', icon: '🤝' },
  { key: 'advertising', label: 'Bandenwerbung', icon: <Icon name="sponsoring" /> },
  { key: 'membership', label: 'Mitgliedsbeiträge', icon: <Icon name="fans" /> },
  { key: 'prizeMoney', label: 'Prämien', icon: <Icon name="trophy" /> },
  { key: 'transferIncome', label: 'Transfererlöse', icon: '📈' },
  { key: 'other', label: 'Sonstiges', icon: '💼' },
];

export const EXPENSE_ROWS: { key: keyof ClubFinances['expenses']; label: string; icon: ReactNode }[] = [
  { key: 'wages', label: 'Spielergehälter', icon: '👤' },
  { key: 'staffWages', label: 'Betreuerstab', icon: '🧑‍🏫' },
  { key: 'stadiumMaintenance', label: 'Stadionunterhalt', icon: <Icon name="stadium" /> },
  { key: 'facilities', label: 'Gebäude-Fixkosten', icon: <Icon name="facilities" /> },
  { key: 'trainingFacilities', label: 'Trainingsbetrieb (alt)', icon: '🎯' },
  { key: 'other', label: 'Sonstige Fixkosten', icon: '🧾' },
  { key: 'transferExpense', label: 'Transferausgaben', icon: '📉' },
];

/** Selbstgebauter SVG-Linien-Graph für den Kontostand-Verlauf (Dark-Theme). */
export function BalanceChart({ points, current, currentDate }: {
  points: { date: string; balance: number }[]; current: number; currentDate: string;
}) {
  const data = [...points, { date: currentDate, balance: Math.round(current) }];
  const W = 640, H = 200, PL = 8, PR = 8, PT = 16, PB = 24;
  if (data.length < 2) {
    // Spielstart: noch keine Historie -> einen Startpunkt einen Monat vor dem aktuellen
    // Datum auf dem Startkontostand synthetisieren, damit sofort ein Verlauf sichtbar ist
    // (zunaechst flache Linie, die sich mit jedem Monatsabschluss fuellt).
    const d0 = new Date(currentDate + 'T00:00:00Z');
    d0.setUTCMonth(d0.getUTCMonth() - 1);
    data.unshift({ date: d0.toISOString().slice(0, 10), balance: Math.round(current) });
  }
  const vals = data.map((d) => d.balance);
  let min = Math.min(...vals, 0), max = Math.max(...vals, 0);
  if (min === max) { min -= 1; max += 1; }
  const iw = W - PL - PR, ih = H - PT - PB;
  const x = (i: number) => PL + (i / (data.length - 1)) * iw;
  const y = (v: number) => PT + (1 - (v - min) / (max - min)) * ih;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.balance).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(PT + ih).toFixed(1)} L ${PL} ${(PT + ih).toFixed(1)} Z`;
  const zeroY = y(0);
  const mmLabel = (iso: string) => {
    const d = new Date(iso + 'T00:00:00Z');
    return `${['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][d.getUTCMonth()]}`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="balArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {min < 0 && max > 0 && (
        <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY} stroke="var(--red)" strokeDasharray="3 3" strokeOpacity="0.6" />
      )}
      <path d={area} fill="url(#balArea)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.balance)} r={i === data.length - 1 ? 4 : 2.5}
            fill={d.balance < 0 ? 'var(--red)' : 'var(--accent)'} />
          {(i === 0 || i === data.length - 1 || i % 2 === 0) && (
            <text x={x(i)} y={H - 6} fill="var(--text-3)" fontSize="10" textAnchor="middle">{mmLabel(d.date)}</text>
          )}
        </g>
      ))}
      <text x={PL} y={11} fill="var(--text-3)" fontSize="10">{fmtCompactDM(max)}</text>
      <text x={PL} y={PT + ih + 0} fill="var(--text-3)" fontSize="10">{fmtCompactDM(min)}</text>
    </svg>
  );
}

/** Horizontaler Balken für einen Einnahme-/Ausgabeposten. */
export function FinBar({ label, icon, value, max, color }: {
  label: string; icon: ReactNode; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="fin-bar-row">
      <div className="fin-bar-label"><span>{icon}</span> {label}</div>
      <div className="fin-bar-track"><div className="fin-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <div className="fin-bar-val">{value > 0 ? fmtCompactDM(value) : '–'}</div>
    </div>
  );
}

export function FinancesView({ g }: { g: Game }) {
  const club = g.clubs[g.managedClubId];
  const fin = club.finances;
  const income = totalIncome(fin);
  const expense = totalExpense(fin);
  const net = income - expense;

  const monthly = computeMonthly(club, g.players, g.table);
  const homeRemaining = g.fixtures.filter(
    (m) => m.homeClubId === g.managedClubId && m.status === 'scheduled',
  ).length;
  const forecast = forecastSeasonEnd(
    club, g.players, g.table, g.calendar.currentDate, g.calendar.seasonEndDate, homeRemaining,
  );

  const weekly = weeklyWageBill(club, g.players);
  const wageBudget = fin.wageBudget;
  const wagePct = wageBudget > 0 ? Math.min(100, (weekly / wageBudget) * 100) : 0;

  const maxIncome = Math.max(1, ...INCOME_ROWS.map((r) => fin.income[r.key]));
  const maxExpense = Math.max(1, ...EXPENSE_ROWS.map((r) => fin.expenses[r.key]));

  const warnings: string[] = [];
  if (fin.balance < 0) warnings.push(`Das Konto ist mit ${fmtFullDM(fin.balance)} im Minus.`);
  if (forecast.projectedEndBalance < 0) warnings.push(`Die Hochrechnung sagt zum Saisonende ${fmtFullDM(forecast.projectedEndBalance)} voraus – ein negatives Ergebnis.`);
  if (weekly > wageBudget) warnings.push(`Die Gehaltssumme (${fmtCompactDM(weekly)}/Woche) übersteigt das Gehaltsbudget (${fmtCompactDM(wageBudget)}/Woche).`);
  if (monthly.net < 0) warnings.push(`Die laufenden Monatskosten übersteigen die festen Monatserträge um ${fmtCompactDM(-monthly.net)} – Heimspiele müssen dies ausgleichen.`);

  return (
    <div className="fin-wrap">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Finanzen"
        right={<span className="dim">Saison {g.season} · in Deutscher Mark (DM)</span>}
      />

      {/* KONTOSTAND & BUDGETS */}
      <div className="fin-hero">
        <div className="fin-hero-main">
          <div className="dim mini">Kontostand</div>
          <div className="fin-balance" style={{ color: fin.balance < 0 ? 'var(--red)' : 'var(--accent)' }}>
            {fmtFullDM(fin.balance)}
          </div>
          <div className="fin-hero-sub">
            <span>Saldo Saison: <b style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{fmtCompactDM(net)}</b></span>
            <span>Monatssaldo (fix): <b style={{ color: monthly.net >= 0 ? 'var(--green)' : 'var(--red)' }}>{monthly.net >= 0 ? '+' : ''}{fmtCompactDM(monthly.net)}</b></span>
          </div>
        </div>
        <div className="fin-budgets">
          <div className="fin-budget-card">
            <div className="dim mini">Transferbudget</div>
            <div className="fin-budget-val accent-text">{fmtCompactDM(fin.transferBudget)}</div>
          </div>
          <div className="fin-budget-card">
            <div className="dim mini">Gehaltsbudget / Woche</div>
            <div className="fin-budget-val">{fmtCompactDM(wageBudget)}</div>
            <div className="fin-bar-track" style={{ marginTop: 6 }}>
              <div className="fin-bar-fill" style={{ width: `${wagePct}%`, background: vColor(100 - wagePct) }} />
            </div>
            <div className="dim mini" style={{ marginTop: 3 }}>
              belegt: {fmtCompactDM(weekly)} ({Math.round(wagePct)}%)
            </div>
          </div>
        </div>
      </div>

      {/* WARNUNGEN */}
      {warnings.length > 0 && (
        <div className="fin-warn">
          <div className="fin-warn-title">⚠️ Warnungen</div>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {/* GRAPH */}
      <div className="card fin-chart-card">
        <div className="card-title">📊 Kontostand-Verlauf (Monatsabschlüsse)</div>
        <BalanceChart points={fin.balanceHistory ?? []} current={fin.balance} currentDate={g.calendar.currentDate} />
      </div>

      {/* EINNAHMEN / AUSGABEN */}
      <div className="fin-cols">
        <div className="card">
          <div className="card-title">Einnahmen (Saison) · <span className="accent-text">{fmtCompactDM(income)}</span></div>
          {INCOME_ROWS.map((r) => (
            <FinBar key={String(r.key)} label={r.label} icon={r.icon} value={fin.income[r.key]} max={maxIncome} color="var(--green)" />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Ausgaben (Saison) · <span style={{ color: 'var(--red)' }}>{fmtCompactDM(expense)}</span></div>
          {EXPENSE_ROWS.map((r) => (
            <FinBar key={String(r.key)} label={r.label} icon={r.icon} value={fin.expenses[r.key]} max={maxExpense} color="var(--orange)" />
          ))}
        </div>
      </div>

      {/* PROGNOSE */}
      <div className="card">
        <div className="card-title">🔮 Prognose bis Saisonende</div>
        <div className="fin-forecast">
          <div className="fin-fc-item"><div className="dim mini">Verbleibende Monate</div><div className="fin-fc-val">{forecast.monthsRemaining.toLocaleString('de-DE')}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Heimspiele übrig</div><div className="fin-fc-val">{forecast.homeMatchesRemaining}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Erwartete Einnahmen</div><div className="fin-fc-val" style={{ color: 'var(--green)' }}>+{fmtCompactDM(forecast.projectedIncome)}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Erwartete Ausgaben</div><div className="fin-fc-val" style={{ color: 'var(--red)' }}>-{fmtCompactDM(forecast.projectedExpense)}</div></div>
          <div className="fin-fc-item fin-fc-highlight">
            <div className="dim mini">Erwarteter Endkontostand</div>
            <div className="fin-fc-val" style={{ color: forecast.projectedEndBalance < 0 ? 'var(--red)' : 'var(--accent)' }}>
              {fmtFullDM(forecast.projectedEndBalance)}
            </div>
          </div>
        </div>
        <div className="dim mini" style={{ marginTop: 8 }}>
          Hochrechnung: aktueller Kontostand + (fester Monatssaldo × Restmonate) + (erwartete Heimspiel-Einnahmen × Restheimspiele).
        </div>
      </div>

      {/* LETZTE BUCHUNGEN */}
      <div className="card">
        <div className="card-title">🧾 Letzte Buchungen</div>
        {fin.transactions.length === 0 ? (
          <div className="dim" style={{ padding: 8 }}>Noch keine Buchungen in dieser Saison.</div>
        ) : (
          <table className="fin-tx-table">
            <tbody>
              {fin.transactions.slice(0, 25).map((t) => (
                <tr key={t.id}>
                  <td className="dim mini" style={{ whiteSpace: 'nowrap' }}>{CalendarEngine.formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: t.amount >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                    {t.amount >= 0 ? '+' : '−'}{fmtFullDM(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import Icon from '../../components/Icon';
import { computeMonthly, forecastSeasonEnd, totalExpense, totalIncome, weeklyWageBill } from '../../engine/finances';
import { Game } from '../../game/state';
import { ClubFinances } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtCompactDM, fmtDateShort, fmtFullDM } from '../../ui/format';
import { type ReactNode } from 'react';

export const INCOME_ROWS: { key: keyof ClubFinances['income']; label: string; icon: ReactNode }[] = [
  { key: 'ticketSales', label: 'Stadioneinnahmen', icon: <Icon name="stadium" /> },
  { key: 'catering', label: 'Catering / Würstchenbuden', icon: <Icon name="catering" /> },
  { key: 'matchday', label: 'Programmhefte & Spieltag', icon: <Icon name="marketing" /> },
  { key: 'merchandise', label: 'Fanartikel', icon: <Icon name="fans" /> },
  { key: 'tvMoney', label: 'TV- & Mediengelder', icon: <Icon name="presse" /> },
  { key: 'sponsorship', label: 'Trikotsponsoring', icon: <Icon name="sponsoring" /> },
  { key: 'advertising', label: 'Bandenwerbung', icon: <Icon name="sponsoring" /> },
  { key: 'membership', label: 'Mitgliedsbeiträge', icon: <Icon name="fans" /> },
  { key: 'prizeMoney', label: 'Prämien', icon: <Icon name="trophy" /> },
  { key: 'transferIncome', label: 'Transfererlöse', icon: <Icon name="transfers" /> },
  { key: 'other', label: 'Sonstiges', icon: <Icon name="finances" /> },
];

export const EXPENSE_ROWS: { key: keyof ClubFinances['expenses']; label: string; icon: ReactNode }[] = [
  { key: 'wages', label: 'Spielergehälter', icon: <Icon name="squad" /> },
  { key: 'staffWages', label: 'Betreuerstab', icon: <Icon name="staff" /> },
  { key: 'stadiumMaintenance', label: 'Stadionunterhalt', icon: <Icon name="stadium" /> },
  { key: 'facilities', label: 'Gebäude-Fixkosten', icon: <Icon name="facilities" /> },
  { key: 'trainingFacilities', label: 'Trainingsbetrieb (alt)', icon: <Icon name="training" /> },
  { key: 'other', label: 'Sonstige Fixkosten', icon: <Icon name="contracts" /> },
  { key: 'transferExpense', label: 'Transferausgaben', icon: <Icon name="transfers" /> },
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
  const homeRemaining = g.fixtures.filter((m) => m.homeClubId === g.managedClubId && m.status === 'scheduled').length;
  const forecast = forecastSeasonEnd(club, g.players, g.table, g.calendar.currentDate, g.calendar.seasonEndDate, homeRemaining);
  const weekly = weeklyWageBill(club, g.players);
  const wageBudget = fin.wageBudget;
  const maxIncome = Math.max(1, ...INCOME_ROWS.map((r) => fin.income[r.key]));
  const maxExpense = Math.max(1, ...EXPENSE_ROWS.map((r) => fin.expenses[r.key]));

  const warnings: string[] = [];
  if (fin.balance < 0) warnings.push(`Das Konto ist mit ${fmtFullDM(fin.balance)} im Minus.`);
  if (forecast.projectedEndBalance < 0) warnings.push(`Hochrechnung zum Saisonende: ${fmtFullDM(forecast.projectedEndBalance)}.`);
  if (weekly > wageBudget) warnings.push(`Gehälter (${fmtCompactDM(weekly)}/Woche) über dem Gehaltsbudget (${fmtCompactDM(wageBudget)}).`);
  if (monthly.net < 0) warnings.push(`Feste Monatskosten übersteigen feste Erträge um ${fmtCompactDM(-monthly.net)} – Heimspiele müssen das ausgleichen.`);
  const sign = (v: number) => (v >= 0 ? '+' : '−') + fmtCompactDM(Math.abs(v));

  return (
    <DashPage>
      <DashBox title="Kontostand" icon="finances" span={2} right={`Saison ${g.season}`}>
        <div className="dgrid2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'center' }}>
          <div>
            <Kpi value={fmtFullDM(fin.balance)} label="Kontostand" color={fin.balance < 0 ? 'var(--red)' : 'var(--accent)'} />
            <KV k="Saldo Saison" v={sign(net)} color={net >= 0 ? 'var(--green)' : 'var(--red)'} />
            <KV k="Monatssaldo (fix)" v={sign(monthly.net)} color={monthly.net >= 0 ? 'var(--green)' : 'var(--red)'} />
            <KV k="Transferbudget" v={fmtCompactDM(fin.transferBudget)} />
            <KV k="Gehälter / Budget pro Woche" v={`${fmtCompactDM(weekly)} / ${fmtCompactDM(wageBudget)}`} color={weekly > wageBudget ? 'var(--red)' : undefined} />
          </div>
          <BalanceChart points={fin.balanceHistory ?? []} current={fin.balance} currentDate={g.calendar.currentDate} />
        </div>
      </DashBox>

      <DashBox title="Prognose Saisonende" icon="stats" right={warnings.length ? `${warnings.length} Warnung(en)` : undefined}>
        <div className="dkpis">
          <Kpi value={fmtCompactDM(forecast.projectedEndBalance)} label="Endkontostand" color={forecast.projectedEndBalance < 0 ? 'var(--red)' : 'var(--accent)'} />
        </div>
        <KV k="Restmonate · Heimspiele" v={`${forecast.monthsRemaining.toLocaleString('de-DE')} · ${forecast.homeMatchesRemaining}`} />
        <KV k="Erwartete Einnahmen" v={`+${fmtCompactDM(forecast.projectedIncome)}`} color="var(--green)" />
        <KV k="Erwartete Ausgaben" v={`−${fmtCompactDM(forecast.projectedExpense)}`} color="var(--red)" />
        {warnings.map((w, i) => <div key={i} className="dnote mt8" style={{ color: 'var(--orange)', fontSize: 15 }}>{w}</div>)}
      </DashBox>

      <DashBox className="dbox-wide-lbl" title="Einnahmen (Saison)" icon="dashFinanzen" right={fmtCompactDM(income)}>
        {INCOME_ROWS.map((r) => (
          <Meter key={String(r.key)} label={<span className="dfin-lbl">{r.icon} {r.label}</span>} value={fin.income[r.key]} max={maxIncome}
            text={fin.income[r.key] > 0 ? fmtCompactDM(fin.income[r.key]) : '–'} color="var(--green)" />
        ))}
      </DashBox>

      <DashBox className="dbox-wide-lbl" title="Ausgaben (Saison)" icon="dashFinanzen" right={fmtCompactDM(expense)}>
        {EXPENSE_ROWS.map((r) => (
          <Meter key={String(r.key)} label={<span className="dfin-lbl">{r.icon} {r.label}</span>} value={fin.expenses[r.key]} max={maxExpense}
            text={fin.expenses[r.key] > 0 ? fmtCompactDM(fin.expenses[r.key]) : '–'} color="var(--orange)" />
        ))}
      </DashBox>

      <DashBox title="Letzte Buchungen" icon="contracts" right={`${fin.transactions.length}`}>
        {fin.transactions.length === 0 ? <Empty icon="contracts">Noch keine Buchungen in dieser Saison.</Empty> : fin.transactions.slice(0, 40).map((t) => (
          <div key={t.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 70 }}>{fmtDateShort(t.date).dmy}</span>
            <span className="grow">{t.description}</span>
            <span className="val" style={{ color: t.amount >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.amount >= 0 ? '+' : '−'}{fmtCompactDM(Math.abs(t.amount))}</span>
          </div>
        ))}
      </DashBox>
    </DashPage>
  );
}

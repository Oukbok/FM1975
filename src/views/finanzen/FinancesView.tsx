import { economyScale, yearOf } from '../../engine/economy';
import Icon from '../../components/Icon';
import { computeMonthly, forecastSeasonEnd, totalExpense, totalIncome, weeklyWageBill } from '../../engine/finances';
import { Game } from '../../game/state';
import { ClubFinances } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtCompactDM, fmtDateShort, fmtFullDM, fmtPrice, fmtWage, wageUnit } from '../../ui/format';
import { useState, type ReactNode } from 'react';
import Select from '../../ui/Select';
import type { InfoKey } from '../../data/infoTexts';
import { BalanceLine, LoansBox } from './businessBoxes';
import { InfoTip } from '../../ui/InfoTip';

/** i-Hilfen an einzelnen Umsatzarten (nur, wo nicht selbsterklärend). */
const INCOME_INFO: Partial<Record<string, InfoKey>> = { tvMoney: 'tvGeld', commercial: 'vermarktung', membership: 'mitglieder', catering: 'catering' };
const EXPENSE_INFO: Partial<Record<string, InfoKey>> = { operations: 'betrieb', wages: 'gehaltsquote' };

export const INCOME_ROWS: { key: keyof ClubFinances['income']; label: string; icon: ReactNode }[] = [
  { key: 'ticketSales', label: 'Stadioneinnahmen', icon: <Icon name="stadium" /> },
  { key: 'catering', label: 'Catering / Würstchenbuden', icon: <Icon name="catering" /> },
  { key: 'matchday', label: 'Programmhefte & Spieltag', icon: <Icon name="marketing" /> },
  { key: 'merchandise', label: 'Fanartikel', icon: <Icon name="fans" /> },
  { key: 'tvMoney', label: 'TV- & Mediengelder', icon: <Icon name="presse" /> },
  { key: 'sponsorship', label: 'Sponsoring & Partner', icon: <Icon name="sponsoring" /> },
  { key: 'advertising', label: 'Werbung (Banden)', icon: <Icon name="sponsoring" /> },
  { key: 'commercial', label: 'Vermarktung & Hospitality', icon: <Icon name="sponsoring" /> },
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
  { key: 'trainingFacilities', label: 'Nachwuchs (Akademie)', icon: <Icon name="youth" /> },
  { key: 'operations', label: 'Betrieb & Vermarktung', icon: <Icon name="marketing" /> },
  { key: 'other', label: 'Sonstige Fixkosten', icon: <Icon name="contracts" /> },
  { key: 'transferExpense', label: 'Transferausgaben', icon: <Icon name="transfers" /> },
];

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
  const live = club.finances;
  // Saisonwahl (Wunsch Pascal): laufende Saison + gespeicherte Saisonbilanzen, Auswahlliste mit Pfeilen.
  const hist = [...(live.seasonHistory ?? [])].reverse();
  const seasons = [g.season, ...hist.map((h) => h.season).filter((x) => x !== g.season)];
  const [selSeason, setSelSeason] = useState(g.season);
  const cur = seasons.includes(selSeason) ? selSeason : g.season;
  const rec = cur === g.season ? null : hist.find((h) => h.season === cur) ?? null;
  const fin: ClubFinances = rec ? { ...live, income: rec.income, expenses: rec.expenses } : live;
  const si = seasons.indexOf(cur);
  const seasonPicker = (
    <span className="dbtnrow fin-season">
      <button className="b3 b3-s b3-icon" disabled={si >= seasons.length - 1} onClick={() => setSelSeason(seasons[si + 1])} aria-label="Vorherige Saison" title="Vorherige Saison"><Icon name="navPrev" size={16} /></button>
      <Select size="s" width={120} value={cur} onChange={setSelSeason} options={seasons.map((x) => ({ value: x, label: x }))} />
      <button className="b3 b3-s b3-icon" disabled={si <= 0} onClick={() => setSelSeason(seasons[si - 1])} aria-label="Nächste Saison" title="Nächste Saison"><Icon name="navNext" size={16} /></button>
    </span>
  );
  const income = totalIncome(fin);
  const expense = totalExpense(fin);
  const net = income - expense;
  const monthly = computeMonthly(club, g.players, g.table, economyScale(yearOf(g.calendar.currentDate)), yearOf(g.calendar.currentDate));
  const homeRemaining = g.fixtures.filter((m) => m.homeClubId === g.managedClubId && m.status === 'scheduled').length;
  const forecast = forecastSeasonEnd(club, g.players, g.table, g.calendar.currentDate, g.calendar.seasonEndDate, homeRemaining);
  const weekly = weeklyWageBill(club, g.players);
  const wageBudget = fin.wageBudget;
  const maxIncome = Math.max(1, ...INCOME_ROWS.map((r) => fin.income[r.key]));
  const maxExpense = Math.max(1, ...EXPENSE_ROWS.map((r) => fin.expenses[r.key] ?? 0));

  const warnings: string[] = [];
  if (fin.balance < 0) warnings.push(`Das Konto ist mit ${fmtFullDM(fin.balance)} im Minus.`);
  if (forecast.projectedEndBalance < 0) warnings.push(`Hochrechnung zum Saisonende: ${fmtFullDM(forecast.projectedEndBalance)}.`);
  if (weekly > wageBudget) warnings.push(`Gehälter (${fmtWage(weekly)}) über dem Gehaltsbudget (${fmtWage(wageBudget)}).`);
  if (monthly.net < 0) warnings.push(`Feste Monatskosten übersteigen feste Erträge um ${fmtCompactDM(-monthly.net)} – Heimspiele müssen das ausgleichen.`);
  const sign = (v: number) => (v >= 0 ? '+' : '−') + fmtCompactDM(Math.abs(v));

  return (
    <DashPage>
      <DashBox title="Kontostand" info="kontostand" span={2} right={seasonPicker} className="fin-balance-box">
        <div className="fin-bal-grid">
          {rec ? (
            <div className="fin-bal-side">
              <Kpi value={fmtFullDM(rec.balanceEnd)} label={`Kontostand Saisonende ${rec.season}`} color={rec.balanceEnd < 0 ? 'var(--red)' : undefined} />
              <KV k="Ergebnis der Saison" v={sign(rec.result)} color={rec.result >= 0 ? 'var(--green)' : 'var(--red)'} strong />
              <KV k="Umsatz (ohne Transfers)" v={fmtCompactDM(rec.revenue)} />
              <KV k="Einnahmen gesamt" v={`+${fmtCompactDM(income)}`} color="var(--green)" />
              <KV k="Ausgaben gesamt" v={`−${fmtCompactDM(expense)}`} color="var(--red)" />
              <KV k="Gehaltsquote" info="gehaltsquote" v={`${Math.round(rec.wageRatio * 100)} %`} color={rec.wageRatio > 0.7 ? 'var(--orange)' : undefined} />
              <div className="dnote mt8">Abgeschlossene Saison. Der Verlauf rechts zeigt den Kontostand der letzten Jahre.</div>
            </div>
          ) : (
          <div className="fin-bal-side">
            <Kpi value={fmtFullDM(fin.balance)} label="Kontostand" info="kontostand" color={fin.balance < 0 ? 'var(--red)' : undefined} />
            <KV k="Saldo Saison" v={sign(net)} color={net >= 0 ? 'var(--green)' : 'var(--red)'} />
            <KV k="Monatssaldo (fix)" info="saldoMonat" v={sign(monthly.net)} color={monthly.net >= 0 ? 'var(--green)' : 'var(--red)'} />
            <KV k="Transferbudget" info="transferbudget" v={fmtPrice(fin.transferBudget)} />
            <KV k="Gehaltsbudget frei" info="gehaltsbudget" v={fmtWage(wageBudget - weekly)} color={weekly > wageBudget ? 'var(--red)' : undefined} />
            <div className="dsec">Prognose Saisonende<InfoTip k="prognose" /></div>
            <KV k="Endkontostand" v={fmtCompactDM(forecast.projectedEndBalance)} color={forecast.projectedEndBalance < 0 ? 'var(--red)' : undefined} strong />
            <KV k="Restmonate · Heimspiele" v={`${forecast.monthsRemaining.toLocaleString('de-DE')} · ${forecast.homeMatchesRemaining}`} />
            <KV k="Erwartete Einnahmen" v={`+${fmtCompactDM(forecast.projectedIncome)}`} color="var(--green)" />
            <KV k="Erwartete Ausgaben" v={`−${fmtCompactDM(forecast.projectedExpense)}`} color="var(--red)" />
            {warnings.map((w, i) => <div key={i} className="dnote mt8" style={{ color: 'var(--orange)' }}>{w}</div>)}
          </div>
          )}
          <div className="fin-bal-chart"><BalanceLine g={g} months={36} /></div>
        </div>
      </DashBox>

      <LoansBox g={g} />

      <DashBox className="dbox-wide-lbl" title="Einnahmen (Saison)" info="einnahmen" icon="dashFinanzen" right={`${rec ? `${rec.season} · ` : ''}${fmtCompactDM(income)}`}>
        {INCOME_ROWS.map((r) => (
          <Meter key={String(r.key)} label={<span className="dfin-lbl">{r.icon} {r.label}</span>} info={INCOME_INFO[r.key]} value={fin.income[r.key]} max={maxIncome}
            text={fin.income[r.key] > 0 ? fmtCompactDM(fin.income[r.key]) : '–'} color="var(--green)" />
        ))}
      </DashBox>

      <DashBox className="dbox-wide-lbl" title="Ausgaben (Saison)" info="ausgaben" icon="dashFinanzen" right={`${rec ? `${rec.season} · ` : ''}${fmtCompactDM(expense)}`}>
        {EXPENSE_ROWS.map((r) => (
          <Meter key={String(r.key)} label={<span className="dfin-lbl">{r.icon} {r.label}</span>} info={EXPENSE_INFO[r.key]} value={fin.expenses[r.key] ?? 0} max={maxExpense}
            text={(fin.expenses[r.key] ?? 0) > 0 ? fmtCompactDM(fin.expenses[r.key] ?? 0) : '–'} color="var(--orange)" />
        ))}
      </DashBox>

      {rec ? (
        <DashBox title="Saisonbilanzen" icon="contracts" right={`${hist.length}`}>
          {hist.map((h) => (
            <div key={h.season} className={`dlist-row clickable ${h.season === cur ? 'on' : ''}`} onClick={() => setSelSeason(h.season)}>
              <span className="meta" style={{ minWidth: 70 }}>{h.season}</span>
              <span className="grow">Umsatz {fmtCompactDM(h.revenue)}</span>
              <span className="val" style={{ color: h.result >= 0 ? 'var(--green)' : 'var(--red)' }}>{sign(h.result)}</span>
            </div>
          ))}
        </DashBox>
      ) : (
      <DashBox title="Letzte Buchungen" icon="contracts" right={`${fin.transactions.length}`}>
        {fin.transactions.length === 0 ? <Empty icon="contracts">Noch keine Buchungen in dieser Saison.</Empty> : fin.transactions.slice(0, 40).map((t) => (
          <div key={t.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 70 }}>{fmtDateShort(t.date).dmy}</span>
            <span className="grow">{t.description}</span>
            <span className="val" style={{ color: t.amount >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.amount >= 0 ? '+' : '−'}{fmtCompactDM(Math.abs(t.amount))}</span>
          </div>
        ))}
      </DashBox>
      )}
    </DashPage>
  );
}

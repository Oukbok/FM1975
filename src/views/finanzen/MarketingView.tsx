import { MARKETING_AREAS, MARKETING_BY_ID, areaBenefit, areaMonthlyCostBase, marketingAvailable, marketingIncomeBase, marketingMonthlyBase } from '../../data/marketing';
import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { CATERING_LEASE, CATERING_NETPERHEAD, CATERING_UPKEEP, cateringMatchIncome, expectedAttendance, matchdayIncome } from '../../engine/finances';
import { MAX_LEVEL } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { CateringMode } from '../../types';
import { DashBox, DashPage, KV, Kpi } from '../../ui/DashPage';
import { fmtDM, fmtDMfull } from '../../ui/format';
import { fmtSmallMoney } from '../shared';

// =============================================================================
// MARKETING — Werbe-Regler je Kanal, epochenabhängig (Block p11)
// =============================================================================
export function MarketingView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const mdScale = revenueScale('matchday', curYear); // Stadion-Erlöse wachsen langsamer (Finanzen 2.0)
  const budgets = g.marketing ?? (g.marketing = {});

  const setUnits = (id: string, units: number) => {
    const area = MARKETING_BY_ID[id];
    if (!area) return;
    const u = Math.max(0, Math.min(area.maxUnits, Math.round(units)));
    if (u <= 0) delete budgets[id];
    else budgets[id] = u;
    onChange();
  };

  const monthlyCost = Math.round(marketingMonthlyBase(budgets) * scale);
  const inc = marketingIncomeBase(budgets);
  const incMerch = Math.round(inc.merch * scale);
  const incSponsor = Math.round(inc.sponsor * scale);
  const netMonthly = incMerch + incSponsor - monthlyCost;

  // --- Mitgliedsbeitraege, Catering-Betriebsform, Programmhefte (Finanzsystem) ---
  const cateringLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(club.infrastructure?.catering ?? 1)));
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  const setCateringMode = (m: CateringMode) => {
    const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
    com.cateringMode = m;
    onChange();
  };
  // Mitgliedsbeitraege (mirror finances.computeMonthly).
  const membershipMonth = Math.round((Math.round((30000 + club.reputation * 1000) * scale)) / 12);
  // Erwartete Zuschauer & abgeleitete Spieltagserloese.
  const expAtt = expectedAttendance(club);
  const expCatering = cateringMatchIncome(club, expAtt, mdScale);
  const expProgramme = matchdayIncome(expAtt, mdScale);

  const areas = MARKETING_AREAS.filter((a) => marketingAvailable(a, curYear));
  const future = MARKETING_AREAS.filter((a) => !marketingAvailable(a, curYear)).sort((a, b) => a.unlockYear - b.unlockYear);

  return (
    <DashPage>
      <DashBox title="Werbekanäle" icon="marketing" span={2} right={`${areas.length} verfügbar`}>
        {areas.map((a) => {
          const avail = marketingAvailable(a, curYear);
          const units = budgets[a.id] ?? 0;
          const cost = Math.round(areaMonthlyCostBase(a, units) * scale);
          const benefitPct = Math.round((areaBenefit(a, units) / a.maxBenefit) * 100);
          return (
            <div key={a.id} className={`dmkt ${avail ? '' : 'locked'}`}>
              <div className="dmkt-main">
                <b>{a.name}</b>
                <span className="dnote">{a.desc}</span>
              </div>
              {avail ? (
                <div className="dmkt-ctrl">
                  <input type="range" min={0} max={a.maxUnits} step={1} value={units} onChange={(e) => setUnits(a.id, Number(e.target.value))} />
                  <span className="dnote">Stufe {units}/{a.maxUnits} · {fmtDM(cost)}/Monat · Reichweite {benefitPct} %</span>
                </div>
              ) : <span className="dchip">ab {a.unlockYear}</span>}
            </div>
          );
        })}
        <div className="dnote mt8">Kosten steigen linear mit der Stufe, der Nutzen flacht ab. Marketing bringt kleine Zusatzerträge und etwas Ansehen – sportlicher Erfolg bleibt der Haupttreiber.</div>
      </DashBox>

      <DashBox title="Kommende Werbekanäle" icon="kalender" span={2} right={`${future.length} weitere`}>
        {future.length ? future.map((a) => (
          <div key={a.id} className="dlist-row">
            <span className="dchip" style={{ minWidth: 70, textAlign: 'center' }}>ab {a.unlockYear}</span>
            <span className="grow"><b>{a.name}</b><span className="dnote" style={{ display: 'block' }}>{a.desc}</span></span>
          </div>
        )) : <div className="dnote">Alle Werbekanäle sind freigeschaltet.</div>}
      </DashBox>

      <DashBox title="Werbebilanz (Monat)" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(monthlyCost)} label="Kosten" color="var(--red)" />
          <Kpi value={`${netMonthly >= 0 ? '+' : '−'}${fmtDM(Math.abs(netMonthly))}`} label="Netto" color={netMonthly >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>
        <KV k="Merchandising" v={`+${fmtDM(incMerch)}`} color="var(--green)" />
        <KV k="Sponsoring-Zuschlag" v={`+${fmtDM(incSponsor)}`} color="var(--green)" />
        <KV k="Mitgliedsbeiträge" v={`+${fmtDM(membershipMonth)}`} color="var(--green)" />
        <div className="dnote mt8">Mitgliedsbeiträge wachsen mit dem Ansehen ({club.reputation}).</div>
      </DashBox>

      <DashBox title="Catering & Spieltag" icon="catering" right={`Stufe ${cateringLevel}`}>
        <div className="dbtnrow" style={{ marginBottom: 8 }}>
          {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
            <button key={m} className={`dchip ${cateringMode === m ? 'on' : ''}`} onClick={() => setCateringMode(m)}>{CATERING_MODE_LABEL[m]}</button>
          ))}
        </div>
        <KV k="Netto pro Besucher" v={fmtSmallMoney(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale, curYear)} />
        <KV k="Fixkosten / Monat" v={`−${fmtDMfull(Math.round(CATERING_UPKEEP[cateringMode][cateringLevel] * scale))}`} color="var(--red)" />
        {cateringMode === 'verpachtung' && <KV k="Pacht / Monat" v={`+${fmtDMfull(Math.round(CATERING_LEASE[cateringLevel] * scale))}`} color="var(--green)" />}
        <div className="dsec">Pro Heimspiel (erwartet)</div>
        <KV k="Zuschauer" v={expAtt.toLocaleString('de-DE')} />
        <KV k="Catering" v={fmtDM(expCatering)} />
        <KV k="Programmhefte" v={fmtDM(expProgramme)} />
        <div className="dnote mt8">Eigenbetrieb: höchster Erlös, hohe Fixkosten. Verpachtung: feste Pacht, kaum Kosten.</div>
      </DashBox>
    </DashPage>
  );
}

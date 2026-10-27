import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { MARKETING_AREAS, MARKETING_BY_ID, areaBenefit, areaMonthlyCostBase, marketingAvailable, marketingIncomeBase, marketingMonthlyBase } from '../../data/marketing';
import { economyScale, yearOf } from '../../engine/economy';
import { CATERING_LEASE, CATERING_NETPERHEAD, CATERING_UPKEEP, cateringMatchIncome, expectedAttendance, matchdayIncome } from '../../engine/finances';
import { MAX_LEVEL } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { CateringMode } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// MARKETING — Werbe-Regler je Kanal, epochenabhängig (Block p11)
// =============================================================================
export function MarketingView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [showFuture, setShowFuture] = useState(false);
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
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
  const expCatering = cateringMatchIncome(club, expAtt, scale);
  const expProgramme = matchdayIncome(expAtt, scale);

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Marketing"
        right={<span className="dim">Werbebudget: <b style={{ color: 'var(--accent)' }}>{fmtDM(monthlyCost)}</b>/Monat</span>}
      />

      <div className="card mt12">
        <div className="mkt-summary">
          <div><div className="dim2 mini">Kosten (Monat)</div><div className="red">−{fmtDM(monthlyCost)}</div></div>
          <div><div className="dim2 mini">Merchandising</div><div className="accent-text">+{fmtDM(incMerch)}</div></div>
          <div><div className="dim2 mini">Sponsoring</div><div className="accent-text">+{fmtDM(incSponsor)}</div></div>
          <div><div className="dim2 mini">Netto (Monat)</div><div style={{ color: netMonthly >= 0 ? 'var(--green)' : 'var(--red)' }}>{netMonthly >= 0 ? '+' : '−'}{fmtDM(Math.abs(netMonthly))}</div></div>
        </div>
        <div className="dim2 mini" style={{ marginTop: 8 }}>
          Die Kosten steigen LINEAR mit der Reglerstufe, der Nutzen folgt einer Sättigungskurve
          (jede weitere Stufe bringt weniger). Marketing erzeugt kleine Zusatzerträge und einen
          sehr geringen Ansehens-Impuls – sportlicher Erfolg bleibt der Haupttreiber.
        </div>
      </div>

      {/* --- Weitere Erloesquellen: Mitglieder, Catering-Betriebsform, Programmhefte --- */}
      <div className="dash-grid mt12">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Mitgliedsbeitraege</div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Einnahme / Monat</span>
            <b className="accent-text">{fmtDM(membershipMonth)}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Einnahme / Jahr</span>
            <b>{fmtDM(membershipMonth * 12)}</b>
          </div>
          <div className="dim2 mini mt8">
            Die Beitraege wachsen mit dem <b>Ansehen</b> des Vereins ({club.reputation}) und werden im
            Monatsabschluss automatisch gebucht. Sportlicher Erfolg und Reichweite heben das Ansehen langfristig.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="catering" /></span> Catering-Betriebsform</div>
          <div className="dim2 mini" style={{ marginBottom: 6 }}>Stufe {cateringLevel} · Netto/Besucher &amp; Fixkosten je Modell:</div>
          {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
            <div
              key={m}
              className="row"
              style={{ padding: '6px 0', cursor: 'pointer', borderLeft: cateringMode === m ? '3px solid var(--accent)' : '3px solid transparent', paddingLeft: 6 }}
              onClick={() => setCateringMode(m)}
            >
              <span className={cateringMode === m ? 'accent-text' : 'dim'}>
                {cateringMode === m ? '● ' : '○ '}{CATERING_MODE_LABEL[m]}
              </span>
              <span className="mini">
                {fmtDM(Math.round(CATERING_NETPERHEAD[m][cateringLevel] * scale))}/Besucher · <span className="red">−{fmtDM(Math.round(CATERING_UPKEEP[m][cateringLevel] * scale))}</span>
                {m === 'verpachtung' && <> · <span className="accent-text">+{fmtDM(Math.round(CATERING_LEASE[cateringLevel] * scale))} Pacht</span></>}
              </span>
            </div>
          ))}
          <div className="dim2 mini mt8">
            <b>Eigenbetrieb</b>: hoechster Pro-Kopf-Erloes, aber hohe Fixkosten. <b>Umsatzbeteiligung</b>: mittlerer Erloes,
            mittlere Kosten. <b>Verpachtung</b>: geringer Pro-Kopf-Erloes, dafuer feste Monatspacht &amp; kaum Fixkosten.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Programmhefte / Spieltag</div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Erw. Zuschauer</span>
            <b>{expAtt.toLocaleString('de-DE')}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Programmhefte / Spieltag</span>
            <b className="accent-text">{fmtDM(expProgramme)}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Catering / Spieltag ({CATERING_MODE_LABEL[cateringMode]})</span>
            <b className="accent-text">{fmtDM(expCatering)}</b>
          </div>
          <div className="dim2 mini mt8">
            Spieltagserloese aus Programmheften und Catering skalieren direkt mit der Zuschauerzahl. Mehr Auslastung
            (guenstigerer Ticketpreis, sportlicher Erfolg) hebt beide Posten je Heimspiel.
          </div>
        </div>
      </div>

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt Werbekanäle späterer Epochen (ausgegraut).</span>
      </label>

      <div className="mkt-grid mt12">
        {MARKETING_AREAS.filter((a) => marketingAvailable(a, curYear) || showFuture).map((a) => {
          const avail = marketingAvailable(a, curYear);
          const units = budgets[a.id] ?? 0;
          const cost = Math.round(areaMonthlyCostBase(a, units) * scale);
          const benefit = areaBenefit(a, units);
          const benefitPct = Math.round((benefit / a.maxBenefit) * 100);
          return (
            <div key={a.id} className={`card mkt-card ${!avail ? 'fac-locked' : ''}`}>
              <div className="mkt-head">
                <span className="fac-ico">{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="fac-name">{a.name}</div>
                  {avail
                    ? <div className="dim2 mini">{fmtDM(cost)}/Monat · Stufe {units}/{a.maxUnits}</div>
                    : <span className="pill" style={{ color: 'var(--yellow)' }}>ab {a.unlockYear}</span>}
                </div>
              </div>
              <div className="dim mini fac-desc">{a.desc}</div>
              {avail && (
                <>
                  <input
                    type="range" min={0} max={a.maxUnits} step={1} value={units}
                    className="mkt-slider"
                    onChange={(e) => setUnits(a.id, Number(e.target.value))}
                  />
                  <div className="mkt-bar"><div className="mkt-bar-fill" style={{ width: `${benefitPct}%` }} /></div>
                  <div className="dim2 mini">Nutzen (Reichweite): {benefitPct} % des Maximums</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

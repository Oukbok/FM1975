import { useState } from 'react';
import { yearOf } from '../../engine/economy';
import { CORPORATE_YEAR, MAX_INVESTOR_SHARE, NAMING_RIGHTS_YEAR, namingAnnualNominal } from '../../engine/clubBusiness';
import {
  acceptNaming, canOutsource, currentNamingOffers, debtSummary, investorQuote, outsource, sellInvestorShare,
} from '../../game/clubBusiness';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtPrice, vColor } from '../../ui/format';

// =============================================================================
// VORSTAND — Vertrauen, Rechtsform & Investor, Kredite, Namensrechte, Lizenz
// =============================================================================
export function BoardView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const act = (key: string, fn: () => string) => {
    if (confirm !== key) { setConfirm(key); return; }
    setMsg(fn()); setConfirm(null); onChange();
  };
  const conf = club.boardConfidence ?? 60;
  const corp = club.corporate;
  const out = canOutsource(g);
  const offers = currentNamingOffers(g);
  const nr = club.namingRights;
  const debt = debtSummary(club, year);
  const loans = club.loans ?? [];
  const ffp = club.finances.ffp;

  return (
    <DashPage>
      <DashBox title="Vorstand" icon="dashVerein" right={conf < 20 ? 'Letzte Warnung' : conf < 40 ? 'Besorgt' : conf < 60 ? 'Abwartend' : 'Zufrieden'}>
        <div className="dkpis">
          <Kpi value={conf} label="Vertrauen" color={vColor(conf)} />
          <Kpi value={club.boardExpectation} label="Saisonziel" />
        </div>
        <Meter label="Vertrauen" value={conf} color={vColor(conf)} />
        <KV k="Transferbudget" v={fmtPrice(club.finances.transferBudget)} />
        <div className="dnote mt8">
          Unter 40 kürzt der Vorstand die Transfermittel, unter 20 halbiert er sie. Entlassen wirst du nicht – aber ohne Vertrauen fehlt das Geld.
        </div>
      </DashBox>

      <DashBox title="Rechtsform & Investor" icon="contracts" right={corp ? 'Kapitalgesellschaft' : 'e. V.'}>
        {corp ? <>
          <KV k="Ausgegliedert seit" v={corp.since} />
          <KV k="Investor" v={corp.investorShare ? `${corp.investorName} · ${corp.investorShare} %` : 'keiner'} />
          <KV k="Kapital eingenommen" v={fmtDM(corp.capitalRaised)} color="var(--green)" />
          {!!corp.dividendsPaid && <KV k="Ausschüttungen bisher" v={fmtDM(corp.dividendsPaid)} color="var(--red)" />}
          <div className="dsec">Anteile verkaufen (max. {MAX_INVESTOR_SHARE} %, 50+1)</div>
          <div className="dbtnrow">
            {[10, 15, 24].map((s) => {
              const q = investorQuote(g, s);
              const key = `inv${s}`;
              return (
                <button key={s} className={`dchip ${confirm === key ? 'on' : ''}`} disabled={!q.ok} title={q.reason ?? ''}
                  onClick={() => act(key, () => sellInvestorShare(g, s))}>
                  {confirm === key ? `Ja, ${s} % für ${fmtDM(q.price)}` : `${s} % · ${fmtDM(q.price)}`}
                </button>
              );
            })}
          </div>
          <div className="dnote mt8">Investoren bringen Kapital, wollen aber Gewinnanteile und höhere Ziele. Viele Fans sehen das kritisch.</div>
        </> : <>
          <KV k="Rechtsform" v="eingetragener Verein" />
          <KV k="Kapital bei Ausgliederung" v={fmtDM(out.capital)} color="var(--green)" />
          <div className="dbtnrow mt8">
            <button className={`dchip ${confirm === 'out' ? 'on' : ''}`} disabled={!out.ok} onClick={() => act('out', () => outsource(g))}>
              {confirm === 'out' ? 'Ja, Ausgliederung beantragen' : 'Profibereich ausgliedern'}
            </button>
          </div>
          <div className="dnote mt8">{out.ok
            ? 'Bringt einmalig Kapital und öffnet den Weg für Investoren. Die Saisonziele werden ehrgeiziger, traditionsbewusste Fans murren.'
            : out.reason ?? `Ab ${CORPORATE_YEAR} möglich.`}</div>
        </>}
      </DashBox>

      <DashBox title="Lizenz & Schulden" icon="stats" right={debt.deduction ? `−${debt.deduction} Punkte` : undefined}>
        <div className="dkpis">
          <Kpi value={`${Math.round(debt.ratio * 100)} %`} label="Schulden / Umsatz" color={debt.ratio >= 0.6 ? 'var(--red)' : debt.ratio > 0.3 ? 'var(--yellow)' : 'var(--green)'} />
          <Kpi value={fmtDM(club.finances.balance)} label="Kontostand" color={club.finances.balance < 0 ? 'var(--red)' : undefined} />
        </div>
        {ffp?.banSeason && <KV k="Lizenzauflage" v={ffp.note ?? 'Transfersperre'} color="var(--red)" />}
        {debt.deduction ? <KV k="Punktabzug" v={`${debt.deduction} Punkte (${club.pointDeduction?.season})`} color="var(--red)" /> : null}
        {ffp?.forcedRelegation && <KV k="Zwangsabstieg" v={`zum Ende ${ffp.forcedRelegation}`} color="var(--red)" strong />}
        <div className="dnote mt8">
          Schulden über 60 % des Jahresumsatzes: 3 Punkte Abzug, über 90 %: 6, über 120 %: 9. Wer nach einem Abzug über 150 % bleibt, steigt zwangsweise ab.
          Kredite zählen zu einem Viertel.
        </div>
      </DashBox>

      <DashBox title="Kredite" icon="finances" right={loans.length ? `${loans.length}` : undefined}>
        {loans.length ? loans.map((l) => (
          <div key={l.id}>
            <KV k={l.purpose} v={fmtDM(l.remaining)} strong />
            <Meter label={`${(l.annualRate * 100).toFixed(1)} % Zins`} value={l.paidMonths} max={l.months} text={`${fmtDM(l.monthlyRate)}/Monat`} />
          </div>
        )) : <Empty icon="finances">Keine Kredite. Stadionausbauten lassen sich unter „Stadion“ per Kredit finanzieren.</Empty>}
      </DashBox>

      <DashBox title="Namensrechte" icon="sponsoring" span={2} right={nr ? `bis ${nr.untilYear}` : year < NAMING_RIGHTS_YEAR ? `ab ${NAMING_RIGHTS_YEAR}` : `${offers.length} Angebote`}>
        {nr && <>
          <KV k="Stadionname" v={nr.arenaName} strong />
          <KV k="Partner" v={nr.sponsor} />
          <KV k="Jahreswert" v={fmtDM(namingAnnualNominal(nr, club, year))} color="var(--green)" />
          <KV k="Ursprünglicher Name" v={club.stadium.baseName ?? '–'} />
        </>}
        {year < NAMING_RIGHTS_YEAR
          ? <Empty icon="sponsoring">Stadion-Namensrechte werden erst um die Jahrtausendwende zum Geschäft.</Empty>
          : offers.length ? <>
            <div className="dsec">{nr ? 'Verlängerung und neue Angebote' : 'Angebote'}</div>
            {offers.map((o, i) => {
              const key = `nr${i}`;
              return (
                <div key={key} className="dlist-row">
                  <span className="grow"><b>{o.arenaName}</b><span className="dnote" style={{ display: 'block' }}>{o.sponsor} · bis 30.06.{o.untilYear}</span></span>
                  <span className="num" style={{ color: 'var(--green)', marginRight: 12 }}>{fmtDM(namingAnnualNominal(o, club, year))} / Jahr</span>
                  <button className={`dchip ${confirm === key ? 'on' : ''}`} onClick={() => act(key, () => acceptNaming(g, o))}>
                    {confirm === key ? 'Ja, unterschreiben' : 'Annehmen'}
                  </button>
                </div>
              );
            })}
            <div className="dnote mt8">Ein Sponsorenname bringt sicheres Geld, kostet bei Traditionsvereinen aber Sympathien in der Kurve.</div>
          </> : !nr && <Empty icon="sponsoring">Derzeit keine Angebote.</Empty>}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
      </DashBox>
    </DashPage>
  );
}

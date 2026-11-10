// =============================================================================
// Boxen aus dem früheren Menüpunkt „Vorstand“ (Wunsch Pascal: Vorstand entfällt):
// Lizenz & Schulden → Finanzen (Übersicht), Kredite → Finanzen › Bilanz,
// Rechtsform & Investor → Verein (Übersicht). Namensrechte liegen in Sponsoring ›
// Namensrechte. Dazu der Kontostand-Verlauf als LineChart für beide Finanzseiten.
// =============================================================================
import { useState } from 'react';
import { yearOf } from '../../engine/economy';
import { CORPORATE_YEAR, MAX_INVESTOR_SHARE } from '../../engine/clubBusiness';
import { canOutsource, debtSummary, investorQuote, outsource, sellInvestorShare } from '../../game/clubBusiness';
import { boardSeats, buyBackShares, buybackQuote, externalShare, holders, partnerOffers, reintegrate, reintegrationQuote, sellPartnerShare } from '../../game/corporateGame';
import Select from '../../ui/Select';
import type { Game } from '../../game/state';
import { DashBox, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDateShort, fmtCompactDM, fmtFullDM } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { LineChart, type LinePoint } from '../../ui/LineChart';
import type { Club } from '../../types';

const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Kontostand-Verlauf (Monatsabschlüsse + heute) als Punkte für LineChart. */
export function balancePoints(club: Club, today: string, months = 24): LinePoint[] {
  const hist = (club.finances.balanceHistory ?? []).slice(-months);
  const all = [...hist, { date: today, balance: Math.round(club.finances.balance) }];
  return all.map((h, i) => {
    const m = +h.date.slice(5, 7) - 1, yy = h.date.slice(2, 4);
    return {
      label: m === 0 || i === 0 ? `${MON[m]} ${yy}` : MON[m],
      tip: i === all.length - 1 ? `Heute, ${fmtDateShort(h.date).dmy}` : `Monatsabschluss ${fmtDateShort(h.date).dmy}`,
      value: h.balance,
    };
  });
}

/** Kontostand-Diagramm mit beschrifteter Y-Achse und genauem Wert unter der Maus. */
export function BalanceLine({ g, months, compact }: { g: Game; months?: number; compact?: boolean }) {
  const pts = balancePoints(g.clubs[g.managedClubId], g.calendar.currentDate, months);
  if (pts.length < 2) return <div className="dnote">Der Verlauf erscheint nach dem ersten Monatsabschluss.</div>;
  return <LineChart points={pts} fmt={fmtFullDM} fmtAxis={fmtCompactDM} compact={compact} zeroBase ariaLabel="Kontostand je Monat" />;
}

export function LicenseBox({ g }: { g: Game }) {
  const club = g.clubs[g.managedClubId];
  const debt = debtSummary(club, yearOf(g.calendar.currentDate));
  const ffp = club.finances.ffp;
  return (
    <DashBox title="Lizenz & Schulden" info="lizenz" right={debt.deduction ? `−${debt.deduction} Punkte` : undefined}>
      <div className="dkpis">
        <Kpi value={`${Math.round(debt.ratio * 100)} %`} label="Schulden / Umsatz" color={debt.ratio >= 0.6 ? 'var(--red)' : debt.ratio > 0.3 ? 'var(--yellow)' : 'var(--green)'} />
        <Kpi value={fmtDM(club.finances.balance)} label="Kontostand" color={club.finances.balance < 0 ? 'var(--red)' : undefined} />
      </div>
      {ffp?.banSeason && <KV k="Lizenzauflage" v={ffp.note ?? 'Transfersperre'} color="var(--red)" />}
      {debt.deduction ? <KV k="Punktabzug" v={`${debt.deduction} Punkte (${club.pointDeduction?.season})`} color="var(--red)" /> : null}
      {ffp?.forcedRelegation && <KV k="Zwangsabstieg" v={`zum Ende ${ffp.forcedRelegation}`} color="var(--red)" strong />}
      <div className="dnote mt8">
        Schulden über 60 % des Jahresumsatzes: 3 Punkte Abzug, über 90 %: 6, über 120 %: 9. Wer nach einem Abzug über 150 % bleibt, steigt zwangsweise ab.
        Kredite zählen zu einem Viertel. Ab 2011 gilt zusätzlich das Finanzielle Fairplay.<InfoTip k="ffp" />
      </div>
    </DashBox>
  );
}

export function LoansBox({ g }: { g: Game }) {
  const loans = g.clubs[g.managedClubId].loans ?? [];
  return (
    <DashBox title="Kredite" info="kredite" right={loans.length ? `${loans.length}` : undefined}>
      {loans.length ? loans.map((l) => (
        <div key={l.id}>
          <KV k={l.purpose} v={fmtDM(l.remaining)} strong />
          <Meter label={`${(l.annualRate * 100).toFixed(1)} % Zins`} value={l.paidMonths} max={l.months} text={`${fmtDM(l.monthlyRate)}/Monat`} />
        </div>
      )) : <Empty icon="finances">Keine Kredite. Stadionausbauten lassen sich unter „Stadion“ per Kredit finanzieren.</Empty>}
    </DashBox>
  );
}

export function CorporateBox({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const corp = club.corporate;
  const out = canOutsource(g);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const offers = partnerOffers(g);
  const partners = [...new Map(offers.map((o) => [o.deal.id, o.deal])).values()];
  const [pick, setPick] = useState('');
  const dealId = partners.some((d) => d.id === pick) ? pick : partners[0]?.id ?? '';
  const act = (key: string, fn: () => string) => {
    if (confirm !== key) { setConfirm(key); return; }
    setMsg(fn()); setConfirm(null); onChange();
  };
  const chip = (key: string, label: string, yes: string, fn: () => string, ok = true, title?: string) => (
    <button key={key} className={`dchip ${confirm === key ? 'on' : ''}`} disabled={!ok} title={title ?? ''}
      onClick={(e) => { e.stopPropagation(); act(key, fn); }}>{confirm === key ? yes : label}</button>
  );
  const ext = externalShare(club);
  const past = club.corporateHistory ?? [];
  return (
    <DashBox title="Rechtsform & Anteile" info="rechtsform" right={corp ? `Kapitalgesellschaft · ${100 - ext} % Verein` : 'e. V.'}>
      {corp ? <>
        <KV k="Ausgegliedert seit" v={corp.since} />
        <KV k="Kapital eingenommen" v={fmtDM(corp.capitalRaised)} color="var(--green)" />
        {!!corp.dividendsPaid && <KV k="Ausschüttungen bisher" v={fmtDM(corp.dividendsPaid)} color="var(--red)" />}
        <KV k="Sitze im Aufsichtsrat" v={boardSeats(club) ? `${boardSeats(club)} extern` : 'nur Verein'} info="aufsichtsrat" />
        <div className="dsec">Anteilseigner</div>
        <KV k="Verein (50+1)" v={`${100 - ext} %`} strong />
        {holders(club).map((h) => {
          const q = buybackQuote(g, h.name);
          return (
            <div key={h.name} className="corp-holder">
              <KV k={`${h.name} · ${h.kind === 'investor' ? 'Investor' : 'Sponsor'}`} v={`${h.share} %`} />
              <div className="dbtnrow">{chip(`bb-${h.name}`, `Zurückkaufen · ${fmtDM(q.price)}`, `Ja, für ${fmtDM(q.price)} zurückkaufen`, () => buyBackShares(g, h.name), q.ok, q.reason)}</div>
            </div>
          );
        })}
        <div className="dsec">Anteile an den Investor (frei: {MAX_INVESTOR_SHARE - ext} %)</div>
        <div className="dbtnrow">
          {[10, 15, 24].map((s) => {
            const q = investorQuote(g, s);
            return chip(`inv${s}`, `${s} % · ${fmtDM(q.price)}`, `Ja, ${s} % für ${fmtDM(q.price)}`, () => sellInvestorShare(g, s), q.ok, q.reason);
          })}
        </div>
        <div className="dsec">Anteile an Sponsoren<InfoTip k="partneranteile" /></div>
        {partners.length ? <>
          <Select value={dealId} onChange={(v) => { setPick(v); setConfirm(null); }}
            options={partners.map((d) => ({ value: d.id, label: d.partner }))} />
          <div className="dbtnrow mt8">
            {offers.filter((o) => o.deal.id === dealId).map((o) => chip(`p-${o.deal.id}-${o.share}`, `${o.share} % · ${fmtDM(o.price)}`, `Ja, ${o.share} % für ${fmtDM(o.price)}`, () => sellPartnerShare(g, o.deal.id, o.share), o.ok, o.reason))}
          </div>
        </> : <div className="dnote">Kein Sponsor der großen Flächen (Brust, Ausrüster, Premium, Co-Partner) ohne Anteile im Vertrag.</div>}
        <div className="dsec">Zurück zum e. V.</div>
        {(() => { const q = reintegrationQuote(g); return <>
          <div className="dbtnrow">{chip('reint', `Rückführung beantragen · ${fmtDM(q.cost)}`, 'Ja, Mitgliederversammlung einberufen', () => reintegrate(g), q.ok, q.reason)}</div>
          <div className="dnote mt8">{q.ok ? 'Der Geschäftsbetrieb geht in den Verein zurück, die Gesellschaft wird aufgelöst. Fans und Identität profitieren, Kapital über Anteile gibt es erst nach einer neuen Ausgliederung.' : q.reason}</div>
        </>; })()}
      </> : <>
        <KV k="Rechtsform" v="eingetragener Verein" />
        <KV k="Kapital bei Ausgliederung" v={fmtDM(out.capital)} color="var(--green)" />
        {past.map((e) => <KV key={e.since} k={`Kapitalgesellschaft ${e.since}–${e.until}`} v={`${fmtDM(e.capitalRaised)} Kapital`} />)}
        <div className="dbtnrow mt8">
          {chip('out', 'Profibereich ausgliedern', 'Ja, Ausgliederung beantragen', () => outsource(g), out.ok)}
        </div>
        <div className="dnote mt8">{out.ok
          ? 'Bringt einmalig Kapital und öffnet den Weg für Investor und Sponsoren als Anteilseigner. Die Saisonziele werden ehrgeiziger, traditionsbewusste Fans murren.'
          : out.reason ?? `Ab ${CORPORATE_YEAR} möglich.`}</div>
      </>}
      {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
    </DashBox>
  );
}

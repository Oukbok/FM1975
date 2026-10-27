import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { CATERING_NETPERHEAD, cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { CAPACITY_PER_LEVEL, MAX_LEVEL, canUpgrade, upgradeFacility } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { CateringMode } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDMfull, vColor } from '../../ui/format';
import { avg, fmtSmallMoney, ownLeagueMatches } from '../shared';
import { useState } from 'react';

// =============================================================================
// STADION — Kenndaten, Ticketpreis, Ausbau, Spieltagserlöse, Heimspiele
// =============================================================================
const CATERING_MODE_LABEL: Record<CateringMode, string> = { eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung' };

export function StadiumView({ g, onChange }: { g: Game; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const check = canUpgrade(myClub, 'stadium');
  const [confirmExpand, setConfirmExpand] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const mdScale = revenueScale('matchday', yearOf(g.calendar.currentDate)); // Stadion-Erlöse wachsen langsamer (Finanzen 2.0)
  const doExpand = () => {
    // upgradeFacility bucht die Kosten selbst vom Konto ab.
    const res = upgradeFacility(myClub, 'stadium', g.calendar.currentDate, true);
    setMsg(res.ok ? `Stadion auf Stufe ${res.newLevel} ausgebaut.` : res.reason ?? 'Ausbau nicht möglich.');
    setConfirmExpand(false);
    onChange();
  };
  const setTicket = (delta: number) => { st.ticketPrice = Math.max(4, Math.min(60, st.ticketPrice + delta)); onChange(); };

  const cateringMode: CateringMode = myClub.commerce?.cateringMode ?? 'verpachtung';
  const cateringLevel = Math.max(1, Math.min(5, Math.round(myClub.infrastructure?.catering ?? 1)));
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticketRev = Math.round(expVisitors * st.ticketPrice * mdScale);
  const cateringRev = cateringMatchIncome(myClub, expVisitors, mdScale);
  const programmeRev = matchdayIncome(expVisitors, mdScale);
  const home = ownLeagueMatches(g, 'finished').filter((m) => m.homeClubId === myClub.id && m.result);
  const avgAtt = home.length ? Math.round(avg(home.map((m) => m.result!.attendance))) : 0;
  const affordable = check.ok && myClub.finances.balance >= check.cost;

  return (
    <DashPage>
      <DashBox title={st.name} icon="stadium" right={`Stufe ${myClub.infrastructure.stadium}/${MAX_LEVEL}`}>
        <div className="dkpis">
          <Kpi value={st.capacity.toLocaleString('de-DE')} label="Plätze" />
          <Kpi value={`${Math.round(st.averageAttendanceRate * 100)} %`} label="Ø Auslastung" />
        </div>
        <Meter label="Zustand" value={st.condition} text={`${st.condition} %`} color={vColor(st.condition)} />
        <KV k="Ticketpreis" v={fmtDMfull(st.ticketPrice * mdScale)} />
        <KV k="Heimspiele bisher" v={`${home.length}${home.length ? ` · Ø ${avgAtt.toLocaleString('de-DE')} Zuschauer` : ''}`} />
      </DashBox>

      <DashBox title="Ticketpreis & Auslastung" icon="fans">
        <div className="dbtnrow" style={{ justifyContent: 'center', alignItems: 'center', gap: 16, margin: '6px 0 12px' }}>
          <button className="dchip" onClick={() => setTicket(-1)}>− 1</button>
          <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent)', minWidth: 160, textAlign: 'center' }}>{fmtDMfull(st.ticketPrice * mdScale)}</span>
          <button className="dchip" onClick={() => setTicket(1)}>+ 1</button>
        </div>
        <Meter label="Erw. Auslastung" value={expRate * 100} text={`${Math.round(expRate * 100)} %`} />
        <KV k="Erwartete Zuschauer" v={expVisitors.toLocaleString('de-DE')} strong />
        <div className="dnote mt8">Höherer Preis bringt weniger Zuschauer, ein niedriger Preis füllt die Ränge.</div>
      </DashBox>

      <DashBox title="Ausbau" icon="facilities">
        {check.ok ? <>
          <KV k="Nächste Stufe" v={`Stufe ${check.nextLevel}`} />
          <KV k="Zusätzliche Plätze" v={`+${CAPACITY_PER_LEVEL.toLocaleString('de-DE')}`} color="var(--green)" />
          <KV k="Kosten" v={fmtDM(check.cost)} color="var(--red)" />
          <KV k="Kontostand" v={fmtDM(myClub.finances.balance)} color={affordable ? 'var(--green)' : 'var(--red)'} />
          <div className="dbtnrow mt8">
            {!confirmExpand
              ? <button className="dchip on" disabled={!affordable} onClick={() => setConfirmExpand(true)}>Stadion ausbauen</button>
              : <><button className="dchip on" onClick={doExpand}>Ja, für {fmtDM(check.cost)} ausbauen</button><button className="dchip" onClick={() => setConfirmExpand(false)}>Abbrechen</button></>}
          </div>
        </> : <Empty icon="stadium">{check.reason ?? 'Kein weiterer Ausbau möglich.'}</Empty>}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
      </DashBox>

      <DashBox title="Erlöse pro Heimspiel" icon="finances" right="erwartet">
        <div className="dkpis"><Kpi value={fmtDM(ticketRev + cateringRev + programmeRev)} label="Summe" color="var(--green)" /></div>
        <KV k="Eintritt" v={fmtDM(ticketRev)} />
        <KV k="Catering" v={fmtDM(cateringRev)} />
        <KV k="Programmhefte" v={fmtDM(programmeRev)} />
      </DashBox>

      <DashBox title="Heimspiele" icon="dashBall" right={home.length ? `Ø ${avgAtt.toLocaleString('de-DE')}` : undefined}>
        {home.length ? [...home].reverse().map((m) => (
          <Meter key={m.id} label={g.clubs[m.awayClubId]?.name ?? '—'} value={m.result!.attendance} max={st.capacity} text={m.result!.attendance.toLocaleString('de-DE')} />
        )) : <Empty icon="dashBall">Noch kein Heimspiel in dieser Saison.</Empty>}
      </DashBox>

      <DashBox title="Catering" icon="catering" right={`Stufe ${cateringLevel}/${MAX_LEVEL}`}>
        <KV k="Betriebsform" v={CATERING_MODE_LABEL[cateringMode]} strong />
        <KV k="Netto pro Besucher" v={fmtSmallMoney(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale, yearOf(g.calendar.currentDate))} />
        <div className="dnote mt8">Betriebsform unter „Marketing“, Ausbau unter „Vereinsgelände“.</div>
      </DashBox>
    </DashPage>
  );
}

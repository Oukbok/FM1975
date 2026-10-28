import { economyScale, revenueScale, yearOf } from '../../engine/economy';
import { CATERING_NETPERHEAD, cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { MAX_LEVEL } from '../../engine/infrastructure';
import { annuity, loanInterest, stadiumPlan, vipIncome } from '../../engine/clubBusiness';
import { startStadiumBuild } from '../../game/clubBusiness';
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
  const year = yearOf(g.calendar.currentDate);
  const plan = stadiumPlan(myClub, year);
  const proj = myClub.stadiumProject;
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const scale = economyScale(year);
  const mdScale = revenueScale('matchday', year); // Stadion-Erlöse wachsen langsamer (Finanzen 2.0)
  const rate = loanInterest(year, myClub.finances.balance < 0);
  const build = (key: string, financing: 'cash' | 'loan', years: number) => {
    if (confirm !== key) { setConfirm(key); return; }
    setMsg(startStadiumBuild(g, financing, years));
    setConfirm(null);
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
  const vipRev = vipIncome(myClub, mdScale, year);

  return (
    <DashPage>
      <DashBox title={st.name} icon="stadium" right={`Stufe ${myClub.infrastructure.stadium}/${MAX_LEVEL}`}>
        <div className="dkpis">
          <Kpi value={st.capacity.toLocaleString('de-DE')} label="Plätze" />
          <Kpi value={`${Math.round(st.averageAttendanceRate * 100)} %`} label="Ø Auslastung" />
        </div>
        <Meter label="Zustand" value={st.condition} text={`${st.condition} %`} color={vColor(st.condition)} />
        <KV k="Ticketpreis" v={fmtDMfull(st.ticketPrice * mdScale)} />
        <KV k="Logen" v={st.vipBoxes ? `${st.vipBoxes}` : 'keine'} />
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

      <DashBox title="Ausbau" icon="facilities" right={proj ? 'im Bau' : plan ? plan.label : undefined}>
        {proj ? <>
          <KV k="Ziel" v={`Stufe ${proj.targetLevel} · +${proj.addCapacity.toLocaleString('de-DE')} Plätze${proj.addBoxes ? ` · ${proj.addBoxes} Logen` : ''}`} />
          <KV k="Fertigstellung" v={`${proj.finishDate.slice(8, 10)}.${proj.finishDate.slice(5, 7)}.${proj.finishDate.slice(0, 4)}`} strong />
          <KV k="Gesperrt während Bau" v={`${proj.capacityLoss.toLocaleString('de-DE')} Plätze`} color="var(--red)" />
          <KV k="Finanzierung" v={proj.financing === 'loan' ? 'Kredit (siehe Vorstand)' : 'bar bezahlt'} />
          <KV k="Baukosten" v={fmtDM(proj.cost)} />
        </> : plan ? <>
          <KV k="Nächste Stufe" v={`Stufe ${plan.targetLevel} · ${plan.buildSeasons} ${plan.buildSeasons === 1 ? 'Saison' : 'Saisons'} Bauzeit`} />
          <KV k="Zusätzlich" v={`+${plan.addCapacity.toLocaleString('de-DE')} Plätze${plan.addBoxes ? ` · ${plan.addBoxes} Logen` : ''}`} color="var(--green)" />
          <KV k="Kosten" v={fmtDM(plan.cost)} color="var(--red)" />
          <div className="dbtnrow mt8">
            <button className={`dchip ${confirm === 'cash' ? 'on' : ''}`} disabled={myClub.finances.balance < plan.cost} onClick={() => build('cash', 'cash', 0)}>
              {confirm === 'cash' ? 'Ja, bar bezahlen' : 'Bar bezahlen'}
            </button>
            {[10, 15, 20].map((y) => (
              <button key={y} className={`dchip ${confirm === `l${y}` ? 'on' : ''}`} onClick={() => build(`l${y}`, 'loan', y)}>
                {confirm === `l${y}` ? `Ja, Kredit ${y} J.` : `Kredit ${y} J. · ${fmtDM(annuity(plan.cost, rate, y * 12))}/Mon.`}
              </button>
            ))}
          </div>
          <div className="dnote mt8">Zins derzeit {(rate * 100).toFixed(1)} % p. a. Während der Bauzeit sind rund 8 % der Plätze gesperrt.</div>
        </> : <Empty icon="stadium">Maximalstufe erreicht.</Empty>}
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
      </DashBox>

      <DashBox title="Erlöse pro Heimspiel" icon="finances" right="erwartet">
        <div className="dkpis"><Kpi value={fmtDM(ticketRev + cateringRev + programmeRev + vipRev)} label="Summe" color="var(--green)" /></div>
        <KV k="Eintritt" v={fmtDM(ticketRev)} />
        <KV k="Catering" v={fmtDM(cateringRev)} />
        <KV k="Programmhefte" v={fmtDM(programmeRev)} />
        {vipRev > 0 && <KV k="Logen & VIP" v={fmtDM(vipRev)} />}
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

import Icon from '../../components/Icon';
import { economyScale, yearOf } from '../../engine/economy';
import { cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';

// --- FANS -------------------------------------------------------------------
export function FansView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const scale = economyScale(yearOf(g.calendar.currentDate));
  // Erwartete Auslastung bei aktuellem Ticketpreis (mit Elastizitaet).
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticket = Math.round(expVisitors * st.ticketPrice * scale);
  const catering = cateringMatchIncome(myClub, expVisitors, scale);
  const programme = matchdayIncome(expVisitors, scale);
  const perMatchTotal = ticket + catering + programme;
  // Mitglieder-Schaetzung: Beitraege / typischer Jahresbeitrag (~40 DM 1975-Basis).
  const memberYear = Math.round((30000 + myClub.reputation * 1000));
  const estMembers = Math.round(memberYear / 40);
  return (
    <div className="page">
      <PageHead icon="fans" title={<>Fans — <span className="accent">{myClub.name}</span></>} />
      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Zuschauer & Auslastung</div>
          <div className="row mt8"><span className="dim">Ø Auslastung (Basis)</span><b className="accent-text">{Math.round(st.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erwartete Auslastung</span><b className="accent-text">{Math.round(expRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erw. Zuschauer</span><b>{expVisitors.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b>{st.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ticketpreis</span><b>{fmtDM(st.ticketPrice * scale)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Geschätzte Mitglieder</span><b>{estMembers.toLocaleString('de-DE')}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Spieltags-Einnahmen (erwartet)</div>
          <div className="dim2 mini mt8">Pro Heimspiel bei {expVisitors.toLocaleString('de-DE')} Zuschauern:</div>
          <div className="row mt8"><span className="dim">Eintritt</span><b className="green">{fmtDM(ticket)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Catering / Würstchenbuden</span><b className="green">{fmtDM(catering)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Programmhefte & Spieltag</span><b className="green">{fmtDM(programme)}</b></div>
          <div className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="dim">Summe je Heimspiel</span><b className="green">{fmtDM(perMatchTotal)}</b></div>
          <div className="dim2 mini mt12">Mehr Zuschauer → mehr Eintritt, Catering und Programmhefte. Der Ticketpreis (Stadion) steuert die Auslastung.</div>
        </div>
      </div>
    </div>
  );
}

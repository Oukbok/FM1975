import Icon from '../../components/Icon';
import { economyScale, yearOf } from '../../engine/economy';
import { CATERING_NETPERHEAD, cateringMatchIncome, expectedAttendance, expectedAttendanceRate, matchdayIncome } from '../../engine/finances';
import { CAPACITY_PER_LEVEL, MAX_LEVEL, canUpgrade, upgradeFacility } from '../../engine/infrastructure';
import { Game } from '../../game/state';
import { CateringMode } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';

// --- STADION (eigenständige Seite) ------------------------------------------
export function StadiumView({ g, onChange }: { g: Game; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const check = canUpgrade(myClub, 'stadium');
  const doExpand = () => {
    if (!check.ok) return;
    if (myClub.finances.balance < check.cost) { alert('Nicht genügend Guthaben für den Ausbau.'); return; }
    if (!confirm(`Stadion für ${fmtDM(check.cost)} auf Stufe ${check.nextLevel} ausbauen? (+${CAPACITY_PER_LEVEL.toLocaleString('de-DE')} Plätze)`)) return;
    const res = upgradeFacility(myClub, 'stadium', g.calendar.currentDate, true);
    if (res.ok) { myClub.finances.balance -= res.cost; onChange(); }
    else alert(res.reason ?? 'Ausbau nicht möglich.');
  };
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const setTicket = (delta: number) => {
    st.ticketPrice = Math.max(4, Math.min(60, st.ticketPrice + delta));
    onChange();
  };
  const cateringMode: CateringMode = myClub.commerce?.cateringMode ?? 'verpachtung';
  const cateringLevel = Math.max(1, Math.min(5, Math.round(myClub.infrastructure?.catering ?? 1)));
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  // Vorschau erwartete Auslastung/Erloese bei aktuellem Ticketpreis (Elastizitaet).
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticketRev = Math.round(expVisitors * st.ticketPrice * scale);
  const cateringRev = cateringMatchIncome(myClub, expVisitors, scale);
  const programmeRev = matchdayIncome(expVisitors, scale);
  return (
    <div className="page">
      <PageHead icon="stadium" title={<>Stadion — <span className="accent">{st.name}</span></>} />
      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="stadium" /></span> Kenndaten</div>
          <div className="row mt8"><span className="dim">Name</span><b>{st.name}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b className="accent-text">{st.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {myClub.infrastructure.stadium} / {MAX_LEVEL}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Zustand</span><b>{st.condition}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ø Auslastung</span><b>{Math.round(st.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ticketpreis</span><b>{fmtDM(st.ticketPrice)}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Ausbau</div>
          {check.ok ? (
            <>
              <div className="dim mini mt8">Nächste Ausbaustufe erhöht die Kapazität um <b style={{ color: 'var(--text)' }}>{CAPACITY_PER_LEVEL.toLocaleString('de-DE')}</b> Plätze.</div>
              <div className="row mt12"><span className="dim">Neue Stufe</span><b className="accent-text">Stufe {check.nextLevel}</b></div>
              <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kosten</span><b className="red">{fmtDM(check.cost)}</b></div>
              <div className="row" style={{ padding: '6px 0' }}><span className="dim">Guthaben</span><b className={myClub.finances.balance >= check.cost ? 'green' : 'red'}>{fmtDM(myClub.finances.balance)}</b></div>
              <button className="btn-sm btn-primary mt12" onClick={doExpand} disabled={myClub.finances.balance < check.cost}>Stadion ausbauen</button>
            </>
          ) : (
            <div className="dim mt8">{check.reason ?? 'Kein weiterer Ausbau möglich.'}</div>
          )}
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Ticketpreis & Auslastung</div>
          <div className="row mt8" style={{ alignItems: 'center' }}>
            <span className="dim">Ticketpreis</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn-sm btn-ghost" onClick={() => setTicket(-1)}>−1</button>
              <b className="accent-text" style={{ minWidth: 84, textAlign: 'center' }}>{fmtDM(st.ticketPrice * scale)}</b>
              <button className="btn-sm btn-ghost" onClick={() => setTicket(1)}>+1</button>
            </span>
          </div>
          <div className="dim2 mini mt8">Höherer Preis → weniger Zuschauer, niedriger Preis → mehr (Elastizität).</div>
          <div className="row mt12"><span className="dim">Erwartete Auslastung</span><b className="accent-text">{Math.round(expRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erw. Zuschauer</span><b>{expVisitors.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="dim">Eintritt / Heimspiel</span><b className="green">{fmtDM(ticketRev)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Catering / Heimspiel</span><b className="green">{fmtDM(cateringRev)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Programm / Heimspiel</span><b className="green">{fmtDM(programmeRev)}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="catering" /></span> Catering-Status</div>
          <div className="row mt8"><span className="dim">Betriebsform</span><b>{CATERING_MODE_LABEL[cateringMode]}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {cateringLevel} / {MAX_LEVEL}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Netto / Besucher</span><b>{fmtDM(Math.round(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale))}</b></div>
          <div className="dim2 mini mt12">Betriebsform &amp; Ausbau steuerst du unter „Anlagen" bzw. „Marketing".</div>
        </div>
      </div>
    </div>
  );
}

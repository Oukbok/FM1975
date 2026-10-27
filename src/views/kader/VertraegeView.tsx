import Icon from '../../components/Icon';
import { CalendarEngine } from '../../engine/calendar';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';

// --- VERTRÄGE ---------------------------------------------------------------
export function VertraegeView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const squad = myClub.playerIds.map((id) => g.players[id]).sort((a, b) => b.overall - a.overall);
  return (
    <div className="page">
      <PageHead icon="contracts" title={<>Verträge — <span className="accent">{myClub.name}</span></>} />
      <div className="card">
        <div className="card-title"><span className="ico"><Icon name="contracts" /></span> Laufende Verträge</div>
        <table className="mt12" style={{ width: '100%' }}>
          <thead>
            <tr className="dim mini">
              <th style={{ textAlign: 'left' }}>Spieler</th>
              <th style={{ textAlign: 'center' }}>Pos.</th>
              <th style={{ textAlign: 'right' }}>Gehalt/Wo.</th>
              <th style={{ textAlign: 'right' }}>Laufzeit bis</th>
              <th style={{ textAlign: 'right' }}>Wert</th>
            </tr>
          </thead>
          <tbody>
            {squad.map((p) => (
              <tr key={p.id}>
                <td>{p.fullName}</td>
                <td style={{ textAlign: 'center' }}><span className="pos-badge">{p.naturalPosition}</span></td>
                <td style={{ textAlign: 'right' }}>{fmtDM(p.contract.weeklyWage)}</td>
                <td style={{ textAlign: 'right' }}>{CalendarEngine.formatDate(p.contract.expiryDate)}</td>
                <td style={{ textAlign: 'right' }} className="accent-text">{fmtDM(p.contract.transferValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dim2 mini mt12">Vertragsverhandlungen und -verlängerungen folgen in einem späteren Ausbau.</div>
      </div>
    </div>
  );
}

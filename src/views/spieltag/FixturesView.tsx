import ClubModal from '../../components/ClubModal';
import { CalendarEngine } from '../../engine/calendar';
import { buildClubProfile } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';
import { useState } from 'react';

// =============================================================================
// SPIELPLAN
// =============================================================================
export function FixturesView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const myMatches = g.fixtures.filter((m) => m.involvesPlayerClub).sort((a, b) => a.matchday - b.matchday);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const mid = g.managedClubId;
  return (
    <div className="page">
      <PageHead icon="schedule" title={<>Spielplan — <span className="accent">{g.clubs[g.managedClubId].name}</span></>} />
      <div className="card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>ST</th><th>Datum</th><th>Heim</th><th style={{ textAlign: 'center' }}>Erg.</th><th>Auswärts</th><th></th></tr></thead>
            <tbody>
              {myMatches.map((m) => {
                const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
                const isMyHome = m.homeClubId === g.managedClubId;
                const homeCls = m.homeClubId !== mid ? 'club-link' : '';
                const awayCls = m.awayClubId !== mid ? 'club-link' : '';
                return (
                  <tr key={m.id}>
                    <td><b>{m.matchday}</b></td>
                    <td className="dim mini">{CalendarEngine.formatDate(m.date)}</td>
                    <td className={homeCls} style={{ fontWeight: isMyHome ? 800 : 600, cursor: m.homeClubId !== mid ? 'pointer' : 'default' }}
                        onClick={() => { if (m.homeClubId !== mid) setClubModalId(m.homeClubId); }}
                        title={m.homeClubId !== mid ? 'Vereinsprofil öffnen' : undefined}>{h.shortName}</td>
                    <td style={{ textAlign: 'center' }}><b className="accent-text">{m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : '–:–'}</b></td>
                    <td className={awayCls} style={{ fontWeight: !isMyHome ? 800 : 600, cursor: m.awayClubId !== mid ? 'pointer' : 'default' }}
                        onClick={() => { if (m.awayClubId !== mid) setClubModalId(m.awayClubId); }}
                        title={m.awayClubId !== mid ? 'Vereinsprofil öffnen' : undefined}>{a.shortName}</td>
                    <td>{m.status === 'finished' && <button className="btn-sm" onClick={() => onWatch(m.id)}>Bericht</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}

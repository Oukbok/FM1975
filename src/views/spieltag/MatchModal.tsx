import ClubCrest from '../../components/ClubCrest';
import { ROUND_NAMES, findTie } from '../../engine/cup';
import { Game } from '../../game/state';

// =============================================================================
// MATCH-BERICHT / LIVE-TICKER
// =============================================================================
export function MatchModal({ g, matchId, onClose }: { g: Game; matchId: string; onClose: () => void }) {
  const cupTie = matchId.startsWith('cup_') ? findTie(g.cup, matchId) : null;
  const m = (g.fixtures.find((x) => x.id === matchId) ?? cupTie?.match)!;
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  const headerLabel = cupTie ? `DFB-Pokal · ${ROUND_NAMES[cupTie.round]}` : `${m.matchday}. Spieltag`;
  const keyEvents = m.events.filter((e) =>
    ['goal', 'penalty_goal', 'own_goal', 'red_card', 'yellow_red_card', 'half_time', 'full_time', 'kickoff', 'injury',
     'extra_time_start', 'extra_time_half', 'extra_time_end', 'shootout_start', 'shootout_goal', 'shootout_miss', 'shootout_end'].includes(e.type));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div className="row">
            <span className="dim mini">{headerLabel}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '14px 0 6px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <ClubCrest club={h} size={48} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>{h.shortName}</div>
            </div>
            <div className="big-num" style={{ color: 'var(--accent)' }}>
              {m.result?.homeGoals}:{m.result?.awayGoals}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <ClubCrest club={a} size={48} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>{a.shortName}</div>
            </div>
          </div>
          {m.result && (
            <div className="dim mini" style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
              <span>Ballbesitz {m.result.homePossession}%</span>
              <span>Schüsse {m.result.homeShots}:{m.result.awayShots}</span>
              <span>Zuschauer {m.result.attendance.toLocaleString('de-DE')}</span>
            </div>
          )}
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <div className="ticker" style={{ maxHeight: 'none' }}>
            {keyEvents.map((e) => (
              <div key={e.id} className="ticker-item"><span className="accent-text" style={{ marginRight: 8, fontWeight: 700 }}>{e.minute}'</span>{e.commentary}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

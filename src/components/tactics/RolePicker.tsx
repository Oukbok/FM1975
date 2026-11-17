// =============================================================================
// Rollenwahl an der Taktiktafel: Rollen der Position mit Eignung des Spielers
// (Sterne aus den Schlüsselattributen), Beschreibung der markierten Rolle. Feste
// Größe; liegt neben dem angeklickten Magneten innerhalb der Tafel.
// =============================================================================
import { useState } from 'react';
import type { Player, Position } from '../../types';
import { ROLES, roleFor, roleRef, roleStars, type RoleDef } from '../../engine/tacticRoles';
import Icon from '../Icon';

const W = 330, H = 300; // px (Entwurfsgröße der Seite; passt in die halbe Höhe der liegenden Tafel)

export function RolePicker({ spot, position, player, year, value, rating, onPick, onClose }: {
  spot: { x: number; y: number }; position: Position; player?: Player; year: number; value: string; rating: number;
  onPick: (id: string | null) => void; onClose: () => void;
}) {
  const roles = ROLES.filter((r) => r.positions.includes(position));
  const cur = roleFor(value, position, year);
  const [hover, setHover] = useState<RoleDef | null>(null);
  const show = hover ?? cur;
  const locked = (r: RoleDef) => !!r.from && year < r.from;
  const ref = player ? roleRef(player, rating) : rating;
  const left = spot.x < 50;
  return (
    <div className="txr" role="dialog" aria-label={`Rolle ${position}`} onClick={(e) => e.stopPropagation()}
      style={{ width: W, height: H, left: left ? `calc(${spot.x}% + 30px)` : `calc(${spot.x}% - ${W + 30}px)`, top: `clamp(8px, calc(${spot.y}% - ${H / 2}px), calc(100% - ${H + 8}px))` }}>
      <div className="txr-head">
        <span><b>{player ? player.lastName : 'Freier Platz'}</b><i>{position}</i></span>
        <button type="button" className="txr-x" aria-label="Schließen" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      <div className="txr-list" onMouseLeave={() => setHover(null)}>
        {roles.map((r) => {
          const lk = locked(r);
          const stars = player && !r.base ? roleStars(player, r, ref) : 0;
          return (
            <button key={r.id} type="button" className={`txr-row${r.id === cur.id ? ' on' : ''}${lk ? ' locked' : ''}`} aria-disabled={lk || undefined}
              onMouseEnter={() => setHover(r)} onFocus={() => setHover(r)} onClick={() => { if (!lk) onPick(r.base ? null : r.id); }}>
              <span className="txr-dot" />
              <span className="txr-label">{r.label}</span>
              {lk ? <span className="txr-tag"><Icon name="lockMono" size={12} /> ab {r.from}</span>
                : r.base ? <span className="txr-tag">Grundrolle</span>
                : r.until && year > r.until ? <span className="txr-tag">aus der Mode</span>
                : <span className="txr-stars" title={`Eignung ${stars} von 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= stars ? 'on' : ''} />)}</span>}
            </button>
          );
        })}
      </div>
      <div className="txr-text">
        <b>{show.label}</b>
        <p>{locked(show) ? `Diese Rolle kennt der Fußball erst ab ${show.from}.` : show.text}</p>
      </div>
    </div>
  );
}

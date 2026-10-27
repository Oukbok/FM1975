import PlayerAvatar from '../../components/PlayerAvatar';
import { RatingResult } from '../../engine/development';
import { Game } from '../../game/state';
import { PlayerDevReveal } from '../../types';
import { vColor } from '../../ui/format';
import { useEffect, useState } from 'react';

// =============================================================================
// AUF-/ABWERTUNGS-SCREEN (Trommelwirbel)
// =============================================================================
export function DevelopmentReveal({ g, reveals, onClose }: {
  g: Game; reveals: PlayerDevReveal[]; onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'roll' | 'done'>('roll');

  // Trommelwirbel je Spieler, dann Enthüllung.
  useEffect(() => {
    setPhase('roll');
    const t = setTimeout(() => setPhase('done'), 1400);
    return () => clearTimeout(t);
  }, [idx]);

  const rev = reveals[idx];
  const player = g.players[rev.playerId];
  const club = g.clubs[g.managedClubId];
  const isLast = idx >= reveals.length - 1;

  const dir = rev.netOvr > 0 ? 'up' : rev.netOvr < 0 ? 'down' : 'mixed';
  const dirLabel = dir === 'up' ? 'AUFWERTUNG' : dir === 'down' ? 'ABWERTUNG' : 'VERÄNDERUNG';
  const dirArrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '●';

  const ovrChange = rev.changes.find((c) => c.attribute === 'overall');
  const attrChanges = rev.changes.filter((c) => c.attribute !== 'overall');

  const next = () => { if (isLast) onClose(); else setIdx((i) => i + 1); };

  return (
    <div className="reveal-overlay" role="dialog" aria-modal="true">
      <button className="reveal-close" onClick={onClose} title="Schließen">✕</button>
      <div className="reveal-progress">Spieler {idx + 1} / {reveals.length}</div>

      <div className={`reveal-card dir-${dir} phase-${phase}`}>
        <div className="reveal-avatar">
          <PlayerAvatar player={player} club={club} size="large" />
        </div>
        <div className="reveal-name">{player.fullName}</div>
        <div className="reveal-pos">{player.naturalPosition} · {player.age} Jahre</div>

        {phase === 'roll' ? (
          <div className="reveal-roll">
            <div className="drumroll">
              <span></span><span></span><span></span>
            </div>
            <div className="drumroll-txt">Trommelwirbel …</div>
          </div>
        ) : (
          <div className="reveal-result">
            <div className={`reveal-badge dir-${dir}`}>{dirArrow} {dirLabel}</div>

            {ovrChange && (
              <div className="reveal-ovr">
                <span className="ro-lbl">Gesamtstärke</span>
                <span className="ro-vals">
                  <b style={{ color: vColor(ovrChange.oldValue) }}>{ovrChange.oldValue}</b>
                  <span className="ro-arrow">→</span>
                  <b style={{ color: vColor(ovrChange.newValue) }}>{ovrChange.newValue}</b>
                </span>
              </div>
            )}

            {attrChanges.length > 0 && (
              <div className="reveal-attrs">
                {attrChanges.map((c, i) => (
                  <div key={i} className={`ra-row ${c.direction}`}>
                    <span className="ra-name">{c.attributeLabel}</span>
                    <span className="ra-vals">
                      {c.oldValue} <span className="ra-arrow">{c.direction === 'up' ? '▲' : '▼'}</span> {c.newValue}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={`reveal-reason ${rev.isLifeEvent ? 'life-event' : ''}`}>
              {rev.isLifeEvent && <span className="le-tag">Privat</span>}
              „{rev.reason}"
            </div>

            <button className="btn-continue paused reveal-next" onClick={next}>
              {isLast ? 'Fertig' : 'Weiter →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LEISTUNGSBEWERTUNGS-ZEREMONIE (sequenzielle Enthüllung, nur eigener Verein)
// -----------------------------------------------------------------------------
// x1  = nächsten Spieler einzeln enthüllen
// x2  = zwei Spieler pro Schritt enthüllen (schneller)
// Überspringen = sofort alle Ergebnisse zeigen
// Die Werte sind bereits im Game-State angewandt; hier werden sie nur enthüllt.
// =============================================================================
export function RatingCeremony({ results, type, anlass, onClose }: {
  results: RatingResult[]; type: 'medium' | 'large'; anlass: string; onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const total = results.length;
  const done = revealed >= total;

  const step = (n: number) => setRevealed((r) => Math.min(total, r + n));
  const skip = () => setRevealed(total);

  // Enthüllte Spieler, neueste zuerst (so verfolgt man den Fortschritt oben).
  const shown = results.slice(0, revealed).slice().reverse();
  const ups = results.filter((r) => r.change > 0).length;
  const downs = results.filter((r) => r.change < 0).length;
  const flats = total - ups - downs;

  const title = type === 'large' ? 'Große Saison-Bewertung' : 'Leistungsbewertung';

  return (
    <div className="reveal-overlay" role="dialog" aria-modal="true">
      <div className="rc-panel">
        <div className="rc-head">
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>{title}</div>
            <div className="dim mini">{anlass} · dein Verein</div>
          </div>
          {done && <button className="reveal-close" onClick={onClose} title="Schließen">✕</button>}
        </div>

        <div className="rc-progress">
          <span className="dim mini">{Math.min(revealed, total)} / {total} enthüllt</span>
          {done && total > 0 && (
            <span className="rc-summary">
              <span className="green">▲ {ups}</span>
              <span className="red">▼ {downs}</span>
              <span className="dim">● {flats}</span>
            </span>
          )}
        </div>

        {total === 0 ? (
          <div className="dim" style={{ padding: '32px 0', textAlign: 'center' }}>
            Keine Spieler zu bewerten.
          </div>
        ) : (
          <div className="rc-list">
            {shown.map((r, i) => {
              const cls = r.change > 0 ? 'up' : r.change < 0 ? 'down' : 'flat';
              return (
                <div key={r.playerId} className={`rc-row ${cls} ${i === 0 && !done ? 'newest' : ''}`}>
                  <div className="rc-info">
                    <span className="rc-name">{r.playerName}</span>
                    <span className="dim mini">{r.clubShort} · {r.position} · {r.age} J.</span>
                  </div>
                  <div className="rc-ovr">
                    <b className="rc-old">{r.oldOverall}</b>
                    <span className="rc-arrow">→</span>
                    <b className={r.change > 0 ? 'green' : r.change < 0 ? 'red' : 'accent-text'}>{r.newOverall}</b>
                    <span className={`rc-delta ${cls}`}>
                      {r.change > 0 ? `▲ +${r.change}` : r.change < 0 ? `▼ ${r.change}` : '●'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rc-controls">
          {!done ? (
            <>
              <button className="btn-sm rc-btn" onClick={() => step(1)}>x1</button>
              <button className="btn-sm rc-btn" onClick={() => step(2)}>x2</button>
              <button className="btn-sm btn-ghost" onClick={skip}>Überspringen</button>
            </>
          ) : (
            <button className="btn-continue paused" onClick={onClose}>Fertig</button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DIE BESTEN DER SAISON — festliches Popup am Tag nach dem letzten Ligaspieltag
// (game/seasonAwardsGame.ts merkt es in game.seasonAwards.pending vor; GameShell
// zeigt es, sobald kein anderes Fenster offen ist). Vier Karten, Ehrenzeile,
// Plätze 2/3; eigene Spieler in Bernstein. Esc/Enter schließt.
// =============================================================================
import { useEffect } from 'react';
import { AWARD_CATS } from '../../../engine/seasonAwards';
import { type AwardSeason, ownHonours } from '../../../game/seasonAwardsGame';
import type { Game } from '../../../game/state';
import { InfoTip } from '../../../ui/InfoTip';
import { AwardCard, AwardHonours } from './AwardParts';

export function AwardsModal({ g, s, onClose, onArchive }: { g: Game; s: AwardSeason; onClose: () => void; onArchive?: () => void }) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // Offenes Spielerprofil (über PlayerLink, liegt darüber) schließt zuerst.
      if (document.querySelector('.pp2')) return;
      if (ev.key === 'Escape' || ev.key === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopImmediatePropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const mine = ownHonours(g, s);
  return (
    <>
    <div className="modal-overlay aw-overlay" onClick={onClose}>
      <div className="modal modal-xl aw-modal" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label={`Die Besten der Saison ${s.season}`}>
        <div className="mx-head aw-head">
          <div>
            <div className="mx-sub">{s.divName} · Ehrung zum Saisonende</div>
            <h2>Die Besten der Saison {s.season}<InfoTip k="awards_wertung" /></h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="mx-body aw-body">
          <div className="aw-grid">
            {AWARD_CATS.map((cat, i) => <AwardCard key={cat} g={g} s={s} cat={cat} k={i} />)}
          </div>
          <AwardHonours g={g} s={s} />
        </div>
        <div className="mx-foot aw-foot">
          <span className="aw-foot-note">
            {mine.length ? `Aus deinem Kader geehrt: ${mine.map((m) => m.e.n).join(', ')}` : 'Diesmal ist niemand aus deinem Kader unter den Besten.'}
          </span>
          {onArchive && <button className="btn btn-ghost" onClick={onArchive}>Alle Jahrgänge</button>}
          <button className="btn btn-primary" onClick={onClose}>Weiter</button>
        </div>
      </div>
    </div>
    </>
  );
}

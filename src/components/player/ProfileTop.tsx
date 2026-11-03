// Kopf rechts im Spielerprofil: kleines Positionsfeld (Klick wählt die Position, eigener Kader:
// „Position trainieren“), Saisonbilanz (alle Pflichtspiele) und Vertragsstatus.
import { useState } from 'react';
import type { Player, Position } from '../../types';
import { POSITION_NAMES_DE, positionSuitability } from '../../engine/positions';
import {
  dayNum, floorOf, IDLE_DAYS, setTrainingPosition, skillOf, skillTier, TIER_DE, TRAIN_CAP,
} from '../../engine/positionSkill';
import { useClubProfile } from '../club/ClubLink';
import { fmtPrice, fmtWage } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import PositionPitch from './PositionPitch';
import { utcDate } from './shared';

const dateOf = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

export default function ProfileTop({ p, sel, best, onSelect }: {
  p: Player; sel: Position; best: Position[]; onSelect: (pos: Position) => void;
}) {
  const g = useClubProfile()?.game;
  const [, force] = useState(0);
  const s = p.seasonStats;
  const c = p.contract;
  const ps = p.positionSkill;
  const train = ps?.train;
  const today = g?.calendar.currentDate;
  const mine = !!g && p.clubId === g.managedClubId;
  const v = skillOf(p, sel);
  const tier = skillTier(v);
  const usedDay = ps?.used?.[sel];
  const idle = today && ps ? dayNum(today) - (usedDay ?? ps.t0) : 0;
  let status: string;
  if (sel === p.naturalPosition) status = 'Stammposition – baut nicht ab.';
  else if (train === sel) status = `Wird trainiert: Training allein bringt ihn bis ${TRAIN_CAP}, den Rest holt er sich in Spielen.`;
  else if (usedDay != null && idle < IDLE_DAYS) status = `Zuletzt hier am ${utcDate(dateOf(usedDay))}.`;
  else if (v > floorOf(p, sel) + 0.5 && idle >= IDLE_DAYS) status = `Lange nicht gespielt – baut langsam ab (nie unter ${Math.round(floorOf(p, sel))}).`;
  else status = usedDay != null ? `Zuletzt hier am ${utcDate(dateOf(usedDay))}.` : 'Noch nicht auf dieser Position eingesetzt.';
  const toggleTrain = () => {
    if (!today) return;
    setTrainingPosition(p, train === sel ? null : sel, today);
    force((n) => n + 1);
  };
  const suit = (pos: Position) => positionSuitability(p, pos);

  return (
    <div className="pp2-topright">
      <div className="pp2-pitchbox">
        <PositionPitch p={p} sel={sel} train={train} best={best} suit={suit} onSelect={onSelect} />
      </div>
      <div className="pp2-topinfo">
        <div className="pp2-block">
          <div className="pp2-bt">Saisonbilanz <span className="pp2-bt-sub">{s.appearances} Spiele · alle Wettbewerbe</span></div>
          <table className="pp2-bilanz">
            <thead><tr><th>Eins.</th><th>Tore</th><th>{p.naturalPosition === 'TW' ? 'Zu null' : 'Vorl.'}</th><th>Ø Note</th><th>Karten G/GR/R</th></tr></thead>
            <tbody><tr>
              <td>{s.appearances}</td><td>{s.goals || '–'}</td>
              <td>{p.naturalPosition === 'TW' ? (s.cleanSheets || '–') : (s.assists || '–')}</td>
              <td>{s.averageRating > 0 ? s.averageRating.toFixed(2) : '–'}</td>
              <td>{s.yellowCards}/{s.yellowRedCards}/{s.redCards}</td>
            </tr></tbody>
          </table>
        </div>
        <div className="pp2-block">
          <div className="pp2-bt">Vertragsstatus</div>
          <div className="pp2-kvl"><span>Marktwert<InfoTip k="marktwert" /></span><b>{fmtPrice(c.transferValue)}</b></div>
          <div className="pp2-kvl"><span>Gehalt</span><b>{fmtWage(c.weeklyWage)}</b></div>
          <div className="pp2-kvl"><span>Vertragsende</span><b>{utcDate(c.expiryDate)}</b></div>
        </div>
        <div className="pp2-block pp2-posinfo">
          <div className="pp2-posline">
            <b>{sel}</b> {POSITION_NAMES_DE[sel]}
            <span className={`psk-tag psk-${tier}`}>{TIER_DE[tier]}</span>
            {mine && sel !== p.naturalPosition && (
              <button type="button" className={`btn btn-sm psk-train ${train === sel ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleTrain}
                title={train && train !== sel ? `Ersetzt das Training als ${POSITION_NAMES_DE[train]}` : undefined}>
                {train === sel ? 'Training beenden' : 'Position trainieren'}
              </button>
            )}
          </div>
          <div className="psk-status">
            Vertrautheit {Math.round(v)} · Eignung {suit(sel)} – {status}
            {mine && sel === p.naturalPosition && train && <> Positionstraining: {POSITION_NAMES_DE[train]} ({Math.round(skillOf(p, train))}).</>}
          </div>
        </div>
      </div>
    </div>
  );
}

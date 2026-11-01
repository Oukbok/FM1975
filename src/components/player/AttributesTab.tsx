// Reiter „Attribute“: Spielfeld mit allen Positionen (Vertrautheit in Grünstufen, je Position
// ein Fortschrittsbalken), beste Position vorausgewählt; Klick wählt eine andere Position →
// deren Eignung, Vertrautheit (mit Höchstwert) und Positionstraining (eigene Spieler).
// Rechts alle Werte; für die gewählte Position wichtige Attribute mit blauem Strich
// (kräftig = Schlüsselattribut, schlank/heller = wichtig), unwichtige gedimmt.
// Gewichtung direkt aus der Engine (engine/positions.ts `weightsFor`, epochenabhängig).
import { useState } from 'react';
import { Player, Position } from '../../types';
import { POSITION_NAMES_DE, positionSuitability } from '../../engine/positions';
import {
  dayNum, floorOf, IDLE_DAYS, peakOf, rankedPositions, setTrainingPosition, skillOf, skillTier, TIER_DE, TRAIN_CAP,
} from '../../engine/positionSkill';
import { useClubProfile } from '../club/ClubLink';
import { ATTR_DE, groupsFor, sortedKeys, groupAvg, attrTiers, Section, Bar, utcDate } from './shared';
import PositionPitch, { TierLegend } from './PositionPitch';

const dateOf = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

export default function AttributesTab({ p }: { p: Player }) {
  const g = useClubProfile()?.game;
  const [, force] = useState(0);
  const ranked = rankedPositions(p, positionSuitability);
  const [pos, setPos] = useState<Position>(ranked[0].pos);
  const tiers = attrTiers(pos);
  const suit = positionSuitability(p, pos);
  const v = skillOf(p, pos);
  const peak = peakOf(p, pos);
  const tier = skillTier(v);
  const ps = p.positionSkill;
  const train = ps?.train;
  const today = g?.calendar.currentDate;
  const mine = !!g && p.clubId === g.managedClubId;
  const usedDay = ps?.used?.[pos];
  const idle = today && ps ? dayNum(today) - (usedDay ?? ps.t0) : 0;
  let status: string;
  if (pos === p.naturalPosition) status = 'Stammposition – baut nicht ab.';
  else if (train === pos) status = `Wird trainiert: Training allein bringt ihn bis ${TRAIN_CAP}, den Rest holt er sich in Spielen.`;
  else if (usedDay != null && idle < IDLE_DAYS) status = `Zuletzt auf dieser Position am ${utcDate(dateOf(usedDay))}.`;
  else if (v > floorOf(p, pos) + 0.5 && idle >= IDLE_DAYS) status = `Lange nicht gespielt – baut langsam ab (nie unter ${Math.round(floorOf(p, pos))}).`;
  else status = usedDay != null ? `Zuletzt auf dieser Position am ${utcDate(dateOf(usedDay))}.` : 'Noch nicht auf dieser Position eingesetzt.';

  const toggleTrain = () => {
    if (!today) return;
    setTrainingPosition(p, train === pos ? null : pos, today);
    force((n) => n + 1);
  };

  return (
    <div className="pp-grid pp-grid-attr">
      <div className="pp-stack">
        <Section title="Positionen" right={<span className="psk-hint">Klick wählt eine Position</span>}>
          <PositionPitch p={p} sel={pos} train={train} onSelect={setPos} />
          <TierLegend />
          <div className="pp-pos-head">
            <span className="pp-pos-name">{POSITION_NAMES_DE[pos]} <span className={`psk-tag psk-${tier}`}>{TIER_DE[tier]}</span></span>
            <span className="pp-pos-suit">Eignung <b>{suit}</b></span>
          </div>
          <div className="psk-fam">
            <div className="psk-fam-head"><span>Vertrautheit</span><b>{Math.round(v)}</b>{peak > v + 0.5 && <em>Höchstwert {Math.round(peak)}</em>}</div>
            <div className="psk-fam-track">
              <div className={`psk-fam-fill psk-${tier}`} style={{ width: `${v}%` }} />
              {peak > v + 0.5 && <div className="psk-fam-peak" style={{ left: `${peak}%` }} title={`Höchstwert ${Math.round(peak)}`} />}
            </div>
            <div className="psk-status">{status}</div>
          </div>
          {mine && pos !== p.naturalPosition && (
            <div className="psk-train-row">
              <button type="button" className={`btn btn-sm psk-train ${train === pos ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleTrain}>
                {train === pos ? 'Training beenden' : 'Position trainieren'}
              </button>
              {train && train !== pos && <span className="psk-note">ersetzt das Training als {POSITION_NAMES_DE[train]}</span>}
            </div>
          )}
          {mine && pos === p.naturalPosition && train && (
            <div className="psk-note">Positionstraining: {POSITION_NAMES_DE[train]} ({Math.round(skillOf(p, train))})</div>
          )}
          <div className="pp-legend">
            <span><i className="pp-lg-core" />Schlüsselattribut</span>
            <span><i className="pp-lg-use" />wichtig</span>
            <span><i className="pp-lg-dim" />ohne Einfluss</span>
          </div>
        </Section>
      </div>
      <div className="pp-attr-cols">
        {groupsFor(p, pos).map((grp) => (
          <Section key={grp.title} title={grp.title} right={`Ø ${groupAvg(p, grp.keys)}`}>
            {sortedKeys(grp.keys).map((k) => (
              <Bar key={k} label={ATTR_DE[k]} value={Math.round(p.attributes[k])} tier={tiers.get(k) ?? 'dim'} />
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}

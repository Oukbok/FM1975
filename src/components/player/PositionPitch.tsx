// Spielfeld mit allen Positionen (wie im Football Manager): Färbung nach Vertrautheit
// (natürlich = kräftiges Grün, gut = mittleres, ausreichend = schwaches, ungeeignet neutral),
// je Position ein kleiner Fortschrittsbalken. Seitengenau (Positionen 2.0): links LV/LM/LA,
// rechts RV/RM/RA – jede Seite hat ihre eigene Vertrautheit. Klick wählt die Position.
import type { Player, Position } from '../../types';
import { POSITION_NAMES_DE } from '../../engine/positions';
import { skillOf, skillTier, TIER_DE } from '../../engine/positionSkill';

/** Lage auf dem Feld in % (oben = Angriff). */
const SPOTS: { pos: Position; x: number; y: number }[] = [
  { pos: 'MS', x: 50, y: 6 },
  { pos: 'HS', x: 50, y: 17 },
  { pos: 'LA', x: 15, y: 20 }, { pos: 'RA', x: 85, y: 20 },
  { pos: 'OM', x: 50, y: 29 },
  { pos: 'LM', x: 15, y: 40 }, { pos: 'ZM', x: 50, y: 41 }, { pos: 'RM', x: 85, y: 40 },
  { pos: 'DM', x: 50, y: 53 },
  { pos: 'LV', x: 15, y: 63 }, { pos: 'IV', x: 50, y: 66 }, { pos: 'RV', x: 85, y: 63 },
  { pos: 'LIB', x: 50, y: 78 },
  { pos: 'TW', x: 50, y: 92 },
];

export default function PositionPitch({ p, sel, train, onSelect }: {
  p: Player; sel: Position; train?: Position; onSelect: (pos: Position) => void;
}) {
  return (
    <div className="psk-pitch">
      <svg className="psk-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="99" height="99" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <ellipse cx="50" cy="50" rx="13" ry="8.5" />
        <rect x="24" y="0.5" width="52" height="15" />
        <rect x="24" y="84.5" width="52" height="15" />
      </svg>
      {SPOTS.map((s) => {
        const v = skillOf(p, s.pos);
        const tier = skillTier(v);
        return (
          <button key={s.pos} type="button"
            className={`psk-chip psk-${tier}${s.pos === sel ? ' on' : ''}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            title={`${POSITION_NAMES_DE[s.pos]} – ${TIER_DE[tier]} (${Math.round(v)})`}
            onClick={() => onSelect(s.pos)}>
            <span className="psk-chip-code">{s.pos}{s.pos === train && <i className="psk-chip-train" />}</span>
            <span className="psk-chip-bar"><span style={{ width: `${Math.max(2, v)}%` }} /></span>
          </button>
        );
      })}
    </div>
  );
}

/** Legende der Stufen. */
export function TierLegend() {
  return (
    <div className="psk-legend">
      {(['natural', 'good', 'ok', 'none'] as const).map((t) => (
        <span key={t}><i className={`psk-sw psk-${t}`} />{TIER_DE[t]}</span>
      ))}
    </div>
  );
}

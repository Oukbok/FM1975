// Kleines Spielfeld im Kopf des Spielerprofils (Vorbild EA Fussball Manager): je Position ein
// Punkt mit „Kürzel|Eignung“. Punktfarbe nach Vertrautheit (natürlich = kräftiges Grün, gut =
// mittleres, ausreichend = schwaches, ungeeignet neutral). Beschriftet werden alle Positionen,
// die er wenigstens ausreichend kennt, und seine sechs besten; die übrigen bleiben ein blasser
// Punkt. Seitengenau (Positionen 2.0). Klick wählt die Position (Schlüsselattribute, Training).
import type { Player, Position } from '../../types';
import { POSITION_NAMES_DE } from '../../engine/positions';
import { skillOf, skillTier, TIER_DE } from '../../engine/positionSkill';

/** Lage auf dem Feld in % (oben = Angriff). */
export const SPOTS: { pos: Position; x: number; y: number }[] = [
  { pos: 'MS', x: 50, y: 8 },
  { pos: 'HS', x: 50, y: 19 },
  { pos: 'LA', x: 16, y: 19 }, { pos: 'RA', x: 84, y: 19 },
  { pos: 'OM', x: 50, y: 30 },
  { pos: 'LM', x: 16, y: 41 }, { pos: 'ZM', x: 50, y: 42 }, { pos: 'RM', x: 84, y: 41 },
  { pos: 'DM', x: 50, y: 54 },
  { pos: 'LV', x: 16, y: 65 }, { pos: 'IV', x: 50, y: 66 }, { pos: 'RV', x: 84, y: 65 },
  { pos: 'LIB', x: 50, y: 78 },
  { pos: 'TW', x: 50, y: 91 },
];

export default function PositionPitch({ p, sel, train, best, suit, onSelect }: {
  p: Player; sel: Position; train?: Position;
  /** Immer beschriftete Positionen (die besten sechs). */
  best: Position[];
  suit: (pos: Position) => number;
  onSelect: (pos: Position) => void;
}) {
  return (
    <div className="pp2-pitch">
      <svg className="psk-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="99" height="99" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <ellipse cx="50" cy="50" rx="13" ry="8.5" />
        <rect x="24" y="0.5" width="52" height="13" />
        <rect x="24" y="86.5" width="52" height="13" />
      </svg>
      {SPOTS.map((s) => {
        const v = skillOf(p, s.pos);
        const tier = skillTier(v);
        const label = tier !== 'none' || best.includes(s.pos) || s.pos === sel;
        return (
          <button key={s.pos} type="button"
            className={`pp2-spot psk-${tier}${label ? '' : ' faint'}${s.pos === sel ? ' on' : ''}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            title={`${POSITION_NAMES_DE[s.pos]} – Vertrautheit ${TIER_DE[tier].toLowerCase()} (${Math.round(v)}), Eignung ${suit(s.pos)}`}
            onClick={() => onSelect(s.pos)}>
            <i className="pp2-dot">{s.pos === train && <b className="pp2-dot-train" />}</i>
            {label && <span className="pp2-spot-lbl">{s.pos}<em>|</em>{suit(s.pos)}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Legende der Vertrautheits-Stufen. */
export function TierLegend() {
  return (
    <div className="psk-legend pp2-legend">
      {(['natural', 'good', 'ok', 'none'] as const).map((t) => (
        <span key={t}><i className={`psk-sw psk-${t}`} />{TIER_DE[t]}</span>
      ))}
    </div>
  );
}

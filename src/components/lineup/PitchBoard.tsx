// =============================================================================
// Aufstellung: Spielfeld mit Spielerkarten (Mitte) und Ersatzbank darunter.
// Ziehen läuft über Zeiger-Ereignisse (LineupView); hier nur die Darstellung
// mit Ablagezielen (data-lu-drop) und der Vorschau beim Verschieben.
// =============================================================================
import type { PointerEvent as RPE } from 'react';
import type { Player, Position } from '../../types';
import type { Formation } from '../../data/formations';
import { PITCH_GRID, type GridPoint } from '../../data/pitchGrid';
import { positionSuitability, suitabilityColor } from '../../engine/positions';
import PitchSVG from './PitchSVG';
import { PlayerForm, PlayerFreshness } from '../status';

export interface SlotPreview { slotId: string; x: number; y: number; position: Position; grid: GridPoint | null; swapWith: string | null }

const isOut = (p: Player) => p.availability !== 'available' || !!p.injury || p.suspensionMatches > 0;

function Card({ p, pos, captain, small }: { p: Player; pos: Position; captain: boolean; small?: boolean }) {
  const suit = positionSuitability(p, pos);
  return (
    <div className={`lu-card ${small ? 'sm' : ''} ${isOut(p) ? 'out' : ''}`} style={{ borderLeftColor: suitabilityColor(suit) }}>
      <div className="lu-card-top">
        <span className="lu-card-pos">{pos}</span>
        {captain && <span className="lu-cap" title="Kapitän">K</span>}
        <span className="lu-card-st"><PlayerFreshness p={p} size={13} /><PlayerForm p={p} size={13} /></span>
        <span className="lu-card-suit" title="Eignung auf dieser Position">{suit}</span>
      </div>
      <div className="lu-card-name">{p.lastName}</div>
    </div>
  );
}

export default function PitchBoard({ formation, map, players, captainId, bench, benchSize, hover, preview, dragSlot, snap, onSlotDown, onPlayerDown }: {
  formation: Formation; map: Record<string, string>; players: Record<string, Player>; captainId: string | null;
  bench: Player[]; benchSize: number; hover: string | null; preview: SlotPreview | null; dragSlot: string | null; snap: boolean;
  onSlotDown: (e: RPE, slotId: string) => void; onPlayerDown: (e: RPE, p: Player) => void;
}) {
  const showGrid = !!dragSlot && snap;
  return (
    <div className="lu-board">
      <div className="lu-pitch-area">
        <div className="lu-pitch">
          <div className="lu-field" data-lu-drop="pitch">
            <PitchSVG />
            {showGrid && PITCH_GRID.map((g) => (
              <span key={g.id} className={`lu-gp ${preview?.grid?.id === g.id ? 'on' : ''}`} style={{ left: `${g.x}%`, top: `${g.y}%` }} />
            ))}
            {formation.slots.map((s) => {
              const pid = map[s.id];
              const p = pid ? players[pid] : undefined;
              const moving = dragSlot === s.id && preview && !preview.swapWith;
              const x = moving ? preview!.x : s.x, y = moving ? preview!.y : s.y;
              const pos = moving ? preview!.position : s.position;
              return (
                <div key={s.id} className={`lu-slot ${hover === `slot:${s.id}` ? 'over' : ''} ${dragSlot === s.id ? 'dragging' : ''} ${s.position === 'TW' ? 'gk' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }} data-lu-drop={`slot:${s.id}`} data-slot={s.id} data-pid={pid ?? ""}
                  onPointerDown={(e) => onSlotDown(e, s.id)}>
                  {p ? <Card p={p} pos={pos} captain={captainId === p.id} />
                    : <div className="lu-card empty"><div className="lu-card-top"><span className="lu-card-pos">{pos}</span></div><div className="lu-card-name dim">frei</div></div>}
                  {moving && !snap && <div className="lu-live-pos">{preview!.grid?.label}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="lu-bench" data-lu-drop="bench:end">
        <div className="lu-bench-head"><span>Ersatzbank</span><span className="lu-sec-n">{bench.length}/{benchSize}</span></div>
        <div className="lu-bench-row" style={{ gridTemplateColumns: `repeat(${benchSize}, minmax(0, 1fr))` }}>
          {Array.from({ length: benchSize }, (_, i) => {
            const p = bench[i];
            return (
              <div key={i} className={`lu-bslot ${hover === `bench:${i}` ? 'over' : ''}`} data-lu-drop={`bench:${i}`}
                onPointerDown={p ? (e) => onPlayerDown(e, p) : undefined} data-pid={p?.id}>
                {p ? <Card p={p} pos={p.naturalPosition} captain={false} small /> : <div className="lu-card sm empty"><div className="lu-card-name dim">frei</div></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

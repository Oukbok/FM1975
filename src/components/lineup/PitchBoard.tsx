// =============================================================================
// Aufstellung: Spielfeld mit Spielerkarten (Mitte) und Ersatzbank darunter (ab 6 Plätzen zwei Reihen).
// Ziehen läuft über Zeiger-Ereignisse (LineupView); hier nur die Darstellung
// mit Ablagezielen (data-lu-drop) und der Vorschau beim Verschieben.
// =============================================================================
import { LeaderName } from '../player/LeaderMark';
import FaceThumb from '../FaceThumb';
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react';
import type { Player, Position } from '../../types';
import type { Formation } from '../../data/formations';
import { PITCH_GRID, type GridPoint } from '../../data/pitchGrid';
import { familiarity, positionSuitability } from '../../engine/positions';
import { FitBadge, fitByPlayer, fitByPosition, fitProps } from './FitGlow';
import PitchSVG from './PitchSVG';
import { useDelayedPlayerCard } from '../playerCard/PlayerCardFloat';
import { posGroupClass } from '../../ui/positionBadges';

export interface SlotPreview { slotId: string; x: number; y: number; position: Position; grid: GridPoint | null; swapWith: string | null }

const isOut = (p: Player) => p.availability !== 'available' || !!p.injury || p.suspensionMatches > 0;

function Card({ p, pos, captain, small }: { p: Player; pos: Position; captain: boolean; small?: boolean }) {
  const suit = positionSuitability(p, pos);
  // Box in der Farbe der Eignung auf der Position (Vertrautheit), nicht der Stärke (Wunsch Pascal).
  const fam = Math.round(p.positionSkill?.v[pos] ?? familiarity(p, pos) * 100);
  const famCls = fam >= 90 ? 'f4' : fam >= 70 ? 'f3' : fam >= 50 ? 'f2' : 'f1';
  return (
    <div className={`lu-card ${small ? 'sm' : ''} ${isOut(p) ? 'out' : ''}`}>
      <div className="lu-card-top">
        <span className={`lu-card-pos ${posGroupClass(pos)}`}>{pos}</span>
        {captain && <span className="lu-cap" title="Kapitän">K</span>}
        <span className={`lu-card-suit ${famCls}`} title={`Stärke auf dieser Position ${suit} · Vertrautheit ${fam} %`}>{suit}</span>
      </div>
      {!small && <FaceThumb p={p} size={50} className="lu-card-head" />}
      <div className="lu-card-name">{small && <FaceThumb p={p} size={16} className="lu-card-face" />}<LeaderName p={p}>{p.lastName}</LeaderName></div>
    </div>
  );
}

/** Ersatzbank: ab 6 Plätzen zwei Reihen (Wunsch Pascal), damit die Karten lesbar bleiben. */
export const benchCols = (n: number) => (n > 5 ? Math.ceil(n / 2) : Math.max(1, n));

export default function PitchBoard({ formation, map, players, captainId, bench, benchSize, hover, preview, dragSlot, snap, reserveCount, full, note, lifted, dragPid, glowPid, onSlotDown, onPlayerDown, side, wide }: {
  formation: Formation; map: Record<string, string>; players: Record<string, Player>; captainId: string | null;
  bench: Player[]; benchSize: number; hover: string | null; preview: SlotPreview | null; dragSlot: string | null; snap: boolean;
  /** Spieler in der Reserve; full = Ziel beim Ziehen ist voll; note = Hinweis nach abgewiesener Ablage; lifted = gezogene Karte hängt am Zeiger. */
  reserveCount: number; full: 'bench' | 'xi' | null; note: string | null; lifted: boolean; dragPid: string | null;
  /** Gezogener Spieler (nur bei laufendem Ziehen): alle Feldkarten leuchten in der Farbe seiner Eignung je Position. */
  glowPid?: string | null;
  onSlotDown: (e: RPE, slotId: string) => void; onPlayerDown: (e: RPE, p: Player) => void;
  /** Spalte rechts neben dem Feld (Formation, Einrasten, Speichern …) */
  side?: ReactNode;
  /** Feld füllt die ganze Box (breiter als maßstabsgetreu, Wunsch Pascal) */
  wide?: boolean;
}) {
  const showGrid = !!dragSlot && snap;
  // Eignung des gezogenen Spielers je Position (Wunsch Pascal): einmal beim Start des Ziehens berechnen.
  const glowP = glowPid ? players[glowPid] : undefined;
  const fit = useMemo(() => glowP ? fitByPosition(glowP, formation.slots.map((s) => s.position)) : null, [glowP, formation]);
  // Vom Feld gezogen: Bankkarten nach ihrer Eignung für dessen Position (schneller Ersatz finden).
  const srcPos = glowP && dragSlot ? formation.slots.find((s) => s.id === dragSlot)?.position : undefined;
  const benchFit = useMemo(() => srcPos ? fitByPlayer(bench.map((p) => ({ id: p.id, p })), srcPos) : null, [srcPos, bench]);
  // Infokarte nach 2 s Hover über einen aufgestellten Spieler (Wunsch Pascal); beim Ziehen nie.
  const hoverCard = useDelayedPlayerCard(2000, !!dragSlot || !!dragPid || lifted);
  // Breites Feld: Seitenverhältnis der Box messen, das Spielfeld wird entsprechend breiter gezeichnet.
  const pitchRef = useRef<HTMLDivElement>(null);
  const [stretch, setStretch] = useState(1);
  useLayoutEffect(() => {
    const el = pitchRef.current;
    if (!wide || !el) return;
    const measure = () => { const w = el.clientWidth, h = el.clientHeight; if (w > 50 && h > 50) setStretch(Math.max(1, Math.min(1.6, (w / h) / (72 / 109)))); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wide]);
  return (
    <div className="lu-board">
      <div className="lu-pitch-area">
        <div className={`lu-pitch ${wide ? 'wide' : ''}`} ref={pitchRef}>
          <div className="lu-field" data-lu-drop="pitch">
            <PitchSVG stretch={wide ? stretch : 1} />
            {showGrid && PITCH_GRID.map((g) => (
              <span key={g.id} className={`lu-gp ${preview?.grid?.id === g.id ? 'on' : ''}`} style={{ left: `${g.x}%`, top: `${g.y}%` }} />
            ))}
            {formation.slots.map((s) => {
              const pid = map[s.id];
              const p = pid ? players[pid] : undefined;
              const moving = dragSlot === s.id && preview && !preview.swapWith;
              const x = moving ? preview!.x : s.x, y = moving ? preview!.y : s.y;
              const pos = moving ? preview!.position : s.position;
              const f = fit && glowP ? (fit[pos] ?? positionSuitability(glowP, pos)) : null;
              const fp = fitProps(f);
              return (
                <div key={s.id} className={`lu-slot ${hover === `slot:${s.id}` ? 'over' : ''} ${dragSlot === s.id ? 'dragging' : ''} ${dragSlot === s.id && lifted ? 'lifted' : ''} ${s.position === 'TW' ? 'gk' : ''} ${fp.cls}`}
                  style={{ left: `${x}%`, top: `${y}%`, ...fp.style }} data-lu-drop={`slot:${s.id}`} data-slot={s.id} data-pid={pid ?? ""}
                  onPointerDown={(e) => onSlotDown(e, s.id)} {...hoverCard.bind(p)}>
                  {p ? <Card p={p} pos={pos} captain={captainId === p.id} />
                    : <div className="lu-card empty"><div className="lu-card-top"><span className={`lu-card-pos ${posGroupClass(pos)}`}>{pos}</span></div><div className="lu-card-name dim">frei</div></div>}
                  <FitBadge v={f} title={glowP ? `Eignung von ${glowP.lastName} auf ${pos}` : undefined} />
                  {moving && !snap && <div className="lu-live-pos">{preview!.grid?.label}</div>}
                </div>
              );
            })}
          </div>
        </div>
        {side && <div className="lu-side">{side}</div>}
      </div>
      <div className="lu-bench-wrap">
        <div className={`lu-bench lu-dropzone ${hover?.startsWith('bench:') ? (full === 'bench' ? 'full' : 'over') : ''}`} data-lu-drop="bench:end">
          <div className="lu-bench-head">
            <span>Ersatzbank</span><span className="lu-sec-n">{bench.length}/{benchSize}</span>
            {(full === 'bench' && hover?.startsWith('bench:')) ? <span className="lu-zone-note neg">Bank voll – auf einen Bankspieler ziehen</span>
              : note ? <span className="lu-zone-note neg" role="status">{note}</span> : null}
          </div>
          <div className="lu-bench-row" style={{ gridTemplateColumns: `repeat(${benchCols(benchSize)}, minmax(0, 1fr))` }}>
            {Array.from({ length: benchSize }, (_, i) => {
              const p = bench[i];
              const bf = p && benchFit ? benchFit[p.id] : null;
              const bp = fitProps(bf);
              return (
                <div key={i} className={`lu-bslot ${hover === `bench:${i}` && full !== 'bench' ? 'over' : ''} ${p ? '' : 'free'} ${p && lifted && p.id === dragPid ? 'lifted' : ''} ${bp.cls}`} data-lu-drop={`bench:${i}`}
                  style={bp.style} onPointerDown={p ? (e) => onPlayerDown(e, p) : undefined} data-pid={p?.id} {...hoverCard.bind(p)}>
                  {p ? <Card p={p} pos={p.naturalPosition} captain={false} small /> : <div className="lu-card sm empty"><div className="lu-card-name dim">frei</div></div>}
                  <FitBadge v={bf} title={p && srcPos ? `Eignung von ${p.lastName} auf ${srcPos}` : undefined} />
                </div>
              );
            })}
          </div>
        </div>
        <div className={`lu-reserve lu-dropzone ${hover === 'reserve' ? 'over' : ''}`} data-lu-drop="reserve">
          <div className="lu-bench-head"><span>Reserve</span><span className="lu-sec-n">{reserveCount}</span></div>
          <div className="lu-reserve-box" data-lu-drop="reserve">hierher ziehen</div>
        </div>
      </div>
      {hoverCard.card}
    </div>
  );
}

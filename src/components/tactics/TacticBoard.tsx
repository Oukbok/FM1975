// =============================================================================
// TAKTIKTAFEL (Taktik-Seite, links): das Spielfeld zeigt, was die Anweisungen
// bedeuten. Zwei Ansichten: „Mit Ball“ (Breite, Aufbau, Flanken, Tempo) und
// „Gegen den Ball“ (Abwehrlinie, Pressingzone, Abseitsfalle, Deckung). Die
// Magnete rücken bei jeder Änderung an ihren neuen Platz. Ein Klick auf einen
// Magneten öffnet die Rollenwahl (engine/tacticRoles.ts).
// Lage in Prozent des Feldes; Linien/Pfeile in Pixeln (gemessene Größe), damit
// nichts verzerrt. Reine Anzeige – gerechnet wird in der Match-Engine.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { Player, Position, Tactics } from '../../types';
import { POSITION_GROUPS } from '../../types';
import type { Formation, FormationSlot } from '../../data/formations';
import { effectiveTactics, markingOf, stepOf } from '../../engine/tacticEra';
import { roleFor } from '../../engine/tacticRoles';
import { cachedSuitability } from '../../engine/match/team';
import PitchSVG from '../lineup/PitchSVG';
import { RolePicker } from './RolePicker';

export type BoardPhase = 'ball' | 'gegen';
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const Y_LINE = [78, 73, 68, 62, 56], Y_PRESS = [56, 48, 40, 31, 22];
const ROLE_DY: Record<string, number> = { av_off: -9, av_def: 3, lib_frei: -11, zm_wasser: 3, zm_antr: -3, om_schatten: -5, ms_konter: -2, ms_wand: 2, dm_ab: 2, iv_spiel: -2 };
const ROLE_IN: Record<string, number> = { fl_inv: 0.72, am_ein: 0.74 };

interface Spot { slot: FormationSlot; x: number; y: number; role: string; p?: Player }

function layout(formation: Formation, t: Tactics, year: number, phase: BoardPhase, players: Record<string, Player>): { spots: Spot[]; yLine: number; yPress: number } {
  const eff = effectiveTactics(t, year)!;
  const zone = markingOf(eff, year) === 'zone';
  const field = formation.slots.filter((s) => s.position !== 'TW');
  const lo = Math.min(...field.map((s) => s.y)), hi = Math.max(...field.filter((s) => s.position !== 'LIB').map((s) => s.y));
  const yLine = Y_LINE[stepOf(eff.defensiveLine)] + (eff.style === 'defensive' ? 2 : eff.style === 'attacking' ? -2 : 0);
  const yPress = Y_PRESS[stepOf(eff.pressing)];
  const spots = formation.slots.map((slot): Spot => {
    const pid = t.lineupMap?.[slot.id];
    const role = roleFor(t.roles?.[slot.id], slot.position, year).id;
    const dy = ROLE_DY[role] ?? 0;
    let x: number, y: number;
    if (slot.position === 'TW') {
      x = 50;
      y = phase === 'gegen' && role === 'tw_mit' ? yLine + (93 - yLine) * 0.55 : 93;
    } else if (phase === 'ball') {
      const push = eff.style === 'attacking' ? -5 : eff.style === 'defensive' ? 3 : eff.style === 'counter' ? 2 : 0;
      const wf = (0.84 + stepOf(eff.widthFocus) * 0.08) * (ROLE_IN[role] ?? 1);
      x = clamp(50 + (slot.x - 50) * wf, 7, 93);
      y = clamp(slot.y + push + dy - (stepOf(eff.defensiveLine) - 2) * 1.5, 11, 85);
    } else {
      const k = hi > lo ? (Math.min(slot.y, hi) - lo) / (hi - lo) : 0.5;
      x = clamp(50 + (slot.x - 50) * (zone ? 0.74 : 0.88), 9, 91);
      y = yPress + k * (yLine - yPress) + (slot.position === 'LIB' ? (role === 'lib_frei' ? 0 : 11) : 0) + dy * 0.3;
    }
    return { slot, x, y, role, p: pid ? players[pid] : undefined };
  });
  return { spots, yLine, yPress };
}

export function TacticBoard({ t, year, formation, players, phase, setRole }: {
  t: Tactics; year: number; formation: Formation; players: Record<string, Player>; phase: BoardPhase;
  setRole: (slotId: string, roleId: string | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 735, h: 1020 });
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight; if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h })); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!sel) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [sel]);

  const eff = effectiveTactics(t, year)!;
  const { spots, yLine, yPress } = layout(formation, t, year, phase, players);
  const { w, h } = size;
  const X = (v: number) => (v / 100) * w, Y = (v: number) => (v / 100) * h;
  const groupOf = (p: Position) => POSITION_GROUPS[p];
  const zone = markingOf(eff, year) === 'zone';
  const selSpot = sel ? spots.find((s) => s.slot.id === sel) : undefined;

  // --- Zeichnung „Gegen den Ball“ ---
  const backRow = spots.filter((s) => groupOf(s.slot.position) === 'DEF' && s.slot.position !== 'LIB');
  const lineY = backRow.length ? Math.max(...backRow.map((s) => s.y)) + 7.6 : yLine + 7.6;
  const bands = (['DEF', 'MID', 'ATT'] as const).map((gk) => {
    const row = spots.filter((s) => groupOf(s.slot.position) === gk && s.slot.position !== 'LIB');
    if (!row.length) return null;
    const xs = row.map((s) => s.x), ys = row.map((s) => s.y);
    return { x: Math.min(...xs) - 8, y: Math.min(...ys) - 5.5, w: Math.max(...xs) - Math.min(...xs) + 16, h: Math.max(...ys) - Math.min(...ys) + 11 };
  }).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
  const marked = spots.filter((s) => (groupOf(s.slot.position) === 'DEF' && s.slot.position !== 'LIB') || s.slot.position === 'DM');

  // --- Zeichnung „Mit Ball“ ---
  const byY = [...spots].filter((s) => s.slot.position !== 'TW').sort((a, b) => b.y - a.y);
  const deep = byY.filter((s) => groupOf(s.slot.position) === 'DEF').sort((a, b) => Math.abs(a.x - 50) - Math.abs(b.x - 50))[0] ?? byY[0];
  const mids = spots.filter((s) => groupOf(s.slot.position) === 'MID').sort((a, b) => Math.abs(a.x - 50) - Math.abs(b.x - 50));
  const tops = spots.filter((s) => groupOf(s.slot.position) === 'ATT').sort((a, b) => a.y - b.y);
  const target = tops[0] ?? byY[byY.length - 1];
  const outfield = spots.filter((s) => s.slot.position !== 'TW');
  const wideL = [...outfield].sort((a, b) => a.x - b.x || a.y - b.y)[0];
  const wideR = [...outfield].sort((a, b) => b.x - a.x || a.y - b.y)[0];
  const widthStep = stepOf(eff.widthFocus), tempoStep = stepOf(eff.tempo);
  /** Flügelspiel einer Seite: Lauf des äußersten Spielers zur Grundlinie, von dort die Hereingabe (hoch = Bogen, flach = Strich). */
  const cross = (s: Spot | undefined, side: -1 | 1) => {
    if (!s || widthStep === 0) return null;
    const fx = X(50 + side * 41), fy = Y(21);
    const x1 = X(50 + side * 6), y1 = Y(eff.crossStyle === 'low' ? 15 : 10.5);
    const high = eff.crossStyle !== 'low';
    const d = high ? `M ${fx} ${fy} Q ${X(50 + side * 30)} ${Y(1)} ${x1} ${y1}` : `M ${fx} ${fy} L ${x1} ${y1}`;
    const op = 0.28 + widthStep * 0.17;
    return (
      <g key={side} style={{ opacity: op }}>
        {s.y > 30 && <path d={`M ${X(s.x + side * 3)} ${Y(s.y) - 36} L ${fx} ${fy + 14}`} className="txb-arrow run" markerEnd="url(#txb-head)" />}
        <path d={d} className="txb-arrow cross" markerEnd="url(#txb-head)" strokeDasharray={eff.crossStyle === 'mixed' ? '9 8' : undefined} />
      </g>
    );
  };

  return (
    <div className={`txb phase-${phase}`} ref={box} onClick={() => setSel(null)}>
      <PitchSVG stretch={(w / h) / (68 / 105)} />
      <svg className="txb-draw" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <defs>
          <marker id="txb-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" className="txb-head" />
          </marker>
        </defs>
        {phase === 'gegen' ? (
          <>
            <rect x={0} y={0} width={w} height={Y(yPress - 5)} className="txb-press" />
            <line x1={0} y1={Y(yPress - 5)} x2={w} y2={Y(yPress - 5)} className="txb-pressline" />
            <text x={16} y={Y(yPress - 5) - 11} className="txb-cap">Pressing ab hier</text>
            {zone && bands.map((b, i) => <rect key={i} x={X(b.x)} y={Y(b.y)} width={X(b.w)} height={Y(b.h)} rx={18} className="txb-band" />)}
            {!zone && marked.map((s) => <circle key={s.slot.id} cx={X(s.x) + 30} cy={Y(s.y) - 36} r={14} className="txb-opp" />)}
            <line x1={X(4)} y1={Y(lineY)} x2={X(96)} y2={Y(lineY)} className={`txb-defline${eff.offsideTrap ? ' trap' : ''}`} />
            {eff.offsideTrap && [X(4), X(96)].map((fx, i) => <path key={i} d={`M ${fx} ${Y(lineY)} v -26 l ${i ? -17 : 17} 7 l ${i ? 17 : -17} 7`} className="txb-flag" />)}
            <text x={w - 18} y={Y(lineY) + 24} textAnchor="end" className="txb-cap">{eff.offsideTrap ? 'Abwehrlinie mit Abseitsfalle' : 'Abwehrlinie'}</text>
          </>
        ) : (
          <>
            {eff.buildup === 'long' ? (
              <path d={`M ${X(deep.x)} ${Y(deep.y) - 36} Q ${X(deep.x < 50 ? 16 : 84)} ${Y((deep.y + target.y) / 2)} ${X(target.x)} ${Y(target.y) + 62}`} className="txb-arrow long" markerEnd="url(#txb-head)" />
            ) : (
              <>
                {mids[0] && <path d={`M ${X(deep.x)} ${Y(deep.y) - 36} L ${X(mids[0].x)} ${Y(mids[0].y) + 62}`} className="txb-arrow short" markerEnd="url(#txb-head)" />}
                {mids[0] && target && <path d={`M ${X(mids[0].x)} ${Y(mids[0].y) - 36} L ${X(target.x)} ${Y(target.y) + 62}`} className="txb-arrow short" markerEnd="url(#txb-head)" />}
                {mids[1] && mids[0] && <path d={`M ${X(mids[0].x)} ${Y(mids[0].y)} L ${X(mids[1].x) + (mids[1].x < mids[0].x ? 38 : -38)} ${Y(mids[1].y)}`} className="txb-arrow short" markerEnd="url(#txb-head)" />}
              </>
            )}
            {cross(wideL, -1)}{cross(wideR, 1)}
            <g className="txb-tempo" transform={`translate(44 ${h - 118})`}>
              {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M -12 ${-i * 17 + 40} l 12 -12 l 12 12`} className={i <= tempoStep ? 'on' : ''} />)}
            </g>
            <text x={20} y={h - 46} className="txb-cap">Tempo</text>
          </>
        )}
      </svg>
      {spots.map((s) => {
        const role = roleFor(s.role, s.slot.position, year);
        const grp = groupOf(s.slot.position);
        return (
          <button key={s.slot.id} type="button" data-slot={s.slot.id} data-pid={s.p?.id}
            className={`txb-mag g-${grp.toLowerCase()}${sel === s.slot.id ? ' sel' : ''}${role.base ? '' : ' special'}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }} title={`${s.p ? s.p.fullName : 'frei'} – ${role.label}: Rolle wählen`}
            onClick={(e) => { e.stopPropagation(); setSel(sel === s.slot.id ? null : s.slot.id); }}>
            <span className="txb-disc">{s.slot.position}</span>
            <span className="txb-name">{s.p ? s.p.lastName : 'frei'}</span>
            <span className="txb-role">{role.label}</span>
          </button>
        );
      })}
      {selSpot && (
        <RolePicker spot={{ x: selSpot.x, y: selSpot.y }} position={selSpot.slot.position} player={selSpot.p} year={year} value={selSpot.role}
          rating={selSpot.p ? cachedSuitability(selSpot.p, selSpot.slot.position) : 60}
          onPick={(id) => setRole(selSpot.slot.id, id)} onClose={() => setSel(null)} />
      )}
    </div>
  );
}

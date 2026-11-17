// =============================================================================
// TAKTIKTAFEL (Taktik-Seite) – Wunsch Pascal: zwei liegende Tafeln, „In Ballbesitz“
// und „Defensive“, je neben ihren Anweisungen. Eigenes Tor links, Angriff nach rechts.
// Alles, was gezeichnet ist, folgt aus einer gewählten Anweisung oder Rolle
// (Zeichnung in tactics/boardLayers.tsx); nichts steht „immer da“.
// Ein Klick auf einen Magneten öffnet die Rollenwahl (engine/tacticRoles.ts).
// Lage in Formations-Koordinaten (x quer 0–100, y 8 = Angriff … 92 = eigenes Tor),
// gezeichnet liegend: links = 100 − y, oben = x. Linien/Pfeile in Pixeln (gemessene Größe).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { Player, Tactics } from '../../types';
import { POSITION_GROUPS } from '../../types';
import type { Formation, FormationSlot } from '../../data/formations';
import { effectiveTactics, markingOf, stepOf } from '../../engine/tacticEra';
import { roleFor } from '../../engine/tacticRoles';
import { cachedSuitability } from '../../engine/match/team';
import PitchSVG from '../lineup/PitchSVG';
import { RolePicker } from './RolePicker';
import { BallLayer, DefLayer, type Geo, type Spot } from './boardLayers';

export type BoardPhase = 'ball' | 'gegen';
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const Y_LINE = [80, 75, 70, 64, 58], Y_PRESS = [58, 50, 42, 33, 24];
/** Rollen, die in Ballbesitz höher/tiefer stehen (Formations-y). */
const ROLE_DY: Record<string, number> = { av_off: -9, av_def: 3, lib_frei: -11, zm_wasser: 3, zm_antr: -3, om_schatten: -5, ms_konter: -2, ms_wand: 2, dm_ab: 2, iv_spiel: -2 };
/** Rollen, die nach innen ziehen (Faktor auf den Abstand zur Mitte). */
const ROLE_IN: Record<string, number> = { fl_inv: 0.72, am_ein: 0.74 };

function layout(formation: Formation, t: Tactics, year: number, phase: BoardPhase, players: Record<string, Player>): { spots: Spot[]; yLine: number; yPress: number } {
  const eff = effectiveTactics(t, year)!;
  const zone = markingOf(eff, year) === 'zone';
  const field = formation.slots.filter((s) => s.position !== 'TW');
  const lo = Math.min(...field.map((s) => s.y)), hi = Math.max(...field.filter((s) => s.position !== 'LIB').map((s) => s.y));
  // Mentalität verschiebt die ganze Ordnung (offensiv höher, defensiv/Konter tiefer).
  const ment = eff.style === 'attacking' ? -4 : eff.style === 'defensive' ? 3 : eff.style === 'counter' ? 2 : 0;
  const yLine = Y_LINE[stepOf(eff.defensiveLine)] + ment * 0.5;
  const yPress = Y_PRESS[stepOf(eff.pressing)];
  const spots = formation.slots.map((slot): Spot => {
    const pid = t.lineupMap?.[slot.id];
    const role = roleFor(t.roles?.[slot.id], slot.position, year).id;
    let x: number, y: number;
    if (slot.position === 'TW') {
      x = 50;
      y = phase === 'gegen' && role === 'tw_mit' ? yLine + (93 - yLine) * 0.55 : 92;
    } else if (phase === 'ball') {
      // Breite: Mitte = enger, Flügel = breiter auseinander; einrückende Rollen nach innen.
      const wf = (0.84 + stepOf(eff.widthFocus) * 0.08) * (ROLE_IN[role] ?? 1);
      x = clamp(50 + (slot.x - 50) * wf, 6, 94);
      y = clamp(slot.y + ment + (ROLE_DY[role] ?? 0), 12, 86);
    } else {
      // Gegen den Ball: Block zwischen Pressinglinie und Abwehrlinie, Raumdeckung kompakter.
      const k = hi > lo ? (Math.min(slot.y, hi) - lo) / (hi - lo) : 0.5;
      x = clamp(50 + (slot.x - 50) * (zone ? 0.74 : 0.9), 8, 92);
      y = yPress + k * (yLine - yPress) + (slot.position === 'LIB' ? (role === 'lib_frei' ? 0 : 9) : 0);
    }
    return { slot, x, y, role, p: pid ? players[pid] : undefined, grp: POSITION_GROUPS[slot.position] };
  });
  return { spots, yLine, yPress };
}

export function TacticBoard({ t, year, formation, players, phase, setRole }: {
  t: Tactics; year: number; formation: Formation; players: Record<string, Player>; phase: BoardPhase;
  setRole: (slotId: string, roleId: string | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 560, h: 330 });
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
  // Liegend: Formations-y → waagrecht (eigenes Tor links), Formations-x → senkrecht.
  const geo: Geo = { w, h, X: (s) => ((100 - s.y) / 100) * w, Y: (s) => (s.x / 100) * h, sx: (y) => ((100 - y) / 100) * w, sy: (x) => (x / 100) * h, r: 17 };
  const selSpot = sel ? spots.find((s) => s.slot.id === sel) : undefined;

  return (
    <div className={`txb txb-land phase-${phase}`} ref={box} onClick={() => setSel(null)}>
      <div className="txb-pitch" style={{ width: h, height: w, left: (w - h) / 2, top: (h - w) / 2 }}>
        <PitchSVG stretch={(h / w) / (68 / 105)} />
      </div>
      <svg className="txb-draw" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <defs>
          <marker id={`txb-head-${phase}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" className="txb-head" />
          </marker>
        </defs>
        {phase === 'ball'
          ? <BallLayer geo={geo} spots={spots} eff={eff} head={`url(#txb-head-${phase})`} />
          : <DefLayer geo={geo} spots={spots} eff={eff} year={year} yLine={yLine} yPress={yPress} head={`url(#txb-head-${phase})`} />}
      </svg>
      {spots.map((s) => {
        const role = roleFor(s.role, s.slot.position, year);
        return (
          <button key={s.slot.id} type="button" data-slot={s.slot.id} data-pid={s.p?.id}
            className={`txb-mag g-${s.grp.toLowerCase()}${sel === s.slot.id ? ' sel' : ''}${role.base ? '' : ' special'}`}
            style={{ left: `${100 - s.y}%`, top: `${s.x}%` }} title={`${s.p ? s.p.fullName : 'frei'} – ${role.label}: Rolle wählen`}
            onClick={(e) => { e.stopPropagation(); setSel(sel === s.slot.id ? null : s.slot.id); }}>
            <span className="txb-disc">{s.slot.position}</span>
            <span className="txb-name">{s.p ? s.p.lastName : 'frei'}</span>
            {!role.base && <span className="txb-role">{role.label}</span>}
          </button>
        );
      })}
      {selSpot && (
        <RolePicker spot={{ x: 100 - selSpot.y, y: selSpot.x }} position={selSpot.slot.position} player={selSpot.p} year={year} value={selSpot.role}
          rating={selSpot.p ? cachedSuitability(selSpot.p, selSpot.slot.position) : 60}
          onPick={(id) => setRole(selSpot.slot.id, id)} onClose={() => setSel(null)} />
      )}
    </div>
  );
}

export type { FormationSlot };

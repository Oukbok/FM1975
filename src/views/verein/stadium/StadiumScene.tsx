// =============================================================================
// STADION-ZEICHNUNG (Schrägansicht): vier Blöcke um den Platz, je Block bis zu
// drei Ränge (Reihenzahl = Tiefe), Sitzart als Farbe, Dach, VIP-Bereich,
// Logenband, Anzeigetafel, Flutlicht. Flächen werden per Normalen-Test
// ausgeblendet; vordere Tribünen sind halbtransparent, solange sie nicht
// ausgewählt sind. Rechenlogik: engine/stadiumBlocks.ts.
// =============================================================================
import type { ReactNode } from 'react';
import { BLOCK_NAME, blockCapacity } from '../../../engine/stadiumBlocks';
import type { BlockId, SeatType, StadiumBlock } from '../../../types';
import { shade } from '../grounds/isoKit';

type V3 = [number, number, number];
const SC = 15;
const W = 30, D = 19, GAP = 1.1;
const proj = ([x, y, z]: V3): [number, number] => [(x - y) * SC * 0.866, (x + y) * SC * 0.5 - z * SC];
const pts = (vs: V3[]) => vs.map((v) => proj(v).map((n) => n.toFixed(1)).join(',')).join(' ');
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const LIGHT: V3 = [0.35, 0.7, 0.62];
const VIEW: V3 = [1, 1, 1];

function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/** Lokale Blockkoordinaten (u entlang der Seite, v vom Platz weg) → Welt. */
function mapper(id: BlockId): { len: number; at: (u: number, v: number, z: number) => V3 } {
  switch (id) {
    case 'opposite': return { len: W, at: (u, v, z) => [u, -GAP - v, z] };
    case 'main': return { len: W, at: (u, v, z) => [u, D + GAP + v, z] };
    case 'north': return { len: D, at: (u, v, z) => [-GAP - v, u, z] };
    case 'south': return { len: D, at: (u, v, z) => [W + GAP + v, u, z] };
  }
}
export const FRONT: Record<BlockId, boolean> = { main: true, south: true, opposite: false, north: false };

/** Fläche mit Normalen-Test (zur Kamera zeigend) und Lichtschattierung. */
function face(vs: V3[], center: V3, color: string, key: string, extra?: { opacity?: number; stroke?: string }): ReactNode {
  let n = cross(sub(vs[1], vs[0]), sub(vs[2], vs[0]));
  const mid: V3 = [0, 1, 2].map((i) => vs.reduce((s, v) => s + v[i], 0) / vs.length) as V3;
  if (dot(n, sub(mid, center)) < 0) n = [-n[0], -n[1], -n[2]];
  if (dot(n, VIEW) <= 0.001) return null;
  const len = Math.hypot(...n) || 1;
  const lit = 0.72 + 0.4 * Math.max(0, dot(n, LIGHT) / len);
  return <polygon key={key} points={pts(vs)} fill={shade(color, lit)} opacity={extra?.opacity} stroke={extra?.stroke} strokeWidth={extra?.stroke ? 0.8 : 0} />;
}
/** Quader (Prisma) aus acht Ecken: unten a0..a3, oben b0..b3. */
function prism(a: V3[], b: V3[], color: string, key: string, top?: string): ReactNode[] {
  const c: V3 = [0, 1, 2].map((i) => [...a, ...b].reduce((s, v) => s + v[i], 0) / 8) as V3;
  const out: ReactNode[] = [face(b, c, top ?? color, `${key}t`)];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; out.push(face([a[i], a[j], b[j], b[i]], c, color, `${key}s${i}`)); }
  return out;
}

export interface SceneColors { primary: string; secondary: string }
function seatColor(seat: SeatType, c: SceneColors): string {
  switch (seat) {
    case 'steh': return '#8d939a';
    case 'bank': return '#9a7550';
    case 'schale': return c.primary;
    case 'komfort': return shade(c.primary, 0.8);
    case 'business': return '#3a3f48';
  }
}

const mastOffOf = (ext: number) => Math.min(ext - 1, 8);
const RAKE = 0.55, DEPTH_PER_ROW = 0.19;

interface TierGeo { v0: number; v1: number; zb: number; zt: number }
/** Geometrie der Ränge: Tiefe aus den Reihen, Rang über Rang mit Umgang/Logenband. */
export function tierGeometry(b: StadiumBlock): TierGeo[] {
  const out: TierGeo[] = [];
  let v = 0, z = 0.35;
  b.tiers.forEach((t, i) => {
    const dep = t.rows * DEPTH_PER_ROW;
    const band = i === 0 ? 0 : i === 1 && b.lounges > 0 ? 1.15 : 0.55;
    const zb = z + band;
    out.push({ v0: v, v1: v + dep, zb, zt: zb + dep * RAKE });
    v += dep + 0.25;
    z = zb + dep * RAKE;
  });
  return out;
}

function BlockShape({ b, colors, year, era, crowd }: { b: StadiumBlock; colors: SceneColors; year: number; era: number; crowd: number }) {
  const { len, at } = mapper(b.id);
  const geo = tierGeometry(b);
  const concrete = era === 0 ? '#8f949b' : era === 1 ? '#a4abb2' : '#bcc3ca';
  const nodes: ReactNode[] = [];
  const order = FRONT[b.id] ? geo.map((_, i) => i) : geo.map((_, i) => geo.length - 1 - i);
  for (const i of order) {
    const g = geo[i], t = b.tiers[i];
    const a: V3[] = [at(0, g.v0, 0), at(len, g.v0, 0), at(len, g.v1, 0), at(0, g.v1, 0)];
    const top: V3[] = [at(0, g.v0, g.zb), at(len, g.v0, g.zb), at(len, g.v1, g.zt), at(0, g.v1, g.zt)];
    nodes.push(...prism(a, top, concrete, `${b.id}${i}`, seatColor(t.seat, colors)));
    // Reihenlinien bzw. Wellenbrecher (Stehplätze)
    const rows = Math.max(2, Math.round(t.rows / (t.seat === 'steh' ? 6 : 4)));
    for (let r = 1; r < rows; r++) {
      const f = r / rows, v = g.v0 + (g.v1 - g.v0) * f, z = g.zb + (g.zt - g.zb) * f;
      const [x1, y1] = proj(at(0.2, v, z)), [x2, y2] = proj(at(len - 0.2, v, z));
      nodes.push(<line key={`${b.id}${i}r${r}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.seat === 'steh' ? '#d7dbe0' : shade(seatColor(t.seat, colors), 0.6)} strokeWidth={t.seat === 'steh' ? 0.9 : 0.6} opacity={0.7} />);
    }
    // VIP-Bereich: Mitte des untersten Rangs mit dunklen Polstersitzen
    if (i === 0 && b.vip) {
      const q: V3[] = [at(len * 0.36, g.v0 + 0.05, g.zb + 0.03), at(len * 0.64, g.v0 + 0.05, g.zb + 0.03), at(len * 0.64, g.v1 - 0.05, g.zt + 0.03), at(len * 0.36, g.v1 - 0.05, g.zt + 0.03)];
      nodes.push(<polygon key={`${b.id}vip`} points={pts(q)} fill="#2a2f37" stroke="#d9b45a" strokeWidth={0.9} />);
    }
    // Zuschauer (Punkte), Dichte nach Auslastung
    const n = Math.round(crowd * t.rows * len * 0.05);
    for (let k = 0; k < n; k++) {
      const h1 = hash(k * 13 + i * 101 + b.id.length * 7), h2 = hash(k * 29 + i * 53 + b.id.charCodeAt(0));
      const v = g.v0 + (g.v1 - g.v0) * h2, z = g.zb + (g.zt - g.zb) * h2;
      const [px, py] = proj(at(0.3 + (len - 0.6) * h1, v, z + 0.12));
      const col = h1 > 0.62 ? colors.primary : h1 > 0.4 ? colors.secondary : h1 > 0.2 ? '#2e3540' : '#d8c9b4';
      nodes.push(<circle key={`${b.id}${i}p${k}`} cx={px} cy={py} r={1.25} fill={col} opacity={0.9} />);
    }
  }
  // Logenband: Glasfenster zwischen Unter- und Oberrang
  // (vordere Tribünen: an der Außenfassade, sonst zur Spielfeldseite)
  if (b.lounges > 0 && (geo.length >= 2 || FRONT[b.id])) {
    const lastG = geo[geo.length - 1];
    const front = FRONT[b.id];
    const zLo = front ? lastG.zt - 1.6 : geo[0].zt + 0.12, zHi = front ? lastG.zt - 0.6 : (geo[1]?.zb ?? geo[0].zt + 1) - 0.12;
    const vF = front ? lastG.v1 + 0.01 : geo[1].v0;
    for (let k = 0; k < b.lounges; k++) {
      const u0 = len * (0.1 + (0.8 * k) / b.lounges) + 0.15, u1 = len * (0.1 + (0.8 * (k + 1)) / b.lounges) - 0.15;
      nodes.push(<polygon key={`${b.id}l${k}`} points={pts([at(u0, vF, zLo), at(u1, vF, zLo), at(u1, vF, zHi), at(u0, vF, zHi)])} fill="#9fd3ea" opacity={0.85} />);
    }
  }
  // Dach
  const last = geo[geo.length - 1];
  const maxV = last.v1, maxZ = last.zt;
  if (b.roof !== 'none') {
    const vStart = b.roof === 'full' ? -0.5 : maxV * 0.5;
    const zr = maxZ + 1.5;
    const roofCol = era === 0 ? '#6b7079' : era === 1 ? '#c9d0d6' : '#e6ebef';
    const a: V3[] = [at(-0.1, vStart, zr), at(len + 0.1, vStart, zr), at(len + 0.1, maxV + 0.2, zr + 0.5), at(-0.1, maxV + 0.2, zr + 0.5)];
    const up = a.map(([x, y, z]) => [x, y, z + 0.28] as V3);
    for (const u of [0.4, len / 2, len - 0.4]) {
      const [x1, y1] = proj(at(u, maxV + 0.1, 0)), [, y2] = proj(at(u, maxV + 0.1, zr + 0.5));
      nodes.push(<line key={`${b.id}c${u}`} x1={x1} y1={y1} x2={x1} y2={y2} stroke="#59616b" strokeWidth={2} />);
    }
    nodes.push(<g key={`${b.id}roof`} opacity={FRONT[b.id] ? 0.9 : 0.62}>{prism(a, up, roofCol, `${b.id}rf`)}</g>);
  }
  // Anzeigetafel (Kurve) bzw. Videowand
  if (b.scoreboard) {
    const big = year >= 1994;
    const u0 = len * (big ? 0.3 : 0.38), u1 = len * (big ? 0.7 : 0.62), z0 = maxZ + (b.roof !== 'none' ? 2.6 : 0.8), z1 = z0 + (big ? 2.2 : 1.5);
    const screen = [at(u0, maxV - 0.1, z0), at(u1, maxV - 0.1, z0), at(u1, maxV - 0.1, z1), at(u0, maxV - 0.1, z1)];
    const [lx, ly] = proj(at(u0 + 0.3, maxV, 0)), [rx, ry] = proj(at(u1 - 0.3, maxV, 0));
    nodes.push(<g key={`${b.id}sb`}>
      <line x1={lx} y1={ly} x2={lx} y2={proj(at(u0 + 0.3, maxV, z0))[1]} stroke="#59616b" strokeWidth={2} />
      <line x1={rx} y1={ry} x2={rx} y2={proj(at(u1 - 0.3, maxV, z0))[1]} stroke="#59616b" strokeWidth={2} />
      <polygon points={pts(screen)} fill={big ? '#16324a' : '#1d2126'} stroke="#59616b" strokeWidth={1.4} />
      {big && <polygon points={pts([at(u0 + 0.4, maxV - 0.12, z0 + 0.3), at(u1 - 0.4, maxV - 0.12, z0 + 0.3), at(u1 - 0.4, maxV - 0.12, z1 - 0.3), at(u0 + 0.4, maxV - 0.12, z1 - 0.3)])} fill="#2f7fa8" opacity={0.75} />}
    </g>);
  }
  return <>{nodes}</>;
}

export interface StadiumSceneProps {
  blocks: StadiumBlock[];
  colors: SceneColors;
  year: number;
  month: number;
  /** Auslastung 0–1 (Zuschauerpunkte). */
  crowd: number;
  selected: BlockId | null;
  hover: BlockId | null;
  building?: BlockId | null;
  onSelect: (id: BlockId | null) => void;
  onHover: (id: BlockId | null) => void;
}

export function StadiumScene({ blocks, colors, year, month, crowd, selected, hover, building, onSelect, onHover }: StadiumSceneProps) {
  const era = year < 1990 ? 0 : year < 2010 ? 1 : 2;
  const winter = month === 12 || month <= 2;
  const grass = winter && year < 1995 ? '#9fb49a' : '#4f9a45';
  const by = Object.fromEntries(blocks.map((b) => [b.id, b])) as Record<BlockId, StadiumBlock>;
  const anyFullRoof = blocks.filter((b) => b.roof === 'full').length >= 3;
  // Ausschnitt: mindestens Platz für einen mittleren Ausbau, damit Wachstum sichtbar bleibt.
  let ext = 9, zMax = 6;
  for (const b of blocks) { const geo = tierGeometry(b); const l = geo[geo.length - 1]; ext = Math.max(ext, GAP + l.v1 + 1); zMax = Math.max(zMax, l.zt + (b.roof !== 'none' ? 2.3 : 0) + (b.scoreboard ? 3.5 : 0)); }
  const ground: V3[] = [[-ext - 2, -ext - 2, 0], [W + ext + 2, -ext - 2, 0], [W + ext + 2, D + ext + 2, 0], [-ext - 2, D + ext + 2, 0]];
  const x0 = proj([-ext, D + ext, 0])[0] - 20, x1 = proj([W + ext, -ext, 0])[0] + 20;
  const y0 = Math.min(proj([-ext, -ext, zMax])[1], proj([-mastOffOf(ext), -mastOffOf(ext), 11])[1]) - 24, y1 = proj([W + ext, D + ext, 0])[1] + 20;
  const viewBox = `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  const mastOff = mastOffOf(ext);
  const order: BlockId[] = ['opposite', 'north', 'south', 'main'];
  const lines = '#eef3ec';
  const P2 = (x: number, y: number) => proj([x, y, 0.02]);
  const circle = Array.from({ length: 25 }, (_, a) => P2(W / 2 + Math.cos((a / 24) * Math.PI * 2) * 2.7, D / 2 + Math.sin((a / 24) * Math.PI * 2) * 2.7));
  const pl = (ps: [number, number][]) => ps.map((p) => p.join(',')).join(' ');
  const mast = (x: number, y: number) => {
    const [bx, b1] = proj([x, y, 0]), [, t1] = proj([x, y, 15]);
    return <g key={`m${x}${y}`}><line x1={bx} y1={b1} x2={bx} y2={t1} stroke="#6f7782" strokeWidth={3} /><rect x={bx - 16} y={t1 - 14} width={32} height={15} fill="#2d333b" stroke="#6f7782" /><rect x={bx - 13} y={t1 - 11} width={26} height={9} fill="#fff6c8" /></g>;
  };
  const label = (id: BlockId) => {
    const b = by[id];
    const { len, at } = mapper(id);
    const geo = tierGeometry(b);
    const [x, y] = proj(at(len / 2, geo[geo.length - 1].v1 * 0.5, geo[geo.length - 1].zt + 2.4));
    const text = `${BLOCK_NAME[id]} · ${blockCapacity(b).toLocaleString('de-DE')}`;
    return (
      <g key={`lb${id}`} pointerEvents="none">
        <rect x={x - text.length * 3.9 - 10} y={y - 28} width={text.length * 7.8 + 20} height={24} rx={6} fill="rgba(10,16,24,0.9)" stroke="#00D9FF" />
        <text x={x} y={y - 11} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>{text}</text>
      </g>
    );
  };

  return (
    <svg className="gr-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
      onClick={(e) => { if ((e.target as Element).tagName === 'svg') onSelect(null); }}>
      <polygon points={pts(ground)} fill={winter ? '#c9d3cf' : '#58864a'} opacity={0.55} onClick={() => onSelect(null)} />
      <polygon points={pts([[-GAP, -GAP, 0.01], [W + GAP, -GAP, 0.01], [W + GAP, D + GAP, 0.01], [-GAP, D + GAP, 0.01]])} fill={shade(grass, 0.82)} />
      <polygon points={pts([[0, 0, 0.015], [W, 0, 0.015], [W, D, 0.015], [0, D, 0.015]])} fill={grass} />
      {Array.from({ length: 5 }, (_, i) => <polygon key={`st${i}`} points={pts([[i * 6, 0, 0.018], [i * 6 + 3, 0, 0.018], [i * 6 + 3, D, 0.018], [i * 6, D, 0.018]])} fill={shade(grass, 1.08)} />)}
      <g fill="none" stroke={lines} strokeWidth={1.2} opacity={0.85}>
        <polygon points={pl([P2(0.5, 0.5), P2(W - 0.5, 0.5), P2(W - 0.5, D - 0.5), P2(0.5, D - 0.5)])} />
        <polyline points={pl([P2(W / 2, 0.5), P2(W / 2, D - 0.5)])} />
        <polyline points={pl(circle)} />
        <polyline points={pl([P2(0.5, D / 2 - 4.5), P2(4.4, D / 2 - 4.5), P2(4.4, D / 2 + 4.5), P2(0.5, D / 2 + 4.5)])} />
        <polyline points={pl([P2(W - 0.5, D / 2 - 4.5), P2(W - 4.4, D / 2 - 4.5), P2(W - 4.4, D / 2 + 4.5), P2(W - 0.5, D / 2 + 4.5)])} />
      </g>
      {!anyFullRoof && <>{mast(-mastOff, -mastOff)}{mast(W + mastOff, -mastOff)}</>}
      {order.map((id) => {
        const b = by[id];
        if (!b) return null;
        const on = selected === id || hover === id;
        const faded = FRONT[id] && !on && selected !== null ? 0.28 : FRONT[id] && !on ? 0.55 : 1;
        return (
          <g key={id} className={`gr-obj ${selected === id ? 'sel' : ''}`} opacity={faded}
            onClick={(e) => { e.stopPropagation(); onSelect(id); }} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)}>
            <BlockShape b={b} colors={colors} year={year} era={era} crowd={building === id ? crowd * 0.4 : crowd} />
            {building === id && (() => {
              const { len, at } = mapper(id);
              const [x, y0] = proj(at(len * 0.8, 3, 0)), [, y1] = proj(at(len * 0.8, 3, 14));
              return <g stroke="#e0a23a" strokeWidth={3} fill="none"><line x1={x} y1={y0} x2={x} y2={y1} /><line x1={x - 50} y1={y1 + 8} x2={x + 90} y2={y1 - 6} /></g>;
            })()}
          </g>
        );
      })}
      {!anyFullRoof && <>{mast(-mastOff, D + mastOff)}{mast(W + mastOff, D + mastOff)}</>}
      {(hover ?? selected) && by[(hover ?? selected)!] && label((hover ?? selected)!)}
    </svg>
  );
}

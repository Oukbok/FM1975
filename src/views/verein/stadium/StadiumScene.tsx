// =============================================================================
// STADION-ZEICHNUNG (leeres Stadion, erhöhte Schrägansicht): Vorplatz mit
// Bäumen, Rasen mit Mähstreifen und vollständigen Linien, Tore mit Netz,
// Werbebanden, Trainerbänke, Eckfahnen, weiche Schatten, vier Blöcke
// (StadiumBlockShape) und Flutlichtmasten je Epoche. Die Kamera schaut von
// erhöht hinter der Haupttribüne, deshalb bleibt das Feld frei; vordere
// Dächer sind durchscheinend. Rechenlogik: engine/stadiumBlocks.ts.
// =============================================================================
import type { ReactNode } from 'react';
import { BLOCK_NAME, blockCapacity } from '../../../engine/stadiumBlocks';
import type { BlockId, StadiumBlock } from '../../../types';
import { shade } from '../grounds/isoKit';
import { D, GAP, V3, W, depth, face, hash, hull, mapper, proj, pts, roofGeo, seg, tierGeometry } from './geo';
import { SceneColors, StadiumBlockShape, blockShadowPoints } from './StadiumBlockShape';

export { tierGeometry } from './geo';
export type { SceneColors } from './StadiumBlockShape';

const UP: V3 = [0, 0, 1];
const MAST_H = 17;
const mastOffOf = (ext: number) => ext / 1.25;
const pl = (ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const P0 = (x: number, y: number, z = 0.02) => proj([x, y, z]);

function Pitch({ grass, era }: { grass: string; era: number }) {
  const out: ReactNode[] = [];
  out.push(<polygon key="sur" points={pts([[-GAP, -GAP, 0.01], [W + GAP, -GAP, 0.01], [W + GAP, D + GAP, 0.01], [-GAP, D + GAP, 0.01]])} fill={shade(grass, 0.86)} />);
  out.push(<polygon key="pf" points={pts([[0, 0, 0.015], [W, 0, 0.015], [W, D, 0.015], [0, D, 0.015]])} fill={grass} />);
  const n = 14;
  for (let i = 0; i < n; i += 2) out.push(<polygon key={`ms${i}`} points={pts([[(W / n) * i, 0, 0.016], [(W / n) * (i + 1), 0, 0.016], [(W / n) * (i + 1), D, 0.016], [(W / n) * i, D, 0.016]])} fill={shade(grass, 1.09)} />);
  const L: ReactNode[] = [];
  const m = 0.35, cy = D / 2;
  const line = (k: string, ps: [number, number][], closed = false) => L.push(closed ? <polygon key={k} points={pl(ps)} /> : <polyline key={k} points={pl(ps)} />);
  const arc = (cx: number, cyy: number, r: number, a0: number, a1: number, steps = 24) =>
    Array.from({ length: steps + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / steps; return P0(cx + Math.cos(a) * r, cyy + Math.sin(a) * r); });
  line('out', [P0(m, m), P0(W - m, m), P0(W - m, D - m), P0(m, D - m)], true);
  line('half', [P0(W / 2, m), P0(W / 2, D - m)]);
  line('cc', arc(W / 2, cy, 2.6, 0, Math.PI * 2, 36));
  for (const s of [0, 1]) {
    const x0 = s ? W - m : m, dir = s ? -1 : 1;
    line(`pa${s}`, [P0(x0, cy - 5.75), P0(x0 + dir * 4.7, cy - 5.75), P0(x0 + dir * 4.7, cy + 5.75), P0(x0, cy + 5.75)]);
    line(`ga${s}`, [P0(x0, cy - 2.6), P0(x0 + dir * 1.57, cy - 2.6), P0(x0 + dir * 1.57, cy + 2.6), P0(x0, cy + 2.6)]);
    const sx = x0 + dir * 3.14, half = Math.acos(1.56 / 2.6);
    line(`arc${s}`, s ? arc(sx, cy, 2.6, Math.PI - half, Math.PI + half, 12) : arc(sx, cy, 2.6, -half, half, 12));
  }
  for (const [cx, cyy, a0] of [[m, m, 0], [W - m, m, Math.PI / 2], [W - m, D - m, Math.PI], [m, D - m, Math.PI * 1.5]] as [number, number, number][])
    line(`ca${cx}${cyy}`, arc(cx, cyy, 0.32, a0, a0 + Math.PI / 2, 6));
  out.push(<g key="lines" fill="none" stroke="#f1f5ee" strokeWidth={1.3} opacity={0.9} strokeLinejoin="round">{L}</g>);
  for (const [x, y] of [[W / 2, cy], [m + 3.14, cy], [W - m - 3.14, cy]]) { const [px, py] = P0(x, y); out.push(<ellipse key={`sp${x}`} cx={px} cy={py} rx={1.8} ry={1.3} fill="#f1f5ee" />); }
  // Trainerbänke an der Haupttribüne
  for (const [x0, x1] of [[W / 2 - 4.4, W / 2 - 1.8], [W / 2 + 1.8, W / 2 + 4.4]]) {
    const y0 = D + 0.25, y1 = D + 0.85, h = 0.5;
    const c = era === 0 ? '#7f868e' : '#9fd0e3';
    const op = era === 0 ? 1 : 0.8;
    out.push(<g key={`db${x0}`} opacity={op}>
      {face(`dbb${x0}`, [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], [0, 1, 0], c)}
      {face(`dbs${x0}`, [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]], [1, 0, 0], c)}
      {face(`dbt${x0}`, [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], UP, shade(c, 0.9))}
    </g>);
  }
  return <>{out}</>;
}

function Goal({ x, dir }: { x: number; dir: number }) {
  const y0 = D / 2 - 1.05, y1 = D / 2 + 1.05, h = 0.7, bx = x - dir * 0.6;
  return (
    <g>
      <polygon points={pts([[bx, y0, 0], [bx, y1, 0], [x, y1, h], [x, y0, h]])} fill="#ffffff" opacity={0.28} />
      <polygon points={pts([[bx, y0, 0], [x, y0, 0], [x, y0, h]])} fill="#ffffff" opacity={0.2} />
      <polygon points={pts([[bx, y1, 0], [x, y1, 0], [x, y1, h]])} fill="#ffffff" opacity={0.2} />
      <polyline points={pts([[x, y0, 0], [x, y0, h], [x, y1, h], [x, y1, 0]])} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

function Boards({ era, colors }: { era: number; colors: SceneColors }) {
  const out: ReactNode[] = [];
  const o = 0.6, h = 0.3;
  const pal = era === 0 ? ['#f3f1ea', '#e2c84a', '#c7412f', '#2f5d9a', '#f3f1ea', '#3d7a45'] : era === 1 ? ['#f3f3f3', '#1f4f8f', '#d63a2f', '#f2c230', '#2b2f36', colors.primary] : ['#1b2029', '#1b2029', colors.primary, '#1b2029'];
  const run = (k: string, a: [number, number], b: [number, number], nOut: V3) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(len / 2.4));
    for (let i = 0; i < n; i++) {
      const f0 = i / n, f1 = (i + 1) / n - 0.008;
      const p = (f: number, z: number): V3 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, z];
      const col = pal[Math.floor(hash(i * 7 + k.length * 13) * pal.length)];
      const f = face(`${k}${i}`, [p(f0, 0), p(f1, 0), p(f1, h), p(f0, h)], nOut, col, { back: '#3b4048' });
      out.push(f);
      if (era === 2 && col === '#1b2029') out.push(seg(`${k}${i}l`, p(f0 + 0.02, h * 0.5), p(f1 - 0.02, h * 0.5), shade(colors.primary, 1.1), 1.4, { opacity: 0.8 }));
    }
  };
  run('bo', [-1.2, -o], [W + 1.2, -o], [0, 1, 0]);
  run('bn', [-o, -0.9], [-o, D + 0.9], [1, 0, 0]);
  run('bs', [W + o, -0.9], [W + o, D + 0.9], [-1, 0, 0]);
  run('bm', [-1.2, D + o], [W / 2 - 4.8, D + o], [0, -1, 0]);
  run('bm2', [W / 2 + 4.8, D + o], [W + 1.2, D + o], [0, -1, 0]);
  return <>{out}</>;
}

function Mast({ x, y, era }: { x: number; y: number; era: number }) {
  const [bx, by] = proj([x, y, 0]), [tx, ty] = proj([x, y, MAST_H]);
  const spread = 7, topW = 2.2;
  const legs: ReactNode[] = [];
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const f0 = i / steps, f1 = (i + 1) / steps;
    const w0 = spread + (topW - spread) * f0, w1 = spread + (topW - spread) * f1;
    const y0 = by + (ty - by) * f0, y1 = by + (ty - by) * f1;
    legs.push(<line key={`z${i}`} x1={bx - w0} y1={y0} x2={bx + w1} y2={y1} />);
    legs.push(<line key={`h${i}`} x1={bx - w1} y1={y1} x2={bx + w1} y2={y1} />);
  }
  const lw = era === 0 ? 4 : 5, lh = era === 0 ? 3 : 3;
  return (
    <g pointerEvents="none">
      <ellipse cx={bx + 18} cy={by + 4} rx={22} ry={4} fill="#000" opacity={0.18} />
      <g stroke="#6c747e" strokeWidth={0.9}>{legs}</g>
      <line x1={bx - spread} y1={by} x2={tx - topW} y2={ty} stroke="#5c646e" strokeWidth={2} />
      <line x1={bx + spread} y1={by} x2={tx + topW} y2={ty} stroke="#5c646e" strokeWidth={2} />
      <circle cx={tx} cy={ty - 12} r={30} fill="url(#flGlow)" />
      <rect x={tx - lw * 4.4} y={ty - 22} width={lw * 8.8} height={lh * 6.4} rx={1.5} fill="#2a3038" stroke="#6c747e" strokeWidth={1} />
      {Array.from({ length: lw * lh }, (_, i) => (
        <circle key={i} cx={tx - lw * 4.4 + 4.4 + (i % lw) * 8.8} cy={ty - 22 + 3.2 + Math.floor(i / lw) * 6.4} r={2.5} fill="#fff4c6" />
      ))}
    </g>
  );
}

function Tree({ x, y, winter, k }: { x: number; y: number; winter: boolean; k: number }) {
  const [px, py] = proj([x, y, 0]);
  const s = 0.8 + hash(k * 3.1) * 0.5;
  const c = winter ? '#8c9a8f' : ['#3f7a3a', '#4b8a40', '#36703a'][k % 3];
  return (
    <g pointerEvents="none">
      <ellipse cx={px + 9 * s} cy={py + 1} rx={13 * s} ry={4.5 * s} fill="#000" opacity={0.18} />
      <rect x={px - 1.6} y={py - 10 * s} width={3.2} height={10 * s} fill="#5b4330" />
      <circle cx={px} cy={py - 18 * s} r={11 * s} fill={c} />
      <circle cx={px - 3.5 * s} cy={py - 21 * s} r={6 * s} fill={shade(c, 1.18)} opacity={0.85} />
    </g>
  );
}

export interface StadiumSceneProps {
  blocks: StadiumBlock[];
  colors: SceneColors;
  year: number;
  month: number;
  selected: BlockId | null;
  hover: BlockId | null;
  building?: BlockId | null;
  /** Weitere Blöcke, die zur Planung gehören (ganze Seite). */
  group?: BlockId[];
  onSelect: (id: BlockId | null) => void;
  onHover: (id: BlockId | null) => void;
}

export function StadiumScene({ blocks, colors, year, month, selected, hover, building, group, onSelect, onHover }: StadiumSceneProps) {
  const era = year < 1990 ? 0 : year < 2010 ? 1 : 2;
  const winter = month === 12 || month <= 2;
  const grass = winter && year < 1995 ? '#8fa88a' : era === 0 ? '#4f9545' : '#4a9a43';
  const by = Object.fromEntries(blocks.map((b) => [b.id, b])) as Record<BlockId, StadiumBlock>;
  const anyFullRoof = blocks.filter((b) => b.roof === 'full').length >= blocks.length * 0.6;
  const showMasts = !(anyFullRoof && era >= 1);
  let ext = 9;
  for (const b of blocks) {
    const geo = tierGeometry(b); const l = geo[geo.length - 1];
    ext = Math.max(ext, GAP + l.v1 + 1);
  }
  const mo = mastOffOf(ext);
  const masts: [number, number][] = [[-mo, -mo], [W + mo, -mo], [W + mo, D + mo], [-mo, D + mo]];
  // Ausschnitt aus allen Eckpunkten
  const bx: [number, number][] = [];
  for (const b of blocks) {
    const { len, at } = mapper(b);
    const geo = tierGeometry(b), l = geo[geo.length - 1], rg = roofGeo(b);
    const zt = Math.max(l.zt + 0.5, rg ? rg.zF + (era >= 1 ? 2.8 : 0.2) : 0, b.scoreboard ? (rg ? rg.zB : l.zt) + 3.2 : 0);
    for (const u of [0, len]) for (const v of [0, l.v1 + 0.3]) for (const z of [0, zt]) bx.push(proj(at(u, v, z)));
  }
  if (showMasts) for (const [x, y] of masts) bx.push(proj([x, y, MAST_H + 1.6]));
  const x0 = Math.min(...bx.map((p) => p[0])) - 18, x1 = Math.max(...bx.map((p) => p[0])) + 18;
  const y0 = Math.min(...bx.map((p) => p[1])) - 14, y1 = Math.max(...bx.map((p) => p[1])) + 14;
  const [cx, cy] = proj([W / 2, D / 2, 0]);
  const R = ext + 1.6;
  const plaza: V3[] = [[-R, -R, 0], [W + R, -R, 0], [W + R, D + R, 0], [-R, D + R, 0]];
  const trees: { x: number; y: number; k: number }[] = [];
  const T = R + 1.6;
  let k = 0;
  for (let t = -T; t <= W + T; t += 3.1) { trees.push({ x: t, y: -T, k: k++ }); trees.push({ x: t, y: D + T, k: k++ }); }
  for (let t = -T + 3.1; t < D + T; t += 3.1) { trees.push({ x: -T, y: t, k: k++ }); trees.push({ x: W + T, y: t, k: k++ }); }
  const treeNodes = trees.filter((t) => hash(t.k * 1.7) > 0.25).map((t) => ({ d: depth([t.x, t.y, 0]), n: <Tree key={`t${t.k}`} x={t.x + (hash(t.k) - 0.5)} y={t.y + (hash(t.k + 9) - 0.5)} winter={winter} k={t.k} /> }));

  // Blöcke und Masten nach Kameratiefe
  const items: { d: number; n: ReactNode }[] = [];
  for (const b of blocks) {
    const id = b.id;
    const { len, at } = mapper(b);
    const geo = tierGeometry(b);
    const inSel = selected === id || !!group?.includes(id);
    const on = inSel || hover === id;
    items.push({ d: depth(at(len / 2, geo[geo.length - 1].v1 / 2, 0)), n: (
      <g key={id} className={`gr-obj ${inSel ? 'sel' : ''}`} opacity={selected && !on ? 0.82 : 1}
        onClick={(e) => { e.stopPropagation(); onSelect(id); }} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)}>
        <StadiumBlockShape b={b} colors={colors} era={era} year={year} />
        {building === id && (() => {
          const [x, yb] = proj(at(len * 0.8, 3, 0)), [, yt] = proj(at(len * 0.8, 3, 15));
          return <g stroke="#e0a23a" strokeWidth={3} fill="none" strokeLinecap="round"><line x1={x} y1={yb} x2={x} y2={yt} /><line x1={x - 50} y1={yt + 8} x2={x + 95} y2={yt - 6} /><line x1={x + 80} y1={yt - 5} x2={x + 80} y2={yt + 50} strokeWidth={1} stroke="#cfd5db" /></g>;
        })()}
      </g>
    ) });
  }
  if (showMasts) masts.forEach(([x, y], i) => items.push({ d: depth([x, y, 0]), n: <Mast key={`m${i}`} x={x} y={y} era={era} /> }));
  items.sort((a, b) => a.d - b.d);
  const dMid = depth([W / 2, D / 2, 0]);

  const label = (id: BlockId) => {
    const b = by[id];
    const { len, at } = mapper(b);
    const geo = tierGeometry(b), l = geo[geo.length - 1];
    const rg = roofGeo(b);
    const [x, y] = proj(at(len / 2, l.v1 * 0.5, (rg ? rg.zF : l.zt) + 1.6));
    const text = `${BLOCK_NAME[id]} · ${blockCapacity(b).toLocaleString('de-DE')}`;
    return (
      <g key={`lb${id}`} pointerEvents="none">
        <rect x={x - text.length * 3.9 - 10} y={y - 28} width={text.length * 7.8 + 20} height={24} rx={6} fill="rgba(10,16,24,0.92)" stroke="#00D9FF" />
        <text x={x} y={y - 11} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>{text}</text>
      </g>
    );
  };

  return (
    <svg className="gr-svg" viewBox={`${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}`} preserveAspectRatio="xMidYMid meet"
      onClick={(e) => { if ((e.target as Element).tagName === 'svg') onSelect(null); }}>
      <defs>
        <radialGradient id="stGround" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={winter ? '#c3cdc8' : '#5f8a4e'} stopOpacity={0.75} />
          <stop offset="0.7" stopColor={winter ? '#b2bdb8' : '#4e7742'} stopOpacity={0.45} />
          <stop offset="1" stopColor={winter ? '#b2bdb8' : '#4e7742'} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="flGlow"><stop offset="0" stopColor="#fff6cf" stopOpacity={0.45} /><stop offset="1" stopColor="#fff6cf" stopOpacity={0} /></radialGradient>
        <filter id="stBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <ellipse cx={cx} cy={cy} rx={(x1 - x0) * 0.62} ry={(y1 - y0) * 0.62} fill="url(#stGround)" onClick={() => onSelect(null)} />
      <polygon points={pts(plaza)} fill={winter ? '#c9cbc8' : era === 0 ? '#a29d92' : '#aeaaa2'} stroke={shade(winter ? '#c9cbc8' : '#aeaaa2', 0.85)} strokeWidth={1.5} />
      {Array.from({ length: 7 }, (_, i) => {
        const f = (i + 1) / 8;
        return <g key={`pv${i}`} stroke="#000" strokeOpacity={0.05} strokeWidth={1}>
          <polyline points={pl([proj([-R + (W + 2 * R) * f, -R, 0]), proj([-R + (W + 2 * R) * f, D + R, 0])])} />
          <polyline points={pl([proj([-R, -R + (D + 2 * R) * f, 0]), proj([W + R, -R + (D + 2 * R) * f, 0])])} />
        </g>;
      })}
      {treeNodes.filter((t) => t.d < dMid).sort((a, b) => a.d - b.d).map((t) => t.n)}
      <Pitch grass={grass} era={era} />
      <g filter="url(#stBlur)" opacity={0.3}>
        {blocks.map((b) => <polygon key={`sh${b.id}`} points={pl(hull(blockShadowPoints(b)))} fill="#000" />)}
      </g>
      <Goal x={0} dir={1} />
      <Goal x={W} dir={-1} />
      <Boards era={era} colors={colors} />
      {[[0, 0], [W, 0], [W, D], [0, D]].map(([x, y]) => (
        <g key={`cf${x}${y}`}>{seg(`cfp${x}${y}`, [x, y, 0], [x, y, 0.55], '#f2f2f2', 1.2)}<polygon points={pts([[x, y, 0.55], [x, y, 0.4], [x + (x ? -0.35 : 0.35), y, 0.48]])} fill={era === 0 ? '#e8c547' : colors.primary} /></g>
      ))}
      {items.map((it) => it.n)}
      {treeNodes.filter((t) => t.d >= dMid).sort((a, b) => a.d - b.d).map((t) => t.n)}
      {(hover ?? selected) && by[(hover ?? selected)!] && label((hover ?? selected)!)}
    </svg>
  );
}

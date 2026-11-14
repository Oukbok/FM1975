// =============================================================================
// STADION-UMFELD (Zeichnung, Wunsch Pascal: detailreiches Modell): Park mit
// Rasenflächen, Wegen, Bäumen und Laternen zwischen Stadion und Vorplatzrand
// (schrumpft, wenn das Stadion wächst), Fahnen am Haupteingang, Straße mit
// Häuserzeile dahinter, Trainingsplatz, Zuschauer auf dem Vorplatz. Reine Optik
// in der Stadionkamera (geo.tsx); anklickbare Gebäude bleiben in StadiumSurround.
// =============================================================================
import type { ReactNode } from 'react';
import { shade } from '../grounds/isoKit';
import { D, V3, W, depth, face, hash, proj, pts } from './geo';
import { RING, VENUE_SPOTS } from './StadiumSurround';

const pl = (ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const rect = (x0: number, y0: number, x1: number, y1: number, z = 0.012): V3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];

/** Baum: Schlagschatten, Stamm, Krone aus drei Lagen; jeder fünfte ein Nadelbaum; im Winter kahl. */
export function Tree({ x, y, winter, k, s0 = 1 }: { x: number; y: number; winter: boolean; k: number; s0?: number }) {
  const [px, py] = proj([x, y, 0]);
  const s = (0.8 + hash(k * 3.1) * 0.5) * s0;
  const conifer = hash(k * 5.3) < 0.2;
  const c = winter ? (conifer ? '#5f7a66' : '#9aa39b') : ['#3f7a3a', '#4b8a40', '#36703a', '#5a9146'][k % 4];
  return (
    <g pointerEvents="none">
      <ellipse cx={px + 10 * s} cy={py + 1.5} rx={13 * s} ry={4.5 * s} fill="#000" opacity={0.2} />
      <rect x={px - 1.5} y={py - 10 * s} width={3} height={10 * s} fill="#5b4330" />
      {conifer ? <>
        <polygon points={`${px - 9 * s},${py - 7 * s} ${px + 9 * s},${py - 7 * s} ${px},${py - 34 * s}`} fill={shade(c, 0.85)} />
        <polygon points={`${px - 6.5 * s},${py - 15 * s} ${px + 3 * s},${py - 15 * s} ${px},${py - 34 * s}`} fill={shade(c, 1.15)} opacity={0.8} />
      </> : winter ? <>
        <g stroke="#6b5646" strokeWidth={1.1} fill="none">
          <path d={`M${px},${py - 10 * s} L${px - 7 * s},${py - 22 * s} M${px},${py - 10 * s} L${px + 6 * s},${py - 24 * s} M${px},${py - 10 * s} L${px},${py - 27 * s} M${px - 3.5 * s},${py - 16 * s} L${px - 9 * s},${py - 17 * s} M${px + 3 * s},${py - 17 * s} L${px + 9 * s},${py - 18 * s}`} />
        </g>
        <circle cx={px} cy={py - 20 * s} r={10 * s} fill="#e8ecea" opacity={0.28} />
      </> : <>
        <circle cx={px + 1.5 * s} cy={py - 16 * s} r={11.5 * s} fill={shade(c, 0.78)} />
        <circle cx={px - 1 * s} cy={py - 19 * s} r={10 * s} fill={c} />
        <circle cx={px - 4 * s} cy={py - 22.5 * s} r={5.5 * s} fill={shade(c, 1.22)} opacity={0.85} />
      </>}
    </g>
  );
}

function Lamp({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  const [bx, by] = proj([x, y, 0]), [tx, ty] = proj([x, y, 2.6]);
  return (
    <g pointerEvents="none">
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#59616b" strokeWidth={1.3} />
      {lit && <circle cx={tx} cy={ty} r={7} fill="#fff3c4" opacity={0.25} />}
      <circle cx={tx} cy={ty} r={2.1} fill={lit ? '#fff6d2' : '#d9dde1'} stroke="#59616b" strokeWidth={0.6} />
    </g>
  );
}

function Flag({ x, y, color, k }: { x: number; y: number; color: string; k: number }) {
  const [bx, by] = proj([x, y, 0]), [tx, ty] = proj([x, y, 5.2]);
  const w = 13, h = 8, sway = (hash(k * 2.3) - 0.5) * 3;
  return (
    <g pointerEvents="none">
      <ellipse cx={bx + 5} cy={by + 1} rx={6} ry={1.6} fill="#000" opacity={0.2} />
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#e4e7ea" strokeWidth={1.2} />
      <path d={`M${tx},${ty} q${w * 0.5},${-2 + sway} ${w},${sway * 0.5} l0,${h} q${-w * 0.5},${-1.5 - sway} ${-w},0 z`} fill={color} stroke={shade(color, 0.75)} strokeWidth={0.5} />
    </g>
  );
}

/** Wohnhaus mit Satteldach (Häuserzeile hinter der Straße). */
function house(k: string, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string): ReactNode[] {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, rh = 0.9;
  return [
    face(`${k}n`, [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], [0, 1, 0], wall),
    face(`${k}e`, [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]], [1, 0, 0], wall),
    face(`${k}g`, [[x1, y0, h], [x1, y1, h], [x1, y, h + rh]], [1, 0, 0], shade(wall, 0.95)),
    face(`${k}a`, [[x0, y1, h], [x1, y1, h], [x1, y, h + rh], [x0, y, h + rh]], [0, 1, 1], roof),
    face(`${k}b`, [[x0, y0, h], [x1, y0, h], [x1, y, h + rh], [x0, y, h + rh]], [0, -1, 1], roof),
    <polygon key={`${k}w`} points={pts([[x0 + 0.4, y1 + 0.01, h * 0.45], [x1 - 0.4, y1 + 0.01, h * 0.45], [x1 - 0.4, y1 + 0.01, h * 0.75], [x0 + 0.4, y1 + 0.01, h * 0.75]])} fill="#39424c" opacity={0.55} />,
  ];
}

export interface SceneryIn { R: number; ext: number; winter: boolean; era: number; primary: string; secondary: string; crowd: number }
/**
 * Umfeld: `under` liegt flach unter allem (Wege, Rasen, Straßen), `items` sind stehende
 * Dinge mit Kameratiefe (Bäume, Laternen, Fahnen, Häuser) für die gemeinsame Sortierung.
 */
export function scenery({ R, ext, winter, era, primary, secondary, crowd }: SceneryIn): { under: ReactNode[]; items: { d: number; n: ReactNode }[] } {
  const under: ReactNode[] = [];
  const items: { d: number; n: ReactNode }[] = [];
  const grass = winter ? '#c2ccc5' : era === 0 ? '#6c965a' : '#70a05f';
  const path = winter ? '#d7d9d6' : era === 0 ? '#b4b0a7' : '#c2c1bc';
  const stand = (d: number, n: ReactNode) => items.push({ d, n });

  // --- Straße hinter dem Stadion und rechts daneben, Häuserzeile, Trainingsplatz
  const sy = -R - 7.2, sx = W + R + 7.2, LR = RING + 70;
  const road = winter ? '#8f959b' : '#5f646b';
  under.push(<polygon key="rd1" points={pts(rect(-LR, sy - 1.7, sx + 1.7, sy + 1.7, 0.004))} fill={road} />);
  under.push(<polygon key="rd2" points={pts(rect(sx - 1.7, sy - 1.7, sx + 1.7, D + LR, 0.004))} fill={road} />);
  under.push(<polyline key="rdl1" points={pl([proj([-LR, sy, 0.006]), proj([sx, sy, 0.006])])} stroke="#eceadc" strokeWidth={1.1} strokeDasharray="9 9" opacity={0.75} fill="none" />);
  under.push(<polyline key="rdl2" points={pl([proj([sx, sy, 0.006]), proj([sx, D + LR, 0.006])])} stroke="#eceadc" strokeWidth={1.1} strokeDasharray="9 9" opacity={0.75} fill="none" />);
  for (const [k, a, b] of [['sw1', [-LR, sy + 2.3], [sx - 2.3, sy + 2.3]], ['sw2', [sx - 2.3, sy + 2.3], [sx - 2.3, D + LR]]] as [string, [number, number], [number, number]][])
    under.push(<polyline key={k} points={pl([proj([a[0], a[1], 0.006]), proj([b[0], b[1], 0.006])])} stroke={path} strokeWidth={5} fill="none" />);
  // Zufahrten vom Vorplatz zur Straße
  under.push(<polygon key="acc1" points={pts(rect(W / 2 - 1.6, sy + 1.7, W / 2 + 1.6, -R, 0.005))} fill={path} />);
  under.push(<polygon key="acc2" points={pts(rect(W + R, D / 2 - 1.6, sx - 1.7, D / 2 + 1.6, 0.005))} fill={path} />);
  const walls = era === 0 ? ['#d9cfbd', '#cdbfa8', '#e0d8c9', '#c9b79d'] : ['#e4dfd5', '#d6d9dc', '#e9e3d6', '#cfd3d6'];
  const roofs = winter ? ['#dfe3e6', '#d5dade'] : ['#9a5a48', '#7f4b3f', '#5e646c', '#8a6150'];
  for (let i = 0, x = -R - 20; x < sx - 4; x += 5.6, i++) {
    if (hash(i * 4.7) < 0.16) continue;
    const hy = sy - 5 - hash(i * 2.9) * 1.2, h = 1.7 + hash(i * 1.3) * 1.3;
    stand(depth([x, hy, 0]), <g key={`hs${i}`} pointerEvents="none">{house(`hs${i}`, x, hy, 4, 3.2, h, walls[i % 4], roofs[Math.floor(hash(i * 7.1) * roofs.length)])}</g>);
    if (hash(i * 9.1) > 0.45) stand(depth([x + 2.9, hy + 2.4, 0]), <Tree key={`ht${i}`} x={x + 2.9} y={hy + 2.4} winter={winter} k={300 + i} s0={0.85} />);
  }
  for (let i = 0, y = sy + 6; y < D + R + 30; y += 5.8, i++) {
    if (hash(i * 3.3 + 50) < 0.2) continue;
    const hx = sx + 5 + hash(i * 6.1) * 1.2;
    stand(depth([hx, y, 0]), <g key={`he${i}`} pointerEvents="none">{house(`he${i}`, hx, y, 3.4, 4, 1.7 + hash(i * 8.3) * 1.2, walls[(i + 2) % 4], roofs[Math.floor(hash(i * 5.7 + 3) * roofs.length)])}</g>);
  }
  // Trainingsplatz links neben dem Vorplatz
  {
    const tx0 = -R - 21, tx1 = -R - 6, ty0 = D / 2 - 6, ty1 = D / 2 + 4.5, g2 = winter ? '#b7c4ba' : '#5c9a4f';
    under.push(<polygon key="tp" points={pts(rect(tx0, ty0, tx1, ty1, 0.004))} fill={g2} stroke={shade(g2, 0.82)} strokeWidth={1} />);
    for (let i = 0; i < 6; i += 2) under.push(<polygon key={`tps${i}`} points={pts(rect(tx0 + ((tx1 - tx0) / 6) * i, ty0, tx0 + ((tx1 - tx0) / 6) * (i + 1), ty1, 0.005))} fill={shade(g2, 1.08)} />);
    under.push(<g key="tpl" fill="none" stroke="#f1f5ee" strokeWidth={1} opacity={0.85}>
      <polygon points={pts(rect(tx0 + 0.5, ty0 + 0.5, tx1 - 0.5, ty1 - 0.5, 0.006))} />
      <polyline points={pl([proj([(tx0 + tx1) / 2, ty0 + 0.5, 0.006]), proj([(tx0 + tx1) / 2, ty1 - 0.5, 0.006])])} />
    </g>);
  }

  // --- Park zwischen Stadion und Vorplatzrand: Rasenflächen, Wege zu den Toren, Bäume, Laternen
  const a = ext + 2.6, b = RING - 2.4;
  if (b - a > 2.4) {
    const hw = 2.4; // halbe Wegbreite auf den Achsen
    const isles: [number, number, number, number][] = [
      [-a + 0.6, -b, W / 2 - hw, -a], [W / 2 + hw, -b, W + a - 0.6, -a],
      [-a + 0.6, D + a, W / 2 - hw, D + b], [W / 2 + hw, D + a, W + a - 0.6, D + b],
      [-b, -a + 0.6, -a, D / 2 - hw], [-b, D / 2 + hw, -a, D + a - 0.6],
      [W + a, -a + 0.6, W + b, D / 2 - hw], [W + a, D / 2 + hw, W + b, D + a - 0.6],
      [-b, -b, -a - 0.9, -a - 0.9], [W + a + 0.9, -b, W + b, -a - 0.9], [-b, D + a + 0.9, -a - 0.9, D + b], [W + a + 0.9, D + a + 0.9, W + b, D + b],
    ];
    // Plätze der Gebäude frei lassen
    const spots = Object.values(VENUE_SPOTS);
    isles.forEach(([x0, y0, x1, y1], i) => {
      if (x1 - x0 < 1.6 || y1 - y0 < 1.6) return;
      under.push(<polygon key={`is${i}`} points={pts(rect(x0, y0, x1, y1, 0.008))} fill={grass} stroke={shade(grass, 0.8)} strokeWidth={1.1} strokeLinejoin="round" />);
      under.push(<polygon key={`ih${i}`} points={pts(rect(x0 + 0.5, y0 + 0.5, x1 - 0.5, y0 + (y1 - y0) * 0.5, 0.009))} fill={shade(grass, 1.07)} opacity={0.6} />);
      const n = Math.round(((x1 - x0) * (y1 - y0)) / 11);
      for (let t = 0; t < n; t++) {
        const tx = x0 + 0.9 + hash(i * 17 + t * 3.1) * (x1 - x0 - 1.8), ty = y0 + 0.9 + hash(i * 29 + t * 5.7) * (y1 - y0 - 1.8);
        if (spots.some(([vx, vy]) => Math.abs(vx - tx) < 5.5 && Math.abs(vy - ty) < 4.5)) continue;
        stand(depth([tx, ty, 0]), <Tree key={`it${i}_${t}`} x={tx} y={ty} winter={winter} k={i * 40 + t} s0={0.8} />);
      }
    });
    for (const [lx, ly] of [[W / 2 - hw - 0.4, -a - 0.5], [W / 2 + hw + 0.4, -b + 0.5], [W / 2 - hw - 0.4, D + b - 0.5], [W / 2 + hw + 0.4, D + a + 0.5],
      [-a - 0.5, D / 2 - hw - 0.4], [-b + 0.5, D / 2 + hw + 0.4], [W + a + 0.5, D / 2 - hw - 0.4], [W + b - 0.5, D / 2 + hw + 0.4]] as [number, number][])
      stand(depth([lx, ly, 0]), <Lamp key={`lp${lx.toFixed(1)}${ly.toFixed(1)}`} x={lx} y={ly} lit={crowd > 0 && era >= 0} />);
  }
  // Gepflasterte Plätze unter den Gebäuden (Rasenflächen enden davor)
  Object.entries(VENUE_SPOTS).forEach(([k, [vx, vy]]) => {
    const w = k === 'parking' ? 13 : k === 'tickets' ? 8 : 9, d = k === 'transit' ? 9 : 6.4;
    under.push(<polygon key={`pad${k}`} points={pts(rect(vx - w / 2, vy - d / 2, vx + w / 2, vy + d / 2, 0.0095))} fill={shade(path, 1.03)} stroke={shade(path, 0.86)} strokeWidth={1} strokeLinejoin="round" />);
  });
  // Umlauf direkt am Stadion: helles Pflaster mit Kante
  under.push(<polygon key="apron" points={pts(rect(-ext - 1.6, -ext - 1.6, W + ext + 1.6, D + ext + 1.6, 0.006))} fill={shade(path, 1.06)} stroke={shade(path, 0.86)} strokeWidth={1} strokeLinejoin="round" opacity={0.9} />);

  // --- Fahnen am Haupteingang (vor der Haupttribüne)
  const fy = D + Math.min(RING - 4, ext + 4.5);
  for (let i = 0; i < 6; i++) {
    const fx = W / 2 - 8.5 + i * 3.4;
    stand(depth([fx, fy, 0]), <Flag key={`fl${i}`} x={fx} y={fy} color={i % 2 ? shade(secondary, 0.96) : primary} k={i} />);
  }

  // --- Zuschauer auf dem Vorplatz (Spieltag): Punkte auf den Wegen zu den Toren
  if (crowd > 0) {
    const cols = [primary, primary, '#ece7df', '#2f343b', '#c9a27e', secondary];
    const dots: ReactNode[] = [];
    const n = Math.round(260 * crowd);
    for (let i = 0; i < n; i++) {
      const axis = Math.floor(hash(i * 1.9) * 4), t = Math.pow(hash(i * 3.7), 0.8), off = (hash(i * 5.3) - 0.5) * 4.2;
      const r0 = ext + 1.2, r1 = RING + 3;
      const dist = r0 + t * (r1 - r0);
      const [wx, wy] = axis === 0 ? [W / 2 + off, D + dist] : axis === 1 ? [W / 2 + off, -dist] : axis === 2 ? [-dist, D / 2 + off] : [W + dist, D / 2 + off];
      const [px, py] = proj([wx, wy, 0]);
      dots.push(<g key={i}><ellipse cx={px + 1.6} cy={py + 0.4} rx={2} ry={0.8} fill="#000" opacity={0.18} /><rect x={px - 0.9} y={py - 4.2} width={1.8} height={3.4} rx={0.6} fill={cols[i % cols.length]} /><circle cx={px} cy={py - 5} r={1} fill="#e3c4a4" /></g>);
    }
    under.push(<g key="ppl" pointerEvents="none">{dots}</g>);
  }
  return { under, items };
}

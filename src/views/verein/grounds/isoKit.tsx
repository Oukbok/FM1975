// =============================================================================
// ISO-BAUKASTEN für das Vereinsgelände (Schrägansicht wie in klassischen
// Managern): Projektion, Quader, Dächer, Fenster, Plätze, Bäume, Autos.
// Welt-Koordinaten: x nach rechts-unten, y nach links-unten, z nach oben.
// =============================================================================
import type { ReactNode } from 'react';

export const S = 14;
export const OX = 640;
export const OY = 90;

export function P(x: number, y: number, z = 0): [number, number] {
  return [OX + (x - y) * S * 0.866, OY + (x + y) * S * 0.5 - z * S];
}
const pts = (...ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Farbe aufhellen/abdunkeln (Faktor > 1 heller). */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function Flat({ x, y, w, d, z = 0, fill, stroke, opacity }: { x: number; y: number; w: number; d: number; z?: number; fill: string; stroke?: string; opacity?: number }) {
  return <polygon points={pts(P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z))} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} opacity={opacity} />;
}

/** Quader mit sichtbarer Oberseite, Vorder- (y+d) und rechter Seite (x+w). */
export function Box({ x, y, w, d, h, z = 0, color, top, children }: { x: number; y: number; w: number; d: number; h: number; z?: number; color: string; top?: string; children?: ReactNode }) {
  const t = z + h;
  return (
    <g>
      <polygon points={pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, t), P(x, y + d, t))} fill={shade(color, 0.78)} />
      <polygon points={pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, t), P(x + w, y, t))} fill={shade(color, 0.95)} />
      <polygon points={pts(P(x, y, t), P(x + w, y, t), P(x + w, y + d, t), P(x, y + d, t))} fill={top ?? shade(color, 1.12)} />
      {children}
    </g>
  );
}

/** Satteldach (First entlang x) auf einem Quader. */
export function GableRoof({ x, y, w, d, z, rh, color }: { x: number; y: number; w: number; d: number; z: number; rh: number; color: string }) {
  const m = y + d / 2;
  return (
    <g>
      <polygon points={pts(P(x, y, z), P(x + w, y, z), P(x + w, m, z + rh), P(x, m, z + rh))} fill={shade(color, 1.05)} />
      <polygon points={pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, m, z + rh), P(x, m, z + rh))} fill={shade(color, 0.85)} />
      <polygon points={pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, m, z + rh))} fill={shade(color, 0.7)} />
    </g>
  );
}

/** Fensterreihe auf der Vorderseite (y = yf) bzw. rechten Seite (x = xf). */
export function WindowsFront({ x, w, yf, z0, rows, color = '#cfe6f2', step = 1.6, ww = 0.9, wh = 0.7, rowH = 1.4 }: { x: number; w: number; yf: number; z0: number; rows: number; color?: string; step?: number; ww?: number; wh?: number; rowH?: number }) {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let u = x + 0.5; u + ww <= x + w - 0.3; u += step) {
      const z = z0 + r * rowH;
      out.push(<polygon key={`${r}-${u}`} points={pts(P(u, yf, z), P(u + ww, yf, z), P(u + ww, yf, z + wh), P(u, yf, z + wh))} fill={color} opacity={0.85} />);
    }
  }
  return <g>{out}</g>;
}
export function WindowsSide({ y, d, xf, z0, rows, color = '#cfe6f2', step = 1.6, ww = 0.9, wh = 0.7, rowH = 1.4 }: { y: number; d: number; xf: number; z0: number; rows: number; color?: string; step?: number; ww?: number; wh?: number; rowH?: number }) {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let u = y + 0.5; u + ww <= y + d - 0.3; u += step) {
      const z = z0 + r * rowH;
      out.push(<polygon key={`${r}-${u}`} points={pts(P(xf, u, z), P(xf, u + ww, z), P(xf, u + ww, z + wh), P(xf, u, z + wh))} fill={color} opacity={0.85} />);
    }
  }
  return <g>{out}</g>;
}

/** Rasenplatz mit Linien (Länge entlang x). */
export function Pitch({ x, y, w, d, grass, lines = '#f4f7f2', stripes = true, goals = true }: { x: number; y: number; w: number; d: number; grass: string; lines?: string; stripes?: boolean; goals?: boolean }) {
  const strips: ReactNode[] = [];
  if (stripes) {
    const n = 8;
    for (let i = 0; i < n; i += 2) strips.push(<Flat key={i} x={x + (w / n) * i} y={y} w={w / n} d={d} fill={shade(grass, 1.08)} />);
  }
  const m = 0.6;
  const circle: [number, number][] = [];
  const r = Math.min(w, d) * 0.14;
  for (let a = 0; a <= 24; a++) circle.push(P(x + w / 2 + Math.cos((a / 24) * Math.PI * 2) * r, y + d / 2 + Math.sin((a / 24) * Math.PI * 2) * r));
  const bx = Math.min(w * 0.16, 3), bd = d * 0.5;
  return (
    <g>
      <Flat x={x} y={y} w={w} d={d} fill={grass} />
      {strips}
      <g fill="none" stroke={lines} strokeWidth={1.1} opacity={0.85}>
        <polygon points={pts(P(x + m, y + m), P(x + w - m, y + m), P(x + w - m, y + d - m), P(x + m, y + d - m))} />
        <polyline points={pts(P(x + w / 2, y + m), P(x + w / 2, y + d - m))} />
        <polyline points={pts(...circle)} />
        <polyline points={pts(P(x + m, y + d / 2 - bd / 2), P(x + m + bx, y + d / 2 - bd / 2), P(x + m + bx, y + d / 2 + bd / 2), P(x + m, y + d / 2 + bd / 2))} />
        <polyline points={pts(P(x + w - m, y + d / 2 - bd / 2), P(x + w - m - bx, y + d / 2 - bd / 2), P(x + w - m - bx, y + d / 2 + bd / 2), P(x + w - m, y + d / 2 + bd / 2))} />
      </g>
      {goals && <>
        <polyline points={pts(P(x + m, y + d / 2 - 0.9, 0), P(x + m, y + d / 2 - 0.9, 0.7), P(x + m, y + d / 2 + 0.9, 0.7), P(x + m, y + d / 2 + 0.9, 0))} fill="none" stroke="#fff" strokeWidth={1.6} />
        <polyline points={pts(P(x + w - m, y + d / 2 - 0.9, 0), P(x + w - m, y + d / 2 - 0.9, 0.7), P(x + w - m, y + d / 2 + 0.9, 0.7), P(x + w - m, y + d / 2 + 0.9, 0))} fill="none" stroke="#fff" strokeWidth={1.6} />
      </>}
    </g>
  );
}

/** Ovale Laufbahn (Stadion mit Leichtathletik). */
export function Track({ x, y, w, d, color = '#b5553f' }: { x: number; y: number; w: number; d: number; color?: string }) {
  const outer: [number, number][] = [], inner: [number, number][] = [];
  const cx = x + w / 2, cy = y + d / 2;
  for (let a = 0; a <= 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    const ox = Math.cos(t), oy = Math.sin(t);
    const sx = Math.sign(ox) * Math.pow(Math.abs(ox), 0.6), sy = Math.sign(oy) * Math.pow(Math.abs(oy), 0.6);
    outer.push(P(cx + sx * (w / 2), cy + sy * (d / 2)));
    inner.push(P(cx + sx * (w / 2 - 1.4), cy + sy * (d / 2 - 1.4)));
  }
  return <g><polygon points={pts(...outer)} fill={color} /><polygon points={pts(...inner)} fill="none" stroke="#e9d9cf" strokeWidth={0.8} opacity={0.6} /></g>;
}

export function Tree({ x, y, s = 1, color = '#3f7a3a', snow = false }: { x: number; y: number; s?: number; color?: string; snow?: boolean }) {
  const [bx, by] = P(x, y, 0);
  const [, ty] = P(x, y, 2.6 * s);
  return (
    <g>
      <rect x={bx - 2} y={by - 10 * s} width={4} height={10 * s} fill="#5b4330" />
      <ellipse cx={bx} cy={(by + ty) / 2 - 6 * s} rx={11 * s} ry={15 * s} fill={snow ? '#e7eef0' : color} />
      <ellipse cx={bx - 3 * s} cy={(by + ty) / 2 - 10 * s} rx={5 * s} ry={6 * s} fill={snow ? '#ffffff' : shade(color, 1.18)} opacity={0.8} />
    </g>
  );
}

export function Car({ x, y, color, era }: { x: number; y: number; color: string; era: number }) {
  const h = era < 1990 ? 0.45 : 0.55;
  return (
    <g>
      <Box x={x} y={y} w={1.8} d={0.9} h={h} color={color} />
      <Box x={x + 0.4} y={y + 0.1} w={0.9} d={0.7} h={0.35} z={h} color={shade(color, 0.9)} top="#9fc3d6" />
    </g>
  );
}

/** Flutlichtmast. `lux` (300–1600) steuert Lampenfeld und Lichtkegel. */
export function Floodlight({ x, y, h, lux = 300 }: { x: number; y: number; h: number; lux?: number }) {
  const [bx, by] = P(x, y, 0);
  const [, ty] = P(x, y, h);
  const w = lux >= 1400 ? 22 : lux >= 800 ? 19 : 16;
  const led = lux >= 1600;
  return (
    <g>
      <line x1={bx} y1={by} x2={bx} y2={ty} stroke="#6f7782" strokeWidth={lux >= 800 ? 3 : 2.4} />
      {lux >= 1200 && <path d={`M${bx - w / 2},${ty + 3} L${bx - w * 1.1},${ty + 26} L${bx + w * 1.1},${ty + 26} L${bx + w / 2},${ty + 3} Z`} fill={led ? 'rgba(240,248,255,0.13)' : 'rgba(255,236,170,0.12)'} />}
      <rect x={bx - w / 2} y={ty - 7} width={w} height={lux >= 800 ? 10 : 8} fill="#2d333b" stroke="#6f7782" />
      <rect x={bx - w / 2 + 2} y={ty - 5} width={w - 4} height={lux >= 800 ? 6 : 4} fill={led ? '#f4f8ff' : '#fff6c8'} />
    </g>
  );
}

/** Bus (Shuttle). Länge entlang x. */
export function Bus({ x, y, color = '#e8c547' }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <Box x={x} y={y} w={3.2} d={1.1} h={1.1} color={color} />
      <Box x={x + 0.2} y={y + 1.1} w={2.8} d={0.01} h={0.4} z={0.55} color="#9fc3d6" />
    </g>
  );
}

/** Zug/Straßenbahn aus `n` Wagen entlang y. */
export function Train({ x, y, n = 3, color = '#c8463c', era = 1975 }: { x: number; y: number; n?: number; color?: string; era?: number }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    out.push(<g key={i}>
      <Box x={x} y={y + i * 4.2} w={1.2} d={3.9} h={1.3} color={color} top={shade(color, 1.15)} />
      <Box x={x + 1.2} y={y + i * 4.2 + 0.3} w={0.01} d={3.3} h={0.45} z={0.6} color={era >= 2000 ? '#2c3540' : '#e9dfc4'} />
    </g>);
  }
  return <g>{out}</g>;
}

/** Spitzzelt (VIP-Zelt, Fan-Zone). */
export function Tent({ x, y, w, d, h, color = '#f4f2ee', peak = 1.4 }: { x: number; y: number; w: number; d: number; h: number; color?: string; peak?: number }) {
  const c = [x + w / 2, y + d / 2] as const;
  return (
    <g>
      <Box x={x} y={y} w={w} d={d} h={h} color={shade(color, 0.92)} />
      <polygon points={pts(P(x, y + d, h), P(x + w, y + d, h), P(c[0], c[1], h + peak))} fill={shade(color, 0.9)} />
      <polygon points={pts(P(x + w, y, h), P(x + w, y + d, h), P(c[0], c[1], h + peak))} fill={shade(color, 1.0)} />
      <polygon points={pts(P(x, y, h), P(x + w, y, h), P(c[0], c[1], h + peak))} fill={shade(color, 1.08)} />
    </g>
  );
}

/** Satellitenschüssel. */
export function Dish({ x, y, z = 0, r = 7 }: { x: number; y: number; z?: number; r?: number }) {
  const [cx, cy] = P(x, y, z);
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 1.2} stroke="#8c96a0" strokeWidth={1.5} />
      <ellipse cx={cx} cy={cy - r * 1.4} rx={r} ry={r * 0.55} fill="#e8edf1" stroke="#9aa6b2" transform={`rotate(-25 ${cx} ${cy - r * 1.4})`} />
    </g>
  );
}

/** Zaun entlang eines Rechtecks (zugekauftes Grundstück). */
export function Fence({ x, y, w, d, color = '#c9b48a' }: { x: number; y: number; w: number; d: number; color?: string }) {
  const posts: ReactNode[] = [];
  for (let u = 0; u <= w; u += 1.5) posts.push(<line key={`a${u}`} x1={P(x + u, y + d)[0]} y1={P(x + u, y + d)[1]} x2={P(x + u, y + d, 0.6)[0]} y2={P(x + u, y + d, 0.6)[1]} stroke={color} strokeWidth={1.2} />);
  return (
    <g>
      <polyline points={pts(P(x, y, 0.5), P(x + w, y, 0.5), P(x + w, y + d, 0.5), P(x, y + d, 0.5), P(x, y, 0.5))} fill="none" stroke={color} strokeWidth={1.2} />
      {posts}
    </g>
  );
}

/** Baukran (laufendes Bauprojekt). */
export function Crane({ x, y, h = 9 }: { x: number; y: number; h?: number }) {
  const [bx, by] = P(x, y, 0);
  const [, ty] = P(x, y, h);
  const [jx, jy] = P(x + 6, y - 1, h);
  return (
    <g stroke="#e0a23a" strokeWidth={2.5} fill="none">
      <line x1={bx} y1={by} x2={bx} y2={ty} />
      <line x1={bx - 30} y1={ty + 6} x2={jx} y2={jy} />
      <line x1={jx - 6} y1={jy} x2={jx - 6} y2={jy + 40} strokeWidth={1} stroke="#cfd5db" />
    </g>
  );
}

export { pts };

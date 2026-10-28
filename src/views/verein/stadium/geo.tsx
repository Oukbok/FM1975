// =============================================================================
// STADION-GEOMETRIE: Kamera (leicht gedreht, erhöht), Projektion, Flächen mit
// Normalen-Test und Licht, Linien, Schatten. Genutzt von StadiumScene und
// StadiumBlockShape.
// =============================================================================
import type { ReactNode } from 'react';
import type { BlockId, StadiumBlock } from '../../../types';
import { shade } from '../grounds/isoKit';

export type V3 = [number, number, number];
/** Spielfeld (Länge entlang x, Breite entlang y) und Abstand Feld–Tribüne. */
export const W = 30, D = 19, GAP = 1.1;
export const SC = 16;
const YAW = 0.32, ELEV = 0.86;
const CA = Math.cos(YAW), SA = Math.sin(YAW), SE = Math.sin(ELEV), CE = Math.cos(ELEV);
export const SCREEN_DEPTH = SE;

export function proj([x, y, z]: V3): [number, number] {
  const dx = x - W / 2, dy = y - D / 2;
  return [(dx * CA - dy * SA) * SC, (dx * SA + dy * CA) * SE * SC - z * CE * SC];
}
export const pts = (vs: V3[]) => vs.map((v) => proj(v).map((n) => n.toFixed(1)).join(',')).join(' ');
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Richtung zur Kamera. */
export const VIEW: V3 = [SA * CE, CA * CE, SE];
/** Tiefe (größer = näher an der Kamera, später zeichnen). */
export const depth = (v: V3) => dot(v, VIEW);
const LN = Math.hypot(-0.3, 0.35, 1);
export const LIGHT: V3 = [-0.3 / LN, 0.35 / LN, 1 / LN];
/** Schattenwurf je Höheneinheit auf den Boden. */
export const SHADOW: [number, number] = [0.3, -0.35];

export function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/** Fläche mit Normalen-Test; `back` = Farbe der Rückseite (sonst unsichtbar). */
export function face(key: string, vs: V3[], nOut: V3, color: string, o?: { back?: string; opacity?: number; stroke?: string; sw?: number }): ReactNode {
  let n = cross(sub(vs[1], vs[0]), sub(vs[2], vs[0]));
  if (dot(n, nOut) < 0) n = neg(n);
  const len = Math.hypot(...n) || 1;
  let col = color;
  if (dot(n, VIEW) <= 1e-4 * len) {
    if (!o?.back) return null;
    col = o.back; n = neg(n);
  }
  const l = 0.7 + 0.4 * Math.max(0, dot(n, LIGHT) / len);
  return <polygon key={key} points={pts(vs)} fill={shade(col, l)} opacity={o?.opacity} stroke={o?.stroke} strokeWidth={o?.stroke ? o.sw ?? 0.8 : 0} strokeLinejoin="round" />;
}
export function seg(key: string, a: V3, b: V3, stroke: string, w: number, extra?: { dash?: string; opacity?: number; cap?: 'round' | 'butt' }): ReactNode {
  const [x1, y1] = proj(a), [x2, y2] = proj(b);
  return <line key={key} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={stroke} strokeWidth={w}
    strokeDasharray={extra?.dash} opacity={extra?.opacity} strokeLinecap={extra?.cap ?? 'butt'} />;
}

/** Lokale Blockkoordinaten (u entlang der Seite, v vom Platz weg) → Welt. */
export interface BlockFrame { len: number; at: (u: number, v: number, z: number) => V3; ud: V3; vd: V3 }
export function mapper(id: BlockId): BlockFrame {
  switch (id) {
    case 'opposite': return { len: W, at: (u, v, z) => [u, -GAP - v, z], ud: [1, 0, 0], vd: [0, -1, 0] };
    case 'main': return { len: W, at: (u, v, z) => [u, D + GAP + v, z], ud: [1, 0, 0], vd: [0, 1, 0] };
    case 'north': return { len: D, at: (u, v, z) => [-GAP - v, u, z], ud: [0, 1, 0], vd: [-1, 0, 0] };
    case 'south': return { len: D, at: (u, v, z) => [W + GAP + v, u, z], ud: [0, 1, 0], vd: [1, 0, 0] };
  }
}
/** Tribüne zeigt der Kamera den Rücken (Außenfassade sichtbar). */
export const isNear = (id: BlockId) => dot(mapper(id).vd, VIEW) > 0;

const RAKE = 0.55, DEPTH_PER_ROW = 0.19;
export interface TierGeo { v0: number; v1: number; zb: number; zt: number }
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
/** Höhe von Dach-Unterkante (hinten/vorne) und Dachkante vorne. */
export function roofGeo(b: StadiumBlock): { vS: number; vB: number; zB: number; zF: number } | null {
  if (b.roof === 'none') return null;
  const geo = tierGeometry(b), last = geo[geo.length - 1];
  const vMax = last.v1;
  const zB = last.zt + 1.7;
  return { vS: b.roof === 'full' ? -0.6 : vMax * 0.45, vB: vMax + 0.25, zB, zF: zB + 0.45 };
}

/** Konvexe Hülle (Bildschirmkoordinaten). */
export function hull(ps: [number, number][]): [number, number][] {
  const p = [...ps].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
/** Bodenpunkt des Schattens eines 3D-Punkts. */
export const shadowPt = ([x, y, z]: V3): [number, number] => proj([x + z * SHADOW[0], y + z * SHADOW[1], 0]);

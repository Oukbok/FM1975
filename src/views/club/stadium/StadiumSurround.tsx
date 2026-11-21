// =============================================================================
// STADIONUMFELD IM STADIONBILD: Würstchenbuden, Fanshop, Megastore, Kassen,
// Parkplatz, Hospitality, Vereinsheim, Fan-Zone, Museum, Haltestelle – gezeichnet
// in der Stadionkamera (geo.tsx), anklickbar. Logik bleibt in engine/grounds.ts
// bzw. engine/infrastructure.ts; hier nur Lage, Größe je Ausbaustufe und Zeichnung.
// Die Plätze liegen außerhalb der größtmöglichen Tribünen (RING), damit der
// Bildausschnitt bei jedem Ausbau gleich bleibt.
// =============================================================================
import type { ReactNode } from 'react';
import type { Club } from '../../../types';
import type { GroundsModuleKey } from '../../../types/grounds';
import { shade } from '../grounds/isoKit';
import { D, V3, W, depth, face, hash, proj, pts } from './geo';

/** Abstand vom Spielfeldrand, ab dem nie Tribüne steht (3 Ränge × 36 Reihen + Dach). */
export const RING = 23.6;
/** Rand des Stadiongeländes (Zaun): alles Umfeld liegt zwischen RING und PLOT – unabhängig vom Ausbau der Tribünen. */
export const PLOT = RING + 17;
/** Zugekaufte Grundstücke: eingezäunte Flächen links neben und vor dem Gelände [x0, y0, x1, y1]. */
export function parcelRects(n: number): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const span = D + 2 * PLOT, step = span / 6, wx = W + 2 * PLOT, stepX = wx / 6;
  for (let i = 0; i < n; i++) {
    if (i < 6) out.push([-PLOT - 15, -PLOT + i * step + 0.6, -PLOT - 1.2, -PLOT + (i + 1) * step - 0.6]);
    else { const k = (i - 6) % 6, row = Math.floor((i - 6) / 6); out.push([-PLOT + k * stepX + 0.6, D + PLOT + 1.2 + row * 15, -PLOT + (k + 1) * stepX - 0.6, D + PLOT + 15 + row * 15]); }
  }
  return out;
}

export type VenueGroup = 'gastro' | 'handel' | 'anreise' | 'vip' | 'tickets';
export type VenueKey = 'catering' | 'merchandising' | 'tickets' | GroundsModuleKey;
export interface Venue {
  key: VenueKey;
  name: string;
  group: VenueGroup;
  /** Einrichtung (infrastructure), Umfeld-Modul (grounds) oder Ticketverkauf (Preise). */
  kind: 'facility' | 'grounds' | 'tickets';
  level: number;
  max: number;
  /** Anker in Weltkoordinaten (Mitte des Grundrisses). */
  x: number; y: number;
}

export const VENUE_GROUPS: { key: VenueGroup; name: string }[] = [
  { key: 'gastro', name: 'Gastronomie' }, { key: 'handel', name: 'Handel' }, { key: 'anreise', name: 'Anreise' }, { key: 'vip', name: 'Hospitality' },
];

const lvl = (club: Club, k: GroundsModuleKey) => club.grounds?.modules[k]?.level ?? 0;
const GM = (k: GroundsModuleKey) => ({ megastore: 3, hospitality: 3, parking: 4, vereinsheim: 3, fanZone: 2, museum: 2, transit: 4 } as Record<string, number>)[k] ?? 3;

/** Feste Lage der Plätze (Weltkoordinaten) – auch Bezug für den Bildausschnitt. */
export const VENUE_SPOTS: Record<string, [number, number]> = {
  tickets: [W / 2 + 1, D + RING + 4.5], catering: [-RING - 7, D / 2], merchandising: [W / 2 + 12, D + RING + 6],
  megastore: [W + RING + 5, D + RING + 8], parking: [W / 2 - 17, D + RING + 9], transit: [W + RING + 9, D / 2 + 2],
  hospitality: [-RING - 5, D + RING + 7], vereinsheim: [-RING - 6, -RING - 6], fanZone: [W / 2, -RING - 8], museum: [W + RING + 6, -RING - 6],
};

/** Alle Plätze rund ums Stadion mit aktuellem Ausbau. */
export function venuesOf(club: Club, year: number): Venue[] {
  const at = (k: string) => ({ x: VENUE_SPOTS[k][0], y: VENUE_SPOTS[k][1] });
  const v: Venue[] = [
    { key: 'tickets', name: 'Kassen', group: 'tickets', kind: 'tickets', level: 1, max: 1, ...at('tickets') },
    { key: 'catering', name: 'Würstchenbuden', group: 'gastro', kind: 'facility', level: club.infrastructure?.catering ?? 1, max: 5, ...at('catering') },
    { key: 'merchandising', name: 'Fanshop', group: 'handel', kind: 'facility', level: club.infrastructure?.merchandising ?? 1, max: 5, ...at('merchandising') },
    { key: 'megastore', name: 'Megastore', group: 'handel', kind: 'grounds', level: lvl(club, 'megastore'), max: GM('megastore'), ...at('megastore') },
    { key: 'parking', name: 'Parkplätze', group: 'anreise', kind: 'grounds', level: lvl(club, 'parking'), max: GM('parking'), ...at('parking') },
    { key: 'transit', name: 'ÖPNV', group: 'anreise', kind: 'grounds', level: lvl(club, 'transit'), max: GM('transit'), ...at('transit') },
    { key: 'hospitality', name: 'Hospitality', group: 'vip', kind: 'grounds', level: lvl(club, 'hospitality'), max: GM('hospitality'), ...at('hospitality') },
    { key: 'vereinsheim', name: 'Vereinsheim', group: 'gastro', kind: 'grounds', level: lvl(club, 'vereinsheim'), max: GM('vereinsheim'), ...at('vereinsheim') },
    { key: 'fanZone', name: 'Fan-Zone', group: 'gastro', kind: 'grounds', level: lvl(club, 'fanZone'), max: GM('fanZone'), ...at('fanZone') },
    { key: 'museum', name: 'Museum', group: 'handel', kind: 'grounds', level: lvl(club, 'museum'), max: GM('museum'), ...at('museum') },
  ];
  void year;
  return v;
}

// -----------------------------------------------------------------------------
// Zeichnen (Weltkoordinaten, Quader mit Licht über face())
// -----------------------------------------------------------------------------
function cube(k: string, x: number, y: number, w: number, d: number, h: number, col: string, top?: string, z = 0): ReactNode[] {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, z1 = z + h;
  return [
    face(`${k}n`, [[x0, y1, z], [x1, y1, z], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], col),
    face(`${k}s`, [[x0, y0, z], [x1, y0, z], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], col),
    face(`${k}e`, [[x1, y0, z], [x1, y1, z], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], col),
    face(`${k}w`, [[x0, y0, z], [x0, y1, z], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], col),
    face(`${k}t`, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], top ?? shade(col, 1.1)),
  ];
}
/** Satteldach entlang x. */
function gable(k: string, x: number, y: number, w: number, d: number, z: number, rh: number, col: string): ReactNode[] {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
  return [
    face(`${k}a`, [[x0, y1, z], [x1, y1, z], [x1, y, z + rh], [x0, y, z + rh]], [0, 1, 1], col),
    face(`${k}b`, [[x0, y0, z], [x1, y0, z], [x1, y, z + rh], [x0, y, z + rh]], [0, -1, 1], col),
    face(`${k}c`, [[x1, y0, z], [x1, y1, z], [x1, y, z + rh]], [1, 0, 0], shade(col, 0.9)),
    face(`${k}d`, [[x0, y0, z], [x0, y1, z], [x0, y, z + rh]], [-1, 0, 0], shade(col, 0.9)),
  ];
}
const flat = (k: string, x: number, y: number, w: number, d: number, fill: string, op?: number) =>
  <polygon key={k} points={pts([[x - w / 2, y - d / 2, 0.02], [x + w / 2, y - d / 2, 0.02], [x + w / 2, y + d / 2, 0.02], [x - w / 2, y + d / 2, 0.02]])} fill={fill} opacity={op} />;
/** Leerer Bauplatz (gestrichelt). */
const plot = (k: string, x: number, y: number, w: number, d: number) =>
  <polygon key={k} points={pts([[x - w / 2, y - d / 2, 0.03], [x + w / 2, y - d / 2, 0.03], [x + w / 2, y + d / 2, 0.03], [x - w / 2, y + d / 2, 0.03]])}
    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.38)" strokeWidth={1.2} strokeDasharray="5 4" />;

/** Rechteck auf der Vorderwand (zur Kamera, y = y1) eines Gebäudes: Fenster, Schilder, Türen. */
const front = (k: string, x: number, y1: number, w: number, z0: number, z1: number, fill: string, op?: number) =>
  <polygon key={k} points={pts([[x - w / 2, y1 + 0.012, z0], [x + w / 2, y1 + 0.012, z0], [x + w / 2, y1 + 0.012, z1], [x - w / 2, y1 + 0.012, z1]])} fill={fill} opacity={op} />;
/** Rechteck auf der rechten Seitenwand (x = x1). */
const side = (k: string, x1: number, y: number, d: number, z0: number, z1: number, fill: string, op?: number) =>
  <polygon key={k} points={pts([[x1 + 0.012, y - d / 2, z0], [x1 + 0.012, y + d / 2, z0], [x1 + 0.012, y + d / 2, z1], [x1 + 0.012, y - d / 2, z1]])} fill={fill} opacity={op} />;
/** Fensterreihe auf der Vorderwand. */
function windows(k: string, x: number, y1: number, w: number, z0: number, h: number, n: number, fill = '#39424c', op = 0.7): ReactNode[] {
  const out: ReactNode[] = [], step = w / n;
  for (let i = 0; i < n; i++) out.push(front(`${k}${i}`, x - w / 2 + step * (i + 0.5), y1, step * 0.62, z0, z0 + h, fill, op));
  return out;
}
/** Gestreifte Markise (Vorderkante eines Stands). */
function awning(k: string, x: number, y1: number, w: number, z: number, a: string, b: string): ReactNode[] {
  const out: ReactNode[] = [], n = Math.max(3, Math.round(w / 0.32));
  for (let i = 0; i < n; i++) {
    const xa = x - w / 2 + (w * i) / n, xb = x - w / 2 + (w * (i + 1)) / n;
    out.push(<polygon key={`${k}${i}`} points={pts([[xa, y1, z + 0.3], [xb, y1, z + 0.3], [xb, y1 + 0.55, z], [xa, y1 + 0.55, z]])} fill={i % 2 ? a : b} />);
  }
  return out;
}
const GLASS = '#a7d3e6';

export function VenueShape({ v, era, primary }: { v: Venue; era: number; primary: string }): ReactNode {
  const out: ReactNode[] = [];
  const wall = era === 0 ? '#cdc5b6' : era === 1 ? '#d2d5d8' : '#e2e5e8';
  const roof = era === 0 ? '#8a5b49' : '#5d646d';
  const { x, y, level: L } = v;
  switch (v.key) {
    case 'tickets':
      for (const dx of [-2.2, 2.2]) {
        out.push(...cube(`tk${dx}`, x + dx, y, 1.5, 1.1, 1.3, wall));
        out.push(front(`tkw${dx}`, x + dx, y + 0.55, 0.9, 0.55, 1.0, '#2f363e', 0.85));
        out.push(...gable(`tkr${dx}`, x + dx, y, 1.8, 1.4, 1.3, 0.5, primary));
      }
      break;
    case 'catering': {
      const n = Math.max(1, L) + (L >= 4 ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const yy = y - ((n - 1) * 2.2) / 2 + i * 2.2;
        out.push(...cube(`cb${i}`, x, yy, 1.7, 1.5, 1.15, L >= 4 ? '#eceef0' : '#e6dfd0', L >= 4 ? '#c9ced3' : '#b9ad98'));
        out.push(front(`cbo${i}`, x, yy + 0.75, 1.25, 0.5, 0.95, '#2b3138', 0.85));
        out.push(...awning(`ca${i}`, x, yy + 0.75, 1.9, 1.15, i % 2 ? primary : '#d8c25a', '#f3f1ea'));
        if (L >= 2) out.push(...cube(`ctb${i}`, x + 1.5, yy + 0.3, 0.5, 0.5, 0.45, '#8b6a4a')); // Stehtisch
      }
      break;
    }
    case 'merchandising': {
      const w = 2.6 + L * 0.55, h = 1.3 + L * 0.25;
      out.push(...cube('fs', x, y, w, 2.4, h, wall, shade(wall, 0.85)));
      out.push(front('fsg', x, y + 1.2, w * 0.86, 0.2, h * 0.58, GLASS, 0.9));
      out.push(front('fsd', x, y + 1.2, 0.5, 0.2, h * 0.58, '#3a424b', 0.8));
      out.push(front('fsb', x, y + 1.2, w, h - 0.48, h - 0.1, primary));
      out.push(front('fsl', x, y + 1.2, w * 0.5, h - 0.36, h - 0.24, '#ffffff', 0.85));
      break;
    }
    case 'megastore': {
      if (!L) { out.push(plot('ms', x, y, 6, 3.6)); break; }
      const w = 3.6 + L * 1.3, h = 1.7 + L * 0.6;
      out.push(...cube('ms', x, y, w, 3.3, h, L >= 2 ? '#dfe3e6' : wall, '#9aa3ad'));
      out.push(front('msg', x, y + 1.65, w * 0.9, 0.2, h * 0.62, GLASS, 0.92));
      for (let i = 1; i < Math.round(w / 0.9); i++) out.push(front(`msm${i}`, x - w * 0.45 + i * 0.9 * (w * 0.9) / (Math.round(w / 0.9) * 0.9), y + 1.65, 0.05, 0.2, h * 0.62, '#eef2f4'));
      out.push(front('msb', x, y + 1.65, w, h - 0.6, h - 0.08, primary));
      out.push(front('msl', x, y + 1.65, w * 0.42, h - 0.42, h - 0.26, '#ffffff', 0.9));
      out.push(side('mss', x + w / 2, y, 2.6, 0.3, h * 0.6, GLASS, 0.75));
      break;
    }
    case 'parking': {
      const w = 6 + L * 2.6, d = 5.5;
      if (!L) { out.push(flat('pk', x, y, 8, 5, '#8e8b84', 0.55)); out.push(plot('pkp', x, y, 8, 5)); break; }
      out.push(flat('pk', x, y, w, d, L === 1 ? '#a39c90' : '#5c6168'));
      if (L >= 2) for (let i = 0; i <= Math.floor(w / 1.2); i++) {
        const xx = x - w / 2 + i * 1.2;
        out.push(<polyline key={`pl${i}`} points={pts([[xx, y - d / 2 + 0.3, 0.03], [xx, y - 0.4, 0.03]])} stroke="#e8e8e8" strokeOpacity={0.55} strokeWidth={1} />);
        out.push(<polyline key={`pm${i}`} points={pts([[xx, y + 0.4, 0.03], [xx, y + d / 2 - 0.3, 0.03]])} stroke="#e8e8e8" strokeOpacity={0.55} strokeWidth={1} />);
      }
      for (let i = 0; i < Math.round(w * 1.1); i++) {
        if (hash(i * 3.7) < 0.35) continue;
        const cx = x - w / 2 + 0.6 + (i % Math.floor(w / 1.2)) * 1.2, cy = y - d / 2 + 0.9 + Math.floor(i / Math.floor(w / 1.2)) * 2.4;
        if (cy > y + d / 2 - 0.5) break;
        const col = ['#a33a32', '#2f5d9a', '#d9d6cf', '#3b3f45', '#4b7a4a', '#c9a23a'][Math.floor(hash(i) * 6)];
        out.push(...cube(`car${i}`, cx, cy, 0.62, 1.15, 0.3, col));
        out.push(...cube(`cab${i}`, cx, cy + 0.05, 0.56, 0.6, 0.2, '#2c3138', shade(col, 0.95), 0.3)); // Fahrgastzelle
      }
      if (L >= 3) {
        const hx = x + w / 2 - 2.2, hh = 1.6 * (L - 1);
        out.push(...cube('ph', hx, y + 0.2, 4, 4.4, hh, '#a9afb5', '#7a8088'));
        for (let k = 1; k * 0.8 < hh; k++) out.push(front(`phd${k}`, hx, y + 2.4, 3.8, k * 0.8 - 0.28, k * 0.8 - 0.05, '#3a414a', 0.8));
      }
      break;
    }
    case 'transit':
      if (!L) { out.push(plot('tr', x, y, 3, 6)); break; }
      out.push(flat('trp', x, y, 2.8, 7.4, '#9a9da1'));
      if (L >= 3) out.push(<polyline key="trr" points={pts([[x + 0.3, y - 3.6, 0.03], [x + 0.3, y + 3.6, 0.03]])} stroke="#4b5159" strokeWidth={1.4} />, <polyline key="trr2" points={pts([[x + 0.9, y - 3.6, 0.03], [x + 0.9, y + 3.6, 0.03]])} stroke="#4b5159" strokeWidth={1.4} />);
      out.push(...cube('trs', x - 0.75, y, 0.9, 2.8, 1.05, '#d6dbe0', '#7e8790'));
      out.push(side('trg', x - 0.3, y, 2.4, 0.3, 0.9, GLASS, 0.7));
      if (L >= 2) {
        const bc = L >= 3 ? '#c8463c' : '#e0c050';
        out.push(...cube('trb', x + 0.6, y + 0.6, 1.1, L >= 3 ? 4.6 : 3.4, 1.0, bc, shade(bc, 0.85)));
        out.push(side('trw', x + 1.15, y + 0.6, L >= 3 ? 4.2 : 3.0, 0.5, 0.85, '#27303a', 0.85));
        out.push(front('trf', x + 0.6, y + 0.6 + (L >= 3 ? 2.3 : 1.7), 0.9, 0.5, 0.85, '#27303a', 0.85));
      }
      break;
    case 'hospitality': {
      if (!L) { out.push(plot('hp', x, y, 6, 4)); break; }
      if (L === 1) {
        out.push(...cube('ht', x, y, 5, 3.4, 1.1, '#f4f2ed'));
        for (const dx of [-1.6, 0, 1.6]) out.push(...gable(`htr${dx}`, x + dx, y, 1.7, 3.6, 1.1, 0.9, '#fbfaf7'));
        out.push(front('htd', x, y + 1.7, 1.2, 0, 0.95, '#c8b98f', 0.8));
        break;
      }
      const w = 4 + L * 1.4, h = 1.6 + L * 0.8;
      out.push(...cube('hb', x, y, w, 3.6, h, L >= 3 ? '#2d3238' : '#cfd4d9', L >= 3 ? '#4a525b' : undefined));
      out.push(front('hbg', x, y + 1.8, w * 0.9, 0.35, h - 0.35, GLASS, 0.9));
      for (let k = 1; k * 0.9 < h - 0.5; k++) out.push(front(`hbf${k}`, x, y + 1.8, w * 0.9, 0.3 + k * 0.9, 0.36 + k * 0.9, L >= 3 ? '#2d3238' : '#eef1f3'));
      out.push(side('hbs', x + w / 2, y, 3, 0.35, h - 0.35, GLASS, 0.7));
      out.push(front('hbc', x, y + 1.8, 1.6, 0, 0.32, '#d9b45a')); // roter Teppich wäre zu viel – goldene Schwelle
      break;
    }
    case 'vereinsheim': {
      if (!L) { out.push(plot('vh', x, y, 5, 4)); break; }
      const w = 3.2 + L, h = 1.5 + L * 0.3;
      out.push(...cube('vh', x, y, w, 3, h, era === 0 ? '#d3c3a5' : wall));
      out.push(...windows('vhw', x, y + 1.5, w * 0.86, h * 0.42, h * 0.3, Math.max(3, Math.round(w / 1.1))));
      out.push(front('vhd', x - w * 0.3, y + 1.5, 0.5, 0, h * 0.5, '#5b4330'));
      out.push(...gable('vhr', x, y, w + 0.3, 3.3, h, 1.1, roof));
      if (L >= 2) for (let i = 0; i < L; i++) { // Terrasse mit Sonnenschirmen
        const ux = x - w / 2 + 0.9 + i * 1.5;
        out.push(...cube(`vhp${i}`, ux, y + 2.5, 0.07, 0.07, 0.8, '#6b6f75'));
        out.push(...cube(`vhu${i}`, ux, y + 2.5, 0.95, 0.95, 0.07, i % 2 ? primary : '#f1ede2', undefined, 0.8));
      }
      break;
    }
    case 'fanZone':
      if (!L) { out.push(plot('fz', x, y, 8, 4.5)); break; }
      out.push(flat('fz', x, y, 8.4, 4.8, '#7d8a70'));
      out.push(...cube('fzf', x, y - 1.8, 3.9, 0.6, 0.45, '#3a414a'));
      out.push(...cube('fzs', x, y - 1.95, 3.6, 0.2, 2.1, '#1e2329', '#3a414a', 0.45));
      out.push(front('fzv', x, y - 1.85, 3.2, 0.7, 2.35, '#2c7fb0', 0.95));
      out.push(front('fzh', x, y - 1.85, 3.2, 1.7, 2.35, '#6fb7dd', 0.5));
      for (let i = 0; i < 4; i++) {
        out.push(...cube(`fzt${i}`, x - 3 + i * 2, y + 1.5, 1.1, 1.1, 0.85, i % 2 ? '#f1ede2' : '#e3dccd'));
        out.push(...gable(`fzr${i}`, x - 3 + i * 2, y + 1.5, 1.3, 1.3, 0.85, 0.45, i % 2 ? primary : '#f3f1ea'));
      }
      if (L >= 2) out.push(<polyline key="fzb" points={pts([[x - 4, y + 0.4, 1.9], [x - 2, y + 0.4, 1.5], [x, y + 0.4, 1.9], [x + 2, y + 0.4, 1.5], [x + 4, y + 0.4, 1.9]])} fill="none" stroke={primary} strokeWidth={1.4} strokeDasharray="3 2" />);
      break;
    case 'museum': {
      if (!L) { out.push(plot('mu', x, y, 5.5, 4.5)); break; }
      const w = 4.6 + L, h = 2.4 + L * 0.6;
      out.push(...cube('mu', x, y, w, 4, h, '#e0e3e5', '#8f98a1'));
      out.push(front('mug', x, y + 2, w * 0.5, 0, h * 0.72, GLASS, 0.9));
      for (let i = 0; i < 5; i++) out.push(front(`muc${i}`, x - w * 0.42 + (w * 0.84 * i) / 4, y + 2, 0.16, 0, h * 0.9, '#f4f5f6'));
      out.push(front('mub', x + w * 0.3, y + 2, 0.7, h * 0.3, h * 0.82, primary));
      out.push(front('mue', x, y + 2, 0.9, 0, 0.9, '#3c434b'));
      break;
    }
  }
  return <>{out}</>;
}

/** Tiefe eines Platzes (Zeichenreihenfolge). */
export const venueDepth = (v: Venue) => depth([v.x, v.y, 0]);
/** Beschriftungspunkt über dem Platz. */
export const venueLabelAt = (v: Venue): [number, number] => proj([v.x, v.y, 4.2] as V3);

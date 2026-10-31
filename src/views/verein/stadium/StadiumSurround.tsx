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
  tickets: [W / 2 + 1, D + RING + 1.2], catering: [-RING - 1.2, D / 2], merchandising: [W / 2 + 8, D + RING + 1.6],
  megastore: [W + RING - 3.5, D + RING - 4], parking: [W / 2 - 12, D + RING + 1.2], transit: [W + RING + 1.5, D / 2 + 2],
  hospitality: [-RING + 3, D + RING - 3.5], vereinsheim: [-RING + 3.5, -RING + 3.5], fanZone: [W / 2, -RING - 1.5], museum: [W + RING - 3.5, -RING + 3.5],
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

export function VenueShape({ v, era, primary }: { v: Venue; era: number; primary: string }): ReactNode {
  const out: ReactNode[] = [];
  const wall = era === 0 ? '#b9b3a8' : era === 1 ? '#c3c6c9' : '#d3d6da';
  const roof = era === 0 ? '#7d6f62' : '#5d646d';
  const { x, y, level: L } = v;
  switch (v.key) {
    case 'tickets':
      for (const dx of [-2.2, 2.2]) { out.push(...cube(`tk${dx}`, x + dx, y, 1.4, 1, 1.3, wall)); out.push(...gable(`tkr${dx}`, x + dx, y, 1.6, 1.2, 1.3, 0.45, primary)); }
      break;
    case 'catering': {
      const n = Math.max(1, L) + (L >= 4 ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const yy = y - ((n - 1) * 2.1) / 2 + i * 2.1;
        out.push(...cube(`cb${i}`, x, yy, 1.5, 1.4, 1.05, L >= 4 ? '#e7e9ec' : '#e3dccd'));
        out.push(...cube(`ca${i}`, x + 0.35, yy, 0.9, 1.6, 0.08, i % 2 ? primary : '#d8c25a', undefined, 1.05));
      }
      break;
    }
    case 'merchandising': {
      const w = 2.4 + L * 0.5, h = 1.2 + L * 0.25;
      out.push(...cube('fs', x, y, w, 2.2, h, wall));
      out.push(...cube('fsb', x, y + 1.12, w * 0.8, 0.05, 0.45, primary, undefined, h - 0.6));
      break;
    }
    case 'megastore':
      if (!L) { out.push(plot('ms', x, y, 6, 3.6)); break; }
      out.push(...cube('ms', x, y, 3.5 + L * 1.3, 3.2, 1.6 + L * 0.6, L >= 2 ? '#d6dade' : wall, '#9aa3ad'));
      out.push(...cube('msb', x, y + 1.62, 2.4 + L, 0.05, 0.55, primary, undefined, 0.9 + L * 0.5));
      break;
    case 'parking': {
      const w = 6 + L * 2.6, d = 5.5;
      if (!L) { out.push(flat('pk', x, y, 8, 5, '#8e8b84', 0.55)); out.push(plot('pkp', x, y, 8, 5)); break; }
      out.push(flat('pk', x, y, w, d, L === 1 ? '#9d968a' : '#5c6168'));
      if (L >= 2) for (let i = 0; i <= Math.floor(w / 1.2); i++) {
        const xx = x - w / 2 + i * 1.2;
        out.push(<polyline key={`pl${i}`} points={pts([[xx, y - d / 2 + 0.3, 0.03], [xx, y - 0.4, 0.03]])} stroke="#e8e8e8" strokeOpacity={0.55} strokeWidth={1} />);
      }
      for (let i = 0; i < Math.round(w * 1.1); i++) {
        if (hash(i * 3.7) < 0.35) continue;
        const cx = x - w / 2 + 0.6 + (i % Math.floor(w / 1.2)) * 1.2, cy = y - d / 2 + 0.9 + Math.floor(i / Math.floor(w / 1.2)) * 2.4;
        if (cy > y + d / 2 - 0.5) break;
        out.push(...cube(`car${i}`, cx, cy, 0.6, 1.1, 0.42, ['#a33a32', '#2f5d9a', '#d9d6cf', '#3b3f45', '#4b7a4a'][Math.floor(hash(i) * 5)]));
      }
      if (L >= 3) { out.push(...cube('ph', x + w / 2 - 2.2, y + 0.2, 4, 4.4, 1.6 * (L - 1), '#9ea4ab', '#7a8088')); }
      break;
    }
    case 'transit':
      if (!L) { out.push(plot('tr', x, y, 3, 6)); break; }
      out.push(flat('trp', x, y, 2.6, 7, '#9a9da1'));
      out.push(...cube('trs', x - 0.6, y, 0.9, 2.6, 1.1, '#cfd4d9', '#7e8790'));
      if (L >= 2) out.push(...cube('trb', x + 0.6, y + 0.6, 1.1, 3.6, 1.0, L >= 4 ? '#c8463c' : '#e0c050'));
      break;
    case 'hospitality':
      if (!L) { out.push(plot('hp', x, y, 6, 4)); break; }
      if (L === 1) { out.push(...cube('ht', x, y, 5, 3.4, 1.1, '#f1efea')); out.push(...gable('htr', x, y, 5.2, 3.6, 1.1, 1.0, '#f4f2ee')); break; }
      out.push(...cube('hb', x, y, 4 + L * 1.4, 3.6, 1.6 + L * 0.8, L >= 3 ? '#2d3238' : '#c7ccd1', L >= 3 ? '#4a525b' : undefined));
      out.push(...cube('hbg', x, y + 1.83, 3 + L * 1.4, 0.04, 0.5 + L * 0.5, '#9fd0e3', undefined, 0.5));
      break;
    case 'vereinsheim':
      if (!L) { out.push(plot('vh', x, y, 5, 4)); break; }
      out.push(...cube('vh', x, y, 3 + L, 3, 1.5 + L * 0.3, era === 0 ? '#c9b99c' : wall));
      out.push(...gable('vhr', x, y, 3.2 + L, 3.2, 1.5 + L * 0.3, 1.1, roof));
      break;
    case 'fanZone':
      if (!L) { out.push(plot('fz', x, y, 8, 4.5)); break; }
      out.push(flat('fz', x, y, 8, 4.5, '#6b7a62'));
      out.push(...cube('fzs', x, y - 1.8, 3.6, 0.2, 2.2, '#1e2329', '#3a414a', 0.4));
      for (let i = 0; i < 4; i++) out.push(...cube(`fzt${i}`, x - 3 + i * 2, y + 1.4, 1, 1, 0.9, i % 2 ? primary : '#e3dccd'));
      break;
    case 'museum':
      if (!L) { out.push(plot('mu', x, y, 5.5, 4.5)); break; }
      out.push(...cube('mu', x, y, 4.5 + L, 4, 2.4 + L * 0.6, '#d9dcdf', '#8f98a1'));
      out.push(...cube('mue', x, y + 2.02, 1.8, 0.04, 1.4, '#3c434b'));
      break;
  }
  return <>{out}</>;
}

/** Tiefe eines Platzes (Zeichenreihenfolge). */
export const venueDepth = (v: Venue) => depth([v.x, v.y, 0]);
/** Beschriftungspunkt über dem Platz. */
export const venueLabelAt = (v: Venue): [number, number] => proj([v.x, v.y, 4.2] as V3);

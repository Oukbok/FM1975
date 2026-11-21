// =============================================================================
// STADION-ZEICHNUNG (erhöhte Schrägansicht). Das Stadiongelände (PLOT) liegt fest
// außerhalb der größtmöglichen Tribünen (RING): beim Ausbau wachsen nur die
// Tribünen, alles andere bleibt, wo es ist. Die Szene ist größer als der Bild-
// ausschnitt – mit der linken Maustaste verschieben, mit dem Mausrad zoomen
// (ui/usePanZoom.ts). Zugekaufte Grundstücke erscheinen als eingezäunte Flächen.
// Rund ums Stadion: Buden, Fanshop, Parkplatz … (StadiumSurround), anklickbar.
// Vorplatz mit
// Bäumen, Rasen mit Mähstreifen und vollständigen Linien, Tore mit Netz,
// Werbebanden, Trainerbänke, Eckfahnen, weiche Schatten, vier Blöcke
// (StadiumBlockShape). Die Kamera schaut von
// erhöht hinter der Haupttribüne, deshalb bleibt das Feld frei; vordere
// Dächer sind durchscheinend. Rechenlogik: engine/stadiumBlocks.ts.
// =============================================================================
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BLOCK_NAME, blockCapacity } from '../../../engine/stadiumBlocks';
import { blockLook } from '../../../engine/stadiumStandard';
import { SPOT_BLOCK, type AdsKind, type BoardKind, type StadiumExtras } from '../../../engine/stadiumExtras';
import { PanZoomControls } from '../../../ui/PanZoomControls';
import { usePanZoom } from '../../../ui/usePanZoom';
import type { BlockId, StadiumBlock, StadiumTier } from '../../../types';
import { shade } from '../grounds/isoKit';
import { D, GAP, V3, W, depth, face, hash, hull, mapper, proj, pts, roofGeo, seg, shadowPt, tierGeometry } from './geo';
import { SceneColors, StadiumBlockShape, blockOutline, blockShadowPoints } from './StadiumBlockShape';
import { PLOT, RING, VENUE_SPOTS, Venue, VenueShape, parcelRects, venueDepth, venueLabelAt } from './StadiumSurround';
import { Tree, scenery } from './StadiumScenery';

export { tierGeometry } from './geo';
export type { SceneColors } from './StadiumBlockShape';

const UP: V3 = [0, 0, 1];
const pl = (ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const P0 = (x: number, y: number, z = 0.02) => proj([x, y, z]);

function Pitch({ grass, era, track, year }: { grass: string; era: number; track?: boolean; year: number }) {
  const out: ReactNode[] = [];
  out.push(<polygon key="sur" points={pts([[-GAP, -GAP, 0.01], [W + GAP, -GAP, 0.01], [W + GAP, D + GAP, 0.01], [-GAP, D + GAP, 0.01]])} fill={track ? (year < 1972 ? '#8b6f5a' : '#b5523d') : shade(grass, 0.86)} />);
  if (track) {
    // Laufbahn (Asche bis 1971, danach Kunststoff) mit Bahnlinien um das Feld
    for (const f of [0.3, 0.55, 0.8]) {
      const o = GAP * f;
      out.push(<polygon key={`tr${f}`} points={pts([[-o, -o, 0.012], [W + o, -o, 0.012], [W + o, D + o, 0.012], [-o, D + o, 0.012]])} fill="none" stroke="#f3eee8" strokeOpacity={0.55} strokeWidth={0.8} />);
    }
  }
  out.push(<polygon key="pf" points={pts([[0, 0, 0.015], [W, 0, 0.015], [W, D, 0.015], [0, D, 0.015]])} fill={grass} />);
  const n = 14;
  for (let i = 0; i < n; i += 2) out.push(<polygon key={`ms${i}`} points={pts([[(W / n) * i, 0, 0.016], [(W / n) * (i + 1), 0, 0.016], [(W / n) * (i + 1), D, 0.016], [(W / n) * i, D, 0.016]])} fill={shade(grass, 1.09)} />);
  // Quer gemähte Bahnen (Karomuster moderner Rasenpflege) und ein heller Lichtfleck
  if (era >= 1) for (let j = 0; j < 8; j += 2) out.push(<polygon key={`mq${j}`} points={pts([[0, (D / 8) * j, 0.017], [W, (D / 8) * j, 0.017], [W, (D / 8) * (j + 1), 0.017], [0, (D / 8) * (j + 1), 0.017]])} fill="#ffffff" opacity={0.045} />);
  { const [gx, gy] = P0(W * 0.36, D * 0.58); out.push(<ellipse key="gl" cx={gx} cy={gy} rx={170} ry={80} fill="url(#stSun)" pointerEvents="none" />); }
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

/** Videowürfel über dem Mittelkreis, an Seilen unter dem Dach. */
function Cube() {
  const cx = W / 2, cy = D / 2, h = 1.3, z0 = 5.6, z1 = z0 + 2;
  const c: V3[] = [[cx - h, cy - h, 0], [cx + h, cy - h, 0], [cx + h, cy + h, 0], [cx - h, cy + h, 0]];
  const at = (i: number, z: number): V3 => [c[i][0], c[i][1], z];
  const sides: [number, number, V3][] = [[0, 1, [0, -1, 0]], [1, 2, [1, 0, 0]], [2, 3, [0, 1, 0]], [3, 0, [-1, 0, 0]]];
  return (
    <g pointerEvents="none">
      {/* Schatten: Umriss des Würfels in Lichtrichtung auf den Rasen geworfen (wie bei den Tribünen) */}
      <polygon points={pl(hull([0, 1, 2, 3].flatMap((i) => [shadowPt(at(i, z0)), shadowPt(at(i, z1))])))} fill="#000" opacity={0.2} />
      {[0, 1, 2, 3].map((i) => seg(`cbl${i}`, at(i, z1), [c[i][0] + (c[i][0] - cx) * 4, c[i][1] + (c[i][1] - cy) * 4, z1 + 5], '#8a939c', 1.4))}
      {sides.map(([a, b, n]) => face(`cbf${a}`, [at(a, z0), at(b, z0), at(b, z1), at(a, z1)], n, '#1b2129', { stroke: '#4b5560', sw: 1 }))}
      {sides.map(([a, b, n]) => face(`cbs${a}`, [at(a, z0 + 0.25), at(b, z0 + 0.25), at(b, z1 - 0.25), at(a, z1 - 0.25)].map((v) => [v[0] + n[0] * 0.03, v[1] + n[1] * 0.03, v[2]] as V3), n, '#2a7fb0'))}
      {face('cbt', [at(0, z1), at(1, z1), at(2, z1), at(3, z1)], UP, '#2b3138')}
    </g>
  );
}

function Goal({ x, dir }: { x: number; dir: number }) {
  const y0 = D / 2 - 1.05, y1 = D / 2 + 1.05, h = 0.7, bx = x - dir * 0.6;
  return (
    <g>
      <polygon points={pts([[bx, y0, 0], [bx, y1, 0], [x, y1, h], [x, y0, h]])} fill="#ffffff" opacity={0.28} />
      <polygon points={pts([[bx, y0, 0], [x, y0, 0], [x, y0, h]])} fill="#ffffff" opacity={0.2} />
      <polygon points={pts([[bx, y1, 0], [x, y1, 0], [x, y1, h]])} fill="#ffffff" opacity={0.2} />
      <g stroke="#ffffff" strokeWidth={0.45} opacity={0.5}>
        {Array.from({ length: 7 }, (_, i) => { const yy = y0 + ((y1 - y0) * (i + 0.5)) / 7; return <polyline key={`n${i}`} points={pts([[bx, yy, 0], [x, yy, h]])} fill="none" />; })}
        {[0.35, 0.7].map((f) => <polyline key={`m${f}`} points={pts([[bx + (x - bx) * f, y0, h * f], [bx + (x - bx) * f, y1, h * f]])} fill="none" />)}
      </g>
      <polyline points={pts([[x, y0, 0], [x, y0, h], [x, y1, h], [x, y1, 0]])} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

const ADS_ERA: Record<AdsKind, number> = { holz: 0, druck: 1, prisma: 1, led: 2 };
function Boards({ era: eraIn, colors, ads }: { era: number; colors: SceneColors; ads?: AdsKind }) {
  const era = ads ? ADS_ERA[ads] : eraIn;
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

export interface StadiumSceneProps {
  blocks: StadiumBlock[];
  /** Baujahr des Stadions (Bauweise der Blöcke ohne eigenes `look`). */
  built?: number;
  /** Zuschauer: Auslastung 0…1 (0 = leeres Stadion). */
  crowd?: number;
  /** Neubau: Kräne an mehreren Seiten. */
  buildingAll?: boolean;
  /** Zugekaufte Grundstücke (Anzahl) – als eingezäunte Flächen am Gelände sichtbar. */
  land?: number;
  /** Meldet Verschieben/Zoomen (die Seite schließt dann ihr Popover). */
  onView?: () => void;
  colors: SceneColors;
  year: number;
  month: number;
  selected: BlockId | null;
  hover: BlockId | null;
  /** Blöcke im Bau (Kran); ein Bauprojekt kann mehrere Blöcke umfassen. */
  building?: BlockId | BlockId[] | null;
  /** Weitere Blöcke, die zur Planung gehören (ganze Seite). */
  group?: BlockId[];
  /** Geplante (noch nicht gebaute) Blöcke: als Vorschau gezeichnet. */
  ghost?: BlockId[];
  /** Tribünen anklickbar (sonst abgeblendet). */
  blocksActive?: boolean;
  /** Ausstattung: Anzeigetafeln, Videowürfel, Banden, Laufbahn (engine/stadiumExtras.ts). */
  extras?: StadiumExtras;
  venues?: Venue[];
  /** Aktive Plätze (sonst abgeblendet). */
  venueActive?: (v: Venue) => boolean;
  selectedVenue?: string | null;
  onVenue?: (v: Venue, e: { clientX: number; clientY: number }) => void;
  onSelect: (id: BlockId | null, e?: { clientX: number; clientY: number }) => void;
  onHover: (id: BlockId | null) => void;
}

/** Größtmögliches Stadion (3 Ränge × 36 Reihen, volles Dach, Anzeigetafel) – Bezug für den festen Bildausschnitt. */
const MAX_TIERS: StadiumTier[] = [{ seat: 'schale', rows: 36 }, { seat: 'schale', rows: 36 }, { seat: 'schale', rows: 36 }];
let FRAME: { x0: number; y0: number; w: number; h: number } | null = null;
function fixedFrame(): { x0: number; y0: number; w: number; h: number } {
  if (FRAME) return FRAME;
  const ids: BlockId[] = ['main_n', 'main_m', 'main_s', 'opp_n', 'opp_m', 'opp_s', 'north_w', 'north_e', 'south_w', 'south_e', 'curve_nw', 'curve_ne', 'curve_sw', 'curve_se'];
  const bx: [number, number][] = [];
  for (const id of ids) {
    const b: StadiumBlock = { id, tiers: MAX_TIERS, roof: 'full', vip: true, lounges: 6, scoreboard: true };
    const { len, at } = mapper(b);
    const geo = tierGeometry(b), l = geo[geo.length - 1], rg = roofGeo(b)!;
    for (const u of [0, len]) for (const v of [0, l.v1 + 0.3]) for (const z of [0, rg.zF + 2.8]) bx.push(proj(at(u, v, z)));
  }
  // Stadionring: Startausschnitt zeigt das größtmögliche Stadion und die nahen Gebäude.
  const R = RING + 9;
  for (const [x, y] of [[-R, D / 2], [W + R, D / 2], [W / 2, -R], [W / 2, D + R], ...Object.values(VENUE_SPOTS)]) { bx.push(proj([x - 3, y - 2, 0])); bx.push(proj([x + 3, y + 2, 0])); bx.push(proj([x, y, 5.5])); }
  const x0 = Math.min(...bx.map((p) => p[0])) - 10, x1 = Math.max(...bx.map((p) => p[0])) + 10;
  const y0 = Math.min(...bx.map((p) => p[1])) - 10, y1 = Math.max(...bx.map((p) => p[1])) + 6;
  FRAME = { x0, y0, w: x1 - x0, h: y1 - y0 };
  return FRAME;
}
const evPt = (e: { clientX: number; clientY: number }) => ({ clientX: e.clientX, clientY: e.clientY });

export function StadiumScene(p: StadiumSceneProps) {
  const { blocks, colors, year, month, selected, hover, building, group, onSelect, onHover } = p;
  const era = year < 1990 ? 0 : year < 2010 ? 1 : 2;
  const winter = month === 12 || month <= 2;
  const grass = winter && year < 1995 ? '#8fa88a' : era === 0 ? '#4f9545' : '#4a9a43';
  const by = Object.fromEntries(blocks.map((b) => [b.id, b])) as Record<BlockId, StadiumBlock>;
  const { x0, y0, w: fw, h: fh } = fixedFrame();
  const [cx, cy] = proj([W / 2, D / 2, 0]);
  const R = PLOT; // Stadiongelände: fester Rand, dahinter Rasen bis über den Bildrand
  const LR = RING + 320;
  const land = Math.max(0, p.land ?? 0);
  const parcels = parcelRects(land);
  // Verschieben/Zoomen: die Bildmitte bleibt im Gelände samt zugekauften Flächen
  const corners = ([[-R - 24, -R - 16], [W + R + 16, -R - 16], [W + R + 16, D + R + 24 + (land > 6 ? 15 : 0)], [-R - 24, D + R + 24 + (land > 6 ? 15 : 0)]] as [number, number][]).map(([x, y]) => proj([x, y, 0]));
  const bx0 = Math.min(...corners.map((c) => c[0])), bx1 = Math.max(...corners.map((c) => c[0])), by0 = Math.min(...corners.map((c) => c[1])), by1 = Math.max(...corners.map((c) => c[1]));
  const pz = usePanZoom({ base: { x: x0, y: y0, w: fw, h: fh }, bounds: { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 }, minZoom: 0.55, maxZoom: 2.6 });
  const viewKey = pz.viewBox;
  const firstView = useRef(viewKey);
  useEffect(() => { if (firstView.current !== viewKey) { firstView.current = viewKey; p.onView?.(); } }, [viewKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const lawn: V3[] = [[-LR, -LR, 0], [W + LR, -LR, 0], [W + LR, D + LR, 0], [-LR, D + LR, 0]];
  const plaza: V3[] = [[-R, -R, 0], [W + R, -R, 0], [W + R, D + R, 0], [-R, D + R, 0]];
  const sc = scenery({ winter, era, primary: colors.primary, secondary: colors.secondary, crowd: p.crowd ?? 0, land });
  const trees: { x: number; y: number; k: number }[] = [];
  const T = PLOT + 1.6;
  let k = 0;
  for (let t = -T; t <= W + T; t += 3.1) { trees.push({ x: t, y: -T, k: k++ }); trees.push({ x: t, y: D + T, k: k++ }); }
  for (let t = -T + 3.1; t < D + T; t += 3.1) { trees.push({ x: -T, y: t, k: k++ }); trees.push({ x: W + T, y: t, k: k++ }); }
  const inParcel = (x: number, y: number) => parcels.some(([a0, b0, a1, b1]) => x > a0 - 1.5 && x < a1 + 1.5 && y > b0 - 1.5 && y < b1 + 1.5);
  const treeNodes = trees.filter((t) => hash(t.k * 1.7) > 0.25 && !inParcel(t.x, t.y)).map((t) => ({ d: depth([t.x, t.y, 0]), n: <Tree key={`t${t.k}`} x={t.x + (hash(t.k) - 0.5)} y={t.y + (hash(t.k + 9) - 0.5)} winter={winter} k={t.k} /> }));
  const blocksActive = p.blocksActive !== false;
  const ghost = new Set(p.ghost ?? []);
  const inBuild = new Set(Array.isArray(building) ? building : building ? [building] : []);

  // Anzeigetafeln nach Ausstattung: je Ort ein Block (SPOT_BLOCK), Würfel über dem Mittelkreis
  const ex = p.extras;
  const boardBlocks = new Set(ex && ex.board !== 'none' && ex.board !== 'cube' ? ex.spots.filter((s2) => s2 !== 'center').map((s2) => SPOT_BLOCK[s2 as keyof typeof SPOT_BLOCK]) : []);
  const boardOn = (id: BlockId): BoardKind | 'none' | undefined => (!ex ? undefined : boardBlocks.has(id) ? (ex.board as BoardKind) : 'none');
  // Blöcke, Plätze und Masten nach Kameratiefe
  const items: { d: number; n: ReactNode }[] = [];
  if (ex?.board === 'cube') items.push({ d: depth([W / 2, D / 2, 0]), n: <Cube key="cube" /> });
  for (const b of blocks) {
    const id = b.id;
    const { len, at } = mapper(b);
    const geo = tierGeometry(b);
    const inSel = selected === id || !!group?.includes(id);
    const on = inSel || hover === id;
    const dim = !blocksActive ? 0.55 : selected && !on ? 0.82 : 1;
    // Reihenfolge nach der Innenkante (am Spielfeld), nicht nach der Blockmitte: sonst rückt ein tiefer Block
    // rechnerisch näher an die Kamera und verdeckt die kleinere Nachbarkurve, die tatsächlich davor steht.
    void geo;
    items.push({ d: depth(at(len / 2, 0, 0)), n: (
      <g key={id} data-block={id} className={`gr-obj blk ${inSel ? 'sel' : ''} ${ghost.has(id) ? 'sv-ghost' : ''}`} opacity={dim} pointerEvents={blocksActive ? undefined : 'none'}
        onClick={(e) => { e.stopPropagation(); onSelect(id, evPt(e)); }} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)}>
        <StadiumBlockShape b={b} colors={colors} look={blockLook(b, { built: p.built })} year={year} others={blocks} crowd={p.crowd ?? 0} board={boardOn(id)} />
        {/* Hervorhebung als Umriss statt CSS-Filter: ein Filter auf der Gruppe ließ andere Blöcke beim
            Überfahren flackern (Wunsch Pascal). */}
        {on && blocksActive && <g className={inSel ? 'blk-sel' : 'blk-hov'} pointerEvents="none">{blockOutline(b).map((d, k) => <polyline key={k} points={d} />)}</g>}
        {ghost.has(id) && <g className="sv-ghost-line" pointerEvents="none">{blockOutline(b).map((d, k) => <polyline key={k} points={d} fill="none" strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" />)}</g>}
        {inBuild.has(id) && (() => {
          const [x, yb] = proj(at(len * 0.8, 3, 0)), [, yt] = proj(at(len * 0.8, 3, 15));
          return <g stroke="#e0a23a" strokeWidth={3} fill="none" strokeLinecap="round"><line x1={x} y1={yb} x2={x} y2={yt} /><line x1={x - 50} y1={yt + 8} x2={x + 95} y2={yt - 6} /><line x1={x + 80} y1={yt - 5} x2={x + 80} y2={yt + 50} strokeWidth={1} stroke="#cfd5db" /></g>;
        })()}
      </g>
    ) });
  }
  for (const v of p.venues ?? []) {
    const active = p.venueActive ? p.venueActive(v) : true;
    const sel = p.selectedVenue === v.key;
    items.push({ d: venueDepth(v), n: (
      <g key={`v${v.key}`} data-venue={v.key} className={`gr-obj sv-venue ${sel ? 'sel' : ''}`} opacity={active ? 1 : 0.4} pointerEvents={active ? undefined : 'none'}
        onClick={(e) => { e.stopPropagation(); p.onVenue?.(v, evPt(e)); }}>
        <VenueShape v={v} era={era} primary={colors.primary} />
      </g>
    ) });
  }
  items.push(...sc.items);
  if (p.buildingAll) for (const [bx2, by2] of [[W * 0.15, -RING + 1], [W + RING - 1, D * 0.3], [-RING + 1, D * 0.75]] as [number, number][]) {
    const [x, yb] = proj([bx2, by2, 0]), [, yt] = proj([bx2, by2, 16]);
    items.push({ d: depth([bx2, by2, 0]), n: <g key={`cr${bx2}`} stroke="#e0a23a" strokeWidth={3} fill="none" strokeLinecap="round" pointerEvents="none"><line x1={x} y1={yb} x2={x} y2={yt} /><line x1={x - 50} y1={yt + 8} x2={x + 95} y2={yt - 6} /><line x1={x + 80} y1={yt - 5} x2={x + 80} y2={yt + 50} strokeWidth={1} stroke="#cfd5db" /></g> });
  }
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
        <rect x={x - text.length * 3.9 - 10} y={y - 28} width={text.length * 7.8 + 20} height={24} rx={6} fill="rgba(16,19,24,0.92)" stroke="rgba(255,255,255,0.18)" />
        <text x={x} y={y - 11} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{text}</text>
      </g>
    );
  };

  return (<>
    <svg ref={pz.svgRef} className={`gr-svg pz-svg${pz.dragging ? ' dragging' : ''}`} viewBox={pz.viewBox} preserveAspectRatio="xMidYMid meet" {...pz.bind}
      onClick={(e) => { if ((e.target as Element).tagName === 'svg' || (e.target as Element).classList?.contains('sv-ground')) onSelect(null); }}>
      <defs>
        <radialGradient id="stGround" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={winter ? '#c3cdc8' : '#5f8a4e'} stopOpacity={0.75} />
          <stop offset="0.7" stopColor={winter ? '#b2bdb8' : '#4e7742'} stopOpacity={0.45} />
          <stop offset="1" stopColor={winter ? '#b2bdb8' : '#4e7742'} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="stSun"><stop offset="0" stopColor="#fffbe0" stopOpacity={0.16} /><stop offset="1" stopColor="#fffbe0" stopOpacity={0} /></radialGradient>
        <linearGradient id="stWarm" x1="0.3" y1="0.3" x2="0.62" y2="0.62"><stop offset="0" stopColor="#ffe9b8" stopOpacity={winter ? 0.04 : 0.12} /><stop offset="1" stopColor="#ffe9b8" stopOpacity={0} /></linearGradient>
        <filter id="stBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <polygon className="sv-ground" points={pts(lawn)} fill={winter ? '#b4beb8' : era === 0 ? '#5d7a52' : '#5f8255'} />
      <ellipse className="sv-ground" cx={cx} cy={cy} rx={fw * 0.62} ry={fh * 0.62} fill="url(#stGround)" />
      <polygon className="sv-ground" points={pts(plaza)} fill={winter ? '#cfd1ce' : era === 0 ? '#a9a59c' : '#b3b2ad'} stroke={shade(winter ? '#c9cbc8' : '#aaa9a5', 0.8)} strokeWidth={2} strokeLinejoin="round" />
      {Array.from({ length: 11 }, (_, i) => {
        const f = (i + 1) / 12;
        return <g key={`pv${i}`} stroke="#000" strokeOpacity={0.05} strokeWidth={1} pointerEvents="none">
          <polyline points={pl([proj([-R + (W + 2 * R) * f, -R, 0]), proj([-R + (W + 2 * R) * f, D + R, 0])])} />
          <polyline points={pl([proj([-R, -R + (D + 2 * R) * f, 0]), proj([W + R, -R + (D + 2 * R) * f, 0])])} />
        </g>;
      })}
      <g className="sv-ground-art" pointerEvents="none">{sc.under}</g>
      {treeNodes.filter((t) => t.d < dMid).sort((a, b) => a.d - b.d).map((t) => t.n)}
      <Pitch grass={grass} era={era} track={p.extras?.track} year={year} />
      <g filter="url(#stBlur)" opacity={0.3}>
        {blocks.map((b) => <polygon key={`sh${b.id}`} points={pl(hull(blockShadowPoints(b)))} fill="#000" />)}
      </g>
      <Goal x={0} dir={1} />
      <Goal x={W} dir={-1} />
      <Boards era={era} colors={colors} ads={p.extras?.ads} />
      {[[0, 0], [W, 0], [W, D], [0, D]].map(([x, y]) => (
        <g key={`cf${x}${y}`}>{seg(`cfp${x}${y}`, [x, y, 0], [x, y, 0.55], '#f2f2f2', 1.2)}<polygon points={pts([[x, y, 0.55], [x, y, 0.4], [x + (x ? -0.35 : 0.35), y, 0.48]])} fill={era === 0 ? '#e8c547' : colors.primary} /></g>
      ))}
      {items.map((it) => it.n)}
      {treeNodes.filter((t) => t.d >= dMid).sort((a, b) => a.d - b.d).map((t) => t.n)}
      {/* Licht und Randabdunkelung über die ganze Fläche (das Bild ist breiter als der feste Ausschnitt) */}
      <rect x={x0 - fw * 2.5} y={y0 - fh * 2} width={fw * 6} height={fh * 5} fill="url(#stWarm)" pointerEvents="none" />
      {(p.venues ?? []).filter((v) => p.selectedVenue === v.key || (p.venueActive ? p.venueActive(v) : true)).map((v) => <VenueTag key={`vt${v.key}`} v={v} strong={p.selectedVenue === v.key} />)}
      {(hover ?? selected) && by[(hover ?? selected)!] && label((hover ?? selected)!)}
    </svg>
    <PanZoomControls pz={pz} hint />
  </>);
}

function VenueTag({ v, strong }: { v: Venue; strong: boolean }) {
  const [x, y] = venueLabelAt(v);
  const lv = v.kind === 'tickets' ? '' : v.level ? ` · ${v.level}/${v.max}` : ' · frei';
  const text = `${v.name}${lv}`;
  const w = text.length * 8.4 + 18;
  return (
    <g pointerEvents="none" opacity={strong ? 1 : 0.86}>
      <rect x={x - w / 2} y={y - 25} width={w} height={25} rx={6} fill="rgba(16,19,24,0.86)" stroke={strong ? '#F2A541' : 'rgba(255,255,255,0.14)'} />
      <text x={x} y={y - 7.5} textAnchor="middle" fill={v.level || v.kind === 'tickets' ? '#f1f4f8' : '#b3bcc8'} fontSize={15} fontWeight={600}>{text}</text>
    </g>
  );
}

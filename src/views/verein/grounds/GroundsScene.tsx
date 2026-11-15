// =============================================================================
// VEREINSGELÄNDE — gezeichnete Anlage, die mit Ausbau und Epoche wächst
// -----------------------------------------------------------------------------
// Oben das Stadionviertel (Stadion, Buden, Fanshop, Umfeld aus SurroundLayer),
// südlich der Stadionstraße der Campus in Quartieren mit festen Modul-Plätzen
// (CampusLots.tsx). Die Szene ist größer als der Ausschnitt: linke Maustaste
// verschiebt, Mausrad zoomt (ui/usePanZoom.ts). Jahreszeit: Schnee im Winter,
// Herbstfarben im Herbst. Laufendes Stadion-Bauprojekt: Kran.
// =============================================================================
import type { ReactNode } from 'react';
import { BlockSide, Club, FacilityKey } from '../../../types';
import { BLOCK_SIDE } from '../../../engine/stadiumBlocks';
import { tierGeometry } from '../stadium/StadiumScene';
import { Box, Crane, Flat, P, Pitch, Track, Tree, WindowsFront, pts, shade } from './isoKit';
import type { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { SURROUND_ZONES, drawSurroundings } from './SurroundLayer';
import { campusSouth, drawCampus } from './CampusLots';
import { PanZoomControls } from '../../../ui/PanZoomControls';
import { usePanZoom } from '../../../ui/usePanZoom';

export type GroundKey = FacilityKey | 'clubhouse' | GroundsModuleKey;

export interface SceneProps {
  club: Club;
  year: number;
  month: number;
  /** Freigeschaltete Einrichtungen (Schlüssel). */
  unlocked: Set<FacilityKey>;
  selected: GroundKey | null;
  hover: GroundKey | null;
  onSelect: (k: GroundKey) => void;
  onHover: (k: GroundKey | null) => void;
  labels: Record<GroundKey, string>;
}

interface Obj { key: string; depth: number; node: ReactNode }

function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function palette(year: number) {
  if (year < 1990) return { wall: '#9b5a43', roof: '#5b5f66', win: '#f1d9a0', concrete: '#8f949b', era: 0 };
  if (year < 2010) return { wall: '#c8c0b2', roof: '#717a84', win: '#cfe6f2', concrete: '#9aa1a8', era: 1 };
  return { wall: '#e3e6ea', roof: '#56606b', win: '#8fc2dc', concrete: '#a7aeb5', era: 2 };
}

export function GroundsScene(props: SceneProps) {
  const { club, year, month, unlocked, selected, hover, onSelect, onHover, labels } = props;
  const inf = club.infrastructure;
  const pal = palette(year);
  const winter = month === 12 || month <= 2;
  const autumn = month >= 10 && month <= 11;
  const grass = winter ? '#d8e0dd' : autumn ? '#77924a' : month >= 6 && month <= 8 ? '#6aa84f' : '#5f9e4a';
  const pitchGrass = winter && year < 1995 ? '#cfd9d2' : '#4f9a45';
  const lum = (hex: string) => { const n = parseInt((hex || '#888888').slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
  // Vereinsfarbe für Sitze/Fahnen – zu dunkle Farben durch die Zweitfarbe ersetzen.
  const primary = lum(club.colors?.primary ?? '') < 0.18 ? (club.colors?.secondary ?? '#c0392b') : (club.colors?.primary ?? '#c0392b');
  const objs: Obj[] = [];
  const labelled = new Set<string>();
  const lvl = (k: FacilityKey) => (inf[k] as number) ?? 1;

  // Interaktive Gruppe mit Hervorhebung.
  const G = (k: GroundKey, depth: number, node: ReactNode, label: [number, number, number]) => {
    // Mehrteilige Einrichtungen (Plätze, Kabinen, Halle …): nur ein Schild je Einrichtung.
    const on = (selected === k || hover === k) && !labelled.has(k);
    labelled.add(k);
    const [lx, ly] = P(label[0], label[1], label[2]);
    objs.push({
      key: k, depth,
      node: (
        <g key={k} className={`gr-obj ${selected === k ? 'sel' : ''}`} onClick={() => onSelect(k)} onMouseEnter={() => onHover(k)} onMouseLeave={() => onHover(null)}>
          {node}
          {on && (
            <g className="gr-label" pointerEvents="none">
              <rect x={lx - (labels[k] ?? '').length * 3.6 - 8} y={ly - 26} width={(labels[k] ?? '').length * 7.2 + 16} height={22} rx={6} fill="rgba(10,16,24,0.88)" stroke="#F2A541" />
              <text x={lx} y={ly - 11} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={800}>{labels[k]}</text>
            </g>
          )}
        </g>
      ),
    });
  };
  const plain = (key: string, depth: number, node: ReactNode) => objs.push({ key, depth, node });

  // ---------------------------------------------------------------- Stadion
  let mastPos: [number, number][] = [];
  let mastH = 8;
  const L = lvl('stadium');
  // Eigener Verein mit Blöcken (engine/stadiumBlocks.ts): Höhe/Dach je Seite aus den Rängen.
  const bl = club.stadium.blocks;
  const sideOf = (side: BlockSide) => bl?.filter((b) => BLOCK_SIDE[b.id] === side) ?? [];
  const blk = (side: BlockSide) => sideOf(side).sort((a, b) => tierGeometry(b)[b.tiers.length - 1].zt - tierGeometry(a)[a.tiers.length - 1].zt)[0];
  const arena = bl ? bl.every((b) => b.roof === 'full') : (year >= 2000 && L >= 4) || (year >= 2006 && L >= 3);
  const classicTrack = !arena && year < 1995 && (bl ? bl.every((b) => b.tiers.length === 1) : L <= 3);
  const sh = 0.9 + L * 0.45;
  const hOf = (id: BlockSide, def: number) => { const b = blk(id); if (!b) return def; const geo = tierGeometry(b); return 0.8 + geo[geo.length - 1].zt * 0.22; };
  const roofOf = (id: BlockSide) => blk(id)?.roof ?? 'none';
  const has = (id: BlockSide, def: boolean) => (bl ? !!blk(id) : def);
  const seat = pal.era >= 1 || L >= 3 ? shade(primary, 0.9) : pal.concrete;
  const stand = (x: number, y: number, w: number, d: number, h: number) => (
    <g>
      <Box x={x} y={y} w={w} d={d} h={h * 0.55} color={pal.concrete} top={seat} />
      <Box x={x + (d > w ? 0 : 0)} y={y} w={d > w ? w * 0.55 : w} d={d > w ? d : d * 0.55} h={h} color={pal.concrete} top={shade(seat, 1.1)} />
    </g>
  );
  {
    const off = arena ? 0.6 : classicTrack ? 2 : 1.1;
    const px = 6, py = 4, pw = 16, pd = 10;
    const node = (
      <g>
        {classicTrack && <Track x={px - 1.6} y={py - 1.6} w={pw + 3.2} d={pd + 3.2} />}
        {!classicTrack && <Flat x={px - off + 0.2} y={py - off + 0.2} w={pw + 2 * off - 0.4} d={pd + 2 * off - 0.4} fill={shade(pitchGrass, 0.85)} />}
        <Pitch x={px} y={py} w={pw} d={pd} grass={year >= 1995 || !winter ? '#4f9a45' : pitchGrass} />
        {/* Gegengerade (hinten) */}
        {stand(px - off, py - off - 2.4, pw + 2 * off, 2.4, hOf('opposite', sh))}
        {!arena && roofOf('opposite') !== 'none' && <Box x={px - off} y={py - off - 2.6} w={pw + 2 * off} d={roofOf('opposite') === 'full' ? 2.8 : 1.4} z={hOf('opposite', sh) + 0.4} h={0.15} color="#c9d0d6" />}
        {/* Kurven links/rechts */}
        {has('north', L >= 2) && stand(px - off - 2.4, py - off, 2.4, pd + 2 * off, hOf('north', sh * (arena ? 1 : 0.85)))}
        {has('south', L >= 3) && stand(px + pw + off, py - off, 2.4, pd + 2 * off, hOf('south', sh * (arena ? 1 : 0.85)))}
        {arena && <polygon points={pts(P(px - off - 2.6, py - off - 2.6, sh + 0.9), P(px + pw + off + 2.6, py - off - 2.6, sh + 0.9), P(px + pw + off + 2.6, py + pd + off + 2.2, sh + 0.9), P(px - off - 2.6, py + pd + off + 2.2, sh + 0.9), P(px - off - 2.6, py - off - 2.6, sh + 0.9), P(px - off + 0.8, py - off + 0.8, sh + 0.9), P(px - off + 0.8, py + pd + off - 0.8, sh + 0.9), P(px + pw + off - 0.8, py + pd + off - 0.8, sh + 0.9), P(px + pw + off - 0.8, py - off + 0.8, sh + 0.9), P(px - off + 0.8, py - off + 0.8, sh + 0.9))}
          fill="rgba(210,225,235,0.42)" stroke="#dfe7ee" strokeWidth={1} fillRule="evenodd" />}
      </g>
    );
    G('stadium', 30, node, [px + pw / 2, py - 2, sh + 2.5]);
    // Haupttribüne vorne (niedriger, verdeckt den Platz nicht ganz) – eigener Tiefenwert.
    if (bl ? blk('main')!.tiers.length >= 2 || arena : L >= 4 || arena) {
      G('stadium', 40, <g>{stand(px - off, py + pd + off, pw + 2 * off, 2.2, bl ? hOf('main', sh) * 0.7 : sh * 0.7)}</g>, [px + pw / 2, py - 2, sh + 2.5]);
    }
    // Flutlicht und Umfeld (SurroundLayer.tsx): Masten an den Ecken, bei der Arena auf dem Dach.
    const mo = arena ? 2.2 : 2.8;
    mastPos = [[px - off - mo, py - off - mo], [px + pw + off + mo, py - off - mo], [px - off - mo, py + pd + off + mo], [px + pw + off + mo, py + pd + off + mo]];
    mastH = arena ? sh + 1.4 : sh + 6;
    if (club.stadiumProject || club.stadium.blockProject) plain('crane', 42, <Crane x={px + pw + off + 4} y={py + pd + 2} h={sh + 8} />);
  }

  // ---------------------------------------------------------------- Buden & Fanshop
  {
    const n = lvl('catering');
    const booths: ReactNode[] = [];
    for (let i = 0; i < n + 1; i++) {
      const x = 6 + i * 3;
      booths.push(<g key={i}>
        <Box x={x} y={18.2} w={1.6} d={1.2} h={1} color="#b8a37c" />
        <Box x={x - 0.2} y={18.0} w={2} d={1.6} h={0.15} z={1.05} color={i % 2 ? '#d64541' : '#f1f1f1'} />
      </g>);
    }
    G('catering', 18 + 7 + n * 3, <g>{booths}</g>, [7 + n * 1.5, 18.5, 2.5]);
    const m = lvl('merchandising');
    const mw = 1.6 + m * 0.6;
    G('merchandising', 25 + mw + 19, (
      <g>
        <Box x={25} y={17.5} w={mw} d={1.8} h={1.2 + m * 0.15} color={pal.era === 2 ? '#e8ecef' : pal.wall} />
        <Box x={24.8} y={17.3} w={mw + 0.4} d={0.5} h={0.25} z={1.2 + m * 0.15} color={primary} />
        <WindowsFront x={25} w={mw} yf={19.3} z0={0.3} rows={1} color="#ffe9a8" step={1.2} />
      </g>
    ), [25 + mw / 2, 18, 3.4]);
  }

  // ---------------------------------------------------------------- Campus (Quartiere mit Modul-Plätzen)
  const gr: ClubGrounds = club.grounds ?? { location: 'stadtteil', area: 0, landBought: 0, modules: {}, projects: [], attApplied: 0, log: [] };
  const campus = drawCampus({ lvl, unlocked, year, winter, autumn, grass, pal, primary, reputation: club.reputation ?? 60, landBought: gr.landBought, G: (k, d, n, l) => G(k, d, n, l), plain });
  const south = campusSouth(gr.landBought);

  // ---------------------------------------------------------------- Stadionumfeld
  drawSurroundings({ gr, year, winter, pal, primary, reputation: club.reputation ?? 60, mastPos, mastH, south, G: (k, d, n, l) => G(k, d, n, l), plain });

  // ---------------------------------------------------------------- Bäume
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 44; i++) {
    const t = hash(i * 3.1);
    const edge = i % 4;
    const [x, y] = edge === 0 ? [-6 + t * 56, -9.6] : edge === 1 ? [-10.4, -6 + t * (south + 4)] : edge === 2 ? [-3 + t * 52, south + 1.2 + hash(i) * 1.5] : [53.2 + hash(i + 3) * 2.5, 21 + t * (south - 21)];
    trees.push([x, y, 0.8 + hash(i + 9) * 0.5]);
  }
  for (let i = 0; i < 9; i++) trees.push([47.6 + hash(i * 2.3) * 4.4, 33 + i * ((south - 34) / 9) + hash(i) * 1.2, 0.75 + hash(i + 5) * 0.4]);
  for (let i = 0; i < 6; i++) trees.push([-3.4 + hash(i * 5.1) * 5.6, 37 + i * ((south - 38) / 6), 0.75 + hash(i + 2) * 0.4]);
  const free = ([x, y]: [number, number, number]) => !SURROUND_ZONES.some(([zx, zy, zw, zd]) => x > zx - 0.8 && x < zx + zw + 0.8 && y > zy - 0.8 && y < zy + zd + 0.8);
  trees.filter(free).forEach(([x, y, s], i) => plain(`tree${i}`, x + y + 0.5, <Tree x={x} y={y} s={s} snow={winter} color={autumn && i % 3 === 0 ? '#c9822c' : i % 2 ? '#3f7a3a' : '#4b8a40'} />));

  objs.sort((a, b) => a.depth - b.depth);

  // Verschieben & Zoomen (ui/usePanZoom.ts): Start = Stadion und Trainingszentrum, der Rest liegt weiter südlich
  const c0 = P(-12, -12), c1 = P(58, -12), c2 = P(58, south + 6), c3 = P(-12, south + 6);
  const bx0 = Math.min(c0[0], c3[0]), bx1 = Math.max(c1[0], c2[0]), by0 = c0[1], by1 = c2[1];
  const pz = usePanZoom({ base: { x: -150, y: -70, w: 1500, h: 980 }, bounds: { x: bx0 + 300, y: by0 + 200, w: bx1 - bx0 - 600, h: by1 - by0 - 400 }, minZoom: 0.6, maxZoom: 2.8 });

  return (<>
    <svg ref={pz.svgRef} className={`gr-svg pz-svg${pz.dragging ? ' dragging' : ''}`} viewBox={pz.viewBox} preserveAspectRatio="xMidYMid meet" {...pz.bind}>
      <Flat x={-140} y={-140} w={330} d={south + 290} fill={winter ? '#cdd6d2' : shade(grass, 0.82)} />
      <Flat x={-12} y={-12} w={70} d={south + 18} fill={grass} stroke={winter ? '#b3beb8' : shade(grass, 0.7)} />
      {campus.base}
      {objs.map((o) => <g key={o.key + o.depth}>{o.node}</g>)}
      {campus.signs}
    </svg>
    <PanZoomControls pz={pz} />
  </>);
}

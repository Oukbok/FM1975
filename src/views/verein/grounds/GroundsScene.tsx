// =============================================================================
// VEREINSGELÄNDE — gezeichnete Anlage, die mit Ausbau und Epoche wächst
// -----------------------------------------------------------------------------
// Stadion (Laufbahn → reines Fußballstadion → Arena mit Dach), Trainingsplätze
// (Rasen, später Kunstrasen, Halle), Jugendbereich, Geschäftsstelle, Medizin,
// Fanshop, Buden, Parkplatz. Einrichtungen späterer Epochen erscheinen erst,
// wenn sie freigeschaltet sind (zuerst als Bauplatz). Jahreszeit: Schnee im
// Winter, Herbstfarben im Herbst. Laufendes Stadion-Bauprojekt: Kran.
// =============================================================================
import type { ReactNode } from 'react';
import { Club, FacilityKey } from '../../../types';
import { Box, Car, Crane, Flat, Floodlight, GableRoof, P, Pitch, Track, Tree, WindowsFront, WindowsSide, pts, shade } from './isoKit';

export type GroundKey = FacilityKey | 'clubhouse';

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
  const lvl = (k: FacilityKey) => (inf[k] as number) ?? 1;

  // Interaktive Gruppe mit Hervorhebung.
  const G = (k: GroundKey, depth: number, node: ReactNode, label: [number, number, number]) => {
    const on = selected === k || hover === k;
    const [lx, ly] = P(label[0], label[1], label[2]);
    objs.push({
      key: k, depth,
      node: (
        <g key={k} className={`gr-obj ${selected === k ? 'sel' : ''}`} onClick={() => onSelect(k)} onMouseEnter={() => onHover(k)} onMouseLeave={() => onHover(null)}>
          {node}
          {on && (
            <g className="gr-label" pointerEvents="none">
              <rect x={lx - labels[k].length * 3.6 - 8} y={ly - 26} width={labels[k].length * 7.2 + 16} height={22} rx={6} fill="rgba(10,16,24,0.88)" stroke="#00D9FF" />
              <text x={lx} y={ly - 11} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={800}>{labels[k]}</text>
            </g>
          )}
        </g>
      ),
    });
  };
  const plain = (key: string, depth: number, node: ReactNode) => objs.push({ key, depth, node });

  // ---------------------------------------------------------------- Stadion
  const L = lvl('stadium');
  const arena = (year >= 2000 && L >= 4) || (year >= 2006 && L >= 3);
  const classicTrack = !arena && year < 1995 && L <= 3;
  const sh = 0.9 + L * 0.45;
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
        {stand(px - off, py - off - 2.4, pw + 2 * off, 2.4, sh)}
        {/* Kurven links/rechts */}
        {L >= 2 && stand(px - off - 2.4, py - off, 2.4, pd + 2 * off, sh * (arena ? 1 : 0.85))}
        {L >= 3 && stand(px + pw + off, py - off, 2.4, pd + 2 * off, sh * (arena ? 1 : 0.85))}
        {arena && <polygon points={pts(P(px - off - 2.6, py - off - 2.6, sh + 0.9), P(px + pw + off + 2.6, py - off - 2.6, sh + 0.9), P(px + pw + off + 2.6, py + pd + off + 2.2, sh + 0.9), P(px - off - 2.6, py + pd + off + 2.2, sh + 0.9), P(px - off - 2.6, py - off - 2.6, sh + 0.9), P(px - off + 0.8, py - off + 0.8, sh + 0.9), P(px - off + 0.8, py + pd + off - 0.8, sh + 0.9), P(px + pw + off - 0.8, py + pd + off - 0.8, sh + 0.9), P(px + pw + off - 0.8, py - off + 0.8, sh + 0.9), P(px - off + 0.8, py - off + 0.8, sh + 0.9))}
          fill="rgba(210,225,235,0.42)" stroke="#dfe7ee" strokeWidth={1} fillRule="evenodd" />}
        {!arena && <>
          <Floodlight x={px - off - 2.8} y={py - off - 2.8} h={sh + 6} />
          <Floodlight x={px + pw + off + 2.8} y={py - off - 2.8} h={sh + 6} />
        </>}
      </g>
    );
    G('stadium', 30, node, [px + pw / 2, py - 2, sh + 2.5]);
    // Haupttribüne vorne (niedriger, verdeckt den Platz nicht ganz) – eigener Tiefenwert.
    if (L >= 4 || arena) {
      G('stadium', 40, <g>{stand(px - off, py + pd + off, pw + 2 * off, 2.2, sh * 0.7)}</g>, [px + pw / 2, py - 2, sh + 2.5]);
    }
    if (!arena) {
      plain('fl2', 41, <g><Floodlight x={px - off - 2.8} y={py + pd + off + 2.8} h={sh + 6} /><Floodlight x={px + pw + off + 2.8} y={py + pd + off + 2.8} h={sh + 6} /></g>);
    }
    if (club.stadiumProject) plain('crane', 42, <Crane x={px + pw + off + 4} y={py + pd + 2} h={sh + 8} />);
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

  // ---------------------------------------------------------------- Geschäftsstelle / Vereinsheim
  {
    const big = (club.reputation ?? 60) >= 75;
    const w = big ? 7 : 5.5, d = 4, h = big ? 2.8 : 1.9;
    G('clubhouse', 28 + w + 12 + d, (
      <g>
        <Box x={28} y={12} w={w} d={d} h={h} color={pal.wall}>
          <WindowsFront x={28} w={w} yf={16} z0={0.4} rows={big ? 2 : 1} color={pal.win} />
          <WindowsSide y={12} d={d} xf={28 + w} z0={0.4} rows={big ? 2 : 1} color={pal.win} />
        </Box>
        {pal.era === 0 ? <GableRoof x={28} y={12} w={w} d={d} z={h} rh={1.3} color={pal.roof} /> : <Box x={27.8} y={11.8} w={w + 0.4} d={d + 0.4} h={0.2} z={h} color={pal.roof} />}
        <Box x={28 + w / 2 - 0.1} y={16} w={0.15} d={0.15} h={h + 2.4} color="#d5d9de" />
        <polygon points={pts(P(28 + w / 2, 16, h + 2.4), P(28 + w / 2 + 1.6, 16, h + 2.1), P(28 + w / 2, 16, h + 1.8))} fill={primary} />
      </g>
    ), [28 + w / 2, 14, h + 3]);
  }

  // ---------------------------------------------------------------- Medizin
  {
    const m = lvl('medical');
    const w = 2.4 + m * 0.5, h = 1.1 + m * 0.3;
    G('medical', 35.5 + w + 15, (
      <g>
        <Box x={35.5} y={12} w={w} d={3} h={h} color={pal.era === 0 ? '#d9d4c9' : '#f0f2f4'}>
          <WindowsFront x={35.5} w={w} yf={15} z0={0.3} rows={Math.min(2, Math.ceil(m / 2))} color={pal.win} step={1.3} />
        </Box>
        <g transform={`translate(${P(35.5 + w / 2, 13.5, h)[0]},${P(35.5 + w / 2, 13.5, h)[1]})`}>
          <rect x={-6} y={-2} width={12} height={4} fill="#d63c3c" /><rect x={-2} y={-6} width={4} height={12} fill="#d63c3c" />
        </g>
      </g>
    ), [35.5 + w / 2, 13, h + 1.5]);
  }

  // ---------------------------------------------------------------- Parkplatz
  {
    const cars: ReactNode[] = [];
    const nCars = Math.round(4 + (club.reputation ?? 60) / 10);
    const colors = pal.era === 0 ? ['#c0392b', '#e1b12c', '#2e86de', '#6d4c41', '#7f8c8d', '#27ae60'] : pal.era === 1 ? ['#2c3e50', '#bdc3c7', '#8e44ad', '#c0392b', '#16a085', '#ecf0f1'] : ['#ecf0f1', '#2d3436', '#636e72', '#b2bec3', '#0984e3', '#d63031'];
    for (let i = 0; i < nCars; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      cars.push(<Car key={i} x={28 + col * 2} y={3 + row * 2.4} color={colors[Math.floor(hash(i + year) * colors.length)]} era={year} />);
    }
    plain('parking', 28 + 12 + 2 + 8, <g><Flat x={27.5} y={2.2} w={12.5} d={8} fill={winter ? '#c7ccd1' : '#4b5159'} />{cars}</g>);
  }

  // ---------------------------------------------------------------- Trainingsplätze
  {
    const T = lvl('trainingCenter');
    const artificial = year >= 1995 && T >= 3;
    const nodes: ReactNode[] = [];
    const tg = winter ? '#c9d3cd' : T <= 1 ? '#7d9a52' : '#4f9a45';
    nodes.push(<Pitch key="t1" x={4} y={22} w={12} d={8} grass={tg} stripes={T >= 2} />);
    if (T <= 1 && !winter) nodes.push(<Flat key="patch" x={9} y={25} w={2.5} d={2} fill="#9b8a5a" opacity={0.7} />);
    if (T >= 2) nodes.push(<Pitch key="t2" x={18} y={22} w={12} d={8} grass={tg} />);
    if (T >= 3) nodes.push(<Pitch key="t3" x={32} y={22} w={12} d={8} grass={artificial ? '#2f8a6a' : tg} stripes={!artificial} />);
    if (T >= 4) nodes.push(<g key="fl"><Floodlight x={3.4} y={21.4} h={5} /><Floodlight x={16.6} y={21.4} h={5} /><Floodlight x={30.6} y={21.4} h={5} /></g>);
    G('trainingCenter', 22 + 30, <g>{nodes}</g>, [T >= 2 ? 24 : 10, 25, 3]);
    if (T >= 5) {
      G('trainingCenter', 36 + 8 + 16 + 4, (
        <g>
          <Box x={36} y={16.2} w={8} d={4.5} h={2.4} color={pal.era === 0 ? '#a7a08f' : '#dfe3e6'}>
            <WindowsSide y={16.2} d={4.5} xf={44} z0={0.6} rows={1} color={pal.win} />
          </Box>
          <GableRoof x={36} y={16.2} w={8} d={4.5} z={2.4} rh={1.2} color={pal.roof} />
        </g>
      ), [40, 18, 4.5]);
    }
  }

  // ---------------------------------------------------------------- Jugendbereich
  {
    const Y = lvl('youthAcademy');
    const yg = winter ? '#c9d3cd' : '#57a14b';
    const pitches = <g><Pitch x={4} y={34} w={9} d={6} grass={yg} />{Y >= 3 && <Pitch x={15} y={34} w={9} d={6} grass={yg} />}</g>;
    const w = [0, 4, 5, 6, 6.5, 8][Y], d = [0, 3, 3.5, 4, 4, 4.5][Y], h = [0, 1.3, 1.6, 2.4, 2.6, 3.2][Y];
    const wood = Y === 1 && pal.era === 0;
    const bld = (
      <g>
        <Box x={27} y={34} w={w} d={d} h={h} color={wood ? '#8a6a46' : pal.wall}>
          <WindowsFront x={27} w={w} yf={34 + d} z0={0.35} rows={h > 2 ? 2 : 1} color={pal.win} step={1.4} />
        </Box>
        {pal.era === 0 || Y <= 2 ? <GableRoof x={27} y={34} w={w} d={d} z={h} rh={1} color={wood ? '#4e3b2a' : pal.roof} /> : <Box x={26.8} y={33.8} w={w + 0.4} d={d + 0.4} h={0.2} z={h} color={pal.roof} />}
        {Y >= 4 && <Box x={27} y={39.2} w={6} d={3} h={2.8} color={shade(pal.wall, 0.95)}>
          <WindowsFront x={27} w={6} yf={42.2} z0={0.4} rows={2} color={pal.win} step={1.3} />
        </Box>}
      </g>
    );
    G('youthAcademy', 34 + 13 + 6, pitches, [9, 36, 2.5]);
    G('youthAcademy', 27 + w + 34 + d + (Y >= 4 ? 8 : 0), bld, [27 + w / 2, 35, h + 2.2]);
  }

  // ---------------------------------------------------------------- Einrichtungen späterer Epochen
  const plot = (k: FacilityKey, x: number, y: number, w: number, d: number, built: ReactNode, label: [number, number, number]) => {
    if (!unlocked.has(k)) return;
    const isBuilt = lvl(k) >= 2;
    G(k, x + w + y + d, isBuilt ? built : (
      <g>
        <Flat x={x} y={y} w={w} d={d} fill={winter ? '#dfe5e2' : '#a08a62'} />
        <polygon points={pts(P(x, y, 0.5), P(x + w, y, 0.5), P(x + w, y + d, 0.5), P(x, y + d, 0.5), P(x, y, 0.5))} fill="none" stroke="#e8edf1" strokeDasharray="4 4" />
        <Box x={x + w / 2 - 0.6} y={y + d / 2} w={1.2} d={0.15} h={1.2} color="#e0a23a" />
      </g>
    ), label);
  };
  plot('rehaCenter', 41, 2, 5, 5, (
    <g>
      <Box x={41} y={2} w={5} d={5} h={1.6 + lvl('rehaCenter') * 0.3} color={pal.era === 2 ? '#eef1f3' : '#d7dbde'}>
        <WindowsFront x={41} w={5} yf={7} z0={0.4} rows={1} color={pal.win} step={1.3} />
      </Box>
      <Flat x={41.6} y={2.6} w={3.8} d={2} z={1.6 + lvl('rehaCenter') * 0.3 + 0.01} fill="#4fb3d9" />
    </g>
  ), [43.5, 4, 4]);
  plot('performanceCenter', 39, 8.5, 6.5, 4, (
    <Box x={39} y={8.5} w={6.5} d={4} h={2.2 + lvl('performanceCenter') * 0.3} color="#3d4d5c">
      <WindowsFront x={39} w={6.5} yf={12.5} z0={0.3} rows={2} color="#7fd4f0" step={1} ww={0.8} rowH={1.1} />
      <WindowsSide y={8.5} d={4} xf={45.5} z0={0.3} rows={2} color="#7fd4f0" step={1} ww={0.8} rowH={1.1} />
    </Box>
  ), [42, 10, 5]);
  plot('nlz', 37, 33, 8, 6, (
    <g>
      <Box x={37} y={33} w={8} d={6} h={2.4 + lvl('nlz') * 0.35} color="#e6e9ec">
        <WindowsFront x={37} w={8} yf={39} z0={0.4} rows={2} color="#8fc2dc" step={1.1} ww={0.8} />
        <WindowsSide y={33} d={6} xf={45} z0={0.4} rows={2} color="#8fc2dc" step={1.1} ww={0.8} />
      </Box>
      <Box x={36.8} y={32.8} w={8.4} d={0.6} h={0.4} z={2.4 + lvl('nlz') * 0.35} color={primary} />
    </g>
  ), [41, 35, 6]);
  plot('dataCenter', 46.5, 35, 3, 3, (
    <g>
      <Box x={46.5} y={35} w={3} d={3} h={2.2} color="#2b3540">
        <WindowsFront x={46.5} w={3} yf={38} z0={0.5} rows={2} color="#00D9FF" step={0.8} ww={0.5} wh={0.3} rowH={0.7} />
      </Box>
      <ellipse cx={P(48, 36.5, 2.9)[0]} cy={P(48, 36.5, 2.9)[1]} rx={9} ry={5} fill="#dfe6ec" stroke="#9aa6b2" />
    </g>
  ), [48, 36, 4.5]);

  // ---------------------------------------------------------------- Bäume
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const t = hash(i * 3.1);
    const edge = i % 4;
    const p = 2 + t * 44;
    const [x, y] = edge === 0 ? [p, -2.5] : edge === 1 ? [-2.5, p] : edge === 2 ? [p, 45 + hash(i) * 2] : [50.5, p];
    trees.push([x, y, 0.8 + hash(i + 9) * 0.5]);
  }
  for (const [x, y, s] of [[2, 18.5, 0.9], [16.8, 32, 0.8], [30.8, 32.5, 1], [26, 21.5, 0.8], [46, 21, 0.9], [14, 44, 1]] as [number, number, number][]) trees.push([x, y, s]);
  trees.forEach(([x, y, s], i) => plain(`tree${i}`, x + y + 0.5, <Tree x={x} y={y} s={s} snow={winter} color={autumn && i % 3 === 0 ? '#c9822c' : '#3f7a3a'} />));

  objs.sort((a, b) => a.depth - b.depth);

  // Wege
  const path = (a: [number, number], b: [number, number], wdt = 1.2) => (
    <polygon points={pts(P(a[0], a[1] - wdt / 2), P(b[0], b[1] - wdt / 2), P(b[0], b[1] + wdt / 2), P(a[0], a[1] + wdt / 2))} fill={winter ? '#eef2f4' : '#b9b3a3'} />
  );
  const pathV = (a: [number, number], b: [number, number], wdt = 1.2) => (
    <polygon points={pts(P(a[0] - wdt / 2, a[1]), P(a[0] + wdt / 2, a[1]), P(b[0] + wdt / 2, b[1]), P(b[0] - wdt / 2, b[1]))} fill={winter ? '#eef2f4' : '#b9b3a3'} />
  );

  return (
    <svg className="gr-svg" viewBox="10 20 1320 770" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="grSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={winter ? '#c9d6e2' : '#8fc3e8'} />
          <stop offset="1" stopColor={winter ? '#e9eef2' : '#d9eef8'} />
        </linearGradient>
      </defs>
      <Flat x={-4} y={-4} w={56} d={51} fill={grass} />
      {path([-4, 20.8], [52, 20.8], 1.6)}
      {path([4, 32.3], [50, 32.3], 1.2)}
      {pathV([26.5, -4], [26.5, 47], 1.6)}
      {objs.map((o) => <g key={o.key + o.depth}>{o.node}</g>)}
      {winter && <g pointerEvents="none" opacity={0.7}>{Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={hash(i) * 1300} cy={hash(i + 99) * 760} r={1.5 + hash(i + 7) * 1.5} fill="#fff" />)}</g>}
    </svg>
  );
}

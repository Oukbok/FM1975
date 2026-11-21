// =============================================================================
// VEREINSGELÄNDE — der Campus südlich der Stadionstraße (Wunsch Pascal: neu
// geordnet, modular ausbaubar, ansehnlicher). Drei Quartiere an zwei Alleen:
//   • Trainingszentrum: drei Platz-Module, Kabinentrakt, Flutlicht, Halle
//   • Nachwuchs: zwei Plätze, Kleinfeld, Jugendhaus, Internat, Leistungszentrum
//   • Verwaltung & Medizin: Geschäftsstelle, Medizin, Reha, Leistungsdiagnostik, Daten
// Jedes Quartier hat feste Modul-Plätze: Gebautes steht, die nächste Ausbaustufe
// ist als gestrichelte Fläche mit „Stufe n“ vorgemerkt. Diese Quartiere gehören
// dem Verein von Anfang an; die Nachbargrundstücke ringsum zeichnet PlotLayer.tsx
// (Karte: engine/groundsPlots.ts). Reine Zeichnung (isoKit).
// =============================================================================
import type { ReactNode } from 'react';
import type { FacilityKey } from '../../../types';
import { Box, Car, Flat, Floodlight, GableRoof, P, Pitch, Tree, WindowsFront, WindowsSide, pts, shade } from './isoKit';

export type CampusKey = FacilityKey | 'clubhouse';
export interface CampusCtx {
  lvl: (k: FacilityKey) => number;
  unlocked: Set<FacilityKey>;
  year: number;
  winter: boolean;
  autumn: boolean;
  grass: string;
  pal: { wall: string; roof: string; win: string; concrete: string; era: number };
  primary: string;
  reputation: number;
  G: (k: CampusKey, depth: number, node: ReactNode, label: [number, number, number]) => void;
  plain: (key: string, depth: number, node: ReactNode) => void;
}

/** Lage der Quartiere [x, y, w, d] – auch für die Baumverteilung in GroundsScene. */
export const LOTS = {
  training: [4, 22.6, 40.2, 9.6],
  youth: [4, 34.8, 40.2, 9.6],
  admin: [4, 47.2, 40.2, 9],
} as const;
/** Ost-West-Straßen (y, Breite) und die Campusstraße (x). */
export const AVENUES: [number, number][] = [[20, 1.8], [32.5, 1.6], [44.9, 1.6], [56.7, 1.6]];
export const CAMPUS_ROAD_X = 44.8;
/** Südrand des Geländes: hinter der südlichen Grundstücksreihe verläuft die Südstraße. */
export const SOUTH_ROAD_Y = 66.7;
export const CAMPUS_SOUTH = 68.4;

function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function drawCampus(c: CampusCtx): { base: ReactNode[]; signs: ReactNode[] } {
  const { lvl, winter, pal, primary, G, plain, year } = c;
  const base: ReactNode[] = [];
  const signs: ReactNode[] = [];
  const road = winter ? '#c3c8cd' : '#5a6068';
  const walk = winter ? '#eef2f4' : '#c4beae';
  const pad = winter ? '#e6ebe8' : shade(c.grass, 1.1);
  const hedge = winter ? '#aebdb4' : '#3d6d38';
  const south = CAMPUS_SOUTH;

  // ---------------------------------------------------------------- Straßen, Gehwege, Alleebäume
  AVENUES.forEach(([y, w], i) => {
    base.push(<Flat key={`av${i}`} x={-5} y={y} w={CAMPUS_ROAD_X + 6.6} d={w} fill={i === 0 ? road : walk} />);
    if (i === 0) base.push(<polyline key={`avl${i}`} points={pts(P(-5, y + w / 2, 0.01), P(CAMPUS_ROAD_X + 1.6, y + w / 2, 0.01))} stroke="#e4dfcf" strokeWidth={1} strokeDasharray="6 7" fill="none" />);
  });
  base.push(<Flat key="sr" x={-5} y={SOUTH_ROAD_Y} w={62} d={1.6} fill={road} />);
  base.push(<polyline key="srl" points={pts(P(-5, SOUTH_ROAD_Y + 0.8, 0.01), P(57, SOUTH_ROAD_Y + 0.8, 0.01))} stroke="#e4dfcf" strokeWidth={1} strokeDasharray="6 7" fill="none" />);
  base.push(<Flat key="cr" x={CAMPUS_ROAD_X} y={20} w={1.6} d={south - 20} fill={road} />);
  base.push(<polyline key="crl" points={pts(P(CAMPUS_ROAD_X + 0.8, 21.8, 0.01), P(CAMPUS_ROAD_X + 0.8, south, 0.01))} stroke="#e4dfcf" strokeWidth={1} strokeDasharray="6 7" fill="none" />);
  let tk = 0;
  for (const [y, w] of AVENUES.slice(1)) for (let x = 6; x < 43; x += 5.4) {
    const k = tk++;
    plain(`avt${k}`, x + y + w + 0.4, <Tree x={x} y={y + w / 2} s={0.62 + hash(k) * 0.14} snow={winter} color={c.autumn && k % 3 === 0 ? '#c9822c' : k % 2 ? '#3f7a3a' : '#4b8a40'} />);
  }

  // ---------------------------------------------------------------- Quartier: Fläche, Hecke, Schild
  const lot = (key: string, [x, y, w, d]: readonly [number, number, number, number], title: string, state: string) => {
    base.push(<g key={`lot${key}`}>
      <Flat x={x} y={y} w={w} d={d} fill={pad} />
      <polygon points={pts(P(x, y, 0.02), P(x + w, y, 0.02), P(x + w, y + d, 0.02), P(x, y + d, 0.02))} fill="none" stroke={hedge} strokeWidth={3.2} strokeLinejoin="round" />
    </g>);
    const text = state ? `${title} · ${state}` : title;
    const [sx, sy] = P(x + 0.5, y - 0.3, 1.5);
    signs.push(<g key={`sign${key}`} pointerEvents="none">
      <Box x={x + 0.45} y={y - 0.35} w={0.12} d={0.12} h={1.2} color="#59616b" />
      <rect x={sx - 6} y={sy - 15} width={text.length * 8.7 + 24} height={22} rx={4} fill="rgba(18,28,44,0.9)" />
      <rect x={sx - 6} y={sy - 15} width={4} height={22} rx={1.5} fill={primary} />
      <text x={sx + 6} y={sy + 0.5} fill="#fff" fontSize={12.5} fontWeight={700} letterSpacing={0.5}>{text.toUpperCase()}</text>
    </g>);
  };
  /** Vorgemerktes Modul (noch nicht gebaut). */
  const slot = (x: number, y: number, w: number, d: number, label: string) => {
    const [tx, ty] = P(x + w / 2, y + d / 2, 0);
    return (
      <g>
        <polygon points={pts(P(x, y, 0.03), P(x + w, y, 0.03), P(x + w, y + d, 0.03), P(x, y + d, 0.03))} fill={winter ? 'rgba(120,135,128,0.10)' : 'rgba(40,60,40,0.10)'}
          stroke={winter ? '#8f9d95' : '#4d6b48'} strokeWidth={1.3} strokeDasharray="6 5" strokeLinejoin="round" />
        <text x={tx} y={ty + 4} textAnchor="middle" fill={winter ? '#6f7d76' : '#2f4a2c'} fontSize={12} fontWeight={700} opacity={0.85}>{label}</text>
      </g>
    );
  };

  // ---------------------------------------------------------------- Trainingszentrum
  {
    const T = lvl('trainingCenter');
    const [lx, ly] = LOTS.training;
    lot('tr', LOTS.training, 'Trainingszentrum', `Stufe ${T}`);
    const artificial = year >= 1995 && T >= 3;
    const tg = winter ? '#c9d3cd' : T <= 1 ? '#7d9a52' : '#4f9a45';
    const px = [lx + 0.9, lx + 11.1, lx + 21.3], py = ly + 1.1, pw = 9.4, pd = 7.4;
    const fields: ReactNode[] = [];
    px.forEach((x, i) => {
      const built = T >= i + 1;
      fields.push(<g key={`f${i}`}>{built
        ? <Pitch x={x} y={py} w={pw} d={pd} grass={i === 2 && artificial ? '#2f8a6a' : tg} stripes={T >= 2 && !(i === 2 && artificial)} />
        : slot(x, py, pw, pd, `Platz ${i + 1} · Stufe ${i + 1}`)}</g>);
    });
    if (T <= 1 && !winter) fields.push(<Flat key="patch" x={px[0] + 3.6} y={py + 2.8} w={2.2} d={1.8} fill="#9b8a5a" opacity={0.7} />);
    G('trainingCenter', lx + ly + 1, <g>{fields}</g>, [px[Math.min(2, Math.max(0, T - 1))] + pw / 2, py + 2, 2.5]);
    if (T >= 4) G('trainingCenter', lx + 32 + ly + 9, <g>{[px[0] - 0.5, px[1] - 0.5, px[2] - 0.5, px[2] + pw + 0.4].map((x, i) => <Floodlight key={i} x={x} y={py - 0.5} h={5} />)}</g>, [px[1], py, 6.5]);
    // Kabinentrakt (wächst je Stufe) und Halle
    const bx = lx + 31.6, kw = 3.2 + T * 0.9, kh = 1.1 + T * 0.18;
    G('trainingCenter', bx + kw + ly + 4.2, (
      <g>
        <Box x={bx} y={ly + 1} w={kw} d={2.8} h={kh} color={pal.era === 0 ? '#a7a08f' : pal.wall}>
          <WindowsFront x={bx} w={kw} yf={ly + 3.8} z0={0.35} rows={1} color={pal.win} step={1.2} ww={0.7} />
        </Box>
        {pal.era === 0 ? <GableRoof x={bx} y={ly + 1} w={kw} d={2.8} z={kh} rh={0.8} color={pal.roof} /> : <Box x={bx - 0.15} y={ly + 0.85} w={kw + 0.3} d={3.1} h={0.16} z={kh} color={pal.roof} />}
      </g>
    ), [bx + kw / 2, ly + 2.4, kh + 2]);
    const hx = bx, hy = ly + 4.7, hw = 7.8, hd = 4.2;
    G('trainingCenter', hx + hw + hy + hd, T >= 5 ? (
      <g>
        <Box x={hx} y={hy} w={hw} d={hd} h={2.5} color={pal.era === 0 ? '#a7a08f' : '#dfe3e6'}>
          <WindowsFront x={hx} w={hw} yf={hy + hd} z0={1.2} rows={1} color={pal.win} step={1.3} ww={0.9} wh={0.5} />
          <WindowsSide y={hy} d={hd} xf={hx + hw} z0={0.6} rows={1} color={pal.win} />
        </Box>
        <GableRoof x={hx} y={hy} w={hw} d={hd} z={2.5} rh={1.2} color={pal.roof} />
      </g>
    ) : slot(hx, hy, hw, hd, 'Halle · Stufe 5'), [hx + hw / 2, hy + 2, T >= 5 ? 5 : 2]);
  }

  // ---------------------------------------------------------------- Nachwuchs
  {
    const Y = lvl('youthAcademy');
    const [lx, ly] = LOTS.youth;
    lot('yo', LOTS.youth, 'Nachwuchs', `Stufe ${Y}`);
    const yg = winter ? '#c9d3cd' : '#57a14b';
    const py = ly + 1.5;
    G('youthAcademy', lx + ly + 1, (
      <g>
        <Pitch x={lx + 0.9} y={py} w={9} d={6.6} grass={yg} />
        {Y >= 3 ? <Pitch x={lx + 10.7} y={py} w={9} d={6.6} grass={yg} /> : slot(lx + 10.7, py, 9, 6.6, 'Platz 2 · Stufe 3')}
        {Y >= 5 ? <Pitch x={lx + 20.5} y={py + 1} w={5.6} d={4.4} grass={shade(yg, 0.94)} stripes={false} /> : slot(lx + 20.5, py + 1, 5.6, 4.4, 'Kleinfeld · Stufe 5')}
      </g>
    ), [lx + 5.4, py + 2, 2.5]);
    const w = [0, 4, 5, 6, 6.5, 7][Y], d = [0, 3, 3.4, 3.8, 3.8, 3.8][Y], h = [0, 1.3, 1.6, 2.4, 2.6, 3.2][Y];
    const wood = Y === 1 && pal.era === 0;
    const hx = lx + 27, hy = ly + 0.9;
    G('youthAcademy', hx + w + hy + d + 5, (
      <g>
        <Box x={hx} y={hy} w={w} d={d} h={h} color={wood ? '#8a6a46' : pal.wall}>
          <WindowsFront x={hx} w={w} yf={hy + d} z0={0.35} rows={h > 2 ? 2 : 1} color={pal.win} step={1.4} />
        </Box>
        {pal.era === 0 || Y <= 2 ? <GableRoof x={hx} y={hy} w={w} d={d} z={h} rh={1} color={wood ? '#4e3b2a' : pal.roof} /> : <Box x={hx - 0.2} y={hy - 0.2} w={w + 0.4} d={d + 0.4} h={0.2} z={h} color={pal.roof} />}
        {Y >= 4 ? (
          <Box x={hx} y={ly + 5.6} w={6} d={3} h={2.6} color={shade(pal.wall, 0.95)}>
            <WindowsFront x={hx} w={6} yf={ly + 8.6} z0={0.4} rows={2} color={pal.win} step={1.3} />
          </Box>
        ) : slot(hx, ly + 5.6, 6, 3, 'Internat · Stufe 4')}
      </g>
    ), [hx + w / 2, hy + 1, h + 2.2]);
    // Nachwuchsleistungszentrum (eigene Einrichtung, sobald freigeschaltet)
    if (c.unlocked.has('nlz')) {
      const nx = lx + 34.6, ny = ly + 1.4, nw = 5, nd = 6.4, N = lvl('nlz');
      G('nlz', nx + nw + ny + nd, N >= 2 ? (
        <g>
          <Box x={nx} y={ny} w={nw} d={nd} h={2.2 + N * 0.35} color="#e6e9ec">
            <WindowsFront x={nx} w={nw} yf={ny + nd} z0={0.4} rows={2} color="#8fc2dc" step={1.1} ww={0.8} />
            <WindowsSide y={ny} d={nd} xf={nx + nw} z0={0.4} rows={2} color="#8fc2dc" step={1.1} ww={0.8} />
          </Box>
          <Box x={nx - 0.2} y={ny - 0.2} w={nw + 0.4} d={0.6} h={0.4} z={2.2 + N * 0.35} color={primary} />
        </g>
      ) : slot(nx, ny, nw, nd, 'Leistungszentrum'), [nx + nw / 2, ny + 2, N >= 2 ? 6 : 2]);
    }
  }

  // ---------------------------------------------------------------- Verwaltung & Medizin
  {
    const [lx, ly] = LOTS.admin;
    lot('ad', LOTS.admin, 'Verwaltung & Medizin', '');
    const big = c.reputation >= 75;
    const cw = big ? 7 : 5.5, cd = 4, ch = big ? 2.8 : 1.9, cx = lx + 1.2, cy = ly + 1.6;
    G('clubhouse', cx + cw + cy + cd, (
      <g>
        <Flat x={cx - 0.4} y={cy + cd} w={cw + 0.8} d={2.4} fill={walk} />
        <Box x={cx} y={cy} w={cw} d={cd} h={ch} color={pal.wall}>
          <WindowsFront x={cx} w={cw} yf={cy + cd} z0={0.4} rows={big ? 2 : 1} color={pal.win} />
          <WindowsSide y={cy} d={cd} xf={cx + cw} z0={0.4} rows={big ? 2 : 1} color={pal.win} />
        </Box>
        {pal.era === 0 ? <GableRoof x={cx} y={cy} w={cw} d={cd} z={ch} rh={1.3} color={pal.roof} /> : <Box x={cx - 0.2} y={cy - 0.2} w={cw + 0.4} d={cd + 0.4} h={0.2} z={ch} color={pal.roof} />}
        {[0.8, cw - 0.8].map((o, i) => <g key={i}>
          <Box x={cx + o - 0.07} y={cy + cd + 1.4} w={0.14} d={0.14} h={3.4} color="#d5d9de" />
          <polygon points={pts(P(cx + o, cy + cd + 1.47, 3.4), P(cx + o + 1.5, cy + cd + 1.47, 3.1), P(cx + o, cy + cd + 1.47, 2.7))} fill={i ? '#f2f2f2' : primary} />
        </g>)}
      </g>
    ), [cx + cw / 2, cy + 1.5, ch + 3]);

    const M = lvl('medical');
    const mx = lx + 10.2, my = ly + 2.2, mw = 2.6 + M * 0.5, mh = 1.1 + M * 0.3;
    G('medical', mx + mw + my + 3, (
      <g>
        <Box x={mx} y={my} w={mw} d={3} h={mh} color={pal.era === 0 ? '#d9d4c9' : '#f0f2f4'}>
          <WindowsFront x={mx} w={mw} yf={my + 3} z0={0.3} rows={Math.min(2, Math.ceil(M / 2))} color={pal.win} step={1.3} />
        </Box>
        <g transform={`translate(${P(mx + mw / 2, my + 1.5, mh)[0]},${P(mx + mw / 2, my + 1.5, mh)[1]})`}>
          <rect x={-6} y={-2} width={12} height={4} fill="#d63c3c" /><rect x={-2} y={-6} width={4} height={12} fill="#d63c3c" />
        </g>
      </g>
    ), [mx + mw / 2, my + 1, mh + 1.5]);

    const future = (k: FacilityKey, x: number, y: number, w: number, d: number, name: string, built: () => ReactNode, top: number) => {
      if (!c.unlocked.has(k)) return;
      const on = lvl(k) >= 2;
      G(k, x + w + y + d, on ? built() : slot(x, y, w, d, name), [x + w / 2, y + d / 2, on ? top : 2]);
    };
    const R = lvl('rehaCenter');
    future('rehaCenter', lx + 16.6, ly + 1.8, 5, 4.6, 'Reha-Zentrum', () => (
      <g>
        <Box x={lx + 16.6} y={ly + 1.8} w={5} d={4.6} h={1.6 + R * 0.3} color={pal.era === 2 ? '#eef1f3' : '#d7dbde'}>
          <WindowsFront x={lx + 16.6} w={5} yf={ly + 6.4} z0={0.4} rows={1} color={pal.win} step={1.3} />
        </Box>
        <Flat x={lx + 17.2} y={ly + 2.4} w={3.8} d={2} z={1.6 + R * 0.3 + 0.01} fill="#4fb3d9" />
      </g>
    ), 4);
    const Pf = lvl('performanceCenter');
    future('performanceCenter', lx + 23.2, ly + 2.2, 6.2, 4, 'Leistungsdiagnostik', () => (
      <Box x={lx + 23.2} y={ly + 2.2} w={6.2} d={4} h={2.2 + Pf * 0.3} color="#3d4d5c">
        <WindowsFront x={lx + 23.2} w={6.2} yf={ly + 6.2} z0={0.3} rows={2} color="#7fd4f0" step={1} ww={0.8} rowH={1.1} />
        <WindowsSide y={ly + 2.2} d={4} xf={lx + 29.4} z0={0.3} rows={2} color="#7fd4f0" step={1} ww={0.8} rowH={1.1} />
      </Box>
    ), 5);
    future('dataCenter', lx + 31, ly + 2.8, 3.2, 3.2, 'Datenzentrum', () => (
      <g>
        <Box x={lx + 31} y={ly + 2.8} w={3.2} d={3.2} h={2.2} color="#2b3540">
          <WindowsFront x={lx + 31} w={3.2} yf={ly + 6} z0={0.5} rows={2} color="#F2A541" step={0.8} ww={0.5} wh={0.3} rowH={0.7} />
        </Box>
        <ellipse cx={P(lx + 32.6, ly + 4.4, 2.9)[0]} cy={P(lx + 32.6, ly + 4.4, 2.9)[1]} rx={9} ry={5} fill="#dfe6ec" stroke="#9aa6b2" />
      </g>
    ), 4.5);
    // Mitarbeiter-Parkplatz am Quartiersrand
    const kx = lx + 35.4, ky = ly + 1.4;
    base.push(<Flat key="spk" x={kx} y={ky} w={4} d={6.4} fill={winter ? '#c7ccd1' : '#6a7078'} />);
    const cols = pal.era === 0 ? ['#c0392b', '#e1b12c', '#2e86de', '#6d4c41'] : pal.era === 1 ? ['#2c3e50', '#bdc3c7', '#c0392b', '#16a085'] : ['#ecf0f1', '#2d3436', '#636e72', '#0984e3'];
    const n = Math.min(6, 2 + Math.round(c.reputation / 25));
    plain('spkc', kx + 4 + ky + 6.4, <g>{Array.from({ length: n }).map((_, i) => <Car key={i} x={kx + 0.5 + (i % 2) * 1.9} y={ky + 0.5 + Math.floor(i / 2) * 2} color={cols[Math.floor(hash(i + year) * cols.length)]} era={year} />)}</g>);
  }

  return { base, signs };
}

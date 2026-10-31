// =============================================================================
// VEREINSGELÄNDE — Zeichnung des Stadionumfelds (engine/grounds.ts):
// Bahnstrecke/Haltestelle, Zufahrtsstraße mit Shuttlebussen, Parkplatz → Parkhaus,
// Fan-Zone, Presse/TV, Flutlicht, Hospitality, Familienbereich, Museum, Führungen,
// Vereinsheim, Megastore, Versandlager, Ordnungsdienst, Fanprojekt, Fanräume,
// zugekaufte Grundstücke. Nicht gebaute, aber verfügbare Teile: Bauplatz.
// =============================================================================
import type { ReactNode } from 'react';
import type { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_BY_KEY } from '../../../data/groundsCatalog';
import { Box, Bus, Car, Dish, Fence, Flat, Floodlight, GableRoof, P, Tent, Train, WindowsFront, WindowsSide, pts, shade } from './isoKit';

export interface LayerCtx {
  gr: ClubGrounds;
  year: number;
  winter: boolean;
  pal: { wall: string; roof: string; win: string; concrete: string; era: number };
  primary: string;
  reputation: number;
  /** Stadion-Eckpunkte für die Flutlichtmasten [x, y]. */
  mastPos: [number, number][];
  mastH: number;
  G: (k: GroundsModuleKey, depth: number, node: ReactNode, label: [number, number, number]) => void;
  plain: (key: string, depth: number, node: ReactNode) => void;
}

function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/** Für die Baumverteilung: belegte Rechtecke des Umfelds. */
export const SURROUND_ZONES: [number, number, number, number][] = [
  [-8, -9, 2.6, 62], [-9, -7.6, 64, 2.4], [-4, 15, 7, 21], [45.5, 12.5, 6, 18], [2, -4.5, 24, 4.2], [45.5, 1.5, 5.5, 6],
];

export function drawSurroundings(c: LayerCtx): void {
  const { gr, year, winter, pal, primary, G, plain } = c;
  const lv = (k: GroundsModuleKey) => gr.modules[k]?.level ?? 0;
  const avail = (k: GroundsModuleKey) => GROUNDS_BY_KEY[k].levels[0].unlock <= year;
  const building = (k: GroundsModuleKey) => gr.projects.some((p) => p.module === k);
  const plotNode = (x: number, y: number, w: number, d: number, active: boolean) => (
    <g>
      <Flat x={x} y={y} w={w} d={d} fill={winter ? '#dfe5e2' : active ? '#a08a62' : 'rgba(160,138,98,0.35)'} />
      <polygon points={pts(P(x, y, 0.4), P(x + w, y, 0.4), P(x + w, y + d, 0.4), P(x, y + d, 0.4), P(x, y, 0.4))} fill="none" stroke="#e8edf1" strokeDasharray="4 4" />
      {active && <Box x={x + w / 2 - 0.6} y={y + d / 2} w={1.2} d={0.15} h={1.2} color="#e0a23a" />}
    </g>
  );
  /** Gebaut → Zeichnung, sonst (verfügbar) Bauplatz; laufender Bau: Bauplatz mit Absperrung. */
  const part = (k: GroundsModuleKey, x: number, y: number, w: number, d: number, built: () => ReactNode, label: [number, number, number]) => {
    const l = lv(k);
    if (l > 0) G(k, x + w + y + d, built(), label);
    else if (avail(k)) G(k, x + w + y + d, plotNode(x, y, w, d, building(k)), [x + w / 2, y + d / 2, 2]);
  };
  const era = pal.era;
  const modernWall = era === 2 ? '#eef1f3' : era === 1 ? '#d9d4ca' : pal.wall;

  // ---------------------------------------------------------------- Zufahrtsstraße + Bahn (immer, als Kulisse)
  plain('road', -3, <g>
    <Flat x={-9} y={-7.4} w={63} d={2} fill={winter ? '#c3c8cd' : '#555b63'} />
    <polyline points={pts(P(-9, -6.4, 0.02), P(54, -6.4, 0.02))} stroke="#d9d4c3" strokeDasharray="6 7" strokeWidth={1} fill="none" />
  </g>);
  plain('rail', -2, <g>
    <Flat x={-7.6} y={-9} w={2.2} d={61} fill={winter ? '#cfd3d6' : '#8a7f73'} />
    <polyline points={pts(P(-7.0, -9, 0.03), P(-7.0, 52, 0.03))} stroke="#5d6066" strokeWidth={1.2} fill="none" />
    <polyline points={pts(P(-6.0, -9, 0.03), P(-6.0, 52, 0.03))} stroke="#5d6066" strokeWidth={1.2} fill="none" />
  </g>);

  // ---------------------------------------------------------------- ÖPNV
  {
    const t = lv('transit');
    const nodes: ReactNode[] = [];
    if (t >= 1) for (let i = 0; i < Math.min(3, t + 1); i++) nodes.push(<Bus key={`b${i}`} x={5 + i * 4} y={-7.1} color={era === 0 ? '#e8c547' : era === 1 ? '#f0f0f0' : '#d8433b'} />);
    if (t >= 2) {
      nodes.push(<Flat key="pf" x={-5.2} y={4} w={1.4} d={13} z={0.25} fill="#a5a9ae" />);
      nodes.push(<Train key="tr" x={-7.1} y={4.4} n={t >= 4 ? 4 : 3} color={era === 2 ? '#d33c3c' : era === 1 ? '#c8463c' : '#5b7b4b'} era={year} />);
    }
    if (t >= 4) {
      nodes.push(<g key="st">
        <Box x={-5.2} y={6} w={1.6} d={9} h={0.15} z={2.4} color="#c9d0d6" />
        <Box x={-3.6} y={8} w={2.6} d={5} h={2.6} color={modernWall}>
          <WindowsFront x={-3.6} w={2.6} yf={13} z0={0.6} rows={1} color={pal.win} step={0.9} ww={0.6} />
        </Box>
        <Box x={-3.4} y={9.6} w={2.2} d={1.8} h={0.5} z={2.6} color={primary} />
      </g>);
    }
    if (t === 0) nodes.push(<Box key="hs" x={22} y={-5.2} w={0.15} d={0.15} h={1.6} color="#d5d9de" />);
    if (nodes.length) G('transit', t >= 2 ? 10 : -1, <g>{nodes}</g>, t >= 2 ? [-5, 10, 4] : [10, -6.5, 2.5]);
  }

  // ---------------------------------------------------------------- Parkplatz → Parkhaus
  {
    const p = lv('parking');
    const x = 27.5, y = 2.2, w = 12.5, d = 8;
    const colors = era === 0 ? ['#c0392b', '#e1b12c', '#2e86de', '#6d4c41', '#7f8c8d', '#27ae60'] : era === 1 ? ['#2c3e50', '#bdc3c7', '#8e44ad', '#c0392b', '#16a085', '#ecf0f1'] : ['#ecf0f1', '#2d3436', '#636e72', '#b2bec3', '#0984e3', '#d63031'];
    const cars = (n: number, z: number, x0: number, y0: number, cols: number) => Array.from({ length: n }).map((_, i) => (
      <g key={`${z}-${i}`} transform={`translate(0,${-z * 14})`}><Car x={x0 + (i % cols) * 2} y={y0 + Math.floor(i / cols) * 2.4} color={colors[Math.floor(hash(i + year + z) * colors.length)]} era={year} /></g>
    ));
    const nCars = Math.round(4 + c.reputation / 10);
    if (p <= 2) {
      const lines: ReactNode[] = [];
      if (p === 2) for (let u = x + 0.6; u < x + w; u += 2) lines.push(<polyline key={u} points={pts(P(u - 0.1, y + 0.4, 0.01), P(u - 0.1, y + 1.6, 0.01))} stroke="#e5e0d0" strokeWidth={1} />);
      const node = (
        <g>
          <Flat x={x} y={y} w={w} d={d} fill={winter ? '#c7ccd1' : p === 0 ? '#7d9a52' : p === 1 ? '#9d8f78' : '#4b5159'} />
          {lines}
          {p > 0 && cars(Math.min(18, nCars + p * 3), 0, x + 0.5, y + 0.8, 6)}
        </g>
      );
      if (p > 0) G('parking', x + w + y + d, node, [x + w / 2, y + d / 2, 2.5]);
      else G('parking', x + w + y + d, plotNode(x, y, w, d, building('parking')), [x + w / 2, y + d / 2, 2]);
    } else {
      const floors = p === 3 ? 3 : 4;
      G('parking', x + w + y + d, (
        <g>
          <Flat x={x} y={y} w={w} d={d} fill={winter ? '#c7ccd1' : '#4b5159'} />
          <Box x={x + 0.5} y={y + 0.8} w={w - 1} d={d - 1.6} h={floors * 0.9} color={era === 2 ? '#b9c0c7' : '#a3a29b'} top="#5a6068">
            {Array.from({ length: floors }).map((_, f) => <polyline key={f} points={pts(P(x + 0.5, y + d - 0.8, f * 0.9 + 0.45), P(x + w - 0.5, y + d - 0.8, f * 0.9 + 0.45))} stroke="#3c4046" strokeWidth={4} />)}
          </Box>
          {cars(10, floors * 0.9, x + 1, y + 1.2, 5)}
          {p === 4 && <Box x={x + w - 2} y={y + d - 1} w={1.4} d={0.2} h={1} z={floors * 0.9} color="#2d3b2f" top="#3ddc84" />}
        </g>
      ), [x + w / 2, y + d / 2, floors + 2]);
    }
  }

  // ---------------------------------------------------------------- Fan-Zone
  part('fanZone', 3, -4.4, 10, 3.6, () => (
    <g>
      <Flat x={3} y={-4.4} w={10} d={3.6} fill={winter ? '#d6dade' : '#8b8f86'} />
      <Box x={3.4} y={-4.2} w={3.6} d={0.4} h={0.25} color="#333" />
      <Box x={4.6} y={-4.2} w={0.2} d={0.2} h={2.4} color="#555" />
      <Box x={3.8} y={-4.2} w={2.8} d={0.2} h={1.5} z={1.8} color="#1b2026" top="#1b2026" />
      <polygon points={pts(P(3.95, -4.0, 1.95), P(6.45, -4.0, 1.95), P(6.45, -4.0, 3.15), P(3.95, -4.0, 3.15))} fill="#4f9a45" opacity={0.85} />
      <Tent x={8} y={-4} w={2} d={1.6} h={0.9} color="#f4f2ee" peak={0.8} />
      <Tent x={10.5} y={-4} w={2} d={1.6} h={0.9} color={primary} peak={0.8} />
      {lv('fanZone') >= 2 && <Box x={7.6} y={-2.2} w={3} d={1.2} h={0.6} color="#3a3f46" top="#2a2e33" />}
    </g>
  ), [8, -3, 3.5]);

  // ---------------------------------------------------------------- Presse & TV
  part('press', 19, -4.4, 7, 3.8, () => {
    const l = lv('press');
    return (
      <g>
        {l === 1 && <Box x={23.4} y={-3.4} w={1.8} d={1.6} h={1.2} color={pal.wall}><WindowsFront x={23.4} w={1.8} yf={-1.8} z0={0.4} rows={1} color={pal.win} step={0.8} ww={0.5} /></Box>}
        {l >= 2 && <Box x={21.6} y={-4.2} w={l >= 4 ? 4.4 : 3.2} d={2.6} h={l >= 4 ? 2.6 : 1.7} color={l >= 4 ? '#3d4d5c' : modernWall}>
          <WindowsFront x={21.6} w={l >= 4 ? 4.4 : 3.2} yf={-1.6} z0={0.4} rows={l >= 4 ? 2 : 1} color={l >= 4 ? '#7fd4f0' : pal.win} step={0.9} ww={0.6} rowH={1} />
        </Box>}
        {l >= 3 && <>
          <Box x={19.2} y={-1.6} w={2} d={0.9} h={0.9} color="#e8edf1" />
          <Box x={19.2} y={-3.1} w={2} d={0.9} h={0.9} color="#d2d8de" />
          <Dish x={20.2} y={-1.2} z={0.9} r={5} />
          <Dish x={24.5} y={-3} z={l >= 4 ? 2.6 : 1.7} r={6} />
        </>}
      </g>
    );
  }, [22.5, -3, 4]);

  // ---------------------------------------------------------------- Flutlicht
  {
    const f = lv('floodlight');
    const lux = f ? GROUNDS_BY_KEY.floodlight.levels[f - 1].lux ?? 300 : 0;
    if (f > 0) {
      const back = c.mastPos.slice(0, 2), front = c.mastPos.slice(2);
      G('floodlight', 29, <g>{back.map(([x, y], i) => <Floodlight key={i} x={x} y={y} h={c.mastH + (f - 1) * 0.6} lux={lux} />)}</g>, [back[0][0], back[0][1], c.mastH + 2]);
      G('floodlight', 41, <g>{front.map(([x, y], i) => <Floodlight key={i} x={x} y={y} h={c.mastH + (f - 1) * 0.6} lux={lux} />)}</g>, [front[0][0], front[0][1], c.mastH + 2]);
    }
  }

  // ---------------------------------------------------------------- Hospitality
  part('hospitality', -3.6, 15.4, 6, 4.6, () => {
    const l = lv('hospitality');
    if (l === 1) return <Tent x={-3.2} y={15.8} w={5} d={3.6} h={1.1} color="#f6f3ec" peak={1.3} />;
    const h = l === 2 ? 1.8 : 2.8;
    return (
      <g>
        <Box x={-3.6} y={15.4} w={6} d={4.6} h={h} color={l === 3 ? '#2f3a44' : modernWall}>
          <WindowsFront x={-3.6} w={6} yf={20} z0={0.3} rows={l === 3 ? 2 : 1} color={l === 3 ? '#ffd58a' : pal.win} step={0.9} ww={0.7} wh={0.9} rowH={1.2} />
          <WindowsSide y={15.4} d={4.6} xf={2.4} z0={0.3} rows={l === 3 ? 2 : 1} color={l === 3 ? '#ffd58a' : pal.win} step={0.9} ww={0.7} wh={0.9} rowH={1.2} />
        </Box>
        <Box x={-3.8} y={15.2} w={6.4} d={5} h={0.18} z={h} color={shade(primary, 0.8)} />
      </g>
    );
  }, [-0.6, 17.5, 4]);

  // ---------------------------------------------------------------- Familienbereich
  part('familyBlock', -3.6, 21.6, 6, 4.2, () => {
    const l = lv('familyBlock');
    return (
      <g>
        <Flat x={-3.6} y={21.6} w={6} d={4.2} fill={winter ? '#e2e6e3' : '#d8c08a'} />
        <Box x={-3.2} y={22} w={1.4} d={1.2} h={0.9} color="#e9dfc4" top="#f2a541" />
        <Box x={-2.6} y={22.4} w={0.12} d={0.12} h={2.2} color="#d5d9de" />
        <polygon points={pts(P(-2.6, 22.4, 2.2), P(-1.4, 22.4, 2.0), P(-2.6, 22.4, 1.8))} fill="#ffcb45" />
        {l >= 2 && <>
          <Box x={-0.6} y={22.2} w={0.9} d={0.9} h={1.4} color="#e85d75" />
          <polygon points={pts(P(0.3, 22.4, 1.4), P(2.0, 22.4, 0.1), P(2.0, 23.0, 0.1), P(0.3, 23.0, 1.4))} fill="#4fb3d9" />
          <Box x={-2.8} y={24} w={1.2} d={1.2} h={0.5} color="#7cc36b" />
          <Box x={0} y={24.2} w={1.8} d={1} h={0.3} color="#f2a541" />
        </>}
      </g>
    );
  }, [-0.6, 23.5, 3]);

  // ---------------------------------------------------------------- Museum + Führungen
  part('museum', -3.6, 27.2, 6, 5, () => {
    const l = lv('museum');
    return (
      <g>
        <Box x={-3.6} y={27.2} w={6} d={5} h={l >= 2 ? 3 : 2.2} color={l >= 2 ? '#e3e6ea' : '#d8cfc0'}>
          {l === 1 && Array.from({ length: 5 }).map((_, i) => <polygon key={i} points={pts(P(-3.2 + i * 1.3, 32.2, 0.2), P(-2.8 + i * 1.3, 32.2, 0.2), P(-2.8 + i * 1.3, 32.2, 1.9), P(-3.2 + i * 1.3, 32.2, 1.9))} fill="#f5efe2" />)}
          {l >= 2 && <WindowsFront x={-3.6} w={6} yf={32.2} z0={0.3} rows={2} color="#8fc2dc" step={1} ww={0.8} rowH={1.3} />}
        </Box>
        {l === 1 ? <GableRoof x={-3.6} y={27.2} w={6} d={5} z={2.2} rh={0.8} color="#8a8f96" /> : <Box x={-3.8} y={27} w={6.4} d={5.4} h={0.25} z={3} color={primary} />}
      </g>
    );
  }, [-0.6, 29, 4.5]);
  part('tours', -3.4, 33, 2.2, 1.6, () => (
    <g>
      <Box x={-3.4} y={33} w={1.4} d={1.2} h={1} color="#e9dfc4" top={primary} />
      {Array.from({ length: 4 + lv('tours') * 2 }).map((_, i) => {
        const [px, py] = P(-1.6 + (i % 3) * 0.5, 33.2 + Math.floor(i / 3) * 0.5, 0);
        return <g key={i}><rect x={px - 1.5} y={py - 7} width={3} height={6} rx={1.2} fill={['#c0392b', '#2e86de', '#f1c40f', '#ecf0f1'][i % 4]} /><circle cx={px} cy={py - 8.5} r={1.6} fill="#e8c4a0" /></g>;
      })}
    </g>
  ), [-2.4, 33.6, 2.5]);

  // ---------------------------------------------------------------- Vereinsheim
  part('vereinsheim', 46.4, 13.4, 4.4, 4, () => {
    const l = lv('vereinsheim');
    const w = l >= 3 ? 4.4 : l === 2 ? 4 : 3.2, d = l >= 3 ? 4 : 3.2, h = l >= 3 ? 2.2 : 1.5;
    return (
      <g>
        <Box x={46.4} y={13.4} w={w} d={d} h={h} color={l === 1 && era === 0 ? '#8a6a46' : pal.wall}>
          <WindowsFront x={46.4} w={w} yf={13.4 + d} z0={0.4} rows={l >= 3 ? 2 : 1} color="#ffd58a" step={1} ww={0.6} />
        </Box>
        {era === 0 || l < 3 ? <GableRoof x={46.4} y={13.4} w={w} d={d} z={h} rh={0.9} color={l === 1 && era === 0 ? '#4e3b2a' : pal.roof} /> : <Box x={46.2} y={13.2} w={w + 0.4} d={d + 0.4} h={0.2} z={h} color={pal.roof} />}
        {l >= 2 && <Box x={46.4} y={13.4 + d} w={w} d={1} h={0.1} color="#b38b5d" />}
      </g>
    );
  }, [48.5, 15, 3.5]);

  // ---------------------------------------------------------------- Megastore (ab Stufe 2 am Stadion)
  if (lv('megastore') >= 2) {
    const l = lv('megastore');
    G('megastore', 30 + 5.2 + 16.6 + 3.2, (
      <g>
        <Box x={30} y={16.6} w={5.2} d={3.2} h={l >= 3 ? 2.4 : 1.8} color={l >= 3 ? '#2f3a44' : modernWall}>
          <WindowsFront x={30} w={5.2} yf={19.8} z0={0.2} rows={1} color="#ffe9a8" step={1.1} ww={0.9} wh={1.1} />
        </Box>
        <Box x={29.8} y={16.4} w={5.6} d={0.5} h={0.4} z={l >= 3 ? 2.4 : 1.8} color={primary} />
      </g>
    ), [32.6, 18, 4]);
  } else if (lv('megastore') === 0 && GROUNDS_BY_KEY.megastore.levels[1].unlock <= year) {
    part('megastore', 30, 16.6, 5.2, 3.2, () => null, [32.6, 18, 2]);
  }

  // ---------------------------------------------------------------- Versand & Onlineshop
  if (lv('onlineShop') >= 1) {
    const l = lv('onlineShop');
    G('onlineShop', 46.4 + 4 + 2.4 + 4, (
      <g>
        {l >= 2 && <Box x={46.4} y={2.4} w={4} d={4} h={l >= 3 ? 2 : 1.5} color={l >= 3 ? '#cfd5da' : '#b8b2a6'}>
          <polygon points={pts(P(47, 6.4, 0), P(48.4, 6.4, 0), P(48.4, 6.4, 1.1), P(47, 6.4, 1.1))} fill="#5a6068" />
          <WindowsSide y={2.4} d={4} xf={50.4} z0={0.6} rows={1} color={pal.win} step={1} ww={0.6} />
        </Box>}
        <Box x={47.2} y={7} w={2} d={0.9} h={0.9} color={l >= 3 ? '#f2a541' : '#e8e2d2'} />
      </g>
    ), [48.4, 4, 3]);
  }

  // ---------------------------------------------------------------- Ordnungsdienst
  {
    const s = lv('stewards');
    if (s >= 2) {
      const gates = Array.from({ length: Math.min(4, s) }).map((_, i) => <Box key={i} x={22.8 + i * 0.7} y={16.2} w={0.45} d={0.45} h={0.8} color="#c9d0d6" top="#f2a541" />);
      G('stewards', 22.8 + 3 + 16.6, <g>{gates}</g>, [24, 16.4, 2.5]);
    }
    if (s >= 4) G('stewards', 41 + 3.2 + 13.4 + 2.4, (
      <Box x={41} y={13.4} w={3.2} d={2.4} h={1.6} color="#3d4d5c">
        <WindowsFront x={41} w={3.2} yf={15.8} z0={0.4} rows={1} color="#7fd4f0" step={0.8} ww={0.5} />
        <Box x={43.4} y={13.6} w={0.15} d={0.15} h={1.8} z={1.6} color="#d5d9de" />
      </Box>
    ), [42.6, 14.5, 4]);
  }

  // ---------------------------------------------------------------- Fanprojekt + Fanräume
  part('fanProject', 46.4, 22.6, 4, 3.2, () => {
    const l = lv('fanProject');
    return l === 1
      ? <Box x={46.6} y={23} w={3.4} d={2} h={1.2} color="#4f7f9c" top="#5b8fae"><WindowsFront x={46.6} w={3.4} yf={25} z0={0.35} rows={1} color={pal.win} step={1.1} ww={0.6} /></Box>
      : <g><Box x={46.4} y={22.6} w={4} d={3.2} h={1.8} color={pal.wall}><WindowsFront x={46.4} w={4} yf={25.8} z0={0.4} rows={1} color="#ffd58a" step={1} ww={0.6} /></Box><GableRoof x={46.4} y={22.6} w={4} d={3.2} z={1.8} rh={0.9} color={pal.roof} /></g>;
  }, [48.4, 24, 3]);
  part('choreoRoom', 46.4, 27.4, 4, 2.8, () => {
    const l = lv('choreoRoom');
    return (
      <Box x={46.4} y={27.4} w={4} d={2.8} h={l >= 2 ? 1.9 : 1.3} color="#5e5a57">
        <polygon points={pts(P(46.6, 30.2, 0.2), P(50.2, 30.2, 0.2), P(50.2, 30.2, l >= 2 ? 1.6 : 1.1), P(46.6, 30.2, l >= 2 ? 1.6 : 1.1))} fill={primary} opacity={0.9} />
        <polygon points={pts(P(47.4, 30.2, 0.4), P(49.4, 30.2, 0.4), P(49.4, 30.2, 0.9), P(47.4, 30.2, 0.9))} fill="#f4f2ee" opacity={0.9} />
      </Box>
    );
  }, [48.4, 28.6, 3]);

  // ---------------------------------------------------------------- Zugekaufte Grundstücke
  for (let i = 0; i < gr.landBought; i++) {
    const x = 4 + i * 9.5;
    plain(`land${i}`, x + 9 + 47.6 + 3, <g><Flat x={x} y={47.6} w={9} d={3} fill={winter ? '#e4e9e6' : '#8db36a'} /><Fence x={x} y={47.6} w={9} d={3} /></g>);
  }
}

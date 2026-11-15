// =============================================================================
// VEREINSGELÄNDE — Umfeld-Modul auf einem eigenen Grundstück (Wunsch Pascal:
// eigenes Land je nach Größe bebauen). Je Modul ein passendes Gebäude aus dem
// isoKit, Größe nach Flächenbedarf der Stufe; laufender Bau: Fundament, Gerüst
// und Kran. Aufruf aus PlotLayer.tsx.
// =============================================================================
import type { ReactNode } from 'react';
import type { GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_BY_KEY } from '../../../data/groundsCatalog';
import type { ClubPlot } from '../../../engine/groundsPlots';
import { Box, Car, Crane, Dish, Flat, GableRoof, P, Tent, Tree, WindowsFront, WindowsSide, pts, shade } from './isoKit';
import type { PlotCtx } from './PlotLayer';

interface Style { wall: string; roof: 'gable' | 'flat' | 'band'; roofColor?: string; win?: string; h: number; rows: number }

function hash(n: number): number { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function drawSiteBuilding(key: GroundsModuleKey, level: number, building: boolean, p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode; top3: number } {
  const { pal, primary, winter } = c;
  const walk = winter ? '#eef2f4' : '#c4beae';
  const lawn = winter ? '#e6ebe8' : shade(c.grass, 1.1);
  const hedge = winter ? '#aebdb4' : '#3d6d38';
  const lv = Math.max(1, level);
  const def = GROUNDS_BY_KEY[key].levels[lv - 1];
  const area = Math.max(1, def.area);
  const modern = pal.era === 2 ? '#eef1f3' : pal.era === 1 ? '#d9d4ca' : pal.wall;
  // Baukörper: wächst mit dem Flächenbedarf, bleibt im Grundstück; davor ein Vorplatz.
  const bw = Math.min(p.w - 1.8, 2.8 + area * 1.25), bd = Math.min(p.d - 2.6, 2.2 + area * 0.7);
  const bx = p.x + (p.w - bw) / 2, by = p.y + 0.9;
  const base = (
    <g>
      <Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={lawn} />
      <polygon points={pts(P(p.x, p.y, 0.02), P(p.x + p.w, p.y, 0.02), P(p.x + p.w, p.y + p.d, 0.02), P(p.x, p.y + p.d, 0.02))} fill="none" stroke={hedge} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
  );
  const forecourt = <Flat x={bx - 0.4} y={by + bd} w={bw + 0.8} d={p.y + p.d - by - bd - 0.3} fill={walk} />;
  const flag = (x: number, y: number) => (
    <g>
      <Box x={x - 0.06} y={y} w={0.12} d={0.12} h={2.6} color="#d5d9de" />
      <polygon points={pts(P(x, y + 0.06, 2.6), P(x + 1.2, y + 0.06, 2.35), P(x, y + 0.06, 2.05))} fill={primary} />
    </g>
  );
  const hall = (s: Style, extra?: ReactNode): ReactNode => (
    <g>
      <Box x={bx} y={by} w={bw} d={bd} h={s.h} color={s.wall}>
        <WindowsFront x={bx} w={bw} yf={by + bd} z0={0.35} rows={s.rows} color={s.win ?? pal.win} step={1.05} ww={0.7} wh={0.6} rowH={1.05} />
        <WindowsSide y={by} d={bd} xf={bx + bw} z0={0.35} rows={s.rows} color={s.win ?? pal.win} step={1.05} ww={0.7} wh={0.6} rowH={1.05} />
      </Box>
      {s.roof === 'gable' && <GableRoof x={bx - 0.12} y={by - 0.12} w={bw + 0.24} d={bd + 0.24} z={s.h} rh={0.95} color={winter ? '#e2e8ea' : s.roofColor ?? pal.roof} />}
      {s.roof === 'flat' && <Box x={bx - 0.15} y={by - 0.15} w={bw + 0.3} d={bd + 0.3} h={0.18} z={s.h} color={s.roofColor ?? pal.roof} />}
      {s.roof === 'band' && <>
        <Box x={bx - 0.15} y={by - 0.15} w={bw + 0.3} d={bd + 0.3} h={0.18} z={s.h} color={s.roofColor ?? pal.roof} />
        <Box x={bx - 0.2} y={by + bd - 0.25} w={bw + 0.4} d={0.45} h={0.38} z={s.h} color={primary} />
      </>}
      {extra}
    </g>
  );

  // Laufender Neubau: Fundament, Gerüst, Kran.
  if (level < 1) {
    const posts: ReactNode[] = [];
    for (let u = 0; u <= bw; u += bw / 4) posts.push(<Box key={u} x={bx + u - 0.05} y={by + bd - 0.1} w={0.1} d={0.1} h={1.6} color="#c98f2e" />);
    return {
      ground: <g><Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={winter ? '#e4e3da' : '#cdbf99'} /></g>,
      top: <g>
        <Box x={bx} y={by} w={bw} d={bd} h={0.35} color="#b9b4a8" top="#a59f93" />
        <Box x={bx} y={by} w={bw * 0.5} d={bd} h={0.9} z={0.35} color="#c9c3b6" />
        {posts}
        <Box x={bx} y={by + bd - 0.1} w={bw} d={0.08} h={0.08} z={0.8} color="#c98f2e" />
        <Box x={bx} y={by + bd - 0.1} w={bw} d={0.08} h={0.08} z={1.55} color="#c98f2e" />
        <Tent x={p.x + 0.8} y={p.y + p.d - 2} w={1.4} d={1.1} h={0.02} peak={0.6} color={winter ? '#e9ecec' : '#d9c68f'} />
        <Crane x={bx + bw + 0.5} y={by + bd + 0.4} h={6} />
      </g>,
      top3: 4,
    };
  }

  let ground: ReactNode = <g>{base}{forecourt}</g>;
  let top: ReactNode;
  let top3 = 4.2;
  switch (key) {
    case 'parking': {
      const cols = pal.era === 0 ? ['#c0392b', '#e1b12c', '#2e86de', '#6d4c41', '#7f8c8d'] : pal.era === 1 ? ['#2c3e50', '#bdc3c7', '#8e44ad', '#c0392b', '#16a085'] : ['#ecf0f1', '#2d3436', '#636e72', '#b2bec3', '#0984e3'];
      const ix = p.x + 0.5, iy = p.y + 0.6, iw = p.w - 1, id = p.d - 1.2;
      const perRow = Math.floor((iw - 0.4) / 2);
      const rowsN = Math.max(1, Math.floor((id - 0.4) / 2.4));
      const cars: ReactNode[] = [];
      for (let i = 0; i < perRow * rowsN; i++) if (hash(i + lv * 3) > 0.25) cars.push(<Car key={i} x={ix + 0.3 + (i % perRow) * 2} y={iy + 0.4 + Math.floor(i / perRow) * 2.4} color={cols[Math.floor(hash(i + c.year) * cols.length)]} era={c.year} />);
      ground = <g>{base}<Flat x={ix} y={iy} w={iw} d={id} fill={winter ? '#c7ccd1' : lv === 1 ? '#9d8f78' : '#4b5159'} /></g>;
      if (lv <= 2) { top = <g>{cars}</g>; top3 = 2.4; } else {
        const floors = lv === 3 ? 3 : 4;
        top = <g>
          <Box x={ix + 0.3} y={iy + 0.3} w={iw - 0.6} d={id - 1.6} h={floors * 0.9} color={pal.era === 2 ? '#b9c0c7' : '#a3a29b'} top="#5a6068">
            {Array.from({ length: floors }).map((_, f) => <polyline key={f} points={pts(P(ix + 0.3, iy + id - 1.3, f * 0.9 + 0.45), P(ix + iw - 0.3, iy + id - 1.3, f * 0.9 + 0.45))} stroke="#3c4046" strokeWidth={4} />)}
          </Box>
          {lv === 4 && <Box x={ix + iw - 2} y={iy + id - 1.5} w={1.4} d={0.2} h={1} z={floors * 0.9} color="#2d3b2f" top="#3ddc84" />}
        </g>;
        top3 = floors + 2;
      }
      break;
    }
    case 'fanZone': {
      const ix = p.x + 0.5, iy = p.y + 0.6;
      ground = <g>{base}<Flat x={ix} y={iy} w={p.w - 1} d={p.d - 1.2} fill={winter ? '#d6dade' : '#8b8f86'} /></g>;
      top = <g>
        <Box x={ix + 0.6} y={iy + 0.3} w={3.2} d={0.25} h={1.6} z={1.5} color="#1b2026" top="#1b2026" />
        <Box x={ix + 1} y={iy + 0.3} w={0.2} d={0.2} h={1.5} color="#555" />
        <Box x={ix + 3.2} y={iy + 0.3} w={0.2} d={0.2} h={1.5} color="#555" />
        <polygon points={pts(P(ix + 0.75, iy + 0.56, 1.65), P(ix + 3.65, iy + 0.56, 1.65), P(ix + 3.65, iy + 0.56, 2.95), P(ix + 0.75, iy + 0.56, 2.95))} fill="#4f9a45" opacity={0.9} />
        <Tent x={ix + p.w - 4} y={iy + 0.5} w={2} d={1.6} h={0.9} color="#f4f2ee" peak={0.8} />
        <Tent x={ix + p.w - 4} y={iy + 2.6} w={2} d={1.6} h={0.9} color={primary} peak={0.8} />
        {lv >= 2 && <Box x={ix + 0.8} y={iy + p.d - 3} w={3} d={1.2} h={0.6} color="#3a3f46" top="#2a2e33" />}
      </g>;
      top3 = 4;
      break;
    }
    case 'familyBlock': {
      const ix = p.x + 0.6, iy = p.y + 0.7;
      ground = <g>{base}<Flat x={ix} y={iy} w={p.w - 1.2} d={p.d - 1.4} fill={winter ? '#e2e6e3' : '#d8c08a'} /></g>;
      top = <g>
        <Box x={ix + 0.4} y={iy + 0.4} w={1.6} d={1.3} h={0.95} color="#e9dfc4" top="#f2a541" />
        <Box x={ix + 2.6} y={iy + 0.5} w={0.9} d={0.9} h={1.4} color="#e85d75" />
        <polygon points={pts(P(ix + 3.5, iy + 0.7, 1.4), P(ix + 5.1, iy + 0.7, 0.1), P(ix + 5.1, iy + 1.3, 0.1), P(ix + 3.5, iy + 1.3, 1.4))} fill="#4fb3d9" />
        <Box x={ix + 0.6} y={iy + 2.4} w={1.2} d={1.2} h={0.5} color="#7cc36b" />
        <Box x={ix + 2.6} y={iy + 2.6} w={1.8} d={1} h={0.3} color="#f2a541" />
        {flag(ix + 0.2, iy + p.d - 2.2)}
      </g>;
      top3 = 3;
      break;
    }
    case 'hospitality':
      top = lv === 1
        ? <g><Tent x={bx} y={by} w={bw} d={bd} h={1.1} color="#f6f3ec" peak={1.3} />{flag(bx + bw + 0.3, by + bd)}</g>
        : hall({ wall: lv === 3 ? '#2f3a44' : modern, roof: 'band', win: lv === 3 ? '#ffd58a' : pal.win, h: lv === 3 ? 2.8 : 1.9, rows: lv === 3 ? 2 : 1 }, flag(bx - 0.3, by + bd + 0.5));
      break;
    case 'vereinsheim': {
      const h = lv >= 3 ? 2.2 : 1.5;
      top = hall({ wall: lv === 1 && pal.era === 0 ? '#8a6a46' : pal.wall, roof: pal.era === 0 || lv < 3 ? 'gable' : 'flat', roofColor: lv === 1 && pal.era === 0 ? '#4e3b2a' : undefined, win: '#ffd58a', h, rows: lv >= 3 ? 2 : 1 }, <g>
        {lv >= 2 && <Box x={bx} y={by + bd} w={bw} d={1} h={0.1} color="#b38b5d" />}
        {lv >= 2 && [0.4, 1.6, 2.8].filter((o) => o + 0.6 < bw).map((o) => <Box key={o} x={bx + o} y={by + bd + 0.25} w={0.6} d={0.5} h={0.3} z={0.1} color="#e9dfc4" top={primary} />)}
        {flag(bx + bw + 0.3, by + bd)}
      </g>);
      top3 = h + 2.4;
      break;
    }
    case 'museum': {
      const h = lv >= 2 ? 3 : 2.2;
      top = <g>
        <Box x={bx} y={by} w={bw} d={bd} h={h} color={lv >= 2 ? '#e3e6ea' : '#d8cfc0'}>
          {lv === 1 && Array.from({ length: Math.floor(bw / 1.2) }).map((_, i) => <polygon key={i} points={pts(P(bx + 0.4 + i * 1.2, by + bd, 0.2), P(bx + 0.8 + i * 1.2, by + bd, 0.2), P(bx + 0.8 + i * 1.2, by + bd, 1.9), P(bx + 0.4 + i * 1.2, by + bd, 1.9))} fill="#f5efe2" />)}
          {lv >= 2 && <WindowsFront x={bx} w={bw} yf={by + bd} z0={0.3} rows={2} color="#8fc2dc" step={1} ww={0.8} rowH={1.3} />}
        </Box>
        {lv === 1 ? <GableRoof x={bx} y={by} w={bw} d={bd} z={h} rh={0.8} color={winter ? '#e2e8ea' : '#8a8f96'} /> : <Box x={bx - 0.2} y={by - 0.2} w={bw + 0.4} d={bd + 0.4} h={0.25} z={h} color={primary} />}
        {flag(bx - 0.3, by + bd + 0.5)}
      </g>;
      top3 = h + 2;
      break;
    }
    case 'megastore': {
      const h = lv >= 3 ? 2.4 : 1.8;
      top = <g>
        <Box x={bx} y={by} w={bw} d={bd} h={h} color={lv >= 3 ? '#2f3a44' : modern}>
          <WindowsFront x={bx} w={bw} yf={by + bd} z0={0.2} rows={1} color="#ffe9a8" step={1.1} ww={0.9} wh={1.1} />
        </Box>
        <Box x={bx - 0.2} y={by + bd - 0.3} w={bw + 0.4} d={0.5} h={0.4} z={h} color={primary} />
      </g>;
      top3 = h + 2;
      break;
    }
    case 'onlineShop':
      top = hall({ wall: lv >= 3 ? '#cfd5da' : '#b8b2a6', roof: 'flat', h: lv >= 3 ? 2 : 1.6, rows: 0 }, <g>
        <polygon points={pts(P(bx + 0.5, by + bd, 0), P(bx + 1.9, by + bd, 0), P(bx + 1.9, by + bd, 1.1), P(bx + 0.5, by + bd, 1.1))} fill="#5a6068" />
        <Box x={bx + 2.4} y={by + bd + 0.5} w={0.8} d={0.8} h={0.5} color="#c49a68" />
        <Box x={bx + 3.3} y={by + bd + 0.6} w={0.6} d={0.6} h={0.4} color={lv >= 3 ? '#f2a541' : '#e8e2d2'} />
      </g>);
      break;
    case 'press': {
      const h = lv >= 4 ? 2.6 : 1.7;
      top = hall({ wall: lv >= 4 ? '#3d4d5c' : modern, roof: 'flat', win: lv >= 4 ? '#7fd4f0' : pal.win, h, rows: lv >= 4 ? 2 : 1 }, <g>
        {lv >= 3 && <Dish x={bx + bw * 0.7} y={by + bd * 0.5} z={h + 0.2} r={6} />}
        {lv >= 3 && <Box x={bx + bw + 0.3} y={by + bd - 1} w={1.8} d={0.9} h={0.9} color="#e8edf1" />}
      </g>);
      top3 = h + 2.2;
      break;
    }
    case 'stewards':
      top = hall({ wall: '#3d4d5c', roof: 'flat', win: '#7fd4f0', h: 1.7, rows: 1 }, <Box x={bx + bw - 0.6} y={by + 0.3} w={0.15} d={0.15} h={1.8} z={1.7} color="#d5d9de" />);
      break;
    case 'fanProject':
      top = hall({ wall: lv === 1 ? '#4f7f9c' : pal.wall, roof: lv === 1 ? 'flat' : 'gable', win: '#ffd58a', h: lv === 1 ? 1.3 : 1.8, rows: 1 }, flag(bx + bw + 0.3, by + bd));
      break;
    case 'choreoRoom': {
      const h = lv >= 2 ? 1.9 : 1.4;
      top = <g>
        <Box x={bx} y={by} w={bw} d={bd} h={h} color="#5e5a57">
          <polygon points={pts(P(bx + 0.2, by + bd, 0.2), P(bx + bw - 0.2, by + bd, 0.2), P(bx + bw - 0.2, by + bd, h - 0.3), P(bx + 0.2, by + bd, h - 0.3))} fill={primary} opacity={0.9} />
          <polygon points={pts(P(bx + bw * 0.25, by + bd, 0.4), P(bx + bw * 0.75, by + bd, 0.4), P(bx + bw * 0.75, by + bd, 0.9), P(bx + bw * 0.25, by + bd, 0.9))} fill="#f4f2ee" opacity={0.9} />
        </Box>
      </g>;
      top3 = h + 2;
      break;
    }
    default:
      top = hall({ wall: modern, roof: pal.era === 0 ? 'gable' : 'band', h: 1.8, rows: 1 }, flag(bx + bw + 0.3, by + bd));
  }
  return {
    ground,
    top: <g>
      {top}
      {p.w > 6.5 && key !== 'parking' && key !== 'fanZone' && <Tree x={p.x + p.w - 0.8} y={p.y + p.d - 0.9} s={0.45} snow={winter} color={c.autumn ? '#c9822c' : '#4b8a40'} />}
      {building && <Crane x={bx + bw + 0.5} y={by + bd + 0.4} h={6.5} />}
    </g>,
    top3,
  };
}

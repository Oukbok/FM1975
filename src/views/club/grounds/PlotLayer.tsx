// =============================================================================
// VEREINSGELÄNDE — Nachbargrundstücke rund um den Campus (Wunsch Pascal: keine
// leeren Grundstücke). Karte und Regeln: engine/groundsPlots.ts.
//   • kaufbar: gezeichnet nach Art (Brachland, Kleingärten, Wohnhäuser, Gewerbe),
//     anklickbar, kleines Schild mit Art und Größe
//   • nicht kaufbar: normale Nachbarschaft (Häuser), nicht anklickbar
//   • gekauft: geräumtes Bauland mit Bauzaun und Bauschild in Vereinsfarbe
//   • bebaut: Gebäude des Umfeld-Moduls (PlotBuildings.tsx) mit Namensschild
// =============================================================================
import type { ReactNode } from 'react';
import type { Club } from '../../../types';
import type { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_BY_KEY } from '../../../data/groundsCatalog';
import { ClubPlot, PLOT_KINDS, isOwned, plotsOf, siteOf } from '../../../engine/groundsPlots';
import { Box, Fence, Flat, GableRoof, P, Tent, Tree, WindowsFront, pts, shade } from './isoKit';
import { drawSiteBuilding } from './PlotBuildings';

export type PlotKey = `plot:${string}`;
export const plotKey = (id: string): PlotKey => `plot:${id}`;
export const isPlotKey = (k: string | null): k is PlotKey => !!k && k.startsWith('plot:');

export interface PlotCtx {
  club: Club;
  gr: ClubGrounds;
  year: number;
  winter: boolean;
  autumn: boolean;
  grass: string;
  pal: { wall: string; roof: string; win: string; concrete: string; era: number };
  primary: string;
  /** Gerade überfahren oder gewählt: dort zeigt die Szene ihr eigenes Schild, das feste entfällt. */
  active: (k: PlotKey | GroundsModuleKey) => boolean;
  G: (k: PlotKey | GroundsModuleKey, depth: number, node: ReactNode, label: [number, number, number]) => void;
  plain: (key: string, depth: number, node: ReactNode) => void;
}

function seed(id: string): (i: number) => number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return (i: number) => { const x = Math.sin((h + i * 17.3) * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
}

/** Schild mittig über dem Grundstück (schwebt über den Dächern, dünner Stiel bis zum Boden). */
function tag(key: string, p: ClubPlot, text: string, own: boolean, primary: string, z = TAG_Z): ReactNode {
  const cx = p.x + p.w / 2, cy = p.y + p.d / 2;
  const [sx, sy] = P(cx, cy, z);
  const [gx, gy] = P(cx, cy, 0.1);
  const w = text.length * 6.7 + (own ? 20 : 16);
  const x0 = sx - w / 2;
  return (
    <g key={key} pointerEvents="none">
      <line x1={gx} y1={gy} x2={sx} y2={sy + 5} stroke={own ? 'rgba(18,28,44,0.7)' : 'rgba(40,52,68,0.5)'} strokeWidth={1.2} />
      <rect x={x0} y={sy - 13} width={w} height={18} rx={3} fill={own ? 'rgba(18,28,44,0.9)' : 'rgba(244,246,248,0.94)'} stroke={own ? 'none' : 'rgba(40,52,68,0.55)'} strokeWidth={own ? 0 : 0.8} />
      {own && <rect x={x0} y={sy - 13} width={3.5} height={18} rx={1.2} fill={primary} />}
      <text x={sx + (own ? 2 : 0)} y={sy} textAnchor="middle" fill={own ? '#fff' : '#243040'} fontSize={10.5} fontWeight={700} letterSpacing={0.4}>{text.toUpperCase()}</text>
    </g>
  );
}
const TAG_Z = 3;

// ------------------------------------------------------------------ Arten
function brache(p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode } {
  const r = seed(p.id);
  const g0 = c.winter ? '#d9dedb' : '#8f8c5d';
  const patches: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const pw = 1 + r(i) * 2, pd = 0.8 + r(i + 20) * 1.6;
    const px = p.x + 0.3 + r(i + 40) * (p.w - pw - 0.6), py = p.y + 0.3 + r(i + 60) * (p.d - pd - 0.6);
    patches.push(<Flat key={i} x={px} y={py} w={pw} d={pd} fill={c.winter ? (i % 2 ? '#c9cfc9' : '#e9eeeb') : ['#6f8045', '#a69872', '#7d8a4d', '#9a8f66'][i % 4]} opacity={0.85} />);
  }
  const sx = p.x + p.w - 2.6, sy = p.y + 0.7;
  const bushes: ReactNode[] = [];
  for (let i = 0; i < 4; i++) bushes.push(<Tree key={i} x={p.x + 0.8 + r(i + 80) * (p.w - 3.6)} y={p.y + 1.2 + r(i + 90) * (p.d - 2)} s={0.3 + r(i + 5) * 0.12} snow={c.winter} color={c.autumn ? '#8f7a3a' : '#5d7a3a'} />);
  const hx = p.x + 0.9 + r(3) * (p.w * 0.35), hy = p.y + p.d - 2.1;
  return {
    ground: <g><Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={g0} />{patches}</g>,
    top: (
      <g>
        {/* alter Schuppen mit Rostdach */}
        <Box x={sx} y={sy} w={1.9} d={1.4} h={0.95} color="#7a6a55">
          <polygon points={pts(P(sx + 0.3, sy + 1.4, 0), P(sx + 0.9, sy + 1.4, 0), P(sx + 0.9, sy + 1.4, 0.7), P(sx + 0.3, sy + 1.4, 0.7))} fill="#4b4036" />
        </Box>
        <GableRoof x={sx - 0.1} y={sy - 0.1} w={2.1} d={1.6} z={0.95} rh={0.45} color={c.winter ? '#dfe5e6' : '#8a4b32'} />
        {/* Schutthaufen und Gerümpel */}
        <Tent x={hx} y={hy} w={1.5} d={1.2} h={0.02} peak={0.55} color="#8f897c" />
        <Box x={hx + 1.8} y={hy + 0.4} w={0.55} d={0.4} h={0.25} color="#a59f93" />
        <Box x={hx + 2.3} y={hy - 0.2} w={0.4} d={0.5} h={0.35} color="#7f7a70" />
        <Box x={hx - 0.6} y={hy + 0.7} w={0.9} d={0.25} h={0.15} color="#6b5a45" />
        {bushes}
        <Fence x={p.x + 0.1} y={p.y + 0.1} w={p.w - 0.2} d={p.d - 0.2} color={c.winter ? '#9a958a' : '#6f6553'} />
      </g>
    ),
  };
}

function garten(p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode } {
  const r = seed(p.id);
  const lawn = c.winter ? '#dfe6e1' : '#7aa35a';
  const hedge = c.winter ? '#aebdb4' : '#3d6d38';
  const roofs = ['#b5503c', '#3f6d8a', '#5b7d4a', '#c9a23c', '#8a5a7a'];
  const cols = Math.max(2, Math.round(p.w / 2.4)), rows = p.d >= 6 ? 2 : 1;
  const cw = (p.w - 0.4) / cols, pathD = rows === 2 ? 0.7 : 0;
  const cd = (p.d - 0.4 - pathD) / rows;
  const beds: ReactNode[] = [], huts: ReactNode[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    const x = p.x + 0.2 + i * cw, y = p.y + 0.2 + j * (cd + pathD);
    beds.push(<g key={k}>
      <Flat x={x} y={y} w={cw} d={cd} fill={c.winter ? (k % 2 ? '#d5ddd7' : '#e6ece8') : k % 2 ? '#6b9a4a' : '#8bb565'} />
      <Flat x={x + 0.25} y={y + cd * 0.55} w={cw - 0.5} d={cd * 0.16} fill={c.winter ? '#c3c7c0' : '#7b5b3c'} />
      <Flat x={x + 0.25} y={y + cd * 0.76} w={cw - 0.5} d={cd * 0.14} fill={c.winter ? '#c9cdc6' : r(k) > 0.5 ? '#86663f' : '#5f8a3c'} />
      <polygon points={pts(P(x, y, 0.02), P(x + cw, y, 0.02), P(x + cw, y + cd, 0.02), P(x, y + cd, 0.02))} fill="none" stroke={hedge} strokeWidth={1.6} strokeLinejoin="round" />
    </g>);
    const hw = Math.min(1.1, cw - 0.7), hx = x + 0.3 + r(k + 9) * (cw - hw - 0.6), hy = y + 0.3;
    huts.push(<g key={k}>
      <Box x={hx} y={hy} w={hw} d={0.85} h={0.6} color={['#d9cdb4', '#b98f72', '#e6e0d2', '#9db3a0'][k % 4]} />
      <GableRoof x={hx - 0.08} y={hy - 0.08} w={hw + 0.16} d={1.01} z={0.6} rh={0.4} color={c.winter ? '#e4eaec' : roofs[(k + Math.floor(r(1) * 5)) % roofs.length]} />
    </g>);
  }
  return {
    ground: <g>
      <Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={lawn} />
      {rows === 2 && <Flat x={p.x} y={p.y + 0.2 + cd} w={p.w} d={pathD} fill={c.winter ? '#eef2f4' : '#c9bd9c'} />}
      {beds}
    </g>,
    top: <g>
      {huts}
      <Tree x={p.x + p.w - 0.9} y={p.y + p.d - 0.9} s={0.42} snow={c.winter} color={c.autumn ? '#c9822c' : '#4b8a40'} />
      <Box x={p.x + 0.5} y={p.y + p.d - 0.5} w={0.08} d={0.08} h={1.6} color="#d5d9de" />
      <polygon points={pts(P(p.x + 0.54, p.y + p.d - 0.46, 1.6), P(p.x + 1.3, p.y + p.d - 0.46, 1.45), P(p.x + 0.54, p.y + p.d - 0.46, 1.25))} fill="#d8b23c" />
    </g>,
  };
}

function haeuser(p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode } {
  const r = seed(p.id);
  const lawn = c.winter ? '#e1e7e3' : shade(c.grass, 1.06);
  const hedge = c.winter ? '#aebdb4' : '#3d6d38';
  const walls = ['#d8cdb8', '#c9b8a0', '#e2d9c8', '#b98f72', '#cfc6b4'];
  const roofs = ['#9a4a38', '#6d4a3d', '#7d4436', '#5b5f66'];
  const n = Math.max(2, Math.min(4, Math.round(p.w / 2.7)));
  const cw = p.w / n;
  const ground: ReactNode[] = [], top: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = p.x + i * cw;
    const hw = Math.min(2.3, cw - 0.9), hd = Math.min(2.2, p.d * 0.42), hh = 1.25 + r(i) * 0.5;
    const hx = x + (cw - hw) / 2, hy = p.y + 0.6 + r(i + 7) * 0.5;
    ground.push(<g key={i}>
      <polygon points={pts(P(x + 0.1, p.y + 0.1, 0.02), P(x + cw - 0.1, p.y + 0.1, 0.02), P(x + cw - 0.1, p.y + p.d - 0.1, 0.02), P(x + 0.1, p.y + p.d - 0.1, 0.02))} fill="none" stroke={hedge} strokeWidth={1.8} strokeLinejoin="round" />
      <Flat x={hx + hw * 0.35} y={hy + hd} w={0.6} d={p.y + p.d - hy - hd} fill={c.winter ? '#eef2f4' : '#c4beae'} />
      {p.d > 5.5 && <Flat x={x + 0.5} y={p.y + p.d - 1.6} w={cw * 0.4} d={1} fill={c.winter ? '#cfd4cf' : r(i + 3) > 0.5 ? '#7b5b3c' : '#c96f8a'} opacity={0.8} />}
    </g>);
    top.push(<g key={i}>
      <Box x={hx} y={hy} w={hw} d={hd} h={hh} color={walls[Math.floor(r(i + 11) * walls.length)]}>
        <WindowsFront x={hx} w={hw} yf={hy + hd} z0={0.35} rows={hh > 1.5 ? 2 : 1} color={c.pal.win} step={0.9} ww={0.5} wh={0.45} rowH={0.75} />
      </Box>
      <GableRoof x={hx - 0.12} y={hy - 0.12} w={hw + 0.24} d={hd + 0.24} z={hh} rh={0.85} color={c.winter ? '#e2e8ea' : roofs[Math.floor(r(i + 13) * roofs.length)]} />
      <Box x={hx + hw * 0.7} y={hy + hd * 0.3} w={0.22} d={0.22} h={0.7} z={hh + 0.3} color="#7a5a4a" />
      {p.d > 5 && <Tree x={x + cw - 0.9} y={p.y + p.d - 1.1} s={0.38 + r(i + 5) * 0.12} snow={c.winter} color={c.autumn && i % 2 ? '#c9822c' : '#4b8a40'} />}
    </g>);
  }
  return { ground: <g><Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={lawn} />{ground}</g>, top: <g>{top}</g> };
}

function gewerbe(p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode } {
  const r = seed(p.id);
  const yard = c.winter ? '#c7ccd1' : '#6a7078';
  const hw = p.w * 0.56, hd = Math.min(p.d - 1.6, p.d * 0.6), hx = p.x + 0.5, hy = p.y + 0.5, hh = 1.7;
  const ox = hx + hw + 0.4, ow = Math.max(1.4, p.w - hw - 1.4), od = Math.min(2, p.d * 0.34);
  const truckX = hx + hw * 0.2, truckY = hy + hd + 0.5;
  const fits = truckY + 0.9 < p.y + p.d - 0.2;
  return {
    ground: <g>
      <Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={yard} />
      <Flat x={p.x + p.w * 0.55} y={p.y + p.d - 1.4} w={p.w * 0.38} d={1} fill={c.winter ? '#b8bdc2' : '#5b6068'} />
    </g>,
    top: <g>
      {/* Halle mit Rolltor und Fensterband */}
      <Box x={hx} y={hy} w={hw} d={hd} h={hh} color={c.pal.era === 0 ? '#a39c8c' : '#aeb4ba'} top={c.winter ? '#e6ebed' : '#7d858d'}>
        <polygon points={pts(P(hx + 0.5, hy + hd, 0), P(hx + 1.9, hy + hd, 0), P(hx + 1.9, hy + hd, 1.2), P(hx + 0.5, hy + hd, 1.2))} fill="#4d5560" />
        <polygon points={pts(P(hx + 2.3, hy + hd, 1), P(hx + hw - 0.3, hy + hd, 1), P(hx + hw - 0.3, hy + hd, 1.35), P(hx + 2.3, hy + hd, 1.35))} fill={c.pal.win} opacity={0.8} />
      </Box>
      <Box x={hx + hw - 0.9} y={hy + 0.4} w={0.35} d={0.35} h={1.5} z={hh} color="#8a5a48" />
      {/* Büro/Werkstatt in Backstein */}
      <Box x={ox} y={hy} w={ow} d={od} h={1.1} color="#9b5a43" top={c.winter ? '#e4e9eb' : '#5b5f66'}>
        <WindowsFront x={ox} w={ow} yf={hy + od} z0={0.35} rows={1} color={c.pal.win} step={0.8} ww={0.5} wh={0.45} />
      </Box>
      {/* Lieferwagen, Paletten, Tonnen */}
      {fits && <g>
        <Box x={truckX} y={truckY} w={1.7} d={0.85} h={0.85} color="#e8e2d2" />
        <Box x={truckX + 1.7} y={truckY + 0.05} w={0.6} d={0.75} h={0.6} color={['#2e6da4', '#b5503c', '#3f7a52'][Math.floor(r(2) * 3)]} top="#9fc3d6" />
      </g>}
      <Box x={ox + 0.2} y={hy + od + 0.6} w={0.8} d={0.8} h={0.3} color="#b38b5d" />
      <Box x={ox + 0.25} y={hy + od + 0.65} w={0.7} d={0.7} h={0.3} z={0.3} color="#c49a68" />
      <Box x={ox + 1.2} y={hy + od + 0.7} w={0.35} d={0.35} h={0.5} color="#3f6d8a" />
      <Box x={ox + 1.2} y={hy + od + 1.2} w={0.35} d={0.35} h={0.5} color="#b5503c" />
      <Fence x={p.x + 0.1} y={p.y + 0.1} w={p.w - 0.2} d={p.d - 0.2} color="#9aa3ab" />
    </g>,
  };
}

/** Gekauftes, freies Grundstück: planiertes Bauland mit Bauzaun und Bauschild. */
function bauland(p: ClubPlot, c: PlotCtx): { ground: ReactNode; top: ReactNode } {
  const g0 = c.winter ? '#e4e3da' : '#cdbf99';
  const bx = p.x + p.w / 2 - 1.2, by = p.y + p.d - 0.9;
  const cx = p.x + p.w * 0.25, cy = p.y + p.d * 0.3;
  return {
    ground: <g>
      <Flat x={p.x} y={p.y} w={p.w} d={p.d} fill={g0} />
      <Flat x={p.x + 0.6} y={p.y + 0.6} w={p.w - 1.2} d={p.d - 1.2} fill={shade(g0, 1.05)} />
      {/* abgesteckte Parzellen */}
      {Array.from({ length: p.size - 1 }).map((_, i) => {
        const u = p.x + ((i + 1) * p.w) / p.size;
        return <polyline key={i} points={pts(P(u, p.y + 0.7, 0.02), P(u, p.y + p.d - 0.7, 0.02))} stroke={c.winter ? '#b9b7aa' : '#a8986f'} strokeWidth={1} strokeDasharray="5 5" fill="none" />;
      })}
      <polyline points={pts(P(p.x + 0.8, p.y + p.d * 0.62, 0.02), P(p.x + p.w - 0.8, p.y + p.d * 0.5, 0.02))} stroke={shade(g0, 0.86)} strokeWidth={2.4} fill="none" opacity={0.7} />
      <polyline points={pts(P(p.x + 0.8, p.y + p.d * 0.72, 0.02), P(p.x + p.w - 0.8, p.y + p.d * 0.6, 0.02))} stroke={shade(g0, 0.86)} strokeWidth={2.4} fill="none" opacity={0.7} />
    </g>,
    top: <g>
      {/* Kieshaufen, Rohre, Baucontainer */}
      <Tent x={cx} y={cy} w={1.6} d={1.3} h={0.02} peak={0.7} color={c.winter ? '#e9ecec' : '#d9c68f'} />
      <Box x={cx + 2.1} y={cy + 0.2} w={1.5} d={0.3} h={0.28} color="#9aa3ab" />
      <Box x={cx + 2.1} y={cy + 0.55} w={1.5} d={0.3} h={0.28} color="#8c959d" />
      {p.w > 6 && <Box x={p.x + p.w - 2.6} y={p.y + 0.8} w={1.9} d={0.9} h={0.85} color="#e0a23a" top={c.winter ? '#eef1f2' : '#c98f2e'}>
        <polygon points={pts(P(p.x + p.w - 2.3, p.y + 1.7, 0.3), P(p.x + p.w - 1.7, p.y + 1.7, 0.3), P(p.x + p.w - 1.7, p.y + 1.7, 0.65), P(p.x + p.w - 2.3, p.y + 1.7, 0.65))} fill="#cfe6f2" />
      </Box>}
      {/* Bauschild in Vereinsfarbe */}
      <Box x={bx + 0.2} y={by} w={0.1} d={0.1} h={1.5} color="#6b5a45" />
      <Box x={bx + 2.1} y={by} w={0.1} d={0.1} h={1.5} color="#6b5a45" />
      <Box x={bx} y={by + 0.02} w={2.4} d={0.08} h={0.9} z={0.75} color={c.primary} />
      <polygon points={pts(P(bx + 0.15, by + 0.1, 1.2), P(bx + 2.25, by + 0.1, 1.2), P(bx + 2.25, by + 0.1, 1.45), P(bx + 0.15, by + 0.1, 1.45))} fill="#ffffff" opacity={0.92} />
      <polygon points={pts(P(bx + 0.15, by + 0.1, 0.9), P(bx + 1.5, by + 0.1, 0.9), P(bx + 1.5, by + 0.1, 1.05), P(bx + 0.15, by + 0.1, 1.05))} fill="#ffffff" opacity={0.7} />
      <Fence x={p.x + 0.1} y={p.y + 0.1} w={p.w - 0.2} d={p.d - 0.2} color={c.winter ? '#9aa3ab' : '#d7dbe0'} />
    </g>,
  };
}

const KIND_DRAW = { brache, garten, haeuser, gewerbe };

/** Alle Grundstücke der Karte zeichnen. Liefert die Schilder (liegen über allem). */
export function drawPlots(c: PlotCtx): ReactNode[] {
  const signs: ReactNode[] = [];
  for (const p of plotsOf(c.club, c.gr)) {
    const back = p.x + p.y + 0.01, front = p.x + p.w + p.y + p.d;
    const label: [number, number, number] = [p.x + p.w / 2, p.y + p.d / 2, TAG_Z - 0.65];
    if (!p.buyable) {
      const n = haeuser(p, c);
      c.plain(`plotg${p.id}`, back, <g pointerEvents="none">{n.ground}</g>);
      c.plain(`plott${p.id}`, front, <g pointerEvents="none">{n.top}</g>);
      continue;
    }
    const key = plotKey(p.id);
    if (!isOwned(c.gr, p.id)) {
      const n = KIND_DRAW[p.kind](p, c);
      c.G(key, back, n.ground, label);
      c.G(key, front, n.top, label);
      if (!c.active(key)) signs.push(tag(`ps${p.id}`, p, `${PLOT_KINDS[p.kind].name} · ${p.size} Parz.`, false, c.primary));
      continue;
    }
    const site = siteOf(c.gr, p.id);
    if (!site) {
      const n = bauland(p, c);
      c.G(key, back, n.ground, label);
      c.G(key, front, n.top, label);
      if (!c.active(key)) signs.push(tag(`ps${p.id}`, p, `Bauland · ${p.size} Parzellen`, true, c.primary));
      continue;
    }
    // Bebaut: Klick öffnet die Details des Moduls.
    const lv = c.gr.modules[site]?.level ?? 0;
    const proj = c.gr.projects.find((x) => x.module === site);
    const n = drawSiteBuilding(site, lv, !!proj, p, c);
    const z = Math.max(TAG_Z, n.top3 + 0.4);
    c.G(site, back, n.ground, [label[0], label[1], z - 0.65]);
    c.G(site, front, n.top, [label[0], label[1], z - 0.65]);
    const m = GROUNDS_BY_KEY[site];
    if (!c.active(site)) signs.push(tag(`ps${p.id}`, p, lv ? m.levels[lv - 1].name : `Im Bau: ${m.name}`, true, c.primary, z));
  }
  return signs;
}

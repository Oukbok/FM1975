// =============================================================================
// JUGEND › JUGENDCAMPS – Weltkarte der Standorte (Umrisse data/campWorldMap.ts,
// Natural Earth). Umrisse skaliert als Gruppe, Punkte/Beschriftung in Pixeln
// (ResizeObserver), damit Schrift und Punkte auf jeder Auflösung gleich groß sind.
// Zustand je Standort: eigenes Camp | möglich | erst später.
// =============================================================================
import { useLayoutEffect, useRef, useState } from 'react';
import { WORLD_BORDERS, WORLD_LAND } from '../../../data/campWorldMap';
import type { CampSite } from '../../../data/youthCampSites';

export type SiteState = 'own' | 'open' | 'later';
export interface MapSite { s: CampSite; state: SiteState; label: string }

const VIEW = { lon: [-125, 150], lat: [-42, 64] }; // Amerika bis Ostasien
const HOME: [number, number] = [50.6, 9.5]; // Rückfall: Mitte Deutschlands

export function CampWorldMap({ sites, selected, onSelect, homeGeo }: { sites: MapSite[]; selected: string; onSelect: (id: string) => void; homeGeo?: [number, number] }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 400 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth || 1000, h: el.clientHeight || 400 });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const vw = VIEW.lon[1] - VIEW.lon[0], vh = VIEW.lat[1] - VIEW.lat[0];
  const k = Math.min(size.w / vw, size.h / vh);
  const ox = (size.w - vw * k) / 2 - VIEW.lon[0] * k;
  const oy = (size.h - vh * k) / 2 + VIEW.lat[1] * k;
  const px = (g: [number, number]) => ({ x: ox + g[1] * k, y: oy - g[0] * k });
  const home = px(homeGeo ?? HOME);
  // Beschriftung: rechts, sonst links (einfacher Platztest).
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const place = (p: { x: number; y: number }, text: string) => {
    const w = text.length * 7.4 + 6;
    for (const side of ['r', 'l', 'u', 'd'] as const) {
      const r = side === 'r' ? { x0: p.x + 10, x1: p.x + 10 + w, y0: p.y - 9, y1: p.y + 7 }
        : side === 'l' ? { x0: p.x - 10 - w, x1: p.x - 10, y0: p.y - 9, y1: p.y + 7 }
          : side === 'u' ? { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - 26, y1: p.y - 10 }
            : { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y + 9, y1: p.y + 25 };
      if (boxes.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) continue;
      boxes.push(r);
      return side === 'r' ? { x: r.x0, y: p.y + 4, a: 'start' as const } : side === 'l' ? { x: r.x1, y: p.y + 4, a: 'end' as const }
        : { x: p.x, y: side === 'u' ? p.y - 14 : p.y + 21, a: 'middle' as const };
    }
    return null;
  };
  // Punkte sind Hindernisse für Beschriftungen.
  for (const x of sites) { const p = px(x.s.geo); boxes.push({ x0: p.x - 7, x1: p.x + 7, y0: p.y - 7, y1: p.y + 7 }); }
  boxes.push({ x0: home.x - 7, x1: home.x + 7, y0: home.y - 7, y1: home.y + 7 });
  const order = [...sites].sort((a, b) => (b.s.id === selected ? 1 : 0) - (a.s.id === selected ? 1 : 0) || (a.state === 'own' ? -1 : 0));
  return (
    <div className="ycm" ref={box}>
      <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} role="img" aria-label="Weltkarte der Jugendcamps">
        <rect width={size.w} height={size.h} className="ycm-sea" />
        <g transform={`translate(${ox} ${oy}) scale(${k})`}>
          <path d={WORLD_LAND} className="ycm-land" vectorEffect="non-scaling-stroke" />
          <path d={WORLD_BORDERS} className="ycm-border" vectorEffect="non-scaling-stroke" />
        </g>
        {sites.filter((x) => x.state === 'own').map((x) => { const p = px(x.s.geo); return <line key={`l-${x.s.id}`} x1={home.x} y1={home.y} x2={p.x} y2={p.y} className="ycm-route" />; })}
        <circle cx={home.x} cy={home.y} r={6} className="ycm-home" />
        {order.map((x) => {
          const p = px(x.s.geo);
          const lb = place(p, x.label);
          const sel = x.s.id === selected;
          return (
            <g key={x.s.id} className={`ycm-site ${x.state} ${sel ? 'sel' : ''}`} onClick={() => onSelect(x.s.id)} role="button" aria-label={x.s.name}>
              <circle cx={p.x} cy={p.y} r={14} className="ycm-hit" />
              {sel && <circle cx={p.x} cy={p.y} r={10} className="ycm-ring" />}
              <circle cx={p.x} cy={p.y} r={x.state === 'own' ? 6.5 : 5} className="ycm-dot" />
              {lb && <text x={lb.x} y={lb.y} textAnchor={lb.a} className="ycm-label">{x.label}</text>}
            </g>
          );
        })}
      </svg>
      <div className="ycm-legend">
        <span><i className="own" />Eigenes Camp</span>
        <span><i className="open" />Möglich</span>
        <span><i className="later" />Später</span>
        <span><i className="home" />Dein Verein</span>
      </div>
    </div>
  );
}

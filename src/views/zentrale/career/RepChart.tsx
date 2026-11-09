// Ansehen je Saison: weiche Kurve (ui/smoothPath) mit leichter Fläche darunter; Punkt nur am
// Ende (laufende Saison) und unter der Maus, dazu eine senkrechte Hilfslinie und der Wert.
import { useEffect, useRef, useState } from 'react';
import { smoothArea, smoothPath, type Pt } from '../../../ui/smoothPath';

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 600, h: 220 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(200, e.contentRect.width), h: Math.max(110, e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function RepChart({ points, liveLast }: { points: { season: string; rep: number }[]; liveLast: boolean }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 40, r: 16, t: 14, b: 26 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = points.map((p) => p.rep);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 4) / 5) * 5);
  const hi = Math.min(100, Math.max(lo + 10, Math.ceil((Math.max(...vals) + 4) / 5) * 5));
  const n = points.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - lo) / Math.max(1, hi - lo)) * ih;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))));
  const pts: Pt[] = points.map((p, i) => [x(i), y(p.rep)]);
  const path = smoothPath(pts);
  const area = smoothArea(pts, pad.t + ih);
  const hp = hover != null ? points[hover] : null;
  return (
    <div className="car-chart" ref={ref} onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const fx = ((e.clientX - r.left) / Math.max(1, r.width)) * w;
        let best = 0;
        points.forEach((_, i) => { if (Math.abs(x(i) - fx) < Math.abs(x(best) - fx)) best = i; });
        setHover(n ? best : null);
      }}>
      <svg width={w} height={h} role="img" aria-label="Ansehen je Saison">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="car-grid" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="car-tick">{t}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="carArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="car-area-top" />
            <stop offset="100%" className="car-area-bottom" />
          </linearGradient>
        </defs>
        {n > 1 && <path d={area} fill="url(#carArea)" />}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="car-guide" />}
        {n > 1 && <path d={path} className="car-line" />}
        {points.map((p, i) => (i === n - 1 || hover === i) && (
          <circle key={p.season} cx={x(i)} cy={y(p.rep)} r={hover === i ? 5 : 4}
            className={`car-dot ${liveLast && i === n - 1 ? 'live' : ''} ${hover === i ? 'on' : ''}`} />
        ))}
        {points.map((p, i) => (i % every === 0 || i === n - 1) && (
          <text key={`l${p.season}`} x={x(i)} y={h - 6} textAnchor={n > 1 && i === n - 1 ? 'end' : n > 1 && i === 0 ? 'start' : 'middle'} className="car-tick">{p.season.slice(2)}</text>
        ))}
      </svg>
      {hp && (
        <div className="car-tip" style={{ left: Math.min(w - 150, Math.max(0, x(hover!) - 60)), top: Math.max(0, y(hp.rep) - 52) }}>
          <b>{hp.season}</b>{liveLast && hover === n - 1 ? ' (läuft)' : ''}<br />Ansehen {hp.rep.toFixed(1).replace('.', ',')}
        </div>
      )}
    </div>
  );
}

// Ansehen je Saison: ruhige Linie (neutral), letzter Punkt = laufende Saison, Hover mit Wert.
import { useEffect, useRef, useState } from 'react';

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
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.rep).toFixed(1)}`).join(' ');
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
        {n > 1 && <path d={path} className="car-line" />}
        {points.map((p, i) => (
          <circle key={p.season} cx={x(i)} cy={y(p.rep)} r={hover === i ? 5 : 3.5}
            className={`car-dot ${liveLast && i === n - 1 ? 'live' : ''} ${hover === i ? 'on' : ''}`} />
        ))}
        {points.map((p, i) => (i % every === 0 || i === n - 1) && (
          <text key={`l${p.season}`} x={x(i)} y={h - 6} textAnchor="middle" className="car-tick">{p.season.slice(2)}</text>
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

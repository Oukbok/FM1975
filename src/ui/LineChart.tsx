// =============================================================================
// Liniendiagramm für Verläufe (Wunsch Pascal): weiche Kurve (ui/smoothPath),
// beschriftete Y-Achse mit runden Teilstrichen, X-Achse mit Beschriftungen,
// Nulllinie bei Minuswerten, unter der Maus Hilfslinie + Punkt + genauer Wert.
// Füllt den Platz seines Elternelements (ResizeObserver, Pixel ohne Verzerrung).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { smoothArea, smoothPath, type Pt } from './smoothPath';

export interface LinePoint {
  /** Beschriftung unter der X-Achse (kurz, z. B. „Jan“ oder „78/79“). */
  label: string;
  /** Kopfzeile im Hover (z. B. „31. Januar 1979“). */
  tip: string;
  value: number;
}

/** Runde Teilstriche (1/2/2,5/5 × 10^n) zwischen lo und hi. */
function niceTicks(lo: number, hi: number, want = 4): number[] {
  const span = Math.max(1e-9, hi - lo);
  const raw = span / want, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(Math.round(v / step) * step);
  return out;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function LineChart({ points, fmt, fmtAxis, yTitle, minHeight = 120, compact, className, ariaLabel, zeroBase }: {
  points: LinePoint[];
  /** Wert im Hover. */
  fmt: (v: number) => string;
  /** Teilstriche der Y-Achse (Standard: fmt). */
  fmtAxis?: (v: number) => string;
  /** Kleine Achsenüberschrift über der Y-Achse (z. B. „Mio. DM“). */
  yTitle?: string;
  minHeight?: number;
  /** Kleine Fassung: zwei Teilstriche, kleinere Schrift. */
  compact?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Finanzgraphen (Wunsch Pascal): Y-Achse beginnt bei 0, nur bei negativen Werten darunter. */
  zeroBase?: boolean;
}) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const axisFmt = fmtAxis ?? fmt;
  const vals = points.map((p) => p.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo > 0 && lo < hi * 0.35) lo = 0; // nahe null: Achse bei null beginnen
  if (lo === hi) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
  if (zeroBase && lo > 0) lo = 0;
  const pad0 = (hi - lo) * 0.08;
  const ticks = niceTicks(zeroBase && lo >= 0 ? 0 : lo - pad0, hi + pad0, compact ? 2 : 4);
  const yLo = Math.min(lo, ticks[0]), yHi = Math.max(hi, ticks[ticks.length - 1]);
  const fs = compact ? 10 : 11.5;
  const labW = Math.max(...ticks.map((t) => axisFmt(t).length)) * fs * 0.6 + 10;
  const pad = { l: Math.ceil(labW), r: 12, t: yTitle ? 18 : 8, b: compact ? 16 : 22 };
  const iw = Math.max(10, w - pad.l - pad.r), ih = Math.max(10, h - pad.t - pad.b);
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - yLo) / Math.max(1e-9, yHi - yLo)) * ih;
  const pts: Pt[] = points.map((p, i) => [x(i), y(p.value)]);
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / (compact ? 48 : 58)))));
  const hp = hover != null ? points[hover] : null;

  return (
    <div className={`lc ${compact ? 'lc-compact' : ''} ${className ?? ''}`} ref={ref} style={{ minHeight }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        if (!n) return;
        const r = e.currentTarget.getBoundingClientRect();
        const fx = ((e.clientX - r.left) / Math.max(1, r.width)) * w;
        let best = 0;
        for (let i = 1; i < n; i++) if (Math.abs(x(i) - fx) < Math.abs(x(best) - fx)) best = i;
        setHover(best);
      }}>
      {w > 0 && h > 0 && n > 0 && (
        <svg width={w} height={h} role="img" aria-label={ariaLabel ?? 'Verlauf'}>
          <defs>
            <linearGradient id="lcArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="lc-area-top" />
              <stop offset="100%" className="lc-area-bottom" />
            </linearGradient>
          </defs>
          {yTitle && <text x={2} y={11} className="lc-ytitle">{yTitle}</text>}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className={t === 0 && yLo < 0 ? 'lc-zero' : 'lc-grid'} />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="lc-tick" style={{ fontSize: fs }}>{axisFmt(t)}</text>
            </g>
          ))}
          {n > 1 && <path d={smoothArea(pts, y(Math.max(yLo, Math.min(0, yHi))))} fill="url(#lcArea)" />}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="lc-guide" />}
          {n > 1 && <path d={smoothPath(pts)} className="lc-line" />}
          {points.map((p, i) => (i === n - 1 || hover === i) && (
            <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 3.5} className={`lc-dot ${hover === i ? 'on' : ''} ${p.value < 0 ? 'neg' : ''}`} />
          ))}
          {points.map((p, i) => (i % every === 0 || i === n - 1) && (n - 1 - i >= every / 2 || i === n - 1) && (
            <text key={`x${i}`} x={x(i)} y={h - 5} className="lc-tick" style={{ fontSize: fs }}
              textAnchor={n > 1 && i === n - 1 ? 'end' : n > 1 && i === 0 ? 'start' : 'middle'}>{p.label}</text>
          ))}
        </svg>
      )}
      {hp && (
        <div className="lc-tip" style={{ left: Math.min(Math.max(0, x(hover!) - 70), Math.max(0, w - 150)), top: Math.max(0, y(hp.value) - 54) }}>
          <b>{hp.tip}</b><br />{fmt(hp.value)}
        </div>
      )}
    </div>
  );
}

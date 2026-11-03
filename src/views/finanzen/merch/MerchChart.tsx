// Umsatzentwicklung: ruhiges Säulendiagramm (eine Reihe, neutrale Säulen, Hover-Tooltip).
import { useEffect, useRef, useState } from 'react';

export interface ChartSeries {
  /** Titel über dem Diagramm (benennt die Reihe – keine Legende nötig) */
  title: string;
  values: number[];
  /** Achsenbeschriftung je Säule */
  labels: string[];
  /** Tooltip-Kopf je Säule */
  tips: string[];
  fmt: (v: number) => string;
  /** Einheit der y-Achse (klein, rechts oben) */
  unit: string;
  /** letzte Säule ist eine laufende Periode (heller gezeichnet) */
  openLast?: boolean;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 600, h: 220 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(200, e.contentRect.width), h: Math.max(120, e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((x) => x >= v)) ?? 10 * p;
}

export function MerchChart({ s }: { s: ChartSeries }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 92, r: 10, t: 12, b: 26 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const empty = !s.values.some((v) => v > 0);
  const max = niceMax(Math.max(...s.values, 0));
  const n = Math.max(1, s.values.length);
  const slot = iw / n;
  const bw = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 34))));
  return (
    <div className="mc-chart">
      <div className="mc-chart-head"><span className="mc-chart-title">{s.title}</span><span className="mc-chart-unit">{s.unit}</span></div>
      <div className="mc-chart-plot" ref={ref} onMouseLeave={() => setHover(null)}>
        <svg width={w} height={h} role="img" aria-label={s.title}>
          {!empty && ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className={i === 0 ? 'mc-axis' : 'mc-grid'} />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="mc-tick">{s.fmt(t)}</text>
            </g>
          ))}
          {s.values.map((v, i) => {
            const x = pad.l + i * slot + (slot - bw) / 2;
            const top = y(v);
            const hgt = Math.max(0, pad.t + ih - top);
            const r = Math.min(4, bw / 2, hgt);
            const cls = `mc-bar${hover === i ? ' on' : ''}${s.openLast && i === n - 1 ? ' open' : ''}`;
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={pad.l + i * slot} y={pad.t} width={slot} height={ih} fill="transparent" />
                {hgt > 0 && <path className={cls} d={`M${x},${pad.t + ih}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${pad.t + ih}Z`} />}
                {(i % every === 0 || i === n - 1) && <text x={x + bw / 2} y={h - 8} textAnchor="middle" className="mc-tick">{s.labels[i]}</text>}
              </g>
            );
          })}
        </svg>
        {empty && <div className="mc-chart-empty">Noch keine Verkäufe in diesem Zeitraum.</div>}
        {hover != null && s.values[hover] != null && (
          <div className="mc-tip" style={{ left: Math.min(w - 150, Math.max(0, pad.l + hover * slot + slot / 2 - 70)), top: Math.max(0, y(s.values[hover]) - 54) }}>
            <div className="mc-tip-h">{s.tips[hover]}</div>
            <div className="mc-tip-v">{s.fmt(s.values[hover])}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Bausteine der Weltrangliste (Wunsch Pascal): Veränderung ±, Zeile, Ausschnitt um
// eine Nation, Verlauf des Rangs (kleines Liniendiagramm, Platz 1 oben).
// Genutzt im Länderprofil (components/country/OverviewTab.tsx) und unter
// Statistiken › Nationalteams › Weltrangliste (WorldRankingView.tsx).
// Daten: game/national/ranking.ts.
// =============================================================================
import { useLayoutEffect, useRef, useState } from 'react';
import type { RankRow } from '../../../game/national/ranking';
import { natName } from '../../../game/national/nationalGame';
import { NatFlag } from '../../../components/competition/CountryFlag';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** „Mai 1979“ – Ausgabe der Weltrangliste. */
export const editionLabel = (iso: string) => `${MONTHS[parseInt(iso.slice(5, 7), 10) - 1]} ${iso.slice(0, 4)}`;

/** Veränderung in Plätzen (+ = nach vorn). */
export function RankDelta({ d, wide = false }: { d: number | null; wide?: boolean }) {
  if (d == null) return <span className={`wr-d ${wide ? 'wide' : ''}`}>neu</span>;
  return <span className={`wr-d ${d > 0 ? 'up' : d < 0 ? 'down' : ''} ${wide ? 'wide' : ''}`}>{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '±0'}</span>;
}

/** Eine Zeile: Platz, Flagge, Name, Punkte, ±. */
export function RankLine({ r, me, mine }: { r: RankRow; me?: boolean; mine?: boolean }) {
  return (
    <div className={`wr-row ${me ? 'me' : ''}`}>
      <span className="rl-rank">{r.rank}</span>
      <NatFlag nat={r.code} />
      <span className="wr-name">{natName(r.code)}{mine && <i className="ntj-tag">Dein Team</i>}</span>
      <b className="wr-pts">{r.pts}</b>
      <RankDelta d={r.delta} />
    </div>
  );
}

/** Ausschnitt der Liste um eine Nation (je `n` davor und danach, am Rand aufgefüllt). */
export function excerpt(rows: RankRow[], code: string, n: number): RankRow[] {
  const i = rows.findIndex((r) => r.code === code);
  if (i < 0) return rows.slice(0, 2 * n + 1);
  const from = Math.max(0, Math.min(rows.length - (2 * n + 1), i - n));
  return rows.slice(from, from + 2 * n + 1);
}

/** Verlauf des Rangs: x = Jahr, y = Platz (1 oben). `of` = Zahl der Nationen (untere Kante).
 *  Füllt den Rest der Box (`.wr-spark-wrap`); gezeichnet in der gemessenen Größe, damit Schrift
 *  und Linien unabhängig von der Boxgröße gleich groß bleiben (`w`/`h` = Größe vor dem Messen). */
export function RankSpark({ pts, of, w: w0 = 520, h: h0 = 110 }: { pts: [number, number][]; of: number; w?: number; h?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([w0, h0]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => { const w = el.clientWidth, h = el.clientHeight; if (w > 0 && h > 0) setSize((s) => (s[0] === w && s[1] === h ? s : [w, h])); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!pts.length) return null;
  const [w, h] = size;
  const padL = 30, padR = 14, padT = 10, padB = 22;
  const x0 = Math.floor(pts[0][0]), x1 = Math.max(x0 + 1, Math.ceil(pts[pts.length - 1][0]));
  const worst = Math.max(...pts.map((p) => p[1]));
  const yMax = Math.min(of, Math.max(10, Math.ceil(worst / 10) * 10));
  const X = (x: number) => padL + ((x - x0) / (x1 - x0)) * (w - padL - padR);
  const Y = (r: number) => padT + ((r - 1) / (yMax - 1)) * (h - padT - padB);
  const path = pts.map(([x, r], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(r).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  // Mittlere Linie nur, wenn genug Höhe da ist (sonst überlappen die Zahlen).
  const ticks = [...new Set(h - padT - padB >= 56 ? [1, Math.round((yMax + 1) / 2), yMax] : [1, yMax])];
  const span = x1 - x0;
  const fit = Math.max(1, Math.floor((w - padL - padR) / 44)); // Jahreszahlen ohne Überlappung
  const step = [1, 2, 5, 10].find((s) => span / s <= fit) ?? 10;
  const years = Array.from({ length: span + 1 }, (_, i) => x0 + i).filter((y) => (y - x0) % step === 0 || y === x1);
  return (
    <div className="wr-spark-wrap" ref={ref}><svg className="wr-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Verlauf des Rangs">
      {ticks.map((t) => <g key={t}><line x1={padL} x2={w - padR} y1={Y(t)} y2={Y(t)} className="wr-grid" /><text x={padL - 8} y={Y(t) + 4} className="wr-ax" textAnchor="end">{t}</text></g>)}
      {years.map((y) => <text key={y} x={X(y)} y={h - 5} className="wr-ax" textAnchor={y === x0 ? 'start' : y === x1 ? 'end' : 'middle'}>{y}</text>)}
      {pts.length > 1 && <path d={path} className="wr-line" />}
      {pts.map(([x, r]) => <circle key={x} cx={X(x)} cy={Y(r)} r={3} className="wr-dot" />)}
      <circle cx={X(last[0])} cy={Y(last[1])} r={5} className="wr-now" />
    </svg></div>
  );
}

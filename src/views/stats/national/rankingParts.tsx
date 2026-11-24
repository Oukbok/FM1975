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
import { nearestIndex } from '../../../ui/LineChart';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** „Mai 1979“ – Ausgabe der Weltrangliste. */
export const editionLabel = (iso: string) => `${MONTHS[parseInt(iso.slice(5, 7), 10) - 1]} ${iso.slice(0, 4)}`;
/** „Ausgabe 12/2035“ – kurz für Box-Köpfe (der Titel bleibt einzeilig). */
export const editionShort = (iso: string) => `Ausgabe ${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

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
 *  und Linien unabhängig von der Boxgröße gleich groß bleiben (`w`/`h` = Größe vor dem Messen).
 *  Hover (Wunsch Pascal) wie ui/LineChart.tsx (`nearestIndex`, `.lc-tip`): Fadenkreuz, Punkt
 *  hervorgehoben, Kärtchen mit Ausgabe, Rang und Veränderung; Punkte nur für die aktuelle
 *  Ausgabe (`cur`) – der Verlauf speichert je Jahr nur den Rang (game/national/ranking.ts). */
export function RankSpark({ pts, of, w: w0 = 520, h: h0 = 110, cur }: { pts: [number, number][]; of: number; w?: number; h?: number; cur?: { pts: number; ed: string; dPts?: number | null } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([w0, h0]);
  const [hover, setHover] = useState<number | null>(null);
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
  // Achse bis zur letzten Ausgabe (nicht aufgerundet: sonst stehen „2035“ und „2036“ übereinander).
  const x0 = Math.floor(pts[0][0]), x1 = Math.max(x0 + 1, pts[pts.length - 1][0]);
  const worst = Math.max(...pts.map((p) => p[1]));
  const yMax = Math.min(of, Math.max(10, Math.ceil(worst / 10) * 10));
  const X = (x: number) => padL + ((x - x0) / (x1 - x0)) * (w - padL - padR);
  const Y = (r: number) => padT + ((r - 1) / (yMax - 1)) * (h - padT - padB);
  const path = pts.map(([x, r], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(r).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  // Mittlere Linie nur, wenn genug Höhe da ist (sonst überlappen die Zahlen).
  const ticks = [...new Set(h - padT - padB >= 56 ? [1, Math.round((yMax + 1) / 2), yMax] : [1, yMax])];
  const years = yearTicks(x0, Math.floor(x1), X, padL, w - padR);
  const xs = pts.map((p) => X(p[0]));
  const hp = hover != null ? pts[hover] : null;
  const isCur = hover === pts.length - 1 && !!cur;
  const prev = hover != null && hover > 0 ? pts[hover - 1][1] : null;
  const d = hp && prev != null ? prev - hp[1] : null;
  return (
    <div className="wr-spark-wrap" ref={ref}
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(nearestIndex(xs, ((e.clientX - r.left) / Math.max(1, r.width)) * w)); }}>
      <svg className="wr-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Verlauf des Rangs">
        {ticks.map((t) => <g key={t}><line x1={padL} x2={w - padR} y1={Y(t)} y2={Y(t)} className="wr-grid" /><text x={padL - 8} y={Y(t) + 4} className="wr-ax" textAnchor="end">{t}</text></g>)}
        {years.map(([y, lx]) => <text key={y} x={lx} y={h - 5} className="wr-ax" textAnchor="middle">{y}</text>)}
        {hp && <line x1={X(hp[0])} x2={X(hp[0])} y1={padT} y2={h - padB} className="wr-guide" />}
        {pts.length > 1 && <path d={path} className="wr-line" />}
        {pts.map(([x, r], i) => <circle key={x} cx={X(x)} cy={Y(r)} r={hover === i ? 5 : 3} className={`wr-dot ${hover === i ? 'on' : ''}`} />)}
        {hover !== pts.length - 1 && <circle cx={X(last[0])} cy={Y(last[1])} r={5} className="wr-now" />}
      </svg>
      {hp && (
        <div className="lc-tip" style={{ ...(X(hp[0]) > w / 2 ? { right: Math.max(0, w - X(hp[0]) + 12) } : { left: X(hp[0]) + 12 }), top: Math.min(Math.max(0, Y(hp[1]) - 28), Math.max(0, h - 74)) }}>
          <b>{isCur ? `Ausgabe ${editionLabel(cur!.ed)}` : hp[0] % 1 ? `Ausgabe ${Math.floor(hp[0])}` : `Ausgabe Ende ${hp[0]}`}</b><br />
          Platz {hp[1]}{d != null && <> · <span className={`wr-tip-d ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '±0'}</span> seit {pts[hover! - 1][0] % 1 ? Math.floor(pts[hover! - 1][0]) : `Ende ${pts[hover! - 1][0]}`}</>}
          {isCur && <><br />{cur!.pts} Punkte{cur!.dPts != null && <> · <span className={`wr-tip-d ${cur!.dPts > 0 ? 'up' : cur!.dPts < 0 ? 'down' : ''}`}>{cur!.dPts > 0 ? `+${cur!.dPts}` : cur!.dPts < 0 ? `−${-cur!.dPts}` : '±0'}</span> zur Ausgabe davor</>}</>}
        </div>
      )}
    </div>
  );
}

/** Ganze Jahre als Achsenbeschriftung [Jahr, x]: Schritt 1/2/5/10/20, Zahl mittig, am Rand nach innen
 *  geschoben; zu nahe Nachbarn fallen weg, die jüngste Jahreszahl bleibt immer stehen. */
const AX_HALF = 22; // halbe Breite einer Jahreszahl (bis 17,6 px Schrift)
function yearTicks(x0: number, x1: number, X: (y: number) => number, left: number, right: number): [number, number][] {
  const minGap = 2 * AX_HALF + 6;
  const per = Math.max(1e-6, X(x0 + 1) - X(x0));
  const step = [1, 2, 5, 10, 20].find((s) => s * per >= minGap) ?? 20;
  const at = (y: number) => Math.min(right - AX_HALF, Math.max(left + AX_HALF, X(y)));
  const out: [number, number][] = [];
  for (let y = x0; y <= x1; y++) {
    if ((y - x0) % step !== 0 && y !== x1) continue;
    const lx = at(y);
    if (y === x1) { while (out.length && lx - out[out.length - 1][1] < minGap) out.pop(); out.push([y, lx]); continue; }
    if (!out.length || lx - out[out.length - 1][1] >= minGap) out.push([y, lx]);
  }
  return out;
}

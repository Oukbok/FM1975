// Spielerentwicklung als ruhiges Liniendiagramm (Reiter Statistiken): Wochenverlauf aus
// `history.weeks` (game/profileWeeks.ts) mit Stärke/Form/Frische/Fitness/Moral und wahlweise
// dem Kaderschnitt derselben Woche (gestrichelt). Ohne Wochenverlauf (fremde Spieler, alte
// Spielstände) zeigt es die Stärke je Bewertungsrunde (`development.abilityHistory`).
import { useMemo, useState, type PointerEvent } from 'react';
import type { Player, WeekPoint } from '../../types';
import type { Game } from '../../game/state';
import { profileWeeksOf } from '../../game/profileWeeks';
import { utcDate } from './shared';
import { smoothPath, type Pt } from '../../ui/smoothPath';

type Key = 'ov' | 'f' | 'fr' | 'fi' | 'm';
const SERIES: { k: Key; label: string; color: string }[] = [
  { k: 'ov', label: 'Stärke', color: 'var(--text)' },
  { k: 'f', label: 'Form', color: 'var(--fg-4)' },
  { k: 'fr', label: 'Frische', color: 'var(--pos-key)' },
  { k: 'fi', label: 'Fitness', color: 'var(--q-3)' },
  { k: 'm', label: 'Moral', color: 'var(--pos-key-2)' },
];
const DEFAULT_ON: Record<Key, boolean> = { ov: true, f: true, fr: true, fi: true, m: false };

const W = 600, H = 200, L = 30, R = 10, T = 10, B = 24;

export default function DevChart({ p, g }: { p: Player; g?: Game }) {
  const weeks = p.history?.weeks ?? [];
  const weekly = weeks.length >= 2;
  const team = useMemo(() => {
    if (!weekly) return new Map<string, WeekPoint>();
    return new Map((profileWeeksOf(g)?.team ?? []).map((t) => [t.d, t]));
  }, [g, weekly]);
  const [on, setOn] = useState(DEFAULT_ON);
  const [avg, setAvg] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  // Ohne Wochenverlauf: Stärke je Bewertung
  const pts: WeekPoint[] = weekly ? weeks : p.development.abilityHistory.slice(-24).map((h) => ({ d: h.date, ov: Math.round(h.ability), f: 0, fr: 0, fi: 0, m: 0 }));
  const series = weekly ? SERIES : SERIES.slice(0, 1);
  const active = series.filter((s) => on[s.k]);
  const last = weekly ? weeks[weeks.length - 1] : undefined;

  if (pts.length < 2) {
    return <div className="pp-empty">Noch kein Verlauf. Für deinen Kader hält das Spiel jeden Sonntag Stärke, Form, Frische, Fitness und Moral fest; bei anderen Spielern zeigt das Diagramm die Stärke je Bewertungsrunde.</div>;
  }

  const x = (i: number) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const path = (get: (pt: WeekPoint) => number | undefined) => {
    // Lücken (fehlende Werte) trennen die Linie; jedes Stück als weiche Kurve.
    let d = '', seg: Pt[] = [];
    const flush = () => { if (seg.length) d += smoothPath(seg); seg = []; };
    pts.forEach((pt, i) => {
      const v = get(pt);
      if (v == null) { flush(); return; }
      seg.push([x(i), y(v)]);
    });
    flush();
    return d;
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((px - L) / (W - L - R)) * (pts.length - 1)))));
  };
  const hp = hover != null ? pts[hover] : null;
  const ht = hp ? team.get(hp.d) : undefined;
  const tipLeft = hover != null ? (x(hover) / W) * 100 : 0;
  const ticks = [0, Math.floor((pts.length - 1) / 2), pts.length - 1];

  return (
    <div className="pp3-chart">
      <div className="pp3-chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          role="img" aria-label="Spielerentwicklung">
          {[0, 25, 50, 75, 100].map((v) => <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="pp3-grid" />)}
          {avg && weekly && active.map((s) => (
            <path key={'t' + s.k} d={path((pt) => team.get(pt.d)?.[s.k])} fill="none" stroke={s.color} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.55} vectorEffect="non-scaling-stroke" />
          ))}
          {active.map((s) => (
            <path key={s.k} d={path((pt) => pt[s.k])} fill="none" stroke={s.color} strokeWidth={s.k === 'ov' ? 2.4 : 1.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="pp3-cursor" />}
        </svg>
        {/* Achsen als HTML – das SVG wird gestreckt, Schrift bliebe sonst verzerrt */}
        {[0, 25, 50, 75, 100].map((v) => (
          <span key={v} className="pp3-axis pp3-ay" style={{ top: `${(y(v) / H) * 100}%`, right: `${((W - L + 6) / W) * 100}%` }}>{v}</span>
        ))}
        {ticks.map((i) => (
          <span key={i} className={`pp3-axis pp3-ax${i === 0 ? ' first' : i === pts.length - 1 ? ' last' : ''}`} style={{ left: `${(x(i) / W) * 100}%` }}>{utcDate(pts[i].d)}</span>
        ))}
        {hover != null && hp && active.map((s) => (
          <span key={s.k} className="pp3-dot" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hp[s.k]) / H) * 100}%`, background: s.color }} />
        ))}
        {hp && (
          <div className={`pp3-tip${tipLeft > 60 ? ' left' : ''}`} style={{ left: `${tipLeft}%` }}>
            <div className="pp3-tip-d">{weekly ? `Woche bis ${utcDate(hp.d)}` : `Bewertung ${utcDate(hp.d)}`}</div>
            {active.map((s) => (
              <div key={s.k} className="pp3-tip-row">
                <i style={{ background: s.color }} /><span>{s.label}</span><b>{hp[s.k]}</b>
                {avg && ht && <em>Kader {ht[s.k]}</em>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pp3-legend">
        {weekly && (
          <label className="pp3-chk">
            <input type="checkbox" checked={avg} onChange={(e) => setAvg(e.target.checked)} />
            <span>Kaderschnitt</span>
          </label>
        )}
        {series.map((s) => (
          <label key={s.k} className="pp3-chk">
            <input type="checkbox" checked={on[s.k]} onChange={(e) => setOn({ ...on, [s.k]: e.target.checked })} />
            <i style={{ background: s.color }} /><span>{s.label}</span>
            {last && <b>{last[s.k]}</b>}
          </label>
        ))}
        {!weekly && <span className="pp3-note">Stärke je Bewertungsrunde – der Wochenverlauf läuft nur für deinen Kader.</span>}
      </div>
    </div>
  );
}

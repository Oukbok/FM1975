// Spielerentwicklung als ruhiges Liniendiagramm (Reiter Statistiken).
// Zwei Auswahllisten (Wunsch Pascal: längerer Zeitraum, Fähigkeiten per Dropdown):
//   • Anzeige: „Stärke & Zustand“ (Stärke/Form/Frische/Fitness/Moral aus dem Wochenverlauf
//     `history.weeks`, wahlweise mit Kaderschnitt), „Stärke“, eine Kategorie (Schnitt ihrer
//     Attribute) oder ein einzelnes Attribut.
//   • Zeitraum: letzte 52 Wochen oder die gesamte Aufzeichnung.
// Quellen: Wochenpunkte (eigener Kader, 52), Monatspunkte mit allen Attributen (eigener Kader,
// zehn Jahre, game/profileWeeks.ts), Stärke je Bewertungsrunde (`development.abilityHistory`)
// und Attribut-Momentaufnahmen je Bewertung (`history.attributeSnapshots`) – dazu der heutige
// Wert. Die x-Achse läuft nach Datum, damit unterschiedlich dichte Quellen zusammenpassen.
import { useMemo, useState, type PointerEvent } from 'react';
import type { Player, WeekPoint } from '../../types';
import type { Game } from '../../game/state';
import { profileWeeksOf } from '../../game/profileWeeks';
import { ATTR_DE, GROUPS, utcDate, type AttrKey } from './shared';
import { smoothPath, type Pt } from '../../ui/smoothPath';
import Select, { type SelectOption } from '../../ui/Select';

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
const DAY = 86_400_000;

/** Ein Punkt der Ansicht: Datum + Werte je Reihe. */
interface Pnt { d: string; t: number; v: Partial<Record<string, number>> }

const OPTIONS: SelectOption[] = [
  { value: 'zustand', label: 'Stärke & Zustand' },
  { value: 'ov', label: 'Stärke' },
  ...GROUPS.map((gr, i) => ({ value: `grp:${i}`, label: `${gr.title} (Schnitt)`, group: i === 0 ? 'Kategorien' : undefined })),
  ...GROUPS.flatMap((gr) => [...gr.keys].sort((a, b) => ATTR_DE[a].localeCompare(ATTR_DE[b], 'de'))
    .map((k, j) => ({ value: `attr:${k}`, label: ATTR_DE[k], group: j === 0 ? gr.title : undefined }))),
  { value: 'attr:fitness', label: ATTR_DE.fitness, group: 'Zustand' },
];
const RANGES: SelectOption[] = [{ value: 'year', label: 'Letzte 52 Wochen' }, { value: 'all', label: 'Gesamte Zeit' }];

const ts = (d: string) => Date.parse(d.slice(0, 10) + 'T00:00:00Z');

/** Attribut-Verlauf aus Monatspunkten, Bewertungs-Momentaufnahmen und dem heutigen Wert. */
function attrSeries(p: Player, g: Game | undefined, keys: AttrKey[], today: string): Pnt[] {
  const by = new Map<string, number>();
  const put = (d: string, get: (k: AttrKey) => number | undefined) => {
    let s = 0, n = 0;
    for (const k of keys) { const v = get(k); if (v != null) { s += v; n++; } }
    if (n) by.set(d.slice(0, 10), Math.round(s / n));
  };
  for (const s of p.history?.attributeSnapshots ?? []) put(s.date, (k) => s.attributes[k]);
  const ak = profileWeeksOf(g)?.ak;
  if (ak) for (const m of p.history?.months ?? []) put(m.d, (k) => { const i = ak.indexOf(k); return i >= 0 ? m.a[i] : undefined; });
  put(today, (k) => Math.round(p.attributes[k]));
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ d, t: ts(d), v: { a: v } }));
}

/** Stärke über die gesamte Zeit: Bewertungsrunden, Monats- und Wochenpunkte, heute. */
function ovSeries(p: Player, today: string): Pnt[] {
  const by = new Map<string, number>();
  for (const h of p.development.abilityHistory) by.set(h.date.slice(0, 10), Math.round(h.ability));
  for (const m of p.history?.months ?? []) by.set(m.d.slice(0, 10), m.ov);
  for (const w of p.history?.weeks ?? []) by.set(w.d.slice(0, 10), w.ov);
  by.set(today.slice(0, 10), Math.round(p.overall));
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ d, t: ts(d), v: { ov: v } }));
}

export default function DevChart({ p, g }: { p: Player; g?: Game }) {
  const weeks = p.history?.weeks ?? [];
  const weekly = weeks.length >= 2;
  const team = useMemo(() => {
    if (!weekly) return new Map<string, WeekPoint>();
    return new Map((profileWeeksOf(g)?.team ?? []).map((t) => [t.d, t]));
  }, [g, weekly]);
  const [view, setView] = useState('zustand');
  const [range, setRange] = useState<'year' | 'all'>('year');
  const [on, setOn] = useState(DEFAULT_ON);
  const [avg, setAvg] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const today = g?.calendar.currentDate ?? weeks[weeks.length - 1]?.d ?? new Date().toISOString().slice(0, 10);

  // Zustand braucht den Wochenverlauf; ohne ihn (fremde Spieler) oder über die gesamte Zeit: Stärke.
  const cond = view === 'zustand' && weekly && range === 'year';
  const attrView = view.startsWith('attr:') || view.startsWith('grp:');
  const label = view.startsWith('attr:') ? ATTR_DE[view.slice(5) as AttrKey]
    : view.startsWith('grp:') ? `${GROUPS[+view.slice(4)].title} (Schnitt)` : 'Stärke';

  let pts: Pnt[];
  if (cond) pts = weeks.map((w) => ({ d: w.d, t: ts(w.d), v: { ov: w.ov, f: w.f, fr: w.fr, fi: w.fi, m: w.m } }));
  else if (attrView) {
    const keys = view.startsWith('attr:') ? [view.slice(5) as AttrKey] : GROUPS[+view.slice(4)].keys;
    pts = attrSeries(p, g, keys, today);
  } else pts = ovSeries(p, today);
  if (range === 'year') {
    const from = ts(today) - 365 * DAY;
    const inside = pts.filter((x) => x.t >= from);
    // Letzter Punkt vor dem Zeitraum hält die Linie am linken Rand fest.
    const before = pts.filter((x) => x.t < from).pop();
    pts = before && !cond ? [before, ...inside] : inside;
  }

  const series = cond ? SERIES : [{ k: attrView ? 'a' : 'ov', label, color: 'var(--text)' }];
  const active = cond ? SERIES.filter((s) => on[s.k]) : series;
  const last = pts[pts.length - 1];

  const head = (
    <div className="pp3-chart-head">
      <Select size="s" width={220} value={view} onChange={(v) => { setView(v); setHover(null); }} options={OPTIONS} listHeight={360} title="Anzeige" />
      <Select size="s" width={170} value={range} onChange={(v) => { setRange(v as 'year' | 'all'); setHover(null); }} options={RANGES} title="Zeitraum" />
    </div>
  );

  if (pts.length < 2) {
    return (
      <div className="pp3-chart">
        {head}
        <div className="pp-empty">Noch kein Verlauf für diese Auswahl. Für deinen Kader hält das Spiel jeden Sonntag Stärke, Form, Frische, Fitness und Moral fest und einmal im Monat alle Fähigkeiten; bei anderen Spielern stammen die Werte aus den Bewertungsrunden.</div>
      </div>
    );
  }

  const t0 = pts[0].t, t1 = Math.max(pts[pts.length - 1].t, t0 + DAY);
  const x = (t: number) => L + ((t - t0) * (W - L - R)) / (t1 - t0);
  // Stärke & Zustand auf 0–100; eine einzelne Reihe zoomt auf ihren Bereich, damit kleine Schritte sichtbar werden.
  let lo = 0, hi = 100;
  if (!cond) {
    const vals = pts.map((pt) => pt.v[series[0].k]).filter((v): v is number => v != null);
    lo = Math.max(0, Math.floor((Math.min(...vals) - 6) / 10) * 10);
    hi = Math.min(100, Math.ceil((Math.max(...vals) + 6) / 10) * 10);
    if (hi - lo < 20) { if (hi + 10 <= 100) hi += 10; else lo -= 10; }
  }
  const grid = [0, 1, 2, 3, 4].map((i) => Math.round(lo + ((hi - lo) * i) / 4));
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = (get: (pt: Pnt) => number | undefined) => {
    // Lücken (fehlende Werte) trennen die Linie; jedes Stück als weiche Kurve.
    let d = '', seg: Pt[] = [];
    const flush = () => { if (seg.length) d += smoothPath(seg); seg = []; };
    for (const pt of pts) {
      const v = get(pt);
      if (v == null) { flush(); continue; }
      seg.push([x(pt.t), y(v)]);
    }
    flush();
    return d;
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    pts.forEach((pt, i) => { const dd = Math.abs(x(pt.t) - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };
  const hp = hover != null ? pts[hover] : null;
  const ht = hp && cond ? team.get(hp.d) : undefined;
  const tipLeft = hp ? (x(hp.t) / W) * 100 : 0;
  const long = t1 - t0 > 2 * 365 * DAY;
  const tickLabel = (t: number) => long ? String(new Date(t).getUTCFullYear()) : utcDate(new Date(t).toISOString());
  const ticks = [t0, (t0 + t1) / 2, t1];
  const tipHead = (pt: Pnt) => cond ? `Woche bis ${utcDate(pt.d)}` : pt.d === today.slice(0, 10) ? `Heute, ${utcDate(pt.d)}` : utcDate(pt.d);

  return (
    <div className="pp3-chart">
      {head}
      <div className="pp3-chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          role="img" aria-label={`Spielerentwicklung: ${cond ? 'Stärke und Zustand' : label}`}>
          {grid.map((v) => <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="pp3-grid" />)}
          {avg && cond && active.map((s) => (
            <path key={'t' + s.k} d={path((pt) => team.get(pt.d)?.[s.k as Key])} fill="none" stroke={s.color} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.55} vectorEffect="non-scaling-stroke" />
          ))}
          {active.map((s) => (
            <path key={s.k} d={path((pt) => pt.v[s.k])} fill="none" stroke={s.color} strokeWidth={s.k === 'ov' || s.k === 'a' ? 2.4 : 1.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
          {hp && <line x1={x(hp.t)} x2={x(hp.t)} y1={T} y2={H - B} className="pp3-cursor" />}
        </svg>
        {/* Achsen als HTML – das SVG wird gestreckt, Schrift bliebe sonst verzerrt */}
        {grid.map((v) => (
          <span key={v} className="pp3-axis pp3-ay" style={{ top: `${(y(v) / H) * 100}%`, right: `${((W - L + 6) / W) * 100}%` }}>{v}</span>
        ))}
        {ticks.map((t, i) => (
          <span key={i} className={`pp3-axis pp3-ax${i === 0 ? ' first' : i === 2 ? ' last' : ''}`} style={{ left: `${(x(t) / W) * 100}%` }}>{tickLabel(t)}</span>
        ))}
        {hp && active.map((s) => hp.v[s.k] != null && (
          <span key={s.k} className="pp3-dot" style={{ left: `${(x(hp.t) / W) * 100}%`, top: `${(y(hp.v[s.k]!) / H) * 100}%`, background: s.color }} />
        ))}
        {hp && (
          <div className={`pp3-tip${tipLeft > 60 ? ' left' : ''}`} style={{ left: `${tipLeft}%` }}>
            <div className="pp3-tip-d">{tipHead(hp)}</div>
            {active.map((s) => (
              <div key={s.k} className="pp3-tip-row">
                <i style={{ background: s.color }} /><span>{s.label}</span><b>{hp.v[s.k] ?? '–'}</b>
                {avg && ht && <em>Kader {ht[s.k as Key]}</em>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pp3-legend">
        {cond ? (
          <>
            <label className="pp3-chk">
              <input type="checkbox" checked={avg} onChange={(e) => setAvg(e.target.checked)} />
              <span>Kaderschnitt</span>
            </label>
            {SERIES.map((s) => (
              <label key={s.k} className="pp3-chk">
                <input type="checkbox" checked={on[s.k]} onChange={(e) => setOn({ ...on, [s.k]: e.target.checked })} />
                <i style={{ background: s.color }} /><span>{s.label}</span>
                <b>{weeks[weeks.length - 1][s.k]}</b>
              </label>
            ))}
          </>
        ) : (
          <>
            <span className="pp3-chk"><i style={{ background: 'var(--text)' }} /><span>{label}</span><b>{last.v[series[0].k]}</b></span>
            <span className="pp3-note">
              {view === 'zustand' && !weekly ? 'Form, Frische, Fitness und Moral hält das Spiel nur wöchentlich für deinen Kader fest. '
                : view === 'zustand' ? 'Über die gesamte Zeit zeigt das Diagramm nur die Stärke. ' : ''}
              {pts.length} Messpunkte{attrView ? ' · eigener Kader monatlich, sonst je Bewertungsrunde' : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TRAININGSLAGER-PLANER – Karte: Ausschnitt je Kontinent, Ziele als Punkte an ihrer
// Lage (data/campDestinations.ts `geo`), gesperrte Ziele gedimmt. Umrisse aus
// data/campWorldMap.ts (Natural Earth, vereinfacht), keine Laufzeit-Anfragen.
// Gezeichnet in Bildschirm-Pixeln (ResizeObserver), damit Punkte/Schrift rund bleiben.
// =============================================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CampDestination } from '../../../data/campDestinations';
import { WORLD_BORDERS, WORLD_LAND } from '../../../data/campWorldMap';
import { CAMP_MAP_VIEWS, CampMapViewId, inView } from '../../../engine/campPlan';
import type { CampStatus } from '../../../engine/trainingCamp';

export interface MapDest { d: CampDestination; status: CampStatus; aiCount: number }

export function CampMap({ dests, view, onView, selected, onSelect, obligation }: {
  dests: MapDest[]; view: CampMapViewId; onView: (v: CampMapViewId) => void;
  selected?: string; onSelect: (id: string) => void; obligation?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [hover, setHover] = useState<string | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 560 });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setHover(null), [view]);

  const v = CAMP_MAP_VIEWS.find((x) => x.id === view)!;
  const c = Math.cos((v.phi * Math.PI) / 180);
  const vw = (v.lon[1] - v.lon[0]) * c, vh = v.lat[1] - v.lat[0];
  const k = Math.min(size.w / vw, size.h / vh);
  const ox = (size.w - vw * k) / 2 - v.lon[0] * c * k;
  const oy = (size.h - vh * k) / 2 + v.lat[1] * k;
  const geoPx = (d: CampDestination) => ({ x: ox + d.geo[1] * c * k, y: oy - d.geo[0] * k });

  // Nur Ziele, die es in dieser Epoche schon gibt (künftige erscheinen erst mit ihrem Jahr).
  const exists = (x: MapDest) => x.status.ok || !x.status.reason?.startsWith('erst ab');
  const live = dests.filter(exists);
  // Beschriftung: gewählt/überfahren zuerst, dann buchbare Ziele, ohne Überlappung.
  const shown = live.filter((x) => inView(v, x.d));
  // Nahe beieinander liegende Orte auseinanderschieben (Hilfslinie zur echten Lage).
  const pos = new Map(shown.map((x) => [x.d.id, geoPx(x.d)]));
  const MIN = 17;
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
      const a = pos.get(shown[i].d.id)!, b = pos.get(shown[j].d.id)!;
      let dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= MIN) continue;
      if (dist < 0.01) { dx = 1; dy = 0.3; }
      const n = Math.hypot(dx, dy), push = (MIN - dist) / 2 + 0.2;
      a.x -= (dx / n) * push; a.y -= (dy / n) * push; b.x += (dx / n) * push; b.y += (dy / n) * push;
      moved = true;
    }
    if (!moved) break;
  }
  const px = (d: CampDestination) => pos.get(d.id) ?? geoPx(d);
  const order = [...shown].sort((a, b) => rank(b) - rank(a));
  function rank(x: MapDest) { return (x.d.id === selected ? 4 : 0) + (x.d.id === hover ? 3 : 0) + (x.status.ok ? 2 : 0); }
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const labels = new Map<string, { x: number; y: number; anchor: 'start' | 'end' }>();
  const fs = 13;
  for (const x of order) {
    if (!x.status.ok && x.d.id !== hover && x.d.id !== selected) continue;
    const p = px(x.d);
    const w = x.d.name.length * fs * 0.56 + 6;
    for (const side of ['start', 'end'] as const) {
      const lx = side === 'start' ? p.x + 10 : p.x - 10;
      const r = { x0: side === 'start' ? lx : lx - w, x1: side === 'start' ? lx + w : lx, y0: p.y - fs * 0.7, y1: p.y + fs * 0.5 };
      if (r.x0 < 2 || r.x1 > size.w - 2 || r.y0 < 2 || r.y1 > size.h - 2) continue;
      if (placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) continue;
      placed.push(r); labels.set(x.d.id, { x: lx, y: p.y + fs * 0.36, anchor: side });
      break;
    }
  }

  const counts = (id: CampMapViewId) => {
    const vv = CAMP_MAP_VIEWS.find((x) => x.id === id)!;
    const inside = live.filter((x) => inView(vv, x.d));
    const next = dests.filter((x) => !exists(x) && inView(vv, x.d)).map((x) => x.d.access[0].from).sort((a, b) => a - b)[0];
    return { ok: inside.filter((x) => x.status.ok).length, all: inside.length, next };
  };

  return (
    <div className="cp-map-wrap">
      <div className="cp-map-tabs" role="tablist">
        {CAMP_MAP_VIEWS.map((x) => {
          const n = counts(x.id);
          return (
            <button key={x.id} role="tab" className={`cp-map-tab ${x.id === view ? 'on' : ''} ${n.ok ? '' : 'dim'}`} onClick={() => onView(x.id)}
              disabled={!n.all} title={n.all ? `${n.ok} von ${n.all} Zielen buchbar` : n.next ? `Erste Ziele ab ${n.next}` : 'Keine Ziele in diesem Fenster'}>
              {x.label}<span className="cp-map-n">{n.all ? n.ok : n.next ? `ab ${n.next}` : '–'}</span>
            </button>
          );
        })}
      </div>
      <div className="cp-map" ref={box}>
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} role="img" aria-label={`Karte ${v.label}`}>
          <g transform={`translate(${ox} ${oy}) scale(${c * k} ${k})`}>
            <path d={WORLD_LAND} className="cp-land" vectorEffect="non-scaling-stroke" />
            <path d={WORLD_BORDERS} className="cp-border" vectorEffect="non-scaling-stroke" />
          </g>
          {shown.map((x) => {
            const p = px(x.d), q = geoPx(x.d);
            return Math.hypot(p.x - q.x, p.y - q.y) > 3
              ? <g key={`l${x.d.id}`}><line x1={q.x} y1={q.y} x2={p.x} y2={p.y} className="cp-pin-leader" /><circle cx={q.x} cy={q.y} r={1.6} className="cp-pin-true" /></g> : null;
          })}
          {shown.map((x) => {
            const p = px(x.d);
            const sel = x.d.id === selected;
            const ob = obligation === x.d.id;
            return (
              <g key={x.d.id} className={`cp-pin ${x.status.ok ? 'ok' : 'locked'} ${sel ? 'sel' : ''} ${x.d.id === hover ? 'hov' : ''}`}
                transform={`translate(${p.x} ${p.y})`} onClick={() => onSelect(x.d.id)}
                onMouseEnter={() => setHover(x.d.id)} onMouseLeave={() => setHover((h) => (h === x.d.id ? null : h))}>
                <title>{`${x.d.name} – ${x.d.place}${x.status.ok ? '' : ` (${x.status.reason})`}${x.aiCount ? ` · ${x.aiCount} Vereine der Liga` : ''}`}</title>
                <circle r={14} className="cp-pin-hit" />
                {sel && <circle r={11} className="cp-pin-halo" />}
                {ob && <circle r={9} className="cp-pin-oblig" />}
                <circle r={sel ? 6.5 : 5} className="cp-pin-dot" />
              </g>
            );
          })}
          {shown.map((x) => {
            const lb = labels.get(x.d.id);
            if (!lb) return null;
            return (
              <text key={x.d.id} x={lb.x} y={lb.y} textAnchor={lb.anchor} fontSize={fs}
                className={`cp-pin-label ${x.d.id === selected ? 'sel' : ''} ${x.status.ok ? '' : 'locked'}`}>{x.d.name}</text>
            );
          })}
        </svg>
        <div className="cp-map-legend">
          <span><i className="ok" />buchbar</span><span><i className="locked" />gesperrt</span>
          {obligation && <span><i className="oblig" />Sponsor-Pflicht</span>}
        </div>
      </div>
    </div>
  );
}

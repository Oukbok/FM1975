// =============================================================================
// TRAININGSLAGER-PLANER – Karte: Ausschnitt je Kontinent, Ziele als Punkte an ihrer
// Lage (data/campDestinations.ts `geo`). Standardmäßig nur buchbare Ziele (die für den
// gewählten Zeitraum in Frage kommen); „Gesperrte zeigen“ blendet den Rest gedimmt ein.
// Über jedem Punkt: Jahreszeiten, in denen der Ort gebucht werden kann (Sonne/Flocke).
// Umrisse aus data/campWorldMap.ts (Natural Earth, vereinfacht), Hauptorte zur
// Orientierung in data/campMapCities.ts. Gezeichnet in Bildschirm-Pixeln (ResizeObserver).
// Beschriftung hängt NICHT vom Überfahren ab (sonst springen Namen/Punkte beim Hover);
// das Überfahren zeigt eine Infokarte über dem Punkt.
// =============================================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CAMP_CLIMATE, CampDestination } from '../../../data/campDestinations';
import { CAMP_MAP_CITIES } from '../../../data/campMapCities';
import { WORLD_BORDERS, WORLD_LAND } from '../../../data/campWorldMap';
import { CAMP_MAP_VIEWS, CampMapViewId, inView } from '../../../engine/campPlan';
import { CampStatus, campWeather } from '../../../engine/trainingCamp';
import type { CampSeason } from '../../../game/winterShared';
import { MON_FULL } from '../../../ui/format';

export interface MapDest { d: CampDestination; status: CampStatus; aiCount: number }

/** Kleine Jahreszeiten-Symbole (in SVG-Koordinaten um 0/0, ca. 9 px). */
export function SeasonGlyph({ s, x = 0, y = 0 }: { s: CampSeason; x?: number; y?: number }) {
  if (s === 'summer') {
    return (
      <g className="cp-glyph sun" transform={`translate(${x} ${y})`}>
        <circle r={2.8} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={4.3} x2={5.8} transform={`rotate(${a})`} />
        ))}
      </g>
    );
  }
  return (
    <g className="cp-glyph snow" transform={`translate(${x} ${y})`}>
      {[0, 60, 120].map((a) => <line key={a} x1={-5.6} x2={5.6} transform={`rotate(${a + 90})`} />)}
      {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M3.2 -1.7 L4.5 0 L3.2 1.7" transform={`rotate(${a})`} />)}
    </g>
  );
}

/** Legenden-Symbol als eigenes kleines SVG (für HTML-Zeilen). */
export function SeasonIcon({ s }: { s: CampSeason }) {
  return <svg className="cp-season-ico" width={14} height={14} viewBox="-7.5 -7.5 15 15" aria-hidden><SeasonGlyph s={s} /></svg>;
}

const SEASON_ORDER: CampSeason[] = ['summer', 'winter'];

export function CampMap({ dests, view, onView, selected, onSelect, obligation, season, month }: {
  dests: MapDest[]; view: CampMapViewId; onView: (v: CampMapViewId) => void;
  selected?: string; onSelect: (id: string) => void; obligation?: string;
  season: CampSeason; month: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [hover, setHover] = useState<string | null>(null);
  const [showLocked, setShowLocked] = useState(false);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 560 });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setHover(null), [view, showLocked]);

  // Nur Ziele, die es in dieser Epoche schon gibt (künftige erscheinen erst mit ihrem Jahr).
  const exists = (x: MapDest) => x.status.ok || !x.status.reason?.startsWith('erst ab');
  const live = dests.filter((x) => exists(x) && (showLocked || x.status.ok || x.d.id === selected));
  const counts = (id: CampMapViewId) => {
    const vv = CAMP_MAP_VIEWS.find((x) => x.id === id)!;
    const inside = dests.filter((x) => exists(x) && inView(vv, x.d));
    const next = dests.filter((x) => !exists(x) && inView(vv, x.d)).map((x) => x.d.access[0].from).sort((a, b) => a - b)[0];
    return { ok: inside.filter((x) => x.status.ok).length, all: inside.length, next };
  };
  // Startansicht ohne buchbares Ziel → erste Ansicht mit buchbaren Zielen.
  useEffect(() => {
    if (counts(view).ok) return;
    const alt = CAMP_MAP_VIEWS.find((x) => x.id !== 'welt' && counts(x.id).ok) ?? CAMP_MAP_VIEWS.find((x) => counts(x.id).ok);
    if (alt) onView(alt.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const v = CAMP_MAP_VIEWS.find((x) => x.id === view)!;
  const c = Math.cos((v.phi * Math.PI) / 180);
  const vw = (v.lon[1] - v.lon[0]) * c, vh = v.lat[1] - v.lat[0];
  const k = Math.min(size.w / vw, size.h / vh);
  const ox = (size.w - vw * k) / 2 - v.lon[0] * c * k;
  const oy = (size.h - vh * k) / 2 + v.lat[1] * k;
  const proj = (lat: number, lon: number) => ({ x: ox + lon * c * k, y: oy - lat * k });
  const geoPx = (d: CampDestination) => proj(d.geo[0], d.geo[1]);

  const shown = live.filter((x) => inView(v, x.d));
  // Nahe beieinander liegende Orte auseinanderschieben (Hilfslinie zur echten Lage).
  const pos = new Map(shown.map((x) => [x.d.id, geoPx(x.d)]));
  const MIN = 24;
  for (let it = 0; it < 60; it++) {
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

  // Beschriftung: Auswahl zuerst, dann buchbare Ziele, dann Hauptorte – ohne Überlappung.
  // Bewusst unabhängig vom Überfahren, damit beim Hover nichts springt.
  const rank = (x: MapDest) => (x.d.id === selected ? 4 : 0) + (x.status.ok ? 2 : 0);
  const order = [...shown].sort((a, b) => rank(b) - rank(a) || a.d.name.localeCompare(b.d.name));
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  // Punkte + Jahreszeiten-Symbole sind Hindernisse für Beschriftungen.
  for (const x of shown) {
    const p = px(x.d);
    placed.push({ x0: p.x - 7, x1: p.x + 7, y0: p.y - 7, y1: p.y + 7 }, { x0: p.x - 14, x1: p.x + 14, y0: p.y - 23, y1: p.y - 10 });
  }
  const labels = new Map<string, { x: number; y: number; anchor: 'start' | 'end' }>();
  const fs = 13;
  const tryPlace = (p: { x: number; y: number }, text: string, fsz: number, gap: number) => {
    const w = text.length * fsz * 0.56 + 6;
    for (const side of ['start', 'end'] as const) {
      const lx = side === 'start' ? p.x + gap : p.x - gap;
      const r = { x0: side === 'start' ? lx : lx - w, x1: side === 'start' ? lx + w : lx, y0: p.y - fsz * 0.7, y1: p.y + fsz * 0.5 };
      // unten Platz für die Legende lassen
      if (r.x0 < 2 || r.x1 > size.w - 2 || r.y0 < 2 || r.y1 > size.h - 34) continue;
      if (placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) continue;
      placed.push(r);
      return { x: lx, y: p.y + fsz * 0.36, anchor: side };
    }
    return null;
  };
  for (const x of order) {
    const lb = tryPlace(px(x.d), x.d.name, fs, 10);
    if (lb) labels.set(x.d.id, lb);
  }
  const cities = CAMP_MAP_CITIES.filter((t) => (t.minor ? view === 'dach' : true) && t.geo[1] >= v.lon[0] && t.geo[1] <= v.lon[1] && t.geo[0] >= v.lat[0] && t.geo[0] <= v.lat[1])
    .map((t) => ({ t, p: proj(t.geo[0], t.geo[1]) }))
    .filter(({ p }) => !shown.some((x) => { const q = px(x.d); return Math.hypot(q.x - p.x, q.y - p.y) < 12; }));
  const cityLabels = cities.map(({ t, p }) => ({ t, p, lb: tryPlace(p, t.name, 11, 6) }));

  // Gradnetz: Abstand je nach Ausschnitt.
  const step = view === 'dach' ? 2 : view === 'welt' ? 30 : 10;
  const grid: string[] = [];
  for (let lon = Math.ceil(v.lon[0] / step) * step - step; lon <= v.lon[1] + step; lon += step) {
    const a = proj(v.lat[0] - 20, lon), b = proj(v.lat[1] + 20, lon);
    grid.push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  for (let lat = Math.ceil(v.lat[0] / step) * step - step; lat <= v.lat[1] + step; lat += step) {
    const a = proj(lat, v.lon[0] - 40), b = proj(lat, v.lon[1] + 40);
    grid.push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }

  const hovDest = hover && hover !== selected ? shown.find((x) => x.d.id === hover) : undefined;
  const hovPos = hovDest ? px(hovDest.d) : null;
  const hidden = dests.filter((x) => exists(x) && !x.status.ok && inView(v, x.d)).length;

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
          <defs>
            <radialGradient id="cpSea" cx="50%" cy="45%" r="75%">
              <stop offset="0%" className="cp-sea-0" />
              <stop offset="100%" className="cp-sea-1" />
            </radialGradient>
            <linearGradient id="cpLand" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" className="cp-land-0" />
              <stop offset="100%" className="cp-land-1" />
            </linearGradient>
          </defs>
          <rect width={size.w} height={size.h} fill="url(#cpSea)" />
          <path d={grid.join('')} className="cp-grat" />
          <g transform={`translate(${ox} ${oy}) scale(${c * k} ${k})`}>
            <path d={WORLD_LAND} className="cp-coast" vectorEffect="non-scaling-stroke" />
            <path d={WORLD_LAND} className="cp-land" vectorEffect="non-scaling-stroke" />
            <path d={WORLD_BORDERS} className="cp-border" vectorEffect="non-scaling-stroke" />
          </g>
          {cityLabels.map(({ t, p, lb }) => (
            <g key={t.name} className="cp-city">
              <rect x={p.x - 1.6} y={p.y - 1.6} width={3.2} height={3.2} />
              {lb && <text x={lb.x} y={lb.y} textAnchor={lb.anchor} fontSize={11}>{t.name}</text>}
            </g>
          ))}
          {shown.map((x) => {
            const p = px(x.d), q = geoPx(x.d);
            return Math.hypot(p.x - q.x, p.y - q.y) > 3
              ? <g key={`l${x.d.id}`}><line x1={q.x} y1={q.y} x2={p.x} y2={p.y} className="cp-pin-leader" /><circle cx={q.x} cy={q.y} r={1.6} className="cp-pin-true" /></g> : null;
          })}
          {shown.map((x) => {
            const p = px(x.d);
            const sel = x.d.id === selected;
            const ob = obligation === x.d.id;
            const ss = SEASON_ORDER.filter((s) => x.d.seasons.includes(s));
            return (
              <g key={x.d.id} className={`cp-pin ${x.status.ok ? 'ok' : 'locked'} ${sel ? 'sel' : ''} ${x.d.id === hover ? 'hov' : ''}`}
                transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`} onClick={() => onSelect(x.d.id)}
                onMouseEnter={() => setHover(x.d.id)} onMouseLeave={() => setHover((h) => (h === x.d.id ? null : h))}>
                <circle r={14} className="cp-pin-hit" />
                <circle r={11} className="cp-pin-halo" />
                {ob && <circle r={9} className="cp-pin-oblig" />}
                <circle r={5.5} className="cp-pin-dot" />
                <g className="cp-pin-seasons">
                  {ss.map((s, i) => <SeasonGlyph key={s} s={s} x={ss.length === 1 ? 0 : i === 0 ? -7.5 : 7.5} y={-16} />)}
                </g>
              </g>
            );
          })}
          {shown.map((x) => {
            const lb = labels.get(x.d.id);
            if (!lb) return null;
            return (
              <text key={x.d.id} x={lb.x} y={lb.y} textAnchor={lb.anchor} fontSize={fs}
                className={`cp-pin-label ${x.d.id === selected ? 'sel' : ''} ${x.d.id === hover ? 'hov' : ''} ${x.status.ok ? '' : 'locked'}`}>{x.d.name}</text>
            );
          })}
        </svg>
        {hovDest && hovPos && (
          <div className={`cp-map-tip ${hovPos.y < 120 ? 'below' : ''}`} style={{ left: Math.max(130, Math.min(size.w - 130, hovPos.x)), top: hovPos.y }}>
            <b>{hovDest.d.name}</b>
            <span>{hovDest.d.place} · {hovDest.d.country}</span>
            <span className="cp-map-tip-s">
              {SEASON_ORDER.filter((s) => hovDest.d.seasons.includes(s)).map((s) => (
                <em key={s} className={s === season ? 'on' : ''}><SeasonIcon s={s} />{s === 'summer' ? 'Sommer' : 'Winter'}</em>
              ))}
            </span>
            <span>{MON_FULL[month]}: {CAMP_CLIMATE[hovDest.d.climate].label}, Ausfall {Math.round(campWeather(hovDest.d, month).risk * 100)} %</span>
            {!hovDest.status.ok && <span className="bad">{hovDest.status.reason}</span>}
            {hovDest.aiCount > 0 && <span>{hovDest.aiCount} {hovDest.aiCount === 1 ? 'Verein' : 'Vereine'} der Liga vor Ort</span>}
          </div>
        )}
        <div className="cp-map-legend">
          <span><i className="ok" />buchbar</span>
          <span><SeasonIcon s="summer" />Sommer</span><span><SeasonIcon s="winter" />Winter</span>
          {obligation && <span><i className="oblig" />Sponsor-Pflicht</span>}
          {hidden > 0 && (
            <label className="cp-map-toggle"><input type="checkbox" checked={showLocked} onChange={(e) => setShowLocked(e.target.checked)} />
              {hidden} gesperrte zeigen</label>
          )}
        </div>
      </div>
    </div>
  );
}

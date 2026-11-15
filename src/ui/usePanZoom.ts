// =============================================================================
// VERSCHIEBEN & ZOOMEN einer SVG-Szene (Wunsch Pascal: Stadiongelände und
// Vereinsgelände mit der linken Maustaste verschieben, mit dem Mausrad zoomen).
// Arbeitet nur über die viewBox – die Zeichnung bleibt scharf, nichts wird
// neu berechnet. Ein kurzer Klick bleibt ein Klick (Schwelle 5 px); nach einem
// Zug wird der folgende Klick geschluckt, damit kein Gebäude „aus Versehen“
// gewählt wird. Rechnet über getScreenCTM, also unabhängig von der UI-Skalierung.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, MouseEvent as RMouseEvent } from 'react';

export interface PanBox { x: number; y: number; w: number; h: number }
export interface PanZoomOpts {
  /** Ausschnitt bei Zoom 1 (Mitte = Startlage). */
  base: PanBox;
  /** Bereich, den die Bildmitte nicht verlassen darf. */
  bounds: PanBox;
  minZoom?: number;
  maxZoom?: number;
  startZoom?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function usePanZoom({ base, bounds, minZoom = 0.6, maxZoom = 3, startZoom = 1 }: PanZoomOpts) {
  const home = { cx: base.x + base.w / 2, cy: base.y + base.h / 2, z: startZoom };
  const [view, setView] = useState(home);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; cx: number; cy: number; k: number; moved: boolean } | null>(null);
  const swallow = useRef(false);

  const fit = useCallback((v: { cx: number; cy: number; z: number }) => ({
    z: clamp(v.z, minZoom, maxZoom),
    cx: clamp(v.cx, bounds.x, bounds.x + bounds.w),
    cy: clamp(v.cy, bounds.y, bounds.y + bounds.h),
  }), [bounds.x, bounds.y, bounds.w, bounds.h, minZoom, maxZoom]);

  /** Szenen-Einheiten je Bildschirmpixel. */
  const unitsPerPx = () => { const m = svgRef.current?.getScreenCTM(); return m && m.a ? 1 / m.a : 1; };
  /** Bildschirmpunkt → Szenenkoordinaten. */
  const toScene = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current, m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = svg.createSVGPoint(); p.x = clientX; p.y = clientY;
    const q = p.matrixTransform(m.inverse());
    return [q.x, q.y];
  };

  const zoomAt = useCallback((factor: number, clientX?: number, clientY?: number) => {
    setView((v) => {
      const z = clamp(v.z * factor, minZoom, maxZoom);
      if (z === v.z) return v;
      const at = clientX != null && clientY != null ? toScene(clientX, clientY) : null;
      if (!at) return fit({ ...v, z });
      // Der Punkt unter dem Zeiger bleibt stehen.
      const r = v.z / z;
      return fit({ z, cx: at[0] + (v.cx - at[0]) * r, cy: at[1] + (v.cy - at[1]) * r });
    });
  }, [fit, minZoom, maxZoom]);

  // Mausrad: eigener Hörer (nicht passiv), damit die Seite nicht mitscrollt.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: RPointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, k: unitsPerPx(), moved: false };
  };
  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      d.moved = true; setDragging(true);
      try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ohne Capture weiter */ }
    }
    setView((v) => fit({ z: v.z, cx: d.cx - dx * d.k, cy: d.cy - dy * d.k }));
  };
  const end = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) { swallow.current = true; setDragging(false); setTimeout(() => { swallow.current = false; }, 0); }
  };
  /** Klick direkt nach einem Zug nicht weiterreichen. */
  const onClickCapture = (e: RMouseEvent) => { if (swallow.current) { e.stopPropagation(); e.preventDefault(); swallow.current = false; } };

  const w = base.w / view.z, h = base.h / view.z;
  return {
    svgRef,
    viewBox: `${(view.cx - w / 2).toFixed(1)} ${(view.cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    zoom: view.z,
    dragging,
    atHome: Math.abs(view.z - home.z) < 0.01 && Math.abs(view.cx - home.cx) < 1 && Math.abs(view.cy - home.cy) < 1,
    zoomIn: () => zoomAt(1.3),
    zoomOut: () => zoomAt(1 / 1.3),
    reset: () => setView(home),
    bind: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture },
  };
}

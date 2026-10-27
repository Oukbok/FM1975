import { DisplayMode } from '../engine/save';
import { type ReactNode, useEffect, useState } from 'react';

// =============================================================================
// ANZEIGE / AUFLÖSUNG — Konstanten, Helfer & Rahmen
// =============================================================================

/** Auswählbare Auflösungen, gruppiert nach Seitenverhältnis. */
export const RESOLUTION_GROUPS: { label: string; options: string[] }[] = [
  { label: '16:9', options: ['1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'] },
  { label: '16:10', options: ['1280x800', '1680x1050', '1920x1200', '2560x1600'] },
  { label: '21:9 (Ultrawide)', options: ['2560x1080', '3440x1440', '3840x1600'] },
];

/**
 * Wendet den Anzeige-Modus an. "Vollbild" und "Randlos" nutzen die
 * Fullscreen-API (Randlos = funktional Vollbild, aber getrennt wählbar),
 * "Fenster" verlässt den Vollbild. Robust gegen fehlende API/abgelehnte Gesten.
 */
export function applyDisplayMode(mode: DisplayMode): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  try {
    if (mode === 'fullscreen' || mode === 'borderless') {
      if (!document.fullscreenElement && el.requestFullscreen) {
        const p = el.requestFullscreen();
        if (p && typeof p.catch === 'function') p.catch(() => { /* Geste/Support fehlt */ });
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        const p = document.exitFullscreen();
        if (p && typeof p.catch === 'function') p.catch(() => { /* ignore */ });
      }
    }
  } catch {
    /* Fullscreen nicht verfügbar — kein Crash */
  }
}

/**
 * Rahmen um das gesamte Spiel. Bei fester Auflösung wird das Spiel in einem
 * zentrierten Rahmen mit passendem Seitenverhältnis dargestellt (Letterboxing/
 * Pillarboxing, dunkler Hintergrund) und so skaliert, dass es in den Viewport
 * passt ("fit", nichts wird abgeschnitten). Bei "Automatisch" füllt das Spiel
 * responsiv den Viewport. Die UI-Skalierung wirkt in beiden Fällen via `zoom`.
 */
/**
 * Automatischer Zoom-Faktor nach effektiver Bildschirmbreite.
 * Basisbreite 1920px = 1.0. Bei 3840px = 1.5 (+50%), dazwischen linear.
 * Unter 1920px proportional herunter, gedeckelt bei 0.6. Ergebnis clamped 0.6..1.5.
 */
export function autoScaleForWidth(width: number): number {
  const w = width > 0 ? width : 1920;
  let s: number;
  if (w >= 1920) {
    s = 1 + 0.5 * (w - 1920) / 1920; // 1920→1.0, 3840→1.5
  } else {
    s = w / 1920; // kleiner als Basis → proportional runter
  }
  return Math.max(0.6, Math.min(1.5, s));
}

/**
 * Festes Design-Canvas. 3840x2160 (4K) ist die verbindliche Referenz-Auflösung:
 * Bei exakt dieser Auflösung sieht die Zentrale/Dashboard-Ansicht so aus wie
 * heute. `DESIGN_ZOOM` ist der Zoom, der genau diese 4K-Darstellung erzeugt
 * (= autoScaleForWidth(3840) = 1.5). Ein einziger Quellwert, kein Raten.
 */
export const DESIGN_CANVAS = { w: 3840, h: 2160 };

export function DisplayFrame({ resolution, uiScale, children }: {
  resolution: string; uiScale: number; children: ReactNode;
}) {
  // Feste Auflösung parsen; im Auto-Modus gilt das 4K-Design-Canvas als Referenz.
  const parsed = resolution !== 'auto' ? parseResolution(resolution) : null;
  const canvas = parsed ?? DESIGN_CANVAS;

  const [vp, setVp] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  // Resize-Handling: der Einpass-Faktor hängt stets von der aktuellen
  // Viewport-Größe ab. Sauberes Cleanup.
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Innerer Zoom des Canvas (erzeugt bei der jeweiligen Canvas-Breite die
  // Referenz-Darstellung). Für das 4K-Design-Canvas = 1.5 → heutige Ansicht.
  const designZoom = autoScaleForWidth(canvas.w);

  // Uniformer Einpass-Faktor: skaliert das GESAMTE Canvas gleichmäßig in den
  // Viewport (fit, zentriert, nichts abgeschnitten) → bei kleineren Auflösungen
  // bleiben alle Proportionen 1:1 erhalten, kein Reflow/Umbruch/Verdichten.
  // Der manuelle uiScale-Slider wirkt multiplikativ als Feinjustierung
  // (Default 100 → reines Auto/Fit-Verhalten).
  const manual = (uiScale || 100) / 100;
  const fit = Math.min(vp.w / canvas.w, vp.h / canvas.h) * manual;

  return (
    <div className="display-outer">
      <div
        className="display-inner"
        style={{
          width: canvas.w,
          height: canvas.h,
          transform: `translate(-50%, -50%) scale(${fit})`,
        }}
      >
        <div className="display-content" style={{ zoom: designZoom, height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Parst "BREITExHÖHE" zu Zahlen; null bei ungültigem Wert. */
export function parseResolution(v: string): { w: number; h: number } | null {
  const m = /^(\d+)x(\d+)$/.exec(v);
  if (!m) return null;
  const w = +m[1], h = +m[2];
  if (!w || !h) return null;
  return { w, h };
}

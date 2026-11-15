// Bedienknöpfe zu ui/usePanZoom.ts: hinein, heraus, Ausgangslage. CSS `.pz-*` in 28-stadium.css.
export function PanZoomControls({ pz, hint }: { pz: { zoomIn: () => void; zoomOut: () => void; reset: () => void; atHome: boolean; zoom: number }; hint?: boolean }) {
  return (
    <div className="pz-ctl" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      {hint && <span className="pz-hint">Ziehen verschiebt · Mausrad zoomt</span>}
      <button type="button" className="b3 b3-s b3-icon" onClick={pz.zoomOut} aria-label="Herauszoomen" title="Herauszoomen">−</button>
      <span className="pz-zoom">{Math.round(pz.zoom * 100)} %</span>
      <button type="button" className="b3 b3-s b3-icon" onClick={pz.zoomIn} aria-label="Hineinzoomen" title="Hineinzoomen">+</button>
      <button type="button" className="b3 b3-s" onClick={pz.reset} disabled={pz.atHome}>Zentrieren</button>
    </div>
  );
}

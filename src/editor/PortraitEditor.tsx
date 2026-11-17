// =============================================================================
// SPIELERBILD (Porträt) hochladen und zuschneiden (Wunsch Pascal): ein Bild je
// Spieler bzw. Legende, das im Spiel überall das Gesicht ersetzt (Datensatz
// `playerPhotos[].portrait`). Datei wählen oder ins Feld ziehen → Vorschau im
// Kopf-Format 512:600 (automatisch zentriert; Ziehen verschiebt, Mausrad/Regler
// zoomt) → „Übernehmen“ speichert 512 × 600 als WebP (sonst JPEG).
// Genutzt im Bereich Spielerfotos und im Formular jeder Legende.
// =============================================================================
import { useEffect, useRef, useState, type DragEvent, type PointerEvent as RPointerEvent } from 'react';
import type { PlayerPhotoSet } from '../data/dataset/schema';

/** Ausgabegröße = Format der Gesichtsbilder im Spiel. */
export const PORTRAIT_W = 512;
export const PORTRAIT_H = 600;
/** Vorschau-Rahmen im Editor (gleiches Seitenverhältnis). */
const FW = 240;
const FH = Math.round(FW * PORTRAIT_H / PORTRAIT_W);
const MAX_ZOOM = 5;
const ACCEPT = /^image\/(png|jpe?g|webp|gif|bmp|avif)$/;

type Crop = { img: HTMLImageElement; url: string; name: string; zoom: number; x: number; y: number };

/** Bilddatei lesen (Objekt-URL; der Aufrufer gibt sie frei). */
export function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    if (!ACCEPT.test(file.type)) { reject(new Error(`„${file.name}“ ist kein unterstütztes Bild (PNG, JPEG, WebP).`)); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`„${file.name}“ konnte nicht gelesen werden.`)); };
    img.src = url;
  });
}

/** Maßstab, bei dem das Bild den Rahmen gerade füllt (× Zoom). */
const scaleOf = (c: Pick<Crop, 'img' | 'zoom'>) => Math.max(FW / c.img.naturalWidth, FH / c.img.naturalHeight) * c.zoom;

/** Verschiebung so begrenzen, dass das Bild den Rahmen immer ganz füllt. */
function clampCrop(c: Crop): Crop {
  const s = scaleOf(c);
  const mx = Math.max(0, (c.img.naturalWidth * s - FW) / 2);
  const my = Math.max(0, (c.img.naturalHeight * s - FH) / 2);
  return { ...c, x: Math.max(-mx, Math.min(mx, c.x)), y: Math.max(-my, Math.min(my, c.y)) };
}

/** Ausschnitt als Data-URL 512 × 600 (WebP 0,85, sonst JPEG 0,88). */
export function renderPortrait(c: Pick<Crop, 'img' | 'zoom' | 'x' | 'y'>): string {
  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_W; canvas.height = PORTRAIT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte nicht verarbeitet werden.');
  const r = PORTRAIT_W / FW;
  const s = scaleOf(c);
  const w = c.img.naturalWidth * s, h = c.img.naturalHeight * s;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c.img, (FW / 2 + c.x - w / 2) * r, (FH / 2 + c.y - h / 2) * r, w * r, h * r);
  const webp = canvas.toDataURL('image/webp', 0.85);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.88);
}

const kb = (url: string) => Math.round((url.length * 3) / 4 / 1024);

export function PortraitEditor({ set, ensure, onChange }: { set: PlayerPhotoSet | undefined; ensure: () => PlayerPhotoSet; onChange: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; x: number; y: number } | null>(null);
  const current = set?.portrait;

  useEffect(() => () => { if (crop) URL.revokeObjectURL(crop.url); }, [crop?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    try {
      const { img, url } = await loadImage(f);
      setCrop({ img, url, name: f.name, zoom: 1, x: 0, y: 0 });
    } catch (e) { setErr((e as Error).message); }
  };
  const zoomTo = (z: number) => setCrop((c) => (c ? clampCrop({ ...c, zoom: Math.max(1, Math.min(MAX_ZOOM, z)) }) : c));
  const apply = () => {
    if (!crop) return;
    try {
      const s = ensure();
      s.portrait = renderPortrait(crop);
      setCrop(null);
      onChange();
    } catch (e) { setErr((e as Error).message); }
  };
  const remove = () => { if (!set) return; delete set.portrait; onChange(); };

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: crop.x, y: crop.y };
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setCrop((c) => (c ? clampCrop({ ...c, x: d.x + e.clientX - d.sx, y: d.y + e.clientY - d.sy }) : c));
  };
  const up = () => { drag.current = null; };

  const s = crop ? scaleOf(crop) : 1;
  const dropProps = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => { e.preventDefault(); setOver(false); void open(e.dataTransfer.files?.[0]); },
  };

  return (
    <div className="ed-portrait" data-has={current ? '1' : '0'}>
      <div className={`ed-portrait-frame ${over ? 'over' : ''} ${crop ? 'crop' : ''}`} style={{ width: FW, height: FH }} {...dropProps}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onWheel={(e) => { if (crop) zoomTo(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }}>
        {crop ? (
          <img src={crop.url} alt="" draggable={false} className="ed-portrait-src" style={{
            width: crop.img.naturalWidth * s, height: crop.img.naturalHeight * s,
            transform: `translate(${FW / 2 + crop.x - (crop.img.naturalWidth * s) / 2}px, ${FH / 2 + crop.y - (crop.img.naturalHeight * s) / 2}px)`,
          }} />
        ) : current ? (
          <img src={current} alt="Spielerbild" draggable={false} className="ed-portrait-img" />
        ) : (
          <button type="button" className="ed-portrait-empty" onClick={() => file.current?.click()}>
            <b>Spielerbild hochladen</b>
            <span>Datei wählen oder hierher ziehen</span>
          </button>
        )}
        {crop && <div className="ed-portrait-guide" aria-hidden="true" />}
      </div>
      <div className="ed-portrait-side">
        {crop ? (
          <>
            <span className="ed-label">Zuschnitt</span>
            <span className="ed-hint">Ziehen verschiebt, Mausrad oder Regler zoomt. Kopf in die Mitte, Hals unten – wie die Gesichter im Spiel.</span>
            <label className="ed-field">
              <span className="ed-label">Zoom</span>
              <input type="range" className="ed-portrait-zoom" min={1} max={MAX_ZOOM} step={0.01} value={crop.zoom} onChange={(e) => zoomTo(+e.target.value)} />
            </label>
            <div className="ed-portrait-acts">
              <button className="ed-btn" data-act="portrait-center" onClick={() => setCrop((c) => (c ? { ...c, zoom: 1, x: 0, y: 0 } : c))}>Automatisch zentrieren</button>
              <button className="ed-btn on" data-act="portrait-apply" onClick={apply}>Übernehmen</button>
              <button className="ed-btn" data-act="portrait-cancel" onClick={() => setCrop(null)}>Abbrechen</button>
            </div>
            <span className="ed-hint">{crop.name} · {crop.img.naturalWidth} × {crop.img.naturalHeight} px → {PORTRAIT_W} × {PORTRAIT_H} px</span>
          </>
        ) : (
          <>
            <span className="ed-hint">{current
              ? `Gespeichert: ${PORTRAIT_W} × ${PORTRAIT_H} px, ${kb(current)} KB. Ersetzt im Spiel überall das Gesicht – Profil, Listen, Zeitung.`
              : 'Noch kein Spielerbild – im Spiel erscheint das übliche Gesicht.'}</span>
            <div className="ed-portrait-acts">
              <button className="ed-btn" data-act="portrait-add" onClick={() => file.current?.click()}>{current ? 'Anderes Bild' : 'Bild wählen'}</button>
              {current && <button className="ed-btn" data-act="portrait-del" onClick={remove}>Entfernen</button>}
            </div>
          </>
        )}
        {err && <div className="ed-err">{err}</div>}
      </div>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void open(f); }} />
    </div>
  );
}

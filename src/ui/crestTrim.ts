// Wappen-Bilder einheitlich zentrieren (Wunsch Pascal): viele Bilder haben ungleichmäßige transparente
// Ränder, dadurch wirken schmale Wappen (z. B. Stuttgart Rot) in Tabellen verschoben. Einmal pro Bild
// wird der sichtbare Bereich ermittelt und mittig in ein quadratisches Bild gesetzt (Cache nach src).
import { useEffect, useState } from 'react';

const OUT = 128;
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function trim(src: string): Promise<string> {
  const hit = pending.get(src);
  if (hit) return hit;
  const p = new Promise<string>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) return resolve(src);
        const sc = Math.min(1, 256 / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const x = c.getContext('2d', { willReadFrequently: true });
        if (!x) return resolve(src);
        x.drawImage(img, 0, 0, cw, ch);
        const d = x.getImageData(0, 0, cw, ch).data;
        let l = cw, t = ch, r = -1, b = -1;
        for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) {
          if (d[(yy * cw + xx) * 4 + 3] > 12) { if (xx < l) l = xx; if (xx > r) r = xx; if (yy < t) t = yy; if (yy > b) b = yy; }
        }
        if (r < 0) return resolve(src);
        const bw = r - l + 1, bh = b - t + 1;
        // Schon (fast) mittig und randlos: Original behalten.
        if (Math.abs(l - (cw - 1 - r)) <= 1 && Math.abs(t - (ch - 1 - b)) <= 1 && bw >= cw - 4 && bh >= ch - 4 && cw === ch) return resolve(src);
        const o = document.createElement('canvas'); o.width = OUT; o.height = OUT;
        const ox = o.getContext('2d');
        if (!ox) return resolve(src);
        const f = OUT / Math.max(bw, bh);
        const dw = bw * f, dh = bh * f;
        ox.imageSmoothingQuality = 'high';
        ox.drawImage(c, l, t, bw, bh, (OUT - dw) / 2, (OUT - dh) / 2, dw, dh);
        resolve(o.toDataURL('image/png'));
      } catch { resolve(src); }   // z. B. fremde Herkunft ohne CORS
    };
    img.onerror = () => resolve(src);
    img.src = src;
  }).then((out) => { cache.set(src, out); return out; });
  pending.set(src, p);
  return p;
}

/** Zentrierte Fassung eines Wappenbilds (bis sie fertig ist: das Original). */
export function useCenteredCrest(src: string | undefined): string | undefined {
  const [out, setOut] = useState(() => (src ? cache.get(src) ?? src : undefined));
  useEffect(() => {
    if (!src) { setOut(undefined); return; }
    const c = cache.get(src);
    if (c) { setOut(c); return; }
    setOut(src);
    let live = true;
    trim(src).then((v) => { if (live) setOut(v); });
    return () => { live = false; };
  }, [src]);
  return out;
}

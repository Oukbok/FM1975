// =============================================================================
// Schwebende Einblendungen (InfoTip-Popover, Zustands-Hover) – gemeinsame Lage
// =============================================================================
// Einblendungen hängen per Portal an <body> und liegen damit außerhalb des
// skalierten Spielrahmens (DisplayFrame: `scale(fit)` + `zoom`). Damit sie
// trotzdem mit der UI wachsen, werden sie mit demselben Faktor per
// `transform: scale()` (Ursprung oben links) gezeichnet; die Lage rechnet in
// Bildschirm-Pixeln und hält sie im sichtbaren Bereich.
// =============================================================================

/** Gesamtfaktor der UI-Skalierung (DisplayFrame-Zoom × Fit-Skalierung), sonst 1. */
export function uiScale(): number {
  if (typeof document === 'undefined') return 1;
  let s = 1;
  try {
    const content = document.querySelector('.display-content');
    if (content) s *= parseFloat(getComputedStyle(content).zoom || '1') || 1;
    const inner = document.querySelector('.display-inner');
    const t = inner ? getComputedStyle(inner).transform : 'none';
    if (t && t !== 'none') s *= new DOMMatrix(t).a || 1;
  } catch { /* ohne Rahmen: 1 */ }
  return s > 0.2 && s < 5 ? s : 1;
}

/**
 * Lage einer Einblendung (Breite/Höhe in Bildschirm-Pixeln) zum Auslöser:
 * mittig darunter, bei Platzmangel darüber, immer `gap` vom Rand entfernt.
 */
export function placeNear(anchor: DOMRect, w: number, h: number, gap = 8, offset = 6): { left: number; top: number } {
  const vw = window.innerWidth, vh = window.innerHeight;
  const left = Math.max(gap, Math.min(vw - w - gap, anchor.left + anchor.width / 2 - w / 2));
  let top = anchor.bottom + offset;
  if (top + h > vh - gap) top = Math.max(gap, anchor.top - h - offset);
  return { left, top };
}

/**
 * Lage einer großen Einblendung (Spieler-Infokarte) neben dem Auslöser: rechts daneben,
 * sonst links, sonst darunter/darüber; senkrecht mittig zum Auslöser. Bleibt immer
 * `gap` vom Bildschirmrand entfernt (Breite/Höhe in Bildschirm-Pixeln, vorher mit
 * `fitScale` passend verkleinert).
 */
export function placeBeside(anchor: DOMRect, w: number, h: number, gap = 8, offset = 12): { left: number; top: number } {
  const vw = window.innerWidth, vh = window.innerHeight;
  const clampX = (x: number) => Math.max(gap, Math.min(vw - w - gap, x));
  const clampY = (y: number) => Math.max(gap, Math.min(vh - h - gap, y));
  const midY = clampY(anchor.top + anchor.height / 2 - h / 2);
  if (anchor.right + offset + w <= vw - gap) return { left: anchor.right + offset, top: midY };
  if (anchor.left - offset - w >= gap) return { left: anchor.left - offset - w, top: midY };
  const left = clampX(anchor.left + anchor.width / 2 - w / 2);
  if (anchor.bottom + offset + h <= vh - gap) return { left, top: anchor.bottom + offset };
  if (anchor.top - offset - h >= gap) return { left, top: anchor.top - offset - h };
  return { left, top: midY };
}

/** Skalierung, mit der eine Einblendung fester Größe (UI-Pixel) ganz in den Bildschirm passt. */
export function fitScale(w: number, h: number, gap = 8): number {
  const s = uiScale();
  const max = Math.min((window.innerWidth - 2 * gap) / w, (window.innerHeight - 2 * gap) / h);
  return Math.max(0.3, Math.min(s, max));
}

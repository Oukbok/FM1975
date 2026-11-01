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

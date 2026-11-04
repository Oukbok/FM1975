// =============================================================================
// Sofort-Einblendung für Zustands-Symbole (ersetzt den trägen title-Tooltip)
// =============================================================================
// Maus: erscheint ohne Verzögerung beim Überfahren, verschwindet beim Verlassen.
// Tastatur: bei Fokus. Touch: Tippen öffnet/schließt (die Zeile darunter
// reagiert dann nicht). Liegt per Portal über allem und wächst mit der
// UI-Skalierung (ui/floating.ts). Stil wie das InfoTip-Popover, nur kleiner.
// =============================================================================
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { placeNear, uiScale } from '../../ui/floating';

export function useStatusTip(title: string, detail: string, color: string, note?: string) {
  return useFloatTip(() => (
    <>
      <span className="st-tip-row">
        <span className="st-tip-dot" style={{ background: color }} />
        <b>{title}</b> <span className="st-tip-val">{detail}</span>
      </span>
      {note && <span className="st-tip-note">{note}</span>}
    </>
  ), detail);
}

/**
 * Allgemeine Sofort-Einblendung (gleiches Verhalten wie {@link useStatusTip}):
 * `render` liefert den Inhalt erst beim Öffnen, `dep` löst eine neue Lageberechnung aus.
 */
export function useFloatTip(render: () => ReactNode, dep?: unknown, className = '') {
  const anchor = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const [open, setOpen] = useState<false | 'hover' | 'pin'>(false);
  const [pos, setPos] = useState<{ left: number; top: number; s: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !pop.current) { setPos(null); return; }
    const s = uiScale();
    const { left, top } = placeNear(anchor.current.getBoundingClientRect(), pop.current.offsetWidth * s, pop.current.offsetHeight * s, 6, 5);
    setPos({ left, top, s });
  }, [open, dep]);

  // Angeheftet (Touch): Tippen daneben, Scrollen oder Esc schließt
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: PointerEvent) => { if (!anchor.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handlers = {
    ref: anchor,
    onMouseEnter: () => { if (!touch.current) setOpen((o) => o || 'hover'); },
    onMouseLeave: () => setOpen((o) => (o === 'hover' ? false : o)),
    onFocus: () => setOpen((o) => o || 'hover'),
    onBlur: () => setOpen(false),
    onPointerDown: (e: React.PointerEvent) => { touch.current = e.pointerType === 'touch' || e.pointerType === 'pen'; },
    onClick: (e: React.MouseEvent) => {
      if (!touch.current) return; // Maus: Klick geht an die Zeile (z. B. Profil öffnen)
      e.stopPropagation(); e.preventDefault();
      setOpen((o) => (o === 'pin' ? false : 'pin'));
    },
  };

  const layer: ReactNode = open && typeof document !== 'undefined' ? createPortal(
    <div ref={pop} className={`st-tip${className ? ` ${className}` : ''}`} role="tooltip"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, transform: `scale(${pos?.s ?? 1})` }}>
      {render()}
    </div>,
    document.body,
  ) : null;

  return { handlers, layer };
}

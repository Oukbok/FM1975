// =============================================================================
// Ziehen & Ablegen im Textmodus (Wunsch Pascal): Zeilen der Spielerliste, der
// Live-Aufstellung und Slots/Bank des Spielfelds tragen `data-dnd={schlüssel}`.
// Ein Zug über 6 px = Ziehen; Ablage auf einem anderen `data-dnd` ruft onDrop (mit Zeigerlage,
// z. B. für das freie Verschieben auf dem Spielfeld `data-dnd="pitch"`).
// Ohne Bewegung bleibt es ein normaler Klick (der folgende click wird nur nach
// echtem Ziehen geschluckt). Escape bricht ab. Geist per Portal am Zeiger.
// =============================================================================
import { useEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type DndState = { key: string; x: number; y: number; over: string | null } | null;

export const dndTargetAt = (x: number, y: number) =>
  (document.elementFromPoint(x, y)?.closest('[data-dnd]') as HTMLElement | null)?.dataset.dnd ?? null;

export function useDnd(onDrop: (from: string, to: string, cx: number, cy: number) => void) {
  const [drag, setDrag] = useState<DndState>(null);
  const start = useRef<{ key: string; x: number; y: number } | null>(null);
  const moved = useRef(false);
  const aborted = useRef(false);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      if (!moved.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) <= 6) return;
      moved.current = true;
      const over = dndTargetAt(e.clientX, e.clientY);
      setDrag({ key: s.key, x: e.clientX, y: e.clientY, over: over === s.key ? null : over });
    };
    // Klick nach dem Ziehen (oder nach Abbruch per Escape) schlucken – sonst würde zusätzlich gewählt.
    const eatClick = () => {
      const eat = (c: MouseEvent) => { c.stopPropagation(); c.preventDefault(); };
      window.addEventListener('click', eat, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', eat, true), 0);
    };
    const up = (e: PointerEvent) => {
      if (aborted.current) { aborted.current = false; eatClick(); return; }
      const s = start.current, was = moved.current;
      start.current = null; moved.current = false;
      if (!s || !was) return;
      setDrag(null);
      eatClick();
      const to = dndTargetAt(e.clientX, e.clientY);
      if (to && to !== s.key) dropRef.current(s.key, to, e.clientX, e.clientY);
    };
    const cancel = () => { start.current = null; moved.current = false; setDrag(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && start.current) { e.preventDefault(); e.stopPropagation(); cancel(); aborted.current = true; } };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key, true);
    };
  }, []);

  const down = (e: RPE, key: string) => {
    if (e.button !== 0) return;
    // Text nicht markieren, während gezogen wird.
    if (e.pointerType === 'mouse') e.preventDefault();
    start.current = { key, x: e.clientX, y: e.clientY }; moved.current = false; aborted.current = false;
  };
  return { drag, down };
}

/** Geist am Zeiger (Portal, damit Skalierung/Überlauf der Boxen nicht stören). */
export function DndGhost({ drag, children }: { drag: DndState; children: ReactNode }) {
  if (!drag) return null;
  return createPortal(<div className="tm-dnd-ghost" style={{ left: drag.x, top: drag.y }}>{children}</div>, document.body);
}

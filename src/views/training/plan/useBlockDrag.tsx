// =============================================================================
// Ziehen per Zeiger im Ringbuch: Baustein aus den Reitern ins Feld, Felder tauschen,
// zurück in die Reiter = leeren. Klick wählt einen Baustein, Klick ins Feld setzt ihn.
// =============================================================================
import { useRef, useState, type PointerEvent as RPE } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/Icon';
import { BLOCKS_BY_ID } from '../../../engine/weeklyTraining';
import { SlotKey } from '../../../engine/trainingPlan';
import { WeeklyTrainingPlan } from '../../../types';
import { BLOCK_SHORT } from '../planParts';
import { blockKind } from './model';

export interface Drag { id: string | null; from?: { day: number; slot: SlotKey }; sx: number; sy: number; cx: number; cy: number; active: boolean; over: string | null }

export function useBlockDrag(plan: WeeklyTrainingPlan, refresh: () => void) {
  const [selected, setSelected] = useState<string | null | undefined>(undefined);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setCell = (day: number, slot: SlotKey, id: string | null) => { plan.days[day][slot] = id; };

  const targetAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest('[data-day]') as HTMLElement | null;
    if (cell) return `${cell.dataset.day}:${cell.dataset.slot}`;
    if (el?.closest('[data-drop="palette"], .tp-palette')) return 'palette';
    return null;
  };

  const begin = (e: RPE, id: string | null, from?: { day: number; slot: SlotKey }) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { id, from, sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY, active: false, over: null };
    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      cur.cx = ev.clientX; cur.cy = ev.clientY;
      if (!cur.active && Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy) > 5) cur.active = true;
      if (!cur.active) return;
      cur.over = targetAt(ev.clientX, ev.clientY);
      setDrag({ ...cur });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (!cur.active) {
        if (!cur.from) setSelected((s) => (s === cur.id ? undefined : cur.id));
        return;
      }
      const over = cur.over;
      if (over && over !== 'palette') {
        const [ds, slot] = over.split(':');
        const day = Number(ds), sk = slot as SlotKey;
        if (cur.from) {
          const other = plan.days[day][sk];
          setCell(day, sk, cur.id);
          setCell(cur.from.day, cur.from.slot, other);
        } else setCell(day, sk, cur.id);
      } else if (cur.from) setCell(cur.from.day, cur.from.slot, null);
      refresh();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const ghostBlock = drag?.active ? (drag.id ? BLOCKS_BY_ID[drag.id] : null) : undefined;
  const ghost = ghostBlock !== undefined && drag ? createPortal(
    <div className={`tp-ghost trk-${blockKind(ghostBlock)}`} style={{ left: drag.cx, top: drag.cy }}>
      <Icon name={ghostBlock ? ghostBlock.icon : 'trFree'} size={28} />
      <span>{ghostBlock ? BLOCK_SHORT[ghostBlock.id] : 'Frei'}</span>
    </div>, document.body) : null;

  return { selected, setSelected, drag, begin, setCell, ghost };
}

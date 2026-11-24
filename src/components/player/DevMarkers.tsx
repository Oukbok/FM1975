// Ereignis-Marker auf der Linie der Spielerentwicklung + Aufschlüsselung der Ursachen
// (Logik in devEvents.ts). Zeigen öffnet die Karte, Klick heftet sie an.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeBeside, uiScale } from '../../ui/floating';
import Icon from '../Icon';
import { KIND_ICON, mainKind, signed, type DevEvent } from './devEvents';
import { utcDate } from './shared';

interface Props {
  events: DevEvent[];
  /** Lage des Markers in % der Zeichenfläche. */
  pos: (ev: DevEvent) => { left: number; top: number };
  /** Ein Marker ist offen (die Linien-Hilfe tritt dann zurück). */
  onOpen?: (open: boolean) => void;
}

export default function DevMarkers({ events, pos, onOpen }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [pin, setPin] = useState<number | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const open = pin ?? hover;
  // Angeheftete Karte: Klick daneben oder Esc schließt sie.
  useEffect(() => {
    if (pin == null) return;
    const close = () => { setPin(null); setHover(null); onOpen?.(false); };
    const onDown = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.pp3-evcard, .pp3-ev')) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('pointerdown', onDown, true); window.removeEventListener('keydown', onKey, true); };
  }, [pin, onOpen]);
  const set = (h: number | null, p = pin) => { setHover(h); onOpen?.((p ?? h) != null); };
  return (
    <>
      {events.map((ev, n) => {
        const { left, top } = pos(ev);
        const kind = mainKind(ev);
        const dir = ev.delta > 0 ? 'up' : 'down';
        return (
          <button key={ev.d1} ref={(el) => { btns.current[n] = el; }} type="button" className={`pp3-ev ${dir}${open === n ? ' on' : ''}${kind === 'rating' ? ' rating' : ''}`}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-label={`${ev.delta > 0 ? 'Anstieg' : 'Rückgang'} ${signed(ev.delta)} bis ${utcDate(ev.d1)}`}
            onPointerEnter={() => set(n)} onPointerLeave={() => set(null)}
            onClick={(e) => { e.stopPropagation(); const p = pin === n ? null : n; setPin(p); onOpen?.((p ?? hover) != null); }}>
            <Icon name={KIND_ICON[kind]} size={12} />
          </button>
        );
      })}
      {open != null && events[open] && <EventCard ev={events[open]} anchor={btns.current[open]} pinned={pin === open} onClose={() => { setPin(null); setHover(null); onOpen?.(false); }} />}
    </>
  );
}

function EventCard({ ev, anchor, pinned, onClose }: { ev: DevEvent; anchor: HTMLElement | null; pinned: boolean; onClose: () => void }) {
  const dir = ev.delta > 0 ? 'up' : 'down';
  const same = ev.d0 === ev.d1;
  // Wie die i-Hilfe: über allem (Portal), neben dem Marker, immer ganz im Bild.
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; s: number } | null>(null);
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const s = uiScale();
    const { left, top } = placeBeside(anchor.getBoundingClientRect(), ref.current.offsetWidth * s, ref.current.offsetHeight * s, 8, 10);
    setPos((o) => (o && Math.abs(o.left - left) < 0.5 && Math.abs(o.top - top) < 0.5 && o.s === s ? o : { left, top, s }));
  }, [anchor, ev]);
  if (typeof document === 'undefined') return null;
  // Kleine Bildschirme: Schrift anheben wie der Spielrahmen (data-fs, 34-compact-fonts.css) – das Portal liegt außerhalb.
  const lift = !!document.querySelector('[data-fs]');
  return createPortal(
    <div ref={ref} className={`pp3-evcard${pinned ? ' pinned' : ''}${lift ? ' lift' : ''}`} role="tooltip"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, transform: `scale(${pos?.s ?? 1})` }} onClick={(e) => e.stopPropagation()}>
      <div className="pp3-evcard-head">
        <b className={dir}>{signed(ev.delta)}</b>
        <span>Stärke {ev.from} → {ev.to}</span>
        <em>{same ? utcDate(ev.d1) : `${utcDate(ev.d0)} – ${utcDate(ev.d1)}`}</em>
        {pinned && <button type="button" className="pp3-evcard-x" onClick={onClose} aria-label="Schließen"><Icon name="close" size={12} /></button>}
      </div>
      <ul className="pp3-evcard-list">
        {ev.causes.map((c, i) => (
          <li key={c.kind + i} className={`k-${c.kind}`}>
            <span className={`pp3-evcard-ic${c.kind === 'rating' && (c.v ?? ev.delta) < 0 ? ' flip' : ''}`}><Icon name={KIND_ICON[c.kind]} size={13} /></span>
            <div>
              <div className="pp3-evcard-t">
                <span>{c.title}</span>
                {c.v != null && c.v !== 0 && <b className={c.v > 0 ? 'up' : 'down'}>{signed(c.v)}</b>}
              </div>
              {c.detail && <div className="pp3-evcard-d">{c.detail}</div>}
              {c.lines && c.lines.length > 0 && (
                <ul className="pp3-evcard-why">
                  {c.lines.map((l, j) => (
                    <li key={j}>
                      <span>{l.text}</span>
                      <b className={l.v > 0 ? 'up' : l.v < 0 ? 'down' : 'note'}>{l.v === 0 ? '·' : signed(l.v, 1)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!pinned && <div className="pp3-evcard-foot">Klick heftet die Karte an</div>}
    </div>,
    document.body,
  );
}

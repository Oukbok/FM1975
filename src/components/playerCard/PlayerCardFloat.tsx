// =============================================================================
// Spieler-Infokarte als schwebendes Fenster (Wunsch Pascal, Vorbild EA Fussball Manager)
//  - <PlayerInfoButton p={…} />: kleines i zwischen Gesicht und Name in Spielerlisten;
//    Hover/Fokus öffnet die Karte sofort, Verlassen schließt sie, Tippen schaltet um.
//  - useDelayedPlayerCard(ms, gesperrt): Hover mit Verzögerung (Aufstellung: Karten auf
//    dem Feld und der Bank nach 2 s); Drücken/Ziehen schließt sofort und öffnet nie.
// Die Karte hängt per Portal an <body>, wächst mit der UI-Skalierung × CARD_ZOOM (ui/floating.ts),
// liegt neben dem Auslöser und ragt nie aus dem Bildschirm (sonst kleiner skaliert).
// Sie ist reine Anzeige (`pointer-events: none`), damit sie nie den Hover stört.
// Immer nur eine Karte offen.
// =============================================================================
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Player } from '../../types';
import Icon from '../Icon';
import { useClubProfile } from '../club/ClubLink';
import { fitScale, placeBeside } from '../../ui/floating';
import PlayerInfoCard, { CARD_H, CARD_W, CARD_ZOOM } from './PlayerInfoCard';

/** Schließt die gerade offene Karte (nur eine zur Zeit). */
let closeActive: (() => void) | null = null;
function claim(close: () => void) {
  if (closeActive && closeActive !== close) closeActive();
  closeActive = close;
}
function release(close: () => void) { if (closeActive === close) closeActive = null; }

/** Die Karte am Auslöser `anchor`; schließt bei Esc, Scrollen, Größenänderung und jedem Klick. */
export function PlayerCardPortal({ p, anchor, onClose }: { p: Player; anchor: HTMLElement; onClose: () => void }) {
  const g = useClubProfile()?.game;
  const [pos, setPos] = useState<{ left: number; top: number; s: number } | null>(null);
  useLayoutEffect(() => {
    const s = fitScale(CARD_W, CARD_H, 8, CARD_ZOOM);
    const { left, top } = placeBeside(anchor.getBoundingClientRect(), CARD_W * s, CARD_H * s);
    setPos({ left, top, s });
  }, [anchor, p.id]);
  useEffect(() => {
    claim(onClose);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Klick auf den Auslöser selbst regelt dieser (Tippen schaltet um)
    const onDown = (e: PointerEvent) => { if (!anchor.contains(e.target as Node)) onClose(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      release(onClose);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [onClose, anchor]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="pc-float" role="tooltip" aria-label={`Infokarte ${p.fullName}`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, transform: `scale(${pos?.s ?? 1})`, visibility: pos ? 'visible' : 'hidden' }}>
      <PlayerInfoCard p={p} g={g} />
    </div>,
    document.body,
  );
}

/** Info-Knopf für Spielerzeilen: zwischen Gesicht und Name setzen. */
export function PlayerInfoButton({ p, className }: { p: Player; className?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <>
      <button ref={btn} type="button" className={`pc-ibtn${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
        aria-label={`Infokarte ${p.fullName}`} aria-expanded={open}
        // Maustaste gedrückt = es wird gerade gezogen → nicht öffnen
        onMouseEnter={(e) => { if (!e.buttons) setOpen(true); }}
        onMouseLeave={close}
        onFocus={() => setOpen(true)} onBlur={close}
        // Kein Ziehen/Profil der Zeile auslösen; Tippen (Touch) schaltet die Karte um
        onPointerDown={stop} onMouseDown={stop}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}>
        <Icon name="info" size={15} title="Infokarte" />
      </button>
      {open && btn.current && <PlayerCardPortal p={p} anchor={btn.current} onClose={close} />}
    </>
  );
}

/**
 * Hover mit Verzögerung (Aufstellung: Spieler auf dem Feld/der Bank). `bind(p)` an das Element
 * hängen; `blocked` (z. B. während des Ziehens) schließt sofort und verhindert das Öffnen.
 */
export function useDelayedPlayerCard(ms: number, blocked: boolean): { bind: (p?: Player) => Record<string, unknown>; card: ReactNode } {
  const [cur, setCur] = useState<{ p: Player; el: HTMLElement } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const cancel = useCallback(() => { window.clearTimeout(timer.current); setCur(null); }, []);
  useEffect(() => { if (blocked) cancel(); }, [blocked, cancel]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const bind = (p?: Player) => (!p ? {} : {
    onPointerEnter: (e: RPE<HTMLElement>) => {
      if (blocked || e.pointerType !== 'mouse' || e.buttons) return;
      const el = e.currentTarget;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCur({ p, el }), ms);
    },
    onPointerLeave: cancel,
    onPointerDownCapture: cancel,
  });
  const card = cur && !blocked ? <PlayerCardPortal p={cur.p} anchor={cur.el} onClose={cancel} /> : null;
  return { bind, card };
}

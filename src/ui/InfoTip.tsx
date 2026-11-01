// =============================================================================
// <InfoTip k="…" /> — kleines „i“ mit Erklärung (Hover, Fokus, Klick/Touch)
// =============================================================================
// Texte zentral in data/infoTexts.ts. Das Popover liegt per Portal über allen
// Boxen/Popups, bleibt im Bildschirm (klappt nach oben, wenn unten kein Platz)
// und schließt mit Esc, Klick daneben oder Scrollen. Klick heftet es an.
// Verweis ins Wiki: GameShell registriert `setWikiOpener`.
// =============================================================================
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { INFO_TEXTS, type InfoKey } from '../data/infoTexts';

let wikiOpener: ((articleId: string) => void) | null = null;
/** Von GameShell gesetzt: öffnet das Wiki mit einem Artikel. Rückgabe = Abmelden. */
export function setWikiOpener(fn: ((articleId: string) => void) | null): () => void {
  wikiOpener = fn;
  return () => { if (wikiOpener === fn) wikiOpener = null; };
}

const W = 290;
const GAP = 8;

export function InfoTip({ k, title, text, wiki, className }: {
  /** Schlüssel in data/infoTexts.ts. */
  k?: InfoKey;
  /** Alternativ: Titel/Text direkt (nur für Einzelfälle). */
  title?: string;
  text?: string;
  wiki?: string;
  className?: string;
}) {
  const entry = k ? INFO_TEXTS[k] : undefined;
  const head = title ?? entry?.title ?? '';
  const body = text ?? entry?.text ?? '';
  const wikiId = wiki ?? entry?.wiki;
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const close = useCallback(() => { setOpen(false); setPinned(false); setPos(null); }, []);
  const later = (fn: () => void, ms: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(fn, ms); };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Lage berechnen (nach dem Rendern, damit die Höhe bekannt ist)
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const h = pop.current?.offsetHeight ?? 100;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = r.left + r.width / 2 - W / 2;
    left = Math.max(GAP, Math.min(vw - W - GAP, left));
    let top = r.bottom + 6;
    if (top + h > vh - GAP) top = Math.max(GAP, r.top - h - 6);
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
  }, [open, head, body]);

  // Schließen: Esc, Klick daneben, Scrollen/Größe
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); btn.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || pop.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => { if (!pop.current?.contains(e.target as Node)) close(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  if (!head && !body) return null;
  const hoverIn = () => { if (!pinned) later(() => setOpen(true), 120); };
  const hoverOut = () => { if (!pinned) later(() => setOpen(false), 160); };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <button ref={btn} type="button" className={`itip${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
        aria-label={`Erklärung: ${head}`} aria-expanded={open} aria-describedby={open ? id : undefined}
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        onFocus={() => setOpen(true)}
        onBlur={(e) => { if (!pinned && !pop.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
        onPointerDown={stop} onMouseDown={stop}
        onClick={(e) => {
          e.stopPropagation(); e.preventDefault();
          if (pinned) close(); else { window.clearTimeout(timer.current); setOpen(true); setPinned(true); }
        }}>
        <span aria-hidden="true">i</span>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={pop} id={id} role="tooltip" className="itip-pop"
          style={{ width: W, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
          onMouseEnter={() => window.clearTimeout(timer.current)} onMouseLeave={hoverOut}
          onClick={stop} onPointerDown={stop}>
          {head && <div className="itip-title">{head}</div>}
          {body && <div className="itip-text">{body}</div>}
          {wikiId && wikiOpener && (
            <button type="button" className="itip-wiki" onClick={() => { const fn = wikiOpener; close(); fn?.(wikiId); }}>
              Mehr im Wiki
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

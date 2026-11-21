// =============================================================================
// Gekürzte Texte zeigen beim Zeigen den vollen Text (test:audit, Prüfliste 2:
// „Abgeschnittener Text (Ellipse)“). Ein globaler Hörer prüft beim Überfahren, ob das
// Element (oder ein Vorfahr bis drei Stufen) per `text-overflow: ellipsis` gekürzt ist,
// und setzt dann einmalig `title` auf den vollen Text – nur wenn noch keiner da ist.
// So braucht nicht jede Liste ihr eigenes title-Attribut.
// =============================================================================

function truncated(el: HTMLElement): boolean {
  if (el.scrollWidth <= el.clientWidth + 1) return false;
  const cs = getComputedStyle(el);
  return cs.textOverflow === 'ellipsis' && (cs.overflowX === 'hidden' || cs.overflowX === 'clip');
}

function onOver(e: Event): void {
  let el = e.target instanceof HTMLElement ? e.target : null;
  for (let i = 0; el && i < 4; el = el.parentElement, i++) {
    if (el.title || el.closest('[title]')) return;
    if (truncated(el)) {
      const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) el.title = t;
      return;
    }
  }
}

let installed = false;
/** Einmal beim Start (App.tsx). */
export function installEllipsisTitles(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('mouseover', onOver, { passive: true });
  document.documentElement.dataset.ellipsisTitles = '1';
}

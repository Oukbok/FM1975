// =============================================================================
// Mehrfachauswahl in Spielertabellen (Wunsch Pascal: Transfermarkt, Spielerpool)
// -----------------------------------------------------------------------------
// Strg/Cmd-Klick nimmt eine Zeile dazu oder heraus, Umschalt-Klick wählt alle
// Zeilen zwischen dem letzten Klick und dieser (in der angezeigten Reihenfolge).
// Ein einfacher Klick wählt nur diese Zeile (und tut, was die Zeile sonst tut).
// Die Tabelle trägt `data-pidsel="id1,id2,…"` (ab zwei Spielern); der Rechtsklick
// auf eine ausgewählte Zeile öffnet dann im PlayerContextMenu das Gruppenmenü.
// Das Menü leert die Auswahl über das Ereignis PIDSEL_CLEAR.
// =============================================================================
import { useEffect, useRef, useState, type MouseEvent } from 'react';

export const PIDSEL_CLEAR = 'fm-pidsel-clear';

export function useMultiSelect(order: string[]) {
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const anchor = useRef<string | null>(null);

  useEffect(() => {
    const clear = () => setSel(new Set());
    window.addEventListener(PIDSEL_CLEAR, clear);
    return () => window.removeEventListener(PIDSEL_CLEAR, clear);
  }, []);

  /** Klick auf eine Zeile; true = Mehrfachauswahl (die Zeile soll sonst nichts tun). */
  const click = (e: MouseEvent, id: string): boolean => {
    if (e.shiftKey) {
      const a = anchor.current && order.includes(anchor.current) ? anchor.current : id;
      const i = order.indexOf(a), j = order.indexOf(id);
      const [lo, hi] = i <= j ? [i, j] : [j, i];
      const next = new Set(e.ctrlKey || e.metaKey ? sel : []);
      for (const x of order.slice(lo, hi + 1)) next.add(x);
      setSel(next);
      if (!anchor.current) anchor.current = id;
      window.getSelection()?.removeAllRanges();
      return true;
    }
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(sel);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSel(next);
      anchor.current = id;
      return true;
    }
    setSel(new Set([id]));
    anchor.current = id;
    return false;
  };

  const multi = sel.size > 1;
  return {
    sel,
    multi,
    click,
    /** Zeile in der Mehrfachauswahl (nur bei ≥ 2 Spielern, sonst gilt die normale Auswahl). */
    has: (id: string) => multi && sel.has(id),
    clear: () => setSel(new Set()),
    /** Attribute für die Tabelle. */
    attr: multi ? { 'data-pidsel': [...sel].join(',') } : {},
    /** Umschalt-Klick soll keinen Text markieren. */
    onMouseDown: (e: MouseEvent) => { if (e.shiftKey) e.preventDefault(); },
  };
}

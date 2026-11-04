// =============================================================================
// Alte Spielstände: echt klingende Firmen-/Hallennamen durch die erfundenen ersetzen
// (Zuordnung data/sponsorRenames.ts). Betroffen: Sponsorverträge/-angebote/Pflichtreisen/
// Chronik, alte Trikot-/Bandenspiegel, Namensrechte + Stadionname, Investor, Buchungstexte,
// Nachrichten und Hallenturniere. Idempotent: kein neuer Name enthält einen alten.
// Aufruf beim Laden in App.tsx (vor migrateSponsorship).
// =============================================================================
import type { Game } from './state';
import { renameSponsorText } from '../data/sponsorRenames';

/** Ersetzt alle Zeichenketten in einem Objektbaum (nur eigene, einfache Daten). */
function walk(o: unknown, depth = 0): void {
  if (!o || typeof o !== 'object' || depth > 8) return;
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i++) {
      const v = o[i];
      if (typeof v === 'string') { const n = renameSponsorText(v); if (n !== v) o[i] = n; }
      else walk(v, depth + 1);
    }
    return;
  }
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const v = rec[k];
    if (typeof v === 'string') { const n = renameSponsorText(v); if (n !== v) rec[k] = n; }
    else walk(v, depth + 1);
  }
}

export function migrateSponsorNames(g: Game): void {
  for (const c of Object.values(g.clubs ?? {})) {
    walk(c.commerce);
    walk(c.namingRights);
    walk(c.corporate);
    if (c.stadium?.name) c.stadium.name = renameSponsorText(c.stadium.name);
    walk(c.finances?.transactions);
  }
  walk(g.messages);
  walk((g as { indoor?: unknown }).indoor);
}

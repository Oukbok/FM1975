// =============================================================================
// Kit-Helfer — leitet Heim-/Auswärtstrikot eines Vereins ab
// =============================================================================
// Rein kosmetisch: Verwendet die benutzerdefinierten Trikots (club.kits), falls
// vorhanden, sonst wird ein plausibles Design aus den Vereinsfarben abgeleitet.
// Das Auswärtstrikot ist bewusst kontrastierend (Farben getauscht), damit sich
// beide Trikots optisch unterscheiden — ohne Einfluss auf die Match-Simulation.
// =============================================================================
import { Club, Kit, KitPattern } from '../types';
import { getClubOverrideForClub } from './clubOverrides';

const FALLBACK_SECONDARY = '#e8edf4';

/** Ob sich zwei Farben (case-insensitiv) sichtbar unterscheiden. */
function differ(a: string, b: string): boolean {
  return (a || '').trim().toLowerCase() !== (b || '').trim().toLowerCase();
}

/** Standard-Heimtrikot aus den Vereinsfarben. */
export function defaultHomeKit(club: Club): Kit {
  const primary = club.colors.primary;
  const secondary = club.colors.secondary || FALLBACK_SECONDARY;
  return {
    primary,
    secondary,
    pattern: differ(primary, secondary) ? 'stripes' : 'solid',
  };
}

/** Standard-Auswärtstrikot: kontrastierend zum Heimtrikot (Farben getauscht). */
export function defaultAwayKit(club: Club): Kit {
  const primary = club.colors.secondary || FALLBACK_SECONDARY;
  const secondary = club.colors.primary;
  return {
    primary: differ(primary, secondary) ? primary : FALLBACK_SECONDARY,
    secondary,
    pattern: 'solid',
  };
}

/** Liefert Heim- und Auswärtstrikot eines Vereins (custom oder abgeleitet). */
export function getClubKits(club: Club): { home: Kit; away: Kit } {
  return {
    home: club.kits?.home ?? defaultHomeKit(club),
    away: club.kits?.away ?? defaultAwayKit(club),
  };
}

/** Standard-Design eines Trikots (Heim/Auswärts) aus den Vereinsfarben. */
export function defaultKit(club: Club, which: 'home' | 'away'): Kit {
  return which === 'home' ? defaultHomeKit(club) : defaultAwayKit(club);
}

/**
 * Wie ein Trikot tatsächlich gerendert werden soll. Entweder ein hochgeladenes
 * Bild (`image` gesetzt) — dann wird es überall bevorzugt angezeigt — oder ein
 * Design (Grundfarbe + Zweitfarbe + Muster) für <JerseySVG>.
 */
export interface KitDisplay {
  image?: string;
  primary: string;
  secondary: string;
  pattern: KitPattern;
}

/**
 * Effektive Trikot-Darstellung eines Vereins für ein Trikot (Heim/Auswärts).
 * Auflösungsreihenfolge (SPIELWEIT zuerst):
 *   1) spielweiter Override-Bild  → { image }
 *   2) spielweiter Override-Design
 *   3) save-gebundenes Club.kits
 *   4) aus Vereinsfarben abgeleiteter Standard
 */
export function getClubKitDisplay(club: Club, which: 'home' | 'away'): KitDisplay {
  const ov = getClubOverrideForClub(club)?.[which];
  if (ov?.image) {
    return { image: ov.image, primary: '#000000', secondary: '#000000', pattern: 'solid' };
  }
  const design: Kit = ov?.design ?? club.kits?.[which] ?? defaultKit(club, which);
  return { primary: design.primary, secondary: design.secondary, pattern: design.pattern };
}

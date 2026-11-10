// =============================================================================
// SPIELBERECHTIGUNG IN DER MATCH-ENGINE (Wunsch Pascal, #35)
// -----------------------------------------------------------------------------
// Reine Rechnung ohne Spielstand: Wer zählt in welcher Saison als Ausländer, wie
// viele dürfen im Spielberichtsbogen stehen, wer ist „Fußball-Deutscher“ bzw. lokal
// ausgebildet. Der Spielablauf setzt Heimat-Nationalität und Europapokal-Meldelisten
// (game/registrationGame.ts `bindRegistration`); `resolveLineup` (match/team.ts)
// fragt hier nach. Regeln mit Quellen: data/registrationRules.ts.
// =============================================================================
import { EUROPE_NATS, domesticRulesFor, euroRulesFor } from '../data/registrationRules';
import type { Player } from '../types';
import { isForeignId } from './world';

let homeNat = 'GER';
let euroLists: Record<string, Set<string>> = {};
/** Heimat-Nationalität (Deutschland: GER; DDR-Spieler zählen nach 1990 als Deutsche). */
export function setRegHome(nat: string): void { homeNat = nat || 'GER'; }
export function regHome(): string { return homeNat; }
/** Europapokal-Meldelisten je Verein (nur Vereine mit Liste werden gefiltert). */
export function setEuroLists(lists: Record<string, string[]>): void {
  euroLists = Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, new Set(v)]));
}
export function euroListOf(clubId: string): Set<string> | null { return euroLists[clubId] ?? null; }

const isNative = (nat: string | undefined, year: number) => !!nat && (nat === homeNat || (homeNat === 'GER' && nat === 'GDR' && year >= 1990));

/** Ist der Spieler Einheimischer (auch mit zweiter Staatsangehörigkeit)? */
export function isNational(p: Player, year: number): boolean {
  return isNative(p.nationality, year) || isNative((p as Player & { nationality2?: string }).nationality2, year);
}

/** Saisons bei Vereinen des Heimatlandes (Stationen) bzw. Jugend im Land. */
export function domesticSeasons(p: Player): number {
  const seasons = new Set((p.history?.stations ?? []).filter((s) => !isForeignId(s.clubId) && !s.clubId.startsWith('x-')).map((s) => s.season));
  return seasons.size;
}
/** Im Heimatland in der Jugend ausgebildet (Nachwuchs eines Vereins des Landes). */
export function trainedInCountry(p: Player): boolean {
  return p.id.includes('_y_') || !!p.youthJoined;
}

/** „Fußball-Deutscher“ (1992–1996): fünf Saisons im Land, davon drei in der Jugend – vereinfacht. */
export function isAssimilated(p: Player): boolean {
  return (trainedInCountry(p) && domesticSeasons(p) >= 2) || domesticSeasons(p) >= 5;
}

/** Zählt der Spieler in dieser Saison gegen die Ausländergrenze? */
export function countsAsForeign(p: Player, year: number, euro = false): boolean {
  if (isNational(p, year)) return false;
  const d = domesticRulesFor(year);
  if (euro) {
    const e = euroRulesFor(year);
    if (e.matchForeign == null) return false;
    if (year >= 1991 && year < 1996) return !isAssimilated(p); // 3+2: zwei Assimilierte zusätzlich – vereinfacht frei
    return true;
  }
  if (d.scope === 'nonEurope' && EUROPE_NATS.has(p.nationality)) return false;
  if (d.assimilated && isAssimilated(p)) return false;
  return true;
}

/** Grenze für den Spielberichtsbogen (Startelf + Bank); null = unbegrenzt. */
export function matchForeignCap(year: number, euro = false): number | null {
  return euro ? euroRulesFor(year).matchForeign : domesticRulesFor(year).matchForeign;
}

/** Nicht-Europäer (für Vertragsgrenzen 2004–2006). */
export const isNonEuropean = (p: Player, year: number) => !isNational(p, year) && !EUROPE_NATS.has(p.nationality);

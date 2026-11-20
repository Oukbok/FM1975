// =============================================================================
// UMBENANNTE ORTE (Wunsch Pascal: kein Vereinsname zu nah an einem echten Verein)
// -----------------------------------------------------------------------------
// Städte aus data/world/deepTowns.ts, die nachträglich ersetzt wurden. Alte Spielstände
// tragen den alten Namen an erfundenen Vereinen (Hintergrund-Welt `euroClubs`, Vereine des
// Heimatlandes `clubs`) und in den freien Städten der Länder. IDs bleiben, idempotent.
// =============================================================================
import type { Game } from './state';

/** Alt → neu. */
export const TOWN_RENAMES: Record<string, { name: string; short: string }> = {
  'Juve Stabia': { name: 'Torre del Greco', short: 'TDG' },
};

function swap(s: string, from: string, to: string): string {
  return s.includes(from) ? s.split(from).join(to) : s;
}

export function migrateTownRenames(g: Game): void {
  for (const [from, to] of Object.entries(TOWN_RENAMES)) {
    const fix = (c: { name: string; shortName?: string; city?: string }) => {
      if (!c.name.includes(from) && c.city !== from) return;
      c.name = swap(c.name, from, to.name);
      if (c.city) c.city = swap(c.city, from, to.name);
      if (c.shortName) c.shortName = to.short;
    };
    for (const c of Object.values(g.euroClubs ?? {})) fix(c);
    for (const c of Object.values(g.clubs)) fix(c);
    for (const country of Object.values(g.world?.countries ?? {})) {
      country.spareCities = country.spareCities.map((s) => (s === from ? to.name : s));
    }
  }
}

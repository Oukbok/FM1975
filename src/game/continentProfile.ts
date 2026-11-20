// =============================================================================
// Länderprofil für Länder der Hintergrund-Kontinente (components/country/ContinentBoxes.tsx):
// Meister je Jahr (Platzierung der Saison), Vereine mit Stärke und Titeln,
// Kontinentalpokal. Nur gelesen – Daten aus game/continents.ts.
// =============================================================================
import type { Game } from './state';
import { seasonStartYear } from '../data/timeline';
import { CONTINENTS, CT_BY_KEY, ctClubActive, ctConfOf, cupEraOf, type ContinentKey } from '../data/world/continents';
import { continentalWinners, ctStrengthAt, nationalRanking, nationalYears } from './continents';
import { icStateOf } from './intercontinental';

export interface CtProfileClub { id: string; strength: number; titles: number; cups: number; world: number }
export interface CtProfile {
  conf: ContinentKey; confName: string; cupName: string | null;
  /** Jahr → Platzierung (bis zu vier IDs), neueste zuerst. */
  seasons: { year: number; ids: string[] }[];
  clubs: CtProfileClub[];
  /** Kontinentalpokal-Sieger aus diesem Land (gespielt + vor dem Start). */
  cupWins: { year: number; id: string; pre?: boolean }[];
}

export function continentProfile(g: Game, key: string): CtProfile | null {
  const c = CT_BY_KEY[key];
  if (!c) return null;
  const y = seasonStartYear(g.season);
  const conf = ctConfOf(c, y);
  const seasons = nationalYears(g).map((yr) => ({ year: yr, ids: nationalRanking(g, c.cc, yr) })).filter((s) => s.ids.length);
  const cupWins: CtProfile['cupWins'] = [];
  for (const k of Object.keys(CONTINENTS) as ContinentKey[]) {
    for (const w of continentalWinners(g, k)) if (w.w.startsWith(`w_ct_${c.cc}_`)) cupWins.push({ year: w.year, id: w.w, pre: w.pre });
  }
  cupWins.sort((a, b) => b.year - a.year);
  const worldTitles = new Map<string, number>();
  for (const a of icStateOf(g)?.archive ?? []) if (a.winner) worldTitles.set(a.winner, (worldTitles.get(a.winner) ?? 0) + 1);
  const clubs = c.clubs.map((cl) => `w_ct_${c.cc}_${cl.key}`)
    .filter((id, i) => ctClubActive(c.clubs[i], y))
    .map((id) => ({
      id, strength: ctStrengthAt(id, y),
      titles: seasons.filter((s) => s.ids[0] === id).length,
      cups: cupWins.filter((w) => w.id === id).length,
      world: worldTitles.get(id) ?? 0,
    }))
    .sort((a, b) => b.strength - a.strength);
  return { conf, confName: CONTINENTS[conf].name, cupName: cupEraOf(conf, y)?.name ?? null, seasons, clubs, cupWins };
}

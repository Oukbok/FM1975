// =============================================================================
// Anzeige der tieferen Auslandsligen (Ebene 3/4, engine/worldDeep.ts) für Statistiken › Liga
// (game/competitionCountry.ts): Wettbewerbswahl je Staffel, Ligen der Welt-Historie, Tabellenzonen.
// Nur gelesen, nichts gespeichert.
// =============================================================================
import { historicTiers } from '../data/leagueTiers';
import { deepLabel } from '../data/world/deepStructure';
import { seasonStartYear } from '../data/timeline';
import { worldStructureOfKey } from '../data/world/structure';
import type { LeanDiv, WorldSeasonRecord } from '../engine/world';
import { deepGroupsOf } from '../engine/worldDeep';
import { secondGroups } from '../engine/worldSecond';
import type { CompOption } from './competitionView';
import type { Game } from './state';
import { leanTierOf } from './worldLeagues';

/** Name der Ebene (3/4) eines Landes in der Saison (data/leagueTiers.ts), sonst „3. Liga“. */
export function deepLevelName(cc: string | undefined, year: number, tier: number): string {
  return (cc ? historicTiers(cc, year)?.[tier - 1]?.name : undefined) ?? `${tier}. Liga`;
}

/** Wettbewerbe der tieferen Ebenen: `counts[k]` = Staffeln der Ebene 3+k; `p` = 'r' (laufend) bzw. 'w' (abgeschlossen). */
export function deepOptions(cc: string, year: number, counts: number[], p: 'r' | 'w', section: (tier: number) => string): CompOption[] {
  const out: CompOption[] = [];
  counts.forEach((n, k) => {
    const tier = k + 3, name = deepLevelName(cc, year, tier);
    for (let i = 0; i < n; i++) out.push({ key: i === 0 ? `${p}${tier}` : `${p}${tier}:${i + 1}`, label: deepLabel(name, n, i), kind: 'league', section: section(tier), tier });
  });
  return out;
}

/** Liga einer tieferen Ebene aus der Welt-Historie (Index wie game/worldLeagues.ts `deepIdx`). */
export function deepHistDiv(rec: WorldSeasonRecord | undefined, wk: string, idx: number): LeanDiv | null {
  const { tier, group } = leanTierOf(idx);
  return rec?.deep?.[wk]?.[tier - 3]?.[group] ?? null;
}

/**
 * Tabellenzonen einer Staffel der Ebene `tier` – dieselben Zahlen wie der Saisonwechsel (engine/worldDeep.ts):
 * Aufstieg in die 2. Ebene laut historischer Struktur bzw. ⌊Größe oben / 6⌉, Abstieg ⌊Größe / 6⌉ bzw. 2 je Staffel
 * in den Unterbau; mehrere Staffeln: sicher je Staffel ⌊Plätze / Staffeln⌋, ein weiterer Platz = Chance.
 */
export function deepZones(g: Game, wk: string, season: string, tier: number, n: number, groups: number): string[] {
  const zones = new Array<string>(n).fill('');
  const c = g.world?.countries[wk];
  if (!c) return zones;
  const k = tier - 3, y = seasonStartYear(season) + 1;
  const sizeOf = (kk: number) => deepGroupsOf(c, kk).reduce((a, x) => a + x.length, 0);
  const groupsBelow = deepGroupsOf(c, k + 1).length;
  const last = k + 1 >= (c.deep?.length ?? 0);
  const st = worldStructureOfKey(wk, y);
  const above = k === 0 ? secondGroups(c).reduce((a, x) => a + x.length, 0) : sizeOf(k - 1);
  const up = k === 0 ? Math.max(groups, st?.down2 ?? 2 * secondGroups(c).length) : Math.max(groups, Math.round(above / 6));
  const sure = Math.floor(up / groups), chance = up % groups ? 1 : 0;
  for (let i = 0; i < sure && i < n; i++) zones[i] = 'zone-cl';
  if (chance && sure < n) zones[sure] = 'zone-po';
  const downAll = last ? 2 * groups : Math.max(groupsBelow, Math.round(sizeOf(k) / 6));
  const down = Math.max(1, Math.round(downAll / groups));
  if (n >= 8) for (let i = Math.max(sure + chance, n - down); i < n; i++) zones[i] = 'zone-rel';
  return zones;
}

export const DEEP_NOTE = (country: string) =>
  `Die 3./4. Ebene von ${country} wird Spieltag für Spieltag simuliert: Ergebnis aus Vereinsstärke und Heimvorteil. Diese Vereine haben im Spiel keine Kader – deshalb gibt es hier keine Torschützen und Karten.`;

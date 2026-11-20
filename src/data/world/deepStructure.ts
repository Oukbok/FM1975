// =============================================================================
// TIEFERE LIGEN JE LAND (Wunsch Pascal: Auslandsligen bis zur 3./4. Ebene simulieren und spielbar)
// -----------------------------------------------------------------------------
// Tiefe nach dem Rang des Landes in der Länderwertung (Ligaruf, data/leagueReputation.ts bzw.
// `WorldCountry.rep` mit der Option „Entwicklung der Ligen“; Deutschland zählt mit):
//   Rang 1–5 → bis zur 4. Ebene, Rang 6–7 → bis zur 3. Ebene, übrige → 1./2. Ebene wie bisher.
// Festgelegt beim Spielstart, danach alle fünf Jahre (Saisons 1980/81, 1985/86 …) neu geprüft: eine
// Ebene kommt dazu, sobald der Rang reicht, und fällt NIE wieder weg (Wunsch Pascal: keine Liga darf
// während eines Spiels verschwinden). Beim Heimatland gilt die Tiefe des Spielstarts.
// Struktur (Name, Staffeln, Mannschaften) je Saison aus data/leagueTiers.ts. Vereinfachung für
// Rechenzeit und Spielstand: höchstens DEEP_MAX_GROUPS Staffeln je Ebene (Spanien hat z. B. 18
// Tercera-Staffeln – im Spiel 4), regional verschiedene Größen = DEEP_DEFAULT_TEAMS, ungerade Zahl
// wird gerade abgerundet. Länder ohne Strukturdaten bleiben bei zwei Ebenen.
// =============================================================================
import { historicTiers, type TierRow } from '../leagueTiers';
import { LEAGUE_REP_CURVES, repTargetAt } from '../leagueReputation';
import { COUNTRY_BY_KEY, countryExists } from './countries';
import { groupNames } from './secondGroups';

export const DEEP_MAX_GROUPS = 4;
export const DEEP_DEFAULT_TEAMS = 16;

export interface DeepLevel {
  /** Ebene 3 oder 4. */
  tier: number;
  /** Historischer Name der Ebene (data/leagueTiers.ts). */
  name: string;
  /** Staffelgrößen im Spiel (gerade, höchstens DEEP_MAX_GROUPS Staffeln). */
  groups: number[];
  /** Historische Zahl der Staffeln bzw. Mannschaften (null = regional verschieden). */
  realGroups: number;
  realTeams: number | null;
}

const even = (n: number) => Math.max(8, n - (n % 2));

function levelOf(r: TierRow, tier: number): DeepLevel {
  const regional = r.teams == null;
  const n = Math.min(DEEP_MAX_GROUPS, regional && r.groups <= 1 ? DEEP_MAX_GROUPS : Math.max(1, r.groups));
  const size = even(r.teams ?? DEEP_DEFAULT_TEAMS);
  return { tier, name: r.name, groups: Array.from({ length: n }, () => size), realGroups: r.groups, realTeams: r.teams };
}

/** Ebenen 3 … `depth` eines Landes (Code) in der Saison `year` (Startjahr); leer = keine Strukturdaten. */
export function deepLevelsFor(cc: string | undefined, year: number, depth: number): DeepLevel[] {
  const rows = cc ? historicTiers(cc, year) : null;
  if (!rows || depth < 3) return [];
  const out: DeepLevel[] = [];
  for (let t = 3; t <= Math.min(4, depth); t++) if (rows[t - 1]) out.push(levelOf(rows[t - 1], t));
  return out;
}

/** Hat das Land Strukturdaten für die tieferen Ebenen? */
export const hasDeepData = (cc: string | undefined) => !!cc && !!historicTiers(cc, 2000);

/** Name einer Staffel der tieferen Ebene: „League One“ bzw. „Segunda División B Staffel 2“. */
export function deepLabel(name: string, n: number, i: number): string {
  return n > 1 ? `${name} ${groupNames(n)[i] ?? `Staffel ${i + 1}`}` : name;
}

/** Tiefe nach Rang (1 = bestes Land), ohne Puffer. */
export const depthForRank = (rank: number) => (rank <= 5 ? 4 : rank <= 7 ? 3 : 2);

/** Neue Tiefe nach Rang: wächst nur, schrumpft nie (Wunsch Pascal: eine Liga darf während eines Spiels
 *  nicht verschwinden – sonst ginge z. B. ein Verein in der 4. Ebene mit seiner Liga verloren). Fällt ein Land
 *  in der Wertung zurück, bleiben seine 3./4. Ebene bestehen. `rank` bleibt für spätere Regeln erhalten. */
export function nextDepth(prev: number, rank: number): number {
  return Math.max(prev, depthForRank(rank));
}

const GONE = new Set(['Sowjetunion', 'Jugoslawien', 'Tschechoslowakei', 'DDR']);

/**
 * Rangliste der Länder (Hintergrund-Schlüssel) im Jahr nach Ligaruf: `repOf` liefert den Ruf im
 * Spiel (Option „Entwicklung der Ligen“), sonst gilt die historische Kurve.
 */
export function leagueRanking(year: number, repOf?: (key: string) => number | undefined): string[] {
  return Object.keys(LEAGUE_REP_CURVES)
    .filter((k) => {
      const def = COUNTRY_BY_KEY[k];
      if (def) return countryExists(def, year);
      return !(GONE.has(k) && year > 1991);
    })
    .map((k) => ({ k, v: repOf?.(k) ?? repTargetAt(k, year) }))
    .sort((a, b) => b.v - a.v || a.k.localeCompare(b.k))
    .map((x) => x.k);
}

/**
 * Tiefe eines Landes beim Spielstart: so, wie sie ein 1975 begonnenes Spiel bis zum Startjahr hätte
 * (historische Kurve, Prüfung alle fünf Jahre mit Puffer) – England 1995 (Rang 6 nach dem Ausschluss
 * 1985–90) behält so seine 4. Ebene. Länder ohne Strukturdaten = 2.
 */
export function startDepthOf(key: string, year: number): number {
  const cc = COUNTRY_BY_KEY[key]?.cc;
  if (!hasDeepData(cc)) return 2;
  const rankAt = (y: number) => leagueRanking(y).indexOf(key) + 1 || 99;
  const from = Math.max(1975, COUNTRY_BY_KEY[key]?.from ?? 1975);
  let depth = depthForRank(rankAt(from));
  for (let y = from - (from % 5) + 5; y <= year; y += 5) depth = nextDepth(depth, rankAt(y));
  return depth;
}

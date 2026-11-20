// =============================================================================
// HEIMATLAND ≠ DEUTSCHLAND: 3./4. Ebene als echte Ligen (Wunsch Pascal: im Ausland eine Liga der
// 3./4. Ebene wählen und spielen)
// -----------------------------------------------------------------------------
// Tiefe beim Spielstart nach dem Rang des Landes (data/world/deepStructure.ts `startDepthOf`:
// Rang 1–5 bis zur 4. Ebene, 6–7 bis zur 3. Ebene); sie bleibt im Heimatland fest.
// Besetzung `homeDeepPlan` – vorab berechenbar (Assistent, game/lowerTierStart.ts) und beim Start
// identisch: zuerst die übrigen Vereine des Landes aus den Weltdaten (Unterbau, stärkste zuerst –
// echte Daten gibt es nur für die 1./2. Ebene, diese Vereine spielten dort irgendwann), dann
// erfundene Vereine aus Städten des Landes (data/world/deepTowns.ts, Name = Stadt wie die
// Pool-Vereine). Zusätzliche Städtevereine füllen den Unterbau auf, damit der Tausch der untersten
// Ebene mit dem Unterbau echte Vereine findet.
// Liegt der gewählte Verein dort, wird die Liga in newGame.ts zur Spielerliga (`materializeLowerStart`,
// volle Kader, Niveau data/lowerTiers.ts); die übrigen Ligen der Ebenen laufen simuliert (`fillHomeDeep`).
// Saisonwechsel: game/homeStructure.ts hält Staffelzahl und Größen der Ebenen 3/4 aus dem Startjahr
// (Vereinfachung), Name je Saison aus data/leagueTiers.ts.
// =============================================================================
import { POOL_TIER } from '../data/history/historicClubs';
import { COUNTRY_BY_CC, seasonLabelOf } from '../data/world/countries';
import { worldDataVersion } from '../data/world/index';
import { deepLevelsFor, startDepthOf } from '../data/world/deepStructure';
import { leagueLabel } from '../data/leagueNames';
import { DEEP_TOWNS } from '../data/world/deepTowns';
import { assignToGroups, dataZoneOf, homeGroupKeys } from '../data/world/secondGroups';
import { buildDivision, hashStr, mulberry32, type DivisionMeta, type LeagueGroup, type SimClub } from '../engine/leagues';
import { POOL_COLORS } from './clubPool';
import type { Game } from './state';
import { composeHome, countryLevelOf, poolClubsOf } from './worldCompose';

export interface HomeDeepDiv { meta: DivisionMeta; size: number; clubs: SimClub[] }

/** Tiefe des Heimatlandes beim Start (2 = keine tieferen Ligen). */
export function homeDepthOf(cc: string, year: number): number {
  const key = COUNTRY_BY_CC[cc]?.key;
  return cc === 'ger' || !key ? 2 : startDepthOf(key, year);
}

/** ID eines erfundenen Vereins der tieferen Ebenen bzw. des Unterbaus. */
const townId = (cc: string, town: string) => `dp-${cc}-${town.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}`;

/** Farbe für einen zweiten Verein derselben Stadt (wie engine/worldCountries.ts). */
const COLOR_WORDS = ['Rot', 'Blau', 'Grün', 'Gelb', 'Schwarz', 'Weiß'];
const COLOR_PAIRS: [string, string][] = [['#C8102E', '#FFFFFF'], ['#1B458F', '#FFFFFF'], ['#00843D', '#FFFFFF'], ['#FFD100', '#000000'], ['#111111', '#FFFFFF'], ['#FFFFFF', '#1B458F']];

const cache = new Map<string, { divs: HomeDeepDiv[]; extraPool: SimClub[] }>();

/** Ligen der Ebenen 3/4 und zusätzliche Unterbau-Vereine des Heimatlandes beim Start (deterministisch). */
export function homeDeepPlan(cc: string, year: number): { divs: HomeDeepDiv[]; extraPool: SimClub[] } {
  const ck = `${worldDataVersion()}|${cc}|${year}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const out = build(cc, year);
  if (cache.size > 20) cache.clear();
  cache.set(ck, out);
  return out;
}
/** Zwischenspeicher leeren (Datensatz-Wechsel, game/resetModuleState.ts). */
export const clearHomeDeepCache = () => cache.clear();

function build(cc: string, year: number): { divs: HomeDeepDiv[]; extraPool: SimClub[] } {
  const levels = deepLevelsFor(cc, year, homeDepthOf(cc, year));
  const comp = levels.length ? composeHome(cc, year) : null;
  if (!comp) return { divs: [], extraPool: [] };
  const taken = new Set<string>([...comp.tier1.map((s) => s.id), ...comp.second.flatMap((s) => s.clubs.map((c) => c.id))]);
  const cities = new Set<string>([...comp.tier1.map((s) => s.city), ...comp.second.flatMap((s) => s.clubs.map((c) => c.city))]);
  const pool = poolClubsOf(cc, year, taken, POOL_TIER).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
  for (const s of pool) cities.add(s.city);
  const lvl = countryLevelOf(cc, year) - 68;
  const rnd = mulberry32(hashStr(`home-deep:${cc}:${year}`));
  const towns = (DEEP_TOWNS[cc] ?? []).filter((t) => !cities.has(t));
  // Reichen die Städte nicht (Spanien: 160 Vereine in Ebene 3/4), zweiter Verein einer Stadt mit Farbe („Cáceres Blau“).
  const usedNames = new Set<string>([...comp.tier1.map((s) => s.name), ...comp.second.flatMap((s) => s.clubs.map((c) => c.name)), ...pool.map((s) => s.name)]);
  const second = [...(DEEP_TOWNS[cc] ?? []), ...cities].flatMap((city) => COLOR_WORDS.map((cw, i) => ({ city, cw, i }))).sort((a, b) => a.i - b.i);
  const makeTown = (tier: number): SimClub | null => {
    let town = towns.shift(), name = town, ci = -1;
    while (!town && second.length) {
      const x = second.shift()!;
      if (usedNames.has(`${x.city} ${x.cw}`)) continue;
      town = x.city; name = `${x.city} ${x.cw}`; ci = x.i;
    }
    if (!town || !name) return null;
    usedNames.add(name);
    const [primary, secondary] = ci >= 0 ? COLOR_PAIRS[ci] : POOL_COLORS[Math.floor(rnd() * POOL_COLORS.length)];
    const base = (tier === 3 ? 50 : tier === 4 ? 47 : 45) + lvl;
    return { id: townId(cc, name), name, shortName: town.slice(0, 3).toUpperCase(), city: town, strength: Math.round(Math.max(36, Math.min(64, base + (rnd() - 0.5) * 6))), colors: { primary, secondary }, tier: POOL_TIER, group: null };
  };
  let rest = [...pool];
  const divs: HomeDeepDiv[] = [];
  for (const lv of levels) {
    const need = lv.groups.reduce((a, b) => a + b, 0);
    // Unterbau nicht leer räumen: mindestens acht echte Vereine bleiben unten.
    const real = rest.slice(0, Math.max(0, Math.min(need, rest.length - 8)));
    rest = rest.slice(real.length);
    const list: SimClub[] = [...real];
    while (list.length < need) { const t = makeTown(lv.tier); if (!t) break; list.push(t); }
    const n = lv.groups.length, keys = homeGroupKeys(n);
    const pref = (id: string) => {
      if (n < 2) return 0;
      const s = list.find((x) => x.id === id);
      return s && !id.startsWith('dp-') ? dataZoneOf(cc, id, s.city, n, year) : null;
    };
    const { buckets } = assignToGroups(list.map((s) => s.id), lv.groups, pref);
    buckets.forEach((ids, i) => {
      const group = (n > 1 ? keys[i] ?? null : null) as LeagueGroup;
      const meta: DivisionMeta = { id: n > 1 ? `tier${lv.tier}-${keys[i] ?? i + 1}` : `tier${lv.tier}`, name: leagueLabel(cc, lv.tier, { n, i, year }), tier: lv.tier, group };
      divs.push({ meta, size: lv.groups[i], clubs: ids.map((id) => ({ ...list.find((x) => x.id === id)!, tier: lv.tier, group })) });
    });
  }
  const extraPool: SimClub[] = [];
  while (rest.length + extraPool.length < 16) { const t = makeTown(9); if (!t) break; extraPool.push(t); }
  return { divs, extraPool };
}

/**
 * Spielstart (anderes Heimatland): Ligen der Ebenen 3/4 anlegen – außer der Spielerliga, die
 * materializeLowerStart schon voll besetzt hat. Erwartet den Unterbau aus seedStartPool.
 */
export function fillHomeDeep(g: Game, cc: string, year: number, ligaStart: string): void {
  const { divs, extraPool } = homeDeepPlan(cc, year);
  if (!divs.length) return;
  const season = seasonLabelOf(year);
  const own = g.leagues.playerDivision.id;
  for (const s of extraPool) if (!g.simClubs[s.id] && !g.clubs[s.id]) g.simClubs[s.id] = { ...s };
  for (const d of divs) {
    if (d.meta.id === own) continue;
    const ids: string[] = [];
    for (const c of d.clubs) {
      if (g.clubs[c.id]) continue;
      const s = g.simClubs[c.id];
      if (s) { s.tier = d.meta.tier; s.group = d.meta.group; } else g.simClubs[c.id] = { ...c };
      ids.push(c.id);
    }
    g.leagues.otherDivisions.push(buildDivision(d.meta, ids, g.pointSystem, season, ligaStart));
  }
}

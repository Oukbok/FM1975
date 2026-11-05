// =============================================================================
// Weltdaten-Register: echte (verfremdete) Vereine + Ligazusammensetzung je Land/Saison
// -----------------------------------------------------------------------------
// NEUES LAND EINBINDEN = EINE ZEILE unten im Block „Länder“:
//   import * as eng1 from './clubs/eng'; import * as eng2 from './seasons/eng'; add('eng', eng1, eng2);
// (`add` sucht die Exporte CLUBS_<CC>/SEASONS_<CC> selbst.) Fehlt ein Land, läuft es wie
// bisher mit erfundenen Städtevereinen (data/worldSeed.ts) bzw. Deutschland mit den
// Vereinen von 1975 (data/generate.ts). Format: docs/specs/WELTDATEN_SPEC.md.
// Ein Datensatz (Editor) kann je Land Vereine/Saisons überschreiben (`setWorldOverride`).
// =============================================================================
import type { RealClub, SeasonRow } from './types';

export interface CountryWorld {
  clubs: RealClub[];
  /** Schlüssel = Saison-Startjahr (1975 = 1975/76). */
  seasons: Record<number, SeasonRow>;
}

/** Eingebaute Daten aus den Länderdateien. */
const BUILTIN: Record<string, CountryWorld> = {};
/** Überschreibungen aus dem aktiven Datensatz (Editor). */
let OVERRIDE: Record<string, CountryWorld> = {};

const cache = new Map<string, Map<string, RealClub>>();

type Mod = Record<string, unknown>;
function add(cc: string, ...mods: Mod[]): void {
  const up = cc.toUpperCase();
  const clubs = mods.map((m) => m[`CLUBS_${up}`]).find(Array.isArray) as RealClub[] | undefined;
  const seasons = mods.map((m) => m[`SEASONS_${up}`]).find((x) => x && typeof x === 'object' && !Array.isArray(x)) as Record<number, SeasonRow> | undefined;
  registerCountryData(cc, clubs ?? [], seasons ?? {});
}

// --- Länder (eine Zeile je Land) ---------------------------------------------
import * as ger1 from './clubs/ger'; import * as ger2 from './seasons/ger'; add('ger', ger1, ger2);
import * as gdr1 from './clubs/gdr'; import * as gdr2 from './seasons/gdr'; add('gdr', gdr1, gdr2);
import * as eng1 from './clubs/eng'; import * as eng2 from './seasons/eng'; add('eng', eng1, eng2);
import * as sco1 from './clubs/sco'; import * as sco2 from './seasons/sco'; add('sco', sco1, sco2);
import * as ita1 from './clubs/ita'; import * as ita2 from './seasons/ita'; add('ita', ita1, ita2);
import * as esp1 from './clubs/esp'; import * as esp2 from './seasons/esp'; add('esp', esp1, esp2);
import * as por1 from './clubs/por'; import * as por2 from './seasons/por'; add('por', por1, por2);
import * as urs1 from './clubs/urs'; import * as urs2 from './seasons/urs'; add('urs', urs1, urs2);
import * as pol1 from './clubs/pol'; import * as pol2 from './seasons/pol'; add('pol', pol1, pol2);
import * as hun1 from './clubs/hun'; import * as hun2 from './seasons/hun'; add('hun', hun1, hun2);
import * as tch1 from './clubs/tch'; import * as tch2 from './seasons/tch'; add('tch', tch1, tch2);
import * as yug1 from './clubs/yug'; import * as yug2 from './seasons/yug'; add('yug', yug1, yug2);
import * as rou1 from './clubs/rou'; import * as rou2 from './seasons/rou'; add('rou', rou1, rou2);
import * as bul1 from './clubs/bul'; import * as bul2 from './seasons/bul'; add('bul', bul1, bul2);
import * as rus1 from './clubs/rus'; import * as rus2 from './seasons/rus'; add('rus', rus1, rus2);
import * as ukr1 from './clubs/ukr'; import * as ukr2 from './seasons/ukr'; add('ukr', ukr1, ukr2);
// ------------------------------------------------------------------------------

/** Daten eines Landes eintragen (auch für Tests mit Beispieldaten aus tests/fixtures/). */
export function registerCountryData(cc: string, clubs: RealClub[], seasons: Record<number, SeasonRow>): void {
  BUILTIN[cc] = { clubs, seasons };
  cache.clear();
}

/** Eingebaute Daten (für den Datensatz-Schnappschuss/Editor). */
export function builtinWorldData(): Record<string, CountryWorld> { return BUILTIN; }

/** Datensatz-Überschreibung setzen (data/dataset/apply.ts); null = keine. */
export function setWorldOverride(o: Record<string, CountryWorld> | null | undefined): void {
  OVERRIDE = o ? JSON.parse(JSON.stringify(o)) : {};
  cache.clear();
}

/** Wirksame Daten eines Landes: Überschreibung > eingebaut > keine. */
export function countryWorld(cc: string): CountryWorld | null {
  const o = OVERRIDE[cc], b = BUILTIN[cc];
  if (!o && !b) return null;
  if (!o) return b;
  if (!b) return o;
  // Überschreibung ergänzt/ersetzt einzelne Vereine und Saisons.
  const byId = new Map(b.clubs.map((c) => [c.id, c]));
  for (const c of o.clubs ?? []) byId.set(c.id, c);
  return { clubs: [...byId.values()], seasons: { ...b.seasons, ...(o.seasons ?? {}) } };
}

/** Länder, für die Daten vorliegen. */
export function worldCountriesWithData(): string[] {
  return [...new Set([...Object.keys(BUILTIN), ...Object.keys(OVERRIDE)])].filter((cc) => countryWorld(cc));
}

/** Saisonzeile eines Landes (Startjahr) oder null. */
export function worldSeason(cc: string, year: number): SeasonRow | null {
  const w = countryWorld(cc);
  const row = w?.seasons[year] ?? (w?.seasons as Record<string, SeasonRow> | undefined)?.[String(year)];
  return row && Array.isArray(row.t1) && row.t1.length >= 2 ? row : null;
}

/** Verein eines Landes nach ID. */
export function realClub(cc: string, id: string): RealClub | undefined {
  let m = cache.get(cc);
  if (!m) { m = new Map((countryWorld(cc)?.clubs ?? []).map((c) => [c.id, c])); cache.set(cc, m); }
  return m.get(id);
}

/** Name eines Vereins im Jahr (Umbenennungen `rename`). */
export function realClubName(c: RealClub, year: number): string {
  let n = c.name;
  for (const [y, name] of c.rename ?? []) if (year >= y) n = name;
  return n;
}

/** Jahre mit Saisondaten eines Landes (aufsteigend). */
export function worldYears(cc: string): number[] {
  const w = countryWorld(cc);
  return w ? Object.keys(w.seasons).map(Number).filter((y) => worldSeason(cc, y)).sort((a, b) => a - b) : [];
}

export type { RealClub, SeasonRow } from './types';

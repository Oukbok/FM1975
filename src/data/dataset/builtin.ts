// =============================================================================
// Eingebauter Datensatz: Schnappschuss der Werte im Code (vor jeder Änderung).
// =============================================================================
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../generate';
import { DDR_LIGA_SEEDS, DDR_OBERLIGA_SEEDS } from '../ddr';
import { CWC_CLUBS, EC_CLUBS, EURO_FIRST_SEASON_GERMAN, UEFA_CLUBS } from '../europe';
import { COUNTRY_SEEDS, COUNTRY_SPLITS, COUNTRY_TRENDS, EURO_EXCLUSIONS } from '../worldSeed';
import { TIMELINE } from '../timeline';
import { BASE_STRUCTURE, LEAGUE_REFORMS } from '../reforms';
import { FACILITIES } from '../../engine/infrastructure';
import { STAFF_ROLES } from '../staff';
import { MARKETING_AREAS } from '../marketing';
import { MIX, ORIGINS } from '../origins';
import { BLOCKED_NAMES } from '../namePools';
import { LEGENDS } from '../legends';
import { ANCHORS, REVENUE_MIX } from '../../engine/economy';
import { HISTORY } from '../history';
import { DATASET_FORMAT, DATASET_VERSION, Dataset } from './schema';

export const BUILTIN_ID = 'builtin';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let pristine: Dataset | null = null;

/** Der eingebaute Datensatz. Beim ersten Aufruf wird der unveränderte Code-Stand festgehalten. */
export function builtinDataset(): Dataset {
  if (!pristine) pristine = snapshotCurrent(BUILTIN_ID, 'Standard (1975)');
  return clone(pristine);
}

/** Aktueller Stand der Tabellen im Speicher als Datensatz (für den Export). */
export function snapshotCurrent(id: string, name: string): Dataset {
  return clone({
    format: DATASET_FORMAT,
    version: DATASET_VERSION,
    meta: {
      id, name, author: '1975 – A Football Manager', created: new Date().toISOString().slice(0, 10),
      description: 'Der eingebaute Datensatz: fiktive Vereinsnamen nach Städten, Ligasystem und Geschichte ab 1975.',
    },
    clubs: {
      tier1: CLUB_SEEDS, secondNord: SECOND_LIGA_NORD_SEEDS, secondSued: SECOND_LIGA_SUED_SEEDS,
      ddrOberliga: DDR_OBERLIGA_SEEDS, ddrLiga: DDR_LIGA_SEEDS,
    },
    crests: {},
    kits: {},
    europe: {
      countries: COUNTRY_SEEDS, trends: COUNTRY_TRENDS, splits: COUNTRY_SPLITS, exclusions: EURO_EXCLUSIONS,
      clubs: [...EC_CLUBS, ...CWC_CLUBS, ...UEFA_CLUBS], firstSeasonGerman: EURO_FIRST_SEASON_GERMAN,
    },
    timeline: TIMELINE,
    leagues: { base: BASE_STRUCTURE, reforms: LEAGUE_REFORMS },
    facilities: FACILITIES.map((f) => ({ key: f.key, name: f.name, desc: f.desc, baseCost: f.baseCost, unlockYear: f.unlockYear, obsoleteYear: f.obsoleteYear })),
    staff: STAFF_ROLES,
    marketing: MARKETING_AREAS,
    names: {
      origins: Object.values(ORIGINS).map((o) => ({ id: o.id, nationality: o.nationality, face: o.face, first: o.first, last: o.last })),
      mix: MIX,
      blocked: [...BLOCKED_NAMES],
    },
    legends: LEGENDS,
    economy: { anchors: ANCHORS, revenueMix: REVENUE_MIX },
    history: HISTORY,
  } as Dataset);
}

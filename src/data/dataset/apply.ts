// =============================================================================
// Datensatz anwenden: ersetzt die Tabellen im Speicher (in place), damit alle
// Module, die sie importieren, automatisch die neuen Werte sehen.
// Wird VOR dem Start eines neuen Spiels bzw. VOR dem Laden eines Spielstands
// aufgerufen. Fehlende Teile fallen auf den eingebauten Datensatz zurück.
// =============================================================================
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../generate';
import { DDR_LIGA_SEEDS, DDR_OBERLIGA_SEEDS } from '../ddr';
import { CWC_CLUBS, EC_CLUBS, EURO_FIRST_SEASON_GERMAN, UEFA_CLUBS, EURO_FOREIGN_COUNT } from '../europe';
import { COUNTRY_SEEDS, COUNTRY_SPLITS, COUNTRY_TRENDS, EURO_EXCLUSIONS } from '../worldSeed';
import { TIMELINE, seasonStartYear } from '../timeline';
import { BASE_STRUCTURE, LEAGUE_REFORMS } from '../reforms';
import { FACILITIES, FACILITY_BY_KEY } from '../../engine/infrastructure';
import { STAFF_BY_ID, STAFF_ROLES } from '../staff';
import { MARKETING_AREAS, MARKETING_BY_ID } from '../marketing';
import { MIX, ORIGINS, Origin } from '../origins';
import { BLOCKED_NAMES } from '../namePools';
import { LEGENDS } from '../legends';
import { ANCHORS, REVENUE_MIX, resetEconomyCache } from '../../engine/economy';
import { HISTORY } from '../history';
import { TRANSFER_RECORD_ANCHORS } from '../transferRecords';
import { Dataset } from './schema';
import { BUILTIN_ID, builtinDataset } from './builtin';

let activeId = BUILTIN_ID;
let activeCosmetics: Pick<Dataset, 'crests' | 'kits'> = {};

export function activeDatasetId(): string { return activeId; }

/** Wappen/Trikots des aktiven Datensatzes für einen Verein (falls vorhanden). */
export function datasetCrest(clubId: string): string | undefined { return activeCosmetics.crests?.[clubId]; }
export function datasetKits(clubId: string) { return activeCosmetics.kits?.[clubId]; }

function replaceArray<T>(target: T[], src: T[] | undefined, fallback: T[]): void {
  const next = JSON.parse(JSON.stringify(src && src.length ? src : fallback)) as T[];
  target.splice(0, target.length, ...next);
}
function replaceRecord<T>(target: Record<string, T>, src: Record<string, T> | undefined, fallback: Record<string, T>): void {
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, JSON.parse(JSON.stringify(src ?? fallback)));
}

/** Wendet einen Datensatz an (oder den eingebauten, wenn `ds` fehlt). */
export function applyDataset(ds: Dataset | null): void {
  const base = builtinDataset(); // sichert zuerst den unveränderten Code-Stand
  const d = ds ?? base;
  activeId = d.meta?.id ?? BUILTIN_ID;
  activeCosmetics = { crests: d.crests ?? {}, kits: d.kits ?? {} };

  replaceArray(CLUB_SEEDS, d.clubs?.tier1, base.clubs.tier1);
  replaceArray(SECOND_LIGA_NORD_SEEDS, d.clubs?.secondNord, base.clubs.secondNord);
  replaceArray(SECOND_LIGA_SUED_SEEDS, d.clubs?.secondSued, base.clubs.secondSued);
  replaceArray(DDR_OBERLIGA_SEEDS, d.clubs?.ddrOberliga, base.clubs.ddrOberliga);
  replaceArray(DDR_LIGA_SEEDS, d.clubs?.ddrLiga, base.clubs.ddrLiga);

  // Europa: Länder, Trends, Teilungen, Sperren; Starter der ersten Saison je Wettbewerb.
  replaceArray(COUNTRY_SEEDS, d.europe?.countries, base.europe.countries);
  replaceRecord(COUNTRY_TRENDS, d.europe?.trends, base.europe.trends);
  replaceArray(COUNTRY_SPLITS, d.europe?.splits, base.europe.splits);
  replaceArray(EURO_EXCLUSIONS, d.europe?.exclusions, base.europe.exclusions);
  const euro = d.europe?.clubs?.length ? d.europe.clubs : base.europe.clubs;
  replaceArray(EC_CLUBS, euro.filter((c) => c.comp === 'ec'), []);
  replaceArray(CWC_CLUBS, euro.filter((c) => c.comp === 'cwc'), []);
  replaceArray(UEFA_CLUBS, euro.filter((c) => c.comp === 'uefa'), []);
  EURO_FOREIGN_COUNT.ec = EC_CLUBS.length;
  EURO_FOREIGN_COUNT.cwc = CWC_CLUBS.length;
  EURO_FOREIGN_COUNT.uefa = UEFA_CLUBS.length;
  const fsg = d.europe?.firstSeasonGerman ?? base.europe.firstSeasonGerman;
  EURO_FIRST_SEASON_GERMAN.ec = [...fsg.ec];
  EURO_FIRST_SEASON_GERMAN.cwc = [...fsg.cwc];
  EURO_FIRST_SEASON_GERMAN.uefa = [...fsg.uefa];

  replaceArray(TIMELINE, d.timeline, base.timeline);
  TIMELINE.sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season) || a.year - b.year);
  replaceArray(BASE_STRUCTURE, d.leagues?.base, base.leagues.base);
  replaceArray(LEAGUE_REFORMS, d.leagues?.reforms, base.leagues.reforms);

  // Einrichtungen: nur Daten-Felder übernehmen, die Effekte bleiben im Code.
  const facs = d.facilities?.length ? d.facilities : base.facilities;
  for (const f of FACILITIES) {
    const src = facs.find((x) => x.key === f.key) ?? base.facilities.find((x) => x.key === f.key);
    if (!src) continue;
    f.name = src.name; f.desc = src.desc; f.baseCost = src.baseCost;
    f.unlockYear = src.unlockYear; f.obsoleteYear = src.obsoleteYear;
    FACILITY_BY_KEY[f.key] = f;
  }

  replaceArray(STAFF_ROLES, d.staff, base.staff);
  for (const k of Object.keys(STAFF_BY_ID)) delete STAFF_BY_ID[k];
  for (const r of STAFF_ROLES) STAFF_BY_ID[r.id] = r;
  replaceArray(MARKETING_AREAS, d.marketing, base.marketing);
  for (const k of Object.keys(MARKETING_BY_ID)) delete MARKETING_BY_ID[k];
  for (const a of MARKETING_AREAS) MARKETING_BY_ID[a.id] = a;

  // Namen
  const origins = d.names?.origins?.length ? d.names.origins : base.names.origins;
  for (const k of Object.keys(ORIGINS)) delete ORIGINS[k];
  for (const o of origins) ORIGINS[o.id] = JSON.parse(JSON.stringify(o)) as Origin;
  replaceArray(MIX, d.names?.mix, base.names.mix);
  BLOCKED_NAMES.clear();
  for (const n of d.names?.blocked ?? base.names.blocked) BLOCKED_NAMES.add(n);

  replaceArray(LEGENDS, d.legends, base.legends);

  replaceArray(ANCHORS, d.economy?.anchors, base.economy.anchors);
  ANCHORS.sort((a, b) => a.year - b.year);
  replaceArray(REVENUE_MIX, d.economy?.revenueMix, base.economy.revenueMix);
  REVENUE_MIX.sort((a, b) => a.year - b.year);
  replaceArray(TRANSFER_RECORD_ANCHORS, d.economy?.transferRecords, base.economy.transferRecords ?? []);
  TRANSFER_RECORD_ANCHORS.sort((a, b) => a.year - b.year);
  resetEconomyCache();

  const h = d.history ?? base.history;
  HISTORY.cupWinnersCupLastSeason = h.cupWinnersCupLastSeason ?? base.history.cupWinnersCupLastSeason;
  HISTORY.attendanceRestrictions = JSON.parse(JSON.stringify(h.attendanceRestrictions ?? base.history.attendanceRestrictions));
  HISTORY.tvMarket = JSON.parse(JSON.stringify(h.tvMarket ?? base.history.tvMarket));
  HISTORY.bosmanFromYear = h.bosmanFromYear ?? base.history.bosmanFromYear;
}

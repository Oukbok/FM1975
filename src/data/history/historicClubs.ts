// =============================================================================
// HISTORISCHE VEREINE außerhalb der simulierten Ligen 1975/76 (Vereins-Pool)
// -----------------------------------------------------------------------------
// Vereine, die früher erstklassig (Bundesliga 1963–1975, DDR-Oberliga) oder
// zweitklassig (2. Liga 1974/75) spielten, 1975/76 aber in den nicht simulierten
// Amateurligen antreten – dazu einige Amateurvereine, die in den Folgejahren
// historisch aufstiegen. Sie existieren im Spiel als schlanke Sim-Vereine im
// „Pool“ (tier 9 West, tier 109 DDR, game/clubPool.ts) und können über den
// Auf-/Abstiegs-Tausch mit der untersten simulierten Liga zurückkehren.
//
// Namen nach der Stadt-Logik von data/generate.ts (keine geschützten Vereins-
// namen): Stadt; bei zweitem Verein derselben Stadt Farbe oder Stadtteil.
// Zuordnung echter Verein → Spiel-Verein:
//   Rot-Weiß Oberhausen → h_rwo „Oberhausen“      Borussia Neunkirchen → h_neu „Neunkirchen“
//   Tasmania 1900 Berlin → h_tas „Berlin Neukölln“ VfL Wolfsburg → h_wob „Wolfsburg“
//   Olympia Wilhelmshaven → h_whv                   HSV Barmbek-Uhlenhorst → h_bu „Hamburg Barmbek“
//   VfR Heilbronn → h_hei                           Wormatia Worms → h_wor
//   VfR Mannheim → h_vfr „Mannheim Rot“ (Waldhof = s_man „Mannheim“)
//   Holstein Kiel, OSC Bremerhaven, VfB Oldenburg, Arminia Hannover („Hannover Blau“),
//   RW Lüdenscheid, Bonner SC, SC Herford, Eintracht Trier, SC Freiburg, KSV Baunatal,
//   KSV Hessen Kassel, ESV Ingolstadt, Würzburger Kickers – Amateur-Spitzenvereine
//   der 70er (Aufsteiger in die 2. Liga 1976–1980).
//   DDR: Wismut Aue, Sachsenring Zwickau, Stahl Riesa, Vorwärts Berlin/Frankfurt (Oder),
//   Chemie Leipzig („Leipzig Grün“), Energie Cottbus, Union Berlin („Berlin Köpenick“),
//   Vorwärts Stralsund, Lok Stendal, Motor Steinach, SC Neubrandenburg, Wismut Gera,
//   Stahl Eisenhüttenstadt.
// Quellen: Abschlusstabellen 2. Bundesliga 1974/75 und 1975/76 (en.wikipedia.org
// „1974–75 2. Bundesliga“, „1975–76 2. Bundesliga“), „1975–76 Oberliga“ (Amateur-
// Oberligen), DDR-Oberliga-Tabellen 1963–1976 (claudionicoletti.eu, en.wikipedia.org).
// Stärken sind Spielwerte (2. Liga 1975 ≈ 49–68), keine Messwerte.
// =============================================================================
import type { LeagueGroup, SimClub } from '../../engine/leagues';

/** Ebene des West-Pools (Amateurligen, nicht simuliert). */
export const POOL_TIER = 9;
/** Ebene des DDR-Pools (Bezirksligen/DDR-Liga-Staffeln, nicht simuliert). */
export const DDR_POOL_TIER = 109;

type Row = [id: string, name: string, short: string, city: string, primary: string, secondary: string, strength: number, group: LeagueGroup];

const WEST: Row[] = [
  // ehemalige Bundesligisten / 2.-Liga-Absteiger 1975 (Nord)
  ['h_rwo', 'Oberhausen', 'OBH', 'Oberhausen', '#C62828', '#FFFFFF', 52, 'nord'],
  ['h_tas', 'Berlin Neukölln', 'BNK', 'Berlin', '#1565C0', '#FFFFFF', 45, 'nord'],
  ['h_wob', 'Wolfsburg', 'WOB', 'Wolfsburg', '#2E7D32', '#FFFFFF', 51, 'nord'],
  ['h_whv', 'Wilhelmshaven', 'WHV', 'Wilhelmshaven', '#C62828', '#000000', 47, 'nord'],
  ['h_bu', 'Hamburg Barmbek', 'HBA', 'Hamburg', '#1565C0', '#F2C200', 45, 'nord'],
  // Amateur-Spitze Nord
  ['h_kie', 'Kiel', 'KIE', 'Kiel', '#0D47A1', '#FFFFFF', 50, 'nord'],
  ['h_brh', 'Bremerhaven', 'BRH', 'Bremerhaven', '#1565C0', '#FFFFFF', 47, 'nord'],
  ['h_old', 'Oldenburg', 'OLD', 'Oldenburg', '#1565C0', '#FFFFFF', 47, 'nord'],
  ['h_arh', 'Hannover Blau', 'HAB', 'Hannover', '#0D47A1', '#FFFFFF', 49, 'nord'],
  ['h_lue', 'Lüdenscheid', 'LÜD', 'Lüdenscheid', '#C62828', '#FFFFFF', 48, 'nord'],
  ['h_bon', 'Bonn', 'BON', 'Bonn', '#C62828', '#1565C0', 47, 'nord'],
  ['h_her', 'Herford', 'HFD', 'Herford', '#000000', '#FFFFFF', 46, 'nord'],
  // ehemalige Bundesligisten / 2.-Liga-Absteiger 1975 (Süd)
  ['h_neu', 'Neunkirchen', 'NEU', 'Neunkirchen', '#000000', '#FFFFFF', 50, 'sued'],
  ['h_hei', 'Heilbronn', 'HEI', 'Heilbronn', '#C62828', '#000000', 48, 'sued'],
  ['h_wor', 'Worms', 'WOR', 'Worms', '#C62828', '#FFFFFF', 49, 'sued'],
  ['h_vfr', 'Mannheim Rot', 'MAR', 'Mannheim', '#C62828', '#1565C0', 47, 'sued'],
  // Amateur-Spitze Süd
  ['h_tri', 'Trier', 'TRI', 'Trier', '#1A237E', '#000000', 49, 'sued'],
  ['h_fre', 'Freiburg', 'FRE', 'Freiburg', '#C62828', '#FFFFFF', 48, 'sued'],
  ['h_bau', 'Baunatal', 'BAU', 'Baunatal', '#C62828', '#FFFFFF', 48, 'sued'],
  ['h_kas', 'Kassel', 'KAS', 'Kassel', '#C62828', '#FFFFFF', 49, 'sued'],
  ['h_ing', 'Ingolstadt', 'ING', 'Ingolstadt', '#000000', '#FFFFFF', 48, 'sued'],
  ['h_wue', 'Würzburg', 'WÜR', 'Würzburg', '#C62828', '#FFFFFF', 48, 'sued'],
];

const DDR: Row[] = [
  ['ddr-stralsund', 'Stralsund', 'STR', 'Stralsund', '#1565C0', '#FFFFFF', 52, 'nordost'],
  ['ddr-stendal', 'Stendal', 'STD', 'Stendal', '#1565C0', '#FFFFFF', 51, 'nordost'],
  ['ddr-steinach', 'Steinach', 'STN', 'Steinach', '#C62828', '#FFFFFF', 49, 'nordost'],
  ['ddr-neubrandenburg', 'Neubrandenburg', 'NBG', 'Neubrandenburg', '#1565C0', '#FFFFFF', 50, 'nordost'],
  ['ddr-gera', 'Gera', 'GER', 'Gera', '#5C2D91', '#FFFFFF', 50, 'nordost'],
  ['ddr-eisenh', 'Eisenhüttenstadt', 'EHS', 'Eisenhüttenstadt', '#1565C0', '#FFFFFF', 50, 'nordost'],
];

const toSim = (r: Row, tier: number, ddr = false): SimClub => ({
  id: r[0], name: r[1], shortName: r[2], city: r[3], colors: { primary: r[4], secondary: r[5] },
  strength: r[6], tier, group: r[7], ...(ddr ? { ddr: true } : {}),
});

/** West-Pool zum Spielbeginn 1975/76. */
export function westPoolSeeds(): SimClub[] { return WEST.map((r) => toSim(r, POOL_TIER)); }
/** DDR-Pool zum Spielbeginn 1975/76. */
export function ddrPoolSeeds(): SimClub[] { return DDR.map((r) => toSim(r, DDR_POOL_TIER, true)); }

// -----------------------------------------------------------------------------
// Anzeige-Register: Namen/Farben aller Vereine, die in der Historie vorkommen,
// auch wenn ein Spielstand sie (noch) nicht kennt (alte Spielstände, gelöschte
// Platzhalter). Volle/Sim-Vereine des Spielstands haben immer Vorrang.
// -----------------------------------------------------------------------------
export interface HistoricClubInfo { name: string; shortName: string; city: string; colors: { primary: string; secondary: string }; historicalName?: string; renamedYear?: number }

const EXTRA: Record<string, HistoricClubInfo> = {
  // DDR-Vereine der Oberliga 1975/76, die alte Spielstände nicht kennen (data/ddr.ts)
  'ddr-aue': { name: 'Aue', shortName: 'AUE', city: 'Aue', colors: { primary: '#5C2D91', secondary: '#FFFFFF' } },
  'ddr-zwickau': { name: 'Zwickau', shortName: 'ZWI', city: 'Zwickau', colors: { primary: '#C62828', secondary: '#FFFFFF' } },
  'ddr-riesa': { name: 'Riesa', shortName: 'RIE', city: 'Riesa', colors: { primary: '#1565C0', secondary: '#FFFFFF' } },
  'ddr-frankfurt-oder': { name: 'Frankfurt (Oder)', shortName: 'FFO', city: 'Frankfurt (Oder)', colors: { primary: '#C62828', secondary: '#F2C200' }, historicalName: 'Berlin Rot-Gelb', renamedYear: 1971 },
  'ddr-leipzig-chemie': { name: 'Leipzig Grün', shortName: 'LEG', city: 'Leipzig', colors: { primary: '#2E7D32', secondary: '#FFFFFF' } },
  'ddr-cottbus': { name: 'Cottbus', shortName: 'COT', city: 'Cottbus', colors: { primary: '#C62828', secondary: '#FFFFFF' } },
  'ddr-union': { name: 'Berlin Köpenick', shortName: 'BKÖ', city: 'Berlin (Ost)', colors: { primary: '#C62828', secondary: '#FFFFFF' } },
};

let registry: Record<string, HistoricClubInfo> | null = null;
export function historicClubInfo(id: string): HistoricClubInfo | undefined {
  if (!registry) {
    registry = { ...EXTRA };
    for (const r of [...WEST, ...DDR]) registry[r[0]] = { name: r[1], shortName: r[2], city: r[3], colors: { primary: r[4], secondary: r[5] } };
  }
  return registry[id];
}

/** Zeit-korrekter Name aus dem Register (z. B. „Berlin Rot-Gelb“ bis 1970). */
export function historicClubName(id: string, year?: number): string | undefined {
  const h = historicClubInfo(id);
  if (!h) return undefined;
  if (h.historicalName && h.renamedYear && year != null && year < h.renamedYear) return h.historicalName;
  return h.name;
}

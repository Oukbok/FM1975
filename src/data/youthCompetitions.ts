// =============================================================================
// JUGENDWETTBEWERBE — historische Formate je Saison (A-/B-Jugend, Pokal, DDR, UEFA)
// -----------------------------------------------------------------------------
// Quellen (abgerufen 11/2026):
// • Deutsche A-Junioren-Meisterschaft: de.wikipedia „Deutsche Fußballmeisterschaft der
//   A-Junioren“ – ab 1969, ab 1972 Meister der Landesverbände, ab 1975 K.-o.-Runden in
//   Hin- und Rückspiel, ab 1992 mit den Meistern der neuen Bundesländer, mit den
//   Regionalligen 8 Teilnehmer, ab 2003/04 A-Junioren-Bundesliga (4 Teilnehmer).
//   wikiwaldhof.org „Deutsche Fußball-A-Jugendmeisterschaft 1978/79“: 16 Landesmeister,
//   Achtel-/Viertel-/Halbfinale mit Hin- und Rückspiel (Juni/Juli), Endspiel in einem Spiel.
//   de.wikipedia „… A-Junioren 1996/97“: 8 Teilnehmer = Regionalliga-Meister (Nord, West,
//   Südwest, Süd, 2× Nordost) + Vizemeister West und Süd; Viertel- und Halbfinale mit
//   Hin- und Rückspiel, Endspiel (Augsburg).
//   en.wikipedia „Under 19 Bundesliga“: U19-Regionalligen 1996 (Nord, Nordost, West,
//   Südwest, Süd), Sommer 2003 drei Staffeln (Nord/Nordost, West, Süd/Südwest) à 14,
//   26 Spieltage, je 3 Absteiger; Endrunde = 3 Staffelmeister + Vizemeister Süd/Südwest,
//   Halbfinale Hin-/Rückspiel (Gleichstand → Elfmeterschießen ohne Verlängerung),
//   Endspiel ein Spiel (Verlängerung 2 × 10 Min., dann Elfmeter).
// • Deutsche B-Junioren-Meisterschaft: en.wikipedia „Under 17 Bundesliga“ – erstes
//   Endspiel 3.7.1977 (Niefern); U17-Regionalligen ab 2000; B-Junioren-Bundesliga
//   2007/08 im selben Modus wie die A-Junioren.
// • DFB-Junioren-Vereinspokal (U19): rsssf.org „Germany – List of Youth Champions and
//   Cup Winners“ (Endspiele ab 1987); de-academic „DFB-Junioren-Vereinspokal 2001/02“:
//   21 Verbandspokalsieger, 1. Runde 5 Spiele, dann Achtelfinale (Termine Sept.–Mai);
//   dfb.de „FAQ: 32 Teams, vier Siege bis zum Finale“: seit 2017/18 32 Teilnehmer (21
//   Verbandspokalsieger, Titelverteidiger, Meister, je drei Beste der drei Staffeln),
//   ein Spiel, Verlängerung + Elfmeter, Amateure Heimrecht bis zum Halbfinale, Finale am
//   Freitag vor dem DFB-Pokalfinale; dfb.de „DFB-Pokal der Junioren – Modus“: ab 2025/26
//   64 Teilnehmer, sechs Runden.
// • DFB-Nachwuchsliga ab 2024/25: dfb.de „FAQ: Alles zur Reform der Nachwuchsligen“ –
//   Vorrunde in regionalen Gruppen (max. 8 Teams, 14 Spieltage), Hauptrunde Liga A
//   (24 Teams in 4 Gruppen à 6, 10 Spieltage, je 4 Beste ins Achtelfinale), K.-o. in
//   einem Spiel. Liga B (Abstiegsrunde) wird nicht nachgebildet.
// • DDR: rsssf.org „East Germany – Youth Championships“ – Junioren-Oberliga 1968/69–
//   1975/76 und 1983/84–1988/89, Nachwuchsoberliga (14 Teams wie die Oberliga, ohne Auf-/
//   Abstieg) 1976/77–1982/83 und 1989/90–1990/91. Im Spiel: eine Liga der 14 Vereine
//   der DDR-Oberliga, ihr Meister ist DDR-Juniorenmeister.
// • UEFA Youth League: uefa.com / en.wikipedia „2024–25 UEFA Youth League“ – ab 2013/14
//   Jugend der 32 Champions-League-Vereine in 8 Gruppen à 4, dann K.-o. (Final Four in
//   Nyon im April); ab 2015/16 zusätzlich ein Weg der nationalen Jugendmeister (Play-off
//   gegen die Gruppenzweiten); ab 2024/25 Ligaphase mit 36 Teams (6 Spiele, die besten 22
//   weiter) + 10 Sieger des Meisterwegs → Sechzehntelfinale.
// Vereinfachungen (Spiel): Landesverbands-Ligen werden zu Verbandsligen der Vereine im
// Spiel zusammengefasst; die Endrunde bleibt bei 16 Plätzen (ab 1991/92 inkl. Nordost).
// Endrunden liegen vor dem 30.6. (historisch teils bis Ende Juli). Der Meisterweg der
// UEFA Youth League ist auf die ausländischen Vereine im Spiel verkleinert.
// Fortschreibung: nach dem letzten belegten Stand (Nachwuchsliga, 64er-Pokal, UYL 2024).
// =============================================================================

import type { YcLowCls, YcLowKey } from './youthLowerLeagues';

/** Wettbewerbe; C- bis G-Jugend (u15 … u7) siehe data/youthLowerLeagues.ts. */
export type YcKey = 'u19' | 'u17' | 'pokal' | 'ddr' | 'uyl' | YcLowKey;
export type YcCls = 'A' | 'B' | YcLowCls;
export type YcFormat =
  | 'lv16' | 'rl8' | 'bl4' | 'nwl' | 'ddr'
  | 'cup16' | 'cup21' | 'cup32' | 'cup64'
  | 'uyl1' | 'uyl2' | 'uyl3'
  /** C- bis F-Jugend: Staffel des eigenen Vereins mit Tabelle; Spielfeste ohne Tabelle. */
  | 'stf' | 'fest';

/** Landesverbände (DFB, ab 1990 inkl. NOFV). */
export type Lv =
  | 'SH' | 'HH' | 'HB' | 'NI' | 'BE' | 'WF' | 'NR' | 'MR' | 'RL' | 'SW' | 'SL' | 'HE' | 'BA' | 'SB' | 'WU' | 'BY'
  | 'MV' | 'BB' | 'ST' | 'TH' | 'SN';

/** Regionalverband / Regionalliga-Region. */
export type YcRegion = 'nord' | 'nordost' | 'west' | 'suedwest' | 'sued';

export const LV_REGION: Record<Lv, YcRegion> = {
  SH: 'nord', HH: 'nord', HB: 'nord', NI: 'nord', BE: 'nordost', WF: 'west', NR: 'west', MR: 'west',
  RL: 'suedwest', SW: 'suedwest', SL: 'suedwest', HE: 'sued', BA: 'sued', SB: 'sued', WU: 'sued', BY: 'sued',
  MV: 'nordost', BB: 'nordost', ST: 'nordost', TH: 'nordost', SN: 'nordost',
};

/** Stadt → Landesverband (Vereine im Spiel; unbekannte Städte → nach Liga-Gruppe). */
export const CITY_LV: Record<string, Lv> = {
  Kiel: 'SH', Lübeck: 'SH', Hamburg: 'HH', Bremen: 'HB', Bremerhaven: 'HB',
  Hannover: 'NI', Braunschweig: 'NI', Osnabrück: 'NI', Göttingen: 'NI', Wolfsburg: 'NI', Wilhelmshaven: 'NI', Oldenburg: 'NI',
  Berlin: 'BE', 'Berlin (Ost)': 'BE',
  Dortmund: 'WF', Gelsenkirchen: 'WF', Bochum: 'WF', Münster: 'WF', Wattenscheid: 'WF', Bielefeld: 'WF', Herne: 'WF',
  Erkenschwick: 'WF', Gütersloh: 'WF', Lüdenscheid: 'WF', Herford: 'WF', Paderborn: 'WF',
  Mönchengladbach: 'NR', Essen: 'NR', Düsseldorf: 'NR', Duisburg: 'NR', Krefeld: 'NR', Wuppertal: 'NR', Solingen: 'NR', Mülheim: 'NR', Oberhausen: 'NR', Uerdingen: 'NR',
  Köln: 'MR', Aachen: 'MR', Leverkusen: 'MR', Bonn: 'MR',
  Koblenz: 'RL', Trier: 'RL', 'Bad Kreuznach': 'SW',
  Kaiserslautern: 'SW', Mainz: 'SW', Pirmasens: 'SW', Worms: 'SW', Ludwigshafen: 'SW',
  Saarbrücken: 'SL', Homburg: 'SL', Völklingen: 'SL', Neunkirchen: 'SL',
  Frankfurt: 'HE', Offenbach: 'HE', Darmstadt: 'HE', Kassel: 'HE', Baunatal: 'HE', Wiesbaden: 'HE',
  Karlsruhe: 'BA', Mannheim: 'BA', Heidelberg: 'BA', Sinsheim: 'BA', Hoffenheim: 'BA', Freiburg: 'SB',
  Stuttgart: 'WU', Reutlingen: 'WU', Heilbronn: 'WU', Ulm: 'WU',
  München: 'BY', Nürnberg: 'BY', Bayreuth: 'BY', Hof: 'BY', Fürth: 'BY', Augsburg: 'BY', Regensburg: 'BY',
  Schweinfurt: 'BY', Ingolstadt: 'BY', Würzburg: 'BY', Unterhaching: 'BY',
  Rostock: 'MV', Stralsund: 'MV', Neubrandenburg: 'MV', Schwerin: 'MV',
  'Frankfurt (Oder)': 'BB', Cottbus: 'BB', Brandenburg: 'BB', Eisenhüttenstadt: 'BB', Oderbruch: 'BB', Uckermark: 'BB', Lausitz: 'BB', Potsdam: 'BB',
  Magdeburg: 'ST', Halle: 'ST', Stendal: 'ST', Harzberg: 'ST', Altmark: 'ST', Havelberg: 'ST',
  Jena: 'TH', Erfurt: 'TH', Gera: 'TH', Steinach: 'TH',
  Dresden: 'SN', Leipzig: 'SN', Chemnitz: 'SN', 'Karl-Marx-Stadt': 'SN', Zwickau: 'SN', Aue: 'SN', Riesa: 'SN', Vogtland: 'SN', Muldental: 'SN', Elstertal: 'SN',
};

/** Verbandsligen (Format lv16): Zusammenfassung der Landesverbände + Plätze in der Endrunde. */
export interface LvCluster { id: string; name: string; lvs: Lv[]; slots: number }

/** Bis 1990/91: 16 Landesverbände West = 16 Plätze. */
export const LV_CLUSTERS_WEST: LvCluster[] = [
  { id: 'nord', name: 'Nord (SH/HH/HB/NI)', lvs: ['SH', 'HH', 'HB', 'NI'], slots: 4 },
  { id: 'berlin', name: 'Berlin', lvs: ['BE'], slots: 1 },
  { id: 'wf', name: 'Westfalen', lvs: ['WF'], slots: 1 },
  { id: 'nr', name: 'Niederrhein', lvs: ['NR'], slots: 1 },
  { id: 'mr', name: 'Mittelrhein', lvs: ['MR'], slots: 1 },
  { id: 'sw', name: 'Südwest/Rheinland/Saar', lvs: ['SW', 'RL', 'SL'], slots: 3 },
  { id: 'he', name: 'Hessen', lvs: ['HE'], slots: 1 },
  { id: 'bw', name: 'Baden-Württemberg', lvs: ['BA', 'SB', 'WU'], slots: 3 },
  { id: 'by', name: 'Bayern', lvs: ['BY'], slots: 1 },
];
/** 1991/92–Regionalliga: 21 Landesverbände, im Spiel weiter 16 Plätze (Nordost mit Berlin). */
export const LV_CLUSTERS_UNITED: LvCluster[] = [
  { id: 'nord', name: 'Nord (SH/HH/HB/NI)', lvs: ['SH', 'HH', 'HB', 'NI'], slots: 3 },
  { id: 'no', name: 'Nordost (NOFV)', lvs: ['BE', 'MV', 'BB', 'ST', 'TH', 'SN'], slots: 4 },
  { id: 'wf', name: 'Westfalen', lvs: ['WF'], slots: 1 },
  { id: 'nr', name: 'Niederrhein', lvs: ['NR'], slots: 1 },
  { id: 'mr', name: 'Mittelrhein', lvs: ['MR'], slots: 1 },
  { id: 'sw', name: 'Südwest/Rheinland/Saar', lvs: ['SW', 'RL', 'SL'], slots: 2 },
  { id: 'he', name: 'Hessen', lvs: ['HE'], slots: 1 },
  { id: 'bw', name: 'Baden-Württemberg', lvs: ['BA', 'SB', 'WU'], slots: 2 },
  { id: 'by', name: 'Bayern', lvs: ['BY'], slots: 1 },
];

/** Regionalligen (Format rl8): Plätze in der Endrunde (8). */
export const RL_LEAGUES: { region: YcRegion; name: string; slots: number }[] = [
  { region: 'nord', name: 'Regionalliga Nord', slots: 1 },
  { region: 'nordost', name: 'Regionalliga Nordost', slots: 2 },
  { region: 'west', name: 'Regionalliga West', slots: 2 },
  { region: 'suedwest', name: 'Regionalliga Südwest', slots: 1 },
  { region: 'sued', name: 'Regionalliga Süd', slots: 2 },
];

/** Bundesliga-Staffeln (Format bl4): Regionen + Plätze in der Endrunde (4). */
export const BL_STAFFELN: { id: string; name: string; regions: YcRegion[]; slots: number }[] = [
  { id: 'no', name: 'Nord/Nordost', regions: ['nord', 'nordost'], slots: 1 },
  { id: 'w', name: 'West', regions: ['west'], slots: 1 },
  { id: 'ssw', name: 'Süd/Südwest', regions: ['sued', 'suedwest'], slots: 2 },
];
export const BL_SIZE = 14;
export const RL_SIZE = 14;
export const LV_MAX = 16;
/** Nachwuchsliga: 8 Vorrundengruppen à 7 (14 Spieltage), Liga A 4 × 6. */
export const NWL_GROUPS = 8;
export const NWL_GROUP_SIZE = 7;

// -----------------------------------------------------------------------------
// Formate je Saison (y0 = Startjahr)
// -----------------------------------------------------------------------------
export function u19Format(y0: number): YcFormat {
  return y0 < 1996 ? 'lv16' : y0 < 2003 ? 'rl8' : y0 < 2024 ? 'bl4' : 'nwl';
}
export function u17Format(y0: number): YcFormat | null {
  return y0 < 1976 ? null : y0 < 2000 ? 'lv16' : y0 < 2007 ? 'rl8' : y0 < 2024 ? 'bl4' : 'nwl';
}
export function pokalFormat(y0: number): YcFormat | null {
  return y0 < 1986 ? null : y0 < 1991 ? 'cup16' : y0 < 2017 ? 'cup21' : y0 < 2025 ? 'cup32' : 'cup64';
}
export function uylFormat(y0: number): YcFormat | null {
  return y0 < 2013 ? null : y0 < 2015 ? 'uyl1' : y0 < 2024 ? 'uyl2' : 'uyl3';
}
/** DDR-Jugendliga (nur solange die DDR-Oberliga im Spiel besteht). */
export function ddrYouthName(y0: number): string {
  return (y0 >= 1976 && y0 <= 1982) || y0 >= 1989 ? 'DDR-Nachwuchsoberliga' : 'DDR-Junioren-Oberliga';
}

export function compLabel(key: YcKey, y0: number): string {
  switch (key) {
    case 'u19': return y0 < 2003 ? 'Deutsche A-Jugendmeisterschaft' : y0 < 2024 ? 'A-Junioren-Bundesliga' : 'DFB-Nachwuchsliga U19';
    case 'u17': return y0 < 2007 ? 'Deutsche B-Jugendmeisterschaft' : y0 < 2024 ? 'B-Junioren-Bundesliga' : 'DFB-Nachwuchsliga U17';
    case 'pokal': return y0 < 2002 ? 'DFB-Jugend-Kicker-Pokal' : 'DFB-Junioren-Vereinspokal';
    case 'ddr': return ddrYouthName(y0);
    case 'uyl': return 'UEFA Youth League';
    default: return `${LOW_LETTER[key]}-Jugend`;
  }
}
const LOW_LETTER: Record<YcLowKey, string> = { u15: 'C', u13: 'D', u11: 'E', u9: 'F', u7: 'G' };
const LOW_U: Record<YcLowKey, string> = { u15: 'U15', u13: 'U13', u11: 'U11', u9: 'U9', u7: 'U7' };
export function sectionLabel(key: YcKey, y0: number): string {
  if (key === 'u19' || key === 'pokal') return y0 < 1996 ? 'A-Jugend (U19)' : 'A-Junioren (U19)';
  if (key === 'u17') return y0 < 2000 ? 'B-Jugend (U17)' : 'B-Junioren (U17)';
  if (key === 'ddr') return 'DDR';
  if (key === 'uyl') return 'Europa';
  return `${LOW_LETTER[key]}-${y0 < 2000 ? 'Jugend' : 'Junioren'} (${LOW_U[key]})${key === 'u7' ? ' · Bambini' : ''}`;
}
/** Titelbezeichnung (Vereins-Historie, Nachrichten). */
export const TITLE_OF: Record<YcKey, string> = {
  u19: 'Deutscher A-Jugend-Meister', u17: 'Deutscher B-Jugend-Meister', pokal: 'DFB-Junioren-Pokalsieger',
  ddr: 'DDR-Juniorenmeister', uyl: 'Sieger der UEFA Youth League',
  // C–G: genauer Titel je Staffel in YcComp.title (data/youthLowerLeagues.ts lowTitle)
  u15: 'C-Jugend-Meister', u13: 'D-Jugend-Meister', u11: 'E-Jugend-Meister', u9: 'F-Jugend-Meister', u7: 'Bambini',
};

// -----------------------------------------------------------------------------
// Termine (UTC) – Jugend spielt sonntags, Europapokal unter der Woche
// -----------------------------------------------------------------------------
const DAY = 86400000;
export function isoAdd(iso: string, days: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
}
/** Nächster Wochentag `wd` (0 = So … 6 = Sa) am oder nach `iso`. */
export function weekdayOnOrAfter(iso: string, wd: number): string {
  const d = new Date(iso + 'T00:00:00Z').getUTCDay();
  return isoAdd(iso, (wd - d + 7) % 7);
}
export const sundayOnOrAfter = (iso: string) => weekdayOnOrAfter(iso, 0);

/** Zeitfenster der Ligaphase je Format (Monat-Tag; `y` = 0 Startjahr, 1 Folgejahr). */
export const LEAGUE_WINDOW: Record<'lv16' | 'rl8' | 'bl4' | 'ddr' | 'nwl1' | 'nwl2', { from: [number, string]; to: [number, string] }> = {
  lv16: { from: [0, '08-22'], to: [1, '05-18'] },
  rl8: { from: [0, '08-15'], to: [1, '05-22'] },
  bl4: { from: [0, '08-08'], to: [1, '05-22'] },
  ddr: { from: [0, '08-22'], to: [1, '06-08'] },
  nwl1: { from: [0, '08-15'], to: [0, '12-07'] },
  nwl2: { from: [1, '02-08'], to: [1, '04-30'] },
};

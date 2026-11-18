// =============================================================================
// 1975 – A Football Manager — REGIONEN DER STAFFELN (Geografie für Ligareformen)
// =============================================================================
// Staffeln werden nie über feste IDs gefunden, sondern über ihre Kennung `group`
// (Nord, Nordost, West, Südwest, Süd, Bayern). Jeder Verein bekommt eine feine
// Region aus seiner Stadt (Landesverband, data/youthCompetitions.ts `CITY_LV`,
// ergänzt um die Städte hier), sonst aus seiner bisherigen Staffel. Welche Staffel
// einer Struktur ihn aufnimmt, sagt eine Vorzugsreihe je Region – so passt dieselbe
// Regel zu allen Epochen:
//   1994–2000 Nord/Nordost/West-Südwest/Süd: Rheinland-Pfalz/Saar → West.
//   2008–2012 Nord/West/Süd: Nordost → Nord, Rheinland-Pfalz/Saar → West,
//             Hessen/Baden-Württemberg/Bayern → Süd.
//   ab 2012   Nord/Nordost/West/Südwest/Bayern: Hessen/Baden-Württemberg → Südwest.
// Quelle der Zuordnungen: https://en.wikipedia.org/wiki/Regionalliga (Abschnitte
// 2008–2012 und ab 2012).
// =============================================================================

import { LeagueGroup, hashStr } from '../engine/leagues';
import { CITY_LV, type Lv } from './youthCompetitions';

/** Feine Region eines Vereins (= Staffelkennung, die ihn am ehesten aufnimmt). */
export type Region = Exclude<LeagueGroup, null>;

/** Landesverband → feine Region (Regionalverbände; Hessen/Baden-Württemberg als „sued“). */
const LV_FINE: Record<Lv, Region> = {
  SH: 'nord', HH: 'nord', HB: 'nord', NI: 'nord',
  BE: 'nordost', MV: 'nordost', BB: 'nordost', ST: 'nordost', TH: 'nordost', SN: 'nordost',
  WF: 'west', NR: 'west', MR: 'west',
  RL: 'suedwest', SW: 'suedwest', SL: 'suedwest',
  HE: 'sued', BA: 'sued', SB: 'sued', WU: 'sued',
  BY: 'bayern',
};

/** Weitere Städte (Pool, Weltdaten, Historie), die `CITY_LV` nicht kennt. */
const EXTRA_LV: Record<string, Lv> = {
  Cuxhaven: 'NI', Celle: 'NI', Lüneburg: 'NI', Stade: 'NI', Emden: 'NI', Delmenhorst: 'NI', Nienburg: 'NI',
  Verden: 'NI', Meppen: 'NI', Garbsen: 'NI', Husum: 'SH', Rendsburg: 'SH', Neumünster: 'SH',
  Hagen: 'WF', Iserlohn: 'WF', Lünen: 'WF', Marl: 'WF', Hamm: 'WF', Lippstadt: 'WF', Arnsberg: 'WF',
  Siegen: 'WF', Ahlen: 'WF', Bocholt: 'WF', Moers: 'NR', Remscheid: 'NR', Düren: 'MR', Bergheim: 'MR',
  Salmtal: 'RL', 'Spiesen-Elversberg': 'SL',
  Hanau: 'HE', Bürstadt: 'HE', Pforzheim: 'BA', Eppingen: 'BA', Sandhausen: 'BA',
  Konstanz: 'SB', 'Villingen-Schwenningen': 'SB', Aalen: 'WU', Heidenheim: 'WU', Ravensburg: 'WU',
  Kempten: 'BY', Rosenheim: 'BY', Passau: 'BY', Landshut: 'BY', Bamberg: 'BY', Ansbach: 'BY',
  Memmingen: 'BY', Aschaffenburg: 'BY', Burghausen: 'BY',
  // Pool-Städte (data/poolTowns.ts)
  Erlangen: 'BY', Coburg: 'BY', Straubing: 'BY', Deggendorf: 'BY', Kaufbeuren: 'BY', Weiden: 'BY', Amberg: 'BY', 'Neu-Ulm': 'BY', Freising: 'BY', Dachau: 'BY', Schwabach: 'BY', Forchheim: 'BY', Kitzingen: 'BY', Neumarkt: 'BY',
  Neuwied: 'RL', Andernach: 'RL', Mayen: 'RL', 'Idar-Oberstein': 'RL',
  Speyer: 'SW', Frankenthal: 'SW', Landau: 'SW', Zweibrücken: 'SW',
  Saarlouis: 'SL', Merzig: 'SL', 'St. Ingbert': 'SL',
  Gießen: 'HE', Marburg: 'HE', Fulda: 'HE', Wetzlar: 'HE', Rüsselsheim: 'HE',
  Göppingen: 'WU', Esslingen: 'WU', Ludwigsburg: 'WU', Tübingen: 'WU',
  Bruchsal: 'BA', Offenburg: 'BA',
  Lörrach: 'SB', Singen: 'SB',
  Neuss: 'NR', Viersen: 'NR', Velbert: 'NR',
  Recklinghausen: 'WF', 'Castrop-Rauxel': 'WF', Detmold: 'WF', Minden: 'WF', Unna: 'WF',
};

/** Vorzugsreihe: welche Staffel nimmt einen Verein der Region auf, wenn es seine eigene nicht gibt. */
const PREFS: Record<Region, Region[]> = {
  nord: ['nord', 'nordost', 'west', 'sued', 'suedwest', 'bayern'],
  nordost: ['nordost', 'nord', 'bayern', 'sued', 'west', 'suedwest'],
  west: ['west', 'nord', 'suedwest', 'sued', 'nordost', 'bayern'],
  suedwest: ['suedwest', 'west', 'sued', 'bayern', 'nord', 'nordost'],
  sued: ['sued', 'suedwest', 'bayern', 'west', 'nordost', 'nord'],
  bayern: ['bayern', 'sued', 'suedwest', 'nordost', 'west', 'nord'],
};

/**
 * Feine Region aus Stadt und bisheriger Staffel (`hint`). Unbekannte Städte der
 * alten Staffel Süd werden fest aus dem Namen auf Bayern bzw. Hessen/Baden-Württemberg verteilt.
 */
export function clubRegion(city: string, hint: LeagueGroup): Region {
  const lv = CITY_LV[city] ?? EXTRA_LV[city];
  if (lv) return LV_FINE[lv];
  if (hint === 'sued') return hashStr(`rg:${city}`) % 5 < 2 ? 'bayern' : 'sued';
  return hint ?? 'west';
}

/** Region nur aus der Stadt (null = Stadt unbekannt) – für Prüfungen. */
export function knownRegion(city: string): Region | null {
  const lv = CITY_LV[city] ?? EXTRA_LV[city];
  return lv ? LV_FINE[lv] : null;
}

/** Vorzugsreihe der Region, beschränkt auf die vorhandenen Staffeln. */
export function preferredGroups(region: Region, groups: LeagueGroup[]): LeagueGroup[] {
  if (groups.some((g) => g == null)) return [null];
  return PREFS[region].filter((g) => groups.includes(g));
}

/** Die Staffel (Kennung), die einen Verein der Region in dieser Struktur aufnimmt. */
export function groupForRegion(region: Region, groups: LeagueGroup[]): LeagueGroup {
  return preferredGroups(region, groups)[0] ?? groups[0] ?? null;
}

/** Gehört ein Verein (Stadt + bisherige Staffel) in dieser Struktur zur Staffel `group`? */
export function fitsGroup(city: string, hint: LeagueGroup, group: LeagueGroup, groups: LeagueGroup[]): boolean {
  if (group == null) return true;
  const region = clubRegion(city, hint);
  if (groups.length <= 1) return region === group || hint === group; // einzige Staffel, z. B. NOFV-Oberliga 1991–94
  return groupForRegion(region, groups) === group;
}

/** Sortierrang einer Staffel für Anzeigen (Nord zuerst, dann im Uhrzeigersinn). */
export function groupOrder(g: LeagueGroup): number {
  return g == null ? 0 : ['nord', 'nordost', 'west', 'suedwest', 'sued', 'bayern'].indexOf(g) + 1;
}

/**
 * Verteilt Vereine nach Region auf Staffeln mit Obergrenze: zuerst bekommt jeder (in
 * der übergebenen Reihenfolge, z. B. stärkste zuerst) seine Wunsch-Staffel, dann die
 * zweite Wahl usw.; wer nirgends mehr Platz findet, landet in `overflow`. `strict`:
 * nur die Staffel der eigenen Region – wer dort keinen Platz hat, steht in `overflow`.
 */
export function assignByRegion(
  ids: string[],
  slots: { group: LeagueGroup; cap: number }[],
  regionOfId: (id: string) => Region,
  strict = false,
): { buckets: string[][]; overflow: string[] } {
  const buckets: string[][] = slots.map(() => []);
  const groups = slots.map((s) => s.group);
  const free = (k: number) => buckets[k].length < slots[k].cap;
  let rest = [...ids];
  for (let round = 0; round < (strict ? 1 : 6) && rest.length; round++) {
    const next: string[] = [];
    for (const id of rest) {
      const want = preferredGroups(regionOfId(id), groups)[round];
      const k = want === undefined ? -1 : slots.findIndex((s, i) => s.group === want && free(i));
      if (k >= 0) buckets[k].push(id); else next.push(id);
    }
    rest = next;
  }
  const overflow: string[] = [];
  if (strict) return { buckets, overflow: rest };
  for (const id of rest) {
    const k = slots.findIndex((_, i) => free(i));
    if (k >= 0) buckets[k].push(id); else overflow.push(id);
  }
  return { buckets, overflow };
}

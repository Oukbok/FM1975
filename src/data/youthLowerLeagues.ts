// =============================================================================
// JUGENDWETTBEWERBE — C- bis G-Jugend: Spielklassen und Spielformen je Saison
// -----------------------------------------------------------------------------
// Simuliert wird nur die Staffel, in der die Mannschaft des eigenen Vereins spielt
// (Gegner aus der Region, Rest der Liga fehlt). Quellen (abgerufen 11/2026):
// • C-Junioren (U15), höchste Klasse:
//   – nordfv.de „C-Junioren Regionalliga Nord“: 2004 vom NFV eingeführt, 12 Teams,
//     2018 auf 14 erweitert, vier Absteiger, Aufsteiger je Landesverband.
//   – en.wikipedia „Under 15 Regionalliga Süd“: erste Saison 2010/11, „the last of
//     Germany's five U15 Regionalligas to be introduced“; 12 Teams, ab 2013/14 14;
//     vorher Bezirks-/Landesligen mit süddeutscher Endrunde.
//   – en.wikipedia „Under 15 Bayernliga“: bayerische C-Jugend-Meisterschaft seit 1975
//     (Sieger der sieben Bezirksoberligen), 2005 Bayernliga Nord/Süd eingeführt.
//   – wdfv.de „Jugendligen“: C-Junioren-Regionalliga West ist die höchste Klasse (12 Teams).
//   Annahme (nicht belegt): Regionalligen West, Nordost, Südwest ab 2008/09 – zwischen
//   Nord (2004) und Süd (2010, als letzte). Vorher im Spiel: Verbandsliga/Oberliga des
//   Landesverbands (Bayern: Bezirksoberliga, ab 2005 Bayernliga).
// • D-Junioren (U13): de.wikipedia „D-Jugend“ – Spielform 9 gegen 9 (Kleinfeldtore,
//   2 × 30 Min.), vom DFB seit 2011/12 empfohlen; davor 11 gegen 11. Spielbetrieb in
//   Bezirks- und Kreisligen (z. B. fv-queichheim.de Chronik: „D-Jugend 1987 Dritter in
//   der Bezirksliga Vorderpfalz“).
// • E-Junioren (U11): fv-queichheim.de Chronik – „1973 mit der E-Jugend eine neue
//   Jugendklasse zum Spielbetrieb angemeldet“, Kreismeisterschaften (Kreismeister 1992).
//   Spielform im Spiel 7 gegen 7 (Kleinfeld).
// • F-Junioren (U9): fv-queichheim.de – im Kreis Landau Mitte der 1980er die erste
//   F-Jugend, „spielte in der Meisterschaft des Kreises Germersheim, 1984 auf Anhieb
//   Erste“ → im Spiel Kreisstaffeln mit Tabelle ab 1984/85, vorher nur Freundschafts-
//   spiele/Turniere. wuerttfv.de „Fair Play Liga“: Pilot Frühjahr 2007 im Kreis Aachen
//   (F-Junioren), 2009/10 weitere Kreise am Mittelrhein, 2010/11 weitere Landesverbände
//   (ohne Schiedsrichter, Trainer gemeinsam in der Coachingzone).
// • G-Junioren/Bambini (U7): kein Meisterschaftsbetrieb, Spielfeste/Turniere (im Spiel
//   ohne Tabelle in allen Epochen – Annahme auf Grundlage der Fair-Play-Liga-Unterlagen,
//   die Bambini nur mit Spielfesten führen).
// • DFB-Kinderfußball-Reform: dfb.de „Kinderfußball: Irrtümer“ – verbindliche Einführung
//   der neuen Spielformen ab 2024/25 für G-, F- und E-Jugend (G: 2 gegen 2 / 3 gegen 3 auf
//   vier Minitore; F: 3 gegen 3 bis 5 gegen 5; E: 5 gegen 5 oder 7 gegen 7);
//   trainingground.guru „Germany revolutionises foundation age formats“ – Beschluss
//   DFB-Bundestag 11.3.2022 nach zweijähriger Pilotphase, „festivals instead of formal
//   matches and leagues“, Sieger rücken auf ein höheres Feld. Im Spiel: ab 2024/25 für
//   G/F/E keine Tabelle, keine Ergebnisse – nur Spielfeste.
// Vereinfachungen: zwei Spielklassen je Altersklasse (oben/darunter), Auf-/Abstieg
// nur für den eigenen Verein; DDR-Vereine vor 1991 spielen in Bezirks-/Kreisligen.
// =============================================================================
import type { Lv, YcRegion } from './youthCompetitions';

export type YcLowKey = 'u15' | 'u13' | 'u11' | 'u9' | 'u7';
export type YcLowCls = 'C' | 'D' | 'E' | 'F' | 'G';
export const LOW_KEYS: YcLowKey[] = ['u15', 'u13', 'u11', 'u9', 'u7'];
export const LOW_CLS: Record<YcLowKey, YcLowCls> = { u15: 'C', u13: 'D', u11: 'E', u9: 'F', u7: 'G' };
export const isLowKey = (k: string): k is YcLowKey => (LOW_KEYS as string[]).includes(k);

export const LV_NAME: Record<Lv, string> = {
  SH: 'Schleswig-Holstein', HH: 'Hamburg', HB: 'Bremen', NI: 'Niedersachsen', BE: 'Berlin', WF: 'Westfalen',
  NR: 'Niederrhein', MR: 'Mittelrhein', RL: 'Rheinland', SW: 'Südwest', SL: 'Saarland', HE: 'Hessen', BA: 'Baden',
  SB: 'Südbaden', WU: 'Württemberg', BY: 'Bayern', MV: 'Mecklenburg-Vorpommern', BB: 'Brandenburg',
  ST: 'Sachsen-Anhalt', TH: 'Thüringen', SN: 'Sachsen',
};
export const REGION_NAME: Record<YcRegion, string> = { nord: 'Nord', nordost: 'Nordost', west: 'West', suedwest: 'Südwest', sued: 'Süd' };

/** Erste Saison der C-Junioren-Regionalliga je Region (West/Nordost/Südwest: Annahme). */
export const C_RL_FROM: Record<YcRegion, number> = { nord: 2004, west: 2008, nordost: 2008, suedwest: 2008, sued: 2010 };
/** Kinderfußball-Reform: Spielfeste statt Tabellen für G/F/E. */
export const KIFU_REFORM = 2024;
/** Erste Kreisstaffeln der F-Jugend mit Tabelle (Chronik FV Queichheim: 1984). */
export const F_LEAGUE_FROM = 1984;

export interface LowFormat {
  /** 'stf' = Staffel mit Tabelle, 'fest' = Spielfeste ohne Tabelle/Ergebnisse. */
  kind: 'stf' | 'fest';
  /** Name der Spielklasse (ohne Ort). */
  level: string;
  /** Ortszusatz: Region, Landesverband, Bezirk oder Kreis. */
  area: 'region' | 'lv' | 'bezirk' | 'kreis';
  /** Teams der Staffel (eigener Verein inklusive). */
  size: number;
  /** Spieler auf dem Feld. */
  n: number;
  /** Absteiger (nur obere Klasse). */
  down: number;
  /** Spielform (Anzeige). */
  play: string;
  /** Erklärung bei Spielfesten (statt Tabelle). */
  fest?: string;
}

/**
 * Format der Staffel des eigenen Vereins. `level` 0 = obere, 1 = untere Klasse;
 * `ddr` = DDR-Verein vor 1991.
 */
export function lowFormat(key: YcLowKey, y0: number, region: YcRegion, lv: Lv, level: 0 | 1, ddr: boolean): LowFormat {
  const L = (lvl: string, area: LowFormat['area'], size: number, n: number, play: string, down = 3): LowFormat => ({ kind: 'stf', level: lvl, area, size, n, down: level === 0 ? down : 0, play });
  const F = (play: string, fest: string): LowFormat => ({ kind: 'fest', level: 'Spielfeste', area: 'kreis', size: 0, n: key === 'u7' ? 3 : key === 'u9' ? 4 : 6, down: 0, play, fest });
  switch (key) {
    case 'u15': {
      if (ddr) return level === 0 ? L('Bezirksliga', 'bezirk', 12, 11, '11 gegen 11') : L('Kreisliga', 'kreis', 12, 11, '11 gegen 11');
      const rl = y0 >= C_RL_FROM[region];
      const rlSize = region === 'nord' ? (y0 >= 2018 ? 14 : 12) : region === 'sued' ? (y0 >= 2013 ? 14 : 12) : 12;
      const top = lv === 'BY' ? (y0 >= 2005 ? 'Bayernliga' : 'Bezirksoberliga') : 'Verbandsliga';
      if (rl) return level === 0 ? L('C-Junioren-Regionalliga', 'region', rlSize, 11, '11 gegen 11', region === 'nord' ? 4 : 3) : L(top, lv === 'BY' && y0 < 2005 ? 'bezirk' : 'lv', 12, 11, '11 gegen 11');
      return level === 0 ? L(top, lv === 'BY' && y0 < 2005 ? 'bezirk' : 'lv', 12, 11, '11 gegen 11')
        : L(lv === 'BY' ? 'Bezirksliga' : 'Landesliga', 'bezirk', 12, 11, '11 gegen 11');
    }
    case 'u13': {
      const n = y0 >= 2011 ? 9 : 11;
      const play = n === 9 ? '9 gegen 9 (Kleinfeldtore, seit 2011/12)' : '11 gegen 11';
      return level === 0 ? L('Bezirksliga', 'bezirk', 12, n, play) : L('Kreisliga', 'kreis', 12, n, play);
    }
    case 'u11':
      if (y0 >= KIFU_REFORM) return F('5 gegen 5 oder 7 gegen 7 auf Mini- bzw. Kleinfeldtore',
        `Seit der DFB-Kinderfußball-Reform ${KIFU_REFORM}/${String((KIFU_REFORM + 1) % 100).padStart(2, '0')} spielt die E-Jugend in Spielfesten: kleine Teams, viele Ballkontakte, Wechsel nach jedem Tor. Ergebnisse und Tabellen werden nicht festgehalten – wer gewinnt, rückt auf ein stärkeres Feld.`);
      return level === 0 ? L('Kreisliga', 'kreis', 10, 7, '7 gegen 7 (Kleinfeld)') : L('Kreisklasse', 'kreis', 10, 7, '7 gegen 7 (Kleinfeld)');
    case 'u9':
      if (y0 >= KIFU_REFORM) return F('3 gegen 3 auf vier Minitore (Funino), auch 5 gegen 5',
        `Seit der DFB-Kinderfußball-Reform ${KIFU_REFORM}/${String((KIFU_REFORM + 1) % 100).padStart(2, '0')} gibt es in der F-Jugend keine Tabelle mehr: Spielfeste mit 3 gegen 3 auf vier Minitore, ohne Schiedsrichter, alle Kinder spielen gleich viel.`);
      if (y0 < F_LEAGUE_FROM) return F('Freundschaftsspiele und Turniere auf dem Kleinfeld',
        'In den 1970ern gibt es für die F-Jugend noch keinen geregelten Spielbetrieb: Die Kleinsten spielen Freundschaftsspiele und Turniere ohne Tabelle. Erste Kreismeisterschaften kommen Mitte der 1980er auf.');
      return level === 0 ? L('Kreisliga', 'kreis', 8, 7, y0 >= 2010 ? '7 gegen 7, Fair-Play-Liga ohne Schiedsrichter' : '7 gegen 7 (Kleinfeld)')
        : L('Kreisklasse', 'kreis', 8, 7, '7 gegen 7 (Kleinfeld)');
    case 'u7':
      return y0 >= KIFU_REFORM
        ? F('2 gegen 2 oder 3 gegen 3 auf vier Minitore', `Bambini spielen keine Meisterschaft. Seit ${KIFU_REFORM}/${String((KIFU_REFORM + 1) % 100).padStart(2, '0')} verbindlich: Spielfeste mit 2 gegen 2 oder 3 gegen 3 auf vier Minitore, ohne Torwart, ohne Ergebnisse.`)
        : F('Spielfeste und Turniere, meist 5 gegen 5', 'Bambini spielen keine Meisterschaft: Es gibt Spielfeste und Turniere, bei denen jedes Kind spielt. Tabellen werden nicht geführt.');
  }
}

/** Anzeigename der Staffel. */
export function lowLeagueName(f: LowFormat, region: YcRegion, lv: Lv, city: string): string {
  const where = f.area === 'region' ? REGION_NAME[region] : f.area === 'lv' ? LV_NAME[lv] : city;
  return f.kind === 'fest' ? `Spielfeste Kreis ${city}` : `${f.level} ${where}`;
}

/** Titel bei Staffelsieg (Vereins-Historie, Nachrichten). */
export function lowTitle(key: YcLowKey, f: LowFormat): string {
  const cls = LOW_CLS[key];
  if (f.area === 'region') return `${cls}-Junioren-Regionalligameister`;
  if (f.area === 'lv') return f.level === 'Bayernliga' ? `${cls}-Jugend-Bayernliga-Meister` : `${cls}-Jugend-Verbandsmeister`;
  if (f.area === 'bezirk') return `${cls}-Jugend-Bezirksmeister`;
  return `${cls}-Jugend-Kreismeister`;
}

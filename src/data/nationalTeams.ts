// =============================================================================
// NATIONALMANNSCHAFTEN & TURNIERE (Wunsch Pascal, #36) – Stammdaten.
// -----------------------------------------------------------------------------
// • NATIONS: Verband (Kontinent), Bestehen (Teilungen/Vereinigungen) und eine
//   Grundstärke je Jahrzehnt (Stärke einer Startelf auf der Spielskala). Die
//   echte Stärke im Spiel entsteht aus den Spielern der Spielwelt (game/national/);
//   die Grundstärke füllt Lücken, wo Nationalspieler außerhalb der Spielwelt
//   spielen (Südamerika, Afrika, Asien). Werte = grobe Einordnung nach
//   Turnierergebnissen und Weltranglisten-Verläufen, keine Messung.
// • TOURNAMENTS: WM/EM mit Gastgeber, Terminen und Teilnehmerzahl wie historisch
//   (WM 1978–2026, EM 1976–2024; danach fortgeschrieben: WM 2030 Spanien/Portugal/
//   Marokko, 2034 Saudi-Arabien im Winter wie 2022, EM 2028 Britische Inseln, 2032
//   Italien/Türkei, danach Juni/Juli mit gezogenem Gastgeber).
// • Kaderzahl: 22 Spieler bis 2000/01, 23 bis 2020, 26 ab der EM 2021 und WM 2022.
// • Länderspieltermine: bis 1995 einzelne Mittwoche (Sep, Okt, Nov, Mär, Apr), ab
//   1996 Doppel-Fenster (Sa + Mi) im Sep, Okt, Nov und Mär – die Liga pausiert dann
//   meist (das Spiel wählt Wochen ohne eigenes Ligaspiel, sonst den Mittwoch).
// =============================================================================

export type Conf = 'UEFA' | 'CONMEBOL' | 'CAF' | 'AFC' | 'CONCACAF' | 'OFC';

export interface NationDef {
  code: string;
  conf: Conf;
  /** Grundstärke 1975, 1985, 1995, 2005, 2015, 2025 (linear dazwischen). */
  base: [number, number, number, number, number, number];
  /** Besteht ab/bis Jahr (Saisonstart). */
  from?: number;
  to?: number;
  /** Verband wechselt (Australien 2006 zur AFC). */
  confFrom?: [number, Conf];
  /** Gesperrt ab Jahr (Russland 2022). */
  bannedFrom?: number;
}

export const NATIONS: NationDef[] = [
  // Europa
  { code: 'GER', conf: 'UEFA', base: [85, 83, 82, 80, 86, 82] },
  { code: 'GDR', conf: 'UEFA', base: [77, 74, 70, 70, 70, 70], to: 1990 },
  { code: 'ENG', conf: 'UEFA', base: [78, 80, 80, 82, 81, 85] },
  { code: 'SCO', conf: 'UEFA', base: [76, 76, 72, 68, 68, 72] },
  { code: 'WAL', conf: 'UEFA', base: [70, 71, 66, 64, 74, 70] },
  { code: 'NIR', conf: 'UEFA', base: [70, 72, 64, 62, 66, 64] },
  { code: 'IRL', conf: 'UEFA', base: [68, 74, 76, 72, 70, 68] },
  { code: 'NED', conf: 'UEFA', base: [86, 80, 82, 82, 80, 82] },
  { code: 'BEL', conf: 'UEFA', base: [76, 80, 79, 74, 84, 81] },
  { code: 'FRA', conf: 'UEFA', base: [76, 84, 81, 85, 84, 86] },
  { code: 'ESP', conf: 'UEFA', base: [76, 80, 80, 82, 86, 86] },
  { code: 'POR', conf: 'UEFA', base: [70, 74, 78, 82, 82, 84] },
  { code: 'ITA', conf: 'UEFA', base: [83, 83, 83, 84, 80, 80] },
  { code: 'AUT', conf: 'UEFA', base: [74, 72, 68, 66, 74, 78] },
  { code: 'SUI', conf: 'UEFA', base: [66, 68, 74, 76, 79, 78] },
  { code: 'SWE', conf: 'UEFA', base: [75, 72, 78, 76, 72, 76] },
  { code: 'DEN', conf: 'UEFA', base: [72, 81, 79, 76, 74, 78] },
  { code: 'NOR', conf: 'UEFA', base: [60, 64, 76, 70, 68, 75] },
  { code: 'FIN', conf: 'UEFA', base: [60, 62, 64, 66, 66, 66] },
  { code: 'ISL', conf: 'UEFA', base: [56, 60, 62, 64, 74, 68] },
  { code: 'POL', conf: 'UEFA', base: [81, 76, 70, 72, 76, 74] },
  { code: 'HUN', conf: 'UEFA', base: [74, 74, 66, 64, 68, 75] },
  { code: 'TCH', conf: 'UEFA', base: [80, 76, 74, 74, 74, 74], to: 1992 },
  { code: 'CZE', conf: 'UEFA', base: [78, 78, 78, 80, 72, 72], from: 1993 },
  { code: 'SVK', conf: 'UEFA', base: [70, 70, 70, 70, 72, 70], from: 1993 },
  { code: 'YUG', conf: 'UEFA', base: [79, 77, 76, 76, 76, 76], to: 1991 },
  { code: 'SRB', conf: 'UEFA', base: [74, 74, 74, 76, 74, 74], from: 1992 },
  { code: 'CRO', conf: 'UEFA', base: [80, 80, 80, 78, 82, 82], from: 1992 },
  { code: 'SVN', conf: 'UEFA', base: [70, 70, 70, 70, 68, 70], from: 1992 },
  { code: 'BIH', conf: 'UEFA', base: [70, 70, 68, 68, 72, 66], from: 1995 },
  { code: 'MKD', conf: 'UEFA', base: [62, 62, 62, 62, 62, 62], from: 1993 },
  { code: 'URS', conf: 'UEFA', base: [79, 81, 80, 80, 80, 80], to: 1991 },
  { code: 'RUS', conf: 'UEFA', base: [76, 76, 76, 74, 74, 70], from: 1992, bannedFrom: 2022 },
  { code: 'UKR', conf: 'UEFA', base: [72, 72, 72, 76, 76, 76], from: 1992 },
  { code: 'ROU', conf: 'UEFA', base: [72, 74, 78, 70, 72, 72] },
  { code: 'BUL', conf: 'UEFA', base: [70, 72, 76, 68, 64, 62] },
  { code: 'GRE', conf: 'UEFA', base: [66, 66, 66, 74, 72, 70] },
  { code: 'TUR', conf: 'UEFA', base: [64, 66, 72, 76, 74, 78] },
  { code: 'ALB', conf: 'UEFA', base: [56, 58, 60, 62, 66, 66] },
  { code: 'ISR', conf: 'UEFA', base: [62, 64, 66, 68, 64, 64] },
  // Südamerika
  { code: 'BRA', conf: 'CONMEBOL', base: [86, 86, 87, 87, 84, 85] },
  { code: 'ARG', conf: 'CONMEBOL', base: [83, 85, 83, 84, 84, 86] },
  { code: 'URU', conf: 'CONMEBOL', base: [77, 76, 77, 75, 82, 81] },
  { code: 'CHI', conf: 'CONMEBOL', base: [74, 72, 74, 72, 80, 70] },
  { code: 'COL', conf: 'CONMEBOL', base: [68, 74, 80, 76, 82, 82] },
  { code: 'PER', conf: 'CONMEBOL', base: [76, 72, 68, 68, 74, 68] },
  { code: 'PAR', conf: 'CONMEBOL', base: [68, 72, 76, 76, 70, 74] },
  { code: 'ECU', conf: 'CONMEBOL', base: [62, 64, 70, 74, 74, 78] },
  // Nord- und Mittelamerika
  { code: 'MEX', conf: 'CONCACAF', base: [72, 75, 76, 78, 78, 76] },
  { code: 'USA', conf: 'CONCACAF', base: [58, 64, 74, 76, 76, 78] },
  { code: 'CAN', conf: 'CONCACAF', base: [56, 62, 62, 62, 66, 76] },
  { code: 'CRC', conf: 'CONCACAF', base: [60, 66, 68, 70, 76, 70] },
  // Afrika
  { code: 'NGA', conf: 'CAF', base: [64, 70, 80, 78, 76, 76] },
  { code: 'CMR', conf: 'CAF', base: [66, 76, 78, 80, 74, 74] },
  { code: 'GHA', conf: 'CAF', base: [66, 70, 72, 78, 76, 74] },
  { code: 'CIV', conf: 'CAF', base: [60, 64, 70, 80, 78, 78] },
  { code: 'SEN', conf: 'CAF', base: [60, 62, 68, 78, 76, 82] },
  { code: 'MAR', conf: 'CAF', base: [70, 75, 76, 76, 74, 83] },
  { code: 'ALG', conf: 'CAF', base: [70, 75, 66, 70, 76, 76] },
  { code: 'TUN', conf: 'CAF', base: [70, 68, 72, 74, 72, 72] },
  { code: 'EGY', conf: 'CAF', base: [66, 70, 70, 74, 70, 74] },
  { code: 'RSA', conf: 'CAF', base: [56, 58, 72, 70, 68, 70], from: 1992 },
  // Asien und Ozeanien
  { code: 'JPN', conf: 'AFC', base: [56, 60, 70, 74, 76, 81] },
  { code: 'KOR', conf: 'AFC', base: [62, 68, 72, 76, 76, 77] },
  { code: 'IRN', conf: 'AFC', base: [66, 64, 68, 72, 74, 76] },
  { code: 'KSA', conf: 'AFC', base: [60, 66, 72, 70, 68, 70] },
  { code: 'QAT', conf: 'AFC', base: [52, 56, 60, 62, 68, 70] },
  { code: 'CHN', conf: 'AFC', base: [56, 60, 64, 68, 64, 62] },
  { code: 'AUS', conf: 'OFC', base: [62, 62, 70, 76, 74, 74], confFrom: [2006, 'AFC'] },
  { code: 'NZL', conf: 'OFC', base: [58, 60, 60, 62, 64, 64] },
];

export const NATION_BY_CODE: Record<string, NationDef> = Object.fromEntries(NATIONS.map((n) => [n.code, n]));

export function nationExists(n: NationDef, year: number): boolean {
  return (n.from == null || year >= n.from) && (n.to == null || year <= n.to);
}
export const confOf = (n: NationDef, year: number): Conf => (n.confFrom && year >= n.confFrom[0] ? n.confFrom[1] : n.conf);

/** Grundstärke im Jahr (linear zwischen den Stützjahren). */
export function baseStrength(n: NationDef, year: number): number {
  const t = Math.max(0, Math.min(5, (year - 1975) / 10));
  const i = Math.min(4, Math.floor(t));
  return n.base[i] + (n.base[i + 1] - n.base[i]) * (t - i);
}

/** Nachfolger einer zerfallenen Nation (Spieler mit altem Kürzel spielen dort). */
export const SUCCESSOR: Record<string, string> = { URS: 'RUS', YUG: 'SRB', TCH: 'CZE', GDR: 'GER' };

export type TournamentKind = 'WM' | 'EM';
export interface TournamentDef {
  kind: TournamentKind;
  year: number;
  hosts: string[];
  start: string;
  end: string;
  teams: number;
  /** Ort für Texte („in Argentinien“). */
  place: string;
}

export const TOURNAMENTS: TournamentDef[] = [
  { kind: 'EM', year: 1976, hosts: ['YUG'], start: '1976-06-16', end: '1976-06-20', teams: 4, place: 'in Jugoslawien' },
  { kind: 'WM', year: 1978, hosts: ['ARG'], start: '1978-06-01', end: '1978-06-25', teams: 16, place: 'in Argentinien' },
  { kind: 'EM', year: 1980, hosts: ['ITA'], start: '1980-06-11', end: '1980-06-22', teams: 8, place: 'in Italien' },
  { kind: 'WM', year: 1982, hosts: ['ESP'], start: '1982-06-13', end: '1982-07-11', teams: 24, place: 'in Spanien' },
  { kind: 'EM', year: 1984, hosts: ['FRA'], start: '1984-06-12', end: '1984-06-27', teams: 8, place: 'in Frankreich' },
  { kind: 'WM', year: 1986, hosts: ['MEX'], start: '1986-05-31', end: '1986-06-29', teams: 24, place: 'in Mexiko' },
  { kind: 'EM', year: 1988, hosts: ['GER'], start: '1988-06-10', end: '1988-06-25', teams: 8, place: 'in der Bundesrepublik' },
  { kind: 'WM', year: 1990, hosts: ['ITA'], start: '1990-06-08', end: '1990-07-08', teams: 24, place: 'in Italien' },
  { kind: 'EM', year: 1992, hosts: ['SWE'], start: '1992-06-10', end: '1992-06-26', teams: 8, place: 'in Schweden' },
  { kind: 'WM', year: 1994, hosts: ['USA'], start: '1994-06-17', end: '1994-07-17', teams: 24, place: 'in den USA' },
  { kind: 'EM', year: 1996, hosts: ['ENG'], start: '1996-06-08', end: '1996-06-30', teams: 16, place: 'in England' },
  { kind: 'WM', year: 1998, hosts: ['FRA'], start: '1998-06-10', end: '1998-07-12', teams: 32, place: 'in Frankreich' },
  { kind: 'EM', year: 2000, hosts: ['BEL', 'NED'], start: '2000-06-10', end: '2000-07-02', teams: 16, place: 'in Belgien und den Niederlanden' },
  { kind: 'WM', year: 2002, hosts: ['KOR', 'JPN'], start: '2002-05-31', end: '2002-06-30', teams: 32, place: 'in Südkorea und Japan' },
  { kind: 'EM', year: 2004, hosts: ['POR'], start: '2004-06-12', end: '2004-07-04', teams: 16, place: 'in Portugal' },
  { kind: 'WM', year: 2006, hosts: ['GER'], start: '2006-06-09', end: '2006-07-09', teams: 32, place: 'in Deutschland' },
  { kind: 'EM', year: 2008, hosts: ['AUT', 'SUI'], start: '2008-06-07', end: '2008-06-29', teams: 16, place: 'in Österreich und der Schweiz' },
  { kind: 'WM', year: 2010, hosts: ['RSA'], start: '2010-06-11', end: '2010-07-11', teams: 32, place: 'in Südafrika' },
  { kind: 'EM', year: 2012, hosts: ['POL', 'UKR'], start: '2012-06-08', end: '2012-07-01', teams: 16, place: 'in Polen und der Ukraine' },
  { kind: 'WM', year: 2014, hosts: ['BRA'], start: '2014-06-12', end: '2014-07-13', teams: 32, place: 'in Brasilien' },
  { kind: 'EM', year: 2016, hosts: ['FRA'], start: '2016-06-10', end: '2016-07-10', teams: 24, place: 'in Frankreich' },
  { kind: 'WM', year: 2018, hosts: ['RUS'], start: '2018-06-14', end: '2018-07-15', teams: 32, place: 'in Russland' },
  { kind: 'EM', year: 2021, hosts: [], start: '2021-06-11', end: '2021-07-11', teams: 24, place: 'in elf Ländern Europas' },
  { kind: 'WM', year: 2022, hosts: ['QAT'], start: '2022-11-20', end: '2022-12-18', teams: 32, place: 'in Katar' },
  { kind: 'EM', year: 2024, hosts: ['GER'], start: '2024-06-14', end: '2024-07-14', teams: 24, place: 'in Deutschland' },
  { kind: 'WM', year: 2026, hosts: ['USA', 'CAN', 'MEX'], start: '2026-06-11', end: '2026-07-19', teams: 48, place: 'in Nordamerika' },
  { kind: 'EM', year: 2028, hosts: ['ENG', 'SCO', 'WAL', 'IRL', 'NIR'], start: '2028-06-09', end: '2028-07-09', teams: 24, place: 'auf den Britischen Inseln' },
  { kind: 'WM', year: 2030, hosts: ['ESP', 'POR', 'MAR'], start: '2030-06-13', end: '2030-07-21', teams: 48, place: 'in Spanien, Portugal und Marokko' },
  { kind: 'EM', year: 2032, hosts: ['ITA', 'TUR'], start: '2032-06-11', end: '2032-07-11', teams: 24, place: 'in Italien und der Türkei' },
  { kind: 'WM', year: 2034, hosts: ['KSA'], start: '2034-11-17', end: '2034-12-17', teams: 48, place: 'in Saudi-Arabien' },
];

/** Turnier eines Jahres (fortgeschrieben ab 2035: EM in Jahren ≡ 0 mod 4, WM ≡ 2 mod 4). */
export function tournamentsOfYear(year: number, hostPick: (kind: TournamentKind, year: number) => string): TournamentDef[] {
  const known = TOURNAMENTS.filter((t) => t.year === year);
  if (year <= 2034) return known;
  if (year % 4 === 0) return [{ kind: 'EM', year, hosts: [hostPick('EM', year)], start: `${year}-06-12`, end: `${year}-07-12`, teams: 24, place: '' }];
  if (year % 4 === 2) return [{ kind: 'WM', year, hosts: [hostPick('WM', year)], start: `${year}-06-11`, end: `${year}-07-19`, teams: 48, place: '' }];
  return [];
}

export const squadSizeOf = (year: number) => (year < 2001 ? 22 : year < 2021 ? 23 : 26);

/** Plätze je Verband bei der WM (Gastgeber zusätzlich, Rest = beste Übrige). */
export function wmQuota(teams: number): Partial<Record<Conf, number>> {
  if (teams <= 16) return { UEFA: 9, CONMEBOL: 3, CAF: 1, AFC: 1, CONCACAF: 1 };
  if (teams <= 24) return { UEFA: 13, CONMEBOL: 4, CAF: 2, AFC: 2, CONCACAF: 2 };
  if (teams <= 32) return { UEFA: 13, CONMEBOL: 5, CAF: 5, AFC: 4, CONCACAF: 3, OFC: 0 };
  return { UEFA: 16, CONMEBOL: 6, CAF: 9, AFC: 8, CONCACAF: 3, OFC: 1 };
}

/** Länderspieltermine einer Saison (Startjahr y0): [Monat, Tag-Untergrenze] je Fenster + Anzahl Spiele. */
export function intlWindowPlan(y0: number): { month: number; year: number; from: number; games: number }[] {
  const y1 = y0 + 1;
  if (y0 < 1996) return [
    { month: 9, year: y0, from: 5, games: 1 }, { month: 10, year: y0, from: 8, games: 1 }, { month: 11, year: y0, from: 8, games: 1 },
    { month: 3, year: y1, from: 20, games: 1 }, { month: 4, year: y1, from: 15, games: 1 },
  ];
  return [
    { month: 9, year: y0, from: 1, games: 2 }, { month: 10, year: y0, from: 5, games: 2 }, { month: 11, year: y0, from: 8, games: 2 },
    { month: 3, year: y1, from: 18, games: 2 },
  ];
}

/** Bezeichnung eines Länderspiels im Jahr (Qualifikation für das nächste Turnier, ab 2018 Nations League im Herbst). */
export function intlMatchLabel(date: string, nextKind: TournamentKind | null): string {
  const y = parseInt(date.slice(0, 4), 10), m = parseInt(date.slice(5, 7), 10);
  if (y >= 2018 && m >= 9 && m <= 11 && y % 2 === 0) return 'Nations League';
  if (nextKind) return `${nextKind}-Qualifikation`;
  return 'Freundschaftsspiel';
}

// =============================================================================
// WINTERPAUSE – historische Lage je Saison (Bundesliga/West und DDR-Oberliga)
// sowie Rahmen der Saison (erster/letzter Spieltag). Der Spielplan-Generator
// (engine/winterBreak.ts → engine/league.ts) legt die Spieltage danach.
//
// Angegeben ist jeweils der Hauptspieltag (Samstag; Freitag/Sonntag auf den
// Samstag gezogen) des LETZTEN Spieltags vor und des ERSTEN Spieltags nach der
// Pause; bei Wochenspieltagen das echte Datum (z. B. Mi 20.12.2023).
// Nachholspiele (Schnee, Nebel) sind nicht berücksichtigt.
//
// Quellen (Recherche Oktober 2026):
//  [DC]  DFB-Datencenter, Saison-Spielpläne einzelner Vereine
//        (datencenter.dfb.de/en/competitions/bundesliga/seasons/<saison>/teams/…):
//        1975/76, 1976/77, 1980/81, 1983/84, 1985/86, 1986/87, 1989/90, 1990/91,
//        1991/92, 1993/94 (Leverkusen), 1996/97, 1998/99 (Bayern, Nürnberg),
//        1999/2000 (Bayern, Leverkusen), 2001/02, 2005/06.
//  [RS]  RSSSF „Germany <saison>“ (rsssf.org/tablesd/duitNN.html), Spieltage mit
//        Datum: 1977/78, 1978/79, 1981/82, 1982/83, 1984/85, 1986/87, 1987/88,
//        1988/89, 1994/95, 1995/96, 1997/98, 1998/99, 2002/03, 2003/04, 2006/07,
//        2007/08, 2009/10, 2014/15, 2017/18, 2019/20, 2020/21, 2021/22, 2022/23,
//        2023/24, 2024/25. DDR-Oberliga (ddrNN.html): 1978/79, 1981/82, 1985/86,
//        1987/88 (je 26 Spieltage, Pause nach dem 13.).
//  [BL]  bundesliga.com, „Bundesliga winter break explained“ (2015/16–2017/18) und
//        „When is the winter break?“ (2025/26: Wiederbeginn Fr 9.1.2026).
//  [SA]  Soccer America, „Bundesliga break isn't what it used to be“ (01/2017):
//        Ende der 80er elf Wochen, 2014/15 sechs Wochen, 2016/17 gut vier Wochen.
//  [FS]  flashscore.de, „Bundesliga-Start 2026 wegen WM erst am 28. August, nur 14
//        Spiele vor Winterpause“: 2026/27 Pause ab 21.12.2026, Wiederbeginn 8.1.2027,
//        letzter Spieltag 22.5.2027; 2. Liga ab 7.8.2026.
//  [S1]  sport1.de (siehe data/indoorHistory.ts): Winterpause seit 1986/87 elf Wochen,
//        später auf sechs Wochen verkürzt – deckt sich mit den Spielplänen oben
//        (1986/87–1996/97 9–11 Wochen, ab 1997/98 meist 6 Wochen; Ausreißer 1998/99).
//
// Bewusst NICHT nachgebaut: Corona-Unterbrechung 2019/20 (März–Mai) und die wegen
// des späten Corona-Starts (18.9.2020) auf zwei Wochen gestauchte Pause 2020/21 –
// 2020/21 wird wie die Nachbarjahre interpoliert.
// Jahre ohne Beleg: lineare Interpolation zwischen den nächsten belegten Jahren
// DERSELBEN Epoche (Grenzen 1986, 1997, 2009, 2020), auf Samstage gerundet.
// Ab 2027/28: Fortschreibung der Gegenwart (Pause ~20.12. bis ~10.1., 3 Wochen).
// =============================================================================

export type BreakBasis = 'beleg' | 'interpoliert' | 'fortschreibung' | 'annahme';
export type LeagueKind = 'west' | 'ddr';

export interface WinterBreakRow {
  /** Startjahr der Saison (1986 = 1986/87). */
  y0: number;
  /** Letzter Spieltag vor der Pause (ISO). */
  last: string;
  /** Erster Spieltag nach der Pause (ISO). */
  first: string;
  /** Spieltage vor der Pause (Bundesliga-Zählung), falls nicht die Hinrunde. */
  before?: number;
  /** Abweichender erster Spieltag der Saison (ISO). */
  start?: string;
  /** Abweichender letzter Spieltag der Saison (ISO). */
  end?: string;
  /** Sonderfall (WM im Winter): nicht für die Interpolation verwenden. */
  special?: boolean;
  src: string;
}

/** Bundesliga (gilt für alle West-Ligen). */
export const WEST_BREAKS: WinterBreakRow[] = [
  { y0: 1975, last: '1975-12-06', first: '1976-01-17', src: 'DC' },
  { y0: 1976, last: '1976-12-11', first: '1977-01-15', src: 'DC' },
  { y0: 1977, last: '1977-12-17', first: '1978-01-07', before: 19, src: 'RS (WM 1978: Saisonende 29.4.)' },
  { y0: 1978, last: '1978-12-16', first: '1979-01-13', before: 18, src: 'RS (Schneewinter, Nachholspiele bis 30.12.)' },
  { y0: 1979, last: '1979-12-15', first: '1980-01-19', src: 'RS' },
  { y0: 1980, last: '1980-12-13', first: '1981-01-17', src: 'DC' },
  { y0: 1981, last: '1981-12-19', first: '1982-01-16', end: '1982-05-29', src: 'RS (WM 1982 erst ab 13.6.)' },
  { y0: 1982, last: '1982-12-11', first: '1983-01-22', src: 'RS' },
  { y0: 1983, last: '1983-12-10', first: '1984-01-21', src: 'DC' },
  { y0: 1984, last: '1984-12-08', first: '1985-02-02', src: 'RS' },
  { y0: 1985, last: '1985-12-14', first: '1986-01-25', before: 19, src: 'DC (WM 1986: Saisonende 26.4.)' },
  { y0: 1986, last: '1986-12-06', first: '1987-02-21', src: 'DC, RS, S1 (elf Wochen)' },
  { y0: 1987, last: '1987-12-05', first: '1988-02-20', before: 19, src: 'RS' },
  { y0: 1988, last: '1988-12-03', first: '1989-02-18', src: 'RS' },
  { y0: 1989, last: '1989-12-16', first: '1990-02-24', before: 21, src: 'DC' },
  { y0: 1990, last: '1990-12-15', first: '1991-02-23', src: 'DC' },
  { y0: 1991, last: '1991-12-14', first: '1992-02-08', before: 22, src: 'DC (20 Vereine, 38 Spieltage)' },
  { y0: 1993, last: '1993-12-11', first: '1994-02-12', before: 20, src: 'DC' },
  { y0: 1994, last: '1994-12-10', first: '1995-02-18', src: 'RS' },
  { y0: 1995, last: '1995-12-09', first: '1996-02-10', src: 'RS' },
  { y0: 1996, last: '1996-12-07', first: '1997-02-15', src: 'DC' },
  { y0: 1997, last: '1997-12-20', first: '1998-01-31', before: 20, src: 'RS (Pause auf sechs Wochen verkürzt)' },
  { y0: 1998, last: '1998-12-19', first: '1999-02-20', before: 18, src: 'DC, RS' },
  { y0: 1999, last: '1999-12-18', first: '2000-02-05', src: 'DC' },
  { y0: 2001, last: '2001-12-18', first: '2002-01-26', src: 'DC (Wochenspieltag vor der Pause)' },
  { y0: 2002, last: '2002-12-14', first: '2003-01-25', src: 'RS' },
  { y0: 2003, last: '2003-12-17', first: '2004-01-31', src: 'RS (Wochenspieltag)' },
  { y0: 2005, last: '2005-12-17', first: '2006-01-28', src: 'DC' },
  { y0: 2006, last: '2006-12-16', first: '2007-01-27', src: 'RS' },
  { y0: 2007, last: '2007-12-15', first: '2008-02-02', src: 'RS' },
  { y0: 2009, last: '2009-12-19', first: '2010-01-16', src: 'RS' },
  { y0: 2014, last: '2014-12-20', first: '2015-01-31', src: 'RS, SA (sechs Wochen)' },
  { y0: 2015, last: '2015-12-19', first: '2016-01-23', src: 'BL' },
  { y0: 2016, last: '2016-12-21', first: '2017-01-21', before: 16, src: 'BL, SA' },
  { y0: 2017, last: '2017-12-16', first: '2018-01-13', src: 'RS, BL' },
  { y0: 2019, last: '2019-12-21', first: '2020-01-18', src: 'RS' },
  { y0: 2021, last: '2021-12-18', first: '2022-01-08', src: 'RS' },
  { y0: 2022, last: '2022-11-12', first: '2023-01-21', before: 15, start: '2022-08-06', special: true, src: 'RS (WM in Katar 20.11.–18.12.2022)' },
  { y0: 2023, last: '2023-12-20', first: '2024-01-13', before: 16, src: 'RS' },
  { y0: 2024, last: '2024-12-21', first: '2025-01-11', before: 15, src: 'RS' },
  { y0: 2025, last: '2025-12-20', first: '2026-01-10', before: 15, src: 'BL' },
  { y0: 2026, last: '2026-12-19', first: '2027-01-09', before: 14, start: '2026-08-29', end: '2027-05-22', src: 'FS (WM 2026 im Sommer: später Start)' },
  // Annahme: WM 2034 in Saudi-Arabien im Winter, Liga-Pause wie 2022/23.
  { y0: 2034, last: '2034-11-11', first: '2035-01-20', before: 15, start: '2034-08-05', special: true, src: 'Annahme (WM 2034 im Winter)' },
];

/** DDR-Oberliga (14 Vereine, 26 Spieltage; gilt auch für die DDR-Liga). */
export const DDR_BREAKS: WinterBreakRow[] = [
  { y0: 1978, last: '1978-12-16', first: '1979-02-17', src: 'RS ddr79' },
  { y0: 1981, last: '1981-12-19', first: '1982-02-20', src: 'RS ddr82' },
  { y0: 1985, last: '1985-12-14', first: '1986-02-22', src: 'RS ddr86' },
  { y0: 1987, last: '1987-12-12', first: '1988-02-27', src: 'RS ddr88' },
];

/** Epochengrenzen der West-Interpolation (Startjahr, ab dem eine neue Regel gilt). */
const WEST_ERAS = [1975, 1986, 1997, 2009, 2020];

export interface WinterBreak {
  last: string;
  first: string;
  before?: number;
  basis: BreakBasis;
  src: string;
}

// -----------------------------------------------------------------------------
// Datumshelfer (UTC)
// -----------------------------------------------------------------------------
const DAY = 86_400_000;
const ms = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
export function addDaysIso(d: string, n: number): string { return iso(ms(d) + n * DAY); }
export function weekday(d: string): number { return new Date(ms(d)).getUTCDay(); }
/** Nächster Samstag (inkl.) ab einem Datum. */
export function saturdayOnOrAfter(d: string): string { return addDaysIso(d, (6 - weekday(d) + 7) % 7); }
/** Letzter Samstag (inkl.) bis zu einem Datum. */
export function saturdayOnOrBefore(d: string): string { return addDaysIso(d, -((weekday(d) + 1) % 7)); }
/** Samstag, der einem Datum am nächsten liegt. */
export function nearestSaturday(d: string): string {
  const a = saturdayOnOrBefore(d), b = saturdayOnOrAfter(d);
  return ms(d) - ms(a) <= ms(b) - ms(d) ? a : b;
}

/** Tage von einem Ankerdatum (für Interpolation). */
const off = (d: string, anchor: string) => Math.round((ms(d) - ms(anchor)) / DAY);

function eraOf(y0: number): number {
  let e = WEST_ERAS[0];
  for (const s of WEST_ERAS) if (y0 >= s) e = s;
  return e;
}

function interpolate(rows: WinterBreakRow[], y0: number, sameEra: (a: number, b: number) => boolean): { last: string; first: string } | null {
  const pool = rows.filter((r) => !r.special && sameEra(r.y0, y0));
  const prev = [...pool].reverse().find((r) => r.y0 < y0);
  const next = pool.find((r) => r.y0 > y0);
  if (!prev && !next) return null;
  const lastOff = (r: WinterBreakRow) => off(r.last, `${r.y0}-12-01`);
  const firstOff = (r: WinterBreakRow) => off(r.first, `${r.y0 + 1}-01-01`);
  const mix = (f: (r: WinterBreakRow) => number) => {
    if (prev && next) return f(prev) + (f(next) - f(prev)) * (y0 - prev.y0) / (next.y0 - prev.y0);
    return f((prev ?? next)!);
  };
  return {
    last: nearestSaturday(addDaysIso(`${y0}-12-01`, Math.round(mix(lastOff)))),
    first: nearestSaturday(addDaysIso(`${y0 + 1}-01-01`, Math.round(mix(firstOff)))),
  };
}

/** Winterpause einer Saison (Startjahr) für West- oder DDR-Ligen. */
export function winterBreakFor(y0: number, kind: LeagueKind = 'west'): WinterBreak {
  const rows = kind === 'ddr' ? DDR_BREAKS : WEST_BREAKS;
  const hit = rows.find((r) => r.y0 === y0);
  if (hit) {
    return { last: hit.last, first: hit.first, before: hit.before, basis: hit.src.startsWith('Annahme') ? 'annahme' : 'beleg', src: hit.src };
  }
  if (kind === 'ddr') {
    // Regel aus den vier Belegen: Pause nach Mitte Dezember bis Ende Februar (9–11 Wochen).
    const ip = interpolate(rows, y0, () => true)!;
    return { ...ip, basis: 'interpoliert', src: 'Interpolation DDR-Belege' };
  }
  const lastKnown = WEST_BREAKS.filter((r) => !r.special).reduce((m, r) => Math.max(m, r.y0), 0);
  if (y0 > lastKnown) {
    // Fortschreibung der Gegenwart: so nah wie möglich an Weihnachten, Wiederbeginn
    // am zweiten Januar-Wochenende (wie 2021/22–2026/27).
    return {
      last: nearestSaturday(`${y0}-12-20`), first: nearestSaturday(`${y0 + 1}-01-10`),
      basis: 'fortschreibung', src: 'Fortschreibung 2021–2026',
    };
  }
  const ip = interpolate(rows, y0, (a, b) => eraOf(a) === eraOf(b));
  if (ip) return { ...ip, basis: 'interpoliert', src: `Interpolation Epoche ab ${eraOf(y0)}` };
  return { last: nearestSaturday(`${y0}-12-13`), first: nearestSaturday(`${y0 + 1}-01-17`), basis: 'interpoliert', src: 'Grundregel' };
}

// -----------------------------------------------------------------------------
// Saisonrahmen: erster und letzter Spieltag
// -----------------------------------------------------------------------------
/** Große Turniere im Sommer des Saison-Endjahres (WM/EM) ziehen das Saisonende vor. */
function summerTournament(y1: number): 'wm' | 'em' | null {
  if (y1 === 2022 || y1 === 2034) return null;          // WM im Winter
  if (y1 >= 1978 && y1 % 4 === 2) return 'wm';
  if (y1 === 2021) return 'em';                          // EURO 2020, verschoben
  if (y1 >= 1980 && y1 % 4 === 0 && y1 !== 2020) return 'em';
  return null;
}

/**
 * Erster Spieltag. Bundesliga: Anfang August (1975: 9.8., 1986: 9.8., 1993: 7.8.),
 * ab 2009 Mitte/Ende August (2014: 22.8., 2024: 23.8.). 2. Liga eine bzw. ab 2009
 * zwei Wochen früher. DDR-Oberliga: Mitte August (1981: 22.8., 1985: 17.8., 1987: 8.8.).
 */
export function seasonFirstDay(y0: number, tier: number, kind: LeagueKind): string {
  if (kind === 'ddr') return saturdayOnOrAfter(`${y0}-08-12`);
  const row = WEST_BREAKS.find((r) => r.y0 === y0);
  const bl = row?.start ?? (y0 < 2009 ? saturdayOnOrAfter(`${y0}-08-06`) : saturdayOnOrAfter(`${y0}-08-13`));
  if (tier <= 1) return bl;
  if (y0 === 2026) return '2026-08-08';                   // [FS] 2. Liga ab 7.8.2026
  return addDaysIso(bl, y0 < 2009 ? -7 : -14);
}

/**
 * Letzter Spieltag (spätester Samstag). Ohne Turnier: bis 1991 Mitte Juni (1976: 12.6.,
 * 1981: 13.6., 1991: 15.6.), bis 1999 Ende Mai/Anfang Juni, danach Mitte/Ende Mai.
 * WM-Jahre: Mitte Mai oder früher (1986: 26.4., 1990: 12.5., 2006: 13.5.); EM-Jahre: Ende Mai.
 * DDR: Ende Mai (1986: 24.5., 1988: 28.5.).
 */
export function seasonLastDay(y0: number, kind: LeagueKind): string {
  const y1 = y0 + 1;
  if (kind === 'ddr') return saturdayOnOrBefore(`${y1}-05-31`);
  const row = WEST_BREAKS.find((r) => r.y0 === y0);
  if (row?.end) return row.end;
  const t = summerTournament(y1);
  if (t === 'wm') return saturdayOnOrBefore(y1 <= 1986 ? `${y1}-05-03` : `${y1}-05-14`);
  if (t === 'em') return saturdayOnOrBefore(y1 <= 1991 ? `${y1}-05-31` : `${y1}-05-21`);
  if (y1 <= 1991) return saturdayOnOrBefore(`${y1}-06-14`);
  if (y1 <= 1999) return saturdayOnOrBefore(`${y1}-06-01`);
  return saturdayOnOrBefore(`${y1}-05-23`);
}

/** Spieltage der Bundesliga in einer Saison (für das Umrechnen von `before`). */
export function bundesligaRounds(y0: number): number {
  return y0 === 1991 ? 38 : 34;
}

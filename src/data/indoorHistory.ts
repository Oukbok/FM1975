// =============================================================================
// HALLENFUSSBALL – historische Stammdaten (Einladungsturniere, DFB-Hallenpokal /
// Hallen-Masters, Ende). Spielablauf in game/indoorGame.ts, Simulation in
// engine/indoor.ts.
//
// Quellen (Stand der Recherche Oktober 2026):
//  [S1] sport1.de, „Das Hallenmasters wurde bis 2001 vom DFB ausgerichtet“ (01/2021):
//       Beschluss der Lizenzvereine 32:2 (1987), Winterpause seit 1986/87 elf Wochen,
//       18 Qualifikationsturniere 1988, Tabelle nach Durchschnittspunkten, 10 Bundesligisten
//       verzichteten 1988 trotz Qualifikation, VfL Osnabrück mit nur einem Turnier qualifiziert,
//       1998 Reduktion von 16 auf vier Turniere, Winterpause 1998 auf sechs Wochen verkürzt,
//       Preisgelder (1988 40.000 DM Sieger / 5.000 DM Fünfter, 1989 120.000 DM Sieger),
//       Startgeld 1994 50.000 DM, 1996 200.000 DM, 1997 350.000 DM, Zuschauer/Umsatz,
//       TV (1988 ARD-Dritte, 1994 Premiere, 1995 DSF/RTL, 1996 ARD/DSF, 2000 DSF/SAT.1),
//       Verletzungen 1989 (Strehmel Beinbruch, van Breukelen Kreuzbandriss, ~20 Profis fehlten
//       zum Rückrundenstart), Gründe für das Ende (Topklubs schicken zweite Garnitur,
//       kürzere Winterpause, Hitzfeld: „nicht mehr zeitgemäß“), letzte Austragung 2001.
//  [S2] RSSSF, „Germany – List of Masters Finals (DFB Hallenpokal)“: alle Endspiele 1987–2001
//       mit Ort (1987 inoffiziell in Stuttgart).
//  [S3] en.wikipedia.org/wiki/DFB-Hallenpokal: Fünf gegen fünf (plus Torwart), Endrunde als
//       letzte Stufe mehrerer Qualifikationsturniere, Teilnehmer aus 1./2. Bundesliga sowie
//       Amateur- und Auslandsvereine; Ende nach Verkürzung der Winterpause.
//  [S4] taz, „Warum schickst du mich in die Halle“ (15.01.2001): Hallenphase 2001 nur noch
//       eine Woche, Masters über zwei Tage in Dortmund, Zeitstrafe (zwei Minuten) gegen Torwart.
//  [S5] web.de, „Hallenturniere: Fußballunterhaltung mit Fannähe“: Regionalturniere liefen
//       nach 2001 noch einige Jahre weiter, dann verschwanden sie; Bänderrisse als Absagegrund.
//  [S6] the-berliner.com, „Hall and OAPs“ (01/2011): Hallenfußball füllte von Mitte der 1970er
//       bis Ende der 1980er die Hallen (Vorläufer ohne Masters).
//  [S7] schwaebische.de, „Spielt lieber endlich wieder in der Halle“: Hallenturniere mit Stars
//       in Dortmund, Stuttgart, München, Frankfurt und Berlin („Budenzauber“).
// Annahmen sind im Code als „Annahme“ markiert.
// =============================================================================

/** Abschnitte der Hallengeschichte (Winter = Jahr des Januars, z. B. 1991 = Saison 1990/91). */
export type IndoorPhase = 'invitational' | 'masters' | 'regional' | 'none';

/** Erster Winter im Spiel (Saison 1975/76). Hallenturniere gab es da schon [S6]. */
export const INDOOR_FIRST_WINTER = 1976;
/** Erste offizielle Endrunde des DFB-Hallenpokals (Januar 1988, Frankfurt) [S1][S2]. */
export const MASTERS_FIRST_WINTER = 1988;
/** Letzte Endrunde (Januar 2001, Dortmund) [S1][S2]. */
export const MASTERS_LAST_WINTER = 2001;
/**
 * Letzter Winter mit Profi-Hallenturnieren überhaupt. Nach 2001 liefen Regionalturniere
 * „noch einige Jahre“ weiter [S5] – Annahme: bis Winter 2003/04.
 */
export const INDOOR_LAST_WINTER = 2004;

/** Januar-Jahr eines Saison-Labels („1990/91“ → 1991). */
export function winterYearOf(season: string): number {
  return parseInt(season.slice(0, 4), 10) + 1;
}

export function indoorPhase(winterYear: number): IndoorPhase {
  if (winterYear < INDOOR_FIRST_WINTER || winterYear > INDOOR_LAST_WINTER) return 'none';
  if (winterYear < MASTERS_FIRST_WINTER) return 'invitational';
  if (winterYear <= MASTERS_LAST_WINTER) return 'masters';
  return 'regional';
}

/** Hallenorte. Städte aus [S7] (70er/80er), Endrunden-Orte aus [S2], Leipzig 1995 aus [S1], Oldenburg/Riesa aus [S5]. */
export interface IndoorVenue { city: string; hall: string; capacity: number; from?: number; until?: number }
export const INDOOR_VENUES: IndoorVenue[] = [
  { city: 'Dortmund', hall: 'Westfalenhalle', capacity: 10000 },
  { city: 'Berlin', hall: 'Deutschlandhalle', capacity: 9000 },
  { city: 'Stuttgart', hall: 'Hanns-Martin-Schleyer-Halle', capacity: 9000, from: 1984 },
  { city: 'Stuttgart', hall: 'Killesberghalle', capacity: 5000, until: 1983 },
  { city: 'München', hall: 'Olympiahalle', capacity: 10000 },
  { city: 'Frankfurt', hall: 'Festhalle', capacity: 7850 },
  { city: 'Leipzig', hall: 'Messehalle', capacity: 6000, from: 1991 },
  { city: 'Oldenburg', hall: 'Weser-Ems-Halle', capacity: 5000, from: 1988 },
  { city: 'Riesa', hall: 'Mehrzweckhalle', capacity: 5000, from: 1996 },
];

export function venuesFor(winterYear: number): IndoorVenue[] {
  return INDOOR_VENUES.filter((v) => (v.from ?? 0) <= winterYear && (v.until ?? 9999) >= winterYear);
}

/** Reale Endrunden [S2] (Sieger, Finale, Ort). 1987 inoffiziell. */
export interface RealMasters { year: number; winner: string; score: string; runnerUp: string; city: string; note?: string }
export const REAL_MASTERS: RealMasters[] = [
  { year: 1987, winner: 'Hamburger SV', score: '3:1', runnerUp: 'VfB Stuttgart', city: 'Stuttgart', note: 'inoffiziell' },
  { year: 1988, winner: 'Bayer 05 Uerdingen', score: '5:3', runnerUp: 'Eintracht Frankfurt', city: 'Frankfurt' },
  { year: 1989, winner: 'Werder Bremen', score: '6:3', runnerUp: 'VfB Stuttgart', city: 'Dortmund' },
  { year: 1990, winner: 'Borussia Dortmund', score: '5:3', runnerUp: 'Bayer 05 Uerdingen', city: 'Dortmund' },
  { year: 1991, winner: 'Borussia Dortmund', score: '4:4 i. E.', runnerUp: 'Werder Bremen', city: 'Dortmund' },
  { year: 1992, winner: 'Borussia Dortmund', score: '2:1', runnerUp: 'VfL Bochum', city: 'München' },
  { year: 1993, winner: '1. FC Köln', score: '2:1', runnerUp: 'VfB Stuttgart', city: 'München' },
  { year: 1994, winner: 'Bayer 04 Leverkusen', score: '5:1', runnerUp: '1. FC Köln', city: 'Dortmund' },
  { year: 1995, winner: 'Karlsruher SC', score: '6:3', runnerUp: 'Bayer 04 Leverkusen', city: 'München' },
  { year: 1996, winner: 'TSV 1860 München', score: '6:3', runnerUp: 'Hamburger SV', city: 'Dortmund' },
  { year: 1997, winner: '1. FC Kaiserslautern', score: '3:1', runnerUp: 'FC Bayern München', city: 'München' },
  { year: 1998, winner: 'Hansa Rostock', score: '4:3', runnerUp: 'FC Schalke 04', city: 'München' },
  { year: 1999, winner: 'Borussia Dortmund', score: '2:1', runnerUp: 'VfL Wolfsburg', city: 'Dortmund' },
  { year: 2000, winner: 'SpVgg Greuther Fürth', score: '2:0 (gew.)', runnerUp: 'Borussia Mönchengladbach', city: 'München', note: 'Titel nach Dopingfall am grünen Tisch' },
  { year: 2001, winner: 'SpVgg Unterhaching', score: '6:5 i. E.', runnerUp: 'Werder Bremen', city: 'Dortmund' },
];

/** Endrunden-Ort im Spiel = realer Ort des Jahres [S2]; Halle nach Stadt. */
export function mastersVenue(winterYear: number): IndoorVenue {
  const city = REAL_MASTERS.find((m) => m.year === winterYear)?.city ?? 'Dortmund';
  return INDOOR_VENUES.find((v) => v.city === city) ?? INDOOR_VENUES[0];
}

/** Anzahl der Turniere eines Winters. */
export function tournamentCount(winterYear: number): number {
  const ph = indoorPhase(winterYear);
  if (ph === 'invitational') return winterYear < 1981 ? 3 : 4; // Annahme: wenige Einladungsturniere je Winter
  if (ph === 'masters') {
    if (winterYear === 1988) return 18; // [S1]
    return winterYear >= 1998 ? 4 : 16;  // [S1] 1998 von 16 auf vier reduziert
  }
  if (ph === 'regional') return winterYear <= 2002 ? 3 : 2; // Annahme: auslaufend [S5]
  return 0;
}

/** Teilnehmer je Qualifikations-/Einladungsturnier (Annahme: 6, zwei Dreiergruppen + Halbfinale). */
export const TEAMS_PER_TOURNAMENT = 6;
/** Teilnehmer der Endrunde (Annahme: 8, zwei Vierergruppen + Halbfinale; passt zum „Fünften“ 1988 [S1]). */
export const MASTERS_TEAMS = 8;

/**
 * Geld (nominal, DM) der Endrunde je Platzgruppe [S1]; nicht belegte Stufen = Annahme,
 * proportional zum belegten Siegerpreis.
 */
export interface MastersMoney { start: number; winner: number; runnerUp: number; semi: number; group: number }
export function mastersMoney(winterYear: number): MastersMoney {
  if (winterYear <= 1988) return { start: 0, winner: 40000, runnerUp: 25000, semi: 12000, group: 5000 };
  const start = winterYear >= 1997 ? 350000 : winterYear >= 1996 ? 200000 : winterYear >= 1994 ? 50000 : 0;
  return { start, winner: 120000, runnerUp: 70000, semi: 40000, group: 15000 };
}

/**
 * Antrittsgeld eines Einladungs-/Qualifikationsturniers in **1975-Basis** (Annahme;
 * Topklubs bekamen mehr als Zweitligisten). Buchung × economyScale.
 */
export function tournamentFeeBase(reputation: number): number {
  return reputation >= 80 ? 9000 : reputation >= 65 ? 6000 : 3500;
}
/** Siegprämie eines Einzelturniers in 1975-Basis (Annahme). */
export const TOURNAMENT_WIN_BASE = 6000;

/** Fernsehen der Endrunde [S1]. */
export function mastersTv(winterYear: number): string {
  if (winterYear <= 1988) return 'ARD-Dritte ab dem Halbfinale';
  if (winterYear <= 1993) return 'ARD-Dritte / Sportschau';
  if (winterYear === 1994) return 'nur Bezahlfernsehen (Premiere)';
  if (winterYear === 1995) return 'DSF und RTL';
  if (winterYear <= 1999) return 'ARD und DSF';
  return 'DSF und SAT.1 (bis 3 Mio. Zuschauer)';
}

/** Spielzeiten (Annahme): Gruppenspiele 12 Minuten, Halbfinale/Finale 2 × 10 Minuten. */
export const INDOOR_MINUTES = { group: 12, knockout: 20 };

/**
 * Bereitschaft der Spitzenvereine, mit Stammkräften anzutreten (0–1). Spiegelt die
 * Entwicklung: Begeisterung in den 70ern/80ern [S6], 1988 zehn Verzichte [S1],
 * ab Mitte der 90er zunehmend zweite und dritte Garnitur [S1][S5].
 */
export function topClubEnthusiasm(winterYear: number): number {
  if (winterYear < 1988) return 0.85;
  if (winterYear < 1994) return 0.6;
  if (winterYear < 1998) return 0.4;
  return 0.2;
}

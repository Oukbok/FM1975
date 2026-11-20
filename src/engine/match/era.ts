// =============================================================================
// Epochen-Regeln der Spiel-Engine: was sich im Fußball über die Jahrzehnte
// ändert (Torflut, Heimvorteil, Karten, Wechsel, Statistiken im Fernsehen).
// Startwerte zum Ausbalancieren – gemessen mit `npm run sim`.
// =============================================================================

export interface EraRules {
  year: number;
  /** Multiplikator auf die Chancenqualität (steuert den Torschnitt). */
  goalFactor: number;
  /** Bedrohungs-Multiplikator für die Heimmannschaft. */
  homeAdvantage: number;
  /** Gelbe Karten pro Foul (Wahrscheinlichkeit). */
  yellowPerFoul: number;
  /** Faktor auf die Fouls im Spielaufbau (Zählweise/Spielweise der Epoche). */
  foulRate: number;
  /** Rote Karten (direkt) pro Foul. */
  redPerFoul: number;
  /** Erlaubte Auswechslungen. */
  maxSubs: number;
  /** Plätze auf der Ersatzbank. */
  benchSize: number;
  /** Videobeweis aktiv (Tor-Überprüfungen als Spannungsmoment). */
  var: boolean;
  /** Rückpassregel (Torwart darf Rückpässe nicht aufnehmen). */
  backPassRule: boolean;
  /** Gelb-Rote Karte (ab 1991/92); vorher bleibt es bei der zweiten Gelben ohne Platzverweis. */
  yellowRed: boolean;
  /** Gelbsperre nach jeder fünften Gelben in der Liga (Bundesliga ab 1979/80). */
  yellowBan: boolean;
  /** Welche Statistiken es in dieser Zeit gab. */
  stats: StatAvailability;
}

export interface StatAvailability {
  shotsOnTarget: boolean;
  possession: boolean;
  duels: boolean;
  passes: boolean;
  distance: boolean;
  bigChances: boolean;
  xg: boolean;
}

/** Saison-Startjahr aus einem ISO-Datum: Regeln wechseln zum 1. Juli, nicht zum Jahreswechsel. */
export function seasonYearOf(date: string): number {
  const y = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 7 ? y : y - 1;
}

/** Regeln der Saison, die im Jahr `year` beginnt (z. B. 2017 = 2017/18: Videobeweis). */
export function eraRules(year: number): EraRules {
  // Epochen wie die Soll-Werte (data/matchStats.ts, echte Bundesliga-Daten je Jahrzehnt)
  const goalFactor =
    year < 1985 ? 1.13 : year < 1995 ? 0.95 : year < 2005 ? 0.92 : year < 2015 ? 0.9 : year < 2024 ? 0.95 : 1.0;
  const homeAdvantage =
    year < 1985 ? 2.05 : year < 1995 ? 1.76 : year < 2005 ? 1.5 : year < 2015 ? 1.28 : year < 2020 ? 1.26 : 1.18;
  return {
    year,
    goalFactor,
    homeAdvantage,
    // Fouls je Spiel nach den Daten (35–41 bis etwa 2010, 21 heute, `foulRate`) – Karten je Foul entsprechend
    yellowPerFoul: year < 1985 ? 0.04 : year < 1995 ? 0.058 : year < 2005 ? 0.085 : year < 2015 ? 0.1 : year < 2020 ? 0.13 : 0.168,
    foulRate: year < 1985 ? 1.95 : year < 1995 ? 1.95 : year < 2005 ? 2.05 : year < 2015 ? 1.85 : year < 2020 ? 1.25 : 1.0,
    redPerFoul: year < 1995 ? 0.0016 : year < 2005 ? 0.001 : year < 2015 ? 0.00085 : year < 2020 ? 0.00082 : 0.0012,
    maxSubs: year < 1995 ? 2 : year < 2020 ? 3 : 5,
    benchSize: year < 1995 ? 5 : year < 2008 ? 7 : year < 2020 ? 7 : 9,
    var: year >= 2017,
    backPassRule: year >= 1992,
    yellowRed: year >= 1991,
    yellowBan: year >= 1979,
    stats: {
      shotsOnTarget: year >= 1985,
      possession: year >= 1992,
      duels: year >= 1998,
      passes: year >= 2003,
      distance: year >= 2003,
      bigChances: year >= 2013,
      xg: year >= 2016,
    },
  };
}

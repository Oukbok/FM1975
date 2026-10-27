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

export function eraRules(year: number): EraRules {
  const goalFactor =
    year < 1980 ? 1.02 : year < 1990 ? 1.04 : year < 2000 ? 0.97 : year < 2010 ? 0.94 : year < 2020 ? 0.94 : 0.96;
  const homeAdvantage =
    year < 1985 ? 1.3 : year < 1995 ? 1.26 : year < 2005 ? 1.21 : year < 2015 ? 1.2 : 1.19;
  return {
    year,
    goalFactor,
    homeAdvantage,
    yellowPerFoul: year < 1985 ? 0.065 : year < 1995 ? 0.095 : year < 2005 ? 0.13 : 0.155,
    redPerFoul: year < 1995 ? 0.0016 : 0.0012,
    maxSubs: year < 1995 ? 2 : year < 2020 ? 3 : 5,
    benchSize: year < 1995 ? 5 : year < 2008 ? 7 : year < 2020 ? 7 : 9,
    var: year >= 2017,
    backPassRule: year >= 1992,
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

// =============================================================================
// LIGARUF JE LAND — historische Zielkurve (Option „Entwicklung der Ligen“)
// -----------------------------------------------------------------------------
// Ligaruf 0–100: wie stark und angesehen die Liga eines Landes in Europa ist
// (100 = beste Liga Europas, ~80 = obere Spitzenligen, ~60 = solide Mittelklasse,
// ~40 = kleine Liga). Stützpunkte [Saison-Startjahr, Ruf], dazwischen linear, vor
// dem ersten und nach dem letzten Punkt konstant. Schlüssel = Hintergrund-Schlüssel
// des Landes (data/world/countries.ts `key`).
//
// Grundlage ist die Fünfjahreswertung der UEFA (Länderkoeffizient) je Jahrzehnt –
// grob in Ruf übersetzt, keine Messwerte:
//   1975–79: West-D. 52,6 vor England 39,2 und Belgien 38,3; Niederlande stark (Landesmeister 1970–73).
//   1979–83: West-D. vor Spanien und England. 1981–85: England (41,1) vor Italien (38,8)
//     und West-D. (37,1); Schottland stark (Pokalsieger-Wettbewerb 1983).
//   1986–90: West-D. 45,4 vor Italien 43,2; England wegen des Ausschlusses ohne Wertung;
//     Portugal/Niederlande mit Landesmeistern 1987/88, Rumänien/Jugoslawien 1986/1991.
//   1991–95: Italien klar vorn (63,9), Frankreich und Deutschland (40,3) folgen.
//   1996–2000: Spanien 59,6 vor Italien 55,9; Türkei/Griechenland steigen (UEFA-Pokal 2000).
//   2001–05: Spanien 73,7 vor Italien/England; Portugal (Landesmeister 2004).
//   2004–08: England 75,7 knapp vor Spanien 75,3; Russland/Ukraine stark (UEFA-Pokal 2005/08/09).
//   2009–13: Spanien 88,0 vor England 83,0 und Deutschland. 2011–15: Spanien ~100 vor
//     Deutschland/England; Portugal Fünfter. 2015–19: Spanien ~103,6 vor England.
//   2020–24: England 104,3 vor Italien 90,3 und Spanien 89,5; Niederlande/Belgien/Türkei
//     wieder Top 10, Russland ab 2022 ausgeschlossen.
// Quellen (abgerufen 11/2026): en.wikipedia.org/wiki/UEFA_coefficient (Abschnitte „Association
//   coefficient“ und „Top associations by period“), Bert Kassies, UEFA European Cup Coefficients
//   Database (kassiesa.net/uefa/data, Länderwertungen je Jahr), rsssf.org/miscellaneous/ecfaq.html
//   (Qualifikation und Startplätze nach Rang).
// =============================================================================

export type RepCurve = [year: number, rep: number][];

const Y = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
/** Kurve aus Werten zu den Jahren 1975, 1980 … 2025 (Lücken mit null). */
const c = (...v: (number | null)[]): RepCurve => v.flatMap((x, i) => (x == null ? [] : [[Y[i], x] as [number, number]]));

export const LEAGUE_REP_CURVES: Record<string, RepCurve> = {
  //                  1975 1980 1985 1990 1995 2000 2005 2010 2015 2020 2025
  Deutschland: c(96, 96, 88, 94, 84, 84, 80, 86, 92, 90, 88),
  England: c(88, 90, 92, 78, 76, 84, 92, 98, 92, 96, 100),
  Italien: c(80, 82, 90, 92, 100, 94, 90, 86, 84, 88, 94),
  Spanien: c(82, 88, 86, 86, 84, 100, 100, 96, 100, 100, 92),
  Frankreich: c(66, 68, 70, 76, 86, 80, 80, 80, 76, 82, 84),
  Niederlande: c(88, 82, 78, 80, 80, 76, 74, 72, 66, 68, 76),
  Portugal: c(70, 70, 74, 80, 76, 74, 78, 78, 82, 80, 78),
  Belgien: c(84, 84, 80, 82, 72, 66, 64, 62, 64, 70, 74),
  Schottland: c(68, 68, 74, 66, 58, 58, 64, 56, 52, 54, 58),
  Sowjetunion: c(74, 72, 72, 70),
  Russland: [[1992, 64], [1995, 62], [2000, 64], [2005, 74], [2010, 78], [2015, 76], [2020, 72], [2025, 56]],
  Ukraine: [[1992, 56], [2000, 62], [2005, 66], [2010, 74], [2015, 74], [2020, 68], [2025, 60]],
  Jugoslawien: c(74, 70, 68, 74),
  Serbien: [[1992, 46], [1995, 40], [2000, 48], [2005, 52], [2010, 50], [2015, 50], [2020, 56], [2025, 56]],
  Kroatien: [[1992, 50], [1995, 52], [2000, 56], [2005, 54], [2010, 52], [2015, 56], [2020, 60], [2025, 60]],
  Tschechoslowakei: c(66, 66, 64, 62),
  Tschechien: [[1993, 62], [1995, 64], [2000, 66], [2005, 64], [2010, 60], [2015, 62], [2020, 64], [2025, 68]],
  Slowakei: [[1993, 50], [2000, 50], [2005, 48], [2010, 48], [2015, 46], [2025, 50]],
  Polen: c(64, 62, 60, 56, 56, 54, 52, 52, 54, 52, 60),
  Ungarn: c(64, 62, 60, 56, 52, 48, 46, 44, 44, 48, 50),
  Rumaenien: c(60, 62, 66, 70, 62, 60, 62, 60, 54, 52, 52),
  Bulgarien: c(62, 62, 60, 60, 56, 50, 54, 52, 50, 46, 46),
  Griechenland: c(60, 62, 64, 62, 64, 68, 68, 66, 68, 60, 64),
  Tuerkei: c(52, 52, 54, 58, 64, 72, 70, 70, 70, 66, 74),
  Oesterreich: c(62, 64, 64, 60, 64, 60, 58, 54, 56, 64, 68),
  Schweiz: c(60, 62, 60, 58, 56, 58, 62, 64, 64, 62, 62),
  Schweden: c(62, 66, 64, 60, 60, 56, 54, 52, 50, 48, 50),
  Daenemark: c(56, 56, 60, 58, 60, 62, 62, 60, 56, 62, 64),
  Norwegen: c(48, 48, 48, 50, 60, 64, 54, 50, 48, 54, 62),
  Finnland: c(42, 42, 42, 44, 44, 44, 42, 40, 40, 40, 40),
  Island: c(38, 38, 38, 38, 38, 38, 36, 36, 38, 38, 38),
  Irland: c(44, 44, 44, 42, 40, 40, 42, 40, 40, 42, 42),
  Nordirland: c(46, 44, 44, 42, 40, 38, 36, 36, 36, 38, 38),
  Wales: c(46, 44, 44, 40, 38, 36, 36, 36, 36, 38, 38),
  Luxemburg: c(34, 34, 34, 34, 32, 32, 32, 34, 36, 38, 38),
  Zypern: c(40, 40, 40, 42, 46, 48, 52, 54, 58, 58, 56),
  Malta: c(36, 36, 36, 36, 36, 36, 36, 36, 34, 34, 34),
  Albanien: c(42, 42, 42, 42, 38, 38, 40, 40, 42, 42, 42),
  Israel: [[1992, 48], [2000, 54], [2005, 56], [2025, 58]],
  DDR: c(66, 68, 66, 64),
};

/** Historischer Ligaruf eines Landes im Jahr (Saison-Startjahr); unbekanntes Land = 45. */
export function repTargetAt(key: string, year: number): number {
  const cv = LEAGUE_REP_CURVES[key];
  if (!cv?.length) return 45;
  if (year <= cv[0][0]) return cv[0][1];
  for (let i = 1; i < cv.length; i++) {
    const [y1, v1] = cv[i];
    if (year <= y1) {
      const [y0, v0] = cv[i - 1];
      return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
    }
  }
  return cv[cv.length - 1][1];
}

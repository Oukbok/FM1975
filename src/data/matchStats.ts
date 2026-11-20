// =============================================================================
// Soll-Werte der Match-Engine je Epoche (Kalibrierung, `node scripts/matchbench.mjs`).
// Spannen [min, max] je Spiel (beide Teams) bzw. je Team, wo angegeben.
//
// Quellen (abgerufen 11/2026):
//  - Bundesliga 1975/76: 1009 Tore in 306 Spielen = 3,30 je Spiel
//    https://en.wikipedia.org/wiki/1975%E2%80%9376_Bundesliga
//  - Bundesliga 2018/19 (DSFS): 973 Tore (3,18 je Spiel), 91 Elfmeter (0,30 je Spiel, Rekord),
//    Verwandlung 81,3 %, 43 Platzverweise (21 Rot, 22 Gelb-Rot = 0,14 je Spiel)
//    https://www.dsfs.de/wp-content/uploads/2024/01/Bundesliga_Statistische_Auswertungen_Saison2018-19.pdf
//  - Bundesliga 2019/20 (DFL): 982 Tore, 152 nach Kontern (15,5 %), 167 Kopfballtore (17,0 %),
//    97 nach Ecken (9,9 %), 73 nach Freistößen (7,4 %; davon 17 direkt = 1,7 %), 73 Elfmeter
//    (0,24 je Spiel), 76 % der Tore aus dem Spiel heraus (= 24 % nach Standards),
//    7043 Fouls (23,0 je Spiel), 1152 Gelbe (3,76), 35 Gelb-Rot + 20 Rot (0,18 je Spiel)
//    https://www.bundesliga.com/de/bundesliga/news/trends-der-saison-2019-20-torflut-konter-spieler-11919
//  - Bundesliga 2025/26 nach 24 Spieltagen: 164 Standardtore (~24 %), 61 nach Ecken (~9 %)
//    https://www.bundesliga.com/en/bundesliga/news/importance-set-pieces-free-kick-bayern-munich-dortmund-freiburg-36267
//  - Elfmeter 1963–2021: 5000 Strafstöße (~0,28 je Spiel), 74,9 % verwandelt, 18,4 % gehalten
//    https://www.bundesliga.com/de/bundesliga/news/5000-elfmeter-elfer-strafstoss-geschichte-historie-muller-kaltz-lewandowski-bayern-18136
//  - Premier League: Tore von außerhalb des Strafraums 188 (2006/07, ≈ 20 % von 931) → 143 (2023/24,
//    ≈ 11,5 % von 1246); Anteil Schüsse von außerhalb 43,0 % (2014/15) → 33,1 % (2023/24)
//    https://premierleague.com/news/4121353
//  - Premier League Kopfballtore: 205 (2010/11 ≈ 19 % von 1063), 203 (2023/24 ≈ 16 % von 1246);
//    34,7 Flanken je Spiel, 8,4 davon angekommen (≈ 24 %)
//    https://theanalyst.com/articles/premier-league-fewer-headed-goals-2024-25
//  - Bundesliga-Passquote heute ≈ 80–86 % (Topklubs), Ligaschnitt ≈ 80 %
//    https://www.bundesliga.com/de/bundesliga/statistiken/clubs/passquote
//  - Ergebnisse aller Bundesligaspiele 1963/64–2008/09 (R-Paket vcd, Datensatz „Bundesliga“,
//    https://raw.github.com/vincentarelbundock/Rdatasets/master/doc/vcd/Bundesliga.html) – ausgewertet
//    11/2026 je Epoche: Tore/Spiel, Heim/Remis/Auswärts, 0:0-Anteil (Tabelle docs/recherche/attribute-engine.md):
//      1975–84 3,41 Tore, 56,7 % / 24,2 % / 19,1 %, 0:0 5,1 % · 1985–94 2,93 Tore, 49,3 / 29,2 / 21,5 %, 0:0 8,2 %
//      1995–2004 2,87 Tore, 48,5 / 25,8 / 25,8 %, 0:0 6,9 %
//  - Spielstatistik je Spiel 1993/94–2025/26 (football-data.co.uk, Spiegel github.com/datasets/football-datasets,
//    Spalten Schüsse/aufs Tor/Fouls/Ecken/Gelb/Rot ab 2000/01, Halbzeitstand ab 1994/95), Mittel je Epoche:
//      2005–14 2,87 Tore, 45,1 / 25,5 / 29,4 %, 0:0 6,8 %, 13,4 Schüsse je Team (38 % aufs Tor), 34,0 Fouls,
//              10,1 Ecken, 3,65 Gelb, 0,18 Rot, 56,1 % der Tore nach der Pause
//      2015–23 3,05 Tore, 44,9 / 24,7 / 30,5 %, 0:0 5,6 %, 12,9 Schüsse (36,6 %), 25,0 Fouls, 9,6 Ecken,
//              3,75 Gelb, 0,14 Rot, 55,6 % nach der Pause
//      2024–25 3,18 Tore, 41,2 / 24,8 / 34,0 %, 13,1 Schüsse (36 %), 21,1 Fouls, 9,7 Ecken, 3,83 Gelb, 0,18 Rot
//      2000–04 ≈ 2,9 Tore, 12–14 Schüsse, 35–41 Fouls (Zählweise vor Opta), 4,3 Gelb, 0,21 Rot
//    Zum Vergleich Premier League/LaLiga/Serie A 2005–14: 2,66/2,70/2,60 Tore, Heimsiege 46,9/47,8/46,4 %,
//    Remis 25,0/23,7/27,5 %; 2015–23: 2,82/2,62/2,78 Tore, Heimsiege 44,9/45,5/43,0 %.
//  - Entwicklung des Spiels 1966–2010 (WM-Endspiele): Pässe je Minute +35 %, Ballgeschwindigkeit +15 %
//    Wallace & Norton (2014), J. Sci. Med. Sport 17(2): „Evolution of World Cup soccer final games 1966–2010“.
//
// Annahmen (keine belastbare Zählung aus den 70ern/80ern): Fouls wie Anfang der 2000er (vor der
// Opta-Zählung ab etwa 2015 lagen alle Werte bei 34–41 je Spiel), Schüsse/Ecken wie 2000–04. Kopfball- und Distanztore waren häufiger
// (mehr hohe Flanken, Libero-Abwehr mit Manndeckung, Torhüter schwächer gegen Fernschüsse),
// weniger Pressing → weniger Ballgewinne weit vorne → etwas weniger Kontertore, weniger Pässe
// mit schlechterer Passquote, mehr Abseits durch die Abseitsfalle der Libero-Abwehr.
// =============================================================================

export type Range = [number, number];

export interface MatchTargets {
  /** Tore je Spiel. */
  goals: Range;
  /** Anteil 0:0 (echte Daten je Epoche). */
  zeroZero: Range;
  /** Anteil der Tore nach der Pause (inkl. Nachspielzeit). */
  secondHalfShare: Range;
  /** Verwandelte Elfmeter (ohne Elfmeterschießen). */
  penaltyConv: Range;
  /** Heimsieg- und Remisquote. */
  homeWin: Range;
  draw: Range;
  /** Schüsse je Team und Spiel, Anteil aufs Tor (inkl. Tore). */
  shotsPerTeam: Range;
  onTargetShare: Range;
  /** Torarten als Anteil aller Tore. */
  headerShare: Range;
  setPieceShare: Range;
  cornerShare: Range;
  freeKickShare: Range;
  penaltyShare: Range;
  counterShare: Range;
  longShare: Range;
  ownGoalShare: Range;
  /** Je Spiel (beide Teams). */
  penalties: Range;
  fouls: Range;
  yellow: Range;
  red: Range;
  offsides: Range;
  corners: Range;
  /** Gezählte Zweikämpfe je Spiel (jeder Zweikampf einmal; Bundesliga zählt ~200–230). */
  duels: Range;
  /** Je Team. */
  passesPerTeam: Range;
  passAccuracy: Range;
  crossesPerTeam: Range;
  crossAccuracy: Range;
}

const T1975: MatchTargets = {
  goals: [3.25, 3.55], zeroZero: [0.035, 0.07], secondHalfShare: [0.53, 0.59], penaltyConv: [0.71, 0.8],
  homeWin: [0.53, 0.6], draw: [0.21, 0.27],
  shotsPerTeam: [12.5, 15], onTargetShare: [0.36, 0.45],
  headerShare: [0.18, 0.26], setPieceShare: [0.24, 0.34], cornerShare: [0.08, 0.14], freeKickShare: [0.06, 0.11],
  penaltyShare: [0.05, 0.09], counterShare: [0.08, 0.15], longShare: [0.16, 0.26], ownGoalShare: [0.02, 0.05],
  penalties: [0.24, 0.36], fouls: [30, 40], yellow: [1.6, 2.4], red: [0.03, 0.1], offsides: [4.5, 7], corners: [9.5, 11.5],
  duels: [190, 250], passesPerTeam: [250, 340], passAccuracy: [0.66, 0.75], crossesPerTeam: [15, 22], crossAccuracy: [0.2, 0.32],
};

const T1985: MatchTargets = {
  ...T1975, goals: [2.8, 3.1], zeroZero: [0.06, 0.1], homeWin: [0.46, 0.53], draw: [0.26, 0.32],
  yellow: [2.2, 3.0], headerShare: [0.17, 0.25], longShare: [0.15, 0.24],
};

const T1995: MatchTargets = {
  ...T1975,
  goals: [2.75, 3.0], zeroZero: [0.05, 0.09], homeWin: [0.45, 0.52], draw: [0.23, 0.29],
  headerShare: [0.16, 0.23], longShare: [0.14, 0.22], counterShare: [0.1, 0.16],
  shotsPerTeam: [12.3, 14.5], fouls: [32, 41], yellow: [3.2, 4.4], red: [0.14, 0.26], offsides: [4, 6], corners: [9.8, 11.3],
  passesPerTeam: [330, 420], passAccuracy: [0.7, 0.78], crossesPerTeam: [15, 21],
};

const T2005: MatchTargets = {
  ...T1995,
  goals: [2.75, 3.0], zeroZero: [0.05, 0.085], secondHalfShare: [0.535, 0.585], homeWin: [0.42, 0.48], draw: [0.23, 0.28],
  shotsPerTeam: [12.5, 14.3], onTargetShare: [0.34, 0.41],
  headerShare: [0.15, 0.21], longShare: [0.14, 0.21], counterShare: [0.11, 0.17],
  fouls: [30, 38], yellow: [3.3, 4.0], red: [0.13, 0.23], offsides: [3.5, 5.5], corners: [9.3, 10.8],
  passesPerTeam: [380, 470], passAccuracy: [0.73, 0.8],
};

const T2015: MatchTargets = {
  ...T2005,
  goals: [2.9, 3.2], zeroZero: [0.04, 0.075], secondHalfShare: [0.53, 0.58], penaltyConv: [0.74, 0.84],
  homeWin: [0.42, 0.48], draw: [0.22, 0.28],
  shotsPerTeam: [12.2, 13.8], onTargetShare: [0.33, 0.4], headerShare: [0.14, 0.2], setPieceShare: [0.22, 0.32], cornerShare: [0.08, 0.13],
  longShare: [0.11, 0.18], counterShare: [0.12, 0.18], penaltyShare: [0.05, 0.09],
  penalties: [0.22, 0.32], fouls: [22, 28], yellow: [3.4, 4.1], red: [0.1, 0.2], offsides: [3.3, 5], corners: [9.0, 10.3],
  passesPerTeam: [420, 520], passAccuracy: [0.76, 0.83], crossesPerTeam: [14, 20], crossAccuracy: [0.2, 0.3],
};

const T2024: MatchTargets = {
  ...T2015,
  goals: [3.0, 3.35], zeroZero: [0.035, 0.075], secondHalfShare: [0.52, 0.57], homeWin: [0.38, 0.45], draw: [0.22, 0.28],
  shotsPerTeam: [12.3, 13.9], headerShare: [0.14, 0.2], longShare: [0.1, 0.16], counterShare: [0.13, 0.19],
  penalties: [0.24, 0.34], fouls: [19.5, 23.5], yellow: [3.5, 4.2], red: [0.12, 0.22], corners: [9.0, 10.4],
  passesPerTeam: [440, 540], passAccuracy: [0.78, 0.85],
};

const ANCHORS: [number, MatchTargets][] = [[1975, T1975], [1985, T1985], [1995, T1995], [2005, T2005], [2015, T2015], [2024, T2024]];

/** Soll-Werte der Epoche (nächstliegender Ankerpunkt, nicht interpoliert). */
export function matchTargets(year: number): MatchTargets {
  let best = ANCHORS[0];
  for (const a of ANCHORS) if (year >= a[0]) best = a;
  return best[1];
}

export const TARGET_LABELS: Record<keyof MatchTargets, string> = {
  goals: 'Tore/Spiel', zeroZero: '0:0', secondHalfShare: 'Tore 2. HZ', penaltyConv: 'Elfm. verw.', homeWin: 'Heimsiege', draw: 'Remis', shotsPerTeam: 'Schüsse/Team', onTargetShare: 'Aufs Tor',
  headerShare: 'Kopfballtore', setPieceShare: 'Standardtore', cornerShare: 'Tore n. Ecke', freeKickShare: 'Tore n. Freistoß',
  penaltyShare: 'Elfmetertore', counterShare: 'Kontertore', longShare: 'Distanztore', ownGoalShare: 'Eigentore',
  penalties: 'Elfmeter/Spiel', fouls: 'Fouls/Spiel', yellow: 'Gelb/Spiel', red: 'Rot/Spiel', offsides: 'Abseits/Spiel',
  corners: 'Ecken/Spiel', duels: 'Zweikämpfe/Spiel', passesPerTeam: 'Pässe/Team', passAccuracy: 'Passquote',
  crossesPerTeam: 'Flanken/Team', crossAccuracy: 'Flanken angek.',
};

// =============================================================================
// ZWEITE MANNSCHAFTEN (Amateure / U23 / „II“) – REGELN JE EPOCHE (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Kurzfassung mit Quellen: docs/research/zweite-mannschaften.md. Umsetzung:
// game/reservePyramid.ts (Ligapyramide, Auf-/Abstieg, Pokal) + game/reserveTeam.ts.
//
// Deutschland (West bzw. ab 1991 gesamt):
//  • 1951: Lizenz-/Vertragsspielervereine dürfen Amateurmannschaften im Ligasystem
//    melden; ab Ende der 1950er bis höchstens in die dritte Ebene (Amateurliga).
//  • 1963–1978: Amateurliga = dritte Ebene, Status der Amateure unverändert.
//  • 1978–1994: Amateur-Oberligen (dritte Ebene), weiter höchstens dritte Ebene –
//    die 2. Bundesliga bleibt gesperrt; ein Meister-Platz geht an den Nächsten.
//  • 1994–2008: Regionalliga (dritte Ebene), Amateure zugelassen, wenn sie sich
//    sportlich qualifizieren; ab 2005 heißen sie „II“ statt „Amateure“.
//  • ab 2008: 3. Liga für zweite Mannschaften der Lizenzvereine geöffnet; im Gegenzug
//    kein DFB-Pokal mehr. Je Regionalliga-Staffel höchstens sieben zweite Mannschaften.
//  • immer: nie in derselben oder einer höheren Spielklasse als die erste Mannschaft;
//    steigt die erste Mannschaft in die Liga der zweiten ab, muss die zweite weichen
//    (Zwangsabstieg); zweite Mannschaften von Drittligisten höchstens Oberliga.
//  • DFB-Pokal: ab 1974 über die Verbandspokale auch für Amateurmannschaften der
//    Lizenzvereine offen (Bestes: Hertha BSC Amateure, Finale 1993, 0:1 gegen
//    Leverkusen); ab 2008/09 ausgeschlossen.
//  • Spielberechtigung heute: Kader überwiegend U23, je Spiel bis zu drei ältere
//    Spieler; Profis, die in mehr als der Hälfte der Pflichtspiele der Profis
//    eingesetzt wurden („Stammspieler“), dürfen in der 3. Liga nicht aushelfen.
//  • 2014: Pflicht zur U23 für Lizenzvereine entfällt – mehrere Vereine melden ab
//    (u. a. Frankfurt, Leverkusen 2014, Bochum 2015).
// DDR: zweite Mannschaften der Oberligisten in der DDR-Liga bis 1976 (dann alle elf
//    ausgeschlossen, eigene Nachwuchsoberliga), ab 1984 wieder zugelassen – ohne
//    Aufstiegsrecht in die Oberliga; 1990/91 keine mehr.
// Ausland (für spätere Auslandsligen):
//  • England: Reserveteams spielen in eigenen Reserve-/Nachwuchsligen (Central League,
//    Football Combination, Premier Reserve League, seit 2012 Professional Development
//    League), nicht in der Pyramide; seit 2016/17 U21-Teams im EFL Trophy.
//  • Spanien: „B“-Teams in derselben Pyramide, nie in der Liga der ersten Mannschaft
//    (Castilla 1983/84 Meister der Segunda ohne Aufstieg); seit 1990/91 nicht mehr in
//    der Copa del Rey (Castilla im Finale 1980).
//  • Italien: seit 2018/19 „U23“-Teams der Serie-A-Vereine in der Serie C = dritte Ebene (Juventus
//    zuerst), nie in derselben oder höheren Liga, Zwangsabstieg, höchstens vier Ältere.
//  • Portugal: „B“-Teams 1999–2006 in der dritten Liga, seit 2012/13 in der 2. Liga, nie in
//    der Liga der ersten Mannschaft, von Landes- und Ligapokal ausgeschlossen.
//  • Frankreich: Reserveteams höchstens vierte Ebene (National 2/National 1 je nach
//    Ausbildungszentrum), Aufstieg geht sonst an den Nächsten; nicht im Coupe de France.
// =============================================================================

export interface ReserveSource { title: string; url: string }

export const RESERVE_SOURCES: ReserveSource[] = [
  { title: 'Wikipedia (en): German reserve football teams', url: 'https://en.wikipedia.org/wiki/German_reserve_football_teams' },
  { title: 'DFB: Wo dürfen zweite Mannschaften spielen? Das ist zu beachten', url: 'https://www.dfb.de/news/detail/wo-duerfen-zweite-mannschaften-spielen-das-ist-zu-beachten-144294' },
  { title: 'hessenschau: Zweite Mannschaften in der Regionalliga', url: 'https://www.hessenschau.de/sport/fussball/regionalliga/zweite-mannschaften-in-der-regionalliga-ist-das-wettbewerb-oder-kann-das-weg--v1,regionalliga-zweitmannschaften-100.html' },
  { title: 'ran.de: Welche Bundesliga-Profis sind in der 3. Liga spielberechtigt?', url: 'https://ran.joyn.de/sports/fussball/3-liga/3-liga-borussia-dortmund-und-vfb-stuttgart-im-abstiegskampf-welche-bundesliga-profis-sind-spielberechtigt-73620' },
  { title: 'DFB: Veränderte Regelung für U23-Spieler in der 3. Liga', url: 'https://www.dfb.de/news/veraenderte-regelung-fuer-u-23-spieler-in-der-3-liga' },
  { title: 'Wikipedia (en): 1993 DFB-Pokal final', url: 'https://en.wikipedia.org/wiki/1993_DFB-Pokal_final' },
  { title: 'Wikipedia (en): DDR-Liga', url: 'https://en.wikipedia.org/wiki/DDR-Liga' },
  { title: 'Wikipedia (en): Reserve team', url: 'https://en.wikipedia.org/wiki/Reserve_team' },
  { title: 'Wikipedia (en): Italian reserve football teams', url: 'https://en.wikipedia.org/wiki/Italian_reserve_football_teams' },
  { title: 'Sportskeeda: Spanish B teams and their eligibility', url: 'https://sportskeeda.com/football/spanish-b-teams-and-their-eligibility' },
  { title: 'Wikipedia (en): 2016–17 EFL Trophy', url: 'https://en.wikipedia.org/wiki/2016%E2%80%9317_EFL_Trophy' },
  { title: 'Wikipedia (en): FC Porto B (B-Teams in Portugal: Liga, Pokalsperre)', url: 'https://en.wikipedia.org/wiki/FC_Porto_B' },
  { title: 'DFB-Spielordnung § 12 (Einsatz in zweiten Mannschaften, Pokalspiele)', url: 'https://assets.dfb.de/uploads/000/328/557/original_Heft_04_Spielordnung_Schiedsrichterordnung_20251128.pdf' },
];

/** Höchste erlaubte Ebene (kleinste Tier-Zahl) einer zweiten Mannschaft in Deutschland: nie die 2. Liga. */
export const RESERVE_TOP_TIER = 3;
/** Erste Saison (Startjahr) ohne zweite Mannschaften im DFB-Pokal. */
export const RESERVE_CUP_END = 2008;
/** Erste Saison (Startjahr), in der Amateure über die Verbandspokale in den DFB-Pokal kommen. */
export const RESERVE_CUP_START = 1974;
/** Ab dieser Saison „II“ statt „Amateure“. */
export const RESERVE_II_NAME_FROM = 2005;
/** Ab dieser Saison ist die U23 für Lizenzvereine keine Pflicht mehr (Abmeldungen). */
export const RESERVE_OPTIONAL_FROM = 2014;

export interface ReserveEra {
  from: number;
  /** Name der höchsten Amateurliga unterhalb der simulierten Ligen (Ebene je Tiefe 0/1/2). */
  local: [string, string, string];
  /** Höchstens so viele Spieler über 23 in der Elf (null = keine Altersregel). */
  over23: number | null;
  /** Höchstens so viele zweite Mannschaften je simulierter Staffel (Spiel-Vereinfachung vor 2008). */
  capPerDivision: number;
  /** … in einer eingleisigen dritten Liga (3. Liga ab 2008). */
  capThirdLeague: number;
  text: string;
}

export const RESERVE_ERAS: ReserveEra[] = [
  { from: 1951, local: ['Amateurliga', 'Landesliga', 'Bezirksliga'], over23: null, capPerDivision: 6, capThirdLeague: 6,
    text: 'Die Amateure der Lizenzvereine spielen höchstens in der Amateurliga (dritte Ebene). Die 2. Bundesliga ist für sie gesperrt; über die Verbandspokale können sie sich für den DFB-Pokal qualifizieren.' },
  { from: 1978, local: ['Amateur-Oberliga', 'Verbandsliga', 'Landesliga'], over23: null, capPerDivision: 6, capThirdLeague: 6,
    text: 'Seit 1978 heißen die dritthöchsten Ligen Amateur-Oberliga. Die Amateure dürfen dort Meister werden, steigen aber nie in die 2. Bundesliga auf – den Platz bekommt der Nächste.' },
  { from: 1994, local: ['Oberliga', 'Verbandsliga', 'Landesliga'], over23: null, capPerDivision: 6, capThirdLeague: 6,
    text: 'Die Regionalliga ist die dritte Ebene. Amateure der Lizenzvereine sind zugelassen, wenn sie sich sportlich qualifizieren; die 2. Bundesliga bleibt gesperrt.' },
  { from: 2008, local: ['Oberliga', 'Verbandsliga', 'Landesliga'], over23: 3, capPerDivision: 7, capThirdLeague: 4,
    text: 'Zweite Mannschaften dürfen in die neue 3. Liga – im Gegenzug sind sie vom DFB-Pokal ausgeschlossen. Je Regionalliga-Staffel höchstens sieben; je Spiel höchstens drei Spieler über 23.' },
  { from: 2014, local: ['Oberliga', 'Verbandsliga', 'Landesliga'], over23: 3, capPerDivision: 7, capThirdLeague: 4,
    text: 'Die U23 ist für Lizenzvereine keine Pflicht mehr; mehrere Vereine melden ihre zweite Mannschaft ab.' },
];

export function reserveEra(year: number): ReserveEra {
  let e = RESERVE_ERAS[0];
  for (const x of RESERVE_ERAS) if (year >= x.from) e = x;
  return e;
}

/** Darf eine zweite Mannschaft in der Saison am DFB-Pokal teilnehmen? */
export const reserveCupOpen = (year: number) => year >= RESERVE_CUP_START && year < RESERVE_CUP_END;

/** Vereinsname der zweiten Mannschaft im Jahr („Amateure“ bis 2004/05, danach „II“). */
export function reserveName(parentName: string, year: number): string {
  return year >= RESERVE_II_NAME_FROM ? `${parentName} II` : `${parentName} Amateure`;
}

/** Name der Liga der zweiten Mannschaft unterhalb der simulierten Ebenen (Tiefe 0 = höchste Amateurliga). */
export function localLeagueName(year: number, depth: number): string {
  return reserveEra(year).local[Math.max(0, Math.min(2, depth))];
}

/** DDR (eigener Verein in der DDR, Hintergrund): Liga der zweiten Mannschaft je Jahr. */
export function ddrReserveLeague(year: number): string {
  if (year < 1976) return 'DDR-Liga';
  if (year < 1984) return 'Nachwuchsoberliga';
  if (year < 1990) return 'DDR-Liga';
  return 'Bezirksliga';
}

/** Regeln im Ausland (für spätere Auslandsligen; Ebenen ab 1 = höchste Liga). */
export interface ForeignReserveRule { cc: string; from: number; to?: number; inPyramid: boolean; topTier?: number; cup: boolean; text: string }
export const FOREIGN_RESERVE_RULES: ForeignReserveRule[] = [
  { cc: 'eng', from: 1911, inPyramid: false, cup: false, text: 'Reserveteams in eigenen Reserveligen, nicht in der Ligapyramide.' },
  { cc: 'eng', from: 2016, inPyramid: false, cup: true, text: 'U21-Teams der Akademie-Vereine spielen im Pokal der unteren Profiligen mit.' },
  { cc: 'esp', from: 1951, to: 1990, inPyramid: true, topTier: 2, cup: true, text: '„B“-Teams (filiales) in der Pyramide bis zur Segunda, nie in der Liga der ersten Mannschaft; Pokal offen (eine B-Mannschaft stand 1980 im Finale).' },
  { cc: 'esp', from: 1990, inPyramid: true, topTier: 2, cup: false, text: '„B“-Teams bis zur Segunda, seit 1990/91 nicht mehr im Landespokal.' },
  { cc: 'ita', from: 2018, inPyramid: true, topTier: 3, cup: false, text: 'U23-Teams der Serie-A-Vereine ab der Serie C, nie in derselben oder höheren Liga, Zwangsabstieg, höchstens vier Spieler über 23.' },
  { cc: 'por', from: 1999, to: 2012, inPyramid: true, topTier: 3, cup: false, text: '„B“-Teams 1999–2006 in der dritten Liga, nie in der Liga der ersten Mannschaft, nicht im Landespokal.' },
  { cc: 'por', from: 2012, inPyramid: true, topTier: 2, cup: false, text: '„B“-Teams seit 2012/13 in der 2. Liga – kein Aufstieg in die 1. Liga, nicht im Landespokal und Ligapokal.' },
  { cc: 'fra', from: 1970, inPyramid: true, topTier: 4, cup: false, text: 'Reserveteams höchstens auf der vierten Ebene; ein Aufstiegsplatz geht an den Nächsten; nicht im Landespokal.' },
];

export function foreignReserveRule(cc: string, year: number): ForeignReserveRule | null {
  let r: ForeignReserveRule | null = null;
  for (const x of FOREIGN_RESERVE_RULES) if (x.cc === cc && year >= x.from && (x.to == null || year < x.to)) r = x;
  return r;
}

// =============================================================================
// EUROPAPOKAL-FORMATE JE SAISON (Recherche, Stand 11/2026)
// -----------------------------------------------------------------------------
// Das Spiel kennt drei Wettbewerbs-„Fächer“ (EuroCompId):
//   ec   = Pokal der Landesmeister, ab 1992/93 Meisterliga (Vorbild Champions League)
//   cwc  = Pokal der Pokalsieger bis 1998/99, ab 2021/22 Konferenz-Liga (Vorbild
//          Conference League); dazwischen ruht das Fach
//   uefa = Europa-Pokal (Vorbild UEFA-Pokal), ab 2009/10 Europa-Liga (Europa League)
//
// Quellen:
//   • Auswärtstorregel: 1965/66 im Pokalsieger-Wettbewerb eingeführt, 1966/67 Messe-
//     pokal, Landesmeister 1967/68–1970/71 schrittweise (en.wikipedia.org/wiki/
//     Away_goals_rule). Abgeschafft „in all club competitions from the 2021–22 season“
//     (UEFA-Beschluss 24.06.2021, ebd.). Im Spiel zählen Auswärtstore auch in der
//     Verlängerung des Rückspiels (so bis 2020/21 in den UEFA-Reglements; Beispiel
//     Rangers–Sporting 1971/72, ebd.).
//   • UEFA-Pokal-Finale: „From 1997/98 on the UC final will be decided in a single game
//     on neutral ground“ (rsssf.org/miscellaneous/ecfaq.html) → bis 1996/97 Hin- und
//     Rückspiel. Landesmeister- und Pokalsieger-Endspiel: immer ein Spiel.
//   • Landesmeister 1991/92: 32 Teams, 1. und 2. Runde K.-o., danach „two groups of
//     four, playing each other home and away“, Gruppensieger im Finale (en.wikipedia.org/
//     wiki/1991–92_European_Cup); 1992/93 gleich (Name „Champions League“ ab 1992).
//   • 1993/94: zwei Vierergruppen, die ersten zwei ins Halbfinale, Halbfinale als EIN
//     Spiel beim Gruppensieger (en.wikipedia.org/wiki/1993–94_UEFA_Champions_League).
//   • 1994/95–1996/97: vier Vierergruppen (16 Teams), die ersten zwei ins Viertelfinale;
//     1994/95 „last edition … awarded two points for each win“ (…/1994–95_UEFA_
//     Champions_League) → ab 1995/96 drei Punkte.
//   • 1997/98–1998/99: „The 24 teams were divided into six groups of four“, Gruppensieger
//     + die zwei besten Zweiten ins Viertelfinale; Wertung Punkte, Tordifferenz, Tore,
//     Auswärtstore (…/1997–98_UEFA_Champions_League_group_stage; rsssf ecfaq: „best
//     runners-up … points, goal difference, goals scored and goals scored away“).
//   • 1999/00–2002/03: acht Vierergruppen, die ersten zwei in die zweite Gruppenphase
//     (vier Vierergruppen, je zwei Sieger + zwei Zweite, keine Vereine eines Landes oder
//     derselben Vorgruppe zusammen), Dritte in die 3. Runde des UEFA-Pokals;
//     Entscheidung bei Punktgleichheit: direkter Vergleich (Punkte, Tore, Auswärtstore),
//     dann Tordifferenz, Tore (…/1999–2000_UEFA_Champions_League).
//   • 2003/04–2023/24: acht Vierergruppen, Achtelfinale; Gruppendritte in den UEFA-Pokal
//     bzw. die Europa League („The third-placed teams entered the Europa League's
//     knockout round“, …/UEFA_Champions_League).
//   • UEFA-Pokal 2004/05–2008/09: acht Fünfergruppen, je vier Spiele (zwei Heim-, zwei
//     Auswärtsspiele), „The top three teams in each group progressed to the Round of 32“
//     (…/2004–05_UEFA_Cup_group_stage) – dazu die acht Dritten der Champions League.
//   • Europa League 2009/10–2020/21: „48 teams were drawn into twelve groups of four“,
//     die ersten zwei + acht CL-Dritte ins Sechzehntelfinale; direkter Vergleich vor
//     Tordifferenz (…/2009–10_UEFA_Europa_League).
//   • 2021/22–2023/24: Europa League und Conference League mit acht Vierergruppen;
//     Gruppensieger direkt ins Achtelfinale, Zweite in die K.-o.-Zwischenrunde gegen die
//     Dritten des höheren Wettbewerbs (…/2021–22_UEFA_Europa_League_knockout_phase,
//     …/2021–22_UEFA_Europa_Conference_League_group_stage).
//   • Ab 2024/25: Ligaphase mit 36 Teams; Champions League und Europa League acht Spiele
//     („two opponents from each pot, one home and one away“), Conference League sechs
//     Spiele (ein Gegner je Topf, drei Heim-/drei Auswärtsspiele); Platz 1–8 Achtelfinale,
//     9–24 Play-offs, 25–36 raus, kein Wechsel in einen anderen Wettbewerb; Wertung
//     Tordifferenz, Tore, Auswärtstore, Siege, Auswärtssiege (…/2024–25_UEFA_Champions_
//     League_league_phase, …/2024–25_UEFA_Conference_League_league_phase).
//   • Pokal der Pokalsieger zuletzt 1998/99 (Zusammenlegung mit dem UEFA-Pokal).
//   • Startplätze (UEFA-Pokal): „countries ranked 1 - 3 obtain 4 berths“, 3 Plätze für
//     Rang 4–8, 2 für Rang 9–21 (rsssf ecfaq, Stand 1997/98).
//
// Dokumentierte Vereinfachungen:
//   • Qualifikations- und frühe Runden werden nicht ausgespielt; das Feld beginnt mit
//     der Runde, die in der Tabelle `field` steht (z. B. Landesmeister bis 1990/91 im
//     Achtelfinale, Gruppenphasen direkt mit allen Gruppenteams).
//   • Startplätze nach Rang des Landes in der Fünfjahreswertung (engine/world.ts), nicht
//     nach der echten UEFA-Liste jedes Jahres; Titelverteidiger ohne Extraplatz.
//   • Gruppen-Wertung 1991/92–1998/99 ohne direkten Vergleich (Punkte, Tordifferenz,
//     Tore, Auswärtstore), danach direkter Vergleich wie oben; zuletzt Stärke statt
//     Koeffizient/Losentscheid.
//   • Fortschreibung nach 2026 = letzter Stand (Ligaphase).
// =============================================================================
import type { EuroCompId } from './europe';

export type StageKind = 'ko' | 'groups' | 'league';

/** Weiterleitung nach Platzierung (1-basiert) in eine Runde dieses oder eines anderen Wettbewerbs. */
export interface Advance {
  from: number; to: number; target: string; comp?: EuroCompId;
  /** Setzwert in der Zielrunde (Standard = Platz): kleiner = eher gesetzt. */
  seed?: number;
}

export interface StageSpec {
  /** Kurzschlüssel der Runde (Ziel von Weiterleitungen). */
  key: string;
  name: string;
  kind: StageKind;
  /** K.-o.: 1 Spiel oder Hin- und Rückspiel. */
  legs?: 1 | 2;
  /** Gruppen: Anzahl, Größe, einfache (1) oder doppelte (2) Runde. */
  groups?: number;
  size?: number;
  rr?: 1 | 2;
  /** Ligaphase: Spiele je Team und Zahl der Lostöpfe. */
  matches?: number;
  pots?: number;
  /** Weiterkommen aus Gruppe/Liga nach Platz. */
  advance?: Advance[];
  /** 1997/98: die besten Zweiten kommen zusätzlich weiter. */
  bestRunnersUp?: { count: number; target: string };
  /**
   * Ziehung der K.-o.-Runde: frei, gesetzt (besser Platzierte gegen den Rest, Gesetzte
   * mit Rückspiel daheim, kein Duell aus derselben Gruppe/demselben Land), fest
   * (1993/94: A1–B2, B1–A2 beim Gruppensieger), keine (Finale).
   */
  draw?: 'free' | 'seeded' | 'fixed' | 'none';
  /** Termine je Spieltag/Leg als MM-TT (Juli–Dezember = Startjahr, Januar–Juni = Folgejahr). */
  dates: string[];
}

export interface EuroFormat {
  comp: EuroCompId;
  from: number;
  to: number;
  /** Teilnehmer der ersten gespielten Runde. */
  field: number;
  stages: StageSpec[];
  /** Auswärtstorregel bei Gleichstand nach Hin- und Rückspiel (auch in der Verlängerung). */
  awayGoals: boolean;
  /** Punkte je Sieg in Gruppen/Liga. */
  winPts: 2 | 3;
  /** Wertung bei Punktgleichheit: gesamt (Tordifferenz), direkter Vergleich, Ligaphase. */
  tiebreak: 'overall' | 'h2h' | 'league';
  /** Spieltag in der Woche (3 = Mittwoch, 4 = Donnerstag). */
  weekday: number;
  /** Klartext zum Format (Wiki, Auslosung). */
  note: string;
}

// -----------------------------------------------------------------------------
// Bausteine
// -----------------------------------------------------------------------------
const ko = (key: string, name: string, legs: 1 | 2, dates: string[], draw: StageSpec['draw'] = 'free'): StageSpec =>
  ({ key, name, kind: 'ko', legs, dates, draw });
const fin = (date: string): StageSpec => ({ key: 'f', name: 'Finale', kind: 'ko', legs: 1, dates: [date], draw: 'none' });
const groups = (key: string, name: string, n: number, size: number, rr: 1 | 2, dates: string[], advance: Advance[], extra: Partial<StageSpec> = {}): StageSpec =>
  ({ key, name, kind: 'groups', groups: n, size, rr, dates, advance, ...extra });
const league = (matches: number, pots: number, dates: string[]): StageSpec => ({
  key: 'lp', name: 'Ligaphase', kind: 'league', matches, pots, dates,
  advance: [{ from: 1, to: 8, target: 'af' }, { from: 9, to: 24, target: 'po' }],
});
/** K.-o.-Phase ab Achtelfinale (2003–). */
const koFrom16 = (af: [string, string], vf: [string, string], hf: [string, string], f: string, afDraw: StageSpec['draw'] = 'seeded') => [
  ko('af', 'Achtelfinale', 2, af, afDraw), ko('vf', 'Viertelfinale', 2, vf), ko('hf', 'Halbfinale', 2, hf), fin(f),
];

const A = (winPts: 2 | 3, awayGoals: boolean, tiebreak: EuroFormat['tiebreak']) => ({ winPts, awayGoals, tiebreak });

// -----------------------------------------------------------------------------
// Formate
// -----------------------------------------------------------------------------
export const EURO_FORMATS: EuroFormat[] = [
  // ---------------- Landesmeister / Meisterliga ----------------
  { comp: 'ec', from: 1975, to: 1990, field: 16, weekday: 3, ...A(2, true, 'overall'),
    note: 'K.-o.-System mit Hin- und Rückspiel, Endspiel als ein Spiel.',
    stages: [ko('af', 'Achtelfinale', 2, ['10-22', '11-05']), ko('vf', 'Viertelfinale', 2, ['03-03', '03-17']), ko('hf', 'Halbfinale', 2, ['04-07', '04-21']), fin('05-12')] },
  { comp: 'ec', from: 1991, to: 1992, field: 16, weekday: 3, ...A(2, true, 'overall'),
    note: 'Zwei K.-o.-Runden, dann zwei Vierergruppen; die Gruppensieger bestreiten das Finale.',
    stages: [ko('r2', '2. Runde', 2, ['10-23', '11-06']),
      groups('gs', 'Gruppenphase', 2, 4, 2, ['11-27', '12-11', '03-04', '03-18', '04-01', '04-15'], [{ from: 1, to: 1, target: 'f' }]), fin('05-20')] },
  { comp: 'ec', from: 1993, to: 1993, field: 16, weekday: 3, ...A(2, true, 'overall'),
    note: 'Zwei Vierergruppen; die ersten zwei spielen ein Halbfinale beim Gruppensieger.',
    stages: [ko('r2', '2. Runde', 2, ['10-20', '11-03']),
      groups('gs', 'Gruppenphase', 2, 4, 2, ['11-24', '12-08', '03-02', '03-16', '03-30', '04-13'], [{ from: 1, to: 2, target: 'hf' }]),
      ko('hf', 'Halbfinale', 1, ['04-27'], 'fixed'), fin('05-18')] },
  { comp: 'ec', from: 1994, to: 1996, field: 16, weekday: 3, ...A(2, true, 'overall'),
    note: 'Vier Vierergruppen, die ersten zwei ins Viertelfinale.',
    stages: [groups('gs', 'Gruppenphase', 4, 4, 2, ['09-14', '09-28', '10-19', '11-02', '11-23', '12-07'], [{ from: 1, to: 2, target: 'vf' }]),
      ko('vf', 'Viertelfinale', 2, ['03-01', '03-15'], 'seeded'), ko('hf', 'Halbfinale', 2, ['04-05', '04-19']), fin('05-24')] },
  { comp: 'ec', from: 1997, to: 1998, field: 24, weekday: 3, ...A(3, true, 'overall'),
    note: 'Sechs Vierergruppen; Gruppensieger und die zwei besten Zweiten ins Viertelfinale.',
    stages: [groups('gs', 'Gruppenphase', 6, 4, 2, ['09-17', '10-01', '10-22', '11-05', '11-26', '12-10'], [{ from: 1, to: 1, target: 'vf' }], { bestRunnersUp: { count: 2, target: 'vf' } }),
      ko('vf', 'Viertelfinale', 2, ['03-04', '03-18'], 'seeded'), ko('hf', 'Halbfinale', 2, ['04-01', '04-15']), fin('05-20')] },
  { comp: 'ec', from: 1999, to: 2002, field: 32, weekday: 3, ...A(3, true, 'h2h'),
    note: 'Zwei Gruppenphasen; die Gruppendritten der ersten wechseln in die 3. Runde des Europa-Pokals.',
    stages: [groups('gs', '1. Gruppenphase', 8, 4, 2, ['09-14', '09-21', '09-28', '10-19', '10-26', '11-02'],
      [{ from: 1, to: 2, target: 'gs2' }, { from: 3, to: 3, target: 'r3', comp: 'uefa' }]),
    groups('gs2', '2. Gruppenphase', 4, 4, 2, ['11-23', '12-07', '03-01', '03-08', '03-15', '03-22'], [{ from: 1, to: 2, target: 'vf' }]),
    ko('vf', 'Viertelfinale', 2, ['04-05', '04-19'], 'seeded'), ko('hf', 'Halbfinale', 2, ['05-03', '05-10']), fin('05-24')] },
  { comp: 'ec', from: 2003, to: 2003, field: 32, weekday: 3, ...A(3, true, 'h2h'),
    note: 'Acht Vierergruppen, Achtelfinale; die Gruppendritten wechseln in die 3. Runde des Europa-Pokals.',
    stages: [groups('gs', 'Gruppenphase', 8, 4, 2, ['09-17', '10-01', '10-22', '11-05', '11-26', '12-10'],
      [{ from: 1, to: 2, target: 'af' }, { from: 3, to: 3, target: 'r3', comp: 'uefa' }]),
    ...koFrom16(['02-24', '03-10'], ['03-24', '04-07'], ['04-21', '05-05'], '05-26')] },
  { comp: 'ec', from: 2004, to: 2020, field: 32, weekday: 3, ...A(3, true, 'h2h'),
    note: 'Acht Vierergruppen, Achtelfinale; die Gruppendritten wechseln ins Sechzehntelfinale des Europa-Pokals bzw. der Europa-Liga.',
    stages: [groups('gs', 'Gruppenphase', 8, 4, 2, ['09-17', '10-01', '10-22', '11-05', '11-26', '12-10'],
      [{ from: 1, to: 2, target: 'af' }, { from: 3, to: 3, target: 'r32', comp: 'uefa', seed: 1.5 }]),
    ...koFrom16(['02-24', '03-10'], ['04-07', '04-14'], ['04-28', '05-05'], '05-28')] },
  { comp: 'ec', from: 2021, to: 2023, field: 32, weekday: 3, ...A(3, false, 'h2h'),
    note: 'Acht Vierergruppen ohne Auswärtstorregel; die Gruppendritten wechseln in die Zwischenrunde der Europa-Liga.',
    stages: [groups('gs', 'Gruppenphase', 8, 4, 2, ['09-15', '09-29', '10-20', '11-03', '11-24', '12-08'],
      [{ from: 1, to: 2, target: 'af' }, { from: 3, to: 3, target: 'po', comp: 'uefa', seed: 3 }]),
    ...koFrom16(['02-16', '03-09'], ['04-06', '04-13'], ['04-27', '05-04'], '05-28')] },
  { comp: 'ec', from: 2024, to: 9999, field: 36, weekday: 3, ...A(3, false, 'league'),
    note: 'Ligaphase mit 36 Teams und acht Spielen; Platz 1–8 ins Achtelfinale, 9–24 in die Play-offs.',
    stages: [league(8, 4, ['09-18', '10-01', '10-22', '11-05', '11-26', '12-10', '01-21', '01-29']),
      ko('po', 'Play-offs', 2, ['02-11', '02-18'], 'seeded'), ...koFrom16(['03-04', '03-11'], ['04-08', '04-15'], ['04-29', '05-06'], '05-31')] },

  // ---------------- Pokal der Pokalsieger / Konferenz-Liga ----------------
  { comp: 'cwc', from: 1975, to: 1998, field: 16, weekday: 3, ...A(2, true, 'overall'),
    note: 'K.-o.-System mit Hin- und Rückspiel, Endspiel als ein Spiel.',
    stages: [ko('af', 'Achtelfinale', 2, ['10-22', '11-05']), ko('vf', 'Viertelfinale', 2, ['03-03', '03-17']), ko('hf', 'Halbfinale', 2, ['03-31', '04-14']), fin('05-05')] },
  { comp: 'cwc', from: 2021, to: 2023, field: 32, weekday: 4, ...A(3, false, 'h2h'),
    note: 'Acht Vierergruppen; Sieger ins Achtelfinale, Zweite in die Zwischenrunde gegen die Gruppendritten der Europa-Liga.',
    stages: [groups('gs', 'Gruppenphase', 8, 4, 2, ['09-16', '09-30', '10-21', '11-04', '11-25', '12-09'],
      [{ from: 1, to: 1, target: 'af' }, { from: 2, to: 2, target: 'po' }]),
    ko('po', 'Zwischenrunde', 2, ['02-17', '02-24'], 'seeded'), ...koFrom16(['03-10', '03-17'], ['04-07', '04-14'], ['04-28', '05-05'], '05-25')] },
  { comp: 'cwc', from: 2024, to: 9999, field: 36, weekday: 4, ...A(3, false, 'league'),
    note: 'Ligaphase mit 36 Teams und sechs Spielen; Platz 1–8 ins Achtelfinale, 9–24 in die Play-offs.',
    stages: [league(6, 6, ['10-03', '10-24', '11-07', '11-28', '12-12', '12-19']),
      ko('po', 'Play-offs', 2, ['02-13', '02-20'], 'seeded'), ...koFrom16(['03-06', '03-13'], ['04-10', '04-17'], ['05-01', '05-08'], '05-28')] },

  // ---------------- Europa-Pokal / Europa-Liga ----------------
  { comp: 'uefa', from: 1975, to: 1996, field: 32, weekday: 3, ...A(2, true, 'overall'),
    note: 'K.-o.-System mit Hin- und Rückspiel bis einschließlich Finale.',
    stages: [ko('r1', '1. Runde', 2, ['10-22', '11-05']), ko('r2', 'Achtelfinale', 2, ['11-26', '12-10']),
      ko('vf', 'Viertelfinale', 2, ['03-03', '03-17']), ko('hf', 'Halbfinale', 2, ['04-07', '04-21']),
      { key: 'f', name: 'Finale', kind: 'ko', legs: 2, dates: ['05-05', '05-19'], draw: 'none' }] },
  { comp: 'uefa', from: 1997, to: 1998, field: 32, weekday: 3, ...A(3, true, 'overall'),
    note: 'K.-o.-System mit Hin- und Rückspiel, Endspiel als ein Spiel auf neutralem Platz.',
    stages: [ko('r1', '1. Runde', 2, ['10-21', '11-04']), ko('r2', 'Achtelfinale', 2, ['11-25', '12-09']),
      ko('vf', 'Viertelfinale', 2, ['03-03', '03-17']), ko('hf', 'Halbfinale', 2, ['03-31', '04-14']), fin('05-06')] },
  { comp: 'uefa', from: 1999, to: 2002, field: 48, weekday: 3, ...A(3, true, 'overall'),
    note: 'K.-o.-System; in der 3. Runde kommen die Gruppendritten der Meisterliga dazu.',
    stages: [ko('r2', '2. Runde', 2, ['10-21', '11-04']), ko('r3', '3. Runde', 2, ['11-25', '12-09']),
      ko('af', 'Achtelfinale', 2, ['03-02', '03-09']), ko('vf', 'Viertelfinale', 2, ['03-16', '03-23']),
      ko('hf', 'Halbfinale', 2, ['04-06', '04-20']), fin('05-17')] },
  // 2003/04: Die Meisterliga-Gruppen enden erst im Dezember – die 3. Runde liegt im Februar
  // (en.wikipedia.org/wiki/2003–04_UEFA_Cup: 3. Runde 26.02./03.03.2004).
  { comp: 'uefa', from: 2003, to: 2003, field: 48, weekday: 3, ...A(3, true, 'overall'),
    note: 'K.-o.-System; in der 3. Runde kommen die Gruppendritten der Meisterliga dazu.',
    stages: [ko('r2', '2. Runde', 2, ['11-06', '11-27']), ko('r3', '3. Runde', 2, ['02-26', '03-03']),
      ko('af', 'Achtelfinale', 2, ['03-11', '03-25']), ko('vf', 'Viertelfinale', 2, ['04-08', '04-14']),
      ko('hf', 'Halbfinale', 2, ['04-22', '05-06']), fin('05-19')] },
  { comp: 'uefa', from: 2004, to: 2008, field: 40, weekday: 3, ...A(3, true, 'h2h'),
    note: 'Acht Fünfergruppen mit je vier Spielen; die ersten drei und die Gruppendritten der Meisterliga ins Sechzehntelfinale.',
    stages: [groups('gs', 'Gruppenphase', 8, 5, 1, ['10-21', '11-04', '11-25', '12-01', '12-15'], [{ from: 1, to: 3, target: 'r32' }]),
      ko('r32', 'Sechzehntelfinale', 2, ['02-16', '02-24'], 'seeded'), ...koFrom16(['03-09', '03-16'], ['04-06', '04-13'], ['04-27', '05-04'], '05-18', 'free')] },
  { comp: 'uefa', from: 2009, to: 2020, field: 48, weekday: 4, ...A(3, true, 'h2h'),
    note: 'Zwölf Vierergruppen; die ersten zwei und die Gruppendritten der Meisterliga ins Sechzehntelfinale.',
    stages: [groups('gs', 'Gruppenphase', 12, 4, 2, ['09-17', '10-01', '10-22', '11-05', '12-02', '12-17'], [{ from: 1, to: 2, target: 'r32' }]),
      ko('r32', 'Sechzehntelfinale', 2, ['02-18', '02-25'], 'seeded'), ...koFrom16(['03-11', '03-18'], ['04-08', '04-15'], ['04-29', '05-06'], '05-27', 'free')] },
  { comp: 'uefa', from: 2021, to: 2023, field: 32, weekday: 4, ...A(3, false, 'h2h'),
    note: 'Acht Vierergruppen; Sieger ins Achtelfinale, Zweite gegen die Gruppendritten der Meisterliga, Dritte in die Konferenz-Liga.',
    stages: [groups('gs', 'Gruppenphase', 8, 4, 2, ['09-16', '09-30', '10-21', '11-04', '11-25', '12-09'],
      [{ from: 1, to: 1, target: 'af' }, { from: 2, to: 2, target: 'po' }, { from: 3, to: 3, target: 'po', comp: 'cwc', seed: 3 }]),
    ko('po', 'Zwischenrunde', 2, ['02-17', '02-24'], 'seeded'), ...koFrom16(['03-10', '03-17'], ['04-07', '04-14'], ['04-28', '05-05'], '05-18')] },
  { comp: 'uefa', from: 2024, to: 9999, field: 36, weekday: 4, ...A(3, false, 'league'),
    note: 'Ligaphase mit 36 Teams und acht Spielen; Platz 1–8 ins Achtelfinale, 9–24 in die Play-offs.',
    stages: [league(8, 4, ['09-25', '10-03', '10-24', '11-07', '11-28', '12-12', '01-23', '01-30']),
      ko('po', 'Play-offs', 2, ['02-13', '02-20'], 'seeded'), ...koFrom16(['03-06', '03-13'], ['04-10', '04-17'], ['05-01', '05-08'], '05-21')] },
];

/** Format eines Wettbewerbs in einer Saison (Startjahr); `null` = ruht. */
export function euroFormat(comp: EuroCompId, startYear: number): EuroFormat | null {
  return EURO_FORMATS.find((f) => f.comp === comp && startYear >= f.from && startYear <= f.to) ?? null;
}

/** Spielt der Wettbewerb in dieser Saison? */
export function euroCompActive(comp: EuroCompId, startYear: number): boolean {
  return !!euroFormat(comp, startYear);
}

/** Anzeigename je Saison. */
export function euroCompName(comp: EuroCompId, startYear: number): string {
  if (comp === 'ec') return startYear >= 1992 ? 'Meisterliga' : 'Pokal der Landesmeister';
  if (comp === 'cwc') return startYear >= 2021 ? 'Konferenz-Liga' : 'Pokal der Pokalsieger';
  if (startYear < 1971) return 'Messepokal';
  return startYear >= 2009 ? 'Europa-Liga' : 'Europa-Pokal';
}

// -----------------------------------------------------------------------------
// Startplätze für deutsche Vereine nach Rang des Landes (Fünfjahreswertung)
// -----------------------------------------------------------------------------
/** Plätze eines Landes (Rang 1-basiert) je Wettbewerb und Saison. Pokalsieger zählt bei `cup` mit. */
export function accessSlots(startYear: number, rank: number): { ec: number; cwc: number; uefa: number; cupTo: 'cwc' | 'uefa' | 'none' } {
  const y = startYear;
  // Meisterliga
  let ec = 1;
  if (y >= 1997 && y <= 1998) ec = rank <= 8 ? 2 : 1;
  else if (y >= 1999 && y <= 2017) ec = rank <= 3 ? 4 : rank <= 6 ? 3 : rank <= 15 ? 2 : 1;
  else if (y >= 2018) ec = rank <= 4 ? 4 : rank <= 6 ? 3 : rank <= 15 ? 2 : 1;
  // Europa-Pokal / Europa-Liga (inkl. Pokalsieger ab 1999)
  let uefa: number;
  if (y <= 1998) uefa = rank <= 3 ? 4 : rank <= 8 ? 3 : rank <= 21 ? 2 : 1;
  else if (y <= 2008) uefa = rank <= 6 ? 3 : rank <= 15 ? 2 : 1;
  else if (y <= 2020) uefa = rank <= 6 ? 3 : 2;
  else uefa = 2;
  // Pokal der Pokalsieger bzw. Konferenz-Liga
  const cwc = y <= 1998 ? 1 : y >= 2021 ? 1 : 0;
  const cupTo = y <= 1998 ? 'cwc' : 'uefa';
  return { ec, cwc, uefa, cupTo };
}

// -----------------------------------------------------------------------------
// Prämien je Gruppen-/Ligaspiel (nominal, Euro; vor 2002 in DM umgerechnet)
// -----------------------------------------------------------------------------
// Belegt: CL 2005/06 321.000 €/161.000 € (uefa.com „Higher Champions League revenue“),
// 2009/10 800.000 €/400.000 € (uefa.com „Inter lead 2009/10 prize money list“),
// 2016/17 1,5 Mio. €/500.000 € (uefa.com „2016/17 financial distribution“),
// 2024/25 2,1 Mio. €/700.000 € (beinsports.com, Sept. 2024). EL 2010/11 140.000 €/
// 70.000 € (uefa.com „Europa League financial distribution 2010/11“), 2018/19 570.000 €/
// 190.000 € (uefa.com), 2025/26 450.000 €/150.000 € (salaryleaks.com). Conference League
// 400.000 €/133.000 € (salaryleaks.com, 2025/26; für 2021–2023 übernommen).
// Vor 2005 (Meisterliga) und vor 2009 (Europa-Pokal) ist die Kurve eine Schätzung
// (lineare Rückrechnung), dokumentiert als Annahme.
type Pt = [year: number, win: number, draw: number];
const BONUS: Record<EuroCompId, Pt[]> = {
  ec: [[1991, 90_000, 45_000], [1999, 220_000, 110_000], [2005, 321_000, 161_000], [2009, 800_000, 400_000], [2016, 1_500_000, 500_000], [2024, 2_100_000, 700_000]],
  uefa: [[2004, 60_000, 30_000], [2010, 140_000, 70_000], [2018, 570_000, 190_000], [2024, 450_000, 150_000]],
  cwc: [[2021, 400_000, 133_000]],
};
/** Prämie je Sieg/Remis in Gruppe/Liga, nominal in Euro (Fortschreibung = letzter Stand). */
export function groupBonusEur(comp: EuroCompId, year: number): { win: number; draw: number } {
  const pts = BONUS[comp];
  if (year <= pts[0][0]) return { win: pts[0][1], draw: pts[0][2] };
  for (let i = 1; i < pts.length; i++) {
    const [y1, w1, d1] = pts[i - 1], [y2, w2, d2] = pts[i];
    if (year <= y2) {
      const t = (year - y1) / (y2 - y1);
      return { win: Math.round(w1 + (w2 - w1) * t), draw: Math.round(d1 + (d2 - d1) * t) };
    }
  }
  const last = pts[pts.length - 1];
  return { win: last[1], draw: last[2] };
}

// -----------------------------------------------------------------------------
// Landespokal (Vorbild DFB-Pokal): Wiederholungsspiele
// -----------------------------------------------------------------------------
// en.wikipedia.org/wiki/DFB-Pokal: „If the score was still level after 120 minutes, the
// game was replayed with the home field right reversed“; seit 1970 Elfmeterschießen,
// wenn auch die Wiederholung unentschieden endet; nach der Final-Wiederholung 1977
// (1. FC Köln – Hertha BSC 1:1 n. V., 1:0) „the DFB opted not to replay cup finals“,
// „this change was extended to all cup games in 1991“.
/** Wird ein Unentschieden nach Verlängerung wiederholt? (Saison-Startjahr) */
export function cupReplay(startYear: number, isFinal: boolean): boolean {
  return isFinal ? startYear <= 1976 : startYear <= 1990;
}

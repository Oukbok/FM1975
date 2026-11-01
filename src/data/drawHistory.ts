// =============================================================================
// Pokalauslosungen je Epoche: Termine, Orte, Regeln (Recherche, Stand 11/2026).
//
// Landespokal (Vorbild DFB-Pokal)
//   • Bis 1981/82 ein Lostopf, der zuerst gezogene Verein hat Heimrecht.
//   • Seit 1982/83 zwei Töpfe (Profis / Amateure); Amateurvereine haben gegen
//     Profis Heimrecht (en.wikipedia.org/wiki/DFB-Pokal: „Since 1982, teams from
//     the pot containing amateur teams have played the game at home“; DFB-Modus:
//     „In Spielen zwischen Profi- und Amateurmannschaft hat der Amateur Heimrecht“).
//   • Auslosung im Fernsehen am Wochenende nach der Runde; seit 2017/18 sonntags
//     in der Sportschau aus dem Deutschen Fußballmuseum Dortmund (DFB/ARD 2017,
//     erste Ziehung 11.06.2017, 2. Runde 20.08.2017). Die 1. Runde wird heute im
//     Juni gelost (15.06.2025, 06.06.2026); im Spiel beginnt die Saison am 1. Juli,
//     daher liegt diese Ziehung auf dem ersten Sonntag nach dem Saisonstart.
//   • Finale: keine Ziehung, die Halbfinalsieger stehen fest.
// Europapokal
//   • 1. Runde im Juli in Zürich (z. B. 05.07.1977, playupliverpool.com: „made
//     to-day in Zurich“), Titelverteidiger gesetzt.
//   • 1990er: alle Ziehungen in Genf (1992/93: Vorrunde 15.07.1992, 2. Runde
//     02.10.1992, en.wikipedia.org/wiki/1992–93_UEFA_Champions_League).
//   • Ab 1998: Ziehung der ersten Runde Ende August in Monaco rund um den
//     Supercup (UEFA-Pokal 1999/2000: 27.08.1999, sportcal.com); Folgerunden in
//     Nyon (UEFA-Sitz seit 1995).
//   • Setzliste nach Wertung (RSSSF-FAQ: „a number of strong teams is seeded“),
//     Länderschutz in den ersten Runden (Vereine eines Verbands treffen nicht
//     aufeinander).
// Vereinfachung im Spiel: Europapokal ohne Gruppenphase, ein Spiel je Runde.
// =============================================================================
import type { DrawComp, DrawStage } from '../types/draw';

const DAY = 86400000;
const toMs = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDaysIso = (iso: string, n: number) => toIso(toMs(iso) + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
/** Erster Tag mit Wochentag `wd` (0 = So … 6 = Sa) am oder nach `iso`. */
export function onOrAfterWeekday(iso: string, wd: number): string {
  const d = new Date(toMs(iso)).getUTCDay();
  return addDaysIso(iso, (wd - d + 7) % 7);
}
/** Erster Tag mit Wochentag `wd` strikt nach `iso`. */
const afterWeekday = (iso: string, wd: number) => onOrAfterWeekday(addDaysIso(iso, 1), wd);

/** Regeln einer Ziehung (je Wettbewerb, Runde und Saison). */
export interface DrawRules {
  /** Zwei Töpfe Profis/Amateure (nur Landespokal, 1. Runde). */
  twoPots: boolean;
  /** Amateure empfangen Profis (alle Runden außer Finale). */
  amateurHome: boolean;
  /** Gesetzte gegen ungesetzte Vereine. */
  seeded: boolean;
  /** Vereine eines Landes treffen nicht aufeinander. */
  countryProtection: boolean;
}

export function drawRulesFor(comp: DrawComp, roundIndex: number, startYear: number): DrawRules {
  if (comp === 'cup') {
    const modern = startYear >= 1982;
    return { twoPots: modern && roundIndex === 0, amateurHome: modern, seeded: false, countryProtection: false };
  }
  // Europapokal: Setzliste und Länderschutz in der ersten Runde, im Europa-Pokal
  // (größtes Feld) auch in der zweiten.
  const early = roundIndex === 0 || (comp === 'uefa' && roundIndex === 1);
  return { twoPots: false, amateurHome: false, seeded: roundIndex === 0, countryProtection: early };
}

/** Bühne und Ort der Ziehung. */
export function drawVenue(comp: DrawComp, roundIndex: number, startYear: number): { venue: string; stage: DrawStage; show: string } {
  if (comp === 'cup') {
    if (startYear >= 2017) return { venue: 'Fußballmuseum Dortmund', stage: 'museum', show: 'Sonntagabend, Sportsendung live' };
    if (startYear >= 1990) return { venue: 'Fernsehstudio', stage: 'studio90', show: 'Samstagabend, Sportstudio' };
    return { venue: 'Fernsehstudio', stage: 'studio70', show: 'Samstagabend, Sportstudio' };
  }
  if (startYear >= 1998 && roundIndex === 0) return { venue: 'Monaco', stage: 'uefaGala', show: 'Gala-Auslosung zum Supercup' };
  if (startYear >= 1995) return { venue: 'Nyon', stage: 'uefa90', show: 'Verbandssitz des Europa-Verbands' };
  if (startYear >= 1990) return { venue: 'Genf', stage: 'uefa90', show: 'Auslosung des Europa-Verbands' };
  return { venue: 'Zürich', stage: 'uefa70', show: 'Auslosung des Europa-Verbands' };
}

/**
 * Termin der Ziehung einer Runde. `null` = keine Ziehung mit Show (Finale: die
 * Paarung steht direkt nach dem Halbfinale fest). Garantiert: nach der Vorrunde
 * (bzw. nach Saisonstart) und mindestens 3 Tage vor dem Spieltermin.
 */
export function drawDateFor(
  comp: DrawComp, roundIndex: number, roundCount: number, startYear: number,
  roundDate: string, prevRoundDate: string | null, seasonStart: string,
): string | null {
  if (roundIndex >= roundCount - 1) return null;
  const latest = addDaysIso(roundDate, -3);
  const earliest = prevRoundDate ? addDaysIso(prevRoundDate, 1) : addDaysIso(seasonStart, 1);
  let d: string;
  if (roundIndex === 0) {
    if (comp === 'cup') {
      d = startYear >= 2017
        ? onOrAfterWeekday(addDaysIso(seasonStart, 1), 0) // Sonntag nach Saisonstart (historisch Juni)
        : onOrAfterWeekday(`${startYear}-07-15`, 6);       // Samstag Mitte Juli, Sommerpause
    } else if (startYear >= 1998) {
      d = onOrAfterWeekday(`${startYear}-08-25`, 5);       // Freitag Ende August, Monaco
    } else if (startYear >= 1990) {
      d = onOrAfterWeekday(`${startYear}-07-10`, 3);       // Mittwoch Mitte Juli, Genf
    } else {
      d = onOrAfterWeekday(`${startYear}-07-05`, 2);       // Dienstag Anfang Juli, Zürich
    }
  } else if (comp === 'cup') {
    d = afterWeekday(prevRoundDate!, startYear >= 2017 ? 0 : 6);
  } else {
    // Europapokal: Freitag nach der Runde; über den Winter Mitte Dezember.
    d = afterWeekday(prevRoundDate!, 5);
    if (daysBetween(prevRoundDate!, roundDate) > 70) {
      const dec = onOrAfterWeekday(`${startYear}-12-11`, 5);
      if (dec > d && dec <= latest) d = dec;
    }
  }
  if (d < earliest) d = earliest;
  if (d > latest) d = latest < earliest ? earliest : latest;
  return d;
}

/** Rundenname mit Artikel: „die 1. Hauptrunde“ / „das Achtelfinale“ (gen: „der …“ / „des Achtelfinales“). */
export function roundArticle(name: string, kasus: 'nom' | 'gen' = 'nom'): string {
  const fem = /^\d/.test(name);
  if (kasus === 'gen') return fem ? `der ${name}` : `des ${name}s`;
  return fem ? `die ${name}` : `das ${name}`;
}

/** Saison-Startjahr aus einem Datum (Juli–Dezember = laufendes Jahr). */
export function seasonStartYearOf(iso: string): number {
  const y = Number(iso.slice(0, 4));
  return Number(iso.slice(5, 7)) >= 7 ? y : y - 1;
}

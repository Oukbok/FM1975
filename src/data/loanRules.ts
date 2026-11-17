// =============================================================================
// LEIHREGELN JE EPOCHE UND LAND (Wunsch Pascal: Leihen mit realistischen Bedingungen)
// -----------------------------------------------------------------------------
// Quellen (gelesen November 2026, Werte gerundet bzw. vereinfacht):
//  [1] FIFA, „Neue Leihgabenregelung der FIFA“ (inside.fifa.com, 2022): ab 1.7.2022
//      schriftliche Vereinbarung mit Dauer und Finanzen, Laufzeit mindestens von einem
//      Registrierungszeitraum zum nächsten und höchstens ein Jahr, keine Weiterverleihung,
//      höchstens drei Profis zwischen denselben zwei Vereinen, Höchstzahl ver-/ausgeliehener
//      Profis je Verein 8 (2022/23), 7 (2023/24), 6 (ab 2024/25); Spieler bis 21 und
//      vom Verein ausgebildete Spieler ausgenommen; nationale Regeln innerhalb von drei
//      Jahren anzugleichen.
//  [2] DFL-Mitgliederversammlung (bundesliga.com „Changes to loan player regulations
//      in Germany“, flashscore.de „DFL ändert Leihspieler-Regeln“, Dezember 2025):
//      nationale Leihbegrenzung von sechs Spielern; U21-Lizenzspieler mit Local-Player-
//      Status ausgenommen. Das Jahr des ersten Inkrafttretens nennen die Artikel nicht –
//      im Spiel ab 2025/26 (Ablauf der Drei-Jahres-Frist aus [1]).
//  [3] 90min.de „Tuchel klagt über fehlende Klausel bei Stanisic“ (2024): In der
//      Bundesliga dürfen Leihspieler gegen ihren Stammverein spielen – es gibt keine
//      Ligaregel; der Stammverein kann höchstens eine Absprache treffen.
//  [4] Wikipedia (en) „Loan (sports)“: Premier League Regel M.6 – Leihspieler dürfen
//      nicht gegen den Verein antreten, dem sie gehören. Das Einführungsjahr nennt der
//      Artikel nicht; im Spiel gilt die Regel in England ab 1992/93 (Gründung der
//      Premier League, Annahme).
//  [5] Wilke (2024), „Leihtransfers im Profifußball“ (Ostfalia, Abschlussarbeit): Leihen
//      in den 1990ern „noch nicht verbreitet“; Bundesliga 75 Leihen 2003/04, 228 zwanzig
//      Jahre später; Leihgebühr als Anzahlung, Kaufoption meist in Höhe des Marktwerts,
//      Kaufpflicht oft an Aufstieg, Klassenerhalt oder Einsätze geknüpft, Gehalt wird
//      anteilig übernommen; Mindesteinsätze nur als denkbare Klausel; vorzeitige
//      Abbrüche zum Winter kommen vor.
// Vereinfachungen: Transferfenster wie bei Wechseln (Juli/August, Januar –
// game/transferTalks.ts `inTransferWindow`); die Höchstzahlen gelten im Spiel für alle
// Leihen des Vereins (international und national zusammen); Leihen innerhalb derselben
// Liga sind in Deutschland und England erlaubt.
// =============================================================================

export type ParentPlay = 'free' | 'clause' | 'banned';

export interface LoanRules {
  /** Saison-Startjahr. */
  year: number;
  /** Wie üblich Leihen sind (0–1): bestimmt, wie offen Vereine dafür sind und wie oft sie anfragen. */
  frequency: number;
  /** Höchstens so viele ver- bzw. ausgeliehene Profis je Verein (ohne Ausnahmen); null = keine Grenze. */
  maxLoans: number | null;
  /** Höchstens so viele Leihen zwischen denselben zwei Vereinen; null = keine Grenze. */
  samePair: number | null;
  /** Ausnahme von den Höchstzahlen: Spieler bis zu diesem Alter (und vom Verein ausgebildete). */
  exemptAge: number | null;
  /** Längste Laufzeit in Spielzeiten (1 = bis Saisonende, 2 = über zwei Spielzeiten). */
  maxSeasons: 1 | 2;
  /** Weiterverleihung: per Regel verboten oder nur per Vertragsklausel auszuschließen. */
  sublet: 'banned' | 'clause';
  /** Einsatz gegen den Stammverein: frei, per Absprache auszuschließen oder per Ligaregel verboten. */
  parentPlay: ParentPlay;
  /** Welche Klauseln es in der Epoche gibt (Jahr der Freischaltung in LOAN_CLAUSE_FROM). */
  clauses: { option: boolean; obligation: boolean; minApps: boolean; recall: boolean };
  /** Leihgebühren sind üblich (vorher meist nur Gehaltsübernahme). */
  feeCommon: boolean;
  /** Erklärsätze für Seite und Wiki. */
  notes: string[];
}

/** Ab wann es welche Leihklauseln gibt (deutscher Markt, vereinfacht nach [5]). */
export const LOAN_CLAUSE_FROM = {
  /** Leihe mit Kaufoption (wie CLAUSE_FROM.loanOption in engine/transferMarket.ts). */
  option: 2000,
  /** Kaufpflicht unter Bedingungen (Einsätze, Klassenerhalt). */
  obligation: 2010,
  /** Einsatzgarantie mit Strafzahlung. */
  minApps: 2000,
  /** Rückrufklausel zum Winter. */
  recall: 1995,
  /** Leihgebühr als üblicher Bestandteil. */
  fee: 1990,
} as const;

/** FIFA-Höchstzahlen ab 2022/23 [1]. */
const FIFA_CAP: [number, number][] = [[2022, 8], [2023, 7], [2024, 6]];

/** Wie häufig Leihen in der Epoche sind (0–1) – 70er selten, ab den 2000ern üblich [5]. */
export function loanFrequency(year: number): number {
  return year < 1985 ? 0.25 : year < 1995 ? 0.55 : year < 2005 ? 0.85 : 1;
}

/** Leihregeln einer Saison im Heimatland (`cc` = Ländercode aus data/world/countries.ts). */
export function loanRulesFor(year: number, cc = 'ger'): LoanRules {
  const fifa = year >= 2022;
  const fifaCap = fifa ? [...FIFA_CAP].reverse().find(([y]) => year >= y)![1] : null;
  // Nationale Begrenzung: Deutschland ab 2025/26 sechs [2]; andere Länder gleichen bis dahin an [1].
  const national = year >= 2025 ? 6 : null;
  const maxLoans = national ?? fifaCap;
  const parentPlay: ParentPlay = cc === 'eng' && year >= 1992 ? 'banned' : 'clause';
  const notes: string[] = [];
  notes.push(year < 1985 ? 'Leihen sind selten – die meisten Vereine geben Spieler lieber ganz ab oder behalten sie.'
    : year < 1995 ? 'Leihen kommen vor, sind aber noch nicht verbreitet.'
      : year < 2005 ? 'Leihen werden üblich, vor allem für junge Spieler, die Spielpraxis brauchen.'
        : 'Leihen gehören zum Alltag: Talente sammeln Spielpraxis, Ergänzungsspieler werden geparkt.');
  notes.push('Leihen beginnen nur im Transferfenster (Juli/August, Januar); eine Einigung außerhalb wird zum nächsten Fenster vollzogen.');
  notes.push(year >= 2022 ? 'Laufzeit höchstens ein Jahr (FIFA), mindestens bis zum nächsten Transferfenster.'
    : year >= 1990 ? 'Laufzeit: eine halbe Saison, bis Saisonende oder über zwei Spielzeiten.' : 'Laufzeit: eine halbe Saison oder bis Saisonende.');
  if (maxLoans != null) notes.push(`Höchstens ${maxLoans} ver- bzw. ausgeliehene Profis je Verein, höchstens 3 zwischen denselben Vereinen; Spieler bis 21 und Eigengewächse zählen nicht mit.`);
  else notes.push('Keine Höchstzahl für Leihspieler.');
  notes.push(year >= 2022 ? 'Weiterverleihen ist verboten (FIFA).' : 'Weiterverleihen ist erlaubt, wenn der Vertrag es nicht ausschließt.');
  notes.push(parentPlay === 'banned' ? 'Ligaregel: Leihspieler dürfen nicht gegen ihren Stammverein spielen.'
    : 'Leihspieler dürfen gegen ihren Stammverein spielen – ausschließen lässt sich das nur per Absprache.');
  return {
    year, frequency: loanFrequency(year), maxLoans, samePair: fifa ? 3 : null, exemptAge: fifa ? 21 : null,
    maxSeasons: year >= 2022 ? 1 : year >= 1990 ? 2 : 1, sublet: fifa ? 'banned' : 'clause', parentPlay,
    clauses: { option: year >= LOAN_CLAUSE_FROM.option, obligation: year >= LOAN_CLAUSE_FROM.obligation, minApps: year >= LOAN_CLAUSE_FROM.minApps, recall: year >= LOAN_CLAUSE_FROM.recall },
    feeCommon: year >= LOAN_CLAUSE_FROM.fee, notes,
  };
}

/** Quellen für Wiki und Regel-Box. */
export const LOAN_SOURCES: string[] = [
  'FIFA: Neue Leihgabenregelung (2022) – Höchstzahlen 8/7/6, drei je Vereinspaar, U21 und Eigengewächse ausgenommen, höchstens ein Jahr, keine Weiterverleihung.',
  'DFL-Mitgliederversammlung (Dezember 2025): nationale Leihbegrenzung von sechs Spielern, U21 mit Local-Player-Status ausgenommen.',
  'Bundesliga 2023/24 (Fall eines verliehenen Verteidigers gegen seinen Stammverein): keine Ligaregel gegen Einsätze gegen den Stammverein.',
  'Premier League, Regel M.6: Leihspieler dürfen nicht gegen den Stammverein spielen (Einführungsjahr im Spiel angenommen: 1992/93).',
  'Wilke (2024), Leihtransfers im Profifußball: 75 Bundesliga-Leihen 2003/04, 228 im Jahr 2023/24; Kaufoption meist zum Marktwert, Kaufpflicht an Einsätze/Klassenerhalt gebunden, Gehalt anteilig.',
];

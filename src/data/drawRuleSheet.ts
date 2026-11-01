// =============================================================================
// „Regeln dieser Runde“ für den Startbildschirm der Auslosung.
//
// Grundsatz: Die Zeilen beschreiben, was die Engine TATSÄCHLICH spielt
// (engine/cup.ts `simulateCupTie`, engine/euro.ts `simulateEuroTie`):
//   • jede Runde ein einziges Spiel (auch im Europapokal, kein Hin-/Rückspiel),
//   • bei Unentschieden Verlängerung, dann Elfmeterschießen – in allen Epochen,
//   • reines K.-o.-System ohne Gruppenphase.
// Wo das historische Vorbild anders war, steht das als „Im Original“-Hinweis dabei.
//
// Quellen (abgerufen 11/2026):
//   • Wiederholungsspiele im DFB-Pokal: en.wikipedia.org/wiki/DFB-Pokal – „the game
//     was replayed with the home field right reversed“; nach der Final-Wiederholung
//     1977 „the DFB opted not to replay cup finals in the future“; „this change was
//     extended to all cup games in 1991“. Bestätigt durch 1990–91 DFB-Pokal (beide
//     Halbfinals wiederholt) und 1991–92 DFB-Pokal („had decided not to hold replays
//     any more“, Halbfinals im Elfmeterschießen).
//   • Elfmeterschießen erst nach unentschiedener Wiederholung: ebd. („decided to hold
//     a penalty shootout if the replay was another draw“, ab 1970).
//   • Heimrecht der Amateure seit 1982: ebd. („Since 1982, teams from the pot
//     containing amateur teams have played the game at home“).
//   • Auswärtstorregel: UEFA, „Abolition of the away goals rule in all UEFA club
//     competitions“ (24.06.2021, gilt ab 2021/22); vorher seit Mitte der 1960er.
//   • Hin- und Rückspiel im Europapokal; Endspiel des Landesmeister- und Pokalsieger-
//     Wettbewerbs als ein Spiel, UEFA-Pokal-Finale mit Rückspiel bis 1996/97
//     (siehe data/briefings/differences.ts).
//   • Gruppenphase im Landesmeister-Wettbewerb ab 1991/92 (en.wikipedia.org/wiki/
//     1991–92_European_Cup), im UEFA-Pokal ab 2004/05; Pokal der Pokalsieger
//     zuletzt 1998/99 (differences.ts).
// =============================================================================
import type { DrawComp } from '../types/draw';
import type { DrawRules } from './drawHistory';

export interface RuleItem {
  /** Kurzer Titel (Großbuchstaben in der Anzeige). */
  title: string;
  /** So spielt es das Spiel. */
  text: string;
  /** Abweichung im historischen Vorbild (optional). */
  history?: string;
}

const seasonLabel = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;

/** Was die Engine bei Unentschieden macht (für Test und Anzeige). */
export const ENGINE_TIEBREAK = 'Verlängerung über zweimal 15 Minuten, danach Elfmeterschießen.';

export interface RuleSheetInput {
  comp: DrawComp;
  roundIndex: number;
  roundNames: string[];
  startYear: number;
  rules: DrawRules;
  /** Anzahl Lostöpfe der Ziehung (1 = freie Ziehung). */
  potCount: number;
}

export function ruleSheet(inp: RuleSheetInput): RuleItem[] {
  const { comp, roundIndex, roundNames, startYear: y, rules, potCount } = inp;
  const isFinal = roundIndex >= roundNames.length - 1;
  const euro = comp !== 'cup';
  const out: RuleItem[] = [];

  // 1) Modus
  let modeHist: string | undefined;
  if (euro) {
    const finalOneLeg = isFinal && (comp !== 'uefa' || y >= 1997);
    if (!finalOneLeg) modeHist = 'Im Original Hin- und Rückspiel – das Gesamtergebnis entscheidet.';
  }
  out.push({ title: 'Ein Spiel', text: 'Kein Hin- und Rückspiel: Die eine Partie entscheidet über das Weiterkommen.', history: modeHist });

  // 2) Unentschieden
  let tieHist: string | undefined;
  if (comp === 'cup') {
    if (!isFinal && y <= 1990) tieHist = 'Im Original bis 1990/91: Wiederholungsspiel mit getauschtem Heimrecht, erst danach Elfmeterschießen.';
    if (isFinal && y <= 1976) tieHist = 'Im Original wird ein unentschiedenes Endspiel wiederholt (zuletzt 1977).';
  }
  out.push({ title: 'Bei Unentschieden', text: ENGINE_TIEBREAK, history: tieHist });

  // 3) Auswärtstore (nur Europapokal)
  if (euro) {
    out.push({
      title: 'Auswärtstore',
      text: 'Zählen nicht doppelt – bei einem einzigen Spiel gibt es keine Auswärtstorregel.',
      history: y <= 2020
        ? 'Im Original zählen bei Torgleichstand nach Hin- und Rückspiel Auswärtstore doppelt (bis 2020/21).'
        : 'Im Original seit 2021/22 abgeschafft – nach Gleichstand folgt die Verlängerung.',
    });
  }

  // 4) Lostöpfe
  if (potCount >= 2 && rules.twoPots) {
    out.push({ title: 'Zwei Lostöpfe', text: 'Amateure und Profis getrennt. Jede Paarung beginnt mit einer Kugel aus dem Amateurtopf.' });
  } else if (potCount >= 2 && rules.seeded) {
    out.push({ title: 'Setzliste', text: 'Die stärkere Hälfte ist gesetzt und trifft nur auf ungesetzte Vereine.' });
  } else {
    out.push({ title: 'Ein Lostopf', text: 'Freie Ziehung – jeder kann auf jeden treffen.' });
  }

  // 5) Heimrecht
  if (rules.amateurHome) {
    out.push({ title: 'Heimrecht', text: 'Amateurvereine empfangen Profis immer zu Hause, sonst spielt der zuerst gezogene Verein daheim.' });
  } else if (potCount >= 2 && rules.seeded) {
    out.push({ title: 'Heimrecht', text: 'Je Paarung entscheidet das Los, aus welchem Topf die erste Kugel kommt – sie hat Heimrecht.' });
  } else {
    out.push({
      title: 'Heimrecht', text: 'Der zuerst gezogene Verein spielt zu Hause.',
      history: comp === 'cup' && y < 1982 ? 'Das Heimrecht für Amateure gegen Profis gibt es im Original erst ab 1982/83.' : undefined,
    });
  }

  // 6) Länderschutz
  if (rules.countryProtection) out.push({ title: 'Länderschutz', text: 'Vereine aus demselben Land treffen in dieser Runde nicht aufeinander.' });

  // 7) Weiterkommen + Format-Abweichungen des Vorbilds
  const next = roundNames[roundIndex + 1];
  let fmtHist: string | undefined;
  if (comp === 'ec' && y >= 1991) fmtHist = 'Im Original spielt der Landesmeister-Wettbewerb seit 1991/92 eine Gruppenphase; im Spiel bleibt es beim K.-o.-System.';
  if (comp === 'uefa' && y >= 2004) fmtHist = 'Im Original hat der Europa-Pokal seit 2004/05 eine Gruppenphase; im Spiel bleibt es beim K.-o.-System.';
  if (comp === 'cwc' && y >= 1999) fmtHist = `Im Original wurde der Pokal der Pokalsieger nach 1998/99 eingestellt – im Spiel läuft er auch ${seasonLabel(y)} weiter.`;
  out.push({
    title: 'Weiterkommen',
    text: isFinal ? 'Der Sieger gewinnt den Pokal.' : next === 'Finale' ? 'Die Sieger bestreiten das Finale.' : `Die Sieger erreichen ${articleAcc(next)}; danach wird neu gelost.`,
    history: fmtHist,
  });
  return out;
}

/** „das Achtelfinale“ / „die 2. Runde“ (Akkusativ). */
function articleAcc(name: string): string {
  return /^\d/.test(name) ? `die ${name}` : `das ${name}`;
}

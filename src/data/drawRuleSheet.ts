// =============================================================================
// „Regeln dieser Runde“ für den Startbildschirm der Auslosung.
//
// Grundsatz: Die Zeilen beschreiben, was die Engine spielt – seit Europapokal 2.0
// (game/euroFlow.ts, game/cupReplay.ts) ist das das historische Vorbild der Saison:
//   • Europapokal: Format je Saison aus data/euroFormats.ts (Hin- und Rückspiel,
//     Endspiel einzeln bzw. UEFA-Pokal-Finale mit Rückspiel bis 1996/97, Auswärtstore
//     bis 2020/21 auch in der Verlängerung, Gruppen, Ligaphase, Wechsel der Gruppendritten).
//   • Landespokal: Wiederholungsspiel bis 1990/91 (Endspiel bis 1976/77), danach
//     Verlängerung und Elfmeterschießen (data/euroFormats.ts `cupReplay`).
// Quellen stehen in data/euroFormats.ts und data/drawHistory.ts.
// Alte Spielstände (Wettbewerb ohne `v2`) spielen die laufende Saison noch im alten
// Modus: ein Spiel, Verlängerung und Elfmeterschießen (`legacy`).
// =============================================================================
import type { DrawComp } from '../types/draw';
import type { DrawRules } from './drawHistory';
import { cupReplay, euroCompName, euroFormat, type StageSpec } from './euroFormats';

export interface RuleItem {
  /** Kurzer Titel (Großbuchstaben in der Anzeige). */
  title: string;
  /** So spielt es das Spiel. */
  text: string;
  /** Abweichung im historischen Vorbild (nur noch für alte Spielstände bzw. Vereinfachungen). */
  history?: string;
}

/** Alter Modus (Spielstände vor Europapokal 2.0): ein Spiel, Verlängerung, Elfmeter. */
export const ENGINE_TIEBREAK = 'Verlängerung über zweimal 15 Minuten, danach Elfmeterschießen.';

export interface RuleSheetInput {
  comp: DrawComp;
  roundIndex: number;
  roundNames: string[];
  startYear: number;
  rules: DrawRules;
  /** Anzahl Lostöpfe der Ziehung (1 = freie Ziehung). */
  potCount: number;
  /** Wettbewerb läuft noch im alten Modus (alter Spielstand, bis Saisonende). */
  legacy?: boolean;
}

/** „das Achtelfinale“ / „die 2. Runde“ (Akkusativ). */
function articleAcc(name: string): string {
  return /^\d/.test(name) ? `die ${name}` : /phase$/i.test(name) ? `die ${name}` : `das ${name}`;
}

export function ruleSheet(inp: RuleSheetInput): RuleItem[] {
  const { comp, roundIndex, roundNames, startYear: y, rules, potCount } = inp;
  const out: RuleItem[] = [];
  if (comp === 'cup' || inp.legacy) {
    const isFinal = roundIndex >= roundNames.length - 1;
    if (comp === 'cup' && !inp.legacy) {
      out.push({ title: 'Ein Spiel', text: 'Ein Spiel entscheidet über das Weiterkommen.' });
      out.push(cupReplay(y, isFinal)
        ? { title: 'Bei Unentschieden', text: 'Verlängerung. Steht es danach noch unentschieden, gibt es ein Wiederholungsspiel mit getauschtem Heimrecht; endet auch die Wiederholung unentschieden, folgt das Elfmeterschießen.' }
        : { title: 'Bei Unentschieden', text: ENGINE_TIEBREAK });
    } else {
      out.push({ title: 'Ein Spiel', text: 'Kein Hin- und Rückspiel: Die eine Partie entscheidet (laufende Saison noch im alten Modus).' });
      out.push({ title: 'Bei Unentschieden', text: ENGINE_TIEBREAK, history: 'Ab der nächsten Saison gelten die historischen Regeln dieser Zeit.' });
    }
    pushDrawRules(out, comp, y, rules, potCount);
    const next = roundNames[roundIndex + 1];
    out.push({ title: 'Weiterkommen', text: isFinal ? 'Der Sieger gewinnt den Pokal.' : next === 'Finale' ? 'Die Sieger bestreiten das Finale.' : `Die Sieger erreichen ${articleAcc(next)}; danach wird neu gelost.` });
    return out;
  }

  const fmt = euroFormat(comp, y);
  const st: StageSpec | undefined = fmt?.stages[roundIndex];
  if (!fmt || !st) return [{ title: 'Ein Spiel', text: 'Ein Spiel entscheidet.' }];
  const name = euroCompName(comp, y);

  // 1) Modus
  if (st.kind === 'groups') {
    out.push({
      title: 'Gruppenphase',
      text: `${st.groups} Gruppen mit je ${st.size} Vereinen; ${st.rr === 2 ? 'Hin- und Rückspiel gegen jeden Gruppengegner' : 'jeder spielt einmal gegen jeden (zwei Heim-, zwei Auswärtsspiele)'}. Sieg ${fmt.winPts} Punkte, Unentschieden 1 Punkt.`,
    });
    out.push({
      title: 'Bei Punktgleichheit',
      text: fmt.tiebreak === 'h2h' ? 'Zuerst der direkte Vergleich (Punkte, Tordifferenz, Tore, Auswärtstore), dann Tordifferenz und Tore aller Gruppenspiele.'
        : 'Tordifferenz, dann erzielte Tore, dann Auswärtstore.',
    });
  } else if (st.kind === 'league') {
    out.push({ title: 'Ligaphase', text: `Eine Tabelle für alle ${fmt.field} Vereine, ${st.matches} Spiele gegen ${st.matches} verschiedene Gegner. Sieg 3 Punkte, Unentschieden 1 Punkt.` });
    out.push({ title: 'Bei Punktgleichheit', text: 'Tordifferenz, erzielte Tore, Auswärtstore, Siege, Auswärtssiege.' });
  } else if (st.legs === 2) {
    out.push({ title: 'Hin- und Rückspiel', text: 'Das Gesamtergebnis aus beiden Spielen entscheidet. Das Heimrecht im Rückspiel hat der Gegner des Hinspiels.' });
    out.push(fmt.awayGoals
      ? { title: 'Auswärtstore', text: 'Bei gleichem Gesamtergebnis kommt weiter, wer mehr Tore auswärts erzielt hat – auch Tore in der Verlängerung des Rückspiels zählen.' }
      : { title: 'Auswärtstore', text: 'Zählen nicht mehr doppelt (seit 2021/22 abgeschafft).' });
    out.push({ title: 'Bei Gleichstand', text: `${fmt.awayGoals ? 'Auch nach Auswärtstoren gleich: ' : 'Gleiches Gesamtergebnis: '}Verlängerung im Rückspiel, danach Elfmeterschießen. Im Hinspiel gibt es keine Verlängerung.` });
  } else {
    out.push({ title: 'Ein Spiel', text: st.draw === 'fixed' ? 'Ein Spiel im Stadion des Gruppensiegers.' : roundIndex === fmt.stages.length - 1 ? 'Endspiel als ein Spiel auf neutralem Platz.' : 'Ein Spiel entscheidet.' });
    out.push({ title: 'Bei Unentschieden', text: ENGINE_TIEBREAK });
  }

  // 2) Ziehung
  if (st.kind === 'groups' || st.kind === 'league') {
    out.push({ title: 'Lostöpfe', text: st.kind === 'league' ? `${st.pots} Töpfe nach Stärke; ${st.matches === 8 ? 'aus jedem Topf zwei Gegner (einer daheim, einer auswärts)' : 'aus jedem Topf ein Gegner'}.` : 'Töpfe nach Stärke (bzw. Sieger/Zweite der Vorrunde), aus jedem Topf ein Verein je Gruppe.' });
    out.push({ title: 'Länderschutz', text: st.kind === 'league' ? 'Keine Gegner aus dem eigenen Land.' : 'Vereine eines Landes kommen nicht in dieselbe Gruppe.' });
  } else if (st.draw === 'seeded') {
    out.push({ title: 'Setzliste', text: 'Gesetzt sind die besser Platzierten; sie treffen auf Ungesetzte und haben das Rückspiel daheim. Kein Duell aus derselben Gruppe oder demselben Land.' });
  } else {
    pushDrawRules(out, comp, y, rules, potCount);
  }

  // 3) Weiterkommen (inkl. Wechsel in andere Wettbewerbe)
  out.push({ title: 'Weiterkommen', text: advanceText(st, fmt.stages, roundIndex, y) });
  if (roundIndex === 0) out.push({ title: `Format ${name}`, text: `${fmt.note} Qualifikationsrunden werden nicht ausgespielt – das Feld beginnt mit dieser Runde.` });
  return out;
}

function pushDrawRules(out: RuleItem[], comp: DrawComp, y: number, rules: DrawRules, potCount: number): void {
  if (potCount >= 2 && rules.twoPots) out.push({ title: 'Zwei Lostöpfe', text: 'Amateure und Profis getrennt. Jede Paarung beginnt mit einer Kugel aus dem Amateurtopf.' });
  else if (potCount >= 2 && rules.seeded) out.push({ title: 'Setzliste', text: 'Die stärkere Hälfte ist gesetzt und trifft nur auf ungesetzte Vereine.' });
  else out.push({ title: 'Ein Lostopf', text: 'Freie Ziehung – jeder kann auf jeden treffen.' });
  if (rules.amateurHome) out.push({ title: 'Heimrecht', text: 'Amateurvereine empfangen Profis immer zu Hause, sonst spielt der zuerst gezogene Verein daheim.' });
  else if (potCount >= 2 && rules.seeded) out.push({ title: 'Heimrecht', text: 'Je Paarung entscheidet das Los, aus welchem Topf die erste Kugel kommt – sie hat (zuerst) Heimrecht.' });
  else out.push({ title: 'Heimrecht', text: comp === 'cup' ? 'Der zuerst gezogene Verein spielt zu Hause.' : 'Der zuerst gezogene Verein hat zuerst Heimrecht.' });
  if (rules.countryProtection) out.push({ title: 'Länderschutz', text: 'Vereine aus demselben Land treffen in dieser Runde nicht aufeinander.' });
  void y;
}

function advanceText(st: StageSpec, stages: StageSpec[], i: number, y: number): string {
  const nameOf = (key: string) => stages.find((s) => s.key === key)?.name ?? key;
  if (st.kind === 'ko') {
    if (i === stages.length - 1) return 'Der Sieger gewinnt den Pokal.';
    const next = stages[i + 1];
    return next.key === 'f' ? 'Die Sieger bestreiten das Finale.' : `Die Sieger erreichen ${articleAcc(next.name)}.`;
  }
  const parts = (st.advance ?? []).map((a) => {
    const pl = a.from === a.to ? `Platz ${a.from}` : `Platz ${a.from}–${a.to}`;
    const tgt = a.comp ? `${euroCompName(a.comp, y)}: ${tgtName(a.comp, a.target, y)}` : nameOf(a.target);
    return `${pl} → ${tgt}`;
  });
  if (st.bestRunnersUp) parts.push(`die ${st.bestRunnersUp.count} besten Gruppenzweiten → ${nameOf(st.bestRunnersUp.target)}`);
  return `${parts.join('; ')}; die übrigen scheiden aus.`;
}

function tgtName(comp: 'ec' | 'cwc' | 'uefa', key: string, y: number): string {
  return euroFormat(comp, y)?.stages.find((s) => s.key === key)?.name ?? key;
}

// =============================================================================
// Attribute in den Szenen (Wunsch Pascal: „jeder Wert soll eine Wirkung haben“):
//   • Mannschafts-Eigenschaften aus Attributen der Spieler auf dem Platz
//     (Teamwork, Laufbereitschaft, Konzentration, Aggressivität, Führung,
//     Pressingresistenz, Tempo von Angriff und Abwehr, Kommandos des Torwarts) –
//     neu berechnet in state.ts `refresh` (alle 10 Minuten, nach Wechseln).
//   • Laufduell gegen die Abwehrlinie (`raceP`): je höher die Linie, desto mehr
//     zählt reines Tempo; je tiefer, desto mehr Stellungsspiel.
//   • Welches Attribut hat ein Duell entschieden (`why…`)? – nur für den
//     Kommentar (data/ticker/attrDuels.ts), verbraucht keine Zufallszahlen.
// Alle Verschiebungen sind auf typische Ligawerte zentriert (NEUTRAL_TRAITS,
// gemessen über alle Epochen), damit Tore und Chancen je Epoche gleich bleiben
// (Messung `MODE=attrs node scripts/matchbench.mjs`, Soll/Ist `MODE=era`).
// Recherche und Tabelle Attribut → Wirkung: docs/recherche/attribute-engine.md.
// =============================================================================
import type { MPlayer } from './types';
import { DUEL_K, logistic, paceSkill, phys, energyF, recoverSkill } from './skills';

export interface TeamTraits {
  /** Ø Teamwork der Feldspieler (Anweisungen umsetzen, Kombinationen, Abseitsfalle). */
  teamwork: number;
  /** Ø Laufbereitschaft × Kraft (Pressing, Zurückeilen nach Ballverlust, Läufe in den Strafraum). */
  work: number;
  /** Ø Konzentration von Abwehr und Mittelfeld (Patzer, besonders spät). */
  conc: number;
  /** Ø Aggressivität (Fouls, Pressing-Wucht). */
  aggr: number;
  /** Führung: Kapitän auf dem Platz, sonst bester Führungsspieler − 8. */
  lead: number;
  /** Pressingresistenz von Abwehr und Mittelfeld: Ballkontrolle, Ballannahme, Nervenstärke, Erfahrung. */
  resist: number;
  /** Tempo der Offensive (Angreifer + offensive Außen) bzw. der Abwehr. */
  paceAtt: number;
  paceDef: number;
  /** Kommandos des Torwarts (Abwehr bei Flanken/Standards, Ordnung). */
  comm: number;
}

/** Typische Werte (Liga 1, gemessen über je 120 Spiele 1975/1995/2015, `TeamState.tr` in Minute 30 und 85 gemittelt). */
export const NEUTRAL_TRAITS: TeamTraits = { teamwork: 68, work: 73, conc: 68, aggr: 67, lead: 76, resist: 66, paceAtt: 68, paceDef: 66, comm: 75 };
const N = NEUTRAL_TRAITS;
/**
 * Typische Einzelwerte der Beteiligten (gleiche Messung): Ballannahme/Nervenstärke der Angreifer,
 * Deckung der Abwehr, Übersicht/Flair im Mittelfeld, Abschlag/Fangsicherheit des Torwarts, Freistoßwert.
 */
export const REF = { touch: 75, composure: 76, marking: 75, vision: 76, flair: 71, kicking: 75, handling: 77, fkFin: 77 };

const avg = (xs: number[], d: number) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : d);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Eigenschaften der Elf auf dem Platz. */
export function computeTraits(pitch: MPlayer[], captainId: string | null): TeamTraits {
  const field = pitch.filter((m) => m.group !== 'GK');
  if (!field.length) return NEUTRAL_TRAITS;
  const A = (m: MPlayer) => m.p.attributes;
  const back = field.filter((m) => m.group !== 'ATT');
  const att = field.filter((m) => m.group === 'ATT' || m.pos === 'OM' || m.pos === 'RM' || m.pos === 'LM');
  const def = field.filter((m) => m.group === 'DEF');
  const cap = pitch.find((m) => m.id === captainId && m.onPitch);
  const gk = pitch.find((m) => m.group === 'GK');
  const bk = back.length ? back : field;
  return {
    teamwork: avg(field.map((m) => A(m).teamwork ?? 60), 60),
    // Laufbereitschaft lässt mit der Kraft nach
    work: avg(field.map((m) => (A(m).workRate ?? 60) * energyF(m)), 60) / 0.97,
    conc: avg(bk.map((m) => A(m).concentration ?? 60), 60),
    aggr: avg(field.map((m) => A(m).aggression ?? 60), 60),
    lead: cap ? A(cap).leadership ?? 60 : Math.max(...field.map((m) => A(m).leadership ?? 50)) - 8,
    resist: avg(bk.map((m) => {
      const a = A(m);
      return a.ballControl * 0.35 + a.firstTouch * 0.2 + a.composure * 0.25 + (a.experience ?? 50) * 0.2;
    }), 60),
    paceAtt: avg((att.length ? att : field).map(paceSkill), 60),
    paceDef: avg((def.length ? def : field).map(paceSkill), 60),
    comm: gk && gk.group === 'GK' ? A(gk).communication ?? 60 : 30,
  };
}

// -----------------------------------------------------------------------------
// Wirkungen der Mannschafts-Eigenschaften (alle um NEUTRAL_TRAITS zentriert)
// -----------------------------------------------------------------------------

/** Logit-Verschiebung der eigenen Pässe aus Teamwork (Laufwege, Abstimmung): ±0,2 bei ±12 Punkten. */
export const teamworkBias = (t: TeamTraits): number => (t.teamwork - N.teamwork) / 60;

/**
 * Fehler im Aufbau von `own` unter dem Pressing von `press` (Faktor auf die Fehlerquote):
 * Pressingresistenz (Ballkontrolle/Annahme/Nerven/Erfahrung), Konzentration (spät doppelt),
 * Kommandos des Torwarts und Führung gegen Laufbereitschaft und Aggressivität des Pressenden.
 */
export function errorTraitF(own: TeamTraits, press: TeamTraits, minute: number): number {
  const late = minute >= 70 ? 1 + (minute - 70) / 20 : 1;
  const f = Math.pow(N.resist / Math.max(40, own.resist), 2.5)
    * (1 + (N.conc - own.conc) / 45 * late)
    * (1 + (N.comm - own.comm) / 250)
    * (1 + (N.lead - own.lead) / 220)
    * (1 + (press.work - N.work) / 70)
    * (1 + (press.aggr - N.aggr) / 100);
  return clamp(f, 0.45, 2.2);
}

/** Konzentrationslücke der Abwehr in der Schlussphase (Logit-Vorteil für den Angreifer, ab der 70. Minute). */
export function lapseBias(def: TeamTraits, minute: number): number {
  if (minute < 70) return 0;
  return (N.conc - def.conc) / 100 * Math.min(1.5, (minute - 60) / 20);
}

/** Abwehr bei hohen Bällen in den Strafraum: Kommandos des Torwarts ordnen die Zuteilung. */
export const commBias = (def: TeamTraits): number => (def.comm - N.comm) / 100 * 0.5;

/** Druck, den die Mannschaft in heiklen Momenten spürt (Führung des Kapitäns nimmt ihn, bis etwa ±20 %). */
export const leadPressF = (t: TeamTraits): number => clamp(1 - (t.lead - N.lead) / 100, 0.75, 1.25);

/**
 * Führungsspieler heben die Mannschaft (FM: „Mitspieler spielen besser neben einem Führungsspieler“):
 * Faktor auf Angriff/Kontrolle/Abwehr, ±3,3 % bei ±20 Punkten Führung des Kapitäns.
 */
export const leadTeamF = (t: TeamTraits): number => clamp(1 + (t.lead - N.lead) / 600, 0.96, 1.04);

/** Fouls im Spielaufbau: Aggressivität der Elf (Faktor ~0,8–1,3). */
export const aggrFoulF = (t: TeamTraits): number => clamp(1 + (t.aggr - N.aggr) / 80, 0.75, 1.3);

/** Angriffstempo: Laufbereitschaft bringt mehr Spieler in die Spitze (Faktor auf die Angriffsrate). */
export const workRateF = (t: TeamTraits): number => clamp(1 + (t.work - N.work) / 220, 0.9, 1.1);

/** Abschlag/Abwurf: wie schnell der Torwart nach einem Ballgewinn umschaltet (Faktor ~0,8–1,2). */
export const kickF = (gk: MPlayer | undefined): number => (gk && gk.group === 'GK' ? clamp(1 + (gk.p.attributes.kicking - REF.kicking) / 30, 0.6, 1.5) : 0.8);
/** Passwert des Torwarts bei Abschlag/Abwurf (Konter, langer Ball). */
export const kickValue = (gk: MPlayer): number => {
  const a = gk.p.attributes;
  return (a.kicking * 0.65 + a.decisions * 0.2 + a.passing * 0.15) * phys(gk) * energyF(gk);
};
/** Fangsicherheit: Abpraller nach Paraden (Faktor auf die Nachschuss-Chance, ~0,5–1,8). */
export const reboundF = (gk: MPlayer | undefined): number => (gk && gk.group === 'GK' ? clamp(1 + (REF.handling - gk.p.attributes.handling) / 30, 0.45, 1.9) : 1.6);

/** Typischer Tempo-Vorsprung der Offensive vor der Abwehr (Mittel über die Ligen, Zentrierung). */
const PACE_GAP = 2;
/**
 * Konter-Häufigkeit nach Ballgewinn: schnelle Angreifer gegen langsame Abwehr, die
 * Laufbereitschaft der ballverlierenden Mannschaft bremst (Zurückeilen). Faktor ~0,7–1,45.
 */
export function counterPaceF(runners: TeamTraits, backs: TeamTraits): number {
  const f = 0.93 + (runners.paceAtt - backs.paceDef - PACE_GAP) / 32 - (backs.work - N.work) / 90;
  return f < 0.7 ? 0.7 : f > 1.45 ? 1.45 : f;
}

/**
 * Wahl des Angriffswegs: Sind die eigenen Angreifer schneller als die Abwehr, sucht die
 * Mannschaft öfter den Steilpass – besonders gegen eine hoch stehende Linie (`line` −1 … +1).
 */
export function steilRouteF(att: TeamTraits, def: TeamTraits, line: number): number {
  const gap = att.paceAtt - def.paceDef - PACE_GAP;
  return clamp(1 + gap / 40 + (line > 0 ? line * gap / 25 : 0), 0.7, 1.5);
}

/** Stellungsspiel des Verfolgers als Laufwert (wer richtig steht, muss weniger laufen). */
const posVal = (m: MPlayer) => m.p.attributes.positioning * phys(m) * energyF(m);

/**
 * Laufduell Läufer gegen zurückeilenden Verteidiger. `line` = Abwehrlinie des Verteidigers
 * (−1 tief … +1 hoch): Hohe Linie → reines Tempo entscheidet und der Unterschied wirkt stärker
 * (Raum hinter der Kette); tiefe Linie → Stellungsspiel zählt mehr.
 */
export function raceP(runner: MPlayer, chaser: MPlayer, line: number, bias: number): number {
  const hi = line > 0 ? line : 0, lo = line < 0 ? -line : 0;
  // Grundwert wie recoverSkill (70 % Tempo, 30 % Stellungsspiel); die Linie verschiebt das Gewicht –
  // gemessen als Abweichung vom Üblichen, damit sich die Torzahl im Schnitt nicht ändert.
  const shift = (0.25 * hi - 0.15 * lo) * ((paceSkill(chaser) - RACE_PACE) - (posVal(chaser) - RACE_POS));
  const diff = paceSkill(runner) - (recoverSkill(chaser) + shift);
  // Hohe Linie: Tempo-Unterschiede schlagen stärker durch (Raum hinter der Kette); tiefe Linie: kurze Wege,
  // der Unterschied zählt weniger.
  return logistic((diff + (1.0 * hi - 0.3 * lo) * (diff - RACE_GAP)) / DUEL_K + bias);
}
/** Übliche Werte im Laufduell (gleiche Messung, Liga 1). */
const RACE_PACE = 65.5, RACE_POS = 72, RACE_GAP = 1;

/** Tempodribbling: schnellere Dribbler lassen ihren Gegenspieler stehen (Logit, außen stärker). */
export function paceDribBias(dr: MPlayer, def: MPlayer, wide: boolean): number {
  return (paceSkill(dr) - paceSkill(def) - PACE_GAP) / DUEL_K * (wide ? 0.45 : 0.2);
}

// -----------------------------------------------------------------------------
// Entscheidendes Attribut einer Szene (Kommentar)
// -----------------------------------------------------------------------------

/** Schlüssel für den Kommentar (data/ticker/attrDuels.ts). */
export type Why =
  | 'pace' | 'line' | 'pos' | 'drib' | 'agil' | 'flair' | 'strength' | 'balance' | 'tackle' | 'marking'
  | 'header' | 'jump' | 'height' | 'antic' | 'vision' | 'teamwork' | 'touch' | 'cross'
  | 'conc' | 'tired' | 'nerves' | 'cool' | 'power' | 'reflex' | 'k1v1' | 'handling' | 'kicking' | 'comm';

/** Ein Vergleich: Schlüssel, Wert des Gewinners, Wert des Verlierers, Gewicht. */
export type WhyPart = [Why, number, number, number];

/**
 * Welcher Unterschied hat das Duell am deutlichsten entschieden? Gewichteter Vorsprung des
 * Gewinners; unter `min` Punkten (gewichtet) gibt es keinen Grund – dann erzählt der
 * Kommentar wie bisher. Müdigkeit des Verlierers schlägt alles, wenn sie deutlich ist.
 */
export function whyOf(win: MPlayer, lose: MPlayer, parts: WhyPart[], min = 5): Why | undefined {
  if (lose.energy < 52 && win.energy - lose.energy > 22) return 'tired';
  let best: Why | undefined, bv = min;
  for (const [k, a, b, w] of parts) {
    const v = (a - b) * w;
    if (v > bv) { bv = v; best = k; }
  }
  return best;
}

const A = (m: MPlayer) => m.p.attributes;
const H = (m: MPlayer) => 50 + ((m.p.height || 182) - 182) * 2.2;

/** Laufduell: Tempo, hohe Linie oder Stellungsspiel des Verteidigers. */
export function whyRace(win: MPlayer, lose: MPlayer, runnerWon: boolean, line: number): Why | undefined {
  if (runnerWon) {
    const w = whyOf(win, lose, [['pace', paceSkill(win), paceSkill(lose), 1]], 4);
    return w === 'pace' && line > 0.1 ? 'line' : w;
  }
  return whyOf(win, lose, [['pace', paceSkill(win), paceSkill(lose), 1], ['pos', A(win).positioning, A(lose).decisions, 0.5]], 4);
}

/** Dribbling bzw. Zweikampf am Boden aus Sicht des Gewinners. */
export function whyDribble(dr: MPlayer, def: MPlayer, attWon: boolean): Why | undefined {
  if (attWon) {
    return whyOf(dr, def, [
      ['drib', A(dr).dribbling, A(def).tackling, 0.6], ['pace', paceSkill(dr), paceSkill(def), 0.55],
      ['agil', A(dr).agility, A(def).agility, 0.4], ['flair', A(dr).flair, A(def).concentration, 0.35],
      ['balance', A(dr).balance, A(def).strength, 0.35], ['strength', A(dr).strength, A(def).strength, 0.35],
    ]);
  }
  return whyOf(def, dr, [
    ['tackle', A(def).tackling, A(dr).dribbling, 0.6], ['strength', A(def).strength, A(dr).balance, 0.45],
    ['pace', paceSkill(def), paceSkill(dr), 0.45], ['pos', A(def).positioning, A(dr).decisions, 0.4],
    ['marking', A(def).marking, A(dr).firstTouch, 0.35],
  ]);
}

/** Kopfballduell aus Sicht des Gewinners. */
export function whyAerial(win: MPlayer, lose: MPlayer): Why | undefined {
  return whyOf(win, lose, [
    ['header', A(win).heading, A(lose).heading, 0.6], ['jump', A(win).jumping, A(lose).jumping, 0.45],
    ['strength', A(win).strength, A(lose).strength, 0.35], ['height', H(win), H(lose), 0.18],
    ...(win.group === 'DEF' ? [['marking', A(win).marking, A(lose).decisions, 0.3] as WhyPart] : []),
  ], 7);
}

/** Abgefangener Pass: Antizipation (Abfangen/Stellungsspiel) gegen Passspiel/Übersicht. */
export function whyIntercept(icp: MPlayer, passer: MPlayer): Why | undefined {
  return whyOf(icp, passer, [['antic', (A(icp).interceptions + A(icp).positioning) / 2, (A(passer).passing + A(passer).vision) / 2, 0.6]], 7);
}

/** Angekommener Pass in die Spitze: Übersicht, Teamwork oder die Ballannahme des Empfängers. */
export function whyPass(passer: MPlayer, recv: MPlayer, icp: MPlayer): Why | undefined {
  return whyOf(passer, icp, [
    ['vision', A(passer).vision, A(icp).interceptions, 0.5], ['teamwork', A(passer).teamwork, A(icp).positioning, 0.3],
    ['touch', A(recv).firstTouch, A(icp).marking, 0.35],
  ], 4);
}

/** Abschluss: Nervenstärke bei Großchancen, Schusskraft aus der Distanz, Torwart. */
export function whyFinish(shooter: MPlayer, keeper: MPlayer | undefined, kind: 'oneOnOne' | 'long' | 'shot' | 'air', goal: boolean, saved: boolean, xg: number): Why | undefined {
  const a = A(shooter);
  if (goal) {
    if (kind === 'oneOnOne' && a.composure >= 82) return 'cool';
    if (kind === 'long' && a.shotPower >= 80) return 'power';
    return undefined;
  }
  if (saved && keeper && keeper.group === 'GK') {
    const k = A(keeper);
    if (kind === 'oneOnOne' && k.oneOnOnes >= 80) return 'k1v1';
    if (xg >= 0.15 && k.reflexes >= 80) return 'reflex';
    return undefined;
  }
  if (kind === 'oneOnOne' && a.composure <= 64) return 'nerves';
  return undefined;
}

// =============================================================================
// Taktik-Seite: Modell der Anweisungen (Wunsch Pascal: übersichtlich, einheitlich)
// -----------------------------------------------------------------------------
// Jede Anweisung ist eine Zeile mit gleich gebauten Stufen bzw. Wahlmöglichkeiten:
// Beschriftung, Kurztext je Wahl (was sie bringt und kostet), Sperre mit Grund
// (Epoche, Formation – engine/tacticEra.ts). Abschnitte: mit Ball (inkl. Mentalität und
// Einsatz), gegen den Ball (mit eigener Mentalität). Dazu die eingebauten Vorlagen.
// =============================================================================
import type { Tactics } from '../../types';
import {
  COUNTERPRESS_FROM, HIGH_PRESS_FROM, ZONE_FROM, defStyleOf, effectiveTactics, markingOf, stepOf, stepValue, tacticLimits, type TacticLimits,
} from '../../engine/tacticEra';

export type InstrKey = 'style' | 'dstyle' | 'effort' | 'buildup' | 'tempo' | 'width' | 'cross' | 'marking' | 'pressing' | 'line' | 'hard' | 'trap' | 'cpress';
export type Section = 'grund' | 'ball' | 'gegen';
export const SECTION_LABEL: Record<Section, string> = { grund: 'Grundausrichtung', ball: 'Mit Ball', gegen: 'Gegen den Ball' };

export interface InstrOpt { label: string; text: string }
export interface InstrDef {
  key: InstrKey;
  label: string;
  section: Section;
  /** Worum es geht (ein Satz, steht über dem Text der gewählten Stufe). */
  about: string;
  opts: InstrOpt[];
  /** Index der gewählten Wahl (aus der Taktik, wie die Engine sie rechnet). */
  get: (t: Tactics, year: number) => number;
  set: (i: number) => Partial<Tactics>;
  /** Sperrgrund für Wahl i (null = wählbar). */
  lock?: (i: number, lim: TacticLimits, year: number) => string | null;
  /** Kleines Bild je Stufe (InstructionPanel): Stärke-Balken bzw. Angriffszone. */
  glyph?: 'level' | 'zone';
}

const five = (key: 'tempo' | 'pressing' | 'defensiveLine' | 'widthFocus' | 'tackleHardness' | 'effort') => ({
  get: (t: Tactics) => stepOf(t[key]),
  set: (i: number) => ({ [key]: stepValue(i) }) as Partial<Tactics>,
  glyph: (key === 'widthFocus' ? 'zone' : 'level') as InstrDef['glyph'],
});
const STYLES = ['defensive', 'balanced', 'attacking', 'counter'] as const;
const DSTYLES = ['defensive', 'balanced', 'attacking'] as const;

export const INSTRUCTIONS: InstrDef[] = [
  {
    key: 'style', label: 'Mentalität', section: 'ball', about: 'Wie viel Risiko die Mannschaft mit Ball geht.',
    opts: [
      { label: 'Defensiv', text: 'Sicherheit zuerst: weniger eigene Angriffe, dafür kaum Räume für Konter.' },
      { label: 'Ausgewogen', text: 'Gleichgewicht zwischen Angriff und Abwehr.' },
      { label: 'Offensiv', text: 'Mehr Spieler vor dem Ball: mehr Chancen, aber offen für Konter.' },
      { label: 'Konter', text: 'Tief stehen, Ball erobern und mit wenigen Pässen umschalten.' },
    ],
    get: (t) => Math.max(0, STYLES.indexOf(t.style as (typeof STYLES)[number])),
    set: (i) => ({ style: STYLES[i] }),
  },
  {
    key: 'effort', label: 'Einsatz', section: 'ball', about: 'Wie viel Kraft die Mannschaft in jedes Spiel steckt.',
    opts: [
      { label: 'Schonend', text: 'Kräfte sparen: weniger Druck, dafür frischer in der Schlussphase und im nächsten Spiel.' },
      { label: 'Dosiert', text: 'Etwas zurückgenommen – gut in englischen Wochen.' },
      { label: 'Normal', text: 'Normaler Einsatz.' },
      { label: 'Hoch', text: 'Mehr gewonnene Zweikämpfe und mehr Druck. Kostet Kraft, Karten und Verletzungen.' },
      { label: 'Volle Kraft', text: 'Alles reinwerfen. Für ein Spiel stark, auf Dauer teuer: müde Beine, Karten, Verletzungen.' },
    ],
    ...five('effort'),
  },
  {
    key: 'buildup', label: 'Aufbau', section: 'ball', about: 'Wie der Ball nach vorn kommt.',
    opts: [
      { label: 'Kurz', text: 'Flach und geduldig über mehrere Stationen. Sicherer, braucht gute Passspieler.' },
      { label: 'Lang', text: 'Direkt in die Spitze: lange Bälle und Steilpässe. Mehr Ballverluste, weniger Risiko vor dem eigenen Tor.' },
    ],
    get: (t) => (t.buildup === 'long' ? 1 : 0),
    set: (i) => ({ buildup: i ? 'long' : 'short' }),
  },
  {
    key: 'tempo', label: 'Tempo', section: 'ball', about: 'Wie schnell nach vorn gespielt wird.',
    opts: [
      { label: 'Sehr ruhig', text: 'Ball und Gegner laufen lassen: hohe Passquote, wenige Fehler, wenige Angriffe.' },
      { label: 'Ruhig', text: 'Geduldig aufbauen, auf die Lücke warten.' },
      { label: 'Normal', text: 'Normales Tempo.' },
      { label: 'Schnell', text: 'Zügig vertikal: mehr Steilpässe und Dribblings, mehr Fehlpässe.' },
      { label: 'Sehr schnell', text: 'Mit jedem Ball nach vorn. Viele Angriffe, viele Fehler, hoher Kraftverbrauch.' },
    ],
    ...five('tempo'),
  },
  {
    key: 'width', label: 'Breite', section: 'ball', about: 'Über welche Zone die Angriffe laufen.',
    opts: [
      { label: 'Mitte', text: 'Durch das Zentrum kombinieren – kaum Flanken.' },
      { label: 'Eher Mitte', text: 'Vorwiegend durch die Mitte.' },
      { label: 'Ausgewogen', text: 'Mitte und Flügel gleichmäßig.' },
      { label: 'Eher Flügel', text: 'Öfter über außen.' },
      { label: 'Flügel', text: 'Konsequent über außen: viele Flanken. Lohnt sich mit guten Flankengebern und kopfballstarken Stürmern.' },
    ],
    ...five('widthFocus'),
  },
  {
    key: 'cross', label: 'Flanken', section: 'ball', about: 'Wie der Ball von außen in den Strafraum kommt.',
    opts: [
      { label: 'Flach', text: 'Flach in den Rückraum: für wendige, schussstarke Stürmer.' },
      { label: 'Gemischt', text: 'Mal hoch, mal flach – wie es die Lage ergibt.' },
      { label: 'Hoch', text: 'Hoch auf den Kopf: für große, sprungstarke Stürmer.' },
    ],
    get: (t) => (t.crossStyle === 'low' ? 0 : t.crossStyle === 'high' ? 2 : 1),
    set: (i) => ({ crossStyle: (['low', 'mixed', 'high'] as const)[i] }),
  },
  {
    key: 'dstyle', label: 'Mentalität', section: 'gegen', about: 'Wie die Mannschaft gegen den Ball steht (Wunsch Pascal: eigene Mentalität für die Defensive).',
    opts: [
      { label: 'Defensiv', text: 'Hinten absichern: stabiler, kaum Räume für Konter – der Gegner hat mehr vom Ball.' },
      { label: 'Ausgewogen', text: 'Ordnung halten, ohne sich zurückzuziehen.' },
      { label: 'Offensiv', text: 'Nach vorn verteidigen: schnell nachrücken und attackieren. Weniger stabil, offener für Konter.' },
    ],
    get: (t) => Math.max(0, DSTYLES.indexOf(defStyleOf(t))),
    set: (i) => ({ defStyle: DSTYLES[i] }),
  },
  {
    key: 'marking', label: 'Deckung', section: 'gegen', about: 'Wie die Abwehr den Gegner aufnimmt.',
    opts: [
      { label: 'Manndeckung', text: 'Jeder hat seinen Gegenspieler. Stark im direkten Zweikampf – anfällig, wenn ein Duell verloren geht.' },
      { label: 'Raumdeckung', text: 'Die Mannschaft verschiebt im Verbund: fängt mehr Pässe ab und sichert den Raum hinter der Linie. Greift nur eingespielt; im Strafraum weniger eng am Mann.' },
    ],
    get: (t, y) => (markingOf(t, y) === 'zone' ? 1 : 0),
    set: (i) => ({ marking: i ? 'zone' : 'man' }),
    lock: (i, lim, y) => (i !== 1 || lim.zone ? null : lim.libero && y >= ZONE_FROM ? 'Raumdeckung nur ohne Libero.' : `Raumdeckung kommt Anfang der 80er auf (ab ${ZONE_FROM}).`),
  },
  {
    key: 'pressing', label: 'Pressing', section: 'gegen', about: 'Wo die Mannschaft den Gegner anläuft.',
    opts: [
      { label: 'Abwartend', text: 'Den Gegner kommen lassen und Kräfte sparen.' },
      { label: 'Tief', text: 'Erst in der eigenen Hälfte stören.' },
      { label: 'Mittelfeld', text: 'Ab der Mittellinie Druck machen.' },
      { label: 'Hoch', text: 'Früh stören: mehr Ballgewinne und Fehler des Gegners. Kostet Kraft und öffnet Räume.' },
      { label: 'Angriff', text: 'Angriffspressing: schon die Abwehr des Gegners unter Druck. Sehr kraftraubend, hinten wird es luftig.' },
    ],
    ...five('pressing'),
    lock: (i, lim) => (i <= lim.maxPressStep ? null : `Angriffspressing kommt Ende der 80er auf (ab ${HIGH_PRESS_FROM}).`),
  },
  {
    key: 'line', label: 'Abwehrlinie', section: 'gegen', about: 'Wie weit die Abwehr aufrückt.',
    opts: [
      { label: 'Sehr tief', text: 'Am eigenen Strafraum: kein Raum hinter der Abwehr, der Gegner darf aus der Distanz schießen.' },
      { label: 'Tief', text: 'Eher tief stehen.' },
      { label: 'Normal', text: 'Normale Höhe.' },
      { label: 'Hoch', text: 'Der Gegner wird früh gestellt und läuft öfter ins Abseits – Steilpässe in den Rücken werden gefährlich.' },
      { label: 'Sehr hoch', text: 'Fast an der Mittellinie. Erdrückt den Gegner, braucht schnelle Verteidiger und eine eingespielte Kette.' },
    ],
    ...five('defensiveLine'),
    lock: (i, lim) => (i <= lim.maxLineStep ? null : lim.libero ? 'Mit Libero steht die Abwehr höchstens normal hoch – der freie Mann spielt hinter der Linie.' : 'Sehr hoch nur mit Raumdeckung.'),
  },
  {
    key: 'hard', label: 'Zweikampf', section: 'gegen', about: 'Wie hart die Mannschaft in die Zweikämpfe geht.',
    opts: [
      { label: 'Sehr fair', text: 'Kaum Fouls und Karten, aber der Gegner kommt leichter durch.' },
      { label: 'Fair', text: 'Eher zurückhaltend.' },
      { label: 'Normal', text: 'Normale Härte.' },
      { label: 'Hart', text: 'Mehr gewonnene Zweikämpfe – mehr Fouls, Karten und Freistöße für den Gegner.' },
      { label: 'Sehr hart', text: 'Kompromisslos. Gewinnt Duelle, kostet aber Karten, Elfmeter und Platzverweise.' },
    ],
    ...five('tackleHardness'),
  },
  {
    key: 'trap', label: 'Abseitsfalle', section: 'gegen', about: 'Ob die Abwehr geschlossen herausrückt.',
    opts: [
      { label: 'Aus', text: 'Die Abwehr sichert nach hinten ab.' },
      { label: 'An', text: 'Die Abwehr rückt geschlossen heraus: mehr Abseitsstellungen – aber ein Gegentor, wenn einer zu spät kommt.' },
    ],
    get: (t) => (t.offsideTrap ? 1 : 0),
    set: (i) => ({ offsideTrap: !!i }),
  },
  {
    key: 'cpress', label: 'Ballverlust', section: 'gegen', about: 'Was nach einem Ballverlust passiert.',
    opts: [
      { label: 'Ordnen', text: 'Zurück in die Grundordnung und den Gegner kommen lassen.' },
      { label: 'Gegenpressing', text: 'Sofort nachsetzen: Konter des Gegners werden früh gestoppt. Kostet Kraft.' },
    ],
    get: (t) => (t.counterPress ? 1 : 0),
    set: (i) => ({ counterPress: !!i }),
    lock: (i, lim) => (i !== 1 || lim.counterPress ? null : `Gegenpressing gibt es ab ${COUNTERPRESS_FROM}.`),
  },
];
export const INSTR_BY_KEY: Record<InstrKey, InstrDef> = Object.fromEntries(INSTRUCTIONS.map((d) => [d.key, d])) as Record<InstrKey, InstrDef>;

/** Zustand aller Anweisungen für die Anzeige: gewählte Wahl (wie die Engine rechnet), Sperren. */
export function instructionState(t: Tactics, year: number): Record<InstrKey, { i: number; locks: (string | null)[] }> {
  const eff = effectiveTactics(t, year)!;
  const lim = tacticLimits(t, year);
  const out = {} as Record<InstrKey, { i: number; locks: (string | null)[] }>;
  for (const d of INSTRUCTIONS) out[d.key] = { i: d.get(eff, year), locks: d.opts.map((_, i) => d.lock?.(i, lim, year) ?? null) };
  return out;
}
/** Kurzwert einer Anweisung (Vergleich mit dem Gegner, Aufstellungsseite). */
export const instrLabel = (key: InstrKey, t: Tactics, year: number): string => {
  const d = INSTR_BY_KEY[key];
  return d.opts[d.get(effectiveTactics(t, year)!, year)].label;
};

// --- Vorlagen ---------------------------------------------------------------------
export type InstrPatch = Pick<Tactics, 'style' | 'defStyle' | 'effort' | 'buildup' | 'tempo' | 'widthFocus' | 'crossStyle' | 'marking' | 'pressing' | 'defensiveLine' | 'tackleHardness' | 'offsideTrap' | 'counterPress'>;
export interface TacticPreset { id: string; name: string; text: string; from?: number; patch: InstrPatch }
const P = (style: Tactics['style'], effort: number, buildup: 'short' | 'long', tempo: number, width: number, cross: 'low' | 'mixed' | 'high',
  marking: 'man' | 'zone', pressing: number, line: number, hard: number, trap: boolean, cp = false): InstrPatch => ({
  style, defStyle: style === 'attacking' ? 'attacking' : style === 'balanced' ? 'balanced' : 'defensive', effort: stepValue(effort), buildup, tempo: stepValue(tempo), widthFocus: stepValue(width), crossStyle: cross, marking,
  pressing: stepValue(pressing), defensiveLine: stepValue(line), tackleHardness: stepValue(hard), offsideTrap: trap, counterPress: cp,
});
export const PRESETS: TacticPreset[] = [
  { id: 'neutral', name: 'Ausgewogen', text: 'Alles auf normal – ein sauberer Ausgangspunkt.', patch: P('balanced', 2, 'short', 2, 2, 'mixed', 'man', 2, 2, 2, false) },
  { id: 'riegel', name: 'Abwehrriegel', text: 'Tief, hart und mit langen Bällen: hinten dicht, vorn hilft der Zufall.', patch: P('defensive', 2, 'long', 1, 2, 'mixed', 'man', 0, 0, 3, false) },
  { id: 'konter', name: 'Konterfußball', text: 'Tief stehen, schnell umschalten, Steilpässe in die Spitze.', patch: P('counter', 2, 'long', 3, 2, 'mixed', 'man', 1, 1, 2, false) },
  { id: 'fluegel', name: 'Flügelspiel', text: 'Über außen und hoch in den Strafraum – für kopfballstarke Stürmer.', patch: P('balanced', 2, 'short', 2, 4, 'high', 'man', 2, 2, 2, false) },
  { id: 'rush', name: 'Lang und hoch', text: 'Lange Bälle, hohes Tempo, viel Einsatz: wenig Schönheit, viel Wucht.', patch: P('attacking', 3, 'long', 3, 3, 'high', 'man', 2, 2, 3, false) },
  { id: 'offensiv', name: 'Kontrollierte Offensive', text: 'Kurz aufbauen, hoch stehen, den Gegner in seiner Hälfte halten.', patch: P('attacking', 2, 'short', 2, 2, 'mixed', 'man', 3, 3, 2, false) },
  { id: 'falle', name: 'Raum und Falle', from: ZONE_FROM, text: 'Raumdeckung, hohe Linie, Abseitsfalle: der Stil der Vorreiter. Braucht eine eingespielte Mannschaft.', patch: P('balanced', 2, 'short', 2, 2, 'mixed', 'zone', 3, 3, 2, true) },
  { id: 'pressing', name: 'Pressingmaschine', from: HIGH_PRESS_FROM, text: 'Angriffspressing mit hoher Linie und Raumdeckung. Erdrückend, aber kraftraubend.', patch: P('attacking', 3, 'short', 3, 2, 'mixed', 'zone', 4, 3, 2, true) },
  { id: 'ballbesitz', name: 'Ballbesitz', from: ZONE_FROM, text: 'Ruhig, kurz und durch die Mitte: der Gegner läuft hinterher.', patch: P('balanced', 2, 'short', 0, 1, 'low', 'zone', 2, 3, 1, false) },
  { id: 'gegenpress', name: 'Gegenpressing', from: COUNTERPRESS_FROM, text: 'Hohes Tempo, hohes Pressing, nach Ballverlust sofort nachsetzen.', patch: P('attacking', 3, 'short', 3, 2, 'low', 'zone', 3, 3, 2, false, true) },
];

const KEYS: (keyof InstrPatch)[] = ['style', 'effort', 'buildup', 'tempo', 'widthFocus', 'crossStyle', 'marking', 'pressing', 'defensiveLine', 'tackleHardness', 'offsideTrap', 'counterPress'];
/** Nur die Anweisungen einer Taktik (zum Speichern/Vergleichen). */
export function instrPatchOf(t: Tactics, year: number): InstrPatch {
  const e = effectiveTactics(t, year)!;
  return {
    style: e.style, defStyle: defStyleOf(e), effort: stepValue(stepOf(e.effort)), buildup: e.buildup === 'long' ? 'long' : 'short', tempo: stepValue(stepOf(e.tempo)),
    widthFocus: stepValue(stepOf(e.widthFocus)), crossStyle: e.crossStyle ?? 'mixed', marking: markingOf(e, year), pressing: stepValue(stepOf(e.pressing)),
    defensiveLine: stepValue(stepOf(e.defensiveLine)), tackleHardness: stepValue(stepOf(e.tackleHardness)), offsideTrap: !!e.offsideTrap, counterPress: !!e.counterPress,
  };
}
/** Sind zwei Sätze von Anweisungen gleich? (Vorlage als „aktiv“ markieren.) */
export const samePatch = (a: InstrPatch, b: InstrPatch): boolean => KEYS.every((k) => a[k] === b[k]) && defStyleOf(a) === defStyleOf(b);

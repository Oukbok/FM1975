// =============================================================================
// Zurufe von der Seitenlinie (nur Textmodus, nur menschlich gecoachte Teams –
// die KI ruft nichts, ihre Balance bleibt unverändert).
// Eine Stelle für Dauer, Abklingzeit, Wiederholungsregel und Wirkung: Engine
// (`tacticMods` in team.ts), Textmodus (MatchPanels/Stage) und Wiki
// (data/wikiSideline.ts) lesen alles von hier.
// =============================================================================
import type { MatchSim } from './sim';
import type { TeamState } from './state';
import type { TacticMods } from './team';
import type { ShoutId, Side } from './types';

/** So viele Minuten wirkt ein Zuruf (Wunsch Pascal: 15 statt 10). */
export const SHOUT_MINUTES = 15;
/** Ab dem Zuruf vergehen so viele Minuten bis zum nächsten (15 Wirkung + 6 Pause, wie bisher 10 + 6). */
export const SHOUT_COOLDOWN = 21;
/** Jede Wiederholung desselben Zurufs unter den letzten drei kostet so viel Wirkung. */
export const SHOUT_REPEAT_MALUS = 0.3;
export const SHOUT_REPEAT_WINDOW = 3;
/** Untergrenze der Wirkung (Anteil der normalen Stärke). */
export const SHOUT_MIN_POWER = 0.2;
/** Zufall je Zuruf: 0,85–1,15. */
export const SHOUT_LUCK = 0.3;

/** Zurufe mit Knopftext und Kurzhinweis. */
export const SHOUT_LIST: [ShoutId, string, string][] = [
  ['druck', 'Mehr Druck!', 'Mehr Angriffe, kostet Energie'],
  ['ruhe', 'Ruhe reinbringen', 'Ballkontrolle, weniger Fehler'],
  ['kompakt', 'Kompakt stehen', 'Sicherer hinten, weniger vorne'],
  ['fluegel', 'Über die Flügel', 'Mehr Flanken und Kopfbälle'],
  ['konzentration', 'Konzentration!', 'Weniger Fehler und Karten'],
  ['zweikampf', 'Zweikämpfe annehmen', 'Härter, aber foulanfälliger'],
];
export const shoutLabel = (id: ShoutId): string => SHOUT_LIST.find(([x]) => x === id)?.[1] ?? id;

/**
 * Wirkung bei voller Stärke: Wert c → Faktor (1 + c × Stärke) auf den Mannschaftswert.
 * Reihenfolge je Zuruf = Rechenreihenfolge in `tacticMods` (jeder Wert kommt einmal vor).
 */
export const SHOUT_FX: Record<ShoutId, [keyof TacticMods, number][]> = {
  druck: [['att', 0.07], ['rate', 0.12], ['def', -0.03], ['drain', 0.3]],
  ruhe: [['ctrl', 0.07], ['rate', -0.08], ['errors', -0.3], ['exposed', -0.1]],
  kompakt: [['def', 0.07], ['att', -0.04], ['exposed', -0.15]],
  fluegel: [['cross', 0.6], ['att', 0.02]],
  konzentration: [['def', 0.035], ['errors', -0.45], ['cards', -0.4]],
  zweikampf: [['duel', 0.1], ['def', 0.035], ['foul', 0.45], ['cards', 0.25]],
};

/** Wie oft dieser Zuruf unter den letzten drei schon vorkam. */
export const shoutRepeats = (t: TeamState, id: ShoutId): number =>
  t.shoutHistory.slice(-SHOUT_REPEAT_WINDOW).filter((s) => s === id).length;

/** Anteil der Wirkung nach Wiederholungen (vor Kapitän und Zufall): 1, 0,7, 0,4, 0,2. */
export const repeatFactor = (repeats: number): number => Math.max(SHOUT_MIN_POWER, 1 - repeats * SHOUT_REPEAT_MALUS);

/** Führungsstärke des Kapitäns auf dem Platz (ohne Kapitän 55). */
export function captainLead(t: TeamState): number {
  const cap = t.players.find((m) => m.id === t.captainId && m.onPitch);
  return cap ? cap.p.attributes.leadership : 55;
}
/** Kapitänsfaktor: Führung 50 = 1,0; 25 = 0,9; 75 = 1,1. */
export const leadFactor = (lead: number): number => 0.8 + lead / 250;

/** Zuruf geben. false, solange der vorige noch wirkt oder die Abklingzeit läuft. */
export function giveShout(sim: MatchSim, side: Side, id: ShoutId): boolean {
  const t = sim.team(side);
  if (sim.phase !== 'play' && sim.phase !== 'halftime') return false;
  if (sim.minute < t.shoutReadyAt || (t.shout && sim.minute < t.shoutUntil)) return false;
  const repeats = shoutRepeats(t, id);
  t.shoutPower = Math.max(SHOUT_MIN_POWER, (1 - repeats * SHOUT_REPEAT_MALUS) * leadFactor(captainLead(t)) * (1 - SHOUT_LUCK / 2 + sim.rng() * SHOUT_LUCK));
  t.shout = id;
  t.shoutUntil = sim.minute + SHOUT_MINUTES;
  t.shoutReadyAt = sim.minute + SHOUT_COOLDOWN;
  t.shoutHistory.push(id);
  t.dirty = true;
  sim.emit('shout', { side, value: id, detail: repeats >= 2 ? 'stumpf' : t.shoutPower > 1 ? 'zuendet' : undefined });
  return true;
}

export interface ShoutStatus {
  /** Wirkender Zuruf oder null. */
  active: ShoutId | null;
  /** Restminuten des wirkenden Zurufs. */
  left: number;
  /** Letzte Minute mit Wirkung + 1 (Zuruf endet zu Beginn dieser Minute). */
  until: number;
  /** Ab dieser Minute ist der nächste Zuruf möglich. */
  readyAt: number;
  /** Minuten bis zum nächsten Zuruf (0 = jetzt). */
  wait: number;
  /** Wirkung des aktiven Zurufs (1 = normal). */
  power: number;
}

export function shoutStatus(sim: MatchSim, side: Side): ShoutStatus {
  const t = sim.team(side);
  const active = t.shout && sim.minute < t.shoutUntil ? t.shout : null;
  return {
    active, left: active ? t.shoutUntil - sim.minute : 0, until: t.shoutUntil,
    readyAt: t.shoutReadyAt, wait: Math.max(0, t.shoutReadyAt - sim.minute), power: active ? t.shoutPower : 0,
  };
}

/** Mannschaftswerte in Worten (Wiki, Tooltips). */
export const FX_LABEL: Partial<Record<keyof TacticMods, string>> = {
  att: 'Angriffsstärke', def: 'Abwehrstärke', ctrl: 'Spielkontrolle', rate: 'Zahl der Angriffe', foul: 'Fouls',
  drain: 'Energieverbrauch', cross: 'Flankenspiel', exposed: 'Anfälligkeit für Konter', counter: 'Konterstärke',
  errors: 'Fehler', cards: 'Kartenrisiko', duel: 'Zweikampfstärke', injury: 'Verletzungsrisiko',
};

/** „+7 %“, „−3,5 %“ (Anteil → Prozent mit deutschem Komma). */
export function pctText(v: number): string {
  const p = Math.round(v * 1000) / 10;
  return `${p > 0 ? '+' : p < 0 ? '−' : '±'}${String(Math.abs(p)).replace('.', ',')} %`;
}

/** Wirkung eines Zurufs bei voller Stärke in Worten, z. B. „Angriffsstärke +7 %, …“. */
export const shoutFxText = (id: ShoutId): string =>
  SHOUT_FX[id].map(([k, c]) => `${FX_LABEL[k] ?? k} ${pctText(c)}`).join(', ');

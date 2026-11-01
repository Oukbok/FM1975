// =============================================================================
// TRAININGSPLAN — Wochenansicht mit drei Feldern je Tag (Training › Trainingsplan)
// -----------------------------------------------------------------------------
// Der Plan selbst ist eine Wochenvorlage (game.trainingPlan, 7 × 3 Bausteine,
// engine/weeklyTraining.ts). Die echte Woche legt Spiele darüber:
//   • Spieltag: kein Training (alle Felder gesperrt).
//   • Tag nach dem Spiel: Vormittag fest „Regeneration“ (Auslaufen).
//   • Tag vor einem Auswärtsspiel: Abend gesperrt (Anreise).
// Wochenwirkung: Schwerpunkte je Fähigkeitsbereich, Belastung/Fitness je Tag,
// Verletzungsrisiko und ein kleiner Entwicklungsfaktor nach Trainingsumfang.
// =============================================================================
import { DaySlots, TrainingBlock, WeeklyTrainingPlan, AttributeKey } from '../types';
import {
  BLOCKS_BY_ID, DAILY_BASE_RECOVERY, EXTRA_SLOT_MULTIPLIER, blockAvailable, createDefaultWeeklyPlan, dayLoad,
} from './weeklyTraining';

export type SlotKey = keyof DaySlots;
export const SLOT_KEYS: SlotKey[] = ['slot1', 'slot2', 'extra'];
export const SLOT_LABEL: Record<SlotKey, string> = { slot1: 'Vormittag', slot2: 'Nachmittag', extra: 'Abend / Zusatz' };
export const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const DAY_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const DAY_MS = 86_400_000;

export function addDaysISO(d: string, n: number): string {
  return new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
}
export function mondayOf(d: string): string {
  const wd = (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7;
  return addDaysISO(d, -wd);
}
export function weekdayIdx(d: string): number {
  return (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7;
}

// -----------------------------------------------------------------------------
// Eigene Spiele und Sperren
// -----------------------------------------------------------------------------
export interface OwnFixture { date: string; home: boolean; oppId: string; comp: string }
export type CellLock = 'match' | 'regen' | 'travel' | null;

export interface DayInfo {
  date: string;
  idx: number;
  fixture?: OwnFixture;
  locks: Record<SlotKey, CellLock>;
}

/** Locks eines Tages aus den Spielen am Vortag/heute/morgen. */
export function locksFor(date: string, fixtures: Map<string, OwnFixture>): DayInfo {
  const fx = fixtures.get(date);
  const prev = fixtures.get(addDaysISO(date, -1));
  const next = fixtures.get(addDaysISO(date, 1));
  const locks: Record<SlotKey, CellLock> = { slot1: null, slot2: null, extra: null };
  if (fx) { locks.slot1 = locks.slot2 = locks.extra = 'match'; }
  else {
    if (prev) locks.slot1 = 'regen';
    if (next && !next.home) locks.extra = 'travel';
  }
  return { date, idx: weekdayIdx(date), fixture: fx, locks };
}

/** Tatsächlich trainierte Einheiten eines Tages (Vorlage + Sperren). */
export function effectiveDay(plan: DaySlots, info: DayInfo): DaySlots {
  const out: DaySlots = { slot1: plan.slot1, slot2: plan.slot2, extra: plan.extra };
  for (const k of SLOT_KEYS) {
    const l = info.locks[k];
    if (l === 'match' || l === 'travel') out[k] = null;
    else if (l === 'regen') out[k] = 'regeneration';
  }
  return out;
}

// -----------------------------------------------------------------------------
// Vorlagen
// -----------------------------------------------------------------------------
type T = [string | null, string | null, string | null];
export interface PlanTemplate { id: string; name: string; desc: string; days: T[] }

export const PLAN_TEMPLATES: PlanTemplate[] = [
  { id: 'standard', name: 'Ausgewogen', desc: 'Zwei Einheiten an Werktagen, Samstag Spiel, Sonntag frei.', days: createDefaultWeeklyPlan().days.map((d) => [d.slot1, d.slot2, d.extra] as T) },
  { id: 'vorbereitung', name: 'Vorbereitung', desc: 'Viel Ausdauer und Kraft, dazu Extraeinheiten – hart, aber die Basis für die Saison.', days: [
    ['ausdauerlauf', 'technik', 'krafttraining'], ['sprinttraining', 'spielform', null], ['kondition', 'passspiel', 'krafttraining'],
    ['ausdauerlauf', 'taktik', null], ['beweglichkeit', 'spielform', 'kondition'], ['torschuss', 'regeneration', null], ['regeneration', null, null]] },
  { id: 'englisch', name: 'Englische Woche', desc: 'Wenig Belastung, viel Regeneration und Taktik zwischen zwei Spielen.', days: [
    ['regeneration', 'taktik', null], ['technik', 'standards', null], ['regeneration', null, null],
    ['taktik', 'regeneration', null], ['standards', 'technik', null], ['regeneration', null, null], [null, null, null]] },
  { id: 'taktik', name: 'Taktikwoche', desc: 'Spielverständnis und Abläufe: Taktik, Pressing, Videoanalyse, Standards.', days: [
    ['taktik', 'passspiel', null], ['verteidigung', 'videoanalyse', null], ['pressing', 'technik', null],
    ['spielform', 'taktik', null], ['standards', 'videoanalyse', null], ['technik', 'regeneration', null], ['regeneration', null, null]] },
  { id: 'offensiv', name: 'Abschluss & Technik', desc: 'Torschuss, Dribbling, Flanken – für eine harmlose Offensive.', days: [
    ['technik', 'torschuss', null], ['dribbling', 'flanken', null], ['torschuss', 'kopfball', null],
    ['spielform', 'passspiel', null], ['standards', 'torschuss', null], ['technik', 'regeneration', null], ['regeneration', null, null]] },
  { id: 'schonung', name: 'Schonung', desc: 'Kurze, leichte Einheiten bei vielen Verletzten oder müder Mannschaft.', days: [
    ['regeneration', 'technik', null], ['taktik', null, null], ['regeneration', 'standards', null],
    ['technik', null, null], ['taktik', 'regeneration', null], ['regeneration', null, null], [null, null, null]] },
];

/** Ersatz für Bausteine, die es im Jahr noch nicht gibt. */
const FALLBACK: Record<string, string> = { videoanalyse: 'taktik', pressing: 'spielform', athletik: 'krafttraining', mental: 'taktik' };

function availableId(id: string | null, year: number): string | null {
  if (!id) return null;
  const b = BLOCKS_BY_ID[id];
  if (!b) return null;
  if (blockAvailable(b, year)) return id;
  return availableId(FALLBACK[id] ?? null, year);
}

export function applyTemplate(plan: WeeklyTrainingPlan, tplId: string, year: number): void {
  const t = PLAN_TEMPLATES.find((x) => x.id === tplId);
  if (!t) return;
  plan.days = t.days.map(([a, b, c]) => ({ slot1: availableId(a, year), slot2: availableId(b, year), extra: availableId(c, year) }));
}

/** Plan bereinigen: unbekannte/noch nicht verfügbare Bausteine ersetzen, 7 Tage sicherstellen. */
export function sanitizePlan(plan: WeeklyTrainingPlan | undefined, year: number): WeeklyTrainingPlan {
  const p = plan && Array.isArray(plan.days) && plan.days.length === 7 ? plan : createDefaultWeeklyPlan();
  for (const d of p.days) for (const k of SLOT_KEYS) d[k] = availableId(d[k] ?? null, year);
  return p;
}

// -----------------------------------------------------------------------------
// Wochenwirkung
// -----------------------------------------------------------------------------
export const EFFECT_GROUPS: { key: string; label: string; attrs: AttributeKey[] }[] = [
  { key: 'ausdauer', label: 'Ausdauer', attrs: ['stamina', 'fitness', 'workRate'] },
  { key: 'tempo', label: 'Schnelligkeit', attrs: ['speed', 'acceleration', 'agility', 'balance'] },
  { key: 'kraft', label: 'Kraft', attrs: ['strength', 'jumping', 'aggression'] },
  { key: 'technik', label: 'Technik', attrs: ['technique', 'firstTouch', 'ballControl', 'dribbling', 'flair'] },
  { key: 'pass', label: 'Passspiel', attrs: ['passing', 'longPassing', 'vision', 'crossing'] },
  { key: 'abschluss', label: 'Abschluss', attrs: ['shooting', 'shotPower', 'longShots', 'heading'] },
  { key: 'defensive', label: 'Defensive', attrs: ['tackling', 'marking', 'interceptions', 'positioning'] },
  { key: 'kopf', label: 'Spielverständnis', attrs: ['decisions', 'concentration', 'teamwork', 'composure', 'leadership'] },
  { key: 'standards', label: 'Standards', attrs: ['freeKicks', 'corners', 'penalties'] },
  { key: 'torwart', label: 'Torwart', attrs: ['reflexes', 'handling', 'oneOnOnes', 'aerialReach', 'kicking', 'communication'] },
];
const GROUP_OF: Partial<Record<AttributeKey, string>> = {};
for (const g of EFFECT_GROUPS) for (const a of g.attrs) GROUP_OF[a] = g.key;

export interface WeekEffect {
  /** Trainingsreiz je Bereich (Summe der Gewichte × Lernfaktor). */
  groups: Record<string, number>;
  /** Einheiten mit Lerneffekt. */
  units: number;
  /** Trainingstage (ohne Spieltage). */
  trainDays: number;
  /** Ø Fitness-Veränderung je Trainingstag. */
  fitnessPerDay: number;
  /** Belastung der Woche (Summe). */
  load: number;
  /** Verletzungsrisiko der Woche relativ zu „normal“ (1 = normal). */
  injuryIndex: number;
  /** Entwicklungsfaktor aus Umfang/Überlastung (0,94 … 1,05). */
  devFactor: number;
}

const LEARN: Record<TrainingBlock['intensity'], number> = { low: 0.7, medium: 1, high: 1.3 };

/** Tägliches Verletzungsrisiko je Spieler aus der Tagesbelastung. */
export function dailyInjuryRisk(load: number, fitness: number, reduction: number): number {
  if (load <= 6) return 0;
  return 0.00011 * (load - 6) * (fitness < 50 ? 1.8 : 1) * (1 - clamp(reduction, 0, 0.6));
}

export function weekEffect(days: DaySlots[], infos: DayInfo[], factor: (b: TrainingBlock) => number = () => 1): WeekEffect {
  const groups: Record<string, number> = {};
  for (const g of EFFECT_GROUPS) groups[g.key] = 0;
  let units = 0, trainDays = 0, load = 0, eff = 0, risk = 0, athletik = 0;
  days.forEach((d, i) => {
    const info = infos[i];
    if (info?.fixture) return;
    trainDays++;
    const l = dayLoad(d);
    load += l;
    risk += Math.max(0, l - 6);
    SLOT_KEYS.forEach((k) => {
      const b = d[k] ? BLOCKS_BY_ID[d[k] as string] : null;
      if (!b) return;
      if (b.id === 'athletik') athletik++;
      const keys = Object.entries(b.attributes) as [AttributeKey, number][];
      if (!keys.length) return;
      units++;
      const f = factor(b) * LEARN[b.intensity] * (k === 'extra' ? 1.15 : 1);
      eff += f;
      for (const [a, w] of keys) { const gk = GROUP_OF[a]; if (gk) groups[gk] += w * f; }
    });
  });
  const fitnessPerDay = trainDays ? Math.round((DAILY_BASE_RECOVERY - load / trainDays) * 10) / 10 : DAILY_BASE_RECOVERY;
  const overload = clamp((-1.5 - fitnessPerDay) * 0.02, 0, 0.05);
  const devFactor = Math.round((0.94 + 0.1 * clamp(eff / 11, 0, 1.1) - overload) * 1000) / 1000;
  // Referenz: ausgewogene Woche ≈ 9 Belastungspunkte über 6 je Tag.
  const injuryIndex = Math.round(Math.max(0.2, risk / 9) * (1 - Math.min(0.15, athletik * 0.05)) * 100) / 100;
  return { groups, units, trainDays, fitnessPerDay, load: Math.round(load * 10) / 10, injuryIndex, devFactor: clamp(devFactor, 0.9, 1.05) };
}

export { EXTRA_SLOT_MULTIPLIER };

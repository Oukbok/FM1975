// =============================================================================
// 1975 – A Football Manager — Monats-Kalender: planbare Aktivitäten
// =============================================================================
// Der Manager kann an FREIEN Tagen (kein Pflichtspiel, kein Spieltag, keine
// Kollision mit anderen Planungen) Aktivitäten einplanen:
//
//   • Trainingslager   — mehrtägig, kostet Geld, hebt Fitness/Form/Teamgeist
//   • Freundschaftsspiel— 1 Tag, kleiner Erlös, hebt Fitness/Form
//   • Teambuilding-Event— kurz, hebt Moral/Form/Teamgeist
//
// Kosten werden bei der PLANUNG sofort gebucht (skaliert via economyScale). Die
// EFFEKTE werden erreicht, sobald das Enddatum im Kalender erreicht ist
// (App.processDay), und wirken über die bestehenden Form-/Fitness-/Moral-
// Mechaniken. Alle Datumsberechnungen laufen in UTC.
// =============================================================================

export type ActivityType = 'camp' | 'friendly' | 'teambuilding';

/** Statische Definition eines Aktivitätstyps. */
export interface ActivityDef {
  type: ActivityType;
  name: string;
  icon: string;
  desc: string;
  /** Dauer in Tagen (min/max). */
  minDays: number;
  maxDays: number;
  /** Grundkosten (DM, Basis 1975) pro Tag. */
  costPerDayBase: number;
  /** Effekt-Kennzahlen (pro Aktivität, nicht pro Tag). */
  fitness: number;   // Fitness-Punkte auf den Kader
  form: number;      // Form-Punkte
  morale: number;    // Moral-Schub (Stufen-Wahrscheinlichkeit)
  /** Kleiner Erlös (DM, Basis 1975) — nur Freundschaftsspiel. */
  incomeBase?: number;
}

export const ACTIVITY_DEFS: Record<ActivityType, ActivityDef> = {
  camp: {
    type: 'camp', name: 'Trainingslager', icon: '🏕️',
    desc: 'Mehrtägiges Trainingslager: intensive Arbeit an Fitness und Zusammenhalt.',
    minDays: 3, maxDays: 10, costPerDayBase: 9000,
    fitness: 12, form: 5, morale: 1,
  },
  friendly: {
    type: 'friendly', name: 'Freundschaftsspiel', icon: '🤝',
    desc: 'Testspiel an einem freien Termin: Spielpraxis, etwas Fitness & Erlös.',
    minDays: 1, maxDays: 1, costPerDayBase: 0,
    fitness: 5, form: 4, morale: 0, incomeBase: 22000,
  },
  teambuilding: {
    type: 'teambuilding', name: 'Teambuilding-Event', icon: '🎉',
    desc: 'Kurzes Event für den Teamgeist: hebt Moral und Form.',
    minDays: 1, maxDays: 2, costPerDayBase: 6000,
    fitness: 0, form: 3, morale: 1,
  },
};

/** Eine konkret eingeplante Aktivität im Spielstand. */
export interface PlannedActivity {
  id: string;
  type: ActivityType;
  /** Start- und Enddatum (ISO, UTC, inklusive). */
  startDate: string;
  endDate: string;
  label: string;
  /** Bereits gebuchte Gesamtkosten (DM, ära-gerecht zum Planungszeitpunkt). */
  cost: number;
  /** Ob der Effekt beim Erreichen des Enddatums bereits angewandt wurde. */
  applied: boolean;
}

let _aid = 0;
export function activityId(): string {
  _aid++;
  return `act_${Date.now().toString(36)}_${_aid}`;
}

// -----------------------------------------------------------------------------
// Datums-Helfer (durchgehend UTC)
// -----------------------------------------------------------------------------
/** Fügt `n` Tage zu einem ISO-Datum hinzu (UTC). */
export function addDaysUTC(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Alle ISO-Tage von start bis end (inklusive), UTC. */
export function daysInRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = startISO;
  let guard = 0;
  while (cur <= endISO && guard < 400) {
    out.push(cur);
    cur = addDaysUTC(cur, 1);
    guard++;
  }
  return out;
}

/** Grundkosten (Basisjahr) einer Aktivität über die gegebene Tagesspanne. */
export function activityCostBase(type: ActivityType, days: number): number {
  const def = ACTIVITY_DEFS[type];
  const d = Math.max(def.minDays, Math.min(def.maxDays, days));
  return def.costPerDayBase * d;
}

/** Erlös (Basisjahr) einer Aktivität (nur Freundschaftsspiel > 0). */
export function activityIncomeBase(type: ActivityType): number {
  return ACTIVITY_DEFS[type].incomeBase ?? 0;
}

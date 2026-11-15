// =============================================================================
// VERHANDLUNG MIT MITARBEITERN — reine Rechnung (ohne Spielstand)
// -----------------------------------------------------------------------------
// Wie bei Spielern (engine/contractNegotiation.ts), nur schlanker: Ein Angebot
// ist ein Paket aus Gehalt, Laufzeit, Handgeld, Erfolgsprämie, Abfindungsregel,
// Abwerbeschutz und zugesagter Fortbildung. Die Person bewertet das ganze Paket
// in „Gehalt-Gegenwert“ (Faktor der Stelle), unterschreibt ab ihrer verdeckten
// Schwelle, lehnt sonst mit einem Gegenvorschlag ab und verliert Geduld.
// Wer keine Stelle hat oder dem Verein verbunden ist, gibt eher nach; wer
// anderswo unter Vertrag steht, lässt sich bitten.
// Mit nur einem Gehaltsangebot gilt die alte Regel (engine/staffSkills.ts
// `acceptTolerance`) als Untergrenze der Nachgiebigkeit.
// =============================================================================
import { hash01 } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r2 = (x: number) => Math.round(x * 100) / 100;

export type StaffClause = 'wage' | 'years' | 'signing' | 'bonus' | 'severance' | 'protect' | 'course';
/** Abfindung bei Entlassung: höchstens drei Monatsgehälter | halbe Restlaufzeit | volle Restlaufzeit. */
export type SeveranceRule = 'cap' | 'standard' | 'full';
export const SEV_RANK: Record<SeveranceRule, number> = { cap: 0, standard: 1, full: 2 };

/** Ein Angebot. Gehalt als Faktor der Stelle, Einmalzahlungen in Monatsgehältern. */
export interface StaffTerms {
  factor: number;
  years: number;
  /** Handgeld bei Unterschrift (Monatsgehälter). */
  signing: number;
  /** Erfolgsprämie am Saisonende, wenn das Saisonziel erreicht ist (Monatsgehälter). */
  bonus: number;
  severance: SeveranceRule;
  /** Abwerbeschutz: Solange der Vertrag läuft, wechselt die Person nicht zu einem anderen Verein. */
  protect: boolean;
  /** Fortbildung gleich nach der Unterschrift (du zahlst). */
  course: boolean;
}

export interface StaffNegCtx {
  /** Geforderter Gehaltsfaktor für die Stelle (game/trainerTeam.ts `demandOf`). */
  demand: number;
  /** Spielraum des Vereins (Ruf), 0–0,1. */
  tolerance: number;
  age: number;
  /** Eignung für die Stelle 1–99. */
  level: number;
  /** Steht bei einem anderen Verein unter Vertrag. */
  employed: boolean;
  /** Jahre ohne Stelle. */
  yearsFree: number;
  /** Dem Verein verbunden (früherer Spieler) oder schon bei dir angestellt. */
  bond: boolean;
  /** Verlängerung eines eigenen Mitarbeiters (kein Handgeld für einen Wechsel). */
  extend?: boolean;
  /** Leitende Trainerstelle (Cheftrainer, Co-Trainer). */
  coach: boolean;
  eager: boolean;
  /** Fortbildung in diesem Jahr noch möglich. */
  canCourse: boolean;
  /** Chance, das Saisonziel zu erreichen (0..1). */
  pGoal: number;
  seed: string;
}

export interface StaffDemand {
  ask: StaffTerms;
  /** Verdeckte Schwelle (Gehalt-Gegenwert). */
  reservation: number;
  weights: Record<StaffClause, number>;
  range: [number, number];
  ideal: number;
}

export const STAFF_MAX_ROUNDS = 5;
export const STAFF_KEYS: StaffClause[] = ['wage', 'years', 'signing', 'bonus', 'severance', 'protect', 'course'];

function yearsWish(c: StaffNegCtx): { range: [number, number]; ideal: number } {
  if (c.age >= 52) return { range: [3, 4], ideal: 4 };
  if (c.age >= 40) return { range: [2, 4], ideal: 3 };
  return c.coach && c.level >= 72 ? { range: [1, 2], ideal: 2 } : { range: [1, 3], ideal: 2 };
}

const ambition = (c: StaffNegCtx) => (c.level >= 75 && c.age < 50 ? 1 : c.level >= 65 && c.age < 45 ? 0.6 : 0.25);

export function buildStaffDemand(c: StaffNegCtx): StaffDemand {
  const h = (s: string) => hash01(`${c.seed}|${s}`);
  const { range, ideal } = yearsWish(c);
  const margin = 0.03 + 0.05 * h('m') + Math.min(0.09, c.yearsFree * 0.03) + (c.bond ? 0.03 : 0) - (c.employed ? 0.03 : 0);
  const amb = ambition(c);
  const ask: StaffTerms = {
    factor: r2(c.demand * (c.employed ? 1.06 : 1.02)),
    years: ideal,
    signing: c.extend ? 0 : c.employed ? 2 : c.yearsFree >= 1 ? 0 : c.level >= 70 ? 1 : 0,
    bonus: c.coach && c.level >= 62 ? 2 : c.level >= 78 ? 1 : 0,
    severance: c.age >= 50 || (c.coach && c.level >= 70) ? 'full' : 'standard',
    protect: false,
    course: c.canCourse && c.eager,
  };
  const weights: Record<StaffClause, number> = {
    wage: 3, years: c.age >= 52 ? 3 : 2, signing: c.employed ? 2 : 1, bonus: c.coach ? 2 : 1,
    severance: c.age >= 50 ? 3 : c.coach ? 2 : 1, protect: amb >= 1 ? 3 : amb >= 0.6 ? 2 : 1, course: c.eager ? 3 : c.age < 40 ? 2 : 1,
  };
  const d: StaffDemand = { ask, reservation: 0, weights, range, ideal };
  d.reservation = c.demand * (1 - clamp(c.tolerance, 0, 0.1) - margin);
  return d;
}

/** Wert eines Pakets für die Person (Gehalt-Gegenwert als Faktor der Stelle). */
export function staffValue(t: StaffTerms, d: StaffDemand, c: StaffNegCtx): number {
  const D = c.demand;
  const [lo, hi] = d.range;
  const y = clamp(t.years, 1, 4);
  let v = t.factor;
  if (y < lo) v -= (lo - y) * 0.04 * D;
  if (y > hi) v -= (y - hi) * 0.04 * D;
  v -= Math.abs(y - d.ideal) * 0.012 * D;
  v += t.factor * t.signing / (12 * y) * (c.yearsFree >= 1 ? 1.1 : 0.9);
  v += t.factor * t.bonus * c.pGoal / 12 * (0.8 + 0.2 * ambition(c));
  v += t.severance === 'full' ? 0.03 * D * (c.age >= 50 ? 2 : 1) : t.severance === 'cap' ? -0.05 * D : 0;
  if (t.protect) v -= (0.02 + 0.05 * ambition(c)) * D;
  if (t.course && c.canCourse) v += 0.025 * D * (c.eager || c.age < 40 ? 2 : 1);
  return v;
}

export type StaffAnswerKind = 'accept' | 'close' | 'gap' | 'far' | 'insult';
export interface StaffAnswer {
  kind: StaffAnswerKind; accepted: boolean; ratio: number; patienceLoss: number;
  focus?: StaffClause; counter?: StaffTerms;
}

/** Größter Mangel aus ihrer Sicht (für den Hinweis). */
function focusOf(t: StaffTerms, d: StaffDemand, c: StaffNegCtx): StaffClause | undefined {
  const base = staffValue(t, d, c);
  let worst: StaffClause | undefined, gain = 0.004 * c.demand;
  const probes: [StaffClause, StaffTerms][] = [
    ['wage', { ...t, factor: Math.max(t.factor, d.ask.factor) }], ['years', { ...t, years: d.ideal }], ['signing', { ...t, signing: Math.max(t.signing, d.ask.signing) }],
    ['bonus', { ...t, bonus: Math.max(t.bonus, d.ask.bonus) }], ['severance', { ...t, severance: SEV_RANK[t.severance] < SEV_RANK[d.ask.severance] ? d.ask.severance : t.severance }],
    ['protect', { ...t, protect: false }], ['course', { ...t, course: t.course || d.ask.course }],
  ];
  for (const [k, p] of probes) { const g = staffValue(p, d, c) - base; if (g > gain) { gain = g; worst = k; } }
  return worst;
}

/** Antwort auf ein Angebot (deterministisch aus Seed, Runde und Angebot). */
export function staffAnswer(t: StaffTerms, d: StaffDemand, c: StaffNegCtx, cur: StaffTerms, round: number, locks: readonly StaffClause[] = []): StaffAnswer {
  const val = staffValue(t, d, c);
  const jitter = (hash01(`${c.seed}|${round}|${Math.round(t.factor * 100)}|${t.years}`) - 0.5) * 0.02;
  const ratio = val / Math.max(0.01, d.reservation);
  if (ratio >= 1 + jitter) return { kind: 'accept', accepted: true, ratio, patienceLoss: 0 };
  const kind: StaffAnswerKind = ratio < 0.82 ? 'insult' : ratio < 0.92 ? 'far' : ratio < 0.98 ? 'gap' : 'close';
  const patienceLoss = (kind === 'insult' ? 50 : kind === 'far' ? 34 : kind === 'gap' ? 22 : 14) + Math.min(9, locks.length * 3);
  return { kind, accepted: false, ratio, patienceLoss, focus: focusOf(t, d, c), counter: staffCounter(t, cur, d, c, round, locks) };
}

/** Gegenvorschlag: kommt bei Nebensachen entgegen, beharrt auf dem Wichtigen, gleicht über das Gehalt aus. */
export function staffCounter(o: StaffTerms, cur: StaffTerms, d: StaffDemand, c: StaffNegCtx, round: number, locks: readonly StaffClause[] = []): StaffTerms {
  const locked = new Set(locks);
  const conc = (k: StaffClause) => clamp(0.5 - 0.12 * d.weights[k] + 0.06 * round, 0.1, 0.8);
  const x: StaffTerms = { ...cur };
  x.years = locked.has('years') || (o.years >= d.range[0] && o.years <= d.range[1]) ? o.years : clamp(o.years, d.range[0], d.range[1]);
  for (const k of ['signing', 'bonus'] as const) x[k] = locked.has(k) || o[k] >= cur[k] ? o[k] : Math.round(cur[k] + (o[k] - cur[k]) * conc(k));
  x.severance = locked.has('severance') || SEV_RANK[o.severance] >= SEV_RANK[cur.severance] ? o.severance
    : d.weights.severance >= 3 && round < 3 ? cur.severance : (SEV_RANK[o.severance] === 0 && d.weights.severance >= 2 ? 'standard' : o.severance);
  x.protect = locked.has('protect') ? o.protect : o.protect && !(d.weights.protect >= 3 && round < 3);
  x.course = locked.has('course') ? o.course : o.course || (c.canCourse && d.weights.course >= 3);
  // Gehalt: Bluff über der Schwelle schmilzt mit jeder Runde; nie unter dein Angebot.
  const open = staffValue(d.ask, d, c);
  const target = d.reservation * 1.02 + Math.max(0, open - d.reservation * 1.02) * Math.max(0, 1 - 0.4 * round);
  const fill = (t: StaffTerms) => target - staffValue(t, d, c);
  x.factor = o.factor;
  if (!locked.has('wage')) {
    const gap = fill(x);
    if (gap > 0) x.factor += gap / (1 + x.signing / (12 * clamp(x.years, 1, 4)) + x.bonus * c.pGoal / 12);
  } else {
    // Gehalt steht fest: über das Handgeld, notfalls doch über das Gehalt.
    for (let i = 0; i < 6 && fill(x) > 0 && !locked.has('signing') && x.signing < 6; i++) x.signing += 1;
    const rest = fill(x);
    if (rest > 0) x.factor += rest;
  }
  x.factor = Math.ceil(x.factor * 100 - 1e-6) / 100;
  // Sein eigener Vorschlag muss ihm sicher reichen (auch nach dem Runden).
  for (let i = 0; i < 60 && staffValue(x, d, c) < d.reservation * 1.012; i++) x.factor = Math.round((x.factor + 0.01) * 100) / 100;
  return x;
}

/** Kosten eines Pakets in Monatsgehältern der Stelle bei Faktor 1 (für die Anzeige: × Monatsgehalt). */
export function staffCostMonths(t: StaffTerms, pGoal: number): { first: number; total: number; oneOff: number } {
  const y = clamp(t.years, 1, 4);
  const oneOff = t.factor * t.signing + (t.course ? t.factor * 3 : 0);
  const season = t.factor * (12 + t.bonus * pGoal);
  return { first: season + oneOff, total: season * y + oneOff, oneOff };
}

// =============================================================================
// EINGESPIELTHEIT (Wunsch Pascal: Umstellen kostet, eine Mannschaft spielt sich ein)
// -----------------------------------------------------------------------------
// Jede Mannschaft hat eine Taktik „im Kopf“: eingeübte Anweisungen (`p`, gleitende
// Werte), die Vertrautheit mit Formationen (`f`, 0–100) und eine Stammelf (`s`).
// Die Eingespieltheit (0–100) ist der Abstand zwischen dem Eingeübten und dem, was
// der Trainer gerade verlangt:
//   40 % Formation · 42 % Anweisungen · 18 % Stammelf
// Mit jedem Spiel und jeder taktischen Trainingseinheit rückt das Eingeübte näher
// an die Vorgabe. Wer ständig umstellt, bleibt dazwischen hängen.
// Wirkung im Spiel (engine/match/state.ts): 80 = neutral, 100 ≈ +1,6 % auf Angriff,
// Kontrolle und Abwehr, 50 ≈ −2,4 % und mehr Fehler im Aufbau; Raumdeckung greift
// nur mit eingespielter Mannschaft (engine/match/tacticPlan.ts).
// Reine Rechnung – Ablauf (Training, KI, Migration) in game/cohesionGame.ts.
// =============================================================================
import type { Tactics } from '../types';
import { FORMATIONS, getFormation } from '../data/formations';
import { effectiveTactics, markingOf, stepOf, stepValue } from './tacticEra';

export interface Practiced {
  /** Anteil je Mentalität: defensiv, ausgewogen, offensiv, Konter (Summe 1). */
  st: [number, number, number, number];
  pr: number; te: number; li: number; wi: number; ha: number;
  /** Anteil langer Aufbau, Flanken (0 flach … 1 hoch), Abseitsfalle, Raumdeckung, Gegenpressing. */
  bu: number; cr: number; tr: number; mk: number; cp: number;
}
export interface Cohesion {
  p: Practiced;
  f: Record<string, number>;
  /** Stammelf: gleitender Anteil der Startelf, der schon im Spiel davor begann (0–1). */
  s: number;
  xi?: string[];
}

const STYLES = ['defensive', 'balanced', 'attacking', 'counter'] as const;
const styleIdx = (t: Tactics) => Math.max(0, STYLES.indexOf(t.style as (typeof STYLES)[number]));
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Zielwerte der Anweisungen aus einer Taktik (wie die Engine sie rechnet). */
function targetOf(t0: Tactics, year: number): Practiced {
  const t = effectiveTactics(t0, year)!;
  const st: Practiced['st'] = [0, 0, 0, 0];
  st[styleIdx(t)] = 1;
  return {
    st, pr: t.pressing ?? 50, te: t.tempo ?? 50, li: t.defensiveLine ?? 50, wi: t.widthFocus ?? 50, ha: t.tackleHardness ?? 50,
    bu: t.buildup === 'long' ? 1 : 0, cr: t.crossStyle === 'high' ? 1 : t.crossStyle === 'low' ? 0 : 0.5,
    tr: t.offsideTrap ? 1 : 0, mk: markingOf(t, year) === 'zone' ? 1 : 0, cp: t.counterPress ? 1 : 0,
  };
}

/** Gewicht je Anweisung: wie viel Einüben sie braucht. */
export const GAP_PARTS: { key: keyof Practiced; label: string; w: number }[] = [
  { key: 'st', label: 'Mentalität', w: 1.2 },
  { key: 'mk', label: 'Deckung', w: 1.4 },
  { key: 'pr', label: 'Pressing', w: 1.0 },
  { key: 'li', label: 'Abwehrlinie', w: 1.0 },
  { key: 'bu', label: 'Aufbau', w: 0.8 },
  { key: 'cp', label: 'Gegenpressing', w: 0.8 },
  { key: 'tr', label: 'Abseitsfalle', w: 0.7 },
  { key: 'te', label: 'Tempo', w: 0.6 },
  { key: 'wi', label: 'Breite', w: 0.6 },
  { key: 'cr', label: 'Flanken', w: 0.3 },
  { key: 'ha', label: 'Zweikampfhärte', w: 0.25 },
];
const NUM = new Set<keyof Practiced>(['pr', 'te', 'li', 'wi', 'ha']);
/** Ab diesem gewichteten Abstand sind die Anweisungen völlig fremd. */
const GAP_FULL = 2.0;

function partGap(p: Practiced, tg: Practiced, key: keyof Practiced): number {
  if (key === 'st') return 1 - p.st[tg.st.indexOf(1)];
  const a = p[key] as number, b = tg[key] as number;
  return NUM.has(key) ? Math.min(1, Math.abs(a - b) / 80) : Math.abs(a - b);
}

/** Abstand der verlangten von den eingeübten Anweisungen, je Anweisung und gesamt (0 = deckungsgleich). */
export function instructionGap(co: Cohesion, t: Tactics, year: number): { total: number; parts: { key: keyof Practiced; label: string; gap: number }[] } {
  const tg = targetOf(t, year);
  let total = 0;
  const parts = GAP_PARTS.map(({ key, label, w }) => { const gap = partGap(co.p, tg, key); total += gap * w; return { key, label, gap }; });
  return { total, parts };
}

// --- Formationen ---------------------------------------------------------------
const simCache = new Map<string, number>();
/** Zwischenspeicher leeren (game/resetModuleState.ts). */
export function clearCohesionCache(): void { simCache.clear(); }
/** Ähnlichkeit zweier Formationen: Anteil gleicher Positionen (0–1). */
export function formationSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const k = a < b ? `${a}|${b}` : `${b}|${a}`;
  let v = simCache.get(k);
  if (v == null) {
    const left = getFormation(b).slots.map((s) => s.position as string);
    let hit = 0;
    for (const s of getFormation(a).slots) { const i = left.indexOf(s.position); if (i >= 0) { hit++; left.splice(i, 1); } }
    v = hit / 11;
    simCache.set(k, v);
  }
  return v;
}
/** Vertrautheit mit einer Formation (0–100): eigener Wert oder abgeleitet aus ähnlichen Systemen. */
export function formationFam(co: Cohesion, id: string): number {
  let best = co.f[id] ?? 0;
  for (const [g, v] of Object.entries(co.f)) {
    if (g === id) continue;
    const s = formationSimilarity(g, id);
    const x = v * s * Math.sqrt(s);
    if (x > best) best = x;
  }
  return best;
}

export interface CohesionView { total: number; formation: number; instructions: number; lineup: number }
/** Eingespieltheit für eine Taktik (0–100) mit den drei Anteilen. */
export function cohesionOf(co: Cohesion, t: Tactics, year: number, formation = t.formation): CohesionView {
  const fam = formationFam(co, getFormation(formation).id);
  const ins = clamp(1 - instructionGap(co, t, year).total / GAP_FULL, 0, 1) * 100;
  const lu = clamp((co.s - 0.4) / 0.45, 0, 1) * 100;
  return { total: Math.round(0.4 * fam + 0.42 * ins + 0.18 * lu), formation: Math.round(fam), instructions: Math.round(ins), lineup: Math.round(lu) };
}

/** Neutralpunkt: ohne Angabe (Labor, Altbestand) rechnet die Engine mit diesem Wert. */
export const COHESION_NEUTRAL = 80;
/** Faktor auf Angriff, Kontrolle und Abwehr. */
export const cohesionFactor = (total: number): number => 1 + (total - COHESION_NEUTRAL) / 100 * 0.08;
/** Fehler im Aufbau (Faktor ≥ 1). */
export const cohesionErrors = (total: number): number => 1 + Math.max(0, COHESION_NEUTRAL - total) / 100 * 0.6;

// --- Einüben ---------------------------------------------------------------------
export function initCohesion(t: Tactics, year: number, fam = 88, stable = 0.85): Cohesion {
  return { p: targetOf(t, year), f: { [getFormation(t.formation).id]: fam }, s: stable };
}

/** Eingeübtes rückt um `rate` (0–1) an die Vorgabe; die Formation gewinnt `fRate` des Rests bis 100. */
export function practice(co: Cohesion, t: Tactics, year: number, rate: number, fRate: number): void {
  const tg = targetOf(t, year), p = co.p;
  const r = clamp(rate, 0, 1);
  for (let i = 0; i < 4; i++) p.st[i] += (tg.st[i] - p.st[i]) * r;
  for (const k of ['pr', 'te', 'li', 'wi', 'ha', 'bu', 'cr', 'tr', 'mk', 'cp'] as const) p[k] += (tg[k] - p[k]) * r;
  const id = getFormation(t.formation).id;
  const cur = co.f[id] ?? formationFam(co, id) * 0.75;
  co.f[id] = Math.min(100, cur + (100 - cur) * clamp(fRate, 0, 1));
}

/** Nach einem Pflichtspiel: Einüben, andere Formationen verblassen langsam, Stammelf fortschreiben. */
export function noteMatch(co: Cohesion, t: Tactics, year: number, xi: string[]): void {
  const id = getFormation(t.formation).id;
  for (const k of Object.keys(co.f)) {
    if (k === id) continue;
    co.f[k] *= 0.997;
    if (co.f[k] < 5) delete co.f[k];
  }
  practice(co, t, year, 0.14, 0.08);
  if (co.xi?.length) {
    const prev = new Set(co.xi);
    const same = xi.filter((x) => prev.has(x)).length / Math.max(1, xi.length);
    co.s = clamp(co.s * 0.72 + same * 0.28, 0, 1);
  }
  co.xi = xi.slice(0, 11);
}

/** Die eingeübten Anweisungen als wählbare Stufen/Schalter (Markierung auf der Taktik-Seite, „Eingeübtes wiederherstellen“). */
export function practicedTactics(co: Cohesion): Pick<Tactics, 'style' | 'pressing' | 'tempo' | 'defensiveLine' | 'widthFocus' | 'tackleHardness' | 'buildup' | 'crossStyle' | 'offsideTrap' | 'marking' | 'counterPress'> {
  const p = co.p;
  const near = (v: number) => stepValue(stepOf(v));
  return {
    style: STYLES[p.st.indexOf(Math.max(...p.st))],
    pressing: near(p.pr), tempo: near(p.te), defensiveLine: near(p.li), widthFocus: near(p.wi), tackleHardness: near(p.ha),
    buildup: p.bu >= 0.5 ? 'long' : 'short', crossStyle: p.cr > 0.75 ? 'high' : p.cr < 0.25 ? 'low' : 'mixed',
    offsideTrap: p.tr >= 0.5, marking: p.mk >= 0.5 ? 'zone' : 'man', counterPress: p.cp >= 0.5,
  };
}

/** Kennt die Mannschaft überhaupt ein System? (Schutz für leere/kaputte Daten.) */
export const validCohesion = (co: Cohesion | undefined): co is Cohesion =>
  !!co && !!co.p && Array.isArray(co.p.st) && co.p.st.length === 4 && !!co.f && typeof co.s === 'number';

export const knownFormations = (co: Cohesion): string[] => FORMATIONS.map((f) => f.id).filter((id) => (co.f[id] ?? 0) >= 5);

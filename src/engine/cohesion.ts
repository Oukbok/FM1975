// =============================================================================
// EINGESPIELTHEIT (Wunsch Pascal: Umstellen kostet, eine Mannschaft spielt sich ein)
// -----------------------------------------------------------------------------
// Jede Mannschaft hat eine Taktik „im Kopf“: eingeübte Anweisungen (`p`, gleitende
// Werte), die Vertrautheit mit Formationen (`f`, 0–100) und eine Stammelf (`s`).
// Die Eingespieltheit (0–100) ist der Abstand zwischen dem Eingeübten und dem, was
// der Trainer gerade verlangt (Wunsch Pascal, exakt):
//   40 % Formation · 40 % Anweisungen · 20 % Stammelf
// Stammelf = gewichteter Anteil der aufgestellten Elf, der in den letzten drei
// Pflichtspielen begann: letztes Spiel 50 %, vorletztes 30 %, drittletztes 20 %.
// Einziger Zusatz: Liegt Formation oder Anweisungen unter 50 („fremd“), zieht ein
// Abzug von 0,35 je fehlendem Punkt bis 50 das Ganze nach unten (`cohesionTotal`).
// Mit jedem Spiel und jeder taktischen Trainingseinheit rückt das Eingeübte näher
// an die Vorgabe. Wer ständig umstellt, bleibt dazwischen hängen.
// Wirkung im Spiel (engine/match/state.ts): 80 = neutral, 100 ≈ +1,6 % auf Angriff,
// Kontrolle und Abwehr, 50 ≈ −2,4 % und mehr Fehler im Aufbau; Raumdeckung greift
// nur mit eingespielter Mannschaft (engine/match/tacticPlan.ts).
// Reine Rechnung – Ablauf (Training, KI, Migration) in game/cohesionGame.ts.
// =============================================================================
import type { Tactics } from '../types';
import { FORMATIONS, getFormation } from '../data/formations';
import { defStyleOf, effectiveTactics, markingOf, stepOf, stepValue } from './tacticEra';
const DSTYLES = ['defensive', 'balanced', 'attacking'] as const;

export interface Practiced {
  /** Anteil je Mentalität: defensiv, ausgewogen, offensiv, Konter (Summe 1). */
  st: [number, number, number, number];
  pr: number; te: number; li: number; wi: number; ha: number;
  /** Anteil langer Aufbau, Flanken (0 flach … 1 hoch), Abseitsfalle, Raumdeckung, Gegenpressing. */
  bu: number; cr: number; tr: number; mk: number; cp: number;
  /** Anteil je Mentalität gegen den Ball: defensiv, ausgewogen, offensiv (fehlt in alten Spielständen = wie verlangt). */
  ds?: [number, number, number];
}
export interface Cohesion {
  p: Practiced;
  f: Record<string, number>;
  /** Stammelf-Wert (0–1) des letzten Pflichtspiels; gilt, solange keine Elf bekannt ist bzw. ohne Vorgeschichte. */
  s: number;
  /** Startelfen der letzten drei Pflichtspiele, neueste zuerst (fehlt in alten Spielständen). */
  xis?: string[][];
  /** Alt: nur die Startelf des letzten Spiels – wird beim nächsten Spiel nach `xis` übernommen. */
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
  const ds: [number, number, number] = [0, 0, 0];
  ds[DSTYLES.indexOf(defStyleOf(t))] = 1;
  return {
    st, ds, pr: t.pressing ?? 50, te: t.tempo ?? 50, li: t.defensiveLine ?? 50, wi: t.widthFocus ?? 50, ha: t.tackleHardness ?? 50,
    bu: t.buildup === 'long' ? 1 : 0, cr: t.crossStyle === 'high' ? 1 : t.crossStyle === 'low' ? 0 : 0.5,
    tr: t.offsideTrap ? 1 : 0, mk: markingOf(t, year) === 'zone' ? 1 : 0, cp: t.counterPress ? 1 : 0,
  };
}

/** Gewicht je Anweisung: wie viel Einüben sie braucht. */
export const GAP_PARTS: { key: keyof Practiced; label: string; w: number }[] = [
  { key: 'st', label: 'Mentalität mit Ball', w: 0.8 },
  { key: 'ds', label: 'Mentalität gegen den Ball', w: 0.6 },
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
  if (key === 'ds') return p.ds ? 1 - p.ds[tg.ds!.indexOf(1)] : 0;
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

// --- Gesamtwert -------------------------------------------------------------------
/** Anteile am Gesamtwert (Wunsch Pascal). */
export const COHESION_WEIGHTS = { formation: 0.4, instructions: 0.4, lineup: 0.2 } as const;
/** Stammelf: Gewicht der letzten drei Spiele, neuestes zuerst (bei kürzerer Vorgeschichte neu normiert). */
export const LINEUP_GAME_WEIGHTS = [0.5, 0.3, 0.2] as const;
/** Unter diesem Wert gilt Formation bzw. Anweisungen als fremd … */
export const FOREIGN_BELOW = 50;
/** … und jeder fehlende Punkt bis dahin kostet so viel vom Gesamtwert. */
export const FOREIGN_PENALTY = 0.35;

/** Gespeicherte Startelfen (neueste zuerst); alte Spielstände kennen nur `xi`. */
export const lineupHistory = (co: Cohesion): string[][] => co.xis ?? (co.xi?.length ? [co.xi] : []);

/** Stammelf-Wert (0–1): gewichteter Anteil von `xi`, der in den gespeicherten Startelfen begann; `null` ohne Vorgeschichte. */
export function lineupShare(xi: readonly string[], history: readonly (readonly string[])[]): number | null {
  const h = history.slice(0, LINEUP_GAME_WEIGHTS.length);
  if (!xi.length || !h.length) return null;
  let sum = 0, wSum = 0;
  h.forEach((prev, i) => {
    const set = new Set(prev);
    sum += LINEUP_GAME_WEIGHTS[i] * xi.filter((x) => set.has(x)).length / xi.length;
    wSum += LINEUP_GAME_WEIGHTS[i];
  });
  return sum / wSum;
}

/** Gesamtwert aus den drei Anteilen (je 0–100): 40/40/20 und Abzug für einen fremden Teil. */
export function cohesionTotal(formation: number, instructions: number, lineup: number): { total: number; linear: number; penalty: number } {
  const W = COHESION_WEIGHTS;
  const linear = W.formation * formation + W.instructions * instructions + W.lineup * lineup;
  const penalty = FOREIGN_PENALTY * Math.max(0, FOREIGN_BELOW - Math.min(formation, instructions));
  return { total: clamp(linear - penalty, 0, 100), linear, penalty };
}

export interface CohesionView { total: number; formation: number; instructions: number; lineup: number; penalty: number }
/**
 * Eingespieltheit für eine Taktik (0–100) mit den drei Anteilen. `xi` = aufgestellte Elf
 * (Taktik-Seite: Aufstellung, im Spiel: Startelf); ohne Elf oder Vorgeschichte gilt der
 * Stammelf-Wert des letzten Spiels (`co.s`).
 */
export function cohesionOf(co: Cohesion, t: Tactics, year: number, formation = t.formation, xi?: readonly string[]): CohesionView {
  const fam = formationFam(co, getFormation(formation).id);
  const ins = clamp(1 - instructionGap(co, t, year).total / GAP_FULL, 0, 1) * 100;
  const lu = clamp((xi ? lineupShare(xi, lineupHistory(co)) : null) ?? co.s, 0, 1) * 100;
  const r = cohesionTotal(fam, ins, lu);
  return { total: Math.round(r.total), formation: Math.round(fam), instructions: Math.round(ins), lineup: Math.round(lu), penalty: Math.round(r.penalty) };
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
  if (!p.ds) p.ds = [...tg.ds!] as [number, number, number]; // alter Spielstand: gilt als eingeübt
  else for (let i = 0; i < 3; i++) p.ds[i] += (tg.ds![i] - p.ds[i]) * r;
  for (const k of ['pr', 'te', 'li', 'wi', 'ha', 'bu', 'cr', 'tr', 'mk', 'cp'] as const) p[k] += (tg[k] - p[k]) * r;
  const id = getFormation(t.formation).id;
  const cur = co.f[id] ?? formationFam(co, id) * 0.75;
  co.f[id] = Math.min(100, cur + (100 - cur) * clamp(fRate, 0, 1));
}

/** Nach einem Pflichtspiel: Einüben, andere Formationen verblassen langsam; Stammelf-Wert dieses Spiels merken, Elf vorn in die Liste der letzten drei. */
export function noteMatch(co: Cohesion, t: Tactics, year: number, xi: string[]): void {
  const id = getFormation(t.formation).id;
  for (const k of Object.keys(co.f)) {
    if (k === id) continue;
    co.f[k] *= 0.997;
    if (co.f[k] < 5) delete co.f[k];
  }
  practice(co, t, year, 0.14, 0.08);
  const hist = lineupHistory(co);
  const now = xi.slice(0, 11);
  co.s = lineupShare(now, hist) ?? co.s;
  co.xis = [now, ...hist].slice(0, LINEUP_GAME_WEIGHTS.length);
  delete co.xi;
}

/** Die eingeübten Anweisungen als wählbare Stufen/Schalter (Markierung auf der Taktik-Seite, „Eingeübtes wiederherstellen“). */
export function practicedTactics(co: Cohesion): Pick<Tactics, 'style' | 'defStyle' | 'pressing' | 'tempo' | 'defensiveLine' | 'widthFocus' | 'tackleHardness' | 'buildup' | 'crossStyle' | 'offsideTrap' | 'marking' | 'counterPress'> {
  const p = co.p;
  const near = (v: number) => stepValue(stepOf(v));
  return {
    style: STYLES[p.st.indexOf(Math.max(...p.st))],
    ...(p.ds ? { defStyle: DSTYLES[p.ds.indexOf(Math.max(...p.ds))] } : {}),
    pressing: near(p.pr), tempo: near(p.te), defensiveLine: near(p.li), widthFocus: near(p.wi), tackleHardness: near(p.ha),
    buildup: p.bu >= 0.5 ? 'long' : 'short', crossStyle: p.cr > 0.75 ? 'high' : p.cr < 0.25 ? 'low' : 'mixed',
    offsideTrap: p.tr >= 0.5, marking: p.mk >= 0.5 ? 'zone' : 'man', counterPress: p.cp >= 0.5,
  };
}

/** Kennt die Mannschaft überhaupt ein System? (Schutz für leere/kaputte Daten.) */
export const validCohesion = (co: Cohesion | undefined): co is Cohesion =>
  !!co && !!co.p && Array.isArray(co.p.st) && co.p.st.length === 4 && !!co.f && typeof co.s === 'number';

export const knownFormations = (co: Cohesion): string[] => FORMATIONS.map((f) => f.id).filter((id) => (co.f[id] ?? 0) >= 5);

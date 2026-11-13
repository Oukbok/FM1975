// =============================================================================
// Seitenlinie im Textmodus: Aufwärmen, Co-Trainer-Wechsel, Umstellung der
// Formation, Einzelgespräche. Nur für vom Menschen gecoachte Teams – KI-Teams
// und die Schnellsimulation nutzen nichts davon (Balance bleibt unverändert).
// =============================================================================
import type { FormationSlot } from '../../data/formations';
import { getFormation } from '../../data/formations';
import { POSITION_GROUPS } from '../../types';
import { refreshSkills } from './skills';
import { bench, lineupChanged, onPitch, type TeamState } from './state';
import { matchBase } from './team';
import type { MPlayer, PlayerTalk, Side } from './types';
import type { MatchSim } from './sim';

/** Ab so vielen Minuten Aufwärmen gilt ein Ersatzspieler als „warm“. */
export const WARM_MINUTES = 3;
/** Kraft-Vorteil eines aufgewärmten Einwechselspielers. */
export const WARM_ENERGY = 4;
/** Tagesleistungs-Vorteil (kommt schneller ins Spiel). */
export const WARM_DAY = 1.01;

export const isWarm = (sim: MatchSim, m: MPlayer): boolean =>
  m.warmSince != null && sim.minute - m.warmSince >= WARM_MINUTES;

/** Ersatzspieler zum Aufwärmen schicken bzw. zurückholen. */
export function warmUp(sim: MatchSim, side: Side, id: string, on: boolean): boolean {
  const t = sim.team(side);
  const m = bench(t).find((x) => x.id === id);
  if (!m || sim.finished || sim.phase === 'shootout') return false;
  if (on === (m.warmSince != null)) return false;
  m.warmSince = on ? sim.minute : null;
  if (on) sim.emit('warmup', { side, player: id });
  return true;
}

/** Alle Ersatzspieler setzen sich wieder. */
export function stopWarmUps(sim: MatchSim, side: Side): void {
  for (const m of bench(sim.team(side))) m.warmSince = null;
}

/** Wirkung beim Einwechseln: Aufgewärmte kommen frischer und schneller ins Spiel. */
export function applyWarmBonus(sim: MatchSim, m: MPlayer): void {
  if (isWarm(sim, m)) {
    m.energy = Math.min(100, m.energy + WARM_ENERGY);
    m.day = (m.day ?? 1) * WARM_DAY;
  }
  m.warmSince = null;
}

/** Langes Aufwärmen kostet etwas Kraft (alle fünf Minuten nach zehn Minuten). */
export function drainWarmUps(sim: MatchSim, t: TeamState): void {
  for (const m of t.players) {
    if (m.onPitch || m.warmSince == null) continue;
    if (sim.minute - m.warmSince > 10) m.energy = Math.max(70, m.energy - 0.6);
  }
}

/**
 * Co-Trainer des menschlichen Trainers (Option „Automatische Auswechslungen“):
 * wärmt bei nachlassender Kraft einen Ersatz auf und wechselt Erschöpfte bzw.
 * angeschlagen Weiterspielende aus. Ausrichtung und Taktik bleiben unangetastet.
 */
export function assistantCoach(sim: MatchSim, t: TeamState): void {
  const min = sim.minute;
  if (sim.stoppage || min < 46 || min % 2 !== 0 || sim.subsLeft(t) <= 0) return;
  const cands = onPitch(t).filter((m) => m.group !== 'GK' || m.injured)
    .map((m) => ({ m, need: m.injured ? 9 : (64 - m.energy) / 6 + (min >= 75 ? 0.3 : 0) }))
    .sort((a, b) => b.need - a.need);
  const c = cands[0];
  if (!c || c.need <= 0) return;
  const rep = bestWarmReplacement(sim, t, c.m);
  if (!rep) return;
  // Letzten Wechsel bis zur Schlussphase für Notfälle aufheben
  if (!c.m.injured && sim.subsLeft(t) === 1 && min < 80) return;
  if (!c.m.injured && c.m.energy >= 58) {
    if (rep.warmSince == null) warmUp(sim, t.side, rep.id, true);
    return;
  }
  sim.substitute(t.side, c.m.id, rep.id, c.m.injured ? 'verletzt' : 'muede');
}

function bestWarmReplacement(sim: MatchSim, t: TeamState, out: MPlayer): MPlayer | undefined {
  const best = sim.bestReplacement(t, out);
  const warm = bench(t).find((b) => b.warmSince != null && (out.group === 'GK') === (b.p.naturalPosition === 'TW')
    && best && matchBase(b.p, out.pos) >= matchBase(best.p, out.pos) - 3);
  return warm ?? best;
}

/**
 * Umstellung: Formation und Slot-Belegung (Slot-ID → Spieler-ID) übernehmen.
 * Spieler auf dem Platz bekommen die Position ihres Slots; liefert die Zahl der Positionswechsel.
 */
export function reshape(sim: MatchSim, side: Side, formation: string, slots: FormationSlot[], map: Record<string, string>): number {
  const t = sim.team(side);
  if (sim.finished || sim.phase === 'shootout') return 0;
  const on = new Map(onPitch(t).map((m) => [m.id, m]));
  const clean: Record<string, string> = {};
  const used = new Set<string>();
  for (const s of slots) {
    const id = map[s.id];
    if (id && on.has(id) && !used.has(id)) { clean[s.id] = id; used.add(id); }
  }
  let moved = 0;
  for (const s of slots) {
    const m = clean[s.id] ? on.get(clean[s.id])! : null;
    if (!m || m.pos === s.position) continue;
    m.pos = s.position;
    m.group = POSITION_GROUPS[s.position];
    m.base = matchBase(m.p, s.position);
    moved++;
  }
  const changed = formation !== t.formation;
  t.formation = formation;
  t.layout = { formation, slots, map: clean };
  if (moved) lineupChanged(t);
  if (changed || moved) sim.emit('reshape', { side, value: getFormation(formation).label, detail: changed ? 'formation' : 'positions' });
  return moved;
}

/**
 * Einzelgespräch (einmal je Halbzeit und Spieler). Kleine Wirkung auf die Tagesleistung:
 * Lob hilft Spielern, die gut spielen; Fordern weckt schwache, kränkt aber starke;
 * Beruhigen hilft Verwarnten und Nervösen. Liefert 'gut' | 'neutral' | 'schlecht'.
 */
export function playerTalk(sim: MatchSim, side: Side, id: string, kind: PlayerTalk, gradeNow: number): 'gut' | 'neutral' | 'schlecht' | null {
  const t = sim.team(side);
  const m = onPitch(t).find((x) => x.id === id);
  if (!m || sim.finished || (m.talked ?? 0) === sim.period) return null;
  m.talked = sim.period;
  const a = m.p.attributes;
  const r = (sim.rng() - 0.5) * 0.006;
  let f = 1;
  if (kind === 'loben') f = gradeNow <= 3 ? 1.015 : gradeNow <= 4 ? 1.005 : 0.995;
  if (kind === 'fordern') f = gradeNow >= 4 ? 1.016 + (a.workRate ?? 50) / 10000 : gradeNow <= 2.5 ? 0.99 : 1.003;
  if (kind === 'beruhigen') f = m.yellow > 0 || (a.composure ?? 50) < 50 || sim.pressureNow() > 0.6 ? 1.012 : 1.002;
  f += r;
  m.day = (m.day ?? 1) * f;
  refreshSkills();
  t.dirty = true;
  const res = f >= 1.008 ? 'gut' : f < 0.998 ? 'schlecht' : 'neutral';
  m.talkRes = { kind, res, pct: Math.round((f - 1) * 1000) / 10, period: sim.period };
  sim.emit('ptalk', { side, player: id, value: kind, detail: res });
  return res;
}

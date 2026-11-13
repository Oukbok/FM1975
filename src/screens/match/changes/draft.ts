// =============================================================================
// Entwurf im Wechsel-Bildschirm: Formation, Slot-Belegung, Ausrichtung,
// Spiel-Taktik, Ansprache und Einzelgespräche. Erst „Bestätigen“ wendet ihn
// über die Engine-Eingriffe an (Wechsel → Umstellung → Taktik → Gespräche).
// =============================================================================
import { PITCH_GRID, clampField, nearestGrid } from '../../../data/pitchGrid';
import { FORMATIONS, getFormation, type FormationSlot } from '../../../data/formations';
import { cachedSuitability, matchBase } from '../../../engine/match/team';
import { playerTalk, reshape } from '../../../engine/match/sideline';
import { bench, onPitch, tacticsOf } from '../../../engine/match/state';
import type { MatchSim } from '../../../engine/match/sim';
import type { Mentality, MPlayer, PlayerTalk, Side, TeamTalk } from '../../../engine/match/types';
import type { Tactics } from '../../../types';
import { grade } from '../../../engine/match/finish';

export type TacticPatch = Partial<Pick<Tactics, 'tempo' | 'pressing' | 'widthFocus' | 'defensiveLine' | 'effort' | 'buildup'>>;

export interface Draft {
  formation: string;
  slots: FormationSlot[];
  /** Slot-ID → Spieler-ID (nur Spieler auf dem Platz bzw. eingewechselt). */
  map: Record<string, string>;
  mentality: Mentality;
  tactics: TacticPatch;
  talk: TeamTalk | null;
  talks: Record<string, PlayerTalk>;
}

export function initialDraft(sim: MatchSim, side: Side): Draft {
  const t = sim.team(side);
  const on = new Set(onPitch(t).map((m) => m.id));
  let slots = t.layout?.slots ?? getFormation(t.formation).slots;
  const map: Record<string, string> = {};
  if (t.layout) for (const s of slots) { const id = t.layout.map[s.id]; if (id && on.has(id)) map[s.id] = id; }
  else {
    const xs = onPitch(t);
    slots.forEach((s, i) => { if (xs[i]) map[s.id] = xs[i].id; });
  }
  slots = slots.map((s) => ({ ...s }));
  return { formation: t.layout?.formation ?? t.formation, slots, map, mentality: t.mentality, tactics: {}, talk: null, talks: {} };
}

/** Wer im Entwurf auf dem Platz steht / neu hinein soll / raus soll. */
export function draftDiff(sim: MatchSim, side: Side, d: Draft) {
  const t = sim.team(side);
  const now = new Set(onPitch(t).map((m) => m.id));
  const inDraft = new Set(Object.values(d.map));
  const ins = [...inDraft].filter((id) => !now.has(id));
  const outs = [...now].filter((id) => !inDraft.has(id));
  return { ins, outs, now, inDraft };
}

export const playerSlot = (d: Draft, id: string): string | null => {
  for (const k in d.map) if (d.map[k] === id) return k;
  return null;
};

/**
 * Zwei Einträge tauschen: Slot↔Slot (Positionen tauschen), Bank→Slot (Einwechslung geplant),
 * Slot→Bank. `a`/`b` sind Spieler-IDs oder „slot:<id>“ für einen leeren Slot. Liefert Fehlertext oder null.
 */
export function swap(sim: MatchSim, side: Side, d: Draft, a: string, b: string): string | null {
  if (a === b) return null;
  const t = sim.team(side);
  const benchIds = new Set(bench(t).map((m) => m.id));
  const sa = a.startsWith('slot:') ? a.slice(5) : playerSlot(d, a);
  const sb = b.startsWith('slot:') ? b.slice(5) : playerSlot(d, b);
  const map = { ...d.map };
  if (sa && sb) {
    const pa = map[sa], pb = map[sb];
    if (pb) map[sa] = pb; else delete map[sa];
    if (pa) map[sb] = pa; else delete map[sb];
  } else if (sa || sb) {
    const slot = (sa ?? sb)!;
    const benchId = sa ? b : a;
    if (benchId.startsWith('slot:') || (!benchIds.has(benchId) && !wasOnPitch(sim, side, benchId))) return 'Dieser Spieler kann nicht mehr eingewechselt werden.';
    map[slot] = benchId;
  } else return null;
  const next = { ...d, map };
  const { ins } = draftDiff(sim, side, next);
  if (ins.length > sim.subsLeft(t)) return sim.subsLeft(t) <= 0 ? 'Du hast keine Wechsel mehr.' : `Nur noch ${sim.subsLeft(t)} Wechsel möglich.`;
  d.map = map;
  return null;
}

const wasOnPitch = (sim: MatchSim, side: Side, id: string) => onPitch(sim.team(side)).some((m) => m.id === id);

/** Neue Formation: aktuelle Spieler so auf die Slots verteilen, dass die Eignung möglichst gut passt. */
export function changeFormation(sim: MatchSim, side: Side, d: Draft, id: string): void {
  const f = FORMATIONS.find((x) => x.id === id);
  if (!f) return;
  const ps = Object.values(d.map).map((pid) => sim.players[pid]).filter(Boolean);
  const slots = f.slots.map((s) => ({ ...s }));
  const map: Record<string, string> = {};
  const used = new Set<string>();
  const oldGk = d.slots.find((s) => s.position === 'TW');
  const gkId = oldGk ? d.map[oldGk.id] : undefined;
  const gkSlot = slots.find((s) => s.position === 'TW');
  if (gkId && gkSlot) { map[gkSlot.id] = gkId; used.add(gkId); }
  const pairs: [number, string, string][] = [];
  for (const s of slots) {
    if (map[s.id]) continue;
    for (const p of ps) if (!used.has(p.id)) pairs.push([cachedSuitability(p, s.position), s.id, p.id]);
  }
  pairs.sort((x, y) => y[0] - x[0]);
  for (const [, sid, pid] of pairs) {
    if (map[sid] || used.has(pid)) continue;
    map[sid] = pid; used.add(pid);
  }
  d.formation = f.id; d.slots = slots; d.map = map;
}

/** Tagesstärke eines Spielers auf einem Slot (für Anzeige im Entwurf). */
export function draftStrength(sim: MatchSim, side: Side, d: Draft, id: string): number {
  const m = sim.team(side).players.find((x) => x.id === id);
  const sid = playerSlot(d, id);
  const pos = sid ? d.slots.find((s) => s.id === sid)?.position : undefined;
  if (!m) return 0;
  return Math.round(pos ? matchBase(m.p, pos) : m.base);
}

/** Mannschaftsstärke des Entwurfs: Ø Positionsstärke × Tagesform × Kraft. */
export function draftTeamStrength(sim: MatchSim, side: Side, d: Draft): number {
  const t = sim.team(side);
  let sum = 0, n = 0;
  for (const s of d.slots) {
    const id = d.map[s.id];
    const m = id ? t.players.find((x) => x.id === id) : undefined;
    if (!m) continue;
    sum += matchBase(m.p, s.position) * m.cond * (0.8 + 0.2 * m.energy / 100);
    n++;
  }
  return n ? Math.round(sum / 11) : 0;
}

/** Entwurf anwenden. Wechsel zuerst (der Neue übernimmt den Slot des Ausgewechselten), dann Umstellung. */
export function applyDraft(sim: MatchSim, side: Side, d: Draft): void {
  const t = sim.team(side);
  const { ins, outs } = draftDiff(sim, side, d);
  const pairs: [string, string][] = [];
  const freeOuts = [...outs];
  for (const inn of ins) {
    const sid = playerSlot(d, inn);
    const prev = sid ? t.layout?.map[sid] : undefined;
    const i = prev ? freeOuts.indexOf(prev) : -1;
    const out = i >= 0 ? freeOuts.splice(i, 1)[0] : freeOuts.shift();
    if (out) pairs.push([out, inn]);
  }
  for (const [o, i] of pairs) sim.substitute(side, o, i);
  reshape(sim, side, d.formation, d.slots, d.map);
  if (d.mentality !== t.mentality) sim.setMentality(side, d.mentality);
  if (Object.keys(d.tactics).length) {
    const base = tacticsOf(t);
    if (base) { t.tactics = { ...base, ...d.tactics }; t.dirty = true; }
  }
  if (d.talk) sim.teamTalk(side, d.talk);
  for (const [id, k] of Object.entries(d.talks)) {
    const m = onPitch(t).find((x) => x.id === id);
    if (m) playerTalk(sim, side, id, k, grade(sim, m));
  }
}

/** Ausgewechselte (raus) und Spieler, die im Entwurf auf dem Platz stehen. */
export function draftPlayers(sim: MatchSim, side: Side, d: Draft): { field: MPlayer[]; benchList: MPlayer[] } {
  const t = sim.team(side);
  const inDraft = new Set(Object.values(d.map));
  const order = d.slots.map((s) => d.map[s.id]).filter(Boolean);
  const field = order.map((id) => t.players.find((m) => m.id === id)!).filter(Boolean);
  const benchList = [...bench(t), ...onPitch(t)].filter((m) => !inDraft.has(m.id));
  return { field, benchList };
}

/**
 * Spieler auf dem Feld frei verschieben (Wunsch Pascal, wie Aufstellung › Aufstellung):
 * Slot bekommt die neue Lage (x/y in % des Felds) und die Position des nächsten Rasterpunkts.
 * Torwart bleibt im Tor, Feldspieler kommen nicht ins Tor. Liefert Fehlertext oder null.
 */
export function moveSlot(d: Draft, key: string, x: number, y: number): string | null {
  const sid = key.startsWith('slot:') ? key.slice(5) : playerSlot(d, key);
  if (!sid) return 'Bankspieler auf den Spieler ziehen, der für ihn rausgeht.';
  const s = d.slots.find((z) => z.id === sid);
  if (!s) return null;
  if (s.position === 'TW') return 'Der Torwart bleibt im Tor.';
  const c = clampField(x, y);
  const g = nearestGrid(c.x, c.y, GK_POINTS);
  d.slots = d.slots.map((z) => (z.id === sid ? { ...z, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, position: g.position } : z));
  return null;
}
const GK_POINTS = new Set(PITCH_GRID.filter((g) => g.position === 'TW').map((g) => g.id));
/** Position, die ein Spieler an dieser Stelle hätte (Anzeige beim Ziehen). */
export const positionAt = (x: number, y: number) => { const c = clampField(x, y); return nearestGrid(c.x, c.y, GK_POINTS).label; };

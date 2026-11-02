// =============================================================================
// Standardsituationen: Ecke, Freistoß (direkt oder als Flanke), Elfmeter.
// Der Schütze (Taktik: Ecken-/Freistoß-/Elfmeterschütze, sonst der Beste) und
// sein Attribut bestimmen die Hereingabe; danach entscheidet das Kopfballduell
// zwischen Zielspieler und Verteidiger bzw. Schütze gegen Torwart.
// =============================================================================
import type { MatchSim } from './sim';
import type { TeamState } from './state';
import { shot } from './actions';
import { advantage, aerial, airDefRole, airRole, fieldOf, keeperOf, pickC, pulse } from './attack';
import { aerialSkill, duelP, finishSkill, keeperValue } from './skills';
import type { MPlayer, ShotOutcome } from './types';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const sq = (v: number) => (v / 60) * (v / 60);

/** Grund-Logit des Kopfballduells bei Standards (Verteidiger stehen dicht, Angreifer laufen an). */
const B_SP = -0.2;

function bestBy(ms: MPlayer[], id: string | null, f: (m: MPlayer) => number): MPlayer | undefined {
  const chosen = id ? ms.find((m) => m.id === id) : undefined;
  if (chosen) return chosen;
  let best: MPlayer | undefined; let bv = -1;
  for (const m of ms) { const v = f(m); if (v > bv) { bv = v; best = m; } }
  return best;
}

/** Hereingabe aus dem Stand: Torwart fängt ab oder Kopfballduell → Kopfball. */
function setPieceDelivery(sim: MatchSim, T: TeamState, O: TeamState, taker: MPlayer, quality: number, sp: 'corner' | 'freekick'): void {
  const rng = sim.rng;
  const fT = fieldOf(T), fO = fieldOf(O);
  const gk = keeperOf(O);
  if (gk && rng() < 0.12 * clamp((keeperValue(gk, 'air') / 65) ** 2, 0.4, 2) * clamp(68 / Math.max(30, quality), 0.6, 1.6)) {
    sim.note('attack_fail', { side: T.side, player: taker.id, other: gk.id, fail: 'claim', build: sp === 'corner' ? 'ecke' : 'freistoss' });
    return;
  }
  const tgt = pickC(sim, T, 30, (m) => airRole(m, true) * sq(aerialSkill(m)), taker) ?? taker;
  const dd = pickC(sim, O, 31, (m) => airDefRole(m) * sq(aerialSkill(m)))!;
  if (!dd) return;
  const adv = advantage(sim, T, O);
  const p = duelP(aerialSkill(tgt) + (quality - 60) * 0.4, aerialSkill(dd), B_SP + adv * 0.4);
  const won = rng() < p;
  aerial(T, O, won ? tgt : dd, won ? dd : tgt, won);
  if (won) {
    shot(sim, T, O, { build: sp === 'corner' ? 'ecke' : 'flanke', type: 'header', shooter: tgt, assister: taker, q: 1 + 0.6 * (1 - p), sp, other: dd.id });
    return;
  }
  sim.note('attack_fail', { side: T.side, player: tgt.id, other: dd.id, fail: 'aerial', build: sp === 'corner' ? 'ecke' : 'freistoss' });
  // Zweiter Ball an der Strafraumgrenze
  if (rng() < 0.1) {
    const sh = pickC(sim, T, 32, (m) => (m.group === 'MID' ? 2 : 0.6) * sq(m.p.attributes.longShots));
    if (sh) shot(sim, T, O, { build: 'abpraller', type: 'long', shooter: sh, q: 0.9, sp });
  }
}

export function corner(sim: MatchSim, T: TeamState, O: TeamState, _by?: MPlayer): void {
  T.stats.corners++;
  const fT = fieldOf(T);
  const taker = bestBy(fT, T.cornerTakerId, (m) => m.p.attributes.corners ?? m.p.attributes.crossing);
  sim.emit('corner', { side: T.side, player: taker?.id });
  if (!taker) return;
  const rng = sim.rng;
  const a = taker.p.attributes;
  const q = ((a.corners ?? a.crossing) * 0.7 + a.crossing * 0.2 + a.technique * 0.1) * taker.cond;
  // Nicht jede Ecke kommt gefährlich herein (zu kurz, erster Pfosten geklärt, kurz ausgeführt).
  const r = rng();
  if (r < 0.06) {
    const sh = pickC(sim, T, 33, (m) => (m.group === 'MID' ? 2 : 0.5) * sq(m.p.attributes.longShots), taker);
    if (sh) return void shot(sim, T, O, { build: 'ecke', type: 'long', shooter: sh, assister: taker, q: 0.9, sp: 'corner' });
  }
  if (r < 0.06 + 0.5 * clamp(1.15 - q / 140, 0.5, 1.1)) {
    sim.note('attack_fail', { side: T.side, player: taker.id, fail: 'recycle', build: 'ecke' });
    return;
  }
  setPieceDelivery(sim, T, O, taker, q, 'corner');
}

/** Freistoß nach Foul in der gegnerischen Hälfte: direkt (zentral, nah) oder als Flanke. */
export function freeKick(sim: MatchSim, T: TeamState, O: TeamState, _victim?: MPlayer): void {
  const rng = sim.rng;
  const fT = fieldOf(T);
  const r = rng();
  if (r < 0.3) {
    const taker = bestBy(fT, T.freeKickTakerId, (m) => m.p.attributes.freeKicks ?? 50);
    if (taker) return void shot(sim, T, O, { build: 'freistoss', type: 'freekick', shooter: taker, q: 1, sp: 'freekick' });
  }
  if (r < 0.78) {
    const taker = bestBy(fT, T.freeKickTakerId ?? T.cornerTakerId, (m) => (m.p.attributes.freeKicks ?? 50) * 0.4 + m.p.attributes.crossing * 0.6);
    if (!taker) return;
    const a = taker.p.attributes;
    setPieceDelivery(sim, T, O, taker, ((a.freeKicks ?? 50) * 0.4 + a.crossing * 0.5 + a.technique * 0.1) * taker.cond, 'freekick');
  }
}

export function penalty(sim: MatchSim, T: TeamState, O: TeamState): void {
  const field = fieldOf(T);
  const taker = bestBy(field, T.penaltyTakerId, (m) => (m.p.attributes.penalties ?? 0) + m.p.attributes.composure * 0.2);
  if (!taker) return;
  const keeper = keeperOf(O);
  // Elfmeter: immer Druck (mindestens 0,6), dazu Spielsituation → Nervenstärke von Schütze und Torwart.
  const press = Math.max(0.6, sim.pressureNow());
  const pen = finishSkill(taker, 'penalty', press);
  // Bundesliga 1963–2021: 74,9 % verwandelt, 18,4 % gehalten, Rest vorbei/Pfosten.
  const p = clamp(0.765 * Math.pow(pen / 65, 0.6) * Math.pow(62 / keeperValue(keeper, 'penalty', press), 0.45), 0.5, 0.94);
  const r = sim.rng();
  const outcome: ShotOutcome = r < p ? 'goal' : r < p + (1 - p) * 0.72 ? 'saved' : sim.rng() < 0.3 ? 'post' : 'wide';
  T.stats.shots++; taker.shots++; T.stats.xg += 0.76; taker.xg += 0.76; T.stats.bigChances++;
  if (outcome === 'goal') {
    T.goals++; T.stats.shotsOnTarget++; taker.shotsOnTarget++; taker.goals++; taker.impact += 0.6;
    sim.incident(1);
  } else {
    taker.impact -= 0.5; taker.bigMissed++;
    if (outcome === 'saved') { T.stats.shotsOnTarget++; taker.shotsOnTarget++; O.stats.saves++; if (keeper) { keeper.saves++; keeper.impact += 0.9; } }
  }
  pulse(sim, T.side, 1.4);
  sim.emit('chance', { side: T.side, player: taker.id, keeper: keeper?.id, build: 'elfer', chance: { type: 'penalty', xg: 0.76, outcome, big: true } });
}

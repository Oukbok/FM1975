// =============================================================================
// Angriff in Einzelduellen: Die Taktik wählt den Angriffsweg (tacticPlan.ts),
// jeder Schritt wird zwischen zwei konkreten Spielern mit passenden Attributen
// entschieden (skills.ts):
//   Kombination  Pass (Passspiel/Übersicht) gegen Abfangen (Antizipation), dann
//                Zweikampf im Strafraum oder Distanzschuss
//   Flanke       Außen gegen Außenverteidiger, dann Kopfballduell (hoch) bzw.
//                Duell um die flache Hereingabe; Torwart kann abfangen
//   Steilpass    Pass in die Tiefe, Abseitslinie, Laufduell, Eins gegen eins
//   Dribbling    Dribbling gegen Tackling (Foul möglich)
//   Langer Ball  Weiter Schlag, Kopfballduell des Zielspielers, zweiter Ball
//   Konter       nach Ballgewinn: Laufduell gegen die zurückeilende Abwehr
// Die Mannschaftsstärke (Angriff gegen Abwehr, Heimvorteil, Ausrichtung) wirkt
// als Verschiebung `adv` in allen Duellen.
// =============================================================================
import type { MatchSim } from './sim';
import { fieldPlayers, onPitch, type TeamState } from './state';
import { shot, card } from './actions';
import { corner, freeKick, penalty } from './setpieces';
import {
  aerialSkill, boxSkill, countDuel, crossSkill, dribbleSkill, duelP, interceptSkill, keeperValue, longPassSkill,
  paceSkill, passSkill, recoverSkill, tackleSkill, timingSkill, weighted,
} from './skills';
import { ROUTES, type Route } from './tacticPlan';
import type { MPlayer, Side } from './types';
import { isCentreForward, isWidePosition } from '../positions';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** Wie stark die Mannschaftsstärke (Angriff/Abwehr, Heimvorteil, Ausrichtung) die Duelle verschiebt. */
const LAMBDA = 0.4;
/** Zusätzlicher Heimvorteil in den Duellen (Publikum, Platzkenntnis, Schiedsrichter). */
const HOME_EXTRA = 0.75;

// Grund-Logits je Situation (Kalibrierung über `node scripts/matchbench.mjs`).
const B = {
  kurz: 0.75, box: -0.65, cross: 0.55, air: -0.7, low: -0.45, steil: 0.1, race: -0.55, drib: -0.25, longball: 0.2, airLong: -0.5,
  counterPass: 0.9, counterRace: 0.35,
};

export const pulse = (sim: MatchSim, side: Side, v: number) => { sim.pulse += side === 'home' ? v : -v; };
export const keeperOf = (t: TeamState) => onPitch(t).find((m) => m.group === 'GK');
export const fieldOf = fieldPlayers;

/** Verhältnis Angriff/Abwehr inkl. Heimvorteil, Druckphase, Ausrichtung und Zurufen. */
export function threat(sim: MatchSim, T: TeamState, O: TeamState): number {
  const ha = Math.sqrt(sim.era.homeAdvantage);
  const home = T.side === 'home' ? ha : 1 / ha;
  const momBoost = 1 + 0.03 * (T.side === 'home' ? sim.mom : -sim.mom);
  const a = T.units.attack * T.mods.att * home * momBoost;
  const d = O.units.defense * O.mods.def * (0.85 + 0.15 * (O.units.keeper / 65));
  return Math.pow(a / Math.max(1, d), sim.derby ? 0.97 : 1);
}

/** Logit-Vorteil der angreifenden Mannschaft. */
export const advantage = (sim: MatchSim, T: TeamState, O: TeamState) =>
  LAMBDA * Math.log(threat(sim, T, O)) + (T.side === 'home' ? HOME_EXTRA : -HOME_EXTRA) * Math.log(sim.era.homeAdvantage);

// -----------------------------------------------------------------------------
// Rollen: wer ist an welcher Aktion beteiligt?
// -----------------------------------------------------------------------------

export function attRole(m: MPlayer): number {
  if (m.group === 'ATT') return isCentreForward(m.pos) ? 3.2 : isWidePosition(m.pos) ? 2.1 : 2.6;
  if (m.group === 'MID') return m.pos === 'OM' ? 1.8 : isWidePosition(m.pos) ? 1.2 : m.pos === 'DM' ? 0.45 : 0.8;
  if (m.group === 'DEF') return isWidePosition(m.pos) ? 0.3 : 0.18;
  return 0;
}
export function defRole(m: MPlayer): number {
  if (m.group === 'DEF') return isWidePosition(m.pos) ? 2.0 : 2.6;
  if (m.group === 'MID') return m.pos === 'DM' ? 1.8 : m.pos === 'OM' ? 0.5 : 1.0;
  if (m.group === 'ATT') return 0.2;
  return 0;
}
function passRole(m: MPlayer): number {
  if (m.group === 'MID') return m.pos === 'OM' ? 2.2 : m.pos === 'DM' ? 1.6 : 2;
  if (m.group === 'DEF') return m.pos === 'LIB' ? 1.4 : 0.9;
  if (m.group === 'ATT') return 0.8;
  return 0.1;
}
function wideRole(m: MPlayer): number {
  const w = isWidePosition(m.pos);
  if (m.group === 'ATT') return w ? 3 : 0.4;
  if (m.group === 'MID') return w ? 2.5 : m.pos === 'OM' ? 1 : 0.5;
  if (m.group === 'DEF') return w ? 1.8 : 0.05;
  return 0;
}
function wideDefRole(m: MPlayer): number {
  const w = isWidePosition(m.pos);
  if (m.group === 'DEF') return w ? 3 : 1;
  if (m.group === 'MID') return w ? 1.6 : m.pos === 'DM' ? 0.8 : 0.3;
  if (m.group === 'ATT') return w ? 0.6 : 0.05;
  return 0;
}
/** Zielspieler in der Luft (bei Standards rücken die Innenverteidiger mit auf). */
export function airRole(m: MPlayer, setPiece: boolean): number {
  if (m.group === 'ATT') return isCentreForward(m.pos) ? 4 : 1.6;
  if (m.group === 'MID') return m.pos === 'OM' ? 1 : 0.6;
  if (m.group === 'DEF') return setPiece ? (isWidePosition(m.pos) ? 0.5 : 2.2) : 0.25;
  return 0;
}
export function airDefRole(m: MPlayer): number {
  if (m.group === 'DEF') return isWidePosition(m.pos) ? 1.2 : 3;
  if (m.group === 'MID') return m.pos === 'DM' ? 1.4 : 0.5;
  if (m.group === 'ATT') return isCentreForward(m.pos) ? 0.6 : 0.2;
  return 0;
}

const sq = (v: number) => (v / 60) * (v / 60);
/**
 * Beteiligten nach Gewicht ziehen (`slot` = Nummer der Situation, nur zur Kennzeichnung;
 * `pitch` = alle Spieler auf dem Platz statt nur Feldspieler; `not` = darf nicht gezogen werden).
 * Die Gewichte nutzen die zwischengespeicherten Fähigkeiten (skills.ts) – deshalb ohne eigene Tabellen.
 */
export function pickC(sim: MatchSim, T: TeamState, _slot: number, w: (m: MPlayer) => number, not?: MPlayer, pitch = false): MPlayer | undefined {
  const ms = pitch ? onPitch(T) : fieldOf(T);
  return weighted(sim.rng, ms, not ? (m) => (m === not ? 0 : w(m)) : w);
}

// -----------------------------------------------------------------------------
// Ausgang eines gescheiterten Angriffs
// -----------------------------------------------------------------------------

type FailKind = 'intercept' | 'tackle' | 'aerial' | 'claim' | 'cross_blocked' | 'race' | 'recycle' | 'longball';

function fail(sim: MatchSim, T: TeamState, O: TeamState, kind: FailKind, loser?: MPlayer, winner?: MPlayer): void {
  sim.note('attack_fail', { side: T.side, player: loser?.id, other: winner?.id, fail: kind });
  // Ballgewinn → Konter. Abgefangene Pässe und gewonnene Zweikämpfe im Mittelfeld kontern am besten.
  const kindF = kind === 'intercept' || kind === 'tackle' ? 1.25 : kind === 'race' ? 1.1 : kind === 'recycle' ? 0.4 : 0.65;
  const eraF = sim.year < 1985 ? 0.85 : sim.year < 2000 ? 0.97 : 1.15;
  if (sim.rng() < 0.11 * kindF * eraF * O.plan.counter * T.mods.exposed) counter(sim, O, T, winner);
}

// -----------------------------------------------------------------------------
// Angriff
// -----------------------------------------------------------------------------

export function attack(sim: MatchSim, T: TeamState, O: TeamState): void {
  const rng = sim.rng;
  pulse(sim, T.side, 0.3);
  const adv = advantage(sim, T, O);
  const fT = fieldOf(T), fO = fieldOf(O);
  if (!fT.length || !fO.length) return;

  // Fehler des Gegners im Aufbau (Pressing, Tempo, Wetter, schwache Ballkontrolle) → Großchance
  const errP = 0.0075 * O.mods.errors * (1 + 0.6 * T.plan.pressBias) * (sim.weather === 'regen' || sim.weather === 'schnee' ? 1.2 : 1)
    * clamp(62 / Math.max(30, O.units.control), 0.7, 1.5);
  if (rng() < errP) {
    const culprit = weighted(rng, fO, (m) => (m.group === 'ATT' ? 0 : m.group === 'DEF' ? 2 : 1) * (120 - m.p.attributes.composure * 0.6 - (m.p.attributes.experience ?? 50) * 0.4));
    if (culprit) { culprit.errors++; culprit.impact -= 0.5; }
    const sh = pickC(sim, T, 1, attRole);
    if (sh) shot(sim, T, O, { build: 'fehler', type: 'big', shooter: sh, q: 1, culprit: culprit?.id });
    return;
  }

  const r = T.plan.route;
  let x = rng();
  let route: Route = 'kurz';
  for (const k of ROUTES) { x -= r[k]; if (x <= 0) { route = k; break; } }
  switch (route) {
    case 'kurz': return kurz(sim, T, O, fT, fO, adv);
    case 'flanke': return flanke(sim, T, O, fT, fO, adv);
    case 'steil': return steil(sim, T, O, fT, fO, adv);
    case 'dribbling': return dribbling(sim, T, O, fT, fO, adv);
    case 'weit': return weit(sim, T, O, fT, fO, adv);
  }
}

function offside(sim: MatchSim, T: TeamState, runner: MPlayer, passer: MPlayer, build: 'kurzpass' | 'weit'): void {
  T.stats.offsides++;
  sim.emit('offside', { side: T.side, player: runner.id, assist: passer.id, build });
}

/** Pass zählen (Spieler + Team). */
function passed(T: TeamState, m: MPlayer, ok: boolean): void {
  m.passes++; T.stats.passes++;
  if (ok) { m.passesOk++; T.stats.passesOk++; }
}

/** Foul in aussichtsreicher Lage: Karte, dann Elfmeter oder Freistoß. */
function attackFoul(sim: MatchSim, T: TeamState, O: TeamState, fouler: MPlayer, victim: MPlayer | undefined, sev: number, inBoxP: number, notbremse = false): void {
  O.stats.fouls++;
  sim.emit('foul', { side: O.side, player: fouler.id, other: victim?.id, zone: 'att' });
  card(sim, O, fouler, sev, notbremse);
  // Vor 1995 etwas mehr Elfmeter (Bundesliga: 0,3 je Spiel in den 70ern, heute 0,25–0,3)
  if (sim.rng() < inBoxP * (sim.year < 1995 ? 1.4 : 1.1)) penalty(sim, T, O);
  else freeKick(sim, T, O, victim);
}

/** Wahrscheinlichkeit, dass ein geschlagener Verteidiger foult (Aggressivität, Härte-Taktik, schlechtes Tackling). */
function foulP(m: MPlayer, O: TeamState, base: number): number {
  const a = m.p.attributes;
  return base * (0.55 + a.aggression / 110) * (1.25 - a.tackling / 220) * O.plan.foul * O.mods.foul;
}

// --- Kombination durch die Mitte ------------------------------------------------
function kurz(sim: MatchSim, T: TeamState, O: TeamState, fT: MPlayer[], fO: MPlayer[], adv: number): void {
  const rng = sim.rng;
  const passer = pickC(sim, T, 2, (m) => passRole(m) * sq(passSkill(m)))!;
  const recv = pickC(sim, T, 3, attRole, passer) ?? passer;
  const icp = pickC(sim, O, 4, (m) => defRole(m) * (interceptSkill(m) / 60))!;
  const ok = rng() < duelP(passSkill(passer), interceptSkill(icp), B.kurz + adv + T.plan.passBias - O.plan.pressBias);
  passed(T, passer, ok);
  if (!ok) { icp.tackles++; icp.impact += 0.04; return fail(sim, T, O, 'intercept', passer, icp); }
  if (rng() < (0.02 + 0.03 * O.plan.trap) * 2 * duelP(64, timingSkill(recv))) return offside(sim, T, recv, passer, 'kurzpass');
  // Am Strafraum: Distanzschuss (Neigung aus Taktik × Fernschuss-Wert) oder Weg in den Strafraum
  const ls = recv.p.attributes.longShots;
  if (rng() < T.plan.longShot * clamp((ls / 60) ** 1.2, 0.5, 1.6) * (1 - 0.15 * O.plan.lineHigh)) {
    return void shot(sim, T, O, { build: 'kurzpass', type: 'long', shooter: recv, assister: rng() < 0.4 ? passer : undefined, q: 1 });
  }
  const def = pickC(sim, O, 5, (m) => defRole(m) * (tackleSkill(m) / 60), icp) ?? icp;
  const att = (dribbleSkill(recv) + boxSkill(recv)) / 2;
  const dv = tackleSkill(def) * O.mods.duel;
  const p = duelP(att, dv, B.box + adv + T.plan.workBias - O.plan.tackleBias);
  const won = rng() < p;
  countDuel(won ? recv : def, won ? def : recv, won ? T.stats : O.stats, won ? O.stats : T.stats);
  if (won) {
    if (rng() < foulP(def, O, 0.14)) return attackFoul(sim, T, O, def, recv, 1.3, 0.16);
    const margin = clamp(1 - p, 0.1, 0.9); // knapp gewonnen = enge Lage, klar gewonnen = frei
    const big = rng() < 0.05 + 0.25 * (1 - margin) * (1 - margin);
    return void shot(sim, T, O, { build: 'kurzpass', type: big ? 'big' : 'normal', shooter: recv, assister: passer, q: 0.8 + 0.5 * (1 - margin), other: def.id });
  }
  def.tackles++;
  return fail(sim, T, O, 'tackle', recv, def);
}

// --- Flanke ----------------------------------------------------------------------
function flanke(sim: MatchSim, T: TeamState, O: TeamState, fT: MPlayer[], fO: MPlayer[], adv: number): void {
  const rng = sim.rng;
  const crosser = pickC(sim, T, 6, (m) => wideRole(m) * sq(crossSkill(m)))!;
  const wd = pickC(sim, O, 7, wideDefRole)!;
  // Außen gegen Außen: Platz für die Flanke?
  const free = duelP(crossSkill(crosser) * 0.55 + dribbleSkill(crosser) * 0.25 + paceSkill(crosser) * 0.2, tackleSkill(wd) * O.mods.duel,
    B.cross + adv * 0.6 + T.plan.workBias - 0.5 * O.plan.tackleBias);
  crosser.crosses = (crosser.crosses ?? 0) + 1; T.stats.crosses = (T.stats.crosses ?? 0) + 1;
  const freeOk = rng() < free;
  countDuel(freeOk ? crosser : wd, freeOk ? wd : crosser, freeOk ? T.stats : O.stats, freeOk ? O.stats : T.stats);
  if (!freeOk) {
    if (rng() < 0.45) return corner(sim, T, O, crosser);
    return fail(sim, T, O, 'cross_blocked', crosser, wd);
  }
  const cq = crossSkill(crosser);
  const high = rng() < T.plan.highCross;
  const gk = keeperOf(O);
  if (high) {
    // Torwart fängt die Flanke ab (Strafraumbeherrschung gegen Flankenqualität)
    if (gk && rng() < 0.11 * clamp((keeperValue(gk, 'air') / 65) ** 2, 0.4, 2) * clamp(68 / Math.max(30, cq), 0.6, 1.6)) {
      return fail(sim, T, O, 'claim', crosser, gk);
    }
    const tgt = pickC(sim, T, 8, (m) => airRole(m, false) * sq(aerialSkill(m)), crosser) ?? crosser;
    const dd = pickC(sim, O, 9, (m) => airDefRole(m) * sq(aerialSkill(m)))!;
    const p = duelP(aerialSkill(tgt) + (cq - 60) * 0.6, aerialSkill(dd), B.air + adv * 0.5 - 0.15 * O.plan.lineHigh);
    const won = rng() < p;
    aerial(T, O, won ? tgt : dd, won ? dd : tgt, won);
    if (won) {
      crosser.crossesOk = (crosser.crossesOk ?? 0) + 1; T.stats.crossesOk = (T.stats.crossesOk ?? 0) + 1;
      // Nicht jeder gewonnene Kopfball ist ein Torschuss (Ablage, Verlängerung ins Aus)
      if (rng() < 0.3) return fail(sim, T, O, 'recycle', tgt, undefined);
      return void shot(sim, T, O, { build: 'flanke', type: 'header', shooter: tgt, assister: crosser, q: 0.75 + 0.6 * (1 - p), other: dd.id });
    }
    if (rng() < 0.15) return corner(sim, T, O, crosser);
    return fail(sim, T, O, 'aerial', tgt, dd);
  }
  // Flache Hereingabe / Rückraum
  const tgt = pickC(sim, T, 10, (m) => attRole(m) * sq(boxSkill(m)), crosser) ?? crosser;
  const dd = pickC(sim, O, 11, (m) => defRole(m) * (interceptSkill(m) / 60))!;
  const p = duelP(boxSkill(tgt) + (cq - 60) * 0.55, interceptSkill(dd), B.low + adv * 0.5);
  if (rng() < p) {
    crosser.crossesOk = (crosser.crossesOk ?? 0) + 1; T.stats.crossesOk = (T.stats.crossesOk ?? 0) + 1;
    if (rng() < 0.25) return fail(sim, T, O, 'recycle', tgt, undefined);
    const big = rng() < 0.06 + 0.2 * (1 - p);
    return void shot(sim, T, O, { build: 'flanke', type: big ? 'big' : 'normal', shooter: tgt, assister: crosser, q: 0.85 + 0.4 * (1 - p), low: true, other: dd.id });
  }
  dd.tackles++;
  if (rng() < 0.12) return corner(sim, T, O, crosser);
  return fail(sim, T, O, 'intercept', tgt, dd);
}

/** Luftduell zählen. */
export function aerial(T: TeamState, O: TeamState, win: MPlayer, lose: MPlayer, attWon: boolean): void {
  const W = attWon ? T : O, L = attWon ? O : T;
  countDuel(win, lose, W.stats, L.stats);
  win.aerials = (win.aerials ?? 0) + 1; win.aerialsWon = (win.aerialsWon ?? 0) + 1; lose.aerials = (lose.aerials ?? 0) + 1;
  W.stats.aerials = (W.stats.aerials ?? 0) + 1; W.stats.aerialsWon = (W.stats.aerialsWon ?? 0) + 1;
  L.stats.aerials = (L.stats.aerials ?? 0) + 1;
}

// --- Steilpass -------------------------------------------------------------------
function steil(sim: MatchSim, T: TeamState, O: TeamState, fT: MPlayer[], fO: MPlayer[], adv: number): void {
  const rng = sim.rng;
  const passer = pickC(sim, T, 12, (m) => passRole(m) * sq(passSkill(m) * 0.7 + m.p.attributes.vision * 0.3))!;
  const runner = pickC(sim, T, 13, (m) => attRole(m) * sq(paceSkill(m)), passer) ?? passer;
  const icp = pickC(sim, O, 14, (m) => defRole(m) * (interceptSkill(m) / 60))!;
  const vis = (passer.p.attributes.vision - 60) * 0.25;
  const ok = rng() < duelP(passSkill(passer) + vis, interceptSkill(icp), B.steil + adv + 0.5 * T.plan.passBias - 0.5 * O.plan.pressBias);
  passed(T, passer, ok);
  if (!ok) { icp.tackles++; return fail(sim, T, O, 'intercept', passer, icp); }
  // Abseitslinie: Timing des Läufers gegen Linie/Falle
  const offP = (0.4 + 0.18 * O.plan.trap + 0.06 * O.plan.lineHigh) * (sim.year < 1990 ? 1.15 : 1) * 2 * duelP(64, timingSkill(runner));
  if (rng() < offP) {
    T.stats.offsides++;
    sim.emit('offside', { side: T.side, player: runner.id, assist: passer.id, build: 'steilpass' });
    return;
  }
  const chaser = pickC(sim, O, 15, (m) => (m.group === 'DEF' ? 3 : m.pos === 'DM' ? 1 : 0.2) * sq(recoverSkill(m)))!;
  const p = duelP(paceSkill(runner), recoverSkill(chaser), B.race + adv * 0.5 + T.plan.workBias + 0.7 * O.plan.lineHigh + 0.3 * O.plan.trap);
  const won = rng() < p;
  countDuel(won ? runner : chaser, won ? chaser : runner, won ? T.stats : O.stats, won ? O.stats : T.stats);
  if (won) {
    if (rng() < foulP(chaser, O, 0.08)) return attackFoul(sim, T, O, chaser, runner, 2.6, 0.21, rng() < 0.05);
    return void shot(sim, T, O, { build: 'steilpass', type: rng() < 0.55 ? 'big' : 'normal', shooter: runner, assister: passer, q: 0.85 + 0.4 * (1 - p), other: chaser.id });
  }
  chaser.tackles++;
  if (rng() < foulP(chaser, O, 0.06)) return attackFoul(sim, T, O, chaser, runner, 1.4, 0.07);
  return fail(sim, T, O, 'race', runner, chaser);
}

// --- Dribbling -------------------------------------------------------------------
function dribbling(sim: MatchSim, T: TeamState, O: TeamState, fT: MPlayer[], fO: MPlayer[], adv: number): void {
  const rng = sim.rng;
  const dr = pickC(sim, T, 16, (m) => attRole(m) * sq(dribbleSkill(m)) * (0.6 + m.p.attributes.flair / 150))!;
  const wide = isWidePosition(dr.pos);
  const def = pickC(sim, O, wide ? 40 : 17, (m) => (wide ? wideDefRole(m) : defRole(m)) * (tackleSkill(m) / 60))!;
  dr.dribbles = (dr.dribbles ?? 0) + 1; T.stats.dribbles = (T.stats.dribbles ?? 0) + 1;
  const p = duelP(dribbleSkill(dr), tackleSkill(def) * O.mods.duel, B.drib + adv + T.plan.workBias - O.plan.tackleBias);
  const won = rng() < p;
  countDuel(won ? dr : def, won ? def : dr, won ? T.stats : O.stats, won ? O.stats : T.stats);
  if (!won) { def.tackles++; def.impact += 0.04; return fail(sim, T, O, 'tackle', dr, def); }
  dr.dribblesOk = (dr.dribblesOk ?? 0) + 1; T.stats.dribblesOk = (T.stats.dribblesOk ?? 0) + 1;
  if (rng() < foulP(def, O, 0.2)) return attackFoul(sim, T, O, def, dr, 1.5, wide ? 0.09 : 0.15);
  const r = rng();
  if (r > 0.8) return fail(sim, T, O, 'recycle', dr, undefined);
  if (r < 0.1 + 0.15 * (1 - p)) return void shot(sim, T, O, { build: 'dribbling', type: 'solo', shooter: dr, q: 0.8 + 0.4 * (1 - p), other: def.id });
  if (r < 0.45 && rng() < clamp((dr.p.attributes.longShots / 60) ** 1.2, 0.4, 1.5) * 0.7) {
    return void shot(sim, T, O, { build: 'dribbling', type: 'long', shooter: dr, q: 1, other: def.id });
  }
  if (wide && r < 0.75) {
    // Außen durchgebrochen → Flanke ohne weiteren Zweikampf
    const tgt = pickC(sim, T, 18, (m) => airRole(m, false) * sq(aerialSkill(m)), dr) ?? dr;
    const dd = pickC(sim, O, 19, (m) => airDefRole(m) * sq(aerialSkill(m)), def)!;
    dr.crosses = (dr.crosses ?? 0) + 1; T.stats.crosses = (T.stats.crosses ?? 0) + 1;
    const pa = duelP(aerialSkill(tgt) + (crossSkill(dr) - 60) * 0.35, aerialSkill(dd), B.air + 0.3 + adv * 0.5);
    const w = rng() < pa;
    aerial(T, O, w ? tgt : dd, w ? dd : tgt, w);
    if (!w) return fail(sim, T, O, 'aerial', tgt, dd);
    dr.crossesOk = (dr.crossesOk ?? 0) + 1; T.stats.crossesOk = (T.stats.crossesOk ?? 0) + 1;
    return void shot(sim, T, O, { build: 'flanke', type: 'header', shooter: tgt, assister: dr, q: 0.8 + 0.5 * (1 - pa), other: dd.id });
  }
  return void shot(sim, T, O, { build: 'dribbling', type: 'normal', shooter: dr, q: 0.9 + 0.4 * (1 - p), other: def.id });
}

// --- Langer Ball -------------------------------------------------------------------
function weit(sim: MatchSim, T: TeamState, O: TeamState, fT: MPlayer[], fO: MPlayer[], adv: number): void {
  const rng = sim.rng;
  const passer = pickC(sim, T, 20, (m) => (m.group === 'DEF' ? 2 : m.pos === 'DM' ? 1.5 : m.group === 'MID' ? 0.8 : 0.2) * sq(longPassSkill(m)))!;
  const tgt = pickC(sim, T, 21, (m) => airRole(m, false) * sq(aerialSkill(m)), passer) ?? passer;
  const ok = rng() < duelP(longPassSkill(passer), 62, B.longball);
  passed(T, passer, ok);
  if (!ok) return fail(sim, T, O, 'longball', passer, undefined);
  if (rng() < (0.06 + 0.06 * O.plan.trap) * 2 * duelP(64, timingSkill(tgt))) return offside(sim, T, tgt, passer, 'weit');
  const dd = pickC(sim, O, 22, (m) => airDefRole(m) * sq(aerialSkill(m)))!;
  const p = duelP(aerialSkill(tgt), aerialSkill(dd), B.airLong + adv * 0.5);
  const won = rng() < p;
  aerial(T, O, won ? tgt : dd, won ? dd : tgt, won);
  if (!won) return fail(sim, T, O, 'aerial', tgt, dd);
  // Ablage auf den zweiten Mann
  const second = pickC(sim, T, 23, attRole, tgt) ?? tgt;
  const r = rng();
  if (r < 0.32) return void shot(sim, T, O, { build: 'weit', type: 'normal', shooter: second, assister: tgt, q: 0.85 + 0.3 * (1 - p), other: dd.id });
  if (r < 0.5) return void shot(sim, T, O, { build: 'weit', type: 'long', shooter: second, assister: tgt, q: 1 });
  if (r < 0.62) return void shot(sim, T, O, { build: 'weit', type: 'header', shooter: tgt, assister: passer, q: 0.75, other: dd.id });
  return fail(sim, T, O, 'recycle', second, undefined);
}

// --- Konter --------------------------------------------------------------------------
/** Gegenstoß von A gegen D nach Ballgewinn durch `winner`. */
export function counter(sim: MatchSim, A: TeamState, D: TeamState, winner?: MPlayer): void {
  const rng = sim.rng;
  const fA = fieldOf(A), fD = fieldOf(D);
  if (!fA.length || !fD.length) return;
  A.stats.counters = (A.stats.counters ?? 0) + 1;
  const adv = advantage(sim, A, D);
  const launcher = winner && winner.onPitch && winner.side === A.side ? winner : pickC(sim, A, 24, (m) => passRole(m) * sq(passSkill(m)))!;
  const runner = pickC(sim, A, 25, (m) => attRole(m) * sq(paceSkill(m)) * 1.4, launcher) ?? launcher;
  const icp = pickC(sim, D, 26, (m) => (m.group === 'MID' ? 2 : m.group === 'DEF' ? 1 : 0.3) * (interceptSkill(m) / 60))!;
  const ok = rng() < duelP(passSkill(launcher), interceptSkill(icp), B.counterPass + 0.5 * A.plan.passBias);
  passed(A, launcher, ok);
  if (!ok) { icp.tackles++; sim.note('attack_fail', { side: A.side, player: launcher.id, other: icp.id, fail: 'intercept', build: 'konter' }); return; }
  if (rng() < (0.13 + 0.14 * D.plan.trap) * 2 * duelP(64, timingSkill(runner))) {
    A.stats.offsides++;
    sim.emit('offside', { side: A.side, player: runner.id, assist: launcher.id, build: 'konter' });
    return;
  }
  const chaser = pickC(sim, D, 27, (m) => (m.group === 'DEF' ? 3 : m.pos === 'DM' ? 1.2 : 0.2) * sq(recoverSkill(m)))!;
  const p = duelP(paceSkill(runner), recoverSkill(chaser), B.counterRace + adv * 0.5 + A.plan.workBias + 0.7 * D.plan.lineHigh);
  const won = rng() < p;
  countDuel(won ? runner : chaser, won ? chaser : runner, won ? A.stats : D.stats, won ? D.stats : A.stats);
  pulse(sim, A.side, 0.4);
  if (won) {
    if (rng() < foulP(chaser, D, 0.12)) return attackFoul(sim, A, D, chaser, runner, 2.6, 0.12, rng() < 0.06);
    return void shot(sim, A, D, { build: 'konter', type: rng() < 0.62 ? 'counter' : 'normal', shooter: runner, assister: launcher, q: 0.85 + 0.4 * (1 - p), other: chaser.id });
  }
  chaser.tackles++;
  if (rng() < foulP(chaser, D, 0.1)) {
    D.stats.fouls++;
    sim.emit('foul', { side: D.side, player: chaser.id, other: runner.id, zone: 'mid', build: 'konter' });
    card(sim, D, chaser, 2.4, false);
    return;
  }
  sim.note('attack_fail', { side: A.side, player: runner.id, other: chaser.id, fail: 'race', build: 'konter' });
}

// =============================================================================
// Abschluss, Fouls, Karten, Verletzungen, Elfmeterschießen.
// Angriffswege stehen in attack.ts, Standards in setpieces.ts.
// Der Abschluss: Torwahrscheinlichkeit = Chancenqualität (Art × Ausgang des
// vorherigen Duells) × Abschlusswert des Schützen gegen den Torwart in genau
// dieser Situation (Reflexe, Stellungsspiel, Eins gegen eins, Strafraum).
// =============================================================================
import { injuryRiskFactor } from '../injuryRisk';
import type { InjurySeverity } from '../../types';
import type { MatchSim } from './sim';
import { lineupChanged, onPitch, type TeamState } from './state';
import { matchBase, rating } from './team';
import { attRole, keeperOf, pickC, pulse } from './attack';
import { corner, freeKick } from './setpieces';
import { blockSkill, boxSkill, duelP, finishSkill, keeperValue, weighted, type KeeperSituation, type ShotKind } from './skills';
import type { BuildKind, ChanceKind, MPlayer, ShotOutcome } from './types';

/** Gesamtskala der Torgefahr (Kalibrierung über `node scripts/matchbench.mjs`). */
const GOAL_SCALE = 0.82;
/** Wie stark Schütze und Torwart durchschlagen (Exponenten auf das Verhältnis zu 62). */
const FIN_EXP = 1.3, GK_EXP = 1.15;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Grund-xG je Chancenart (vor Duell-Qualität). */
const XG: Record<ChanceKind, [number, number]> = {
  big: [0.26, 0.3], counter: [0.24, 0.26], solo: [0.22, 0.26], normal: [0.06, 0.1], header: [0.05, 0.09],
  long: [0.045, 0.045], freekick: [0.04, 0.05], penalty: [0.76, 0],
};
const SIT: Record<ChanceKind, KeeperSituation> = {
  big: 'oneOnOne', counter: 'oneOnOne', solo: 'oneOnOne', normal: 'shot', header: 'air', long: 'long', freekick: 'long', penalty: 'penalty',
};
const KIND: Record<ChanceKind, ShotKind> = {
  big: 'foot', counter: 'foot', solo: 'foot', normal: 'foot', header: 'header', long: 'long', freekick: 'freekick', penalty: 'penalty',
};
/** Anteil geblockter Schüsse und Anteil aufs Tor bei Fehlschüssen (Grundwerte). */
const BLOCK: Record<ChanceKind, number> = { big: 0.08, counter: 0.06, solo: 0.1, normal: 0.26, header: 0.06, long: 0.34, freekick: 0.3, penalty: 0 };
const ON_T: Record<ChanceKind, number> = { big: 0.52, counter: 0.5, solo: 0.5, normal: 0.42, header: 0.38, long: 0.38, freekick: 0.42, penalty: 0.7 };

export interface ShotSpec {
  build: BuildKind;
  type: ChanceKind;
  shooter: MPlayer;
  assister?: MPlayer;
  /** Chancenqualität aus dem vorherigen Duell (1 = normal). */
  q?: number;
  culprit?: string;
  /** Beteiligter Gegenspieler (Duell verloren) für den Kommentar. */
  other?: string;
  rebound?: boolean;
  sp?: 'corner' | 'freekick';
  low?: boolean;
}

export function shot(sim: MatchSim, T: TeamState, O: TeamState, s: ShotSpec): void {
  const rng = sim.rng;
  const { type, build, shooter, assister, rebound } = s;
  const [b0, b1] = XG[type];
  let xg = (b0 + rng() * b1) * clamp(s.q ?? 1, 0.5, 1.8);
  if (build === 'fehler') xg = 0.3 + rng() * 0.3;
  if (rebound) xg = 0.12 + rng() * 0.18;

  const press = sim.pressureNow();
  const fin = finishSkill(shooter, KIND[type], press);
  const keeper = keeperOf(O);
  const gk = keeperValue(keeper, SIT[type], press);
  const wetBoost = (sim.weather === 'regen' || sim.weather === 'schnee') && (type === 'long' || type === 'freekick') ? 1.12 : 1;
  const pGoal = clamp(xg * Math.pow(fin / 62, FIN_EXP) * Math.pow(62 / Math.max(20, gk), GK_EXP) * sim.era.goalFactor * GOAL_SCALE * wetBoost, 0.006, 0.92);
  const big = xg >= 0.3;

  // Angezeigter xG-Wert = Torwahrscheinlichkeit für einen durchschnittlichen Schützen
  xg *= GOAL_SCALE * sim.era.goalFactor;
  T.stats.shots++; shooter.shots++;
  T.stats.xg += xg; shooter.xg += xg;
  if (big) T.stats.bigChances++;
  if (assister) { assister.keyPasses++; assister.impact += 0.12; }
  pulse(sim, T.side, 0.6 + xg * 2);

  let outcome: ShotOutcome;
  let blocker: MPlayer | undefined;
  if (rng() < pGoal) outcome = 'goal';
  else {
    // Block: bester Verteidiger in der Schusslinie gegen Technik/Schussauswahl des Schützen
    const bp = BLOCK[type];
    if (bp > 0) {
      blocker = pickC(sim, O, 28, (m) => (m.group === 'DEF' ? 3 : m.group === 'MID' ? 1 : 0.1) * (m.group === 'GK' ? 0 : 1), undefined, true);
      const bv = blocker ? blockSkill(blocker) : 55;
      const sv = shooter.p.attributes.technique * 0.5 + shooter.p.attributes.decisions * 0.5;
      if (rng() < bp * 2 * duelP(bv, sv)) outcome = 'blocked';
    }
    // Aufs Tor: Genauigkeit des Schützen
    outcome ??= rng() < ON_T[type] * (0.75 + 0.5 * duelP(fin, 62)) ? 'saved'
      : rng() < 0.08 ? 'post'
      : type === 'header' || type === 'long' ? (rng() < 0.55 ? 'over' : 'wide') : (rng() < 0.45 ? 'over' : 'wide');
  }
  if (outcome === 'blocked' && blocker) { blocker.impact += 0.08; blocker.tackles++; }

  let ownGoal = false;
  let scorer = shooter;
  if (outcome === 'goal' && (type === 'header' || type === 'normal') && rng() < 0.065) {
    const def = weighted(rng, onPitch(O), (m) => (m.group === 'DEF' ? 1 : 0));
    if (def) { ownGoal = true; scorer = def; }
  }
  let disallowed = false;
  if (outcome === 'goal' && sim.era.var && rng() < 0.05) disallowed = true;
  else if (outcome === 'goal' && !sim.era.var && rng() < 0.025) disallowed = true; // Abseits/Foul vom Schiedsrichter gesehen

  if (outcome === 'goal' && !disallowed) {
    T.goals++;
    T.stats.shotsOnTarget++; shooter.shotsOnTarget++;
    if (ownGoal) { scorer.ownGoals++; scorer.impact -= 0.6; }
    else {
      shooter.goals++;
      shooter.impact += type === 'long' || type === 'freekick' ? 1.1 : big ? 0.8 : 0.95;
      if (assister) { assister.assists++; assister.impact += 0.45; }
    }
    if (keeper) keeper.impact -= big ? 0.15 : type === 'long' ? 0.45 : 0.3;
    for (const d of onPitch(O)) if (d.group === 'DEF') d.impact -= 0.1;
    sim.incident(1);
    pulse(sim, T.side, 1.5);
  } else if (outcome === 'saved') {
    T.stats.shotsOnTarget++; shooter.shotsOnTarget++; O.stats.saves++;
    shooter.impact += 0.05;
    if (keeper) { keeper.saves++; keeper.impact += 0.12 + xg * 0.9; }
  }
  if (outcome !== 'goal' && big) { shooter.bigMissed++; shooter.impact -= 0.25; }
  if (outcome === 'goal' && disallowed) shooter.impact += 0.1;

  sim.emit('chance', {
    side: T.side, player: scorer.id, assist: ownGoal ? undefined : assister?.id, keeper: keeper?.id, build,
    other: s.culprit ?? (outcome === 'blocked' ? blocker?.id : s.other),
    chance: {
      type, xg: Math.round(xg * 100) / 100, outcome, big, ownGoal: ownGoal || undefined, disallowed: disallowed || undefined,
      rebound: rebound || undefined, sp: s.sp, low: s.low || undefined,
    },
  });
  if (disallowed) sim.emit('var', { side: T.side, player: scorer.id, detail: rng() < 0.6 ? 'abseits' : 'foul' });

  // Nachspiel: Abpraller (wer ist zuerst da?), Ecke
  if (outcome === 'saved' || outcome === 'blocked') {
    if (!rebound && rng() < 0.11) {
      const r = pickC(sim, T, 29, (m) => attRole(m) * (boxSkill(m) / 60) ** 2, undefined, true);
      if (r) { shot(sim, T, O, { build: 'abpraller', type: 'normal', shooter: r, rebound: true, sp: s.sp }); return; }
    }
    if (rng() < (outcome === 'blocked' ? 0.4 : 0.3)) corner(sim, T, O);
  }
}

// -----------------------------------------------------------------------------
// Fouls, Karten, Verletzungen
// -----------------------------------------------------------------------------

export function openPlayFoul(sim: MatchSim, T: TeamState, O: TeamState): void {
  const eraF = sim.year < 1985 ? 1.15 : sim.year < 2000 ? 1.08 : 1.03;
  const derby = sim.derby ? 1.15 : 1;
  if (sim.rng() >= 0.096 * T.mods.foul * T.plan.foul * eraF * derby) return;
  const fouler = weighted(sim.rng, onPitch(T), (m) => (m.group === 'GK' ? 0 : m.group === 'DEF' ? 1.5 : m.group === 'MID' ? 1.4 : 0.8) * (0.4 + m.p.attributes.aggression / 100));
  const victim = weighted(sim.rng, onPitch(O), (m) => (m.group === 'GK' ? 0 : 0.5 + m.p.attributes.dribbling / 100));
  if (!fouler) return;
  T.stats.fouls++;
  const zone = sim.rng() < 0.6 ? 'mid' : 'def';
  sim.emit('foul', { side: T.side, player: fouler.id, other: victim?.id, zone });
  card(sim, T, fouler, 1, false);
  // Foul in der eigenen Hälfte nahe dem Strafraum → Freistoß in aussichtsreicher Lage für den Gegner
  if (zone === 'def' && sim.rng() < 0.5) freeKick(sim, O, T, victim);
}

/** Karte nach einem Foul. `sev` > 1 = taktisches/hartes Foul. */
export function card(sim: MatchSim, T: TeamState, m: MPlayer, sev: number, notbremse: boolean): void {
  const rng = sim.rng;
  const a = m.p.attributes;
  const late = sim.minute > 70 ? 1.2 : 1;
  // Disziplin: Aggressivität gegen Ruhe/Konzentration; Erfahrung hilft in hitzigen Phasen (Derby, Schlussphase, Rückstand).
  const heated = sim.derby || sim.minute > 70 || sim.effDiff(T.side) < 0;
  const temper = (0.65 + a.aggression / 100 * 0.6 - a.composure / 100 * 0.12 - a.concentration / 100 * 0.08)
    * (heated ? 1.12 - (a.experience ?? 50) / 100 * 0.24 : 1);
  const derby = sim.derby ? 1.2 : 1;
  const ref = T.side === 'away' ? 1 + (sim.era.homeAdvantage - 1) * 0.6 : 1;
  if (notbremse || rng() < sim.era.redPerFoul * sev * temper * derby * T.mods.cards) {
    m.red++; m.impact -= 1.2;
    sendOff(sim, T, m, 'red');
    return;
  }
  const pY = sim.era.yellowPerFoul * sev * temper * late * derby * ref * T.mods.cards * (m.yellow ? 0.65 : 1);
  if (rng() >= pY) return;
  if (m.yellow && !sim.era.yellowRed) {
    // Vor 1991/92 gibt es keine Gelb-Rote Karte: die zweite Verwarnung bleibt ohne Platzverweis.
    m.yellow++; m.impact -= 0.15; T.stats.yellow++;
    sim.emit('card', { side: T.side, player: m.id, card: 'yellow' });
    return;
  }
  if (m.yellow) {
    m.yellowRed++; m.impact -= 1.0;
    sendOff(sim, T, m, 'yellowRed');
  } else {
    m.yellow++; m.impact -= 0.15; T.stats.yellow++;
    sim.emit('card', { side: T.side, player: m.id, card: 'yellow' });
  }
}

function sendOff(sim: MatchSim, T: TeamState, m: MPlayer, kind: 'red' | 'yellowRed'): void {
  m.onPitch = false; m.sentOff = true; m.minuteOut = sim.minute;
  T.stats.red++;
  if (kind === 'yellowRed') T.stats.yellow++;
  lineupChanged(T);
  sim.incident(1.5);
  sim.emit('card', { side: T.side, player: m.id, card: kind });
  // Torwart vom Platz: Feldspieler oder Ersatztorwart muss rein
  if (m.group === 'GK') {
    const sub = T.players.find((x) => !x.onPitch && !x.started && x.minuteOut === null && x.p.naturalPosition === 'TW');
    const out = onPitch(T).filter((x) => x.group === 'ATT').sort((x, y) => rating(x) - rating(y))[0] ?? onPitch(T)[0];
    if (sub && out && sim.subsLeft(T) > 0) {
      sim.substitute(T.side, out.id, sub.id, 'torwart');
      sub.pos = 'TW'; sub.group = 'GK'; sub.base = matchBase(sub.p, 'TW');
    }
  }
}

export function maybeInjury(sim: MatchSim, T: TeamState, O: TeamState): void {
  const hard = 1 + (O.mods.foul - 1) * 0.6;
  // Vorprüfung (Team): ≈ 0,3 Verletzungen je Mannschaft und Spiel (Profi-Studien: 0,3–0,4).
  if (sim.rng() >= 0.03 * hard) return;
  const cand = onPitch(T)[Math.floor(sim.rng() * onPitch(T).length)];
  if (!cand) return;
  const prone = (cand.p.development?.injuryProneness ?? 40) / 100;
  if (sim.rng() >= 0.12 * (0.5 + prone) * (cand.energy < 50 ? 1.4 : 1) * injuryRiskFactor(cand.p) * T.mods.injury) return;
  const r = sim.rng();
  const severity: InjurySeverity = r < 0.58 ? 'minor' : r < 0.9 ? 'moderate' : 'severe';
  if (cand.injured && T.coach && !T.coach.autoSubs) return;
  sim.injuries.set(cand.id, severity);
  cand.injured = true;
  sim.incident(1.5);
  // Leicht angeschlagen: spielt manchmal weiter (Wurf vor der Meldung, damit die Reihenfolge der Zufallszahlen gleich bleibt)
  const playsOn = severity === 'minor' && sim.rng() < 0.45;
  // Menschlicher Trainer ohne Co-Trainer-Wechsel: der Verletzte humpelt weiter, bis du reagierst (Textmodus hält an).
  const waits = !playsOn && T.human && !!T.coach && !T.coach.autoSubs && sim.subsLeft(T) > 0;
  sim.emit('injury', { side: T.side, player: cand.id, severity, detail: waits ? 'wartet' : undefined });
  if (playsOn) { cand.energy = Math.max(20, cand.energy - 15); T.dirty = true; return; }
  if (waits) { cand.energy = Math.min(cand.energy, 35); cand.cond *= 0.9; T.dirty = true; return; }
  const rep = sim.subsLeft(T) > 0 ? sim.bestReplacement(T, cand) : undefined;
  if (rep) sim.substitute(T.side, cand.id, rep.id, 'verletzt');
  else { cand.onPitch = false; cand.minuteOut = sim.minute; lineupChanged(T); }
}

// -----------------------------------------------------------------------------
// Elfmeterschießen (ein Schuss pro step)
// -----------------------------------------------------------------------------

export function shootoutKick(sim: MatchSim): void {
  const s = sim.shoot;
  if (s.done) return;
  const side = s.next;
  const T = sim.team(side);
  const O = sim.team(side === 'home' ? 'away' : 'home');
  const takers = onPitch(T).slice().sort((a, b) => {
    if (a.id === T.penaltyTakerId) return -1;
    if (b.id === T.penaltyTakerId) return 1;
    return (b.p.attributes.penalties ?? 50) + b.p.attributes.composure * 0.3 - ((a.p.attributes.penalties ?? 50) + a.p.attributes.composure * 0.3);
  });
  const idx = side === 'home' ? s.kicksH : s.kicksA;
  // Notfall: niemand mehr auf dem Platz (z. B. Amateurverein mit Mini-Kader) → irgendein Spieler.
  const taker = takers[idx % Math.max(1, takers.length)] ?? T.players[idx % Math.max(1, T.players.length)];
  const keeper = keeperOf(O);
  const pressure = idx >= 4 ? 0.95 : 1;
  const p = taker
    ? clamp(0.75 * Math.pow(finishSkill(taker, 'penalty', 1) / 65, 0.6) * Math.pow(62 / keeperValue(keeper, 'penalty', 1), 0.45) * pressure, 0.5, 0.92)
    : 0;
  const scored = sim.rng() < p;
  const saved = !scored && sim.rng() < 0.6;
  if (side === 'home') { s.kicksH++; if (scored) s.home++; } else { s.kicksA++; if (scored) s.away++; }
  if (keeper && saved) keeper.impact += 0.35;
  sim.emit('shootout_kick', { side, player: taker?.id ?? '', keeper: keeper?.id, shootout: { scored, saved, home: s.home, away: s.away, round: Math.max(s.kicksH, s.kicksA) } });
  s.next = side === 'home' ? 'away' : 'home';
  // Entscheidung?
  const remH = Math.max(0, 5 - s.kicksH), remA = Math.max(0, 5 - s.kicksA);
  let decided = false;
  if (s.kicksH <= 5 && s.kicksA <= 5 && (s.kicksH < 5 || s.kicksA < 5)) {
    if (s.home > s.away + remA || s.away > s.home + remH) decided = true;
  } else if (s.kicksH === s.kicksA && s.home !== s.away) decided = true;
  if (s.kicksH === 5 && s.kicksA === 5 && s.home !== s.away) decided = true;
  if (decided) {
    s.done = true;
    sim.phase = 'done';
    sim.emit('shootout_end', { side: s.home > s.away ? 'home' : 'away', shootout: { scored, home: s.home, away: s.away, round: Math.max(s.kicksH, s.kicksA) } });
  }
}

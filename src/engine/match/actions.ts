// =============================================================================
// Spielaktionen: Angriff → Chance → Abschluss, Standards, Fouls, Karten,
// Verletzungen, Elfmeterschießen.
// =============================================================================
import type { InjurySeverity } from '../../types';
import type { MatchSim } from './sim';
import { lineupChanged, onPitch, type TeamState } from './state';
import { finishing, keeperSkill, matchBase, rating } from './team';
import type { BuildKind, ChanceKind, MPlayer, ShotOutcome, Side } from './types';

/** Gesamtskala der Torgefahr (Kalibrierung über `npm run sim`). */
const GOAL_SCALE = 0.87;
/** Wie stark Stärkeunterschiede durchschlagen. */
const THREAT_EXP = 1.05;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

function weighted<T>(rng: () => number, items: T[], w: (x: T) => number): T | undefined {
  let sum = 0;
  for (let i = 0; i < items.length; i++) { const v = w(items[i]); if (v > 0) sum += v; }
  if (sum <= 0) return undefined;
  let r = rng() * sum;
  let last: T | undefined;
  for (let i = 0; i < items.length; i++) {
    const v = w(items[i]);
    if (v <= 0) continue;
    last = items[i];
    r -= v;
    if (r <= 0) return items[i];
  }
  return last;
}

const keeperOf = (t: TeamState) => onPitch(t).find((m) => m.group === 'GK') ?? onPitch(t).find((m) => m.pos === 'TW');
const pulse = (sim: MatchSim, side: Side, v: number) => { sim.pulse += side === 'home' ? v : -v; };

function threat(sim: MatchSim, T: TeamState, O: TeamState): number {
  const home = T.side === 'home' ? sim.era.homeAdvantage : 1;
  const momBoost = 1 + 0.03 * (T.side === 'home' ? sim.mom : -sim.mom);
  const derbyNoise = sim.derby ? 0.97 : 1; // Derbys sind enger
  const a = T.units.attack * T.mods.att * home * momBoost;
  const d = O.units.defense * O.mods.def * (0.85 + 0.15 * (O.units.keeper / 65));
  return Math.pow(a / Math.max(1, d), THREAT_EXP * derbyNoise);
}

// -----------------------------------------------------------------------------
// Angriff
// -----------------------------------------------------------------------------

export function attack(sim: MatchSim, T: TeamState, O: TeamState): void {
  const rng = sim.rng;
  const th = threat(sim, T, O);
  pulse(sim, T.side, 0.35);

  // Fehler des Gegners im Aufbau → Großchance
  const errP = 0.016 * O.mods.errors * (sim.weather === 'regen' || sim.weather === 'schnee' ? 1.2 : 1)
    * clamp(62 / Math.max(30, O.units.control), 0.7, 1.5);
  if (rng() < errP) {
    const culprit = weighted(rng, onPitch(O), (m) => (m.group === 'ATT' ? 0 : m.group === 'DEF' ? 2 : 1) * (110 - m.p.attributes.composure));
    if (culprit) { culprit.errors++; culprit.impact -= 0.5; }
    shot(sim, T, O, 'fehler', th, culprit?.id);
    return;
  }

  const build = chooseBuild(sim, T, O);
  const pDanger = clamp(0.36 * Math.pow(th, 0.85) * (build === 'konter' ? 1.25 : 1), 0.08, 0.8);
  if (rng() < pDanger) { shot(sim, T, O, build, th); return; }

  // Angriff verpufft
  const r = rng();
  const attackerOf = () => weighted(rng, onPitch(T), (m) => (m.group === 'ATT' ? 3 : m.group === 'MID' ? 1.4 : 0.3));
  const offP = (0.11 + 0.08 * O.mods.trap) * (build === 'steilpass' || build === 'konter' ? 1.5 : 1);
  if (r < offP) {
    const p = attackerOf();
    T.stats.offsides++;
    sim.emit('offside', { side: T.side, player: p?.id, build });
    return;
  }
  if (r < offP + 0.2) { corner(sim, T, O); return; }
  if (r < offP + 0.36) {
    // Foul des Verteidigers in aussichtsreicher Lage
    const fouler = weighted(rng, onPitch(O), (m) => (m.group === 'DEF' ? 3 : m.pos === 'DM' ? 2 : m.group === 'MID' ? 1 : 0.2) * (0.5 + m.p.attributes.aggression / 100));
    const victim = attackerOf();
    if (!fouler) return;
    O.stats.fouls++;
    const prof = build === 'konter' || build === 'steilpass';
    sim.emit('foul', { side: O.side, player: fouler.id, other: victim?.id, zone: 'att', build });
    card(sim, O, fouler, prof ? 2.6 : 1.3, prof && rng() < 0.025);
    const inBox = rng() < (sim.year < 1990 ? 0.05 : 0.06);
    if (inBox) { penalty(sim, T, O); return; }
    if (rng() < 0.38) shot(sim, T, O, 'freistoss', th);
    else if (rng() < 0.3) shot(sim, T, O, 'flanke', th * 0.8);
    return;
  }
  // Ball erobert
  const tackler = weighted(rng, onPitch(O), (m) => (m.group === 'DEF' ? 2.5 : m.group === 'MID' ? 1.6 : 0.3) * (m.p.attributes.tackling + m.p.attributes.interceptions) / 100);
  if (tackler) { tackler.tackles++; tackler.impact += 0.04; }
  sim.emit('attack_fail', { side: T.side, other: tackler?.id, build, player: attackerOf()?.id });
  // Konter
  if (rng() < 0.11 * O.mods.counter * T.mods.exposed) {
    sim.pulse += 0; // Gegenstoß wird als eigener Angriff gespielt
    const thC = threat(sim, O, T);
    if (rng() < clamp(0.42 * Math.pow(thC, 0.85), 0.1, 0.8)) shot(sim, O, T, 'konter', thC);
  }
}

function chooseBuild(sim: MatchSim, T: TeamState, O: TeamState): BuildKind {
  const r = sim.rng();
  const eraCross = sim.year < 1990 ? 1.3 : sim.year < 2005 ? 1.1 : 0.9;
  const crossW = 0.22 * T.mods.cross * eraCross * clamp(T.units.crossing / 60, 0.6, 1.4);
  const counterW = 0.07 * T.mods.counter * O.mods.exposed;
  const longW = (T.club.tactics?.buildup === 'long' ? 0.16 : 0.08) * (sim.year < 1992 ? 1.2 : 1);
  const steilW = 0.14, dribW = 0.11;
  const total = crossW + counterW + longW + steilW + dribW + 0.3;
  let x = r * total;
  if ((x -= crossW) < 0) return 'flanke';
  if ((x -= counterW) < 0) return 'konter';
  if ((x -= longW) < 0) return 'weit';
  if ((x -= steilW) < 0) return 'steilpass';
  if ((x -= dribW) < 0) return 'dribbling';
  return 'kurzpass';
}

// -----------------------------------------------------------------------------
// Abschluss
// -----------------------------------------------------------------------------

function pickShooter(sim: MatchSim, T: TeamState, kind: ChanceKind): MPlayer | undefined {
  const field = onPitch(T).filter((m) => m.group !== 'GK');
  if (kind === 'freekick') {
    const fk = field.find((m) => m.id === T.freeKickTakerId);
    if (fk) return fk;
    return field.reduce<MPlayer | undefined>((b, m) => (!b || (m.p.attributes.freeKicks ?? 0) > (b.p.attributes.freeKicks ?? 0) ? m : b), undefined);
  }
  return weighted(sim.rng, field, (m) => {
    const a = m.p.attributes;
    const role = m.pos === 'MS' ? 3.2 : m.pos === 'HS' ? 2.6 : m.pos === 'FL' ? 2 : m.pos === 'OM' ? 1.7 : m.group === 'MID' ? 0.75 : m.pos === 'AV' ? 0.3 : 0.22;
    if (kind === 'header') return (role * 0.6 + (m.group === 'DEF' ? 0.7 : 0)) * (a.heading / 60) ** 2;
    if (kind === 'long') return (m.group === 'MID' ? 2 : role * 0.6) * (a.longShots / 60) ** 2;
    return role * (a.shooting / 60) ** 1.5;
  });
}

function pickAssister(sim: MatchSim, T: TeamState, shooter: MPlayer, build: BuildKind): MPlayer | undefined {
  const field = onPitch(T).filter((m) => m.group !== 'GK' && m !== shooter);
  if (build === 'ecke') return field.find((m) => m.id === T.cornerTakerId) ?? weighted(sim.rng, field, (m) => m.p.attributes.crossing ** 2);
  return weighted(sim.rng, field, (m) => {
    const a = m.p.attributes;
    const role = m.pos === 'OM' ? 2.6 : m.pos === 'FL' ? 2.2 : m.group === 'MID' ? 1.6 : m.group === 'ATT' ? 1.4 : m.pos === 'AV' ? 0.9 : 0.35;
    const skill = build === 'flanke' ? a.crossing : build === 'weit' ? a.longPassing : (a.passing + a.vision) / 2;
    return role * (skill / 60) ** 2;
  });
}

export function shot(sim: MatchSim, T: TeamState, O: TeamState, build: BuildKind, th: number, culprit?: string, rebound = false): void {
  const rng = sim.rng;
  let type: ChanceKind;
  let xg: number;
  const pBig = clamp(0.1 * Math.pow(th, 0.7), 0.04, 0.35);
  if (build === 'fehler') { type = 'big'; xg = 0.3 + rng() * 0.3; }
  else if (build === 'freistoss') { type = 'freekick'; xg = 0.04 + rng() * 0.05; }
  else if (rebound) { type = 'normal'; xg = 0.12 + rng() * 0.2; }
  else if (build === 'konter' && rng() < pBig * 2.2) { type = 'counter'; xg = 0.25 + rng() * 0.3; }
  else if (rng() < pBig) { type = build === 'dribbling' && rng() < 0.5 ? 'solo' : 'big'; xg = 0.28 + rng() * 0.32; }
  else if ((build === 'flanke' || build === 'ecke') && rng() < 0.7) {
    type = 'header';
    const air = clamp(T.units.aerialAtt / Math.max(30, O.units.aerialDef), 0.7, 1.4);
    xg = (0.04 + rng() * 0.09) * air;
  } else if (rng() < (sim.year < 1990 ? 0.38 : 0.3) / Math.max(0.6, Math.sqrt(th))) { type = 'long'; xg = 0.02 + rng() * 0.04; }
  else { type = 'normal'; xg = 0.05 + rng() * 0.1; }

  const shooter = pickShooter(sim, T, type);
  if (!shooter) return;
  const assister = type === 'freekick' || type === 'solo' || build === 'fehler' || rebound ? undefined
    : rng() < 0.82 ? pickAssister(sim, T, shooter, build) : undefined;

  const kind = type === 'header' ? 'header' : type === 'long' ? 'long' : type === 'freekick' ? 'freekick' : 'foot';
  const fin = finishing(shooter, kind);
  const gk = keeperSkill(keeperOf(O));
  const wetBoost = (sim.weather === 'regen' || sim.weather === 'schnee') && (type === 'long' || type === 'freekick') ? 1.12 : 1;
  const pGoal = clamp(xg * Math.pow(fin / 62, 1.5) * Math.pow(62 / gk, 1.25) * sim.era.goalFactor * GOAL_SCALE * wetBoost, 0.008, 0.9);
  const big = xg >= 0.3;

  // Angezeigter xG-Wert = Torwahrscheinlichkeit für einen durchschnittlichen Schützen
  xg *= GOAL_SCALE * sim.era.goalFactor;
  T.stats.shots++; shooter.shots++;
  T.stats.xg += xg; shooter.xg += xg;
  if (big) T.stats.bigChances++;
  if (assister) { assister.keyPasses++; assister.impact += 0.12; }
  pulse(sim, T.side, 0.6 + xg * 2);

  let outcome: ShotOutcome;
  if (rng() < pGoal) outcome = 'goal';
  else {
    const blockP = type === 'long' ? 0.33 : type === 'normal' ? 0.24 : type === 'header' ? 0.08 : type === 'freekick' ? 0.3 : 0.1;
    const r = rng();
    if (r < blockP) outcome = 'blocked';
    else if (r < blockP + (1 - blockP) * (big ? 0.5 : 0.4)) outcome = 'saved';
    else if (rng() < 0.08) outcome = 'post';
    else outcome = type === 'header' || type === 'long' ? (rng() < 0.55 ? 'over' : 'wide') : (rng() < 0.45 ? 'over' : 'wide');
  }

  const keeper = keeperOf(O);
  let ownGoal = false;
  let scorer = shooter;
  if (outcome === 'goal' && (type === 'header' || type === 'normal') && rng() < 0.035) {
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
    other: culprit,
    chance: { type, xg: Math.round(xg * 100) / 100, outcome, big, ownGoal: ownGoal || undefined, disallowed: disallowed || undefined, rebound: rebound || undefined },
  });
  if (disallowed) sim.emit('var', { side: T.side, player: scorer.id, detail: rng() < 0.6 ? 'abseits' : 'foul' });

  // Nachspiel: Ecke, Abpraller
  if (outcome === 'saved' || outcome === 'blocked') {
    if (!rebound && rng() < 0.11) { shot(sim, T, O, 'abpraller', th, undefined, true); return; }
    if (rng() < 0.32) corner(sim, T, O);
  }
}

function corner(sim: MatchSim, T: TeamState, O: TeamState): void {
  T.stats.corners++;
  const taker = onPitch(T).find((m) => m.id === T.cornerTakerId);
  sim.emit('corner', { side: T.side, player: taker?.id });
  const air = clamp(T.units.aerialAtt / Math.max(30, O.units.aerialDef), 0.6, 1.5);
  if (sim.rng() < 0.27 * air) shot(sim, T, O, 'ecke', threat(sim, T, O));
}

function penalty(sim: MatchSim, T: TeamState, O: TeamState): void {
  const field = onPitch(T).filter((m) => m.group !== 'GK');
  const taker = field.find((m) => m.id === T.penaltyTakerId)
    ?? field.reduce<MPlayer | undefined>((b, m) => (!b || (m.p.attributes.penalties ?? 0) > (b.p.attributes.penalties ?? 0) ? m : b), undefined);
  if (!taker) return;
  const keeper = keeperOf(O);
  const pen = finishing(taker, 'penalty');
  const p = clamp(0.77 * Math.pow(pen / 65, 0.5) * Math.pow(62 / keeperSkill(keeper), 0.35), 0.55, 0.92);
  const r = sim.rng();
  const outcome: ShotOutcome = r < p ? 'goal' : r < p + (1 - p) * 0.62 ? 'saved' : sim.rng() < 0.25 ? 'post' : 'wide';
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

// -----------------------------------------------------------------------------
// Fouls, Karten, Verletzungen
// -----------------------------------------------------------------------------

export function openPlayFoul(sim: MatchSim, T: TeamState, O: TeamState): void {
  const eraF = sim.year < 1985 ? 1.18 : sim.year < 2000 ? 1.08 : 0.96;
  const derby = sim.derby ? 1.15 : 1;
  if (sim.rng() >= 0.085 * T.mods.foul * eraF * derby) return;
  const fouler = weighted(sim.rng, onPitch(T), (m) => (m.group === 'GK' ? 0 : m.group === 'DEF' ? 1.5 : m.group === 'MID' ? 1.4 : 0.8) * (0.4 + m.p.attributes.aggression / 100));
  const victim = weighted(sim.rng, onPitch(O), (m) => (m.group === 'GK' ? 0 : 0.5 + m.p.attributes.dribbling / 100));
  if (!fouler) return;
  T.stats.fouls++;
  sim.emit('foul', { side: T.side, player: fouler.id, other: victim?.id, zone: sim.rng() < 0.6 ? 'mid' : 'def' });
  card(sim, T, fouler, 1, false);
}

/** Karte nach einem Foul. `sev` > 1 = taktisches/hartes Foul. */
function card(sim: MatchSim, T: TeamState, m: MPlayer, sev: number, notbremse: boolean): void {
  const rng = sim.rng;
  const a = m.p.attributes;
  const late = sim.minute > 70 ? 1.2 : 1;
  const temper = 0.65 + a.aggression / 100 * 0.6 - a.composure / 100 * 0.2;
  const derby = sim.derby ? 1.2 : 1;
  const ref = T.side === 'away' ? 1 + (sim.era.homeAdvantage - 1) * 0.6 : 1;
  if (notbremse || rng() < sim.era.redPerFoul * sev * temper * derby * T.mods.cards) {
    m.red++; m.impact -= 1.2;
    sendOff(sim, T, m, 'red');
    return;
  }
  const pY = sim.era.yellowPerFoul * sev * temper * late * derby * ref * T.mods.cards * (m.yellow ? 0.65 : 1);
  if (rng() >= pY) return;
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
  if (sim.rng() >= 0.0105 * hard) return; // Vorprüfung (Team)
  const cand = onPitch(T)[Math.floor(sim.rng() * onPitch(T).length)];
  if (!cand) return;
  const prone = (cand.p.development?.injuryProneness ?? 40) / 100;
  if (sim.rng() >= 0.12 * (0.5 + prone) * (cand.energy < 50 ? 1.4 : 1)) return;
  const r = sim.rng();
  const severity: InjurySeverity = r < 0.58 ? 'minor' : r < 0.9 ? 'moderate' : 'severe';
  sim.injuries.set(cand.id, severity);
  cand.injured = true;
  sim.incident(1.5);
  sim.emit('injury', { side: T.side, player: cand.id, severity });
  // Leicht angeschlagen: spielt manchmal weiter
  if (severity === 'minor' && sim.rng() < 0.45) { cand.energy = Math.max(20, cand.energy - 15); T.dirty = true; return; }
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
  const taker = takers[idx % Math.max(1, takers.length)];
  const keeper = keeperOf(O);
  const pressure = idx >= 4 ? 0.95 : 1;
  const p = clamp(0.75 * Math.pow(finishing(taker, 'penalty') / 65, 0.6) * Math.pow(62 / keeperSkill(keeper), 0.4) * pressure, 0.5, 0.92);
  const scored = sim.rng() < p;
  const saved = !scored && sim.rng() < 0.6;
  if (side === 'home') { s.kicksH++; if (scored) s.home++; } else { s.kicksA++; if (scored) s.away++; }
  if (keeper && saved) keeper.impact += 0.35;
  sim.emit('shootout_kick', { side, player: taker.id, keeper: keeper?.id, shootout: { scored, saved, home: s.home, away: s.away, round: Math.max(s.kicksH, s.kicksA) } });
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

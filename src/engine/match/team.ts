// =============================================================================
// Mannschaft im Spiel: Aufstellung auflösen, Spielerstärke auf der Position,
// Tagesform und die Mannschaftsteile (Angriff, Kontrolle, Abwehr, Torwart).
// =============================================================================
import type { Club, Player, Position, Tactics } from '../../types';
import { POSITION_GROUPS } from '../../types';
import { getFormation } from '../../data/formations';
import { getEraYear, positionSuitability } from '../positions';
import type { MPlayer, Mentality, ShoutId, Side } from './types';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export const isAvailable = (p: Player | undefined): p is Player =>
  !!p && p.availability === 'available' && !p.injury && !(p.suspensionMatches > 0);

const MORALE: Record<string, number> = { very_low: 0.95, low: 0.975, okay: 1, good: 1.015, excellent: 1.03 };

/** Tagesform: Form, Moral, Fitness und Frische (ohne Positionswert). */
export function conditionFactor(p: Player): number {
  const form = 0.94 + (clamp(p.form ?? 50, 0, 100) / 100) * 0.12;
  const morale = MORALE[p.morale] ?? 1;
  const fit = 0.9 + (clamp(p.attributes.fitness ?? 80, 0, 100) / 100) * 0.1;
  const fr = typeof p.frische === 'number' ? p.frische : 100;
  const frische = 0.95 + (clamp(fr, 0, 100) / 100) * 0.05;
  return form * morale * fit * frische;
}

/** Startkraft aus der Frische: müde Spieler bauen früher ab. */
export function startEnergy(p: Player): number {
  const fr = typeof p.frische === 'number' ? p.frische : 100;
  return 85 + clamp(fr, 0, 100) * 0.15;
}

export function makeMPlayer(p: Player, side: Side, pos: Position, started: boolean, minuteIn: number): MPlayer {
  return {
    p, id: p.id, side, pos, group: POSITION_GROUPS[pos],
    base: matchBase(p, pos), cond: conditionFactor(p), energy: startEnergy(p),
    onPitch: started, started, minuteIn, minuteOut: null, sentOff: false, injured: false,
    goals: 0, ownGoals: 0, assists: 0, yellow: 0, yellowRed: 0, red: 0, shots: 0, shotsOnTarget: 0, xg: 0,
    bigMissed: 0, keyPasses: 0, passes: 0, passesOk: 0, duels: 0, duelsWon: 0, tackles: 0, saves: 0,
    errors: 0, distance: 0, impact: 0,
  };
}

/**
 * Stärke auf der gespielten Position. Ein Großteil kommt aus der Positionseignung,
 * ein kleiner Teil aus der Gesamtklasse (Spielintelligenz hilft auch fehlbesetzt).
 */
export function matchBase(p: Player, pos: Position): number {
  return cachedSuitability(p, pos) * 0.82 + Math.min(p.overall, cachedSuitability(p, p.naturalPosition)) * 0.18;
}

/** Tagesstärke eines Spielers auf seiner Position inkl. Kraft. */
export function rating(m: MPlayer): number {
  return m.base * m.cond * (0.8 + 0.2 * (m.energy / 100));
}

// -----------------------------------------------------------------------------
// Aufstellung
// -----------------------------------------------------------------------------

/** Positionsstärke mit Zwischenspeicher (gültig, solange Overall und Spieljahr gleich bleiben). */
const suitCache = new WeakMap<Player, { stamp: string; v: Partial<Record<Position, number>> }>();
export function cachedSuitability(p: Player, pos: Position): number {
  const stamp = `${p.overall}|${getEraYear()}`;
  let c = suitCache.get(p);
  if (!c || c.stamp !== stamp) { c = { stamp, v: {} }; suitCache.set(p, c); }
  return c.v[pos] ?? (c.v[pos] = positionSuitability(p, pos));
}

export interface ResolvedLineup {
  xi: { p: Player; pos: Position }[];
  bench: Player[];
  formation: string;
}

/**
 * Startelf + Bank.
 * - Vom Menschen geführter Verein: gespeicherte Startelf/Positionen, fehlende
 *   (verletzt/gesperrt) werden slotgenau mit dem passendsten Ersatz besetzt.
 * - KI-Verein: stellt in der eigenen Formation jedes Mal neu auf (Eignung × Frische).
 */
export function resolveLineup(club: Club, players: Record<string, Player>, human: boolean, benchSize: number): ResolvedLineup {
  const t: Tactics | undefined = club.tactics;
  const formation = getFormation(t?.formation);
  const pool = club.playerIds.map((id) => players[id]).filter(isAvailable);
  const used = new Set<string>();
  const slotPlayer: Record<string, Player> = {};

  if (human && t?.startingXI?.length) {
    // gespeicherte Zuordnung übernehmen
    const map = t.lineupMap ?? {};
    for (const slot of formation.slots) {
      const pid = map[slot.id];
      const p = pid ? players[pid] : undefined;
      if (isAvailable(p) && club.playerIds.includes(p.id) && !used.has(p.id)) { slotPlayer[slot.id] = p; used.add(p.id); }
    }
    // Startelf ohne lineupMap (Altstand): der Reihe nach in die Slots
    if (!t.lineupMap) {
      const xi = t.startingXI.map((id) => players[id]).filter((p): p is Player => isAvailable(p) && !used.has(p.id));
      for (const slot of formation.slots) {
        if (slotPlayer[slot.id]) continue;
        const p = xi.shift();
        if (p) { slotPlayer[slot.id] = p; used.add(p.id); }
      }
    }
  }

  // Offene Slots füllen: je Slot (Tor, Abwehr, Mittelfeld, Sturm) der passendste Freie
  const open = formation.slots.filter((s) => !slotPlayer[s.id]);
  if (open.length) {
    const cands = pool.filter((p) => !used.has(p.id));
    const cond = cands.map((p) => (human ? 1 : conditionFactor(p)));
    const taken = new Array<boolean>(cands.length).fill(false);
    for (const s of open) {
      let bi = -1; let bv = -1;
      for (let i = 0; i < cands.length; i++) {
        if (taken[i]) continue;
        const v = cachedSuitability(cands[i], s.position) * cond[i];
        if (v > bv) { bv = v; bi = i; }
      }
      if (bi < 0) break;
      taken[bi] = true;
      slotPlayer[s.id] = cands[bi]; used.add(cands[bi].id);
    }
  }

  const xi = formation.slots
    .filter((s) => slotPlayer[s.id])
    .map((s) => ({ p: slotPlayer[s.id], pos: s.position }));

  // Bank: gespeicherte Ersatzspieler, dann Beste nach Overall; ein Torwart, wenn möglich
  const bench: Player[] = [];
  const pushBench = (p: Player | undefined) => {
    if (bench.length >= benchSize || !isAvailable(p) || used.has(p.id) || !club.playerIds.includes(p.id)) return;
    bench.push(p); used.add(p.id);
  };
  if (human) for (const id of t?.substitutes ?? []) pushBench(players[id]);
  const rest = pool.filter((p) => !used.has(p.id)).sort((a, b) => b.overall - a.overall);
  if (!bench.some((p) => p.naturalPosition === 'TW')) pushBench(rest.find((p) => p.naturalPosition === 'TW'));
  for (const p of rest) pushBench(p);

  return { xi, bench, formation: formation.id };
}

// -----------------------------------------------------------------------------
// Mannschaftsteile
// -----------------------------------------------------------------------------

/** Rollengewichte je Position: [Angriff, Kontrolle, Abwehr]. */
const ROLE: Record<Position, [number, number, number]> = {
  TW: [0, 0.1, 0],
  LIB: [0.1, 0.5, 1.0],
  VS: [0.08, 0.3, 1.0],
  AV: [0.3, 0.45, 0.85],
  DM: [0.3, 0.9, 0.7],
  ZM: [0.55, 1.0, 0.4],
  OM: [0.85, 0.9, 0.15],
  FL: [1.0, 0.45, 0.12],
  MS: [1.0, 0.3, 0.06],
  HS: [1.0, 0.55, 0.08],
};

export interface Units {
  attack: number;
  control: number;
  defense: number;
  keeper: number;
  /** Lufthoheit (Kopfball/Sprungkraft) in der Offensive und Defensive. */
  aerialAtt: number;
  aerialDef: number;
  /** Flankenqualität der Außen. */
  crossing: number;
  /** Zweikampfstärke. */
  duel: number;
  /** Ø Passspiel (für Passquote). */
  passing: number;
}

export interface TeamRefs { attack: number; control: number; defense: number }

export function referenceWeights(onPitch: MPlayer[]): TeamRefs {
  const r = { attack: 0, control: 0, defense: 0 };
  for (const m of onPitch) { const w = ROLE[m.pos]; r.attack += w[0]; r.control += w[1]; r.defense += w[2]; }
  return { attack: r.attack || 1, control: r.control || 1, defense: r.defense || 1 };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 50);

export function computeUnits(onPitch: MPlayer[], refs: TeamRefs): Units {
  let a = 0, c = 0, d = 0;
  let keeper = 0;
  const aerA: number[] = [], aerD: number[] = [], cross: number[] = [], duel: number[] = [], pass: number[] = [];
  for (const m of onPitch) {
    const r = rating(m);
    const w = ROLE[m.pos];
    a += w[0] * r; c += w[1] * r; d += w[2] * r;
    const at = m.p.attributes;
    const phys = m.cond * (0.8 + 0.2 * m.energy / 100);
    if (m.group === 'GK') keeper = r;
    else {
      const aer = (at.heading * 0.55 + at.jumping * 0.3 + at.strength * 0.15) * phys;
      if (m.group === 'ATT' || m.pos === 'OM') aerA.push(aer);
      if (m.group === 'DEF') { aerD.push(aer); aerA.push(aer * 0.8); }
      if (m.pos === 'FL' || m.pos === 'AV' || m.pos === 'OM') cross.push(at.crossing * phys);
      duel.push((at.tackling * 0.35 + at.strength * 0.25 + at.marking * 0.2 + at.aggression * 0.1 + at.balance * 0.1) * phys);
      pass.push(at.passing * 0.6 + at.vision * 0.2 + at.firstTouch * 0.2);
    }
  }
  // Ein fehlender Torwart (Feldspieler im Tor) wiegt schwer.
  if (!keeper) keeper = 25;
  // Unterzahl: fehlende Spieler senken die Summe (Referenz = Startformation).
  return {
    attack: a / refs.attack,
    control: c / refs.control,
    defense: d / refs.defense,
    keeper,
    aerialAtt: avg(aerA),
    aerialDef: avg(aerD),
    crossing: avg(cross),
    duel: avg(duel),
    passing: avg(pass),
  };
}

// -----------------------------------------------------------------------------
// Taktik-Einflüsse
// -----------------------------------------------------------------------------

export interface TacticMods {
  att: number;
  def: number;
  ctrl: number;
  /** Angriffshäufigkeit. */
  rate: number;
  /** Fouls/Härte. */
  foul: number;
  /** Kraftverbrauch. */
  drain: number;
  /** Anteil Flankenspiel. */
  cross: number;
  /** Anfälligkeit für Konter (des Gegners). */
  exposed: number;
  /** Eigene Konterstärke. */
  counter: number;
  /** Abseitsfalle. */
  trap: number;
  /** Fehleranfälligkeit. */
  errors: number;
  /** Kartenrisiko. */
  cards: number;
  /** Zweikampf. */
  duel: number;
}

const norm = (v: number | undefined) => ((v ?? 50) - 50) / 50;

export function tacticMods(t: Tactics | undefined, mentality: Mentality, shout: ShoutId | null, shoutPower: number, talk: number): TacticMods {
  const m: TacticMods = { att: 1, def: 1, ctrl: 1, rate: 1, foul: 1, drain: 1, cross: 1, exposed: 1, counter: 1, trap: 0, errors: 1, cards: 1, duel: 1 };
  switch (t?.style) {
    case 'attacking': m.att *= 1.07; m.def *= 0.95; m.rate *= 1.1; m.exposed *= 1.15; break;
    case 'defensive': m.att *= 0.93; m.def *= 1.06; m.rate *= 0.88; m.exposed *= 0.85; break;
    case 'counter': m.ctrl *= 0.95; m.counter *= 1.45; m.exposed *= 0.95; m.rate *= 0.95; break;
    default: break;
  }
  const tempo = norm(t?.tempo), press = norm(t?.pressing), line = norm(t?.defensiveLine), hard = norm(t?.tackleHardness), width = norm(t?.widthFocus);
  m.rate *= 1 + tempo * 0.1 + press * 0.05;
  m.errors *= 1 + tempo * 0.12;
  m.ctrl *= 1 + press * 0.04 + (t?.buildup === 'short' ? 0.02 : -0.01);
  m.def *= 1 + press * 0.02;
  m.exposed *= 1 + line * 0.18 + press * 0.06;
  m.drain *= 1 + press * 0.25 + tempo * 0.15;
  m.foul *= 1 + hard * 0.35 + press * 0.12;
  m.cards *= 1 + hard * 0.3;
  m.duel *= 1 + hard * 0.05;
  m.cross *= 1 + width * 0.35 + (t?.buildup === 'long' ? 0.15 : 0);
  m.trap = t?.offsideTrap ? 1 : 0;
  // Ausrichtung im Spiel
  m.att *= 1 + mentality * 0.045;
  m.def *= 1 - mentality * 0.04;
  m.rate *= 1 + mentality * 0.11;
  m.exposed *= 1 + mentality * 0.14;
  m.drain *= 1 + Math.abs(mentality) * 0.05;
  // Zurufe
  if (shout && shoutPower > 0) {
    const s = shoutPower;
    switch (shout) {
      case 'druck': m.att *= 1 + 0.07 * s; m.rate *= 1 + 0.12 * s; m.def *= 1 - 0.03 * s; m.drain *= 1 + 0.3 * s; break;
      case 'ruhe': m.ctrl *= 1 + 0.07 * s; m.rate *= 1 - 0.08 * s; m.errors *= 1 - 0.3 * s; m.exposed *= 1 - 0.1 * s; break;
      case 'kompakt': m.def *= 1 + 0.07 * s; m.att *= 1 - 0.04 * s; m.exposed *= 1 - 0.15 * s; break;
      case 'fluegel': m.cross *= 1 + 0.6 * s; m.att *= 1 + 0.02 * s; break;
      case 'konzentration': m.def *= 1 + 0.035 * s; m.errors *= 1 - 0.45 * s; m.cards *= 1 - 0.4 * s; break;
      case 'zweikampf': m.duel *= 1 + 0.1 * s; m.def *= 1 + 0.035 * s; m.foul *= 1 + 0.45 * s; m.cards *= 1 + 0.25 * s; break;
    }
  }
  // Halbzeitansprache (Faktor um 1)
  m.att *= talk; m.def *= talk; m.ctrl *= talk;
  return m;
}

// -----------------------------------------------------------------------------
// Einzelwerte für Abschluss & Torwart
// -----------------------------------------------------------------------------

export function finishing(m: MPlayer, kind: 'foot' | 'header' | 'long' | 'penalty' | 'freekick'): number {
  const a = m.p.attributes;
  const phys = m.cond * (0.85 + 0.15 * m.energy / 100);
  let v: number;
  switch (kind) {
    case 'header': v = a.heading * 0.6 + a.jumping * 0.25 + a.strength * 0.15; break;
    case 'long': v = a.longShots * 0.6 + a.shotPower * 0.3 + a.technique * 0.1; break;
    case 'penalty': v = (a.penalties ?? 55) * 0.7 + a.composure * 0.3; break;
    case 'freekick': v = (a.freeKicks ?? 50) * 0.75 + a.shotPower * 0.15 + a.technique * 0.1; break;
    default: v = a.shooting * 0.45 + a.composure * 0.25 + a.technique * 0.15 + a.firstTouch * 0.15;
  }
  return v * phys;
}

export function keeperSkill(m: MPlayer | undefined): number {
  if (!m) return 25;
  if (m.group !== 'GK') return 25 + m.p.attributes.agility * 0.15;
  return rating(m);
}

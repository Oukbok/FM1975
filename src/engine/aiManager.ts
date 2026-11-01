// =============================================================================
// MANAGER-KI — Rechenlogik ohne Spielablauf
// -----------------------------------------------------------------------------
// 1) Trainer: Erzeugung passend zu Epoche/Land, Stil → Taktik und Formation.
// 2) Kaderbewertung je Positionsgruppe (Tiefe, Alter, Stärke) → Bedarf.
// 3) Vorstandsdruck aus Tabellenplatz gegen Erwartung.
// Spielablauf (Transfers, Entlassungen, Nachrichten) in game/aiClubs.ts und
// game/coachCarousel.ts. Alle Geldwerte sind Preisschilder in 1975-Basis.
// =============================================================================
import { Club, ClubCoach, CoachPhilosophy, CoachStyle, LeagueTableRow, Player, Position, Tactics, TacticStyle } from '../types';
import { FORMATIONS, getFormation } from '../data/formations';
import { makeName, ORIGINS, pickOrigin } from '../data/origins';
import { assignToFormation, buildAutoTactics } from './lineupAI';
import { positionSuitability } from './positions';
import { hash01 } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// 1) Trainer
// -----------------------------------------------------------------------------
export const COACH_STYLE_LABEL: Record<CoachStyle, string> = {
  offensiv: 'offensiv', ausgewogen: 'ausgewogen', defensiv: 'defensiv', konter: 'Konterfußball',
};
export const COACH_PHILOSOPHY_LABEL: Record<CoachPhilosophy, string> = {
  jugend: 'setzt auf die Jugend', einkauf: 'setzt auf Einkäufe', ausgewogen: 'Jugend und Einkäufe',
};

function weighted<T extends string>(w: Record<T, number>, r: number): T {
  const keys = Object.keys(w) as T[];
  const total = keys.reduce((s, k) => s + w[k], 0);
  let x = r * total;
  for (const k of keys) { x -= w[k]; if (x <= 0) return k; }
  return keys[keys.length - 1];
}

/** Stilverteilung je Epoche (Libero-Zeit eher vorsichtig, später mehr Pressing/Umschalten). */
function styleWeights(year: number): Record<CoachStyle, number> {
  if (year < 1990) return { offensiv: 25, ausgewogen: 35, defensiv: 25, konter: 15 };
  if (year < 2005) return { offensiv: 22, ausgewogen: 40, defensiv: 18, konter: 20 };
  return { offensiv: 30, ausgewogen: 35, defensiv: 10, konter: 25 };
}

/** Herkunft ausländischer Trainer je Epoche (IDs aus data/origins.ts). */
function foreignCoachMix(year: number): Record<string, number> {
  if (year < 1990) return { aut: 35, yug: 22, hun: 14, ned: 14, den: 5, swe: 5, sui: 5 };
  if (year < 2005) return { aut: 22, sui: 14, ned: 14, cro: 10, srb: 8, den: 8, ita: 6, nor: 6, fra: 6, eng: 6 };
  return { aut: 18, sui: 16, ned: 14, ita: 8, esp: 8, fra: 8, den: 8, nor: 6, usa: 6, cro: 8 };
}

/** Lieblingsformationen je Stil und Epoche (IDs aus data/formations.ts). */
export function formationsFor(style: CoachStyle, year: number): string[] {
  if (year < 1990) {
    return { offensiv: ['4-3-3', 'libero-1-3-4-2'], ausgewogen: ['libero-1-4-3-2', '4-4-2'],
      defensiv: ['libero-1-4-4-1', '5-3-2'], konter: ['libero-1-4-3-2', '4-4-2'] }[style];
  }
  if (year < 2000) {
    return { offensiv: ['4-3-3', '3-4-3'], ausgewogen: ['4-4-2', '3-5-2'],
      defensiv: ['5-3-2', 'libero-1-4-4-1'], konter: ['3-5-2', '4-4-2'] }[style];
  }
  return { offensiv: ['4-3-3', '4-2-3-1', '3-4-3'], ausgewogen: ['4-2-3-1', '4-4-2'],
    defensiv: ['5-3-2', '4-4-2'], konter: ['4-2-3-1', '4-4-2', '5-3-2'] }[style];
}

/**
 * Neuer Trainer. Das Ansehen orientiert sich am Verein (große Vereine holen
 * bekanntere Trainer), Herkunft überwiegend einheimisch, Namen aus der Zeit,
 * in der der Trainer aufgewachsen ist.
 */
export function makeCoach(year: number, clubRep: number, date: string, rng: () => number): ClubCoach {
  const age = 34 + Math.floor(rng() * 28);
  const domestic = rng() < (year < 1995 ? 0.8 : 0.68);
  // Auslandstrainer: früher v. a. aus Österreich, Jugoslawien, Ungarn, den Niederlanden.
  const foreign = weighted(foreignCoachMix(year), rng());
  const origin = domestic || !ORIGINS[foreign] ? pickOrigin(Math.max(1975, year - age + 20), rng, true) : ORIGINS[foreign];
  const n = makeName(origin, rng);
  const style = weighted(styleWeights(year), rng());
  const philosophy = weighted<CoachPhilosophy>(clubRep >= 80
    ? { jugend: 20, einkauf: 45, ausgewogen: 35 }
    : { jugend: 35, einkauf: 25, ausgewogen: 40 }, rng());
  const prefs = formationsFor(style, year);
  return {
    id: `co_${year}_${Math.floor(rng() * 1e9)}`,
    name: `${n.firstName} ${n.lastName}`, age, nationality: origin.nationality,
    style, philosophy,
    reputation: Math.round(clamp(clubRep - 10 + rng() * 16 + (age - 45) * 0.25, 15, 95)),
    since: date,
    preferredFormation: prefs[Math.floor(rng() * prefs.length)],
    pressure: 25,
  };
}

const TACTIC_STYLE: Record<CoachStyle, TacticStyle> = {
  offensiv: 'attacking', ausgewogen: 'balanced', defensiv: 'defensive', konter: 'counter',
};

/** Grundwerte je Stil (Mittel wie die bisherige Zufallstaktik, damit die Balance bleibt). */
const STYLE_BASE: Record<CoachStyle, { pressing: number; tempo: number; line: number; width: number; long: number; effort: number }> = {
  offensiv: { pressing: 60, tempo: 58, line: 58, width: 56, long: 0.4, effort: 58 },
  ausgewogen: { pressing: 50, tempo: 50, line: 50, width: 50, long: 0.5, effort: 50 },
  defensiv: { pressing: 42, tempo: 44, line: 40, width: 46, long: 0.5, effort: 52 },
  konter: { pressing: 46, tempo: 60, line: 40, width: 52, long: 0.7, effort: 54 },
};

/** Formationsbewertung: Besetzbarkeit + Vorliebe des Trainers + Zeitgeist (Libero stirbt aus). */
export function chooseFormation(pool: Player[], coach: ClubCoach, year: number): string {
  const prefs = new Set(formationsFor(coach.style, year));
  const byId = new Map(pool.map((p) => [p.id, p]));
  let best = getFormation(undefined).id, bestScore = -Infinity;
  for (const f of FORMATIONS) {
    const asg = assignToFormation(f, pool);
    let score = 0;
    for (const slot of f.slots) {
      const pid = asg.lineupMap[slot.id];
      const p = pid ? byId.get(pid) : undefined;
      if (p) score += positionSuitability(p, slot.position);
    }
    if (f.libero) score += year < 1985 ? 12 : year < 1992 ? 4 : year < 1998 ? -10 : -40;
    if (f.id === coach.preferredFormation) score += 16;
    else if (prefs.has(f.id)) score += 8;
    if (score > bestScore) { bestScore = score; best = f.id; }
  }
  return best;
}

/** Taktik eines KI-Vereins nach seinem Trainer (Formation + Stil + Feineinstellungen). */
export function coachTactics(club: Club, players: Record<string, Player>, coach: ClubCoach, year: number): Tactics {
  const pool = club.playerIds.map((id) => players[id]).filter((p): p is Player => !!p && !p.injury);
  const b = STYLE_BASE[coach.style];
  const h = (k: string) => (hash01(coach.id + k) - 0.5) * 16;
  const t = (v: number) => Math.round(clamp(v, 0, 100));
  const base: Tactics = {
    ...club.tactics,
    style: TACTIC_STYLE[coach.style],
    pressing: t(b.pressing + h('p')), tempo: t(b.tempo + h('t')), defensiveLine: t(b.line + h('l')),
    widthFocus: t(b.width + h('w')), tackleHardness: t(50 + h('h')), effort: t(b.effort + h('e') * 0.75),
    buildup: hash01(coach.id + 'b') < b.long ? 'long' : 'short',
    offsideTrap: hash01(coach.id + 'o') < (coach.style === 'offensiv' ? 0.5 : 0.3),
  };
  return buildAutoTactics(club, players, base, chooseFormation(pool, coach, year));
}

// -----------------------------------------------------------------------------
// 2) Kaderbewertung
// -----------------------------------------------------------------------------
export type PosGroup = 'TW' | 'IV' | 'AV' | 'ZM' | 'FL' | 'ST';
export const POS_GROUPS: PosGroup[] = ['TW', 'IV', 'AV', 'ZM', 'FL', 'ST'];
export const GROUP_OF: Record<Position, PosGroup> = {
  TW: 'TW', LIB: 'IV', VS: 'IV', AV: 'AV', DM: 'ZM', ZM: 'ZM', OM: 'ZM', FL: 'FL', MS: 'ST', HS: 'ST',
};
export const GROUP_LABEL: Record<PosGroup, string> = {
  TW: 'Tor', IV: 'Innenverteidigung', AV: 'Außenverteidigung', ZM: 'Mittelfeld', FL: 'Flügel', ST: 'Sturm',
};
/** Typische Position einer Gruppe (für Neuzugänge aus dem Ausland). */
export const GROUP_POS: Record<PosGroup, Position[]> = {
  TW: ['TW'], IV: ['VS', 'VS', 'LIB'], AV: ['AV'], ZM: ['ZM', 'DM', 'OM'], FL: ['FL'], ST: ['MS', 'MS', 'HS'],
};

export interface GroupNeed {
  group: PosGroup;
  count: number;
  /** Gewünschte Kadertiefe. */
  target: number;
  /** Stammplätze in der Formation. */
  starters: number;
  /** Ø Stärke der Stammkräfte (beste `starters`). */
  startAvg: number;
  /** Schwächster Stammspieler. */
  startMin: number;
  /** Bedarf (0 = keiner, ab ~8 handeln). */
  score: number;
  /** Fehlt vor allem Qualität (statt Breite)? */
  quality: boolean;
  /** Überzählige Spieler (schwächste/älteste zuerst). */
  surplus: Player[];
}

export interface SquadAssessment {
  level: number;
  size: number;
  groups: Record<PosGroup, GroupNeed>;
  /** Gruppen nach Bedarf sortiert (größter zuerst). */
  order: GroupNeed[];
}

/** Stärke der besten Elf. */
export function squadLevel11(squad: Player[]): number {
  const o = squad.map((p) => p.overall).sort((a, b) => b - a).slice(0, 11);
  return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 60;
}

/**
 * Bewertet den Kader je Positionsgruppe. `longInjuredDays` zählt lange
 * Verletzte nicht mit (Winterfenster).
 */
export function assessSquad(squad: Player[], formationId: string | undefined, longInjuredDays = 9999): SquadAssessment {
  const f = getFormation(formationId);
  const starters: Record<PosGroup, number> = { TW: 1, IV: 0, AV: 0, ZM: 0, FL: 0, ST: 0 };
  for (const s of f.slots) if (s.position !== 'TW') starters[GROUP_OF[s.position]]++;
  const level = squadLevel11(squad);
  const groups = {} as Record<PosGroup, GroupNeed>;
  for (const g of POS_GROUPS) {
    const st = starters[g];
    const target = g === 'TW' ? 3 : st === 0 ? 1 : Math.max(2, Math.ceil(st * 1.8));
    const members = squad.filter((p) => GROUP_OF[p.naturalPosition] === g).sort((a, b) => b.overall - a.overall);
    const fit = members.filter((p) => !(p.injury && p.injury.daysRemaining > longInjuredDays));
    const eff = fit.reduce((s, p) => s + (p.age >= 33 ? 0.5 : 1), 0);
    const top = fit.slice(0, Math.max(1, st));
    const startAvg = top.length ? top.reduce((s, p) => s + p.overall, 0) / top.length : 40;
    const startMin = top.length && top.length >= st ? top[top.length - 1].overall : 40;
    const depthGap = Math.max(0, target - eff);
    // Qualität: schwächster Stammspieler deutlich unter dem Mannschaftsniveau.
    const qualityGap = st > 0 ? Math.max(0, level - 4 - startMin) : 0;
    // Vorausplanen: die Stammkräfte sind alle alt.
    const aging = top.length && top.every((p) => p.age >= 31) ? 6 : 0;
    const score = depthGap * 9 + qualityGap * 2.5 + aging + (st > 0 && fit.length < st ? 20 : 0);
    const keepN = target + 1;
    const surplus = members.length > keepN
      ? [...members].sort((a, b) => (a.overall - a.age * 0.6) - (b.overall - b.age * 0.6)).slice(0, members.length - keepN)
      : [];
    groups[g] = { group: g, count: members.length, target, starters: st, startAvg, startMin, score, quality: qualityGap * 2.5 > depthGap * 9, surplus };
  }
  const order = POS_GROUPS.map((g) => groups[g]).sort((a, b) => b.score - a.score);
  return { level, size: squad.length, groups, order };
}

/** Wunschstärke für einen Zugang in der Gruppe (min = mindestens, ideal = angestrebt). */
export function targetStrength(a: SquadAssessment, need: GroupNeed): { min: number; ideal: number } {
  if (need.quality) return { min: Math.round(Math.max(need.startMin + 3, a.level - 3)), ideal: Math.round(a.level + 3) };
  return { min: Math.round(a.level - 8), ideal: Math.round(a.level - 2) };
}

// -----------------------------------------------------------------------------
// 3) Vorstandsdruck
// -----------------------------------------------------------------------------
/**
 * Erwarteter Tabellenplatz je Verein: Mischung aus Kaderstärke (60 %) und Ruf (40 %).
 * `strength` = Stärke der besten Elf.
 */
export function expectedRanks(clubs: { id: string; strength: number; reputation: number }[]): Record<string, number> {
  const byS = [...clubs].sort((a, b) => b.strength - a.strength).map((c) => c.id);
  const byR = [...clubs].sort((a, b) => b.reputation - a.reputation).map((c) => c.id);
  const blend = clubs.map((c) => ({ id: c.id, v: byS.indexOf(c.id) * 0.6 + byR.indexOf(c.id) * 0.4 })).sort((a, b) => a.v - b.v);
  const out: Record<string, number> = {};
  blend.forEach((x, i) => { out[x.id] = i + 1; });
  return out;
}

/**
 * Zielwert des Drucks aus Tabellenplatz, Erwartung, Form und Abstiegsgefahr.
 * Bekannte Trainer genießen etwas mehr Geduld.
 */
export function pressureTarget(row: LeagueTableRow, size: number, expected: number, coachRep: number): number {
  const diff = ((row.position - expected) / Math.max(1, size)) * 18;
  const f = row.form.length ? row.form.reduce((s, r) => s + (r === 'W' ? 1 : r === 'D' ? 0.4 : 0), 0) / row.form.length : 0.45;
  const formTerm = (0.45 - f) * 40;
  const danger = row.position > size - 3 ? 20 : row.position > size - 5 ? 10 : 0;
  return clamp(30 + diff * 6 + formTerm + danger - (coachRep - 50) * 0.2, 0, 100);
}

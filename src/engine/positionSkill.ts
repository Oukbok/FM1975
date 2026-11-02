// =============================================================================
// Positionsvertrautheit (0–100 je Position) – wie im Football Manager:
//  - Erzeugung: deterministisch aus Spieler-ID, Stammposition, Nebenpositionen und
//    Attributen. Meist eine natürliche, 1–2 gute und einige ausreichende Positionen.
//  - Wachstum: Einsatzminuten auf der Position (Match-Engine, `match/finish.ts`) und
//    Positionstraining (eine Zielposition je Spieler; eigenes Training täglich,
//    KI-Vereine monatlich in `game/positionsGame.ts`). Training allein endet bei 85.
//  - Abbau: nach über einem Jahr ohne Einsatz langsam und zufällig verzögert,
//    nie unter 50 % des Höchstwerts. Stammposition und Trainingsziel bauen nicht ab.
//  - Wirkung: `familiarity` in `positions.ts` (Faktor auf die Positionsstärke) –
//    damit in Match-Engine, Aufstellungs-KI und Aufstellungsseite.
// =============================================================================
import type { Player, Position, PositionSkill } from '../types';
import { ALL_POSITIONS } from '../types';
import { bumpSkillRev, rawSuitability, roleOf, sideOf, type PosRole } from './positions';

export type SkillTier = 'natural' | 'good' | 'ok' | 'none';
export const TIER_MIN = { natural: 90, good: 75, ok: 50 } as const;
export const TIER_DE: Record<SkillTier, string> = { natural: 'Natürlich', good: 'Gut', ok: 'Ausreichend', none: 'Ungeeignet' };
/** Training allein bringt eine Position höchstens auf diesen Wert („gut“); der Rest kommt aus Spielen. */
export const TRAIN_CAP = 85;
/** Ab so vielen Tagen ohne Einsatz kann eine Position abbauen. */
export const IDLE_DAYS = 400;

export function skillTier(v: number): SkillTier {
  return v >= TIER_MIN.natural ? 'natural' : v >= TIER_MIN.good ? 'good' : v >= TIER_MIN.ok ? 'ok' : 'none';
}

/** Tage seit 1970 (UTC) aus einem ISO-Datum. */
export function dayNum(iso: string): number {
  return Math.floor(Date.parse(iso.slice(0, 10) + 'T00:00:00Z') / 86_400_000);
}

const r1 = (x: number) => Math.round(x * 10) / 10;

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Verwandtschaft der Rollen (ohne Seite, 0–1): Wie leicht fällt der Wechsel von A nach B? */
const ROLE_REL: Record<PosRole, Partial<Record<PosRole, number>>> = {
  TW: {},
  LIB: { IV: 0.85, DM: 0.7, AV: 0.45, ZM: 0.4, SM: 0.15, OM: 0.15, FL: 0.1, MS: 0.1, HS: 0.1 },
  IV: { LIB: 0.8, AV: 0.6, DM: 0.6, ZM: 0.3, SM: 0.15, OM: 0.1, FL: 0.1, MS: 0.2, HS: 0.1 },
  AV: { IV: 0.55, LIB: 0.35, DM: 0.4, ZM: 0.35, SM: 0.65, FL: 0.55, OM: 0.2, MS: 0.1, HS: 0.15 },
  DM: { ZM: 0.8, IV: 0.6, LIB: 0.6, AV: 0.4, OM: 0.4, SM: 0.3, FL: 0.15, MS: 0.1, HS: 0.15 },
  ZM: { DM: 0.8, OM: 0.8, AV: 0.3, SM: 0.55, FL: 0.4, HS: 0.4, LIB: 0.3, IV: 0.25, MS: 0.2 },
  SM: { FL: 0.8, AV: 0.6, ZM: 0.6, OM: 0.45, DM: 0.3, HS: 0.35, MS: 0.25, IV: 0.15, LIB: 0.1 },
  OM: { ZM: 0.8, HS: 0.8, FL: 0.5, SM: 0.45, DM: 0.35, MS: 0.45, AV: 0.15, LIB: 0.15, IV: 0.1 },
  FL: { SM: 0.8, AV: 0.5, OM: 0.5, HS: 0.55, MS: 0.45, ZM: 0.35, DM: 0.15, IV: 0.1, LIB: 0.05 },
  MS: { HS: 0.8, FL: 0.45, OM: 0.4, SM: 0.25, ZM: 0.2, DM: 0.1, IV: 0.2, AV: 0.1, LIB: 0.1 },
  HS: { MS: 0.8, OM: 0.8, FL: 0.55, SM: 0.35, ZM: 0.4, DM: 0.15, AV: 0.1, IV: 0.1, LIB: 0.1 },
};

/**
 * Seitenfaktor für den Wechsel von `nat` nach `pos` (Positionen 2.0):
 * gleiche Seite oder zentral 1; zentral → außen auf der Seite des schwachen Fußes 0,82;
 * Seitenwechsel 0,6 – beidfüßig oder mit dem starken Fuß auf der neuen Seite 0,85.
 */
export function sideFactor(foot: Player['preferredFoot'] | undefined, nat: Position, pos: Position): number {
  const sp = sideOf(pos);
  if (sp === 'C') return 1;
  const fs = foot === 'right' ? 'R' : foot === 'left' ? 'L' : null;
  const sn = sideOf(nat);
  if (sn === 'C') return !fs || fs === sp ? 1 : 0.82;
  if (sn === sp) return 1;
  return !fs || fs === sp ? 0.85 : 0.6;
}

/** Verwandtschaft zweier Positionen für einen Spieler (0–1), inkl. Seite und starkem Fuß. */
export function positionRelation(p: Pick<Player, 'preferredFoot'>, nat: Position, pos: Position): number {
  if (nat === pos) return 1;
  const rn = roleOf(nat), rp = roleOf(pos);
  const base = rn === rp ? 1 : (ROLE_REL[rn][rp] ?? 0.1);
  return base * sideFactor(p.preferredFoot, nat, pos);
}

/**
 * Erzeugt die Vertrautheiten eines Spielers (deterministisch aus der ID).
 * Stammposition 100; die beste Verwandte meist „gut“ (75–89), selten sogar natürlich;
 * die zweite gelegentlich gut; zwei, drei weitere ausreichend; der Rest darunter.
 */
export function generatePositionSkill(p: Player, day: number): PositionSkill {
  const nat = p.naturalPosition;
  const h = (k: string) => hash01(`${p.id}|ps|${k}`);
  const v: Partial<Record<Position, number>> = {};
  for (const pos of ALL_POSITIONS) v[pos] = 0;
  v[nat] = 100;
  if (nat === 'TW') {
    // Torhüter: auf dem Feld kaum zu gebrauchen, manche als Libero/Vorstopper notdürftig.
    for (const pos of ALL_POSITIONS) if (pos !== 'TW') v[pos] = Math.round(4 + h(pos) * (pos === 'LIB' || pos === 'IV' ? 26 : 14));
  } else {
    v.TW = Math.round(h('TW') * 7);
    const rawNat = rawSuitability(p, nat);
    const cands = ALL_POSITIONS.filter((pos) => pos !== nat && pos !== 'TW').map((pos) => {
      const fit = rawSuitability(p, pos) - rawNat; // meist negativ; positiv = passt besser
      const score = positionRelation(p, nat, pos) * 100 + Math.max(-20, Math.min(10, fit)) * 1.5 + (h('n' + pos) - 0.5) * 22;
      return { pos, score };
    }).sort((a, b) => b.score - a.score);
    cands.forEach(({ pos, score }, k) => {
      const u = h('t' + pos), w = h('w' + pos);
      let val: number;
      if (k === 0) val = u < 0.06 ? 90 + w * 6 : u < 0.86 ? 76 + w * 13 : 60 + w * 14;
      else if (k === 1) val = u < 0.4 ? 75 + w * 11 : 55 + w * 19;
      else if (k === 2) val = u < 0.07 ? 75 + w * 7 : 50 + w * 20;
      else if (k === 3) val = u < 0.55 ? 50 + w * 12 : 30 + w * 19;
      else val = Math.max(5, Math.min(49, score * 0.45 + (w - 0.5) * 20));
      v[pos] = Math.round(val);
    });
    // Vorhandene Nebenpositionen (z. B. aus Datensätzen) gelten mindestens als „gut“.
    for (const pos of p.secondaryPositions ?? []) if (pos !== nat && (v[pos] ?? 0) < TIER_MIN.good) v[pos] = 78 + Math.round(h('s' + pos) * 10);
  }
  return { v, t0: day };
}

/** Vertrautheiten sicherstellen (idempotent); gibt sie zurück. */
export function ensurePositionSkill(p: Player, today: string): PositionSkill {
  if (!p.positionSkill) {
    p.positionSkill = generatePositionSkill(p, dayNum(today));
    syncSecondary(p);
    bumpSkillRev();
  }
  return p.positionSkill;
}

export const skillOf = (p: Player, pos: Position): number => p.positionSkill?.v[pos] ?? (pos === p.naturalPosition ? 100 : 0);
export const peakOf = (p: Player, pos: Position): number => Math.max(p.positionSkill?.pk?.[pos] ?? 0, skillOf(p, pos));
/** Untergrenze beim Abbau: 50 % des Höchstwerts. */
export const floorOf = (p: Player, pos: Position): number => peakOf(p, pos) * 0.5;

/** Setzt einen Wert und pflegt den Höchstwert (nur gespeichert, wenn er darüber liegt). */
function setSkill(p: Player, pos: Position, nv: number): void {
  const ps = p.positionSkill!;
  const old = ps.v[pos] ?? 0;
  const peak = Math.max(ps.pk?.[pos] ?? 0, old, nv);
  nv = r1(Math.max(0, Math.min(100, nv)));
  if (nv === old) return;
  ps.v[pos] = nv;
  if (peak > nv) (ps.pk ??= {})[pos] = r1(peak);
  else if (ps.pk) { delete ps.pk[pos]; if (!Object.keys(ps.pk).length) delete ps.pk; }
  if (skillTier(old) !== skillTier(nv)) syncSecondary(p);
  // Zwischenspeicher der Positionsstärke nur bei spürbarer Änderung verwerfen (Faktor rechnet ganzzahlig).
  if (Math.round(old) !== Math.round(nv)) bumpSkillRev();
}

/** Nebenpositionen = alle anderen Positionen mit mindestens „gut“, beste zuerst. */
export function syncSecondary(p: Player): void {
  const v = p.positionSkill?.v;
  if (!v) return;
  p.secondaryPositions = ALL_POSITIONS
    .filter((pos) => pos !== p.naturalPosition && (v[pos] ?? 0) >= TIER_MIN.good)
    .sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0));
}

/** Lerntempo nach Alter (junge Spieler stellen sich schneller um). */
export function learnRate(age: number): number {
  return age <= 21 ? 1.3 : age <= 25 ? 1.1 : age <= 29 ? 1.0 : age <= 32 ? 0.8 : 0.6;
}

/** Einsatzminuten auf einer Position verbuchen (Match-Engine). */
export function addPositionMinutes(p: Player, pos: Position, minutes: number, today: string): void {
  if (minutes <= 0) return;
  const ps = ensurePositionSkill(p, today);
  (ps.used ??= {})[pos] = dayNum(today);
  const v = ps.v[pos] ?? 0;
  if (v >= 100) return;
  const gain = 3.2 * ((100 - v) / 100) * Math.min(1.35, minutes / 90) * learnRate(p.age);
  setSkill(p, pos, v + Math.max(0.1, gain));
}

/** Zielposition fürs Training setzen (null = Training beenden). */
export function setTrainingPosition(p: Player, pos: Position | null, today: string): void {
  const ps = ensurePositionSkill(p, today);
  if (!pos || pos === p.naturalPosition) delete ps.train;
  else ps.train = pos;
  bumpSkillRev();
}

/**
 * Positionstraining für `days` Trainingstage: Fortschritt bis höchstens {@link TRAIN_CAP}.
 * Gibt `true` zurück, wenn dabei eine neue Stufe erreicht wurde.
 */
export function trainPositionDays(p: Player, days: number, today: string, quality = 1): boolean {
  const ps = p.positionSkill;
  const t = ps?.train;
  if (!ps || !t || t === p.naturalPosition || days <= 0) return false;
  (ps.used ??= {})[t] = dayNum(today);
  const v = ps.v[t] ?? 0;
  if (v >= TRAIN_CAP) return false;
  let nv = v;
  for (let i = 0; i < days; i++) nv += 0.3 * ((TRAIN_CAP - nv) / 100) * learnRate(p.age) * quality;
  nv = Math.min(TRAIN_CAP, nv);
  const before = skillTier(v);
  setSkill(p, t, nv);
  return skillTier(nv) !== before;
}

/**
 * Monatlicher Abbau: Positionen ohne Einsatz seit über {@link IDLE_DAYS} Tagen verlieren
 * gelegentlich (etwa jeden dritten Monat) 0,5–2 Punkte, langsamer nahe der Untergrenze (50 % des Höchstwerts).
 */
export function decayPositions(p: Player, today: string, rnd: () => number = Math.random): void {
  const ps = p.positionSkill;
  if (!ps) return;
  const day = dayNum(today);
  for (const pos of ALL_POSITIONS) {
    if (pos === p.naturalPosition || pos === ps.train) continue;
    const v = ps.v[pos] ?? 0;
    if (v < 1) continue;
    const idle = day - (ps.used?.[pos] ?? ps.t0);
    if (idle < IDLE_DAYS) continue;
    const floor = floorOf(p, pos);
    if (v <= floor + 0.05) continue;
    if (rnd() >= 0.3) continue;
    const room = (v - floor) / Math.max(1, peakOf(p, pos) - floor);
    const loss = (0.5 + 1.6 * room) * (0.6 + rnd() * 0.8);
    setSkill(p, pos, Math.max(floor, v - loss));
  }
}

/** Beste Position nach Positionsstärke (inkl. Vertrautheit). */
export function rankedPositions(p: Player, suit: (p: Player, pos: Position) => number): { pos: Position; value: number; skill: number }[] {
  return ALL_POSITIONS.map((pos) => ({ pos, value: suit(p, pos), skill: skillOf(p, pos) })).sort((a, b) => b.value - a.value);
}

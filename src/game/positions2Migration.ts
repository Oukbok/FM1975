// =============================================================================
// Positionen 2.0 – Umrechnung alter Spielstände (seitengenaue Positionen).
// Alte Kürzel: VS (Vorstopper) → IV, AV (Außenverteidiger) → RV/LV, FL (Flügel) → RA/LA.
// Die Seite folgt dem starken Fuß; beidfüßig → bisherige Slot-Seite in der Aufstellung,
// sonst deterministisch aus der Spieler-ID. Neue Positionen (Gegenseite, RM/LM) erhalten
// eine aus der Verwandtschaft abgeleitete Vertrautheit (`positionRelation`).
// Idempotent: Ohne alte Kürzel ändert sich nichts. Aufruf früh in `App.tsx` (vor allem,
// was Positionen bewertet).
// =============================================================================
import type { Player, Position, Tactics } from '../types';
import { ALL_POSITIONS } from '../types';
import type { Game } from './state';
import { getFormation } from '../data/formations';
import {
  bumpSkillRev, sideAtX, sideForFoot, withSide, type PitchSide,
} from '../engine/positions';
import { dayNum, positionRelation, syncSecondary } from '../engine/positionSkill';

const LEGACY = new Set(['VS', 'AV', 'FL']);
const isLegacy = (c: unknown): boolean => typeof c === 'string' && LEGACY.has(c);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Altes Kürzel auf eine Seite abbilden (Rest unverändert). */
function mapCode(code: string, side: 'R' | 'L'): Position {
  if (code === 'VS') return 'IV';
  if (code === 'AV') return withSide('AV', side);
  if (code === 'FL') return withSide('FL', side);
  return code as Position;
}

/** Position eines frei gesetzten/eingerasteten Slots: Seite aus x, Flügel unter y 44 = Außen-Stürmer. */
function mapSlotCode(code: string, x: number, y: number): Position {
  const s: 'R' | 'L' = x < 50 ? 'L' : 'R';
  if (code === 'VS') return 'IV';
  if (code === 'AV') return withSide('AV', s);
  if (code === 'FL') return y >= 44 ? withSide('SM', s) : withSide('FL', s);
  return code as Position;
}

function playerNeeds(p: Player): boolean {
  if (isLegacy(p.naturalPosition) || p.secondaryPositions?.some(isLegacy)) return true;
  if (Object.keys(p.positionRatings ?? {}).some(isLegacy)) return true;
  const ps = p.positionSkill;
  return !!ps && (Object.keys(ps.v).some(isLegacy) || isLegacy(ps.train));
}

/** Schlüssel einer Positions-Tabelle umrechnen; bei Doppelbelegung gilt der höhere Wert. */
function mapRecord(rec: Record<string, number> | undefined, side: 'R' | 'L'): Partial<Record<Position, number>> | undefined {
  if (!rec) return rec;
  const out: Partial<Record<Position, number>> = {};
  for (const [k, v] of Object.entries(rec)) {
    const n = mapCode(k, side);
    out[n] = Math.max(out[n] ?? -Infinity, v);
  }
  return out;
}

/** Einen Spieler umrechnen (gibt true zurück, wenn etwas geändert wurde). */
export function migratePlayerPositions(p: Player, today: string, hint?: PitchSide): boolean {
  if (!playerNeeds(p)) return false;
  const side = sideForFoot(p.preferredFoot, p.id, hint);
  p.naturalPosition = mapCode(p.naturalPosition, side);
  p.positionRatings = (mapRecord(p.positionRatings as Record<string, number>, side) ?? {}) as Player['positionRatings'];
  const ps = p.positionSkill;
  if (ps) {
    const old = ps.v as Record<string, number>;
    const v = mapRecord(old, side)!;
    if (ps.pk) ps.pk = mapRecord(ps.pk as Record<string, number>, side);
    if (ps.used) ps.used = mapRecord(ps.used as Record<string, number>, side);
    if (ps.train) ps.train = mapCode(ps.train, side);
    // Neue Positionen (Gegenseite, RM/LM) aus der Verwandtschaft ableiten.
    const known = new Set(Object.keys(v) as Position[]);
    const fresh: Position[] = ALL_POSITIONS.filter((pos) => !known.has(pos));
    const day = dayNum(today);
    for (const dst of fresh) {
      let best = 0;
      for (const src of known) {
        if (src === 'TW' || dst === 'TW') continue;
        best = Math.max(best, (v[src] ?? 0) * positionRelation(p, src, dst));
      }
      v[dst] = r1(Math.min(99, best));
      // Abgeleitete Werte sollen nicht sofort abbauen.
      if (v[dst]! > 0) (ps.used ??= {})[dst] = day;
    }
    v[p.naturalPosition] = Math.max(v[p.naturalPosition] ?? 0, 100);
    ps.v = v;
    syncSecondary(p);
  } else {
    p.secondaryPositions = Array.from(new Set((p.secondaryPositions ?? []).map((c) => mapCode(c, side))))
      .filter((pos) => pos !== p.naturalPosition);
  }
  return true;
}

/** Aufstellung/Taktik umrechnen; liefert Slot-Seiten je Spieler (Hinweis für Beidfüßige). */
function migrateTactics(t: Tactics | undefined, players: Record<string, Player>, hints: Map<string, PitchSide>): void {
  if (!t) return;
  const f = getFormation(t.formation);
  const coords = new Map(f.slots.map((s) => [s.id, { x: s.x, y: s.y }]));
  if (t.slotLayout) {
    for (const [sid, o] of Object.entries(t.slotLayout)) {
      if (isLegacy(o.position)) o.position = mapSlotCode(o.position, o.x, o.y);
      coords.set(sid, { x: o.x, y: o.y });
    }
  }
  const slotOf = new Map<string, string>();
  for (const [sid, pid] of Object.entries(t.lineupMap ?? {})) {
    slotOf.set(pid, sid);
    const c = coords.get(sid);
    if (c) hints.set(pid, sideAtX(c.x));
  }
  const ap = t.assignedPositions;
  if (!ap) return;
  for (const [pid, pos] of Object.entries(ap)) {
    if (!isLegacy(pos)) continue;
    const sid = slotOf.get(pid);
    const fs = sid ? (t.slotLayout?.[sid]?.position ?? f.slots.find((s) => s.id === sid)?.position) : undefined;
    if (fs && !isLegacy(fs)) { ap[pid] = fs; continue; }
    const c = sid ? coords.get(sid) : undefined;
    if (c) { ap[pid] = mapSlotCode(pos, c.x, c.y); continue; }
    const p = players[pid];
    ap[pid] = mapCode(pos, sideForFoot(p?.preferredFoot, pid));
  }
}

/** Gespeicherte Anzeige-Kürzel (Archiv, Ex-Profis, Europapokal-Namen) umrechnen. */
function mapLabel(code: string, key: string): string {
  return isLegacy(code) ? mapCode(code, sideForFoot(undefined, key)) : code;
}

/**
 * Positionen 2.0 für einen Spielstand (idempotent). Gibt die Zahl umgerechneter Spieler zurück.
 */
export function migratePositions2(g: Game): number {
  const today = g.calendar.currentDate;
  const hints = new Map<string, PitchSide>();
  for (const c of Object.values(g.clubs)) migrateTactics(c.tactics, g.players, hints);
  let n = 0;
  for (const p of Object.values(g.players)) if (migratePlayerPositions(p, today, hints.get(p.id))) n++;
  for (const p of Object.values(g.youthPlayers ?? {})) if (migratePlayerPositions(p, today, hints.get(p.id))) n++;
  for (const a of g.archive ?? []) if (isLegacy(a.pos)) a.pos = mapLabel(a.pos, a.id);
  for (const m of [...(g.staff ?? []), ...(g.staffWorld?.people ?? [])]) {
    if (m.exPro && isLegacy(m.exPro.pos)) m.exPro.pos = mapLabel(m.exPro.pos, m.id);
  }
  const cups = g.euroCups ? [g.euroCups.ec, g.euroCups.cwc, g.euroCups.uefa] : [];
  for (const cup of [g.cup, ...cups]) {
    for (const [id, x] of Object.entries(cup?.xpeople ?? {})) if (isLegacy(x[2])) x[2] = mapLabel(x[2], id);
  }
  if (n) bumpSkillRev();
  return n;
}

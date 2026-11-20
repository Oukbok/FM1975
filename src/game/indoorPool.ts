// =============================================================================
// HALLENFUSSBALL – Teilnehmer-Pool: Vereine der beiden oberen Ligen, Amateure,
// Auslandsgäste (nur aus Ländern mit Winterpause, data/indoorHistory.ts `GUEST_COUNTRIES`),
// Teilnahmebereitschaft und Kaderwahl der KI. Genutzt von game/indoorGame.ts
// (deutsche Turniere) und game/indoorAbroad.ts (Turniere im Ausland).
// =============================================================================
import { ddrBorderClosed } from './ddrHome';
import { playerLevel, homeCountryKey, Game } from './state';
import { GUEST_COUNTRIES, topClubEnthusiasm } from '../data/indoorHistory';
import type { IndoorSquad } from '../engine/indoor';
import type { IndoorKind } from './winterShared';

type Rng = () => number;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface PoolClub {
  id: string; tier: number; rep: number; city: string; kind: 'league' | 'amateur' | 'foreign'; strength: number;
  /** Land (Weltdaten-Schlüssel) bei Auslandsvereinen. */
  country?: string;
}

export function avgTop(g: Game, ids: string[]): number {
  const ovr = ids.map((id) => g.players[id]?.overall ?? 0).filter((v) => v > 0).sort((a, b) => b - a).slice(0, 8);
  return ovr.length ? ovr.reduce((a, b) => a + b, 0) / ovr.length : 55;
}

/** Vereine des Heimatlandes (1./2. Liga) mit Stärke und Ruf. */
export function homeLeagueClubs(g: Game): PoolClub[] {
  const out: PoolClub[] = [];
  const seen = new Set<string>();
  const add = (id: string, tier: number) => {
    if (seen.has(id) || tier > 2) return;
    seen.add(id);
    const c = g.clubs[id];
    const s = g.simClubs[id];
    if (!c && !s) return;
    const strength = c ? avgTop(g, c.playerIds) : (s!.strength + 3);
    out.push({ id, tier, rep: c?.reputation ?? clamp(s!.strength, 30, 90), city: c?.city ?? s!.city, kind: 'league', strength });
  };
  const ptier = playerLevel(g);
  // DDR-Start (game/ddrHome.ts): vor dem Mauerfall keine Einladungen zu Hallenturnieren im Westen.
  if (!ddrBorderClosed(g, g.calendar.currentDate)) for (const r of g.table.rows) add(r.clubId, ptier);
  for (const d of g.leagues?.otherDivisions ?? []) if (d.tier <= 2) for (const id of d.clubIds) add(id, d.tier);
  return out;
}

/** Erstligisten eines Landes der Hintergrund-Welt (Auslandsverein, Stärke aus den Weltdaten). */
export function worldTopClubs(g: Game, country: string): PoolClub[] {
  const c = g.world?.countries[country];
  if (!c || c.active === false) return [];
  const out: PoolClub[] = [];
  for (const id of c.tiers[0] ?? []) {
    const e = g.euroClubs?.[id];
    if (e) out.push({ id, tier: 1, rep: clamp(e.strength, 30, 90), city: e.city, kind: 'foreign', strength: e.strength, country });
  }
  return out.sort((a, b) => b.strength - a.strength);
}

/** Erstligisten eines Landes: Heimatland aus den vollen Ligen, sonst aus der Hintergrund-Welt. */
export function countryTopClubs(g: Game, country: string): PoolClub[] {
  if (country === homeCountryKey(g)) return homeLeagueClubs(g).filter((p) => p.tier === 1).sort((a, b) => b.strength - a.strength);
  return worldTopClubs(g, country);
}

/** Auslandsgäste deutscher Hallenturniere: obere Hälfte der 1. Liga aus den Gastländern. */
export function guestPool(g: Game): PoolClub[] {
  const out: PoolClub[] = [];
  for (const key of Object.keys(GUEST_COUNTRIES)) {
    const top = worldTopClubs(g, key);
    out.push(...top.slice(0, Math.max(3, Math.ceil(top.length / 2))));
  }
  return out;
}

/** Teilnehmer-Pool der deutschen Hallenturniere. */
export function buildPool(g: Game): PoolClub[] {
  const out = homeLeagueClubs(g);
  const seen = new Set(out.map((p) => p.id));
  const ddrClosed = ddrBorderClosed(g, g.calendar.currentDate);
  for (const c of Object.values(g.clubs)) {
    if (!ddrClosed && c.id.startsWith('am') && !seen.has(c.id)) { seen.add(c.id); out.push({ id: c.id, tier: 4, rep: c.reputation, city: c.city, kind: 'amateur', strength: avgTop(g, c.playerIds) - 4 }); }
  }
  for (const p of guestPool(g)) if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
  return out;
}

/** Teilnahmebereitschaft eines KI-Vereins (Größe, Epoche, Trainerphilosophie). */
export function willingness(g: Game, p: PoolClub, winterYear: number, kind: IndoorKind): number {
  if (p.kind === 'amateur') return kind === 'regional' ? 0.8 : 0.15;
  if (p.kind === 'foreign') return (GUEST_COUNTRIES[p.country ?? ''] ?? 1) * (0.5 + p.strength / 100);
  let w: number;
  if (kind === 'regional') w = p.tier === 1 ? (p.rep >= 78 ? 0.05 : 0.25) : 1;
  else if (kind === 'invite' || kind === 'abroad') w = p.tier === 1 ? 1 : 0.3;
  else w = p.tier === 1 ? 0.95 : 0.8;
  if (p.tier === 1 && p.rep >= 80 && kind !== 'regional') w *= topClubEnthusiasm(winterYear);
  const coach = g.clubs[p.id]?.coach;
  if (coach?.style === 'offensiv') w *= 1.15;
  if (coach?.style === 'defensiv') w *= 0.9;
  if (coach?.philosophy === 'jugend') w *= 1.15;
  return w;
}

/** Kaderwahl eines KI-Vereins: Spitzenvereine schonen ab Mitte der 90er ihre Stars [S1]. */
export function aiSquad(g: Game, id: string, winterYear: number, rng: Rng): IndoorSquad {
  const c = g.clubs[id];
  const rep = c?.reputation ?? 60;
  if (c?.coach?.philosophy === 'jugend' && rng() < 0.6) return 'youth';
  const enth = topClubEnthusiasm(winterYear);
  if (rep >= 78) return rng() < enth ? 'stars' : rng() < 0.5 ? 'mix' : 'youth';
  return rng() < 0.55 + enth * 0.3 ? 'stars' : 'mix';
}

export function weightedPick<T>(items: T[], weight: (t: T) => number, n: number, rng: Rng): T[] {
  const pool = items.map((t) => ({ t, w: Math.max(0, weight(t)) })).filter((x) => x.w > 0);
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool[i].t);
    pool.splice(i, 1);
  }
  return out;
}

export function maxPerClub(phaseKind: IndoorKind, winterYear: number): number {
  if (phaseKind === 'invite') return 2;
  if (phaseKind === 'regional') return 1;
  return winterYear >= 1998 ? 2 : 4;
}

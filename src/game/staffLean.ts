// =============================================================================
// SCHLANKE STÄBE — Sim-Vereine ohne Kader (2. Ebene, DDR-Oberliga) und die
// Spitzenvereine im Ausland (Wunsch Pascal: „Bei ausländischen Vereinen muss das
// nicht in der Tiefe simuliert werden, sie sollen aber auch Trainer anstellen und
// sie somit aus dem Pool nehmen.“)
// -----------------------------------------------------------------------------
// Nur wenige Schlüsselstellen je Verein (`leanSlots`): Auslandsvereine einen
// Cheftrainer aus dem Trainerpool und je nach Größe Co-/Torwarttrainer, Sim-Vereine
// einen Co-Trainer (große auch einen Torwarttrainer). Nicht jede Stelle geht an
// jemanden aus dem Pool – meist stellen diese Vereine Leute ein, die das Spiel
// nicht kennt (`LEAN_TAKE`). Keine Wirkung auf Spielstärke oder Entwicklung; die
// Personen sind dort angestellt zu sehen und lassen sich abwerben.
// =============================================================================
import { ClubCoach } from '../types';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { isLeagueClub } from '../engine/clubEconomy';
import { yearOf } from '../engine/economy';
import type { StaffMember } from '../engine/staffPeople';
import { demandFactor, roleFit, specialtyOfSkills, syncQuality } from '../engine/staffSkills';
import { coachAsStaff } from '../engine/staffGen';
import { freeUp, hireInto, StaffWorld, toClubCoach } from './staffWorld';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** So viele Auslandsvereine (die stärksten der 1. Ligen) stellen Leute aus dem Pool ein. */
export const FOREIGN_MAX = 40;
/** Chance je Saison, dass eine freie Stelle mit jemandem aus dem Pool besetzt wird. */
const LEAN_TAKE = { foreign: 0.3, sim: 0.45, coach: 0.25 };

export interface LeanClub { id: string; name: string; short: string; rep: number; kind: 'sim' | 'foreign'; country?: string }

/** Schlanke Vereine: Sim-Vereine der 2. Ebene/DDR-Oberliga ohne vollen Kader und die stärksten Auslandsvereine. */
export function leanClubs(g: Game): LeanClub[] {
  const out: LeanClub[] = [];
  for (const s of Object.values(g.simClubs ?? {})) {
    if (g.clubs[s.id] || !(s.tier === 2 || s.tier === 101)) continue;
    out.push({ id: s.id, name: s.name, short: s.shortName, rep: clamp(s.strength + 4, 40, 90), kind: 'sim' });
  }
  const foreign: LeanClub[] = [];
  for (const c of Object.values(g.world?.countries ?? {})) {
    if (c.active === false) continue;
    for (const id of c.tiers[0] ?? []) {
      const e = g.euroClubs?.[id];
      if (e) foreign.push({ id, name: e.name, short: e.shortName, rep: clamp(e.strength + 8, 40, 95), kind: 'foreign', country: c.name });
    }
  }
  foreign.sort((a, b) => b.rep - a.rep || (a.id < b.id ? -1 : 1));
  return out.concat(foreign.slice(0, FOREIGN_MAX));
}

/** Stellen eines schlanken Vereins (nach Größe). */
export function leanSlots(c: LeanClub, year: number): string[] {
  const has = (r: string) => !!STAFF_BY_ID[r] && staffAvailable(STAFF_BY_ID[r], year);
  const s = c.kind === 'foreign'
    ? (c.rep >= 85 ? ['cheftrainer', 'cotrainer', 'torwarttrainer'] : c.rep >= 80 ? ['cheftrainer', 'cotrainer'] : ['cheftrainer'])
    : (c.rep >= 70 ? ['cotrainer', 'torwarttrainer'] : ['cotrainer']);
  return s.filter(has);
}

/** Name eines Vereins für Anzeigen (voll, Sim, Ausland). */
export function anyClubName(g: Game, id: string, short = false): string {
  const c = g.clubs[id];
  if (c) return short ? c.shortName : c.name;
  const s = g.simClubs?.[id];
  if (s) return short ? s.shortName : s.name;
  const e = g.euroClubs?.[id];
  return e ? (short ? e.shortName : e.name) : id;
}

/** Ruf eines Vereins (voll = Ruf, Sim/Ausland geschätzt aus der Stärke). */
export function anyClubRep(g: Game, id: string): number {
  const c = g.clubs[id];
  if (c) return c.reputation ?? 60;
  const s = g.simClubs?.[id];
  if (s) return clamp(s.strength + 4, 40, 90);
  const e = g.euroClubs?.[id];
  return e ? clamp(e.strength + 8, 40, 95) : 55;
}

/** Ist der Verein im Ausland? */
export const isAbroad = (g: Game, id: string): boolean => !g.clubs[id] && !g.simClubs?.[id] && !!g.euroClubs?.[id] || (!!g.clubs[id] && !isLeagueClub(g.clubs[id]));

/** Person verlässt eine Stelle im Ausland bzw. bei einem Sim-Verein; Cheftrainer gehen in den Trainerpool. */
function release(g: Game, w: StaffWorld, m: StaffMember, date: string, rng: () => number, gone: Set<StaffMember>): void {
  freeUp(m, yearOf(date));
  if (m.roleId === 'cheftrainer' && m.coach) { (g.coachPool ??= []).push(toClubCoach(m, yearOf(date), date, rng)); gone.add(m); }
  void w;
}

function pickCoach(g: Game, rep: number, rng: () => number): ClubCoach | null {
  const pool = g.coachPool ?? [];
  let best: ClubCoach | null = null, bs = -99;
  for (const c of pool) {
    if (c.age >= 66 || c.reputation < rep - 14) continue;
    const s = c.reputation - Math.abs(c.reputation - rep) * 0.3 + rng() * 10;
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}

/**
 * Saisonwechsel (und einmalig beim Anlegen): Stellen der schlanken Vereine prüfen –
 * wer dort nicht mehr hingehört (Verein abgestiegen, Stelle zu viel), wird frei; freie
 * Stellen gehen mit einer Chance an jemanden aus dem Pool.
 */
export function leanSeason(g: Game, w: StaffWorld, date: string, rng: () => number, initial = false): void {
  const year = yearOf(date);
  const lean = new Map(leanClubs(g).map((c) => [c.id, c]));
  const held = new Map<string, Set<string>>();
  const gone = new Set<StaffMember>();
  for (const m of w.people) {
    if (!m.clubId) {
      // Frühere Auslandstrainer ohne Stelle gehören in den Trainerpool.
      if (m.roleId === 'cheftrainer' && m.coach) { (g.coachPool ??= []).push(toClubCoach(m, year, date, rng)); gone.add(m); }
      continue;
    }
    const full = g.clubs[m.clubId];
    if (full && isLeagueClub(full)) continue;
    const c = lean.get(m.clubId);
    const roles = held.get(m.clubId) ?? new Set<string>();
    if (!c || !leanSlots(c, year).includes(m.roleId) || roles.has(m.roleId)) { release(g, w, m, date, rng, gone); continue; }
    roles.add(m.roleId);
    held.set(m.clubId, roles);
  }
  if (gone.size) w.people = w.people.filter((m) => !gone.has(m));
  for (const c of lean.values()) {
    const roles = held.get(c.id) ?? new Set<string>();
    for (const role of leanSlots(c, year)) {
      if (roles.has(role)) continue;
      const p = role === 'cheftrainer' ? LEAN_TAKE.coach : LEAN_TAKE[c.kind];
      if (rng() >= p * (initial ? 1.4 : 1)) continue;
      if (role === 'cheftrainer') {
        const cc = pickCoach(g, c.rep, rng);
        if (!cc) continue;
        g.coachPool = (g.coachPool ?? []).filter((x) => x !== cc);
        const m: StaffMember = { ...coachAsStaff(cc, year) };
        m.salaryFactor = demandFactor(m, c.rep);
        hireInto(m, c.id, date, 2 + Math.floor(rng() * 2));
        w.people.push(m);
        w.cur.hires++;
        continue;
      }
      const target = clamp(3 + c.rep * 0.13, 5, 17);
      let best: StaffMember | null = null, bs = -99;
      for (const m of w.people) {
        if (m.clubId || m.age >= 62 || m.home === g.managedClubId) continue;
        const fit = roleFit(m.skills, role, 1);
        if (fit < target - 3) continue;
        const s = fit - Math.max(0, fit - target - 2) + rng() * 3;
        if (s > bs) { bs = s; best = m; }
      }
      if (!best) continue;
      best.roleId = role;
      syncQuality(best);
      if (best.skills) best.specialty = specialtyOfSkills(best.skills, role);
      hireInto(best, c.id, date, 1 + Math.floor(rng() * 3));
      best.salaryFactor = demandFactor(best, c.rep);
      w.cur.hires++;
    }
  }
}

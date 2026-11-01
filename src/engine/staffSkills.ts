// =============================================================================
// TRAINERTEAM — Fachgebiete der Mitarbeiter (Rechenlogik ohne Spielablauf)
// -----------------------------------------------------------------------------
// Jede Person aus Mitarbeiter 2.0 (engine/staffPeople.ts) hat acht Fachgebiete
// (1–20). Die bisherige „Qualität“ einer Person ist der nach Rolle gewichtete
// Wert ihrer Fachgebiete (ein Torwarttrainer zählt nur mit seinem Torwartwissen).
//   • skills = heutiger Stand, pot = erreichbarer Höchststand (Lernen im Beruf).
//   • Ehemalige Profis bringen ihr Spielverständnis mit: Spielintelligenz →
//     Taktik, Technik → Technik, Athletik → Fitness, Torhüter → Torwarttraining.
//     Erfolgreiche Karrieren (Titel, Einsätze, Spitzenstärke, Kapitän) heben
//     das Trainer-Potenzial – ohne Garantie.
//   • Quereinsteiger (Sportlehrer, Sportwissenschaftler, Analysten) haben andere
//     Profile: stark in Fitness/Medizin/Analyse, schwächer in Taktik.
// Spielablauf (Pool, KI-Einstellungen, Lernen, Ruhestand): game/staffWorld.ts.
// =============================================================================
import { makeName, pickOrigin } from '../data/origins';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { AttributeKey, Player } from '../types';
import type { CoachSpecialty, StaffMember } from './staffPeople';

export type CoachSkill = 'taktik' | 'technik' | 'fitness' | 'torwart' | 'mental' | 'jugend' | 'analyse' | 'medizin';
export const COACH_SKILLS: CoachSkill[] = ['taktik', 'technik', 'fitness', 'torwart', 'mental', 'jugend', 'analyse', 'medizin'];
export const SKILL_LABEL: Record<CoachSkill, string> = {
  taktik: 'Taktik', technik: 'Technik', fitness: 'Fitness', torwart: 'Torwart',
  mental: 'Mentales', jugend: 'Nachwuchs', analyse: 'Analyse', medizin: 'Medizin & Reha',
};

/** Ehemaliger Profi: Eckdaten der Spielerkarriere. */
export interface ExProInfo {
  pos: string;
  peak: number;
  apps: number;
  titles: number;
  captain?: boolean;
  /** Erfolg der Karriere 0–1 (Titel, Einsätze, Spitzenstärke, Kapitän). */
  s: number;
  /** Letzte Vereine (Namen). */
  clubs: string[];
}

// -----------------------------------------------------------------------------
// Rollen des Trainerteams (Seite Training › Trainerteam)
// -----------------------------------------------------------------------------
/** Gewicht der Fachgebiete je Rolle (Summe 1). */
export const ROLE_SKILLS: Record<string, Partial<Record<CoachSkill, number>>> = {
  cheftrainer: { taktik: 0.4, mental: 0.3, technik: 0.2, fitness: 0.1 },
  cotrainer: { taktik: 0.5, technik: 0.3, mental: 0.2 },
  torwarttrainer: { torwart: 1 },
  konditionstrainer: { fitness: 0.8, medizin: 0.2 },
  athletiktrainer: { fitness: 0.7, medizin: 0.3 },
  reha_trainer: { medizin: 0.7, fitness: 0.3 },
  videoanalyst: { analyse: 0.8, taktik: 0.2 },
  spielanalyst: { analyse: 0.7, taktik: 0.3 },
  jugendtrainer: { jugend: 0.6, technik: 0.2, taktik: 0.2 },
  sportpsychologe: { mental: 1 },
  fussballpsychologe: { mental: 1 },
};

/** Rollen der Seite „Trainerteam“ in Anzeigereihenfolge mit Kurzname. */
export const TEAM_ROLES: { id: string; label: string; what: string }[] = [
  { id: 'cheftrainer', label: 'Cheftrainer', what: 'Deine rechte Hand im Trainingsalltag.' },
  { id: 'cotrainer', label: 'Co-Trainer', what: 'Taktik- und Technikeinheiten, Spielvorbereitung.' },
  { id: 'torwarttrainer', label: 'Torwarttrainer', what: 'Wirkt auf das Torwarttraining und die Torhüter.' },
  { id: 'konditionstrainer', label: 'Fitnesstrainer', what: 'Ausdauer, Schnelligkeit, Kraft – und Belastungssteuerung.' },
  { id: 'athletiktrainer', label: 'Athletiktrainer', what: 'Athletik und Stabilisation, weniger Verletzungen.' },
  { id: 'reha_trainer', label: 'Reha-Trainer', what: 'Bringt Verletzte schneller zurück.' },
  { id: 'videoanalyst', label: 'Videoanalyst', what: 'Macht Videoanalyse erst richtig wirksam.' },
  { id: 'spielanalyst', label: 'Spielanalyst', what: 'Systematische Analyse von Spiel und Gegner.' },
  { id: 'sportpsychologe', label: 'Sportpsychologe', what: 'Mentaltraining und Nervenstärke.' },
  { id: 'fussballpsychologe', label: 'Fußballpsychologe', what: 'Moderne Sportpsychologie im Profibereich.' },
  { id: 'jugendtrainer', label: 'Jugendtrainer', what: 'Betreut den Nachwuchs.' },
];
export const TEAM_ROLE_IDS = new Set(TEAM_ROLES.map((r) => r.id));
export const TEAM_ROLE_LABEL: Record<string, string> = Object.fromEntries(TEAM_ROLES.map((r) => [r.id, r.label]));

/** Rollen, die auch die KI-Vereine besetzen (Arbeitsmarkt über die Jahrzehnte). */
export const AI_TRACKED_ROLES = ['cotrainer', 'torwarttrainer', 'konditionstrainer', 'videoanalyst', 'athletiktrainer'];

export function teamRolesAvailable(year: number): string[] {
  return TEAM_ROLES.map((r) => r.id).filter((id) => STAFF_BY_ID[id] && staffAvailable(STAFF_BY_ID[id], year));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Qualität einer Person in einer Rolle (1–20) aus ihren Fachgebieten. */
export function roleQuality(skills: Partial<Record<CoachSkill, number>> | undefined, roleId: string, fallback = 8): number {
  const w = ROLE_SKILLS[roleId];
  if (!skills || !w) return fallback;
  let q = 0, sum = 0;
  for (const [k, v] of Object.entries(w) as [CoachSkill, number][]) { q += (skills[k] ?? 1) * v; sum += v; }
  return clamp(Math.round(q / Math.max(0.01, sum)), 1, 20);
}

/** Qualität aus den Fachgebieten neu setzen (nach Lernen/Altern). */
export function syncQuality(m: StaffMember): void {
  if (m.skills) m.quality = roleQuality(m.skills, m.roleId, m.quality);
}

/** Fachgebiet → Spezialgebiet aus Mitarbeiter 2.0 (wirkt in specialistBoost). */
export function specialtyOfSkills(skills: Partial<Record<CoachSkill, number>>, roleId: string): CoachSpecialty {
  if (roleId === 'torwarttrainer') return 'torwart';
  if (roleId === 'jugendtrainer') return 'jugend';
  if (roleId === 'sportpsychologe' || roleId === 'fussballpsychologe') return 'mental';
  if (roleId === 'konditionstrainer' || roleId === 'athletiktrainer' || roleId === 'reha_trainer') return 'athletik';
  const t = skills.taktik ?? 0, te = skills.technik ?? 0, f = skills.fitness ?? 0, me = skills.mental ?? 0;
  const top = Math.max(t, te, f, me);
  if (top - Math.min(t, te) < 2) return 'allround';
  return top === t ? 'taktik' : top === te ? 'technik' : top === f ? 'athletik' : 'mental';
}

// -----------------------------------------------------------------------------
// Ehemalige Spieler
// -----------------------------------------------------------------------------
const avgAttr = (p: Player, keys: AttributeKey[]) => keys.reduce((s, k) => s + ((p.attributes[k] as number) ?? 50), 0) / keys.length;

/** Erfolg einer Spielerkarriere 0–1. `titles` = Titel, an denen er mitgewirkt hat. */
export function careerSuccess(peak: number, apps: number, titles: number, captain: boolean, leadership: number): number {
  const s = clamp((peak - 62) / 30, 0, 1) * 0.35
    + Math.min(1, apps / 420) * 0.25
    + Math.min(1, titles / 4) * 0.25
    + (captain ? 0.1 : 0)
    + clamp((leadership - 50) / 50, 0, 1) * 0.05;
  return clamp(r1(s * 100) / 100, 0, 1);
}

/** Wahrscheinlichkeit, nach dem Karriereende ins Trainergeschäft zu gehen. */
export function coachingChance(s: number, leadership: number, age: number): number {
  if (age > 39) return 0;
  return clamp(0.15 + 0.45 * s + (leadership >= 70 ? 0.05 : 0), 0, 0.65);
}

/** Affinität eines Ex-Profis je Fachgebiet (0,35–1,15) aus Spielerattributen und Persönlichkeit. */
export function playerAffinity(p: Player, loyal = 50, family = 50, ambition = 50): Record<CoachSkill, number> {
  const f = (a: number) => clamp(0.35 + (a - 40) / 60 * 0.8, 0.35, 1.15);
  const gk = p.naturalPosition === 'TW';
  return {
    taktik: f(avgAttr(p, ['decisions', 'positioning', 'vision', 'teamwork'])),
    technik: f(gk ? 45 : avgAttr(p, ['technique', 'passing', 'ballControl', 'firstTouch'])),
    fitness: f(avgAttr(p, ['stamina', 'workRate', 'strength', 'acceleration']) - 6),
    torwart: gk ? f(avgAttr(p, ['reflexes', 'handling', 'oneOnOnes', 'aerialReach']) + 8) : 0.25,
    mental: f(avgAttr(p, ['composure', 'leadership', 'concentration'])),
    jugend: f(45 + (loyal + family) / 5 - ambition / 10),
    analyse: f(avgAttr(p, ['decisions', 'vision']) - 18),
    medizin: 0.3,
  };
}

/**
 * Trainer-Potenzial (Decke 1–20) eines Ex-Profis: Erfolg und Spielintelligenz
 * heben es, der Rest ist Begabung (Zufall). Ausreißer nach oben und unten bleiben möglich.
 */
export function exProCeiling(s: number, p: Player, rng: () => number): number {
  const brain = (avgAttr(p, ['decisions', 'vision', 'leadership', 'concentration']) - 60) / 12;
  const talent = (rng() + rng() + rng() - 1.5) * 4.2;
  return clamp(r1(8.4 + s * 7 + brain + talent), 4, 20);
}

/** Rolle, in der eine Person am meisten taugt (unter den im Jahr verfügbaren Rollen). */
export function bestRole(skills: Partial<Record<CoachSkill, number>>, year: number, roles = AI_TRACKED_ROLES.concat(['jugendtrainer', 'sportpsychologe'])): string {
  let best = 'cotrainer', bq = -1;
  for (const id of roles) {
    const r = STAFF_BY_ID[id];
    if (!r || !staffAvailable(r, year)) continue;
    // Leichte Vorliebe für die Co-Trainer-Laufbahn (die meisten Ex-Profis starten dort).
    const q = roleQuality(skills, id, 0) + (id === 'cotrainer' ? 0.6 : 0);
    if (q > bq) { bq = q; best = id; }
  }
  return best;
}

// -----------------------------------------------------------------------------
// Personen erzeugen
// -----------------------------------------------------------------------------
let seq = 0;
const newId = (year: number, r: () => number) => `sp_${year}_${(seq++ % 1000).toString(36)}${Math.floor(r() * 1e8).toString(36)}`;

function personBase(id: string, roleId: string, name: string, age: number, year: number, pot: Record<CoachSkill, number>, startFrac: number, r: () => number): StaffMember {
  const skills = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) skills[k] = clamp(r1(pot[k] * (startFrac + (r() - 0.5) * 0.1)), 1, 20);
  const m: StaffMember = {
    id, roleId, name, age, quality: 1, specialty: 'allround', methodYear: year,
    loyalty: 30 + Math.floor(r() * 50), salaryFactor: 1, hired: '', skills, pot,
  };
  syncQuality(m);
  m.specialty = specialtyOfSkills(skills, roleId);
  m.salaryFactor = demandFactor(m);
  return m;
}

/** Neuer Trainer aus einem Spieler, der seine Karriere beendet. */
export function staffFromPlayer(p: Player, info: ExProInfo, year: number, persona: { loyal: number; family: number; ambition: number } | null, r: () => number): StaffMember {
  const aff = playerAffinity(p, persona?.loyal, persona?.family, persona?.ambition);
  const ceil = exProCeiling(info.s, p, r);
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) pot[k] = clamp(r1(ceil * aff[k]), 1, 20);
  const role = bestRole(pot, year);
  const m = personBase(newId(year, r), role, p.fullName, p.age, year, pot, 0.78 + info.s * 0.1, r);
  m.exPro = info;
  m.nat = p.nationality;
  return m;
}

/** Quereinsteiger-Profile (keine Profikarriere). */
const OUTSIDER: Record<string, { from: number; w: number; base: Partial<Record<CoachSkill, [number, number]>> }> = {
  sportlehrer: { from: 1975, w: 3, base: { jugend: [8, 16], technik: [5, 11], taktik: [5, 11], mental: [6, 12], fitness: [6, 12] } },
  amateurtrainer: { from: 1975, w: 4, base: { taktik: [6, 14], technik: [5, 12], mental: [5, 12], fitness: [5, 11], jugend: [5, 12] } },
  torwartspezialist: { from: 1978, w: 1.5, base: { torwart: [7, 15], technik: [3, 8], mental: [4, 10] } },
  sportwissenschaftler: { from: 1980, w: 2, base: { fitness: [9, 18], medizin: [7, 15], analyse: [4, 10], mental: [4, 9] } },
  physio: { from: 1985, w: 1.5, base: { medizin: [9, 17], fitness: [7, 13] } },
  analyst: { from: 1993, w: 2.5, base: { analyse: [9, 18], taktik: [6, 13], technik: [3, 8] } },
  psychologe: { from: 2000, w: 1, base: { mental: [10, 18], jugend: [5, 11] } },
};

/** Quereinsteiger, passend zur gesuchten Rolle (oder zufällig). */
export function makeOutsider(year: number, r: () => number, wantRole?: string): StaffMember {
  const keys = Object.keys(OUTSIDER).filter((k) => OUTSIDER[k].from <= year);
  let kind = keys[0];
  const want = wantRole ? ROLE_SKILLS[wantRole] : undefined;
  const score = (k: string) => {
    if (!want) return OUTSIDER[k].w;
    const b = OUTSIDER[k].base;
    return Object.entries(want).reduce((s, [sk, w]) => s + (b[sk as CoachSkill]?.[1] ?? 0) * (w as number), 0.5) ** 2;
  };
  const total = keys.reduce((s, k) => s + score(k), 0);
  let x = r() * total;
  for (const k of keys) { x -= score(k); if (x <= 0) { kind = k; break; } }
  const base = OUTSIDER[kind].base;
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) {
    const [lo, hi] = base[k] ?? [1, 5];
    pot[k] = clamp(r1(lo + r() * (hi - lo) + (r() < 0.06 ? 3 : 0)), 1, 20);
  }
  const role = wantRole && STAFF_BY_ID[wantRole] && staffAvailable(STAFF_BY_ID[wantRole], year) ? wantRole : bestRole(pot, year);
  const age = 27 + Math.floor(r() * 22);
  const origin = pickOrigin(Math.max(1975, year - age + 22), r, true);
  const n = makeName(origin, r);
  const m = personBase(newId(year, r), role, `${n.firstName} ${n.lastName}`, age, year, pot, 0.7 + r() * 0.2, r);
  m.nat = origin.nationality;
  return m;
}

/** Bestehende Personen (alte Spielstände) bekommen Fachgebiete passend zu Rolle und Qualität. */
export function skillsFromQuality(m: StaffMember, r: () => number): void {
  if (m.skills) return;
  const w = ROLE_SKILLS[m.roleId] ?? {};
  const skills = {} as Record<CoachSkill, number>;
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) {
    const v = w[k] ? m.quality : clamp(m.quality * (0.35 + r() * 0.35), 1, 20);
    skills[k] = clamp(r1(v), 1, 20);
    pot[k] = clamp(r1(skills[k] + (m.age < 45 ? 1 + r() * 3 : r() * 1.2)), 1, 20);
  }
  m.skills = skills;
  m.pot = pot;
  syncQuality(m);
}

// -----------------------------------------------------------------------------
// Gehalt & Verhandlung
// -----------------------------------------------------------------------------
/** Geforderter Gehaltsfaktor (relativ zur Kostenklasse der Rolle). */
export function demandFactor(m: StaffMember, clubRep = 65): number {
  const q = m.quality;
  let f = 0.5 + q * 0.055 + Math.max(0, q - 14) * 0.13;
  if (m.exPro) f *= 1 + m.exPro.s * 0.18;
  if (clubRep < 55) f *= 1.08;
  return Math.round(clamp(f, 0.45, 3.2) * 100) / 100;
}

/** Spielraum bei der Verhandlung: großer Verein und lange Laufzeit helfen etwas. */
export function acceptTolerance(clubRep: number, years: number, age: number): number {
  return clamp((clubRep - 55) / 400, 0, 0.1) + (years >= 3 && age < 55 ? 0.04 : 0) - (years === 1 ? 0.03 : 0);
}

export function acceptsOffer(m: StaffMember, offerFactor: number, years: number, clubRep: number): boolean {
  return offerFactor >= demandFactor(m, clubRep) * (1 - acceptTolerance(clubRep, years, m.age)) - 1e-9;
}

/** Lernschritt einer Saison: Annäherung an das Potenzial, im Alter Abbau. */
export function learnSeason(m: StaffMember, employed: boolean, success: number, r: () => number): void {
  if (!m.skills || !m.pot) return;
  for (const k of COACH_SKILLS) {
    const cur = m.skills[k] ?? 1, cap = m.pot[k] ?? cur;
    let d = 0;
    if (employed && cur < cap) d = (cap - cur) * (0.1 + 0.08 * success) + (r() - 0.4) * 0.3;
    else if (!employed && r() < 0.15) d = -0.3;
    if (m.age >= 60 && r() < 0.3) d -= 0.4;
    m.skills[k] = clamp(r1(cur + d), 1, Math.max(cap, cur));
  }
  // Erfolg im Beruf hebt die Decke leicht (Erfahrung), nie über 20.
  if (employed && success > 0.6 && r() < 0.25) {
    const ws = ROLE_SKILLS[m.roleId] ?? {};
    for (const k of Object.keys(ws) as CoachSkill[]) m.pot[k] = clamp(r1((m.pot[k] ?? 1) + 0.5), 1, 20);
  }
  syncQuality(m);
}

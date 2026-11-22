// =============================================================================
// MITARBEITER ERZEUGEN — ehemalige Spieler, Quereinsteiger, Nachwuchskräfte,
// Cheftrainer aus dem Trainerpool (Rechenlogik ohne Spielablauf)
// -----------------------------------------------------------------------------
//   • Ehemalige Profis bringen ihr Spielverständnis mit: Spielintelligenz →
//     Taktik, Technik → Technik, Athletik → Fitness, Torhüter → Torwarttraining,
//     Führungsstärke → Führung, Übersicht → Spielerkenntnis. Erfolgreiche
//     Karrieren (Titel, Einsätze, Spitzenstärke, Kapitän) heben das Potenzial –
//     ohne Garantie.
//   • Quereinsteiger kommen aus Berufen (`KINDS`): Sportlehrer, Mediziner,
//     Kaufleute, Journalisten, später Analysten, Psychologen, Datenleute.
//     Jeder Beruf bringt ein eigenes Profil mit – daraus ergibt sich, für welche
//     Stellen jemand taugt (engine/staffSkills.ts `roleFit`).
//   • Nachwuchskräfte: jung, noch schwach, mit Luft nach oben.
//   • Cheftrainer der KI (`ClubCoach`) lassen sich als Person darstellen
//     (`coachAsStaff`) – so kannst du freie Trainer aus dem Trainerpool einstellen.
// Spielablauf (Pool, KI-Einstellungen, Lernen, Ruhestand): game/staffWorld.ts.
// =============================================================================
import { makeName, pickOrigin } from '../data/origins';
import { originNat } from '../data/origins';
import { nextSeq } from './idSeq';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import type { AttributeKey, ClubCoach, Player } from '../types';
import { hashStr, mulberry32 } from './leagues';
import type { StaffMember } from './staffPeople';
import {
  bestRole, COACH_SKILLS, type CoachSkill, demandFactor, type ExProInfo, roleFit, ROLE_SKILLS, type StaffTrait,
  specialtyOfSkills, staffLevelExact, staffValueOf, syncQuality,
} from './staffSkills';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

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

/** Wahrscheinlichkeit, nach dem Karriereende im Fußball zu bleiben (Trainer, Scout, Funktionär). */
export function coachingChance(s: number, leadership: number, age: number): number {
  if (age > 41) return 0;
  return clamp(0.32 + 0.5 * s + (leadership >= 70 ? 0.05 : 0), 0, 0.8);
}

/** Affinität eines Ex-Profis je Fähigkeit (0,25–1,15) aus Spielerattributen und Persönlichkeit. */
export function playerAffinity(p: Player, loyal = 50, family = 50, ambition = 50): Record<CoachSkill, number> {
  const f = (a: number) => clamp(0.35 + (a - 40) / 60 * 0.8, 0.35, 1.15);
  const gk = p.naturalPosition === 'TW';
  const lead = (p.attributes.leadership as number) ?? 50;
  return {
    taktik: f(avgAttr(p, ['decisions', 'positioning', 'vision', 'teamwork'])),
    technik: f(gk ? 45 : avgAttr(p, ['technique', 'passing', 'ballControl', 'firstTouch'])),
    fitness: f(avgAttr(p, ['stamina', 'workRate', 'strength', 'acceleration']) - 6),
    torwart: gk ? f(avgAttr(p, ['reflexes', 'handling', 'oneOnOnes', 'aerialReach']) + 8) : 0.25,
    fuehrung: f(lead * 0.7 + ((p.attributes.composure as number) ?? 50) * 0.3),
    mental: f(avgAttr(p, ['composure', 'leadership', 'concentration'])),
    jugend: f(45 + (loyal + family) / 5 - ambition / 10),
    analyse: f(avgAttr(p, ['decisions', 'vision']) - 18),
    medizin: 0.3,
    scouting: f(avgAttr(p, ['decisions', 'vision', 'positioning']) - 8),
    wirtschaft: clamp(0.25 + ambition / 320, 0.25, 0.6),
    medien: clamp(0.3 + lead / 220, 0.3, 0.75),
    organisation: clamp(0.3 + loyal / 260, 0.3, 0.7),
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

// -----------------------------------------------------------------------------
// Personen erzeugen
// -----------------------------------------------------------------------------
// Laufende Nummer aus dem Spielstand (engine/idSeq.ts), nicht je Sitzung.
const newId = (year: number, r: () => number) => `sp_${year}_${(nextSeq() % 1000).toString(36)}${Math.floor(r() * 1e8).toString(36)}`;

/** Höchstens eine Eigenschaft je Person (etwa jede dritte hat eine). */
function rollTrait(pot: Record<CoachSkill, number>, r: () => number, loyal = 50): StaffTrait[] | undefined {
  if (r() >= 0.34) return undefined;
  const w: [StaffTrait, number][] = [
    ['foerderer', (pot.jugend >= 9 ? 3 : 1) + (pot.technik >= 10 ? 1 : 0)],
    ['altmeister', pot.fitness >= 9 || pot.fuehrung >= 10 ? 2 : 0.6],
    ['lernfreudig', 3],
    ['treu', loyal >= 65 ? 5 : 2],
  ];
  const total = w.reduce((s, [, x]) => s + x, 0);
  let x = r() * total;
  for (const [t, v] of w) { x -= v; if (x <= 0) return [t]; }
  return ['lernfreudig'];
}

function personBase(id: string, roleId: string | null, name: string, age: number, year: number, pot: Record<CoachSkill, number>, startFrac: number, r: () => number, loyal?: number): StaffMember {
  const skills = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) skills[k] = clamp(r1(pot[k] * (startFrac + (r() - 0.5) * 0.1)), 1, 20);
  const m: StaffMember = {
    id, roleId: roleId ?? bestRole(pot, year), name, age, quality: 1, specialty: 'allround', methodYear: year,
    loyalty: 30 + Math.floor(r() * 50), salaryFactor: 1, hired: '', skills, pot,
  };
  const traits = rollTrait(pot, r, loyal);
  if (traits) m.traits = traits;
  if (traits?.[0] === 'treu') m.loyalty = Math.max(m.loyalty, 70);
  syncQuality(m);
  m.specialty = specialtyOfSkills(skills, m.roleId);
  m.salaryFactor = demandFactor(m);
  return m;
}

/** Neue Person aus einem Spieler, der seine Karriere beendet. */
export function staffFromPlayer(p: Player, info: ExProInfo, year: number, persona: { loyal: number; family: number; ambition: number } | null, r: () => number): StaffMember {
  const aff = playerAffinity(p, persona?.loyal, persona?.family, persona?.ambition);
  const ceil = exProCeiling(info.s, p, r);
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) pot[k] = clamp(r1(ceil * aff[k]), 1, 20);
  const m = personBase(newId(year, r), null, p.fullName, p.age, year, pot, 0.78 + info.s * 0.1, r, persona?.loyal);
  m.exPro = info;
  m.nat = p.nationality;
  m.salaryFactor = demandFactor(m);
  return m;
}

/** Berufe der Quereinsteiger: ab wann es sie gibt, wie häufig, und ihr Profil (Spanne des Potenzials je Fähigkeit). */
export const KINDS: Record<string, { label: string; from: number; w: number; base: Partial<Record<CoachSkill, [number, number]>> }> = {
  sportlehrer: { label: 'Sportlehrer', from: 1975, w: 3, base: { jugend: [8, 16], technik: [5, 11], taktik: [5, 11], mental: [6, 12], fitness: [6, 12], fuehrung: [4, 10], organisation: [3, 8] } },
  amateurtrainer: { label: 'Amateurtrainer', from: 1975, w: 4, base: { taktik: [6, 14], technik: [5, 12], mental: [5, 12], fitness: [5, 11], jugend: [5, 12], fuehrung: [6, 13], scouting: [3, 9] } },
  arzt: { label: 'Mediziner', from: 1975, w: 1.5, base: { medizin: [10, 18], fitness: [3, 8], organisation: [3, 8] } },
  masseur: { label: 'Masseur', from: 1975, w: 1.5, base: { medizin: [6, 13], fitness: [5, 11] } },
  talentspaeher: { label: 'Talentspäher', from: 1975, w: 2.5, base: { scouting: [7, 16], taktik: [4, 10], jugend: [4, 10], organisation: [3, 8] } },
  kaufmann: { label: 'Kaufmann', from: 1975, w: 2, base: { wirtschaft: [8, 17], organisation: [6, 13], fuehrung: [4, 10], medien: [2, 8] } },
  verwalter: { label: 'Verwaltungsfachmann', from: 1975, w: 1.5, base: { organisation: [8, 16], wirtschaft: [4, 11] } },
  handwerker: { label: 'Handwerker', from: 1975, w: 1.2, base: { organisation: [6, 14], fitness: [3, 9], mental: [3, 9] } },
  torwartspezialist: { label: 'Torwartspezialist', from: 1978, w: 1.5, base: { torwart: [7, 15], technik: [3, 8], mental: [4, 10] } },
  journalist: { label: 'Journalist', from: 1978, w: 1.5, base: { medien: [8, 17], organisation: [4, 9], analyse: [2, 7], scouting: [2, 7] } },
  sportwissenschaftler: { label: 'Sportwissenschaftler', from: 1980, w: 2, base: { fitness: [9, 18], medizin: [7, 15], analyse: [4, 10], mental: [4, 9] } },
  physio: { label: 'Physiotherapeut', from: 1983, w: 1.5, base: { medizin: [9, 17], fitness: [7, 13] } },
  werber: { label: 'Marketingfachmann', from: 1988, w: 1.5, base: { medien: [7, 15], wirtschaft: [7, 15], organisation: [4, 10] } },
  jurist: { label: 'Jurist', from: 1990, w: 1, base: { wirtschaft: [7, 14], organisation: [8, 16] } },
  analyst: { label: 'Analyst', from: 1993, w: 2.5, base: { analyse: [9, 18], taktik: [6, 13], technik: [3, 8], scouting: [4, 10] } },
  psychologe: { label: 'Psychologe', from: 2000, w: 1, base: { mental: [10, 18], jugend: [5, 11], fuehrung: [4, 9] } },
  informatiker: { label: 'Informatiker', from: 2000, w: 1.2, base: { analyse: [9, 17], organisation: [6, 13] } },
  datenwissenschaftler: { label: 'Datenwissenschaftler', from: 2012, w: 1.5, base: { analyse: [11, 19], scouting: [5, 12], wirtschaft: [3, 8] } },
};
/** Herkunft einer Person als kurzer Text (ohne Ex-Profi-Angaben). */
export const kindLabel = (m: StaffMember): string => (m.bg && KINDS[m.bg]?.label) || 'Quereinsteiger';

function pickKind(year: number, r: () => number, wantRole?: string): string {
  const keys = Object.keys(KINDS).filter((k) => KINDS[k].from <= year);
  const want = wantRole ? ROLE_SKILLS[wantRole] : undefined;
  const score = (k: string) => {
    if (!want) return KINDS[k].w;
    const b = KINDS[k].base;
    return Object.entries(want).reduce((s, [sk, w]) => s + (b[sk as CoachSkill]?.[1] ?? 0) * (w as number), 0.5) ** 3;
  };
  const total = keys.reduce((s, k) => s + score(k), 0);
  let x = r() * total;
  for (const k of keys) { x -= score(k); if (x <= 0) return k; }
  return keys[0];
}

/**
 * Quereinsteiger, passend zur gesuchten Stelle (oder zufällig nach Häufigkeit der Berufe).
 * `young` = Nachwuchskraft: 23–31 Jahre, erst gut die Hälfte des Potenzials, dafür mehr Luft nach oben.
 */
export function makeOutsider(year: number, r: () => number, wantRole?: string, young = false): StaffMember {
  const kind = pickKind(year, r, wantRole);
  const base = KINDS[kind].base;
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) {
    const [lo, hi] = base[k] ?? [1, 5];
    pot[k] = clamp(r1(lo + r() * (hi - lo) + (r() < 0.06 ? 3 : 0) + (young && base[k] ? 1 : 0)), 1, 20);
  }
  const ok = wantRole && STAFF_BY_ID[wantRole] && staffAvailable(STAFF_BY_ID[wantRole], year);
  const age = young ? 23 + Math.floor(r() * 9) : 27 + Math.floor(r() * 22);
  const origin = pickOrigin(Math.max(1975, year - age + 22), r, true);
  const n = makeName(origin, r, year - age);
  const frac = young ? 0.56 + r() * 0.14 : 0.7 + r() * 0.2;
  const m = personBase(newId(year, r), ok ? wantRole! : null, `${n.firstName} ${n.lastName}`, age, year, pot, frac, r);
  m.nat = originNat(origin, year, m.id);
  m.bg = kind;
  return m;
}

/** Bestehende Personen (alte Spielstände) bekommen Fähigkeiten passend zu Stelle und Qualität. */
export function skillsFromQuality(m: StaffMember, r: () => number): void {
  if (m.skills) { ensureSkillSet(m, r); return; }
  const w = ROLE_SKILLS[m.roleId] ?? {};
  const skills = {} as Record<CoachSkill, number>;
  const pot = {} as Record<CoachSkill, number>;
  for (const k of COACH_SKILLS) {
    const v = w[k] ? m.quality : clamp(m.quality * (0.2 + r() * 0.3), 1, 20);
    skills[k] = clamp(r1(v), 1, 20);
    pot[k] = clamp(r1(skills[k] + (m.age < 45 ? 1 + r() * 3 : r() * 1.2)), 1, 20);
  }
  m.skills = skills;
  m.pot = pot;
  syncQuality(m);
}

/** Personen aus Spielständen mit acht Fachgebieten: die fünf neuen Fähigkeiten ergänzen (Qualität der Stelle bleibt). */
export function ensureSkillSet(m: StaffMember, r: () => number): void {
  if (!m.skills || !m.pot) return;
  const q = m.quality;
  const w = ROLE_SKILLS[m.roleId] ?? {};
  let added = false;
  for (const k of COACH_SKILLS) {
    if (m.skills[k] != null) continue;
    added = true;
    // Führung: wer Trainer ist, hat davon etwas; alles Übrige ist Nebenwissen.
    const lead = k === 'fuehrung' && (m.skills.taktik ?? 0) >= 6;
    const v = w[k] ? q : lead ? clamp((m.skills.mental ?? q) * (0.75 + r() * 0.35), 1, 20) : clamp(q * (0.15 + r() * 0.3), 1, 20);
    m.skills[k] = clamp(r1(v), 1, 20);
    m.pot[k] = clamp(r1(m.skills[k]! + (m.age < 45 ? 0.5 + r() * 2 : r())), 1, 20);
  }
  if (!added) return;
  // Qualität in der Stelle halten: geänderte Gewichte (neue Fähigkeiten zählen mit) ausgleichen.
  const d = q - roleFit(m.skills, m.roleId, q);
  if (Math.abs(d) >= 0.3) for (const k of Object.keys(w) as CoachSkill[]) {
    m.skills[k] = clamp(r1((m.skills[k] ?? 1) + d), 1, 20);
    m.pot[k] = Math.max(m.pot[k] ?? 1, m.skills[k]!);
  }
  syncQuality(m);
}

// -----------------------------------------------------------------------------
// Cheftrainer der KI als Person (und zurück)
// -----------------------------------------------------------------------------
/** Was vom Trainer bleibt, wenn eine Person im Trainerpool steht (an `ClubCoach.sm`). */
export interface StaffSnapshot {
  skills: Partial<Record<CoachSkill, number>>;
  pot: Partial<Record<CoachSkill, number>>;
  traits?: StaffTrait[];
  exPro?: ExProInfo;
  bg?: string;
  methodYear?: number;
  home?: string;
}
export const COACH_ID_PREFIX = 'cp:';

/** Stärke 1–99 eines KI-Cheftrainers aus seinem Ansehen. */
export const coachRepLevel = (rep: number): number => clamp(rep + 4, 40, 97);

/** Cheftrainer (Trainerpool oder Trainer eines KI-Vereins) als Person – fest aus seiner ID, damit er jedes Mal derselbe ist. */
export function coachAsStaff(c: ClubCoach, year: number): StaffMember {
  const r = mulberry32(hashStr(`cs:${c.id}`));
  const sm = c.sm as StaffSnapshot | undefined;
  let skills: Record<CoachSkill, number>, pot: Record<CoachSkill, number>;
  if (sm?.skills && sm.pot) {
    skills = { ...(sm.skills as Record<CoachSkill, number>) };
    pot = { ...(sm.pot as Record<CoachSkill, number>) };
    for (const k of COACH_SKILLS) { skills[k] ??= 2; pot[k] ??= skills[k]; }
  } else {
    const q = staffValueOf(coachRepLevel(c.reputation));
    const u = (a: number, b: number) => a + r() * (b - a);
    skills = {
      taktik: q + u(-1, 1.2), fuehrung: q + u(-1.2, 1.2), mental: q + u(-2, 1), technik: q + u(-2, 1), fitness: q - 3 + u(-2, 2),
      torwart: u(2, 6), jugend: c.philosophy === 'jugend' ? q + u(-1, 1) : q - 4 + u(-2, 2),
      scouting: c.philosophy === 'einkauf' ? q - 1 + u(-1.5, 1.5) : q - 4 + u(-2, 2),
      analyse: q - 6 + u(-2, 2), medizin: u(1.5, 4), wirtschaft: u(2, 7), medien: 3 + c.reputation / 15 + u(-1, 1), organisation: u(3, 8),
    };
    // Eignung als Cheftrainer genau auf sein Ansehen legen.
    const d = q - roleFit(skills, 'cheftrainer', q);
    for (const k of Object.keys(ROLE_SKILLS.cheftrainer) as CoachSkill[]) skills[k] += d;
    pot = {} as Record<CoachSkill, number>;
    for (const k of COACH_SKILLS) {
      skills[k] = clamp(r1(skills[k]), 1, 20);
      pot[k] = clamp(r1(skills[k] + (ROLE_SKILLS.cheftrainer[k] ? (c.age < 45 ? 1.5 : c.age < 55 ? 0.8 : 0.2) : 0.5)), 1, 20);
    }
  }
  const m: StaffMember = {
    id: COACH_ID_PREFIX + c.id, roleId: 'cheftrainer', name: c.name, age: c.age, quality: 1, specialty: 'allround',
    methodYear: sm?.methodYear ?? year - Math.floor(r() * (c.age > 55 ? 9 : 4)), loyalty: 35 + Math.floor(r() * 40), salaryFactor: 1, hired: '',
    skills, pot, nat: c.nationality, traits: sm?.traits, exPro: sm?.exPro, bg: sm?.bg ?? 'amateurtrainer', home: sm?.home,
    coach: { id: c.id, style: c.style, philosophy: c.philosophy, rep: c.reputation, formation: c.preferredFormation },
  };
  syncQuality(m);
  m.specialty = specialtyOfSkills(skills, 'cheftrainer');
  m.salaryFactor = demandFactor(m);
  return m;
}

/** Ansehen eines Cheftrainers (0–100) aus seinen Fähigkeiten – Gegenstück zu `coachAsStaff`. */
export function coachRepOf(m: StaffMember): number {
  return Math.round(clamp(staffLevelExact(roleFit(m.skills, 'cheftrainer', m.quality)) - 4 + (m.exPro?.s ?? 0) * 6, 15, 95));
}
export function snapshotOf(m: StaffMember): StaffSnapshot {
  return { skills: { ...(m.skills ?? {}) }, pot: { ...(m.pot ?? {}) }, traits: m.traits, exPro: m.exPro, bg: m.bg, methodYear: m.methodYear, home: m.home };
}

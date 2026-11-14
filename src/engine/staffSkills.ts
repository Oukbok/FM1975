// =============================================================================
// MITARBEITER — Fähigkeiten, Stellen und Eignung (Rechenlogik ohne Spielablauf)
// -----------------------------------------------------------------------------
// Wunsch Pascal: Mitarbeiter sind Personen wie Spieler. Jede Person hat 13
// Fähigkeiten und kommt damit für JEDE Stelle im Verein infrage – wie gut, sagt
// die Eignung: der nach Stelle gewichtete Wert ihrer Fähigkeiten (`ROLE_SKILLS`).
//   • skills = heutiger Stand, pot = erreichbarer Höchststand (Lernen im Beruf).
//   • Gespeichert wird auf einer feinen Skala 1–20; angezeigt und mit Spielern
//     verglichen wird die Stärke 1–99 (`staffLevel`): 10 ≙ 74, 14 ≙ 84, 18 ≙ 94.
//     Damit lässt sich ein Trainer direkt neben das Potenzial eines Spielers
//     stellen (engine/coaching.ts).
//   • `quality` einer Person ist ihre Eignung (1–20) für die Stelle `roleId`:
//     bei Angestellten die besetzte Stelle, bei Vereinslosen ihre beste.
// Personen erzeugen (Ex-Profis, Quereinsteiger, Nachwuchs): engine/staffGen.ts.
// Wirkung des Trainerteams auf die Entwicklung: engine/coaching.ts.
// Spielablauf (Pool, KI, Lernen, Ruhestand): game/staffWorld.ts.
// =============================================================================
import { STAFF_BY_ID, STAFF_ROLES, staffAvailable } from '../data/staff';
import type { CoachSpecialty, StaffMember } from './staffPeople';

export type CoachSkill =
  | 'taktik' | 'technik' | 'fitness' | 'torwart'
  | 'fuehrung' | 'mental' | 'jugend'
  | 'analyse' | 'medizin' | 'scouting'
  | 'wirtschaft' | 'medien' | 'organisation';
export const COACH_SKILLS: CoachSkill[] = [
  'taktik', 'technik', 'fitness', 'torwart', 'fuehrung', 'mental', 'jugend',
  'analyse', 'medizin', 'scouting', 'wirtschaft', 'medien', 'organisation',
];
export const SKILL_LABEL: Record<CoachSkill, string> = {
  taktik: 'Taktik', technik: 'Technik', fitness: 'Fitness', torwart: 'Torwart',
  fuehrung: 'Führung', mental: 'Mentales', jugend: 'Nachwuchs',
  analyse: 'Analyse', medizin: 'Medizin & Reha', scouting: 'Spielerkenntnis',
  wirtschaft: 'Wirtschaft', medien: 'Öffentlichkeit', organisation: 'Organisation',
};
/** Kurzbeschreibung je Fähigkeit (Personenprofil, Wiki). */
export const SKILL_INFO: Record<CoachSkill, string> = {
  taktik: 'Spielsysteme, Abwehr- und Angriffsverhalten, Spielvorbereitung.',
  technik: 'Ballarbeit, Passspiel, Abschluss – das Handwerk am Ball.',
  fitness: 'Ausdauer, Schnelligkeit, Kraft und die richtige Belastung.',
  torwart: 'Ausbildung der Torhüter.',
  fuehrung: 'Autorität, Kabine, Umgang mit Stars – macht aus einem Trainer einen Chef.',
  mental: 'Motivation, Nervenstärke, Gespräche.',
  jugend: 'Arbeit mit jungen Spielern.',
  analyse: 'Spiel- und Datenauswertung.',
  medizin: 'Vorbeugung, Behandlung und Wiederaufbau nach Verletzungen.',
  scouting: 'Stärke und Potenzial von Spielern richtig einschätzen.',
  wirtschaft: 'Verträge, Finanzen, Verhandlungen.',
  medien: 'Presse, Werbung, Fans.',
  organisation: 'Abläufe, Verwaltung, Material und Anlagen.',
};
/** Gruppen für die Anzeige (vier Blöcke im Personenprofil). */
export const SKILL_GROUPS: { id: string; label: string; skills: CoachSkill[] }[] = [
  { id: 'training', label: 'Training', skills: ['taktik', 'technik', 'fitness', 'torwart'] },
  { id: 'menschen', label: 'Menschen', skills: ['fuehrung', 'mental', 'jugend'] },
  { id: 'wissen', label: 'Fachwissen', skills: ['analyse', 'medizin', 'scouting'] },
  { id: 'verein', label: 'Verein', skills: ['wirtschaft', 'medien', 'organisation'] },
];

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
  /** Vereine, für die er mindestens 30 Spiele gemacht hat (IDs) – „kennt den Verein“. */
  cids?: string[];
}

// -----------------------------------------------------------------------------
// Stärke 1–99 (Anzeige, Vergleich mit Spielern)
// -----------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Fähigkeit/Eignung 1–20 → Stärke 1–99 (unten gespreizt: 1 ≙ 26, 8 ≙ 69; oben wie Spieler: 14 ≙ 84, 20 ≙ 99). */
export function staffLevelExact(v: number): number {
  const x = clamp(v, 0, 20);
  return clamp(x < 8 ? 20 + x * 6.125 : 69 + (x - 8) * 2.5, 1, 99);
}
export const staffLevel = (v: number): number => Math.round(staffLevelExact(v));
/** Umkehrung: Stärke 1–99 → Wert 1–20. */
export function staffValueOf(level: number): number {
  const l = clamp(level, 20, 99);
  return l < 69 ? (l - 20) / 6.125 : 8 + (l - 69) / 2.5;
}
/** Wort zur Eignung (Stärke 1–99). */
export function fitWord(level: number): string {
  return level >= 88 ? 'herausragend' : level >= 80 ? 'sehr gut' : level >= 72 ? 'gut' : level >= 62 ? 'ordentlich' : level >= 50 ? 'ausreichend' : 'ungeeignet';
}

// -----------------------------------------------------------------------------
// Stellen: welche Fähigkeiten zählen (Summe je Stelle = 1)
// -----------------------------------------------------------------------------
export const ROLE_SKILLS: Record<string, Partial<Record<CoachSkill, number>>> = {
  // Trainerteam
  cheftrainer: { taktik: 0.3, fuehrung: 0.3, mental: 0.15, technik: 0.15, fitness: 0.1 },
  cotrainer: { taktik: 0.4, technik: 0.35, mental: 0.15, fuehrung: 0.1 },
  torwarttrainer: { torwart: 0.9, mental: 0.1 },
  konditionstrainer: { fitness: 0.8, medizin: 0.2 },
  athletiktrainer: { fitness: 0.7, medizin: 0.3 },
  reha_trainer: { medizin: 0.7, fitness: 0.3 },
  videoanalyst: { analyse: 0.8, taktik: 0.2 },
  spielanalyst: { analyse: 0.7, taktik: 0.3 },
  jugendtrainer: { jugend: 0.6, technik: 0.2, taktik: 0.2 },
  sportpsychologe: { mental: 0.85, fuehrung: 0.15 },
  fussballpsychologe: { mental: 0.85, fuehrung: 0.15 },
  // Sportliche Leitung
  sportl_leiter: { scouting: 0.3, fuehrung: 0.3, wirtschaft: 0.2, taktik: 0.2 },
  sportdirektor: { wirtschaft: 0.3, scouting: 0.3, fuehrung: 0.3, organisation: 0.1 },
  // Medizin, Reha, Athletik
  mannschaftsarzt: { medizin: 0.9, organisation: 0.1 },
  masseur: { medizin: 0.7, fitness: 0.3 },
  physio_haupt: { medizin: 0.75, fitness: 0.25 },
  leistungsdiag: { fitness: 0.4, analyse: 0.4, medizin: 0.2 },
  ernaehrung: { medizin: 0.6, fitness: 0.4 },
  head_performance: { fitness: 0.35, medizin: 0.3, fuehrung: 0.2, analyse: 0.15 },
  sportwissenschaftler: { fitness: 0.5, analyse: 0.3, medizin: 0.2 },
  belastungsmanager: { fitness: 0.4, medizin: 0.3, analyse: 0.3 },
  return_to_play: { medizin: 0.6, fitness: 0.4 },
  // Scouting, Analyse, Daten
  scout_1975: { scouting: 0.85, taktik: 0.15 },
  gegnerbeobachter: { scouting: 0.4, taktik: 0.35, analyse: 0.25 },
  chefscout: { scouting: 0.65, fuehrung: 0.2, organisation: 0.15 },
  intl_scout: { scouting: 0.8, organisation: 0.2 },
  nachwuchskoord: { jugend: 0.5, scouting: 0.3, organisation: 0.2 },
  datenanalyst: { analyse: 0.85, scouting: 0.15 },
  dateningenieur: { analyse: 0.7, organisation: 0.3 },
  head_data: { analyse: 0.55, fuehrung: 0.25, scouting: 0.2 },
  ml_spezialist: { analyse: 0.9, scouting: 0.1 },
  ki_scouting: { scouting: 0.5, analyse: 0.5 },
  // Medien, Marketing, Fans
  pressesprecher: { medien: 0.85, organisation: 0.15 },
  marketingmanager: { medien: 0.5, wirtschaft: 0.5 },
  eventmanager: { organisation: 0.6, medien: 0.4 },
  socialmedia: { medien: 0.9, analyse: 0.1 },
  crm_manager: { medien: 0.45, analyse: 0.35, wirtschaft: 0.2 },
  // Verwaltung, Recht, Organisation
  zeugwart: { organisation: 0.8, mental: 0.2 },
  platzwart: { organisation: 0.8, fitness: 0.2 },
  verwaltung: { organisation: 0.8, wirtschaft: 0.2 },
  schatzmeister: { wirtschaft: 0.85, organisation: 0.15 },
  kaufm_leiter: { wirtschaft: 0.7, fuehrung: 0.15, organisation: 0.15 },
  vertragsmanager: { wirtschaft: 0.6, organisation: 0.4 },
  it_admin: { organisation: 0.6, analyse: 0.4 },
  lizenzmanager: { organisation: 0.6, wirtschaft: 0.4 },
  compliance: { wirtschaft: 0.5, organisation: 0.5 },
  var_koord: { organisation: 0.5, analyse: 0.3, taktik: 0.2 },
  nachhaltigkeit: { organisation: 0.6, medien: 0.4 },
};

/** Rollen der Seite „Trainerteam“ in Anzeigereihenfolge mit Kurzname. */
export const TEAM_ROLES: { id: string; label: string; what: string }[] = [
  { id: 'cheftrainer', label: 'Cheftrainer', what: 'Leitet das Training. Sein Niveau entscheidet, wie weit deine Spieler kommen.' },
  { id: 'cotrainer', label: 'Co-Trainer', what: 'Taktik- und Technikeinheiten, Spielvorbereitung. Große Vereine brauchen mehrere.' },
  { id: 'torwarttrainer', label: 'Torwarttrainer', what: 'Bildet die Torhüter aus – sein Niveau zählt für sie.' },
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
export const roleName = (roleId: string): string => TEAM_ROLE_LABEL[roleId] ?? STAFF_BY_ID[roleId]?.name ?? roleId;

/** Rollen, die auch die KI-Vereine besetzen (Arbeitsmarkt über die Jahrzehnte). */
export const AI_TRACKED_ROLES = ['cotrainer', 'torwarttrainer', 'konditionstrainer', 'videoanalyst', 'athletiktrainer'];

export function teamRolesAvailable(year: number): string[] {
  return TEAM_ROLES.map((r) => r.id).filter((id) => STAFF_BY_ID[id] && staffAvailable(STAFF_BY_ID[id], year));
}
/** Alle Stellen, die es im Jahr gibt (Reihenfolge des Katalogs). */
export function rolesAvailable(year: number): string[] {
  return STAFF_ROLES.filter((r) => staffAvailable(r, year) && ROLE_SKILLS[r.id]).map((r) => r.id);
}

/** Wie viele Personen eine Stelle fassen kann (Co-Trainer, Scouts, Jugendtrainer mehrfach). */
export function roleSlots(roleId: string, year: number): number {
  if (roleId === 'cotrainer' || roleId === 'scout_1975') return year < 1990 ? 2 : 3;
  if (roleId === 'jugendtrainer') return 2;
  return 1;
}

// -----------------------------------------------------------------------------
// Eignung
// -----------------------------------------------------------------------------
type Skills = Partial<Record<CoachSkill, number>>;

/** Eignung einer Person für eine Stelle, fein (1–20, eine Nachkommastelle). */
export function roleFit(skills: Skills | undefined, roleId: string, fallback = 8): number {
  const w = ROLE_SKILLS[roleId];
  if (!skills || !w) return fallback;
  let q = 0, sum = 0;
  for (const [k, v] of Object.entries(w) as [CoachSkill, number][]) { q += (skills[k] ?? 1) * v; sum += v; }
  return clamp(r1(q / Math.max(0.01, sum)), 1, 20);
}
/** Qualität einer Person in einer Rolle (1–20, gerundet) aus ihren Fähigkeiten. */
export function roleQuality(skills: Skills | undefined, roleId: string, fallback = 8): number {
  return clamp(Math.round(roleFit(skills, roleId, fallback)), 1, 20);
}
/** Stärke 1–99 einer Person in einer Stelle. */
export const roleLevel = (skills: Skills | undefined, roleId: string): number => staffLevel(roleFit(skills, roleId, 1));

/** Qualität aus den Fähigkeiten neu setzen (nach Lernen/Altern/Versetzung). */
export function syncQuality(m: StaffMember): void {
  if (m.skills) m.quality = roleQuality(m.skills, m.roleId, m.quality);
}

/** Die besten Stellen einer Person (unter den im Jahr verfügbaren), beste zuerst. */
export function bestRoles(skills: Skills, year: number, n = 5, roles = rolesAvailable(year)): { id: string; fit: number }[] {
  return roles.map((id) => ({ id, fit: roleFit(skills, id, 1) })).sort((a, b) => b.fit - a.fit).slice(0, n);
}

/** Vorlieben beim Berufseinstieg (die meisten Ex-Profis beginnen als Co- oder Jugendtrainer). */
const START_BONUS: Record<string, number> = { cotrainer: 0.6, jugendtrainer: 0.3, scout_1975: 0.2, cheftrainer: -3 };
/** Stelle, in der eine Person am meisten taugt (unter den im Jahr verfügbaren Stellen). */
export function bestRole(skills: Skills, year: number, roles: string[] = rolesAvailable(year)): string {
  let best = 'cotrainer', bq = -99;
  for (const id of roles) {
    const r = STAFF_BY_ID[id];
    if (!r || !staffAvailable(r, year) || !ROLE_SKILLS[id]) continue;
    const q = roleFit(skills, id, 0) + (START_BONUS[id] ?? 0);
    if (q > bq) { bq = q; best = id; }
  }
  return best;
}

/** Fähigkeit → Spezialgebiet aus Mitarbeiter 2.0 (wirkt in specialistBoost). */
export function specialtyOfSkills(skills: Skills, roleId: string): CoachSpecialty {
  if (roleId === 'torwarttrainer') return 'torwart';
  if (roleId === 'jugendtrainer') return 'jugend';
  if (roleId === 'sportpsychologe' || roleId === 'fussballpsychologe') return 'mental';
  if (roleId === 'konditionstrainer' || roleId === 'athletiktrainer' || roleId === 'reha_trainer') return 'athletik';
  if (roleId !== 'cheftrainer' && roleId !== 'cotrainer') return 'allround';
  const t = skills.taktik ?? 0, te = skills.technik ?? 0, f = skills.fitness ?? 0, me = skills.mental ?? 0;
  const top = Math.max(t, te, f, me);
  if (top - Math.min(t, te) < 2) return 'allround';
  return top === t ? 'taktik' : top === te ? 'technik' : top === f ? 'athletik' : 'mental';
}

// -----------------------------------------------------------------------------
// Eigenschaften (höchstens eine je Person)
// -----------------------------------------------------------------------------
export type StaffTrait = 'foerderer' | 'altmeister' | 'lernfreudig' | 'treu';
export const TRAIT_LABEL: Record<StaffTrait, string> = {
  foerderer: 'Talentförderer', altmeister: 'Kennt die Routiniers', lernfreudig: 'Lernfreudig', treu: 'Vereinstreu',
};
export const TRAIT_INFO: Record<StaffTrait, string> = {
  foerderer: 'Als Chef-, Co- oder Jugendtrainer: Spieler bis 21 entwickeln sich 6 % schneller.',
  altmeister: 'Als Chef-, Co- oder Fitnesstrainer: Spieler ab 30 bauen 8 % langsamer ab.',
  lernfreudig: 'Lernt im Beruf anderthalbmal so schnell und bleibt bei den Methoden auf dem Laufenden.',
  treu: 'Lässt sich nicht abwerben und verlängert zu fairen Bedingungen.',
};
export const hasTrait = (m: StaffMember, t: StaffTrait): boolean => !!m.traits?.includes(t);

// -----------------------------------------------------------------------------
// Gehalt & Verhandlung
// -----------------------------------------------------------------------------
/** Geforderter Gehaltsfaktor (relativ zur Kostenklasse der Rolle) für die Qualität `q` in der Stelle. */
export function demandFactor(m: StaffMember, clubRep = 65, q = m.quality): number {
  let f = 0.5 + q * 0.055 + Math.max(0, q - 14) * 0.13;
  if (m.exPro) f *= 1 + m.exPro.s * 0.18;
  if (clubRep < 55) f *= 1.08;
  return Math.round(clamp(f, 0.45, 3.2) * 100) / 100;
}

/** Spielraum bei der Verhandlung: großer Verein und lange Laufzeit helfen etwas. */
export function acceptTolerance(clubRep: number, years: number, age: number): number {
  return clamp((clubRep - 55) / 400, 0, 0.1) + (years >= 3 && age < 55 ? 0.04 : 0) - (years === 1 ? 0.03 : 0);
}

export function acceptsOffer(m: StaffMember, offerFactor: number, years: number, clubRep: number, demand = demandFactor(m, clubRep)): boolean {
  return offerFactor >= demand * (1 - acceptTolerance(clubRep, years, m.age)) - 1e-9;
}

// -----------------------------------------------------------------------------
// Lernen im Beruf
// -----------------------------------------------------------------------------
/** Lerntempo nach Alter: junge Leute lernen schnell, ab Mitte 50 kaum noch. */
export function learnPace(age: number): number {
  return age < 32 ? 1.35 : age < 42 ? 1.1 : age < 50 ? 0.9 : age < 57 ? 0.6 : 0.35;
}

/**
 * Lernschritt einer Saison: Annäherung an das Potenzial (Fähigkeiten der eigenen
 * Stelle schneller als der Rest), ohne Stelle leichter Rückschritt, im Alter Abbau.
 * @returns Änderung der Eignung für die eigene Stelle (fein, 1–20-Skala)
 */
export function learnSeason(m: StaffMember, employed: boolean, success: number, r: () => number): number {
  if (!m.skills || !m.pot) return 0;
  const before = roleFit(m.skills, m.roleId, m.quality);
  const mine = ROLE_SKILLS[m.roleId] ?? {};
  const pace = learnPace(m.age) * (hasTrait(m, 'lernfreudig') ? 1.5 : 1);
  for (const k of COACH_SKILLS) {
    const cur = m.skills[k] ?? 1, cap = m.pot[k] ?? cur;
    let d = 0;
    if (employed && cur < cap) d = ((cap - cur) * (0.1 + 0.08 * success) * (mine[k] ? 1 : 0.45) + (r() - 0.4) * 0.3) * pace;
    else if (!employed && r() < 0.15) d = -0.3;
    if (m.age >= 60 && r() < 0.3) d -= 0.4;
    m.skills[k] = clamp(r1(cur + d), 1, Math.max(cap, cur));
  }
  // Erfolg im Beruf hebt die Decke leicht (Erfahrung), nie über 20.
  if (employed && success > 0.6 && r() < 0.25) {
    for (const k of Object.keys(mine) as CoachSkill[]) m.pot[k] = clamp(r1((m.pot[k] ?? 1) + 0.5), 1, 20);
  }
  syncQuality(m);
  return r1(roleFit(m.skills, m.roleId, m.quality) - before);
}

/** Fortbildung: Fähigkeiten der eigenen Stelle rücken ein Stück an das Potenzial. */
export function courseGain(m: StaffMember): void {
  if (!m.skills || !m.pot) return;
  for (const k of Object.keys(ROLE_SKILLS[m.roleId] ?? {}) as CoachSkill[]) {
    const cur = m.skills[k] ?? 1, cap = m.pot[k] ?? cur;
    if (cur < cap) m.skills[k] = clamp(r1(cur + Math.min(0.7, (cap - cur) * 0.35)), 1, cap);
  }
  syncQuality(m);
}

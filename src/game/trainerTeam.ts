// =============================================================================
// MITARBEITER DES EIGENEN VEREINS — einstellen, versetzen, verlängern, entlassen
// (Seiten Training › Trainerteam und Verein › Mitarbeiter)
// -----------------------------------------------------------------------------
// Jede Person vom Arbeitsmarkt (game/staffWorld.ts) kann für jede Stelle
// verpflichtet werden; ihre Forderung richtet sich nach der Eignung für diese
// Stelle (Überqualifizierte bleiben teuer). Stellen mit mehreren Plätzen
// (Co-Trainer, Scouts, Jugendtrainer – `roleSlots`) füllen sich der Reihe nach,
// erst danach ersetzt ein Neuer den Schwächsten. Abwerben gegen Ablöse,
// Entlassen mit Abfindung nach Restlaufzeit, Vertragsende zum 30.6., Versetzen
// auf eine andere Stelle (Beförderung), Fortbildung.
// Wirkung: Lernfaktor je Trainingsbaustein aus den Fähigkeiten (Trainingsplan),
// weniger Trainingsverletzungen durch Fitness-/Medizinwissen; Entwicklung der
// Spieler über das Niveau des Trainerteams (engine/coaching.ts).
// =============================================================================
import { privateTrainingFactor } from './private/privateState';
import { Game } from './state';
import { TrainingBlock, TrainingBlockCategory } from '../types';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { effectiveQuality, memberMonthlySalary, StaffMember, trainingCourseCost } from '../engine/staffPeople';
import {
  acceptsOffer, CoachSkill, courseGain, demandFactor, hasTrait, learnSeason, roleFit, roleName, roleQuality, roleSlots,
  ROLE_SKILLS, specialtyOfSkills, staffLevel, syncQuality, TEAM_ROLE_IDS,
} from '../engine/staffSkills';
import { COACH_ID_PREFIX, coachAsStaff, makeOutsider, skillsFromQuality } from '../engine/staffGen';
import { makeCoach } from '../engine/aiManager';
import { assistantsNeeded } from '../engine/coaching';
import { ensureStaff } from './staffGame';
import { clubStaffTarget, ensureStaffWorld, findPerson, staffMarket, toClubCoach, tuneTo } from './staffWorld';
import { depart, install, pickSuccessor } from './coachCarousel';
import { closeHeadCoach, syncHeadCoach } from './headCoaches';
import { honourFx } from '../engine/honourEffects';
import { goalOf } from './dressingRoomGame';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function roleLabel(roleId: string): string {
  return roleName(roleId);
}

/** Monate bis Vertragsende (mind. 0). */
export function monthsLeft(m: StaffMember, today: string): number {
  if (!m.contractEnd) return 12;
  const a = new Date(today + 'T00:00:00Z'), b = new Date(m.contractEnd + 'T00:00:00Z');
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth());
}

/**
 * Abfindung: halbe Restlaufzeit, mindestens zwei, höchstens 18 Monatsgehälter. Ausgehandelte
 * Regeln (game/staffTalk.ts): „begrenzt“ = höchstens drei Monatsgehälter, „volle Restlaufzeit“ = alles bis Vertragsende.
 */
export function severanceOf(g: Game, m: StaffMember): number {
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const left = monthsLeft(m, g.calendar.currentDate);
  const months = m.deal?.sev === 'cap' ? clamp(Math.round(left * 0.5), 1, 3) : m.deal?.sev === 'full' ? clamp(left, 2, 36) : clamp(Math.round(left * 0.5), 2, 18);
  return memberMonthlySalary(m, scale) * months;
}

/** Ablöse beim Abwerben (an den alten Verein): sechs Monatsgehälter, für einen Cheftrainer ein Jahresgehalt. */
export function compensationOf(g: Game, m: StaffMember): number {
  return m.clubId ? memberMonthlySalary(m, economyScale(yearOf(g.calendar.currentDate))) * (m.coach ? 12 : 6) : 0;
}

const myRep = (g: Game) => g.clubs[g.managedClubId]?.reputation ?? 60;

/** Will die Person überhaupt kommen? Abwerben nur von gleich großen oder kleineren Vereinen; große Trainernamen meiden kleine Vereine. */
export function willMove(g: Game, m: StaffMember): boolean {
  const mine = myRep(g) + honourFx(g.managedClubId, 'coachAppeal') * 50; // Ruhige Hand
  if (m.home === g.managedClubId) return true;
  if (m.clubId) return mine >= (g.clubs[m.clubId]?.reputation ?? 60) - 4;
  return !m.coach || mine >= m.coach.rep - 10; // wie bei den KI-Vereinen (coachCarousel.ts pickSuccessor)
}
/** Grund, warum jemand nicht kommt (für die Anzeige). */
export function moveBlocker(g: Game, m: StaffMember): string | null {
  if (willMove(g, m)) return null;
  return m.clubId ? `${m.name} will ${g.clubs[m.clubId]?.name ?? 'seinen Verein'} nicht für einen kleineren Verein verlassen.` : `${m.name} wartet auf das Angebot eines größeren Vereins.`;
}

/**
 * Geforderter Gehaltsfaktor für eine Stelle (relativ zu deren Kostenklasse): nach der Eignung
 * für diese Stelle – wer in seinem Beruf deutlich mehr verdient, verlangt mindestens 80 % davon.
 */
export function demandOf(g: Game, m: StaffMember, roleId = m.roleId): number {
  const rep = myRep(g);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  let f = demandFactor(m, rep, roleQuality(m.skills, roleId, m.quality));
  const unit = memberMonthlySalary({ ...m, roleId, salaryFactor: 1 }, scale);
  // Wer in seinem Beruf (`m.roleId`) mehr verdient, als die angebotene Stelle hergibt, kommt nur für 80 % davon.
  if (m.skills && unit > 0 && m.roleId !== roleId && STAFF_BY_ID[m.roleId]) {
    const elsewhere = memberMonthlySalary({ ...m, salaryFactor: demandFactor(m, rep, roleQuality(m.skills, m.roleId, m.quality)) }, scale);
    f = Math.max(f, (0.8 * elsewhere) / unit);
  }
  f *= 1 - honourFx(g.managedClubId, 'coachAppeal') / 2; // Ruhige Hand: Leute kommen günstiger
  if (m.home === g.managedClubId) f *= 0.9; // früherer Spieler des Vereins kommt dir entgegen
  if (hasTrait(m, 'treu') && (g.staff ?? []).includes(m)) f *= 0.95;
  return Math.round(clamp(f, 0.4, 8) * 100) / 100;
}

/** Zurück auf den Arbeitsmarkt; Cheftrainer gehen in den Trainerpool der KI (und bleiben für dich sichtbar). */
function toMarket(g: Game, m: StaffMember): void {
  const today = g.calendar.currentDate, year = yearOf(today);
  const w = ensureStaffWorld(g);
  if (m.roleId === 'cheftrainer' && (m.coach || m.quality >= 8)) {
    (g.coachPool ??= []).push(toClubCoach(m, year, today, Math.random));
    return;
  }
  w.people.push({ ...m, clubId: undefined, contractEnd: undefined, freeSince: year, coach: undefined, deal: undefined });
}

/** Besetzung einer Stelle im eigenen Verein und freie Plätze. */
export function slotInfo(g: Game, roleId: string): { holders: StaffMember[]; slots: number; free: number } {
  const holders = ensureStaff(g).filter((x) => x.roleId === roleId);
  const slots = roleSlots(roleId, yearOf(g.calendar.currentDate));
  return { holders, slots, free: Math.max(0, slots - holders.length) };
}
/** Wen ein Neuer auf dieser Stelle verdrängt (niemand, solange ein Platz frei ist; sonst der Schwächste). */
export function replacedBy(g: Game, roleId: string, replaceId?: string): StaffMember | null {
  const { holders, free } = slotInfo(g, roleId);
  if (free > 0 || !holders.length) return null;
  return holders.find((x) => x.id === replaceId) ?? [...holders].sort((a, b) => roleFit(a.skills, roleId, a.quality) - roleFit(b.skills, roleId, b.quality))[0];
}

export interface HireResult { ok: boolean; text: string; member?: StaffMember }
export interface HireOpts {
  roleId?: string; replaceId?: string;
  /** Am Verhandlungstisch geeinigt (game/staffTalk.ts): keine erneute Prüfung des Angebots. */
  agreed?: boolean;
}

/** Angebot an eine Person vom Arbeitsmarkt für eine Stelle. Bei Erfolg: Anstellung. */
export function offerContract(g: Game, personId: string, offerFactor: number, years: number, opts: HireOpts = {}): HireResult {
  const w = ensureStaffWorld(g);
  const m = findPerson(g, personId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return { ok: false, text: 'Die Person ist nicht mehr verfügbar.' };
  const today = g.calendar.currentDate, year = yearOf(today);
  const roleId = opts.roleId ?? m.roleId;
  const role = STAFF_BY_ID[roleId];
  if (!role || !staffAvailable(role, year)) return { ok: false, text: 'Diese Stelle gibt es noch nicht.' };
  const block = moveBlocker(g, m);
  if (block) return { ok: false, text: block };
  if (!opts.agreed && !acceptsOffer(m, offerFactor, years, club.reputation ?? 60, demandOf(g, m, roleId))) {
    return { ok: false, text: `${m.name} lehnt ab – das Angebot liegt unter seinen Vorstellungen.` };
  }
  const staff = ensureStaff(g);
  const lines: string[] = [];
  const fee = compensationOf(g, m);
  if (fee > 0) {
    book(club.finances, today, -fee, 'staff_wages', `Ablöse ${m.name} (${g.clubs[m.clubId!]?.shortName ?? ''})`, true);
    lines.push(`Ablöse an ${g.clubs[m.clubId!]?.name ?? 'den Verein'} bezahlt.`);
  }
  const old = replacedBy(g, roleId, opts.replaceId);
  if (old) {
    const sev = severanceOf(g, old);
    book(club.finances, today, -sev, 'staff_wages', `Abfindung ${old.name}`, true);
    closeHeadCoach(g, old.id, 'entlassen');
    staff.splice(staff.indexOf(old), 1);
    toMarket(g, old);
    lines.push(`${old.name} geht (Abfindung bezahlt).`);
  }
  // Vom Markt nehmen: Person aus dem Pool, Cheftrainer aus dem Trainerpool bzw. von seinem Verein.
  let id = m.id;
  if (m.id.startsWith(COACH_ID_PREFIX)) {
    const cid = m.id.slice(COACH_ID_PREFIX.length);
    id = `sp_${cid}`;
    if (g.coachPool) g.coachPool = g.coachPool.filter((c) => c.id !== cid);
    const from = m.clubId ? g.clubs[m.clubId] : undefined;
    if (from?.coach?.id === cid) {
      depart(g, from, today, 'abgeworben');
      if (g.coachPool) g.coachPool = g.coachPool.filter((c) => c.id !== cid);
      install(g, from, pickSuccessor(g, from, today, Math.random), today, false);
    }
  } else {
    const i = w.people.indexOf(m);
    if (i >= 0) w.people.splice(i, 1);
  }
  const hired: StaffMember = {
    ...m, id, roleId, clubId: undefined, freeSince: undefined, hired: today, salaryFactor: Math.round(offerFactor * 100) / 100,
    contractEnd: `${year + years + (Number(today.slice(5, 7)) >= 7 ? 0 : -1)}-06-30`,
    loyalty: clamp(m.loyalty + (offerFactor > demandOf(g, m, roleId) * 1.1 ? 10 : 0) + (m.home === g.managedClubId ? 15 : 0), 0, 100),
  };
  syncQuality(hired);
  if (hired.skills) hired.specialty = specialtyOfSkills(hired.skills, roleId);
  staff.push(hired);
  g.hiredStaff = staff.map((x) => x.roleId);
  syncHeadCoach(g);
  return { ok: true, member: hired, text: [`${m.name} ist neuer ${roleLabel(roleId)} (bis ${hired.contractEnd!.slice(0, 4)}).`, ...lines].join(' ') };
}

/** Den besten vereinslosen Bewerber, der kommen will, zu seiner Forderung einstellen (Tests, Simulation). */
export function quickHire(g: Game, roleId: string, pick = 0): HireResult {
  const rows = staffMarket(g, { role: roleId, onlyFree: true }).filter((r) => willMove(g, r.m));
  const r = rows[pick] ?? rows[0];
  if (!r) return { ok: false, text: 'Kein Bewerber.' };
  return offerContract(g, r.m.id, demandOf(g, r.m, roleId), 2, { roleId });
}

/** Entlassen mit Abfindung; die Person kehrt auf den Arbeitsmarkt zurück. */
export function dismiss(g: Game, memberId: string): string {
  const staff = ensureStaff(g);
  const m = staff.find((x) => x.id === memberId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return '';
  const sev = severanceOf(g, m);
  book(club.finances, g.calendar.currentDate, -sev, 'staff_wages', `Abfindung ${m.name}`, true);
  closeHeadCoach(g, m.id, 'entlassen');
  staff.splice(staff.indexOf(m), 1);
  g.hiredStaff = staff.map((x) => x.roleId);
  toMarket(g, m);
  return `${m.name} wurde entlassen (Abfindung bezahlt).`;
}

/** Verlängerung erst im letzten Vertragsjahr (≤ 12 Monate Restlaufzeit), höchstens bis 4 Jahre über das laufende Spieljahr hinaus. */
export const EXTEND_WINDOW_MONTHS = 12;
export const EXTEND_MAX_YEARS = 4;

/** Darf der Vertrag jetzt verlängert werden? Grund für die Anzeige, falls nicht. */
export function canExtend(g: Game, m: StaffMember): { ok: boolean; reason?: string } {
  const today = g.calendar.currentDate;
  if (!m.contractEnd || m.contractEnd <= today) return { ok: true };
  const left = monthsLeft(m, today);
  if (left > EXTEND_WINDOW_MONTHS) return { ok: false, reason: `Vertrag läuft noch bis ${m.contractEnd.slice(0, 4)} – Verlängerung erst im letzten Vertragsjahr` };
  return { ok: true };
}

/** Vertrag des eigenen Mitarbeiters um `years` verlängern – zur aktuellen Forderung (nur im letzten Vertragsjahr). */
export function extendContract(g: Game, memberId: string, years: number): string {
  const m = ensureStaff(g).find((x) => x.id === memberId);
  if (!m) return '';
  const can = canExtend(g, m);
  if (!can.ok) return can.reason ?? '';
  const today = g.calendar.currentDate;
  const base = m.contractEnd && m.contractEnd > today ? yearOf(m.contractEnd) : yearOf(today);
  const seasonEnd = yearOf(today) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0);
  const end = Math.min(base + years, seasonEnd + EXTEND_MAX_YEARS);
  m.contractEnd = `${end}-06-30`;
  m.salaryFactor = Math.max(m.salaryFactor, demandOf(g, m));
  m.loyalty = clamp(m.loyalty + 5, 0, 100);
  return `${m.name} verlängert bis ${end}.`;
}

/** Kann der Mitarbeiter auf diese Stelle versetzt werden? */
export function canReassign(g: Game, m: StaffMember, roleId: string): { ok: boolean; reason?: string } {
  const year = yearOf(g.calendar.currentDate);
  const role = STAFF_BY_ID[roleId];
  if (!role || !staffAvailable(role, year)) return { ok: false, reason: 'Diese Stelle gibt es noch nicht.' };
  if (roleId === m.roleId) return { ok: false, reason: 'Das ist seine Stelle.' };
  if (slotInfo(g, roleId).free <= 0) return { ok: false, reason: 'Die Stelle ist besetzt.' };
  return { ok: true };
}

/**
 * Versetzen (Beförderung oder neue Aufgabe): gleiche Person, neue Stelle. Das Monatsgehalt sinkt nie;
 * verlangt die neue Stelle mehr, steigt es auf die Forderung dafür.
 */
export function reassign(g: Game, memberId: string, roleId: string): string {
  const staff = ensureStaff(g);
  const m = staff.find((x) => x.id === memberId);
  if (!m) return '';
  const can = canReassign(g, m, roleId);
  if (!can.ok) return can.reason ?? '';
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const before = memberMonthlySalary(m, scale);
  const oldRole = m.roleId, oldLevel = staffLevel(roleFit(m.skills, oldRole, m.quality));
  closeHeadCoach(g, m.id, 'gegangen');
  m.roleId = roleId;
  syncQuality(m);
  if (m.skills) m.specialty = specialtyOfSkills(m.skills, roleId);
  const unit = memberMonthlySalary({ ...m, salaryFactor: 1 }, scale);
  m.salaryFactor = Math.round(Math.max(demandOf(g, m, roleId), unit > 0 ? before / unit : m.salaryFactor) * 100) / 100;
  const up = (STAFF_BY_ID[roleId]?.costClass ?? 'K1') > (STAFF_BY_ID[oldRole]?.costClass ?? 'K1');
  m.loyalty = clamp(m.loyalty + (up ? 8 : -4), 0, 100);
  g.hiredStaff = staff.map((x) => x.roleId);
  syncHeadCoach(g);
  const now = staffLevel(roleFit(m.skills, roleId, m.quality));
  return `${m.name} ist jetzt ${roleLabel(roleId)} (Eignung ${now}, vorher ${roleLabel(oldRole)} ${oldLevel}).`;
}

/** Fortbildung möglich? Eine je Kalenderjahr. */
export function canCourse(g: Game, m: StaffMember): boolean {
  return m.course !== yearOf(g.calendar.currentDate);
}

/** Fortbildung: Methodenstand auf heute, die Fähigkeiten der Stelle rücken ein Stück ans Potenzial. Kosten: drei Monatsgehälter. */
export function sendToCourse(g: Game, memberId: string): string {
  const m = ensureStaff(g).find((x) => x.id === memberId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return '';
  const year = yearOf(g.calendar.currentDate);
  if (!canCourse(g, m)) return `${m.name} war in diesem Jahr schon auf Fortbildung.`;
  const cost = trainingCourseCost(m, economyScale(year));
  book(club.finances, g.calendar.currentDate, -cost, 'staff_wages', `Fortbildung ${m.name}`, true);
  const before = staffLevel(roleFit(m.skills, m.roleId, m.quality));
  m.methodYear = year;
  m.course = year;
  courseGain(m);
  m.loyalty = Math.min(100, m.loyalty + 8);
  const now = staffLevel(roleFit(m.skills, m.roleId, m.quality));
  return `${m.name} bildet sich fort – Methodenstand ${year}${now > before ? `, Eignung ${before} → ${now}` : ''}.`;
}

/**
 * Stab zu Spielbeginn (Wunsch Pascal: ohne Cheftrainer leidet die Entwicklung – also steht einer bereit):
 * Cheftrainer, so viele Co-Trainer, wie der Verein braucht, Masseur und Mannschaftsarzt – passend zum Ruf.
 */
export function startingStaff(g: Game, rng: () => number = Math.random): StaffMember[] {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate, year = yearOf(today);
  const target = club ? clubStaffTarget(club) : 10;
  const need = assistantsNeeded(club?.reputation ?? 60, year, club?.playerIds.length ?? 24);
  const roles = ['cheftrainer', ...Array.from({ length: need }, () => 'cotrainer'), 'masseur', 'mannschaftsarzt'].filter((id) => STAFF_BY_ID[id] && staffAvailable(STAFF_BY_ID[id], year));
  const end = `${year + (Number(today.slice(5, 7)) >= 7 ? 2 : 1)}-06-30`;
  return roles.map((roleId, i) => {
    let m: StaffMember;
    if (roleId === 'cheftrainer') {
      // Der Cheftrainer kommt aus demselben Holz wie die Trainer der anderen Vereine (engine/aiManager.ts makeCoach).
      const c = makeCoach(year, club?.reputation ?? 60, today, rng);
      m = { ...coachAsStaff(c, year), id: `sp_${c.id}` };
    } else {
      m = makeOutsider(year, rng, roleId);
      // Erster Co-Trainer auf Vereinsniveau, weitere und die Betreuer etwas darunter.
      tuneTo(m, target + (roleId === 'cotrainer' ? (i === 1 ? 0 : -2) : -2) + (rng() - 0.5) * 1.5);
    }
    m.salaryFactor = demandFactor(m, club?.reputation ?? 60);
    return { ...m, hired: today, contractEnd: end, loyalty: clamp(m.loyalty + 10, 0, 100) };
  });
}

// -----------------------------------------------------------------------------
// Saisonwechsel des eigenen Stabs
// -----------------------------------------------------------------------------
export function ownStaffSeason(g: Game, date: string, rng: () => number = Math.random): void {
  const staff = ensureStaff(g);
  const rows = g.table?.rows ?? [];
  const row = rows.find((r) => r.clubId === g.managedClubId);
  const success = row && rows.length > 1 ? 1 - (row.position - 1) / (rows.length - 1) : 0.4;
  const gone: string[] = [];
  const grown: string[] = [];
  // Ausgehandelte Erfolgsprämien (game/staffTalk.ts): fällig, wenn das Saisonziel des Vorstands erreicht ist.
  const club = g.clubs[g.managedClubId];
  const goal = club ? goalOf(g, club) : undefined;
  if (club && row && goal && row.position <= goal.expected) {
    const scale = economyScale(yearOf(date));
    const paid: string[] = [];
    for (const m of staff) {
      const months = m.deal?.bonus ?? 0;
      if (months <= 0) continue;
      const sum = memberMonthlySalary(m, scale) * months;
      book(club.finances, date, -sum, 'staff_wages', `Erfolgsprämie ${m.name}`, true);
      paid.push(`• ${m.name} (${roleLabel(m.roleId)}): ${months} ${months === 1 ? 'Monatsgehalt' : 'Monatsgehälter'}`);
    }
    if (paid.length) pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Geschäftsstelle', subject: 'Saisonziel erreicht: Erfolgsprämien für Mitarbeiter',
      shortText: `${paid.length} ${paid.length === 1 ? 'Prämie' : 'Prämien'} ausgezahlt.`,
      bodyText: `Das Saisonziel („${goal.label}“) ist erreicht. Die vereinbarten Erfolgsprämien wurden ausgezahlt:\n\n${paid.join('\n')}`,
    }));
  }
  for (const m of [...staff]) {
    if (!m.skills) skillsFromQuality(m, rng);
    const before = staffLevel(roleFit(m.skills, m.roleId, m.quality));
    learnSeason(m, true, success, rng);
    const now = staffLevel(roleFit(m.skills, m.roleId, m.quality));
    if (now !== before) grown.push(`• ${m.name} (${roleLabel(m.roleId)}): ${before} → ${now}`);
    if (m.contractEnd && m.contractEnd <= date) {
      // Ohne Verlängerung durch dich: treue Leute bleiben zu ihren Forderungen, andere gehen.
      if (m.loyalty >= 45 || hasTrait(m, 'treu') || rng() < 0.5) {
        m.contractEnd = `${yearOf(date) + 2}-06-30`;
        m.salaryFactor = Math.max(m.salaryFactor, demandOf(g, m));
        gone.push(`• ${m.name} (${roleLabel(m.roleId)}) verlängert automatisch bis ${m.contractEnd.slice(0, 4)}.`);
      } else {
        closeHeadCoach(g, m.id, 'vertragsende', date);
        staff.splice(staff.indexOf(m), 1);
        toMarket(g, m);
        gone.push(`• ${m.name} (${roleLabel(m.roleId)}) verlässt den Verein nach Vertragsende.`);
      }
    }
  }
  g.hiredStaff = staff.map((x) => x.roleId);
  if (gone.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Geschäftsstelle', subject: 'Mitarbeiter: Vertragsenden',
      shortText: gone[0].slice(2), bodyText: gone.join('\n') + '\n\nOffene Stellen besetzt du unter Training › Trainerteam bzw. Verein › Mitarbeiter.',
    }));
  }
  if (grown.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'training', from: 'Geschäftsstelle', subject: 'Deine Mitarbeiter nach der Saison',
      shortText: `${grown.length} ${grown.length === 1 ? 'Mitarbeiter hat' : 'Mitarbeiter haben'} sich verändert.`,
      bodyText: 'Wie Spieler entwickeln sich auch deine Mitarbeiter: Jüngere lernen im Beruf dazu, Ältere lassen nach. Eignung für die eigene Stelle, vorher → jetzt:\n\n' + grown.join('\n')
        + '\n\nEine Fortbildung bringt jemanden schneller voran. Wer in seiner Stelle ausgereizt ist, taugt vielleicht für eine andere – das zeigt sein Profil.',
    }));
  }
}

// -----------------------------------------------------------------------------
// Wirkung auf das Training
// -----------------------------------------------------------------------------
const CATEGORY_SKILL: Partial<Record<TrainingBlockCategory, CoachSkill>> = {
  conditioning: 'fitness', speed: 'fitness', strength: 'fitness', athletics: 'fitness',
  technique: 'technik', passing: 'technik', shooting: 'technik', heading: 'technik', setpieces: 'technik',
  defending: 'taktik', tactics: 'taktik', matchplay: 'taktik',
  goalkeeping: 'torwart', mental: 'mental', analysis: 'analyse',
};

/** Bester Wert des Trainerteams in einem Fachgebiet (Methodenstand berücksichtigt). */
export function teamSkill(staff: StaffMember[], skill: CoachSkill, year: number): number {
  let best = 0;
  for (const m of staff) {
    if (!m.skills) continue;
    // Trainer helfen überall mit; alle anderen zählen nur mit dem, was ihre Stelle ausmacht (der Arzt mit Medizin).
    if (!TEAM_ROLE_IDS.has(m.roleId) && !ROLE_SKILLS[m.roleId]?.[skill]) continue;
    const v = (m.skills[skill] ?? 0) * (effectiveQuality(m, year) / Math.max(1, m.quality));
    if (v > best) best = v;
  }
  return best;
}

/** Fachgebiet, das einen Baustein anleitet. */
export function skillForBlock(b: TrainingBlock): CoachSkill | null {
  return CATEGORY_SKILL[b.category] ?? null;
}

/**
 * Lernfaktor je Baustein: 0,85 (niemand vom Fach, nur du) … 1,2 (Spitzenkraft).
 * Videoanalyse ohne Analyst wirkt nur halb.
 */
export function blockFactorFn(g: Game): (b: TrainingBlock) => number {
  const staff = ensureStaff(g);
  const year = yearOf(g.calendar.currentDate);
  const cache = new Map<CoachSkill, number>();
  // Privatleben: Trainingslehre und Energie des Managers (game/private/privateState.ts).
  const priv = privateTrainingFactor(g);
  return (b) => {
    const sk = skillForBlock(b);
    if (!sk) return priv;
    if (!cache.has(sk)) cache.set(sk, teamSkill(staff, sk, year));
    const v = cache.get(sk)!;
    if (sk === 'analyse' && v < 6) return 0.55 * priv;
    return clamp(0.85 + v / 20 * 0.35, 0.85, 1.2) * priv;
  };
}

/** Senkung des Trainings-Verletzungsrisikos durch Fitness-/Medizinwissen (0 … 0,3). */
export function trainingInjuryReduction(g: Game): number {
  const staff = ensureStaff(g);
  const year = yearOf(g.calendar.currentDate);
  return clamp((teamSkill(staff, 'fitness', year) * 0.6 + teamSkill(staff, 'medizin', year) * 0.4) / 20 * 0.3, 0, 0.3);
}

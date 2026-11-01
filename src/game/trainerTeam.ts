// =============================================================================
// TRAINERTEAM DES EIGENEN VEREINS (Seite Training › Trainerteam)
// -----------------------------------------------------------------------------
// Anstellen mit Gehaltsverhandlung (auch Abwerben gegen Ablöse), Entlassen mit
// Abfindung nach Restlaufzeit, Vertragsende zum 30.6., Lernen im Beruf.
// Wirkung: Lernfaktor je Trainingsbaustein aus den Fachgebieten (Trainingsplan),
// weniger Trainingsverletzungen durch Fitness-/Medizinwissen; Entwicklung und
// Verletzungs-/Reha-Effekte laufen weiter über Mitarbeiter 2.0 (staffPeople.ts).
// =============================================================================
import { Game } from './state';
import { TrainingBlock, TrainingBlockCategory } from '../types';
import { STAFF_BY_ID } from '../data/staff';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { effectiveQuality, memberMonthlySalary, StaffMember } from '../engine/staffPeople';
import { acceptsOffer, CoachSkill, demandFactor, learnSeason, skillsFromQuality, TEAM_ROLE_LABEL } from '../engine/staffSkills';
import { ensureStaff } from './staffGame';
import { ensureStaffWorld } from './staffWorld';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function roleLabel(roleId: string): string {
  return TEAM_ROLE_LABEL[roleId] ?? STAFF_BY_ID[roleId]?.name ?? roleId;
}

/** Monate bis Vertragsende (mind. 0). */
export function monthsLeft(m: StaffMember, today: string): number {
  if (!m.contractEnd) return 12;
  const a = new Date(today + 'T00:00:00Z'), b = new Date(m.contractEnd + 'T00:00:00Z');
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth());
}

/** Abfindung: halbe Restlaufzeit, mindestens zwei, höchstens 18 Monatsgehälter. */
export function severanceOf(g: Game, m: StaffMember): number {
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const months = clamp(Math.round(monthsLeft(m, g.calendar.currentDate) * 0.5), 2, 18);
  return memberMonthlySalary(m, scale) * months;
}

/** Ablöse beim Abwerben: sechs Monatsgehälter (beim alten Verein). */
export function compensationOf(g: Game, m: StaffMember): number {
  return m.clubId ? memberMonthlySalary(m, economyScale(yearOf(g.calendar.currentDate))) * 6 : 0;
}

/** Will die Person überhaupt wechseln? (Abwerben nur von gleich großen oder kleineren Vereinen) */
export function willMove(g: Game, m: StaffMember): boolean {
  if (!m.clubId) return true;
  const mine = g.clubs[g.managedClubId]?.reputation ?? 60;
  const theirs = g.clubs[m.clubId]?.reputation ?? 60;
  return mine >= theirs - 4;
}

export function demandOf(g: Game, m: StaffMember): number {
  return demandFactor(m, g.clubs[g.managedClubId]?.reputation ?? 60);
}

function toMarket(g: Game, m: StaffMember): void {
  const w = ensureStaffWorld(g);
  w.people.push({ ...m, clubId: undefined, contractEnd: undefined, freeSince: yearOf(g.calendar.currentDate) });
}

export interface HireResult { ok: boolean; text: string }

/** Angebot an eine Person vom Arbeitsmarkt. Bei Erfolg: Anstellung (ersetzt die bisherige Besetzung der Rolle). */
export function offerContract(g: Game, personId: string, offerFactor: number, years: number): HireResult {
  const w = ensureStaffWorld(g);
  const m = w.people.find((x) => x.id === personId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return { ok: false, text: 'Die Person ist nicht mehr verfügbar.' };
  if (!willMove(g, m)) return { ok: false, text: `${m.name} möchte bei ${g.clubs[m.clubId!]?.name ?? 'seinem Verein'} bleiben.` };
  if (!acceptsOffer(m, offerFactor, years, club.reputation ?? 60)) {
    return { ok: false, text: `${m.name} lehnt ab – das Angebot liegt unter seinen Vorstellungen.` };
  }
  const today = g.calendar.currentDate;
  const staff = ensureStaff(g);
  const lines: string[] = [];
  const fee = compensationOf(g, m);
  if (fee > 0) {
    book(club.finances, today, -fee, 'staff_wages', `Ablöse ${m.name} (${g.clubs[m.clubId!]?.shortName ?? ''})`, true);
    lines.push(`Ablöse an ${g.clubs[m.clubId!]?.name ?? 'den Verein'} bezahlt.`);
  }
  const old = staff.find((x) => x.roleId === m.roleId);
  if (old) {
    const sev = severanceOf(g, old);
    book(club.finances, today, -sev, 'staff_wages', `Abfindung ${old.name}`, true);
    staff.splice(staff.indexOf(old), 1);
    toMarket(g, old);
    lines.push(`${old.name} geht (Abfindung bezahlt).`);
  }
  w.people.splice(w.people.indexOf(m), 1);
  const hired: StaffMember = {
    ...m, clubId: undefined, freeSince: undefined, hired: today, salaryFactor: Math.round(offerFactor * 100) / 100,
    contractEnd: `${yearOf(today) + years + (Number(today.slice(5, 7)) >= 7 ? 0 : -1)}-06-30`,
    loyalty: clamp(m.loyalty + (offerFactor > demandOf(g, m) * 1.1 ? 10 : 0), 0, 100),
  };
  staff.push(hired);
  g.hiredStaff = staff.map((x) => x.roleId);
  return { ok: true, text: [`${m.name} ist neuer ${roleLabel(m.roleId)} (bis ${hired.contractEnd!.slice(0, 4)}).`, ...lines].join(' ') };
}

/** Entlassen mit Abfindung; die Person kehrt auf den Arbeitsmarkt zurück. */
export function dismiss(g: Game, memberId: string): string {
  const staff = ensureStaff(g);
  const m = staff.find((x) => x.id === memberId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return '';
  const sev = severanceOf(g, m);
  book(club.finances, g.calendar.currentDate, -sev, 'staff_wages', `Abfindung ${m.name}`, true);
  staff.splice(staff.indexOf(m), 1);
  g.hiredStaff = staff.map((x) => x.roleId);
  toMarket(g, m);
  return `${m.name} wurde entlassen (Abfindung bezahlt).`;
}

/** Vertrag des eigenen Mitarbeiters um `years` verlängern – zur aktuellen Forderung. */
export function extendContract(g: Game, memberId: string, years: number): string {
  const m = ensureStaff(g).find((x) => x.id === memberId);
  if (!m) return '';
  const base = m.contractEnd && m.contractEnd > g.calendar.currentDate ? yearOf(m.contractEnd) : yearOf(g.calendar.currentDate);
  m.contractEnd = `${base + years}-06-30`;
  m.salaryFactor = Math.max(m.salaryFactor, demandOf(g, m));
  m.loyalty = clamp(m.loyalty + 5, 0, 100);
  return `${m.name} verlängert bis ${m.contractEnd.slice(0, 4)}.`;
}

// -----------------------------------------------------------------------------
// Saisonwechsel des eigenen Trainerteams
// -----------------------------------------------------------------------------
export function ownStaffSeason(g: Game, date: string, rng: () => number = Math.random): void {
  const staff = ensureStaff(g);
  const rows = g.table?.rows ?? [];
  const row = rows.find((r) => r.clubId === g.managedClubId);
  const success = row && rows.length > 1 ? 1 - (row.position - 1) / (rows.length - 1) : 0.4;
  const gone: string[] = [];
  for (const m of [...staff]) {
    if (!m.skills) skillsFromQuality(m, rng);
    learnSeason(m, true, success, rng);
    if (m.contractEnd && m.contractEnd <= date) {
      // Ohne Verlängerung durch dich: treue Leute bleiben zu ihren Forderungen, andere gehen.
      if (m.loyalty >= 45 || rng() < 0.5) {
        m.contractEnd = `${yearOf(date) + 2}-06-30`;
        m.salaryFactor = Math.max(m.salaryFactor, demandOf(g, m));
        gone.push(`• ${m.name} (${roleLabel(m.roleId)}) verlängert automatisch bis ${m.contractEnd.slice(0, 4)}.`);
      } else {
        staff.splice(staff.indexOf(m), 1);
        toMarket(g, m);
        gone.push(`• ${m.name} (${roleLabel(m.roleId)}) verlässt den Verein nach Vertragsende.`);
      }
    }
  }
  g.hiredStaff = staff.map((x) => x.roleId);
  if (gone.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Geschäftsstelle', subject: 'Trainerteam: Vertragsenden',
      shortText: gone[0].slice(2), bodyText: gone.join('\n') + '\n\nOffene Stellen besetzt du unter Training › Trainerteam.',
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
  return (b) => {
    const sk = skillForBlock(b);
    if (!sk) return 1;
    if (!cache.has(sk)) cache.set(sk, teamSkill(staff, sk, year));
    const v = cache.get(sk)!;
    if (sk === 'analyse' && v < 6) return 0.55;
    return clamp(0.85 + v / 20 * 0.35, 0.85, 1.2);
  };
}

/** Senkung des Trainings-Verletzungsrisikos durch Fitness-/Medizinwissen (0 … 0,3). */
export function trainingInjuryReduction(g: Game): number {
  const staff = ensureStaff(g);
  const year = yearOf(g.calendar.currentDate);
  return clamp((teamSkill(staff, 'fitness', year) * 0.6 + teamSkill(staff, 'medizin', year) * 0.4) / 20 * 0.3, 0, 0.3);
}

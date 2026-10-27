// =============================================================================
// Mitarbeiter 2.0 im Spielablauf: Personen verwalten, Wirkung auf Training,
// Monatsbericht des Trainerstabs, Wechsel zum Saisonende.
// =============================================================================
import { Game } from './state';
import { Club, Player } from '../types';
import { STAFF_BY_ID, StaffEffects, computeStaffEffects } from '../data/staff';
import { clubTrainingFactor, ClubDevContext, truePotential } from '../engine/development';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { recordInjury } from '../engine/history';
import {
  coachingReport, effectiveQuality, FOCUS_LABEL, focusEffect, makeCandidates, memberMonthlySalary, methodFactor,
  migrateStaff, phaseOf, specialistBoost, StaffMember, staffEffectsFromMembers, staffSeasonTurnover, TrainingFocus,
  trainingCourseCost,
} from '../engine/staffPeople';

export const MAX_FOERDER = 3;

/** Alte Spielstände: Rollen-Liste in Personen umwandeln; Rollen-Spiegel aktuell halten. */
export function ensureStaff(g: Game): StaffMember[] {
  if (!g.staff) g.staff = migrateStaff(g.hiredStaff ?? [], yearOf(g.calendar.currentDate), Math.random);
  g.hiredStaff = g.staff.map((m) => m.roleId);
  return g.staff;
}

export function staffEffectsOf(g: Game): StaffEffects {
  if (!g.staff) return computeStaffEffects(g.hiredStaff ?? []);
  return staffEffectsFromMembers(g.staff, yearOf(g.calendar.currentDate));
}

export function currentFocus(g: Game, date: string): TrainingFocus {
  return g.trainingFocus?.[phaseOf(date)] ?? 'balance';
}

/** Entwicklungs-Kontext je Verein (für weeklyDevelopment). */
export function devContextFor(g: Game, date: string): (club: Club) => ClubDevContext {
  const year = yearOf(date);
  const staff = ensureStaff(g);
  const focus = currentFocus(g, date);
  const foerder = new Set(g.foerderSpieler ?? []);
  return (club) => {
    if (club.id !== g.managedClubId) {
      // KI-Vereine: Trainerstab-Qualität über die Vereinsgröße angenähert.
      const extra = Math.max(-0.03, Math.min(0.1, ((club.reputation ?? 60) - 60) / 350));
      return { training: clubTrainingFactor(club, extra), environment: 1 };
    }
    const rep = coachingReport(staff, club.playerIds.length, year);
    const capOk = rep.capacity >= 0.8;
    return {
      training: clubTrainingFactor(club, rep.extra),
      environment: 1,
      playerFactor: (p: Player) => {
        let f = specialistBoost(staff, p, year) * focusEffect(focus, p).dev;
        if (foerder.size) f *= foerder.has(p.id) ? (capOk ? 1.25 : 1.15) : 0.97;
        return f;
      },
    };
  };
}

// -----------------------------------------------------------------------------
// Personalentscheidungen (aus der Mitarbeiter-Seite)
// -----------------------------------------------------------------------------
export function candidatesFor(g: Game, roleId: string): StaffMember[] {
  const year = yearOf(g.calendar.currentDate);
  const club = g.clubs[g.managedClubId];
  // Deterministisch je Rolle und Monat: Neuladen der Seite würfelt nicht neu.
  let seed = 0;
  const key = `${roleId}:${g.calendar.currentDate.slice(0, 7)}:${g.managedClubId}`;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  return makeCandidates(roleId, year, club?.reputation ?? 60, r);
}

export function hireStaff(g: Game, cand: StaffMember): string {
  const staff = ensureStaff(g);
  const old = staff.find((m) => m.roleId === cand.roleId);
  if (old) staff.splice(staff.indexOf(old), 1);
  staff.push({ ...cand, hired: g.calendar.currentDate });
  g.hiredStaff = staff.map((m) => m.roleId);
  const role = STAFF_BY_ID[cand.roleId];
  return `${cand.name} ist neuer ${role?.name ?? 'Mitarbeiter'}${old ? ` (ersetzt ${old.name})` : ''}.`;
}

export function fireStaff(g: Game, memberId: string): string {
  const staff = ensureStaff(g);
  const m = staff.find((x) => x.id === memberId);
  if (!m) return '';
  const scale = economyScale(yearOf(g.calendar.currentDate));
  // Abfindung: zwei Monatsgehälter.
  const club = g.clubs[g.managedClubId];
  const sev = memberMonthlySalary(m, scale) * 2;
  if (club) book(club.finances, g.calendar.currentDate, -sev, 'staff_wages', `Abfindung ${m.name}`, true);
  staff.splice(staff.indexOf(m), 1);
  g.hiredStaff = staff.map((x) => x.roleId);
  return `${m.name} wurde entlassen (Abfindung bezahlt).`;
}

export function sendToCourse(g: Game, memberId: string): string {
  const m = ensureStaff(g).find((x) => x.id === memberId);
  const club = g.clubs[g.managedClubId];
  if (!m || !club) return '';
  const year = yearOf(g.calendar.currentDate);
  const cost = trainingCourseCost(m, economyScale(year));
  book(club.finances, g.calendar.currentDate, -cost, 'staff_wages', `Fortbildung ${m.name}`, true);
  m.methodYear = year;
  m.loyalty = Math.min(100, m.loyalty + 8);
  return `${m.name} bildet sich fort – Methodenstand ${year}.`;
}

export function setFoerder(g: Game, ids: string[]): void {
  g.foerderSpieler = ids.slice(0, MAX_FOERDER);
}

// -----------------------------------------------------------------------------
// Monatsbericht des Trainerstabs (1. des Monats)
// -----------------------------------------------------------------------------
export function monthlyTrainingReport(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const staff = ensureStaff(g);
  const year = yearOf(today);
  const players = club.playerIds.map((id) => g.players[id]).filter(Boolean) as Player[];
  const snap = g.devReportSnapshot ?? {};
  const deltas = players.map((p) => {
    const now = p.development.devPoints ?? 0;
    const before = snap[p.id] ?? 0;
    // Nach einer Bewertungsrunde wurden Punkte ausgezahlt: dann zählt der neue Stand.
    return { p, d: now < before - 0.01 ? now : now - before };
  });
  g.devReportSnapshot = Object.fromEntries(players.map((p) => [p.id, p.development.devPoints ?? 0]));
  if (!Object.keys(snap).length) return; // erster Monat: nur Basis setzen

  const head = staff.find((m) => m.roleId === 'cotrainer') ?? staff.find((m) => m.roleId === 'cheftrainer');
  const q = head ? effectiveQuality(head, year) : 6;
  // Gute Trainer erkennen Tendenzen zuverlässiger: Rauschen sinkt mit Qualität.
  const noisy = deltas.map((x) => ({ ...x, s: x.d + (Math.random() - 0.5) * (1.6 - q / 14) }));
  const up = [...noisy].sort((a, b) => b.s - a.s).slice(0, 3).filter((x) => x.s > 0.15);
  const flat = noisy.filter((x) => x.p.age <= 26 && x.s <= 0.05 && truePotential(x.p) - x.p.overall > 3).slice(0, 3);
  const lowMinutes = players.filter((p) => p.age <= 23 && (p.development.recentMinutes ?? 0) < 120).slice(0, 3);
  const rep = coachingReport(staff, players.length, year);
  const focus = currentFocus(g, today);
  const outdated = staff.filter((m) => methodFactor(m, year) < 0.9);
  const foerder = (g.foerderSpieler ?? []).map((id) => g.players[id]).filter(Boolean) as Player[];

  const lines: string[] = [];
  lines.push(`Schwerpunkt dieser Phase: ${FOCUS_LABEL[focus]}.`);
  if (up.length) lines.push('', 'Auffällig gute Fortschritte:', ...up.map((x) => `• ${x.p.fullName} (${x.p.naturalPosition}, ${x.p.age})`));
  if (flat.length) lines.push('', 'Stagniert trotz Luft nach oben:', ...flat.map((x) => `• ${x.p.fullName}`));
  if (lowMinutes.length) lines.push('', 'Brauchen Spielpraxis:', ...lowMinutes.map((p) => `• ${p.fullName} (${p.age})`));
  if (foerder.length) lines.push('', 'Förderspieler:', ...foerder.map((p) => {
    const x = deltas.find((d) => d.p.id === p.id);
    return `• ${p.fullName}: ${x && x.d > 0.4 ? 'zieht richtig an' : x && x.d > 0.1 ? 'auf gutem Weg' : 'braucht noch Zeit'}`;
  }));
  if (rep.capacity < 0.8) lines.push('', `Der Kader ist für das Trainerteam zu groß (Betreuung ${Math.round(rep.capacity * 100)} %). Ein weiterer Trainer würde helfen.`);
  if (outdated.length) lines.push('', `Veraltete Methoden: ${outdated.map((m) => m.name).join(', ')} – eine Fortbildung lohnt sich.`);
  if (!head) lines.push('', 'Ohne Co- oder Cheftrainer sind diese Eindrücke nur grob.');

  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: head ? `${head.name} (Trainerstab)` : 'Trainerstab',
    subject: `Trainingsbericht ${today.slice(5, 7)}/${today.slice(0, 4)}`,
    shortText: up.length ? `Stark: ${up.map((x) => x.p.lastName).join(', ')}` : 'Ruhiger Monat im Training.',
    bodyText: lines.join('\n'),
  }));
}

// -----------------------------------------------------------------------------
// Saisonwechsel
// -----------------------------------------------------------------------------
export function staffSeasonChange(g: Game, date: string): void {
  const staff = ensureStaff(g);
  const club = g.clubs[g.managedClubId];
  const rivals = Object.values(g.clubs).filter((c) => c.id !== g.managedClubId && !c.id.startsWith('am') && !c.id.startsWith('eu_') && !c.id.startsWith('w_') && (c.reputation ?? 0) >= (club?.reputation ?? 60));
  const pick = () => (rivals.length ? rivals[Math.floor(Math.random() * rivals.length)].name : 'einem Verein aus dem Ausland');
  const res = staffSeasonTurnover(staff, club?.reputation ?? 60, yearOf(date), Math.random, pick);
  g.hiredStaff = staff.map((m) => m.roleId);
  if (res.left.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Geschäftsstelle',
      subject: `Personal: ${res.left.length} Abgang${res.left.length > 1 ? 'änge' : ''}`,
      shortText: res.left.map((l) => l.m.name).join(', '),
      bodyText: res.left.map((l) => `• ${l.m.name} (${STAFF_BY_ID[l.m.roleId]?.name ?? ''}, Qualität ${l.m.quality}) ${l.reason}.`).join('\n')
        + '\n\nDie Stellen kannst du unter Verein → Mitarbeiter neu besetzen.',
    }));
  }
}

// -----------------------------------------------------------------------------
// Belastung der Trainingsphilosophie (täglich, nur eigener Verein)
// -----------------------------------------------------------------------------
/**
 * „Hohe Belastung“ kostet Frische und erhöht das Risiko kleiner Trainings-
 * verletzungen, „Schonung“ gibt etwas Frische zurück. Medizinisches Personal senkt
 * das Risiko (injuryReduction).
 */
export function applyFocusLoad(g: Game, club: Club, today: string, injuryReduction: number): void {
  const focus = currentFocus(g, today);
  if (focus !== 'belastung' && focus !== 'regeneration') return;
  for (const id of club.playerIds) {
    const p = g.players[id];
    if (!p || p.injury) continue;
    if (focus === 'regeneration') { p.frische = Math.min(100, (p.frische ?? 100) + 0.8); continue; }
    p.frische = Math.max(0, (p.frische ?? 100) - 1.2);
    const risk = 0.0007 * (1 - injuryReduction) * ((p.frische ?? 100) < 60 ? 1.8 : 1);
    if (g.injuriesEnabled && Math.random() < risk) {
      const days = 4 + Math.floor(Math.random() * 14);
      const ret = new Date(Date.parse(today + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
      const inj = {
        id: `inj-t-${today}-${Math.floor(Math.random() * 1e6)}`, type: 'fatigue' as const, severity: (days > 10 ? 'moderate' : 'minor') as 'moderate' | 'minor',
        description: 'Überlastung im Training', startDate: today, expectedReturnDate: ret,
        daysRemaining: days, totalDays: days, fromTraining: true,
      };
      p.injury = inj;
      p.availability = 'injured';
      recordInjury(p, inj);
      pushMessage(g.messages, makeMessage({
        date: today, category: 'injury', from: 'Mannschaftsarzt',
        subject: `${p.fullName} fällt nach Überlastung aus`,
        shortText: `Voraussichtlich ${days} Tage.`,
        bodyText: `${p.fullName} hat sich im Training überlastet und fällt etwa ${days} Tage aus. Die hohe Trainingsbelastung fordert ihren Tribut.`,
      }));
    }
  }
}

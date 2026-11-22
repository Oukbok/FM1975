// =============================================================================
// Mitarbeiter im Spielablauf: Wirkung auf Training und Entwicklung,
// Monatsbericht des Trainerstabs, Wechsel zum Saisonende, Stab → Spielstärke.
// Einstellen/Versetzen/Entlassen: game/trainerTeam.ts. Niveau des Trainerteams
// gegenüber den Spielern: game/coachingGame.ts (Rechnung engine/coaching.ts).
// =============================================================================
import { Game } from './state';
import { Club, Player } from '../types';
import { STAFF_BY_ID, StaffEffects, computeStaffEffects } from '../data/staff';
import { setStaffFactor } from '../engine/honourEffects';
import { clubTrainingFactor, ClubDevContext, truePotential } from '../engine/development';
import { yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { recordInjury } from '../engine/history';
import {
  effectiveQuality, FOCUS_LABEL, focusEffect, methodFactor,
  migrateStaff, phaseOf, specialistBoost, StaffMember, topSpecialty, staffEffectsFromMembers, staffSeasonTurnover, TrainingFocus,
} from '../engine/staffPeople';
import { skillsFromQuality } from '../engine/staffGen';
import { staffLevel } from '../engine/staffSkills';
import { aiStaffExtras, staffMovedTo, staffWorldSeason } from './staffWorld';
import { eraWeight, staffedClubs, staffIndex, STAFF_W } from './staffAi';
import { isLeagueClub } from '../engine/clubEconomy';
import { ownStaffSeason } from './trainerTeam';
import { bindCoaching, ownCoaching } from './coachingGame';
import { closeHeadCoach } from './headCoaches';
import { planDevFactor } from './trainingWeek';

export const MAX_FOERDER = 3;

/** Alte Spielstände: Rollen-Liste in Personen umwandeln; Rollen-Spiegel aktuell halten. */
export function ensureStaff(g: Game): StaffMember[] {
  if (!g.staff) g.staff = migrateStaff(g.hiredStaff ?? [], yearOf(g.calendar.currentDate), Math.random);
  for (const m of g.staff) {
    if (!m.skills || m.skills.organisation == null) skillsFromQuality(m, Math.random);
    if (!m.contractEnd) m.contractEnd = `${yearOf(g.calendar.currentDate) + (Number(g.calendar.currentDate.slice(5, 7)) >= 7 ? 2 : 1)}-06-30`;
  }
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
  const aiExtra = aiStaffExtras(g);
  const plan = planDevFactor(g);
  // Niveau der Trainerteams aller Vereine für diese Woche hinterlegen (Decke/Lerntempo je Spieler).
  bindCoaching(g);
  const sim = !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
  return (club) => {
    if (club.id !== g.managedClubId || sim) {
      // KI-Vereine: Vereinsgröße und (halb) das eigene Trainerteam vom Arbeitsmarkt (game/staffWorld.ts).
      const byRep = Math.max(-0.03, Math.min(0.1, ((club.reputation ?? 60) - 60) / 350));
      const team = aiExtra.get(club.id);
      const extra = team == null ? byRep : (byRep + team) / 2;
      return { training: clubTrainingFactor(club, extra), environment: 1 };
    }
    // Eigener Verein: Güte der Trainer, Abzüge ohne Cheftrainer bzw. mit zu wenigen Co-Trainern (engine/coaching.ts).
    const team = ownCoaching(g);
    const staffed = team.capacity >= 0.8;
    const facilities = clubTrainingFactor(club, 0);
    const withQuality = clubTrainingFactor(club, team.quality);
    const training = clubTrainingFactor(club, team.extra);
    // Ursachen je Spieler (Produkt = playerFactor) – für die Begründung der Bewertung (engine/devLog.ts).
    const parts = (p: Player): [string, number][] => [
      [`spezial:${topSpecialty(staff, p, year) ?? 'allround'}`, specialistBoost(staff, p, year)],
      ['talentfoerderer', p.age <= 21 ? team.youthBoost : 1],
      [`fokus:${focus}`, focusEffect(focus, p).dev],
      ['plan', plan],
      ['foerder', foerder.size ? (foerder.has(p.id) ? (staffed ? 1.25 : 1.15) : 0.97) : 1],
    ];
    return {
      training,
      environment: 1,
      // Anlagen/Vereinsgröße ↔ Güte des Trainerteams ↔ fehlende Besetzung (Rest des Trainingsfaktors).
      trainingParts: [['anlagen', facilities], ['trainer', withQuality / facilities], ['besetzung', training / withQuality]],
      playerFactor: (p: Player) => parts(p).reduce((f, [, x]) => f * x, 1),
      playerParts: parts,
    };
  };
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
  const team = ownCoaching(g);
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
  if (!team.head) lines.push('', 'Uns fehlt ein Cheftrainer. Ohne ihn leidet das Training deutlich – die Spieler entwickeln sich langsamer und kommen weniger weit.');
  if (team.missing > 0) lines.push('', `Für einen Verein unserer Größe ${team.missing === 1 ? 'fehlt ein Co-Trainer' : `fehlen ${team.missing} Co-Trainer`} (${team.assistants.length} von ${team.need} besetzt). Das kostet Trainingsqualität.`);
  {
    // Wem kann das Trainerteam nichts mehr beibringen? (Niveau klar unter dem Spieler)
    const lvl = Math.round(team.level);
    const above = players.filter((p) => p.age <= 28 && p.naturalPosition !== 'TW' && p.overall >= lvl + 4).sort((a, b) => b.overall - a.overall).slice(0, 3);
    if (above.length) lines.push('', `Über dem Niveau des Trainerteams (${lvl}): ${above.map((p) => p.fullName).join(', ')} – ihnen können wir nur noch wenig beibringen.`);
  }
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
  const rivals = Object.values(g.clubs).filter((c) => c.id !== g.managedClubId && !c.guest && !c.id.startsWith('am') && !c.id.startsWith('eu_') && !c.id.startsWith('w_') && (c.reputation ?? 0) >= (club?.reputation ?? 60));
  const picked: (Club | null)[] = [];
  const pick = () => { const c = rivals.length ? rivals[Math.floor(Math.random() * rivals.length)] : null; picked.push(c); return c ? c.name : 'einem Verein aus dem Ausland'; };
  // Abwerben eigener Leute läuft über Angebote mit Wahl (game/staffPoach.ts); hier nur noch der Ruhestand.
  const res = staffSeasonTurnover(staff, club?.reputation ?? 60, yearOf(date), Math.random, pick, !g.staffWorld?.ai);
  for (const l of res.left) {
    const retired = l.reason.startsWith('geht in den Ruhestand');
    closeHeadCoach(g, l.m.id, retired ? 'ruhestand' : 'abgeworben', date);
    // Abgeworbene arbeiten beim neuen Verein weiter (und lassen sich von dort zurückholen).
    if (!retired) { const to = picked.shift(); if (to) staffMovedTo(g, l.m, to.id, date); }
  }
  g.hiredStaff = staff.map((m) => m.roleId);
  // Trainerteam: Lernen/Vertragsenden des eigenen Stabs, dann der ganze Arbeitsmarkt.
  ownStaffSeason(g, date);
  staffWorldSeason(g, date);
  if (res.left.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Geschäftsstelle',
      subject: `Personal: ${res.left.length} ${res.left.length > 1 ? 'Abgänge' : 'Abgang'}`,
      shortText: res.left.map((l) => l.m.name).join(', '),
      bodyText: res.left.map((l) => `• ${l.m.name} (${STAFF_BY_ID[l.m.roleId]?.name ?? ''}, Eignung ${staffLevel(l.m.quality)}) ${l.reason}.`).join('\n')
        + '\n\nDie Stellen besetzt du unter Training › Trainerteam bzw. Verein › Mitarbeiter neu.',
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

// -----------------------------------------------------------------------------
// Stab und Spielstärke (Wunsch Pascal): Jede Stelle wirkt nur wenig, zusammen aber
// spürbar. Abdeckung = gewichtete, nach Qualität bewertete Besetzung der in der
// Epoche üblichen Stellen (nur freigeschaltete, Gewichte `STAFF_W` in staffAi.ts).
// Ohne Stab bis −4 %, Spitzenstab stufenlos bis +2 % (Abdeckung 1,0 → 1,1);
// 1975 halb so viel, ab 2010 voll. Gilt für JEDEN Verein mit Stab – den eigenen
// (g.staff) und die KI-Vereine (Personen im Pool, game/staffAi.ts). Auslands-
// vereine mit vollem Kader (Europapokal) bekommen den Wert eines Stabs, wie ihn
// ein Verein ihrer Größe hätte (`expectedStaffFactor`).
// -----------------------------------------------------------------------------
export { STAFF_W } from './staffAi';

/** Faktor auf die Spielstärke aus der Abdeckung (gleiche Formel für alle Vereine). */
export function staffFactorOf(coverage: number, year: number): number {
  const eraW = eraWeight(year);
  if (coverage < 1) return 1 - 0.04 * eraW * (1 - coverage);
  return 1 + 0.02 * eraW * Math.min(1, (coverage - 1) / 0.1);
}

/** Abdeckung 0…1,1 und Faktor für eine Liste von Mitarbeitern (je Stelle zählt der Beste). */
export function staffStrengthFor(members: StaffMember[], year: number): { coverage: number; factor: number } {
  let avail = 0, have = 0;
  const best = new Map<string, number>();
  for (const m of members) {
    if (!STAFF_W[m.roleId]) continue;
    best.set(m.roleId, Math.max(best.get(m.roleId) ?? 0, Math.min(1.1, effectiveQuality(m, year) / 14)));
  }
  for (const [id, w] of Object.entries(STAFF_W)) {
    const role = STAFF_BY_ID[id];
    if (!role || role.unlockYear > year || (role.obsoleteYear != null && role.obsoleteYear <= year)) continue;
    avail += w;
    have += w * (best.get(id) ?? 0);
  }
  const coverage = avail ? have / avail : 1;
  return { coverage, factor: staffFactorOf(coverage, year) };
}

/** Abdeckung/Faktor eines Vereins: eigener Verein aus deinem Stab, KI-Vereine aus ihren Leuten im Pool. */
export function staffStrengthOf(g: Game, clubId = g.managedClubId): { coverage: number; factor: number } {
  const year = yearOf(g.calendar.currentDate);
  const sim = !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
  if (clubId === g.managedClubId && !sim) return staffStrengthFor(g.staff ?? [], year);
  return staffStrengthFor((g.staffWorld?.people ?? []).filter((m) => m.clubId === clubId), year);
}

/** Erwarteter Faktor eines Vereins mit diesem Ruf (Stab nach `aiStaffTarget`, alle Stellen besetzt). */
export function expectedStaffFactor(rep: number, year: number): number {
  const q = Math.max(4, Math.min(18, 3 + rep * 0.13 + eraWeight(year) * (rep - 70) / 12));
  return staffFactorOf(Math.min(1.1, q / 14) * 0.92, year);
}

/** Täglich/beim Laden: Faktoren aller Vereine mit Stab für die Match-Engine setzen. */
export function bindStaffFactor(g: Game): void {
  const year = yearOf(g.calendar.currentDate);
  const sim = !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
  const t: Record<string, number> = {};
  if (g.staffWorld?.ai) {
    const idx = staffIndex(g);
    for (const c of staffedClubs(g)) t[c.id] = staffStrengthFor(idx.get(c.id) ?? [], year).factor;
    // Auslandsvereine mit vollem Kader (Europapokal): Stab wie ein Verein ihrer Größe.
    for (const c of Object.values(g.clubs)) if (!isLeagueClub(c)) t[c.id] = expectedStaffFactor(c.reputation ?? 60, year);
  }
  if (!sim && g.clubs[g.managedClubId]) t[g.managedClubId] = staffStrengthFor(g.staff ?? [], year).factor;
  setStaffFactor(t);
}

/** Verletzungsrisiko-Senkung je KI-Verein aus seinem medizinischen Personal (gleiche Rechnung wie beim eigenen Verein). */
export function aiInjuryReductions(g: Game): Map<string, number> {
  const out = new Map<string, number>();
  if (!g.staffWorld?.ai) return out;
  const year = yearOf(g.calendar.currentDate);
  for (const [id, list] of staffIndex(g)) if (g.clubs[id]) out.set(id, staffEffectsFromMembers(list, year).injuryReduction);
  return out;
}

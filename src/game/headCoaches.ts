// =============================================================================
// DEINE CHEFTRAINER — Historie der Angestellten auf der Trainerbank
// -----------------------------------------------------------------------------
// Du bist Manager; der Cheftrainer (Rolle `cheftrainer` im Trainerteam,
// game/trainerTeam.ts) ist ein Angestellter. Jede Amtszeit wird in
// `game.career.coaches` festgehalten: Beginn, Ende (entlassen, Vertragsende,
// abgeworben, Ruhestand), Ligabilanz (gespeichert bis `rec.upTo`, laufende
// Saison live aus dem Spielplan wie bei den KI-Trainern, game/coachRecord.ts).
// Ein Abgang landet zusätzlich in `Club.coachHistory` des eigenen Vereins –
// so berichten Vereinsprofil und Presse auch über deine Trainerwechsel.
// Abgleich `syncHeadCoach` täglich (careerDaily) und beim Öffnen der Seite;
// Abgänge mit Grund melden trainerTeam.ts/staffGame.ts über `closeHeadCoach`.
// =============================================================================
import type { StaffMember } from '../engine/staffPeople';
import type { CoachRecord } from '../types';
import { addRecord, leagueRecordSince, recordNow } from './coachRecord';
import { ensureCareer, HeadCoachEntry } from './careerState';
import type { Game } from './state';

export const HEAD_ROLE = 'cheftrainer';

export function headCoachNow(g: Game): StaffMember | undefined {
  return g.staff?.find((m) => m.roleId === HEAD_ROLE);
}

function coachList(g: Game): HeadCoachEntry[] {
  const c = ensureCareer(g);
  return (c.coaches ??= []);
}

export function openCoachEntry(g: Game): HeadCoachEntry | undefined {
  const l = coachList(g);
  const e = l[l.length - 1];
  return e && !e.to ? e : undefined;
}

/** Ligabilanz einer Amtszeit (gespeichert + laufende Saison). */
export function headCoachRecord(g: Game, e: HeadCoachEntry): CoachRecord {
  if (e.to) return e.rec ?? { w: 0, d: 0, l: 0 };
  return recordNow(g, g.managedClubId, e.from, e.rec);
}

/** Amtszeit eines Cheftrainers beenden (Aufruf beim Entlassen, Vertragsende, Abwerben, Ruhestand). */
export function closeHeadCoach(g: Game, memberId: string, end: NonNullable<HeadCoachEntry['end']>, date = g.calendar.currentDate): void {
  const e = openCoachEntry(g);
  if (!e || e.id !== memberId) return;
  e.rec = { ...headCoachRecord(g, e), upTo: undefined };
  e.to = date;
  e.end = end;
  const club = g.clubs[g.managedClubId];
  if (club) {
    (club.coachHistory ??= []).push({ name: e.name, from: e.from, to: date, reason: end === 'gegangen' ? 'vertragsende' : end, rec: { ...e.rec } });
    if (club.coachHistory.length > 30) club.coachHistory.splice(0, club.coachHistory.length - 30);
  }
}

/** Liste an das Trainerteam angleichen (idempotent): neue Amtszeit öffnen, verschwundene schließen. */
export function syncHeadCoach(g: Game): void {
  if (!g.clubs[g.managedClubId]) return;
  const today = g.calendar.currentDate;
  const cur = headCoachNow(g);
  const open = openCoachEntry(g);
  if (open && open.id !== cur?.id) closeHeadCoach(g, open.id, 'gegangen');
  if (cur && !openCoachEntry(g)) {
    const from = cur.hired && cur.hired <= today ? cur.hired : today;
    const seasonStart = `${g.season.slice(0, 4)}-07-01`;
    // Schon vor dieser Saison im Amt (alter Spielstand): Bilanz erst ab der laufenden Saison.
    const recFrom = from < seasonStart && !coachList(g).length ? g.season : undefined;
    coachList(g).push({ id: cur.id, name: cur.name, from, recFrom });
  }
  const l = coachList(g);
  if (l.length > 80) l.splice(0, l.length - 80);
}

/** Saisonwechsel (vor dem Überschreiben des Spielplans): Saison zur gespeicherten Bilanz addieren. */
export function headCoachSeasonEnd(g: Game): void {
  syncHeadCoach(g);
  const e = openCoachEntry(g);
  if (!e) return;
  const date = g.calendar.currentDate;
  e.rec = addRecord(e.rec, { ...leagueRecordSince(g, g.managedClubId, e.from, e.rec?.upTo), upTo: date });
}

/** Alle Cheftrainer, neuester zuerst, mit Bilanz. */
export function headCoachRows(g: Game): (HeadCoachEntry & { live: boolean; r: CoachRecord })[] {
  syncHeadCoach(g);
  return [...coachList(g)].reverse().map((e) => ({ ...e, live: !e.to, r: headCoachRecord(g, e) }));
}

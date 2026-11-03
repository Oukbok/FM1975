// =============================================================================
// Ligabilanz der Trainer (KI-Trainer `Club.coach.rec`, Vorgänger in
// `Club.coachHistory[].rec`, deine Stationen in game/careerState.ts).
// Abgeschlossene Saisons werden beim Saisonwechsel aufaddiert (`upTo`), die
// laufende Saison kommt live aus dem Spielplan der Spielerliga dazu.
// =============================================================================
import { Club, CoachRecord } from '../types';
import { Game } from './state';

export const emptyRecord = (): CoachRecord => ({ w: 0, d: 0, l: 0 });

/** Ligaspiele des Vereins in der laufenden Saison ab `from` (exklusive `after`). */
export function leagueRecordSince(g: Game, clubId: string, from: string, after?: string): CoachRecord {
  const r = emptyRecord();
  for (const m of g.fixtures) {
    if (!m.result || m.status !== 'finished' || m.date < from || (after && m.date <= after)) continue;
    if (m.homeClubId !== clubId && m.awayClubId !== clubId) continue;
    const my = m.homeClubId === clubId ? m.result.homeGoals : m.result.awayGoals;
    const ot = m.homeClubId === clubId ? m.result.awayGoals : m.result.homeGoals;
    if (my > ot) r.w++; else if (my < ot) r.l++; else r.d++;
  }
  return r;
}

export function addRecord(a: CoachRecord | undefined, b: CoachRecord): CoachRecord {
  return { w: (a?.w ?? 0) + b.w, d: (a?.d ?? 0) + b.d, l: (a?.l ?? 0) + b.l, titles: (a?.titles ?? 0) + (b.titles ?? 0) || undefined, upTo: b.upTo ?? a?.upTo };
}

/** Bilanz einer Amtszeit seit `since` bis heute (gespeicherter Teil + laufende Saison). */
export function recordNow(g: Game, clubId: string, since: string, stored?: CoachRecord): CoachRecord {
  const live = leagueRecordSince(g, clubId, since, stored?.upTo);
  return addRecord(stored, { ...live, upTo: undefined });
}

/** Bilanz des aktuellen KI-Trainers eines Vereins. */
export function coachRecordOf(g: Game, club: Club): CoachRecord | null {
  return club.coach ? recordNow(g, club.id, club.coach.since, club.coach.rec) : null;
}

/** Punkte je Spiel (3-Punkte-Wertung, damit Epochen vergleichbar bleiben). */
export function pointsPerGame(r: CoachRecord): number {
  const n = r.w + r.d + r.l;
  return n ? (r.w * 3 + r.d) / n : 0;
}

export function recordText(r: CoachRecord): string {
  const n = r.w + r.d + r.l;
  return n ? `${r.w}-${r.d}-${r.l} (${pointsPerGame(r).toFixed(2).replace('.', ',')} P./Sp.)` : 'noch kein Ligaspiel';
}

/** Saisonwechsel (vor dem Trainerkarussell): Saison zur gespeicherten Bilanz addieren, Meistertitel zählen. */
export function coachRecordsSeasonEnd(g: Game): void {
  const date = g.calendar.currentDate;
  const champ = g.leagues?.playerDivision?.tier === 1 ? g.table.rows[0]?.clubId : undefined;
  for (const club of Object.values(g.clubs)) {
    const c = club.coach;
    if (!c) continue;
    const live = leagueRecordSince(g, club.id, c.since, c.rec?.upTo);
    c.rec = addRecord(c.rec, { ...live, titles: champ === club.id ? 1 : 0, upTo: date });
  }
}

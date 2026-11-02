// =============================================================================
// Presse: eine Zeitungsausgabe zusammensetzen.
// Ausgaben werden NICHT gespeichert: jede Ausgabe (aktuell + Archiv) wird aus
// dem Spielstand rekonstruiert und ist dank Seed (Datum + Verein) stabil.
// Speicherbedarf: null. Archiv = Erscheinungstage der laufenden Saison.
// =============================================================================
import type { Game } from '../state';
import { issueDates, issueNumber, isIssueDay, mastheadFor, prevIssueDay } from './calendar';
import { makeCtx } from './context';
import { leagueStories, previewStories, upcomingMatchday } from './matchStories';
import { coachStories, commentStory, cupStories, dressingStories, injuryStories, messageStories, rumorStories, talentStories, transferStories } from './newsStories';
import type { PressEdition, PressStory } from './types';

/** Erscheinungstage für Auswahl/Archiv (neueste zuerst). */
export function pressIssues(g: Game, max = 12): string[] {
  const since = `${g.season.slice(0, 4)}-07-01`;
  return issueDates(g.calendar.currentDate, since, max);
}

/** Je Art höchstens so viele Artikel (Rest fällt in die Kurzmeldungen). */
const KIND_MAX: Partial<Record<PressStory['kind'], number>> = { spiel: 3, transfer: 3, verletzung: 2, tabelle: 2, rekord: 2, geruecht: 2, trainer: 3, pokal: 2, europa: 3, jugend: 2, chronik: 2 };

export function buildEdition(g: Game, date: string): PressEdition {
  const from = prevIssueDay(date);
  const c = makeCtx(g, date, from);
  const league = leagueStories(c);
  const tr = transferStories(c), inj = injuryStories(c), msg = messageStories(c);
  const comment = commentStory(c);
  const all: PressStory[] = [
    ...league.stories, ...previewStories(c), ...tr.stories, ...rumorStories(c), ...coachStories(c), ...inj.stories,
    ...cupStories(c), ...dressingStories(c), ...talentStories(c), ...msg.stories,
    ...(comment ? [comment] : []),
  ];
  // Eigener Verein leicht bevorzugt, sonst nach Gewicht.
  all.sort((a, b) => (b.weight + (b.own ? 8 : 0)) - (a.weight + (a.own ? 8 : 0)));
  const count: Record<string, number> = {};
  const stories: PressStory[] = [], overflow: PressStory[] = [];
  for (const s of all) {
    const n = (count[s.kind] = (count[s.kind] ?? 0) + 1);
    if (n > (KIND_MAX[s.kind] ?? 2)) overflow.push({ ...s, kind: 'meldung' }); else stories.push(s);
  }
  // Aufmacher: kein Kommentar/Spieltags-Überblick/Vorschau, wenn es Besseres gibt.
  const leadIdx = stories.findIndex((s) => !['kommentar', 'spieltag', 'meldung'].includes(s.kind));
  const lead = leadIdx >= 0 ? stories.splice(leadIdx, 1)[0] : stories.shift() ?? null;
  const briefs = [...msg.briefs, ...tr.briefs, ...inj.briefs, ...overflow].sort((a, b) => b.weight - a.weight).slice(0, 12);
  const m = mastheadFor(c.year);
  return {
    date, from, masthead: m, number: issueNumber(date), volume: c.year - m.founded + 1, regular: isIssueDay(date),
    lead, stories, briefs, matchday: league.matchday, table: league.table, tableSize: league.table.length, scorers: league.scorers,
    upcoming: league.matchday ? null : upcomingMatchday(c),
  };
}

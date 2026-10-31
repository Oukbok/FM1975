// =============================================================================
// SAISON-BRIEFING — Zugriff auf die redaktionellen Inhalte
// -----------------------------------------------------------------------------
// Führt die Saison-Einträge (seasons1975.ts, seasons2000.ts) und die Unterschiede
// zum heutigen Fußball (differences.ts) zusammen. Zuordnung immer über das
// Saison-STARTJAHR, damit „1999/00“ (Spiel) und „1999/2000“ (Daten) zusammenpassen.
// Zusammengesetzt wird das Briefing in game/seasonBriefing.ts.
// =============================================================================
import type { BriefingTopic, DifferenceToToday, SeasonBriefingEntry } from './types';
import { SEASONS_1975 } from './seasons1975';
import { SEASONS_2000 } from './seasons2000';
import { DIFFERENCES } from './differences';

export type { BriefingItem, BriefingTopic, DifferenceToToday, SeasonBriefingEntry } from './types';

const startYearOf = (season: string) => parseInt(season.slice(0, 4), 10) || 0;

let bySeason: Map<number, SeasonBriefingEntry> | null = null;
function index(): Map<number, SeasonBriefingEntry> {
  if (!bySeason) {
    bySeason = new Map();
    for (const e of [...SEASONS_1975, ...SEASONS_2000]) bySeason.set(startYearOf(e.season), e);
  }
  return bySeason;
}

/** Redaktioneller Eintrag einer Saison („1975/76“ oder Startjahr), falls vorhanden. */
export function briefingFor(season: string | number): SeasonBriefingEntry | undefined {
  return index().get(typeof season === 'number' ? season : startYearOf(season));
}

/** Alle Unterschiede zum heutigen Fußball, die in der Saison mit diesem Startjahr gelten. */
export function differencesFor(startYear: number): DifferenceToToday[] {
  return DIFFERENCES.filter((d) => d.from <= startYear && startYear <= d.to);
}

/** Unterschiede, die mit dieser Saison beginnen (from = Startjahr). */
export function differencesStarting(startYear: number): DifferenceToToday[] {
  return DIFFERENCES.filter((d) => d.from === startYear);
}

/** Unterschiede, die in der Vorsaison zum letzten Mal galten: ab jetzt wie heute. */
export function differencesEnded(startYear: number): DifferenceToToday[] {
  return DIFFERENCES.filter((d) => d.to === startYear - 1);
}

/** Anzeige-Reihenfolge, Name und Symbol der Themen. */
export const BRIEFING_TOPICS: { key: BriefingTopic; label: string; icon: string; society: boolean }[] = [
  { key: 'regeln', label: 'Spielregeln', icon: 'whistle', society: false },
  { key: 'liga', label: 'Liga & Wettbewerbe', icon: 'trophy', society: false },
  { key: 'geld', label: 'Geld & Verträge', icon: 'finances', society: false },
  { key: 'taktik', label: 'Spielweise & Training', icon: 'tactics', society: false },
  { key: 'medien', label: 'Medien & Fans', icon: 'presse', society: false },
  { key: 'politik', label: 'Politik & Wirtschaft', icon: 'politics', society: true },
  { key: 'alltag', label: 'Alltag & Technik', icon: 'home', society: true },
  { key: 'kultur', label: 'Kultur & Sport', icon: 'music', society: true },
];

export function topicMeta(t: BriefingTopic) {
  return BRIEFING_TOPICS.find((x) => x.key === t) ?? BRIEFING_TOPICS[0];
}

/** Startjahre, für die redaktionelle Einträge vorliegen (Test/Übersicht). */
export function briefingSeasonsAvailable(): number[] {
  return [...index().keys()].sort((a, b) => a - b);
}

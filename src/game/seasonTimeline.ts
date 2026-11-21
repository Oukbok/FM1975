// =============================================================================
// Epochen-/Timeline-System: Meilensteine auslösen und ihre Effekte anwenden.
// Teil von game/season.ts (dort weitergereicht).
// =============================================================================
import { TIMELINE_TYPE_META, TimelineEvent, dueTimelineEvents } from '../data/timeline';
import { calculateTable } from '../engine/league';
import { makeMessage, pushMessage } from '../engine/messages';
import { localCurrencyText } from '../engine/moneyText';
import { Game } from './state';
import { leagueClubs } from './seasonMatchday';

// -----------------------------------------------------------------------------
// EPOCHEN-/TIMELINE-SYSTEM — Meilensteine auslösen & Effekte anwenden
// -----------------------------------------------------------------------------

/** Wendet den Spiel-Effekt eines Meilensteins an (Punktesystem, Feature-Flag). */
export function applyTimelineEffect(g: Game, ev: TimelineEvent): void {
  if (!ev.effect) return;
  if (ev.effect.pointSystem && (!g.homeCountry || g.homeCountry === 'ger')) {
    g.pointSystem = ev.effect.pointSystem;
    // Tabelle mit dem neuen Punktesystem SOFORT neu berechnen, damit z. B. die
    // Umstellung auf 3 Punkte 1995/96 die Tabellenrechnung wirklich verändert.
    g.table = calculateTable(leagueClubs(g), g.fixtures, g.pointSystem, g.season, g.table);
  }
  if (ev.effect.attendanceBoost) {
    for (const c of Object.values(g.clubs)) {
      c.stadium.averageAttendanceRate = Math.min(0.98, c.stadium.averageAttendanceRate + ev.effect.attendanceBoost);
    }
  }
  if (ev.effect.unlock && !g.unlockedFeatures.includes(ev.effect.unlock)) {
    g.unlockedFeatures.push(ev.effect.unlock);
  }
}

/**
 * Löst alle für `season` fälligen Meilensteine aus: Effekt anwenden, in
 * firedMilestones vermerken und (außer bei silent) eine Chronik-Nachricht in die
 * Inbox legen. Gibt die ausgelösten Ereignisse zurück.
 */
export function fireTimelineForSeason(g: Game, season: string, dateISO: string, silent = false): TimelineEvent[] {
  const due = dueTimelineEvents(season, g.firedMilestones);
  for (const ev of due) {
    g.firedMilestones.push(ev.id);
    applyTimelineEffect(g, ev);
    if (!silent) {
      const meta = TIMELINE_TYPE_META[ev.type];
      pushMessage(g.messages, makeMessage({
        date: dateISO, category: 'milestone', from: 'Fußball-Chronik',
        subject: `${ev.year}: ${ev.title}`,
        shortText: `${meta.label}-Meilenstein ${ev.season}: ${ev.title}.`,
        bodyText: `${ev.title}  (${ev.season} · ${meta.label})\n\n${localCurrencyText(ev.description, ev.year) ?? ev.description}\n\n`
          + `Diesen und alle weiteren Meilensteine findest du in der „Chronik des deutschen Fußballs“ (unten rechts in der Fußleiste).`,
      }));
    }
  }
  return due;
}

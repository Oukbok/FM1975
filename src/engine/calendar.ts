// =============================================================================
// FOOTBALL MANAGER 1980 — Kalender-Engine
// Erzeugt den Saisonkalender und steuert das Auto-Advance (1 Tag/Sek).
// =============================================================================

import { CalendarEvent, GameCalendar, Match } from '../types';

let _eid = 0;
function eid(): string { return `ev_${_eid++}`; }

// -----------------------------------------------------------------------------
// Saisonkalender erzeugen
// -----------------------------------------------------------------------------
/** Baut das Saison-Label aus dem Startjahr: 1975 → "1975/76". */
export function seasonLabel(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function generateSeasonCalendar(
  matches: Match[],
  seasonStart = '1975-07-01',
  seasonEnd = '1976-06-30',
): GameCalendar {
  const events: CalendarEvent[] = [];
  // Alle Fenster-/Meilenstein-Termine werden aus dem Startjahr abgeleitet, damit
  // der Kalender für JEDE Saison (1975/76 … 2030+) korrekt erzeugt wird.
  const y0 = parseInt(seasonStart.slice(0, 4), 10);   // Startjahr (Sommer)
  const y1 = y0 + 1;                                   // Folgejahr (Frühjahr)
  const label = seasonLabel(y0);

  events.push({
    id: eid(), date: seasonStart, type: 'season_start',
    title: `Saisonstart ${label}`, description: 'Die neue 1. Liga-Saison beginnt!',
    processed: false, requiresAction: false,
  });

  // Spieltage
  for (const m of matches) {
    events.push({
      id: eid(), date: m.date, type: 'matchday',
      title: `Spieltag ${m.matchday}`, description: '1. Liga-Spieltag',
      matchId: m.id, processed: false, requiresAction: false,
    });
  }

  // Transferfenster
  events.push({
    id: eid(), date: `${y0}-08-01`, type: 'transfer_window_open',
    title: 'Transferfenster geöffnet', description: 'Das Sommer-Transferfenster ist offen.',
    processed: false, requiresAction: false,
  });
  events.push({
    id: eid(), date: `${y0}-08-31`, type: 'transfer_window_close',
    title: 'Transferfenster geschlossen', description: 'Das Sommer-Transferfenster schließt.',
    processed: false, requiresAction: false,
  });
  events.push({
    id: eid(), date: `${y1}-01-01`, type: 'transfer_window_open',
    title: 'Winter-Transferfenster', description: 'Das Winter-Transferfenster ist offen.',
    processed: false, requiresAction: false,
  });
  events.push({
    id: eid(), date: `${y1}-01-31`, type: 'transfer_window_close',
    title: 'Transferfenster geschlossen', description: 'Das Winter-Transferfenster schließt.',
    processed: false, requiresAction: false,
  });

  // Leistungsbewertungen — an festen Anlässen, nicht mehr in starren 2-Monats-Abständen.
  // Jede Bewertung hält interaktiv an (requiresAction) und wird als Zeremonie enthüllt.
  // Drei Bewertungsrunden je Saison (Entwicklung 2.0): Herbst (klein), Winter
  // (mittel, neue Scout-Einschätzung), Saisonende (groß: Durchbrüche, Abbau).
  events.push({
    id: eid(), date: `${y0}-11-03`, type: 'rating_update',
    title: 'Leistungsbewertung', description: 'Herbst-Bewertung',
    processed: false, requiresAction: true,
  });
  events.push({
    id: eid(), date: `${y1}-01-02`, type: 'rating_update',
    title: 'Leistungsbewertung', description: 'Winter-Bewertung',
    processed: false, requiresAction: true,
  });
  events.push({
    id: eid(), date: CalendarEngine.addDays(seasonEnd, -14), type: 'rating_update',
    title: 'Leistungsbewertung', description: 'Große Saison-Bewertung',
    processed: false, requiresAction: true,
  });

  // Winterpause
  events.push({
    id: eid(), date: `${y0}-12-21`, type: 'winter_break',
    title: 'Winterpause', description: 'Die 1. Liga geht in die Winterpause.',
    processed: false, requiresAction: false,
  });

  events.push({
    id: eid(), date: seasonEnd, type: 'season_end',
    title: 'Saisonende', description: `Die Saison ${label} ist beendet.`,
    processed: false, requiresAction: false,
  });

  events.sort((a, b) => a.date.localeCompare(b.date));

  return {
    currentDate: seasonStart, seasonStartDate: seasonStart, seasonEndDate: seasonEnd,
    isRunning: false, speedMs: 1000, events,
  };
}

// -----------------------------------------------------------------------------
// CalendarEngine — reine Datums-Logik (UI steuert das Intervall)
// -----------------------------------------------------------------------------
export class CalendarEngine {
  /** Gibt alle unverarbeiteten Events an einem Datum zurück. */
  static eventsOn(cal: GameCalendar, date: string): CalendarEvent[] {
    return cal.events.filter((e) => e.date === date);
  }

  /** Nächstes unverarbeitetes Event ab (inkl.) currentDate. */
  static nextEvent(cal: GameCalendar): CalendarEvent | null {
    const future = cal.events
      .filter((e) => !e.processed && e.date >= cal.currentDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0] ?? null;
  }

  /**
   * Datum um einen Tag vorschieben (ISO).
   * WICHTIG: durchgehend in UTC gerechnet (T00:00:00Z + setUTCDate), damit die
   * Berechnung unabhängig von der Zeitzone des Browsers ist. Mit lokaler Zeit
   * (z.B. Europe/Berlin, UTC+2) führte toISOString() zu einem Off-by-one, wodurch
   * das Datum nicht vorrückte ("Voranschreiten funktioniert nicht").
   */
  static nextDay(dateISO: string): string {
    const d = new Date(dateISO + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  /** Addiert n Tage zu einem ISO-Datum (UTC, korrekt über Monats-/Jahresgrenzen). */
  static addDays(dateISO: string, n: number): string {
    const d = new Date(dateISO + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /** Ob das Saisonende erreicht ist. */
  static isSeasonOver(cal: GameCalendar): boolean {
    return cal.currentDate >= cal.seasonEndDate;
  }

  /** Formatiert ein ISO-Datum als "Sa, 15. Aug 1980" (zeitzonen-unabhängig, UTC). */
  static formatDate(dateISO: string): string {
    const d = new Date(dateISO + 'T00:00:00Z');
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return `${days[d.getUTCDay()]}, ${d.getUTCDate()}. ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
}

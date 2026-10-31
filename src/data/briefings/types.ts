// =============================================================================
// SAISON-BRIEFING — gemeinsames Datenformat
// -----------------------------------------------------------------------------
// Zu Spielbeginn und zu Beginn jeder Saison erhält der Manager ein Briefing:
//  • Spielbeginn: Wie unterscheidet sich der Fußball dieser Saison vom heutigen
//    (DIFFERENCES – Zeiträume, in denen etwas anders war als heute)?
//  • jede weitere Saison: Was ändert sich im Fußball (SeasonBriefingEntry.football)
//    und was bewegt die Gesellschaft (SeasonBriefingEntry.society)?
// Inhalte: data/briefings/seasons1975.ts (1975/76–1999/2000) und
// data/briefings/seasons2000.ts (2000/01–2034/35), Unterschiede in differences.ts.
// Spielablauf/Anzeige: game/seasonBriefing.ts, views/zentrale/BriefingView.tsx.
// =============================================================================

/** Themenbereich eines Briefing-Punkts (steuert das Symbol und die Gruppierung). */
export type BriefingTopic =
  | 'regeln'      // Spielregeln, Wertung, Wechsel, Karten
  | 'liga'        // Ligensystem, Auf-/Abstieg, Wettbewerbe, Termine
  | 'geld'        // Gehälter, Ablösen, TV, Sponsoring, Lizenz
  | 'taktik'      // Spielweise, Training, Medizin, Ernährung
  | 'medien'      // Fernsehen, Radio, Presse, Internet, Fans
  | 'politik'     // Politik, Wirtschaft, Grenzen (Gesellschaft)
  | 'alltag'      // Alltag, Technik, Konsum, Mode (Gesellschaft)
  | 'kultur';     // Musik, Film, Sport außerhalb des Fußballs (Gesellschaft)

export interface BriefingItem {
  topic: BriefingTopic;
  /** Kurzer Titel (2–6 Wörter), z. B. „Drei-Punkte-Regel“. */
  title: string;
  /** Ein bis zwei Sätze, Deutsch, du-Form wo es den Spieler betrifft. */
  text: string;
  /** Wirkt das direkt im Spiel? Dann kurz, wie (z. B. „Sieg zählt 3 statt 2 Punkte“). */
  inGame?: string;
}

export interface SeasonBriefingEntry {
  /** Saison im Format „1975/76“. */
  season: string;
  /** Kurze Überschrift der Saison (3–8 Wörter), z. B. „Der Rasen wird bunt“. */
  headline: string;
  /** Was sich im Fußball gegenüber der Vorsaison ändert (3–6 Punkte). */
  football: BriefingItem[];
  /** Was die Gesellschaft bewegt – möglichst mit Bezug zum Fußball/Alltag der Fans (3–6 Punkte). */
  society: BriefingItem[];
}

/**
 * Ein Unterschied zum heutigen Fußball, gültig von `from` bis einschließlich `to`
 * (Saison-Startjahre). Wird im Briefing gezeigt, solange er gilt.
 */
export interface DifferenceToToday {
  from: number;
  to: number;
  topic: BriefingTopic;
  title: string;
  /** „Damals“: wie es in dieser Zeit war. */
  then: string;
  /** „Heute“: wie es heute (2025/26) ist. */
  today: string;
}

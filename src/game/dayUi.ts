// =============================================================================
// Rückrufe der Oberfläche für den Tagesablauf (game/day.ts `processDay`).
// =============================================================================
import type { RatingResult as _RatingResult } from '../engine/development';
import type { DrawNotice } from './cupDraw';
import type { OwnMatchInfo } from './ownMatch';

export interface DayUi {
  /** Eigenes Spiel wurde gespielt → Spielbericht/Textmodus öffnen. */
  onOwnMatch(matchId: string): void;
  /** Große Bewertungsrunde → Zeremonie zeigen. */
  onRatingCeremony(c: { results: _RatingResult[]; type: 'medium' | 'large'; anlass: string }): void;
  /** Saisonende erreicht (z. B. Autospeichern). */
  onSeasonEnd(): void;
  /**
   * Eigenes Spiel steht heute an und ist noch nicht gespielt → anhalten und
   * „Schnell simulieren“ / „Textmodus“ anbieten. Fehlt der Rückruf (Simulation),
   * wird das Spiel wie jedes andere im Spieltag simuliert.
   */
  onOwnMatchDue?(info: OwnMatchInfo): void;
  /**
   * Heute wurde ausgelost (game/cupDraw.ts). Rückgabe true = die Oberfläche
   * zeigt die Ziehung, der Vorlauf hält an. Fehlt der Rückruf: nur Nachricht.
   */
  onCupDraw?(d: DrawNotice): boolean;
  /**
   * Ein eigenes Trainingslager ist heute zu Ende (game/trainingCampGame.ts) → kurze
   * Zusammenfassung zeigen. Rückgabe true = der Vorlauf hält an.
   */
  onCampEnd?(bookingId: string): boolean;
  /**
   * Gestern hat ein Transferfenster geschlossen (game/transferLog.ts) → Top-Transfers +
   * Transferbilanz zeigen. Rückgabe true = der Vorlauf hält an.
   */
  onTransferWindow?(key: string): boolean;
  /**
   * Heute spielt dein Verein ein Hallenturnier (game/indoorGame.ts). Rückgabe true = die
   * Oberfläche zeigt es als Show (screens/indoor/), der Vorlauf hält an. Fehlt der
   * Rückruf oder kommt false: Turnier im Hintergrund wie bisher.
   */
  onIndoorShow?(tid: string): boolean;
}

/** Oberfläche ohne Reaktion – für Simulationen und Tests. */
export const HEADLESS_UI: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {} };

import { Game } from '../../game/state';
import { CompetitionPage } from './competition/CompetitionPage';

// =============================================================================
// LIGA — Tabelle aller Ligen (inkl. DDR, Historie ab 1963/64) + Bestenlisten.
// Layout und Daten: competition/CompetitionPage.tsx, game/competitionView.ts.
// =============================================================================
export function TableView({ g }: { g: Game }) {
  return <CompetitionPage g={g} start="league" />;
}

import { Game } from '../../game/state';
import { CompetitionPage } from './competition/CompetitionPage';

// =============================================================================
// LANDESPOKAL — Turnierbaum/Runden, Saisonwahl (Historie ab 1963/64) + Bestenlisten.
// Layout und Daten: competition/CompetitionPage.tsx, game/competitionView.ts.
// =============================================================================
export function CupView({ g, onWatch, onReplayDraw }: { g: Game; onWatch: (id: string) => void; onReplayDraw?: (roundIndex: number) => void }) {
  return <CompetitionPage g={g} start="cup" onWatch={onWatch}
    onReplayDraw={onReplayDraw ? (comp, ri) => { if (comp === 'cup') onReplayDraw(ri); } : undefined} />;
}

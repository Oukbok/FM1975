import type { EuroCompId } from '../../data/europe';
import { Game } from '../../game/state';
import { CompetitionPage } from './competition/CompetitionPage';

// =============================================================================
// INTERNATIONAL — Europapokale (Baum/Runden, Saisonwahl ab 1963/64) + Bestenlisten.
// Layout und Daten: competition/CompetitionPage.tsx, game/competitionView.ts.
// =============================================================================
export function InternationalView({ g, onWatch, onReplayDraw }: { g: Game; onWatch: (id: string) => void; onReplayDraw?: (comp: EuroCompId, roundIndex: number) => void }) {
  return <CompetitionPage g={g} start="euro" onWatch={onWatch}
    onReplayDraw={onReplayDraw ? (comp, ri) => { if (comp !== 'cup') onReplayDraw(comp, ri); } : undefined} />;
}

import { useMemo } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { pyramidFromGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import { DashBox, DashPage } from '../../ui/DashPage';

// =============================================================================
// STATISTIKEN › LIGENSYSTEM — Pyramide der laufenden Saison (West, DDR, Ausland)
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
export function LeagueSystemView({ g }: { g: Game }) {
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, g.calendar.currentDate]);
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" icon="stats" span={3} rows={2} right={`Saison ${g.season}`} className="lp-box-page">
        <LeaguePyramid data={data} mineId={g.managedClubId} />
      </DashBox>
    </DashPage>
  );
}

import { useMemo } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { pyramidPreGame } from '../../game/leaguePyramid';
import type { NewGameDraft } from './draft';

// Schritt 5: Übersicht Ligensystem (dieselbe Komponente wie Statistiken › Ligensystem)
export function StepLeagues({ d }: { d: NewGameDraft }) {
  const data = useMemo(() => pyramidPreGame(), [d.datasetId]);
  return (
    <section className="ng-card ng-leagues">
      <LeaguePyramid data={data} mineId={d.clubId} />
    </section>
  );
}

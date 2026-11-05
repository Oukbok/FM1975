import { useMemo } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { pyramidFromGame, pyramidPreGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import type { NewGameDraft } from './draft';

// Schritt 5: Übersicht Ligensystem (dieselbe Komponente wie Statistiken › Ligensystem).
// 1975 in Deutschland aus den Stammdaten; sonst aus der vorab erzeugten Welt des Startjahres.
export function StepLeagues({ d, game }: { d: NewGameDraft; game?: Game | null }) {
  const legacy = d.startYear === 1975 && d.country === 'ger';
  const data = useMemo(() => (legacy || !game ? (legacy ? pyramidPreGame() : null) : pyramidFromGame(game)), [d.datasetId, legacy, game]);
  return (
    <section className="ng-card ng-leagues">
      {data ? <LeaguePyramid data={data} mineId={d.clubId} /> : <p className="ng-note">Die Spielwelt {d.startYear} wird aufgebaut …</p>}
    </section>
  );
}

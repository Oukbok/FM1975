// Reiter „Saison“: Zahlen Saison/Karriere mit Quoten, darunter die letzten Spiele mit Notenkurve
// (fasst die früheren Reiter „Statistik“ und „Spiele“ zusammen).
import type { Player } from '../../types';
import StatsTab from './StatsTab';
import MatchesTab from './MatchesTab';

export default function SeasonTab({ p }: { p: Player }) {
  return (
    <div className="pp2-season">
      <StatsTab p={p} />
      <MatchesTab p={p} />
    </div>
  );
}

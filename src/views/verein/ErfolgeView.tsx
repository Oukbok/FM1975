// =============================================================================
// Verein › Erfolge: Reiter „Vereinspokale“ (Vitrine, trophies/TrophyCabinet.tsx)
// und „Ruhmeshalle“ (Spieler-Archiv, statistiken/HallOfFameView.tsx).
// =============================================================================
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import type { Game } from '../../game/state';
import { HallOfFameView } from '../statistiken/HallOfFameView';
import { TrophyCabinet } from './trophies/TrophyCabinet';

type Tab = 'pokale' | 'ruhm';

export function ErfolgeView({ g }: { g: Game }) {
  const [tab, setTab] = useSubTab<Tab>('verein.erfolge', 'pokale');
  return (
    <SubTabsPage className="tro-page" active={tab} onSelect={setTab}
      tabs={[{ id: 'ruhm', label: 'Ruhmeshalle' }, { id: 'pokale', label: 'Vereinspokale' }]}>
      {tab === 'pokale' ? <TrophyCabinet g={g} clubId={g.managedClubId} className="tro-cab-page" /> : <HallOfFameView g={g} />}
    </SubTabsPage>
  );
}

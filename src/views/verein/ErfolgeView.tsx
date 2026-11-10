// =============================================================================
// Verein › Erfolge: Reiter „Vereinspokale“ (Vitrine, trophies/TrophyCabinet.tsx)
// und „Ruhmeshalle“ (Spieler-Archiv, statistiken/HallOfFameView.tsx), „Auszeichnungen“
// (Vereinsauszeichnungen Bronze/Silber/Gold, honours/HonoursView.tsx).
// =============================================================================
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import type { Game } from '../../game/state';
import { HallOfFameView } from '../statistiken/HallOfFameView';
import { TrophyCabinet } from './trophies/TrophyCabinet';
import { HonoursView } from './honours/HonoursView';

type Tab = 'pokale' | 'ruhm' | 'auszeichnungen';

export function ErfolgeView({ g }: { g: Game }) {
  const [tab, setTab] = useSubTab<Tab>('verein.erfolge', 'pokale');
  return (
    <SubTabsPage className="tro-page" tabsClassName="tro-tabs" active={tab} onSelect={setTab}
      tabs={[{ id: 'ruhm', label: 'Ruhmeshalle' }, { id: 'pokale', label: 'Vereinspokale' }, { id: 'auszeichnungen', label: 'Auszeichnungen' }]}>
      {tab === 'pokale' ? <TrophyCabinet g={g} clubId={g.managedClubId} className="tro-cab-page" />
        : tab === 'auszeichnungen' ? <HonoursView g={g} clubId={g.managedClubId} /> : <HallOfFameView g={g} />}
    </SubTabsPage>
  );
}

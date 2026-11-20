import type { EuroCompId } from '../../data/europe';
import { Game } from '../../game/state';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { CompetitionPage } from './competition/CompetitionPage';
import { WorldCupsView } from './world/WorldCupsView';

// =============================================================================
// INTERNATIONAL — drittes Menü (Wunsch Pascal):
//   Europa = Europapokale (Baum/Runden, Saisonwahl ab 1963/64) + Bestenlisten
//            (competition/CompetitionPage.tsx, game/competitionView.ts),
//   Welt   = Weltpokal / Klub-WM / Interkontinentalpokal + Kontinentalpokale der
//            anderen Kontinente (world/WorldCupsView.tsx, game/worldCupsView.ts).
// =============================================================================
type IntlTab = 'europa' | 'welt';

export function InternationalView({ g, onWatch, onReplayDraw }: { g: Game; onWatch: (id: string) => void; onReplayDraw?: (comp: EuroCompId, roundIndex: number) => void }) {
  const [tab, setTab] = useSubTab<IntlTab>('intl-tab', 'europa');
  return (
    <SubTabsPage tabs={[{ id: 'europa', label: 'Europa' }, { id: 'welt', label: 'Welt' }]} active={tab} onSelect={setTab}>
      {tab === 'europa'
        ? <CompetitionPage g={g} start="euro" onWatch={onWatch}
          onReplayDraw={onReplayDraw ? (comp, ri) => { if (comp !== 'cup') onReplayDraw(comp, ri); } : undefined} />
        : <WorldCupsView g={g} onWatch={onWatch} />}
    </SubTabsPage>
  );
}

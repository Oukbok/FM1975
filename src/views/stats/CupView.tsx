import { Game, homeCountryKey } from '../../game/state';
import { superEra } from '../../data/superCups';
import { cupName } from '../../data/competitions/overrides';
import { seasonStartYear } from '../../data/timeline';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { CompetitionPage } from './competition/CompetitionPage';
import { SuperCupView } from './SuperCupView';

// =============================================================================
// STATISTIKEN › NATIONALE POKALE — drittes Menü (Wunsch Pascal):
//   Landespokal = Turnierbaum/Runden, Saisonwahl (Historie ab 1963/64) + Bestenlisten
//                 (competition/CompetitionPage.tsx, game/competitionView.ts),
//   Gipfelpokal = nationaler Gipfelpokal bzw. in seiner Epoche der Auftaktpokal (Ligapokal mit
//                 sechs Teams) des Heimatlandes, Regeln, Siegerliste, andere Länder (SuperCupView).
// Der Europäische Gipfelpokal steht unter Statistiken › International.
// Sprungziel 'supercup' (Kalender, Nachrichten) landet hier im Reiter Gipfelpokal
// (shell/useScreenHistory.ts → presetSubTab('cup-tab', 'gipfel')).
// =============================================================================
export type CupTab = 'landespokal' | 'gipfel';

export function CupView({ g, onWatch, onReplayDraw }: { g: Game; onWatch: (id: string) => void; onReplayDraw?: (roundIndex: number) => void }) {
  const [tab, setTab] = useSubTab<CupTab>('cup-tab', 'landespokal');
  const y = seasonStartYear(g.season);
  // Reiter mit dem Namen der Epoche: 1997–2007 heißt der Wettbewerb in Deutschland Auftaktpokal.
  const era = superEra(homeCountryKey(g), y);
  const tabs = [
    { id: 'landespokal' as const, label: g.ddrHome ? 'FDGB-Pokal' : cupName(y) },
    { id: 'gipfel' as const, label: era?.name ?? 'Gipfelpokal' },
  ];
  return (
    <SubTabsPage tabs={tabs} active={tab} onSelect={setTab}>
      {tab === 'gipfel'
        ? <SuperCupView g={g} scope="home" />
        : <CompetitionPage g={g} start="cup" onWatch={onWatch}
          onReplayDraw={onReplayDraw ? (comp, ri) => { if (comp === 'cup') onReplayDraw(ri); } : undefined} />}
    </SubTabsPage>
  );
}

// =============================================================================
// TRAINING › TRAININGSPLAN — vier Reiter nach Vorbild EA Fussball Manager:
//   Mannschaftstraining – Ringbuch mit der Woche, Bausteine in Reitern, Trainingsinfo
//   Individuelle Spieler – Trainingsziel (Zusatzposition), Fortschritt, Förderspieler
//   Trainingsgruppen     – Kader nach Trainingsablauf, Leitung durch das Trainerteam
//   Langfristig          – Saisonverlauf je Woche, Vorlagen vormerken, Philosophie
// Teile in views/training/plan/, Kacheln in planParts.tsx, CSS 28-training3.css.
// =============================================================================
import { useState } from 'react';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { Game } from '../../game/state';
import { Screen } from '../../shell/navigation';
import { GroupsTab } from './plan/GroupsTab';
import { LongTermTab } from './plan/LongTermTab';
import { PLAN_TABS, PlanTab } from './plan/model';
import { PlayersTab } from './plan/PlayersTab';
import { TeamTab } from './plan/TeamTab';

export function TrainingPlanView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto?: (s: Screen) => void }) {
  const [tab, setTab] = useSubTab<PlanTab>('training.plan', 'team');
  const [, setTick] = useState(0);
  const refresh = () => { setTick((t) => t + 1); onChange(); };
  return (
    <SubTabsPage className="tr3-page" tabsClassName="tr3-tabs" tabs={PLAN_TABS} active={tab} onSelect={setTab}>
      {tab === 'team' && <TeamTab g={g} refresh={refresh} onTab={setTab} />}
      {tab === 'players' && <PlayersTab g={g} refresh={refresh} />}
      {tab === 'groups' && <GroupsTab g={g} onGoto={(s) => onGoto?.(s)} />}
      {tab === 'long' && <LongTermTab g={g} refresh={refresh} />}
    </SubTabsPage>
  );
}

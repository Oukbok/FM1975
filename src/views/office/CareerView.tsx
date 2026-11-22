// =============================================================================
// ZENTRALE › KARRIERE — deine Managerbilanz über alle Jahrzehnte beim Verein
//   Reiter (drittes Menü, ui/SubTabs): Bilanz | Saisons | Trainer & Spieler | Nationalteam (nur als Nationaltrainer).
//   Keine Jobangebote/Stationen mehr (Wunsch Pascal): Du bleibst Manager deines
//   Vereins, Cheftrainer sind Angestellte. Daten: game/managerView.ts (nur lesen,
//   gespeichert in game/managerLog.ts), Trainer game/headCoaches.ts.
// =============================================================================
import { ensureCareer } from '../../game/careerState';
import { headCoachRows } from '../../game/headCoaches';
import { careerData } from '../../game/managerView';
import { Game } from '../../game/state';
import { DashPage, DashBox, Empty } from '../../ui/DashPage';
import { SubTabsPage, useSubTab, type SubTab } from '../../ui/SubTabs';
import { BalanceTab } from './career/BalanceTab';
import { PeopleTab } from './career/PeopleTab';
import { SeasonsTab } from './career/SeasonsTab';
import { NtCareerTab } from '../national/NtCareerTab';
import { nationalJob } from '../../game/national/nationalJob';

type CarTab = 'bilanz' | 'saisons' | 'personen' | 'national';

export function CareerView({ g }: { g: Game; onChange?: () => void }) {
  const [tab, setTab] = useSubTab<CarTab>('karriere', 'bilanz');
  const c = ensureCareer(g);
  const d = careerData(g);
  if (!d) {
    return <DashPage><DashBox title="Karriere" span={3} rows={2}><Empty icon="trophy">Keine Daten.</Empty></DashBox></DashPage>;
  }
  const tabs: SubTab<CarTab>[] = [
    { id: 'bilanz', label: 'Bilanz' },
    { id: 'saisons', label: 'Saisons', count: d.seasons.length },
    { id: 'personen', label: 'Trainer & Spieler', count: headCoachRows(g).length || undefined },
    ...(nationalJob(g) ? [{ id: 'national' as const, label: 'Nationalteam' }] : []),
  ];
  return (
    <SubTabsPage tabs={tabs} active={tab} onSelect={setTab}>
      {tab === 'bilanz' && <BalanceTab g={g} d={d} rep={c.rep} onTab={setTab} />}
      {tab === 'saisons' && <SeasonsTab g={g} d={d} />}
      {tab === 'personen' && <PeopleTab g={g} d={d} />}
      {tab === 'national' && nationalJob(g) && <NtCareerTab g={g} />}
    </SubTabsPage>
  );
}

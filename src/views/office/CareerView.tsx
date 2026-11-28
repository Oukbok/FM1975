// =============================================================================
// PRIVAT › KARRIERE — deine Managerbilanz über alle Jahrzehnte beim Verein (Ziel des
//   Menüpunkts Privat). Reiter (drittes Menü, ui/SubTabs): Bilanz | Saisons | Trainer & Spieler |
//   Nationalteam (nur als Nationaltrainer) | Lebenslauf (nur mit Privatleben, frühere Seite Privat).
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
import { privOn } from '../../game/private/privateState';
import { LifeTab } from '../private/LifeTab';

type CarTab = 'bilanz' | 'saisons' | 'personen' | 'national' | 'leben';

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
    ...(privOn(g) ? [{ id: 'leben' as const, label: 'Lebenslauf' }] : []),
  ];
  // Gespeicherter Reiter, den es hier nicht gibt (z. B. Lebenslauf ohne Privatleben) → Bilanz.
  const cur: CarTab = tabs.some((t) => t.id === tab) ? tab : 'bilanz';
  return (
    <SubTabsPage tabs={tabs} active={cur} onSelect={setTab}>
      {cur === 'bilanz' && <BalanceTab g={g} d={d} rep={c.rep} onTab={setTab} />}
      {cur === 'saisons' && <SeasonsTab g={g} d={d} />}
      {cur === 'personen' && <PeopleTab g={g} d={d} />}
      {cur === 'national' && nationalJob(g) && <NtCareerTab g={g} />}
      {cur === 'leben' && privOn(g) && <LifeTab g={g} />}
    </SubTabsPage>
  );
}

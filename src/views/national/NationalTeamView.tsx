// =============================================================================
// NATIONALTEAM (Ansicht Nationalteam, Wunsch Pascal): drittes Menü Übersicht |
// Aufgebot | Spiele & Turniere. Logik game/national/nationalJob.ts (Amt, Ziel,
// Vertrauen, Vertrag), nationalPick.ts (Aufgebot), nationalJobView.ts (Anzeige).
// CSS 28-natjob.css (`.ntj-*`).
// =============================================================================
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { activeJob, nationalJob } from '../../game/national/nationalJob';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { SubTabsPage, useSubTab, type SubTab } from '../../ui/SubTabs';
import { NtOverviewTab } from './NtOverviewTab';
import { NtSquadTab } from './NtSquadTab';
import { NtMatchesTab } from './NtMatchesTab';

type NtTab = 'uebersicht' | 'aufgebot' | 'spiele';

export function NationalTeamView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto: (s: Screen) => void }) {
  const [tab, setTab] = useSubTab<NtTab>('nationalteam', 'uebersicht');
  const job = nationalJob(g);
  if (!job) return <DashPage><DashBox title="Nationalteam" span={3} rows={2}><Empty icon="international">Du betreust keine Nationalmannschaft.</Empty></DashBox></DashPage>;
  const pick = activeJob(g)?.pick;
  const tabs: SubTab<NtTab>[] = [
    { id: 'uebersicht', label: 'Übersicht' },
    { id: 'aufgebot', label: 'Aufgebot', count: pick && !pick.used ? pick.ids.length : undefined },
    { id: 'spiele', label: 'Spiele & Turniere', count: job.record.total.p || undefined },
  ];
  return (
    <SubTabsPage tabs={tabs} active={tab} onSelect={setTab} className="ntj-page">
      {tab === 'uebersicht' && <NtOverviewTab g={g} onChange={onChange} onTab={setTab} onGoto={onGoto} />}
      {tab === 'aufgebot' && <NtSquadTab g={g} onChange={onChange} />}
      {tab === 'spiele' && <NtMatchesTab g={g} />}
    </SubTabsPage>
  );
}

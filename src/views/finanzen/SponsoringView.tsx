// =============================================================================
// Finanzen › Sponsoring (Vorbild EA Fussball Manager): vier Reiter
//   Hauptsponsor     – Einnahmen je Art, Brustvertrag, Trikot mit Logos
//   Namensrechte     – Stadion-Draufsicht mit Tribünen, Stadionname
//   Sponsoren-Pyramide – Premium / Neben / Lokal mit Logo-Kacheln, Angebote
//   Bandenwerbung    – Spielfeldrand der Epoche, Verträge, Angebote
// Linksklick öffnet die Karteikarte, Rechtsklick das Kontextmenü (sponsor/useSponsorUi).
// Rechnung unverändert: engine/sponsorship.ts, game/sponsorGame.ts, game/clubBusiness.ts.
// =============================================================================
import { useState } from 'react';
import { Game } from '../../game/state';
import { Screen } from '../../shell/navigation';
import { BoardsTab } from './sponsor/BoardsTab';
import { MainTab } from './sponsor/MainTab';
import { NamingTab } from './sponsor/NamingTab';
import { PyramidTab } from './sponsor/PyramidTab';
import { spContext, type SpTab } from './sponsor/model';
import { useSponsorUi } from './sponsor/useSponsorUi';

const TABS: { id: SpTab; label: string }[] = [
  { id: 'haupt', label: 'Hauptsponsor' },
  { id: 'namen', label: 'Namensrechte' },
  { id: 'pyramide', label: 'Sponsoren-Pyramide' },
  { id: 'banden', label: 'Bandenwerbung' },
];
let lastTab: SpTab = 'haupt';

export function SponsoringView({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const [tab, setTabState] = useState<SpTab>(lastTab);
  const [, force] = useState(0);
  const changed = () => { force((x) => x + 1); onChange(); };
  const setTab = (t: SpTab) => { lastTab = t; setTabState(t); };
  const ui = useSponsorUi(g, changed, onGoto);
  const ctx = spContext(g);
  const counts: Partial<Record<SpTab, number>> = {
    haupt: ctx.offers.filter((o) => o.slot === 'brust' || o.slot === 'ausruester' || o.slot === 'aermel').length,
    pyramide: ctx.offers.filter((o) => ['premium', 'trainingswear', 'digital', 'copartner', 'krypto', 'regional', 'jugend'].includes(o.slot)).length,
    banden: ctx.offers.filter((o) => o.slot === 'banden' || o.slot === 'wetten').length,
  };
  return (
    <div className="sp3-page">
      <nav className="tabs sp3-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}{counts[t.id] ? <span className="sp3-tab-n">{counts[t.id]}</span> : null}
          </button>
        ))}
      </nav>
      {tab === 'haupt' && <MainTab ctx={ctx} ui={ui} onTab={setTab} onGoto={onGoto} />}
      {tab === 'namen' && <NamingTab ctx={ctx} ui={ui} />}
      {tab === 'pyramide' && <PyramidTab ctx={ctx} ui={ui} />}
      {tab === 'banden' && <BoardsTab ctx={ctx} ui={ui} />}
      {ui.layer}
    </div>
  );
}

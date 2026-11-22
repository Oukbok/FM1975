import type { NewGameDraft } from './draft';
import { NatFlag } from '../../components/competition/CountryFlag';
import { jobNations } from '../../game/national/jobNations';
import { countryInfo, countryOfNat } from '../../data/countryFlags';
import { Toggle } from './StepMode';
import { confLabel } from '../../data/nationalTeams';

const natLabel = (code: string) => { const k = countryOfNat(code); return k ? countryInfo(k).name : code; };

// Schritt „Nationalteam“ (Wunsch Pascal): erscheint nur mit „Zusätzlich Nationaltrainer“ und liegt
// nach Spielwelt und Verein – Rang und Stärke gelten so schon für das gewählte Startjahr.
export function StepNation({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const list = jobNations(d.startYear);
  return (
    <div className="ng-natstep">
      <div className="ng-natlist" role="listbox" aria-label="Nation">
        {list.map((n) => (
          <button key={n.code} type="button" role="option" aria-selected={d.nationalTeam === n.code}
            className={`ng-natrow ${d.nationalTeam === n.code ? 'on' : ''}`} data-nat={n.code} onClick={() => set({ nationalTeam: n.code })}>
            <NatFlag nat={n.code} height={16} /><b>{natLabel(n.code)}</b>
            <small>{confLabel(n.conf)}</small><small>Rang {n.rank} · {n.label}</small><em>{n.base}</em>
          </button>
        ))}
      </div>
      <aside className="ng-card ng-natside">
        <h3 className="ng-h">Amt</h3>
        <Toggle on={d.nationalSackable} onChange={(v) => set({ nationalSackable: v })}
          label="Entlassung möglich" text="Verfehlte Ziele können dich das Amt kosten. Zurücktreten kannst du immer." />
        <p className="ng-note">Stärke = Grundstärke des Landes im Sommer {d.startYear}; im Spiel zählt dein Aufgebot. Umschalten Verein ↔ Nationalteam über die Kopfleiste.</p>
      </aside>
    </div>
  );
}

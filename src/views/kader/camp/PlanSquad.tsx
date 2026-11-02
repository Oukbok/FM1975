// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 3: Reisegruppe (Profis, eingeladene Jugendspieler,
// Verletzte zur Reha mit oder daheim), Trainingsschwerpunkt und Testspiele.
// =============================================================================
import { CAMP_FOCUS, CAMP_FOCUS_ORDER, CampFocus } from '../../../engine/trainingCamp';
import { CAMP_YOUTH_MAX } from '../../../game/campResult';
import type { Player } from '../../../types';
import { vColor } from '../../../ui/format';
import { PlayerFitness } from '../../../components/status';

const POS_ORDER = ['TW', 'LIB', 'VS', 'AV', 'DM', 'ZM', 'OM', 'FL', 'HS', 'MS'];

function Row({ p, on, onToggle, youth }: { p: Player; on: boolean; onToggle: () => void; youth?: boolean }) {
  return (
    <label className={`cp-pl ${on ? 'on' : ''} ${p.injury ? 'inj' : ''}`}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      <span className="pos-badge">{p.naturalPosition}</span>
      <span className="cp-pl-name">{p.fullName}</span>
      <span className="cp-pl-age">{p.age}</span>
      <span className="cp-pl-ovr" style={{ color: vColor(p.overall) }}>{Math.round(p.overall)}</span>
      <span className="cp-pl-fit"><PlayerFitness p={p} size={16} /></span>
      <span className="cp-pl-st">{p.injury ? `verletzt, ${p.injury.daysRemaining} T.` : youth ? `${p.age <= 17 ? 'B' : 'A'}-Jugend` : ''}</span>
    </label>
  );
}

export function PlanSquad({ pros, youth, squad, invited, setSquad, setInvited, focus, setFocus, tests, setTests }: {
  pros: Player[]; youth: Player[]; squad: Set<string>; invited: Set<string>;
  setSquad: (s: Set<string>) => void; setInvited: (s: Set<string>) => void;
  focus: CampFocus; setFocus: (f: CampFocus) => void; tests: number; setTests: (n: number) => void;
}) {
  const sorted = [...pros].sort((a, b) => POS_ORDER.indexOf(a.naturalPosition) - POS_ORDER.indexOf(b.naturalPosition) || b.overall - a.overall);
  const toggle = (set: Set<string>, id: string, put: (s: Set<string>) => void, max = 99) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else if (n.size < max) n.add(id);
    put(n);
  };
  const healthy = pros.filter((p) => !p.injury);
  const injuredAlong = pros.filter((p) => p.injury && squad.has(p.id)).length;
  return (
    <div className="cp-squad">
      <section className="cp-squad-main">
        <div className="cp-squad-bar">
          <span className="cp-sec">Profis <b>{pros.filter((p) => squad.has(p.id)).length}</b> von {pros.length}</span>
          <button className="dchip" onClick={() => setSquad(new Set(healthy.map((p) => p.id)))}>Alle Gesunden</button>
          <button className="dchip" onClick={() => setSquad(new Set(pros.map((p) => p.id)))}>Verletzte zur Reha mit</button>
          <button className="dchip" onClick={() => setSquad(new Set([...healthy].sort((a, b) => b.overall - a.overall).slice(0, 20).map((p) => p.id)))}>Nur die besten 20</button>
        </div>
        <div className="cp-pl head"><span /><span>Pos</span><span>Name</span><span>Alter</span><span>Stärke</span><span>Fitness</span><span>Status</span></div>
        <div className="cp-pl-list">
          {sorted.map((p) => <Row key={p.id} p={p} on={squad.has(p.id)} onToggle={() => toggle(squad, p.id, setSquad)} />)}
        </div>
      </section>
      <section className="cp-squad-side">
        <div className="cp-sec">Schwerpunkt</div>
        <div className="cp-focus">
          {CAMP_FOCUS_ORDER.map((f) => <button key={f} className={`dchip ${focus === f ? 'on' : ''}`} onClick={() => setFocus(f)}>{CAMP_FOCUS[f].label}</button>)}
        </div>
        <div className="cp-focus-text">{CAMP_FOCUS[focus].text}</div>
        <label className="cp-dur"><span>Testspiele vor Ort <b>{tests}</b></span>
          <input type="range" min={0} max={4} value={tests} onChange={(e) => setTests(Number(e.target.value))} /></label>
        <div className="cp-sec">Jugendspieler einladen <b>{invited.size}</b> / {CAMP_YOUTH_MAX}</div>
        {youth.length ? (
          <div className="cp-pl-list youth">
            {youth.slice(0, 12).map((p) => <Row key={p.id} p={p} youth on={invited.has(p.id)} onToggle={() => toggle(invited, p.id, setInvited, CAMP_YOUTH_MAX)} />)}
          </div>
        ) : <div className="cp-hint">Keine Spieler aus der B- oder A-Jugend verfügbar.</div>}
        <div className="cp-hint">
          Eingeladene Talente lernen im Training mit den Profis besonders viel. Gesunde Profis, die zu Hause bleiben, sind teils enttäuscht.
          {injuredAlong ? ` ${injuredAlong} Verletzte reisen mit – sinnvoll vor allem mit Schwerpunkt Regeneration.` : ''}
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 3: Reisegruppe (Profis, eingeladene Jugendspieler,
// Verletzte zur Reha mit oder daheim), Trainingsschwerpunkt (mit Symbolen wie im
// Trainingsplan) und Testspiele. Beide Listen sortierbar über die Spaltenköpfe.
// =============================================================================
import { useState } from 'react';
import Icon from '../../../components/Icon';
import { CAMP_FOCUS, CAMP_FOCUS_ORDER, CampFocus } from '../../../engine/trainingCamp';
import { CAMP_YOUTH_MAX } from '../../../game/campResult';
import type { Player } from '../../../types';
import { condColor, vColor } from '../../../ui/format';

const POS_ORDER = ['TW', 'LIB', 'VS', 'AV', 'DM', 'ZM', 'OM', 'FL', 'HS', 'MS'];
/** Symbole der Schwerpunkte – dieselben wie die Bausteine im Trainingsplan. */
export const CAMP_FOCUS_ICON: Record<CampFocus, string> = {
  ausgewogen: 'trCircuit', kondition: 'trEndurance', taktik: 'trTactics', teamgeist: 'trMental', regeneration: 'trRecovery', jugend: 'youth',
};

type SortKey = 'pos' | 'name' | 'age' | 'ovr' | 'fit' | 'st';
const COLS: { k: SortKey; label: string }[] = [
  { k: 'pos', label: 'Pos' }, { k: 'name', label: 'Name' }, { k: 'age', label: 'Alter' },
  { k: 'ovr', label: 'Stärke' }, { k: 'fit', label: 'Fitness' }, { k: 'st', label: 'Status' },
];
/** Erste Richtung je Spalte: Texte/Position aufsteigend, Werte absteigend. */
const DESC_FIRST: Record<SortKey, boolean> = { pos: false, name: false, age: false, ovr: true, fit: true, st: true };
interface Sort { k: SortKey; desc: boolean }
function sortVal(p: Player, k: SortKey): number | string {
  switch (k) {
    case 'pos': return POS_ORDER.indexOf(p.naturalPosition) * 1000 - p.overall;
    case 'name': return p.lastName ?? p.fullName;
    case 'age': return p.age;
    case 'ovr': return p.overall;
    case 'fit': return p.attributes.fitness;
    case 'st': return p.injury ? p.injury.daysRemaining : -1;
  }
}
function sortPlayers(list: Player[], s: Sort): Player[] {
  const dir = s.desc ? -1 : 1;
  return [...list].sort((a, b) => {
    const x = sortVal(a, s.k), y = sortVal(b, s.k);
    const c = typeof x === 'string' ? x.localeCompare(y as string, 'de') : x - (y as number);
    return c * dir || b.overall - a.overall;
  });
}
function Head({ sort, onSort }: { sort: Sort; onSort: (s: Sort) => void }) {
  return (
    <div className="cp-pl head" role="row">
      <span />
      {COLS.map((c) => (
        <button key={c.k} type="button" className={`cp-sort ${sort.k === c.k ? `on ${sort.desc ? 'desc' : 'asc'}` : ''} cp-h-${c.k}`}
          onClick={() => onSort(sort.k === c.k ? { k: c.k, desc: !sort.desc } : { k: c.k, desc: DESC_FIRST[c.k] })}>{c.label}</button>
      ))}
    </div>
  );
}

function Row({ p, on, onToggle, youth }: { p: Player; on: boolean; onToggle: () => void; youth?: boolean }) {
  const fit = Math.round(p.attributes.fitness);
  return (
    <label className={`cp-pl ${on ? 'on' : ''} ${p.injury ? 'inj' : ''}`}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      <span className="pos-badge">{p.naturalPosition}</span>
      <span className="cp-pl-name">{p.fullName}</span>
      <span className="cp-pl-age">{p.age}</span>
      <span className="cp-pl-ovr" style={{ color: vColor(p.overall) }}>{Math.round(p.overall)}</span>
      <span className="cp-pl-fit" style={{ color: condColor(fit) }}>{fit}</span>
      <span className="cp-pl-st">{p.injury ? `verletzt, ${p.injury.daysRemaining} T.` : youth ? `${p.age <= 17 ? 'B' : 'A'}-Jugend` : ''}</span>
    </label>
  );
}

export function PlanSquad({ pros, youth, squad, invited, setSquad, setInvited, focus, setFocus, tests, setTests }: {
  pros: Player[]; youth: Player[]; squad: Set<string>; invited: Set<string>;
  setSquad: (s: Set<string>) => void; setInvited: (s: Set<string>) => void;
  focus: CampFocus; setFocus: (f: CampFocus) => void; tests: number; setTests: (n: number) => void;
}) {
  const [sortP, setSortP] = useState<Sort>({ k: 'pos', desc: false });
  const [sortY, setSortY] = useState<Sort>({ k: 'ovr', desc: true });
  const sorted = sortPlayers(pros, sortP);
  const youthSorted = sortPlayers(youth.slice(0, 12), sortY);
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
        <Head sort={sortP} onSort={setSortP} />
        <div className="cp-pl-list">
          {sorted.map((p) => <Row key={p.id} p={p} on={squad.has(p.id)} onToggle={() => toggle(squad, p.id, setSquad)} />)}
        </div>
      </section>
      <section className="cp-squad-side">
        <div className="cp-sec">Schwerpunkt</div>
        <div className="cp-focus">
          {CAMP_FOCUS_ORDER.map((f) => (
            <button key={f} className={`cp-focus-b ${focus === f ? 'on' : ''}`} onClick={() => setFocus(f)}>
              <Icon name={CAMP_FOCUS_ICON[f]} size={26} /><span>{CAMP_FOCUS[f].label}</span>
            </button>
          ))}
        </div>
        <div className="cp-focus-text">{CAMP_FOCUS[focus].text}</div>
        <label className="cp-dur"><span>Testspiele vor Ort <b>{tests}</b></span>
          <input type="range" min={0} max={4} value={tests} onChange={(e) => setTests(Number(e.target.value))} /></label>
        <div className="cp-sec">Jugendspieler einladen <b>{invited.size}</b> / {CAMP_YOUTH_MAX}</div>
        {youth.length ? (
          <div className="cp-youth">
          <Head sort={sortY} onSort={setSortY} />
          <div className="cp-pl-list youth">
            {youthSorted.map((p) => <Row key={p.id} p={p} youth on={invited.has(p.id)} onToggle={() => toggle(invited, p.id, setInvited, CAMP_YOUTH_MAX)} />)}
          </div>
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

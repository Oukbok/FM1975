// =============================================================================
// Arbeitsmarkt: Filterleiste (Stelle, Fähigkeit ab Mindestwert, Alter,
// vereinslos, Ex-Profis) und Tabelle – sortiert nach der Eignung für die
// gesuchte Stelle (bei „Alle Stellen“: nach der besten Stelle der Person).
// =============================================================================
import { economyScale, yearOf } from '../../engine/economy';
import { memberMonthlySalary } from '../../engine/staffPeople';
import { type CoachSkill, roleName, SKILL_GROUPS, SKILL_LABEL, staffLevel } from '../../engine/staffSkills';
import type { Game } from '../../game/state';
import type { MarketRow } from '../../game/staffWorld';
import { demandOf, willMove } from '../../game/trainerTeam';
import { ClubLink } from '../../components/club/ClubLink';
import { Empty } from '../../ui/DashPage';
import { fmtStaffWage } from '../../ui/format';
import Seg from '../../ui/Seg';
import Select from '../../ui/Select';
import { growthWord, Level, LevelBar, originText, topSkills } from './staffUi';

export interface MarketState { role: string; skill: '' | CoachSkill; minLvl: number; maxAge: number; onlyFree: boolean; exPro: boolean }

export function MarketFilters({ g, roles, f, set }: { g: Game; roles: string[]; f: MarketState; set: (p: Partial<MarketState>) => void }) {
  void g;
  return (
    <div className="sf-filters">
      <label className="sf-filter"><span>Stelle</span>
        <Select width={250} value={f.role} onChange={(v) => set({ role: v })} aria-label="Stelle">
          <option value="all">Alle Stellen</option>
          {roles.map((id) => <option key={id} value={id}>{roleName(id)}</option>)}
        </Select>
      </label>
      <label className="sf-filter"><span>Fähigkeit</span>
        <Select width={210} value={f.skill} onChange={(v) => set({ skill: v as MarketState['skill'], minLvl: v && !f.minLvl ? 70 : f.minLvl })} aria-label="Fähigkeit">
          <option value="">egal</option>
          {SKILL_GROUPS.map((grp) => (
            <optgroup key={grp.id} label={grp.label}>
              {grp.skills.map((k) => <option key={k} value={k}>{SKILL_LABEL[k]}</option>)}
            </optgroup>
          ))}
        </Select>
      </label>
      <Seg<number> size="s" aria-label="Mindestwert" value={f.skill ? f.minLvl : 0} onChange={(v) => set({ minLvl: v })}
        options={[60, 70, 80].map((v) => ({ v, label: `ab ${v}`, disabled: !f.skill }))} />
      <Seg<number> size="s" aria-label="Alter" value={f.maxAge} onChange={(v) => set({ maxAge: v })}
        options={[{ v: 0, label: 'jedes Alter' }, { v: 35, label: 'bis 35' }, { v: 45, label: 'bis 45' }]} />
      <span className="sf-filter-gap" />
      <button type="button" className={`b3 b3-s ${f.onlyFree ? 'on' : ''}`} onClick={() => set({ onlyFree: !f.onlyFree })}>nur vereinslos</button>
      <button type="button" className={`b3 b3-s ${f.exPro ? 'on' : ''}`} onClick={() => set({ exPro: !f.exPro })}>Ex-Profis</button>
    </div>
  );
}

export function MarketTable({ g, rows, role, selId, onSelect, onTalk }: {
  g: Game; rows: MarketRow[]; role: string; selId: string | null;
  onSelect: (id: string) => void; onTalk: (id: string, role: string) => void;
}) {
  const scale = economyScale(yearOf(g.calendar.currentDate));
  if (!rows.length) return <div className="sf-table-wrap"><Empty icon="staff">Niemand passt zu diesen Vorgaben. Lockere den Filter oder such auch bei anderen Vereinen.</Empty></div>;
  return (
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            <th>Name</th><th className="c">Alter</th>{role === 'all' && <th>Beste Stelle</th>}
            <th>Eignung{role !== 'all' ? ` als ${roleName(role)}` : ''}</th><th>Stärken</th><th>Aussicht</th><th>Verein</th><th className="r">Forderung</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, fit, role: r }) => {
            const lvl = staffLevel(fit);
            const moves = willMove(g, m);
            return (
              <tr key={m.id} className={`${selId === m.id ? 'sel' : ''} ${moves ? '' : 'no'}`} onClick={() => onSelect(m.id)}>
                <td className="sf-td-name"><b>{m.name}</b><i>{originText(m)}{m.home === g.managedClubId ? ' · einer von uns' : ''}</i></td>
                <td className="c">{m.age}</td>
                {role === 'all' && <td>{roleName(r)}</td>}
                <td className="sf-td-fit"><Level v={lvl} /><LevelBar v={lvl} /></td>
                <td className="sf-td-skills">{topSkills(m, 2).map((x) => <span key={x.k}>{SKILL_LABEL[x.k]} <b>{x.v}</b></span>)}</td>
                <td className="dim">{growthWord(m, r)}</td>
                <td>{m.clubId ? <ClubLink id={m.clubId}>{g.clubs[m.clubId]?.shortName ?? '–'}</ClubLink> : <span className="dim">vereinslos</span>}</td>
                <td className="r">{fmtStaffWage(memberMonthlySalary({ ...m, roleId: r, salaryFactor: demandOf(g, m, r) }, scale), { unit: false })}</td>
                <td className="r"><button type="button" className="b3 b3-s" disabled={!moves} title={moves ? undefined : 'Kommt nicht zu deinem Verein'} onClick={(e) => { e.stopPropagation(); onTalk(m.id, r); }}>Verhandeln</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Stellenplan: Kennzahlen oben, darunter jede Stelle mit ihrer Besetzung
// (Eignung als Stärke 1–99) oder als offene Stelle mit „Suchen“.
// =============================================================================
import { STAFF_BY_ID } from '../../data/staff';
import { clubTrainingFactor } from '../../engine/development';
import { economyScale, yearOf } from '../../engine/economy';
import { memberMonthlySalary, type StaffMember } from '../../engine/staffPeople';
import { roleName, roleSlots, TEAM_ROLES } from '../../engine/staffSkills';
import { coachingOutlook } from '../../game/coachingGame';
import type { Game } from '../../game/state';
import { ensureStaff, staffStrengthOf } from '../../game/staffGame';
import { monthsLeft } from '../../game/trainerTeam';
import { fmtStaffWage, wageUnit } from '../../ui/format';
import { availableIn, fitLevel, Level, originText, scopeGroups, scopeRoles, type StaffScope } from './staffUi';

const WHAT: Record<string, string> = Object.fromEntries(TEAM_ROLES.map((r) => [r.id, r.what]));

export function StaffSlots({ g, scope, selId, msg, onSelect, onSearch }: {
  g: Game; scope: StaffScope; selId: string | null; msg: string | null;
  onSelect: (id: string) => void; onSearch: (roleId: string) => void;
}) {
  const today = g.calendar.currentDate, year = yearOf(today);
  const scale = economyScale(year);
  const staff = ensureStaff(g);
  const club = g.clubs[g.managedClubId];
  const mineRoles = new Set(scopeRoles(scope));
  const mine = staff.filter((m) => mineRoles.has(m.roleId));
  const cost = mine.reduce((s, m) => s + memberMonthlySalary(m, scale), 0);
  const out = scope === 'team' ? coachingOutlook(g) : null;
  const team = out?.team ?? null;
  const groups = scopeGroups(scope).map((grp) => ({ ...grp, now: availableIn(grp.roles, year), later: grp.roles.filter((id) => STAFF_BY_ID[id] && STAFF_BY_ID[id].unlockYear > year).sort((a, b) => STAFF_BY_ID[a].unlockYear - STAFF_BY_ID[b].unlockYear) })).filter((grp) => grp.now.length || grp.later.length);
  const slotsTotal = groups.reduce((s, grp) => s + grp.now.length, 0);
  const filledRoles = groups.reduce((s, grp) => s + grp.now.filter((id) => mine.some((m) => m.roleId === id)).length, 0);

  const person = (m: StaffMember) => {
    const left = monthsLeft(m, today);
    return (
      <button key={m.id} type="button" className={`sf-slot ${selId === m.id ? 'sel' : ''}`} onClick={() => onSelect(m.id)}>
        <Level v={fitLevel(m, m.roleId)} />
        <span className="sf-slot-main">
          <span className="sf-slot-role">{roleName(m.roleId)}</span>
          <span className="sf-slot-name">{m.name}</span>
          <span className="sf-slot-sub">{m.age} J. · {originText(m)} · {fmtStaffWage(memberMonthlySalary(m, scale), { unit: false })}</span>
        </span>
        <span className={`sf-slot-end ${left <= 6 ? 'warn' : ''}`}>{left <= 6 ? 'läuft aus' : `bis ${m.contractEnd?.slice(0, 4) ?? '–'}`}</span>
      </button>
    );
  };
  const vacancy = (roleId: string, key: string, needed: boolean) => (
    <div key={key} className={`sf-slot vacant ${needed ? 'need' : ''}`}>
      <Level v={null} />
      <span className="sf-slot-main">
        <span className="sf-slot-role">{roleName(roleId)}</span>
        <span className="sf-slot-name">{needed ? 'fehlt' : 'unbesetzt'}</span>
        <span className="sf-slot-sub">{needed ? (roleId === 'cheftrainer' ? 'Ohne ihn leidet die Entwicklung deutlich.' : 'Für die Größe deines Vereins zu wenige.') : WHAT[roleId] ?? STAFF_BY_ID[roleId]?.effect ?? ''}</span>
      </span>
      <button type="button" className="b3 b3-s" onClick={() => onSearch(roleId)}>Suchen</button>
    </div>
  );
  const role = (roleId: string) => {
    const holders = mine.filter((m) => m.roleId === roleId).sort((a, b) => fitLevel(b, roleId) - fitLevel(a, roleId));
    const slots = roleSlots(roleId, year);
    // Gebrauchte offene Plätze einzeln zeigen, darüber hinaus höchstens einen freien.
    const need = team ? (roleId === 'cheftrainer' ? 1 : roleId === 'cotrainer' ? team.need : 0) : 0;
    const missing = Math.max(0, Math.min(slots, need) - holders.length);
    const spare = holders.length + missing < slots ? 1 : 0;
    return [
      ...holders.map(person),
      ...Array.from({ length: missing }, (_, i) => vacancy(roleId, `${roleId}-n${i}`, true)),
      ...(spare && !missing ? [vacancy(roleId, `${roleId}-v`, false)] : []),
    ];
  };
  const dev = team && club ? Math.round((clubTrainingFactor(club, team.extra) / clubTrainingFactor(club, 0) - 1) * 100) : 0;
  const ss = scope === 'club' ? staffStrengthOf(g) : null;
  const ssPct = ss ? (ss.factor - 1) * 100 : 0;

  return (
    <div className="sf-slots">
      <div className="sf-kpis">
        {team ? <>
          <div className="sf-kpi"><span>Niveau</span><b>{Math.round(team.level)}</b><i>{out!.rank}. von {out!.of} in der Liga</i></div>
          <div className={`sf-kpi ${dev < 0 ? 'neg' : ''}`}><span>Entwicklung</span><b>{dev >= 0 ? '+' : '−'}{Math.abs(dev)} %</b><i>{team.penalty < 0 ? 'Stellen fehlen' : 'durch das Trainerteam'}</i></div>
        </> : <>
          <div className="sf-kpi"><span>Besetzt</span><b>{filledRoles}/{slotsTotal}</b><i>Stellen der Zeit</i></div>
          <div className={`sf-kpi ${ssPct < -1.5 ? 'neg' : ''}`}><span>Spielstärke</span><b>{ssPct >= 0 ? '+' : '−'}{Math.abs(ssPct).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</b><i>durch den ganzen Stab</i></div>
        </>}
        <div className="sf-kpi"><span>Gehälter</span><b>{fmtStaffWage(cost, { unit: false })}</b><i>pro {wageUnit()}</i></div>
      </div>
      <div className={`sf-msg ${msg ? 'on' : ''}`}>{msg ?? (scope === 'team' ? 'Das Niveau des Trainerteams entscheidet, wie weit deine Spieler kommen.' : 'Jede Stelle wirkt ein wenig – zusammen spürbar.')}</div>
      <div className="sf-slotlist">
        {groups.map((grp) => (
          <div key={grp.id} className="sf-group">
            {scope === 'club' && <div className="sf-group-h"><span>{grp.label}</span>{grp.now.length > 0 && <i>{grp.now.filter((id) => mine.some((m) => m.roleId === id)).length}/{grp.now.length}</i>}</div>}
            {grp.now.flatMap(role)}
            {grp.later.length > 0 && <div className="sf-later">Später: {grp.later.slice(0, 3).map((id) => `${roleName(id)} (ab ${STAFF_BY_ID[id].unlockYear})`).join(', ')}{grp.later.length > 3 ? ` und ${grp.later.length - 3} weitere` : ''}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

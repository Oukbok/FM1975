import { economyScale, yearOf } from '../../engine/economy';
import { coachingReport, memberMonthlySalary, StaffMember } from '../../engine/staffPeople';
import { TEAM_ROLES, teamRolesAvailable } from '../../engine/staffSkills';
import { STAFF_BY_ID } from '../../data/staff';
import { Game } from '../../game/state';
import { ensureStaff } from '../../game/staffGame';
import { ensureStaffWorld, marketForRole } from '../../game/staffWorld';
import { demandOf, dismiss, extendContract, monthsLeft, roleLabel, severanceOf } from '../../game/trainerTeam';
import { DashBox, DashPage, Empty, Kpi } from '../../ui/DashPage';
import { fmtDMfull as fmtDM, fmtDM as fmtDMshort } from '../../ui/format';
import { PersonDetail, QBar, StaffNegotiation, originText, topSkills } from './teamParts';
import { useState } from 'react';

// =============================================================================
// TRAINING › TRAINERTEAM — dein Team (Stärken, Vertrag, Gehalt) und der
// Arbeitsmarkt (Bewerber und Angestellte anderer Vereine) mit Verhandlung.
// =============================================================================
export function TrainerTeamView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [, setTick] = useState(0);
  const [role, setRole] = useState<string>('all');
  const [onlyFree, setOnlyFree] = useState(true);
  const [sel, setSel] = useState<{ id: string; own: boolean } | null>(null);
  const [talk, setTalk] = useState<StaffMember | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const refresh = (text?: string) => { if (text) setMsg(text); setTick((t) => t + 1); onChange(); };
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  ensureStaffWorld(g);
  const staff = ensureStaff(g);
  const avail = teamRolesAvailable(year);
  const team = staff.filter((m) => avail.includes(m.roleId) || TEAM_ROLES.some((r) => r.id === m.roleId));
  const club = g.clubs[g.managedClubId];
  const rep = coachingReport(staff, club?.playerIds.length ?? 22, year);
  const cost = team.reduce((s, m) => s + memberMonthlySalary(m, scale), 0);
  const market = marketForRole(g, role).filter((m) => (!onlyFree || !m.clubId) && avail.includes(m.roleId)).slice(0, 80);
  const selected = sel ? (sel.own ? staff : g.staffWorld?.people ?? []).find((m) => m.id === sel.id) ?? null : null;
  const today = g.calendar.currentDate;
  const laterRoles = TEAM_ROLES.filter((r) => !avail.includes(r.id) && STAFF_BY_ID[r.id]);

  return (
    <DashPage>
      <DashBox title="Dein Trainerteam" icon="whistle" rows={2} right={team.length === 1 ? '1 Person' : `${team.length} Personen`}>
        <div className="dkpis">
          <Kpi value={`${rep.extra >= 0 ? '+' : ''}${Math.round(rep.extra * 100)} %`} label="Entwicklung" />
          <Kpi value={`${Math.round(rep.capacity * 100)} %`} label="Betreuung" color={rep.capacity < 0.8 ? 'var(--neg)' : undefined} />
          <Kpi value={fmtDMshort(cost)} label="Gehälter / Monat" />
        </div>
        {msg && <div className="tt-msg">{msg}</div>}
        {TEAM_ROLES.filter((r) => avail.includes(r.id)).map((r) => {
          const m = staff.find((x) => x.roleId === r.id);
          if (!m) {
            return (
              <div key={r.id} className="tt-row vacant">
                <div className="tt-row-main"><b>{r.label}</b> <span className="muted">· unbesetzt</span><div className="dnote">{r.what}</div></div>
                <button className="dchip" onClick={() => { setRole(r.id); setSel(null); }}>Kandidaten</button>
              </div>
            );
          }
          const left = monthsLeft(m, today);
          return (
            <div key={r.id} className={`tt-row ${sel?.id === m.id ? 'sel' : ''}`} onClick={() => setSel({ id: m.id, own: true })}>
              <div className="tt-row-main">
                <span className="tt-role">{r.label}</span>
                <b>{m.name}</b> <span className="muted">· {m.age} J.{m.exPro ? ' · Ex-Profi' : ''}</span>
                <div className="tt-row-sub"><QBar q={m.quality} /> <span>{m.quality}/20</span> <span className="dim2">{topSkills(m, 2)}</span></div>
                <div className="dnote">bis {m.contractEnd?.slice(0, 4) ?? '–'}{left <= 6 ? <span className="tt-warn"> · läuft aus</span> : ''} · {fmtDM(memberMonthlySalary(m, scale))}/Monat</div>
              </div>
              <div className="tt-row-btns" onClick={(e) => e.stopPropagation()}>
                <button className="dchip" title={`Neue Forderung ${fmtDM(memberMonthlySalary({ ...m, salaryFactor: Math.max(m.salaryFactor, demandOf(g, m)) }, scale))}/Monat`} onClick={() => refresh(extendContract(g, m.id, 2))}>+2 Jahre</button>
                <button className="dchip" title={`Abfindung ${fmtDM(severanceOf(g, m))}`} onClick={() => { if (confirm(`${m.name} entlassen? Abfindung ${fmtDM(severanceOf(g, m))}.`)) { setSel(null); refresh(dismiss(g, m.id)); } }}>Entlassen</button>
              </div>
            </div>
          );
        })}
        {laterRoles.length > 0 && <div className="dnote mt8">Später: {laterRoles.map((r) => `${r.label} (ab ${STAFF_BY_ID[r.id].unlockYear})`).join(', ')}.</div>}
      </DashBox>

      <DashBox title="Arbeitsmarkt" icon="staff" span={2}
        right={<span className="tt-filter">
          <select className="tt-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">Alle Rollen</option>
            {TEAM_ROLES.filter((r) => avail.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button className={`dchip ${onlyFree ? 'on' : ''}`} onClick={() => setOnlyFree((v) => !v)}>nur vereinslos</button>
        </span>}>
        {market.length ? (
          <table className="tt-table">
            <thead><tr><th>Name</th><th>Rolle</th><th>Alter</th><th>Herkunft</th><th>Qualität</th><th>Stärken</th><th>Verein</th><th className="r">Forderung</th><th /></tr></thead>
            <tbody>
              {market.map((m) => (
                <tr key={m.id} className={sel?.id === m.id ? 'sel' : ''} onClick={() => setSel({ id: m.id, own: false })}>
                  <td><b>{m.name}</b></td>
                  <td>{roleLabel(m.roleId)}</td>
                  <td>{m.age}</td>
                  <td className="dim2">{m.exPro ? `Ex-Profi ${m.exPro.pos}` : 'Quereinsteiger'}</td>
                  <td><QBar q={m.quality} /> {m.quality}</td>
                  <td className="dim2">{topSkills(m, 2)}</td>
                  <td>{m.clubId ? g.clubs[m.clubId]?.shortName ?? '–' : <span className="dim2">vereinslos</span>}</td>
                  <td className="r">{fmtDM(memberMonthlySalary({ ...m, salaryFactor: demandOf(g, m) }, scale))}</td>
                  <td><button className="dchip" onClick={(e) => { e.stopPropagation(); setTalk(m); }}>Verhandeln</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon="staff">Niemand passt zum Filter.</Empty>}
      </DashBox>

      <DashBox title={selected ? selected.name : 'Person'} icon="staff" span={2}
        right={selected ? `${roleLabel(selected.roleId)} · ${originText(selected)}` : undefined}>
        {selected ? <PersonDetail g={g} m={selected} own={!!sel?.own} />
          : <Empty icon="staff">Wähle jemanden aus deinem Team oder vom Arbeitsmarkt. Ehemalige Profis bringen ihr Spielverständnis mit – erfolgreiche Spieler werden öfter gute Trainer, eine Garantie ist es nicht.</Empty>}
      </DashBox>

      {talk && <StaffNegotiation g={g} m={talk} onClose={() => setTalk(null)} onDone={(t) => { setTalk(null); setSel(null); refresh(t); }} />}
    </DashPage>
  );
}

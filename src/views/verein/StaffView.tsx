import { type IconName } from '../../components/Icon';
import { STAFF_BY_ID, STAFF_CAPS, STAFF_GROUP_META, STAFF_ROLES, computeStaffEffects, staffAvailable, staffMonthlySalary, staffMonthlyTotal } from '../../data/staff';
import { economyScale, yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { DashBox, DashPage, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// MITARBEITER — Wirkung des Stabs + je Bereich eine Box mit anstellbaren Rollen
// =============================================================================
export type StaffGroupKey = 'trainer' | 'medical' | 'scouting' | 'media' | 'admin';
const GROUP_ICON: Record<StaffGroupKey, IconName> = {
  trainer: 'training', medical: 'facilities', scouting: 'watchlist', media: 'presse', admin: 'contracts',
};

export function StaffView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const hired = new Set(g.hiredStaff ?? []);
  const monthly = staffMonthlyTotal(g.hiredStaff ?? [], scale);
  const fx = computeStaffEffects(g.hiredStaff ?? []);

  const toggle = (id: string) => {
    const role = STAFF_BY_ID[id];
    if (!role) return;
    const list = g.hiredStaff ?? (g.hiredStaff = []);
    const idx = list.indexOf(id);
    if (idx >= 0) { list.splice(idx, 1); setMsg(`${role.name} entlassen.`); }
    else { list.push(id); setMsg(`${role.name} angestellt (${fmtDM(staffMonthlySalary(role, scale))}/Monat).`); }
    onChange();
  };

  const groups: StaffGroupKey[] = ['trainer', 'medical', 'scouting', 'media', 'admin'];

  return (
    <DashPage>
      <DashBox title="Wirkung des Stabs" icon="staff" right={`${hired.size} angestellt`}>
        <div className="dkpis"><Kpi value={fmtDM(monthly)} label="Personalkosten / Monat" /></div>
        <Meter label="Verletzungsrisiko" value={fx.injuryReduction} max={STAFF_CAPS.injuryReduction} text={`−${Math.round(fx.injuryReduction * 100)} %`} />
        <Meter label="Ausfallzeit" value={fx.rehabReduction} max={STAFF_CAPS.rehabReduction} text={`−${Math.round(fx.rehabReduction * 100)} %`} />
        <Meter label="Regeneration" value={fx.recovery} max={STAFF_CAPS.recovery} text={`+${fx.recovery.toFixed(1)}/Tag`} />
        <Meter label="Scouting" value={fx.scouting} max={STAFF_CAPS.scouting} text={`+${Math.round(fx.scouting * 100)} %`} />
        <Meter label="Reichweite" value={fx.reach} max={STAFF_CAPS.reach} text={`+${Math.round(fx.reach * 100)} %`} />
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
        <div className="dnote mt8">Balken = Anteil am Höchstwert. Alle Effekte sind gedeckelt, einen direkten Sieg-Bonus gibt es nicht.</div>
      </DashBox>

      {groups.map((grp) => {
        const roles = STAFF_ROLES.filter((r) => r.group === grp);
        const now = roles.filter((r) => staffAvailable(r, curYear));
        const later = roles.filter((r) => !staffAvailable(r, curYear)).sort((a, b) => a.unlockYear - b.unlockYear);
        return (
          <DashBox key={grp} title={STAFF_GROUP_META[grp].label} icon={GROUP_ICON[grp]}
            right={`${now.filter((r) => hired.has(r.id)).length}/${now.length}`}>
            {now.map((r) => {
              const isHired = hired.has(r.id);
              return (
                <div key={r.id} className={`dlist-row ${isHired ? 'dstaff-on' : ''}`} style={{ alignItems: 'flex-start' }}>
                  <span className="grow">
                    <b>{r.name}</b> <span className="muted">· {r.costClass} · {fmtDM(staffMonthlySalary(r, scale))}/Monat</span>
                    <span className="dnote" style={{ display: 'block' }}>{r.effect}</span>
                  </span>
                  <button className={`dchip ${isHired ? 'on' : ''}`} onClick={() => toggle(r.id)}>{isHired ? 'Entlassen' : 'Anstellen'}</button>
                </div>
              );
            })}
            {later.length > 0 && <>
              <div className="dsec">Spätere Epochen</div>
              {later.map((r) => (
                <div key={r.id} className="dlist-row" style={{ opacity: 0.5 }}>
                  <span className="grow">{r.name}</span><span className="meta">ab {r.unlockYear}</span>
                </div>
              ))}
            </>}
            {now.length === 0 && later.length === 0 && <div className="dnote">Keine Rollen.</div>}
          </DashBox>
        );
      })}
    </DashPage>
  );
}

export function StaffFxPill({ label, value, cap }: { label: string; value: string; cap: string }) {
  return (
    <div className="staff-fx">
      <div className="staff-fx-val accent-text">{value}</div>
      <div className="mini">{label}</div>
      <div className="dim2 mini">{cap}</div>
    </div>
  );
}

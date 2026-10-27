import { type IconName } from '../../components/Icon';
import { STAFF_CAPS, STAFF_GROUP_META, STAFF_ROLES, StaffRole, staffAvailable } from '../../data/staff';
import { economyScale, yearOf } from '../../engine/economy';
import {
  SPECIALTY_LABEL, StaffMember, coachingReport, memberMonthlySalary, methodFactor, trainingCourseCost,
} from '../../engine/staffPeople';
import { Game } from '../../game/state';
import { candidatesFor, ensureStaff, fireStaff, hireStaff, sendToCourse, staffEffectsOf } from '../../game/staffGame';
import { DashBox, DashPage, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// MITARBEITER 2.0 — Wirkung des Stabs + je Bereich eine Box mit Personen
// =============================================================================
export type StaffGroupKey = 'trainer' | 'medical' | 'scouting' | 'media' | 'admin';
const GROUP_ICON: Record<StaffGroupKey, IconName> = {
  trainer: 'training', medical: 'facilities', scouting: 'watchlist', media: 'presse', admin: 'contracts',
};

function QualityBar({ q }: { q: number }) {
  const color = q >= 15 ? 'var(--green)' : q >= 10 ? 'var(--accent)' : q >= 6 ? 'var(--yellow)' : 'var(--orange)';
  return (
    <span className="dmeter-track" style={{ display: 'inline-block', width: 90, verticalAlign: 'middle', marginLeft: 6 }}>
      <span className="dmeter-fill" style={{ width: `${(q / 20) * 100}%`, background: color }} />
    </span>
  );
}

export function StaffView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const staff = ensureStaff(g);
  const byRole = new Map(staff.map((m) => [m.roleId, m]));
  const monthly = staff.reduce((a, m) => a + memberMonthlySalary(m, scale), 0);
  const fx = staffEffectsOf(g);
  const club = g.clubs[g.managedClubId];
  const coach = coachingReport(staff, club?.playerIds.length ?? 22, curYear);

  const act = (text: string) => { setMsg(text); setOpen(null); onChange(); };
  const groups: StaffGroupKey[] = ['trainer', 'medical', 'scouting', 'media', 'admin'];

  const member = (r: StaffRole, m: StaffMember) => {
    const mf = methodFactor(m, curYear);
    return (
      <div key={r.id} className="dlist-row dstaff-on" style={{ alignItems: 'flex-start' }}>
        <span className="grow">
          <b>{r.name}</b>: {m.name} <span className="muted">· {m.age} J.</span>
          <span className="dnote" style={{ display: 'block' }}>
            Qualität {m.quality}/20<QualityBar q={m.quality} />
            {m.specialty !== 'allround' && <> · {SPECIALTY_LABEL[m.specialty]}</>}
            {' · '}Methoden {m.methodYear}{mf < 0.9 ? <span style={{ color: 'var(--orange)' }}> (veraltet, {Math.round(mf * 100)} %)</span> : ''}
            {' · '}{fmtDM(memberMonthlySalary(m, scale))}/Monat
          </span>
        </span>
        <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {mf < 1 && <button className="dchip" title={`Kosten ${fmtDM(trainingCourseCost(m, scale))}`} onClick={() => act(sendToCourse(g, m.id))}>Fortbildung</button>}
          <button className="dchip" onClick={() => act(fireStaff(g, m.id))}>Entlassen</button>
        </span>
      </div>
    );
  };

  const vacancy = (r: StaffRole) => {
    const isOpen = open === r.id;
    return (
      <div key={r.id} className="dlist-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span className="grow">
            <b>{r.name}</b> <span className="muted">· unbesetzt</span>
            <span className="dnote" style={{ display: 'block' }}>{r.effect}</span>
          </span>
          <button className={`dchip ${isOpen ? 'on' : ''}`} onClick={() => setOpen(isOpen ? null : r.id)}>Bewerber</button>
        </div>
        {isOpen && candidatesFor(g, r.id).map((c, i) => (
          <div key={c.id} className="dlist-row" style={{ marginLeft: 12 }}>
            <span className="grow">
              <b>{['Nachwuchskraft', 'Erfahren', 'Spitzenkraft'][i]}</b>: {c.name} <span className="muted">· {c.age} J.</span>
              <span className="dnote" style={{ display: 'block' }}>
                Qualität {c.quality}/20<QualityBar q={c.quality} />
                {c.specialty !== 'allround' && <> · {SPECIALTY_LABEL[c.specialty]}</>} · Methoden {c.methodYear}
                {' · '}{fmtDM(memberMonthlySalary(c, scale))}/Monat
              </span>
            </span>
            <button className="dchip on" onClick={() => act(hireStaff(g, c))}>Einstellen</button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashPage>
      <DashBox title="Wirkung des Stabs" icon="staff" right={`${staff.length} Personen`}>
        <div className="dkpis">
          <Kpi value={fmtDM(monthly)} label="Personalkosten / Monat" />
          <Kpi value={`${coach.extra >= 0 ? '+' : ''}${Math.round(coach.extra * 100)} %`} label="Trainingswirkung" color={coach.extra >= 0 ? 'var(--green)' : 'var(--orange)'} />
        </div>
        <Meter label="Betreuung" value={coach.capacity} max={1} text={`${Math.round(coach.capacity * 100)} %`} />
        <Meter label="Verletzungsrisiko" value={fx.injuryReduction} max={STAFF_CAPS.injuryReduction} text={`−${Math.round(fx.injuryReduction * 100)} %`} />
        <Meter label="Ausfallzeit" value={fx.rehabReduction} max={STAFF_CAPS.rehabReduction} text={`−${Math.round(fx.rehabReduction * 100)} %`} />
        <Meter label="Regeneration" value={fx.recovery} max={STAFF_CAPS.recovery} text={`+${fx.recovery.toFixed(1)}/Tag`} />
        <Meter label="Scouting" value={fx.scouting} max={STAFF_CAPS.scouting} text={`+${Math.round(fx.scouting * 100)} %`} />
        <Meter label="Reichweite" value={fx.reach} max={STAFF_CAPS.reach} text={`+${Math.round(fx.reach * 100)} %`} />
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 15 }}>{msg}</div>}
        <div className="dnote mt8">Gute Trainer holen zuverlässiger heraus, was in den Spielern steckt – das Potenzial selbst steigt nicht. Ein Trainer betreut etwa neun Spieler. Wirkung und Effekte sind gedeckelt.</div>
      </DashBox>

      {groups.map((grp) => {
        const roles = STAFF_ROLES.filter((r) => r.group === grp);
        const now = roles.filter((r) => staffAvailable(r, curYear));
        const later = roles.filter((r) => !staffAvailable(r, curYear)).sort((a, b) => a.unlockYear - b.unlockYear);
        const filled = now.filter((r) => byRole.has(r.id));
        return (
          <DashBox key={grp} title={STAFF_GROUP_META[grp].label} icon={GROUP_ICON[grp]} right={`${filled.length}/${now.length}`}>
            {filled.map((r) => member(r, byRole.get(r.id)!))}
            {now.filter((r) => !byRole.has(r.id)).map(vacancy)}
            {later.length > 0 && <>
              <div className="dsec">Spätere Epochen</div>
              {later.map((r) => (
                <div key={r.id} className="dlist-row" style={{ opacity: 0.5 }}>
                  <span className="grow">{r.name}</span><span className="meta">ab {r.unlockYear}</span>
                </div>
              ))}
            </>}
            {grp === 'trainer' && <KV k="Trainerstärke (Summe)" v={coach.strength} />}
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

